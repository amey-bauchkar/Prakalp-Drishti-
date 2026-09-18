# Six-Slide Blueprint — PS SIH26103 (strategic architecture, not final copy)

*16 September 2026. Fifth document in the sequence. Built on the narrative spine (`SIH26103_NARRATIVE.md`), the judge model (research §6a), the audit and the competitor position. This is the architecture of each slide — purpose, eye-path, evidence, text that belongs, text that must not — so the visual design and final copy in the next phase have nothing left to decide except execution.*

---

## 0. Compliance — verified today from sih.gov.in (not assumed)

| Requirement | Source (authoritative, read 16 Sep 2026) | What it means for us |
|---|---|---|
| **Template:** `SIH2026-IDEA-Presentation-Format.pptx`, linked from sih.gov.in home as "Idea PPT" (`/letters/2026/…`). SHA-256 of the official file matches the copy analysed on 13 Sep (`ce3e5dee…`). | sih.gov.in | The 2026 template is the one we have; nothing changed. |
| **Slide size** 16:9 (12192000 × 6858000 EMU = 13.33 × 7.5 in). | template `presentation.xml` | Design at 13.33 × 7.5 in. |
| **Six slides maximum including the title slide.** The seventh "Important Pointers" slide must be deleted. | template slide 7, verbatim: "Kindly keep the maximum slides limit up to six (6). (Including the title slide)" | Exactly 6 pages in the PDF. |
| **Fixed pointers.** "You can only use provided template for making the PPT without changing the idea details pointers." | template slide 7 | The five section titles and their pointer headings stay verbatim; layout inside them is ours. |
| **Pointers, verbatim:** S2 *Proposed Solution (Describe your Idea/Solution/Prototype)*: Detailed explanation of the proposed solution · How it addresses the problem · Innovation and uniqueness of the solution. S3 *Technologies to be used (e.g. programming languages, frameworks, hardware)* · *Methodology and process for implementation (Flow Charts/Images/ working prototype)*. S4 *Analysis of the feasibility of the idea* · *Potential challenges and risks* · *Strategies for overcoming these challenges*. S5 *Potential impact on the target audience* · *Benefits of the solution (social, economic, environmental, etc.)*. S6 *Details / Links of the reference and research work*. | template slides 2–6 | Every pointer gets real content ("All the topics should be utilized for description of your idea" — 2026 FAQ via DTU notice). |
| **Style rule:** "Try to avoid paragraphs and post your idea in points /diagrams / Infographics /pictures"; "Keep your explanation precise and easy to understand"; "Idea should be unique and novel." | template slide 7 | Points, diagrams, pictures; no paragraphs anywhere. |
| **Format:** "save the file in PDF and upload… No PPT, Word Doc or any other format will be supported." | template slide 7 | PDF only; check fonts embed and links survive export. |
| **Portal fields entered separately:** 8) Idea title, 9) Idea description, 10) Idea presentation (PDF). | SIH 2026 Guidelines PDF (`/letters/2026/SIH 2026 Guidelines.pdf`), p. 10 | Idea title and description are written in the next phase alongside the copy; they are read *before* the PDF opens. |
| **Evaluation criteria:** "novelty of the idea, complexity, clarity and details in the prescribed format, feasibility, practicability, sustainability, scale of impact, user experience and potential for future work progression." | SIH 2026 Guidelines PDF, p. 12 | Each slide below is tagged with the criteria it serves. |
| **Selection:** "4-5 teams per problem statement may be selected… final decision rests with the problem statement creating organization, which isn't obligated to declare a winner unless student proposals meet their expectations." | SIH 2026 Guidelines PDF, p. 11 | The reader is DIID/IPMD. Their expectations are the PS's dimensions (a)(b)(c) and outcomes (a–i). |
| **Cap and deadline:** 500 ideas per PS; max 2 PS per team; last date 30 Sept 2026; finale offline, December 2026. | SIH 2026 Guidelines PDF, pp. 10, 13 | Submit before the freeze. |
| **Prototype:** "Working Prototype (not necessarily complete) is mandatory for Software Edition"; "If it has a business potential more weightage will be given"; "abstract of your idea will be asked separately." | SIH 2026 FAQ as reproduced in DTU SPOC notice dated 28.08.2026 (institution-level reproduction of the official FAQ; not in the institute guidelines PDF) | Prototype link on slides 2 and 3; a business/sustainability line on slide 4. |

