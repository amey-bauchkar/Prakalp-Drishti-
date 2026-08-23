"""
PRAKALP-DRISHTI: Soham's Router
Exposes DPR-SCORER Proposal Quality & Pre-Election Rush endpoints.
"""

from fastapi import APIRouter, HTTPException
from modules.soham.service import get_dpr_scorer_engine

router = APIRouter(prefix="/api/soham", tags=["Soham - DPR-SCORER Proposal Quality & Pre-Election Rush"])

@router.get("/status")
def get_status():
    return {
        "status": "online",
        "module": "DPR-SCORER",
        "lead": "Soham",
        "focus": "Proposal Scoping Completeness & Pre-Election Approval Anomaly Detection"
    }

@router.get("/election-rush")
def get_election_rush():
    try:
        engine = get_dpr_scorer_engine()
        return engine.get_election_rush_summary()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
