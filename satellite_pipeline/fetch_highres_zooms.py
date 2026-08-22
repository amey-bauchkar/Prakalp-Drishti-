import os
import json
import requests
from io import BytesIO
from PIL import Image
import math
from concurrent.futures import ThreadPoolExecutor, as_completed

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, ".."))
SATELLITE_DIR = os.path.join(PROJECT_ROOT, "paimana_extracted", "satellite_data")
ZOOM_CACHE_DIR = os.path.join(SATELLITE_DIR, "tight_optical_zooms")
os.makedirs(ZOOM_CACHE_DIR, exist_ok=True)

HEADERS = {"User-Agent": "Mozilla/5.0"}
DELTA = 0.007  # approx 700m tight zoom

def deg2num(lat_deg, lon_deg, zoom):
    lat_rad = math.radians(lat_deg)
    n = 2.0 ** zoom
    xtile = int((lon_deg + 180.0) / 360.0 * n)
    ytile = int((1.0 - math.asinh(math.tan(lat_rad)) / math.pi) / 2.0 * n)
    return (xtile, ytile)

def num2quadkey(xtile, ytile, zoom):
    quadkey = ''
    for i in range(zoom, 0, -1):
        digit = 0
        mask = 1 << (i - 1)
        if (xtile & mask) != 0:
            digit += 1
        if (ytile & mask) != 0:
            digit += 2
        quadkey += str(digit)
    return quadkey

def fetch_image_raw(url):
    try:
        r = requests.get(url, headers=HEADERS, timeout=10)
        if r.status_code == 200 and len(r.content) > 3000:
            return r.content
    except:
        pass
    return None

def download_bing_image(lat, lon, zoom, out_path):
    x, y = deg2num(lat, lon, zoom)
    # Download 2x2 grid around x,y
    full_img = Image.new('RGB', (512, 512))
    success = False
    for i in range(2):
        for j in range(2):
            cx, cy = x + j, y + i
            qk = num2quadkey(cx, cy, zoom)
            url = f'http://ecn.t3.tiles.virtualearth.net/tiles/a{qk}.jpeg?g=1'
            content = fetch_image_raw(url)
            if content:
                img = Image.open(BytesIO(content)).convert('RGB')
                full_img.paste(img, (j*256, i*256))
                success = True
    if success:
        full_img.save(out_path, quality=85)
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
        
    min_lon, min_lat = round(lon - DELTA, 4), round(lat - DELTA, 4)
    max_lon, max_lat = round(lon + DELTA, 4), round(lat + DELTA, 4)
    
    # 1. Download T0 High-Res Historical (Bing Maps 17 Zoom)
    if not os.path.exists(out_t0):
        download_bing_image(lat, lon, 16, out_t0)
                
    # 2. Download T1 Current (ArcGIS World Imagery Maxar)
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
        
    print(f"Loaded {len(projects)} projects. Starting HD Historical mass tight-zoom fetch (512x512)...")
    
    # Delete existing blurry Sentinel images to force redownload of HD Bing images
    deleted = 0
    for file in os.listdir(ZOOM_CACHE_DIR):
        if "_T0_BEFORE_ZOOM.jpg" in file:
            os.remove(os.path.join(ZOOM_CACHE_DIR, file))
            deleted += 1
    print(f"Deleted {deleted} blurry T0 images. Fetching HD versions now.")
    
    success_count = 0
    with ThreadPoolExecutor(max_workers=30) as executor:
        future_to_pid = {executor.submit(process_project, p): p for p in projects}
        
        for i, future in enumerate(as_completed(future_to_pid)):
            if future.result():
                success_count += 1
            if (i+1) % 100 == 0:
                print(f"Processed {i+1}/{len(projects)}. Successful pairs: {success_count}")
                
    print(f"\\nDone! Successfully saved HD tight natural zooms for {success_count} projects.")

if __name__ == "__main__":
    main()
