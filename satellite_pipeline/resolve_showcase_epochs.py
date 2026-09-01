"""
PRAKALP-DRISHTI: MULTI-EPOCH WAYBACK RESOLVER

Finds the genuinely DISTINCT, DATED satellite observations that exist for a project, and
aligns them to that project's statutory milestone dates.

WHY THIS EXISTS
---------------
The corpus ships one image pair per project: a 2014-02 Wayback baseline and the ESRI
live mosaic fetched 2026-08-25. The after-epoch's vintage is therefore a FETCH BOUND
("<=2026-08"), not a capture date -- ESRI publishes no per-tile capture date for the
live mosaic, so the system honestly declines to name one.

Wayback is different: every release has a PUBLISHED date. If a tile's bytes change
between release N-1 and release N, then the imagery for that location was refreshed in
that window, and release N's date is a citable observation date rather than a ceiling.

That converts "<=2026-08 (fetch-bounded)" into "2024-03-07 (Wayback release 60013)",
makes the interval between epochs exact, and turns velocity figures from lower bounds
into point estimates.

TWO-PASS DESIGN, BECAUSE THE NAIVE ONE IS WASTEFUL
--------------------------------------------------
There are 196 releases. Fetching a full tile grid for each, for each project, would be
tens of thousands of requests to a public service for information a single tile answers.

    PASS 1 (discovery)  one 256px centre tile per release, hashed. Cheap. This is only
                        ever asked "did the imagery change here?", which one tile answers.
    PASS 2 (capture)    the full grid, at demo zoom, for the SELECTED epochs only.

Everything is cached on disk, so a re-run costs nothing and an interrupted run resumes.

RELEASE IDS ARE NOT CHRONOLOGICAL
---------------------------------
Release 64776 is 2023-08-31; release 64001 is 2026-02-26. Ordering by id would build a
timeline that runs backwards in places. Every ordering here is by the DATE parsed from
the release title.

WHAT THIS DOES NOT PRODUCE
--------------------------
No completion percentage, and no claimed-minus-observed score. `surface_change_pct` is
the fraction of sampled ground that structurally changed between two dated images.
Surface change and reported progress correlate at r = 0.007 in this corpus, so a
satellite-derived progress figure would be a guess formatted as a measurement.
"""

from __future__ import annotations

import hashlib
import json
import math
import os
import re
import sys
import time
import urllib.error
import urllib.request
from datetime import date, datetime
from typing import Any, Dict, List, Optional, Tuple

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)

import numpy as np                                                    # noqa: E402

SAT_DIR = os.path.join(BASE_DIR, "paimana_extracted", "satellite_data")
IMAGERY_DIR = os.path.join(SAT_DIR, "project_imagery")
CACHE_DIR = os.path.join(SAT_DIR, "wayback_cache")
OUT_PATH = os.path.join(SAT_DIR, "SHOWCASE_EPOCHS.json")
GEO_PATH = os.path.join(SAT_DIR, "ALL_2207_PROJECTS_GEOREFERENCED.json")

WAYBACK_CONFIG = ("https://s3-us-west-2.amazonaws.com/config.maptiles.arcgis.com/"
                  "waybackconfig.json")
WAYBACK_TILE = ("https://wayback.maptiles.arcgis.com/arcgis/rest/services/"
                "World_Imagery/WMTS/1.0.0/default028mm/MapServer/tile/"
                "{release}/{z}/{y}/{x}")

UA = {"User-Agent": "prakalp-drishti/1.0 (SIH MoSPI infrastructure monitoring; "
                    "research use)"}

DISCOVERY_ZOOM = 16          # one tile; enough to see whether a site was refreshed
CAPTURE_ZOOM = 17            # demo tiles
CAPTURE_GRID = 2             # 2x2 tiles around centre => 512px
REQUEST_DELAY_S = 0.12       # politeness; this is a free public service
TIMEOUT_S = 25
MAX_RETRIES = 2