**Design constraints derived from the template file itself:** title bar at the top of each slide with the section name; the pointer headings are text boxes we keep as sub-headings; team name and slide number in the footer band; white ground. Everything else — columns, figures, tables — is free.

---

## 1. The six slides at a glance

| # | Section (fixed) | Dominant idea | Dominant visual | Beat(s) from the spine | Criteria served |
|---|---|---|---|---|---|
| 1 | Title page | Who we are, exactly as the portal knows us | — (fields only) | — | clarity/format |
| 2 | Idea Title | A calibrated early-warning annex for PAIMANA's monthly report | One real project: promised date → revised date → our P10–P95 window | Problem · Insight · Solution | novelty, clarity, alignment |
| 3 | Technical Approach | Censored → calibrated → benchmarked: the pipeline and its proof | Pipeline diagram with the validation protocol built into it | Proof · Innovation | complexity, prototype |
| 4 | Feasibility & Viability | Fits beside PAIMANA as it is; four limits stated first | Deployment diagram: PAIMANA (MS SQL/SSRS) → CUF → one container → annex | Honesty · Deployment | feasibility, practicability, sustainability |
| 5 | Impact & Benefits | From description to intervention — measured deltas, not projections | Before/after pairs of the three measured numbers | Impact | scale of impact, user experience |
| 6 | Research & References | The record: literature on this database, and how to rerun our numbers | Reference list + "reproduce it" box | — | future work progression, credibility |

---

## 2. Slide-by-slide architecture

### Slide 1 — TITLE PAGE

- **Strategic purpose.** Zero-friction identification; the only slide where the reader is matching fields against the portal. It must not cost a second of attention.
- **Exact judge takeaway.** "SIH26103, MoSPI, Software, Smart Automation — this is the team whose idea title I just read on the portal."
- **Core message.** Identity, compliance, one line that names the product.
- **3 seconds.** PS ID and title match the portal.
- **10 seconds.** The idea has a name and a one-line meaning; the team name matches the registration.
- **Main visual.** None. The template's fields, filled exactly. Optional: one small still of the prototype's queue view (≤ ¼ of the slide) — only if it does not push any field.
- **Supporting visual.** None.
- **Key evidence.** None.
- **Exact text.** `Problem Statement ID – SIH26103` · `Problem Statement Title – Use case on web-based integrated project-monitoring platform` · `Theme – Smart Automation` · `PS Category – Software` · `Team ID – <as registered>` · `Team Name – <exactly as registered on portal>` · one added line under the title block: `PRAKALP-DRISHTI — calibrated early warning for PAIMANA` (the idea title, identical to portal field 8).
- **Must NOT appear.** Institute name inside the team name (guideline); logos of technologies; Sanskrit engine names; taglines with "AI-powered", "sovereign", "revolutionary"; any number.
- **Objection pre-answered.** "Is this the right PS?" — copied character-for-character from sih.gov.in (title, theme, category).
- **Eye-path.** FIRST: PS ID. SECOND: idea title line. UNDERSTAND: this deck is about early warning on PAIMANA.
- **Transition.** The idea title promises "calibrated early warning"; slide 2 shows what that looks like for one real project.

---

### Slide 2 — IDEA TITLE (Proposed Solution)

