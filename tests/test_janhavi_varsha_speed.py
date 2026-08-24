"""
Test Suite for Janhavi's Module: VARSHA-SPEED
Verifies IMD 2005-2025 dataset ingestion, 30-state working window calculations, and project-level weather auditing.
"""

import unittest
import os
import sys

# Ensure project root is in sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from modules.janhavi.service import get_varsha_speed_engine, VarshaSpeedEngine

class TestVarshaSpeedModule(unittest.TestCase):
    def setUp(self):
        self.engine = get_varsha_speed_engine()

    def test_dataset_ingestion(self):
        """Verify 630 state-years are loaded across 30 states."""
        self.assertGreaterEqual(len(self.engine.monsoon_records), 600, "Should have loaded ~630 IMD records")
        self.assertEqual(len(self.engine.state_statistics), 30, "Should contain exactly 30 unique states/UTs")
        self.assertIn("Assam", self.engine.state_statistics)
        self.assertIn("Maharashtra", self.engine.state_statistics)
        self.assertIn("Rajasthan", self.engine.state_statistics)

    def test_historical_profile_calculations(self):
        """Verify historical statistical metrics for states."""
        profiles = self.engine.get_state_historical_profiles()
        self.assertEqual(profiles["module"], "VARSHA-SPEED")
        self.assertEqual(profiles["total_states"], 30)

        assam = self.engine.state_statistics.get("Assam")
        self.assertIsNotNone(assam)
        self.assertIn("mean_departure_pct", assam)
        self.assertIn("max_excess_year", assam)
        self.assertIn("risk_tier", assam)
        self.assertEqual(assam["risk_tier"], "SEVERE_FLOOD_PRONE")

    def test_monsoon_impact_simulation(self):
        """Verify working window compression and stretch multiplier math."""
        # Test normal monsoon (0% anomaly)
        normal_res = self.engine.get_monsoon_impact_summary(rainfall_anomaly_pct=0.0)
        self.assertEqual(normal_res["total_states_modeled"], 30)
        self.assertIn("state_impact_records", normal_res)

        # Test extreme monsoon (+30% anomaly)
        extreme_res = self.engine.get_monsoon_impact_summary(rainfall_anomaly_pct=30.0)
        
        # Verify higher rainfall results in fewer effective working months
        assam_normal = next(r for r in normal_res["state_impact_records"] if r["state"] == "Assam")
        assam_extreme = next(r for r in extreme_res["state_impact_records"] if r["state"] == "Assam")

        self.assertGreater(assam_extreme["simulated_lost_days"], assam_normal["simulated_lost_days"])
        self.assertLess(assam_extreme["effective_working_window_months"], assam_normal["effective_working_window_months"])
        self.assertGreater(assam_extreme["schedule_stretch_multiplier"], assam_normal["schedule_stretch_multiplier"])

    def test_state_timeline(self):
        """Verify year-by-year 2005-2025 timeline retrieval."""
        res = self.engine.get_state_timeline("Kerala")
        self.assertEqual(res["state"], "Kerala")
        self.assertEqual(len(res["timeline"]), 21, "2005-2025 should have 21 annual data points")
        self.assertEqual(res["timeline"][0]["year"], 2005)
        self.assertEqual(res["timeline"][-1]["year"], 2025)

    def test_project_weather_audit(self):
        """Verify project weather exposure integration with real master projects."""
        audit = self.engine.get_project_weather_audit(limit=20, min_cost_cr=500.0)
        self.assertEqual(audit["module"], "VARSHA-SPEED")
        self.assertGreater(audit["audited_count"], 0)
        self.assertLessEqual(len(audit["projects"]), 20)

        sample = audit["projects"][0]
        self.assertIn("project_id", sample)
        self.assertIn("schedule_stretch_multiplier", sample)
        self.assertIn("weather_risk_score", sample)
        self.assertIn("climate_adjustment_recommendation", sample)

if __name__ == "__main__":
    unittest.main()
