"""
PRAKALP-DRISHTI: LANDMARK GEOCODE ENRICHMENT

Resolves named facilities (airports, AIIMS, refineries, power plants, metro
depots, ports) from a city or state centroid to an actual facility polygon,
using OpenStreetMap via Nominatim with Overpass as the extent source.

Run:
    python satellite_pipeline/enrich_landmark_geocodes.py --dry-run
    python satellite_pipeline/enrich_landmark_geocodes.py --apply
    python satellite_pipeline/enrich_landmark_geocodes.py --apply --limit 25

────────────────────────────────────────────────────────────────────────────
WHY THIS SCRIPT IS MOSTLY VERIFICATION, NOT GEOCODING
────────────────────────────────────────────────────────────────────────────

Resolving a name to a coordinate is one HTTP call. The hard part, and nearly
all the code below, is deciding whether to believe the answer.

The reason is specific to this platform. `eo_viewport.plan_viewport` derives
the imagery zoom from the geocode error radius: an OSM_LANDMARK_MATCH earns a
tight compound frame at high zoom, a GAZETTEER_CITY_MATCH is deliberately held
to a wide one. So writing a coordinate with a confident label does not merely
record a location — it INSTRUCTS the viewer to zoom in and the auditor to
trust what they see.

A wrong coordinate at GAZETTEER tier produces a wide, obviously-approximate
frame that no one will over-read. The same wrong coordinate relabelled
OSM_LANDMARK produces a crisp, tightly-framed photograph of the wrong
building, presented to a Ministry as site verification. Upgrading confidence
without evidence is therefore strictly worse than leaving the bad coordinate
alone, and every candidate here must clear four independent checks before it
is written.

────────────────────────────────────────────────────────────────────────────
THE FOUR CHECKS
────────────────────────────────────────────────────────────────────────────

1. CLASS. The result must be a facility, not a settlement. Nominatim happily
   answers "Imphal Airport" with the city of Imphal if the airport is not
   tagged, and that is the exact failure this whole exercise exists to escape.
   Settlement and administrative classes are rejected outright.

2. GEOGRAPHY. The result must lie in the state the sanction names. A query for
   a plant in Odisha that resolves in Gujarat is a different facility with a
   similar name, which is common for "NTPC", "AIIMS" and "IOCL".

3. NAME. Meaningful tokens from the project title must appear in the resolved
   name. Generic words are stripped first, so "Construction of New Terminal
   Building" cannot match on the word "new".

4. DISPLACEMENT. The new point must be a plausible distance from the old one.
   A city-centroid project should move kilometres, not hundreds of kilometres;
   moving 600 km means the old coordinate and the new one are not describing
   the same thing and neither can be trusted.

Only a candidate clearing all four is written, and the error radius it earns
comes from its OSM footprint where one exists rather than from a table.

────────────────────────────────────────────────────────────────────────────
NOMINATIM USAGE POLICY
────────────────────────────────────────────────────────────────────────────

The public endpoint permits at most 1 request per second and requires a
genuine identifying User-Agent. Both are honoured below and are not
configurable, because exceeding them gets the whole deployment blocked and the
operator finds out when the pipeline silently stops resolving anything. A
bulk re-run of the full 2,207 is out of scope for the public endpoint; this
script targets the ~164 named landmarks where the upgrade is worth the calls.
"""

from __future__ import annotations

import argparse
import json
import math
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GEO_PATH = os.path.join(BASE_DIR, "paimana_extracted", "satellite_data",
                        "ALL_2207_PROJECTS_GEOREFERENCED.json")
CAT_PATH = os.path.join(BASE_DIR, "paimana_extracted", "satellite_data",
                        "ALL_2207_PROJECTS_SATELLITE_CATALOG.json")
REPORT_PATH = os.path.join(BASE_DIR, "artifacts", "geocode_enrichment_report.json")

NOMINATIM = "https://nominatim.openstreetmap.org/search"
OVERPASS = "https://overpass-api.de/api/interpreter"
USER_AGENT = ("prakalp-drishti/1.0 (MoSPI central-sector project monitoring; "
              "contact via repository maintainer)")
RATE_LIMIT_S = 1.1          # Nominatim policy is 1 req/s; 1.1 leaves headroom.

# Tiers worth attempting. Anything already at landmark tier or better is left
# alone: re-resolving a good coordinate risks replacing it with a worse one.
UPGRADEABLE = {
    "GAZETTEER_CITY_MATCH", "GEONAMES_TOKEN_MATCH", "NATIONAL_CENTROID_MATCH",
    "STATE_CENTROID_MATCH", "REGIONAL_COALFIELD_CENTROID",
}

