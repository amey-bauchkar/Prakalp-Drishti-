import json

with open('SIH_2026_Software_Problem_Statements.json', 'r', encoding='utf-8') as f:
    ps_list = json.load(f)

# Group by ministry / organization
orgs = {}
for ps in ps_list:
    org = ps.get('organization') or 'Unknown'
    orgs[org] = orgs.get(org, 0) + 1

print("=== ORGANIZATIONS & COUNT ===")
for org, count in sorted(orgs.items(), key=lambda x: -x[1]):
    print(f"  {org}: {count} PS")

print("\n" + "="*80)
print("=== CANDIDATE PROBLEM STATEMENTS (MINISTRY-BACKED, HIGH-IMPACT, DATA-RICH) ===")
print("="*80)

# Filter for strong candidates across diverse domains
for i, ps in enumerate(ps_list):
    pid = ps.get('ps_id')
    org = ps.get('organization')
    theme = ps.get('theme')
    title = ps.get('title')
    desc = ps.get('description_text') or ''
    
    # We want to identify top contenders across:
    # 1. Ministry of Steel / Logistics / Shipping / Freight (SIH26006)
    # 2. Ministry of Rural Development / Land Acquisition & Delay Prediction (SIH26016, SIH26017)
    # 3. Ministry of Power / Grid / Renewable / Energy (Check IDs)
    # 4. Ministry of Coal / Mining
    # 5. Ministry of Railways
    # 6. Ministry of Finance / Tax / Banking / Fraud (MHA / NTRO / Crypto)
    # 7. MoSPI / PAIMANA (SIH26103)
    # 8. Jal Shakti / Water Resources
    # 9. NTRO / Cyber / Aviation
    
    keywords = ['freight', 'procurement', 'land acquisition', 'delay', 'infrastructure', 'energy', 'coal', 'power', 'paimana', 'supply chain', 'trade', 'logistics', 'railway', 'vessel', 'cargo', 'grid', 'water', 'disaster', 'fraud', 'crypto', 'surveillance']
    
    if any(k in title.lower() or k in desc.lower() for k in keywords):
        if 'Student Innovation' not in title:
            print(f"[{pid}] {org} ({theme})")
            print(f"   Title: {title}")
            print(f"   Desc: {desc[:250].strip()}...\n")