- **Strategic purpose.** The decisive slide (research: slide 2 gets 2.5 of 9 walkthrough minutes; evaluators form their view here). It must do three things in one glance: name IPMD's problem in IPMD's numbers, show the output an officer would get, and state the one difference from the other 499.
- **Exact judge takeaway.** "They give every unfinished project a calibrated window instead of a promised date, and they measured whether AI helps before claiming it."
- **Core message.** *The unfinished 94% are censored, not missing; treat them properly and PAIMANA's report turns from description into early warning.*
- **3 seconds.** A real project's timeline: a promised date, a later revised date, and a shaded window with a P50 mark — and the headline "1,988 of 2,103 projects unfinished."
- **10 seconds.** Three columns: what we deliver (four outputs), how it maps onto the PS's own dimensions (a)(b)(c) and outcomes, and the three things no other entry does.
- **Main visual (top band, ~40% of the slide).** *The completion fan for one real project* — candidate: Sivok–Rangpo New Rail Line (₹7,877 Cr → ₹11,775 Cr; original end 31 May 2015 → revised 31 Dec 2027; 90% progress) or Tapovan-Vishnugad HEP (₹2,978 → ₹10,907 Cr; Mar 2013 → Apr 2029; 77%). Horizontal time axis; thin tick "promised (2015)", second tick "revised (2027)", our P10–P95 band with P50 marked, pulled from the engine for that project ID in the design phase. Caption under it: "PAIMANA today records the two ticks. The band is what we add."
- **Supporting visual.** A one-line strip of the owner's numbers in mono type: `1,981 ongoing · ₹37.13 → ₹42.78 lakh crore · ₹20.36 spent (Apr 2026) · 1,988 of 2,103 in the public register still running`. Prototype links as three small buttons: **Live** · **Code** · **2-min video**.
- **Key evidence.** PS text (April 2026 figures); `aft_survival.json` (115 events / 1,988 censored); the project's engine output.
- **Exact text that belongs (points, not paragraphs).**
  - *Detailed explanation of the proposed solution* — "A monthly early-warning annex to IPMD's Project Monitoring Report, computed from the CUF fields already collected:" · **Completion window (P10–P95)** for every ongoing project — right-censored survival model, conformal-calibrated · **Cost-overrun forecast** benchmarked against sector averages and OLS on a chronological split · **Ranked intervention queue** with the reasons per project, weights declared and editable by the Ministry · **Bilingual briefing** whose every sentence cites a hashed fact; runs offline, open-source, beside PAIMANA.
  - *How it addresses the problem* — a three-row mapping, PS wording on the left: (a) statistical + predictive models → survival model, OLS, gradient boosting, evaluated chronologically · (b) does AI/ML beat conventional methods? → measured: +2.6% on cost, −33% on time; calibration is where the gain is · (c) CUF fields vs additional variables → measured: ten external variables did not help; CUF-only deployed. Footer line: "Outcomes a, b, c, d, e, g, h, i delivered; f partially (drivers, not causes)."
  - *Innovation and uniqueness* — three points: **Censored, not ignored** — 94% of the portfolio is unfinished; we model it as censored data, others regress on the 6% that finished · **Measured, not assumed** — the only entry with the ML-vs-conventional and CUF-vs-external ablations on both targets, inconvenient results included · **Reproducible** — every figure regenerates from a seeded script; an earlier 93% claim was withdrawn in writing.
- **Must NOT appear.** Engine names (KAAL-CHAKRA etc.) as headings; the eleven-engine list; VITTA-VYUHA, satellite, NAGRIK, election scoring, Merkle jargon; "sovereign", "zero-hallucination", "Cabinet Secretariat", "PMO"; any accuracy percentage without its baseline; more than five numbers in the columns; paragraphs.
- **Objection pre-answered.** "Which of my outcomes does this deliver, and did you answer my three dimensions?" — the mapping column answers with the PS's own letters. "Is there a prototype?" — three links.
- **Eye-path.** FIRST: the fan (a promised date vs a shaded band). SECOND: the headline number strip. UNDERSTAND: this replaces a single promised date with a calibrated window, on the ministry's own data, with the PS's questions answered.
- **Transition.** The band on slide 2 is a claim; slide 3 shows how it is computed and how we know its coverage.

---

### Slide 3 — TECHNICAL APPROACH

- **Strategic purpose.** Technical credibility for a statistician *and* legibility for a non-technical official. One pipeline, real names on every box, the validation protocol drawn into the pipeline rather than listed beside it, and the proof numbers where they are produced.
- **Exact judge takeaway.** "Chronological split, leakage columns removed, censoring handled, interval coverage measured, three baselines — this is how I would have evaluated it."
- **Core message.** *Censored → calibrated → benchmarked, on the CUF fields, with the numbers printed at the point they are measured.*
- **3 seconds.** A left-to-right pipeline with five boxes and two numbers in colour: **79.0%** coverage and **16.24 vs 18.49** MAE.
- **10 seconds.** Where the data comes from (25 public CUF fields, 2,207 rows, 2,103 usable), what is removed (12 leakage columns), how it is split (train ≤ 2020, test 2020–21), the two model branches (time: censored AFT + conformal; cost: GB vs OLS vs sector mean), and what comes out (queue, window, briefing).
- **Main visual (~60% of the slide).** *The pipeline with the protocol inside it:*
  `PAIMANA public register (2,207 rows · 25 CUF fields)` → `Leakage guard: 12 future-dated columns removed (RevisedCost, RevisedDate, COST_OVERRUN…)` → `Chronological split: train sanctions ≤ 2020 (792) · test 2020–21 (265)` → two parallel branches: **Time** `Log-logistic AFT, right-censored (115 events / 1,988 censored) → split-conformal on the engine's median → P10–P95` printing `coverage 50.8% → 79.0% (n = 596)`; **Cost** `Sector mean 18.49 · OLS 16.67 · Gradient boosting 16.24 (MAE %)` printing `ML vs OLS +2.6%`; → `Risk queue (declared weights, reasons per project)` → `Briefing (EN/HI), each sentence cites a hashed fact` → `PAIMANA annex`. Arrows labelled with what moves ("features", "median", "residual quantile", "scores").
