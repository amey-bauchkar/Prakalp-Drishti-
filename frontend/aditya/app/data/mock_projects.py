"""
PRAKALP-DRISHTI Enterprise Intelligence Datasets
Contains realistic MoSPI / PAIMANA schema project metadata, comprehensive contractor litigation
historical database, DPR clause rules, and statutory clearance benchmarks.
"""

# ==============================================================================
# CONTRACTORS LITIGATION & PERFORMANCE DATABASE
# ==============================================================================
CONTRACTORS_DATABASE = {
    "CTR-IND-001": {
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
        "blacklisting_risk_flag": False,
        "litigation_exposure_index": 81.65,
        "primary_dispute_triggers": ["Land Handover Delays", "Steel/Cement Price Escalation Capping"]
    },
    "CTR-IND-002": {
        "contractor_id": "CTR-IND-002",
        "agency_name": "IRCON-Kalpataru Joint Venture",
        "category": "Railways & Heavy Trackwork",
        "rating_class": "Class-1A Super",
        "past_arbitration_count": 1,
        "disputed_variation_value_cr": 15.0,
        "historical_legal_stays": 0,
        "total_active_contract_value_cr": 3500.0,
        "completed_projects_count": 34,
        "financial_solvency_rating": "AA+",
        "blacklisting_risk_flag": False,
        "litigation_exposure_index": 12.30,
        "primary_dispute_triggers": ["Signal Equipment Import Clearance"]
    },
    "CTR-IND-003": {
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
        "blacklisting_risk_flag": True,
        "litigation_exposure_index": 92.80,
        "primary_dispute_triggers": ["Unilateral Scope Variations", "Utility Shifting Billing Stalls"]
    },
    "CTR-IND-004": {
        "contractor_id": "CTR-IND-004",
        "agency_name": "GreenGrid Energy Infra Ltd",
        "category": "Power & Transmission",
        "rating_class": "Class-1 Special",
        "past_arbitration_count": 0,
        "disputed_variation_value_cr": 0.0,
        "historical_legal_stays": 0,
        "total_active_contract_value_cr": 950.0,
        "completed_projects_count": 22,
        "financial_solvency_rating": "AAA",
        "blacklisting_risk_flag": False,
        "litigation_exposure_index": 5.0,
        "primary_dispute_triggers": []
    },
    "CTR-IND-005": {
        "contractor_id": "CTR-IND-005",
        "agency_name": "Oceanic Maritime Developers Pvt Ltd",
        "category": "Ports & Coastal Structures",
        "rating_class": "Class-1A Super",
        "past_arbitration_count": 3,
        "disputed_variation_value_cr": 120.0,
        "historical_legal_stays": 1,
        "total_active_contract_value_cr": 2400.0,
        "completed_projects_count": 15,
        "financial_solvency_rating": "AA",
        "blacklisting_risk_flag": False,
        "litigation_exposure_index": 48.50,
        "primary_dispute_triggers": ["EIA Clearance Suspension", "Dredging Quantity Re-measurement"]
    }
}


