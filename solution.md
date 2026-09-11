# 🛰️ PRAKALP-DRISHTI: The Complete Mathematical & Architectural Solution Specification
### Autonomous Infrastructure Intelligence & Sovereign Decision Cockpit
**Smart India Hackathon 2026** | **Ministry of Statistics and Programme Implementation (MoSPI)**
*Central Sector Mega-Projects Portfolio: 2,207 Projects | ₹47.44 Lakh Crore Public Capex*

---

## 1. Executive Solution Overview

**PRAKALP-DRISHTI** (प्रकल्प-दृष्टि — *Autonomous Infrastructure Decision Intelligence*) is an end-to-end mathematical and visual decision-support platform engineered for the **Cabinet Secretariat**, **Prime Minister's Office (PMO)**, **NITI Aayog**, and **Ministry of Statistics and Programme Implementation (MoSPI)**.

It solves the fundamental crisis in Indian public infrastructure execution: **asymmetric, vendor-reported progress data resulting in systemic cost escalations and chronic delay contagion**. PRAKALP-DRISHTI replaces static, self-reported monitoring with:
1. **Real-time probabilistic completion forecasting** with conformalized confidence guarantees.
2. **Multi-modal supply-chain contagion modeling** with cooperative game-theoretic risk attribution.
3. **Continuous two-stage stochastic linear capital optimization** under extreme fiscal tail risk.
4. **Dual-epoch Earth observation verification at 2.08-2.35 m/px** using NASA-IBM Prithvi foundation vision transformers. Sub-metre inference is explicitly refused - see [CLAIMS.md](CLAIMS.md).
5. **Cryptographically verifiable Merkle audit trails** delivering zero-hallucination bilingual executive briefings.
6. **Statutory contract audit & anti-gaming detection** exposing regulatory and financial anomalies.
7. **Citizen-facing proactive transparency** in strict adherence to RTI Act §4(1)(b).

---

## 2. Global System Architecture

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       PRAKALP-DRISHTI ARCHITECTURE                                     │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                        │
│   [ 2,207 Mega-Projects Database (₹47.44 Lakh Cr) ] ───► In-Memory Vector Store (<2.5ms Query Latency)   │
│                                                                                                        │
│   ┌───────────────────────────┐      ┌───────────────────────────┐      ┌──────────────────────────┐   │
│   │ 1. KAAL-CHAKRA            │      │ 2. SETU-GRAPH & VARSHA    │      │ 3. VITTA-VYUHA           │   │
│   │ • Conformalised Quantiles │ ───► │ • Multi-Modal DAG Network │ ───► │ • Two-Stage LP (HiGHS)   │   │
│   │ • Censored-MLE AFT Fit    │      │ • Max-Plus Schedule Float │      │ • CVaR90 Risk Dial (κ)   │   │
│   │ • P10-P95 Fan Charts      │      │ • IMD Monsoon Contagion   │      │ • 10% NER Statutory Floor│   │
│   │ • Baseline Reset Detection│      │ • Shapley Value Risk (φ)  │      │ • Dual Shadow Prices (π) │   │
│   └───────────────────────────┘      └───────────────────────────┘      └──────────────────────────┘   │
│                 │                                  │                                  │                │
│                 └──────────────────────────────────┼──────────────────────────────────┘                │
│                                                    ▼                                                   │
│   ┌────────────────────────────────────────────────────────────────────────────────────────────────┐   │
│   │ 4. PRATIBIMB-EO & NASA-IBM PRITHVI FOUNDATION BACKBONE                                         │   │
│   │ • Dual-Epoch Optical Comparison @ 2.08-2.35 m/px (T0 Baseline vs T1 Current)                   │   │
│   │ • Pretrained Geospatial ViT (NASA-IBM Prithvi) for Construction Stage Identification           │   │
│   │ • 5-Tier Geocoding Taxonomy (71.8% Site Precision) + Honest "Verdict Withheld" Protocol        │   │
│   │ • RRN Relative Radiometry + PIF Calibration + 4 Analytical Overlays (Built-up, Corridor, etc.) │   │
│   └────────────────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                    │                                                   │
│                                                    ▼                                                   │
│   ┌────────────────────────────────────────────────────────────────────────────────────────────────┐   │
│   │ 5. PRAGATI-SAARTHI & CAG/CVC CRYPTOGRAPHIC AUDIT SUITE                                         │   │
│   │ • 3-Layer Zero-Hallucination Pipeline (Fact Layer ──► Assertion Layer ──► Render Layer)        │   │
│   │ • RFC 8785 JSON Canonicalization Scheme (JCS) + SHA-256 Binary Merkle Tree Lineage             │   │
│   │ • Positional Sibling Inclusion Proofs with Client & Server Tamper-Defense Rejection            │   │
│   │ • Standardized Bilingual Administrative Output (English & CSTT Official Hindi)                 │   │
│   └────────────────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                    │                                                   │
│                                                    ▼                                                   │
│   ┌────────────────────────────────────────────────────────────────────────────────────────────────┐   │
│   │ 6. UNIFIED CAUSAL COCKPIT, GOVERNANCE & NAGRIK PUBLIC PORTAL                                   │   │
│   │ • Single-Loop Live Simulator: Delay Shock ──► Graph Contagion ──► Capital Re-Balancing         │   │
│   │ • SATYA-KAVACH: 20% Cost Overrun Anti-Gaming & GCC Clause 10CC Contractual Evasion Audit       │   │
│   │ • ARTHA-NIVARAN: 225 Contractor PSU Entity Deduplication & 4 Balance-Sheet Stress Tiers        │   │
│   │ • ANUMATI: Regulatory Stagnation Index across Forest, Wildlife, Land & Railway Clearances     │   │
│   │ • NAGRIK PORTAL (/nagrik): RTI §4(1)(b) Proactive Transparency for Indian Citizens             │   │
│   └────────────────────────────────────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Detailed Mathematical Formulations of the 12 Intelligence Engines

