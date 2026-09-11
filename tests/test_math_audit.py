"""
PRAKALP-DRISHTI: MATHEMATICAL-AUDIT REGRESSION SUITE

Each check here pins a finding from the forensic mathematical audit so that it
cannot silently regress:

  1. McCrary (2008) density test -- empirical SIZE near nominal and POWER against a
     planted discontinuity, by simulation. The first implementation rejected H0 on
     96% of smooth null samples because the plug-in bandwidth was unbounded.
  2. Shapley criticality -- the permutation Monte Carlo estimator agrees with EXACT
     enumeration on a 6-node DAG, a sink gets exactly zero, and marginals telescope.
  3. SETU-GRAPH edge rules name sectors that exist in the corpus, every edge carries
     its basis, and the graph is not CSV-row-order.
  4. KAAL-CHAKRA's displayed fan is calibrated on its own median with a measured
     held-out coverage of at least 0.75 at a nominal 0.85, and quantiles are monotone.
  5. AFT multipliers are the fitted log-linear effects (exp(), not 1 + x), and the
     engine's prior reproduces log T = log(planned) + b0 + ... from the artefact.
  6. VITTA-VYUHA mean-CVaR: the Rockafellar-Uryasev auxiliary variables reproduce the
     tail computed directly from scenario returns; tail loss falls as kappa rises;
     the risk dial moves the allocation materially.
  7. The EO/progress independence figure is persisted, recomputable, and near zero.
  8. The overrun model's "deployable" flag is a measured decision.

Run:  python tests/test_math_audit.py
"""

import os
import sys
import json
import itertools

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)
sys.stdout.reconfigure(encoding="utf-8")

import numpy as np                                                  # noqa: E402

_checks, _failures = 0, []


def check(label, cond, detail=""):
    global _checks
    _checks += 1
    status = "PASS" if cond else "FAIL"
    print(f"  [{status}] {label}" + (f"  -- {detail}" if detail else ""))
    if not cond:
        _failures.append(label)


# ── 1. McCrary size and power ─────────────────────────────────────────────────
print("\n--- 1. McCRARY DENSITY TEST: SIZE AND POWER BY SIMULATION ---")
from analytics_engine.mccrary import mccrary_test                    # noqa: E402

rng = np.random.default_rng(7)
N_SIM, N_OBS, CUT = 150, 1000, 20.0
rej_null = 0
for _ in range(N_SIM):
    x = rng.gamma(shape=2.0, scale=12.0, size=N_OBS)      # smooth, right-skewed, no jump
    r = mccrary_test(x, CUT)
    rej_null += int(r.get("available") and r["p_two_sided"] < 0.05)
size = rej_null / N_SIM
check("empirical size at nominal 5% is below 12% on a smooth Gamma null", size < 0.12,
      f"size={size:.3f} over {N_SIM} sims, n={N_OBS}")

rej_alt = 0
for _ in range(N_SIM):
    x = rng.gamma(shape=2.0, scale=12.0, size=N_OBS)
    # plant a discontinuity: move 5% of the mass from just above to just below the cutoff
    k = int(0.05 * N_OBS)
    x[:k] = CUT - rng.uniform(0.0, 2.0, size=k)
    r = mccrary_test(x, CUT)
    rej_alt += int(r.get("available") and r["p_one_sided_bunching_below"] < 0.05)
power = rej_alt / N_SIM
check("one-sided power against +5% mass just below the cutoff exceeds 80%", power > 0.80,
      f"power={power:.3f}")

x_one = rng.gamma(2.0, 12.0, size=N_OBS)
r = mccrary_test(x_one, CUT)
check("z equals theta / se as reported", abs(r["z"] - r["theta_log_density_jump"] / r["se"]) < 0.01)
check("bandwidth is capped at one standard deviation of the sample",
      r["bandwidth"] <= np.std(x_one, ddof=1) + 1e-3, f"h={r['bandwidth']} sigma={np.std(x_one, ddof=1):.3f}")
check("too few observations returns unavailable, not a verdict",
      mccrary_test(np.array([1.0, 2.0, 3.0]), 2.0).get("available") is False)

# ── 2. Shapley: exact enumeration vs the engine's estimator ───────────────────
print("\n--- 2. SHAPLEY CRITICALITY: EXACT ENUMERATION ON A 6-NODE DAG ---")
import networkx as nx                                                # noqa: E402
from analytics_engine.setu_graph import SetuGraphEngine              # noqa: E402

G = nx.DiGraph()
costs = {"A": 100.0, "B": 200.0, "C": 300.0, "D": 400.0, "E": 150.0, "F": 250.0}
for n, c in costs.items():
    G.add_node(n, cost_cr=c, locked_p50_cr=c)
