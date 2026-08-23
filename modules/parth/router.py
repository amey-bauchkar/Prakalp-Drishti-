"""
PRAKALP-DRISHTI: Parth's Router
Exposes ARTHA-NETRA PSU Financial Risk endpoints.
"""

from fastapi import APIRouter, HTTPException
from modules.parth.service import get_artha_netra_engine

router = APIRouter(prefix="/api/parth", tags=["Parth - ARTHA-NETRA PSU Financial Health & Stock Risk"])

@router.get("/status")
def get_status():
    return {
        "status": "online",
        "module": "ARTHA-NETRA",
        "lead": "Parth",
        "focus": "PSU Financial Solvency, Debt-to-Equity Ratios & Capital Market Risk"
    }

@router.get("/psu-risk")
def get_psu_risk():
    try:
        engine = get_artha_netra_engine()
        return engine.get_psu_financial_risk_summary()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
