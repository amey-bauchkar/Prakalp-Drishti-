# PRAKALP-DRISHTI × SIH 2026 — Master Document (PS SIH26103)

*Assembled 16 September 2026 from the seven phase documents in `docs_and_presentations/`. This is the whole record, start to end: the research on what wins SIH decks, the judge model, the audit of our own project, the competitor position, the narrative, the blueprint, the hostile panel review with scores, and the final locked deck specification. Nothing here is projected; every number traces to a repository artifact or an official page, and the registry in §0.3 is the single source of truth for figures.*

---

# Part 0 — Executive summary and how to use this document

## 0.1 The situation in six lines

1. **Problem statement.** SIH26103 — MoSPI, Data Informatics & Innovation Division (DIID) for the Infrastructure & Project Monitoring Division (IPMD): move PAIMANA from descriptive to predictive and prescriptive monitoring; three technical dimensions (a) models, (b) does AI/ML beat conventional statistics, (c) CUF fields vs additional variables; nine indicative outcomes a–i; open-source preferred; dataset pointer = April 2026 Project Monitoring Report. Deadline 30 September 2026; 500-idea cap; ~5 finalists per PS chosen by the PS-owning organisation.
2. **What decides shortlisting.** A six-slide PDF on the official 2026 template (verified from sih.gov.in), read by DIID/IPMD evaluators; no pitch. Verified winners' decks share five traits: number-first problem framing, institution-specific language, 3–7 capabilities with mechanisms, prototype evidence, and honest limits — and none of the non-shortlisted decks have all five.
3. **What we have.** A working ~20-screen prototype with the strongest evaluation methodology in the field: right-censored survival forecasting with measured conformal coverage, a chronological leakage-stripped cost model with three baselines, measured answers to dimensions (b) and (c) including negative results, a claims ledger with corrections on record, and byte-identical regenerable artifacts.
4. **What we had wrong.** Framed for PMO/Cabinet instead of IPMD; eleven engines where four outputs are needed; a dependency graph inferred from 50-km proximity presented as verified; a satellite stack our own artifact shows to be uninformative yet weighted 20% of the risk score; an unvalidated early-warning queue; no monthly panel; a sleeping demo host; documents contradicting each other.
5. **The field.** Nine public rival repositories on the same PS; two serious (PRISM: 7,499 monthly rows, 125 tests; InfraSight AI: 373 commits, Flash Reports back to 2001). Both have monthly panel data; neither handles censoring, calibrates an interval, or runs the ablations the PS asks for.
6. **The deck.** Six slides, one argument: *a calibrated completion window for every unfinished project, on the ministry's own data, with the PS's three questions answered by measurement — including the inconvenient answers — and every number regenerable in three commands.* Panel score 70 → 78 after fixes; preconditions (host awake, reconciliation, dated stills) are what remain.

## 0.2 Reading order

| Part | What it settles | Read it when |
|---|---|---|
| 1 | What SIH judges reward; the evaluation model with weights | You want to know why the deck is shaped the way it is |
| 2 | Where our project is strong, weak, over-built and unproven | You are deciding what to cut, fix or prove |
| 3 | What already exists (PAIMANA, rivals, commercial, academic) and our true differentiation | You need the "why us instead of X" answer |
| 4 | The seven sentences and the eight-beat story | You are writing anything — deck, abstract, pitch |
| 5 | Compliance (verified) and the per-slide architecture | You are laying out the slides |
| 6 | Thirty-six hostile questions with truthful answers; scores | You are preparing for mentoring and evaluation rounds |
| 7 | The final locked copy, composition, charts, sources, narrative | You are building the PDF |

## 0.3 Number registry — the single source of truth

Every figure used anywhere in this document, with its source. If a slide, README or answer disagrees with this table, the table wins.

| Figure | Value | Source |
|---|---|---|
| PS portfolio (April 2026) | 1,981 ongoing projects · ₹37.13 lakh crore original · ₹42.78 revised · ₹20.36 spent · 17 ministries · 22 sectors | PS text, sih.gov.in |
| PAIMANA (January 2026) | 1,702 ongoing · ₹33.71 lakh crore original · ₹20.01 spent; IPMP integration; 64% auto-updated | PIB Release 2244898, 25 Mar 2026 |
| PAIMANA stack | Bootstrap · MS SQL · SSRS · NIC Cloud · REST APIs; "AI-driven forecasting" in Way Forward | NIC Informatics, Oct 2025 |
| Our register | 2,207 rows · 25 public fields · Jun 2026 snapshot · 164 at ≥100% progress · 1,208 sanctioned 2021–24 (55%) | `paimana_extracted/PAIMANA_MASTER_PROJECTS_DATABASE.csv` |
| Survival model | 2,103 observations · 115 events · 1,988 right-censored · event rate 5.5% · as-of 30 Jun 2026 · σ 0.349 · τ 0.15 · baseline multiplier 3.31× (upper bound; survivorship) · only Roads & Highways data-driven (2.70×) | `artifacts/aft_survival.json` |
| Conformal window | target = official *revised* completion date · n_labelled 1,192 · calibrate 596 · test 596 · overdue excluded 616 · coverage 50.84% uncalibrated → 79.03% calibrated at nominal 85% · P50 MAE 99.95 → 22.71 months · mean band width 100.86 months · multipliers 0.2365 / 0.4599 / 0.8358 / 0.9757 | `artifacts/conformal_calibration.json` |
| Cost model | target = revised-cost overrun % at snapshot · maturity gate 5 yrs · n_usable 1,057 · train 792 (sanctions ≤ 2020) · test 265 (2020–21) · 12 leakage columns removed · MAE: naive 22.41 · sector mean 18.49 · OLS 16.67 · boosting 16.24 · lift −27.5% vs naive, −12.2% vs sector mean, −2.57% vs OLS · R² −0.044 · externals −3.78% | `artifacts/overrun_models.json` |
| Time (slip) model | not deployable · OLS MAE 7.9 vs boosting 10.5 · calendar identity applies · externals −145% | `artifacts/overrun_models.json` |
| Example project 617185 | Kurnool-IV REZ transmission (POWERGRID) · ₹5,550 Cr · 25% · sanctioned 24 Mar 2025 · original 23 Mar 2027 · revised 30 Sep 2027 · P10 7 Feb 2027 · P50 15 Nov 2028 · P80 10 Nov 2031 · P95 19 Dec 2032 · P(meet revised) 0.222 · P(meet original) 0.117 | `KaalChakraEngine.forecast_project("617185")`, 16 Sep 2026 |
| Imagery vs progress | Pearson r = +0.004 · p = 0.87 · n = 1,588 | `artifacts/eo_progress_independence.json` |
| Prithvi stage head | CV accuracy 38.3% vs majority 27.2% vs permutation 25.1% — agreement with a rule, not ground truth | `analytics_engine/models/stage_head.json` |
| 20% CCEA bunching | 28 revisions at 18–20% vs 17 at 20–22% · McCrary θ +0.076 · p = 0.68 (null) | `modules/tanmay/service.py`; `CLAIMS.md` §4b |
| Risk index | weights schedule .30 · cost .25 · EO .20 · contagion .15 · governance .10 · bands 75/55/35 · distribution 16 / 75 / 791 / 1,325 · not outcome-validated | `analytics_engine/risk_index.py` |
| Dependency graph | 1,345 inferred edges (275 supply-chain + 1,070 ≤ 50 km) · hypothesised, not verified | `analytics_engine/setu_graph.py` |
| Prototype | ~93 API endpoints · ~20 screens · 140 checks passed, 1 skipped · Docker · pinned numerics · offline deterministic copilot mode | `CLAIMS.md`; `backend/`; `frontend/` |
| SIH 2026 | 500 ideas per PS · max 2 PS per team · 30 Sep 2026 deadline · "4-5 teams per PS may be selected" · finale offline, Dec 2026 · six slides incl. title · PDF only · pointers fixed | SIH 2026 Guidelines PDF; template, sih.gov.in |
| SIH 2025 (for scale) | 72,165 ideas · 68,766 teams · 1,360 finalists · 271 PS · 259 PS with exactly 5 finalists | PIB 2201244; official shortlist table |
| Judge-model weights (screening) | alignment 20 · novelty 20 · technical credibility 20 · feasibility 15 · impact/business 15 · format 10 | Part 1 §6a |
| Scores | audit 56/80 (pre-deck) · panel 70 → 78 /100 (deck v1 → v2) | Parts 2 and 6 |

## 0.4 Consolidated to-do before submission (from Parts 2, 5, 6, 7)

1. Keep the API awake for the submission window **and** deploy a static fallback build with pre-computed JSON.
2. Reconcile README / CLAIMS / scripts: 140 checks; 1,345 edges; remove "sub-meter", "Tarjan", the latency badge; publish `docs/RECONCILIATION_APRIL_2026.md`.
3. Set `ground_truth_risk` weight to 0 (or opt-in) citing the independence artifact; relabel the dependency graph as hypothesised.
4. Cross-sectional backtest of the risk band against realised overrun/slip; state its limits.
5. Re-pull the slide-2 fan from the engine on export day; capture three dated stills; record the video or omit the pill.
6. Write the reference-class interval baseline for the window (optional, high value): sector P10/P95 slip-ratio quantiles from the 596 calibration projects → coverage on the 596 test projects.
7. Draft the portal idea title and description exactly as in Part 7 §1; export six pages, pointers verbatim, PDF.

## 0.5 Timeline of this work

13 Sep 2026 — presentation research and judge model (Part 1). 16 Sep 2026 — competition audit (Part 2), competitor analysis (Part 3), narrative (Part 4), blueprint with compliance re-verified from sih.gov.in (Part 5), deck content v1 → v2, hostile panel review (Part 6), final locked specification (Part 7), this master document.

---


# Part 1 — What wins SIH presentations — research and the judge model

*Source: `SIH2026_PRESENTATION_RESEARCH.md` · 13 Sep 2026*

*Prepared 13 September 2026 for the PRAKALP-DRISHTI team (MoSPI / IPMD, "Use case on web-based integrated project-monitoring platform"). Research phase only — no slides designed, no solution rewritten.*

**How to read the tags.** Every claim carries one of four labels so you can tell what is proven from what is judgement:

- **[E] Evidence** — a primary document, an official page, or a deck I opened and read myself.
- **[O] Observation** — something I saw across the sample; countable, but the sample is small.
- **[I] Inference** — my reading of why the evidence looks the way it does.
- **[R] Recommendation** — what I think we should do about it.

**Two things to know before the detail.**

1. **[E] The round that decides whether we reach the Grand Finale is read, not presented.** SIH shortlists ~5 teams per problem statement from up to 500 idea submissions, on the strength of a 6-slide PDF alone. In SIH 2025, 259 of 271 statements sent exactly 5 teams; 9 sent 6; 2 sent 4; 1 sent 3 (official shortlist table, 1,360 rows). Nobody speaks. No demo saves a weak deck.
2. **[E] The repository you pointed me at is not what it says it is.** Of the seven decks in `Aadiii00/SIH-Winners-PPt-and-Sources`, I could verify **one** as a national winner on the official SIH results table (Canon Crew, SIH1686, NTRO, 2024). Two are provably *not* winners (the official winners for their PS IDs are other teams), one is a blank template, and the rest cannot be verified. The README's advertised folders do not exist and it links a paid "vault". I therefore rebuilt the sample from sources whose status I could check against `sih.gov.in`.

---

## 1. Research sources analysed

### 1a. Official and primary (highest weight)

| Source | What it gave us | Status |
|---|---|---|
| **SIH 2026 official idea template** (`SIH2026-IDEA-Presentation-Format.pptx`, hosted by GEU CSE dept, dated Sept 2026) | Exact slide prompts and the instruction slide (see §5) | **[E]** read the .pptx |
| **SIH 2026 problem-statement table** (`sih.gov.in/sih2026PS`, read 13 Sep 2026) | PS SIH26103 full text, department = **Data Informatics & Innovation Division (DIID)**, category Software, theme Smart Automation, **submitted ideas 5/500**, deadline **30 September 2026**; MoSPI has two other PS (26056 CPI airfare index, 26101 iGOT learning platform) | **[E]** |
| **SIH 2025 shortlist for Grand Finale** (`sih.gov.in/sih2025/shortlisted-teams-grand-finale`) | 1,360 finalists across 271 PS; per-PS counts; verified finalist status of two decks studied | **[E]** |
| **SIH 2024 and 2025 Grand Finale results** (`sih.gov.in`) | Winner verification for every deck in the sample; prize ₹1,50,000 (2025 software), joint winners ₹75,000; "no winners" declared for some PS | **[E]** |
| **SIH 2025 General Guidelines** (official deck, mirrored by Solamalai CE) and **DTU SPOC notice 28.08.2026** reproducing SIH 2026 FAQs | Official evaluation criteria list; "Working Prototype (not necessarily complete) is mandatory for Software Edition"; "Idea should be unique and novel. If it has a business potential more weightage will be given"; 6-page limit; abstract asked separately; 500-idea cap per PS | **[E]** |
| **PIB press releases** (9 Dec 2025, PRID 2201244; 12 Dec 2025, PRID 2202893; 11 Dec 2024, PRID 2083470) | 72,165 ideas from 68,766 teams → 1,360 finalists (1.9%); 60 nodal centres; 36-hour finale "under continuous mentoring and evaluation"; finale evaluators drawn from the PS-owning organisations (e.g. "Evaluators from NDRF, NCB, MoE-Innovation Cell, Godrej, NALCO") | **[E]** |
| **MoSPI STATATHON 2025–26** coverage (YouthIncMag) | MoSPI's own hackathon judged on "innovation, scalability, technical feasibility, and potential impact on governance and statistical processes"; DDG NSO: solutions "have the potential to be valuable for the official statistical system" | **[E]** for quotes; proxy for MoSPI's judging culture |
| **Institutional rubrics** (LPI Durgapur internal-hackathon report, SIH 2025) | Five criteria × 10 marks: Innovation/Originality, Feasibility/Realistic Implementation, Social-Environmental Impact/Business Value, Technical Execution, Presentation | **[E]** institution-level, not national |

### 1b. Decks actually opened and analysed (17)

Verification column is against the official result/shortlist tables, not the uploader's claim.

