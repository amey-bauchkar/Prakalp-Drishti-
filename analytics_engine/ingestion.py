"""
PRAKALP-DRISHTI: INGESTION — VALIDATION, ENTITY RESOLUTION, CUF NORMALISATION

Everything that must happen to a row BEFORE it is allowed into the append-only ledger.
Pure functions over data; no database, no HTTP. That is deliberate -- the rules that
decide whether a government project may enter the corpus should be testable without
provisioning anything.

WHY ENTITY RESOLUTION IS ENFORCED AT WRITE TIME
-----------------------------------------------
This is the non-negotiable part of the whole ingestion path, and it exists because the
exact failure it prevents has already happened once in this codebase.

KAAL-CHAKRA's executing-entity multipliers are keyed by CANONICAL_ENTITY ("AAI"). A row
whose COMPANYNAME does not resolve falls to OTHER_UNSPECIFIED and silently takes the
pooled default. Nothing errors. Nothing logs. The forecast still renders, with a number
that looks exactly as authoritative as a fitted one. The hand-set sector table failed
this way for 20 of 22 sectors -- 32% of the portfolio -- and it took a line-by-line audit
to notice, because a plausible wrong number is indistinguishable from a right one at the
UI layer.

So an unresolved COMPANYNAME is a REJECTED ROW that goes to a human queue. It is never
defaulted, never coerced, never quietly accepted. An officer onboarding a project with a
new agency gets told so; they do not get a forecast computed against a multiplier that
does not apply to them.

The same reasoning governs sector: it is FK-constrained in Postgres, and validated here
so the caller gets a precise 422 rather than a foreign-key violation surfaced as a 500.
"""

from __future__ import annotations

import io
import json
import os
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple

import pandas as pd

from analytics_engine.corpus_provenance import (
    SOURCE_COLUMNS, _canonical_value, canonical_row, row_hash,
)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENTITY_MAPPING_PATH = os.path.join(BASE_DIR, "paimana_extracted",
                                   "CANONICAL_ENTITIES_MAPPING.json")
CSV_PATH = os.path.join(BASE_DIR, "paimana_extracted",
                        "PAIMANA_MASTER_PROJECTS_DATABASE.csv")

UNRESOLVED = "OTHER_UNSPECIFIED"

# Columns an onboarding request must carry. The rest may be null -- seven columns are
# 0/2207 populated in the bootstrap corpus itself, so demanding them would reject rows
# MoSPI's own data could not satisfy.
REQUIRED_COLUMNS = ("ProjectId", "ProjectName", "SectorName", "COMPANYNAME",
                    "LineMinistry", "OriginalCost")

# MoSPI's monthly Common Upload Form does not use the corpus's internal column names.
# Header matching is case- and separator-insensitive, and these aliases cover the
# spellings seen in published CUF workbooks.
CUF_ALIASES: Dict[str, str] = {
    "projectid": "ProjectId", "project_id": "ProjectId", "projectcode": "ProjectId",
    "projectname": "ProjectName", "nameofproject": "ProjectName",
    "sector": "SectorName", "sectorname": "SectorName",
    "state": "StateName", "statename": "StateName",
    "ministry": "LineMinistry", "lineministry": "LineMinistry",
    "agency": "COMPANYNAME", "executingagency": "COMPANYNAME",
    "company": "COMPANYNAME", "companyname": "COMPANYNAME",
    "agencyid": "AgencyId", "agencyname": "AgencyName",
    "originalcost": "OriginalCost", "sanctionedcost": "OriginalCost",
    "revisedcost": "RevisedCost", "latestapprovedcost": "RevisedCost",
    "expenditure": "Expenditure", "expenditureincurred": "Expenditure",
    "sanctiondate": "SanctionDate", "dateofsanction": "SanctionDate",
    "startdate": "StartDate",
    "originalenddate": "OriginalEndDate", "originalcompletiondate": "OriginalEndDate",
    "reviseddate": "RevisedDate", "revisedcompletiondate": "RevisedDate",
    "physicalprogress": "PhysicalProgress", "physicalprogresspercent": "PhysicalProgress",
    "delayedtime": "DELAYED_TIME", "delaymonths": "DELAYED_TIME",
    "costoverrun": "COST_OVERRUN", "costoverrunperc": "COST_OVERRUN_PERC",
    "remarks": "Remarks", "revisedcostreason": "RevisedCostReason",
    "reviseddatereason": "RevisedDateReason",
    "onboardingdelay": "OnboardingDelay",
    "corperc": "COR_PERC", "torperc": "TOR_PERC",
}


