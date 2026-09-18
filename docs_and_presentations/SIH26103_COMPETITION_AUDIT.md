# PRAKALP-DRISHTI vs PS SIH26103 — Competition Audit

*16 September 2026. Written against the repository as committed at `a70f815`, the artifacts in `artifacts/`, the official PS text read from sih.gov.in on 13 September, and the presentation research in `SIH2026_PRESENTATION_RESEARCH.md`. Six lenses at once: SIH judge, domain expert, software architect, government/industry evaluator, research reviewer, hostile competitor. No slides designed. Nothing rewritten.*

**Labels.** **[F]** fact I verified in the repo, an artifact, or an official page · **[C]** calculation from those facts · **[A]** assumption · **[P]** projection · **[I]** my inference / judgement.

---

## 0. The one-paragraph version

We have built a statistically serious, unusually honest analytics platform on a public snapshot of PAIMANA — and we have built about three times more of it than the problem statement asks for, pointed at the wrong reader (Cabinet Secretariat / PMO instead of IPMD's monitoring officers), with a demo host that was unreachable when I checked today, and with public documents that contradict each other on basic counts. The core is strong: right-censored survival forecasting with calibrated windows, a chronological leakage-stripped cost model benchmarked against conventional statistics, and *measured* answers to the PS's own three technical dimensions — including negative results nobody else will have the nerve to report. The perimeter is weak: an inferred dependency graph presented as a "verified" network, a budget optimiser for a user IPMD is not, a satellite stack whose own artifact says it cannot measure progress, an early-warning system that has never been tested for whether it warns early, and no monthly panel data. The winning move is subtraction and re-aiming, not more engines.

---

## 1. Audit the problem

### How clearly do we understand the actual problem?

**[F] What the PS actually asks.** IPMD/MoSPI wants to move PAIMANA "from descriptive monitoring towards predictive and prescriptive monitoring": identify projects likely to hit cost escalation, schedule delay and implementation risk *before* they materialise, for "policymakers, project administrators and monitoring agencies". It names three technical dimensions — (a) statistical and predictive models, evaluated; (b) whether AI/ML beats conventional statistics on accuracy, early warning and decision support; (c) models on the existing CUF fields *and* an assessment of how much predictive performance is attributable to CUF fields vs variables not currently captured — and nine indicative outcomes (a–i). It wants open-source tooling. The dataset pointer is the April 2026 Project Monitoring Report.

**[F] What our own problem document says.** `problem-statement.md` frames the problem as five systemic failures (optimism bias/rebaselining, dependency blindspots and "rupee contagion", sub-optimal capital allocation, verification gaps, executive usability), with a "Required Paradigm Shift" matrix whose rows are our five engines.

**[I] Diagnosis.** We understand the *data* problem very well — better than any submission I would expect on this PS. We understand the *institutional* problem partly. Two of our five "bottlenecks" are not IPMD's bottlenecks: fund allocation belongs to the Ministry of Finance and line ministries, not to a monitoring division; satellite corroboration of contractor claims is a PMG/line-ministry field-verification function, not a PAIMANA analytics function. Our problem document reads as a justification of what we built rather than a description of what IPMD needs. That is exactly the failure mode the research flagged: a problem framing that would survive swapping the ministry name.

### Is our framing strong enough?

**[I] No, as written.** Three defects:

1. **Wrong reader.** README and docs address "Cabinet Secretariat, PMO, NITI Aayog". The PS is owned by DIID on behalf of IPMD. The person shortlisting us is a Deputy Director-General of statistics or an IPMD monitoring officer whose product is the monthly Project Monitoring Report. Our framing tells them we built something for their bosses' bosses.
2. **Numbers that do not match the owner's numbers.** README: 2,207 projects, ₹47.44 lakh crore. PS: 1,981 ongoing projects, ₹37.13 lakh crore original, ₹42.78 revised, ₹20.36 spent (April 2026). Our corpus sums to ₹41.78 lakh crore original **[C]** and includes 164 projects at ≥100% physical progress **[C]**. None of this is wrong; all of it is unreconciled, and a statistician reads unreconciled totals as carelessness.
3. **Unsourced urgency claims in our own problem doc**: "over 44% of mega-projects face severe delays", "cumulative cost overruns exceed ₹4.8 lakh crore", "₹23.97 lakh crore entangled in dependency cascades". The first two are computable from our corpus **[C]** and should be shown with the computation; the third is the sum of Shapley values over a graph *we inferred* — it is not a fact about India, it is a property of our model, and stating it as national exposure is the kind of number a hostile team quotes back at us.

### Root problem or symptom?

**[I]** The root problem IPMD describes is *monthly descriptive reporting that cannot prioritise*. We solve the prioritisation half (risk scores, queue, forecasts) and skip the *monthly* half: every engine is cross-sectional on one snapshot. The PS says data "is updated on a monthly basis". "Early warning" in a monitoring division means "this project's trajectory changed since last month". We have four monthly PDF-derived snapshots of ~57 flagship projects each **[F]** and no engine consumes them **[F]**. We rank; we do not yet *warn*.

### Is the problem important enough? Can we communicate urgency?

**[F]** ₹42.78 lakh crore revised cost on 1,981 projects; ₹5.65 lakh crore of revision over original (**[C]** from PS figures) is the owner's own number. That is important by any standard, and urgency writes itself *if* we use the owner's figures and show our corpus reproduces them. We currently do not.

### What evidence supports the problem?

**[F] Ours:** the corpus itself (2,207 rows, 25 public fields); rebaselining counts; cost-revision distribution; the McCrary bunching test (28 vs 17 revisions either side of 20%, p = 0.68 — *no* significant discontinuity, reported as such).
**[F] External, un-cited by us and should be:** MoSPI's own Flash Reports and Project Monitoring Reports (monthly since the OCMS era); Ram Singh (EPW, 2010) on delays and cost overruns in Indian infrastructure using MoSPI's database; Morris (EPW, 1990) on Indian public-sector overruns; Flyvbjerg, Holm & Buhl (2002) on systematic cost underestimation; Flyvbjerg (2006) on reference-class forecasting — the "conventional statistical method" a MoSPI statistician will have in mind when reading dimension (b).

---

## 2. Audit the solution

### Genuinely strong

1. **Right-censored survival forecasting.** [F] Log-logistic AFT, penalised MLE, 2,103 observations, 115 events, 1,988 censored; conformal band on the engine's own median; measured 79.0% coverage at nominal 85%; P50 MAE 22.7 months vs 100 months uncalibrated. [I] Almost every competing team will regress on completed projects only or on `DELAYED_TIME` of live ones; both are wrong on a portfolio where 94% of projects have not finished. Handling censoring correctly is the single most defensible technical choice in the repo, and a statistics ministry will recognise it.
2. **Chronological, leakage-stripped cost model with named baselines.** [F] 12 leaky columns removed; train ≤2020, test 2020–21; MAE 16.24% vs sector-mean 18.49% vs OLS 16.67%; negative R² reported and explained. [I] This is what dimension (a) means by "development *and evaluation*".
3. **Measured answers to dimensions (b) and (c).** [F] `overrun_models.json` contains `ml_vs_conventional` (cost: ML beats OLS by 2.57% MAE; slip: OLS beats ML by 33%) and `cuf_vs_external_ablation` (external variables *hurt* on both targets: −3.78% and −145%). [F] `eo_progress_independence.json`: satellite change vs reported progress r = +0.004, n = 1,588. [I] Nobody else on this PS will have negative results with confidence intervals. This is our research contribution.
4. **A claims discipline.** [F] `CLAIMS.md` sorts every capability into fitted / heuristic / refused, withdraws two earlier overclaims (93.3% coverage; p < 0.001), and every number is regenerable from a script with a fixed seed. [I] For a first-time SIH ministry that lives on statistical integrity, this is a cultural match no polish can fake.
5. **Provenance and offline posture.** [F] RFC 6962 Merkle root over canonicalised rows; deterministic copilot mode with no external call when `GROQ_API_KEY` is unset; Docker image; Postgres path. [I] Deployability vocabulary a government evaluator understands.
6. **Breadth of a working prototype.** [F] ~93 API endpoints, ~20 screens, 140 automated checks passing (per `CLAIMS.md`). Nothing here is a mock-up.

### Genuinely innovative (in the SIH sense: not "uses X", but "does something others do not")

- The **censoring + conformal + attribution** chain applied to PAIMANA data, with baselines the PS names.
- **Refusal as a feature**: measuring what imagery *cannot* do and building a presence/absence audit instead of a fake completion percentage.
- **Content-addressed corpus identity** so a signed briefing is re-verifiable after the data moves to Postgres.

### Merely baseline (every serious team will have it)

Risk score 0–100 with bands; ranked queue; dashboard with filters and maps; sector/state benchmarking; an LLM chat box over the tables; SHAP-style driver bars; bilingual toggle. **[I]** None of these should carry a slide by themselves.

### Potentially over-engineered

| Component | Why it is over-scope for IPMD | Cost of carrying it |
|---|---|---|
| **VITTA-VYUHA** mean–CVaR LP allocator with NER floor and shadow prices | IPMD does not allocate capital. The "prescriptive" the PS asks for is "which projects to intervene on", not "how to split ₹12,000 Cr". | A judge asks "who at MoSPI would run this?" and there is no answer. |
| **PRATIBIMB-EO + Prithvi** (450 MB weights, 1.24 GB tiles, RRN/PIF, stage classifier at 38.3% agreement with a *rule*) | Our own artifact says imagery explains none of the variance in progress. The PS is about PAIMANA data. | ~40% of repo weight for a module whose measured contribution to the PS's core question is nil; a hostile team quotes r = +0.004 back at us. |
| **NAGRIK public portal, grievance desk, RTI §4(1)(b)** | Not in outcomes a–i; not IPMD's mandate. | Dilutes the story. |
| **Merkle inclusion proofs, JCS canonicalisation, tamper guard** | Valuable for outcome (i) and for trust; but three slides' worth of cryptography for a monitoring division reads as showing off. | Keep one line. |
| **Election-timing scoring (KARYA-DAKSHATA)** | Politically loaded for a government evaluator; low predictive value (external ablation hurt). | One sentence or drop. |

### Technically weak

1. **The risk index is unvalidated.** [F] Weights are declared policy (0.30/0.25/0.20/0.15/0.10), bands are declared, and there is no test that "CRITICAL" projects subsequently overran or slipped more than "LOW" ones. The docstring says so. [I] For outcomes (c) and (d), this is the load-bearing artefact and it has no evidence behind it beyond its components.
2. **20% of the risk score is a signal we proved uncorrelated with progress.** [F] `ground_truth_risk` weight 0.20, justified in code as "the only component not derived from self-reported data" — while `eo_progress_independence.json` reports r = +0.004. [I] A statistician will see the contradiction in one reading.
3. **The dependency graph is inferred, not observed.** [F] 1,345 edges = 275 same-state supply-chain heuristics + 1,070 pairs within 50 km. [I] Two highway packages 40 km apart are not dependent; a coal block and a thermal plant in the same state may or may not be. `CLAIMS.md` calls these "two verified physical linkages" — they are not verified; they are hypothesised. Everything downstream (Shapley, "₹23.97 lakh crore contagion", contagion component of the risk index — itself per-node, not DAG-based, as disclosed) inherits that. Precise mathematics on an invented structure.
4. **The cost model's tested regime is not the live portfolio's regime.** [F] Maturity gate 5 years; train sanctions 1983–2020; test 2020–21; n_usable 1,057 of 2,207. [C] 1,208 projects (55%) were sanctioned 2021–2024 and 1,181 (53.5%) are Roads & Highways. [I] The model's reported error applies to projects old enough to have matured; its predictions for the majority of PAIMANA's live portfolio are extrapolation. Nowhere do we say so.
5. **AFT sector effects are prior-dominated.** [F] Only Roads has enough completions (101) for its own multiplier; 18 sectors share the 3.31× national prior; survivorship bias makes 3.31× an upper bound. [I] A railway officer will be told their project's schedule multiplier is borrowed from the national average. True, honestly labelled, and weak.
6. **Slip-months ML is not deployable and the slide-era wording still implies it is.** [F] `deployable: False`; OLS MAE 7.9 vs GB 10.5; calendar identity explains most of the fit. Time-overrun prediction therefore rests entirely on AFT.

### Unclear

- What exactly a monitoring officer *does* with a P10–P95 window, a Shapley share and a CVaR dial on Monday morning. We have no workflow narrative.
- Which of the nine outcomes (a–i) each engine satisfies. The mapping exists in code docstrings, not in any document a judge reads.
- What "CUF fields" we actually used. [F] We have 25 public columns; the real CUF has milestone, monthly progress and expenditure fields we never saw. Our dimension-(c) answer is on the *public subset* and does not say so.

### Difficult to believe (as currently phrased)

- "Zero-hallucination pipeline" — a guard is not a proof. Say "fact-bound; every sentence cites a signed fact".
- "100% air-gapped sovereign" alongside a Groq (US-hosted) default model.
- "<2.5 ms in-memory latency" (README badge) vs "<10 ms" (CLAIMS) — neither re-measured in this audit.
- "476/476 tests" (README badge) vs "140 passed, 1 skipped" (CLAIMS). [F] Both are in the repo today.
- "1,197 multi-modal dependency links" (README) vs "1,345 verified edges" (CLAIMS) vs "Tarjan condensation" (README) vs total-order orientation (code). [F] All four are in the repo today.
- `"sensor": "ESRI ArcGIS World Imagery + Wayback Living Atlas (Sub-meter)"` is still written by four scripts in `satellite_pipeline/` [F] while `CLAIMS.md` refusal #1 says sub-metre claims are refused. One `grep` by a hostile team ends our honesty story.

### What a competitor can attack (ranked by damage)

1. "Their own artifact says ML beats conventional statistics by 2.6% on cost and *loses* on time. Their AI is a wash."
2. "Their satellite module explains 0.0016% of the variance in progress (r = 0.004) and they still weight it 20% of the risk score."
3. "Their early-warning system has never been backtested. Show me one project it warned about before it slipped."
4. "Their dependency network is 50-km proximity. Shapley on that is numerology."
5. "Their demo link is asleep." [F] `https://prakalp-api.onrender.com/api/health` returned nothing within 25 s at 16:xx IST today.
6. "Their README, CLAIMS and code disagree on edge counts, test counts and resolution."
7. "They built a budget optimiser for a division that does not have a budget to optimise."

---

## 3. Audit the innovation — "this already exists"

### Existing government systems (must be named, or a ministry evaluator names them for us)

- **OCMS (2006) → PAIMANA** — the owner's own repository, monthly CUF uploads, role-based access, dashboards and the monthly Project Monitoring Report. [F] from the PS.
- **PRAGATI** (PMO, 2015) — multi-modal review platform for stalled projects; it is where "Cabinet-level" review already happens.
- **Project Monitoring Group portal** (DPIIT) — bottleneck resolution for stalled projects above ₹500 Cr.
- **PM Gati Shakti National Master Plan** (BISAG-N) — geospatial layer of infrastructure assets and corridors; the *real* dependency/proximity data our SETU-GRAPH approximates.
- **MoSPI Flash Reports** — the descriptive statistics (overrun %, delay bands) that our sector-mean baseline reproduces.

### Existing commercial and open-source alternatives

- **nPlan** (UK) — ML schedule-risk forecasting trained on hundreds of thousands of schedules; the closest commercial analogue to KAAL-CHAKRA, but it needs activity-level schedules PAIMANA does not hold.
- **Oracle Primavera Risk Analysis / Safran Risk / Deltek Acumen** — Monte Carlo schedule and cost risk on a single project's network; not portfolio-level, not trained on history.
- **Reference-class forecasting** (Flyvbjerg, adopted in the UK Green Book) — the conventional statistical benchmark for overruns; our "sector mean" is a crude RCF and should be named as one.
- **Open source we could have used instead of writing our own:** `lifelines` / `scikit-survival` (AFT with censoring), `MAPIE` (conformal), `NetworkX` (used), `HiGHS` via `scipy` (used), `shap`. [I] Hand-rolling the AFT and conformal code is defensible only if we say why (exact control of the penalty, reproducibility); otherwise it looks like not knowing the ecosystem.

### Existing research

- Cost-overrun prediction with tree ensembles on project attributes: common in construction-management journals; typically on completed projects, rarely chronological, rarely with censoring.
- Survival analysis of project duration: exists (Cox/AFT applications to construction completion), rarely on government portfolios.
- Conformal prediction: standard methodology (Vovk et al.; Romano et al. CQR); essentially unused in infrastructure monitoring.
- Bunching/McCrary tests at policy thresholds: standard in public economics; applying it to the CCEA 20% cap is, to my knowledge, new for Indian infrastructure — and our result is null.

### True differentiation (what survives "this already exists")

1. **The evaluation, not the models.** Chronological validation with leakage columns named, conventional baselines named, censoring handled, calibration measured, and *negative* findings (ML ≈ OLS on cost; external variables do not help; imagery cannot measure progress; no bunching at 20%) reported with their n and p. On a PS whose dimension (b) literally asks "does AI beat conventional statistics?", the honest measured answer *is* the deliverable.
2. **Calibrated windows under censoring** on the live portfolio — a P10–P95 completion band with a stated, measured coverage.
3. **Answer to dimension (c) in the owner's vocabulary**: "on the public CUF subset, X% of achievable accuracy comes from six fields; the ten external variables we tested added nothing; here is what *would* need to be captured in CUF to improve it (milestone dates, monthly expenditure, land/clearance status)". We have the first two thirds and not the last third.
4. **Provenance discipline** — signed facts, content-addressed corpus, regenerable artifacts.

Everything else (dashboard, chat, maps, LP, satellite swipe, Merkle proofs) is either baseline or off-PS.

---

## 4. Audit the technical architecture

| Layer | What it is [F] | Why required / why chosen | Simpler alternative | If it fails | Performance measured? |
|---|---|---|---|---|---|
| **Inputs / data** | 2,207 × 25 public PAIMANA fields (API + page scrape), PARIVESH clearances, IMD/WPI/election externals, 4 monthly PDF snapshots (~57 projects), ESRI Wayback tiles for geocoded sites | Only public data was reachable; PS points to the April PMR | Use the PMR tables the PS points to, and ask MoSPI for OCMS history | No monthly panel → no trajectory-based warning | Corpus root hash; no completeness audit vs PS's 1,981 |
| **Storage** | CSV bootstrap → in-memory pandas; optional Postgres (Supabase) with append-only triggers | Sub-10 ms reads; simple | Postgres only, materialised views | Dual path caused the pandas-3 band mismatch already once | Latency claimed, not benchmarked in CI |
| **Forecasting** | Custom log-logistic AFT (scipy), split-conformal on own median | Censoring; exact quantile guarantee | `lifelines` + `MAPIE` | Prior-dominated sectors degrade to national multiplier | Coverage 79.0% @ 85%; MAE 22.7 mo |
| **Cost model** | GradientBoostingRegressor, chronological split, 5-yr maturity gate | Non-linear sector × size effects | OLS (MAE 16.67 vs 16.24) — nearly as good | Extrapolates on 2021+ sanctions | MAE vs 3 baselines; negative R² |
| **Risk index** | Weighted composite of 5 components, declared weights | Composability; transparency | Two-component (schedule + cost) score | No fallback if EO component missing beyond renormalisation | **Not validated against outcomes** |
| **Graph / contagion** | NetworkX DAG from inferred edges; permutation Shapley M = 300 | Systemic-risk ranking | Gati Shakti corridor data, or drop | Inferred edges wrong → every downstream number wrong | Shapley convergence vs exact on toy DAGs only |
| **Allocation** | scipy HiGHS LP, R-U CVaR, NER floor | Prescriptive optimisation | Not needed for IPMD | Infeasible pool → no answer | Complementary slackness 5.7e-14 |
| **EO** | Prithvi-EO-1.0-100M (Apache-2.0) + logistic head; RRN/PIF; presence/absence verdicts | Independent evidence | Drop, or keep presence/absence only | 450 MB weights + torch in a CPU container; tiles licence | Head CV 38.3% vs rule labels; r = 0.004 vs progress |
| **LLM** | Groq API, `openai/gpt-oss-120b`, fact-bound prompt, deterministic offline mode | Outcome (h) | Local `llama.cpp`/Ollama with the same open-weight model | API down → deterministic mode (good) | No eval set for answer faithfulness |
| **API / backend** | FastAPI, ~93 endpoints, RBAC (viewer/analyst/admin), PBKDF2 local users, rate limiter, CSP | Standard | Fewer endpoints | Single process; no queue | No load test |
| **Frontend** | React + Vite + Tailwind, Leaflet, ~20 views, 29 MB dist | Standard | Fewer views | Heavy first load on ministry networks | Not measured |
| **Deployment** | Docker; Render free (sleeps); Vercel proxy; air-gap mode | Free tier | Any always-on VM; NIC/MeghRaj for real deployment | **Asleep today** | Health check exists |
| **Security / privacy** | RBAC server-side; seeded weak demo passwords (declared); no MFA/SSO; coordinates redacted on public portal | Prototype | Parichay/NIC SSO for production | Credential leak of demo accounts is harmless | No pen test; CSP present |
| **Reliability** | 140 checks; deterministic seeds; host-independent ordering proven | Reproducibility | — | Silent drift caught once already (pandas 3) | Byte-identical artifacts across hosts |
| **Scalability** | In-memory 2,207 rows; Shapley O(M·N·reach) | Fine at 2k; PAIMANA is ~2k | — | 20k projects would need incremental Shapley | Not tested beyond corpus |

**[I] Architectural verdict.** Sound core, too many peripheral organs, and two design choices that a statistician will challenge on sight: weighting a proven-uncorrelated signal at 20%, and computing systemic risk on inferred edges. One design choice a government architect will challenge: a hosted US LLM API as the default with "sovereign" in the tagline.

---

## 5. Audit feasibility

**Can it be built?** [F] It is built. Working prototype requirement is met with margin.

**Can it be deployed?** [I] Yes for a pilot, with conditions:
- **Infrastructure:** one Linux VM (4 vCPU / 8 GB is enough without EO; EO needs the 450 MB weights and torch), Postgres, no GPU. [A] Air-gapped install possible because everything except Groq is local.
- **Data required:** the CUF exports (or read access to PAIMANA APIs) with monthly history; OCMS archive 2006–; clearance/land status if CUF holds it. [F] We have none of these beyond the public subset.
- **Dependencies:** pinned numerics stack (pandas 2.3.3 etc.) [F]; Prithvi weights from Hugging Face [F]; ESRI Wayback tiles — **licence for government production use unverified** [A]; Groq — replaceable.
- **Biggest implementation risks:** (1) no monthly panel → cannot demonstrate temporal early warning; (2) CUF field coverage unknown → dimension (c) answer is partial; (3) model regime mismatch on 2021+ sanctions; (4) inferred graph rejected by domain reviewers; (5) demo host sleeping during evaluation; (6) document contradictions discovered by a reviewer.
- **What a government deployment would require:** hosting on NIC/MeghRaj; SSO (Parichay); data-residency for any LLM call (local model or NIC-hosted); GIGW/accessibility; a named owner in IPMD; a change-control note for the declared weights; an audit of the imagery licence; Hindi UI review by an official translator.

**[I] Feasibility score:** high for the core (forecasting, cost model, risk queue, dashboard, offline copilot); medium for EO; low-value for the LP allocator in IPMD's hands.

---

## 6. Audit impact — what can be demonstrated, and what cannot

| Dimension | What we can say today | Label |
|---|---|---|
| **Accuracy** | Cost MAE 16.24% vs sector-mean 18.49% (−12.2%) vs OLS 16.67% (−2.6%) on 265 held-out projects; P50 completion MAE 22.7 vs 100 months uncalibrated; 79.0% coverage at nominal 85% on 596 projects | **[F]** |
| **Coverage** | 2,207 projects, 22 sectors, 17+ ministries in corpus; 1,615 geocoded (73%); 1,588 with EO independence measurement | **[F]** |
| **Time** | No measurement. An officer's review time before/after has never been observed. "Ranked queue of 25 instead of 1,981 rows" is a workflow claim, not a saving | **[A]** |
| **Cost** | No pilot, no cost of ownership computed. [C] Compute: the stack runs on one VM; open-source licences; the only paid dependency is optional (Groq) | **[C]/[A]** |
| **Efficiency / resource** | <10 ms in-memory reads (claimed); Shapley precompute minutes | **[F]** claimed, not re-measured |
| **Users** | Zero real users. Five demo accounts | **[F]** |
| **Scalability** | Designed for ~2k projects; untested beyond | **[F]** |
| **Social / economic** | Any "₹X lakh crore protected" figure would be a projection built on the unvalidated risk index. We cannot honestly quantify it | **[P]** — do not use |
| **Environmental** | None | — |

**[I] Impact gap in one sentence:** we can prove *model quality*; we cannot prove *decision impact*, because the risk index has no outcome test and nobody has used the system. The only honest impact story is "here is how much better than the ministry's current statistics our forecasts are, and here is exactly what we could not improve" — which is, conveniently, what dimension (b) asks for.

---

## 7. The fifteen outputs

### 1. Strengths
- Censoring-aware forecasting with measured calibration.
- Chronological, leakage-stripped, baseline-benchmarked cost model.
- Measured answers to PS dimensions (a), (b), (c) including negative results.
- Claims ledger; withdrawn overclaims on record; regenerable artifacts; byte-identical across hosts.
- Working prototype: ~93 endpoints, ~20 screens, Docker, offline mode, Postgres path.
- Provenance (Merkle root, signed facts) as a one-line deployability credential.

### 2. Weaknesses
- Framed for PMO/Cabinet, not IPMD.
- Cross-sectional only; no monthly trajectory; "early warning" is a ranking.
- Risk index unvalidated; EO component weighted despite r ≈ 0.
- Dependency graph inferred and labelled "verified".
- Eleven engines, five of them off-PS.
- README / CLAIMS / code contradictions (edges, tests, resolution, latency).
- Demo host asleep.
- Corpus totals unreconciled with the PS's figures; CUF coverage unstated.

### 3. Technical risks
- Regime mismatch: model tested on ≤2021 sanctions, portfolio is 55% 2021–24.
- Prior-dominated sectors (18 of 19) in the AFT.
- pandas/numpy drift (mitigated by pins; still a runtime risk on a judge's laptop).
- Torch + 450 MB weights in a CPU container; EO endpoints slow or OOM on a small VM.
- Single-process FastAPI; no queue for Shapley recompute on ingest.

### 4. Innovation risks
- "AI beats conventional by 2.6%" read as failure instead of finding.
- Survival + conformal read as "just statistics" by a non-technical evaluator unless explained in one picture.
- Reviewer says "nPlan / Primavera does this" — answerable only if we name them first.
- Feature count makes the novelty invisible.

### 5. Feasibility risks
- No access to real CUF / monthly data; dimension (c) answer partial.
- Imagery licence for government use unverified.
- Hosted LLM default vs "sovereign" claim.
- No named IPMD workflow or owner.
- Hindi output never reviewed by an official translator.

### 6. Impact gaps
- No user, no pilot, no time-saved measurement, no cost of ownership, no outcome backtest for the queue. Every impact number beyond model error would be a projection.

### 7. Evidence gaps
- Backtest of the risk index against subsequent overrun/slip (even cross-sectional: does band predict `COST_OVERRUN_PERC` on projects whose components were computed without it?).
- Reconciliation table: our 2,207 vs PS 1,981; ₹41.78/47.44 vs ₹37.13/42.78/20.36.
- Which CUF fields we had vs the full CUF.
- Answer-faithfulness evaluation for the copilot.
- Re-measured latency and a load number.
- A working, reachable demo URL with a timestamp.

### 8. Competitor attacks (and the honest reply we must have ready)
| Attack | Reply we can defend |
|---|---|
| "Your ML barely beats OLS." | "Correct, and we are the only team who measured it. On CUF fields alone, conventional statistics is near the ceiling; that is dimension (b)'s answer. The gain is in calibration and censoring, not in the regressor." |
| "Imagery is uncorrelated with progress and you still use it." | Drop it from the risk index or set its weight to 0 with the artifact cited; keep presence/absence as a separate inspector tool. |
| "Never backtested the early warning." | Run the cross-sectional backtest now; state its limits; state what monthly data would let us do. |
| "50-km proximity is not dependency." | Relabel as *hypothesised* graph; show the sensitivity of the ranking to removing geo edges; name Gati Shakti as the real source. |
| "Demo is asleep." | Fix hosting before submission. |
| "Docs contradict." | One reconciliation pass; delete or banner every superseded document. |
| "Who at MoSPI runs an LP allocator?" | Move VITTA-VYUHA to "future scope for Ministry of Finance / line ministries" or cut. |

### 9. Judge objections (screening round, in the order they will arise)
1. "Which of my nine outcomes does this deliver, and where is the evidence for each?"
2. "You say 2,207 projects; my report says 1,981. Which data did you use?"
3. "Did AI beat conventional methods? Give me the number."
4. "How much of the accuracy comes from CUF fields?"
5. "This is a monthly system. Where is month-over-month?"
6. "Who is the user of the capital allocator?"
7. "What does the satellite add if it cannot measure progress?"
8. "Open the prototype." (It must open.)
9. "Why should IPMD trust a risk score whose weights you chose?"

### 10. What we should remove (from the pitch; archive in the repo)
- VITTA-VYUHA as a headline (keep as future scope, one line).
- Satellite *progress* narrative and the Prithvi stage classifier; keep only the presence/absence inspector, and only if it has a slide-worth of evidence. Set `ground_truth_risk` weight to 0 or make it opt-in with the artifact cited.
- NAGRIK portal, grievance desk, RTI framing.
- Election-timing score.
- "Zero-hallucination", "sovereign", "Cabinet Secretariat", "sub-meter", "Tarjan", "476 tests", "₹23.97 lakh crore contagion".
- Every superseded document that still carries a number CLAIMS.md contradicts.

### 11. What we should strengthen
- **Re-aim at IPMD's monthly workflow**: the deliverable is a *monthly early-warning annex to the Project Monitoring Report* — ranked queue, forecasts, drivers, generated from the CUF upload.
- **Dimension (b) and (c) as the headline finding**, with one chart: MAE of naive → sector-mean/RCF → OLS → GB, CUF-only vs CUF+external, cost and time side by side.
- **Backtest the risk index** now (cross-sectional), and design the temporal test we would run with OCMS history.
- **Regime honesty**: state the maturity gate and what the model does for 2021+ sanctions (prior/sector-mean fallback).
- **Reconciliation table** with the PS's own figures.
- **Deployment story in government terms**: NIC/MeghRaj VM, Parichay SSO, local open-weight LLM, CUF ingest API, named owner (IPMD monitoring officer), pilot = one ministry, one quarter.
- **A wake-proof demo**: always-on host or a warm-up cron, plus dated screenshots.
- **One consistent set of numbers** across README, CLAIMS, code, deck.

### 12. What we must prove (before the deck is written)
1. Prototype opens from a cold link in under 5 s.
2. The risk band predicts something: cross-sectional backtest with n and effect size, or an honest "not testable on a snapshot; here is the design".
3. Our corpus reproduces the PS's April 2026 totals to within a stated tolerance, or we explain the difference.
4. Exactly which CUF fields we used and which we did not have.
5. The ML-vs-conventional and CUF-vs-external numbers for both targets, in one table, with n.
6. The engine-to-outcome (a–i) map with an evidence pointer per cell.
7. That the copilot never states a number that is not in a signed fact (an evaluation set, even 50 questions).

### 13. What could prevent selection
- A generic-looking slide 2 that could be any ministry's.
- Eleven engine names (Sanskrit or otherwise) on one slide.
- A dead demo link.
- Totals that do not match the PS.
- A reviewer who reads README and CLAIMS and finds them disagreeing.
- An evaluator who knows Gati Shakti asking why we invented a dependency graph.
- Not answering dimensions (a)–(c) explicitly when the PS author wrote them.

### 14. Our strongest differentiators (in order)
1. Measured, chronological, censoring-aware evaluation with named conventional baselines and negative results.
2. Calibrated completion windows on a portfolio where 94% of projects are still running.
3. The claims ledger and regenerable artifacts — statistical integrity as a product feature.
4. A working, offline-capable, provenance-signed prototype with a CUF ingest path.

### 15. Our biggest strategic advantage
**We can answer the PS author's three questions with numbers, and most of those numbers are inconvenient.** On a problem statement written by a statistics ministry, the team that says "AI added 2.6% on cost, lost on time, external variables did not help, imagery cannot see progress, and here is why and what data would change that" is more credible than five teams claiming 94% accuracy. The advantage is real only if we present it as *the answer to their question*, not as a confession.

---

## 8. Judge model applied to the current state (pre-deck)

Weights from `SIH2026_PRESENTATION_RESEARCH.md` §6a; scores are **[I]**.

| Dimension | Weight | Now | Why |
|---|---|---|---|
| PS alignment & understanding | 20 | 13 | Covers a–i; measures a–c; but aimed at PMO, cross-sectional, totals unreconciled |
| Novelty vs PAIMANA and vs field | 20 | 14 | Censoring + calibration + attribution is distinctive; buried under baseline features |
| Technical credibility | 20 | 15 | Strong artifacts and tests; contradictions across docs; demo asleep |
| Feasibility, risks, deployment path | 15 | 9 | Open-source, Docker, offline; no CUF access, licence unverified, hosted LLM default |
| Impact & business potential | 15 | 5 | Model-quality evidence only; no user, pilot, or outcome test |
| Clarity / format | 10 | — | No deck yet |
| **Total (of 80 scoreable)** | | **56 / 80 = 70%** | Shortlist-plausible on a five-entry field; not safe on a fifty-entry field |

[I] Fixing items 12.1–12.6 moves alignment to ~17, credibility to ~18, feasibility to ~12, impact to ~8: roughly 69 / 80 before the deck is designed.

---

## 9. Verdict

### "If I were judging 500 SIH teams on PS 26103, why would I select this team?"

Because this is the only submission that treats my problem statement as a *research question* and answers it with numbers on my data. Dimension (b) asked whether AI beats conventional statistics; they fitted OLS, sector means and gradient boosting on a chronological split with twelve leakage columns removed and told me the gain on cost overrun is 2.6% MAE and that OLS wins on time overrun — then showed that what actually improves decisions is calibration: a right-censored survival model on 1,988 still-running projects with a P10–P95 window whose coverage they measured at 79% and whose earlier 93% claim they withdrew in writing. Dimension (c) asked how much performance comes from CUF fields; they ran the ablation, found the ten external variables hurt, and said so. They tested the 20% CCEA bunching hypothesis and reported p = 0.68 instead of an accusation. Every number regenerates from a script; the corpus has a content-addressed hash; the prototype runs offline with role-based access and ingests a CUF upload. It is a working monthly early-warning annex for my Project Monitoring Report that a statistician can audit line by line. Nobody else in the pile will show me a negative result, and the ones who show me 94% accuracy have leaked `RevisedCost` into their features.

### "Why might I reject this team?"

Because they answered a question I did not ask. Their slides address the Cabinet Secretariat and the PMO; I am IPMD. They lead with a budget optimiser my division does not operate, a satellite pipeline whose own artifact says it explains none of the variance in progress yet still carries 20% of their risk score, and a "national dependency network" that turns out to be 50-km proximity with Shapley values on top — while PM Gati Shakti already holds the real corridors. Their early-warning queue has never been checked against a single subsequent overrun. Their corpus says 2,207 projects and ₹47.44 lakh crore; my April report says 1,981 and ₹42.78; they never reconcile the two, and they never say which CUF fields they actually had. Their README claims 476 tests and 1,197 links, their ledger says 140 and 1,345, and four of their scripts still write "sub-meter" into the output after their ledger refuses the word. Their demo link did not open. Eleven engines, five of them off-scope, on six slides: I cannot find the one thing they do that PAIMANA does not — even though, buried on page three of their ledger, it is there.
