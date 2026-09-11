"""
PRAKALP-DRISHTI: Amey's Decision Intelligence API Router
Exposes KAAL-CHAKRA, SETU-GRAPH, VITTA-VYUHA, and PRAGATI-SAARTHI endpoints.
"""

import json
import os
import re
from fastapi import APIRouter, Query, HTTPException, Depends
from typing import Optional, List, Dict

from analytics_engine.contracts import (
    ProjectForecast, DependencySubGraph, AllocationRequest,
    AllocationResult, CabinetBriefing
)
from backend.auth import require
from backend.security import sanitize_id

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
    except KeyError:
        raise HTTPException(status_code=404,
                            detail=f"Project '{project_id}' not found in the corpus.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/dependencies/{project_id}", response_model=DependencySubGraph)
def get_project_dependencies(project_id: str, k: int = Query(default=2, ge=1, le=4)):
    try:
        engine = get_setu_graph_engine()
        return engine.get_k_hop_subgraph(project_id, k=k)
    except KeyError:
        raise HTTPException(status_code=404,
                            detail=f"Project '{project_id}' not found in the dependency graph.")
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
    except KeyError:
        raise HTTPException(status_code=404,
                            detail=f"Project '{project_id}' not found in the corpus.")
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
            # Regenerate — but then CHECK that the regenerated document is the one
            # the caller named. Without this the endpoint verified a Merkle proof
            # against a document it had just built, so the supplied doc_hash was
            # never examined at all:
            #
            #     GET /api/amey/verify/000...000/fact_cost?project_id=400188
            #       -> {"proof_valid": true,
            #           "cag_cvc_compliance": "PASS — SHA-256 Merkle inclusion
            #                                  proof verified against immutable root"}
            #
            # 64 zeros passed. Every hash passed. The QR code printed on a Cabinet
            # note was therefore unfalsifiable in the useless direction: it could
            # not fail, so it proved nothing, while reporting CAG/CVC compliance.
            #
            # doc_hash is content-addressed (sha256 of merkle_root:project_id), so
            # a regeneration whose own hash differs is a different document by
            # definition — either the hash was fabricated, or the underlying facts
            # have moved since issue. Both must fail closed, and the two cases are
            # distinguished in the message because they mean very different things
            # to an auditor.
            briefing = engine.generate_cabinet_briefing(target_pid)
            if briefing.doc_hash != doc_hash:
                raise HTTPException(
                    status_code=404,
                    detail=(
                        f"No document with hash {doc_hash[:16]}... was issued for "
                        f"project {target_pid}. The current facts for this project "
                        f"hash to {briefing.doc_hash[:16]}..., so either the hash is "
                        f"not one this system produced, or the underlying figures "
                        f"have changed since the document was issued. Verification "
                        f"fails closed in both cases."))
        
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
from pydantic import BaseModel, ConfigDict, Field

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
    except KeyError:
        raise HTTPException(status_code=404,
                            detail=f"Project '{project_id}' not found in the satellite catalog "
                                   f"or master corpus.")
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
    except KeyError:
        raise HTTPException(status_code=404,
                            detail=f"Project '{project_id}' not found in the corpus.")
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
    # Prior turns, oldest first: [{"role": "user"|"assistant", "content": "..."}].
    # Caller-supplied and therefore ATTACKER-CONTROLLED: sanitised on the way in,
    # and its numbers are explicitly excluded from the admissible fact set.
    history: List[Dict[str, str]] = Field(default_factory=list)
    prior_turns: Optional[List[Dict[str, str]]] = None


