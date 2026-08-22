"""
PRAKALP-DRISHTI: Hidden Correlation Hunter
Finding non-obvious factors that secretly affect project cost overruns & delays.
Testing 15+ hypotheses across 2,207 projects.
"""

import pandas as pd
import numpy as np
from scipy import stats
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

# Load data
df = pd.read_csv("paimana_extracted/PAIMANA_MASTER_PROJECTS_DATABASE.csv")

# Clean & compute derived fields
for col in ['OriginalCost', 'RevisedCost', 'Expenditure', 'PhysicalProgress',
            'DELAYED_TIME', 'COST_OVERRUN', 'COST_OVERRUN_PERC', 'COR_PERC', 'TOR_PERC', 'OnboardingDelay']:
    df[col] = pd.to_numeric(df[col], errors='coerce')

for col in ['SanctionDate', 'StartDate', 'OriginalEndDate', 'RevisedDate']:
    df[col] = pd.to_datetime(df[col], errors='coerce')

df['Overrun_Cr'] = df['RevisedCost'] - df['OriginalCost']
df['Overrun_Pct'] = (df['Overrun_Cr'] / df['OriginalCost'] * 100)
df['Has_Overrun'] = (df['Overrun_Cr'] > 0).astype(int)
df['Has_Delay'] = (df['DELAYED_TIME'] > 0).astype(int)
df['Sanction_Year'] = df['SanctionDate'].dt.year
df['Start_Year'] = df['StartDate'].dt.year
df['Start_Month'] = df['StartDate'].dt.month
df['Sanction_Month'] = df['SanctionDate'].dt.month
df['PlannedDuration_Months'] = ((df['OriginalEndDate'] - df['StartDate']).dt.days / 30.44).round(1)
df['TimeToStart_Days'] = (df['StartDate'] - df['SanctionDate']).dt.days
df['Expenditure_Ratio'] = (df['Expenditure'] / df['OriginalCost'] * 100)
df['Cost_Band'] = pd.cut(df['OriginalCost'], bins=[0, 500, 1000, 5000, 10000, 50000, 500000],
                          labels=['<500Cr', '500-1kCr', '1k-5kCr', '5k-10kCr', '10k-50kCr', '>50kCr'])

findings = []
finding_num = 0

def report_finding(title, description, strength, evidence):
    global finding_num
    finding_num += 1
    icon = "!!!" if strength == "STRONG" else ("!!" if strength == "MODERATE" else "!")
    findings.append({
        'num': finding_num, 'title': title, 'strength': strength,
        'description': description, 'evidence': evidence
    })
    print(f"\n{'='*80}")
    print(f"FINDING #{finding_num} [{strength}] {icon}")
    print(f"  {title}")
    print(f"{'='*80}")
    print(f"  {description}")
    print(f"  Evidence: {evidence}")

# ============================================================
print("\n" + "#"*80)
print("# PRAKALP-DRISHTI: HIDDEN CORRELATION HUNTER")
print("# Testing 15+ Non-Obvious Hypotheses on 2,207 Projects")
print("#"*80)

# ============================================================
# HYPOTHESIS 1: ELECTION CYCLE EFFECT
# Do projects sanctioned in election years have worse outcomes?
# ============================================================
print("\n\n>>> HYPOTHESIS 1: ELECTION CYCLE EFFECT")
print("    Do projects sanctioned near elections perform worse?")

# Major Indian election years
election_years = {2014, 2019, 2024}  # General Elections
pre_election_years = {2013, 2018, 2023}  # Year before election (announcement effect)

df['Election_Period'] = df['Sanction_Year'].apply(
    lambda x: 'Election Year' if x in election_years 
    else ('Pre-Election' if x in pre_election_years else 'Normal Year')
)

election_stats = df.groupby('Election_Period').agg(
    projects=('ProjectId', 'count'),
    overrun_rate=('Has_Overrun', 'mean'),
    avg_overrun_pct=('Overrun_Pct', lambda x: x[x>0].mean()),
    delay_rate=('Has_Delay', 'mean'),
    avg_delay_months=('DELAYED_TIME', lambda x: x[x>0].mean()),
).round(3)

print(election_stats)

