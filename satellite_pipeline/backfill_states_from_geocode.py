"""
PRAKALP-DRISHTI: STATE BACKFILL FROM GEOCODE (offline)

Why this exists
---------------
1,026 of 2,207 projects (46.5%) carry no StateName in the PAIMANA extract. The gap is
not random -- whole sectors are missing it entirely (Coal, Aviation, Education,
Healthcare, Electricity Generation, Energy Storage, Inland Waterways and Construction
are each 100% blank), which is the signature of an upstream extraction gap rather than
genuinely multi-state projects.

Two things went wrong downstream because of it:

  * The API serialised the absent value with str(), so the console displayed the
    literal text "nan" as a project's state.
  * VITTA-VYUHA enforces the statutory 10% North-Eastern Region floor by testing
    StateName against the NER list. A project in Assam whose state was never captured
    is invisible to that constraint, so the floor was being satisfied over a partial
    universe without saying so.

What this does
--------------
Every project already carries a geocode. Where that geocode is a real place fix, the
nearest GeoNames populated place gives an admin1 code, and admin1 maps to a state. So
the state is recoverable offline, from data already vendored in the repository.

What it deliberately does NOT do
--------------------------------
NATIONAL_CENTROID_MATCH projects are excluded. That precision tier means "we could not
locate this project and fell back to the centroid of India" -- reverse-geocoding it
would return Madhya Pradesh for every one of them, manufacturing a confident-looking
answer out of an admission of ignorance. Those projects stay unknown.

The result is written to a separate artifact and tagged with a provenance field. An
inferred state is never presented as a PAIMANA-reported state; the master CSV is not
modified.
"""

import json
import math
import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GEO_PATH = os.path.join(BASE_DIR, "paimana_extracted", "satellite_data",
                        "ALL_2207_PROJECTS_GEOREFERENCED.json")
GEONAMES_PATH = os.path.join(BASE_DIR, "paimana_extracted", "geonames_IN.txt")
ADMIN1_PATH = os.path.join(BASE_DIR, "paimana_extracted", "geonames_admin1_IN.txt")
OUT_PATH = os.path.join(BASE_DIR, "artifacts", "state_backfill.json")

# Fallback tiers that carry no locational information about the project itself.
UNUSABLE_PRECISION = {"NATIONAL_CENTROID_MATCH"}

# A populated place further than this from the project centroid is not evidence of
# which state the project is in. 150 km is generous for India's state geometry but
# still refuses to answer in the middle of the ocean or a large desert.
MAX_MATCH_KM = 150.0

# GeoNames feature classes that indicate a populated place or an administrative
# division -- the two classes whose admin1 code reliably reflects civil geography.
USEFUL_CLASSES = {"P", "A"}


def _haversine_km(lat1, lon1, lat2, lon2):
    r = 6371.0088
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = p2 - p1
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def load_admin1(path):
    out = {}
    if not os.path.exists(path):
        return out
    with open(path, encoding="utf-8") as fh:
        for line in fh:
            f = line.rstrip("\n").split("\t")
            if len(f) >= 2:
                out[f[0].split(".")[-1]] = f[1]
    return out


def load_places(path, admin1):
    """Load populated places into a coarse 1-degree spatial grid.

    The dump is ~70 MB / 660k rows. A flat scan per project would be 666 * 660k
    distance computations; the grid makes each lookup touch only the 9 cells around
    the query point.
    """
    grid = {}
    kept = 0
    with open(path, encoding="utf-8") as fh:
        for line in fh:
            f = line.rstrip("\n").split("\t")
            if len(f) < 15:
                continue
            if f[6] not in USEFUL_CLASSES:
                continue
            state = admin1.get(f[10], "")
            if not state:
                continue
            try:
                lat, lon = float(f[4]), float(f[5])
            except ValueError:
                continue
            # Population is used only to break ties toward a real settlement.
            try:
                pop = int(f[14] or 0)
            except ValueError:
                pop = 0
            grid.setdefault((int(math.floor(lat)), int(math.floor(lon))), []).append(
                (lat, lon, state, pop))
            kept += 1
    return grid, kept


def nearest_state(grid, lat, lon):
    best = None
    gy, gx = int(math.floor(lat)), int(math.floor(lon))
    for dy in (-1, 0, 1):
        for dx in (-1, 0, 1):
            for (plat, plon, state, pop) in grid.get((gy + dy, gx + dx), ()):
                d = _haversine_km(lat, lon, plat, plon)
                if d > MAX_MATCH_KM:
                    continue
                # Nearest wins; population breaks near-ties so a district town is
                # preferred over an unnamed hamlet 200 m closer.
                score = (round(d, 2), -pop)
                if best is None or score < best[0]:
                    best = (score, state, d)
    if best is None:
        return None, None
    return best[1], round(best[2], 2)


def main():
    if not os.path.exists(GEONAMES_PATH):
        print(f"Missing {GEONAMES_PATH}", file=sys.stderr)
        return 1

    admin1 = load_admin1(ADMIN1_PATH)
    print(f"Loaded {len(admin1)} admin1 (state) codes")

    grid, kept = load_places(GEONAMES_PATH, admin1)
    print(f"Indexed {kept:,} GeoNames places into {len(grid):,} grid cells")

    rows = json.load(open(GEO_PATH, encoding="utf-8"))
    if isinstance(rows, dict):
        rows = rows.get("projects", list(rows.values()))

    out = {}
    stats = {"already_known": 0, "recovered": 0,
             "skipped_unusable_precision": 0, "no_place_within_range": 0,
             "no_coordinates": 0}

    for r in rows:
        pid = str(r.get("ProjectId"))
        state = str(r.get("StateName") or "").strip()
        if state and state.lower() not in ("nan", "none"):
            stats["already_known"] += 1
            continue
        if r.get("geocode_precision") in UNUSABLE_PRECISION:
            stats["skipped_unusable_precision"] += 1
            continue
        lat, lon = r.get("latitude"), r.get("longitude")
        if not lat or not lon:
            stats["no_coordinates"] += 1
            continue
        st, dist = nearest_state(grid, float(lat), float(lon))
        if not st:
            stats["no_place_within_range"] += 1
            continue
        out[pid] = {
            "state": st,
            "state_source": "INFERRED_FROM_GEOCODE",
            "geocode_precision": r.get("geocode_precision"),
            "nearest_place_km": dist,
        }
        stats["recovered"] += 1

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    payload = {
        "generated_by": "satellite_pipeline/backfill_states_from_geocode.py",
        "method": ("nearest GeoNames populated place (feature class P/A) to the "
                   "project's existing geocode, within %d km; admin1 -> state"
                   % MAX_MATCH_KM),
        "provenance_warning": (
            "These states are INFERRED from coordinates, not reported by PAIMANA. "
            "They must be labelled as inferred wherever they are shown, and they are "
            "excluded from the statutory NER floor, which is computed only on states "
            "the ministry itself reported."),
        "excluded_precision_tiers": sorted(UNUSABLE_PRECISION),
        "max_match_km": MAX_MATCH_KM,
        "stats": stats,
        "states": out,
    }
    with open(OUT_PATH, "w", encoding="utf-8") as fh:
        json.dump(payload, fh, indent=2)

    print(f"\n{json.dumps(stats, indent=2)}")
    print(f"\nWrote {OUT_PATH}  ({len(out)} states recovered)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
