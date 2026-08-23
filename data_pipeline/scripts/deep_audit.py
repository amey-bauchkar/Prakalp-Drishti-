"""
PRAKALP-DRISHTI: Deep End-to-End Data Integrity Audit
Traces raw CSV → Engine Calculations → API Output for every field.
Any mismatch is flagged as a CRITICAL error.
"""
import sys, os, json, hashlib
import pandas as pd
import numpy as np

sys.stdout.reconfigure(encoding='utf-8')
os.chdir(r'c:\Users\SEBIN\Desktop\SIH PS')
sys.path.insert(0, os.getcwd())

from analytics_engine.kaal_chakra import get_kaal_chakra_engine
from analytics_engine.setu_graph import get_setu_graph_engine
from analytics_engine.vitta_vyuha import get_vitta_vyuha_engine, AllocationRequest
from analytics_engine.pragati_saarthi import get_pragati_saarthi_engine

# Load raw CSV for ground truth
df = pd.read_csv('paimana_extracted/PAIMANA_MASTER_PROJECTS_DATABASE.csv')
df['OriginalCost'] = pd.to_numeric(df['OriginalCost'], errors='coerce').fillna(500.0)
df['RevisedCost'] = pd.to_numeric(df['RevisedCost'], errors='coerce').fillna(df['OriginalCost'])
df['Expenditure'] = pd.to_numeric(df['Expenditure'], errors='coerce').fillna(0.0)
df['PhysicalProgress'] = pd.to_numeric(df['PhysicalProgress'], errors='coerce').fillna(20.0)
df['DELAYED_TIME'] = pd.to_numeric(df['DELAYED_TIME'], errors='coerce').fillna(0.0)

TEST_IDS = ['400188', '705728', '705237', '618373', '400259', '702668', '618934', '701263']
errors = []
warnings = []

print("=" * 80)
print("DEEP DATA INTEGRITY AUDIT — PRAKALP-DRISHTI")
print("=" * 80)

# ========================================================================
# AUDIT 1: KAAL-CHAKRA — Field-by-Field CSV vs Engine Output
# ========================================================================
print("\n" + "=" * 80)
print("AUDIT 1: KAAL-CHAKRA (Schedule Survival Forecasting)")
print("=" * 80)

kaal = get_kaal_chakra_engine()

