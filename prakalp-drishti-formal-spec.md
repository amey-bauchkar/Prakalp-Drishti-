# Prakalp Drishti — Formal Mathematical & Algorithmic Specification

**Version 1.0 · SIH 2026 (SIH26103 / PAIMANA, MoSPI) · Implementation reference**

> **STATUS — read before quoting this document.** This is the original *design*
> specification. Where it diverges from what is built, [CLAIMS.md](CLAIMS.md) and the
> engine docstrings are authoritative. The material divergence: VITTA-VYUHA was
> specified as a MILP with binary fund/defer indicators, and is **implemented as a pure
> continuous LP** (`integrality` all-zero), because capital tranches are genuinely
> divisible. That choice is not a downgrade — an LP has valid dual variables and a MILP
> does not, so the shadow prices this system publishes are meaningful *because* the
> formulation is continuous. Sections below that reason about binaries, MIP gaps or
> SOS2 support describe the specified design, not the running code.

Notation convention: $\mathbb{1}\{\cdot\}$ is the indicator function; $(z)^+ = \max(0,z)$; $\hat{\cdot}$ denotes an estimator. All monetary quantities are in ₹ Crore, deflated to a fixed base year unless stated otherwise.

---

# 1. VITTA VYUHA — Two-Stage Stochastic LP with CVaR₉₀

*(Specified as a MILP; implemented as a continuous LP — see the status note above.)*

## 1.1 Sets and indices

| Symbol | Meaning |
|---|---|
| $i \in \mathcal{I}$ | Projects, $\lvert\mathcal{I}\rvert = 2207$ |
| $t \in \mathcal{T} = \{1,\dots,T\}$ | Fiscal periods (quarters), respecting FY boundaries |
| $s \in \mathcal{S}$ | Scenarios, with probability $p_s$, $\sum_s p_s = 1$ |
| $a \in \mathcal{A}$ | Executing agencies / contractors; $\mathcal{I}_a \subseteq \mathcal{I}$ |
| $r \in \mathcal{R}$ | States / regions; $\mathcal{I}_r$; $\mathcal{I}_{\text{NER}}$ for North Eastern Region |
| $m \in \mathcal{M}$ | Ministries / Demands for Grants; $\mathcal{I}_m$ |
| $k \in \{1,\dots,K_i\}$ | Breakpoint index of project $i$'s piecewise-linear yield curve |

## 1.2 Decision variables

**First stage (here-and-now, scenario-independent).** These are the allocations actually committed by the Cabinet before uncertainty resolves.

$$
x_{i,t} \in \mathbb{R}_{\ge 0}, \qquad
y_i \in \{0,1\}, \qquad
z_i \in \{0,1\}, \qquad
\lambda_{i,k} \in \mathbb{R}_{\ge 0}
$$

- $x_{i,t}$ — capital released to project $i$ in period $t$; $X_i \equiv \sum_t x_{i,t}$
- $y_i$ — funding gate (project receives a tranche this cycle)
- $z_i$ — placed on accelerated track (unlocks a steeper yield curve at higher unit cost)
- $\lambda_{i,k}$ — SOS2 convex-combination weights

**Second stage (recourse, scenario-dependent).**

$$
w_{i,s} \in \mathbb{R}_{\ge 0}, \qquad u_{i,s} \in \mathbb{R}_{\ge 0}, \qquad \zeta_s \in \mathbb{R}_{\ge 0}, \qquad \eta \in \mathbb{R}
$$

- $w_{i,s}$ — emergency top-up under scenario $s$ (charged at penalty rate $\rho^w > 1$ reflecting mid-year supplementary-grant friction)
- $u_{i,s}$ — unmet requirement (shortfall)
- $\eta$ — Value-at-Risk level (Rockafellar–Uryasev auxiliary)
- $\zeta_s$ — CVaR excess-loss variable

Non-anticipativity is enforced **structurally**: $x, y, z, \lambda$ carry no $s$ index, so a single first-stage plan must serve all scenarios.

## 1.3 Piecewise-linear yield curves (SOS2)

Let $\phi_i : \mathbb{R}_{\ge 0} \to [0,1]$ be the *incremental* completion-probability gain of project $i$ as a function of total allocation $X_i$, measured against the do-nothing baseline. Discretise with $K_i$ breakpoints $\{(\beta_{i,k},\,\phi_{i,k})\}$, ordered $\beta_{i,1}=0 < \beta_{i,2} < \dots < \beta_{i,K_i}$ and $\phi_{i,1}=0$.

$$
\sum_{k=1}^{K_i} \lambda_{i,k} = y_i
\tag{S1}
$$
$$
X_i \;=\; \sum_{k=1}^{K_i} \lambda_{i,k}\,\beta_{i,k}
\tag{S2}
$$
$$
\Phi_i \;=\; \sum_{k=1}^{K_i} \lambda_{i,k}\,\phi_{i,k}
\tag{S3}
$$
$$
\{\lambda_{i,1},\dots,\lambda_{i,K_i}\} \ \text{is SOS2 (at most two nonzero, and adjacent)}
\tag{S4}
$$

When $y_i = 0$, (S1) forces all $\lambda_{i,k}=0$, hence $X_i = \Phi_i = 0$ — the gate is exact, no big-M leakage.

**Why SOS2 is genuinely required here.** If $\phi_i$ were globally concave, the convex-hull relaxation would select the upper envelope automatically and SOS2 would be redundant. It is *not* globally concave: below a **minimum viable tranche** $\underline{x}_i$ (mobilisation, plant, advance to contractor) marginal returns are near zero, producing a convex toe, after which returns are concave and saturating. The curve is therefore S-shaped, and SOS2 is the correct construct. State this explicitly if challenged — it is a common judging probe.

