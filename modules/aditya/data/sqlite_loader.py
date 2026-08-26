import os
import sqlite3
from typing import Dict, Any, List

try:
    from .mock_projects import MOCK_PROJECTS_DATABASE, CONTRACTORS_DATABASE
except (ImportError, ValueError):
    try:
        from modules.aditya.data.mock_projects import MOCK_PROJECTS_DATABASE, CONTRACTORS_DATABASE
    except ImportError:
        from app.data.mock_projects import MOCK_PROJECTS_DATABASE, CONTRACTORS_DATABASE

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "data", "prakalp_drishti_raw.db")
if not os.path.exists(DB_PATH):
    # Try alternate location in workspace
    ALT_PATH = os.path.join(os.path.dirname(BASE_DIR), "frontend", "aditya", "data", "raw", "prakalp_drishti_raw.db")
    if os.path.exists(ALT_PATH):
        DB_PATH = ALT_PATH


def load_contractors_from_sqlite() -> Dict[str, Dict[str, Any]]:
    """
    Loads contractor intelligence profiles directly from SQLite table 'contractors'.
    Falls back to in-memory CONTRACTORS_DATABASE if SQLite is unavailable.
    """
    if not os.path.exists(DB_PATH):
        return CONTRACTORS_DATABASE

    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        cur.execute("SELECT * FROM contractors")
        rows = cur.fetchall()
        
        if not rows:
            conn.close()
            return CONTRACTORS_DATABASE

        contractors_map: Dict[str, Dict[str, Any]] = {}
        for r in rows:
            triggers = []
            if r["primary_dispute_triggers"]:
                triggers = [t.strip() for t in r["primary_dispute_triggers"].split(",") if t.strip()]

            contractors_map[r["contractor_id"]] = {
                "contractor_id": r["contractor_id"],
                "agency_name": r["agency_name"],
                "category": r["category"],
                "rating_class": r["rating_class"],
                "past_arbitration_count": r["past_arbitration_count"],
                "disputed_variation_value_cr": r["disputed_variation_value_cr"],
                "historical_legal_stays": r["historical_legal_stays"],
                "total_active_contract_value_cr": r["total_active_contract_value_cr"],
                "completed_projects_count": r["completed_projects_count"],
                "financial_solvency_rating": r["financial_solvency_rating"],
                "blacklisting_risk_flag": bool(r["blacklisting_risk_flag"]),
                "litigation_exposure_index": r["litigation_exposure_index"],
                "primary_dispute_triggers": triggers
            }
        conn.close()
        return contractors_map
    except Exception as e:
        print(f"Error loading contractors from SQLite: {e}")
        return CONTRACTORS_DATABASE


