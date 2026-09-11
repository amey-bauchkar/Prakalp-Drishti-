# SIH 2026 Idea Deck — Build Rationale, Evidence Map & Judge Audit

**Deliverables**
- `SIH2026_PRAKALP_DRISHTI_IDEA.pptx` — built on the official SIH 2026 template
- `SIH2026_PRAKALP_DRISHTI_IDEA.pdf` — 6 pages, 1.13 MB, the file to upload

**Compliance check**

| Rule (official template, slide 7) | Status |
|:---|:---|
| Max 6 slides including title | 6 exactly; instructions slide deleted |
| Points / diagrams / infographics, no paragraphs | No paragraph blocks; 3 custom diagrams + 2 real screenshots |
| Provided template only, pointers unchanged | Template chrome, masters, titles and section topics preserved |
| Upload as PDF | Exported via PowerPoint, 6 pages |

---

## A. What the system actually does

A decision layer over MoSPI's PAIMANA project-monitoring data. Not a replacement — an
analytical tier above it.

**Scale (measured, not estimated):** ~47,000 lines of Python, ~17,900 lines of frontend,
87 live API endpoints, 18 views, 19 test suites, 476 assertions.

**Data path.** `corpus_source.py` is a single read seam. Supabase PostgreSQL
(ap-south-1, Mumbai) is the write path; an in-memory pandas frame is the read path.
The corpus is sealed as an RFC 6962 Merkle root over canonically-serialised rows, so a
CSV bootstrap and a Postgres read produce the same root.

**Engines.**
- **KAAL-CHAKRA** — log-logistic AFT fitted by penalised MLE under right-censoring
  (115 observed completions, 1,988 censored), then split-conformal calibration of the
  displayed P10–P95 fan on the engine's own median (79.0% measured at nominal 85%).
- **SETU-GRAPH** — Tarjan SCC condensation to a DAG, Max-Plus float algebra separating
  free float from total float, permutation Monte-Carlo Shapley criticality.
- **VITTA-VYUHA** — two-stage stochastic **LP** (HiGHS) with Rockafellar–Uryasev CVaR₉₀
  and a hard 10% North-Eastern floor; exact duals extracted.
- **PRATIBIMB / KAAL-DARPAN** — dated dual-epoch optical audit against ESRI Wayback,
  RRN-normalised, ExG/VARI vegetation-masked. Emits **evidence verdicts**, never a
  satellite completion percentage.
- **SATYA-KAVACH / KARYA-DAKSHATA** — 20% CCEA threshold bunching, GCC Clause 10CC
  escalation audit, agency capability index.
- **PRAGATI-SAARTHI** — bilingual briefings; every figure carries a Merkle inclusion proof.

**Where the intelligence genuinely is.** Strip out the LLM and nothing quantitative is
lost — the copilot only *phrases* facts the engines computed. The real machine learning
is the censored-MLE survival fit and the conformal calibration; the real computer science
is the graph condensation, the LP duals and the Merkle construction. That distinction is
made explicitly on slide 2 rather than hidden.

---

## B. Audit of the existing deck — **28 / 100**

`PRAKALP_DRISHTI_MASTER_DECK.pptx` (16 slides, 22 Aug) is a team-orientation deck and is
**unusable as an SIH submission**. Beyond exceeding the 6-slide limit, it contradicts the
project's own claims ledger:

| Claim in the old deck | Reality (`CLAIMS.md`) |
|:---|:---|
| "Sentinel-2 NDBI/NDVI spectral differencing" | **Refused** — basemap is RGB only, no NIR/SWIR |
| "Sentinel-1 SAR penetrates monsoon clouds" | Not implemented anywhere |
| "VIIRS Nighttime Lights Index" | Not implemented |
| "sub-meter satellite change detection" | **Refused** — measured GSD 2.08–2.35 m/px |
| "HiGHS **MILP** solver" | All variables continuous — it is an LP |
| "EO-Observed Surface Activity: 31.2% vs 74% claimed → 42.8-point divergence" | The removed circular metric. Surface change vs progress correlates at **r = +0.004** (`artifacts/eo_progress_independence.json`) |
| "DPR-Quality Scorer (NLP, 0–100)" | The `soham` module returned `np.random.uniform(42,64)` and was **deleted** |
| "₹8,420 Cr downstream exposure", "Mumbai Metro P10–P95" | Illustrative numbers with no artifact behind them |
| TimescaleDB, DuckDB-WASM, Next.js, deck.gl | Actual stack: FastAPI, React+Vite, Supabase Postgres |

