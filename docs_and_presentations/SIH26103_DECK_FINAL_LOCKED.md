# PRAKALP-DRISHTI — Final Locked Deck Specification (PS SIH26103, SIH 2026)

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
