"""
PRAKALP-DRISHTI: TEMPORAL MILESTONE AUDIT (KAAL-DARPAN)

The rule this suite exists to defend
------------------------------------
NO SATELLITE-DERIVED COMPLETION PERCENTAGE, AND NO CLAIMED-MINUS-DETECTED SCORE.

Surface change and reported progress are uncorrelated in this corpus (measured in
artifacts/eo_progress_independence.json). A
"satellite says 38.4% complete" figure is therefore a guess wearing the costume of a
measurement, and a fraud badge computed from it would accuse named government
contractors on the strength of noise. Such a figure existed in this system once and was
removed for being 45%-weighted on the very claim it purported to audit.

The first test below asserts, structurally, that it has not come back -- not that the
current fields are right, but that no field ANYWHERE in the payload reports a
satellite-derived progress or discrepancy figure. A future contributor adding
`detected_progress_pct` fails this suite the day they add it.

The rest asserts the verdict logic: that the one actionable verdict fires when it
should, never fires where the sensor is blind, and always recommends inspection rather
than asserting wrongdoing.
"""

import json
import os
import sys
from datetime import date

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)

from analytics_engine.temporal_audit import (                       # noqa: E402
    ACTIONABLE, ACTIVITY_FLOOR_PCT, BASELINE, GROUND_ACTIVITY_OBSERVED,
    MATERIAL_PROGRESS_DELTA_PCT, MILESTONE_TYPES, NO_ACTIVITY_DETECTED,
    NO_IMAGERY_FOR_INTERVAL, NOT_MATERIAL, SENSOR_CANNOT_RESOLVE, VERDICTS,
    ImageryEpoch, Milestone, build_timeline, surface_change_expected,
)

_checks = 0
_failures = []


def check(name, ok, detail=""):
    global _checks
    _checks += 1
    print(f"  [{'PASS' if ok else 'FAIL'}] {name}" + (f"  -- {detail}" if detail else ""))
    if not ok:
        _failures.append(f"{name}: {detail}")


def ms(day, pct, mtype="MONTHLY_PROGRESS", pid="1"):
    return Milestone(f"M{day.isoformat()}", pid, day, pct, mtype)


ROAD_EPOCHS = [
    ImageryEpoch("E0", date(2021, 1, 1), "2021-01"),
    ImageryEpoch("E1", date(2023, 6, 1), "2023-06", surface_change_pct=14.0),
    ImageryEpoch("E2", date(2026, 1, 1), "2026-01", surface_change_pct=9.5),
]


# ---------------------------------------------------------------------------------
print("\n--- TEST 1: NO FABRICATED PROGRESS FIGURE ANYWHERE (the invariant) ---")
# ---------------------------------------------------------------------------------

tl = build_timeline(
    [ms(date(2021, 2, 1), 0.0, "SANCTION"), ms(date(2023, 8, 1), 45.0),
     ms(date(2025, 12, 1), 90.0)],
    ROAD_EPOCHS, sector="Roads & Highways", project_name="NH-44 Package 3")

BANNED_SUBSTRINGS = ("detected_progress", "satellite_detected", "discrepancy",
                     "inferred_progress", "estimated_progress", "actual_progress",
                     "measured_progress", "completion_pct", "fraud")


def walk_keys(obj, path=""):
    if isinstance(obj, dict):
        for k, v in obj.items():
            yield f"{path}.{k}", k
            yield from walk_keys(v, f"{path}.{k}")
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            yield from walk_keys(v, f"{path}[{i}]")


offenders = [p for p, k in walk_keys(tl)
             if any(b in str(k).lower() for b in BANNED_SUBSTRINGS)]
check("no field reports a satellite-derived progress or discrepancy figure",
      not offenders, str(offenders[:5]))

check("the observed field is named for what it measures",
      all("observed_change_pct" in m for m in tl["milestones"]),
      "'observed_change_pct' is surface change, not completion")

_eo = json.load(open(os.path.join(BASE_DIR, "artifacts", "eo_progress_independence.json"), encoding="utf-8"))
_r = _eo["overall"]["pearson_r"]
check("the payload states the measured EO/progress independence figure",
      f"r = {_r:+.3f}" in tl["methodology"] and isinstance(tl.get("eo_progress_independence"), dict),
      f"artifact r={_r}; methodology={tl['methodology'][:90]!r}")
