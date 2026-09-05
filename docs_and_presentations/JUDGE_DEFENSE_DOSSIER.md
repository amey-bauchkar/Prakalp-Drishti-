# JUDGE DEFENCE DOSSIER — PRAKALP-DRISHTI

Quick-reference answers to the questions most likely to be asked under pressure.
Every number here is reproducible from the committed corpus. **If you do not know an
answer, say so and offer to show the code — that is on-brand for this project and it
beats a confident guess.**

---

## 1. "Your cost model has a NEGATIVE R². Isn't it worthless?"

**The one-line answer:** R² is measured against the test-set mean, which nobody
possesses at prediction time. Against the baseline an officer could actually compute —
the sector mean — we cut error by 12.2%.

**The numbers** (`artifacts/overrun_models.json`, chronological split, 265 held-out projects):

| Baseline | MAE | Our lift |
|:---|---:|---:|
| Naive train-mean | 22.413 | 27.5% |
| **Sector-mean (what an officer would use)** | **18.495** | **12.2%** |
| Gradient boosting (deployed) | **16.240** | — |

**Why R² goes negative.** Train cohort mean overrun is **+19.58%**; test cohort is
**+5.91%**. That is temporal distribution shift — the later cohort genuinely overran
less. A model calibrated on the earlier regime is systematically high on the later one,
which penalises R² even while absolute error falls. Both facts are published in
`CLAIMS.md` §4; neither is hidden.

**The honest headline is 12.2%, not 27.5%.** Say that before they say it for you.

**If pressed further:** we also ablated external features (IMD monsoon, WPI, election
proximity, PSU fundamentals, EO surface change, graph criticality). They made the model
*worse* — MAE 16.24 → 17.90, −10.2% — so the artifact records `"external_helps": false`
and the variant selector drops them. They remain useful as *explanation* in the console;
they are not load-bearing for the prediction. And `slip_months` is **not served at all**,
because chronologically it loses to a train-mean baseline at every maturity gate.

---

## 2. "Your prediction intervals average 61.8 months wide. Is that actionable?"

**The one-line answer:** The width is the finding. A narrow interval here would be a
lie, and the calibration proves the width is honest.

**The numbers** (`artifacts/conformal_calibration.json`):
- Target coverage 90%; **measured 93.3%** on 450 disjoint held-out projects
- **Uncalibrated coverage was 84.7%** — the raw quantile model was overconfident
- Conformal quantile Q = 5.185 months; mean interval width 61.78 months
- Split: 900 train / 450 calibration / 450 test, disjoint

**The argument.** Split-conformal CQR (Romano, Patterson & Candès, NeurIPS 2019) gives a
*finite-sample, distribution-free* coverage guarantee. We could produce a 12-month
interval trivially — by narrowing until it looked decisive — and it would contain the
truth about half the time. On a portfolio where the median slip among slipped projects
is **19.4 months** and the maximum is **300 months (25 years)**, a wide interval is a
truthful description of Indian mega-project schedule variance, not a modelling failure.

**What it is actually for:** provisioning, not scheduling. An officer asking "what
completion date can I commit to in a Cabinet note without being wrong 1 time in 10?"
gets P95. That is a decision the interval supports and a point estimate does not.

**Concede cleanly:** for a single project the interval is often too wide to plan
against; its value is in ranking and provisioning across the portfolio. Saying this
costs nothing and buys credibility.

---

## 3. "Only 160 completions out of 2,148. Are your sector multipliers real?"

**The one-line answer:** For one sector, yes. For eighteen, no — and the artifact says
so in a machine-readable field before anyone asks.

**The numbers** (`artifacts/aft_survival.json`):
- **160 observed completions, 1,988 right-censored** — a 7.4% event rate
- τ = 0.2 (selected by 5-fold CV on held-out log-likelihood), σ = 0.332
- Pooled baseline multiplier **3.4721×** planned duration
- **Roads & Highways: 145 of the 160 events**, fits to **2.70×** on its own evidence
- **18 of 19 sectors are tagged `"prior-dominated"`** in the artifact

**The argument.** Every group publishes `n_events`, `n_projects`, `se`, and an
`evidence` tag that is either `"data"` or `"prior-dominated"`. A sector sitting near
3.47× is sitting there *because the shrinkage prior put it there*, not because the data
said so — and the artifact states which is which. **Read the tag before quoting a
multiplier** is written into `CLAIMS.md`.

**Why τ was cross-validated, not chosen by hand.** An in-sample criterion monotonically
preferred the loosest prior (τ = 0.8), which handed Coal a 5.57× multiplier off **zero
observed events**. 5-fold stratified CV on held-out log-likelihood selected τ = 0.2 and
that artefact disappeared. This is a good story: it shows the team caught its own
overfit.

**On the 3.47× baseline being higher than reality.** The median *completed* project
finished at 1.64× planned. 3.47× is higher because finishers are a biased-fast
subsample — that is the censoring correction working, not an inflated number.

---

## 4. "What is `BaselineResetCount`? Does 2 mean it was reset twice?"

**No.** It is a **three-level severity tier**, not an event tally:

| Value | Meaning |
|:---:|:---|
| 0 | No revision detected |
| 1 | Rebaselined |
| 2 | Rebaselined **and** true cost overrun > 50% |

The corpus records no reset history, so no true tally can be derived from it. Computed
at `analytics_engine/kaal_chakra.py:161`, where the caveat is written beside the code.

**Never say "reset twice."** Say "rebaselined, severely."

---

## 5. "Where is the intelligence if I remove the LLM?"

