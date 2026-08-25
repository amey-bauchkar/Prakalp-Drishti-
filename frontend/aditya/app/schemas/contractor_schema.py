from typing import List, Optional
from pydantic import BaseModel, Field


class ContractorProfile(BaseModel):
    contractor_id: str = Field(..., example="CTR-IND-001")
    agency_name: str = Field(..., example="L1 Infrastructure Projects India Ltd")
    category: str = Field(..., example="Highways & Expressways")
    rating_class: str = Field(..., example="Class-1A Super")
    past_arbitration_count: int = Field(..., ge=0)
    disputed_variation_value_cr: float = Field(..., ge=0.0)
    historical_legal_stays: int = Field(..., ge=0)
    total_active_contract_value_cr: float = Field(..., gt=0.0)
    completed_projects_count: int = Field(..., ge=0)
    financial_solvency_rating: str = Field(..., example="AAA")
    blacklisting_risk_flag: bool
    litigation_exposure_index: float = Field(..., ge=0.0, le=100.0)
    primary_dispute_triggers: List[str]


class ContractorAssessmentRequest(BaseModel):
    contractor_id: Optional[str] = Field(None, example="CTR-IND-001")
    agency_name: str = Field(..., example="L1 Infrastructure Projects India Ltd")
    past_arbitration_count: int = Field(..., ge=0)
    disputed_variation_value_cr: float = Field(..., ge=0.0)
    historical_legal_stays: int = Field(..., ge=0)
    total_active_contract_value_cr: float = Field(..., gt=0.0)


class ContractorAssessmentResponse(BaseModel):
    contractor_id: str
    agency_name: str
    litigation_exposure_index: float
    risk_tier: str = Field(..., description="LOW, MODERATE, ELEVATED, HIGH, or SEVERE")
    financial_solvency_rating: str
    blacklisting_risk_flag: bool
    recommended_vetting_action: str
