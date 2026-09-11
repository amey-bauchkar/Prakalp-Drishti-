"""
PRAKALP-DRISHTI: EO / REPORTED-PROGRESS INDEPENDENCE CHECK

The whole satellite layer rests on one measured fact: pixel-derived surface change
does not track reported physical progress, so no completion percentage may be read
off imagery. That fact used to live only as a literal ("r = 0.007") repeated in
docstrings, prompts and UI copy, with nothing in the repository that reproduced it.
A number nobody can recompute is a claim, not a measurement.

This module computes it from the catalogue the change-detection batch writes
(paimana_extracted/satellite_data/ALL_2207_PROJECTS_SATELLITE_CATALOG.json), persists
the result with the catalogue's hash, and gives every other module one function --
`statement()` -- to cite. Re-run `python -m analytics_engine.eo_independence` after
the catalogue is regenerated; the artifact records which catalogue it was computed on.

What is measured
----------------
Over projects whose EO verdict is reliable (site-level geocode, dual-epoch coverage):

    Pearson r   between surface_change_pct and claimed_progress_pct
    Spearman rho (rank correlation, robust to the heavy right tail of surface change)
    the same split by asset geometry (POINT vs LINEAR)

with two-sided p-values from scipy. r near zero with a large p-value is the finding.
"""

from __future__ import annotations

import hashlib
import json
import os
from datetime import datetime, timezone
from typing import Dict, Optional

import numpy as np

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CATALOG_PATH = os.path.join(BASE_DIR, "paimana_extracted", "satellite_data",
                            "ALL_2207_PROJECTS_SATELLITE_CATALOG.json")
ARTIFACT_PATH = os.path.join(BASE_DIR, "artifacts", "eo_progress_independence.json")

_cache: Optional[dict] = None


def _sha256(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def compute(catalog_path: str = CATALOG_PATH) -> Dict:
    from scipy import stats

    with open(catalog_path, "r", encoding="utf-8") as f:
        catalog = json.load(f)
    reliable = [r for r in catalog if r.get("eo_verdict_reliable")]

    def _pair(rows):
        cf = np.array([r.get("surface_change_pct") for r in rows], dtype=float)
        cl = np.array([r.get("claimed_progress_pct") for r in rows], dtype=float)
        m = np.isfinite(cf) & np.isfinite(cl)
        return cf[m], cl[m]

    def _block(rows):
        cf, cl = _pair(rows)
        n = int(len(cf))
        if n < 3:
            return {"n": n, "pearson_r": None, "pearson_p": None,
                    "spearman_rho": None, "spearman_p": None}
        pr = stats.pearsonr(cf, cl)
        sr = stats.spearmanr(cf, cl)
        return {
            "n": n,
            "pearson_r": round(float(pr[0]), 4),
            "pearson_p": round(float(pr[1]), 4),
            "spearman_rho": round(float(sr[0]), 4),
            "spearman_p": round(float(sr[1]), 4),
        }

    overall = _block(reliable)
    by_geom = {
        g: _block([r for r in reliable if r.get("asset_geometry") == g])
        for g in sorted({str(r.get("asset_geometry")) for r in reliable})
    }
    return {
        "computed_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "catalog_path": os.path.relpath(catalog_path, BASE_DIR),
        "catalog_sha256": _sha256(catalog_path),
        "n_catalog": len(catalog),
        "n_reliable": len(reliable),
        "overall": overall,
        "by_asset_geometry": by_geom,
        "reading": (
            "Pearson r between pixel-derived surface change and agency-reported physical "
            "progress over projects with a reliable EO verdict. A value near zero with a "
            "large p-value means imagery carries no information about the reported "
            "completion fraction; the satellite layer therefore reports activity "
            "evidence, never a completion percentage."),
    }


def write_artifact(catalog_path: str = CATALOG_PATH, out_path: str = ARTIFACT_PATH) -> Dict:
    global _cache
    res = compute(catalog_path)
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(res, f, indent=2)
    _cache = res
    return res


def load() -> Optional[Dict]:
    global _cache
    if _cache is not None:
        return _cache
    if not os.path.exists(ARTIFACT_PATH):
        return None
    try:
        with open(ARTIFACT_PATH, "r", encoding="utf-8") as f:
            _cache = json.load(f)
    except Exception:
        _cache = None
    return _cache


def statement() -> str:
    """One sentence every module cites instead of a hard-coded literal."""
    a = load()
    if not a or not a.get("overall") or a["overall"].get("pearson_r") is None:
        return ("surface change and reported progress are treated as independent "
                "(artifacts/eo_progress_independence.json has not been computed)")
    o = a["overall"]
    return (f"surface change and reported progress correlate at r = {o['pearson_r']:+.3f} "
            f"(Pearson, p = {o['pearson_p']:.2f}; Spearman rho = {o['spearman_rho']:+.3f}) "
            f"across {o['n']:,} site-level projects "
            f"(artifacts/eo_progress_independence.json)")


def pearson_r() -> Optional[float]:
    a = load()
    return None if not a else (a.get("overall") or {}).get("pearson_r")


if __name__ == "__main__":
    res = write_artifact()
    o = res["overall"]
    print(f"n_reliable={res['n_reliable']}  pearson r={o['pearson_r']:+.4f} (p={o['pearson_p']})  "
          f"spearman rho={o['spearman_rho']:+.4f} (p={o['spearman_p']})")
    for g, b in res["by_asset_geometry"].items():
        print(f"  {g:8s} n={b['n']:5d}  r={b['pearson_r']:+.4f}  rho={b['spearman_rho']:+.4f}")
    print(f"wrote {ARTIFACT_PATH}")
    print(statement())
