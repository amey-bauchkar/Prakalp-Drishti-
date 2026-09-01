"""
PRAKALP-DRISHTI: CORPUS SOURCE AUDIT (Phase 3)

Verifies the single seam between "runs off a CSV" and "runs off Postgres", without a
database.

The property under test
-----------------------
With DATABASE_URL unset, `load_corpus()` must be INDISTINGUISHABLE from the
`pd.read_csv(DATA_PATH)` call it replaced in eight engines. Not equivalent-in-spirit --
identical, including that each caller gets its own mutable frame.

That property is the entire safety argument for the migration: today's behaviour is the
default rather than a legacy path, CI stays green with no credentials, a fresh clone
still runs, and the whole change reverts by clearing one environment variable.

The mutation-isolation check is the one that would otherwise bite silently. The engines
MUTATE what they load -- KAAL-CHAKRA assigns CANONICAL_ENTITY, others add derived
columns in place. Returning a shared cached frame would let one engine's derived columns
materialise inside another's, corrupting inputs in a way no endpoint test would obviously
catch.

The Postgres path is exercised by simulating exactly what the driver returns (snake_case
columns, real date objects) and asserting the rename reconstructs the corpus frame. That
covers the code that would otherwise first execute against a live database with real data
behind it.
"""

import os
import sys

import pandas as pd

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)

from analytics_engine.corpus_source import (               # noqa: E402
    load_corpus, corpus_source_name, is_database_configured, database_url,
    CorpusRegistry, CorpusView, SQL_COLUMN_TO_CORPUS, DATE_COLUMNS, CSV_PATH, ENV_VAR,
)
from analytics_engine.corpus_provenance import (           # noqa: E402
    COLUMN_MAP, SOURCE_COLUMNS, compute_corpus_root,
)

_checks = 0
_failures = []


def check(name, ok, detail=""):
    global _checks
    _checks += 1
    print(f"  [{'PASS' if ok else 'FAIL'}] {name}" + (f"  -- {detail}" if detail else ""))
    if not ok:
        _failures.append(f"{name}: {detail}")


# ---------------------------------------------------------------------------------
print("\n--- TEST 1: CSV BOOTSTRAP IS THE DEFAULT AND IS UNCHANGED ---")
# ---------------------------------------------------------------------------------

check("DATABASE_URL is unset in this environment", not database_url(),
      "the suite must prove the no-credentials path")
check("source resolves to csv-bootstrap", corpus_source_name() == "csv-bootstrap")
check("is_database_configured() is False", is_database_configured() is False)

direct = pd.read_csv(CSV_PATH)
via_seam = load_corpus()

check("load_corpus() equals pd.read_csv(DATA_PATH) exactly",
      via_seam.equals(direct), f"{via_seam.shape} vs {direct.shape}")
check("column names are unchanged",
      list(via_seam.columns) == list(direct.columns))
check("dtypes are unchanged",
      list(via_seam.dtypes) == list(direct.dtypes))
check("corpus root is unchanged through the seam",
      compute_corpus_root(via_seam) == compute_corpus_root(direct))


# ---------------------------------------------------------------------------------
print("\n--- TEST 2: MUTATION ISOLATION (each caller owns its frame) ---")
# ---------------------------------------------------------------------------------

a = load_corpus()
b = load_corpus()
check("two calls return distinct objects", a is not b)

a["CANONICAL_ENTITY"] = "MUTATED"
a["__derived__"] = 1
c = load_corpus()
check("a caller's added column does not leak to the next caller",
      "CANONICAL_ENTITY" not in c.columns and "__derived__" not in c.columns,
      "shared frames would corrupt one engine with another's derived columns")

b.loc[0, "OriginalCost"] = -999
check("an in-place value edit does not leak",
      load_corpus().loc[0, "OriginalCost"] != -999)


# ---------------------------------------------------------------------------------
print("\n--- TEST 3: EVERY ENGINE ROUTES THROUGH THE SEAM ---")
# ---------------------------------------------------------------------------------
# A drift guard: an engine that reintroduces a direct read would keep working today and
# silently ignore Postgres tomorrow, which is the hardest kind of bug to notice.

ENGINE_DIR = os.path.join(BASE_DIR, "analytics_engine")
EXEMPT = {"corpus_provenance.py"}          # its __main__ bootstraps the CSV deliberately

