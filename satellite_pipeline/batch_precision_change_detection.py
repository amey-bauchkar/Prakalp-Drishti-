"""
PRAKALP-DRISHTI: BATCH PRECISION CHANGE DETECTION

Supersedes batch_compute_pixel_delta.py.

The old script differenced raw pixels, which conflated three unrelated things:
the sun angle (2023 basemap is ~37 grey levels darker than 2018), the sensor
resolution (2023 tiles are ~3.6x blurrier, so counting edges reports construction
with the WRONG SIGN), and the crosshair the fetch pipeline burns into the dead
centre of every tile in a different colour per epoch.

This script runs the corrected chain from analytics_engine.satellite_precision_cv --
annotation masking, co-registration, radiometric normalisation, SSIM -- and emits
localised change polygons instead of one scalar.

It also joins each project's geocode_precision and, crucially, marks whether the
Earth-observation verdict is trustworthy at all. A project geocoded to a state or
national centroid is not imaged at its own site, so any finding measured over that
imagery is meaningless and must not be presented as evidence of over-reporting.
Suppressing those verdicts is the difference between a defensible audit tool and a
random number generator with a confident UI.

What this script deliberately does NOT do
-----------------------------------------
It does not estimate "percentage complete" from imagery. An earlier release did, via

    eo_observed = surface_change * 2.2 + claimed_progress * 0.45

which is circular: 70% of the "independent orbital observation" was, on average,
copied from the contractor figure it purported to audit. It correlated more strongly
with the claim (0.768) than with the pixels (0.645), so inflating a claim inflated its
own verification and suppressed the divergence the tool exists to surface.

Removing the anchor alone would not have rescued it. Measured on the site-level
projects, surface change and reported progress are uncorrelated (r ~ 0 overall and
within each asset geometry; the current figures are recomputed from this catalogue by
analytics_engine/eo_independence.py into artifacts/eo_progress_independence.json). One
800x800 tile simply cannot express what fraction of a DPR is finished, least of all
for a 50 km corridor sampled at a single point.

So the output is now two honest things instead of one false one:
  * surface_change_pct -- an independent measurement, no claim input anywhere;
  * an ACTIVITY_ANOMALY flag for projects claiming near-completion whose sampled
    ground sits in the bottom decile of structural change FOR THEIR SECTOR.
The flag says "this warrants a field visit", never "this project is N% complete".
"""

from __future__ import annotations

import io
import json
import os
import sys
import time
from concurrent.futures import ProcessPoolExecutor

import cv2
import numpy as np
import pandas as pd

def _force_utf8_stdout() -> None:
    """Windows consoles default to cp1252 and choke on the report glyphs.

    Called from main() rather than at import time: rebinding sys.stdout on import
    invalidates any wrapper an importing process already installed, which breaks
    this module for anyone who imports process_single_project() directly.
    """
    if sys.platform == "win32" and sys.stdout and hasattr(sys.stdout, "buffer"):
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")


BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from analytics_engine.satellite_precision_cv import detect_change  # noqa: E402

DATA_PATH = os.path.join(BASE_DIR, "paimana_extracted", "PAIMANA_MASTER_PROJECTS_DATABASE.csv")
GEO_PATH = os.path.join(BASE_DIR, "paimana_extracted", "satellite_data", "ALL_2207_PROJECTS_GEOREFERENCED.json")
IMAGERY_DIR = os.path.join(BASE_DIR, "paimana_extracted", "satellite_data", "project_imagery")
CATALOG_PATH = os.path.join(BASE_DIR, "paimana_extracted", "satellite_data", "ALL_2207_PROJECTS_SATELLITE_CATALOG.json")
DOSSIER_PATH = os.path.join(BASE_DIR, "paimana_extracted", "satellite_data", "ALL_2207_PROJECT_SHOWCASE_DOSSIERS.json")

MAX_BOXES = 12          # keep the largest few; 190 boxes is noise, not evidence
MIN_BOX_AREA_FRAC = 0.0015

# Which geocode qualities justify showing an EO verdict at all.
# REGIONAL_COALFIELD_CENTROID is deliberately absent: it gives the map a plausible
# marker for an operating coalfield, but it is a regional estimate, not the works, so
# it must never unlock a fraud finding.
SITE_LEVEL_PRECISIONS = {
    "GAZETTEER_CITY_MATCH", "OSM_LANDMARK_MATCH", "OSM_CORRIDOR_MIDPOINT",
    "GEONAMES_EXACT_MATCH", "GEONAMES_EXACT_UNCONSTRAINED", "GEONAMES_TOKEN_MATCH",
}

