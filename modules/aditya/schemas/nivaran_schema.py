from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field, model_validator


class FlaggedClause(BaseModel):
    category: str = Field(..., description="High-risk clause category identifier")
    clause_title: str = Field(..., description="Name or clause number in contract")
    snippet: str = Field(..., description="Extracted clause snippet text")
    clause_risk_score: float = Field(..., ge=0.0, le=1.0, description="Risk score assigned to this clause")
    risk_reason: str = Field(..., description="Explanation of potential dispute trigger")
    severity: str = Field(..., description="CRITICAL, HIGH, MEDIUM, or LOW")


class ContractorLitigationInput(BaseModel):
    agency_name: str = Field(default="L1 Infra Developers Pvt Ltd", description="Executing contractor agency name")
    past_arbitration_count: int = Field(default=0, ge=0, description="Number of arbitration cases filed in last 5 years")
    disputed_variation_value_cr: float = Field(default=0.0, ge=0.0, description="Total value under dispute in Crore INR")
    historical_legal_stays: int = Field(default=0, ge=0, description="Number of injunctions/stays granted in past projects")
    total_active_contract_value_cr: float = Field(default=1000.0, gt=0.0, description="Executing contract value in Crore INR")


class OperationalMetricsInput(BaseModel):
    pending_variation_orders_gt_90d: int = Field(default=0, ge=0, description="Count of variation orders pending >90 days")
    pending_variation_value_cr: float = Field(default=0.0, ge=0.0, description="Financial quantum of pending variation orders")
    unpaid_milestone_invoices_count: int = Field(default=0, ge=0, description="Number of milestone invoices delayed beyond credit terms")
    max_invoice_delay_days: int = Field(default=0, ge=0, description="Maximum delay in invoice payment (days)")
    pending_time_extension_requests: int = Field(default=0, ge=0, description="Number of pending EOT (Extension of Time) applications")


class DisputeRiskAssessmentRequest(BaseModel):
    project_id: str = Field(default="PRJ-NH-2026-089", description="Project ID identifier")
    project_name: str = Field(default="Sovereign Infrastructure Project", description="Project Name")
    contract_text_or_summary: str = Field(default="", description="Raw text or DPR contract clause summary for NLP classification")
    contractor_data: ContractorLitigationInput = Field(default_factory=ContractorLitigationInput)
    operational_metrics: OperationalMetricsInput = Field(default_factory=OperationalMetricsInput)

    @model_validator(mode='before')
    @classmethod
    def normalize_input_fields(cls, data: Any) -> Any:
        if not isinstance(data, dict):
            return data
        
        # Normalize contract text aliases
        if "contract_text_or_summary" not in data or not data["contract_text_or_summary"]:
            if "raw_contract_text" in data and data["raw_contract_text"]:
                data["contract_text_or_summary"] = data["raw_contract_text"]
            elif "contract_text" in data and data["contract_text"]:
                data["contract_text_or_summary"] = data["contract_text"]
            else:
                data["contract_text_or_summary"] = ""

        # Normalize project_name
        if "project_name" not in data or not data["project_name"]:
            data["project_name"] = data.get("project_id", "Sovereign Infrastructure Project")

        # Normalize contractor_data / contractor_profile aliases
        if "contractor_data" not in data or not data["contractor_data"]:
            if "contractor_profile" in data and isinstance(data["contractor_profile"], dict):
                cp = data["contractor_profile"]
                data["contractor_data"] = {
                    "agency_name": cp.get("agency_name") or cp.get("contractor_name") or cp.get("contractor_id", "L1 Infra Developers Pvt Ltd"),
                    "past_arbitration_count": int(cp.get("past_arbitration_count") or 0),
                    "disputed_variation_value_cr": float(cp.get("disputed_variation_value_cr") or cp.get("disputed_claims_value_cr") or 0.0),
                    "historical_legal_stays": int(cp.get("historical_legal_stays") or cp.get("historical_stays") or 0),
                    "total_active_contract_value_cr": float(cp.get("total_active_contract_value_cr") or cp.get("contract_value_cr") or 1000.0)
                }
            else:
                data["contractor_data"] = {
                    "agency_name": "L1 Infra Developers Pvt Ltd",
                    "past_arbitration_count": 0,
                    "disputed_variation_value_cr": 0.0,
                    "historical_legal_stays": 0,
                    "total_active_contract_value_cr": 1000.0
                }

        # Normalize operational_metrics
        if "operational_metrics" not in data or not data["operational_metrics"]:
            data["operational_metrics"] = {}
        elif isinstance(data["operational_metrics"], dict):
            om = data["operational_metrics"]
            # Convert any non-standard keys to standard schema
            data["operational_metrics"] = {
                "pending_variation_orders_gt_90d": int(om.get("pending_variation_orders_gt_90d") or om.get("pending_variation_orders_count") or 0),
                "pending_variation_value_cr": float(om.get("pending_variation_value_cr") or om.get("pending_variation_orders_cr") or 0.0),
                "unpaid_milestone_invoices_count": int(om.get("unpaid_milestone_invoices_count") or 0),
                "max_invoice_delay_days": int(om.get("max_invoice_delay_days") or 0),
                "pending_time_extension_requests": int(om.get("pending_time_extension_requests") or 0)
            }

        return data


class DisputeRiskAssessmentResponse(BaseModel):
    project_id: str
    project_name: str
    clause_risk_score: float = Field(..., ge=0.0, le=1.0, description="Aggregate contractual clause risk score")
    contractor_litigation_index: float = Field(..., ge=0.0, le=100.0, description="Agency litigation risk exposure index (0-100)")
    litigation_probability: float = Field(..., ge=0.0, le=1.0, description="Predicted probability of litigation/arbitration")
    dispute_risk_level: str = Field(..., description="LOW, MEDIUM, HIGH, or CRITICAL")
    flagged_clauses: List[FlaggedClause]
    recommended_preemptive_action: str = Field(..., description="Specific administrative action recommendation")

