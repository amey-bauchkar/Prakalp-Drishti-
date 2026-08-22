"""
BATCH SATELLITE CHANGE DETECTION HEATMAP GENERATOR FOR ALL 2,207 PROJECTS.
Computes pixel-level multi-spectral radiometric difference (|T1 - T0|)
and renders glowing neon Red/Yellow change heatmaps for all 376 spatial grid cells across India.
"""

import os
import glob
import json
import numpy as np
import pandas as pd
from PIL import Image
import matplotlib
matplotlib.use('Agg')
import matplotlib.cm as cm

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, ".."))
SATELLITE_DIR = os.path.join(PROJECT_ROOT, "paimana_extracted", "satellite_data")
TILE_DIR = os.path.join(SATELLITE_DIR, "tile_cache")
JSON_PATH = os.path.join(SATELLITE_DIR, "ALL_2207_PROJECT_SHOWCASE_DOSSIERS.json")
CSV_PATH = os.path.join(SATELLITE_DIR, "ALL_2207_PROJECT_SHOWCASE_DOSSIERS.csv")

def generate_heatmap(t0_path, t1_path, out_path):
    try:
        t0 = np.array(Image.open(t0_path).convert("RGB"), dtype=np.float32)
        t1 = np.array(Image.open(t1_path).convert("RGB"), dtype=np.float32)
        
        # Ensure identical dimensions
        if t0.shape != t1.shape:
            t0 = np.array(Image.fromarray(t0.astype(np.uint8)).resize((t1.shape[1], t1.shape[0])), dtype=np.float32)
            
        # Absolute spectral radiometric shift
        diff = np.mean(np.abs(t1 - t0), axis=2)
        
        # Contrast stretch & threshold
        p5, p95 = np.percentile(diff, 10), np.percentile(diff, 95)
        diff_norm = (diff - p5) / (p95 - p5 + 1e-5)
        diff_norm = np.clip(diff_norm, 0, 1)
        
        # Apply glowing Turbo / Jet colormap (Blue -> Cyan -> Yellow -> Intense Red)
        heatmap_rgb = cm.turbo(diff_norm)[:, :, :3] * 255.0
        
        # Alpha blend 55% heatmap over 45% true color
        alpha = 0.55
        blended = (1.0 - alpha) * t1 + alpha * heatmap_rgb
        blended = np.clip(blended, 0, 255).astype(np.uint8)
        
        # Save compressed JPEG
        img_out = Image.fromarray(blended)
        img_out.save(out_path, "JPEG", quality=88)
        return True
    except Exception as e:
        print(f"Error processing {t0_path}: {e}")
        return False

def main():
    print("=" * 85)
    print("🛰️ PRATIBIMB: BATCH MULTI-SPECTRAL CHANGE HEATMAP GENERATION ENGINE")
    print("=" * 85)
    
    t0_files = glob.glob(os.path.join(TILE_DIR, "s2_2020_grid_*.jpg"))
    print(f"Found {len(t0_files)} spatial grid cell pairs in cache.")
    
    processed = 0
    for t0_path in t0_files:
        filename = os.path.basename(t0_path)
        grid_id = filename.replace("s2_2020_grid_", "").replace(".jpg", "")
        t1_path = os.path.join(TILE_DIR, f"s2_2023_grid_{grid_id}.jpg")
        heatmap_path = os.path.join(TILE_DIR, f"heatmap_grid_{grid_id}.jpg")
        
        if os.path.exists(t1_path):
            if generate_heatmap(t0_path, t1_path, heatmap_path):
                processed += 1
                
        if processed % 50 == 0 or processed == len(t0_files):
            pct = (processed / len(t0_files)) * 100.0
            print(f"   [Heatmap Synthesis] {processed}/{len(t0_files)} grid cells converted to glowing change maps ({pct:.1f}%)")
            
    print(f"\n✅ All {processed} spatial grid cells now have glowing change detection heatmaps!")
    
    # Update JSON and CSV dossiers
    print("📝 Updating master 2,207 project showcase dossiers with heatmap paths...")
    with open(JSON_PATH, "r", encoding="utf-8") as f:
        dossiers = json.load(f)
        
    for p in dossiers:
        grid_cell = p["grid_cell"]
        p["tile_heatmap"] = f"paimana_extracted/satellite_data/tile_cache/heatmap_grid_{grid_cell}.jpg"
        
    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(dossiers, f, indent=2)
        
    pd.DataFrame(dossiers).to_csv(CSV_PATH, index=False)
    print("🎉 Dossiers updated with Heatmap imagery!")
    print("=" * 85)

if __name__ == "__main__":
    main()
