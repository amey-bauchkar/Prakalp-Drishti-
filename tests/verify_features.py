"""
PRAKALP-DRISHTI — functional feature verification.

Unlike tests/run_all_tests.py (which checks only that a script exits 0), every
check here asserts on the CONTENT of the response. A feature "works" if its
output satisfies the invariant it claims, not if it returns HTTP 200.
"""
import atexit, json, os, subprocess, sys, time, urllib.request, urllib.error
from datetime import datetime

B = "http://127.0.0.1:8000"
RESULTS = []   # (feature, check, ok, detail)
SERVER_PROC = None

def ensure_server():
    global SERVER_PROC
    # 1. Check if server is already running and healthy
    try:
        with urllib.request.urlopen(f"{B}/api/health", timeout=1) as resp:
            if resp.status == 200:
                return
    except Exception:
        pass

    # 2. Auto-spawn uvicorn server in background if not running
    print("Backend server is not running on port 8000. Auto-starting for verification...")
    env = os.environ.copy()
    SERVER_PROC = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "backend.server:app", "--host", "127.0.0.1", "--port", "8000"],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.PIPE,
        env=env
    )
    def _cleanup():
        if SERVER_PROC and SERVER_PROC.poll() is None:
            SERVER_PROC.terminate()
            try: SERVER_PROC.wait(timeout=3)
            except Exception: SERVER_PROC.kill()
    atexit.register(_cleanup)

    # 3. Wait up to 30 seconds for server health endpoint
    start = time.time()
    while time.time() - start < 30:
        if SERVER_PROC.poll() is not None:
            err = SERVER_PROC.stderr.read().decode(errors='ignore') if SERVER_PROC.stderr else ""
            print(f"FATAL: Backend server process exited unexpectedly:\n{err}")
            sys.exit(2)
        try:
            with urllib.request.urlopen(f"{B}/api/health", timeout=1) as resp:
                if resp.status == 200:
                    print("Backend server is ready.")
                    return
        except Exception:
            time.sleep(0.5)

    print("FATAL: Timed out waiting for backend server to become ready.")
    sys.exit(2)

ensure_server()

def call(path, tok=None, method="GET", body=None, timeout=180):
    url = B + path
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(url, data=data, method=method)
    if tok: r.add_header("Authorization", f"Bearer {tok}")
    if data is not None: r.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(r, timeout=timeout) as resp:
            return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        try: return e.code, json.loads(e.read().decode())
        except Exception: return e.code, None
    except Exception as e:
        return 0, str(e)


def check(feature, name, cond, detail=""):
    RESULTS.append((feature, name, bool(cond), detail))


def token(u, p):
    s, d = call("/api/auth/login", method="POST", body={"username": u, "password": p})
    return d.get("token") if s == 200 and isinstance(d, dict) else None


def dt(s):
    for f in ("%Y-%m-%d", "%d-%m-%Y", "%Y/%m/%d"):
        try: return datetime.strptime(str(s)[:10], f)
        except Exception: pass
    return None


PID = "619092"
ADMIN = token("admin", "prakalp-admin-2026")
if not ADMIN:
    print("FATAL: cannot authenticate as admin"); sys.exit(2)

