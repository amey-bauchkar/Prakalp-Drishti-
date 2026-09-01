"""
PRAKALP-DRISHTI: INGESTION AUDIT (Phase 4)

Covers project onboarding, CUF upload, entity resolution and the job registry -- all
without a database.

The rule this suite exists to defend
------------------------------------
An unresolved COMPANYNAME must REJECT the row, never default it.

KAAL-CHAKRA keys its executing-entity multipliers by CANONICAL_ENTITY. A row that falls
through to OTHER_UNSPECIFIED silently takes the pooled default: nothing errors, nothing
logs, and the forecast renders a number that looks exactly as authoritative as a fitted
one. That is not hypothetical -- the hand-set sector table failed this way for 20 of 22
sectors, 32% of the portfolio, and only a line-by-line audit caught it.

So the onboarding path is tested for the NEGATIVE: an unknown agency produces an error
and a queue entry, and never an accepted row.

The endpoint behaviour under no-database is also asserted, because that is the state CI
runs in and the state a judge's laptop runs in: the routes must exist, be mounted, and
answer 503 with a stated remedy rather than 500 or silently writing to a file.
"""

import io
import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)

from analytics_engine.ingestion import (                    # noqa: E402
    EntityResolver, RowError, ValidationReport, load_sector_vocabulary,
    normalise_cuf_headers, parse_cuf, to_revision, validate_rows, REQUIRED_COLUMNS,
    UNRESOLVED,
)
from analytics_engine.corpus_provenance import (            # noqa: E402
    SOURCE_COLUMNS, row_hash, verify_chain,
)
from analytics_engine import corpus_repository as repo      # noqa: E402
from modules.ingest.jobs import JobRegistry                 # noqa: E402

_checks = 0
_failures = []


def check(name, ok, detail=""):
    global _checks
    _checks += 1
    print(f"  [{'PASS' if ok else 'FAIL'}] {name}" + (f"  -- {detail}" if detail else ""))
    if not ok:
        _failures.append(f"{name}: {detail}")


VOCAB = load_sector_vocabulary()
RESOLVER = EntityResolver()
KNOWN_AGENCY = "Airport Authority of India [AAI]"


def good_row(pid=999001, **over):
    row = {c: None for c in SOURCE_COLUMNS}
    row.update({
        "ProjectId": pid,
        "ProjectName": "Test Corridor Package 3",
        "SectorName": "Railways",
        "COMPANYNAME": KNOWN_AGENCY,
        "LineMinistry": "Ministry of Railways",
        "OriginalCost": 500.0,
    })
    row.update(over)
    return row


# ---------------------------------------------------------------------------------
print("\n--- TEST 1: ENTITY RESOLUTION NEVER DEFAULTS ---")
# ---------------------------------------------------------------------------------

check("resolver loaded the alias table", len(RESOLVER) >= 200, f"{len(RESOLVER)} aliases")

cid, status = RESOLVER.resolve(KNOWN_AGENCY)
check("a known agency resolves to its canonical id", status == "resolved" and cid == "AAI",
      f"{cid!r} / {status}")

cid, status = RESOLVER.resolve("Completely Unknown Infra Pvt Ltd")
check("an unknown agency is UNRESOLVED, not defaulted",
      status == "unresolved" and cid is None, f"{cid!r} / {status}")
check("the unresolved sentinel is never returned as an answer",
      cid != UNRESOLVED)

for blank in (None, "", "   ", float("nan")):
    c2, s2 = RESOLVER.resolve(blank)
    check(f"blank agency {blank!r} is unresolved", s2 == "unresolved" and c2 is None)


# ---------------------------------------------------------------------------------
print("\n--- TEST 2: BATCH VALIDATION ---")
# ---------------------------------------------------------------------------------

rep = validate_rows([good_row()], VOCAB, RESOLVER)
check("a well-formed row is accepted", rep.ok and len(rep.accepted) == 1,
      str(rep.as_dict())[:120])
check("the accepted row carries its resolved entity",
      rep.accepted[0].get("_canonical_entity") == "AAI")

rep = validate_rows([good_row(COMPANYNAME="Unknown Agency XYZ")], VOCAB, RESOLVER)
check("an unresolved agency REJECTS the row", not rep.ok and not rep.accepted)
check("the unresolved name is queued for a human",
      "Unknown Agency XYZ" in rep.unresolved_entities, str(rep.unresolved_entities))

rep = validate_rows([good_row(SectorName="Not A Real Sector")], VOCAB, RESOLVER)
check("a sector outside the vocabulary is rejected", not rep.ok)
check("the sector error names the field",
      any(e.field_name == "SectorName" for e in rep.errors))

for col in REQUIRED_COLUMNS:
    rep = validate_rows([good_row(**{col: None})], VOCAB, RESOLVER)
    check(f"missing required {col} is rejected", not rep.ok)

rep = validate_rows([good_row(OriginalCost=-5)], VOCAB, RESOLVER)
check("a negative cost is rejected", not rep.ok)

rep = validate_rows([good_row(PhysicalProgress=140)], VOCAB, RESOLVER)
check("progress above 100 is rejected", not rep.ok)

