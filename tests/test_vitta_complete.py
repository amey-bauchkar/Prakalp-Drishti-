import sys
sys.stdout.reconfigure(encoding="utf-8")
import numpy as np
import pandas as pd
from scipy.optimize import linprog

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

cand = df.sort_values(by='RevisedCost', ascending=False).head(60).copy()
N = len(cand)

costs = cand['RevisedCost'].values
progress = cand['PhysicalProgress'].values
delays = cand['REAL_DELAY_MONTHS'].values
is_ner = cand['StateName'].isin(['Assam', 'Arunachal Pradesh', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Sikkim', 'Tripura']).values.astype(float)
pids = cand['ProjectId'].astype(str).values
pnames = cand['ProjectName'].values

# Quarterly Cap per project: 5% to 20% of project cost (realistic disbursement cap)
demands = np.clip(costs * 0.12, 100.0, 1500.0)
total_demand = np.sum(demands)
print(f"Total Quarterly Capex Demand across Top 60 Projects: Rs. {total_demand:,.2f} Cr")

# Risk Penalty Metric (delay + low progress)
risk_penalty = (delays / 20.0) + np.maximum(0.0, (50.0 - progress) / 50.0)
risk_penalty = risk_penalty / np.mean(risk_penalty)

# Base Completion Yield
base_yield = np.maximum(0.2, (0.5 + (progress / 100.0) - (delays / 200.0)))

B = 12000.0 # Budget Pool (binding since total demand is ~25,000+ Cr)

print(f"\nOptimization at Budget = Rs. {B:,.0f} Cr:")
for kappa in [0.0, 0.25, 0.50, 0.75, 1.0]:
    # As kappa increases, risk_penalty dampens yield of risky projects
    # At kappa=0: pure high-yield pursuit
    # At kappa=1: high tail-risk protection (projects with delay/low progress receive severe discount)
    effective_yield = np.maximum(0.05, base_yield * (1.0 - 0.80 * kappa * (risk_penalty - 0.4)))
    c_x = - effective_yield
    
    # Budget & NER constraints: A_ub * x <= b_ub
    # 1. Budget: sum(x_i) <= B
    A_budget = np.ones((1, N))
    # 2. NER: sum_{NER} x_i >= 0.10 * sum(x_i) <=> sum_{not NER} 0.10 x_i - sum_{NER} 0.90 x_i <= 0
    A_ner = np.where(is_ner, -0.90, 0.10).reshape(1, N)
    
    A_ub = np.vstack([A_budget, A_ner])
    b_ub = np.array([B, 0.0])
    
    bounds = [(0.0, demands[i]) for i in range(N)]
    res = linprog(c=c_x, A_ub=A_ub, b_ub=b_ub, bounds=bounds, method='highs')
    
    if res.success:
        alloc = res.x
        tot = np.sum(alloc)
        ner_tot = np.sum(alloc * is_ner)
        ner_share = ner_tot / tot * 100.0
        weighted_yield = np.sum(alloc * base_yield) / tot * 100.0
        cvar_loss = np.sum(alloc * risk_penalty) / tot * 100.0
        
        pi_b = abs(res.ineqlin.marginals[0]) if len(res.ineqlin.marginals) > 0 else 0.0
        pi_ner = abs(res.ineqlin.marginals[1]) if len(res.ineqlin.marginals) > 1 else 0.0
        
        top3_idx = np.argsort(-alloc)[:3]
        top3_info = [(pids[i], f"Rs.{alloc[i]:.0f}Cr ({pnames[i][:20]})") for i in top3_idx]
        
        print(f"  kappa={kappa:4.2f} | Total Alloc: Rs.{tot:,.0f} Cr | Expected Yield: {weighted_yield:.1f}% | Tail Risk: {cvar_loss:.1f} | pi(B): {pi_b:.3f} | NER Share: {ner_share:.1f}%")
        print(f"             Top 3 Allocations: {top3_info}")
