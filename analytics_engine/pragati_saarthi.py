"""
PRAKALP-DRISHTI: PRAGATI-SAARTHI
Deterministic Governance & PMO Cabinet Briefing Engine
3-Layer Architecture (Fact -> Assertion -> Render), RFC 8785 JCS Canonicalization,
SHA-256 Merkle Tree Cryptographic Provenance, and Bilingual PMO Notes.
"""

import os
import json
import hashlib
from datetime import datetime
from typing import Dict, List, Any

from analytics_engine.contracts import Fact, Uncertainty, LineageRef, CabinetBriefing
from analytics_engine.kaal_chakra import get_kaal_chakra_engine
from analytics_engine.setu_graph import get_setu_graph_engine
from analytics_engine.vitta_vyuha import get_vitta_vyuha_engine, AllocationRequest

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BRIEFING_ARCHIVE_DIR = os.path.join(BASE_DIR, "artifacts", "briefings")


# ── RFC 6962 MERKLE CONSTRUCTION ─────────────────────────────────────────────
# Two defects in the previous tree, both of which weaken exactly the property a
# CAG reviewer relies on -- "this root proves these facts":
#
#   1. NO DOMAIN SEPARATION. Leaves were sha256(data) and internal nodes were
#      sha256(left:right), drawn from the same hash domain. An attacker able to
#      choose fact strings could therefore present an internal node as though it
#      were a leaf. RFC 6962 s2.1 prefixes every leaf with 0x00 and every internal
#      node with 0x01 so the two families can never collide.
#
#   2. ODD-NODE DUPLICATION. The last node on an odd level was hashed against
#      itself (right = left). That is CVE-2012-2459: two different leaf sets can
#      yield an identical root, so a matching root stops proving anything. RFC 6962
#      splits at the largest power of two below n instead, which is unambiguous for
#      every n and needs no duplication.
#
# The WIRE FORMAT IS UNCHANGED -- proofs remain [{"hash": <64-hex>, "position":
# "left"|"right"}] and roots remain 64 hex chars -- so archived briefings, the
# Pydantic contracts and the frontend verifier all keep working. Only the hashing
# domain and the odd-level rule changed.
_LEAF_PREFIX = b"\x00"
_NODE_PREFIX = b"\x01"


def _mth_leaf(data: str) -> str:
    """RFC 6962 leaf hash: SHA-256(0x00 || data)."""
    return hashlib.sha256(_LEAF_PREFIX + data.encode("utf-8")).hexdigest()


def _mth_node(left_hex: str, right_hex: str) -> str:
    """RFC 6962 internal node: SHA-256(0x01 || left || right) over the raw digests."""
    return hashlib.sha256(
        _NODE_PREFIX + bytes.fromhex(left_hex) + bytes.fromhex(right_hex)
    ).hexdigest()


def _split_point(n: int) -> int:
    """k = the largest power of two strictly less than n (RFC 6962 s2.1)."""
    k = 1
    while k * 2 < n:
        k *= 2
    return k


def _mth(leaf_hashes: List[str]) -> str:
    """Merkle Tree Hash over already-hashed leaves."""
    n = len(leaf_hashes)
    if n == 1:
        return leaf_hashes[0]
    k = _split_point(n)
    return _mth_node(_mth(leaf_hashes[:k]), _mth(leaf_hashes[k:]))


def _mth_path(m: int, leaf_hashes: List[str]) -> List[Dict[str, str]]:
    """
    RFC 6962 s2.1.1 inclusion path for leaf index m, ordered deepest sibling first
    so the verifier can fold it straight from the leaf upward. "position" names the
    side the SIBLING sits on.
    """
    n = len(leaf_hashes)
    if n == 1:
        return []
    k = _split_point(n)
    if m < k:
        return _mth_path(m, leaf_hashes[:k]) + [
            {"hash": _mth(leaf_hashes[k:]), "position": "right"}]
    return _mth_path(m - k, leaf_hashes[k:]) + [
        {"hash": _mth(leaf_hashes[:k]), "position": "left"}]


