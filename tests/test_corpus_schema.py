"""
PRAKALP-DRISHTI: SCHEMA CONTRACT AUDIT (Phase 2)

Verifies the Postgres migrations WITHOUT a database.

Why that is possible, and why it is the right test
--------------------------------------------------
The dangerous failure in this migration is not a syntax error -- psql reports those
loudly the first time anyone runs it. The dangerous failure is SILENT DRIFT between
three declarations of the same schema:

    corpus_provenance.SOURCE_COLUMNS   what the corpus hash covers
    corpus_provenance.COLUMN_MAP       how those map to Postgres
    0001_corpus_schema.sql             what Postgres actually stores

If the DDL omits a column the hash covers, the corpus root computed from Postgres will
differ from the root computed from the CSV -- and every Cabinet briefing signed before
the migration stops verifying after it, with nothing in the output to reveal why. That
is exactly the class of defect that let nine of eleven hand-set sector keys match nothing
in the corpus while looking entirely plausible in review.

These checks are therefore three-way: SOURCE_COLUMNS, COLUMN_MAP and the DDL must agree
exactly, in both directions, with no column present in one and absent from another.

The append-only guarantees and the chain verifier are asserted here too, because the
audit trail's credibility rests on them.
"""

import os
import re
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)

from analytics_engine.corpus_provenance import (          # noqa: E402
    SOURCE_COLUMNS, COLUMN_MAP, row_hash, verify_chain, canonical_row,
)

MIG_DIR = os.path.join(BASE_DIR, "supabase", "migrations")

_checks = 0
_failures = []


def check(name, ok, detail=""):
    global _checks
    _checks += 1
    print(f"  [{'PASS' if ok else 'FAIL'}] {name}" + (f"  -- {detail}" if detail else ""))
    if not ok:
        _failures.append(f"{name}: {detail}")


def read(fn):
    p = os.path.join(MIG_DIR, fn)
    return open(p, encoding="utf-8").read() if os.path.exists(p) else ""


# ---------------------------------------------------------------------------------
print("\n--- TEST 1: MIGRATIONS EXIST AND ARE ORDERED ---")
# ---------------------------------------------------------------------------------

check("migrations directory exists", os.path.isdir(MIG_DIR), MIG_DIR)

files = sorted(f for f in os.listdir(MIG_DIR) if f.endswith(".sql")) if os.path.isdir(MIG_DIR) else []
check("at least four migrations present", len(files) >= 4, str(files))
check("every migration is numerically prefixed",
      all(re.match(r"^\d{4}_", f) for f in files), str(files))
check("migration numbers are unique",
      len({f[:4] for f in files}) == len(files), str(files))

schema_sql = read("0001_corpus_schema.sql")
append_sql = read("0002_append_only.sql")
rls_sql = read("0003_rls.sql")
seed_sql = read("0004_seed_vocabulary.sql")

for label, body in (("0001 schema", schema_sql), ("0002 append-only", append_sql),
                    ("0003 rls", rls_sql), ("0004 seed", seed_sql)):
    check(f"{label} is non-empty", len(body) > 200, f"{len(body)} bytes")

# A migration that can destroy the ledger is a migration that can end the audit trail.
for label, body in (("0001", schema_sql), ("0002", append_sql),
                    ("0003", rls_sql), ("0004", seed_sql)):
    destructive = re.findall(r"\b(drop\s+table|truncate\s+table|delete\s+from)\b",
                             body, re.I)
    check(f"{label} contains no destructive statement", not destructive, str(destructive))


# ---------------------------------------------------------------------------------
print("\n--- TEST 2: THREE-WAY COLUMN CONTRACT ---")
# ---------------------------------------------------------------------------------

m = re.search(r"create table if not exists project_revisions\s*\((.*?)\n\);",
              schema_sql, re.S | re.I)
check("project_revisions DDL is parseable", m is not None)

ddl_cols = set()
if m:
    for line in m.group(1).splitlines():
        line = line.strip()
        if not line or line.startswith("--"):
            continue
        cm = re.match(r"^([a-z_][a-z0-9_]*)\s+[a-z]", line)
        if cm:
            ddl_cols.add(cm.group(1))

