# 🛡️ PRAKALP-DRISHTI: Team Collaboration & Zero-Conflict Git Rules
### SIH 2026 · Smart India Hackathon · Multi-Agent & Parallel Development Protocol

To ensure all team members can build, test, and push code in parallel with **0% merge conflicts**, everyone must strictly adhere to the following rules:

---

## 📁 1. Strict Folder Ownership & Partitioning

| Team Member | Module Name | Backend Workspace (Only edit here!) | Frontend Workspace (Only edit here!) |
| :--- | :--- | :--- | :--- |
| **Amey** | `KAAL-CHAKRA`, `SETU-GRAPH`, `VITTA-VYUHA`, `PRAGATI-SAARTHI` | `modules/amey/` | `frontend/amey/` |
| **Tanmay** | `SATYA-KAVACH` | `modules/tanmay/` | `frontend/tanmay/` |
| **Parth** | `ARTHA-NETRA` | `modules/parth/` | `frontend/parth/` |
| **Janhavi** | `VARSHA-SPEED` | `modules/janhavi/` | `frontend/janhavi/` |
| **Soham** | `DPR-SCORER` | `modules/soham/` | `frontend/soham/` |
| **Aditya** | `EO-AUDITOR` | `modules/aditya/` | `frontend/aditya/` |

> 🚫 **RULE #1**: Never modify, delete, or rename files outside your assigned `modules/<name>/` and `frontend/<name>/` folders.

---

## 📊 2. Shared Data Protocol (Read-Only)

* All clean, enriched datasets (2,207 projects, geocoded coordinates, IMD monsoon anomalies, stock fundamentals, satellite image paths) live in:
  📁 **`paimana_extracted/`**
* **Access Rule**: Treat `paimana_extracted/` as **strictly READ-ONLY**. Load datasets using standard pandas / JSON / SQLite.
* 🚫 **RULE #2**: Never overwrite, delete, or re-save raw shared files in `paimana_extracted/`. If your module generates new outputs, save them inside `modules/<name>/artifacts/` or `artifacts/`.

---

## 🔌 3. Plug-and-Play Integration Contracts

To avoid conflicts in central files (`backend/server.py` and `frontend/src/App.jsx`):

### A. Backend Integration Standard
Each member must expose a self-contained FastAPI `APIRouter` inside `modules/<name>/router.py`:
```python
# Inside modules/<your_name>/router.py
from fastapi import APIRouter

router = APIRouter(prefix="/api/<your_name>", tags=["<Your Feature>"])

@router.get("/status")
def get_status():
    return {"status": "active", "module": "<Your Feature>"}
```
Central `backend/server.py` will mount your router:
```python
from modules.<your_name>.router import router as member_router
app.include_router(member_router)
```

### B. Frontend Integration Standard
Each member must export a single master view component from `frontend/<your_name>/index.jsx`:
```jsx
// Inside frontend/<your_name>/index.jsx
import React from 'react';

export default function MemberView() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gov-navy">My Module View</h1>
    </div>
  );
}
```
Central `frontend/src/App.jsx` will import your view into its respective navigation tab:
```jsx
import MemberView from '../<your_name>/index.jsx';
```

---

## 🌿 4. Standard Git Branching & Workflow

### Step 1: Create your feature branch
Always work on your personal feature branch, never directly on `main`:
```bash
git checkout main
git pull origin main
git checkout -b feature/<your-name>-module
```

### Step 2: Stage only your assigned directories
```bash
git add modules/<your-name>/ frontend/<your-name>/
```

### Step 3: Commit with standard format
```bash
git commit -m "feat(<your-name>): implement initial <feature-name> engine"
```

### Step 4: Keep updated with main before pushing
```bash
git fetch origin
git rebase origin/main
git push -u origin feature/<your-name>-module
```

---

## 🚫 5. Things That Are Strictly Prohibited

1. ❌ Do NOT run `git add .` or `git add -A` blindly. Stage only files inside your folder.
2. ❌ Do NOT push `node_modules/`, `.venv/`, `__pycache__/`, `.env`, or temporary `*.log` files (verified by `.gitignore`).
3. ❌ Do NOT change shared dependencies in `package.json` or `requirements.txt` without informing the team.
4. ❌ Do NOT commit large raw video or multi-gigabyte temporary model weight files to GitHub.

---

## ✅ 6. Pre-Push Checklist for Every Member

Before you push your branch or open a Pull Request:
- [ ] Are all your backend files placed strictly inside `modules/<your_name>/`?
- [ ] Are all your frontend components placed strictly inside `frontend/<your_name>/`?
- [ ] Is `paimana_extracted/` untouched and unmodified?
- [ ] Does your backend code run without import errors?
- [ ] Does your frontend component export a clean default React component?
- [ ] Have you rebased your branch with latest `main`?
