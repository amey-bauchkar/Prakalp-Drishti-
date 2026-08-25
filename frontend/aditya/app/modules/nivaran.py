import re
from typing import List, Dict, Any, Tuple
from app.schemas.nivaran_schema import (
    DisputeRiskAssessmentRequest,
    DisputeRiskAssessmentResponse,
    FlaggedClause,
    ContractorLitigationInput,
    OperationalMetricsInput
)


class NivaranEngine:
    """
    NIVARAN: Contractual, Arbitration & Dispute Risk Engine for PRAKALP-DRISHTI
    Predicts contractual disputes, litigation risks, arbitration likelihood, and contractor abandonment.
    """

    HIGH_RISK_PATTERNS = [
        {
            "category": "NON_INDEXED_ESCALATION",
            "title": "Non-Indexed / Capped Escalation Clause",
            "patterns": [
                r"\b(no price escalation|fixed price contract|escalation capped at|wPI non-applicable|price adjustment non-payable|fixed price basis)\b",
                r"\b(price escalation shall not exceed \d+%|no compensation for material inflation)\b"
            ],
            "severity": "HIGH",
            "base_score": 0.85,
            "reason": "Escalation caps during commodity inflation force contractors into negative margins, driving work slowdowns and arbitration filings."
        },
        {
            "category": "UNENCUMBERED_LAND_AMBIGUITY",
            "title": "Ambiguous / Phased Land Delivery",
            "patterns": [
                r"\b(phased handover of land|land acquisition in progress|unencumbered right of way subject to|non-binding land delivery|land delivery as and when available)\b",
                r"\b(contractor shall not claim overheads for land delay|staggered land delivery)\b"
            ],
            "severity": "CRITICAL",
            "base_score": 0.95,
            "reason": "Commencing work on unencumbered or partially acquired land is the #1 cause of prolonged litigation and idle machinery claims in Indian infrastructure."
        },
        {
            "category": "DELAY_PENALTY_LIMITS",
            "title": "Liquidated Damages & Penalty Imbalance",
            "patterns": [
                r"\b(liquidated damages capped at \d+%|penalty capped at|maximum penalty of \d+%|0\.01% per week)\b",
                r"\b(unilateral deduction of damages without arbitration|summary penalty deduction)\b"
            ],
            "severity": "MEDIUM",
            "base_score": 0.70,
            "reason": "Inadequate penalty caps incentivize contractor abandonment when cost overrun exceeds LD cap, while unilateral deductions spark court injunctions."
        },
        {
            "category": "SCOPE_VARIATION_UNILATERAL",
            "title": "Unilateral Variation Orders Without Extension",
            "patterns": [
                r"\b(authority reserves right to alter scope without time extension|unilateral variation up to \d+%|variation rates fixed at contract price|no rate revision for scope increase)\b",
                r"\b(mandatory execution of additional quantities without advance approval)\b"
            ],
            "severity": "HIGH",
            "base_score": 0.80,
            "reason": "Unilateral scope changes without synchronized rate index revision lead to major financial disputes (>₹50 Cr) during final billing."
        },
        {
            "category": "FORCE_MAJEURE_AMBIGUITY",
            "title": "Ambiguous Force Majeure & Excusable Delay Exclusion",
            "patterns": [
                r"\b(statutory delay shall not constitute force majeure|administrative hold excluded from excusable delay|regulatory delay is contractor risk)\b",
                r"\b(no extension of time for government approval delays)\b"
            ],
            "severity": "MEDIUM",
            "base_score": 0.65,
            "reason": "Excluding statutory/regulatory delays from excusable delays transfers sovereign risk to contractor, triggering court stays."
        }
    ]

    def __init__(self):
        pass

    def classify_clause_risk(self, contract_text: str) -> Tuple[float, List[FlaggedClause]]:
        """
        Scans contract summary / DPR text using NLP regex heuristics for high-risk contractual clauses.
        Returns aggregate clause_risk_score (0.0 to 1.0) and list of FlaggedClause objects.
        """
        flagged: List[FlaggedClause] = []
        if not contract_text or len(contract_text.strip()) == 0:
            return 0.20, flagged

        # Split text into paragraphs/sentences for extraction
        sentences = [s.strip() for s in re.split(r'[\.\n;]', contract_text) if len(s.strip()) > 15]

        detected_categories = set()
        total_score = 0.0

        for item in self.HIGH_RISK_PATTERNS:
            cat = item["category"]
            title = item["title"]
            patterns = item["patterns"]
            severity = item["severity"]
            base_score = item["base_score"]
            reason = item["reason"]

            for pattern in patterns:
                rx = re.compile(pattern, re.IGNORECASE)
                for sentence in sentences:
                    if rx.search(sentence):
                        if cat not in detected_categories:
                            detected_categories.add(cat)
                            total_score += base_score
                            flagged.append(
                                FlaggedClause(
                                    category=cat,
                                    clause_title=title,
                                    snippet=sentence[:250],
                                    clause_risk_score=base_score,
                                    risk_reason=reason,
                                    severity=severity
                                )
                            )
                        break

        # If no explicit risk clauses found, check for generic risk words
        if not flagged:
            generic_risk = 0.15
            if re.search(r"\b(dispute|litigation|arbitration|penalty|delay)\b", contract_text, re.IGNORECASE):
                generic_risk = 0.35
            return generic_risk, []

        # Normalized clause risk score between 0.0 and 1.0
        clause_score = min(1.0, round(total_score / min(4, len(self.HIGH_RISK_PATTERNS)), 2))
        return clause_score, flagged

    def calculate_litigation_index(self, data: ContractorLitigationInput) -> float:
        """
        Calculates Contractor Litigation Exposure Index (0.0 to 100.0) based on historical legal metrics.
        """
        arb_score = min(40.0, data.past_arbitration_count * 10.0)
        
        dispute_ratio = 0.0
        if data.total_active_contract_value_cr > 0:
            dispute_ratio = data.disputed_variation_value_cr / data.total_active_contract_value_cr
        variation_score = min(35.0, dispute_ratio * 70.0)
        
        stay_score = min(25.0, data.historical_legal_stays * 12.5)

        total_index = round(arb_score + variation_score + stay_score, 2)
        return min(100.0, total_index)

    def generate_dispute_signal(
        self,
        clause_risk_score: float,
        litigation_index: float,
        op_metrics: OperationalMetricsInput,
        flagged_clauses: List[FlaggedClause]
    ) -> Tuple[float, str, str]:
        """
        Evaluates administrative & operational metrics to generate litigation probability,
        dispute risk level, and recommended preemptive action.
        """
        # Calculate Operational Friction Score (0.0 to 1.0)
        var_friction = min(0.40, op_metrics.pending_variation_orders_gt_90d * 0.12 + (op_metrics.pending_variation_value_cr * 0.01))
        inv_friction = min(0.35, op_metrics.unpaid_milestone_invoices_count * 0.10 + (op_metrics.max_invoice_delay_days / 180.0 * 0.20))
        eot_friction = min(0.25, op_metrics.pending_time_extension_requests * 0.12)

        op_friction_score = min(1.0, var_friction + inv_friction + eot_friction)

        # Weighted Probability Model:
        # 35% Clause Risk + 30% Contractor Litigation Index (scaled 0-1) + 35% Operational Friction
        norm_litigation_idx = litigation_index / 100.0
        probability = round(
            (0.35 * clause_risk_score) +
            (0.30 * norm_litigation_idx) +
            (0.35 * op_friction_score),
            2
        )
        probability = min(1.0, max(0.05, probability))

        # Risk Level Categorization
        if probability >= 0.75:
            risk_level = "CRITICAL"
        elif probability >= 0.50:
            risk_level = "HIGH"
        elif probability >= 0.25:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        # Actionable Recommendation Engine
        actions = []
        if op_metrics.pending_variation_orders_gt_90d > 0:
            actions.append(f"Convene Dispute Avoidance Committee (DAC) within 14 days to clear {op_metrics.pending_variation_orders_gt_90d} pending variation orders (₹{op_metrics.pending_variation_value_cr} Cr).")
        if op_metrics.unpaid_milestone_invoices_count > 0:
            actions.append(f"Expedite interim invoice release for {op_metrics.unpaid_milestone_invoices_count} milestone payments delayed up to {op_metrics.max_invoice_delay_days} days to restore contractor cash flow.")
        if flagged_clauses:
            top_clause = flagged_clauses[0].clause_title
            actions.append(f"Issue supplementary agreement to re-align high-risk clause '{top_clause}'.")
        
        if not actions:
            action_text = "Maintain routine administrative monitoring. Project contractual indicators are within safe thresholds."
        else:
            action_text = " ".join(actions)

        return probability, risk_level, action_text

    def assess_project_dispute_risk(self, request: DisputeRiskAssessmentRequest) -> DisputeRiskAssessmentResponse:
        """
        Main entry point for NIVARAN dispute risk assessment.
        """
        clause_score, flagged = self.classify_clause_risk(request.contract_text_or_summary)
        lit_index = self.calculate_litigation_index(request.contractor_data)
        prob, risk_lvl, action = self.generate_dispute_signal(
            clause_risk_score=clause_score,
            litigation_index=lit_index,
            op_metrics=request.operational_metrics,
            flagged_clauses=flagged
        )

        return DisputeRiskAssessmentResponse(
            project_id=request.project_id,
            project_name=request.project_name,
            clause_risk_score=clause_score,
            contractor_litigation_index=lit_index,
            litigation_probability=prob,
            dispute_risk_level=risk_lvl,
            flagged_clauses=flagged,
            recommended_preemptive_action=action
        )


# Singleton instance for export
nivaran_service = NivaranEngine()