def _norm_header(h: str) -> str:
    return "".join(ch for ch in str(h).lower() if ch.isalnum())


# ---------------------------------------------------------------------------------
# Controlled vocabulary
# ---------------------------------------------------------------------------------

def load_sector_vocabulary(csv_path: str = CSV_PATH) -> set:
    """Sectors the corpus actually contains, canonicalised as the hash sees them."""
    df = pd.read_csv(csv_path, usecols=["SectorName"])
    return {_canonical_value(s) for s in df["SectorName"].dropna().unique()}


class EntityResolver:
    """Raw COMPANYNAME -> canonical_id, resolved exactly as the engines resolve it."""

    def __init__(self, mapping_path: str = ENTITY_MAPPING_PATH):
        self._by_raw: Dict[str, str] = {}
        if os.path.exists(mapping_path):
            with open(mapping_path, encoding="utf-8") as f:
                payload = json.load(f)
            for raw, rec in (payload.get("mapping_by_raw_string") or {}).items():
                if isinstance(rec, dict):
                    self._by_raw[raw] = str(rec.get("canonical_id", UNRESOLVED))

    def __len__(self) -> int:
        return len(self._by_raw)

    def resolve(self, raw_name: Any) -> Tuple[Optional[str], str]:
        """
        Returns (canonical_id, status) where status is 'resolved' | 'unresolved'.

        Note what this does NOT do: it never returns OTHER_UNSPECIFIED as though it were
        an answer. An unknown agency is an unresolved row for a human to map, because a
        forecast computed against the pooled default would be wrong in a way the officer
        reading it could not detect.
        """
        key = _canonical_value(raw_name)
        if key is None:
            return None, "unresolved"
        cid = self._by_raw.get(str(key))
        if cid is None or cid == UNRESOLVED:
            return None, "unresolved"
        return cid, "resolved"


# ---------------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------------

@dataclass
class RowError:
    row_index: int
    project_id: Optional[Any]
    field_name: str
    reason: str

    def as_dict(self) -> Dict[str, Any]:
        return {"row_index": self.row_index, "project_id": self.project_id,
                "field": self.field_name, "reason": self.reason}


@dataclass
class ValidationReport:
    accepted: List[Dict[str, Any]] = field(default_factory=list)
    errors: List[RowError] = field(default_factory=list)
    unresolved_entities: Dict[str, int] = field(default_factory=dict)

    @property
    def ok(self) -> bool:
        return not self.errors

    def as_dict(self) -> Dict[str, Any]:
        return {
            "accepted_rows": len(self.accepted),
            "rejected_rows": len(self.errors),
            "errors": [e.as_dict() for e in self.errors[:100]],
            "error_count": len(self.errors),
            "unresolved_entities": self.unresolved_entities,
        }


def validate_rows(rows: List[Dict[str, Any]],
                  sector_vocabulary: Optional[set] = None,
                  resolver: Optional[EntityResolver] = None,
                  known_project_ids: Optional[set] = None) -> ValidationReport:
    """
    Validate a batch. Every row is checked; the first failure does not stop the pass,
    because an officer uploading a 500-row CUF needs the whole list of problems, not the
    first one.
    """
    vocab = sector_vocabulary if sector_vocabulary is not None else load_sector_vocabulary()
    res = resolver or EntityResolver()
    report = ValidationReport()
    seen_ids: set = set()

    # Compare project ids as STRINGS on both sides. The repository returns them as
    # str(project_id) out of Postgres while _canonical_value renders them as int, so a
    # naive membership test silently never matched -- and an already-onboarded project
    # would have been accepted a second time, forking its hash chain.
    known = {str(k) for k in (known_project_ids or ())}

    for i, raw in enumerate(rows):
        row = {c: raw.get(c) for c in SOURCE_COLUMNS}
        errs: List[RowError] = []
        pid = _canonical_value(row.get("ProjectId"))

        for col in REQUIRED_COLUMNS:
            if _canonical_value(row.get(col)) is None:
                errs.append(RowError(i, pid, col, "required field is missing or empty"))

        if pid is not None:
            try:
                int(pid)
            except (TypeError, ValueError):
                errs.append(RowError(i, pid, "ProjectId", "must be an integer"))
            key = str(pid)
            if key in seen_ids:
                errs.append(RowError(i, pid, "ProjectId", "duplicate within this batch"))
            seen_ids.add(key)
            if known and key in known:
                errs.append(RowError(i, pid, "ProjectId",
                                     "project already exists; submit a revision instead"))

        sector = _canonical_value(row.get("SectorName"))
        if sector is not None and sector not in vocab:
            errs.append(RowError(i, pid, "SectorName",
                                 f"'{sector}' is not in the controlled vocabulary"))

        cost = _canonical_value(row.get("OriginalCost"))
        if cost is not None:
            try:
                if float(cost) <= 0:
                    errs.append(RowError(i, pid, "OriginalCost", "must be greater than zero"))
            except (TypeError, ValueError):
                errs.append(RowError(i, pid, "OriginalCost", "must be numeric"))

        progress = _canonical_value(row.get("PhysicalProgress"))
        if progress is not None:
            try:
                if not (0.0 <= float(progress) <= 100.0):
                    errs.append(RowError(i, pid, "PhysicalProgress",
                                         "must be between 0 and 100"))
            except (TypeError, ValueError):
                errs.append(RowError(i, pid, "PhysicalProgress", "must be numeric"))

        raw_company = row.get("COMPANYNAME")
        canonical_id, status = res.resolve(raw_company)
        if status == "unresolved" and _canonical_value(raw_company) is not None:
            name = str(_canonical_value(raw_company))
            report.unresolved_entities[name] = report.unresolved_entities.get(name, 0) + 1
            errs.append(RowError(i, pid, "COMPANYNAME",
                                 f"'{name}' does not resolve to a canonical entity; "
                                 "queued for mapping rather than defaulted"))

        if errs:
            report.errors.extend(errs)
        else:
            row["_canonical_entity"] = canonical_id
            report.accepted.append(row)

    return report


