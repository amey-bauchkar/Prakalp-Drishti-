"""
PRAKALP-DRISHTI: LOG-LOGISTIC AFT SURVIVAL FIT (KAAL-CHAKRA)

Turns KAAL-CHAKRA's duration multipliers from hand-set constants into maximum-likelihood
estimates fitted on the MoSPI corpus under right-censoring.

The problem this replaces
-------------------------
KAAL-CHAKRA advertised "Accelerated Failure Time (AFT) Survival Analysis" while
`_fit_aft_models` assigned a literal dictionary:

    sector_scale_factors = {"Roads & Highways": 1.45, "Railways": 1.62, ...}

No likelihood, no censoring, no MLE. Worse, the table was largely INERT: only two of its
eleven keys ("Roads & Highways", "Railways") exist in the corpus vocabulary. The other
nine -- "Power & Thermal", "Coal & Mining", "Petroleum & Natural Gas", "Civil Aviation",
"Healthcare & Institutions", "Urban Infrastructure", "Ports & Shipping",
"Water & Irrigation" -- never matched a row, so 20 of 22 sectors (708 projects, 32.1%
of the portfolio) silently collapsed onto the 1.40 default. The constants were not
merely unfitted; for a third of the portfolio they were not even reached.

What is fitted here
-------------------
A log-logistic Accelerated Failure Time model for TOTAL PROJECT DURATION, estimated by
maximum likelihood with right-censoring:

    log T_i = log(planned_i) + b0 + b_cost*log10(cost_i/100)
                             + gamma_{sector(i)} + delta_{entity(i)}
                             + b_reset*resets_i + sigma * W_i,       W ~ Logistic(0,1)

log(planned) enters as an OFFSET (coefficient fixed at 1), so exp(.) of the remaining
linear predictor is a MULTIPLIER ON PLANNED DURATION -- the same quantity the previous
constants claimed to be, now estimated rather than asserted.

Censoring
---------
The event is "project reaches 100% physical progress".

    PhysicalProgress >= 100  ->  event observed        (164 projects)
    PhysicalProgress <  100  ->  right-censored        (2,043 projects)

A censored project contributes log S(t) -- the information that its true duration
EXCEEDS its elapsed duration. This is the entire reason to use survival analysis here:
discarding the 2,043 ongoing projects would throw away 93% of the corpus and bias the
fit toward whatever happens to finish early.

    event:     log f(t) = -log(sigma) - log(t) + z - 2*log(1 + e^z)
    censored:  log S(t) = -log(1 + e^z)              where z = (log t - mu)/sigma

DURATION CAVEAT (stated because the corpus cannot support the clean version): MoSPI
records no actual completion date. For a completed project the final revised target date
is used as the completion proxy; for an ongoing project the censoring time is elapsed
time since sanction. The same caveat governs conformal_calibration.py, and it is the
reason this module reports intervals rather than point certainties.

Shrinkage
---------
164 events across 22 sectors and 103 canonical entities is a 7.4% event rate, and the
cells are wildly unbalanced -- Roads & Highways holds 1,181 projects, Energy Storage
holds a handful. Fitting 125 free group effects unpenalised would produce confident
nonsense in the thin cells.

Group effects therefore carry a Normal(0, tau^2) prior, making the estimate a penalised
MLE (MAP). Thin cells shrink toward the pooled baseline (multiplier -> exp(b0)); cells
with real evidence move away from it. tau is selected by 5-fold cross-validated held-out
log-likelihood -- an in-sample criterion is degenerate here, since relaxing the prior
always improves the in-sample fit and would always pick the loosest grid point.
Reported standard errors are posterior SDs from the inverse penalised Hessian, and every
group is published WITH its event count so a reviewer can see which multipliers are
carried by data and which are carried by the prior.

Run as a script to (re)fit. KAAL-CHAKRA consumes the saved artefact at runtime, so no
optimisation happens on the request path. The conformal interval wrapper is unchanged
and still supplies the calibrated P10-P95 band at a measured 93.3% coverage.
"""

from __future__ import annotations

import hashlib
import json
import os
from typing import Dict, List, Tuple

import numpy as np
import pandas as pd
from scipy import optimize

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, "paimana_extracted", "PAIMANA_MASTER_PROJECTS_DATABASE.csv")
ENTITY_MAPPING_PATH = os.path.join(BASE_DIR, "paimana_extracted", "CANONICAL_ENTITIES_MAPPING.json")
ARTIFACT_PATH = os.path.join(BASE_DIR, "artifacts", "aft_survival.json")

