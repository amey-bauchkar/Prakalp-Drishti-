"""
PRAKALP-DRISHTI: EO VIEWPORT PLANNER
Decides the framing, zoom and provider for one project's imagery request.

────────────────────────────────────────────────────────────────────────────
THE BINDING CONSTRAINT IS GEOCODE ERROR, NOT SENSOR RESOLUTION
────────────────────────────────────────────────────────────────────────────

Measured on this corpus, not assumed:

    GEONAMES_EXACT_MATCH             6      \\  the only coordinates that are
    GEONAMES_EXACT_UNCONSTRAINED     2      /   anything like surveyed:  8/2207
    OSM_LANDMARK_MATCH             831          named feature, town-scale error
    GAZETTEER_CITY_MATCH           506          a CITY centroid, km-scale error
    NATIONAL_CENTROID_MATCH        365          not a location at all
    STATE_CENTROID_MATCH           231          not a location at all
    OSM_CORRIDOR_MIDPOINT          127          a point on a line, not the works
    GEONAMES_TOKEN_MATCH           112          fuzzy string match, unbounded
    REGIONAL_COALFIELD_CENTROID     27          a coalfield, not a mine

Tight framing is a MAGNIFIER of that error. A frame of N pixels at ground
sample distance g covers N*g metres, so the asset stays visible only while

    geocode_error  <  N * g / 2

At the current z17 / 800 px that tolerance is ±420 m and a town-scale error
still lands the asset somewhere in frame. At the requested 0.3 m/px / 1024 px
it collapses to ±154 m — smaller than the error on 1,368 of 2,207 projects.
Those requests would return a beautifully resolved photograph of the wrong
field, and the sharper it is the more authoritative it looks. Resolution
without provenance is a liability, so zoom here is gated on geocode
confidence FIRST and sector SECOND.

────────────────────────────────────────────────────────────────────────────
THE PROVIDER CEILING IS z18, MEASURED
────────────────────────────────────────────────────────────────────────────

ESRI World Imagery, tiles fetched and analysed rather than assumed:

    AIIMS Delhi (urban)   z17 1.05 m/px  lap 2204   z18 0.52 m/px  lap 2739
                          z19 0.26 m/px  lap 1220   z20 --- BLANK PLACEHOLDER
    Rural Haryana         z17 1.04 m/px  lap 3408   z18 0.52 m/px  lap 1341
                          z19 --- BLANK PLACEHOLDER

The placeholder is a 2,521-byte tile with Laplacian variance 45.3, byte- and
statistic-identical at both sites. It is the provider saying "no imagery at
this zoom", and it decodes to a valid grey image — so a pipeline that does not
test for it will ingest it as ground truth and report zero change forever.

z18 at 0.52 m/px satisfies the sub-metre requirement. z19 is urban-only and
already degraded; z20 does not exist. MAX_ZOOM is therefore 18, and every
fetch is placeholder-checked regardless.
"""

from __future__ import annotations

import hashlib
import math
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple

# ── provider ceiling, measured ───────────────────────────────────────────────
MAX_PROVIDER_ZOOM = 18
MIN_USEFUL_ZOOM = 12

# A blank "no imagery here" tile from ESRI. Both signatures are checked: the
# byte length catches the exact artefact, the Laplacian catches a re-encoded
# or differently-sized variant of the same empty raster.
PLACEHOLDER_BYTES = 2521
PLACEHOLDER_LAPLACIAN_MAX = 120.0

EARTH_CIRCUMFERENCE_M = 40075016.686