GEOCODE_CONFIDENCE = {
    "OSM_LANDMARK_MATCH":          ("HIGH",   "Site geocoded to a named landmark in the project title"),
    "GEONAMES_EXACT_MATCH":        ("HIGH",   "Gazetteer match on the full place name, confirmed within the expected state"),
    "OSM_CORRIDOR_MIDPOINT":       ("MEDIUM", "Midpoint of the two corridor endpoints named in the title"),
    "GAZETTEER_CITY_MATCH":        ("MEDIUM", "Matched to a gazetteer city; may be km from the works"),
    "GEONAMES_EXACT_UNCONSTRAINED": ("MEDIUM", "Gazetteer name unique within India, but no state available to confirm it"),
    "GEONAMES_TOKEN_MATCH":        ("MEDIUM", "Gazetteer match on a place name inside the asset code, state-constrained"),
    "REGIONAL_COALFIELD_CENTROID": ("LOW",    "Operating coalfield region only; not the project site"),
    "STATE_CENTROID_MATCH":        ("NONE",   "Placeholder: geometric centre of the state, not the site"),
    "NATIONAL_CENTROID_MATCH":     ("NONE",   "Placeholder: near India's centroid, not the site"),
}


# Assets whose footprint is a corridor, not a point. A single 800x800 tile samples one
# slice of a 50 km highway, so its change value describes that slice -- never the whole
# project. Surfaced explicitly so the UI cannot imply otherwise.
LINEAR_SECTORS = {
    "Roads & Highways", "Railways", "Transmission & Distribution",
    "Oil & Gas", "Inland Waterways", "Urban Public Transport",
}


def _empty_record(pid, name, sector, state, claimed, reason):
    return {
        "project_id": pid, "project_name": name, "sector": sector, "state": state,
        "claimed_progress_pct": claimed,
        "audit_status": "EO_UNAVAILABLE",
        "statutory_recommendation": "STANDARD_PHYSICAL_INSPECTION", "audit_severity": "LOW",
        "surface_change_pct": 0.0, "change_percentile_in_sector": None,
        "mean_dissimilarity": 0.0, "change_boxes": [],
        "registration_shift_px": 0.0, "registration_method": "none",
        "has_dual_epoch_coverage": False, "eo_verdict_reliable": False,
        "eo_unreliable_reason": reason,
        "asset_geometry": "LINEAR" if sector in LINEAR_SECTORS else "POINT",
    }


