"""
PRAKALP-DRISHTI: GROUNDED PROJECT INTELLIGENCE Q&A  (MoSPI Outcome h)

Free-form question answering over the Fact layer.

Architecture note, stated plainly because it is a deliberate deviation from the brief
-------------------------------------------------------------------------------------
The PS asks for an "LLM-Enabled Project Intelligence Assistant (zero-hallucination
briefings / Q&A)". This delivers the Q&A and the zero-hallucination property, but
WITHOUT a generative model, and that choice should be defended rather than hidden.

Every answer below is assembled from Fact objects that already carry SHA-256 lineage
and a Merkle inclusion proof. There is no free-text generation step, so a fabricated
figure is not merely improbable -- it is unrepresentable. An LLM would satisfy the
letter of the requirement while weakening its substance: generative models can only be
steered toward groundedness by prompting and post-hoc checking, and "steered toward"
is not a guarantee an audit ministry can rest a disbursal decision on. It would also
add multi-gigabyte weights to an air-gapped deployment for no gain in correctness.

If MoSPI later requires a generative surface, the correct design is to let a local
model PHRASE these retrieved facts while being structurally forbidden from introducing
any figure of its own -- the retrieval layer in this file stays exactly as it is.
"""

from __future__ import annotations

import re
from typing import Dict, List

# Ordered: the first pattern that matches wins, so narrower intents precede broader
# ones. "which projects should I review" must beat a bare "cost" mention.
_INTENTS = [
    ("review",    r"\b(which project|prioriti|needs? (attention|review)|worst|top \d|queue|this week|escalat)\b"),
    # satellite BEFORE evidence: "satellite verification" matches both, and the caller
    # asking about imagery wants the imagery answer, not a lecture on Merkle proofs.
    ("satellite", r"(satellite|imagery|orbital|ground[- ]truth|photo|visual)"),
    # \w* suffixes so inflections match: verified/verifiable, trusted, depends/dependency.
    # "how do (i|we|you) know" all appear in real questioning; anchoring on one was a bug.
    ("evidence",  r"(proof|evidence|audit trail|verif\w*|lineage|merkle|provenance|trust\w*|"
                  r"how do (i|we|you) know|is (this|that) (true|reliable|accurate)|says who)"),
    ("contagion", r"(depend\w*|connect\w*|cascad\w*|contagion|downstream|upstream|ripple|network)"),
    ("risk",      r"(risk\w*|danger\w*|concern\w*|likelihood|how safe|red flag|troubl\w*)"),
    ("schedule",  r"\b(when|finish|complete|deadline|date|delay|late|slip|schedule|timeline|overdue)\b"),
    ("cost",      r"\b(cost|overrun|budget|capex|escalat|crore|expensive|money)\b"),
    ("agency",    r"\b(agency|contractor|executing|who is building|psu|company)\b"),
]


def classify_intent(question: str) -> str:
    q = (question or "").lower()
    for name, pattern in _INTENTS:
        if re.search(pattern, q):
            return name
    return "overview"


# ═══════════════════════════════════════════════════════════════════════════════
# QUERY ROUTING  —  three modes, because they need three different guarantees
# ═══════════════════════════════════════════════════════════════════════════════
#
# The single-mode design could only answer from the Fact layer, so "does a 24%
# overrun mandate CCEA re-approval?" fell through to a generic overview. But the
# three modes cannot share one safety rule, and that is the whole design:
#
#   PROJECT_FACT_QUERY      every figure must come from the Fact layer.
#                           Merkle-provenanced. Guard is strict.
#   HYBRID_ANALYTICAL_QUERY project figures from the Fact layer (strict);
#                           statutory reasoning around them is free.
#   GENERAL_QUERY           no project figures at all. NOT provenanced, and
#                           labelled as such in the response envelope.
#
# A general answer citing "Section 11(4)" is legitimate; the same string inside a
# project answer is not, because the badge next to it vouches for the sentence.
# One guard cannot serve both, so the mode decides which guard runs.

