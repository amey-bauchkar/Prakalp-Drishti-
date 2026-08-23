"""
Post-processing: Update ALL_2207_PROJECTS_SATELLITE_CATALOG.json with high-res imagery paths.
Run this after fetch_perfect_imagery.py completes.
"""
import os
import sys
import io
import json

if sys.stdout and hasattr(sys.stdout, 'buffer'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
CATALOG_PATH = os.path.join(PROJECT_ROOT, "paimana_extracted", "satellite_data", "ALL_2207_PROJECTS_SATELLITE_CATALOG.json")
DOSSIER_PATH = os.path.join(PROJECT_ROOT, "paimana_extracted", "satellite_data", "ALL_2207_PROJECT_SHOWCASE_DOSSIERS.json")
IMAGERY_DIR = os.path.join(PROJECT_ROOT, "paimana_extracted", "satellite_data", "project_imagery")

def main():
    print("=" * 80)
    print("Updating Satellite Catalog with High-Res Imagery Paths")
    print("=" * 80)
    
    # Count available images
    if os.path.exists(IMAGERY_DIR):
        all_files = os.listdir(IMAGERY_DIR)
        before_files = [f for f in all_files if f.endswith("_BEFORE.jpg")]
        after_files = [f for f in all_files if f.endswith("_AFTER.jpg")]
        print(f"Found {len(before_files)} BEFORE images and {len(after_files)} AFTER images")
    else:
        print("ERROR: project_imagery directory not found!")
        return
    
    # Build a set of available project IDs
    available_pids = set()
    for f in before_files:
        pid = f.replace("_BEFORE.jpg", "")
        if f"{pid}_AFTER.jpg" in after_files:
            available_pids.add(pid)
    
    print(f"Projects with both before+after: {len(available_pids)}")
    
    # Update Satellite Catalog
    if os.path.exists(CATALOG_PATH):
        with open(CATALOG_PATH, "r", encoding="utf-8") as f:
            catalog = json.load(f)
        
        updated = 0
        for entry in catalog:
            pid = str(entry.get("project_id", ""))
            if pid in available_pids:
                entry["tile_baseline_2020"] = f"paimana_extracted/satellite_data/project_imagery/{pid}_BEFORE.jpg"
                entry["tile_current_2023"] = f"paimana_extracted/satellite_data/project_imagery/{pid}_AFTER.jpg"
                entry["satellite_sensor"] = "ESRI ArcGIS World Imagery + Wayback Living Atlas (Sub-meter Resolution)"
                updated += 1
        
        with open(CATALOG_PATH, "w", encoding="utf-8") as f:
            json.dump(catalog, f, indent=2, ensure_ascii=False)
        
        print(f"Updated {updated}/{len(catalog)} entries in SATELLITE_CATALOG.json")
    
    # Update Showcase Dossiers
    if os.path.exists(DOSSIER_PATH):
        with open(DOSSIER_PATH, "r", encoding="utf-8") as f:
            dossiers = json.load(f)
        
        updated_d = 0
        for entry in dossiers:
            dpid = str(entry.get("project_id", ""))
            # Try exact match first
            if dpid in available_pids:
                entry["tile_baseline_2020"] = f"paimana_extracted/satellite_data/project_imagery/{dpid}_BEFORE.jpg"
                entry["tile_current_2023"] = f"paimana_extracted/satellite_data/project_imagery/{dpid}_AFTER.jpg"
                updated_d += 1
            else:
                # Try numeric extraction from dossier project_id
                for apid in available_pids:
                    if apid in dpid or dpid in apid:
                        entry["tile_baseline_2020"] = f"paimana_extracted/satellite_data/project_imagery/{apid}_BEFORE.jpg"
                        entry["tile_current_2023"] = f"paimana_extracted/satellite_data/project_imagery/{apid}_AFTER.jpg"
                        updated_d += 1
                        break
        
        with open(DOSSIER_PATH, "w", encoding="utf-8") as f:
            json.dump(dossiers, f, indent=2, ensure_ascii=False)
        
        print(f"Updated {updated_d}/{len(dossiers)} entries in SHOWCASE_DOSSIERS.json")
    
    print("\nDone! All satellite catalog files updated with high-res imagery paths.")

if __name__ == "__main__":
    main()
