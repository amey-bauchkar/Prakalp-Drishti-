"""
MASS SHOWCASE GENERATOR FOR ALL 2,207 PROJECTS.
Generates comprehensive showcase dossiers, analytical audit summaries,
and an interactive standalone HTML Showcase Explorer for all 2,207 projects.
"""

import os
import json
import pandas as pd

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, ".."))
SATELLITE_DIR = os.path.join(PROJECT_ROOT, "paimana_extracted", "satellite_data")
CATALOG_PATH = os.path.join(SATELLITE_DIR, "ALL_2207_PROJECTS_SATELLITE_CATALOG.csv")

def generate_analytical_summary(row):
    pname = row['project_name']
    sector = row['sector']
    agency = row['agency'] if pd.notna(row['agency']) and row['agency'] else "Executing Line Ministry"
    state = row['state'] if pd.notna(row['state']) and row['state'] else "National Corridor / Inter-State"
    claimed = float(row['claimed_progress_pct']) if pd.notna(row['claimed_progress_pct']) else 0.0
    observed = float(row['eo_observed_ocai_pct']) if pd.notna(row['eo_observed_ocai_pct']) else 0.0
    div = float(row['divergence_rod_points']) if pd.notna(row['divergence_rod_points']) else 0.0
    status = row['audit_status']
    orig_cost = row['original_cost_cr']
    rev_cost = row['revised_cost_cr'] if pd.notna(row['revised_cost_cr']) else orig_cost
    
    if status == 'CRITICAL_DIVERGENCE':
        narrative = (f"Satellite multi-spectral audit flagged critical discrepancy for {pname} ({agency}, {state}). "
                     f"While reported physical progress stands at {claimed:.1f}%, orbital surface indices (NDBI/OCAI) "
                     f"confirm only {observed:.1f}% real-world construction progress, revealing a severe divergence of {div:.1f} percentage points. "
                     f"Recommendation: Statutory disbursal freeze and immediate on-site vigilance inquiry.")
    elif status == 'MODERATE_VARIANCE':
        narrative = (f"Physical progress audit for {pname} ({agency}) in {state} shows moderate variance. "
                     f"Reported completion of {claimed:.1f}% versus satellite-observed {observed:.1f}% (variance: {div:.1f} pts). "
                     f"Recommendation: Require updated drone orthomosaics prior to Q3 capex milestone clearance.")
    else:
        narrative = (f"Orbital optical and multi-spectral sensors verify active milestone execution for {pname} ({agency}, {state}). "
                     f"Satellite observed construction activity ({observed:.1f}%) closely corroborates reported progress ({claimed:.1f}%) "
                     f"with an acceptable tolerance divergence of {div:.1f} pts. Statutory capex disbursal cleared.")
        
    return narrative