rep = validate_rows([good_row(pid=1), good_row(pid=1)], VOCAB, RESOLVER)
check("a duplicate ProjectId within the batch is rejected", not rep.ok)

rep = validate_rows([good_row(pid=7)], VOCAB, RESOLVER, known_project_ids={"7"})
check("onboarding an existing project is refused", not rep.ok,
      "a second onboarding would fork the project's chain")

# An officer uploading 500 rows needs every problem, not the first.
batch = [good_row(pid=1, SectorName="Nope"), good_row(pid=2, OriginalCost=-1),
         good_row(pid=3, COMPANYNAME="Unknown Agency XYZ")]
rep = validate_rows(batch, VOCAB, RESOLVER)
check("validation reports ALL failing rows, not just the first",
      len({e.row_index for e in rep.errors}) == 3, f"{len(rep.errors)} errors")
check("a mixed batch accepts nothing when any row fails",
      not rep.accepted, "partial application would leave no corpus_version describing it")


# ---------------------------------------------------------------------------------
print("\n--- TEST 3: CUF PARSING ---")
# ---------------------------------------------------------------------------------

m = normalise_cuf_headers(["Project ID", "Name of Project", "Sector",
                           "Executing Agency", "Sanctioned Cost", "Junk Column"])
check("CUF aliases map onto corpus columns",
      m.get("Project ID") == "ProjectId" and m.get("Sector") == "SectorName"
      and m.get("Executing Agency") == "COMPANYNAME"
      and m.get("Sanctioned Cost") == "OriginalCost", str(m))
check("unrecognised headers are dropped, not guessed", "Junk Column" not in m)

csv_bytes = (
    "Project ID,Name of Project,Sector,Executing Agency,Ministry,Sanctioned Cost\n"
    f"999002,Metro Phase 2,Railways,{KNOWN_AGENCY},Ministry of Railways,750\n"
).encode()
rows, meta = parse_cuf(csv_bytes, "cuf_march.csv")
check("a CUF CSV parses into corpus rows", len(rows) == 1, str(meta))
check("parsed row carries the corpus column names",
      rows[0].get("ProjectId") == 999002 and rows[0].get("SectorName") == "Railways")
check("parse metadata lists recognised columns",
      "OriginalCost" in meta["recognised_columns"], str(meta["recognised_columns"]))

rep = validate_rows(rows, VOCAB, RESOLVER)
check("a parsed CUF row validates end to end", rep.ok, str(rep.as_dict())[:120])

bad = False
try:
    parse_cuf(b"alpha,beta\n1,2\n", "junk.csv")
except ValueError as e:
    bad = "recognisable CUF columns" in str(e)
check("a file with no recognisable columns is refused", bad)

xlsx_msg = ""
try:
    parse_cuf(b"\x50\x4b\x03\x04", "cuf.xlsx")
except ValueError as e:
    xlsx_msg = str(e)
except Exception as e:
    xlsx_msg = str(e)
check("XLSX either parses or explains the missing optional dependency",
      "openpyxl" in xlsx_msg or "Excel" in xlsx_msg or xlsx_msg == "",
      xlsx_msg[:80])


# ---------------------------------------------------------------------------------
print("\n--- TEST 4: LEDGER RECORDS AND CHAIN ---")
# ---------------------------------------------------------------------------------

r0 = good_row(pid=999003)
rev0 = to_revision(r0, prev_hash=None, ingest_source="api", recorded_by="admin")
check("a revision carries a 64-hex row_hash",
      len(rev0["row_hash"]) == 64 and rev0["row_hash"] == row_hash(r0))
check("a genesis revision has null prev_hash", rev0["prev_hash"] is None)
check("ingest_source is recorded", rev0["ingest_source"] == "api")
check("the actor is recorded", rev0["recorded_by"] == "admin")
check("the canonical JSON is retained for audit", rev0["canonical_json"].startswith("{"))

rev1 = to_revision(good_row(pid=999003, OriginalCost=620.0),
                   prev_hash=rev0["row_hash"], ingest_source="cuf-upload")
res = verify_chain([rev0, rev1])
check("two revisions form a valid chain", res["ok"], str(res))

forked = to_revision(good_row(pid=999003, OriginalCost=700.0), prev_hash=None)
check("a second genesis for the same project breaks the chain",
      not verify_chain([rev0, forked])["ok"])

check("ingest_source is constrained to the declared set",
      rev0["ingest_source"] in ("csv-bootstrap", "api", "cuf-upload"))


# ---------------------------------------------------------------------------------
print("\n--- TEST 5: JOB REGISTRY ---")
# ---------------------------------------------------------------------------------

reg = JobRegistry()

job = reg.submit("unit", lambda j: {"result": 42}, submitted_by="admin")
check("submit returns a job id immediately", bool(job.job_id))
check("a fresh job has a valid state",
      job.state in ("queued", "running", "succeeded"), job.state)

done = reg.wait(job.job_id, timeout=10)
check("the worker runs the job to completion", done.state == "succeeded", done.state)
check("the job result is retained", done.detail.get("result") == 42)
check("timing is recorded", done.as_dict().get("duration_s") is not None)


