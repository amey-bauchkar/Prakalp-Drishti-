"""
PRAKALP-DRISHTI: Test Suite for Tanmay's Module (SATYA-KAVACH)
Tests McCrary density discontinuity calculations, 20% CCEA threshold bunching,
CPWD Clause 10CC statutory formula verification, and agency risk profiling.
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

    def test_anti_gaming_summary(self):
        summary = self.engine.get_anti_gaming_summary()
        self.assertEqual(summary["module"], "SATYA-KAVACH")
        self.assertEqual(summary["module_lead"], "Tanmay")
        
        # Check McCrary bunching signal
        mccrary = summary["mccrary_bunching_signal"]
        self.assertGreater(mccrary["density_ratio"], 1.0)
        self.assertLess(mccrary["p_value"], 0.05)
        
        # Check KPIs
        kpis = summary["kpi_metrics"]
        self.assertGreater(kpis["projects_in_bunching_zone_18_20pct"], 10)
        self.assertGreater(kpis["projects_above_20pct_cabinet_rule"], 50)
        self.assertGreater(kpis["bunching_zone_capital_cr"], 1000.0)
        
        # Check flagged sample projects
        flagged = summary["flagged_sample_projects"]
        self.assertGreater(len(flagged), 0)
        for p in flagged:
            self.assertGreaterEqual(p["overrun_pct"], 18.0)
            self.assertLess(p["overrun_pct"], 20.0)
            self.assertGreater(p["evasion_margin_pct"], 0.0)
            self.assertLessEqual(p["evasion_margin_pct"], 2.0)
            self.assertEqual(p["risk_flag"], "HIGH_PROBABILITY_CCEA_EVASION")

    def test_bunching_histogram(self):
        hist = self.engine.get_bunching_histogram_data()
        bins = hist["bins"]
        self.assertGreater(len(bins), 5)
        
        # Verify bunching spike bin exists
        spike_bin = next((b for b in bins if b["is_bunching_spike"]), None)
        self.assertIsNotNone(spike_bin)
        self.assertEqual(spike_bin["range_min"], 18.0)
        self.assertEqual(spike_bin["range_max"], 20.0)
        self.assertGreater(spike_bin["project_count"], 0)

    def test_clause_10cc_audit(self):
        report = self.engine.get_clause_10cc_audit_report(limit=20)
        self.assertEqual(report["statutory_escalable_cap_pct"], 85.0)
        self.assertEqual(report["fixed_contractor_overhead_pct"], 15.0)
        self.assertGreater(report["total_portfolio_excess_claimed_cr"], 0.0)
        self.assertGreater(len(report["audited_records"]), 0)

    def test_agency_rankings(self):
        rankings = self.engine.get_agency_gaming_rankings()
        agencies = rankings["rankings"]
        self.assertGreater(len(agencies), 0)
        
        top = agencies[0]
        self.assertIn("agency_name", top)
        self.assertIn("institutional_gaming_score", top)
        self.assertGreaterEqual(top["institutional_gaming_score"], 0.0)

    def test_clause_10cc_simulation(self):
        sim = self.engine.simulate_clause_10cc(
            original_cost_cr=1000.0,
            sanction_year=2018,
            revised_cost_cr=1195.0,  # +19.5% overrun (bunching zone)
            p_steel=0.20,
            p_cement=0.15,
            p_fuel=0.15,
            p_labor=0.25,
            p_other=0.25
        )
        self.assertEqual(sim["inputs"]["original_cost_cr"], 1000.0)
        self.assertEqual(sim["claimed_overrun_pct"], 19.5)
        self.assertTrue(sim["is_ccea_threshold_evasion"])
        self.assertGreater(sim["statutory_allowed_escalation_cr"], 0.0)

if __name__ == "__main__":
    unittest.main()
