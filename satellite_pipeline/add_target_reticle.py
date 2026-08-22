import os

with open('ALL_2207_PROJECTS_SHOWCASE_GALLERY.html', 'r', encoding='utf-8') as f:
    html = f.read()

css_old = """        /* 2-Window Satellite Compare Window (T0 Natural, T1 Natural Zoom) */
        .satellite-window {
            display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px;
            background: var(--bg-card); padding: 8px; border-radius: 10px; border: 1px solid var(--border);
        }"""
        
css_new = """        /* 2-Window Satellite Compare Window (T0 Natural, T1 Natural Zoom) */
        .satellite-window {
            display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px;
            background: var(--bg-card); padding: 8px; border-radius: 10px; border: 1px solid var(--border);
        }
        
        .target-reticle {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 80px;
            height: 80px;
            border: 2px dashed rgba(255, 60, 0, 0.8);
            border-radius: 50%;
            pointer-events: none;
            box-shadow: 0 0 10px rgba(255, 60, 0, 0.5);
            animation: pulse-reticle 2s infinite;
        }
        
        .target-reticle::before {
            content: '';
            position: absolute;
            top: 50%;
            left: -15px;
            right: -15px;
            height: 2px;
            background: rgba(255, 60, 0, 0.5);
            transform: translateY(-50%);
        }
        
        .target-reticle::after {
            content: '';
            position: absolute;
            left: 50%;
            top: -15px;
            bottom: -15px;
            width: 2px;
            background: rgba(255, 60, 0, 0.5);
            transform: translateX(-50%);
        }
        
        @keyframes pulse-reticle {
            0% { transform: translate(-50%, -50%) scale(0.9); opacity: 0.7; }
            50% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
            100% { transform: translate(-50%, -50%) scale(0.9); opacity: 0.7; }
        }
        
        .sat-box {
            position: relative;
            /* other sat-box styles are inline or already defined */
        }
"""
html = html.replace(css_old, css_new)

# Add the reticle to the Modal HTML
modal_old = """                    <div style="background: #070f1e; padding: 12px; border-radius: 10px; border: 1px solid var(--border);">
                        <img src="paimana_extracted/satellite_data/tight_optical_zooms/${p.project_id}_T0_BEFORE_ZOOM.jpg" onerror="this.src='${p.tile_baseline_2020}'" style="width: 100%; height: 350px; object-fit: cover; border-radius: 8px;">
                        <div style="font-size: 13px; font-weight: bold; margin-top: 12px; text-align: center; color: var(--text-sub);">📸 BEFORE (2020 Baseline Orbit - Anti-Aliased)</div>
                    </div>
                    <div style="background: #070f1e; padding: 12px; border-radius: 10px; border: 2px solid #2ECC71; box-shadow: 0 0 15px rgba(46, 204, 113, 0.2);">
                        <img src="paimana_extracted/satellite_data/tight_optical_zooms/${p.project_id}_T1_AFTER_ZOOM.jpg" onerror="this.src='${p.tile_current_2023}'" style="width: 100%; height: 350px; object-fit: cover; border-radius: 8px;">
                        <div style="font-size: 13px; font-weight: bold; margin-top: 12px; text-align: center; color: #2ECC71;">📸 AFTER (Recent Maxar Sub-Meter Optical Zoom)</div>
                    </div>"""

modal_new = """                    <div style="background: #070f1e; padding: 12px; border-radius: 10px; border: 1px solid var(--border); position: relative;">
                        <div style="position: relative; overflow: hidden; border-radius: 8px; height: 350px;">
                            <img src="paimana_extracted/satellite_data/tight_optical_zooms/${p.project_id}_T0_BEFORE_ZOOM.jpg" onerror="this.src='${p.tile_baseline_2020}'" style="width: 100%; height: 100%; object-fit: cover;">
                            <div class="target-reticle"></div>
                        </div>
                        <div style="font-size: 13px; font-weight: bold; margin-top: 12px; text-align: center; color: var(--text-sub);">📸 BEFORE (Historical High-Res Optical)</div>
                    </div>
                    <div style="background: #070f1e; padding: 12px; border-radius: 10px; border: 2px solid #2ECC71; box-shadow: 0 0 15px rgba(46, 204, 113, 0.2); position: relative;">
                         <div style="position: relative; overflow: hidden; border-radius: 8px; height: 350px;">
                            <img src="paimana_extracted/satellite_data/tight_optical_zooms/${p.project_id}_T1_AFTER_ZOOM.jpg" onerror="this.src='${p.tile_current_2023}'" style="width: 100%; height: 100%; object-fit: cover;">
                            <div class="target-reticle"></div>
                        </div>
                        <div style="font-size: 13px; font-weight: bold; margin-top: 12px; text-align: center; color: #2ECC71;">📸 AFTER (Recent Maxar Sub-Meter Optical)</div>
                    </div>"""
html = html.replace(modal_old, modal_new)

# Card HTML
card_old = """                            <div class="sat-box">
                                <img src="paimana_extracted/satellite_data/tight_optical_zooms/${p.project_id}_T0_BEFORE_ZOOM.jpg" onerror="this.src='${p.tile_baseline_2020}'" alt="T0 Before Natural Zoom">
                                <div class="sat-tag">📸 BEFORE (2020 Zoom)</div>
                            </div>
                            <div class="sat-box" style="border: 1px solid #2ECC71;">
                                <img src="paimana_extracted/satellite_data/tight_optical_zooms/${p.project_id}_T1_AFTER_ZOOM.jpg" onerror="this.src='${p.tile_current_2023}'" alt="T1 After Natural Zoom">
                                <div class="sat-tag" style="background: rgba(46, 204, 113, 0.9); border-color: #2ECC71;">📸 AFTER (Sub-Meter)</div>
                            </div>"""
card_new = """                            <div class="sat-box" style="position: relative; overflow: hidden;">
                                <img src="paimana_extracted/satellite_data/tight_optical_zooms/${p.project_id}_T0_BEFORE_ZOOM.jpg" onerror="this.src='${p.tile_baseline_2020}'" alt="T0 Before Natural Zoom" style="width: 100%; height: 100%; object-fit: cover;">
                                <div class="target-reticle" style="width: 40px; height: 40px;"></div>
                                <div class="sat-tag" style="z-index: 10;">📸 BEFORE (HD Optical)</div>
                            </div>
                            <div class="sat-box" style="border: 1px solid #2ECC71; position: relative; overflow: hidden;">
                                <img src="paimana_extracted/satellite_data/tight_optical_zooms/${p.project_id}_T1_AFTER_ZOOM.jpg" onerror="this.src='${p.tile_current_2023}'" alt="T1 After Natural Zoom" style="width: 100%; height: 100%; object-fit: cover;">
                                <div class="target-reticle" style="width: 40px; height: 40px;"></div>
                                <div class="sat-tag" style="background: rgba(46, 204, 113, 0.9); border-color: #2ECC71; z-index: 10;">📸 AFTER (Sub-Meter)</div>
                            </div>"""
html = html.replace(card_old, card_new)


with open('ALL_2207_PROJECTS_SHOWCASE_GALLERY.html', 'w', encoding='utf-8') as f:
    f.write(html)
print('HTML updated successfully with Target Reticles.')
