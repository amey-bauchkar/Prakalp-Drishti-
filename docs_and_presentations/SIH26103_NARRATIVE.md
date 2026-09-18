# One Story for PS SIH26103 — the narrative spine

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
