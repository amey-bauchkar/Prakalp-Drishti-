# Hostile Panel Review of the Final Deck — PS SIH26103

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
