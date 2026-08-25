from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import sys
import os

# Ensure analytics_engine is in path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from analytics_engine.karya_engine import AgencyScorer, ProjectDebiaser, DeadCapitalTracker

router = APIRouter(
    prefix="/api/karya-dakshata",
    tags=["Karya-Dakshata"]
)

# Initialize engines
try:
    scorer = AgencyScorer()
    debiaser = ProjectDebiaser(scorer)
    tracker = DeadCapitalTracker()
except Exception as e:
    print(f"[KARYA-DAKSHATA] Initialization Error: {e}")

class SimulateRequest(BaseModel):
    agency_name: str
    base_cost_cr: float
    base_time_days: float

@router.get("/agencies")
def get_agencies():
    """Returns all agencies and their reliability scores."""
    # Convert dict to list for frontend
    agencies_list = []
    for name, stats in scorer.agency_stats.items():
        agencies_list.append({
            "name": name,
            **stats
        })
    # Sort by project count
    agencies_list = sorted(agencies_list, key=lambda x: x["project_count"], reverse=True)
    return {"agencies": agencies_list}

@router.post("/simulate")
def simulate_project(req: SimulateRequest):
    """De-biases a new project proposal based on historical track records."""
    try:
        result = debiaser.predict_true_metrics(
            req.agency_name, 
            req.base_cost_cr, 
            req.base_time_days
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/dead-capital")
def get_dead_capital():
    """Returns mega-projects burning >100Cr with <20% progress."""
    try:
        dead_df = tracker.get_dead_capital_projects()
        # Replace NaN with None for JSON serialization
        dead_df = dead_df.replace({float('nan'): None})
        return {"projects": dead_df.to_dict(orient="records")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
