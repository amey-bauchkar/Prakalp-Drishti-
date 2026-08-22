import json

with open('SIH_2026_Software_Problem_Statements.json', 'r', encoding='utf-8') as f:
    ps_list = json.load(f)

# Let's inspect each PS title, organization, theme, and description
for i, ps in enumerate(ps_list):
    pid = ps.get('ps_id')
    org = ps.get('organization')
    theme = ps.get('theme')
    title = ps.get('title')
    desc = ps.get('description_text') or ''
    
    # Filter out student innovation open tracks (SIH26193-SIH26209)
    if 'Student Innovation' in str(title):
        continue
    
    print(f"[{pid}] | {org} | {theme}")
    print(f"   Title: {title}")
    print(f"   Summary: {desc[:200].strip()}...\n")