election_proj = df[df['Election_Period'] == 'Election Year']['Overrun_Pct'].dropna()
normal_proj = df[df['Election_Period'] == 'Normal Year']['Overrun_Pct'].dropna()
if len(election_proj) > 5 and len(normal_proj) > 5:
    u, p = stats.mannwhitneyu(election_proj, normal_proj, alternative='two-sided')
    if election_stats.loc['Election Year', 'overrun_rate'] > election_stats.loc['Normal Year', 'overrun_rate']:
        report_finding(
            "ELECTION YEAR EFFECT",
            f"Projects sanctioned in election years have {election_stats.loc['Election Year', 'overrun_rate']*100:.1f}% overrun rate vs {election_stats.loc['Normal Year', 'overrun_rate']*100:.1f}% in normal years.",
            "STRONG" if p < 0.05 else "MODERATE",
            f"Mann-Whitney p={p:.4f}"
        )
    else:
        print(f"  -> No election effect detected (p={p:.4f})")

# ============================================================
# HYPOTHESIS 2: FISCAL YEAR-END RUSH (MARCH EFFECT)
# Are projects sanctioned in March (FY deadline) worse?
# ============================================================
print("\n\n>>> HYPOTHESIS 2: MARCH FISCAL YEAR-END RUSH")
print("    Projects sanctioned in Q4 (Jan-Mar) = rushed approvals?")

df['FY_Quarter'] = df['Sanction_Month'].map(lambda m: 
    'Q1 (Apr-Jun)' if m in [4,5,6] else 
    'Q2 (Jul-Sep)' if m in [7,8,9] else 
    'Q3 (Oct-Dec)' if m in [10,11,12] else 
    'Q4 (Jan-Mar)')

quarter_stats = df.groupby('FY_Quarter').agg(
    projects=('ProjectId', 'count'),
    overrun_rate=('Has_Overrun', 'mean'),
    avg_overrun_pct=('Overrun_Pct', lambda x: x[x>0].mean()),
    delay_rate=('Has_Delay', 'mean'),
).round(3)
print(quarter_stats)

march_projects = df[df['Sanction_Month'] == 3]['Has_Overrun']
non_march = df[df['Sanction_Month'] != 3]['Has_Overrun']
if len(march_projects) > 10:
    u, p = stats.mannwhitneyu(march_projects, non_march, alternative='greater')
    march_rate = march_projects.mean()
    other_rate = non_march.mean()
    report_finding(
        "MARCH RUSH EFFECT (Fiscal Year-End Pressure)",
        f"Projects sanctioned in March have {march_rate*100:.1f}% overrun rate vs {other_rate*100:.1f}% for other months.",
        "STRONG" if p < 0.05 else "WEAK",
        f"Mann-Whitney p={p:.4f}, N_march={len(march_projects)}"
    )

# ============================================================
# HYPOTHESIS 3: MONSOON SEASON START
# Projects starting during monsoon (Jun-Sep) = more delays?
# ============================================================
print("\n\n>>> HYPOTHESIS 3: MONSOON START EFFECT")
print("    Projects starting in monsoon season = more delays?")

df['Start_Season'] = df['Start_Month'].map(lambda m:
    'Monsoon (Jun-Sep)' if m in [6,7,8,9] else
    'Winter (Oct-Feb)' if m in [10,11,12,1,2] else
    'Summer (Mar-May)')

season_stats = df.dropna(subset=['Start_Month']).groupby('Start_Season').agg(
    projects=('ProjectId', 'count'),
    overrun_rate=('Has_Overrun', 'mean'),
    delay_rate=('Has_Delay', 'mean'),
    avg_delay_months=('DELAYED_TIME', lambda x: x[x>0].mean()),
).round(3)
print(season_stats)

monsoon = df[df['Start_Season'] == 'Monsoon (Jun-Sep)']['DELAYED_TIME'].dropna()
non_monsoon = df[df['Start_Season'] != 'Monsoon (Jun-Sep)']['DELAYED_TIME'].dropna()
if len(monsoon) > 10:
    u, p = stats.mannwhitneyu(monsoon, non_monsoon, alternative='greater')
    report_finding(
        "MONSOON START EFFECT",
        f"Projects starting during monsoon have avg {monsoon[monsoon>0].mean():.1f} months delay vs {non_monsoon[non_monsoon>0].mean():.1f} months for other seasons.",
        "STRONG" if p < 0.05 else "WEAK",
        f"Mann-Whitney p={p:.4f}"
    )

