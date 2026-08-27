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



# ══════════════════════════════════════════════════════════════════════════
# ANUMATI: statutory clearance workflow, folded into the SATYA-KAVACH portal
# ══════════════════════════════════════════════════════════════════════════

@router.get("/anumati/clearances")
def get_clearance_portfolio():
    """PARIVESH Stage-I / Stage-II clearance pipeline with bottleneck analysis.

    Reads the real PARIVESH proposal records and runs each project's stages
    through the ANUMATI Regulatory Stagnation Index.

    Coverage is reported rather than implied. There are clearance records for a
    handful of projects, not for all 2,207, and a portal that showed a clearance
    panel without saying how many projects it covers would invite the reader to
    assume it covers the portfolio. It does not.
    """
    try:
        import sqlite3
        from collections import defaultdict

        from modules.aditya.data.sqlite_loader import DB_PATH, DB_FOUND
        from modules.aditya.modules.anumati import AnumatiEngine
        from modules.aditya.schemas.anumati_schema import (
            ClearanceStageDetail, ClearanceStatusRequest,
        )

        if not DB_FOUND:
            return {"available": False,
                    "reason": "PARIVESH clearance database not found.",
                    "projects": []}

        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        rows = [dict(r) for r in conn.execute("SELECT * FROM parivesh_clearances")]
        conn.close()

        by_project = defaultdict(list)
        for r in rows:
            by_project[r["project_id"]].append(r)

        engine = AnumatiEngine()
        projects = []
        for pid, stages in by_project.items():
            details = [ClearanceStageDetail(
                stage_code=s.get("stage_code") or "ENVIRONMENT_CLEARANCE",
                stage_name=s.get("stage_name") or "Clearance Stage",
                department=s.get("department") or "MoEFCC",
                status=s.get("status") or "SUBMITTED",
                days_pending=int(s.get("days_pending") or 0),
                benchmark_days=int(s.get("benchmark_days") or 90),
                loopback_count=int(s.get("eds_ads_raised_count") or 0),
                last_query_date=s.get("last_query"),
            ) for s in stages]

            assessment = engine.process_clearance_status(ClearanceStatusRequest(
                project_id=pid,
                project_name=stages[0].get("project_name") or pid,
                estimated_daily_cost_overrun_cr=float(
                    stages[0].get("estimated_daily_cost_overrun_cr") or 1.5),
                stages=details,
            ))
            payload = (assessment.model_dump() if hasattr(assessment, "model_dump")
                       else dict(assessment))
            payload["state"] = stages[0].get("state")
            payload["sector"] = stages[0].get("sector")
            payload["proposal_numbers"] = [s.get("proposal_no") for s in stages]
            payload["total_forest_diversion_ha"] = round(
                sum(float(s.get("diversion_forest_ha") or 0) for s in stages), 2)
            projects.append(payload)

        stalled = [p for p in projects if p.get("overall_clearance_status") == "STALLED"]
        return {
            "available": True,
            "module": "ANUMATI",
            "projects_with_clearance_records": len(projects),
            "clearance_stages_tracked": len(rows),
            "projects_stalled": len(stalled),
            "projects_flagged_for_pmo_escalation": sum(
                1 for p in projects if p.get("pmo_escalation_flag")),
            "coverage_note": (
                f"PARIVESH records exist for {len(projects)} projects covering "
                f"{len(rows)} clearance stages. The remainder of the 2,207-project "
                f"portfolio has no clearance filing in this dataset and is not "
                f"represented here."
            ),
            "projects": projects,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
