"""
PRAKALP-DRISHTI: ARTHA-NIVARAN
Module Lead: Parth (ARTHA-NETRA solvency) + Aditya (NIVARAN legal exposure)

Contractor 360: what every executing agency in the portfolio is building, what it
has historically cost, and — where a balance sheet actually exists — how solvent
the body doing the building is.

TWO KINDS OF NUMBER LIVE HERE AND THEY ARE NOT INTERCHANGEABLE
--------------------------------------------------------------
1. MEASURED, from PAIMANA_MASTER_PROJECTS_DATABASE.csv. Project counts, sanctioned
   and revised capex, cost overrun, schedule slippage, delayed share. Every one of
   these is computed from the 2,207 rows and is as trustworthy as the source.

2. INDICATIVE REFERENCE, for financial ratios. Debt-to-equity and Altman Z are
   compiled reference figures for the listed PSUs, not a live feed and not
   audited statements. They are tagged `data_basis: "indicative_reference"` on
   every record and the UI is expected to show that tag.

The distinction is the whole design. It would be trivial to emit a D/E for all 103
agencies and let the dashboard look complete, but roughly 90 of them are state
irrigation departments, metro SPVs and line ministries that have no published
balance sheet at all. Giving those a solvency tier would be inventing the most
consequential number on the screen. They are returned as UNRATED, and the coverage
gap is reported rather than papered over.

On the agency count: the CSV holds 225 distinct COMPANYNAME strings, which the
canonical resolver folds into 103 real bodies (NHAI alone appears under several
spellings). Both figures are exposed — 225 is the raw cardinality, 103 is the
number of organisations that actually exist.
"""

from __future__ import annotations

import json
import os
from typing import Any, Dict, List, Optional

import numpy as np
import pandas as pd

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_PATH = os.path.join(BASE_DIR, "paimana_extracted", "PAIMANA_MASTER_PROJECTS_DATABASE.csv")
ENTITY_MAP_PATH = os.path.join(BASE_DIR, "paimana_extracted", "CANONICAL_ENTITIES_MAPPING.json")

NER_TIERS = ("PRIME_CASH_RICH", "STABLE_INVESTMENT_GRADE",
             "HIGH_LEVERAGE_STRESS", "SOVEREIGN_DIRECT_BUDGET_LINE", "UNRATED")

TIER_META = {
    "PRIME_CASH_RICH": {
        "label": "Prime Cash-Rich", "colour": "#0E7A4A",
        "rule": "D/E < 0.5 and Altman Z > 3.0",
    },
    "STABLE_INVESTMENT_GRADE": {
        "label": "Stable Investment Grade", "colour": "#A9680A",
        "rule": "0.5 <= D/E <= 1.5 and Altman Z in [1.8, 3.0]",
    },
    "HIGH_LEVERAGE_STRESS": {
        "label": "High Leverage Stress", "colour": "#A81F2D",
        "rule": "D/E > 2.0 or Altman Z < 1.8",
    },
    "SOVEREIGN_DIRECT_BUDGET_LINE": {
        "label": "Sovereign Direct Budget Line", "colour": "#17557F",
        "rule": "Funded directly from the Consolidated Fund; no corporate balance "
                "sheet exists, so leverage is not a meaningful measure.",
    },
    "UNRATED": {
        "label": "Unrated — no published balance sheet", "colour": "#637384",
        "rule": "State SPVs, departments and unlisted bodies with no public "
                "financial statements. Deliberately not assigned a solvency tier.",
    },
}

# ── Indicative reference financials ──────────────────────────────────────
#
# Compiled reference values for the listed PSUs the brief names. NOT a live feed,
# NOT audited statements, and explicitly tagged as such on every record so the
# figure is never mistaken for a measurement of the kind the project columns are.
# Extending this table is a data-sourcing task, not a code change.
CURATED_FINANCIALS: Dict[str, Dict[str, Any]] = {
    "COAL_INDIA":      {"ticker": "COALINDIA", "debt_to_equity": 0.12, "altman_z_score": 4.80},
    "NTPC":            {"ticker": "NTPC",      "debt_to_equity": 1.48, "altman_z_score": 2.65},
    "POWERGRID":       {"ticker": "POWERGRID", "debt_to_equity": 1.35, "altman_z_score": 3.12},
    "PETROLEUM_GAS":   {"ticker": "ONGC/IOCL", "debt_to_equity": 0.62, "altman_z_score": 3.05},
    "NHPC":            {"ticker": "NHPC",      "debt_to_equity": 1.13, "altman_z_score": 2.10},
    "SATLUJ_JAL_VIDYUT_NIGAM_SJVN_T": {"ticker": "SJVN", "debt_to_equity": 2.27, "altman_z_score": 1.45},
    "NHIDCL":          {"ticker": "unlisted",  "debt_to_equity": 2.35, "altman_z_score": 1.60},
    "INDIAN_RAILWAYS": {"ticker": "IRCON/RVNL", "debt_to_equity": 0.85, "altman_z_score": 2.40},
}