# Corpus "as of" date. Fixed, not datetime.now(), so a re-fit is reproducible.
AS_OF = pd.Timestamp("2026-06-30")

# A group needs this many projects before it gets its own free parameter; below the
# threshold it is pooled into the baseline rather than given a prior-driven multiplier
# that would look like evidence.
MIN_GROUP_N = 5

# Duration guards. A project cannot take 0 months, and a handful of corrupt rows carry
# absurd spans; both would dominate a log-likelihood.
MIN_MONTHS = 1.0
MAX_MONTHS = 600.0

TAU_GRID = [0.01, 0.02, 0.035, 0.05, 0.075, 0.10, 0.15, 0.20, 0.30, 0.50, 0.80]

# Folds for the cross-validated selection of tau. Stratified on the event indicator,
# because with a 7.4% event rate an unstratified fold can easily contain no events at
# all and contribute nothing but censoring to the held-out score.
CV_FOLDS = 5
CV_SEED = 42


# ---------------------------------------------------------------------------------
# Data assembly
# ---------------------------------------------------------------------------------

def _entity_map() -> Dict[str, str]:
    """
    Raw COMPANYNAME -> canonical_id, resolved EXACTLY as KAAL-CHAKRA resolves it.

    This must not drift. KAAL-CHAKRA looks up entity_scales by CANONICAL_ENTITY
    ("AAI"); if this fitter keyed its output by the raw string
    ("Airport Authority of India [AAI]") every lookup would miss and every entity would
    silently take the default -- reproducing the precise inert-table defect this module
    was written to remove. The unmapped sentinel is likewise kept identical.
    """
    if not os.path.exists(ENTITY_MAPPING_PATH):
        return {}
    with open(ENTITY_MAPPING_PATH, "r", encoding="utf-8") as f:
        payload = json.load(f)
    by_raw = payload.get("mapping_by_raw_string", {}) if isinstance(payload, dict) else {}
    return {raw: str(rec.get("canonical_id", "OTHER_UNSPECIFIED"))
            for raw, rec in by_raw.items() if isinstance(rec, dict)}


def load_frame() -> pd.DataFrame:
    df = pd.read_csv(DATA_PATH)

    df["OriginalCost"] = pd.to_numeric(df["OriginalCost"], errors="coerce").fillna(500.0)
    df["PhysicalProgress"] = pd.to_numeric(df["PhysicalProgress"], errors="coerce").fillna(0.0)
    for c in ("SanctionDate", "OriginalEndDate", "RevisedDate"):
        df[c] = pd.to_datetime(df[c], errors="coerce", dayfirst=True)

    emap = _entity_map()
    df["CANONICAL_ENTITY"] = df["COMPANYNAME"].map(lambda v: emap.get(str(v), "OTHER_UNSPECIFIED"))

    if "BaselineResetCount" in df.columns:
        df["BaselineResetCount"] = pd.to_numeric(df["BaselineResetCount"], errors="coerce").fillna(0.0)
    else:
        df["BaselineResetCount"] = (df["RevisedDate"].notna()).astype(float)

    # Planned duration: sanction -> original end date.
    planned = (df["OriginalEndDate"] - df["SanctionDate"]).dt.days / 30.4375
    df["PlannedMonths"] = planned.where(planned > 0)

    # Event indicator and observed/censoring time.
    completed = df["PhysicalProgress"] >= 100.0
    completion_proxy = df["RevisedDate"].fillna(df["OriginalEndDate"])
    dur_event = (completion_proxy - df["SanctionDate"]).dt.days / 30.4375
    dur_censored = (AS_OF - df["SanctionDate"]).dt.days / 30.4375

    df["Event"] = completed.astype(int)
    df["DurationMonths"] = np.where(completed, dur_event, dur_censored)

    df = df[
        df["SanctionDate"].notna()
        & df["PlannedMonths"].notna()
        & np.isfinite(df["DurationMonths"])
        & (df["DurationMonths"] >= MIN_MONTHS)
        & (df["DurationMonths"] <= MAX_MONTHS)
        & (df["PlannedMonths"] >= MIN_MONTHS)
    ].copy()

    return df


def _group_levels(series: pd.Series, min_n: int) -> List[str]:
    counts = series.value_counts()
    return sorted([str(k) for k, v in counts.items() if v >= min_n])


