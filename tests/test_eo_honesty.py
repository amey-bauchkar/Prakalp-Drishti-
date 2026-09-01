"""
PRAKALP-DRISHTI: EO HONESTY INVARIANT

One rule, asserted mechanically:

    NO MEASUREMENT FIELD MAY CARRY A VALUE WHEN THERE IS NO IMAGERY BEHIND IT.

Why this needs a test rather than care
--------------------------------------
A project onboarded through /api/ingest has no BEFORE/AFTER tiles in the curated
corpus. The EO endpoint used to answer that state with:

    surface_change_pct        0.0
    mean_dissimilarity        0.0
    structural_dissimilarity  0.0
    registration_shift_px     0.0
    baseline_vintage          "2014-02"
    current_vintage           "<=2026-08 (ESRI live mosaic, fetch-bounded)"
    project_name              "Infrastructure Asset"
    sector                    "Roads & Highways"

Every line is a claim about imagery that does not exist. `0.0` surface change is the
dangerous one: it reads as "we looked and nothing has been built" -- a finding -- when
the truth is "we have not looked". Against a project reporting 50% progress that is
the shape of a fraud signal with nothing behind it. A 0.0 sub-pixel registration shift
additionally asserts that two images aligned perfectly; the two images were never
fetched. And the placeholder identity described a Railways corridor as a road, on the
one screen that exists to verify claims.

The generalised invariant below is what stops this returning. It does not enumerate
the fields that were wrong in one revision -- it asserts the property, so a NEW
measurement field added later is covered the day it is added.

The positive case is asserted too. A gate that nulls everything unconditionally would
pass an absence test while destroying the product, so a project WITH imagery must
still serve real figures.
"""

import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)

import backend.config  # noqa: F401,E402  -- loads .env so the corpus resolves as the server's

from analytics_engine.eo_geospatial import eo_readiness, sar_readiness   # noqa: E402
from analytics_engine.satellite_fusion import get_satellite_fusion_engine  # noqa: E402

_checks = 0
_failures = []


def check(name, ok, detail=""):
    global _checks
    _checks += 1
    print(f"  [{'PASS' if ok else 'FAIL'}] {name}" + (f"  -- {detail}" if detail else ""))
    if not ok:
        _failures.append(f"{name}: {detail}")


ENGINE = get_satellite_fusion_engine()

# Every field that reports a MEASUREMENT over an image pair. None of these can be
# meaningful without two images.
MEASUREMENT_FIELDS = (
    "surface_change_pct",
    "project_footprint_change_pct",
    "ambient_terrain_change_pct",
    "mean_dissimilarity",
    "structural_dissimilarity",
    "registration_shift_px",
    "change_box_count",
    "vegetation_excluded_pct",
    "gsd_m_per_px",
    "resolution_m",
    "roi_radius_m",
)

# Fields that assert PROVENANCE for imagery: naming an epoch for a scene that was
# never captured is the same class of fabrication as reporting a change figure.
PROVENANCE_FIELDS = ("baseline_vintage", "current_vintage")

VERDICT_FIELDS = ("sovereign_verdict",)


IMAGERY_DIR = os.path.join(BASE_DIR, "paimana_extracted", "satellite_data",
                           "project_imagery")


def find_project(with_imagery: bool):
    """
    A project id that does / does not have dual-epoch coverage.

    Candidates are chosen by checking for the tile FILES first, not by calling
    get_satellite_audit in a loop. The audit runs a ~290 ms precision chain per
    project, so scanning several hundred of them turned this suite into a
    multi-minute job to obtain two data points.
    """
    ids = []
    if ENGINE.df is not None:
        ids = [str(p) for p in ENGINE.df["ProjectId"].tolist()]
    ids = list(dict.fromkeys(ids + list(ENGINE.catalog.keys())))

    for pid in ids:
        has_files = (os.path.exists(os.path.join(IMAGERY_DIR, f"{pid}_BEFORE.jpg"))
                     and os.path.exists(os.path.join(IMAGERY_DIR, f"{pid}_AFTER.jpg")))
        if has_files is not with_imagery:
            continue
        audit = ENGINE.get_satellite_audit(str(pid))
        if bool(audit.get("has_dual_epoch_coverage")) == with_imagery:
            return str(pid), audit
    return None, None


# ---------------------------------------------------------------------------------
print("\n--- TEST 1: NO IMAGERY => NO MEASUREMENT (the invariant) ---")
# ---------------------------------------------------------------------------------

pid_absent, absent = find_project(with_imagery=False)
check("a project without dual-epoch imagery exists to test",
      absent is not None, str(pid_absent))

if absent:
    for f in MEASUREMENT_FIELDS:
        if f in absent:
            check(f"[{pid_absent}] {f} is null without imagery",
                  absent.get(f) is None, repr(absent.get(f)))

    for f in PROVENANCE_FIELDS:
        if f in absent:
            check(f"[{pid_absent}] {f} asserts no epoch without imagery",
                  absent.get(f) is None, repr(absent.get(f)))

    for f in VERDICT_FIELDS:
        if f in absent:
            check(f"[{pid_absent}] {f} is withheld without imagery",
                  absent.get(f) is None, repr(absent.get(f)))

    check(f"[{pid_absent}] eo_verdict_reliable is false",
          absent.get("eo_verdict_reliable") is False)
    check(f"[{pid_absent}] eo_unreliable_reason is STATED, not null",
          bool(absent.get("eo_unreliable_reason")),
          "the field was empty at the only moment it was needed")
    check(f"[{pid_absent}] the reason names the actual cause",
          absent.get("eo_unreliable_reason") == "NO_BASELINE_IMAGERY",
          repr(absent.get("eo_unreliable_reason")))
    check(f"[{pid_absent}] imagery URLs are not offered",
          absent.get("before_imagery_url") is None
          and absent.get("after_imagery_url") is None)


