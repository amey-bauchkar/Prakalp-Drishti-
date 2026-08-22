import json

with open('SIH_2026_Software_Problem_Statements.json', 'r', encoding='utf-8') as f:
    ps_list = json.load(f)

# Let's search and display specific high-potential problem statements
selected_ids = ['SIH26103', 'SIH26006', 'SIH26017', 'SIH26016', 'SIH26143', 'SIH26184', 'SIH26189', 'SIH26162', 'SIH26165', 'SIH26002', 'SIH26009', 'SIH26071', 'SIH26072', 'SIH26085', 'SIH26086', 'SIH26095', 'SIH26096']

for ps in ps_list:
    pid = ps.get('ps_id')
    if pid in selected_ids or any(k in str(ps.get('title')).lower() for k in ['coal', 'power', 'freight', 'paimana', 'oil spill', 'land acquisition', 'cybercrime']):
        if 'Student Innovation' not in str(ps.get('title')):
            print(f"================================================================================")
            print(f"ID: {pid} | Org: {ps.get('organization')} | Theme: {ps.get('theme')}")
            print(f"Title: {ps.get('title')}")
            print(f"Description:\n{ps.get('description_text')[:500]}...\n")