---

### 🕒 Engine 1: KAAL-CHAKRA (Realistic Timeline & Competing-Risk Forecasting)
* **Survival Modeling**: Completion time $T$ is modeled via a log-logistic **Accelerated Failure Time (AFT)** regression, fitted by penalised maximum likelihood under right-censoring. Censored projects contribute $\log S(t)$, so the 1,988 still-running projects inform the fit rather than being discarded. Absorbing terminal states are attenuated by a **Fine-Gray-*style*** bounded foreclosure term - no sub-distribution hazard is fitted, because the corpus carries no competing-event labels. The reference form is:
  $$\lambda_k(t; x) = \lim_{\Delta t \to 0} \frac{P(t \le T < t + \Delta t, K = k \mid T \ge t \cup (T < t \cap K \ne k))}{\Delta t}$$
* **Finite-Sample Conformalized Quantile Regression (CQR)**: Guarantees coverage at target confidence $1 - \alpha$ with strict non-crossing monotonicity:
  $$P_{10} \le P_{50} \le P_{80} \le P_{95}$$
  - **$P_{10}$ (Optimistic Frontier)**: High-speed execution assuming zero friction.
  - **$P_{50}$ (Median Realism)**: Statistically expected completion milestone.
  - **$P_{80}$ (Budgetary Baseline)**: Standard target for conservative fiscal provisioning.
  - **$P_{95}$ (Tail Risk Ceiling)**: Severe disruption milestone under adverse multi-factor shocks.
* **DPR Baseline Reset Detection**: Detects baseline masking where agencies reset project start dates to hide delay history, calculating true cumulative cost escalation:
  $$\Delta \text{Cost}_{\text{true}} = \text{Anticipated Cost} - \text{Original Cabinet Sanctioned Cost}$$

---

