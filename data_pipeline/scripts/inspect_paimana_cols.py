import pandas as pd
df = pd.read_csv("paimana_extracted/PAIMANA_MASTER_PROJECTS_DATABASE.csv")
print("Total rows:", len(df))
print("Sector values in DB:")
print(df["SectorName"].value_counts().head(10))
print("\nNon-null count for key columns:")
for c in ['StartDate', 'SanctionDate', 'DELAYED_TIME', 'OriginalCost', 'RevisedCost', 'StateName', 'SectorName']:
    if c in df.columns:
        print(f"  {c}: {df[c].notna().sum()} / {len(df)}")
