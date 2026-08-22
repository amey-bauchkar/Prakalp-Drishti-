import os
import json
import requests
import math
from io import BytesIO
from PIL import Image
from concurrent.futures import ThreadPoolExecutor, as_completed

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, ".."))
SATELLITE_DIR = os.path.join(PROJECT_ROOT, "paimana_extracted", "satellite_data")
ZOOM_CACHE_DIR = os.path.join(SATELLITE_DIR, "tight_optical_zooms")
os.makedirs(ZOOM_CACHE_DIR, exist_ok=True)

HEADERS = {"User-Agent": "Mozilla/5.0"}
ZOOM_LEVEL = 17
IMG_SIZE = 512

def latlon_to_pixels(lat, lon, zoom):
    lat_rad = math.radians(lat)
    n = 2.0 ** zoom
    px = ((lon + 180.0) / 360.0) * (256 * n)
    py = ((1.0 - math.asinh(math.tan(lat_rad)) / math.pi) / 2.0) * (256 * n)
    return px, py

def get_quadkey(xtile, ytile, zoom):
    quadkey = ""
    for i in range(zoom, 0, -1):
        digit = 0
        mask = 1 << (i - 1)
        if (xtile & mask) != 0: digit += 1
        if (ytile & mask) != 0: digit += 2
        quadkey += str(digit)
    return quadkey

def fetch_tile_raw(url):
    try:
        r = requests.get(url, headers=HEADERS, timeout=10)
        if r.status_code == 200 and len(r.content) > 500:
            return r.content
    except:
        pass
    return None

def fetch_centered_image(lat, lon, zoom, size, provider, out_path):
    px, py = latlon_to_pixels(lat, lon, zoom)
    min_px, min_py = int(px - size/2), int(py - size/2)
    max_px, max_py = min_px + size, min_py + size

    min_tx, min_ty = min_px // 256, min_py // 256
    max_tx, max_ty = max_px // 256, max_py // 256

    canvas = Image.new('RGB', (size, size), color=(10, 20, 30))
    success = False

    for ty in range(min_ty, max_ty + 1):
        for tx in range(min_tx, max_tx + 1):
            if provider == 'bing':
                qk = get_quadkey(tx, ty, zoom)
                url = f"http://ecn.t3.tiles.virtualearth.net/tiles/a{qk}.jpeg?g=1"
            else:
                url = f"https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{zoom}/{ty}/{tx}"
            
            content = fetch_tile_raw(url)
            if content:
                try:
                    img = Image.open(BytesIO(content)).convert('RGB')
                    paste_x = (tx * 256) - min_px
                    paste_y = (ty * 256) - min_py
                    canvas.paste(img, (paste_x, paste_y))
                    success = True
                except:
                    pass

    if success:
        canvas.save(out_path, quality=85)
    return success

def process_project(p):
    pid = str(p.get("project_id", ""))
    if not pid: return False

    out_t0 = os.path.join(ZOOM_CACHE_DIR, f"{pid}_T0_BEFORE_ZOOM.jpg")
    out_t1 = os.path.join(ZOOM_CACHE_DIR, f"{pid}_T1_AFTER_ZOOM.jpg")

    try:
        lat = float(p.get("latitude", 0))
        lon = float(p.get("longitude", 0))
        if lat == 0 or lon == 0: return False
    except:
        return False
        
    s0 = fetch_centered_image(lat, lon, ZOOM_LEVEL, IMG_SIZE, 'bing', out_t0)
    s1 = fetch_centered_image(lat, lon, ZOOM_LEVEL, IMG_SIZE, 'arcgis', out_t1)
    return s0 and s1

def main():
    db_path = os.path.join(SATELLITE_DIR, "ALL_2207_PROJECT_SHOWCASE_DOSSIERS.json")
    with open(db_path, "r", encoding="utf-8") as f:
        projects = json.load(f)
        
    print(f"Loaded {len(projects)} projects. Aligning T0 and T1 perfectly to exact center...")
    
    success_count = 0
    with ThreadPoolExecutor(max_workers=30) as executor:
        future_to_pid = {executor.submit(process_project, p): p for p in projects}
        
        for i, future in enumerate(as_completed(future_to_pid)):
            if future.result():
                success_count += 1
            if (i+1) % 50 == 0:
                print(f"Processed {i+1}/{len(projects)}. Successful aligned pairs: {success_count}")
                
    print(f"\\nDone! Perfect pixel-aligned zooms saved for {success_count} projects.")

if __name__ == "__main__":
    main()