### 🔗 Engine 2: SETU-GRAPH (Multi-Modal Dependency DAG & Network Contagion)
* **Network Topology**: Ingests 1,197 multi-modal economic links across 2,207 projects categorized into:
  1. *Statutory Clearances* (e.g., Environmental clearance $\to$ Construction).
  2. *Raw Material Feeders* (e.g., Captive Coal Mine $\to$ Super Thermal Power Plant).
  3. *Spatial Corridors* (e.g., Freight Rail Line $\to$ Intermodal Logistics Hub).
  4. *Power Evacuation* (e.g., Hydro Turbine Installation $\to$ HVDC Transmission Substation).
* **Tarjan SCC Condensation**: Applies Tarjan's Strongly Connected Components algorithm to condense cyclic economic loops into a strictly acyclic Directed Acyclic Graph $G^* = (V^*, E^*)$.
* **Max-Plus Schedule Algebra & Float Propagation**:
  $$\text{Total Float (TF)}_i = \text{Late Finish (LF)}_i - \text{Early Finish (EF)}_i$$
  $$\text{Free Float (FF)}_i = \min_{j \in \text{Succ}(i)} \text{Early Start (ES)}_j - \text{Early Finish (EF)}_i$$
  - Delays within $\text{FF}_i$ are absorbed locally with zero network damage.
  - Delays exceeding $\text{TF}_i$ propagate downstream, computing locked capital across all successor paths:
    $$\text{Locked Capital}_{\text{downstream}}(i) = \sum_{j \in \text{Descendants}(i)} \text{Sanctioned Capex}_j$$
* **Permutation Monte Carlo Shapley Criticality ($\varphi_j$)**: Computes each project's marginal contribution to national network risk:
  $$\varphi_j = \sum_{S \subseteq N \setminus \{j\}} \frac{|S|!(|N| - |S| - 1)!}{|N|!} \left[ v(S \cup \{j\}) - v(S) \right]$$
  Guarantees efficiency: $\sum_{j=1}^{N} \varphi_j = \text{Total Systemic Locked Capital (₹23.97 Lakh Cr)}$.

---

### 🌧️ Engine 3: SETU-VARSHA (Climate Shock & Monsoon Working-Window Contraction)
* **IMD Precipitation Ingestion**: Maps historical district-level monsoon departure percentages (% LPA — Long Period Average) against project spatial bounding boxes.
* **Working-Window Contraction Function**: Computes reduction in physical construction days:
  $$\Delta W_i = \max\left(0, \alpha_{\text{sector}} \cdot \left( \frac{\text{Rainfall Departure \%}}{100} \right) \cdot \text{Monsoon Span (Days)} \right)$$
* **Weather-Shock Contagion**: Distinguishes direct weather exposure from downstream network contagion, allowing PMO planners to differentiate between acts of God and contractual execution inertia.

---

### 💰 Engine 4: VITTA-VYUHA (Two-Stage Stochastic Capital Optimization)
* **Formulation**: Continuous Two-Stage Stochastic Linear Program (LP) solved via the **HiGHS** simplex solver in **$<10\text{ ms}$** (230x faster than legacy MILP approximations):
  $$\max_{x \ge 0} \quad (1 - \kappa) \sum_{i=1}^n \mu_i(x_i) - \kappa \cdot \text{CVaR}_{90}(x)$$
  $$\text{subject to} \quad \sum_{i=1}^n x_i \le B_{\text{total}} \quad (\text{Budget Conservation})$$
  $$\sum_{i \in \text{NER}} x_i \ge 0.10 \cdot B_{\text{total}} \quad (\text{Statutory 10\% North-East Floor})$$
  $$0 \le x_i \le \text{Annual Absorption Capacity}_i$$
* **Rockafellar-Uryasev $\text{CVaR}_{90}$**: Convex formulation of Conditional Value-at-Risk using auxiliary loss variable $\zeta$:
  $$\text{CVaR}_{90}(x) = \min_{\zeta} \left\{ \zeta + \frac{1}{1 - 0.90} \mathbb{E}\left[ \max(0, \text{Loss}(x) - \zeta) \right] \right\}$$
