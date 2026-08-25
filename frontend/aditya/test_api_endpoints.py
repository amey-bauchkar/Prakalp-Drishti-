import sys
import os

# Ensure workspace root is at top of sys.path for IDE and module imports
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

from fastapi.testclient import TestClient
from app.main import app
from app.data.mock_projects import MOCK_PROJECTS_DATABASE, CONTRACTORS_DATABASE

client = TestClient(app)

def test_all_endpoints():
    print("\n--- Testing GET /api/v1/health ---")
    res_health = client.get("/api/v1/health")
    assert res_health.status_code == 200, f"Health check failed: {res_health.text}"
    print("Health Status:", res_health.json())

    print("\n--- Testing Contractor Intelligence Database Endpoints ---")
    res_ctrs = client.get("/api/v1/contractors")
    assert res_ctrs.status_code == 200, "Failed to list contractors"
    ctrs_list = res_ctrs.json()
    print(f"Contractors Database Count = {len(ctrs_list)}")

    res_ctr_single = client.get("/api/v1/contractors/CTR-IND-001")
    assert res_ctr_single.status_code == 200, "Failed to fetch single contractor"
    print("Fetched CTR-IND-001:", res_ctr_single.json()["agency_name"])

    res_ctr_eval = client.post("/api/v1/contractors/assess-litigation-index", json={
        "agency_name": "Test Contractors Corp",
        "past_arbitration_count": 5,
        "disputed_variation_value_cr": 200.0,
        "historical_legal_stays": 2,
        "total_active_contract_value_cr": 1000.0
    })
    assert res_ctr_eval.status_code == 200, "Failed contractor assessment endpoint"
    eval_json = res_ctr_eval.json()
    print(f"Contractor Assessment: Index = {eval_json['litigation_exposure_index']}, Tier = {eval_json['risk_tier']}")

    print("\n--- Testing POST /api/v1/nivaran/assess-dispute-risk ---")
    niv_payload = MOCK_PROJECTS_DATABASE["PRJ-NH-2026-089"]["nivaran_request"]
    res_niv = client.post("/api/v1/nivaran/assess-dispute-risk", json=niv_payload)
    assert res_niv.status_code == 200, f"NIVARAN endpoint failed: {res_niv.text}"
    niv_json = res_niv.json()
    print(f"NIVARAN Response: Litigation Prob = {niv_json['litigation_probability']}, Risk Level = {niv_json['dispute_risk_level']}")

    print("\n--- Testing POST /api/v1/anumati/clearance-status ---")
    anu_payload = MOCK_PROJECTS_DATABASE["PRJ-NH-2026-089"]["anumati_request"]
    res_anu = client.post("/api/v1/anumati/clearance-status", json=anu_payload)
    assert res_anu.status_code == 200, f"ANUMATI endpoint failed: {res_anu.text}"
    anu_json = res_anu.json()
    print(f"ANUMATI Response: Overall Status = {anu_json['overall_clearance_status']}, RSI = {anu_json['regulatory_stagnation_index']}")

    print("\n--- Testing GET /api/v1/governance/combined-risk-profile/PRJ-NH-2026-089 ---")
    res_comb = client.get("/api/v1/governance/combined-risk-profile/PRJ-NH-2026-089")
    assert res_comb.status_code == 200, f"Combined endpoint failed: {res_comb.text}"
    comb_json = res_comb.json()
    print(f"Combined Score = {comb_json['overall_administrative_risk_score']}, Category = {comb_json['governance_risk_category']}")

    print("\nALL CONTRACTOR DATABASE & FASTAPI API ENDPOINTS VERIFIED AND WORKING 100%!")

if __name__ == "__main__":
    test_all_endpoints()
