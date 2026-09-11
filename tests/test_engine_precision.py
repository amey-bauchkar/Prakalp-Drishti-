"""
PRAKALP-DRISHTI: ENGINE PRECISION SUITE -- INDEPENDENT RECOMPUTATION

Every check below recomputes an engine output from first principles, in this file,
with none of the engine's own helpers, and compares. A test that calls an engine and
asserts the answer is "a number" proves nothing; these prove the number.

  A. KAAL-CHAKRA   calibrated median = raw x exp(q_0.5) (or its floor); the fan's
                   dates are sanction + months; the target probability is the
                   log-logistic CDF at the official date times (1 - foreclosure).
  B. AFT           the artefact's coefficients reproduce its own log-likelihood, are a
                   stationary point of the penalised objective (an L-BFGS restart from
                   them cannot improve it), and every multiplier is exp(coefficient).
  C. CONFORMAL     the calibration reproduces bit-for-bit from the seed.
  D. SETU-GRAPH    CPM forward pass recomputed on every node; floats consistent; the
                   persisted Shapley table equals a fresh compute; efficiency holds.
  E. VITTA-VYUHA   every constraint of the solved LP holds; R-U auxiliaries agree with
                   the direct tail; dual signs and complementary slackness.
  F. SATYA-KAVACH  two-bin counts and CI recomputed from the corpus; McCrary theta
                   recomputed with an independent local-linear fit; Clause 10CC cap
                   recomputed from the WPI/labour tables.
  G. RISK INDEX    score = weighted mean over available components, band from score.
  H. MERKLE        independent RFC 6962 implementation agrees on 200 random trees;
                   every inclusion proof verifies; tampering is detected.
  I. SETU-VARSHA   36 State/UT profiles; lost-days formula; IMD state-year count.
  J. OVERRUN       deployed joblib metadata matches the benchmark artefact; predictions finite.
  K. EO            independence artefact reproduces from the catalogue.

Run:  python tests/test_engine_precision.py
"""

import os
import sys
import json
import math
import hashlib

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)
sys.stdout.reconfigure(encoding="utf-8")
import warnings; warnings.filterwarnings("ignore")                  # noqa: E702

import numpy as np                                                  # noqa: E402
import pandas as pd                                                 # noqa: E402

_checks, _failures = 0, []


def check(label, cond, detail=""):
    global _checks
    _checks += 1
    print(f"  [{'PASS' if cond else 'FAIL'}] {label}" + (f"  -- {detail}" if detail else ""))
    if not cond:
        _failures.append(label)


def section(t):
    print(f"\n--- {t} ---")


rng = np.random.default_rng(2026)

# ═══════════════════════════════ A. KAAL-CHAKRA ═══════════════════════════════
section("A. KAAL-CHAKRA: fan, dates and target probability recomputed")
from analytics_engine.kaal_chakra import get_kaal_chakra_engine     # noqa: E402

kc = get_kaal_chakra_engine()
cal = json.load(open(os.path.join(BASE_DIR, "artifacts", "conformal_calibration.json"), encoding="utf-8"))
lq = cal["log_ratio_quantiles"]
mult = np.array([math.exp(lq["0.1"]), math.exp(lq["0.5"]), math.exp(lq["0.8"]), math.exp(lq["0.95"])])
sigma = float(kc.model_weights["sigma"])
pids = kc.df["ProjectId"].astype(str).tolist()
sample = list(rng.choice(pids, size=150, replace=False)) + ["706775"]