for pid in TEST_IDS:
    raw = df[df['ProjectId'].astype(str) == pid]
    if raw.empty:
        warnings.append(f"KAAL: Project {pid} not found in CSV")
        continue
    raw = raw.iloc[0]
    
    forecast = kaal.forecast_project(pid)
    
    print(f"\n--- Project {pid}: {raw['ProjectName'][:60]} ---")
    
    # Check project_id
    if str(forecast.project_id) != str(pid):
        errors.append(f"KAAL {pid}: project_id mismatch: forecast={forecast.project_id} vs expected={pid}")
        print(f"  ❌ project_id MISMATCH: {forecast.project_id} vs {pid}")
    else:
        print(f"  ✅ project_id: {forecast.project_id}")
    
    # Check project_name
    if forecast.project_name != str(raw['ProjectName']):
        errors.append(f"KAAL {pid}: project_name mismatch")
        print(f"  ❌ project_name MISMATCH")
        print(f"     CSV:    '{raw['ProjectName'][:60]}'")
        print(f"     Engine: '{forecast.project_name[:60]}'")
    else:
        print(f"  ✅ project_name matches CSV")
    
    # Check original_cost_cr
    csv_orig = float(raw['OriginalCost'])
    if abs(forecast.original_cost_cr - csv_orig) > 0.01:
        errors.append(f"KAAL {pid}: original_cost_cr mismatch: engine={forecast.original_cost_cr} vs csv={csv_orig}")
        print(f"  ❌ original_cost_cr: Engine={forecast.original_cost_cr} vs CSV={csv_orig}")
    else:
        print(f"  ✅ original_cost_cr: ₹{forecast.original_cost_cr:,.2f} Cr")
    
    # Check revised_cost_cr
    csv_rev = float(raw['RevisedCost'])
    if abs(forecast.revised_cost_cr - csv_rev) > 0.01:
        errors.append(f"KAAL {pid}: revised_cost_cr mismatch: engine={forecast.revised_cost_cr} vs csv={csv_rev}")
        print(f"  ❌ revised_cost_cr: Engine={forecast.revised_cost_cr} vs CSV={csv_rev}")
    else:
        print(f"  ✅ revised_cost_cr: ₹{forecast.revised_cost_cr:,.2f} Cr")
    
    # Check cost_overrun_perc calculation
    expected_overrun = ((csv_rev - csv_orig) / csv_orig * 100.0) if csv_orig > 0 else 0.0
    if abs(forecast.cost_overrun_perc - expected_overrun) > 0.1:
        errors.append(f"KAAL {pid}: cost_overrun_perc mismatch: engine={forecast.cost_overrun_perc:.1f}% vs calculated={expected_overrun:.1f}%")
        print(f"  ❌ cost_overrun_perc: Engine={forecast.cost_overrun_perc:.1f}% vs Calculated={expected_overrun:.1f}%")
    else:
        print(f"  ✅ cost_overrun_perc: {forecast.cost_overrun_perc:.1f}%")
    
    # Check rebaselined flag logic
    expected_rebaselined = csv_rev > csv_orig * 1.05
    if forecast.rebaselined != expected_rebaselined:
        errors.append(f"KAAL {pid}: rebaselined flag mismatch: engine={forecast.rebaselined} vs expected={expected_rebaselined} (orig={csv_orig}, rev={csv_rev})")
        print(f"  ❌ rebaselined: Engine={forecast.rebaselined} vs Expected={expected_rebaselined}")
    else:
        print(f"  ✅ rebaselined: {forecast.rebaselined}")
    
    # Check sector and state match CSV
    csv_sector = str(raw['SectorName'])
    if forecast.sector != csv_sector:
        errors.append(f"KAAL {pid}: sector mismatch: engine='{forecast.sector}' vs csv='{csv_sector}'")
        print(f"  ❌ sector: Engine='{forecast.sector}' vs CSV='{csv_sector}'")
    else:
        print(f"  ✅ sector: {forecast.sector}")
    
    # Check fact_cost formatted value
    fact_cost = forecast.facts.get('fact_cost')
    if fact_cost:
        if abs(fact_cost.value - csv_rev) > 0.01:
            errors.append(f"KAAL {pid}: fact_cost.value mismatch: {fact_cost.value} vs csv={csv_rev}")
            print(f"  ❌ fact_cost.value: {fact_cost.value} vs CSV RevisedCost={csv_rev}")
        else:
            print(f"  ✅ fact_cost.value: {fact_cost.value} = CSV RevisedCost")
    
    # Check prob_target_met is in [0,1]
    prob = forecast.prob_target_met_official
    if prob < 0 or prob > 1:
        errors.append(f"KAAL {pid}: prob_target_met_official out of range: {prob}")
        print(f"  ❌ prob_target_met_official OUT OF RANGE: {prob}")
    else:
        print(f"  ✅ prob_target_met_official: {prob:.4f} ({prob*100:.1f}%) — in valid [0,1] range")
    
    # Check quantile ordering (P10 <= P50 <= P80 <= P95)
    dates = [forecast.p10_date, forecast.p50_date, forecast.p80_date, forecast.p95_date]
    print(f"  ℹ️  Quantile dates: P10={dates[0]}, P50={dates[1]}, P80={dates[2]}, P95={dates[3]}")
    if dates != sorted(dates):
        errors.append(f"KAAL {pid}: Quantile dates NOT monotone: {dates}")
        print(f"  ❌ QUANTILE DATES NOT MONOTONE (M1 violation!)")
    else:
        print(f"  ✅ Quantile dates are monotone (M1 guaranteed)")
    
    # Check lineage hashes are non-empty
    if fact_cost and fact_cost.lineage:
        if not fact_cost.lineage.dataset_sha256:
            errors.append(f"KAAL {pid}: empty dataset_sha256 in lineage")
            print(f"  ❌ Empty dataset_sha256 in fact lineage")
        else:
            print(f"  ✅ Lineage dataset_sha256: {fact_cost.lineage.dataset_sha256[:16]}...")
    
    # Check formatted_value consistency
    if fact_cost:
        expected_formatted = f"₹{csv_rev:,.2f} Cr"
        if fact_cost.formatted_value != expected_formatted:
            errors.append(f"KAAL {pid}: fact_cost.formatted_value mismatch: '{fact_cost.formatted_value}' vs '{expected_formatted}'")
            print(f"  ❌ fact_cost.formatted_value: '{fact_cost.formatted_value}' vs expected '{expected_formatted}'")
        else:
            print(f"  ✅ fact_cost.formatted_value: '{fact_cost.formatted_value}'")