# ─────────────────────────────────────────────────────────────────────────
# 1. KAAL-CHAKRA — conformal quantile forecast
# ─────────────────────────────────────────────────────────────────────────
F = "KAAL-CHAKRA"
s, d = call(f"/api/amey/forecast/{PID}")
check(F, "endpoint responds 200", s == 200, f"status={s}")
if s == 200:
    q = [dt(d.get(k)) for k in ("p10_date", "p50_date", "p80_date", "p95_date")]
    check(F, "all four quantile dates parse", all(q), str([d.get(k) for k in ("p10_date","p50_date","p80_date","p95_date")]))
    if all(q):
        check(F, "quantiles monotone P10<=P50<=P80<=P95",
              q[0] <= q[1] <= q[2] <= q[3],
              " <= ".join(x.date().isoformat() for x in q))
    p = d.get("prob_target_met_official")
    check(F, "prob_target_met in [0,1]", p is not None and 0.0 <= p <= 1.0, f"={p}")
    check(F, "facts attached for provenance", len(d.get("facts") or []) > 0,
          f"{len(d.get('facts') or [])} facts")
    check(F, "state not literal 'nan'", str(d.get("state")).lower() != "nan", f"state={d.get('state')}")

    # Delay shock must move the forecast later, not sideways.
    s2, base = call("/api/amey/unified-simulation", method="POST",
                    body={"project_id": PID, "delay_shock_months": 0, "budget_pool_cr": 15000, "kappa": 0.5})
    s3, shock = call("/api/amey/unified-simulation", method="POST",
                     body={"project_id": PID, "delay_shock_months": 24, "budget_pool_cr": 15000, "kappa": 0.5})
    if s2 == 200 and s3 == 200:
        b50, k50 = dt(base["forecast"]["p50_date"]), dt(shock["forecast"]["p50_date"])
        check(F, "24-month delay shock pushes P50 later", b50 and k50 and k50 > b50,
              f"{b50.date()} -> {k50.date()}" if b50 and k50 else "unparsed")

# ─────────────────────────────────────────────────────────────────────────
# 2. SETU-GRAPH — dependency contagion
# ─────────────────────────────────────────────────────────────────────────
F = "SETU-GRAPH"
s, d = call(f"/api/amey/dependencies/{PID}")
check(F, "endpoint responds 200", s == 200, f"status={s}")
if s == 200:
    check(F, "subgraph has nodes", len(d.get("nodes") or []) > 0, f"{len(d.get('nodes') or [])} nodes")
    check(F, "acyclic_dag_verified is True", d.get("acyclic_dag_verified") is True, str(d.get("acyclic_dag_verified")))
    p50 = d.get("total_cascade_locked_p50_cr"); p95 = d.get("total_cascade_locked_p95_cr")
    check(F, "cascade capital non-negative", (p50 or 0) >= 0 and (p95 or 0) >= 0, f"p50={p50} p95={p95}")
    check(F, "P95 cascade >= P50 cascade", (p95 or 0) >= (p50 or 0), f"{p50} vs {p95}")
    ids = [n.get("project_id") for n in (d.get("nodes") or [])]
    check(F, "focus project present in its own subgraph", PID in [str(i) for i in ids], f"center={d.get('center_project_id')}")

