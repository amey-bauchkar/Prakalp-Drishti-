"""
PRAKALP-DRISHTI: GEOCODE VALIDATION SCORER

Reads the hand-labelled worksheet and produces the publishable precision figures.

Statistics, and why these specific choices
------------------------------------------
* WILSON score intervals, not normal-approximation (Wald). At n=45 with a pass rate
  near 0.9, Wald intervals overshoot past 1.0 and understate uncertainty in exactly
  the region we care about. Wilson stays inside [0,1] and behaves at the extremes.

* PORTFOLIO precision is a population-WEIGHTED combination of the per-tier rates, not
  the raw pass rate over the sample. The sample deliberately over-represents small
  tiers (equal allocation), so an unweighted average would misstate the portfolio.
  Weighting by true tier population undoes the sampling design.

* UNSURE labels are excluded from the denominator rather than counted as failures.
  Counting them as failures would understate precision; counting them as passes would
  overstate it. Excluding them is the honest option, and the count is reported so a
  reader can see how much was set aside.

* The NEGATIVE CONTROL is scored separately and never enters the portfolio figure. It
  measures the labeller, not the geocoder: state centroids are known-bad, so a high
  CORRECT rate there means the labelling was too lenient and the headline number
  should be discounted.

Two precision definitions are reported because they answer different questions:
    strict   CORRECT only            -- "imagery here shows this project"
    lenient  CORRECT or NEAR         -- "we are in the right locality"
The EO pipeline depends on the strict one; the map view only needs the lenient one.
"""

from __future__ import annotations

import csv
import json
import math
import os
import sys
from collections import Counter, defaultdict

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GEO_PATH = os.path.join(BASE_DIR, "paimana_extracted", "satellite_data",
                        "ALL_2207_PROJECTS_GEOREFERENCED.json")
WORKSHEET = os.path.join(BASE_DIR, "artifacts", "geocode_validation_worksheet.csv")
OUT_JSON = os.path.join(BASE_DIR, "artifacts", "geocode_precision.json")

VALID = {"CORRECT", "NEAR", "WRONG", "UNSURE"}
NEGATIVE_CONTROL_TIER = "STATE_CENTROID_MATCH"


def wilson(k: int, n: int, z: float = 1.96):
    """Wilson score interval for a binomial proportion."""
    if n == 0:
        return (None, None, None)
    p = k / n
    d = 1.0 + z * z / n
    centre = (p + z * z / (2 * n)) / d
    half = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d
    return p, max(0.0, centre - half), min(1.0, centre + half)


def haversine_km(a1, o1, a2, o2):
    r = 6371.0
    p1, p2 = math.radians(a1), math.radians(a2)
    dp, dl = math.radians(a2 - a1), math.radians(o2 - o1)
    h = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(h))


