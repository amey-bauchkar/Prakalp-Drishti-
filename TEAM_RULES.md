# 🛡️ PRAKALP-DRISHTI: Team Collaboration & Zero-Conflict Protocol
### Smart India Hackathon 2026 · Problem Statement SIH26103 (MoSPI Central Sector Mega-Projects)
> **MANDATORY INSTRUCTION FOR ALL AI CODING AGENTS & TEAM MEMBERS:**
> Read this document completely before modifying any code. Adhering to these boundaries ensures **100% parallel development with 0% merge conflicts**.

---

## 👥 1. Team Workspace & Module Ownership Matrix

Every team member has an isolated backend workspace (`modules/<name>/`) and frontend workspace (`frontend/<name>/`).

| Member | Assigned Feature Module | Backend Workspace (Only edit here!) | Frontend Workspace (Only edit here!) | Live Route |
| :--- | :--- | :--- | :--- | :--- |
| **Amey** | `KAAL-CHAKRA`, `SETU-GRAPH`, `VITTA-VYUHA`, `PRAGATI-SAARTHI`, `AGENCY-INDEX` | `modules/amey/` & `analytics_engine/` | `frontend/amey/` | `/` |
| **Tanmay** | `SATYA-KAVACH` (20% CCEA Cabinet Rule Anti-Gaming & Contractor Claim Audit) | `modules/tanmay/` | `frontend/tanmay/` | `/tanmay` |
| **Parth** | `ARTHA-NETRA` (PSU Financial Solvency, Debt/Equity & Equity Market Stress) | `modules/parth/` | `frontend/parth/` | `/parth` |
| **Janhavi** | `VARSHA-SPEED` (IMD Monsoon Rainfall Anomalies & Working-Window Contraction) | `modules/janhavi/` | `frontend/janhavi/` | `/janhavi` |
| **Soham** | `DPR-SCORER` (Proposal Quality & Pre-Election Foundation Rush Detector) | `modules/soham/` | `frontend/soham/` | `/soham` |
| **Aditya** | `EO-AUDITOR` (Satellite Earth Observation CV Ground-Truth & War Room) | `modules/aditya/` | `frontend/aditya/` | `/aditya` |

---

## 🚫 2. Strict Boundary Rules (Enforced for Humans & AI Agents)

1. **RULE #1 (Isolation)**: **NEVER edit or delete files outside your assigned `modules/<name>/` and `frontend/<name>/` directories.**
2. **RULE #2 (Shared Data is Read-Only)**: The dataset directory `paimana_extracted/` is **strictly READ-ONLY**. Never write to or mutate `PAIMANA_MASTER_PROJECTS_DATABASE.csv`.
3. **RULE #3 (No Root Clutter)**: Never create temporary test scripts or scratch files in the project root directory. All tests belong in `tests/`.
4. **RULE #4 (Air-Gapped Operation)**: All algorithms, simulations, and data queries must run locally without external cloud dependencies or paid APIs.

---

## 🔌 3. Zero-Conflict Plug-and-Play Integration Contracts

The project uses an automated plugin architecture so you **NEVER need to edit central files** (`backend/server.py` or `frontend/src/App.jsx`).

### A. Backend Protocol (`modules/<name>/router.py`)
`backend/server.py` automatically scans and mounts all routers from `modules.<name>.router` on startup.

```python
# In modules/<your_name>/router.py
from fastapi import APIRouter

router = APIRouter(prefix="/api/<your_name>", tags=["<Your Name> - <Feature Name>"])

@router.get("/status")
def get_status():
    return {"status": "online", "module": "<Feature Name>", "lead": "<Your Name>"}

@router.get("/<your-endpoint>")
def get_data():
    # Return your analytical results here
    return {"result": "data"}
```

### B. Frontend Protocol (`frontend/<name>/index.jsx`)
`frontend/src/App.jsx` automatically renders your default component at `/<your_name>` (e.g. `http://localhost:5173/tanmay`).

```jsx
// In frontend/<your_name>/index.jsx
import React, { useState, useEffect } from 'react';

export default function YourModuleView() {
  return (
    <div className="p-6 space-y-4 max-w-7xl mx-auto">
      <h1 className="text-2xl font-black text-gov-navy">My Module Title</h1>
      {/* Build your UI cards, charts, and tables here */}
    </div>
  );
}
```

---

## 📊 4. How to Access Shared Project Data in Python

All 2,207 projects and auxiliary datasets can be accessed directly from `paimana_extracted/`:

```python
import os
import pandas as pd
import json

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# 1. Master Projects Database (2,207 projects, ₹31.4 Lakh Cr capex)
DATA_PATH = os.path.join(BASE_DIR, "paimana_extracted", "PAIMANA_MASTER_PROJECTS_DATABASE.csv")
df = pd.read_csv(DATA_PATH)

# 2. Georeferenced Coordinates
GEO_PATH = os.path.join(BASE_DIR, "paimana_extracted", "satellite_data", "ALL_2207_PROJECTS_GEOREFERENCED.json")

# 3. IMD State Monsoon Anomalies (2005–2025)
MONSOON_PATH = os.path.join(BASE_DIR, "paimana_extracted", "advanced_macro", "IMD_STATE_MONSOON_ANOMALIES_2005_2025.csv")

# 4. Satellite Dual-Epoch Imagery Directory
IMAGERY_DIR = os.path.join(BASE_DIR, "paimana_extracted", "satellite_data", "project_imagery")
```

---

## 🧪 5. Testing & Verification

Before pushing to git, always run the master test suite and check frontend builds:

### Run Backend Tests:
```bash
python tests/run_all_tests.py
```

### Run Frontend Build Verification:
```bash
cd frontend
npm run build
```

---

## 🌿 6. Git Branching & Commit Conventions

Always work in your dedicated feature branch:

```bash
# 1. Create and switch to your feature branch
git checkout -b feature/<your-name>-module

# 2. Stage ONLY your assigned directories
git add modules/<your-name>/ frontend/<your-name>/

# 3. Commit with semantic message
git commit -m "feat(<your-name>): implement <feature_name> engine and UI view"

# 4. Push to remote
git push -u origin feature/<your-name>-module
```

Following this protocol guarantees **100% velocity, clean code, and zero merge conflicts!**
