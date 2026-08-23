"""
PRAKALP-DRISHTI: Universal Data Contracts & Schema Specification
Defines Pydantic v2 schemas for Lineage, Facts, Forecasts, Graph Cascades,
Capital Allocation, and Cabinet Briefings.
"""

from typing import List, Dict, Optional, Literal, Any
from pydantic import BaseModel, Field
from datetime import datetime

class LineageRef(BaseModel):
    query_sha256: str = Field(..., description="SHA-256 hash of the canonical SQL/query used to compute this fact")
    dataset_sha256: str = Field(..., description="SHA-256 hash of the data snapshot version")
    model_sha256: str = Field(..., description="SHA-256 hash of the model weights and hyperparameter config")
    merkle_root: str = Field(..., description="Root hash of the audit Merkle tree")
    merkle_path: Optional[List[str]] = Field(default_factory=list, description="Merkle inclusion path hashes for verification")

class Uncertainty(BaseModel):
    p10: float = Field(..., description="10th percentile optimistic bound")
    p50: float = Field(..., description="50th percentile median forecast")
    p80: float = Field(..., description="80th percentile conservative bound")
    p95: float = Field(..., description="95th percentile worst-case tail bound")
    alpha_coverage: float = Field(default=0.90, description="Finite-sample marginal coverage level (e.g. 0.90 for 90%)")
    is_monotone_guaranteed: bool = Field(default=True, description="Strictly verified P10 <= P50 <= P80 <= P95")

class Fact(BaseModel):
    fact_id: str = Field(..., description="Unique deterministic fact identifier (e.g. fact_cost_proj_400188)")
    value: float = Field(..., description="Numeric scalar value")
    formatted_value: str = Field(..., description="Locale-formatted display string (e.g. '₹1,250.40 Cr' or '73.2%')")
    unit: str = Field(..., description="Physical or currency unit: INR_CR, MONTHS, PERCENT, DATE, SCORE")
    fact_type: Literal["probability", "currency_cr", "duration_months", "date", "count", "score"] = Field(...)
    label: str = Field(..., description="Human-readable title of the metric")
    uncertainty: Optional[Uncertainty] = Field(default=None, description="Uncertainty interval if probabilistic")
    lineage: Optional[LineageRef] = Field(default=None, description="Audit trail and cryptographic provenance")

class ProjectForecast(BaseModel):
    project_id: str
    project_name: str
    canonical_entity: str
    sector: str
    state: str
    original_cost_cr: float
    revised_cost_cr: float
    cost_overrun_cr: float
    cost_overrun_perc: float
    baseline_reset_count: int
    rebaselined: bool
    physical_progress_perc: float = Field(default=0.0, description="On-ground physical progress percentage from MoSPI")
    sanction_date: str
    original_end_date: str
    revised_end_date: str
    p10_date: str
    p50_date: str
    p80_date: str
    p95_date: str
    prob_target_met_official: float
    prob_target_met_rebaselined: float
    competing_risk_state: Literal["ACTIVE", "NEVER"] = "ACTIVE"
    facts: Dict[str, Fact] = Field(default_factory=dict)

class DependencyNode(BaseModel):
    project_id: str
    project_name: str
    canonical_entity: str
    sector: str
    state: str
    cost_cr: float
    free_float_months: float
    total_float_months: float
    absorbed_delay_months: float
    propagated_delay_months: float
    locked_capital_p50_cr: float
    locked_capital_p95_cr: float
    shapley_criticality_phi: float

class DependencyEdge(BaseModel):
    source_id: str
    target_id: str
    edge_type: Literal["statutory", "contractual", "physical_network", "spatial_corridor"]
    lead_time_months: float
    spatial_distance_km: Optional[float] = None

class DependencySubGraph(BaseModel):
    center_project_id: str
    nodes: List[DependencyNode]
    edges: List[DependencyEdge]
    total_cascade_locked_p50_cr: float
    total_cascade_locked_p95_cr: float
    acyclic_dag_verified: bool

class AllocationRequest(BaseModel):
    budget_pool_cr: float = Field(default=10000.0, description="Available capex pool in Crore INR")
    risk_dial_kappa: float = Field(default=0.70, ge=0.0, le=1.0, description="Weight on CVaR90 tail loss vs expected loss")
    enforce_ner_floor: bool = Field(default=True, description="Enforce statutory 10% capex floor for North-Eastern Region")
    agency_absorption_multiplier: float = Field(default=1.25, description="Agency historical burn rate multiplier ceiling")

class ProjectAllocation(BaseModel):
    project_id: str
    project_name: str
    canonical_entity: str
    state: str
    is_ner: bool
    requested_capex_cr: float
    allocated_capex_cr: float
    completion_yield_phi: float
    systemic_benefit_gamma: float

class AllocationResult(BaseModel):
    total_budget_pool_cr: float
    total_allocated_cr: float
    expected_completion_yield: float
    cvar90_tail_loss: float
    ner_allocated_cr: float
    ner_share_perc: float
    ner_floor_met: bool
    shadow_price_budget_pi: float
    shadow_price_ner_pi: float
    agency_shadow_prices: Dict[str, float]
    allocations: List[ProjectAllocation]
    closure_error_perc: float
    solve_time_ms: float

class CabinetBriefing(BaseModel):
    doc_hash: str
    merkle_root: str
    generated_at: str
    title_en: str
    title_hi: str
    summary_en: str
    summary_hi: str
    top_decisions: List[Dict[str, Any]]
    binding_constraints: List[Dict[str, Any]]
    bilingual_sections: List[Dict[str, Any]]
    audit_facts: Dict[str, Fact]
