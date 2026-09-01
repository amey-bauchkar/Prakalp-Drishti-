"""
PRAKALP-DRISHTI: MILESTONE & TEMPORAL AUDIT ROUTER (KAAL-DARPAN)

    POST /api/ingest/projects/{id}/milestones   file a statutory progress report
    GET  /api/ingest/projects/{id}/timeline     milestones bound to dated observations
    GET  /api/ingest/milestone-types            the controlled vocabulary

WHAT THE TIMELINE RETURNS, AND WHAT IT REFUSES TO
--------------------------------------------------
Each milestone carries an EVIDENCE verdict, not a completion figure and not a fraud
score. Surface change and reported progress correlate at r = 0.007 in this corpus, so
no satellite-derived progress percentage is computed and no claimed-minus-detected
discrepancy exists anywhere in this module.

The one verdict that asks for action, NO_ACTIVITY_DETECTED, recommends a physical
inspection. It is scoped to projects whose works are actually visible to a nadir optical
sensor, so a bored tunnel is never accused of invisibility that is the sensor's
limitation rather than the contractor's.

Filing a report requires `allocate_capital`, the same gate as onboarding: a progress
claim moves the portfolio statistics the Cabinet reads.
"""

from __future__ import annotations

from datetime import date
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field

from analytics_engine import corpus_repository as repo
from analytics_engine.corpus_source import corpus_source_name, load_corpus
from analytics_engine.merkle import mth_leaf
from analytics_engine.temporal_audit import (
    MILESTONE_TYPES, ImageryEpoch, Milestone, _parse_date, build_timeline,
    surface_change_expected,
)
from backend.auth import require

router = APIRouter(prefix="/api/ingest", tags=["Ingestion - Milestones & Timeline"])


class MilestoneIn(BaseModel):
    """One statutory progress report. `extra='forbid'` for the usual reason."""
    model_config = ConfigDict(extra="forbid")

    update_date: str = Field(min_length=8, max_length=32)
    claimed_progress_pct: Optional[float] = Field(default=None, ge=0, le=100)
    cumulative_expenditure_cr: Optional[float] = Field(default=None, ge=0, le=10_000_000)
    milestone_type: str = Field(default="MONTHLY_PROGRESS")
    remarks: Optional[str] = Field(default=None, max_length=2000)


# Postgres SQLSTATE 42P01 = undefined_table. Reaching this means the code is deployed
# but migration 0006 has not been applied -- a deployment-order problem, not a bug, and
# the operator needs to be told which file to run rather than shown a 500.
_UNDEFINED_TABLE_MARKERS = ("42P01", "undefined_table", "does not exist")


def _missing_migration(exc: Exception) -> bool:
    msg = f"{getattr(exc, 'sqlstate', '')} {exc}".lower()
    return any(m.lower() in msg for m in _UNDEFINED_TABLE_MARKERS) and (
        "project_milestones" in msg or "project_imagery_epochs" in msg
        or "42p01" in msg)


def _migration_needed() -> HTTPException:
    return HTTPException(status_code=503, detail={
        "error": "migration_not_applied",
        "reason": "The milestone tables do not exist in this database.",
        "remedy": "Apply supabase/migrations/0006_project_milestones.sql, then retry.",
    })


def _require_database() -> None:
    if not repo.is_available():
        raise HTTPException(status_code=503, detail={
            "error": "milestones_unavailable",
            "reason": "No DATABASE_URL is configured. The corpus is running from the "
                      "read-only CSV bootstrap, so progress reports cannot be filed.",
            "corpus_source": corpus_source_name(),
            "remedy": "Apply supabase/migrations/0006_project_milestones.sql and "
                      "configure DATABASE_URL.",
        })


def _project_identity(pid: str) -> Dict[str, Optional[str]]:
    """Sector and name drive surface-visibility, so they come from the corpus."""
    try:
        df = load_corpus()
        row = df[df["ProjectId"].astype(str) == str(pid)]
        if row.empty:
            return {"sector": None, "project_name": None}
        r = row.iloc[0]
        def _s(v):
            if v is None or (isinstance(v, float) and v != v):
                return None
            return str(v).strip() or None
        return {"sector": _s(r.get("SectorName")),
                "project_name": _s(r.get("ProjectName"))}
    except Exception:
        return {"sector": None, "project_name": None}


@router.get("/milestone-types")
def milestone_types(user: dict = Depends(require("read_analytics"))):
    return {"milestone_types": list(MILESTONE_TYPES)}


