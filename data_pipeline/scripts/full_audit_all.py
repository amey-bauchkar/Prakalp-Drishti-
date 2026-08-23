"""
PRAKALP-DRISHTI: FULL 2,207 PROJECT AUDIT
Tests EVERY project through KAAL-CHAKRA engine and validates against raw CSV.
Also runs SETU-GRAPH for all, and bulk VITTA-VYUHA + PRAGATI-SAARTHI.
"""
import sys, os, time, traceback
import pandas as pd
import numpy as np

sys.stdout.reconfigure(encoding='utf-8')
os.chdir(r'c:\Users\SEBIN\Desktop\SIH PS')
sys.path.insert(0, os.getcwd())

from analytics_engine.kaal_chakra import get_kaal_chakra_engine
from analytics_engine.setu_graph import get_setu_graph_engine
from analytics_engine.vitta_vyuha import get_vitta_vyuha_engine, AllocationRequest
from analytics_engine.pragati_saarthi import get_pragati_saarthi_engine

# Load raw CSV
df = pd.read_csv('paimana_extracted/PAIMANA_MASTER_PROJECTS_DATABASE.csv')
df['OriginalCost'] = pd.to_numeric(df['OriginalCost'], errors='coerce').fillna(500.0)
df['RevisedCost'] = pd.to_numeric(df['RevisedCost'], errors='coerce').fillna(df['OriginalCost'])
df['Expenditure'] = pd.to_numeric(df['Expenditure'], errors='coerce').fillna(0.0)
df['PhysicalProgress'] = pd.to_numeric(df['PhysicalProgress'], errors='coerce').fillna(20.0)
df['DELAYED_TIME'] = pd.to_numeric(df['DELAYED_TIME'], errors='coerce').fillna(0.0)

ALL_IDS = df['ProjectId'].astype(str).tolist()
TOTAL = len(ALL_IDS)

print("=" * 80)
print(f"FULL AUDIT: Testing ALL {TOTAL} projects")
print("=" * 80)

# =====================================================================
# AUDIT 1: KAAL-CHAKRA — Every single project
# =====================================================================
print(f"\n{'='*80}")
print(f"AUDIT 1: KAAL-CHAKRA — {TOTAL} projects")
print(f"{'='*80}")

kaal = get_kaal_chakra_engine()
kaal_errors = []
kaal_pass = 0
kaal_fail = 0

