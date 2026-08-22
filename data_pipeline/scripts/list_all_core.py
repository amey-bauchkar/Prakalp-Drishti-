import json

with open('SIH_2026_Software_Problem_Statements.json', 'r', encoding='utf-8') as f:
    ps_list = json.load(f)

# Exclude student innovation open tracks (last 17)
ps_core = [p for p in ps_list if 'Student Innovation' not in str(p.get('title'))]

print(f"Total Core Problem Statements: {len(ps_core)}")

# Let's inspect all problem statements grouped by ministry
for i, ps in enumerate(ps_core):
    pid = ps.get('ps_id')
    org = ps.get('organization')
    theme = ps.get('theme')
    title = ps.get('title')
    print(f"[{pid}] | {org} | {title}")