# ========================================================================
# AUDIT 2: SETU-GRAPH — DAG Integrity & Float Logic
# ========================================================================
print("\n" + "=" * 80)
print("AUDIT 2: SETU-GRAPH (Dependency DAG & Float Absorption)")
print("=" * 80)

setu = get_setu_graph_engine()
import networkx as nx

# Check DAG is truly acyclic
is_dag = nx.is_directed_acyclic_graph(setu.dag)
if not is_dag:
    errors.append("SETU: Master DAG is NOT acyclic — Tarjan condensation failed!")
    print(f"  ❌ CRITICAL: Master DAG is NOT acyclic!")
else:
    print(f"  ✅ Master DAG is acyclic (Tarjan SCC condensation verified)")

print(f"  ℹ️  Total nodes: {setu.dag.number_of_nodes()}, Total edges: {setu.dag.number_of_edges()}")

for pid in TEST_IDS[:5]:
    sub = setu.get_k_hop_subgraph(pid, k=2)
    print(f"\n  --- Subgraph for {pid} (k=2) ---")
    print(f"  ✅ Nodes: {len(sub.nodes)}, Edges: {len(sub.edges)}, Acyclic: {sub.acyclic_dag_verified}")
    
    if not sub.acyclic_dag_verified:
        errors.append(f"SETU {pid}: subgraph acyclic_dag_verified is False!")
    
    # Verify node data matches CSV
    for node in sub.nodes:
        node_raw = df[df['ProjectId'].astype(str) == str(node.project_id)]
        if node_raw.empty:
            continue
        node_raw = node_raw.iloc[0]
        csv_cost = float(node_raw['RevisedCost'])
        if abs(node.cost_cr - csv_cost) > 0.01:
            errors.append(f"SETU {pid}: node {node.project_id} cost_cr mismatch: {node.cost_cr} vs csv={csv_cost}")
            print(f"    ❌ Node {node.project_id}: cost_cr={node.cost_cr} vs CSV={csv_cost}")
        
        # Free float should be >= 0
        if node.free_float_months < 0:
            errors.append(f"SETU {pid}: node {node.project_id} negative free_float: {node.free_float_months}")
            print(f"    ❌ Node {node.project_id}: NEGATIVE free_float={node.free_float_months}")
    
    # Locked capex P50 <= P95
    if sub.total_cascade_locked_p50_cr > sub.total_cascade_locked_p95_cr + 0.01:
        errors.append(f"SETU {pid}: P50 locked > P95 locked ({sub.total_cascade_locked_p50_cr} > {sub.total_cascade_locked_p95_cr})")
        print(f"    ❌ P50 locked ({sub.total_cascade_locked_p50_cr}) > P95 locked ({sub.total_cascade_locked_p95_cr})")
    else:
        print(f"    ✅ P50 ₹{sub.total_cascade_locked_p50_cr:,.2f} Cr <= P95 ₹{sub.total_cascade_locked_p95_cr:,.2f} Cr")


# ========================================================================
# AUDIT 3: VITTA-VYUHA — MILP Constraint Satisfaction
# ========================================================================
print("\n" + "=" * 80)
print("AUDIT 3: VITTA-VYUHA (Stochastic MILP Allocation)")
print("=" * 80)

vitta = get_vitta_vyuha_engine()

