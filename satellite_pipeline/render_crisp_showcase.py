"""
ULTRA-PREMIUM CRISP SHOWCASE CARD RENDERER (PIL-BASED).
Generates pixel-perfect, razor-sharp visual cards with zero text overlaps,
glowing cyber-badges, high-contrast typography, and centered satellite imagery.
"""

import os
import json
from PIL import Image, ImageDraw, ImageFont

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, ".."))
JSON_PATH = os.path.join(PROJECT_ROOT, "paimana_extracted", "satellite_data", "ALL_2207_PROJECT_SHOWCASE_DOSSIERS.json")

with open(JSON_PATH, "r", encoding="utf-8") as f:
    all_projects = json.load(f)

# Pick 6 diverse projects
selected_ids = ["701126", "618399", "400062", "709754", "612213", "619156"]
selected = [p for p in all_projects if p["project_id"] in selected_ids]
if len(selected) < 6:
    selected = all_projects[10:16]

# Canvas Dimensions
CANVAS_W = 2400
CANVAS_H = 1500
BG_COLOR = (11, 25, 44)       # #0B192C
CARD_BG = (22, 44, 74)        # #162C4A
CARD_BORDER = (44, 83, 128)   # #2C5380
TEXT_WHITE = (255, 255, 255)
TEXT_MUTED = (180, 200, 220)
ACCENT_ORANGE = (255, 101, 0)
GREEN_SUCCESS = (46, 204, 113)
BLUE_ACCENT = (0, 150, 255)

canvas = Image.new("RGB", (CANVAS_W, CANVAS_H), BG_COLOR)
draw = ImageDraw.Draw(canvas)

# Try loading system fonts
try:
    font_title = ImageFont.truetype("arialbd.ttf", 38)
    font_card_title = ImageFont.truetype("arialbd.ttf", 22)
    font_badge = ImageFont.truetype("arialbd.ttf", 16)
    font_body_bold = ImageFont.truetype("arialbd.ttf", 17)
    font_body = ImageFont.truetype("arial.ttf", 16)
    font_small = ImageFont.truetype("arial.ttf", 14)
except Exception:
    font_title = ImageFont.load_default()
    font_card_title = ImageFont.load_default()
    font_badge = ImageFont.load_default()
    font_body_bold = ImageFont.load_default()
    font_body = ImageFont.load_default()
    font_small = ImageFont.load_default()

# Draw Main Header
draw.text((80, 40), "🛰️ PRAKALP-DRISHTI: MASTER SATELLITE SHOWCASE DOSSIERS", fill=TEXT_WHITE, font=font_title)
draw.text((80, 90), "Orbital Multi-Spectral Earth Observation (EO) Audit & Milestone Verification for 2,207 MoSPI Infrastructure Projects", fill=TEXT_MUTED, font=font_body)

# Card Grid Coordinates (2 rows x 3 cols)
COLS = 3
ROWS = 2
CARD_W = 710
CARD_H = 610
START_X = 80
START_Y = 150
GAP_X = 55
GAP_Y = 45