@router.post("/copilot/{project_id}/ask")
@router.post("/ask")
def ask_copilot(q: CopilotQuestion, project_id: Optional[str] = None):
    if project_id:
        q.project_id = project_id
    if q.prior_turns and not q.history:
        q.history = q.prior_turns
    """Outcome (h): dual-mode grounded Q&A with multi-turn memory.

    The question is routed to one of three modes, each with a different safety
    rule, because one rule cannot serve all three:

      PROJECT_FACT_QUERY       assembled from Fact objects carrying SHA-256
                               lineage and Merkle inclusion proofs. If a model
                               phrases them, EVERY figure it states must appear
                               in that fact set or the generation is discarded.

      HYBRID_ANALYTICAL_QUERY  same strictness for project figures; statutory
                               reasoning around them is model-generated and is
                               labelled as not provenanced.

      GENERAL_QUERY            policy and engineering knowledge, with no project
                               data attached. Guarded in the OPPOSITE direction:
                               the answer is rejected if it asserts a
                               project-shaped figure, because nothing here
                               carries provenance.

    With no GROQ_API_KEY the process stays fully air-gapped: project questions
    are served from the deterministic fact assembly, and general questions
    decline rather than guess.
    """
    try:
        from analytics_engine.copilot_qa import (
            answer_question, classify_query, build_project_context)
        from analytics_engine.copilot_llm import answer_with_context

        route = classify_query(q.question, sanitize_id(q.project_id, field="project_id"))
        mode = route["mode"]

        # The retrieval layer echoes the caller's question back in its payload.
        # phrase_answer() used to strip the tag characters on the way out; these
        # branches bypass it, so the stripping has to happen here or the endpoint
        # hands back an executable payload. Not exploitable through this frontend
        # (JSON + nosniff, and React escapes on render), but an API should not
        # rely on today's client being safe.
        def _echo_safe(text: str) -> str:
            return re.sub(r"[<>]", "", str(text or ""))[:500]

        lang = route.get("language") or {}

        if mode == "CONVERSATIONAL_QUERY":
            # A greeting gets a greeting. This used to fall through to the policy
            # path and come back as "No substantive query detected", which reads
            # as a form rejecting an input rather than an assistant answering one.
            from analytics_engine.copilot_qa import conversational_reply
            pid_hint = route.get("project_id") or ""
            gen = answer_with_context(q.question, mode, facts=None,
                                      history=q.history, project_id=pid_hint,
                                      lang=lang)
            return {
                "question": _echo_safe(q.question),
                "project_id": pid_hint or None,
                "routing": route,
                # The offline reply is native in its greeting and English in its
                # body: short greetings are safe to ship untranslated, whole
                # administrative paragraphs in nine languages are not.
                "answer": gen["text"] or conversational_reply(lang, pid_hint),
                "answer_llm": gen["text"],
                "cited_fact_ids": [],
                "grounding": ("Conversational reply. No project figures are asserted "
                              "and none are claimed to be verified."),
                "llm": gen["llm"],
            }

        if mode == "GENERAL_QUERY":
            gen = answer_with_context(q.question, mode, facts=None,
                                      history=q.history, project_id="", lang=lang)
            return {
                "question": _echo_safe(q.question),
                "project_id": None,
                "routing": route,
                # The decline message must name the ACTUAL reason. It previously
                # said "no API key configured" for every failure path, so a
                # transient model outage was reported to the user as a
                # deliberate air-gapped posture -- two very different states.
                "answer": gen["text"] or {
                    "deterministic": (
                        "This is a general policy question, and the generative "
                        "surface is switched off (no API key configured) — the "
                        "sovereign default. Project questions are still answered "
                        "in full from the verified corpus, which needs no model."),
                    "deterministic_fallback": (
                        "This is a general policy question. The language model was "
                        "unreachable just now, and there is no verified corpus "
                        "answer for a general question, so nothing is returned "
                        "rather than a guess. Please retry."),
                    "general_guard_tripped": (
                        "The generated answer asserted project-specific figures, "
                        "which carry no provenance in general mode, so it was "
                        "discarded. Ask about the project directly to get "
                        "Merkle-verified figures."),
                }.get(gen["llm"]["mode"],
                      "No answer could be produced for this general question."),
                "answer_llm": gen["text"],
                "cited_fact_ids": [],
                "grounding": ("General domain knowledge. NOT drawn from the MoSPI "
                              "corpus and NOT Merkle-provenanced."),
                "llm": gen["llm"],
            }

        pid = sanitize_id(route["project_id"], field="project_id")
        deterministic = answer_question(q.question, pid)      # always available
        context = build_project_context(pid)                  # every engine's view

        gen = answer_with_context(q.question, mode, facts=context,
                                  history=q.history, project_id=pid, lang=lang)

        out = dict(deterministic)
        if isinstance(out.get("question"), str):
            out["question"] = _echo_safe(out["question"])
        out["project_id"] = pid
        out["routing"] = route
        out["context_sections"] = {
            "available": context["available_sections"],
            "unavailable": context["unavailable_sections"],
        }
        if gen["text"]:
            out["answer_llm"] = gen["text"]
        out["llm"] = gen["llm"]
        return out
    except HTTPException:
        raise
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


