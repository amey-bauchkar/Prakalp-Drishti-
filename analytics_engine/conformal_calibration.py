"""
PRAKALP-DRISHTI: CONFORMALISED QUANTILE CALIBRATION (KAAL-CHAKRA)

Turns the "90% coverage guarantee" from an asserted number into a measured one.

The problem this replaces
------------------------
KAAL-CHAKRA advertised "Conformalized Quantile Regression (P10-P95)" with a "90%
coverage guarantee", but the interval was produced by

    cqr_offsets = np.array([-3.0, 0.0, 4.5, 9.0]) * rem_uncertainty_scale

-- four hand-chosen constants. There was no calibration set, no conformity score, and
no measurement of whether the intervals actually covered anything. The guarantee was a
label, not a property.

What is calibrated here
-----------------------
The target is SCHEDULE SLIPPAGE: how far a project's official completion date moves,

    slip_months = RevisedDate - OriginalEndDate

This is a genuine observable, available for 1,800 projects in the MoSPI corpus. It is
deliberately NOT "actual completion date", which the dataset does not contain for
ongoing projects -- claiming to calibrate against real completions would repeat the
overclaiming this module exists to remove. The honest statement is: given a project's
sector, executing entity, cost, planned duration and reported progress, how much does
its official target date slip, and with what interval?

Method: split-conformal CQR (Romano, Patterson & Candes, NeurIPS 2019)
---------------------------------------------------------------------
  1. partition the labelled rows into train / calibration / test, disjointly;
  2. fit quantile regressors at the low and high nominal levels on TRAIN;
  3. on CALIBRATION compute the conformity score
         E_i = max( q_lo(x_i) - y_i ,  y_i - q_hi(x_i) )
     which is positive exactly when the nominal interval misses y_i;
  4. take Q = the ceil((n+1)(1-alpha))/n empirical quantile of E;
  5. the conformalised interval is [q_lo - Q, q_hi + Q].

Step 4 is what buys the guarantee: for exchangeable data the resulting interval has
finite-sample marginal coverage of at least 1-alpha, whatever the underlying model
does. TEST is then used to report the coverage actually achieved -- a number the
system can defend rather than assert.

Run as a script to (re)fit; KAAL-CHAKRA consumes the saved artefact at runtime, so no
model fitting happens on the request path.
"""

from __future__ import annotations

import json
import math
import os
import sys
from typing import Dict, Optional

import numpy as np
import pandas as pd
from analytics_engine.corpus_source import load_corpus

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, "paimana_extracted", "PAIMANA_MASTER_PROJECTS_DATABASE.csv")
ENTITY_MAPPING_PATH = os.path.join(BASE_DIR, "paimana_extracted", "CANONICAL_ENTITIES_MAPPING.json")
ARTIFACT_PATH = os.path.join(BASE_DIR, "artifacts", "conformal_calibration.json")

RANDOM_SEED = 42
# Nominal quantile levels the fan chart exposes.
QUANTILE_LEVELS = [0.10, 0.50, 0.80, 0.95]
# Target marginal coverage for the outer P10-P95 band.
TARGET_COVERAGE = 0.90

# Filters that define a usable labelled row. Both bounds are generous; they exist to
# drop date-entry errors (a 1900 end date, a 25-year "slip") rather than to shape the
# distribution towards a flattering result.
MIN_PLANNED_MONTHS, MAX_PLANNED_MONTHS = 3.0, 400.0
MIN_SLIP_MONTHS, MAX_SLIP_MONTHS = -12.0, 300.0


def _load_entity_map() -> Dict[str, str]:
    if not os.path.exists(ENTITY_MAPPING_PATH):
        return {}
    with open(ENTITY_MAPPING_PATH, "r", encoding="utf-8") as f:
        raw = json.load(f).get("mapping_by_raw_string", {})
    return {k: (v or {}).get("canonical_id") or "OTHER" for k, v in raw.items()}


