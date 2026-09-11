"""
PRAKALP-DRISHTI: SPLIT-CONFORMAL CALIBRATION OF THE KAAL-CHAKRA FAN

Turns the fan's coverage from a borrowed number into a measured one.

The defect this replaces
------------------------
The previous version fitted GradientBoosting quantile regressors for schedule SLIP
(RevisedDate - OriginalEndDate), calibrated a conformity quantile Q for THAT model,
measured 93.3% test coverage for THAT model's interval -- and KAAL-CHAKRA then
discarded the regressors, added +/-Q to a log-logistic quantile of TOTAL DURATION
around its own blended median, and reported the 93.3% on the result. On the same
450 test projects the fan it actually displayed covered the observed target 19.8%
of the time. A coverage guarantee is a property of one specific interval; it does
not transfer to a different one.

What is calibrated here
-----------------------
The quantity KAAL-CHAKRA actually displays. Let

    m_i  = the engine's raw (uncalibrated) median total duration for project i,
           in months from sanction   -- KaalChakraEngine.raw_median_months()
    y_i  = the observed months from sanction to the OFFICIAL REVISED COMPLETION DATE

and the log-ratio residual

    r_i  = log(y_i / m_i).

On a calibration split (disjoint from the split the coverage is later measured on)
the finite-sample quantile of r is taken at each level the fan exposes:

    q_alpha  =  r_(ceil((n+1) alpha))   for alpha in {0.10, 0.50, 0.80, 0.95}

and the displayed fan is  P_alpha = m_i * exp(q_alpha).

Why the log ratio: the AFT is a log-scale model, project durations span 3 to 300
months, and a multiplicative correction is the one that is scale-free across that
range. Why the 0.50 level is included: exp(q_0.50) is the engine's bias correction.
If the raw median runs late -- and under the survivorship bias in aft_survival.py it
does -- q_0.50 < 0 and the fan is pulled earlier. Nothing about that is hidden: the
raw median is returned alongside the calibrated one.

Guarantee and measurement
-------------------------
For exchangeable (project, residual) pairs, each P_alpha has finite-sample marginal
coverage >= alpha (Vovk et al. 2005; Lei et al. 2018), and the band [P10, P95] has
coverage >= 0.85 -- the difference of the two levels, since the band is two one-sided
quantiles of the same residual. That is the nominal figure. The number the product
reports is then MEASURED on the untouched test split.

Which projects can calibrate a forecast
---------------------------------------
Only those whose official target still lies AHEAD of the as-of date. For a project
already past its target and not complete, the target is not an observation of
completion -- it is the information that completion exceeds it, i.e. a censored
value, exactly as in aft_survival.py. Calibrating point residuals on it would repeat
the censored-as-event error the survival model exists to avoid, and it is also the
population for which the fan's "no earlier than today" floor is active by
construction. Overdue projects are therefore excluded from calibration and the
share excluded is published.

Coverage is then measured on the fan the engine DISPLAYS -- forecast_project()
end to end, floors included -- not on an intermediate quantity.

Target caveat, stated as before
-------------------------------
y is the official revised target, not actual completion; MoSPI records no actual
completion date for ongoing projects. This is the only completion-like observable,
and it is the same one the previous version used.

Run as a script to (re)fit; KAAL-CHAKRA consumes the saved artefact at runtime.
"""

from __future__ import annotations

import json
import math
import os
import sys
from typing import Dict, List, Optional

import numpy as np
import pandas as pd
from analytics_engine.corpus_source import load_corpus

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARTIFACT_PATH = os.path.join(BASE_DIR, "artifacts", "conformal_calibration.json")

RANDOM_SEED = 42
QUANTILE_LEVELS = [0.10, 0.50, 0.80, 0.95]
BAND = (0.10, 0.95)
NOMINAL_BAND_COVERAGE = BAND[1] - BAND[0]     # 0.85

MIN_PLANNED_MONTHS, MAX_PLANNED_MONTHS = 3.0, 400.0
MIN_TARGET_MONTHS, MAX_TARGET_MONTHS = 3.0, 480.0