# HARD policy markers: a named statute, body, instrument or contract regime.
# Their presence means the question is about the rulebook.
_POLICY_MARKERS = re.compile(
    r"\b(ccea|cabinet committee|mospi|niti aayog|pmo\b|guideline|circular|"
    r"statut\w*|regulat\w*|polic(?:y|ies)|act\b|clause|section \d|rule \d|"
    r"fidic|epc\b|ppp\b|ham\b|bot\b|concession|arbitrat\w*|dispute resolution|"
    r"land acquisition|rfctlarr|forest clearance|environment\w* clearance|parivesh|"
    r"cag\b|cvc\b|audit norm|general financial rule|gfr\b|cpwd|gcc\b|"
    r"appraisal|re-?approval|sanction procedure|tender|procurement)\b",
    re.I)

# SOFT advisory markers: the question asks to be taught or advised rather than
# told a fact. Deliberately does NOT include bare "what is/are" -- that opens
# almost every question, including "what is the timeline for this project",
# and routing that to GENERAL would drop the Fact layer entirely.
_ADVISORY_MARKERS = re.compile(
    r"\b(explain|define|what does .{0,24}\bmean|how does .{0,30}\bwork|"
    r"best practice|recommend\w*|advice|advise|methodolog\w*|rule of thumb|"
    r"typical\w*|general\w*|common (causes|reasons|issues)|in your (view|opinion)|"
    r"how should|what should (we|i|one))\b",
    re.I)

# CONVERSATIONAL openers. Typing "hey" into an assistant is not a policy query,
# and answering it with "No substantive query detected; unable to provide a policy
# or procedural response" is what a form does, not what an assistant does. The
# three analytical modes had no room for a greeting, so every greeting fell
# through to GENERAL and came back as a refusal.
_CONVERSATIONAL = re.compile(
    r"^\s*(?:"
    r"h(?:i+|ey+|ello+|iya)|yo+|greetings|good\s*(?:morning|afternoon|evening|day)|"
    r"namaste|namaskar|namaskaar|vanakkam|sat\s*sri\s*akal|adab|salaam|assalam[ou]?\s*alaikum|"
    r"thanks?|thank\s*you|thx|ty|dhanyavaad|dhanyawad|shukriya|"
    r"bye|goodbye|see\s*you|ok(?:ay)?|k|cool|nice|great|got\s*it|alright|understood|"
    r"test(?:ing)?|ping|hmm+|hm+"
    r")\b[\s!.?,]*$",
    re.I)

# Meta questions about the assistant itself, at any length.
_META_ABOUT_SELF = re.compile(
    r"\b(?:what\s+(?:can|do)\s+you\s+(?:do|help)|who\s+are\s+you|what\s+are\s+you|"
    r"how\s+(?:do|can)\s+i\s+use|what\s+can\s+i\s+ask|help\s+me\s+get\s+started|"
    r"your\s+capabilit|what\s+is\s+this|kya\s+kar\s+sakte|tum\s+kaun|aap\s+kaun|"
    r"kaise\s+use|kya\s+kar\s+sakta)\b",
    re.I)

# Native-script greetings and thanks for the supported languages.
_NATIVE_GREETINGS = (
    "नमस्ते", "नमस्कार", "धन्यवाद", "শুভেচ্ছা", "নমস্কার", "ধন্যবাদ",
    "నమస్కారం", "ధన్యవాదాలు", "வணக்கம்", "நன்றி", "નમસ્તે", "આભાર",
    "ನಮಸ್ಕಾರ", "ಧನ್ಯವಾದ", "നമസ്കാരം", "നന്ദി", "ਸਤ ਸ੍ਰੀ ਅਕਾਲ", "ਧੰਨਵਾਦ",
    "ନମସ୍କାର", "ଧନ୍ୟବାଦ", "آداب", "شکریہ", "السلام علیکم",
)


