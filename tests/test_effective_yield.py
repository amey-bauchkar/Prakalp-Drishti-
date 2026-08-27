import os
import sys
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)
sys.stdout.reconfigure(encoding="utf-8")
import numpy as np
import pandas as pd
from analytics_engine.vitta_vyuha import get_vitta_vyuha_engine

eng = get_vitta_vyuha_engine()
df = eng.candidate_df

costs = df["RevisedCost"].values
progress = df["PhysicalProgress"].values
delays = df["REAL_DELAY_MONTHS"].values
is_ner = df["IsNER"].values.astype(float)
pids = df["ProjectId"].astype(str).values
gammas = np.array([eng.shapley_scores.get(p, 100.0) for p in pids])
gammas = (gammas / np.mean(gammas)) if np.mean(gammas) > 0 else np.ones(len(df))

# Project Risk Metric: High delay + low progress + high cost overrun volatility
risk_penalty = (delays / 30.0) + np.maximum(0.0, (50.0 - progress) / 50.0)
risk_penalty = risk_penalty / np.mean(risk_penalty)

# Base Yield
base_yield = (0.5 + (progress / 100.0) - (delays / 200.0)) * gammas

print("Risk penalty distribution:")
print(f"  Min: {risk_penalty.min():.2f}, Max: {risk_penalty.max():.2f}, Mean: {risk_penalty.mean():.2f}")

for kappa in [0.0, 0.25, 0.50, 0.75, 1.0]:
    # Objective weights: as kappa increases, risk_penalty dampens yield of risky projects
    effective_yield = base_yield * (1.0 - 0.7 * kappa * risk_penalty)
    print(f"kappa={kappa:.2f} -> Mean effective yield: {np.mean(effective_yield):.2f}, Top 3 project pids: {pids[np.argsort(-effective_yield)[:3]]}")


# ── ASSERTIONS ────────────────────────────────────────────────────────────
# The kappa dial is only meaningful if raising it actually shifts weight away
# from risky projects. Printing the means proved nothing; this checks the sign.
assert np.all(np.isfinite(base_yield)), "non-finite base yield"
assert np.all(risk_penalty >= 0), "negative risk penalty"
assert abs(risk_penalty.mean() - 1.0) < 1e-6, "risk penalty not mean-normalised"

means = []
for kappa in [0.0, 0.25, 0.50, 0.75, 1.0]:
    ey = base_yield * (1.0 - 0.7 * kappa * risk_penalty)
    assert np.all(np.isfinite(ey)), f"non-finite effective yield at kappa={kappa}"
    means.append(float(np.mean(ey)))

assert means == sorted(means, reverse=True),     f"mean effective yield must fall as risk aversion rises, got {means}"

risky = risk_penalty > np.percentile(risk_penalty, 90)
safe = risk_penalty < np.percentile(risk_penalty, 10)
lo = base_yield * (1.0 - 0.7 * 0.0 * risk_penalty)
hi = base_yield * (1.0 - 0.7 * 1.0 * risk_penalty)
shift_risky = float(np.mean(hi[risky]) - np.mean(lo[risky]))
shift_safe = float(np.mean(hi[safe]) - np.mean(lo[safe]))
assert shift_risky < shift_safe, (
    f"raising kappa must penalise risky projects MORE than safe ones "
    f"(risky {shift_risky:.3f} vs safe {shift_safe:.3f})")
print(f"ASSERTIONS PASSED: yield falls monotonically with kappa "
      f"({means[0]:.2f} -> {means[-1]:.2f}); risky projects penalised "
      f"{shift_risky:.2f} vs safe {shift_safe:.2f}.")
