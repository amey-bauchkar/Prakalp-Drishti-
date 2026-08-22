"""
Download unmistakable, razor-sharp satellite photos of major Indian Expressways and Toll Plazas.
1. Delhi-Mumbai Expressway (NE-4) Hilalpur / Sohna Mega Toll Plaza: 28.2831°N, 77.0864°E
2. Yamuna Expressway Main Toll Plaza (Greater Noida): 28.3450°N, 77.5380°E
3. Mumbai Trans Harbour Link (Atal Setu Sea Bridge): 18.9860°N, 72.9550°E
4. Samruddhi Mahamarg (Nagpur-Mumbai Expressway Interchange): 20.9120°N, 78.8950°E
"""

import os
import requests

output_dir = "paimana_extracted/satellite_data/verified_highways"
os.makedirs(output_dir, exist_ok=True)
headers = {"User-Agent": "Mozilla/5.0"}

expressways = [
    {
        "id": "NE4_DME_HILALPUR_TOLL",
        "name": "Delhi-Mumbai Expressway (NE-4) Main Hilalpur Toll Plaza",
        "lat": 28.2831, "lon": 77.0864, "d": 0.007
    },
    {
        "id": "YAMUNA_EXPRESSWAY_JEWAR_TOLL",
        "name": "Yamuna Expressway 8-Lane Jewar Toll Plaza",
        "lat": 28.1480, "lon": 77.5520, "d": 0.007
    },
    {
        "id": "MUMBAI_ATAL_SETU_SEA_BRIDGE",
        "name": "Mumbai Trans Harbour Link (Atal Setu) 6-Lane Sea Bridge",
        "lat": 18.9860, "lon": 72.9550, "d": 0.008
    },
    {
        "id": "SAMRUDDHI_MAHAMARG_INTERCHANGE",
        "name": "Samruddhi Mahamarg Expressway Cloverleaf Interchange",
        "lat": 20.9120, "lon": 78.8950, "d": 0.008
    }
]

for exp in expressways:
    lat, lon, d = exp["lat"], exp["lon"], exp["d"]
    url = f"https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox={lon-d},{lat-d},{lon+d},{lat+d}&bboxSR=4326&imageSR=4326&size=1024,1024&f=image&format=jpg"
    r = requests.get(url, headers=headers)
    if r.status_code == 200 and len(r.content) > 5000:
        file_path = f"{output_dir}/{exp['id']}.jpg"
        with open(file_path, "wb") as f:
            f.write(r.content)
        print(f"Downloaded {exp['name']}: {len(r.content):,} bytes")

print("Finished downloading verified highway landmarks!")
