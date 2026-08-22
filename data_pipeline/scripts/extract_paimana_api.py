"""
PAIMANA API Data Extractor - Hits the discovered API endpoints directly
"""
import json, os, csv, time
import urllib.request
import urllib.parse

OUTPUT_DIR = r"c:\Users\SEBIN\Desktop\SIH PS\paimana_data"
os.makedirs(OUTPUT_DIR, exist_ok=True)
BASE = "https://paimana-proj.mospi.gov.in/Home"

def api_get(endpoint, timeout=30):
    url = f"{BASE}/{endpoint}"
    print(f"  GET {url}...", end=" ")
    try:
        req = urllib.request.Request(url)
        resp = urllib.request.urlopen(req, timeout=timeout)
        data = resp.read().decode('utf-8')
        print(f"OK ({len(data)} bytes)")
        return data
    except Exception as e:
        print(f"FAIL: {e}")
        return None

def api_post(endpoint, form_data, timeout=60):
    url = f"{BASE}/{endpoint}"
    encoded = urllib.parse.urlencode(form_data).encode('utf-8')
    print(f"  POST {url} | data={form_data}...", end=" ")
    try:
        req = urllib.request.Request(url, data=encoded, method='POST')
        req.add_header('Content-Type', 'application/x-www-form-urlencoded')
        resp = urllib.request.urlopen(req, timeout=timeout)
        data = resp.read().decode('utf-8')
        print(f"OK ({len(data)} bytes)")
        return data
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8', errors='ignore')
        if 'maxJsonLength' in body:
            print(f"SERVER ERROR: Response too large (maxJsonLength exceeded)")
            return "TOO_LARGE"
        print(f"HTTP {e.code}: {body[:200]}")
        return None
    except Exception as e:
        print(f"FAIL: {e}")
        return None

def save_json(data, filename):
    filepath = os.path.join(OUTPUT_DIR, filename)
    with open(filepath, 'w', encoding='utf-8') as f:
        if isinstance(data, str):
            f.write(data)
        else:
            json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"  Saved: {filepath}")

print("=" * 60)
print("PAIMANA API Data Extractor")
print("=" * 60)

# Step 1: Get freeze dates
print("\n[1] Getting freeze dates...")
freeze_raw = api_get("GetFreezeDates")
if freeze_raw:
    freeze = json.loads(freeze_raw)
    print(f"  Latest data: {freeze['displayFreeze']} (range: {freeze['firstFreeze']} to {freeze['lastFreeze']})")
    save_json(freeze_raw, "freeze_dates.json")
    last_freeze = freeze['lastFreeze']
else:
    last_freeze = "2026-06"

# Step 2: Get sector list
print("\n[2] Getting sector list...")
sectors_raw = api_get("GetSectorList", timeout=60)
if sectors_raw:
    save_json(sectors_raw, "sector_list.json")
    sectors = json.loads(sectors_raw)
    print(f"  Found {len(sectors)} sectors")
else:
    sectors = []

# Step 3: Get state list
print("\n[3] Getting state list...")
states_raw = api_get("GetStateList", timeout=60)
if states_raw:
    save_json(states_raw, "state_list.json")
    states = json.loads(states_raw)
    print(f"  Found {len(states)} states")
else:
    states = []

# Step 4: Get ministry list
print("\n[4] Getting ministry list...")
ministries_raw = api_get("GetMinistryList", timeout=60)
if ministries_raw:
    save_json(ministries_raw, "ministry_list.json")

# Step 5: Try GetTileData (summary) with sector filter to reduce size
print("\n[5] Getting tile data per sector...")
all_tile_data = []
if sectors:
    for sector in sectors:
        sid = sector.get('SectorId') or sector.get('Id') or sector.get('Value') or sector
        sname = sector.get('SectorName') or sector.get('Text') or sector.get('Name') or str(sector)
        form = {'freezeDate': last_freeze, 'SectorId': sid, 'MinistryId': '', 'StateId': ''}
        result = api_post("GetTileData", form, timeout=30)
        if result and result != "TOO_LARGE":
            try:
                parsed = json.loads(result)
                parsed['_sector'] = sname
                all_tile_data.append(parsed)
            except:
                pass
        time.sleep(0.5)  # Be nice to the server
    
    if all_tile_data:
        save_json(all_tile_data, "tile_data_by_sector.json")
        print(f"\n  Got tile data for {len(all_tile_data)} sectors!")
else:
    # Try without sector filter
    form = {'freezeDate': last_freeze, 'SectorId': '', 'MinistryId': '', 'StateId': ''}
    result = api_post("GetTileData", form, timeout=60)
    if result and result != "TOO_LARGE":
        save_json(result, "tile_data_all.json")

# Step 6: Try GetDashboardTileDataforChart per sector
print("\n[6] Getting chart data per sector...")
all_chart_data = []
if sectors:
    for sector in sectors[:5]:  # Try first 5 sectors
        sid = sector.get('SectorId') or sector.get('Id') or sector.get('Value') or sector
        sname = sector.get('SectorName') or sector.get('Text') or sector.get('Name') or str(sector)
        form = {'freezeDate': last_freeze, 'SectorId': sid, 'MinistryId': '', 'StateId': ''}
        result = api_post("GetDashboardTileDataforChart", form, timeout=30)
        if result and result != "TOO_LARGE":
            try:
                parsed = json.loads(result)
                parsed['_sector'] = sname
                all_chart_data.append(parsed)
                print(f"  SUCCESS: Sector '{sname}' - keys: {list(parsed.get('data', {}).keys()) if 'data' in parsed else 'no data key'}")
            except:
                pass
        elif result == "TOO_LARGE":
            print(f"  Sector '{sname}' data too large, trying with state filter...")
        time.sleep(0.5)
    
    if all_chart_data:
        save_json(all_chart_data, "chart_data_by_sector.json")

print("\n" + "=" * 60)
print("EXTRACTION COMPLETE!")
print("=" * 60)
print(f"Files saved in: {OUTPUT_DIR}")
for f in os.listdir(OUTPUT_DIR):
    fpath = os.path.join(OUTPUT_DIR, f)
    size = os.path.getsize(fpath)
    print(f"  {f}: {size:,} bytes")
