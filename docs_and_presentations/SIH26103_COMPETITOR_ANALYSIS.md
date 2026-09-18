# Why us, instead of what already exists? — Competitor and Alternative Analysis for PS SIH26103

*16 September 2026. Third document in the sequence (research → audit → this). Purpose: a defensible competitive position, not a slide deck.*

**Labels.** **[F]** verified today from a primary page, repository README or our own artifacts · **[K]** established literature/industry knowledge I did not re-verify this session · **[I]** inference or judgement. Competitor claims are quoted from their READMEs as of today and are *their* claims, not verified results.

---

## 0. Findings in five lines

1. **[F] The PS owner already has the descriptive layer and has announced the predictive one.** NIC's own write-up of PAIMANA ends with: "the PAIMANA Portal will integrate advanced analytics, AI-driven forecasting… machine learning to predict time and cost overruns, resource needs, and potential risks." PS 26103 *is* that roadmap item, put out to students. We are not competing with PAIMANA; we are auditioning to be its forecasting module.
2. **[F] At least nine public repositories target SIH26103 today.** Two are serious (PRISM: 35 commits, 125 tests, 7,499 project-month rows; InfraSight AI: 373 commits, 4,692 project-month rows from Flash Reports back to 2001–02). Both have **monthly panel data**, which we do not. Several make accuracy claims we can dismantle in one sentence (94.2% on 20 test projects; "34.2% lift from external variables" with no validation described).
3. **[F] Nobody in the field handles censoring correctly, calibrates a prediction interval, or answers PS dimension (b) and (c) with a chronological ablation on both targets.** One competitor fitted a Cox model (C-index 0.586, no interval); one compared OLS with boosting on a project-grouped split. That is the whole field's methodological ceiling.
4. **[K] Outside SIH, the closest real systems either need data PAIMANA does not hold** (nPlan: activity-level schedules; NHAI Data Lake: contract documents and drone video) **or are expert-judgement, not models** (UK GMPP Delivery Confidence RAG ratings).
5. **[I] Our defensible position is narrow and strong:** *the only entry that treats "does AI beat conventional statistics on CUF fields?" as a question to be measured, and whose forecasts are calibrated on the 94% of the portfolio that has not finished.* Everything else we built is either table stakes or off-PS, and must be presented as such.

---

## 1. Existing solution landscape

### 1a. Government systems (India) — what the owner and its neighbours already run

| System | Owner | What it does today [F unless marked] | Relevance to PS 26103 |
|---|---|---|---|
| **PAIMANA** (ipm.mospi.gov.in; launched 25 Sep 2025) | MoSPI / IPMD, built by NIC | Single-window CUF upload; role-based dashboards with drill-down by sector/state/timeline; SSRS-generated 80-page monthly report; "trend analysis, forecasting, and bottleneck identification"; RESTful APIs; integrated with DPIIT's IPMP so ~64% of projects (MoRTH, PNG, Coal) update automatically. Stack: Bootstrap front end, **MS SQL**, **SSRS** BI, NIC Cloud. Monthly Flash Report and Quarterly Report archive by financial year. | **The incumbent.** Descriptive and drill-down. "Forecasting" here is BI trend extrapolation, not a fitted model. Way Forward explicitly promises ML prediction of time and cost overruns — the PS is that promise. |
| **OCMS** (2006–2025) | MoSPI | Predecessor repository; ~two decades of project-level history now "integrated as legacy data" into PAIMANA. | The historical training set the PS refers to; not publicly downloadable as a panel. |
| **IPMP / PMG portal** | DPIIT | Milestone-based monitoring and issue resolution for projects ≥ ₹500 Cr; 5-tier escalation ending at PRAGATI. | Owns *issue resolution*; PAIMANA owns *status*. Our "intervention" outputs must point here, not replace it. |
| **PRAGATI** (2015) | PMO / Cabinet Secretariat | Video-conference review of stalled projects chaired by the PM. | The escalation endpoint; not a data system we can improve. |
| **NHAI Data Lake + Project Management Software** (2020–) | NHAI / MoRTH | AI/big-data platform: "forecasts delays and likely disputes and sends out advance alerts"; mandatory **monthly drone video** uploads compared month-on-month; claimed ₹25,680 Cr saved via 155 disputes resolved. | The most advanced Indian government analogue — but sector-specific, contract-document-driven, and NHAI-internal. MoSPI cannot see inside it. |
| **PM Gati Shakti NMP** (BISAG-N) | DPIIT / NPG | Geospatial master plan of infrastructure assets and corridors across ministries. | Holds the *real* inter-project dependencies our SETU-GRAPH approximates with 50-km proximity. |
| **MoSPI Flash Reports** (monthly since the OCMS era; archive on the report page) | MoSPI | Sector-wise counts of delayed projects, cost-overrun totals (e.g., 1,392 projects with ₹5.42 lakh crore overrun as of Dec 2025, per press coverage). | The descriptive statistics every officer already knows; our sector-mean baseline reproduces them. Also the **source of a monthly panel** that two competitors have already harvested. |

