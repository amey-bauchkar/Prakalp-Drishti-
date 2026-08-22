"""
Test fetching actual satellite photos from NASA GIBS, Sentinel-2 Cloudless, and Maxar/ArcGIS.
"""

import requests
import os

test_dir = "satellite_pipeline/test_downloads"
os.makedirs(test_dir, exist_ok=True)

# Project 1: Bhadla Solar Park, Rajasthan (27.539°N, 71.916°E)
lat, lon = 27.5392, 71.9163
dlat, dlon = 0.08, 0.08
min_lat, max_lat = lat - dlat, lat + dlat
min_lon, max_lon = lon - dlon, lon + dlon

headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}

# 1. Test Sentinel-2 Cloudless (EOX / European Space Agency)
url_s2_2020 = f"https://tiles.maps.eox.at/wms?service=wms&request=getmap&version=1.1.1&layers=s2cloudless-2020&styles=&format=image/jpeg&bbox={min_lon},{min_lat},{max_lon},{max_lat}&width=1024&height=1024&srs=EPSG:4326"
url_s2_2023 = f"https://tiles.maps.eox.at/wms?service=wms&request=getmap&version=1.1.1&layers=s2cloudless-2023&styles=&format=image/jpeg&bbox={min_lon},{min_lat},{max_lon},{max_lat}&width=1024&height=1024&srs=EPSG:4326"

print("Fetching Sentinel-2 Cloudless 2020...")
r1 = requests.get(url_s2_2020, headers=headers, timeout=10)
print(f"Status: {r1.status_code}, Length: {len(r1.content)} bytes")
if r1.status_code == 200:
    with open(f"{test_dir}/bhadla_sentinel2_2020.jpg", "wb") as f:
        f.write(r1.content)

print("Fetching Sentinel-2 Cloudless 2023...")
r2 = requests.get(url_s2_2023, headers=headers, timeout=10)
print(f"Status: {r2.status_code}, Length: {len(r2.content)} bytes")
if r2.status_code == 200:
    with open(f"{test_dir}/bhadla_sentinel2_2023.jpg", "wb") as f:
        f.write(r2.content)

# 2. Test NASA GIBS VIIRS True Color
url_nasa = f"https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS&REQUEST=GetMap&LAYERS=VIIRS_SNPP_CorrectedReflectance_TrueColor&VERSION=1.3.0&FORMAT=image/jpeg&TRANSPARENT=FALSE&WIDTH=1024&HEIGHT=1024&CRS=EPSG:4326&BBOX={min_lat},{min_lon},{max_lat},{max_lon}&TIME=2024-03-15"
print("Fetching NASA GIBS True Color...")
r3 = requests.get(url_nasa, headers=headers, timeout=10)
print(f"Status: {r3.status_code}, Length: {len(r3.content)} bytes")
if r3.status_code == 200:
    with open(f"{test_dir}/bhadla_nasa_gibs.jpg", "wb") as f:
        f.write(r3.content)

# 3. Test High-Res Maxar / World Imagery
url_maxar = f"https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox={min_lon},{min_lat},{max_lon},{max_lat}&bboxSR=4326&imageSR=4326&size=1024,1024&f=image&format=jpg"
print("Fetching High-Res Maxar Satellite...")
r4 = requests.get(url_maxar, headers=headers, timeout=10)
print(f"Status: {r4.status_code}, Length: {len(r4.content)} bytes")
if r4.status_code == 200:
    with open(f"{test_dir}/bhadla_maxar_hires.jpg", "wb") as f:
        f.write(r4.content)
