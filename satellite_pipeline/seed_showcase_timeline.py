"""
PRAKALP-DRISHTI: SHOWCASE TIMELINE SEEDER

Loads the resolved epochs from SHOWCASE_EPOCHS.json into `project_imagery_epochs`, and
derives statutory milestones for the same projects into `project_milestones`, so
KAAL-DARPAN renders a real chronology.

    python satellite_pipeline/seed_showcase_timeline.py            # seed
    python satellite_pipeline/seed_showcase_timeline.py --dry-run  # show, write nothing

REQUIRES migration 0006. Without it the script says so and exits, rather than half-
writing and leaving the operator to work out which half landed.

MILESTONES ARE DERIVED, AND SAID TO BE
--------------------------------------
MoSPI's PAIMANA extract carries no per-month progress history -- it holds one current
PhysicalProgress figure per project, plus sanction and target dates. So the milestones
seeded here are a DERIVED reporting history: sanction at 0%, the current reported figure
at today's date, and linearly interpolated intermediate points anchored to the project's
own dates.

Every derived row is written with `remarks` saying exactly that, and
`milestone_type = 'MONTHLY_PROGRESS'` with a DERIVED marker. It is demonstration data
whose provenance is stated on the row itself. Real MPR history, when MoSPI supplies it,
is filed through POST /api/ingest/projects/{id}/milestones and needs no seeding.

The IMAGERY, by contrast, is not derived at all: each epoch is a real dated ESRI Wayback
release whose tile genuinely differs from its predecessor, with the release id and image
SHA-256 recorded.
"""

from __future__ import annotations

import json
import os
import sys
from datetime import date, datetime, timedelta
from typing import Any, Dict, List, Optional

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)

import backend.config  # noqa: F401,E402  -- loads .env so DATABASE_URL resolves

from analytics_engine import corpus_repository as repo          # noqa: E402
from analytics_engine.corpus_source import load_corpus          # noqa: E402
from analytics_engine.merkle import mth_leaf                    # noqa: E402
from analytics_engine.temporal_audit import _parse_date         # noqa: E402

EPOCHS_PATH = os.path.join(BASE_DIR, "paimana_extracted", "satellite_data",
                           "SHOWCASE_EPOCHS.json")

DERIVED_NOTE = ("DERIVED demonstration milestone. PAIMANA carries one current progress "
                "figure per project, not a monthly series; this point is interpolated "
                "between the sanction date (0%) and the currently reported figure. "
                "Real MPR history is filed through POST /api/ingest/projects/{id}/milestones.")


def _project_facts(pid: str) -> Dict[str, Any]:
    df = load_corpus()
    row = df[df["ProjectId"].astype(str) == str(pid)]
    if row.empty:
        return {}
    r = row.iloc[0]

    def _f(v):
        try:
            f = float(v)
            return f if f == f else None
        except (TypeError, ValueError):
            return None

    return {
        "project_name": str(r.get("ProjectName") or "").strip() or None,
        "sector": str(r.get("SectorName") or "").strip() or None,
        "sanction": _parse_date(r.get("SanctionDate")),
        "original_end": _parse_date(r.get("OriginalEndDate")),
        "revised_end": _parse_date(r.get("RevisedDate")),
        "progress": _f(r.get("PhysicalProgress")),
        "expenditure": _f(r.get("Expenditure")),
    }


def derive_milestones(pid: str, facts: Dict[str, Any],
                      epoch_dates: List[date]) -> List[Dict[str, Any]]:
    """
    A plausible reporting history anchored to the project's own dates.

    Intermediate points are placed at the EPOCH dates rather than on a fixed monthly
    grid. That is deliberate: a milestone is only corroborable if imagery exists near
    it, so anchoring the derived series to the observations that exist produces a
    timeline where the evidence actually lines up. Real MPRs, filed through the API,
    land wherever they land and are reported as NO_IMAGERY_FOR_INTERVAL when no
    observation brackets them.
    """
    sanction = facts.get("sanction")
    progress = facts.get("progress")
    if sanction is None or progress is None:
        return []

    today = date.today()
    end = facts.get("revised_end") or facts.get("original_end") or today
    horizon = min(end, today)
    if horizon <= sanction:
        horizon = today

    out: List[Dict[str, Any]] = [{
        "update_date": sanction,
        "claimed_progress_pct": 0.0,
        "milestone_type": "SANCTION",
        "cumulative_expenditure_cr": 0.0,
    }]

    span = max((horizon - sanction).days, 1)
    inner = [d for d in sorted(set(epoch_dates))
             if sanction < d < horizon]

    for d in inner:
        frac = (d - sanction).days / span
        out.append({
            "update_date": d,
            "claimed_progress_pct": round(min(progress, progress * frac), 1),
            "milestone_type": "MONTHLY_PROGRESS",
            "cumulative_expenditure_cr": (
                round((facts.get("expenditure") or 0.0) * frac, 2)),
        })

    out.append({
        "update_date": horizon,
        "claimed_progress_pct": round(progress, 1),
        "milestone_type": ("FINAL_COMMISSIONING" if progress >= 100.0
                           else "MONTHLY_PROGRESS"),
        "cumulative_expenditure_cr": facts.get("expenditure"),
    })

    # One row per date; a later entry for the same day supersedes an earlier one.
    dedup: Dict[date, Dict[str, Any]] = {}
    for m in out:
        dedup[m["update_date"]] = m
    return [dedup[d] for d in sorted(dedup)]


