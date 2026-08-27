"""
PRAKALP-DRISHTI: Janhavi's Router
Exposes VARSHA-SPEED Monsoon Impact, Historical 2005–2025 IMD Analytics & Working-Window Contraction endpoints.
"""

from fastapi import APIRouter, Query, HTTPException, Path
from typing import Optional
from modules.janhavi.service import get_varsha_speed_engine

router = APIRouter(prefix="/api/janhavi", tags=["Janhavi - VARSHA-SPEED Monsoon Impact & Working Window"])

@router.get("/status")
def get_status():
    return {
        "status": "online",
        "module": "VARSHA-SPEED",
        "lead": "Janhavi",
        "focus": "IMD Monsoon Rainfall Anomalies & Seasonal Working-Window Contraction",
        "dataset": "630 State-Years (2005–2025) across 30 States/UTs"
    }

@router.get("/monsoon-impact")
def get_monsoon_impact(rainfall_anomaly_pct: float = Query(default=15.0, ge=-50.0, le=100.0)):
    """
    Simulates seasonal working-window compression and schedule stretch across all 30 Indian states.
    """
    try:
        engine = get_varsha_speed_engine()
        return engine.get_monsoon_impact_summary(rainfall_anomaly_pct=rainfall_anomaly_pct)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/state-historical-profiles")
def get_state_historical_profiles():
    """
    Returns 20-year IMD monsoon statistical profiles (mean departure, max excess/deficit years) for all 30 states.
    """
    try:
        engine = get_varsha_speed_engine()
        return engine.get_state_historical_profiles()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/state-timeline/{state_name}")
def get_state_timeline(state_name: str = Path(..., description="Name of the Indian state")):
    """
    Returns year-by-year (2005–2025) rainfall departure time-series for a given state.
    """
    try:
        engine = get_varsha_speed_engine()
        res = engine.get_state_timeline(state_name=state_name)
        if "error" in res:
            raise HTTPException(status_code=404, detail=res["error"])
        return res
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/project-weather-audit")
def get_project_weather_audit(
    limit: int = Query(default=30, ge=1, le=200),
    sector: Optional[str] = Query(default=None),
    min_cost_cr: float = Query(default=500.0, ge=0.0)
):
    """
    Evaluates real mega-projects against state weather risk, lost workdays, and schedule stretch multipliers.
    """
    try:
        engine = get_varsha_speed_engine()
        return engine.get_project_weather_audit(limit=limit, sector_filter=sector, min_cost_cr=min_cost_cr)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ══════════════════════════════════════════════════════════════════════════
# SETU-VARSHA: climate shock coupled into the dependency network
# ══════════════════════════════════════════════════════════════════════════

@router.get("/setu-varsha/cascade")
def get_climate_cascade(
    rainfall_anomaly_pct: float = Query(default=15.0, ge=-50.0, le=50.0),
    state: str = Query(default="", max_length=60),
):
    """Rainfall departure -> working window -> DAG delay -> locked capex.

    The whole causal chain in one call, so the war-room slider drives a single
    request rather than stitching three engines together in the browser.
    """
    try:
        from analytics_engine.setu_graph import get_setu_graph_engine
        return get_setu_graph_engine().simulate_climate_cascade(
            rainfall_anomaly_pct=rainfall_anomaly_pct,
            state_filter=state.strip() or None,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
