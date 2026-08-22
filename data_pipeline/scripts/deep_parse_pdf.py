"""
Deep PDF Parser - Extract Table 6 (All Ongoing Projects) from Flash Report
Table 6 is the master list with all 1,847 projects
"""
import pdfplumber
import csv, os, re, json

PDF_PATH = r"c:\Users\SEBIN\Desktop\SIH PS\paimana_data\FlashReport_June_2026-D21d.pdf"
OUTPUT_DIR = r"c:\Users\SEBIN\Desktop\SIH PS\paimana_extracted"

def analyze_pdf_structure():
    """First pass: understand the PDF structure page by page"""
    print("=" * 70)
    print("  ANALYZING PDF STRUCTURE")
    print("=" * 70)
    
    with pdfplumber.open(PDF_PATH) as pdf:
        print(f"  Total pages: {len(pdf.pages)}")
        
        # Scan all pages for headers/titles
        for i, page in enumerate(pdf.pages):
            text = page.extract_text() or ""
            first_lines = text.split('\n')[:5]
            tables = page.extract_tables()
            n_tables = len(tables)
            table_sizes = [f"{len(t)}x{len(t[0]) if t else 0}" for t in tables if t]
            
            # Only print pages with interesting content
            header = first_lines[0].strip() if first_lines else ""
            if any(kw in header.lower() for kw in ['table', 'annexure', 'ministry', 'sector', 'state', 'ongoing', 'project', 'chapter']):
                print(f"\n  Page {i+1}: {header[:100]}")
                print(f"    Tables: {n_tables} ({', '.join(table_sizes)})")
                if n_tables > 0 and tables[0]:
                    # Show first row of first table
                    first_row = [str(c)[:30] if c else '' for c in tables[0][0]]
                    print(f"    First row: {first_row}")
            
            # Special: look for pages with many rows (project listings)
            if n_tables > 0:
                max_rows = max(len(t) for t in tables if t)
                if max_rows > 15:
                    print(f"\n  Page {i+1}: LARGE TABLE ({max_rows} rows)")
                    print(f"    Header: {header[:80]}")
                    if tables[0] and len(tables[0]) > 1:
                        first_row = [str(c)[:25] if c else '' for c in tables[0][0]]
                        second_row = [str(c)[:25] if c else '' for c in tables[0][1]]
                        print(f"    Row 0: {first_row}")
                        print(f"    Row 1: {second_row}")


def extract_all_project_tables():
    """Extract all tables from PDF and identify project data"""
    print(f"\n{'='*70}")
    print("  EXTRACTING ALL TABLES")
    print(f"{'='*70}")
    
    all_project_rows = []
    current_ministry = ""
    current_sector = ""
    
    with pdfplumber.open(PDF_PATH) as pdf:
        for i, page in enumerate(pdf.pages):
            text = page.extract_text() or ""
            tables = page.extract_tables()
            
            # Detect ministry/sector from page text
            for line in text.split('\n'):
                line_stripped = line.strip()
                if re.match(r'^(Ministry of|Department of|M/o|D/o)\s', line_stripped, re.IGNORECASE):
                    current_ministry = line_stripped
                sector_match = re.match(r'^(Roads|Railways|Coal|Oil|Petroleum|Transmission|Healthcare|Electricity|Water|Education|Urban|Aviation|Steel|Telecom|Energy|Real Estate|Metals|Shipping|Construction|Tourism|Inland|Logistics|Atomic|Renewable|Fertilizers)', line_stripped, re.IGNORECASE)
                if sector_match and len(line_stripped) < 80:
                    current_sector = line_stripped
            
            for table in tables:
                if not table or len(table) < 2:
                    continue
                
                # Check if this looks like a project table
                # Project tables have columns: Sl.No, Project ID, Name, Ministry, State, Dates, Costs, Progress
                first_row = [str(c).strip() if c else '' for c in table[0]]
                joined = ' '.join(first_row).lower()
                
                # Check for project table headers
                is_project_table = any(kw in joined for kw in [
                    'project', 'sl.', 's.no', 'ministry', 'original', 'revised', 
                    'expenditure', 'progress', 'completion', 'cost'
                ])
                
                if is_project_table or len(table[0]) >= 5:
                    for row_idx, row in enumerate(table):
                        cleaned = [str(c).strip() if c else '' for c in row]
                        
                        # Skip header rows
                        if any(kw in ' '.join(cleaned).lower() for kw in ['s.no', 'sl.', 'project name', 'original cost']):
                            continue
                        
                        # Check if row has a 6-digit project ID
                        has_project_id = any(re.match(r'^\d{6}$', c) for c in cleaned)
                        
                        # Or check if it has meaningful data (numbers, names)
                        has_numbers = sum(1 for c in cleaned if re.match(r'^[\d,]+\.?\d*$', c.replace(',',''))) >= 2
                        
                        if has_project_id or (has_numbers and len(cleaned) >= 5):
                            row_data = {
                                'page': i + 1,
                                'ministry': current_ministry,
                                'sector': current_sector,
                                'columns': len(cleaned),
                            }
                            for j, val in enumerate(cleaned):
                                row_data[f'col_{j}'] = val
                            all_project_rows.append(row_data)
            
            if (i + 1) % 20 == 0:
                print(f"  Processed {i+1}/{len(pdf.pages)} pages, {len(all_project_rows)} data rows")
    
    print(f"\n  Total data rows extracted: {len(all_project_rows)}")
    return all_project_rows


