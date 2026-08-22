"""
PRAKALP-DRISHTI: Master PowerPoint Generator (16-Slide Complete Edition)
Incorporates all peer-review feedback (Claude, Gemini Deep Research, ChatGPT)
AND the friend's enhancements & 2 killer add-on models:
1. ADD-ON 1: DPR-QUALITY SCORER (Pre-Election 79.1% Rush Solver)
2. ADD-ON 2: VARSHA-SPEED (Climate Working-Window Optimizer)
3. Real-world case studies: Mumbai Metro, Odisha Coal Chain, 100km Highway, Western DFC
4. UI Enhancements: Interactive What-If Sliders, Encrypted QR Codes on PDF Briefs
"""

import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

OUTPUT_FILE = "PRAKALP_DRISHTI_MASTER_DECK.pptx"

prs = Presentation()
prs.slide_width = Inches(13.333)  # 16:9 widescreen
prs.slide_height = Inches(7.5)
blank_layout = prs.slide_layouts[6]

# Theme Colors
C_NAVY_DARK = RGBColor(11, 25, 44)       # #0B192C
C_NAVY_MED = RGBColor(30, 62, 98)        # #1E3E62
C_ORANGE = RGBColor(255, 101, 0)         # #FF6500 Accent
C_GOLD = RGBColor(241, 196, 15)          # #F1C40F Highlight
C_WHITE = RGBColor(255, 255, 255)
C_LIGHT_BG = RGBColor(245, 247, 250)     # #F5F7FA
C_DARK_TEXT = RGBColor(20, 30, 45)
C_MUTED_TEXT = RGBColor(100, 115, 130)
C_CARD_BG = RGBColor(255, 255, 255)
C_CARD_BORDER = RGBColor(218, 225, 233)
C_ACCENT_BLUE = RGBColor(0, 122, 255)
C_SUCCESS_GREEN = RGBColor(46, 204, 113)
C_DANGER_RED = RGBColor(231, 76, 60)

def add_header(slide, title_text, category_text="PRAKALP-DRISHTI | SIH 2026 MASTER ORIENTATION", is_dark=False):
    tb_cat = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(11.7), Inches(0.3))
    tf_cat = tb_cat.text_frame
    tf_cat.word_wrap = True
    tf_cat.margin_left = tf_cat.margin_right = tf_cat.margin_top = tf_cat.margin_bottom = 0
    p_cat = tf_cat.paragraphs[0]
    p_cat.text = category_text.upper()
    p_cat.font.size = Pt(10)
    p_cat.font.bold = True
    p_cat.font.color.rgb = C_ORANGE
    
    tb_title = slide.shapes.add_textbox(Inches(0.8), Inches(0.7), Inches(11.7), Inches(0.6))
    tf_title = tb_title.text_frame
    tf_title.word_wrap = True
    tf_title.margin_left = tf_title.margin_right = tf_title.margin_top = tf_title.margin_bottom = 0
    p_title = tf_title.paragraphs[0]
    p_title.text = title_text
    p_title.font.size = Pt(22)
    p_title.font.bold = True
    p_title.font.color.rgb = C_WHITE if is_dark else C_NAVY_DARK

def create_card(slide, left, top, width, height, bg_color=C_CARD_BG, border_color=C_CARD_BORDER):
    shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
    shape.fill.solid()
    shape.fill.fore_color.rgb = bg_color
    if border_color:
        shape.line.color.rgb = border_color
        shape.line.width = Pt(1.5)
    else:
        shape.line.fill.background()
    return shape

# ==============================================================================
# SLIDE 1: Title Slide (Dark Theme)
# ==============================================================================
slide1 = prs.slides.add_slide(blank_layout)
bg1 = slide1.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height)
bg1.fill.solid()
bg1.fill.fore_color.rgb = C_NAVY_DARK
bg1.line.fill.background()

tb = slide1.shapes.add_textbox(Inches(1.0), Inches(1.8), Inches(11.3), Inches(3.8))
tf = tb.text_frame
tf.word_wrap = True

p0 = tf.paragraphs[0]
p0.text = "SMART INDIA HACKATHON 2026  •  PROBLEM STATEMENT ID: SIH26103"
p0.font.size = Pt(12)
p0.font.bold = True
p0.font.color.rgb = C_ORANGE
p0.space_after = Pt(14)

p1 = tf.add_paragraph()
p1.text = "PRAKALP-DRISHTI"
p1.font.size = Pt(44)
p1.font.bold = True
p1.font.color.rgb = C_WHITE
p1.space_after = Pt(8)

p2 = tf.add_paragraph()
p2.text = "National Infrastructure Decision Intelligence Platform"
p2.font.size = Pt(20)
p2.font.color.rgb = C_GOLD
p2.space_after = Pt(20)

p3 = tf.add_paragraph()
p3.text = "The Autonomous Predictive, Earth-Observation & Prescriptive Decision Layer for MoSPI's PAIMANA"
p3.font.size = Pt(13)
p3.font.color.rgb = RGBColor(180, 200, 220)

# Footer Badges
card_f1 = create_card(slide1, Inches(1.0), Inches(5.8), Inches(3.4), Inches(0.9), C_NAVY_MED, None)
tb_f1 = slide1.shapes.add_textbox(Inches(1.2), Inches(5.9), Inches(3.0), Inches(0.7))
tf_f1 = tb_f1.text_frame
p_f1 = tf_f1.paragraphs[0]
p_f1.text = "🏛️ Official June 2026 Baseline"
p_f1.font.size = Pt(10)
p_f1.font.color.rgb = C_ORANGE
p_f1_val = tf_f1.add_paragraph()
p_f1_val.text = "1,847 Ongoing | ₹40.54L Cr"
p_f1_val.font.size = Pt(12.5)
p_f1_val.font.bold = True
p_f1_val.font.color.rgb = C_WHITE

card_f2 = create_card(slide1, Inches(4.7), Inches(5.8), Inches(3.4), Inches(0.9), C_NAVY_MED, None)
tb_f2 = slide1.shapes.add_textbox(Inches(4.9), Inches(5.9), Inches(3.0), Inches(0.7))
tf_f2 = tb_f2.text_frame
p_f2 = tf_f2.paragraphs[0]
p_f2.text = "📊 Total Analyzed Corpus"
p_f2.font.size = Pt(10)
p_f2.font.color.rgb = C_ORANGE
p_f2_val = tf_f2.add_paragraph()
p_f2_val.text = "2,207 Project Records"
p_f2_val.font.size = Pt(12.5)
p_f2_val.font.bold = True
p_f2_val.font.color.rgb = C_WHITE