- **Supporting visual.** Two real prototype stills, small, dated: the early-warning queue with reasons; one project page with the fan. Caption: "Prototype, 16 Sep 2026 — live link on slide 2."
- **Key evidence.** `overrun_models.json` (baselines, split, leakage list), `conformal_calibration.json` (coverage, MAE), `aft_survival.json` (events/censored), `CLAIMS.md` (withdrawn 93.3%).
- **Exact text that belongs.**
  - *Technologies to be used* — one line, only what matters: `Python · pandas · scipy (penalised MLE, HiGHS) · scikit-learn (gradient boosting, OLS) · FastAPI · PostgreSQL · React · Docker · optional open-weight LLM run locally (no external call required)`. No logos.
  - *Methodology and process* — the pipeline is the methodology; beneath it, three lines: **Validation:** chronological split; 12 leakage columns named; MAE against naive, sector-mean and OLS baselines; conformal coverage measured on 596 held-out projects · **Reproducibility:** fixed seeds; byte-identical artifacts across machines; 140 automated checks · **Honest ceiling:** external variables −3.8% (cost) / worse (time); slip-month ML not deployed — OLS is better; time forecasts rest on the survival model.
- **Must NOT appear.** Logo strip; "AI/ML layer" box; the graph/Shapley pipeline; satellite pipeline; LP solver; Merkle tree diagrams; "<2.5 ms latency"; test counts other than 140; the word "Tarjan"; more than two colours.
- **Objection pre-answered.** "Did you leak `RevisedCost`?" (named in the guard box). "Random split?" (chronological, years shown). "Your ML barely beats OLS" (printed by us, with the sentence that calibration is where the gain is). "Is it built?" (dated stills + link).
- **Eye-path.** FIRST: the two coloured numbers (79.0%; 16.24 vs 18.49). SECOND: the leakage guard and the split years. UNDERSTAND: the numbers were earned the hard way, and the whole thing is running.
- **Transition.** A pipeline that runs on public CUF fields on one laptop raises the next question — what does it take to run it inside the Ministry? Slide 4.

---

### Slide 4 — FEASIBILITY AND VIABILITY

