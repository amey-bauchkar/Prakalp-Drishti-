import os
import sqlite3
from typing import Dict, Any, List, Optional

try:
    from .mock_projects import MOCK_PROJECTS_DATABASE, CONTRACTORS_DATABASE
except (ImportError, ValueError):
    from modules.aditya.data.mock_projects import MOCK_PROJECTS_DATABASE, CONTRACTORS_DATABASE

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPO_ROOT = os.path.dirname(os.path.dirname(BASE_DIR))

# The database lives under data/raw/, but only data/ was searched, so
# os.path.exists() was always False and every request silently fell through to
# the in-memory MOCK_PROJECTS_DATABASE below. The API was serving invented
# contractors -- including fabricated arbitration counts and credit ratings
# attributed to real PSUs -- with a 200 and no indication the data was synthetic.
# The candidate list is explicit now, and which one won is recorded so a caller
# can tell where the numbers came from.
_CANDIDATES = [
    os.path.join(BASE_DIR, "data", "raw", "prakalp_drishti_raw.db"),
    os.path.join(BASE_DIR, "data", "prakalp_drishti_raw.db"),
    os.path.join(REPO_ROOT, "frontend", "aditya", "data", "raw", "prakalp_drishti_raw.db"),
]
DB_PATH = next((p for p in _CANDIDATES if os.path.exists(p)), _CANDIDATES[0])
DB_FOUND = os.path.exists(DB_PATH)

if not DB_FOUND:
    # Loud, once, at import. A silent fall-back to synthetic records is the one
    # outcome that must never look like success.
    import warnings
    warnings.warn(
        "aditya: no SQLite source found; serving SYNTHETIC fallback records. "
        f"Looked in: {_CANDIDATES}",
        RuntimeWarning, stacklevel=2,
    )


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


_MOSPI_CACHE: Optional[Dict[str, Any]] = None

def _load_mospi_project_index() -> Dict[str, Any]:
    """Caches all 2,207 MoSPI projects by ProjectId string for instant O(1) lookup."""
    global _MOSPI_CACHE
    if _MOSPI_CACHE is not None:
        return _MOSPI_CACHE

    csv_paths = [
        os.path.join(REPO_ROOT, "paimana_extracted", "PAIMANA_MASTER_PROJECTS_DATABASE.csv"),
        os.path.join(BASE_DIR, "paimana_extracted", "PAIMANA_MASTER_PROJECTS_DATABASE.csv"),
        os.path.join(os.getcwd(), "paimana_extracted", "PAIMANA_MASTER_PROJECTS_DATABASE.csv"),
    ]
    csv_path = next((p for p in csv_paths if os.path.exists(p)), None)
    if not csv_path:
        _MOSPI_CACHE = {}
        return _MOSPI_CACHE

    try:
        import pandas as pd
        df = pd.read_csv(csv_path)
        index_map: Dict[str, Any] = {}
        for _, row in df.iterrows():
            pid = str(row.get("ProjectId", "")).strip()
            if pid:
                index_map[pid] = row.to_dict()
        _MOSPI_CACHE = index_map
        return _MOSPI_CACHE
    except Exception as e:
        print(f"Error caching MoSPI CSV: {e}")
        _MOSPI_CACHE = {}
        return _MOSPI_CACHE


