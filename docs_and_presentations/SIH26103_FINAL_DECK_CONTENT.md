# PRAKALP-DRISHTI — Final Presentation Content for PS SIH26103

*16 September 2026 — v2 after the hostile panel review (`SIH26103_JUDGE_PANEL_REVIEW.md`). Sixth and final document of the sequence. This is the copy, the composition, the diagrams, the chart data, the screenshots, the sources and the speaker narrative for each of the six slides, ready for layout in the official SIH 2026 template (`/letters/2026/SIH2026-IDEA-Presentation-Format.pptx`, verified today). Every figure below was re-read from the repository artifacts today; the example project on slide 2 is live engine output, not an illustration.*

---

## 0. Global rules for the layout phase

**Template.** Six slides including the title; section titles and pointer headings kept verbatim; the seventh instruction slide deleted; export to PDF; 16:9.

**Type.** Section titles: the template's own. Pointer headings: 14 pt bold. Body: 12 pt, never below 11 pt. Numbers that carry the argument: 24–32 pt. Use one embedding-safe sans available on the layout machine (Segoe UI or Calibri); no decorative faces. Mono (Consolas) only for the "Rerun" box on slide 6 and the source strip on slide 2.

**Colour.** Ink `#16202A`; secondary text `#3C4A57`; grey for "today / baseline" `#8A97A4`; one accent for "ours / measured" `#1F5F73`; a light accent fill `#DDE9EE` for the window band. Nothing else. No gradients, no icons, no stock photographs.

**Figures.** Every chart drawn as vector in the slide tool (not pasted from a notebook); every prototype still captured at 1920 × 1080 on the day of export, with the date printed in its corner; every number on a slide exists in `artifacts/` or on an official page (sources listed per slide).

**Word budget (on-slide text, excluding the fixed headings):** S2 ≤ 110 · S3 ≤ 120 · S4 ≤ 170 · S5 ≤ 110 · S6 ≤ 150.

**Portal fields (entered separately; read before the PDF opens).**
- *Idea title:* `PRAKALP-DRISHTI — calibrated early warning for PAIMANA`
- *Idea description (the only paragraph allowed anywhere, because it is a portal field):* `A monthly early-warning annex to IPMD's Project Monitoring Report, computed from the CUF fields PAIMANA already collects. For every ongoing project it gives a calibrated completion window (P10–P95) from a right-censored survival model, a cost-overrun forecast benchmarked against sector averages and OLS on a chronological split, and a ranked intervention queue with the reason behind each rank. We measured the PS's own questions instead of assuming them: on 265 held-out projects gradient boosting beats the sector-average forecast by 12% and OLS by 2.6% on cost overrun, and no regression model was deployable for time overrun; ten external variables, as constructed, did not help; calibration is where the gain is — the P10–P95 window covers 79% of held-out official targets where the raw model covered 51%, with median error down from 100 to 23 months. Open-source, offline-capable, role-based; every figure regenerates from a seeded script. Working prototype: https://prakalp-drishti.vercel.app`

---

## SLIDE 1 — TITLE PAGE

**SLIDE TITLE.** `TITLE PAGE` (template) — no change.

**ON-SLIDE COPY.**
```
SMART INDIA HACKATHON 2026
Problem Statement ID – SIH26103
Problem Statement Title – Use case on web-based integrated project-monitoring platform
Theme – Smart Automation
PS Category – Software
Team ID – <as registered on portal>
Team Name – <exactly as registered on portal>

PRAKALP-DRISHTI — calibrated early warning for PAIMANA
```

**VISUAL COMPOSITION.** The template's title layout, untouched. The idea-title line sits under the field block in 20 pt accent colour, one line, no tagline beneath it. No image, no logo strip, no institute name (guideline: team name must not contain it).

**DIAGRAM.** None. **DATA/CHART.** None. **SCREENSHOT/UI.** None.

**SOURCES.** PS title, theme and category copied character-for-character from `sih.gov.in/sih2026PS` (read 13 Sep 2026).

**JUDGE TAKEAWAY.** This deck is the one whose idea title I just read on the portal: early warning for PAIMANA.