**Curve construction.** Fit $\phi_i$ from KAAL CHAKRA by re-evaluating the survival model under counterfactual funding-driven hazard multipliers, then isotonically smooth. Set $K_i \in [5,8]$; more breakpoints buy little and cost branch-and-bound time.

## 1.4 Loss function and linearised systemic term

SETU GRAPH supplies, per scenario cluster $s$, a first-order sensitivity of expected systemic locked value to project $i$'s completion probability — which is exactly the Shapley criticality of §3.5:

$$
\gamma_{i,s} \;=\; -\,\frac{\partial\, V^{\text{lock}}_s}{\partial \Phi_i} \;=\; \varphi_i^{(s)} \qquad (\text{₹ Cr-months averted per unit probability})
$$

so that, to first order,

$$
V^{\text{lock}}_s(\Phi) \;=\; V^0_s \;-\; \sum_{i\in\mathcal{I}} \gamma_{i,s}\,\Phi_i .
\tag{1}
$$

Let $c_i$ be project $i$'s sanctioned capital (the value unlocked on completion) and $\theta_{i,s} \in [0,1]$ the scenario-specific realisation coefficient drawn from KAAL CHAKRA (e.g. monsoon-severity attenuation). The **scenario loss** is

$$
\boxed{\;
L_s \;=\; V^0_s \;-\; \sum_{i} \big(\gamma_{i,s} + \theta_{i,s}\,c_i\big)\,\Phi_i \;+\; \rho^u\!\sum_i u_{i,s} \;+\; \rho^w\!\sum_i w_{i,s}
\;}
\tag{2}
$$

$V^0_s$ is a constant per scenario; retain it for reporting, it does not affect the argmin.

## 1.5 CVaR via Rockafellar–Uryasev

For confidence level $\alpha = 0.90$,

$$
\mathrm{CVaR}_\alpha(L) \;=\; \min_{\eta\in\mathbb{R}}\left\{\, \eta \;+\; \frac{1}{1-\alpha}\,\mathbb{E}\big[(L-\eta)^+\big] \right\}
$$

which linearises exactly under a finite scenario set:

$$
\zeta_s \;\ge\; L_s - \eta, \qquad \zeta_s \ge 0 \qquad \forall s
\tag{C-CVaR}
$$
$$
\mathrm{CVaR}_{0.90}(L) \;=\; \eta \;+\; \frac{1}{1-0.90}\sum_s p_s\,\zeta_s \;=\; \eta + 10\sum_s p_s \zeta_s .
$$

Because the outer minimisation over $\eta$ is embedded in the same minimisation as the allocation, no nested loop is needed — this is the key property that makes CVaR tractable inside a single linear program.

## 1.6 Objective

A mean–CVaR blend with risk-aversion dial $\kappa \in [0,1]$ (expose this as a second demo slider beside the budget shock):

$$
\boxed{\;
\min_{x,y,z,\lambda,\eta,\zeta,w,u}\quad
(1-\kappa)\sum_{s} p_s L_s
\;+\;
\kappa\left[\eta + \frac{1}{1-\alpha}\sum_s p_s \zeta_s\right]
\;}
\tag{OBJ}
$$

$\kappa=0$ recovers risk-neutral expected-value optimisation; $\kappa=1$ is pure tail optimisation. Demonstrating the allocation *change* as $\kappa$ moves is the cleanest possible illustration of what stochastic optimisation buys you.

## 1.7 Constraints

**(C1) Period and total budget**
$$
\sum_{i} x_{i,t} \;\le\; B_t \quad \forall t, \qquad \sum_{i,t} x_{i,t} \;\le\; B
$$

**(C2) Ministry / Demand-for-Grant ring-fencing** — capital is *not* freely fungible across Demands
$$
\underline{B}_m \;\le\; \sum_{i\in\mathcal{I}_m}\sum_t x_{i,t} \;\le\; \overline{B}_m \quad \forall m\in\mathcal{M}
$$

**(C3) Statutory North Eastern Region floor (10 %)**
$$
\sum_{i\in\mathcal{I}_{\text{NER}}}\sum_t x_{i,t} \;\ge\; 0.10 \sum_{i\in\mathcal{I}}\sum_t x_{i,t}
$$

**(C4) Agency absorptive-capacity ceiling** — $\bar b_a$ = historical mean quarterly expenditure of agency $a$, $\mu_a \approx 1.25$ the credible stretch multiple
$$
\sum_{i\in\mathcal{I}_a} x_{i,t} \;\le\; \mu_a\,\bar b_a \quad \forall a, \forall t
$$

**(C5) Minimum viable tranche**
$$
\underline{x}_i\, y_i \;\le\; X_i \;\le\; \overline{x}_i\, y_i \quad \forall i
$$

**(C6) Project-level per-period absorption**
$$
x_{i,t} \;\le\; \kappa^{\max}_{i,t} \quad \forall i,t
$$

**(C7) Fiscal-year lapse** — for FY boundary set $\mathcal{T}_{\text{FY}} \subset \mathcal{T}$, no carry-over
$$
\sum_{t \in \text{FY}(f)} \sum_i x_{i,t} \;=\; B^{\text{FY}}_f \quad \forall f
$$
(unspent balance lapses to the Consolidated Fund; model as equality, not inequality)

**(C8) Regional max-regret / equity floor** — no state's portfolio falls more than $\delta$ below its previous cycle allocation
$$
\sum_{i\in\mathcal{I}_r}\sum_t x_{i,t} \;\ge\; (1-\delta)\,A^{\text{prev}}_r \quad \forall r\in\mathcal{R}
$$

**(C9) Allocation churn / plan stability** — linearised $\ell_1$ deviation
$$
X_i - X_i^{\text{prev}} = d_i^+ - d_i^-, \quad d_i^\pm \ge 0, \qquad \sum_i (d_i^+ + d_i^-) \;\le\; \Delta
$$

