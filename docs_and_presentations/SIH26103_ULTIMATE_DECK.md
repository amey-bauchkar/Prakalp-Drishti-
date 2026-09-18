# PRAKALP-DRISHTI — Ultimate Final Presentation Specification (PS SIH26103, SIH 2026)

*16 September 2026. Baseline: the locked specification in the master document (Part 7). Changes below are made only where the master's own evidence supports them; each is marked ⟨changed⟩ with the reason. Slide size 13.33 × 7.5 in (official 2026 template); the template's title bar (~0.9 in) and footer (~0.4 in) are untouched; zones are given in inches from the top-left of the slide.*

---

## FINAL STRATEGY

The deck makes one argument six times, each time with a number that regenerates from the repository: PAIMANA records slips after they happen; 94% of its projects are unfinished; treat those as censored data, calibrate the forecast, and benchmark the models against the Ministry's own statistics — and the monthly report gains a calibrated completion window, a benchmarked cost forecast and a reasoned queue for every project. Slide 2 carries the whole idea through one real project from the register (Kurnool-IV, 617185: PAIMANA's two dates against our band and a 22% probability, with the reason under it). Slide 3 shows the actual pipeline with the leakage guard, the split years and the two measured numbers printed where they are produced. Slide 4 shows the annex beside PAIMANA as NIC runs it, what is built, what remains, the smallest pilot, and four real risks with their mitigations. Slide 5 shows three measured deltas with their n and says what the pilot will measure instead of inventing savings. Slide 6 cites the literature on this very database and gives three commands that regenerate every figure, corrections on record. Nothing is projected, no engine names, one accent colour used once per slide.

---

## FINAL SIX-SLIDE DECK

### Slide 1 — TITLE PAGE

**Final copy**
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

**Visual composition.** Template title layout, untouched. The idea-title line sits under the field block, 20 pt, accent `#1F5F73`, one line. Nothing else. First: PS ID and title. Second: the idea-title line. Third: nothing — the slide is meant to cost no attention.

**Charts/diagrams.** None.

**Evidence.** PS ID, title, theme, category character-for-character from `sih.gov.in/sih2026PS`.

**Judge takeaway.** This is the deck whose idea title I just read on the portal: early warning for PAIMANA.

**Speaker narrative.** "Problem statement 26103 — MoSPI's Data Informatics and Innovation Division, for the Infrastructure and Project Monitoring Division. Our idea in six words: calibrated early warning for PAIMANA. Everything that follows was measured on the Ministry's own public register."

---

### Slide 2 — IDEA TITLE

**Final copy**

Sub-heading (18 pt, under the template title): `A calibrated early-warning annex to PAIMANA's monthly report`

Strip (Consolas 11 pt, grey, one line):
```
PAIMANA · Apr 2026: 1,981 ongoing · ₹37.13 → ₹42.78 lakh crore · public register Jun 2026: 1,988 of 2,103 still running (2,207 rows incl. 164 completed)
```

On the chart itself (labels, not caption) ⟨changed — the limitation→intervention flow is now readable inside the figure; better judge comprehension⟩:
```
PAIMANA today: two dates          ←  above the grey ticks
PRAKALP-DRISHTI adds: the window  ←  above the band
P(meet Sep 2027) = 0.22           ←  on the band, accent, 14 pt
```

Under the chart (11 pt; "0.22" and "22%" in bold accent):
```
Project 617185 · Kurnool-IV REZ transmission (POWERGRID) · ₹5,550 Cr · 25% complete · not yet overdue
Why the band sits here: 25% built in 15 months against a 24-month plan; sector has few completions → wide, honest band
Window calibrated on the register: 79% of 596 held-out official targets covered (51% before calibration)
```

*Detailed explanation of the proposed solution*
```
A monthly annex to IPMD's Project Monitoring Report, from CUF fields already collected:
• Completion window P10–P95 — censored survival model, conformal-calibrated
• Cost-overrun forecast — vs sector average and OLS, chronological split
• Ranked queue — a reason per project; weights set by the Ministry
• Bilingual briefing — every sentence cites a hashed fact; offline; open-source
```

