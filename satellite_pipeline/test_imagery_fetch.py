"""Quick test: fetch before/after for 3 landmark projects to validate the pipeline."""
import os
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.path.insert(0, os.path.dirname(__file__))

from fetch_perfect_imagery import fetch_centered_tile_grid, add_crosshair, add_overlay_annotation

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
TEST_DIR = os.path.join(PROJECT_ROOT, "paimana_extracted", "satellite_data", "imagery_test")
os.makedirs(TEST_DIR, exist_ok=True)

# Test projects with known, visible landmarks
test_cases = [
    {"name": "Atal_Setu_Mumbai", "lat": 18.986, "lon": 72.955, "zoom": 16},
    {"name": "Patna_Airport", "lat": 25.5913, "lon": 85.0880, "zoom": 17},
    {"name": "Delhi_Metro_Phase4", "lat": 28.6139, "lon": 77.2090, "zoom": 17},
]

for tc in test_cases:
    print(f"\nFetching: {tc['name']} ({tc['lat']}, {tc['lon']}) zoom={tc['zoom']}")
    
    # Before (2018)
    before = fetch_centered_tile_grid(tc["lat"], tc["lon"], tc["zoom"], source="before")
    if before:
        before = add_crosshair(before)
        before = add_overlay_annotation(before, f"T0 BEFORE 2018 | {tc['name']}", color=(100,200,255))
        bp = os.path.join(TEST_DIR, f"{tc['name']}_BEFORE.jpg")
        before.save(bp, "JPEG", quality=92)
        print(f"  OK Before saved: {os.path.getsize(bp):,} bytes")
    else:
        print(f"  FAIL Before fetch failed!")
    
    # After (2023)
    after = fetch_centered_tile_grid(tc["lat"], tc["lon"], tc["zoom"], source="after")
    if after:
        after = add_crosshair(after, color=(50, 255, 50))
        after = add_overlay_annotation(after, f"T1 AFTER 2023 | {tc['name']}", color=(100,255,100))
        ap = os.path.join(TEST_DIR, f"{tc['name']}_AFTER.jpg")
        after.save(ap, "JPEG", quality=92)
        print(f"  OK After saved: {os.path.getsize(ap):,} bytes")
    else:
        print(f"  FAIL After fetch failed!")

print(f"\nTest images saved to: {TEST_DIR}")
print("Done!")