**SPEAKER NARRATIVE (finale only; screening is read, not spoken).** "Problem statement 26103, MoSPI's Data Informatics and Innovation Division, for IPMD. Our idea in six words: calibrated early warning for PAIMANA. Everything that follows is measured on the ministry's own public register."

---

## SLIDE 2 — IDEA TITLE

**SLIDE TITLE.** `IDEA TITLE` (template). Sub-heading inside the content area, 18 pt: `A calibrated early-warning annex to PAIMANA's monthly report`

**ON-SLIDE COPY.**

Top band — source strip, mono 11 pt, grey:
```
PAIMANA, Apr 2026: 1,981 ongoing · ₹37.13 → ₹42.78 lakh crore · ₹20.36 spent · public register, Jun 2026 (2,207 rows incl. 164 completed): 1,988 of 2,103 still running
```

Under the fan chart, 11 pt:
```
Project 617185 · Kurnool-IV REZ transmission (POWERGRID) · ₹5,550 Cr · 25% complete
PAIMANA records the two dates. The band is what we add: 22% chance of meeting Sep 2027.
Why: 25% built in 15 months against a 24-month plan; sector prior-dominated — a wide, honest band.
```

Column 1 — *Detailed explanation of the proposed solution*
```
A monthly annex to IPMD's Project Monitoring Report, from CUF fields already collected:
• Completion window P10–P95 — censored survival model, conformal-calibrated
• Cost-overrun forecast — vs sector average and OLS, chronological split
• Ranked queue — reason per project; weights Ministry-editable
• Bilingual briefing — every sentence cites a hashed fact; offline; open-source
```

Column 2 — *How it addresses the problem* (PS wording on the left of each row)
```
(a) models                 →  survival, OLS, boosting; chronological test
(b) AI vs conventional      →  calibration is the gain: coverage 51% → 79%; boosting +2.6% on cost; time: neither ML nor OLS deployable
(c) CUF vs added variables  →  ten externals, as constructed, did not help; land, clearance and milestone fields are absent from the public CUF — our ask
Outcomes a b c d e g h i · f partial
```

Column 3 — *Innovation and uniqueness of the solution*
```
Censored, not ignored — 94% unfinished, modelled as censored data
Measured, not assumed — ablations on both targets, inconvenient results included
Reproducible — every figure regenerates from a seeded script (see slide 6)
```

Prototype buttons (bottom right, 11 pt): `Live ▸ prakalp-drishti.vercel.app` · `Code ▸ github.com/amey-bauchkar/Prakalp-Drishti-` · `Video ▸ <2-min link>`

Word count ≈ 110 (v2; was ≈ 150).

**VISUAL COMPOSITION.** Three horizontal zones. **Zone A (top 38%)**: the source strip (one line) and, beneath it, the fan chart spanning the full width, with its two-line caption. **Zone B (middle 52%)**: three equal columns under the three template pointer headings; column 2 is a three-row table with the PS letters in accent colour. **Zone C (bottom 10%)**: the three prototype links as bordered pills, right-aligned; template footer.

**DIAGRAM.** None beyond the chart.

**DATA/CHART — the completion fan (engine output for project 617185, as-of 30 Jun 2026).**
Horizontal timeline, Jan 2025 → Dec 2033, year ticks.
- `Sanctioned` tick at **24 Mar 2025** (grey).
- `Original end` tick at **23 Mar 2027** (grey, thin).
- `Revised end` tick at **30 Sep 2027** (grey, thin, labelled "PAIMANA's current date").
- Our band: light accent fill from **P10 = 7 Feb 2027** to **P95 = 19 Dec 2032**; darker fill between **P10** and **P80 = 10 Nov 2031**; a solid accent tick at **P50 = 15 Nov 2028** labelled "P50".
- Small label on the band: `P(meet Sep 2027) = 0.22`.
- Legend as two words on the marks themselves, no separate legend box.
Rendered as vector rectangles and ticks; height ~2.2 in.

**SCREENSHOT/UI.** None on this slide (the fan is drawn, not screenshotted, so the dates are legible at slide scale). The live link carries the UI.

