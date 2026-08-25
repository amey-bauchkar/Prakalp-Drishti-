"""
PRAKALP-DRISHTI Verification & Test Suite
Validates NIVARAN and ANUMATI engines offline with zero mock placeholder errors.
"""

import sys
import os

# Ensure workspace root is at top of sys.path for IDE and module imports
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

# Ensure UTF-8 output encoding for Windows console
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

from app.modules.nivaran import nivaran_service
from app.modules.anumati import anumati_service
from app.schemas.nivaran_schema import DisputeRiskAssessmentRequest
from app.schemas.anumati_schema import ClearanceStatusRequest
from app.data.mock_projects import MOCK_PROJECTS_DATABASE


def test_nivaran_engine():
    print("\n=======================================================")
    print("      TESTING MODULE 1: NIVARAN RISK ENGINE            ")
    print("=======================================================")
    
    project_id = "PRJ-NH-2026-089"
    data = MOCK_PROJECTS_DATABASE[project_id]["nivaran_request"]
    request = DisputeRiskAssessmentRequest(**data)

    response = nivaran_service.assess_project_dispute_risk(request)

    print(f"Project ID: {response.project_id}")
    print(f"Clause Risk Score: {response.clause_risk_score} / 1.0")
    print(f"Contractor Litigation Index: {response.contractor_litigation_index} / 100.0")
    print(f"Litigation Probability: {response.litigation_probability:.2f}")
    print(f"Dispute Risk Level: {response.dispute_risk_level}")
    print(f"Flagged Clauses Count: {len(response.flagged_clauses)}")
    for idx, fc in enumerate(response.flagged_clauses, 1):
        print(f"  [{idx}] {fc.clause_title} ({fc.severity}) - Score: {fc.clause_risk_score}")
        print(f"      Snippet: \"{fc.snippet[:100]}...\"")
    print(f"Recommended Preemptive Action: {response.recommended_preemptive_action}")

    # Assertions
    assert response.clause_risk_score > 0.0, "Clause risk score should be > 0"
    assert response.dispute_risk_level in ["LOW", "MEDIUM", "HIGH", "CRITICAL"], "Invalid risk level"
    assert len(response.flagged_clauses) > 0, "Expected at least 1 flagged clause in demo DPR"
    print(">>> NIVARAN ENGINE TEST PASSED SUCCESSFULLY!")


def test_anumati_engine():
    print("\n=======================================================")
    print("      TESTING MODULE 2: ANUMATI CLEARANCE TRACKER     ")
    print("=======================================================")
    
    project_id = "PRJ-NH-2026-089"
    data = MOCK_PROJECTS_DATABASE[project_id]["anumati_request"]
    request = ClearanceStatusRequest(**data)

    response = anumati_service.process_clearance_status(request)

    print(f"Project ID: {response.project_id}")
    print(f"Overall Clearance Status: {response.overall_clearance_status}")
    print(f"Regulatory Stagnation Index (RSI): {response.regulatory_stagnation_index:.2f}")
    print(f"Bottleneck Department: {response.bottleneck_department}")
    print(f"Days Overdue: {response.days_overdue}")
    print(f"Paperwork Loopbacks Detected: {response.paperwork_loopbacks_detected}")
    print(f"PMO Escalation Flag: {response.pmo_escalation_flag}")
    print(f"Economic Impact Delay Risk: {response.economic_impact_delay_risk}")
    print(f"Recommended Escalation Memo:\n{response.recommended_escalation_memo}")

    print("\n5-Stage Clearance Breakdown:")
    for stage in response.stage_breakdown:
        loop_str = " [PAPERWORK LOOPBACK DETECTED]" if stage.paperwork_loopback_detected else ""
        print(f"  - {stage.stage_name} ({stage.department})")
        print(f"    Pending: {stage.days_pending} days | Benchmark: {stage.benchmark_days} days | RSI Ratio: {stage.stagnation_ratio}{loop_str}")

    # Assertions
    assert response.overall_clearance_status in ["APPROVED", "IN_PROGRESS", "STALLED"], "Invalid clearance status"
    assert response.regulatory_stagnation_index > 0.0, "RSI score should be > 0"
    assert response.paperwork_loopbacks_detected is True, "Expected paperwork loopback in demo project"
    assert response.pmo_escalation_flag is True, "Expected PMO escalation flag"
    print(">>> ANUMATI ENGINE TEST PASSED SUCCESSFULLY!")


if __name__ == "__main__":
    print("Starting PRAKALP-DRISHTI Engine Validation Suite...")
    test_nivaran_engine()
    test_anumati_engine()
    print("\nALL MODULE VERIFICATION TESTS PASSED WITH ZERO ERRORS!")
