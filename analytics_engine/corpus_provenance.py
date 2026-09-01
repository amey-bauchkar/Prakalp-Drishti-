"""
PRAKALP-DRISHTI: CORPUS PROVENANCE — CONTENT-ADDRESSED dataset_hash

Replaces `sha256(csv_file_bytes)` with an RFC 6962 Merkle root computed over canonically
serialised ROWS, so the corpus identity survives the move off a flat file.

The problem this replaces
-------------------------
KAAL-CHAKRA identified the corpus as

    self.dataset_hash = hashlib.sha256(f.read()).hexdigest()    # bytes of the CSV

and that value is embedded in every Fact's lineage and in every Merkle-signed Cabinet
briefing. It is the thing that makes "the briefing you are reading is the briefing that
was signed" a checkable statement rather than a slogan.

It also assumes a file. The moment projects live in Postgres and officers can onboard
new ones, THERE IS NO FILE TO HASH. Hashing whatever `SELECT *` happens to return would
be worse than useless: the value would change on row reordering, on an unrelated column
being added, on a dtype coercion -- and a briefing signed on Tuesday could not be
re-verified on Wednesday. A cryptographic guarantee would have quietly degraded into a
timestamp, and nobody reading the output could tell.

What this computes instead
--------------------------
    leaf_i      = canonical JSON of row i, over the SOURCE columns only
    corpus_root = RFC 6962 MTH over leaves sorted by (ProjectId, revision_id)

The root is therefore a CONTENT ADDRESS: the same logical corpus yields the same root
whatever produced it -- CSV today, Postgres tomorrow, a Parquet export in between. Two
deployments agree iff they hold the same data. That is a strictly stronger property than
the file hash had, because the file hash also changed when the file was merely rewritten
with different line endings.

Canonicalisation, and why each rule is needed
---------------------------------------------
The hash must not move when the STORAGE moves. Every rule below exists because some
representation detail differs between pandas-over-CSV and a SQL driver:

  * COLUMN ORDER ignored -- keys are sorted. A migration that reorders columns is not a
    change of data.
  * ROW ORDER ignored -- leaves are sorted by (ProjectId, revision_id) before hashing.
    Postgres makes no ordering promise without ORDER BY.
  * NUMERIC WIDTH normalised -- pandas types a column int64 or float64 depending on
    whether a NaN is present anywhere in it, so the same project reads as 500 from one
    file and 500.0 from another. Integral values render without a decimal point.
  * MISSING VALUES unified -- NaN, None, NaT and empty string all render as JSON null.
    SQL NULL and pandas NaN are the same fact about the world.
  * TEXT normalised -- NFC Unicode normalisation and whitespace stripping, because
    Devanagari project names round-trip through different encodings in the two paths.
  * DATES rendered as ISO-8601 DATE, not datetime. The corpus records days; a driver
    that attaches 00:00:00 has not added information.
  * FLOAT precision pinned to 6 decimal places, below which the corpus carries no
    meaning anyway, so binary float64 jitter cannot move the root.

Only SOURCE columns are hashed. Derived quantities (TrueCostOverrunCr,
BaselineResetCount, CANONICAL_ENTITY and so on) are recomputed downstream from these and
are deliberately excluded -- a change to derivation logic is a change to the MODEL, which
`model_hash` already covers, not a change to the corpus.

Versioning
----------
`corpus_version` is a monotonically increasing integer identifying an accepted state of
the corpus. Under CSV bootstrap it is 1. Under Postgres it becomes the batch id, and a
briefing pins the version it was computed against so an auditor can replay exactly that
state rather than "whatever is current".

Storage-agnostic by construction: this module never imports a database driver. It takes
a DataFrame. Where the DataFrame came from is not its concern, which is what lets Phase 1
land and be verified with no database in existence.
"""

from __future__ import annotations

import json
import math
import os
import re
import unicodedata
from dataclasses import dataclass, asdict
from typing import Any, Dict, List, Optional

import pandas as pd

