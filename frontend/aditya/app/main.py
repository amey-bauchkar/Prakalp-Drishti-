import os
from typing import List, Dict, Any
from fastapi import FastAPI, HTTPException, Path
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse

from app.schemas.nivaran_schema import (
    DisputeRiskAssessmentRequest,
    DisputeRiskAssessmentResponse
)
from app.schemas.anumati_schema import (
    ClearanceStatusRequest,
    ClearanceStatusResponse,
    ClearanceStageDetail
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
from app.modules.nivaran import nivaran_service
from app.modules.anumati import anumati_service
from app.data.mock_projects import MOCK_PROJECTS_DATABASE, CONTRACTORS_DATABASE
from app.data.sqlite_loader import load_projects_from_sqlite, load_contractors_from_sqlite, get_all_gcc_clauses

app = FastAPI(
    title="PRAKALP-DRISHTI Risk Intelligence Engine",
    description="National Infrastructure Decision Intelligence Platform - NIVARAN & ANUMATI Administrative Risk Modules",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_active_projects():
    """Returns dynamic project catalog merging SQLite and base databases."""
    return load_projects_from_sqlite()


def get_active_contractors():
    """Returns dynamic contractor intelligence registry from SQLite database."""
    return load_contractors_from_sqlite()


@app.get("/api/v1/health")
def health_check():
    """Health check endpoint for edge hardware monitoring."""
    return {
        "status": "HEALTHY",
        "system": "PRAKALP-DRISHTI Engine",
        "modules": ["NIVARAN", "ANUMATI", "CONTRACTOR_INTELLIGENCE", "SQLITE_RAW_DB"],
        "version": "1.0.0"
    }


@app.get("/api/v1/projects")
def list_mock_projects():
    """Lists available pre-configured MoSPI/PAIMANA projects for instant testing."""
    projects_db = get_active_projects()
    summary_list = []
    for pid, data in projects_db.items():
        meta = data["metadata"]
        summary_list.append(meta)
    return summary_list


@app.get("/api/v1/clauses")
def list_cpwd_gcc_clauses():
    """Lists all CPWD GCC Standard Clauses from the SQLite database."""
    return get_all_gcc_clauses()


# ==============================================================================
# CONTRACTOR RISK DATABASE ENDPOINTS
# ==============================================================================
@app.get(
    "/api/v1/contractors",
    response_model=List[ContractorProfile],
    tags=["Contractor Intelligence Database"]
)
def list_contractor_profiles():
    """Lists all registered Executing Agency / Contractor litigation profiles from SQLite database."""
    contractors_db = get_active_contractors()
    return list(contractors_db.values())


@app.get(
    "/api/v1/contractors/{contractor_id}",
    response_model=ContractorProfile,
    tags=["Contractor Intelligence Database"]
)
def get_contractor_profile(contractor_id: str = Path(..., description="e.g. CTR-IND-001")):
    """Retrieves specific contractor historical litigation and performance record."""
    contractors_db = get_active_contractors()
    if contractor_id not in contractors_db:
        raise HTTPException(status_code=404, detail=f"Contractor ID '{contractor_id}' not found in registry.")
    return contractors_db[contractor_id]


@app.post(
    "/api/v1/contractors/assess-litigation-index",
    response_model=ContractorAssessmentResponse,
    tags=["Contractor Intelligence Database"]
)
def assess_contractor_exposure(req: ContractorAssessmentRequest):
    """Calculates Litigation Exposure Index and vetting recommendation for an executing contractor."""
    idx = nivaran_service.calculate_litigation_index(req)
    
    if idx >= 75.0:
        tier = "SEVERE"
        solvency = "BBB-"
        flag = True
        vetting = "MANDATORY FINANCIAL AUDIT & HIGH-VALUE PERFORMANCE BOND (15%) REQUIRED BEFORE CONTRACT AWARD."
    elif idx >= 50.0:
        tier = "HIGH"
        solvency = "BBB+"
        flag = False
        vetting = "ENHANCED DISPUTE MONITORING & MONTHLY ARBITRATION REVIEW REQUIRED."
    elif idx >= 25.0:
        tier = "ELEVATED"
        solvency = "A"
        flag = False
        vetting = "STANDARD MONITORING. VERIFY VARIATION ORDER DISPUTE CLAIMS."
    else:
        tier = "LOW"
        solvency = "AAA"
        flag = False
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


# ==============================================================================
# NIVARAN & ANUMATI ENDPOINTS
# ==============================================================================
@app.post(
    "/api/v1/nivaran/assess-dispute-risk",
    response_model=DisputeRiskAssessmentResponse,
    tags=["NIVARAN - Contractual Risk"]
)
def assess_dispute_risk(request: DisputeRiskAssessmentRequest):
    """
    NIVARAN Endpoint: Predicts contractual disputes, litigation risks,
    arbitration likelihood, and contractor abandonment.
    """
    try:
        return nivaran_service.assess_project_dispute_risk(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"NIVARAN Engine Error: {str(e)}")


@app.post(
    "/api/v1/anumati/clearance-status",
    response_model=ClearanceStatusResponse,
    tags=["ANUMATI - Statutory Clearance"]
)
def evaluate_clearance_status(request: ClearanceStatusRequest):
    """
    ANUMATI Endpoint: Tracks 5-stage statutory clearances, calculates
    Regulatory Stagnation Index (RSI), and detects paperwork loopbacks.
    """
    try:
        return anumati_service.process_clearance_status(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ANUMATI Engine Error: {str(e)}")


@app.get(
    "/api/v1/governance/combined-risk-profile/{project_id}",
    response_model=CombinedRiskProfileResponse,
    tags=["PRAKALP-DRISHTI Combined Governance"]
)
def get_combined_risk_profile(
    project_id: str = Path(..., description="Project ID e.g. PRJ-NH-2026-089")
):
    """
    Combined Endpoint: Merges NIVARAN dispute probability and ANUMATI regulatory stagnation
    into a single PRAKALP-DRISHTI executive scorecard.
    """
    projects_db = get_active_projects()
    if project_id not in projects_db:
        if project_id.startswith("PRJ-") and "PRJ-NH-2026-089" in projects_db:
            project_id = "PRJ-NH-2026-089"
        elif list(projects_db.keys()):
            project_id = list(projects_db.keys())[0]
        else:
            raise HTTPException(status_code=404, detail=f"Project ID '{project_id}' not found in registry.")

    project_data = projects_db[project_id]
    meta_dict = project_data["metadata"]

    # Execute NIVARAN assessment
    nivaran_req = DisputeRiskAssessmentRequest(**project_data["nivaran_request"])
    nivaran_res = nivaran_service.assess_project_dispute_risk(nivaran_req)

    # Execute ANUMATI assessment
    anumati_req = ClearanceStatusRequest(**project_data["anumati_request"])
    anumati_res = anumati_service.process_clearance_status(anumati_req)

    # Calculate Overall Administrative Risk Score (0 - 100)
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
        directive = f"MODERATE RISK: Monitor pending variation orders and district land awards."
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


# Mount static directory for modern UI dashboard
static_dir = os.path.join(os.path.dirname(__file__), "..", "static")
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")


@app.get("/", include_in_schema=False)
def serve_dashboard():
    """Serves the PRAKALP-DRISHTI interactive executive dashboard."""
    index_file = os.path.join(os.path.dirname(__file__), "..", "static", "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return JSONResponse({
        "message": "PRAKALP-DRISHTI Backend Engine Running",
        "swagger_docs": "/docs",
        "combined_risk_endpoint": "/api/v1/governance/combined-risk-profile/PRJ-NH-2026-089"
    })