@router.post("/projects/{project_id}/milestones", status_code=201)
def file_milestone(project_id: str, body: MilestoneIn,
                   user: dict = Depends(require("allocate_capital"))):
    _require_database()

    parsed = _parse_date(body.update_date)
    if parsed is None:
        raise HTTPException(status_code=422, detail={
            "error": "bad_date",
            "reason": f"'{body.update_date}' is not a recognisable date. "
                      "Use ISO YYYY-MM-DD or DD/MM/YYYY."})
    if parsed > date.today():
        raise HTTPException(status_code=422, detail={
            "error": "future_date",
            "reason": "A progress report cannot be dated in the future."})
    if body.milestone_type not in MILESTONE_TYPES:
        raise HTTPException(status_code=422, detail={
            "error": "unknown_milestone_type",
            "reason": f"'{body.milestone_type}' is not a recognised milestone type.",
            "allowed": list(MILESTONE_TYPES)})

    try:
        known = repo.known_project_ids()
    except repo.DatabaseUnavailable as exc:
        raise HTTPException(status_code=503, detail={"error": "database_unavailable",
                                                     "reason": str(exc)})
    if str(project_id) not in known:
        raise HTTPException(status_code=404, detail={
            "error": "unknown_project",
            "reason": f"Project {project_id} is not in the corpus. Onboard it first."})

    actor = user.get("username") if isinstance(user, dict) else None

    # Same tamper-evident chaining as the corpus ledger: a revised claim cannot quietly
    # replace an earlier one, because the earlier row_hash is the new row's predecessor.
    canonical = (f"{project_id}|{parsed.isoformat()}|{body.claimed_progress_pct}|"
                 f"{body.cumulative_expenditure_cr}|{body.milestone_type}")
    prev = repo.latest_milestone_hash(project_id)

    try:
        new_id = repo.insert_milestone({
            "project_id": int(project_id),
            "update_date": parsed,
            "claimed_progress_pct": body.claimed_progress_pct,
            "cumulative_expenditure_cr": body.cumulative_expenditure_cr,
            "milestone_type": body.milestone_type,
            "remarks": body.remarks,
            "recorded_by": actor,
            "row_hash": mth_leaf(canonical),
            "prev_hash": prev,
        })
    except Exception as exc:
        msg = str(exc)
        if "project_milestones_unique_day" in msg or "duplicate key" in msg.lower():
            raise HTTPException(status_code=409, detail={
                "error": "duplicate_milestone",
                "reason": "A report of this type already exists for this project on "
                          "this date. File a revision under a different date rather "
                          "than overwriting the record."})
        if _missing_migration(exc):
            raise _migration_needed()
        raise HTTPException(status_code=500, detail={
            "error": "milestone_write_failed",
            "reason": f"{type(exc).__name__}: {exc}"})

    return {"filed": True, "milestone_id": str(new_id),
            "project_id": str(project_id),
            "update_date": parsed.isoformat(),
            "timeline_url": f"/api/ingest/projects/{project_id}/timeline"}


@router.get("/projects/{project_id}/timeline")
def project_timeline(project_id: str, user: dict = Depends(require("read_analytics"))):
    """
    Milestones bound to the imagery intervals that actually exist.

    Sites are reflown roughly annually while MPRs are monthly, so most reports
    legitimately share one interval or fall outside any. That is reported as
    NO_IMAGERY_FOR_INTERVAL rather than being papered over.
    """
    _require_database()

    ident = _project_identity(project_id)

    try:
        raw_ms = repo.milestones_for(project_id)
        raw_ep = repo.epochs_for(project_id)
    except repo.DatabaseUnavailable as exc:
        raise HTTPException(status_code=503, detail={"error": "database_unavailable",
                                                     "reason": str(exc)})
    except Exception as exc:
        if _missing_migration(exc):
            raise _migration_needed()
        raise

    milestones = [Milestone(
        milestone_id=m["milestone_id"], project_id=str(project_id),
        update_date=_parse_date(m["update_date"]),
        claimed_progress_pct=m["claimed_progress_pct"],
        milestone_type=m["milestone_type"],
        cumulative_expenditure_cr=m["cumulative_expenditure_cr"],
        recorded_by=m["recorded_by"]) for m in raw_ms]

    epochs = [ImageryEpoch(
        epoch_id=e["epoch_id"], captured=_parse_date(e["captured"]),
        vintage_label=e["vintage_label"], tile_path=e["tile_path"],
        wayback_release=e["wayback_release"],
        surface_change_pct=e["surface_change_pct"]) for e in raw_ep]

    timeline = build_timeline(milestones, epochs,
                              sector=ident["sector"],
                              project_name=ident["project_name"])

    return {"project_id": str(project_id),
            "project_name": ident["project_name"],
            "sector": ident["sector"],
            **timeline}