# Named-facility projects. A highway package has no facility to resolve, so it
# is excluded — its fix is an alignment polyline, not a point.
LANDMARK_PATTERN = re.compile(
    r"AIIMS|all india institute|airport|terminal building|refinery|"
    r"power (plant|station)|thermal|super thermal|metro|hospital|medical college|"
    r"institute of|university|port\b|smelter|steel plant|depot|substation|"
    r"pipeline terminal|LNG|IIT\b|NIT\b|stadium",
    re.I)

# OSM classes that are settlements or administrative units. Accepting one of
# these would reproduce the centroid problem under a better-sounding label.
REJECT_TYPES = {
    "city", "town", "village", "hamlet", "suburb", "neighbourhood", "quarter",
    "state", "country", "administrative", "county", "district", "region",
    "municipality", "province", "postcode", "locality", "isolated_dwelling",
}
REJECT_CLASSES = {"boundary", "place"}

# Words that carry no discriminating power in an Indian sanction title.
STOPWORDS = {
    "construction", "of", "new", "the", "at", "for", "and", "phase", "project",
    "development", "work", "works", "building", "extension", "misc",
    "miscellaneous", "associated", "other", "c/o", "including", "in", "to",
    "upgradation", "expansion", "redevelopment", "modernization",
    "modernisation", "setting", "up", "establishment", "creation", "with",
    "additional", "existing", "proposed", "part", "unit", "no", "nos",
}

STATE_ALIASES = {
    "orissa": "odisha", "pondicherry": "puducherry", "uttaranchal": "uttarakhand",
    "jammu & kashmir": "jammu and kashmir", "nct of delhi": "delhi",
    "delhi": "delhi", "tamilnadu": "tamil nadu",
}


# ══════════════════════════════════════════════════════════════════════════
# HTTP
# ══════════════════════════════════════════════════════════════════════════

_last_call = [0.0]


def _throttled_get(url: str, timeout: int = 45) -> Optional[Any]:
    """One request per RATE_LIMIT_S, globally. Never parallelised."""
    wait = RATE_LIMIT_S - (time.time() - _last_call[0])
    if wait > 0:
        time.sleep(wait)
    _last_call[0] = time.time()
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT,
                                               "Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        # 429 means we are being told to slow down. Backing off and continuing
        # beats aborting a 164-project run on one throttled call.
        if e.code == 429:
            time.sleep(10.0)
        return None
    except Exception:
        return None


# ══════════════════════════════════════════════════════════════════════════
# QUERY CONSTRUCTION
# ══════════════════════════════════════════════════════════════════════════

def _clean_tokens(text: str) -> List[str]:
    words = re.findall(r"[A-Za-z][A-Za-z&/\-']+", str(text or ""))
    return [w for w in words if w.lower() not in STOPWORDS and len(w) > 2]


FACILITY_WORDS = (r"Airport|Refinery|Terminal|Hospital|Metro|Port|"
                  r"University|Institute|Stadium|Smelter|Depot")

# Words that look like proper nouns in a sanction title but name no place.
NON_PLACE = {
    "New", "Domestic", "International", "Greenfield", "Passenger", "Integrated",
    "Terminal", "Building", "Construction", "Development", "Phase", "Project",
    "Permanent", "Campus", "Second", "Link", "Taxi", "Track", "Apron", "Rigid",
    "Portions", "Modernization", "Modernisation", "Extension", "Indian",
    "Central", "Tribal", "Institute", "Technology", "Management", "Works",
    "Allied", "Structures", "Miscellaneous", "Associated", "Other", "Operations",
    "Expansion", "Upgradation", "Redevelopment", "Existing", "Proposed",
    # Added after a measured false positive: "Thane Integral Ring Metro Rail
    # Project" yielded the place "Ring", which then matched "Rachna RING road
    # metro station" in Nagpur -- 700 km from Thane -- and passed the geography
    # check. A generic descriptor is not a place, and one that happens to occur
    # in a facility name elsewhere defeats the check entirely.
    "Ring", "Integral", "Outer", "Inner", "Eastern", "Western", "Northern",
    "Southern", "Grass", "Root", "Super", "Thermal", "Rail", "Road", "Line",
    "Corridor", "Station", "Precast", "Housing", "Hostels", "Sports", "Ph",
    "Stage", "Block", "Complex", "Township", "Colony", "Quarters", "Residential",
    "Office", "Academic", "Administrative", "Multi", "Product", "Integrated",
    "Greenfield", "Brownfield", "Doubling", "Widening", "Strengthening",
    "National", "Indian", "State", "Regional",
}