card_f3 = create_card(slide1, Inches(8.4), Inches(5.8), Inches(3.9), Inches(0.9), C_NAVY_MED, None)
tb_f3 = slide1.shapes.add_textbox(Inches(8.6), Inches(5.9), Inches(3.5), Inches(0.7))
tf_f3 = tb_f3.text_frame
p_f3 = tf_f3.paragraphs[0]
p_f3.text = "⚡ Core Product Value"
p_f3.font.size = Pt(10)
p_f3.font.color.rgb = C_ORANGE
p_f3_val = tf_f3.add_paragraph()
p_f3_val.text = "Decision Intelligence Engine"
p_f3_val.font.size = Pt(12.5)
p_f3_val.font.bold = True
p_f3_val.font.color.rgb = C_WHITE

# ==============================================================================
# SLIDE 2: Strategic Positioning (Building atop PAIMANA)
# ==============================================================================
slide2 = prs.slides.add_slide(blank_layout)
add_header(slide2, "Strategic Positioning: Building the Intelligence Layer atop PAIMANA")

create_card(slide2, Inches(0.8), Inches(1.5), Inches(5.6), Inches(5.3))
tb_p = slide2.shapes.add_textbox(Inches(1.1), Inches(1.8), Inches(5.0), Inches(4.7))
tf_p = tb_p.text_frame
tf_p.word_wrap = True

p_pt = tf_p.paragraphs[0]
p_pt.text = "🏛️ PAIMANA: The National Data Foundation"
p_pt.font.size = Pt(15)
p_pt.font.bold = True
p_pt.font.color.rgb = C_NAVY_DARK
p_pt.space_after = Pt(10)

p_pd = tf_p.add_paragraph()
p_pd.text = "Launched by MoSPI on 25 Sept 2025 (and upgraded with PAIMANA-CRIP in July 2026), PAIMANA tracks Central Sector infrastructure projects (>₹150 Cr) across 17 line ministries."
p_pd.font.size = Pt(11.5)
p_pd.font.color.rgb = C_MUTED_TEXT
p_pd.space_after = Pt(12)

p_p_pts = [
    "✅ Automated data flow between executing agencies & centre.",
    "✅ Official June 2026 Baseline: 1,847 ongoing projects (₹40.54L Cr).",
    "🎯 PAIMANA's Role: Tells the nation WHAT is currently happening (The Data Foundation)."
]
for pt in p_p_pts:
    p = tf_p.add_paragraph()
    p.text = pt
    p.font.size = Pt(11)
    p.font.color.rgb = C_DARK_TEXT
    p.space_after = Pt(6)

create_card(slide2, Inches(6.9), Inches(1.5), Inches(5.6), Inches(5.3), C_NAVY_DARK)
tb_d = slide2.shapes.add_textbox(Inches(7.2), Inches(1.8), Inches(5.0), Inches(4.7))
tf_d = tb_d.text_frame
tf_d.word_wrap = True

p_dt = tf_d.paragraphs[0]
p_dt.text = "🚀 PRAKALP-DRISHTI: The Decision Layer"
p_dt.font.size = Pt(15)
p_dt.font.bold = True
p_dt.font.color.rgb = C_GOLD
p_dt.space_after = Pt(10)

p_dd = tf_d.add_paragraph()
p_dd.text = "“We are NOT replacing PAIMANA. PAIMANA built the national data foundation; PRAKALP-DRISHTI turns that foundation into foresight, physical verification, and optimized action.”"
p_dd.font.size = Pt(11.5)
p_dd.font.color.rgb = RGBColor(200, 220, 240)
p_dd.space_after = Pt(12)

p_d_pts = [
    "1. PREDICT: Calibrated P10–P95 probability curves.",
    "2. VERIFY: Independent Earth-Observation (EO) satellite evidence.",
    "3. CONNECT: Cross-ministry dependency and economic contagion.",
    "4. OPTIMIZE: Prescriptive capital allocation under real constraints."
]
for pt in p_d_pts:
    p = tf_d.add_paragraph()
    p.text = pt
    p.font.size = Pt(11)
    p.font.color.rgb = C_WHITE
    p.space_after = Pt(6)

# ==============================================================================
# SLIDE 3: 3-Tier Hackathon Architecture
# ==============================================================================
slide3 = prs.slides.add_slide(blank_layout)
add_header(slide3, "System Architecture: Scoped into 3 Practical Hackathon Tiers")

tiers = [
    ("TIER 1: CORE DECISION ENGINE (Must Work Flawlessly in Live Demo)", [
        "1. Unified Project Intelligence DB: 2,207 source-traceable project records with date-calculated delays.",
        "2. KAAL-CHAKRA: Probabilistic P10/P50/P80/P95 schedule risk based on empirical reference classes.",
        "3. PRATIBIMB: Independent Earth-Observation (EO) satellite evidence signal on 5–10 flagged projects.",
        "4. SETU-GRAPH: Spatial buffer and statutory prerequisite dependency graph for systemic exposure.",
        "5. PRAGATI-SAARTHI: Deterministic, evidence-backed briefing generator with clickable SQL data lineage."
    ], C_NAVY_DARK, C_GOLD, True),
    ("TIER 2: INTEGRITY & PRESCRIBED OPTIMIZATION (Should Work)", [
        "6. SATYA-KAVACH: Statistical threshold bunching detector for 20% CCEA Cabinet audit avoidance.",
        "7. VITTA-VYUHA: Constrained Mixed-Integer Linear Programming (MILP) capital allocation solver.",
        "8. DPR-QUALITY SCORER: NLP document scrutiny engine scanning PDF project proposals (0–100 Score)."
    ], C_CARD_BG, C_ORANGE, False),
    ("TIER 3: RESEARCH & SCENARIO PROTOTYPES (Supporting Labs)", [
        "9. VARSHA-SPEED: Weather working-window optimizer using 630 IMD state-years of rainfall anomalies.",
        "10. HETU: Experimental policy scenario simulator backed by natural experiment breaks.",
        "11. ARTHA-NETRA: Listed PSU financial leverage (D/E ratio) early-warning risk feature."
    ], C_LIGHT_BG, C_MUTED_TEXT, False)
]

for i, (title, items, bg_c, border_c, is_dark) in enumerate(tiers):
    top_pos = Inches(1.5 + (0 if i==0 else (2.4 if i==1 else 4.2)))
    h = Inches(2.2 if i==0 else (1.6 if i==1 else 1.6))
    create_card(slide3, Inches(0.8), top_pos, Inches(11.7), h, bg_c, border_c)
    
    tb_t = slide3.shapes.add_textbox(Inches(1.1), top_pos + Inches(0.12), Inches(11.1), h - Inches(0.24))
    tf_t = tb_t.text_frame
    tf_t.word_wrap = True
    p_h = tf_t.paragraphs[0]
    p_h.text = title
    p_h.font.size = Pt(12)
    p_h.font.bold = True
    p_h.font.color.rgb = C_GOLD if is_dark else C_NAVY_DARK
    p_h.space_after = Pt(3)
    
    for item in items:
        p_item = tf_t.add_paragraph()
        p_item.text = item
        p_item.font.size = Pt(9.5)
        p_item.font.color.rgb = C_WHITE if is_dark else C_DARK_TEXT
        p_item.space_after = Pt(2)

