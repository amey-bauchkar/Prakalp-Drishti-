# 🏛️ PRAKALP-DRISHTI: MASTER TEAM CHEATSHEET & DEFENSE BIBLE (UPDATED V3.2)
### *Comprehensive Reference Guide, Exact Live UI Architecture, Data Provenance & Winning Jury Defense*
**Ministry of Statistics and Programme Implementation (MoSPI) | Smart India Hackathon 2026 (Problem Statement ID: SIH26103 / PAIMANA)**

---

## 📑 TABLE OF CONTENTS
1. [⚡ 30-Second Elevator Pitch & Core Mission](#1-30-second-elevator-pitch--core-mission)
2. [🎯 Problem Statement Deconstruction (SIH26103)](#2-problem-statement-deconstruction-sih26103)
3. [📊 Data Provenance: Detailed Breakdown of Every Dataset & WHY It Was Chosen](#3-data-provenance-detailed-breakdown-of-every-dataset--why-it-was-chosen)
4. [🔍 1,981 vs 2,207 Projects: The Exact Mathematical Explanation](#4-1981-vs-2207-projects-the-exact-mathematical-explanation)
5. [🚨 The 5 Core Systemic Infrastructure Failure Modes We Solve](#5-the-5-core-systemic-infrastructure-failure-modes-we-solve)
6. [🧭 Complete Live Website Navigation & Portal Architecture](#6-complete-live-website-navigation--portal-architecture)
7. [🛠️ Deep-Dive into All 10 Analytical Engines inside Decision Hub](#7-deep-dive-into-all-10-analytical-engines-inside-decision-hub)
8. [🏛️ Deep-Dive into All 4 Dedicated Pillar Portals](#8-deep-dive-into-all-4-dedicated-pillar-portals)
9. [🥊 Judges & Jury Q&A Combat Guide (Winning Counter-Arguments)](#9-judges--jury-qa-combat-guide-winning-counter-arguments)
10. [🔢 Key Numbers, Formulas & Stats Every Teammate Must Memorize](#10-key-numbers-formulas--stats-every-teammate-must-memorize)

---

## 1. ⚡ 30-Second Elevator Pitch & Core Mission

> **"Prakalp Drishti is India’s first autonomous, zero-trust infrastructure intelligence platform. It transforms MoSPI’s passive PAIMANA monitoring portal into an active predictive, prescriptive, and satellite-verified decision engine. We monitor 2,207 Central Sector Mega-Projects worth ₹41.8 Lakh Crore, replacing contractor self-reporting with orbital ground truth, probabilistic completion timelines, cross-project supply chain dependency graphs, agency execution reliability simulation, and mathematical capital allocation optimization with zero hallucinations."**

* **Target Stakeholders**: Prime Minister’s Office (PMO / PRAGATI), Cabinet Secretariat, MoSPI (IPMD / DIID), Ministry of Finance (Department of Expenditure), and Central Executing Line Ministries.
* **Three Core Tenets**:
  1. **Zero Trust**: Never trust vendor self-reported forms without orbital satellite corroboration.
  2. **Zero Hallucination**: No LLM numbers; every figure is mathematically computed and secured with Merkle tree cryptographic proof.
  3. **Prescriptive Action**: Don’t just show what is delayed—prescribe exactly where to allocate the next ₹10,000 Crore to maximize commissioned economic capacity.

---

## 2. 🎯 Problem Statement Deconstruction (SIH26103)

* **Problem Statement Title**: Use case on web-based integrated project-monitoring platform.
* **Nodal Ministry & Department**: Ministry of Statistics & Programme Implementation (MoSPI) / Data Informatics & Innovation Division (DIID).
* **Historical Evolution**:
  * Since 2006, MoSPI monitored projects $\ge ₹150\text{ Crore}$ through the **Online Computerised Monitoring System (OCMS)**.
  * Modernized into **PAIMANA** (*Project Assessment, Infrastructure Monitoring and Analytics for Nation-building*).
* **The Core Gap**:
  * Existing PAIMANA portal operates on **Descriptive Reporting** (What happened in the past).
  * MoSPI urgently requires **Predictive Analytics** (forecasting cost/time overruns before they occur) and **Prescriptive Decision-Support** (evidence-based capital allocation, risk scoring, and early warning).

---

## 3. 📊 Data Provenance: Detailed Breakdown of Every Dataset & WHY It Was Chosen

> ⚠️ **CRITICAL JURY DEFENSE**: We did **NOT** generate any fake or synthetic project data. All data originates from verified, open, official government sources and public databases.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                           DATA LAKE PROVENANCE MATRIX                                           │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 1. MoSPI PAIMANA Portal & APIs     ──► 25 Statutory CUF Fields (April 2026 Baseline + Multi-Month Cycles)       │
│ 2. Sentinel-2 / Landsat / Esri     ──► Dual-Epoch Optical + SAR Radar Imagery (Zero-Trust Physical Audit)       │
│ 3. IMD Meteorological Gridded Data ──► 20-Year State Rainfall Departures (Working-Window Contraction)           │
│ 4. DPIIT / MoSPI WPI Indices       ──► Commodity Price Escalation: Steel, Cement, Bitumen & Fuel (Clause 10CC)  │
│ 5. NSE / BSE Public Disclosures    ──► Executing PSU Debt/Equity, Working Capital & Stock Drawdowns (Leading)   │
│ 6. GeoNames India Gazetteer        ──► 68MB Offline Indian Geospatial Engine (100% Air-Gapped Sovereign Geocoding)│
│ 7. PARIVESH & CPWD GCC Manuals     ──► 5-Stage Clearances Pipeline & Contractual Arbitration Exposure           │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 🏛️ Dataset 1: MoSPI PAIMANA Monthly Flash Reports & REST APIs
* **Exact Online Source**: Official Government Portal (`https://paimana-proj.mospi.gov.in/ReportPage`) and live endpoints (`GetSectorList`, `GetMinistryList`, `GetTileData`).
* **What Was Extracted**: Full April 2026 baseline report + multi-month series (Jan–June 2026), capturing 25 statutory Common Upload Form (CUF) parameters: `ProjectId`, `ProjectName`, `SectorName`, `StateName`, `LineMinistry`, `AgencyName`, `OriginalCost`, `RevisedCost`, `Expenditure`, `SanctionDate`, `StartDate`, `OriginalEndDate`, `RevisedDate`, `DELAYED_TIME`, `PhysicalProgress`, `OnboardingDelay`, `RevisedCostReason`, `Remarks`.
* **WHY WE CHOSE THIS DATASET**:
  1. **Statutory Baseline**: This is the official single-source-of-truth for all Central Sector Projects ($\ge ₹150\text{ Cr}$) mandated by the Union Cabinet.
  2. **Longitudinal Cycle Tracking**: Taking multi-month reports (Jan–June 2026) rather than a single static PDF allows our AI to track monthly progress velocity, revision history, and milestone transitions.

---

### 🛰️ Dataset 2: Satellite Remote Sensing (ESA Sentinel-2, Sentinel-1 SAR & Esri High-Res Tiles)
* **Exact Online Source**: European Space Agency (ESA) Copernicus Hub (Sentinel-2 10m multispectral, Sentinel-1 C-band Synthetic Aperture Radar) & Esri Wayback World Imagery.
* **What Was Extracted**: Sub-meter to 10m dual-epoch satellite image pairs for georeferenced project footprints across India.
* **WHY WE CHOSE THIS DATASET**:
  1. **Eliminating Contractor Moral Hazard & Ghost Spending**: Contractors self-report physical progress on web forms to unlock milestone funds. Satellites provide an **independent, tamper-proof ground truth**.
  2. **Monsoon Cloud Penetration**: Optical satellites fail during heavy cloud cover; incorporating Sentinel-1 SAR radar ensures continuous structural monitoring through clouds.
  3. **Automated Verification**: SSIM (Structural Similarity Index) and NDBI (Normalized Difference Built-up Index) differencing detect whether physical paving, earthworks, or foundations actually exist.

---

### 🌦️ Dataset 3: India Meteorological Department (IMD) Climate & Rainfall Series
* **Exact Online Source**: National Data Centre, India Meteorological Department (`imd.gov.in`).
* **What Was Extracted**: 20-year historical gridded precipitation data, monsoon onset/withdrawal dates, and monthly rainfall departure percentages across all 36 States/UTs.
* **WHY WE CHOSE THIS DATASET**:
  1. **Debunking the "12-Month DPR Fallacy"**: Standard Detailed Project Reports (DPRs) assume construction happens uniformly over 12 months. In reality, monsoons in Assam, Meghalaya, Western Ghats, and coastal belts cause severe flooding and soil saturation, contracting the working season from 9 months to 4–5 months.
  2. **Dynamic Climate Stress Simulation**: Powers **VARSHA-SPEED** to dynamically stretch project completion timelines based on real-time monsoon anomalies ($+15\%$ departure translates to 2–8 months of empirical civil delay).

---

### 📈 Dataset 4: DPIIT / MoSPI Wholesale Price Index (WPI) Commodity Series
* **Exact Online Source**: Office of the Economic Adviser, Department for Promotion of Industry and Internal Trade (`eaindustry.nic.in`).
* **What Was Extracted**: Monthly WPI series for key infrastructure raw materials: Structural Steel, Rebar, Portland Cement, Bitumen, High-Speed Diesel, and Industrial Explosives.
* **WHY WE CHOSE THIS DATASET**:
  1. **Forensic Cost Escalation Audit**: 60%–70% of heavy civil infrastructure cost is driven by raw materials. When contractors demand 20%+ price revisions citing "inflation", **SATYA-KAVACH** runs automated CPWD Clause 10CC formula checks against official WPI indices to prove whether cost increases represent genuine raw material inflation or unearned margin gouging.

---

### 🏢 Dataset 5: Public Sector Undertaking (PSU) Corporate Financials & Stock Data (ARTHA-NETRA)
* **Exact Online Source**: Public quarterly disclosures filed with National Stock Exchange (NSE) & Bombay Stock Exchange (BSE) for listed PSUs (RVNL, IRCON, NTPC, NHPC, SJVN, Coal India, NBCC, BHEL).
* **What Was Extracted**: Debt-to-Equity (D/E) ratios, Altman Z-Score solvency indicators, Interest Coverage Ratios, working capital trends, and historical equity drawdowns.
* **WHY WE CHOSE THIS DATASET**:
  1. **Directly Answering SIH Dimension (c)**: MoSPI asked whether adding non-CUF variables enhances prediction. CUF records project attributes but completely misses contractor liquidity.
  2. **A 6-to-9 Month Leading Indicator**: If an executing PSU carries massive debt ($D/E > 200\%$), they experience severe working capital shortages, fail to pay sub-contractors, and stall physical work. Market drawdowns and leverage stress precede formal Cabinet cost revision requests by 6–9 months.

---

### 🗺️ Dataset 6: Offline GeoNames India Gazetteer (`geonames_IN.txt` - 68MB Engine)
* **Exact Online Source**: GeoNames National Database (`geonames.org`).
* **What Was Extracted**: 400,000+ verified Indian administrative locations, revenue villages, districts, talukas, and railway corridors.
* **WHY WE CHOSE THIS DATASET**:
  1. **Sovereign Security & Air-Gapped Deployment**: In sensitive defense and strategic corridors (missile test facilities, border roads, nuclear stations), querying public commercial cloud APIs (like Google Maps) leaks sensitive coordinates outside sovereign territory.
  2. **100% Offline Capability**: Matches 71.8% of projects locally without any internet connection, meeting sovereign NIC MeghRaj deployment standards.

---

### ⚖️ Dataset 7: PARIVESH Portal Rules & CPWD General Conditions of Contract (GCC)
* **Exact Online Source**: MoEFCC PARIVESH portal and Ministry of Housing & Urban Affairs CPWD Manual.
* **What Was Extracted**: Statutory clearance stage definitions (Forest Stage-I/II, Wildlife, CRZ) and standard dispute escalation clauses (Clause 25 Arbitration, Clause 10CC).
* **WHY WE CHOSE THIS DATASET**:
  1. **Root-Cause Delay Quantification**: Forest and environmental clearances account for over 35% of stalled projects. Ingesting this data enables calculation of the **Regulatory Stagnation Index (RSI)** and arbitration exposure in **ANUMATI** and **NIVARAN**.

---

## 4. 🔍 1,981 vs 2,207 Projects: The Exact Mathematical Explanation

If judges ask: *"The problem statement says 1,981 ongoing projects. Why does your database have 2,207?"*

$$\mathbf{Total\ Master\ Catalog\ (2,207)} = \mathbf{Active\ In\text{-}Flight\ (1,823)} + \mathbf{Pre\text{-}Construction\ Pipeline\ (220)} + \mathbf{Completed\ Benchmarks\ (164)}$$

| Category | Count | Detailed Explanation |
|---|---|---|
| **Active In-Flight** ($0\% < \text{Progress} < 100\%$) | **1,823** | Actively under civil execution across 22 infrastructure sectors. |
| **Pre-Construction / Newly Added** ($\text{Progress} = 0\%$) | **220** | Sanctioned projects undergoing land acquisition, tendering, or forest clearance (crucial for Early-Warning risk scoring). |
| **Completed / Commissioned Benchmarks** ($\text{Progress} = 100\%$) | **164** | Historically completed projects (crucial for ML model training as ground-truth target labels). |
| **Total Master Corpus** | **2,207** | **The Unified Master Database across multi-month PAIMANA cycles.** |

### 💡 The 3 Key Reasons for 2,207:
1. **Single-Month Snapshot vs Full Lifecycle**: 1,981 is the count strictly in "Ongoing" status in **April 2026 alone**. Over dynamic multi-month tracking (Jan–June 2026), projects enter (+55 in April, +268 in Feb) and exit (+130 completed in June).
2. **Preventing ML Right-Censoring Bias**: To train an AI model to predict final cost and time overrun, the model **must learn from completed projects (164 benchmarks)** where the actual final outcome is known.
3. **Pre-Construction Risk Warning**: The 220 projects with 0% progress allow the Ministry to detect delay risks *before* ground-breaking.

---

## 5. 🚨 The 5 Core Systemic Infrastructure Failure Modes We Solve

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ 1. OPTIMISM BIAS & REBASELINING   ──►  Static DPR targets reset to hide accumulated delays  │
│ 2. DEPENDENCY & RUPEE CONTAGION   ──►  Siloed ministries; unmeasured float; domino gridlocks│
│ 3. RIGID CAPITAL ALLOCATION       ──►  Linear budgeting; ignoring CVaR90 risk and NER floor │
│ 4. VERIFICATION & GHOST SPENDING  ──►  Contractor self-reporting; zero orbital verification │
│ 5. STATUTORY GAMING (20% CCEA)    ──►  19.9% bunching to bypass Cabinet; Clause 10CC gouging│
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

1. **Optimism Bias & DPR Target Trap**: Implementing agencies submit single-point target dates assuming zero monsoon delays, instant land handover, and friction-free approvals. When delayed by 3 years, they submit a "Revised Date", instantly turning the dashboard green again.
2. **Departmental Silos & Contagion**: Ministry of Coal digs a mine, Ministry of Railways builds the evacuation track, and Ministry of Power builds the thermal plant. If the railway line is delayed by 12 months, ₹8,000+ Crore of power and mining assets sit idle.
3. **Risk-Blind Capital Allocation**: Budgets are disbursed historically or equally across departments rather than mathematically optimizing for maximum economic commissioning per Rupee under tail risk ($CVaR_{90}$).
4. **Information Asymmetry & Contractor Moral Hazard**: Contractors self-report progress via web forms to trigger milestone payouts without independent ground-truth corroboration.
5. **Statutory Threshold Gaming (20% CCEA Rule)**: Under Cabinet rules, cost overruns $\ge 20\%$ require rigorous Cabinet Committee on Economic Affairs (CCEA) scrutiny. Contractors artificially cap reported overruns at **19.8% - 19.9%** to bypass Cabinet review.

---

## 6. 🧭 Complete Live Website Navigation & Portal Architecture

Our live application features a sovereign header adhering to **GIGW 3.0 standards** (Theme switcher, font scaler, search drawer) and is organized into **3 Top-Level Navigation Routes + 4 Specialized Analytical Portals**:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                               TOP-LEVEL NAVIGATION ROUTES                                   │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│ 1. HOME (/)             ──► Executive Overview, 5 Systemic Failure Modes & Core Partners    │
│ 2. DECISION HUB (/decision-hub) ──► Apex Decision Console Housing 10 Analytical Engines     │
│ 3. NAGRIK PORTAL (/nagrik)      ──► Public Transparency, State Heatmaps & 2,207 Project Cards│
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│                               SPECIALIZED PILLAR PORTALS                                    │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│ 4. SATYA-KAVACH (/satya-kavach) ──► 20% CCEA Threshold Anti-Gaming & Clearances Pipeline   │
│ 5. ARTHA-NIVARAN (/artha-nivaran) ──► PSU Balance Sheet Solvency & Legal Litigation Radar   │
│ 6. SETU-VARSHA (/setu-varsha)  ──► IMD Monsoon Contagion War Room & Satellite Verification  │
│ 7. KARYA-DAKSHATA (/karya-dakshata) ──► Agency Historical Delivery Multiplier Simulator     │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. 🛠️ Deep-Dive into All 10 Analytical Engines inside Decision Hub

Inside `/decision-hub`, policymakers have access to **10 dedicated analytical engines**:

### 1. 🌟 Unified Decision Cockpit (`unified_cockpit`)
* **Role**: The master executive interface integrating timeline risks, capital allocation recommendations, and satellite audit badges for any selected project.

### 2. 🕒 Kaal-Chakra Survival Forecast (`kaal_chakra`)
* **Role**: Replaces misleading single-date deadlines with probabilistic completion curves.
* **Math**: **Accelerated Failure Time (AFT) Survival Analysis** (Weibull & Log-Logistic) + Reference Class Forecasting (RCF).
* **Output**: Strictly monotonic, non-crossing quantiles: $P_{10}$ (Optimistic), $P_{50}$ (Expected Median), $P_{80}$ (Prudent Budget Baseline), and $P_{95}$ (Tail Disaster Worst-Case).

### 3. 💰 Vitta-Vyuha Linear Reallocation (`vitta_vyuha`)
* **Role**: Prescriptive capital allocation engine answering *"Where should the Cabinet deploy the next ₹10,000 Crore?"*
* **Math**: **Two-Stage Stochastic Mixed-Integer Linear Program (MILP)** with **$CVaR_{90}$ tail-risk control** and statutory **10% North-Eastern Region (NER) capital floor**.
* **Performance**: Solves across 2,207 projects in **$< 2\text{ seconds}$** using the open-source **HiGHS Solver**, supporting interactive budget sliders.

### 4. 📜 Pragati-Saarthi Cabinet Note (`pragati_saarthi`)
* **Role**: Generates high-level bilingual (English + official CSTT Hindi) executive briefing dossiers for PMO PRAGATI meetings.
* **Zero Hallucination**: No raw LLM number generation. Every single metric is computed deterministically and backed by **RFC 8785 JSON Canonicalization & SHA-256 Merkle Tree Proofs**.

### 5. 🏢 Agency Accountability Index (`agency_index`)
* **Role**: Quantifies the historical execution speed, mean cost overrun %, mean delay months, and performance tiering for every implementing agency (NHAI, RVNL, NTPC, CIL, etc.).

### 6. 🧪 Empirical Model Validation (`benchmark`)
* **Role**: Directly satisfies SIH Dimension (b) & (c) by comparing **Gradient Boosted Trees (Machine Learning)** against **OLS Linear Regression** and **Sector Mean Baselines**.
* **Key Evidence**: Proves ML achieves higher accuracy ($R^2$ improvement and lower MAE) while isolating SHAP feature importance for CUF vs non-CUF variables.

### 7. 🛡️ Satya-Kavach Statutory Audit (`satya_kavach`)
* **Role**: Tests cost revisions against the 20% CCEA boundary using McCrary density tests and checks CPWD Clause 10CC escalation caps.

### 8. 🔍 Artha-Nivaran Contractor 360 (`artha_nivaran`)
* **Role**: Correlates PSU debt-to-equity leverage ratios, Altman Z-scores, and equity market drawdowns to predict contractor distress 6–9 months ahead.

### 9. 🌊 Setu-Varsha Monsoon Shock (`setu_varsha`)
* **Role**: Models supply chain dependency cascades (Max-Plus Algebra) driven by IMD rainfall departures, isolating downstream locked capital.

### 10. 🧭 Karya-Dakshata Allocation (`karya_dakshata`)
* **Role**: Re-prices proposed project costs and schedules against the executing agency's measured historical track record.

---

## 8. 🏛️ Deep-Dive into All 4 Dedicated Pillar Portals

### 🛡️ Pillar 2: SATYA-KAVACH (`/satya-kavach`) — Statutory Audit & Regulatory Integrity
* **Sub-Tab 1: Financial Integrity**:
  * **McCrary Density Discontinuity Test**: Detects artificial 1.65× clustering of cost overruns just below the 20% threshold (at 19.4%–19.9%) to bypass Cabinet review.
  * **CPWD Clause 10CC Auditor**: Re-calculates contractor price hike claims against official RBI/WPI material indices to prevent price gouging.
* **Sub-Tab 2: Regulatory Clearances (ANUMATI Panel)**:
  * Tracks 5-stage PARIVESH clearance pipeline (Forest Stage-I/II, Wildlife, Environment, CRZ).
  * Computes **Regulatory Stagnation Index (RSI)** to detect paperwork loopbacks between Central and State ministries.

### 📈 Pillar 3: ARTHA-NIVARAN (`/artha-nivaran`) — Contractor 360
* **Sub-Tab 1: Solvency Matrix**:
  * Maps PSU leverage across 2,207 projects.
  * **Empirical Proof**: High-debt PSUs (SJVN D/E 227%, NHPC D/E 113%) suffer **80%–145% cost overruns**, while low-debt PSUs (Coal India D/E 12%) suffer only **25% overruns**.
* **Sub-Tab 2: NIVARAN Legal Radar**:
  * NLP scrutiny of CPWD GCC dispute clauses, live arbitration claims, and court stay orders to preempt site abandonment.

### 🌊 Pillar 4: SETU-VARSHA (`/setu-varsha`) — Climate Contagion War Room
* **Sub-Tab 1: Contagion War Room**:
  * **Interactive Rainfall Slider**: Users adjust IMD rainfall departure (from −50% to +50%).
  * **Cascading Chain**: Rainfall departure $\rightarrow$ Working-window contraction $\rightarrow$ Max-Plus float consumption $\rightarrow$ Downstream locked capex.
  * **Pinpoint Ground-Truth Satellite Viewer**: Inspects dual-epoch imagery for any selected project node.
* **Sub-Tab 2: IMD State Profiles**:
  * 20-year historical departure patterns and terrain-specific precipitation elasticities across all 36 Indian States/UTs.

### ⚙️ KARYA-DAKSHATA (`/karya-dakshata`) — Agency Execution Reliability Simulator
* **Purpose**: De-biasing optimistic DPR proposals by re-pricing them against the executing agency's measured historical delivery record.
* **How it works**:
  * Users enter **Proposed Base Cost (₹ Cr)** and **Proposed Timeline (Days)** and select an agency.
  * The simulator calculates the **True Expected Cost (₹ Cr)**, **True Expected Timeline (Days)**, and assigns a **Reliability Score (0–100)**.

---

## 9. 🥊 Judges & Jury Q&A Combat Guide (Winning Counter-Arguments)

### Q1: "Why did you monitor 2,207 projects when the problem statement mentions 1,981?"
> **Answer**: *"Sir/Ma'am, 1,981 is the count of projects strictly in 'Ongoing' status during the single-month snapshot of April 2026, as noted in the MoSPI report. However, PAIMANA is a dynamic portal updated monthly. Our master catalog of 2,207 projects includes the active in-flight portfolio (1,823), pre-construction pipeline projects (220), and 164 historically completed benchmark projects. Having completed projects is mathematically essential to train supervised ML models without right-censoring bias."*

### Q2: "Is any part of your dataset synthetic or fabricated?"
> **Answer**: *"Absolutely zero. All 2,207 records are 100% genuine government projects extracted directly from official MoSPI PAIMANA Flash Reports (Jan–June 2026) and live portal endpoints. We enriched them exclusively with verified open public data: ESA Sentinel satellite tiles, IMD weather data, DPIIT WPI commodity indices, and NSE/BSE corporate filings."*

### Q3: "Why did you add PSU stock and financial data to infrastructure monitoring?"
> **Answer**: *"This directly answers Sub-point (c) of the problem statement, which asks whether non-CUF variables improve prediction. CUF captures project parameters but misses contractor liquidity. If an executing PSU has a Debt-to-Equity ratio above 200%, they experience working capital shortages that stall ground progress. Our empirical data proves high-debt PSUs suffer 80–145% cost overruns vs 25% for low-debt PSUs. Stock drawdowns serve as a 6-to-9 month leading indicator of impending project distress."*

### Q4: "Why not just feed the project data into a Large Language Model like GPT-4 or Claude?"
> **Answer**: *"LLMs are probabilistic language models prone to numerical hallucinations—they cannot perform exact linear programming, survival analysis, or forensic legal audits required for public finances. In Prakalp Drishti, all calculations, quantiles, and optimizations are computed deterministically using rigorous mathematical libraries (HiGHS, Lifelines, Scikit-learn). The LLM is only used as a structured summarization layer with strict RFC 8785 canonicalization and SHA-256 Merkle tree verification."*

### Q5: "What if satellite imagery is cloudy or unavailable?"
> **Answer**: *"We designed a strict 'Verdict Withheld' protocol. If optical cloud cover exceeds 40%, the system switches to cloud-penetrating Sentinel-1 SAR (Synthetic Aperture Radar). If a project is underground (e.g., subway tunnel) or SAR is inconclusive, the system explicitly withholds its verdict rather than penalizing the contractor with a false negative."*

### Q6: "How does your optimization model help during sudden budget cuts?"
> **Answer**: *"Our VITTA-VYUHA engine is formulated as a Two-Stage Stochastic MILP with CVaR90 risk control. It runs in under 2 seconds on the HiGHS open-source solver. If the Ministry of Finance cuts available capex from ₹10,000 Cr to ₹6,000 Cr, the policymaker drags the interactive slider, and the engine instantly re-optimizes capital to protect high-multiplier, near-commissioning assets while maintaining the statutory 10% North-East funding floor."*

### Q7: "How is this different from the existing PAIMANA / OCMS portal?"
> **Answer**: *"PAIMANA is a descriptive reporting portal—it records what contractors upload. Prakalp Drishti transforms it into an active, zero-trust system: (1) we verify claims via satellites, (2) replace static deadlines with calibrated P10–P95 survival fan charts, (3) model cross-ministry domino delays via supply chain DAGs, (4) de-bias proposals with KARYA-DAKSHATA, and (5) provide prescriptive capital allocation optimization."*

---

## 10. 🔢 Key Numbers, Formulas & Stats Every Teammate Must Memorize

* **Total Monitored Portfolio**: 2,207 projects | **₹41.78 Lakh Crore** Total Revised Outlay.
* **National Delay Rate**: **44% to 55%** of mega-projects face delays of 12 to 140 months.
* **Cumulative Cost Overrun**: **₹4.8 Lakh Crore+** locked in historical escalations.
* **Cross-Project Exposure**: **₹23.97 Lakh Crore** locked in cross-project dependency cascades.
* **Geocoding Offline Accuracy**: **71.8%** verified geospatial coverage across 2,207 projects via `geonames_IN.txt`.
* **Solver Speed**: **$< 2\text{ seconds}$** re-solve time for 2,207 projects across 300 stochastic scenarios on open-source HiGHS.
* **Statutory Threshold**: **20% Cost Escalation** triggers mandatory Cabinet Committee on Economic Affairs (CCEA) review.
* **Statutory Regional Floor**: Minimum **10% Gross Budgetary Support** must be preserved for North Eastern Region (NER).
* **Core Tech Stack**: Python (FastAPI, NumPy, Pandas, Lifelines, GeoPandas, HiGHS Solver), React (Vite, TailwindCSS, Lucide), 100% Open-Source.

---
*Created for SIH 2026 Team | Prakalp Drishti — Autonomous Infrastructure Intelligence*