def build_labelled_frame() -> pd.DataFrame:
    """Rows where schedule slippage is actually observed."""
    df = load_corpus()
    ent = _load_entity_map()

    orig = pd.to_datetime(df["OriginalEndDate"], errors="coerce", dayfirst=True)
    rev = pd.to_datetime(df["RevisedDate"], errors="coerce", dayfirst=True)
    sanc = pd.to_datetime(df["SanctionDate"], errors="coerce", dayfirst=True)

    out = pd.DataFrame({
        "project_id": df["ProjectId"].astype(str),
        "sector": df["SectorName"].astype(str),
        "entity": df["COMPANYNAME"].astype(str).map(lambda x: ent.get(x, "OTHER")),
        "orig_cost": pd.to_numeric(df["OriginalCost"], errors="coerce").fillna(500.0),
        "rev_cost": pd.to_numeric(df["RevisedCost"], errors="coerce"),
        "progress": pd.to_numeric(df["PhysicalProgress"], errors="coerce").fillna(25.0),
        "planned_months": (orig - sanc).dt.days / 30.4375,
        "slip_months": (rev - orig).dt.days / 30.4375,
    })
    out["rev_cost"] = out["rev_cost"].fillna(out["orig_cost"])
    out["overrun_pct"] = np.where(
        out["orig_cost"] > 0, (out["rev_cost"] - out["orig_cost"]) / out["orig_cost"] * 100.0, 0.0)

    ok = (
        out["planned_months"].between(MIN_PLANNED_MONTHS, MAX_PLANNED_MONTHS)
        & out["slip_months"].between(MIN_SLIP_MONTHS, MAX_SLIP_MONTHS)
        & out["slip_months"].notna()
    )
    return out[ok].reset_index(drop=True)


def _design_matrix(frame: pd.DataFrame, sectors: list, entities: list) -> np.ndarray:
    """Numeric features + one-hot sector/entity. Kept deliberately small: with ~900
    training rows a wide encoding would overfit, and conformal calibration corrects
    the interval width but cannot repair a badly overfit point predictor."""
    num = np.column_stack([
        frame["planned_months"].to_numpy(float),
        np.log10(np.maximum(frame["orig_cost"].to_numpy(float), 1.0)),
        frame["progress"].to_numpy(float),
        np.clip(frame["overrun_pct"].to_numpy(float), -100.0, 500.0),
    ])
    sec = np.column_stack([(frame["sector"] == s).to_numpy(float) for s in sectors]) \
        if sectors else np.empty((len(frame), 0))
    ent = np.column_stack([(frame["entity"] == e).to_numpy(float) for e in entities]) \
        if entities else np.empty((len(frame), 0))
    return np.hstack([num, sec, ent])