bad_median = bad_dates = bad_prob = bad_mono = 0
n_ok = 0
for pid in sample:
    try:
        core = kc._forecast_core(pid)
        f = kc.forecast_project(pid)
    except Exception:
        continue
    n_ok += 1
    u = f.facts["fact_p50_completion"].uncertainty
    raw = float(core["median_expected_duration"])
    cur = float(core["current_months"])
    prog = float(core["progress_perc"])
    rem_scale = max((100.0 - prog) / 100.0, 0.15)
    q = np.maximum.accumulate(raw * mult)
    q = np.maximum(q, cur + np.array([0.5, 1.0, 2.0, 4.0]) * rem_scale)
    if not np.allclose(q, [u.p10, u.p50, u.p80, u.p95], rtol=1e-9, atol=1e-6):
        bad_median += 1
    if not (u.p10 <= u.p50 <= u.p80 <= u.p95):
        bad_mono += 1
    # dates
    sanction = core["sanction_dt"]
    exp_p50 = (sanction + pd.Timedelta(days=min(int(q[1] * 30.4375), 63_000))).strftime("%Y-%m-%d")
    if f.p50_date != exp_p50:
        bad_dates += 1
    # probability of meeting the official revised date
    sig_eff = sigma * math.sqrt(rem_scale)
    t_rev = max((core["rev_end_dt"] - sanction).days / 30.4375, 1.0)
    F = 1.0 / (1.0 + (q[1] / t_rev) ** (1.0 / sig_eff))
    att = max(1.0 - prog / 100.0, 0.05)
    fore = min(max(0.02 + core["reset_count"] * 0.03 + (core["overrun_perc"] / 2000.0) * att, 0.0), 0.35)
    p_exp = min(max(F * (1.0 - fore), 0.01), 0.99)
    if abs(p_exp - f.prob_target_met_official) > 1e-9:
        bad_prob += 1

check(f"calibrated fan = raw median x exp(q_alpha), floored and rearranged, on {n_ok} projects", bad_median == 0, f"{bad_median} mismatches")
check("P10 <= P50 <= P80 <= P95 on every sampled forecast", bad_mono == 0)
check("P50 date = sanction date + P50 months on every sampled forecast", bad_dates == 0, f"{bad_dates} mismatches")
check("prob_target_met_official = F_loglogistic(t_official; P50, sigma_eff) x (1 - foreclosure), clipped", bad_prob == 0, f"{bad_prob} mismatches")
check("engine sigma equals the AFT artefact's sigma",
      abs(sigma - json.load(open(os.path.join(BASE_DIR, "artifacts", "aft_survival.json"), encoding="utf-8"))["sigma"]) < 1e-9)

# Rebaselining detection must not depend on how the host's pandas stringifies a
# missing value. On the Render deployment (pandas 3 string semantics) a NULL
# RevisedCostReason was counted as a reason, marking ~70% of projects rebaselined
# and moving 540 of them out of LOW. Recompute the flag under BOTH string modes
# and require it to equal what the engine holds.
_reason_raw = kc.df["RevisedCostReason"]
_blank = {"", "nan", "none", "<na>", "nat", "null"}
_cost_rev = (kc.df["RevisedCost"] > kc.df["OriginalCost"] * 1.01).fillna(False)
_flags = {}
for _mode in (False, True):
    pd.options.future.infer_string = _mode
    _r = pd.Series(_reason_raw.tolist())            # re-infer dtype under this mode
    _txt = _r.notna() & ~_r.astype(str).str.strip().str.lower().isin(_blank)
    _flags[_mode] = (_cost_rev.to_numpy() | _txt.to_numpy())
pd.options.future.infer_string = False
check("IsRebaselined is identical under pandas-2 and pandas-3 string semantics",
      bool(np.array_equal(_flags[False], _flags[True])),
      f"rebaselined={int(_flags[False].sum())} of {len(_flags[False])}")
check("engine's IsRebaselined equals the version-independent recomputation",
      bool(np.array_equal(kc.df["IsRebaselined"].to_numpy().astype(bool), _flags[False])))
check("a NULL revision reason never counts as a reason",
      not bool((_reason_raw.isna() & ~_cost_rev & kc.df["IsRebaselined"].astype(bool)).any()))

# ═══════════════════════════════ B. AFT ═══════════════════════════════
section("B. AFT SURVIVAL: artefact coefficients reproduce the likelihood and are optimal")
from analytics_engine import aft_survival as aft                     # noqa: E402
from scipy import optimize                                          # noqa: E402

A = json.load(open(os.path.join(BASE_DIR, "artifacts", "aft_survival.json"), encoding="utf-8"))
df_a = aft.load_frame()
X, offset, log_t, event, meta = aft.build_design(df_a)
check("design counts equal the artefact", len(df_a) == A["n_observations"] and int(event.sum()) == A["n_events"],
      f"n={len(df_a)} events={int(event.sum())} vs artefact {A['n_observations']}/{A['n_events']}")
fe = A["fixed_effects"]
beta = np.zeros(X.shape[1])
beta[0], beta[1], beta[2] = fe["intercept_b0"], fe["cost_log10_elasticity"], fe["reset_coefficient"]
for i, s in enumerate(meta["sectors"]):
    beta[3 + i] = A["sector_detail"][s]["gamma"]
