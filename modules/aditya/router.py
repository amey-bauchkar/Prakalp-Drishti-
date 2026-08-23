"""
PRAKALP-DRISHTI: Aditya's Router
Exposes EO-AUDITOR Satellite Ground-Truth endpoints.
"""

from fastapi import APIRouter, Query, HTTPException
from modules.aditya.service import get_eo_auditor_engine

router = APIRouter(prefix="/api/aditya", tags=["Aditya - EO-AUDITOR Satellite Ground Truth"])

@router.get("/status")
def get_status():
    return {
        "status": "online",
        "module": "EO-AUDITOR",
        "lead": "Aditya",
        "focus": "Earth Observation Satellite CV Ground Truth Corroboration & War Room"
    }

@router.get("/satellite-showcase")
def get_satellite_showcase(limit: int = Query(default=50, ge=1, le=2207)):
    try:
        engine = get_eo_auditor_engine()
        return engine.get_satellite_war_room_summary(limit=limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
