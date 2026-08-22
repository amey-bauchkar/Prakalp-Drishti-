"""
Fetch the exact Delhi-Mumbai Expressway 8-lane carriageway and mega toll plaza / interchange.
Exact Coordinates:
1. Dausa Interchange & Main 8-Lane Trunk: 26.8720°N, 76.3580°E
2. Sohna Mega Toll Plaza: 28.2435°N, 77.0620°E
"""

import os
import requests

output_dir = "paimana_extracted/satellite_data/resolution_comparison"
headers = {"User-Agent": "Mozilla/5.0"}

# 1. Exact Delhi-Mumbai Expressway Dausa 8-Lane Interchange
lat1, lon1 = 26.8720, 76.3580
d1 = 0.008 # ~800m ultra-zoom
url1 = f"https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox={lon1-d1},{lat1-d1},{lon1+d1},{lat1+d1}&bboxSR=4326&imageSR=4326&size=1024,1024&f=image&format=jpg"
r1 = requests.get(url1, headers=headers)
if r1.status_code == 200:
    with open(f"{output_dir}/DME_EXACT_8LANE_TRUNK_INTERCHANGE.jpg", "wb") as f:
        f.write(r1.content)

# 2. Exact Sohna Mega 8-Lane Toll Plaza (16 Toll Lanes)
lat2, lon2 = 28.2435, 77.0620
d2 = 0.008
url2 = f"https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox={lon2-d2},{lat2-d2},{lon2+d2},{lat2+d2}&bboxSR=4326&imageSR=4326&size=1024,1024&f=image&format=jpg"
r2 = requests.get(url2, headers=headers)
if r2.status_code == 200:
    with open(f"{output_dir}/DME_EXACT_SOHNA_MEGA_TOLL_PLAZA.jpg", "wb") as f:
        f.write(r2.content)

print("Exact expressway trunk & toll plaza downloaded!")
