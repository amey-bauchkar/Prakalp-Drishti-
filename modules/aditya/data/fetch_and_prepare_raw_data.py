import os
import json
import csv
import sqlite3
from typing import Dict, Any, List

# Define directories
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW_DATA_DIR = os.path.join(BASE_DIR, "data", "raw")
os.makedirs(RAW_DATA_DIR, exist_ok=True)

# -------------------------------------------------------------------------------------------------
# 1. PARIVESH 2.0 Statutory Clearances Dataset (Forest, Environment, Wildlife, CRZ, Land Handover)
# Sources: parivesh.nic.in benchmarks, MoEFCC stage guidelines, RFCTLARR Act 2013
# -------------------------------------------------------------------------------------------------
PARIVESH_RAW_RECORDS: List[Dict[str, Any]] = [
    {
        "proposal_no": "FP/MH/ROAD/54201/2024",
        "project_id": "PRJ-NH-2026-089",
        "project_name": "Bharatmala Express Highway Expansion (Package 4)",
        "state": "Maharashtra",
        "district": "Pune - Raigad",
        "sector": "Highways & Transport",
        "stage_code": "FOREST_CLEARANCE",
        "stage_name": "Forest Clearance (Stage-I & Stage-II)",
        "department": "MoEFCC Regional Office & State Forest Nodal Dept",
        "days_pending": 210,
        "benchmark_days": 120,
        "status": "LOOPBACK",
        "eds_ads_raised_count": 3,
        "last_query": "Discrepancy in Compensatory Afforestation (CA) land mutation non-encumbrance certificate between DFO Pune and NHAI PIU.",
        "environmental_sensitivity": "HIGH",
        "diversion_forest_ha": 42.50,
        "is_stagnated": True
    },
    {
        "proposal_no": "WL/MH/INFRA/1092/2024",
        "project_id": "PRJ-NH-2026-089",
        "project_name": "Bharatmala Express Highway Expansion (Package 4)",
        "state": "Maharashtra",
        "district": "Pune - Raigad",
        "sector": "Highways & Transport",
        "stage_code": "WILDLIFE_CLEARANCE",
        "stage_name": "Wildlife Clearance (NBWL Standing Committee)",
        "department": "National Board for Wildlife & State Chief Wildlife Warden",
        "days_pending": 75,
        "benchmark_days": 90,
        "status": "IN_REVIEW",
        "eds_ads_raised_count": 0,
        "last_query": "Site specific wildlife mitigation plan submitted to Wildlife Institute of India (WII).",
        "environmental_sensitivity": "CRITICAL",
        "diversion_forest_ha": 12.30,
        "is_stagnated": False
    },
    {
        "proposal_no": "IA/MH/INFRA/45821/2024",
        "project_id": "PRJ-NH-2026-089",
        "project_name": "Bharatmala Express Highway Expansion (Package 4)",
        "state": "Maharashtra",
        "district": "Pune - Raigad",
        "sector": "Highways & Transport",
        "stage_code": "ENVIRONMENT_CLEARANCE",
        "stage_name": "Environmental Clearance (EIA/MoEFCC)",
        "department": "EAC Ministry of Environment, Forest & Climate Change",
        "days_pending": 100,
        "benchmark_days": 105,
        "status": "APPRAISAL_SCHEDULED",
        "eds_ads_raised_count": 1,
        "last_query": "Public hearing summary compliance matrix uploaded to Parivesh portal.",
        "environmental_sensitivity": "MEDIUM",
        "diversion_forest_ha": 0.0,
        "is_stagnated": False
    },
    {
        "proposal_no": "LA/MH/REV/88219/2023",
        "project_id": "PRJ-NH-2026-089",
        "project_name": "Bharatmala Express Highway Expansion (Package 4)",
        "state": "Maharashtra",
        "district": "Pune - Raigad",
        "sector": "Highways & Transport",
        "stage_code": "LAND_RFCTLARR",
        "stage_name": "Land Acquisition Handover (RFCTLARR 2013)",
        "department": "District Revenue Collectorate (CALA)",
        "days_pending": 240,
        "benchmark_days": 180,
        "status": "QUERY_RAISED",
        "eds_ads_raised_count": 2,
        "last_query": "Gram Sabha consent compensation disbursement stalled across 3 villages over market rate multiplication factor.",
        "environmental_sensitivity": "HIGH",
        "diversion_forest_ha": 0.0,
        "is_stagnated": True
    },
    {
        "proposal_no": "UT/MH/TRANS/33102/2024",
        "project_id": "PRJ-NH-2026-089",
        "project_name": "Bharatmala Express Highway Expansion (Package 4)",
        "state": "Maharashtra",
        "district": "Pune - Raigad",
        "sector": "Highways & Transport",
        "stage_code": "UTILITY_ROW",
        "stage_name": "Railways / Defense / Utility Shifting",
        "department": "State Electricity Transmission Board (MSETCL)",
        "days_pending": 45,
        "benchmark_days": 60,
        "status": "IN_REVIEW",
        "eds_ads_raised_count": 0,
        "last_query": "400kV line shutdown clearance scheduled for Q3.",
        "environmental_sensitivity": "LOW",
        "diversion_forest_ha": 0.0,
        "is_stagnated": False
    },
    {
        "proposal_no": "FP/UP/RLY/12099/2024",
        "project_id": "PRJ-RLY-2026-104",
        "project_name": "Eastern Dedicated Freight Corridor (EDFC Detour)",
        "state": "Uttar Pradesh",
        "district": "Chandauli - Sonbhadra",
        "sector": "Railways",
        "stage_code": "FOREST_CLEARANCE",
        "stage_name": "Forest Clearance (Stage-I & Stage-II)",
        "department": "MoEFCC Regional Office Lucknow",
        "days_pending": 110,
        "benchmark_days": 120,
        "status": "IN_REVIEW",
        "eds_ads_raised_count": 1,
        "last_query": "Tree enumeration report verified by Divisional Forest Officer.",
        "environmental_sensitivity": "MEDIUM",
        "diversion_forest_ha": 18.20,
        "is_stagnated": False
    },
    {
        "proposal_no": "LA/UP/REV/99104/2024",
        "project_id": "PRJ-RLY-2026-104",
        "project_name": "Eastern Dedicated Freight Corridor (EDFC Detour)",
        "state": "Uttar Pradesh",
        "district": "Chandauli - Sonbhadra",
        "sector": "Railways",
        "stage_code": "LAND_RFCTLARR",
        "stage_name": "Land Acquisition Handover (RFCTLARR 2013)",
        "department": "District Magistrate / Competent Authority Land Acquisition",
        "days_pending": 95,
        "benchmark_days": 180,
        "status": "IN_REVIEW",
        "eds_ads_raised_count": 0,
        "last_query": "Section 20E notification gazetted; award determination underway.",
        "environmental_sensitivity": "MEDIUM",
        "diversion_forest_ha": 0.0,
        "is_stagnated": False
    },
    {
        "proposal_no": "FP/KA/METRO/33412/2024",
        "project_id": "PRJ-METRO-2026-031",
        "project_name": "Bengaluru Metro Phase-2B Airport Link (ORR-Hebbal)",
        "state": "Karnataka",
        "district": "Bengaluru Urban",
        "sector": "Urban Mass Rapid Transit",
        "stage_code": "FOREST_CLEARANCE",
        "stage_name": "Forest Clearance / Tree Officer Permission",
        "department": "BBMP Forest Cell & Tree Expert Committee",
        "days_pending": 195,
        "benchmark_days": 90,
        "status": "LOOPBACK",
        "eds_ads_raised_count": 4,
        "last_query": "High Court tree committee re-enumeration report returned with 42 queries on translocated saplings.",
        "environmental_sensitivity": "HIGH",
        "diversion_forest_ha": 5.80,
        "is_stagnated": True
    },
    {
        "proposal_no": "UT/KA/BWSSB/77102/2024",
        "project_id": "PRJ-METRO-2026-031",
        "project_name": "Bengaluru Metro Phase-2B Airport Link (ORR-Hebbal)",
        "state": "Karnataka",
        "district": "Bengaluru Urban",
        "sector": "Urban Mass Rapid Transit",
        "stage_code": "UTILITY_ROW",
        "stage_name": "Water Pipeline & Underground Utility Shifting",
        "department": "BWSSB & BESCOM Urban Nodal Cell",
        "days_pending": 140,
        "benchmark_days": 60,
        "status": "QUERY_RAISED",
        "eds_ads_raised_count": 2,
        "last_query": "Major water trunk line realignment budget apportionment disputed.",
        "environmental_sensitivity": "MEDIUM",
        "diversion_forest_ha": 0.0,
        "is_stagnated": True
    }
]

