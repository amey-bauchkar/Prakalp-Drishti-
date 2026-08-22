"""
PAIMANA Project-Level Data Parser
Parses the extracted text files from Flash Reports to get clean project records
"""
import re, csv, os, json

INPUT_DIR = r"c:\Users\SEBIN\Desktop\SIH PS\paimana_extracted"
OUTPUT_DIR = r"c:\Users\SEBIN\Desktop\SIH PS\paimana_extracted"

def parse_projects_from_text(text_file):
    """Parse project entries from Flash Report text"""
    with open(text_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    lines = content.split('\n')
    projects = []
    current_section = ""
    current_sector = ""
    current_ministry = ""
    
    # Track what section we're in
    section_patterns = {
        'top50_cost': r'Top 50 Projects.*Original Cost',
        'top50_revised': r'Top 50 Projects.*Revised Cost',
        'top50_expenditure': r'Top 50 Projects.*Expenditure',
        'sector_wise': r'Sector[- ]wise',
        'state_wise': r'State[- ]wise',
        'time_overrun': r'Time Overrun|Delay',
        'cost_overrun': r'Cost Overrun',
        'physical_progress': r'Physical Progress',
        'project_list': r'List of Projects|Project Details',
    }
    
    # Sector detection
    sector_names = [
        "Roads & Highways", "Railways", "Urban Public Transport", "Aviation",
        "Shipping", "Logistics", "Inland Waterways", "Oil & Gas",
        "Transmission & Distribution", "Electricity Generation", "Energy Storage",
        "Water Resources", "Waste & Water", "Telecommunication", "Healthcare",
        "Education", "Coal", "Steel", "Metals & Mining", "Real Estate",
        "Construction", "Tourism"
    ]
    
    # Ministry detection
    ministry_pattern = re.compile(r'^(Ministry of|Department of|M/o|D/o)\s+(.+)', re.IGNORECASE)
    
    for i, line in enumerate(lines):
        stripped = line.strip()
        
        # Detect sections
        for sec_name, sec_pattern in section_patterns.items():
            if re.search(sec_pattern, stripped, re.IGNORECASE):
                current_section = sec_name
                break
        
        # Detect sectors
        for sec in sector_names:
            if sec.lower() in stripped.lower() and len(stripped) < 100:
                current_sector = sec
                break
        
        # Detect ministries
        ministry_match = ministry_pattern.match(stripped)
        if ministry_match:
            current_ministry = stripped
        
        # Parse project lines: SL_NO PROJECT_ID PROJECT_NAME COST1 COST2 COST3 PROGRESS
        # Pattern: number(1-5 digits) space 6-digit-ID space PROJECT_NAME space numbers...
        project_match = re.match(
            r'^(\d{1,4})\s+(\d{5,7})\s+(.+?)(?:\s+([\d,]+(?:\.\d+)?)\s+([\d,]+(?:\.\d+)?)?\s*([\d,]+(?:\.\d+)?)\s+([\d.]+))?$',
            stripped
        )
        
        if project_match:
            sl_no = project_match.group(1)
            project_id = project_match.group(2)
            project_name = project_match.group(3).strip()
            original_cost = project_match.group(4) or ""
            revised_cost = project_match.group(5) or ""
            expenditure = project_match.group(6) or ""
            progress = project_match.group(7) or ""
            
            # Clean up - sometimes name has numbers at end that are costs
            # Look for pattern: NAME numbers numbers numbers number
            name_cost_match = re.match(
                r'^(.+?)\s+([\d,]+(?:\.\d+)?)\s+([\d,]+(?:\.\d+)?)?\s*([\d,]+(?:\.\d+)?)\s+([\d.]+)\s*$',
                project_name
            )
            if name_cost_match and not original_cost:
                project_name = name_cost_match.group(1).strip()
                original_cost = name_cost_match.group(2)
                revised_cost = name_cost_match.group(3) or ""
                expenditure = name_cost_match.group(4)
                progress = name_cost_match.group(5)
            
            projects.append({
                'sl_no': sl_no,
                'project_id': project_id,
                'project_name': project_name,
                'original_cost_cr': original_cost.replace(',', ''),
                'revised_cost_cr': revised_cost.replace(',', ''),
                'expenditure_cr': expenditure.replace(',', ''),
                'physical_progress_pct': progress,
                'sector': current_sector,
                'ministry': current_ministry,
                'section': current_section,
            })
        else:
            # Try simpler pattern: just ID and name on same line
            simple_match = re.match(r'^(\d{1,4})\s+(\d{6})\s+(.+)$', stripped)
            if simple_match:
                # This line has name, might continue to next line with numbers
                project_id = simple_match.group(2)
                rest = simple_match.group(3).strip()
                
                # Try to split rest into name + numbers
                parts_match = re.match(r'^(.+?)\s+([\d,]+)\s+([\d,]*)\s*([\d,]+)\s+([\d.]+)$', rest)
                if parts_match:
                    projects.append({
                        'sl_no': simple_match.group(1),
                        'project_id': project_id,
                        'project_name': parts_match.group(1).strip(),
                        'original_cost_cr': parts_match.group(2).replace(',', ''),
                        'revised_cost_cr': parts_match.group(3).replace(',', ''),
                        'expenditure_cr': parts_match.group(4).replace(',', ''),
                        'physical_progress_pct': parts_match.group(5),
                        'sector': current_sector,
                        'ministry': current_ministry,
                        'section': current_section,
                    })
    
    return projects


def main():
    print("=" * 70)
    print("  PAIMANA Project-Level Data Parser")
    print("=" * 70)
    
    text_files = sorted([f for f in os.listdir(INPUT_DIR) if f.startswith('text_') and f.endswith('.txt')])
    print(f"\nFound {len(text_files)} text files to parse")
    
    all_projects = {}
    master_list = []
    
    for txt_file in text_files:
        month = txt_file.replace('text_', '').replace('.txt', '')
        filepath = os.path.join(INPUT_DIR, txt_file)
        
        print(f"\n  Parsing {txt_file}...")
        projects = parse_projects_from_text(filepath)
        all_projects[month] = projects
        
        # Add month info
        for p in projects:
            p['month'] = month
            master_list.append(p)
        
        # Save month-specific CSV
        csv_path = os.path.join(OUTPUT_DIR, f"parsed_projects_{month}.csv")
        if projects:
            with open(csv_path, 'w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=projects[0].keys())
                writer.writeheader()
                writer.writerows(projects)
            
            # Count unique project IDs
            unique_ids = set(p['project_id'] for p in projects)
            with_costs = [p for p in projects if p['original_cost_cr']]
            
            print(f"    Projects found: {len(projects)}")
            print(f"    Unique IDs: {len(unique_ids)}")
            print(f"    With cost data: {len(with_costs)}")
            print(f"    Saved: {csv_path}")
    
    # Save master CSV with all months
    master_csv = os.path.join(OUTPUT_DIR, "ALL_PROJECTS_MASTER.csv")
    if master_list:
        with open(master_csv, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=master_list[0].keys())
            writer.writeheader()
            writer.writerows(master_list)
    
    # Save as JSON too
    master_json = os.path.join(OUTPUT_DIR, "ALL_PROJECTS_MASTER.json")
    with open(master_json, 'w', encoding='utf-8') as f:
        json.dump(master_list, f, indent=2, ensure_ascii=False)
    
    # Summary stats
    all_unique = set(p['project_id'] for p in master_list)
    with_costs = [p for p in master_list if p['original_cost_cr']]
    
    print(f"\n{'='*70}")
    print(f"  FINAL SUMMARY")
    print(f"{'='*70}")
    print(f"  Total records: {len(master_list)}")
    print(f"  Unique project IDs: {len(all_unique)}")
    print(f"  Records with cost data: {len(with_costs)}")
    print(f"  Months covered: {len(all_projects)}")
    print(f"\n  Master files:")
    print(f"    CSV: {master_csv}")
    print(f"    JSON: {master_json}")
    
    # Show sample data
    print(f"\n  Sample projects (first 10):")
    for p in master_list[:10]:
        name = p['project_name'][:50]
        print(f"    [{p['project_id']}] {name} | Cost: {p['original_cost_cr']} -> {p['revised_cost_cr']} Cr | Progress: {p['physical_progress_pct']}%")


if __name__ == "__main__":
    main()