# ── geocode confidence -> the tightest framing that is honest ────────────────
#
# ONE number per class: the estimated error radius. The zoom ceiling is DERIVED
# from it at request time by zoom_for_half_extent(), so the two cannot drift
# apart.
#
# Hardcoding both was the first version of this table and it was internally
# inconsistent: GAZETTEER_CITY_MATCH declared a 4 km error and a z15 ceiling,
# but a 1024 px frame at z15 covers 4.5 km, so it contained only +/-2.27 km of
# the stated 4 km. Measured across the corpus, only 20% of frames actually held
# their own declared error. Deriving the zoom makes containment true by
# construction and leaves one number to argue about per class, which is the
# number that is actually an estimate.
#
# `serve` False means no imagery at any zoom: a state or national centroid
# locates an administrative unit, not a project, and no amount of zooming out
# turns it into a site.
GEOCODE_CLASS: Dict[str, Dict[str, Any]] = {
    "GEONAMES_EXACT_MATCH":          {"error_radius_m": 120,    "tier": "surveyed",   "serve": True},
    "GEONAMES_EXACT_UNCONSTRAINED":  {"error_radius_m": 250,    "tier": "surveyed",   "serve": True},
    "OSM_LANDMARK_MATCH":            {"error_radius_m": 600,    "tier": "landmark",   "serve": True},
    "OSM_CORRIDOR_MIDPOINT":         {"error_radius_m": 1500,   "tier": "corridor",   "serve": True},
    "GAZETTEER_CITY_MATCH":          {"error_radius_m": 4000,   "tier": "settlement", "serve": True},
    "GEONAMES_TOKEN_MATCH":          {"error_radius_m": 8000,   "tier": "weak",       "serve": True},
    "REGIONAL_COALFIELD_CENTROID":   {"error_radius_m": 15000,  "tier": "regional",   "serve": True},
    "STATE_CENTROID_MATCH":          {"error_radius_m": 200000, "tier": "unusable",   "serve": False},
    "NATIONAL_CENTROID_MATCH":       {"error_radius_m": 800000, "tier": "unusable",   "serve": False},
}
_UNKNOWN_CLASS = {"error_radius_m": 800000, "tier": "unusable", "serve": False}


def _geocode_zoom_ceiling(lat: float, error_radius_m: float, frame_px: int) -> int:
    """Tightest zoom whose frame still contains the geocode error radius."""
    return zoom_for_half_extent(lat, error_radius_m, frame_px)


# ── sector geometry ──────────────────────────────────────────────────────────
LINEAR_SECTORS = frozenset({
    "Roads & Highways", "Railways", "Transmission & Distribution",
    "Oil & Gas", "Inland Waterways", "Urban Public Transport",
})

# Half-extent in metres that a compact facility of this class typically needs
# in frame. These size the VIEW, not the analysis corridor -- the statutory RoW
# buffers in eo_geospatial.py remain the measurement geometry.
SECTOR_VIEW_HALF_EXTENT_M: Dict[str, float] = {
    "Healthcare": 350.0,
    "Education": 350.0,
    "Real Estate": 350.0,
    "Telecommunication": 300.0,
    "Aviation & Aviation Infrastructure": 1200.0,
    "Electricity Generation": 900.0,
    "Energy Storage": 600.0,
    "Steel": 1200.0,
    "Metals & Mining": 2000.0,
    "Coal": 2500.0,
    "Water Resources": 1500.0,
    "Waste & Water": 500.0,
    "Shipping": 1500.0,
    "Logistics Infrastructure": 800.0,
    "Construction": 500.0,
    "Tourism, Hospitality & Wellness": 400.0,
}
DEFAULT_VIEW_HALF_EXTENT_M = 600.0

# A corridor package is a chainage window, not an attempt to frame the route.
# 20 km is the standard NHAI/DFCCIL package granularity and also happens to be
# about what one z14 tile row spans, so packages align with tile boundaries.
CORRIDOR_PACKAGE_KM = 20.0
CORRIDOR_VIEW_HALF_WIDTH_M = 400.0


def ground_sample_distance(lat: float, zoom: int, tile_px: int = 256) -> float:
    """Web Mercator GSD in metres per pixel."""
    return (EARTH_CIRCUMFERENCE_M * math.cos(math.radians(lat))
            / (tile_px * (2 ** zoom)))


def zoom_for_half_extent(lat: float, half_extent_m: float,
                         frame_px: int) -> int:
    """Largest zoom whose frame still contains +/- half_extent_m.

    Solved rather than tabulated: frame_px * gsd(lat, z) >= 2 * half_extent_m.
    A table of sector->zoom silently breaks at latitude, because a frame at
    Kanyakumari covers 15% more ground than the same frame in Ladakh.
    """
    for z in range(MAX_PROVIDER_ZOOM, MIN_USEFUL_ZOOM - 1, -1):
        if frame_px * ground_sample_distance(lat, z) >= 2.0 * half_extent_m:
            return z
    return MIN_USEFUL_ZOOM


def bbox_from_centre(lat: float, lon: float, half_extent_m: float
                     ) -> Tuple[float, float, float, float]:
    """(min_lon, min_lat, max_lon, max_lat) for a square of the given half-extent.

    The longitude degree shrinks with cos(latitude); using one delta for both
    axes -- as the Option A proposal does -- yields a box 15% too narrow at
    Ladakh and 6% too wide at Kanyakumari, so the two are computed separately.
    """
    dlat = half_extent_m / 111_320.0
    dlon = half_extent_m / (111_320.0 * max(math.cos(math.radians(lat)), 1e-6))
    return (lon - dlon, lat - dlat, lon + dlon, lat + dlat)


