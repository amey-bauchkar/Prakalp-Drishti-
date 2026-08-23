import sys
sys.stdout.reconfigure(encoding="utf-8")
from analytics_engine.vitta_vyuha import get_vitta_vyuha_engine
from analytics_engine.contracts import AllocationRequest

eng = get_vitta_vyuha_engine()

print("=" * 80)
print("TESTING RISK DIAL (KAPPA) SENSITIVITY")
print("=" * 80)

for b in [12000.0, 5000.0, 3000.0]:
    print(f"\n--- Budget Pool: Rs. {b:,.0f} Cr ---")
    for k in [0.0, 0.25, 0.50, 0.75, 1.0]:
        req = AllocationRequest(budget_pool_cr=b, risk_dial_kappa=k, enforce_ner_floor=True)
        res = eng.optimize_allocation(req)
        print(f"  kappa={k:4.2f} -> Allocated: Rs. {res.total_allocated_cr:,.2f} Cr | Expected Yield: {res.expected_completion_yield:.2f}% | CVaR90 Loss: {res.cvar90_tail_loss:.2f} | NER Share: {res.ner_share_perc:.1f}%")
        # Check first 5 project allocations
        p_allocs = [p.allocated_capex_cr for p in res.allocations[:5]]
        print(f"             Top 5 project allocs: {p_allocs}")