def build_labelled_frame() -> pd.DataFrame:
    """Projects where the official revised completion date is observed."""
    df = load_corpus()
    orig = pd.to_datetime(df["OriginalEndDate"], errors="coerce", dayfirst=True)
    rev = pd.to_datetime(df["RevisedDate"], errors="coerce", dayfirst=True)
    sanc = pd.to_datetime(df["SanctionDate"], errors="coerce", dayfirst=True)

    out = pd.DataFrame({
        "project_id": df["ProjectId"].astype(str),
        "planned_months": (orig - sanc).dt.days / 30.4375,
        "target_months": (rev - sanc).dt.days / 30.4375,
    })
    ok = (
        out["planned_months"].between(MIN_PLANNED_MONTHS, MAX_PLANNED_MONTHS)
        & out["target_months"].between(MIN_TARGET_MONTHS, MAX_TARGET_MONTHS)
    )
    return out[ok].reset_index(drop=True)


def _finite_sample_quantile(values: np.ndarray, level: float) -> float:
    """r_(ceil((n+1)*level)), clipped to the sample. The conformal quantile."""
    n = len(values)
    rank = math.ceil((n + 1) * level)
    rank = min(max(rank, 1), n)
    return float(np.sort(values)[rank - 1])


def fit_and_calibrate() -> dict:
    # Imported here so the module can be read without booting the engine.
    from analytics_engine.kaal_chakra import get_kaal_chakra_engine
    engine = get_kaal_chakra_engine()
    # Calibrate against the RAW median: the engine must not already be applying a
    # previous calibration while we compute a new one.
    engine.conformal = None

    frame = build_labelled_frame()
    n = len(frame)
    if n < 300:
        raise RuntimeError(f"Only {n} labelled rows; too few to calibrate honestly.")

    cores = [engine._forecast_core(pid) for pid in frame["project_id"]]
    raw_median = np.array([c["median_expected_duration"] for c in cores])
    elapsed = np.array([c["current_months"] for c in cores])
    y_all = frame["target_months"].to_numpy(float)

    # Forward-looking targets only: see the docstring. The overdue share is reported.
    forward = y_all >= elapsed
    n_overdue_excluded = int((~forward).sum())
    frame = frame[forward].reset_index(drop=True)
    raw_median = raw_median[forward]
    y = y_all[forward]
    n = len(frame)
    r = np.log(y / np.maximum(raw_median, 1e-6))

    rng = np.random.default_rng(RANDOM_SEED)
    idx = rng.permutation(n)
    n_cal = int(n * 0.50)
    cal, te = idx[:n_cal], idx[n_cal:]

    # --- calibration split: one quantile per displayed level ------------------
    log_q = {str(a): _finite_sample_quantile(r[cal], a) for a in QUANTILE_LEVELS}

    # --- test split: what the DISPLAYED fan actually covers ------------------
    # Install the calibration on the engine and call forecast_project() end to end,
    # so floors and monotone rearrangement are inside the measurement.
    engine.conformal = {"log_ratio_quantiles": log_q, "method": "calibrating", "n_test": 0,
                        "empirical_coverage_on_test": float("nan")}
    disp = []
    for i in te:
        fc = engine.forecast_project(frame.iloc[i]["project_id"])
        sanc = engine.df[engine.df["ProjectId"].astype(str) == frame.iloc[i]["project_id"]].iloc[0]["SanctionDate"]
        disp.append([(pd.Timestamp(getattr(fc, k)) - sanc).days / 30.4375
                     for k in ("p10_date", "p50_date", "p80_date", "p95_date")])
    disp = np.array(disp)
    engine.conformal = None
    lo, p50_cal, hi = disp[:, 0], disp[:, 1], disp[:, 3]
    covered = (y[te] >= lo) & (y[te] <= hi)
    band_cov = float(np.mean(covered))
    per_level_cov = {a: float(np.mean(y[te] <= disp[:, j])) for j, a in enumerate(QUANTILE_LEVELS)}

    # Uncalibrated baseline: the log-logistic quantiles of the raw median, which is
    # what the engine displays when no artefact is present.
    sigma = float(engine.model_weights.get("sigma", 0.35))
    lo_u = raw_median[te] * (BAND[0] / (1 - BAND[0])) ** sigma
    hi_u = raw_median[te] * (BAND[1] / (1 - BAND[1])) ** sigma
    raw_cov = float(np.mean((y[te] >= lo_u) & (y[te] <= hi_u)))

    return {
        "method": "split-conformal on the engine's own median, log-ratio residual quantiles",
        "references": ["Vovk, Gammerman & Shafer 2005", "Lei, G'Sell, Rinaldo, Tibshirani & Wasserman 2018",
                       "Romano, Patterson & Candes 2019 (CQR)"],
        "calibrated_quantity": "KaalChakraEngine.raw_median_months (uncalibrated blended AFT/earned-value median)",
        "target": "months from sanction to the OFFICIAL REVISED completion date",
        "target_caveat": ("The official revised target, not actual completion; the corpus records "
                          "no actual completion date for ongoing projects."),
        "residual": "r = log(target_months / raw_median_months)",
        "n_labelled": int(n), "n_calibration": int(len(cal)), "n_test": int(len(te)),
        "n_overdue_excluded": n_overdue_excluded,
        "population": ("Projects whose official revised target lies ahead of the as-of date. "
                       "Overdue projects carry censored, not observed, completion information and "
                       "are excluded from calibration; for them the displayed P10 is 'no earlier "
                       "than now' by construction."),
        "measured_on": "forecast_project() end to end, floors and monotone rearrangement included",
        "log_ratio_quantiles": log_q,
        "multipliers": {k: round(math.exp(v), 4) for k, v in log_q.items()},
        "bias_correction_note": (
            f"exp(q_0.50) = {math.exp(log_q['0.5']):.3f}: the displayed P50 is the raw median "
            f"times this. Below 1.0 means the raw AFT/earned-value median runs late against "
            f"official targets; see aft_survival.json 'survivorship'."),
        "nominal_band": list(BAND),
        "nominal_band_coverage": NOMINAL_BAND_COVERAGE,
        "empirical_coverage_on_test": round(band_cov, 4),
        "per_level_coverage_on_test": {str(k): round(v, 4) for k, v in per_level_cov.items()},
        "uncalibrated_coverage_on_test": round(raw_cov, 4),
        "mean_band_width_months": round(float(np.mean(hi - lo)), 2),
        "p50_test_mae_months": round(float(np.mean(np.abs(y[te] - p50_cal))), 2),
        "raw_median_test_mae_months": round(float(np.mean(np.abs(y[te] - raw_median[te]))), 2),
        "random_seed": RANDOM_SEED,
    }