t0 = time.time()
for i, pid in enumerate(ALL_IDS):
    raw = df[df['ProjectId'].astype(str) == pid].iloc[0]
    
    try:
        forecast = kaal.forecast_project(pid)
        
        # 1. project_id match
        if str(forecast.project_id) != pid:
            kaal_errors.append(f"{pid}: project_id mismatch ({forecast.project_id})")
            kaal_fail += 1
            continue
        
        # 2. project_name match
        if forecast.project_name != str(raw['ProjectName']):
            kaal_errors.append(f"{pid}: project_name mismatch")
            kaal_fail += 1
            continue
        
        # 3. original_cost_cr match
        csv_orig = float(raw['OriginalCost'])
        if abs(forecast.original_cost_cr - csv_orig) > 0.01:
            kaal_errors.append(f"{pid}: original_cost_cr {forecast.original_cost_cr} vs CSV {csv_orig}")
            kaal_fail += 1
            continue
        
        # 4. revised_cost_cr match
        csv_rev = float(raw['RevisedCost'])
        if abs(forecast.revised_cost_cr - csv_rev) > 0.01:
            kaal_errors.append(f"{pid}: revised_cost_cr {forecast.revised_cost_cr} vs CSV {csv_rev}")
            kaal_fail += 1
            continue
        
        # 5. cost_overrun_perc calculation
        expected_overrun = ((csv_rev - csv_orig) / csv_orig * 100.0) if csv_orig > 0 else 0.0
        if abs(forecast.cost_overrun_perc - expected_overrun) > 0.1:
            kaal_errors.append(f"{pid}: cost_overrun_perc {forecast.cost_overrun_perc:.1f}% vs calc {expected_overrun:.1f}%")
            kaal_fail += 1
            continue
        
        # 6. rebaselined flag
        expected_rebaselined = csv_rev > csv_orig * 1.05
        if forecast.rebaselined != expected_rebaselined:
            kaal_errors.append(f"{pid}: rebaselined {forecast.rebaselined} vs expected {expected_rebaselined}")
            kaal_fail += 1
            continue
        
        # 7. sector match
        if forecast.sector != str(raw['SectorName']):
            kaal_errors.append(f"{pid}: sector '{forecast.sector}' vs CSV '{raw['SectorName']}'")
            kaal_fail += 1
            continue
        
        # 8. prob_target_met_official in [0,1]
        if forecast.prob_target_met_official < 0 or forecast.prob_target_met_official > 1:
            kaal_errors.append(f"{pid}: prob out of range {forecast.prob_target_met_official}")
            kaal_fail += 1
            continue
        
        # 9. Quantile monotonicity P10 <= P50 <= P80 <= P95
        dates = [forecast.p10_date, forecast.p50_date, forecast.p80_date, forecast.p95_date]
        if dates != sorted(dates):
            kaal_errors.append(f"{pid}: non-monotone quantiles {dates}")
            kaal_fail += 1
            continue
        
        # 10. fact_cost.value == revised_cost
        fc = forecast.facts.get('fact_cost')
        if fc and abs(fc.value - csv_rev) > 0.01:
            kaal_errors.append(f"{pid}: fact_cost.value {fc.value} vs CSV {csv_rev}")
            kaal_fail += 1
            continue
        
        # 11. formatted_value check
        if fc:
            expected_fmt = f"Rs.{csv_rev:,.2f} Cr"
            alt_fmt = f"\u20b9{csv_rev:,.2f} Cr"
            if fc.formatted_value != expected_fmt and fc.formatted_value != alt_fmt:
                kaal_errors.append(f"{pid}: formatted_value '{fc.formatted_value}' vs expected '{alt_fmt}'")
                kaal_fail += 1
                continue
        
        # 12. lineage hash non-empty
        if fc and fc.lineage and not fc.lineage.dataset_sha256:
            kaal_errors.append(f"{pid}: empty dataset_sha256")
            kaal_fail += 1
            continue
        
        kaal_pass += 1
        
    except Exception as e:
        kaal_errors.append(f"{pid}: EXCEPTION - {str(e)[:100]}")
        kaal_fail += 1
    
    # Progress indicator every 200
    if (i + 1) % 200 == 0:
        elapsed = time.time() - t0
        print(f"  [{i+1}/{TOTAL}] {kaal_pass} pass, {kaal_fail} fail, {elapsed:.1f}s elapsed")

kaal_time = time.time() - t0
print(f"\n  KAAL-CHAKRA RESULT: {kaal_pass}/{TOTAL} PASSED, {kaal_fail} FAILED in {kaal_time:.1f}s")

# =====================================================================
# AUDIT 2: SETU-GRAPH — Every project's subgraph
# =====================================================================
print(f"\n{'='*80}")
print(f"AUDIT 2: SETU-GRAPH — {TOTAL} subgraphs (k=1)")
print(f"{'='*80}")

setu = get_setu_graph_engine()
setu_errors = []
setu_pass = 0
setu_fail = 0

t0 = time.time()
for i, pid in enumerate(ALL_IDS):
    try:
        sub = setu.get_k_hop_subgraph(pid, k=1)
        
        # 1. acyclic
        if not sub.acyclic_dag_verified:
            setu_errors.append(f"{pid}: NOT acyclic!")
            setu_fail += 1
            continue
        
        # 2. P50 <= P95
        if sub.total_cascade_locked_p50_cr > sub.total_cascade_locked_p95_cr + 0.01:
            setu_errors.append(f"{pid}: P50={sub.total_cascade_locked_p50_cr} > P95={sub.total_cascade_locked_p95_cr}")
            setu_fail += 1
            continue
        
        # 3. Check node cost_cr against CSV
        for node in sub.nodes:
            node_raw = df[df['ProjectId'].astype(str) == str(node.project_id)]
            if not node_raw.empty:
                csv_cost = float(node_raw.iloc[0]['RevisedCost'])
                if abs(node.cost_cr - csv_cost) > 0.01:
                    setu_errors.append(f"{pid}: node {node.project_id} cost {node.cost_cr} vs CSV {csv_cost}")
                    setu_fail += 1
                    break
                # Negative float check
                if node.free_float_months < 0:
                    setu_errors.append(f"{pid}: node {node.project_id} negative free_float {node.free_float_months}")
                    setu_fail += 1
                    break
        else:
            setu_pass += 1
            
    except Exception as e:
        setu_errors.append(f"{pid}: EXCEPTION - {str(e)[:100]}")
        setu_fail += 1
    
    if (i + 1) % 500 == 0:
        elapsed = time.time() - t0
        print(f"  [{i+1}/{TOTAL}] {setu_pass} pass, {setu_fail} fail, {elapsed:.1f}s elapsed")

