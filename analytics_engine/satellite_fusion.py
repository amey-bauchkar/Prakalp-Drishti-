"""
PRAKALP-DRISHTI: SATELLITE GROUND-TRUTH FUSION ENGINE (PRATIBIMB)
Dual-Epoch Earth-Observation Corroboration Engine for MoSPI Mega-Projects.
Compares reported physical progress against high-resolution orbital optical evidence,
computes empirical surface activity change (OCAI), and flags contractor over-reporting.
"""

import os
import json
import hashlib
import numpy as np
import pandas as pd
from typing import Dict, Any, Optional
from analytics_engine.satellite_vision_cv import SatelliteVisionCV

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, "paimana_extracted", "PAIMANA_MASTER_PROJECTS_DATABASE.csv")
CATALOG_PATH = os.path.join(BASE_DIR, "paimana_extracted", "satellite_data", "ALL_2207_PROJECTS_SATELLITE_CATALOG.json")
IMAGERY_DIR = os.path.join(BASE_DIR, "paimana_extracted", "satellite_data", "project_imagery")

class SatelliteFusionEngine:
    def __init__(self):
        self.catalog = {}
        self.df = None
        self._load_data()

    def _load_data(self):
        if os.path.exists(DATA_PATH):
            self.df = pd.read_csv(DATA_PATH)
        
        if os.path.exists(CATALOG_PATH):
            with open(CATALOG_PATH, "r", encoding="utf-8") as f:
                cat_list = json.load(f)
                for item in cat_list:
                    pid = str(item.get("project_id", ""))
                    self.catalog[pid] = item

    def get_satellite_audit(self, project_id: str) -> Dict[str, Any]:
        """
        Returns full Earth-Observation audit record for a given project.
        """
        pid = str(project_id)
        cat_entry = self.catalog.get(pid, {})
        
        before_file = os.path.join(IMAGERY_DIR, f"{pid}_BEFORE.jpg")
        after_file = os.path.join(IMAGERY_DIR, f"{pid}_AFTER.jpg")
        
        has_before = os.path.exists(before_file)
        has_after = os.path.exists(after_file)
        
        claimed = float(cat_entry.get("claimed_progress_pct", 50.0))
        
        if "eo_observed_ocai_pct" in cat_entry:
            observed = float(cat_entry["eo_observed_ocai_pct"])
            divergence = float(cat_entry.get("divergence_rod_points", round(claimed - observed, 1)))
            status = cat_entry.get("audit_status", "VERIFIED_ON_TRACK")
            action = cat_entry.get("statutory_recommendation", "CLEAR_DISBURSAL")
            severity = cat_entry.get("audit_severity", "LOW")
            edge_growth = cat_entry.get("edge_density_growth", 0.0)
            dissimilarity = cat_entry.get("structural_dissimilarity", 0.0)
            pavement_shift = cat_entry.get("pavement_shift_score", 0.0)
        else:
            cv_res = SatelliteVisionCV.analyze_pixel_change(before_file, after_file, claimed_pct=claimed)
            observed = cv_res["eo_observed_pct"]
            divergence = cv_res["divergence_pts"]
            status = cv_res["audit_status"]
            action = cv_res["recommendation"]
            severity = cv_res["severity"]
            edge_growth = cv_res.get("edge_density_growth", 0.0)
            dissimilarity = cv_res.get("structural_dissimilarity", 0.0)
            pavement_shift = cv_res.get("pavement_shift_score", 0.0)

        return {
            "project_id": pid,
            "project_name": cat_entry.get("project_name", "Infrastructure Asset"),
            "sector": cat_entry.get("sector", "Roads & Highways"),
            "state": cat_entry.get("state", "National"),
            "agency": cat_entry.get("agency", "Central Agency"),
            "claimed_progress_pct": claimed,
            "eo_observed_progress_pct": observed,
            "divergence_rod_points": divergence,
            "audit_status": status,
            "statutory_recommendation": action,
            "audit_severity": severity,
            "edge_density_growth": edge_growth,
            "structural_dissimilarity": dissimilarity,
            "pavement_shift_score": pavement_shift,
            "sensor": "ESRI ArcGIS World Imagery + Wayback Living Atlas (Sub-meter)",
            "before_imagery_url": f"/satellite-imagery/{pid}_BEFORE.jpg" if has_before else None,
            "after_imagery_url": f"/satellite-imagery/{pid}_AFTER.jpg" if has_after else None,
            "has_dual_epoch_coverage": has_before and has_after,
            "resolution_m": 0.8,
            "baseline_vintage": "2018-02",
            "current_vintage": "2023-01",
            "audit_hash": hashlib.sha256(f"{pid}:{claimed}:{observed}:{status}".encode("utf-8")).hexdigest()
        }

_satellite_instance = None

def get_satellite_fusion_engine() -> SatelliteFusionEngine:
    global _satellite_instance
    if _satellite_instance is None:
        _satellite_instance = SatelliteFusionEngine()
    return _satellite_instance

if __name__ == "__main__":
    eng = get_satellite_fusion_engine()
    sample = eng.get_satellite_audit("706724")
    print("Sample Satellite Fusion Audit (Project 706724):", sample)