from analytics_engine.merkle import mth, mth_leaf

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SNAPSHOT_PATH = os.path.join(BASE_DIR, "artifacts", "corpus_snapshot.json")

# The persisted source schema. Derived columns are deliberately absent -- see module
# docstring. Sorted, so the leaf encoding cannot depend on declaration order.
SOURCE_COLUMNS: List[str] = sorted([
    "ProjectId", "ProjectName", "SectorName", "StateName", "LineMinistry",
    "COMPANYNAME", "AgencyId", "AgencyName",
    "OriginalCost", "RevisedCost", "RevisedCostReason", "Expenditure",
    "SanctionDate", "StartDate", "OriginalEndDate", "RevisedDate", "RevisedDateReason",
    "DELAYED_TIME", "COST_OVERRUN", "COST_OVERRUN_PERC", "COR_PERC", "TOR_PERC",
    "PhysicalProgress", "OnboardingDelay", "Remarks",
])

# ── SQL COLUMN CONTRACT ──────────────────────────────────────────────────────
# Corpus column -> Postgres column. Declared ONCE, here, and asserted against the DDL in
# supabase/migrations/0001_corpus_schema.sql by tests/test_corpus_schema.py.
#
# Postgres gets snake_case because PostgREST exposes column names directly in the REST
# API, and quoted CamelCase identifiers make every downstream query and filter hostile.
# The cost of that choice is a mapping, and a mapping is a drift point -- which is
# precisely the shape of the defect that let nine of eleven sector keys silently match
# nothing. The test closes it: the map must be total over SOURCE_COLUMNS, injective, and
# exactly equal to the columns the migration actually declares.
COLUMN_MAP: Dict[str, str] = {
    "ProjectId": "project_id",
    "ProjectName": "project_name",
    "SectorName": "sector_name",
    "StateName": "state_name",
    "LineMinistry": "line_ministry",
    "COMPANYNAME": "companyname",
    "AgencyId": "agency_id",
    "AgencyName": "agency_name",
    "OriginalCost": "original_cost",
    "RevisedCost": "revised_cost",
    "RevisedCostReason": "revised_cost_reason",
    "Expenditure": "expenditure",
    "SanctionDate": "sanction_date",
    "StartDate": "start_date",
    "OriginalEndDate": "original_end_date",
    "RevisedDate": "revised_date",
    "RevisedDateReason": "revised_date_reason",
    "DELAYED_TIME": "delayed_time",
    "COST_OVERRUN": "cost_overrun",
    "COST_OVERRUN_PERC": "cost_overrun_perc",
    "COR_PERC": "cor_perc",
    "TOR_PERC": "tor_perc",
    "PhysicalProgress": "physical_progress",
    "OnboardingDelay": "onboarding_delay",
    "Remarks": "remarks",
}

# Below this the corpus carries no meaning; pinning it stops float64 jitter from moving
# the root between a CSV parse and a NUMERIC column.
FLOAT_PLACES = 6

BOOTSTRAP_VERSION = 1

# DD/MM/YYYY as MoSPI publishes it. Day-first is asserted, not guessed: the rest of the
# codebase parses this corpus with dayfirst=True.
_DMY_RE = re.compile(r"^\d{1,2}/\d{1,2}/\d{4}$")


# ---------------------------------------------------------------------------------
# Canonical value rendering
# ---------------------------------------------------------------------------------

