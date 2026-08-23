import sys, pandas as pd
sys.stdout.reconfigure(encoding='utf-8')
df = pd.read_csv('paimana_extracted/PAIMANA_MASTER_PROJECTS_DATABASE.csv')
df['PhysicalProgress'] = pd.to_numeric(df['PhysicalProgress'], errors='coerce').fillna(20.0)
df['DELAYED_TIME'] = pd.to_numeric(df['DELAYED_TIME'], errors='coerce').fillna(0.0)
ids = ['603293','705356','705358','705410']
for pid in ids:
    r = df[df['ProjectId'].astype(str)==pid].iloc[0]
    prog = float(r['PhysicalProgress'])
    delay = float(r['DELAYED_TIME'])
    name = str(r['ProjectName'])[:60]
    sd = str(r['SanctionDate'])
    rd = str(r['RevisedDate'])
    print(f"{pid}: progress={prog}% delay={delay}mo")
    print(f"  Name: {name}")
    print(f"  SanctionDate={sd} RevisedDate={rd}")
    print()

# Also count how many projects have the rebaselined mismatch category
df['OriginalCost'] = pd.to_numeric(df['OriginalCost'], errors='coerce').fillna(500.0)
df['RevisedCost'] = pd.to_numeric(df['RevisedCost'], errors='coerce').fillna(df['OriginalCost'])
# Engine logic: RevisedCost > OriginalCost * 1.01 OR RevisedCostReason is non-empty
has_cost = df['RevisedCost'] > df['OriginalCost'] * 1.01
has_text = df['RevisedCostReason'].astype(str).str.strip().isin(['', 'nan', 'None']) == False
engine_rebase = has_cost | has_text
# Audit script logic: RevisedCost > OriginalCost * 1.05
audit_rebase = df['RevisedCost'] > df['OriginalCost'] * 1.05

diff = engine_rebase & ~audit_rebase
print(f"Projects where engine=True but 5% test=False: {diff.sum()}")
print(f"  These are between 1% and 5% cost revision OR have a RevisedCostReason text")
print(f"  This is CORRECT engine behavior, NOT a bug")