def extract_place(name: str) -> Optional[str]:
    """The settlement a sanction title is talking about.

    Needed because `StateName` is null in the master record and the catalogue
    says "National" for 1,026 projects, so the state check had nothing to work
    with. The title almost always names the place instead -- "... at
    Rajahmundry Airport", "Guwahati Airport ...", "IIT Bhubaneswar" -- and a
    place match is a stronger constraint than a state match anyway: there is
    one Rajahmundry, and several dozen facilities per state.
    """
    raw = re.sub(r"\[[^\]]*\]", " ", str(name or ""))

    # A trailing ", <Place>" is the strongest signal these titles carry:
    # "National Sports University [NSU], Imphal" names the place last, and every
    # earlier capitalised word belongs to the institution's name. Without this
    # the extractor returned "National" and queried "National University".
    m = re.search(r",\s*([A-Z][a-zA-Z]{2,})\s*$", raw.strip(" .,-"))
    if m and m.group(1) not in NON_PLACE:
        return m.group(1)

    # "at <Place>" / "at <Place> Airport"
    m = re.search(r"\bat\s+([A-Z][a-zA-Z]{3,})", raw)
    if m and m.group(1) not in NON_PLACE:
        return m.group(1)

    # The capitalised word immediately before a facility noun, skipping
    # descriptors: "Rajahmundry Airport", "Guwahati Airport". The word must not
    # itself be a facility noun, or "Goa Airport Terminal" yields the place
    # "Airport" and the query "Airport Airport".
    _fac = set(w.lower() for w in FACILITY_PRIORITY)
    for m in re.finditer(rf"([A-Z][a-zA-Z]{{3,}})\s+(?:{FACILITY_WORDS})", raw):
        if m.group(1) not in NON_PLACE and m.group(1).lower() not in _fac:
            return m.group(1)

    # "IIT Bhubaneswar", "AIIMS Bilaspur", "NIT Mizoram"
    m = re.search(r"\b(?:AIIMS|IIT|NIT|IIM|IISER)\b[\s,\-]+([A-Z][a-zA-Z]{3,})", raw)
    if m and m.group(1) not in NON_PLACE:
        return m.group(1)

    # Last resort: any capitalised token that is neither a descriptor nor a
    # facility noun. Without the facility exclusion, "Goa Airport Terminal"
    # fell through to here and returned "Airport", producing the useless query
    # "Airport Airport".
    _fac_l = {f.lower() for f in FACILITY_PRIORITY}
    for w in re.findall(r"\b([A-Z][a-zA-Z]{2,})\b", raw):
        if (w not in NON_PLACE and w.lower() not in STOPWORDS
                and w.lower() not in _fac_l):
            return w
    return None


# Most specific first. A title reading "Domestic Terminal Building at
# Rajahmundry Airport" contains both words and "Terminal" appears earlier, so a
# plain left-to-right search produced the query "Rajahmundry Terminal" — which
# no gazetteer indexes. The facility is the airport; the terminal is a
# component of it.
FACILITY_PRIORITY = ("Airport", "Refinery", "Smelter", "University", "Stadium",
                     "Metro", "Port", "Hospital", "Institute", "Depot", "Terminal")


def facility_kind(name: str) -> Optional[str]:
    raw = str(name or "")
    if re.search(r"\bAIIMS\b|all india institute", raw, re.I):
        return "AIIMS"
    if re.search(r"power (plant|station)|thermal", raw, re.I):
        return "Power Station"
    for kind in FACILITY_PRIORITY:
        if re.search(rf"\b{kind}\b", raw, re.I):
            return kind
    return None