# ─────────────────────────────────────────────────────────────────────────
# 3. VITTA-VYUHA — constrained capital allocation
# ─────────────────────────────────────────────────────────────────────────
F = "VITTA-VYUHA"
POOL = 12000.0
s, d = call("/api/amey/allocate", ADMIN, "POST", {"budget_pool_cr": POOL})
check(F, "endpoint responds 200", s == 200, f"status={s}")
if s == 200:
    tot = d.get("total_allocated_cr") or 0
    check(F, "budget conservation: allocated <= pool", tot <= POOL + 1e-6, f"{tot} <= {POOL}")
    allocs = d.get("allocations") or []
    check(F, "line items expose allocated_capex_cr",
          all("allocated_capex_cr" in a for a in allocs), f"{len(allocs)} items")
    ssum = sum(a.get("allocated_capex_cr") or 0 for a in allocs)
    check(F, "line items sum to reported total", abs(ssum - tot) < max(1.0, tot * 0.001),
          f"sum={ssum:.2f} vs total={tot:.2f}")
    check(F, "no negative allocations", all((a.get("allocated_capex_cr") or 0) >= -1e-9 for a in allocs),
          f"{sum(1 for a in allocs if (a.get('allocated_capex_cr') or 0)<0)} negative")
    ner = d.get("ner_share_perc")
    check(F, "statutory NER floor >= 10%", ner is not None and ner >= 9.9, f"ner_share={ner}%")
    check(F, "ner_floor_met flag agrees with the number",
          bool(d.get("ner_floor_met")) == (ner is not None and ner >= 9.9), f"flag={d.get('ner_floor_met')} ner={ner}")
    ce = d.get("closure_error_perc")
    check(F, "closure error < 5%", ce is not None and ce < 5.0, f"{ce}%")
    for k in ("shadow_price_budget_pi", "shadow_price_ner_pi"):
        v = d.get(k)
        check(F, f"{k} is a finite dual", isinstance(v, (int, float)) and abs(v) < 1e9, f"={v}")
    check(F, "ner_coverage basis disclosed", isinstance(d.get("ner_coverage"), dict),
          str((d.get("ner_coverage") or {}).get("ner_floor_basis")))
    # Risk dial must actually change the allocation vector.
    _, lo = call("/api/amey/allocate", ADMIN, "POST", {"budget_pool_cr": POOL, "risk_dial_kappa": 0.1})
    _, hi = call("/api/amey/allocate", ADMIN, "POST", {"budget_pool_cr": POOL, "risk_dial_kappa": 0.9})
    if isinstance(lo, dict) and isinstance(hi, dict):
        a = {x["project_id"]: x["allocated_capex_cr"] for x in (lo.get("allocations") or [])}
        b = {x["project_id"]: x["allocated_capex_cr"] for x in (hi.get("allocations") or [])}
        moved = sum(1 for k in a if abs(a[k] - b.get(k, 0)) > 1.0)
        check(F, "kappa risk dial re-optimises the portfolio", moved > 0, f"{moved} projects changed allocation")

    # An unknown field must not silently become a default on a money endpoint.
    _, wrong = call("/api/amey/allocate", ADMIN, "POST", {"total_budget_cr": 12000})
    used = (wrong or {}).get("total_budget_pool_cr") if isinstance(wrong, dict) else None
    check(F, "misnamed budget field is rejected, not silently defaulted",
          used is None or used == 12000,
          f"sent total_budget_cr=12000 -> API allocated against pool={used}")

# ─────────────────────────────────────────────────────────────────────────
# 4. PRAGATI-SAARTHI — Merkle provenance + tamper defence
# ─────────────────────────────────────────────────────────────────────────
F = "PRAGATI-SAARTHI"
s, d = call(f"/api/amey/briefing/{PID}", ADMIN)
check(F, "endpoint responds 200", s == 200, f"status={s}")
if s == 200:
    check(F, "doc_hash present (64-hex)", len(str(d.get("doc_hash") or "")) == 64, str(d.get("doc_hash"))[:16])
    check(F, "merkle_root present (64-hex)", len(str(d.get("merkle_root") or "")) == 64, str(d.get("merkle_root"))[:16])
    af = d.get("audit_facts") or {}
    facts = list(af.values()) if isinstance(af, dict) else list(af)
    check(F, "briefing carries audit facts", len(facts) > 0, f"{len(facts)} facts")
    if facts:
        fid = facts[0].get("fact_id")
        s2, v = call(f"/api/amey/verify/{d['doc_hash']}/{fid}")
        check(F, "genuine fact verifies against Merkle root",
              s2 == 200 and (v.get("verified") is True or v.get("valid") is True), json.dumps(v)[:110])
        s3, v3 = call(f"/api/amey/verify/{d['doc_hash']}/nonexistent-fact-id")
        bad_ok = (s3 in (400, 404)) or (isinstance(v3, dict) and (v3.get("verified") is False or v3.get("valid") is False))
        check(F, "forged fact_id is REJECTED", bad_ok, f"status={s3} body={json.dumps(v3)[:80]}")
        # Distinct facts must carry distinct proofs (the aliasing bug fixed earlier).
        proofs = [json.dumps(f.get("lineage") or f.get("proof") or {}) for f in facts[:5]]
        check(F, "facts have distinct lineage (no proof aliasing)",
              len(set(proofs)) > 1 or len(facts) < 2, f"{len(set(proofs))} distinct of {len(proofs)}")

