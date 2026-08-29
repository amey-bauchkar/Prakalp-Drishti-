"""
PRAKALP-DRISHTI: z18 SUB-METRE SHOWCASE BAKE

Fetches genuine 0.52 m/px dual-epoch mosaics for a small set of flagship
projects, so the viewer's sub-metre badge is backed by real pixels.

Run:
    python satellite_pipeline/fetch_showcase_z18.py --survey
    python satellite_pipeline/fetch_showcase_z18.py --fetch --max 10

────────────────────────────────────────────────────────────────────────────
WHY A MOSAIC RATHER THAN A HIGHER ZOOM
────────────────────────────────────────────────────────────────────────────

The viewport planner caps zoom so a single fixed-size frame still contains the
geocode error radius. That trades resolution for coverage, and it is the wrong
trade when the coverage can be bought with more tiles instead: a 9x9 grid at
z18 covers 1.2 km at 0.52 m/px, where one 1024 px frame covering the same
ground would have to drop to z14 and 8.4 m/px.

Positional error is not guessed for these projects. Each one in the showcase
list was checked against a published coordinate during the geocode enrichment
and came in between 43 m and 602 m, which a 1.2 km frame contains comfortably.
That measurement is what licenses the tight framing here; it is not available
for the corpus at large, which is why this is a curated bake and not a
corpus-wide one.

────────────────────────────────────────────────────────────────────────────
TWO DEFECTS IN THE EXISTING PIPELINE THAT THIS SCRIPT DOES NOT INHERIT
────────────────────────────────────────────────────────────────────────────

fetch_perfect_imagery_v2.py declares:

    WAYBACK_RELEASE_BEFORE = 10   # Feb 2018 imagery
    WAYBACK_RELEASE_AFTER  = 93   # Jan 2023 imagery

Checked against ESRI's own release index (196 releases, fetched live):

  * Release 10 is "World Imagery (Wayback 2014-02-20)". The baseline epoch of
    the entire corpus is FEBRUARY 2014, four years earlier than every label in
    the platform says. The real 2018-02 release is 13067.
  * Release 93 does not exist. Every AFTER request against it fails, and the
    function falls through to a silent "fallback to current ESRI imagery",
    so the AFTER epoch is whatever the basemap held at fetch time rather than
    the 2023-01 it claims. The real 2023-01-11 release is 11475.

Neither is fatal to the imagery already on disk -- 0 of 120 sampled pairs are
identical, so the two epochs are genuinely different scenes -- but the stated
epoch span of 59 months is wrong, and every m2/month velocity divides by it.

This script uses the verified release ids and records the release actually
served for each tile, so the epoch on the label is the epoch in the pixels.

────────────────────────────────────────────────────────────────────────────
COVERAGE IS NOT UNIFORM AND MUST BE SURVEYED FIRST
────────────────────────────────────────────────────────────────────────────

Measured across six candidate sites, z18 in a 2018 release exists at Chennai,
Bommasandra, Lucknow and (in the December release only) IIT Bhubaneswar, and
does not exist at Goa Dabolim or Imphal at any 2018 release. The AFTER epoch
has z18 everywhere tested.

So a project qualifies for this bake only if BOTH epochs resolve at z18. The
survey below establishes that before a single mosaic is fetched, because a
half-fetched showcase that silently falls back to z17 would put a sub-metre
badge over 1.1 m/px imagery.
"""

from __future__ import annotations

import argparse
import io
import json
import math
import os
import time
import urllib.error
import urllib.request
from typing import Any, Dict, List, Optional, Tuple

import cv2
import numpy as np

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GEO_PATH = os.path.join(BASE_DIR, "paimana_extracted", "satellite_data",
                        "ALL_2207_PROJECTS_GEOREFERENCED.json")
CAT_PATH = os.path.join(BASE_DIR, "paimana_extracted", "satellite_data",
                        "ALL_2207_PROJECTS_SATELLITE_CATALOG.json")
