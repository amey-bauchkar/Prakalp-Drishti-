"""
PRAKALP-DRISHTI: Satya-Kavach Router (Simplified & Focused)
Exposes deterministic CCEA boundary analysis, flagged proximity projects,
project revision inspector dossier, and preserved statutory clearances.
"""

from typing import Optional
from fastapi import APIRouter, HTTPException, Query, Path
from pydantic import BaseModel, Field
from modules.tanmay.service import get_satya_kavach_engine

router = APIRouter(prefix="/api/tanmay", tags=["Tanmay - SATYA-KAVACH Statutory CCEA Boundary Analysis"])


class Clause10CCSimRequest(BaseModel):
    original_cost_cr: float = Field(default=1000.0, ge=1.0, description="Original sanctioned cost in ₹ Crore")
    sanction_year: int = Field(default=2018, ge=2005, le=2026, description="Sanction / Bid submission base year")
    revised_cost_cr: float = Field(default=1195.0, ge=1.0, description="Revised cost demanded in ₹ Crore")
    claimed_escalation_cr: Optional[float] = Field(default=None, ge=0.0, description="Operator claimed escalation in ₹ Crore")
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
        "focus": "Deterministic CCEA Boundary Screening & Project Revision Inspection",
        "endpoints": [
            "/api/tanmay/pattern-analysis",
            "/api/tanmay/bunching-histogram",
            "/api/tanmay/clause-10cc-audit",
            "/api/tanmay/simulate-clause-10cc",
            "/api/tanmay/project-dossier/{project_id}",
            "/api/tanmay/anumati/clearances",
        ],
    }


@router.get("/gaming-analysis")
@router.get("/pattern-analysis")
def get_pattern_analysis():
    """Returns boundary analysis summary, [18%, 20%) vs [20%, 22%) bin ratio, and flagged projects."""
    try:
        engine = get_satya_kavach_engine()
        return engine.get_boundary_analysis()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/bunching-histogram")
def get_bunching_histogram():
    """Generates distribution bins around the 20% CCEA threshold."""
    try:
        engine = get_satya_kavach_engine()
        return engine.get_bunching_histogram_data()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/clause-10cc-audit")
def get_clause_10cc_audit(
    limit: int = Query(default=50, ge=1, le=500),
    sector: Optional[str] = Query(default=None),
):
    """Returns Clause 10CC price variation forensic audit across projects."""
    try:
        engine = get_satya_kavach_engine()
        return engine.get_clause_10cc_audit_report(limit=limit, sector_filter=sector)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/simulate-clause-10cc")
def simulate_clause_10cc(req: Clause10CCSimRequest):
    """Operator what-if calculation for Clause 10CC statutory 85% caps."""
    try:
        engine = get_satya_kavach_engine()
        return engine.simulate_clause_10cc(
            original_cost_cr=req.original_cost_cr,
            sanction_year=req.sanction_year,
            revised_cost_cr=req.revised_cost_cr,
            claimed_escalation_cr=req.claimed_escalation_cr,
            p_steel=req.p_steel,
            p_cement=req.p_cement,
            p_fuel=req.p_fuel,
            p_labor=req.p_labor,
            p_other=req.p_other,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/project-dossier/{project_id}")
def get_project_dossier(project_id: str = Path(..., description="Project ID")):
    """Returns the project inspector dossier (costs, boundary distance, deduplicated revision history, Clause 10CC)."""
    try:
        engine = get_satya_kavach_engine()
        res = engine.get_project_dossier(project_id)
        if res.get("status") == "not_found":
            raise HTTPException(status_code=404, detail=f"Project #{project_id} not found in master database.")
        return res
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ══════════════════════════════════════════════════════════════════════════
# ANUMATI: statutory clearance workflow, preserved under SATYA-KAVACH
# ══════════════════════════════════════════════════════════════════════════

@router.get("/anumati/clearances")
def get_clearance_portfolio():
    """PARIVESH Stage-I / Stage-II clearance pipeline with bottleneck analysis."""
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
                estimated_daily_cost_overrun_cr=float(stages[0].get("estimated_daily_cost_overrun_cr") or 0.5),
                stages=details,
            ))
            projects.append(assessment.dict())

        stalled = [p for p in projects if p.get("risk_category") == "STALLED"]
        escalate = [p for p in projects if p.get("escalation_recommended")]

        return {
            "available": True,
            "coverage_note": "PARIVESH clearance filings exist for 3 projects, not the full 2,207-project portfolio.",
            "projects_with_clearance_records": len(projects),
            "clearance_stages_tracked": sum(len(p.get("stages", [])) for p in projects),
            "projects_stalled": len(stalled),
            "projects_flagged_for_pmo_escalation": len(escalate),
            "projects": projects,
        }
    except Exception as e:
        return {
            "available": False,
            "reason": str(e),
            "projects": [],
        }