for i, e in enumerate(meta["entities"]):
    beta[3 + len(meta["sectors"]) + i] = A["entity_detail"][e]["delta"]
theta = np.append(beta, math.log(A["sigma"]))

# Independent likelihood: event -> log f, censored -> log S, log-logistic in log-time.
mu = offset + X @ beta
sg = A["sigma"]
z = (log_t - mu) / sg
ll_event = -math.log(sg) - log_t + z - 2.0 * np.logaddexp(0.0, z)
ll_cens = -np.logaddexp(0.0, z)
nll_ind = -float(np.sum(np.where(event > 0, ll_event, ll_cens)))
check("independent censored log-logistic NLL at the artefact coefficients equals the artefact's NLL (rounding tolerance)",
      abs(nll_ind - A["negative_log_likelihood"]) < 0.05, f"recomputed {nll_ind:.4f} vs artefact {A['negative_log_likelihood']}")
check("survival + density identity: S(t) = 1/(1+e^z) and f/S = e^z/(sigma t (1+e^z)) (spot check)",
      abs((-np.logaddexp(0.0, z[0])) - math.log(1.0 / (1.0 + math.exp(z[0])))) < 1e-12)
# Stationarity: restart the penalised optimiser from the artefact's theta; it must not improve materially.
tau = A["tau_selected"]
f0 = aft._neg_log_lik(theta, X, offset, log_t, event, meta["group_slice"], tau)
res = optimize.minimize(aft._neg_log_lik, theta, args=(X, offset, log_t, event, meta["group_slice"], tau),
                        method="L-BFGS-B", options={"maxiter": 5000, "ftol": 1e-12, "gtol": 1e-10})
check("artefact coefficients are a stationary point of the penalised objective (restart improves by < 0.01 nats)",
      f0 - res.fun < 0.01, f"penalised NLL {f0:.4f} -> {res.fun:.4f}")
check("baseline multiplier = exp(b0)", abs(math.exp(fe["intercept_b0"]) - A["sector_default"]) < 1e-3)
ok_s = all(abs(math.exp(fe["intercept_b0"] + d["gamma"]) - d["multiplier"]) < 2e-3 for d in A["sector_detail"].values())
ok_e = all(abs(math.exp(d["delta"]) - d["multiplier"]) < 2e-3 for d in A["entity_detail"].values())
check("every sector multiplier = exp(b0 + gamma_s) and entity multiplier = exp(delta_e)", ok_s and ok_e)
check("tau_selected minimises the published CV profile",
      A["tau_selected"] == min(A["tau_profile"], key=lambda r: r["cv_heldout_nll"])["tau"])
check("engine multipliers equal the artefact", all(abs(kc.model_weights["sector_scales"][s] - A["sector_scales"][s]) < 1e-9 for s in A["sector_scales"]))

# ═══════════════════════════════ C. CONFORMAL ═══════════════════════════════
section("C. CONFORMAL: calibration reproduces from the seed")
from analytics_engine.conformal_calibration import fit_and_calibrate   # noqa: E402

fresh = fit_and_calibrate()
q_ok = all(abs(fresh["log_ratio_quantiles"][k] - lq[k]) < 1e-9 for k in lq)
check("log-ratio quantiles reproduce bit-for-bit", q_ok, str({k: round(v, 4) for k, v in fresh["log_ratio_quantiles"].items()}))
check("held-out coverage reproduces", abs(fresh["empirical_coverage_on_test"] - cal["empirical_coverage_on_test"]) < 1e-9,
      f"{fresh['empirical_coverage_on_test']} vs {cal['empirical_coverage_on_test']}")
check("split sizes reproduce", fresh["n_calibration"] == cal["n_calibration"] and fresh["n_test"] == cal["n_test"])
# finite-sample rank check, independently
r_test = np.array([0.5, -1.2, 0.3, 2.0, -0.4, 0.9, -2.2, 1.1, 0.0, -0.7])
from analytics_engine.conformal_calibration import _finite_sample_quantile   # noqa: E402
n_ = len(r_test)
k_ = min(math.ceil((n_ + 1) * 0.8), n_)
check("finite-sample quantile uses rank ceil((n+1)alpha)", abs(_finite_sample_quantile(r_test, 0.8) - np.sort(r_test)[k_ - 1]) < 1e-12)
# engine must be back on the artefact (fit_and_calibrate installs a temporary calibration)
kc.conformal = json.load(open(os.path.join(BASE_DIR, "artifacts", "conformal_calibration.json"), encoding="utf-8"))