# A release whose tile is byte-identical to its predecessor carries no new observation.
# A release whose tile differs only trivially (JPEG requantisation) is also not a new
# observation, so distinctness is judged on a perceptual hash rather than raw bytes.
#
# Threshold 8, not 6. Measured against the live service, two releases serving the SAME
# imagery hash to distance 0, so real margin is ample. But a re-encode of an unstructured
# frame reached distance 6 in testing, which left the old threshold with no headroom at
# all -- and an over-tight threshold splits one observation into two epochs showing the
# same picture, which is worse than merging two that differ slightly.
PHASH_DISTANCE_MIN = 8

SHOWCASE = ["702625", "618412", "705237", "703585", "619052"]


# ---------------------------------------------------------------------------------
# Wayback release index
# ---------------------------------------------------------------------------------

_TITLE_DATE = re.compile(r"(\d{4}-\d{2}-\d{2})")


def fetch_release_index() -> List[Dict[str, Any]]:
    """[{release, captured, title}] sorted by CAPTURE DATE, not by id."""
    req = urllib.request.Request(WAYBACK_CONFIG, headers=UA)
    with urllib.request.urlopen(req, timeout=TIMEOUT_S) as r:
        cfg = json.load(r)

    out = []
    for rid, meta in cfg.items():
        title = str(meta.get("itemTitle", ""))
        m = _TITLE_DATE.search(title)
        if not m:
            continue
        try:
            captured = datetime.strptime(m.group(1), "%Y-%m-%d").date()
        except ValueError:
            continue
        out.append({"release": int(rid), "captured": captured, "title": title})

    # Sort by date. Release ids are NOT chronological (64776 = 2023-08-31 while
    # 64001 = 2026-02-26), so sorting by id would produce a timeline that runs backwards.
    out.sort(key=lambda r: r["captured"])
    return out


# ---------------------------------------------------------------------------------
# Tiles
# ---------------------------------------------------------------------------------

def deg2tile(lat: float, lon: float, zoom: int) -> Tuple[int, int]:
    lat_r = math.radians(lat)
    n = 2.0 ** zoom
    x = int((lon + 180.0) / 360.0 * n)
    y = int((1.0 - math.asinh(math.tan(lat_r)) / math.pi) / 2.0 * n)
    return x, y


def _cache_path(release: int, z: int, x: int, y: int) -> str:
    return os.path.join(CACHE_DIR, f"r{release}_z{z}_{x}_{y}.jpg")


def fetch_tile(release: int, z: int, x: int, y: int) -> Optional[bytes]:
    """One tile, cached. Returns None when the release has no tile for this location."""
    os.makedirs(CACHE_DIR, exist_ok=True)
    path = _cache_path(release, z, x, y)
    if os.path.exists(path):
        with open(path, "rb") as f:
            data = f.read()
        return data or None

    url = WAYBACK_TILE.format(release=release, z=z, y=y, x=x)
    for attempt in range(MAX_RETRIES + 1):
        try:
            req = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(req, timeout=TIMEOUT_S) as r:
                data = r.read()
            time.sleep(REQUEST_DELAY_S)
            if not data or len(data) < 512:
                # Too small to be imagery -- a placeholder or an empty response.
                open(path, "wb").close()
                return None
            with open(path, "wb") as f:
                f.write(data)
            return data
        except urllib.error.HTTPError as e:
            if e.code in (404, 400):
                open(path, "wb").close()     # negative-cache: this release has no tile
                return None
            time.sleep(0.6 * (attempt + 1))
        except Exception:
            time.sleep(0.6 * (attempt + 1))
    return None


