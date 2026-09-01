"""
PRAKALP-DRISHTI: CORPUS REPOSITORY — THE WRITE PATH

Every write to the append-only ledger goes through here. Reads do not: the analytics
engines read the in-memory snapshot via corpus_source.load_corpus(), and this module is
never on a request's read path.

FAILS CLOSED, LOUDLY
--------------------
With DATABASE_URL unset every method raises DatabaseUnavailable. It does NOT fall back
to writing the CSV, because a system that silently accepts a government project
onboarding into a file that the next deployment overwrites is worse than one that refuses
the request. The router turns this into a 503 with the reason stated, so an officer knows
their submission did not land rather than discovering it missing a month later.

That behaviour is also what keeps CI green with no credentials: the endpoints exist, they
are mounted, and they answer 503 instead of erroring.

CONNECTION CHOICE (Supabase)
----------------------------
Writes here are short transactions, so the TRANSACTION POOLER (port 6543) is the right
endpoint. The bulk snapshot read in corpus_source uses the direct connection (5432).
"""

from __future__ import annotations

import os
from typing import Any, Dict, List, Optional, Sequence

from analytics_engine.corpus_provenance import COLUMN_MAP, SOURCE_COLUMNS

ENV_VAR = "DATABASE_URL"


class DatabaseUnavailable(RuntimeError):
    """No database is configured, or no driver is installed to reach it."""


def database_url() -> str:
    return os.getenv(ENV_VAR, "").strip()


def is_available() -> bool:
    return bool(database_url())


def _connect():
    url = database_url()
    if not url:
        raise DatabaseUnavailable(
            f"{ENV_VAR} is not set. The corpus is running from the read-only CSV "
            "bootstrap, so ingestion is unavailable. Configure a PostgreSQL connection "
            "to enable project onboarding and CUF upload."
        )
    try:
        from psycopg import connect
    except ImportError:
        try:
            from psycopg2 import connect  # type: ignore
        except ImportError as exc:
            raise DatabaseUnavailable(
                f"{ENV_VAR} is set but no PostgreSQL driver is installed. "
                "Install `psycopg[binary]` to enable ingestion."
            ) from exc
    return connect(url)


# ---------------------------------------------------------------------------------
# Reads that the WRITE path needs (duplicate detection, chain continuity)
# ---------------------------------------------------------------------------------

def known_project_ids() -> set:
    with _connect() as conn:
        with conn.cursor() as cur:
            cur.execute("select project_id from projects")
            return {str(r[0]) for r in cur.fetchall()}


def latest_row_hash(project_id: Any) -> Optional[str]:
    """The row_hash a new revision for this project must declare as its prev_hash."""
    with _connect() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "select row_hash from project_revisions "
                "where project_id = %s order by revision_id desc limit 1",
                (int(project_id),),
            )
            row = cur.fetchone()
            return row[0] if row else None


# ---------------------------------------------------------------------------------
# Writes
# ---------------------------------------------------------------------------------

_LEDGER_FIELDS = ("row_hash", "prev_hash", "ingest_source", "recorded_by")


def insert_revisions(records: Sequence[Dict[str, Any]]) -> int:
    """
    Insert validated revisions in ONE transaction.

    All-or-nothing on purpose: a CUF upload that half-lands leaves the corpus in a state
    no corpus_version describes, and the officer cannot tell which rows took. The
    insert-time chain trigger (migration 0002) validates every prev_hash server-side, so
    a concurrent writer racing on the same project aborts the whole batch rather than
    forking that project's chain.
    """
    if not records:
        return 0

    cols = ["project_id"] + [COLUMN_MAP[c] for c in SOURCE_COLUMNS
                             if c != "ProjectId"] + list(_LEDGER_FIELDS)
    placeholders = ", ".join(["%s"] * len(cols))
    quoted = ", ".join(f'"{c}"' for c in cols)
    sql = f"insert into project_revisions ({quoted}) values ({placeholders})"

    rows = []
    for rec in records:
        values: List[Any] = [rec.get("ProjectId")]
        for c in SOURCE_COLUMNS:
            if c == "ProjectId":
                continue
            values.append(rec.get(c))
        for f in _LEDGER_FIELDS:
            values.append(rec.get(f))
        rows.append(tuple(values))

    with _connect() as conn:
        with conn.cursor() as cur:
            # A project row must exist before its revision can reference it.
            cur.executemany(
                "insert into projects (project_id, onboarded_by) values (%s, %s) "
                "on conflict (project_id) do nothing",
                [(r.get("ProjectId"), r.get("recorded_by")) for r in records],
            )
            cur.executemany(sql, rows)
        conn.commit()
    return len(rows)


def queue_unresolved_entities(names: Dict[str, int]) -> int:
    """
    Park unmappable COMPANYNAME strings for a human.

    This is the queue that exists so an unknown agency is never silently defaulted to
    the pooled multiplier -- the defect that made 32% of the portfolio invisible to the
    sector table.
    """
    if not names:
        return 0
    with _connect() as conn:
        with conn.cursor() as cur:
            cur.executemany(
                "insert into entity_resolution_queue (raw_name, occurrences) "
                "values (%s, %s) "
                "on conflict (raw_name) do update set "
                "occurrences = entity_resolution_queue.occurrences + excluded.occurrences",
                list(names.items()),
            )
        conn.commit()
    return len(names)


def unresolved_queue(limit: int = 200) -> List[Dict[str, Any]]:
    with _connect() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "select raw_name, occurrences, first_seen_at, resolved, resolved_to "
                "from entity_resolution_queue where resolved = false "
                "order by occurrences desc, raw_name limit %s",
                (int(limit),),
            )
            return [
                {"raw_name": r[0], "occurrences": r[1],
                 "first_seen_at": str(r[2]), "resolved": r[3], "resolved_to": r[4]}
                for r in cur.fetchall()
            ]


def seal_corpus(corpus_root: str, row_count: int, column_count: int,
                source: str, sealed_by: Optional[str] = None) -> int:
    """Seal every open revision into a new immutable corpus_version."""
    with _connect() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "select prakalp_seal_corpus(%s, %s, %s, %s, %s)",
                (corpus_root, int(row_count), int(column_count), source, sealed_by),
            )
            version = cur.fetchone()[0]
        conn.commit()
    return int(version)


def current_corpus_version() -> Optional[int]:
    with _connect() as conn:
        with conn.cursor() as cur:
            cur.execute("select max(corpus_version) from corpus_snapshots")
            row = cur.fetchone()
            return int(row[0]) if row and row[0] is not None else None
