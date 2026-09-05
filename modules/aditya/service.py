"""
PRAKALP-DRISHTI: EO-AUDITOR
Module Lead: Aditya
Satellite Earth Observation & Computer Vision Ground-Truth Corroboration Engine.
Serves verified dual-epoch optical satellite dossiers (2018 Baseline vs 2023 Current) across Indian mega-projects.
"""

import os
import json
import pandas as pd
from typing import Dict, Any, List

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CATALOG_PATH = os.path.join(BASE_DIR, "paimana_extracted", "satellite_data", "ALL_2207_PROJECTS_SATELLITE_CATALOG.json")
GEO_PATH = os.path.join(BASE_DIR, "paimana_extracted", "satellite_data", "ALL_2207_PROJECTS_GEOREFERENCED.json")

class EOAuditorEngine:
    def __init__(self):
        self.catalog = []
        self._load_data()

    def _load_data(self):
        if os.path.exists(CATALOG_PATH):
            with open(CATALOG_PATH, "r", encoding="utf-8") as f:
                self.catalog = json.load(f)

    def get_satellite_war_room_summary(self, limit: int = 50) -> Dict[str, Any]:
        # Status vocabulary changed when the EO layer stopped estimating a completion
        # percentage (the old "observed %" was 45%-weighted on the contractor's own
        # claim). CRITICAL_DIVERGENCE/VERIFIED_ON_TRACK no longer exist; matching on
        # them would silently report zero for every project.
        total_coverage = len(self.catalog)
        critical_discrepancies = [p for p in self.catalog if p.get("audit_status") == "ACTIVITY_ANOMALY"]
        verified_on_track = [p for p in self.catalog if p.get("audit_status") == "CHANGE_CONFIRMED"]

        return {
            "module": "EO-AUDITOR",
            "module_lead": "Aditya",
            # "Sub-meter Resolution ~0.8m" removed. Measured ground sample distance on
            # these Web Mercator tiles is 2.08-2.35 m/px, and CLAIMS.md lists sub-metre
            # detection as REFUSED. This endpoint was serving the refused claim next to
            # the corrected one in the same response.
            "sensor": "ESRI ArcGIS World Imagery + Wayback Living Atlas (2.08-2.35 m/px measured)",
            "dual_epoch_vintages": "2018-02 (Baseline) vs 2023-01 (Current)",
            "total_georeferenced_coverage": total_coverage,
            "verified_on_track_count": len(verified_on_track),
            "critical_discrepancies_flagged": len(critical_discrepancies),
            "showcase_projects": self.catalog[:limit]
        }

_eo_auditor_instance = None

def get_eo_auditor_engine() -> EOAuditorEngine:
    global _eo_auditor_instance
    if _eo_auditor_instance is None:
        _eo_auditor_instance = EOAuditorEngine()
    return _eo_auditor_instance