def build_design(df: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, Dict]:
    """Returns (X, offset, log_t, event, meta). X columns: [1, log10cost, resets, sectors..., entities...]."""
    sectors = _group_levels(df["SectorName"].astype(str), MIN_GROUP_N)
    entities = _group_levels(df["CANONICAL_ENTITY"].astype(str), MIN_GROUP_N)

    s_idx = {s: i for i, s in enumerate(sectors)}
    e_idx = {e: i for i, e in enumerate(entities)}

    n = len(df)
    n_fixed = 3  # intercept, log10 cost, resets
    X = np.zeros((n, n_fixed + len(sectors) + len(entities)))

    X[:, 0] = 1.0
    X[:, 1] = np.log10(np.maximum(df["OriginalCost"].to_numpy(float), 100.0) / 100.0)
    X[:, 2] = df["BaselineResetCount"].to_numpy(float)

    for r, (s, e) in enumerate(zip(df["SectorName"].astype(str), df["CANONICAL_ENTITY"].astype(str))):
        if s in s_idx:
            X[r, n_fixed + s_idx[s]] = 1.0
        if e in e_idx:
            X[r, n_fixed + len(sectors) + e_idx[e]] = 1.0

    offset = np.log(df["PlannedMonths"].to_numpy(float))
    log_t = np.log(df["DurationMonths"].to_numpy(float))
    event = df["Event"].to_numpy(float)

    meta = {
        "sectors": sectors,
        "entities": entities,
        "n_fixed": n_fixed,
        "group_slice": slice(n_fixed, X.shape[1]),
    }
    return X, offset, log_t, event, meta


# ---------------------------------------------------------------------------------
# Log-logistic AFT likelihood with right-censoring
# ---------------------------------------------------------------------------------

def _neg_log_lik(theta, X, offset, log_t, event, group_slice, tau):
    """
    theta = [beta..., log_sigma].  Penalty is the Normal(0, tau^2) prior on group effects,
    which is what makes thin cells shrink instead of overfitting.
    """
    beta = theta[:-1]
    log_sigma = theta[-1]
    sigma = np.exp(log_sigma)

    mu = offset + X @ beta
    z = (log_t - mu) / sigma

    # log(1 + e^z) without overflow.
    log1pez = np.logaddexp(0.0, z)

    # event: -log sigma - log t + z - 2*log(1+e^z)   |   censored: -log(1+e^z)
    ll = np.where(event > 0, -log_sigma - log_t + z - 2.0 * log1pez, -log1pez)
    nll = -np.sum(ll)

    if tau is not None and tau > 0:
        g = beta[group_slice]
        nll += np.sum(g ** 2) / (2.0 * tau ** 2)

    if not np.isfinite(nll):
        return 1e12
    return nll


def fit(X, offset, log_t, event, group_slice, tau) -> Tuple[np.ndarray, float]:
    p = X.shape[1]
    theta0 = np.zeros(p + 1)
    theta0[0] = np.log(1.3)      # start near a 1.3x overrun multiplier
    theta0[-1] = np.log(0.35)    # start near the previous hand-set dispersion

    res = optimize.minimize(
        _neg_log_lik, theta0,
        args=(X, offset, log_t, event, group_slice, tau),
        method="L-BFGS-B",
        options={"maxiter": 20000, "ftol": 1e-12, "gtol": 1e-10},
    )
    return res.x, float(res.fun)


def _unpenalised_nll(theta, X, offset, log_t, event, group_slice) -> float:
    return _neg_log_lik(theta, X, offset, log_t, event, group_slice, None)


def _stratified_folds(event: np.ndarray, k: int, seed: int) -> np.ndarray:
    """Fold assignment stratified on the event indicator, so every fold holds events."""
    rng = np.random.default_rng(seed)
    folds = np.zeros(len(event), dtype=int)
    for val in (1.0, 0.0):
        idx = np.flatnonzero(event == val)
        rng.shuffle(idx)
        folds[idx] = np.arange(len(idx)) % k
    return folds


def _numerical_hessian(f, theta, eps=1e-4) -> np.ndarray:
    p = len(theta)
    H = np.zeros((p, p))
    for i in range(p):
        for j in range(i, p):
            tpp, tpm, tmp, tmm = theta.copy(), theta.copy(), theta.copy(), theta.copy()
            tpp[i] += eps; tpp[j] += eps
            tpm[i] += eps; tpm[j] -= eps
            tmp[i] -= eps; tmp[j] += eps
            tmm[i] -= eps; tmm[j] -= eps
            H[i, j] = H[j, i] = (f(tpp) - f(tpm) - f(tmp) + f(tmm)) / (4 * eps * eps)
    return H


