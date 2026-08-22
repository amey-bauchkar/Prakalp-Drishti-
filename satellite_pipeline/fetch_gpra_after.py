import requests

lat, lon, d = 28.5700, 77.1950, 0.007
min_lon, min_lat = lon - d, lat - d
max_lon, max_lat = lon + d, lat + d
url = f"https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox={min_lon},{min_lat},{max_lon},{max_lat}&bboxSR=4326&imageSR=4326&size=1024,1024&f=image&format=jpg"
r = requests.get(url, headers={"User-Agent": "Mozilla/5.0"})
if r.status_code == 200:
    with open("paimana_extracted/satellite_data/tight_optical_zooms/400188_T1_AFTER_ZOOM.jpg", "wb") as f:
        f.write(r.content)
    print("400188_T1_AFTER_ZOOM.jpg saved successfully!")
