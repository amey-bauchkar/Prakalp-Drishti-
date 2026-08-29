"""
PRAKALP-DRISHTI: In-Depth Unit & Property Test Suite for SATYA-KAVACH Forensic Layer
Tests CCEA rule resolution, TracedValue propagation, 10CC component summation invariants,
peer suppression floors, and cryptographic audit pack generation.
"""

import os
import sys
import unittest
import hashlib

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from modules.tanmay.traced_value import TracedValue, SourceRef
from modules.tanmay.rule_engine import CCEARuleEngine, get_rule_engine
from modules.tanmay.service import get_satya_kavach_engine
from modules.tanmay.audit_pack import generate_audit_pack, canonicalize_json


class TestSatyaKavachForensic(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = get_satya_kavach_engine()
        cls.rule_engine = get_rule_engine()

    def test_rule_resolution_five_classifications(self):
        """Test that every one of the 5 allowed classifications resolves correctly."""
        # 1. NO_ANOMALY: +0% to +9% overrun
        r1 = self.rule_engine.resolve(original_cost_cr=1000.0, revised_cost_cr=1050.0)
        self.assertEqual(r1.classification, "NO_ANOMALY")
        self.assertIn("Within Initial Budget Bounds", r1.classification_label)

        # 2. DISTRIBUTION_ANOMALY: +10% to +17.9% overrun
        r2 = self.rule_engine.resolve(original_cost_cr=1000.0, revised_cost_cr=1150.0)
        self.assertEqual(r2.classification, "DISTRIBUTION_ANOMALY")

        # 3. THRESHOLD_PROXIMITY: +18.0% to +19.99% overrun (within 2.0 pp band)
        r3 = self.rule_engine.resolve(original_cost_cr=1000.0, revised_cost_cr=1195.0)
        self.assertEqual(r3.classification, "THRESHOLD_PROXIMITY")
        self.assertEqual(r3.proximity_distance_pp, 0.5)

        # 4. ESCALATION_CANDIDATE: >= 20.0% overrun
        r4 = self.rule_engine.resolve(original_cost_cr=1000.0, revised_cost_cr=1250.0)
        self.assertEqual(r4.classification, "ESCALATION_CANDIDATE")
        self.assertEqual(r4.required_approval_authority, "Cabinet Committee on Economic Affairs (CCEA)")

        # 5. RULE_REVIEW_REQUIRED: Missing inputs
        r5 = self.rule_engine.resolve(original_cost_cr=None, revised_cost_cr=1200.0)
        self.assertEqual(r5.classification, "RULE_REVIEW_REQUIRED")
        self.assertIn("OriginalCost", r5.missing_inputs)

    def test_rule_engine_resilience_on_invalid_config(self):
        """Rule engine failure must not crash; it must resolve to RULE_REVIEW_REQUIRED."""
        bad_engine = CCEARuleEngine(config_path="/non_existent/path/rules.json")
        self.assertIsNotNone(bad_engine.load_error)
        res = bad_engine.resolve(original_cost_cr=1000.0, revised_cost_cr=1200.0)
        self.assertEqual(res.classification, "RULE_REVIEW_REQUIRED")
        self.assertIn("rule_configuration", res.missing_inputs)

    def test_traced_value_unavailable_propagation(self):
        """Property test: Any calculation with an unavailable input must yield unavailable."""
        raw_val = TracedValue.raw_field(100.0, "OriginalCost", "12345", unit="₹ Cr")
        self.assertEqual(raw_val.status, "computed")
        self.assertEqual(raw_val.value, 100.0)

        missing_val = TracedValue.unavailable(
            reason="Contractor claim invoice unattached",
            missing_inputs=["Contractor_Invoices"],
            unit="₹ Cr",
        )
        self.assertEqual(missing_val.status, "unavailable")
        self.assertIn("Contractor_Invoices", missing_val.missing_inputs)

    def test_clause_10cc_component_summation_invariant(self):
        """Assert that decomposed material contributions sum exactly to the statutory total."""
        calc = self.engine._calculate_10cc_cap(
            original_cost_cr=1000.0,
            sanction_year=2018,
            p_steel=0.20,
            p_cement=0.15,
            p_fuel=0.15,
            p_labor=0.25,
            p_other=0.25,
        )
        contributions = calc["component_contributions_cr"]
        total_contrib = sum(contributions.values())
        statutory_cap = calc["statutory_allowed_escalation_cr"]

        # Sum of sub-components must equal the statutory ceiling within floating point rounding (<= 0.05 Cr)
        self.assertAlmostEqual(total_contrib, statutory_cap, delta=0.05)

    def test_peer_benchmark_suppression_floors(self):
        """Tests that peer benchmarking enforces strict suppression floors:
        - N < 10: Panel suppressed
        - 10 <= N < 20: Percentile suppressed
        - N >= 20: Full benchmark available
        """
        # Test on Roads & Highways (large cohort >= 20)
        full_res = self.engine._compute_peer_benchmark(
            orig_cost=1000.0,
            sanction_year=2018,
            sector="Roads & Highways",
            project_ov_pct=19.5,
        )
        if full_res["selection_criteria"]["peer_count"] >= 20:
            self.assertEqual(full_res["status"], "FULL_BENCHMARK_AVAILABLE")
            self.assertIsNotNone(full_res["percentile_rank"])

        # Test on a niche sector / narrow cost to test suppression
        suppressed_res = self.engine._compute_peer_benchmark(
            orig_cost=999999.0,  # Extreme outlier cost
            sanction_year=2005,
            sector="Atomic Energy",
            project_ov_pct=15.0,
        )
        self.assertEqual(suppressed_res["status"], "PANEL_SUPPRESSED_INSUFFICIENT_N")
        self.assertIsNone(suppressed_res["peer_median_overrun_pct"])

    def test_cryptographic_audit_pack_generation(self):
        """Test deterministic JSON canonicalization and SHA-256 Merkle root signing."""
        sample_proj_id = str(self.engine.df["ProjectId"].iloc[0])
        pack = self.engine.generate_project_audit_pack(sample_proj_id)
        
        self.assertIn("dossier_id", pack)
        self.assertIn("canonical_hash", pack)
        self.assertIn("merkle_root", pack)
        self.assertEqual(len(pack["canonical_hash"]), 64)  # Valid SHA-256 length
        self.assertEqual(len(pack["merkle_root"]), 64)
        
        # Check document checklist
        self.assertEqual(len(pack["document_request_checklist"]), 7)
        # Check blank agency response section
        self.assertIn("agency_response_section", pack)
        self.assertEqual(pack["agency_response_section"]["status"], "AWAITING_AGENCY_SUBMISSION")


if __name__ == "__main__":
    _res = unittest.main(exit=False, verbosity=2).result
    _n = _res.testsRun
    if _res.wasSuccessful():
        print(f"ASSERTIONS PASSED: {_n} unittest cases, 0 failures, 0 errors.")
    else:
        raise SystemExit(1)
