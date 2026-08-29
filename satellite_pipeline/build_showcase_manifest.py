"""
Rebuild the z18 showcase manifest from the mosaics actually on disk.

Run:  python satellite_pipeline/build_showcase_manifest.py

The bake writes its manifest at the end of the run, so a run that is
interrupted leaves good imagery on disk and an incomplete index of it. This
reads the files instead of trusting the report: dimensions come from the JPEG
header, grid size from dimensions/256, and ground sample distance from the
Web Mercator formula at the project's own latitude. Nothing is assumed that
can be measured.

A pair is admitted only if BOTH epochs are present, both decode, both are the
same size, and neither is a featureless raster. The last check matters because
a mosaic stitched entirely from provider placeholders decodes perfectly well
and would otherwise be indexed as sub-metre ground truth.
"""

from __future__ import annotations

import json
import math
import os
from typing import Any, Dict, List

import cv2
import numpy as np

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MOSAIC_DIR = os.path.join(BASE_DIR, "paimana_extracted", "satellite_data",
                          "showcase_z18")
GEO_PATH = os.path.join(BASE_DIR, "paimana_extracted", "satellite_data",
                        "ALL_2207_PROJECTS_GEOREFERENCED.json")
CAT_PATH = os.path.join(BASE_DIR, "paimana_extracted", "satellite_data",
                        "ALL_2207_PROJECTS_SATELLITE_CATALOG.json")
MANIFEST = os.path.join(BASE_DIR, "paimana_extracted", "satellite_data",
                        "showcase_z18_manifest.json")

ZOOM = 18
BEFORE_EPOCH = "2018-12"      # Wayback release 23448, verified
AFTER_EPOCH = "2023-01"       # Wayback release 11475, verified
MIN_LAPLACIAN = 120.0


def gsd(lat: float, z: int) -> float:
    return 40075016.686 * math.cos(math.radians(lat)) / (256 * (2 ** z))


def main() -> int:
    with open(GEO_PATH, "r", encoding="utf-8") as f:
        geo = {str(g.get("project_id") or g.get("ProjectId")): g for g in json.load(f)}
    with open(CAT_PATH, "r", encoding="utf-8") as f:
        cat = {str(r["project_id"]): r for r in json.load(f)}

    entries: List[Dict[str, Any]] = []
    if not os.path.isdir(MOSAIC_DIR):
        print(f"no mosaic directory at {MOSAIC_DIR}")
        return 1

    pids = sorted({f.split("_BEFORE_z18.jpg")[0]
                   for f in os.listdir(MOSAIC_DIR) if f.endswith("_BEFORE_z18.jpg")})
    for pid in pids:
        b_path = os.path.join(MOSAIC_DIR, f"{pid}_BEFORE_z18.jpg")
        a_path = os.path.join(MOSAIC_DIR, f"{pid}_AFTER_z18.jpg")
        if not os.path.exists(a_path):
            print(f"  skip {pid}: no AFTER mosaic")
            continue
        b, a = cv2.imread(b_path), cv2.imread(a_path)
        if b is None or a is None:
            print(f"  skip {pid}: undecodable")
            continue
        if b.shape != a.shape:
            # The grid fallback runs per epoch, so patchy 2018 coverage can
            # leave BEFORE at 7x7 while AFTER succeeded at 9x9. Both mosaics
            # are centred on the same coordinate, so a centre crop to the
            # smaller extent leaves two frames over IDENTICAL ground -- which
            # is what a swipe comparison requires. Serving the mismatched pair
            # would wipe between two different areas and read as change.
            side = min(b.shape[0], b.shape[1], a.shape[0], a.shape[1])
            def _centre(img, n):
                y = (img.shape[0] - n) // 2
                x = (img.shape[1] - n) // 2
                return img[y:y + n, x:x + n]
            b, a = _centre(b, side), _centre(a, side)
            cv2.imwrite(b_path, b, [cv2.IMWRITE_JPEG_QUALITY, 92])
            cv2.imwrite(a_path, a, [cv2.IMWRITE_JPEG_QUALITY, 92])
            print(f"  {pid}: harmonised mismatched epochs to {side}x{side} "
                  f"by centre crop")

        lap_b = float(cv2.Laplacian(cv2.cvtColor(b, cv2.COLOR_BGR2GRAY), cv2.CV_64F).var())
        lap_a = float(cv2.Laplacian(cv2.cvtColor(a, cv2.COLOR_BGR2GRAY), cv2.CV_64F).var())
        if min(lap_b, lap_a) < MIN_LAPLACIAN:
            print(f"  skip {pid}: featureless ({lap_b:.0f}/{lap_a:.0f}) — "
                  f"probably an all-placeholder mosaic")
            continue

        g = geo.get(pid) or {}
        lat = g.get("latitude")
        if lat is None:
            print(f"  skip {pid}: no coordinate")
            continue
        px = int(b.shape[1])
        m_per_px = gsd(float(lat), ZOOM)

        entries.append({
            "project_id": pid,
            "project_name": str((cat.get(pid) or {}).get("project_name", ""))[:90],
            "sector": (cat.get(pid) or {}).get("sector"),
            "latitude": lat, "longitude": g.get("longitude"),
            "zoom": ZOOM,
            "mosaic_px": px,
            "grid": px // 256,
            "gsd_m_per_px": round(m_per_px, 3),
            "covers_m": round(px * m_per_px, 1),
            "sub_metre": bool(m_per_px < 1.0),
            "before_path": os.path.relpath(b_path, BASE_DIR).replace("\\", "/"),
            "after_path": os.path.relpath(a_path, BASE_DIR).replace("\\", "/"),
            "before_epoch": BEFORE_EPOCH,
            "after_epoch": AFTER_EPOCH,
            "before_laplacian": round(lap_b, 1),
            "after_laplacian": round(lap_a, 1),
            "before_bytes": os.path.getsize(b_path),
            "after_bytes": os.path.getsize(a_path),
            "basis": (
                f"{px // 256}x{px // 256} tile mosaic at z{ZOOM}, stitched from ESRI "
                f"Wayback release 23448 ({BEFORE_EPOCH}) and 11475 ({AFTER_EPOCH}) — "
                f"release ids verified against the provider index, unlike the "
                f"corpus-wide bake which used release 10 (actually 2014-02) and "
                f"release 93 (not a release at all)."),
        })
        print(f"  {pid}  {px}x{px} px  {m_per_px:.3f} m/px  {px * m_per_px:.0f} m  "
              f"{'SUB-METRE' if m_per_px < 1.0 else ''}")

    with open(MANIFEST, "w", encoding="utf-8") as f:
        json.dump({"zoom": ZOOM, "before_epoch": BEFORE_EPOCH,
                   "after_epoch": AFTER_EPOCH, "entries": entries}, f, indent=1)
    print(f"\n{len(entries)} showcase pairs -> {MANIFEST}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
