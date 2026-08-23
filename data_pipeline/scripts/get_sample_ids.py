import pandas as pd
import sys
sys.stdout.reconfigure(encoding='utf-8')

df = pd.read_csv('paimana_extracted/PAIMANA_MASTER_PROJECTS_DATABASE.csv')
df['OriginalCost'] = pd.to_numeric(df['OriginalCost'], errors='coerce').fillna(0)
df['RevisedCost'] = pd.to_numeric(df['RevisedCost'], errors='coerce').fillna(df['OriginalCost'])
df['DELAYED_TIME'] = pd.to_numeric(df['DELAYED_TIME'], errors='coerce').fillna(0)
df['PhysicalProgress'] = pd.to_numeric(df['PhysicalProgress'], errors='coerce').fillna(0)

print("--- SPECIFIC ICONIC PROJECTS FOR DEMO ---")
queries = ['GPRA', 'Dedicated Freight Corridor', 'High Speed Rail', 'Refinery', 'Brahmaputra', 'Guwahati', 'Metro', 'Expressway', 'Thermal']
for q in queries:
    m = df[df['ProjectName'].str.contains(q, case=False, na=False)].head(2)
    for _, r in m.iterrows():
        print(f"[{q}] ID: `{r['ProjectId']}` | ₹{r['RevisedCost']:,.0f} Cr | {r['PhysicalProgress']:.0f}% Done | {r['SectorName']} | {r['ProjectName']}")