*How it addresses the problem* — PS letters in accent
```
(a) models              →  survival, OLS, boosting — tested chronologically
(b) AI vs conventional  →  calibration is the gain (window coverage 51 → 79%); boosting +2.6% on cost; time: no regression deployable
(c) CUF vs added fields →  ten externals, as constructed, did not help; land, clearance, milestone fields absent from the public CUF — our ask
Outcomes a b c d e g h i · f partial
```

*Innovation and uniqueness of the solution*
```
Censored, not ignored — 94% unfinished, modelled as censored data
Measured, not assumed — ablations on both targets, inconvenient results included
Reproducible — every figure regenerates from a seeded script (slide 6)
```

Pills (11 pt, bottom right): `Live ▸ prakalp-drishti.vercel.app` · `Code ▸ github.com/amey-bauchkar/Prakalp-Drishti-` · *(`Video ▸ …` only if a recording exists on export day)*

≈ 120 words on slide (chart labels included).

**Visual composition.**
- 0.9–1.15 in: strip, full width, grey mono.
- 1.2–3.9 in: the fan, full content width (0.5–12.8 in), the largest element on the slide; caption lines directly beneath at 3.6–3.95 in.
- 4.05–6.75 in: three equal columns under the three template pointer headings; column 2 is a three-row table with (a)(b)(c) in accent.
- 6.8–7.05 in: pills, right-aligned. Template footer below.
- Evaluator sees **first** the band with `0.22` on it; **second** the two chart labels "PAIMANA today: two dates / PRAKALP-DRISHTI adds: the window"; **third** the (a)(b)(c) rows. Column 3 is read last and confirms.

**Charts/diagrams — the completion fan (vector, engine output for 617185, as-of 30 Jun 2026).**
- Time axis Jan 2025 → Dec 2033, year ticks, 10 pt.
- Grey ticks with labels: `sanctioned 24 Mar 2025` · `original 23 Mar 2027` · `revised 30 Sep 2027`; the group labelled above `PAIMANA today: two dates`.
- Band `#DDE9EE` from **P10 7 Feb 2027** to **P95 19 Dec 2032**; darker band (accent, 35% opacity) from P10 to **P80 10 Nov 2031**; solid accent tick at **P50 15 Nov 2028** labelled `P50`; the band labelled above `PRAKALP-DRISHTI adds: the window`; on the band `P(meet Sep 2027) = 0.22`.
- No legend box; height ≈ 2.4 in.

**Evidence.** PS text (April 2026 figures) · `artifacts/aft_survival.json` (2,103 obs; 1,988 censored) · corpus CSV (2,207 rows; 164 at ≥ 100%) · `KaalChakraEngine.forecast_project("617185")` (all dates; `prob_target_met_official` 0.222) · `artifacts/conformal_calibration.json` (50.84 → 79.03; n_test 596) · `artifacts/overrun_models.json` (`ml_vs_conventional` 2.57%; `cuf_vs_external_ablation`; `slip_months.deployable = false`) · Ram Singh (2010) for the fields named in row (c).

**Judge takeaway.** They replace a promised date with a calibrated window on my own register, and they measured whether AI helps before claiming it.

**Speaker narrative.** "PAIMANA tracks 1,981 projects worth ₹42.78 lakh crore and records every slip faithfully — after it happens. The reason nobody can say which project slips next is on the strip: 1,988 of the 2,103 projects in the public register are still running. Here is one of them. Kurnool-IV transmission — sanctioned March 2025, ₹5,550 crore, a quarter built, not yet late. PAIMANA holds two dates: March and September 2027. Our band puts the median at November 2028 and the chance of meeting September 2027 at 22 percent. That is early warning before the slip. Why there? A quarter built in fifteen months against a two-year plan, in a sector with few completions — so the band is wide, and we say so. And the band is not a drawing: on 596 held-out projects the window covers 79 percent of official targets, up from 51 before calibration. What we deliver is an annex to your monthly report — this window for every project, a cost forecast benchmarked against your sector averages, a ranked queue with a reason per rank, a bilingual briefing where every sentence cites a hashed fact. Your problem statement asked three questions; column two answers each with a measurement, including that boosting beats OLS by only 2.6 percent on cost and that no regression was deployable for time. We put that on the slide on purpose. Column three is what makes us different: censored data handled, results measured, everything reproducible."