setu_time = time.time() - t0
print(f"\n  SETU-GRAPH RESULT: {setu_pass}/{TOTAL} PASSED, {setu_fail} FAILED in {setu_time:.1f}s")

# =====================================================================
# AUDIT 3: VITTA-VYUHA — Comprehensive budget sweep
# =====================================================================
print(f"\n{'='*80}")
print(f"AUDIT 3: VITTA-VYUHA — 12 budget/risk scenarios")
print(f"{'='*80}")

vitta = get_vitta_vyuha_engine()
vitta_errors = []
vitta_pass = 0

budgets = [1000, 3000, 5000, 8000, 12000, 20000, 30000, 50000, 75000, 100000]
kappas = [0.1, 0.3, 0.5, 0.75, 0.9]

ner_states = {'Assam', 'Arunachal Pradesh', 'Meghalaya', 'Manipur', 'Mizoram', 'Nagaland', 'Tripura', 'Sikkim'}

t0 = time.time()
for budget in budgets:
    for kappa in kappas:
        try:
            req = AllocationRequest(budget_pool_cr=float(budget), risk_dial_kappa=kappa, enforce_ner_floor=True)
            res = vitta.optimize_allocation(req)
            
            scenario = f"B={budget},k={kappa}"
            issues = []
            
            # Budget constraint
            if res.total_allocated_cr > budget + 0.01:
                issues.append(f"BUDGET VIOLATION: {res.total_allocated_cr} > {budget}")
            
            # NER floor
            if res.ner_share_perc < 9.9:
                issues.append(f"NER FLOOR: {res.ner_share_perc:.1f}% < 10%")
            
            # Negative allocations
            negs = [a for a in res.allocations if a.allocated_capex_cr < -0.01]
            if negs:
                issues.append(f"{len(negs)} negative allocations")
            
            # Sum consistency
            total_sum = sum(a.allocated_capex_cr for a in res.allocations)
            if abs(total_sum - res.total_allocated_cr) > 0.5:
                issues.append(f"SUM: {total_sum:.2f} vs total {res.total_allocated_cr:.2f}")
            
            # Closure error
            if res.closure_error_perc > 5.0:
                issues.append(f"CLOSURE: {res.closure_error_perc}%")
            
            # Solve time
            if res.solve_time_ms > 2000:
                issues.append(f"SLOW: {res.solve_time_ms}ms")
            
            # NER flag correctness (spot-check first 50 allocations)
            for alloc in res.allocations[:50]:
                alloc_raw = df[df['ProjectId'].astype(str) == str(alloc.project_id)]
                if not alloc_raw.empty:
                    csv_state = str(alloc_raw.iloc[0]['StateName'])
                    expected_ner = csv_state in ner_states
                    if alloc.is_ner != expected_ner:
                        issues.append(f"NER FLAG: {alloc.project_id} state='{csv_state}' flag={alloc.is_ner}")
                        break
            
            if issues:
                for iss in issues:
                    vitta_errors.append(f"{scenario}: {iss}")
                print(f"  FAIL {scenario}: {'; '.join(issues)}")
            else:
                vitta_pass += 1
                print(f"  PASS {scenario}: allocated={res.total_allocated_cr:,.0f} NER={res.ner_share_perc:.1f}% solve={res.solve_time_ms:.0f}ms")
                
        except Exception as e:
            vitta_errors.append(f"{scenario}: EXCEPTION - {str(e)[:100]}")
            print(f"  FAIL {scenario}: EXCEPTION")