offenders = []
for fn in sorted(os.listdir(ENGINE_DIR)):
    if not fn.endswith(".py") or fn in EXEMPT:
        continue
    body = open(os.path.join(ENGINE_DIR, fn), encoding="utf-8", errors="replace").read()
    if "read_csv(DATA_PATH)" in body:
        offenders.append(fn)

check("no engine reads the master corpus directly", not offenders, str(offenders))

# The same guard across backend/ and modules/, which the engine-only scan above missed.
#
# backend/server.py DID bypass the seam: /api/health and /api/projects served the CSV
# while every engine served Postgres, so a project onboarded through /api/ingest showed
# up in the forecasts but not in the project list, and the health count stayed frozen at
# the pre-ingestion figure. Two sources of truth for "which projects exist" does not
# error; it quietly disagrees with itself.
#
# KNOWN_BYPASSES pins the ones still outstanding. They are read-only analytics surfaces
# that will not see newly onboarded projects until they are routed too. Listing them
# makes the gap visible and stops a NEW bypass appearing unnoticed.
KNOWN_BYPASSES = {
    os.path.join("modules", "parth", "service.py"),
    os.path.join("modules", "tanmay", "service.py"),
    os.path.join("analytics_engine", "karya_engine.py"),
}

MASTER_CSV = "PAIMANA_MASTER_PROJECTS_DATABASE.csv"
wide_offenders = []
for root_dir in ("backend", "modules", "analytics_engine"):
    base = os.path.join(BASE_DIR, root_dir)
    for dirpath, _dirs, files in os.walk(base):
        if "__pycache__" in dirpath or os.sep + "data" in dirpath:
            continue
        for fn in files:
            if not fn.endswith(".py"):
                continue
            full = os.path.join(dirpath, fn)
            rel = os.path.relpath(full, BASE_DIR)
            if os.path.basename(full) in {"corpus_source.py", "corpus_provenance.py",
                                          "ingestion.py"}:
                continue
            body = open(full, encoding="utf-8", errors="replace").read()
            # A read is a bypass only if it actually calls read_csv on the master path.
            # Comments are skipped: the first version of this scan flagged
            # backend/server.py on the strength of the comment explaining why it no
            # longer reads the CSV, which is the sort of finding that trains people to
            # ignore the check.
            for line in body.splitlines():
                if line.strip().startswith("#"):
                    continue
                if "pd.read_csv(" in line and ("DATA_PATH" in line
                                               or MASTER_CSV in line
                                               or "MASTER_PROJECTS_PATH" in line
                                               or "self.data_path" in line):
                    if rel not in KNOWN_BYPASSES:
                        wide_offenders.append(rel)
                    break

check("backend/ and modules/ introduce no NEW corpus-seam bypass",
      not wide_offenders,
      f"unlisted: {sorted(set(wide_offenders))}")
check("backend/server.py reads through the seam",
      "load_corpus()" in open(os.path.join(BASE_DIR, "backend", "server.py"),
                              encoding="utf-8").read(),
      "/api/health and /api/projects must agree with the engines")

routed = []
for fn in sorted(os.listdir(ENGINE_DIR)):
    if fn.endswith(".py"):
        body = open(os.path.join(ENGINE_DIR, fn), encoding="utf-8", errors="replace").read()
        if "load_corpus()" in body and fn != "corpus_source.py":
            routed.append(fn)
check("at least eight engines route through load_corpus()", len(routed) >= 8,
      f"{len(routed)}: {routed}")


# ---------------------------------------------------------------------------------
print("\n--- TEST 4: POSTGRES PATH (simulated, no database) ---")
# ---------------------------------------------------------------------------------

check("SQL_COLUMN_TO_CORPUS is the exact inverse of COLUMN_MAP",
      SQL_COLUMN_TO_CORPUS == {v: k for k, v in COLUMN_MAP.items()})
check("the reverse map covers all 25 corpus columns",
      set(SQL_COLUMN_TO_CORPUS.values()) == set(SOURCE_COLUMNS),
      f"{len(SQL_COLUMN_TO_CORPUS)} entries")

