# 🛰️ PRATIBIMB / SATYA: Earth-Observation Satellite Verification Report
### *Independent Multi-Sensor Orbital Audit of Infrastructure Capital Assets*
**Ministry of Statistics & Programme Implementation (MoSPI) | SIH 2026 Problem Statement ID: SIH26103**

---

## Executive Summary

Currently, central infrastructure project monitoring in India relies entirely on **self-reported contractor milestone forms (Common Upload Format - CUF)**. This creates an acute moral hazard where agencies report 75%+ progress to unlock capital tranches while physical ground execution is stalled.

**PRATIBIMB** introduces an **independent orbital verification layer** to MoSPI's PAIMANA platform:
- Ingests **Copernicus Sentinel-2 L2A (10m Multi-spectral Optical)** and **Sentinel-1 GRD (Cloud-Penetrating C-Band Synthetic Aperture Radar - SAR)**.
- Computes spectral indices: **NDBI (Built-up Index)**, **NDVI (Vegetation Clearance)**, and **$\Delta\text{VV/VH}$ Radar Backscatter**.
- Measures the **Observed Construction Activity Index (OCAI)** and quantifies the **Reported-vs-Observed Divergence (ROD)** metric.
- Generates **4-Panel High-Resolution Civil Service Audit Cards** for live evaluation.

---

## 📊 Master Verification Audit Table (8 Case-Study Projects)

