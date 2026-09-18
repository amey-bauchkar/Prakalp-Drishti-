# What Wins SIH Presentations — Research Report for PS SIH26103

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
