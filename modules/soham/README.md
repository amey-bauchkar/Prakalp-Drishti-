# 📑 Soham's Workspace: DPR-SCORER
### Proposal Quality & Pre-Election Rush Approval Anomaly Detector

## 📌 Module Responsibilities:
- Identifies projects sanctioned in the 90 days preceding assembly elections without 80% Right-of-Way (ROW) acquisition.
- Computes DPR scoping completeness scores and predicts administrative approval delays.

## 🚀 How to Build & Extend:
1. Write core analytical logic in `modules/soham/service.py`.
2. Expose endpoints in `modules/soham/router.py` (prefix: `/api/soham`).
3. Build the frontend view in `frontend/soham/index.jsx`.
4. Run tests in `tests/`.