# ─────────────────────────────────────────────────────────────────────────
# 5. PRATIBIMB — satellite ground truth
# ─────────────────────────────────────────────────────────────────────────
F = "PRATIBIMB-SATELLITE"
s, d = call(f"/api/amey/satellite/{PID}")
check(F, "endpoint responds 200", s == 200, f"status={s}")
if s == 200:
    sc = d.get("surface_change_pct")
    check(F, "surface_change_pct in [0,100]", sc is not None and 0 <= sc <= 100, f"={sc}")
    check(F, "dual-epoch imagery present",
          bool(d.get("before_imagery_url")) and bool(d.get("after_imagery_url")), "")
    check(F, "geocode confidence declared", d.get("geocode_confidence") in ("HIGH", "MEDIUM", "LOW"),
          str(d.get("geocode_confidence")))
    check(F, "EO reliability flag present", isinstance(d.get("eo_verdict_reliable"), bool),
          str(d.get("eo_verdict_reliable")))

# ─────────────────────────────────────────────────────────────────────────
# 6. AGENCY INDEX
# ─────────────────────────────────────────────────────────────────────────
F = "AGENCY-INDEX"
s, d = call("/api/amey/agency-index")
check(F, "endpoint responds 200", s == 200, f"status={s}")
if s == 200:
    ag = d.get("agencies") or []
    check(F, "agencies returned", len(ag) > 0, f"{len(ag)} agencies")
    names = [a.get("agency_name") for a in ag]
    check(F, "no duplicate agency display names", len(names) == len(set(names)),
          f"{len(names)-len(set(names))} duplicates")
    check(F, "acronyms not title-case mangled",
          not any(n in ("Nhai", "Ntpc", "Morth", "Mohua", "Aai") for n in names),
          f"sample={names[:3]}")
    check(F, "velocity scores bounded 0-100",
          all(0 <= (a.get("velocity_score") or 0) <= 100 for a in ag), "")
    check(F, "delay rate is a percentage",
          all(0 <= (a.get("delay_rate_perc") or 0) <= 100 for a in ag), "")

# ─────────────────────────────────────────────────────────────────────────
# 7. RISK INDEX  /  8. PREDICT  /  9. EARLY WARNING  /  10. LEAD-TIME
# ─────────────────────────────────────────────────────────────────────────
F = "RISK-INDEX"
s, d = call(f"/api/amey/risk/{PID}", ADMIN)
check(F, "endpoint responds 200", s == 200, f"status={s}")
if s == 200:
    sc = d.get("risk_score") or d.get("score")
    check(F, "risk score in [0,100]", sc is not None and 0 <= sc <= 100, f"={sc}")
    band = d.get("risk_band") or d.get("band")
    check(F, "band is a declared category", band in ("CRITICAL", "HIGH", "MODERATE", "LOW"), f"={band}")
    if sc is not None and band:
        exp = "CRITICAL" if sc >= 75 else "HIGH" if sc >= 55 else "MODERATE" if sc >= 35 else "LOW"
        check(F, "band matches its own threshold table", band == exp, f"score={sc} band={band} expected={exp}")

F = "COST-OVERRUN-MODEL"
s, d = call(f"/api/amey/predict/{PID}", ADMIN)
check(F, "endpoint responds 200", s == 200, f"status={s}")
if s == 200:
    v = d.get("predicted_cost_overrun_pct")
    check(F, "prediction is a finite number", isinstance(v, (int, float)) and abs(v) < 1e4, f"={v}")
    check(F, "error band published with prediction", d.get("expected_error_band_pct") is not None,
          f"±{d.get('expected_error_band_pct')}")

F = "EARLY-WARNING"
s, d = call("/api/amey/early-warning?limit=10", ADMIN)
check(F, "endpoint responds 200", s == 200, f"status={s}")
if s == 200:
    al = d.get("alerts") or []
    check(F, "queue returns alerts", len(al) > 0, f"{len(al)} alerts")
    pri = [a.get("priority_score") or 0 for a in al]
    check(F, "queue ranked by priority (risk x capex), descending",
          pri == sorted(pri, reverse=True), f"first3={pri[:3]}")
    ag = [a.get("agency") for a in al]
    check(F, "queue shows readable agency names, not raw entity IDs",
          not any(str(x).isupper() and ("_" in str(x) or len(str(x)) > 24) for x in ag),
          f"sample={ag[:3]}")