**SOURCES.** PS text (April 2026 figures) · `artifacts/aft_survival.json` (n_observations 2103, n_right_censored 1988) · `KaalChakraEngine.forecast_project("617185")` output, as-of 2026-06-30 · `artifacts/overrun_models.json` → `ml_vs_conventional`, `cuf_vs_external_ablation`, `calendar_identity` (slip) · `artifacts/conformal_calibration.json` · Ram Singh (2010) for the fields named in row (c).

**JUDGE TAKEAWAY.** They replace a promised date with a calibrated window on my own data, and they measured whether AI helps before claiming it.

**SPEAKER NARRATIVE (≈ 90 s).** "PAIMANA tracks 1,981 projects worth ₹42.78 lakh crore, and it records every slip faithfully — after it happens. The reason nobody can say which project slips next is in the strip at the top: 1,988 of the 2,103 projects in the public register are still running. Here is one of them. Kurnool-IV transmission, sanctioned March 2025, ₹5,550 crore, a quarter built. PAIMANA holds two dates: original March 2027, revised September 2027. Our model adds the band: the median completion is November 2028, and the chance of meeting the revised date is 22 percent. That is early warning — before the slip materialises. What we deliver is an annex to your monthly report: this window for every project, a cost-overrun forecast benchmarked against your own sector averages, a ranked queue with a reason per rank, and a bilingual briefing where every sentence cites a hashed fact. Your problem statement asked three questions; column two answers each with a measurement — including the answer that machine learning beats OLS by only 2.6 percent on cost and loses on time. We put that on the slide on purpose. What makes us different is in column three: we treat unfinished projects as censored data, we measured instead of assumed, and everything reproduces."

---

## SLIDE 3 — TECHNICAL APPROACH

**SLIDE TITLE.** `TECHNICAL APPROACH` (template). Sub-heading, 18 pt: `Censored → calibrated → benchmarked, on the CUF fields`

**ON-SLIDE COPY.**

Under *Technologies to be used*, one line, 11 pt:
```
Python · pandas · scipy (penalised MLE, HiGHS) · scikit-learn (gradient boosting, OLS) · FastAPI · PostgreSQL · React · Docker · optional open-weight LLM — demo: hosted API on public data only; pilot: local model or none
```

Under *Methodology and process for implementation* — the pipeline diagram carries the method; three lines beneath it, 11 pt:
```
Validation  chronological split · 12 leakage columns named · MAE vs naive, sector-mean and OLS · window coverage measured on 596 held-out projects
Reproducibility  fixed seeds · byte-identical artifacts across machines · 140 automated checks
Honest ceiling  external variables, as constructed, −3.8% on cost and worse on time · slip-month models not deployed (calendar identity); time forecasts rest on the survival model
```

Word count ≈ 110 (excluding node labels).

**VISUAL COMPOSITION.** **Left 68%**: the pipeline diagram, six stages left→right, the two branches stacked in stage 4, two numbers in accent colour printed where they are produced. **Right 32%**: two prototype stills stacked (queue above, project page below), each with a one-line caption and the capture date. Text lines under the diagram.

**DIAGRAM — the pipeline (exact nodes, left → right; arrows labelled).**
1. `PAIMANA public register` — sub-label `2,207 rows · 25 CUF fields · 2,103 usable`
   → arrow `rows`
2. `Leakage guard` — sub-label `12 future-dated columns removed: RevisedCost, RevisedDate, Expenditure, COST_OVERRUN…`
   → arrow `features: cost, planned months, progress, sanction year, sector, agency`
3. `Chronological split` — sub-label `train: sanctions ≤ 2020 (792) · test: 2020–21 (265)` — and, for the window, `calibrate 596 · test 596`
   → two arrows, `time` (up) and `cost` (down)