A judge who opened the repository after reading that deck would find the code contradicting
the pitch. That reads as knowing overclaim. **None of it was carried forward.**

---

## C. SIH research — what actually moves the needle

Internal-round weighting reported across institute guidance:

| Criterion | Weight |
|:---|:---|
| Innovation & Technical Excellence | **30%** |
| Problem Understanding & Impact | 25% |
| Feasibility, Practicability & Scalability | 25% |
| Solution Quality & Presentation | 20% |

Recurring patterns in shortlisted work:
1. **The PPT is the first filter.** Judges form a view before any demo.
2. **Problem fit beats technology count.** A well-scoped problem deeply understood beats
   an ambitious one poorly executed. Buzzword density is a negative signal.
3. **Evidence of a working build** separates shortlisted teams from idea-stage ones.
4. **Unsupported numbers are the fastest rejection.** Reviewers check completeness and
   plausibility; a number with no visible provenance taints the rest of the deck.

Deck consequence: every headline is conclusion-driven, every number carries its base and
definition, and slide 4 exists purely to prove the thing runs.

---

## D. Gap analysis

| Dimension | Winning pattern | Our state before | Action taken |
|:---|:---|:---|:---|
| Problem clarity | One sharp, quantified failure | Five bottlenecks, none quantified | Reduced to one measured finding: 629 projects / ₹14.60 L Cr invisible |
| PS alignment | Explicit link to the PS | Implicit | PS ID + title on slide 1; "decision layer over PAIMANA" framing |
| Innovation | Something genuinely new | Buried under 11 modules | Rebaselining-aware delay accounting made the headline |
| AI/ML credibility | Honest about method | Overclaimed (NDVI, SAR, MILP) | Retracted; refusal ledger put **on the slide** |
| Data credibility | Sourced and dated | Mixed real + illustrative | Only reproducible figures; Merkle root printed |
| Validation | Measured, with baselines | Absent | 79.0% fan coverage measured on the displayed fan, 12.2% lift over sector-mean, ablation disclosed |
| Feasibility | Working prototype | Claimed, not shown | Live portal screenshot + 476/476 + 87 endpoints |
| Visual communication | Diagram-led | Text-heavy | 3 custom diagrams, 2 screenshots, no paragraph blocks |

---

## E. Killer differentiators

1. **The rebaselining discovery.** 629 ongoing projects (₹14.60 L Cr) are late against
   their original Cabinet-approved date but appear on-time on a revised-date dashboard —
   **50.5% of every genuinely late project**. Computed from the official corpus, reproducible.
2. **Refusal as an engineering artifact.** `CLAIMS.md` classifies every capability as
   fitted / heuristic / refused. Putting refusals on a pitch slide is unusual and reads as
   competence rather than weakness.
3. **Provenance to the row.** RFC 6962 Merkle root over canonically-serialised rows; every
   briefing figure carries an inclusion proof that fails closed.
4. **Honest Earth observation.** Real dated epochs resolved from 196 archive releases, with
   a documented refusal to convert imagery into a completion percentage (r = +0.004, persisted).
5. **Sovereign by default.** Air-gapped operation is the default configuration, not a mode.

**What a judge should remember 30 minutes later:** *the team that found half of India's
project delay is invisible — and published what their own model cannot do.*

---

## F. Narrative arc

Problem → half the delay is hidden by rebaselining · Stakes → ₹14.60 L Cr unmonitored ·
Insight → measure against the original baseline · Solution → five engines over PAIMANA ·
Engine → censored survival + conformal calibration + graph float + LP duals + dated imagery ·
Proof → all suites green, 79.0% measured fan coverage, live portal · Scale → Postgres write path already live ·
Impact → governance, economic, administrative, civic · End state → every Cabinet number
independently verifiable.

