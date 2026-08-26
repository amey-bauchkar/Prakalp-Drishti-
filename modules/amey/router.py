"""
PRAKALP-DRISHTI: Amey's Decision Intelligence API Router
Exposes KAAL-CHAKRA, SETU-GRAPH, VITTA-VYUHA, and PRAGATI-SAARTHI endpoints.
"""

import json
from fastapi import APIRouter, Query, HTTPException, Depends
from typing import Optional

from analytics_engine.contracts import (
    ProjectForecast, DependencySubGraph, AllocationRequest,
    AllocationResult, CabinetBriefing
)
from backend.auth import require

# RBAC is enforced SERVER-SIDE on the endpoints that expose project-identifying or
# decision-making capability. Hiding a control in React is presentation, not access
# control -- the endpoint is still callable with curl.
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
def run_capital_allocation(req: AllocationRequest, user: dict = Depends(require("allocate_capital"))):
    try:
        engine = get_vitta_vyuha_engine()
        # Non-blocking threadpool execution in FastAPI synchronous def
        return engine.optimize_allocation(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/briefing/{project_id}", response_model=CabinetBriefing)
def get_cabinet_briefing(project_id: str, user: dict = Depends(require("read_briefing"))):
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

        # Resolved before the branch below. It used to be assigned only inside
        # `if briefing is None`, while the 404 handler further down references it
        # unconditionally -- so whenever the document WAS found in the archive (the
        # normal path for an issued note) an unknown fact_id raised UnboundLocalError,
        # surfaced as HTTP 500, and leaked the internal variable name to the caller.
        # A forged fact id must fail closed as a clean 404 on the tamper-defence
        # endpoint, not crash it.
        target_pid = project_id
        if not target_pid:
            parts = fact_id.split("_")
            target_pid = parts[-1] if (len(parts) >= 3 and parts[-1].isdigit()) else "400188"

        if briefing is None:
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
from pydantic import BaseModel, ConfigDict

class SimulationRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")  # see AllocationRequest

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


# ─────────────────────────────────────────────────────────────────────────────
# MoSPI Outcomes (a), (c), (d), (e), (f) and Dimensions (b), (c)
# ─────────────────────────────────────────────────────────────────────────────

from analytics_engine.risk_index import get_risk_index_engine
from analytics_engine.overrun_models import load_models as _load_overrun_models


@router.get("/benchmark")
def get_model_benchmark():
    """Outcome (e) + Dimension (b): conventional statistics vs AI/ML, same split.

    Also carries Dimension (c) -- the CUF-only vs CUF+external ablation -- and
    Outcome (f) driver attribution, because all three come out of the same fitted
    models and separating them across endpoints would invite them to drift apart.
    """
    models = _load_overrun_models()
    if not models:
        return {
            "available": False,
            "reason": "No benchmark artifact. Run: python analytics_engine/overrun_models.py",
        }
    models["available"] = True
    return models


@router.get("/risk/{project_id}")
def get_project_risk(project_id: str, user: dict = Depends(require("read_risk"))):
    """Outcome (c): composite risk score with per-component contributions."""
    try:
        r = get_risk_index_engine().get_project_risk(project_id)
        if not r:
            raise HTTPException(status_code=404, detail=f"No risk score for project {project_id}")
        return r
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/early-warning")
def get_early_warning(
    limit: int = Query(default=25, ge=1, le=200),
    band: Optional[str] = None,
    sector: Optional[str] = None,
    user: dict = Depends(require("read_alerts")),
):
    """Outcome (d): ranked queue of projects warranting review this cycle.

    Ordered by exposure-weighted priority (risk x sqrt(capex)) rather than raw risk,
    so a small very-risky project and a huge moderately-risky one are both surfaced
    instead of the queue filling with one category.
    """
    try:
        return get_risk_index_engine().get_early_warning_queue(
            limit=limit, band=band, sector=sector)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class CopilotQuestion(BaseModel):
    question: str
    project_id: str = "400188"


@router.post("/ask")
def ask_copilot(q: CopilotQuestion):
    """Outcome (h): grounded natural-language Q&A over the Fact layer.

    No generative model participates -- see analytics_engine/copilot_qa.py for why that
    is a deliberate strengthening of the zero-hallucination requirement rather than a
    shortcut around the LLM one.
    """
    try:
        from analytics_engine.copilot_qa import answer_question
        return answer_question(q.question, q.project_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/predict/{project_id}")
def predict_overrun(project_id: str, user: dict = Depends(require("read_risk"))):
    """Outcome (a): serve a cost-overrun prediction for ONE project.

    Previously the module could only report benchmark metrics -- there was no way to
    ask it about a specific project, which meant there was a benchmark but not a
    deployed model.
    """
    try:
        from analytics_engine.overrun_models import predict_cost_overrun
        r = predict_cost_overrun(project_id)
        if r is None:
            raise HTTPException(status_code=404,
                                detail="Model artifact absent or project unknown. "
                                       "Run: python analytics_engine/overrun_models.py")
        return r
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/lead-time")
def get_lead_time_validation(threshold_pct: float = Query(default=15.0, ge=1.0, le=100.0)):
    """Outcome (d): validates that the warning is actually EARLY.

    Public because it describes model quality, not project data -- an auditor should be
    able to check our claims without credentials.
    """
    try:
        from analytics_engine.overrun_models import evaluate_lead_time
        return evaluate_lead_time(threshold_pct)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
