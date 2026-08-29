"""
PRAKALP-DRISHTI: SATELLITE GROUND-TRUTH FUSION ENGINE (PRATIBIMB)

Serves the precomputed dual-epoch Earth-observation record for a project.

Scope, stated precisely because the previous version overclaimed it: this engine
reports how much of the sampled ground structurally changed between the 2018 and 2023
epochs, and where that ranks against sector peers. It does NOT estimate what fraction
of a project is complete, and it does not assert over-reporting. Surface change and
reported progress correlate at 0.007 across the site-level corpus, so no completion
figure is derivable from the imagery; the earlier one only appeared credible because
45% of its value was copied from the claim it was supposed to audit.

Read-only over the catalog written by
satellite_pipeline/batch_precision_change_detection.py. No CV runs here.
"""

import os
import re
import json
from datetime import datetime
import hashlib
import numpy as np
import pandas as pd
from typing import Dict, Any, Optional

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, "paimana_extracted", "PAIMANA_MASTER_PROJECTS_DATABASE.csv")
CATALOG_PATH = os.path.join(BASE_DIR, "paimana_extracted", "satellite_data", "ALL_2207_PROJECTS_SATELLITE_CATALOG.json")
_SAFE_PID = re.compile(r"[^A-Za-z0-9_-]")
IMAGERY_DIR = os.path.join(BASE_DIR, "paimana_extracted", "satellite_data", "project_imagery")

MASTER_DB_PATH = os.path.join(BASE_DIR, "paimana_extracted",
                              "PAIMANA_MASTER_PROJECTS_DATABASE.json")

_SCHEDULE_INDEX: Optional[Dict[str, float]] = None


def _parse_dmy(value: Any) -> Optional[datetime]:
    if not value:
        return None
    for fmt in ("%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y"):
        try:
            return datetime.strptime(str(value).strip()[:10], fmt)
        except ValueError:
            continue
    return None


def _schedule_index() -> Dict[str, float]:
    """project_id -> sanctioned duration in months, from the master record.

    SanctionDate to OriginalEndDate, which is the duration the sanction actually
    committed to. StartDate is null on all 2,207 rows so it cannot be used, and
    RevisedDate is the slipped date -- measuring pace against a revised target
    would grade every project against the deadline it already missed its way to.
    2,153 of 2,207 rows carry both dates; the remaining 54 get no pace verdict.
    """
    global _SCHEDULE_INDEX
    if _SCHEDULE_INDEX is not None:
        return _SCHEDULE_INDEX
    idx: Dict[str, float] = {}
    try:
        with open(MASTER_DB_PATH, "r", encoding="utf-8") as f:
            payload = json.load(f)
        rows = payload if isinstance(payload, list) else payload.get("projects", [])
        for r in rows:
            pid = str(r.get("ProjectId") or r.get("project_id") or "").strip()
            a, b = _parse_dmy(r.get("SanctionDate")), _parse_dmy(r.get("OriginalEndDate"))
            if pid and a and b and b > a:
                idx[pid] = round((b - a).days / 30.4375, 1)
    except Exception:
        idx = {}
    _SCHEDULE_INDEX = idx
    return idx


def _stage_for(pid, before, after, eo_payload, cat):
    """Civil construction stage, Prithvi-backed where the backbone is present.

    Wrapped in a try so a missing torch install or an absent weights file costs
    the caller the stage field and nothing else -- the rest of the EO audit is
    computed without it. An air-gapped deployment with no model on disk must
    still serve every measured figure.
    """
    try:
        from analytics_engine.stage_classifier import classify_stage
        return classify_stage(
            before, after, eo_payload,
            claimed_progress_pct=float(cat.get("claimed_progress_pct") or 0.0),
            project_id=str(pid),
        )
    except Exception as e:
        return {"available": False,
                "reason": f"Stage classifier unavailable: {type(e).__name__}: {e}"}


