import os

with open('ALL_2207_PROJECTS_SHOWCASE_GALLERY.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Update CSS
css_old = """        /* 3-Window Satellite Compare Window (T0, T1, Heatmap) */
        .satellite-window {
            display: grid; grid-template-columns: 1fr 1fr 1.2fr; gap: 8px; margin-bottom: 14px;
            background: var(--bg-card); padding: 8px; border-radius: 10px; border: 1px solid var(--border);
        }"""
css_new = """        /* 2-Window Satellite Compare Window (T0 Natural, T1 Natural Zoom) */
        .satellite-window {
            display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px;
            background: var(--bg-card); padding: 8px; border-radius: 10px; border: 1px solid var(--border);
        }"""
html = html.replace(css_old, css_new)

# 2. Update Card HTML
card_old = """                        <!-- 3-Window Satellite View: Baseline vs Current vs Glowing Heatmap -->
                        <div class="satellite-window">
                            <div class="sat-box">
                                <img src="${p.tile_baseline_2020}" alt="T0 Baseline (2020)">
                                <div class="sat-tag">T0 (2020)</div>
                            </div>
                            <div class="sat-box">
                                <img src="${p.tile_current_2023}" alt="T1 Current (2023)">
                                <div class="sat-tag">T1 (2023)</div>
                            </div>
                            <div class="sat-box" style="border: 1px solid #ff6a00;">
                                <img src="${heatmapImg}" alt="Multi-Spectral Change Heatmap">
                                <div class="sat-tag sat-tag-heat">🔥 Change Heatmap</div>
                            </div>
                        </div>"""

card_new = """                        <!-- 2-Window Natural Optical Zoom Satellite View -->
                        <div class="satellite-window">
                            <div class="sat-box">
                                <img src="paimana_extracted/satellite_data/tight_optical_zooms/${p.project_id}_T0_BEFORE_ZOOM.jpg" onerror="this.src='${p.tile_baseline_2020}'" alt="T0 Before Natural Zoom">
                                <div class="sat-tag">📸 BEFORE (2020 Zoom)</div>
                            </div>
                            <div class="sat-box" style="border: 1px solid #2ECC71;">
                                <img src="paimana_extracted/satellite_data/tight_optical_zooms/${p.project_id}_T1_AFTER_ZOOM.jpg" onerror="this.src='${p.tile_current_2023}'" alt="T1 After Natural Zoom">
                                <div class="sat-tag" style="background: rgba(46, 204, 113, 0.9); border-color: #2ECC71;">📸 AFTER (Sub-Meter)</div>
                            </div>
                        </div>"""
html = html.replace(card_old, card_new)


# 3. Update Modal HTML
modal_old = """                <div style="display: grid; grid-template-columns: 1fr 1fr 1.2fr; gap: 14px; margin-bottom: 20px;">
                    <div style="background: #070f1e; padding: 10px; border-radius: 8px; border: 1px solid var(--border);">
                        <img src="${p.tile_baseline_2020}" style="width: 100%; height: 230px; object-fit: cover; border-radius: 6px;">
                        <div style="font-size: 11px; font-weight: bold; margin-top: 8px; text-align: center; color: var(--text-sub);">T0 Baseline (2020)</div>
                    </div>
                    <div style="background: #070f1e; padding: 10px; border-radius: 8px; border: 1px solid var(--border);">
                        <img src="${p.tile_current_2023}" style="width: 100%; height: 230px; object-fit: cover; border-radius: 6px;">
                        <div style="font-size: 11px; font-weight: bold; margin-top: 8px; text-align: center; color: var(--success);">T1 Recent Status (2023)</div>
                    </div>
                    <div style="background: #070f1e; padding: 10px; border-radius: 8px; border: 1px solid var(--accent-orange);">
                        <img src="${heatmapImg}" style="width: 100%; height: 230px; object-fit: cover; border-radius: 6px;">
                        <div style="font-size: 11px; font-weight: bold; margin-top: 8px; text-align: center; color: #ff8c38;">🔥 Multi-Spectral Change Heatmap (ΔNDBI)</div>
                    </div>
                </div>"""

modal_new = """                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                    <div style="background: #070f1e; padding: 12px; border-radius: 10px; border: 1px solid var(--border);">
                        <img src="paimana_extracted/satellite_data/tight_optical_zooms/${p.project_id}_T0_BEFORE_ZOOM.jpg" onerror="this.src='${p.tile_baseline_2020}'" style="width: 100%; height: 350px; object-fit: cover; border-radius: 8px;">
                        <div style="font-size: 13px; font-weight: bold; margin-top: 12px; text-align: center; color: var(--text-sub);">📸 BEFORE (2020 Baseline Orbit - Anti-Aliased)</div>
                    </div>
                    <div style="background: #070f1e; padding: 12px; border-radius: 10px; border: 2px solid #2ECC71; box-shadow: 0 0 15px rgba(46, 204, 113, 0.2);">
                        <img src="paimana_extracted/satellite_data/tight_optical_zooms/${p.project_id}_T1_AFTER_ZOOM.jpg" onerror="this.src='${p.tile_current_2023}'" style="width: 100%; height: 350px; object-fit: cover; border-radius: 8px;">
                        <div style="font-size: 13px; font-weight: bold; margin-top: 12px; text-align: center; color: #2ECC71;">📸 AFTER (Recent Maxar Sub-Meter Optical Zoom)</div>
                    </div>
                </div>"""
html = html.replace(modal_old, modal_new)

# Update the header text just to remove the heatmap text
html = html.replace('Unified Multi-Spectral Change Detection Heatmaps', 'Pinpoint Accuracy Satellite Zoom Before/After')
html = html.replace('🔥 HUMAN-EYE CHANGE DETECTION ENABLED', '📸 100% NATURAL OPTICAL ZOOM ENABLED')
html = html.replace('Multi-Spectral Change Heatmaps', 'Natural Sub-Meter Optical Zooms')

with open('ALL_2207_PROJECTS_SHOWCASE_GALLERY.html', 'w', encoding='utf-8') as f:
    f.write(html)
print('HTML updated successfully.')
