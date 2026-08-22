"""
PRAKALP-DRISHTI: Contractor & Agency Canonical Entity Resolution Engine
Resolves raw company/agency strings (e.g. 'NHAI', 'National Highways Authority of India [NHAI]',
'Power Grid Corporation of India Limited [POWERGRID]') into unified canonical legal entities.
"""

import os
import re
import json
import pandas as pd

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_PATH = os.path.join(BASE_DIR, "paimana_extracted", "PAIMANA_MASTER_PROJECTS_DATABASE.csv")
OUTPUT_MAPPING_PATH = os.path.join(BASE_DIR, "paimana_extracted", "CANONICAL_ENTITIES_MAPPING.json")

# Rule-based / Canonical dictionary mappings for major Indian infrastructure entities
CANONICAL_RULES = [
    (r"(?i)\b(nhai|national\s*highways\s*authority\s*of\s*india)\b", "NHAI", "National Highways Authority of India", "Roads & Highways", "Central PSU"),
    (r"(?i)\b(morth|ministry\s*of\s*road\s*transport)\b", "MoRTH", "Ministry of Road Transport and Highways", "Roads & Highways", "Central Ministry"),
    (r"(?i)\b(nhidcl|national\s*highways\s*and\s*infra.*development)\b", "NHIDCL", "National Highways & Infrastructure Development Corp", "Roads & Highways", "Central PSU"),
    (r"(?i)\b(powergrid|power\s*grid\s*corp.*india)\b", "POWERGRID", "Power Grid Corporation of India Limited", "Power & Transmission", "Maharatna PSU"),
    (r"(?i)\b(ntpc|national\s*thermal\s*power)\b", "NTPC", "NTPC Limited", "Power & Thermal", "Maharatna PSU"),
    (r"(?i)\b(cil|coal\s*india|wcl|secl|ecl|ccl|mcl|bcc|ncl\s*-\s*cil)\b", "COAL_INDIA", "Coal India Limited & Subsidiaries", "Coal & Mining", "Maharatna PSU"),
    (r"(?i)\b(railway|ecor|ecr|scr|nwr|sr|nr|wr|cr|ner|nfr|ser|swr|wcr|secr|rvnl|ircon|dfccil|krcl)\b", "INDIAN_RAILWAYS", "Ministry of Railways / Executing PSUs", "Railways", "Central Ministry & PSUs"),
    (r"(?i)\b(petroleum|gas|png|ongc|iocl|gail|hpcl|bpcl|oil\s*india)\b", "PETROLEUM_GAS", "Ministry of Petroleum & Natural Gas / OMCs", "Petroleum & Natural Gas", "Central Ministry & PSUs"),
    (r"(?i)\b(airport|aai|airports\s*authority)\b", "AAI", "Airports Authority of India", "Civil Aviation", "Central PSU"),
    (r"(?i)\b(health|medical\s*education|aiims)\b", "MOHFW", "Ministry of Health and Family Welfare", "Healthcare & Institutions", "Central Ministry"),
    (r"(?i)\b(housing|urban\s*affairs|mohua|cpwd|nbcc)\b", "MOHUA", "Ministry of Housing and Urban Affairs", "Urban Infrastructure", "Central Ministry & PSUs"),
    (r"(?i)\b(shipping|ports|inland\s*waterways|iwai|jnpa|vpa|cochin\s*shipyard)\b", "PORTS_SHIPPING", "Ministry of Ports, Shipping and Waterways", "Ports & Shipping", "Central Ministry & PSUs"),
    (r"(?i)\b(steel|sail|rinl|nmcd)\b", "STEEL_MINISTRY", "Ministry of Steel / Steel Authority of India", "Steel & Metals", "Maharatna PSU"),
    (r"(?i)\b(atomic\s*energy|npcil|dae)\b", "NPCIL", "Nuclear Power Corporation of India", "Nuclear Energy", "Central PSU"),
    (r"(?i)\b(telecom|bsnl|bbnl|dot)\b", "TELECOM_DOT", "Department of Telecommunications / BSNL", "Telecommunications", "Central PSU"),
    (r"(?i)\b(water\s*resources|jal\s*shakti|cwc|wrd)\b", "JAL_SHAKTI", "Ministry of Jal Shakti", "Water & Irrigation", "Central Ministry"),
]

def canonicalize_entity(raw_name: str) -> dict:
    if not isinstance(raw_name, str) or not raw_name.strip():
        return {
            "canonical_id": "OTHER_UNSPECIFIED",
            "canonical_name": "Other Unspecified Executing Agency",
            "sector": "General Infrastructure",
            "entity_type": "Government Entity",
            "raw_name": ""
        }
    
    cleaned = raw_name.strip()
    
    for pattern, canon_id, canon_name, sector, entity_type in CANONICAL_RULES:
        if re.search(pattern, cleaned):
            return {
                "canonical_id": canon_id,
                "canonical_name": canon_name,
                "sector": sector,
                "entity_type": entity_type,
                "raw_name": cleaned
            }
            
    # Fallback slugification
    fallback_id = re.sub(r"[^A-Za-z0-9]+", "_", cleaned).strip("_").upper()[:30]
    return {
        "canonical_id": fallback_id,
        "canonical_name": cleaned,
        "sector": "Infrastructure",
        "entity_type": "Executing Entity",
        "raw_name": cleaned
    }

def run_entity_resolution():
    print(f"Loading master projects database from: {DATA_PATH}")
    df = pd.read_csv(DATA_PATH)
    
    raw_companies = df["COMPANYNAME"].dropna().unique().tolist()
    print(f"Total raw company/agency variations in database: {len(raw_companies)}")
    
    mapping = {}
    canonical_clusters = {}
    
    for raw in raw_companies:
        res = canonicalize_entity(raw)
        mapping[raw] = res
        cid = res["canonical_id"]
        if cid not in canonical_clusters:
            canonical_clusters[cid] = {
                "canonical_id": cid,
                "canonical_name": res["canonical_name"],
                "sector": res["sector"],
                "entity_type": res["entity_type"],
                "raw_variations": []
            }
        canonical_clusters[cid]["raw_variations"].append(raw)
        
    print(f"Resolved {len(raw_companies)} raw strings into {len(canonical_clusters)} canonical legal entities!")
    
    # Save mapping JSON
    with open(OUTPUT_MAPPING_PATH, "w", encoding="utf-8") as f:
        json.dump({
            "total_raw_entities": len(raw_companies),
            "total_canonical_entities": len(canonical_clusters),
            "mapping_by_raw_string": mapping,
            "canonical_clusters": canonical_clusters
        }, f, indent=2)
        
    print(f"Saved canonical entity mapping to: {OUTPUT_MAPPING_PATH}")
    
    # Summary of Top Canonical Entities by project count
    df["CANONICAL_ENTITY"] = df["COMPANYNAME"].map(lambda x: mapping.get(x, {}).get("canonical_id", "OTHER_UNSPECIFIED"))
    print("\nTop 10 Canonical Entities by Project Count:")
    print(df["CANONICAL_ENTITY"].value_counts().head(10))
    
    return mapping

if __name__ == "__main__":
    run_entity_resolution()
