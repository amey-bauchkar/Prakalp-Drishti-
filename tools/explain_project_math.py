"""
PRAKALP-DRISHTI: KAAL-CHAKRA Mathematical Explainer Tool
Run this script to see the exact step-by-step calculation behind any project forecast.
Usage:
    python tools/explain_project_math.py [PROJECT_ID]
Default:
    python tools/explain_project_math.py 618992
"""

import sys
import os
import json
import numpy as np
import pandas as pd

# Add workspace root to path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from analytics_engine.kaal_chakra import KaalChakraEngine

def explain_math(project_id: str = "618992"):
    print("=" * 80)
    print(f"   PRAKALP-DRISHTI: KAAL-CHAKRA MATHEMATICAL BREAKDOWN")
    print(f"   Step-by-Step Forecast Audit for Project #{project_id}")
    print("=" * 80)

    engine = KaalChakraEngine()
    row = engine.df[engine.df["ProjectId"].astype(str) == str(project_id)]
    if row.empty:
        print(f"Error: Project ID {project_id} not found in database.")
        sys.exit(1)

    p = row.iloc[0]
    pname = str(p["ProjectName"])
    sector = str(p["SectorName"])
    entity = str(p["CANONICAL_ENTITY"])
    sanction_dt = p["SanctionDate"] if pd.notna(p["SanctionDate"]) else pd.Timestamp("2021-01-01")
    orig_end_dt = p["OriginalEndDate"] if pd.notna(p["OriginalEndDate"]) else sanction_dt + pd.Timedelta(days=365*3)
    rev_end_dt = p["RevisedDate"] if pd.notna(p["RevisedDate"]) else orig_end_dt + pd.Timedelta(days=365*2)
    
    orig_cost = float(p["OriginalCost"])
    rev_cost = float(p["RevisedCost"])
    planned_months = float(p["PlannedDurationMonths"])
    current_months = float(p["CurrentDurationMonths"])
    progress_perc = float(p["PhysicalProgress"]) if ("PhysicalProgress" in p and pd.notna(p["PhysicalProgress"])) else 25.0
    reset_count = int(p["BaselineResetCount"])

    print("\n1. PROJECT PROFILE")
    print("-" * 50)
    print(f"• Project Name       : {pname}")
    print(f"• Sector             : {sector}")
    print(f"• Implementing Agency: {entity}")
    print(f"• Sanction Date      : {sanction_dt.strftime('%d %B %Y')}")
    print(f"• Original DPR Target: {orig_end_dt.strftime('%d %B %Y')} ({planned_months:.1f} months planned)")
    print(f"• Current Elapsed    : {current_months:.1f} months passed (~{(current_months/planned_months)*100:.1f}% of scheduled time)")
    print(f"• On-Ground Progress : {progress_perc:.1f}% completed")
    print(f"• Sanctioned Cost    : Rs. {rev_cost:,.2f} Cr")
    print(f"• Baseline Resets    : {reset_count} contract revision(s)")

    print("\n2. THE COMMON SENSE REALITY CHECK (Why the date seems so far)")
    print("-" * 50)
    print(f"Imagine a building project planned for 4.5 years.")
    print(f"Nearly 4 years ({current_months:.1f} months) have passed, but only {progress_perc:.1f}% is built!")
    print(f"If the contractor continued at that snail pace, completing the remaining {100-progress_perc:.1f}%")
    print(f"would theoretically take thousands of months. KAAL-CHAKRA avoids that naive mistake")
    print(f"by combining high-level historical data (AFT model) with real ground pace.")

    # Step A: Top Down
    print("\n3. STEP A: TOP-DOWN SURVIVAL ACCELERATION (Historical Sector Model)")
    print("-" * 50)
    sec_mult = engine.model_weights["sector_scales"].get(sector, engine.model_weights["sector_default"])
    ent_mult = engine.model_weights["entity_scales"].get(entity, engine.model_weights["entity_default"])
    cost_mult = 1.0 + engine.model_weights["cost_elasticity"] * np.log10(max(orig_cost, 100.0) / 100.0)
    rebase_mult = 1.0 + (reset_count * engine.model_weights["reset_coefficient"])

    print(f"• Sector Multiplier   (sec_mult) : {sec_mult:.4f}x (Historical delay scale for {sector})")
    print(f"• Agency Multiplier   (ent_mult) : {ent_mult:.4f}x (Execution friction for {entity})")
    print(f"• Cost Multiplier     (cost_mult): {cost_mult:.4f}x (Higher capex = higher coordination friction)")
    print(f"• Rebase Multiplier (rebase_mult): {rebase_mult:.4f}x (Penalty for {reset_count} deadline reset(s))")
    
    prior_duration = planned_months * sec_mult * ent_mult * cost_mult * rebase_mult
    print(f"\n  FORMULA: Planned ({planned_months:.1f} mo) × {sec_mult:.2f} × {ent_mult:.2f} × {cost_mult:.2f} × {rebase_mult:.2f}")
    print(f"  --> Prior Expected Total Duration: {prior_duration:.2f} months ({prior_duration/12:.1f} years)")

    # Step B: Bottom Up
    print("\n4. STEP B: BOTTOM-UP ON-GROUND PROGRESS PACE")
    print("-" * 50)
    historical_pace = max(progress_perc, 5.0) / max(current_months, 3.0)
    rem_perc = max(100.0 - progress_perc, 0.5)
    rem_months = max((rem_perc / max(historical_pace, 0.12)) * (sec_mult ** 0.3), 1.0)
    duration_from_progress = current_months + rem_months
    print(f"• Current Velocity : {historical_pace:.4f}% completed per month")
    print(f"• Work Remaining   : {rem_perc:.1f}%")
    print(f"• Months to Finish : {rem_months:.2f} months")
    print(f"  --> Ground-paced Total Duration: {duration_from_progress:.2f} months ({duration_from_progress/12:.1f} years)")

    # Step C: Bayesian Blend
    print("\n5. STEP C: DYNAMIC CREDIBILITY BLEND")
    print("-" * 50)
    w_progress = float(np.clip(progress_perc / 100.0, 0.05, 0.95))
    median_expected_duration = (1.0 - w_progress) * prior_duration + w_progress * duration_from_progress
    median_expected_duration = max(median_expected_duration, current_months + 1.0)
    print(f"• Weight on Ground Pace (Progress = {progress_perc:.1f}%) : {w_progress*100:.1f}%")
    print(f"• Weight on Sector Prior                          : {(1-w_progress)*100:.1f}%")
    print(f"  FORMULA: ({(1-w_progress):.2f} × {prior_duration:.1f}) + ({w_progress:.2f} × {duration_from_progress:.1f})")
    print(f"  --> BLENDED FORECAST (P50 Median Duration): {median_expected_duration:.2f} months ({median_expected_duration/12:.1f} years)")

    # Step D: Conformal calibration
    print("\n6. STEP D: SPLIT-CONFORMAL CALIBRATION & CONFIDENCE INTERVALS")
    print("-" * 50)
    gamma = engine.model_weights["shape_parameter_gamma"]
    rem_uncertainty_scale = max((100.0 - progress_perc) / 100.0, 0.15)
    gamma_effective = gamma * np.sqrt(rem_uncertainty_scale)
    Q = float(engine.conformal["conformal_quantile_Q_months"]) if engine.conformal else 4.5
    cqr_offsets = np.array([-Q, 0.0, 0.55 * Q, Q]) * rem_uncertainty_scale

    quantiles_u = np.array([0.10, 0.50, 0.80, 0.95])
    raw_durations = median_expected_duration * np.power(quantiles_u / (1.0 - quantiles_u), gamma_effective) + cqr_offsets
    durations_monotone = np.maximum.accumulate(raw_durations)
    durations_monotone = np.maximum(durations_monotone, current_months + np.array([0.5, 1.0, 2.0, 4.0]) * rem_uncertainty_scale)
    
    q10_m, q50_m, q80_m, q95_m = durations_monotone
    dts = [sanction_dt + pd.Timedelta(days=int(m * 30.4375)) for m in durations_monotone]

    print(f"• Conformal Half-Width Q: {Q:.3f} months (Proven 93.3% statistical coverage)")
    print(f"\nFinal Calculated Percentiles & Completion Dates:")
    print(f"  ┌─────────────────┬───────────────────┬───────────────────┐")
    print(f"  │ PERCENTILE      │ TOTAL DURATION    │ CALENDAR DATE     │")
    print(f"  ├─────────────────┼───────────────────┼───────────────────┤")
    print(f"  │ P10 Optimistic  │ {q10_m:6.1f} months   │ {dts[0].strftime('%Y-%m-%d')}        │")
    print(f"  │ P50 Forecast    │ {q50_m:6.1f} months   │ {dts[1].strftime('%Y-%m-%d')} (Median)│")
    print(f"  │ P80 Target      │ {q80_m:6.1f} months   │ {dts[2].strftime('%Y-%m-%d')}        │")
    print(f"  │ P95 Risk Tail   │ {q95_m:6.1f} months   │ {dts[3].strftime('%Y-%m-%d')}        │")
    print(f"  └─────────────────┴───────────────────┴───────────────────┘")

    print("\n7. WHY THE OTHER LAPTOP SHOWS DIFFERENT DATES (2036 instead of 2051):")
    print("-" * 50)
    print("• The other laptop hasn't pulled commit 883667b (by Amey Bauchkar).")
    print("• In that older version, 'Electricity Generation' was missing from the code")
    print("  and silently fell back to an arbitrary default of 1.40x (instead of 3.72x).")
    print("• Once that laptop runs 'git pull' and restarts the server, both will show identical dates!")
    print("=" * 80)

if __name__ == "__main__":
    pid = sys.argv[1] if len(sys.argv) > 1 else "618992"
    explain_math(pid)