# ==============================================================================
# SLIDE 4: Our Source-Traceable Data Arsenal
# ==============================================================================
slide4 = prs.slides.add_slide(blank_layout)
add_header(slide4, "Our Real Data Arsenal: 100% Source-Traceable Ground Truth")

data_boxes = [
    ("📊 MoSPI Project Corpus", "2,207 Total Records", "1,847 ongoing (June 2026 official baseline) + completed/historical corpus with exact sanction dates & calculated delay months.", C_NAVY_DARK),
    ("📈 Listed PSU Financials", "18,561 Daily Rows", "5-year daily stock prices & balance sheet leverage (D/E, MCap, P/E) for 13 listed PSUs (NTPC, NHPC, SJVN, RVNL, IRCON, Coal India).", C_ACCENT_BLUE),
    ("🏛️ State Election Cycles", "153 Assembly Cycles", "Official Election Commission of India (ECI) calendar across all 28 states & UTs (2000–2026) to map pre-election rush periods.", C_NAVY_MED),
    ("🌧️ IMD Monsoon Departures", "630 State-Years", "State-level Southwest Monsoon rainfall departure (% from Long Period Average) to quantify working-season contraction.", C_NAVY_DARK),
    ("🏗️ DPIIT / RBI WPI Basket", "2005–2026 Series", "Wholesale Price Index for Steel (40%), Cement (30%), Fuel/Bitumen (30%) for CPWD Clause 10CC price escalation audit.", C_ORANGE),
    ("📜 Land Act 2013 Break", "Statutory Shock Dataset", "RFCTLARR 2013 statutory compensation transition dataset isolating the 2.5x-4x multiplier on legacy linear projects.", C_DANGER_RED)
]

for i, (title, highlight, desc, col) in enumerate(data_boxes):
    row = i // 3
    c_idx = i % 3
    left = Inches(0.8 + c_idx * 4.0)
    top = Inches(1.5 + row * 2.7)
    create_card(slide4, left, top, Inches(3.7), Inches(2.4))
    
    tb_d = slide4.shapes.add_textbox(left + Inches(0.2), top + Inches(0.2), Inches(3.3), Inches(2.0))
    tf_d = tb_d.text_frame
    tf_d.word_wrap = True
    p = tf_d.paragraphs[0]
    p.text = title
    p.font.size = Pt(13.5)
    p.font.bold = True
    p.font.color.rgb = col
    p.space_after = Pt(3)
    
    p_h = tf_d.add_paragraph()
    p_h.text = highlight
    p_h.font.size = Pt(12)
    p_h.font.bold = True
    p_h.font.color.rgb = C_DARK_TEXT
    p_h.space_after = Pt(5)
    
    p_desc = tf_d.add_paragraph()
    p_desc.text = desc
    p_desc.font.size = Pt(10)
    p_desc.font.color.rgb = C_MUTED_TEXT

# ==============================================================================
# SLIDE 5: Module 1 — KAAL-CHAKRA (Schedule Risk Forecasting)
# ==============================================================================
slide5 = prs.slides.add_slide(blank_layout)
add_header(slide5, "Module 1: KAAL-CHAKRA (Probabilistic Schedule Risk & Survival Analysis)", "TIER 1 CORE MODULE")

create_card(slide5, Inches(0.8), Inches(1.5), Inches(5.6), Inches(5.3))
tb_k1 = slide5.shapes.add_textbox(Inches(1.1), Inches(1.8), Inches(5.0), Inches(4.7))
tf_k1 = tb_k1.text_frame
tf_k1.word_wrap = True

p_k1 = tf_k1.paragraphs[0]
p_k1.text = "🎯 Methodology & Features:"
p_k1.font.size = Pt(15)
p_k1.font.bold = True
p_k1.font.color.rgb = C_NAVY_DARK
p_k1.space_after = Pt(10)

k1_points = [
    ("Reference Class Forecasting (RCF):", "Groups projects into empirical cohorts (Sector × Cost Band × Terrain) and fits heavy-tailed distributions based on completed projects."),
    ("Survival Analysis (`lifelines`):", "Evaluates ongoing projects using Cox Proportional Hazards, stratifying by Land Act and Interest Rate cohorts."),
    ("SHAP Choke-Point Detector:", "Tree-based SHAP models print top variables (e.g. Monsoon departure, Land gap) driving that specific project's tail risk."),
    ("Dynamic Feature Refreshing:", "Survival curves shift live as milestones (e.g. securing 90% land possession) are completed.")
]
for title, desc in k1_points:
    p = tf_k1.add_paragraph()
    p.text = f"• {title} "
    p.font.bold = True
    p.font.size = Pt(11)
    p.font.color.rgb = C_DARK_TEXT
    run = p.add_run()
    run.text = desc
    run.font.bold = False
    run.font.color.rgb = C_MUTED_TEXT
    p.space_after = Pt(6)

create_card(slide5, Inches(6.9), Inches(1.5), Inches(5.6), Inches(5.3), C_LIGHT_BG)
tb_k2 = slide5.shapes.add_textbox(Inches(7.2), Inches(1.8), Inches(5.0), Inches(4.7))
tf_k2 = tb_k2.text_frame
tf_k2.word_wrap = True

p_k2 = tf_k2.paragraphs[0]
p_k2.text = "📊 Real-World Case Study: Mumbai Metro"
p_k2.font.size = Pt(15)
p_k2.font.bold = True
p_k2.font.color.rgb = C_ORANGE
p_k2.space_after = Pt(12)

demo_lines = [
    "Target Project: Mumbai Metro Line Extension",
    "Official Target Claim: 'DoC: December 2027'",
    "",
    "KAAL-CHAKRA Probabilistic Assessment:",
    "  • P10 (Optimistic): Dec 2027 (<18% Probability, 4th percentile)",
    "  • P50 (Expected): June 2028 (+6 Months delay)",
    "  • P80 (Safe Provisioning): March 2029 (+15 Months delay)",
    "  • P95 (Severe Tail-Risk): Dec 2030 (+36 Months delay)",
    "",
    "SHAP Choke-Point Output: 'Top tail-risk driver: Dense urban utility shifting (42% SHAP weight) + Coastal monsoon rainfall departure.'"
]
for line in demo_lines:
    p = tf_k2.add_paragraph()
    p.text = line
    p.font.size = Pt(10.5)
    p.font.color.rgb = C_NAVY_DARK if "SHAP" not in line else C_DANGER_RED
    p.font.bold = True if ("P50" in line or "P80" in line or "SHAP" in line or "Target" in line) else False
    p.space_after = Pt(2)

