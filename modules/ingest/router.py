"""
PRAKALP-DRISHTI: INGESTION ROUTER

Dynamic project onboarding and monthly CUF upload.

    POST /api/ingest/projects        onboard one or more projects
    POST /api/ingest/upload-cuf      bulk monthly Common Upload Form
    GET  /api/ingest/jobs/{job_id}   job status
    GET  /api/ingest/jobs            recent jobs
    GET  /api/ingest/unresolved      entity names awaiting a human mapping
    GET  /api/ingest/status          whether ingestion is available at all

CONTRACT
--------
  422  the batch is invalid; the FULL error list is returned, not the first failure
  503  no database is configured -- the corpus is the read-only CSV bootstrap
  202  accepted; the write and the corpus rebuild proceed off the request path

Validation is synchronous by design. An officer submitting a malformed CUF must learn
that immediately, with every problem listed, rather than receiving a job id that fails
quietly ten seconds later.

WRITES REQUIRE `allocate_capital`
---------------------------------
Onboarding a project changes the denominator of every portfolio statistic the Cabinet
sees, so it is gated at the same level as moving capital -- not at read level. The
existing capability model is used as-is; no new role vocabulary is introduced here.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel, ConfigDict, Field

from analytics_engine import corpus_repository as repo
from analytics_engine.corpus_provenance import SOURCE_COLUMNS, build_snapshot
from analytics_engine.corpus_source import corpus_source_name, rebuild_view
from analytics_engine.ingestion import (
    REQUIRED_COLUMNS as REQUIRED_FIELDS,
    EntityResolver, load_sector_vocabulary, parse_cuf, to_revision, validate_rows,
)
from backend.auth import require
from modules.ingest.jobs import Job, registry

router = APIRouter(prefix="/api/ingest", tags=["Ingestion - Onboarding & CUF"])

MAX_CUF_BYTES = 16 * 1024 * 1024          # a monthly CUF is kilobytes; 16 MB is generous
MAX_ROWS_PER_BATCH = 5000


class ProjectRow(BaseModel):
    """
    One project as submitted. `extra='forbid'` for the same reason AllocationRequest
    forbids it: a plausible typo silently dropped is how a request gets accepted and
    quietly does something else.
    """
    model_config = ConfigDict(extra="forbid")

    ProjectId: int = Field(gt=0)
    ProjectName: str = Field(min_length=1, max_length=500)
    SectorName: str = Field(min_length=1, max_length=200)
    COMPANYNAME: str = Field(min_length=1, max_length=300)
    LineMinistry: str = Field(min_length=1, max_length=300)
    OriginalCost: float = Field(gt=0, le=10_000_000)

    StateName: Optional[str] = Field(default=None, max_length=200)
    AgencyId: Optional[int] = None
    AgencyName: Optional[str] = Field(default=None, max_length=300)
    RevisedCost: Optional[float] = Field(default=None, ge=0, le=10_000_000)
    RevisedCostReason: Optional[str] = Field(default=None, max_length=2000)
    Expenditure: Optional[float] = Field(default=None, ge=0, le=10_000_000)
    SanctionDate: Optional[str] = Field(default=None, max_length=32)
    StartDate: Optional[str] = Field(default=None, max_length=32)
    OriginalEndDate: Optional[str] = Field(default=None, max_length=32)
    RevisedDate: Optional[str] = Field(default=None, max_length=32)
    RevisedDateReason: Optional[str] = Field(default=None, max_length=2000)
    DELAYED_TIME: Optional[float] = None
    COST_OVERRUN: Optional[float] = None
    COST_OVERRUN_PERC: Optional[float] = None
    COR_PERC: Optional[float] = None
    TOR_PERC: Optional[float] = None
    PhysicalProgress: Optional[float] = Field(default=None, ge=0, le=100)
    OnboardingDelay: Optional[float] = None
    Remarks: Optional[str] = Field(default=None, max_length=4000)


class OnboardRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    projects: List[ProjectRow] = Field(min_length=1, max_length=MAX_ROWS_PER_BATCH)


def _require_database() -> None:
    if not repo.is_available():
        raise HTTPException(
            status_code=503,
            detail={
                "error": "ingestion_unavailable",
                "reason": "No DATABASE_URL is configured. The corpus is running from "
                          "the read-only CSV bootstrap, so project onboarding and CUF "
                          "upload are disabled.",
                "corpus_source": corpus_source_name(),
                "remedy": "Configure a PostgreSQL connection and apply "
                          "supabase/migrations/ to enable ingestion.",
            },
        )


def _ingest_job(rows: List[Dict[str, Any]], source: str,
                actor: Optional[str]) -> Any:
    """Background work: write, rebuild the snapshot, seal a new corpus_version."""

    def _run(job: Job) -> Dict[str, Any]:
        records = []
        for row in rows:
            prev = repo.latest_row_hash(row["ProjectId"])
            records.append(to_revision(row, prev_hash=prev,
                                       ingest_source=source, recorded_by=actor))
        written = repo.insert_revisions(records)

        # Rebuild the in-memory corpus, then seal the version its root describes. Order
        # matters: the root must be computed from what the database now holds, not from
        # what we believe we wrote.
        view = rebuild_view()
        version = repo.seal_corpus(
            corpus_root=view.corpus_root,
            row_count=view.snapshot.row_count,
            column_count=view.snapshot.column_count,
            source="postgres",
            sealed_by=actor,
        )
        return {
            "rows_written": written,
            "corpus_version": version,
            "corpus_root": view.corpus_root,
            "row_count": view.snapshot.row_count,
        }

    return _run


@router.get("/status")
def ingest_status():
    """Whether ingestion is available, and what the corpus is currently reading."""
    return {
        "module": "INGESTION",
        "corpus_source": corpus_source_name(),
        "database_configured": repo.is_available(),
        "ingestion_enabled": repo.is_available(),
        "max_rows_per_batch": MAX_ROWS_PER_BATCH,
        "max_upload_bytes": MAX_CUF_BYTES,
        "note": ("Ingestion requires a PostgreSQL corpus. Under the CSV bootstrap the "
                 "corpus is read-only and these endpoints answer 503."),
    }


@router.get("/vocabulary")
def vocabulary(user: dict = Depends(require("read_analytics"))):
    """
    The controlled vocabulary the onboarding form must offer.

    Served rather than hardcoded in the frontend deliberately. A sector list duplicated
    into JSX is a second declaration of the same fact, and the two drift -- which is
    exactly how nine of eleven hand-set sector keys came to match nothing in the corpus
    while looking entirely plausible in review. The server owns the vocabulary; the form
    renders whatever the server says.
    """
    resolver = EntityResolver()
    return {
        "sectors": sorted(load_sector_vocabulary()),
        "agencies": sorted(resolver.known_raw_names()),
        "required_fields": list(REQUIRED_FIELDS),
    }


@router.post("/validate", status_code=200)
def validate_only(req: OnboardRequest, user: dict = Depends(require("read_analytics"))):
    """
    Dry run. Applies the full validation pass and writes NOTHING.

    This is what lets the form tell an officer that their executing agency will not
    resolve BEFORE they submit, instead of after. It deliberately does not touch the
    database, so it works under the CSV bootstrap too -- the rules are the same either
    way; only the duplicate-id check needs the corpus, and it is skipped when absent.
    """
    known = repo.known_project_ids() if repo.is_available() else None
    report = validate_rows(
        [p.model_dump() for p in req.projects],
        sector_vocabulary=load_sector_vocabulary(),
        resolver=EntityResolver(),
        known_project_ids=known,
    )
    return {
        "valid": report.ok,
        "checked_against_corpus": known is not None,
        **report.as_dict(),
    }


@router.post("/projects", status_code=202)
def onboard_projects(req: OnboardRequest, user: dict = Depends(require("allocate_capital"))):
    _require_database()

    rows = [p.model_dump() for p in req.projects]
    report = validate_rows(
        rows,
        sector_vocabulary=load_sector_vocabulary(),
        resolver=EntityResolver(),
        known_project_ids=repo.known_project_ids(),
    )

    if report.unresolved_entities:
        repo.queue_unresolved_entities(report.unresolved_entities)

    if not report.ok:
        raise HTTPException(status_code=422, detail={
            "error": "validation_failed",
            "reason": "No rows were written. Correct the errors and resubmit.",
            **report.as_dict(),
        })

    actor = user.get("username") if isinstance(user, dict) else None
    job = registry.submit("onboard_projects",
                          _ingest_job(report.accepted, "api", actor),
                          submitted_by=actor)
    return {
        "accepted": True,
        "job_id": job.job_id,
        "rows_accepted": len(report.accepted),
        "status_url": f"/api/ingest/jobs/{job.job_id}",
    }


@router.post("/upload-cuf", status_code=202)
def upload_cuf(file: UploadFile = File(...),
               user: dict = Depends(require("allocate_capital"))):
    _require_database()

    content = file.file.read(MAX_CUF_BYTES + 1)
    if len(content) > MAX_CUF_BYTES:
        raise HTTPException(status_code=413, detail={
            "error": "file_too_large",
            "reason": f"CUF uploads are limited to {MAX_CUF_BYTES} bytes.",
        })
    if not content:
        raise HTTPException(status_code=422, detail={
            "error": "empty_file", "reason": "The uploaded file contained no bytes."})

    try:
        rows, meta = parse_cuf(content, file.filename or "")
    except ValueError as exc:
        raise HTTPException(status_code=422, detail={
            "error": "unparseable_cuf", "reason": str(exc)})

    if len(rows) > MAX_ROWS_PER_BATCH:
        raise HTTPException(status_code=422, detail={
            "error": "batch_too_large",
            "reason": f"{len(rows)} rows exceeds the {MAX_ROWS_PER_BATCH}-row limit.",
        })

    report = validate_rows(
        rows,
        sector_vocabulary=load_sector_vocabulary(),
        resolver=EntityResolver(),
        known_project_ids=repo.known_project_ids(),
    )

    if report.unresolved_entities:
        repo.queue_unresolved_entities(report.unresolved_entities)

    if not report.ok:
        raise HTTPException(status_code=422, detail={
            "error": "validation_failed",
            "reason": "No rows were written. The whole batch is rejected so the corpus "
                      "never holds a partially-applied monthly return.",
            "parse": meta,
            **report.as_dict(),
        })

    actor = user.get("username") if isinstance(user, dict) else None
    job = registry.submit("upload_cuf",
                          _ingest_job(report.accepted, "cuf-upload", actor),
                          submitted_by=actor)
    return {
        "accepted": True,
        "job_id": job.job_id,
        "rows_accepted": len(report.accepted),
        "parse": meta,
        "status_url": f"/api/ingest/jobs/{job.job_id}",
    }


@router.get("/jobs/{job_id}")
def job_status(job_id: str, user: dict = Depends(require("read_analytics"))):
    job = registry.get(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail={
            "error": "unknown_job",
            "reason": "No such job. Job history is in-process and does not survive a "
                      "restart.",
        })
    return job.as_dict()


@router.get("/jobs")
def recent_jobs(limit: int = 20, user: dict = Depends(require("read_analytics"))):
    return {"jobs": registry.recent(max(1, min(limit, 100)))}


@router.get("/unresolved")
def unresolved_entities(limit: int = 200,
                        user: dict = Depends(require("read_analytics"))):
    """
    COMPANYNAME strings that did not resolve to a canonical entity.

    These rows were REJECTED, not defaulted. An unmapped agency silently taking the
    pooled multiplier is the defect that made 32% of the portfolio invisible to the
    sector table, and it is not reintroduced through the onboarding path.
    """
    _require_database()
    return {"unresolved": repo.unresolved_queue(max(1, min(limit, 1000)))}
