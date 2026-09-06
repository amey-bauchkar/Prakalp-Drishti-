# CLAIMS LEDGER — PRAKALP-DRISHTI

**Purpose.** One page that states, per engine, exactly what is **fitted**, what is
**heuristic**, and what is **refused**. If a claim in `README.md`, `solution.md` or a
slide is not supported here, this file wins and the claim is wrong.

**Why it exists.** An earlier revision corrected four overclaimed labels inside the
source docstrings, but `README.md` and `solution.md` were rewritten afterwards and
re-asserted the retracted versions. A reader who opened `kaal_chakra.py` after reading
the README found the code contradicting the pitch — which reads as *knowing* overclaim,
not as rigour. This ledger removes the gap and keeps it removed.

Last reconciled: 2026-08-31 · Tests: 476/476 assertions, 11/11 suites.

---

## 1. FITTED — estimated from data by an actual procedure

| Claim | Procedure | Measured result | Evidence |
|:---|:---|:---|:---|
| **Log-logistic AFT survival model** | Penalised MLE with right-censoring, `scipy` L-BFGS-B. Group effects under a Normal(0, τ²) prior; τ chosen by 5-fold CV held-out log-likelihood | 2,148 projects — **160 observed completions, 1,988 right-censored** (7.4% event rate). τ = 0.2, σ = 0.332, baseline multiplier 3.47× planned | [`aft_survival.py`](analytics_engine/aft_survival.py), [`aft_survival.json`](artifacts/aft_survival.json) |
| **Split-conformal interval on schedule slippage** | Split-conformal CQR (Romano, Patterson & Candès, NeurIPS 2019). Disjoint 900/450/450 train/calibration/test. Score `max(q̂₀.₀₅−y, y−q̂₀.₉₅)`; finite-sample rank ⌈(n+1)(1−α)⌉ | **93.3% measured coverage** on 450 held-out projects (84.7% uncalibrated). Q = 5.185 months. **Scope: see §4a — this number belongs to the slippage interval, not to the served P10–P95 fan** | [`conformal_calibration.py`](analytics_engine/conformal_calibration.py) |
| **Cost-overrun predictor** | Gradient boosting, **chronological** train/test split, 5-year maturity gate, 12 leakage columns excluded | MAE 16.24 vs 22.41 naive. **R² = −0.044** — see §4 | [`overrun_models.py`](analytics_engine/overrun_models.py) |
| **Two-stage stochastic LP** | HiGHS simplex via `scipy.optimize.milp` with `integrality=0`. CVaR₉₀ by Rockafellar–Uryasev auxiliary variables | Duals taken from a `linprog(method="highs")` solve of the same program. **Complementary slackness verified** at κ = 0.5: π_budget > 0 exactly when the budget binds (2.233 at ₹2,000 Cr → 1.216 at ₹10,000 Cr → 0.773 at ₹20,000 Cr → 0.000 once the pool passes ≈₹34,919 Cr and absorptive capacity binds instead). No dual is ever synthesised — if the LP fails, none is reported | [`vitta_vyuha.py`](analytics_engine/vitta_vyuha.py) |
| **Shapley criticality** | Permutation Monte Carlo Shapley over the reachability game **v(S) = Σ cost over ⋃(descendants(i) ∪ {i}) for i ∈ S**, seeded (`default_rng(42)`), M = 30 | Marginals telescope to v(N) by construction; verified **exactly equal to enumerated Shapley** (max error 0.00e+00) on a 6-node test DAG, and isolated projects receive exactly their own cost. Raw v(N) = ₹47.44 L Cr (the full portfolio), rescaled to ₹23.97 L Cr locked. Rank-stable across seeds at M=30 (Spearman ρ ≈ 0.998, identical argmax vs M=2000) | [`setu_graph.py`](analytics_engine/setu_graph.py) |

### What the AFT fit does *not* establish

At a 7.4% event rate the fitted **median is extrapolated past the observed follow-up
window** for most groups. Only **Roads & Highways (145 completions)** carries enough
events to move on its own evidence — it fits to 2.70× against a 3.47× pooled baseline.
Every other sector sits near that baseline **because the prior put it there**. The
artifact publishes each group's event count and an explicit `"data"` /
`"prior-dominated"` tag; 18 of 19 sectors are tagged prior-dominated. Read the tag before
quoting a multiplier.

The 3.47× baseline is also *higher* than the 1.64× median of projects that have actually
finished. That is the censoring correction working as intended — finishers are a
biased-fast subsample — not an inflated number.

---

## 2. HEURISTIC — engineered, defensible, but not fitted