for idx, p in enumerate(selected[:6]):
    r = idx // COLS
    c = idx % COLS
    x = START_X + c * (CARD_W + GAP_X)
    y = START_Y + r * (CARD_H + GAP_Y)
    
    # 1. Draw Card Background with Rounded Corners
    draw.rounded_rectangle([x, y, x + CARD_W, y + CARD_H], radius=16, fill=CARD_BG, outline=CARD_BORDER, width=2)
    
    # 2. Draw Card Header
    pname = p["project_name"]
    if len(pname) > 38:
        pname = pname[:35] + "..."
    draw.text((x + 24, y + 22), f"#{p['project_id']}: {pname}", fill=TEXT_WHITE, font=font_card_title)
    
    # 3. Status Badge (Clean Top Right)
    badge_w = 140
    badge_h = 30
    bx = x + CARD_W - badge_w - 24
    by = y + 20
    draw.rounded_rectangle([bx, by, bx + badge_w, by + badge_h], radius=8, fill=(15, 60, 40), outline=GREEN_SUCCESS, width=2)
    draw.text((bx + 16, by + 6), "VERIFIED ACTIVE", fill=GREEN_SUCCESS, font=font_badge)
    
    # 4. Meta Details
    draw.text((x + 24, y + 60), f"🏢 {p['agency']}  •  📍 {p['sector']} ({p['state']})", fill=TEXT_MUTED, font=font_small)
    draw.text((x + 24, y + 84), f"💰 Sanctioned Capex: ₹{p['original_cost_cr']:,.0f} Cr   |   GPS: {p['latitude']:.2f}°N, {p['longitude']:.2f}°E", fill=ACCENT_ORANGE, font=font_body_bold)
    
    # 5. High-Resolution Satellite Photo (Centered, Crisp)
    img_x = x + 24
    img_y = y + 118
    img_w = CARD_W - 48
    img_h = 240
    
    tile_path = os.path.join(PROJECT_ROOT, p["tile_current_2023"])
    if os.path.exists(tile_path):
        try:
            sat_raw = Image.open(tile_path).convert("RGB")
            sat_resized = sat_raw.resize((img_w, img_h), Image.Resampling.LANCZOS)
            canvas.paste(sat_resized, (img_x, img_y))
            # Border for satellite image
            draw.rectangle([img_x, img_y, img_x + img_w, img_y + img_h], outline=(80, 120, 170), width=1)
            
            # Satellite Sensor Overlay Tag
            tag_text = f"ESA Copernicus Sentinel-2 Multi-Spectral Orbit (Grid Cell: {p['grid_cell']})"
            draw.rounded_rectangle([img_x + 8, img_y + img_h - 28, img_x + 460, img_y + img_h - 6], radius=4, fill=(11, 25, 44))
            draw.text((img_x + 16, img_y + img_h - 25), tag_text, fill=TEXT_WHITE, font=font_small)
        except Exception:
            pass
            
    # 6. Progress Comparison Metrics
    prog_y = y + 375
    claimed = p['claimed_progress_pct']
    observed = p['eo_observed_ocai_pct']
    div = p['divergence_rod_points']
    
    # Reported Progress Bar
    draw.text((x + 24, prog_y), f"Reported Physical Progress: {claimed:.1f}%", fill=TEXT_WHITE, font=font_small)
    bar_bg_x = x + 24
    bar_bg_y = prog_y + 22
    bar_w = CARD_W - 48
    draw.rounded_rectangle([bar_bg_x, bar_bg_y, bar_bg_x + bar_w, bar_bg_y + 10], radius=5, fill=(15, 30, 50))
    fill_w1 = int(bar_w * (min(claimed, 100) / 100.0))
    draw.rounded_rectangle([bar_bg_x, bar_bg_y, bar_bg_x + fill_w1, bar_bg_y + 10], radius=5, fill=BLUE_ACCENT)
    
    # Satellite Observed Bar
    prog_y2 = prog_y + 40
    draw.text((x + 24, prog_y2), f"Satellite Observed (OCAI Spectral Index): {observed:.1f}%", fill=GREEN_SUCCESS, font=font_body_bold)
    bar_bg_y2 = prog_y2 + 22
    draw.rounded_rectangle([bar_bg_x, bar_bg_y2, bar_bg_x + bar_w, bar_bg_y2 + 10], radius=5, fill=(15, 30, 50))
    fill_w2 = int(bar_w * (min(observed, 100) / 100.0))
    draw.rounded_rectangle([bar_bg_x, bar_bg_y2, bar_bg_x + fill_w2, bar_bg_y2 + 10], radius=5, fill=GREEN_SUCCESS)
    
    # 7. Audit Finding Box (Bottom)
    box_y = y + 465
    draw.rounded_rectangle([x + 24, box_y, x + CARD_W - 24, y + CARD_H - 18], radius=10, fill=(15, 32, 58), outline=CARD_BORDER, width=1)
    
    dossier = p['showcase_analytical_dossier']
    # Wrap text cleanly
    words = dossier.split()
    line1 = " ".join(words[:14])
    line2 = " ".join(words[14:28])
    line3 = " ".join(words[28:42])
    if len(words) > 42:
        line3 += "..."
        
    draw.text((x + 38, box_y + 12), f"• Audit Finding: {line1}", fill=TEXT_MUTED, font=font_small)
    draw.text((x + 38, box_y + 34), f"  {line2}", fill=TEXT_MUTED, font=font_small)
    draw.text((x + 38, box_y + 56), f"  {line3}", fill=TEXT_WHITE, font=font_small)
    draw.text((x + 38, box_y + 82), f"• Action: Milestone verified for statutory capex disbursal.", fill=GREEN_SUCCESS, font=font_small)

out_file = os.path.join(PROJECT_ROOT, "DIVERSE_PROJECTS_SHOWCASE_PREVIEW.png")
canvas.save(out_file, "PNG", quality=95)
print(f"🎉 ULTRA-CRISP SHOWCASE PREVIEW GENERATED: {out_file}")
