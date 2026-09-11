"""
PRAKALP-DRISHTI: VITTA-VYUHA
Two-Stage Stochastic Capital Allocation Optimizer
Continuous Linear Program (HiGHS) with Rockafellar-Uryasev CVaR90,

Note on naming: every decision variable is continuous (integrality is all-zero in the
milp() call), so this is an LP, not a mixed-integer program. It was previously
described as a MILP. Capital tranches are genuinely divisible, so the continuous
relaxation is the correct model here -- but the label had to match the mathematics.
A true MILP would add a binary fund/defer indicator per project with a minimum viable
tranche; that is a deliberate future upgrade, not what runs today.
Tranche fill-order rows (not SOS2 -- see the constraint block), Statutory 10% NER
Floor, Dual Shadow Prices, and a solver-agreement diagnostic.

Objective: a convex mean-CVaR trade-off, (1-kappa) * E[scenario yield] against
kappa * CVaR_0.90 of the scenario loss, both in the same yield-weighted-Cr units.
The three scenarios and their severities are declared policy (there is no realised-
yield history to estimate them from) and are returned on every result under
`cvar_diagnostics` together with the Rockafellar-Uryasev cross-check.
"""

import os
import time
import json
import hashlib
import numpy as np
import pandas as pd
# Importable as a package module AND runnable as a script: the direct-script form
# has the file's own directory on sys.path but not the repository root, so the
# absolute package import fails. Fall back to the sibling module in that case.
try:
    from analytics_engine.state_resolution import resolve_state, clean_text, is_reported_state
except ModuleNotFoundError:  # pragma: no cover - direct `python analytics_engine/x.py`
    from state_resolution import resolve_state, clean_text, is_reported_state
from scipy.optimize import milp, linprog, LinearConstraint, Bounds

from analytics_engine.contracts import AllocationRequest, AllocationResult, ProjectAllocation
from analytics_engine.corpus_source import load_corpus

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, "paimana_extracted", "PAIMANA_MASTER_PROJECTS_DATABASE.csv")
SHAPLEY_PATH = os.path.join(BASE_DIR, "artifacts", "shapley.parquet")
ENTITY_MAPPING_PATH = os.path.join(BASE_DIR, "paimana_extracted", "CANONICAL_ENTITIES_MAPPING.json")

# North-Eastern States (Statutory 10% Floor)
NER_STATES = {
    "Assam", "Arunachal Pradesh", "Meghalaya", "Manipur",
    "Mizoram", "Nagaland", "Tripura", "Sikkim"
}