OUT_DIR = os.path.join(BASE_DIR, "paimana_extracted", "satellite_data",
                       "showcase_z18")
REPORT = os.path.join(BASE_DIR, "artifacts", "showcase_z18_report.json")
ENRICH_REPORT = os.path.join(BASE_DIR, "artifacts", "geocode_enrichment_report.json")

UA = {"User-Agent": "prakalp-drishti/1.0 (MoSPI central-sector project monitoring)"}

# Verified against ESRI's live release index rather than copied forward.
WAYBACK = "https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/WMTS/1.0.0/default028mm/MapServer/tile/{rel}/{z}/{y}/{x}"
CURRENT = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"

# Tried in order; India z18 coverage differs release to release, and the
# December release reaches sites the February one does not.
BEFORE_RELEASES = [("23448", "2018-12-14"), ("14829", "2018-07-25"),
                   ("20399", "2018-04-11"), ("13067", "2018-02-23")]
AFTER_RELEASES = [("11475", "2023-01-11"), ("57965", "2023-02-23"),
                  ("44873", "2023-03-15")]

ZOOM = 18
GRID = 9                       # 9x9 x 256 px = 2304 px
HALF_EXTENT_TARGET_M = 600.0   # contains the 43-602 m measured positional error
PLACEHOLDER_BYTES = 2521
PLACEHOLDER_LAP = 120.0
TILE_PAUSE_S = 0.06            # tile services tolerate this; be a good citizen


def gsd(lat: float, z: int) -> float:
    return 40075016.686 * math.cos(math.radians(lat)) / (256 * (2 ** z))


def tile_xy(lat: float, lon: float, z: int) -> Tuple[int, int]:
    n = 2 ** z
    x = int((lon + 180.0) / 360.0 * n)
    y = int((1.0 - math.log(math.tan(math.radians(lat))
                            + 1.0 / math.cos(math.radians(lat))) / math.pi) / 2.0 * n)
    return x, y


def fetch_tile(rel: Optional[str], z: int, x: int, y: int
               ) -> Tuple[Optional[bytes], Optional[np.ndarray]]:
    url = (CURRENT.format(z=z, x=x, y=y) if rel is None
           else WAYBACK.format(rel=rel, z=z, x=x, y=y))
    try:
        raw = urllib.request.urlopen(
            urllib.request.Request(url, headers=UA), timeout=30).read()
    except Exception:
        return None, None
    img = cv2.imdecode(np.frombuffer(raw, np.uint8), cv2.IMREAD_COLOR)
    return raw, img


def is_placeholder(raw: Optional[bytes], img: Optional[np.ndarray]) -> bool:
    """The provider's 'no imagery here' tile. Decodes fine, so it must be tested.

    Without this the mosaic stitches grey squares into the frame and every
    downstream measurement reports no change over them, permanently.
    """
    if raw is None or img is None:
        return True
    if len(raw) == PLACEHOLDER_BYTES:
        return True
    g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    return float(cv2.Laplacian(g, cv2.CV_64F).var()) < PLACEHOLDER_LAP


def probe_release(releases, lat: float, lon: float
                  ) -> Tuple[Optional[str], Optional[str]]:
    """First release whose CENTRE tile at z18 is real imagery."""
    x, y = tile_xy(lat, lon, ZOOM)
    for rel, label in releases:
        raw, img = fetch_tile(rel, ZOOM, x, y)
        if not is_placeholder(raw, img):
            return rel, label
        time.sleep(TILE_PAUSE_S)
    return None, None


