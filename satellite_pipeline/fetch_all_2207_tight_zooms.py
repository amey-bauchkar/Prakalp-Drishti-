import os
import json
import requests
from io import BytesIO
from PIL import Image, ImageFilter
from concurrent.futures import ThreadPoolExecutor, as_completed

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, ".."))
SATELLITE_DIR = os.path.join(PROJECT_ROOT, "paimana_extracted", "satellite_data")
ZOOM_CACHE_DIR = os.path.join(SATELLITE_DIR, "tight_optical_zooms")
os.makedirs(ZOOM_CACHE_DIR, exist_ok=True)

HEADERS = {"User-Agent": "Mozilla/5.0"}
DELTA = 0.007  # approx 700m tight zoom

def fetch_image_raw(url):
    try:
        r = requests.get(url, headers=HEADERS, timeout=10)
        if r.status_code == 200 and len(r.content) > 3000:
            return r.content
    except Exception:
        pass
    return None

def process_project(p):
    pid = str(p.get("project_id", ""))
    if not pid: return False
    
    out_t0 = os.path.join(ZOOM_CACHE_DIR, f"{pid}_T0_BEFORE_ZOOM.jpg")
    out_t1 = os.path.join(ZOOM_CACHE_DIR, f"{pid}_T1_AFTER_ZOOM.jpg")
    
    if os.path.exists(out_t0) and os.path.exists(out_t1):
        return True  # Already downloaded

    try:
        lat = float(p.get("latitude", 0))
        lon = float(p.get("longitude", 0))
        if lat == 0 or lon == 0: return False
    except:
        return False
        
    min_lon, min_lat = round(lon - DELTA, 4), round(lat - DELTA, 4)
    max_lon, max_lat = round(lon + DELTA, 4), round(lat + DELTA, 4)
    
    # Download T0 and smooth it immediately
    if not os.path.exists(out_t0):
        url_t0 = f"https://tiles.maps.eox.at/wms?service=wms&request=getmap&version=1.1.1&layers=s2cloudless-2020&styles=&format=image/jpeg&bbox={min_lon},{min_lat},{max_lon},{max_lat}&width=512&height=512&srs=EPSG:4326"
        content_t0 = fetch_image_raw(url_t0)
        if content_t0:
            try:
                img_t0 = Image.open(BytesIO(content_t0)).convert("RGB")
                img_t0 = img_t0.resize((512, 512), Image.LANCZOS)
                img_t0 = img_t0.filter(ImageFilter.UnsharpMask(radius=2, percent=150, threshold=3))
                img_t0.save(out_t0, quality=85)
            except:
                pass
                
    # Download T1
    if not os.path.exists(out_t1):
        url_t1 = f"https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox={min_lon},{min_lat},{max_lon},{max_lat}&bboxSR=4326&imageSR=4326&size=512,512&f=image&format=jpg"
        content_t1 = fetch_image_raw(url_t1)
        if content_t1:
            with open(out_t1, "wb") as f:
                f.write(content_t1)
                
    return os.path.exists(out_t0) and os.path.exists(out_t1)

def main():
    db_path = os.path.join(SATELLITE_DIR, "ALL_2207_PROJECT_SHOWCASE_DOSSIERS.json")
    with open(db_path, "r", encoding="utf-8") as f:
        projects = json.load(f)
        
    print(f"Loaded {len(projects)} projects. Starting mass tight-zoom fetch (512x512)...")
    
    success_count = 0
    with ThreadPoolExecutor(max_workers=20) as executor:
        future_to_pid = {executor.submit(process_project, p): p for p in projects}
        
        for i, future in enumerate(as_completed(future_to_pid)):
            if future.result():
                success_count += 1
            if (i+1) % 100 == 0:
                print(f"Processed {i+1}/{len(projects)}. Successful pairs: {success_count}")
                
    print(f"\nDone! Successfully saved tight natural zooms for {success_count} projects.")

if __name__ == "__main__":
    main()