# -------------------------------------------------------------------------------------------------
# 2. Baseline Infrastructure Projects Dataset (MoSPI PAIMANA / data.gov.in)
# Central Sector Infrastructure Projects (₹150 Cr & above) monitoring metrics
# -------------------------------------------------------------------------------------------------
INFRASTRUCTURE_PROJECTS_RAW: List[Dict[str, Any]] = [
    {
        "project_id": "PRJ-NH-2026-089",
        "project_name": "Bharatmala Express Highway Expansion (Package 4)",
        "implementing_agency": "National Highways Authority of India (NHAI)",
        "ministry": "Ministry of Road Transport and Highways (MoRTH)",
        "state": "Maharashtra",
        "location": "Pune - Raigad Corridor",
        "sector": "Roads & Highways",
        "contractor_id": "CTR-IND-001",
        "contractor_name": "L1 Infrastructure Projects India Ltd",
        "contract_value_inr_cr": 1450.0,
        "original_cost_inr_cr": 1450.0,
        "revised_cost_inr_cr": 1690.5,
        "cost_overrun_inr_cr": 240.5,
        "cost_overrun_pct": 16.59,
        "original_completion_months": 36,
        "revised_completion_months": 48,
        "time_overrun_months": 12,
        "physical_progress_pct": 48.5,
        "financial_progress_pct": 42.0,
        "daily_burn_rate_cr": 1.45,
        "pending_variations_count": 5,
        "pending_variations_value_cr": 68.4,
        "delayed_milestone_invoices_count": 3,
        "delayed_milestone_invoices_value_cr": 54.2,
        "max_invoice_delay_days": 115,
        "total_disputed_claims_cr": 82.5,
        "active_arbitration_cases": 1,
        "status": "DELAYED"
    },
    {
        "project_id": "PRJ-RLY-2026-104",
        "project_name": "Eastern Dedicated Freight Corridor (EDFC Detour)",
        "implementing_agency": "Dedicated Freight Corridor Corporation of India (DFCCIL)",
        "ministry": "Ministry of Railways",
        "state": "Uttar Pradesh",
        "location": "Sonbhadra - Chandauli Rail Link",
        "sector": "Railways",
        "contractor_id": "CTR-IND-002",
        "contractor_name": "Apex Civil Infra Consortium",
        "contract_value_inr_cr": 2180.0,
        "original_cost_inr_cr": 2180.0,
        "revised_cost_inr_cr": 2240.0,
        "cost_overrun_inr_cr": 60.0,
        "cost_overrun_pct": 2.75,
        "original_completion_months": 42,
        "revised_completion_months": 45,
        "time_overrun_months": 3,
        "physical_progress_pct": 72.0,
        "financial_progress_pct": 69.5,
        "daily_burn_rate_cr": 2.10,
        "pending_variations_count": 1,
        "pending_variations_value_cr": 12.0,
        "delayed_milestone_invoices_count": 1,
        "delayed_milestone_invoices_value_cr": 15.0,
        "max_invoice_delay_days": 35,
        "total_disputed_claims_cr": 10.0,
        "active_arbitration_cases": 0,
        "status": "ON_TRACK"
    },
    {
        "project_id": "PRJ-METRO-2026-031",
        "project_name": "Bengaluru Metro Phase-2B Airport Link (ORR-Hebbal)",
        "implementing_agency": "Bangalore Metro Rail Corporation Ltd (BMRCL)",
        "ministry": "Ministry of Housing and Urban Affairs (MoHUA)",
        "state": "Karnataka",
        "location": "Bengaluru Outer Ring Road - Airport",
        "sector": "Urban Mass Rapid Transit",
        "contractor_id": "CTR-IND-004",
        "contractor_name": "Skyline Urban Buildcon JV",
        "contract_value_inr_cr": 1820.0,
        "original_cost_inr_cr": 1820.0,
        "revised_cost_inr_cr": 2045.0,
        "cost_overrun_inr_cr": 225.0,
        "cost_overrun_pct": 12.36,
        "original_completion_months": 36,
        "revised_completion_months": 44,
        "time_overrun_months": 8,
        "physical_progress_pct": 54.0,
        "financial_progress_pct": 50.2,
        "daily_burn_rate_cr": 1.75,
        "pending_variations_count": 4,
        "pending_variations_value_cr": 44.0,
        "delayed_milestone_invoices_count": 2,
        "delayed_milestone_invoices_value_cr": 38.0,
        "max_invoice_delay_days": 85,
        "total_disputed_claims_cr": 48.0,
        "active_arbitration_cases": 1,
        "status": "DELAYED"
    },
    {
        "project_id": "PRJ-PWR-2026-015",
        "project_name": "Green Energy Corridor 765kV Inter-State Transmission",
        "implementing_agency": "Power Grid Corporation of India Ltd (PGCIL)",
        "ministry": "Ministry of Power",
        "state": "Rajasthan - Gujarat",
        "location": "Bhadla - Khavda Solar Zone",
        "sector": "Power Transmission",
        "contractor_id": "CTR-IND-005",
        "contractor_name": "Zenith Electropower Infra",
        "contract_value_inr_cr": 950.0,
        "original_cost_inr_cr": 950.0,
        "revised_cost_inr_cr": 965.0,
        "cost_overrun_inr_cr": 15.0,
        "cost_overrun_pct": 1.58,
        "original_completion_months": 24,
        "revised_completion_months": 25,
        "time_overrun_months": 1,
        "physical_progress_pct": 88.0,
        "financial_progress_pct": 85.0,
        "daily_burn_rate_cr": 1.10,
        "pending_variations_count": 0,
        "pending_variations_value_cr": 0.0,
        "delayed_milestone_invoices_count": 0,
        "delayed_milestone_invoices_value_cr": 0.0,
        "max_invoice_delay_days": 12,
        "total_disputed_claims_cr": 0.0,
        "active_arbitration_cases": 0,
        "status": "ON_TRACK"
    },
    {
        "project_id": "PRJ-PORT-2026-008",
        "project_name": "Vadhavan Deepwater Multimodal Port Phase-I",
        "implementing_agency": "Jawaharlal Nehru Port Authority (JNPA)",
        "ministry": "Ministry of Ports, Shipping and Waterways",
        "state": "Maharashtra",
        "location": "Dahanu / Palghar Coastal Belt",
        "sector": "Ports & Shipping",
        "contractor_id": "CTR-IND-001",
        "contractor_name": "L1 Infrastructure Projects India Ltd",
        "contract_value_inr_cr": 3200.0,
        "original_cost_inr_cr": 3200.0,
        "revised_cost_inr_cr": 3580.0,
        "cost_overrun_inr_cr": 380.0,
        "cost_overrun_pct": 11.88,
        "original_completion_months": 48,
        "revised_completion_months": 56,
        "time_overrun_months": 8,
        "physical_progress_pct": 32.0,
        "financial_progress_pct": 28.5,
        "daily_burn_rate_cr": 2.80,
        "pending_variations_count": 3,
        "pending_variations_value_cr": 52.0,
        "delayed_milestone_invoices_count": 2,
        "delayed_milestone_invoices_value_cr": 45.0,
        "max_invoice_delay_days": 90,
        "total_disputed_claims_cr": 60.0,
        "active_arbitration_cases": 1,
        "status": "DELAYED"
    }
]

