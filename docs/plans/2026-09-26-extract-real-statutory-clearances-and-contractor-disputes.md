# Real Statutory Clearances & Contractor Dispute Data Extraction Plan

> **For Agent:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task.

**Goal:** Extract and integrate 100% real government and public corporate data for all four non-forest domains (Environment Clearance, Wildlife Clearance, Land Acquisition, and Contractor Disputes) into PRAKALP-DRISHTI, completely eliminating synthetic records across Anumati and Nivaran.

**Architecture:** 
1. Build dedicated extraction engines for PARIVESH EC (`parivesh.nic.in`), NBWL Wildlife (`parivesh.nic.in/parivesh-ua`), and Bhoomi Rashi / MoSPI land handover records.
2. Build a curated SEBI annual disclosure and eCourts scraper for real contractor arbitration records.
3. Apply our proven 3-layer deterministic matching pipeline (Hard Geographic/Sector Filters $\rightarrow$ Structural Gazette / Chainage IDs $\rightarrow$ Fuzzy Token Overlap) to bind each record directly to the 2,207 PAIMANA master projects.
4. Upgrade SQLite `prakalp_drishti_raw.db` and JSON mirror caches to serve authentic data via existing FastAPI endpoints.

**Tech Stack:** Python 3.12+, Requests, BeautifulSoup4, RapidFuzz, SQLite3, Pandas, FastAPI, Pydantic v2.

---

## Scope & Target Portals

| Domain | Target Entity | Official Source Portal | Data Volume | Target Format |
| :--- | :--- | :--- | :--- | :--- |
| **1. Environment Clearance** | EAC / SEIAA Approvals | `parivesh.nic.in` / `environmentclearance.nic.in` | ~3,500+ proposals | `IA/[State]/[Sector]/[ID]/[Year]` |
| **2. Wildlife Clearance** | SC-NBWL Standing Committee | `parivesh.nic.in/parivesh-ua/#/wlc-public-dashboard` | ~400–800 proposals | `FP/WL/[State]/...` |
| **3. Land Acquisition** | CALA Gazette & MoSPI Handover | `bhoomirashi.gov.in` + MoSPI OCMS Milestone Tables | 2,207 projects | Sec 3A/3D Gazettes + % Acquired |
| **4. Contractor Disputes** | Arbitration Petitions & Claims | SEBI Public Disclosures + eCourts High Court Orders | Top 40 Contractors | `O.M.P. (COMM)` / Arbitral Awards |

---

## Phased Implementation Tasks

### Phase 1: Environment Clearance (EC) Extraction & Matching

#### Task 1.1: Build PARIVESH Environment Clearance Scraper
**Files:**
- Create: `modules/aditya/data/scrape_ec_portal.py`
- Test: `tests/test_scrape_ec.py`

**Action:**
1. Connect to `https://parivesh.nic.in/` public dashboard / `environmentclearance.nic.in/Proposal_Status.aspx`.
2. Extract project name, `proposal_number` (`IA/...`), state, sector category (Category A - Central MoEFCC vs Category B - State SEIAA), date of ToR (Terms of Reference), EAC appraisal meeting dates, and final EC grant/pending status.
3. Support incremental saving to `modules/aditya/data/raw/ec_real_data/ec_proposals_raw.csv`.

**Verification:**
Run: `python -u modules/aditya/data/scrape_ec_portal.py --sample 50`
Expected: 50 real EC proposals parsed with valid `IA/...` proposal numbers and non-empty titles.

---

#### Task 1.2: Match EC Proposals to PAIMANA Projects
**Files:**
- Create: `modules/aditya/data/match_ec_to_paimana.py`
- Output: `modules/aditya/data/raw/ec_real_data/ec_matches.csv`

**Action:**
1. Filter candidates by `State` and `Sector`.
2. Check structural IDs: NH numbers, thermal/hydel plant capacities (MW), mining block names.
3. Compute tokenized fuzzy similarity (threshold >= 45).
4. For projects exempt under EIA Notification 2006 (e.g. highway expansions <100 km or <20m RoW without passing through eco-sensitive areas), tag as `EC_EXEMPT_OR_NOT_REQUIRED`.

**Verification:**
Run: `python -u modules/aditya/data/match_ec_to_paimana.py`
Expected: Direct matches identified for eligible major infrastructure projects; non-applicable projects classified as `EC_EXEMPT`.

---

### Phase 2: Wildlife Clearance (WL) Extraction & Matching

#### Task 2.1: Extract SC-NBWL Wildlife Proposals
**Files:**
- Create: `modules/aditya/data/scrape_wildlife_portal.py`
- Output: `modules/aditya/data/raw/wl_real_data/wl_proposals_raw.csv`

**Action:**
1. Scrape `https://parivesh.nic.in/parivesh-ua/#/wlc-public-dashboard` and MoEFCC Standing Committee NBWL published meeting registers.
2. Extract Protected Area (National Park / Sanctuary / Tiger Reserve / Eco-Sensitive Zone), diverted sanctuary area (ha), animal underpass/overpass requirements, CAMPA wildlife conservation deposit status, and official proposal number (`FP/WL/...`).

**Verification:**
Run: `python -u modules/aditya/data/scrape_wildlife_portal.py --test`
Expected: Extraction of authentic NBWL proposals.

---

