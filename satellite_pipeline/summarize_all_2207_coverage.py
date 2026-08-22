"""
Generate Sector-wise and State-wise Satellite Coverage Summary for all 2,207 projects.
"""

import pandas as pd
import json

df = pd.read_csv("paimana_extracted/satellite_data/ALL_2207_PROJECTS_SATELLITE_CATALOG.csv")

print("=" * 80)
print(f"🛰️ TOTAL PROJECTS WITH SATELLITE COVERAGE: {len(df):,}")
print("=" * 80)

print("\n📊 SECTOR-WISE BREAKDOWN:")
sector_counts = df['sector'].value_counts()
for sec, cnt in sector_counts.items():
    print(f"  • {sec}: {cnt:,} projects")

print("\n🗺️ SAMPLE PROJECTS ACROSS DIFFERENT STATES:")
sample_states = ["Jammu and Kashmir", "Kerala", "Assam", "Maharashtra", "Tamil Nadu", "Gujarat", "West Bengal", "Odisha"]
for st in sample_states:
    sub = df[df['project_name'].str.contains(st, case=False, na=False) | (df['state'].str.contains(st, case=False, na=False) if 'state' in df.columns else False)]
    if len(sub) > 0:
        row = sub.iloc[0]
        print(f"  [{st}] Project #{row['project_id']}: {row['project_name'][:55]}...")
        print(f"         GPS: ({row['latitude']}, {row['longitude']}) | Satellite Tile: {row['tile_current_2023']}")

