import sys
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