def process_single_project(row):
    pid, name, sector, state, agency, claimed, precision = row
    pid = str(pid)
    sector = str(sector) if pd.notna(sector) else "Unspecified"
    state = str(state) if pd.notna(state) else "National"
    claimed = float(claimed) if pd.notna(claimed) else 50.0
    precision = str(precision or "NATIONAL_CENTROID_MATCH")

    confidence, conf_note = GEOCODE_CONFIDENCE.get(precision, ("NONE", "Unknown geocode provenance"))
    site_level = precision in SITE_LEVEL_PRECISIONS

    before_p = os.path.join(IMAGERY_DIR, f"{pid}_BEFORE.jpg")
    after_p = os.path.join(IMAGERY_DIR, f"{pid}_AFTER.jpg")

    base = {
        "project_id": pid, "project_name": str(name), "sector": sector, "state": state,
        "agency": str(agency), "claimed_progress_pct": claimed,
        "geocode_precision": precision, "geocode_confidence": confidence,
        "geocode_confidence_note": conf_note,
        "sensor": "ESRI ArcGIS World Imagery + Wayback Living Atlas (Sub-meter)",
        "before_imagery_url": f"/satellite-imagery/{pid}_BEFORE.jpg",
        "after_imagery_url": f"/satellite-imagery/{pid}_AFTER.jpg",
        "resolution_m": 0.8, "baseline_vintage": "2018-02", "current_vintage": "2023-01",
    }

    if not (os.path.exists(before_p) and os.path.exists(after_p)):
        rec = _empty_record(pid, name, sector, state, claimed, "No dual-epoch imagery on disk")
        return {**base, **rec}

    try:
        b = cv2.imread(before_p)
        a = cv2.imread(after_p)
        if b is None or a is None:
            raise ValueError("unreadable image")

        res = detect_change(b, a)
        h, w = b.shape[:2]

        n, labels, stats, _ = cv2.connectedComponentsWithStats(res.change_mask, connectivity=8)
        blobs = sorted(
            (stats[i] for i in range(1, n)),
            key=lambda s: -s[cv2.CC_STAT_AREA],
        )
        boxes = []
        for s in blobs[:MAX_BOXES]:
            x, y, bw, bh, area = s
            if area / float(h * w) < MIN_BOX_AREA_FRAC:
                continue
            # Explicit float() casts: OpenCV returns numpy scalars, and while np.float64
            # happens to subclass float, np.int32/int64 do not -- keeping the contract
            # explicit avoids a serialization surprise if the stats dtype ever changes.
            boxes.append({
                "x": round(float(x) / w, 4), "y": round(float(y) / h, 4),
                "w": round(float(bw) / w, 4), "h": round(float(bh) / h, 4),
                "area_pct": round(float(area) / (h * w) * 100, 2),
            })

        change_pct = round(res.change_fraction * 100.0, 2)

        # NOTE: this worker emits MEASUREMENTS ONLY. Classification happens in main(),
        # after the sector-relative distributions are known. Critically, `claimed` is
        # NOT an input to any measurement here -- see the module docstring on why the
        # previous formula was circular.
        return {
            **base,
            "surface_change_pct": change_pct,
            "mean_dissimilarity": round(res.mean_dissimilarity, 4),
            "change_boxes": boxes,
            "registration_shift_px": round(res.registration_shift_px, 2),
            "registration_method": res.registration_method,
            "has_dual_epoch_coverage": True,
            "eo_verdict_reliable": site_level,
            "eo_unreliable_reason": None if site_level else conf_note,
            "asset_geometry": "LINEAR" if sector in LINEAR_SECTORS else "POINT",
        }
    except Exception as exc:
        rec = _empty_record(pid, name, sector, state, claimed, f"CV failure: {exc}")
        return {**base, **rec}


# A project must claim at least this much progress before absent ground activity is
# considered anomalous. Below it, low change is expected and says nothing.
ANOMALY_CLAIM_THRESHOLD = 70.0
# ...and its change must sit in the bottom decile OF ITS OWN SECTOR. Sector-relative
# because a coal mine and a district hospital transform the ground very differently.
ANOMALY_PERCENTILE = 10.0


def classify(results: list) -> None:
    """Second pass: assign audit status from sector-relative change, in place.

    Why this is not a progress estimate
    -----------------------------------
    Measured across the site-level projects, the correlation between reported
    progress and pixel-derived surface change is ~0 (artifacts/eo_progress_independence.json
    holds the current value, by asset geometry too). The imagery therefore
    CANNOT support a statement of the form "orbital observation says this project is
    N% complete", and the previous release's attempt to produce one only looked
    plausible because 45% of its value was copied from the claim it was auditing.

    What the imagery CAN support is a much narrower, genuinely defensible screen:
    a project asserting near-completion whose sampled ground shows almost no
    structural transformation is an outlier worth a field visit. That is an anomaly
    flag, not a measurement of completion, and it is reported as such.
    """
    reliable = [r for r in results if r.get("eo_verdict_reliable")]

    # Sector-relative baselines, built only from projects whose imagery we trust.
    by_sector = {}
    for r in reliable:
        by_sector.setdefault(r["sector"], []).append(r["surface_change_pct"])
    cutoffs = {
        s: float(np.percentile(v, ANOMALY_PERCENTILE))
        for s, v in by_sector.items() if len(v) >= 20   # too few to define a distribution
    }

    for r in results:
        if not r.get("eo_verdict_reliable"):
            r["audit_status"] = "EO_UNAVAILABLE"
            r["statutory_recommendation"] = "STANDARD_PHYSICAL_INSPECTION"
            r["audit_severity"] = "LOW"
            r["change_percentile_in_sector"] = None
            continue

        peers = by_sector.get(r["sector"], [])
        chg = r["surface_change_pct"]
        pct = (float(np.mean([p <= chg for p in peers])) * 100.0) if peers else None
        r["change_percentile_in_sector"] = round(pct, 1) if pct is not None else None

        cutoff = cutoffs.get(r["sector"])
        claimed = r["claimed_progress_pct"]

        if cutoff is not None and claimed >= ANOMALY_CLAIM_THRESHOLD and chg <= cutoff:
            r["audit_status"] = "ACTIVITY_ANOMALY"
            r["statutory_recommendation"] = "PRIORITISE_FIELD_VERIFICATION"
            r["audit_severity"] = "HIGH"
        elif chg >= 1.0:
            r["audit_status"] = "CHANGE_CONFIRMED"
            r["statutory_recommendation"] = "CONSISTENT_WITH_ACTIVE_WORKS"
            r["audit_severity"] = "LOW"
        else:
            r["audit_status"] = "LOW_CHANGE_OBSERVED"
            r["statutory_recommendation"] = "NO_ACTION_INDICATED"
            r["audit_severity"] = "LOW"


