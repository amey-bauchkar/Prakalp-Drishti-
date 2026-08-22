import json

with open('SIH_2026_Software_Problem_Statements.json', 'r', encoding='utf-8') as f:
    ps_list = json.load(f)

# Let's inspect unique ministries / organizations and their PS
ministry_ps = {}
for ps in ps_list:
    org = ps.get('organization') or 'Other'
    if 'Student Innovation' not in str(ps.get('title')):
        if org not in ministry_ps:
            ministry_ps[org] = []
        ministry_ps[org].append(ps)

for org, items in ministry_ps.items():
    print(f"=== {org} ({len(items)} PS) ===")
    for p in items:
        print(f"  [{p.get('ps_id')}] {p.get('title')}")
    print()