### 1b. Direct competitors on SIH26103 (public repositories, read today) [F]

| Team / repo | Data | Method | Claimed results | Panel data? | Maturity | Weak point |
|---|---|---|---|---|---|---|
| **PRISM** (abhinavg138) | 2,054 projects; **7,499 monthly snapshots Apr–Jul 2026** | Deterministic 6-indicator MCDA risk; OLS vs GB vs GB+engineered; What-If lab; S-curves | OLS MAE 16.82 mo; GB 16.52; engineered 15.46; R² 0.279; "over 70% of delay variance unexplained" | **Yes** | 35 commits; **125 tests**; Vercel serverless; Gemini copilot | Split is `GroupShuffleSplit` by project, not chronological; risk engine is unvalidated weights (like ours); LLM is Google Gemini (not open-source); SQLite |
| **InfraSight AI** (divyam9308/SIH-26) | **4,692 project-month rows, 1,844 projects, Flash Reports 2001-02→2024-25** + "synthetic completion trajectories" | RF / XGBoost / CatBoost auto-select; SHAP; "Historical Time Machine"; scenario explorer | "2.332 pp MAE… 0.8234 R²… 94.2%"; delay "20.957 days MAE… 93.63%" | **Yes** | **373 commits**; pytest + browser smoke tests | Backtest on **25 train / 20 test completed projects**; synthetic trajectories; "accuracy" on a regression; no censoring |
| **PAIMANA-AI-ML** (pakicitus) | Real, undisclosed size; data excluded from repo | XGBoost classifiers + **Cox PH** survival; SHAP; chronological split | Schedule ROC-AUC 0.895, F1 0.72; cost ROC-AUC 0.79, F1 0.46; Cox C-index 0.586 | Unknown | 3 commits; notebooks; no UI | No calibration/intervals; no dashboard; classification of a threshold, not forecast |
| **InfraSight-AI** (hari-reddy1) | "1,981 ongoing… ₹42.78 lakh crore"; monthly CUF | OLS, ARIMA, XGBoost (CUF-only) vs LightGBM (CUF+external); RAG | "9.2% RMSE… F1 0.90"; **"34.2% accuracy lift" from external variables; lead time "1.8 → 5.4 months"** | Claimed | 7 commits; no tests, no demo | No validation described; claims exceed what any of the serious repos found |
| **ANUMAAN** (preeti-kaur245; repo now private) | Monthly PDF reports (MoSPI, MoRTH, Railways, Metro) | Rules RULE-SCH-01…FIN-03 + multi-month persistence; "6-hop evidentiary lineage" to PDF page and bounding box | "100% evidentiary auditability" | Yes (persistence logic) | Unknown | Provenance is their differentiator — same territory as our Merkle facts |
| **NeevAI** (Kanchan-Prajapat) | PAIMANA reports; size undisclosed | Models "being considered" (LR…LightGBM); 40/30/20/10 risk score | None | Snapshots kept | 8 commits | Nothing fitted yet |
| **PAIMANA-AI** (David-718) | Demo CSV, one row per project | Roadmap only | None; "prototype analytical indicator" | No | 6 commits | Nothing fitted yet |
| **ProjectPulse** (daksh1136), **paimana-sih-prototype** (roshann635), **vishesh-i-tech/SIH26103** | — | SHAP health scoring / milestone tracking / prototype | — | — | — | Not examined in depth |