**(C10) Dependency coupling from SETU GRAPH** — do not accelerate a downstream node without its anchor feeder
$$
z_j \;\le\; z_i \qquad \forall (i \to j) \in E_{\text{anchor}}
$$

**(C11) Recourse balance**
$$
\Phi_i + \tfrac{w_{i,s}}{\overline{x}_i} + u_{i,s} \;\ge\; \Phi^{\text{req}}_{i,s} \quad \forall i,s
$$

**(C12)** SOS2 block (S1)–(S4), and **(C-CVaR)**.

## 1.8 Scenario generation and reduction

1. Draw $M = 10{,}000$ joint paths from the KAAL CHAKRA posterior + SETU GRAPH copula (§3.3). Each path yields $(\theta_{i,\cdot}, \gamma_{i,\cdot}, V^0_\cdot)$.
2. Reduce to $\lvert\mathcal{S}\rvert \in [200, 500]$ by **fast-forward selection** minimising the Kantorovich (Wasserstein-1) distance between the empirical measure and the reduced measure; assign $p_s$ = mass of the absorbed cluster.
3. Validate reduction quality by re-solving on a fresh reduction and reporting objective drift (should be < 1 %).

Scenario count is the dominant driver of solve time: the LP relaxation has $O(\lvert\mathcal{S}\rvert \cdot \lvert\mathcal{I}\rvert)$ second-stage variables. 300 scenarios × 2207 projects is comfortably within HiGHS's range for sub-2 s re-solves *given warm starts*.

## 1.9 Dual / shadow-price derivation

**MILPs have no valid duals.** That fact drove the implementation decision, and it is
worth stating plainly because it signals rigour:

**As implemented (what actually runs).** The formulation is a pure continuous LP, so the
dual vector $\pi$ is valid directly from the single HiGHS solve. No fix-and-re-solve step
is required, and none is performed.

**Had it been a MILP (the specified design, retained for reference).** Duals would have to
be recovered indirectly:

1. Solve (OBJ) to optimality (or to a stated MIP gap), obtaining $(\hat y, \hat z, \hat\lambda)$.
2. **Fix** all binaries at $\hat y, \hat z$ and fix the SOS2 *support* (which adjacent pair is active per project) at the incumbent. The residual problem is a pure LP.
3. Re-solve the LP; extract the dual vector $\pi$.

Reported shadow prices:

| Dual | Interpretation for the Cabinet |
|---|---|
| $\pi_{\text{C1},t}$ | Marginal risk-adjusted yield per additional ₹ 1 Cr of budget in period $t$ — identifies *when*, not just how much, money is worth most |
| $\pi_{\text{C3}}$ | Opportunity cost of the statutory NER floor, in yield units. Report it; do not hide it. Pair it with the equity rationale. |
| $\pi_{\text{C4},a}$ | Value of relaxing agency $a$'s absorption ceiling → a ranked **capacity-building target list**, which is a policy recommendation no other module produces |
| $\pi_{\text{C2},m}$ | Value of an inter-Demand reappropriation — quantifies the cost of budgetary rigidity |

**Validity caveat (state it in the demo).** These duals are valid only over the range in which the optimal basis does not change. Therefore also compute, by parametric re-solve:

- **RHS ranging interval** $[b^-_j, b^+_j]$ over which $\pi_j$ remains constant. The claim "₹100 Cr more buys 3.1 expected completions" is only honest if $100 \in [b^-, b^+]$ — display the interval alongside the number.
- **Stability radius**: the largest budget perturbation preserving the optimal basis.

## 1.10 Warm-started re-solve (the budget shock slider)

On a slider move $B \to B'$:

1. Warm-start the LP relaxation from the previous optimal basis (dual simplex is the right choice for an RHS change — the basis stays dual-feasible).
2. Supply the previous incumbent as a MIP start; retain the previous cutting planes.
3. Terminate at a MIP gap of 0.5 % with a hard 1.8 s wall-clock cap; if the cap is hit, display the incumbent **with its gap shown**. Never display a solution as optimal when it is not.
4. Apply the churn constraint (C9) against the *previous slider position*, not the previous quarter, so the plan evolves smoothly as the user drags rather than jumping between degenerate optima. This single detail is what makes the slider feel authoritative rather than arbitrary.

---

# 2. KAAL CHAKRA — Calibration & Backtest Protocol

## 2.1 Bitemporal data discipline (prerequisite)

MoSPI flash reports are **retrospectively revised**. A backtest that reads today's values as of a 2023 origin leaks the future and will produce fraudulently good results.

Every record must carry two timestamps: **valid time** (when the fact was true of the world) and **transaction time** (when it entered the database). All feature construction at origin $t_0$ must filter `transaction_time ≤ t₀`. If you cannot reconstruct archived monthly flash reports, say so explicitly and bound the resulting optimism — an honest bound beats a silent leak.

## 2.2 Rolling-origin temporal split

Define origins $t_0 \in \{\text{2022-12-31},\ \text{2023-06-30},\ \text{2023-12-31},\ \text{2024-06-30}\}$ and horizons $h \in \{6, 12, 24\}$ months.

For each $(t_0, h)$:

- **Train** on all projects with information available at $t_0$, using only $\le t_0$ transaction time.
- **Evaluate** on outcomes observed in $(t_0,\, t_0+h]$.
- Never use a random split. Never use $k$-fold CV on the project axis alone — it leaks calendar-time regime information.

Report results per origin and pooled. Divergence across origins is itself a finding (regime instability).

## 2.3 Prediction object

For project $i$ at origin $t_0$, the model emits the predictive distribution of remaining duration $T_i$ under **competing risks**:

$$
\hat F^{(1)}_i(t) = \Pr(T_i \le t,\ \text{cause} = \text{completion}) \quad\text{(cumulative incidence)}
$$
$$
\hat F^{(2)}_i(t) = \Pr(T_i \le t,\ \text{cause} \in \{\text{foreclosed, descoped, no-fixed-date}\})
$$

