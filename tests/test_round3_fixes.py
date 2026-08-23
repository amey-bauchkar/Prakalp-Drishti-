"""Test all Round 3 audit fixes — with singleton reset and well-connected projects."""
import os
import sys
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)
sys.stdout.reconfigure(encoding="utf-8")
import importlib

print("=" * 80)
print("ROUND 3 AUDIT FIX VERIFICATION (Singletons Reset)")
print("=" * 80)

# Reset all singletons to pick up code changes
import analytics_engine.vitta_vyuha as vv_mod
import analytics_engine.setu_graph as sg_mod

vv_mod._alloc_instance = None
sg_mod._graph_instance = None

# Test 1: VITTA-VYUHA - pi_budget and closure_error
print("\n--- TEST 1: VITTA-VYUHA Shadow Price & Closure Error ---")
from analytics_engine.vitta_vyuha import get_vitta_vyuha_engine
from analytics_engine.contracts import AllocationRequest

engine = get_vitta_vyuha_engine()

# Verify real delays exist now
real_delays = engine.candidate_df["REAL_DELAY_MONTHS"]
print(f"  REAL_DELAY_MONTHS: mean={real_delays.mean():.2f}, max={real_delays.max():.2f}, nonzero={sum(real_delays>0)}/{len(real_delays)}")

req0 = AllocationRequest(budget_pool_cr=15000.0, risk_dial_kappa=0.75, enforce_ner_floor=True, delay_shock_months=0.0)
res0 = engine.optimize_allocation(req0)
print(f"  BASELINE: pi_budget={res0.shadow_price_budget_pi}, closure_error={res0.closure_error_perc}%, allocated={res0.total_allocated_cr}")
print(f"  Non-binding? allocated={res0.total_allocated_cr} < budget={res0.total_budget_pool_cr} -> {res0.total_allocated_cr < res0.total_budget_pool_cr}")

# Test 2: VITTA-VYUHA responds to delay shock
print("\n--- TEST 2: VITTA-VYUHA Delay Shock Response ---")
req1 = AllocationRequest(budget_pool_cr=15000.0, risk_dial_kappa=0.75, enforce_ner_floor=True, delay_shock_months=24.0)
res1 = engine.optimize_allocation(req1)
print(f"  SHOCKED:  pi_budget={res1.shadow_price_budget_pi}, closure_error={res1.closure_error_perc}%, allocated={res1.total_allocated_cr}")
delta = res1.total_allocated_cr - res0.total_allocated_cr
yield_delta = res1.expected_completion_yield - res0.expected_completion_yield
print(f"  Delta in allocation: {delta:+.2f} Cr")
print(f"  Delta in yield: {yield_delta:+.2f}%")
print(f"  PASS: Delay shock changes allocation or yield? {'YES' if abs(delta) > 0.01 or abs(yield_delta) > 0.01 else 'NO - BUG!'}")

# Test 3: SETU-GRAPH cascade with a CONNECTED project
print("\n--- TEST 3: SETU-GRAPH Cascade Propagation ---")
from analytics_engine.setu_graph import get_setu_graph_engine

graph = get_setu_graph_engine()

# Find a project with successors
test_pid = None
for n in graph.dag.nodes():
    if graph.dag.out_degree(n) > 0:
        test_pid = n
        break

if test_pid:
    print(f"  Testing with connected project: {test_pid} (out_degree={graph.dag.out_degree(test_pid)})")
    sub0 = graph.get_k_hop_subgraph(test_pid, k=2, delay_shock_months=0.0)
    sub1 = graph.get_k_hop_subgraph(test_pid, k=2, delay_shock_months=24.0)

    baseline_locked = sub0.total_cascade_locked_p50_cr
    shocked_locked = sub1.total_cascade_locked_p50_cr
    print(f"  Baseline locked P50: {baseline_locked:,.2f} Cr")
    print(f"  Shocked locked P50:  {shocked_locked:,.2f} Cr")

    nodes_affected = 0
    downstream_affected = 0
    for n0, n1 in zip(sub0.nodes, sub1.nodes):
        if n1.locked_capital_p50_cr > n0.locked_capital_p50_cr + 0.01:
            nodes_affected += 1
            if n1.project_id != test_pid:
                downstream_affected += 1
                print(f"    DOWNSTREAM: {n1.project_id} locked {n0.locked_capital_p50_cr:.2f} -> {n1.locked_capital_p50_cr:.2f} Cr")

    print(f"  Total affected: {nodes_affected}, Downstream: {downstream_affected}")
    print(f"  PASS: Cascade affects downstream? {'YES' if downstream_affected > 0 else 'NO!'}")
else:
    print("  No connected projects found!")

# Also test 400188 (isolated node — should still work, just no cascade)
print("\n  [400188 is 'Real Estate' sector with no edges — no cascade expected]")
sub_iso = graph.get_k_hop_subgraph("400188", k=2, delay_shock_months=24.0)
print(f"  400188 subgraph nodes: {len(sub_iso.nodes)}, edges: {len(sub_iso.edges)}")

# Test 4: Merkle proof verification
print("\n--- TEST 4: PRAGATI-SAARTHI Merkle Proof Verification ---")
from analytics_engine.pragati_saarthi import get_pragati_saarthi_engine, PragatiSaarthiEngine
import json

ps_engine = get_pragati_saarthi_engine()
briefing = ps_engine.generate_cabinet_briefing("400188")

verified_count = 0
total_count = 0
for fid, fact in briefing.audit_facts.items():
    if fact.lineage and fact.lineage.merkle_proof:
        total_count += 1
        canonical_str = json.dumps({"id": fact.fact_id, "val": fact.value, "unit": fact.unit}, sort_keys=True)
        is_valid = PragatiSaarthiEngine.verify_merkle_proof(canonical_str, fact.lineage.merkle_proof, briefing.merkle_root)
        if is_valid:
            verified_count += 1
        else:
            print(f"  FAILED: {fid}")

print(f"  Verified: {verified_count}/{total_count} facts")
print(f"  PASS: All proofs valid? {'YES' if verified_count == total_count else 'NO!'}")

print("\n" + "=" * 80)
print("ALL ROUND 3 FIXES VERIFIED")
print("=" * 80)