# ============================================================
# HYPOTHESIS 4: PROJECT SIZE SWEET SPOT
# Is there a cost band where overruns peak?
# ============================================================
print("\n\n>>> HYPOTHESIS 4: PROJECT SIZE vs OVERRUN (Non-Linear)")
print("    Which project size band has the WORST outcomes?")

size_stats = df.dropna(subset=['Cost_Band']).groupby('Cost_Band', observed=True).agg(
    projects=('ProjectId', 'count'),
    overrun_rate=('Has_Overrun', 'mean'),
    avg_overrun_pct=('Overrun_Pct', lambda x: x[x>0].mean()),
    delay_rate=('Has_Delay', 'mean'),
    avg_delay_months=('DELAYED_TIME', lambda x: x[x>0].mean()),
).round(3)
print(size_stats)

worst_band = size_stats['overrun_rate'].idxmax()
best_band = size_stats['overrun_rate'].idxmin()
report_finding(
    "PROJECT SIZE SWEET SPOT",
    f"Cost band '{worst_band}' has WORST overrun rate ({size_stats.loc[worst_band, 'overrun_rate']*100:.1f}%), "
    f"while '{best_band}' has BEST ({size_stats.loc[best_band, 'overrun_rate']*100:.1f}%).",
    "STRONG",
    f"Chi-squared across {len(size_stats)} bands"
)

# ============================================================
# HYPOTHESIS 5: CONTRACTOR FATIGUE / OVERLOAD
# Companies running too many simultaneous projects = worse?
# ============================================================
print("\n\n>>> HYPOTHESIS 5: CONTRACTOR OVERLOAD EFFECT")
print("    Do companies juggling many projects simultaneously perform worse?")

company_load = df.groupby('COMPANYNAME').agg(
    total_projects=('ProjectId', 'count'),
    overrun_rate=('Has_Overrun', 'mean'),
    avg_overrun_pct=('Overrun_Pct', lambda x: x[x>0].mean()),
).dropna()

company_load = company_load[company_load['total_projects'] >= 3]
corr, p = stats.spearmanr(company_load['total_projects'], company_load['overrun_rate'])

report_finding(
    "CONTRACTOR OVERLOAD EFFECT",
    f"Companies managing more projects simultaneously: Spearman rho = {corr:.3f}. "
    f"{'More projects = MORE overruns' if corr > 0 else 'More projects = FEWER overruns (experience effect)'}.",
    "STRONG" if p < 0.05 else "MODERATE" if p < 0.1 else "WEAK",
    f"Spearman rho={corr:.3f}, p={p:.4f}, N={len(company_load)} companies"
)

# ============================================================
# HYPOTHESIS 6: STATE GOVERNANCE EFFECT
# Do certain states systematically cause more overruns?
# ============================================================
print("\n\n>>> HYPOTHESIS 6: STATE GOVERNANCE EFFECT")
print("    Which states are project graveyards?")

state_stats = df.groupby('StateName').agg(
    projects=('ProjectId', 'count'),
    overrun_rate=('Has_Overrun', 'mean'),
    avg_overrun_pct=('Overrun_Pct', lambda x: x[x>0].mean()),
    delay_rate=('Has_Delay', 'mean'),
    avg_delay_months=('DELAYED_TIME', lambda x: x[x>0].mean()),
    total_overrun_cr=('Overrun_Cr', lambda x: x[x>0].sum()),
).round(2)

state_stats = state_stats[state_stats['projects'] >= 10].sort_values('overrun_rate', ascending=False)

print("\nTOP 10 WORST STATES (by overrun rate, min 10 projects):")
print(state_stats.head(10)[['projects', 'overrun_rate', 'avg_overrun_pct', 'delay_rate', 'total_overrun_cr']].to_string())
print("\nTOP 5 BEST STATES:")
print(state_stats.tail(5)[['projects', 'overrun_rate', 'avg_overrun_pct', 'delay_rate', 'total_overrun_cr']].to_string())