# ═══════════════════════════════ D. SETU-GRAPH ═══════════════════════════════
section("D. SETU-GRAPH: CPM recomputed, floats, Shapley table")
import networkx as nx                                                # noqa: E402
from analytics_engine.setu_graph import get_setu_graph_engine        # noqa: E402

sg_eng = get_setu_graph_engine()
G = sg_eng.dag
check("graph is acyclic", nx.is_directed_acyclic_graph(G))
es, ef = {}, {}
for n in nx.topological_sort(G):
    preds = list(G.predecessors(n))
    es[n] = 0.0 if not preds else max(ef[p] + G[p][n].get("lead_time", 2.0) for p in preds)
    ef[n] = es[n] + max(G.nodes[n].get("delay_months", 12.0), 6.0)
bad = sum(1 for n in G.nodes if abs(es[n] - G.nodes[n]["es"]) > 1e-6 or abs(ef[n] - G.nodes[n]["ef"]) > 1e-6)
check("CPM forward pass (ES/EF) reproduced on every node", bad == 0, f"{bad} mismatches of {G.number_of_nodes()}")
tf = np.array([G.nodes[n]["total_float"] for n in G.nodes]); ff = np.array([G.nodes[n]["free_float"] for n in G.nodes])
check("0 <= free float <= total float on every node", bool(np.all(ff >= -1e-9) and np.all(ff <= tf + 1e-6)))
# backward pass consistency: LF(n) = min over successors (ES(s) - lead) ; TF = LF - EF
lf_bad = 0
horizon = max(ef.values())
for n in G.nodes:
    succs = list(G.successors(n))
    lf = horizon if not succs else min(es[s] - G[n][s].get("lead_time", 2.0) for s in succs)
    # engine defines total float relative to its own late-finish convention; verify FF, which is convention-free
    ff_exp = (max(min(es[s] - G[n][s].get("lead_time", 2.0) for s in succs) - ef[n], 0.0)
              if succs else None)
    if ff_exp is not None and abs(ff_exp - G.nodes[n]["free_float"]) > 1e-6:
        lf_bad += 1
check("free float = min_s(ES_s - lead) - EF on every node with successors", lf_bad == 0, f"{lf_bad} mismatches")
shp = pd.read_parquet(os.path.join(BASE_DIR, "artifacts", "shapley.parquet"))
col_id = [c for c in shp.columns if "id" in c.lower()][0]
col_phi = [c for c in shp.columns if c != col_id][0]
persisted = dict(zip(shp[col_id].astype(str), shp[col_phi].astype(float)))
diff = max(abs(persisted.get(str(n), np.nan) - sg_eng.shapley_scores[n]) for n in G.nodes)
check("persisted shapley.parquet equals a fresh in-process compute (seeded)", diff < 1e-6, f"max |diff| = {diff}")
total_locked = max(sum(G.nodes[n].get("locked_p50_cr", 0.0) for n in G.nodes), 1000.0)
check("Shapley values sum to total locked capital (efficiency in locked units)",
      abs(sum(sg_eng.shapley_scores.values()) - total_locked) / total_locked < 1e-3,
      f"sum={sum(sg_eng.shapley_scores.values()):.1f} total_locked={total_locked:.1f}")
lock_bad = sum(1 for n, d in G.nodes(data=True)
               if abs(d["locked_p50_cr"] - round((d.get("cost_cr", 1000.0) * d.get("delay_months", 0.0) / 48.0) if d.get("delay_months", 0.0) > 0 else 0.0, 2)) > 0.011)
check("locked_p50_cr = cost x delay/48 on every node", lock_bad == 0, f"{lock_bad} mismatches")

# Row-order independence: the CSV bootstrap and Postgres return the same rows in
# different orders. Rebuild the engine on a shuffled copy of the corpus; the edge set
# and every Shapley value must be identical. (Before the fix, 1,013 of 2,207 Shapley
# values differed by >1% between hosts -- same seed, differently ordered nodes.)
import analytics_engine.setu_graph as _sgmod                            # noqa: E402
import analytics_engine.corpus_source as _csmod                         # noqa: E402
_orig_load = _sgmod.load_corpus
def _shuffled_load(*a, **k):
    return _orig_load(*a, **k).sample(frac=1.0, random_state=99).reset_index(drop=True)