- **Strategic purpose.** Win the practicability/sustainability criteria and *own* the four limits before a reviewer finds them. This is the slide the ministry evaluator (who "checks the practicality") reads most carefully; it must speak NIC's language.
- **Exact judge takeaway.** "It fits beside PAIMANA without touching it, it runs on what we already have, and they told me what it cannot do yet."
- **Core message.** *One container beside PAIMANA; a one-ministry, one-quarter pilot with a named owner; four limits and what closes each.*
- **3 seconds.** A deployment picture: PAIMANA on the left (MS SQL · SSRS · NIC Cloud), one small box on the right ("annex: 1 container + Postgres"), one arrow labelled "CUF export / API, monthly".
- **10 seconds.** The feasibility facts (built; open-source; offline; RBAC), the pilot boundary, and a four-row risks→strategies table whose first row is "no monthly panel yet".
- **Main visual (~45%).** *Deployment beside PAIMANA:* `PAIMANA (NIC Cloud · MS SQL · SSRS · IPMP API feed)` —(monthly CUF export / REST)→ `Annex: one container (FastAPI + models) + PostgreSQL` → outputs `queue · windows · briefing (EN/HI)` back into `Project Monitoring Report` and `line-ministry dashboards`; side notes `roles: viewer / analyst / admin` · `no external calls required` · `all open-source`. Dashed box "Needed from MoSPI: OCMS history · full CUF · monthly archive".
- **Supporting visual.** The four-row risk table (below).
- **Key evidence.** NIC's PAIMANA article (stack, "AI-driven forecasting" roadmap); PIB 25 Mar 2026 (IPMP integration, 64% auto-updated); `Dockerfile`, `requirements.txt` pins, `backend/auth.py`, ingest module; `CLAIMS.md` §2 (declared weights).
- **Exact text that belongs.**
  - *Analysis of the feasibility* — **Built:** working prototype, ~93 API endpoints, 140 automated checks, Docker image, pinned open-source stack · **Fits PAIMANA's roadmap:** NIC's own write-up names "AI-driven forecasting… to predict time and cost overruns" as the next step · **Pilot:** one ministry's projects, one quarter, owner: IPMD monitoring officer; output = an annex to the monthly report · **Sustainability:** no licences, no external API, runs on one NIC Cloud VM; weights and thresholds are Ministry-editable policy.
  - *Potential challenges and risks* / *Strategies for overcoming* — four rows: (1) **No monthly panel yet** — we hold one public snapshot + four monthly report extracts → ingest PAIMANA's Monthly Flash Report archive; add month-over-month features; re-run the same protocol · (2) **Queue weights are declared, not yet outcome-validated** → cross-sectional backtest now; temporal backtest on OCMS history; Ministry sets weights via the admin view · (3) **Cost model tested on sanctions ≤ 2021; 55% of the portfolio is 2021–24** → young projects fall back to the sector prior and are flagged "prior-dominated", never scored as safe · (4) **Self-reported inputs; missing fields** → validation scanner; missing signals are shown as "not reported", never silently zero.
  - One line under the table: **What we refuse to claim:** sub-metre satellite verification; fraud verdicts (20% CCEA bunching test: p = 0.68, reported as a null).
- **Must NOT appear.** Kubernetes/microservices diagrams; cloud-provider logos; "sovereign"; the CVaR allocator; the dependency graph; the satellite stack; "no showstoppers"; a business-model canvas; adoption projections; anything about Cabinet or PMO.
- **Objection pre-answered.** "Who runs this and where?" (IPMD officer, NIC Cloud VM). "This is a monthly system — where is month-over-month?" (row 1, conceded and closed). "Why should I trust weights you chose?" (row 2). "Will it work on my newest projects?" (row 3). "Open-source?" (line 4 of feasibility).
- **Eye-path.** FIRST: the small annex box beside the big PAIMANA box. SECOND: the first risk row. UNDERSTAND: low integration cost, honest scope, clear pilot.
- **Transition.** If it can run beside PAIMANA next quarter, what does the officer actually get? Slide 5.

---

### Slide 5 — IMPACT AND BENEFITS

- **Strategic purpose.** Score "scale of impact" and "user experience" without inventing a rupee — by showing measured deltas in the officer's terms and one user story (winner pattern).
- **Exact judge takeaway.** "The report changes from 'what slipped' to 'what will slip, by how much, with what confidence, and which twenty to act on' — and the improvement is measured."
- **Core message.** *Description → intervention, measured: a window instead of a date, a queue instead of 1,981 rows, a reason per rank.*
- **3 seconds.** Three before/after pairs in large type: **50.8% → 79.0%** (window coverage) · **100 → 22.7 months** (median date error) · **18.49 → 16.24%** (cost-overrun error vs the sector-average forecast).
- **10 seconds.** Who benefits and how (IPMD officers; line-ministry PMG cells; DIID statisticians), the user story, and the benefits list with the honest "environmental: none claimed".
- **Main visual (~50%).** *Three before/after bar pairs*, same scale per pair, "PAIMANA today / sector average" in grey, "annex" in the accent colour, each pair captioned with n (596 / 596 / 265). Nothing else in colour on the slide.
- **Supporting visual.** *One officer's April:* a three-panel strip — "Report: 1,981 rows" → "Queue: ranked, with reasons" → "Escalation note: bilingual, every sentence cites a fact" — using real stills from the prototype.
- **Key evidence.** `conformal_calibration.json`, `overrun_models.json`; prototype.
- **Exact text that belongs.**
  - *Potential impact on the target audience* — **IPMD monitoring officers:** which projects to escalate this month, and why — computed, not compiled · **Line ministries / PMG cells:** a calibrated window and a driver list per project instead of a promised date · **DIID statisticians:** every number reproducible; models, baselines and limits documented — a method the Ministry can own.
  - *Benefits* — **Economic:** earlier intervention on the ₹42.78 lakh crore portfolio; the size of any saving is *not* claimed — it is what the pilot will measure · **Governance:** ranked, reasoned, contestable; audit trail per figure · **Social / accessibility:** bilingual (English / Hindi) briefings; plain-language reasons · **Environmental:** no claim.