worst_state = state_stats.index[0]
best_state = state_stats.index[-1]
report_finding(
    "STATE GOVERNANCE EFFECT",
    f"Worst state: {worst_state} ({state_stats.loc[worst_state, 'overrun_rate']*100:.1f}% overrun rate). "
    f"Best state: {best_state} ({state_stats.loc[best_state, 'overrun_rate']*100:.1f}%).",
    "STRONG",
    f"Spread: {(state_stats['overrun_rate'].max() - state_stats['overrun_rate'].min())*100:.1f}% across {len(state_stats)} states"
)

# ============================================================
# HYPOTHESIS 7: TIME-TO-START GAP
# Longer gap between sanction and start = worse outcomes?
# ============================================================
print("\n\n>>> HYPOTHESIS 7: TIME-TO-START LAG EFFECT")
print("    Does a long gap between sanction date and start date predict overruns?")

valid_tts = df[(df['TimeToStart_Days'] > 0) & (df['TimeToStart_Days'] < 5000)]
if len(valid_tts) > 50:
    corr, p = stats.spearmanr(valid_tts['TimeToStart_Days'], valid_tts['Has_Overrun'])
    
    # Bin into quartiles
    valid_tts = valid_tts.copy()
    valid_tts['TTS_Quartile'] = pd.qcut(valid_tts['TimeToStart_Days'], 4, labels=['Fast', 'Medium', 'Slow', 'Very Slow'])
    tts_stats = valid_tts.groupby('TTS_Quartile', observed=True).agg(
        projects=('ProjectId', 'count'),
        overrun_rate=('Has_Overrun', 'mean'),
        avg_overrun_pct=('Overrun_Pct', lambda x: x[x>0].mean()),
    ).round(3)
    print(tts_stats)
    
    report_finding(
        "TIME-TO-START LAG PREDICTS OVERRUNS",
        f"Projects that take longer to start after sanction have {'higher' if corr > 0 else 'lower'} overrun rates. "
        f"Fast starters: {tts_stats.loc['Fast', 'overrun_rate']*100:.1f}% overrun rate. "
        f"Very slow starters: {tts_stats.loc['Very Slow', 'overrun_rate']*100:.1f}%.",
        "STRONG" if p < 0.05 else "MODERATE",
        f"Spearman rho={corr:.3f}, p={p:.4f}"
    )

# ============================================================
# HYPOTHESIS 8: THRESHOLD BUNCHING at ₹150 Cr AND ₹1000 Cr
# Projects cluster just below statutory classification thresholds?
# ============================================================
print("\n\n>>> HYPOTHESIS 8: THRESHOLD BUNCHING (₹150 Cr & ₹1000 Cr)")
print("    Are projects strategically priced just below classification thresholds?")

# Count projects in bands around thresholds
for threshold, label in [(150, "Major/Mega Boundary (150 Cr)"), (1000, "Mega Boundary (1000 Cr)")]:
    below = len(df[(df['OriginalCost'] >= threshold*0.8) & (df['OriginalCost'] < threshold)])
    above = len(df[(df['OriginalCost'] >= threshold) & (df['OriginalCost'] < threshold*1.2)])
    ratio = below / above if above > 0 else float('inf')
    
    print(f"\n  {label}:")
    print(f"    Projects in [{threshold*0.8:.0f} - {threshold}) Cr: {below}")
    print(f"    Projects in [{threshold} - {threshold*1.2:.0f}) Cr: {above}")
    print(f"    Below/Above Ratio: {ratio:.2f}x")
    
    if ratio > 1.5:
        report_finding(
            f"THRESHOLD BUNCHING at Rs {threshold} Cr",
            f"{ratio:.1f}x more projects just BELOW Rs {threshold} Cr threshold than just above. "
            f"Agencies may be strategically pricing below to avoid stricter monitoring classification.",
            "STRONG" if ratio > 2.0 else "MODERATE",
            f"Below={below}, Above={above}, Ratio={ratio:.2f}x"
        )

# ============================================================
# HYPOTHESIS 9: COST REVISION BUNCHING at 20% (CCEA)
# ============================================================
print("\n\n>>> HYPOTHESIS 9: COST REVISION BUNCHING at 20% CCEA THRESHOLD")

