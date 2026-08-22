import json
import re

with open('SIH_2026_Software_Problem_Statements.json', 'r', encoding='utf-8') as f:
    ps_list = json.load(f)

print(f"Total Problem Statements Loaded: {len(ps_list)}\n")

# Let's inspect all problem statements
for i, ps in enumerate(ps_list):
    pid = ps.get('ps_id') or 'N/A'
    org = ps.get('organization') or 'N/A'
    theme = ps.get('theme') or 'N/A'
    title = ps.get('title') or 'N/A'
    desc = ps.get('description_text') or ''
    
    # Check for keywords that indicate great, sweet-spot problems:
    # High-impact government, supply chain, predictive, data-heavy, optimization, satellite/geospatial, finance, legal, energy
    print(f"{i+1:3d}. [{pid}] | {org[:35]:35s} | {theme[:20]:20s} | {title[:65]}")