- **Must NOT appear.** "₹X lakh crore saved/protected"; users, adoption, time saved; national-network "contagion" totals; satellite imagery; "99%"; adjectives without numbers (enhanced/improved/optimised); more than three coloured numbers.
- **Objection pre-answered.** "Where is the impact number?" (three measured deltas with n). "Are you claiming savings?" (explicitly not; pilot measures it). "Who is the user?" (named roles).
- **Eye-path.** FIRST: 50.8% → 79.0%. SECOND: the three-panel officer strip. UNDERSTAND: the improvement is real, measured, and lands on a desk.
- **Transition.** Every number on this slide can be rerun; slide 6 says how, and what we read on the way.

---

### Slide 6 — RESEARCH AND REFERENCES

- **Strategic purpose.** Credibility close: the literature on this very database, the methods' primary sources, the owner's own documents, and a reproduce-it box. Winners' reference slides were their weakest; ours can be a second proof slide.
- **Exact judge takeaway.** "They read Ram Singh on our data, cite Flyvbjerg's reference-class forecasting as the conventional baseline, name the method papers, quote NIC's roadmap — and I can rerun their numbers in three commands."
- **Core message.** *Grounded in the literature on MoSPI's data; every figure regenerable.*
- **3 seconds.** Two columns titled "Read" and "Rerun", and three monospace commands.
- **10 seconds.** Eight references with one-line "why it matters", grouped: on this database · methods · owner's documents · our artifacts.
- **Main visual.** The two-column layout itself; the "Rerun" box in monospace with the three commands and the artifact filenames.
- **Supporting visual.** Small: the ledger's three-way legend (fitted / heuristic / refused) as one line, linking to `CLAIMS.md`.
- **Key evidence.** The references; the repository.
- **Exact text that belongs.**
  - *On this database:* Ram Singh (2010), "Delays and Cost Overruns in Infrastructure Projects: Extent, Causes and Remedies", EPW 45(21) — 894 MoSPI projects, 1992–2009: delay and cost overrun move together · Morris (1990), EPW — earlier evidence on Indian public-sector overruns.
  - *Methods:* Flyvbjerg (2006), reference-class forecasting — the conventional baseline we benchmark against · Wei (1992), Statistics in Medicine — the AFT model for censored durations · Romano, Patterson & Candès (2019), Conformalized Quantile Regression — calibrated intervals with finite-sample coverage · McCrary (2008), J. Econometrics — density test used for the 20% CCEA threshold (null result).
  - *Owner's documents:* NIC Informatics (Oct 2025), "PAIMANA Portal" — stack and "AI-driven forecasting" roadmap · PIB (25 Mar 2026), PAIMANA and IPMP integration · MoSPI, Project Monitoring Report, April 2026 (PS dataset pointer).
  - *Our artifacts:* repository link · `CLAIMS.md` (fitted / heuristic / refused; withdrawn claims) · `artifacts/aft_survival.json` · `conformal_calibration.json` · `overrun_models.json` · `eo_progress_independence.json`.
  - *Rerun:* `python analytics_engine/aft_survival.py` · `python analytics_engine/conformal_calibration.py` · `python tests/test_engine_precision.py` — "seed 42; artifacts regenerate byte-identically."
- **Must NOT appear.** react.dev / tensorflow.org / "Kaggle"; bare link icons with no titles; references for engines not in the deck (Prithvi, Rockafellar–Uryasev, Shapley) — unless the LP/graph appear as one future-scope line elsewhere, which they do not; anything unsourced.
- **Objection pre-answered.** "Do they know the literature on our data?" (Singh, Morris). "Is 'conventional statistics' defined?" (Flyvbjerg RCF). "Can I check this?" (three commands).
- **Eye-path.** FIRST: the "Rerun" box. SECOND: Ram Singh's line. UNDERSTAND: this team did its reading and invites verification.
- **Transition (to the abstract / portal description).** The portal's idea description, written in the next phase, is the sentence the judge remembers: *the team that told MoSPI, with numbers it can rerun, where AI helps on PAIMANA data and where it does not — and gave every unfinished project a calibrated window instead of a promised date.*