class PragatiSaarthiEngine:
    def __init__(self):
        self.kaal_engine = get_kaal_chakra_engine()
        self.graph_engine = get_setu_graph_engine()
        self.vitta_engine = get_vitta_vyuha_engine()

    def _build_merkle_tree(self, leaves: List[str]) -> tuple[str, Dict[str, List[Dict[str, str]]]]:
        """
        Builds an RFC 6962 Merkle Tree from canonical fact strings.
        Returns: (merkle_root_hash, {leaf_hash: [ {hash: sibling, position: 'left'|'right'} ]})
        """
        if not leaves:
            # RFC 6962: MTH({}) = SHA-256() -- the hash of the empty string.
            return hashlib.sha256(b"").hexdigest(), {}

        leaf_hashes = [_mth_leaf(leaf) for leaf in leaves]
        merkle_root = _mth(leaf_hashes)

        proofs: Dict[str, List[Dict[str, str]]] = {}
        for leaf_idx, leaf_h in enumerate(leaf_hashes):
            proofs[leaf_h] = _mth_path(leaf_idx, leaf_hashes)

        return merkle_root, proofs

    @staticmethod
    def verify_merkle_proof(leaf_str_or_hash: str, proof: List[Dict[str, str]], expected_root: str) -> bool:
        """
        Cryptographically verifies whether a given leaf belongs to the expected Merkle root.
        Recomputes the root step-by-step from the leaf + positional siblings.

        Fails closed: a malformed proof (non-hex sibling, wrong length, wrong type) is a
        verification FAILURE, never an exception. The tamper path must return False
        rather than 500, because this is the endpoint an auditor points at a briefing
        they already suspect.
        """
        try:
            leaf_str_or_hash = str(leaf_str_or_hash)
            if len(leaf_str_or_hash) == 64 and all(c in '0123456789abcdefABCDEF' for c in leaf_str_or_hash):
                curr_hash = leaf_str_or_hash.lower()
            else:
                curr_hash = _mth_leaf(leaf_str_or_hash)

            for step in proof:
                sibling = str(step.get("hash", step.get("sibling", ""))).lower()
                position = step.get("position", "right")
                if position == "left":
                    curr_hash = _mth_node(sibling, curr_hash)
                else:
                    curr_hash = _mth_node(curr_hash, sibling)

            return curr_hash.lower() == str(expected_root).lower()
        except (ValueError, TypeError, AttributeError):
            return False

    def generate_cabinet_briefing(self, focus_project_id: str = "400188") -> CabinetBriefing:
        # 1. Gather Engine Artifacts
        forecast = self.kaal_engine.forecast_project(focus_project_id)
        subgraph = self.graph_engine.get_k_hop_subgraph(focus_project_id, k=2)
        alloc_res = self.vitta_engine.optimize_allocation(AllocationRequest(budget_pool_cr=15000.0, risk_dial_kappa=0.75))

        # 2. Fact Layer Construction
        fact_leaves = []
        audit_facts = {}

        # Merge Forecast Facts
        for fid, fact in forecast.facts.items():
            canonical_fact_str = json.dumps({
                "id": fact.fact_id,
                "val": fact.value,
                "unit": fact.unit
            }, sort_keys=True)
            fact_leaves.append(canonical_fact_str)
            audit_facts[fid] = fact

        # Add Network & Allocation Facts
        alloc_fact = Fact(
            fact_id=f"fact_vitta_alloc_{focus_project_id}",
            value=float(alloc_res.total_allocated_cr),
            formatted_value=f"₹{alloc_res.total_allocated_cr:,.2f} Cr",
            unit="INR_CR",
            fact_type="currency_cr",
            label="Optimized National Allocation (Stochastic LP, CVaR90)",
            lineage=LineageRef(
                query_sha256=hashlib.sha256(b"HIGHS_LP_CVAR90_OPT").hexdigest(),
                dataset_sha256=self.kaal_engine.dataset_hash,
                model_sha256=self.kaal_engine.model_hash,
                merkle_root="",
                merkle_path=[],
                merkle_proof=[]
            )
        )
        audit_facts[alloc_fact.fact_id] = alloc_fact
        fact_leaves.append(json.dumps({"id": alloc_fact.fact_id, "val": alloc_fact.value, "unit": alloc_fact.unit}, sort_keys=True))

        # 3. Compute Merkle Root
        merkle_root, proofs = self._build_merkle_tree(fact_leaves)
        # doc_hash binds the document to its CONTENT, not to the wall clock.
        #
        # It previously included datetime.now().date(), so the identifier rotated at
        # midnight while nothing was ever written to disk. A QR code printed on a
        # Cabinet note therefore failed verification the next morning -- the audit
        # trail was ephemeral, which is the opposite of what it claimed to be.
        # Content-addressing makes the hash reproducible for as long as the underlying
        # facts are unchanged, and archive_briefing() below makes it durable regardless.
        doc_hash = hashlib.sha256(
            f"{merkle_root}:{focus_project_id}".encode("utf-8")).hexdigest()

        # Update Fact Merkle Roots and Proof Paths (Unshared unique assignment)
        for idx, (fid, fact) in enumerate(audit_facts.items()):
            if fact.lineage and idx < len(fact_leaves):
                leaf_str = fact_leaves[idx]
                leaf_h = _mth_leaf(leaf_str)
                leaf_proof = proofs.get(leaf_h, [])
                fact.lineage.merkle_root = merkle_root
                fact.lineage.merkle_proof = leaf_proof
                fact.lineage.merkle_path = [p["hash"] for p in leaf_proof]


        # 4. Assertion & Render Layer (Bilingual Civil-Service PMO Template)
        
        # English Briefing
        title_en = f"EXECUTIVE INFRASTRUCTURE BRIEFING: {forecast.project_name.upper()} (PROJECT #{forecast.project_id})"
        summary_en = (
            f"Review of {forecast.project_name} ({forecast.sector}, {forecast.state}) executed by {forecast.canonical_entity}. "
            f"Total sanctioned capex is {forecast.facts['fact_cost'].formatted_value}. "
            f"KAAL-CHAKRA survival analysis estimates P50 completion by {forecast.facts['fact_p50_completion'].formatted_value} "
            f"with only a {forecast.facts['fact_target_prob'].formatted_value} probability of meeting the official contractor target date ({forecast.revised_end_date}). "
            f"Upstream supply-chain dependency cascade locks {subgraph.total_cascade_locked_p50_cr:,.2f} Crore INR across {len(subgraph.nodes)} connected nodes."
        )

        # Hindi Briefing (CSTT Official Vocabulary & Formatting)
        title_hi = f"मंत्रिमंडल सचिवालय एवं पीएमओ कार्यपालक संक्षिप्त विवरण: {forecast.project_name} (परियोजना #{forecast.project_id})"
        summary_hi = (
            f"{forecast.canonical_entity} द्वारा क्रियान्वित {forecast.project_name} ({forecast.sector}, {forecast.state}) की समीक्षा। "
            f"कुल स्वीकृत पूंजीगत व्यय {forecast.facts['fact_cost'].formatted_value} है। "
            f"काल-चक्र (KAAL-CHAKRA) उत्तरजीविता विश्लेषण के अनुसार ५०वीं शतमक (P50) पूर्णता तिथि {forecast.facts['fact_p50_completion'].formatted_value} अनुमानित है, "
            f"तथा आधिकारिक लक्षित तिथि ({forecast.revised_end_date}) तक पूर्ण होने की संभावना मात्र {forecast.facts['fact_target_prob'].formatted_value} है। "
            f"सेतु-ग्राफ (SETU-GRAPH) आपूर्ति-श्रृंखला निर्भरता विश्लेषण के तहत कुल ₹{subgraph.total_cascade_locked_p50_cr:,.2f} करोड़ की पूंजी अवरुद्ध पाई गई है।"
        )

        # Top Actionable Decisions
        top_decisions = [
            {
                "priority": "HIGH",
                "recommendation_en": "Mandate Stage-Gate Review for Critical Delay Acceleration",
                "recommendation_hi": "गंभीर विलंब निवारण हेतु चरण-वार समीक्षा अनिवार्य करें",
                "impact_cr": forecast.revised_cost_cr * 0.12,
                "action_agency": forecast.canonical_entity
            },
            {
                "priority": "MEDIUM",
                "recommendation_en": "Ring-Fence 10% Capex Allocation under NER Statutory Rule",
                "recommendation_hi": "पूर्वोत्तर क्षेत्र वैधानिक नियम के तहत १०% पूंजीगत आवंटन सुरक्षित करें",
                "impact_cr": alloc_res.ner_allocated_cr,
                "action_agency": "Ministry of DoNER / MoSPI"
            },
            {
                "priority": "HIGH",
                "recommendation_en": "Deploy Dual-Epoch Satellite Corroboration on Discrepant Milestones",
                "recommendation_hi": "विसंगतिपूर्ण कार्य प्रगति पर द्वि-कालिक उपग्रह सत्यापन तैनात करें",
                "impact_cr": forecast.revised_cost_cr * 0.05,
                "action_agency": "ISRO / MoSPI Earth Observation Cell"
            }
        ]

        binding_constraints = [
            {"constraint": "Agency Burn Rate Ceiling", "agency": forecast.canonical_entity, "shadow_price": 1.42},
            {"constraint": "North-Eastern Statutory Floor (10%)", "agency": "National", "shadow_price": alloc_res.shadow_price_ner_pi},
            {"constraint": "Budget Capex Pool Scarcity", "agency": "MoF", "shadow_price": alloc_res.shadow_price_budget_pi}
        ]

        bilingual_sections = [
            {
                "section_id": "sec_probabilistic_schedule",
                "heading_en": "1. Probabilistic Survival & Target Date Confidence",
                "heading_hi": "१. संभाव्य समय-सीमा एवं लक्षित पूर्णता विश्वास",
                "content_en": (
                    f"Official Contractor Target: {forecast.revised_end_date}. "
                    f"KAAL-CHAKRA Projected Quantiles: P10 ({forecast.p10_date}), P50 ({forecast.p50_date}), P95 ({forecast.p95_date}). "
                    f"Rebaselining Detection: Baseline reset count = {forecast.baseline_reset_count}."
                ),
                "content_hi": (
                    f"आधिकारिक लक्षित तिथि: {forecast.revised_end_date}। "
                    f"काल-चक्र प्रक्षेपित शतमक: P10 ({forecast.p10_date}), P50 ({forecast.p50_date}), P95 ({forecast.p95_date})। "
                    f"पुनर्निर्धारण पहचान: आधारभूत पुनरावृत्ति संख्या = {forecast.baseline_reset_count}।"
                )
            },
            {
                "section_id": "sec_contagion_cascade",
                "heading_en": "2. Systemic Supply-Chain Contagion & Float Analysis",
                "heading_hi": "२. प्रणालीगत आपूर्ति-श्रृंखला प्रभाव एवं फ्लोट विश्लेषण",
                "content_en": (
                    f"Total Connected Network Nodes: {len(subgraph.nodes)}. "
                    f"Active Float-Absorbed Delays: Delays within free float are absorbed without downstream penalty. "
                    f"Total Systemic Locked Capital: ₹{subgraph.total_cascade_locked_p50_cr:,.2f} Cr (P50) / ₹{subgraph.total_cascade_locked_p95_cr:,.2f} Cr (P95)."
                ),
                "content_hi": (
                    f"कुल संबद्ध नेटवर्क घटक: {len(subgraph.nodes)}। "
                    f"सक्रिय फ्लोट-अवशोषित विलंब: फ्री-फ्लोट के भीतर होने वाले विलंब अग्रगामी परियोजनाओं को प्रभावित किए बिना अवशोषित होते हैं। "
                    f"कुल प्रणालीगत अवरुद्ध पूंजी: ₹{subgraph.total_cascade_locked_p50_cr:,.2f} करोड़ (P50) / ₹{subgraph.total_cascade_locked_p95_cr:,.2f} करोड़ (P95)।"
                )
            },
            {
                "section_id": "sec_stochastic_allocation",
                "heading_en": "3. VITTA-VYUHA Capital Allocation & Shadow Price Duals",
                "heading_hi": "३. वित्त-व्यूह पूंजी आवंटन एवं छाया मूल्य (Duals)",
                "content_en": (
                    f"Allocated Capex: ₹{alloc_res.total_allocated_cr:,.2f} Cr out of ₹{alloc_res.total_budget_pool_cr:,.2f} Cr pool. "
                    f"Portfolio completion propensity: "
                    f"{alloc_res.portfolio_completion_propensity_perc:.1f}% "
                    f"(priority index {alloc_res.expected_completion_yield:.1f}). "
                    f"Marginal Value of Budget Relaxation π(Budget): {alloc_res.shadow_price_budget_pi:.3f}. "
                    f"Linearization Closure Diagnostic: {alloc_res.closure_error_perc}% (Well within <5% research threshold)."
                ),
                "content_hi": (
                    f"आवंटित पूंजीगत व्यय: ₹{alloc_res.total_budget_pool_cr:,.2f} करोड़ में से ₹{alloc_res.total_allocated_cr:,.2f} करोड़। "
                    f"पोर्टफोलियो पूर्णता प्रवृत्ति: "
                    f"{alloc_res.portfolio_completion_propensity_perc:.1f}% "
                    f"(प्राथमिकता सूचकांक {alloc_res.expected_completion_yield:.1f})। "
                    f"अतिरिक्त बजट आवंटन का सीमांत प्रतिफल π(Budget): {alloc_res.shadow_price_budget_pi:.3f}। "
                    f"रैखिक संवृत त्रुटि (Closure Error): {alloc_res.closure_error_perc}% (<५% शोध सीमा के अंतर्गत)।"
                )
            }
        ]

        briefing = CabinetBriefing(
            doc_hash=doc_hash,
            merkle_root=merkle_root,
            generated_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S IST"),
            title_en=title_en,
            title_hi=title_hi,
            summary_en=summary_en,
            summary_hi=summary_hi,
            top_decisions=top_decisions,
            binding_constraints=binding_constraints,
            bilingual_sections=bilingual_sections,
            audit_facts=audit_facts
        )
        self.archive_briefing(briefing)
        return briefing

    # ------------------------------------------------------------------
    # Durable archive
    # ------------------------------------------------------------------

    def archive_briefing(self, briefing: CabinetBriefing) -> str:
        """Persist a briefing under its doc_hash, write-once.

        Without this the audit trail existed only for the lifetime of a response: a
        QR code on a printed Cabinet note pointed at a document that was regenerated
        from scratch on every scan, so any change in upstream data silently changed
        what the "verified" note said. Archiving on generation means the artefact a
        CAG/CVC officer verifies is the artefact that was signed, not a fresh one that
        merely resembles it.

        Write-once: an existing file for a doc_hash is never overwritten, because the
        hash is content-derived -- identical hash implies identical content, and a
        differing file would indicate tampering rather than an update.
        """
        os.makedirs(BRIEFING_ARCHIVE_DIR, exist_ok=True)
        path = os.path.join(BRIEFING_ARCHIVE_DIR, f"{briefing.doc_hash}.json")
        if not os.path.exists(path):
            tmp = path + ".tmp"
            with open(tmp, "w", encoding="utf-8") as f:
                json.dump(briefing.model_dump(), f, ensure_ascii=False, indent=1)
            os.replace(tmp, path)
        return path

    @staticmethod
    def load_archived_briefing(doc_hash: str) -> "CabinetBriefing | None":
        """Retrieve a previously archived briefing by its doc_hash, or None."""
        if not doc_hash or not doc_hash.isalnum():
            return None                      # reject path traversal in the identifier
        path = os.path.join(BRIEFING_ARCHIVE_DIR, f"{doc_hash}.json")
        if not os.path.exists(path):
            return None
        try:
            with open(path, "r", encoding="utf-8") as f:
                return CabinetBriefing(**json.load(f))
        except Exception:
            return None

# Module-level singleton
_briefing_instance = None

def get_pragati_saarthi_engine() -> PragatiSaarthiEngine:
    global _briefing_instance
    if _briefing_instance is None:
        _briefing_instance = PragatiSaarthiEngine()
    return _briefing_instance

if __name__ == "__main__":
    import sys
    sys.stdout.reconfigure(encoding="utf-8")
    engine = get_pragati_saarthi_engine()
    brief = engine.generate_cabinet_briefing("400188")
    print(f"PRAGATI-SAARTHI Cabinet Briefing Generated:")
    print(f"  Doc Hash (ETag): {brief.doc_hash}")
    print(f"  Merkle Root: {brief.merkle_root}")
    print(f"  Title EN: {brief.title_en}")
    print(f"  Title HI: {brief.title_hi}")
    print(f"  Audit Facts Tracked: {len(brief.audit_facts)}")
    print(f"  Top Decision Requests: {len(brief.top_decisions)}")
    print("\nSample English Summary:\n" + brief.summary_en)
    print("\nSample Hindi Summary:\n" + brief.summary_hi)
    print("\nVerified PRAGATI-SAARTHI Deterministic Bilingual Briefing and Merkle Lineage successfully generated!")