def _canonical_value(v: Any) -> Any:
    """One scalar, rendered so storage cannot change it."""
    if v is None:
        return None
    # pandas NaT / NaN / pd.NA
    try:
        if v is pd.NaT or (isinstance(v, float) and math.isnan(v)):
            return None
        if pd.isna(v):
            return None
    except (TypeError, ValueError):
        pass

    if isinstance(v, (pd.Timestamp,)):
        return v.date().isoformat()

    if isinstance(v, bool):
        return v

    if isinstance(v, (int,)) and not isinstance(v, bool):
        return int(v)

    if isinstance(v, float):
        if math.isinf(v):
            return None
        r = round(v, FLOAT_PLACES)
        # 500.0 and 500 are the same figure; render both as 500.
        if r == int(r):
            return int(r)
        return float(r)

    s = str(v).strip()
    if s == "" or s.lower() in {"nan", "nat", "none", "null"}:
        return None
    s = unicodedata.normalize("NFC", s)

    # ── DATE NORMALISATION ───────────────────────────────────────────────────
    # Every date reaching this function must collapse to one ISO-8601 spelling,
    # because the SAME date arrives in three different forms depending on storage:
    #
    #     CSV        "13/07/2024"            (DD/MM/YYYY text, as MoSPI publishes it)
    #     Postgres   date(2024, 7, 13)       -> "2024-07-13"
    #     driver     "2024-07-13 00:00:00"   (a timestamp with a zero time)
    #
    # Without this the corpus root computed from the CSV would NOT equal the root
    # computed from Postgres holding identical data, and every briefing signed before
    # the migration would fail verification after it -- the precise failure this whole
    # module exists to prevent.
    #
    # Day-first, not month-first: the corpus is Indian government data and the rest of
    # this codebase parses it with dayfirst=True. Reading 13/07 as a month would be
    # silently wrong for the 12 days a year where both readings are valid.
    if len(s) == 19 and s[4] == "-" and s[7] == "-" and s[10] in " T":
        return s[:10]
    if len(s) == 10 and s[4] == "-" and s[7] == "-":
        return s                                    # already ISO
    if _DMY_RE.match(s):
        d, m, y = s.split("/")
        try:
            dd, mm, yy = int(d), int(m), int(y)
            if 1 <= mm <= 12 and 1 <= dd <= 31:
                return f"{yy:04d}-{mm:02d}-{dd:02d}"
        except ValueError:
            pass
    return s


def canonical_row(row: Dict[str, Any], columns: Optional[List[str]] = None) -> str:
    """RFC 8785-style canonical JSON for one row: sorted keys, no insignificant space."""
    cols = columns if columns is not None else SOURCE_COLUMNS
    payload = {c: _canonical_value(row.get(c)) for c in cols}
    return json.dumps(payload, sort_keys=True, separators=(",", ":"),
                      ensure_ascii=False, allow_nan=False)


# ---------------------------------------------------------------------------------
# Corpus root
# ---------------------------------------------------------------------------------

def _present_columns(df: pd.DataFrame) -> List[str]:
    """Source columns actually present, so a partial frame still hashes deterministically."""
    return [c for c in SOURCE_COLUMNS if c in df.columns]


def canonical_leaves(df: pd.DataFrame) -> List[str]:
    """Canonical row strings, ordered by (ProjectId, revision_id) -- never by frame order."""
    cols = _present_columns(df)
    sort_keys = [c for c in ("ProjectId", "revision_id") if c in df.columns]

    work = df.copy()
    if sort_keys:
        # Sort on STRING keys so 400188 orders identically whether the driver typed the
        # id as int64, object or NUMERIC.
        for k in sort_keys:
            work[f"__sort_{k}"] = work[k].map(lambda x: str(_canonical_value(x) or ""))
        work = work.sort_values([f"__sort_{k}" for k in sort_keys], kind="mergesort")

    return [canonical_row(rec, cols) for rec in work.to_dict(orient="records")]


def compute_corpus_root(df: pd.DataFrame) -> str:
    """RFC 6962 Merkle root over the canonical rows. This is the dataset_hash."""
    return mth([mth_leaf(leaf) for leaf in canonical_leaves(df)])


# ---------------------------------------------------------------------------------
# Snapshot record
# ---------------------------------------------------------------------------------

def row_hash(row: Dict[str, Any], columns: Optional[List[str]] = None) -> str:
    """RFC 6962 leaf hash of one row -- the value stored in project_revisions.row_hash."""
    return mth_leaf(canonical_row(row, columns))