| # | Year | Team / deck | PS · organisation | Verified status | Slides · format |
|---|---|---|---|---|---|
| 1 | 2024 | **Canon Crew** — CIS-GPO automator | SIH1686 · NTRO | **Winner (official)** | 6 · official template |
| 2 | 2025 | **Ourobonics** — Kritrim humanoid (hardware) | SIH25117 · AICTE | **Joint winner (official)** | 6 · official template (.pptx from team repo) |
| 3 | 2025 | **404 The Optimists** — Lanezy traffic | SIH25050 · Govt of Odisha | **Finalist (official shortlist, Team 92770)**; PS winner was Dynamo1 | 6 · official template; deck from the KunnuSherry video |
| 4 | 2025 | **Synapsee** — ComminuSense mining energy | SIH25210 · NMDC / MoSteel | **Finalist (official shortlist, Team 92633)**; PS winner was Fallen Rock | 6 · official template; deck from the Heisenberg video |
| 5 | 2020 | **Zero++** — groundwater analytics dashboard | DM84 · Central Ground Water Board | 1st prize (team repo + appreciation letter; pre-dates online result tables) | 7 · old format |
| 6 | 2023 | **Coding Zen** — mining-law chatbot | SIH1312 · Ministry of Coal | Team won SIH 2023 **on a different PS (SIH1380, Ministry of Power)**; this deck's PS was won by others | 4 · 2023 format |
| 7 | 2022 | CODESTRIX — OTP alternative | NS1162 · DRDO | Unverified | 4 · 2022 format |
| 8 | 2024 | Expert Chain — police face recognition | SIH1788 | Not a winner | 6 |
| 9 | 2024 | Team Chankya — legal case-law app | SIH 2024 | Not a winner | 6 |
| 10 | 2024 | AKY — GreenSort waste | SIH1592 | **Not a winner** (winner: TrashCam) | 6 |
| 11 | 2024 | Innovators — women safety | SIH1605 | **Not a winner** (winner: SHILEDAR) | 6 |
| 12 | 2024 | Techbyte — AlertMe disaster | — | Not a winner | 6 |
| 13 | 2025 | GeoGuards — rockfall prediction | SIH25071 · NIRM | **Not shortlisted** | 6 |
| 14 | 2025 | Tech Pioneers — RockVision AI | SIH25071 · NIRM | Not shortlisted for this PS (winner: Hackmonks06) | 6 |
| 15 | 2025 | Gryffindors — KrishiAI crop advice | 2025 | Not a winner | 6 |
| 16 | 2025 | Not Like Us — SafeScape VR (NDRF) | 2025 | Not a winner | 6 |
| 17 | 2023 | "Presentation_Clean" (Nyaysathi legal) | SIH1283 · MoLJ | Anonymised template; unverifiable | 6 · 2023 format |

Also read: the 14-page "Guide to create a winning PPT" (Let's Code blog; 2024 legal-portal deck annotated by its author), the TechDoodles "SIH 2026 Playbook" and "Easy vs Difficult PS" (secondary), and the Krishna-Techstar `SIH-Resources-and-Winning-PPTs` repo (which is where decks 6–9, 15–16 came from — same mislabelling problem).

### 1c. First-hand accounts (finalists, winners, evaluators)

| Source | Standing | Key content |
|---|---|---|
| **KunnuSherry, "SIH Winning PPT REVEALED"** (YouTube, 28 Aug 2026, 38K views) and **"I Reached the SIH Grand Finale"** (25 Aug 2026, 46K views) — Kunal Sharma, VSSUT Burla / BPIT | SIH 2025 finalist, "one number away" (his PS winner was another team) | Chapter timing of his own deck walkthrough: slide 2 (problem/solution/comparison) 2 m 29 s, slide 3 (technical) 3 m 06 s, feasibility 50 s, impact 58 s, references 29 s. Tools named: Napkin AI, Mermaid. Auto-captions are Hindi-only; the deck itself was downloaded and analysed (row 3 above). |
| **Heisenberg, "SIH PPT That got us into Finals"** (YouTube, Sept 2026) — Nibedan Pati | SIH 2025 finalist (Synapsee, verified) | "The goal isn't to make the most beautiful PPT. The goal is to make a PPT where the evaluator can quickly understand: What is the problem? What are you proposing? How will it work? Can you actually build it? What impact? Why different?" Warns to manually verify AI-generated statistics, market numbers, references. |
| **Sneha Deshmukh (Team ASTRAA), Medium, Dec 2024** | **SIH 2024 winner, SIH1657, MoES/INCOIS — verified on the results table** | Judges' read-out comments for the winning team: "Uniqueness in one particular solution. 99% alignment with the problem statement. Deployable product with a user-friendly onboarding mechanism. Excellent teamwork, enthusiasm, and flexibility. Proactive approach with innovative ideas." Final demo: "The judges asked for an end-to-end walkthrough." Project broke "before every judging round" and they fixed it live. |
| **Chethan AC (Radar Vision), Medium, Jan 2025** | SIH 2024 winner (self-reported), PS 1606 | 150+ teams on their PS; internal 50→35; finale sequence "mentoring → evaluation ×3"; first evaluation "not our best, but a wake-up call"; final evaluation "judges came around, grilling us with questions." |
| **Vansh Rathi (LNCT), Medium, Aug 2024** | SIH 2023 finalist | 437 submissions → 6 finalist teams on his PS; "7-minute pitch limit"; first mentoring round hurt because "our prototype wasn't fully integrated"; fixed by round 2. |
| **GeeksforGeeks contest experience (SIH 2019)** | finalist | Four stages, the last a "power round"; a judge (VP Supply Chain, HUL) "asked us to think more about how this will benefit the corporate and focus less on the tech aspect." |
| **Swet Chandan, LinkedIn Pulse, Aug 2022** | SIH mentor and jury member | "Evaluation every time precedes with mentoring by the evaluators and teams were asked to work on certain areas which the team has left out." Parameters: "Innovation, Novelty, User Experience etc. The evaluators are experts from the Government, Academics or Industry." |
| **Sunyul Hossen, LinkedIn, 2022** (309 reactions, 59 comments) | losing finalist, with replies from a winner | Complaints: judges not always technical ("They state it NPL"); "Why are there no parameters of Judgement?"; a winner replies that "some are from the ministry for checking the practicality of the idea so they might not be knowing NLP." Commenters allege polished UI/templates impressed non-technical judges. |
| **Zaid Sayyed, "SIH 2026 Winner's Playbook"** (blog, 22 Aug 2026, 12.8K views) | self-described winner; sells companion sheets — **secondary, commercially motivated** | 26 jury questions with "trap" vs "what works" answers; "eight mistakes found in real 2026 decks"; "Evaluators visit the same table three or four times… comparing against their own last note." Used only where it agrees with primary accounts. |

### 1d. What I could not get

- Video transcripts: both requested videos carry only Hindi auto-captions and YouTube blocks the caption endpoint; third-party transcript sites sit behind Cloudflare. I used the descriptions, chapters, and — more valuable — the actual decks they link.
- Scribd "SIH 2025 Evaluation Criteria" / "Rubrics SIH 2025" documents render as images; only their metadata was readable.
- Two Medium/Hashnode winner posts were Cloudflare-blocked (the hashnode "How we won SIH 2024" one).
- Official per-round Grand Finale scoring sheets: no public copy exists that I could find. Everything about the finale rounds comes from participant accounts and evaluators, which agree with each other.

---

## 2. Strong presentation examples — what the verified decks actually do

### Canon Crew, SIH 2024 winner (NTRO, CIS-GPO automation) — [E]

- **Slide 2 is three parallel columns:** "Detailed Explanation of the Proposed Solution" / "How It Addresses the Problem?" / "Innovation and Uniqueness". Every bullet is *bolded noun + one clause*. ~200 words.
- **Slide 3:** a boxed architecture with the "Chain of LLM agents with access to an admin shell" stated as the core mechanism; a components list; and a logo strip (FastAPI, Mistral, MongoDB, Electron, Ollama, Chroma, PowerShell) — *named*, not "AI/ML".
- **Slide 4:** three boxes — feasibility, challenges ("Administrative Access Required", "Integration Complexity"), strategies (RBAC, testing + configuration DB). Honest, specific, short.
- **Slide 5:** Impact/Benefits bullets **plus a "For instance: user story"** — a government agency in an air-gapped environment, scenario → impact → benefits. **[O]** This is the only deck in the sample that narrates one user's situation on the impact slide.
- **Slide 6:** eight bare link icons ("RAG", "Ollama", "CIS Benchmark"…). Weak — and still won. **[I]** References did not decide it.
- Visual: official template, one accent (blue), Times-style headings, one icon per section, no clip-art.

### Ourobonics, SIH 2025 joint winner (AICTE, hardware humanoid) — [E]

- Slide 2 states the problem with **numbers that frame the gap**: "Existing humanoids are too expensive (₹20–60 lakh), non-modular, hard to repair" → snap-and-fit modular architecture.
- Slide 3 is short (66 words) with a **preview video link**.
- Slide 5 quantifies the benefit as **"70–80% cheaper than global humanoids"** and lists sectors the same platform serves.
- Slide 6: four named papers/reports (IEEE review, market outlook 2024–2030).
- **[O]** Not a beautiful deck. Text-heavy in places. It won a hardware PS where the finale prototype is the decider.

### 404 The Optimists / Lanezy, SIH 2025 finalist (Govt of Odisha, traffic) — [E]

- **Slide 2 opens with cost-of-problem numbers:** "India loses ₹60,000+ crores annually due to traffic delays… road accidents claim over 150,000 lives each year," then a **"Risk vs Solution" three-row mapping** (Endless jams → smart signal control; Emergency delays → priority routing; Recurring obstacles → real-time detection), a pyramid of features, and **"Prototype: Video · Website" links on the idea slide itself**.
- **Slide 3:** a cycle diagram of the control loop, two illustrated mechanism panels (YOLO camera → backend → ESP8266 signal; Haversine to nearest signal), **photographs of the actual breadboard hardware**, a stack panel (React/Tailwind, FastAPI, Render/Vercel, ESP8266/YOLOv8), and **"Report · GitHub" links**.
- **Slide 5:** a **before/after bar chart** ("Traffic crisis — current vs with smart system") and a headline claim "reduces congestion by 30–40%" — **[O]** unsourced.
- **Slide 6:** references are *institutions* — NITI Aayog, MoRTH road-accident report, IEEE Xplore — each with a one-line "why it matters", **plus three real UI screenshots** with YOLO bounding boxes.
- Text layer per slide: 36 / 111 / 57 / 197 / 116 / 20 words — the **lightest text in the sample**; the content is carried by diagrams, photos and screenshots.

### Synapsee / ComminuSense, SIH 2025 finalist (NMDC, mining energy) — [E]

- Slide 2: seven named modules, each a bolded capability with the mechanism in the clause ("Predictive Maintenance… vibration and temperature-based failure risk… automatically opens maintenance tickets"), and an **"NMDC-ready pilot package: Dockerized… aligned with IEC-62443 and ISA-95… operator-to-supervisor approval workflow"**.
- Slide 4 is the strongest feasibility slide in the sample: **an MVP timeline ("six to eight weeks with a team of five to seven"), a pilot bill of materials ("one edge gateway and three to four IoT sensors"), a payback window ("six to eighteen months based on similar industry cases")** and three risk→mitigation pairs (data scarcity → simulators + transfer learning; OT security → IEC-62443 segmentation; operator trust → SHAP + supervisor approval).
- Slide 5: **every impact number carries a source** — "Lower comminution energy use by 8–15% in pilot runs (up to 30% in literature). (Source: MDPI)"; CO₂ computed with "India's grid factor of 0.757 kg CO₂/kWh (Source: Climatiq)".
- Slide 6: a **feature matrix vs Metso, Sandvik, MineSense** with ticks/crosses, six linked references, five named existing systems, and a **live demo URL**.
- **[O]** Dense (283 / 174 / 368 / 233 words on slides 2–5) and it still made the cut — density is tolerated when every line is specific.

### Zero++, SIH 2020 1st prize (CGWB, groundwater analytics dashboard) — nearest analogue to our PS — [E]

- A **crisis slide with sourced statistics** ("21 cities predicted to run out of groundwater", "Atal Bhujal Yojana worth 6000 crore").
- **Data provenance stated as a number:** "Scraped ground water level data… 1996–2018 (22 years) from India-WRIS… 3,84,000 rows"; named source reports (GEC 2015, Dynamic GWR 2017).
- **Real product screenshots with call-outs** ("Entire map is interactive… clicking on any state opens a new page").
- **Use cases by stakeholder**: water managers, farming community, planning committee, public.
- Forecasting (ARIMA/LSTM) placed honestly under **"Future scope (show stopper)"**, not claimed as built.

### Team ASTRAA, SIH 2024 winner (INCOIS) — from the winner's account, deck not public — [E]

The judges' own words at the valedictory: uniqueness, **"99% alignment with the problem statement"**, **"deployable product with a user-friendly onboarding mechanism"**, teamwork, proactivity. That sentence is the closest thing to a published national rubric I found.

---

## 3. Cross-presentation pattern analysis

### 3a. Structure — [O] from 13 template-era decks

- **Slide count:** every 2024–2026 deck is exactly six slides on the official template; the template forbids changing the section prompts. Decks from 2022–23 used a 4-page "Idea/Approach Details" format; 2020 was free-form. **[I]** Structure is not a differentiator any more; *what fills the fixed prompts* is.
- **Aspect:** all 16:9.
- **Text density (words in the text layer per slide, template decks with a text layer):** Lanezy 90 avg · Gryffindors 123 · Expert Chain 172 · Chankya 175 · Not Like Us 179 · Synapsee 198. The two verified finalists sit at the two extremes (90 and 198) — **[I]** density itself does not predict selection; specificity does.
- **Slide-2 weight:** in every strong deck slide 2 is the densest and most designed slide; in the finalist walkthrough video it received 2.5 of 9 minutes, slide 3 another 3. **[I]** Evaluators reading 100+ decks form their view on slides 2–3; slides 4–6 confirm or break it.

### 3b. Problem framing — [O]

- Strong decks open with **the cost of the problem in numbers with a source** (₹60,000 crore, 150,000 lives; ₹20–60 lakh humanoids; 21 cities; kWh per tonne). Weak decks open with a generic paragraph ("In India, limited legal awareness and access are widespread issues…").
- Strong decks name the **specific institution's situation** (NMDC plant, NDRF drills, an air-gapped government agency, CGWB blocks). Weak decks would read the same if you swapped the ministry.

### 3c. Solution framing — [O]

- Winners/finalists state **3–7 capabilities, each with its mechanism** in the same line. Weak decks list 8–15 features without mechanism ("cashback… cryptocurrency and NFTs", "gamified legal education", "chatbot for customer support").
- **Explicit "how it addresses the problem" mapping** (risk → solution; column layout) appears in 3 of 4 verified strong decks and in the official template's own prompt.
- **Prototype evidence on slide 2 or 3** (video/website/GitHub/report links, hardware photos, UI screenshots) appears in **all four** verified 2024–25 strong decks and in **none** of the not-shortlisted ones except one generic stock image.

### 3d. Technical architecture — [O]

- Strong: one architecture diagram with **data sources and outputs labelled with real names** (Manupatra/Kanoon; InfluxDB; ESP8266; CIS PDF → FAISS → Mistral → PowerShell), plus a **named stack** (specific model, DB, framework).
- Weak: logo soup (Tech Pioneers lists ~40 technologies incl. Kubernetes, Kong, Elasticsearch, Stripe for a rockfall predictor), undecided stacks ("React/Angular", "MongoDB/PostgreSQL"), a box labelled "AI/ML".
- Two finalist decks state **standards** (IEC-62443, ISA-95; DPDP-style access control) — **[I]** standards are how a student deck signals "we know what deployment means" to a government evaluator.

### 3e. Feasibility — [O]

- Strong decks put **real risks with named mitigations** (data scarcity, OT security, operator trust, admin rights, integration with legacy systems). Weak decks write "Technical feasibility: uses reliable technologies (React, Node.js)".
- Only one deck (Synapsee) gives **time, team size, pilot BOM and payback**. It was shortlisted on a PS with 500-cap competition.

### 3f. Impact — [O]

- Strong: **one or two quantified effects with the source or the arithmetic shown**; a before/after chart; a user story. Weak: six boxes of comparatives ("enhanced", "improved", "increased") and clip-art.
- Judges' recorded language about a winner: "deployable", "user-friendly onboarding", "alignment with the problem statement" — not "innovative technology".

### 3g. References — [O]

- Strong: named institutional sources (NITI Aayog, MoRTH, IEEE, MDPI, ministry reports), competitor/prior-system comparison, dataset provenance with row counts. Weak: react.dev, tensorflow.org, "Kaggle datasets", "SIH problem statement documents".
- **[I]** References rarely win a deck but they can *lose* one: an evaluator who doubts a number looks here first.

### 3h. Visual patterns — [O]

- Template-compliant, one accent colour, bold labels, icon-per-section, white ground. Winners are not visually adventurous.
- **Real artefacts beat illustration:** breadboard photos, dashboard screenshots with bounding boxes, a rendered feature matrix. Clip-art cartoons (Innovators), stock pyramid diagrams and 3D renders lifted from papers (GeoGuards, Tech Pioneers) read as amateur.
- **Text overflow, overlapping text boxes, template placeholders left in, undecided stacks** appear only in the non-shortlisted decks (Innovators: clipped boxes; Chankya: overlapping paragraph; AKY: "Team ID –" blank).
- Typography: headings in the template's serif or a heavy sans; body 10–12 pt; strong decks keep 11 pt+ and never justify text.

### 3i. Storytelling — [O]

- A **single user's day** (Cannon Crew's air-gapped agency; the guide's "divorce papers" example; Zero++'s water manager) appears in the strong set and never in the weak set.
- Strong decks name **who inside the organisation uses it** and often the **approval/override workflow** (operator → supervisor; police manual override).