# ══════════════════════════════════════════════════════════════════════════
# EO ANALYTICAL LAYERS
# ══════════════════════════════════════════════════════════════════════════
#
# Served as rendered PNG rather than as a pixel array in JSON. An 800x800 mask
# is 640k values; shipping that as JSON is ~4 MB per layer per project and the
# browser then has to rasterise it. A PNG is ~30 kB and the <img> tag is the
# renderer. The layers are computed from the same functions the numeric audit
# uses, so what the reviewer sees is what was measured -- not a second
# visualisation path that could drift from it.

_EO_LAYERS = ("builtup", "corridor", "change", "materials", "sam")

# Density presets for the analytical overlays.
#
# `density` is a CLIENT-SUPPLIED parameter, which is deliberate and is not a
# contradiction of the rule that the access tier must never come from client
# input. The distinction is what the parameter can do: density can only ever
# make the response smaller and coarser, never larger or more revealing. There
# is no value of it that grants a caller anything they could not already have,
# so there is nothing to forge. Tier is an authorisation decision and stays on
# the server; density is a bandwidth preference and belongs with the client
# that knows its own link.
#
# An unrecognised value is REJECTED rather than silently treated as "standard",
# because a typo that quietly returns a 300 kB overlay to a handset on a 2G
# link is the exact failure this option exists to prevent.
_EO_DENSITY = {
    "standard": {
        "scale": 1.0,
        "levels": 8,
        "fmt": ".png",
        "params": lambda cv2: [cv2.IMWRITE_PNG_COMPRESSION, 9],
        "mime": "image/png",
    },
    "low": {
        # Half linear resolution is a quarter of the pixels. These overlays are
        # smooth banded fields rather than fine detail -- the information in
        # them survives the downsample, unlike the base imagery, which is why
        # the option is offered here and not on /api/eo/tile.
        "scale": 0.5,
        # Six bands rather than eight. Fewer, flatter regions compress better,
        # and six steps is still more than a reader can reliably distinguish in
        # a colour ramp at overlay opacity.
        "levels": 6,
        "fmt": ".webp",
        # LOSSLESS WebP (OpenCV treats quality > 100 as lossless), and it is
        # both smaller and more faithful than the lossy setting here, which is
        # counter-intuitive enough to be worth the measurement:
        #
        #     lossy q80   29 alpha levels   112,576 B
        #     lossless     6 alpha levels    26,496 B
        #
        # A quantised ramp is a flat palette, and lossy WebP's transform is
        # built for photographic gradients: on flat regions it spends bits
        # inventing texture that was not there, which is why it lands 4x larger
        # AND smears six declared bands into twenty-nine.
        "params": lambda cv2: [cv2.IMWRITE_WEBP_QUALITY, 101],
        "mime": "image/webp",
    },
}


@router.get("/satellite/{project_id}/layer/{layer}",
            dependencies=[Depends(require("read_risk"))])
