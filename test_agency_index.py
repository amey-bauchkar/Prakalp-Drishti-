import sys
sys.stdout.reconfigure(encoding="utf-8")
from analytics_engine.agency_index import get_agency_index_engine

eng = get_agency_index_engine()
s = eng.get_agency_summary()

print("=" * 90)
print(f"AGENCY ACCOUNTABILITY INDEX (AEAI) — REAL DELAY METRICS")
print("=" * 90)
print(f"Total Monitored: {s['total_agencies_monitored']} executing agencies")
print(f"Tier 1 (Exemplary): {s['tier_1_agencies']}")
print(f"Tier 2 (Watchlist): {s['tier_2_agencies']}")
print(f"Tier 3 (Critical):  {s['tier_3_agencies']}")
print("-" * 90)
print(f"{'Agency Name':<28} {'Projects':<9} {'Delayed':<18} {'Avg Delay':<12} {'Capex (Cr)':<15} {'Tier'}")
print("-" * 90)

for a in s["agencies"][:12]:
    delay_str = f"{a['delayed_projects']} ({a['delay_rate_perc']}%)"
    print(f"{a['agency_name']:<28} {a['total_projects']:<9} {delay_str:<18} {a['avg_delay_months']:<5.1f} mos    ₹{a['total_capex_cr']:<13,.0f} {a['performance_tier']}")
print("=" * 90)