# ── NATIVE-SCRIPT SIGNALS ────────────────────────────────────────────────────
#
# Every pattern above is English-only. That was invisible while the copilot was
# English-only too, but the moment it accepts Hindi it becomes a correctness bug:
# a Hindi question matches no intent, no deixis and no policy marker, so it fell
# through the classifier's catch-all into GENERAL_QUERY. Measured: an officer
# asking "इस परियोजना की लागत वृद्धि कितनी है?" -- literally "what is this
# project's cost increase?" -- was answered with a generic lecture on CCEA
# thresholds instead of the project's verified +142.7%.
#
# The lexicon is intentionally small: the words an officer actually types when
# asking about money, time, risk, imagery or dependencies.

_NATIVE_INTENT_WORDS = {
    "cost": (
        "लागत", "खर्च", "व्यय", "किंमत", "ओवररन", "वृद्धि", "वाढ",          # hi/mr
        "ব্যয়", "খরচ", "বৃদ্ধি",                                          # bn
        "ఖర్చు", "వ్యయం", "పెరుగుదల",                                     # te
        "செலவு", "அதிகரிப்பு",                                            # ta
        "ખર્ચ", "વધારો",                                                  # gu
        "ವೆಚ್ಚ", "ಹೆಚ್ಚಳ",                                                # kn
        "ചെലവ്", "വർധന",                                                  # ml
        "ਲਾਗਤ", "ਵਾਧਾ",                                                   # pa
        "ମୂଲ୍ୟ", "ବୃଦ୍ଧି",                                                # or
        "لاگت", "اخراجات",                                                # ur
    ),
    "schedule": (
        "कब", "समय", "देरी", "विलंब", "तारीख", "पूरा", "कधी", "वेळ", "उशीर",
        "কবে", "সময়", "বিলম্ব", "দেরি",
        "ఎప్పుడు", "సమయం", "ఆలస్యం",
        "எப்போது", "நேரம்", "தாமதம்",
        "ક્યારે", "સમય", "વિલંબ",
        "ಯಾವಾಗ", "ಸಮಯ", "ವಿಳಂಬ",
        "എപ്പോൾ", "സമയം", "കാലതാമസം",
        "ਕਦੋਂ", "ਸਮਾਂ", "ਦੇਰੀ",
        "କେବେ", "ସମୟ", "ବିଳମ୍ବ",
        "کب", "تاخیر",
    ),
    "risk": (
        "जोखिम", "खतरा", "धोका", "ঝুঁকি", "ప్రమాదం", "ஆபத்து", "જોખમ",
        "ಅಪಾಯ", "അപകടം", "ਜੋਖਮ", "ବିପଦ", "خطرہ",
    ),
    "satellite": (
        "उपग्रह", "सैटेलाइट", "उपग्रहीय", "উপগ্রহ", "ఉపగ్రహ", "செயற்கைக்கோள்",
        "ઉપગ્રહ", "ಉಪಗ್ರಹ", "ഉപഗ്രഹ", "ਸੈਟੇਲਾਈਟ", "ଉପଗ୍ରହ", "سیٹلائٹ",
    ),
    "contagion": (
        "निर्भर", "अवलंबून", "নির্ভর", "ఆధారపడ", "சார்பு", "આધારિત",
        "ಅವಲಂಬಿತ", "ആശ്രിത", "ਨਿਰਭਰ", "ନିର୍ଭର",
    ),
}

# Words that mean "project" — the deixis signal in native scripts.
_NATIVE_PROJECT_WORDS = (
    "परियोजना", "प्रकल्प", "प्रोजेक्ट", "প্রকল্প", "ప్రాజెక్ట్", "திட்டம்",
    "પ્રોજેક્ટ", "ಯೋಜನೆ", "പദ്ധതി", "ਪ੍ਰੋਜੈਕਟ", "ପ୍ରକଳ୍ପ", "منصوبہ", "پروجیکٹ",
)