def load_calibration() -> Optional[dict]:
    if not os.path.exists(ARTIFACT_PATH):
        return None
    try:
        with open(ARTIFACT_PATH, "r", encoding="utf-8") as f:
            art = json.load(f)
        # An artefact from the superseded design has no per-level quantiles and must
        # not be consumed as though it calibrated this fan.
        return art if "log_ratio_quantiles" in art else None
    except Exception:
        return None


def main() -> None:
    if sys.stdout and hasattr(sys.stdout, "buffer"):
        import io
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

    res = fit_and_calibrate()
    os.makedirs(os.path.dirname(ARTIFACT_PATH), exist_ok=True)
    with open(ARTIFACT_PATH, "w", encoding="utf-8") as f:
        json.dump(res, f, indent=2)

    print("SPLIT-CONFORMAL CALIBRATION OF THE KAAL-CHAKRA FAN")
    print("=" * 66)
    print(f"  calibrated quantity       : {res['calibrated_quantity']}")
    print(f"  labelled rows             : {res['n_labelled']}  (cal {res['n_calibration']} / test {res['n_test']})  overdue excluded: {res['n_overdue_excluded']}")
    print(f"  multipliers on raw median : {res['multipliers']}")
    print(f"  {res['bias_correction_note']}")
    print()
    print(f"  nominal band [P10, P95]   : {res['nominal_band_coverage']:.0%}")
    print(f"  MEASURED coverage on test : {res['empirical_coverage_on_test']:.1%}   <-- for THIS fan")
    print(f"  per-level (P<=alpha)      : {res['per_level_coverage_on_test']}")
    print(f"  uncalibrated would be     : {res['uncalibrated_coverage_on_test']:.1%}")
    print(f"  P50 MAE months  raw -> cal: {res['raw_median_test_mae_months']} -> {res['p50_test_mae_months']}")
    print(f"  mean band width           : {res['mean_band_width_months']} months")
    print()
    print(f"Wrote {ARTIFACT_PATH}")


if __name__ == "__main__":
    main()
