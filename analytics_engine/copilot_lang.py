"""
PRAKALP-DRISHTI — LANGUAGE DETECTION FOR THE COPILOT

A government officer in Nagpur types Marathi, one in Hyderabad types Telugu, and a
great many type Hinglish. Answering all of them in English is a usability failure,
not a neutral default.

HOW THIS DETECTS, AND WHY NOT A MODEL
-------------------------------------
Script is decided by Unicode block, which is exact and needs no weights: Telugu text
occupies U+0C00-U+0C7F and nothing else does. That covers ten of the twelve cases
outright and runs offline, which matters because the copilot's stated posture is that
it works with no outbound call.

Two cases scripts cannot separate, and both are handled by marker words:

  * HINDI vs MARATHI both write in Devanagari. They are told apart by function words
    that do not overlap -- "आहे / नाही / काय / मध्ये" against "है / नहीं / क्या / में".
  * ENGLISH vs HINGLISH both write in Latin. Hinglish is Hindi-Urdu vocabulary in
    Roman script, so it is detected by its function words -- "kya", "hai", "nahi",
    "kitna", "batao", "chahiye".

Marker matching is deliberate rather than statistical: an officer typing one Hindi
word into an English sentence should still get English, so a single weak marker is
not enough to flip the reply language. The threshold is stated in _LATIN_THRESHOLD.

DIGITS
------
Indic scripts have their own numerals (०१२३, ౦౧౨౩ ...). The copilot's numeric guard
compares figures against the verified fact set, and it tokenises ASCII digits. A reply
written in Devanagari numerals would therefore carry figures the guard cannot see --
it would not reject them, it would not *find* them. normalise_digits() folds every
Indic numeral to ASCII before the guard runs, so the admissibility check keeps working
in every supported language rather than silently going blind in nine of them.
"""

from __future__ import annotations

import re
import unicodedata
from typing import Dict, List

# ── The supported set ────────────────────────────────────────────────────────
# Ten Indian languages by speaker population, plus Urdu, plus English, plus the
# Roman-script register most officers actually type in.
LANGUAGES: Dict[str, Dict] = {
    "en":  {"name": "English",   "native": "English",   "script": "Latin",      "rtl": False, "hello": "Hello"},
    "hi":  {"name": "Hindi",     "native": "हिन्दी",      "script": "Devanagari", "rtl": False, "hello": "नमस्ते"},
    "mr":  {"name": "Marathi",   "native": "मराठी",      "script": "Devanagari", "rtl": False, "hello": "नमस्कार"},
    "bn":  {"name": "Bengali",   "native": "বাংলা",       "script": "Bengali",    "rtl": False, "hello": "নমস্কার"},
    "te":  {"name": "Telugu",    "native": "తెలుగు",      "script": "Telugu",     "rtl": False, "hello": "నమస్కారం"},
    "ta":  {"name": "Tamil",     "native": "தமிழ்",       "script": "Tamil",      "rtl": False, "hello": "வணக்கம்"},
    "gu":  {"name": "Gujarati",  "native": "ગુજરાતી",     "script": "Gujarati",   "rtl": False, "hello": "નમસ્તે"},
    "kn":  {"name": "Kannada",   "native": "ಕನ್ನಡ",       "script": "Kannada",    "rtl": False, "hello": "ನಮಸ್ಕಾರ"},
    "ml":  {"name": "Malayalam", "native": "മലയാളം",     "script": "Malayalam",  "rtl": False, "hello": "നമസ്കാരം"},
    "pa":  {"name": "Punjabi",   "native": "ਪੰਜਾਬੀ",       "script": "Gurmukhi",   "rtl": False, "hello": "ਸਤ ਸ੍ਰੀ ਅਕਾਲ"},
    "or":  {"name": "Odia",      "native": "ଓଡ଼ିଆ",       "script": "Odia",       "rtl": False, "hello": "ନମସ୍କାର"},
    "ur":  {"name": "Urdu",      "native": "اردو",        "script": "Arabic",     "rtl": True,  "hello": "آداب"},
    "hinglish": {"name": "Hinglish", "native": "Hinglish", "script": "Latin",    "rtl": False, "hello": "Namaste"},
}

