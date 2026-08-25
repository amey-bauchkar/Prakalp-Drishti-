"""
PRAKALP-DRISHTI: GEOCODE VALIDATION SAMPLE BUILDER

Draws a stratified, reproducible sample for HUMAN labelling, so the system can publish
a measured geocoding precision per tier instead of an unmeasured claim.

Why this exists
---------------
The pipeline moves projects by a median of 368 km and a maximum of 2,112 km on the
strength of string matches against OSM and GeoNames, and then uses the resulting
coordinate to decide whether a project's satellite imagery is trustworthy enough to
issue an Earth-observation finding. Until now the precision of that decision was
completely unmeasured. "We reject the known failure modes" is an argument; it is not
a number, and an auditor is entitled to the number.

Sampling design
---------------
EQUAL allocation across the site-level tiers, not proportional. Proportional sampling
would spend most of the budget on the largest tier and leave the smaller ones with
intervals too wide to be worth publishing. Equal allocation maximises the precision of
each PER-TIER estimate, which is the quantity being reported. Portfolio-level precision
is then recovered by re-weighting the tier estimates by their true populations -- see
score_geocode_validation.py.

Two tiers (GEONAMES_EXACT_MATCH n=6, GEONAMES_EXACT_UNCONSTRAINED n=2) are small enough
to CENSUS outright, so they are labelled in full and carry no sampling error at all.

A small NEGATIVE CONTROL block of STATE_CENTROID_MATCH projects is included and shuffled
in among the rest. Those are known-bad by construction -- a state centroid is not a
project site -- so if they come back labelled CORRECT at any material rate, the labelling
itself is optimistic and the headline precision needs discounting. It is a check on the
measurement instrument, not on the geocoder.

Output is a CSV worksheet. Re-running preserves any labels already entered.
"""

from __future__ import annotations

import csv
import json
import os
import sys
from collections import defaultdict

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GEO_PATH = os.path.join(BASE_DIR, "paimana_extracted", "satellite_data",
                        "ALL_2207_PROJECTS_GEOREFERENCED.json")
CATALOG_PATH = os.path.join(BASE_DIR, "paimana_extracted", "satellite_data",
                            "ALL_2207_PROJECTS_SATELLITE_CATALOG.json")
OUT_CSV = os.path.join(BASE_DIR, "artifacts", "geocode_validation_worksheet.csv")

RANDOM_SEED = 20260825

# Tiers that unlock an EO verdict -- the ones whose precision actually matters.
SITE_LEVEL_TIERS = [
    "OSM_LANDMARK_MATCH",
    "GAZETTEER_CITY_MATCH",
    "OSM_CORRIDOR_MIDPOINT",
    "GEONAMES_TOKEN_MATCH",
]
CENSUS_TIERS = ["GEONAMES_EXACT_MATCH", "GEONAMES_EXACT_UNCONSTRAINED"]
NEGATIVE_CONTROL_TIER = "STATE_CENTROID_MATCH"

PER_TIER_TARGET = 45          # 45 x 4 = 180; ~+/-11pp at p=0.8
NEGATIVE_CONTROL_N = 12       # instrument check, not a tier estimate

FIELDNAMES = [
    "row", "project_id", "geocode_precision", "asset_geometry",
    "project_name", "sector", "state",
    "lat", "lon", "geocode_source", "inspect_url",
    # --- columns for the human labeller ---
    "verdict", "true_lat", "true_lon", "notes",
]

VERDICT_HELP = """
HOW TO LABEL  (fill only the 'verdict' column; the rest are optional)

Open inspect_url. Compare what you see against project_name.
Enter one of:

  CORRECT  the works are at/inside this view -- imagery here would show this project
  NEAR     right town or corridor, but the specific site is elsewhere (roughly < 5 km)
  WRONG    a different place entirely
  UNSURE   cannot tell from imagery alone -- leave it, do not guess

For LINEAR assets (asset_geometry = LINEAR) the point is a sample of a corridor, so
CORRECT means "this point lies on the alignment", not "this is the whole project".

If you know the real location, put it in true_lat/true_lon -- optional, but it lets us
report a median error distance in kilometres alongside the pass rate.

Label every row, including ones that look obviously right. Skipping the easy ones
biases the result. UNSURE is a legitimate answer and is excluded from the denominator.
"""


