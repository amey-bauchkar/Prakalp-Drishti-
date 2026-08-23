"""
PRAKALP-DRISHTI: Tanmay's Router
Exposes SATYA-KAVACH anti-gaming endpoints.
"""

from fastapi import APIRouter, HTTPException
from modules.tanmay.service import get_satya_kavach_engine

router = APIRouter(prefix="/api/tanmay", tags=["Tanmay - SATYA-KAVACH Anti-Gaming & Claim Evasion"])

@router.get("/status")
def get_status():
    return {
        "status": "online",
        "module": "SATYA-KAVACH",
        "lead": "Tanmay",
        "focus": "20% CCEA Cabinet Approval Threshold Anti-Gaming & Claim Audit"
    }

@router.get("/gaming-analysis")
def get_gaming_analysis():
    try:
        engine = get_satya_kavach_engine()
        return engine.get_anti_gaming_summary()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