4a. **Time branch** (upper): `Log-logistic AFT, right-censored` — sub-label `115 events · 1,988 censored` → arrow `raw median` → `Split-conformal on the median` → arrow `P10 · P50 · P80 · P95` — printed beside it in accent, 24 pt: **`coverage of official revised targets 50.8% → 79.0%`** with sub-label `nominal 85% · n = 596 · no completion dates exist for ongoing projects` — and, if computed before submission (panel review, Fix 5), a third bar `reference-class band` beside `uncalibrated` and `conformal`
4b. **Cost branch** (lower): `Sector mean 18.49` · `OLS 16.67` · `Gradient boosting 16.24` shown as three small bars (grey, grey, accent) labelled `MAE, % revised-cost overrun at snapshot · projects ≥ 5 yrs` — printed beside it in accent, 24 pt: **`ML vs OLS +2.6%`** with sub-label `n = 265`
   → both branches converge with arrow `scores + drivers`
5. `Risk queue` — sub-label `declared weights · reason per project · Ministry-editable`
   → arrow `facts (hashed)`
6. `Briefing EN / HI` → arrow `monthly` → `PAIMANA annex`
Hierarchy: stages 1–3 and 5–6 in grey outline; stage 4's two branches in ink outline; only the two 24-pt numbers in accent.

**DATA/CHART.** The three bars in 4b: 18.49 / 16.67 / 16.24 (MAE, % revised-cost overrun at snapshot, projects ≥ 5 years old, held-out n = 265), one scale, baseline at 0.

**SCREENSHOT/UI.** Still 1: *Early-warning queue* — the ranked list with the risk band, priority and the per-project reason chips visible; caption `Early-warning queue — reasons per rank (prototype, <date>)`. Still 2: *Project page* for 617185 showing the fan and the facts panel; caption `Project 617185 — window and cited facts (prototype, <date>)`. Both captured after the demo host is fixed; both at 1920 × 1080, cropped to 16:10.

**SOURCES.** `artifacts/overrun_models.json` (leakage_excluded_columns, cuf_features, train/test years and counts, cuf_only MAEs, ml_vs_conventional, cuf_vs_external_ablation, slip_months deployable = false) · `artifacts/conformal_calibration.json` (uncalibrated_coverage_on_test 0.5084, empirical_coverage_on_test 0.7903, n_calibration/n_test 596, p50_test_mae 22.71, raw 99.95) · `artifacts/aft_survival.json` · `CLAIMS.md` (140 checks) · `tests/test_engine_precision.py` (byte-identical across hosts).

**JUDGE TAKEAWAY.** Chronological, leakage-named, censoring-aware, coverage-measured, three baselines — this is how I would have evaluated it, and it is running.

**SPEAKER NARRATIVE (≈ 90 s).** "Left to right. We start from the public register — 2,207 rows, 25 CUF fields. The first thing we do is remove twelve columns that only exist after the outcome — revised cost, revised date, expenditure — because a model that sees them is not predicting, it is reading. We split by time: train on sanctions up to 2020, test on 2020 to 2021. Two branches. Time: a log-logistic survival model that treats the 1,988 unfinished projects as censored, then conformal calibration on the model's own median. That is where this number comes from — the window covered 51 percent of held-out official targets before calibration and 79 percent after, at a nominal 85. Cost: sector mean, OLS, gradient boosting on the same 265 projects — 18.5, 16.7, 16.2. The boosting wins by 2.6 percent over OLS. We are not hiding that; it is the answer to your dimension (b). The branches feed a queue with declared weights and a reason per project, and a bilingual briefing where every sentence cites a hashed fact. On the right, the prototype: the queue, and the project page you saw on slide two. Everything regenerates from a seed, byte-identical on any machine."

---

## SLIDE 4 — FEASIBILITY AND VIABILITY

**SLIDE TITLE.** `FEASIBILITY AND VIABILITY` (template). Sub-heading, 18 pt: `Fits beside PAIMANA as it is — and four limits, stated first`

**ON-SLIDE COPY.**

Under *Analysis of the feasibility of the idea* (left column, 11 pt):
```
• Built — 20-screen working prototype: ~93 API endpoints, 140 automated checks, Docker image, pinned open-source stack
• Fits the owner's roadmap — NIC's PAIMANA write-up names "AI-driven forecasting… to predict time and cost overruns" as the next step
• Pilot — one ministry's projects, one quarter; owner: IPMD monitoring officer; output: an annex to the monthly report
• Sustainable — no licences, no external API, one NIC Cloud VM; outputs as plain tables SSRS can read; roles server-side, SSO via NIC in the pilot; weights and thresholds are Ministry-editable policy
```