---

## G. Slide blueprint

| # | Headline | Judge question answered | Visual | Takeaway |
|:--|:---|:---|:---|:---|
| 1 | PRAKALP-DRISHTI | Who are you, which PS? | Template identity | Serious MoSPI submission |
| 2 | "Half of India's project delay is invisible to the dashboard that monitors it." | What's broken, what did you build, why is it new? | Camouflage chart + WDFC flagship case | They found something nobody else measured |
| 3 | "One read seam, five engines, and a proof on every number." | Does the architecture hold up? | Five-layer architecture | Real system, not slideware |
| 4 | "This is not a proposal — it is running." | Is it feasible? What breaks? | Metric chips + live portal + risk/mitigation | It exists, and they know its limits |
| 5 | "₹14.60 Lakh Crore of delay returns to the monitoring view." | Who benefits, by how much? | Four dated satellite epochs | Verifiable physical corroboration |
| 6 | "Every method is standard, cited, and reproducible." | Can I trust the numbers? | Sources, methods, statutes, validation, repro command | Nothing here is invented |

---

## H. Evidence map — every number on the deck

**Measured / computed from the sealed corpus (reproducible):**

| Figure | Source |
|:---|:---|
| 2,207 projects; Merkle root `e659bf58…` | `artifacts/corpus_snapshot.json` |
| ₹47.44 Lakh Cr | `coalesce(RevisedCost, OriginalCost)` over the corpus |
| 629 projects invisible; ₹14.60 L Cr; 50.5%; 620 vs 1,249; base 2,043 | Computed from `OriginalEndDate` / `RevisedDate` / `PhysicalProgress` at 2026-06-30 |
| ₹5.66 L Cr escalation on 1,183 revised projects (+23.0%) | Same corpus |
| WDFC: ₹51,101 → ₹1,24,005 Cr (+142.7%), 96% progress, 45-month date move, 7.3% | `GET /api/amey/forecast/705237` |
| 79.0% fan coverage at nominal 85% (50.8% uncalibrated), 596 held-out, measured on `forecast_project()` | `artifacts/conformal_calibration.json` |
| 160 events / 1,988 censored; 7.4% event rate | `artifacts/aft_survival.json`, `CLAIMS.md` |
| 12.2% MAE lift vs sector-mean; ablation 16.24 → 17.90 | `CLAIMS.md` §4 |
| 476/476 assertions, 19 suites | `tests/verify_features.py`, `tests/run_all_tests.py` — re-run and green |
| 87 endpoints | `/openapi.json` |
| 26 dated epochs, 5 sites, 196 releases probed | `SHOWCASE_EPOCHS.json` |
| GSD 2.08–2.35 m/px; r = +0.004 | `satellite_precision_engine.py`, `eo_independence.py` |

**Sourced (external, cited on slide 6):** MoSPI/PAIMANA, ESRI Wayback, IMD, ECI, DPIIT/RBI,
NSE/BSE, RTI Act 2005, RFCTLARR 2013, CPWD GCC 10CC.

**Estimated / projected:** *none.* No adoption, user-count, savings or ROI projection appears
anywhere in the deck.

**Corrections made during the build** (each would have been a rejection risk):
- "27 epochs" → **26** (recounted from the artifact)
- "Pillow-CV" → OpenCV · Pillow · scikit-image (real dependencies)
- WDFC "45 months gone" → "the official completion date has moved 45 months" (45 is
  original→revised slippage; elapsed overrun is 51 months)
- "Laumann (2003)" → Kalbfleisch & Prentice (2002)
- "Laurie & Melançon / Tarjan (1972)" → Tarjan (1972)

---

## I. Judge simulation

**Judge A — Technical (architecture, ML, scalability).**
Positives: the seam is a real architectural decision; censoring handled correctly rather
than dropping unfinished projects; conformal calibration with a measured coverage number;
LP-vs-MILP named honestly. Likely challenge: *"R² is negative — is the model useful?"*
Answer is on the deck's evidence base — MAE beats the sector-mean baseline an officer would
actually use by 12.2%, under acknowledged temporal shift. **Score 88.**

