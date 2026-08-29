"""
PRAKALP-DRISHTI: CCEA Rule Engine & Approval Threshold Resolution Pipeline
Resolves applicable cabinet approval rules, authority citations, and the 5 statutory forensic classifications.
"""

import json
import logging
import os
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

logger = logging.getLogger("SatyaKavach.RuleEngine")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DEFAULT_CONFIG_PATH_JSON = os.path.join(BASE_DIR, "config", "rules", "approval_thresholds.v1.json")
DEFAULT_CONFIG_PATH_YAML = os.path.join(BASE_DIR, "config", "rules", "approval_thresholds.v1.yaml")


class RuleApplicability(BaseModel):
    min_sanction_cost_cr: float = Field(default=150.0)
    sector: str = Field(default="ALL")


class RuleConditions(BaseModel):
    cost_overrun_pct_gte: Optional[float] = None
    cost_overrun_pct_lt: Optional[float] = None
    time_overrun_months_gte: Optional[float] = None


class ApprovalRule(BaseModel):
    rule_id: str
    policy_name: str
    effective_from: str
    effective_to: Optional[str] = None
    status: str = Field(default="unverified")
    applicability: RuleApplicability
    conditions: RuleConditions
    required_approval_authority: str
    citation: str
    notes: Optional[str] = None


class ThresholdConfig(BaseModel):
    version: str
    description: str
    proximity_band_pp: float = 2.0
    rules: List[ApprovalRule]


class ClassificationResult(BaseModel):
    classification: str  # Exactly one of the 5 allowed classifications
    classification_label: str
    matched_rule: Optional[ApprovalRule] = None
    required_approval_authority: str
    proximity_distance_pp: Optional[float] = None
    citation: str
    audit_notes: str
    missing_inputs: List[str] = Field(default_factory=list)