# ---------------------------------------------------------------------------------
print("\n--- TEST 2: IDENTITY IS READ, NOT INVENTED ---")
# ---------------------------------------------------------------------------------

if absent and ENGINE.df is not None:
    row = ENGINE.df[ENGINE.df["ProjectId"].astype(str) == str(pid_absent)]
    if not row.empty:
        true_name = str(row.iloc[0]["ProjectName"]).strip()
        true_sector = str(row.iloc[0]["SectorName"]).strip()
        check("project_name matches the corpus, not a placeholder",
              absent.get("project_name") == true_name,
              f"served={absent.get('project_name')!r} corpus={true_name!r}")
        check("sector matches the corpus, not a placeholder",
              absent.get("sector") == true_sector,
              f"served={absent.get('sector')!r} corpus={true_sector!r}")

# Behavioural, not a source grep. The first version of this check searched the module
# text for "Infrastructure Asset" and matched the COMMENT explaining its removal -- the
# same false positive the corpus-seam scanner hit, and the sort of finding that trains
# people to ignore a failing check.
_unknown = ENGINE.get_satellite_audit("000000")
check("an unknown project gets NO invented identity",
      _unknown.get("project_name") is None and _unknown.get("sector") is None,
      f"name={_unknown.get('project_name')!r} sector={_unknown.get('sector')!r}")
check("an unknown project gets no invented measurements",
      all(_unknown.get(f) is None for f in MEASUREMENT_FIELDS if f in _unknown),
      "a project that does not exist cannot have been measured")


# ---------------------------------------------------------------------------------
print("\n--- TEST 3: IMAGERY PRESENT => REAL FIGURES (no over-gating) ---")
# ---------------------------------------------------------------------------------

pid_present, present = find_project(with_imagery=True)
check("a project WITH dual-epoch imagery exists to test",
      present is not None, str(pid_present))

if present:
    check(f"[{pid_present}] surface_change_pct is served",
          isinstance(present.get("surface_change_pct"), (int, float)),
          repr(present.get("surface_change_pct")))
    check(f"[{pid_present}] baseline_vintage is served",
          bool(present.get("baseline_vintage")), repr(present.get("baseline_vintage")))
    check(f"[{pid_present}] current_vintage is served",
          bool(present.get("current_vintage")), repr(present.get("current_vintage")))
    check(f"[{pid_present}] imagery URLs are offered",
          bool(present.get("before_imagery_url")) and bool(present.get("after_imagery_url")))
    check(f"[{pid_present}] identity is populated",
          bool(present.get("project_name")) and bool(present.get("sector")),
          f"{present.get('project_name')!r} / {present.get('sector')!r}")


# ---------------------------------------------------------------------------------
print("\n--- TEST 4: THE eo_readiness CONTRACT ---")
# ---------------------------------------------------------------------------------

r_absent = eo_readiness(False)
r_present = eo_readiness(True)

check("eo_readiness reports unavailable without imagery",
      r_absent["eo_available"] is False)
check("eo_readiness states a reason", r_absent["reason"] == "NO_BASELINE_IMAGERY")
check("eo_readiness names what is actually awaited",
      r_absent["awaiting"] == "basemap_refresh")
check("eo_readiness explicitly disclaims orbital tasking",
      "orbital_pass" in r_absent.get("not_awaiting", ""),
      "the sensor is a basemap mosaic; naming a pass would promise an acquisition "
      "nobody scheduled")
check("eo_readiness enumerates the withheld products",
      all(v is None for v in r_absent["withheld_products"].values()))
check("eo_readiness points at the alternative evidence path",
      "not blended" in r_absent.get("alternative_evidence", ""))
check("eo_readiness reports available WITH imagery",
      r_present["eo_available"] is True and r_present["reason"] is None)

check("it mirrors the sar_readiness contract shape",
      set(("reason", "contract_version")) <= set(r_absent)
      and set(("reason", "contract_version")) <= set(sar_readiness(False)))

if absent:
    check("the endpoint embeds the readiness contract",
          (absent.get("eo_readiness") or {}).get("eo_available") is False,
          str((absent.get("eo_readiness") or {}).get("reason")))


# ---------------------------------------------------------------------------------
print()
print("=" * 78)
if _failures:
    print(f"EO HONESTY AUDIT FAILED: {len(_failures)} of {_checks} checks")
    for f in _failures:
        print(f"  - {f}")
    print("=" * 78)
    sys.exit(1)

print(f"ASSERTIONS PASSED: {_checks} EO honesty checks, 0 failures.")
print(f"  no-imagery project={pid_absent}  imaged project={pid_present}")
print("=" * 78)
