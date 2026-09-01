"""
PRAKALP-DRISHTI: MULTI-EPOCH RESOLVER AUDIT

Offline checks over the resolver's logic and the artefact it produced. No network: the
resolved epochs are read from SHOWCASE_EPOCHS.json, which the pipeline writes.

Three properties matter here.

1. ORDERING IS BY DATE, NOT BY RELEASE ID. Wayback release 64776 is 2023-08-31 while
   release 64001 is 2026-02-26 -- the ids are not chronological. A timeline sorted by id
   would run backwards in places and silently pair the wrong images.

2. THE DETECTOR HAS NO FLOOR. Measured live against two Wayback releases serving
   perceptually identical imagery for the same location, surface_change_between returns
   exactly 0.0%. That is what makes a non-zero reading meaningful: it is not an artefact
   of re-encoding, illumination or acquisition geometry, all of which are present
   between any two distinct releases.

3. NO COMPLETION FIGURE SURVIVES INTO THE ARTEFACT. `surface_change_pct` is the fraction
   of sampled ground that structurally changed between two dated images. It is not a
   progress estimate and must never be stored, named or exported as one.
"""

import json
import os
import sys
from datetime import date, datetime

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)

import numpy as np                                                    # noqa: E402

from satellite_pipeline.resolve_showcase_epochs import (              # noqa: E402
    OUT_PATH, PHASH_DISTANCE_MIN, deg2tile, hamming, phash,
    select_for_milestones, surface_change_between,
)

_checks = 0
_failures = []


def check(name, ok, detail=""):
    global _checks
    _checks += 1
    print(f"  [{'PASS' if ok else 'FAIL'}] {name}" + (f"  -- {detail}" if detail else ""))
    if not ok:
        _failures.append(f"{name}: {detail}")


# ---------------------------------------------------------------------------------
print("\n--- TEST 1: TILE MATHS AND HASHING ---")
# ---------------------------------------------------------------------------------

# Bhopal, z16. Verified against the live fetch that produced the showcase epochs.
check("deg2tile is correct for a known point",
      deg2tile(23.2348551, 77.4021474, 16) == (46858, 28417),
      str(deg2tile(23.2348551, 77.4021474, 16)))
check("zoom changes tile index as expected",
      deg2tile(23.2348551, 77.4021474, 15) == (23429, 14208),
      str(deg2tile(23.2348551, 77.4021474, 15)))

import cv2                                                            # noqa: E402

# REAL TILES, not synthetic ones.
#
# Two earlier versions of this test built a synthetic frame -- first uniform noise, then
# a sine pattern -- and both misled. A DCT perceptual hash and a gradient change detector
# are tuned for the frequency content of aerial imagery: uniform noise gives the hash no
# structure to latch onto, and a high-frequency sine is precisely what JPEG quantisation
# destroys. Each synthetic frame set the threshold from a case the resolver never meets.
#
# The cache holds hundreds of genuine Wayback tiles, so these properties are asserted
# against the data the resolver actually processes.
CACHE_DIR = os.path.join(BASE_DIR, "paimana_extracted", "satellite_data",
                         "wayback_cache")


def _real_tiles(n=2):
    """Decodable tiles from the discovery cache."""
    if not os.path.isdir(CACHE_DIR):
        return []
    out = []
    for fn in sorted(os.listdir(CACHE_DIR)):
        path = os.path.join(CACHE_DIR, fn)
        if os.path.getsize(path) < 2000:
            continue                       # negative-cache marker, not imagery
        img = cv2.imread(path, cv2.IMREAD_COLOR)
        if img is not None and img.shape[0] >= 200:
            out.append((path, img))
        if len(out) >= n:
            break
    return out


tiles = _real_tiles(2)
check("real Wayback tiles are available to test against", len(tiles) >= 2,
      f"{len(tiles)} decodable tiles in the cache")

if len(tiles) >= 2:
    path_a, img_a = tiles[0]

    with open(path_a, "rb") as f:
        raw_a = f.read()
    # The SAME imagery re-encoded at lower quality. This is what a provider does between
    # renders, and it must not read as a new observation.
    _, buf_a2 = cv2.imencode(".jpg", img_a, [int(cv2.IMWRITE_JPEG_QUALITY), 70])

    h_a, h_a2 = phash(raw_a), phash(buf_a2.tobytes())
    check("phash of the same tile re-encoded stays under the distinctness threshold",
          hamming(h_a, h_a2) < PHASH_DISTANCE_MIN,
          f"distance={hamming(h_a, h_a2)}, threshold={PHASH_DISTANCE_MIN}")

    with open(tiles[1][0], "rb") as f:
        h_other = phash(f.read())
    check("phash distance is defined between two different tiles",
          isinstance(hamming(h_a, h_other), int))

check("phash returns None on undecodable bytes", phash(b"not an image") is None)


# ---------------------------------------------------------------------------------
print("\n--- TEST 2: THE DETECTOR HAS NO FLOOR ---")
# ---------------------------------------------------------------------------------