# Statutory bodies and instruments as written in native scripts.
_NATIVE_POLICY_WORDS = (
    "मंत्रालय", "नियम", "अधिनियम", "कानून", "दिशानिर्देश", "मंजूरी", "अनुमोदन",
    "মন্ত্রণালয়", "নিয়ম", "আইন", "మంత్రిత్వ", "నియమ", "చట్టం",
    "அமைச்சகம்", "விதி", "சட்டம்", "મંત્રાલય", "નિયમ", "કાયદો",
    "ಸಚಿವಾಲಯ", "ನಿಯಮ", "ಕಾನೂನು", "മന്ത്രാലയം", "നിയമം",
    "ਮੰਤਰਾਲਾ", "ਨਿਯਮ", "ਕਾਨੂੰਨ", "ମନ୍ତ୍ରଣାଳୟ", "ନିୟମ", "قانون", "وزارت",
)


def _native_intent(q: str) -> str:
    for name in ("satellite", "contagion", "risk", "schedule", "cost"):
        if any(w in q for w in _NATIVE_INTENT_WORDS[name]):
            return name
    return "overview"


def _is_conversational(q: str) -> bool:
    if _META_ABOUT_SELF.search(q):
        return True
    stripped = q.strip().strip("!?.,। ")
    if any(stripped.startswith(g) or stripped == g for g in _NATIVE_GREETINGS):
        return len(stripped.split()) <= 4
    return bool(_CONVERSATIONAL.match(q))


# A question is about a SPECIFIC project when it names one, or when it uses a
# deictic reference that only resolves against the project in view.
_PROJECT_DEIXIS = re.compile(
    r"\b(this project|this one|it|its|the project|here|current project)\b", re.I)

_EXPLICIT_PID = re.compile(r"#\s*(\d{4,7})\b|\bproject\s*(?:id\s*)?#?\s*(\d{4,7})\b", re.I)


def extract_project_id(question: str, default_pid: str = "") -> tuple:
    """(project_id, was_explicit). Falls back to the project in view."""
    m = _EXPLICIT_PID.search(question or "")
    if m:
        return (m.group(1) or m.group(2)), True
    return str(default_pid or ""), False


def classify_query(question: str, default_pid: str = "400188") -> Dict:
    """Route a question to one of the three modes.

    Returned dict is the routing decision AND its justification, so a reviewer
    can see why a question was treated as general rather than project-grounded.
    """
    from analytics_engine.copilot_lang import detect_language

    q = (question or "").strip()
    pid, explicit = extract_project_id(q, default_pid)
    intent = classify_intent(q)
    lang = detect_language(q)

    # Checked FIRST. A greeting must never be forced through an analytical mode
    # just because "ok" happens to contain no policy marker.
    if _is_conversational(q):
        return {
            "mode": "CONVERSATIONAL_QUERY",
            "project_id": pid,
            "project_id_explicit": explicit,
            "intent": "conversational",
            "language": lang,
            "signals": {"conversational": True, "policy_marker": False,
                        "advisory_marker": False, "fact_intent": False,
                        "project_reference": explicit},
        }

    # Native-script signals are folded in alongside the English ones, so a Hindi
    # or Tamil question is routed on its own words rather than on their absence.
    if intent == "overview":
        intent = _native_intent(q)

    has_policy = bool(_POLICY_MARKERS.search(q)) or any(w in q for w in _NATIVE_POLICY_WORDS)
    has_advisory = bool(_ADVISORY_MARKERS.search(q))
    # An intent match means the question asked for something the Fact layer holds.
    has_fact_pull = intent != "overview"
    has_project_ref = (explicit
                       or bool(_PROJECT_DEIXIS.search(q))
                       or any(w in q for w in _NATIVE_PROJECT_WORDS))

    # A non-Latin question that matched nothing is far more likely to be about
    # the project on screen than a policy essay: the officer opened a project and
    # typed in their own language. Defaulting such input to GENERAL sent it down
    # the one path that has no project data attached.
    if not (has_policy or has_advisory or has_fact_pull or has_project_ref):
        if lang.get("code") not in ("en", "hinglish"):
            has_project_ref = True

    # HYBRID requires an actual PROJECT REFERENCE, not merely a fact keyword.
    # "When is Cabinet approval required?" contains "when", which matches the
    # schedule intent, but it asks about the rulebook and not about any project.
    # Gating hybrid on a real reference is what separates the two.
    if has_policy and has_project_ref:
        mode = "HYBRID_ANALYTICAL_QUERY"
    elif has_policy or (has_advisory and not has_project_ref):
        mode = "GENERAL_QUERY"
    elif has_project_ref or has_fact_pull:
        mode = "PROJECT_FACT_QUERY"
    else:
        # Nothing identifiable. Treat as general rather than silently answering
        # about whichever project happens to be on screen.
        mode = "GENERAL_QUERY"

    return {
        "mode": mode,
        "project_id": pid,
        "project_id_explicit": explicit,
        "intent": intent,
        "language": lang,
        "signals": {
            "conversational": False,
            "policy_marker": has_policy,
            "advisory_marker": has_advisory,
            "fact_intent": has_fact_pull,
            "project_reference": has_project_ref,
        },
    }