def main():
    print("=" * 85)
    print("🛰️ PRATIBIMB: GENERATING MASS SHOWCASE DOSSIERS FOR ALL 2,207 PROJECTS")
    print("=" * 85)
    
    if not os.path.exists(CATALOG_PATH):
        print(f"❌ Catalog missing: {CATALOG_PATH}")
        return
        
    df = pd.read_csv(CATALOG_PATH)
    print(f"Loaded {len(df):,} projects from master catalog.")
    
    showcase_records = []
    
    for idx, row in df.iterrows():
        summary = generate_analytical_summary(row)
        
        orig_cost = float(row['original_cost_cr']) if pd.notna(row['original_cost_cr']) and str(row['original_cost_cr']).replace('.','',1).isdigit() else 100.0
        rev_cost = float(row['revised_cost_cr']) if pd.notna(row['revised_cost_cr']) and str(row['revised_cost_cr']).replace('.','',1).isdigit() else orig_cost
        overrun = round(((rev_cost - orig_cost) / orig_cost) * 100.0, 1) if orig_cost > 0 else 0.0
        
        record = {
            "project_id": str(row['project_id']),
            "project_name": str(row['project_name']),
            "sector": str(row['sector']),
            "state": str(row['state']) if pd.notna(row['state']) and row['state'] else "National / Multi-State",
            "agency": str(row['agency']) if pd.notna(row['agency']) and row['agency'] else "Central Line Ministry",
            "original_cost_cr": orig_cost,
            "revised_cost_cr": rev_cost,
            "cost_overrun_pct": overrun,
            "claimed_progress_pct": float(row['claimed_progress_pct']) if pd.notna(row['claimed_progress_pct']) else 0.0,
            "eo_observed_ocai_pct": float(row['eo_observed_ocai_pct']) if pd.notna(row['eo_observed_ocai_pct']) else 0.0,
            "divergence_rod_points": float(row['divergence_rod_points']) if pd.notna(row['divergence_rod_points']) else 0.0,
            "audit_status": str(row['audit_status']),
            "statutory_recommendation": str(row['statutory_recommendation']),
            "latitude": float(row['latitude']),
            "longitude": float(row['longitude']),
            "grid_cell": str(row['grid_cell']),
            "satellite_sensor": str(row['satellite_sensor']),
            "tile_baseline_2020": str(row['tile_baseline_2020']),
            "tile_current_2023": str(row['tile_current_2023']),
            "showcase_analytical_dossier": summary
        }
        showcase_records.append(record)
        
    # Save master showcase JSON and CSV
    json_out = os.path.join(SATELLITE_DIR, "ALL_2207_PROJECT_SHOWCASE_DOSSIERS.json")
    csv_out = os.path.join(SATELLITE_DIR, "ALL_2207_PROJECT_SHOWCASE_DOSSIERS.csv")
    
    with open(json_out, "w", encoding="utf-8") as f:
        json.dump(showcase_records, f, indent=2)
        
    pd.DataFrame(showcase_records).to_csv(csv_out, index=False)
    
    print(f"✅ Saved Showcase JSON: {json_out} ({len(showcase_records):,} projects)")
    print(f"✅ Saved Showcase CSV: {csv_out}")
    
    # 3. Generate Standalone Interactive HTML Showcase Gallery Explorer
    print("🌐 Generating Standalone Interactive HTML Showcase Gallery Explorer...")
    
    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PRAKALP-DRISHTI: Master Satellite Showcase Explorer (All 2,207 Projects)</title>
    <style>
        :root {{
            --bg-primary: #0b192c;
            --bg-card: #1e3e62;
            --bg-card-hover: #264a75;
            --accent: #ff6500;
            --text-primary: #ffffff;
            --text-secondary: #dae1e9;
            --success: #2ecc71;
            --warning: #f39c12;
            --danger: #e74c3c;
            --border: #2c5380;
        }}
        * {{ box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }}
        body {{ background: var(--bg-primary); color: var(--text-primary); padding: 24px; min-height: 100vh; }}
        
        .header {{ text-align: center; margin-bottom: 24px; }}
        .header h1 {{ font-size: 26px; color: #fff; margin-bottom: 8px; }}
        .header p {{ color: var(--text-secondary); font-size: 14px; }}
        
        .controls {{
            display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; justify-content: center;
            background: #122844; padding: 16px; border-radius: 12px; border: 1px solid var(--border);
        }}
        input, select {{
            background: #1e3e62; border: 1px solid var(--border); color: #fff; padding: 10px 14px;
            border-radius: 8px; font-size: 14px; outline: none;
        }}
        input:focus, select:focus {{ border-color: var(--accent); }}
        input[type="text"] {{ width: 340px; }}
        
        .stats-bar {{
            display: flex; gap: 16px; justify-content: center; margin-bottom: 24px; flex-wrap: wrap;
        }}
        .stat-badge {{
            background: #1e3e62; padding: 10px 18px; border-radius: 8px; font-size: 13px; font-weight: 600;
            border-left: 4px solid var(--accent);
        }}
        
        .grid {{
            display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 20px;
        }}
        .card {{
            background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px;
            padding: 18px; transition: transform 0.2s, background 0.2s; display: flex; flex-direction: column;
            justify-content: space-between;
        }}
        .card:hover {{ transform: translateY(-4px); background: var(--bg-card-hover); border-color: var(--accent); }}
        
        .card-header {{ display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }}
        .card-title {{ font-size: 15px; font-weight: 700; color: #fff; line-height: 1.3; }}
        .badge {{
            padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase;
            white-space: nowrap; margin-left: 8px;
        }}
        .badge-success {{ background: rgba(46, 204, 113, 0.2); color: var(--success); border: 1px solid var(--success); }}
        .badge-warning {{ background: rgba(243, 156, 18, 0.2); color: var(--warning); border: 1px solid var(--warning); }}
        .badge-danger {{ background: rgba(231, 76, 60, 0.2); color: var(--danger); border: 1px solid var(--danger); }}
        
        .card-meta {{ font-size: 12px; color: var(--text-secondary); margin-bottom: 14px; }}
        
        .image-preview {{
            display: flex; gap: 8px; margin-bottom: 14px;
        }}
        .thumb-box {{
            flex: 1; height: 130px; background: #081220; border-radius: 8px; overflow: hidden; position: relative;
            border: 1px solid var(--border);
        }}
        .thumb-box img {{ width: 100%; height: 100%; object-fit: cover; }}
        .thumb-label {{
            position: absolute; bottom: 4px; left: 4px; background: rgba(0,0,0,0.75); color: #fff;
            font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: 600;
        }}
        
        .progress-section {{ margin-bottom: 12px; }}
        .prog-row {{ display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px; }}
        .progress-bar-bg {{ background: #0b192c; height: 8px; border-radius: 4px; overflow: hidden; margin-bottom: 8px; }}
        .progress-bar-fill {{ height: 100%; border-radius: 4px; }}
        
        .dossier-text {{
            font-size: 12px; color: var(--text-secondary); line-height: 1.45; background: #122844;
            padding: 10px; border-radius: 8px; border-left: 3px solid var(--accent); margin-top: 8px;
        }}
        
        .pagination {{ display: flex; justify-content: center; gap: 8px; margin-top: 32px; }}
        .page-btn {{
            background: #1e3e62; color: #fff; border: 1px solid var(--border); padding: 8px 16px;
            border-radius: 6px; cursor: pointer; font-size: 14px;
        }}
        .page-btn:hover:not(:disabled) {{ background: var(--accent); }}
        .page-btn:disabled {{ opacity: 0.4; cursor: not-allowed; }}
    </style>
</head>
<body>
    <div class="header">
        <h1>🛰️ PRAKALP-DRISHTI: MASTER SATELLITE SHOWCASE EXPLORER</h1>
        <p>Comprehensive Orbital Earth Observation (EO) Audit for All 2,207 Infrastructure Projects</p>
    </div>
    
    <div class="controls">
        <input type="text" id="searchInput" placeholder="🔍 Search by Project Name, ID, Agency, or State..." oninput="filterProjects()">
        <select id="sectorSelect" onchange="filterProjects()">
            <option value="">All Sectors (22 Sectors)</option>
        </select>
        <select id="statusSelect" onchange="filterProjects()">
            <option value="">All Audit Statuses</option>
            <option value="VERIFIED_ON_TRACK">Verified On Track</option>
            <option value="MODERATE_VARIANCE">Moderate Variance</option>
            <option value="CRITICAL_DIVERGENCE">Critical Divergence Alert</option>
        </select>
    </div>
    
    <div class="stats-bar">
        <div class="stat-badge">Total Projects: <span id="totalCount">2,207</span></div>
        <div class="stat-badge" style="border-left-color: #2ecc71;">Verified On Track: <span id="verifiedCount">0</span></div>
        <div class="stat-badge" style="border-left-color: #e74c3c;">Critical Divergences: <span id="alertCount">0</span></div>
        <div class="stat-badge" style="border-left-color: #3498db;">Showing: <span id="showingCount">0</span></div>
    </div>
    
    <div class="grid" id="projectGrid"></div>
    
    <div class="pagination">
        <button class="page-btn" id="prevBtn" onclick="prevPage()">⬅️ Previous</button>
        <span id="pageInfo" style="align-self: center; font-size: 14px; font-weight: 600;">Page 1</span>
        <button class="page-btn" id="nextBtn" onclick="nextPage()">Next ➡️</button>
    </div>

    <script>
        let allProjects = [];
        let filteredProjects = [];
        let currentPage = 1;
        const pageSize = 24;

        // Load project data
        fetch('ALL_2207_PROJECT_SHOWCASE_DOSSIERS.json')
            .then(res => res.json())
            .then(data => {{
                allProjects = data;
                filteredProjects = data;
                populateSectors();
                updateStats();
                renderPage();
            }});

        function populateSectors() {{
            const sectors = [...new Set(allProjects.map(p => p.sector))].filter(Boolean).sort();
            const sel = document.getElementById('sectorSelect');
            sectors.forEach(s => {{
                const opt = document.createElement('option');
                opt.value = s;
                opt.textContent = s;
                sel.appendChild(opt);
            }});
        }}

        function updateStats() {{
            document.getElementById('totalCount').textContent = allProjects.length.toLocaleString();
            document.getElementById('verifiedCount').textContent = allProjects.filter(p => p.audit_status === 'VERIFIED_ON_TRACK').length.toLocaleString();
            document.getElementById('alertCount').textContent = allProjects.filter(p => p.audit_status === 'CRITICAL_DIVERGENCE').length.toLocaleString();
            document.getElementById('showingCount').textContent = filteredProjects.length.toLocaleString();
        }}

        function filterProjects() {{
            const query = document.getElementById('searchInput').value.toLowerCase();
            const sector = document.getElementById('sectorSelect').value;
            const status = document.getElementById('statusSelect').value;

            filteredProjects = allProjects.filter(p => {{
                const matchQuery = !query || p.project_name.toLowerCase().includes(query) || 
                                   p.project_id.includes(query) || 
                                   p.agency.toLowerCase().includes(query) || 
                                   p.state.toLowerCase().includes(query);
                const matchSector = !sector || p.sector === sector;
                const matchStatus = !status || p.audit_status === status;
                return matchQuery && matchSector && matchStatus;
            }});

            currentPage = 1;
            updateStats();
            renderPage();
        }}

        function renderPage() {{
            const grid = document.getElementById('projectGrid');
            grid.innerHTML = '';

            const start = (currentPage - 1) * pageSize;
            const end = start + pageSize;
            const pageData = filteredProjects.slice(start, end);

            pageData.forEach(p => {{
                const card = document.createElement('div');
                card.className = 'card';

                let badgeClass = 'badge-success';
                let badgeText = 'Verified';
                if (p.audit_status === 'CRITICAL_DIVERGENCE') {{
                    badgeClass = 'badge-danger';
                    badgeText = '🚨 Alert';
                }} else if (p.audit_status === 'MODERATE_VARIANCE') {{
                    badgeClass = 'badge-warning';
                    badgeText = 'Variance';
                }}

                card.innerHTML = `
                    <div>
                        <div class="card-header">
                            <div class="card-title">#${{p.project_id}}: ${{p.project_name}}</div>
                            <div class="badge ${{badgeClass}}">${{badgeText}}</div>
                        </div>
                        <div class="card-meta">
                            📍 ${{p.state}} • 🏢 ${{p.agency}} • 💰 ₹${{p.original_cost_cr.toLocaleString()}} Cr
                        </div>
                        
                        <div class="image-preview">
                            <div class="thumb-box">
                                <img src="../../${{p.tile_baseline_2020}}" alt="T0 Baseline" onerror="this.src='https://via.placeholder.com/300x200/0b192c/ffffff?text=Baseline+T0'">
                                <div class="thumb-label">Baseline 2020</div>
                            </div>
                            <div class="thumb-box">
                                <img src="../../${{p.tile_current_2023}}" alt="T1 Current" onerror="this.src='https://via.placeholder.com/300x200/0b192c/ffffff?text=Current+T1'">
                                <div class="thumb-label">Current 2023</div>
                            </div>
                        </div>

                        <div class="progress-section">
                            <div class="prog-row">
                                <span>Reported Progress:</span>
                                <strong>${{p.claimed_progress_pct.toFixed(1)}}%</strong>
                            </div>
                            <div class="progress-bar-bg">
                                <div class="progress-bar-fill" style="width: ${{p.claimed_progress_pct}}%; background: #007aff;"></div>
                            </div>
                            
                            <div class="prog-row">
                                <span>Satellite Observed (OCAI):</span>
                                <strong style="color: #2ecc71;">${{p.eo_observed_ocai_pct.toFixed(1)}}%</strong>
                            </div>
                            <div class="progress-bar-bg">
                                <div class="progress-bar-fill" style="width: ${{p.eo_observed_ocai_pct}}%; background: #2ecc71;"></div>
                            </div>
                            
                            <div class="prog-row" style="font-size: 11px; color: #dae1e9;">
                                <span>Variance (ROD):</span>
                                <span style="color: ${{p.divergence_rod_points > 15 ? '#e74c3c' : '#2ecc71'}};">${{p.divergence_rod_points > 0 ? '+' : ''}}${{p.divergence_rod_points.toFixed(1)}} pts</span>
                            </div>
                        </div>
                    </div>

                    <div class="dossier-text">
                        ${{p.showcase_analytical_dossier}}
                    </div>
                `;
                grid.appendChild(card);
            }});

            const totalPages = Math.ceil(filteredProjects.length / pageSize) || 1;
            document.getElementById('pageInfo').textContent = `Page ${{currentPage}} of ${{totalPages}}`;
            document.getElementById('prevBtn').disabled = currentPage === 1;
            document.getElementById('nextBtn').disabled = currentPage >= totalPages;
        }}

        function prevPage() {{
            if (currentPage > 1) {{
                currentPage--;
                renderPage();
                window.scrollTo({{ top: 0, behavior: 'smooth' }});
            }}
        }}

        function nextPage() {{
            const totalPages = Math.ceil(filteredProjects.length / pageSize);
            if (currentPage < totalPages) {{
                currentPage++;
                renderPage();
                window.scrollTo({{ top: 0, behavior: 'smooth' }});
            }}
        }}
    </script>
</body>
</html>
"""
    gallery_path = os.path.join(SATELLITE_DIR, "ALL_2207_PROJECTS_SHOWCASE_GALLERY.html")
    with open(gallery_path, "w", encoding="utf-8") as f:
        f.write(html_content)
        
    root_gallery = os.path.join(PROJECT_ROOT, "ALL_2207_PROJECTS_SHOWCASE_GALLERY.html")
    with open(root_gallery, "w", encoding="utf-8") as f:
        f.write(html_content)
        
    print(f"🎉 MASTER SHOWCASE GALLERY EXPLORER GENERATED: {root_gallery}")
    print("=" * 85)

if __name__ == "__main__":
    main()
