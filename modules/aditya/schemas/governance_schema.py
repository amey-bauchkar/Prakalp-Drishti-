from typing import Optional, Dict, Any
from pydantic import BaseModel, Field

try:
    from .nivaran_schema import DisputeRiskAssessmentResponse
    from .anumati_schema import ClearanceStatusResponse
except (ImportError, ValueError):
    try:
        from modules.aditya.schemas.nivaran_schema import DisputeRiskAssessmentResponse
        from modules.aditya.schemas.anumati_schema import ClearanceStatusResponse
    except ImportError:
        from app.schemas.nivaran_schema import DisputeRiskAssessmentResponse
        from app.schemas.anumati_schema import ClearanceStatusResponse


class ProjectMetadata(BaseModel):
    project_id: str
    project_name: str
    sector: str = Field(..., example="Roads & Highways")
    executing_agency: str = Field(..., example="NHAI / Ministry of Road Transport & Highways")
    total_sanctioned_cost_cr: float
    mospi_monitoring_code: str
    assigned_contractor_id: Optional[str] = None


class CombinedRiskProfileResponse(BaseModel):
    project_metadata: ProjectMetadata
    overall_administrative_risk_score: float = Field(..., ge=0.0, le=100.0, description="Combined PRAKALP-DRISHTI Administrative Risk Rating (0=Safe, 100=Critical Risk)")
    governance_risk_category: str = Field(..., description="LOW, MODERATE, HIGH, CRITICAL")
    nivaran_assessment: DisputeRiskAssessmentResponse
    anumati_assessment: ClearanceStatusResponse
    executive_summary_directive: str = Field(..., description="Integrated Decision Intelligence Directive for Cabinet Sec / MoSPI / PMO")
    operational_metrics: Optional[Dict[str, Any]] = None

