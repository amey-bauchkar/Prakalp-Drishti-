import json

with open('SIH_2026_Software_Problem_Statements.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

for d in data:
    idx = d.get('index', '')
    ps_id = d.get('ps_id', '')
    title = d.get('title', '')
    org = d.get('organization', '')
    theme = d.get('theme', '')
    desc = d.get('description_text', '')[:200]
    print(f"{idx}|{ps_id}|{title}|{org}|{theme}|{desc}")