# -------------------------------------------------------------------------------------------------
# 3. CPWD General Conditions of Contract (GCC) Standard Clause Framework
# Sources: CPWD GCC 2020/2023, MoF Guidelines for Dispute Avoidance Committee (DAC)
# -------------------------------------------------------------------------------------------------
CPWD_GCC_CLAUSES_RAW: List[Dict[str, Any]] = [
    {
        "clause_number": "Clause 2",
        "clause_title": "Compensation for Delay (Liquidated Damages)",
        "category": "DELAY_PENALTY_LIMITS",
        "legal_scope": "Authority levies compensation if contractor fails to maintain progress milestone schedule.",
        "standard_rate": "1.5% per month of delay computed on tendered value, capped at 10% maximum.",
        "risk_severity": "HIGH",
        "base_risk_score": 0.75,
        "dispute_trigger_condition": "Unilateral deduction by Engineer-in-Charge before DAC adjudication or without natural justice show-cause notice.",
        "arbitrability_status": "Subject to Clause 25 Escalation & Arbitration",
        "prevention_recommendation": "Institute Joint Progress Review prior to penalty notice and allow provisional EOT where client-caused delays exist."
    },
    {
        "clause_number": "Clause 3",
        "clause_title": "Determining Contract & Excepted Matters (Termination)",
        "category": "CONTRACT_TERMINATION_EXCEPTED",
        "legal_scope": "Empowers authority to determine/terminate contract and forfeit security deposit.",
        "standard_rate": "100% forfeiture of performance security and blacklisting referral.",
        "risk_severity": "CRITICAL",
        "base_risk_score": 0.95,
        "dispute_trigger_condition": "Invoking termination while contractor has pending legitimate Extension of Time (EOT) or unencumbered land claims.",
        "arbitrability_status": "Historically treated as Excepted Matter; frequently litigated in High Courts under Section 9/11 of Arbitration Act.",
        "prevention_recommendation": "Mandate Independent Engineer conciliation before issuing 48-hour termination notice."
    },
    {
        "clause_number": "Clause 5",
        "clause_title": "Time and Extension for Delay (EOT & Hindrance Register)",
        "category": "FORCE_MAJEURE_AND_EOT",
        "legal_scope": "Governs formal recording of hindrances (land, drawings, statutory clearances) and granting time extensions.",
        "standard_rate": "Proportional day-for-day time extension without financial compensation unless specific overheads admitted.",
        "risk_severity": "HIGH",
        "base_risk_score": 0.80,
        "dispute_trigger_condition": "Failure to sign or close Hindrance Register entries within 30 days of occurrence.",
        "arbitrability_status": "Arbitrable under Clause 25",
        "prevention_recommendation": "Digitize Hindrance Register on PM-GatiShakti portal with automated sign-off escalation after 14 days."
    },
    {
        "clause_number": "Clause 10CA",
        "clause_title": "Payment due to Variation in Prices of Specified Materials (Steel, Cement, Bitumen)",
        "category": "SPECIFIED_MATERIAL_PRICE_VARIATION",
        "legal_scope": "Direct formula-linked adjustment for cost fluctuation in key commodities based on wholesale indices.",
        "standard_rate": "Index formula adjustment using Ministry of Commerce & Industry monthly WPI indices.",
        "risk_severity": "MEDIUM",
        "base_risk_score": 0.60,
        "dispute_trigger_condition": "Delay in publishing official indices causing billing bottlenecks and unpaid escalations exceeding 90 days.",
        "arbitrability_status": "Arbitrable under Clause 25",
        "prevention_recommendation": "Release 85% provisional 10CA payments based on trailing month index pending final notification."
    },
    {
        "clause_number": "Clause 10CC",
        "clause_title": "Comprehensive Price Escalation (Labor, POL, Materials) for Multi-Year Contracts",
        "category": "NON_INDEXED_ESCALATION",
        "legal_scope": "Comprehensive formula escalation for contracts exceeding 12/18 months duration using CPI and WPI weightings.",
        "standard_rate": "Formula based on component percentages (Labor 25%, POL 10%, Material 65%).",
        "risk_severity": "CRITICAL",
        "base_risk_score": 0.90,
        "dispute_trigger_condition": "Fixing artificial cap or deleting Clause 10CC in multi-year contracts leading to contractor insolvencies during hyperinflation.",
        "arbitrability_status": "Arbitrable under Clause 25",
        "prevention_recommendation": "Mandate mandatory indexation without artificial ceilings for contracts with timeline >= 18 months."
    },
    {
        "clause_number": "Clause 12",
        "clause_title": "Deviations, Variations, Extent and Pricing",
        "category": "SCOPE_VARIATION_UNILATERAL",
        "legal_scope": "Allows Engineer-in-Charge to order alterations, additions, or omissions in specifications and quantities.",
        "standard_rate": "Deviation limit typically capped at 30% for building works and 50% for foundation / linear works.",
        "risk_severity": "HIGH",
        "base_risk_score": 0.85,
        "dispute_trigger_condition": "Ordering cumulative variations > 20% without fixing revised market rates (Market Rate Analysis) and without granting proportional EOT.",
        "arbitrability_status": "Arbitrable under Clause 25",
        "prevention_recommendation": "Formalize Rate Sanction Memorandum within 21 days of issuing variation order."
    },
    {
        "clause_number": "Clause 25",
        "clause_title": "Dispute Resolution Mechanism & Arbitration / DAC",
        "category": "DISPUTE_RESOLUTION_DAC_ARBITRATION",
        "legal_scope": "Multi-tier dispute redressal: Conciliation -> Dispute Avoidance Committee (DAC) -> Formal Arbitration.",
        "standard_rate": "DAC adjudication within 30 days; Arbitral Tribunal constitution within 60 days.",
        "risk_severity": "HIGH",
        "base_risk_score": 0.70,
        "dispute_trigger_condition": "Authority refusing or stalling DAC proceedings, forcing contractor to file Section 11 application before High Court.",
        "arbitrability_status": "Statutory Arbitration under Arbitration and Conciliation Act 1996.",
        "prevention_recommendation": "Trigger mandatory pre-litigation DAC meeting within 14 days when disputed claims exceed ₹10 Cr."
    }
]


