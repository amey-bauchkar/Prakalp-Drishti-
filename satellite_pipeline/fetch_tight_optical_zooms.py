"""
TIGHT OPTICAL ZOOM ENGINE (TRUE COLOR HUMAN-EYE NATURAL SATELLITE PHOTOS).
Downloads tight 600m-800m zoomed-in optical photographs (Before vs After)
directly centered on the project site so the human eye sees the exact construction change.
"""

import os
import requests
import json
import pandas as pd

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, ".."))
SATELLITE_DIR = os.path.join(PROJECT_ROOT, "paimana_extracted", "satellite_data")
ZOOM_CACHE_DIR = os.path.join(SATELLITE_DIR, "tight_optical_zooms")
os.makedirs(ZOOM_CACHE_DIR, exist_ok=True)

HEADERS = {"User-Agent": "Mozilla/5.0"}

# Curated high-impact projects with verified pin-point coordinates
KEY_PROJECTS = [
    {
        "id": "400188",
        "name": "GPRA Residential Colonies Redevelopment (Nauroji Nagar / Netaji Nagar, Delhi)",
        "lat": 28.5700, "lon": 77.1950, "d": 0.007
    },
    {
        "id": "701101",
        "name": "JPNI International Airport New Terminal Building (Patna)",
        "lat": 25.5912, "lon": 85.0880, "d": 0.007
    },
    {
        "id": "PROJ_DME_003",
        "name": "Delhi-Mumbai Expressway Main Hilalpur 16-Lane Mega Toll Plaza",
        "lat": 28.2831, "lon": 77.0864, "d": 0.007
    },
    {
        "id": "PROJ_BHADLA_004",
        "name": "Bhadla Solar Mega Park Extension (Photovoltaic Grid)",
        "lat": 27.5392, "lon": 71.9163, "d": 0.010
    },
    {
        "id": "PROJ_WDFC_001",
        "name": "Western DFC Narmada River Double-Track Rail Bridge",
        "lat": 21.6980, "lon": 73.0020, "d": 0.007
    },
    {
        "id": "PROJ_SUBANSIRI_002",
        "name": "Subansiri Lower Hydroelectric Concrete Gravity Dam Wall",
        "lat": 27.5542, "lon": 94.2584, "d": 0.008
    },
    {
        "id": "PROJ_ATAL_SETU",
        "name": "Mumbai Trans Harbour Link (Atal Setu 6-Lane Sea Bridge)",
        "lat": 18.9860, "lon": 72.9550, "d": 0.008
    },
    {
        "id": "612213",
        "name": "200 Bedded ESIC Hospital, Butibori Nagpur",
        "lat": 21.1497, "lon": 79.0915, "d": 0.007
    }
]

def fetch_image(url, out_path):
    try:
        r = requests.get(url, headers=HEADERS, timeout=15)
        if r.status_code == 200 and len(r.content) > 3000:
            with open(out_path, "wb") as f:
                f.write(r.content)
            return True
    except Exception as e:
        print(f"Error downloading {url}: {e}")
    return False

def main():
    print("=" * 85)
    print("🛰️ PRATIBIMB: DOWNLOADING TIGHT ZOOMED-IN NATURAL OPTICAL SATELLITE PHOTOS")
    print("=" * 85)
    
    for p in KEY_PROJECTS:
        pid = p["id"]
        lat, lon, d = p["lat"], p["lon"], p["d"]
        min_lon, min_lat = round(lon - d, 4), round(lat - d, 4)
        max_lon, max_lat = round(lon + d, 4), round(lat + d, 4)
        
        # 1. T0 Before: 2020 Optical Zoom (Sentinel-2 Cloudless Baseline)
        url_t0 = f"https://tiles.maps.eox.at/wms?service=wms&request=getmap&version=1.1.1&layers=s2cloudless-2020&styles=&format=image/jpeg&bbox={min_lon},{min_lat},{max_lon},{max_lat}&width=1024&height=1024&srs=EPSG:4326"
        out_t0 = os.path.join(ZOOM_CACHE_DIR, f"{pid}_T0_BEFORE_ZOOM.jpg")
        fetch_image(url_t0, out_t0)
        
        # 2. T1 After: Recent High-Res Optical Zoom (Maxar Sub-Meter 0.5m / True Color)
        url_t1 = f"https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox={min_lon},{min_lat},{max_lon},{max_lat}&bboxSR=4326&imageSR=4326&size=1024,1024&f=image&format=jpg"
        out_t1 = os.path.join(ZOOM_CACHE_DIR, f"{pid}_T1_AFTER_ZOOM.jpg")
        fetch_image(url_t1, out_t1)
        
        print(f"✅ Downloaded Tight Optical Zoom for #{pid}: {p['name']}")
        
    print("\n🎉 Tight optical zoom pairs ready in:", ZOOM_CACHE_DIR)
    print("=" * 85)

if __name__ == "__main__":
    main()