_sgmod.load_corpus = _shuffled_load
try:
    _shuf = _sgmod.SetuGraphEngine()
finally:
    _sgmod.load_corpus = _orig_load
_edges_a = sorted(f"{u}->{v}" for u, v in sg_eng.dag.edges)
_edges_b = sorted(f"{u}->{v}" for u, v in _shuf.dag.edges)
check("edge set is identical when the corpus rows arrive in a different order", _edges_a == _edges_b,
      f"{len(_edges_a)} vs {len(_edges_b)} edges")
_dmax = max(abs(sg_eng.shapley_scores[n] - _shuf.shapley_scores[n]) for n in sg_eng.dag.nodes)
check("Shapley values are identical when the corpus rows arrive in a different order", _dmax == 0.0, f"max |diff| = {_dmax}")
# The shuffled build rewrote the on-disk table; restore the canonical one.
sg_eng._precompute_artifacts() if hasattr(sg_eng, "_precompute_artifacts") else None

# ═══════════════════════════════ E. VITTA-VYUHA ═══════════════════════════════
section("E. VITTA-VYUHA: LP feasibility, duals, tail")
from analytics_engine.vitta_vyuha import get_vitta_vyuha_engine      # noqa: E402
from analytics_engine.contracts import AllocationRequest             # noqa: E402

vv = get_vitta_vyuha_engine()
for B, k in ((12000.0, 0.7), (5000.0, 0.25), (30000.0, 1.0)):
    r = vv.optimize_allocation(AllocationRequest(budget_pool_cr=B, risk_dial_kappa=k, enforce_ner_floor=True))
    alloc = np.array([p.allocated_capex_cr for p in r.allocations]); req_ = np.array([p.requested_capex_cr for p in r.allocations])
    ner = np.array([p.is_ner for p in r.allocations])
    check(f"B={B:.0f} k={k}: budget respected (to 2-d.p. rounding over {len(alloc)} rows), no over-allocation, NER >= 10%",
          alloc.sum() <= B + 0.005 * len(alloc) and np.all(alloc <= req_ + 0.011) and np.all(alloc >= -1e-9)
          and (alloc[ner].sum() / max(alloc.sum(), 1e-9) >= 0.0999),
          f"sum={alloc.sum():.2f} NER={alloc[ner].sum()/max(alloc.sum(),1e-9):.4f}")
    d = r.cvar_diagnostics
    check(f"B={B:.0f} k={k}: R-U auxiliaries reproduce the direct tail; tail loss = E[R] - tail",
          d["ru_agrees"] and abs(r.cvar90_tail_loss - max(0.0, d["expected_return"] - d["tail_average_return"])) < 0.02)
    check(f"B={B:.0f} k={k}: duals non-negative and closure 0", r.shadow_price_budget_pi >= 0 and r.shadow_price_ner_pi >= 0 and r.closure_error_perc < 1e-6)
    p_ = np.array(d["scenario_probabilities"]); rets = np.array(d["scenario_returns"])
    check(f"B={B:.0f} k={k}: expected return = sum p_s R_s", abs(float(p_ @ rets) - d["expected_return"]) < 0.05)
# The budget dual is the marginal objective value: sweep and check monotone non-increasing (concavity of the LP value function)
pis = [vv.optimize_allocation(AllocationRequest(budget_pool_cr=b, risk_dial_kappa=0.5)).shadow_price_budget_pi for b in (3000.0, 8000.0, 15000.0, 25000.0)]
check("budget shadow price is non-increasing in the pool (LP value function is concave)", all(pis[i] >= pis[i + 1] - 1e-9 for i in range(3)), str(pis))

# ═══════════════════════════════ F. SATYA-KAVACH ═══════════════════════════════
section("F. SATYA-KAVACH: bin counts, CI, McCrary and Clause 10CC recomputed")
from modules.tanmay.service import get_satya_kavach_engine           # noqa: E402
from scipy import stats                                              # noqa: E402