# ---------------------------------------------------------------------------------
# Orchestration
# ---------------------------------------------------------------------------------

def run() -> Dict:
    df = load_frame()
    X, offset, log_t, event, meta = build_design(df)
    gslice = meta["group_slice"]

    n_events = int(event.sum())
    n_censored = int((1 - event).sum())

    # ── SELECTING tau ────────────────────────────────────────────────────────────
    # By CROSS-VALIDATED held-out log-likelihood, not by the in-sample fit.
    #
    # The obvious criterion -- evaluate the unpenalised NLL at each penalised optimum --
    # is degenerate: relaxing the prior always moves the estimate closer to the
    # unpenalised MLE, so the score improves monotonically in tau and the grid maximum
    # always "wins". Using it selected tau=0.8 and handed Coal a 5.57x multiplier off
    # ZERO observed completions, which is precisely the confident-nonsense-in-thin-cells
    # failure this prior exists to prevent.
    #
    # Held-out likelihood has no such degeneracy: too little shrinkage overfits the thin
    # cells and is punished on the fold it did not see.
    folds = _stratified_folds(event, CV_FOLDS, CV_SEED)
    profile = []
    best_cv = None
    for tau in TAU_GRID:
        total = 0.0
        for f in range(CV_FOLDS):
            te = folds == f
            tr = ~te
            th, _ = fit(X[tr], offset[tr], log_t[tr], event[tr], gslice, tau)
            total += _unpenalised_nll(th, X[te], offset[te], log_t[te], event[te], gslice)
        profile.append({"tau": tau, "cv_heldout_nll": round(total, 4)})
        if best_cv is None or total < best_cv[1] - 1e-9:
            best_cv = (tau, total)

    tau_star = best_cv[0]
    theta, _ = fit(X, offset, log_t, event, gslice, tau_star)
    nll_star = _unpenalised_nll(theta, X, offset, log_t, event, gslice)
    beta, sigma = theta[:-1], float(np.exp(theta[-1]))

    # Posterior SDs from the inverse penalised Hessian at the optimum.
    try:
        H = _numerical_hessian(
            lambda t: _neg_log_lik(t, X, offset, log_t, event, gslice, tau_star), theta)
        cov = np.linalg.pinv(H)
        se = np.sqrt(np.clip(np.diag(cov), 0.0, None))
    except Exception:
        se = np.full(len(theta), float("nan"))

    n_fixed = meta["n_fixed"]
    sectors, entities = meta["sectors"], meta["entities"]

    sec_counts = df["SectorName"].astype(str).value_counts().to_dict()
    ent_counts = df["CANONICAL_ENTITY"].astype(str).value_counts().to_dict()
    sec_events = df[df["Event"] > 0]["SectorName"].astype(str).value_counts().to_dict()
    ent_events = df[df["Event"] > 0]["CANONICAL_ENTITY"].astype(str).value_counts().to_dict()

    b0 = float(beta[0])

    # The intercept rides with the sector factor so the product
    # sector_scale * entity_scale reproduces exp(b0 + gamma + delta) exactly, matching
    # KAAL-CHAKRA's existing multiplicative interface.
    sector_scales, sector_detail = {}, {}
    for i, s in enumerate(sectors):
        g = float(beta[n_fixed + i])
        sector_scales[s] = round(float(np.exp(b0 + g)), 4)
        sector_detail[s] = {
            "gamma": round(g, 4),
            "se": round(float(se[n_fixed + i]), 4),
            "multiplier": sector_scales[s],
            "n_projects": int(sec_counts.get(s, 0)),
            "n_events": int(sec_events.get(s, 0)),
            "evidence": "data" if int(sec_events.get(s, 0)) >= 5 else "prior-dominated",
        }

    entity_scales, entity_detail = {}, {}
    for j, e in enumerate(entities):
        d = float(beta[n_fixed + len(sectors) + j])
        entity_scales[e] = round(float(np.exp(d)), 4)
        entity_detail[e] = {
            "delta": round(d, 4),
            "se": round(float(se[n_fixed + len(sectors) + j]), 4),
            "multiplier": entity_scales[e],
            "n_projects": int(ent_counts.get(e, 0)),
            "n_events": int(ent_events.get(e, 0)),
            "evidence": "data" if int(ent_events.get(e, 0)) >= 5 else "prior-dominated",
        }

    artifact = {
        "method": "log-logistic AFT, penalised MLE with right-censoring (scipy L-BFGS-B)",
        "model": "log T = log(planned) + b0 + b_cost*log10(cost/100) + gamma_sector "
                 "+ delta_entity + b_reset*resets + sigma*Logistic(0,1)",
        "target": "total project duration in months (sanction -> completion)",
        "target_caveat": "MoSPI records no actual completion date. Completed projects use the "
                         "final revised target as the completion proxy; ongoing projects are "
                         "right-censored at elapsed time since sanction.",
        "as_of": str(AS_OF.date()),
        "n_observations": int(len(df)),
        "n_events": n_events,
        "n_right_censored": n_censored,
        "event_rate": round(n_events / max(1, len(df)), 4),
        "min_group_n": MIN_GROUP_N,
        "shrinkage_prior": "Normal(0, tau^2) on sector/entity effects",
        "tau_selected": tau_star,
        "tau_profile": profile,
        "tau_selection": "5-fold cross-validated held-out log-likelihood, stratified on the event indicator",
        "negative_log_likelihood": round(nll_star, 4),
        "fixed_effects": {
            "intercept_b0": round(b0, 4),
            "intercept_se": round(float(se[0]), 4),
            "baseline_multiplier": round(float(np.exp(b0)), 4),
            "cost_log10_elasticity": round(float(beta[1]), 4),
            "cost_log10_se": round(float(se[1]), 4),
            "reset_coefficient": round(float(beta[2]), 4),
            "reset_se": round(float(se[2]), 4),
        },
        "sigma": round(sigma, 4),
        "sigma_note": "log-logistic dispersion; shape gamma = 1/sigma",
        "shape_parameter_gamma": round(1.0 / sigma, 4) if sigma > 0 else None,
        "sector_scales": sector_scales,
        "entity_scales": entity_scales,
        "sector_detail": sector_detail,
        "entity_detail": entity_detail,
        "sector_default": round(float(np.exp(b0)), 4),
        "entity_default": 1.0,
        "interpretation": "sector_scales already carry the intercept, so "
                          "sector_scales[s] * entity_scales[e] = exp(b0 + gamma_s + delta_e). "
                          "Groups with fewer than 5 observed completions are prior-dominated "
                          "and sit near the pooled baseline by construction, not by evidence.",
    }

    os.makedirs(os.path.dirname(ARTIFACT_PATH), exist_ok=True)
    with open(ARTIFACT_PATH, "w", encoding="utf-8") as f:
        json.dump(artifact, f, indent=2, sort_keys=True)

    return artifact