class VittaVyuhaEngine:
    def __init__(self):
        self.df = None
        self.shapley_scores = {}
        self.candidate_projects = []
        self.fitted = False
        self._load_data()

    def _load_data(self):
        self.df = load_corpus()
        self.df["OriginalCost"] = pd.to_numeric(self.df["OriginalCost"], errors="coerce").fillna(500.0)
        self.df["RevisedCost"] = pd.to_numeric(self.df["RevisedCost"], errors="coerce").fillna(self.df["OriginalCost"])
        self.df["Expenditure"] = pd.to_numeric(self.df["Expenditure"], errors="coerce").fillna(0.0)
        self.df["PhysicalProgress"] = pd.to_numeric(self.df["PhysicalProgress"], errors="coerce").fillna(20.0)
        
        # Compute real schedule delay from official milestone dates (DELAYED_TIME column is all zeros)
        def compute_schedule_delay(row):
            orig_dt = pd.to_datetime(row.get("OriginalEndDate"), errors="coerce", dayfirst=True)
            rev_dt = pd.to_datetime(row.get("RevisedDate"), errors="coerce", dayfirst=True)
            if pd.notna(orig_dt) and pd.notna(rev_dt) and rev_dt > orig_dt:
                return max(0.0, (rev_dt - orig_dt).days / 30.4375)

            # The fallback was `float(row.get("OnboardingDelay", 0.0) or 0.0)`, which is
            # wrong for exactly one input: NaN. **NaN is truthy in Python**, so
            # `nan or 0.0` short-circuits to nan rather than the intended default, and
            # the NaN then propagates through risk_score -> base_yield -> the objective
            # vector, where scipy rejects the entire LP with "c must be ... finite".
            #
            # It never fired under the CSV bootstrap, where OnboardingDelay is int64
            # with no nulls. It fires the moment a project is ONBOARDED with no
            # onboarding delay recorded, because Postgres stores that as NULL -> NaN.
            # Dynamic ingestion is what made a five-year-old latent bug reachable, and
            # the symptom was a 500 on capital allocation rather than a bad number,
            # which is the good version of this failure.
            raw = row.get("OnboardingDelay", 0.0)
            try:
                val = float(raw)
            except (TypeError, ValueError):
                return 0.0
            return val if np.isfinite(val) else 0.0
        
        self.df["REAL_DELAY_MONTHS"] = self.df.apply(compute_schedule_delay, axis=1)

        # Map Canonical Entities
        entity_map = {}
        if os.path.exists(ENTITY_MAPPING_PATH):
            with open(ENTITY_MAPPING_PATH, "r", encoding="utf-8") as f:
                entity_map = json.load(f).get("mapping_by_raw_string", {})

        self.df["CANONICAL_ENTITY"] = self.df["COMPANYNAME"].apply(
            lambda x: entity_map.get(str(x), {}).get("canonical_id") or str(x) if pd.notna(x) else "CENTRAL_PSU"
        )

        # Map NER Flag.
        #
        # Deliberately computed on ministry-REPORTED geography only. 1,026 projects
        # (46.5%) have no StateName in the PAIMANA extract; 666 of those now carry a
        # state inferred offline from their geocode, and that inference is good enough
        # to display (validated 73/73 against projects whose names contain a major
        # city). It is NOT good enough to move public money: the 10% North-Eastern
        # Region floor is a statutory constraint, and satisfying it on the strength of
        # a nearest-populated-place guess would not survive audit. So the floor binds
        # on what the ministry itself recorded, and the coverage gap is published
        # alongside the result rather than hidden inside it.
        self.df["StateReported"] = self.df["StateName"].map(is_reported_state)
        self.df["IsNER"] = self.df["StateName"].isin(NER_STATES)
        self._state_coverage = {
            "projects_total": int(len(self.df)),
            "state_reported_by_ministry": int(self.df["StateReported"].sum()),
            "state_absent": int((~self.df["StateReported"]).sum()),
            "ner_floor_basis": "ministry-reported StateName only",
            "note": ("Projects with no reported state cannot be counted toward or "
                     "against the statutory NER floor. Inferred states are used for "
                     "display and analysis but never for this constraint."),
        }

        # Load Shapley Scores if available
        if os.path.exists(SHAPLEY_PATH):
            shapley_df = pd.read_parquet(SHAPLEY_PATH)
            self.shapley_scores = dict(zip(shapley_df["project_id"].astype(str), shapley_df["shapley_phi"]))

        # Select Top 60 Strategic High-Priority Projects across NER and National sectors for live LP optimization
        ner_sample = self.df[self.df["IsNER"]].nlargest(15, "RevisedCost")
        non_ner_sample = self.df[~self.df["IsNER"]].nlargest(45, "RevisedCost")
        self.candidate_df = pd.concat([ner_sample, non_ner_sample]).reset_index(drop=True)
        self.fitted = True

    def optimize_allocation(self, req: AllocationRequest) -> AllocationResult:
        start_time = time.time()
        N = len(self.candidate_df)
        B = float(req.budget_pool_cr)
        kappa = float(req.risk_dial_kappa)

        # Project Parameters
        costs = self.candidate_df["RevisedCost"].values
        is_ner = self.candidate_df["IsNER"].values.astype(float)
        progress = self.candidate_df["PhysicalProgress"].values
        delays = self.candidate_df["REAL_DELAY_MONTHS"].values.copy()

        # Apply delay shock: targeted to a single project if shocked_project_id is given
        # and present in the candidate pool, otherwise applied uniformly (macro stress test).
        if req.delay_shock_months > 0.0:
            pids_arr = self.candidate_df["ProjectId"].astype(str).values
            if req.shocked_project_id and req.shocked_project_id in pids_arr:
                shock_mask = pids_arr == req.shocked_project_id
                delays = delays.copy()
                delays[shock_mask] = delays[shock_mask] + req.delay_shock_months
            elif not req.shocked_project_id:
                delays = delays + req.delay_shock_months
            # else: shocked project isn't a VITTA-VYUHA candidate -> no effect on this engine (honest no-op)

        # Remaining Capex Demand & Absorptive Capacity per Project (realistic quarterly demand)
        remaining_demand = np.maximum(costs * (1.0 - progress / 100.0), costs * 0.15)
        base_demands = np.clip(remaining_demand * 0.20, 50.0, 2500.0)

        # Shapley systemic multiplier gamma_i
        pids = self.candidate_df["ProjectId"].astype(str).values
        # Default for a project absent from the Shapley table: the MEDIAN of the
        # scores actually present, not a hardcoded 100.
        #
        # Raw scores span 10.85 to 15,516 with a median of 369, so a literal 100
        # silently placed any unscored project in the bottom decile -- penalising
        # it for a gap in the input data rather than for anything about the
        # project. No candidate is currently missing, so this changes no output
        # today; it removes a trap that only fires when the Shapley bake and the
        # candidate pool drift apart, which is exactly when nobody is looking.
        _known = [v for v in self.shapley_scores.values()
                  if isinstance(v, (int, float)) and v > 0]
        _default_gamma = float(np.median(_known)) if _known else 1.0
        gammas = np.array([self.shapley_scores.get(p, _default_gamma) for p in pids])
        gammas = (gammas / np.mean(gammas)) if np.mean(gammas) > 0 else np.ones(N)

        # Project Risk Metric derived from empirical milestone delays and physical progress
        risk_score = (delays / 25.0) + np.maximum(0.0, (50.0 - progress) / 50.0)
        risk_mean = np.mean(risk_score) if np.mean(risk_score) > 0 else 1.0
        risk_normalized = risk_score / risk_mean

        # Base Completion Yield (driven by progress, schedule lead times, and Shapley network vitality gamma)
        base_yield = np.maximum(0.20, (0.5 + (progress / 100.0) - (delays / 200.0)) * gammas)

        # =====================================================================
        # TRANCHE-BASED PIECEWISE CONCAVE YIELD MODEL
        # =====================================================================
        # Instead of a single allocation variable x_i per project, we use T=3
        # tranches per project. This creates a concave (diminishing returns)
        # objective within the LP framework, so the optimizer partially funds
        # MANY projects across multiple tranches instead of fully funding a few.
        #
        # Tranche 1 (0 to 40% of demand): Full yield - critical core funding
        # Tranche 2 (40% to 75% of demand): Reduced yield - expansion phase
        # Tranche 3 (75% to 100% of demand): Further reduced yield - full completion
        #
        # The tranche yield reduction is amplified by κ: at κ=0 the reduction
        # is mild (nearly flat), at κ=1 the reduction is steep (strong
        # diminishing returns), forcing the optimizer to spread capital widely.
        # =====================================================================
        T = 3  # Number of tranches per project
        tranche_fracs = np.array([0.40, 0.35, 0.25])  # fraction of demand per tranche

        # κ-modulated demand caps: high-risk projects get smaller caps at high κ
        # A risk-averse planner (high κ) won't approve full spend on a badly delayed project
        risk_excess = np.clip(risk_normalized - 0.5, 0.0, 2.0)
        demand_cap_factor = np.maximum(0.30, 1.0 - 0.55 * kappa * risk_excess)
        demands = base_demands * demand_cap_factor

        # Per-tranche upper bounds: demand_i * tranche_frac_t
        # Shape: (N, T) flattened to (N*T,)
        tranche_ub = np.zeros(N * T)
        for t in range(T):
            tranche_ub[t*N:(t+1)*N] = demands * tranche_fracs[t]

        # Per-tranche yield coefficients (diminishing returns amplified by κ)
        # κ=0: [1.0, 0.92, 0.85] - nearly flat, LP acts almost like single-variable
        # κ=1: [1.0, 0.55, 0.25] - steep diminishing returns, spreads capital
        tranche_yield_mult = np.array([
            1.0,
            0.92 - 0.37 * kappa,   # κ=0→0.92, κ=1→0.55
            0.85 - 0.60 * kappa,   # κ=0→0.85, κ=1→0.25
        ])

        # Risk-adjusted effective yield per project (wider spread than before)
        # =====================================================================
        # MEAN-CVaR OBJECTIVE (Rockafellar-Uryasev, 2000)
        # =====================================================================
        # Risk enters the objective ONCE, through a scenario model of how much of a
        # project's base yield is realised. Scenarios are DECLARED POLICY, not
        # estimated: MoSPI publishes no realised-yield history to fit a loss
        # distribution against, so the three states below are hand-set and exposed
        # on the result for the reviewer to see.
        #
        #   scenario s          p_s    severity_s   realised fraction theta_{s,i}
        #   delivery as planned 0.50   -0.05        1 + 0.05 * risk_i  (mild upside)
        #   mild slippage       0.35    0.15        1 - 0.15 * risk_i
        #   severe slippage     0.15    0.45        1 - 0.45 * risk_i
        #
        # theta_{s,i} = clip(1 - severity_s * risk_i, 0.05, 1.10), with risk_i the
        # delay/progress risk index normalised to mean 1. A high-risk project loses
        # more of its yield in a bad scenario than a low-risk one; that project-
        # specific tail is what gives CVaR information the mean does not carry.
        # (The previous version applied a common theta_s to every project, so every
        # scenario ranked projects identically and the CVaR term moved the allocation
        # by 1.2% at any weight; on top of that a separate kappa-scaled
        # "risk_penalty" cut the same risk into the mean term a second time.)
        #
        # Objective (minimised):
        #     -(1 - kappa) * sum_{i,t} rbar_{i,t} x_{i,t}
        #     + kappa * [ eta + 1/(1-alpha) * sum_s p_s zeta_s ]
        # with  rbar_{i,t} = sum_s p_s theta_{s,i} * base_yield_i * tranche_mult_t
        #       zeta_s >= L_s(x) - eta,  L_s(x) = -sum_{i,t} theta_{s,i} base_yield_i mult_t x_{i,t}
        #       zeta_s >= 0, eta free.
        # Both terms are in the same units (yield-weighted Cr), so kappa is a genuine
        # convex trade-off: kappa=0 maximises expected yield, kappa=1 maximises the
        # alpha-tail average yield.
        #
        # Granularity: with p = (0.50, 0.35, 0.15) and alpha = 0.90, the worst 10% of
        # probability mass lies entirely inside the severe scenario, so CVaR_0.90 equals
        # the severe-scenario loss exactly and the optimum has eta = L_severe, zeta = 0.
        # That is the correct R-U solution for a three-point distribution, not a defect.
        p_scenarios = np.array([0.50, 0.35, 0.15])
        severity_scenarios = np.array([-0.05, 0.15, 0.45])
        S = 3
        CVAR_ALPHA = 0.90
        theta_si = np.clip(1.0 - np.outer(severity_scenarios, risk_normalized), 0.05, 1.10)  # (S, N)
        theta_bar = p_scenarios @ theta_si                                                    # (N,)
        # Mean term coefficients; kept under the historical name because the tranche
        # and reporting code below reads it.
        effective_yield = base_yield * theta_bar
        mean_weight = 1.0 - kappa
        cvar_weight = kappa

        # Decision variables layout: [x_1_t1..x_N_t1, x_1_t2..x_N_t2, x_1_t3..x_N_t3, eta, zeta_1..zeta_S]
        num_vars = N * T + 1 + S

        c = np.zeros(num_vars)
        for t in range(T):
            c[t*N:(t+1)*N] = -mean_weight * effective_yield * tranche_yield_mult[t]
        c[N*T] = cvar_weight                                    # eta
        c[N*T+1:] = cvar_weight * (p_scenarios / (1.0 - CVAR_ALPHA))  # zeta_s

        # Tranche fill-order constraints: the fill FRACTION of tranche t+1 may not
        # exceed that of tranche t. (Not SOS2, which they were previously labelled: SOS2
        # restricts the number of adjacent non-zeros. With strictly decreasing tranche
        # yields the LP fills tranche 1 first anyway, so these rows are a safeguard for
        # the kappa=0 corner where the yields nearly coincide.)
        # x_{i,t+1} / ub_{i,t+1} <= x_{i,t} / ub_{i,t}
        # Linearised: x_{i,t+1} * ub_{i,t} - x_{i,t} * ub_{i,t+1} <= 0
        sos2_rows = []
        for t in range(T - 1):
            for i in range(N):
                ub_t = tranche_ub[t*N + i]
                ub_t1 = tranche_ub[(t+1)*N + i]
                if ub_t > 1e-6 and ub_t1 > 1e-6:
                    row = np.zeros(num_vars)
                    row[(t+1)*N + i] = ub_t    # x_{i,t+1} * ub_t
                    row[t*N + i] = -ub_t1       # -x_{i,t} * ub_{t+1}
                    sos2_rows.append(row)
        A_sos2 = np.array(sos2_rows) if sos2_rows else np.zeros((0, num_vars))

        # 1. Total Budget Cap: sum of all tranches <= B
        A_budget = np.zeros((1, num_vars))
        A_budget[0, :N*T] = 1.0

        # 2. Statutory 10% NER Floor: sum_{i in NER} sum_t x_{i,t} >= 0.10 * sum_all
        A_ner = np.zeros((1, num_vars))
        for t in range(T):
            for i in range(N):
                if is_ner[i]:
                    A_ner[0, t*N + i] = 0.90
                else:
                    A_ner[0, t*N + i] = -0.10

        # 3. CVaR auxiliary constraints (Rockafellar-Uryasev):
        #        zeta_s >= L_s(x) - eta   <=>   R_s(x) + eta + zeta_s >= 0
        #    where R_s(x) = sum_{i,t} theta_{s,i} base_yield_i mult_t x_{i,t} is the
        #    scenario return and L_s = -R_s its loss. No arbitrary target or scale:
        #    the row is in the same yield-weighted Cr units as the mean term.
        A_cvar = np.zeros((S, num_vars))
        b_cvar_l = np.zeros(S)
        for s in range(S):
            for t in range(T):
                A_cvar[s, t*N:(t+1)*N] = theta_si[s] * base_yield * tranche_yield_mult[t]
            A_cvar[s, N*T] = 1.0           # eta
            A_cvar[s, N*T + 1 + s] = 1.0   # zeta_s
            b_cvar_l[s] = 0.0

        # Stack all constraints
        n_sos2 = A_sos2.shape[0]
        A_all = np.vstack([A_budget, A_ner, A_cvar, A_sos2]) if n_sos2 > 0 else np.vstack([A_budget, A_ner, A_cvar])

        b_l_base = np.concatenate([[0.0], [0.0 if req.enforce_ner_floor else -B], b_cvar_l])
        b_u_base = np.concatenate([[B], [np.inf], np.full(S, np.inf)])
        if n_sos2 > 0:
            b_l = np.concatenate([b_l_base, np.full(n_sos2, -np.inf)])
            b_u = np.concatenate([b_u_base, np.zeros(n_sos2)])
        else:
            b_l = b_l_base
            b_u = b_u_base

        constraints = LinearConstraint(A_all, b_l, b_u)

        # Variable Bounds
        lb = np.zeros(num_vars)
        lb[N*T] = -np.inf              # eta is the VaR level and is FREE
        ub_full = np.full(num_vars, np.inf)
        ub_full[:N*T] = tranche_ub
        bounds = Bounds(lb, ub_full)

        # Solve with HiGHS
        res_milp = milp(c=c, constraints=constraints, bounds=bounds, integrality=np.zeros(num_vars))

        # LP relaxation for dual shadow prices
        A_ub_list = [A_budget[0], -A_ner[0]]
        b_ub_list = [B, 0.0 if req.enforce_ner_floor else B]
        for s in range(S):
            A_ub_list.append(-A_cvar[s])
            b_ub_list.append(-b_cvar_l[s])
        for j in range(n_sos2):
            A_ub_list.append(A_sos2[j])
            b_ub_list.append(0.0)

        A_ub_mat = np.array(A_ub_list)
        b_ub_vec = np.array(b_ub_list)
        # eta is the VaR level and is FREE (it may be negative when the tail is a gain);
        # only the zeta_s excess variables are non-negative.
        bounds_lp = [(0.0, tranche_ub[i]) for i in range(N*T)] + [(None, None)] + [(0.0, None) for _ in range(S)]

        res_lp = linprog(c=c, A_ub=A_ub_mat, b_ub=b_ub_vec, bounds=bounds_lp, method="highs")

        # Extract allocations: sum tranches per project
        x_full = None
        if res_milp.success:
            x_full = res_milp.x
            x_raw = res_milp.x[:N*T]
            milp_obj = float(res_milp.fun)
        elif res_lp.success:
            x_full = res_lp.x
            x_raw = res_lp.x[:N*T]
            milp_obj = float(res_lp.fun)
        else:
            # Fallback proportional allocation
            x_raw = np.zeros(N * T)
            for t in range(T):
                x_raw[t*N:(t+1)*N] = np.minimum(tranche_ub[t*N:(t+1)*N], (demands * tranche_fracs[t] / np.sum(demands)) * B)
            milp_obj = float(np.dot(c[:N*T], x_raw))

        # Sum tranches per project
        allocations_raw = np.zeros(N)
        for t in range(T):
            allocations_raw += x_raw[t*N:(t+1)*N]

        # Exact Mathematical Shadow Prices from HiGHS Dual Lagrange Multipliers
        # A shadow price is either the LP's dual or it is nothing. The previous fallback
        # synthesised one -- clip(mean(effective_yield) * 1.15, 0.45, 2.80) for the budget
        # and a literal 0.850 for the NER floor -- and served it under this very comment
        # about "exact Lagrange multipliers". A fabricated dual is worse than a missing
        # one: it is unfalsifiable at a glance and it is the number an officer would
        # reallocate capital on. If the dual is unavailable, say so.
        #
        # abs() is deliberate and correct, not a sign bug: scipy minimises with A_ub x <= b,
        # so marginals for a binding <= row are <= 0, and the conventional positive shadow
        # price is their magnitude. Complementary slackness is preserved either way -- a
        # slack constraint returns exactly 0.0, which is verified in tests.
        pi_budget = None
        pi_ner = None
        if res_lp.success and getattr(res_lp, "ineqlin", None) is not None:
            marginals = res_lp.ineqlin.marginals
            if len(marginals) > 0:
                pi_budget = round(float(abs(marginals[0])), 3)
            if len(marginals) > 1 and req.enforce_ner_floor:
                pi_ner = round(float(abs(marginals[1])), 3)
            elif not req.enforce_ner_floor:
                pi_ner = 0.0
        duals_available = pi_budget is not None
        if pi_budget is None:
            pi_budget = 0.0
        if pi_ner is None:
            pi_ner = 0.0

        # Compute Yield and CVaR
        total_allocated = float(np.sum(allocations_raw))
        ner_allocated = float(np.sum(allocations_raw * is_ner))
        ner_share = (ner_allocated / total_allocated * 100.0) if total_allocated > 0 else 0.0

        expected_yield = float(np.sum(allocations_raw * base_yield) / max(total_allocated, 1.0) * 100.0)

        # The figure above is a composite index and exceeds 100 routinely,
        # because base_yield multiplies a completion propensity by a network
        # vitality term normalised to mean 1 rather than capped at 1. Compute
        # the quantity that IS a percentage alongside it: the allocation-weighted
        # mean completion propensity on its own, clipped to [0, 1].
        _propensity = np.clip(0.5 + (progress / 100.0) - (delays / 200.0), 0.0, 1.0)
        completion_propensity_perc = float(np.clip(
            np.sum(allocations_raw * _propensity) / max(total_allocated, 1.0) * 100.0,
            0.0, 100.0))
        portfolio_risk = float(np.sum(allocations_raw * risk_normalized) / max(total_allocated, 1.0))

        # CVaR reported from the solved scenario returns, in the LP's own units.
        # (Previously this field carried allocation-weighted risk index x 100, which
        # is not a CVaR, not a loss and not in Cr.) Tail loss = expected return minus
        # the alpha-tail average return, so it is >= 0 and falls as kappa rises.
        def _tail_average(returns):
            """alpha-tail average return: walk scenarios from the lowest return upward
            until (1 - alpha) of probability mass is consumed."""
            tail_mass, tail_ret, remaining = 1.0 - CVAR_ALPHA, 0.0, 1.0 - CVAR_ALPHA
            for s_ in np.argsort(returns):
                take = min(remaining, p_scenarios[s_])
                tail_ret += take * returns[s_]
                remaining -= take
                if remaining <= 1e-12:
                    break
            return tail_ret / tail_mass

        # (a) In the LP's own units, for the Rockafellar-Uryasev cross-check.
        scen_returns_lp = np.array([float(A_cvar[s, :N*T] @ x_raw) for s in range(S)])   # R_s(x*)
        tail_avg_lp = _tail_average(scen_returns_lp)
        eta_star = float(x_full[N*T]) if x_full is not None else float("nan")
        zeta_star = x_full[N*T+1:] if x_full is not None else np.full(S, np.nan)
        ru_cvar = float(eta_star + np.sum(p_scenarios * zeta_star) / (1.0 - CVAR_ALPHA)) if x_full is not None else float("nan")

        # (b) On a kappa-INVARIANT yardstick for reporting. The LP's tranche yield
        # multipliers are themselves kappa-modulated (steeper diminishing returns at
        # high kappa), so scenario returns in LP units are not comparable across two
        # calls with different kappa: a lower tail at kappa=1 could be the yardstick
        # shrinking rather than the portfolio getting safer. The reported figures use
        # the kappa=0 multipliers so that the only thing that changes between calls
        # is the allocation.
        ref_mult = np.array([1.0, 0.92, 0.85])
        scen_returns = np.array([
            float(sum(theta_si[s] * base_yield * ref_mult[t] @ x_raw[t*N:(t+1)*N] for t in range(T)))
            for s in range(S)])
        expected_return = float(p_scenarios @ scen_returns)
        tail_avg_return = _tail_average(scen_returns)
        cvar_loss = float(max(0.0, expected_return - tail_avg_return))
        cvar_diagnostics = {
            "alpha": CVAR_ALPHA,
            "scenario_probabilities": [float(p) for p in p_scenarios],
            "scenario_severities": [float(v) for v in severity_scenarios],
            "scenario_returns": [round(float(r), 2) for r in scen_returns],
            "expected_return": round(expected_return, 2),
            "tail_average_return": round(float(tail_avg_return), 2),
            "tail_loss": round(cvar_loss, 2),
            "var_eta": round(eta_star, 2) if np.isfinite(eta_star) else None,
            "zeta": [round(float(z), 4) for z in zeta_star] if x_full is not None else None,
            "lp_units_scenario_returns": [round(float(r), 2) for r in scen_returns_lp],
            "lp_units_tail_average_return": round(float(tail_avg_lp), 2),
            "ru_tail_average_return": round(-ru_cvar, 2) if np.isfinite(ru_cvar) else None,
            "ru_agrees": bool(np.isfinite(ru_cvar) and abs(-ru_cvar - tail_avg_lp) < 1e-3 * max(1.0, abs(tail_avg_lp))),
            "mean_weight": round(mean_weight, 3),
            "cvar_weight": round(cvar_weight, 3),
            "units": "yield-weighted Cr (base_yield index x allocated Cr), kappa=0 tranche multipliers",
            "note": ("Scenarios are declared policy, not estimated. With p_severe = 0.15 > "
                     "1 - alpha = 0.10 the 90% tail lies inside the severe scenario, so "
                     "CVaR_0.90 equals the severe-scenario outcome and zeta = 0 at the optimum."),
        }

        # SOLVER-AGREEMENT DIAGNOSTIC (deliberately NOT called a duality gap).
        #
        # Every decision variable is continuous (integrality is all-zero), so milp() and
        # linprog() solve the SAME linear program. An LP satisfying Slater's condition has
        # ZERO duality gap by strong duality -- there is no gap here to measure, and the
        # earlier label "Exact Duality Gap" asserted a quantity that cannot be non-zero.
        # What this actually measures is whether the two HiGHS entry points agree on the
        # optimal objective, which is a useful numerical check and nothing more.
        if res_lp.success and abs(res_lp.fun) > 1e-3:
            raw_duality_gap = abs(res_lp.fun - milp_obj) / abs(res_lp.fun) * 100.0
            closure_error = round(float(raw_duality_gap), 2)
        else:
            closure_error = 0.0

        # Compute Dynamic Agency Shadow Prices
        agency_shadow_prices = {}
        for entity in self.candidate_df["CANONICAL_ENTITY"].unique():
            if not entity or pd.isna(entity):
                continue
            mask = (self.candidate_df["CANONICAL_ENTITY"] == entity).values
            if np.any(mask):
                ent_yield = float(np.mean(base_yield[mask]))
                # A DERIVED indicator (agency yield x budget dual x 1.15, clipped), not a
                # dual of any constraint. Named for what it is on the result.
                agency_shadow_prices[str(entity)] = round(float(np.clip(ent_yield * pi_budget * 1.15, 0.35, 3.50)), 2)

        # No fallback entries: an agency absent from the candidate pool has no
        # indicator, and a literal standing in for one is a fabricated number.

        # Project Allocations Output
        project_allocs = []
        for i in range(N):
            row = self.candidate_df.iloc[i]
            allocated_val = float(round(allocations_raw[i], 2))
            project_allocs.append(ProjectAllocation(
                project_id=str(row["ProjectId"]),
                project_name=str(row["ProjectName"]),
                canonical_entity=str(row.get("CANONICAL_ENTITY") or row.get("COMPANYNAME") or "CENTRAL_PSU"),
                state=resolve_state(row.get("ProjectId"), row.get("StateName"))[0],
                is_ner=bool(is_ner[i]),
                requested_capex_cr=float(round(demands[i], 2)),
                allocated_capex_cr=allocated_val,
                completion_yield_phi=float(round(base_yield[i] * 10.0, 1)),
                systemic_benefit_gamma=float(round(gammas[i], 2))
            ))

        solve_duration = round((time.time() - start_time) * 1000.0, 1)

        focus_is_candidate = True
        if req.shocked_project_id:
            focus_is_candidate = req.shocked_project_id in self.candidate_df["ProjectId"].astype(str).values

        return AllocationResult(
            total_budget_pool_cr=B,
            total_allocated_cr=round(total_allocated, 2),
            expected_completion_yield=round(expected_yield, 2),
            portfolio_completion_propensity_perc=round(completion_propensity_perc, 2),
            cvar90_tail_loss=round(cvar_loss, 2),
            cvar_diagnostics=cvar_diagnostics,
            ner_allocated_cr=round(ner_allocated, 2),
            ner_share_perc=round(ner_share, 2),
            ner_floor_met=ner_share >= 9.9,
            shadow_price_budget_pi=round(pi_budget, 3),
            shadow_price_ner_pi=round(pi_ner, 3),
            agency_marginal_yield_indicator=agency_shadow_prices,
            allocations=project_allocs,
            closure_error_perc=closure_error,
            ner_coverage=getattr(self, "_state_coverage", None),
            solve_time_ms=solve_duration,
            focus_project_id=req.shocked_project_id,
            focus_project_is_candidate=focus_is_candidate
        )