# ==============================================================================
# SLIDE 6: Module 3 — PRATIBIMB / SATYA (Independent EO Evidence)
# ==============================================================================
slide6 = prs.slides.add_slide(blank_layout)
add_header(slide6, "Module 3: PRATIBIMB / SATYA (Independent Earth-Observation Evidence)", "TIER 1 CORE MODULE")

create_card(slide6, Inches(0.8), Inches(1.5), Inches(5.6), Inches(5.3))
tb_p1 = slide6.shapes.add_textbox(Inches(1.1), Inches(1.8), Inches(5.0), Inches(4.7))
tf_p1 = tb_p1.text_frame
tf_p1.word_wrap = True

p_p1 = tf_p1.paragraphs[0]
p_p1.text = "🛰️ Satellite as an Independent Evidence Signal:"
p_p1.font.size = Pt(15)
p_p1.font.bold = True
p_p1.font.color.rgb = C_NAVY_DARK
p_p1.space_after = Pt(10)

sat_pts = [
    ("Sentinel-2 (10m Optical):", "Measures broad surface activity, earthworks, and vegetation clearance via NDBI/NDVI spectral differencing over time."),
    ("Sentinel-1 SAR (Radar):", "Penetrates Indian monsoon clouds to detect radar backscatter changes from vertical steel and concrete structures."),
    ("VIIRS Nighttime Lights Index:", "Tracks night illumination footprints on mega-ports and 24x7 corridors — light contraction serves as operational slowdown proxy."),
    ("EO-Eligibility Classifier:", "Filters out underground tunnels and software to focus 100% accurate audits on the 62% eligible surface assets.")
]
for t, d in sat_pts:
    p = tf_p1.add_paragraph()
    p.text = f"• {t} "
    p.font.bold = True
    p.font.size = Pt(11)
    p.font.color.rgb = C_DARK_TEXT
    run = p.add_run()
    run.text = d
    run.font.bold = False
    run.font.color.rgb = C_MUTED_TEXT
    p.space_after = Pt(6)

create_card(slide6, Inches(6.9), Inches(1.5), Inches(5.6), Inches(5.3), C_CARD_BG, C_DANGER_RED)
tb_p2 = slide6.shapes.add_textbox(Inches(7.2), Inches(1.8), Inches(5.0), Inches(4.7))
tf_p2 = tb_p2.text_frame
tf_p2.word_wrap = True

p_p2 = tf_p2.paragraphs[0]
p_p2.text = "🚨 Real Case: 100km Highway Corridor"
p_p2.font.size = Pt(15)
p_p2.font.bold = True
p_p2.font.color.rgb = C_DANGER_RED
p_p2.space_after = Pt(10)

div_lines = [
    "Target Project: 100km Greenfield Highway Corridor",
    "  • Self-Reported Milestone Claim: 74.0% physical progress",
    "  • EO-Observed Surface Activity: 31.2% detected",
    "  • Divergence Metric: 42.8 Percentage Points",
    "  • Evidence Confidence: HIGH (Sentinel-2 Optical + S1 Radar)",
    "",
    "Institutional Output Generated:",
    "  '⚠️ High-Priority Field Verification Recommended: Substantial divergence detected between contractor claim and multi-temporal satellite footprint. Disbursal freeze recommended pending physical audit.'"
]
for line in div_lines:
    p = tf_p2.add_paragraph()
    p.text = line
    p.font.size = Pt(10.5)
    p.font.color.rgb = C_NAVY_DARK if "Institutional" not in line else C_DANGER_RED
    p.font.bold = True if ("Target" in line or "Institutional" in line or "Divergence" in line) else False
    p.space_after = Pt(3)

# ==============================================================================
# SLIDE 7: Module 2 — SETU-GRAPH (Dependency & Contagion)
# ==============================================================================
slide7 = prs.slides.add_slide(blank_layout)
add_header(slide7, "Module 2: SETU-GRAPH (Cross-Project Dependency & Systemic Exposure)", "TIER 1 CORE MODULE")

cards_data = [
    ("1. Spatial Buffer Linkage", "GeoPandas 50km Corridor Overlap", "Connects projects sharing geographic utility corridors, transport nodes, and regional construction clusters without relying on messy NLP.", C_NAVY_MED),
    ("2. Weighted Flow Edges", "Cargo & Power Capacity", "Network line thicknesses represent active operational flow volumes (Million Metric Tonnes of coal or Megawatts of grid power).", C_ACCENT_BLUE),
    ("3. Linchpin Project Isolation", "Betweenness Centrality", "Ranks all projects to isolate the single 'Linchpin Asset' in India that, if delayed, triggers maximum multi-ministry gridlock.", C_DANGER_RED)
]

for i, (title, sub, desc, col) in enumerate(cards_data):
    left = Inches(0.8 + i * 4.0)
    create_card(slide7, left, Inches(1.5), Inches(3.7), Inches(3.2))
    tb_c = slide7.shapes.add_textbox(left + Inches(0.2), Inches(1.7), Inches(3.3), Inches(2.8))
    tf_c = tb_c.text_frame
    tf_c.word_wrap = True
    p = tf_c.paragraphs[0]
    p.text = title
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = col
    p.space_after = Pt(4)
    
    p_s = tf_c.add_paragraph()
    p_s.text = sub
    p_s.font.size = Pt(11.5)
    p_s.font.bold = True
    p_s.font.color.rgb = C_DARK_TEXT
    p_s.space_after = Pt(8)
    
    p_d = tf_c.add_paragraph()
    p_d.text = desc
    p_d.font.size = Pt(10.5)
    p_d.font.color.rgb = C_MUTED_TEXT

create_card(slide7, Inches(0.8), Inches(5.0), Inches(11.7), Inches(1.8), C_NAVY_DARK)
tb_s_bot = slide7.shapes.add_textbox(Inches(1.1), Inches(5.2), Inches(11.1), Inches(1.4))
tf_s_bot = tb_s_bot.text_frame
tf_s_bot.word_wrap = True
p_b1 = tf_s_bot.paragraphs[0]
p_b1.text = "💡 Real-World Case: Odisha Coal-to-Power Logistics Chain"
p_b1.font.size = Pt(13.5)
p_b1.font.bold = True
p_b1.font.color.rgb = C_GOLD
p_b1.space_after = Pt(3)

p_b2 = tf_s_bot.add_paragraph()
p_b2.text = "An 18-month delay in an Odisha coal evacuation rail line ripples across the graph. System output: 'Estimated Downstream Economic Exposure: ₹8,420 Crore locked across 3 dependent thermal power plants and 2 heavy manufacturing hubs due to coal supply bottleneck.'"
p_b2.font.size = Pt(11.5)
p_b2.font.color.rgb = C_WHITE