[I] The portal showed 5/500 submissions on 13 Sep because uploads follow college internals (9–11 Sep); nine public repos means the real field is larger. Plan for a 15–40 entry field, judged by DIID statisticians.

### 1c. Commercial platforms [K]

| Product | Approach | Why it does not solve PS 26103 |
|---|---|---|
| **nPlan** (UK) | Deep learning / GNN on 750,000+ historical schedules ($2 tn spend) to forecast activity durations; used by Network Rail, Shell, Skanska | Needs Primavera/MSP activity-level schedules; PAIMANA holds project-level CUF rows. Proprietary. |
| **Oracle Primavera Risk Analysis, Safran Risk, Deltek Acumen** | Monte Carlo on one project's CPM network with expert-elicited distributions | Single-project, elicitation-driven, licence-bound; not portfolio learning from history. |
| **InEight, Procore, Autodesk Construction Cloud** | Contractor-side project controls | Contractor tools; the ministry sees only the CUF. |
| **Doxel, Buildots, OpenSpace** | On-site cameras/LiDAR vs BIM for progress | Needs site instrumentation and BIM; not a monitoring-division tool. |
| **SatSure, Pixxel, Orbital Insight-type EO analytics** | Satellite change detection | Commercial imagery cost; and our own measurement says optical change explains none of reported progress variance on this portfolio. |

### 1d. International public-sector approaches [K]

- **UK IPA/NISTA Government Major Projects Portfolio** — annual Delivery Confidence Assessment RAG ratings per project; expert judgement supported by data, published annually. *Judgement, not a fitted model.*
- **UK Green Book optimism-bias uplifts / reference-class forecasting** (Flyvbjerg 2006; Flyvbjerg, Holm & Buhl 2002) — apply empirical percentile uplifts from a class of similar past projects. *This is the "conventional statistical method" a MoSPI statistician expects us to beat; our sector-mean baseline is a crude RCF.*
- **Norway's Concept programme (QA1/QA2)** — external quality assurance of cost estimates at gates. *Gate-based appraisal, not monitoring.*
- **World Bank / MIT GovLab** — ML on 20,000+ project documents to predict outcome ratings at inception and completion; IEG notes "only a few factors… were statistically associated with project performance." *Same lesson as ours: the honest ceiling is low.*

### 1e. Academic work on the same data [K]

- **Ram Singh (EPW, 2010)** — 894 MoSPI central-sector projects, quarterly reports 1992–2009: overruns declined since the 1980s; delay and cost overrun strongly related; U-shaped relation with implementation length; contractual/institutional causes. *The canonical paper on the PS's own dataset; not cited anywhere in our repo.*
- **Morris (EPW, 1990)** — earlier public-sector overrun analysis in India.
- **Flyvbjerg et al.** — systematic underestimation; RCF as remedy.
- Construction-management ML literature — cost-overrun regression on completed projects (ANN/SVM/RF), almost never chronological, essentially never censored.
- Survival-model applications to project duration exist in the operations literature; conformal prediction is standard methodology (Vovk; Romano et al.) with no visible application to infrastructure monitoring.

### 1f. Open-source building blocks [K]

`lifelines` / `scikit-survival` (AFT, Cox with censoring) · `MAPIE` (conformal intervals) · `XGBoost`/`LightGBM`/`CatBoost` + `shap` · `statsmodels` (OLS, ARIMA) · `NetworkX` · `HiGHS` via `scipy` · `Ollama`/`llama.cpp` for local open-weight LLMs · `Apache Superset`/`Metabase` for dashboards. [I] Every competitor and we ourselves are assembled from this shelf; the shelf is not a differentiator, the *evaluation* is.

---

## 2. Existing limitations (what the current approaches cannot do)