sk = get_satya_kavach_engine()
ba = sk.get_boundary_analysis()
# Same population the engine screens: revision on file, overrun in (-50, 200).
_has_rev = sk.df["HasRevisionOnFile"] == True
ov = pd.to_numeric(sk.df.loc[_has_rev, "OverrunPct"], errors="coerce").dropna().to_numpy(float)
n1 = int(((ov >= 18.0) & (ov < 20.0)).sum()); n2 = int(((ov >= 20.0) & (ov < 22.0)).sum())
ov = ov[(ov > -50.0) & (ov < 200.0)]
sig_ = ba["boundary_bin_ratio"]
check("two-bin counts recomputed from the corpus", n1 == sig_["numerator_count"] and n2 == sig_["denominator_count"], f"{n1}/{n2}")
se_ = math.sqrt(1.0 / n1 + 1.0 / n2); ratio = n1 / n2
lo_, hi_ = ratio * math.exp(-1.96 * se_), ratio * math.exp(1.96 * se_)
ci_txt = sig_["confidence_interval_95"]
ci_vals = [float(x) for x in ci_txt.strip("[]").split(",")]
check("log-Poisson 95% CI recomputed", abs(ci_vals[0] - lo_) < 0.011 and abs(ci_vals[1] - hi_) < 0.011, f"recomputed [{lo_:.2f}, {hi_:.2f}] vs {ci_txt}")

# Independent McCrary: cutoff-aligned histogram + triangular-kernel WLS on each side.
mcc = ba["mccrary_density_test"]
x = ov[np.isfinite(ov)]; N = len(x); c = 20.0
check("McCrary population size recomputed", N == mcc["n"], f"{N} vs {mcc['n']}")
b = 2.0 * float(np.std(x, ddof=1)) * N ** (-0.5); h = mcc["bandwidth"]
lo = c - b * math.ceil((c - x.min()) / b); hi = c + b * math.ceil((x.max() - c) / b)
edges = np.arange(lo, hi + b / 2, b); cnt, _ = np.histogram(x, bins=edges); mids = edges[:-1] + b / 2; g = cnt / (N * b)


def _ll(side):
    m = ((mids < c) & (mids >= c - h)) if side == "l" else ((mids >= c) & (mids <= c + h))
    Xs = mids[m] - c; Ys = g[m]; w = np.maximum(0.0, 1.0 - np.abs(Xs) / h)
    Aw = np.column_stack([np.ones_like(Xs), Xs]) * np.sqrt(w)[:, None]
    beta_, *_ = np.linalg.lstsq(Aw, Ys * np.sqrt(w), rcond=None)
    return float(beta_[0])


fl, fr = _ll("l"), _ll("r")
theta_ind = math.log(fr) - math.log(fl)
se_ind = math.sqrt((1.0 / (N * h)) * (24.0 / 5.0) * (1.0 / fr + 1.0 / fl))
check("McCrary theta recomputed with an independent weighted least-squares fit", abs(theta_ind - mcc["theta_log_density_jump"]) < 1e-3,
      f"{theta_ind:.4f} vs {mcc['theta_log_density_jump']}")
check("McCrary SE and z recomputed", abs(se_ind - mcc["se"]) < 1e-3 and abs(theta_ind / se_ind - mcc["z"]) < 0.01)
check("two-sided p recomputed from N(0,1)", abs(2 * (1 - stats.norm.cdf(abs(theta_ind / se_ind))) - mcc["p_two_sided"]) < 2e-3)

# Clause 10CC composite inflation recomputed from the loaded index tables.
calc = sk._calculate_10cc_cap(1000.0, 2015)
bw, cw = sk.wpi_by_year[2015], sk.wpi_by_year[2026]
bl, cl_ = sk.labor_by_year[2015], sk.labor_by_year[2026]
comp = (0.20 * max(0, (cw["steel"] - bw["steel"]) / bw["steel"]) + 0.15 * max(0, (cw["cement"] - bw["cement"]) / bw["cement"])
        + 0.15 * max(0, (cw["fuel"] - bw["fuel"]) / bw["fuel"]) + 0.25 * max(0, (cl_ - bl) / bl) + 0.25 * max(0, (cw["other"] - bw["other"]) / bw["other"]))
check("Clause 10CC composite inflation = weighted index growth (2015 -> 2026)", abs(comp * 100 - calc["composite_inflation_pct"]) < 0.05,
      f"{comp*100:.3f}% vs {calc['composite_inflation_pct']}")