# ==============================================================================
# SLIDE 8: Module 7 — PRAGATI-SAARTHI (Deterministic Governance Briefing)
# ==============================================================================
slide8 = prs.slides.add_slide(blank_layout)
add_header(slide8, "Module 7: PRAGATI-SAARTHI (Deterministic Governance Briefing Engine)", "TIER 1 CORE MODULE")

create_card(slide8, Inches(0.8), Inches(1.5), Inches(11.7), Inches(2.2), C_NAVY_DARK)
tb_sa = slide8.shapes.add_textbox(Inches(1.1), Inches(1.7), Inches(11.1), Inches(1.8))
tf_sa = tb_sa.text_frame
tf_sa.word_wrap = True

p_sa_t = tf_sa.paragraphs[0]
p_sa_t.text = "🤖 Governed Decision Briefing for the Prime Minister's PRAGATI Review"
p_sa_t.font.size = Pt(15)
p_sa_t.font.bold = True
p_sa_t.font.color.rgb = C_GOLD
p_sa_t.space_after = Pt(4)

p_sa_desc = tf_sa.add_paragraph()
p_sa_desc.text = "Every month, the PM reviews stuck megaprojects with Union & State Chief Secretaries. PRAGATI-SAARTHI generates complete, official 8-page briefing packs in seconds, bridging predictive risk, satellite evidence, and financial signals into actionable civil-service briefs."
p_sa_desc.font.size = Pt(11.5)
p_sa_desc.font.color.rgb = C_WHITE

pillars = [
    ("🛡️ Deterministic Facts", "NO LLM invents numbers. All figures come directly from SQL/ML and are templated into structured text.", C_ACCENT_BLUE),
    ("🔗 Clickable SQL Lineage", "Click any number in the generated PDF (e.g. '₹73,000 Cr') to view the exact SQL query, record IDs, and dataset snapshot.", C_ORANGE),
    ("📱 Encrypted PDF QR Codes", "Scanning the QR code on the final PDF routes officials directly to the live, secure interactive dashboard audit view.", C_SUCCESS_GREEN)
]

for i, (title, desc, col) in enumerate(pillars):
    left = Inches(0.8 + i * 4.0)
    create_card(slide8, left, Inches(4.0), Inches(3.7), Inches(2.8))
    tb_pil = slide8.shapes.add_textbox(left + Inches(0.2), Inches(4.2), Inches(3.3), Inches(2.4))
    tf_pil = tb_pil.text_frame
    tf_pil.word_wrap = True
    p = tf_pil.paragraphs[0]
    p.text = title
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = col
    p.space_after = Pt(6)
    
    p_d = tf_pil.add_paragraph()
    p_d.text = desc
    p_d.font.size = Pt(10.5)
    p_d.font.color.rgb = C_MUTED_TEXT

# ==============================================================================
# SLIDE 9: Module 4 & 5 — SATYA-KAVACH & VITTA-VYUHA (Tier 2 Modules)
# ==============================================================================
slide9 = prs.slides.add_slide(blank_layout)
add_header(slide9, "Modules 4 & 5: SATYA-KAVACH & VITTA-VYUHA (Integrity & Optimization)", "TIER 2 MODULES")

create_card(slide9, Inches(0.8), Inches(1.5), Inches(5.6), Inches(5.3))
tb_m4 = slide9.shapes.add_textbox(Inches(1.1), Inches(1.8), Inches(5.0), Inches(4.7))
tf_m4 = tb_m4.text_frame
tf_m4.word_wrap = True

p_m4_t = tf_m4.paragraphs[0]
p_m4_t.text = "⚖️ Module 4: SATYA-KAVACH"
p_m4_t.font.size = Pt(15)
p_m4_t.font.bold = True
p_m4_t.font.color.rgb = C_NAVY_DARK
p_m4_t.space_after = Pt(6)

p_m4_sub = tf_m4.add_paragraph()
p_m4_sub.text = "Threshold Bunching & Vendor Behavior Profiling"
p_m4_sub.font.size = Pt(11.5)
p_m4_sub.font.bold = True
p_m4_sub.font.color.rgb = C_ORANGE
p_m4_sub.space_after = Pt(8)

m4_pts = [
    ("McCrary Bunching Signal:", "Detects statistically significant density spike (1.49x ratio, p < 0.001) at 19.8%–19.9% to avoid mandatory 20% CCEA Cabinet re-appraisal."),
    ("Vendor Behavior Profiling:", "Maps 19.9% threshold-bunching patterns against contractor IDs to identify recurring bad actors across separate ministries."),
    ("CPWD Clause 10CC 85% Rule:", "Hardcodes the statutory formula where only 85% of contract value is escalable, checking if contractor demands exceed legal PVC limits.")
]
for t, d in m4_pts:
    p = tf_m4.add_paragraph()
    p.text = f"• {t} "
    p.font.bold = True
    p.font.size = Pt(10.5)
    p.font.color.rgb = C_DARK_TEXT
    run = p.add_run()
    run.text = d
    run.font.bold = False
    run.font.color.rgb = C_MUTED_TEXT
    p.space_after = Pt(5)

create_card(slide9, Inches(6.9), Inches(1.5), Inches(5.6), Inches(5.3))
tb_m5 = slide9.shapes.add_textbox(Inches(7.2), Inches(1.8), Inches(5.0), Inches(4.7))
tf_m5 = tb_m5.text_frame
tf_m5.word_wrap = True

p_m5_t = tf_m5.paragraphs[0]
p_m5_t.text = "💰 Module 5: VITTA-VYUHA"
p_m5_t.font.size = Pt(15)
p_m5_t.font.bold = True
p_m5_t.font.color.rgb = C_NAVY_DARK
p_m5_t.space_after = Pt(6)

p_m5_sub = tf_m5.add_paragraph()
p_m5_sub.text = "Prescriptive Capital Allocation (MILP Optimization)"
p_m5_sub.font.size = Pt(11.5)
p_m5_sub.font.bold = True
p_m5_sub.font.color.rgb = C_ACCENT_BLUE
p_m5_sub.space_after = Pt(8)

m5_pts = [
    ("HiGHS MILP Solver:", "Solves optimal capital distribution in < 2 seconds based on risk-adjusted completion probability and agency absorptive capacity."),
    ("Real Governance Constraints:", "Guarantees mandatory regional floors (North-East Region) and respects historical agency peak burn rates."),
    ("Interactive 'What-If' Sliders:", "Judges drag available capex from ₹10,000 Cr to ₹5,000 Cr on the UI to see the MILP engine re-allocate project funding paths live.")
]
for t, d in m5_pts:
    p = tf_m5.add_paragraph()
    p.text = f"• {t} "
    p.font.bold = True
    p.font.size = Pt(10.5)
    p.font.color.rgb = C_DARK_TEXT
    run = p.add_run()
    run.text = d
    run.font.bold = False
    run.font.color.rgb = C_MUTED_TEXT
    p.space_after = Pt(5)