Under *Potential challenges and risks* → *Strategies for overcoming these challenges* (right, four-row table, 11 pt):
```
Risk                                                     Strategy
1  No monthly panel yet — one public snapshot,           Ingest PAIMANA's Monthly Flash Report archive; add month-over-month
   four report extracts; windows are wide (mean 101 mo)  features; re-run the same protocol — narrower windows need monthly data
2  Queue weights are declared, not yet outcome-validated Cross-sectional backtest now; temporal backtest on OCMS history;
                                                         Ministry sets weights in the admin view
3  Cost model tested on sanctions ≤ 2021;                Young projects fall back to the sector prior, flagged "prior-dominated",
   55% of the portfolio is 2021–24                       never scored as safe
4  Self-reported inputs; missing fields                  Validation scanner; missing signals shown as "not reported", never silently zero
```

Bottom line, 11 pt, grey:
```
What we refuse to claim: sub-metre satellite verification · fraud verdicts (20% CCEA bunching test: p = 0.68, reported as a null result)
```

Word count ≈ 160.

**VISUAL COMPOSITION.** **Top 40%**: the deployment diagram across the full width. **Bottom 60%**: left column (feasibility, four bullets) 40% wide; right column (risk table, four rows) 60% wide; the refusal line under both.

**DIAGRAM — deployment beside PAIMANA (exact nodes).**
- Large grey box left: `PAIMANA` — sub-labels `NIC Cloud · MS SQL · SSRS dashboards · IPMP API feed (64% auto-updated)`.
- Arrow from PAIMANA to the annex, labelled `monthly CUF export / REST`.
- Small accent-outlined box right: `Annex — one container (FastAPI + models) + PostgreSQL` — sub-labels `roles: viewer / analyst / admin` · `no external calls` · `all open-source`.
- Three arrows out of the annex, labelled `queue`, `windows + drivers`, `briefing EN/HI`, converging on a grey box `Project Monitoring Report · line-ministry dashboards`; small label on the arrows: `plain tables — SSRS-readable`.
- A dashed box under the diagram: `Needed from MoSPI: OCMS history incl. actual completion dates (to recalibrate against completions, not targets) · monthly archive · CUF fields the literature names — land-acquisition status, clearance dates, milestone dates, monthly expenditure (untested by us)`.
Hierarchy: PAIMANA box visibly larger than the annex box (the point is that we are small beside it).

**DATA/CHART.** None.

**SCREENSHOT/UI.** None (the diagram is the visual; a still of the admin ingest view is optional at ≤ 15% width if space remains, captioned `CUF ingest + weight settings (prototype, <date>)`).

**SOURCES.** NIC Informatics, "PAIMANA Portal", Oct 2025 (stack; "Way Forward") · PIB Release ID 2244898, 25 Mar 2026 (IPMP integration, 64%) · `Dockerfile`, `requirements.txt`, `backend/auth.py`, `modules/ingest/` · `CLAIMS.md` §2 (declared weights), §4b (p = 0.68), §3 (refusals) · `artifacts/conformal_calibration.json` (mean_band_width_months 100.86) · corpus sanction-year counts (2021–24 = 1,208 of 2,207).

**JUDGE TAKEAWAY.** It fits beside PAIMANA without touching it, runs on what NIC already has, and they told me what it cannot do yet.

**SPEAKER NARRATIVE (≈ 80 s).** "PAIMANA runs on NIC Cloud with MS SQL and SSRS and takes a monthly CUF feed. We sit beside it as one container and a Postgres database, take the CUF export, and send back three things — the queue, the windows with drivers, and the briefing — into the monthly report. No licences, no external API, roles built in. The pilot is one ministry, one quarter, owned by an IPMD monitoring officer. Now the four things we cannot do yet, before you ask. One: we have a snapshot, not a monthly panel, so the windows are wide — a hundred months on average; the monthly Flash Report archive fixes that and we will run the same protocol on it. Two: the queue weights are declared policy, not fitted; we backtest them and you set them. Three: the cost model was tested on projects sanctioned up to 2021; for the younger half of the portfolio it falls back to the sector prior and says so. Four: inputs are self-reported; missing signals are shown as missing, never as safe. And two refusals: no sub-metre satellite claims, no fraud verdicts — the bunching test at the 20 percent cap came back null, and we report it as null."