---

## 4. Winner vs average — the comparison in one table

| Dimension | Verified winner / finalist decks (n=5 incl. Zero++) | Not-shortlisted / unverified decks (n=9) |
|---|---|---|
| Problem opened with a sourced number | 4 of 5 | 1 of 9 (Not Like Us, partially) |
| PS-specific institution named on slide 2 | 5 of 5 | 3 of 9 |
| Capabilities with mechanism ≤ 7 | 5 of 5 | 2 of 9 (most list 8–15 features) |
| Prototype evidence (link/photo/screenshot) | 5 of 5 | 1 of 9 |
| Named stack (specific model/DB/framework) | 5 of 5 | 4 of 9 (others "Python, AI, Cloud" or undecided) |
| Real risks + mitigations on feasibility | 5 of 5 | 3 of 9 |
| Quantified impact with source/arithmetic | 4 of 5 | 0 of 9 |
| Standards / compliance named | 2 of 5 | 0 of 9 |
| Competitor or prior-system comparison | 2 of 5 | 0 of 9 |
| Template defects (placeholders, overflow, overlap) | 0 of 5 | 4 of 9 |
| Logo soup (>15 technologies) | 0 of 5 | 2 of 9 |

**[I]** The separating variables are not design polish. They are *specificity* (numbers, names, mechanisms, standards), *evidence that something exists* (prototype links), and *honesty about limits* (risks, "future scope"). **[R]** Treat those three as the scoring axes of our own deck review.

**Finalist-level vs ordinary shortlisted** (question C) — [I], thin evidence: the two verified finalists that *did not* win (Lanezy, Synapsee) differ from the verified winners mainly in the finale, not the deck. Winners' accounts stress (a) visible progress between mentoring rounds, (b) a working end-to-end demo at final evaluation, (c) "alignment with the problem statement" and "deployable… onboarding". Lanezy's own author says they finished "one number away". So: the deck gets you in; the finale is decided on demo, delta and deployability.

---

## 5. SIH judge mindset — what is verifiable

### 5a. The official criteria (idea-screening round) — [E]

From the SIH 2025 general guidelines and the SIH 2026 FAQs reproduced by DTU's SPOC:

> "Evaluation criteria will include novelty of the idea, complexity, clarity and details in the prescribed format, feasibility, practicability, sustainability, scale of impact, user experience and potential for future work progression."
> "Working Prototype (not necessarily complete) is mandatory for Software Edition."
> "Idea should be unique and novel. If it has a business potential more weightage will be given."
> "Apart from this PPT abstract of your idea will be asked separately while submitting."

The 2026 template's instruction slide adds: max six slides including title; "avoid paragraphs… points/diagrams/Infographics/pictures"; "You can only use provided template… without changing the idea details pointers"; PDF only.

### 5b. The mechanics that shape how a screening evaluator reads — [E]/[I]