# Unicode blocks that identify a script outright.
_SCRIPT_RANGES: List[tuple] = [
    ("bn", 0x0980, 0x09FF),
    ("pa", 0x0A00, 0x0A7F),
    ("gu", 0x0A80, 0x0AFF),
    ("or", 0x0B00, 0x0B7F),
    ("ta", 0x0B80, 0x0BFF),
    ("te", 0x0C00, 0x0C7F),
    ("kn", 0x0C80, 0x0CFF),
    ("ml", 0x0D00, 0x0D7F),
    ("ur", 0x0600, 0x06FF),
    ("ur", 0x0750, 0x077F),
    ("__deva", 0x0900, 0x097F),      # Hindi or Marathi — resolved below
]

# Devanagari is shared. These function words do not overlap between the two.
_MARATHI_MARKERS = (
    "आहे", "आहेत", "नाही", "नाहीत", "काय", "कसे", "कसा", "कशी", "तुम्ही", "आम्ही",
    "मला", "त्यांना", "मध्ये", "च्या", "ला", "ने", "पण", "आणि", "किती", "कुठे",
    "प्रकल्पाची", "करा", "सांगा", "होते", "झाले",
)
_HINDI_MARKERS = (
    "है", "हैं", "नहीं", "क्या", "कैसे", "कैसा", "आप", "हम", "मुझे", "उन्हें",
    "में", "का", "की", "के", "को", "और", "कितना", "कितने", "कहाँ", "कहां",
    "बताइए", "बताओ", "कीजिए", "करें", "था", "थी", "हुआ",
)

# Hinglish in Roman script. Split by strength: one STRONG marker is decisive,
# WEAK markers need to accumulate. "The project ka status" should read Hinglish;
# "Kaal-Chakra" must not, and neither should an English sentence containing "he".
_HINGLISH_STRONG = (
    "kya", "kyu", "kyun", "kaise", "kaisa", "kaisi", "kitna", "kitne", "kitni",
    "nahi", "nahin", "hai", "hain", "batao", "bataiye", "bataye", "chahiye",
    "karo", "kijiye", "karna", "karenge", "hoga", "hogi", "matlab", "samajh",
    "theek", "thik", "achha", "acha", "accha", "mujhe", "aapko", "aapka", "hamara",
    "namaste", "namaskar", "dhanyavaad", "dhanyawad", "shukriya", "bhai",
    "jaldi", "abhi", "kripya", "krupya", "zaroori", "zaruri", "bilkul",
)
_HINGLISH_WEAK = (
    "mera", "meri", "tera", "teri", "uska", "uski", "aur", "par", "wala", "wale",
    "wali", "raha", "rahi", "rahe", "tha", "thi", "the", "hua", "hui", "koi",
    "sab", "bohot", "bahut", "thoda", "jyada", "zyada", "kal", "aaj", "ho", "hu",
    "hoon", "ka", "ki", "ke", "mein", "se", "ko", "yeh", "woh", "vo",
)
# One strong marker, or two weak ones, flips Latin text to Hinglish.
_LATIN_THRESHOLD = 1

_WORD = re.compile(r"[a-z]+")

# Indic numeral blocks, each starting at its script's DIGIT ZERO.
_DIGIT_ZEROS = (
    0x0966,  # Devanagari
    0x09E6,  # Bengali
    0x0A66,  # Gurmukhi
    0x0AE6,  # Gujarati
    0x0B66,  # Odia
    0x0BE6,  # Tamil
    0x0C66,  # Telugu
    0x0CE6,  # Kannada
    0x0D66,  # Malayalam
    0x06F0,  # Extended Arabic-Indic (Urdu)
    0x0660,  # Arabic-Indic
)
_DIGIT_MAP = {chr(z + d): str(d) for z in _DIGIT_ZEROS for d in range(10)}


def normalise_digits(text: str) -> str:
    """Fold Indic numerals to ASCII so the numeric guard can still see figures."""
    if not text:
        return text or ""
    return "".join(_DIGIT_MAP.get(ch, ch) for ch in text)