---

### Slide 3 — TECHNICAL APPROACH

**Final copy**

Sub-heading (18 pt): `Censored → calibrated → benchmarked, on the CUF fields`

*Technologies to be used* (one line, 11 pt):
```
Python · pandas · scipy (penalised MLE, HiGHS) · scikit-learn (boosting, OLS) · FastAPI · PostgreSQL · React · Docker · optional open-weight LLM — demo: hosted API on public data; pilot: local or none
```

*Methodology and process for implementation* — the pipeline diagram; three lines beneath (11 pt):
```
Validation       chronological split · 12 leakage columns named · MAE vs naive, sector-mean and OLS · window coverage measured on 596 held-out projects
Reproducibility  fixed seeds · byte-identical artifacts across machines · 140 automated checks
Honest ceiling   boosting beats OLS by only 2.6% on cost · externals, as constructed, −3.8% on cost, worse on time · slip-month models not deployed (calendar identity) — time rests on the survival model
```

**Visual composition.**
- 0.9–1.2 in: sub-heading; technologies line at 1.25 in.
- 1.5–5.4 in, left 68% (0.5–9.2 in): the pipeline, six stages left → right, stage 4 with two stacked branches; the two 28-pt accent numbers at the right end of each branch.
- 1.5–5.4 in, right 32% (9.4–12.8 in): two dated prototype stills stacked, one-line captions.
- 5.5–6.9 in: the three text lines, full width.
- Evaluator sees **first** `79.0%` and `−12%`; **second** the leakage-guard box with its named columns and the split years; **third** the stills proving it runs.

**Charts/diagrams — the pipeline (exact nodes; arrows labelled).**
1. `PAIMANA public register` — `2,207 rows · 25 CUF fields · 2,103 usable` → *rows* →
2. `Leakage guard` — `12 future-dated columns removed: RevisedCost, RevisedDate, Expenditure, COST_OVERRUN…` → *features: cost · planned months · progress · sanction year · sector · agency* →
3. `Chronological split` — `cost: train sanctions ≤ 2020 (792) · test 2020–21 (265)` / `window: calibrate 596 · test 596` → *time* ↗ · *cost* ↘
4a. **Time** — `Log-logistic AFT, right-censored · 115 events · 1,988 censored` → *raw median* → `Split-conformal on the median` → *P10 · P50 · P80 · P95* → **`79.0%`** (28 pt accent) · sub-label `official revised targets covered · 50.8% uncalibrated · nominal 85% · n = 596`
4b. **Cost** — three bars `sector mean 18.49` (grey) · `OLS 16.67` (grey) · `boosting 16.24` (accent), axis label `MAE, % revised-cost overrun at snapshot · projects ≥ 5 yrs · n = 265` → **`−12%`** (28 pt accent) · sub-label `vs the sector-average forecast · −2.6% vs OLS`
→ both branches → *scores + drivers* →
5. `Risk queue` — `weights set by the Ministry · reason per project` → *facts (hashed)* →
6. `Officer-facing outputs` ⟨changed — the pipeline now ends at the user, as the PS's "decision-support" wording requires⟩ — `queue · windows + drivers · briefing EN / HI` → *monthly* → `PAIMANA annex`
Hierarchy: stages 1–3, 5–6 grey outline; stage 4 branches ink outline; only the two numbers and the boosting bar in accent. If the reference-class interval baseline is computed before export (pre-flight item 8 in the master), it is drawn as a third bar in 4a; otherwise 4a shows the number and sub-label only.

**Stills.** (i) Early-warning queue — ranked list with band, priority and reason chips; caption `Early-warning queue — a reason per rank · prototype, <date>`. (ii) Project page 617185 — fan and cited facts; caption `Project 617185 — window and cited facts · prototype, <date>`.