with $\hat F^{(1)}_i(\infty) + \hat F^{(2)}_i(\infty) \le 1$. Quantiles $\hat q_{i,\tau}$ are taken from $\hat F^{(1)}$ *conditioned on eventual completion*, and the unconditional completion probability $\hat\pi_i = \hat F^{(1)}_i(\infty)$ is reported separately. Conflating these two is the single most common error in survival-based project forecasting.

## 2.4 Pinball (quantile) loss with censoring correction

For quantile level $\tau$ and observed duration $T_i$:

$$
\mathcal{L}_\tau(\hat q_{i,\tau}, T_i) \;=\;
\begin{cases}
\tau\,(T_i - \hat q_{i,\tau}), & T_i \ge \hat q_{i,\tau}\\[2pt]
(1-\tau)\,(\hat q_{i,\tau} - T_i), & T_i < \hat q_{i,\tau}
\end{cases}
$$

Under right-censoring, the naive average is biased. Use **inverse probability of censoring weighting (IPCW)** with $\hat G$ the Kaplan–Meier estimate of the censoring distribution:

$$
\boxed{\;
\overline{\mathcal{L}}_\tau \;=\; \frac{1}{N}\sum_{i=1}^{N} \frac{\delta_i}{\hat G(T_i)}\;\mathcal{L}_\tau(\hat q_{i,\tau}, T_i)
\;}
$$

where $\delta_i = 1$ if the event is observed. Report $\overline{\mathcal{L}}_\tau$ for $\tau \in \{0.10, 0.50, 0.80, 0.95\}$ and the mean across $\tau$.

## 2.5 CRPS and Integrated Brier Score

CRPS is the proper scoring rule for the whole distribution:

$$
\mathrm{CRPS}(\hat F_i, T_i) \;=\; \int_0^\infty \big(\hat F_i(t) - \mathbb{1}\{t \ge T_i\}\big)^2\,dt
$$

Useful identity to quote: $\mathrm{CRPS} = 2\int_0^1 \mathcal{L}_\tau\, d\tau$ — CRPS *is* the integrated pinball loss, so the two metrics are coherent rather than redundant.

Under censoring, prefer the IPCW **Brier score** at horizon $t$ and its integral:

$$
\mathrm{BS}(t) = \frac{1}{N}\sum_i \left[
\frac{\hat S_i(t)^2\,\mathbb{1}\{T_i \le t,\ \delta_i = 1\}}{\hat G(T_i)}
\;+\;
\frac{\big(1-\hat S_i(t)\big)^2\,\mathbb{1}\{T_i > t\}}{\hat G(t)}
\right]
$$
$$
\mathrm{IBS} = \frac{1}{t_{\max}}\int_0^{t_{\max}} \mathrm{BS}(t)\,dt
$$

## 2.6 Probability Integral Transform (PIT)

For an uncensored observation, $\mathrm{PIT}_i = \hat F_i(T_i)$. Under perfect calibration $\mathrm{PIT} \sim \mathrm{Uniform}(0,1)$.

**Censored observations.** If $i$ is censored at $C_i$, the PIT is only known to lie in $[\hat F_i(C_i),\, 1]$. Use the **randomised PIT**:

$$
\mathrm{PIT}_i \;\sim\; \mathrm{Uniform}\big(\hat F_i(C_i),\ 1\big)
$$

Repeat the randomisation $R = 200$ times and report the mean histogram with a band — this is the statistically correct handling and almost nobody does it.

**Diagnosis from the histogram shape:**

| Shape | Meaning | Fix |
|---|---|---|
| U-shaped | Under-dispersed — intervals too narrow, **overconfident** | Widen; add hierarchical variance or conformal adjustment |
| Hump / dome | Over-dispersed — intervals too wide, uninformative | Add covariates; reduce pooling |
| Left-skewed | Systematically forecasting too long (pessimistic) | Recalibrate location |
| Right-skewed | Systematically forecasting too short (**optimism bias survived**) | Increase RCF uplift |

Test uniformity with **Anderson–Darling** (more sensitive in the tails than Kolmogorov–Smirnov, and the tails are what you care about). Report the AD statistic and $p$-value.

## 2.7 Coverage and reliability

Empirical coverage at nominal level $\tau$:

$$
\hat c_\tau \;=\; \frac{\sum_i \frac{\delta_i}{\hat G(T_i)}\,\mathbb{1}\{T_i \le \hat q_{i,\tau}\}}{\sum_i \frac{\delta_i}{\hat G(T_i)}}
$$

Plot $\hat c_\tau$ against $\tau$ over a fine grid — the **reliability diagram**; ideal is the 45° line. Report:

- Maximum calibration deviation $\max_\tau \lvert \hat c_\tau - \tau\rvert$
- Bootstrap 95 % band (project-level resampling, $B = 1000$)
- The headline sentence: *"nominal P80 achieved $\hat c_{0.80}$ empirical coverage on held-out 2024–26 outcomes"*

## 2.8 Benchmark-probability calibration (your specific claim)

You claim to output "probability of meeting the official target date." Validate it directly as a binary probabilistic forecast. Bin projects into $B=10$ equal-mass bins by predicted $\hat\pi_i$:

$$
\mathrm{ECE} \;=\; \sum_{b=1}^{B} \frac{n_b}{N}\,\big\lvert\, \bar p_b - \bar o_b \,\big\rvert,
\qquad
\mathrm{MCE} = \max_b \lvert \bar p_b - \bar o_b\rvert
$$

with $\bar p_b$ the mean predicted probability and $\bar o_b$ the observed frequency in bin $b$. Also report the **Brier skill score** against the base rate. An ECE below 0.05 is a strong, quotable result.

## 2.9 Discrimination