def seed(dry_run: bool = False) -> Dict[str, Any]:
    if not os.path.exists(EPOCHS_PATH):
        print(f"ERROR: {EPOCHS_PATH} not found.")
        print("Run: python satellite_pipeline/resolve_showcase_epochs.py")
        sys.exit(1)

    with open(EPOCHS_PATH, encoding="utf-8") as f:
        payload = json.load(f)

    if not dry_run:
        if not repo.is_available():
            print("ERROR: DATABASE_URL is not set. Nothing was written.")
            sys.exit(1)
        try:
            repo.epochs_for(1)
        except Exception as exc:
            if "does not exist" in str(exc).lower() or "42p01" in str(exc).lower():
                print("ERROR: migration 0006 has not been applied to this database.")
                print("Apply supabase/migrations/0006_project_milestones.sql, then "
                      "re-run. Nothing was written.")
                sys.exit(1)
            raise

    summary = []
    for proj in payload.get("projects", []):
        pid = str(proj.get("project_id"))
        epochs = proj.get("epochs", [])
        if not epochs:
            print(f"  [{pid}] no epochs resolved — skipped")
            continue

        facts = _project_facts(pid)
        epoch_dates = [d for d in (_parse_date(e.get("captured_on")) for e in epochs) if d]
        milestones = derive_milestones(pid, facts, epoch_dates)

        print(f"  [{pid}] {facts.get('project_name') or '?'}")
        print(f"        {len(epochs)} epochs, {len(milestones)} derived milestones")

        if dry_run:
            for e in epochs:
                print(f"          EPOCH  {e['captured_on']}  rel={e['wayback_release']:>6}"
                      f"  change={e.get('surface_change_pct')}")
            for m in milestones:
                print(f"          MSTONE {m['update_date']}  "
                      f"{m['claimed_progress_pct']}%  {m['milestone_type']}")
            summary.append({"project_id": pid, "epochs": len(epochs),
                            "milestones": len(milestones), "written": False})
            continue

        written_e = 0
        for e in epochs:
            try:
                repo.insert_epoch({
                    "project_id": int(pid),
                    "captured_on": e.get("captured_on"),
                    "vintage_label": e.get("vintage_label"),
                    "wayback_release": e.get("wayback_release"),
                    "tile_path": e.get("tile_path"),
                    "surface_change_pct": e.get("surface_change_pct"),
                    "is_baseline": bool(e.get("is_baseline")),
                })
                written_e += 1
            except Exception as exc:
                print(f"          epoch {e['captured_on']} not written: "
                      f"{type(exc).__name__}: {str(exc)[:70]}")

        written_m = 0
        for m in milestones:
            canonical = (f"{pid}|{m['update_date'].isoformat()}|"
                         f"{m['claimed_progress_pct']}|"
                         f"{m.get('cumulative_expenditure_cr')}|{m['milestone_type']}")
            try:
                repo.insert_milestone({
                    "project_id": int(pid),
                    "update_date": m["update_date"],
                    "claimed_progress_pct": m["claimed_progress_pct"],
                    "cumulative_expenditure_cr": m.get("cumulative_expenditure_cr"),
                    "milestone_type": m["milestone_type"],
                    "remarks": DERIVED_NOTE,
                    "recorded_by": "seed_showcase_timeline",
                    "row_hash": mth_leaf(canonical),
                    "prev_hash": repo.latest_milestone_hash(pid),
                })
                written_m += 1
            except Exception as exc:
                msg = str(exc).lower()
                if "duplicate" in msg or "unique" in msg:
                    continue          # already seeded; append-only, so leave it alone
                print(f"          milestone {m['update_date']} not written: "
                      f"{type(exc).__name__}: {str(exc)[:70]}")

        print(f"        wrote {written_e} epochs, {written_m} milestones")
        summary.append({"project_id": pid, "epochs": written_e,
                        "milestones": written_m, "written": True})

    return {"projects": summary, "dry_run": dry_run}


if __name__ == "__main__":
    dry = "--dry-run" in sys.argv
    print("=" * 78)
    print("SHOWCASE TIMELINE SEEDER" + ("  [DRY RUN — nothing will be written]" if dry else ""))
    print("=" * 78)
    result = seed(dry_run=dry)
    print("=" * 78)
    for s in result["projects"]:
        print(f"  {s['project_id']}: {s['epochs']} epochs, {s['milestones']} milestones"
              + ("" if s["written"] else "  (not written)"))
    print("=" * 78)
