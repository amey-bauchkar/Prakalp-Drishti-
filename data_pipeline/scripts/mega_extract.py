"""
PAIMANA MEGA DATA EXTRACTOR
===========================
1. Extract ALL project-level data from Flash Report PDFs
2. Hit APIs with long timeouts + sector filtering
3. Save everything as clean CSVs

Author: SIH 2026 Team
"""
import pdfplumber
import json, csv, os, re, time
import urllib.request, urllib.parse, urllib.error

BASE_DIR = r"c:\Users\SEBIN\Desktop\SIH PS\paimana_data"
OUTPUT_DIR = r"c:\Users\SEBIN\Desktop\SIH PS\paimana_extracted"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ============================================================
# PART 1: EXTRACT DATA FROM FLASH REPORT PDFs
# ============================================================

def extract_tables_from_pdf(pdf_path):
    """Extract all tables from a Flash Report PDF"""
    print(f"\n  Processing: {os.path.basename(pdf_path)}")
    all_rows = []
    headers = None
    
    with pdfplumber.open(pdf_path) as pdf:
        print(f"    Pages: {len(pdf.pages)}")
        
        for i, page in enumerate(pdf.pages):
            tables = page.extract_tables()
            for table in tables:
                if not table:
                    continue
                for row in table:
                    # Clean cells
                    cleaned = [str(cell).strip() if cell else "" for cell in row]
                    
                    # Skip empty rows
                    if all(c == "" or c == "None" for c in cleaned):
                        continue
                    
                    # Detect header rows (contain known column names)
                    header_keywords = ["Sl.", "Project", "Ministry", "State", "Original", "Revised", 
                                       "Expenditure", "Physical", "Progress", "Sector", "Cost"]
                    is_header = any(kw.lower() in " ".join(cleaned).lower() for kw in header_keywords)
                    
                    if is_header and not headers:
                        headers = cleaned
                        continue
                    elif is_header:
                        continue  # Skip duplicate headers
                    
                    all_rows.append(cleaned)
            
            if (i + 1) % 50 == 0:
                print(f"    ... processed {i+1}/{len(pdf.pages)} pages, {len(all_rows)} rows so far")
    
    print(f"    Total rows extracted: {len(all_rows)}")
    return headers, all_rows


def extract_text_blocks_from_pdf(pdf_path):
    """Extract text blocks to find project details in non-table format"""
    print(f"\n  Text extraction: {os.path.basename(pdf_path)}")
    all_text = []
    
    with pdfplumber.open(pdf_path) as pdf:
        for i, page in enumerate(pdf.pages):
            text = page.extract_text()
            if text:
                all_text.append(text)
            if (i + 1) % 50 == 0:
                print(f"    ... {i+1}/{len(pdf.pages)} pages")
    
    return "\n\n=== PAGE BREAK ===\n\n".join(all_text)


def parse_project_data_from_text(full_text):
    """Parse project records from text format"""
    projects = []
    
    # Pattern: Look for "Sl. No." followed by project details
    # Flash reports typically have sections like:
    # Sector > Ministry > Project entries in tabular format
    
    current_sector = ""
    current_ministry = ""
    
    lines = full_text.split("\n")
    for i, line in enumerate(lines):
        # Detect sector headers
        sector_match = re.match(r'^(?:\d+\.)?\s*(Roads|Railways|Coal|Oil|Transmission|Healthcare|Electricity|Water|Education|Urban|Aviation|Steel|Telecom|Energy|Real Estate|Metals|Shipping|Construction|Tourism|Inland|Logistics)', line, re.IGNORECASE)
        if sector_match:
            current_sector = line.strip()
        
        # Detect ministry headers
        if "Ministry of" in line or "Department of" in line:
            current_ministry = line.strip()
    
    return projects


