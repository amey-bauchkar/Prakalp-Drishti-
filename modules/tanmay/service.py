"""
Satya-Kavach Forensic Service Module (Pillar 2: Statutory Audit & Regulatory Integrity)
=====================================================================================
Deterministic forensic auditing layer for 2,207 Central Sector infrastructure projects.

Auditing Capabilities:
1. Boundary Bin-Mass Ratio: Identifies localized clustering in [18.0%, 20.0%) vs [20.0%, 22.0%).
2. Statutory CCEA Approval Engine: Versioned rules resolving 5 statutory classifications.
3. CPWD Clause 10CC / NHAI Clause 70 Escalation Cap: Decomposes allowable price variance.
4. Factual Project Timeline Reconstruction: Snapshot state-change diffing without duplication.
5. Systematic Legitimate Explanation Evaluation: 8 candidate cost variance drivers.
6. Minimum-N Peer Benchmarking: Transparent filter disclosure with N<10 and N<20 suppression.
"""

import os
import json
import logging
from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np

from modules.tanmay.rule_engine import get_rule_engine
from modules.tanmay.traced_value import TracedValue, SourceRef
from modules.tanmay.audit_pack import generate_audit_pack, get_audit_pack_generator
from analytics_engine.state_resolution import resolve_state

logger = logging.getLogger("prakalp.satya_kavach")

DATA_PATH = os.path.join("paimana_extracted", "PAIMANA_MASTER_PROJECTS_DATABASE.csv")
WPI_PATH = os.path.join("paimana_extracted", "WPI_CONSTRUCTION_INDEX_HISTORICAL.csv")
LABOR_PATH = os.path.join("paimana_extracted", "CONSTRUCTION_LABOR_WAGE_INDEX.csv")
ENTITY_MAPPING_PATH = os.path.join("paimana_extracted", "CANONICAL_ENTITIES_MAPPING.json")
API_PROJECTS_PATH = os.path.join("paimana_extracted", "API_ALL_PROJECTS.csv")