def _portfolio_overrun_benchmark():
    """Deployed-vs-baseline cost-model MAE, read from the artifact."""
    import json, os
    path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "artifacts", "overrun_models.json")
    try:
        with open(path, "r", encoding="utf-8") as fh:
            v = json.load(fh)["targets"]["cost_overrun_pct"]["cuf_only"]
        return {
            "gb_mae": float(v["gradient_boosting"]["mae"]),
            "sector_mean_mae": float(v["sector_mean_baseline"]["mae"]),
            "ols_mae": float(v["ols_linear_regression"]["mae"]),
        }
    except Exception:
        return None


class ProjectContextBuilder:
    """Assemble every engine's view of one project into one structured payload.

    Each engine is called defensively: an engine that raises contributes an
    explicit `{"available": false, "reason": ...}` block rather than being
    silently omitted. A missing signal that looks like an absent risk is exactly
    the failure mode risk_index.py renormalises against, and the copilot must
    not reintroduce it one layer up.
    """

    def build(self, project_id: str) -> Dict:
        pid = str(project_id)
        ctx: Dict = {"project_id": pid, "sections": {}}

        def section(name: str, fn):
            try:
                ctx["sections"][name] = {"available": True, "data": fn()}
            except KeyError as e:
                ctx["sections"][name] = {"available": False,
                                         "reason": f"project not found: {e}"}
            except Exception as e:
                ctx["sections"][name] = {"available": False,
                                         "reason": f"{type(e).__name__}: {e}"}

        def _schedule():
            from analytics_engine.kaal_chakra import get_kaal_chakra_engine
            fc = get_kaal_chakra_engine().forecast_project(pid)
            unc = fc.facts["fact_p50_completion"].uncertainty
            return {
                "project_name": fc.project_name, "sector": fc.sector,
                "state": fc.state, "executing_entity": fc.canonical_entity,
                "physical_progress_pct": fc.physical_progress_perc,
                "sanction_date": fc.sanction_date,
                "original_end_date": fc.original_end_date,
                "revised_end_date": fc.revised_end_date,
                "p10_date": fc.p10_date, "p50_date": fc.p50_date,
                "p80_date": fc.p80_date, "p95_date": fc.p95_date,
                "prob_official_target_met": fc.prob_target_met_official,
                "prob_rebaselined_target_met": fc.prob_target_met_rebaselined,
                "interval_coverage_measured": (unc.empirical_coverage if unc else None),
                "competing_risk_state": fc.competing_risk_state,
            }

        def _cost():
            from analytics_engine.kaal_chakra import get_kaal_chakra_engine
            fc = get_kaal_chakra_engine().forecast_project(pid)
            return {
                "original_cost_cr": fc.original_cost_cr,
                "revised_cost_cr": fc.revised_cost_cr,
                "cost_overrun_cr": fc.cost_overrun_cr,
                "cost_overrun_pct": fc.cost_overrun_perc,
                "baseline_reset_severity_tier": fc.baseline_reset_count,
                "baseline_reset_tier_meaning":
                    "0 = no revision, 1 = rebaselined, 2 = rebaselined with >50% overrun. "
                    "This is a severity tier, NOT a count of reset events.",
                "rebaselined": fc.rebaselined,
                "portfolio_model_benchmark": _portfolio_overrun_benchmark(),
            }

        def _satellite():
            from analytics_engine.satellite_fusion import get_satellite_fusion_engine
            s = get_satellite_fusion_engine().get_satellite_audit(pid)
            return {k: s.get(k) for k in (
                "audit_status", "statutory_recommendation", "audit_severity",
                "surface_change_pct", "project_footprint_change_pct",
                "footprint_reliable", "footprint_caveat", "gsd_m_per_px",
                "vegetation_excluded_pct", "baseline_vintage", "current_vintage",
                "eo_verdict_reliable", "eo_unreliable_reason",
                "claimed_progress_pct", "geocode_confidence")}

        def _contagion():
            from analytics_engine.setu_graph import get_setu_graph_engine
            sub = get_setu_graph_engine().get_k_hop_subgraph(pid, k=2)
            centre = next((n for n in sub.nodes if str(n.project_id) == pid), None)
            return {
                "neighbourhood_nodes": len(sub.nodes),
                "dependency_links": len(sub.edges),
                "cascade_locked_p50_cr": sub.total_cascade_locked_p50_cr,
                "cascade_locked_p95_cr": sub.total_cascade_locked_p95_cr,
                "acyclic_dag_verified": sub.acyclic_dag_verified,
                "free_float_months": (centre.free_float_months if centre else None),
                "total_float_months": (centre.total_float_months if centre else None),
                "propagated_delay_months": (centre.propagated_delay_months if centre else None),
                "shapley_criticality_cr": (centre.shapley_criticality_phi if centre else None),
            }

        def _risk():
            from analytics_engine.risk_index import get_risk_index_engine
            r = get_risk_index_engine().get_project_risk(pid)
            if not r:
                raise KeyError(pid)
            return r

        def _directives():
            from analytics_engine.pmo_copilot import get_pmo_copilot_engine
            return get_pmo_copilot_engine().query_copilot(pid)

        section("schedule", _schedule)
        section("cost", _cost)
        section("satellite_eo", _satellite)
        section("contagion", _contagion)
        section("composite_risk", _risk)
        section("statutory_directives", _directives)

        ctx["available_sections"] = [k for k, v in ctx["sections"].items() if v["available"]]
        ctx["unavailable_sections"] = [k for k, v in ctx["sections"].items() if not v["available"]]
        return ctx


