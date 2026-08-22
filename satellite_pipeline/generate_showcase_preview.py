"""
Generate a 6-Project Showcase Preview Montage across diverse sectors and states
to visually demonstrate the 2,207 project showcase system.
"""

import os
import json
import numpy as np
from PIL import Image
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, ".."))
JSON_PATH = os.path.join(PROJECT_ROOT, "paimana_extracted", "satellite_data", "ALL_2207_PROJECT_SHOWCASE_DOSSIERS.json")

with open(JSON_PATH, "r", encoding="utf-8") as f:
    all_projects = json.load(f)

# Pick 6 diverse projects across India
selected_ids = ["701126", "618399", "400062", "709754", "612213", "619156"]
selected = [p for p in all_projects if p["project_id"] in selected_ids]

# If any ID missing, pick other diverse projects
if len(selected) < 6:
    selected = all_projects[10:16]

fig, axes = plt.subplots(2, 3, figsize=(22, 13), dpi=150)
plt.subplots_adjust(wspace=0.18, hspace=0.28, left=0.04, right=0.96, top=0.90, bottom=0.04)
fig.patch.set_facecolor('#0B192C')

fig.suptitle("PRAKALP-DRISHTI: CROSS-SECTOR SATELLITE SHOWCASE DOSSIERS (SAMPLE PROFILES)", 
             color="#FFFFFF", fontsize=16, weight='bold', y=0.96)

for idx, p in enumerate(selected[:6]):
    row = idx // 3
    col = idx % 3
    ax = axes[row, col]
    ax.set_facecolor('#1E3E62')
    ax.axis('off')
    
    # Outer Card Box
    card_box = patches.FancyBboxPatch((0.02, 0.02), 0.96, 0.96, boxstyle="round,pad=0.03", 
                                      facecolor='#1E3E62', edgecolor='#2C5380', linewidth=1.5)
    ax.add_patch(card_box)
    
    # Header: Title & Sector
    pname = (p["project_name"][:42] + '...') if len(p["project_name"]) > 42 else p["project_name"]
    ax.text(0.06, 0.92, f"#{p['project_id']}: {pname}", color="#FFFFFF", fontsize=11, weight='bold')
    ax.text(0.06, 0.86, f"🏢 {p['agency']}  •  📍 {p['sector']} ({p['state']})", color="#DAE1E9", fontsize=9)
    ax.text(0.06, 0.80, f"💰 Capex: ₹{p['original_cost_cr']:,.0f} Cr  •  GPS: ({p['latitude']:.2f}°, {p['longitude']:.2f}°)", color="#FF6500", fontsize=9, weight='bold')
    
    # Try to load satellite image
    tile_path = os.path.join(PROJECT_ROOT, p["tile_current_2023"])
    if os.path.exists(tile_path):
        try:
            sat_img = Image.open(tile_path).convert("RGB")
            # Inset axes for satellite photo
            inset_ax = ax.inset_axes([0.06, 0.38, 0.88, 0.38])
            inset_ax.imshow(sat_img)
            inset_ax.axis('off')
            inset_ax.text(0.03, 0.08, f"ESA Copernicus Sentinel-2 Orbit (Cell: {p['grid_cell']})", 
                          transform=inset_ax.transAxes, color="#FFFFFF", fontsize=7.5, weight='bold',
                          bbox=dict(boxstyle="round,pad=0.2", facecolor="#0B192C", alpha=0.85))
        except Exception:
            pass
            
    # Progress Comparison Bars
    claimed = p['claimed_progress_pct']
    observed = p['eo_observed_ocai_pct']
    div = p['divergence_rod_points']
    
    # Progress Texts
    ax.text(0.06, 0.31, f"Reported Progress: {claimed:.1f}%", color="#FFFFFF", fontsize=8.5)
    ax.text(0.55, 0.31, f"Satellite Observed: {observed:.1f}%", color="#2ECC71", fontsize=8.5, weight='bold')
    
    # Disbursal Status Badge
    status_text = "VERIFIED ON TRACK" if p['audit_status'] == "VERIFIED_ON_TRACK" else "ALERT"
    status_color = "#2ECC71" if p['audit_status'] == "VERIFIED_ON_TRACK" else "#E74C3C"
    ax.text(0.70, 0.92, f"[{status_text}]", color=status_color, fontsize=9.5, weight='bold')
    
    # Analytical Summary Text
    dossier_snippet = (p['showcase_analytical_dossier'][:165] + '...') if len(p['showcase_analytical_dossier']) > 165 else p['showcase_analytical_dossier']
    ax.text(0.06, 0.12, f"Audit Finding:\n{dossier_snippet}", color="#DAE1E9", fontsize=7.8, style='italic',
            bbox=dict(boxstyle="round,pad=0.3", facecolor="#122844", edgecolor="#2C5380", alpha=0.9))

out_preview = os.path.join(PROJECT_ROOT, "DIVERSE_PROJECTS_SHOWCASE_PREVIEW.png")
plt.savefig(out_preview, facecolor=fig.get_facecolor(), edgecolor='none', bbox_inches='tight')
plt.close(fig)

print(f"🎉 DIVERSE PROJECTS SHOWCASE PREVIEW SAVED: {out_preview}")