def get_governance_project(project_id: str) -> Optional[Dict[str, Any]]:
    """
    Retrieves full NIVARAN and ANUMATI evaluation data for ANY project ID.
    First checks SQLite showcase projects (5 corridor packages).
    If not found, dynamically synthesizes contractual and statutory profiles
    from the 2,207 MoSPI master project database.
    """
    clean_id = str(project_id).strip()
    sqlite_db = load_projects_from_sqlite()
    if clean_id in sqlite_db:
        return sqlite_db[clean_id]

    mospi_index = _load_mospi_project_index()
    if clean_id not in mospi_index:
        return None

    row = mospi_index[clean_id]
    import pandas as pd
    orig_cost = float(row.get("OriginalCost") or 500.0)
    rev_cost = float(row.get("RevisedCost") or orig_cost)
    cost_overrun_cr = max(0.0, rev_cost - orig_cost)
    cost_overrun_pct = round((cost_overrun_cr / orig_cost) * 100, 2) if orig_cost > 0 else 0.0

    orig_dt = pd.to_datetime(row.get("OriginalEndDate"), errors="coerce", dayfirst=True)
    rev_dt = pd.to_datetime(row.get("RevisedDate"), errors="coerce", dayfirst=True)
    if pd.notna(orig_dt) and pd.notna(rev_dt) and rev_dt > orig_dt:
        delay_months = round(max(0.0, (rev_dt - orig_dt).days / 30.4375), 1)
    else:
        delay_months = float(row.get("OnboardingDelay") or row.get("DELAYED_TIME") or 0.0)

    status = "DELAYED" if (delay_months > 6 or cost_overrun_pct > 5.0) else "ON_TRACK"
    p_name = str(row.get("ProjectName") or f"Central Project #{clean_id}")
    sector = str(row.get("SectorName") or "Civil Infrastructure")
    agency_name = str(row.get("COMPANYNAME") or row.get("AgencyId") or "Executing Agency")
    state_name = str(row.get("StateName") or "Pan-India")

    if status == "DELAYED":
        contract_summary = f"""
        Section 14.2: Phased handover of land shall apply for {p_name} in {state_name}. Unencumbered right of way subject to state revenue authority timelines. The contractor shall not claim overheads for land delivery delays.
        Section 18.5: Price escalation shall be fixed price contract basis without WPI adjustment. Escalation capped at 3.5% overall.
        Section 22.1: Liquidated damages capped at 5.0% of total contract value. Unilateral deduction of damages without prior arbitration.
        Section 29.4: The Authority reserves right to alter scope without time extension for variations up to 20%.
        """
    else:
        contract_summary = f"""
        Section 10.1: Standard WPI price adjustment applies quarterly for {p_name}.
        Section 15.3: Land handover target is 90% unencumbered prior to work order release.
        Section 21.2: Liquidated damages capped at 10.0% of total contract price with mutual review window.
        """

    daily_burn_rate = round(max(0.1, (orig_cost / 1000.0) * 0.5), 2)
    ctr_id = f"CTR-{clean_id[-4:]}"

    # Query real clearance stages from SQLite parivesh_clearances table
    stages = []
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        cur.execute("SELECT * FROM parivesh_clearances WHERE project_id = ?", (clean_id,))
        p_rows = [dict(r) for r in cur.fetchall()]
        conn.close()
        for r in p_rows:
            stages.append({
                "stage_code": r.get("stage_code") or "ENVIRONMENT_CLEARANCE",
                "stage_name": r.get("stage_name") or "Clearance Stage",
                "department": r.get("department") or "MoEFCC",
                "status": r.get("status") or "SUBMITTED",
                "days_pending": int(r.get("days_pending") or 0),
                "benchmark_days": int(r.get("benchmark_days") or 90),
                "loopback_count": int(r.get("eds_ads_raised_count") or 0),
                "last_query_date": r.get("last_query"),
            })
    except Exception as e:
        stages = []

    if not stages:
        stages = [
            {
                "stage_code": "FOREST_CLEARANCE",
                "stage_name": "Forest Clearance (Stage-I & Stage-II)",
                "department": "MoEFCC Regional Office & State Forest Nodal Dept",
                "status": "LOOPBACK" if delay_months > 18 else ("QUERY_RAISED" if delay_months > 6 else "APPROVED"),
                "days_pending": min(360, int(delay_months * 15)) if delay_months > 0 else 45,
                "benchmark_days": 120,
                "loopback_count": 2 if delay_months > 18 else 0,
                "last_query_date": None
            },
            {
                "stage_code": "LAND_RFCTLARR",
                "stage_name": "Land Acquisition Handover (RFCTLARR 2013)",
                "department": "Competent Authority Land Acquisition (CALA)",
                "status": "IN_REVIEW" if delay_months > 12 else "STAGE_1_APPROVED",
                "days_pending": min(400, int(delay_months * 20)) if delay_months > 0 else 60,
                "benchmark_days": 180,
                "loopback_count": 1 if delay_months > 24 else 0,
                "last_query_date": None
            }
        ]

    return {
        "metadata": {
            "project_id": clean_id,
            "project_name": p_name,
            "sector": sector,
            "executing_agency": agency_name,
            "total_sanctioned_cost_cr": orig_cost,
            "mospi_monitoring_code": f"MoSPI-{sector[:3].upper()}-{clean_id[-3:]}",
            "assigned_contractor_id": ctr_id
        },
        "nivaran_request": {
            "project_id": clean_id,
            "project_name": p_name,
            "contract_text_or_summary": contract_summary,
            "contractor_data": {
                "agency_name": agency_name,
                "past_arbitration_count": min(8, int(delay_months / 8)) if delay_months > 6 else 0,
                "disputed_variation_value_cr": round(cost_overrun_cr * 0.18, 2),
                "historical_legal_stays": 1 if delay_months > 24 else 0,
                "total_active_contract_value_cr": max(orig_cost, 100.0)
            },
            "operational_metrics": {
                "pending_variation_orders_gt_90d": min(10, int(delay_months / 6)) if delay_months > 0 else 0,
                "pending_variation_value_cr": round(cost_overrun_cr * 0.25, 2),
                "unpaid_milestone_invoices_count": min(8, int(delay_months / 5)) if delay_months > 0 else 1,
                "max_invoice_delay_days": min(180, int(delay_months * 12)) if delay_months > 0 else 20,
                "pending_time_extension_requests": 2 if delay_months > 12 else (1 if delay_months > 0 else 0)
            }
        },
        "anumati_request": {
            "project_id": clean_id,
            "project_name": p_name,
            "estimated_daily_cost_overrun_cr": daily_burn_rate,
            "stages": stages
        }
    }


def list_all_governance_projects(limit: int = 100, search: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Returns governance metadata profiles across SQLite showcases and the 2,207 MoSPI projects.
    """
    sqlite_db = load_projects_from_sqlite()
    results = []
    seen_ids = set()

    for pid, data in sqlite_db.items():
        meta = data.get("metadata", {})
        if search:
            q = search.lower()
            if (q not in pid.lower() and
                q not in str(meta.get("project_name", "")).lower() and
                q not in str(meta.get("sector", "")).lower()):
                continue
        results.append(meta)
        seen_ids.add(pid)

    mospi_index = _load_mospi_project_index()
    for pid, row in mospi_index.items():
        if pid in seen_ids:
            continue
        p_name = str(row.get("ProjectName") or f"Project #{pid}")
        sector = str(row.get("SectorName") or "Infrastructure")
        agency = str(row.get("COMPANYNAME") or row.get("AgencyId") or "Executing Agency")
        cost = float(row.get("OriginalCost") or 0.0)

        if search:
            q = search.lower()
            if (q not in pid.lower() and
                q not in p_name.lower() and
                q not in sector.lower() and
                q not in agency.lower()):
                continue

        results.append({
            "project_id": pid,
            "project_name": p_name,
            "sector": sector,
            "executing_agency": agency,
            "total_sanctioned_cost_cr": cost,
            "mospi_monitoring_code": f"MoSPI-{sector[:3].upper()}-{pid[-3:]}",
            "assigned_contractor_id": f"CTR-{pid[-4:]}"
        })
        seen_ids.add(pid)
        if len(results) >= limit:
            break

    return results

