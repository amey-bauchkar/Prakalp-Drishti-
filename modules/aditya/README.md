# 🛰️ Aditya's Workspace: EO-AUDITOR
### Satellite Earth Observation & Computer Vision Ground-Truth Corroboration

## 📌 Module Responsibilities:
- Analyzes dual-epoch high-resolution sub-meter satellite imagery (2018 vs 2023) across 2,207 georeferenced projects.
- Detects discrepancies between reported contractor progress and optical edge/vegetation changes.

## 🚀 How to Build & Extend:
1. Write core analytical logic in `modules/aditya/service.py`.
2. Expose endpoints in `modules/aditya/router.py` (prefix: `/api/aditya`).
3. Build the frontend view in `frontend/aditya/index.jsx`.
4. Run tests in `tests/`.
