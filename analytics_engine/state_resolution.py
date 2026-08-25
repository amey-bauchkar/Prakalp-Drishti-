"""
PRAKALP-DRISHTI: STATE RESOLUTION AND NULL-TEXT HYGIENE

Two small problems that were being solved wrongly in eight different files.

1. `str(row["StateName"])` on a missing pandas value produces the string "nan", and
   that string was reaching the console -- a MoSPI project header rendered as
   "#400301 - Energy Storage - nan". Every serving site did this independently, so
   fixing it in one place required a shared helper.

2. 1,026 of 2,207 projects (46.5%) have no StateName at all, concentrated in whole
   sectors that are 100% blank. `backfill_states_from_geocode.py` recovers 666 of
   them offline by reverse-geocoding the project's existing coordinates against the
   vendored GeoNames India gazetteer, leaving 360 genuinely unknown.

The recovered states are an inference, so this module never lets one masquerade as a
ministry-reported figure: `resolve_state` returns the value together with its source,
and callers surface that source. `is_reported_state` exists specifically so the
statutory NER floor can keep computing on ministry-reported geography only -- a
funding constraint should not be satisfied on the strength of a nearest-town guess.
"""

import json
import os
from typing import Optional, Tuple

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKFILL_PATH = os.path.join(BASE_DIR, "artifacts", "state_backfill.json")

# Values pandas / json / the scraper use to mean "absent". Compared case-folded.
_NULLISH = {"nan", "none", "null", "na", "n/a", "-", "", "nat", "unknown"}

UNKNOWN_STATE = "Not specified"

SOURCE_REPORTED = "PAIMANA_REPORTED"
SOURCE_INFERRED = "INFERRED_FROM_GEOCODE"
SOURCE_UNKNOWN = "UNKNOWN"

_backfill: Optional[dict] = None


def clean_text(value, default: Optional[str] = None) -> Optional[str]:
    """str() a value without letting 'nan' escape into the user interface."""
    if value is None:
        return default
    s = str(value).strip()
    return default if s.lower() in _NULLISH else s


def _load_backfill() -> dict:
    global _backfill
    if _backfill is None:
        try:
            with open(BACKFILL_PATH, encoding="utf-8") as fh:
                _backfill = json.load(fh).get("states", {})
        except Exception:
            # The console must work without the artifact; it just shows fewer states.
            _backfill = {}
    return _backfill


def resolve_state(project_id, reported_state) -> Tuple[str, str]:
    """Return (state_for_display, provenance).

    Ministry-reported geography always wins. A geocode inference is used only where
    the ministry reported nothing, and is always labelled as such.
    """
    reported = clean_text(reported_state)
    if reported:
        return reported, SOURCE_REPORTED

    hit = _load_backfill().get(str(project_id))
    if hit and hit.get("state"):
        return hit["state"], SOURCE_INFERRED

    return UNKNOWN_STATE, SOURCE_UNKNOWN


def is_reported_state(reported_state) -> bool:
    """True only for geography the ministry itself recorded.

    Used by the statutory NER floor. Inferred states are deliberately excluded: a
    10% North-Eastern Region funding floor is a legal constraint, and satisfying it
    on the basis of a nearest-populated-place guess would be indefensible if audited.
    """
    return clean_text(reported_state) is not None


def coverage_summary() -> dict:
    """Reportable counts, so the console can state its own geographic coverage."""
    bf = _load_backfill()
    return {
        "states_inferred_from_geocode": len(bf),
        "inference_method": ("nearest GeoNames populated place within 150 km of the "
                             "project's geocode; national-centroid fallbacks excluded"),
        "artifact": os.path.relpath(BACKFILL_PATH, BASE_DIR).replace("\\", "/"),
    }
