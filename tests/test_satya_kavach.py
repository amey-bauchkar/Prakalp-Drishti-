"""
PRAKALP-DRISHTI: Test Suite for Tanmay's Module (SATYA-KAVACH)
Tests Boundary Bin-Mass Ratio calculations, 20% CCEA threshold proximity,
cost-overrun histogram, CPWD Clause 10CC statutory formula verification, and project dossier inspection.
"""

import os
import sys
import unittest

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from modules.tanmay.service import get_satya_kavach_engine


class TestSatyaKavach(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = get_satya_kavach_engine()

    def test_engine_initialization(self):
        self.assertIsNotNone(self.engine.df)
        self.assertGreater(len(self.engine.df), 1000)
        self.assertTrue(self.engine.fitted)

    def test_boundary_analysis_summary(self):
        summary = self.engine.get_boundary_analysis()
        self.assertEqual(summary["module"], "SATYA-KAVACH")
        self.assertEqual(summary["module_lead"], "Tanmay")

        # Check Boundary Bin-Mass Ratio and 95% CI
        signal = summary["mccrary_bunching_signal"]
        self.assertGreater(signal["boundary_bin_mass_ratio"], 1.0)
        self.assertEqual(signal["numerator_count"], 28)
        self.assertEqual(signal["denominator_count"], 17)
        self.assertIn("interpretation", signal)
        self.assertIn("confidence_interval_95", signal)

        # Check KPIs
        kpis = summary["kpi_metrics"]
        self.assertEqual(kpis["projects_in_bunching_zone_18_20pct"], 28)
        self.assertEqual(kpis["projects_in_comparison_zone_20_22pct"], 17)
        self.assertEqual(kpis["active_revised_projects"], 1183)
        self.assertEqual(kpis["no_revision_on_file_projects"], 1024)
        self.assertGreater(kpis["bunching_zone_capital_cr"], 1000.0)

        # Check flagged sample projects
        flagged = summary["flagged_sample_projects"]
        self.assertGreater(len(flagged), 0)
        for p in flagged:
            self.assertGreaterEqual(p["overrun_pct"], 18.0)
            self.assertLess(p["overrun_pct"], 20.0)
            self.assertGreater(p["distance_to_boundary_pp"], 0.0)
            self.assertLessEqual(p["distance_to_boundary_pp"], 2.0)
            self.assertEqual(p["classification"], "THRESHOLD_PROXIMITY")

    def test_bunching_histogram(self):
        hist = self.engine.get_bunching_histogram_data()
        bins = hist["bins"]
        self.assertGreater(len(bins), 5)

        # Verify bunching spike bin exists
        spike_bin = next((b for b in bins if b["is_bunching_spike"]), None)
        self.assertIsNotNone(spike_bin)
        self.assertEqual(spike_bin["range_min"], 18.0)
        self.assertEqual(spike_bin["range_max"], 20.0)
        self.assertEqual(spike_bin["project_count"], 28)

        # Population metadata
        meta = hist["population_metadata"]
        self.assertEqual(meta["active_revised_count"], 1183)
        self.assertEqual(meta["excluded_no_revision_count"], 1024)

    def test_clause_10cc_audit(self):
        report = self.engine.get_clause_10cc_audit_report(limit=20)
        self.assertEqual(report["statutory_escalable_cap_pct"], 85.0)
        self.assertEqual(report["fixed_contractor_overhead_pct"], 15.0)
        self.assertGreater(len(report["audited_records"]), 0)
        self.assertIn("statutory_10cc_allowed_cr", report["audited_records"][0])

    def test_clause_10cc_simulation(self):
        sim = self.engine.simulate_clause_10cc(
            original_cost_cr=1000.0,
            sanction_year=2018,
            revised_cost_cr=1195.0,  # +19.5% overrun (bunching zone)
            p_steel=0.20,
            p_cement=0.15,
            p_fuel=0.15,
            p_labor=0.25,
            p_other=0.25,
        )
        self.assertEqual(sim["inputs"]["original_cost_cr"], 1000.0)
        self.assertEqual(sim["claimed_overrun_pct"], 19.5)
        self.assertTrue(sim["is_ccea_threshold_evasion"])
        self.assertGreater(sim["statutory_allowed_escalation_cr"], 0.0)

    def test_project_dossier_inspection(self):
        sample_pid = str(self.engine.df[self.engine.df["OverrunPct"] >= 18.0]["ProjectId"].iloc[0])
        dossier = self.engine.get_project_dossier(sample_pid)
        self.assertEqual(dossier["status"], "success")
        self.assertEqual(dossier["project_id"], sample_pid)
        self.assertIn("costs", dossier)
        self.assertIn("boundary", dossier)
        self.assertIn("revision_history", dossier)
        self.assertIn("clause_10cc", dossier)
        self.assertIn("methodological_note", dossier)


if __name__ == "__main__":
    _res = unittest.main(exit=False, verbosity=2).result
    _n = _res.testsRun
    if _res.wasSuccessful():
        print(f"ASSERTIONS PASSED: {_n} unittest cases, 0 failures, 0 errors.")
    else:
        raise SystemExit(1)