def _planned_months(cat: Dict[str, Any]) -> Optional[float]:
    """Sanctioned duration in months for this project, or None.

    Returns None rather than a default when the schedule is unknown:
    pace_against_dpr declines to compute on a missing duration, and a
    fabricated 48-month fallback would have produced a confident pace verdict
    for every project whose schedule is simply not recorded.
    """
    for k in ("planned_duration_months", "sanctioned_duration_months",
              "original_duration_months", "planned_months"):
        v = cat.get(k)
        if v not in (None, "", 0):
            try:
                f = float(v)
                if f > 0:
                    return f
            except (TypeError, ValueError):
                continue
    return _schedule_index().get(str(cat.get("project_id", "")))


class SatelliteFusionEngine:
    def __init__(self):
        self.catalog = {}
        self.df = None
        self.geo = {}
        # Memoises the ~290 ms precision chain per project for this process.
        self._precision_cache = {}
        self._load_data()

    def _load_data(self):
        if os.path.exists(DATA_PATH):
            self.df = pd.read_csv(DATA_PATH)
        
        # Latitude drives ground-sample-distance, which drives the ROI radius in
        # pixels. Without it the mask would be sized off the catalogue's
        # hardcoded resolution_m = 0.8, which is wrong by roughly 3x.
        geo_path = os.path.join(BASE_DIR, "paimana_extracted", "satellite_data",
                                "ALL_2207_PROJECTS_GEOREFERENCED.json")
        if os.path.exists(geo_path):
            try:
                with open(geo_path, "r", encoding="utf-8") as f:
                    rows = json.load(f)
                rows = rows if isinstance(rows, list) else rows.get("projects", [])
                self.geo = {str(r.get("ProjectId")): r for r in rows}
            except Exception:
                self.geo = {}

        if os.path.exists(CATALOG_PATH):
            with open(CATALOG_PATH, "r", encoding="utf-8") as f:
                cat_list = json.load(f)
                for item in cat_list:
                    pid = str(item.get("project_id", ""))
                    self.catalog[pid] = item

    def _precision_metrics(self, pid: str) -> Dict[str, Any]:
        """Run the pinpoint change detector for one project, memoised.

        Computed on demand rather than baked into the catalogue: the chain takes
        ~290 ms per pair, so a full 2,207-project bake is ~11 minutes single-core
        and would go stale the moment the ROI radius or the vegetation thresholds
        were retuned. On demand plus a cache keeps the served figure and the code
        that produces it in step.
        """
        if pid in self._precision_cache:
            return self._precision_cache[pid]

        blank = {
            "project_footprint_change_pct": None,
            "ambient_terrain_change_pct": None,
            "footprint_reliable": False,
            "footprint_caveat": "Imagery pair unavailable for this project.",
            "roi_radius_m": None, "gsd_m_per_px": None,
            "vegetation_excluded_pct": None,
            "roi_shape": None, "corridor_bearing_deg": None, "corridor_coherence": None,
            "row_corridor": None, "radiometry": None, "material_transition": None,
            "construction_velocity": None, "pace_vs_dpr": None,
            "sar_readiness": None, "reconnaissance_targets": None,
            "sovereign_verdict": None, "construction_stage": None,
        }
        try:
            import cv2
            from analytics_engine.satellite_precision_cv import (
                detect_change, ground_sample_distance, zoom_for_sector,
            )
            b = cv2.imread(os.path.join(IMAGERY_DIR, f"{pid}_BEFORE.jpg"))
            a = cv2.imread(os.path.join(IMAGERY_DIR, f"{pid}_AFTER.jpg"))
            if b is None or a is None:
                self._precision_cache[pid] = blank
                return blank

            cat = self.catalog.get(pid, {})
            geo = self.geo.get(pid, {}) if hasattr(self, "geo") else {}
            lat = geo.get("latitude") or cat.get("latitude") or 22.0

            from analytics_engine.eo_geospatial import analyze_project_eo
            eo = analyze_project_eo(
                b, a, latitude=float(lat), sector=cat.get("sector"),
                asset_geometry=cat.get("asset_geometry", "POINT"),
                planned_months=_planned_months(cat),
                physical_progress_pct=cat.get("claimed_progress_pct"),
            )
            co, fp = eo["corridor"], eo["footprint"]
            out = {
                "project_footprint_change_pct": fp["project_footprint_change_pct"],
                "ambient_terrain_change_pct": fp["ambient_terrain_change_pct"],
                "footprint_reliable": fp["reliable"],
                "footprint_caveat": fp["caveat"],
                "roi_radius_m": co["half_width_m"],
                "gsd_m_per_px": eo["gsd_m_per_px"],
                "vegetation_excluded_pct": fp["vegetation_excluded_pct"],
                "roi_shape": co["geometry"],
                "corridor_bearing_deg": co["bearing_deg"],
                "corridor_coherence": co["orientation_coherence"],
                # ── industry-grade EO layer ──────────────────────────────
                "row_corridor": co,
                "radiometry": eo["radiometry"],
                "material_transition": eo["materials"],
                "construction_velocity": eo["velocity"],
                "pace_vs_dpr": eo["pace_vs_dpr"],
                "sar_readiness": eo["sar"],
                # Corridor-contained reconnaissance targets and the traffic-light
                # stamp. These REPLACE the catalogue's change_boxes on the served
                # record: those were top-N blobs over the whole 800px frame with
                # no containment test, so a harvested field scored the same as a
                # bridge pier. Measured on 40 scenes, the containment test rejects
                # 27.7% of clusters an unconstrained detector would have drawn.
                "reconnaissance_targets": eo["targets"],
                "sovereign_verdict": eo["verdict"],
                "construction_stage": _stage_for(pid, b, a, eo, cat),
            }
        except Exception as e:
            out = dict(blank, footprint_caveat=f"Precision CV unavailable: {type(e).__name__}")

        self._precision_cache[pid] = out
        return out

    def get_satellite_audit(self, project_id: str) -> Dict[str, Any]:
        """
        Returns full Earth-Observation audit record for a given project.
        """
        pid = str(project_id)
        cat_entry = self.catalog.get(pid, {})
        
        # Defence in depth: the router sanitises too, but this engine is also
        # reachable from batch scripts that pass ids straight through.
        pid = _SAFE_PID.sub("", str(pid))[:64] or "invalid"
        before_file = os.path.join(IMAGERY_DIR, f"{pid}_BEFORE.jpg")
        after_file = os.path.join(IMAGERY_DIR, f"{pid}_AFTER.jpg")
        
        has_before = os.path.exists(before_file)
        has_after = os.path.exists(after_file)
        
        claimed = float(cat_entry.get("claimed_progress_pct", 50.0))
        
        # There is deliberately no "observed progress %" here. Surface change and
        # reported progress correlate at 0.007 across the site-level corpus, so imagery
        # cannot support a completion figure; the previous one only looked plausible
        # because it was 45%-weighted on the claim it was auditing. The catalog is the
        # single source of truth -- no on-the-fly CV fallback, which used to reintroduce
        # the circular estimate whenever an entry was missing.
        status = cat_entry.get("audit_status", "EO_UNAVAILABLE")
        action = cat_entry.get("statutory_recommendation", "STANDARD_PHYSICAL_INSPECTION")
        severity = cat_entry.get("audit_severity", "LOW")
        surface_change = float(cat_entry.get("surface_change_pct", 0.0))
        dissimilarity = cat_entry.get("mean_dissimilarity", 0.0)

        # Precision-CV provenance fields (written by
        # satellite_pipeline/batch_precision_change_detection.py). These carry the
        # localised change polygons and, critically, whether this project is actually
        # imaged at its own site -- a centroid-geocoded project is looking at the wrong
        # patch of ground, so its EO verdict must not be presented as evidence.
        change_boxes = cat_entry.get("change_boxes", [])
        geocode_precision = cat_entry.get("geocode_precision", "NATIONAL_CENTROID_MATCH")
        geocode_confidence = cat_entry.get("geocode_confidence", "NONE")
        eo_reliable = bool(cat_entry.get("eo_verdict_reliable", False))

        return {
            "project_id": pid,
            "project_name": cat_entry.get("project_name", "Infrastructure Asset"),
            "sector": cat_entry.get("sector", "Roads & Highways"),
            "state": cat_entry.get("state", "National"),
            "agency": cat_entry.get("agency", "Central Agency"),
            "claimed_progress_pct": claimed,
            "audit_status": status,
            "statutory_recommendation": action,
            "audit_severity": severity,
            "structural_dissimilarity": dissimilarity,
            # --- pinpoint precision CV: project vs landscape ------------------
            # surface_change_pct below measures the WHOLE 800px frame, which spans
            # 800-3,700 m of ground and is mostly farmland the sanction never
            # touched. These two separate the asset from its surroundings.
            **self._precision_metrics(pid),
            # --- independent measurement (no claim input anywhere upstream) ---
            "surface_change_pct": surface_change,
            "change_percentile_in_sector": cat_entry.get("change_percentile_in_sector"),
            "asset_geometry": cat_entry.get("asset_geometry", "POINT"),
            "change_boxes": change_boxes,
            "change_box_count": len(change_boxes),
            "mean_dissimilarity": cat_entry.get("mean_dissimilarity", 0.0),
            "registration_shift_px": cat_entry.get("registration_shift_px", 0.0),
            "registration_method": cat_entry.get("registration_method", "none"),
            # --- geolocation trust ---
            "geocode_precision": geocode_precision,
            "geocode_confidence": geocode_confidence,
            "geocode_confidence_note": cat_entry.get("geocode_confidence_note", ""),
            "eo_verdict_reliable": eo_reliable,
            "eo_unreliable_reason": cat_entry.get("eo_unreliable_reason"),
            # "(Sub-meter)" removed: measured GSD is 2.08-2.35 m/px, so the
            # parenthetical overstated the sensor by about 3x on every record
            # this engine has ever served.
            "sensor": ("ESRI ArcGIS World Imagery + Wayback Living Atlas "
                       "(2.08-2.35 m/px measured)"),
            "before_imagery_url": f"/satellite-imagery/{pid}_BEFORE.jpg" if has_before else None,
            "after_imagery_url": f"/satellite-imagery/{pid}_AFTER.jpg" if has_after else None,
            "has_dual_epoch_coverage": has_before and has_after,
            # Was hardcoded to 0.8 m, which is wrong by roughly 3x and made every
            # metre-denominated figure downstream wrong with it. The true value is
            # the Web Mercator ground sample distance at this project's own
            # latitude and zoom, so it is read back from the chain that used it.
            "resolution_m": self._precision_metrics(pid).get("gsd_m_per_px"),
            # Corrected: the fetch pipeline's release ids were wrong, so both
            # of these were. Release 10 is Wayback 2014-02-20, and release 93
            # does not exist -- the after-epoch came from the live basemap via
            # a silent fallback. See EPOCH_BASIS in eo_geospatial.py.
            "baseline_vintage": "2014-02",
            "current_vintage": "<=2026-08 (ESRI live mosaic, fetch-bounded)",
            "audit_hash": hashlib.sha256(
                f"{pid}:{claimed}:{surface_change}:{status}".encode("utf-8")).hexdigest()
        }

_satellite_instance = None

def get_satellite_fusion_engine() -> SatelliteFusionEngine:
    global _satellite_instance
    if _satellite_instance is None:
        _satellite_instance = SatelliteFusionEngine()
    return _satellite_instance

if __name__ == "__main__":
    eng = get_satellite_fusion_engine()
    sample = eng.get_satellite_audit("706724")
    print("Sample Satellite Fusion Audit (Project 706724):", sample)