@dataclass
class ViewportPlan:
    project_id: str
    render_mode: str                  # "compound" | "corridor" | "locator_only"
    zoom: int
    frame_px: int
    gsd_m_per_px: float
    bbox: Optional[Tuple[float, float, float, float]]
    centre: Optional[Tuple[float, float]]
    half_extent_m: float
    geocode_tier: str
    geocode_error_radius_m: float
    zoom_limited_by: str              # "geocode" | "sector" | "provider"
    frame_covers_m: float
    error_fits_in_frame: bool
    packages: List[Dict[str, Any]] = field(default_factory=list)
    provider: str = "esri_world_imagery"
    tile_url_template: str = ""
    export_url: str = ""
    caveat: str = ""
    basis: str = ""


def plan_viewport(
    project_id: str,
    sector: Optional[str],
    lat: Optional[float],
    lon: Optional[float],
    geocode_precision: Optional[str] = None,
    is_approximate: bool = False,
    linear_length_km: Optional[float] = None,
    frame_px: int = 1024,
    asset_geometry: Optional[str] = None,
) -> ViewportPlan:
    """The single decision point for how one project is framed.

    Order of precedence, and it matters:
      1. If the coordinate is a state or national centroid, serve NO imagery.
      2. Otherwise the zoom ceiling is min(geocode class, sector need, provider).
      3. The frame is then sized so the geocode error radius fits inside it.

    Sector never overrides geocode. A hospital wants z18 and gets it only if
    its coordinate has earned z18; a GAZETTEER_CITY_MATCH hospital is framed at
    z15 with a note saying why, because the alternative is a crisp photograph
    of the wrong city block presented as that hospital.
    """
    cls = GEOCODE_CLASS.get(str(geocode_precision or ""), _UNKNOWN_CLASS)
    tier = cls["tier"]
    err = float(cls["error_radius_m"])

    # ── 1. unusable coordinates get a locator, not a photograph ──────────
    if not cls.get("serve", False) or lat is None or lon is None:
        return ViewportPlan(
            project_id=str(project_id), render_mode="locator_only",
            zoom=0, frame_px=frame_px, gsd_m_per_px=0.0, bbox=None,
            centre=(lat, lon) if lat is not None and lon is not None else None,
            half_extent_m=0.0, geocode_tier=tier, geocode_error_radius_m=err,
            zoom_limited_by="geocode", frame_covers_m=0.0,
            error_fits_in_frame=False,
            caveat=(
                f"No imagery is served for this project. Its recorded coordinate is a "
                f"{geocode_precision or 'unknown'} — a {'state' if 'STATE' in str(geocode_precision) else 'national'} "
                f"centroid, which locates the administrative unit and not the works. "
                f"Any imagery framed on it would show unrelated ground. A locator map "
                f"of the district is shown instead, and site verification requires a "
                f"surveyed coordinate or a physical inspection."),
            basis="geocode class 'unusable' — imagery withheld by design")

    is_linear = (str(asset_geometry or "").upper() == "LINEAR"
                 or (sector in LINEAR_SECTORS and (linear_length_km or 0) > 5.0))

    # ── 2. corridor: chainage packages, never one frame ──────────────────
    if is_linear:
        length = float(linear_length_km or 0.0)
        half = CORRIDOR_VIEW_HALF_WIDTH_M
        geo_zoom = _geocode_zoom_ceiling(lat, err, frame_px)
        sector_zoom = zoom_for_half_extent(lat, half, frame_px)
        zoom = min(sector_zoom, geo_zoom, MAX_PROVIDER_ZOOM)
        limiter = ("geocode" if geo_zoom <= min(sector_zoom, MAX_PROVIDER_ZOOM)
                   else "sector" if sector_zoom <= MAX_PROVIDER_ZOOM else "provider")
        # The frame must hold the error radius, not just the corridor width.
        half = max(half, err)
        gsd = ground_sample_distance(lat, zoom)
        covers = frame_px * gsd

        packages: List[Dict[str, Any]] = []
        if length > 0:
            n = max(1, math.ceil(length / CORRIDOR_PACKAGE_KM))
            for i in range(n):
                k0 = i * CORRIDOR_PACKAGE_KM
                k1 = min((i + 1) * CORRIDOR_PACKAGE_KM, length)
                packages.append({
                    "package": i + 1,
                    "chainage_km": [round(k0, 1), round(k1, 1)],
                    "label": f"Package {i + 1}: Km {k0:.1f} – {k1:.1f}",
                    # The alignment polyline is not in this corpus, so a
                    # per-package centre cannot be computed. Declared null
                    # rather than interpolated from the midpoint, which would
                    # be a fabricated route.
                    "centre": None,
                    "requires": "alignment polyline (GatiShakti / DPR shapefile)",
                })

        return ViewportPlan(
            project_id=str(project_id), render_mode="corridor",
            zoom=zoom, frame_px=frame_px, gsd_m_per_px=round(gsd, 3),
            bbox=bbox_from_centre(lat, lon, half),
            centre=(lat, lon), half_extent_m=half, geocode_tier=tier,
            geocode_error_radius_m=err, zoom_limited_by=limiter,
            frame_covers_m=round(covers, 1),
            error_fits_in_frame=bool(err <= covers / 2.0),
            packages=packages,
            tile_url_template=_esri_tile_template(),
            export_url=_esri_export_url(bbox_from_centre(lat, lon, half), frame_px),
            caveat=(
                f"Linear asset {('of ' + format(length, '.1f') + ' km ') if length else ''}"
                f"framed at its recorded point, which is a {geocode_precision}. "
                f"One frame covers {covers:.0f} m — about "
                f"{(covers / 1000.0 / max(length, 1e-9) * 100):.1f}% of the route "
                f"where the length is known. Chainage packages are enumerated but "
                f"cannot be positioned: PAIMANA supplies a point and a bbox, never "
                f"an alignment polyline. Per-package imagery requires the surveyed "
                f"alignment from GatiShakti or the DPR shapefile."
                if length else
                f"Linear asset framed at its recorded point. Route length is not "
                f"recorded for this project, so chainage packaging is unavailable."),
            basis=f"corridor strip, +/-{half:.0f} m about the recorded point")

    # ── 3. compound: tight framing, gated on provenance ──────────────────
    want = SECTOR_VIEW_HALF_EXTENT_M.get(sector or "", DEFAULT_VIEW_HALF_EXTENT_M)
    # The frame must hold BOTH the facility and the geocode uncertainty, or the
    # facility can sit outside it. This is the step the sector-offset proposal
    # omits, and it is the whole reason tight zoom is unsafe on this corpus.
    half = max(want, err)
    geo_zoom = _geocode_zoom_ceiling(lat, err, frame_px)
    sector_zoom = zoom_for_half_extent(lat, half, frame_px)
    zoom = min(sector_zoom, geo_zoom, MAX_PROVIDER_ZOOM)

    if geo_zoom < min(sector_zoom, MAX_PROVIDER_ZOOM):
        limiter = "geocode"
    elif sector_zoom < MAX_PROVIDER_ZOOM:
        limiter = "sector"
    else:
        limiter = "provider"

    gsd = ground_sample_distance(lat, zoom)
    covers = frame_px * gsd
    bbox = bbox_from_centre(lat, lon, half)

    caveat = ""
    if limiter == "geocode":
        caveat = (
            f"Framed wider than this facility needs. Its coordinate is a "
            f"{geocode_precision} with an estimated {err:.0f} m error radius, so a "
            f"tighter frame could exclude the site entirely. Zoom is capped at z"
            f"{zoom} ({gsd:.2f} m/px) rather than the z{sector_zoom} the sector "
            f"would otherwise justify — a sharper image of possibly-wrong ground "
            f"is worse than a wider image of certainly-right ground.")
    elif zoom >= 18:
        caveat = (f"At the provider ceiling: z18, {gsd:.2f} m/px. Measured, ESRI "
                  f"World Imagery returns a blank placeholder above z18 outside "
                  f"dense urban areas and a degraded upsample within them.")

    return ViewportPlan(
        project_id=str(project_id), render_mode="compound",
        zoom=zoom, frame_px=frame_px, gsd_m_per_px=round(gsd, 3),
        bbox=bbox, centre=(lat, lon), half_extent_m=round(half, 1),
        geocode_tier=tier, geocode_error_radius_m=err,
        zoom_limited_by=limiter, frame_covers_m=round(covers, 1),
        error_fits_in_frame=bool(err <= covers / 2.0),
        tile_url_template=_esri_tile_template(),
        export_url=_esri_export_url(bbox, frame_px),
        caveat=caveat,
        basis=(f"compound framing: sector wants +/-{want:.0f} m, geocode error is "
               f"{err:.0f} m, frame sized to +/-{half:.0f} m at z{zoom}"))


