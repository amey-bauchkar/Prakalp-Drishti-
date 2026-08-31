import os
import sys
import json
import sqlite3
import random
import hashlib
import pandas as pd

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
CSV_PATH = os.path.join(REPO_ROOT, "paimana_extracted", "PAIMANA_MASTER_PROJECTS_DATABASE.csv")
DB_PATH = os.path.join(REPO_ROOT, "modules", "aditya", "data", "raw", "prakalp_drishti_raw.db")
OUT_JSON = os.path.join(REPO_ROOT, "paimana_extracted", "PARIVESH_2207_CLEARANCES.json")

STATE_CODES = {
    "Maharashtra": "MH", "Uttar Pradesh": "UP", "Madhya Pradesh": "MP", "Bihar": "BR",
    "Karnataka": "KA", "Gujarat": "GJ", "Andhra Pradesh": "AP", "Tamil Nadu": "TN",
    "West Bengal": "WB", "Rajasthan": "RJ", "Odisha": "OD", "Assam": "AS",
    "Jharkhand": "JH", "Telangana": "TG", "Kerala": "KL", "Chhattisgarh": "CG",
    "Punjab": "PB", "Haryana": "HR", "Jammu & Kashmir": "JK", "Uttarakhand": "UK",
    "Himachal Pradesh": "HP", "Manipur": "MN", "Meghalaya": "ML", "Nagaland": "NL",
    "Mizoram": "MZ", "Tripura": "TR", "Arunachal Pradesh": "AR", "Goa": "GA",
    "Delhi": "DL", "Sikkim": "SK", "Puducherry": "PY", "Chandigarh": "CH", "Ladakh": "LA"
}

SECTOR_CODES = {
    "Roads & Highways": "ROAD", "Railways": "RAIL", "Coal": "COAL", "Oil & Gas": "PET",
    "Transmission & Distribution": "TRANS", "Healthcare": "HLTH", "Water Resources": "WR",
    "Electricity Generation": "PWR", "Education": "EDU", "Waste & Water": "ENV",
    "Urban Public Transport": "METRO", "Aviation & Aviation Infrastructure": "AVN",
    "Steel": "STL", "Energy Storage": "BAT", "Telecommunication": "TEL", "Real Estate": "BLD",
    "Shipping": "PORT", "Metals & Mining": "MIN", "Inland Waterways": "IWT"
}

REGULATORY_QUERIES = [
    "Discrepancy in Compensatory Afforestation (CA) land mutation non-encumbrance certificate between DFO and executing agency PIU.",
    "CA land KML boundary polygon coordinates overlap with local revenue village common grazing lands (Gairan/Gochar).",
    "Gram Sabha resolution certificate under Forest Rights Act (FRA 2006) Section 3(1)(i) pending submission from District Collector.",
    "Wildlife Conservation Plan for Schedule-I fauna mitigation budget not deposited in State CAMPA statutory account.",
    "Integrated Regional Office (IRO) MoEFCC Site Inspection Report (SIR) pending physical tree enumeration verification.",
    "Baseline ambient air quality and water monitoring report during non-monsoon season queried by EAC appraisal committee.",
    "Engineering design for muck disposal site stabilization and geo-synthetic siltation barriers required by SPCB.",
    "Competent Authority Land Acquisition (CALA) Section 19 declaration pending gazette publication in district.",
    "Joint site inspection verification of Right-of-Way (ROW) unencumbered tree felling clearance pending forest division sign-off."
]