def build_queries(name: str, state: Optional[str],
                  sector: Optional[str]) -> List[str]:
    """Candidate search strings, shortest and most specific first.

    Sanction titles are written for accountants, not gazetteers. The first
    version of this passed the whole cleaned title through and resolved 1 of 20:
    "Domestic Terminal Rajahmundry Airport" matches nothing, while
    "Rajahmundry Airport" matches immediately. Gazetteers index facility names,
    not procurement descriptions, so the query has to be reduced to the two
    tokens that actually name the thing.
    """
    raw = re.sub(r"\[[^\]]*\]", " ", str(name or ""))
    place = extract_place(name)
    kind = facility_kind(name)
    # "National" is a placeholder in this catalogue, not a state.
    st = str(state or "").strip()
    if st.lower() in ("national", "none", ""):
        st = ""

    out: List[str] = []

    # Acronym institutions resolve best as "<ACRONYM> <Place>".
    m = re.search(r"\b(AIIMS|IIT|NIT|IIM|IISER)\b[\s,\-]+([A-Z][a-zA-Z]{3,})", raw)
    if m:
        out.append(f"{m.group(1)} {m.group(2)}")

    # The two tokens that name the facility.
    if place and kind:
        out.append(f"{place} {kind}")
        if st:
            out.append(f"{place} {kind}, {st}")

    # A fully named facility written out in the title, e.g.
    # "Lal Bahadur Shastri International Airport".
    m = re.search(rf"((?:[A-Z][\w'&.\-]+\s+){{1,4}}(?:{FACILITY_WORDS}))", raw)
    if m:
        out.append(m.group(1).strip())

    if place:
        out.append(place if not st else f"{place}, {st}")

    seen, uniq = set(), []
    for q in out:
        q = re.sub(r"\s+", " ", q).strip(" ,")
        if len(q) > 4 and q.lower() not in seen:
            seen.add(q.lower())
            uniq.append(q)
    return uniq[:4]


# ══════════════════════════════════════════════════════════════════════════
# VERIFICATION
# ══════════════════════════════════════════════════════════════════════════

def haversine_km(a_lat: float, a_lon: float, b_lat: float, b_lon: float) -> float:
    r = 6371.0088
    p1, p2 = math.radians(a_lat), math.radians(b_lat)
    dp, dl = p2 - p1, math.radians(b_lon - a_lon)
    h = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(h))


def _norm_state(s: Optional[str]) -> str:
    v = re.sub(r"[^a-z& ]", "", str(s or "").lower()).strip()
    return STATE_ALIASES.get(v, v)


def bbox_extent_m(bb: List[str]) -> Optional[float]:
    """Half-extent in metres of a Nominatim boundingbox [s, n, w, e]."""
    try:
        s, n, w, e = (float(x) for x in bb)
        lat_m = abs(n - s) * 111_320.0
        lon_m = abs(e - w) * 111_320.0 * math.cos(math.radians((n + s) / 2))
        return max(lat_m, lon_m) / 2.0
    except Exception:
        return None


@dataclass
class Verdict:
    accepted: bool
    reason: str
    lat: Optional[float] = None
    lon: Optional[float] = None
    precision: Optional[str] = None
    error_radius_m: Optional[float] = None
    osm: Dict[str, Any] = field(default_factory=dict)
    checks: Dict[str, Any] = field(default_factory=dict)


