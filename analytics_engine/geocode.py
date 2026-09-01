"""
PRAKALP-DRISHTI: GEOCODE CLASSIFICATION & STATE PROVENANCE

Decides what a coordinate is allowed to claim, and keeps operator-entered geography out
of the statutory NER floor.

THE PRECISION TABLE IS IMPORTED, NOT RESTATED
---------------------------------------------
GEOCODE_CLASS lives in eo_viewport.py and already encodes the decision that a state or
national centroid is `tier: unusable, serve: False` with a 200 km / 800 km error radius.
This module imports it. Restating those numbers here would be a second declaration of
the same fact, and the two would drift -- the defect pattern that made nine of eleven
sector keys match nothing.

THE STATE HAZARD
----------------
state_resolution.is_reported_state() returns True for ANY non-empty string, and gates
the statutory 10% North-Eastern Region capital floor in VITTA-VYUHA. The codebase
already excludes INFERRED states from that constraint on the grounds that a legal
funding floor satisfied on a nearest-populated-place guess would not survive audit.

An operator typing a state into the onboarding form is a third category. Without an
explicit source tag it is indistinguishable from ministry-reported geography, and an
officer could move public capital by typing "Assam". Hence STATE_SOURCES, and hence
`counts_toward_ner_floor()`, which is the single place that question is answered.
"""

from __future__ import annotations

from typing import Any, Dict, Optional, Tuple

from analytics_engine.eo_viewport import GEOCODE_CLASS

# An operator supplying an explicit coordinate is asserting a surveyed position. It is
# treated as such -- and recorded with its source, so the claim is attributable.
OPERATOR_CLASS = "OPERATOR_SUPPLIED_EXACT"
OPERATOR_ERROR_RADIUS_M = 150

# Classes not present in eo_viewport's table because they describe operator input
# rather than a geocoding strategy.
EXTRA_CLASSES: Dict[str, Dict[str, Any]] = {
    OPERATOR_CLASS: {"error_radius_m": OPERATOR_ERROR_RADIUS_M,
                     "tier": "surveyed", "serve": True},
}

MINISTRY_REPORTED = "ministry_reported"
OPERATOR_ENTERED = "operator_entered"
INFERRED = "inferred"

STATE_SOURCES = (MINISTRY_REPORTED, OPERATOR_ENTERED, INFERRED)

# India's bounding box, generously drawn. A coordinate outside it is not a rejection of
# the project, but it is certainly not the site of an Indian central-sector project, and
# accepting it would put a pin in the Indian Ocean with full confidence.
INDIA_BBOX = {"lat_min": 6.0, "lat_max": 37.6, "lon_min": 67.0, "lon_max": 97.5}


def class_info(class_name: str) -> Dict[str, Any]:
    """Precision metadata for a geocode class. Unknown classes are treated as unusable."""
    if class_name in EXTRA_CLASSES:
        return dict(EXTRA_CLASSES[class_name])
    return dict(GEOCODE_CLASS.get(class_name,
                                  {"error_radius_m": 800000, "tier": "unusable",
                                   "serve": False}))


def all_classes() -> Dict[str, Dict[str, Any]]:
    merged = {k: dict(v) for k, v in GEOCODE_CLASS.items()}
    merged.update({k: dict(v) for k, v in EXTRA_CLASSES.items()})
    return merged


def counts_toward_ner_floor(state_source: Optional[str]) -> bool:
    """
    The ONLY place this question is answered.

    Operator-entered and inferred geography are display-only. The statutory floor binds
    on what the ministry itself recorded, and nothing else.
    """
    return state_source == MINISTRY_REPORTED


def validate_coordinate(lat: Any, lon: Any) -> Tuple[bool, Optional[str]]:
    """(ok, error). A coordinate must be complete, numeric, finite and within India."""
    if lat is None and lon is None:
        return True, None
    if (lat is None) != (lon is None):
        return False, ("Latitude and longitude must be supplied together; half a "
                       "coordinate is not a location.")
    try:
        f_lat, f_lon = float(lat), float(lon)
    except (TypeError, ValueError):
        return False, "Latitude and longitude must be numeric."
    if f_lat != f_lat or f_lon != f_lon:                     # NaN
        return False, "Latitude and longitude must be finite."
    if not (-90.0 <= f_lat <= 90.0):
        return False, "Latitude must be between -90 and 90."
    if not (-180.0 <= f_lon <= 180.0):
        return False, "Longitude must be between -180 and 180."
    b = INDIA_BBOX
    if not (b["lat_min"] <= f_lat <= b["lat_max"] and b["lon_min"] <= f_lon <= b["lon_max"]):
        return False, (f"({f_lat}, {f_lon}) is outside India's bounding box. A "
                       "central-sector project site is expected within "
                       f"{b['lat_min']}-{b['lat_max']}N, {b['lon_min']}-{b['lon_max']}E.")
    return True, None


def classify(latitude: Any = None, longitude: Any = None,
             state_name: Any = None,
             state_source: str = OPERATOR_ENTERED) -> Dict[str, Any]:
    """
    Resolve what this input is allowed to claim.

    An explicit, valid coordinate is OPERATOR_SUPPLIED_EXACT and may back an EO frame.
    A state with no coordinate is STATE_CENTROID_MATCH -- 200 km error, `serve` False,
    which is the existing engine's own verdict and is NOT overridden here. That is the
    honest fallback: the map draws the uncertainty, and EO declines to frame it.
    """
    ok, err = validate_coordinate(latitude, longitude)
    if not ok:
        return {"valid": False, "error": err, "geocode_class": None,
                "error_radius_m": None, "serve_imagery": False,
                "state_source": state_source,
                "counts_toward_ner_floor": False}

    if latitude is not None and longitude is not None:
        cls = OPERATOR_CLASS
    elif state_name not in (None, "", "None"):
        cls = "STATE_CENTROID_MATCH"
    else:
        cls = "NATIONAL_CENTROID_MATCH"

    info = class_info(cls)
    return {
        "valid": True,
        "error": None,
        "geocode_class": cls,
        "tier": info["tier"],
        "error_radius_m": info["error_radius_m"],
        "serve_imagery": bool(info["serve"]),
        "latitude": float(latitude) if latitude is not None else None,
        "longitude": float(longitude) if longitude is not None else None,
        "state_name": (str(state_name).strip() or None) if state_name else None,
        "state_source": state_source if state_source in STATE_SOURCES else OPERATOR_ENTERED,
        "counts_toward_ner_floor": counts_toward_ner_floor(state_source),
        "display_note": _display_note(cls, info, state_source),
    }


def _display_note(cls: str, info: Dict[str, Any], state_source: str) -> str:
    if not info["serve"]:
        radius_km = round(info["error_radius_m"] / 1000)
        base = (f"{cls} locates an administrative unit, not a site "
                f"(±{radius_km} km). The map shows this as an uncertainty area, and "
                "satellite verification is withheld.")
    else:
        base = (f"{cls} is site-precise to about ±{info['error_radius_m']} m and can "
                "back a satellite frame.")
    if state_source != MINISTRY_REPORTED:
        base += (" This state is recorded as "
                 f"'{state_source}' and does NOT count toward the statutory 10% NER "
                 "capital floor.")
    return base
