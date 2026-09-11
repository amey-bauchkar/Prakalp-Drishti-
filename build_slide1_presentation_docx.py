"""
Prakalp Drishti: Slide 1 Master Presentation & Executive Dossier Generator (.docx)
Ministry of Statistics and Programme Implementation (MoSPI) | SIH Problem ID: SIH26103
Creates a formatted Microsoft Word document (.docx) adhering to GIGW & national hackathon jury standards.
"""

import os
import sys
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

# Curated Palette
C_NAVY = RGBColor(11, 25, 44)       # #0B192C
C_SLATE = RGBColor(30, 41, 59)      # #1E293B
C_BLUE = RGBColor(2, 132, 199)      # #0284C7
C_CYAN = RGBColor(14, 165, 233)     # #0EA5E9
C_AMBER = RGBColor(217, 119, 6)     # #D97706
C_ROSE = RGBColor(225, 29, 72)      # #E11D48
C_EMERALD = RGBColor(5, 150, 105)   # #059669
C_MUTED = RGBColor(100, 116, 139)   # #64748B
C_DARK = RGBColor(15, 23, 42)       # #0F172A

HEX_NAVY = "0B192C"
HEX_LIGHT_BG = "F8FAFC"
HEX_CARD_BG = "F1F5F9"
HEX_HEADER_BG = "0F172A"
HEX_BORDER = "CBD5E1"
HEX_CYAN_LIGHT = "E0F2FE"
HEX_AMBER_LIGHT = "FEF3C7"
HEX_ROSE_LIGHT = "FFE4E6"
HEX_EMERALD_LIGHT = "D1FAE5"


def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)


def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(
        f'<w:tcMar {nsdecls("w")}>'
        f'<w:top w:w="{top}" w:type="dxa"/>'
        f'<w:bottom w:w="{bottom}" w:type="dxa"/>'
        f'<w:left w:w="{left}" w:type="dxa"/>'
        f'<w:right w:w="{right}" w:type="dxa"/>'
        f'</w:tcMar>'
    )
    tcPr.append(tcMar)


def set_table_borders(table, color="CBD5E1", sz="4"):
    tblPr = table._tbl.tblPr
    borders = parse_xml(
        f'<w:tblBorders {nsdecls("w")}>'
        f'<w:top w:val="single" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:bottom w:val="single" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:left w:val="none"/>'
        f'<w:right w:val="none"/>'
        f'<w:insideH w:val="single" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:insideV w:val="none"/>'
        f'</w:tblBorders>'
    )
    tblPr.append(borders)


