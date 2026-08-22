import json

with open('SIH_2026_Software_Problem_Statements.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Print condensed but complete info for ALL PS
for d in data:
    idx = d.get('index', '')
    ps_id = d.get('ps_id', '')
    title = d.get('title', '')
    org = d.get('organization', '')
    theme = d.get('theme', '')
    dept = d.get('department', '')
    desc = d.get('description_text', '')
    
    # Skip Student Innovation (open-ended, no specific PS)
    if title == 'Student Innovation':
        continue
    
    print(f"[{idx}] {ps_id} | {title}")
    print(f"    Org: {org} | Dept: {dept}")
    print(f"    Theme: {theme}")
    print(f"    Desc: {desc[:300]}")
    print("---")