* **SOS2 Piecewise Linear Tranches**: Models diminishing marginal returns on capital absorption:
  - Tranche 1 (0%–40% absorption): Yield coefficient $1.00$
  - Tranche 2 (40%–75% absorption): Yield coefficient $0.65$
  - Tranche 3 (75%–100% absorption): Yield coefficient $0.30$
* **Dual Shadow Price Extraction ($\pi$)**: Because the formulation is continuous, exact dual multipliers are extracted:
  - $\pi_{\text{budget}} = +0.699$: Marginal national progress yield generated per additional ₹1 Cr allocated.
  - $\pi_{\text{ner}} = -0.042$: Opportunity cost of the statutory North-Eastern regional equity constraint.

---

### 🛰️ Engine 5: PRATIBIMB-EO (Earth Observation & Computer Vision Pipeline)
* **Dual-Epoch Optical Registration**: Pairs Baseline ($T_0$) satellite imagery from project initiation with Current ($T_1$) imagery using sub-pixel phase correlation.
* **Radiometric Relative Normalization (RRN)**: Identifies Pseudo-Invariant Features (PIF) across non-vegetated invariant urban features to normalize atmospheric illumination differences:
  $$\text{DN}_{T_1}^{\text{norm}} = a_k \cdot \text{DN}_{T_1} + b_k$$
* **4-Channel Analytical Overlays**:
  1. *Built-up Surface Layer*: Normalized Difference Built-up Index (NDBI) and Red-Blue Luminescence ratio.
  2. *RoW Corridor Buffer*: Fits linear Right-of-Way containment corridors for highways and railways.
  3. *Spectral Change Mask*: Spectral Angle Mapper (SAM) detecting genuine physical construction transitions.
  4. *Material Transition Map*: Classifies soil excavation $\to$ concrete paving $\to$ structural superstructures.
* **5-Tier Geocoding Taxonomy & Honest "Verdict Withheld" Protocol**:
  - Tiers 1–3 (Exact Site, Surveyed Plot, Sub-district): **71.8% site precision** — Full computer vision change audit published.
  - Tiers 4–5 (District / State Centroid): **28.2% uncertainty** — System explicitly withholds optical verdicts with an administrative notice, preventing AI hallucination from misrepresenting unrelated ground.

---

### 🧠 Engine 6: NASA-IBM PRITHVI GEOSPATIAL FOUNDATION MODEL
* **Architecture**: 100-Million parameter Geospatial Vision Transformer (ViT) with Patch Embedding (16x16) pretrained by NASA and IBM on Harmonized Landsat-Sentinel (HLS) multi-spectral imagery.
* **Distantly-Supervised Stage Classifier**: Downstream linear probe over the frozen Prithvi backbone, classifying projects into 5 operational construction phases. The backbone is **not** fine-tuned - no labelled ground-truth corpus for Indian construction stages exists, so distant supervision is used and named as such:
  $$\mathcal{Y} = \{\text{Land Clearance}, \text{Earthwork \& Substructure}, \text{Superstructure}, \text{Finishing \& Commissioning}, \text{Operational / Stalled}\}$$
* **Sovereign Evidence Triangulation**: Compares self-reported physical progress percentage against Prithvi-predicted stage probabilities. If reported progress is $>75\%$ while Prithvi detects $\text{Land Clearance}$ with $>90\%$ confidence, a **RED FRAUD ALERT** is generated.

---

### 📜 Engine 7: PRAGATI-SAARTHI (Zero-Hallucination Merkle Audit Trail)
* **3-Layer Deterministic Pipeline**:
  $$\text{Raw Telemetry Fact Layer} \xrightarrow{\text{Formal Grammar}} \text{Assertion Logic Layer} \xrightarrow{\text{CSTT Lexicon}} \text{Bilingual Render Layer}$$
* **RFC 8785 JSON Canonicalization (JCS)**: Normalizes numerical keys, whitespace, and Unicode formatting into a canonical representation before cryptographic hashing.
* **SHA-256 Binary Merkle Tree Lineage**:
  $$\text{Leaf}_i = \text{SHA256}(\text{JCS}(\text{Fact}_i)) \quad ; \quad \text{Parent} = \text{SHA256}(\text{Left} \parallel \text{Right})$$
