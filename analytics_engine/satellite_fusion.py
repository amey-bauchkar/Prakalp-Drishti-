"""
PRAKALP-DRISHTI: SATELLITE GROUND-TRUTH FUSION ENGINE (PRATIBIMB)

Serves the precomputed dual-epoch Earth-observation record for a project.

Scope, stated precisely because the previous version overclaimed it: this engine
reports how much of the sampled ground structurally changed between the 2018 and 2023
epochs, and where that ranks against sector peers. It does NOT estimate what fraction
of a project is complete, and it does not assert over-reporting. Surface change and
reported progress correlate at 0.007 across the site-level corpus, so no completion
figure is derivable from the imagery; the earlier one only appeared credible because
45% of its value was copied from the claim it was supposed to audit.

Read-only over the catalog written by
satellite_pipeline/batch_precision_change_detection.py. No CV runs here.
"""

import os
import re
import json
import hashlib
import numpy as np
import pandas as pd
from typing import Dict, Any, Optional

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, "paimana_extracted", "PAIMANA_MASTER_PROJECTS_DATABASE.csv")
CATALOG_PATH = os.path.join(BASE_DIR, "paimana_extracted", "satellite_data", "ALL_2207_PROJECTS_SATELLITE_CATALOG.json")
_SAFE_PID = re.compile(r"[^A-Za-z0-9_-]")
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
        
        # Defence in depth: the router sanitises too, but this engine is also
        # reachable from batch scripts that pass ids straight through.
        pid = _SAFE_PID.sub("", str(pid))[:64] or "invalid"
        before_file = os.path.join(IMAGERY_DIR, f"{pid}_BEFORE.jpg")
        after_file = os.path.join(IMAGERY_DIR, f"{pid}_AFTER.jpg")
        
        has_before = os.path.exists(before_file)
        has_after = os.path.exists(after_file)
        
        claimed = float(cat_entry.get("claimed_progress_pct", 50.0))
        
        # There is deliberately no "observed progress %" here. Surface change and
        # reported progress correlate at 0.007 across the site-level corpus, so imagery
        # cannot support a completion figure; the previous one only looked plausible
        # because it was 45%-weighted on the claim it was auditing. The catalog is the
        # single source of truth -- no on-the-fly CV fallback, which used to reintroduce
        # the circular estimate whenever an entry was missing.
        status = cat_entry.get("audit_status", "EO_UNAVAILABLE")
        action = cat_entry.get("statutory_recommendation", "STANDARD_PHYSICAL_INSPECTION")
        severity = cat_entry.get("audit_severity", "LOW")
        surface_change = float(cat_entry.get("surface_change_pct", 0.0))
        dissimilarity = cat_entry.get("mean_dissimilarity", 0.0)

        # Precision-CV provenance fields (written by
        # satellite_pipeline/batch_precision_change_detection.py). These carry the
        # localised change polygons and, critically, whether this project is actually
        # imaged at its own site -- a centroid-geocoded project is looking at the wrong
        # patch of ground, so its EO verdict must not be presented as evidence.
        change_boxes = cat_entry.get("change_boxes", [])
        geocode_precision = cat_entry.get("geocode_precision", "NATIONAL_CENTROID_MATCH")
        geocode_confidence = cat_entry.get("geocode_confidence", "NONE")
        eo_reliable = bool(cat_entry.get("eo_verdict_reliable", False))

        return {
            "project_id": pid,
            "project_name": cat_entry.get("project_name", "Infrastructure Asset"),
            "sector": cat_entry.get("sector", "Roads & Highways"),
            "state": cat_entry.get("state", "National"),
            "agency": cat_entry.get("agency", "Central Agency"),
            "claimed_progress_pct": claimed,
            "audit_status": status,
            "statutory_recommendation": action,
            "audit_severity": severity,
            "structural_dissimilarity": dissimilarity,
            # --- independent measurement (no claim input anywhere upstream) ---
            "surface_change_pct": surface_change,
            "change_percentile_in_sector": cat_entry.get("change_percentile_in_sector"),
            "asset_geometry": cat_entry.get("asset_geometry", "POINT"),
            "change_boxes": change_boxes,
            "change_box_count": len(change_boxes),
            "mean_dissimilarity": cat_entry.get("mean_dissimilarity", 0.0),
            "registration_shift_px": cat_entry.get("registration_shift_px", 0.0),
            "registration_method": cat_entry.get("registration_method", "none"),
            # --- geolocation trust ---
            "geocode_precision": geocode_precision,
            "geocode_confidence": geocode_confidence,
            "geocode_confidence_note": cat_entry.get("geocode_confidence_note", ""),
            "eo_verdict_reliable": eo_reliable,
            "eo_unreliable_reason": cat_entry.get("eo_unreliable_reason"),
            "sensor": "ESRI ArcGIS World Imagery + Wayback Living Atlas (Sub-meter)",
            "before_imagery_url": f"/satellite-imagery/{pid}_BEFORE.jpg" if has_before else None,
            "after_imagery_url": f"/satellite-imagery/{pid}_AFTER.jpg" if has_after else None,
            "has_dual_epoch_coverage": has_before and has_after,
            "resolution_m": 0.8,
            "baseline_vintage": "2018-02",
            "current_vintage": "2023-01",
            "audit_hash": hashlib.sha256(
                f"{pid}:{claimed}:{surface_change}:{status}".encode("utf-8")).hexdigest()
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