---

## 3. Cross-slide coherence test

**The 3-second reads, in order:** (1) SIH26103, PRAKALP-DRISHTI, calibrated early warning for PAIMANA → (2) a promised date becomes a calibrated window; 1,988 of 2,103 unfinished → (3) 79.0% coverage; 16.24 vs 18.49; earned chronologically → (4) one box beside PAIMANA; first risk: no monthly panel yet → (5) 50.8 → 79.0 · 100 → 22.7 · 18.49 → 16.24 → (6) rerun it in three commands.
Read as one sentence: *"For SIH26103 we replace promised dates with calibrated windows on a portfolio that is 94% unfinished, we can show how the numbers were earned, it fits beside PAIMANA with its limits stated, the gains are measured, and you can rerun them."* That is the narrative spine, unchanged.

**Inevitability check (does each slide make the next one necessary?)** S2 shows an output → S3 must show how it is computed and proven → a pipeline on public data forces the deployment question → S4 answers it and concedes limits → a deployable, limited thing forces "so what does the officer get?" → S5 answers with measured deltas → measured deltas force "can I check?" → S6. No slide can be removed without leaving a question open; no slide answers a question the previous one did not raise.

**Number consistency (every figure appears with the same value everywhere it appears):** 1,981 / ₹37.13 / ₹42.78 / ₹20.36 (PS) · 2,207 rows / 2,103 usable / 115 events / 1,988 censored · 12 leakage columns · 792 / 265 (cost split) · 596 (conformal test) · 50.8 → 79.0 (nominal 85) · 100 → 22.7 months · 22.41 / 18.49 / 16.67 / 16.24 · +2.6% / −33% · externals −3.8% · 140 checks · ~93 endpoints · p = 0.68. Each appears on at most two slides, and the second appearance is a restatement (S5 restates S3), never a new figure.

**Duplication check.** The fan appears once (S2); the pipeline once (S3); the deployment picture once (S4); the before/after bars once (S5). The three proof numbers appear on S3 (where produced) and S5 (as outcome). Nothing else repeats.

**Silence check (what the deck deliberately never says).** Eleven engines; CVaR allocator; Shapley contagion; satellite/Prithvi; NAGRIK; election scoring; Merkle cryptography beyond "cites a hashed fact"; "sovereign"; PMO/Cabinet; any rupee saved; any user count. All exist in the repo; none belongs in the six slides; all are available as finale backup.

**Failure modes this architecture guards against (from the research and the audit):** feature soup (S2 has four outputs, not eleven); logo soup (S3 has one line of technologies); adjective impact (S5 has three measured pairs and "no claim" where there is none); references that name nothing (S6); undecided stack (none); demo asleep (link tested cold before export; dated stills as fallback); document contradictions (all numbers above are pinned to artifacts, and the repo reconciliation is a precondition, not a slide).

**Verdict.** Viewed in sequence, the six slides are one argument with one visual per step and one number set throughout. It is compelling *only if* three preconditions from the audit are met before the copy phase: the demo opens cold; README/CLAIMS/code are reconciled; the engine output for the example project on S2 is pulled from the live system, not drawn.

---

## 4. Handoff to the next phase (visual design + final copy)

1. Pull the S2 example project's P10–P95 window and P50 from the engine (Sivok–Rangpo 705432 or Tapovan-Vishnugad 602185) and export the fan as an image.
2. Capture three dated prototype stills (queue, project page, briefing) at 1920 × 1080 after the demo host is fixed.
3. Draft the portal **Idea title** (= S1 line) and **Idea description** (≈ the narrative's sentences 1, 3, 4, 5, 6 in one short paragraph — the only place a paragraph is allowed, because it is a portal field, not a slide).
4. Copy phase: write every slide's text to the word budgets implied above (S2 ≈ 150 words, S3 ≈ 120, S4 ≈ 160, S5 ≈ 110, S6 ≈ 140); one accent colour; one serif for section titles (the template's), one sans for body; no font below 11 pt; export to PDF; test links in the PDF.