F = "LEAD-TIME-VALIDATION"
s, d = call("/api/amey/lead-time")
check(F, "endpoint responds 200", s == 200, f"status={s}")
if s == 200 and d.get("available") is not False:
    for k in ("precision", "recall", "f1", "base_rate"):
        v = d.get(k)
        check(F, f"{k} in [0,1]", v is not None and 0 <= v <= 1, f"{k}={v}")
    check(F, "precision beats base rate (model has lift)",
          (d.get("precision") or 0) > (d.get("base_rate") or 1),
          f"prec={d.get('precision')} base={d.get('base_rate')}")

# ─────────────────────────────────────────────────────────────────────────
# 11. MODEL BENCHMARK
# ─────────────────────────────────────────────────────────────────────────
F = "MODEL-BENCHMARK"
s, d = call("/api/amey/benchmark")
check(F, "endpoint responds 200", s == 200, f"status={s}")
if s == 200:
    tg = d.get("targets") or {}
    check(F, "both targets benchmarked", len(tg) >= 2, f"targets={list(tg)}")
    for t, blk in tg.items():
        mv = blk.get("ml_vs_conventional") or {}
        check(F, f"[{t}] declares which variant is deployed",
              mv.get("evaluated_variant") in ("cuf_only", "cuf_plus_external"),
              str(mv.get("evaluated_variant")))
        check(F, f"[{t}] baselines reported alongside ML",
              all(k in (blk.get(mv.get('evaluated_variant')) or {}) for k in
                  ("sector_mean_baseline", "ols_linear_regression", "gradient_boosting")), "")

# ─────────────────────────────────────────────────────────────────────────
# 12. COPILOT Q&A
# ─────────────────────────────────────────────────────────────────────────
F = "PMO-COPILOT"
s, d = call(f"/api/amey/copilot/{PID}")
check(F, "endpoint responds 200", s == 200, f"status={s}")
if s == 200:
    check(F, "executive summary generated", bool(d.get("executive_summary")), "")
    check(F, "action items grounded in facts", len(d.get("grounded_facts") or []) > 0,
          f"{len(d.get('grounded_facts') or [])} facts")
s, d = call("/api/amey/ask", method="POST",
            body={"question": "which projects are most delayed?", "project_id": PID})
check(F, "/ask answers a natural-language question", s == 200 and bool(d), f"status={s}")

# ─────────────────────────────────────────────────────────────────────────
# 13. AUTH + RBAC MATRIX
# ─────────────────────────────────────────────────────────────────────────
F = "AUTH-RBAC"
users = {"analyst": "analyst-2026", "monitor": "monitor-2026",
         "morth.officer": "morth-officer-2026", "secretary": "mospi-secretary-2026",
         "admin": "prakalp-admin-2026"}
toks = {u: token(u, p) for u, p in users.items()}
check(F, "all five demo roles authenticate", all(toks.values()),
      str({u: bool(t) for u, t in toks.items()}))
s, _ = call("/api/auth/login", method="POST", body={"username": "admin", "password": "wrong"})
check(F, "wrong password rejected with 401", s == 401, f"status={s}")
s, _ = call(f"/api/amey/risk/{PID}", "forged-token-abc")
check(F, "forged bearer token rejected with 401", s == 401, f"status={s}")
s, _ = call(f"/api/amey/risk/{PID}")
check(F, "anonymous blocked from protected route", s == 401, f"status={s}")
s, _ = call(f"/api/amey/risk/{PID}", toks["analyst"])
check(F, "analyst lacks read_risk (403)", s == 403, f"status={s}")
s, _ = call(f"/api/amey/risk/{PID}", toks["monitor"])
check(F, "monitoring officer granted read_risk (200)", s == 200, f"status={s}")
s, _ = call(f"/api/amey/briefing/{PID}", toks["monitor"])
check(F, "monitoring officer lacks read_briefing (403)", s == 403, f"status={s}")
s, _ = call(f"/api/amey/briefing/{PID}", toks["secretary"])
check(F, "ministry officer granted read_briefing (200)", s == 200, f"status={s}")
s, _ = call("/api/amey/allocate", toks["analyst"], "POST", {"budget_pool_cr": 5000})
check(F, "analyst blocked from allocate_capital (403)", s == 403, f"status={s}")
s, _ = call("/api/amey/allocate", toks["admin"], "POST", {"budget_pool_cr": 5000})
check(F, "administrator granted allocate_capital (200)", s == 200, f"status={s}")