def main() -> None:
    if sys.stdout and hasattr(sys.stdout, "buffer"):
        import io
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

    import random
    rng = random.Random(RANDOM_SEED)

    with open(GEO_PATH, "r", encoding="utf-8") as f:
        geo = json.load(f)

    geom = {}
    if os.path.exists(CATALOG_PATH):
        with open(CATALOG_PATH, "r", encoding="utf-8") as f:
            for c in json.load(f):
                geom[str(c.get("project_id"))] = c.get("asset_geometry", "POINT")

    by_tier = defaultdict(list)
    for g in geo:
        by_tier[str(g.get("geocode_precision"))].append(g)

    picked = []
    plan = []
    for tier in SITE_LEVEL_TIERS:
        pool = sorted(by_tier.get(tier, []), key=lambda g: str(g["ProjectId"]))
        take = min(PER_TIER_TARGET, len(pool))
        chosen = rng.sample(pool, take) if take < len(pool) else list(pool)
        picked += [(tier, g) for g in chosen]
        plan.append((tier, len(pool), take, "sampled"))

    for tier in CENSUS_TIERS:
        pool = sorted(by_tier.get(tier, []), key=lambda g: str(g["ProjectId"]))
        picked += [(tier, g) for g in pool]
        plan.append((tier, len(pool), len(pool), "CENSUS (no sampling error)"))

    ctrl_pool = sorted(by_tier.get(NEGATIVE_CONTROL_TIER, []), key=lambda g: str(g["ProjectId"]))
    take = min(NEGATIVE_CONTROL_N, len(ctrl_pool))
    picked += [(NEGATIVE_CONTROL_TIER, g) for g in rng.sample(ctrl_pool, take)]
    plan.append((NEGATIVE_CONTROL_TIER, len(ctrl_pool), take, "negative control"))

    # Shuffle so the labeller cannot infer the tier from position and unconsciously
    # grade the known-bad control block more harshly.
    rng.shuffle(picked)

    # Preserve any labels already entered on a previous run.
    existing = {}
    if os.path.exists(OUT_CSV):
        with open(OUT_CSV, "r", encoding="utf-8-sig", newline="") as f:
            for r in csv.DictReader(f):
                if r.get("project_id"):
                    existing[r["project_id"]] = {
                        k: r.get(k, "") for k in ("verdict", "true_lat", "true_lon", "notes")}

    rows = []
    for i, (tier, g) in enumerate(picked, 1):
        pid = str(g["ProjectId"])
        lat, lon = float(g["latitude"]), float(g["longitude"])
        prev = existing.get(pid, {})
        rows.append({
            "row": i,
            "project_id": pid,
            "geocode_precision": tier,
            "asset_geometry": geom.get(pid, "POINT"),
            "project_name": str(g.get("ProjectName", ""))[:160],
            "sector": str(g.get("SectorName", "")),
            "state": str(g.get("StateName", "")),
            "lat": round(lat, 6),
            "lon": round(lon, 6),
            "geocode_source": str(g.get("geocode_source", "")),
            # Satellite view at the exact coordinate; what the CV pipeline actually sees.
            "inspect_url": f"https://www.google.com/maps/@{lat:.6f},{lon:.6f},16z/data=!3m1!1e3",
            "verdict": prev.get("verdict", ""),
            "true_lat": prev.get("true_lat", ""),
            "true_lon": prev.get("true_lon", ""),
            "notes": prev.get("notes", ""),
        })

    os.makedirs(os.path.dirname(OUT_CSV), exist_ok=True)
    # utf-8-sig so Excel opens the Devanagari/long project names correctly.
    with open(OUT_CSV, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=FIELDNAMES)
        w.writeheader()
        w.writerows(rows)

    print("GEOCODE VALIDATION SAMPLE")
    print("=" * 72)
    for tier, pop, take, how in plan:
        print(f"  {tier:30s} pop {pop:5d}  ->  label {take:3d}   {how}")
    print(f"\n  TOTAL ROWS TO LABEL: {len(rows)}   (seed {RANDOM_SEED}, reproducible)")
    already = sum(1 for r in rows if r["verdict"].strip())
    if already:
        print(f"  already labelled   : {already} (preserved from previous run)")
    print(f"\nWorksheet: {OUT_CSV}")
    print(VERDICT_HELP)
    print("When finished:  python satellite_pipeline/score_geocode_validation.py")


if __name__ == "__main__":
    main()
