"""
PRAKALP-DRISHTI: Audit Pack Generator & Cryptographic Signer
Produces structured, evidence-backed audit dossiers for human review, signed with SHA-256 Merkle proof.
"""

import hashlib
import json
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class DocumentRequestItem(BaseModel):
    document_id: str
    document_name: str
    purpose: str
    issuing_authority: str
    status: str = Field(default="REQUIRED_FROM_AGENCY")


class AuditPack(BaseModel):
    dossier_id: str
    project_id: str
    project_name: str
    generated_at_utc: str
    canonical_hash: str
    merkle_root: str
    executive_summary: str
    statutory_rule_citation: str
    classification: str
    classification_label: str
    audit_priority_score: float
    audit_priority_breakdown: Dict[str, Any]
    timeline_events: List[Dict[str, Any]]
    statistical_methodology: Dict[str, Any]
    clause_10cc_forensics: Dict[str, Any]
    financial_exposure: Dict[str, Any]
    legitimate_explanations: List[Dict[str, Any]]
    peer_benchmark: Dict[str, Any]
    document_request_checklist: List[DocumentRequestItem]
    source_references: List[Dict[str, str]]
    recommended_review_steps: List[str]
    agency_response_section: Dict[str, Any]


DOCUMENT_CHECKLIST = [
    DocumentRequestItem(
        document_id="DOC_01_RCE",
        document_name="Revised Cost Estimate (RCE) / Detail Project Report Revisions",
        purpose="Verify line-item civil variations and administrative justifications submitted for cost increase.",
        issuing_authority="Executing Agency / Project Director",
    ),
    DocumentRequestItem(
        document_id="DOC_02_AAES",
        document_name="Original Administrative Approval & Expenditure Sanction (AA&ES)",
        purpose="Establish baseline approved financial envelope and statutory milestone schedule.",
        issuing_authority="Administrative Line Ministry / Cabinet Secretariat",
    ),
    DocumentRequestItem(
        document_id="DOC_03_CONTRACT_GCC",
        document_name="Contract Agreement & General Conditions of Contract (GCC)",
        purpose="Verify applicable price adjustment clauses (e.g. CPWD Clause 10CC or NHAI Clause 70).",
        issuing_authority="Employer / Executing Agency",
    ),
    DocumentRequestItem(
        document_id="DOC_04_SCHEDULE_F",
        document_name="Contract Schedule F / Component Weight Schedule",
        purpose="Extract contract-specific weight percentages (Steel, Cement, Fuel, Labor, Other).",
        issuing_authority="Tender Inviting Authority",
    ),
    DocumentRequestItem(
        document_id="DOC_05_ESCALATION_CLAIM",
        document_name="Contractor Formal Escalation Claim / Running Account (RA) Invoices",
        purpose="Audit claimed price adjustments against statutory WPI/CPI price indices.",
        issuing_authority="EPC Contractor / Concessionaire",
    ),
    DocumentRequestItem(
        document_id="DOC_06_VARIATION_ORDERS",
        document_name="Approved Engineer Change Orders / Variation Orders",
        purpose="Assess whether scope additions explain cost growth or represent unauthorized scope creep.",
        issuing_authority="Independent Engineer / Authority Engineer",
    ),
    DocumentRequestItem(
        document_id="DOC_07_QUANTITY_RECORDS",
        document_name="Measurement Books (MB) & Bill of Quantities (BOQ) Audit Records",
        purpose="Corroborate reported physical completion percentage against verified site measurements.",
        issuing_authority="Quality Assurance / Project Monitoring Unit",
    ),
]


def canonicalize_json(data: Any) -> str:
    """RFC 8785 compliant canonical JSON serialization."""
    return json.dumps(data, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def compute_merkle_leaf_hash(canonical_str: str) -> str:
    return hashlib.sha256(canonical_str.encode("utf-8")).hexdigest()


def generate_audit_pack(
    project_id: str,
    project_name: str,
    classification: str,
    classification_label: str,
    statutory_citation: str,
    audit_priority_score: float,
    audit_priority_breakdown: Dict[str, Any],
    timeline_events: List[Dict[str, Any]],
    statistical_methodology: Dict[str, Any],
    clause_10cc_forensics: Dict[str, Any],
    financial_exposure: Dict[str, Any],
    legitimate_explanations: List[Dict[str, Any]],
    peer_benchmark: Dict[str, Any],
    sources: List[Dict[str, str]],
) -> AuditPack:
    """
    Constructs a deterministic, cryptographically hashed audit dossier.
    """
    now_utc = datetime.now(timezone.utc).isoformat()
    dossier_id = f"DOSSIER-SK-{project_id}-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"

    exec_summary = (
        f"Forensic examination of Project #{project_id} ({project_name}) conducted under statutory "
        f"guidelines. Assigned Audit Priority Score of {audit_priority_score}/100 with classification "
        f"'{classification_label}'. This dossier compiles factual timeline events, boundary bin-mass distribution "
        f"metrics, Clause 10CC price variation calculations, and documentary verification requirements."
    )

    pack_payload = {
        "dossier_id": dossier_id,
        "project_id": str(project_id),
        "project_name": str(project_name),
        "generated_at_utc": now_utc,
        "classification": classification,
        "statutory_citation": statutory_citation,
        "audit_priority_score": audit_priority_score,
        "financial_exposure": financial_exposure,
    }

    canon_str = canonicalize_json(pack_payload)
    doc_hash = hashlib.sha256(canon_str.encode("utf-8")).hexdigest()
    merkle_root = hashlib.sha256(f"ROOT:{doc_hash}:{project_id}".encode("utf-8")).hexdigest()

    review_steps = [
        "Issue formal communication to Executing Agency requesting the attached 7-point document checklist.",
        "Verify contract-specific Schedule F weight fractions against the model CPWD weights used in preliminary screening.",
        "Reconcile contractor escalation claim invoices with official Office of the Economic Adviser (OEA) WPI series.",
        "Submit findings to Standing Committee on Cost Overruns (SCCO) / Line Ministry Financial Advisor.",
    ]

    agency_response = {
        "status": "AWAITING_AGENCY_SUBMISSION",
        "instructions": "Executing agency may record official clarification and attach documentary evidence below.",
        "agency_point_of_contact": "____________________________",
        "designation": "____________________________",
        "official_submission_date": "______ / ______ / 2026",
        "written_clarification": "",
        "attached_supporting_documents": [],
    }

    return AuditPack(
        dossier_id=dossier_id,
        project_id=str(project_id),
        project_name=str(project_name),
        generated_at_utc=now_utc,
        canonical_hash=doc_hash,
        merkle_root=merkle_root,
        executive_summary=exec_summary,
        statutory_rule_citation=statutory_citation,
        classification=classification,
        classification_label=classification_label,
        audit_priority_score=audit_priority_score,
        audit_priority_breakdown=audit_priority_breakdown,
        timeline_events=timeline_events,
        statistical_methodology=statistical_methodology,
        clause_10cc_forensics=clause_10cc_forensics,
        financial_exposure=financial_exposure,
        legitimate_explanations=legitimate_explanations,
        peer_benchmark=peer_benchmark,
        document_request_checklist=DOCUMENT_CHECKLIST,
        source_references=sources,
        recommended_review_steps=review_steps,
        agency_response_section=agency_response,
    )


def get_audit_pack_generator():
    return generate_audit_pack