for budget in [5000, 12000, 30000]:
    for kappa in [0.3, 0.75]:
        req = AllocationRequest(budget_pool_cr=float(budget), risk_dial_kappa=kappa, enforce_ner_floor=True)
        res = vitta.optimize_allocation(req)
        
        print(f"\n  --- Budget=₹{budget:,} Cr, κ={kappa} ---")
        
        # 1. Total allocated <= budget
        if res.total_allocated_cr > budget + 0.01:
            errors.append(f"VITTA B={budget} k={kappa}: total_allocated ({res.total_allocated_cr}) > budget ({budget})")
            print(f"  ❌ BUDGET VIOLATION: Allocated ₹{res.total_allocated_cr:,.2f} > Budget ₹{budget:,}")
        else:
            print(f"  ✅ Budget constraint: Allocated ₹{res.total_allocated_cr:,.2f} <= Budget ₹{budget:,}")
        
        # 2. NER share >= 10% (when enforced)
        if res.ner_share_perc < 9.9:
            errors.append(f"VITTA B={budget} k={kappa}: NER share {res.ner_share_perc:.1f}% < 10% statutory floor")
            print(f"  ❌ NER FLOOR VIOLATION: {res.ner_share_perc:.1f}% < 10%")
        else:
            print(f"  ✅ NER 10% statutory floor: {res.ner_share_perc:.1f}% (Met!)")
        
        # 3. No negative allocations
        neg_allocs = [a for a in res.allocations if a.allocated_capex_cr < -0.01]
        if neg_allocs:
            errors.append(f"VITTA B={budget} k={kappa}: {len(neg_allocs)} negative allocations found!")
            print(f"  ❌ {len(neg_allocs)} NEGATIVE ALLOCATIONS")
        else:
            print(f"  ✅ All allocations non-negative")
        
        # 4. Sum of individual allocations = total_allocated
        sum_allocs = sum(a.allocated_capex_cr for a in res.allocations)
        if abs(sum_allocs - res.total_allocated_cr) > 0.1:
            errors.append(f"VITTA B={budget} k={kappa}: sum mismatch: sum={sum_allocs:.2f} vs total={res.total_allocated_cr:.2f}")
            print(f"  ❌ SUM MISMATCH: sum(allocations)={sum_allocs:.2f} vs total_allocated={res.total_allocated_cr:.2f}")
        else:
            print(f"  ✅ Allocation sum consistent: {sum_allocs:.2f}")
        
        # 5. Closure error < 5%
        if res.closure_error_perc > 5.0:
            errors.append(f"VITTA B={budget} k={kappa}: closure error {res.closure_error_perc}% > 5% threshold")
            print(f"  ❌ CLOSURE ERROR VIOLATION: {res.closure_error_perc}% > 5%")
        else:
            print(f"  ✅ Closure error: {res.closure_error_perc}% (< 5% threshold)")
        
        # 6. Solve time < 2000ms
        if res.solve_time_ms > 2000:
            errors.append(f"VITTA B={budget} k={kappa}: solve time {res.solve_time_ms}ms > 2s guarantee")
            print(f"  ❌ SOLVE TIME VIOLATION: {res.solve_time_ms}ms > 2000ms")
        else:
            print(f"  ✅ Solve time: {res.solve_time_ms}ms (< 2s guarantee)")
        
        # 7. Verify NER flag correctness against CSV
        ner_states = {'Assam', 'Arunachal Pradesh', 'Meghalaya', 'Manipur', 'Mizoram', 'Nagaland', 'Tripura', 'Sikkim'}
        for alloc in res.allocations:
            alloc_raw = df[df['ProjectId'].astype(str) == str(alloc.project_id)]
            if alloc_raw.empty:
                continue
            csv_state = str(alloc_raw.iloc[0]['StateName'])
            expected_ner = csv_state in ner_states
            if alloc.is_ner != expected_ner:
                errors.append(f"VITTA {alloc.project_id}: is_ner mismatch: engine={alloc.is_ner} vs csv_state='{csv_state}' (expected={expected_ner})")
                print(f"  ❌ NER FLAG MISMATCH for {alloc.project_id}: engine={alloc.is_ner}, state='{csv_state}'")