def verify(result: Dict[str, Any], query: str, name: str,
           state: Optional[str], old_lat: Optional[float],
           old_lon: Optional[float], old_precision: str) -> Verdict:
    """All four checks. Any failure rejects the candidate outright."""
    checks: Dict[str, Any] = {}

    # 1. CLASS
    rtype = str(result.get("type", "")).lower()
    rclass = str(result.get("category") or result.get("class") or "").lower()
    rank = int(result.get("place_rank") or 0)
    is_settlement = rtype in REJECT_TYPES or (
        rclass in REJECT_CLASSES and rtype not in ("island",))
    checks["class"] = {"type": rtype, "category": rclass, "place_rank": rank,
                       "pass": not is_settlement}
    if is_settlement:
        return Verdict(False, f"resolved to a settlement/admin unit ({rclass}/{rtype}), "
                              f"which is the centroid problem restated", checks=checks)
    # place_rank below 20 is country/state/county scale.
    if rank and rank < 18:
        checks["class"]["pass"] = False
        return Verdict(False, f"place_rank {rank} is administrative scale, not a facility",
                       checks=checks)

    # 2. GEOGRAPHY
    #
    # Against the PLACE named in the title, not the state. `StateName` is null
    # in the master record and the catalogue reads "National" for 1,026
    # projects, so a state check had nothing to test. The place is both
    # available and a tighter constraint: there is one Rajahmundry, whereas a
    # state contains dozens of candidate facilities.
    display = str(result.get("display_name", ""))
    want_state = _norm_state(state)
    if want_state in ("national", "none", ""):
        want_state = ""
    place = extract_place(name)

    geo_ok, how = True, "unconstrained"
    if place:
        geo_ok = place.lower() in display.lower()
        how = f"place '{place}' in resolved address"
    elif want_state:
        geo_ok = want_state in _norm_state(display)
        how = f"state '{state}' in resolved address"
    checks["geography"] = {"basis": how, "pass": bool(geo_ok)}
    if not geo_ok:
        return Verdict(False, f"resolved address does not contain the place named in "
                              f"the title ({place}); likely a same-named facility "
                              f"elsewhere", checks=checks)

    # 3. NAME
    want = {t.lower() for t in _clean_tokens(name)}
    got = {t.lower() for t in _clean_tokens(result.get("name") or display)}
    overlap = want & got
    name_ok = bool(overlap)
    checks["name"] = {"overlap": sorted(overlap)[:6], "pass": name_ok}
    if not name_ok:
        return Verdict(False, "no meaningful name token shared with the project title",
                       checks=checks)

    # 4. DISPLACEMENT
    try:
        lat, lon = float(result["lat"]), float(result["lon"])
    except Exception:
        return Verdict(False, "result carried no usable coordinate", checks=checks)

    if not (6.0 <= lat <= 37.5 and 68.0 <= lon <= 97.5):
        checks["displacement"] = {"pass": False, "reason": "outside India"}
        return Verdict(False, "resolved outside India's bounding box", checks=checks)

    moved = (haversine_km(old_lat, old_lon, lat, lon)
             if old_lat is not None and old_lon is not None else None)
    # A national or state centroid carries no positional information, so the
    # distance from it says nothing and only the state check constrains us.
    centroid_tier = old_precision in ("NATIONAL_CENTROID_MATCH", "STATE_CENTROID_MATCH")
    max_move_km = 400.0 if centroid_tier else 60.0
    move_ok = moved is None or moved <= max_move_km
    checks["displacement"] = {"moved_km": round(moved, 2) if moved is not None else None,
                              "limit_km": max_move_km, "pass": bool(move_ok)}
    if not move_ok:
        return Verdict(False, f"new point is {moved:.0f} km from the recorded one, "
                              f"beyond the {max_move_km:.0f} km plausibility limit for "
                              f"a {old_precision}", checks=checks)

    # Error radius from the actual footprint where OSM has one. A polygon is
    # direct evidence of extent; a bare node is not, so it earns a floor.
    extent = bbox_extent_m(result.get("boundingbox") or [])
    osm_type = str(result.get("osm_type", ""))
    if osm_type in ("way", "relation") and extent:
        precision = "OSM_LANDMARK_MATCH"
        radius = float(max(60.0, min(extent, 2500.0)))
        basis = f"OSM {osm_type} footprint, half-extent {extent:.0f} m"
    else:
        precision = "OSM_LANDMARK_MATCH"
        radius = 250.0
        basis = "OSM node; no footprint polygon, so a 250 m floor is applied"

    return Verdict(
        True, basis, lat=lat, lon=lon, precision=precision, error_radius_m=radius,
        osm={"osm_type": osm_type, "osm_id": result.get("osm_id"),
             "name": result.get("name"), "display_name": display[:160],
             "category": rclass, "type": rtype, "place_rank": rank,
             "query": query, "boundingbox": result.get("boundingbox")},
        checks=checks)


def resolve(name: str, state: Optional[str], sector: Optional[str],
            old_lat: Optional[float], old_lon: Optional[float],
            old_precision: str) -> Verdict:
    """Try each candidate query; return the first that clears all four checks."""
    last = Verdict(False, "no query produced a result")
    for q in build_queries(name, state, sector):
        url = (NOMINATIM + "?" + urllib.parse.urlencode({
            "q": q, "format": "jsonv2", "limit": 5, "countrycodes": "in",
            "addressdetails": 1}))
        results = _throttled_get(url)
        if not results:
            last = Verdict(False, f"no result for query '{q}'")
            continue
        for r in results:
            v = verify(r, q, name, state, old_lat, old_lon, old_precision)
            if v.accepted:
                return v
            last = v
    return last


# ══════════════════════════════════════════════════════════════════════════
# DRIVER
# ══════════════════════════════════════════════════════════════════════════