| Component | What it actually is | Why it is not called more |
|:---|:---|:---|
| **"Bayesian Progress Conditioning"** | Convex blend `(1−w)·AFT_prior + w·earned_value`, `w = progress/100` clipped to [0.05, 0.95] | Correctly engineered, but **there is no posterior**. It is not Bayesian inference and is not labelled as such in code. |
| **Fine-Gray competing-risk attenuation** | Bounded foreclosure probability from reset count and overrun, clamped to [0.0, 0.35] | Fine-Gray **-style**. No sub-distribution hazard is fitted; the corpus has no competing-event labels. |
| **DPR / election-rush scoring** | Deterministic flags computed from sanction dates against assembly-election windows | Superseded by `KARYA-DAKSHATA`. The previous `modules/soham/` implementation returned `np.random.uniform(42, 64)` as a "DPR quality score" and has been **deleted**, not patched. |
| **Satellite stage classification** | NASA-IBM Prithvi-EO backbone, band-sliced to RGB, distant supervision | Deliberately **not** called "fine-tuned" — see §3. |

---

## 3. REFUSED — capabilities the data cannot support

These are stated as refusals because implementing them would require asserting precision
the sensor or corpus does not carry.

| Refused claim | Reason | Where enforced |
|:---|:---|:---|
| **Sub-metre change detection** | Measured GSD is **2.08–2.35 m/px**. Sub-metre inference from 2 m imagery is fabrication. | [`satellite_precision_engine.py`](analytics_engine/satellite_precision_engine.py) |
| **NDVI / NDBI / NDWI indices** | ESRI basemap tiles carry **RGB only**. No NIR/SWIR band exists to compute them. | same |
| **s2cloudless / orthorectification** | Requires Sentinel-2 band stacks and a DEM; neither is present. | same |
| **"Fine-tuned" Prithvi** | No labelled ground-truth corpus for Indian construction stages. Distant supervision is used and named as such. | [`stage_classifier.py`](analytics_engine/stage_classifier.py) |
| **Actual completion dates** | MoSPI records none for ongoing projects. Completed rows use the final revised target as a proxy; ongoing rows are right-censored. | [`aft_survival.py`](analytics_engine/aft_survival.py), [`conformal_calibration.py`](analytics_engine/conformal_calibration.py) |
| **MILP** | All decision variables are continuous. It is an **LP**. | [`vitta_vyuha.py`](analytics_engine/vitta_vyuha.py) |

---

## 4. THE COST-OVERRUN MODEL, STATED AGAINST EVERY BASELINE

Reporting a single "lift" number invites the question of which baseline it beat. All
three are published, chronologically split, on the same 265 held-out projects:

| Baseline | MAE | Our lift over it |
|:---|:---:|:---:|
| Naive train-mean | 22.413 | **27.5%** |
| Sector-mean (an officer can compute this by hand) | 18.495 | **12.2%** |
| Conventional method (`ml_vs_conventional`) | — | **2.57%** |
| **Gradient boosting (deployed)** | **16.240** | — |

**R² is −0.044 and that is not hidden.** R² is measured against the *test* mean, which
nobody possesses at prediction time. Under temporal distribution shift (train cohort mean
+19.6%, test cohort +5.9%) a negative R² alongside a positive MAE lift means the model
beats what an officer could actually do unaided, while still not explaining variance
around a mean it cannot know. Both facts are true and both are published.

**The honest headline is 12.2%, not 27.5%** — the sector-mean baseline is the one a real
officer would use.

**External features do not help.** The IMD monsoon, WPI construction, election-proximity,
PSU-fundamentals, satellite and graph features were ablated and made the model *worse*
(MAE 16.24 → 17.90, **−10.2%**). The artifact records `"external_helps": false` and the
variant selector drops them from the deployed model. They remain valuable as **evidence
and explanation** in the console; they are not load-bearing for this prediction.

**`slip_months` is not served at all.** Chronologically it loses to a train-mean baseline
by 53–191% at every maturity gate. Shipping it would be indefensible. Schedule risk is
served by KAAL-CHAKRA's conformal intervals instead.

---

## 4a. WHAT THE 93.3% COVERAGE NUMBER DOES AND DOES NOT COVER

The measured coverage belongs to **one specific interval on one specific target**, and it
does **not** transfer to the P10/P50/P80/P95 fan the cockpit renders. Stated plainly
because the two were previously described as the same thing:

