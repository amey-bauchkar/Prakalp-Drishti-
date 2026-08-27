"""
PRAKALP-DRISHTI: Parth's Router
Exposes ARTHA-NIVARAN contractor-360 endpoints: executing-agency solvency across
the full 2,207-project corpus, plus the NIVARAN legal-exposure overlay.
"""

from fastapi import APIRouter, HTTPException, Query

from backend.security import sanitize_id
from modules.parth.service import get_artha_nivaran_engine

router = APIRouter(prefix="/api/parth",
                   tags=["Parth - ARTHA-NIVARAN Contractor 360"])


@router.get("/status")
def get_status():
    return {
        "status": "online",
        "module": "ARTHA-NIVARAN",
        "lead": "Parth (solvency) + Aditya (legal exposure)",
        "focus": "Executing-agency solvency, leverage tiers and litigation exposure "
                 "across all 2,207 central-sector projects",
    }


@router.get("/portfolio")
def get_portfolio_summary():
    """Macro solvency KPIs over the whole corpus.

    Includes the coverage figures deliberately: only a minority of executing
    bodies have a published balance sheet, and a dashboard that shows a tier
    breakdown without saying how much of the portfolio it actually covers invites
    the reader to assume it covers all of it.
    """
    try:
        return get_artha_nivaran_engine().portfolio_summary()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/agencies")
def list_agencies(
    q: str = Query(default="", max_length=80, description="Free-text name filter"),
    tier: str = Query(default="", description="Filter by solvency tier"),
    limit: int = Query(default=250, ge=1, le=500),
):
    """Searchable directory of every executing agency in the corpus."""
    try:
        rows = get_artha_nivaran_engine().agencies
        if q:
            needle = q.strip().lower()
            rows = [a for a in rows
                    if needle in a["agency_name"].lower()
                    or needle in a["agency_key"].lower()]
        if tier:
            rows = [a for a in rows if a["solvency_tier"] == tier.upper()]
        return {"total_matching": len(rows), "agencies": rows[:limit]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/agency/{agency_key}/projects")
def get_agency_projects(agency_key: str):
    """Every project executing under one agency, for the drilldown."""
    try:
        key = sanitize_id(agency_key, field="agency_key", max_len=80)
        result = get_artha_nivaran_engine().agency_projects(key)
        if not result.get("available"):
            raise HTTPException(status_code=404,
                                detail=f"No projects found for agency {key}")
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/psu-risk")
def get_psu_risk():
    """Legacy shape, retained so existing callers keep working.

    The previous implementation returned six hardcoded PSU records. It now serves
    the rated subset of the real directory, with the tier rules attached.
    """
    try:
        e = get_artha_nivaran_engine()
        rated = [a for a in e.agencies if a["debt_to_equity"] is not None]
        summary = e.portfolio_summary()
        return {
            "module": "ARTHA-NIVARAN",
            "total_psus_tracked": len(rated),
            "high_risk_psu_count": sum(1 for a in rated if a["debt_to_equity"] > 2.0),
            "coverage": summary.get("solvency_coverage"),
            "financial_delay_differential": summary.get("financial_delay_differential"),
            "psu_risk_records": rated,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