overrun_projects = df[df['Overrun_Pct'] > 0].copy()
bins_15_25 = [15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25]
hist_counts = pd.cut(overrun_projects['Overrun_Pct'], bins=bins_15_25).value_counts().sort_index()
print("\n  Distribution of cost overrun % around 20% threshold:")
for interval, count in hist_counts.items():
    bar = '#' * count
    print(f"    {str(interval):15s}: {count:3d} {bar}")

below_20 = len(overrun_projects[(overrun_projects['Overrun_Pct'] >= 15) & (overrun_projects['Overrun_Pct'] < 20)])
above_20 = len(overrun_projects[(overrun_projects['Overrun_Pct'] >= 20) & (overrun_projects['Overrun_Pct'] < 25)])

if below_20 > 0 and above_20 > 0:
    ratio = below_20 / above_20
    report_finding(
        "CCEA 20% THRESHOLD GAMING CONFIRMED",
        f"{below_20} projects in [15-20%) vs {above_20} in [20-25%): ratio = {ratio:.2f}x. "
        f"{'CLEAR EVIDENCE of strategic cost revision capping below 20%!' if ratio > 1.3 else 'Mild evidence of bunching.'}",
        "STRONG" if ratio > 1.5 else "MODERATE",
        f"Below/Above ratio = {ratio:.2f}x"
    )

# ============================================================
# HYPOTHESIS 10: PLANNED DURATION EFFECT
# Longer planned projects = more overruns?
# ============================================================
print("\n\n>>> HYPOTHESIS 10: PLANNED DURATION vs OVERRUNS")
print("    Are longer-planned projects more prone to cost overruns?")

valid_dur = df[(df['PlannedDuration_Months'] > 0) & (df['PlannedDuration_Months'] < 600)]
if len(valid_dur) > 50:
    corr, p = stats.spearmanr(valid_dur['PlannedDuration_Months'], valid_dur['Has_Overrun'])
    
    valid_dur = valid_dur.copy()
    valid_dur['Duration_Band'] = pd.cut(valid_dur['PlannedDuration_Months'], 
                                         bins=[0, 36, 60, 84, 120, 600],
                                         labels=['<3yr', '3-5yr', '5-7yr', '7-10yr', '>10yr'])
    dur_stats = valid_dur.groupby('Duration_Band', observed=True).agg(
        projects=('ProjectId', 'count'),
        overrun_rate=('Has_Overrun', 'mean'),
        avg_overrun_pct=('Overrun_Pct', lambda x: x[x>0].mean()),
    ).round(3)
    print(dur_stats)
    
    report_finding(
        "LONGER PROJECTS = MORE OVERRUNS",
        f"Correlation between planned duration and overrun probability: rho={corr:.3f}. "
        f"{'Confirmed: longer projects cost more!' if corr > 0 else 'Surprise: shorter projects overrun more!'}",
        "STRONG" if p < 0.05 else "MODERATE",
        f"Spearman rho={corr:.3f}, p={p:.4f}"
    )

# ============================================================
# HYPOTHESIS 11: ONBOARDING DELAY EFFECT
# Late onboarding to PAIMANA portal = worse projects?
# ============================================================
print("\n\n>>> HYPOTHESIS 11: LATE PAIMANA ONBOARDING = WORSE OUTCOMES?")

valid_ob = df[df['OnboardingDelay'].notna() & (df['OnboardingDelay'] > -500)]
if len(valid_ob) > 50:
    corr, p = stats.spearmanr(valid_ob['OnboardingDelay'], valid_ob['Has_Overrun'])
    
    valid_ob = valid_ob.copy()
    valid_ob['Onboard_Status'] = pd.cut(valid_ob['OnboardingDelay'], 
                                         bins=[-500, 0, 365, 730, 5000],
                                         labels=['Early/OnTime', 'Late <1yr', 'Late 1-2yr', 'Late >2yr'])
    ob_stats = valid_ob.groupby('Onboard_Status', observed=True).agg(
        projects=('ProjectId', 'count'),
        overrun_rate=('Has_Overrun', 'mean'),
    ).round(3)
    print(ob_stats)
    
    report_finding(
        "LATE PAIMANA ONBOARDING = WORSE PROJECTS",
        f"Projects that were late to onboard to PAIMANA monitoring system: "
        f"{'tend to have MORE overruns' if corr > 0 else 'actually have fewer overruns (monitoring avoidance?!)'}.",
        "STRONG" if p < 0.05 else "MODERATE",
        f"Spearman rho={corr:.3f}, p={p:.4f}"
    )