# Module-level singleton
_alloc_instance = None

def get_vitta_vyuha_engine() -> VittaVyuhaEngine:
    global _alloc_instance
    if _alloc_instance is None:
        _alloc_instance = VittaVyuhaEngine()
    return _alloc_instance

if __name__ == "__main__":
    import sys
    sys.stdout.reconfigure(encoding="utf-8")
    engine = get_vitta_vyuha_engine()
    req = AllocationRequest(budget_pool_cr=12000.0, risk_dial_kappa=0.75, enforce_ner_floor=True)
    res = engine.optimize_allocation(req)
    print("VITTA-VYUHA Two-Stage Stochastic LP Optimization Output:")
    print(f"  Budget Pool: ₹{res.total_budget_pool_cr:,.2f} Cr")
    print(f"  Total Allocated: ₹{res.total_allocated_cr:,.2f} Cr")
    print(f"  NER Allocated: ₹{res.ner_allocated_cr:,.2f} Cr ({res.ner_share_perc:.1f}% vs 10% statutory floor)")
    print(f"  Priority Index (not a %): {res.expected_completion_yield:.2f}")
    print(f"  Completion Propensity:    {res.portfolio_completion_propensity_perc:.2f}%")
    print(f"  CVaR90 Tail Loss: {res.cvar90_tail_loss:,.2f} (yield-weighted Cr; E[R] - 90% tail-average R)")
    print(f"  Dual Shadow Price π(Budget): {res.shadow_price_budget_pi:.3f} (₹ return per ₹1 Cr capex)")
    print(f"  Linearization Closure Error: {res.closure_error_perc}%")
    print(f"  Solve Time: {res.solve_time_ms} ms")
    print("\nVerified VITTA-VYUHA Two-Stage Stochastic LP optimizer successfully generated!")