class CCEARuleEngine:
    def __init__(self, config_path: Optional[str] = None):
        self.custom_path_passed = config_path is not None
        self.config_path = config_path or DEFAULT_CONFIG_PATH_JSON
        self.config: Optional[ThresholdConfig] = None
        self.load_error: Optional[str] = None
        self._load_and_validate()

    def _load_and_validate(self):
        try:
            if not os.path.exists(self.config_path):
                if not self.custom_path_passed and os.path.exists(DEFAULT_CONFIG_PATH_YAML):
                    self.config_path = DEFAULT_CONFIG_PATH_YAML
                else:
                    raise FileNotFoundError(f"Rule configuration file not found at {self.config_path}")

            # Read config file
            raw_data = None
            with open(self.config_path, "r", encoding="utf-8") as f:
                content = f.read()
                try:
                    raw_data = json.loads(content)
                except Exception:
                    # Basic YAML key-value fallback parser if needed
                    raw_data = self._parse_simple_yaml(content)

            # Strict Schema & Citation Validation
            rules_list = []
            for r in raw_data.get("rules", []):
                citation = str(r.get("citation", "")).strip()
                if not citation:
                    raise ValueError(f"Rule '{r.get('rule_id')}' is missing mandatory 'citation' field.")
                rules_list.append(ApprovalRule(**r))

            self.config = ThresholdConfig(
                version=str(raw_data.get("version", "1.0.0")),
                description=str(raw_data.get("description", "")),
                proximity_band_pp=float(raw_data.get("proximity_band_pp", 2.0)),
                rules=rules_list,
            )
            self.load_error = None
            logger.info(f"Loaded {len(self.config.rules)} approval threshold rules from {self.config_path}")

        except Exception as e:
            self.load_error = str(e)
            logger.error(f"Failed to load approval rules: {e}. Satya-Kavach will route projects to RULE_REVIEW_REQUIRED.")

    def _parse_simple_yaml(self, text: str) -> Dict[str, Any]:
        """Simple YAML fallback for the approval threshold schema without external dependencies."""
        import re
        data: Dict[str, Any] = {"version": "1.0.0", "description": "", "proximity_band_pp": 2.0, "rules": []}
        
        # Check proximity band
        prox_match = re.search(r"proximity_band_pp:\s*([0-9.]+)", text)
        if prox_match:
            data["proximity_band_pp"] = float(prox_match.group(1))

        # Basic rule migration default
        if "CCEA_COST_ESCALATION_V0" in text:
            data["rules"].append({
                "rule_id": "CCEA_COST_ESCALATION_V0",
                "policy_name": "CCEA 20% Cost Revision Approval Rule",
                "effective_from": "2005-01-01",
                "effective_to": None,
                "status": "unverified",
                "applicability": {"min_sanction_cost_cr": 150.0, "sector": "ALL"},
                "conditions": {"cost_overrun_pct_gte": 20.0, "time_overrun_months_gte": None},
                "required_approval_authority": "Cabinet Committee on Economic Affairs (CCEA)",
                "citation": "Cabinet Secretariat Circular No. 1/2005 / MoSPI Guidelines",
                "notes": "Migrated baseline"
            })
        return data

    def resolve(
        self,
        original_cost_cr: Optional[float],
        revised_cost_cr: Optional[float],
        time_overrun_months: Optional[float] = 0.0,
        sanction_date_str: Optional[str] = None,
        sector: Optional[str] = None,
    ) -> ClassificationResult:
        """
        Executes the resolution pipeline for a project record:
        project -> cost overrun % -> applicable policy -> matched rule -> classification
        """
        # If configuration load failed, safely resolve to RULE_REVIEW_REQUIRED without server crash
        if self.load_error or not self.config:
            return ClassificationResult(
                classification="RULE_REVIEW_REQUIRED",
                classification_label="Rule Review Required (Configuration Error)",
                required_approval_authority="Pending Rule Verification",
                citation="UNRESOLVED_CONFIG",
                audit_notes=f"Rule engine configuration error: {self.load_error}",
                missing_inputs=["rule_configuration"],
            )

        if original_cost_cr is None or original_cost_cr <= 0:
            return ClassificationResult(
                classification="RULE_REVIEW_REQUIRED",
                classification_label="Rule Review Required (Missing Original Sanction)",
                required_approval_authority="Unassigned — Missing Baseline Sanction",
                citation="TODO_HUMAN_VERIFY (PAIMANA Baseline Data Incomplete)",
                audit_notes="Missing essential baseline financial field: OriginalCost.",
                missing_inputs=["OriginalCost"],
            )

        # State 3: NO_REVISION_ON_FILE (No revised cost estimate filed in statutory database)
        if revised_cost_cr is None:
            return ClassificationResult(
                classification="NO_REVISION_ON_FILE",
                classification_label="No Revision on File (Baseline Sanction Active)",
                required_approval_authority="Original Sanctioning Authority",
                citation="Initial Administrative Approval & Sanction (AA&ES)",
                proximity_distance_pp=None,
                audit_notes="Project operates under initial administrative sanction. No revised cost estimate recorded.",
                missing_inputs=[],
            )

        orig = float(original_cost_cr)
        rev = float(revised_cost_cr)
        overrun_cr = max(0.0, rev - orig)
        overrun_pct = round((overrun_cr / orig) * 100.0, 2)
        delay_months = float(time_overrun_months or 0.0)
        proximity_band = self.config.proximity_band_pp

        # Boundary distance to 20%
        proximity_dist = round(20.0 - overrun_pct, 2)

        # 1. Escalation Candidate: Overrun >= 20.0%
        if overrun_pct >= 20.0:
            matched = next((r for r in self.config.rules if r.rule_id == "CCEA_COST_ESCALATION_V0"), None)
            auth = matched.required_approval_authority if matched else "Cabinet Committee on Economic Affairs (CCEA)"
            citation = matched.citation if matched else "TODO_HUMAN_VERIFY (Cabinet Secretariat Guidelines)"
            return ClassificationResult(
                classification="ESCALATION_CANDIDATE",
                classification_label="Escalation Candidate (Cabinet Approval Threshold Met)",
                matched_rule=matched,
                required_approval_authority=auth,
                proximity_distance_pp=0.0,
                citation=citation,
                audit_notes=f"Cost revision of +{overrun_pct}% meets the >=20% threshold requiring formal CCEA revised administrative sanction.",
            )

        # 2. Threshold Proximity: Within configured band (e.g. 18.0% <= Overrun < 20.0%)
        if (20.0 - proximity_band) <= overrun_pct < 20.0:
            matched = next((r for r in self.config.rules if r.rule_id == "MINISTERIAL_REVISED_COST_COMMITTEE_V0"), None)
            auth = matched.required_approval_authority if matched else "Standing Committee on Cost Overruns (SCCO) / Line Ministry"
            citation = matched.citation if matched else "TODO_HUMAN_VERIFY (Cabinet 20% Boundary Guidelines)"
            return ClassificationResult(
                classification="THRESHOLD_PROXIMITY",
                classification_label="Threshold Proximity (Under Observation)",
                matched_rule=matched,
                required_approval_authority=auth,
                proximity_distance_pp=proximity_dist,
                citation=citation,
                audit_notes=f"Cost revision (+{overrun_pct}%) is {proximity_dist} pp below the 20% Cabinet threshold. Proximity alone is not a breach but warrants observation.",
            )

        # 3. Time Overrun Threshold Candidate
        if delay_months >= 24.0:
            matched = next((r for r in self.config.rules if r.rule_id == "CCEA_TIME_EXTENSION_V0"), None)
            auth = matched.required_approval_authority if matched else "Cabinet Committee on Economic Affairs (CCEA)"
            citation = matched.citation if matched else "TODO_HUMAN_VERIFY (MoSPI Timeline Rules)"
            return ClassificationResult(
                classification="ESCALATION_CANDIDATE",
                classification_label="Escalation Candidate (Time Extension Threshold)",
                matched_rule=matched,
                required_approval_authority=auth,
                proximity_distance_pp=None,
                citation=citation,
                audit_notes=f"Schedule delay of {delay_months} months exceeds 24-month substantive revision threshold.",
            )

        # 4. Distribution Anomaly: Noticeable cluster between 10% and 18% with active cost revision
        if 10.0 <= overrun_pct < (20.0 - proximity_band):
            return ClassificationResult(
                classification="DISTRIBUTION_ANOMALY",
                classification_label="Distribution Anomaly (Intermediate Revision)",
                matched_rule=None,
                required_approval_authority="Executing Agency Administrative Board",
                proximity_distance_pp=proximity_dist,
                citation="TODO_HUMAN_VERIFY (Internal Agency Administrative Delegation Rules)",
                audit_notes=f"Cost overrun of +{overrun_pct}% is managed under administrative delegation below the Cabinet proximity band.",
            )

        # 5. No Anomaly
        return ClassificationResult(
            classification="NO_ANOMALY",
            classification_label="No Anomaly Detected (Within Initial Budget Bounds)",
            matched_rule=None,
            required_approval_authority="Executing Agency Internal Sanction",
            proximity_distance_pp=proximity_dist,
            citation="Standard Financial Delegation",
            audit_notes="Project cost remains within initial sanctioned budget parameters.",
        )


_rule_engine_instance = None

def get_rule_engine() -> CCEARuleEngine:
    global _rule_engine_instance
    if _rule_engine_instance is None:
        _rule_engine_instance = CCEARuleEngine()
    return _rule_engine_instance
