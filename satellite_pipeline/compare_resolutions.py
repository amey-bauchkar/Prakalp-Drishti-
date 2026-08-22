"""
Demonstration of High-Resolution Sub-Meter Optical Satellite Imagery (0.5m/pixel)
vs Wide-Area Multi-Spectral Sentinel-2 (10m-40m/pixel).
"""

import os
import requests

output_dir = "paimana_extracted/satellite_data/resolution_comparison"
os.makedirs(output_dir, exist_ok=True)

# 1. Patna Airport / WDFC Railway / Bhadla Solar
projects = [
    {"name": "Patna_JPNI_Airport", "lat": 25.5941, "lon": 85.1376},
    {"name": "Delhi_Mumbai_Expressway", "lat": 26.9124, "lon": 76.5781},
    {"name": "WDFC_Bharuch_Bridge", "lat": 21.7051, "lon": 73.0032},
    {"name": "Bhadla_Solar_Park", "lat": 27.5392, "lon": 71.9163}
]

headers = {"User-Agent": "Mozilla/5.0"}

for p in projects:
    lat, lon = p["lat"], p["lon"]
    
    # A. Wide Area Sentinel-2 (10m-40m/pixel - Great for spectral indices, blurry for micro-zoom)
    d_wide = 0.08
    url_s2 = f"https://tiles.maps.eox.at/wms?service=wms&request=getmap&version=1.1.1&layers=s2cloudless-2023&styles=&format=image/jpeg&bbox={lon-d_wide},{lat-d_wide},{lon+d_wide},{lat+d_wide}&width=1024&height=1024&srs=EPSG:4326"
    r_s2 = requests.get(url_s2, headers=headers)
    if r_s2.status_code == 200:
        with open(f"{output_dir}/{p['name']}_1_WIDE_SENTINEL2_10M.jpg", "wb") as f:
            f.write(r_s2.content)
            
    # B. Ultra Sharp Maxar High-Res Sub-Meter (0.5m/pixel - Razor sharp runway, roads, buildings)
    d_tight = 0.012 # ~1.3 km tight box centered on the construction site
    url_maxar = f"https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox={lon-d_tight},{lat-d_tight},{lon+d_tight},{lat+d_tight}&bboxSR=4326&imageSR=4326&size=1024,1024&f=image&format=jpg"
    r_maxar = requests.get(url_maxar, headers=headers)
    if r_maxar.status_code == 200:
        with open(f"{output_dir}/{p['name']}_2_HIGH_RES_MAXAR_SUBMETER.jpg", "wb") as f:
            f.write(r_maxar.content)
            
print("Comparison downloaded in:", output_dir)
