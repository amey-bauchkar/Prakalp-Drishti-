"""
PRAKALP-DRISHTI: STALE IMAGERY INVALIDATOR

Run AFTER regeocode_from_project_names.py, BEFORE re-fetching imagery.

Why this is necessary
---------------------
Satellite tiles are fetched by lat/lon. When re-geocoding moves a project -- often by
hundreds of kilometres, e.g. the Sikkim University project moved ~1,100 km out of
Maharashtra and back to Sikkim -- its cached BEFORE/AFTER pair still shows the OLD
location. Those files are now actively misleading: the change-detection engine would
happily measure "construction progress" on a patch of ground the project has nothing
to do with.

fetch_perfect_imagery_v2.py short-circuits on `has_before and has_after`, so it will
NOT re-download a project whose images already exist. Deleting the stale pairs is what
forces a refetch at the corrected coordinates.

The raw z/x/y tile cache is deliberately left intact: it is keyed by tile coordinate,
not by project, so it stays valid and speeds up the refetch wherever the new location
happens to reuse tiles already on disk.
"""

from __future__ import annotations

import argparse
import io
import json
import math
import os
import sys

if sys.stdout and hasattr(sys.stdout, "buffer"):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SAT_DIR = os.path.join(BASE_DIR, "paimana_extracted", "satellite_data")
GEO_PATH = os.path.join(SAT_DIR, "ALL_2207_PROJECTS_GEOREFERENCED.json")
BACKUP_PATH = os.path.join(SAT_DIR, "ALL_2207_PROJECTS_GEOREFERENCED.backup_precentroid.json")
IMAGERY_DIR = os.path.join(SAT_DIR, "project_imagery")

# A tile at zoom 16-17 spans roughly 300-600 m. Anything beyond ~250 m guarantees the
# old crop no longer contains the new point, so the imagery must be refetched.
MOVE_THRESHOLD_M = 250.0


def haversine_m(lat1, lon1, lat2, lon2) -> float:
    r = 6371000.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true", help="actually delete; default is a dry run")
    args = ap.parse_args()

    with open(GEO_PATH, "r", encoding="utf-8") as f:
        new = {str(g["ProjectId"]): g for g in json.load(f)}
    with open(BACKUP_PATH, "r", encoding="utf-8") as f:
        old = {str(g["ProjectId"]): g for g in json.load(f)}

    moved, distances = [], []
    for pid, g in new.items():
        o = old.get(pid)
        if not o:
            continue
        d = haversine_m(float(o["latitude"]), float(o["longitude"]),
                        float(g["latitude"]), float(g["longitude"]))
        if d > MOVE_THRESHOLD_M:
            moved.append(pid)
            distances.append(d)

    print(f"Projects re-geocoded beyond {MOVE_THRESHOLD_M:.0f} m: {len(moved)} / {len(new)}")
    if distances:
        distances.sort()
        print(f"  median move {distances[len(distances)//2]/1000:.1f} km   "
              f"max {distances[-1]/1000:.0f} km")

    present = [p for p in moved
               if os.path.exists(os.path.join(IMAGERY_DIR, f"{p}_BEFORE.jpg"))
               or os.path.exists(os.path.join(IMAGERY_DIR, f"{p}_AFTER.jpg"))]
    print(f"Stale image pairs on disk: {len(present)}")

    if not args.apply:
        print("\nDRY RUN -- nothing deleted. Re-run with --apply to invalidate.")
        return

    removed = 0
    for pid in present:
        for suffix in ("BEFORE", "AFTER"):
            p = os.path.join(IMAGERY_DIR, f"{pid}_{suffix}.jpg")
            if os.path.exists(p):
                os.remove(p)
                removed += 1
    print(f"\nDeleted {removed} stale image files for {len(present)} projects.")
    print("Next: python satellite_pipeline/fetch_perfect_imagery_v2.py")


if __name__ == "__main__":
    main()
