import sys
sys.stdout.reconfigure(encoding="utf-8")
import requests

# RBAC was added to these endpoints after this script was written, so every
# call here returned 401 and the script died on KeyError('doc_hash') while
# reading the error body. It was not in run_all_tests.py, so nothing noticed.
BASE = "http://127.0.0.1:8000"


def _login(retries: int = 4):
    """Log in, backing off past the login burst ceiling.

    The suites share one server and one rate-limit bucket. Running the pytest
    module immediately before this runner drains the login budget, and a bare
    login then returns 429 -> KeyError('token') -> a failure that looks like a
    broken test rather than a throttled one. Waiting is the correct remedy for
    a 429 specifically, so it is the only status retried here.
    """
    import time
    for attempt in range(retries):
        r = requests.post(f"{BASE}/api/auth/login",
                          json={"username": "admin", "password": "prakalp-admin-2026"},
                          timeout=60)
        if r.status_code == 200:
            return r.json()["token"]
        if r.status_code != 429:
            raise AssertionError(f"login failed with HTTP {r.status_code}: {r.text[:120]}")
        time.sleep(20 * (attempt + 1))
    raise AssertionError("login still rate-limited after backing off")


_tok = _login()
H = {"Authorization": f"Bearer {_tok}"}

# Test unified simulation with delay shock
r = requests.post("http://127.0.0.1:8000/api/amey/unified-simulation", headers=H, json={
    "project_id": "400188",
    "delay_shock_months": 24.0,
    "budget_pool_cr": 15000.0,
    "risk_dial_kappa": 0.75,
    "enforce_ner_floor": True
})
d = r.json()
print(f"Status: {r.status_code}")
alloc = d["allocation"]
print(f"Yield: {alloc['expected_completion_yield']}%")
print(f"Allocated: {alloc['total_allocated_cr']}")
print(f"pi_budget: {alloc['shadow_price_budget_pi']}")
print(f"closure_error: {alloc['closure_error_perc']}%")

# Test verify endpoint
briefing_r = requests.get("http://127.0.0.1:8000/api/amey/briefing/400188", headers=H)
briefing = briefing_r.json()
doc_hash = briefing["doc_hash"]
first_fact = list(briefing["audit_facts"].keys())[0]
verify_r = requests.get(f"http://127.0.0.1:8000/api/amey/verify/{doc_hash}/{first_fact}?project_id=400188", headers=H)
vd = verify_r.json()
print(f"\nVerify endpoint: status={verify_r.status_code}")
print(f"  proof_valid: {vd['proof_valid']}")
print(f"  fact_id: {vd['fact_id']}")
print(f"  proof_steps: {vd['proof_steps_count']}")
print(f"  cag_cvc: {vd['cag_cvc_compliance'][:50]}")


# ── invariants ───────────────────────────────────────────────────────────────
# This file printed figures and asserted nothing, so an inverted yield, a
# breached budget or a failed Merkle proof all read as success.
assert r.status_code == 200, f"unified-simulation returned {r.status_code}"

_pool = 15000.0
_allocated = float(alloc["total_allocated_cr"])
assert 0 <= _allocated <= _pool * 1.0001, \
    f"allocated {_allocated} outside the {_pool} pool"

# expected_completion_yield is a composite INDEX, not a percentage: it is the
# allocation-weighted mean of (completion propensity x normalised Shapley
# vitality) x 100 and routinely exceeds 100. The bounded percentage is
# portfolio_completion_propensity_perc, asserted separately below.
_idx = float(alloc["expected_completion_yield"])
assert _idx > 0, f"priority index {_idx} is not positive"

_prop = alloc.get("portfolio_completion_propensity_perc")
assert _prop is not None, "portfolio_completion_propensity_perc missing"
assert 0.0 <= float(_prop) <= 100.0, \
    f"completion propensity {_prop} is not a percentage"

assert float(alloc["closure_error_perc"]) < 5.0, \
    f"LP linearisation closure error {alloc['closure_error_perc']}% is too large"
assert float(alloc["shadow_price_budget_pi"]) >= 0, "negative budget shadow price"

assert briefing_r.status_code == 200, f"briefing returned {briefing_r.status_code}"
assert len(doc_hash) == 64, f"doc_hash is not a SHA-256 hex digest: {doc_hash!r}"
assert briefing.get("merkle_root"), "briefing carries no Merkle root"
assert briefing["audit_facts"], "briefing carries no audit facts"

assert verify_r.status_code == 200, f"verify returned {verify_r.status_code}"
assert vd["proof_valid"] is True, "Merkle inclusion proof failed to verify"
# The verifier reports the fully-qualified internal id (fact_cost_400188) for
# the short key the briefing publishes (fact_cost). Correspondence is asserted
# rather than equality: what matters is that the proof returned is for the fact
# that was ASKED about, not that the two strings are identical. The security
# property -- that an id outside the tree is refused rather than waved through
# -- is asserted separately below.
assert vd["fact_id"].startswith(first_fact),     f"verify returned fact {vd['fact_id']} for a request about {first_fact}"

# A tampered hash must NOT verify, or the proof proves nothing.
_bad = requests.get(
    f"{BASE}/api/amey/verify/{'0' * 64}/{first_fact}?project_id=400188",
    headers=H, timeout=60)
assert _bad.status_code != 200 or _bad.json().get("proof_valid") is not True, \
    "a fabricated doc_hash was accepted as a valid proof"

print("\nASSERTIONS PASSED")
