from typing import List, Optional
from pydantic import BaseModel, Field


class ClearanceStageDetail(BaseModel):
    stage_code: str = Field(..., example="FOREST_CLEARANCE", description="FOREST, WILDLIFE, ENVIRONMENT, LAND_RFCTLARR, UTILITY_ROW")
    stage_name: str = Field(..., example="Forest Clearance (Stage-I & Stage-II)")
    department: str = Field(..., example="MoEFCC / State Forest Dept")
    status: str = Field(..., example="QUERY_RAISED", description="NOT_APPLICABLE, NOT_STARTED, SUBMITTED, QUERY_RAISED, STAGE_1_APPROVED, APPROVED, REJECTED, LOOPBACK")
    days_pending: int = Field(..., ge=0, description="Actual days elapsed in current stage")
    benchmark_days: int = Field(..., gt=0, description="MoSPI/MoEFCC standard benchmark SLA in days")
    loopback_count: int = Field(0, ge=0, description="Number of query/clarification iterations between central & state depts")
    last_query_date: Optional[str] = Field(None, example="2026-06-15")


class ClearanceStatusRequest(BaseModel):
    project_id: str = Field(..., example="PRJ-NH-2026-089")
    project_name: str = Field(..., example="Bharatmala Corridor Expansion Phase-IV")
    estimated_daily_cost_overrun_cr: float = Field(..., ge=0.0, description="Estimated economic loss per day of delay in Crore INR")
    stages: List[ClearanceStageDetail]


class StageStagnationBreakdown(BaseModel):
    stage_code: str
    stage_name: str
    department: str
    days_pending: int
    benchmark_days: int
    stagnation_ratio: float = Field(..., description="days_pending / benchmark_days")
    is_stagnated: bool
    paperwork_loopback_detected: bool


class ClearanceStatusResponse(BaseModel):
    project_id: str
    project_name: str
    overall_clearance_status: str = Field(..., description="APPROVED, IN_PROGRESS, or STALLED")
    regulatory_stagnation_index: float = Field(..., description="Aggregate RSI score (0.0 to >3.0)")
    bottleneck_department: str = Field(..., description="Name of primary department causing stagnation")
    days_overdue: int = Field(..., description="Total days overdue past benchmark across key bottleneck")
    economic_impact_delay_risk: str = Field(..., description="Quantified monetary and interest during construction impact")
    pmo_escalation_flag: bool = Field(..., description="True if project warrants PMO PRAGATI level intervention")
    paperwork_loopbacks_detected: bool = Field(..., description="True if central-state administrative loops exist")
    stage_breakdown: List[StageStagnationBreakdown]
    recommended_escalation_memo: str = Field(..., description="Executive brief for inter-departmental escalation")