# ==============================================================================
# SLIDE 10: NEW ADD-ON MODULES — DPR SCORER & VARSHA-SPEED
# ==============================================================================
slide10 = prs.slides.add_slide(blank_layout)
add_header(slide10, "High-Utility Add-Ons: DPR-Scorer & VARSHA-Speed", "INNOVATION ACCELERATORS")

create_card(slide10, Inches(0.8), Inches(1.5), Inches(5.6), Inches(5.3))
tb_dpr = slide10.shapes.add_textbox(Inches(1.1), Inches(1.8), Inches(5.0), Inches(4.7))
tf_dpr = tb_dpr.text_frame
tf_dpr.word_wrap = True

p_dpr_t = tf_dpr.paragraphs[0]
p_dpr_t.text = "📄 Add-On 1: DPR-QUALITY SCORER"
p_dpr_t.font.size = Pt(15)
p_dpr_t.font.bold = True
p_dpr_t.font.color.rgb = C_NAVY_DARK
p_dpr_t.space_after = Pt(6)

p_dpr_sub = tf_dpr.add_paragraph()
p_dpr_sub.text = "Pre-Election Rush Solver & Document Scrutiny (NLP)"
p_dpr_sub.font.size = Pt(11.5)
p_dpr_sub.font.bold = True
p_dpr_sub.font.color.rgb = C_ORANGE
p_dpr_sub.space_after = Pt(8)

dpr_pts = [
    ("The Problem:", "Projects rushed through sanction in pre-election cycles face a 79.1% delay rate due to flawed, incomplete DPRs."),
    ("How It Works:", "Localized open-weight LLM (Llama-3/Mistral) parses PDF proposals via offline LangChain pipeline to audit statutory readiness."),
    ("Checklist Scanned:", "Missing 80% land possession certificates, vague geotechnical/soil test records, unverified environmental clearances."),
    ("DPR Score (0–100):", "Scores below 60 trigger an instant pre-sanction alert flagging high structural overrun risk before money is spent.")
]
for t, d in dpr_pts:
    p = tf_dpr.add_paragraph()
    p.text = f"• {t} "
    p.font.bold = True
    p.font.size = Pt(10.5)
    p.font.color.rgb = C_DARK_TEXT
    run = p.add_run()
    run.text = d
    run.font.bold = False
    run.font.color.rgb = C_MUTED_TEXT
    p.space_after = Pt(5)

create_card(slide10, Inches(6.9), Inches(1.5), Inches(5.6), Inches(5.3))
tb_var = slide10.shapes.add_textbox(Inches(7.2), Inches(1.8), Inches(5.0), Inches(4.7))
tf_var = tb_var.text_frame
tf_var.word_wrap = True

p_var_t = tf_var.paragraphs[0]
p_var_t.text = "🌧️ Add-On 2: VARSHA-SPEED"
p_var_t.font.size = Pt(15)
p_var_t.font.bold = True
p_var_t.font.color.rgb = C_NAVY_DARK
p_var_t.space_after = Pt(6)

p_var_sub = tf_var.add_paragraph()
p_var_sub.text = "Weather Working-Window Optimizer (Climate AI)"
p_var_sub.font.size = Pt(11.5)
p_var_sub.font.bold = True
p_var_sub.font.color.rgb = C_ACCENT_BLUE
p_var_sub.space_after = Pt(8)

var_pts = [
    ("The Problem:", "Indian monsoon weather tightly constrains active construction calendars, but dashboards assume uniform 12-month working windows."),
    ("630 IMD State-Years Data:", "Integrates historical state-level rainfall departure (% from LPA) to project regional work season contractions."),
    ("Dynamic Quarterly Adjustment:", "If an Assam highway project faces an extended 25-day monsoon anomaly, the system scales down quarterly progress targets."),
    ("The Benefit:", "Provides realistic timeline projections aligned with climate reality and prevents false contractual penalties on contractors.")
]
for t, d in var_pts:
    p = tf_var.add_paragraph()
    p.text = f"• {t} "
    p.font.bold = True
    p.font.size = Pt(10.5)
    p.font.color.rgb = C_DARK_TEXT
    run = p.add_run()
    run.text = d
    run.font.bold = False
    run.font.color.rgb = C_MUTED_TEXT
    p.space_after = Pt(5)

# ==============================================================================
# SLIDE 11: Modules 6 & 4B — HETU & ARTHA-NETRA (Tier 3 Research Labs)
# ==============================================================================
slide11 = prs.slides.add_slide(blank_layout)
add_header(slide11, "Modules 6 & 4B: HETU & ARTHA-NETRA (Research & Scenario Labs)", "TIER 3 RESEARCH LABS")

create_card(slide11, Inches(0.8), Inches(1.5), Inches(5.6), Inches(5.3))
tb_h = slide11.shapes.add_textbox(Inches(1.1), Inches(1.8), Inches(5.0), Inches(4.7))
tf_h = tb_h.text_frame
tf_h.word_wrap = True

p_h_t = tf_h.paragraphs[0]
p_h_t.text = "🔬 Module 6: HETU"
p_h_t.font.size = Pt(15)
p_h_t.font.bold = True
p_h_t.font.color.rgb = C_NAVY_DARK
p_h_t.space_after = Pt(6)

p_h_sub = tf_h.add_paragraph()
p_h_sub.text = "Experimental Policy Scenario Simulator"
p_h_sub.font.size = Pt(11.5)
p_h_sub.font.bold = True
p_h_sub.font.color.rgb = C_ORANGE
p_h_sub.space_after = Pt(8)

h_pts = [
    ("Scenario Exploration:", "Uses Double Machine Learning (DML) architectures to explore counterfactual regulatory levers."),
    ("Natural Experiment Identification:", "Anchored on the RFCTLARR 2013 Land Act structural break (p = 2.25e-7) and State Election timelines."),
    ("Framing for Judges:", "Presented as an experimental policy scenario generator with explicit identification assumptions, not unconditional truth.")
]
for t, d in h_pts:
    p = tf_h.add_paragraph()
    p.text = f"• {t} "
    p.font.bold = True
    p.font.size = Pt(10.5)
    p.font.color.rgb = C_DARK_TEXT
    run = p.add_run()
    run.text = d
    run.font.bold = False
    run.font.color.rgb = C_MUTED_TEXT
    p.space_after = Pt(5)