def main_pdf_extraction():
    """Main PDF extraction pipeline"""
    print("=" * 70)
    print("PART 1: FLASH REPORT PDF EXTRACTION")
    print("=" * 70)
    
    pdf_files = sorted([f for f in os.listdir(BASE_DIR) if f.endswith('.pdf')])
    print(f"\nFound {len(pdf_files)} PDF files")
    
    all_data = {}
    
    for pdf_file in pdf_files:
        pdf_path = os.path.join(BASE_DIR, pdf_file)
        month = pdf_file.replace("FlashReport_", "").replace(".pdf", "").split("-")[0]
        
        # Extract tables
        headers, rows = extract_tables_from_pdf(pdf_path)
        all_data[month] = {"headers": headers, "rows": rows}
        
        # Save individual month CSV
        csv_path = os.path.join(OUTPUT_DIR, f"projects_{month}.csv")
        with open(csv_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            if headers:
                writer.writerow(headers)
            for row in rows:
                writer.writerow(row)
        print(f"    Saved: {csv_path} ({len(rows)} rows)")
        
        # Also save full text for reference
        full_text = extract_text_blocks_from_pdf(pdf_path)
        txt_path = os.path.join(OUTPUT_DIR, f"text_{month}.txt")
        with open(txt_path, "w", encoding="utf-8") as f:
            f.write(full_text)
        print(f"    Saved: {txt_path} ({len(full_text)} chars)")
    
    # Summary
    print(f"\n{'='*70}")
    print("PDF EXTRACTION SUMMARY")
    print(f"{'='*70}")
    total_rows = 0
    for month, data in all_data.items():
        n = len(data["rows"])
        total_rows += n
        h = data["headers"]
        print(f"  {month}: {n} rows | Headers: {h[:5] if h else 'None'}...")
    print(f"\n  TOTAL: {total_rows} data rows across {len(pdf_files)} months")
    
    return all_data


# ============================================================
# PART 2: API DATA EXTRACTION (with long timeouts)
# ============================================================

def api_call(endpoint, method="GET", form_data=None, timeout=180):
    """Make API call with very long timeout"""
    url = f"https://paimana-proj.mospi.gov.in/Home/{endpoint}"
    
    try:
        if method == "POST" and form_data:
            encoded = urllib.parse.urlencode(form_data).encode('utf-8')
            req = urllib.request.Request(url, data=encoded, method='POST')
            req.add_header('Content-Type', 'application/x-www-form-urlencoded')
        else:
            req = urllib.request.Request(url)
        
        req.add_header('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)')
        resp = urllib.request.urlopen(req, timeout=timeout)
        data = resp.read().decode('utf-8')
        return data
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8', errors='ignore')
        if 'maxJsonLength' in body:
            return "TOO_LARGE"
        return None
    except Exception as e:
        print(f"    Error: {e}")
        return None


def main_api_extraction():
    """Main API extraction pipeline"""
    print(f"\n{'='*70}")
    print("PART 2: API DATA EXTRACTION (180s timeout)")
    print(f"{'='*70}")
    
    # Step 1: GetFreezeDates (this always works fast)
    print("\n[API-1] GetFreezeDates...")
    freeze = api_call("GetFreezeDates", timeout=30)
    if freeze:
        freeze_data = json.loads(freeze)
        last_freeze = freeze_data['lastFreeze']
        print(f"  ✓ Latest: {freeze_data['displayFreeze']} | Range: {freeze_data['firstFreeze']} to {last_freeze}")
        with open(os.path.join(OUTPUT_DIR, "api_freeze_dates.json"), "w") as f:
            f.write(freeze)
    else:
        last_freeze = "2026-06"
        print("  ✗ Failed, using default 2026-06")
    
    # Step 2: GetSectorList (try with 180s timeout)
    print("\n[API-2] GetSectorList (180s timeout)...")
    sectors_raw = api_call("GetSectorList", timeout=180)
    sectors = []
    if sectors_raw and sectors_raw != "TOO_LARGE":
        try:
            sectors = json.loads(sectors_raw)
            print(f"  ✓ Got {len(sectors)} sectors!")
            with open(os.path.join(OUTPUT_DIR, "api_sector_list.json"), "w", encoding="utf-8") as f:
                f.write(sectors_raw)
            # Print sector details
            for s in sectors:
                print(f"    - {s}")
        except:
            print(f"  ✓ Got raw data ({len(sectors_raw)} bytes), saving...")
            with open(os.path.join(OUTPUT_DIR, "api_sector_list_raw.txt"), "w", encoding="utf-8") as f:
                f.write(sectors_raw)
    else:
        print("  ✗ Timeout/Failed")
    
    # Step 3: GetStateList
    print("\n[API-3] GetStateList (180s timeout)...")
    states_raw = api_call("GetStateList", timeout=180)
    states = []
    if states_raw and states_raw != "TOO_LARGE":
        try:
            states = json.loads(states_raw)
            print(f"  ✓ Got {len(states)} states!")
            with open(os.path.join(OUTPUT_DIR, "api_state_list.json"), "w", encoding="utf-8") as f:
                f.write(states_raw)
        except:
            print(f"  ✓ Got raw data ({len(states_raw)} bytes)")
            with open(os.path.join(OUTPUT_DIR, "api_state_list_raw.txt"), "w", encoding="utf-8") as f:
                f.write(states_raw)
    else:
        print("  ✗ Timeout/Failed")
    
    # Step 4: GetMinistryList
    print("\n[API-4] GetMinistryList (180s timeout)...")
    ministries_raw = api_call("GetMinistryList", timeout=180)
    if ministries_raw and ministries_raw != "TOO_LARGE":
        try:
            ministries = json.loads(ministries_raw)
            print(f"  ✓ Got {len(ministries)} ministries!")
            with open(os.path.join(OUTPUT_DIR, "api_ministry_list.json"), "w", encoding="utf-8") as f:
                f.write(ministries_raw)
        except:
            with open(os.path.join(OUTPUT_DIR, "api_ministry_list_raw.txt"), "w", encoding="utf-8") as f:
                f.write(ministries_raw)
    else:
        print("  ✗ Timeout/Failed")
    
    # Step 5: Try GetTileData with sector filters
    if sectors:
        print(f"\n[API-5] GetTileData per sector ({len(sectors)} sectors)...")
        tile_results = []
        for s in sectors:
            sid = s.get('SectorId') or s.get('Id') or s.get('Value') or s
            sname = s.get('SectorName') or s.get('Text') or s.get('Name') or str(s)
            print(f"  Sector: {sname} (ID={sid})...", end=" ")
            
            form = {'freezeDate': last_freeze, 'SectorId': str(sid), 'MinistryId': '', 'StateId': ''}
            result = api_call("GetTileData", method="POST", form_data=form, timeout=60)
            
            if result and result != "TOO_LARGE":
                try:
                    parsed = json.loads(result)
                    parsed['_sector_id'] = sid
                    parsed['_sector_name'] = sname
                    tile_results.append(parsed)
                    print(f"✓ ({len(result)} bytes)")
                except:
                    print(f"✓ raw ({len(result)} bytes)")
            elif result == "TOO_LARGE":
                print("⚠ TOO LARGE")
            else:
                print("✗ Failed")
            time.sleep(1)
        
        if tile_results:
            with open(os.path.join(OUTPUT_DIR, "api_tile_data_by_sector.json"), "w", encoding="utf-8") as f:
                json.dump(tile_results, f, indent=2, ensure_ascii=False)
            print(f"\n  Saved tile data for {len(tile_results)} sectors")
    
    # Step 6: Try GetDashboardTileDataforChart with sector filters
    if sectors:
        print(f"\n[API-6] GetDashboardTileDataforChart per sector...")
        chart_results = []
        for s in sectors:
            sid = s.get('SectorId') or s.get('Id') or s.get('Value') or s
            sname = s.get('SectorName') or s.get('Text') or s.get('Name') or str(s)
            print(f"  Sector: {sname}...", end=" ")
            
            form = {'freezeDate': last_freeze, 'SectorId': str(sid), 'MinistryId': '', 'StateId': ''}
            result = api_call("GetDashboardTileDataforChart", method="POST", form_data=form, timeout=60)
            
            if result and result != "TOO_LARGE":
                try:
                    parsed = json.loads(result)
                    parsed['_sector_id'] = sid
                    parsed['_sector_name'] = sname
                    chart_results.append(parsed)
                    # Show what data keys we got
                    if 'data' in parsed:
                        keys = list(parsed['data'].keys())
                        print(f"✓ keys: {keys}")
                    else:
                        print(f"✓ ({len(result)} bytes)")
                except:
                    print(f"✓ raw ({len(result)} bytes)")
            elif result == "TOO_LARGE":
                print("⚠ TOO LARGE")
            else:
                print("✗ Failed")
            time.sleep(1)
        
        if chart_results:
            with open(os.path.join(OUTPUT_DIR, "api_chart_data_by_sector.json"), "w", encoding="utf-8") as f:
                json.dump(chart_results, f, indent=2, ensure_ascii=False)
            print(f"\n  Saved chart data for {len(chart_results)} sectors")
    
    # Step 7: Try historical data - loop through all freeze months
    print(f"\n[API-7] Historical freeze dates (monthly data)...")
    historical_tiles = []
    months = ["2025-07","2025-08","2025-09","2025-10","2025-11","2025-12",
              "2026-01","2026-02","2026-03","2026-04","2026-05","2026-06"]
    
    for month in months:
        form = {'freezeDate': month, 'SectorId': '', 'MinistryId': '', 'StateId': ''}
        result = api_call("GetTileData", method="POST", form_data=form, timeout=60)
        if result and result != "TOO_LARGE":
            try:
                parsed = json.loads(result)
                parsed['_month'] = month
                historical_tiles.append(parsed)
                print(f"  {month}: ✓")
            except:
                print(f"  {month}: ✓ (raw)")
        elif result == "TOO_LARGE":
            print(f"  {month}: ⚠ TOO LARGE (has data!)")
        else:
            print(f"  {month}: ✗")
        time.sleep(0.5)
    
    if historical_tiles:
        with open(os.path.join(OUTPUT_DIR, "api_historical_tiles.json"), "w", encoding="utf-8") as f:
            json.dump(historical_tiles, f, indent=2, ensure_ascii=False)
        print(f"\n  Saved historical data for {len(historical_tiles)} months")


# ============================================================
# MAIN
# ============================================================

if __name__ == "__main__":
    print("=" * 70)
    print("  PAIMANA MEGA DATA EXTRACTOR")
    print("  Extracting ALL data from PDFs + APIs")
    print("=" * 70)
    
    start = time.time()
    
    # Part 1: PDF extraction
    pdf_data = main_pdf_extraction()
    
    # Part 2: API extraction
    main_api_extraction()
    
    elapsed = time.time() - start
    
    print(f"\n{'='*70}")
    print(f"  ALL DONE! Total time: {elapsed:.0f} seconds ({elapsed/60:.1f} minutes)")
    print(f"{'='*70}")
    print(f"\n  Output directory: {OUTPUT_DIR}")
    print(f"\n  Files created:")
    for f in sorted(os.listdir(OUTPUT_DIR)):
        fpath = os.path.join(OUTPUT_DIR, f)
        size = os.path.getsize(fpath)
        if size > 1024*1024:
            print(f"    {f}: {size/1024/1024:.2f} MB")
        elif size > 1024:
            print(f"    {f}: {size/1024:.1f} KB")
        else:
            print(f"    {f}: {size} bytes")
