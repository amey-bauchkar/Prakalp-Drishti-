"""
PRAKALP-DRISHTI: Tanmay's Router
Exposes SATYA-KAVACH anti-gaming, McCrary bunching, and CPWD Clause 10CC forensic audit endpoints.
"""

from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from modules.tanmay.service import get_satya_kavach_engine

router = APIRouter(prefix="/api/tanmay", tags=["Tanmay - SATYA-KAVACH Anti-Gaming & Claim Evasion"])

class Clause10CCSimRequest(BaseModel):
    original_cost_cr: float = Field(default=1000.0, ge=10.0, description="Original sanctioned cost in ₹ Crore")
    sanction_year: int = Field(default=2018, ge=2005, le=2026, description="Sanction / Bid submission base year")
    revised_cost_cr: float = Field(default=1195.0, ge=10.0, description="Revised cost demanded in ₹ Crore")
    p_steel: float = Field(default=0.20, ge=0.0, le=1.0, description="Steel weight fraction")
    p_cement: float = Field(default=0.15, ge=0.0, le=1.0, description="Cement weight fraction")
    p_fuel: float = Field(default=0.15, ge=0.0, le=1.0, description="Fuel/Bitumen weight fraction")
    p_labor: float = Field(default=0.25, ge=0.0, le=1.0, description="Labor weight fraction")
    p_other: float = Field(default=0.25, ge=0.0, le=1.0, description="Other materials weight fraction")

@router.get("/status")
def get_status():
    return {
        "status": "online",
        "module": "SATYA-KAVACH",
        "lead": "Tanmay",
        "focus": "20% CCEA Cabinet Approval Threshold Anti-Gaming & CPWD Clause 10CC Forensic Audit",
        "endpoints": [
            "/api/tanmay/gaming-analysis",
            "/api/tanmay/bunching-histogram",
            "/api/tanmay/clause-10cc-audit",
            "/api/tanmay/agency-rankings",
            "/api/tanmay/simulate-clause-10cc"
        ]
    }

@router.get("/gaming-analysis")
def get_gaming_analysis():
    try:
        engine = get_satya_kavach_engine()
        return engine.get_anti_gaming_summary()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/bunching-histogram")
def get_bunching_histogram():
    try:
        engine = get_satya_kavach_engine()
        return engine.get_bunching_histogram_data()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/clause-10cc-audit")
def get_clause_10cc_audit(
    limit: int = Query(default=50, ge=1, le=500),
    sector: Optional[str] = Query(default=None)
):
    try:
        engine = get_satya_kavach_engine()
        return engine.get_clause_10cc_audit_report(limit=limit, sector_filter=sector)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/agency-rankings")
def get_agency_rankings():
    try:
        engine = get_satya_kavach_engine()
        return engine.get_agency_gaming_rankings()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/simulate-clause-10cc")
def simulate_clause_10cc(req: Clause10CCSimRequest):
    try:
        engine = get_satya_kavach_engine()
        return engine.simulate_clause_10cc(
            original_cost_cr=req.original_cost_cr,
            sanction_year=req.sanction_year,
            revised_cost_cr=req.revised_cost_cr,
            p_steel=req.p_steel,
            p_cement=req.p_cement,
            p_fuel=req.p_fuel,
            p_labor=req.p_labor,
            p_other=req.p_other
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

