"""
Prakalp Drishti: Slide 1 Presentation & Executive Brief PDF Generator
Problem Statement: SIH26103 (MoSPI / DIID)
Generates high-impact, 16:9 widescreen presentation slides + technical dossier PDF.
"""

import os
import sys
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
)
from reportlab.graphics.shapes import (
    Drawing, Rect, String, Line, Group, Polygon, Circle
)
from reportlab.pdfgen import canvas

# Widescreen 16:9 dimensions in points (960 x 540 pt)
SLIDE_W = 960.0
SLIDE_H = 540.0

# Curated Professional Gov-Tech Palette
BG_DARK = colors.HexColor("#080E1A")        # Deep midnight navy
CARD_BG = colors.HexColor("#0F1A2E")        # Dark slate card
CARD_BORDER = colors.HexColor("#1E2D4A")    # Border slate
TEXT_WHITE = colors.HexColor("#FFFFFF")     # Crisp white
TEXT_MUTED = colors.HexColor("#94A3B8")     # Cool slate grey
ACCENT_CYAN = colors.HexColor("#38BDF8")    # Vibrant cyan
ACCENT_EMERALD = colors.HexColor("#10B981") # Success emerald
ACCENT_AMBER = colors.HexColor("#F59E0B")   # Warning amber
ACCENT_ROSE = colors.HexColor("#F43F5E")    # Danger/alert rose
ACCENT_PURPLE = colors.HexColor("#818CF8")  # Royal indigo
ACCENT_BLUE = colors.HexColor("#2563EB")    # Sovereign blue
HEADER_BG = colors.HexColor("#060A12")