---

## SLIDE 5 — IMPACT AND BENEFITS

**SLIDE TITLE.** `IMPACT AND BENEFITS` (template). Sub-heading, 18 pt: `From description to intervention — measured, not projected`

**ON-SLIDE COPY.**

Three before/after pairs (chart labels, 28 pt numbers):
```
Window coverage        50.8% → 79.0%     official revised targets covered by the P10–P95 window · nominal 85% · n = 596
Median date error      100 → 22.7 months  P50 vs official revised target · n = 596
Cost-overrun error     18.49 → 16.24%     revised-cost overrun, MAE vs the sector-average forecast · n = 265
```

Under *Potential impact on the target audience* (11 pt):
```
• IPMD monitoring officers — which projects to escalate this month, and why: computed, not compiled
• Line ministries / PMG cells — a calibrated window and a driver list per project instead of a promised date
• DIID statisticians — every number reproducible; models, baselines and limits documented; a method the Ministry can own
```

Under *Benefits of the solution* (11 pt):
```
Governance — ranked, reasoned, contestable; audit trail per figure
Economic — earlier intervention on the ₹42.78 lakh crore portfolio; the size of any saving is not claimed — the pilot measures it
Social / accessibility — English / Hindi briefings (Hindi templates, pending official review); plain-language reasons
Environmental — no claim
```

Word count ≈ 110.

**VISUAL COMPOSITION.** **Top 50%**: three before/after bar pairs side by side, each pair on its own scale, "today" bar grey, "annex" bar accent, the number pair above each in 28 pt, the n-line beneath in 10 pt grey; a dashed line at 85% on the first pair labelled `nominal`. **Bottom 50%**: left column, the three-panel officer strip (three small prototype stills with arrows); right column, the two pointer lists.

**DIAGRAM.** The officer strip: `Report — 1,981 rows` → `Queue — ranked, with reasons` → `Escalation note — EN/HI, every sentence cites a fact`. Arrows labelled `rank`, `draft`.

**DATA/CHART — exact data.**
- Pair 1, unit %: today 50.84 → annex 79.03; reference line 85.
- Pair 2, unit months: today 99.95 → annex 22.71 (lower is better; draw the "today" bar taller, grey).
- Pair 3, unit % MAE: today 18.495 (sector mean) → annex 16.24; a thin grey marker at 16.67 labelled `OLS` on the same bar group (so the honest gap is visible).
Bars only; no 3-D, no gridlines beyond a baseline.

**SCREENSHOT/UI.** Three small stills: the queue (as on slide 3, smaller), one project page's driver list, and one generated briefing with a fact-citation highlighted. Purpose: to show that the three outputs exist as screens, not as promises.

**SOURCES.** `artifacts/conformal_calibration.json` · `artifacts/overrun_models.json` · PS text (₹42.78 lakh crore) · prototype.

**JUDGE TAKEAWAY.** The report changes from "what slipped" to "what will slip, by how much, with what confidence, and which to act on" — and the improvement is measured, with n.

**SPEAKER NARRATIVE (≈ 60 s).** "Three numbers, all measured on held-out projects. Coverage of the completion window: 51 percent before calibration, 79 after, against a nominal 85 — we show the gap. Median date error: 100 months down to 23. Cost-overrun error: 18.5 percent for the sector-average forecast the ministry effectively uses today, 16.2 for ours — and 16.7 for plain OLS, which is why we don't call the regressor the innovation. What the officer gets is the strip below: the 1,981-row report becomes a ranked queue with a reason per rank, and the escalation note writes itself with every sentence citing a fact. We are not claiming rupees saved. The pilot measures that; we would rather show you three honest numbers than one invented one."