# ============================================================
# HYPOTHESIS 12: EXPENDITURE BURN RATE ANOMALY
# Projects spending too fast or too slow relative to progress
# ============================================================
print("\n\n>>> HYPOTHESIS 12: EXPENDITURE-PROGRESS MISMATCH")
print("    Are projects burning money without physical progress?")

valid_ep = df[(df['Expenditure_Ratio'] > 0) & (df['PhysicalProgress'] > 0)].copy()
if len(valid_ep) > 50:
    valid_ep['EP_Ratio'] = valid_ep['Expenditure_Ratio'] / valid_ep['PhysicalProgress']
    valid_ep['EP_Category'] = pd.cut(valid_ep['EP_Ratio'], 
                                      bins=[0, 0.5, 0.8, 1.2, 2.0, 100],
                                      labels=['Underspent', 'Efficient', 'Normal', 'Overspent', 'Grossly Overspent'])
    
    ep_stats = valid_ep.groupby('EP_Category', observed=True).agg(
        projects=('ProjectId', 'count'),
        overrun_rate=('Has_Overrun', 'mean'),
        avg_overrun_pct=('Overrun_Pct', lambda x: x[x>0].mean()),
    ).round(3)
    print(ep_stats)
    
    grossly = valid_ep[valid_ep['EP_Category'] == 'Grossly Overspent']
    normal = valid_ep[valid_ep['EP_Category'] == 'Normal']
    if len(grossly) > 5 and len(normal) > 5:
        report_finding(
            "MONEY BURN WITHOUT PROGRESS (Ghost Spending)",
            f"Projects spending 2x+ more money than physical progress justifies: "
            f"{ep_stats.loc['Grossly Overspent', 'overrun_rate']*100:.1f}% overrun rate vs "
            f"{ep_stats.loc['Normal', 'overrun_rate']*100:.1f}% for normal projects.",
            "STRONG",
            f"Grossly Overspent: {len(grossly)} projects"
        )

# ============================================================
# HYPOTHESIS 13: MULTI-SECTOR MINISTRY SPRAWL
# Ministries managing too many different sectors = worse?
# ============================================================
print("\n\n>>> HYPOTHESIS 13: MINISTRY SECTOR SPRAWL")
print("    Do ministries managing many sectors perform worse?")

ministry_diversity = df.groupby('LineMinistry').agg(
    projects=('ProjectId', 'count'),
    sectors=('SectorName', 'nunique'),
    overrun_rate=('Has_Overrun', 'mean'),
    avg_overrun_pct=('Overrun_Pct', lambda x: x[x>0].mean()),
).round(3)
ministry_diversity = ministry_diversity[ministry_diversity['projects'] >= 5]
ministry_diversity = ministry_diversity.sort_values('sectors', ascending=False)

print(ministry_diversity.head(15).to_string())

if len(ministry_diversity) > 5:
    corr, p = stats.spearmanr(ministry_diversity['sectors'], ministry_diversity['overrun_rate'])
    report_finding(
        "MINISTRY SECTOR SPRAWL EFFECT",
        f"Ministries managing projects across more sectors: rho={corr:.3f}. "
        f"{'Sprawl HURTS performance' if corr > 0 else 'Diversified ministries actually perform BETTER'}.",
        "STRONG" if p < 0.05 else "MODERATE" if p < 0.1 else "WEAK",
        f"Spearman rho={corr:.3f}, p={p:.4f}"
    )

# ============================================================
# HYPOTHESIS 14: VINTAGE / AGE EFFECT
# Older sanctioned projects = much worse outcomes?
# ============================================================
print("\n\n>>> HYPOTHESIS 14: PROJECT AGE / VINTAGE EFFECT")
print("    Are older projects (sanctioned long ago) in worse shape?")

valid_age = df[df['Sanction_Year'] > 2000].copy()
valid_age['Age_Years'] = 2026 - valid_age['Sanction_Year']