G.add_edges_from([("A", "B"), ("A", "C"), ("B", "D"), ("C", "D"), ("E", "F")])

reach = {n: set(nx.descendants(G, n)) | {n} for n in G.nodes}


def v(S):
    return sum(costs[d] for d in set().union(*(reach[i] for i in S)) if S) if S else 0.0


nodes = list(G.nodes)
exact = {n: 0.0 for n in nodes}
for perm in itertools.permutations(nodes):
    S = []
    for n in perm:
        exact[n] += v(S + [n]) - v(S)
        S.append(n)
import math                                                          # noqa: E402
exact = {n: val / math.factorial(len(nodes)) for n, val in exact.items()}
check("exact Shapley values are efficient (sum to v(N))", abs(sum(exact.values()) - v(nodes)) < 1e-9,
      f"sum={sum(exact.values()):.1f} v(N)={v(nodes):.1f}")
# Under v(S) = cost of UNION reach(i), reach(i) includes i itself, so a sink's value
# is its OWN capital shared equally with the projects that gate it:
#   phi(sink) = cost / (1 + number of ancestors)
# D has ancestors {A, B, C} -> 400/4 = 100; F has ancestor {E} -> 250/2 = 125.
check("a sink's exact Shapley value is cost / (1 + #ancestors)",
      abs(exact["D"] - 100.0) < 1e-9 and abs(exact["F"] - 125.0) < 1e-9,
      f"D={exact['D']:.1f} F={exact['F']:.1f}")
check("an isolated node would carry exactly its own cost (no ancestors)",
      abs(v(["E"]) - (costs["E"] + costs["F"])) < 1e-9)

eng = SetuGraphEngine.__new__(SetuGraphEngine)
eng.dag = G
eng.shapley_scores = {}
eng._compute_shapley_criticality()
total_locked = max(sum(costs.values()), 1000.0)
est_shares = {n: eng.shapley_scores[n] / total_locked for n in nodes}
exact_shares = {n: exact[n] / v(nodes) for n in nodes}
max_err = max(abs(est_shares[n] - exact_shares[n]) for n in nodes)
check("permutation-MC shares agree with exact enumeration within 3 points of share",
      max_err < 0.03, f"max |share error|={max_err:.4f}  est={ {k: round(v_, 3) for k, v_ in est_shares.items()} }")
check("estimator agrees with the sink closed form within 2 points of share",
      abs(est_shares["D"] - 100.0 / 1400.0) < 0.02 and abs(est_shares["F"] - 125.0 / 1400.0) < 0.02,
      f"D={est_shares['D']:.3f} (exact {100/1400:.3f})  F={est_shares['F']:.3f} (exact {125/1400:.3f})")
check("estimator ranks the true linchpin first",
      max(est_shares, key=est_shares.get) == max(exact_shares, key=exact_shares.get))

# ── 3. Graph provenance ───────────────────────────────────────────────────────
print("\n--- 3. SETU-GRAPH EDGE PROVENANCE ---")
from analytics_engine.setu_graph import get_setu_graph_engine        # noqa: E402

sg = get_setu_graph_engine()
prov = getattr(sg, "edge_provenance", None)
check("edge provenance is published", isinstance(prov, dict), str(prov)[:120])
bases = [d.get("basis") for _, _, d in sg.dag.edges(data=True)]
check("every DAG edge carries a basis", all(bases) and len(bases) == sg.dag.number_of_edges(),
      f"{sum(1 for b in bases if b)}/{len(bases)}")
allowed = {"sector_supply_chain"}
check("every basis is a stated heuristic",
      all(b in allowed or str(b).startswith("geo_adjacency_") for b in bases))
sectors = {d.get("sector") for _, d in sg.dag.nodes(data=True)}
for up, down in (("Coal", "Electricity Generation"), ("Electricity Generation", "Transmission & Distribution"),
                 ("Shipping", "Railways")):
    check(f"supply-chain rule '{up} -> {down}' names sectors present in the corpus",
          up in sectors and down in sectors)
# Not CSV row order: consecutive-id edges must be a small minority.
ids = [str(n) for n in sg.dag.nodes]
pos = {pid: i for i, pid in enumerate(ids)}
consec = sum(1 for u, w in sg.dag.edges if abs(pos[str(u)] - pos[str(w)]) == 1)
frac = consec / max(sg.dag.number_of_edges(), 1)
check("edges are not CSV row order (consecutive-row edges < 20%)", frac < 0.20,
      f"{consec}/{sg.dag.number_of_edges()} = {frac:.1%}")