**Evidence.** `artifacts/overrun_models.json` (`leakage_excluded_columns`, `cuf_features`, `train_year_range`, `test_year_range`, `n_train` 792, `n_test` 265, `cuf_only` MAEs, `ml_vs_conventional`, `cuf_vs_external_ablation`, `slip_months.deployable`, `calendar_identity`) · `artifacts/conformal_calibration.json` (`uncalibrated_coverage_on_test` 0.5084, `empirical_coverage_on_test` 0.7903, `n_calibration` 596, `n_test` 596, `target` = official revised date) · `artifacts/aft_survival.json` · `CLAIMS.md` (140 checks) · `tests/test_engine_precision.py` (shuffled-corpus invariance).

**Judge takeaway.** Chronological, leakage-named, censoring-aware, coverage-measured, three baselines — this is how I would have evaluated it, and it is running.

**Speaker narrative.** "Left to right. The public register: 2,207 rows, 25 CUF fields. First we remove twelve columns that only exist after the outcome — revised cost, revised date, expenditure — because a model that sees them is reading, not predicting. Then we split by time: train on sanctions up to 2020, test on 2020 to 2021. Two branches. Time: a log-logistic survival model that treats the 1,988 unfinished projects as censored, then conformal calibration on the model's own median. That gives the first number: the window covered 51 percent of held-out official revised targets before calibration and 79 after, against a nominal 85 — we show the gap, and we say 'revised targets' because actual completion dates exist for only 115 projects. Cost: sector mean, OLS, boosting on the same 265 projects — 18.5, 16.7, 16.2. Twelve percent better than the sector average the Ministry effectively uses; only 2.6 percent better than OLS, which is why the regressor is not the innovation — the calibration is. Both branches feed a queue with Ministry-set weights and a reason per project, and the officer-facing outputs: queue, windows with drivers, bilingual briefing citing hashed facts. On the right, the prototype — the queue and the project page from slide two. Everything regenerates from a seed, byte-identical on any machine."

---

### Slide 4 — FEASIBILITY AND VIABILITY

**Final copy**

Sub-heading (18 pt): `Fits beside PAIMANA as it is — four limits, stated first`

*Analysis of the feasibility of the idea* (left column, 11 pt) ⟨changed — "Remaining" made explicit; the NIC roadmap quote moved to the diagram caption; feasibility requirement: built / remaining / pilot / infrastructure / users⟩
```
• Built — 20-screen working prototype · ~93 API endpoints · 140 automated checks · Docker image · pinned open-source stack
• Remaining — monthly ingest from the Flash Report archive · queue backtest · recalibration on actual completion dates · NIC SSO · Hindi review
• Pilot — one ministry's projects, one quarter · users: IPMD monitoring officers; line-ministry PMG cells read the annex · owner: IPMD
• Runs on — one NIC Cloud VM, no licences, no external API · outputs as plain tables SSRS reads · roles server-side
```

*Potential challenges and risks* → *Strategies for overcoming these challenges* (right, four rows, 11 pt)
```
1  One snapshot, no monthly panel yet; windows are wide (mean 101 months)   →  ingest the Monthly Flash Report archive; add month-over-month features; same protocol
2  Queue weights are declared policy, not yet outcome-validated             →  cross-sectional backtest now; temporal backtest on OCMS history; Ministry sets weights
3  Cost model tested on sanctions ≤ 2021; 55% of the portfolio is 2021–24   →  young projects fall back to the sector prior, flagged "prior-dominated", never scored safe
4  Self-reported inputs; missing fields                                      →  validation scanner; missing signals shown as "not reported", never silently zero
```

Diagram caption (10 pt, grey): `NIC on PAIMANA's Way Forward (Oct 2025): "AI-driven forecasting… to predict time and cost overruns, resource needs, and potential risks"`

Bottom line (11 pt, grey):
```
What we refuse to claim: sub-metre satellite verification · fraud verdicts — the 20% CCEA bunching test returned p = 0.68 and we report it as null
```

≈ 165 words.

**Visual composition.**
- 0.9–1.2 in: sub-heading.
- 1.3–3.9 in: the deployment diagram across the full width; its caption at 3.95 in.
- 4.15–6.7 in: left column 40% (feasibility, four bullets), right column 60% (four risk rows).
- 6.8–7.05 in: the refusal line.
- Evaluator sees **first** the small accent annex box beside the large grey PAIMANA box; **second** "Built / Remaining"; **third** risk row 1 and the refusal line.