def infer_state(project_name: str, existing_state: str) -> str:
    if existing_state and str(existing_state).strip() and str(existing_state) != "None" and str(existing_state) != "nan":
        return str(existing_state).strip()
    name_upper = str(project_name).upper()
    for state_name in STATE_CODES.keys():
        if state_name.upper() in name_upper:
            return state_name
    # City / Regional cues
    cues = {
        "DELHI": "Delhi", "MUMBAI": "Maharashtra", "PUNE": "Maharashtra", "NAGPUR": "Maharashtra",
        "KOLKATA": "West Bengal", "CHENNAI": "Tamil Nadu", "BENGALURU": "Karnataka", "BANGALORE": "Karnataka",
        "HYDERABAD": "Telangana", "AHMEDABAD": "Gujarat", "SURAT": "Gujarat", "JAIPUR": "Rajasthan",
        "LUCKNOW": "Uttar Pradesh", "KANPUR": "Uttar Pradesh", "PATNA": "Bihar", "RANCHI": "Jharkhand",
        "BHOPAL": "Madhya Pradesh", "INDORE": "Madhya Pradesh", "GUWAHATI": "Assam", "IMPHAL": "Manipur",
        "SHILLONG": "Meghalaya", "AGARTALA": "Tripura", "DEHRADUN": "Uttarakhand", "SHIMLA": "Himachal Pradesh",
        "CHANDIGARH": "Punjab", "AMRITSAR": "Punjab", "BHUBANESWAR": "Odisha", "RAIPUR": "Chhattisgarh",
        "VIJAYAWADA": "Andhra Pradesh", "VISAKHAPATNAM": "Andhra Pradesh", "KOCHI": "Kerala", "JAMMU": "Jammu & Kashmir",
        "SRINAGAR": "Jammu & Kashmir", "JIND": "Haryana", "GOHANA": "Haryana", "VARANASI": "Uttar Pradesh"
    }
    for cue, st in cues.items():
        if cue in name_upper:
            return st
    return "Maharashtra"  # Deterministic default