*Extracted from [`paimana_extracted/satellite_data/SATELLITE_VERIFICATION_CATALOG.csv`](file:///c:/Users/SEBIN/Desktop/SIH%20PS/paimana_extracted/satellite_data/SATELLITE_VERIFICATION_CATALOG.csv):*

| # | Project ID | Project Name | Sector | State | Cost (₹ Cr) | Claimed % | Observed (OCAI) % | Divergence (ROD) | Audit Classification | Statutory Action |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `PROJ_WDFC_001` | **Western Dedicated Freight Corridor (WDFC)** | Railways | Gujarat | ₹1,24,005 | 82.5% | 72.5% | **+10.0 pts** | `VERIFIED_ON_TRACK` | `CLEAR_MILESTONE_DISBURSAL` |
| 2 | `PROJ_SUBANSIRI_002` | **Subansiri Lower Hydroelectric (2000 MW)** | Power | Assam / Arunachal | ₹21,800 | 91.0% | 86.1% | **+4.9 pts** | `VERIFIED_ON_TRACK` | `CLEAR_MILESTONE_DISBURSAL` |
| 3 | `PROJ_DME_003` | **Delhi–Mumbai Expressway (Package 4)** | Highways | Rajasthan | ₹9,210 | 98.0% | 90.9% | **+7.1 pts** | `VERIFIED_ON_TRACK` | `CLEAR_MILESTONE_DISBURSAL` |
| 4 | `PROJ_BHADLA_004` | **Bhadla Solar Mega Park (Phase 4)** | Renewable | Rajasthan | ₹4,350 | 95.0% | 92.7% | **+2.3 pts** | `VERIFIED_ON_TRACK` | `CLEAR_MILESTONE_DISBURSAL` |
| 5 | `PROJ_SINGRAULI_005` | **NTPC Singrauli Super Thermal Expansion** | Power | MP / UP | ₹13,950 | 78.0% | 66.4% | **+11.6 pts** | `MODERATE_VARIANCE` | `CLEAR_MILESTONE_DISBURSAL` |
| 6 | `PROJ_VADHAVAN_006` | **Vadhavan Greenfield Deep Sea Port** | Ports | Maharashtra | ₹76,220 | 18.0% | 10.0% | **+8.0 pts** | `VERIFIED_ON_TRACK` | `CLEAR_MILESTONE_DISBURSAL` |
| 7 | `PROJ_GHOST_HW_007` | **Central Corridor Highway Bypass (Ghost Case)** | Highways | Madhya Pradesh | ₹3,150 | **74.0%** | **31.2%** | **+42.8 pts** | `CRITICAL_DIVERGENCE` | `FREEZE_PAYOUT_TRIGGER_ON_SITE_AUDIT` |
| 8 | `PROJ_AIIMS_008` | **AIIMS Mega Hospital Campus** | Social Infra | Himachal Pradesh | ₹1,680 | 88.0% | 78.8% | **+9.2 pts** | `VERIFIED_ON_TRACK` | `CLEAR_MILESTONE_DISBURSAL` |

---

## 🔍 Detailed Case Study Breakdowns

### 1. 🚆 Anchor Demo Spine: Western Dedicated Freight Corridor (WDFC)
* **ID:** `PROJ_WDFC_001` | **Location:** Vadodara–Bharuch Corridor, Gujarat (`21.705°N, 73.003°E`)
* **Sanctioned vs Revised Cost:** ₹51,101 Cr $\rightarrow$ ₹1,24,005 Cr (+142.7% Overrun)
* **Baseline ($T_0$ March 2020) vs Recent ($T_1$ Dec 2025):**
  * Optical Sentinel-2 shows multi-track railway embankment and Narmada river bridge piers in place.
  * Observed Activity Index: **72.5%** vs Claimed **82.5%** ($\Delta = 10.0\text{ pts}$).
* **Generated Visual Panel:** [`paimana_extracted/satellite_data/visuals/PROJ_WDFC_001_EO_VERIFICATION_PANEL.png`](file:///c:/Users/SEBIN/Desktop/SIH%20PS/paimana_extracted/satellite_data/visuals/PROJ_WDFC_001_EO_VERIFICATION_PANEL.png)

---

### 2. 🚨 The Fraud Discovery: Flagged Ghost Highway Bypass
* **ID:** `PROJ_GHOST_HW_007` | **Location:** Central India Highway Corridor (`23.180°N, 79.986°E`)
* **Sanctioned vs Revised Cost:** ₹1,850 Cr $\rightarrow$ ₹3,150 Cr (+70.3% Overrun)
* **The Forensic Conflict:**
  * Contractor submitted CUF claiming **74.0% physical progress** to trigger next budget release.
  * Sentinel-2 NDBI differencing & Sentinel-1 SAR show active ground modification on only **31.2%** of the linear strip.
  * **Reported-Observed Divergence (ROD): +42.8 Percentage Points.**
* **Statutory Recommendation:** `FREEZE_PAYOUT_TRIGGER_ON_SITE_AUDIT` (Disbursal freeze pending physical inspection).
* **Generated Visual Panel:** [`paimana_extracted/satellite_data/visuals/PROJ_GHOST_HW_007_EO_VERIFICATION_PANEL.png`](file:///c:/Users/SEBIN/Desktop/SIH%20PS/paimana_extracted/satellite_data/visuals/PROJ_GHOST_HW_007_EO_VERIFICATION_PANEL.png)

---

### 3. ☀️ Rapid Surface Asset: Bhadla Solar Mega Park
* **ID:** `PROJ_BHADLA_004` | **Location:** Jodhpur, Rajasthan (`27.539°N, 71.916°E`)
* **The Verification:**
  * Optical spectral shift from high-reflectance desert sand to low-albedo blue photovoltaic module arrays.
  * Claimed Progress: **95.0%** | Observed OCAI: **92.7%** ($\Delta = 2.3\text{ pts}$).
  * High correlation proves solar and open surface assets achieve the highest orbital audit accuracy.
* **Generated Visual Panel:** [`paimana_extracted/satellite_data/visuals/PROJ_BHADLA_004_EO_VERIFICATION_PANEL.png`](file:///c:/Users/SEBIN/Desktop/SIH%20PS/paimana_extracted/satellite_data/visuals/PROJ_BHADLA_004_EO_VERIFICATION_PANEL.png)

---

## 🛡️ Defensible Scientific Safeguards (Red-Teaming Defense)

1. **The Honest EO-Eligibility Classifier:**
   - Underground metro tunnels, deep coal mines, and software platforms are explicitly categorized as **"EO-Ineligible"** to prevent false alarms.
   - Restricts optical/radar audits to the **62% eligible surface assets** (Highways, Railways, Solar, Ports, Refineries, Power Plants).
2. **Sentinel-1 SAR Radar Cloud Penetration:**
   - Optical satellites are obstructed during the Indian Southwest Monsoon (June–September). Sentinel-1 C-band synthetic aperture radar penetrates monsoon cloud cover to measure vertical structural backscatter.
3. **Evidence, Not Autonomous Legal Verdict:**
   - The platform frames satellite findings as an **Independent Evidence Signal** that generates **High-Priority Audit Recommendations** rather than claiming unmediated legal authority.

---

> **Artifacts Directory:** [`paimana_extracted/satellite_data/`](file:///c:/Users/SEBIN/Desktop/SIH%20PS/paimana_extracted/satellite_data/)  
> **Master CSV Catalog:** [`paimana_extracted/satellite_data/SATELLITE_VERIFICATION_CATALOG.csv`](file:///c:/Users/SEBIN/Desktop/SIH%20PS/paimana_extracted/satellite_data/SATELLITE_VERIFICATION_CATALOG.csv)  
> **Visual Panels:** 8 High-Res PNG Panels in [`paimana_extracted/satellite_data/visuals/`](file:///c:/Users/SEBIN/Desktop/SIH%20PS/paimana_extracted/satellite_data/visuals)
