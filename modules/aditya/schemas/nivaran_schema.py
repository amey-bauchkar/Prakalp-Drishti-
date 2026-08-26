from typing import List, Optional
from pydantic import BaseModel, Field


class FlaggedClause(BaseModel):
    category: str = Field(..., description="High-risk clause category identifier")
    clause_title: str = Field(..., description="Name or clause number in contract")
    snippet: str = Field(..., description="Extracted clause snippet text")
    clause_risk_score: float = Field(..., ge=0.0, le=1.0, description="Risk score assigned to this clause")
    risk_reason: str = Field(..., description="Explanation of potential dispute trigger")
    severity: str = Field(..., description="CRITICAL, HIGH, MEDIUM, or LOW")


class ContractorLitigationInput(BaseModel):
    agency_name: str = Field(..., example="L1 Infra Developers Pvt Ltd")
    past_arbitration_count: int = Field(0, ge=0, description="Number of arbitration cases filed in last 5 years")
    disputed_variation_value_cr: float = Field(0.0, ge=0.0, description="Total value under dispute in Crore INR")
    historical_legal_stays: int = Field(0, ge=0, description="Number of injunctions/stays granted in past projects")
    total_active_contract_value_cr: float = Field(..., gt=0.0, description="Executing contract value in Crore INR")


class OperationalMetricsInput(BaseModel):
    pending_variation_orders_gt_90d: int = Field(0, ge=0, description="Count of variation orders pending >90 days")
    pending_variation_value_cr: float = Field(0.0, ge=0.0, description="Financial quantum of pending variation orders")
    unpaid_milestone_invoices_count: int = Field(0, ge=0, description="Number of milestone invoices delayed beyond credit terms")
    max_invoice_delay_days: int = Field(0, ge=0, description="Maximum delay in invoice payment (days)")
    pending_time_extension_requests: int = Field(0, ge=0, description="Number of pending EOT (Extension of Time) applications")


class DisputeRiskAssessmentRequest(BaseModel):
    project_id: str = Field(..., example="PRJ-NH-2026-089")
    project_name: str = Field(..., example="Bharatmala Corridor Expansion Phase-IV")
    contract_text_or_summary: str = Field(..., description="Raw text or DPR contract clause summary for NLP classification")
    contractor_data: ContractorLitigationInput
    operational_metrics: OperationalMetricsInput


class DisputeRiskAssessmentResponse(BaseModel):
    project_id: str
    project_name: str
    clause_risk_score: float = Field(..., ge=0.0, le=1.0, description="Aggregate contractual clause risk score")
    contractor_litigation_index: float = Field(..., ge=0.0, le=100.0, description="Agency litigation risk exposure index (0-100)")
    litigation_probability: float = Field(..., ge=0.0, le=1.0, description="Predicted probability of litigation/arbitration")
    dispute_risk_level: str = Field(..., description="LOW, MEDIUM, HIGH, or CRITICAL")
    flagged_clauses: List[FlaggedClause]
    recommended_preemptive_action: str = Field(..., description="Specific administrative action recommendation")
