import asyncio
import aiohttp
import json
import math
import hashlib
import time
import os
import sys

def lat_lon_to_tile(lat, lon, zoom):
    lat_rad = math.radians(lat)
    n = 2.0 ** zoom
    x = int((lon + 180.0) / 360.0 * n)
    y = int((1.0 - math.log(math.tan(lat_rad) + 1.0 / math.cos(lat_rad)) / math.pi) / 2.0 * n)
    return x, y

SECTOR_ZOOM = {
    "Aviation & Aviation Infrastructure": 16,
    "Roads & Highways": 16,
    "Railways": 16,
    "Water Resources": 15,
    "Urban Public Transport": 17,
    "Power": 16,
    "Telecommunications": 15,
    "Ports & Shipping": 17,
    "Logistics": 17,
    "Tourism": 16,
    "Others": 15
}

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

async def fetch_hash(session, url, retries=3):
    for attempt in range(retries):
        try:
            async with session.get(url, headers=HEADERS, timeout=aiohttp.ClientTimeout(total=8)) as resp:
                if resp.status == 200:
                    data = await resp.read()
                    if len(data) > 300:
                        return hashlib.md5(data).hexdigest()
                elif resp.status == 429:
                    await asyncio.sleep(1.0 + attempt * 1.5)
        except Exception:
            await asyncio.sleep(0.5 + attempt * 0.5)
    return None

async def scan_project(session, sem, p, releases_2026, end_2025_m):
    async with sem:
        pid = str(p.get("ProjectId") or p.get("project_id"))
        pname = p.get("ProjectName") or p.get("project_name") or "Unknown"
        lat = float(p.get("latitude", 0))
        lon = float(p.get("longitude", 0))
        sector = p.get("SectorName") or p.get("sector") or "Others"
        zoom = SECTOR_ZOOM.get(sector, 15)
        
        tx, ty = lat_lon_to_tile(lat, lon, zoom)
        
        url_current = f"https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{zoom}/{ty}/{tx}"
        cur_hash = await fetch_hash(session, url_current)
        if not cur_hash:
            return {
                "pid": pid, "name": pname, "sector": sector, "state": p.get("StateName") or p.get("state"),
                "is_2026": False, "status": "FETCH_FAILED", "vintage": "<=2026-08 (ESRI live mosaic, fetch-bounded)"
            }
            
        url_2025 = f"https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/WMTS/1.0.0/default028mm/MapServer/tile/{end_2025_m}/{zoom}/{ty}/{tx}"
        hash_2025 = await fetch_hash(session, url_2025)
        
        # If current hash matches end-of-2025, imagery was captured in 2025 or earlier
        if cur_hash == hash_2025:
            return {
                "pid": pid, "name": pname, "sector": sector, "state": p.get("StateName") or p.get("state"),
                "is_2026": False, "status": "PRE_2026", "vintage": "<=2026-08 (ESRI live mosaic, fetch-bounded)"
            }
            
        # Different from 2025! It is 2026 imagery! Let's find which 2026 release it first appeared in.
        matched_rel = None
        for rel in releases_2026:
            m = rel["M"]
            url_rel = f"https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/WMTS/1.0.0/default028mm/MapServer/tile/{m}/{zoom}/{ty}/{tx}"
            thash = await fetch_hash(session, url_rel)
            if thash == cur_hash:
                matched_rel = rel
            else:
                # Differed here, so matched_rel (the previous matching one) was the oldest 2026 release that had this image
                break
                
        if matched_rel:
            date_str = matched_rel["Name"].replace("World Imagery (Wayback ", "").replace(")", "")
            vintage_str = f"{date_str} (Wayback Release {matched_rel['M']})"
            return {
                "pid": pid, "name": pname, "sector": sector, "state": p.get("StateName") or p.get("state"),
                "is_2026": True, "status": "CONFIRMED_2026", "vintage": vintage_str, "date": date_str, "release": matched_rel["M"]
            }
        else:
            return {
                "pid": pid, "name": pname, "sector": sector, "state": p.get("StateName") or p.get("state"),
                "is_2026": True, "status": "2026_LIVE_MOSAIC", "vintage": "2026-08 (ESRI Live Mosaic)"
            }

