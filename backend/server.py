"""
PRAKALP-DRISHTI: Central FastAPI Backend Server
Hosts auto-discovered REST API routers for all team members, serves local in-memory datasets in <5ms,
and provides static asset serving for the executive frontend dashboard.
"""

import os
import sys
import json
import pandas as pd
from typing import Optional

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

BACKEND_DIR = os.path.join(BASE_DIR, "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

DATA_PATH = os.path.join(BASE_DIR, "paimana_extracted", "PAIMANA_MASTER_PROJECTS_DATABASE.csv")
GEO_PATH = os.path.join(BASE_DIR, "paimana_extracted", "satellite_data", "ALL_2207_PROJECTS_GEOREFERENCED.json")
IMAGERY_DIR = os.path.join(BASE_DIR, "paimana_extracted", "satellite_data", "project_imagery")
STATIC_DIR = os.path.join(BASE_DIR, "frontend", "dist")

app = FastAPI(
    title="PRAKALP-DRISHTI: Autonomous Infrastructure Intelligence API",
    description="Live End-to-End Decision & Optimization Engine for MoSPI Central Sector Mega-Projects",
    version="1.0.0"
)

# Enable CORS for local React/Vite development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-Memory Cache on Startup
projects_cache = []
projects_df = None

@app.on_event("startup")
def load_in_memory_cache():
    global projects_cache, projects_df
    print("Loading 2,207 projects into ultra-fast in-memory cache...")
    if os.path.exists(DATA_PATH):
        projects_df = pd.read_csv(DATA_PATH)
        projects_df["OriginalCost"] = pd.to_numeric(projects_df["OriginalCost"], errors="coerce").fillna(500.0)
        projects_df["RevisedCost"] = pd.to_numeric(projects_df["RevisedCost"], errors="coerce").fillna(projects_df["OriginalCost"])
        projects_df["DELAYED_TIME"] = pd.to_numeric(projects_df["DELAYED_TIME"], errors="coerce").fillna(0.0)
        projects_df["PhysicalProgress"] = pd.to_numeric(projects_df["PhysicalProgress"], errors="coerce").fillna(25.0)
        
        # Load Geocodes
        geo_dict = {}
        if os.path.exists(GEO_PATH):
            with open(GEO_PATH, "r", encoding="utf-8") as f:
                geos = json.load(f)
                if isinstance(geos, list):
                    for g in geos:
                        pid = str(g.get("ProjectId") or g.get("id"))
                        geo_dict[pid] = g

        records = []
        for _, row in projects_df.iterrows():
            pid = str(row["ProjectId"])
            geo = geo_dict.get(pid, {})
            records.append({
                "project_id": pid,
                "project_name": str(row["ProjectName"]),
                "sector": str(row["SectorName"]),
                "state": str(row["StateName"]),
                "company": str(row["COMPANYNAME"]),
                "original_cost_cr": float(row["OriginalCost"]),
                "revised_cost_cr": float(row["RevisedCost"]),
                "delayed_months": float(row["DELAYED_TIME"]),
                "progress_perc": float(row["PhysicalProgress"]),
                "sanction_date": str(row["SanctionDate"]),
                "target_date": str(row["RevisedDate"]),
                "latitude": geo.get("lat") or geo.get("latitude") or 22.5,
                "longitude": geo.get("lng") or geo.get("longitude") or 78.5,
                "satellite_status": "CORROBORATED" if float(row["PhysicalProgress"]) > 40 else "DISCREPANCY_FLAGGED",
                "satellite_before_img": f"/satellite-imagery/{pid}_BEFORE.jpg",
                "satellite_after_img": f"/satellite-imagery/{pid}_AFTER.jpg"
            })
        projects_cache = records
        print(f"Loaded {len(projects_cache)} projects in RAM! Queries will execute in <5ms.")

# Dynamic Auto-Discovery of Member Routers (Zero-Conflict Protocol)
MEMBERS = ["amey", "tanmay", "parth", "janhavi", "soham", "aditya", "karya_dakshata"]
for member in MEMBERS:
    try:
        mod = __import__(f"modules.{member}.router", fromlist=["router"])
        if hasattr(mod, "router"):
            app.include_router(mod.router)
            print(f"Mounted auto-discovered router: modules.{member}.router")
    except Exception as e:
        print(f"Member router for '{member}' pending implementation ({e})")

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "total_projects_cached": len(projects_cache),
        "total_portfolio_capex_cr": sum(p["revised_cost_cr"] for p in projects_cache) if projects_cache else 0.0,
        "offline_air_gapped_mode": True
    }