def verify_chain(revisions: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Walk one project's revisions oldest-first and confirm the prev_hash chain is intact.

    This is the layer that survives an actor with enough privilege to drop the
    append-only trigger. REVOKE and the trigger PREVENT tampering; the chain makes it
    DETECTABLE, and detection is the property an auditor can verify independently
    without trusting the database's configuration at all.

    Each revision is expected to carry `row_hash` and `prev_hash`. Returns
    {"ok": bool, "checked": int, "broken_at": revision_id|None, "reason": str|None}.
    """
    prev: Optional[str] = None
    for i, rev in enumerate(revisions):
        declared_prev = rev.get("prev_hash")
        if i == 0:
            if declared_prev is not None:
                return {"ok": False, "checked": i, "broken_at": rev.get("revision_id"),
                        "reason": "genesis revision declares a predecessor"}
        elif declared_prev != prev:
            return {"ok": False, "checked": i, "broken_at": rev.get("revision_id"),
                    "reason": f"prev_hash {declared_prev!r} does not match {prev!r}"}

        stored = rev.get("row_hash")
        recomputed = row_hash(rev)
        if stored is not None and stored != recomputed:
            return {"ok": False, "checked": i, "broken_at": rev.get("revision_id"),
                    "reason": "row_hash does not match the row's canonical content"}

        prev = stored if stored is not None else recomputed

    return {"ok": True, "checked": len(revisions), "broken_at": None, "reason": None}


@dataclass(frozen=True)
class CorpusSnapshot:
    """An accepted, immutable state of the corpus. Briefings pin one of these."""
    corpus_version: int
    corpus_root: str
    row_count: int
    column_count: int
    source: str            # "csv-bootstrap" | "postgres"
    algorithm: str = "RFC6962-SHA256/canonical-json-rows"

    def as_dict(self) -> Dict[str, Any]:
        return asdict(self)


def build_snapshot(df: pd.DataFrame, source: str = "csv-bootstrap",
                   corpus_version: Optional[int] = None) -> CorpusSnapshot:
    return CorpusSnapshot(
        corpus_version=BOOTSTRAP_VERSION if corpus_version is None else int(corpus_version),
        corpus_root=compute_corpus_root(df),
        row_count=int(len(df)),
        column_count=len(_present_columns(df)),
        source=source,
    )


def write_snapshot(snap: CorpusSnapshot, path: str = SNAPSHOT_PATH) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tmp = f"{path}.tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(snap.as_dict(), f, indent=2, sort_keys=True)
    os.replace(tmp, path)          # atomic; a reader never sees a half-written snapshot


def read_snapshot(path: str = SNAPSHOT_PATH) -> Optional[CorpusSnapshot]:
    if not os.path.exists(path):
        return None
    try:
        with open(path, "r", encoding="utf-8") as f:
            d = json.load(f)
        return CorpusSnapshot(
            corpus_version=int(d["corpus_version"]),
            corpus_root=str(d["corpus_root"]),
            row_count=int(d["row_count"]),
            column_count=int(d["column_count"]),
            source=str(d.get("source", "unknown")),
            algorithm=str(d.get("algorithm", "RFC6962-SHA256/canonical-json-rows")),
        )
    except Exception:
        return None


if __name__ == "__main__":
    DATA_PATH = os.path.join(BASE_DIR, "paimana_extracted",
                             "PAIMANA_MASTER_PROJECTS_DATABASE.csv")
    frame = pd.read_csv(DATA_PATH)
    snapshot = build_snapshot(frame)
    write_snapshot(snapshot)
    print("=" * 78)
    print("CORPUS PROVENANCE — CONTENT-ADDRESSED dataset_hash")
    print("=" * 78)
    print(f"  algorithm      : {snapshot.algorithm}")
    print(f"  source         : {snapshot.source}")
    print(f"  corpus_version : {snapshot.corpus_version}")
    print(f"  rows / columns : {snapshot.row_count} / {snapshot.column_count}")
    print(f"  corpus_root    : {snapshot.corpus_root}")
    print(f"  wrote {SNAPSHOT_PATH}")