**All of it stays.** The copilot only *phrases* facts the engines already computed; it
invents no numbers, and with `GROQ_API_KEY` blank the system answers from locally
computed, Merkle-signed facts with zero outbound calls.

The actual machine learning is the **censored-MLE AFT fit** and the **split-conformal
calibration**. The actual computer science is **Tarjan SCC condensation + Max-Plus float
algebra**, the **HiGHS LP with exact duals**, and the **RFC 6962 Merkle tree**. Delete
the LLM and every quantitative claim in the product survives unchanged.

---

## 6. "Does the satellite layer prove progress?"

**No, and we refuse to claim it does.**

Surface change and reported progress correlate at **r = 0.007** across this corpus —
statistically indistinguishable from noise. A "satellite says 38.4% complete" figure
would be a guess wearing the costume of a measurement. **That figure existed here once
and was removed** because it was 45%-weighted on the very claim it purported to audit.

What imagery *can* answer is **"did anything happen?"** The engine emits evidence
verdicts, never a percentage:

`GROUND_ACTIVITY_OBSERVED` · `NO_ACTIVITY_DETECTED` · `SENSOR_CANNOT_RESOLVE` ·
`NO_IMAGERY_FOR_INTERVAL` · `NOT_MATERIAL`

Only `NO_ACTIVITY_DETECTED` is actionable, and it says **"inspect"**, never "fraud".

**On resolution:** the standard analysis frame is **2.08–2.35 m/px measured** — we
refuse sub-metre *change detection*, and refuse NDVI/NDBI/NDWI because the basemap
carries RGB only with no NIR or SWIR band. A separate z18 display bake reaches 0.539 m/px
for **2 of 70 surveyed sites**, and only those two are described as sub-metre.

---

## 7. "How does this scale?"

**Answer honestly — the weakness is known and bounded.**

Writes go to Supabase PostgreSQL (ap-south-1, Mumbai) with append-only triggers, a
`prev_hash` row chain and RLS. **Reads are served from a single in-memory pandas frame**,
which is what delivers the measured **7 ms** forecast latency. That is correct at 2,207
rows and would not survive continuous national ingestion — a shared cache or columnar
store would be needed, and `CLAIMS.md` says so.

Three services still bypass the read seam; they are pinned in
`tests/test_corpus_source.py::KNOWN_BYPASSES` rather than left to be discovered.

**Do not claim horizontal scalability.** Claim a correct architecture at the current
scale with a named migration path.

---

## 8. "Why should I trust any number on this screen?"

Corpus sealed as an **RFC 6962** Merkle root over canonically-serialised rows:

```
e659bf58f2a62e7d7f530792b54b3159ad68a464e7cbf956c2f02bffb61558e2   (2,207 rows)
```

Leaves are `SHA-256(0x00‖data)`, internal nodes `SHA-256(0x01‖left‖right)`, split at the
largest power of two — domain separation blocks leaf/internal second-preimage
substitution, and the power-of-two split removes the CVE-2012-2459 duplicate-node
collision. The verifier **fails closed** on malformed proofs.

Reproduce any fitted number:

```bash
python analytics_engine/aft_survival.py && python analytics_engine/conformal_calibration.py && python tests/verify_features.py
```

*(Note: an earlier revision cited RFC 8785 for the Merkle construction. RFC 8785 is the
JSON canonicalisation scheme used for row serialisation; RFC 6962 is the tree. The
earlier citation was wrong and is withdrawn — if asked, say this plainly.)*

---

## 9. "What does the system do with an input it doesn't recognise?"

**It refuses.** `/api/amey/forecast`, `/dependencies`, `/satellite` and `/copilot` all
return **HTTP 404** for an unknown project id.

Worth volunteering: an earlier revision fell back to the first row of the corpus, so an
unknown id returned a confident, Merkle-signed forecast for a *different* project. It was
caught in internal audit and fixed — the engines now raise, the routers map to 404, and
`tests/verify_features.py` asserts `status == 404` rather than the previous weaker
`!= 500`. **Volunteering a bug you found and fixed is a credibility gain, not a loss.**

---

## 10. Numbers to have on the tip of your tongue

| Figure | Value |
|:---|:---|
| Sealed corpus | 2,207 projects · ₹47.44 L Cr |
| Ongoing / completed | 2,043 / 164 |
| Late vs **original** Cabinet date | 1,249 of 2,043 (60.9%), mean 41.5 months |
| Late vs **revised** date | 620 |
| **Invisible to a revised-date dashboard** | **629 projects · ₹14.60 L Cr · 50.5% of all late projects** |
| Cost-revised projects | 1,183 · +₹5.66 L Cr (+23.0%) |
| Conformal coverage | 93.3% measured (84.7% uncalibrated) |
| AFT events / censored | 160 / 1,988 (7.4%) |
| MAE lift over sector-mean | 12.2% |
| Test suite | 476 assertions, 19 suites, CI-enforced |
| API surface | 87 endpoints |
| Satellite epochs | 26 dated, 5 sites, from 196 archive releases |
| Measured GSD | 2.08–2.35 m/px |

---

## Before you walk into the room

- [ ] `GROQ_API_KEY` blank in `.env` → `/api/health` must report `offline_air_gapped_mode: true`
- [ ] Supabase password rotated; old credential purged from git history
- [ ] `PRAKALP_SECRET_KEY` set (URL signing now **fails closed** without it)
- [ ] Server restarted **after** the last code change — a stale process serves stale code
- [ ] Do **not** demo the KAAL-DARPAN timeline unless migrations `0005`/`0006` are applied
- [ ] Demo project is **705237** (Western Dedicated Freight Corridor), not 400188