# ==============================================================================
# MOSPI / PAIMANA INFRASTRUCTURE PROJECTS DATABASE
# ==============================================================================
MOCK_PROJECTS_DATABASE = {
    "PRJ-NH-2026-089": {
        "metadata": {
            "project_id": "PRJ-NH-2026-089",
            "project_name": "Bharatmala Express Highway Expansion (Package 4)",
            "sector": "Roads & Highways",
            "executing_agency": "NHAI / MoRTH",
            "total_sanctioned_cost_cr": 3450.0,
            "mospi_monitoring_code": "MoSPI-HWY-2026-089",
            "assigned_contractor_id": "CTR-IND-001"
        },
        "nivaran_request": {
            "project_id": "PRJ-NH-2026-089",
            "project_name": "Bharatmala Express Highway Expansion (Package 4)",
            "contract_text_or_summary": """
            Section 14.2: Phased handover of land shall apply. Unencumbered right of way subject to state land acquisition authority timelines. The contractor shall not claim overheads for land delivery delays beyond 180 days.
            Section 18.5: Price escalation shall be fixed price contract basis without WPI adjustment for steel and cement. Escalation capped at 3.5% overall.
            Section 22.1: Liquidated damages capped at 5.0% of total contract value. Unilateral deduction of damages without prior arbitration alignment.
            Section 29.4: The Authority reserves right to alter scope without time extension for variations up to 20% of original contract value.
            """,
            "contractor_data": {
                "agency_name": "L1 Infrastructure Projects India Ltd",
                "past_arbitration_count": 4,
                "disputed_variation_value_cr": 285.5,
                "historical_legal_stays": 2,
                "total_active_contract_value_cr": 1200.0
            },
            "operational_metrics": {
                "pending_variation_orders_gt_90d": 5,
                "pending_variation_value_cr": 68.4,
                "unpaid_milestone_invoices_count": 3,
                "max_invoice_delay_days": 115,
                "pending_time_extension_requests": 2
            }
        },
        "anumati_request": {
            "project_id": "PRJ-NH-2026-089",
            "project_name": "Bharatmala Express Highway Expansion (Package 4)",
            "estimated_daily_cost_overrun_cr": 1.45,
            "stages": [
                {
                    "stage_code": "FOREST_CLEARANCE",
                    "stage_name": "Forest Clearance (Stage-I & Stage-II)",
                    "department": "MoEFCC Regional Office & State Forest Nodal Dept",
                    "status": "LOOPBACK",
                    "days_pending": 210,
                    "benchmark_days": 120,
                    "loopback_count": 3,
                    "last_query_date": "2026-07-10"
                },
                {
                    "stage_code": "WILDLIFE_CLEARANCE",
                    "stage_name": "Wildlife Clearance (NBWL)",
                    "department": "National Board for Wildlife",
                    "status": "STAGE_1_APPROVED",
                    "days_pending": 75,
                    "benchmark_days": 90,
                    "loopback_count": 0,
                    "last_query_date": None
                },
                {
                    "stage_code": "ENVIRONMENT_CLEARANCE",
                    "stage_name": "Environmental Clearance (EIA/MoEFCC)",
                    "department": "EAC Ministry of Environment",
                    "status": "APPROVED",
                    "days_pending": 100,
                    "benchmark_days": 105,
                    "loopback_count": 1,
                    "last_query_date": "2026-03-12"
                },
                {
                    "stage_code": "LAND_RFCTLARR",
                    "stage_name": "Land Acquisition Handover (RFCTLARR 2013)",
                    "department": "District Revenue Collectorate",
                    "status": "QUERY_RAISED",
                    "days_pending": 240,
                    "benchmark_days": 180,
                    "loopback_count": 2,
                    "last_query_date": "2026-06-01"
                },
                {
                    "stage_code": "UTILITY_ROW",
                    "stage_name": "Railways / Defense / Utility Shifting",
                    "department": "State Electricity Transmission Board",
                    "status": "SUBMITTED",
                    "days_pending": 45,
                    "benchmark_days": 60,
                    "loopback_count": 0,
                    "last_query_date": None
                }
            ]
        }
    },
    "PRJ-RL-2026-104": {
        "metadata": {
            "project_id": "PRJ-RL-2026-104",
            "project_name": "Dedicated Heavy Freight Rail Corridor Phase-II",
            "sector": "Railways",
            "executing_agency": "DFCCIL / Ministry of Railways",
            "total_sanctioned_cost_cr": 8200.0,
            "mospi_monitoring_code": "MoSPI-RLW-2026-104",
            "assigned_contractor_id": "CTR-IND-002"
        },
        "nivaran_request": {
            "project_id": "PRJ-RL-2026-104",
            "project_name": "Dedicated Heavy Freight Rail Corridor Phase-II",
            "contract_text_or_summary": """
            Section 10.1: Standard WPI price adjustment applies quarterly.
            Section 15.3: Land handover target is 90% unencumbered prior to work order.
            Section 21.2: Liquidated damages capped at 10.0% of total contract price.
            """,
            "contractor_data": {
                "agency_name": "IRCON-Kalpataru Joint Venture",
                "past_arbitration_count": 1,
                "disputed_variation_value_cr": 15.0,
                "historical_legal_stays": 0,
                "total_active_contract_value_cr": 3500.0
            },
            "operational_metrics": {
                "pending_variation_orders_gt_90d": 1,
                "pending_variation_value_cr": 8.5,
                "unpaid_milestone_invoices_count": 0,
                "max_invoice_delay_days": 20,
                "pending_time_extension_requests": 1
            }
        },
        "anumati_request": {
            "project_id": "PRJ-RL-2026-104",
            "project_name": "Dedicated Heavy Freight Rail Corridor Phase-II",
            "estimated_daily_cost_overrun_cr": 2.10,
            "stages": [
                {
                    "stage_code": "FOREST_CLEARANCE",
                    "stage_name": "Forest Clearance (Stage-I & Stage-II)",
                    "department": "MoEFCC Regional Office",
                    "status": "APPROVED",
                    "days_pending": 115,
                    "benchmark_days": 120,
                    "loopback_count": 0,
                    "last_query_date": None
                },
                {
                    "stage_code": "WILDLIFE_CLEARANCE",
                    "stage_name": "Wildlife Clearance (NBWL)",
                    "department": "National Board for Wildlife",
                    "status": "APPROVED",
                    "days_pending": 85,
                    "benchmark_days": 90,
                    "loopback_count": 0,
                    "last_query_date": None
                },
                {
                    "stage_code": "ENVIRONMENT_CLEARANCE",
                    "stage_name": "Environmental Clearance (EIA/MoEFCC)",
                    "department": "EAC Ministry of Environment",
                    "status": "APPROVED",
                    "days_pending": 95,
                    "benchmark_days": 105,
                    "loopback_count": 0,
                    "last_query_date": None
                },
                {
                    "stage_code": "LAND_RFCTLARR",
                    "stage_name": "Land Acquisition Handover (RFCTLARR 2013)",
                    "department": "District Collectorate",
                    "status": "STAGE_1_APPROVED",
                    "days_pending": 160,
                    "benchmark_days": 180,
                    "loopback_count": 1,
                    "last_query_date": "2026-05-10"
                },
                {
                    "stage_code": "UTILITY_ROW",
                    "stage_name": "Railways / Defense / Utility Shifting",
                    "department": "Defense Estate Office",
                    "status": "SUBMITTED",
                    "days_pending": 30,
                    "benchmark_days": 60,
                    "loopback_count": 0,
                    "last_query_date": None
                }
            ]
        }
    },
    "PRJ-MT-2026-042": {
        "metadata": {
            "project_id": "PRJ-MT-2026-042",
            "project_name": "Urban Metro Rapid Transit Elevated Corridor",
            "sector": "Urban Transit",
            "executing_agency": "MahaMetro / Urban Development Dept",
            "total_sanctioned_cost_cr": 5120.0,
            "mospi_monitoring_code": "MoSPI-MTR-2026-042",
            "assigned_contractor_id": "CTR-IND-003"
        },
        "nivaran_request": {
            "project_id": "PRJ-MT-2026-042",
            "project_name": "Urban Metro Rapid Transit Elevated Corridor",
            "contract_text_or_summary": """
            Section 8.1: Unilateral variation orders up to 25% without rate revision or time extension.
            Section 12.3: Liquidated damages capped at 5.0% of contract value. Mandatory summary penalty deduction.
            Section 19.1: Phased handover of land in dense urban right of way. No overhead claims permitted for traffic diversion holds.
            """,
            "contractor_data": {
                "agency_name": "Metro-Tech Infra Solutions Consortium",
                "past_arbitration_count": 6,
                "disputed_variation_value_cr": 410.0,
                "historical_legal_stays": 3,
                "total_active_contract_value_cr": 1850.0
            },
            "operational_metrics": {
                "pending_variation_orders_gt_90d": 7,
                "pending_variation_value_cr": 115.0,
                "unpaid_milestone_invoices_count": 4,
                "max_invoice_delay_days": 140,
                "pending_time_extension_requests": 3
            }
        },
        "anumati_request": {
            "project_id": "PRJ-MT-2026-042",
            "project_name": "Urban Metro Rapid Transit Elevated Corridor",
            "estimated_daily_cost_overrun_cr": 1.85,
            "stages": [
                {
                    "stage_code": "FOREST_CLEARANCE",
                    "stage_name": "Forest Clearance (Stage-I & Stage-II)",
                    "department": "MoEFCC Forest Advisory Committee",
                    "status": "APPROVED",
                    "days_pending": 110,
                    "benchmark_days": 120,
                    "loopback_count": 0,
                    "last_query_date": None
                },
                {
                    "stage_code": "WILDLIFE_CLEARANCE",
                    "stage_name": "Wildlife Clearance (NBWL)",
                    "department": "National Board for Wildlife",
                    "status": "NOT_APPLICABLE",
                    "days_pending": 0,
                    "benchmark_days": 90,
                    "loopback_count": 0,
                    "last_query_date": None
                },
                {
                    "stage_code": "ENVIRONMENT_CLEARANCE",
                    "stage_name": "Environmental Clearance (EIA/MoEFCC)",
                    "department": "State Level Environment Impact Assessment Authority",
                    "status": "STAGE_1_APPROVED",
                    "days_pending": 130,
                    "benchmark_days": 105,
                    "loopback_count": 1,
                    "last_query_date": "2026-06-20"
                },
                {
                    "stage_code": "LAND_RFCTLARR",
                    "stage_name": "Land Acquisition Handover (RFCTLARR 2013)",
                    "department": "Municipal Land Acquisition Cell",
                    "status": "QUERY_RAISED",
                    "days_pending": 220,
                    "benchmark_days": 180,
                    "loopback_count": 2,
                    "last_query_date": "2026-05-15"
                },
                {
                    "stage_code": "UTILITY_ROW",
                    "stage_name": "Railways / Defense / Utility Shifting",
                    "department": "State Gas Distribution & Water Supply Board",
                    "status": "LOOPBACK",
                    "days_pending": 150,
                    "benchmark_days": 60,
                    "loopback_count": 4,
                    "last_query_date": "2026-08-01"
                }
            ]
        }
    }
}