if __name__ == "__main__":
    a = run()
    print("=" * 78)
    print("LOG-LOGISTIC AFT — PENALISED MLE WITH RIGHT-CENSORING")
    print("=" * 78)
    print(f"  observations          : {a['n_observations']}")
    print(f"  events / censored     : {a['n_events']} / {a['n_right_censored']}  "
          f"(event rate {a['event_rate']:.1%})")
    print(f"  tau selected          : {a['tau_selected']}")
    print(f"  negative log-lik      : {a['negative_log_likelihood']}")
    print(f"  baseline multiplier   : {a['fixed_effects']['baseline_multiplier']}  "
          f"(intercept {a['fixed_effects']['intercept_b0']} +/- {a['fixed_effects']['intercept_se']})")
    print(f"  cost elasticity       : {a['fixed_effects']['cost_log10_elasticity']} "
          f"+/- {a['fixed_effects']['cost_log10_se']}")
    print(f"  sigma / shape gamma   : {a['sigma']} / {a['shape_parameter_gamma']}")
    print()
    print("  SECTOR MULTIPLIERS (fitted; 'prior' = carried by the prior, not by events)")
    for s, d in sorted(a["sector_detail"].items(), key=lambda kv: -kv[1]["multiplier"]):
        tag = "data " if d["evidence"] == "data" else "prior"
        print(f"    {s[:44]:44s} {d['multiplier']:6.3f}  [{tag}] "
              f"n={d['n_projects']:4d} ev={d['n_events']:3d}")
    print()
    print(f"  wrote {ARTIFACT_PATH}")