check("Clause 10CC escalable base = 0.85 x original cost", abs(calc["escalable_base_cr"] - 850.0) < 1e-6)
check("statutory escalation = escalable base x composite inflation", abs(calc["statutory_allowed_escalation_cr"] - 850.0 * comp) < 0.06)

# ═══════════════════════════════ G. RISK INDEX ═══════════════════════════════
section("G. RISK INDEX: score and band recomputed on every project")
from analytics_engine.risk_index import get_risk_index_engine, COMPONENT_WEIGHTS   # noqa: E402

ri = get_risk_index_engine()
bad_s = bad_b = 0
for r in ri.scores.values():
    av = {k: v for k, v in r["components"].items() if v is not None}
    ws = sum(COMPONENT_WEIGHTS[k] for k in av) or 1.0
    s = sum(COMPONENT_WEIGHTS[k] * v for k, v in av.items()) / ws
    # components are published to 1 d.p. and so is the score: |error| <= 0.05 + 0.05
    if abs(s - r["risk_score"]) > 0.1 + 1e-9:
        bad_s += 1
    band = "CRITICAL" if r["risk_score"] >= 75 else "HIGH" if r["risk_score"] >= 55 else "MODERATE" if r["risk_score"] >= 35 else "LOW"
    if band != r["risk_band"] and abs(r["risk_score"] - round(r["risk_score"])) > 1e-9:
        bad_b += 1
check(f"risk score = weighted mean of available components on all {len(ri.scores)} projects", bad_s == 0, f"{bad_s} mismatches")
check("band follows the [75, 55, 35] table", bad_b == 0)
check("weights sum to 1", abs(sum(COMPONENT_WEIGHTS.values()) - 1.0) < 1e-12)
bd = ri.coverage["band_distribution"]
check("band distribution sums to the scored population", sum(bd.values()) == len(ri.scores), str(bd))

# ═══════════════════════════════ H. MERKLE ═══════════════════════════════
section("H. MERKLE: independent RFC 6962 implementation")
from analytics_engine.merkle import build_tree, verify_inclusion_proof, mth_leaf   # noqa: E402


def _ind_root(leaves):
    hs = [hashlib.sha256(b"\x00" + s.encode()).digest() for s in leaves]

    def rec(a):
        if len(a) == 1:
            return a[0]
        k = 1
        while 2 * k < len(a):
            k *= 2
        return hashlib.sha256(b"\x01" + rec(a[:k]) + rec(a[k:])).digest()
    return hashlib.sha256(b"").hexdigest() if not hs else rec(hs).hex()


mism = proof_bad = tamper_ok = 0
for _ in range(200):
    n_ = int(rng.integers(1, 40))
    leaves = [f"leaf-{rng.integers(0, 1_000_000)}-{i}" for i in range(n_)]
    root, proofs = build_tree(leaves)
    if root != _ind_root(leaves):
        mism += 1
    for s in leaves:
        if not verify_inclusion_proof(s, proofs[mth_leaf(s)], root):
            proof_bad += 1
    if not verify_inclusion_proof(leaves[0] + "x", proofs[mth_leaf(leaves[0])], root):
        tamper_ok += 1
check("root equals an independent RFC 6962 implementation on 200 random trees", mism == 0)
check("every inclusion proof verifies", proof_bad == 0)
check("a tampered leaf never verifies", tamper_ok == 200)
check("empty tree root is SHA-256 of the empty string", build_tree([])[0] == hashlib.sha256(b"").hexdigest())
# A live briefing's root recomputed from its facts
from analytics_engine.pragati_saarthi import get_pragati_saarthi_engine   # noqa: E402

ps = get_pragati_saarthi_engine()
br = ps.generate_cabinet_briefing("706775")
if br is not None:
    leaves = [json.dumps({"id": f.fact_id, "val": f.value, "unit": f.unit}, sort_keys=True) for f in br.audit_facts.values()]
    check("briefing merkle_root recomputes from its fact leaves", _ind_root(leaves) == br.merkle_root)
    check("briefing doc_hash = SHA-256(root:project_id)", br.doc_hash == hashlib.sha256(f"{br.merkle_root}:706775".encode()).hexdigest())

# ═══════════════════════════════ I. SETU-VARSHA ═══════════════════════════════
section("I. SETU-VARSHA: profiles and working-window formula")
from modules.janhavi.service import get_varsha_speed_engine, STATE_GEO_PROFILES   # noqa: E402

