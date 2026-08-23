"""
PRAKALP-DRISHTI: Janhavi's Router
Exposes VARSHA-SPEED Monsoon Impact & Work-Window Contraction endpoints.
"""

from fastapi import APIRouter, Query, HTTPException
from modules.janhavi.service import get_varsha_speed_engine

router = APIRouter(prefix="/api/janhavi", tags=["Janhavi - VARSHA-SPEED Monsoon Impact & Working Window"])

@router.get("/status")
def get_status():
    return {
        "status": "online",
        "module": "VARSHA-SPEED",
        "lead": "Janhavi",
        "focus": "IMD Monsoon Rainfall Anomalies & Seasonal Working-Window Contraction"
    }

@router.get("/monsoon-impact")
def get_monsoon_impact(rainfall_anomaly_pct: float = Query(default=15.0, ge=-50.0, le=100.0)):
    try:
        engine = get_varsha_speed_engine()
        return engine.get_monsoon_impact_summary(rainfall_anomaly_pct=rainfall_anomaly_pct)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