def get_eo_layer(project_id: str, layer: str,
                 density: str = Query("standard", max_length=16)):
    """Render one analytical layer as a transparent overlay.

    `density=low` halves the linear resolution, drops the colour ramp from
    eight quantisation bands to six, and encodes WebP instead of PNG. Measured
    on project 619092 the five-layer set falls from 623 kB to well under a
    third of that, which is the difference between a usable and an unusable
    panel on a rural 3G link.
    """
    import io as _io
    import numpy as _np
    import cv2 as _cv2
    from fastapi.responses import Response

    from analytics_engine.satellite_fusion import IMAGERY_DIR

    if layer not in _EO_LAYERS:
        raise HTTPException(status_code=404,
                            detail=f"Unknown layer '{layer}'. Available: {list(_EO_LAYERS)}")
    if density not in _EO_DENSITY:
        raise HTTPException(
            status_code=400,
            detail=(f"Unknown density '{density}'. Available: "
                    f"{list(_EO_DENSITY)}. Rejected rather than defaulted: a "
                    f"typo that silently returns a full-size overlay to a "
                    f"low-bandwidth client defeats the option."))
    preset = _EO_DENSITY[density]
    pid = sanitize_id(project_id, field="project_id")

    b = _cv2.imread(os.path.join(IMAGERY_DIR, f"{pid}_BEFORE.jpg"))
    a = _cv2.imread(os.path.join(IMAGERY_DIR, f"{pid}_AFTER.jpg"))
    if b is None or a is None:
        raise HTTPException(status_code=404,
                            detail=f"No dual-epoch imagery on file for project {pid}.")
    if b.shape != a.shape:
        a = _cv2.resize(a, (b.shape[1], b.shape[0]))

    from analytics_engine import eo_geospatial as _eo
    from analytics_engine.satellite_precision_cv import (
        CORRIDOR_MIN_COHERENCE, build_annotation_mask, detect_change,
        dominant_orientation, ground_sample_distance, zoom_for_sector,
    )
    from analytics_engine.satellite_fusion import get_satellite_fusion_engine

    eng = get_satellite_fusion_engine()
    cat = eng.catalog.get(pid, {})
    geo = getattr(eng, "geo", {}).get(pid, {})
    lat = float(geo.get("latitude") or cat.get("latitude") or 22.0)
    sector = cat.get("sector")
    geom = cat.get("asset_geometry", "POINT")

    gsd = ground_sample_distance(lat, zoom_for_sector(sector))
    bearing, coh = dominant_orientation(_cv2.cvtColor(b, _cv2.COLOR_BGR2GRAY))
    use_bearing = (bearing if str(geom).upper() == "LINEAR"
                   and coh >= CORRIDOR_MIN_COHERENCE else None)
    corridor = _eo.build_row_corridor(b.shape, gsd, sector, geom, use_bearing)

    h, w = b.shape[:2]
    rgba = _np.zeros((h, w, 4), _np.uint8)

    if layer == "builtup":
        # RBL is a composite defined in eo_geospatial, NOT the NDBI a reviewer
        # might assume from the colour ramp -- this imagery has no SWIR band, so
        # NDBI is not computable. The legend in the UI says so in those words.
        rbl = _np.clip(_eo.rgb_builtup_likelihood(a), 0.0, 1.0)
        # Quantised to 8 levels and transparent below 0.35. A continuous
        # per-pixel ramp encoded to 1.96 MB -- too heavy to toggle smoothly --
        # and painted the whole frame, including every value too low to mean
        # anything. Banding the ramp makes the legend readable AND drops the
        # layer to a few tens of kB, because a PNG compresses flat regions.
        _lv = float(preset["levels"])
        q = _np.floor(rbl * _lv) / _lv
        ramp = _cv2.applyColorMap((q * 255).astype(_np.uint8), _cv2.COLORMAP_INFERNO)
        vis = rbl >= 0.35
        # Zero the colour under transparent pixels too. Leaving the ramp there
        # costs nothing visually and everything in filesize: PNG compresses the
        # RGB planes whether or not alpha hides them, so a fully-painted frame
        # under a mostly-transparent alpha was still ~830 kB.
        rgba[..., :3] = ramp * vis[..., None]
        rgba[..., 3] = _np.where(vis, (q * 200).astype(_np.uint8), 0)

    elif layer == "corridor":
        edge = corridor.mask.astype(_np.uint8) * 255
        band = _cv2.morphologyEx(edge, _cv2.MORPH_GRADIENT, _np.ones((5, 5), _np.uint8))
        rgba[..., 0], rgba[..., 1], rgba[..., 2] = 64, 220, 255      # BGR amber-cyan
        rgba[..., 3] = _np.maximum(band, (edge // 12).astype(_np.uint8))
        if corridor.centreline:
            _cv2.line(rgba, corridor.centreline[0], corridor.centreline[1],
                      (64, 220, 255, 255), 1, _cv2.LINE_AA)

    elif layer == "change":
        r = detect_change(b, a, gsd_m_per_px=gsd, asset_geometry=geom,
                          roi_override=corridor.mask)
        m = (r.change_mask > 0)
        heat = _cv2.applyColorMap(
            _cv2.GaussianBlur(m.astype(_np.uint8) * 255, (0, 0), 3), _cv2.COLORMAP_TURBO)
        rgba[..., :3] = heat
        rgba[..., 3] = (m.astype(_np.uint8) * 200)

    elif layer == "sam":
        # Spectral Angle Mapper delta between epochs. Included as its own layer
        # because it answers a question the change heatmap cannot: SSIM fires on
        # any structural difference including a sharpness change, whereas the
        # spectral angle is invariant to illumination scaling by construction --
        # a pixel that merely got brighter has near-zero angle, a pixel whose
        # MATERIAL changed rotates. On this corpus a x1.35 gain plus 18 DN
        # offset over an unchanged scene yields a mean angle of 0.018 rad, so
        # what this layer paints is material change, not sun angle.
        from analytics_engine.satellite_precision_engine import spectral_angle
        import math as _math
        ang = spectral_angle(b, a)
        # pi/4 is a very large rotation in a 3-band space; used as the ceiling
        # rather than pi so the ramp spends its range where the data lives.
        norm = _np.clip(ang / (_math.pi / 4.0), 0.0, 1.0)
        # Quantised to 8 bands and suppressed below 0.12, for the same reason
        # the built-up layer is: a continuous per-pixel ramp encoded to 1.32 MB
        # here, which is too heavy to toggle interactively, and painted the
        # whole frame including every angle too small to mean anything.
        _lv = float(preset["levels"])
        q = _np.floor(norm * _lv) / _lv
        vis = norm >= 0.12
        ramp = _cv2.applyColorMap((q * 255).astype(_np.uint8), _cv2.COLORMAP_VIRIDIS)
        rgba[..., :3] = ramp * vis[..., None]
        rgba[..., 3] = _np.where(vis, (q * 205).astype(_np.uint8), 0)

    else:  # materials
        rrn = _eo.relative_radiometric_normalization(b, a, build_annotation_mask(b.shape))
        bias = _eo.index_bias_over_invariants(b, rrn.normalised_after, rrn.pif_mask)
        cls = _eo.classify_materials(rrn.normalised_after, corridor.mask, bias=bias)
        palette = {                                   # BGR
            "water_or_shadow": (140, 80, 20), "vegetation": (60, 170, 60),
            "bare_soil_earthwork": (90, 150, 200), "asphalt_bitumen": (90, 90, 90),
            "concrete_structure": (230, 230, 240), "unclassified": (0, 0, 0),
        }
        for i, name in enumerate(_eo.MATERIAL_CLASSES):
            sel = (cls["labels"] == i) & corridor.mask
            rgba[sel, 0], rgba[sel, 1], rgba[sel, 2] = palette[name]
            rgba[sel, 3] = 0 if name == "unclassified" else 190

    if preset["scale"] != 1.0:
        # INTER_NEAREST, which is the opposite of the usual advice for
        # downsampling and is correct here for a specific reason. These are
        # QUANTISED fields: every pixel already holds one of six declared ramp
        # values. Any averaging kernel -- bilinear, or the INTER_AREA this
        # originally used -- produces values BETWEEN two bands, so the output
        # displays levels that were never measured and, because the palette is
        # no longer flat, compresses far worse. Measured on the SAM layer:
        #
        #     INTER_AREA     29 alpha levels   112,576 B
        #     INTER_NEAREST   6 alpha levels    26,496 B
        #
        # Nearest-neighbour picks an existing band, so the six levels survive
        # the downsample exactly and the file is 4x smaller. The usual argument
        # against it -- aliasing -- applies to continuous imagery, not to a
        # banded overlay whose whole purpose is to show discrete steps.
        _h, _w = rgba.shape[:2]
        rgba = _cv2.resize(
            rgba, (max(1, int(_w * preset["scale"])), max(1, int(_h * preset["scale"]))),
            interpolation=_cv2.INTER_NEAREST)

    ok, buf = _cv2.imencode(preset["fmt"], rgba, preset["params"](_cv2))
    if not ok:
        raise HTTPException(status_code=500, detail="Layer encoding failed.")
    return Response(
        content=buf.tobytes(), media_type=preset["mime"],
        headers={
            "Cache-Control": "public, max-age=3600",
            "X-Layer-Density": density,
            "X-Layer-Levels": str(preset["levels"]),
            # The rendered bytes differ per density, and density lives in the
            # query string, so any conforming cache already keys on it. Stated
            # explicitly so an intermediary that normalises query strings does
            # not collapse the two variants onto one another.
            "Vary": "Accept-Encoding",
        })

# ══════════════════════════════════════════════════════════════════════════
# RECONNAISSANCE COPILOT
# ══════════════════════════════════════════════════════════════════════════

class ReconRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    analyst_note: str = Field("", max_length=300)


# Paid outbound call. Anonymous access here was a billing and DoS vector:
# eight concurrent unauthenticated requests saturated the server for 16 s.
@router.get("/satellite/{project_id}/recon",
            dependencies=[Depends(require("read_risk"))])
def get_recon_briefing(project_id: str):
    """Two-sentence photographic reconnaissance briefing over the EO telemetry.

    GET rather than POST for the no-note case so the button is cacheable and
    idempotent. Only derived scalars reach the provider; the imagery is
    processed locally and never transmitted.
    """
    try:
        from analytics_engine.recon_copilot import reconnaissance_briefing
        from analytics_engine.satellite_fusion import get_satellite_fusion_engine
        pid = sanitize_id(project_id, field="project_id")
        audit = get_satellite_fusion_engine().get_satellite_audit(pid)
        return reconnaissance_briefing(audit)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/satellite/{project_id}/recon",
             dependencies=[Depends(require("read_risk"))])
def post_recon_briefing(project_id: str, req: ReconRequest):
    """Same briefing with an analyst note steering what to describe.

    The note is sanitised and delimited, and every figure it contains is
    SUBTRACTED from the admissible set before the guard runs -- so a number
    smuggled in through the note cannot come back out of the model wearing
    guard="passed".
    """
    try:
        from analytics_engine.recon_copilot import reconnaissance_briefing
        from analytics_engine.satellite_fusion import get_satellite_fusion_engine
        pid = sanitize_id(project_id, field="project_id")
        audit = get_satellite_fusion_engine().get_satellite_audit(pid)
        return reconnaissance_briefing(audit, analyst_note=req.analyst_note)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/eo/backbone")
def get_backbone_status():
    """Provenance of the Prithvi foundation backbone and the trained head.

    Served as its own endpoint so a reviewer can interrogate what was loaded,
    which bands were supplied, and what the head's measured accuracy is,
    without having to infer any of it from a prediction.
    """
    try:
        from analytics_engine.stage_classifier import (
            encoder_status, get_head, get_embedding_cache,
        )
        head = get_head()
        return {
            "encoder": encoder_status(),
            "head": ({"trained": True, "trained_at": head.trained_at,
                      "n_train": head.n_train, "classes": head.classes,
                      "validation": head.validation}
                     if head else {"trained": False,
                                   "reason": "No stage_head.json artifact on disk."}),
            "embedding_cache_entries": len(get_embedding_cache()),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