| Approach | Limitation that matters to IPMD |
|---|---|
| **PAIMANA today** | Descriptive: reports what *has* slipped. No fitted forecast, no probability, no interval, no ranked queue with stated logic; "forecasting" is BI trend lines. Numbers are self-reported by agencies with no independent check. |
| **Flash-report statistics / sector means (RCF)** | Portfolio averages, not project-level; cannot say *which* project. Ignore that 94% of projects are still running (survivor and censoring effects). |
| **Typical SIH regression (RF/XGB on completed projects)** | Trains on the ~6% that finished; leaks `RevisedCost`/`RevisedDate` when careless; random splits inflate scores; reports "accuracy" for a regression; no interval; no test of whether ML beat OLS. |
| **Classifier-of-a-threshold (ROC-AUC style)** | Answers "will overrun exceed X?" — useful, but not a forecast with a date or a magnitude; no calibration of probabilities shown. |
| **Weighted risk scores (ours, PRISM, NeevAI, InfraSight)** | Weights are policy, not fitted; none of us has validated the score against subsequent outcomes. |
| **Expert RAG ratings (UK GMPP)** | Consistent judgement, but not reproducible and not scalable to monthly re-scoring of 2,000 projects. |
| **nPlan-class schedule ML** | Needs activity schedules the CUF does not carry. |
| **Site sensing (drones, cameras, satellites)** | Sector-specific mandates (NHAI), agency-owned, and — on this portfolio — measured to be uninformative about reported progress at 2 m/px. |
| **LLM chat over tables (Gemini/GPT/Groq)** | Answers can be ungrounded; proprietary APIs conflict with the PS's open-source preference and with data residency; most entries have no faithfulness evaluation (neither do we). |

---

## 3. Our differentiation — what genuinely distinguishes us

Only items that (a) exist in the repo with an artifact, and (b) no competitor read today has.

1. **Censoring handled correctly on the live portfolio.** [F] Log-logistic AFT by penalised MLE with 1,988 right-censored of 2,103; sector/entity shrinkage; survivorship caveat stated. Only one competitor touched survival (Cox, C-index 0.586, no interval).
2. **Calibrated forecast windows with measured coverage.** [F] Split-conformal P10–P95 on the engine's own median: 79.0% measured at nominal 85% (50.8% uncalibrated); P50 MAE 22.7 months. No competitor reports interval coverage at all.
3. **Chronological, leakage-named, three-baseline evaluation on both PS targets, with the ML-vs-conventional and CUF-vs-external ablations the PS asks for.** [F] Cost: GB 16.24 vs OLS 16.67 vs sector-mean 18.49 vs naive 22.41 (MAE %); time: OLS beats GB; externals hurt both; calendar-identity diagnosis for slip. PRISM has a two-way comparison on one target with a grouped split; nobody else has the ablation.
4. **Negative results reported with n and p.** [F] r = +0.004 imagery-vs-progress (n = 1,588); McCrary p = 0.68 at the 20% CCEA threshold; slip-months model marked *not deployable*. [I] On a PS written by a statistics division, this is credibility no polished dashboard can buy.
5. **Regenerable, content-addressed evidence.** [F] Every number regenerates from seeded scripts; byte-identical across hosts; RFC 6962 corpus root; withdrawn overclaims recorded in `CLAIMS.md`. ANUMAAN claims lineage to PDF bounding boxes; ours is to a signed fact and a corpus hash — comparable, and we have the code public.
6. **Offline-capable, role-based, CUF-ingest-ready prototype.** [F] Docker; deterministic copilot mode with no external call; Postgres path; admin ingest view. Most competitors run on localhost or a serverless free tier with a proprietary LLM.

What is *not* differentiation (and must not be pitched as such): dashboard, maps, risk bands, SHAP-style drivers, benchmarking, chat, bilingual UI, Merkle proofs as cryptography theatre, the CVaR allocator, the inferred dependency graph, the satellite swipe.

---

## 4. Innovation test

Classification scale: **Truly novel** · **Novel combination** · **Meaningful engineering improvement** · **Normal industry feature** · **Weak / non-innovative claim**.

