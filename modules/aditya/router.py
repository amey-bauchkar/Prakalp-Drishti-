"""
PRAKALP-DRISHTI: Aditya's Router
Exposes:
  - NIVARAN: Contractual, Legal & Dispute Risk Engine
  - ANUMATI: PARIVESH Multi-Stage Clearance & Regulatory Bottleneck Engine
  - Combined Governance Scorecard & Contractor Intelligence
  - EO-AUDITOR: Satellite Ground-Truth Showcase
"""

import os
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Query, HTTPException, Path

try:
    from modules.aditya.schemas.nivaran_schema import (
        DisputeRiskAssessmentRequest,
        DisputeRiskAssessmentResponse
    )
    from modules.aditya.schemas.anumati_schema import (
        ClearanceStatusRequest,
        ClearanceStatusResponse
    )
    from modules.aditya.schemas.governance_schema import (
        CombinedRiskProfileResponse,
        ProjectMetadata
    )
    from modules.aditya.schemas.contractor_schema import (
        ContractorProfile,
        ContractorAssessmentRequest,
        ContractorAssessmentResponse
    )
    from modules.aditya.modules.nivaran import NivaranEngine
    from modules.aditya.modules.anumati import AnumatiEngine
    from modules.aditya.data.sqlite_loader import (
        load_projects_from_sqlite, load_contractors_from_sqlite, get_all_gcc_clauses,
        get_governance_project, list_all_governance_projects
    )
    from modules.aditya.service import get_eo_auditor_engine
except ImportError:
    from app.schemas.nivaran_schema import (
        DisputeRiskAssessmentRequest,
        DisputeRiskAssessmentResponse
    )
    from app.schemas.anumati_schema import (
        ClearanceStatusRequest,
        ClearanceStatusResponse
    )
    from app.schemas.governance_schema import (
        CombinedRiskProfileResponse,
        ProjectMetadata
    )
    from app.schemas.contractor_schema import (
        ContractorProfile,
        ContractorAssessmentRequest,
        ContractorAssessmentResponse
    )
    from app.modules.nivaran import NivaranEngine
    from app.modules.anumati import AnumatiEngine
    from app.data.sqlite_loader import load_projects_from_sqlite, load_contractors_from_sqlite, get_all_gcc_clauses
    from modules.aditya.service import get_eo_auditor_engine

router = APIRouter(tags=["Aditya - NIVARAN & ANUMATI Risk Intelligence"])
nivaran_service = NivaranEngine()
anumati_service = AnumatiEngine()


# ─── STATUS & HEALTH ───────────────────────────────────────────────
@router.get("/api/aditya/status")
@router.get("/api/v1/health")
def get_status():
    return {
        "status": "online",
        "system": "PRAKALP-DRISHTI Risk Intelligence Engine",
        "lead": "Aditya",
        "modules": ["NIVARAN", "ANUMATI", "CONTRACTOR_INTELLIGENCE", "EO-AUDITOR"],
        "version": "2.0.0"
    }