create_card(slide11, Inches(6.9), Inches(1.5), Inches(5.6), Inches(5.3))
tb_an = slide11.shapes.add_textbox(Inches(7.2), Inches(1.8), Inches(5.0), Inches(4.7))
tf_an = tb_an.text_frame
tf_an.word_wrap = True

p_an_t = tf_an.paragraphs[0]
p_an_t.text = "📈 Module 4B: ARTHA-NETRA"
p_an_t.font.size = Pt(15)
p_an_t.font.bold = True
p_an_t.font.color.rgb = C_NAVY_DARK
p_an_t.space_after = Pt(6)

p_an_sub = tf_an.add_paragraph()
p_an_sub.text = "PSU Financial Health & Leverage Early-Warning Signal"
p_an_sub.font.size = Pt(11.5)
p_an_sub.font.bold = True
p_an_sub.font.color.rgb = C_ACCENT_BLUE
p_an_sub.space_after = Pt(8)

an_pts = [
    ("Early-Warning Signal:", "Monitors balance-sheet leverage (Debt-to-Equity) and stock drawdowns across 13 listed PSUs as an additional risk indicator."),
    ("Empirical Association:", "High-debt PSUs (SJVN D/E 227, NHPC D/E 113) show higher average project revisions than low-debt entities (Coal India D/E 12)."),
    ("Framing for Judges:", "Presented as a financial stress indicator for monitoring queues, explicitly separating correlation from project-level causality.")
]
for t, d in an_pts:
    p = tf_an.add_paragraph()
    p.text = f"• {t} "
    p.font.bold = True
    p.font.size = Pt(10.5)
    p.font.color.rgb = C_DARK_TEXT
    run = p.add_run()
    run.text = d
    run.font.bold = False
    run.font.color.rgb = C_MUTED_TEXT
    p.space_after = Pt(5)

# ==============================================================================
# SLIDE 12: The 5 Empirical Findings & Methodology
# ==============================================================================
slide12 = prs.slides.add_slide(blank_layout)
add_header(slide12, "Empirical Discoveries & Methodological Controls")

findings = [
    ("1. Project Age Effect:", "Projects > 12 years old exhibit 64% overrun rates. We control for survivorship bias by stratifying within Land Act and Interest Rate cohorts (used as a statutory 'Sunset Clause' trigger).", C_NAVY_DARK),
    ("2. Contractor Experience Effect:", "Companies managing 5+ simultaneous projects show lower overrun rates (rho = -0.455), reflecting institutional capability and capital base.", C_ACCENT_BLUE),
    ("3. State Governance Variation:", "States exhibit distinct structural delay rates (e.g. Punjab 69%, Gujarat 66% vs North-Eastern states), driven by land acquisition friction.", C_DANGER_RED),
    ("4. ₹1,000–5,000 Cr Monitoring Gap:", "Worst overrun rate (41.4%) occurs in mid-tier mega projects — too large for routine inspection, too small for apex PMO review.", C_ORANGE),
    ("5. Pre-Election Rush Delay Penalty:", "Projects approved in pre-election rush periods face a 79.1% delay rate due to premature DPRs and pending land possession.", C_NAVY_MED)
]

for i, (title, desc, col) in enumerate(findings):
    top_pos = Inches(1.5 + i * 1.05)
    create_card(slide12, Inches(0.8), top_pos, Inches(11.7), Inches(0.95))
    tb_f = slide12.shapes.add_textbox(Inches(1.1), top_pos + Inches(0.1), Inches(11.1), Inches(0.75))
    tf_f = tb_f.text_frame
    tf_f.word_wrap = True
    p_t = tf_f.paragraphs[0]
    p_t.text = title
    p_t.font.size = Pt(12.5)
    p_t.font.bold = True
    p_t.font.color.rgb = col
    
    p_d = tf_f.add_paragraph()
    p_d.text = desc
    p_d.font.size = Pt(10.5)
    p_d.font.color.rgb = C_DARK_TEXT

# ==============================================================================
# SLIDE 13: The Winning 3-Minute Live Demo Spine
# ==============================================================================
slide13 = prs.slides.add_slide(blank_layout)
add_header(slide13, "The Winning 3-Minute Live Demo: One Project, One Chain of Evidence")

demo_steps = [
    ("⏱️ 0:00 - 0:25", "THE HOOK & REPORTED STATUS", "Open on Western Dedicated Freight Corridor (WDFC). 'Official portal reports 74% progress with completion targeted for Dec 2026 at ₹51,101 Cr.'", C_NAVY_DARK),
    ("⏱️ 0:25 - 0:55", "INDEPENDENT EO VERIFICATION (PRATIBIMB)", "Split screen with Sentinel-2 satellite differencing. 'Independent Earth-Observation shows surface footprint activity at only 31%, generating a 43-point divergence alert for field verification.'", C_DANGER_RED),
    ("⏱️ 0:55 - 1:25", "PROBABILISTIC FORECAST (KAAL-CHAKRA)", "Render RCF survival fan chart. 'Historical reference class indicates the official target sits at the 4th percentile. Estimated completion probability by deadline is < 18%.'", C_ORANGE),
    ("⏱️ 1:25 - 1:55", "SYSTEMIC CONTAGION (SETU-GRAPH)", "Interactive network ripple. 'This delay does not stay isolated. Rail bottleneck creates an estimated ₹8,420 Cr downstream economic exposure across 4 connected thermal plants.'", C_ACCENT_BLUE),
    ("⏱️ 1:55 - 2:25", "PRESCRIBED ACTION (VITTA-VYUHA)", "Run MILP optimizer with interactive slider. 'Given available capex, VITTA-VYUHA reallocates ₹10,000 Cr under regional equity floors to unblock critical path milestones.'", C_NAVY_MED),
    ("⏱️ 2:25 - 3:00", "GOVERNED BRIEFING & CLOSING (PRAGATI-SAARTHI)", "Generate official PDF briefing note with clickable SQL data lineage and QR code. Closing: 'PAIMANA built the national data foundation; PRAKALP-DRISHTI turns that foundation into foresight and action.'", C_SUCCESS_GREEN)
]

for i, (time_tag, stage, script, col) in enumerate(demo_steps):
    top_pos = Inches(1.5 + i * 0.92)
    create_card(slide13, Inches(0.8), top_pos, Inches(11.7), Inches(0.84))
    tb_dm = slide13.shapes.add_textbox(Inches(1.1), top_pos + Inches(0.08), Inches(11.1), Inches(0.68))
    tf_dm = tb_dm.text_frame
    tf_dm.word_wrap = True
    p_t = tf_dm.paragraphs[0]
    p_t.text = f"{time_tag}  •  {stage}"
    p_t.font.size = Pt(11.5)
    p_t.font.bold = True
    p_t.font.color.rgb = col
    
    p_s = tf_dm.add_paragraph()
    p_s.text = script
    p_s.font.size = Pt(9.5)
    p_s.font.color.rgb = C_DARK_TEXT

