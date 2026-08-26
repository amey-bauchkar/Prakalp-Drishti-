from typing import List, Tuple, Dict, Any

try:
    from ..schemas.anumati_schema import (
        ClearanceStatusRequest,
        ClearanceStatusResponse,
        ClearanceStageDetail,
        StageStagnationBreakdown
    )
except (ImportError, ValueError):
    try:
        from modules.aditya.schemas.anumati_schema import (
            ClearanceStatusRequest,
            ClearanceStatusResponse,
            ClearanceStageDetail,
            StageStagnationBreakdown
        )
    except ImportError:
        from app.schemas.anumati_schema import (
            ClearanceStatusRequest,
            ClearanceStatusResponse,
            ClearanceStageDetail,
            StageStagnationBreakdown
        )


class AnumatiEngine:
    """
    ANUMATI: Statutory Clearance & Regulatory Bottleneck Tracker for PRAKALP-DRISHTI
    Tracks 5-stage clearance pipeline, calculates Regulatory Stagnation Index (RSI),
    detects central-state administrative paper loops, and triggers PMO PRAGATI escalations.
    """

    STAGE_WEIGHTS = {
        "FOREST_CLEARANCE": 0.30,
        "LAND_RFCTLARR": 0.25,
        "ENVIRONMENT_CLEARANCE": 0.20,
        "WILDLIFE_CLEARANCE": 0.15,
        "UTILITY_ROW": 0.10
    }

    DEFAULT_BENCHMARKS = {
        "FOREST_CLEARANCE": 120,
        "WILDLIFE_CLEARANCE": 90,
        "ENVIRONMENT_CLEARANCE": 105,
        "LAND_RFCTLARR": 180,
        "UTILITY_ROW": 60
    }

    def __init__(self):
        pass

    def evaluate_stage_stagnation(self, stage: ClearanceStageDetail) -> StageStagnationBreakdown:
        """
        Calculates individual stage stagnation ratio and detects paperwork loopbacks.
        """
        benchmark = stage.benchmark_days if stage.benchmark_days > 0 else self.DEFAULT_BENCHMARKS.get(stage.stage_code, 90)
        stagnation_ratio = round(stage.days_pending / benchmark, 2)
        
        is_stagnated = (stagnation_ratio >= 1.25) or (stage.status in ["QUERY_RAISED", "LOOPBACK"] and stage.days_pending > benchmark * 0.75)
        
        # Paperwork Loopback Detector:
        # Bounces between Central & State depts (loopback_count >= 2) or explicit LOOPBACK status
        paperwork_loopback = (stage.loopback_count >= 2) or (stage.status == "LOOPBACK") or (stage.status == "QUERY_RAISED" and stage.days_pending >= benchmark * 1.0)

        return StageStagnationBreakdown(
            stage_code=stage.stage_code,
            stage_name=stage.stage_name,
            department=stage.department,
            days_pending=stage.days_pending,
            benchmark_days=benchmark,
            stagnation_ratio=stagnation_ratio,
            is_stagnated=is_stagnated,
            paperwork_loopback_detected=paperwork_loopback
        )

    def calculate_regulatory_stagnation_index(self, breakdowns: List[StageStagnationBreakdown]) -> Tuple[float, bool, str, int]:
        """
        Calculates aggregate RSI score, detects primary bottleneck department,
        computes maximum days overdue, and flags paperwork loopbacks.
        """
        weighted_rsi_sum = 0.0
        total_weight = 0.0
        any_loopback = False
        max_overdue_days = 0
        primary_bottleneck_dept = "None"
        max_stagnation = -1.0

        for b in breakdowns:
            weight = self.STAGE_WEIGHTS.get(b.stage_code, 0.15)
            weighted_rsi_sum += (b.stagnation_ratio * weight)
            total_weight += weight

            if b.paperwork_loopback_detected:
                any_loopback = True

            overdue = max(0, b.days_pending - b.benchmark_days)
            if b.stagnation_ratio > max_stagnation:
                max_stagnation = b.stagnation_ratio
                primary_bottleneck_dept = b.department
                max_overdue_days = overdue

        overall_rsi = round(weighted_rsi_sum / total_weight if total_weight > 0 else 1.0, 2)
        return overall_rsi, any_loopback, primary_bottleneck_dept, max_overdue_days

    def generate_escalation_payload(
        self,
        request: ClearanceStatusRequest,
        breakdowns: List[StageStagnationBreakdown],
        rsi_score: float,
        any_loopback: bool,
        bottleneck_dept: str,
        days_overdue: int
    ) -> Tuple[str, str, bool, str]:
        """
        Determines overall clearance status, economic impact, PMO escalation flag,
        and generates executive escalation brief for PRAGATI / Cabinet Secretariat.
        """
        all_approved = all(s.status == "APPROVED" for s in request.stages if s.status != "NOT_APPLICABLE")
        
        if all_approved:
            overall_status = "APPROVED"
        elif rsi_score >= 1.35 or any_loopback or days_overdue >= 45:
            overall_status = "STALLED"
        else:
            overall_status = "IN_PROGRESS"

        pmo_flag = (overall_status == "STALLED") or (rsi_score >= 1.5) or any_loopback

        # Economic Impact Calculation
        est_cost_impact_cr = round(request.estimated_daily_cost_overrun_cr * days_overdue, 2)
        if days_overdue > 0:
            economic_impact = f"High Delay Risk: Overdue by {days_overdue} days. Estimated cumulative capital inflation of ₹{est_cost_impact_cr} Cr (at ₹{request.estimated_daily_cost_overrun_cr} Cr/day)."
        else:
            economic_impact = "Low Impact: Clearance timeline within acceptable MoSPI statutory buffer."

        # Escalation Memo Generator
        if pmo_flag:
            stagnated_stages = [b.stage_name for b in breakdowns if b.is_stagnated]
            stages_str = ", ".join(stagnated_stages) if stagnated_stages else "Statutory Pipeline"
            memo = (
                f"PRAGATI PMO ESCALATION DIRECTIVE: Project '{request.project_name}' ({request.project_id}) "
                f"is STALLED in administrative paper loop under {bottleneck_dept}. "
                f"Stagnated Stage(s): [{stages_str}]. Delay beyond benchmark: {days_overdue} days. "
                f"Financial exposure: ₹{est_cost_impact_cr} Cr. "
                f"ACTION REQUIRED: Issue binding multi-ministry clearance directive via Cabinet Secretariat to finalize Stage-II approval within 15 days."
            )
        else:
            memo = f"Routine Monitoring Brief: Clearances for '{request.project_name}' are proceeding under standard SLAs. No PMO escalation required at present."

        return overall_status, economic_impact, pmo_flag, memo

    def process_clearance_status(self, request: ClearanceStatusRequest) -> ClearanceStatusResponse:
        """
        Main entry point for ANUMATI clearance status and bottleneck tracking.
        """
        breakdowns = [self.evaluate_stage_stagnation(stage) for stage in request.stages]
        rsi_score, any_loopback, bottleneck_dept, days_overdue = self.calculate_regulatory_stagnation_index(breakdowns)
        overall_status, econ_impact, pmo_flag, memo = self.generate_escalation_payload(
            request=request,
            breakdowns=breakdowns,
            rsi_score=rsi_score,
            any_loopback=any_loopback,
            bottleneck_dept=bottleneck_dept,
            days_overdue=days_overdue
        )

        return ClearanceStatusResponse(
            project_id=request.project_id,
            project_name=request.project_name,
            overall_clearance_status=overall_status,
            regulatory_stagnation_index=rsi_score,
            bottleneck_department=bottleneck_dept,
            days_overdue=days_overdue,
            economic_impact_delay_risk=econ_impact,
            pmo_escalation_flag=pmo_flag,
            paperwork_loopbacks_detected=any_loopback,
            stage_breakdown=breakdowns,
            recommended_escalation_memo=memo
        )


# Singleton instance for export
anumati_service = AnumatiEngine()