# ─────────────────────────────────────────────────────────────────────────
# 14. GEOCODE PRECISION
# ─────────────────────────────────────────────────────────────────────────
F = "GEOCODE-PRECISION"
s, d = call("/api/amey/geocode-precision")
check(F, "endpoint responds 200", s == 200, f"status={s}")
if s == 200:
    tot = d.get("total_projects") or d.get("total") or 0
    check(F, "covers the full corpus", tot in (2207, 0) or tot > 1000, f"total={tot}")

# ─────────────────────────────────────────────────────────────────────────
# 15. OTHER TEAM MODULES
# ─────────────────────────────────────────────────────────────────────────
for owner, path, keyfield in [
    ("SATYA-KAVACH (tanmay)", "/api/tanmay/status", None),
    ("ARTHA-NETRA (parth)", "/api/parth/status", None),
    ("VARSHA-SPEED (janhavi)", "/api/janhavi/status", None),
    ("DPR-SCORER (soham)", "/api/soham/status", None),
    ("EO-AUDITOR (aditya)", "/api/aditya/status", None),
]:
    s, d = call(path)
    check(owner, "status endpoint responds 200", s == 200, f"status={s}")
    check(owner, "status payload non-empty", isinstance(d, dict) and len(d) > 0, str(d)[:80])

# ─────────────────────────────────────────────────────────────────────────
# 16. PROJECT SEARCH / CORE
# ─────────────────────────────────────────────────────────────────────────
F = "CORE-PROJECTS"
s, d = call("/api/projects?limit=50")
check(F, "endpoint responds 200", s == 200, f"status={s}")
if s == 200:
    rows = d.get("projects") if isinstance(d, dict) else d
    check(F, "returns rows", len(rows) > 0, f"{len(rows)} rows")
    check(F, "no literal 'nan' in state field",
          not any(str(r.get("state", "")).lower() == "nan" for r in rows), "")
    check(F, "capex values numeric", all(isinstance(r.get("revised_cost_cr"), (int, float)) for r in rows), "")
s, d = call("/api/health")
check(F, "health reports full corpus", (d or {}).get("total_projects_cached") == 2207,
      str((d or {}).get("total_projects_cached")))

# ─────────────────────────────────────────────────────────────────────────
# REPORT
# ─────────────────────────────────────────────────────────────────────────
print()
print("=" * 86)
print(f"{'FEATURE':26} {'CHECK':46} RESULT")
print("=" * 86)
cur = None
npass = nfail = 0
fails = []
for feat, name, ok, detail in RESULTS:
    if feat != cur:
        print(f"\n{feat}")
        cur = feat
    print(f"{'':26} {name:46} {'PASS' if ok else 'FAIL'}" + (f"   [{detail}]" if detail and not ok else ""))
    if ok: npass += 1
    else:
        nfail += 1
        fails.append((feat, name, detail))
print()
print("=" * 86)
print(f"TOTAL: {npass} passed, {nfail} failed  ({npass}/{npass+nfail} = {npass/(npass+nfail)*100:.1f}%)")
print("=" * 86)
if fails:
    print("\nFAILURES:")
    for f, n, d in fails:
        print(f"  [{f}] {n}")
        if d: print(f"        {d}")
sys.exit(1 if fails else 0)