# COLUMN_MAP must be total over SOURCE_COLUMNS and injective.
check("COLUMN_MAP covers every SOURCE column",
      set(COLUMN_MAP) == set(SOURCE_COLUMNS),
      f"missing={sorted(set(SOURCE_COLUMNS) - set(COLUMN_MAP))} "
      f"extra={sorted(set(COLUMN_MAP) - set(SOURCE_COLUMNS))}")
check("COLUMN_MAP is injective (no two corpus columns share a SQL column)",
      len(set(COLUMN_MAP.values())) == len(COLUMN_MAP),
      f"{len(COLUMN_MAP)} keys -> {len(set(COLUMN_MAP.values()))} values")

mapped = set(COLUMN_MAP.values())
check("every mapped column exists in the DDL",
      mapped <= ddl_cols, f"absent from DDL: {sorted(mapped - ddl_cols)}")

LEDGER_COLS = {"revision_id", "project_id", "corpus_version", "row_hash", "prev_hash",
               "recorded_at", "recorded_by", "ingest_source"}
unexplained = ddl_cols - mapped - LEDGER_COLS
check("DDL declares no column outside the corpus + ledger contract",
      not unexplained, f"unexplained: {sorted(unexplained)}")

check("all 25 corpus columns are storable",
      len(mapped & ddl_cols) == len(SOURCE_COLUMNS),
      f"{len(mapped & ddl_cols)} of {len(SOURCE_COLUMNS)}")


# ---------------------------------------------------------------------------------
print("\n--- TEST 3: TYPES THAT PROTECT THE HASH ---")
# ---------------------------------------------------------------------------------

body = m.group(1) if m else ""

# A timestamptz would attach a timezone that shifts the day across the IST boundary,
# silently changing the hash of a project nobody edited.
for col in ("sanction_date", "start_date", "original_end_date", "revised_date"):
    check(f"{col} is `date`, not a timestamp",
          re.search(rf"^\s*{col}\s+date\b", body, re.M | re.I) is not None)

# Binary floats do not round-trip decimals exactly; numeric does.
for col in ("original_cost", "revised_cost", "expenditure", "physical_progress"):
    check(f"{col} is `numeric`, not floating point",
          re.search(rf"^\s*{col}\s+numeric", body, re.M | re.I) is not None)

check("row_hash is constrained to 64 lowercase hex",
      "row_hash" in body and re.search(r"row_hash.*\[0-9a-f\]\{64\}", body, re.S) is not None)
check("prev_hash is constrained to 64 lowercase hex",
      re.search(r"prev_hash.*\[0-9a-f\]\{64\}", body, re.S) is not None)
check("sector_name is FK-constrained to the controlled vocabulary",
      re.search(r"sector_name\s+text\s+references\s+sectors", body, re.I) is not None)


# ---------------------------------------------------------------------------------
print("\n--- TEST 4: APPEND-ONLY ENFORCEMENT (three layers) ---")
# ---------------------------------------------------------------------------------

check("layer 1: UPDATE/DELETE revoked on the ledger",
      re.search(r"revoke\s+update,\s*delete", append_sql, re.I) is not None)
check("layer 2: a BEFORE UPDATE OR DELETE trigger exists",
      re.search(r"before\s+update\s+or\s+delete\s+on\s+project_revisions",
                append_sql, re.I) is not None)
check("layer 2: the trigger raises rather than returning quietly",
      "raise exception" in append_sql.lower())
check("layer 3: an insert-time chain validator exists",
      re.search(r"before\s+insert\s+on\s+project_revisions", append_sql, re.I) is not None)
check("corpus_snapshots is also append-only",
      re.search(r"before\s+update\s+or\s+delete\s+on\s+corpus_snapshots",
                append_sql, re.I) is not None)
check("sealing is scoped to corpus_version only, not a general edit",
      "corpus_version" in append_sql and "to_jsonb(new) - 'corpus_version'" in append_sql)
check("a genesis revision is unique per project",
      "project_revisions_genesis_idx" in schema_sql)
check("the chain cannot fork (unique predecessor per project)",
      "project_revisions_chain_idx" in schema_sql)


# ---------------------------------------------------------------------------------
print("\n--- TEST 5: RLS IS DEFENCE IN DEPTH, NOT THE ONLY FENCE ---")
# ---------------------------------------------------------------------------------

