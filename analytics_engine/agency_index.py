"""
PRAKALP-DRISHTI: AGENCY EXECUTION ACCOUNTABILITY INDEX (AEAI)
Cross-Agency Structural Performance, Network Contagion Exposure, and Capital Velocity Ranking.
Aggregates 2,207 central projects across executing PSUs and Line Ministries.
"""

import os
import re
import json
import hashlib
import numpy as np
import pandas as pd
from typing import List, Dict, Any

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, "paimana_extracted", "PAIMANA_MASTER_PROJECTS_DATABASE.csv")
ENTITY_MAPPING_PATH = os.path.join(BASE_DIR, "paimana_extracted", "CANONICAL_ENTITIES_MAPPING.json")
SHAPLEY_PATH = os.path.join(BASE_DIR, "artifacts", "shapley.parquet")


_BRACKET_SUFFIX = re.compile(r"[\[\(]\s*[^\[\]\(\)]{2,16}\s*[\]\)]\s*$")
_DASH_ACRONYM = re.compile(r"\s*[-–—]\s*[A-Z]{3,12}\s*$")
_PUNCT = re.compile(r"[\s,\.;:&/\-–—]+")


def _normalise_agency(raw: str) -> str:
    """Group key for an unmapped agency name.

    This replaces `raw[:30]`, which was silently wrong in both directions:

      * It MERGED distinct agencies sharing a 30-character prefix. Measured on this
        corpus that pooled 7 separate IITs into one "agency" and 5 separate NITs into
        another, so their delay and overrun statistics were averaged together and
        reported as a single institution's track record.
      * It did nothing to merge the same agency written three ways -- "Central Public
        Works Department (CPWD)", "... - CPWD" and "... [CPWD]" stayed three agencies.

    So: strip a trailing acronym written in brackets or after a dash, fold punctuation
    and case, and keep everything else. A trailing acronym must be >= 3 capitals to be
    stripped, which deliberately preserves the two-letter state suffixes that DO mark
    different agencies ("Department of Water Resources-JH" vs "-MH") and the roman
    numerals that mark railway divisions.
    """
    s = (raw or "").strip()
    if not s or s.lower() == "nan":
        return "CENTRAL_PSU"
    s = _BRACKET_SUFFIX.sub("", s).strip()
    s = _DASH_ACRONYM.sub("", s).strip()
    s = _PUNCT.sub(" ", s).strip().upper()
    # Space-insensitive, because the source writes the same ministry both ways:
    # "Ministry of Petroleum & Natural Gas" (103 projects) and
    # "MinistryofPetroleumNaturalGas" (24) were two separate agencies on the ranking.
    # Verified against the full corpus: exactly two groups merge under this rule
    # (that ministry and Central Railway) and no unrelated agency collides.
    s = s.replace(" ", "")
    return s or "CENTRAL_PSU"


def _resolve_agency_groups(raw_names, entity_map) -> dict:
    """Map every raw COMPANYNAME spelling to one agency group key.

    Two independent signals say "these are the same agency", and neither alone is
    sufficient on this corpus:

      * The curated entity map knows that HPCL, BPCL and ONGC all roll up to the
        Ministry of Petroleum & Natural Gas -- domain knowledge no string rule
        recovers.
      * String normalisation knows that "MinistryofPetroleumNaturalGas" is the same
        ministry as "Ministry of Petroleum & Natural Gas" -- which the curated map
        missed, leaving 24 projects filed under a second, phantom ministry that
        appeared as its own row on the accountability ranking.

    So both signals union into one equivalence relation rather than one overriding
    the other. The group key prefers a curated canonical id when the component
    contains one, so downstream ids stay stable and readable.
    """
    parent: dict = {}

    def find(x):
        parent.setdefault(x, x)
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    def union(a, b):
        ra, rb = find(a), find(b)
        if ra != rb:
            parent[ra] = rb

    for raw in raw_names:
        union("R:" + raw, "K:" + _normalise_agency(raw))
        cid = (entity_map.get(raw) or {}).get("canonical_id")
        if cid:
            union("R:" + raw, "C:" + cid)

    # Choose a stable, human-readable key per component.
    members: dict = {}
    for raw in raw_names:
        members.setdefault(find("R:" + raw), []).append(raw)

    out = {}
    for root, raws in members.items():
        cids = sorted({(entity_map.get(r) or {}).get("canonical_id")
                       for r in raws} - {None})
        key = cids[0] if cids else _normalise_agency(raws[0])
        for r in raws:
            out[r] = key
    return out


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
        self.df["PhysicalProgress"] = pd.to_numeric(self.df["PhysicalProgress"], errors="coerce").fillna(25.0)

        # Compute real schedule delay from official milestone dates (DELAYED_TIME raw column is all zeros)
        def compute_schedule_delay(row):
            orig_dt = pd.to_datetime(row.get("OriginalEndDate"), errors="coerce", dayfirst=True)
            rev_dt = pd.to_datetime(row.get("RevisedDate"), errors="coerce", dayfirst=True)
            if pd.notna(orig_dt) and pd.notna(rev_dt) and rev_dt > orig_dt:
                return max(0.0, (rev_dt - orig_dt).days / 30.4375)
            return float(row.get("OnboardingDelay", 0.0) or 0.0)

        self.df["REAL_DELAY_MONTHS"] = self.df.apply(compute_schedule_delay, axis=1)

        # Cost Overrun
        self.df["CostOverrun"] = np.maximum(0.0, self.df["RevisedCost"] - self.df["OriginalCost"])
        self.df["OverrunPerc"] = (self.df["CostOverrun"] / self.df["OriginalCost"]) * 100.0

        # Load Canonical Entities
        if os.path.exists(ENTITY_MAPPING_PATH):
            with open(ENTITY_MAPPING_PATH, "r", encoding="utf-8") as f:
                self.entity_map = json.load(f).get("mapping_by_raw_string", {})

        self.df["RawAgencyName"] = self.df["COMPANYNAME"].astype(str)
        groups = _resolve_agency_groups(
            sorted(set(self.df["RawAgencyName"])), self.entity_map)
        self.df["CanonicalAgency"] = self.df["RawAgencyName"].map(groups)

        # Display name = the raw string the ministry itself writes most often for this
        # agency (ties broken by the longest, then alphabetically, so it is fully
        # deterministic). Nothing is re-cased. `.title()` was previously applied here
        # and mangled every Indian acronym in the portfolio -- NHAI rendered as "Nhai",
        # NTPC as "Ntpc", MoRTH as "Morth", DoT as "Telecom Dot". Taking the source
        # spelling verbatim fixes all of them at once and cannot invent a new one.
        self.display_names = {}
        for key, grp in self.df.groupby("CanonicalAgency"):
            counts = grp["RawAgencyName"].value_counts()
            best = max(counts.items(), key=lambda kv: (kv[1], len(kv[0]), kv[0]))[0]
            self.display_names[key] = best if best and best != "nan" else str(key)

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
            delayed_projects = int((grp["REAL_DELAY_MONTHS"] > 0).sum())
            delay_rate = (delayed_projects / total_projects) * 100.0
            avg_delay = float(grp["REAL_DELAY_MONTHS"].mean())
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
                "agency_name": self.display_names.get(agency, str(agency)),
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
            # The list was silently capped at 30 while the header reported 58,
            # so anything summing or paginating over `agencies` under-counted by
            # nearly half with no indication. Return the full set and state its
            # length, rather than truncating behind a count that disagrees.
            "agencies_returned": len(self.agency_records),
            "agencies": self.agency_records,
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