def main():
    _force_utf8_stdout()
    t0 = time.time()
    df = pd.read_csv(DATA_PATH)

    precision_by_pid = {}
    if os.path.exists(GEO_PATH):
        with open(GEO_PATH, "r", encoding="utf-8") as f:
            for g in json.load(f):
                precision_by_pid[str(g.get("ProjectId"))] = g.get("geocode_precision")

    rows = [
        (r.get("ProjectId"), r.get("ProjectName"), r.get("SectorName"), r.get("StateName"),
         r.get("COMPANYNAME"), r.get("PhysicalProgress", 50.0),
         precision_by_pid.get(str(r.get("ProjectId"))))
        for _, r in df.iterrows()
    ]

    print(f"Loaded {len(rows)} projects. Running precision change detection...")
    with ProcessPoolExecutor(max_workers=12) as ex:
        results = list(ex.map(process_single_project, rows, chunksize=16))

    elapsed = time.time() - t0
    print(f"Processed {len(results)} projects in {elapsed:.1f}s ({len(results)/elapsed:.1f}/s)\n")

    classify(results)

    reliable = [r for r in results if r.get("eo_verdict_reliable")]
    print(f"EO verdict RELIABLE (site-level geocode): {len(reliable)} / {len(results)} "
          f"({len(reliable)/len(results)*100:.1f}%)")

    conf = {}
    for r in results:
        conf[r.get("geocode_confidence", "NONE")] = conf.get(r.get("geocode_confidence", "NONE"), 0) + 1
    print("Geocode confidence mix:", conf)

    status = {}
    for r in reliable:
        status[r["audit_status"]] = status.get(r["audit_status"], 0) + 1
    print("\nAudit status across RELIABLE projects only:")
    for k, v in sorted(status.items(), key=lambda kv: -kv[1]):
        print(f"  {k:22s} {v:5d}  ({v/max(len(reliable),1)*100:5.1f}%)")

    if reliable:
        cf = np.array([r["surface_change_pct"] for r in reliable])
        cl = np.array([r["claimed_progress_pct"] for r in reliable])
        nb = np.array([len(r["change_boxes"]) for r in reliable])
        print(f"\nSurface change (reliable only): median {np.median(cf):.2f}%  p90 {np.percentile(cf,90):.2f}%")
        print(f"Change boxes per project: median {np.median(nb):.0f}  max {nb.max()}")
        # Independence check: this MUST stay near zero. A rising value means the
        # claimed figure has leaked back into the measurement path.
        print(f"\nINTEGRITY corr(surface_change, claimed) = {np.corrcoef(cf, cl)[0,1]:+.3f} "
              f"(must be ~0: the measurement is independent of the claim)")
        lin = sum(1 for r in reliable if r["asset_geometry"] == "LINEAR")
        print(f"Asset geometry: {lin} LINEAR (tile samples one slice of a corridor), "
              f"{len(reliable)-lin} POINT")

    with open(CATALOG_PATH, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    with open(DOSSIER_PATH, "w", encoding="utf-8") as f:
        json.dump([r for r in results if r.get("eo_verdict_reliable")][:100], f, indent=2)
    print(f"\nWrote {CATALOG_PATH}")
    # Persist the independence figure the whole satellite layer cites, computed
    # from the catalogue just written rather than quoted from memory.
    try:
        import sys as _sys
        _sys.path.insert(0, BASE_DIR)
        from analytics_engine.eo_independence import write_artifact
        art = write_artifact(CATALOG_PATH)
        print(f"eo_progress_independence: r={art['overall']['pearson_r']:+.4f} "
              f"n={art['n_reliable']} -> artifacts/eo_progress_independence.json")
    except Exception as exc:  # pragma: no cover
        print(f"eo_progress_independence NOT written: {exc}")


if __name__ == "__main__":
    main()