# ─── SATELLITE SHOWCASE (EO-AUDITOR) ──────────────────────────────
@router.get("/api/aditya/satellite-showcase")
def get_satellite_showcase(limit: int = Query(default=50, ge=1, le=2207)):
    try:
        engine = get_eo_auditor_engine()
        return engine.get_satellite_war_room_summary(limit=limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── PROJECT CATALOG FOR TESTING ──────────────────────────────────
@router.get("/api/aditya/projects")
@router.get("/api/v1/aditya/projects")
def list_governance_projects(limit: int = Query(default=100, ge=1, le=2207), q: Optional[str] = None):
    return list_all_governance_projects(limit=limit, search=q)


# ─── CPWD GCC CLAUSES ─────────────────────────────────────────────
@router.get("/api/aditya/clauses")
@router.get("/api/v1/clauses")
def list_cpwd_gcc_clauses():
    return get_all_gcc_clauses()


# ─── CONTRACTOR REGISTRY & LITIGATION EXPOSURE ────────────────────
@router.get("/api/aditya/contractors", response_model=List[ContractorProfile])
@router.get("/api/v1/contractors", response_model=List[ContractorProfile])
def list_contractor_profiles():
    contractors_db = load_contractors_from_sqlite()
    return list(contractors_db.values())


@router.get("/api/aditya/contractors/{contractor_id}", response_model=ContractorProfile)
@router.get("/api/v1/contractors/{contractor_id}", response_model=ContractorProfile)
def get_contractor_profile(contractor_id: str):
    contractors_db = load_contractors_from_sqlite()
    if contractor_id not in contractors_db:
        raise HTTPException(status_code=404, detail=f"Contractor ID '{contractor_id}' not found in registry.")
    return contractors_db[contractor_id]


@router.post("/api/aditya/contractors/assess-litigation-index", response_model=ContractorAssessmentResponse)
@router.post("/api/v1/contractors/assess-litigation-index", response_model=ContractorAssessmentResponse)
def assess_contractor_exposure(req: ContractorAssessmentRequest):
    idx = nivaran_service.calculate_litigation_index(req)
    if idx >= 75.0:
        tier, solvency, flag = "SEVERE", "BBB-", True
        vetting = "MANDATORY FINANCIAL AUDIT & HIGH-VALUE PERFORMANCE BOND (15%) REQUIRED BEFORE CONTRACT AWARD."
    elif idx >= 50.0:
        tier, solvency, flag = "HIGH", "BBB+", False
        vetting = "ENHANCED DISPUTE MONITORING & MONTHLY ARBITRATION REVIEW REQUIRED."
    elif idx >= 25.0:
        tier, solvency, flag = "ELEVATED", "A", False
        vetting = "STANDARD MONITORING. VERIFY VARIATION ORDER DISPUTE CLAIMS."
    else:
        tier, solvency, flag = "LOW", "AAA", False
        vetting = "CONTRACTOR OPERATES WITHIN LOW LITIGATION EXPOSURE THRESHOLDS."

    return ContractorAssessmentResponse(
        contractor_id=req.contractor_id or "CTR-CUSTOM-EVAL",
        agency_name=req.agency_name,
        litigation_exposure_index=idx,
        risk_tier=tier,
        financial_solvency_rating=solvency,
        blacklisting_risk_flag=flag,
        recommended_vetting_action=vetting
    )


# ─── NIVARAN ENGINE: CONTRACTUAL & DISPUTE RISK ───────────────────
@router.post("/api/aditya/nivaran/assess-dispute-risk", response_model=DisputeRiskAssessmentResponse)
@router.post("/api/v1/nivaran/assess-dispute-risk", response_model=DisputeRiskAssessmentResponse)
def assess_dispute_risk(request: DisputeRiskAssessmentRequest):
    try:
        return nivaran_service.assess_project_dispute_risk(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"NIVARAN Engine Error: {str(e)}")


# ─── ANUMATI ENGINE: STATUTORY CLEARANCE & STAGNATION ─────────────
@router.post("/api/aditya/anumati/clearance-status", response_model=ClearanceStatusResponse)
@router.post("/api/v1/anumati/clearance-status", response_model=ClearanceStatusResponse)
def evaluate_clearance_status(request: ClearanceStatusRequest):
    try:
        return anumati_service.process_clearance_status(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ANUMATI Engine Error: {str(e)}")


# ─── COMBINED GOVERNANCE RISK SCORECARD ───────────────────────────
@router.get("/api/aditya/governance/combined-risk-profile/{project_id}", response_model=CombinedRiskProfileResponse)
@router.get("/api/v1/governance/combined-risk-profile/{project_id}", response_model=CombinedRiskProfileResponse)
def get_combined_risk_profile(project_id: str):
    project_data = get_governance_project(project_id)
    if not project_data:
        raise HTTPException(status_code=404, detail=f"Project ID '{project_id}' not found in registry.")

    meta_dict = project_data["metadata"]

    nivaran_req = DisputeRiskAssessmentRequest(**project_data["nivaran_request"])
    nivaran_res = nivaran_service.assess_project_dispute_risk(nivaran_req)

    anumati_req = ClearanceStatusRequest(**project_data["anumati_request"])
    anumati_res = anumati_service.process_clearance_status(anumati_req)

    norm_rsi = min(1.0, anumati_res.regulatory_stagnation_index / 2.5)
    risk_score = round((nivaran_res.litigation_probability * 50.0) + (norm_rsi * 50.0), 1)

    if risk_score >= 75.0:
        gov_cat = "CRITICAL"
        directive = f"CRITICAL INTERVENTION DIRECTIVE: Project exhibits severe administrative stagnation ({risk_score}/100). Immediate joint review required by Cabinet Secretariat and PMO PRAGATI."
    elif risk_score >= 50.0:
        gov_cat = "HIGH"
        directive = f"HIGH RISK ALERT: Contractual friction and statutory clearance delays require Secretary-level intervention within 7 days."
    elif risk_score >= 25.0:
        gov_cat = "MODERATE"
        directive = "MODERATE RISK: Monitor pending variation orders and district land awards."
    else:
        gov_cat = "LOW"
        directive = "SAFE ADMINISTRATIVE HEALTH: Project operating within normal governance thresholds."

    return CombinedRiskProfileResponse(
        project_metadata=ProjectMetadata(**meta_dict),
        overall_administrative_risk_score=risk_score,
        governance_risk_category=gov_cat,
        nivaran_assessment=nivaran_res,
        anumati_assessment=anumati_res,
        executive_summary_directive=directive,
        operational_metrics=project_data["nivaran_request"].get("operational_metrics")
    )