| # | Claimed innovation | Verdict | Reasoning |
|---|---|---|---|
| 1 | Right-censored AFT forecasting on PAIMANA | **Novel combination** | Method is 30 years old (Wei 1992); application to a government monitoring portfolio with 94% censoring is new for this PS and absent from every competitor except one Cox attempt. |
| 2 | Split-conformal P10–P95 with measured coverage | **Novel combination** | Conformal is standard; nobody in this field calibrates intervals. The *measurement* (79.0% vs 85%) is the innovation, not the wrapper. |
| 3 | Chronological, leakage-stripped, three-baseline evaluation | **Meaningful engineering improvement** | Best practice, rarely done; one competitor is chronological, one grouped, the rest random or unstated. Not novel; decisive. |
| 4 | Measured ML-vs-conventional and CUF-vs-external ablations | **Truly novel (as a finding)** | The PS asked the question; we are the only entry with a measured, reproducible answer on both targets — and the answer is inconvenient (ML ≈ OLS; externals hurt). A finding, not a feature. |
| 5 | Claims ledger: fitted / heuristic / refused, with withdrawals | **Meaningful improvement (practice, not tech)** | Two competitors gesture at "no overclaiming"; ours is a document with numbers and retractions. Differentiating culturally; weak if pitched as technology. |
| 6 | Content-addressed corpus root + Merkle-signed facts | **Meaningful engineering improvement** | Solves a real re-verification problem after moving to Postgres; ANUMAAN's lineage is comparable. One line, not a slide. |
| 7 | Composite 0–100 risk index with bands | **Normal industry feature** | Everyone has it; none of us validated it. |
| 8 | Early-warning queue (score × log-capex) | **Normal industry feature** — and weaker than PRISM's, which has multi-month persistence | Ours is cross-sectional. |
| 9 | SETU-GRAPH Shapley contagion | **Weak / non-innovative claim** in current form | Novel combination *if* edges were observed; on 50-km proximity it is precise arithmetic on an assumption. Becomes credible only with Gati Shakti or PMG linkage data. |
| 10 | VITTA-VYUHA mean–CVaR LP allocator | **Truly novel in this field — for the wrong user** | Correct mathematics, no IPMD workflow. Future scope. |
| 11 | Satellite presence/absence audit + Prithvi head | **Weak claim for this PS; useful as a negative finding** | 38.3% agreement with a rule, r ≈ 0 with progress. Its honest value is the dimension-(c) sentence "we tested imagery as an additional variable; it did not help." |
| 12 | McCrary bunching test at the CCEA 20% cap | **Novel combination, minor** | Public-economics method applied to a new threshold; null result; a footnote that shows statistical literacy. |
| 13 | Fact-bound copilot with offline deterministic mode | **Meaningful engineering improvement** | "Grounded" copilots are now table stakes (PRISM, InfraSight); the offline mode and citation to signed facts are the improvement; no faithfulness eval yet. |
| 14 | Bilingual (Hindi) briefings | **Normal industry feature** | Expected in a GoI tool. |
| 15 | Progress-weighted blend, foreclosure cap, monsoon window | **Normal / heuristic** | Declared rules; fine; not innovation. |

[I] Net: two novel combinations (1, 2), one novel finding (4), three meaningful improvements (3, 5, 6, 13), and everything else is baseline or a liability. The pitch has to be built on 1–4 with 5–6 as credibility, and must *not* lead with 9–11.

---

## 5. Competitive attack simulation

Each row: what a stronger rival on that axis says to the judge; what we say back (only claims we can back today); what we must do before the deck so the reply is true.