- **Uno's C-index** (censoring-robust; preferred over Harrell's C, which is dependent on the censoring distribution). Report both and note the difference.
- **Time-dependent AUC** $\mathrm{AUC}(t)$ at $t \in \{6,12,24\}$ months.

Calibration and discrimination are orthogonal — a model can be perfectly calibrated and useless (predict the base rate for everyone). Report both or the evaluation is incomplete.

## 2.10 Baselines (mandatory for credibility)

| Baseline | Why include |
|---|---|
| B0: Official target date as a point forecast | This is the incumbent system. Beating it is the entire value proposition. |
| B1: Sector-mean historical uplift (naive RCF) | Isolates the value of your covariates over crude reference-class averaging |
| B2: Marginal Kaplan–Meier | Isolates the value of *any* conditioning |
| B3: Plain Cox PH, no competing risks, no hierarchy | Isolates the value of your specific enhancements |

Report the **skill score** $\mathrm{SS} = 1 - \mathcal{L}_{\text{model}} / \mathcal{L}_{\text{baseline}}$ for each. The B0 comparison is the demo slide.

## 2.11 Model diagnostics

- **Schoenfeld residuals** — per-covariate and global test of the proportional-hazards assumption. If $p < 0.05$ (it will be, for terrain and clearance covariates), you must either stratify, add a time-varying coefficient $\beta(t) = \beta_0 + \beta_1\log t$, or switch to AFT. Show the failing test and your fix; it converts a vulnerability into a credential.
- **Subgroup calibration** — recompute ECE and coverage separately by sector, cost band, terrain, and state. Aggregate calibration routinely conceals severe subgroup failure, and a MoSPI reviewer will ask about a specific sector.
- **Sensitivity to MNAR missingness** — re-fit under a pessimistic imputation (projects with long reporting silences assigned the 75th-percentile hazard) and report how far the headline metrics move.

## 2.12 Recalibration layer

If the PIT test fails, do not retrain blindly. Apply a post-hoc calibration map fitted on a held-out calibration fold disjoint from both train and test:

- **Isotonic regression** on $\hat\pi$ for the binary benchmark probability.
- **Conformalized Quantile Regression (CQR)** for the duration quantiles. On calibration set $\mathcal{C}$, compute conformity scores $E_i = \max\{\hat q_{i,\tau_{lo}} - T_i,\; T_i - \hat q_{i,\tau_{hi}}\}$, take $Q_{1-\alpha}(E)$ as the empirical $\lceil (1-\alpha)(\lvert\mathcal{C}\rvert+1)\rceil$-th order statistic, and widen the interval to $[\hat q_{\tau_{lo}} - Q_{1-\alpha},\ \hat q_{\tau_{hi}} + Q_{1-\alpha}]$.

This yields **finite-sample marginal coverage $\ge 1-\alpha$ under exchangeability alone** — a distribution-free guarantee that is by some distance the strongest formal statement available to you. Note honestly that exchangeability is violated across regime breaks (COVID, 2022 commodity spike), and that this motivates the rolling-origin design.

## 2.13 Production drift monitoring

Rolling 12-month window: recompute the PIT Anderson–Darling statistic monthly; alert when it exceeds its backtest 99th percentile. Track $\hat c_{0.80}$ with a control chart; alert outside $[0.74, 0.86]$. Log every alert into the PRAGATI SAARTHI provenance store so briefs can carry a model-health badge.

---

# 3. SETU GRAPH — Max-Plus Monte Carlo Cascade & Shapley Criticality

## 3.1 Graph construction and SCC condensation

Let $G = (N, E)$ with nodes = project milestones and typed, weighted edges

$$
e = (i \to j,\ \text{type},\ \ell_{ij},\ \omega_{ij}), \qquad
\text{type} \in \{\texttt{statutory},\ \texttt{contractual},\ \texttt{physical-network},\ \texttt{spatial-inferred}\}
$$

with lag $\ell_{ij} \ge 0$ and confidence weight $\omega_{ij} \in (0,1]$. Only edges with $\omega_{ij} \ge \omega_{\min}$ enter the cascade; expose $\omega_{\min}$ as a demo control.

**Spatial edge kernel** (replacing the isotropic 50 km buffer). For a sector-pair $(\sigma_i,\sigma_j)$ with characteristic radius $d_{\sigma_i\sigma_j}$:

$$
\omega^{\text{spatial}}_{ij} \;=\; \exp\!\left(-\frac{d^{\text{net}}(i,j)}{d_{\sigma_i \sigma_j}}\right)\cdot \mathbb{1}\{\text{sector pair is physically plausible}\}
$$