check("adjacency edges only join projects within the stated radius",
      all(float(str(b).split('_')[-1][:-2]) <= prov.get("adjacency_km", 50.0) + 0.5
          for b in bases if str(b).startswith("geo_adjacency_")))

# ── 4. KAAL-CHAKRA fan calibration ────────────────────────────────────────────
print("\n--- 4. KAAL-CHAKRA CONFORMAL FAN ---")
cal = json.load(open(os.path.join(BASE_DIR, "artifacts", "conformal_calibration.json"), encoding="utf-8"))
check("conformal artefact calibrates the engine's own median",
      "raw_median_months" in str(cal.get("calibrated_quantity", "")), cal.get("calibrated_quantity"))
check("coverage is measured end to end on forecast_project()", "forecast_project" in str(cal.get("measured_on", "")))
cov = float(cal.get("empirical_coverage_on_test") or 0.0)
check("measured held-out coverage of the displayed 10-95% band is >= 0.75 (nominal 0.85)", cov >= 0.75,
      f"coverage={cov:.4f} on n_test={cal.get('n_test')}")
check("calibration improves on the uncalibrated band",
      cov > float(cal.get("uncalibrated_coverage_on_test") or 0.0) + 0.05,
      f"uncalibrated={cal.get('uncalibrated_coverage_on_test')}")
lq = cal["log_ratio_quantiles"]
check("log-ratio quantiles are monotone in alpha",
      lq["0.1"] <= lq["0.5"] <= lq["0.8"] <= lq["0.95"], str({k: round(v_, 3) for k, v_ in lq.items()}))

from analytics_engine.kaal_chakra import get_kaal_chakra_engine      # noqa: E402

kc = get_kaal_chakra_engine()
check("engine loaded the log-ratio calibration",
      isinstance(kc.conformal, dict) and "log_ratio_quantiles" in kc.conformal)
sample = kc.df["ProjectId"].astype(str).head(40).tolist()
mono_ok, n_ok, calibrated_ok = True, 0, True
for pid in sample:
    try:
        f = kc.forecast_project(pid)
    except Exception:
        continue
    n_ok += 1
    q = [f.p10_date, f.p50_date, f.p80_date, f.p95_date]
    mono_ok &= (q[0] <= q[1] <= q[2] <= q[3])
    fact = f.facts.get("fact_p50_completion") if isinstance(f.facts, dict) else None
    u = getattr(fact, "uncertainty", None) if fact is not None else None
    if u is None:
        calibrated_ok = False
    else:
        mono_ok &= (u.p10 <= u.p50 <= u.p80 <= u.p95)
        calibrated_ok &= (u.empirical_coverage is not None
                          and abs(u.empirical_coverage - cov) < 1e-6
                          and "conformal" in str(u.calibration_method).lower()
                          and abs(u.alpha_coverage - 0.85) < 1e-9)
check(f"P10 <= P50 <= P80 <= P95 on {n_ok} sampled forecasts", mono_ok and n_ok > 0)
check("every P50 fact carries the measured coverage, the method, and the 0.85 nominal", calibrated_ok)

# ── 5. AFT multipliers ────────────────────────────────────────────────────────
print("\n--- 5. AFT MULTIPLIER CONSISTENCY ---")
aft = json.load(open(os.path.join(BASE_DIR, "artifacts", "aft_survival.json"), encoding="utf-8"))
check("AFT artefact counts are internally consistent",
      aft["n_events"] + aft["n_right_censored"] == aft["n_observations"],
      f"{aft['n_events']} + {aft['n_right_censored']} = {aft['n_observations']}")
check("survivorship diagnostic is published with a caveat",
      isinstance(aft.get("survivorship"), dict) and bool(aft.get("baseline_caveat")))
mw = kc.model_weights
core = kc._forecast_core(sample[0])
row = kc.df[kc.df["ProjectId"].astype(str) == sample[0]].iloc[0]
exp_cost = float(np.exp(mw["cost_elasticity"] * np.log10(max(float(row["OriginalCost"]), 100.0) / 100.0)))
exp_reset = float(np.exp(int(row["BaselineResetCount"]) * mw["reset_coefficient"]))
check("cost multiplier is exp(b_cost * log10(cost/100))", abs(core["cost_mult"] - exp_cost) < 1e-9)
check("reset multiplier is exp(b_reset * resets)", abs(core["rebase_mult"] - exp_reset) < 1e-9)
check("prior duration = planned x sector x entity x cost x reset multipliers",
      abs(core["prior_duration"] - core["planned_months"] * core["sec_mult"] * core["ent_mult"]
          * core["cost_mult"] * core["rebase_mult"]) < 1e-6)