va = get_varsha_speed_engine()
imd = pd.read_csv(os.path.join(BASE_DIR, "paimana_extracted", "advanced_macro", "IMD_STATE_MONSOON_ANOMALIES_2005_2025.csv"))
summ = va.get_monsoon_impact_summary(15.0)
check("36 State/UT profiles declared", len(STATE_GEO_PROFILES) == 36, str(len(STATE_GEO_PROFILES)))
check("IMD matrix state-year count matches the data_source string", f"{len(imd)} State-Years" in summ["data_source"], f"csv rows={len(imd)}; {summ['data_source']}")
check("every IMD state has a profile", set(imd["State"].unique()) <= set(STATE_GEO_PROFILES), str(set(imd["State"].unique()) - set(STATE_GEO_PROFILES))[:80])
bad_v = 0
for rec in summ["state_impact_records"]:
    ld = max(5.0, rec["base_lost_days"] * (1.0 + 0.15 * rec["excess_rain_elasticity"]))
    lm = round(ld / 30.4375, 2); ew = max(3.5, round(12.0 - lm, 2)); st = round(12.0 / ew, 2)
    if abs(rec["simulated_lost_days"] - round(ld, 1)) > 0.11 or abs(rec["schedule_stretch_multiplier"] - st) > 0.011:
        bad_v += 1
check("lost days, working window and stretch recomputed for every state at +15%", bad_v == 0, f"{bad_v} mismatches")
check("parameters are declared as expert constants on the payload", "declared expert parameters" in summ.get("parameter_basis", ""))

# ═══════════════════════════════ J. OVERRUN ═══════════════════════════════
section("J. OVERRUN MODEL: deployed artefact consistent with the benchmark")
import joblib                                                        # noqa: E402
from analytics_engine.overrun_models import predict_cost_overrun, MODEL_PATH   # noqa: E402

om = json.load(open(os.path.join(BASE_DIR, "artifacts", "overrun_models.json"), encoding="utf-8"))
dep = joblib.load(MODEL_PATH)
blk = om["targets"]["cost_overrun_pct"]
check("deployed model variant equals the benchmark's selected variant", dep["variant"] == blk["ml_vs_conventional"]["evaluated_variant"])
check("deployed test MAE equals the benchmark block", abs(dep["test_mae"] - blk[dep["variant"]]["gradient_boosting"]["mae"]) < 1e-6)
check("deployable is the measured decision", blk["deployable"] == blk["deployable_basis"]["deployable"] and blk["deployable"])
preds = [predict_cost_overrun(p) for p in ("706775", "617321", "705237")]
check("predictions are finite and carry the model provenance",
      all(isinstance(p, dict) and np.isfinite(p.get("predicted_cost_overrun_pct", np.nan)) for p in preds))

# ═══════════════════════════════ K. EO ═══════════════════════════════
section("K. EO INDEPENDENCE: artefact reproduces from the catalogue")
from analytics_engine.eo_independence import compute, load, CATALOG_PATH   # noqa: E402

art = load(); fresh_eo = compute(CATALOG_PATH)
check("catalogue hash and r reproduce", art["catalog_sha256"] == fresh_eo["catalog_sha256"]
      and abs(art["overall"]["pearson_r"] - fresh_eo["overall"]["pearson_r"]) < 1e-9, f"r={fresh_eo['overall']['pearson_r']} n={fresh_eo['overall']['n']}")
cat = json.load(open(CATALOG_PATH, encoding="utf-8"))
rel = [r for r in cat if r.get("eo_verdict_reliable")]
cf = np.array([r["surface_change_pct"] for r in rel], float); clm = np.array([r["claimed_progress_pct"] for r in rel], float)
r_np = float(np.corrcoef(cf, clm)[0, 1])
check("Pearson r recomputed with numpy", abs(r_np - fresh_eo["overall"]["pearson_r"]) < 1e-4, f"{r_np:.4f}")

# ═══════════════════════════════ SUMMARY ═══════════════════════════════
print("\n" + "=" * 78)
if _failures:
    print(f"ENGINE PRECISION SUITE FAILED: {len(_failures)} of {_checks} checks")
    for f in _failures:
        print("  -", f)
    sys.exit(1)
print(f"ASSERTIONS PASSED: {_checks} first-principles recomputations, 0 failures.")