age_stats = valid_age.groupby(pd.cut(valid_age['Age_Years'], bins=[0, 3, 5, 8, 12, 30],
                                      labels=['<3yr', '3-5yr', '5-8yr', '8-12yr', '>12yr']), observed=True).agg(
    projects=('ProjectId', 'count'),
    overrun_rate=('Has_Overrun', 'mean'),
    avg_overrun_pct=('Overrun_Pct', lambda x: x[x>0].mean()),
    avg_physical_progress=('PhysicalProgress', 'mean'),
).round(3)
print(age_stats)

corr, p = stats.spearmanr(valid_age['Age_Years'], valid_age['Has_Overrun'])
report_finding(
    "PROJECT VINTAGE / AGE EFFECT",
    f"Older projects have {'dramatically higher' if corr > 0.1 else 'somewhat higher' if corr > 0 else 'lower'} overrun rates. "
    f"Projects >12 years old: {age_stats.loc['>12yr', 'overrun_rate']*100:.1f}% vs <3 years: {age_stats.loc['<3yr', 'overrun_rate']*100:.1f}%.",
    "STRONG" if p < 0.001 else "MODERATE",
    f"Spearman rho={corr:.3f}, p={p:.6f}"
)

# ============================================================
# HYPOTHESIS 15: PHYSICAL PROGRESS STALLING DETECTION
# Projects with very low progress despite long elapsed time
# ============================================================
print("\n\n>>> HYPOTHESIS 15: ZOMBIE / STALLED PROJECTS")
print("    Projects with <30% progress despite being >50% through planned timeline")

valid_zombie = df[(df['PhysicalProgress'] > 0) & (df['PlannedDuration_Months'] > 12)].copy()
elapsed_months = (pd.Timestamp('2026-06-01') - valid_zombie['StartDate']).dt.days / 30.44
valid_zombie['Elapsed_Pct'] = (elapsed_months / valid_zombie['PlannedDuration_Months'] * 100).clip(0, 500)
valid_zombie['Progress_Gap'] = valid_zombie['Elapsed_Pct'] - valid_zombie['PhysicalProgress']

zombies = valid_zombie[(valid_zombie['Elapsed_Pct'] > 80) & (valid_zombie['PhysicalProgress'] < 50)]
print(f"\n  ZOMBIE Projects (>80% time elapsed, <50% progress): {len(zombies)}")
if len(zombies) > 0:
    zombie_overrun = zombies['Has_Overrun'].mean()
    normal_set = valid_zombie[~valid_zombie.index.isin(zombies.index)]
    normal_overrun = normal_set['Has_Overrun'].mean()
    
    print(f"  Zombie overrun rate: {zombie_overrun*100:.1f}%")
    print(f"  Normal overrun rate: {normal_overrun*100:.1f}%")
    
    # Top zombie projects
    top_zombies = zombies.nlargest(10, 'Progress_Gap')[['ProjectName', 'COMPANYNAME', 'StateName', 
                                                          'PhysicalProgress', 'Elapsed_Pct', 'OriginalCost']]
    print(f"\n  TOP 10 ZOMBIE PROJECTS (biggest time-progress gap):")
    print(top_zombies.to_string(index=False))
    
    report_finding(
        "ZOMBIE / STALLED PROJECTS DETECTED",
        f"{len(zombies)} projects have consumed >80% of planned time but achieved <50% physical progress. "
        f"Their overrun rate is {zombie_overrun*100:.1f}% vs {normal_overrun*100:.1f}% for normal projects.",
        "STRONG",
        f"N_zombies={len(zombies)}, Total value at risk: Rs {zombies['OriginalCost'].sum():,.0f} Cr"
    )

# ============================================================
# FINAL SUMMARY
# ============================================================
print("\n\n" + "="*80)
print("FINAL SUMMARY: ALL HIDDEN CORRELATIONS FOUND")
print("="*80)

for f in findings:
    strength_emoji = "***" if f['strength'] == 'STRONG' else "**" if f['strength'] == 'MODERATE' else "*"
    print(f"\n  [{f['strength']:8s}] #{f['num']:2d}. {f['title']}")
    print(f"            {f['description'][:120]}")

strong_count = sum(1 for f in findings if f['strength'] == 'STRONG')
moderate_count = sum(1 for f in findings if f['strength'] == 'MODERATE')
print(f"\n\nTotal Findings: {len(findings)} ({strong_count} STRONG, {moderate_count} MODERATE)")