def _decode(data: bytes) -> Optional[np.ndarray]:
    import cv2
    arr = np.frombuffer(data, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    return img


def phash(data: bytes) -> Optional[int]:
    """
    64-bit perceptual hash (DCT-based).

    Byte equality is too strict: ESRI re-encodes tiles, so two renders of the SAME
    imagery differ in bytes while being the same observation. A perceptual hash treats
    those as identical and still separates a genuinely reflown site.
    """
    import cv2
    img = _decode(data)
    if img is None:
        return None
    g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    g = cv2.resize(g, (32, 32), interpolation=cv2.INTER_AREA).astype(np.float32)
    d = cv2.dct(g)[:8, :8]
    med = np.median(d[1:].flatten())          # skip DC, which only tracks brightness
    bits = (d.flatten() > med).astype(np.uint8)
    out = 0
    for b in bits:
        out = (out << 1) | int(b)
    return out


def hamming(a: int, b: int) -> int:
    return bin(a ^ b).count("1")


# ---------------------------------------------------------------------------------
# Pass 1 — discovery
# ---------------------------------------------------------------------------------

def discover_distinct_epochs(lat: float, lon: float,
                             releases: List[Dict[str, Any]],
                             progress: bool = True) -> List[Dict[str, Any]]:
    """
    Releases whose imagery for THIS location genuinely differs from the previous one.

    One centre tile per release. A release that returns no tile, or whose tile is
    perceptually identical to the last kept one, contributes no new observation and is
    dropped -- it would otherwise appear on the timeline as a distinct epoch showing the
    same picture.
    """
    x, y = deg2tile(lat, lon, DISCOVERY_ZOOM)
    kept: List[Dict[str, Any]] = []
    last_hash: Optional[int] = None
    checked = 0

    for rel in releases:
        data = fetch_tile(rel["release"], DISCOVERY_ZOOM, x, y)
        checked += 1
        if progress and checked % 25 == 0:
            print(f"      … {checked}/{len(releases)} releases probed, "
                  f"{len(kept)} distinct so far", flush=True)
        if not data:
            continue
        h = phash(data)
        if h is None:
            continue
        if last_hash is None or hamming(h, last_hash) >= PHASH_DISTANCE_MIN:
            kept.append({**rel, "phash": h, "tile_xy": [x, y]})
            last_hash = h

    return kept


# ---------------------------------------------------------------------------------
# Milestone alignment
# ---------------------------------------------------------------------------------

def select_for_milestones(distinct: List[Dict[str, Any]],
                          milestone_dates: List[date],
                          max_epochs: int = 6) -> List[Dict[str, Any]]:
    """
    Pick the epochs that best corroborate this project's milestone history.

    The baseline and the newest observation are always kept -- they bound the record.
    Between them, the epoch nearest each milestone date is preferred, because an image
    is only useful as corroboration if it sits near the report it is being read against.

    Selection cannot invent an epoch: if a milestone has no nearby distinct imagery, it
    simply goes uncorroborated and temporal_audit reports NO_IMAGERY_FOR_INTERVAL.
    """
    if not distinct:
        return []
    if len(distinct) <= max_epochs:
        return distinct

    chosen = {0, len(distinct) - 1}
    for md in sorted(milestone_dates):
        best_i, best_gap = None, None
        for i, e in enumerate(distinct):
            gap = abs((e["captured"] - md).days)
            if best_gap is None or gap < best_gap:
                best_i, best_gap = i, gap
        if best_i is not None:
            chosen.add(best_i)
        if len(chosen) >= max_epochs:
            break

    # Still short of the budget: spread the remainder evenly so the timeline does not
    # bunch all its detail at one end.
    if len(chosen) < max_epochs:
        step = max(1, len(distinct) // (max_epochs - len(chosen) + 1))
        for i in range(0, len(distinct), step):
            chosen.add(i)
            if len(chosen) >= max_epochs:
                break

    return [distinct[i] for i in sorted(chosen)[:max_epochs]]


# ---------------------------------------------------------------------------------
# Pass 2 — capture and measure
# ---------------------------------------------------------------------------------

def capture_epoch_image(lat: float, lon: float, release: int) -> Optional[np.ndarray]:
    """The demo-zoom tile grid for one release, stitched."""
    import cv2
    cx, cy = deg2tile(lat, lon, CAPTURE_ZOOM)
    half = CAPTURE_GRID // 2
    rows = []
    for dy in range(-half, half):
        row = []
        for dx in range(-half, half):
            data = fetch_tile(release, CAPTURE_ZOOM, cx + dx, cy + dy)
            if not data:
                return None
            img = _decode(data)
            if img is None:
                return None
            row.append(img)
        rows.append(np.hstack(row))
    return np.vstack(rows)


def surface_change_between(before: np.ndarray, after: np.ndarray) -> Optional[float]:
    """
    Fraction of sampled ground that structurally changed, in percent.

    Visible-band only: ExG (Woebbecke 1995) and VARI (Gitelson 2002) plus a structural
    term. NDVI/NDBI are NOT used and cannot be -- they need NIR and SWIR bands that this
    8-bit RGB basemap does not carry, which satellite_precision_engine.py refuses
    explicitly.

    Vegetation is excluded before differencing so that monsoon green-up, which moves the
    visible indices more than a quarter of construction does, is not counted as building.
    """
    import cv2
    from analytics_engine.eo_geospatial import (
        excess_green, relative_radiometric_normalization, vari,
    )

    if before is None or after is None:
        return None
    if before.shape != after.shape:
        h = min(before.shape[0], after.shape[0])
        w = min(before.shape[1], after.shape[1])
        before, after = before[:h, :w], after[:h, :w]

    b = cv2.GaussianBlur(before, (3, 3), 0)
    a = cv2.GaussianBlur(after, (3, 3), 0)

    # RRN before differencing. The two acquisitions were taken years apart under
    # different sun angle and atmosphere, and an uncorrected brightness offset would
    # register across the whole frame as "change". RRN fits the correction only on
    # pseudo-invariant pixels -- ones that did NOT change -- so genuine construction is
    # progressively excluded from the pixels defining the correction, rather than being
    # normalised away with the illumination as histogram matching would do.
    try:
        rrn = relative_radiometric_normalization(b, a)
        a = rrn.normalised_after
    except Exception:
        pass                      # an un-normalised comparison is still better than none

    veg_b, veg_a = excess_green(b) > 0.06, excess_green(a) > 0.06
    water_b, water_a = vari(b) < -0.35, vari(a) < -0.35
    ignore = veg_b | veg_a | water_b | water_a

    gb = cv2.cvtColor(b, cv2.COLOR_BGR2GRAY).astype(np.float32)
    ga = cv2.cvtColor(a, cv2.COLOR_BGR2GRAY).astype(np.float32)

    # Structural, not photometric: gradient orientation survives the brightness and
    # atmosphere differences between two acquisitions, raw intensity does not.
    gx_b, gy_b = cv2.Sobel(gb, cv2.CV_32F, 1, 0, 3), cv2.Sobel(gb, cv2.CV_32F, 0, 1, 3)
    gx_a, gy_a = cv2.Sobel(ga, cv2.CV_32F, 1, 0, 3), cv2.Sobel(ga, cv2.CV_32F, 0, 1, 3)
    mag_b = np.sqrt(gx_b ** 2 + gy_b ** 2)
    mag_a = np.sqrt(gx_a ** 2 + gy_a ** 2)

    def _norm(m):
        lo, hi = np.percentile(m, 2), np.percentile(m, 98)
        return np.clip((m - lo) / max(hi - lo, 1e-6), 0, 1)

    diff = np.abs(_norm(mag_a) - _norm(mag_b))
    diff[ignore] = 0.0

    changed = diff > 0.28
    valid = int((~ignore).sum())
    if valid < 1000:
        return None
    pct = float(changed.sum()) / float(valid) * 100.0
    return round(min(pct, 100.0), 3)


# ---------------------------------------------------------------------------------
# Orchestration
# ---------------------------------------------------------------------------------

def _geo_index() -> Dict[str, Dict[str, Any]]:
    with open(GEO_PATH, encoding="utf-8") as f:
        rows = json.load(f)
    rows = rows if isinstance(rows, list) else rows.get("projects", [])
    return {str(r.get("ProjectId")): r for r in rows}


def _milestone_dates(pid: str) -> List[date]:
    """Sanction / original target / revised target, from the corpus."""
    from analytics_engine.corpus_source import load_corpus
    from analytics_engine.temporal_audit import _parse_date
    try:
        df = load_corpus()
        row = df[df["ProjectId"].astype(str) == str(pid)]
        if row.empty:
            return []
        r = row.iloc[0]
        out = []
        for col in ("SanctionDate", "OriginalEndDate", "RevisedDate"):
            d = _parse_date(r.get(col))
            if d:
                out.append(d)
        return out
    except Exception:
        return []


def resolve_project(pid: str, releases: List[Dict[str, Any]],
                    geo: Dict[str, Dict[str, Any]],
                    max_epochs: int = 6) -> Dict[str, Any]:
    import cv2

    g = geo.get(pid, {})
    lat = g.get("lat") or g.get("latitude")
    lon = g.get("lng") or g.get("longitude")
    if lat is None or lon is None:
        return {"project_id": pid, "error": "no coordinate", "epochs": []}

    lat, lon = float(lat), float(lon)
    print(f"  [{pid}] discovering distinct epochs at {lat:.5f},{lon:.5f} …", flush=True)
    distinct = discover_distinct_epochs(lat, lon, releases)
    print(f"  [{pid}] {len(distinct)} distinct observations across "
          f"{len(releases)} releases", flush=True)

    md = _milestone_dates(pid)
    selected = select_for_milestones(distinct, md, max_epochs=max_epochs)
    print(f"  [{pid}] selected {len(selected)} epochs "
          f"(milestone anchors: {[d.isoformat() for d in md]})", flush=True)

    epochs: List[Dict[str, Any]] = []
    prev_img = None
    for i, e in enumerate(selected):
        img = capture_epoch_image(lat, lon, e["release"])
        if img is None:
            print(f"      release {e['release']} ({e['captured']}): no capture tile",
                  flush=True)
            continue

        fname = f"{pid}_EPOCH_{e['captured'].isoformat()}.jpg"
        fpath = os.path.join(IMAGERY_DIR, fname)
        os.makedirs(IMAGERY_DIR, exist_ok=True)
        cv2.imwrite(fpath, img, [int(cv2.IMWRITE_JPEG_QUALITY), 90])

        change = None if prev_img is None else surface_change_between(prev_img, img)
        with open(fpath, "rb") as f:
            sha = hashlib.sha256(f.read()).hexdigest()

        epochs.append({
            "epoch_index": i,
            "wayback_release": e["release"],
            "captured_on": e["captured"].isoformat(),
            "vintage_label": f"{e['captured'].isoformat()} (Wayback release {e['release']})",
            "tile_path": os.path.relpath(fpath, BASE_DIR).replace("\\", "/"),
            "image_sha256": sha,
            "surface_change_pct": change,
            "is_baseline": i == 0,
        })
        print(f"      {e['captured']}  release {e['release']:>6}  "
              f"change_vs_prev={('—' if change is None else f'{change:.2f}%')}",
              flush=True)
        prev_img = img

    return {
        "project_id": pid,
        "latitude": lat, "longitude": lon,
        "distinct_observations_found": len(distinct),
        "releases_probed": len(releases),
        "milestone_anchors": [d.isoformat() for d in md],
        "epochs": epochs,
    }


def main(pids: Optional[List[str]] = None, max_epochs: int = 6) -> Dict[str, Any]:
    pids = pids or SHOWCASE
    print("=" * 78)
    print("MULTI-EPOCH WAYBACK RESOLVER")
    print("=" * 78)

    releases = fetch_release_index()
    print(f"  release index: {len(releases)} dated releases, "
          f"{releases[0]['captured']} .. {releases[-1]['captured']}")
    print()

    results = [resolve_project(p, releases, _geo_index(), max_epochs) for p in pids]

    payload = {
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "discovery_zoom": DISCOVERY_ZOOM,
        "capture_zoom": CAPTURE_ZOOM,
        "phash_distance_min": PHASH_DISTANCE_MIN,
        "method": ("Distinct-release discovery by perceptual hash of one centre tile "
                   "per Wayback release, then full-grid capture for selected epochs. "
                   "surface_change_pct is structural change on visible bands (ExG/VARI "
                   "vegetation exclusion + gradient-orientation differencing). It is "
                   "NOT a completion estimate: surface change and reported progress "
                   "correlate at r=0.007 in this corpus."),
        "projects": results,
    }
    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)

    print()
    print("=" * 78)
    for r in results:
        print(f"  {r['project_id']}: {len(r.get('epochs', []))} epochs captured, "
              f"{r.get('distinct_observations_found', 0)} distinct observations found")
    print(f"  wrote {OUT_PATH}")
    print("=" * 78)
    return payload


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("-")]
    main(args or None)
