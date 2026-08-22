import json

with open('SIH_2026_Software_Problem_Statements.json', 'r', encoding='utf-8') as f:
    ps_list = json.load(f)

# Print first 100 PS
for i, p in enumerate(ps_list[:100]):
    pid = p.get('ps_id')
    org = p.get('organization')
    title = p.get('title')
    print(f"{i+1:3d}. [{pid}] | {org[:30]:30s} | {title[:60]}")
