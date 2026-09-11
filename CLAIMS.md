# CLAIMS LEDGER — PRAKALP-DRISHTI

**Purpose.** One page that states, per engine, exactly what is **fitted**, what is
**heuristic**, and what is **refused**. If a claim in `README.md`, `solution.md` or a
slide is not supported here, this file wins and the claim is wrong.

**Why it exists.** An earlier revision corrected four overclaimed labels inside the
source docstrings, but `README.md` and `solution.md` were rewritten afterwards and
re-asserted the retracted versions. A reader who opened `kaal_chakra.py` after reading
the README found the code contradicting the pitch — which reads as *knowing* overclaim,
not as rigour. This ledger removes the gap and keeps it removed.

Last reconciled: 2026-09-11 (post mathematical audit) · Tests: 20 standalone suites + 2 pytest modules (140 passed, 1 skipped), all green at reconciliation.

---

## 1. FITTED — estimated from data by an actual procedure

| Claim | Procedure | Measured result | Evidence |
|:---|:---|:---|:---|
| **Log-logistic AFT survival model** | Penalised MLE with right-censoring, `scipy` L-BFGS-B. Group effects under a Normal(0, τ²) prior; τ chosen by 5-fold CV held-out log-likelihood. Rows whose completion proxy lies after the as-of date are excluded as not yet observed | 2,103 projects — **115 observed completions, 1,988 right-censored** (5.5% event rate; 45 future-proxy rows excluded). τ = 0.15, σ = 0.349, baseline multiplier **3.31× planned — an upper-ish bound, see the survivorship note below** | [`aft_survival.py`](analytics_engine/aft_survival.py), [`aft_survival.json`](artifacts/aft_survival.json) |
| **Split-conformal calibration of the served P10–P95 fan** | Split-conformal on **the engine's own raw median**: residual `r = log(target / raw_median)`, per-level finite-sample quantiles ⌈(n+1)α⌉ for α ∈ {0.10, 0.50, 0.80, 0.95}, applied multiplicatively to the median the cockpit displays. Calibrated on 596 forward-looking projects; **measured end to end on `forecast_project()`** over 596 disjoint held-out projects. Overdue projects (616) are excluded because an overdue official target is censored, not observed, information | Displayed 10–95% band covers **79.0% at a nominal 85%** (50.8% uncalibrated). P50 MAE 22.7 months vs 100.0 raw. Median multiplier exp(q₀.₅) = 0.460: the raw AFT/earned-value median runs late against official targets and the calibration pulls it in. **The earlier 93.3% figure is withdrawn — see §4a** | [`conformal_calibration.py`](analytics_engine/conformal_calibration.py), [`conformal_calibration.json`](artifacts/conformal_calibration.json) |
| **Cost-overrun predictor** | Gradient boosting, **chronological** train/test split, 5-year maturity gate, 12 leakage columns excluded | MAE 16.24 vs 22.41 naive. **R² = −0.044** — see §4 | [`overrun_models.py`](analytics_engine/overrun_models.py) |
| **Mean–CVaR stochastic LP** | HiGHS via `scipy.optimize.milp` with `integrality=0` (an LP). Objective `−(1−κ)·E[scenario yield] + κ·CVaR₀.₉₀(scenario loss)`, both terms in the same yield-weighted-Cr units, CVaR by Rockafellar–Uryasev auxiliaries with η free. Scenario realisation is project-specific, `θ_{s,i} = clip(1 − severity_s·risk_i, 0.05, 1.10)`, with p = (0.50, 0.35, 0.15) and severities (−0.05, 0.15, 0.45) **declared policy, not estimated**, and returned on every result under `cvar_diagnostics` | Duals from a `linprog(method="highs")` solve of the same program; **complementary slackness max\|slack·dual\| = 5.7e-14**. Risk dial is material: at ₹12,000 Cr, κ 0→1 re-routes >100% of the pool-equivalent and tail loss falls 23.9k → 9.4k monotonically (previously the CVaR term moved the allocation 1.2% at any weight and ζ ≡ 0 because every scenario ranked projects identically). The R–U auxiliaries reproduce the tail computed directly from scenario returns on every call. No dual is ever synthesised, and no agency figure is defaulted: an agency absent from the pool has no indicator | [`vitta_vyuha.py`](analytics_engine/vitta_vyuha.py) |
| **Shapley criticality** | Permutation Monte Carlo Shapley over the reachability game **v(S) = Σ cost over ⋃(descendants(i) ∪ {i}) for i ∈ S**, seeded (`default_rng(42)`), **M = 300** | Marginals telescope to v(N) by construction. On a 6-node test DAG the estimator matches **exact enumeration within 0.006 of share** and reproduces the closed form for a sink, φ = cost/(1 + #ancestors) (a sink is *not* zero under this game; an isolated project is worth exactly its own cost). On the full graph, seed-to-seed Spearman ρ = 0.998 overall, 0.995 on the top 200, stable argmax. Values published to 1 d.p. | [`setu_graph.py`](analytics_engine/setu_graph.py), [`test_math_audit.py`](tests/test_math_audit.py) |
| **Dependency graph provenance** | MoSPI publishes no dependency register, so every edge is **inferred from two stated heuristics** and carries its `basis`: sector supply chain within a state (Coal → Electricity Generation → Transmission & Distribution; Shipping → Railways) and same-sector geo-adjacency ≤ 50 km between site-precise coordinates, oriented by a total order (sanction date, then id) so the graph is acyclic by construction and byte-identical across processes | 1,345 edges: 275 supply-chain + 1,070 geo-adjacency; 1,615 site-precise nodes; 1,050 of 2,207 (47.6%) isolated; 0 cycles removed; 11.5% of edges join CSV-adjacent rows. **The previous graph was 96% CSV row order** (1,147 of 1,197 edges chained projects in spreadsheet order) and four of its six sector lookups named sectors absent from the corpus, so no cross-sector edge was ever built. Shapley and cascade figures from that graph are withdrawn | [`setu_graph.py`](analytics_engine/setu_graph.py) |

### What the AFT fit does *not* establish

At a 5.5% event rate the fitted **median is extrapolated past the observed follow-up
window** for most groups. Only **Roads & Highways (101 completions)** carries enough
events to move on its own evidence — it fits to 2.70× against a 3.31× pooled baseline.
Every other sector sits near that baseline **because the prior put it there**. The
artifact publishes each group's event count and an explicit `"data"` /
`"prior-dominated"` tag; 18 of 19 sectors are tagged prior-dominated. Read the tag before
quoting a multiplier.

**Survivorship: the baseline is an upper-ish bound, not a point estimate.** Right-censoring
corrects one bias (finishers are a biased-fast subsample) and the 3.31× baseline is
higher than the finishers' median for that reason. It does **not** correct the opposite
bias: MoSPI's register retains ongoing projects and sheds completed ones, so cohorts
sanctioned in 1980–2004 show **0 completions in 20 projects** and 2005–2009 shows 9 in 61
(`aft_survival.json → survivorship`). Projects that finished years ago are simply not in
the file, the sample is survivor-biased toward slow projects, and the multiplier is
inflated accordingly. An earlier revision of this file called the baseline "not an
inflated number"; that sentence is withdrawn.

---

## 2. HEURISTIC — engineered, defensible, but not fitted

| Component | What it actually is | Why it is not called more |
|:---|:---|:---|
| **"Bayesian Progress Conditioning"** | Convex blend `(1−w)·AFT_prior + w·earned_value`, `w = progress/100` clipped to [0.05, 0.95] | Correctly engineered, but **there is no posterior**. It is not Bayesian inference and is not labelled as such in code. |
| **Fine-Gray competing-risk attenuation** | Bounded foreclosure probability from reset count and overrun, clamped to [0.0, 0.35] | Fine-Gray **-style**. No sub-distribution hazard is fitted; the corpus has no competing-event labels. |
| **DPR / election-rush scoring** | Deterministic flags computed from sanction dates against assembly-election windows | Superseded by `KARYA-DAKSHATA`. The previous `modules/soham/` implementation returned `np.random.uniform(42, 64)` as a "DPR quality score" and has been **deleted**, not patched. |
| **Satellite stage classification** | NASA-IBM Prithvi-EO backbone, band-sliced to RGB, distant supervision | Deliberately **not** called "fine-tuned" — see §3. |
| **VITTA-VYUHA scenario model** | Three states (as planned / mild / severe slippage) with p = (0.50, 0.35, 0.15) and severities (−0.05, 0.15, 0.45) applied per project as `1 − severity·risk_i` | **Declared policy.** MoSPI publishes no realised-yield history to estimate a loss distribution from. Exposed on every result under `cvar_diagnostics` so the tail the optimiser guards against is visible. |
| **SETU-VARSHA working-window model** | Per-state base lost days and rainfall elasticity (`STATE_GEO_PROFILES`), hop attenuation 0.85, 24 nominal remaining months at 0% progress, capital fully locked at 48 months of delay | **Declared expert constants**, not fitted: no per-state construction-downtime series exists. The IMD 2005–2025 matrix supplies the anomaly history they are applied to. Previously described as "calibrated to Indian climatic zones", which implied a fit that never happened. |
| **SATYA-KAVACH review priority** | 0–100 triage order for the [18%, 20%) band: proximity to the threshold (max 60) + revised cost above the Clause 10CC cap as a share of original cost (max 40) | **Declared 60/40 weights.** A triage order, not a probability and not a finding; previously named "suspicion score", which it is not. Intent is never inferred. |
| **Priority score in the early-warning queue** | `risk_score × log10(1 + capex_cr)` | Cost enters logarithmically so a ₹20,000 Cr project cannot outrank every risk signal by size alone. Previously `score·√cost/100`, under which ρ(priority, capex) = 0.955 and ρ(priority, risk) = 0.576; now 0.685 and 0.901. |

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
| **Satellite-derived completion percentage** | Surface change and reported progress correlate at **r = +0.004** (Pearson, p = 0.87) across 1,588 site-level projects. The figure is computed from the catalogue, persisted with the catalogue's hash, and cited from the artefact by every module — never quoted from memory. | [`eo_independence.py`](analytics_engine/eo_independence.py), [`eo_progress_independence.json`](artifacts/eo_progress_independence.json) |
| **Granger causality between PSU equity stress and project delay** | No quarterly leverage series exists to test it on. The landing page previously advertised "Granger-causal"; removed. | [`frontend/amey/index.jsx`](frontend/amey/index.jsx), [`modules/parth/service.py`](modules/parth/service.py) |
| **"Suspicious", "evasion", "gaming", "artificial" as findings** | A density discontinuity at a threshold shows the threshold shapes where revisions land; it does not show intent. The engine and the UI describe position relative to the threshold and stop there. | [`mccrary.py`](analytics_engine/mccrary.py), [`modules/tanmay/service.py`](modules/tanmay/service.py) |

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

**`slip_months` is not served at all.** Its apparent accuracy is a calendar identity
(`RevisedDate − OriginalEndDate` with `OriginalEndDate` recoverable from the features);
with the calendar anchor removed it loses to a train-mean baseline by 53–191% at every
maturity gate. Schedule risk is served by KAAL-CHAKRA's calibrated fan instead.

**"Deployable" is a measured decision, not a declaration.** A target ships only if the
served model beats both the train-mean and the sector-mean baselines on the chronological
held-out slice and, where a calendar identity applies, the calendar-free refit still
beats the train mean. The criteria and the numbers they were evaluated on are written to
`overrun_models.json → deployable_basis` for both targets.

---

## 4a. THE FAN'S COVERAGE IS NOW MEASURED ON THE FAN — AND 93.3% IS WITHDRAWN

The 93.3% previously quoted belonged to a gradient-boosting interval on `slip_months`
that the cockpit never displayed. The fan it *did* display, re-measured on the same
held-out projects, covered the observed target **19.8%** of the time. A coverage
guarantee is a property of one specific interval and does not transfer to another.

The calibration now targets the displayed quantity directly:

| | Now |
|:---|:---|
| Calibrated object | `KaalChakraEngine.raw_median_months` — the blended AFT / earned-value median the cockpit shows |
| Residual | `r = log(official revised target / raw_median)` |
| Correction | per-level multipliers exp(q_α), finite-sample rank ⌈(n+1)α⌉, α ∈ {0.10, 0.50, 0.80, 0.95} |
| Population | 1,192 projects whose official target lies **ahead** of the as-of date; 616 overdue projects excluded — an overdue target is censored information, and for them the displayed P10 is "no earlier than now" by construction |
| Split | 596 calibration / 596 test, disjoint, seed 42 |
| **Measured on** | **`forecast_project()` end to end** — floors, monotone rearrangement and all |
| Coverage of the 10–95% band | **79.0% at a nominal 85%** (50.8% uncalibrated) |
| Per level (P10 / P50 / P80 / P95 below-target rate) | 17.3% / 56.9% / 82.4% / 96.0% |
| P50 MAE | 22.7 months (raw median 100.0) |

Two things to say without being asked. First, 79.0% is **under** the 85% nominal:
the calibration and test halves are drawn from the same population but the residual
distribution is heavy-tailed at n = 596, and the band's floor at elapsed time bites
on active projects. Second, the target is the **official revised completion date**, not
actual completion, because the corpus records none for ongoing projects. Every
`fact_p50_completion` carries `empirical_coverage`, `alpha_coverage = 0.85` and the
method string, so the UI can say "unverified" the moment the artefact is absent.

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
distinguishable from chance at the 5% level, and it moves with the arbitrary bin width
(1.22× at 1 pt, 1.65× at 2 pt, 1.49× at 5 pt). It is reported under `boundary_bin_ratio`
as a descriptive count — it was previously served under the key `mccrary_bunching_signal`,
which it is not.

**The actual McCrary (2008) test is now computed** (`analytics_engine/mccrary.py`):
cutoff-aligned histogram, triangular-kernel local-linear density on each side, θ = log f₊ − log f₋,
SE = √((1/Nh)(24/5)(1/f₊ + 1/f₋)), plug-in bandwidth capped at 1σ (the uncapped plug-in
rejected a smooth null 96% of the time; capped, empirical size is 7% at nominal 5% and
power 99% against +5% mass just below the cutoff — `tests/test_math_audit.py`). On the
live corpus, n = 1,138, h = 34.8, **θ = +0.076, z = 0.41, p = 0.68 two-sided, p = 0.66
one-sided for bunching below**: **no density discontinuity at 20%**. The landing page
now says exactly that.

Any claim of `p < 0.001` for this test is **withdrawn**: it appeared in a superseded
deck and is contradicted by the test now computed. A significant result, had there been
one, would show the threshold shapes where revisions land; it would not show intent.

---

## 5. CRYPTOGRAPHIC & OPERATIONAL

| Claim | Status |
|:---|:---|
| **Merkle audit trail** | **RFC 6962** — leaves `SHA-256(0x00‖data)`, internal nodes `SHA-256(0x01‖left‖right)`, split at the largest power of two. Domain separation blocks leaf/internal second-preimage substitution; the power-of-two split removes the CVE-2012-2459 duplicate-node root collision. Verifier fails **closed** on malformed proofs. Previously cited as "RFC 8785", which is the JSON canonicalisation scheme and not a Merkle construction — that citation was wrong and is withdrawn. |
| **Write-once briefing archive** | Content-addressed, atomic rename. Verified in tests. |
| **Air-gap operation** | Runs with no outbound network. `GROQ_API_KEY` blank is the sovereign default; the copilot answers from locally computed Merkle-signed facts. |
| **RBAC** | `viewer` / `analyst` / `admin` hierarchy, enforced by decorator. |
| **Test suite** | 20 standalone suites (`tests/run_all_tests.py`) + 2 pytest modules (140 passed, 1 skipped), including `tests/test_math_audit.py`, which pins every finding of the mathematical audit: McCrary size/power by simulation, Shapley vs exact enumeration, graph provenance, fan coverage ≥ 0.75, exp() multipliers, R–U cross-check, EO independence reproducibility, and the overrun deploy gate. Enforced in GitHub Actions CI on every push. |
| **Persistence** | **Split write/read paths.** Writes go to **Supabase PostgreSQL (ap-southeast-1, Singapore)** — schema migrations `0001`–`0006`, append-only triggers, `REVOKE`-enforced immutability, RLS as defence-in-depth, and a `prev_hash` row chain. Reads are served from an **in-memory pandas frame** rebuilt from that database at startup, which is what delivers the <10 ms query latency. Both paths meet at one seam, `analytics_engine/corpus_source.py`. **The read path is single-process and holds the whole corpus in RAM** — correct at 2,207 rows, but a continuously-ingesting national deployment would need a shared cache or a columnar store. Three services still bypass the seam and read the CSV directly; they are pinned in `tests/test_corpus_source.py::KNOWN_BYPASSES` rather than left undocumented. *(An earlier revision of this row read "there is no database", which predated the PostgreSQL integration.)* |

---

## 6. HOW TO CHALLENGE THIS

Reproduce any fitted number:

```bash
python analytics_engine/aft_survival.py && python analytics_engine/conformal_calibration.py && python tests/verify_features.py
```

Every artifact in `artifacts/` is regenerable from the committed corpus with a fixed seed.
If a number here does not reproduce, that is a defect — report it.