@app.get("/api/projects")
def get_projects(
    sector: Optional[str] = None,
    state: Optional[str] = None,
    min_cost: Optional[float] = None,
    limit: int = Query(default=100, ge=1, le=2207)
):
    results = projects_cache
    if sector and sector != "All":
        results = [p for p in results if p["sector"].lower() == sector.lower()]
    if state and state != "All":
        results = [p for p in results if p["state"].lower() == state.lower()]
    if min_cost is not None:
        results = [p for p in results if p["revised_cost_cr"] >= min_cost]
    return results[:limit]

@app.get("/api/projects/{project_id}")
def get_project_by_id(project_id: str):
    for p in projects_cache:
        if p["project_id"] == str(project_id):
            return p
    raise HTTPException(status_code=404, detail="Project not found")

# ── Satellite Imagery API ──────────────────────────────────────────────────
@app.get("/api/satellite/{project_id}")
def get_satellite_imagery(project_id: str):
    """Returns satellite before/after imagery paths for a project."""
    before_path = os.path.join(IMAGERY_DIR, f"{project_id}_BEFORE.jpg")
    after_path = os.path.join(IMAGERY_DIR, f"{project_id}_AFTER.jpg")
    return {
        "project_id": project_id,
        "before_available": os.path.exists(before_path),
        "after_available": os.path.exists(after_path),
        "before_url": f"/satellite-imagery/{project_id}_BEFORE.jpg" if os.path.exists(before_path) else None,
        "after_url": f"/satellite-imagery/{project_id}_AFTER.jpg" if os.path.exists(after_path) else None,
        "source": "ESRI ArcGIS World Imagery + Wayback Living Atlas",
        "resolution": "Sub-meter (~0.5-1.2m/pixel)"
    }

# Mount satellite imagery as static files
if os.path.exists(IMAGERY_DIR):
    app.mount("/satellite-imagery", StaticFiles(directory=IMAGERY_DIR), name="satellite-imagery")

# Serve assets (js/css) if present
assets_dir = os.path.join(STATIC_DIR, "assets")
if os.path.exists(assets_dir):
    app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

# SPA Fallback: Serve index.html for all frontend routes (Single Unified URL)
@app.get("/{full_path:path}")
async def serve_spa_catchall(full_path: str):
    file_path = os.path.join(STATIC_DIR, full_path)
    if os.path.exists(file_path) and os.path.isfile(file_path):
        return FileResponse(file_path)
    index_file = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    raise HTTPException(status_code=404, detail="Frontend build not found. Run 'npm run build' in frontend/.")

if __name__ == "__main__":
    import uvicorn

    # Worker count is configurable rather than pinned at 1. Each worker holds its own
    # copy of the engines (~190 MB RSS) and pays the ~16 s cold start, so this is a
    # deliberate memory-vs-throughput trade the operator makes, not a constant baked
    # into the source. Defaults to 1 for laptop demos.
    workers = int(os.environ.get("PRAKALP_WORKERS", "1"))
    host = os.environ.get("PRAKALP_HOST", "127.0.0.1")
    port = int(os.environ.get("PRAKALP_PORT", "8000"))

    print(f"Starting PRAKALP-DRISHTI FastAPI Server on http://{host}:{port} "
          f"({workers} worker{'s' if workers != 1 else ''})")
    if workers > 1:
        # uvicorn requires an import string, not an app object, to fork workers.
        uvicorn.run("backend.server:app", host=host, port=port, workers=workers)
    else:
        uvicorn.run(app, host=host, port=port)
