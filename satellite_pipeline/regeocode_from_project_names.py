"""
PRAKALP-DRISHTI: TOPONYM RE-GEOCODER

Repairs the 1,701 projects whose coordinates are centroid placeholders
(NATIONAL_CENTROID_MATCH / STATE_CENTROID_MATCH) rather than real site locations.

Why this exists
---------------
An audit of ALL_2207_PROJECTS_GEOREFERENCED.json found that only 506 of 2,207 projects
(22.9%) had even city-level geocoding. 827 sat within ~2 degrees of India's centroid.
Example: "Construction of Sikkim University Campus Phase-I at Yangang" was placed at
20.53N 78.66E -- in Maharashtra, ~1,100 km from Sikkim. Satellite change detection over
imagery of the wrong location cannot work at any algorithmic quality.

Approach
--------
MoSPI project titles are highly structured and name their own locations:

    "Construction of New Integrated Passenger Terminal Building at Udaipur Airport"
      -> landmark: "Udaipur Airport"
    "4 Laning of NH-544D from Km 0.000 to km 37.000 of Anantapur-Muchukota section Pkg-1"
      -> corridor endpoints: "Anantapur", "Muchukota"  -> geocode both, take the midpoint
    "3rd Line Kalyan - Kasara [67.35 Kilometres]"
      -> corridor endpoints: "Kalyan", "Kasara"

For linear infrastructure (roads, rail, pipelines) the midpoint of the two named
endpoints is the honest representative point: the asset *is* the corridor, and the
midpoint is the closest single coordinate to the whole of it.

Network policy
--------------
Nominatim's usage policy caps automated use at 1 request/second and requires an
identifying User-Agent. This script therefore:
  * deduplicates toponyms globally before querying (many corridors share endpoints),
  * persists every lookup to an on-disk cache so re-runs cost zero requests,
  * sleeps >= 1.1s between live requests,
  * restricts results to countrycodes=in.

This is a one-off data-preparation step. It does not run at request time, so the
deployed system remains air-gapped -- the same posture already used for imagery fetch.

Usage
-----
    python regeocode_from_project_names.py --parse-only   # offline: validate extraction
    python regeocode_from_project_names.py                # live: geocode + write JSON
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request
from typing import Dict, List, Optional, Tuple

def _force_utf8_stdout() -> None:
    """Called from main(), not at import time.

    Rebinding sys.stdout on import invalidates any wrapper the importing process already
    installed, so importing this module for its parser would break that process's output.
    """
    if sys.stdout and hasattr(sys.stdout, "buffer"):
        import io
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GEO_PATH = os.path.join(BASE_DIR, "paimana_extracted", "satellite_data", "ALL_2207_PROJECTS_GEOREFERENCED.json")
CACHE_PATH = os.path.join(BASE_DIR, "paimana_extracted", "satellite_data", "nominatim_cache.json")

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
USER_AGENT = "PrakalpDrishti-SIH2026/1.0 (MoSPI infrastructure monitoring; research use)"
RATE_LIMIT_SECONDS = 1.1

PLACEHOLDER_PRECISIONS = {"NATIONAL_CENTROID_MATCH", "STATE_CENTROID_MATCH"}

# India bounding box -- anything outside is a bad match and gets rejected.
INDIA_BBOX = (6.5, 68.0, 37.5, 97.5)  # (min_lat, min_lon, max_lat, max_lon)

# ---------------------------------------------------------------------------------
# Offline toponym extraction
# ---------------------------------------------------------------------------------

# Leading verbs / scope phrases that carry no location information.
_PREFIX_NOISE = re.compile(
    r"^\s*(?:"
    r"construction\s+of|development\s+of|c/?o\b|augmentation\s+of|redevelopment\s+of|"
    r"rehabilitation(?:\s+and\s+up-?gradation)?(?:\s+and\s+completion)?(?:\s+of)?|"
    # "...of" AND "...to": titles say both ("Improvement to two lane", "Widening of NH-x"),
    # and missing the "to" form let the bare verb survive as a candidate toponym.
    r"up-?gradation\s+(?:of|to)|widening\s+(?:of|to)|strengthening\s+(?:of|to)|"
    r"improvement\s+(?:of|to)|conversion\s+(?:of|to)|"
    r"provision\s+of|setting\s+up\s+of|establishment\s+of|expansion\s+of|"
    r"balance\s+work\s+of|completion\s+of|"
    r"\d+\s*[-\s]?l(?:aning)?\s+of|\d+\s*lane(?:ing)?\s+of|four\s+laning\s+of|six\s+laning\s+of|"
    r"\d+(?:st|nd|rd|th)\s+(?:and\s+\d+(?:st|nd|rd|th)\s+)?line(?:\s+between)?|"
    r"new\s+rail\s+line|doubling\s+of|gauge\s+conversion\s+of"
    r")\s*",
    re.IGNORECASE,
)

# Technical noise that must be stripped before toponyms can be seen.
_NOISE_PATTERNS = [
    re.compile(r"\[[^\]]*\]"),                                   # [49 km], [PB 73/2023-24/NR]
    re.compile(r"\([^)]*\)"),                                    # parentheticals
    re.compile(r"\bkm\.?\s*\d+[\d.,]*\s*(?:to|-)\s*km\.?\s*\d+[\d.,]*", re.I),  # Km 0.000 to km 37.000
    re.compile(r"\bfrom\s+km\.?\s*[\d.,]+", re.I),
    re.compile(r"\bkm\.?\s*[\d.,]+", re.I),
    re.compile(r"\bdesign\s+(?:ch\.?|length|km)\.?\s*[\d.,]*", re.I),
    re.compile(r"\bch\.?\s*[\d.,]+", re.I),
    re.compile(r"\bnh[-\s]?\d+[a-z]{0,3}\b", re.I),              # NH-544D, NH-130CD
    re.compile(r"\bsh[-\s]?\d+[a-z]?\b", re.I),
    re.compile(r"\bpackage\s*[-\s]?[ivx\d]+\b", re.I),
    re.compile(r"\bpkg\.?\s*[-\s]?[ivx\d]+\b", re.I),
    re.compile(r"\bphase\s*[-\s]?[ivx\d]+\b", re.I),
    re.compile(r"\b(?:epc|ham|bot|ppp)\s*mode\b", re.I),
    re.compile(r"\b\d+[\d.,]*\s*(?:km|kilometres?|kilometers?|mw|mtpa|mty|mld|cusec|lane|l)\b", re.I),
    re.compile(r"\bsection\b", re.I),
    re.compile(r"\bgreenfield\b", re.I),
    re.compile(r"\bbalance\s+work\b", re.I),
    re.compile(r"\bincluding\b.*$", re.I),
    re.compile(r"\band\s+associated\s+works?\b.*$", re.I),
    re.compile(r"\band\s+miscellaneous\s+works?\b.*$", re.I),
    re.compile(r"\bmiscellaneous\s+works?\b.*$", re.I),
    re.compile(r"\bof\s+the\s+state\s+of\b", re.I),
    re.compile(r"\bin\s+the\s+state\s+of\b", re.I),
    re.compile(r"[^\w\s,&./-]+"),
]

# Words that are never place names, used to reject junk candidates.
_STOPWORDS = {
    "the", "and", "of", "at", "in", "to", "from", "for", "on", "with", "by", "end",
    "new", "old", "existing", "additional", "line", "lines", "rail", "road", "roads",
    "highway", "highways", "bridge", "tunnel", "terminal", "building", "buildings",
    "work", "works", "project", "projects", "station", "yard", "jn", "junction",
    "cabin", "tie", "port", "plant", "unit", "units", "block", "mine", "mines",
    "pipeline", "system", "scheme", "corridor", "connectivity", "enclave", "civil",
    "domestic", "international", "integrated", "passenger", "runway", "apron",
    "access", "controlled", "lane", "laning", "doubling", "third", "fourth",
    "sanctioned", "ongoing", "misc", "etc", "nos", "no", "sq", "mtr", "village",
    "district", "taluk", "tehsil", "mandal", "state", "states", "region",
    "various", "procurment", "procurement", "capacity", "expn", "expansion",
    "amalgamated", "misc.", "others", "other", "balance", "remaining",
    # Generic engineering verbs/nouns. OSM will resolve "Improvement, India" to *some*
    # coordinate in Punjab, which is a confidently-wrong placement -- exactly the failure
    # class this parser exists to avoid. Observed hitting 41 projects before this fix.
    "improvement", "improvements", "widening", "upgradation", "up-gradation",
    "strengthening", "rehabilitation", "reconstruction", "bypass", "design", "ch",
    "des", "ps", "shoulders", "shoulder", "paved", "formation", "earthwork",
    "scheme", "evacuation", "transmission", "augmentation", "conversion", "provision",
    # Spelled-out lane counts ("to four lane", "two lane of") are configuration, not place.
    "one", "two", "three", "four", "five", "six", "seven", "eight", "ten",
    "single", "double", "twin", "multi", "dual",
}

# An Indian state or UT is an administrative region, not a project site. Matching one
# yields a centroid indistinguishable from the placeholder we are trying to replace,
# but labelled HIGH confidence -- worse than admitting we do not know.
_ADMIN_REGIONS = {
    "andhra pradesh", "arunachal pradesh", "assam", "bihar", "chhattisgarh", "goa",
    "gujarat", "haryana", "himachal pradesh", "jharkhand", "karnataka", "kerala",
    "madhya pradesh", "maharashtra", "manipur", "meghalaya", "mizoram", "nagaland",
    "odisha", "orissa", "punjab", "rajasthan", "sikkim", "tamil nadu", "telangana",
    "tripura", "uttar pradesh", "uttarakhand", "west bengal", "delhi", "ladakh",
    "jammu and kashmir", "puducherry", "chandigarh", "andaman and nicobar islands",
    "dadra and nagar haveli", "daman and diu", "lakshadweep", "india",
}

# Light cleaning only: strips bracketed/numeric noise but preserves sentence tails, so a
# trailing "... at Hubli Airport" survives long enough to be matched. The aggressive
# tail-truncating patterns in _NOISE_PATTERNS would otherwise delete the location itself.
_LIGHT_NOISE = [
    re.compile(r"\[[^\]]*\]"),
    re.compile(r"\([^)]*\)"),
    # Chainage markers ("at Design Ch. 250.400") otherwise satisfy the "at <Place>"
    # pattern and geocode the literal words "Design Ch".
    re.compile(r"\bdesign\s+ch\.?\s*[\d.,]*", re.I),
    re.compile(r"\bch(?:ainage)?\.?\s*[\d.,]+", re.I),
    re.compile(r"\bkm\.?\s*\d+[\d.,]*\s*(?:to|-)\s*km\.?\s*\d+[\d.,]*", re.I),
    re.compile(r"\bkm\.?\s*[\d.,]+", re.I),
    re.compile(r"\bnh[-\s]?\d+[a-z]?\b", re.I),
    re.compile(r"\bpackage\s*[-\s]?[ivx\d]+\b", re.I),
    re.compile(r"\bpkg\.?\s*[-\s]?[ivx\d]+\b", re.I),
    re.compile(r"\bphase\s*[-\s]?[ivx\d]+\b", re.I),
    re.compile(r"\bgreenfield\b", re.I),
    re.compile(r"\b\d+[\d.,]*\s*(?:km|kilometres?|kilometers?|mw|mtpa|mty|mld|kl)\b", re.I),
]

# "... at <Place>" / "... at <Place>, <State>" anywhere in the title, not just at the end.
_AT_PLACE = re.compile(
    r"\b(?:at|near|in)\s+([A-Z][\w.&'-]*(?:\s+[A-Z][\w.&'-]*){0,3})"
    r"(?:\s*,\s*([A-Z][\w.&'-]*(?:\s+[A-Z][\w.&'-]*){0,2}))?"
)


def _light_clean(name: str) -> str:
    s = " " + str(name).strip() + " "
    for pat in _LIGHT_NOISE:
        s = pat.sub(" ", s)
    return re.sub(r"\s+", " ", s).strip(" ,.-&/")

_CORRIDOR_SPLIT = re.compile(r"\s*(?:--|-|–|—|\bto\b|\band\b)\s*", re.IGNORECASE)


def _clean(name: str) -> str:
    s = " " + str(name).strip() + " "
    prev = None
    while prev != s:                      # prefixes can stack: "Construction of 4 Laning of ..."
        prev = s
        s = _PREFIX_NOISE.sub(" ", s.strip())
        s = " " + s + " "
    for pat in _NOISE_PATTERNS:
        s = pat.sub(" ", s)
    s = re.sub(r"\s+", " ", s).strip(" ,.-&/")
    return s


# Qualifiers that make a phrase non-specific no matter what follows them
# ("Various Airports" is not a place; "Hubli Airport" is).
_JUNK_HEADS = {"various", "all", "several", "multiple", "different", "respective", "above"}

# Roman numerals appear constantly as package/phase markers ("PRP-VIII", "Package-IV").
# OSM will happily return *something* for "VIII, India", which is a confidently wrong
# repair -- strictly worse than leaving the placeholder, because it looks authoritative.
_ROMAN_ONLY = re.compile(r"^(?=[mdclxvi]+$)m*(?:cm|cd|d?c{0,3})(?:xc|xl|l?x{0,3})(?:ix|iv|v?i{0,3})$", re.I)

# Industry acronyms that are not places. Any short all-consonant-ish code risks this,
# so single tokens under 4 characters are rejected outright as well.
_ACRONYM_BLOCKLIST = {
    "mdo", "prp", "ocp", "oc", "ug", "rce", "nlw", "mty", "mtpa", "epc", "ham", "bot",
    "ppp", "he", "cw", "bg", "mg", "dfc", "row", "resa", "acft", "esp", "fgd", "stg",
    "btg", "cfa", "rcc", "psc", "nh", "sh", "mdr", "odr",
}


def _trim_junk_edges(tok: str) -> str:
    """Strip junk words from BOTH ends of a candidate, keeping the toponym core.

    NHAI titles leave residue that survives the noise patterns because it sits adjacent
    to the place name rather than matching a pattern of its own:
        "PS Mydukur"          -> "Mydukur"      (PS = paved shoulders)
        "Badvel from of"      -> "Badvel"
        "Gundugolanu Design"  -> "Gundugolanu"
    Rejecting these outright loses a real, resolvable place; only the edges are junk.
    Interior words are left alone, since a genuine multi-word toponym ("Veera Kaveri
    Raja Puram") must survive intact.
    """
    words = [w for w in re.split(r"\s+", tok.strip()) if w]
    junk = lambda w: (w.lower() in _STOPWORDS or w.lower() in _ACRONYM_BLOCKLIST
                      or bool(_ROMAN_ONLY.match(w.lower())))
    while words and junk(words[0]):
        words.pop(0)
    while words and junk(words[-1]):
        words.pop()
    return " ".join(words).strip(" ,.-&/")


def _is_plausible_toponym(tok: str) -> bool:
    tok = tok.split(".")[0].strip(" ,.-&/")   # never run past a sentence boundary
    if len(tok) < 3 or len(tok) > 40:
        return False
    if any(ch.isdigit() for ch in tok):
        return False
    # Tokenise on hyphens as well as whitespace, so a compound package code like
    # "PRP-VIII" is judged on its parts rather than passing as one novel-looking word.
    words = [w for w in re.split(r"[\s\-–—]+", tok.lower()) if w]
    if not words or len(words) > 4:
        return False
    if words[0] in _JUNK_HEADS:
        return False
    if " ".join(words) in _ADMIN_REGIONS:
        return False
    # Reject when EVERY component is junk of some kind. Checking each junk class with its
    # own all() would let a mixture through -- "PRP-VIII" is not all-acronym and not
    # all-Roman, but it is entirely devoid of toponym, which is what actually matters.
    def _is_junk_word(w: str) -> bool:
        return bool(_ROMAN_ONLY.match(w)) or w in _ACRONYM_BLOCKLIST or w in _STOPWORDS

    if all(_is_junk_word(w) for w in words):
        return False
    # A lone 3-character token is far more often an industry code (MDO, PRP, CFA) than
    # a place name; the few genuine short toponyms are recoverable from their longer
    # decorated form ("Leh Airport") which passes this check.
    if len(words) == 1 and len(words[0]) < 4:
        return False
    return not all(w in _STOPWORDS for w in words)


def extract_toponyms(project_name: str) -> Tuple[List[str], str]:
    """
    Return (toponyms, strategy).

    strategy is one of:
      "corridor"  -> two endpoints found; caller should geocode both and take the midpoint
      "landmark"  -> a single named place/asset
      "none"      -> nothing usable
    """
    # Pass 1 -- "... at <Place>" against the LIGHTLY cleaned title. This must run before the
    # aggressive clean, because patterns like "and miscellaneous works.*$" would otherwise
    # truncate the very location we are looking for ("... works at Hubli Airport").
    # Capitalisation is required, which is what separates a real toponym from prose.
    light = _light_clean(project_name)
    best: Optional[str] = None
    for m in _AT_PLACE.finditer(light):
        place, admin = m.group(1), m.group(2)
        place = _trim_junk_edges(place.split(".")[0].strip(" ,.-&/"))  # sentence boundary + edge junk
        if admin:
            admin = admin.split(".")[0].strip(" ,.-&/")
        cand = f"{place}, {admin}" if admin else place
        if _is_plausible_toponym(place):
            best = cand           # keep the last match: titles read scope-then-site
    if best:
        return [best], "landmark"

    cleaned = _clean(project_name)
    if not cleaned:
        return [], "none"

    parts = [_trim_junk_edges(p.strip(" ,.-&/")) for p in _CORRIDOR_SPLIT.split(cleaned)]
    parts = [p for p in parts if _is_plausible_toponym(p)]
    if len(parts) >= 2:
        return [parts[0], parts[-1]], "corridor"
    if len(parts) == 1:
        return [parts[0]], "landmark"

    trimmed = _trim_junk_edges(cleaned)
    if _is_plausible_toponym(trimmed):
        return [trimmed], "landmark"
    return [], "none"


# ---------------------------------------------------------------------------------
# Nominatim client
# ---------------------------------------------------------------------------------

class NominatimClient:
    def __init__(self, cache_path: str):
        self.cache_path = cache_path
        self.cache: Dict[str, Optional[List[float]]] = {}
        if os.path.exists(cache_path):
            try:
                with open(cache_path, "r", encoding="utf-8") as f:
                    self.cache = json.load(f)
            except Exception:
                self.cache = {}
        self._last_call = 0.0
        self.live_requests = 0

    def save(self) -> None:
        tmp = self.cache_path + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(self.cache, f)
        os.replace(tmp, self.cache_path)

    def lookup(self, query: str) -> Optional[List[float]]:
        key = query.strip().lower()
        if key in self.cache:
            return self.cache[key]

        elapsed = time.time() - self._last_call
        if elapsed < RATE_LIMIT_SECONDS:
            time.sleep(RATE_LIMIT_SECONDS - elapsed)

        params = urllib.parse.urlencode({
            "q": query, "format": "json", "limit": 1, "countrycodes": "in",
        })
        req = urllib.request.Request(f"{NOMINATIM_URL}?{params}", headers={"User-Agent": USER_AGENT})
        result: Optional[List[float]] = None
        try:
            with urllib.request.urlopen(req, timeout=25) as resp:
                data = json.load(resp)
            if data:
                lat, lon = float(data[0]["lat"]), float(data[0]["lon"])
                if INDIA_BBOX[0] <= lat <= INDIA_BBOX[2] and INDIA_BBOX[1] <= lon <= INDIA_BBOX[3]:
                    result = [lat, lon]
        except Exception:
            result = None

        self._last_call = time.time()
        self.live_requests += 1
        self.cache[key] = result
        if self.live_requests % 25 == 0:
            self.save()
        return result


# Industrial asset codes that MoSPI/Coal India titles append to a real place name.
# "Bhojudih NLW Washery" is not in OSM, but "Bhojudih" is; "Udaipur Airport" may be
# absent while "Udaipur" resolves. Stripping these is what lifts the hit rate.
_ASSET_JARGON = re.compile(
    r"\b(?:"
    r"ocp|oc|ug|rce|nlw|opencast|open\s*cast|washery|colliery|mine|mines|"
    r"expansion|expn|extension|extn|amalgamated|amalgamation|amalg|"
    r"block|deep|open|project|works|complex|mdo|mty|mtpa|group|"
    r"airport|airfield|airstrip|terminal|"
    r"thermal|power|plant|station|substation|refinery|depot|siding|"
    r"campus|university|college|hospital|institute|"
    r"phase|pkg|package|unit|re"
    r")\b",
    re.IGNORECASE,
)


def _strip_asset_jargon(toponym: str) -> str:
    s = _ASSET_JARGON.sub(" ", toponym)
    s = re.sub(r"[&/]", " ", s)
    return re.sub(r"\s+", " ", s).strip(" ,.-&/")


def build_query(toponym: str, state: Optional[str]) -> str:
    bits = [toponym]
    if state and str(state).lower() not in ("none", "nan", ""):
        bits.append(str(state))
    bits.append("India")
    return ", ".join(bits)


def candidate_queries(toponym: str, state: Optional[str]) -> List[str]:
    """
    Progressively looser queries, best-first, deduped and short-circuited by the caller.

    When the toponym obviously carries asset jargon we try the stripped form FIRST,
    because the decorated form is near-certain to miss and each attempt costs a
    rate-limited second.
    """
    has_state = bool(state) and str(state).lower() not in ("none", "nan", "")
    stripped = _strip_asset_jargon(toponym)
    jargon_heavy = stripped and stripped.lower() != toponym.lower()

    ordered: List[str] = []
    if jargon_heavy and len(stripped) >= 3:
        if has_state:
            ordered.append(build_query(stripped, state))
        ordered.append(build_query(stripped, None))
    if has_state:
        ordered.append(build_query(toponym, state))
    ordered.append(build_query(toponym, None))

    seen, out = set(), []
    for q in ordered:
        k = q.lower()
        if k not in seen:
            seen.add(k)
            out.append(q)
    return out


# ---------------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------------

def main() -> None:
    _force_utf8_stdout()
    ap = argparse.ArgumentParser()
    ap.add_argument("--parse-only", action="store_true", help="offline extraction report; no network")
    ap.add_argument("--limit", type=int, default=0, help="cap projects processed (debug)")
    ap.add_argument("--sample", type=int, default=0,
                    help="stratified random sample of N projects, proportional by sector "
                         "(for validating the end-to-end chain before a full run)")
    ap.add_argument("--seed", type=int, default=42, help="sampling seed for reproducibility")
    args = ap.parse_args()

    with open(GEO_PATH, "r", encoding="utf-8") as f:
        geo = json.load(f)

    targets = [g for g in geo if g.get("geocode_precision") in PLACEHOLDER_PRECISIONS]
    print(f"Projects with placeholder coordinates: {len(targets)} / {len(geo)}")

    if args.sample:
        # Stratify by sector so the validation subset mirrors the real portfolio mix
        # (Roads dominates at ~52%); a naive head-slice would be all airports and coal.
        import random
        from collections import defaultdict

        rng = random.Random(args.seed)
        by_sector = defaultdict(list)
        for g in targets:
            by_sector[str(g.get("SectorName") or "Unspecified")].append(g)

        picked, total = [], len(targets)
        for sector, group in sorted(by_sector.items(), key=lambda kv: -len(kv[1])):
            quota = max(1, round(args.sample * len(group) / total))
            rng.shuffle(group)
            picked.extend(group[:quota])
        rng.shuffle(picked)
        targets = picked[:args.sample]

        mix = defaultdict(int)
        for g in targets:
            mix[str(g.get("SectorName") or "Unspecified")] += 1
        print(f"Stratified sample: {len(targets)} projects (seed={args.seed})")
        for s, n in sorted(mix.items(), key=lambda kv: -kv[1]):
            print(f"    {n:3d}  {s}")

    elif args.limit:
        targets = targets[:args.limit]

    parsed: Dict[str, Tuple[List[str], str]] = {}
    strat_counts = {"corridor": 0, "landmark": 0, "none": 0}
    for g in targets:
        tops, strat = extract_toponyms(g.get("ProjectName", ""))
        parsed[str(g["ProjectId"])] = (tops, strat)
        strat_counts[strat] += 1

    print("\nOffline extraction:")
    for k in ("corridor", "landmark", "none"):
        print(f"  {k:9s}: {strat_counts[k]:5d}  ({strat_counts[k] / max(len(targets),1) * 100:5.1f}%)")

    unique_queries = set()
    for g in targets:
        tops, strat = parsed[str(g["ProjectId"])]
        for t in tops:
            unique_queries.add(build_query(t, g.get("StateName")))
    print(f"\nUnique toponym queries after dedup: {len(unique_queries)}")
    print(f"Estimated live time at {RATE_LIMIT_SECONDS}s/req: {len(unique_queries) * RATE_LIMIT_SECONDS / 60:.0f} min")

    if args.parse_only:
        print("\n--- sample extractions ---")
        shown = 0
        for g in targets:
            tops, strat = parsed[str(g["ProjectId"])]
            if strat == "none" or shown >= 14:
                continue
            print(f"  [{strat:8s}] {tops}")
            print(f"             <- {g['ProjectName'][:105]}")
            shown += 1
        print("\n--- unparseable samples ---")
        shown = 0
        for g in targets:
            if parsed[str(g["ProjectId"])][1] == "none" and shown < 6:
                print(f"  {g['ProjectName'][:110]}")
                shown += 1
        print("\nparse-only mode: no network calls made, no files written.")
        return

    client = NominatimClient(CACHE_PATH)
    print(f"\nCache preloaded with {len(client.cache)} entries. Starting live geocoding...\n")

    stats = {"corridor": 0, "landmark": 0, "failed": 0, "unparseable": 0}
    t0 = time.time()

    for i, g in enumerate(targets, 1):
        pid = str(g["ProjectId"])
        tops, strat = parsed[pid]
        state = g.get("StateName")

        if strat == "none":
            stats["unparseable"] += 1
        else:
            coords = []
            for t in tops:
                hit = None
                for q in candidate_queries(t, state):
                    hit = client.lookup(q)
                    if hit:
                        break            # short-circuit: stop paying for looser variants
                coords.append(hit)
            good = [c for c in coords if c]
            if len(good) >= 2 and strat == "corridor":
                g["latitude"] = round(sum(c[0] for c in good) / len(good), 6)
                g["longitude"] = round(sum(c[1] for c in good) / len(good), 6)
                g["geocode_precision"] = "OSM_CORRIDOR_MIDPOINT"
                g["geocode_source"] = " <-> ".join(tops)
                stats["corridor"] += 1
            elif good:
                g["latitude"] = round(good[0][0], 6)
                g["longitude"] = round(good[0][1], 6)
                g["geocode_precision"] = "OSM_LANDMARK_MATCH"
                g["geocode_source"] = tops[0]
                stats["landmark"] += 1
            else:
                stats["failed"] += 1

        if i % 50 == 0 or i == len(targets):
            el = time.time() - t0
            rate = i / el if el else 0
            print(f"[{i:5d}/{len(targets)}] corridor={stats['corridor']} landmark={stats['landmark']} "
                  f"failed={stats['failed']} unparseable={stats['unparseable']} | "
                  f"live_reqs={client.live_requests} | {el/60:.1f}min "
                  f"| ETA {((len(targets)-i)/rate)/60 if rate else 0:.0f}min")

    client.save()

    tmp = GEO_PATH + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(geo, f, ensure_ascii=False, indent=1)
    os.replace(tmp, GEO_PATH)

    repaired = stats["corridor"] + stats["landmark"]
    print("\n" + "=" * 74)
    print(f"RE-GEOCODING COMPLETE in {(time.time()-t0)/60:.1f} min")
    print(f"  repaired      : {repaired} / {len(targets)}  ({repaired/max(len(targets),1)*100:.1f}%)")
    print(f"    corridor midpoints : {stats['corridor']}")
    print(f"    landmark matches   : {stats['landmark']}")
    print(f"  not resolved  : {stats['failed']} (OSM had no match)")
    print(f"  unparseable   : {stats['unparseable']} (no toponym in title)")
    print(f"  live requests : {client.live_requests}")
    print(f"\nWrote {GEO_PATH}")
    print("NOTE: coordinates changed -> existing satellite imagery for these projects is stale")
    print("      and must be re-fetched before change detection is meaningful.")
    print("=" * 74)


if __name__ == "__main__":
    main()