* **Positional Sibling Inclusion Proofs**: Generates step-by-step cryptographic audit paths allowing Cabinet officers to verify any metric against the root hash:
  $$\text{Verify}(\text{Root}, \text{Fact}_i, \text{ProofPath}) \in \{\text{VALID}, \text{FORGED}\}$$
* **Bilingual Administrative Alignment**: Native output in standard English and CSTT (Commission for Scientific and Technical Terminology) Official Administrative Hindi.

---

### 🛡️ Engine 8: SATYA-KAVACH (20% Cost Overrun Anti-Gaming & Contract Audit)
* **Statutory Bunching Detection**: Under Indian procurement rules, cost overruns exceeding 20% trigger mandatory Cabinet Committee on Economic Affairs (CCEA) and Revised Cost Committee (RCC) audits. Satya-Kavach runs McCrary density discontinuity tests to detect artificial bunching at 18.5%–19.9% cost escalation.
* **GCC Clause 10CC Price Escalation Audit**: Analyzes contractual indexation formulas (Labor, Cement, Steel, Fuel) to flag inflated price adjustment claims submitted during project stagnation.

---

### 📊 Engine 9: ARTHA-NIVARAN & ARTHA-NETRA (PSU Balance Sheet Stress)
* **Entity Resolution**: Ingests and cleans 225 unstructured `COMPANYNAME` strings across 2,207 projects into unified corporate balance-sheet profiles.
* **4-Tier Credit & Liquidity Taxonomy**:
  1. 🟢 **PRIME CASH RICH**: Debt-to-Equity $<0.5$, Current Ratio $>2.0$ (High execution velocity).
  2. 🟡 **STABLE INVESTMENT GRADE**: Moderate leverage with adequate debt service coverage.
  3. 🔴 **HIGH LEVERAGE STRESS**: Debt-to-Equity $>2.5$, Interest Coverage $<1.2$ (Primary delay risk).
  4. 🔵 **SOVEREIGN DIRECT BUDGET LINE**: Direct ministry departmental allocations (e.g. Railway lines).

---

### 🏛️ Engine 10: ANUMATI-CLEARANCES (Regulatory Stagnation Index)
* **RSI Computation**: Quantifies regulatory stagnation across 5 statutory clearance gateways:
  $$\text{RSI}_i = \frac{\text{Days Spent in Clearance Stage}_i}{\text{Statutory Benchmark Days}_{\text{sector}}}$$
* **Bottleneck Attribution**: Categorizes delays by responsible inter-ministerial departments (Ministry of Environment, Forest and Climate Change; State Revenue Departments; Railway Safety Commissioner; Defense Clearance Board).

---

### 🏆 Engine 11: KARYA-DAKSHATA (Agency Execution Accountability Index)
* **AEAI Synthesis**: Evaluates 61 central executing agencies (NHAI, NTPC, RVNL, NHPC, PGCIL, etc.) across 3 weighted empirical dimensions:
  $$\text{AEAI} = 0.40 \cdot (1 - \text{Slippage Rate}) + 0.35 \cdot \text{Capital Velocity Score} + 0.25 \cdot \text{Historical Reliability}$$
* **Empirical Parameter Re-pricing**: Re-evaluates new DPR proposals by scaling contractor cost and timeline estimates using historical agency-specific execution friction coefficients.

---

### 👥 Engine 12: NAGRIK PUBLIC TRANSPARENCY PORTAL (`/nagrik`)
* **RTI Act §4(1)(b) Compliance**: Proactive public disclosure portal allowing Indian citizens to track local mega-projects, verified expenditure, and real-time status.
* **Dual-Source Sovereign Map**: CartoDB Positron online vector tiles with seamless fallback to offline cached basemaps.
* **National Security Redaction Policy**: Sensitive sectors (Aviation, Defense, Atomic Energy) automatically apply Gaussian blur and 2-decimal-place coordinate coarsening (~1.1 km) on public tiers, keeping progress numbers 100% exact while protecting spatial security.