_CONTEXT_BUILDER = ProjectContextBuilder()


def build_project_context(project_id: str) -> Dict:
    return _CONTEXT_BUILDER.build(project_id)


def answer_question(question: str, project_id: str = "400188") -> Dict:
    """Answer strictly from computed facts; decline when no fact supports an answer."""
    from analytics_engine.kaal_chakra import get_kaal_chakra_engine
    from analytics_engine.satellite_fusion import get_satellite_fusion_engine
    from analytics_engine.setu_graph import get_setu_graph_engine

    pid = str(project_id)
    intent = classify_intent(question)
    fc = get_kaal_chakra_engine().forecast_project(pid)
    sat = get_satellite_fusion_engine().get_satellite_audit(pid)

    cited: List[str] = []

    def cite(*ids: str) -> None:
        for i in ids:
            if i not in cited:
                cited.append(i)

    if intent == "schedule":
        cite(f"fact_p50_{pid}", f"fact_target_prob_{pid}")
        unc = fc.facts["fact_p50_completion"].uncertainty
        cov = (f"conformally calibrated, measured {unc.empirical_coverage*100:.1f}% coverage"
               if unc and unc.empirical_coverage else "uncalibrated (coverage unmeasured)")
        answer = (
            f"Most likely completion is {fc.p50_date} (P50); optimistic {fc.p10_date}, "
            f"tail {fc.p95_date}. Probability of meeting the official target of "
            f"{fc.revised_end_date} is {fc.prob_target_met_official*100:.1f}%. "
            f"Interval is {cov}.")

    elif intent == "cost":
        cite(f"fact_cost_{pid}", f"fact_overrun_{pid}")
        # Portfolio model accuracy is READ from the artifact, never typed here.
        # This sentence previously stated "MAE 14.2 pp versus 16.1 pp for an OLS
        # baseline"; the measured values are 16.240 and 16.669. A stale hardcoded
        # metric inside a Merkle-grounded answer is the worst place for one --
        # the provenance badge vouches for the sentence containing it.
        bench = _portfolio_overrun_benchmark()
        bench_txt = (
            f" Portfolio-wide the deployed cost model reaches MAE "
            f"{bench['gb_mae']:.2f} pp against {bench['sector_mean_mae']:.2f} pp for a "
            f"sector-mean baseline on the same chronologically held-out split."
            if bench else "")
        answer = (
            f"Capex is ₹{fc.revised_cost_cr:,.2f} Cr against an original "
            f"₹{fc.original_cost_cr:,.2f} Cr — a movement of {fc.cost_overrun_perc:+.1f}%, "
            f"with baseline-reset severity tier {fc.baseline_reset_count} "
            f"(0 = no revision, 1 = rebaselined, 2 = rebaselined with >50% overrun)."
            + bench_txt)

    elif intent == "risk":
        try:
            from analytics_engine.risk_index import get_risk_index_engine
            r = get_risk_index_engine().get_project_risk(pid)
        except Exception:
            r = None
        if r:
            cite(f"fact_target_prob_{pid}")
            top = sorted(r["contributions"].items(), key=lambda kv: -kv[1])[:3]
            answer = (
                f"Composite risk {r['risk_score']}/100 — band {r['risk_band']}. Largest "
                f"contributors: " + "; ".join(
                    f"{k.replace('_', ' ')} {v} pts" for k, v in top) +
                f". Built from {r['components_available']} of {r['components_total']} "
                f"signals; unavailable signals are renormalised, never scored as zero risk.")
        else:
            answer = "No composite risk score is available for this project."

    elif intent == "satellite":
        cite(f"fact_sat_audit_{pid}")
        if not sat.get("eo_verdict_reliable"):
            answer = (
                f"No Earth-observation verdict is issued. "
                f"{sat.get('eo_unreliable_reason') or ''} The imagery is not confirmed to "
                f"show these works, so a finding would not be defensible. Physical "
                f"inspection applies.").strip()
        else:
            # Epoch vintages are READ from the audit payload. They were hardcoded as
            # "between 2018 and 2023"; the resolver now returns real per-project
            # capture dates spanning 2014-2026, so a fixed pair was wrong for most
            # projects and invisibly so.
            v0 = sat.get("baseline_vintage") or "the baseline epoch"
            v1 = sat.get("current_vintage") or "the current epoch"
            pct = sat.get("change_percentile_in_sector")
            pct_txt = (f" — {pct}th percentile for its sector" if pct is not None else "")
            answer = (
                f"Measured surface change at the site is {sat.get('surface_change_pct')}% "
                f"between {v0} and {v1}{pct_txt}. Status {sat.get('audit_status')}. This "
                f"measures ground transformation, not percentage complete; imagery cannot "
                f"support a completion figure.")

    elif intent == "contagion":
        sub = get_setu_graph_engine().get_k_hop_subgraph(pid, k=2)
        answer = (
            f"Sits in a {len(sub.nodes)}-node dependency neighbourhood with "
            f"{len(sub.edges)} links. Capital locked by cascading delay: "
            f"₹{sub.total_cascade_locked_p50_cr:,.2f} Cr (P50), "
            f"₹{sub.total_cascade_locked_p95_cr:,.2f} Cr (P95).")

    elif intent == "review":
        try:
            from analytics_engine.risk_index import get_risk_index_engine
            q = get_risk_index_engine().get_early_warning_queue(limit=5)
            answer = (
                "Top 5 by exposure-weighted priority: " + "; ".join(
                    f"{a['project_name'][:38]} ({a['risk_band']} {a['risk_score']})"
                    for a in q["alerts"]) +
                f". Combined capex at stake ₹{q['capex_at_risk_cr']:,.0f} Cr.")
        except Exception:
            answer = "The early-warning queue is currently unavailable."

    elif intent == "agency":
        cite(f"fact_cost_{pid}")
        answer = (f"Executed by {fc.canonical_entity} in {fc.state}, sector {fc.sector}. "
                  f"Agency delay rates and velocity scores are in the Agency Index.")

    elif intent == "evidence":
        cite(f"fact_cost_{pid}")
        answer = (
            f"Each figure is a Fact carrying a query hash, dataset hash, model hash and a "
            f"Merkle inclusion proof against the briefing root. Briefings are archived "
            f"write-once under a content-addressed doc_hash, so a printed note verifies "
            f"against the document actually issued rather than a regeneration. Geocode "
            f"confidence here is {sat.get('geocode_confidence')}.")

    else:
        cite(f"fact_cost_{pid}", f"fact_progress_{pid}")
        answer = (
            f"{fc.project_name} — {fc.sector}, {fc.state}, executed by "
            f"{fc.canonical_entity}. Capex ₹{fc.revised_cost_cr:,.2f} Cr, physical "
            f"progress {fc.physical_progress_perc:.1f}%, most likely completion "
            f"{fc.p50_date}.")

    return {
        "question": question,
        "project_id": pid,
        "intent": intent,
        "answer": answer,
        "cited_fact_ids": cited,
        "generative_model_used": False,
        "grounding": ("Deterministic retrieval over Merkle-verifiable Fact objects. No "
                      "generative model participates, so a fabricated figure is "
                      "unrepresentable rather than merely unlikely."),
        "supported_intents": [n for n, _ in _INTENTS] + ["overview"],
    }