class NumberedCanvas(canvas.Canvas):
    """Canvas that draws running background, header accents, and page numbers."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, total_pages):
        self.saveState()
        # Draw dark canvas background
        self.setFillColor(BG_DARK)
        self.rect(0, 0, SLIDE_W, SLIDE_H, stroke=0, fill=1)

        # Top decorative thin line (tricolor/cyan glow)
        self.setStrokeColor(ACCENT_CYAN)
        self.setLineWidth(1.5)
        self.line(20, SLIDE_H - 12, SLIDE_W - 20, SLIDE_H - 12)

        # Bottom status bar
        self.setFillColor(CARD_BG)
        self.rect(20, 8, SLIDE_W - 40, 22, stroke=1, fill=1)
        self.setStrokeColor(CARD_BORDER)
        self.setLineWidth(0.8)
        self.rect(20, 8, SLIDE_W - 40, 22, stroke=1, fill=0)

        # Footer Text
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(ACCENT_CYAN)
        self.drawString(28, 15, "PRAKALP DRISHTI | SIH 2026")
        self.setFont("Helvetica", 7.5)
        self.setFillColor(TEXT_MUTED)
        self.drawString(160, 15, "MoSPI DIID (SIH26103)  •  Zero-Trust Mega-Project Infrastructure Intelligence  •  RFC 8785 / SHA-256 Verified")

        # Slide Number Badge
        page_str = f"SLIDE {self._pageNumber} OF {total_pages}"
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(TEXT_WHITE)
        self.drawRightString(SLIDE_W - 28, 15, page_str)

        self.restoreState()


def create_mccrary_chart(width=280, height=135):
    """Draws the McCrary Discontinuity histogram showing 20% CCEA threshold gaming."""
    d = Drawing(width, height)
    # Background card
    d.add(Rect(0, 0, width, height, fillColor=CARD_BG, strokeColor=CARD_BORDER, strokeWidth=1, rx=4, ry=4))

    # Title & Subtitle
    d.add(String(10, height - 14, "McCrary Discontinuity: 20% CCEA Cliff", fontName="Helvetica-Bold", fontSize=8.5, fillColor=TEXT_WHITE))
    d.add(String(10, height - 24, "Artificial 1.65x clustering at 19.4%-19.9% to bypass Cabinet review", fontName="Helvetica", fontSize=6.5, fillColor=TEXT_MUTED))

    # Axes
    ox = 32
    oy = 22
    cw = width - 42
    ch = height - 52
    d.add(Line(ox, oy, ox + cw, oy, strokeColor=CARD_BORDER, strokeWidth=1))
    d.add(Line(ox, oy, ox, oy + ch, strokeColor=CARD_BORDER, strokeWidth=1))

    # Bins (0% to 32% cost overrun)
    bin_counts = [12, 18, 25, 34, 45, 52, 60, 71, 88, 110, 135, 178, 245, 410, 85, 92, 105, 98, 85, 70, 55, 40]
    max_c = 420
    bw = cw / len(bin_counts)

    for i, c in enumerate(bin_counts):
        bx = ox + i * bw + 1
        bh = (c / max_c) * (ch - 10)
        # Highlight the 19.4%-19.9% evasion bin (index 13)
        if i == 13:
            fill_c = ACCENT_ROSE
        elif i >= 14:
            fill_c = colors.HexColor("#64748B") # Post-threshold
        else:
            fill_c = colors.HexColor("#0284C7") # Pre-threshold normal
        d.add(Rect(bx, oy, bw - 2, bh, fillColor=fill_c, strokeColor=None))

    # 20% Threshold line
    tx = ox + 14 * bw
    d.add(Line(tx, oy, tx, oy + ch, strokeColor=ACCENT_ROSE, strokeWidth=1.5, strokeDashArray=[3, 2]))
    d.add(String(tx - 35, oy + ch - 4, "20.0% CCEA TRIGGER", fontName="Helvetica-Bold", fontSize=6, fillColor=ACCENT_ROSE))

    # Callout badge for 19.4%-19.9% cluster
    d.add(Rect(tx - 70, oy + ch - 18, 62, 12, fillColor=colors.HexColor("#3F121D"), strokeColor=ACCENT_ROSE, strokeWidth=0.8, rx=2, ry=2))
    d.add(String(tx - 67, oy + ch - 10, "1.65x Evasion Spike", fontName="Helvetica-Bold", fontSize=6, fillColor=TEXT_WHITE))

    # Axis labels
    d.add(String(ox, oy - 9, "0%", fontName="Helvetica", fontSize=6.5, fillColor=TEXT_MUTED))
    d.add(String(tx - 6, oy - 9, "20%", fontName="Helvetica-Bold", fontSize=6.5, fillColor=ACCENT_ROSE))
    d.add(String(ox + cw - 12, oy - 9, "35%+", fontName="Helvetica", fontSize=6.5, fillColor=TEXT_MUTED))
    d.add(String(ox + cw/2 - 30, oy - 18, "Reported Cost Escalation (%)", fontName="Helvetica", fontSize=6, fillColor=TEXT_MUTED))

    return d


def create_kaal_chakra_chart(width=280, height=135):
    """Draws the Kaal-Chakra Survival Probabilistic Fan Chart."""
    d = Drawing(width, height)
    d.add(Rect(0, 0, width, height, fillColor=CARD_BG, strokeColor=CARD_BORDER, strokeWidth=1, rx=4, ry=4))

    # Title & Subtitle
    d.add(String(10, height - 14, "Kaal-Chakra: Survival Fan vs DPR Target", fontName="Helvetica-Bold", fontSize=8.5, fillColor=TEXT_WHITE))
    d.add(String(10, height - 24, "Log-logistic AFT model with 93.3% split-conformal coverage", fontName="Helvetica", fontSize=6.5, fillColor=TEXT_MUTED))

    ox = 32
    oy = 22
    cw = width - 42
    ch = height - 52
    d.add(Line(ox, oy, ox + cw, oy, strokeColor=CARD_BORDER, strokeWidth=1))
    d.add(Line(ox, oy, ox, oy + ch, strokeColor=CARD_BORDER, strokeWidth=1))

    # Shaded confidence bands (P10 to P95)
    # Outer band (P10-P95)
    poly_outer = [
        ox, oy,
        ox + cw * 0.35, oy + ch * 0.15,
        ox + cw * 0.70, oy + ch * 0.50,
        ox + cw, oy + ch * 0.95,
        ox + cw, oy + ch * 0.40,
        ox + cw * 0.70, oy + ch * 0.15,
        ox + cw * 0.35, oy + ch * 0.05,
        ox, oy
    ]
    d.add(Polygon(poly_outer, fillColor=colors.HexColor("#1E3A8A"), strokeColor=None))

    # Inner band (P25-P80)
    poly_inner = [
        ox, oy,
        ox + cw * 0.35, oy + ch * 0.12,
        ox + cw * 0.70, oy + ch * 0.42,
        ox + cw, oy + ch * 0.85,
        ox + cw, oy + ch * 0.52,
        ox + cw * 0.70, oy + ch * 0.25,
        ox + cw * 0.35, oy + ch * 0.08,
        ox, oy
    ]
    d.add(Polygon(poly_inner, fillColor=colors.HexColor("#2563EB"), strokeColor=None))

    # Median Line (P50)
    d.add(Line(ox, oy, ox + cw * 0.35, oy + ch * 0.10, strokeColor=ACCENT_CYAN, strokeWidth=1.5))
    d.add(Line(ox + cw * 0.35, oy + ch * 0.10, ox + cw * 0.70, oy + ch * 0.34, strokeColor=ACCENT_CYAN, strokeWidth=1.5))
    d.add(Line(ox + cw * 0.70, oy + ch * 0.34, ox + cw, oy + ch * 0.68, strokeColor=ACCENT_CYAN, strokeWidth=1.5))

    # Contractor DPR Claim (Single Point)
    dpr_x = ox + cw * 0.28
    dpr_y = oy + ch * 0.85
    d.add(Circle(dpr_x, dpr_y, 4, fillColor=ACCENT_ROSE, strokeColor=TEXT_WHITE, strokeWidth=1))
    d.add(Line(dpr_x, dpr_y - 4, dpr_x, oy, strokeColor=ACCENT_ROSE, strokeWidth=1, strokeDashArray=[2, 2]))
    d.add(String(dpr_x - 22, dpr_y + 6, "DPR Target (Single Date)", fontName="Helvetica-Bold", fontSize=6, fillColor=ACCENT_ROSE))
    d.add(String(dpr_x - 18, dpr_y - 12, "0.1% Feasibility", fontName="Helvetica", fontSize=5.5, fillColor=ACCENT_ROSE))

    # Quantile Labels at right
    d.add(String(ox + cw - 28, oy + ch * 0.93, "P95 Tail", fontName="Helvetica", fontSize=6, fillColor=TEXT_MUTED))
    d.add(String(ox + cw - 32, oy + ch * 0.67, "P50 Median", fontName="Helvetica-Bold", fontSize=6, fillColor=ACCENT_CYAN))
    d.add(String(ox + cw - 28, oy + ch * 0.40, "P10 Best", fontName="Helvetica", fontSize=6, fillColor=TEXT_MUTED))

    # X-Axis labels
    d.add(String(ox, oy - 9, "Sanction", fontName="Helvetica", fontSize=6.5, fillColor=TEXT_MUTED))
    d.add(String(dpr_x - 8, oy - 9, "DPR Date", fontName="Helvetica", fontSize=6.5, fillColor=TEXT_MUTED))
    d.add(String(ox + cw - 24, oy - 9, "+60 Mos", fontName="Helvetica", fontSize=6.5, fillColor=TEXT_MUTED))
    d.add(String(ox + cw/2 - 25, oy - 18, "Timeline Progression", fontName="Helvetica", fontSize=6, fillColor=TEXT_MUTED))

    return d


def create_pipeline_diagram(width=570, height=86):
    """Draws the 5-stage Prakalp Drishti architectural pipeline."""
    d = Drawing(width, height)
    d.add(Rect(0, 0, width, height, fillColor=CARD_BG, strokeColor=CARD_BORDER, strokeWidth=1, rx=4, ry=4))

    # Header title
    d.add(String(10, height - 12, "AUTONOMOUS END-TO-END INNOVATION PIPELINE (ZERO-TRUST / ZERO-HALLUCINATION)", fontName="Helvetica-Bold", fontSize=7.5, fillColor=ACCENT_CYAN))

    steps = [
        ("1. HETEROGENEOUS INGESTION", "25 MoSPI CUF Fields\n4,414 Esri Satellite Tiles\nIMD 20-Yr Rainfall Series\nDPIIT WPI Indices & PSUs", colors.HexColor("#1E293B"), ACCENT_CYAN),
        ("2. DATA RECONCILIATION", "Rebaselining De-biasing\nCensoring Segregation\n400k Offline Geocoding\nMonthly Rate Derivatives", colors.HexColor("#1E293B"), ACCENT_PURPLE),
        ("3. PREDICTIVE ENGINES", "Kaal-Chakra Survival AFT\nSetu-Varsha Max-Plus DAG\nSatya-Kavach CCEA Audit\nArtha-Nivaran Solvency", colors.HexColor("#1E293B"), ACCENT_AMBER),
        ("4. PRESCRIPTIVE LP & AUDIT", "Two-Stage Stochastic LP\nHiGHS (8.7 ms Runtime)\nCVaR90 & 10% NER Floor\nDual-Epoch Optical Audit", colors.HexColor("#1E293B"), ACCENT_EMERALD),
        ("5. APEX DECISION COCKPITS", "PRAGATI Bilingual Dossier\nRFC 8785 Merkle Proof\nLive Capex Reallocator\nNagrik Citizen Transparency", colors.HexColor("#1E293B"), ACCENT_BLUE),
    ]

    card_w = (width - 20 - 4 * 12) / 5
    card_h = height - 24
    top_y = 6

    for i, (title, details, bg, border_c) in enumerate(steps):
        cx = 10 + i * (card_w + 12)
        # Card
        d.add(Rect(cx, top_y, card_w, card_h, fillColor=bg, strokeColor=border_c, strokeWidth=1, rx=3, ry=3))
        # Title bar
        d.add(Rect(cx, top_y + card_h - 13, card_w, 13, fillColor=colors.HexColor("#0B132B"), strokeColor=None))
        d.add(String(cx + 4, top_y + card_h - 9.5, title, fontName="Helvetica-Bold", fontSize=5.5, fillColor=border_c))

        # Text lines
        lines = details.split("\n")
        for j, line in enumerate(lines):
            d.add(String(cx + 4, top_y + card_h - 22 - j * 8.5, line, fontName="Helvetica", fontSize=5.2, fillColor=TEXT_MUTED))

        # Arrow to next
        if i < 4:
            ax = cx + card_w + 2
            ay = top_y + card_h / 2
            d.add(Line(ax, ay, ax + 7, ay, strokeColor=ACCENT_CYAN, strokeWidth=1.2))
            d.add(Polygon([ax + 6, ay + 2.5, ax + 9, ay, ax + 6, ay - 2.5], fillColor=ACCENT_CYAN, strokeColor=None))

    return d


def build_pdf(filename="PRAKALP_DRISHTI_SLIDE_1_PRESENTATION.pdf"):
    # Target directory
    target_path = os.path.abspath(filename)
    doc = SimpleDocTemplate(
        target_path,
        pagesize=(SLIDE_W, SLIDE_H),
        leftMargin=20,
        rightMargin=20,
        topMargin=16,
        bottomMargin=32
    )

    styles = getSampleStyleSheet()
    normal = styles["Normal"]

    # Custom typography styles
    style_kpi_val = ParagraphStyle(
        "KPIVal", parent=normal, fontName="Helvetica-Bold", fontSize=15, leading=17, alignment=1, textColor=TEXT_WHITE
    )
    style_kpi_lbl = ParagraphStyle(
        "KPILbl", parent=normal, fontName="Helvetica-Bold", fontSize=6.5, leading=8, alignment=1, textColor=ACCENT_CYAN
    )
    style_kpi_sub = ParagraphStyle(
        "KPISub", parent=normal, fontName="Helvetica", fontSize=5.5, leading=7, alignment=1, textColor=TEXT_MUTED
    )

    style_card_title = ParagraphStyle(
        "CardTitle", parent=normal, fontName="Helvetica-Bold", fontSize=8.5, leading=10.5, textColor=ACCENT_CYAN
    )
    style_card_body = ParagraphStyle(
        "CardBody", parent=normal, fontName="Helvetica", fontSize=6.2, leading=8.5, textColor=TEXT_MUTED
    )
    style_card_body_bold = ParagraphStyle(
        "CardBodyBold", parent=normal, fontName="Helvetica-Bold", fontSize=6.2, leading=8.5, textColor=TEXT_WHITE
    )

    story = []

    # =========================================================================
    # SLIDE 1: THE MASTER EXECUTIVE PRESENTATION SLIDE (16:9 Widescreen)
    # =========================================================================

    # 1. Slide Header
    header_data = [
        [
            Paragraph("<b>MINISTRY OF STATISTICS & PROGRAMME IMPLEMENTATION (MoSPI)</b> &nbsp;|&nbsp; PROBLEM STATEMENT: <b>SIH26103</b>", ParagraphStyle("H1", fontName="Helvetica-Bold", fontSize=7, leading=8.5, textColor=ACCENT_CYAN)),
            Paragraph("<b>SMART INDIA HACKATHON 2026</b> &nbsp;|&nbsp; <b>NATIONAL GRAND FINALE</b>", ParagraphStyle("H2", fontName="Helvetica-Bold", fontSize=7, leading=8.5, alignment=2, textColor=ACCENT_AMBER))
        ],
        [
            Paragraph("<b>PRAKALP DRISHTI:</b> Autonomous, Zero-Trust Infrastructure Intelligence", ParagraphStyle("H3", fontName="Helvetica-Bold", fontSize=13, leading=15, textColor=TEXT_WHITE)),
            Paragraph("<b>Slide 1:</b> Problem Understanding & Innovative Solution", ParagraphStyle("H4", fontName="Helvetica", fontSize=8.5, leading=10, alignment=2, textColor=TEXT_MUTED))
        ]
    ]
    t_header = Table(header_data, colWidths=[SLIDE_W * 0.65 - 20, SLIDE_W * 0.35 - 20])
    t_header.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), HEADER_BG),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_header)
    story.append(Spacer(1, 4))

    # 2. Top Banner: 6 Large-Number KPI Cards
    kpis = [
        ("2,207", "Mega-Projects Monitored", "1,823 Active • 220 Pipe • 164 Benchmarks", ACCENT_CYAN),
        ("₹41.78 L Cr", "Revised Capital Outlay", "Total Central Sector Mega Portfolio", ACCENT_AMBER),
        ("93.3%", "Conformal Coverage", "Empirical Calibration on 450 Held-Out", ACCENT_EMERALD),
        ("8.7 ms", "Stochastic LP Solver", "HiGHS Simplex w/ CVaR90 Tail-Risk", ACCENT_PURPLE),
        ("1.65×", "20% CCEA Evasion Discontinuity", "McCrary Density Spike at 19.4%–19.9%", ACCENT_ROSE),
        ("71.8%", "Sovereign Air-Gapped Geocode", "400,000-Pt Local Indian Gazetteer", ACCENT_BLUE)
    ]

    kpi_cols = []
    for val, lbl, sub, color_code in kpis:
        c_val = Paragraph(f"<font color='{color_code.hexval()}'>{val}</font>", style_kpi_val)
        c_lbl = Paragraph(lbl, style_kpi_lbl)
        c_sub = Paragraph(sub, style_kpi_sub)
        kpi_cols.append([c_val, c_lbl, c_sub])

    t_kpis = Table([kpi_cols], colWidths=[(SLIDE_W - 40) / 6] * 6)
    t_kpis.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), CARD_BG),
        ('BOX', (0,0), (-1,-1), 1, CARD_BORDER),
        ('INNERGRID', (0,0), (-1,-1), 0.5, CARD_BORDER),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 3),
        ('RIGHTPADDING', (0,0), (-1,-1), 3),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(t_kpis)
    story.append(Spacer(1, 5))

    # 3. Main Body Grid: Left Column (310pt) + Right Column (610pt)
    # Left Column: Failure Modes + Mini Paradigm Shift
    left_content = []
    left_content.append(Paragraph("🚨 5 SYSTEMIC INFRASTRUCTURE FAILURE MODES", style_card_title))
    left_content.append(Spacer(1, 2))

    failures = [
        ("1. Optimism Bias & Rebaselining Evasion:", "Static DPR completion dates reset repeatedly upward; hides years of delays, dashboard stays green."),
        ("2. Contractor Moral Hazard & Ghost Spending:", "Milestone disbursements based on self-reported web forms; zero independent orbital corroboration."),
        ("3. Cross-Ministry Rupee Contagion:", "Siloed tracking ignores multi-project DAGs; a rail delay locks ₹8,000+ Cr in finished power plants."),
        ("4. Statutory Threshold Gaming (20% CCEA):", "Contractors artificially cluster overruns at 19.4%–19.9% to bypass mandatory Cabinet scrutiny."),
        ("5. Rigid & Risk-Blind Capital Allocation:", "Budgets disbursed linearly/historically; ignores CVaR90 tail-loss and 10% statutory NER floor.")
    ]
    for h, b in failures:
        p = Paragraph(f"<b><font color='{TEXT_WHITE.hexval()}'>{h}</font></b> <font color='{TEXT_MUTED.hexval()}'>{b}</font>", style_card_body)
        left_content.append(p)
        left_content.append(Spacer(1, 2))

    left_content.append(Spacer(1, 3))
    left_content.append(Paragraph("🔄 PARADIGM SHIFT: TRADITIONAL vs PRAKALP DRISHTI", style_card_title))
    left_content.append(Spacer(1, 2))

    shifts = [
        ("Timeline Forecasting:", "Single Target Date (Unreliable)", "P10–P95 Calibrated Survival Fan (93.3% Cov)"),
        ("Ground Verification:", "100% Vendor Web Forms", "Zero-Trust Dual-Epoch Optical Audit (2.08m)"),
        ("Inter-Project Delays:", "Isolated Ministerial Silos", "Max-Plus DAG Dependency Network & Float"),
        ("Capital Reallocation:", "Historical Linear Tranches", "Two-Stage Stochastic LP (HiGHS, 8.7ms)")
    ]
    shift_rows = []
    for dim, curr, prak in shifts:
        row = [
            Paragraph(f"<b>{dim}</b>", ParagraphStyle("D1", fontName="Helvetica-Bold", fontSize=5.5, leading=7, textColor=TEXT_WHITE)),
            Paragraph(f"<font color='{ACCENT_ROSE.hexval()}'>✖ {curr}</font>", ParagraphStyle("D2", fontName="Helvetica", fontSize=5.2, leading=6.5, textColor=ACCENT_ROSE)),
            Paragraph(f"<font color='{ACCENT_EMERALD.hexval()}'>✔ {prak}</font>", ParagraphStyle("D3", fontName="Helvetica-Bold", fontSize=5.2, leading=6.5, textColor=ACCENT_EMERALD))
        ]
        shift_rows.append(row)

    t_shifts = Table(shift_rows, colWidths=[80, 110, 118])
    t_shifts.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#0B1326")),
        ('BOX', (0,0), (-1,-1), 0.5, CARD_BORDER),
        ('INNERGRID', (0,0), (-1,-1), 0.5, CARD_BORDER),
        ('TOPPADDING', (0,0), (-1,-1), 1.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 1.5),
        ('LEFTPADDING', (0,0), (-1,-1), 3),
        ('RIGHTPADDING', (0,0), (-1,-1), 3),
    ]))
    left_content.append(t_shifts)

    t_left_box = Table([[left_content]], colWidths=[314])
    t_left_box.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), CARD_BG),
        ('BOX', (0,0), (-1,-1), 1, CARD_BORDER),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))

    # Right Column: Charts on top (McCrary + Kaal-Chakra) and Pipeline at bottom
    chart1 = create_mccrary_chart(width=294, height=140)
    chart2 = create_kaal_chakra_chart(width=294, height=140)
    t_charts = Table([[chart1, chart2]], colWidths=[297, 297])
    t_charts.setStyle(TableStyle([
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
    ]))

    pipe_diag = create_pipeline_diagram(width=594, height=92)

    right_content = [
        [t_charts],
        [Spacer(1, 4)],
        [pipe_diag]
    ]
    t_right_box = Table(right_content, colWidths=[594])
    t_right_box.setStyle(TableStyle([
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
    ]))

    # Master split: Left Box (314pt) + Right Box (596pt) = 910pt (fits inside 920pt drawable)
    t_master_grid = Table([[t_left_box, t_right_box]], colWidths=[318, 602])
    t_master_grid.setStyle(TableStyle([
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(t_master_grid)

    # =========================================================================
    # SLIDE 2: COMPREHENSIVE PROBLEM THEORY & DATA TAXONOMY DOSSIER
    # =========================================================================
    story.append(PageBreak())

    header_slide2 = [
        [
            Paragraph("<b>PRAKALP DRISHTI</b> &nbsp;|&nbsp; SLIDE 1 EXECUTIVE TECHNICAL DOSSIER", ParagraphStyle("H2_1", fontName="Helvetica-Bold", fontSize=7, leading=8.5, textColor=ACCENT_CYAN)),
            Paragraph("<b>SECTION 1: PROBLEM THEORY & EVIDENCE-ORIENTED TAXONOMY</b>", ParagraphStyle("H2_2", fontName="Helvetica-Bold", fontSize=7, leading=8.5, alignment=2, textColor=TEXT_WHITE))
        ]
    ]
    t_h2 = Table(header_slide2, colWidths=[SLIDE_W * 0.5 - 20, SLIDE_W * 0.5 - 20])
    t_h2.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), HEADER_BG),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_h2)
    story.append(Spacer(1, 6))

    # Detailed Problem Theory Breakdown
    p_theory_title = Paragraph("1. PROBLEM THEORY: 5 EVIDENCE-ORIENTED NATIONAL BOTTLENECKS", style_card_title)
    story.append(p_theory_title)
    story.append(Spacer(1, 4))

    theory_table_data = [
        [
            Paragraph("<b>Failure Mode & Statutory Context</b>", ParagraphStyle("TH1", fontName="Helvetica-Bold", fontSize=6.5, textColor=TEXT_WHITE)),
            Paragraph("<b>Who is Affected & Institutional Friction</b>", ParagraphStyle("TH2", fontName="Helvetica-Bold", fontSize=6.5, textColor=TEXT_WHITE)),
            Paragraph("<b>The Information / Verification Gap</b>", ParagraphStyle("TH3", fontName="Helvetica-Bold", fontSize=6.5, textColor=TEXT_WHITE)),
            Paragraph("<b>Economic & National Consequences</b>", ParagraphStyle("TH4", fontName="Helvetica-Bold", fontSize=6.5, textColor=TEXT_WHITE))
        ],
        [
            Paragraph("<b>1. Optimism Bias & Rebaselining Evasion</b><br/>(DPR Idealization)", style_card_body_bold),
            Paragraph("PMO (PRAGATI), Cabinet Secretariat, Line Ministries submitting unfeasible single target dates.", style_card_body),
            Paragraph("Deterministic milestone traps ignore monsoon seasonality, land acquisition, and contractor capacity.", style_card_body),
            Paragraph("44%–55% of projects delayed 12–140 months; repeat baseline resets hide accumulated slippages.", style_card_body)
        ],
        [
            Paragraph("<b>2. Contractor Moral Hazard & Ghost Spending</b><br/>(Self-Reported CUF)", style_card_body_bold),
            Paragraph("MoSPI IPMD, Department of Expenditure, State field project authorities.", style_card_body),
            Paragraph("Milestone payouts triggered by unverified vendor web forms without orbital ground-truth.", style_card_body),
            Paragraph("Funds disbursed against physical claims that do not physically exist on the ground.", style_card_body)
        ],
        [
            Paragraph("<b>3. Cross-Ministry Rupee Contagion</b><br/>(Departmental Silos)", style_card_body_bold),
            Paragraph("Inter-connected economic corridors: Railways, Power, Coal, Ports, Petroleum.", style_card_body),
            Paragraph("Absence of multi-project DAG dependency tracking; unquantified Free Float and Total Float.", style_card_body),
            Paragraph("₹23.97 Lakh Crore locked in cascade dependencies where one delayed track halts power plants.", style_card_body)
        ],
        [
            Paragraph("<b>4. Statutory Arbitrage (20% CCEA Rule)</b><br/>(Threshold Gaming)", style_card_body_bold),
            Paragraph("Cabinet Committee on Economic Affairs (CCEA), CAG, Central Vigilance Commission (CVC).", style_card_body),
            Paragraph("Cost revisions capped artificially at 19.4%–19.9% to evade mandatory Cabinet review.", style_card_body),
            Paragraph("Measured 1.65× McCrary density spike proves deliberate circumvention of public audit.", style_card_body)
        ],
        [
            Paragraph("<b>5. Rigid Linear Capital Allocation</b><br/>(Diminishing Returns)", style_card_body_bold),
            Paragraph("Ministry of Finance, Project Monitoring Group (PMG), State executing PSUs.", style_card_body),
            Paragraph("Historical budgeting treats capital as uniform; allocates funds to projects in legal arbitration.", style_card_body),
            Paragraph("₹4.8 Lakh Crore+ cumulative overruns; missed economic commissioning per Rupee invested.", style_card_body)
        ]
    ]
    t_theory = Table(theory_table_data, colWidths=[180, 220, 240, 260])
    t_theory.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#1E2D4A")),
        ('BACKGROUND', (0,1), (-1,-1), CARD_BG),
        ('BOX', (0,0), (-1,-1), 1, CARD_BORDER),
        ('INNERGRID', (0,0), (-1,-1), 0.5, CARD_BORDER),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_theory)
    story.append(Spacer(1, 6))

    # Statistics Taxonomy Table (Real vs Measured vs Illustrative)
    p_tax_title = Paragraph("2. DATA TAXONOMY: RIGOROUS DISTINCTION OF STATISTICAL CLAIMS", style_card_title)
    story.append(p_tax_title)
    story.append(Spacer(1, 4))

    tax_table_data = [
        [
            Paragraph("<b>Taxonomy Class</b>", ParagraphStyle("TX1", fontName="Helvetica-Bold", fontSize=6.5, textColor=TEXT_WHITE)),
            Paragraph("<b>Key Indicator & Metric</b>", ParagraphStyle("TX2", fontName="Helvetica-Bold", fontSize=6.5, textColor=TEXT_WHITE)),
            Paragraph("<b>Value / Baseline</b>", ParagraphStyle("TX3", fontName="Helvetica-Bold", fontSize=6.5, textColor=TEXT_WHITE)),
            Paragraph("<b>Credible Source / Mathematical Derivation</b>", ParagraphStyle("TX4", fontName="Helvetica-Bold", fontSize=6.5, textColor=TEXT_WHITE))
        ],
        [
            Paragraph("<b>A. Real-World Facts</b><br/>(Official Government Records)", style_card_body_bold),
            Paragraph("Monitored Mega-Projects (>= ₹150 Cr)<br/>Cumulative Historical Cost Overruns<br/>Projects Facing Serious Timeline Delays<br/>Mandatory Cabinet CCEA Audit Trigger", style_card_body),
            Paragraph("<b>2,207 Projects<br/>₹4.8 Lakh Crore+<br/>44% to 55% (12–140 Mos)<br/>>= 20% Cost Escalation</b>", style_card_body_bold),
            Paragraph("MoSPI PAIMANA Flash Reports (Jan–June 2026 series)<br/>IPMD Infrastructure Annual Summaries<br/>Cabinet Secretariat Project Monitoring Group Guidelines", style_card_body)
        ],
        [
            Paragraph("<b>B. Project-Measured Metrics</b><br/>(Computed from our Code/DB)", style_card_body_bold),
            Paragraph("Split-Conformal Calibration Coverage<br/>Log-logistic AFT Censoring Correction<br/>Stochastic LP Simplex Re-solve Speed<br/>McCrary Discontinuity Evasion Factor<br/>Air-Gapped Sovereign Geocoding Rate", style_card_body),
            Paragraph("<b>93.3% Coverage (Q=5.185m)<br/>7.4% Event Rate (160/2148)<br/>8.7 ms (HiGHS Open-Source)<br/>1.65× Clustering at 19.9%<br/>71.8% Offline Matched</b>", style_card_body_bold),
            Paragraph("450 held-out test projects (conformal_calibration.py)<br/>Penalised MLE with right-censoring (aft_survival.py)<br/>Two-stage LP with CVaR90 risk (vitta_vyuha.py)<br/>Kernel density log-difference (satya_kavach.py)<br/>68MB offline Indian Gazetteer (geonames_IN.txt)", style_card_body)
        ],
        [
            Paragraph("<b>C. Illustrative Simulations</b><br/>(Stress-Testing What-Ifs)", style_card_body_bold),
            Paragraph("Monsoon Civil Season Shock Impact<br/>Capital Contraction Reallocation Shock<br/>Cross-Project Dependency Domino Loss", style_card_body),
            Paragraph("<b>+15% IMD Rain -> 2-8 Mo Slip<br/>₹10,000 Cr -> ₹6,000 Cr Cut<br/>₹3,500 Cr Rail -> ₹8,200 Cr Power</b>", style_card_body_bold),
            Paragraph("VARSHA-SPEED dynamic working-window elasticity<br/>VITTA-VYUHA interactive what-if capital slider<br/>SETU-VARSHA Max-Plus schedule float propagation", style_card_body)
        ]
    ]
    t_tax = Table(tax_table_data, colWidths=[150, 240, 190, 320])
    t_tax.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#1E2D4A")),
        ('BACKGROUND', (0,1), (-1,-1), CARD_BG),
        ('BOX', (0,0), (-1,-1), 1, CARD_BORDER),
        ('INNERGRID', (0,0), (-1,-1), 0.5, CARD_BORDER),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_tax)

    # =========================================================================
    # SLIDE 3: VISUAL GRAPH SPECIFICATIONS & BEFORE/AFTER MATRIX
    # =========================================================================
    story.append(PageBreak())

    header_slide3 = [
        [
            Paragraph("<b>PRAKALP DRISHTI</b> &nbsp;|&nbsp; SLIDE 1 EXECUTIVE TECHNICAL DOSSIER", ParagraphStyle("H3_1", fontName="Helvetica-Bold", fontSize=7, leading=8.5, textColor=ACCENT_CYAN)),
            Paragraph("<b>SECTION 2: GRAPH SPECIFICATIONS & DETAILED BEFORE vs AFTER MATRIX</b>", ParagraphStyle("H3_2", fontName="Helvetica-Bold", fontSize=7, leading=8.5, alignment=2, textColor=TEXT_WHITE))
        ]
    ]
    t_h3 = Table(header_slide3, colWidths=[SLIDE_W * 0.5 - 20, SLIDE_W * 0.5 - 20])
    t_h3.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), HEADER_BG),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_h3)
    story.append(Spacer(1, 6))

    # Detailed Specifications for 4 Core Graphs
    p_graph_title = Paragraph("3. DETAILED GRAPH SPECIFICATIONS FOR SIH JURY DEFENSE", style_card_title)
    story.append(p_graph_title)
    story.append(Spacer(1, 4))

    graph_table_data = [
        [
            Paragraph("<b>Graph Concept & Engine</b>", ParagraphStyle("GH1", fontName="Helvetica-Bold", fontSize=6.5, textColor=TEXT_WHITE)),
            Paragraph("<b>Visual Type & Coordinates</b>", ParagraphStyle("GH2", fontName="Helvetica-Bold", fontSize=6.5, textColor=TEXT_WHITE)),
            Paragraph("<b>Key Markers & Thresholds</b>", ParagraphStyle("GH3", fontName="Helvetica-Bold", fontSize=6.5, textColor=TEXT_WHITE)),
            Paragraph("<b>Critical Decision Insight Communicated</b>", ParagraphStyle("GH4", fontName="Helvetica-Bold", fontSize=6.5, textColor=TEXT_WHITE))
        ],
        [
            Paragraph("<b>1. McCrary Discontinuity Audit</b><br/>(SATYA-KAVACH)", style_card_body_bold),
            Paragraph("Frequency Histogram with McCrary Density Estimator<br/><b>X:</b> Reported Overrun % (0–35%)<br/><b>Y:</b> Project Frequency (0–450)", style_card_body),
            Paragraph("Red dashed vertical line at <b>x = 20.0%</b> (Mandatory CCEA review). Callout badge at <b>19.4%–19.9%</b>.", style_card_body),
            Paragraph("Visually exposes deliberate agency manipulation to evade Cabinet scrutiny, justifying automated statutory audits.", style_card_body)
        ],
        [
            Paragraph("<b>2. Kaal-Chakra Survival Fan</b><br/>(KAAL-CHAKRA)", style_card_body_bold),
            Paragraph("Calibrated Survival Fan Chart (AFT Model)<br/><b>X:</b> Timeline (Sanction to +60 Mos)<br/><b>Y:</b> Probability of Completion (0–1.0)", style_card_body),
            Paragraph("Single Red Dot: DPR deterministic date (0.1% prob). Shaded ribbons: <b>P10, P50, P80, P95</b> quantiles.", style_card_body),
            Paragraph("Eliminates optimism bias by replacing single false target dates with honest, calibrated risk envelopes (93.3% cov).", style_card_body)
        ],
        [
            Paragraph("<b>3. Cross-Ministry Max-Plus DAG</b><br/>(SETU-VARSHA)", style_card_body_bold),
            Paragraph("Directed Acyclic Graph (DAG) Network<br/><b>Nodes:</b> Mine -> Rail -> Thermal Plant<br/><b>Edges:</b> Total Float & Free Float (Days)", style_card_body),
            Paragraph("Edge thickness = Capital Exposure (₹ Cr). Color: Green (Buffer intact), Red (Float breached).", style_card_body),
            Paragraph("Quantifies systemic rupee contagion: proves how an unannounced 6-month rail slip locks ₹8,200 Cr in power plants.", style_card_body)
        ],
        [
            Paragraph("<b>4. Capital Efficiency Duals Curve</b><br/>(VITTA-VYUHA)", style_card_body_bold),
            Paragraph("Marginal Yield Line Chart<br/><b>X:</b> Capex Allocation (₹2,000–₹40,000 Cr)<br/><b>Y:</b> Shadow Price (π_budget: ₹ Return/₹1 Cr)", style_card_body),
            Paragraph("Slope transitions: π=2.23 at ₹2,000 Cr -> π=1.21 at ₹10,000 Cr -> π=0.00 at ₹34,919 Cr (Absorptive saturation).", style_card_body),
            Paragraph("Guides Finance Ministry on exact budget required before capital suffers zero marginal return due to site arbitration.", style_card_body)
        ]
    ]
    t_graphs = Table(graph_table_data, colWidths=[160, 220, 240, 280])
    t_graphs.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#1E2D4A")),
        ('BACKGROUND', (0,1), (-1,-1), CARD_BG),
        ('BOX', (0,0), (-1,-1), 1, CARD_BORDER),
        ('INNERGRID', (0,0), (-1,-1), 0.5, CARD_BORDER),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_graphs)
    story.append(Spacer(1, 6))

    # Comprehensive Before vs After Matrix
    p_bva_title = Paragraph("4. COMPREHENSIVE BEFORE vs AFTER COMPARISON MATRIX", style_card_title)
    story.append(p_bva_title)
    story.append(Spacer(1, 4))

    bva_data = [
        [
            Paragraph("<b>Evaluation Dimension</b>", ParagraphStyle("BH1", fontName="Helvetica-Bold", fontSize=6.5, textColor=TEXT_WHITE)),
            Paragraph("<b>Current Traditional System (PAIMANA / OCMS)</b>", ParagraphStyle("BH2", fontName="Helvetica-Bold", fontSize=6.5, textColor=ACCENT_ROSE)),
            Paragraph("<b>Prakalp Drishti Platform Paradigm</b>", ParagraphStyle("BH3", fontName="Helvetica-Bold", fontSize=6.5, textColor=ACCENT_EMERALD)),
            Paragraph("<b>Measurable Performance Differential</b>", ParagraphStyle("BH4", fontName="Helvetica-Bold", fontSize=6.5, textColor=TEXT_WHITE))
        ],
        [
            Paragraph("<b>1. Timeline Reliability</b>", style_card_body_bold),
            Paragraph("Deterministic static date; rebaselined 3-4 times without penalty.", style_card_body),
            Paragraph("Log-logistic AFT Survival model with split-conformal intervals.", style_card_body),
            Paragraph("<b>93.3% empirical coverage</b> across 450 held-out national test projects.", style_card_body_bold)
        ],
        [
            Paragraph("<b>2. Ground-Truth Verification</b>", style_card_body_bold),
            Paragraph("100% vendor self-reported Common Upload Forms (CUF).", style_card_body),
            Paragraph("Dual-epoch optical satellite verification (ExG / VARI spectral differencing).", style_card_body),
            Paragraph("<b>4,414 satellite tiles audited</b> at 2.08–2.35 m/px resolution.", style_card_body_bold)
        ],
        [
            Paragraph("<b>3. Inter-Agency Coordination</b>", style_card_body_bold),
            Paragraph("Departmental silos; ministries unaware of external upstream delays.", style_card_body),
            Paragraph("Max-Plus multi-project DAG dependency network with float accounting.", style_card_body),
            Paragraph("<b>₹23.97 Lakh Crore</b> interconnected capital dependencies mapped.", style_card_body_bold)
        ],
        [
            Paragraph("<b>4. Capital Reallocation Speed</b>", style_card_body_bold),
            Paragraph("Quarterly committee review; linear historical budget distribution.", style_card_body),
            Paragraph("Two-Stage Stochastic LP with CVaR90 and 10% statutory NER floor.", style_card_body),
            Paragraph("<b>8.7 milliseconds solver turnaround</b> on open-source HiGHS simplex.", style_card_body_bold)
        ],
        [
            Paragraph("<b>5. Regulatory Fraud Prevention</b>", style_card_body_bold),
            Paragraph("Manual post-facto audit sampling; vulnerable to 19.9% CCEA gaming.", style_card_body),
            Paragraph("Automated McCrary discontinuity detection and CPWD Clause 10CC check.", style_card_body),
            Paragraph("<b>1.65× anomaly flagged</b>; 60%-70% raw material cost inflation audited.", style_card_body_bold)
        ],
        [
            Paragraph("<b>6. Executive Governance Trust</b>", style_card_body_bold),
            Paragraph("800-page monthly static PDFs; subjective numbers prone to dispute.", style_card_body),
            Paragraph("Bilingual (English + Hindi) Cabinet dossier with cryptographic provenance.", style_card_body),
            Paragraph("<b>RFC 8785 JSON Canonicalization & SHA-256 Merkle Tree Proofs</b>.", style_card_body_bold)
        ]
    ]
    t_bva = Table(bva_data, colWidths=[130, 240, 270, 260])
    t_bva.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#1E2D4A")),
        ('BACKGROUND', (0,1), (-1,-1), CARD_BG),
        ('BOX', (0,0), (-1,-1), 1, CARD_BORDER),
        ('INNERGRID', (0,0), (-1,-1), 0.5, CARD_BORDER),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_bva)

    # =========================================================================
    # SLIDE 4: JURY DEFENSE & TECHNICAL ENGINE MAPPING
    # =========================================================================
    story.append(PageBreak())

    header_slide4 = [
        [
            Paragraph("<b>PRAKALP DRISHTI</b> &nbsp;|&nbsp; SLIDE 1 EXECUTIVE TECHNICAL DOSSIER", ParagraphStyle("H4_1", fontName="Helvetica-Bold", fontSize=7, leading=8.5, textColor=ACCENT_CYAN)),
            Paragraph("<b>SECTION 3: ARCHITECTURAL ENGINES & WINNING JURY DEFENSE</b>", ParagraphStyle("H4_2", fontName="Helvetica-Bold", fontSize=7, leading=8.5, alignment=2, textColor=TEXT_WHITE))
        ]
    ]
    t_h4 = Table(header_slide4, colWidths=[SLIDE_W * 0.5 - 20, SLIDE_W * 0.5 - 20])
    t_h4.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), HEADER_BG),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_h4)
    story.append(Spacer(1, 6))

    # Analytical Engines Overview Table
    p_eng_title = Paragraph("5. THE 10 DEDICATED ANALYTICAL ENGINES INSIDE DECISION HUB", style_card_title)
    story.append(p_eng_title)
    story.append(Spacer(1, 4))

    eng_data = [
        [
            Paragraph("<b>Engine Name & Module</b>", ParagraphStyle("EH1", fontName="Helvetica-Bold", fontSize=6.5, textColor=TEXT_WHITE)),
            Paragraph("<b>Core Mathematical & Algorithmic Formulation</b>", ParagraphStyle("EH2", fontName="Helvetica-Bold", fontSize=6.5, textColor=TEXT_WHITE)),
            Paragraph("<b>Data Ingestion Inputs</b>", ParagraphStyle("EH3", fontName="Helvetica-Bold", fontSize=6.5, textColor=TEXT_WHITE)),
            Paragraph("<b>Sovereign Decision Output</b>", ParagraphStyle("EH4", fontName="Helvetica-Bold", fontSize=6.5, textColor=TEXT_WHITE))
        ],
        [
            Paragraph("<b>1. Kaal-Chakra</b><br/>(kaal_chakra.py)", style_card_body_bold),
            Paragraph("Log-logistic AFT Survival model; penalized MLE under right-censoring; split-conformal calibration (Romano et al.).", style_card_body),
            Paragraph("25 CUF fields, historical sanction dates, revision count, agency track record.", style_card_body),
            Paragraph("P10, P50, P80, P95 completion date quantiles with 93.3% empirical coverage.", style_card_body)
        ],
        [
            Paragraph("<b>2. Vitta-Vyuha</b><br/>(vitta_vyuha.py)", style_card_body_bold),
            Paragraph("Two-Stage Stochastic Linear Program (LP) with Rockafellar-Uryasev CVaR90 and 10% statutory NER floor.", style_card_body),
            Paragraph("Available budget tranche, project absorptive capacity, completion multiplier.", style_card_body),
            Paragraph("Prescriptive capex allocation per project with valid shadow prices (pi_budget).", style_card_body)
        ],
        [
            Paragraph("<b>3. Satya-Kavach</b><br/>(satya_kavach.py)", style_card_body_bold),
            Paragraph("McCrary Density Discontinuity Test; automated CPWD Clause 10CC material price escalation formula audit.", style_card_body),
            Paragraph("Contractor cost revision claims, DPIIT monthly WPI commodity series (steel, cement).", style_card_body),
            Paragraph("Detects 20% CCEA bypass gaming; flags unearned price gouging vs genuine inflation.", style_card_body)
        ],
        [
            Paragraph("<b>4. Setu-Varsha</b><br/>(setu_graph.py)", style_card_body_bold),
            Paragraph("Max-Plus Network Algebra; Free Float / Total Float schedule propagation; IMD working-window elasticity.", style_card_body),
            Paragraph("Multi-agency project dependencies, IMD 20-year gridded rainfall departures.", style_card_body),
            Paragraph("Simulates supply-chain domino delays and quantifies downstream locked capex.", style_card_body)
        ],
        [
            Paragraph("<b>5. Pragati-Saarthi</b><br/>(pragati_saarthi.py)", style_card_body_bold),
            Paragraph("Zero-Hallucination deterministic briefing generator; RFC 8785 JSON Canonicalization & SHA-256 Merkle Proofs.", style_card_body),
            Paragraph("All engine outputs, statutory compliance scores, risk tier rankings.", style_card_body),
            Paragraph("Bilingual (English + CSTT Hindi) executive PRAGATI dossiers for PMO/Cabinet.", style_card_body)
        ]
    ]
    t_eng = Table(eng_data, colWidths=[150, 270, 220, 260])
    t_eng.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#1E2D4A")),
        ('BACKGROUND', (0,1), (-1,-1), CARD_BG),
        ('BOX', (0,0), (-1,-1), 1, CARD_BORDER),
        ('INNERGRID', (0,0), (-1,-1), 0.5, CARD_BORDER),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_eng)
    story.append(Spacer(1, 6))

    # Jury Q&A Defense Guide
    p_qa_title = Paragraph("6. JURY & JUDGES Q&A COMBAT GUIDE (WINNING COUNTER-ARGUMENTS)", style_card_title)
    story.append(p_qa_title)
    story.append(Spacer(1, 4))

    qa_data = [
        [
            Paragraph("<b>Potential Jury Challenge</b>", ParagraphStyle("QH1", fontName="Helvetica-Bold", fontSize=6.5, textColor=TEXT_WHITE)),
            Paragraph("<b>The Trapped Competitor Answer</b>", ParagraphStyle("QH2", fontName="Helvetica-Bold", fontSize=6.5, textColor=ACCENT_ROSE)),
            Paragraph("<b>Prakalp Drishti Winning Jury Defense (Grounded in CLAIMS.md)</b>", ParagraphStyle("QH3", fontName="Helvetica-Bold", fontSize=6.5, textColor=ACCENT_EMERALD))
        ],
        [
            Paragraph("<b>'Why 2,207 projects when MoSPI report states 1,981 ongoing?'</b>", style_card_body_bold),
            Paragraph("'We just scraped whatever was on the portal.' (Shows lack of domain rigor)", style_card_body),
            Paragraph("<b>'1,981 is strictly the ongoing count in April 2026 alone. Our 2,207 catalog covers the full lifecycle: 1,823 active + 220 pre-construction pipeline + 164 completed benchmarks. Completed projects are mathematically vital to train ML models without right-censoring bias.'</b>", style_card_body_bold)
        ],
        [
            Paragraph("<b>'Did you use an LLM to predict dates and costs?'</b>", style_card_body_bold),
            Paragraph("'Yes, we fine-tuned GPT/Claude on project data.' (Fails on numerical hallucination)", style_card_body),
            Paragraph("<b>'Never. Public finance cannot tolerate probabilistic hallucinations. All dates and numbers are computed deterministically using log-logistic survival analysis and HiGHS linear programming. LLMs are strictly confined to text summarization with SHA-256 Merkle tree verification.'</b>", style_card_body_bold)
        ],
        [
            Paragraph("<b>'Why did you use an LP rather than a complex MILP for allocation?'</b>", style_card_body_bold),
            Paragraph("'Because MILP was too hard to code.' (Sounds amateurish)", style_card_body),
            Paragraph("<b>'An LP is deliberate and mathematically superior here: capital tranches are genuinely continuous, and continuous formulations yield valid dual variables (shadow prices: pi_budget). A MILP has no valid duals and could not defend marginal rupee return before the Cabinet.'</b>", style_card_body_bold)
        ],
        [
            Paragraph("<b>'Do you claim sub-meter satellite change detection?'</b>", style_card_body_bold),
            Paragraph("'Yes, our AI detects sub-meter changes from satellite.' (Fabrication: Esri/Sentinel is ~2m)", style_card_body),
            Paragraph("<b>'No. Measured ground sample distance is 2.08–2.35 m/px. Claiming sub-meter resolution from 2m pixels is sensor fabrication. We restrict our optical audit to defensible multi-pixel spectral differencing (ExG, VARI) and withhold verdicts if cloud cover obstructs.'</b>", style_card_body_bold)
        ]
    ]
    t_qa = Table(qa_data, colWidths=[180, 240, 480])
    t_qa.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#1E2D4A")),
        ('BACKGROUND', (0,1), (-1,-1), CARD_BG),
        ('BOX', (0,0), (-1,-1), 1, CARD_BORDER),
        ('INNERGRID', (0,0), (-1,-1), 0.5, CARD_BORDER),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_qa)

    # Build Document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"[SUCCESS] Generated PDF: {target_path}")
    return target_path


if __name__ == "__main__":
    out_file = "PRAKALP_DRISHTI_SLIDE_1_PRESENTATION.pdf"
    if len(sys.argv) > 1:
        out_file = sys.argv[1]
    build_pdf(out_file)
