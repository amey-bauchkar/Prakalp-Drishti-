"""
PRAKALP-DRISHTI: CORPUS SOURCE — THE SINGLE SEAM

Every engine that reads the 2,207-project corpus reads it through `load_corpus()`. That
one function is the entire boundary between "this system runs off a CSV" and "this
system runs off Postgres".

    DATABASE_URL unset  ->  pd.read_csv(PAIMANA_MASTER_PROJECTS_DATABASE.csv)
    DATABASE_URL set    ->  SELECT from project_current, renamed to corpus columns

THE SAFETY PROPERTY
-------------------
With DATABASE_URL unset this function performs literally the call the engines performed
before it existed. Today's behaviour is therefore the DEFAULT, not a deprecated legacy
path: unplug the database and the system is byte-for-byte the one that passed 475/475.

That is what keeps CI green with no credentials provisioned, keeps a fresh clone
runnable, and makes the whole migration revertible by clearing one environment variable.

WHY A FRESH FRAME PER CALL
--------------------------
The engines MUTATE what they load -- KAAL-CHAKRA assigns CANONICAL_ENTITY, SETU-GRAPH
adds graph columns, several call _preprocess_features() in place. Handing them a shared
cached DataFrame would let one engine's derived columns appear inside another's, which
is a data-corruption bug that no test would obviously catch. Each caller therefore gets
its own frame, exactly as ten separate read_csv calls gave them before.

The cost is re-reading; the measured boot cost is unchanged because that is precisely
what the system already did.

NO DRIVER AT IMPORT TIME
------------------------
psycopg is imported lazily, inside the Postgres branch. An air-gapped deployment with no
database and no driver installed must import this module cleanly, and it does.

CONNECTION CHOICE (Supabase)
----------------------------
Use the DIRECT connection (port 5432) for this loader. It pulls the whole corpus in one
statement, which is a session-scoped workload; the transaction pooler on 6543 is for
short writes and does not support the session features a bulk read benefits from.
"""

from __future__ import annotations

import os
import threading
import time
from dataclasses import dataclass
from typing import Any, Dict, Optional

import pandas as pd

try:
    from backend import config  # noqa: F401 - ensures .env is loaded
except Exception:
    pass

from analytics_engine.corpus_provenance import (
    COLUMN_MAP, CorpusSnapshot, build_snapshot,
)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV_PATH = os.path.join(BASE_DIR, "paimana_extracted",
                        "PAIMANA_MASTER_PROJECTS_DATABASE.csv")

# Read at call time rather than import time so a test can set it and a deployment can
# change it without reimporting the world.
ENV_VAR = "DATABASE_URL"

SQL_COLUMN_TO_CORPUS: Dict[str, str] = {v: k for k, v in COLUMN_MAP.items()}

# Dates arrive from Postgres as date objects and from the CSV as DD/MM/YYYY text.
# corpus_provenance normalises both for HASHING; this list is for the frame the engines
# receive, which they parse with dayfirst=True downstream either way.
DATE_COLUMNS = ("SanctionDate", "StartDate", "OriginalEndDate", "RevisedDate")


def database_url() -> str:
    return os.getenv(ENV_VAR, "").strip()


def corpus_source_name() -> str:
    """'postgres' | 'csv-bootstrap' -- what the NEXT load_corpus() call will read."""
    return "postgres" if database_url() else "csv-bootstrap"


def is_database_configured() -> bool:
    return bool(database_url())


# ---------------------------------------------------------------------------------
# Loaders
# ---------------------------------------------------------------------------------

def _load_from_csv() -> pd.DataFrame:
    return pd.read_csv(CSV_PATH)