# ========================================================================
# AUDIT 4: PRAGATI-SAARTHI — Briefing Integrity & Merkle
# ========================================================================
print("\n" + "=" * 80)
print("AUDIT 4: PRAGATI-SAARTHI (Cabinet Briefing & Merkle Lineage)")
print("=" * 80)

saarthi = get_pragati_saarthi_engine()

for pid in TEST_IDS[:3]:
    print(f"\n  --- Briefing for Project {pid} ---")
    brief = saarthi.generate_cabinet_briefing(pid)
    
    # 1. Doc hash is non-empty
    if not brief.doc_hash or len(brief.doc_hash) < 32:
        errors.append(f"SAARTHI {pid}: empty or short doc_hash")
        print(f"  ❌ doc_hash empty or too short")
    else:
        print(f"  ✅ doc_hash: {brief.doc_hash[:24]}...")
    
    # 2. Merkle root is non-empty
    if not brief.merkle_root or len(brief.merkle_root) < 32:
        errors.append(f"SAARTHI {pid}: empty or short merkle_root")
        print(f"  ❌ merkle_root empty or too short")
    else:
        print(f"  ✅ merkle_root: {brief.merkle_root[:24]}...")
    
    # 3. Bilingual sections exist
    if len(brief.bilingual_sections) < 2:
        errors.append(f"SAARTHI {pid}: fewer than 2 bilingual sections")
        print(f"  ❌ Only {len(brief.bilingual_sections)} bilingual sections (expected >= 2)")
    else:
        print(f"  ✅ {len(brief.bilingual_sections)} bilingual sections present")
    
    # 4. Hindi title is non-empty
    if not brief.title_hi or len(brief.title_hi) < 10:
        errors.append(f"SAARTHI {pid}: Hindi title too short or missing")
        print(f"  ❌ Hindi title missing or too short")
    else:
        print(f"  ✅ Hindi title present: {brief.title_hi[:40]}...")
    
    # 5. Audit facts contain fact_cost with correct value
    cost_fact = None
    for fid, f in brief.audit_facts.items():
        if 'cost' in fid.lower():
            cost_fact = f
            break
    
    if cost_fact:
        raw = df[df['ProjectId'].astype(str) == pid].iloc[0]
        csv_rev = float(raw['RevisedCost'])
        if abs(cost_fact.value - csv_rev) > 0.01:
            errors.append(f"SAARTHI {pid}: fact_cost.value={cost_fact.value} vs CSV RevisedCost={csv_rev}")
            print(f"  ❌ fact_cost.value={cost_fact.value} vs CSV={csv_rev}")
        else:
            print(f"  ✅ fact_cost.value={cost_fact.value} matches CSV RevisedCost")
    
    # 6. Top decisions have action_agency
    for dec in brief.top_decisions:
        if not dec.get('action_agency'):
            errors.append(f"SAARTHI {pid}: decision missing action_agency")
            print(f"  ❌ Decision missing action_agency")
    
    # 7. Determinism check — same input yields same merkle_root
    brief2 = saarthi.generate_cabinet_briefing(pid)
    if brief.merkle_root != brief2.merkle_root:
        errors.append(f"SAARTHI {pid}: NON-DETERMINISTIC merkle_root across runs!")
        print(f"  ❌ NON-DETERMINISTIC: Two runs produced different merkle roots!")
    else:
        print(f"  ✅ Deterministic: Same input → same merkle_root")


# ========================================================================
# FINAL REPORT
# ========================================================================
print("\n" + "=" * 80)
print("FINAL AUDIT REPORT")
print("=" * 80)
print(f"Total ERRORS:   {len(errors)}")
print(f"Total WARNINGS: {len(warnings)}")

if errors:
    print("\n🔴 ERRORS (Must Fix):")
    for i, e in enumerate(errors, 1):
        print(f"  {i}. {e}")
else:
    print("\n🟢 ZERO ERRORS — All data integrity checks passed!")

if warnings:
    print("\n🟡 WARNINGS (Non-Critical):")
    for w in warnings:
        print(f"  • {w}")

print("\n" + "=" * 80)