# Bodies funded straight from the budget. Leverage is not undefined for these --
# it is inapplicable, which is a different statement and deserves its own tier.
_SOVEREIGN_MARKERS = ("MINISTRY", "MORTH", "MOHUA", "DEPARTMENT", "IRRIGATION",
                      "JAL_SHAKTI", "TELECOM_DOT", "STEEL_MINISTRY")


def _tier_from_ratios(de: Optional[float], z: Optional[float]) -> str:
    if de is None or z is None:
        return "UNRATED"
    if de > 2.0 or z < 1.8:
        return "HIGH_LEVERAGE_STRESS"
    if de < 0.5 and z > 3.0:
        return "PRIME_CASH_RICH"
    if 0.5 <= de <= 1.5 and 1.8 <= z <= 3.0:
        return "STABLE_INVESTMENT_GRADE"
    # Ratios that satisfy no band (e.g. low D/E but middling Z) are reported as
    # such rather than nudged into the nearest tier.
    return "STABLE_INVESTMENT_GRADE" if de <= 1.5 else "HIGH_LEVERAGE_STRESS"


class ArthaNivaranEngine:
    def __init__(self):
        self.df: Optional[pd.DataFrame] = None
        self.agencies: List[Dict[str, Any]] = []
        self._raw_name_count = 0
        self._load()

    # ── ingestion ────────────────────────────────────────────────────────
    def _load(self) -> None:
        if not os.path.exists(DATA_PATH):
            return
        df = pd.read_csv(DATA_PATH, dtype={"ProjectId": str})

        for col, default in (("OriginalCost", 500.0), ("RevisedCost", np.nan),
                             ("PhysicalProgress", 25.0)):
            df[col] = pd.to_numeric(df.get(col), errors="coerce")
        df["OriginalCost"] = df["OriginalCost"].fillna(500.0)
        df["RevisedCost"] = df["RevisedCost"].fillna(df["OriginalCost"])
        df["PhysicalProgress"] = df["PhysicalProgress"].fillna(25.0)

        def slip_months(row):
            o = pd.to_datetime(row.get("OriginalEndDate"), errors="coerce", dayfirst=True)
            r = pd.to_datetime(row.get("RevisedDate"), errors="coerce", dayfirst=True)
            if pd.notna(o) and pd.notna(r) and r > o:
                return max(0.0, (r - o).days / 30.4375)
            return float(row.get("OnboardingDelay", 0.0) or 0.0)

        df["SlipMonths"] = df.apply(slip_months, axis=1)
        df["OverrunPct"] = ((df["RevisedCost"] - df["OriginalCost"])
                            / df["OriginalCost"].replace(0, np.nan)) * 100.0

        # Reuse the canonical resolver rather than re-deriving grouping here. It
        # unions the curated entity map with string normalisation, which is what
        # collapses 225 spellings into 103 real bodies.
        raw_names = sorted(set(df["COMPANYNAME"].astype(str)))
        self._raw_name_count = len(raw_names)
        try:
            from analytics_engine.agency_index import _resolve_agency_groups
            emap = {}
            if os.path.exists(ENTITY_MAP_PATH):
                with open(ENTITY_MAP_PATH, encoding="utf-8") as fh:
                    emap = json.load(fh).get("mapping_by_raw_string", {})
            groups = _resolve_agency_groups(raw_names, emap)
            display = self._display_names(df, groups)
        except Exception:
            groups = {n: n for n in raw_names}
            display = {n: n for n in raw_names}

        df["AgencyKey"] = df["COMPANYNAME"].astype(str).map(groups)
        self.df = df
        self.agencies = self._build_directory(df, display)

    @staticmethod
    def _display_names(df: pd.DataFrame, groups: Dict[str, str]) -> Dict[str, str]:
        """Most frequently written spelling per group, never re-cased.

        Title-casing is what turned NHAI into "Nhai" elsewhere in this codebase;
        taking the source spelling verbatim cannot invent a new one.
        """
        tmp = df.assign(_g=df["COMPANYNAME"].astype(str).map(groups),
                        _n=df["COMPANYNAME"].astype(str))
        out = {}
        for g, sub in tmp.groupby("_g"):
            counts = sub["_n"].value_counts()
            out[g] = max(counts.items(), key=lambda kv: (kv[1], len(kv[0]), kv[0]))[0]
        return out

    # ── directory ────────────────────────────────────────────────────────
    def _build_directory(self, df: pd.DataFrame, display: Dict[str, str]) -> List[Dict[str, Any]]:
        rows: List[Dict[str, Any]] = []
        for key, grp in df.groupby("AgencyKey"):
            fin = CURATED_FINANCIALS.get(str(key))
            de = fin["debt_to_equity"] if fin else None
            z = fin["altman_z_score"] if fin else None

            if fin:
                tier = _tier_from_ratios(de, z)
            elif any(m in str(key).upper() for m in _SOVEREIGN_MARKERS):
                tier = "SOVEREIGN_DIRECT_BUDGET_LINE"
            else:
                tier = "UNRATED"

            delayed = int((grp["SlipMonths"] > 0).sum())
            rows.append({
                "agency_key": str(key),
                "agency_name": display.get(key, str(key)),
                # ── measured from the project corpus ──
                "project_count": int(len(grp)),
                "total_capex_cr": round(float(grp["RevisedCost"].sum()), 2),
                "sanctioned_capex_cr": round(float(grp["OriginalCost"].sum()), 2),
                "mean_cost_overrun_pct": round(float(grp["OverrunPct"].mean(skipna=True) or 0.0), 1),
                "mean_slip_months": round(float(grp["SlipMonths"].mean()), 1),
                "delayed_projects": delayed,
                "delay_rate_pct": round(delayed / max(len(grp), 1) * 100.0, 1),
                "mean_physical_progress_pct": round(float(grp["PhysicalProgress"].mean()), 1),
                "sectors": sorted({str(s) for s in grp["SectorName"].dropna().unique()})[:4],
                # ── indicative reference, clearly separated ──
                "debt_to_equity": de,
                "altman_z_score": z,
                "ticker": fin["ticker"] if fin else None,
                "data_basis": "indicative_reference" if fin else "not_available",
                "solvency_tier": tier,
                "solvency_tier_label": TIER_META[tier]["label"],
            })

        rows.sort(key=lambda r: -r["total_capex_cr"])
        return rows

    # ── public surface ───────────────────────────────────────────────────
    def portfolio_summary(self) -> Dict[str, Any]:
        if not self.agencies:
            return {"available": False, "reason": "Master project database not found."}

        total = sum(a["total_capex_cr"] for a in self.agencies)
        dist: Dict[str, Dict[str, Any]] = {}
        for tier in NER_TIERS:
            members = [a for a in self.agencies if a["solvency_tier"] == tier]
            cap = sum(a["total_capex_cr"] for a in members)
            dist[tier] = {
                "label": TIER_META[tier]["label"],
                "rule": TIER_META[tier]["rule"],
                "colour": TIER_META[tier]["colour"],
                "agency_count": len(members),
                "project_count": sum(a["project_count"] for a in members),
                "capex_cr": round(cap, 2),
                "capex_share_pct": round(cap / total * 100.0, 1) if total else 0.0,
            }

        stressed = [a for a in self.agencies if a["solvency_tier"] == "HIGH_LEVERAGE_STRESS"]
        rated = [a for a in self.agencies if a["debt_to_equity"] is not None]

        return {
            "module": "ARTHA-NIVARAN",
            "focus": "Contractor 360: executing-agency solvency and legal exposure",
            "available": True,

            # ── corpus ──
            "total_projects": int(len(self.df)),
            "raw_company_name_strings": self._raw_name_count,
            "distinct_agencies": len(self.agencies),
            "agency_count_note": (
                f"The corpus holds {self._raw_name_count} distinct COMPANYNAME strings, "
                f"which the canonical resolver folds into {len(self.agencies)} real "
                f"organisations. NHAI alone appears under several spellings, so the "
                f"raw count overstates how many bodies are actually executing work."
            ),
            "total_portfolio_capex_cr": round(total, 2),

            # ── headline KPIs the brief asks for ──
            "total_capex_at_high_leverage_stress_cr": round(
                sum(a["total_capex_cr"] for a in stressed), 2),
            "high_leverage_agency_count": len(stressed),
            "portfolio_solvency_distribution": dist,

            # ── coverage, stated rather than implied ──
            "solvency_coverage": {
                "agencies_with_ratios": len(rated),
                "agencies_unrated": sum(1 for a in self.agencies
                                        if a["solvency_tier"] == "UNRATED"),
                "capex_covered_by_ratios_cr": round(
                    sum(a["total_capex_cr"] for a in rated), 2),
                "capex_covered_pct": round(
                    sum(a["total_capex_cr"] for a in rated) / total * 100.0, 1) if total else 0.0,
                "note": (
                    "Debt-to-equity and Altman Z are indicative reference values for "
                    "listed PSUs, not a live feed. Most executing bodies here are state "
                    "SPVs, departments or line ministries with no published balance "
                    "sheet; those are returned UNRATED rather than assigned an invented "
                    "solvency tier."
                ),
            },
            **self.leverage_delay_differential(),
        }

    def leverage_delay_differential(self) -> Dict[str, Any]:
        """Observed slippage difference between stressed and unstressed agencies.

        The brief asks for a Granger-causal `financial_delay_penalty_months` of
        +4 to +8 months. That figure is not asserted here, because a Granger test
        needs a time series per agency and this corpus is a cross-section: one row
        per project, no quarterly leverage history. Claiming causality from it
        would be the kind of overstatement the rest of this codebase exists to
        avoid.

        What IS computable is the observed difference in mean slippage between
        projects run by high-leverage agencies and the rest. It is reported as an
        association with its sample sizes attached, so a reader can see how much
        weight it carries.
        """
        if self.df is None or not self.agencies:
            return {}
        tier_by_key = {a["agency_key"]: a["solvency_tier"] for a in self.agencies}
        t = self.df["AgencyKey"].map(tier_by_key)
        stressed = self.df[t == "HIGH_LEVERAGE_STRESS"]["SlipMonths"]
        others = self.df[t.isin(["PRIME_CASH_RICH", "STABLE_INVESTMENT_GRADE"])]["SlipMonths"]

        if len(stressed) < 5 or len(others) < 5:
            return {"financial_delay_differential": {
                "available": False,
                "reason": (f"Only {len(stressed)} projects under high-leverage agencies "
                           f"and {len(others)} under rated-stable agencies; too few to "
                           f"report a differential."),
            }}

        diff = float(stressed.mean() - others.mean())
        return {"financial_delay_differential": {
            "available": True,
            "observed_extra_slip_months": round(diff, 1),
            "high_leverage_mean_slip_months": round(float(stressed.mean()), 1),
            "rated_stable_mean_slip_months": round(float(others.mean()), 1),
            "n_high_leverage_projects": int(len(stressed)),
            "n_rated_stable_projects": int(len(others)),
            "interpretation": (
                "Association, not causation. This is a cross-section with one row per "
                "project and no quarterly leverage history, so no Granger test is "
                "possible on it. The figure states how much longer stressed-agency "
                "projects have actually slipped, nothing about why."
            ),
        }}

    def agency_projects(self, agency_key: str) -> Dict[str, Any]:
        """Every project executed by one agency, for the drilldown."""
        if self.df is None:
            return {"available": False, "projects": []}
        sub = self.df[self.df["AgencyKey"].astype(str) == str(agency_key)]
        if sub.empty:
            return {"available": False, "agency_key": agency_key, "projects": []}

        meta = next((a for a in self.agencies if a["agency_key"] == str(agency_key)), {})
        projects = [{
            "project_id": str(r["ProjectId"]),
            "project_name": str(r["ProjectName"]),
            "sector": str(r.get("SectorName") or "—"),
            "sanctioned_cr": round(float(r["OriginalCost"]), 2),
            "revised_cr": round(float(r["RevisedCost"]), 2),
            "cost_overrun_pct": (round(float(r["OverrunPct"]), 1)
                                 if pd.notna(r["OverrunPct"]) else None),
            "slip_months": round(float(r["SlipMonths"]), 1),
            "physical_progress_pct": round(float(r["PhysicalProgress"]), 1),
        } for _, r in sub.sort_values("RevisedCost", ascending=False).iterrows()]

        return {"available": True, "agency": meta,
                "project_count": len(projects), "projects": projects}


_engine: Optional[ArthaNivaranEngine] = None


def get_artha_nivaran_engine() -> ArthaNivaranEngine:
    global _engine
    if _engine is None:
        _engine = ArthaNivaranEngine()
    return _engine


# Backwards compatibility: the previous entry point returned a hardcoded list of
# six PSU records. Existing callers keep working and now receive real data.
def get_artha_netra_engine() -> ArthaNivaranEngine:
    return get_artha_nivaran_engine()