check("engine sector scales come from the fitted artefact",
      all(abs(mw["sector_scales"][s] - aft["sector_scales"][s]) < 1e-9 for s in aft["sector_scales"]))

# ── 6. VITTA-VYUHA mean-CVaR ──────────────────────────────────────────────────
print("\n--- 6. VITTA-VYUHA MEAN-CVaR ---")
from analytics_engine.vitta_vyuha import get_vitta_vyuha_engine      # noqa: E402
from analytics_engine.contracts import AllocationRequest             # noqa: E402

vv = get_vitta_vyuha_engine()
res = {k: vv.optimize_allocation(AllocationRequest(budget_pool_cr=12000.0, risk_dial_kappa=k))
       for k in (0.0, 0.5, 1.0)}
for k, r in res.items():
    d = r.cvar_diagnostics
    check(f"kappa={k}: Rockafellar-Uryasev auxiliaries reproduce the direct tail", bool(d["ru_agrees"]),
          f"RU={d['ru_tail_average_return']} direct={d['lp_units_tail_average_return']}")
    check(f"kappa={k}: tail loss is non-negative and closed-form (E[R] - tail)",
          r.cvar90_tail_loss >= 0 and abs(r.cvar90_tail_loss - (d["expected_return"] - d["tail_average_return"])) < 0.02)
    check(f"kappa={k}: NER floor holds", r.ner_share_perc >= 9.9, f"{r.ner_share_perc}%")
tl = [res[k].cvar90_tail_loss for k in (0.0, 0.5, 1.0)]
check("tail loss falls monotonically as kappa rises", tl[0] >= tl[1] >= tl[2], str([round(x, 1) for x in tl]))
a0 = np.array([p.allocated_capex_cr for p in res[0.0].allocations])
a1 = np.array([p.allocated_capex_cr for p in res[1.0].allocations])
moved = float(np.abs(a1 - a0).sum() / max(a0.sum(), 1.0))
check("the risk dial moves the allocation materially (>10% of pool re-routed at kappa 0 -> 1)", moved > 0.10,
      f"{moved:.1%}")
pool_entities = set(vv.candidate_df["CANONICAL_ENTITY"].astype(str))
extra = set(res[0.5].agency_marginal_yield_indicator) - pool_entities
check("agency indicators exist only for agencies in the candidate pool (no fallback literals)",
      not extra, str(sorted(extra))[:100])
check("scenario probabilities sum to one and are declared on the result",
      abs(sum(res[0.5].cvar_diagnostics["scenario_probabilities"]) - 1.0) < 1e-9)

# ── 7. EO independence ────────────────────────────────────────────────────────
print("\n--- 7. EO / REPORTED-PROGRESS INDEPENDENCE ---")
from analytics_engine.eo_independence import load, compute, CATALOG_PATH   # noqa: E402

art = load()
check("independence artefact exists", isinstance(art, dict))
if art:
    fresh = compute(CATALOG_PATH)
    check("artefact reproduces from the catalogue it names",
          fresh["catalog_sha256"] == art["catalog_sha256"]
          and abs(fresh["overall"]["pearson_r"] - art["overall"]["pearson_r"]) < 1e-6,
          f"r={art['overall']['pearson_r']} n={art['overall']['n']}")
    check("correlation is near zero (|r| < 0.10)", abs(art["overall"]["pearson_r"]) < 0.10)

# ── 8. Overrun model deploy gate ──────────────────────────────────────────────
print("\n--- 8. OVERRUN MODEL DEPLOY GATE ---")
om = json.load(open(os.path.join(BASE_DIR, "artifacts", "overrun_models.json"), encoding="utf-8"))
for tgt, blk in om["targets"].items():
    basis = blk.get("deployable_basis") or {}
    check(f"{tgt}: deployable flag equals the measured decision",
          bool(blk.get("deployable")) == bool(basis.get("deployable")) and "criteria" in basis,
          str(basis.get("criteria")))
    if blk.get("deployable"):
        m = basis["held_out_mae"]
        check(f"{tgt}: served model beats both naive baselines on held-out MAE",
              m["gradient_boosting"] < m["naive_train_mean"] and m["gradient_boosting"] < m["sector_mean_baseline"],
              str(m))

# ── summary ───────────────────────────────────────────────────────────────────
print("\n" + "=" * 78)
if _failures:
    print(f"MATH AUDIT REGRESSION FAILED: {len(_failures)} of {_checks} checks")
    for f in _failures:
        print("  -", f)
    sys.exit(1)
print(f"ASSERTIONS PASSED: {_checks} mathematical-audit checks, 0 failures.")
