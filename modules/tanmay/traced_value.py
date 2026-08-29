"""
PRAKALP-DRISHTI: TracedValue Core Provenance Type
Enforces Hard Rule 1: No bare primitives in forensic paths. Every number carries provenance or explicit unavailablility.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, Field


class SourceRef(BaseModel):
    dataset: str = Field(..., description="Name of source dataset (e.g. PAIMANA_MASTER_PROJECTS_DATABASE, WPI_CONSTRUCTION_INDEX)")
    record_id: str = Field(..., description="Identifier of the record (e.g. ProjectId or Year)")
    field_name: str = Field(..., description="Exact field name in source")
    effective_date: Optional[str] = Field(default=None, description="Effective date/year of the source data point")


class TracedValue(BaseModel):
    status: str = Field(..., description="'computed' | 'unavailable'")
    value: Optional[Union[float, int, str, bool]] = Field(default=None, description="Computed value if status is computed")
    unit: str = Field(default="", description="Unit of measurement (e.g. '₹ Cr', '%', 'Months', 'Ratio')")
    formula: Optional[str] = Field(default=None, description="Mathematical or logical formula used")
    inputs: List[Dict[str, Any]] = Field(default_factory=list, description="Sub-inputs with their own provenance trees")
    sources: List[SourceRef] = Field(default_factory=list, description="List of source references")
    computed_at: Optional[str] = Field(default=None, description="ISO-8601 UTC timestamp")
    assumptions: List[str] = Field(default_factory=list, description="Explicit modeling assumptions (e.g. model weights)")
    finding_capped_at: Optional[str] = Field(default=None, description="'AMBER' if model assumptions cap adverse finding")
    reason: Optional[str] = Field(default=None, description="Detailed explanation if unavailable")
    missing_inputs: List[str] = Field(default_factory=list, description="List of missing fields that prevented computation")

    @classmethod
    def computed(
        cls,
        value: Union[float, int, str, bool],
        unit: str = "",
        formula: Optional[str] = None,
        inputs: Optional[List[Any]] = None,
        sources: Optional[List[SourceRef]] = None,
        assumptions: Optional[List[str]] = None,
        finding_capped_at: Optional[str] = None,
    ) -> "TracedValue":
        serialized_inputs = []
        if inputs:
            for inp in inputs:
                if isinstance(inp, TracedValue):
                    serialized_inputs.append(inp.model_dump())
                elif isinstance(inp, dict):
                    serialized_inputs.append(inp)
                else:
                    serialized_inputs.append({"value": str(inp)})

        return cls(
            status="computed",
            value=value,
            unit=unit,
            formula=formula,
            inputs=serialized_inputs,
            sources=sources or [],
            computed_at=datetime.now(timezone.utc).isoformat(),
            assumptions=assumptions or [],
            finding_capped_at=finding_capped_at,
        )

    @classmethod
    def unavailable(
        cls,
        reason: str,
        missing_inputs: Optional[List[str]] = None,
        unit: str = "",
    ) -> "TracedValue":
        return cls(
            status="unavailable",
            reason=reason,
            missing_inputs=missing_inputs or [],
            unit=unit,
            computed_at=datetime.now(timezone.utc).isoformat(),
        )

    @classmethod
    def raw_field(
        cls,
        value: Any,
        field_name: str,
        record_id: str,
        dataset: str = "PAIMANA_MASTER_PROJECTS_DATABASE",
        unit: str = "",
        effective_date: Optional[str] = None,
    ) -> "TracedValue":
        if value is None or (isinstance(value, float) and (value != value)):  # NaN check
            return cls.unavailable(
                reason=f"Raw field '{field_name}' is absent in {dataset} for record #{record_id}",
                missing_inputs=[field_name],
                unit=unit,
            )
        return cls.computed(
            value=value,
            unit=unit,
            formula=f"raw_field({field_name})",
            sources=[
                SourceRef(
                    dataset=dataset,
                    record_id=str(record_id),
                    field_name=field_name,
                    effective_date=effective_date,
                )
            ],
        )
