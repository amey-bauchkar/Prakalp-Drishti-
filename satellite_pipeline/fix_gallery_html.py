import os

with open('ALL_2207_PROJECTS_SHOWCASE_GALLERY.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Let's locate the array declaration and the script following it
idx_start = html.find('const allProjectsRaw = [')
if idx_start == -1:
    idx_start = html.find('const masterProjects = [')

idx_end = html.find('];', idx_start)

# The HTML part before <script>
script_tag_idx = html.rfind('<script>', 0, idx_start)
html_before_script = html[:script_tag_idx]

# Extract the raw JSON array string
array_str = html[idx_start:idx_end + 2]
if array_str.startswith('const masterProjects = ['):
    array_str = 'const allProjectsRaw = [' + array_str[len('const masterProjects = ['):]

# Read the template JS
js_logic = """<script>
        ARRAY_PLACEHOLDER

        const goldenIds = ['619069', '618933', '618621', '618542', '618379', '619010', '619150', '619099', '606781', '702639'];
        
        let currentMode = 'golden';
        let masterProjects = allProjectsRaw.filter(p => goldenIds.includes(p.project_id.toString()));
        let filteredProjects = [...masterProjects];
        let currentPage = 1;
        const PAGE_SIZE = 12;

        window.onload = function() {
            updateKPIs();
            populateSectorDropdown();
            applyFilters();
        };

        function switchMode(mode) {
            currentMode = mode;
            const btnGolden = document.getElementById('btnModeGolden');
            const btnAll = document.getElementById('btnModeAll');
            
            if (mode === 'golden') {
                masterProjects = allProjectsRaw.filter(p => goldenIds.includes(p.project_id.toString()));
                if (btnGolden) { btnGolden.style.background = '#38bdf8'; btnGolden.style.color = '#0b1329'; }
                if (btnAll) { btnAll.style.background = 'rgba(255,255,255,0.08)'; btnAll.style.color = '#fff'; }
            } else {
                masterProjects = allProjectsRaw;
                if (btnGolden) { btnGolden.style.background = 'rgba(255,255,255,0.08)'; btnGolden.style.color = '#fff'; }
                if (btnAll) { btnAll.style.background = '#38bdf8'; btnAll.style.color = '#0b1329'; }
            }
            updateKPIs();
            populateSectorDropdown();
            applyFilters();
        }

        function updateKPIs() {
            const total = masterProjects.length;
            const capexCr = masterProjects.reduce((acc, p) => acc + (p.original_cost_cr || 0), 0);
            const verified = masterProjects.filter(p => p.audit_status === 'VERIFIED_ON_TRACK').length;
            
            document.getElementById('kpiTotal').textContent = total.toLocaleString();
            document.getElementById('kpiVerified').textContent = total.toLocaleString();
            if (capexCr >= 100000) {
                document.getElementById('kpiCapex').textContent = '₹' + (capexCr / 100000).toFixed(2) + 'L Cr';
            } else {
                document.getElementById('kpiCapex').textContent = '₹' + Math.round(capexCr).toLocaleString() + ' Cr';
            }
        }

        function populateSectorDropdown() {
            const sectors = [...new Set(masterProjects.map(p => p.sector))].filter(Boolean).sort();
            const sel = document.getElementById('sectorFilter');
            sel.innerHTML = '<option value="">All Sectors (' + sectors.length + ' Infrastructure Sectors)</option>';
            sectors.forEach(s => {
                const opt = document.createElement('option');
                opt.value = s;
                opt.textContent = `${s} (${masterProjects.filter(p => p.sector === s).length})`;
                sel.appendChild(opt);
            });
        }

        function applyFilters() {
            const query = document.getElementById('searchInput').value.trim().toLowerCase();
            const sector = document.getElementById('sectorFilter').value;
            const status = document.getElementById('statusFilter').value;
            const sortMode = document.getElementById('sortFilter').value;

            filteredProjects = masterProjects.filter(p => {
                const qMatch = !query || 
                               p.project_name.toLowerCase().includes(query) || 
                               p.project_id.toString().includes(query) || 
                               p.agency.toLowerCase().includes(query) || 
                               p.state.toLowerCase().includes(query);
                const sMatch = !sector || p.sector === sector;
                const statMatch = !status || p.audit_status === status;
                return qMatch && sMatch && statMatch;
            });

            // Sorting
            if (sortMode === 'cost_desc') filteredProjects.sort((a, b) => b.original_cost_cr - a.original_cost_cr);
            if (sortMode === 'cost_asc') filteredProjects.sort((a, b) => a.original_cost_cr - b.original_cost_cr);
            if (sortMode === 'prog_desc') filteredProjects.sort((a, b) => b.claimed_progress_pct - a.claimed_progress_pct);
            if (sortMode === 'div_desc') filteredProjects.sort((a, b) => b.divergence_rod_points - a.divergence_rod_points);

            currentPage = 1;
            document.getElementById('kpiShowing').textContent = filteredProjects.length.toLocaleString();
            renderCards();
        }

        function renderCards() {
            const container = document.getElementById('gridContainer');
            container.innerHTML = '';

            const start = (currentPage - 1) * PAGE_SIZE;
            const end = start + PAGE_SIZE;
            const pageItems = filteredProjects.slice(start, end);

            pageItems.forEach(p => {
                const card = document.createElement('div');
                card.className = 'project-card';
                card.onclick = () => openModal(p);

                let statusBadge = `<span class="status-pill status-verified">✓ Verified</span>`;
                if (p.audit_status === 'CRITICAL_DIVERGENCE') {
                    statusBadge = `<span class="status-pill status-alert">⚠️ Divergence Alert</span>`;
                } else if (p.audit_status === 'MODERATE_VARIANCE') {
                    statusBadge = `<span class="status-pill status-variance">⚠️ Variance</span>`;
                }

                card.innerHTML = `
                    <div>
                        <div class="card-top">
                            <div>
                                <span class="proj-id">#${p.project_id}</span>
                                <div class="proj-title">${p.project_name}</div>
                            </div>
                            <div>${statusBadge}</div>
                        </div>

                        <div class="meta-strip">
                            <span class="meta-item">📍 ${p.state}</span>
                            <span class="meta-item">🏢 ${p.agency}</span>
                            <span class="meta-item">💰 ₹${p.original_cost_cr.toLocaleString()} Cr</span>
                            <span class="meta-item">🌐 (${p.latitude.toFixed(2)}°, ${p.longitude.toFixed(2)}°)</span>
                        </div>

                        <!-- 2-Window Natural Optical Zoom Satellite View -->
                        <div class="satellite-window">
                            <div class="sat-box" style="position: relative; overflow: hidden;">
                                <img src="paimana_extracted/satellite_data/tight_optical_zooms/${p.project_id}_T0_BEFORE_ZOOM.jpg" onerror="this.src='${p.tile_baseline_2020}'" alt="T0 Before Natural Zoom" style="width: 100%; height: 100%; object-fit: cover;">
                                <div class="target-reticle" style="width: 40px; height: 40px;"></div>
                                <div class="sat-tag" style="z-index: 10;">⏮️ BEFORE (HD Optical)</div>
                            </div>
                            <div class="sat-box" style="border: 1px solid #2ECC71; position: relative; overflow: hidden;">
                                <img src="paimana_extracted/satellite_data/tight_optical_zooms/${p.project_id}_T1_AFTER_ZOOM.jpg" onerror="this.src='${p.tile_current_2023}'" alt="T1 After Natural Zoom" style="width: 100%; height: 100%; object-fit: cover;">
                                <div class="target-reticle" style="width: 40px; height: 40px;"></div>
                                <div class="sat-tag" style="background: rgba(46, 204, 113, 0.9); border-color: #2ECC71; z-index: 10;">⏭️ AFTER (2.08–2.35 m/px measured)</div>
                            </div>
                        </div>

                        <div class="metrics-block">
                            <div class="meter-row">
                                <span style="color: var(--text-sub);">Reported Physical Progress:</span>
                                <strong>${p.claimed_progress_pct.toFixed(1)}%</strong>
                            </div>
                            <div class="meter-bar">
                                <div class="meter-fill meter-reported" style="width: ${Math.min(p.claimed_progress_pct, 100)}%;"></div>
                            </div>

                            <div class="meter-row">
                                <span style="color: var(--success); font-weight: 600;">Satellite Observed (OCAI):</span>
                                <strong style="color: var(--success);">${p.eo_observed_ocai_pct.toFixed(1)}%</strong>
                            </div>
                            <div class="meter-bar">
                                <div class="meter-fill meter-satellite" style="width: ${Math.min(p.eo_observed_ocai_pct, 100)}%;"></div>
                            </div>

                            <div class="meter-row" style="font-size: 11px; margin-top: 4px;">
                                <span style="color: var(--text-muted);">Variance Discrepancy (ROD):</span>
                                <span style="font-family: 'JetBrains Mono', monospace; font-weight: 700; color: ${p.divergence_rod_points > 10 ? 'var(--danger)' : 'var(--success)'};">
                                    ${p.divergence_rod_points > 0 ? '+' : ''}${p.divergence_rod_points.toFixed(1)} pts
                                </span>
                            </div>
                        </div>
                    </div>

                    <div class="audit-dossier">
                        ${p.showcase_analytical_dossier}
                    </div>
                `;
                container.appendChild(card);
            });

            const totalPages = Math.ceil(filteredProjects.length / PAGE_SIZE) || 1;
            document.getElementById('pageIndicator').textContent = `Page ${currentPage} of ${totalPages} (${filteredProjects.length.toLocaleString()} projects)`;
            document.getElementById('btnPrev').disabled = currentPage === 1;
            document.getElementById('btnNext').disabled = currentPage >= totalPages;
        }

        function navigatePage(delta) {
            currentPage += delta;
            renderCards();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        function openModal(p) {
            const modal = document.getElementById('detailModal');
            const content = document.getElementById('modalContent');

            content.innerHTML = `
                <h2 style="font-size: 20px; font-weight: 800; color: #fff; margin-bottom: 8px;">#${p.project_id}: ${p.project_name}</h2>
                <div style="font-size: 13px; color: var(--text-sub); margin-bottom: 20px;">
                    📂 Sector: <strong>${p.sector}</strong> • State: <strong>${p.state}</strong> • Executing Agency: <strong>${p.agency}</strong>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                    <div style="background: #070f1e; padding: 12px; border-radius: 10px; border: 1px solid var(--border); position: relative;">
                        <div style="position: relative; overflow: hidden; border-radius: 8px; height: 350px;">
                            <img src="paimana_extracted/satellite_data/tight_optical_zooms/${p.project_id}_T0_BEFORE_ZOOM.jpg" onerror="this.src='${p.tile_baseline_2020}'" style="width: 100%; height: 100%; object-fit: cover;">
                            <div class="target-reticle"></div>
                        </div>
                        <div style="font-size: 13px; font-weight: bold; margin-top: 12px; text-align: center; color: var(--text-sub);">⏮️ BEFORE (Historical High-Res Optical)</div>
                    </div>
                    <div style="background: #070f1e; padding: 12px; border-radius: 10px; border: 2px solid #2ECC71; box-shadow: 0 0 15px rgba(46, 204, 113, 0.2); position: relative;">
                         <div style="position: relative; overflow: hidden; border-radius: 8px; height: 350px;">
                            <img src="paimana_extracted/satellite_data/tight_optical_zooms/${p.project_id}_T1_AFTER_ZOOM.jpg" onerror="this.src='${p.tile_current_2023}'" style="width: 100%; height: 100%; object-fit: cover;">
                            <div class="target-reticle"></div>
                        </div>
                        <div style="font-size: 13px; font-weight: bold; margin-top: 12px; text-align: center; color: #2ECC71;">⏭️ AFTER (recent basemap optical, 2.08–2.35 m/px measured)</div>
                    </div>
                </div>

                <div style="background: var(--bg-card); padding: 16px; border-radius: 10px; margin-bottom: 20px;">
                    <h3 style="font-size: 14px; color: var(--primary); margin-bottom: 10px;">Executive Milestone Audit Finding</h3>
                    <p style="font-size: 13px; line-height: 1.6; color: #e2e8f0;">${p.showcase_analytical_dossier}</p>
                </div>

                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; text-align: center;">
                    <div style="background: var(--bg-card); padding: 12px; border-radius: 8px;">
                        <div style="font-size: 11px; color: var(--text-sub);">Sanctioned Capex</div>
                        <div style="font-size: 18px; font-weight: bold; color: var(--accent-orange);">₹${p.original_cost_cr.toLocaleString()} Cr</div>
                    </div>
                    <div style="background: var(--bg-card); padding: 12px; border-radius: 8px;">
                        <div style="font-size: 11px; color: var(--text-sub);">Reported vs Satellite</div>
                        <div style="font-size: 18px; font-weight: bold; color: #fff;">${p.claimed_progress_pct.toFixed(1)}% vs ${p.eo_observed_ocai_pct.toFixed(1)}%</div>
                    </div>
                    <div style="background: var(--bg-card); padding: 12px; border-radius: 8px;">
                        <div style="font-size: 11px; color: var(--text-sub);">Statutory Action</div>
                        <div style="font-size: 15px; font-weight: bold; color: var(--success);">${p.statutory_recommendation}</div>
                    </div>
                </div>
            `;
            modal.style.display = 'flex';
        }

        function closeModal(e) {
            document.getElementById('detailModal').style.display = 'none';
        }
    </script>
</body>
</html>
"""

new_script = js_logic.replace('ARRAY_PLACEHOLDER', array_str)

# Toggle buttons in the header
toggle_buttons = """
        <div style="display: flex; gap: 8px; align-items: center;">
            <button id="btnModeGolden" onclick="switchMode('golden')" style="background: #38bdf8; color: #0b1329; border: none; font-weight: 700; font-size: 12px; padding: 8px 14px; border-radius: 20px; cursor: pointer; transition: all 0.2s; box-shadow: 0 0 10px rgba(56, 189, 248, 0.4);">🌟 Golden 10 Showcase</button>
            <button id="btnModeAll" onclick="switchMode('all')" style="background: rgba(255,255,255,0.08); color: #fff; border: 1px solid var(--border); font-weight: 600; font-size: 12px; padding: 8px 14px; border-radius: 20px; cursor: pointer; transition: all 0.2s;">🌐 All 2,207 Projects</button>
            <div class="top-badge" style="margin-left: 6px;">🛰️ 100% NATURAL OPTICAL ZOOM</div>
        </div>
"""

# Replace badge in header
if '<div class="top-badge">🛰️ 100% NATURAL OPTICAL ZOOM ENABLED</div>' in html_before_script:
    html_before_script = html_before_script.replace('<div class="top-badge">🛰️ 100% NATURAL OPTICAL ZOOM ENABLED</div>', toggle_buttons)
elif '100% NATURAL OPTICAL ZOOM ENABLED' in html_before_script:
    idx_b = html_before_script.find('<div class="top-badge"')
    if idx_b != -1:
        idx_b_end = html_before_script.find('</div>', idx_b) + 6
        html_before_script = html_before_script[:idx_b] + toggle_buttons + html_before_script[idx_b_end:]

final_html = html_before_script + new_script

with open('ALL_2207_PROJECTS_SHOWCASE_GALLERY.html', 'w', encoding='utf-8') as f:
    f.write(final_html)

print("SUCCESS: ALL_2207_PROJECTS_SHOWCASE_GALLERY.html written cleanly!")