# ---------------------------------------------------------------------------------
# CUF normalisation
# ---------------------------------------------------------------------------------

def normalise_cuf_headers(columns: List[str]) -> Dict[str, str]:
    """Map a CUF workbook's headers onto corpus column names."""
    out: Dict[str, str] = {}
    for c in columns:
        n = _norm_header(c)
        if c in SOURCE_COLUMNS:
            out[c] = c
        elif n in CUF_ALIASES:
            out[c] = CUF_ALIASES[n]
    return out


def parse_cuf(content: bytes, filename: str = "") -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    """
    Parse a Common Upload Form into corpus-shaped rows.

    CSV is handled natively. XLSX needs openpyxl, which is deliberately NOT added to the
    pinned requirements: every dependency has to be mirrored into the offline wheelhouse
    for an air-gapped install, and a spreadsheet reader is a poor trade for that when
    MoSPI can export CSV. If a workbook arrives, the caller is told exactly that rather
    than getting an opaque parser error.
    """
    name = (filename or "").lower()
    if name.endswith((".xlsx", ".xls")):
        try:
            import openpyxl                                   # noqa: F401
        except ImportError:
            raise ValueError(
                "XLSX ingestion requires the optional 'openpyxl' package, which is not "
                "part of the air-gapped dependency set. Export the CUF as CSV and "
                "re-upload."
            )
        df = pd.read_excel(io.BytesIO(content))
    else:
        df = pd.read_csv(io.BytesIO(content))

    mapping = normalise_cuf_headers(list(df.columns))
    if not mapping:
        raise ValueError(
            "No recognisable CUF columns. Expected headers such as ProjectId, "
            "ProjectName, Sector, Executing Agency, Original Cost."
        )

    df = df.rename(columns=mapping)
    keep = [c for c in df.columns if c in SOURCE_COLUMNS]
    df = df[keep]

    rows = [{c: r.get(c) for c in SOURCE_COLUMNS} for r in df.to_dict(orient="records")]
    meta = {
        "parsed_rows": len(rows),
        "recognised_columns": sorted(set(mapping.values())),
        "ignored_columns": sorted(set(mapping) ^ set(df.columns) & set(mapping)),
        "unmapped_headers": sorted(c for c in mapping if False),
    }
    return rows, meta


# ---------------------------------------------------------------------------------
# Ledger records
# ---------------------------------------------------------------------------------

def to_revision(row: Dict[str, Any], prev_hash: Optional[str] = None,
                ingest_source: str = "api",
                recorded_by: Optional[str] = None) -> Dict[str, Any]:
    """A validated row plus its tamper-evident chain fields, ready for the ledger."""
    clean = {c: row.get(c) for c in SOURCE_COLUMNS}
    rec = dict(clean)
    rec["row_hash"] = row_hash(clean)
    rec["prev_hash"] = prev_hash
    rec["ingest_source"] = ingest_source
    rec["recorded_by"] = recorded_by
    rec["canonical_json"] = canonical_row(clean)
    return rec
