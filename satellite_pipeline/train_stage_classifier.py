"""
Bake Prithvi embeddings for the corpus, derive distant-supervision stage
labels from the measured EO chain, and fit the classification head.

Run:  python satellite_pipeline/train_stage_classifier.py [--limit N]

Two artifacts are written to analytics_engine/models/:
  * prithvi_embeddings.npz  -- project_id -> 768-d vector, and the derived label
  * stage_head.json         -- the fitted head plus the validation that
                               justifies (or refuses to justify) using it

Why the embeddings are baked rather than computed on request: a Prithvi forward
pass over a dual-epoch 224x224 pair is ~380 ms on CPU. Serving that per API call
would make the satellite endpoint the slowest thing in the platform. Baked, the
served path is a 5x768 matmul -- microseconds -- which is what makes the
sub-3 ms inference target real rather than aspirational. The cost is that a
change to the ROI geometry or the band handling invalidates the cache, so the
artifact records the settings it was built under.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import cv2  # noqa: E402

from analytics_engine import eo_geospatial as eo  # noqa: E402
from analytics_engine import stage_classifier as sc  # noqa: E402
from analytics_engine.satellite_precision_cv import (  # noqa: E402
    CORRIDOR_MIN_COHERENCE, dominant_orientation, ground_sample_distance,
    zoom_for_sector,
)

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG = os.path.join(BASE, "paimana_extracted", "satellite_data", "project_imagery")
CATALOG = os.path.join(BASE, "paimana_extracted", "satellite_data",
                       "ALL_2207_PROJECTS_SATELLITE_CATALOG.json")
GEO = os.path.join(BASE, "paimana_extracted", "satellite_data",
                   "ALL_2207_PROJECTS_GEOREFERENCED.json")
EMB_PATH = os.path.join(sc.MODEL_DIR, "prithvi_embeddings.npz")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--seed", type=int, default=0)
    args = ap.parse_args()

    if sc.get_encoder() is None:
        print("FATAL: Prithvi backbone unavailable —", sc.encoder_status().get("reason"))
        return 2

    with open(CATALOG, "r", encoding="utf-8") as f:
        catalog = {str(r["project_id"]): r for r in json.load(f)}
    with open(GEO, "r", encoding="utf-8") as f:
        g = json.load(f)
    geo = {str(r.get("project_id") or r.get("ProjectId")): r
           for r in (g if isinstance(g, list) else [])}

    pids = sorted(p for p in catalog
                  if os.path.exists(os.path.join(IMG, f"{p}_BEFORE.jpg"))
                  and os.path.exists(os.path.join(IMG, f"{p}_AFTER.jpg")))
    if args.limit:
        pids = pids[:args.limit]
    print(f"dual-epoch projects: {len(pids)}")

    ids, vecs, labels, bases = [], [], [], []
    t0 = time.time()
    for i, pid in enumerate(pids, 1):
        try:
            c = catalog.get(pid, {})
            gg = geo.get(pid, {})
            b = cv2.imread(os.path.join(IMG, f"{pid}_BEFORE.jpg"))
            a = cv2.imread(os.path.join(IMG, f"{pid}_AFTER.jpg"))
            if b is None or a is None:
                continue
            if b.shape != a.shape:
                a = cv2.resize(a, (b.shape[1], b.shape[0]))

            lat = float(gg.get("latitude") or c.get("latitude") or 22.0)
            sector = c.get("sector")
            geom = c.get("asset_geometry", "POINT")
            gsd = ground_sample_distance(lat, zoom_for_sector(sector))
            bearing, coh = dominant_orientation(cv2.cvtColor(b, cv2.COLOR_BGR2GRAY))
            use_bearing = (bearing if str(geom).upper() == "LINEAR"
                           and coh >= CORRIDOR_MIN_COHERENCE else None)
            corridor = eo.build_row_corridor(b.shape, gsd, sector, geom, use_bearing)

            payload = eo.analyze_project_eo(
                b, a, latitude=lat, sector=sector, asset_geometry=geom,
                physical_progress_pct=c.get("claimed_progress_pct"))
            phase, basis = sc.derive_stage_label(
                payload, float(c.get("claimed_progress_pct") or 0.0))

            v = sc.embed(b, a, corridor.mask)
            if v is None:
                continue
            ids.append(pid); vecs.append(v); labels.append(phase); bases.append(basis)
        except Exception as e:
            print(f"  skip {pid}: {type(e).__name__}: {e}")
        if i % 25 == 0 or i == len(pids):
            el = time.time() - t0
            print(f"  {i}/{len(pids)}  {el:.0f}s elapsed  "
                  f"{el / max(i, 1):.2f}s/project  eta {(len(pids) - i) * el / max(i, 1) / 60:.1f} min",
                  flush=True)

    if len(ids) < 40:
        print(f"FATAL: only {len(ids)} usable projects; refusing to fit a head.")
        return 3

    X = np.vstack(vecs).astype(np.float32)
    os.makedirs(sc.MODEL_DIR, exist_ok=True)
    np.savez_compressed(
        EMB_PATH, ids=np.array(ids), X=X, y=np.array(labels),
        basis=np.array(bases),
        settings=json.dumps({
            "backbone": sc.BACKBONE_ID, "frames": sc.NUM_FRAMES,
            "bands_supplied": [sc.PRITHVI_BANDS[i] for i in sc.AVAILABLE_BAND_INDICES],
            "img_size": sc.IMG_SIZE, "roi": "row_corridor|site_envelope bbox crop",
        }))
    print(f"\nembeddings -> {EMB_PATH}  ({X.shape[0]} x {X.shape[1]})")

    dist = {c: int((np.array(labels) == c).sum()) for c in sorted(set(labels))}
    print("label distribution (distant supervision, NOT ground truth):")
    for k, v in sorted(dist.items(), key=lambda kv: -kv[1]):
        print(f"  {v:5d}  {k}")

    head = sc.train_stage_head(X, labels, seed=args.seed)
    with open(sc.HEAD_ARTIFACT, "w", encoding="utf-8") as f:
        json.dump(head.to_json(), f)
    print(f"\nhead -> {sc.HEAD_ARTIFACT}")

    v = head.validation
    print("\n" + "=" * 72)
    print("VALIDATION")
    print("=" * 72)
    print(f"  cv accuracy            {v['cv_accuracy']:.4f}   folds {v['cv_fold_scores']}")
    print(f"  majority baseline      {v['majority_class_baseline']:.4f}")
    print(f"  permutation null mean  {v['permutation_null_mean']:.4f}")
    print(f"  permutation null p95   {v['permutation_null_p95']:.4f}")
    print(f"  beats majority         {v['beats_majority_baseline']}")
    print(f"  beats permutation      {v['beats_permutation_null']}")
    print(f"\n  {v['verdict']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