def main() -> None:
    if sys.stdout and hasattr(sys.stdout, "buffer"):
        import io
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

    if not os.path.exists(WORKSHEET):
        print(f"No worksheet at {WORKSHEET}. Run build_geocode_validation_sample.py first.")
        sys.exit(1)

    with open(GEO_PATH, "r", encoding="utf-8") as f:
        populations = Counter(str(g.get("geocode_precision")) for g in json.load(f))

    rows = []
    with open(WORKSHEET, "r", encoding="utf-8-sig", newline="") as f:
        for r in csv.DictReader(f):
            if r.get("project_id"):
                rows.append(r)

    bad = sorted({(r.get("verdict") or "").strip().upper() for r in rows}
                 - VALID - {""})
    if bad:
        print(f"Unrecognised verdict values: {bad}")
        print(f"Allowed: {sorted(VALID)}")
        sys.exit(1)

    labelled = [r for r in rows if (r.get("verdict") or "").strip()]
    if not labelled:
        print(f"Worksheet has {len(rows)} rows but none are labelled yet.")
        print("Fill the 'verdict' column (CORRECT / NEAR / WRONG / UNSURE), then re-run.")
        sys.exit(1)

    by_tier = defaultdict(list)
    for r in labelled:
        by_tier[r["geocode_precision"]].append(r)

    errors_km = []
    for r in labelled:
        try:
            tla, tlo = float(r["true_lat"]), float(r["true_lon"])
            errors_km.append(haversine_km(float(r["lat"]), float(r["lon"]), tla, tlo))
        except (TypeError, ValueError):
            continue

    tiers_out = {}
    for tier, rs in sorted(by_tier.items()):
        v = Counter((r["verdict"] or "").strip().upper() for r in rs)
        scored = v["CORRECT"] + v["NEAR"] + v["WRONG"]      # UNSURE excluded
        s_p, s_lo, s_hi = wilson(v["CORRECT"], scored)
        l_p, l_lo, l_hi = wilson(v["CORRECT"] + v["NEAR"], scored)
        tiers_out[tier] = {
            "population": populations.get(tier, 0),
            "labelled": len(rs), "scored": scored, "unsure": v["UNSURE"],
            "correct": v["CORRECT"], "near": v["NEAR"], "wrong": v["WRONG"],
            "strict_precision": None if s_p is None else round(s_p, 4),
            "strict_ci95": None if s_p is None else [round(s_lo, 4), round(s_hi, 4)],
            "lenient_precision": None if l_p is None else round(l_p, 4),
            "lenient_ci95": None if l_p is None else [round(l_lo, 4), round(l_hi, 4)],
            "is_negative_control": tier == NEGATIVE_CONTROL_TIER,
        }

    # Population-weighted portfolio precision over site-level tiers only.
    num_s = num_l = denom = 0.0
    for tier, t in tiers_out.items():
        if t["is_negative_control"] or t["scored"] == 0:
            continue
        w = t["population"]
        num_s += t["strict_precision"] * w
        num_l += t["lenient_precision"] * w
        denom += w

    control = tiers_out.get(NEGATIVE_CONTROL_TIER)
    control_flag = bool(control and control["scored"] and control["strict_precision"] > 0.20)

    result = {
        "method": "stratified equal-allocation sample, human-labelled, Wilson 95% intervals",
        "sample_size": len(rows), "labelled": len(labelled),
        "portfolio_strict_precision": round(num_s / denom, 4) if denom else None,
        "portfolio_lenient_precision": round(num_l / denom, 4) if denom else None,
        "portfolio_note": "population-weighted across site-level tiers; negative control excluded",
        "median_error_km": round(sorted(errors_km)[len(errors_km) // 2], 2) if errors_km else None,
        "n_with_true_coords": len(errors_km),
        "negative_control_correct_rate": (
            None if not control or not control["scored"] else control["strict_precision"]),
        "negative_control_warning": control_flag,
        "tiers": tiers_out,
    }

    os.makedirs(os.path.dirname(OUT_JSON), exist_ok=True)
    with open(OUT_JSON, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2)

    print("MEASURED GEOCODING PRECISION")
    print("=" * 86)
    print(f"labelled {len(labelled)} / {len(rows)} rows\n")
    hdr = f"{'tier':30s} {'pop':>5s} {'n':>4s} {'strict':>8s} {'95% CI':>15s} {'lenient':>8s}"
    print(hdr); print("-" * 86)
    for tier, t in sorted(tiers_out.items(), key=lambda kv: -kv[1]["population"]):
        if t["scored"] == 0:
            print(f"{tier:30s} {t['population']:5d} {0:4d}   (all UNSURE / unlabelled)")
            continue
        ci = f"[{t['strict_ci95'][0]:.2f},{t['strict_ci95'][1]:.2f}]"
        tag = "  <- negative control" if t["is_negative_control"] else ""
        print(f"{tier:30s} {t['population']:5d} {t['scored']:4d} "
              f"{t['strict_precision']:8.1%} {ci:>15s} {t['lenient_precision']:8.1%}{tag}")
    print("-" * 86)
    if result["portfolio_strict_precision"] is not None:
        print(f"PORTFOLIO (population-weighted, site-level tiers only)")
        print(f"   strict  (imagery shows the project) : {result['portfolio_strict_precision']:.1%}")
        print(f"   lenient (right locality)            : {result['portfolio_lenient_precision']:.1%}")
    if result["median_error_km"] is not None:
        print(f"   median error where true coords given: {result['median_error_km']} km "
              f"(n={result['n_with_true_coords']})")
    if control_flag:
        print("\n   WARNING: the negative control (state centroids, known-bad) was marked")
        print("   CORRECT more than 20% of the time. The labelling looks lenient, so treat")
        print("   the headline precision as an upper bound.")
    print(f"\nWrote {OUT_JSON}")


if __name__ == "__main__":
    main()
