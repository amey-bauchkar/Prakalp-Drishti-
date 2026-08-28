import os, sys
# Run directly (python tests/test_kappa_sensitivity.py) the repo root is not
# on sys.path, so the analytics_engine import raised ModuleNotFoundError.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
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


# ── invariants ───────────────────────────────────────────────────────────────
# The risk dial must actually do something, and must do it in the right
# direction. This file previously swept kappa and printed the results, so a
# dial wired backwards -- or not wired at all -- printed a tidy table and
# reported success.
from analytics_engine.contracts import AllocationRequest as _AR

_eng = get_vitta_vyuha_engine()
_res = {k: _eng.optimize_allocation(_AR(budget_pool_cr=12000.0, risk_dial_kappa=k))
        for k in (0.0, 0.5, 1.0)}

for _k, _r in _res.items():
    assert 0 <= _r.total_allocated_cr <= 12000.0 * 1.0001, \
        f"kappa={_k}: allocated {_r.total_allocated_cr} outside the pool"
    assert 0.0 <= _r.portfolio_completion_propensity_perc <= 100.0, \
        f"kappa={_k}: propensity {_r.portfolio_completion_propensity_perc} is not a percentage"
    assert _r.ner_share_perc >= 9.9, \
        f"kappa={_k}: NER share {_r.ner_share_perc}% breaches the 10% statutory floor"

# Raising kappa weights CVaR90 tail loss more heavily, so the risk-averse
# portfolio must not carry MORE tail loss than the risk-neutral one.
assert _res[1.0].cvar90_tail_loss <= _res[0.0].cvar90_tail_loss + 1e-6, \
    (f"the risk dial is inverted: kappa=1.0 gives CVaR "
     f"{_res[1.0].cvar90_tail_loss} against {_res[0.0].cvar90_tail_loss} at kappa=0.0")

# And it must not be inert.
assert (_res[0.0].cvar90_tail_loss != _res[1.0].cvar90_tail_loss
        or _res[0.0].total_allocated_cr != _res[1.0].total_allocated_cr), \
    "kappa changes nothing at all — the risk dial is not connected to the LP"

print("\nASSERTIONS PASSED")