| | Calibrated object | Served fan |
|:---|:---|:---|
| Target | `slip_months` = RevisedDate − OriginalEndDate | completion **duration from sanction** |
| Estimator | two gradient-boosting quantile regressors, q̂₀.₀₅ / q̂₀.₉₅ | log-logistic quantile `median · (p/(1−p))^γ` |
| Correction | `±Q`, Q = 5.185 months, conformal rank ⌈(n+1)(1−α)⌉ | `[−Q, 0, 0.55·Q, +Q] × rem_uncertainty_scale` |
| Coverage | **93.3%, measured on 450 held-out projects** | **not measured, and not measurable** |

The fan is a *conformally-informed* widening: it borrows the calibrated magnitude Q
instead of the hand-picked `[−3, 0, 4.5, 9]` it replaced, which is a real improvement.
But the `0.55` coefficient on P80 is an engineering choice, `rem_uncertainty_scale` is a
progress-dependent multiplier the calibration never saw, and the quantile function is a
different estimator on a different target. **A coverage figure for the fan cannot be
produced at all**, because the corpus records no actual completion date for an ongoing
project — which is the same censoring fact that motivates the AFT model in the first
place.

So: quote 93.3% for the slippage interval. Do **not** attach it to a P10–P95 date fan.

---

## 4b. THE 20% BUNCHING SIGNAL IS NOT STATISTICALLY SIGNIFICANT

`SATYA-KAVACH` reports a boundary bin-mass ratio at the CCEA 20% re-appraisal threshold.
Measured on the live corpus:

| Quantity | Value |
|:---|:---|
| Revisions in **[18%, 20%)** | **28** |
| Revisions in **[20%, 22%)** | **17** |
| Ratio | **1.65×** |
| **95% confidence interval** | **[0.90, 3.01]** |
| Active revised population | 1,183 |

**The interval contains 1.0.** At n = 45 across the two bins, a 1.65× ratio is not
distinguishable from chance at the 5% level. The engine already returns the CI and
already labels the finding *"a screening indicator, not evidence of intentional
manipulation"* — but the landing page renders `1.65×` as a headline finding without it,
and that is the version a judge will see first.

Correct phrasing: *"1.65× more revisions land just below the Cabinet threshold than just
above (28 vs 17), 95% CI [0.90, 3.01] — suggestive, not significant, and offered as an
audit-triage trigger rather than a finding."*

Any claim of `p < 0.001` for this test is **withdrawn**: it appeared in a superseded
deck, it is not computed anywhere in the code, and it is arithmetically impossible
alongside a CI that spans 1.0.

---

## 5. CRYPTOGRAPHIC & OPERATIONAL

| Claim | Status |
|:---|:---|
| **Merkle audit trail** | **RFC 6962** — leaves `SHA-256(0x00‖data)`, internal nodes `SHA-256(0x01‖left‖right)`, split at the largest power of two. Domain separation blocks leaf/internal second-preimage substitution; the power-of-two split removes the CVE-2012-2459 duplicate-node root collision. Verifier fails **closed** on malformed proofs. Previously cited as "RFC 8785", which is the JSON canonicalisation scheme and not a Merkle construction — that citation was wrong and is withdrawn. |
| **Write-once briefing archive** | Content-addressed, atomic rename. Verified in tests. |
| **Air-gap operation** | Runs with no outbound network. `GROQ_API_KEY` blank is the sovereign default; the copilot answers from locally computed Merkle-signed facts. |
| **RBAC** | `viewer` / `analyst` / `admin` hierarchy, enforced by decorator. |
| **Test suite** | 476/476 assertions, 11/11 suites, enforced in GitHub Actions CI on every push. |
| **Persistence** | **Split write/read paths.** Writes go to **Supabase PostgreSQL (ap-south-1, Mumbai)** — schema migrations `0001`–`0006`, append-only triggers, `REVOKE`-enforced immutability, RLS as defence-in-depth, and a `prev_hash` row chain. Reads are served from an **in-memory pandas frame** rebuilt from that database at startup, which is what delivers the <10 ms query latency. Both paths meet at one seam, `analytics_engine/corpus_source.py`. **The read path is single-process and holds the whole corpus in RAM** — correct at 2,207 rows, but a continuously-ingesting national deployment would need a shared cache or a columnar store. Three services still bypass the seam and read the CSV directly; they are pinned in `tests/test_corpus_source.py::KNOWN_BYPASSES` rather than left undocumented. *(An earlier revision of this row read "there is no database", which predated the PostgreSQL integration.)* |

---

## 6. HOW TO CHALLENGE THIS

Reproduce any fitted number:

```bash
python analytics_engine/aft_survival.py && python analytics_engine/conformal_calibration.py && python tests/verify_features.py
```

Every artifact in `artifacts/` is regenerable from the committed corpus with a fixed seed.
If a number here does not reproduce, that is a defect — report it.