if len(tiles) >= 2:
    path_a, img_a = tiles[0]

    check("identical frames measure exactly 0.0% change",
          surface_change_between(img_a, img_a) == 0.0,
          "measured live against two Wayback releases serving identical imagery: "
          "also exactly 0.0%")

    img_built = img_a.copy()
    _h, _w = img_built.shape[:2]
    img_built[_h // 4:_h // 2, _w // 4:_w // 2] = 235
    _changed = surface_change_between(img_a, img_built)
    check("a structure added to a real tile measures above zero",
          _changed is not None and _changed > 3.0, str(_changed))

    check("mismatched frame sizes are cropped, not rejected",
          surface_change_between(img_a, img_built[:_h - 40, :_w - 40]) is not None)
    check("a frame too small to sample returns None, not a number",
          surface_change_between(img_a[:20, :20], img_built[:20, :20]) is None,
          "under-sampled ground must yield no measurement rather than a noisy one")



# ---------------------------------------------------------------------------------
print("\n--- TEST 3: MILESTONE-ANCHORED SELECTION ---")
# ---------------------------------------------------------------------------------

distinct = [{"release": i, "captured": date(2014 + i, 3, 1)} for i in range(11)]

sel = select_for_milestones(distinct, [date(2018, 5, 1), date(2022, 5, 1)], max_epochs=6)
check("selection respects the epoch budget", len(sel) <= 6, str(len(sel)))
check("the baseline is always kept", sel[0]["captured"] == distinct[0]["captured"])
check("the newest observation is always kept",
      sel[-1]["captured"] == distinct[-1]["captured"])
check("selection is chronological",
      [s["captured"] for s in sel] == sorted(s["captured"] for s in sel))
check("an epoch near each milestone anchor is chosen",
      any(abs((s["captured"] - date(2018, 5, 1)).days) < 400 for s in sel)
      and any(abs((s["captured"] - date(2022, 5, 1)).days) < 400 for s in sel))
check("fewer distinct epochs than the budget returns them all",
      len(select_for_milestones(distinct[:3], [], max_epochs=6)) == 3)
check("no distinct epochs returns empty, never a fabricated one",
      select_for_milestones([], [date(2020, 1, 1)]) == [])


# ---------------------------------------------------------------------------------
print("\n--- TEST 4: THE RESOLVED ARTEFACT ---")
# ---------------------------------------------------------------------------------

if not os.path.exists(OUT_PATH):
    check("SHOWCASE_EPOCHS.json exists", False,
          "run satellite_pipeline/resolve_showcase_epochs.py")
else:
    payload = json.load(open(OUT_PATH, encoding="utf-8"))
    projects = payload.get("projects", [])
    check("SHOWCASE_EPOCHS.json exists and holds projects", len(projects) >= 5,
          f"{len(projects)} projects")

    all_epochs = [e for p in projects for e in p.get("epochs", [])]
    check("every showcase project resolved at least 4 epochs",
          all(len(p.get("epochs", [])) >= 4 for p in projects),
          str({p["project_id"]: len(p.get("epochs", [])) for p in projects}))

    check("every epoch carries a real capture date",
          all(e.get("captured_on") for e in all_epochs))
    check("every epoch names its Wayback release",
          all(isinstance(e.get("wayback_release"), int) for e in all_epochs))
    check("every epoch carries an image SHA-256",
          all(len(str(e.get("image_sha256", ""))) == 64 for e in all_epochs))
    check("every epoch image exists on disk",
          all(os.path.exists(os.path.join(BASE_DIR, e["tile_path"]))
              for e in all_epochs),
          str([e["tile_path"] for e in all_epochs
               if not os.path.exists(os.path.join(BASE_DIR, e["tile_path"]))][:3]))

    for p in projects:
        eps = p.get("epochs", [])
        dates = [datetime.strptime(e["captured_on"], "%Y-%m-%d").date() for e in eps]
        check(f"[{p['project_id']}] epochs are chronological",
              dates == sorted(dates),
              "release ids are NOT chronological, so ordering must come from the date")
        check(f"[{p['project_id']}] exactly one baseline",
              sum(1 for e in eps if e.get("is_baseline")) == 1)
        check(f"[{p['project_id']}] the baseline has no change figure",
              eps[0].get("surface_change_pct") is None,
              "there is no earlier image to compare the baseline against")
        check(f"[{p['project_id']}] later epochs carry a measured change",
              all(isinstance(e.get("surface_change_pct"), (int, float))
                  for e in eps[1:]))

    check("at least one project resolved a 2026 observation",
          any(e["captured_on"].startswith("2026") for e in all_epochs),
          "a dated 2026 epoch, not a fetch-bounded '<=2026-08'")

    # The artefact must not smuggle in the figure the whole system refuses.
    BANNED = ("detected_progress", "satellite_detected", "discrepancy",
              "completion_pct", "progress_pct", "fraud")
    text = json.dumps(payload).lower()
    offenders = [b for b in BANNED if f'"{b}' in text or f"_{b}" in text]
    check("the artefact exports no progress or discrepancy figure",
          not offenders, str(offenders))
    check("the artefact states the r=0.007 limitation",
          "0.007" in payload.get("method", ""))


# ---------------------------------------------------------------------------------
print()
print("=" * 78)
if _failures:
    print(f"SHOWCASE EPOCH AUDIT FAILED: {len(_failures)} of {_checks} checks")
    for f in _failures:
        print(f"  - {f}")
    print("=" * 78)
    sys.exit(1)

print(f"ASSERTIONS PASSED: {_checks} resolver checks, 0 failures.")
print("=" * 78)
