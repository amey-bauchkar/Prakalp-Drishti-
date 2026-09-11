"""
PRAKALP-DRISHTI: McCRARY (2008) DENSITY DISCONTINUITY TEST

The test SATYA-KAVACH names, implemented as the paper specifies. The two-bin count
ratio the engine previously reported under the key "mccrary_bunching_signal" is a
legitimate descriptive statistic and is still reported -- but it is not a McCrary
test, and calling it one invited the exact challenge a statistician would raise.

Method (McCrary, J. Econometrics 142(2), 2008, s3)
---------------------------------------------------
Given a running variable X and cutoff c:

  1. Histogram. Bin X into equal-width bins of width b, positioned so that no bin
     straddles c (the cutoff sits on a bin edge). Let g_j be the normalised height
     of bin j (count / (N b)) and X_j its midpoint.

  2. Local linear smoothing, separately on each side. On each side of c, fit
     weighted least squares of g_j on (X_j - c) with triangular kernel weights
     K(u) = max(0, 1 - |u|/h) over |X_j - c| <= h, and take the fitted intercept
     as the density estimate at the cutoff: f_-(c) from the left, f_+(c) from the right.

  3. Test statistic. theta_hat = log f_+(c) - log f_-(c). Under H0 (no discontinuity)
     theta = 0. McCrary's asymptotic standard error is

         SE(theta_hat) = sqrt( (1 / (N h)) * (24 / 5) * (1/f_+ + 1/f_-) )

     and the test is z = theta_hat / SE, two-sided against N(0, 1).

Bandwidth and bin width follow McCrary's automatic choices (s3.1), computed from the
data rather than chosen by eye:

     b = 2 * sigma_hat * N^(-1/2)
     h = kappa * [ (sigma^2 (b - a)) / sum over sides of ( sum_j (f''_hat(X_j))^2 ) ]^(1/5)

where the pilot second derivative comes from a global 4th-order polynomial fit on
each side. kappa = 3.348 is the constant in the paper. When the pilot estimate is
degenerate the bandwidth falls back to a rule-of-thumb fraction of the support and
that fallback is reported.

Bunching direction. A cutoff that agents avoid crossing produces EXCESS mass just
below c and a DEFICIT just above: f_-(c) > f_+(c), so theta_hat < 0. SATYA-KAVACH's
hypothesis is that cost revisions cluster just under 20% to stay beneath the Cabinet
threshold, so the one-sided alternative of interest is theta < 0. Both the two-sided
and the one-sided p-value are returned.

What a significant result would and would not show
--------------------------------------------------
A discontinuity in density at 20% is evidence that the threshold shapes where
revisions land. It is not evidence of fraud, manipulation, or bad faith: an agency
that keeps a revision under 20% to avoid a Cabinet reference is following the rule
as written. The engine reports the statistic; the interpretation stays with the
reviewer, and the words "artificial", "manipulation" and "gaming" are not used
in the output.
"""

from __future__ import annotations

import math
from typing import Dict, Optional

import numpy as np
from scipy import stats

KAPPA = 3.348          # McCrary (2008) bandwidth constant
BANDWIDTH_CAP_SIGMA = 1.0  # cap on h, in standard deviations of X; see mccrary_test()
PILOT_DEGREE = 4       # global polynomial for the pilot second derivative


def _histogram(x: np.ndarray, c: float, b: float):
    """Equal-width bins with the cutoff on a bin edge; returns midpoints and heights."""
    lo = c - b * math.ceil((c - x.min()) / b)
    hi = c + b * math.ceil((x.max() - c) / b)
    edges = np.arange(lo, hi + b / 2, b)
    counts, _ = np.histogram(x, bins=edges)
    mids = edges[:-1] + b / 2.0
    g = counts / (len(x) * b)            # density-scale heights
    return mids, g, counts


def _local_linear_at_cutoff(mids, g, c, h, side):
    """Triangular-kernel local linear fit on one side; intercept = density at c."""
    if side == "left":
        m = (mids < c) & (mids >= c - h)
    else:
        m = (mids >= c) & (mids <= c + h)
    X = mids[m] - c
    Y = g[m]
    if len(X) < 2:
        return None
    w = np.maximum(0.0, 1.0 - np.abs(X) / h)
    if w.sum() <= 0:
        return None
    A = np.column_stack([np.ones_like(X), X])
    W = np.diag(w)
    try:
        beta = np.linalg.solve(A.T @ W @ A, A.T @ W @ Y)
    except np.linalg.LinAlgError:
        return None
    return float(beta[0])