class SatyaKavachEngine:
    def __init__(self):
        self.df: Optional[pd.DataFrame] = None
        self.snapshots_df: Optional[pd.DataFrame] = None
        self.rule_engine = get_rule_engine()
        self.audit_pack_generator = get_audit_pack_generator()
        self.fitted = False

        # Macro Index series
        self.wpi_by_year: Dict[int, Dict[str, float]] = {}
        self.labor_by_year: Dict[int, float] = {}
        self.entity_mapping: Dict[str, Any] = {}

        self._load_data()

    def _load_data(self):
        # 1. Load WPI Construction Commodity Indices
        if os.path.exists(WPI_PATH):
            try:
                self.wpi_df = pd.read_csv(WPI_PATH)
                for _, r in self.wpi_df.iterrows():
                    yr = int(r["Year"])
                    self.wpi_by_year[yr] = {
                        "steel": float(r.get("Steel_WPI_2011_Base", 100.0)),
                        "cement": float(r.get("Cement_WPI_2011_Base", 100.0)),
                        "bitumen": float(r.get("Bitumen_Fuel_WPI_2011_Base", 100.0)),
                        "basket": float(r.get("Composite_Construction_WPI", 100.0)),
                    }
            except Exception as e:
                logger.warning(f"Could not parse WPI series: {e}")

        # 2. Load Labor Wage Indices
        if os.path.exists(LABOR_PATH):
            try:
                self.labor_df = pd.read_csv(LABOR_PATH)
                for _, r in self.labor_df.iterrows():
                    yr = int(r["Year"])
                    self.labor_by_year[yr] = float(r.get("Labor_Wage_Index_2010_Base", 100.0))
            except Exception as e:
                logger.warning(f"Could not parse Labor series: {e}")

        # 3. Load Canonical Entity Mapping
        if os.path.exists(ENTITY_MAPPING_PATH):
            try:
                with open(ENTITY_MAPPING_PATH, "r", encoding="utf-8") as f:
                    self.entity_mapping = json.load(f).get("mapping_by_raw_string", {})
            except Exception:
                self.entity_mapping = {}

        # 4. Load Multi-Month Snapshots Log (for timeline reconstruction)
        if os.path.exists(API_PROJECTS_PATH):
            try:
                self.snapshots_df = pd.read_csv(API_PROJECTS_PATH, low_memory=False)
            except Exception as e:
                logger.warning(f"Could not load multi-month snapshots: {e}")

        # 5. Load Master Projects Database
        if os.path.exists(DATA_PATH):
            self.df = pd.read_csv(DATA_PATH)
            self._preprocess_projects()
            self.fitted = True

    def _preprocess_projects(self):
        self.df["OriginalCost"] = pd.to_numeric(self.df["OriginalCost"], errors="coerce").fillna(500.0)
        self.df["RevisedCostRaw"] = pd.to_numeric(self.df["RevisedCost"], errors="coerce")
        self.df["HasRevisionOnFile"] = self.df["RevisedCostRaw"].notna()
        self.df["RevisedCost"] = self.df["RevisedCostRaw"].fillna(self.df["OriginalCost"])
        self.df["Expenditure"] = pd.to_numeric(self.df["Expenditure"], errors="coerce").fillna(0.0)
        self.df["PhysicalProgress"] = pd.to_numeric(self.df["PhysicalProgress"], errors="coerce").fillna(0.0)
        self.df["DELAYED_TIME"] = pd.to_numeric(self.df["DELAYED_TIME"], errors="coerce").fillna(0.0)

        # Overrun in INR Cr and Percentage
        # For projects with NO_REVISION_ON_FILE, overrun is explicitly 0.0 under initial sanction
        self.df["OverrunCr"] = np.where(
            self.df["HasRevisionOnFile"],
            np.maximum(0.0, self.df["RevisedCost"] - self.df["OriginalCost"]),
            0.0
        )
        self.df["OverrunPct"] = np.where(
            self.df["HasRevisionOnFile"],
            np.where(
                self.df["OriginalCost"] > 0,
                (self.df["OverrunCr"] / self.df["OriginalCost"]) * 100.0,
                0.0,
            ),
            0.0
        )
        self.df["OverrunPct"] = np.round(self.df["OverrunPct"], 2)

        # Dates & Years
        self.df["SanctionDateParsed"] = pd.to_datetime(self.df["SanctionDate"], errors="coerce", dayfirst=True)
        self.df["RevisedDateParsed"] = pd.to_datetime(self.df["RevisedDate"], errors="coerce", dayfirst=True)
        self.df["SanctionYear"] = self.df["SanctionDateParsed"].dt.year.fillna(2018).astype(int)
        self.df["RevisedYear"] = self.df["RevisedDateParsed"].dt.year.fillna(2026).astype(int)

        # Canonical Agency
        self.df["CanonicalAgency"] = self.df["COMPANYNAME"].map(
            lambda x: self.entity_mapping.get(str(x), {}).get("canonical_id", str(x) if pd.notna(x) else "OTHER_AGENCY")
        )

        # Resolve Rule Classifications across all projects
        classifications = []
        class_labels = []
        proximity_dists = []
        for _, row in self.df.iterrows():
            rev_val = float(row["RevisedCostRaw"]) if pd.notna(row["RevisedCostRaw"]) else None
            res = self.rule_engine.resolve(
                original_cost_cr=float(row["OriginalCost"]),
                revised_cost_cr=rev_val,
                time_overrun_months=float(row["DELAYED_TIME"]),
                sanction_date_str=str(row["SanctionDate"]) if pd.notna(row["SanctionDate"]) else None,
                sector=str(row["SectorName"]) if pd.notna(row["SectorName"]) else None,
            )
            classifications.append(res.classification)
            class_labels.append(res.classification_label)
            proximity_dists.append(res.proximity_distance_pp if res.proximity_distance_pp is not None else 0.0)

        self.df["ForensicClassification"] = classifications
        self.df["ClassificationLabel"] = class_labels
        self.df["ProximityDistancePP"] = proximity_dists

        # Compute Clause 10CC Allowable Cap for all projects
        self._compute_clause_10cc_for_all()

    def _compute_clause_10cc_for_all(self):
        """
        Computes statutory allowable escalation ceiling under CPWD Clause 10CC:
        V_L = 0.85 * OriginalCost * CompositeInflation
        Where 15% is the fixed contractor risk deduction.
        """
        allowed_caps = []
        for _, row in self.df.iterrows():
            orig_cost = float(row["OriginalCost"])
            s_year = int(row["SanctionYear"])
            
            calc = self._calculate_10cc_cap(orig_cost, s_year, p_steel=0.20, p_cement=0.15, p_fuel=0.15, p_labor=0.25, p_other=0.25)
            allowed_caps.append(calc["statutory_allowed_escalation_cr"])

        self.df["Clause10CC_AllowedCr"] = allowed_caps
        self.df["Clause10CC_ExcessClaimCr"] = 0.0
        self.df["Clause10CC_Verdict"] = np.where(self.df["OverrunPct"] >= 20.0, "ESCALATION_CANDIDATE", "COMPLIANT_10CC")

    def _calculate_10cc_cap(
        self,
        original_cost_cr: float,
        sanction_year: int,
        p_steel: float = 0.20,
        p_cement: float = 0.15,
        p_fuel: float = 0.15,
        p_labor: float = 0.25,
        p_other: float = 0.25,
        current_year: int = 2026,
    ) -> Dict[str, Any]:
        """
        Pure deterministic CPWD Clause 10CC arithmetic calculator.
        Verifies ΔIndex as growth: (I - I_0) / I_0 = (ratio - 1).
        """
        curr_wpi = self.wpi_by_year.get(current_year, {"steel": 175.0, "cement": 150.0, "bitumen": 155.0, "basket": 160.0})
        curr_labor = self.labor_by_year.get(current_year, 380.0)

        base_wpi = self.wpi_by_year.get(sanction_year, self.wpi_by_year.get(2015, {"steel": 100.0, "cement": 100.0, "bitumen": 100.0, "basket": 100.0}))
        base_labor = self.labor_by_year.get(sanction_year, self.labor_by_year.get(2015, 193.0))

        delta_steel = (curr_wpi["steel"] - base_wpi["steel"]) / max(1.0, base_wpi["steel"])
        delta_cement = (curr_wpi["cement"] - base_wpi["cement"]) / max(1.0, base_wpi["cement"])
        delta_fuel = (curr_wpi["bitumen"] - base_wpi["bitumen"]) / max(1.0, base_wpi["bitumen"])
        delta_labor = (curr_labor - base_labor) / max(1.0, base_labor)
        delta_other = (curr_wpi["basket"] - base_wpi["basket"]) / max(1.0, base_wpi["basket"])

        composite_inflation = (
            p_steel * delta_steel +
            p_cement * delta_cement +
            p_fuel * delta_fuel +
            p_labor * delta_labor +
            p_other * delta_other
        )

        escalable_base = 0.85 * original_cost_cr
        statutory_escalation = max(0.0, escalable_base * composite_inflation)
        cap_pct_of_original = round((statutory_escalation / max(1.0, original_cost_cr)) * 100.0, 1)

        # Decompose into real intermediate components
        steel_contrib = escalable_base * p_steel * delta_steel
        cement_contrib = escalable_base * p_cement * delta_cement
        fuel_contrib = escalable_base * p_fuel * delta_fuel
        labor_contrib = escalable_base * p_labor * delta_labor
        other_contrib = escalable_base * p_other * delta_other

        is_implausible_legacy = (cap_pct_of_original > 50.0)
        legacy_caveat = (
            "Clause 10CC accrues period-wise on quarterly work bills executed during the contract duration. "
            "Applying cumulative multi-decade inflation against the entire initial contract base over-estimates "
            "allowable escalation for legacy projects (sanctioned >10 years ago) where work was not uniformly executed in the terminal period."
            if is_implausible_legacy else None
        )

        return {
            "original_cost_cr": original_cost_cr,
            "sanction_year": sanction_year,
            "current_year": current_year,
            "escalable_base_cr": round(escalable_base, 2),
            "fixed_risk_deduction_cr": round(0.15 * original_cost_cr, 2),
            "composite_inflation_pct": round(composite_inflation * 100.0, 2),
            "statutory_allowed_escalation_cr": round(statutory_escalation, 2),
            "cap_pct_of_original_cost": cap_pct_of_original,
            "is_implausible_legacy_cap": is_implausible_legacy,
            "legacy_cap_caveat": legacy_caveat,
            "deltas": {
                "steel_growth_pct": round(delta_steel * 100.0, 1),
                "cement_growth_pct": round(delta_cement * 100.0, 1),
                "fuel_growth_pct": round(delta_fuel * 100.0, 1),
                "labor_growth_pct": round(delta_labor * 100.0, 1),
                "other_growth_pct": round(delta_other * 100.0, 1),
            },
            "component_contributions_cr": {
                "steel_cr": round(steel_contrib, 2),
                "cement_cr": round(cement_contrib, 2),
                "fuel_cr": round(fuel_contrib, 2),
                "labor_cr": round(labor_contrib, 2),
                "other_materials_cr": round(other_contrib, 2),
            },
        }

    def get_anti_gaming_summary(self) -> Dict[str, Any]:
        """
        Returns statutory audit summary, Boundary Bin-Mass Ratio,
        and high-audit-priority project cohorts over active revised projects.
        """
        if self.df is None or self.df.empty:
            return {"status": "no_data"}

        active_revised = self.df[self.df["HasRevisionOnFile"]]
        no_rev_count = int((~self.df["HasRevisionOnFile"]).sum())

        # 1. Cohorts
        proximity_cohort = active_revised[active_revised["ForensicClassification"] == "THRESHOLD_PROXIMITY"]
        escalation_cohort = active_revised[active_revised["ForensicClassification"] == "ESCALATION_CANDIDATE"]
        under_18 = active_revised[(active_revised["OverrunPct"] > 0) & (active_revised["OverrunPct"] < 18.0)]
        zero_overrun_active = active_revised[active_revised["OverrunPct"] == 0]

        # 2. Boundary Bin-Mass Ratio: Mass([18.0, 20.0)) / Mass([20.0, 22.0))
        near_above = active_revised[(active_revised["OverrunPct"] >= 20.0) & (active_revised["OverrunPct"] < 22.0)]
        num_count = len(proximity_cohort)
        den_count = max(1, len(near_above))
        bin_mass_ratio = round(num_count / den_count, 2)

        proximity_capital_cr = float(proximity_cohort["RevisedCost"].sum())
        total_portfolio_capex = float(self.df["RevisedCost"].sum())

        # 3. High Audit Priority Sample Projects
        flagged_projects = []
        for _, row in proximity_cohort.sort_values(by="RevisedCost", ascending=False).head(30).iterrows():
            orig_cost = float(row["OriginalCost"])
            rev_cost = float(row["RevisedCost"])
            ov_pct = float(row["OverrunPct"])
            evasion_margin = round(20.0 - ov_pct, 2)
            pid = str(row["ProjectId"])

            flagged_projects.append({
                "project_id": pid,
                "project_name": str(row["ProjectName"]),
                "sector": str(row["SectorName"]),
                "state": resolve_state(pid, row.get("StateName"))[0],
                "agency": str(row["COMPANYNAME"]),
                "original_cost_cr": orig_cost,
                "revised_cost_cr": rev_cost,
                "cost_overrun_cr": float(row["OverrunCr"]),
                "overrun_pct": ov_pct,
                "evasion_margin_pct": evasion_margin,
                "time_overrun_months": float(row["DELAYED_TIME"]),
                "physical_progress_pct": float(row["PhysicalProgress"]),
                "classification": str(row["ForensicClassification"]),
                "classification_label": str(row["ClassificationLabel"]),
                "statutory_rule_citation": "TODO_HUMAN_VERIFY (Cabinet 20% Cost Revision Boundary Rule)",
                "audit_action": "Examine Revised Cost Estimate (RCE) submission dates and Standing Committee on Cost Overruns (SCCO) justification notes.",
            })

        return {
            "status": "success",
            "module": "SATYA-KAVACH",
            "module_lead": "Tanmay",
            "positioning_statement": "A deterministic forensic layer that identifies statistically anomalous cost-reporting and contractual escalation patterns, quantifies the financial exposure, and produces an evidence-backed audit trail for human review.",
            "mccrary_bunching_signal": {
                "boundary_bin_mass_ratio": bin_mass_ratio,
                "density_ratio": bin_mass_ratio,  # Alias for backward-compatible tests
                "numerator_count": num_count,
                "denominator_count": len(near_above),
                "numerator_bin": "[18.0%, 20.0%)",
                "denominator_bin": "[20.0%, 22.0%)",
                "total_active_population": len(active_revised),
                "excluded_no_revision_count": no_rev_count,
                "threshold_boundary_pct": 20.0,
                "interpretation": f"Boundary Bin-Mass Ratio of {bin_mass_ratio}x across active revised cohort.",
                "methodological_disclosure": (
                    "Observational boundary bin-mass comparison comparing the 2 pp proximity window below the 20% CCEA Cabinet threshold "
                    f"([18.0%, 20.0%), n={num_count}) vs the 2 pp window above it ([20.0%, 22.0%), n={len(near_above)}) "
                    f"across active revised projects (N={len(active_revised)}). Proximity is an indicator for audit triage, not proof of intent."
                ),
                "finding": "ELEVATED_BOUNDARY_MASS" if bin_mass_ratio > 1.20 else "STANDARD_DISTRIBUTION",
                "p_value_disclaimer": "Empirical bin-mass ratio; formal density discontinuity test requires continuity assumptions in comparison bin.",
            },
            "kpi_metrics": {
                "total_projects_analyzed": len(self.df),
                "active_revised_projects": len(active_revised),
                "no_revision_on_file_projects": no_rev_count,
                "projects_in_bunching_zone_18_20pct": len(proximity_cohort),
                "projects_above_20pct_cabinet_rule": len(escalation_cohort),
                "projects_under_18pct": len(under_18),
                "zero_overrun_projects": len(zero_overrun_active),
                "bunching_zone_capital_cr": round(proximity_capital_cr, 2),
                "total_portfolio_capex_cr": round(total_portfolio_capex, 2),
                "bunching_capital_share_pct": round((proximity_capital_cr / max(1.0, total_portfolio_capex)) * 100.0, 2),
                "total_unjustified_excess_margin_cr": 0.0,
            },
            "flagged_sample_projects": flagged_projects,
        }

    def get_bunching_histogram_data(self) -> Dict[str, Any]:
        """
        Generates distribution bins over the Active Revised Population (N = 1,183).
        Projects with NO_REVISION_ON_FILE (1,024 projects) are excluded from the distribution
        with explicit metadata reported.
        """
        if self.df is None or self.df.empty:
            return {"bins": []}

        active_revised = self.df[self.df["HasRevisionOnFile"]]
        no_rev_count = int((~self.df["HasRevisionOnFile"]).sum())

        bins_def = [
            ("0% (Filed Revision On-Budget)", 0.0, 0.01),
            ("0.1% - 5.0%", 0.01, 5.0),
            ("5.0% - 10.0%", 5.0, 10.0),
            ("10.0% - 15.0%", 10.0, 15.0),
            ("15.0% - 18.0%", 15.0, 18.0),
            ("18.0% - 19.99% (Threshold Proximity)", 18.0, 20.0),  # PROXIMITY BAND
            ("20.0% - 22.0% (Cabinet Threshold Met)", 20.0, 22.0),
            ("22.0% - 25.0%", 22.0, 25.0),
            ("25.0% - 30.0%", 25.0, 30.0),
            ("30.0% - 40.0%", 30.0, 40.0),
            ("40.0% - 50.0%", 40.0, 50.0),
            ("50.0%+ (Substantive Overrun)", 50.0, 10000.0),
        ]

        hist_items = []
        for label, low, high in bins_def:
            if low == high or high == 0.01:
                sub = active_revised[active_revised["OverrunPct"] == 0]
            elif high >= 10000.0:
                sub = active_revised[active_revised["OverrunPct"] >= low]
            else:
                sub = active_revised[(active_revised["OverrunPct"] >= low) & (active_revised["OverrunPct"] < high)]

            is_proximity = (low == 18.0 and high == 20.0)
            is_cabinet = (low >= 20.0)

            hist_items.append({
                "bin_label": label,
                "range_min": low,
                "range_max": high,
                "project_count": int(len(sub)),
                "total_capex_cr": round(float(sub["RevisedCost"].sum()), 2),
                "is_bunching_spike": is_proximity,
                "is_cabinet_breached": is_cabinet,
                "classification_context": "THRESHOLD_PROXIMITY" if is_proximity else ("ESCALATION_CANDIDATE" if is_cabinet else "STANDARD_DISTRIBUTION"),
                "color": "#D97706" if is_proximity else ("#E11D48" if is_cabinet else "#2563EB"),
            })

        return {
            "title": "Cost Overrun Distribution & Boundary Analysis",
            "threshold_reference_pct": 20.0,
            "population_metadata": {
                "total_master_projects": len(self.df),
                "active_revised_count": len(active_revised),
                "excluded_no_revision_count": no_rev_count,
                "mean_overrun_pct": round(float(active_revised["OverrunPct"].mean()), 2),
                "median_overrun_pct": round(float(active_revised["OverrunPct"].median()), 2),
                "p75_overrun_pct": round(float(active_revised["OverrunPct"].quantile(0.75)), 2),
            },
            "methodology_note": "Distributional pattern displays active cost-revision density (N=1,183). 1,024 projects operating under baseline sanction (No Revision on File) are excluded from the distribution.",
            "bins": hist_items,
        }

    def get_clause_10cc_audit_report(self, limit: int = 50, sector_filter: Optional[str] = None) -> Dict[str, Any]:
        """
        Audited portfolio ledger returning statutory allowable ceilings.
        """
        if self.df is None or self.df.empty:
            return {"records": []}

        sub_df = self.df[self.df["HasRevisionOnFile"]]
        if sector_filter and sector_filter != "All":
            sub_df = sub_df[sub_df["SectorName"] == sector_filter]

        priority_df = sub_df.sort_values(by="OverrunPct", ascending=False)

        results = []
        for _, row in priority_df.head(limit).iterrows():
            orig_cost = float(row["OriginalCost"])
            rev_cost = float(row["RevisedCost"])
            allowed_esc = float(row["Clause10CC_AllowedCr"])
            pid = str(row["ProjectId"])
            cap_pct = round((allowed_esc / max(1.0, orig_cost)) * 100.0, 1)

            results.append({
                "project_id": pid,
                "project_name": str(row["ProjectName"]),
                "sector": str(row["SectorName"]),
                "state": resolve_state(pid, row.get("StateName"))[0],
                "agency": str(row["COMPANYNAME"]),
                "sanction_year": int(row["SanctionYear"]),
                "original_cost_cr": orig_cost,
                "revised_cost_cr": rev_cost,
                "cost_overrun_pct": float(row["OverrunPct"]),
                "claimed_escalation_cr": float(row["OverrunCr"]),
                "statutory_10cc_allowed_cr": allowed_esc,
                "cap_pct_of_original_cost": cap_pct,
                "is_implausible_legacy_cap": cap_pct > 50.0,
                "excess_margin_claimed_cr": 0.0,
                "claimed_escalation_status": "UNAVAILABLE_NO_CLAIM_FILED",
                "verdict": str(row["ClassificationLabel"]),
                "statutory_rule_citation": "CPWD GCC Clause 10CC (85% escalable ceiling pegged to bid date indices)",
                "assumption_notice": "Model-dependent — contract Schedule F required",
            })

        return {
            "statutory_framework": "CPWD General Conditions of Contract Section 10CC / NHAI Clause 70",
            "statutory_escalable_cap_pct": 85.0,
            "fixed_contractor_overhead_pct": 15.0,
            "total_portfolio_excess_claimed_cr": 0.0,
            "audited_records": results,
        }

    def get_agency_gaming_rankings(
        self,
        mode: str = "composite",
        min_projects: int = 5
    ) -> Dict[str, Any]:
        """
        Agency Pattern Overview:
        Supports dual triage views:
        - mode='proximity_queue': Ranked strictly by bunching rate in [18%, 20%).
        - mode='overrun_queue': Ranked by escalation candidate rate and overrun scale.
        - mode='composite': Balanced APS triage score.
        Gated by min_projects (default N >= 5).
        """
        if self.df is None or self.df.empty:
            return {"rankings": []}

        agency_stats = []
        for canonical_id, group in self.df.groupby("CanonicalAgency"):
            total_proj = len(group)
            if total_proj < min_projects:
                continue

            # Determine clean canonical display name
            canonical_info = None
            for raw_val in group["COMPANYNAME"].dropna().unique():
                if str(raw_val) in self.entity_mapping:
                    canonical_info = self.entity_mapping[str(raw_val)]
                    break

            if canonical_info:
                c_name = canonical_info.get("canonical_name") or str(canonical_id)
                c_id = canonical_info.get("canonical_id", "")
                if c_id and len(c_id) <= 7 and c_id.isupper() and f"[{c_id}]" not in c_name and f"({c_id})" not in c_name and c_id != c_name:
                    display_name = f"{c_name} [{c_id}]"
                else:
                    display_name = c_name
            else:
                display_name = str(group["COMPANYNAME"].iloc[0] if pd.notna(group["COMPANYNAME"].iloc[0]) else canonical_id)

            bunch_count = len(group[group["ForensicClassification"] == "THRESHOLD_PROXIMITY"])
            cabinet_count = len(group[group["ForensicClassification"] == "ESCALATION_CANDIDATE"])
            bunch_rate = round((bunch_count / total_proj) * 100.0, 1)
            cabinet_rate = round((cabinet_count / total_proj) * 100.0, 1)

            total_orig = float(group["OriginalCost"].sum())
            total_rev = float(group["RevisedCost"].sum())
            total_overrun_cr = max(0.0, total_rev - total_orig)

            # Audit Priority Score (APS) [0 - 100]
            aps_score = min(100.0, round((bunch_rate * 0.40) + (cabinet_rate * 0.40) + min(20.0, (total_proj / 50.0) * 20.0), 1))
            priority_tier = "HIGH_AUDIT_PRIORITY" if aps_score >= 35.0 else ("MODERATE_REVIEW" if aps_score >= 15.0 else "STANDARD_MONITORING")

            # Entity Classification (Central PSU vs State/JV executing entity)
            is_state = bool(
                group["COMPANYNAME"].astype(str).str.contains("State|Govt of|Government of|Nigam|Pradesh|Metro Rail", case=False, na=False).any() or
                group["LineMinistry"].astype(str).str.contains("State|Govt of|Government of", case=False, na=False).any()
            )
            entity_type = "State / JV Executing Entity" if is_state else "Central Ministry / PSU"

            agency_stats.append({
                "agency_name": display_name,
                "canonical_id": str(canonical_id),
                "entity_type": entity_type,
                "is_state_executing_entity": is_state,
                "total_projects": total_proj,
                "bunching_projects_18_20pct": bunch_count,
                "cabinet_breached_projects": cabinet_count,
                "bunching_rate_pct": bunch_rate,
                "escalation_candidate_rate_pct": cabinet_rate,
                "total_sanctioned_capex_cr": round(total_orig, 2),
                "total_revised_capex_cr": round(total_rev, 2),
                "total_overrun_capex_cr": round(total_overrun_cr, 2),
                "total_excess_margin_claimed_cr": 0.0,
                "institutional_gaming_score": aps_score,  # Backward-compatible alias
                "audit_priority_score": aps_score,
                "audit_priority_breakdown": {
                    "proximity_density_weight_pct": 40.0,
                    "proximity_component": round(bunch_rate * 0.40, 1),
                    "escalation_rate_weight_pct": 40.0,
                    "escalation_component": round(cabinet_rate * 0.40, 1),
                    "portfolio_scale_weight_pct": 20.0,
                    "scale_component": round(min(20.0, (total_proj / 50.0) * 20.0), 1),
                },
                "risk_tier": "HIGH_GAMING_RISK" if aps_score >= 35.0 else ("MODERATE_WATCHLIST" if aps_score >= 15.0 else "LOW_RISK"),
                "audit_priority_tier": priority_tier,
                "triage_guidance": "Triage priority for human review sampling. Does not establish organizational intent.",
            })

        # Sorting logic by mode
        if mode == "proximity_queue":
            agency_stats.sort(key=lambda x: (x["bunching_rate_pct"], x["bunching_projects_18_20pct"]), reverse=True)
        elif mode == "overrun_queue":
            agency_stats.sort(key=lambda x: (x["escalation_candidate_rate_pct"], x["total_overrun_capex_cr"]), reverse=True)
        else:
            agency_stats.sort(key=lambda x: (x["audit_priority_score"], x["bunching_projects_18_20pct"]), reverse=True)

        return {
            "title": "Agency Pattern Overview & Triage Queue",
            "active_mode": mode,
            "min_projects_gate": min_projects,
            "total_agencies_evaluated": len(agency_stats),
            "scoring_methodology": "Audit Priority Score (APS) = 0.40*(Proximity Rate) + 0.40*(Escalation Rate) + 0.20*(Portfolio Scale)",
            "rankings": agency_stats[:30],
        }

    def simulate_clause_10cc(
        self,
        original_cost_cr: float,
        sanction_year: int,
        revised_cost_cr: float,
        claimed_escalation_cr: Optional[float] = None,
        p_steel: float = 0.20,
        p_cement: float = 0.15,
        p_fuel: float = 0.15,
        p_labor: float = 0.25,
        p_other: float = 0.25,
    ) -> Dict[str, Any]:
        """
        Operator What-If Simulator: Allows officers to test hypothetical contractor claims
        and material component weights against statutory 85% CPWD Clause 10CC caps.
        """
        calc = self._calculate_10cc_cap(
            original_cost_cr=original_cost_cr,
            sanction_year=sanction_year,
            p_steel=p_steel,
            p_cement=p_cement,
            p_fuel=p_fuel,
            p_labor=p_labor,
            p_other=p_other,
        )

        statutory_cap = calc["statutory_allowed_escalation_cr"]
        claimed_esc = float(claimed_escalation_cr) if claimed_escalation_cr is not None else max(0.0, revised_cost_cr - original_cost_cr)
        unsupported_variance = max(0.0, claimed_esc - statutory_cap)
        overrun_pct = round((max(0.0, revised_cost_cr - original_cost_cr) / max(1.0, original_cost_cr)) * 100.0, 2)

        traced_cap = TracedValue.computed(
            value=statutory_cap,
            unit="₹ Cr",
            formula="0.85 * OriginalCost * CompositeInflation",
            inputs=[
                {"name": "OriginalCost", "value": original_cost_cr, "unit": "₹ Cr"},
                {"name": "EscalableBase (85%)", "value": calc["escalable_base_cr"], "unit": "₹ Cr"},
                {"name": "CompositeInflation", "value": calc["composite_inflation_pct"], "unit": "%"},
            ],
            sources=[
                SourceRef(dataset="WPI_CONSTRUCTION_INDEX_HISTORICAL", record_id=str(sanction_year), field_name="WPI_Commodities"),
                SourceRef(dataset="CONSTRUCTION_LABOR_WAGE_INDEX", record_id=str(sanction_year), field_name="Labor_Wage_Index"),
            ],
            assumptions=["Standard CPWD GCC model weight fractions applied (20% steel, 15% cement, 15% fuel, 25% labor, 25% other)"],
            finding_capped_at="AMBER",
        )

        traced_variance = TracedValue.computed(
            value=round(unsupported_variance, 2),
            unit="₹ Cr",
            formula="max(0.0, OperatorClaimedEscalation - Statutory10CCCap)",
            inputs=[
                {"name": "OperatorClaimedEscalation", "value": claimed_esc, "unit": "₹ Cr"},
                {"name": "Statutory10CCCap", "value": statutory_cap, "unit": "₹ Cr"},
            ],
            assumptions=["Model-dependent — contract Schedule F required"],
            finding_capped_at="AMBER",
        )

        return {
            "inputs": {
                "original_cost_cr": original_cost_cr,
                "sanction_year": sanction_year,
                "revised_cost_cr": revised_cost_cr,
                "operator_claimed_escalation_cr": claimed_esc,
                "weights": {
                    "steel_pct": p_steel * 100,
                    "cement_pct": p_cement * 100,
                    "fuel_bitumen_pct": p_fuel * 100,
                    "labor_pct": p_labor * 100,
                    "other_materials_pct": p_other * 100,
                },
            },
            "macro_indices": {
                "base_year": sanction_year,
                "current_year": calc["current_year"],
                "steel_growth_pct": calc["deltas"]["steel_growth_pct"],
                "cement_growth_pct": calc["deltas"]["cement_growth_pct"],
                "fuel_growth_pct": calc["deltas"]["fuel_growth_pct"],
                "labor_growth_pct": calc["deltas"]["labor_growth_pct"],
                "other_growth_pct": calc["deltas"]["other_growth_pct"],
            },
            "composite_inflation_pct": calc["composite_inflation_pct"],
            "escalable_base_cr": calc["escalable_base_cr"],
            "fixed_risk_deduction_cr": calc["fixed_risk_deduction_cr"],
            "statutory_allowed_escalation_cr": statutory_cap,
            "claimed_overrun_pct": overrun_pct,
            "is_ccea_threshold_evasion": bool(18.0 <= overrun_pct < 20.0),
            "cap_pct_of_original_cost": calc["cap_pct_of_original_cost"],
            "is_implausible_legacy_cap": calc["is_implausible_legacy_cap"],
            "legacy_cap_caveat": calc["legacy_cap_caveat"],
            "unsupported_variance_cr": round(unsupported_variance, 2),
            "traced_statutory_cap": traced_cap.model_dump(),
            "traced_unsupported_variance": traced_variance.model_dump(),
            "finding_badge": "MODEL_DEPENDENT_SCHEDULE_F_REQUIRED",
            "statutory_citation": "CPWD GCC Clause 10CC (85% escalable ceiling)",
        }

    def get_project_forensic_dossier(self, project_id: str) -> Dict[str, Any]:
        """
        Builds the comprehensive factual forensic dossier for a specific project ID (§7).
        """
        if self.df is None or self.df.empty:
            return {"status": "no_data"}

        matches = self.df[self.df["ProjectId"].astype(str) == str(project_id)]
        if matches.empty:
            return {"status": "not_found", "project_id": str(project_id)}

        row = matches.iloc[0]
        orig_cost = float(row["OriginalCost"])
        rev_cost = float(row["RevisedCost"])
        has_rev = bool(row["HasRevisionOnFile"])
        rev_raw = float(row["RevisedCostRaw"]) if has_rev else None
        expenditure = float(row["Expenditure"])
        progress = float(row["PhysicalProgress"])
        delay_months = float(row["DELAYED_TIME"])
        ov_pct = float(row["OverrunPct"])
        s_year = int(row["SanctionYear"])
        sector = str(row["SectorName"])
        agency = str(row["COMPANYNAME"])
        p_name = str(row["ProjectName"])
        state = resolve_state(str(project_id), row.get("StateName"))[0]

        # 1. Rule Resolution
        rule_res = self.rule_engine.resolve(
            original_cost_cr=orig_cost,
            revised_cost_cr=rev_raw,
            time_overrun_months=delay_months,
            sanction_date_str=str(row["SanctionDate"]) if pd.notna(row["SanctionDate"]) else None,
            sector=sector,
        )

        # 2. Audit Priority Score for Project
        prox_score = max(0.0, 40.0 - (rule_res.proximity_distance_pp or 20.0) * 15.0) if rule_res.classification == "THRESHOLD_PROXIMITY" else (40.0 if ov_pct >= 20.0 else 5.0)
        overrun_score = min(30.0, (ov_pct / 50.0) * 30.0)
        delay_score = min(30.0, (delay_months / 36.0) * 30.0)
        aps_total = round(min(100.0, prox_score + overrun_score + delay_score), 1)

        # 3. Contributing Signals (§7.1)
        signals = []
        if rule_res.classification == "THRESHOLD_PROXIMITY":
            signals.append({
                "signal_id": "SIG_PROXIMITY_BAND",
                "title": "Cabinet Boundary Proximity",
                "severity": "AMBER",
                "description": f"Cost revision of +{ov_pct}% is positioned {rule_res.proximity_distance_pp} pp below the 20.0% CCEA Cabinet threshold.",
                "metric": f"{rule_res.proximity_distance_pp} pp gap",
            })
        if ov_pct >= 20.0:
            signals.append({
                "signal_id": "SIG_ESCALATION_BREACH",
                "title": "Mandatory Cabinet Re-sanction Met",
                "severity": "RED",
                "description": f"Cost increase (+{ov_pct}%) meets the >=20% statutory boundary for revised Cabinet approval.",
                "metric": f"+{ov_pct}% overrun",
            })
        if delay_months >= 24.0:
            signals.append({
                "signal_id": "SIG_SCHEDULE_DELAY",
                "title": "Substantive Time Extension",
                "severity": "AMBER",
                "description": f"Schedule overrun of {delay_months} months exceeds 24-month administrative delegation limit.",
                "metric": f"{delay_months} months",
            })

        # 4. Project Evidence Timeline (§7.2) - Reconstructed from snapshot state-change diffs
        timeline_events = self._reconstruct_timeline(project_id, row)

        # 5. Clause 10CC Calculation & Exposure Trace (§7.6, §7.7)
        calc_10cc = self._calculate_10cc_cap(orig_cost, s_year)
        statutory_cap = calc_10cc["statutory_allowed_escalation_cr"]

        # Traced values for financial exposure
        traced_orig = TracedValue.raw_field(orig_cost, "OriginalCost", str(project_id), unit="₹ Cr")
        traced_rev = TracedValue.raw_field(rev_cost, "RevisedCost", str(project_id), unit="₹ Cr")
        traced_cap = TracedValue.computed(
            value=statutory_cap,
            unit="₹ Cr",
            formula="0.85 * OriginalCost * CompositeInflation",
            inputs=[
                traced_orig.model_dump(),
                {"name": "EscalableBase (85%)", "value": calc_10cc["escalable_base_cr"], "unit": "₹ Cr"},
                {"name": "CompositeInflation", "value": calc_10cc["composite_inflation_pct"], "unit": "%"},
            ],
            sources=[
                SourceRef(dataset="WPI_CONSTRUCTION_INDEX_HISTORICAL", record_id=str(s_year), field_name="WPI_Commodities"),
                SourceRef(dataset="CONSTRUCTION_LABOR_WAGE_INDEX", record_id=str(s_year), field_name="Labor_Wage_Index"),
            ],
            assumptions=["Standard CPWD GCC model weight fractions applied (20% steel, 15% cement, 15% fuel, 25% labor, 25% other)"],
            finding_capped_at="AMBER",
        )

        traced_claim = TracedValue.unavailable(
            reason="Contractor itemized escalation claim filing is not recorded in the statutory CUF database.",
            missing_inputs=["Contractor_Escalation_Claim_Invoices", "Contract_Schedule_F"],
            unit="₹ Cr",
        )

        traced_variance = TracedValue.unavailable(
            reason="Financial variance decomposition unavailable — contractor claim invoices unattached.",
            missing_inputs=["Contractor_Escalation_Claim_Invoices"],
            unit="₹ Cr",
        )

        # 6. Legitimate Explanation Panel (§7.4)
        legitimate_explanations = self._evaluate_legitimate_explanations(row, calc_10cc)

        # 7. Peer Benchmarking (§7.5) over active revised population
        peer_benchmark = self._compute_peer_benchmark(
            orig_cost=orig_cost,
            sector=sector,
            sanction_year=s_year,
            project_overrun_pct=ov_pct,
        )

        # 8. Assemble Dossier Payload
        return {
            "project_id": str(project_id),
            "project_name": p_name,
            "sector": sector,
            "state": state,
            "agency": agency,
            "has_revision_on_file": has_rev,
            "sanction_date": str(row["SanctionDate"]) if pd.notna(row["SanctionDate"]) else "Unavailable",
            "revised_date": str(row["RevisedDate"]) if (has_rev and pd.notna(row["RevisedDate"])) else "None Filed",
            "sanction_year": s_year,
            "original_cost_cr": orig_cost,
            "revised_cost_cr": rev_cost,
            "cost_overrun_cr": float(row["OverrunCr"]),
            "overrun_pct": ov_pct,
            "expenditure_cr": expenditure,
            "physical_progress_pct": progress,
            "time_overrun_months": delay_months,
            "classification": rule_res.classification,
            "classification_label": rule_res.classification_label,
            "required_approval_authority": rule_res.required_approval_authority,
            "statutory_citation": rule_res.citation,
            "proximity_distance_pp": rule_res.proximity_distance_pp,
            "audit_priority_score": aps_total,
            "audit_priority_breakdown": {
                "proximity_component": prox_score,
                "overrun_component": overrun_score,
                "delay_component": delay_score,
                "total_score": aps_total,
            },
            "contributing_signals": signals,
            "timeline_events": timeline_events,
            "financial_exposure": {
                "statutory_allowed_escalation_cr": statutory_cap,
                "cap_pct_of_original_cost": calc_10cc["cap_pct_of_original_cost"],
                "is_implausible_legacy_cap": calc_10cc["is_implausible_legacy_cap"],
                "legacy_cap_caveat": calc_10cc["legacy_cap_caveat"],
                "traced_statutory_cap": traced_cap.model_dump(),
                "traced_claimed_escalation": traced_claim.model_dump(),
                "traced_unsupported_variance": traced_variance.model_dump(),
            },
            "clause_10cc": {
                "statutory_allowed_escalation_cr": statutory_cap,
                "cap_pct_of_original_cost": calc_10cc["cap_pct_of_original_cost"],
                "is_implausible_legacy_cap": calc_10cc["is_implausible_legacy_cap"],
                "legacy_cap_caveat": calc_10cc["legacy_cap_caveat"],
                "traced_statutory_cap": traced_cap.model_dump(),
                "traced_claimed_escalation": traced_claim.model_dump(),
                "traced_unsupported_variance": traced_variance.model_dump(),
                "macro_deltas": calc_10cc["deltas"],
                "component_contributions_cr": calc_10cc["component_contributions_cr"],
                "assumption_notice": "Model-dependent — contract Schedule F required (Assumed standard weights cap finding at Amber)",
            },
            "legitimate_explanations": legitimate_explanations,
            "peer_benchmark": peer_benchmark,
            "source_references": [
                {"dataset": "PAIMANA_MASTER_PROJECTS_DATABASE", "record_id": str(project_id), "field_name": "OriginalCost/RevisedCost"},
                {"dataset": "WPI_CONSTRUCTION_INDEX_HISTORICAL", "record_id": str(s_year), "field_name": "WPI_Commodities"},
                {"dataset": "CONSTRUCTION_LABOR_WAGE_INDEX", "record_id": str(s_year), "field_name": "Labor_Wage_Index"},
            ],
        }

    def _reconstruct_timeline(self, project_id: str, master_row: pd.Series) -> List[Dict[str, Any]]:
        """
        Deduplicates snapshots to emit events ONLY upon actual state changes (§7.2).
        Resolves event date to the month the value first changed and suppresses null/nan strings.
        """
        events = []
        
        # 1. Baseline Administrative Approval Event
        s_date = str(master_row["SanctionDate"]) if pd.notna(master_row["SanctionDate"]) and str(master_row["SanctionDate"]).strip() != "nan" else "Baseline Sanction"
        orig_cost = float(master_row["OriginalCost"])
        events.append({
            "event_type": "ORIGINAL_SANCTION",
            "date": s_date,
            "title": "Initial Administrative Approval & Sanction",
            "cost_cr": orig_cost,
            "overrun_pct": 0.0,
            "distance_to_boundary_pp": 20.0,
            "details": f"Sanctioned at ₹{orig_cost:,.2f} Cr under original administrative scope.",
        })

        # 2. Extract intermediate progression events from snapshots only on true state change
        if self.snapshots_df is not None:
            sub = self.snapshots_df[self.snapshots_df["ProjectId"].astype(str) == str(project_id)]
            if len(sub) > 1:
                prev_cost = orig_cost
                prev_date = None
                prev_dist = 20.0
                
                for idx, r in sub.iterrows():
                    rev_c = pd.to_numeric(r.get("RevisedCost"), errors="coerce")
                    rev_d = r.get("RevisedDate")
                    rev_d_str = str(rev_d).strip() if pd.notna(rev_d) and str(rev_d).strip() not in ["", "nan", "None"] else None
                    
                    if pd.notna(rev_c) and rev_c > 0:
                        # Check if a true state change occurred
                        if abs(float(rev_c) - prev_cost) > 0.01 or (rev_d_str and rev_d_str != prev_date):
                            ov = round(((float(rev_c) - orig_cost) / max(1.0, orig_cost)) * 100.0, 2)
                            dist = round(20.0 - ov, 2)
                            
                            callout = None
                            if abs(prev_dist - dist) >= 0.1:
                                callout = f"Distance to 20% Cabinet boundary shifted from {prev_dist} pp to {dist} pp."
                            
                            event_date = rev_d_str or s_date
                            events.append({
                                "event_type": "REVISED_COST_FILING",
                                "date": event_date,
                                "title": "Revised Cost Filing Event",
                                "cost_cr": float(rev_c),
                                "overrun_pct": ov,
                                "distance_to_boundary_pp": dist,
                                "boundary_callout": callout,
                                "details": f"Cost revision recorded at ₹{float(rev_c):,.2f} Cr (+{ov}% overrun).",
                            })
                            
                            prev_cost = float(rev_c)
                            prev_date = rev_d_str
                            prev_dist = dist

        # 3. Latest Recorded State Event
        latest_rev = float(master_row["RevisedCost"])
        latest_ov = float(master_row["OverrunPct"])
        latest_dist = round(20.0 - latest_ov, 2)
        has_rev = bool(master_row["HasRevisionOnFile"])
        
        # Only add latest state if distinct from existing events
        if not any(abs(e["cost_cr"] - latest_rev) < 0.01 and e["event_type"] != "ORIGINAL_SANCTION" for e in events):
            if has_rev:
                l_date = str(master_row["RevisedDate"]) if pd.notna(master_row["RevisedDate"]) and str(master_row["RevisedDate"]).strip() != "nan" else "Latest Snapshot"
                events.append({
                    "event_type": "LATEST_APPROVED_STATE",
                    "date": l_date,
                    "title": "Latest Approved Status",
                    "cost_cr": latest_rev,
                    "overrun_pct": latest_ov,
                    "distance_to_boundary_pp": latest_dist,
                    "details": f"Current approved outlay at ₹{latest_rev:,.2f} Cr ({latest_ov}% overrun).",
                })

        return events

    def _evaluate_legitimate_explanations(self, row: pd.Series, calc_10cc: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Systematic screening across 8 candidate cost variance drivers (§7.4).
        Unifies unverified status to 'UNVERIFIED_IN_DATA'.
        """
        ov_pct = float(row["OverrunPct"])
        inflation_pct = calc_10cc["composite_inflation_pct"]

        explanations = []

        # 1. Commodity Inflation
        if inflation_pct >= (0.80 * max(1.0, ov_pct)):
            explanations.append({
                "category": "Commodity & Material Inflation",
                "status": "SUPPORTED",
                "evidence": f"Macroeconomic WPI/CPI composite growth (+{inflation_pct}%) accounts for >=80% of observed project cost overrun (+{ov_pct}%).",
                "missing_document": None,
            })
        else:
            explanations.append({
                "category": "Commodity & Material Inflation",
                "status": "UNVERIFIED_IN_DATA",
                "evidence": f"Statutory price index increase (+{inflation_pct}%) explains a fraction of the +{ov_pct}% cost revision.",
                "missing_document": "Contract Schedule F & Monthly RA Bill Indices",
            })

        # 2-8 Standard Categories (Unverified in Data without documentary filing)
        categories = [
            ("Approved Scope Expansion", "Revised Detailed Project Report (DPR) & PIB Approval"),
            ("Statutory & Land Clearance Delay", "PARIVESH Stage-II Clearance & Section 19 LA Gazette"),
            ("Geotechnical & Quantity Variation", "Site Investigation Report & Variation Change Orders"),
            ("Revised Technical Specifications", "IRC/CPWD Technical Sanction Amendment Order"),
            ("Foreign Exchange Rate Fluctuation", "Customs Invoices & RBI Forex Settlement Records"),
            ("Force Majeure & Climate Disruption", "District Collector Disaster Notification"),
            ("Statutory Tax & Levy Adjustments", "GST Notification & Royalty Schedule Revisions"),
        ]

        for cat_name, doc_req in categories:
            explanations.append({
                "category": cat_name,
                "status": "UNVERIFIED_IN_DATA",
                "evidence": f"No structured {cat_name.lower()} variance records filed in statutory MoSPI database for this project.",
                "missing_document": doc_req,
            })

        return explanations

    def _compute_peer_benchmark(
        self,
        orig_cost: float,
        sector: str,
        sanction_year: int,
        project_overrun_pct: float = 0.0,
        project_ov_pct: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Enforces strict sample-size suppression floors (§7.5):
        - Active revised cohort only (excludes NO_REVISION_ON_FILE).
        - If N < 10: Suppress panel completely.
        - If 10 <= N < 20: Show cohort median; suppress percentile rank.
        - If N >= 20: Full benchmark available.
        """
        if project_ov_pct is not None:
            project_overrun_pct = project_ov_pct

        if self.df is None or self.df.empty:
            return {"status": "UNAVAILABLE", "suppression_reason": "Master dataset not loaded"}

        # Filter strictly over Active Revised Cohort
        active_df = self.df[self.df["HasRevisionOnFile"] == True]

        sector_col = "SectorName" if "SectorName" in active_df.columns else "Sector"
        sector_active = active_df[active_df[sector_col].astype(str).str.lower() == str(sector).lower()]
        if sector_active.empty:
            return {
                "status": "PANEL_SUPPRESSED_INSUFFICIENT_N",
                "peer_count": 0,
                "selection_criteria": {
                    "sector": sector,
                    "cost_band": f"₹{orig_cost * 0.5:,.0f} Cr to ₹{orig_cost * 1.5:,.0f} Cr",
                    "vintage_window": f"{sanction_year - 3} to {sanction_year + 3}",
                    "peer_count": 0,
                    "sector_total_projects": 0,
                },
                "sector_median_overrun_pct": None,
                "peer_median_overrun_pct": None,
                "percentile_rank": None,
                "peer_iqr": None,
                "suppression_reason": f"No active revised peer projects found in sector '{sector}'.",
            }

        sector_median = round(float(sector_active["OverrunPct"].median()), 1)

        # Cost band: +/- 50%
        cost_min = orig_cost * 0.50
        cost_max = orig_cost * 1.50

        # Vintage window: +/- 3 years
        vintage_min = sanction_year - 3
        vintage_max = sanction_year + 3

        peers = sector_active[
            (sector_active["OriginalCost"] >= cost_min) &
            (sector_active["OriginalCost"] <= cost_max) &
            (sector_active["SanctionYear"] >= vintage_min) &
            (sector_active["SanctionYear"] <= vintage_max)
        ]

        peer_count = len(peers)
        selection_criteria = {
            "sector": sector,
            "cost_band": f"₹{cost_min:,.0f} Cr to ₹{cost_max:,.0f} Cr",
            "vintage_window": f"{vintage_min} to {vintage_max}",
            "peer_count": peer_count,
            "sector_total_projects": len(sector_active),
        }

        # Case 1: N < 10 -> Suppress panel completely
        if peer_count < 10:
            return {
                "status": "PANEL_SUPPRESSED_INSUFFICIENT_N",
                "peer_count": peer_count,
                "selection_criteria": selection_criteria,
                "sector_median_overrun_pct": sector_median,
                "peer_median_overrun_pct": None,
                "percentile_rank": None,
                "peer_iqr": None,
                "suppression_reason": f"Peer cohort sample size (N={peer_count}) is below the minimum threshold of 10 projects required for statistical validity.",
            }

        peer_overruns = peers["OverrunPct"].values
        peer_median = round(float(np.median(peer_overruns)), 1)
        p25 = round(float(np.percentile(peer_overruns, 25)), 1)
        p75 = round(float(np.percentile(peer_overruns, 75)), 1)

        # Case 2: 10 <= N < 20 -> Show median, suppress percentile rank
        if peer_count < 20:
            return {
                "status": "PERCENTILE_SUPPRESSED_THIN_SAMPLE",
                "peer_count": peer_count,
                "selection_criteria": selection_criteria,
                "sector_median_overrun_pct": sector_median,
                "peer_median_overrun_pct": peer_median,
                "percentile_rank": None,
                "peer_iqr": {"p25": p25, "p75": p75},
                "suppression_reason": f"Thin sample size (N={peer_count}). Showing cohort median only; percentile ranking suppressed to prevent sample variance distortion.",
            }

        # Case 3: N >= 20 -> Full benchmark available
        pct_rank = round(float((peer_overruns < project_overrun_pct).mean() * 100.0), 1)
        return {
            "status": "FULL_BENCHMARK_AVAILABLE",
            "peer_count": peer_count,
            "selection_criteria": selection_criteria,
            "sector_median_overrun_pct": sector_median,
            "peer_median_overrun_pct": peer_median,
            "percentile_rank": pct_rank,
            "peer_iqr": {"p25": p25, "p75": p75},
            "interpretation": f"Project cost overrun (+{project_overrun_pct}%) is in the {pct_rank}th percentile of its peer cohort (median: +{peer_median}%).",
        }

    def generate_project_audit_pack(self, project_id: str) -> Dict[str, Any]:
        """
        Generates deterministic cryptographically signed audit pack for a project ID (§7.8).
        """
        dossier = self.get_project_forensic_dossier(str(project_id))
        pack = generate_audit_pack(
            project_id=str(project_id),
            project_name=dossier["project_name"],
            classification=dossier["classification"],
            classification_label=dossier["classification_label"],
            statutory_citation=dossier["statutory_citation"],
            audit_priority_score=dossier["audit_priority_score"],
            audit_priority_breakdown=dossier["audit_priority_breakdown"],
            timeline_events=dossier["timeline_events"],
            statistical_methodology={"boundary_bin_mass_ratio": dossier["contributing_signals"]},
            clause_10cc_forensics=dossier["clause_10cc"],
            financial_exposure=dossier["financial_exposure"],
            legitimate_explanations=dossier["legitimate_explanations"],
            peer_benchmark=dossier["peer_benchmark"],
            sources=dossier["source_references"],
        )
        return pack.model_dump()


# Singleton engine instance
_engine_instance = None

def get_satya_kavach_engine() -> SatyaKavachEngine:
    global _engine_instance
    if _engine_instance is None:
        _engine_instance = SatyaKavachEngine()
    return _engine_instance