**Charts/diagrams — deployment beside PAIMANA (exact nodes).**
- Large grey box, left (≈ 2.5× the annex): `PAIMANA` — `NIC Cloud · MS SQL · SSRS dashboards · IPMP API feed (64% of projects auto-updated)`.
- Arrow → `monthly CUF export / REST`.
- Small accent-outlined box, right: `Annex — one container (FastAPI + models) + PostgreSQL` — `roles: viewer / analyst / admin · no external calls · all open-source`.
- Three arrows out: `queue` · `windows + drivers` · `briefing EN / HI`, small label `plain tables — SSRS-readable`, converging on a grey box `Project Monitoring Report · line-ministry dashboards · IPMD officer`.
- Dashed box beneath: `Needed from MoSPI: OCMS history incl. actual completion dates (to recalibrate against completions, not targets) · monthly archive · CUF fields the literature names — land-acquisition status, clearance dates, milestone dates, monthly expenditure (untested by us)`.

**Evidence.** NIC Informatics, "PAIMANA Portal", Oct 2025 (stack; Way Forward quote) · PIB Release ID 2244898, 25 Mar 2026 (IPMP; 64%) · `Dockerfile`, `requirements.txt`, `backend/auth.py`, `modules/ingest/` · `CLAIMS.md` §2, §3, §4b (p = 0.68) · `artifacts/conformal_calibration.json` (`mean_band_width_months` 100.86) · corpus sanction years (2021–24: 1,208 of 2,207) · `artifacts/aft_survival.json` (`sector_detail` evidence flags).

**Judge takeaway.** It fits beside PAIMANA without touching it, runs on what NIC already has, and they told me what is built, what remains, and what it cannot do yet.

**Speaker narrative.** "PAIMANA runs on NIC Cloud with MS SQL and SSRS and takes a monthly CUF feed — and NIC's own write-up names AI-driven forecasting as the next step. We sit beside it as one container and one database, take the export, and return three things as plain tables SSRS can read: the queue, the windows with drivers, the briefing. Built: twenty screens, ninety-three endpoints, a hundred and forty checks, a Docker image. Remaining: monthly ingest, the queue backtest, recalibration on actual completion dates, NIC's SSO, Hindi review. The pilot is one ministry, one quarter, used by IPMD monitoring officers, read by the PMG cells, owned by IPMD. Now the four things we cannot do yet, before you ask. One: we have a snapshot, not a monthly panel, so the windows are wide — a hundred months on average; the Flash Report archive fixes that and the protocol does not change. Two: the queue weights are declared policy, not fitted; we backtest, you set them. Three: the cost model was tested on projects sanctioned up to 2021; for the younger half of the portfolio it falls back to the sector prior and says so. Four: inputs are self-reported; missing is shown as missing, never as safe. And two refusals: no sub-metre satellite claims, and no fraud verdicts — the bunching test at the twenty-percent cap came back null, and we report it as null."

---

### Slide 5 — IMPACT AND BENEFITS

**Final copy**

Sub-heading (18 pt): `From description to intervention — measured, not projected`

Three pairs (28 pt numbers; 10 pt labels):
```
50.8% → 79.0%      official revised targets covered by the P10–P95 window · nominal 85% · n = 596
100 → 22.7 months  median error of P50 vs official revised target · n = 596
18.49 → 16.24%     revised-cost overrun MAE, sector-average forecast → ours · OLS 16.67 · n = 265
```

*Potential impact on the target audience* (11 pt)
```
• IPMD monitoring officers — which projects to escalate this month, and why: computed, not compiled
• Line ministries / PMG cells — a calibrated window and a driver list per project, instead of a promised date
• DIID statisticians — every number reproducible; models, baselines and limits documented
```

*Benefits of the solution* (11 pt) ⟨changed — "Pilot will measure" made explicit; impact requirement⟩
```
Governance — ranked, reasoned, contestable; audit trail per figure
Economic — earlier intervention on the ₹42.78 lakh crore portfolio; no saving is claimed
Pilot will measure — officer review time per month · escalations raised before the slip · window coverage against actual completions
Social — English / Hindi briefings (Hindi templates, pending official review); plain-language reasons · Environmental — no claim
```

