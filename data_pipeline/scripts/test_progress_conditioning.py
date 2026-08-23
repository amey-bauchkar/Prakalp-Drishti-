import sys, os, pandas as pd, numpy as np

sys.stdout.reconfigure(encoding='utf-8')
os.chdir(r'c:\Users\SEBIN\Desktop\SIH PS')

df = pd.read_csv('paimana_extracted/PAIMANA_MASTER_PROJECTS_DATABASE.csv')
df['OriginalCost'] = pd.to_numeric(df['OriginalCost'], errors='coerce').fillna(500.0)
df['RevisedCost'] = pd.to_numeric(df['RevisedCost'], errors='coerce').fillna(df['OriginalCost'])
df['PhysicalProgress'] = pd.to_numeric(df['PhysicalProgress'], errors='coerce').fillna(25.0)

for dcol in ['SanctionDate', 'StartDate', 'OriginalEndDate', 'RevisedDate']:
    df[dcol] = pd.to_datetime(df[dcol], errors='coerce', dayfirst=True)

planned_duration = (df['OriginalEndDate'] - df['SanctionDate']).dt.days / 30.4375
df['PlannedDurationMonths'] = np.where(planned_duration > 3.0, planned_duration, 36.0)
current_duration = (pd.Timestamp('2026-06-01') - df['SanctionDate']).dt.days / 30.4375
df['CurrentDurationMonths'] = np.where(current_duration > 1.0, current_duration, 12.0)

test_ids = ['706724', '400188', '705728', '705237', '400259', '702668']

for pid in test_ids:
    p = df[df['ProjectId'].astype(str) == pid].iloc[0]
    P = float(p['PhysicalProgress'])
    c_m = float(p['CurrentDurationMonths'])
    p_m = float(p['PlannedDurationMonths'])
    orig_c = float(p['OriginalCost'])
    rev_c = float(p['RevisedCost'])
    overrun_perc = ((rev_c - orig_c) / orig_c * 100) if orig_c > 0 else 0
    reset_count = 1 if rev_c > orig_c * 1.01 else 0
    
    sec_mult = 1.35
    ent_mult = 1.25
    cost_mult = 1.0 + 0.12 * np.log10(max(orig_c, 100.0) / 100.0)
    rebase_mult = 1.0 + (reset_count * 0.15)
    
    prior_duration = p_m * sec_mult * ent_mult * cost_mult * rebase_mult
    
    # Progress-conditioned remaining duration
    pace = max(P, 5.0) / max(c_m, 3.0)
    rem_months = max(((100.0 - P) / max(pace, 0.15)) * (sec_mult**0.3), 1.0)
    progress_duration = c_m + rem_months
    
    # Smooth weight: As progress reaches 90-100%, empirical progress dominates
    w = np.clip(P / 100.0, 0.05, 0.95)
    median_duration = (1.0 - w) * prior_duration + w * progress_duration
    median_duration = max(median_duration, c_m + 1.0)
    
    rev_end_dt = p['RevisedDate'] if pd.notna(p['RevisedDate']) else p['SanctionDate'] + pd.Timedelta(days=365*4)
    t_revised_months = max((rev_end_dt - p['SanctionDate']).days / 30.4375, 1.0)
    
    gamma = 0.45
    foreclosure_prob = min(0.02 + (reset_count * 0.03) + (overrun_perc / 2000.0) * (1.0 - P / 100.0), 0.20)
    pi_hat = 1.0 - foreclosure_prob
    
    prob_target_met = float(np.clip(1.0 / (1.0 + np.power(median_duration / t_revised_months, 1.0 / gamma)) * pi_hat, 0.01, 0.99))
    
    pname = str(p["ProjectName"])[:50]
    print(f"Proj {pid} ({pname}):")
    print(f"  Physical Progress: {P:.1f}%")
    print(f"  Current Elapsed: {c_m:.1f} mo | Target Window: {t_revised_months:.1f} mo")
    print(f"  AFT Prior: {prior_duration:.1f} mo | Remaining Needed: {rem_months:.1f} mo -> Blended Median: {median_duration:.1f} mo")
    print(f"  Target Compliance Probability: {prob_target_met*100:.1f}%\n")