def _script_counts(text: str) -> Dict[str, int]:
    counts: Dict[str, int] = {}
    for ch in text:
        if not ch.isalpha():
            continue
        cp = ord(ch)
        for code, lo, hi in _SCRIPT_RANGES:
            if lo <= cp <= hi:
                counts[code] = counts.get(code, 0) + 1
                break
        else:
            if "a" <= ch.lower() <= "z":
                counts["__latin"] = counts.get("__latin", 0) + 1
    return counts


def _resolve_devanagari(text: str) -> tuple:
    mr = sum(1 for m in _MARATHI_MARKERS if m in text)
    hi = sum(1 for m in _HINDI_MARKERS if m in text)
    if mr > hi:
        return "mr", f"Marathi function words ({mr}) outnumber Hindi ({hi})"
    if hi > mr:
        return "hi", f"Hindi function words ({hi}) outnumber Marathi ({mr})"
    # Devanagari with no decisive marker: Hindi is the larger population.
    return "hi", "Devanagari script, no decisive Marathi marker"


def _resolve_latin(text: str) -> tuple:
    words = set(_WORD.findall(text.lower()))
    strong = words & set(_HINGLISH_STRONG)
    weak = words & set(_HINGLISH_WEAK)
    score = len(strong) * 2 + len(weak)
    if len(strong) >= _LATIN_THRESHOLD or score >= 2:
        got = sorted(strong) or sorted(weak)
        return "hinglish", f"Roman script with Hindi-Urdu markers {got[:4]}"
    return "en", "Roman script, no Hindi-Urdu markers"


def detect_language(text: str) -> Dict:
    """Identify the language of `text`.

    Returns the language record plus WHY it was chosen, so a reviewer can see
    that a reply was written in Marathi because of "आहे" and not by guesswork.
    """
    raw = (text or "").strip()
    if not raw:
        return {"code": "en", **LANGUAGES["en"], "confidence": "default",
                "basis": "empty input"}

    text_n = unicodedata.normalize("NFC", raw)
    counts = _script_counts(text_n)
    if not counts:
        return {"code": "en", **LANGUAGES["en"], "confidence": "default",
                "basis": "no alphabetic characters"}

    top, n = max(counts.items(), key=lambda kv: kv[1])
    total = sum(counts.values())

    if top == "__deva":
        code, basis = _resolve_devanagari(text_n)
    elif top == "__latin":
        code, basis = _resolve_latin(text_n)
    else:
        code, basis = top, f"{LANGUAGES[top]['script']} script ({n} chars)"

    share = n / max(total, 1)
    confidence = "high" if share >= 0.8 else "mixed"
    return {"code": code, **LANGUAGES[code], "confidence": confidence,
            "basis": basis, "script_share": round(share, 2)}


def reply_directive(lang: Dict) -> str:
    """The instruction that makes the model mirror the user's language."""
    code = lang.get("code", "en")
    if code == "en":
        return ("LANGUAGE: The officer wrote in English. Reply in English.\n")
    if code == "hinglish":
        return (
            "LANGUAGE: The officer wrote in HINGLISH (Hindi-Urdu in Roman script). "
            "Reply in the same register — natural conversational Hinglish in Roman "
            "script, NOT Devanagari, and not formal textbook Hindi. Keep technical "
            "and statutory terms in English (cost overrun, CCEA, Merkle proof, "
            "P50) because that is how officers actually say them. Numerals stay "
            "as ASCII digits.\n")
    return (
        f"LANGUAGE: The officer wrote in {lang['name']} ({lang['native']}). "
        f"Reply entirely in {lang['name']}, in its own script. Keep technical and "
        f"statutory proper nouns in English or Latin script where that is the "
        f"normal usage (CCEA, MoSPI, P50, Merkle). Write all NUMERALS as ASCII "
        f"digits (0-9), never in {lang['script']} numerals — the figures are "
        f"cryptographically checked and must remain machine-readable.\n")


def supported_summary() -> List[Dict]:
    return [{"code": c, "name": v["name"], "native": v["native"],
             "script": v["script"], "rtl": v["rtl"]}
            for c, v in LANGUAGES.items()]
