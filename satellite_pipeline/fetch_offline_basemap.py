"""
Cache the OSM basemap for India so the map renders without a network.

Run:  python satellite_pipeline/fetch_offline_basemap.py

Every Leaflet map in the platform pointed at https://{s}.tile.openstreetmap.org.
That works on a developer machine with internet and produces a blank grey pane
everywhere else -- which is what the Nagrik portal was showing. The deployment
target is air-gapped, so the basemap was never going to load there at all, and
the failure is silent: Leaflet draws the pins on nothing and reports nothing.

The tiles cached here are the SAME tiles the app was already requesting at
runtime. Caching them changes when they are fetched, not what is displayed, so
this introduces no new decision about how any boundary is drawn.

Scope is z3-z8, 886 tiles, about 6 MB. The three maps default to z5, z6 and
z7, so z8 is one step of zoom-in past every starting view -- enough that
clicking + during a demo still lands on sharp tiles. Past z8 Leaflet upsamples
via maxNativeZoom rather than requesting tiles that do not exist; the maps that
zoom that far are showing multi-kilometre uncertainty radii, where a soft
backdrop costs nothing they are trying to convey.

Politeness: one request at a time, 1.1 s apart, descriptive User-Agent, and
already-cached tiles are skipped so a re-run costs nothing.
"""

from __future__ import annotations

import math
import os
import time
import urllib.error
import urllib.request

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(BASE_DIR, "frontend", "public", "basemap")

# India including Andaman & Nicobar and Lakshadweep.
WEST, SOUTH, EAST, NORTH = 67.0, 5.5, 98.5, 37.6
ZOOMS = range(3, 9)

UA = ("PRAKALP-DRISHTI/1.0 (MoSPI central-sector project monitoring; "
      "one-time offline basemap cache for air-gapped deployment)")
DELAY_S = 1.1
MIN_BYTES = 103          # a 1x1 transparent PNG is ~68 B; real tiles far exceed this


def deg2num(lat: float, lon: float, z: int) -> tuple[int, int]:
    n = 2 ** z
    x = int((lon + 180.0) / 360.0 * n)
    y = int((1.0 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2.0 * n)
    return x, y


def main() -> int:
    jobs: list[tuple[int, int, int]] = []
    for z in ZOOMS:
        x0, y0 = deg2num(NORTH, WEST, z)
        x1, y1 = deg2num(SOUTH, EAST, z)
        for x in range(x0, x1 + 1):
            for y in range(y0, y1 + 1):
                jobs.append((z, x, y))

    print(f"{len(jobs)} tiles for z{ZOOMS.start}-{ZOOMS.stop - 1} over India")
    got = skipped = failed = 0

    for i, (z, x, y) in enumerate(jobs, 1):
        d = os.path.join(OUT_DIR, str(z), str(x))
        path = os.path.join(d, f"{y}.png")
        if os.path.exists(path) and os.path.getsize(path) > MIN_BYTES:
            skipped += 1
            continue
        os.makedirs(d, exist_ok=True)

        url = f"https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                blob = r.read()
        except (urllib.error.HTTPError, urllib.error.URLError, OSError) as e:
            print(f"  [{i}/{len(jobs)}] z{z}/{x}/{y} FAILED: {e}")
            failed += 1
            time.sleep(DELAY_S)
            continue

        # A short body is an error page or a blank placeholder, and writing it
        # would leave a tile that exists, loads, and shows nothing -- which is
        # indistinguishable from the bug being fixed.
        if len(blob) <= MIN_BYTES:
            print(f"  [{i}/{len(jobs)}] z{z}/{x}/{y} rejected: {len(blob)} B")
            failed += 1
            time.sleep(DELAY_S)
            continue

        with open(path, "wb") as f:
            f.write(blob)
        got += 1
        if got % 25 == 0:
            print(f"  [{i}/{len(jobs)}] {got} fetched, {skipped} already cached")
        time.sleep(DELAY_S)

    total_b = sum(os.path.getsize(os.path.join(dp, f))
                  for dp, _, fs in os.walk(OUT_DIR) for f in fs)
    print(f"\n{got} fetched, {skipped} cached, {failed} failed")
    print(f"cache: {total_b / 1e6:.1f} MB at {OUT_DIR}")
    return 1 if failed and not got else 0


if __name__ == "__main__":
    raise SystemExit(main())
