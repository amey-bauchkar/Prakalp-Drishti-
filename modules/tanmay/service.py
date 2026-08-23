"""
PRAKALP-DRISHTI: SATYA-KAVACH
Module Lead: Tanmay
Detects artificial clustering of budget revisions just below the 20% CCEA Cabinet Approval threshold.
Identifies strategic under-reporting and cost escalation evasion patterns across 2,207 projects.
"""

import os
import pandas as pd
import numpy as np
from typing import Dict, Any, List

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_PATH = os.path.join(BASE_DIR, "paimana_extracted", "PAIMANA_MASTER_PROJECTS_DATABASE.csv")

class SatyaKavachEngine:
    def __init__(self):
        self.df = None
        self._load_data()

    def _load_data(self):
        if os.path.exists(DATA_PATH):
            self.df = pd.read_csv(DATA_PATH)
            self.df["OriginalCost"] = pd.to_numeric(self.df["OriginalCost"], errors="coerce").fillna(500.0)
            self.df["RevisedCost"] = pd.to_numeric(self.df["RevisedCost"], errors="coerce").fillna(self.df["OriginalCost"])
            self.df["OverrunCr"] = np.maximum(0.0, self.df["RevisedCost"] - self.df["OriginalCost"])
            self.df["OverrunPct"] = np.where(self.df["OriginalCost"] > 0, (self.df["OverrunCr"] / self.df["OriginalCost"]) * 100.0, 0.0)

    def get_anti_gaming_summary(self) -> Dict[str, Any]:
        if self.df is None or self.df.empty:
            return {"status": "no_data"}

        # Detect projects clustered in the 18.0% - 19.99% zone (CCEA Cabinet avoidance)
        threshold_bunching = self.df[(self.df["OverrunPct"] >= 18.0) & (self.df["OverrunPct"] < 20.0)]
        above_threshold = self.df[self.df["OverrunPct"] >= 20.0]
        below_threshold = self.df[(self.df["OverrunPct"] > 0) & (self.df["OverrunPct"] < 18.0)]
        zero_overrun = self.df[self.df["OverrunPct"] == 0]

        flagged_projects = []
        for _, row in threshold_bunching.head(20).iterrows():
            flagged_projects.append({
                "project_id": str(row["ProjectId"]),
                "project_name": str(row["ProjectName"]),
                "sector": str(row["SectorName"]),
                "state": str(row["StateName"]),
                "agency": str(row["COMPANYNAME"]),
                "original_cost_cr": float(row["OriginalCost"]),
                "revised_cost_cr": float(row["RevisedCost"]),
                "overrun_pct": round(float(row["OverrunPct"]), 2),
                "risk_flag": "HIGH_PROBABILITY_CCEA_EVASION",
                "evasion_margin_pct": round(20.0 - float(row["OverrunPct"]), 2)
            })

        return {
            "module": "SATYA-KAVACH",
            "module_lead": "Tanmay",
            "statutory_rule": "CCEA Mandatory Cabinet Review at >=20% Cost Escalation",
            "total_projects_analyzed": len(self.df),
            "projects_in_bunching_zone_18_20pct": len(threshold_bunching),
            "projects_above_20pct_cabinet_rule": len(above_threshold),
            "projects_under_18pct": len(below_threshold),
            "zero_overrun_projects": len(zero_overrun),
            "bunching_density_ratio": round(len(threshold_bunching) / max(1, len(above_threshold[above_threshold["OverrunPct"] <= 22.0])), 2),
            "audit_recommendation": "Deploy forensic field scrutiny for all projects clustered at 18.0% - 19.9% cost escalation",
            "flagged_sample_projects": flagged_projects
        }

_satya_kavach_instance = None

def get_satya_kavach_engine() -> SatyaKavachEngine:
    global _satya_kavach_instance
    if _satya_kavach_instance is None:
        _satya_kavach_instance = SatyaKavachEngine()
    return _satya_kavach_instance