def _load_from_postgres(url: str) -> pd.DataFrame:
    """
    Read the latest revision per project and present it under the CORPUS column names.

    The rename is what lets every engine stay unaware of the migration: downstream code
    keeps referring to ProjectId and SectorName, and never learns that Postgres calls
    them project_id and sector_name.
    """
    try:
        import psycopg                                    # noqa: F401
        from psycopg import connect
    except ImportError:                                    # pragma: no cover
        try:
            from psycopg2 import connect                   # type: ignore
        except ImportError as exc:                         # pragma: no cover
            raise RuntimeError(
                f"{ENV_VAR} is set but no PostgreSQL driver is installed. "
                f"Install `psycopg[binary]`, or clear {ENV_VAR} to run from the CSV "
                "bootstrap."
            ) from exc

    sql_cols = sorted(SQL_COLUMN_TO_CORPUS)
    cols = ", ".join(f'"{c}"' for c in sql_cols)
    query = f"select {cols} from project_current"

    # Rows are fetched through the cursor and the frame built explicitly, rather than
    # via pd.read_sql_query. pandas supports SQLAlchemy connectables and sqlite3 only;
    # handing it a raw psycopg connection works today but is an explicitly untested
    # path, and it warns as much on every load. Building the frame here also pins the
    # column ORDER to sql_cols instead of inheriting whatever the driver reports, which
    # matters because the corpus hash must not depend on driver behaviour.
    with connect(url) as conn:                             # type: ignore[operator]
        with conn.cursor() as cur:
            cur.execute(query)
            rows = cur.fetchall()

    df = pd.DataFrame(rows, columns=sql_cols).rename(columns=SQL_COLUMN_TO_CORPUS)

    for c in DATE_COLUMNS:
        if c in df.columns:
            df[c] = pd.to_datetime(df[c], errors="coerce")

    # numeric(18,6) arrives as Decimal from some drivers and float from others. The
    # engines do arithmetic on these directly, so they are coerced to float here rather
    # than left to fail somewhere downstream with an unhelpful message. Non-numeric
    # columns are untouched.
    for corpus_col in ("OriginalCost", "RevisedCost", "Expenditure", "PhysicalProgress",
                       "DELAYED_TIME", "COST_OVERRUN", "COST_OVERRUN_PERC",
                       "COR_PERC", "TOR_PERC", "OnboardingDelay", "AgencyId"):
        if corpus_col in df.columns:
            df[corpus_col] = pd.to_numeric(df[corpus_col], errors="coerce")

    return df


def load_corpus(source: Optional[str] = None) -> pd.DataFrame:
    """
    The corpus, as a fresh DataFrame the caller owns and may mutate.

    `source` forces a backend ('csv' | 'postgres'); omit it to follow DATABASE_URL.
    """
    if source == "csv":
        return _load_from_csv()
    if source == "postgres":
        url = database_url()
        if not url:
            raise RuntimeError(f"source='postgres' requested but {ENV_VAR} is not set")
        return _load_from_postgres(url)

    url = database_url()
    return _load_from_postgres(url) if url else _load_from_csv()


# ---------------------------------------------------------------------------------
# Versioned snapshot registry
# ---------------------------------------------------------------------------------

@dataclass(frozen=True)
class CorpusView:
    """An immutable, content-addressed view of the corpus at one instant."""
    frame: pd.DataFrame
    snapshot: CorpusSnapshot
    source: str
    loaded_at: float

    @property
    def corpus_root(self) -> str:
        return self.snapshot.corpus_root

    @property
    def corpus_version(self) -> int:
        return self.snapshot.corpus_version

    def copy_frame(self) -> pd.DataFrame:
        """A caller-owned frame. Never hand out the registry's own object."""
        return self.frame.copy()

    def describe(self) -> Dict[str, Any]:
        return {
            "corpus_version": self.corpus_version,
            "corpus_root": self.corpus_root,
            "row_count": self.snapshot.row_count,
            "source": self.source,
            "algorithm": self.snapshot.algorithm,
            "loaded_at": self.loaded_at,
        }


class CorpusRegistry:
    """
    Holds the current CorpusView and swaps it atomically.

    Phase 4 rebuilds this off the request path after an ingest. The swap is a single
    reference assignment, so a reader either sees the whole old view or the whole new
    one -- never a half-updated corpus. Readers hold their own reference for the
    duration of a request, which is why a rebuild cannot pull the frame out from under
    an in-flight LP solve.
    """

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._current: Optional[CorpusView] = None

    def current(self) -> CorpusView:
        view = self._current
        if view is None:
            with self._lock:
                if self._current is None:
                    self._current = self._build()
                view = self._current
        return view

    def rebuild(self) -> CorpusView:
        """Load afresh, then publish. Only the swap holds the lock."""
        new_view = self._build()
        with self._lock:
            self._current = new_view
        return new_view

    @staticmethod
    def _build() -> CorpusView:
        src = corpus_source_name()
        frame = load_corpus()
        return CorpusView(
            frame=frame,
            snapshot=build_snapshot(frame, source=src),
            source=src,
            loaded_at=time.time(),
        )


_registry = CorpusRegistry()


def current_view() -> CorpusView:
    return _registry.current()


def rebuild_view() -> CorpusView:
    return _registry.rebuild()