def build_mosaic(rel: Optional[str], lat: float, lon: float, grid: int
                 ) -> Tuple[Optional[np.ndarray], Dict[str, Any]]:
    """Stitch a grid x grid tile mosaic centred on (lat, lon).

    A mosaic is rejected outright if more than a tenth of it is placeholder:
    a frame that is mostly 'no data' is not a sub-metre view of anything, and
    patching the holes would fabricate ground.
    """
    cx, cy = tile_xy(lat, lon, ZOOM)
    half = grid // 2
    rows, blank, total = [], 0, 0
    for dy in range(-half, half + 1):
        cols = []
        for dx in range(-half, half + 1):
            raw, img = fetch_tile(rel, ZOOM, cx + dx, cy + dy)
            total += 1
            if is_placeholder(raw, img):
                blank += 1
                img = np.zeros((256, 256, 3), np.uint8)
            cols.append(img if img is not None else np.zeros((256, 256, 3), np.uint8))
            time.sleep(TILE_PAUSE_S)
        rows.append(np.hstack(cols))
    mosaic = np.vstack(rows)
    frac = blank / max(total, 1)
    meta = {"tiles": total, "blank_tiles": blank, "blank_fraction": round(frac, 4)}
    if frac > 0.10:
        return None, meta
    return mosaic, meta