def load_projects_from_sqlite() -> Dict[str, Any]:
    """
    Loads infrastructure projects, PARIVESH clearances, and CPWD GCC clauses
    directly from SQLite database (prakalp_drishti_raw.db) and builds evaluation requests.
    Falls back to memory database if SQLite file is unavailable.
    """
    if not os.path.exists(DB_PATH):
        return MOCK_PROJECTS_DATABASE

    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()

        # Fetch all projects
        cur.execute("SELECT * FROM infrastructure_projects")
        proj_rows = cur.fetchall()

        if not proj_rows:
            conn.close()
            return MOCK_PROJECTS_DATABASE

        # Fetch all clearances
        cur.execute("SELECT * FROM parivesh_clearances")
        clearance_rows = cur.fetchall()
        
        clearances_by_proj: Dict[str, List[Dict[str, Any]]] = {}
        for c in clearance_rows:
            p_id = c["project_id"]
            if p_id not in clearances_by_proj:
                clearances_by_proj[p_id] = []
            clearances_by_proj[p_id].append({
                "stage_code": c["stage_code"],
                "stage_name": c["stage_name"],
                "department": c["department"],
                "status": c["status"],
                "days_pending": c["days_pending"],
                "benchmark_days": c["benchmark_days"],
                "loopback_count": c["eds_ads_raised_count"],
                "last_query_date": None
            })

        # Load contractors
        contractors_dict = load_contractors_from_sqlite()

        projects_map: Dict[str, Any] = {}

        for p in proj_rows:
            p_id = p["project_id"]
            ctr_id = p["contractor_id"]
            
            # Contractor data from contractor registry or defaults
            ctr_data = contractors_dict.get(ctr_id, {
                "agency_name": p["contractor_name"],
                "past_arbitration_count": p["active_arbitration_cases"],
                "disputed_variation_value_cr": p["pending_variations_value_cr"],
                "historical_legal_stays": 1 if p["active_arbitration_cases"] > 0 else 0,
                "total_active_contract_value_cr": p["contract_value_inr_cr"]
            })

            stages = clearances_by_proj.get(p_id, [
                {
                    "stage_code": "FOREST_CLEARANCE",
                    "stage_name": "Forest Clearance (Stage-I & Stage-II)",
                    "department": "MoEFCC Regional Office",
                    "status": "APPROVED",
                    "days_pending": 45,
                    "benchmark_days": 120,
                    "loopback_count": 0,
                    "last_query_date": None
                },
                {
                    "stage_code": "LAND_RFCTLARR",
                    "stage_name": "Land Acquisition Handover (RFCTLARR 2013)",
                    "department": "Competent Authority Land Acquisition",
                    "status": "STAGE_1_APPROVED",
                    "days_pending": 90,
                    "benchmark_days": 180,
                    "loopback_count": 0,
                    "last_query_date": None
                }
            ])

            # Contract text sample synthesized with high-risk clauses if delayed
            if p["status"] == "DELAYED" or p["cost_overrun_pct"] > 5.0:
                contract_summary = f"""
                Section 14.2: Phased handover of land shall apply in {p['location']}. Unencumbered right of way subject to state revenue authority timelines. The contractor shall not claim overheads for land delivery delays.
                Section 18.5: Price escalation shall be fixed price contract basis without WPI adjustment. Escalation capped at 3.5% overall.
                Section 22.1: Liquidated damages capped at 5.0% of total contract value. Unilateral deduction of damages without prior arbitration.
                Section 29.4: The Authority reserves right to alter scope without time extension for variations up to 20%.
                """
            else:
                contract_summary = f"""
                Section 10.1: Standard WPI price adjustment applies quarterly for {p['project_name']}.
                Section 15.3: Land handover target is 90% unencumbered prior to work order release.
                Section 21.2: Liquidated damages capped at 10.0% of total contract price with mutual review window.
                """

            projects_map[p_id] = {
                "metadata": {
                    "project_id": p_id,
                    "project_name": p["project_name"],
                    "sector": p["sector"],
                    "executing_agency": p["implementing_agency"],
                    "total_sanctioned_cost_cr": p["original_cost_inr_cr"],
                    "mospi_monitoring_code": f"MoSPI-{p['sector'][:3].upper()}-{p_id.split('-')[-1]}",
                    "assigned_contractor_id": ctr_id
                },
                "nivaran_request": {
                    "project_id": p_id,
                    "project_name": p["project_name"],
                    "contract_text_or_summary": contract_summary,
                    "contractor_data": {
                        "agency_name": ctr_data.get("agency_name", p["contractor_name"]),
                        "past_arbitration_count": ctr_data.get("past_arbitration_count", p["active_arbitration_cases"]),
                        "disputed_variation_value_cr": ctr_data.get("disputed_variation_value_cr", p["pending_variations_value_cr"]),
                        "historical_legal_stays": ctr_data.get("historical_legal_stays", 1 if p["active_arbitration_cases"] > 0 else 0),
                        "total_active_contract_value_cr": ctr_data.get("total_active_contract_value_cr", p["contract_value_inr_cr"])
                    },
                    "operational_metrics": {
                        "pending_variation_orders_gt_90d": p["pending_variations_count"],
                        "pending_variation_value_cr": p["pending_variations_value_cr"],
                        "unpaid_milestone_invoices_count": p["delayed_milestone_invoices_count"],
                        "max_invoice_delay_days": p["max_invoice_delay_days"],
                        "pending_time_extension_requests": 1 if p["time_overrun_months"] > 0 else 0
                    }
                },
                "anumati_request": {
                    "project_id": p_id,
                    "project_name": p["project_name"],
                    "estimated_daily_cost_overrun_cr": p["daily_burn_rate_cr"],
                    "stages": stages
                }
            }

        conn.close()
        return projects_map
    except Exception as e:
        print(f"Error loading from SQLite: {e}")
        return MOCK_PROJECTS_DATABASE


def get_all_gcc_clauses() -> List[Dict[str, Any]]:
    """Returns all CPWD GCC clauses stored in the SQLite database."""
    if not os.path.exists(DB_PATH):
        return []
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        cur.execute("SELECT * FROM cpwd_gcc_clauses")
        rows = [dict(r) for r in cur.fetchall()]
        conn.close()
        return rows
    except Exception as e:
        print(f"Error fetching GCC clauses: {e}")
        return []
