import os
import sys
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)
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


# ── ASSERTIONS ────────────────────────────────────────────────────────────
# Previously this file printed a table and exited 0 regardless of its contents:
# an empty index, negative delay rates or title-case-mangled acronyms all
# "passed". These are the invariants the table is supposed to demonstrate.
assert s["total_agencies_monitored"] > 0, "agency index returned no agencies"
assert len(s["agencies"]) == s["total_agencies_monitored"],     f'header count {s["total_agencies_monitored"]} != {len(s["agencies"])} rows'

names = [a["agency_name"] for a in s["agencies"]]
assert len(names) == len(set(names)), "duplicate agency display names"
assert not ({"Nhai", "Ntpc", "Morth", "Mohua", "Aai"} & set(names)),     "acronym mangled by title-casing"

for a in s["agencies"]:
    assert a["total_projects"] >= 1, f'{a["agency_name"]}: non-positive project count'
    assert 0 <= a["delay_rate_perc"] <= 100, f'{a["agency_name"]}: delay rate out of range'
    assert 0 <= a["velocity_score"] <= 100, f'{a["agency_name"]}: velocity out of range'
    assert a["delayed_projects"] <= a["total_projects"],         f'{a["agency_name"]}: more delayed than total'
    assert a["total_capex_cr"] >= 0, f'{a["agency_name"]}: negative capex'
    assert a["performance_tier"] in ("TIER_1_EXEMPLARY", "TIER_2_WATCHLIST",
                                     "TIER_3_CRITICAL"), a["performance_tier"]

tiers = s["tier_1_agencies"] + s["tier_2_agencies"] + s["tier_3_agencies"]
assert tiers == s["total_agencies_monitored"],     f"tier counts {tiers} do not partition {s['total_agencies_monitored']} agencies"
print(f"ASSERTIONS PASSED: {len(s['agencies'])} agencies, tiers partition cleanly.")
