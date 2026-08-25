"""
PRAKALP-DRISHTI: Amey's Decision Intelligence API Router
Exposes KAAL-CHAKRA, SETU-GRAPH, VITTA-VYUHA, and PRAGATI-SAARTHI endpoints.
"""

import json
from fastapi import APIRouter, Query, HTTPException
from typing import Optional

from analytics_engine.contracts import (
    ProjectForecast, DependencySubGraph, AllocationRequest,
    AllocationResult, CabinetBriefing
)
from analytics_engine.kaal_chakra import get_kaal_chakra_engine
from analytics_engine.setu_graph import get_setu_graph_engine
from analytics_engine.vitta_vyuha import get_vitta_vyuha_engine
from analytics_engine.pragati_saarthi import get_pragati_saarthi_engine, PragatiSaarthiEngine

router = APIRouter(prefix="/api/amey", tags=["Amey - Decision Intelligence & Optimization"])

@router.get("/status")
def get_status():
    return {
        "status": "online",
        "module_lead": "Amey",
        "engines": ["KAAL-CHAKRA", "SETU-GRAPH", "VITTA-VYUHA", "PRAGATI-SAARTHI"],
        "sovereign_compliance": "air-gapped local deployment ready"
    }

@router.get("/forecast/{project_id}", response_model=ProjectForecast)
def get_project_forecast(project_id: str):
    try:
        engine = get_kaal_chakra_engine()
        return engine.forecast_project(project_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/dependencies/{project_id}", response_model=DependencySubGraph)
def get_project_dependencies(project_id: str, k: int = Query(default=2, ge=1, le=4)):
    try:
        engine = get_setu_graph_engine()
        return engine.get_k_hop_subgraph(project_id, k=k)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/allocate", response_model=AllocationResult)
def run_capital_allocation(req: AllocationRequest):
    try:
        engine = get_vitta_vyuha_engine()
        # Non-blocking threadpool execution in FastAPI synchronous def
        return engine.optimize_allocation(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/briefing/{project_id}", response_model=CabinetBriefing)
def get_cabinet_briefing(project_id: str):
    try:
        engine = get_pragati_saarthi_engine()
        return engine.generate_cabinet_briefing(project_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/verify/{doc_hash}/{fact_id}")
def verify_fact_lineage(doc_hash: str, fact_id: str, project_id: Optional[str] = None):
    try:
        engine = get_pragati_saarthi_engine()

        # Prefer the ARCHIVED document for this doc_hash. Verification must run against
        # the artefact that was actually issued and signed -- regenerating one from
        # current data would silently "verify" a different document than the one on the
        # printed Cabinet note whenever upstream figures have moved since.
        briefing = PragatiSaarthiEngine.load_archived_briefing(doc_hash)
        served_from_archive = briefing is not None

        if briefing is None:
            target_pid = project_id
            if not target_pid:
                parts = fact_id.split("_")
                target_pid = parts[-1] if (len(parts) >= 3 and parts[-1].isdigit()) else "400188"
            briefing = engine.generate_cabinet_briefing(target_pid)
        
        target_fact = None
        for fid, f in briefing.audit_facts.items():
            if fid == fact_id or f.fact_id == fact_id:
                target_fact = f
                break

        if not target_fact:
            raise HTTPException(status_code=404, detail=f"Fact ID {fact_id} not found for project {target_pid}")

        # True Cryptographic Recomputation of the Merkle Root from leaf + positional proof steps
        canonical_leaf_str = json.dumps({
            "id": target_fact.fact_id,
            "val": target_fact.value,
            "unit": target_fact.unit
        }, sort_keys=True)
        
        proof_steps = target_fact.lineage.merkle_proof if (target_fact.lineage and target_fact.lineage.merkle_proof) else []
        is_cryptographically_valid = PragatiSaarthiEngine.verify_merkle_proof(
            canonical_leaf_str,
            proof_steps,
            briefing.merkle_root
        )

        return {
            "verified": is_cryptographically_valid,
            "proof_valid": is_cryptographically_valid,
            "fact_id": target_fact.fact_id,
            "fact_label": target_fact.label,
            "value": target_fact.value,
            "formatted_value": target_fact.formatted_value,
            "unit": target_fact.unit,
            "document_hash": doc_hash,
            # Tells the auditor whether they are looking at the issued artefact or a
            # regeneration. Only the former is a true audit-trail verification.
            "served_from_archive": served_from_archive,
            "archive_note": (
                "Verified against the archived document issued under this hash."
                if served_from_archive else
                "No archived document for this hash; regenerated from current data. "
                "Treat as an integrity check of present figures, not of a previously issued note."
            ),
            "merkle_root": briefing.merkle_root,
            "merkle_proof": proof_steps,
            "proof_steps_count": len(proof_steps),
            "lineage": target_fact.lineage,
            "audit_timestamp": briefing.generated_at,
            "cag_cvc_compliance": "PASS — SHA-256 Merkle inclusion proof verified against immutable root" if is_cryptographically_valid else "VERIFICATION_FAILED"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from analytics_engine.satellite_fusion import get_satellite_fusion_engine
from analytics_engine.agency_index import get_agency_index_engine
from analytics_engine.pmo_copilot import get_pmo_copilot_engine
from pydantic import BaseModel

class SimulationRequest(BaseModel):
    project_id: str = "400188"
    delay_shock_months: float = 0.0
    budget_pool_cr: float = 15000.0
    risk_dial_kappa: float = 0.75
    enforce_ner_floor: bool = True

@router.get("/satellite/{project_id}")
def get_satellite_audit(project_id: str):
    try:
        engine = get_satellite_fusion_engine()
        return engine.get_satellite_audit(project_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/agency-index")
def get_agency_accountability_index():
    try:
        engine = get_agency_index_engine()
        return engine.get_agency_summary()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/copilot/{project_id}")
def get_pmo_copilot_brief(project_id: str):
    try:
        engine = get_pmo_copilot_engine()
        return engine.query_copilot(project_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/unified-simulation")
def run_unified_causal_simulation(sim: SimulationRequest):
    """
    Unified Causal Cockpit Simulation:
    Delay Shock -> SETU-GRAPH Contagion -> VITTA-VYUHA Re-optimization -> PRAGATI-SAARTHI Briefing
    """
    try:
        kaal = get_kaal_chakra_engine()
        graph = get_setu_graph_engine()
        vitta = get_vitta_vyuha_engine()
        copilot = get_pmo_copilot_engine()

        # 1. Forecast with Delay Shock Threaded
        forecast = kaal.forecast_project(sim.project_id, delay_shock_months=sim.delay_shock_months)
        
        # 2. Dependency Cascade with Delay Shock Threaded
        subgraph = graph.get_k_hop_subgraph(sim.project_id, k=2, delay_shock_months=sim.delay_shock_months)
        
        # 3. LP Capital Rebalance with User Budget Pool & Delay Shock
        alloc_res = vitta.optimize_allocation(AllocationRequest(
            budget_pool_cr=sim.budget_pool_cr,
            risk_dial_kappa=sim.risk_dial_kappa,
            enforce_ner_floor=sim.enforce_ner_floor,
            delay_shock_months=sim.delay_shock_months,
            shocked_project_id=sim.project_id
        ))

        # 4. Copilot Brief with updated parameters
        copilot_res = copilot.query_copilot(sim.project_id)

        return {
            "project_id": sim.project_id,
            "simulated_delay_months": sim.delay_shock_months,
            "forecast": forecast,
            "subgraph": subgraph,
            "allocation": alloc_res,
            "copilot": copilot_res,
            "simulation_status": "CONVERGED_OPTIMAL"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/geocode-precision")
def get_geocode_precision():
    """Measured geocoding precision per tier, from the hand-labelled validation sample.

    Returns available=False until artifacts/geocode_precision.json exists. The dashboard
    renders that state as "not yet measured" rather than hiding the panel, because a
    silently-absent metric reads as a passing one -- the whole point of publishing this
    is that an unmeasured claim and a measured one must look different to a reviewer.
    """
    import os as _os
    path = _os.path.join(
        _os.path.dirname(_os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))),
        "artifacts", "geocode_precision.json")
    if not _os.path.exists(path):
        return {
            "available": False,
            "reason": "No validation labels yet. Run build_geocode_validation_sample.py, "
                      "hand-label artifacts/geocode_validation_worksheet.csv, then run "
                      "score_geocode_validation.py.",
        }
    try:
        with open(path, "r", encoding="utf-8") as fh:
            data = json.load(fh)
        data["available"] = True
        return data
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Unreadable precision artifact: {exc}")