def fit_and_calibrate(alpha: float = 1.0 - TARGET_COVERAGE) -> dict:
    from sklearn.ensemble import GradientBoostingRegressor

    frame = build_labelled_frame()
    n = len(frame)
    if n < 300:
        raise RuntimeError(f"Only {n} labelled rows; too few to calibrate honestly.")

    rng = np.random.default_rng(RANDOM_SEED)
    idx = rng.permutation(n)
    n_tr, n_cal = int(n * 0.50), int(n * 0.25)
    tr, cal, te = idx[:n_tr], idx[n_tr:n_tr + n_cal], idx[n_tr + n_cal:]

    # Categories are taken from TRAIN only. Deriving them from the full frame would
    # leak information about calibration/test rows into the feature space.
    sectors = sorted(frame.iloc[tr]["sector"].value_counts().head(12).index.tolist())
    entities = sorted(frame.iloc[tr]["entity"].value_counts().head(12).index.tolist())

    X = _design_matrix(frame, sectors, entities)
    y = frame["slip_months"].to_numpy(float)

    lo_q, hi_q = alpha / 2.0, 1.0 - alpha / 2.0
    models = {}
    for level in sorted(set(QUANTILE_LEVELS + [lo_q, hi_q])):
        m = GradientBoostingRegressor(
            loss="quantile", alpha=float(level),
            n_estimators=200, max_depth=3, learning_rate=0.05,
            min_samples_leaf=20, random_state=RANDOM_SEED,
        )
        m.fit(X[tr], y[tr])
        models[level] = m

    # --- split-conformal correction on the calibration split -----------------
    q_lo_cal = models[lo_q].predict(X[cal])
    q_hi_cal = models[hi_q].predict(X[cal])
    scores = np.maximum(q_lo_cal - y[cal], y[cal] - q_hi_cal)

    n_cal_eff = len(scores)
    rank = math.ceil((n_cal_eff + 1) * (1.0 - alpha))
    rank = min(max(rank, 1), n_cal_eff)
    Q = float(np.sort(scores)[rank - 1])

    # --- honest evaluation on the untouched test split -----------------------
    q_lo_te = models[lo_q].predict(X[te]) - Q
    q_hi_te = models[hi_q].predict(X[te]) + Q
    covered = (y[te] >= q_lo_te) & (y[te] <= q_hi_te)
    empirical_coverage = float(np.mean(covered))
    mean_width = float(np.mean(q_hi_te - q_lo_te))

    # Uncalibrated baseline, to show what the correction actually bought.
    raw_cov = float(np.mean((y[te] >= models[lo_q].predict(X[te])) &
                            (y[te] <= models[hi_q].predict(X[te]))))

    # Per-quantile residual offsets, so the existing P10/P50/P80/P95 fan can be
    # driven by calibrated numbers instead of the hand-picked [-3, 0, 4.5, 9].
    per_quantile = {}
    for level in QUANTILE_LEVELS:
        resid = y[cal] - models[level].predict(X[cal])
        per_quantile[str(level)] = {
            "residual_offset_months": float(np.quantile(resid, level)),
            "calibration_mae_months": float(np.mean(np.abs(resid))),
        }

    return {
        "method": "split-conformal CQR (Romano, Patterson & Candes 2019)",
        "target": "schedule slippage in months (RevisedDate - OriginalEndDate)",
        "target_caveat": (
            "Slippage of the OFFICIAL target date, not actual completion. The corpus "
            "does not record actual completion for ongoing projects."),
        "alpha": alpha,
        "target_coverage": 1.0 - alpha,
        "n_labelled": int(n),
        "n_train": int(len(tr)), "n_calibration": int(n_cal_eff), "n_test": int(len(te)),
        "conformal_quantile_Q_months": round(Q, 3),
        "empirical_coverage_on_test": round(empirical_coverage, 4),
        "uncalibrated_coverage_on_test": round(raw_cov, 4),
        "mean_interval_width_months": round(mean_width, 2),
        "per_quantile": per_quantile,
        "sectors": sectors, "entities": entities,
        "random_seed": RANDOM_SEED,
    }


def load_calibration() -> Optional[dict]:
    if not os.path.exists(ARTIFACT_PATH):
        return None
    try:
        with open(ARTIFACT_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
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

    print("SPLIT-CONFORMAL CALIBRATION — KAAL-CHAKRA")
    print("=" * 62)
    print(f"  target                    : {res['target']}")
    print(f"  labelled rows             : {res['n_labelled']}  "
          f"(train {res['n_train']} / cal {res['n_calibration']} / test {res['n_test']})")
    print(f"  conformal quantile Q      : {res['conformal_quantile_Q_months']} months")
    print()
    print(f"  nominal coverage          : {res['target_coverage']:.0%}")
    print(f"  MEASURED coverage on test : {res['empirical_coverage_on_test']:.1%}   <-- the defensible number")
    print(f"  uncalibrated would be     : {res['uncalibrated_coverage_on_test']:.1%}")
    print(f"  mean interval width       : {res['mean_interval_width_months']} months")
    print()
    print(f"Wrote {ARTIFACT_PATH}")


if __name__ == "__main__":
    main()