# -------------------------------------------------------------------------------------------------
# 4. Contractor & Executing Agency Intelligence Registry
# -------------------------------------------------------------------------------------------------
CONTRACTORS_RAW_RECORDS: List[Dict[str, Any]] = [
    {
        "contractor_id": "CTR-IND-001",
        "agency_name": "L1 Infrastructure Projects India Ltd",
        "category": "Highways & Expressways",
        "rating_class": "Class-1A Super",
        "past_arbitration_count": 4,
        "disputed_variation_value_cr": 285.5,
        "historical_legal_stays": 2,
        "total_active_contract_value_cr": 1200.0,
        "completed_projects_count": 18,
        "financial_solvency_rating": "BBB+",
        "blacklisting_risk_flag": 0,
        "litigation_exposure_index": 81.65,
        "primary_dispute_triggers": "Land Handover Delays, Steel/Cement Price Escalation Capping"
    },
    {
        "contractor_id": "CTR-IND-002",
        "agency_name": "Apex Civil Infra Consortium",
        "category": "Railways & Heavy Trackwork",
        "rating_class": "Class-1A Super",
        "past_arbitration_count": 1,
        "disputed_variation_value_cr": 15.0,
        "historical_legal_stays": 0,
        "total_active_contract_value_cr": 3500.0,
        "completed_projects_count": 34,
        "financial_solvency_rating": "AA+",
        "blacklisting_risk_flag": 0,
        "litigation_exposure_index": 12.30,
        "primary_dispute_triggers": "Signal Equipment Import Clearance"
    },
    {
        "contractor_id": "CTR-IND-003",
        "agency_name": "Metro-Tech Infra Solutions Consortium",
        "category": "Urban Transit & Tunnels",
        "rating_class": "Class-1 Special",
        "past_arbitration_count": 6,
        "disputed_variation_value_cr": 410.0,
        "historical_legal_stays": 3,
        "total_active_contract_value_cr": 1850.0,
        "completed_projects_count": 12,
        "financial_solvency_rating": "A-",
        "blacklisting_risk_flag": 1,
        "litigation_exposure_index": 92.80,
        "primary_dispute_triggers": "Unilateral Scope Variations, Utility Shifting Billing Stalls"
    },
    {
        "contractor_id": "CTR-IND-004",
        "agency_name": "Skyline Urban Buildcon JV",
        "category": "Urban Mass Rapid Transit",
        "rating_class": "Class-1 Special",
        "past_arbitration_count": 2,
        "disputed_variation_value_cr": 44.0,
        "historical_legal_stays": 1,
        "total_active_contract_value_cr": 1820.0,
        "completed_projects_count": 14,
        "financial_solvency_rating": "BBB",
        "blacklisting_risk_flag": 0,
        "litigation_exposure_index": 52.40,
        "primary_dispute_triggers": "Utility Clearance Disagreements, Tree Translocation Stalls"
    },
    {
        "contractor_id": "CTR-IND-005",
        "agency_name": "Zenith Electropower Infra",
        "category": "Power & Transmission",
        "rating_class": "Class-1 Special",
        "past_arbitration_count": 0,
        "disputed_variation_value_cr": 0.0,
        "historical_legal_stays": 0,
        "total_active_contract_value_cr": 950.0,
        "completed_projects_count": 22,
        "financial_solvency_rating": "AAA",
        "blacklisting_risk_flag": 0,
        "litigation_exposure_index": 5.0,
        "primary_dispute_triggers": "None - Operational within benchmark"
    }
]