where $d^{\text{net}}$ is **network distance** along road/rail geometry (not Euclidean), and for linear corridors $d^{\text{net}}$ is measured to the nearest point on the polyline, not to a centroid. Calibrate $d_{\sigma\sigma'}$ per sector pair (cement catchment $\sim$250 km; aggregate haul $\sim$50 km; transmission dependency: topological, $\omega = 1$ regardless of distance).

**Cycles.** Real infrastructure networks contain cycles (coal → thermal → grid → mine electrification). Compute strongly connected components via Tarjan's algorithm, $O(\lvert N\rvert + \lvert E\rvert)$, and form the **condensation** $G^\ast = (N^\ast, E^\ast)$, which is a DAG by construction. Each super-node's internal duration is resolved by fixed-point iteration on the max-plus recursion restricted to the SCC. This makes the DAG claim *true* rather than fragile.

## 3.2 Max-plus forward and backward passes

In the max-plus semiring $(\mathbb{R}\cup\{-\infty\},\ \oplus = \max,\ \otimes = +)$, the schedule recursion is linear. **Forward pass** in topological order of $G^\ast$:

$$
\mathrm{ES}_j = \max_{i \in \mathrm{pred}(j)} \big(\mathrm{EF}_i + \ell_{ij}\big),
\qquad
\mathrm{EF}_j = \mathrm{ES}_j + D_j
\tag{3}
$$

Equivalently $\mathbf{x} = (A \otimes \mathbf{x}) \oplus \mathbf{b}$ with solution $\mathbf{x} = A^\ast \otimes \mathbf{b}$, $A^\ast = \bigoplus_{k=0}^{n-1} A^{\otimes k}$ (Kleene star; finite because $G^\ast$ is acyclic).

**Backward pass** from the planned network completion $T^{\text{plan}}$, in reverse topological order:

$$
\mathrm{LF}_j = \min_{k \in \mathrm{succ}(j)}\big(\mathrm{LS}_k - \ell_{jk}\big),
\qquad
\mathrm{LS}_j = \mathrm{LF}_j - D_j
\tag{4}
$$

**Float:**

$$
\mathrm{TF}_j = \mathrm{LS}_j - \mathrm{ES}_j
\qquad\text{(total float)}
$$
$$
\mathrm{FF}_j = \min_{k\in\mathrm{succ}(j)}\big(\mathrm{ES}_k\big) - \mathrm{EF}_j - \ell_{jk}
\qquad\text{(free float)}
$$

## 3.3 Correlated duration sampling (Gaussian copula factor model)

Independent sampling understates systemic tail risk, because two projects in the same monsoon zone under the same contractor are correlated *even with no edge between them*. Impose a factor structure on the latent normals:

$$
v_j \;=\; \sum_{f \in \mathcal{F}} \beta_{jf}\, z_f \;+\; \sqrt{1 - \textstyle\sum_f \beta_{jf}^2}\;\varepsilon_j,
\qquad z_f, \varepsilon_j \stackrel{iid}{\sim} N(0,1)
$$

with factors $\mathcal{F} = \{$monsoon zone, state governance capacity, contractor, commodity price, clearance regime$\}$. Then

$$
\Sigma_{jk} = \sum_f \beta_{jf}\beta_{kf}\ (j \ne k), \qquad \Sigma_{jj}=1
$$
$$
u_j = \Phi(v_j), \qquad D_j = \hat F_j^{-1}(u_j)
$$

where $\hat F_j$ is KAAL CHAKRA's marginal predictive CDF for node $j$. This preserves each project's calibrated marginal (§2) while injecting realistic dependence — the same construction used for systemic risk in financial portfolios, which is a strong and legible analogy for a policy audience.

## 3.4 Monte Carlo cascade and locked value

```
Input:  G* (condensed DAG), marginals F̂_j, factor loadings β, targets τ_j,
        capital c_j, shock set Δ, M = 10,000, common random numbers seed
Output: distribution of locked value {V^(m)}, criticality index, slip quantiles

for m = 1..M:
    z ~ N(0, I_|F|);  ε ~ N(0, I_|N|)
    v_j  ← Σ_f β_jf z_f + sqrt(1 − Σ_f β_jf²) ε_j
    D_j  ← F̂_j⁻¹(Φ(v_j))                        # correlated durations
    apply shock Δ  (e.g. monsoon hazard multiplier on the Jharkhand belt)
    forward pass  (3)  → ES_j, EF_j
    backward pass (4)  → LS_j, LF_j, TF_j, FF_j
    slip_j ← max(0, EF_j^(m) − EF_j^base)        # float absorbed automatically
    record critical-path membership of each j
    V^(m) ← Σ_j c_j · (1 − e^(−ρ·slip_j)) / ρ    # discounted ₹Cr-months locked
report: quantiles of {V^(m)}; criticality_j = (1/M)·#{m : j on critical path}
```

**Locked-value functional.** Two defensible choices; report both:

$$
V^{(m)}_{\text{binary}} = \sum_j c_j\,\mathbb{1}\{\mathrm{EF}^{(m)}_j > \tau_j\}
\qquad\text{(₹ Cr of capital that misses its commissioning target)}
$$
$$
V^{(m)}_{\text{econ}} = \sum_j c_j \cdot \frac{1 - e^{-\rho\,\mathrm{slip}^{(m)}_j}}{\rho}
\qquad\text{(discounted ₹ Cr-months of idle capital; } \rho = \text{social discount rate)}
$$

$V_{\text{econ}}$ is the economically correct unit — it distinguishes a one-month slip from a three-year slip, which the binary form cannot. Headline it, and quote $\hat V_{P50}$ and $\hat V_{P95}$ as empirical quantiles.

**Why Monte Carlo is not optional.** By Jensen's inequality applied to the max operator,

$$
\mathbb{E}\Big[\max_i \big(\mathrm{EF}_i + \ell_{ij}\big)\Big] \;\;\ge\;\; \max_i \mathbb{E}\big[\mathrm{EF}_i + \ell_{ij}\big]
$$

so deterministic PERT-style path arithmetic **systematically understates** completion times at every merge point — the classic merge-event bias, and it worsens with the number of parallel predecessors. Sampling the max is the only correct treatment. This is a two-sentence answer that will land with any engineer on the panel.

**Variance reduction.** Use common random numbers across all counterfactual evaluations (essential for §3.5), antithetic variates on $z$, and stratification on the dominant factor $z_{\text{monsoon}}$.

## 3.5 Shapley systemic criticality

**Characteristic function.** For a coalition $C \subseteq N$ of nodes hypothetically *de-risked* (delivered to schedule), define the expected locked value averted:

$$
v(C) \;=\; \mathbb{E}\big[V \mid \text{no intervention}\big] \;-\; \mathbb{E}\big[V \mid \text{nodes in } C \text{ de-risked}\big],
\qquad v(\emptyset) = 0
$$

**Shapley value.**

$$
\boxed{\;
\varphi_j \;=\; \sum_{C \subseteq N\setminus\{j\}} \frac{\lvert C\rvert!\,\big(n - \lvert C\rvert - 1\big)!}{n!}\Big[v\big(C \cup \{j\}\big) - v(C)\Big]
\;}
\tag{5}
$$

Exact evaluation is $O(2^n)$ — infeasible. Use the **permutation Monte Carlo estimator**: draw $R$ uniformly random permutations $\pi_1,\dots,\pi_R$ of $N$, and

$$
\hat\varphi_j \;=\; \frac{1}{R}\sum_{r=1}^{R}\Big[\, v\big(P^{\pi_r}_j \cup \{j\}\big) - v\big(P^{\pi_r}_j\big)\Big]
$$

where $P^{\pi_r}_j$ is the set of nodes preceding $j$ in $\pi_r$. This is unbiased, with $\mathrm{Var}(\hat\varphi_j) = \sigma_j^2 / R$.

**Making it tractable.**

1. **Pre-screen** to the top $k \approx 150$ candidates by the cheap proxy $\text{outdeg}(j) \times \sum_{j'\in \text{desc}(j)} c_{j'}$; treat the remainder as a single residual player.
2. **Common random numbers** — reuse the same $M$ sampled duration paths for every coalition evaluation. This is the dominant variance reduction and typically cuts $R$ by an order of magnitude.
3. **Truncated MC Shapley** — within a permutation, once the running marginal contribution falls below tolerance $\epsilon$ for several consecutive players, assign zero to the remainder and move on.
4. **Stratified sampling** by coalition size.

**Why Shapley rather than betweenness.** The efficiency axiom gives

$$
\sum_{j\in N}\varphi_j \;=\; v(N) \;=\; \mathbb{E}[V]
$$

— total expected systemic locked value decomposes **exactly and exhaustively** across projects, with no residual and no double counting. That is an audit-grade attribution property. Betweenness centrality has no such property; it measures shortest-path intermediation, a concept imported from information networks that has no interpretation in rupees. Retain betweenness only as a cheap secondary view, clearly labelled as topological rather than economic.

**Handoff to VITTA VYUHA.** Compute $\varphi^{(s)}_j$ per scenario cluster $s$ and set $\gamma_{j,s} := \varphi^{(s)}_j$ in equation (1). This closes the loop: SETU GRAPH's criticality *is* the optimiser's systemic-benefit coefficient, so the two modules are mathematically coupled rather than merely adjacent — which is precisely the synergy claim you want to be able to defend.

---

# 4. PRAGATI SAARTHI — Briefing Schema & SHA-256 Lineage

## 4.1 Three-layer architecture

$$
\textbf{Fact Layer} \;\longrightarrow\; \textbf{Assertion Layer} \;\longrightarrow\; \textbf{Render Layer}
$$

- **Fact Layer** — typed, immutable, provenance-bearing scalar or interval values emitted by SQL/ML. No prose.
- **Assertion Layer** — deterministic templates with typed slots bound to `fact_id`. No free-form numerals permitted; a numeral appearing in template literal text is a **build failure**.
- **Render Layer** — locale-specific PDF/HTML. Formatting only; no computation.

The separation is what makes the "zero hallucination" claim structurally true rather than aspirational. Phrase the claim precisely: **every number is traceable and reproducible**. Note honestly that faithfulness is not the same as non-misleadingness — a template can be perfectly faithful and still mislead by *selection*. Mitigate with the mandatory counter-evidence section (§4.5, block 3).

## 4.2 Fact object schema

```json
{
  "fact_id": "F-KC-000142",
  "value": 0.23,
  "type": "probability",
  "unit": "dimensionless",
  "precision": 2,
  "uncertainty": {
    "family": "beta",
    "p10": 0.17, "p50": 0.23, "p90": 0.31,
    "method": "conformalized_quantile_regression",
    "empirical_coverage_p80": 0.794
  },
  "provenance": {
    "query_sha256":          "9f2c…",
    "query_text":            "SELECT …",
    "query_ast_normalized":  "…",
    "dataset_snapshot_id":   "paimana@2026-08-20T00:00:00Z",
    "dataset_sha256":        "4b81…",
    "source_tables":         ["mospi.flash_report_v3", "imd.rainfall_departure_v2"],
    "row_count":             2207,
    "model": {
      "name": "kaal_chakra",
      "version": "2.4.1",
      "artifact_sha256": "c7de…",
      "training_cutoff": "2026-06-30"
    },
    "computed_at": "2026-08-23T05:12:00Z",
    "computed_by": "svc-pragati@nic.in",
    "health": { "pit_ad_stat": 0.61, "drift_alert": false }
  },
  "i18n": {
    "label": { "en": "benchmark probability", "hi": "निर्धारित तिथि प्राप्ति संभाव्यता" },
    "gender_hi": "f"
  },
  "classification": "RESTRICTED"
}
```

## 4.3 SHA-256 lineage specification

**Canonicalisation first.** Hash **RFC 8785 JCS**-canonicalised JSON (deterministic key ordering, number formatting, and Unicode normalisation). Without canonicalisation, semantically identical objects hash differently and the whole scheme silently fails.

| Level | Definition |
|---|---|
| Query hash | $h_Q = \mathrm{SHA256}(\text{normalised SQL AST})$ — normalise whitespace, aliases, and literal formatting so cosmetic edits do not break lineage, but parameter *values* remain in scope |
| Dataset snapshot | $h_D = \mathrm{SHA256}\big(\,\Vert_{p \in \text{partitions}} \mathrm{SHA256}(p)\,\big)$ over lexicographically sorted partitions (content-addressed; Delta Lake / Apache Iceberg snapshot IDs serve directly) |
| Model artifact | $h_M = \mathrm{SHA256}(\text{serialized weights} \Vert \text{hyperparameters} \Vert \text{feature schema})$ |
| **Bound fact** | $h^{\text{bound}}_f = \mathrm{SHA256}\big(h_Q \Vert h_D \Vert h_M \Vert \mathrm{JCS}(\text{value}) \big)$ |
| **Brief root** | Merkle tree over $\{h^{\text{bound}}_f\}$ sorted by `fact_id`; root $R$. Internal node: $\mathrm{SHA256}(\text{left} \Vert \text{right})$; duplicate the last leaf on odd counts |
| **Document hash** | $h_{\text{doc}} = \mathrm{SHA256}\big(R \Vert \text{template\_version} \Vert \text{locale} \Vert \text{issued\_at} \Vert \text{classification}\big)$ |
| **Signature** | Ed25519 (or RSA-PSS) over $h_{\text{doc}}$, embedded as **PAdES-LTV**; for production, a CCA-licensed Digital Signature Certificate under the IT Act, 2000 |

**Merkle inclusion proof.** For any single fact, the audit drawer can serve an $O(\log n)$ sibling path proving that fact's membership in the signed brief — so a citizen or auditor can verify one number without access to the whole document. This is a genuinely strong property and worth thirty seconds of demo time.

**Verification endpoint.**
```
GET /verify/{h_doc}          → { valid, signer, issued_at, root, drift_since }
GET /verify/{h_doc}/{fact_id} → { value, merkle_path, recomputed, matches }
POST /reproduce              → re-executes h_Q against snapshot h_D with model h_M
```

The `POST /reproduce` route is what converts your lineage token from a *display* feature into an *audit* feature. If the recomputation differs, the response must report the diff rather than the new value — silent correction destroys the audit property.

## 4.4 Template contract and CI lint rules

| Rule | Enforcement |
|---|---|
| R1 | Every numeric slot references a valid `fact_id`; literal numerals in template prose → build failure |
| R2 | Any slot of `type ∈ {probability, date, currency_forecast}` **must** render with its uncertainty interval — bare point estimates are a build failure |
| R3 | Round-trip test: extract text from the rendered PDF, re-parse all numerals, assert exact equality with source fact values |
| R4 | Locale formatting: `en-IN` grouping (₹ 2,20,700 Cr), Hindi लाख/करोड़, optional Devanagari numerals, ISO dates in the appendix |
| R5 | Hindi grammatical agreement resolved from a per-noun gender table (परियोजना is feminine → *विलंबित हुई*, not *हुआ*). Terminology bound to the CSTT / official MoSPI glossary. **Have a native reviewer sign off** — a bilingual claim with broken Hindi is worse than an English-only brief |
| R6 | Staleness: if `computed_at` exceeds the SLA, render a staleness badge; never emit silently |
| R7 | Classification: no fact with `classification > brief.classification` may be rendered; redaction must be at the Fact Layer, not the Render Layer |
| R8 | Model health: if `drift_alert = true` for any contributing model, the brief carries a mandatory header warning |

Demonstrating R1 and R3 **failing in CI** on a deliberately corrupted template is a thirty-second segment that proves the architecture better than any amount of description.

## 4.5 Brief structure — exception-based, not a data dump

The scarce resource is executive attention. Structure the brief around decisions, not data.

1. **Decision Requests** (≤ 5). Each: the decision, 2–3 options, the recommended option, the expected effect with interval, the binding constraint, and the relevant shadow price from §1.9.
2. **Material Changes Since Last Brief.** Delta-driven only; a project whose status is unchanged does not appear.
3. **Systemic Exposure.** Top Shapley-criticality nodes with $\hat V_{P50}$ and $\hat V_{P95}$ locked value, plus a **mandatory counter-evidence subsection** listing the strongest disconfirming signals for the recommendations in block 1. Making this structurally required is what protects against selection bias in a system that cannot hallucinate but can still mislead.
4. **Verification Status.** Satellite concordance / discordance counts with confidence tiers; explicit `LOW — cloud cover` and `NOT-OBSERVABLE — subsurface` states rather than silent gaps.
5. **Appendix.** Full lineage table, Merkle root $R$, document hash $h_{\text{doc}}$, signature, verification URL, model versions, and dataset snapshot IDs.

## 4.6 Governance and deployment notes

- **Human-in-the-loop.** Every VITTA VYUHA plan is advisory. Officer sign-off is required, and any override is captured with a structured reason code in the same provenance store — so the audit trail covers human decisions as well as machine ones.
- **Classification tiers.** A ranked map of national infrastructure chokepoints with capital exposure is a sensitive artifact. Implement RBAC with public / restricted / classified views, and redact at the Fact Layer. Raise this proactively in the demo; it demonstrates that you understand what you have built.
- **Compliance surface to cite:** GIGW 3.0 (accessibility), DPDP Act 2023, IT Act 2000 §3 (digital signatures), NIC MeghRaj deployment, and full offline / air-gapped operation on sovereign edge.

---

## Appendix A — Inter-module coupling summary

| Producer | Artifact | Consumer | Coupling |
|---|---|---|---|
| KAAL CHAKRA | Marginal predictive CDFs $\hat F_j$, competing-risk CIFs | SETU GRAPH | Copula marginals in §3.3 |
| KAAL CHAKRA | Scenario coefficients $\theta_{i,s}$ | VITTA VYUHA | Loss function (2) |
| SETU GRAPH | Shapley criticality $\varphi^{(s)}_j$ | VITTA VYUHA | $\gamma_{i,s}$ in (1) — the systemic-benefit coefficient |
| VITTA VYUHA | Allocation $x_{i,t}$, duals $\pi$ | KAAL CHAKRA | Funding-driven hazard multipliers → next-cycle $\phi_i$ curves (closes the loop) |
| All three | Typed facts with provenance | PRAGATI SAARTHI | Fact Layer, §4.2 |

The loop is closed: allocation changes hazard, hazard changes the graph, the graph changes criticality, criticality changes allocation. State this as a fixed-point and note that you iterate to convergence (or cap at two passes for demo latency) — a coupled system is a far stronger claim than four coexisting modules.