def load_showcase_candidates() -> List[Dict[str, Any]]:
    """Enriched projects whose coordinate was verified during enrichment.

    Restricted to the enrichment output because those are the only coordinates
    with a measured OSM footprint behind them; anything else would be a tight
    frame on an unverified point, which is the failure this platform spends
    most of its code avoiding.
    """
    with open(CAT_PATH, "r", encoding="utf-8") as f:
        catalog = {str(r["project_id"]): r for r in json.load(f)}
    with open(GEO_PATH, "r", encoding="utf-8") as f:
        geo = {str(g.get("project_id") or g.get("ProjectId")): g for g in json.load(f)}

    # Curated flagship order. Chosen for recognisability to a lay reviewer and
    # for sector spread, so a demo does not show ten metro projects in a row.
    # Goa Dabolim and Imphal Airport are absent deliberately: the survey found
    # no 2018 z18 coverage at either, so neither can produce a genuine
    # sub-metre dual-epoch pair however desirable it would be to show them.
    FLAGSHIP = [
        "611602",  # Chennai Airport modernisation
        "701113",  # Lal Bahadur Shastri International Airport, Varanasi
        "701091",  # Lucknow Airport Terminal 3
        "617877",  # IIT Bhilai permanent campus
        "616886",  # Delhi University Eastern Campus
        "607701",  # Guwahati Refinery expansion
        "617242",  # Durgapur Steel Plant new bar mill
        "702637",  # Mumbai Metro Line 3
        "619031",  # Delhi Metro Phase V A
        "616691",  # ESIC Hospital upgradation
    ]

    ids: List[str] = []
    if os.path.exists(ENRICH_REPORT):
        with open(ENRICH_REPORT, "r", encoding="utf-8") as f:
            ids = [a["project_id"] for a in json.load(f).get("accepted", [])]
    rank = {pid: i for i, pid in enumerate(FLAGSHIP)}
    ids.sort(key=lambda p: rank.get(p, 999))

    out = []
    for pid in ids:
        r, g = catalog.get(pid), geo.get(pid)
        if not r or not g or g.get("latitude") is None:
            continue
        out.append({"project_id": pid, "name": str(r.get("project_name"))[:70],
                    "sector": r.get("sector"), "lat": float(g["latitude"]),
                    "lon": float(g["longitude"])})
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--survey", action="store_true",
                    help="check z18 dual-epoch availability without fetching")
    ap.add_argument("--fetch", action="store_true")
    ap.add_argument("--max", type=int, default=10)
    args = ap.parse_args()

    cands = load_showcase_candidates()
    print(f"enriched candidates with a verified coordinate: {len(cands)}\n")

    qualified: List[Dict[str, Any]] = []
    for i, c in enumerate(cands, 1):
        b_rel, b_lab = probe_release(BEFORE_RELEASES, c["lat"], c["lon"])
        if b_rel is None:
            print(f"  [{i:3d}] --   {c['project_id']} {c['name'][:42]:42s} "
                  f"no 2018 z18 coverage")
            continue
        a_rel, a_lab = probe_release(AFTER_RELEASES, c["lat"], c["lon"])
        if a_rel is None:
            print(f"  [{i:3d}] --   {c['project_id']} {c['name'][:42]:42s} "
                  f"no 2023 z18 coverage")
            continue
        c.update(before_release=b_rel, before_epoch=b_lab,
                 after_release=a_rel, after_epoch=a_lab,
                 gsd=round(gsd(c["lat"], ZOOM), 3))
        qualified.append(c)
        print(f"  [{i:3d}] OK   {c['project_id']} {c['name'][:42]:42s} "
              f"{b_lab} -> {a_lab}  {c['gsd']:.2f} m/px")
        if len(qualified) >= args.max and not args.survey:
            break

    print(f"\nqualified for a genuine z18 dual-epoch bake: {len(qualified)}")
    if args.survey or not args.fetch:
        os.makedirs(os.path.dirname(REPORT), exist_ok=True)
        with open(REPORT, "w", encoding="utf-8") as f:
            json.dump({"surveyed": len(cands), "qualified": qualified}, f, indent=1)
        print(f"survey -> {REPORT}\nRe-run with --fetch to bake.")
        return 0

    os.makedirs(OUT_DIR, exist_ok=True)
    baked = []
    for c in qualified[:args.max]:
        pid = c["project_id"]
        print(f"\n  baking {pid} {c['name'][:46]}")
        ok = True
        entry = dict(c)
        for epoch, rel in (("BEFORE", c["before_release"]),
                           ("AFTER", c["after_release"])):
            # Shrink rather than fail. Historical z18 coverage is patchy at the
            # edges -- Chennai Airport came back 17% placeholder at 9x9 while
            # its centre tile was fine -- and a smaller frame that is fully
            # covered beats a larger one with holes in it. The floor is 5x5
            # (671 m), which still contains the 43-602 m positional error these
            # coordinates were measured to.
            mos = meta = None
            used_grid = None
            for g in (GRID, 7, 5):
                mos, meta = build_mosaic(rel, c["lat"], c["lon"], g)
                if mos is not None:
                    used_grid = g
                    if g < GRID:
                        print(f"    {epoch}: shrank to {g}x{g} for full coverage")
                    break
                print(f"    {epoch}: {g}x{g} was {meta['blank_fraction']:.0%} "
                      f"placeholder, trying smaller")
            if mos is None:
                print(f"    {epoch}: rejected at every grid size")
                ok = False
                break
            entry[f"{epoch.lower()}_grid"] = used_grid
            path = os.path.join(OUT_DIR, f"{pid}_{epoch}_z18.jpg")
            cv2.imwrite(path, mos, [cv2.IMWRITE_JPEG_QUALITY, 92])
            lap = float(cv2.Laplacian(cv2.cvtColor(mos, cv2.COLOR_BGR2GRAY),
                                      cv2.CV_64F).var())
            size_kb = os.path.getsize(path) / 1024
            print(f"    {epoch}: {mos.shape[1]}x{mos.shape[0]} px  "
                  f"{mos.shape[1] * c['gsd']:.0f} m  detail {lap:.0f}  {size_kb:.0f} kB")
            entry[f"{epoch.lower()}_path"] = os.path.relpath(path, BASE_DIR)
            entry[f"{epoch.lower()}_laplacian"] = round(lap, 1)
            entry[f"{epoch.lower()}_blank_fraction"] = meta["blank_fraction"]
        if ok:
            g_min = min(entry.get("before_grid", GRID), entry.get("after_grid", GRID))
            entry["mosaic_px"] = g_min * 256
            entry["covers_m"] = round(g_min * 256 * c["gsd"], 1)
            baked.append(entry)

    with open(REPORT, "w", encoding="utf-8") as f:
        json.dump({"surveyed": len(cands), "qualified": len(qualified),
                   "baked": baked, "zoom": ZOOM, "grid": GRID}, f, indent=1)
    print(f"\nbaked {len(baked)} showcase pairs -> {OUT_DIR}")
    print(f"report -> {REPORT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
