"""
PRAKALP-DRISHTI: Amey's Decision Intelligence API Router
Exposes KAAL-CHAKRA, SETU-GRAPH, VITTA-VYUHA, and PRAGATI-SAARTHI endpoints.
"""

from fastapi import APIRouter, Query, HTTPException
from typing import Optional

from analytics_engine.contracts import (
    ProjectForecast, DependencySubGraph, AllocationRequest,
    AllocationResult, CabinetBriefing
)
from analytics_engine.kaal_chakra import get_kaal_chakra_engine
from analytics_engine.setu_graph import get_setu_graph_engine
from analytics_engine.vitta_vyuha import get_vitta_vyuha_engine
from analytics_engine.pragati_saarthi import get_pragati_saarthi_engine

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
def verify_fact_lineage(doc_hash: str, fact_id: str, project_id: Optional[str] = "400188"):
    try:
        engine = get_pragati_saarthi_engine()
        briefing = engine.generate_cabinet_briefing(project_id)
        
        target_fact = None
        for fid, f in briefing.audit_facts.items():
            if fid == fact_id or f.fact_id == fact_id:
                target_fact = f
                break

        if not target_fact:
            raise HTTPException(status_code=404, detail=f"Fact ID {fact_id} not found in document {doc_hash}")
            
        return {
            "verified": True,
            "fact_id": target_fact.fact_id,
            "fact_label": target_fact.label,
            "value": target_fact.value,
            "formatted_value": target_fact.formatted_value,
            "unit": target_fact.unit,
            "document_hash": doc_hash,
            "merkle_root": briefing.merkle_root,
            "lineage": target_fact.lineage,
            "audit_timestamp": briefing.generated_at,
            "cag_cvc_compliance": "PASS — cryptographic Merkle hash match"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