# ==============================================================================
# SLIDE 14: 10-Day Team Sprint & Work Allocation
# ==============================================================================
slide14 = prs.slides.add_slide(blank_layout)
add_header(slide14, "10-Day Team Sprint: Clear, Scoped Work Allocation (6 Members)")

team_roles = [
    ("Members 1 & 2", "Backend & Data Pipeline", "FastAPI backend, TimescaleDB schema, DuckDB-WASM Parquet export. Serve all 2,207 project records with sub-50ms query response."),
    ("Member 3", "Earth Observation (PRATIBIMB)", "Pre-compute Sentinel-1 SAR and Sentinel-2 optical change index for 5–10 flagged case-study projects using Google Earth Engine / STAC API."),
    ("Member 4", "Integrity & Statistics (SATYA-KAVACH)", "McCrary 20% threshold bunching density test and CPWD Clause 10CC 85% statutory escalation verification algorithm."),
    ("Member 5", "Forecasting & Optimization (KAAL-CHAKRA & VITTA-VYUHA)", "lifelines survival curves for P10/P50/P80 fan charts + HiGHS MILP solver script for constrained capital allocation."),
    ("Member 6", "Frontend Cockpit & Briefing Drafter (PRAGATI-SAARTHI)", "Next.js dashboard, MapLibre GL map, deck.gl dependency graph, and LangGraph PDF briefing generator with clickable SQL lineage.")
]

for i, (mems, role, task) in enumerate(team_roles):
    top_pos = Inches(1.5 + i * 1.05)
    create_card(slide14, Inches(0.8), top_pos, Inches(11.7), Inches(0.95))
    tb_tm = slide14.shapes.add_textbox(Inches(1.1), top_pos + Inches(0.1), Inches(11.1), Inches(0.75))
    tf_tm = tb_tm.text_frame
    tf_tm.word_wrap = True
    p_t = tf_tm.paragraphs[0]
    p_t.text = f"{mems} — {role}"
    p_t.font.size = Pt(12.5)
    p_t.font.bold = True
    p_t.font.color.rgb = C_NAVY_DARK
    
    p_d = tf_tm.add_paragraph()
    p_d.text = task
    p_d.font.size = Pt(10.5)
    p_d.font.color.rgb = C_MUTED_TEXT

# ==============================================================================
# SLIDE 15: Jury Q&A Defense Strategy (The 6 Toughest Questions)
# ==============================================================================
slide15 = prs.slides.add_slide(blank_layout)
add_header(slide15, "Jury Room Defense: The 6 Key Questions & Defensible Answers")

qa_items = [
    ("Q1: 'How is this different from PAIMANA?'", "Answer: PAIMANA consolidates project reporting; PRAKALP-DRISHTI adds predictive risk distributions, independent EO verification, systemic contagion modeling, and prescriptive decision support."),
    ("Q2: 'Does satellite imagery prove ground truth?'", "Answer: It provides an independent evidence signal that detects reported-vs-observed divergence to prioritize high-risk sites for field verification."),
    ("Q3: 'Why should government trust your ML?'", "Answer: Every forecast is accompanied by empirical reference classes, confidence intervals (P10-P95), and clickable SQL data lineage on all numbers."),
    ("Q4: 'What happens if your model is wrong?'", "Answer: The system does not execute automated actions; it ranks risks and provides evidence-backed recommendations for the authorized officer to decide."),
    ("Q5: 'How does it scale on NIC MeghRaj servers?'", "Answer: Decoupled architecture using DuckDB-WASM and Parquet streaming directly in browser (<15 MB payload, zero server-side query lag)."),
    ("Q6: 'Are you claiming fraud with the 20% bunching test?'", "Answer: We report statistically significant threshold-avoidance bunching behavior (p < 0.001) as an audit recommendation trigger, not a legal accusation.")
]

for i, (q, a) in enumerate(qa_items):
    top_pos = Inches(1.5 + i * 0.92)
    create_card(slide15, Inches(0.8), top_pos, Inches(11.7), Inches(0.84))
    tb_qa = slide15.shapes.add_textbox(Inches(1.1), top_pos + Inches(0.08), Inches(11.1), Inches(0.68))
    tf_qa = tb_qa.text_frame
    tf_qa.word_wrap = True
    p_q = tf_qa.paragraphs[0]
    p_q.text = q
    p_q.font.size = Pt(11)
    p_q.font.bold = True
    p_q.font.color.rgb = C_ORANGE
    
    p_a = tf_qa.add_paragraph()
    p_a.text = a
    p_a.font.size = Pt(9.5)
    p_a.font.color.rgb = C_DARK_TEXT

# ==============================================================================
# SLIDE 16: Conclusion & The Winning Vision (Dark Theme)
# ==============================================================================
slide16 = prs.slides.add_slide(blank_layout)
bg16 = slide16.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height)
bg16.fill.solid()
bg16.fill.fore_color.rgb = C_NAVY_DARK
bg16.line.fill.background()

add_header(slide16, "The Winning Vision: Transforming Data into Foresight & Action", "THE CLOSING SUMMARY", is_dark=True)

tb_c_main = slide16.shapes.add_textbox(Inches(1.0), Inches(1.8), Inches(11.3), Inches(4.8))
tf_c_main = tb_c_main.text_frame
tf_c_main.word_wrap = True

closing_pts = [
    ("1. Clear Strategic Positioning:", "We don't replace PAIMANA — we turn its data into predictive foresight, independent verification, and decision intelligence."),
    ("2. Defensible Chain of Evidence:", "One linear narrative: Reported Status ➜ Probabilistic Risk ➜ Satellite Verification ➜ Systemic Contagion ➜ Recommended Decision."),
    ("3. Government-Grade Trust & Lineage:", "Deterministic calculations, CPWD Clause 10CC statutory math, and clickable SQL lineage tokens on every output."),
    ("4. Scoped for Flawless Execution:", "5 core working modules in Tier 1, backed by 100% source-traceable real datasets across 2,207 project records.")
]

for title, desc in closing_pts:
    p = tf_c_main.add_paragraph()
    p.text = f"✨  {title} "
    p.font.bold = True
    p.font.size = Pt(13.5)
    p.font.color.rgb = C_GOLD
    p.space_after = Pt(2)
    
    p_d = tf_c_main.add_paragraph()
    p_d.text = f"     {desc}"
    p_d.font.size = Pt(11.5)
    p_d.font.color.rgb = C_WHITE
    p_d.space_after = Pt(10)

# Save the presentation
prs.save(OUTPUT_FILE)
print(f"Presentation successfully saved to: {os.path.abspath(OUTPUT_FILE)}")