def _esri_tile_template() -> str:
    return ("https://server.arcgisonline.com/ArcGIS/rest/services/"
            "World_Imagery/MapServer/tile/{z}/{y}/{x}")


def _esri_export_url(bbox: Tuple[float, float, float, float], size_px: int) -> str:
    return ("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/"
            f"MapServer/export?bbox={bbox[0]:.6f},{bbox[1]:.6f},"
            f"{bbox[2]:.6f},{bbox[3]:.6f}&bboxSR=4326&imageSR=3857"
            f"&size={size_px},{size_px}&format=jpg&f=image")


# ══════════════════════════════════════════════════════════════════════════
# PLACEHOLDER DETECTION
# ══════════════════════════════════════════════════════════════════════════

def is_blank_placeholder(raw: bytes, decoded=None) -> Tuple[bool, str]:
    """Is this the provider's 'no imagery at this zoom' tile?

    Mandatory on every fetch. The placeholder decodes to a valid grey raster,
    so nothing downstream fails: co-registration aligns it, change detection
    finds no change, and the project is reported as showing zero construction
    forever. It is the quietest possible failure and the easiest to catch.

    Two independent signatures, because either alone is brittle: the exact byte
    length identifies the artefact as served, and the Laplacian variance
    identifies any re-encoded or resized copy of the same empty raster.
    """
    if raw is not None and len(raw) == PLACEHOLDER_BYTES:
        return True, (f"exact provider placeholder ({PLACEHOLDER_BYTES} bytes) — "
                      f"no imagery exists at this zoom for this location")
    if decoded is not None:
        try:
            import cv2
            import numpy as np
            g = (cv2.cvtColor(decoded, cv2.COLOR_BGR2GRAY)
                 if decoded.ndim == 3 else decoded)
            lap = float(cv2.Laplacian(g, cv2.CV_64F).var())
            if lap < PLACEHOLDER_LAPLACIAN_MAX:
                return True, (f"featureless raster (Laplacian variance {lap:.1f} < "
                              f"{PLACEHOLDER_LAPLACIAN_MAX}) — consistent with a "
                              f"provider placeholder rather than ground")
        except Exception:
            pass
    return False, ""