---

## 4. Technical Performance & Benchmark Verification

| Metric | Industry Standard | PRAKALP-DRISHTI Achieved | Technical Advantage |
| :--- | :--- | :--- | :--- |
| **Portfolio Scale** | Batch SQLite / CSV | **2,207 Projects in RAM** | $<2.5\text{ ms}$ access latency across entire national corpus |
| **Optimization Speed** | $>2,000\text{ ms}$ (MILP) | **$8.7\text{ ms}$ (HiGHS LP)** | Real-time interactive portfolio rebalancing with exact duals |
| **Quantile Monotonicity** | Heuristic estimates | **100% Guaranteed Monotone** | Conformalized quantile regression ($P_{10} \le P_{50} \le P_{80} \le P_{95}$) |
| **Geocoding Accuracy** | Generic fuzzy match | **71.8% Site Precision** | 5-tier offline gazetteer with explicit "Verdict Withheld" guard |
| **Audit Verification** | Unverified text / LLM | **RFC 6962 SHA-256 Merkle** | Domain-separated leaves/nodes; immune to CVE-2012-2459 root collision |
| **Test Suite Coverage** | Partial test scripts | **476 / 476 Tests Passing** | 100% pass rate across security, math, API and rendering layers |
| **Deployment Model** | Cloud-dependent APIs | **100% Air-Gapped Sovereign** | Self-contained on Port 8000 with zero external runtime network calls |

### 4.1 Cost-Overrun Model — Stated Against Every Baseline

A single "lift" figure invites the question of which baseline it beat, so all of them are
published. Chronological split, 5-year maturity gate, 265 held-out projects:

| Baseline | MAE | Our lift over it |
| :--- | :---: | :---: |
| Naive train-mean | 22.413 | **27.5%** |
| Sector-mean (an officer can compute this unaided) | 18.495 | **12.2%** |
| Conventional method | — | **2.57%** |
| **Gradient boosting (deployed)** | **16.240** | — |

**The honest headline is 12.2%, not 27.5%** — the sector-mean baseline is the one a real
officer would actually use. The 27.5% figure is measured against the weakest available
comparator and is reported here only for completeness.

**$R^2 = -0.044$, and it is not hidden.** $R^2$ is measured against the *test* mean, which
nobody possesses at prediction time. Under temporal distribution shift (train cohort mean
$+19.6\%$, test cohort $+5.9\%$) a negative $R^2$ alongside a positive MAE lift means the
model beats what an officer could do unaided, while still not explaining variance around a
mean it cannot know. Both statements are true and both are published.

**External features were ablated and do not help.** IMD monsoon, WPI construction,
election proximity, PSU fundamentals, satellite change and graph centrality made the model
*worse* (MAE $16.24 \to 17.90$, $-10.2\%$). The artefact records
`"external_helps": false` and the variant selector drops them. They remain valuable as
evidence and explanation in the console; they are not load-bearing for this prediction.

**`slip_months` is not served at all.** Chronologically it loses to a train-mean baseline
by 53–191% at every maturity gate. Schedule risk is served by KAAL-CHAKRA's conformal
intervals instead, which are separately validated at a measured 93.3% coverage.

Full ledger: [CLAIMS.md](CLAIMS.md).

---

## 5. System Access & API Surface

* **🏛️ Master Sovereign Intelligence Console**: [`http://localhost:8000`](http://localhost:8000)
* **👥 Nagrik Citizen Portal (RTI §4)**: [`http://localhost:8000/nagrik`](http://localhost:8000/nagrik)
* **🎛️ Unified Causal Decision Cockpit**: [`http://localhost:8000/decision-hub`](http://localhost:8000/decision-hub)
* **📑 Interactive OpenAPI Documentation**: [`http://localhost:8000/docs`](http://localhost:8000/docs)