| Rival advantage | Their argument | Our reply | Precondition |
|---|---|---|---|
| **Better UI** (polished React, animations, mobile) | "Officers will actually use ours." | "PAIMANA's UI is NIC's job; ours is an analytics annex that emits a ranked queue and a P10–P95 window into their report. The number on the screen matters more than the screen." | Our screens must be clean, fast and few (≤6 in the demo); kill visual clutter; demo must load from a cold link. |
| **More data** (PRISM 7,499 monthly rows; InfraSight 4,692 rows to 2001) | "We have month-over-month; you have one snapshot. You cannot do early warning." | "Correct today, and our engines are built for ingest. The Flash Report archive is monthly; we will show trajectory features on the archive by the finale. Meanwhile, our cross-sectional models are validated chronologically — theirs are grouped or on 20 test projects." | **Harvest the monthly Flash Report archive** (the report page exposes month × FY selectors) and add month-over-month features; or, at minimum, demonstrate ingest with the four snapshots we hold. This is the single most important gap. |
| **Better AI** (claims: F1 0.90; R² 0.82; "94.2%"; "34.2% lift from externals") | "Our model is far more accurate." | "On what split, on how many projects, with which columns removed? Ours: chronological, 265 held-out, 12 leaky columns named, MAE against three baselines. On this data the honest ceiling is low — PRISM found R² 0.28; we found ML beats OLS by 2.6%. A 94% figure on 20 projects with synthetic trajectories is not a result." | Keep our baselines table one glance deep; carry the competitor numbers with their n in a backup slide. |
| **More advanced architecture** (serverless, microservices, 6-hop lineage, Kafka…) | "Enterprise-grade." | "PAIMANA runs on MS SQL + SSRS on NIC Cloud. What fits beside it is one container, one Postgres, an open-weight LLM on-prem, and a CUF ingest API. That is what we ship." | State deployment in NIC terms; remove Groq as default, name Ollama/local; verify imagery licence or drop the tiles. |
| **More polished prototype** (373 commits, smoke tests, time machine) | "Ours is finished." | "Ours regenerates every number from a script and is byte-identical across hosts; 140 checks; withdrawn claims are on record. Polish is what you see; reproducibility is what a statistician checks." | Reconcile README/CLAIMS/code (edges, tests, 'sub-meter'); demo host awake; screenshots dated. |
| **Similar idea** (all nine: risk score + queue + SHAP + chat) | "Same thing." | "Same shelf, different question. We asked whether the ministry *should* use ML at all, and measured it. Our answer — calibration and censoring help; a fancier regressor does not; extra variables do not — is the one MoSPI can act on." | Make dimension (b)/(c) the headline finding; one chart. |
| **Better domain story** (NHAI Data Lake, PMG linkage, sector expertise) | "We understand the ministry." | "We cite Ram Singh (2010) on this very database, reproduce the Flash Report statistics as our baseline, point interventions to PMG's 5-tier escalation, and address IPMD's monthly report — not the PMO." | Rewrite the framing for IPMD; cite the literature; map to PMG. |

**Attacks we cannot answer today and should pre-empt by conceding:** (1) no monthly panel yet; (2) risk index not outcome-validated; (3) dependency edges inferred; (4) the model's tested regime is ≤2021 sanctions. Saying these before being asked is worth more than any reply after.

---

## 6. "Why us?" — the strongest truthful statement

> The Ministry asked three questions: can overruns be predicted from PAIMANA data, does AI beat conventional statistics, and how much of the signal is already in the CUF. We are the only team that answered all three with measurements instead of assertions. On a chronological split with the leaky columns removed, gradient boosting beats the ministry's own sector averages by 12% and ordinary least squares by 2.6% on cost overrun — and loses to OLS on time overrun; ten external variables we tested made both worse; satellite change explains none of the variance in reported progress. What *does* change decisions is treating the 94% of projects that have not finished as censored rather than ignored, and calibrating the forecast: our P10–P95 completion window covers 79% of held-out outcomes where the raw model covered 51%, and its median error fell from 100 months to 23. Every figure regenerates from a seeded script, every briefing sentence cites a hashed fact, an earlier 93% claim was withdrawn in writing, and the prototype runs offline on one container with role-based access and a CUF ingest path. Choose us because the numbers we show you are the ones you would get if you ran it yourselves.

(147 words; every number has an artifact behind it as of today.)

---

## 7. Differentiation visual — "The Censored-Portfolio Ladder"

**Why not a generic five-column template.** Our differentiation is not a feature; it is a *chain of measurements* that starts from one fact about the ministry's data (94% of projects have not finished) and ends at a number the officer can check. The visual should make the reader walk that chain, and every rung should carry a measured value — because that is precisely what no competitor can put on their version of the picture.

**Framework (left → right, one row, five rungs; a second, thinner row underneath shows the competitor archetype at each rung):**