#### Task 2.2: Match Wildlife Proposals to Sensitive Corridors
**Files:**
- Create: `modules/aditya/data/match_wl_to_paimana.py`
- Output: `modules/aditya/data/raw/wl_real_data/wl_matches.csv`

**Action:**
1. Match wildlife clearance proposals to PAIMANA projects cutting through known wildlife corridors (e.g., NH-7 Pench corridor, Kaziranga elevated road, Western Ghats rail lines, Chamba/Dharamshala bypasses).
2. For all projects outside the 10 km Eco-Sensitive Zone (ESZ), classify strictly as `WILDLIFE_NOT_APPLICABLE` (0.0 Ha diversion, 0 days pending).

---

### Phase 3: Land Acquisition (Bhoomi Rashi & MoSPI Handover) Integration

#### Task 3.1: Extract Real Land Handover & Gazette Numbers
**Files:**
- Create: `modules/aditya/data/extract_land_acquisition.py`
- Source: `paimana_extracted/ALL_RAW_TABLES_June2026.csv` + `bhoomirashi.gov.in` gazettes.
- Output: `modules/aditya/data/raw/land_real_data/land_acquisition_master.csv`

**Action:**
1. Parse MoSPI OCMS milestone tracking records for all 2,207 projects:
   - Total Land Required (Hectares)
   - Total Land Handed Over to Contractor (Hectares and %)
   - Land Acquisition Delay Months
2. For National Highway projects, cross-reference MoRTH Bhoomi Rashi published Gazette notifications to pull real Section 3A (Intention), Section 3D (Vesting), and Section 3G (Award) gazette notification identifiers (e.g. `S.O. 1842(E)`).

**Verification:**
Run: `python -u modules/aditya/data/extract_land_acquisition.py`
Expected: 100% of projects mapped to real land handover percentage, overdue land delivery days, and official gazette citations.

---

### Phase 4: Real Contractor Disputes & Arbitration Registry (Nivaran)

#### Task 4.1: Compile Real Contractor Litigation & Arbitration Data
**Files:**
- Create: `modules/aditya/data/build_real_contractors_registry.py`
- Output: `modules/aditya/data/raw/contractors_registry_real.csv`

**Action:**
1. Compile the verified public arbitration disclosures for major contractors in PAIMANA (L&T, Dilip Buildcon, NCC Ltd, Afcons Infrastructure, Patel Engineering, Ashoka Buildcon, IRB Infrastructure, Hindustan Construction Co, Megha Engineering):
   - Real pending arbitration claims value against PSUs (from SEBI 2024–2026 Annual Report Contingent Liability notes).
   - Real High Court Section 9 / 11 / 34 petition case numbers (e.g. `O.M.P. (COMM) 124/2023` in Delhi High Court or Bombay High Court).
   - Real dispute categories: Scope Variation, Delay in Handover of RoW, Price Adjustment under Clause 10CC, Liquidated Damages deduction.
2. Replace synthetic credit ratings and invented arbitration counts with authentic public filings.

**Verification:**
Run: `python -u modules/aditya/data/build_real_contractors_registry.py`
Expected: 40+ contractors mapped with audited dispute figures and court case citations.

---

### Phase 5: Database Consolidation & Unified Engine Upgrade

#### Task 5.1: Rebuild `parivesh_clearances` with All 4 Real Datasets
**Files:**
- Modify: `modules/aditya/data/generate_parivesh_2207.py`
- Output: `modules/aditya/data/raw/prakalp_drishti_raw.db` (`parivesh_clearances` & `contractors` tables)
- Output: `paimana_extracted/PARIVESH_2207_CLEARANCES.json`

**Action:**
1. Populate `FOREST_CLEARANCE` with real PARIVESH FC data (already completed: 500 real + 1,707 exempt).
2. Populate `ENVIRONMENT_CLEARANCE` with real PARIVESH EC data from Phase 1.
3. Populate `WILDLIFE_CLEARANCE` with real NBWL data from Phase 2.
4. Populate `LAND_RFCTLARR` with real MoSPI/Bhoomi Rashi land handover records from Phase 3.
5. Populate `contractors` table with authentic SEBI/eCourts disclosures from Phase 4.

**Verification:**
Run: `python modules/aditya/data/generate_parivesh_2207.py`
Expected: 0 synthetic records remaining across all statutory stages in SQLite and JSON caches.

---

### Phase 6: System Verification & API / UI Testing

#### Task 6.1: Verify FastAPI Endpoints & UI Visuals
**Files:**
- Test: `tests/test_real_clearances_api.py`
- Target Endpoints:
  - `GET /api/tanmay/anumati/clearances`
  - `GET /api/aditya/anumati/clearance-status/{project_id}`
  - `GET /api/aditya/nivaran/dispute-risk/{project_id}`

**Action:**
1. Verify `HTTP 200 OK` on all endpoints.
2. Confirm that every returned project contains genuine government proposal numbers, official gazette citations, or valid non-applicable declarations.
3. Verify that the Anumati UI (`AnumatiClearancesView.jsx`) displays authentic metrics without frontend errors.

---

## Execution Handoff

When ready to execute this implementation plan:
* We will proceed sequentially starting with **Phase 1 (Environment Clearance scraping from PARIVESH)**.
* Each phase will save its raw extracted government data incrementally before running the matcher and updating SQLite.
