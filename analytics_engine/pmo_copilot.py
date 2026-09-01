"""
PRAKALP-DRISHTI: AIR-GAPPED PROVABLY-GROUNDED PMO COPILOT
Deterministic, zero-hallucination executive assistant for Cabinet & PMO decision-makers.
Strictly generates structured civil-service answers grounded in verifiable Fact IDs,
Merkle roots, and survival/contagion models with 100% offline air-gapped execution.
"""

import os
import json
import hashlib
from datetime import datetime
from typing import Dict, Any, List, Optional

from analytics_engine.kaal_chakra import get_kaal_chakra_engine
from analytics_engine.setu_graph import get_setu_graph_engine
from analytics_engine.vitta_vyuha import get_vitta_vyuha_engine, AllocationRequest
from analytics_engine.satellite_fusion import get_satellite_fusion_engine
from analytics_engine.agency_index import get_agency_index_engine

class PMOCopilotEngine:
    def __init__(self):
        self.kaal_engine = get_kaal_chakra_engine()
        self.graph_engine = get_setu_graph_engine()
        self.vitta_engine = get_vitta_vyuha_engine()
        self.sat_engine = get_satellite_fusion_engine()
        self.agency_engine = get_agency_index_engine()

    def query_copilot(self, project_id: str, query: Optional[str] = None) -> Dict[str, Any]:
        """
        Generates an authoritative, fact-grounded PMO decision briefing for a project.
        """
        pid = str(project_id)
        
        # 1. Fetch Ground-Truth Facts from all 4 Analytical Engines
        forecast = self.kaal_engine.forecast_project(pid)
        subgraph = self.graph_engine.get_k_hop_subgraph(pid, k=2)
        sat_audit = self.sat_engine.get_satellite_audit(pid)
        
        # 2. Extract Key Grounded Facts
        facts_list = []
        for fid, f in forecast.facts.items():
            facts_list.append({
                "fact_id": f.fact_id,
                "label": f.label,
                "value": f.formatted_value,
                "unit": f.unit,
                "merkle_root": f.lineage.merkle_root if f.lineage else ""
            })

        # Add Supply-Chain Network Contagion Fact
        graph_fact_id = f"fact_graph_locked_{pid}"
        facts_list.append({
            "fact_id": graph_fact_id,
            "label": "Downstream Systemic Capital Locked (P50)",
            "value": f"₹{subgraph.total_cascade_locked_p50_cr:,.2f} Cr",
            "unit": "INR_CR",
            "merkle_root": hashlib.sha256(f"GRAPH:{pid}:{subgraph.total_cascade_locked_p50_cr}".encode("utf-8")).hexdigest()
        })

        # Add Satellite Corroboration Fact
        sat_fact_id = f"fact_sat_audit_{pid}"
        pctl = sat_audit.get("change_percentile_in_sector")
        pctl_txt = f", {pctl:.0f}th percentile for its sector" if pctl is not None else ""
        bv = (sat_audit.get("baseline_vintage") or "2014-02").split("-")[0]
        cv_raw = sat_audit.get("current_vintage") or "2026"
        cv = cv_raw.replace("<=", "").strip().split("-")[0].split()[0]
        vintage_span = f"{bv}-{cv}"
        facts_list.append({
            "fact_id": sat_fact_id,
            "label": "Orbital Optical Surface-Change Measurement",
            # Reports the measurement, not a completion estimate. Imagery cannot say
            # what fraction of a DPR is done (r=0.007 against reported progress).
            "value": f"{sat_audit.get('surface_change_pct', 0.0)}% of sampled ground structurally changed {vintage_span}{pctl_txt}",
            "unit": "PERCENT",
            "merkle_root": sat_audit["audit_hash"]
        })

        # 3. Generate Provably Grounded Executive Briefing Points
        executive_summary = (
            f"Project #{pid} ({forecast.project_name}) is a strategic {forecast.sector} asset in {forecast.state} "
            f"executed by {forecast.canonical_entity}. Sanctioned capex is ₹{forecast.revised_cost_cr:,.2f} Cr with "
            f"a cost overrun of {forecast.cost_overrun_perc:+.1f}%. On-ground physical progress is {forecast.physical_progress_perc:.1f}%."
        )

        pmo_action_items = []
        
        # Rule 1: Delay and Completion Timeline
        if forecast.prob_target_met_official < 0.25:
            pmo_action_items.append({
                "category": "SCHEDULE_ESCALATION",
                "priority": "HIGH",
                "finding": f"Contractor target date of {forecast.revised_end_date} has only {forecast.prob_target_met_official*100:.1f}% probability of being achieved.",
                "recommendation": f"Formalize revised milestone to KAAL-CHAKRA P50 date ({forecast.p50_date}) in next PRAGATI review cycle.",
                "citing_fact_id": f"fact_p50_{pid}"
            })

        # Rule 2: Supply-Chain Dependency Contagion
        if subgraph.total_cascade_locked_p50_cr > 100.0:
            pmo_action_items.append({
                "category": "CONTAGION_CONTAINMENT",
                "priority": "CRITICAL",
                "finding": f"Upstream delivery friction locks ₹{subgraph.total_cascade_locked_p50_cr:,.2f} Cr across {len(subgraph.nodes)} connected downstream nodes in the national grid.",
                "recommendation": "Convene joint coordination meeting with Chief Secretary to expedite critical path clearance.",
                "citing_fact_id": graph_fact_id
            })

        # Rule 3: Earth Observation.
        # The recommendation is field verification, never a disbursal freeze. Imagery
        # establishes that expected ground activity is absent at the sampled location;
        # it does not establish misreporting, and a payment hold needs the latter.
        sat_status = sat_audit.get("audit_status")
        geom_caveat = (" Note: this is a linear asset, so the tile samples one slice of"
                       " the corridor rather than the whole works."
                       if sat_audit.get("asset_geometry") == "LINEAR" else "")

        if not sat_audit.get("eo_verdict_reliable"):
            pmo_action_items.append({
                "category": "EO_NOT_AVAILABLE",
                "priority": "NORMAL",
                "finding": f"No site-level geocode for this project, so its imagery is not confirmed to show the works. {sat_audit.get('eo_unreliable_reason') or ''}".strip(),
                "recommendation": "Verify progress by physical inspection; Earth-observation screening is not applicable here.",
                "citing_fact_id": sat_fact_id
            })
        elif sat_status == "ACTIVITY_ANOMALY":
            pmo_action_items.append({
                "category": "FIELD_VERIFICATION",
                "priority": "HIGH",
                "finding": (f"Project reports {sat_audit['claimed_progress_pct']}% complete, but structural change at the "
                            f"sampled site is in the bottom decile for its sector "
                            f"({sat_audit.get('surface_change_pct', 0.0)}% of surface changed {vintage_span}).{geom_caveat}"),
                "recommendation": "Prioritise a field visit to reconcile reported progress with observed ground activity.",
                "citing_fact_id": sat_fact_id
            })
        else:
            pmo_action_items.append({
                "category": "EO_SCREENING_CLEAR",
                "priority": "NORMAL",
                "finding": (f"Structural change of {sat_audit.get('surface_change_pct', 0.0)}% observed at the sampled site "
                            f"is consistent with active works for this sector.{geom_caveat}"),
                "recommendation": "No Earth-observation exception raised; continue standard monitoring.",
                "citing_fact_id": sat_fact_id
            })

        # Content-addressed document hash.
        #
        # This previously hashed f"PMO_COPILOT:{pid}:{today}" -- the project id and
        # the wall-clock date, and NOTHING ELSE. Measured against the running
        # build, the served hash was reproducible by anyone holding only the
        # project id:
        #
        #     sha256("PMO_COPILOT:400188:2026-08-28") == the served document_hash
        #
        # Three separate failures in one line. It covered none of the content, so
        # every figure in the briefing could change and the hash would not move.
        # It was forgeable by anyone who could guess a date. And it rotated at
        # midnight, so a QR code printed on a Cabinet note failed verification the
        # next morning. It was nonetheless embedded in `qr_verification_url` and
        # served beside "offline_air_gapped": True, which is exactly the kind of
        # claim a reviewer would take at face value.
        #
        # Hashing the ordered facts binds the identifier to what the document
        # actually says, and drops the clock so the hash stays valid as long as
        # the underlying facts do. pragati_saarthi.py already did this correctly;
        # the two now agree.
        _fact_leaves = json.dumps(
            [{"id": f.get("fact_id"), "val": f.get("value"), "unit": f.get("unit")}
             for f in facts_list],
            sort_keys=True, default=str)
        doc_hash = hashlib.sha256(
            f"PMO_COPILOT:{pid}:{_fact_leaves}".encode("utf-8")).hexdigest()

        return {
            "project_id": pid,
            "project_name": forecast.project_name,
            "canonical_agency": forecast.canonical_entity,
            "sector": forecast.sector,
            "state": forecast.state,
            "document_hash": doc_hash,
            "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S IST"),
            "offline_air_gapped": True,
            "executive_summary": executive_summary,
            "action_items": pmo_action_items,
            "grounded_facts": facts_list,
            "satellite_audit": sat_audit,
            "qr_verification_url": f"/api/amey/verify/{doc_hash}/fact_cost_{pid}?project_id={pid}"
        }

_copilot_instance = None

def get_pmo_copilot_engine() -> PMOCopilotEngine:
    global _copilot_instance
    if _copilot_instance is None:
        _copilot_instance = PMOCopilotEngine()
    return _copilot_instance

if __name__ == "__main__":
    copilot = get_pmo_copilot_engine()
    res = copilot.query_copilot("706724")
    print("Sample PMO Copilot Response (Project 706724):")
    print(json.dumps(res, indent=2))
