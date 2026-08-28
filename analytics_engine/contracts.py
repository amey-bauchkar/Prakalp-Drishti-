"""
PRAKALP-DRISHTI: Universal Data Contracts & Schema Specification
Defines Pydantic v2 schemas for Lineage, Facts, Forecasts, Graph Cascades,
Capital Allocation, and Cabinet Briefings.
"""

from typing import List, Dict, Optional, Literal, Any
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime

class MerkleProofStep(BaseModel):
    hash: str = Field(..., description="SHA-256 hash of the sibling node")
    position: Literal["left", "right"] = Field(..., description="Position of the sibling relative to the path node")

class LineageRef(BaseModel):
    query_sha256: str = Field(..., description="SHA-256 hash of the canonical SQL/query used to compute this fact")
    dataset_sha256: str = Field(..., description="SHA-256 hash of the data snapshot version")
    model_sha256: str = Field(..., description="SHA-256 hash of the model weights and hyperparameter config")
    merkle_root: str = Field(..., description="Root hash of the audit Merkle tree")
    merkle_path: Optional[List[str]] = Field(default_factory=list, description="Merkle inclusion path hashes for verification")
    merkle_proof: Optional[List[Dict[str, str]]] = Field(default_factory=list, description="Positional inclusion proof steps with left/right indicators")


class Uncertainty(BaseModel):
    p10: float = Field(..., description="10th percentile optimistic bound")
    p50: float = Field(..., description="50th percentile median forecast")
    p80: float = Field(..., description="80th percentile conservative bound")
    p95: float = Field(..., description="95th percentile worst-case tail bound")
    alpha_coverage: float = Field(default=0.90, description="Nominal target coverage level (e.g. 0.90 for 90%)")
    empirical_coverage: Optional[float] = Field(
        default=None,
        description="Coverage MEASURED on a held-out test split by split-conformal calibration. "
                    "None means the interval is uncalibrated and its coverage is unverified.")
    calibration_method: Optional[str] = Field(
        default=None, description="How the interval width was derived; None = hand-set constants")
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
    # Unknown fields are rejected rather than ignored. Pydantic's default is to
    # drop them silently, which meant a caller sending `total_budget_cr` (a
    # plausible typo, or a renamed field after a refactor) had its request
    # accepted and the capital allocated against the 10,000 Cr DEFAULT instead
    # of the envelope it asked for -- with a 200 and no warning. On an endpoint
    # that distributes public capital that has to be an error, not a default.
    model_config = ConfigDict(extra="forbid")

    # gt=0. A negative pool was accepted with HTTP 200 and fed straight into
    # the LP, whose budget constraint then read "allocate at most minus five
    # thousand crore" -- satisfiable only by the all-zero plan, which the
    # engine returned as though it were an optimisation result. A capital
    # pool below zero has no meaning, so it is refused at the boundary
    # rather than silently producing an empty allocation.
    budget_pool_cr: float = Field(default=10000.0, gt=0, le=10_000_000,
                                  description="Available capex pool in Crore INR")
    risk_dial_kappa: float = Field(default=0.70, ge=0.0, le=1.0, description="Weight on CVaR90 tail loss vs expected loss")
    enforce_ner_floor: bool = Field(default=True, description="Enforce statutory 10% capex floor for North-Eastern Region")
    agency_absorption_multiplier: float = Field(default=1.25, description="Agency historical burn rate multiplier ceiling")
    delay_shock_months: float = Field(default=0.0, ge=0.0, description="Simulated delay shock in months to stress-test the allocation")
    shocked_project_id: Optional[str] = Field(default=None, description="If set and present in the candidate pool, the delay shock is applied only to this project (targeted shock). If unset, the shock is applied uniformly across all candidates (macro stress test).")

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

    # This is a composite INDEX, not a percentage, and the name is kept only
    # because existing consumers read it. It is the allocation-weighted mean of
    # (completion propensity x normalised Shapley network vitality), scaled by
    # 100 -- so it routinely exceeds 100 and was observed at 180.67, 162.44 and
    # 111.37 on live pools. It was being printed into the Cabinet briefing as
    # "Expected Completion Yield: 180.7%", which reads as a claim that a
    # portfolio will complete to 180% of itself.
    #
    # The LP is unaffected: it maximises a weighted sum, and scaling every
    # weight by a constant does not move the argmax. Only the reported figure
    # was wrong, and `portfolio_completion_propensity_perc` below is the
    # quantity that is genuinely a percentage.
    expected_completion_yield: float = Field(
        description="Composite priority INDEX (propensity x network vitality x 100). "
                    "Not bounded by 100 and not a completion percentage.")
    portfolio_completion_propensity_perc: float = Field(
        default=0.0, ge=0.0, le=100.0,
        description="Allocation-weighted mean completion propensity, clipped to "
                    "[0,100]. This is the figure that is a real percentage.")
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
    focus_project_id: Optional[str] = Field(default=None, description="The project_id a delay shock was targeted at, if any")
    focus_project_is_candidate: bool = Field(default=True, description="Whether focus_project_id is inside this quarter's top-60 capital-priority candidate pool. False means the shock cannot affect this engine's output for that project.")
    ner_coverage: Optional[Dict[str, Any]] = Field(default=None, description="Geographic coverage the statutory NER floor was evaluated over. 46.5% of projects carry no ministry-reported state, and the floor binds only on reported geography, so this reports the basis rather than leaving it implicit.")

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