---

## SLIDE 6 — RESEARCH AND REFERENCES

**SLIDE TITLE.** `RESEARCH AND REFERENCES` (template). Sub-heading, 18 pt: `Read · Rerun`

**ON-SLIDE COPY.**

Left column — **Read** (11 pt, each with a one-line "why"):
```
On this database
• Ram Singh (2010), "Delays and Cost Overruns in Infrastructure Projects", EPW 45(21) — 894 MoSPI projects, 1992–2009: delay and cost overrun move together
• Morris (1990), EPW — early evidence on Indian public-sector overruns
Methods
• Flyvbjerg (2006), reference-class forecasting — the conventional baseline we benchmark against
• Wei (1992), Statistics in Medicine — the AFT model for censored durations
• Romano, Patterson & Candès (2019), Conformalized Quantile Regression — calibrated intervals with finite-sample coverage
• McCrary (2008), J. Econometrics — density test used at the 20% CCEA threshold (null result)
Owner's documents
• NIC Informatics (Oct 2025), "PAIMANA Portal" — stack and "AI-driven forecasting" roadmap
• PIB Release 2244898 (25 Mar 2026) — PAIMANA–IPMP integration
• MoSPI, Project Monitoring Report, April 2026 — PS dataset pointer
```

Right column — **Rerun** (mono, 11 pt, boxed):
```
github.com/amey-bauchkar/Prakalp-Drishti-
CLAIMS.md — every capability: fitted / heuristic / refused
Corrections on record: 93.3% coverage and p < 0.001 withdrawn — see CLAIMS.md §4a, §4b

python analytics_engine/aft_survival.py
python analytics_engine/conformal_calibration.py
python tests/test_engine_precision.py

artifacts/aft_survival.json · conformal_calibration.json
artifacts/overrun_models.json · eo_progress_independence.json
seed 42 · artifacts regenerate byte-identically
```

Word count ≈ 140.

**VISUAL COMPOSITION.** Two columns, 58 / 42. Left: three grouped lists with small group labels in accent. Right: one bordered mono box, accent border, generous padding; nothing else on the right. Template footer.

**DIAGRAM.** None. **DATA/CHART.** None. **SCREENSHOT/UI.** None.

**SOURCES.** The references themselves; the repository.

**JUDGE TAKEAWAY.** They read the literature on our own data, defined "conventional statistics" properly, and I can rerun their numbers in three commands.

**SPEAKER NARRATIVE (≈ 40 s).** "Two columns. Read: Ram Singh's 2010 paper on this very database, Flyvbjerg's reference-class forecasting — which is what we mean by 'conventional statistics' — the survival and conformal method papers, and the ministry's own documents on PAIMANA. Rerun: the repository, the claims ledger with our withdrawn figures on record, and three commands that regenerate every number in this deck from seed 42. If any number does not match, that is our defect, and we will stand by the code."

---

## 7. Pre-flight checklist (before export)

1. Demo opens cold at `prakalp-drishti.vercel.app` in < 5 s (Render kept warm or moved); API health returns 200.
2. README / CLAIMS / scripts reconciled: edge count, test count (140), "sub-meter" removed from `satellite_pipeline/` outputs, "Tarjan" removed, latency badge removed.
3. Slide-2 fan re-pulled from the engine on export day; dates match `forecast_project("617185")`.
4. Three stills captured with date stamps; links tested inside the exported PDF.
5. Every number on every slide checked against the source listed for that slide.
6. Six pages, pointers verbatim, PDF, file name `SIH26103_<TeamName>.pdf`; idea title and description pasted into the portal fields exactly as in §0.
7. Static fallback build with pre-computed JSON so the UI opens even if the API is asleep; video recorded or the pill deleted.
8. `docs/RECONCILIATION_APRIL_2026.md` written (2,207 vs 1,981; ₹ totals by scope and month).
9. Reference-class interval baseline computed on the conformal split (sector P10/P95 slip-ratio quantiles from the 596 calibration projects → coverage of the official revised target on the 596 test projects); result added to slide 3 whichever way it comes out.
