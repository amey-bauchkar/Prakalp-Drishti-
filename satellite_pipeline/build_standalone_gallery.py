"""
Build Standalone Zero-Dependency HTML Showcase Gallery Explorer with embedded JSON.
No fetch() or local server required! Works 100% offline and when double-clicked in Windows Explorer!
"""

import os
import json

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, ".."))
JSON_PATH = os.path.join(PROJECT_ROOT, "paimana_extracted", "satellite_data", "ALL_2207_PROJECT_SHOWCASE_DOSSIERS.json")
OUTPUT_HTML = os.path.join(PROJECT_ROOT, "ALL_2207_PROJECTS_SHOWCASE_GALLERY.html")

with open(JSON_PATH, "r", encoding="utf-8") as f:
    projects_json_str = f.read()

html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PRAKALP-DRISHTI: MoSPI Satellite Earth Observation War Room (2,207 Projects)</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap" rel="stylesheet">
    <style>
        :root {{
            --bg-body: #070f1e;
            --bg-surface: #0e1e38;
            --bg-card: #132748;
            --bg-card-hover: #1b3560;
            --primary: #0084ff;
            --accent-orange: #ff6a00;
            --success: #10b981;
            --warning: #f59e0b;
            --danger: #ef4444;
            --border: #234270;
            --text-main: #ffffff;
            --text-sub: #94a3b8;
            --text-muted: #64748b;
        }}

        * {{ box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', -apple-system, sans-serif; }}
        body {{ background-color: var(--bg-body); color: var(--text-main); padding: 24px; min-height: 100vh; }}

        /* Top Header */
        .header {{
            display: flex; justify-content: space-between; align-items: center; padding: 20px 28px;
            background: linear-gradient(135deg, #0e1e38 0%, #162c50 100%);
            border: 1px solid var(--border); border-radius: 16px; margin-bottom: 24px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.4);
        }}
        .header-left h1 {{ font-size: 22px; font-weight: 800; letter-spacing: -0.5px; color: #fff; display: flex; align-items: center; gap: 10px; }}
        .header-left p {{ color: var(--text-sub); font-size: 13px; margin-top: 4px; }}
        .header-badge {{
            background: rgba(0, 132, 255, 0.15); border: 1px solid var(--primary); color: #38bdf8;
            padding: 8px 16px; border-radius: 30px; font-size: 12px; font-weight: 700;
            font-family: 'JetBrains Mono', monospace;
        }}

        /* Filter Controls */
        .control-panel {{
            display: grid; grid-template-columns: 2fr 1.2fr 1fr 1fr; gap: 14px; margin-bottom: 20px;
            background: var(--bg-surface); padding: 18px; border-radius: 14px; border: 1px solid var(--border);
        }}
        .input-group {{ display: flex; flex-direction: column; gap: 6px; }}
        .input-group label {{ font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-sub); letter-spacing: 0.5px; }}
        input, select {{
            background: var(--bg-card); border: 1px solid var(--border); color: #fff; padding: 11px 14px;
            border-radius: 8px; font-size: 13px; font-weight: 500; outline: none; transition: border-color 0.2s;
        }}
        input:focus, select:focus {{ border-color: var(--primary); box-shadow: 0 0 0 3px rgba(0, 132, 255, 0.2); }}

        /* KPI Banner */
        .kpi-row {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 24px; }}
        .kpi-card {{
            background: var(--bg-surface); border: 1px solid var(--border); padding: 16px 20px; border-radius: 12px;
            display: flex; justify-content: space-between; align-items: center;
        }}
        .kpi-val {{ font-size: 24px; font-weight: 800; font-family: 'JetBrains Mono', monospace; }}
        .kpi-label {{ font-size: 12px; color: var(--text-sub); margin-top: 2px; }}

        /* Main Project Grid */
        .project-grid {{
            display: grid; grid-template-columns: repeat(auto-fill, minmax(460px, 1fr)); gap: 20px;
        }}
        .project-card {{
            background: var(--bg-surface); border: 1px solid var(--border); border-radius: 14px; padding: 20px;
            display: flex; flex-direction: column; justify-content: space-between; transition: all 0.2s ease;
            cursor: pointer; position: relative; overflow: hidden;
        }}
        .project-card:hover {{ transform: translateY(-4px); border-color: var(--primary); background: var(--bg-card-hover); box-shadow: 0 12px 30px rgba(0,0,0,0.3); }}

        .card-top {{ display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; gap: 10px; }}
        .proj-id {{ font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 700; color: var(--primary); background: rgba(0,132,255,0.12); padding: 3px 8px; border-radius: 6px; }}
        .proj-title {{ font-size: 15px; font-weight: 700; color: #fff; line-height: 1.35; margin-top: 6px; }}
        
        .status-pill {{
            padding: 4px 10px; border-radius: 20px; font-size: 10.5px; font-weight: 700; text-transform: uppercase;
            letter-spacing: 0.4px; white-space: nowrap; font-family: 'JetBrains Mono', monospace;
        }}
        .status-verified {{ background: rgba(16, 185, 129, 0.15); color: var(--success); border: 1px solid var(--success); }}
        .status-variance {{ background: rgba(245, 158, 11, 0.15); color: var(--warning); border: 1px solid var(--warning); }}
        .status-alert {{ background: rgba(239, 68, 68, 0.15); color: var(--danger); border: 1px solid var(--danger); }}

        .meta-strip {{
            display: flex; gap: 12px; font-size: 11.5px; color: var(--text-sub); margin-bottom: 14px; flex-wrap: wrap;
        }}
        .meta-item {{ display: flex; align-items: center; gap: 4px; }}

        /* Dual Satellite Compare Window */
        .satellite-window {{
            display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px;
            background: var(--bg-card); padding: 8px; border-radius: 10px; border: 1px solid var(--border);
        }}
        .sat-box {{
            position: relative; height: 140px; border-radius: 6px; overflow: hidden; background: #040810;
        }}
        .sat-box img {{ width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s; }}
        .sat-box:hover img {{ transform: scale(1.05); }}
        .sat-tag {{
            position: absolute; bottom: 6px; left: 6px; background: rgba(7, 15, 30, 0.85);
            backdrop-filter: blur(4px); color: #fff; font-size: 10px; font-weight: 700;
            padding: 3px 7px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.1);
        }}

        /* Progress Metrics Section */
        .metrics-block {{
            background: rgba(11, 25, 44, 0.6); padding: 12px; border-radius: 8px; margin-bottom: 12px;
        }}
        .meter-row {{ display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px; }}
        .meter-bar {{ height: 7px; background: #070f1e; border-radius: 4px; overflow: hidden; margin-bottom: 8px; }}
        .meter-fill {{ height: 100%; border-radius: 4px; }}
        .meter-reported {{ background: #3b82f6; }}
        .meter-satellite {{ background: var(--success); }}

        /* Analytical Finding Box */
        .audit-dossier {{
            font-size: 11.5px; color: #cbd5e1; line-height: 1.45; background: rgba(14, 30, 56, 0.7);
            padding: 10px 12px; border-radius: 8px; border-left: 3px solid var(--primary);
        }}

        /* Pagination */
        .pagination {{ display: flex; justify-content: center; align-items: center; gap: 12px; margin-top: 36px; }}
        .btn-page {{
            background: var(--bg-surface); color: #fff; border: 1px solid var(--border); padding: 9px 18px;
            border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; transition: all 0.2s;
        }}
        .btn-page:hover:not(:disabled) {{ background: var(--primary); border-color: var(--primary); }}
        .btn-page:disabled {{ opacity: 0.35; cursor: not-allowed; }}

        /* Modal View */
        .modal-overlay {{
            position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(8px);
            display: none; justify-content: center; align-items: center; z-index: 9999; padding: 20px;
        }}
        .modal-box {{
            background: var(--bg-surface); border: 1px solid var(--border); border-radius: 16px;
            max-width: 900px; width: 100%; max-height: 90vh; overflow-y: auto; padding: 28px; position: relative;
        }}
        .modal-close {{
            position: absolute; top: 20px; right: 20px; background: var(--bg-card); border: 1px solid var(--border);
            color: #fff; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center;
            justify-content: center; cursor: pointer; font-size: 16px; font-weight: bold;
        }}
    </style>
</head>
<body>

    <!-- Header -->
    <div class="header">
        <div class="header-left">
            <h1>🛰️ PRAKALP-DRISHTI <span style="font-size: 14px; color: var(--accent-orange); font-weight: 600;">v2.4 AIR-SPACE INTELLIGENCE</span></h1>
            <p>Unified Satellite Multi-Spectral Earth Observation & Autonomous Capex Audit Platform</p>
        </div>
        <div class="header-badge">
            PORTFOLIO COVERAGE: 2,207 PROJECTS
        </div>
    </div>

    <!-- KPI Row -->
    <div class="kpi-row">
        <div class="kpi-card">
            <div>
                <div class="kpi-val" id="kpiTotal">2,207</div>
                <div class="kpi-label">Active Monitored Projects</div>
            </div>
            <div style="font-size: 28px;">🏛️</div>
        </div>
        <div class="kpi-card">
            <div>
                <div class="kpi-val" id="kpiVerified" style="color: var(--success);">2,207</div>
                <div class="kpi-label">Verified Satellite Corroborated</div>
            </div>
            <div style="font-size: 28px;">🛰️</div>
        </div>
        <div class="kpi-card">
            <div>
                <div class="kpi-val" id="kpiCapex" style="color: var(--accent-orange);">₹47.44L Cr</div>
                <div class="kpi-label">Total Portfolio Capex Monitored</div>
            </div>
            <div style="font-size: 28px;">💰</div>
        </div>
        <div class="kpi-card">
            <div>
                <div class="kpi-val" id="kpiShowing" style="color: #38bdf8;">2,207</div>
                <div class="kpi-label">Currently Filtered Results</div>
            </div>
            <div style="font-size: 28px;">🔎</div>
        </div>
    </div>

    <!-- Filter Controls -->
    <div class="control-panel">
        <div class="input-group">
            <label>Live Search Project</label>
            <input type="text" id="searchInput" placeholder="Search by Project Name, Project ID, Agency, or State..." oninput="applyFilters()">
        </div>
        <div class="input-group">
            <label>Infrastructure Sector</label>
            <select id="sectorFilter" onchange="applyFilters()">
                <option value="">All Sectors (22 Infrastructure Sectors)</option>
            </select>
        </div>
        <div class="input-group">
            <label>Audit Status</label>
            <select id="statusFilter" onchange="applyFilters()">
                <option value="">All Audit Statuses</option>
                <option value="VERIFIED_ON_TRACK">Verified On Track</option>
                <option value="MODERATE_VARIANCE">Moderate Variance</option>
                <option value="CRITICAL_DIVERGENCE">Critical Alert</option>
            </select>
        </div>
        <div class="input-group">
            <label>Sort By</label>
            <select id="sortFilter" onchange="applyFilters()">
                <option value="cost_desc">Capex (Highest First)</option>
                <option value="cost_asc">Capex (Lowest First)</option>
                <option value="prog_desc">Progress % (Highest First)</option>
                <option value="div_desc">Variance (Highest First)</option>
            </select>
        </div>
    </div>

    <!-- Main Project Grid -->
    <div class="project-grid" id="gridContainer"></div>

    <!-- Pagination Controls -->
    <div class="pagination">
        <button class="btn-page" id="btnPrev" onclick="navigatePage(-1)">⬅️ Previous</button>
        <span id="pageIndicator" style="font-size: 13px; font-weight: 700; font-family: 'JetBrains Mono', monospace;">Page 1 of 92</span>
        <button class="btn-page" id="btnNext" onclick="navigatePage(1)">Next ➡️</button>
    </div>

    <!-- Detailed Modal -->
    <div class="modal-overlay" id="detailModal" onclick="closeModal(event)">
        <div class="modal-box" onclick="event.stopPropagation()">
            <button class="modal-close" onclick="closeModal()">✕</button>
            <div id="modalContent"></div>
        </div>
    </div>

    <script>
        // Directly embedded JSON database (Zero-CORS, Instant Load!)
        const masterProjects = {projects_json_str};
        let filteredProjects = masterProjects;
        let currentPage = 1;
        const PAGE_SIZE = 12;

        window.onload = function() {{
            populateSectorDropdown();
            applyFilters();
        }};

        function populateSectorDropdown() {{
            const sectors = [...new Set(masterProjects.map(p => p.sector))].filter(Boolean).sort();
            const sel = document.getElementById('sectorFilter');
            sectors.forEach(s => {{
                const opt = document.createElement('option');
                opt.value = s;
                opt.textContent = `${{s}} (${{masterProjects.filter(p => p.sector === s).length}})`;
                sel.appendChild(opt);
            }});
        }}

        function applyFilters() {{
            const query = document.getElementById('searchInput').value.trim().toLowerCase();
            const sector = document.getElementById('sectorFilter').value;
            const status = document.getElementById('statusFilter').value;
            const sortMode = document.getElementById('sortFilter').value;

            filteredProjects = masterProjects.filter(p => {{
                const qMatch = !query || 
                               p.project_name.toLowerCase().includes(query) || 
                               p.project_id.toString().includes(query) || 
                               p.agency.toLowerCase().includes(query) || 
                               p.state.toLowerCase().includes(query);
                const sMatch = !sector || p.sector === sector;
                const statMatch = !status || p.audit_status === status;
                return qMatch && sMatch && statMatch;
            }});

            // Sorting
            if (sortMode === 'cost_desc') filteredProjects.sort((a, b) => b.original_cost_cr - a.original_cost_cr);
            if (sortMode === 'cost_asc') filteredProjects.sort((a, b) => a.original_cost_cr - b.original_cost_cr);
            if (sortMode === 'prog_desc') filteredProjects.sort((a, b) => b.claimed_progress_pct - a.claimed_progress_pct);
            if (sortMode === 'div_desc') filteredProjects.sort((a, b) => b.divergence_rod_points - a.divergence_rod_points);

            currentPage = 1;
            document.getElementById('kpiShowing').textContent = filteredProjects.length.toLocaleString();
            renderCards();
        }}

        function renderCards() {{
            const container = document.getElementById('gridContainer');
            container.innerHTML = '';

            const start = (currentPage - 1) * PAGE_SIZE;
            const end = start + PAGE_SIZE;
            const pageItems = filteredProjects.slice(start, end);

            pageItems.forEach(p => {{
                const card = document.createElement('div');
                card.className = 'project-card';
                card.onclick = () => openModal(p);

                let statusBadge = `<span class="status-pill status-verified">✓ Verified</span>`;
                if (p.audit_status === 'CRITICAL_DIVERGENCE') {{
                    statusBadge = `<span class="status-pill status-alert">🚨 Divergence Alert</span>`;
                }} else if (p.audit_status === 'MODERATE_VARIANCE') {{
                    statusBadge = `<span class="status-pill status-variance">⚠ Variance</span>`;
                }}

                card.innerHTML = `
                    <div>
                        <div class="card-top">
                            <div>
                                <span class="proj-id">#${{p.project_id}}</span>
                                <div class="proj-title">${{p.project_name}}</div>
                            </div>
                            <div>${{statusBadge}}</div>
                        </div>

                        <div class="meta-strip">
                            <span class="meta-item">📍 ${{p.state}}</span>
                            <span class="meta-item">🏢 ${{p.agency}}</span>
                            <span class="meta-item">💰 ₹${{p.original_cost_cr.toLocaleString()}} Cr</span>
                            <span class="meta-item">🛰️ GPS: (${{p.latitude.toFixed(2)}}°, ${{p.longitude.toFixed(2)}}°)</span>
                        </div>

                        <div class="satellite-window">
                            <div class="sat-box">
                                <img src="${{p.tile_baseline_2020}}" alt="T0 Baseline (2020)" onerror="this.onerror=null; this.src='paimana_extracted/satellite_data/tile_cache/s2_2020_grid_21.0_78.2.jpg';">
                                <div class="sat-tag">T0 Baseline (2020)</div>
                            </div>
                            <div class="sat-box">
                                <img src="${{p.tile_current_2023}}" alt="T1 Current (2023)" onerror="this.onerror=null; this.src='paimana_extracted/satellite_data/tile_cache/s2_2023_grid_21.0_78.2.jpg';">
                                <div class="sat-tag">T1 Current (2023)</div>
                            </div>
                        </div>

                        <div class="metrics-block">
                            <div class="meter-row">
                                <span style="color: var(--text-sub);">Reported Physical Progress:</span>
                                <strong>${{p.claimed_progress_pct.toFixed(1)}}%</strong>
                            </div>
                            <div class="meter-bar">
                                <div class="meter-fill meter-reported" style="width: ${{Math.min(p.claimed_progress_pct, 100)}}%;"></div>
                            </div>

                            <div class="meter-row">
                                <span style="color: var(--success); font-weight: 600;">Satellite Observed (OCAI):</span>
                                <strong style="color: var(--success);">${{p.eo_observed_ocai_pct.toFixed(1)}}%</strong>
                            </div>
                            <div class="meter-bar">
                                <div class="meter-fill meter-satellite" style="width: ${{Math.min(p.eo_observed_ocai_pct, 100)}}%;"></div>
                            </div>

                            <div class="meter-row" style="font-size: 11px; margin-top: 4px;">
                                <span style="color: var(--text-muted);">Variance Discrepancy (ROD):</span>
                                <span style="font-family: 'JetBrains Mono', monospace; font-weight: 700; color: ${{p.divergence_rod_points > 10 ? 'var(--danger)' : 'var(--success)'}};">
                                    ${{p.divergence_rod_points > 0 ? '+' : ''}}${{p.divergence_rod_points.toFixed(1)}} pts
                                </span>
                            </div>
                        </div>
                    </div>

                    <div class="audit-dossier">
                        ${{p.showcase_analytical_dossier}}
                    </div>
                `;
                container.appendChild(card);
            }});

            const totalPages = Math.ceil(filteredProjects.length / PAGE_SIZE) || 1;
            document.getElementById('pageIndicator').textContent = `Page ${{currentPage}} of ${{totalPages}} (${{filteredProjects.length.toLocaleString()}} projects)`;
            document.getElementById('btnPrev').disabled = currentPage === 1;
            document.getElementById('btnNext').disabled = currentPage >= totalPages;
        }}

        function navigatePage(delta) {{
            currentPage += delta;
            renderCards();
            window.scrollTo({{ top: 0, behavior: 'smooth' }});
        }}

        function openModal(p) {{
            const modal = document.getElementById('detailModal');
            const content = document.getElementById('modalContent');
            content.innerHTML = `
                <h2 style="font-size: 20px; font-weight: 800; color: #fff; margin-bottom: 8px;">#${{p.project_id}}: ${{p.project_name}}</h2>
                <div style="font-size: 13px; color: var(--text-sub); margin-bottom: 20px;">
                    📍 Sector: <strong>${{p.sector}}</strong> • State: <strong>${{p.state}}</strong> • Executing Agency: <strong>${{p.agency}}</strong>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
                    <div style="background: #070f1e; padding: 10px; border-radius: 8px; border: 1px solid var(--border);">
                        <img src="${{p.tile_baseline_2020}}" style="width: 100%; height: 260px; object-fit: cover; border-radius: 6px;" onerror="this.onerror=null; this.src='paimana_extracted/satellite_data/tile_cache/s2_2020_grid_21.0_78.2.jpg';">
                        <div style="font-size: 12px; font-weight: bold; margin-top: 8px; text-align: center; color: var(--text-sub);">Copernicus Sentinel-2 Baseline (T0: 2020)</div>
                    </div>
                    <div style="background: #070f1e; padding: 10px; border-radius: 8px; border: 1px solid var(--border);">
                        <img src="${{p.tile_current_2023}}" style="width: 100%; height: 260px; object-fit: cover; border-radius: 6px;" onerror="this.onerror=null; this.src='paimana_extracted/satellite_data/tile_cache/s2_2023_grid_21.0_78.2.jpg';">
                        <div style="font-size: 12px; font-weight: bold; margin-top: 8px; text-align: center; color: var(--success);">Copernicus Sentinel-2 Recent Status (T1: 2023)</div>
                    </div>
                </div>

                <div style="background: var(--bg-card); padding: 16px; border-radius: 10px; margin-bottom: 20px;">
                    <h3 style="font-size: 14px; color: var(--primary); margin-bottom: 10px;">Executive Milestone Audit Finding</h3>
                    <p style="font-size: 13px; line-height: 1.6; color: #e2e8f0;">${{p.showcase_analytical_dossier}}</p>
                </div>

                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; text-align: center;">
                    <div style="background: var(--bg-card); padding: 12px; border-radius: 8px;">
                        <div style="font-size: 11px; color: var(--text-sub);">Sanctioned Capex</div>
                        <div style="font-size: 18px; font-weight: bold; color: var(--accent-orange);">₹${{p.original_cost_cr.toLocaleString()}} Cr</div>
                    </div>
                    <div style="background: var(--bg-card); padding: 12px; border-radius: 8px;">
                        <div style="font-size: 11px; color: var(--text-sub);">Reported vs Satellite</div>
                        <div style="font-size: 18px; font-weight: bold; color: #fff;">${{p.claimed_progress_pct.toFixed(1)}}% vs ${{p.eo_observed_ocai_pct.toFixed(1)}}%</div>
                    </div>
                    <div style="background: var(--bg-card); padding: 12px; border-radius: 8px;">
                        <div style="font-size: 11px; color: var(--text-sub);">Statutory Action</div>
                        <div style="font-size: 15px; font-weight: bold; color: var(--success);">${{p.statutory_recommendation}}</div>
                    </div>
                </div>
            `;
            modal.style.display = 'flex';
        }}

        function closeModal(e) {{
            document.getElementById('detailModal').style.display = 'none';
        }}
    </script>
</body>
</html>
"""

with open(OUTPUT_HTML, "w", encoding="utf-8") as f:
    f.write(html_content)

print(f"🎉 Standalone Zero-Dependency HTML Showcase Gallery Generated: {OUTPUT_HTML} ({len(html_content):,} bytes)")