check("the cited figure is near zero", abs(_r) < 0.10, f"r={_r}")
check("the payload disclaims a completion estimate",
      "not completion" in tl["methodology"].lower()
      or "no satellite-derived completion" in tl["methodology"].lower())
check("the payload disclaims a finding of wrongdoing",
      "not a finding of wrongdoing" in tl["methodology"].lower())


# ---------------------------------------------------------------------------------
print("\n--- TEST 2: THE ACTIONABLE VERDICT FIRES WHEN IT SHOULD ---")
# ---------------------------------------------------------------------------------

flat = [ImageryEpoch("F0", date(2021, 1, 1), "2021-01"),
        ImageryEpoch("F1", date(2026, 1, 1), "2026-01", surface_change_pct=0.4)]

tl_red = build_timeline(
    [ms(date(2021, 6, 1), 5.0, "SANCTION"), ms(date(2025, 6, 1), 62.0)],
    flat, sector="Roads & Highways", project_name="Greenfield Highway Package 4")
entry = tl_red["milestones"][1]

check("big claim + surface-visible + no change => NO_ACTIVITY_DETECTED",
      entry["verdict"] == NO_ACTIVITY_DETECTED, entry["verdict"])
check("it is marked actionable", entry["actionable"] is True)
check("it recommends INSPECTION, not fraud",
      "inspection" in entry["reason"].lower()
      and "not a finding of wrongdoing" in entry["reason"].lower(),
      entry["reason"][:80])
check("it reports the observed figure it actually measured",
      entry["observed_change_pct"] == 0.4, str(entry["observed_change_pct"]))
check("it reports the CLAIMED delta separately",
      entry["claimed_delta_pct"] == 57.0, str(entry["claimed_delta_pct"]))
check("the two are never subtracted into a score",
      "discrepancy" not in str(entry).lower())


# ---------------------------------------------------------------------------------
print("\n--- TEST 3: IT NEVER FIRES WHERE THE SENSOR IS BLIND ---")
# ---------------------------------------------------------------------------------

BLIND = [
    ("Roads & Highways", "Zojila Tunnel Construction", "tunnel in a surface sector"),
    ("Roads & Highways", "Underground Utility Corridor", "underground works"),
    ("Urban Public Transport", "Bhopal Metro Rail Project", "metro sector"),
    ("Telecommunication", "BharatNet Phase 2", "buried cable"),
    ("Healthcare", "200 bed ESI Hospital", "interior fit-out"),
    ("Oil & Gas", "Trunk Pipeline Section 4", "buried pipeline"),
]

for sector, name, why in BLIND:
    t = build_timeline(
        [ms(date(2021, 6, 1), 5.0, "SANCTION"), ms(date(2025, 6, 1), 70.0)],
        flat, sector=sector, project_name=name)
    verdicts = {m["verdict"] for m in t["milestones"]}
    check(f"no red verdict for {why}",
          NO_ACTIVITY_DETECTED not in verdicts,
          f"{sector} / {name} -> {verdicts}")
    check(f"  and it says why ({why})",
          not t["surface_change_expected"] and bool(t["surface_expectation_reason"]))

# A tunnel inside a surface sector must NOT inherit the sector's visibility.
exp_road, _ = surface_change_expected("Roads & Highways", "NH-44 Package 3")
exp_tun, reason = surface_change_expected("Roads & Highways", "Zojila Tunnel")
check("name check overrides sector, and only ever downward",
      exp_road is True and exp_tun is False, f"road={exp_road} tunnel={exp_tun}")
check("the override explains itself", "tunnel" in reason.lower())


# ---------------------------------------------------------------------------------
print("\n--- TEST 4: HONEST SILENCE WHEN THERE IS NOTHING TO SAY ---")
# ---------------------------------------------------------------------------------

# No imagery brackets the interval.
t = build_timeline(
    [ms(date(2027, 1, 1), 10.0, "SANCTION"), ms(date(2027, 6, 1), 60.0)],
    ROAD_EPOCHS, sector="Roads & Highways", project_name="Some Road")