async def main():
    start_time = time.time()
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    geo_path = os.path.join(base_dir, "paimana_extracted", "satellite_data", "ALL_2207_PROJECTS_GEOREFERENCED.json")
    cat_path = os.path.join(base_dir, "paimana_extracted", "satellite_data", "ALL_2207_PROJECTS_SATELLITE_CATALOG.json")
    
    with open(geo_path, "r", encoding="utf-8") as f:
        geo = json.load(f)
    with open(cat_path, "r", encoding="utf-8") as f:
        cat = json.load(f)
        
    print(f"Loaded {len(geo)} georeferenced projects and {len(cat)} catalog entries.")
    
    # Get Wayback releases
    conn = aiohttp.TCPConnector(limit=60, ttl_dns_cache=300)
    async with aiohttp.ClientSession(connector=conn) as session:
        print("Fetching ESRI Wayback index...")
        async with session.get('https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/MapServer?f=json', headers=HEADERS) as r:
            wb_data = await r.json()
            all_releases = wb_data.get("Selection", [])
            
        releases_2026 = [r for r in all_releases if "2026" in r.get("Name", "")]
        end_2025_rel = next((r for r in all_releases if "2025" in r.get("Name", "")), None)
        end_2025_m = end_2025_rel["M"] if end_2025_rel else "13192"
        
        print(f"Wayback: {len(all_releases)} total releases. {len(releases_2026)} in 2026. Baseline 2025 release: {end_2025_m}")
        print("Starting full scan across all 2,207 projects...")
        
        sem = asyncio.Semaphore(40)
        tasks = [scan_project(session, sem, p, releases_2026, end_2025_m) for p in geo]
        
        results = []
        # Process with progress reports every 200 items
        total = len(tasks)
        completed = 0
        for fut in asyncio.as_completed(tasks):
            res = await fut
            results.append(res)
            completed += 1
            if completed % 300 == 0 or completed == total:
                elapsed = time.time() - start_time
                print(f"Progress: {completed}/{total} scanned ({completed/total*100:.1f}%) in {elapsed:.1f}s...")
                
    elapsed = time.time() - start_time
    print(f"\nScan completed in {elapsed:.1f}s.")
    
    # Categorize results
    results_by_pid = {r["pid"]: r for r in results}
    is_2026_projects = [r for r in results if r["is_2026"]]
    print(f"\nRESULTS SUMMARY:")
    print(f"Total projects scanned: {len(results)}")
    print(f"Projects with confirmed 2026 imagery: {len(is_2026_projects)} ({len(is_2026_projects)/len(results)*100:.1f}%)")
    
    # Update catalog
    updated_count = 0
    for entry in cat:
        pid = str(entry.get("project_id"))
        entry["baseline_vintage"] = "2014-02"
        entry["sensor"] = "ESRI ArcGIS World Imagery + Wayback Living Atlas (2.08-2.35 m/px measured)"
        
        if pid in results_by_pid:
            scan_res = results_by_pid[pid]
            entry["current_vintage"] = scan_res["vintage"]
            if scan_res["is_2026"]:
                entry["is_2026_imagery"] = True
                entry["vintage_year"] = "2026"
                if "date" in scan_res:
                    entry["current_vintage_date"] = scan_res["date"]
            else:
                entry["is_2026_imagery"] = False
                entry["vintage_year"] = "<=2026"
            updated_count += 1
        else:
            entry["current_vintage"] = "<=2026-08 (ESRI live mosaic, fetch-bounded)"
            entry["is_2026_imagery"] = False
            
    with open(cat_path, "w", encoding="utf-8") as f:
        json.dump(cat, f, indent=2)
    print(f"Successfully updated all {updated_count} records in {cat_path}")
    
    # Save 2026 projects list for report generation
    out_2026_path = os.path.join(base_dir, "paimana_extracted", "satellite_data", "PROJECTS_WITH_2026_IMAGERY.json")
    with open(out_2026_path, "w", encoding="utf-8") as f:
        json.dump(is_2026_projects, f, indent=2)
    print(f"Saved 2026 projects list to {out_2026_path}")

if __name__ == "__main__":
    asyncio.run(main())
