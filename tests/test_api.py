import sys
sys.stdout.reconfigure(encoding="utf-8")
import requests

# Test unified simulation with delay shock
r = requests.post("http://127.0.0.1:8000/api/amey/unified-simulation", json={
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
briefing_r = requests.get("http://127.0.0.1:8000/api/amey/briefing/400188")
briefing = briefing_r.json()
doc_hash = briefing["doc_hash"]
first_fact = list(briefing["audit_facts"].keys())[0]
verify_r = requests.get(f"http://127.0.0.1:8000/api/amey/verify/{doc_hash}/{first_fact}?project_id=400188")
vd = verify_r.json()
print(f"\nVerify endpoint: status={verify_r.status_code}")
print(f"  proof_valid: {vd['proof_valid']}")
print(f"  fact_id: {vd['fact_id']}")
print(f"  proof_steps: {vd['proof_steps_count']}")
print(f"  cag_cvc: {vd['cag_cvc_compliance'][:50]}")
