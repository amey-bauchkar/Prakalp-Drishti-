import sys
sys.stdout.reconfigure(encoding="utf-8")
import numpy as np
import pandas as pd
from scipy.optimize import milp, linprog, LinearConstraint, Bounds

df = pd.read_csv('paimana_extracted/PAIMANA_MASTER_PROJECTS_DATABASE.csv')
def compute_delay(row):
    orig = pd.to_datetime(row.get('OriginalEndDate'), errors='coerce', dayfirst=True)
    rev = pd.to_datetime(row.get('RevisedDate'), errors='coerce', dayfirst=True)
    if pd.notna(orig) and pd.notna(rev) and rev > orig:
        return max(0.0, (rev - orig).days / 30.4375)
    return float(row.get('OnboardingDelay', 0.0) or 0.0)

df['REAL_DELAY_MONTHS'] = df.apply(compute_delay, axis=1)
df['RevisedCost'] = pd.to_numeric(df['RevisedCost'], errors='coerce').fillna(500.0)
df['PhysicalProgress'] = pd.to_numeric(df['PhysicalProgress'], errors='coerce').fillna(25.0)

# Top 60 candidate projects
cand = df.sort_values(by='RevisedCost', ascending=False).head(60).copy()
N = len(cand)
B = 12000.0

costs = cand['RevisedCost'].values
progress = cand['PhysicalProgress'].values
delays = cand['REAL_DELAY_MONTHS'].values
is_ner = cand['StateName'].isin(['Assam', 'Arunachal Pradesh', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Sikkim', 'Tripura']).values.astype(float)

# Project Risk: high delay + low progress + high cost overrun
risk_factor = (delays / 50.0) + ((100.0 - progress) / 100.0)
# Normalize risk factor
risk_factor = risk_factor / np.mean(risk_factor)

marginal_yield = (0.5 + (progress / 100.0) - (delays / 200.0))

print("Checking allocation shift with Risk Dial kappa:")
for kappa in [0.0, 0.25, 0.50, 0.75, 1.0]:
    # Objective trade-off: maximize yield while minimizing risk
    # c_i = - [ (1 - kappa) * Yield_i - kappa * Risk_i ]
    c_x = - ((1.0 - kappa) * marginal_yield - kappa * risk_factor * 0.8)
    
    A_budget = np.ones((1, N))
    A_ner = np.where(is_ner, 0.90, -0.10).reshape(1, N)
    A_ub = np.vstack([A_budget, -A_ner])
    b_ub = np.array([B, 0.0])
    
    bounds = [(0.0, max(c * 0.2, 50.0)) for c in costs]
    res = linprog(c=c_x, A_ub=A_ub, b_ub=b_ub, bounds=bounds, method='highs')
    
    if res.success:
        alloc = res.x
        # Total alloc
        tot = np.sum(alloc)
        # Check high-risk vs low-risk project allocation
        high_risk_alloc = np.sum(alloc[risk_factor > 1.2])
        low_risk_alloc = np.sum(alloc[risk_factor < 0.8])
        print(f"  kappa={kappa:4.2f} -> Tot: Rs.{tot:,.0f} Cr | Low-Risk Allocs: Rs.{low_risk_alloc:,.1f} Cr | High-Risk Allocs: Rs.{high_risk_alloc:,.1f} Cr")
