"""
PRAKALP-DRISHTI: AGENCY EXECUTION ACCOUNTABILITY INDEX (AEAI)
Cross-Agency Structural Performance, Network Contagion Exposure, and Capital Velocity Ranking.
Aggregates 2,207 central projects across executing PSUs and Line Ministries.
"""

import os
import json
import hashlib
import numpy as np
import pandas as pd
from typing import List, Dict, Any

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, "paimana_extracted", "PAIMANA_MASTER_PROJECTS_DATABASE.csv")
ENTITY_MAPPING_PATH = os.path.join(BASE_DIR, "paimana_extracted", "CANONICAL_ENTITIES_MAPPING.json")
SHAPLEY_PATH = os.path.join(BASE_DIR, "artifacts", "shapley.parquet")

class AgencyIndexEngine:
    def __init__(self):
        self.df = None
        self.entity_map = {}
        self.shapley_scores = {}
        self.agency_records = []
        self._load_and_compute()

    def _load_and_compute(self):
        if not os.path.exists(DATA_PATH):
            return

        self.df = pd.read_csv(DATA_PATH)
        self.df["OriginalCost"] = pd.to_numeric(self.df["OriginalCost"], errors="coerce").fillna(500.0)
        self.df["RevisedCost"] = pd.to_numeric(self.df["RevisedCost"], errors="coerce").fillna(self.df["OriginalCost"])
        self.df["DELAYED_TIME"] = pd.to_numeric(self.df["DELAYED_TIME"], errors="coerce").fillna(0.0)
        self.df["PhysicalProgress"] = pd.to_numeric(self.df["PhysicalProgress"], errors="coerce").fillna(25.0)

        # Cost Overrun
        self.df["CostOverrun"] = np.maximum(0.0, self.df["RevisedCost"] - self.df["OriginalCost"])
        self.df["OverrunPerc"] = (self.df["CostOverrun"] / self.df["OriginalCost"]) * 100.0

        # Load Canonical Entities
        if os.path.exists(ENTITY_MAPPING_PATH):
            with open(ENTITY_MAPPING_PATH, "r", encoding="utf-8") as f:
                self.entity_map = json.load(f).get("mapping_by_raw_string", {})

        def get_canonical(row):
            raw = str(row["COMPANYNAME"])
            ent = self.entity_map.get(raw, {})
            return ent.get("canonical_id") or (raw[:30] if raw != "nan" else "CENTRAL_PSU")

        self.df["CanonicalAgency"] = self.df.apply(get_canonical, axis=1)

        # Load Shapley scores
        if os.path.exists(SHAPLEY_PATH):
            shapley_df = pd.read_parquet(SHAPLEY_PATH)
            self.shapley_scores = dict(zip(shapley_df["project_id"].astype(str), shapley_df["shapley_phi"]))

        self.df["ShapleyScore"] = self.df["ProjectId"].astype(str).map(self.shapley_scores).fillna(100.0)

        # Aggregate by Agency
        grouped = self.df.groupby("CanonicalAgency")
        records = []

        for agency, grp in grouped:
            if len(grp) < 2:
                continue

            total_projects = len(grp)
            total_capex = float(grp["RevisedCost"].sum())
            delayed_projects = int((grp["DELAYED_TIME"] > 0).sum())
            delay_rate = (delayed_projects / total_projects) * 100.0
            avg_delay = float(grp["DELAYED_TIME"].mean())
            avg_overrun = float(grp["OverrunPerc"].mean())
            avg_progress = float(grp["PhysicalProgress"].mean())
            total_shapley = float(grp["ShapleyScore"].sum())
            
            # Systemic Contagion Risk Score (0-100)
            contagion_risk = float(np.clip(
                (delay_rate * 0.35) + (avg_overrun * 0.35) + (min(avg_delay, 60.0) / 60.0 * 30.0),
                5.0, 95.0
            ))

            # Capital Delivery Velocity (0-100)
            velocity_score = float(np.clip(
                (avg_progress * 0.50) + (max(0, 100.0 - delay_rate) * 0.30) + (max(0, 100.0 - avg_overrun) * 0.20),
                10.0, 98.0
            ))

            # Performance Tier
            if velocity_score >= 70.0 and avg_delay < 12.0:
                tier = "TIER_1_EXEMPLARY"
                rating_label = "Prime Delivery Benchmark"
                color = "#10b981"
            elif velocity_score >= 45.0:
                tier = "TIER_2_WATCHLIST"
                rating_label = "Active Schedule Friction"
                color = "#f59e0b"
            else:
                tier = "TIER_3_CRITICAL"
                rating_label = "Severe Contagion Risk"
                color = "#ef4444"

            records.append({
                "agency_id": agency,
                "agency_name": agency.replace("_", " ").title(),
                "total_projects": total_projects,
                "delayed_projects": delayed_projects,
                "delay_rate_perc": round(delay_rate, 1),
                "total_capex_cr": round(total_capex, 2),
                "avg_delay_months": round(avg_delay, 1),
                "avg_cost_overrun_perc": round(avg_overrun, 1),
                "avg_progress_perc": round(avg_progress, 1),
                "total_shapley_criticality_cr": round(total_shapley, 2),
                "systemic_contagion_risk": round(contagion_risk, 1),
                "velocity_score": round(velocity_score, 1),
                "performance_tier": tier,
                "rating_label": rating_label,
                "status_color": color
            })

        # Sort by total capex descending
        records.sort(key=lambda x: x["total_capex_cr"], reverse=True)
        self.agency_records = records

    def get_agency_index(self, limit: int = 50) -> List[Dict[str, Any]]:
        return self.agency_records[:limit]

    def get_agency_summary(self) -> Dict[str, Any]:
        return {
            "total_agencies_monitored": len(self.agency_records),
            "tier_1_agencies": sum(1 for a in self.agency_records if a["performance_tier"] == "TIER_1_EXEMPLARY"),
            "tier_2_agencies": sum(1 for a in self.agency_records if a["performance_tier"] == "TIER_2_WATCHLIST"),
            "tier_3_agencies": sum(1 for a in self.agency_records if a["performance_tier"] == "TIER_3_CRITICAL"),
            "top_contagion_agency": self.agency_records[0]["agency_name"] if self.agency_records else "N/A",
            "agencies": self.agency_records[:30]
        }

_agency_instance = None

def get_agency_index_engine() -> AgencyIndexEngine:
    global _agency_instance
    if _agency_instance is None:
        _agency_instance = AgencyIndexEngine()
    return _agency_instance

if __name__ == "__main__":
    eng = get_agency_index_engine()
    summary = eng.get_agency_summary()
    print("Agency Execution Accountability Summary:")
    print(f"Monitored: {summary['total_agencies_monitored']} agencies")
    print(f"Tier 1 Exemplary: {summary['tier_1_agencies']}")
    print(f"Tier 2 Watchlist: {summary['tier_2_agencies']}")
    print(f"Tier 3 Critical: {summary['tier_3_agencies']}")
    print(f"\nTop 5 Agencies by Capex:")
    for a in summary["agencies"][:5]:
        print(f"  {a['agency_name']:<30} Projects: {a['total_projects']:3d} | Capex: ₹{a['total_capex_cr']:,.0f} Cr | Velocity: {a['velocity_score']} | Tier: {a['performance_tier']}")