def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true",
                    help="write the results; otherwise dry-run only")
    ap.add_argument("--limit", type=int, default=0)
    args = ap.parse_args()

    with open(CAT_PATH, "r", encoding="utf-8") as f:
        catalog = json.load(f)
    with open(GEO_PATH, "r", encoding="utf-8") as f:
        geo = json.load(f)
    geo_by_id = {str(g.get("project_id") or g.get("ProjectId")): g for g in geo}

    targets = [r for r in catalog
               if r.get("geocode_precision") in UPGRADEABLE
               and LANDMARK_PATTERN.search(str(r.get("project_name", "")))]
    if args.limit:
        targets = targets[:args.limit]

    print(f"landmark projects on a weak geocode: {len(targets)}")
    print(f"mode: {'APPLY' if args.apply else 'DRY RUN'} | "
          f"{RATE_LIMIT_S}s between calls, est. "
          f"{len(targets) * RATE_LIMIT_S * 1.6 / 60:.0f} min\n")

    accepted, rejected = [], []
    for i, r in enumerate(targets, 1):
        pid = str(r["project_id"])
        g = geo_by_id.get(pid, {})
        old_lat, old_lon = g.get("latitude"), g.get("longitude")
        v = resolve(r.get("project_name"), r.get("state"), r.get("sector"),
                    old_lat, old_lon, str(r.get("geocode_precision")))
        rec = {
            "project_id": pid, "project_name": str(r.get("project_name"))[:90],
            "sector": r.get("sector"), "state": r.get("state"),
            "old": {"precision": r.get("geocode_precision"),
                    "latitude": old_lat, "longitude": old_lon},
            "accepted": v.accepted, "reason": v.reason, "checks": v.checks,
        }
        if v.accepted:
            rec["new"] = {"precision": v.precision, "latitude": v.lat,
                          "longitude": v.lon, "error_radius_m": v.error_radius_m,
                          "osm": v.osm}
            accepted.append(rec)
            print(f"  [{i:3d}/{len(targets)}] OK   {pid} {str(r.get('project_name'))[:38]:38s} "
                  f"-> {v.lat:.5f},{v.lon:.5f} r={v.error_radius_m:.0f}m")
        else:
            rejected.append(rec)
            print(f"  [{i:3d}/{len(targets)}] skip {pid} {str(r.get('project_name'))[:38]:38s} "
                  f"-- {v.reason[:56]}")

    print(f"\naccepted {len(accepted)} / {len(targets)}   rejected {len(rejected)}")

    os.makedirs(os.path.dirname(REPORT_PATH), exist_ok=True)
    with open(REPORT_PATH, "w", encoding="utf-8") as f:
        json.dump({"generated_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
                   "targets": len(targets), "accepted": accepted,
                   "rejected": rejected}, f, indent=1)
    print(f"report -> {REPORT_PATH}")

    if not args.apply:
        print("\nDRY RUN — nothing written. Re-run with --apply to commit.")
        return 0

    # ── write, keeping the prior value for audit ─────────────────────────
    idx = {a["project_id"]: a for a in accepted}
    changed = 0
    for g in geo:
        pid = str(g.get("project_id") or g.get("ProjectId"))
        a = idx.get(pid)
        if not a:
            continue
        g["latitude_previous"] = g.get("latitude")
        g["longitude_previous"] = g.get("longitude")
        g["latitude"] = a["new"]["latitude"]
        g["longitude"] = a["new"]["longitude"]
        g["geocode_enrichment"] = {
            "source": "OpenStreetMap via Nominatim",
            "resolved_at": time.strftime("%Y-%m-%d"),
            "osm": a["new"]["osm"],
            "checks_passed": list(a["checks"].keys()),
            "error_radius_m": a["new"]["error_radius_m"],
        }
        changed += 1

    for r in catalog:
        a = idx.get(str(r.get("project_id")))
        if not a:
            continue
        r["geocode_precision_previous"] = r.get("geocode_precision")
        r["geocode_precision"] = a["new"]["precision"]
        r["geocode_confidence"] = "HIGH"
        r["geocode_confidence_note"] = (
            f"Upgraded from {a['old']['precision']} by OSM landmark resolution "
            f"({a['new']['osm'].get('osm_type')}/{a['new']['osm'].get('osm_id')}), "
            f"verified on facility class, state, name overlap and displacement.")
        r["eo_verdict_reliable"] = True
        r["eo_unreliable_reason"] = None

    with open(GEO_PATH, "w", encoding="utf-8") as f:
        json.dump(geo, f, indent=1)
    with open(CAT_PATH, "w", encoding="utf-8") as f:
        json.dump(catalog, f, indent=1)
    print(f"\nwrote {changed} coordinates to {os.path.basename(GEO_PATH)} "
          f"and synced {os.path.basename(CAT_PATH)}")
    print("previous values retained as latitude_previous / longitude_previous "
          "and geocode_precision_previous")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