def generate_clearances():
    print(f"Loading master database from {CSV_PATH}...")
    df = pd.read_csv(CSV_PATH)
    print(f"Total projects in CSV: {len(df)}")

    # Ensure SQLite table exists
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    
    # Check existing schema
    cur.execute("""
    CREATE TABLE IF NOT EXISTS parivesh_clearances (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        proposal_no TEXT,
        project_id TEXT,
        project_name TEXT,
        state TEXT,
        district TEXT,
        sector TEXT,
        stage_code TEXT,
        stage_name TEXT,
        department TEXT,
        days_pending INTEGER,
        benchmark_days INTEGER,
        status TEXT,
        eds_ads_raised_count INTEGER,
        last_query TEXT,
        environmental_sensitivity TEXT,
        diversion_forest_ha REAL,
        is_stagnated INTEGER
    );
    """)
    
    # Clear existing rows to rebuild full clean 2,207 portfolio
    cur.execute("DELETE FROM parivesh_clearances;")
    conn.commit()

    all_records = []
    
    for idx, row in df.iterrows():
        p_id = str(row.get("ProjectId", "")).strip()
        if not p_id:
            continue
        
        # Deterministic PRNG seeded by project_id
        seed_val = int(hashlib.md5(p_id.encode()).hexdigest()[:8], 16)
        rng = random.Random(seed_val)

        p_name = str(row.get("ProjectName") or f"Central Project #{p_id}")
        raw_state = row.get("StateName") or row.get("State")
        state = infer_state(p_name, raw_state)
        st_code = STATE_CODES.get(state, "IN")
        
        raw_sector = str(row.get("SectorName") or "Infrastructure").strip()
        sec_code = SECTOR_CODES.get(raw_sector, "INFRA")
        
        orig_cost = float(row.get("OriginalCost") or 500.0)
        rev_cost = float(row.get("RevisedCost") or orig_cost)
        cost_overrun_cr = max(0.0, rev_cost - orig_cost)

        orig_dt = pd.to_datetime(row.get("OriginalEndDate"), errors="coerce", dayfirst=True)
        rev_dt = pd.to_datetime(row.get("RevisedDate"), errors="coerce", dayfirst=True)
        if pd.notna(orig_dt) and pd.notna(rev_dt) and rev_dt > orig_dt:
            delay_months = round(max(0.0, (rev_dt - orig_dt).days / 30.4375), 1)
        else:
            delay_months = float(row.get("OnboardingDelay") or row.get("DELAYED_TIME") or 0.0)

        # Baseline delay in days
        delay_days = int(delay_months * 30.4375)
        
        # Forest diversion acreage scaled realistically to project capex & sector
        if raw_sector in ["Roads & Highways", "Railways", "Transmission & Distribution"]:
            base_forest_ha = round(min(220.0, max(5.0, (orig_cost / 100.0) * rng.uniform(1.8, 3.5))), 2)
        elif raw_sector in ["Coal", "Metals & Mining", "Water Resources", "Electricity Generation"]:
            base_forest_ha = round(min(450.0, max(15.0, (orig_cost / 80.0) * rng.uniform(2.5, 5.0))), 2)
        else:
            base_forest_ha = round(min(30.0, max(0.0, (orig_cost / 500.0) * rng.uniform(0.5, 1.5))), 2)

        # Environmental sensitivity
        if base_forest_ha > 100.0 or delay_months > 24:
            env_sens = "CRITICAL"
        elif base_forest_ha > 40.0 or delay_months > 12:
            env_sens = "HIGH"
        elif base_forest_ha > 10.0:
            env_sens = "MEDIUM"
        else:
            env_sens = "LOW"

        # Stages to generate
        # 1. Forest Clearance (Stage-I & Stage-II)
        fc_prop_num = f"FP/{st_code}/{sec_code}/{p_id}/2023"
        fc_bench = 120
        if delay_months > 18:
            fc_status = "LOOPBACK"
            fc_pending = min(480, max(fc_bench + 30, int(delay_days * 0.8)))
            fc_eds = min(4, max(2, int(delay_months / 8)))
            fc_query = rng.choice(REGULATORY_QUERIES[:5])
            fc_stag = 1
        elif delay_months > 6:
            fc_status = "IN_REVIEW"
            fc_pending = min(fc_bench + 45, max(60, int(delay_days * 0.6)))
            fc_eds = 1
            fc_query = rng.choice(REGULATORY_QUERIES[4:7])
            fc_stag = 1 if fc_pending > fc_bench else 0
        else:
            fc_status = "APPROVED" if rng.random() > 0.3 else "STAGE_1_APPROVED"
            fc_pending = min(fc_bench - 10, max(30, rng.randint(30, 95)))
            fc_eds = 0
            fc_query = None
            fc_stag = 0

        record_fc = {
            "proposal_no": fc_prop_num,
            "project_id": p_id,
            "project_name": p_name,
            "state": state,
            "district": f"{state} Corridor Division",
            "sector": raw_sector,
            "stage_code": "FOREST_CLEARANCE",
            "stage_name": "Forest Clearance (Stage-I & Stage-II)",
            "department": "MoEFCC Regional Office & State Forest Nodal Dept",
            "days_pending": fc_pending,
            "benchmark_days": fc_bench,
            "status": fc_status,
            "eds_ads_raised_count": fc_eds,
            "last_query": fc_query,
            "environmental_sensitivity": env_sens,
            "diversion_forest_ha": base_forest_ha,
            "is_stagnated": fc_stag
        }
        all_records.append(record_fc)

        # 2. Environment Clearance (EIA/EMP Review)
        ec_prop_num = f"IA/{st_code}/{sec_code}/{p_id}/2023"
        ec_bench = 105
        if delay_months > 24:
            ec_status = "LOOPBACK"
            ec_pending = min(400, max(ec_bench + 20, int(delay_days * 0.7)))
            ec_eds = min(3, max(1, int(delay_months / 10)))
            ec_query = rng.choice(REGULATORY_QUERIES[5:])
            ec_stag = 1
        elif delay_months > 10:
            ec_status = "IN_REVIEW"
            ec_pending = min(150, max(ec_bench - 10, int(delay_days * 0.5)))
            ec_eds = 1
            ec_query = rng.choice(REGULATORY_QUERIES[6:8])
            ec_stag = 1 if ec_pending > ec_bench else 0
        else:
            ec_status = "APPROVED"
            ec_pending = rng.randint(45, 95)
            ec_eds = 0
            ec_query = None
            ec_stag = 0

        record_ec = {
            "proposal_no": ec_prop_num,
            "project_id": p_id,
            "project_name": p_name,
            "state": state,
            "district": f"{state} Environment Zone",
            "sector": raw_sector,
            "stage_code": "ENVIRONMENT_CLEARANCE",
            "stage_name": "Environment Clearance (EIA/EMP Review)",
            "department": "Expert Appraisal Committee (EAC) / SEIAA",
            "days_pending": ec_pending,
            "benchmark_days": ec_bench,
            "status": ec_status,
            "eds_ads_raised_count": ec_eds,
            "last_query": ec_query,
            "environmental_sensitivity": env_sens,
            "diversion_forest_ha": 0.0,
            "is_stagnated": ec_stag
        }
        all_records.append(record_ec)

        # 3. Land Acquisition & CALA Handover (RFCTLARR 2013)
        la_prop_num = f"LA/{st_code}/SEC19/{p_id}/2022"
        la_bench = 180
        if delay_months > 12:
            la_status = "LOOPBACK" if delay_months > 20 else "IN_REVIEW"
            la_pending = min(500, max(la_bench + 30, int(delay_days * 0.9)))
            la_eds = 2 if delay_months > 20 else 1
            la_query = "CALA award disbursement and land possession handover pending revenue record mutation."
            la_stag = 1
        else:
            la_status = "APPROVED" if rng.random() > 0.4 else "STAGE_1_APPROVED"
            la_pending = rng.randint(60, 160)
            la_eds = 0
            la_query = None
            la_stag = 0

        record_la = {
            "proposal_no": la_prop_num,
            "project_id": p_id,
            "project_name": p_name,
            "state": state,
            "district": f"{state} CALA Division",
            "sector": raw_sector,
            "stage_code": "LAND_RFCTLARR",
            "stage_name": "Land Acquisition Handover (RFCTLARR 2013)",
            "department": "Competent Authority Land Acquisition (CALA) & State Revenue Dept",
            "days_pending": la_pending,
            "benchmark_days": la_bench,
            "status": la_status,
            "eds_ads_raised_count": la_eds,
            "last_query": la_query,
            "environmental_sensitivity": env_sens,
            "diversion_forest_ha": 0.0,
            "is_stagnated": la_stag
        }
        all_records.append(record_la)

        # 4. Optional Wildlife Clearance for highly sensitive or high-delay corridors
        if env_sens in ["CRITICAL", "HIGH"] and rng.random() > 0.45:
            wl_prop_num = f"WL/{st_code}/NBWL/{p_id}/2023"
            wl_bench = 90
            wl_status = "LOOPBACK" if delay_months > 18 else ("IN_REVIEW" if delay_months > 8 else "APPROVED")
            record_wl = {
                "proposal_no": wl_prop_num,
                "project_id": p_id,
                "project_name": p_name,
                "state": state,
                "district": f"{state} Eco-Sensitive Zone",
                "sector": raw_sector,
                "stage_code": "WILDLIFE_CLEARANCE",
                "stage_name": "Standing Committee NBWL Clearance",
                "department": "National Board for Wildlife (NBWL) & State CWLW",
                "days_pending": min(350, max(wl_bench + 15, int(delay_days * 0.75))) if delay_months > 8 else 55,
                "benchmark_days": wl_bench,
                "status": wl_status,
                "eds_ads_raised_count": 2 if wl_status == "LOOPBACK" else 0,
                "last_query": "Site-specific Wildlife Conservation Plan and mitigation underpass design review." if wl_status != "APPROVED" else None,
                "environmental_sensitivity": env_sens,
                "diversion_forest_ha": round(base_forest_ha * 0.35, 2),
                "is_stagnated": 1 if wl_status in ["LOOPBACK", "IN_REVIEW"] else 0
            }
            all_records.append(record_wl)

    print(f"Total clearance records generated across {len(df)} projects: {len(all_records)}")

    # Bulk insert into SQLite
    cur.executemany("""
        INSERT INTO parivesh_clearances (
            proposal_no, project_id, project_name, state, district, sector,
            stage_code, stage_name, department, days_pending, benchmark_days,
            status, eds_ads_raised_count, last_query, environmental_sensitivity,
            diversion_forest_ha, is_stagnated
        ) VALUES (
            :proposal_no, :project_id, :project_name, :state, :district, :sector,
            :stage_code, :stage_name, :department, :days_pending, :benchmark_days,
            :status, :eds_ads_raised_count, :last_query, :environmental_sensitivity,
            :diversion_forest_ha, :is_stagnated
        )
    """, all_records)
    conn.commit()
    conn.close()
    print(f"Successfully populated SQLite {DB_PATH} with {len(all_records)} records.")

    # Write JSON mirror
    with open(OUT_JSON, "w", encoding="utf-8") as f:
        json.dump(all_records, f, indent=2)
    print(f"Wrote JSON mirror to {OUT_JSON} ({round(os.path.getsize(OUT_JSON)/(1024*1024), 2)} MB).")

if __name__ == "__main__":
    generate_clearances()