vitta_time = time.time() - t0
vitta_total = len(budgets) * len(kappas)
print(f"\n  VITTA-VYUHA RESULT: {vitta_pass}/{vitta_total} PASSED, {len(vitta_errors)} FAILED in {vitta_time:.1f}s")

# =====================================================================
# AUDIT 4: PRAGATI-SAARTHI — Every 50th project (44 briefings)
# =====================================================================
print(f"\n{'='*80}")
sample_ids = ALL_IDS[::50]  # every 50th = ~44 projects
print(f"AUDIT 4: PRAGATI-SAARTHI — {len(sample_ids)} briefings (every 50th project)")
print(f"{'='*80}")

saarthi = get_pragati_saarthi_engine()
saarthi_errors = []
saarthi_pass = 0

t0 = time.time()
for i, pid in enumerate(sample_ids):
    try:
        brief = saarthi.generate_cabinet_briefing(pid)
        raw = df[df['ProjectId'].astype(str) == pid].iloc[0]
        
        issues = []
        
        # doc_hash
        if not brief.doc_hash or len(brief.doc_hash) < 32:
            issues.append("short doc_hash")
        
        # merkle_root
        if not brief.merkle_root or len(brief.merkle_root) < 32:
            issues.append("short merkle_root")
        
        # bilingual
        if len(brief.bilingual_sections) < 2:
            issues.append(f"only {len(brief.bilingual_sections)} bilingual sections")
        
        # Hindi title
        if not brief.title_hi or len(brief.title_hi) < 10:
            issues.append("missing Hindi title")
        
        # fact_cost value vs CSV
        csv_rev = float(raw['RevisedCost'])
        cost_fact = None
        for fid, f in brief.audit_facts.items():
            if 'cost' in fid.lower():
                cost_fact = f
                break
        if cost_fact and abs(cost_fact.value - csv_rev) > 0.01:
            issues.append(f"fact_cost={cost_fact.value} vs CSV={csv_rev}")
        
        # Determinism
        brief2 = saarthi.generate_cabinet_briefing(pid)
        if brief.merkle_root != brief2.merkle_root:
            issues.append("NON-DETERMINISTIC merkle_root!")
        
        if issues:
            for iss in issues:
                saarthi_errors.append(f"{pid}: {iss}")
            print(f"  FAIL {pid}: {'; '.join(issues)}")
        else:
            saarthi_pass += 1
            
    except Exception as e:
        saarthi_errors.append(f"{pid}: EXCEPTION - {str(e)[:100]}")
    
    if (i + 1) % 10 == 0:
        print(f"  [{i+1}/{len(sample_ids)}] {saarthi_pass} pass")

saarthi_time = time.time() - t0
print(f"\n  PRAGATI-SAARTHI RESULT: {saarthi_pass}/{len(sample_ids)} PASSED, {len(saarthi_errors)} FAILED in {saarthi_time:.1f}s")

# =====================================================================
# GRAND FINAL REPORT
# =====================================================================
print(f"\n{'='*80}")
print("GRAND FINAL REPORT — FULL 2,207 PROJECT AUDIT")
print(f"{'='*80}")
print(f"  KAAL-CHAKRA:     {kaal_pass}/{TOTAL} passed ({kaal_time:.1f}s)")
print(f"  SETU-GRAPH:      {setu_pass}/{TOTAL} passed ({setu_time:.1f}s)")
print(f"  VITTA-VYUHA:     {vitta_pass}/{vitta_total} scenarios passed ({vitta_time:.1f}s)")
print(f"  PRAGATI-SAARTHI: {saarthi_pass}/{len(sample_ids)} briefings passed ({saarthi_time:.1f}s)")

total_errors = len(kaal_errors) + len(setu_errors) + len(vitta_errors) + len(saarthi_errors)
print(f"\n  TOTAL ERRORS: {total_errors}")

if total_errors == 0:
    print("\n  ALL 2,207 PROJECTS VERIFIED. ZERO ERRORS.")
else:
    print(f"\n  ERRORS FOUND:")
    all_errs = kaal_errors + setu_errors + vitta_errors + saarthi_errors
    for e in all_errs[:50]:
        print(f"    - {e}")
    if len(all_errs) > 50:
        print(f"    ... and {len(all_errs) - 50} more")

print(f"{'='*80}")