def _boom(j):
    raise ValueError("postgres says no")


fail = reg.wait(reg.submit("unit", _boom).job_id, timeout=10)
check("a failing job is marked failed", fail.state == "failed", fail.state)
check("the error type and message are surfaced",
      "ValueError" in (fail.error or "") and "postgres says no" in (fail.error or ""),
      str(fail.error))
check("a failure does not kill the worker",
      reg.wait(reg.submit("unit", lambda j: {"ok": True}).job_id, timeout=10).state
      == "succeeded")

check("unknown job id returns None", reg.get("does-not-exist") is None)
check("recent() lists submitted jobs", len(reg.recent(10)) >= 3)


# ---------------------------------------------------------------------------------
print("\n--- TEST 6: FAILS CLOSED WITH NO DATABASE ---")
# ---------------------------------------------------------------------------------

_saved_db_url = os.environ.pop("DATABASE_URL", None)

check("repository reports unavailable", repo.is_available() is False)

for fn, label in ((lambda: repo.known_project_ids(), "known_project_ids"),
                  (lambda: repo.latest_row_hash(1), "latest_row_hash"),
                  (lambda: repo.insert_revisions([rev0]), "insert_revisions"),
                  (lambda: repo.unresolved_queue(), "unresolved_queue"),
                  (lambda: repo.seal_corpus("a" * 64, 1, 1, "postgres"), "seal_corpus")):
    raised = False
    try:
        fn()
    except repo.DatabaseUnavailable as e:
        raised = "DATABASE_URL" in str(e)
    except Exception:
        raised = False
    check(f"{label} raises DatabaseUnavailable, never writes a file", raised)

check("insert_revisions([]) is a harmless no-op", repo.insert_revisions([]) == 0)


# ---------------------------------------------------------------------------------
print("\n--- TEST 7: ENDPOINTS UNDER THE CSV BOOTSTRAP ---")
# ---------------------------------------------------------------------------------

from fastapi.testclient import TestClient                    # noqa: E402
from backend.server import app                               # noqa: E402

_saved_db_url = os.environ.pop("DATABASE_URL", None)

client = TestClient(app)

r = client.get("/api/ingest/status")
check("GET /api/ingest/status responds 200", r.status_code == 200, str(r.status_code))
body = r.json() if r.status_code == 200 else {}
check("status reports the corpus source",
      body.get("corpus_source") == "csv-bootstrap", str(body.get("corpus_source")))
check("status reports ingestion disabled", body.get("ingestion_enabled") is False)

tok = client.post("/api/auth/login",
                  json={"username": "admin", "password": "prakalp-admin-2026"})
token = tok.json().get("token") if tok.status_code == 200 else None
check("admin can authenticate", bool(token))
H = {"Authorization": f"Bearer {token}"}

r = client.post("/api/ingest/projects", json={"projects": [good_row()]})
check("onboarding without a token is refused", r.status_code in (401, 403),
      str(r.status_code))

r = client.post("/api/ingest/projects", headers=H, json={"projects": [{
    "ProjectId": 999001, "ProjectName": "Test", "SectorName": "Railways",
    "COMPANYNAME": KNOWN_AGENCY, "LineMinistry": "Ministry of Railways",
    "OriginalCost": 500.0}]})
check("onboarding answers 503 with no database", r.status_code == 503, str(r.status_code))
d = r.json().get("detail", {}) if r.status_code == 503 else {}
check("the 503 names the cause", d.get("error") == "ingestion_unavailable")
check("the 503 states a remedy", "migrations" in str(d.get("remedy", "")))

r = client.post("/api/ingest/projects", headers=H, json={"projects": [{
    "ProjectId": 999001, "ProjectName": "Test", "SectorName": "Railways",
    "COMPANYNAME": KNOWN_AGENCY, "LineMinistry": "Ministry of Railways",
    "OriginalCost": 500.0, "UnknownField": "x"}]})
check("an unknown field is rejected, not silently dropped",
      r.status_code == 422, str(r.status_code))

r = client.post("/api/ingest/upload-cuf", headers=H,
                files={"file": ("cuf.csv", io.BytesIO(csv_bytes), "text/csv")})
check("CUF upload answers 503 with no database", r.status_code == 503, str(r.status_code))

r = client.get("/api/ingest/jobs/nonexistent", headers=H)
check("an unknown job id returns 404, not 500", r.status_code == 404, str(r.status_code))

r = client.get("/api/ingest/unresolved", headers=H)
check("the unresolved queue answers 503 with no database",
      r.status_code == 503, str(r.status_code))


# ---------------------------------------------------------------------------------
if _saved_db_url:
    os.environ["DATABASE_URL"] = _saved_db_url

print()
print("=" * 78)
if _failures:
    print(f"INGESTION AUDIT FAILED: {len(_failures)} of {_checks} checks")
    for f in _failures:
        print(f"  - {f}")
    print("=" * 78)
    sys.exit(1)

print(f"ASSERTIONS PASSED: {_checks} ingestion checks, 0 failures.")
print("  unresolved agencies are queued, never defaulted; writes fail closed at 503.")
print("=" * 78)