# ═══════════════════════════════════════════════════════════════════════════════
# CONVERSATIONAL REPLY  (works with no model configured)
# ═══════════════════════════════════════════════════════════════════════════════
#
# When a model is available it writes this reply fluently in the officer's own
# language. When one is not -- the air-gapped default -- the greeting is still
# answered here, natively, rather than falling back to a refusal.
#
# The native text is deliberately limited to the greeting itself, which is short
# and safe to get right. The capability lines stay in English rather than shipping
# machine-translated administrative prose in nine languages that nobody on this
# team can proofread. Claiming a fluency the offline path does not have would be
# the same class of overclaim this system exists to avoid.

_CAPABILITY_LINES = [
    "Completion forecast with a calibrated P10-P95 band, and the probability of hitting the official target",
    "Cost position: original vs revised capex, overrun, and rebaselining severity",
    "Satellite corroboration: dated before/after imagery and whether the ground actually changed",
    "Dependency contagion: what stops downstream, and the capital that locks up",
    "Composite risk, and how a statutory rule such as the CCEA 20% threshold applies here",
]


def conversational_reply(lang: Dict, project_id: str = "") -> str:
    """A warm, useful greeting — never a refusal."""
    hello = lang.get("hello") or "Hello"
    name = lang.get("name") or "English"
    pid = f" #{project_id}" if project_id else ""

    if lang.get("code") == "en":
        opener = f"Hello — I'm the PRAKALP-DRISHTI decision copilot for project{pid}."
        tail = ("Ask me in plain language, in English, Hinglish, or any of ten Indian "
                "languages — I'll reply in whichever you use.")
    elif lang.get("code") == "hinglish":
        opener = f"Namaste — main PRAKALP-DRISHTI ka decision copilot hoon, project{pid} ke liye."
        tail = ("Aap English, Hinglish ya kisi bhi Indian language mein pooch sakte hain — "
                "main usi mein jawab dunga.")
    else:
        opener = (f"{hello} — I'm the PRAKALP-DRISHTI decision copilot for project{pid}. "
                  f"I can reply in {name}; the offline mode answers in English.")
        tail = (f"Ask in {name} and I will answer in {name} whenever the language "
                f"model is reachable.")

    bullets = "\n".join(f"• {c}" for c in _CAPABILITY_LINES)
    return f"{opener}\n\nI can help with:\n{bullets}\n\n{tail}"
