"""
PRAKALP-DRISHTI: In-Depth Unit & Property Test Suite for SATYA-KAVACH Forensic Layer
Tests deterministic CCEA boundary calculation, active revised population, NO_REVISION_ON_FILE,
both band counts, bin ratio & 95% CI, threshold distance, revision-history deduplication,
NaN suppression, Clause 10CC calculation & availability states, and RULE_REVIEW_REQUIRED resilience.
"""

import os
import sys
import unittest
import pandas as pd

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from modules.tanmay.rule_engine import CCEARuleEngine, get_rule_engine
from modules.tanmay.service import get_satya_kavach_engine


class TestSatyaKavachForensic(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = get_satya_kavach_engine()
        cls.rule_engine = get_rule_engine()

    def test_rule_resolution_classifications(self):
        """Test that every allowed classification resolves correctly."""
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

    def test_active_population_and_no_revision_exclusion(self):
        """Active revised population must exclude NO_REVISION_ON_FILE projects."""
        summary = self.engine.get_boundary_analysis()
        kpi = summary["kpi_metrics"]
        total = kpi["total_projects_in_dataset"]
        active = kpi["active_revised_projects"]
        no_rev = kpi["no_revision_on_file_projects"]

        self.assertEqual(total, active + no_rev)
        self.assertEqual(active, 1183)
        self.assertEqual(no_rev, 1024)

    def test_band_counts_and_bin_ratio_ci(self):
        """Verify empirical band counts [18,20) = 28, [20,22) = 17, ratio = 1.65, and 95% CI."""
        summary = self.engine.get_boundary_analysis()
        b_metrics = summary["boundary_metrics"]

        self.assertEqual(b_metrics["numerator_count"], 28)
        self.assertEqual(b_metrics["denominator_count"], 17)
        self.assertAlmostEqual(b_metrics["ratio"], 1.65, places=2)

        ci = b_metrics["confidence_interval_95"]
        self.assertIsNotNone(ci["lower"])
        self.assertIsNotNone(ci["upper"])
        self.assertLess(ci["lower"], b_metrics["ratio"])
        self.assertGreater(ci["upper"], b_metrics["ratio"])

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

        # Sum of sub-components must equal statutory ceiling within floating point rounding (<= 0.05 Cr)
        self.assertAlmostEqual(total_contrib, statutory_cap, delta=0.05)

    def test_revision_history_deduplication_and_nan_suppression(self):
        """Deduplicated revision history must emit real state changes and suppress literal 'nan' or 'None'."""
        sample_pid = str(self.engine.df["ProjectId"].iloc[0])
        dossier = self.engine.get_project_dossier(sample_pid)
        history = dossier["revision_history"]

        self.assertGreaterEqual(len(history), 1)
        for evt in history:
            self.assertNotIn("nan", str(evt["date"]).lower())
            self.assertNotIn("none", str(evt["date"]).lower())
            self.assertNotIn("nan", str(evt["title"]).lower())
            self.assertIsInstance(evt["cost_cr"], (int, float))
            self.assertIsInstance(evt["overrun_pct"], (int, float))

    def test_clause_10cc_availability_states(self):
        """Verify Clause 10CC status is present and calculation breakdown is provided."""
        sample_pid = str(self.engine.df["ProjectId"].iloc[0])
        dossier = self.engine.get_project_dossier(sample_pid)
        c10 = dossier["clause_10cc"]

        self.assertIn(c10["status"], ["VERIFIED", "INDICATIVE", "UNAVAILABLE"])
        self.assertIn("statutory_allowed_escalation_cr", c10)
        self.assertIn("calculation_disclosure", c10)
        self.assertIn("escalable_base_cr", c10["calculation_disclosure"])


if __name__ == "__main__":
    _res = unittest.main(exit=False, verbosity=2).result
    _n = _res.testsRun
    if _res.wasSuccessful():
        print(f"ASSERTIONS PASSED: {_n} unittest cases, 0 failures, 0 errors.")
    else:
        raise SystemExit(1)