# Build exactly what psycopg would hand back: snake_case columns, real date objects.
pg_like = direct.rename(columns=COLUMN_MAP).copy()
for corpus_col in DATE_COLUMNS:
    sql_col = COLUMN_MAP[corpus_col]
    pg_like[sql_col] = pd.to_datetime(pg_like[sql_col], errors="coerce",
                                      dayfirst=True).dt.date

reconstructed = pg_like.rename(columns=SQL_COLUMN_TO_CORPUS)
for c in DATE_COLUMNS:
    reconstructed[c] = pd.to_datetime(reconstructed[c], errors="coerce")

check("the rename reconstructs every corpus column name",
      set(reconstructed.columns) == set(direct.columns),
      f"missing={sorted(set(direct.columns) - set(reconstructed.columns))}")

# The whole point of Phase 1+2: the same logical rows hash the same from either backend.
check("a simulated Postgres frame yields the SAME corpus root",
      compute_corpus_root(reconstructed) == compute_corpus_root(direct),
      "if this fails, briefings signed before the migration stop verifying after it")

# Forcing the postgres backend without a URL must fail loudly, not fall back silently.
raised = False
try:
    load_corpus(source="postgres")
except RuntimeError as e:
    raised = ENV_VAR in str(e)
check("source='postgres' without DATABASE_URL raises a clear error", raised,
      "a silent CSV fallback would hide a misconfigured deployment")

check("forcing source='csv' works regardless of environment",
      load_corpus(source="csv").equals(direct))


# ---------------------------------------------------------------------------------
print("\n--- TEST 5: NO DRIVER REQUIRED AT IMPORT TIME ---")
# ---------------------------------------------------------------------------------
# An air-gapped deployment with no database and no psycopg installed must import
# cleanly. The driver is imported lazily inside the Postgres branch only.

src = open(os.path.join(ENGINE_DIR, "corpus_source.py"), encoding="utf-8").read()
head = src.split("def _load_from_postgres")[0]
check("no psycopg import at module scope",
      "import psycopg" not in head,
      "a top-level driver import would break air-gapped boot")
check("driver is imported inside the Postgres loader",
      "import psycopg" in src.split("def _load_from_postgres")[1])
check("a missing driver produces an actionable message",
      "no PostgreSQL driver is installed" in src)


# ---------------------------------------------------------------------------------
print("\n--- TEST 6: VERSIONED REGISTRY & ATOMIC SWAP ---")
# ---------------------------------------------------------------------------------

reg = CorpusRegistry()
v1 = reg.current()
check("registry builds a view on first access", isinstance(v1, CorpusView))
check("view carries the content address",
      v1.corpus_root == compute_corpus_root(direct), v1.corpus_root[:16])
check("view carries a corpus_version", v1.corpus_version == 1)
check("view names its source", v1.source == "csv-bootstrap")

check("repeated current() returns the same view (no rebuild per read)",
      reg.current() is v1)

v2 = reg.rebuild()
check("rebuild publishes a NEW view object", v2 is not v1)
check("rebuild over unchanged data yields the SAME root",
      v2.corpus_root == v1.corpus_root,
      "the root is a content address, not a timestamp")
check("current() now returns the rebuilt view", reg.current() is v2)

# A reader that grabbed v1 before the swap must still hold a coherent corpus -- this is
# what stops a background rebuild pulling the frame out of an in-flight LP solve.
check("the pre-swap view remains intact after rebuild",
      len(v1.frame) == len(direct) and v1.corpus_root == compute_corpus_root(direct))

check("CorpusView is immutable",
      getattr(CorpusView, "__dataclass_params__").frozen)
check("copy_frame() hands out a caller-owned frame",
      v2.copy_frame() is not v2.frame and v2.copy_frame().equals(v2.frame))

d = v2.describe()
check("describe() reports version, root and source",
      {"corpus_version", "corpus_root", "source", "row_count"} <= set(d),
      str(sorted(d)))


# ---------------------------------------------------------------------------------
print()
print("=" * 78)
if _failures:
    print(f"CORPUS SOURCE AUDIT FAILED: {len(_failures)} of {_checks} checks")
    for f in _failures:
        print(f"  - {f}")
    print("=" * 78)
    sys.exit(1)

print(f"ASSERTIONS PASSED: {_checks} corpus-source checks, 0 failures.")
print(f"  source={corpus_source_name()}  engines routed={len(routed)}")
print("=" * 78)