check("no bracketing imagery => NO_IMAGERY_FOR_INTERVAL",
      t["milestones"][1]["verdict"] == NO_IMAGERY_FOR_INTERVAL,
      t["milestones"][1]["verdict"])
check("and it does not invent an observed figure",
      t["milestones"][1]["observed_change_pct"] is None)

# A small claimed delta should not be expected to produce a signal.
t = build_timeline(
    [ms(date(2021, 2, 1), 40.0, "SANCTION"), ms(date(2023, 8, 1), 48.0)],
    ROAD_EPOCHS, sector="Roads & Highways", project_name="Some Road")
check(f"delta below {MATERIAL_PROGRESS_DELTA_PCT:.0f} points => NOT_MATERIAL",
      t["milestones"][1]["verdict"] == NOT_MATERIAL, t["milestones"][1]["verdict"])

# An unmeasured epoch in the span must not be summed as if it were zero.
gappy = [ImageryEpoch("G0", date(2021, 1, 1), "2021-01"),
         ImageryEpoch("G1", date(2023, 1, 1), "2023-01", surface_change_pct=None),
         ImageryEpoch("G2", date(2026, 1, 1), "2026-01", surface_change_pct=8.0)]
t = build_timeline(
    [ms(date(2021, 6, 1), 5.0, "SANCTION"), ms(date(2025, 6, 1), 70.0)],
    gappy, sector="Roads & Highways", project_name="Some Road")
check("an unmeasured epoch in the span yields NO_IMAGERY, not a partial sum",
      t["milestones"][1]["verdict"] == NO_IMAGERY_FOR_INTERVAL,
      "a partial sum would understate the interval and could manufacture a red verdict")

check("the first milestone is BASELINE, never judged",
      tl["milestones"][0]["verdict"] == BASELINE)
check("BASELINE is not actionable", tl["milestones"][0]["actionable"] is False)


# ---------------------------------------------------------------------------------
print("\n--- TEST 5: ACTIVITY OBSERVED, AND CONTRACT SHAPE ---")
# ---------------------------------------------------------------------------------

t = build_timeline(
    [ms(date(2021, 2, 1), 0.0, "SANCTION"), ms(date(2023, 8, 1), 45.0)],
    ROAD_EPOCHS, sector="Roads & Highways", project_name="NH-44 Package 3")
e = t["milestones"][1]
check("change above the floor => GROUND_ACTIVITY_OBSERVED",
      e["verdict"] == GROUND_ACTIVITY_OBSERVED, e["verdict"])
check("GROUND_ACTIVITY_OBSERVED is not actionable", e["actionable"] is False)
check("it names both dated epochs it compared",
      bool(e["epoch_from"]) and bool(e["epoch_to"]))
check(f"the activity floor is {ACTIVITY_FLOOR_PCT}%",
      t["thresholds"]["activity_floor_pct"] == ACTIVITY_FLOOR_PCT)

check("only one verdict is actionable", len(ACTIONABLE) == 1
      and ACTIONABLE[0] == NO_ACTIVITY_DETECTED, str(ACTIONABLE))
check("every emitted verdict is in the declared vocabulary",
      all(m["verdict"] in VERDICTS for m in t["milestones"]))
check("verdict counts are reported", isinstance(t["verdict_counts"], dict)
      and sum(t["verdict_counts"].values()) == len(t["milestones"]))
check("milestone type vocabulary is non-empty and includes SANCTION",
      "SANCTION" in MILESTONE_TYPES and len(MILESTONE_TYPES) >= 5)
check("milestones with no date are dropped rather than guessed",
      len(build_timeline([Milestone("X", "1", None, 50.0)], ROAD_EPOCHS,
                         sector="Roads & Highways")["milestones"]) == 0)


# ---------------------------------------------------------------------------------
print()
print("=" * 78)
if _failures:
    print(f"TEMPORAL AUDIT FAILED: {len(_failures)} of {_checks} checks")
    for f in _failures:
        print(f"  - {f}")
    print("=" * 78)
    sys.exit(1)

print(f"ASSERTIONS PASSED: {_checks} temporal-audit checks, 0 failures.")
print("  no completion figure, no discrepancy score, no fraud verdict.")
print("=" * 78)
