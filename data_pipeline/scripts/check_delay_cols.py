import pandas as pd
df = pd.read_csv("paimana_extracted/PAIMANA_MASTER_PROJECTS_DATABASE.csv")
print("Columns with 'delay' or 'time':")
for c in df.columns:
    if any(k in c.lower() for k in ['delay', 'time', 'date', 'cost', 'month']):
        print(f"  {c}: non-zero count = {(pd.to_numeric(df[c], errors='coerce') > 0).sum()} / {len(df)}")