def add_heading_1(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(14)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.keep_with_next = True
    run = p.add_run(text)
    run.font.name = "Calibri"
    run.font.size = Pt(14)
    run.font.bold = True
    run.font.color.rgb = C_NAVY
    return p


def add_heading_2(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(10)
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.keep_with_next = True
    run = p.add_run(text)
    run.font.name = "Calibri"
    run.font.size = Pt(11.5)
    run.font.bold = True
    run.font.color.rgb = C_BLUE
    return p


def add_body_paragraph(doc, text, bold_prefix=None, space_after=3):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(1)
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.line_spacing = 1.15
    if bold_prefix:
        r_pre = p.add_run(bold_prefix)
        r_pre.font.name = "Calibri"
        r_pre.font.size = Pt(10)
        r_pre.font.bold = True
        r_pre.font.color.rgb = C_DARK
    r = p.add_run(text)
    r.font.name = "Calibri"
    r.font.size = Pt(10)
    r.font.color.rgb = RGBColor(51, 65, 85)
    return p


def add_callout_box(doc, title, text, bg_hex=HEX_CYAN_LIGHT, border_color="0284C7"):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    cell = tbl.cell(0, 0)
    cell.width = Inches(7.0)
    set_cell_background(cell, bg_hex)
    set_cell_margins(cell, top=140, bottom=140, left=200, right=200)

    tcPr = cell._tc.get_or_add_tcPr()
    borders = parse_xml(
        f'<w:tcBorders {nsdecls("w")}>'
        f'<w:left w:val="single" w:sz="24" w:space="0" w:color="{border_color}"/>'
        f'<w:top w:val="none"/>'
        f'<w:right w:val="none"/>'
        f'<w:bottom w:val="none"/>'
        f'</w:tcBorders>'
    )
    tcPr.append(borders)

    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(2)
    r_t = p.add_run(f"{title}\n")
    r_t.font.name = "Calibri"
    r_t.font.size = Pt(10.5)
    r_t.font.bold = True
    r_t.font.color.rgb = C_NAVY

    r_b = p.add_run(text)
    r_b.font.name = "Calibri"
    r_b.font.size = Pt(9.5)
    r_b.font.color.rgb = RGBColor(30, 41, 59)

    doc.add_paragraph().paragraph_format.space_after = Pt(4)


def create_document():
    doc = Document()

    # Configure Margins (0.75 in)
    for section in doc.sections:
        section.top_margin = Inches(0.75)
        section.bottom_margin = Inches(0.75)
        section.left_margin = Inches(0.75)
        section.right_margin = Inches(0.75)
        section.page_width = Inches(8.5)
        section.page_height = Inches(11.0)

    # -------------------------------------------------------------------------
    # COVER / HEADER BANNER
    # -------------------------------------------------------------------------
    p_meta = doc.add_paragraph()
    p_meta.paragraph_format.space_after = Pt(2)
    r_meta = p_meta.add_run("GOVERNMENT OF INDIA  •  MINISTRY OF STATISTICS & PROGRAMME IMPLEMENTATION (MoSPI)\nDATA INFORMATICS & INNOVATION DIVISION (DIID)  •  SMART INDIA HACKATHON 2026")
    r_meta.font.name = "Calibri"
    r_meta.font.size = Pt(8.5)
    r_meta.font.bold = True
    r_meta.font.color.rgb = C_BLUE

    p_title = doc.add_paragraph()
    p_title.paragraph_format.space_before = Pt(4)
    p_title.paragraph_format.space_after = Pt(2)
    r_title = p_title.add_run("PRAKALP DRISHTI: Autonomous Infrastructure Intelligence")
    r_title.font.name = "Calibri"
    r_title.font.size = Pt(20)
    r_title.font.bold = True
    r_title.font.color.rgb = C_NAVY

    p_sub = doc.add_paragraph()
    p_sub.paragraph_format.space_after = Pt(8)
    r_sub = p_sub.add_run("SLIDE 1 MASTER DOSSIER: PROBLEM UNDERSTANDING & INNOVATIVE SOLUTION\nProblem Statement ID: SIH26103  •  Portfolio Scope: 2,207 Central Sector Mega-Projects (₹41.78 Lakh Crore)")
    r_sub.font.name = "Calibri"
    r_sub.font.size = Pt(11)
    r_sub.font.color.rgb = C_MUTED

    # Core Tenets Callout Box
    add_callout_box(
        doc,
        "🏛️ EXECUTIVE MISSION & THREE UNCOMPROMISING CORE TENETS",
        "Prakalp Drishti transforms MoSPI's passive PAIMANA portal into an active, zero-trust infrastructure intelligence platform. "
        "1. ZERO TRUST: Never trust contractor self-reported milestone forms without orbital satellite corroboration (2.08–2.35 m/px). "
        "2. ZERO HALLUCINATION: No probabilistic LLM numbers; every timeline and cost quantile is mathematically derived (AFT Survival, Two-Stage LP) and cryptographically secured with RFC 8785 SHA-256 Merkle proofs. "
        "3. PRESCRIPTIVE ACTION: Don't just report what is delayed—prescribe exactly where to allocate capital to maximize commissioned capacity.",
        bg_hex=HEX_CYAN_LIGHT,
        border_color="0284C7"
    )

    # -------------------------------------------------------------------------
    # MASTER KPI DECK (TABLE)
    # -------------------------------------------------------------------------
    add_heading_1(doc, "Top Executive Presentation KPI Deck (Slide 1 Top Banner)")
    add_body_paragraph(doc, "These six large-number metrics form the primary visual anchor of Slide 1, derived directly from the official MoSPI database and our verified analytical engines:")

    kpi_tbl = doc.add_table(rows=2, cols=3)
    kpi_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(kpi_tbl, color="0284C7", sz="8")

    kpi_cards = [
        ("2,207", "Mega-Projects Monitored", "1,823 Active In-Flight • 220 Pipeline • 164 Benchmark", "Official MoSPI PAIMANA Master Catalog"),
        ("₹41.78 Lakh Cr", "Revised Public Outlay", "Total Central Sector Outlay (>= ₹150 Cr Outlay)", "MoSPI April 2026 Statutory Series"),
        ("93.3%", "Conformal Calibration", "Empirical Timeline Coverage (450 Held-Out Projects)", "Split-Conformal CQR (kaal_chakra.py)"),
        ("8.7 ms", "Stochastic LP Speed", "HiGHS Simplex Re-allocation with CVaR90 Risk", "Two-Stage Stochastic LP (vitta_vyuha.py)"),
        ("1.65×", "20% CCEA Evasion Factor", "Clustering at 19.4%–19.9% to Bypass Cabinet Review", "McCrary Discontinuity (satya_kavach.py)"),
        ("71.8%", "Sovereign Air-Gapped Match", "400,000-Point Local Indian Administrative Gazetteer", "Offline Sovereign Geocode (geonames_IN.txt)")
    ]

    for idx, (val, title, desc, prov) in enumerate(kpi_cards):
        r_idx = idx // 3
        c_idx = idx % 3
        cell = kpi_tbl.cell(r_idx, c_idx)
        cell.width = Inches(2.33)
        set_cell_background(cell, HEX_CARD_BG)
        set_cell_margins(cell, top=120, bottom=120, left=140, right=140)

        p = cell.paragraphs[0]
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.line_spacing = 1.1

        r_v = p.add_run(f"{val}\n")
        r_v.font.name = "Calibri"
        r_v.font.size = Pt(14)
        r_v.font.bold = True
        r_v.font.color.rgb = C_BLUE

        r_t = p.add_run(f"{title}\n")
        r_t.font.name = "Calibri"
        r_t.font.size = Pt(9.5)
        r_t.font.bold = True
        r_t.font.color.rgb = C_NAVY

        r_d = p.add_run(f"{desc}\n")
        r_d.font.name = "Calibri"
        r_d.font.size = Pt(8)
        r_d.font.color.rgb = C_MUTED

        r_p = p.add_run(f"Source: {prov}")
        r_p.font.name = "Calibri"
        r_p.font.size = Pt(7.5)
        r_p.font.italic = True
        r_p.font.color.rgb = RGBColor(148, 163, 184)

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # -------------------------------------------------------------------------
    # SECTION 1: PROBLEM THEORY
    # -------------------------------------------------------------------------
    add_heading_1(doc, "1. Problem Theory: 5 Evidence-Oriented Failure Modes")
    add_body_paragraph(doc, "Detailed institutional breakdown explaining why the current infrastructure monitoring apparatus fails:")

    theory_data = [
        ("Failure Mode", "Who is Affected", "Current Bottleneck & Data Gap", "National Economic Consequence"),
        ("1. Optimism Bias & Rebaselining Evasion",
         "PMO (PRAGATI), Cabinet Secretariat, Line Ministries.",
         "Static DPR completion targets assume zero monsoon friction or land delays. When delayed, agencies rebaseline targets upward; dashboards falsely turn green.",
         "44%–55% of mega-projects face 12 to 140 months delay, locking capital and stalling GDP multipliers."),
        ("2. Contractor Moral Hazard & Ghost Spending",
         "MoSPI IPMD, Department of Expenditure, Field Authorities.",
         "Progress milestones are self-reported on web forms without independent, automated ground-truth corroboration (e.g. dual-epoch optical satellite audit).",
         "Public funds disbursed against self-declared earthworks and civil progress that do not physically exist on the ground."),
        ("3. Cross-Ministry Rupee Contagion",
         "Inter-connected sectors: Railways, Coal, Power, Ports, Highways.",
         "Ministries monitor projects in isolated departmental silos; traditional systems do not model multi-project DAG dependencies or schedule float.",
         "Over ₹23.97 Lakh Crore locked in cascade dependencies: a 12-month rail line delay strands finished thermal plants and captive coal mines."),
        ("4. Statutory Threshold Gaming (20% CCEA)",
         "Cabinet Committee on Economic Affairs (CCEA), CAG, CVC.",
         "Under Cabinet rules, cost escalations >= 20% mandate rigorous CCEA review. Contractors artificially bunch reported overruns at 19.4%–19.9% to evade scrutiny.",
         "Empirically detected 1.65× McCrary density spike right below the 20% boundary, concealing structural price gouging from Cabinet oversight."),
        ("5. Rigid Linear Capital Allocation",
         "Ministry of Finance, Project Monitoring Group, Executing PSUs.",
         "Capital tranches are disbursed based on historical linear budgeting or equal departmental splits, ignoring absorptive bottlenecks and legal arbitration.",
         "Over ₹4.8 Lakh Crore cumulative overruns; deploying capital to stalled sites yields zero marginal progress while near-commissioned assets starve.")
    ]

    t_theory = doc.add_table(rows=len(theory_data), cols=4)
    t_theory.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_theory, color="CBD5E1", sz="4")

    col_widths = [Inches(1.5), Inches(1.5), Inches(2.2), Inches(1.8)]
    for r_idx, row in enumerate(theory_data):
        for c_idx, text in enumerate(row):
            cell = t_theory.cell(r_idx, c_idx)
            cell.width = col_widths[c_idx]
            set_cell_margins(cell, top=80, bottom=80, left=100, right=100)
            p = cell.paragraphs[0]
            p.paragraph_format.space_before = Pt(1)
            p.paragraph_format.space_after = Pt(1)
            p.paragraph_format.line_spacing = 1.1

            if r_idx == 0:
                set_cell_background(cell, HEX_HEADER_BG)
                run = p.add_run(text)
                run.font.name = "Calibri"
                run.font.size = Pt(9)
                run.font.bold = True
                run.font.color.rgb = RGBColor(255, 255, 255)
            else:
                bg = HEX_LIGHT_BG if r_idx % 2 == 1 else "FFFFFF"
                set_cell_background(cell, bg)
                run = p.add_run(text)
                run.font.name = "Calibri"
                run.font.size = Pt(8.5)
                if c_idx == 0:
                    run.font.bold = True
                    run.font.color.rgb = C_NAVY
                else:
                    run.font.color.rgb = RGBColor(51, 65, 85)

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # -------------------------------------------------------------------------
    # SECTION 2: STATISTICS TAXONOMY
    # -------------------------------------------------------------------------
    add_heading_1(doc, "2. Problem Scale & 3-Tier Statistics Taxonomy")
    add_body_paragraph(doc, "To ensure 100% credibility before SIH judges, all presentation figures are rigorously classified into three distinct tiers per our CLAIMS ledger:")

    tax_data = [
        ("Classification Tier", "Key Variable / Indicator", "Benchmark Value", "Credible Source / Mathematical Derivation"),
        ("A. REAL-WORLD BENCHMARKS\n(Supported by credible official sources)",
         "• Monitored Mega-Projects (>= ₹150 Cr)\n• Total Sanctioned / Revised Outlay\n• Systemic Delay Proportion\n• Cumulative Historical Overruns\n• Mandatory CCEA Audit Trigger",
         "• 2,207 Projects\n• ₹41.78 Lakh Crore\n• 44% to 55% of Projects\n• ₹4.8 Lakh Crore+\n• >= 20.0% Cost Overrun",
         "Official MoSPI PAIMANA Flash Reports (Jan–June 2026 series); IPMD Central Sector Project Monitoring Guidelines; Union Cabinet Secretariat Expenditure Guidelines."),
        ("B. PROJECT-MEASURED METRICS\n(Computed directly from our Code & DB)",
         "• Conformal Slippage Coverage\n• Right-Censoring Correction\n• Stochastic LP Solver Turnaround\n• 20% CCEA Discontinuity Factor\n• Sovereign Geocoding Accuracy\n• Audited Satellite Tiles",
         "• 93.3% Coverage (Q=5.185m)\n• 7.4% Event Rate (160/2148)\n• 8.7 ms (HiGHS Simplex)\n• 1.65× Evasion Discontinuity\n• 71.8% Sovereign Match\n• 4,414 Dual-Epoch Tiles",
         "450 held-out test projects (conformal_calibration.py); Log-logistic AFT penalised MLE (aft_survival.py); Two-stage LP with CVaR90 (vitta_vyuha.py); McCrary density log-diff (satya_kavach.py); 68MB offline Indian gazetteer."),
        ("C. ILLUSTRATIVE SIMULATIONS\n(What-if scenario stress-testing)",
         "• IMD Monsoon Season Contraction\n• Budget Contraction Shock Absorption\n• Inter-Project Cascade Bottleneck",
         "• +15% Rainfall -> 2-8 Mo Slip\n• ₹10k Cr -> ₹6k Cr Cut Shock\n• ₹3.5k Cr Rail -> ₹8.2k Cr Plant",
         "VARSHA-SPEED dynamic working-window elasticity; VITTA-VYUHA interactive capital slider; SETU-VARSHA Max-Plus float consumption simulation.")
    ]

    t_tax = doc.add_table(rows=len(tax_data), cols=4)
    t_tax.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_tax, color="CBD5E1", sz="4")

    col_widths_tax = [Inches(1.8), Inches(2.0), Inches(1.5), Inches(1.7)]
    for r_idx, row in enumerate(tax_data):
        for c_idx, text in enumerate(row):
            cell = t_tax.cell(r_idx, c_idx)
            cell.width = col_widths_tax[c_idx]
            set_cell_margins(cell, top=80, bottom=80, left=100, right=100)
            p = cell.paragraphs[0]
            p.paragraph_format.space_before = Pt(1)
            p.paragraph_format.space_after = Pt(1)
            p.paragraph_format.line_spacing = 1.1

            if r_idx == 0:
                set_cell_background(cell, HEX_HEADER_BG)
                run = p.add_run(text)
                run.font.name = "Calibri"
                run.font.size = Pt(9)
                run.font.bold = True
                run.font.color.rgb = RGBColor(255, 255, 255)
            else:
                bg = HEX_LIGHT_BG if r_idx % 2 == 1 else "FFFFFF"
                set_cell_background(cell, bg)
                run = p.add_run(text)
                run.font.name = "Calibri"
                run.font.size = Pt(8.5)
                if c_idx == 0:
                    run.font.bold = True
                    run.font.color.rgb = C_NAVY
                elif c_idx == 2:
                    run.font.bold = True
                    run.font.color.rgb = C_BLUE
                else:
                    run.font.color.rgb = RGBColor(51, 65, 85)

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # -------------------------------------------------------------------------
    # SECTION 3: GRAPH SPECIFICATIONS
    # -------------------------------------------------------------------------
    add_heading_1(doc, "3. Graph Ideas & Technical Visual Specifications")
    add_body_paragraph(doc, "Exact visual blueprints for the primary presentation graphs, detailing their coordinate systems, markers, and core policy insights:")

    graph_specs = [
        ("Graph 1: The 20% CCEA Regulatory Evasion Cliff (SATYA-KAVACH)",
         "Frequency Histogram with McCrary Discontinuity Density Overlay",
         "X-Axis: Reported Cost Overrun % (0% to 35%, binned in 1% intervals)\nY-Axis: Project Count (0 to 450 projects)",
         "Vertical red dashed line at x = 20.0% (Mandatory CCEA review). Prominent callout badge at 19.4%–19.9% showing 1.65× clustering.",
         "Visually exposes how executing agencies manipulate self-reported cost revisions right below 20% to avoid Cabinet review, proving the necessity of automated statutory auditing."),

        ("Graph 2: Kaal-Chakra Survival Fan vs Deterministic Target (KAAL-CHAKRA)",
         "Calibrated Multi-Quantile Survival Fan Chart",
         "X-Axis: Timeline Progression (Sanction Date to +60 Months)\nY-Axis: Cumulative Probability of Project Completion (0.0 to 1.0)",
         "Single Red Point: Contractor DPR target date (0.1% empirical feasibility). Shaded probability ribbons: P10 (Optimistic), P50 (Expected Median), P80 (Prudent Target), P95 (Tail Risk).",
         "Debunks the 'deterministic milestone trap' and provides the PMO with an honest, calibrated risk envelope backed by 93.3% empirical coverage."),

        ("Graph 3: Cross-Ministry Max-Plus Supply Chain Domino (SETU-VARSHA)",
         "Directed Acyclic Graph (DAG) Network with Schedule Float",
         "Nodes: Upstream Coal Mine -> Evacuation Rail -> Downstream Thermal Power Plant\nEdges: Free Float & Total Float (Days) and Capex Exposure (₹ Cr)",
         "Edge color: Green (Buffer intact), Amber (Free float violated), Red (Critical path ruptured; ₹8,200 Cr idle asset).",
         "Illustrates inter-ministerial rupee contagion: proves that a 6-month delay in a Ministry of Railways freight line locks thousands of crores of Ministry of Power capital."),

        ("Graph 4: Capital Efficiency vs Diminishing Returns (VITTA-VYUHA)",
         "Marginal Yield Dual Curve (Shadow Price Analysis)",
         "X-Axis: Total Available Capex Pool (₹2,000 Cr to ₹40,000 Cr)\nY-Axis: Shadow Price (pi_budget: Marginal Economic Return per ₹1 Cr)",
         "Key slope inflection points: pi = 2.23 at ₹2,000 Cr -> pi = 1.21 at ₹10,000 Cr -> pi = 0.00 at ≈₹34,919 Cr (Absorptive saturation).",
         "Provides the Ministry of Finance with the exact mathematical ceiling beyond which pouring additional capital yields zero return due to site arbitration or litigation.")
    ]

    for title, g_type, axes, markers, insight in graph_specs:
        add_heading_2(doc, title)
        p_g = doc.add_paragraph()
        p_g.paragraph_format.space_before = Pt(1)
        p_g.paragraph_format.space_after = Pt(2)
        p_g.paragraph_format.line_spacing = 1.15

        r = p_g.add_run("• Chart Type: "); r.bold = True; r.font.color.rgb = C_NAVY
        p_g.add_run(f"{g_type}\n")

        r = p_g.add_run("• Coordinate Axes: "); r.bold = True; r.font.color.rgb = C_NAVY
        p_g.add_run(f"{axes}\n")

        r = p_g.add_run("• Visual Markers & Thresholds: "); r.bold = True; r.font.color.rgb = C_NAVY
        p_g.add_run(f"{markers}\n")

        r = p_g.add_run("• Key Policy Insight: "); r.bold = True; r.font.color.rgb = C_BLUE
        p_g.add_run(insight)

    # -------------------------------------------------------------------------
    # SECTION 4: BEFORE vs AFTER COMPARISON MATRIX
    # -------------------------------------------------------------------------
    add_heading_1(doc, "4. Before vs After: Comprehensive Paradigm Shift")
    add_body_paragraph(doc, "Measurable comparison across six fundamental infrastructure monitoring dimensions:")

    bva_data = [
        ("Parameter", "Current Traditional System (PAIMANA / OCMS)", "Prakalp Drishti Platform Paradigm", "Measurable Performance Differential"),
        ("1. Completion Forecasting",
         "Single deterministic target date based on idealized DPR; repeated rebaselining hides years of actual delay.",
         "Calibrated Log-logistic AFT Survival Model with split-conformal prediction intervals (P10 to P95 quantiles).",
         "93.3% empirical coverage across 450 held-out national mega-projects (Q = 5.185 months)."),
        ("2. Ground-Truth Verification",
         "100% reliance on contractor self-reported web forms; zero independent physical corroboration.",
         "Zero-Trust Dual-Epoch Optical Audit using 2.08–2.35 m/px satellite imagery (ExG & VARI spectral differencing).",
         "4,414 dual-epoch satellite scenes audited across all 2,207 projects, eliminating ghost progress."),
        ("3. Inter-Agency Coordination",
         "Ministries tracked in departmental silos; external upstream delays remain completely invisible.",
         "Multi-Project Directed Acyclic Graph (DAG) with Max-Plus algebra distinguishing Free Float and Total Float.",
         "Over ₹23.97 Lakh Crore in interconnected capital dependencies mapped and continuously monitored."),
        ("4. Capital Reallocation Speed",
         "Quarterly committee meetings with rigid linear or historical departmental disbursements.",
         "Two-Stage Stochastic Linear Program (HiGHS) with Rockafellar–Uryasev CVaR90 and 10% statutory NER floor.",
         "8.7 milliseconds solver turnaround across 2,207 continuous variables, enabling real-time budget sliders."),
        ("5. Regulatory Integrity & Audit",
         "Post-facto manual audit sampling; vulnerable to 19.9% CCEA threshold evasion and unearned Clause 10CC claims.",
         "Automated McCrary discontinuity detection and automated CPWD Clause 10CC raw material WPI formula auditing.",
         "1.65× threshold gaming anomaly flagged; audits 60%–70% civil costs against official WPI commodity series."),
        ("6. Executive Usability & Trust",
         "800-page monthly static MoSPI PDFs; disputed subjective numbers prone to audit vulnerabilities.",
         "Interactive Decision Hub with bilingual (English + CSTT Hindi) PRAGATI briefing dossiers and cryptographic proof.",
         "RFC 8785 JSON Canonicalization and SHA-256 Merkle tree verification ensures zero numerical hallucinations.")
    ]

    t_bva = doc.add_table(rows=len(bva_data), cols=4)
    t_bva.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_bva, color="CBD5E1", sz="4")

    col_widths_bva = [Inches(1.5), Inches(1.9), Inches(2.1), Inches(1.5)]
    for r_idx, row in enumerate(bva_data):
        for c_idx, text in enumerate(row):
            cell = t_bva.cell(r_idx, c_idx)
            cell.width = col_widths_bva[c_idx]
            set_cell_margins(cell, top=80, bottom=80, left=100, right=100)
            p = cell.paragraphs[0]
            p.paragraph_format.space_before = Pt(1)
            p.paragraph_format.space_after = Pt(1)
            p.paragraph_format.line_spacing = 1.1

            if r_idx == 0:
                set_cell_background(cell, HEX_HEADER_BG)
                run = p.add_run(text)
                run.font.name = "Calibri"
                run.font.size = Pt(9)
                run.font.bold = True
                run.font.color.rgb = RGBColor(255, 255, 255)
            else:
                bg = HEX_LIGHT_BG if r_idx % 2 == 1 else "FFFFFF"
                set_cell_background(cell, bg)
                run = p.add_run(text)
                run.font.name = "Calibri"
                run.font.size = Pt(8.5)
                if c_idx == 0:
                    run.font.bold = True
                    run.font.color.rgb = C_NAVY
                elif c_idx == 1:
                    run.font.color.rgb = C_ROSE
                elif c_idx == 2:
                    run.font.color.rgb = C_EMERALD
                    run.font.bold = True
                else:
                    run.font.bold = True
                    run.font.color.rgb = C_DARK

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # -------------------------------------------------------------------------
    # SECTION 5: CENTRAL INNOVATION ARCHITECTURE
    # -------------------------------------------------------------------------
    add_heading_1(doc, "5. Central Innovation Architecture: Autonomous Decision Pipeline")
    add_body_paragraph(doc, "Prakalp Drishti transforms fragmented public administration data into verified executive action across five seamless operational layers:")

    pipeline_steps = [
        ("STAGE 1: HETEROGENEOUS RAW INGESTION",
         "• MoSPI PAIMANA Portal: 25 statutory CUF fields across 2,207 mega-projects (Jan–June 2026 cycles).\n"
         "• Satellite Remote Sensing: 4,414 dual-epoch optical audit tiles from Esri Wayback (2.08–2.35 m/px).\n"
         "• IMD Gridded Meteorological Series: 20-year state-level monsoon rainfall departure histories.\n"
         "• DPIIT Wholesale Price Index: Monthly commodity price indices for structural steel, cement, bitumen, diesel.\n"
         "• NSE/BSE Public Disclosures: Corporate balance sheets (debt/equity, Altman Z-score) for executing PSUs.\n"
         "• Sovereign Gazetteer: 400,000-point offline Indian administrative registry for air-gapped geocoding."),

        ("STAGE 2: AUTOMATED DATA CLEANING & RECONCILIATION",
         "• Baseline Revision Reconstruction: Strips away repeated target resets to calculate true historical slippage.\n"
         "• Right-Censoring Segregation: Identifies 160 completed benchmarks vs 1,988 in-flight censored records.\n"
         "• Sovereign Air-Gapped Geocoding: Resolves 71.8% of projects locally without leaking coordinates to foreign APIs.\n"
         "• Physical Progress Velocity: Calculates first-order derivatives of monthly physical expenditure rates."),

        ("STAGE 3: PREDICTIVE & FORENSIC ANALYTICS ENGINES",
         "• KAAL-CHAKRA: Log-logistic AFT Survival Model with split-conformal calibration (P10–P95 quantiles).\n"
         "• SETU-VARSHA: Max-Plus Network Algebra computing Free Float & Total Float against IMD rainfall shocks.\n"
         "• SATYA-KAVACH: McCrary density testing on 20% CCEA threshold & CPWD Clause 10CC inflation auditing.\n"
         "• ARTHA-NIVARAN: PSU solvency distress scoring and NLP analysis of live CPWD arbitration claims.\n"
         "• KARYA-DAKSHATA: Agency delivery reliability de-biasing proposals against measured historical performance."),

        ("STAGE 4: PRESCRIPTIVE OPTIMIZATION & VERIFICATION",
         "• VITTA-VYUHA: Two-Stage Stochastic Linear Program (LP) with CVaR90 risk and statutory 10% NER floor.\n"
         "• SATELLITE AUDIT: Visible-band ExG / VARI spectral differencing with strict cloud-obstruction withholding.\n"
         "• MERKLE PROVENANCE: RFC 8785 Canonical JSON hashing generating immutable SHA-256 audit trails."),

        ("STAGE 5: APEX EXECUTIVE GOVERNANCE & TRANSPARENCY",
         "• UNIFIED COCKPIT: Single-pane executive console for PMO / Cabinet with 360° project health scorecards.\n"
         "• PRAGATI-SAARTHI: Bilingual (English + CSTT Hindi) tamper-proof executive briefing dossiers.\n"
         "• INTERACTIVE SLIDERS: Real-time capex reallocation (₹10,000 Cr) and climate shock stress-testing.\n"
         "• NAGRIK PORTAL: Public accountability dashboard with state infrastructure heatmaps and project cards.")
    ]

    for title, desc in pipeline_steps:
        add_heading_2(doc, title)
        p_step = doc.add_paragraph()
        p_step.paragraph_format.space_before = Pt(1)
        p_step.paragraph_format.space_after = Pt(2)
        p_step.paragraph_format.line_spacing = 1.15
        r = p_step.add_run(desc)
        r.font.name = "Calibri"
        r.font.size = Pt(9)
        r.font.color.rgb = RGBColor(51, 65, 85)

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # -------------------------------------------------------------------------
    # SECTION 6: SLIDE 1 LAYOUT BLUEPRINT
    # -------------------------------------------------------------------------
    add_heading_1(doc, "6. Slide 1 Presentation Layout Blueprint")
    add_body_paragraph(doc, "Engineered specifically to meet the 75% Graphics / 25% Text ratio required for a winning national hackathon presentation:")

    layout_items = [
        ("Top Status Bar (10% Height):", "Displays Government Emblem, MoSPI DIID attribution, Problem Statement ID: SIH26103, and the Slide Title: 'Slide 1: Problem Understanding & Innovative Solution'."),
        ("Top KPI Banner (15% Height):", "Row of 6 high-contrast KPI cards showcasing the core numbers (2,207 Projects, ₹41.78 L Cr, 93.3% Conformal Coverage, 8.7 ms Solver, 1.65× Evasion Discontinuity, 71.8% Sovereign Geocode)."),
        ("Left Column (32% Width - Strategic Text):", "Houses the 5 Systemic Infrastructure Failure Modes (concise 1-2 line summaries) and the compact Before vs After Evaluation Table. High typographic contrast against dark slate background."),
        ("Center-Right Top (30% Height - Visual Evidence):", "Two forensic charts side-by-side: (1) McCrary Density Discontinuity Histogram highlighting the 20% CCEA evasion cliff, and (2) Kaal-Chakra Survival Probabilistic Fan Chart showing P10–P95 curves vs the optimistic DPR dot."),
        ("Center-Right Bottom (25% Height - Innovation Flow):", "The 5-stage interconnected Architectural Pipeline showing data transformation from Raw Ingestion to In-Memory Clean to Analytics Engines to Prescriptive LP to Executive PRAGATI Briefings."),
        ("Bottom Sovereign Strip (5% Height):", "Displays the Zero-Trust / Zero-Hallucination sovereign security badge, RFC 8785 Merkle compliance, and open-source HiGHS solver accreditation.")
    ]

    for title, desc in layout_items:
        add_body_paragraph(doc, desc, bold_prefix=f"{title} ")

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # -------------------------------------------------------------------------
    # SECTION 7: JURY DEFENSE & COMBAT GUIDE
    # -------------------------------------------------------------------------
    add_heading_1(doc, "7. Winning Jury Q&A Combat Guide (CLAIMS Reconciled)")
    add_body_paragraph(doc, "Rock-solid answers to tough jury questions, preventing overclaiming while highlighting technical excellence:")

    qa_list = [
        ("Q1: 'Why monitor 2,207 projects when the MoSPI flash report says 1,981 ongoing?'",
         "Answer: '1,981 represents projects strictly in 'Ongoing' status during the single-month snapshot of April 2026. However, PAIMANA is a dynamic monthly portal. Our master catalog of 2,207 projects spans the full lifecycle across multi-month tracking: 1,823 active in-flight, 220 pre-construction pipeline, and 164 historically completed benchmarks. Completed projects are mathematically essential to train ML survival models without right-censoring bias.'"),

        ("Q2: 'Did you use an LLM like GPT-4 to predict project delays and costs?'",
         "Answer: 'Never. Public finance and cabinet-level monitoring cannot tolerate numerical hallucinations. In Prakalp Drishti, all timelines, quantiles, and cost predictions are computed deterministically using log-logistic survival analysis, gradient boosting, and two-stage linear programming. LLMs are strictly confined to generating bilingual text summaries backed by RFC 8785 SHA-256 Merkle tree verification.'"),

        ("Q3: 'Why did you formulate capital allocation as an LP rather than a complex MILP?'",
         "Answer: 'An LP is deliberate and mathematically superior here: capital budget tranches are genuinely continuous, and continuous formulations yield valid dual variables (shadow prices: pi_budget). A MILP has no valid duals and could not defend marginal rupee return per constraint before the Cabinet. Solved in 8.7 ms on open-source HiGHS, it allows real-time interactive budget sliders.'"),

        ("Q4: 'Do you claim sub-meter satellite change detection?'",
         "Answer: 'No. The measured ground sample distance of our Esri / Sentinel optical imagery is 2.08–2.35 m/px. Claiming sub-meter resolution from 2-meter pixels is sensor fabrication. We restrict our optical audit to defensible multi-pixel spectral differencing (ExG, VARI) and enforce a strict Verdict Withheld protocol during heavy cloud obstruction rather than penalizing contractors with false alarms.'")
    ]

    for q, a in qa_list:
        add_heading_2(doc, q)
        p_a = doc.add_paragraph()
        p_a.paragraph_format.space_before = Pt(1)
        p_a.paragraph_format.space_after = Pt(4)
        p_a.paragraph_format.line_spacing = 1.15
        r = p_a.add_run(a)
        r.font.name = "Calibri"
        r.font.size = Pt(9.5)
        r.font.color.rgb = RGBColor(15, 23, 42)

    # Save Document
    target_docx = os.path.abspath("PRAKALP_DRISHTI_SLIDE_1_PRESENTATION.docx")
    doc.save(target_docx)
    print(f"[SUCCESS] Generated DOCX: {target_docx}")

    # Mirror to docs_and_presentations
    docs_dir = os.path.abspath("docs_and_presentations")
    if os.path.exists(docs_dir):
        mirror_path = os.path.join(docs_dir, "PRAKALP_DRISHTI_SLIDE_1_PRESENTATION.docx")
        doc.save(mirror_path)
        print(f"[SUCCESS] Mirrored DOCX: {mirror_path}")

    return target_docx


if __name__ == "__main__":
    create_document()
