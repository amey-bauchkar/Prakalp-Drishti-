"""
Generate Side-by-Side Natural Optical Zoom Card (Before vs After) for GPRA Delhi.
Zero heatmaps. 100% natural, true-color, high-definition satellite photography.
"""

import os
from PIL import Image
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

img_before = Image.open("paimana_extracted/satellite_data/tight_optical_zooms/400188_T0_BEFORE_ZOOM.jpg")
img_after = Image.open("paimana_extracted/satellite_data/tight_optical_zooms/400188_T1_AFTER_ZOOM.jpg")

fig, axes = plt.subplots(1, 2, figsize=(18, 9), dpi=160)
plt.subplots_adjust(wspace=0.06, left=0.03, right=0.97, top=0.88, bottom=0.06)
fig.patch.set_facecolor('#0B192C')

fig.suptitle("PROJECT #400188: GPRA RESIDENTIAL COLONIES REDEVELOPMENT (DELHI)\n100% NATURAL OPTICAL SATELLITE ZOOM (BEFORE vs AFTER)", 
             color="#FFFFFF", fontsize=15, weight='bold', y=0.95)

# Panel 1: Before
axes[0].imshow(img_before)
axes[0].set_title("📸 BEFORE (2020 Baseline Orbit)\nOld Low-Rise Bungalows & Ground Clearance", color="#FFFFFF", fontsize=12, pad=10, weight='bold')
axes[0].axis('off')
for spine in axes[0].spines.values():
    spine.set_edgecolor('#2C5380')
    spine.set_linewidth(2)
    spine.set_visible(True)

# Panel 2: After
axes[1].imshow(img_after)
axes[1].set_title("📸 AFTER (recent basemap optical zoom, 2.08–2.35 m/px measured)\nNew Multi-Story World Trade Center & High-Rise Tower Blocks", color="#2ECC71", fontsize=12, pad=10, weight='bold')
axes[1].axis('off')
for spine in axes[1].spines.values():
    spine.set_edgecolor('#2ECC71')
    spine.set_linewidth(3)
    spine.set_visible(True)

out_file = "GPRA_DELHI_NATURAL_ZOOM_BEFORE_AFTER.png"
plt.savefig(out_file, facecolor=fig.get_facecolor(), edgecolor='none', bbox_inches='tight')
plt.close(fig)

print(f"🎉 NATURAL OPTICAL ZOOM CARD SAVED: {out_file}")