≈ 105 words.

**Visual composition.**
- 0.9–1.2 in: sub-heading.
- 1.3–3.7 in: three before/after bar pairs side by side, each on its own scale; "today" bars grey, "annex" bars accent; number pair above each in 28 pt; label beneath in 10 pt grey; dashed line at 85% on pair 1 labelled `nominal`; thin grey marker at 16.67 on pair 3 labelled `OLS`.
- 3.9–6.9 in: left 48% the officer strip (three small dated stills with labelled arrows); right 52% the two pointer lists.
- Evaluator sees **first** `50.8% → 79.0%`; **second** the OLS marker sitting next to our bar (honesty is visible); **third** "Pilot will measure" and "Environmental — no claim".

**Charts/diagrams.**
- Pair 1 (%): 50.84 → 79.03; reference line 85.
- Pair 2 (months, lower is better): 99.95 → 22.71.
- Pair 3 (% MAE): 18.495 → 16.24; marker at 16.67.
- Officer strip: `Report — 1,981 rows` → *rank* → `Queue — ranked, a reason per project` → *draft* → `Escalation note — EN / HI, every sentence cites a fact`; stills: queue (small), a project's driver list, a generated briefing with one fact citation highlighted.

**Evidence.** `artifacts/conformal_calibration.json` · `artifacts/overrun_models.json` · PS text (₹42.78 lakh crore) · prototype stills.

**Judge takeaway.** The report changes from "what slipped" to "what will slip, by how much, with what confidence, and which to act on" — the improvement is measured with n, and the rest is what the pilot measures.

**Speaker narrative.** "Three numbers, all on held-out projects. Coverage of official revised targets by the window: 51 percent before calibration, 79 after, against a nominal 85 — we show the gap. Median error of the P50 against the revised target: 100 months down to 23. Cost overrun: 18.5 percent error for the sector-average forecast the Ministry effectively uses today, 16.2 for ours — and 16.7 for plain OLS, drawn right there, which is why we do not call the regressor the innovation. Below, what the officer gets: the 1,981-row report becomes a ranked queue with a reason per rank, and the escalation note drafts itself with every sentence citing a fact. We claim no rupees saved. The pilot will measure three things: officer review time per month, escalations raised before the slip, and window coverage against actual completions. We would rather show you three honest numbers than one invented one."

---

### Slide 6 — RESEARCH AND REFERENCES

**Final copy**

Sub-heading (18 pt): `Read · Rerun`

*Details / Links of the reference and research work*

Left — **Read** (11 pt)
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

Right — **Rerun** (Consolas 11 pt, accent-bordered box)
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

**Visual composition.** Two columns 58 / 42 from 1.2 to 6.9 in. Left: three groups with small accent group labels. Right: one bordered mono box, accent border, generous padding, nothing else. Evaluator sees **first** the Rerun box; **second** Ram Singh's line; **third** the corrections line.

**Charts/diagrams.** None.

**Evidence.** The references; the repository; `CLAIMS.md`.

**Judge takeaway.** They read the literature on our own data, defined "conventional statistics" properly, and I can rerun their numbers in three commands.

**Speaker narrative.** "Two columns. Read: Ram Singh's 2010 paper on this very database; Flyvbjerg's reference-class forecasting, which is what we mean by conventional statistics; the survival and conformal method papers; and the Ministry's own documents on PAIMANA. Rerun: the repository, the claims ledger with our corrections on record, and three commands that regenerate every number in this deck from seed 42. If any number does not match, that is our defect, and we stand by the code."

---

## FINAL RED-TEAM

*A DIID/IPMD evaluator, hundreds of submissions in, opens the PDF.*