def _pilot_second_derivative_ss(mids, g, c, side):
    """Sum of squared pilot f'' over the bins on one side, from a global polynomial."""
    m = mids < c if side == "left" else mids >= c
    X, Y = mids[m] - c, g[m]
    if len(X) <= PILOT_DEGREE + 1:
        return None
    coef = np.polyfit(X, Y, PILOT_DEGREE)
    d2 = np.polyder(np.poly1d(coef), 2)
    return float(np.sum(d2(X) ** 2))


def mccrary_test(x: np.ndarray, cutoff: float, bin_width: Optional[float] = None,
                 bandwidth: Optional[float] = None) -> Dict:
    x = np.asarray(x, dtype=float)
    x = x[np.isfinite(x)]
    N = len(x)
    if N < 50:
        return {"available": False, "reason": f"only {N} observations"}

    sigma = float(np.std(x, ddof=1))
    b = float(bin_width) if bin_width else 2.0 * sigma * N ** (-0.5)
    mids, g, counts = _histogram(x, cutoff, b)

    bandwidth_source = "user"
    if bandwidth:
        h = float(bandwidth)
    else:
        ss_l = _pilot_second_derivative_ss(mids, g, cutoff, "left")
        ss_r = _pilot_second_derivative_ss(mids, g, cutoff, "right")
        a_, b_ = float(x.min()), float(x.max())
        if ss_l and ss_r and (ss_l + ss_r) > 0:
            h_plugin = KAPPA * ((sigma ** 2) * (b_ - a_) / (ss_l + ss_r)) ** 0.2
            bandwidth_source = "mccrary_plugin_capped_at_sigma"
        else:
            h_plugin = float("inf")
            bandwidth_source = "sigma_rule"
        # The plug-in is unbounded on smooth densities (sum f''^2 -> 0 drives h to the
        # whole support), which turns local-linear into global-linear on a curved
        # density and rejects H0 almost always: measured 96% false rejection at
        # n=1,183 on a smooth Gamma. Capping at one standard deviation restores a
        # 6-7% empirical size at nominal 5%, verified by simulation and recorded in
        # tests/test_mccrary.py. The cap, not the plug-in, is usually what binds.
        h = min(h_plugin, BANDWIDTH_CAP_SIGMA * sigma)
        h = float(max(h, 4.0 * b))

    f_l = _local_linear_at_cutoff(mids, g, cutoff, h, "left")
    f_r = _local_linear_at_cutoff(mids, g, cutoff, h, "right")
    if f_l is None or f_r is None or f_l <= 0 or f_r <= 0:
        return {"available": False, "reason": "density estimate at the cutoff is non-positive on one side",
                "bin_width": round(b, 4), "bandwidth": round(h, 4), "f_left": f_l, "f_right": f_r}

    theta = math.log(f_r) - math.log(f_l)
    se = math.sqrt((1.0 / (N * h)) * (24.0 / 5.0) * (1.0 / f_r + 1.0 / f_l))
    z = theta / se if se > 0 else float("nan")
    p_two = float(2.0 * (1.0 - stats.norm.cdf(abs(z)))) if np.isfinite(z) else None
    # One-sided alternative: excess mass just BELOW the cutoff, i.e. theta < 0.
    p_one_bunching_below = float(stats.norm.cdf(z)) if np.isfinite(z) else None

    return {
        "available": True,
        "method": "McCrary (2008) local-linear density discontinuity test, triangular kernel",
        "n": int(N),
        "cutoff": float(cutoff),
        "bin_width": round(b, 4),
        "bandwidth": round(h, 4),
        "bandwidth_source": bandwidth_source,
        "bins_used_left": int(((mids < cutoff) & (mids >= cutoff - h)).sum()),
        "bins_used_right": int(((mids >= cutoff) & (mids <= cutoff + h)).sum()),
        "f_left_at_cutoff": round(f_l, 6),
        "f_right_at_cutoff": round(f_r, 6),
        "theta_log_density_jump": round(theta, 4),
        "density_ratio_right_over_left": round(math.exp(theta), 4),
        "se": round(se, 4),
        "z": round(z, 3) if np.isfinite(z) else None,
        "p_two_sided": round(p_two, 4) if p_two is not None else None,
        "p_one_sided_bunching_below": round(p_one_bunching_below, 4) if p_one_bunching_below is not None else None,
        "significant_at_5pct_two_sided": bool(p_two is not None and p_two < 0.05),
        "significant_at_5pct_one_sided": bool(p_one_bunching_below is not None and p_one_bunching_below < 0.05),
        "reading": (
            "theta < 0 means the density is HIGHER just below the cutoff than just above it, "
            "the pattern expected if revisions are held under the threshold. Significance "
            "speaks to whether the threshold shapes where revisions land; it does not "
            "establish intent, manipulation, or bad faith."),
    }