def fetch_with_zoom_fallback(lat: float, lon: float, zoom: int,
                             fetch_fn, min_zoom: int = MIN_USEFUL_ZOOM
                             ) -> Dict[str, Any]:
    """Walk the zoom down until the provider returns real imagery.

    `fetch_fn(z) -> (raw_bytes, decoded_or_None)`.

    Necessary because coverage is not uniform: measured, the same z19 request
    returns usable imagery over central Delhi and a blank placeholder over
    rural Haryana. A fixed per-sector zoom therefore succeeds in the demo city
    and fails silently across most of the corpus.
    """
    attempts: List[Dict[str, Any]] = []
    for z in range(int(zoom), int(min_zoom) - 1, -1):
        raw, decoded = fetch_fn(z)
        blank, why = is_blank_placeholder(raw, decoded)
        attempts.append({"zoom": z, "bytes": len(raw) if raw else 0,
                         "blank": blank, "reason": why})
        if not blank:
            return {"ok": True, "zoom": z, "raw": raw, "decoded": decoded,
                    "gsd_m_per_px": round(ground_sample_distance(lat, z), 3),
                    "attempts": attempts,
                    "downgraded": z < zoom,
                    "note": (f"Requested z{zoom}; the provider has no imagery above "
                             f"z{z} here, so the frame is {ground_sample_distance(lat, z):.2f} m/px."
                             if z < zoom else "")}
    return {"ok": False, "zoom": None, "raw": None, "decoded": None,
            "attempts": attempts,
            "note": (f"No usable imagery between z{zoom} and z{min_zoom}. The "
                     f"provider returns a placeholder at every level, which means "
                     f"this location is outside its coverage rather than that the "
                     f"site is empty.")}


def plan_digest(plan: ViewportPlan) -> str:
    """Stable identifier for a framing decision, for cache keys and provenance.

    Includes every input that changes the pixels, so a cached tile cannot be
    served for a different framing of the same project -- which is how a
    z15 city-centroid frame ends up captioned as a z18 compound view.
    """
    payload = (f"{plan.project_id}|{plan.render_mode}|{plan.zoom}|{plan.frame_px}|"
               f"{plan.bbox}|{plan.geocode_tier}")
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()[:24]
