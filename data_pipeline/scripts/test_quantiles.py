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
    historical_pace = max(P, 5.0) / max(c_m, 3.0)
    rem_perc = max(100.0 - P, 0.5)
    rem_months = max((rem_perc / max(historical_pace, 0.12)) * (sec_mult**0.3), 1.0)
    duration_from_progress = c_m + rem_months
    
    w_progress = float(np.clip(P / 100.0, 0.05, 0.95))
    median_expected_duration = (1.0 - w_progress) * prior_duration + w_progress * duration_from_progress
    median_expected_duration = max(median_expected_duration, c_m + 1.0)
    
    sanction_dt = p['SanctionDate']
    rev_end_dt = p['RevisedDate'] if pd.notna(p['RevisedDate']) else sanction_dt + pd.Timedelta(days=365*4)
    t_revised_months = max((rev_end_dt - sanction_dt).days / 30.4375, 1.0)
    
    gamma = 0.45
    rem_uncertainty_scale = max((100.0 - P) / 100.0, 0.15)
    gamma_effective = gamma * np.sqrt(rem_uncertainty_scale)
    cqr_offsets = np.array([-3.0, 0.0, 4.5, 9.0]) * rem_uncertainty_scale
    quantiles_u = np.array([0.10, 0.50, 0.80, 0.95])
    
    raw_durations = median_expected_duration * np.power(quantiles_u / (1.0 - quantiles_u), gamma_effective) + cqr_offsets
    durations_monotone = np.maximum.accumulate(raw_durations)
    durations_monotone = np.maximum(durations_monotone, c_m + np.array([0.5, 1.0, 2.0, 4.0]) * rem_uncertainty_scale)
    
    p10_dt = sanction_dt + pd.Timedelta(days=int(durations_monotone[0] * 30.4375))
    p50_dt = sanction_dt + pd.Timedelta(days=int(durations_monotone[1] * 30.4375))
    p80_dt = sanction_dt + pd.Timedelta(days=int(durations_monotone[2] * 30.4375))
    p95_dt = sanction_dt + pd.Timedelta(days=int(durations_monotone[3] * 30.4375))
    
    progress_attenuation = max(1.0 - (P / 100.0), 0.05)
    foreclosure_prob = min(0.02 + (reset_count * 0.03) + (overrun_perc / 2000.0) * progress_attenuation, 0.20)
    pi_hat = 1.0 - foreclosure_prob
    
    prob_completion = 1.0 / (1.0 + np.power(median_expected_duration / t_revised_months, 1.0 / gamma_effective))
    prob_target_met = float(np.clip(prob_completion * pi_hat, 0.01, 0.99))
    
    print(f"=== Project {pid} ({str(p['ProjectName'])[:40]}) ===")
    print(f"  Physical Progress: {P:.1f}%")
    print(f"  Target Date: {rev_end_dt.strftime('%Y-%m-%d')}")
    print(f"  P10 Date: {p10_dt.strftime('%Y-%m-%d')}")
    print(f"  P50 Date: {p50_dt.strftime('%Y-%m-%d')}")
    print(f"  P80 Date: {p80_dt.strftime('%Y-%m-%d')}")
    print(f"  P95 Date: {p95_dt.strftime('%Y-%m-%d')}")
    print(f"  Target Compliance Reliability: {prob_target_met*100:.1f}%\n")