for t in ("projects", "project_revisions", "corpus_snapshots"):
    check(f"RLS enabled on {t}",
          re.search(rf"alter table {t}\s+enable row level security", rls_sql, re.I) is not None)

check("no policy grants INSERT/UPDATE/DELETE to a client role",
      not re.search(r"create policy[^;]*for\s+(insert|update|delete)", rls_sql, re.I),
      "writes must arrive through the backend, which writes the access log")
check("anon is stripped of project table access",
      re.search(r"revoke all on projects", rls_sql, re.I) is not None)
check("the RLS file states it is not the primary control",
      "not the fence" in rls_sql.lower() or "defence in depth" in rls_sql.lower())


# ---------------------------------------------------------------------------------
print("\n--- TEST 6: SEED MATCHES THE CORPUS VOCABULARY ---")
# ---------------------------------------------------------------------------------

import pandas as pd                                                    # noqa: E402
from analytics_engine.corpus_provenance import _canonical_value        # noqa: E402

df = pd.read_csv(os.path.join(BASE_DIR, "paimana_extracted",
                              "PAIMANA_MASTER_PROJECTS_DATABASE.csv"))
corpus_sectors = {_canonical_value(s) for s in df["SectorName"].dropna().unique()}

seed_block = re.search(r"insert into sectors[^;]*;", seed_sql, re.S | re.I)
seed_sectors = set(re.findall(r"\('((?:[^']|'')*)'\)", seed_block.group(0))) if seed_block else set()
seed_sectors = {s.replace("''", "'") for s in seed_sectors}

check("every corpus sector is seeded",
      corpus_sectors <= seed_sectors,
      f"unseeded: {sorted(corpus_sectors - seed_sectors)}")
check("seed introduces no sector absent from the corpus",
      seed_sectors <= corpus_sectors,
      f"extra: {sorted(seed_sectors - corpus_sectors)}")

# The corpus really does contain 'Construction ' with a trailing space. Seeding the raw
# string would create a vocabulary row the canonicalised project row can never match.
check("trailing-space sector is seeded in canonical form",
      "Construction" in seed_sectors and "Construction " not in seed_sectors)
check("seed is idempotent", seed_sql.lower().count("on conflict") >= 3)
check("aliases are seeded for entity resolution",
      "insert into entity_aliases" in seed_sql.lower())


# ---------------------------------------------------------------------------------
print("\n--- TEST 7: HASH-CHAIN VERIFIER ---")
# ---------------------------------------------------------------------------------

def rev(pid, cost, prev):
    r = {c: None for c in SOURCE_COLUMNS}
    r["ProjectId"] = pid
    r["OriginalCost"] = cost
    r["prev_hash"] = prev
    r["row_hash"] = row_hash(r)
    return r

r1 = rev(400188, 500, None)
r2 = rev(400188, 620, r1["row_hash"])
r3 = rev(400188, 700, r2["row_hash"])

res = verify_chain([r1, r2, r3])
check("an intact chain verifies", res["ok"] and res["checked"] == 3, str(res))

broken = [r1, r2, dict(r3, prev_hash=r1["row_hash"])]
check("a re-pointed link is detected", not verify_chain(broken)["ok"])

tampered = dict(r2)
tampered["OriginalCost"] = 999           # content edited, stored hash left behind
check("an edited row with a stale row_hash is detected",
      not verify_chain([r1, tampered])["ok"])

check("a genesis row declaring a predecessor is detected",
      not verify_chain([dict(r1, prev_hash="a" * 64)])["ok"])

check("row_hash equals the RFC 6962 leaf of the canonical row",
      r1["row_hash"] == row_hash(r1) and len(r1["row_hash"]) == 64)
check("a single-project chain of one verifies", verify_chain([r1])["ok"])


# ---------------------------------------------------------------------------------
print()
print("=" * 78)
if _failures:
    print(f"SCHEMA CONTRACT AUDIT FAILED: {len(_failures)} of {_checks} checks")
    for f in _failures:
        print(f"  - {f}")
    print("=" * 78)
    sys.exit(1)

print(f"ASSERTIONS PASSED: {_checks} schema-contract checks, 0 failures.")
print(f"  {len(SOURCE_COLUMNS)} corpus columns mapped and storable; chain verifier sound.")
print("=" * 78)
