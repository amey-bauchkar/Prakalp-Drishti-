"""
PRAKALP-DRISHTI: TIERED OFFLINE GEONAMES RESOLVER

Second-pass geolocation for projects the OSM/Nominatim pass could not place.

Why a second pass at all
-----------------------
OSM's searchable POI coverage for rural Indian infrastructure is thin. Coal India
titles in particular carry internal nomenclature ("EPR AMRAPALI OCP", "KULDA
GARJANBAHAL", "BINA KAKRI AMALGAMATION") whose place-name core exists in the GeoNames
gazetteer but not as an OSM search result. GeoNames ships 660k Indian entries as a
15 MB static file, so this whole stage runs offline with no rate limit -- which also
keeps the deployed system air-gapped.

The safety problem this file exists to solve
--------------------------------------------
Naive gazetteer matching is *dangerous*, and measurably so. Ranking candidates by
population puts "EPR ROHINI OCP" -- a CCL mine in Jharkhand -- in Delhi's Rohini
suburb, 1,200 km away. "Ashok" (a Jharkhand mine) matches three hotels. "Gauri" has
51 candidates, all population zero.

Every one of those is a confidently-wrong coordinate, which is strictly worse than an
honest placeholder because it renders as authoritative in the UI. So token matching is
STRUCTURALLY FORBIDDEN here without a region constraint: resolve_token() cannot be
reached unless a state is known, either from StateName or inferred from the executing
Coal India subsidiary (CCL => Jharkhand, MCL => Odisha, and so on).

Tiers
-----
  1  OSM exact                       HIGH    (previous pass; untouched)
  2  GeoNames exact + state agrees   HIGH    site-level, verdict shown
  3  GeoNames token + state REQUIRED MEDIUM  site-level, verdict shown
  4  Coalfield/regional centroid     LOW     NOT site-level, verdict withheld
  5  Unresolvable                    NONE    verdict withheld

Tier 4 exists so the map has a plausible marker for an operating coalfield without
ever implying the imagery shows that project's works. It deliberately does not unlock
the Earth-observation verdict.

Usage
-----
    python geonames_resolver.py --dry-run    # report only, writes nothing
    python geonames_resolver.py              # apply, updates the georeferenced JSON
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from collections import defaultdict
from typing import Dict, List, Optional, Tuple

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import regeocode_from_project_names as RG  # noqa: E402  (toponym parser is shared)

GEO_PATH = os.path.join(BASE_DIR, "paimana_extracted", "satellite_data", "ALL_2207_PROJECTS_GEOREFERENCED.json")
GEONAMES_PATH = os.path.join(BASE_DIR, "paimana_extracted", "geonames_IN.txt")
ADMIN1_PATH = os.path.join(BASE_DIR, "paimana_extracted", "geonames_admin1_IN.txt")

# Precision labels this stage can assign. These must stay in sync with
# GEOCODE_CONFIDENCE / SITE_LEVEL_PRECISIONS in batch_precision_change_detection.py.
P_EXACT = "GEONAMES_EXACT_MATCH"              # state-confirmed  -> HIGH
P_EXACT_UNC = "GEONAMES_EXACT_UNCONSTRAINED"  # unique-in-India  -> MEDIUM
P_TOKEN = "GEONAMES_TOKEN_MATCH"              # state-confirmed  -> MEDIUM
P_REGION = "REGIONAL_COALFIELD_CENTROID"      # region only      -> LOW, verdict withheld

PLACEHOLDER = {"NATIONAL_CENTROID_MATCH", "STATE_CENTROID_MATCH"}

# Feature classes worth trusting as a project site. P = populated place, S = spot/
# building, L = area, T = terrain. A (administrative) is a district/state polygon
# centroid -- too coarse to call site-level, so it is excluded from tiers 2 and 3.
GOOD_FEATURE_PREFIXES = ("PPL", "MN", "IND", "RSTN", "AIRP", "DAM", "RSV", "PRT")

# Coal India subsidiary -> the coalfield state it operates in. This is the constraint
# that makes token matching safe for the coal projects, which dominate the OSM misses.
# NOTE: matched LONGEST KEY FIRST. "South Eastern Coalfields [SECL]" contains the
# substring "Eastern Coalfields", so naive dict-order iteration resolved SECL projects
# to West Bengal (ECL's field) instead of Chhattisgarh. Specificity must win.
#
# NLC India is deliberately absent: unlike the CIL subsidiaries it is a multi-state
# operator (Neyveli in Tamil Nadu, Talabira in Odisha, Pachwara in Jharkhand), so its
# name implies no single coalfield and inferring one produced wrong placements.
COALFIELD_STATE = {
    "CCL": "Jharkhand", "CENTRAL COALFIELDS": "Jharkhand",
    "BCCL": "Jharkhand", "BHARAT COKING": "Jharkhand",
    "ECL": "West Bengal", "EASTERN COALFIELDS": "West Bengal",
    "WCL": "Maharashtra", "WESTERN COALFIELDS": "Maharashtra",
    "SECL": "Chhattisgarh", "SOUTH EASTERN COALFIELDS": "Chhattisgarh",
    "MCL": "Odisha", "MAHANADI COALFIELDS": "Odisha",
    "NCL": "Madhya Pradesh", "NORTHERN COALFIELDS": "Madhya Pradesh",
    "NEC": "Assam", "NORTH EASTERN COALFIELDS": "Assam",
    "SCCL": "Telangana", "SINGARENI": "Telangana",
}

# Longest-first so the most specific subsidiary name wins.
_COALFIELD_KEYS = sorted(COALFIELD_STATE, key=len, reverse=True)

# Executing agencies and PSUs. GeoNames contains entries for some of these (there is a
# populated place literally named "NTPC"), so without this guard a company name in the
# title geocodes as if it were the project site.
_AGENCY_TOKENS = {
    "ntpc", "nhai", "nhidcl", "morth", "powergrid", "pgcil", "ongc", "gail", "iocl",
    "bpcl", "hpcl", "sail", "rites", "ircon", "dfccil", "rvnl", "nmdc", "bhel", "cil",
    "secl", "mcl", "ccl", "bccl", "wcl", "ecl", "ncl", "sccl", "nlc", "nec", "aai",
    "drdo", "isro", "npcil", "nhpc", "sjvn", "thdc", "neepco", "wapcos", "cpwd",
}

# Approximate operating centre of each coalfield, used only for tier 4.
COALFIELD_CENTRE = {
    "Jharkhand": (23.7500, 85.5000), "West Bengal": (23.7000, 86.9500),
    "Maharashtra": (20.2000, 79.1000), "Chhattisgarh": (22.3500, 82.7000),
    "Odisha": (21.4500, 83.9500), "Madhya Pradesh": (24.1000, 82.6500),
    "Assam": (27.2500, 95.7000), "Telangana": (17.6500, 79.5000),
    "Tamil Nadu": (11.6000, 79.4800),
}


# ---------------------------------------------------------------------------------
# Gazetteer
# ---------------------------------------------------------------------------------

class GeoNamesIndex:
    """Offline name -> candidate index over the GeoNames India dump."""

    def __init__(self, dump_path: str, admin1_path: str):
        self.admin1: Dict[str, str] = {}
        if os.path.exists(admin1_path):
            for line in open(admin1_path, encoding="utf-8"):
                f = line.rstrip("\n").split("\t")
                if len(f) >= 2:
                    self.admin1[f[0].split(".")[-1]] = f[1]

        # name -> list of (lat, lon, population, feature_code, state_name)
        self.by_name: Dict[str, List[Tuple[float, float, int, str, str]]] = defaultdict(list)
        n = 0
        for line in open(dump_path, encoding="utf-8"):
            f = line.rstrip("\n").split("\t")
            if len(f) < 15:
                continue
            try:
                lat, lon = float(f[4]), float(f[5])
                pop = int(f[14] or 0)
            except ValueError:
                continue
            fcode = f[7]
            state = self.admin1.get(f[10], "")
            rec = (lat, lon, pop, fcode, state)
            for nm in {f[1], f[2]} | {x for x in f[3].split(",") if x}:
                k = nm.strip().lower()
                if len(k) >= 4:
                    self.by_name[k].append(rec)
            n += 1
        self.entries = n

    @staticmethod
    def _usable(fcode: str) -> bool:
        return any(fcode.startswith(p) for p in GOOD_FEATURE_PREFIXES)

    def lookup(self, name: str, state: Optional[str]) -> Optional[Tuple[float, float, str]]:
        """Return (lat, lon, feature_code) for the best candidate, or None.

        Two guards, both learned from measured wrong answers:

        * A company name is not a place. GeoNames has an entry named "NTPC", so
          "connectivity of NTPC Lingaraj" would otherwise geocode to it.

        * When `state` is supplied, out-of-state candidates are DISCARDED, not merely
          down-ranked. When it is not supplied, the name must be unambiguous within
          India -- "Sakri" has 53 candidates and picking the most populous is a coin
          flip that placed a Bihar rail project in Maharashtra. Uniqueness is the only
          thing that makes an unconstrained match defensible.
        """
        key = name.strip().lower()
        if key in _AGENCY_TOKENS:
            return None

        cands = [c for c in self.by_name.get(key, []) if self._usable(c[3])]
        if not cands:
            return None

        if state:
            want = state.strip().lower()
            cands = [c for c in cands if c[4].lower() == want]
            if not cands:
                return None
        elif len({(round(c[0], 3), round(c[1], 3)) for c in cands}) > 1:
            return None                          # ambiguous and nothing to disambiguate with

        cands.sort(key=lambda c: -c[2])          # prefer the most populous survivor
        lat, lon, _pop, fcode, _st = cands[0]
        return lat, lon, fcode


# ---------------------------------------------------------------------------------
# Resolution tiers
# ---------------------------------------------------------------------------------

def infer_state(project: dict) -> Optional[str]:
    """State from the record, else inferred from the executing coal subsidiary."""
    st = project.get("StateName")
    if st and str(st).strip().lower() not in ("", "nan", "none"):
        return str(st).strip()
    company = str(project.get("COMPANYNAME") or "").upper()
    for key in _COALFIELD_KEYS:                  # longest-first: SECL must beat ECL
        if re.search(rf"\b{re.escape(key)}\b", company):
            return COALFIELD_STATE[key]
    return None


def resolve_exact(idx: GeoNamesIndex, tops: List[str], state: Optional[str]):
    """Tier 2 -- full extracted toponym matches a gazetteer name."""
    for t in tops:
        hit = idx.lookup(t, state)
        if hit:
            return hit, t
    return None, None


def resolve_token(idx: GeoNamesIndex, tops: List[str], state: Optional[str]):
    """Tier 3 -- a single word inside a mangled industrial name.

    Refuses to run without a state. Unconstrained token matching is what places a
    Jharkhand colliery in a Delhi suburb; the constraint is not optional.
    """
    if not state:
        return None, None
    for t in tops:
        for word in t.split():
            w = word.strip(" ,.-&/")
            if len(w) < 5 or w.lower() in RG._STOPWORDS:
                continue
            hit = idx.lookup(w, state)
            if hit:
                return hit, w
    return None, None


def resolve_region(project: dict):
    """Tier 4 -- coalfield centroid. Deliberately NOT site-level."""
    company = str(project.get("COMPANYNAME") or "").upper()
    for key in _COALFIELD_KEYS:                  # longest-first: SECL must beat ECL
        if re.search(rf"\b{re.escape(key)}\b", company):
            state = COALFIELD_STATE[key]
            centre = COALFIELD_CENTRE.get(state)
            if centre:
                return centre, state
    return None, None


# ---------------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------------

def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true", help="report only; write nothing")
    args = ap.parse_args()

    if sys.stdout and hasattr(sys.stdout, "buffer"):
        import io
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

    if not os.path.exists(GEONAMES_PATH):
        print(f"Missing {GEONAMES_PATH}. Download https://download.geonames.org/export/dump/IN.zip")
        sys.exit(1)

    print("Loading offline GeoNames index...")
    idx = GeoNamesIndex(GEONAMES_PATH, ADMIN1_PATH)
    print(f"  {idx.entries:,} gazetteer entries, {len(idx.by_name):,} distinct names, "
          f"{len(idx.admin1)} states\n")

    with open(GEO_PATH, "r", encoding="utf-8") as f:
        geo = json.load(f)

    targets = [g for g in geo if g.get("geocode_precision") in PLACEHOLDER]
    print(f"Projects still unresolved after the OSM pass: {len(targets)}\n")

    stats = {"exact": 0, "exact_unc": 0, "token": 0, "region": 0, "unresolved": 0, "no_state": 0}
    samples = {"exact": [], "exact_unc": [], "token": [], "region": []}

    for g in targets:
        tops, _strat = RG.extract_toponyms(g.get("ProjectName", ""))
        state = infer_state(g)
        if not state:
            stats["no_state"] += 1

        hit, src = resolve_exact(idx, tops, state) if tops else (None, None)
        # A unique-in-India name is defensible but still unverified: "Saraighat" has one
        # GeoNames entry (in UP) while the Agthori-Kamakhya project it came from is in
        # Assam. Unique is not the same as correct, so only a state-confirmed match
        # earns HIGH.
        tier = (P_EXACT if state else P_EXACT_UNC) if hit else None
        if not hit and tops:
            hit, src = resolve_token(idx, tops, state)
            tier = P_TOKEN if hit else None

        if hit:
            lat, lon, fcode = hit
            g["latitude"], g["longitude"] = round(lat, 6), round(lon, 6)
            g["geocode_precision"] = tier
            g["geocode_source"] = f"{src} [{fcode}]"
            g["geocode_state_constraint"] = state or ""
            key = {P_EXACT: "exact", P_EXACT_UNC: "exact_unc", P_TOKEN: "token"}[tier]
            stats[key] += 1
            if len(samples[key]) < 6:
                samples[key].append((src, state, lat, lon, g["ProjectName"][:44]))
            continue

        centre, cf_state = resolve_region(g)
        if centre:
            g["latitude"], g["longitude"] = centre
            g["geocode_precision"] = P_REGION
            g["geocode_source"] = f"{cf_state} coalfield"
            g["geocode_state_constraint"] = cf_state
            stats["region"] += 1
            if len(samples["region"]) < 5:
                samples["region"].append((cf_state, "", centre[0], centre[1], g["ProjectName"][:44]))
        else:
            stats["unresolved"] += 1

    print("RESULTS")
    print(f"  Tier 2a GeoNames exact + state  (HIGH,   site) : {stats['exact']}")
    print(f"  Tier 2b GeoNames exact, unique  (MEDIUM, site) : {stats['exact_unc']}")
    print(f"  Tier 3  GeoNames token + state  (MEDIUM, site) : {stats['token']}")
    print(f"  Tier 4  Coalfield centre        (LOW, NOT site): {stats['region']}")
    print(f"  Tier 5  Unresolvable                           : {stats['unresolved']}")
    print(f"\n  (of the targets, {stats['no_state']} had no usable state -> tier 3 was "
          f"structurally unavailable to them)")

    newly_site_level = stats["exact"] + stats["exact_unc"] + stats["token"]
    print(f"\n  newly SITE-LEVEL: {newly_site_level}")

    for label in ("exact", "exact_unc", "token", "region"):
        if samples[label]:
            print(f"\n  --- {label} samples ---")
            for src, st, la, lo, nm in samples[label]:
                print(f"    {str(src)[:24]:24s} state={str(st)[:14]:14s} {la:8.4f},{lo:8.4f}  {nm}")

    if args.dry_run:
        print("\nDRY RUN -- nothing written.")
        return

    tmp = GEO_PATH + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(geo, f, ensure_ascii=False, indent=1)
    os.replace(tmp, GEO_PATH)
    print(f"\nWrote {GEO_PATH}")
    print("NOTE: coordinates changed -> run invalidate_stale_imagery.py --apply, then refetch.")


if __name__ == "__main__":
    main()