def save_raw_tables():
    """Save ALL tables from ALL pages as raw CSV"""
    print(f"\n{'='*70}")
    print("  SAVING RAW TABLE DATA")
    print(f"{'='*70}")
    
    all_rows = []
    page_context = []
    
    with pdfplumber.open(PDF_PATH) as pdf:
        for i, page in enumerate(pdf.pages):
            text = page.extract_text() or ""
            first_line = text.split('\n')[0].strip() if text else ""
            tables = page.extract_tables()
            
            for table in tables:
                if not table:
                    continue
                for row in table:
                    cleaned = [str(c).strip() if c else '' for c in row]
                    if all(c == '' or c == 'None' for c in cleaned):
                        continue
                    all_rows.append([i+1, first_line[:50]] + cleaned)
            
            if (i + 1) % 20 == 0:
                print(f"  Page {i+1}/{len(pdf.pages)}, total rows: {len(all_rows)}")
    
    # Save with max columns
    max_cols = max(len(r) for r in all_rows) if all_rows else 0
    csv_path = os.path.join(OUTPUT_DIR, "ALL_RAW_TABLES_June2026.csv")
    with open(csv_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        header = ['page', 'page_header'] + [f'col_{i}' for i in range(max_cols - 2)]
        writer.writerow(header)
        for row in all_rows:
            # Pad to max columns
            padded = row + [''] * (max_cols - len(row))
            writer.writerow(padded)
    
    print(f"\n  Saved {len(all_rows)} rows to {csv_path}")
    print(f"  Max columns: {max_cols}")
    return all_rows


if __name__ == "__main__":
    # Step 1: Analyze structure
    analyze_pdf_structure()
    
    # Step 2: Save all raw tables
    raw = save_raw_tables()
    
    # Step 3: Extract project-specific data
    projects = extract_all_project_tables()
    
    # Save projects
    if projects:
        proj_csv = os.path.join(OUTPUT_DIR, "ALL_PROJECTS_DEEP_June2026.csv")
        with open(proj_csv, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=projects[0].keys())
            writer.writeheader()
            writer.writerows(projects)
        print(f"\n  Saved projects to {proj_csv}")
    
    # Final summary
    print(f"\n{'='*70}")
    print("  DONE!")
    print(f"{'='*70}")
    for f_name in os.listdir(OUTPUT_DIR):
        if 'June' in f_name or 'ALL' in f_name:
            fpath = os.path.join(OUTPUT_DIR, f_name)
            size_kb = os.path.getsize(fpath) / 1024
            print(f"  {f_name}: {size_kb:.1f} KB")
