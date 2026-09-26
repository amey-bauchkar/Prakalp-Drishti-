"""
PRAKALP-DRISHTI: Satya-Kavach Router (Simplified & Focused)
Exposes deterministic CCEA boundary analysis, flagged proximity projects,
project revision inspector dossier, and preserved statutory clearances.
"""

import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Query, Path
from pydantic import BaseModel, Field
from modules.tanmay.service import get_satya_kavach_engine

logger = logging.getLogger("prakalp.satya_kavach.router")
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

_CLEARANCE_CACHE = None

def _get_or_build_clearance_cache(force_refresh: bool = False):
    global _CLEARANCE_CACHE
    if _CLEARANCE_CACHE is not None and not force_refresh:
        return _CLEARANCE_CACHE

    import sqlite3
    from collections import defaultdict
    from modules.aditya.data.sqlite_loader import DB_PATH, DB_FOUND
    from modules.aditya.modules.anumati import AnumatiEngine
    from modules.aditya.schemas.anumati_schema import (
        ClearanceStageDetail, ClearanceStatusRequest,
    )

    if not DB_FOUND:
        return None

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
        payload = assessment.model_dump() if hasattr(assessment, "model_dump") else assessment.dict()
        payload["state"] = stages[0].get("state") or "Pan-India"
        payload["sector"] = stages[0].get("sector") or "Infrastructure"
        payload["proposal_numbers"] = [s.get("proposal_no") for s in stages if s.get("proposal_no")]
        payload["total_forest_diversion_ha"] = round(
            sum(float(s.get("diversion_forest_ha") or 0) for s in stages), 2
        )
        projects.append(payload)

    stalled = [p for p in projects if p.get("overall_clearance_status") == "STALLED"]
    escalate = [p for p in projects if p.get("pmo_escalation_flag")]
    total_forest_ha = round(sum(p.get("total_forest_diversion_ha", 0) for p in projects), 2)

    _CLEARANCE_CACHE = {
        "projects": projects,
        "stalled_count": len(stalled),
        "escalate_count": len(escalate),
        "total_forest_ha": total_forest_ha,
        "total_stages": sum(len(p.get("stage_breakdown", [])) for p in projects),
    }
    return _CLEARANCE_CACHE


@router.get("/anumati/clearances")
def get_clearance_portfolio(
    limit: int = Query(default=100, ge=1, le=2207),
    offset: int = Query(default=0, ge=0),
    state: Optional[str] = None,
    sector: Optional[str] = None,
    status: Optional[str] = None,
    q: Optional[str] = None,
    refresh: bool = Query(default=False),
):
    """PARIVESH Stage-I / Stage-II clearance pipeline with bottleneck analysis across all 2,207 projects."""
    try:
        cache = _get_or_build_clearance_cache(force_refresh=refresh)
        if not cache:
            return {"available": False,
                    "reason": "PARIVESH clearance database not found.",
                    "projects": []}

        all_projs = cache["projects"]
        filtered = all_projs

        if state and state.strip() and state != "All":
            s_low = state.strip().lower()
            filtered = [p for p in filtered if s_low in str(p.get("state", "")).lower()]

        if sector and sector.strip() and sector != "All":
            sec_low = sector.strip().lower()
            filtered = [p for p in filtered if sec_low in str(p.get("sector", "")).lower()]

        if status and status.strip() and status != "All":
            stat_up = status.strip().upper()
            filtered = [p for p in filtered if str(p.get("overall_clearance_status", "")).upper() == stat_up]

        if q and q.strip():
            q_low = q.strip().lower()
            q_clean = q_low.lstrip("#").strip()
            filtered = [p for p in filtered if (
                q_low in str(p.get("project_name", "")).lower() or
                (q_clean and q_clean in str(p.get("project_id", "")).lower()) or
                q_low in str(p.get("state", "")).lower() or
                q_low in str(p.get("sector", "")).lower() or
                any(q_low in str(pn).lower() for pn in p.get("proposal_numbers", []))
            )]

        sliced = filtered[offset : offset + limit]

        return {
            "available": True,
            "coverage_note": "PARIVESH clearance filings synchronized for all 2,207 Central Sector mega-projects across MoEFCC & State Portals.",
            "total_portfolio_projects": len(all_projs),
            "projects_with_clearance_records": len(all_projs),
            "clearance_stages_tracked": cache["total_stages"],
            "total_forest_diversion_ha": cache["total_forest_ha"],
            "projects_stalled": cache["stalled_count"],
            "projects_flagged_for_pmo_escalation": cache["escalate_count"],
            "filtered_total": len(filtered),
            "limit": limit,
            "offset": offset,
            "projects": sliced,
        }
    except Exception as e:
        logger.error(f"Failed to load clearance portfolio: {e}")
        return {"available": False, "error": str(e), "projects": []}
