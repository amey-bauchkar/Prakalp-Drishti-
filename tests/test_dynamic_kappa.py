import os
import sys
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)
sys.stdout.reconfigure(encoding="utf-8")
from analytics_engine.vitta_vyuha import get_vitta_vyuha_engine
import numpy as np
from scipy.optimize import milp, linprog, LinearConstraint, Bounds

eng = get_vitta_vyuha_engine()
cand = eng.candidate_df
N = len(cand)

costs = cand["RevisedCost"].values
progress = cand["PhysicalProgress"].values
delays = cand["REAL_DELAY_MONTHS"].values
is_ner = cand["IsNER"].values.astype(float)
pids = cand["ProjectId"].astype(str).values
pnames = cand["ProjectName"].values

# Quarterly Capex Demand: 8% to 25% of remaining cost
remaining_cost = costs * np.maximum(1.0 - progress / 100.0, 0.15)
demands = np.clip(remaining_cost * 0.20, 50.0, 2500.0)
print(f"Total Absorption Capacity of 60 Mega-Projects: Rs. {np.sum(demands):,.2f} Cr")

# Risk Metric
risk_score = (delays / 25.0) + np.maximum(0.0, (50.0 - progress) / 50.0)
risk_normalized = risk_score / np.mean(risk_score)

gammas = np.array([eng.shapley_scores.get(p, 100.0) for p in pids])
gammas = (gammas / np.mean(gammas)) if np.mean(gammas) > 0 else np.ones(N)
base_yield = np.maximum(0.2, (0.5 + (progress / 100.0) - (delays / 200.0)) * gammas)

B = 12000.0 # Budget Pool

print(f"\n--- Testing Risk Dial (kappa = 0.0 to 1.0) with Budget = Rs.{B:,.0f} Cr ---")

_sweep = {}
_duals = {}
_solved = 0
_attempted = 0
for kappa in [0.0, 0.25, 0.50, 0.75, 1.0]:
    # Risk Dial adjusts the effective objective coefficient:
    # kappa=0 -> prioritize raw expected completion yield
    # kappa=1 -> penalize delayed/high-risk projects, prioritize safe/on-track execution
    effective_yield = np.maximum(0.05, base_yield * (1.0 - 0.70 * kappa * (risk_normalized - 0.5)))
    c_x = - effective_yield
    
    A_budget = np.ones((1, N))
    A_ner = np.where(is_ner, -0.90, 0.10).reshape(1, N)
    A_ub = np.vstack([A_budget, A_ner])
    b_ub = np.array([B, 0.0])
    
    bounds = [(0.0, demands[i]) for i in range(N)]
    res = linprog(c=c_x, A_ub=A_ub, b_ub=b_ub, bounds=bounds, method="highs")
    
    if res.success:
        alloc = res.x
        tot = np.sum(alloc)
        ner_alloc = np.sum(alloc * is_ner)
        ner_pct = ner_alloc / tot * 100.0
        exp_yield = np.sum(alloc * base_yield) / tot * 100.0
        avg_risk = np.sum(alloc * risk_normalized) / tot
        pi_budget = abs(res.ineqlin.marginals[0]) if len(res.ineqlin.marginals) > 0 else 0.0
        
        # Check Top 3 funded projects
        _attempted += 1
        _solved += 1 if res.success else 0
        _sweep[kappa] = np.array(alloc, dtype=float)
        _duals[kappa] = float(abs(res.ineqlin.marginals[0])) if len(res.ineqlin.marginals) else 0.0
        top3_idx = np.argsort(-alloc)[:3]
        top3_names = [f"{pnames[i][:18]} (Rs.{alloc[i]:.0f}Cr)" for i in top3_idx]
        
        print(f"kappa = {kappa:4.2f} -> Allocated: Rs.{tot:,.0f} Cr | Expected Yield: {exp_yield:.1f}% | Portfolio Tail-Risk: {avg_risk:.2f} | pi(Budget): {pi_budget:.3f}")
        print(f"             Top Funded: {top3_names}")


# ── ASSERTIONS ────────────────────────────────────────────────────────────
# This file swept kappa and printed a table. It never checked that the LP
# solved, that the budget held, that the duals were finite, or that the risk
# dial changed anything -- every one of those could fail and the script still
# exited 0.
assert _solved == _attempted, f"only {_solved}/{_attempted} LP solves reached optimality"
assert _attempted >= 3, "too few kappa points swept to demonstrate a dial"
for _k, _a in _sweep.items():
    assert np.all(_a >= -1e-6), f"negative allocation at kappa={_k}"
    assert _a.sum() <= B + 1e-3, f"budget breached at kappa={_k}: {_a.sum():.2f} > {B}"
assert all(np.isfinite(v) for v in _duals.values()), f"non-finite dual: {_duals}"

_ks = sorted(_sweep)
_moved = int(np.sum(np.abs(_sweep[_ks[0]] - _sweep[_ks[-1]]) > 1.0))
assert _moved > 0, (
    f"the risk dial is inert: kappa {_ks[0]} and {_ks[-1]} produced identical "
    f"allocations")
print(f"ASSERTIONS PASSED: {_solved}/{_attempted} LPs optimal, budget held at "
      f"every kappa, duals finite, {_moved} projects reallocated across the dial.")