1. **What do I understand in 3 seconds?** A real project from my register with two dates I recognise and a band I do not — and "0.22". Fixed within the deck: the chart now labels the ticks "PAIMANA today: two dates" and the band "PRAKALP-DRISHTI adds: the window", so the limitation and the intervention are read from the figure, not the columns.
2. **What makes this different?** Row (b): the team measured its own AI against my sector averages and OLS and printed the small gain. No other deck will. Fixed: the calibration gain (51 → 79%) now leads the row; the 2.6% follows it.
3. **What proves they built it?** Two dated stills on slide 3, three on slide 5, a live link, a repository, three commands. Vulnerability outside the deck: the live host was unreachable on 16 Sep — the pre-flight (warm host + static fallback) is mandatory, not optional.
4. **What technical claim would I challenge?** "Coverage 79%" — of what? Fixed: every occurrence says "official revised targets", slide 3's sub-label says no completion dates exist for ongoing projects, and slide 4 asks for OCMS completion dates to recalibrate.
5. **What number would I question?** 2,207 vs my 1,981. Fixed: the strip reconciles scope and month in one clause; the repository reconciliation note is a pre-flight item.
6. **What would make me distrust the team?** A slide that says "run locally" while the demo calls a foreign API; README counts that disagree with the ledger; a placeholder video link. Fixed in the deck (technologies line; no placeholders); the README reconciliation is pre-flight.
7. **Strongest reason to shortlist:** the only entry that answers dimensions (a)(b)(c) with measurements on my data, handles the 94% censoring correctly, states four limits before impact, and invites me to rerun the numbers.
8. **Strongest reason to reject:** no monthly panel; the queue is unvalidated; the example project's sector is prior-dominated; the window is wide. All four are conceded on the slides, which is the most a deck can do — a rival with a monthly panel *and* equal honesty would beat us on rigour, and none read today has both.

**Top remaining vulnerabilities (cannot be fixed by copy):** (i) demo host reliability; (ii) no monthly panel until the Flash Report archive is ingested; (iii) queue without an outcome backtest; (iv) coverage measured against revised targets, not completions; (v) no IPMD user contact; (vi) mean band width 101 months; (vii) the reference-class interval baseline not yet computed — the one piece of evidence that would still raise the technical score, whichever way it comes out.

---

## FINAL LOCK

The following must not change during design or export:

1. **Six slides, the template's section titles and pointer headings verbatim, PDF only.** No seventh slide, no renamed pointers, no PPTX upload.
2. **The example is 617185 (Kurnool-IV REZ transmission) with the engine's dates and 0.22**, re-pulled from `forecast_project("617185")` on export day; if the engine's output changes, the slide changes to match — never the reverse.
3. **Every number on the slides is exactly the registry value** (master Part 0.3): 1,981 · ₹37.13 → ₹42.78 · 2,207 / 164 / 2,103 / 1,988 / 115 · 12 leakage columns · 792 / 265 · 596 / 596 · 50.8 → 79.0 (nominal 85) · 100 → 22.7 · 22.41 / 18.49 / 16.67 / 16.24 · −12% / −2.6% · −3.8% · 140 · ~93 · ~20 · 64% · p = 0.68 · mean width 101 months · 55%.
4. **The labels "official revised targets", "revised-cost overrun at snapshot · projects ≥ 5 yrs", "as constructed", "Hindi templates, pending official review", "no claim", and the refusal line stay** — they are what make the honest numbers believable.
5. **Row (b) leads with calibration; the 2.6% and "time: no regression deployable" stay on the slide.** The OLS bar and marker stay drawn beside ours on slides 3 and 5.
6. **The four risk rows and the "Needed from MoSPI" box stay before any impact claim.**
7. **No engine names, no logos, no icons, no stock imagery, no gradients, no animation; one accent colour, once per slide; nothing under 11 pt; no placeholders** — the video pill is omitted unless a recording exists.
8. **Slide 6's three commands and the corrections line stay.**
9. **The idea title and description entered on the portal are exactly the text in the master's Part 7 §1** (with "official revised targets" and "no regression model was deployable for time overrun").
10. **Pre-flight is part of the deck:** host awake plus static fallback; README/CLAIMS/scripts reconciled; reconciliation note published; three dated stills; fan re-pulled; numbers checked against sources; six pages; portal fields pasted exactly.

*This specification is saved as `docs_and_presentations/SIH26103_ULTIMATE_DECK.md` and is the build target; the master document remains the source for every number and every reason.*