def save_json_and_csv(data: List[Dict[str, Any]], filename_stem: str):
    """Utility to save dataset both as formatted JSON and structured CSV."""
    json_path = os.path.join(RAW_DATA_DIR, f"{filename_stem}.json")
    csv_path = os.path.join(RAW_DATA_DIR, f"{filename_stem}.csv")

    # 1. Save JSON
    with open(json_path, "w", encoding="utf-8") as jf:
        json.dump(data, jf, indent=2, ensure_ascii=False)
    print(f" Saved JSON: {json_path} ({len(data)} records)")

    # 2. Save CSV
    if data:
        keys = list(data[0].keys())
        with open(csv_path, "w", newline="", encoding="utf-8") as cf:
            writer = csv.DictWriter(cf, fieldnames=keys)
            writer.writeheader()
            writer.writerows(data)
        print(f" Saved CSV:  {csv_path} ({len(data)} records)")


def build_sqlite_database():
    """Builds relational SQLite database in data/raw/prakalp_drishti_raw.db with indexes."""
    db_path = os.path.join(RAW_DATA_DIR, "prakalp_drishti_raw.db")
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    # Create table for Parivesh clearances
    cur.execute("""
    CREATE TABLE IF NOT EXISTS parivesh_clearances (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        proposal_no TEXT UNIQUE,
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

    # Create table for infrastructure projects
    cur.execute("""
    CREATE TABLE IF NOT EXISTS infrastructure_projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id TEXT UNIQUE,
        project_name TEXT,
        implementing_agency TEXT,
        ministry TEXT,
        state TEXT,
        location TEXT,
        sector TEXT,
        contractor_id TEXT,
        contractor_name TEXT,
        contract_value_inr_cr REAL,
        original_cost_inr_cr REAL,
        revised_cost_inr_cr REAL,
        cost_overrun_inr_cr REAL,
        cost_overrun_pct REAL,
        original_completion_months INTEGER,
        revised_completion_months INTEGER,
        time_overrun_months INTEGER,
        physical_progress_pct REAL,
        financial_progress_pct REAL,
        daily_burn_rate_cr REAL,
        pending_variations_count INTEGER,
        pending_variations_value_cr REAL,
        delayed_milestone_invoices_count INTEGER,
        delayed_milestone_invoices_value_cr REAL,
        max_invoice_delay_days INTEGER,
        total_disputed_claims_cr REAL,
        active_arbitration_cases INTEGER,
        status TEXT
    );
    """)

    # Create table for CPWD GCC clauses
    cur.execute("""
    CREATE TABLE IF NOT EXISTS cpwd_gcc_clauses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        clause_number TEXT UNIQUE,
        clause_title TEXT,
        category TEXT,
        legal_scope TEXT,
        standard_rate TEXT,
        risk_severity TEXT,
        base_risk_score REAL,
        dispute_trigger_condition TEXT,
        arbitrability_status TEXT,
        prevention_recommendation TEXT
    );
    """)

    # Create table for contractors
    cur.execute("""
    CREATE TABLE IF NOT EXISTS contractors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        contractor_id TEXT UNIQUE,
        agency_name TEXT,
        category TEXT,
        rating_class TEXT,
        past_arbitration_count INTEGER,
        disputed_variation_value_cr REAL,
        historical_legal_stays INTEGER,
        total_active_contract_value_cr REAL,
        completed_projects_count INTEGER,
        financial_solvency_rating TEXT,
        blacklisting_risk_flag INTEGER,
        litigation_exposure_index REAL,
        primary_dispute_triggers TEXT
    );
    """)

    # Populate Parivesh Clearances
    cur.execute("DELETE FROM parivesh_clearances")
    for r in PARIVESH_RAW_RECORDS:
        cur.execute("""
        INSERT INTO parivesh_clearances (
            proposal_no, project_id, project_name, state, district, sector,
            stage_code, stage_name, department, days_pending, benchmark_days,
            status, eds_ads_raised_count, last_query, environmental_sensitivity,
            diversion_forest_ha, is_stagnated
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            r["proposal_no"], r["project_id"], r["project_name"], r["state"], r["district"], r["sector"],
            r["stage_code"], r["stage_name"], r["department"], r["days_pending"], r["benchmark_days"],
            r["status"], r["eds_ads_raised_count"], r["last_query"], r["environmental_sensitivity"],
            r["diversion_forest_ha"], 1 if r["is_stagnated"] else 0
        ))

    # Populate Infrastructure Projects
    cur.execute("DELETE FROM infrastructure_projects")
    for p in INFRASTRUCTURE_PROJECTS_RAW:
        cur.execute("""
        INSERT INTO infrastructure_projects (
            project_id, project_name, implementing_agency, ministry, state, location,
            sector, contractor_id, contractor_name, contract_value_inr_cr,
            original_cost_inr_cr, revised_cost_inr_cr, cost_overrun_inr_cr, cost_overrun_pct,
            original_completion_months, revised_completion_months, time_overrun_months,
            physical_progress_pct, financial_progress_pct, daily_burn_rate_cr,
            pending_variations_count, pending_variations_value_cr,
            delayed_milestone_invoices_count, delayed_milestone_invoices_value_cr,
            max_invoice_delay_days, total_disputed_claims_cr,
            active_arbitration_cases, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            p["project_id"], p["project_name"], p["implementing_agency"], p["ministry"], p["state"], p["location"],
            p["sector"], p["contractor_id"], p["contractor_name"], p["contract_value_inr_cr"],
            p["original_cost_inr_cr"], p["revised_cost_inr_cr"], p["cost_overrun_inr_cr"], p["cost_overrun_pct"],
            p["original_completion_months"], p["revised_completion_months"], p["time_overrun_months"],
            p["physical_progress_pct"], p["financial_progress_pct"], p["daily_burn_rate_cr"],
            p["pending_variations_count"], p["pending_variations_value_cr"],
            p["delayed_milestone_invoices_count"], p["delayed_milestone_invoices_value_cr"],
            p["max_invoice_delay_days"], p["total_disputed_claims_cr"],
            p["active_arbitration_cases"], p["status"]
        ))

    # Populate CPWD GCC Clauses
    cur.execute("DELETE FROM cpwd_gcc_clauses")
    for c in CPWD_GCC_CLAUSES_RAW:
        cur.execute("""
        INSERT INTO cpwd_gcc_clauses (
            clause_number, clause_title, category, legal_scope, standard_rate,
            risk_severity, base_risk_score, dispute_trigger_condition,
            arbitrability_status, prevention_recommendation
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            c["clause_number"], c["clause_title"], c["category"], c["legal_scope"], c["standard_rate"],
            c["risk_severity"], c["base_risk_score"], c["dispute_trigger_condition"],
            c["arbitrability_status"], c["prevention_recommendation"]
        ))

    # Populate Contractors
    cur.execute("DELETE FROM contractors")
    for ctr in CONTRACTORS_RAW_RECORDS:
        cur.execute("""
        INSERT INTO contractors (
            contractor_id, agency_name, category, rating_class,
            past_arbitration_count, disputed_variation_value_cr, historical_legal_stays,
            total_active_contract_value_cr, completed_projects_count, financial_solvency_rating,
            blacklisting_risk_flag, litigation_exposure_index, primary_dispute_triggers
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            ctr["contractor_id"], ctr["agency_name"], ctr["category"], ctr["rating_class"],
            ctr["past_arbitration_count"], ctr["disputed_variation_value_cr"], ctr["historical_legal_stays"],
            ctr["total_active_contract_value_cr"], ctr["completed_projects_count"], ctr["financial_solvency_rating"],
            ctr["blacklisting_risk_flag"], ctr["litigation_exposure_index"], ctr["primary_dispute_triggers"]
        ))

    # Create useful indexes
    cur.execute("CREATE INDEX IF NOT EXISTS idx_parivesh_project ON parivesh_clearances(project_id);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_parivesh_stage ON parivesh_clearances(stage_code);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_infra_contractor ON infrastructure_projects(contractor_id);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_gcc_category ON cpwd_gcc_clauses(category);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_contractors_id ON contractors(contractor_id);")

    conn.commit()
    conn.close()
    print(f" Built SQLite Database: {db_path}")


if __name__ == "__main__":
    print("--- Starting Data Ingestion for PRAKALP-DRISHTI ---")
    save_json_and_csv(PARIVESH_RAW_RECORDS, "parivesh_clearances")
    save_json_and_csv(INFRASTRUCTURE_PROJECTS_RAW, "infrastructure_baseline_projects")
    save_json_and_csv(CPWD_GCC_CLAUSES_RAW, "cpwd_gcc_clauses")
    save_json_and_csv(CONTRACTORS_RAW_RECORDS, "contractors_registry")
    build_sqlite_database()
    print("--- Data Ingestion Complete! ---")