| Rung | Label on the slide | Content (ours) | Shadow row: "typical entry" |
|---|---|---|---|
| 1 · Existing approach | **PAIMANA today** | Monthly CUF → SSRS dashboards and an 80-page report; sector averages (Flash Report); expert review at PMG/PRAGATI. | Same starting point. |
| 2 · Limitation | **What it cannot tell an officer** | *Which* project, *when*, with what confidence — on a portfolio where **1,988 of 2,103** projects are still running. | Regress on the ~6% completed; random split; "94% accuracy". |
| 3 · Insight | **Two facts change the method** | (i) Unfinished projects are *censored data*, not missing data. (ii) "Does AI help?" is a measurement, not a premise. | Assumes ML helps; never measures the baseline. |
| 4 · Solution | **KAAL-CHAKRA + benchmarked cost model** | Right-censored AFT → conformal P10–P95; chronological GB vs OLS vs sector-mean; CUF-vs-external ablation. | XGBoost + SHAP + chat. |
| 5 · Measurable advantage | **Numbers a statistician can rerun** | Coverage **50.8% → 79.0%**; P50 error **100 → 22.7 months**; cost MAE **18.49 → 16.24%** vs sector mean; ML vs OLS **+2.6% / −33%** (cost / time); externals **−3.8%**. | No coverage reported; no baseline; no ablation. |

**Drawing rules for the final deck (not designed here):** one accent colour on rung 5 only; the shadow row in grey at 60% opacity; arrows labelled with the *reason* for the step ("because 94% are censored", "because the PS asks (b)"); no engine logos; no more than one number per cell except rung 5.

**Companion visual (backup slide, from the research's winner pattern):** an honesty matrix — rows: chronological split · censoring · interval coverage reported · ML-vs-conventional measured · CUF-vs-external measured · negative results reported · offline/open-source LLM · reproducible artifacts; columns: PAIMANA today · typical SIH entry · PRAKALP-DRISHTI. Ticks and crosses only where we can cite the competitor's README; otherwise "not reported".

<!--DIFF_VISUAL-->

---

## 8. What this phase commits us to (before any slide is drawn)

1. Harvest the monthly Flash Report archive and add month-over-month features, or demonstrate ingest on the four held snapshots — the "more data" attack is the only one we cannot currently answer.
2. Reframe every document for IPMD's monthly report; retire PMO/Cabinet language.
3. Reconcile README / CLAIMS / code / scripts (edge count, test count, "sub-meter", "Tarjan", latency).
4. Replace Groq as the default with a local open-weight model; state NIC Cloud deployment; verify or drop the imagery tiles.
5. Set `ground_truth_risk` weight to 0 (or opt-in) with the independence artifact cited; relabel the dependency graph as hypothesised.
6. Cross-sectional backtest of the risk band against realised overrun/slip, with limits stated.
7. Add Ram Singh (2010), Flyvbjerg (2006), NIC's PAIMANA write-up and the PIB 25 Mar 2026 release to our references; cite them, not react.dev.

---

### Sources read today

- NIC Informatics, "PAIMANA Portal — Infrastructure Project Monitoring Platform" (Oct 2025): `https://informatics.nic.in/files/websites/october-2025/paimana-portal.php`
- PIB, "PAIMANA portal and management of major infrastructure projects", 25 Mar 2026, Release ID 2244898
- PAIMANA report page (Monthly Flash Report / Quarterly Report selectors): `https://paimana-proj.mospi.gov.in/ReportPage`
- Competitor repositories: `github.com/abhinavg138/PRISM` · `github.com/divyam9308/SIH-26` · `github.com/pakicitus/PAIMANA-AI-ML` · `github.com/hari-reddy1/InfraSight-AI` · `github.com/Kanchan-Prajapat/NeevAI` · `github.com/David-718/PAIMANA-AI` · `github.com/daksh1136/SIH-26103` · `github.com/roshann635/paimana-sih-prototype` · ANUMAAN (`github.com/preeti-kaur245/SIH26103`, 404 today; description via search index)
- nPlan: `nplan.io/our-ai`, AACE RISK 4435 (2024) · UK IPA/NISTA GMPP annual reports (gov.uk) · Institute for Government explainer on major projects
- NHAI Data Lake coverage (Inc42, Zee News, Urban Transport News) and NHAI monthly drone-video circular coverage (Construction World)
- Ram Singh, "Delays and Cost Overruns in Infrastructure Projects: Extent, Causes and Remedies", EPW 45(21), 2010 · MIT GovLab / World Bank IEG on ML over 20,000+ projects
- Our artifacts: `artifacts/overrun_models.json`, `artifacts/conformal_calibration.json`, `artifacts/aft_survival.json`, `artifacts/eo_progress_independence.json`, `analytics_engine/models/stage_head.json`, `CLAIMS.md`