**Judge B — Domain (MoSPI relevance, practicality).**
Positives: the rebaselining finding is immediately recognisable to anyone who has read an
IPMD flash report; the 10% NER floor as a hard constraint shows statutory literacy; the
RTI §4(1)(b) portal is a real obligation, not a feature. Likely challenge: *"Would MoSPI
adopt an external baseline definition?"* — fair, and the honest answer is that it augments
rather than replaces the official view. **Score 90.**

**Judge C — Skeptical (looking for overclaim).**
This is where the deck is strongest. Slide 2 contains a box titled *"What we refuse to
claim"*. Slide 6 prints a reproduction command and a corpus hash. There is no adoption
projection, no fabricated case study, no accuracy percentage without a baseline. Residual
targets: the Theme field is unverified, and the demo UI shows hardcoded stats that disagree
with the deck (see below). **Score 85.**

---

## J. Score — **89 / 100**

| Criterion | Score | Note |
|:---|:---:|:---|
| Problem understanding | 9.5/10 | Quantified from source data, not cited from a news article |
| PS alignment | 9/10 | Explicit PAIMANA-layer framing |
| Solution strength | 9/10 | Five engines, coherent, each doing real work |
| Innovation | 9/10 | Rebaselining metric is genuinely novel; refusal ledger unusual |
| Technical depth | 9.5/10 | Censored MLE, conformal, Max-Plus, LP duals, Merkle |
| AI/ML credibility | 9/10 | Honest; negative R² disclosed rather than buried |
| Data credibility | 9.5/10 | Every figure reproducible from a hashed corpus |
| Feasibility | 9/10 | Running, tested, CI-enforced |
| Scalability | 7.5/10 | Postgres write path live, but read path is a single in-memory frame |
| Impact | 8.5/10 | Concrete and bounded; no inflated ROI |
| Differentiation | 9/10 | Memorable single finding |
| Validation | 9/10 | Coverage, baselines, ablation all published |
| Storytelling | 9/10 | One thread from insight to proof |
| Visual communication | 8.5/10 | Diagram-led; slides 2 and 4 are dense by necessity |
| Judge confidence | 9/10 | Refusals and a repro command directly buy trust |

**Why not higher.** Three things cap it. (1) The read path is still one in-memory pandas
frame — correct at 2,207 rows, but a production MoSPI ingest would need more, and that is
stated rather than hidden. (2) Slides 2 and 4 carry more text than an ideal SIH slide;
the 6-slide ceiling forces it. (3) The strongest asset — a live demo — cannot be shown in
a PDF.

**Why not lower.** The central claim is a computed, reproducible finding about the official
corpus, not a rhetorical one, and the deck's most unusual feature is a list of things it
declines to claim.

---

## Before you upload

1. **Fill three placeholders on slide 1** — Team ID, Team Name, and confirm **Theme**
   ("Smart Automation" is inferred, not verified against the portal listing). The team-name
   oval on slides 2–6 reads `[TEAM NAME]`.
2. **Hardcoded UI stats contradict the deck.** `frontend/amey/index.jsx:168-171` hardcodes
   `1,981` / `₹42.78L Cr` / `22` / `17`, and `PublicDashboardView.jsx:131` hardcodes
   `1,981 ACTIVE PROJECTS`. The live corpus gives 2,043 ongoing and ₹45.64 L Cr; `/api/health`
   reports 2,209 / ₹47.6 L Cr. Three different numbers are reachable in one demo. Left
   unchanged per the instruction not to modify source for presentation purposes — but this
   is the single highest-value fix before any live demo.
3. **`README.md` still says ₹31.4 Lakh Cr**, which matches no computation. The deck uses
   ₹47.44 L Cr with a stated definition.
4. **Rotate the Groq key** in `.env` — still live, and `/api/health` currently reports
   `offline_air_gapped_mode: false`. For a sovereignty pitch, clear it before demoing.
5. **`CLAIMS.md` §5 says "there is no database"** — outdated since the Supabase integration.
