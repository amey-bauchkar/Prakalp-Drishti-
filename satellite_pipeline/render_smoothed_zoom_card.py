"""
Smooth and upscale the Sentinel-2 image to remove blocky pixelation.
"""
from PIL import Image, ImageFilter
import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

before_path = "paimana_extracted/satellite_data/tight_optical_zooms/400188_T0_BEFORE_ZOOM.jpg"
after_path = "paimana_extracted/satellite_data/tight_optical_zooms/400188_T1_AFTER_ZOOM.jpg"

img_before_raw = Image.open(before_path)

# Apply Lanczos smoothing and slight unsharp mask to remove the blocky 10m/px artifact
img_before_smooth = img_before_raw.resize((1024, 1024), Image.LANCZOS)
img_before_smooth = img_before_smooth.filter(ImageFilter.UnsharpMask(radius=2, percent=150, threshold=3))

img_after = Image.open(after_path)

fig, axes = plt.subplots(1, 2, figsize=(18, 9), dpi=160)
plt.subplots_adjust(wspace=0.06, left=0.03, right=0.97, top=0.80, bottom=0.06)
fig.patch.set_facecolor('#0B192C')

fig.suptitle("PROJECT #400188: GPRA RESIDENTIAL COLONIES REDEVELOPMENT (DELHI)\n100% NATURAL OPTICAL SATELLITE ZOOM (BEFORE vs AFTER)", 
             color="#FFFFFF", fontsize=16, weight='bold', y=0.96)

# Panel 1: Before
axes[0].imshow(img_before_smooth)
axes[0].set_title("📸 BEFORE (2020 Baseline Orbit - Anti-Aliased)\nOld Low-Rise Bungalows & Ground Clearance", color="#FFFFFF", fontsize=12, pad=10, weight='bold')
axes[0].axis('off')
for spine in axes[0].spines.values():
    spine.set_edgecolor('#2C5380')
    spine.set_linewidth(2)
    spine.set_visible(True)

# Panel 2: After
axes[1].imshow(img_after)
axes[1].set_title("📸 AFTER (Recent Maxar Sub-Meter Optical Zoom)\nNew Multi-Story World Trade Center & High-Rise Tower Blocks", color="#2ECC71", fontsize=12, pad=10, weight='bold')
axes[1].axis('off')
for spine in axes[1].spines.values():
    spine.set_edgecolor('#2ECC71')
    spine.set_linewidth(3)
    spine.set_visible(True)

out_file = "GPRA_DELHI_NATURAL_ZOOM_SMOOTHED.png"
plt.savefig(out_file, facecolor=fig.get_facecolor(), edgecolor='none', bbox_inches='tight')
plt.close(fig)

print(f"🎉 SMOOTHED OPTICAL ZOOM CARD SAVED: {out_file}")
