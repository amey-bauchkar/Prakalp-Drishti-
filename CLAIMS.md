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
| **Conformalised quantile intervals (P10–P95)** | Split-conformal CQR (Romano, Patterson & Candès, NeurIPS 2019). Disjoint 900/450/450 train/calibration/test | **93.3% measured coverage** on 450 held-out projects (84.7% uncalibrated). Q = 5.185 months | [`conformal_calibration.py`](analytics_engine/conformal_calibration.py) |
| **Cost-overrun predictor** | Gradient boosting, **chronological** train/test split, 5-year maturity gate, 12 leakage columns excluded | MAE 16.24 vs 22.41 naive. **R² = −0.044** — see §4 | [`overrun_models.py`](analytics_engine/overrun_models.py) |
| **Two-stage stochastic LP** | HiGHS simplex via `scipy.optimize.milp` with `integrality=0`. CVaR₉₀ by Rockafellar–Uryasev auxiliary variables | Exact duals extracted; κ dial provably changes the objective (asserted in tests) | [`vitta_vyuha.py`](analytics_engine/vitta_vyuha.py) |
| **Shapley criticality** | Permutation Monte Carlo over the dependency DAG, seeded (`default_rng(42)`) | Baked to Parquet, deterministic across runs | [`setu_graph.py`](analytics_engine/setu_graph.py) |

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

## 5. CRYPTOGRAPHIC & OPERATIONAL

| Claim | Status |
|:---|:---|
| **Merkle audit trail** | **RFC 6962** — leaves `SHA-256(0x00‖data)`, internal nodes `SHA-256(0x01‖left‖right)`, split at the largest power of two. Domain separation blocks leaf/internal second-preimage substitution; the power-of-two split removes the CVE-2012-2459 duplicate-node root collision. Verifier fails **closed** on malformed proofs. Previously cited as "RFC 8785", which is the JSON canonicalisation scheme and not a Merkle construction — that citation was wrong and is withdrawn. |
| **Write-once briefing archive** | Content-addressed, atomic rename. Verified in tests. |
| **Air-gap operation** | Runs with no outbound network. `GROQ_API_KEY` blank is the sovereign default; the copilot answers from locally computed Merkle-signed facts. |
| **RBAC** | `viewer` / `analyst` / `admin` hierarchy, enforced by decorator. |
| **Test suite** | 476/476 assertions, 11/11 suites, enforced in GitHub Actions CI on every push. |
| **Persistence** | **In-memory pandas — there is no database.** Correct at 2,207 projects; a production MoSPI deployment ingesting continuously would need one. Stated rather than implied. |

---

## 6. HOW TO CHALLENGE THIS

Reproduce any fitted number:

```bash
python analytics_engine/aft_survival.py && python analytics_engine/conformal_calibration.py && python tests/verify_features.py
```

Every artifact in `artifacts/` is regenerable from the committed corpus with a fixed seed.
If a number here does not reproduce, that is a defect — report it.
