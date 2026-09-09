import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn
import os

def create_styled_document(output_path):
    doc = docx.Document()
    
    # Page setup - 1 inch margins
    for section in doc.sections:
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin = Inches(1)
        section.right_margin = Inches(1)
        
    # Color Palette
    PRIMARY_COLOR = RGBColor(15, 37, 55)       # Deep Navy #0F2537
    SECONDARY_COLOR = RGBColor(24, 76, 120)    # Slate Blue #184C78
    ACCENT_SKY = RGBColor(2, 132, 199)         # Sky Blue #0284C7
    TEXT_DARK = RGBColor(31, 41, 55)           # Gray 800 #1F2937
    TEXT_MUTED = RGBColor(75, 85, 99)          # Gray 600 #4B5563
    EMERALD_GREEN = RGBColor(5, 150, 105)      # Emerald #059669
    ROSE_RED = RGBColor(220, 38, 38)           # Red #DC2626

    # Configure Normal Style
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Calibri'
    normal_style.font.size = Pt(11)
    normal_style.font.color.rgb = TEXT_DARK
    normal_style.paragraph_format.line_spacing = 1.15
    normal_style.paragraph_format.space_after = Pt(6)

    # Helper function for cell background color
    def set_cell_background(cell, fill_hex):
        tcPr = cell._tc.get_or_add_tcPr()
        shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
        tcPr.append(shd)

    # Helper function for cell borders
    def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
        tcPr = cell._tc.get_or_add_tcPr()
        tcMar = parse_xml(f'''
            <w:tcMar {nsdecls("w")}>
                <w:top w:w="{top}" w:type="dxa"/>
                <w:bottom w:w="{bottom}" w:type="dxa"/>
                <w:left w:w="{left}" w:type="dxa"/>
                <w:right w:w="{right}" w:type="dxa"/>
            </w:tcMar>
        ''')
        tcPr.append(tcMar)

    def add_callout(text, title="NOTE / CRITICAL INSIGHT", border_color="0284C7", bg_color="F0F9FF"):
        tbl = doc.add_table(rows=1, cols=1)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        cell = tbl.cell(0, 0)
        set_cell_background(cell, bg_color)
        set_cell_margins(cell, top=140, bottom=140, left=180, right=180)
        
        tcPr = cell._tc.get_or_add_tcPr()
        borders = parse_xml(f'''
            <w:tcBorders {nsdecls("w")}>
                <w:top w:val="none"/>
                <w:left w:val="single" w:sz="24" w:space="0" w:color="{border_color}"/>
                <w:bottom w:val="none"/>
                <w:right w:val="none"/>
            </w:tcBorders>
        ''')
        tcPr.append(borders)
        
        p = cell.paragraphs[0]
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(3)
        run_title = p.add_run(f"📌 {title}\n")
        run_title.bold = True
        run_title.font.size = Pt(10.5)
        run_title.font.color.rgb = SECONDARY_COLOR
        
        run_text = p.add_run(text)
        run_text.font.size = Pt(10)
        run_text.font.color.rgb = TEXT_DARK
        
        p_space = doc.add_paragraph()
        p_space.paragraph_format.space_before = Pt(0)
        p_space.paragraph_format.space_after = Pt(4)

    # Document Header / Title
    p_title = doc.add_paragraph()
    p_title.paragraph_format.space_before = Pt(0)
    p_title.paragraph_format.space_after = Pt(4)
    run_title = p_title.add_run("PRAKALP-DRISHTI")
    run_title.font.name = 'Calibri'
    run_title.font.size = Pt(26)
    run_title.font.bold = True
    run_title.font.color.rgb = PRIMARY_COLOR

    p_sub = doc.add_paragraph()
    p_sub.paragraph_format.space_before = Pt(0)
    p_sub.paragraph_format.space_after = Pt(6)
    run_sub = p_sub.add_run("Complete Reference & Defense Guide: SETU-VARSHA & KARYA-DAKSHATA")
    run_sub.font.size = Pt(16)
    run_sub.font.bold = True
    run_sub.font.color.rgb = ACCENT_SKY

    p_meta = doc.add_paragraph()
    p_meta.paragraph_format.space_before = Pt(0)
    p_meta.paragraph_format.space_after = Pt(14)
    run_meta = p_meta.add_run("Ministry of Statistics and Programme Implementation (MoSPI) | Smart India Hackathon 2026 (SIH26103)\nLanguage: Simple English | Target Audience: Module Presenters, Developers & Defense Team")
    run_meta.font.size = Pt(9.5)
    run_meta.font.color.rgb = TEXT_MUTED

    # Divider line
    p_line = doc.add_paragraph()
    p_line.paragraph_format.space_after = Pt(12)
    p_line_border = parse_xml(f'<w:pBdr {nsdecls("w")}><w:bottom w:val="single" w:sz="12" w:space="1" w:color="0284C7"/></w:pBdr>')
    p_line._p.get_or_add_pPr().append(p_line_border)

    # 1. Executive Summary
    h1 = doc.add_heading("1. Executive Summary: Why Do These Two Modules Exist?", level=1)
    h1.style.font.color.rgb = PRIMARY_COLOR
    h1.style.font.size = Pt(16)
    
    p = doc.add_paragraph()
    p.add_run(
        "In India, the Central Government monitors 2,207 mega-infrastructure projects worth over ₹41.8 Lakh Crore. "
        "Historically, projects face severe cost overruns (over ₹4.8 Lakh Crore) and multi-year delays. "
        "Two massive systemic blind spots cause these failures:\n"
    )

    p_b1 = doc.add_paragraph(style='List Bullet')
    r1 = p_b1.add_run("Blind Spot 1: The '12-Month DPR Fallacy' and Siloed Cascades (Solved by SETU-VARSHA): ")
    r1.bold = True
    p_b1.add_run(
        "Project planners assume civil construction proceeds evenly across all 12 calendar months. "
        "In reality, heavy monsoons cause landslides and soil saturation, shutting down work for 3 to 5 months in high-rainfall states. "
        "Furthermore, ministries work in silos: when an upstream coal mine or rail link is delayed by rain, "
        "a downstream ₹8,000 Cr power plant sits idle with zero coal."
    )

    p_b2 = doc.add_paragraph(style='List Bullet')
    r2 = p_b2.add_run("Blind Spot 2: Optimism Bias & DPR Fantasy Targets (Solved by KARYA-DAKSHATA): ")
    r2.bold = True
    p_b2.add_run(
        "Executing agencies (like NHAI, RVNL, NTPC, etc.) routinely pitch best-case fantasy estimates "
        "('Give us ₹500 Cr, we will finish in 2 years') to secure Cabinet sanctions. "
        "No mechanism existed to re-price those proposals against the agency's actual 20-year empirical track record."
    )

    add_callout(
        "Setu-Varsha models climate shocks and multi-sector domino delay contagion. "
        "Karya-Dakshata de-biases optimistic proposals using empirical agency execution multipliers. "
        "Together, they protect public capital before a single rupee is misallocated.",
        title="CORE MISSION STATEMENT"
    )

    # 2. Module 1: SETU-VARSHA
    h2 = doc.add_heading("2. Deep-Dive: SETU-VARSHA (Climate Shock & Contagion War Room)", level=1)
    h2.style.font.color.rgb = PRIMARY_COLOR
    h2.style.font.size = Pt(16)

    p = doc.add_paragraph()
    p.add_run(
        "SETU-VARSHA is the platform's Climate Contagion War Room. It integrates two powerful sub-engines:\n"
        "1. VARSHA-SPEED: Quantifies how rainfall anomalies contract the effective working window across Indian states.\n"
        "2. SETU-GRAPH: Models a Directed Acyclic Graph (DAG) of cross-project dependencies, calculating how slippage "
        "propagates downstream to lock public capital."
    )

    doc.add_heading("2.1 Datasets Utilized in SETU-VARSHA", level=2)
    
    # Table of datasets
    tbl = doc.add_table(rows=1, cols=3)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    hdr_cells = tbl.rows[0].cells
    hdr_cells[0].text = "Dataset Name"
    hdr_cells[1].text = "Source & Granularity"
    hdr_cells[2].text = "Role in SETU-VARSHA"
    for cell in hdr_cells:
        set_cell_background(cell, "0F2537")
        for p in cell.paragraphs:
            p.runs[0].font.color.rgb = RGBColor(255, 255, 255)
            p.runs[0].font.bold = True
            p.runs[0].font.size = Pt(10)
        set_cell_margins(cell, top=100, bottom=100, left=120, right=120)

    datasets_data = [
        ("IMD Rainfall Time-Series", "India Meteorological Department (2005–2025)", "20-year gridded monsoon departures across 30 States (630 state-years)."),
        ("State Terrain Profiles", "Geo-climatic Calibration", "Base lost working days (20–92 days) and rainfall elasticity multipliers per state."),
        ("Sector Weather Weights", "Engineering Calibrations", "Differential weather sensitivity (Roads 1.45x, Railways 1.25x, Ports 1.20x, Power 0.95x)."),
        ("PAIMANA Project Catalog", "MoSPI Official Flash Reports", "2,207 mega-projects with Physical Progress %, Revised Cost, and State."),
        ("Dependency Network Graph", "Domain & Spatial Graph", "Upstream-downstream links (Coal to Power, Ports to Rail, Industrial corridors)."),
        ("Dual-Epoch Satellite Tiles", "Esri ArcGIS World Imagery", "2.08–2.35 m/px optical verification tiles for ground-truth physical audits.")
    ]

    for dname, dsrc, drole in datasets_data:
        row_cells = tbl.add_row().cells
        row_cells[0].text = dname
        row_cells[1].text = dsrc
        row_cells[2].text = drole
        for i, cell in enumerate(row_cells):
            set_cell_background(cell, "F9FAFB" if len(tbl.rows) % 2 == 0 else "FFFFFF")
            set_cell_margins(cell, top=80, bottom=80, left=100, right=100)
            for p in cell.paragraphs:
                p.runs[0].font.size = Pt(9.5)
                if i == 0:
                    p.runs[0].font.bold = True

    p_sp = doc.add_paragraph()
    p_sp.paragraph_format.space_before = Pt(4)

    doc.add_heading("2.2 The Mathematical Model & Equations", level=2)

    p_eq1 = doc.add_paragraph()
    r = p_eq1.add_run("Equation 1: Working-Window Compression (VARSHA-SPEED)\n")
    r.bold = True
    r.font.color.rgb = SECONDARY_COLOR
    p_eq1.add_run(
        "For any state s undergoing an IMD rainfall anomaly ΔR% (from -50% to +50%), the lost working days are:\n"
        "    Adjusted Lost Days(s) = Base Lost Days(s) × [ 1 + (ΔR% / 100) × Elasticity(s) ]\n"
        "    Adjusted Lost Months(s) = Adjusted Lost Days(s) / 30.4375\n"
        "    Effective Working Months(s) = max(3.5, 12.0 - Adjusted Lost Months(s))\n"
        "    Schedule Stretch Multiplier(s) = 12.0 / Effective Working Months(s)\n"
        "Example: In Meghalaya (Base Lost Days = 92, Elasticity = 1.70), an excess monsoon of +20% pushes lost days to ~123 days (~4 months). "
        "The effective working window drops from 9 months to 8 months, producing a 1.50x schedule stretch multiplier."
    )

    p_eq2 = doc.add_paragraph()
    r = p_eq2.add_run("Equation 2: Remaining Exposure Scaling\n")
    r.bold = True
    r.font.color.rgb = SECONDARY_COLOR
    p_eq2.add_run(
        "Crucially, weather delay is not applied blindly. A project at 90% physical progress has almost finished civil earthworks, "
        "while a project at 10% progress is severely exposed to washouts:\n"
        "    Remaining Work Months = max(0, (100 - Physical Progress %) / 100) × 24 months\n"
        "    Direct Weather Delay Shock = Remaining Work Months × (Multiplier_simulated - Multiplier_baseline)"
    )

    p_eq3 = doc.add_paragraph()
    r = p_eq3.add_run("Equation 3: Critical Path Float Absorption (Max-Plus Algebra)\n")
    r.bold = True
    r.font.color.rgb = SECONDARY_COLOR
    p_eq3.add_run(
        "Within the Directed Acyclic Graph (DAG), each node has Early Start (ES), Early Finish (EF), Late Start (LS), and Late Finish (LF). "
        "Critically, finish dates are computed PER CONNECTED COMPONENT to prevent unrealistic global float inflation:\n"
        "    Total Float (TF) = LS - ES\n"
        "    Free Float (FF) = min_{succ}(ES_succ - LeadTime) - EF\n"
        "When a weather delay shock hits a node:\n"
        "    Absorbed Delay = min(Weather Shock, Free Float)\n"
        "    Propagated Delay (Excess) = max(0, Weather Shock - Free Float)\n"
        "Only the excess delay spills over to successor projects! Downstream propagation is attenuated by 15% per hop (0.85 multiplier) "
        "as downstream contractors partially buffer the slippage."
    )

    p_eq4 = doc.add_paragraph()
    r = p_eq4.add_run("Equation 4: Delay-Weighted Locked Capital\n")
    r.bold = True
    r.font.color.rgb = SECONDARY_COLOR
    p_eq4.add_run(
        "Instead of treating locked capital as an 'all-or-nothing' switch (which would saturate the UI), locked capex is smoothly delay-weighted:\n"
        "    Excess Delay = max(0, Propagated Delay - Total Float)\n"
        "    Locked Capital (₹ Cr) = Project Revised Cost × min(Excess Delay / 48 months, 1.0)\n"
        "Note on Graph Honesty: 926 out of 2,207 projects have zero dependency edges (standalone rural roads, hospital wings). "
        "Setu-Varsha tallies them separately under 'Direct Exposure' rather than falsely labelling them as 'Contagion'."
    )

    p_eq5 = doc.add_paragraph()
    r = p_eq5.add_run("Equation 5: Permutation Monte Carlo Shapley Criticality (Φ_j)\n")
    r.bold = True
    r.font.color.rgb = SECONDARY_COLOR
    p_eq5.add_run(
        "To identify the single most critical 'Linchpin' project across the entire national network, the engine plays a game-theoretic reachability game:\n"
        "    Coalition Value v(S) = Sum of capex across the reachable descendants of coalition S.\n"
        "Over M = 30 uniformly random permutations, the marginal capital unblocked by project j is accumulated: "
        "Φ_j = v(S ∪ {j}) - v(S). The highest scoring project is the national linchpin."
    )

    doc.add_heading("2.3 Live UI Walkthrough: What Appears on Screen", level=2)
    p_ui = doc.add_paragraph()
    p_ui.add_run(
        "• Interactive Rainfall Slider: Ranging from Deficient (-50%) to Extreme Monsoon (+50%).\n"
        "• Metric Cards: Total Nodes Directly Hit, Cascaded Nodes, Nodes Absorbed by Float, and Total Downstream Locked Capex (₹ Cr).\n"
        "• Worst-Hit Projects Table: Lists projects sorted by capital at risk, showing climate delay, float status, and sector.\n"
        "• Ground-Truth Satellite Viewer: Clicking any project immediately loads dual-epoch optical satellite imagery (Esri Wayback) "
        "allowing the official to visually verify actual earthworks and paving.\n"
        "• IMD State Profiles Tab: Displays 20-year rainfall departure distributions and terrain profiles across all Indian states."
    )

    # 3. Module 2: KARYA-DAKSHATA
    h3 = doc.add_heading("3. Deep-Dive: KARYA-DAKSHATA (Agency Execution Simulator)", level=1)
    h3.style.font.color.rgb = PRIMARY_COLOR
    h3.style.font.size = Pt(16)

    p = doc.add_paragraph()
    p.add_run(
        "KARYA-DAKSHATA is an AI De-Biasing & Execution Reliability Simulator. "
        "It acts as a pre-sanction reality check for the Cabinet and Ministry of Finance. "
        "Whenever a new project proposal (DPR) is submitted, Karya-Dakshata re-prices the proposed cost and timeline "
        "against that specific executing agency's measured historical delivery record."
    )

    doc.add_heading("3.1 Data Provenance & Agency Aggregations", level=2)
    p = doc.add_paragraph()
    p.add_run(
        "Every metric in Karya-Dakshata is computed from the official MoSPI PAIMANA database of 2,207 projects. "
        "Projects are grouped by executing agency (COMPANYNAME). To ensure statistical validity, agencies with fewer than "
        "2 executed projects are excluded, because a single data point is an incident, not a track record.\n\n"
        "For each agency, the engine extracts:\n"
        "• Total Projects Executed (Sample Size N)\n"
        "• Historical Cost Variance %: Mean of [ (Revised Cost - Original Cost) / Original Cost ] × 100\n"
        "• Historical Schedule Slippage: Mean of (Revised Completion Date - Original Sanction Date) in days/months\n"
        "• Delay Rate %: Percentage of that agency's projects that suffered slippage"
    )

    doc.add_heading("3.2 The Exact Mathematical Formulas", level=2)

    p_k1 = doc.add_paragraph()
    r = p_k1.add_run("Formula 1: True Expected Cost (De-Biased Budget)\n")
    r.bold = True
    r.font.color.rgb = SECONDARY_COLOR
    p_k1.add_run(
        "    True Expected Cost (₹ Cr) = Proposed Base Cost × [ 1 + (Agency Avg Historical Cost Overrun % / 100) ]\n"
        "Example: An agency asks for ₹500 Crore. Its historical average cost overrun is +34.2%.\n"
        "    True Expected Cost = ₹500 Cr × (1 + 0.342) = ₹671.00 Crore.\n"
        "The Ministry immediately identifies an impending ₹171 Crore funding shortfall before sanctioning."
    )

    p_k2 = doc.add_paragraph()
    r = p_k2.add_run("Formula 2: True Expected Timeline (De-Biased Schedule)\n")
    r.bold = True
    r.font.color.rgb = SECONDARY_COLOR
    p_k2.add_run(
        "    True Expected Timeline (Days) = Proposed Base Days + (Agency Avg Delay Months × 30.4375)\n"
        "Example: An agency claims it will finish in 730 Days (2 Years). Its historical average delay across past projects is 28.5 Months (~867 Days).\n"
        "    True Expected Timeline = 730 + 867 = 1,597 Days (~4.4 Years).\n"
        "The realistic commissioning date is over double what the DPR claimed."
    )

    p_k3 = doc.add_paragraph()
    r = p_k3.add_run("Formula 3: Agency Execution Reliability Score (0 to 100)\n")
    r.bold = True
    r.font.color.rgb = SECONDARY_COLOR
    p_k3.add_run(
        "The Reliability Score measures how trustworthy an agency's proposals are. It starts at 100 and blends delay frequency with cost overrun severity:\n"
        "    Overrun Penalty = min(Avg Cost Overrun %, 200) / 2.0     [Ranges from 0 to 100]\n"
        "    Reliability Score = max(0.0, 100.0 - (0.6 × Delay Rate % + 0.4 × Overrun Penalty))\n"
        "Performance Tiers:\n"
        "    • Score ≥ 80: High Reliability (Green) — Clean track record; expedited Cabinet approval.\n"
        "    • Score 50–79: Moderate Risk (Blue) — Standard delivery; requires milestone-based escrow tranches.\n"
        "    • Score < 50: High Overrun Risk (Red) — Chronic delays; requires strict penalty clauses or alternative procurement."
    )

    p_k4 = doc.add_paragraph()
    r = p_k4.add_run("Formula 4: Dead Capital / Zombie Project Detector\n")
    r.bold = True
    r.font.color.rgb = SECONDARY_COLOR
    p_k4.add_run(
        "Karya-Dakshata also runs an automated forensic screen across the 2,207 projects to detect dead capital:\n"
        "    Zombie Project Condition: Physical Progress < 20%  AND  Expenditure Already Incurred > ₹100 Crore\n"
        "This flags projects where hundreds of crores of public money have been spent with virtually zero ground construction."
    )

    doc.add_heading("3.3 Live UI Walkthrough: What Appears on Screen", level=2)
    p_ui2 = doc.add_paragraph()
    p_ui2.add_run(
        "• Agency Selector Dropdown: Populated with verified agencies (NHAI, RVNL, NTPC, BPCL, etc.).\n"
        "• Interactive Parameter Sliders / Inputs: Base Cost (₹ Cr) and Base Timeline (Days).\n"
        "• Side-by-Side Visual Comparison Charts:\n"
        "    - Proposed Cost vs True Expected Cost (Bar chart).\n"
        "    - Proposed Timeline vs True Expected Timeline (Bar chart).\n"
        "• Agency Reliability Score Card: Live dial gauge showing 0–100 score, tier badge, and project sample count.\n"
        "• Official Cabinet Advisory Note: Text briefing explaining the mathematical derivation in plain English."
    )

    # 4. Side by Side Comparison Table
    h4 = doc.add_heading("4. Quick Comparison: SETU-VARSHA vs KARYA-DAKSHATA", level=1)
    h4.style.font.color.rgb = PRIMARY_COLOR
    h4.style.font.size = Pt(16)

    tbl2 = doc.add_table(rows=1, cols=3)
    tbl2.alignment = WD_TABLE_ALIGNMENT.CENTER
    hdr2 = tbl2.rows[0].cells
    hdr2[0].text = "Feature / Dimension"
    hdr2[1].text = "SETU-VARSHA"
    hdr2[2].text = "KARYA-DAKSHATA"
    for cell in hdr2:
        set_cell_background(cell, "0F2537")
        for p in cell.paragraphs:
            p.runs[0].font.color.rgb = RGBColor(255, 255, 255)
            p.runs[0].font.bold = True
            p.runs[0].font.size = Pt(10)
        set_cell_margins(cell, top=100, bottom=100, left=120, right=120)

    comp_rows = [
        ("Primary Purpose", "Monsoon climate shocks & multi-project supply chain cascades", "De-biasing proposed costs and schedules using agency past performance"),
        ("Problem Solved", "12-Month DPR Fallacy & cross-ministry domino delay gridlocks", "Optimism bias & contractor fantasy estimates at DPR stage"),
        ("Key Mathematical Concept", "Max-Plus CPM Float Absorption & Shapley Game Theory", "Empirical Multipliers & Multi-factor Reliability Scoring"),
        ("Main Data Source", "IMD 20-Yr Rainfall (2005-2025) & Domain Dependency Graph", "PAIMANA Statutory Records aggregated by executing PSU/Agency"),
        ("Interactive Control", "Rainfall Anomaly Slider (-50% to +50%)", "Agency Dropdown + Proposed Cost (₹ Cr) & Time (Days) Inputs"),
        ("Primary Output", "Downstream Locked Capex (₹ Cr) & Breached Buffer Nodes", "True Expected Cost (₹ Cr), True Expected Time, Reliability Score"),
        ("Physical Ground Truth", "Integrated Dual-Epoch Satellite Optical Tiles (Esri)", "Dead Capital Tracker (Physical Progress < 20% & Spend > ₹100 Cr)")
    ]

    for fdim, fsv, fkd in comp_rows:
        row_cells = tbl2.add_row().cells
        row_cells[0].text = fdim
        row_cells[1].text = fsv
        row_cells[2].text = fkd
        for i, cell in enumerate(row_cells):
            set_cell_background(cell, "F9FAFB" if len(tbl2.rows) % 2 == 0 else "FFFFFF")
            set_cell_margins(cell, top=80, bottom=80, left=100, right=100)
            for p in cell.paragraphs:
                p.runs[0].font.size = Pt(9.5)
                if i == 0:
                    p.runs[0].font.bold = True

    p_sp2 = doc.add_paragraph()
    p_sp2.paragraph_format.space_before = Pt(6)

    # 5. Winning Defense Guide
    h5 = doc.add_heading("5. Jury & Evaluator Defense: Top 6 Questions & Winning Answers", level=1)
    h5.style.font.color.rgb = PRIMARY_COLOR
    h5.style.font.size = Pt(16)

    qa_list = [
        ("Q1: Is the climate simulation in SETU-VARSHA a black-box Machine Learning forecast?",
         "Answer: Absolutely not. It is an empirical scenario projection grounded in physical reality. "
         "It couples 20 years of official IMD state rainfall departure data with engineering terrain working-windows. "
         "The cascade is calculated deterministically through a Directed Acyclic Graph (DAG) using standard Critical Path Method (CPM) "
         "Max-Plus float absorption algebra. There are zero LLM hallucinations."),
        
        ("Q2: In SETU-VARSHA, why don't you classify every delayed project as 'Contagion'?",
         "Answer: Because 926 of the 2,207 projects in India have no upstream or downstream dependency links (e.g. a standalone district road). "
         "A delay there is painful for that project, but it is NOT contagion. Lumping them into a 'cascade' would falsely inflate the figures. "
         "Our platform is honest: we strictly report isolated direct delays separately from true downstream locked capex."),
        
        ("Q3: Why is KARYA-DAKSHATA necessary if MoSPI already tracks delays?",
         "Answer: MoSPI’s existing PAIMANA system is purely descriptive—it only records cost and time overruns AFTER they have already occurred. "
         "Karya-Dakshata is proactive and prescriptive: it intervenes BEFORE sanctions are granted. "
         "When an agency submits a ₹500 Cr proposal, Karya-Dakshata immediately shows the Cabinet that this agency historically overshoots by 34%, "
         "so the true budgetary liability is ₹671 Cr."),
         
        ("Q4: Can't a good contractor be penalized unfairly if their agency has bad historical scores?",
         "Answer: The agency score reflects institutional capability, governance, and contractual dispute history. "
         "If an agency improves, newly completed projects immediately update their moving average. "
         "Furthermore, the score does not reject projects—it prescribes safeguards, such as requiring milestone escrow or splitting packages."),
         
        ("Q5: What happens in SETU-VARSHA if rainfall is deficient (-20% or -40%)?",
         "Answer: The slider models deficit monsoons as well. Deficient monsoons expand the dry civil working window for foundation works, "
         "reducing weather delays. However, the system also notes that extreme deficits create secondary water-supply constraints for concrete batching."),
         
        ("Q6: How are these two modules integrated into the overall Prakalp Drishti platform?",
         "Answer: They feed directly into the Unified Decision Cockpit and Pragati-Saarthi. "
         "Setu-Varsha flags which projects have locked capex due to external weather shocks, while Karya-Dakshata provides the de-biased true cost "
         "used by Vitta-Vyuha to optimize national capital allocation.")
    ]

    for q, a in qa_list:
        p_q = doc.add_paragraph()
        p_q.paragraph_format.space_before = Pt(4)
        p_q.paragraph_format.space_after = Pt(2)
        r_q = p_q.add_run(f"❓ {q}")
        r_q.bold = True
        r_q.font.size = Pt(11)
        r_q.font.color.rgb = PRIMARY_COLOR

        p_a = doc.add_paragraph()
        p_a.paragraph_format.space_before = Pt(0)
        p_a.paragraph_format.space_after = Pt(8)
        r_a = p_a.add_run(f"💬 {a}")
        r_a.font.size = Pt(10)
        r_a.font.color.rgb = TEXT_DARK

    # Summary Checklist
    add_callout(
        "1. SETU-VARSHA: IMD 20-Year Anomaly · Working-Window Compression · Float Absorption · DAG Dependency Network · Downstream Locked Capex · Dual-Epoch Satellite Imagery.\n"
        "2. KARYA-DAKSHATA: Optimism Bias · Pre-Sanction De-Biasing · Historical Cost/Schedule Variance · Agency Reliability Score (0-100) · Dead Capital Screen (>₹100 Cr spend, <20% progress).",
        title="FINAL MEMORIZATION KEYWORDS FOR YOUR DEFENSE"
    )

    doc.save(output_path)
    print(f"[SUCCESS] Document successfully generated at: {output_path}")

if __name__ == "__main__":
    out_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "SETU_VARSHA_AND_KARYA_DAKSHATA_EXPLAINED.docx")
    create_styled_document(out_file)