- **[E]** Up to 500 ideas per PS; ~5 shortlisted. **[I]** An evaluator on a full PS reads a deck for two to four minutes. Slide 2 decides whether slides 3–6 get read carefully.
- **[E]** As of 13 Sep 2026, SIH26103 shows **5 submitted ideas** (uploads run to 30 Sep, after most colleges' internals on 9–11 Sep). **[I]** MoSPI is a **first-time SIH problem-giver** (no MoSPI PS on the 2023, 2024 or 2025 result tables) with a long, technical PS text that names three evaluation dimensions. Expect a small, self-selected field — and expect the DIID/IPMD evaluators to read carefully and check whether a deck answers *their* dimensions (a) statistical vs ML models, (b) whether AI beats conventional methods, (c) CUF-field attribution. A deck that ignores them will lose to one that answers them, regardless of polish.
- **[E]** The template asks for "Product Status (completion percentage and next steps)" in the 2025 version's example; 2026 keeps "working prototype" in the technical-approach prompt. **[I]** Screening evaluators are told to look for prototype evidence.

### 5c. The finale — [E] from accounts that agree with each other

- 36 hours; **three mentoring rounds interleaved with three evaluation rounds**, then a final evaluation/"power round"; evaluators are a mix of **the PS organisation's officials, industry, academia**; ~5–7 teams per PS at one nodal centre; the pitch window has been quoted as **7 minutes**; a coding freeze precedes the final round (5:00–5:30 pm in two accounts).
- Evaluators **compare against their previous visit's notes** (Sayyed; consistent with Chandan's "asked to work on certain areas which the team has left out" and Chethan's "first evaluation: wake-up call").
- The **PS organisation's people check practicality, not code** (Hossen thread; GfG account; PIB lists NDRF/NCB/NALCO evaluators). Some judges are non-technical. **[I]** A demo has to be legible to a Deputy Director who has never seen a terminal, *and* survive a technical panellist asking to open the code.
- Judges' recorded praise for a winner: uniqueness, PS alignment, deployable, onboarding, teamwork, proactivity.

### 5d. MoSPI specifically — [E]

MoSPI's own STATATHON 2025–26 judged on "innovation, scalability, technical feasibility, and potential impact on governance and statistical processes", and its DDG framed value as usefulness "for the official statistical system". The PS is owned by DIID (data informatics) on behalf of IPMD (project monitoring). **[I]** Our evaluators will be statisticians and IT officers: they will ask about method validity, data provenance, and whether the thing could sit beside PAIMANA — not about UI animation.

### 5e. What each dimension most likely means to a real evaluator — [I]

| Dimension | What they are actually checking |
|---|---|
| Problem understanding | Does slide 2 name *their* division, *their* data (PAIMANA, CUF, OCMS history) and *their* pain (cost/time overruns surfacing too late)? Would the slide still read fine if the ministry name changed? |
| Innovation / novelty | One sharp difference from the other 499 and from what PAIMANA already does — not a longer feature list. Business potential earns extra weight per the guideline. |
| Technical depth | Named models, named data, an architecture that a technical panellist can open and verify; no "AI/ML layer" box. |
| Feasibility / practicability | Data you actually have, risks you actually face, a pilot with a boundary, integration path with the existing system, who runs it. |
| Scalability / sustainability | Cost to run, open-source stack (the PS explicitly desires open-source), maintenance after the team graduates, air-gap/data-residency realities. |
| Impact | One number with the working shown; who inside the ministry benefits on day one. |
| User experience | The officer's day gets shorter; onboarding; bilingual; accessibility — "user-friendly onboarding" was in the winner's citation. |
| Implementation credibility | Prototype link that opens; screenshots that match the demo; measured numbers, not adjectives; limitations stated before being asked. |
| Presentation clarity | Six slides, no placeholders, no overflow, points not paragraphs, every claim checkable. |

---

## 6. Research-derived evaluation model (preliminary)

Two rounds, two different weightings. Weights are **[I]** — derived from the official criteria list, the 2026 guideline's explicit extra weight for business potential and mandatory prototype, the LPI five-equal-criteria rubric, MoSPI's STATATHON criteria, and the winner citation language. They are for our internal scoring, not a claim about the official sheet (which is not public).

### 6a. Screening round (the 6-slide PDF; decides Grand Finale entry)

| Dimension | Weight | Why this weight |
|---|---|---|
| Problem-statement alignment & understanding | **20** | "Clarity and details in the prescribed format" is an official criterion; "99% alignment with the problem statement" was the first thing judges cited for a winner; PS 26103 lists three explicit dimensions to answer. |
| Novelty / uniqueness (vs PAIMANA today and vs other entrants) | **20** | Named first in the official list; the guideline adds weight for business potential; the winner citation opens with "uniqueness". |
| Technical approach credibility (named stack, architecture, prototype evidence) | **20** | "Complexity" is an official criterion and the prototype is mandatory for software; every verified strong deck carries prototype evidence, none of the weak ones do. |
| Feasibility, risks, deployment path | **15** | "Feasibility, practicability, sustainability" are three of the nine official words; the best finalist deck spent a whole slide on time/BOM/payback/risks. |
| Impact, scale, business potential | **15** | "Scale of impact" plus the explicit business-potential weighting; winners quantify, non-winners use adjectives. |
| Clarity, format compliance, UX of the deck itself | **10** | "User experience" and "clarity… in the prescribed format" are official; template defects appear only in non-shortlisted decks — this is a floor, not a ceiling. |

### 6b. Grand Finale (36 h; 3 mentoring + 3 evaluation rounds + final)

| Dimension | Weight | Why |
|---|---|---|
| Working end-to-end demo at each visit | **25** | "Show me this running"; a winner's project breaking before every round and being fixed is the story they tell; the software prototype is mandatory. |
| Visible progress between rounds (acting on mentor feedback) | **20** | Evaluators compare against their last note; two winners describe a poor first evaluation turned around by round two. |
| Deployability for the PS owner (integration, ownership, cost, data residency, onboarding) | **20** | Winner citation: "deployable product with a user-friendly onboarding mechanism"; ministry evaluators "check the practicality". |
| Alignment with the PS as written | **15** | "99% alignment" citation; GfG account: "focus less on the tech aspect". |
| Team depth and honesty under questioning | **10** | "Excellent teamwork"; every member answers for their module; overclaims collapse under one counter-example. |
| Presentation clarity within the pitch window | **10** | 7-minute pitch; judges are mixed technical/non-technical. |

### 6c. The four thresholds

- **What gets a team shortlisted:** a slide 2 that could not belong to any other PS; a named, checkable stack with a prototype link that opens; one quantified impact with its arithmetic; risks stated. Nothing else in the sample separated shortlisted from not.
- **What gets a team remembered:** one artefact only that team could have (a photo of their hardware, a chart of their measured result, a feature matrix against real incumbents), one sentence of honest limitation, and one number the judge can repeat to a colleague.
- **What makes a team look risky:** logo soup; undecided stack; "we will use AI"; feature counts above ~7; unsourced round numbers (30–40% congestion reduction, 99% accuracy); a demo link on a sleeping free host; references to framework home pages.
- **What makes a team look unrealistic:** "no showstoppers"; "production ready"; "anyone can use it"; full-vision deployment instead of a bounded pilot; subscription revenue models for a ministry system; no answer to "who owns this on day one".
- **What creates the immediate "this belongs in the final" impression:** the deck reads like a pilot proposal an officer could forward internally — specific institution, specific data, specific method, measured result, named risks, named owner.

---

## 7. Biggest presentation mistakes (seen in the sample, or cited by finalists)

1. **Generic problem paragraph** that survives swapping the ministry name. (Innovators, Techbyte, Presentation_Clean.)
2. **Feature soup**: 8–15 capabilities, none with a mechanism, several off-PS (crypto/NFT cashback on a waste PS; blockchain storage on a legal-awareness PS).
3. **Logo soup / undecided stack**: "React/Angular", "MongoDB/PostgreSQL", 40 logos. Reads as "not built yet".
4. **"AI/ML" as a box**, not a named model with a named dataset and a measured number.
5. **Adjective impact**: enhanced / improved / increased, six boxes, no number, no source.
6. **Unsourced or unverifiable numbers**: "30–40% reduction", "99% alignment" written by the team about itself, "2000+ images".
7. **Template hygiene failures**: placeholders ("Team ID –"), overflowing text boxes, overlapping paragraphs, clip-art, a stock diagram lifted from a paper with its caption still on.
8. **References that name nothing**: react.dev, tensorflow.org, "Kaggle datasets", link icons with no target.
9. **No prototype evidence** in a round where a working prototype is mandatory.
10. **Feasibility written as reassurance** ("uses reliable technologies") instead of risks + mitigations.
11. **At the finale:** leading with the deck instead of the running thing; repeating the same pitch every round; one person answering everything; a demo dependent on venue Wi-Fi with no offline fallback; claiming nothing changed and nothing breaks.

---

## 8. Strongest recurring winning patterns

1. **Number-first problem framing with a source** (₹, lives, rows of data, kWh/t).
2. **Institution-specific language** — the deck names the department, its portal, its fields, its workflow.
3. **Risk → solution mapping** shown as a structure (columns/rows), matching the template's own prompt order.
4. **3–7 capabilities, each with its mechanism in the same line.**
5. **Prototype evidence in the deck** — links that open, screenshots that match, photographs of real hardware.
6. **One clear architecture diagram** with real names on every box, plus a named stack.
7. **Standards and governance vocabulary** (IEC-62443, RBAC, supervisor approval, data residency) where the PS owner is a government body.
8. **A feasibility slide that costs the pilot** — time, people, BOM, payback — and lists three real risks with mitigations.
9. **Quantified impact with the working shown**, ideally one chart.
10. **A user story** — one officer, one day, before and after.
11. **Competitor/incumbent comparison** with ticks and crosses (Synapsee, Zero++ implicitly vs WRIS).
12. **Honest scope boundaries** — "future scope", "80% built, testing next", "limited" cells in the matrix. Judges reward teams that know where their work is thin.

---

## 9. Strategic lessons for PS 26103 (research conclusions, not slide design)

**[E] Facts that set our situation apart.** MoSPI is new to SIH; SIH26103 is owned by DIID for IPMD; as of today only 5 ideas are submitted against a 500 cap with 17 days left; the PS text itself enumerates nine "possible expected outcomes" (a–i) and three technical dimensions (a–c), and says "only open-source tools/software" are desirable and that the April 2026 Project Monitoring Report on PAIMANA is the reference dataset. The shortlist will almost certainly be five teams, chosen by people who wrote that text.

**[I] What that implies.**

1. **The screening deck must answer the PS's own three dimensions explicitly** — (a) statistical vs predictive models, (b) whether AI/ML beats conventional methods, (c) CUF-field attribution — because the authors of those lines will be the readers. Our repository already holds measured answers to all three (chronological validation, sector-mean and OLS baselines, calendar-free ablation, external-feature ablation). No other team is likely to have *measured* (b) and (c); most will assert them. That is our "single thing only we did".
2. **Our biggest risk is the winning-pattern inverted.** Eleven engines is feature soup unless the deck subordinates them to three or four hero capabilities that map onto the PS's outcome list (a–i). The research is unambiguous: verified strong decks carry 3–7 capabilities with mechanisms; the not-shortlisted decks carry 8–15.
3. **Evidence culture is the differentiator, and we already have it.** The finalist decks that impressed evaluators cite sources for every number and state limits (Synapsee), and the winner citation praised "alignment" and "deployable". Our `CLAIMS.md` discipline — measured 79.0% coverage at nominal 85%, withdrawn 93.3%, p = 0.68 "no discontinuity" reported as the finding, survivorship caveat — is exactly the "honest limitations" behaviour judges reward, *provided it is presented as strength (measured, verifiable) rather than as a list of weaknesses*.
4. **Deployability vocabulary for a ministry reader**: PAIMANA/CUF integration path, role-based access, air-gap posture, Merkle-signed facts, bilingual/GIGW compliance, open-source stack, who owns it (IPMD monitoring officer), what a one-ministry pilot costs to run. Two finalist decks used standards language; the winner citation used "deployable" and "onboarding". We have all of these built; they need to be *named* in the ministry's terms.
5. **Prototype evidence must be un-embarrassable.** The template asks for it; the guideline makes it mandatory; the finalists put links on slide 2/3. Our deployed Render instance sleeps on the free tier — that is item 8 on the "real 2026 mistakes" list. Keep it warm or host the demo where it does not sleep, and put dated screenshots of the real cockpit in the deck as the fallback.
6. **Numbers with sources, from MoSPI's own data.** The strongest openings in the sample quote the owner's own statistics. The PS text hands us ours: 1,981 ongoing projects, ₹37.13 L Cr original vs ₹42.78 L Cr revised, ₹20.36 L Cr spent (April 2026). Our corpus figures (2,207 / ₹47.44 L Cr) must be reconciled or explicitly dated against the PS's figures — a statistician will notice the difference before anything else.
7. **Format hygiene is a floor we cannot fall through:** six slides, template pointers untouched, no placeholders, no overflow, PDF, abstract written separately, theme copied character-for-character from the portal ("Smart Automation", Software).
8. **For the finale (if shortlisted):** rehearse the 7-minute pitch as *demo first, deck second*; assign each engine to the member who built it; prepare the delta story between rounds; carry an offline demo; prepare answers to "which existing system does this talk to" (PAIMANA), "what is the smallest pilot" (one ministry's projects, one quarter), "who owns it day one" (IPMD), "what did the model get wrong" (we have the numbers), "how much did AI write" (say it plainly).

**[R] Immediate next steps for the next phase** (still no slide design): (1) decide the 3–4 hero capabilities against the PS's outcome list a–i; (2) write the one-sentence "only we did this" claim around measured dimension (b)/(c); (3) reconcile corpus figures with the April 2026 PMR; (4) fix demo hosting so the link never opens blank; (5) draft the separate abstract; (6) then, and only then, storyboard six slides against §6a's weights.

---

### Appendix — source links

- Official template (2026): `http://csitgeu.in/wp/wp-content/uploads/2026/09/SIH2026-IDEA-Presentation-Format.pptx`
- SIH 2026 PS table: `https://sih.gov.in/sih2026PS` · SIH 2025 shortlist: `https://sih.gov.in/sih2025/shortlisted-teams-grand-finale` · 2025 results: `https://www.sih.gov.in/sih2025/sih2025-grand-finale-result` · 2024 results: `https://www.sih.gov.in/sih2024/sih2024-grand-finale-result` · 2023 results: `https://www.sih.gov.in/sih2023-grand-finale-result`
- SIH 2025 guidelines mirror: `https://www.solamalaice.ac.in/pdf/SIH-new.pdf` · DTU SIH 2026 notice: `https://dtu.ac.in/Web/upload/events/aug/file0807.pdf`
- PIB: `https://www.pib.gov.in/PressReleasePage.aspx?PRID=2201244` · `…PRID=2202893` · `…PRID=2083470`
- MoSPI STATATHON coverage: `https://youthincmag.com/mospi-aictes-statathon-202526-awards-1-lakh-each-to-five-winning-teams-at-grand-finale-hosted-by-manav-rachna`
- Repositories: `https://github.com/Aadiii00/SIH-Winners-PPt-and-Sources` · `https://github.com/Krishna-Techstar/SIH-Resources-and-Winning-PPTs` · `https://github.com/Baksheeshs/ourobonics-kritrim_SIH_2025_Winner` · `https://github.com/mahajanhrishikesh/Levels`
- Videos: `https://youtu.be/0IQsRUJLhUc` (deck: Google Drive `103K242xCUtwz_G5Iu4abFcU9dIVCFFvE`) · `https://youtu.be/BBQhH4lxrUw` · `https://www.youtube.com/watch?v=RTcd-XzmZDI` (deck: Google Drive `1Qm5GwGzubtsWPqiH3SFeZVLYSOXMoe19`)
- Accounts: Sneha Deshmukh (Medium, `e55981468c06`) · Chethan AC (Medium, `afbe74e8e20c`) · Vansh Rathi (Medium, `25869c133734`) · Swet Chandan (LinkedIn Pulse) · Sunyul Hossen (LinkedIn, `6969660316540395521`) · Zaid Sayyed `https://zaidsayyed.in/blog/sih-2026` · GeeksforGeeks contest experience · LPI internal hackathon report `https://lpi.ac.in/pdf/REPORT%20on%20Internal%20Hackathon%202025%20LPI.pdf` · DJSCE winners note `https://www.djsce.ac.in/docs/SIH%20GRAND%20FINALE%202024.pdf`

---


# Part 2 — Competition audit of PRAKALP-DRISHTI against PS 26103

*Source: `SIH26103_COMPETITION_AUDIT.md` · 16 Sep 2026*

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

---


# Part 3 — Competitor and alternative analysis — why us?

*Source: `SIH26103_COMPETITOR_ANALYSIS.md` · 16 Sep 2026*

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
*(Figure: the Censored-Portfolio Ladder — rendered on the HTML page; its content is the five-rung table above.)*

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

---


# Part 4 — The narrative spine

*Source: `SIH26103_NARRATIVE.md` · 16 Sep 2026*

*16 September 2026. Fourth document in the sequence (winner research → judge model → audit → competitor position → this). It fixes what we say and in what order. It does not design slides.*

**Rule kept throughout:** every number below exists in an artifact today (`artifacts/aft_survival.json`, `conformal_calibration.json`, `overrun_models.json`, `eo_progress_independence.json`, `CLAIMS.md`) or on an official page (PS text, NIC's PAIMANA article, PIB 25 Mar 2026). Nothing is projected.

---

## 1. The seven sentences

**1 · Problem.**
PAIMANA records every slipped month and every revised rupee of ₹42.78 lakh crore in 1,981 ongoing projects — after they slip — and because 1,988 of the 2,103 projects in its public register have not finished, no one can say which project will slip next, by how much, or with what confidence.

**2 · Insight.**
The 94% of projects that have not finished are not missing data but censored data, and "does AI beat the ministry's own statistics?" is not a premise but a measurement — get those two things right and the forecast becomes calibrated; get them wrong and every accuracy claim on this dataset is fiction.

**3 · Solution.**
A monthly early-warning annex to IPMD's Project Monitoring Report: for every ongoing project, a calibrated completion window (P10–P95), a benchmarked cost-overrun forecast, and a ranked intervention queue with its drivers — computed from the CUF fields the ministry already collects, on open-source tools, offline, beside PAIMANA.

**4 · Innovation.**
We are the only entry on this problem statement that measured whether AI beats conventional statistics before claiming it — chronological split, twelve leakage columns named, three baselines, the CUF-versus-external ablation on both targets — and reported the inconvenient answers along with the useful ones.

**5 · Technical differentiator.**
A right-censored log-logistic survival model wrapped in split-conformal calibration gives this portfolio its first completion window with *measured* coverage — 79.0% of 596 held-out projects at a nominal 85%, against 50.8% uncalibrated — and every figure regenerates byte-identically from a seeded script on any machine.

**6 · Impact.**
Measured, not projected: median completion-date error falls from 100 months to 22.7; cost-overrun error is 12.2% below the sector-average forecast the ministry effectively uses today; and 1,981 projects collapse into a ranked queue whose reasons an officer can read and contest — the outcomes that turn a monthly report from description into intervention.

**7 · Why this team.**
Because we withdrew our own 93% claim in writing, published the results that went against us (ML barely beats OLS on cost and loses on time; external variables hurt; imagery cannot see progress; no bunching at the 20% CCEA cap), and built a working, offline, role-based prototype with ~93 endpoints and 140 automated checks — a statistics ministry can audit us line by line, and that is the kind of team it should let near its data.

---

## 2. The overarching story

The generic order is Problem → Insight → Solution → Innovation → Technical Proof → Impact → Deployment. Ours needs one change and one addition:

- **Proof comes before Innovation.** For a statistics division, the innovation *is* the proof — the ablation table is what makes "we measured" believable. Shown after, it reads as decoration; shown before, it earns the innovation claim.
- **An honesty beat sits before Impact.** Winners' decks state limits before being asked (research §3e, §8); our audit found four limits a hostile reader finds in minutes. Conceding them first converts them from attack surface into evidence of rigour.

**Final spine (8 beats):**

| # | Beat | What is said | Evidence pointer |
|---|---|---|---|
| 1 | **Problem** | ₹42.78 L Cr / 1,981 projects monitored in the rear-view mirror; 94% unfinished; the officer's question ("which twenty this month?") has no computed answer. | PS text; PIB 25 Mar 2026; `aft_survival.json` (115 events / 1,988 censored) |
| 2 | **Insight** | Censored ≠ missing. "Does AI help?" ≠ assumed. Reference-class averages are the honest baseline to beat. | Ram Singh (2010); Flyvbjerg (2006); our baselines |
| 3 | **Solution** | The monthly annex: window + forecast + queue + drivers, from CUF fields, open-source, offline, beside PAIMANA (MS SQL/SSRS/NIC Cloud). | Prototype; NIC's PAIMANA article ("AI-driven forecasting" roadmap) |
| 4 | **Proof** | One table: naive 22.41 → sector-mean 18.49 → OLS 16.67 → GB 16.24 (cost MAE %); time: OLS beats GB; externals −3.8% / −145%; coverage 50.8% → 79.0%; P50 error 100 → 22.7 mo. | `overrun_models.json`; `conformal_calibration.json` |
| 5 | **Innovation** | What that table means: on CUF fields the regressor is near its ceiling; the gains are censoring and calibration; the PS's questions (a)(b)(c) answered with numbers. | Same artifacts; competitor READMEs for contrast |
| 6 | **Honesty** | Four limits, stated first: no monthly panel yet (four snapshots held; archive identified); queue weights are declared policy, not yet outcome-validated; dependency edges are hypothesised; the cost model's tested regime is ≤2021 sanctions. Two refusals: no sub-metre satellite claims; no fraud verdicts. | `CLAIMS.md` §2–§4b; `eo_progress_independence.json`; McCrary p = 0.68 |
| 7 | **Impact** | The measured deltas (beat 4) restated as officer outcomes: a window instead of a promised date; a ranked queue instead of 1,981 rows; a reason per rank; a Hindi/English briefing whose every sentence cites a hashed fact. | Prototype; Merkle facts |
| 8 | **Deployment** | One container + Postgres beside PAIMANA on NIC Cloud; role-based access; CUF ingest API; open-weight LLM on-prem or none; pilot = one ministry's projects, one quarter, owner = IPMD monitoring officer; what we need from MoSPI: OCMS history and the full CUF. | Dockerfile; `backend/auth.py`; ingest module; `requirements.txt` pins |

**How the beats become one story.** Beat 1 poses the officer's question; beat 2 says why nobody has answered it correctly; beat 3 is the answer's shape; beat 4 is the evidence that the shape works; beat 5 says why that evidence is unusual; beat 6 says where the evidence stops; beat 7 says what the officer gets; beat 8 says how it reaches the officer's desk. Every beat carries a number from the same three artifacts, so the deck reads as one measurement told eight ways, not eight features.

**Mapping onto the fixed 2026 template (not a design — a placement):** Idea Title slide carries beats 1–3 (problem, insight, solution in the template's three prompts: solution / how it addresses the problem / uniqueness); Technical Approach carries 4 and the mechanism (censored AFT → conformal → queue), with the prototype link; Feasibility & Viability carries 6 and 8 (limits, risks, deployment beside PAIMANA); Impact & Benefits carries 7 with beat 4's numbers as the only figures on the slide; Research & References carries Ram Singh 2010, Flyvbjerg 2006, Wei 1992 (AFT), Romano et al. (conformal), McCrary 2008, NIC's PAIMANA article, PIB 25 Mar 2026, and our artifact links.

---

## 3. Hooks

**Emotional hook.** An IPMD officer opens the April report: 1,981 projects, 80 pages, ₹5.65 lakh crore already added to original costs, and one question the report cannot answer — *which twenty should I escalate this month?* Every rupee of revision was recorded faithfully, after the fact.

**Intellectual hook.** "Ninety-four percent of your portfolio has not finished. That is not missing data — it is censored data, and the difference decides whether a forecast is a forecast or a guess." Followed by the second turn: "And we did not assume AI would help; we measured it against your own sector averages. Here is where it did, and where it did not."

**Technical hook.** The calibration line: an uncalibrated model covered 50.8% of held-out completions; conformal calibration on the model's own median lifted that to 79.0% at a nominal 85%, and cut the median error from 100 months to 22.7. Then: chronological split, twelve leakage columns named, three baselines — the table a statistician wants to see and never gets.

**The "wow" moment.** The ablation table, read aloud in one breath: *"Gradient boosting beats OLS by 2.6% on cost overrun and loses to it by 33% on time overrun; ten external variables we tested made both worse; satellite change explains none of the variance in reported progress. That is the honest ceiling of this data, and it is why the rest of our numbers deserve your trust."* No other deck in the pile will say AI helped less than expected — and prove where it helped.

**Strongest proof point.** 79.0% measured coverage on 596 held-out projects (50.8% uncalibrated), P50 error 100 → 22.7 months, with the earlier 93.3% figure withdrawn in writing. It is a result, a method, and a character reference in one number.

**Strongest visual concept.** One real project's completion fan: the agency's single promised date as a thin vertical line, the rebaselined dates behind it as faded ticks, and our P10–P95 window as a band with the P50 marked — the whole argument in one picture (promised date vs calibrated window vs reset history). The Censored-Portfolio Ladder (competitor document §7) is the differentiation visual; the fan is the *mechanism* visual, and a judge remembers mechanisms.

**The one thing the judge should remember.** *They measured instead of claimed.* On a PS written by a statistics division, the team that reports the inconvenient result is the team whose convenient results can be believed.

---

## 4. If the judge remembers only one sentence about our team, it should be:

> **"The team that told MoSPI, with numbers it can rerun, exactly where AI helps on PAIMANA data and where it does not — and gave every unfinished project a completion window with measured coverage instead of a promised date."**

---

## 5. Guard-rails for the deck phase (so the story stays truthful)

- No number appears that is not in beat 4's three artifacts or on an official page; no "₹X lakh crore protected", no users, no time saved, no adoption.
- The words "sovereign", "zero-hallucination", "Cabinet Secretariat", "sub-meter", "verified linkages", "Tarjan" do not appear.
- VITTA-VYUHA, satellite swipe, NAGRIK, election scoring, Merkle cryptography: at most one line each, under future scope or provenance, never as beats.
- The four limits in beat 6 are stated before any impact claim.
- The prototype link must open cold in under five seconds on the day the deck is submitted; a dated screenshot sits beside it.
- Numbers in the deck reconcile to the PS's April 2026 figures (1,981 / ₹37.13 / ₹42.78 / ₹20.36) with our corpus counts (2,207 rows, 2,103 usable) explained in one clause.

---


# Part 5 — Six-slide blueprint and compliance verification

*Source: `SIH26103_DECK_BLUEPRINT.md` · 16 Sep 2026*

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

---


# Part 6 — Hostile panel review, scores and fixes

*Source: `SIH26103_JUDGE_PANEL_REVIEW.md` · 16 Sep 2026*

*16 September 2026. Five judges, one instruction: reject this team if you can. Reviewed against `SIH26103_FINAL_DECK_CONTENT.md` v1, the artifacts, and the repository as of today. Answers marked* **truthful** *are the strongest answer that is actually true — several concede the point.*

Legend for "Does the deck answer it?": **Yes** · **Partly** · **No**. "Modify deck?": **Yes** (copy change specified in §4) · **No** (speaker answer suffices) · **Precondition** (needs work before submission, not copy).

---

## 1. The panel's questions

### Judge 1 — Domain expert (infrastructure monitoring, MoSPI/IPMD practice)

**Q1. Your "coverage 79%" is coverage of the *official revised target date*. Agencies revise those dates repeatedly and optimistically. You have calibrated against a promise, not a completion. What does 79% mean about when a project actually finishes?**
- *Why:* This is the flagship number; a domain reader knows revised dates are themselves the problem.
- *Answered:* Partly — the caption says "official targets covered", but slide 5 says "median date error" without saying error against what.
- *Weakness:* The corpus has no actual completion dates for ongoing projects (115 completions in 2,103). Our window is calibrated to the only future label that exists. Coverage of real completion is unknown and almost certainly lower.
- *Truthful answer:* "It means the window brackets the Ministry's own revised target 79% of the time on held-out projects, where the raw model did so 51% of the time. Real completion dates exist for only 115 projects; with OCMS history we recalibrate against completions. We say 'official target' on every slide for exactly this reason — and note the model is not echoing targets: for Kurnool-IV it places the median 14 months after the revised date."
- *Modify deck:* **Yes** — make the label explicit on slides 3 and 5 and add the one-clause reason.

**Q2. The drivers of Indian cost overruns are land acquisition, forest/environment clearance, contractor disputes and design change. None is in your six CUF features. What can cost, planned months, progress, year, sector and agency possibly learn?**
- *Why:* Ram Singh (2010) — which we cite — says exactly this.
- *Answered:* Partly — row (c) says externals did not help; it does not say what *would*.
- *Weakness:* Our dimension-(c) answer is only negative. The PS asks for an assessment of variables "not presently captured in the CUF"; we tested ten macro/derived variables, not the ones the literature names.
- *Truthful answer:* "Very little — which is our finding: R² is negative on the held-out year and boosting beats OLS by 2.6%. The fields the literature identifies as causes — land handed over, clearance dates, contract disputes, milestone dates — are not in the public CUF and we could not test them. That is our request to the Ministry, not a claim that they would work."
- *Modify deck:* **Yes** — add the constructive half of (c) on slide 2 and in the "needed from MoSPI" box.

**Q3. Kurnool-IV is a 2025 transmission project, 25% built. Transmission has essentially no completions in your data. Isn't the band on slide 2 just the national prior times progress — a picture of your assumptions, not of this project?**
- *Why:* The example is the deck's emotional centre; if it is a prior, the centre is hollow.
- *Answered:* No.
- *Weakness:* `sector_detail` marks Transmission & Distribution "prior-dominated". The project-specific content is: sanction date, planned 24 months, 25% in 15 months, agency, sector shrinkage toward the national 3.31× — and the conformal multipliers.
- *Truthful answer:* "The sector effect is prior-dominated and the artifact says so. What is project-specific is the pace — 25% in 15 months against a 24-month plan — blended with the survival prior, then calibrated. The band is what a defensible forecast looks like when the sector has few completions: wide, and honest about it. A narrower band needs the monthly panel."
- *Modify deck:* **Yes** — add a one-line "why" under the fan (pace vs plan; sector prior).

**Q4. What is your cost-overrun target exactly? Revised cost at the June 2026 snapshot? Then a project not yet revised is labelled 0% and your model learns who has been revised, not who will overrun.**
- *Why:* Interim labels are the classic flaw in overrun studies.
- *Answered:* No — the deck says "cost-overrun forecast".
- *Weakness:* Target is revised-cost overrun at snapshot for projects ≥ 5 years old (maturity gate); still interim.
- *Truthful answer:* "Revised-cost overrun at the snapshot, restricted to projects at least five years past sanction so most revisions have occurred. It is interim, not final; final needs OCMS history. That is why we call the boosting a benchmark exercise, not the innovation."
- *Modify deck:* **Yes** — label the target on slide 3.

**Q5. Did you read the April 2026 Project Monitoring Report the PS points to, and does your register reconcile with it? You say 2,207 and ₹47 lakh crore elsewhere; the report says 1,981 and ₹42.78.**
- *Why:* The PS author named that document.
- *Answered:* Partly — slide 2 shows both number sets but not the reconciliation.
- *Weakness:* Our register is a June 2026 portal snapshot including 164 completed projects and projects the April report excludes; we have not published a reconciliation table.
- *Truthful answer:* "Our register is the portal's public list as of June 2026 — 2,207 rows including 164 completed; the April report's 1,981 are ongoing only. Totals differ by scope and month; the reconciliation is in the repository." (It must be, before submission.)
- *Modify deck:* **Yes** — one clause on the slide-2 strip. **Precondition** — write the reconciliation.

**Q6. Have you spoken to a single IPMD officer? Who told you the annex is what they need?**
- *Why:* User validation.
- *Answered:* No.
- *Weakness:* No user contact. The "officer strip" is our assumption.
- *Truthful answer:* "No. We built to the PS text and the monthly report's structure. The pilot's first month is the user test; we have not claimed adoption or time saved anywhere."
- *Modify deck:* **No** — do not add claims; the honesty is the answer.

**Q7. Hindi: who validated it? CSTT terminology?**
- *Answered:* No. *Weakness:* Template-generated Hindi, unreviewed. *Truthful answer:* "Template sentences; not yet reviewed by an official translator — listed as a pilot task." *Modify deck:* **Yes** — "English / Hindi (templates, pending official review)".

### Judge 2 — Senior technical architect

**Q8. PAIMANA is .NET, MS SQL and SSRS on NIC Cloud. You are proposing that NIC maintain a Python/FastAPI/React/Postgres stack beside it. Why should they?**
- *Why:* Maintenance is the real cost.
- *Answered:* Partly.
- *Weakness:* No integration story at the output layer.
- *Truthful answer:* "Because the PS asks for open-source, and the annex is one container whose outputs are plain tables — queue, windows, drivers — that SSRS can read directly from Postgres or a nightly CSV. NIC does not need to touch the React UI at all for the report use-case."
- *Modify deck:* **Yes** — one label on the slide-4 diagram: "outputs as tables SSRS can read".

**Q9. Your slide says "optional open-weight LLM, run locally". Your live demo calls Groq in the United States. Which is it?**
- *Why:* A demo that contradicts a slide is a credibility failure.
- *Answered:* No.
- *Weakness:* Default config uses `api.groq.com` with `openai/gpt-oss-120b`; offline deterministic mode exists but is not the demo default.
- *Truthful answer:* "The demo runs the hosted API on public data only, with a fact-bound prompt; without a key the same code runs in deterministic mode with no external call. The pilot design is local or none. The slide should say so."
- *Modify deck:* **Yes** — "demo: hosted API on public data; pilot: local model or none".

**Q10. Split conformal guarantees coverage by construction. Yours is 79% at nominal 85%. Why is a guarantee missing six points?**
- *Why:* A technical judge knows the theorem.
- *Answered:* Partly (nominal shown).
- *Weakness:* Post-processing (floors, monotone rearrangement, overdue exclusion) and calibration/test shift break exchangeability.
- *Truthful answer:* "The guarantee is marginal and assumes exchangeability. We measure end-to-end — after the 'not before today' floor and monotone rearrangement, on the population with targets ahead — so the six points are the price of those steps and of shift between calibration and test. We publish the measured number, not the nominal."
- *Modify deck:* **No** — speaker answer; the slide already shows both.

**Q11. "Byte-identical across machines" — which machines?**
- *Answered:* Partly. *Truthful:* "Windows/CSV and Linux/Postgres, after pinning pandas 2.3.3 and fixing row-order dependence; the test shuffles the corpus and asserts identical edges and scores." *Modify deck:* **No**.

**Q12. Where is the time-series? A monthly early-warning system with one snapshot is a ranking, not a warning.**
- *Answered:* Yes (risk row 1). *Weakness:* Real. *Truthful:* "Correct. The archive exists on the report page; ingest is the first pilot task; the protocol does not change." *Modify deck:* **No** — already conceded first.

**Q13. Single container, no HA. What happens if it dies on report day?**
- *Answered:* No. *Truthful:* "It is a monthly batch, idempotent, stateless except Postgres; rerun it. HA is unnecessary for a monthly annex." *Modify deck:* **No**.

**Q14. What is the end-to-end latency to regenerate the annex for 2,000 projects, and for 20 years × 12 months of OCMS?**
- *Answered:* No. *Weakness:* Unmeasured beyond dev-machine claims; conformal and AFT are cheap; the queue is O(n). *Truthful:* "Minutes for the 2,207-row snapshot on a laptop; the models are linear in rows; the untested part is the monthly panel, where features become per-project time series — still small data." *Modify deck:* **No**.

**Q15. Security: seeded weak demo passwords, no SSO, no MFA. Would NIC accept it?**
- *Answered:* Partly (roles). *Truthful:* "As a prototype, no — and the code says so in its own docstring. The pilot uses Parichay/NIC SSO; role checks are already server-side; the Postgres path has append-only triggers." *Modify deck:* **Yes** — "roles server-side; SSO via NIC in pilot".

### Judge 3 — Government / industry evaluator

**Q16. Which of my nine outcomes do you deliver, and where is the evidence for each?**
- *Answered:* Partly — the letters are listed; evidence is not per letter.
- *Weakness:* No engine-to-outcome map with pointers in the deck (it exists in code docstrings).
- *Truthful answer:* "a, b: slide 3 branches; c, d: the queue; e: sector/agency benchmarking in the prototype; g: the dashboard; h: the fact-bound assistant; i: the container and the claims ledger; f partially — drivers, not causes."
- *Modify deck:* **No** for the six slides (space); **Precondition** — a one-page outcome map in the repository README for the mentor rounds.

**Q17. You scraped our portal. Under what authority?**
- *Why:* Government evaluators ask about data handling first.
- *Answered:* No.
- *Weakness:* Public, unauthenticated endpoints; no written permission; no personal data.
- *Truthful answer:* "Public, unauthenticated pages and endpoints of the portal that the PS itself points to; project-level data, no personal data; nothing redistributed beyond the derived artifacts. In the pilot the source is the CUF export you provide."
- *Modify deck:* **Yes** — one word on the slide-2 strip: "public register".

**Q18. Who is accountable when your queue puts a project at the top and the officer escalates it wrongly?**
- *Answered:* Partly. *Truthful:* "The officer; the queue is triage with a written reason per rank and Ministry-set weights, not a decision. We refuse fraud verdicts for the same reason." *Modify deck:* **No**.

**Q19. What does the pilot cost, and who runs it after your team graduates?**
- *Answered:* Partly. *Weakness:* No number. *Truthful:* "One NIC Cloud VM, no licences; the container and the regeneration scripts are the handover; the weights and thresholds are configuration, not code. We have not costed NIC staff time and will not invent it." *Modify deck:* **No**.

**Q20. Your problem statement title says 'web-based integrated project-monitoring platform'. You are presenting a statistics annex. Where is the platform?**
- *Answered:* Partly (two stills). *Truthful:* "The prototype is a full web platform — about twenty screens — and the link is on slide 2. We lead with the analytics because the PS body asks for predictive and prescriptive capability; the platform is the delivery vehicle." *Modify deck:* **Yes** — "20-screen prototype" in the slide-4 'Built' line.

**Q21. NIC's own roadmap already says 'AI-driven forecasting'. Why do we need students?**
- *Answered:* Partly. *Truthful:* "Because the roadmap names the feature; the PS asks whether it works, on which fields, and against which baseline. That evaluation is what we deliver, in the open, with negative results NIC's vendor will not volunteer." *Modify deck:* **No**.

### Judge 4 — Innovation / research expert

**Q22. Log-logistic AFT plus split conformal is a textbook combination. What is the research contribution?**
- *Answered:* Partly. *Truthful:* "We claim no new method. The contribution is the measured result on this dataset: on public CUF fields boosting adds 2.6% over OLS on cost and nothing on time; calibration under 94% censoring is where forecast quality comes from; imagery is uninformative; no bunching at the 20% cap. Findings, not algorithms." *Modify deck:* **No** — slide 2 column 3 says "measured, not assumed".

**Q23. Your time result: OLS MAE 7.9 months versus boosting 10.5. An OLS that accurate on slip is suspicious. Isn't it exploiting the calendar identity — slip = revised − original, and original is recoverable from sanction year plus planned months?**
- *Why:* An expert reads `calendar_identity: applies: True`.
- *Answered:* No.
- *Weakness:* Both models on `slip_months` are compromised by the identity; that is why neither is deployed for time. The slide's "−33% on time" is true but its cause is leakage through the calendar, not a superiority of OLS.
- *Truthful answer:* "Yes. `slip_months` is partly recoverable from the calendar, which is why we deploy neither model for time and rest time forecasts on the survival model instead. The row on slide 2 should say 'not deployable' rather than imply OLS is good."
- *Modify deck:* **Yes** — reword row (b).

**Q24. External variables made the time model 145% worse. That is not 'externals do not help'; that is broken feature construction or leakage.**
- *Answered:* No.
- *Weakness:* Some externals (graph degree, Shapley criticality, EO change) are computed on the snapshot and shift between train and test years — they fail chronologically for that reason.
- *Truthful answer:* "Agreed: the honest statement is 'these ten externals, as we constructed them, do not generalise across time'. Several are snapshot-derived. We should say 'as constructed'."
- *Modify deck:* **Yes** — two words.

**Q25. Your flagship window has no conventional baseline. You benchmarked the cost model against sector mean and OLS; the window is only compared with its own uncalibrated version. Where is the reference-class interval?**
- *Why:* Dimension (b) applies to time as much as cost.
- *Answered:* No.
- *Weakness:* Real gap. A naive band — sector-specific P10–P95 of slip ratio applied to the original end date — is computable from the same calibration split and would either validate or embarrass the window.
- *Truthful answer:* "Not computed. It should be, and it is a day's work on the same split: sector slip quantiles from the calibration half, coverage on the test half. We will report it whichever way it comes out."
- *Modify deck:* **Precondition** — compute before submission; if it is computed, add it to the slide-3 time branch as a third bar; if not, say nothing and expect this question.

**Q26. Withdrawn 93% claim, withdrawn p < 0.001 — you have overclaimed before. Why is this deck different?**
- *Answered:* Partly (the withdrawal is stated on slide 2).
- *Weakness:* On slide 2 the sentence reads as a confession where a judge is forming a first impression.
- *Truthful answer:* "Because we found both ourselves, recorded them, and replaced them with regeneration scripts. The ledger is public; the withdrawn figures are in it."
- *Modify deck:* **Yes** — move the withdrawal from slide 2 to the slide-6 Rerun box, where it reads as process.

**Q27. Two other teams have monthly panels and honest OLS-versus-boosting comparisons. What do you have that they do not, in one sentence?**
- *Answered:* Partly. *Truthful:* "Censoring handled, interval coverage measured, ablations on both targets, and every number regenerable — with the panel conceded as our gap." *Modify deck:* **No**.

### Judge 5 — Brutally skeptical competition judge

**Q28. Slide 2 has a chart, a number strip, three columns of eleven-point text and three links. It is a wall. What do I read first?**
- *Answered:* No.
- *Weakness:* ~150 words plus a full-width chart in the decisive slide; column 2's rows are long.
- *Truthful answer:* "The fan; then the three PS letters. The rest is trim-able."
- *Modify deck:* **Yes** — cut to ≤ 110 words; shorten rows; move the withdrawal line out.

**Q29. Your live link was dead when I tried it. Your video link is a placeholder. Why should I believe there is a prototype?**
- *Answered:* No.
- *Weakness:* Render free tier sleeps; no video recorded; stills not yet captured.
- *Truthful answer:* None that survives a dead link.
- *Modify deck:* **Precondition** — warm host or static fallback; record the video or delete the pill; dated stills.

**Q30. You admit ML barely beats OLS. Why would MoSPI shortlist a team whose AI does not work?**
- *Answered:* Partly. *Truthful:* "Because the PS asked whether it works and we are the only team that answered. The teams claiming 94% will not survive the first mentoring round; we will, because our numbers are the ones you get when you run the code." *Modify deck:* **No** — but reword row (b) so the *positive* finding (calibration) leads.

**Q31. Where is the impact? No rupees, no time saved, no users. Your impact slide is a model-metrics slide.**
- *Answered:* Partly. *Weakness:* True; nothing changes it before a pilot. *Truthful:* "Yes — because the PS defines success as prediction quality and early warning; the pilot measures the rest. We would rather show three honest numbers than one invented one." *Modify deck:* **No**.

**Q32. Your queue has never been tested. Why is it on the slide at all?**
- *Answered:* Yes (row 2). *Truthful:* "Because an officer needs a ranking, and a ranking with written reasons and Ministry-set weights is auditable even before its backtest. The backtest is scheduled." *Modify deck:* **No**.

**Q33. 140 tests here, 476 tests in your README, 1,197 links there, 1,345 here, 'sub-meter' in your scripts after your ledger refuses it. Which of you is telling the truth?**
- *Answered:* No. *Weakness:* Reconciliation not yet done. *Truthful:* Only "we fixed it" is acceptable. *Modify deck:* **Precondition** — reconcile before submission.

**Q34. Environmental — 'no claim'. Social — 'Hindi templates'. Economic — 'not claimed'. You have written an impact slide that claims nothing. Is that strategy or emptiness?**
- *Answered:* Partly. *Truthful:* "Strategy. Every figure on that slide has an n. The benefit of a monitoring tool is earlier intervention; its size is the pilot's first result, not our slide's." *Modify deck:* **No** — but lead the benefits list with governance (ranked, reasoned, contestable), which is the real benefit, rather than economics.

**Q35. Give me the one thing you do that PAIMANA does not, in ten words.**
- *Answered:* Yes. *Truthful:* "A calibrated completion window for every unfinished project, with measured coverage." *Modify deck:* **No**.

**Q36. If I ran your three commands and one number differed, what then?**
- *Answered:* Yes (slide 6). *Truthful:* "Then it is our defect and the deck is wrong; that is the standard we set." *Modify deck:* **No**.

---

## 2. Score — deck v1, before fixes

Scores are the panel's, out of 100, using the research-derived model (research §6a) mapped onto the eleven requested dimensions.

| Dimension | Score | Why the points were lost |
|---|---|---|
| Problem understanding | **78** | Owner's numbers used; IPMD named; but reconciliation absent, dimension (c) only negative, no officer contact |
| Innovation | **72** | Textbook methods; the finding is the novelty, and slide 2 buries it under a withdrawal line |
| Technical depth | **84** | Protocol drawn in; but target definitions (revised date, interim cost) unlabelled; no interval baseline; calendar-identity nuance hidden |
| Feasibility | **70** | Fits beside PAIMANA; but LLM contradiction between slide and demo, SSRS output not stated, security thin |
| Impact | **48** | Measured deltas only; no user, no pilot, no outcome test; honest, and still thin |
| Scalability | **62** | Trivially scalable at 2k rows; untested on the panel; nothing said about it |
| UX | **45** | Two stills and a strip; no user; Hindi unreviewed |
| Differentiation | **80** | Real and defensible; competitors with panels are not addressed on the slides |
| Presentation clarity | **66** | Slide 2 overloaded; slide 4 table dense; labels ambiguous on the flagship number |
| Memorability | **74** | The fan and the "measured, not assumed" line carry it |
| **Overall selection strength** | **70** | Shortlist-plausible on a small field; exposed on Q1, Q28, Q29, Q33 |

---

## 3. The five biggest reasons this deck might fail

1. **The flagship number is against the wrong-sounding label.** "79% coverage" and "100 → 22.7 months" are measured against the *official revised target*; slide 5 lets a reader think "outcomes". A statistician catches it, the number deflates, and everything after it is read with suspicion (Q1, Q4).
2. **Slide 2 is overloaded and carries a confession.** ~150 words, a chart, a strip, three columns and links; the withdrawn-93% line sits where the judge forms a first impression (Q26, Q28).
3. **Prototype credibility is currently zero.** The live host was unreachable on 16 Sep; the video pill is a placeholder; no dated stills exist; README and code contradict the deck's counts (Q29, Q33).
4. **Dimension (c) is answered only negatively, and (b) on time is mis-explained.** "Externals didn't help" without saying what should be captured; "OLS beats boosting on time" without saying neither is deployable because of the calendar identity (Q2, Q23, Q24).
5. **The window has no conventional baseline, and the deck contradicts the demo on the LLM.** The cost model is benchmarked three ways; the time window only against itself (Q25). The slide says "run locally"; the demo calls a US API (Q9).

---

## 4. The fixes (applied to `SIH26103_FINAL_DECK_CONTENT.md` v2)

**Fix 1 — label the flagship correctly, everywhere.**
- Slide 3, time branch: `coverage of official revised targets 50.8% → 79.0%` · sub-label `nominal 85% · n = 596 · no completion dates exist for ongoing projects`.
- Slide 3, cost branch label: `MAE, % revised-cost overrun at snapshot · projects ≥ 5 yrs · n = 265`.
- Slide 5, pair 1 label: `official revised targets covered by the P10–P95 window`; pair 2: `P50 vs official revised target`; pair 3: `revised-cost overrun, MAE vs sector-average forecast`.
- Slide 4, "Needed from MoSPI": add `actual completion dates (OCMS) — to recalibrate against completions, not targets`.

**Fix 2 — slim slide 2 to ≤ 110 words; move the withdrawal; add the example's "why".**
- Column 1 (four lines): `Completion window P10–P95 — censored survival model, conformal-calibrated` · `Cost-overrun forecast — vs sector average and OLS, chronological split` · `Ranked queue — reason per project; weights Ministry-editable` · `Bilingual briefing — every sentence cites a hashed fact; offline; open-source`.
- Column 2 (three rows, shorter): `(a) models → survival, OLS, boosting; chronological test` · `(b) AI vs conventional → calibration is the gain: coverage 51% → 79%; boosting +2.6% on cost; time: neither ML nor OLS deployable` · `(c) CUF vs added variables → ten externals, as constructed, did not help; land, clearance and milestone fields are absent from the public CUF — our ask`. Footer: `Outcomes a b c d e g h i · f partial`.
- Column 3 (three lines): `Censored, not ignored — 94% unfinished, modelled as censored data` · `Measured, not assumed — ablations on both targets, inconvenient results included` · `Reproducible — every figure regenerates from a seeded script (see slide 6)`.
- Fan caption, second line: `Why: 25% built in 15 months against a 24-month plan; sector prior-dominated — a wide, honest band`.
- Strip: `public register, Jun 2026 (2,207 rows incl. 164 completed)`.
- Withdrawal line moves to the slide-6 Rerun box: `Corrections on record: 93.3% coverage and p < 0.001 withdrawn — see CLAIMS.md`.

**Fix 3 — prototype credibility (preconditions, non-negotiable).**
- Keep the API awake (paid tier for the submission window, or a warm-up ping) *and* ship a static fallback build with pre-computed JSON so the UI opens with no API.
- Record the 2-minute video or delete the pill; capture three dated stills at 1920 × 1080.
- Reconcile README/CLAIMS/scripts (140 checks; 1,345 edges; remove "sub-meter", "Tarjan", the latency badge).
- Publish `docs/RECONCILIATION_APRIL_2026.md`: 2,207 vs 1,981 and ₹ totals by scope and month.

**Fix 4 — (c) constructive; (b) on time explained.**
- Slide 2 row (c) as in Fix 2; slide 3 "Honest ceiling" line: `external variables, as constructed, −3.8% on cost and worse on time · slip-month models not deployed (calendar identity); time forecasts rest on the survival model`.
- Slide 4 "Needed from MoSPI": `land-acquisition status · clearance dates · milestone dates · monthly expenditure` — labelled `untested by us; named by the literature`.

**Fix 5 — interval baseline and LLM honesty.**
- **Precondition:** compute the reference-class interval baseline on the same split (sector-specific P10/P95 slip-ratio quantiles from the 596 calibration projects applied to each test project's original end date; measure coverage of the official revised target on the 596 test projects). If computed, add it as a third bar on the slide-3 time branch (`reference-class band · conformal band`) and to slide 5 pair 1. If it embarrasses the window, report it anyway and explain.
- Slide 3 technologies line: `optional open-weight LLM — demo: hosted API on public data only; pilot: local model or none`.
- Slide 4 feasibility: `roles enforced server-side; SSO via NIC in the pilot` and `outputs as plain tables SSRS can read`; "Built" line: `20-screen prototype`.

---

## 5. Score — deck v2, after fixes

Assumes the copy fixes are applied and the preconditions are met (host awake, video or no pill, reconciliation done). The interval baseline is *not* assumed computed — scores below hold either way; if it is computed and favourable, add ~3 to technical depth and differentiation.

| Dimension | v1 | v2 | What changed |
|---|---|---|---|
| Problem understanding | 78 | **85** | Reconciliation clause; (c) constructive; targets labelled in the owner's terms |
| Innovation | 72 | **75** | The finding now leads row (b); withdrawal no longer competes with it |
| Technical depth | 84 | **87** | Target definitions explicit; calendar identity acknowledged; "as constructed" |
| Feasibility | 70 | **76** | LLM contradiction removed; SSRS tables; SSO line; 20 screens |
| Impact | 48 | **54** | Labels honest; governance benefit leads; still no user or pilot |
| Scalability | 62 | **64** | Unchanged in substance |
| UX | 45 | **50** | Hindi honestly labelled; three dated stills |
| Differentiation | 80 | **84** | Ask for CUF fields is unique; "measured, not assumed" leads |
| Presentation clarity | 66 | **82** | Slide 2 ≤ 110 words; rows shortened; withdrawal moved |
| Memorability | 74 | **80** | The fan with its "why"; the ten-word answer (Q35) |
| **Overall selection strength** | 70 | **78** | Shortlist-likely on a 10–40 entry field read by DIID statisticians; not immune to a rival with a monthly panel and equal honesty |

What no copy fix can move: impact (no users), UX (no user test), scalability (untested on the panel). Those are pilot outcomes, and the deck says so.

---

## 6. Against 500 serious teams, what exactly would make this stand out?

Not the UI — a dozen teams will have a cleaner one. Not "AI" — every deck has it. Not the eleven engines — they are gone from the deck.

Three things, in the order a DIID statistician would meet them:

1. **A real project on slide 2 with a calibrated band and a stated probability** — Kurnool-IV, not yet overdue, PAIMANA says September 2027, the band says November 2028 with a 22% chance of meeting the target — *with the reason written under it*. No other deck will show a forecast on a named project from the ministry's own register with a coverage number behind it.
2. **The inconvenient row.** "Boosting +2.6% on cost; time: neither ML nor OLS deployable; externals, as constructed, did not help; imagery uninformative; 20% bunching null." In a pile of 94-percents, the deck that reports the ceiling of the data is the one whose other numbers get believed — and it is the literal answer to the PS's dimension (b).
3. **Three commands.** A reference slide that says "run these and every number regenerates from seed 42, corrections on record" is a claim no other student team makes and the one claim a statistics ministry can verify before the finale.

Everything else in the deck exists to keep those three from being disbelieved: the owner's numbers on the strip, the leakage guard drawn into the pipeline, the four limits stated before impact, the "no claim" under environmental. If the host is awake and the numbers reconcile, this deck is shortlisted on evidence; if either fails, it is rejected on credibility — and it would deserve to be, because credibility is the whole pitch.

---


# Part 7 — Final locked deck specification

*Source: `SIH26103_DECK_FINAL_LOCKED.md` · 16 Sep 2026*

*16 September 2026. Supersedes `SIH26103_FINAL_DECK_CONTENT.md` (v1, v2). This is the competition deck specification: what goes on each of the six template slides, exactly, and nothing else. Every number was re-read from the repository artifacts today; the slide-2 example is live engine output (`forecast_project("617185")`, as-of 30 Jun 2026).*

---

## 0. Optimisation log — what changed in this pass, and why

Ten questions were put to every slide (3-second message · hierarchy · unnecessary content · unsupported claims · credible technique · obvious innovation · obvious advantage · measurable impact · visually distinct · memorable). Changes that survived:

| Slide | Removed | Strengthened |
|---|---|---|
| 1 | — | Nothing added; the idea-title line is the only non-template element |
| 2 | Video pill unless a video exists on export day; the duplicated "annex" phrasing; long row (b) | Fan enlarged to the full width; "22% chance" made the boldest text after the sub-heading; row (b) now leads with calibration; strip shortened to one reconciled line |
| 3 | "ML vs OLS +2.6%" as a headline number (it is true, and it is the weakest way to say the true thing) | Second accent number is now **−12% vs sector average**, with the OLS bar drawn beside it so the 2.6% gap is visible, not hidden; the "Honest ceiling" line states it in words |
| 4 | "Ministry-editable weights" from the sustainability bullet (already in risk row 2); the optional admin still | Feasibility bullets tightened; risk table rows cut to one line each; refusal line kept — it is the most remembered line on the slide |
| 5 | Nothing structural | Pair labels state the target ("official revised target") so the flagship number cannot be misread; governance benefit leads |
| 6 | Nothing | Corrections-on-record line kept in the Rerun box; reference "why" clauses trimmed to six words |

**Rules that held across the pass.** One accent colour, used only where "ours / measured" is shown: the idea-title line (S1), the band and the 22% (S2), the two numbers (S3), the annex box (S4), the "annex" bars (S5), the Rerun box border (S6). No icons, no logos, no stock imagery, no gradients, no animation. Minimum 11 pt. Every figure carries its n or its date. Nothing on any slide is a projection.

---

## 1. Global specification

- **Template:** official SIH 2026 file (`sih.gov.in/letters/2026/SIH2026-IDEA-Presentation-Format.pptx`, SHA-256 verified 16 Sep 2026). Six slides including the title; section titles and pointer headings verbatim; instruction slide deleted; 16:9; export to PDF.
- **Type:** section titles as in the template; pointer headings 14 pt bold; body 12 pt (11 pt minimum in tables and captions); argument numbers 28 pt. Segoe UI or Calibri (embedding-safe). Consolas only for the slide-2 strip and the slide-6 Rerun box.
- **Colour:** ink `#16202A` · secondary `#3C4A57` · today/baseline grey `#8A97A4` · accent `#1F5F73` · band fill `#DDE9EE`. Nothing else.
- **Figures:** vector-drawn in the slide tool; prototype stills at 1920 × 1080 with the capture date printed in the corner.
- **Word budget (on-slide, excluding fixed headings):** S2 ≤ 105 · S3 ≤ 115 · S4 ≤ 150 · S5 ≤ 100 · S6 ≤ 150.

**Portal fields (entered separately on sih.gov.in; read before the PDF opens).**
- *Idea title:* `PRAKALP-DRISHTI — calibrated early warning for PAIMANA`
- *Idea description:* `A monthly early-warning annex to IPMD's Project Monitoring Report, computed from the CUF fields PAIMANA already collects. For every ongoing project it gives a calibrated completion window (P10–P95) from a right-censored survival model, a cost-overrun forecast benchmarked against sector averages and OLS on a chronological split, and a ranked intervention queue with the reason behind each rank. We measured the PS's own questions instead of assuming them: on 265 held-out projects gradient boosting beats the sector-average forecast by 12% and OLS by 2.6% on cost overrun, and no regression model was deployable for time overrun; ten external variables, as constructed, did not help; calibration is where the gain is — the P10–P95 window covers 79% of held-out official revised targets where the raw model covered 51%, with median error down from 100 to 23 months. Open-source, offline-capable, role-based; every figure regenerates from a seeded script. Working prototype: https://prakalp-drishti.vercel.app`

---

## SLIDE 1 — TITLE PAGE

**1. Slide title.** `TITLE PAGE` (template).

**2. Exact copy.**
```
SMART INDIA HACKATHON 2026
Problem Statement ID – SIH26103
Problem Statement Title – Use case on web-based integrated project-monitoring platform
Theme – Smart Automation
PS Category – Software
Team ID – <as registered>
Team Name – <exactly as registered on portal>

PRAKALP-DRISHTI — calibrated early warning for PAIMANA
```

**3. Visual composition.** Template layout untouched. The idea-title line under the field block, 20 pt, accent colour, one line. Nothing else — no image, no logos, no institute name.

**4. Diagrams.** None. **5. Charts.** None.

**6. Sources.** PS ID, title, theme, category from `sih.gov.in/sih2026PS`.

**7. Speaker narrative (finale only).** "Problem statement 26103 — MoSPI's Data Informatics and Innovation Division, for the Infrastructure and Project Monitoring Division. Our idea in six words: calibrated early warning for PAIMANA. Everything that follows was measured on the ministry's own public register."

**8. Judge takeaway.** This is the deck whose idea title I just read on the portal: early warning for PAIMANA.

---

## SLIDE 2 — IDEA TITLE

**1. Slide title.** `IDEA TITLE` (template). Sub-heading, 18 pt: `A calibrated early-warning annex to PAIMANA's monthly report`

**2. Exact copy.**

Strip (mono, 11 pt, grey, one line):
```
PAIMANA · Apr 2026: 1,981 ongoing · ₹37.13 → ₹42.78 lakh crore · public register Jun 2026: 1,988 of 2,103 still running (2,207 rows incl. 164 completed)
```

Under the fan (11 pt; the "22%" in bold accent):
```
Project 617185 · Kurnool-IV REZ transmission (POWERGRID) · ₹5,550 Cr · 25% complete
PAIMANA holds the two dates. The band is what we add: 22% chance of meeting Sep 2027.
Why: 25% built in 15 months against a 24-month plan; sector has few completions — a wide, honest band.
```

*Detailed explanation of the proposed solution*
```
A monthly annex to IPMD's Project Monitoring Report, from CUF fields already collected:
• Completion window P10–P95 — censored survival model, conformal-calibrated
• Cost-overrun forecast — vs sector average and OLS, chronological split
• Ranked queue — a reason per project; weights set by the Ministry
• Bilingual briefing — every sentence cites a hashed fact; offline; open-source
```

*How it addresses the problem* (PS letters in accent)
```
(a) models              →  survival, OLS, boosting — tested chronologically
(b) AI vs conventional  →  calibration is the gain (window coverage 51 → 79%); boosting +2.6% on cost; time: no regression deployable
(c) CUF vs added fields →  ten externals, as constructed, did not help; land, clearance, milestone fields are absent from the public CUF — our ask
Outcomes a b c d e g h i · f partial
```

*Innovation and uniqueness of the solution*
```
Censored, not ignored — 94% unfinished, modelled as censored data
Measured, not assumed — ablations on both targets, inconvenient results included
Reproducible — every figure regenerates from a seeded script (slide 6)
```

Pills (bottom right, 11 pt): `Live ▸ prakalp-drishti.vercel.app` · `Code ▸ github.com/amey-bauchkar/Prakalp-Drishti-` · *(third pill `Video ▸ …` only if a recording exists on export day; otherwise omitted)*

≈ 105 words.

**3. Visual composition.** Zone A (top 40%): strip on one line; the fan spanning the full content width beneath it; three-line caption under the fan with "22%" as the largest text in the zone after the sub-heading. Zone B (middle 50%): three equal columns under the three template pointer headings; column 2 is a three-row table with the letters (a)(b)(c) in accent. Zone C (bottom 10%): pills, right-aligned; template footer. Eye-path: fan → 22% → (a)(b)(c) → column 3.

**4. Diagrams.** None beyond the chart.

**5. Chart — the completion fan (engine output, project 617185, as-of 30 Jun 2026).**
- Horizontal time axis Jan 2025 → Dec 2033, year ticks, 10 pt.
- Grey ticks with labels above the axis: `sanctioned 24 Mar 2025` · `original 23 Mar 2027` · `revised 30 Sep 2027 — PAIMANA's current date`.
- Band: fill `#DDE9EE` from **P10 7 Feb 2027** to **P95 19 Dec 2032**; darker band (accent at 35% opacity) from P10 to **P80 10 Nov 2031**; solid accent tick at **P50 15 Nov 2028** labelled `P50`.
- Label on the band, accent, 14 pt: `P(meet Sep 2027) = 0.22`.
- No legend box; labels sit on the marks. Height ≈ 2.2 in.

**6. Sources.** PS text (April 2026 figures) · `artifacts/aft_survival.json` (2,103 observations; 1,988 censored) · corpus CSV (2,207 rows; 164 at ≥ 100%) · `KaalChakraEngine.forecast_project("617185")` · `artifacts/conformal_calibration.json` (50.84 → 79.03) · `artifacts/overrun_models.json` (`ml_vs_conventional`, `cuf_vs_external_ablation`, `calendar_identity`) · Ram Singh (2010) for the fields named in row (c).

**7. Speaker narrative (≈ 90 s).** "PAIMANA tracks 1,981 projects worth ₹42.78 lakh crore and records every slip faithfully — after it happens. The reason nobody can say which project slips next is on the strip: 1,988 of the 2,103 projects in the public register are still running. Here is one. Kurnool-IV transmission — sanctioned March 2025, ₹5,550 crore, a quarter built, not yet late. PAIMANA holds two dates, March and September 2027. Our band puts the median at November 2028 and the chance of meeting September 2027 at 22 percent. That is early warning before the slip. Why? A quarter built in fifteen months against a two-year plan, in a sector with few completions — so the band is wide, and we say so. What we deliver is an annex to your monthly report: this window for every project, a cost forecast benchmarked against your own sector averages, a ranked queue with a reason per rank, and a bilingual briefing where every sentence cites a hashed fact. Your problem statement asked three questions; column two answers each with a measurement, including that boosting beats OLS by only 2.6 percent on cost and that no regression was deployable for time. We put that on the slide on purpose — the gain is calibration, and we can show it. Column three is what makes us different: censored data handled, results measured, everything reproducible."

**8. Judge takeaway.** They replace a promised date with a calibrated window on my own data, and they measured whether AI helps before claiming it.

---

## SLIDE 3 — TECHNICAL APPROACH

**1. Slide title.** `TECHNICAL APPROACH` (template). Sub-heading, 18 pt: `Censored → calibrated → benchmarked, on the CUF fields`

**2. Exact copy.**

*Technologies to be used* (one line, 11 pt):
```
Python · pandas · scipy (penalised MLE, HiGHS) · scikit-learn (boosting, OLS) · FastAPI · PostgreSQL · React · Docker · optional open-weight LLM — demo: hosted API on public data; pilot: local or none
```

*Methodology and process for implementation* — the pipeline diagram; three lines beneath, 11 pt:
```
Validation       chronological split · 12 leakage columns named · MAE vs naive, sector-mean and OLS · window coverage measured on 596 held-out projects
Reproducibility  fixed seeds · byte-identical artifacts across machines · 140 automated checks
Honest ceiling   boosting beats OLS by only 2.6% on cost · externals, as constructed, −3.8% on cost, worse on time · slip-month models not deployed (calendar identity) — time rests on the survival model
```

≈ 110 words excluding node labels.

**3. Visual composition.** Left 68%: pipeline, six stages left → right; stage 4 holds the two branches stacked; the two 28-pt accent numbers sit at the right end of each branch. Right 32%: two dated prototype stills stacked with one-line captions. The three text lines run under the diagram. Eye-path: 79.0% → −12% → leakage guard → split years → stills.

**4. Diagram — the pipeline (exact nodes; arrows labelled).**
1. `PAIMANA public register` — `2,207 rows · 25 CUF fields · 2,103 usable` → *rows* →
2. `Leakage guard` — `12 future-dated columns removed: RevisedCost, RevisedDate, Expenditure, COST_OVERRUN…` → *features: cost · planned months · progress · sanction year · sector · agency* →
3. `Chronological split` — `cost: train sanctions ≤ 2020 (792) · test 2020–21 (265)` / `window: calibrate 596 · test 596` → *time* ↗ / *cost* ↘
4a. **Time** — `Log-logistic AFT, right-censored · 115 events · 1,988 censored` → *raw median* → `Split-conformal on the median` → *P10 · P50 · P80 · P95* → **`79.0%`** (28 pt accent) with sub-label `official revised targets covered · 50.8% uncalibrated · nominal 85% · n = 596`
4b. **Cost** — three bars `sector mean 18.49` (grey) · `OLS 16.67` (grey) · `boosting 16.24` (accent), axis label `MAE, % revised-cost overrun at snapshot · projects ≥ 5 yrs · n = 265` → **`−12%`** (28 pt accent) with sub-label `vs the sector-average forecast · −2.6% vs OLS`
   → both branches → *scores + drivers* →
5. `Risk queue` — `weights set by the Ministry · reason per project` → *facts (hashed)* →
6. `Briefing EN / HI` → *monthly* → `PAIMANA annex`
Hierarchy: stages 1–3, 5–6 grey outline; stage 4 branches ink outline; only the two numbers and the boosting bar in accent. If the reference-class interval baseline is computed before export (pre-flight item 9), it is drawn as a third bar in 4a beside `uncalibrated` and `conformal`; otherwise 4a shows the number and its sub-label only.

**5. Chart.** The three bars in 4b: 18.49 / 16.67 / 16.24, one scale from 0, grey-grey-accent, values printed above the bars.

**6. Sources.** `artifacts/overrun_models.json` (`leakage_excluded_columns`, `cuf_features`, `train_year_range`, `test_year_range`, `n_train` 792, `n_test` 265, `cuf_only` MAEs, `ml_vs_conventional`, `cuf_vs_external_ablation`, `slip_months.deployable = false`, `calendar_identity`) · `artifacts/conformal_calibration.json` (`uncalibrated_coverage_on_test` 0.5084, `empirical_coverage_on_test` 0.7903, `n_calibration` 596, `n_test` 596, `target` = official revised date) · `artifacts/aft_survival.json` · `CLAIMS.md` (140 checks) · `tests/test_engine_precision.py` (shuffled-corpus invariance).

**Stills.** (i) Early-warning queue — ranked list with band, priority and reason chips visible; caption `Early-warning queue — a reason per rank · prototype, <date>`. (ii) Project page for 617185 — fan and cited facts; caption `Project 617185 — window and cited facts · prototype, <date>`.

**7. Speaker narrative (≈ 90 s).** "Left to right. The public register: 2,207 rows, 25 CUF fields. First we remove twelve columns that only exist after the outcome — revised cost, revised date, expenditure — because a model that sees them is reading, not predicting. Then we split by time: train on sanctions up to 2020, test on 2020 to 2021. Two branches. Time: a log-logistic survival model that treats the 1,988 unfinished projects as censored, then conformal calibration on the model's own median. That gives the first number: the window covered 51 percent of held-out official revised targets before calibration and 79 after, against a nominal 85 — we show the gap, and we say 'revised targets' because actual completion dates exist for only 115 projects. Cost: sector mean, OLS, boosting on the same 265 projects — 18.5, 16.7, 16.2. Twelve percent better than the sector average the ministry effectively uses; only 2.6 percent better than OLS, which is why the regressor is not the innovation — the calibration is. Both branches feed a queue with Ministry-set weights and a reason per project, and a bilingual briefing where every sentence cites a hashed fact. On the right, the prototype: the queue and the project page from slide two. Everything regenerates from a seed, byte-identical on any machine."

**8. Judge takeaway.** Chronological, leakage-named, censoring-aware, coverage-measured, three baselines — this is how I would have evaluated it, and it is running.

---

## SLIDE 4 — FEASIBILITY AND VIABILITY

**1. Slide title.** `FEASIBILITY AND VIABILITY` (template). Sub-heading, 18 pt: `Fits beside PAIMANA as it is — four limits, stated first`

**2. Exact copy.**

*Analysis of the feasibility of the idea* (left column, 11 pt):
```
• Built — 20-screen working prototype · ~93 API endpoints · 140 automated checks · Docker image · pinned open-source stack
• On the owner's roadmap — NIC's PAIMANA write-up names "AI-driven forecasting… to predict time and cost overruns" as the next step
• Pilot — one ministry's projects, one quarter · owner: IPMD monitoring officer · output: an annex to the monthly report
• Sustainable — no licences, no external API, one NIC Cloud VM · outputs as plain tables SSRS reads · roles server-side, SSO via NIC in the pilot
```

*Potential challenges and risks* → *Strategies for overcoming these challenges* (right, four rows, 11 pt):
```
1  One snapshot, no monthly panel yet; windows are wide (mean 101 months)   →  ingest the Monthly Flash Report archive; add month-over-month features; same protocol
2  Queue weights are declared policy, not yet outcome-validated             →  cross-sectional backtest now; temporal backtest on OCMS history; Ministry sets weights
3  Cost model tested on sanctions ≤ 2021; 55% of the portfolio is 2021–24   →  young projects fall back to the sector prior, flagged "prior-dominated", never scored safe
4  Self-reported inputs; missing fields                                      →  validation scanner; missing signals shown as "not reported", never silently zero
```

Bottom line, 11 pt, grey:
```
What we refuse to claim: sub-metre satellite verification · fraud verdicts — the 20% CCEA bunching test returned p = 0.68 and we report it as null
```

≈ 150 words.

**3. Visual composition.** Top 40%: the deployment diagram across the full width. Bottom 60%: left column 40% (feasibility bullets), right column 60% (risk table); refusal line under both. Eye-path: small accent box beside the large grey box → risk row 1 → refusal line.

**4. Diagram — deployment beside PAIMANA (exact nodes).**
- Large grey box, left: `PAIMANA` — `NIC Cloud · MS SQL · SSRS dashboards · IPMP API feed (64% of projects auto-updated)`.
- Arrow → labelled `monthly CUF export / REST`.
- Small accent-outlined box, right: `Annex — one container (FastAPI + models) + PostgreSQL` — `roles: viewer / analyst / admin · no external calls · all open-source`.
- Three arrows out, labelled `queue` · `windows + drivers` · `briefing EN / HI`, with the small label `plain tables — SSRS-readable`, converging on a grey box `Project Monitoring Report · line-ministry dashboards`.
- Dashed box beneath: `Needed from MoSPI: OCMS history incl. actual completion dates (to recalibrate against completions, not targets) · monthly archive · CUF fields the literature names — land-acquisition status, clearance dates, milestone dates, monthly expenditure (untested by us)`.
Hierarchy: PAIMANA box at least 2.5× the annex box; the annex is the only accent element.

**5. Charts.** None.

**6. Sources.** NIC Informatics, "PAIMANA Portal", Oct 2025 (stack; Way Forward) · PIB Release ID 2244898, 25 Mar 2026 (IPMP integration; 64%) · `Dockerfile`, `requirements.txt`, `backend/auth.py`, `modules/ingest/` · `CLAIMS.md` §2 (declared weights), §3 (refusals), §4b (p = 0.68) · `artifacts/conformal_calibration.json` (`mean_band_width_months` 100.86) · corpus sanction years (2021–24: 1,208 of 2,207) · `artifacts/aft_survival.json` (`sector_detail` evidence flags).

**7. Speaker narrative (≈ 80 s).** "PAIMANA runs on NIC Cloud with MS SQL and SSRS and takes a monthly CUF feed. We sit beside it as one container and one database, take the export, and return three things as plain tables SSRS can read — the queue, the windows with drivers, the briefing. No licences, no external API, roles built in, NIC's SSO in the pilot. The pilot is one ministry, one quarter, owned by an IPMD monitoring officer. Now the four things we cannot do yet, before you ask. One: we have a snapshot, not a monthly panel, so the windows are wide — a hundred months on average; the Flash Report archive fixes that and the protocol does not change. Two: the queue weights are declared policy, not fitted; we backtest, you set them. Three: the cost model was tested on projects sanctioned up to 2021; for the younger half of the portfolio it falls back to the sector prior and says so. Four: inputs are self-reported; missing is shown as missing, never as safe. And two refusals: no sub-metre satellite claims, and no fraud verdicts — the bunching test at the twenty-percent cap came back null and we report it as null."

**8. Judge takeaway.** It fits beside PAIMANA without touching it, runs on what NIC already has, and they told me what it cannot do yet.

---

## SLIDE 5 — IMPACT AND BENEFITS

**1. Slide title.** `IMPACT AND BENEFITS` (template). Sub-heading, 18 pt: `From description to intervention — measured, not projected`

**2. Exact copy.**

Three pairs (28 pt numbers; 10 pt labels beneath):
```
50.8% → 79.0%      official revised targets covered by the P10–P95 window · nominal 85% · n = 596
100 → 22.7 months  median error of P50 vs official revised target · n = 596
18.49 → 16.24%     revised-cost overrun MAE, sector-average forecast → ours · OLS 16.67 · n = 265
```

*Potential impact on the target audience* (11 pt):
```
• IPMD monitoring officers — which projects to escalate this month, and why: computed, not compiled
• Line ministries / PMG cells — a calibrated window and a driver list per project, instead of a promised date
• DIID statisticians — every number reproducible; models, baselines and limits documented
```

*Benefits of the solution* (11 pt):
```
Governance — ranked, reasoned, contestable; audit trail per figure
Economic — earlier intervention on the ₹42.78 lakh crore portfolio; the size of any saving is not claimed — the pilot measures it
Social — English / Hindi briefings (Hindi templates, pending official review); plain-language reasons
Environmental — no claim
```

≈ 100 words.

**3. Visual composition.** Top 50%: three before/after bar pairs side by side, each on its own scale; "today" bars grey, "annex" bars accent; the number pair above each in 28 pt; label line beneath in 10 pt grey; a dashed line at 85% on pair 1 labelled `nominal`; a thin grey marker at 16.67 on pair 3 labelled `OLS`. Bottom 50%: left, the officer strip (three small stills with arrows); right, the two pointer lists. Eye-path: 50.8 → 79.0 → the strip → "Environmental — no claim".

**4. Diagram — officer strip.** `Report — 1,981 rows` → *rank* → `Queue — ranked, a reason per project` → *draft* → `Escalation note — EN / HI, every sentence cites a fact`. Three stills: queue (as slide 3, smaller); a project's driver list; a generated briefing with one fact citation highlighted.

**5. Chart — exact data.**
- Pair 1 (%): 50.84 → 79.03; reference line 85.
- Pair 2 (months, lower is better): 99.95 → 22.71.
- Pair 3 (% MAE): 18.495 → 16.24; marker at 16.67 (OLS).
Bars only; baseline at 0; values printed above bars; no gridlines.

**6. Sources.** `artifacts/conformal_calibration.json` · `artifacts/overrun_models.json` · PS text (₹42.78 lakh crore) · prototype stills.

**7. Speaker narrative (≈ 60 s).** "Three numbers, all on held-out projects. Coverage of official revised targets by the window: 51 percent before calibration, 79 after, against a nominal 85 — we show the gap. Median error of the P50 against the revised target: 100 months down to 23. Cost overrun: 18.5 percent error for the sector-average forecast the ministry effectively uses today, 16.2 for ours — and 16.7 for plain OLS, drawn right there, which is why we do not call the regressor the innovation. Below, what the officer gets: the 1,981-row report becomes a ranked queue with a reason per rank, and the escalation note drafts itself with every sentence citing a fact. We are not claiming rupees saved; the pilot measures that. We would rather show you three honest numbers than one invented one."

**8. Judge takeaway.** The report changes from "what slipped" to "what will slip, by how much, with what confidence, and which to act on" — and the improvement is measured, with n.

---

## SLIDE 6 — RESEARCH AND REFERENCES

**1. Slide title.** `RESEARCH AND REFERENCES` (template). Sub-heading, 18 pt: `Read · Rerun`

**2. Exact copy.**

*Details / Links of the reference and research work*

Left — **Read** (11 pt):
```
On this database
• Ram Singh (2010), "Delays and Cost Overruns in Infrastructure Projects", EPW 45(21) — 894 MoSPI projects, 1992–2009
• Morris (1990), EPW — Indian public-sector overruns
Methods
• Flyvbjerg (2006), reference-class forecasting — our conventional baseline
• Wei (1992), Statistics in Medicine — AFT model for censored durations
• Romano, Patterson & Candès (2019), Conformalized Quantile Regression — calibrated intervals
• McCrary (2008), J. Econometrics — density test at the 20% CCEA threshold (null)
Owner's documents
• NIC Informatics (Oct 2025), "PAIMANA Portal" — stack; "AI-driven forecasting" roadmap
• PIB Release 2244898 (25 Mar 2026) — PAIMANA–IPMP integration
• MoSPI, Project Monitoring Report, April 2026 — the PS dataset
```

Right — **Rerun** (Consolas, 11 pt, accent-bordered box):
```
github.com/amey-bauchkar/Prakalp-Drishti-
CLAIMS.md — every capability: fitted / heuristic / refused
Corrections on record: 93.3% coverage and p < 0.001 withdrawn (CLAIMS.md §4a, §4b)

python analytics_engine/aft_survival.py
python analytics_engine/conformal_calibration.py
python tests/test_engine_precision.py

artifacts/aft_survival.json · conformal_calibration.json
artifacts/overrun_models.json · eo_progress_independence.json
seed 42 · artifacts regenerate byte-identically
```

≈ 150 words.

**3. Visual composition.** Two columns, 58 / 42. Left: three groups with small accent group labels. Right: one bordered mono box, accent border, generous padding, nothing else. Eye-path: the Rerun box → Ram Singh's line.

**4. Diagrams.** None. **5. Charts.** None.

**6. Sources.** The references; the repository.

**7. Speaker narrative (≈ 40 s).** "Two columns. Read: Ram Singh's 2010 paper on this very database; Flyvbjerg's reference-class forecasting, which is what we mean by conventional statistics; the survival and conformal method papers; and the ministry's own documents on PAIMANA. Rerun: the repository, the claims ledger with our corrections on record, and three commands that regenerate every number in this deck from seed 42. If any number does not match, that is our defect, and we stand by the code."

**8. Judge takeaway.** They read the literature on our own data, defined "conventional statistics" properly, and I can rerun their numbers in three commands.

---

## 2. Pre-flight — the deck is not final until every line is ticked

1. `https://prakalp-drishti.vercel.app` opens cold in < 5 s; `/api/health` returns 200; a static fallback build with pre-computed JSON is deployed so the UI opens even if the API sleeps.
2. README / CLAIMS / scripts reconciled: 140 checks; 1,345 edges; "sub-meter", "Tarjan" and the latency badge removed; `docs/RECONCILIATION_APRIL_2026.md` published (2,207 vs 1,981; ₹ totals by scope and month).
3. Slide-2 fan re-pulled from `forecast_project("617185")` on export day; dates match to the day.
4. Three dated stills captured (queue, project page 617185, briefing); links tested inside the exported PDF.
5. Video: recorded and linked, or the pill omitted. No placeholders anywhere in the PDF.
6. Every number on every slide checked against the source listed for that slide; word budgets respected; no font under 11 pt.
7. Six pages, pointers verbatim, PDF; file name `SIH26103_<TeamName>.pdf`; idea title and description pasted into the portal fields exactly as in §1.
8. Optional but valuable: reference-class interval baseline computed on the conformal split (sector P10/P95 slip-ratio quantiles from the 596 calibration projects → coverage on the 596 test projects); if computed, drawn as the third bar in slide 3's time branch whichever way it comes out.

---


# Appendix — document and artifact index

| Document | Role | Status |
|---|---|---|
| `SIH2026_PRESENTATION_RESEARCH.md` | Research and judge model | Current (Part 1) |
| `SIH26103_COMPETITION_AUDIT.md` | Six-lens audit | Current (Part 2) |
| `SIH26103_COMPETITOR_ANALYSIS.md` | Competitor position and ladder visual | Current (Part 3) |
| `SIH26103_NARRATIVE.md` | Narrative spine | Current (Part 4) |
| `SIH26103_DECK_BLUEPRINT.md` | Blueprint and compliance | Current (Part 5) |
| `SIH26103_FINAL_DECK_CONTENT.md` | Deck content v1 → v2 | **Superseded** by the locked specification |
| `SIH26103_JUDGE_PANEL_REVIEW.md` | Hostile panel, scores, fixes | Current (Part 6) |
| `SIH26103_DECK_FINAL_LOCKED.md` | Final locked deck specification | Current (Part 7) — the build target |
| `CLAIMS.md` | Claims ledger (fitted / heuristic / refused) | Repository authority for every capability claim |
| `artifacts/*.json` | Regenerable evidence | Seed 42; byte-identical across hosts |

Published pages (private unless shared): research · audit · competitor analysis · narrative · blueprint · deck content (versions 1–3; version 3 = locked) · panel review · this master document.
