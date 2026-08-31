"""
PRAKALP-DRISHTI: ACCESSIBILITY & RESPONSIVE AUDIT

Computes WCAG 2.1 contrast ratios from the actual design tokens and audits the JSX for
the structural accessibility guarantees a keyboard or screen-reader operator depends on.

Why this is a computed test and not a checklist
-----------------------------------------------
tokens.css already carried inline claims like

    --ink-mute: #637384;   /* WCAG AA on both #FFF (4.87) and #F7F8F9 (4.58) */

Those numbers were asserted, never measured -- the same failure mode the conformal and
AFT work exists to remove, one layer up. This module recomputes every such claim from the
hex values with the WCAG 2.1 relative-luminance formula and fails if the stated ratio is
wrong by more than 0.05, so a token cannot be edited to an inaccessible value while the
comment beside it still advertises AA.

The system is an analytical terminal for long sessions in government offices, where
assistive technology and keyboard-only operation are procurement requirements rather than
nice-to-haves. Contrast, focus visibility, bypass blocks and reduced motion are therefore
treated as invariants, not polish.

Thresholds (WCAG 2.1 AA)
------------------------
    4.5:1  normal body text
    3.0:1  large text (>=18.66px bold / >=24px) and non-text UI boundaries
"""

import os
import re
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STYLES_DIR = os.path.join(BASE_DIR, "frontend", "src", "styles")
TOKENS = os.path.join(STYLES_DIR, "tokens.css")
A11Y = os.path.join(STYLES_DIR, "a11y.css")
SRC_DIR = os.path.join(BASE_DIR, "frontend", "src")

AA_TEXT = 4.5
AA_LARGE = 3.0

_failures = []
_checks = 0


def check(name, ok, detail=""):
    global _checks
    _checks += 1
    status = "PASS" if ok else "FAIL"
    print(f"  [{status}] {name}" + (f"  -- {detail}" if detail else ""))
    if not ok:
        _failures.append(f"{name}: {detail}")


# ---------------------------------------------------------------------------------
# WCAG 2.1 contrast
# ---------------------------------------------------------------------------------

def _srgb_to_linear(c: float) -> float:
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def relative_luminance(hex_color: str) -> float:
    h = hex_color.lstrip("#")
    if len(h) == 3:
        h = "".join(ch * 2 for ch in h)
    r, g, b = (int(h[i:i + 2], 16) / 255.0 for i in (0, 2, 4))
    return (0.2126 * _srgb_to_linear(r)
            + 0.7152 * _srgb_to_linear(g)
            + 0.0722 * _srgb_to_linear(b))


def contrast_ratio(fg: str, bg: str) -> float:
    l1, l2 = relative_luminance(fg), relative_luminance(bg)
    hi, lo = max(l1, l2), min(l1, l2)
    return (hi + 0.05) / (lo + 0.05)


def parse_theme_blocks(css: str):
    """Return {theme_name: {token: hex}} for :root and each [data-theme=...] block."""
    themes = {}
    # Match a selector head followed by its brace body (non-nested token blocks only).
    for m in re.finditer(r'(:root|\[data-theme="([a-z]+)"\])\s*\{([^}]*)\}', css):
        name = m.group(2) or "default"
        body = m.group(3)
        toks = dict(re.findall(r'(--[a-zA-Z0-9-]+)\s*:\s*(#[0-9a-fA-F]{3,8})\s*;', body))
        if not toks:
            continue
        themes.setdefault(name, {}).update(toks)
    return themes


# ---------------------------------------------------------------------------------
# 1. Contrast of the real token palette, per theme
# ---------------------------------------------------------------------------------

print("\n--- TEST 1: WCAG 2.1 CONTRAST OF DESIGN TOKENS (all themes) ---")

assert os.path.exists(TOKENS), f"tokens.css missing at {TOKENS} -- did the CSS split move it?"
tokens_css = open(TOKENS, encoding="utf-8").read()
themes = parse_theme_blocks(tokens_css)

check("tokens.css exposes a default theme", "default" in themes,
      f"themes found: {sorted(themes)}")

# Foreground tokens that render body text, against the surfaces they sit on.
TEXT_ON_SURFACE = [
    ("--ink", ["--surface", "--surface-2", "--page-bg"], AA_TEXT),
    ("--ink-soft", ["--surface", "--surface-2"], AA_TEXT),
    ("--ink-mute", ["--surface", "--surface-2"], AA_TEXT),
]
# Non-text boundaries and large/status colour only need 3:1.
UI_ON_SURFACE = [
    # --line-strong draws decorative separators (hairlines, tab underlines), which
    # WCAG 1.4.11 explicitly exempts as pure decoration. The token that bounds an
    # INTERACTIVE control is --line-field, and that one is not exempt.
    ("--line-field", ["--surface", "--surface-2"], AA_LARGE),
    ("--emerald", ["--surface"], AA_LARGE),
    ("--crimson", ["--surface"], AA_LARGE),
    ("--azure", ["--surface"], AA_LARGE),
    ("--amber", ["--surface"], AA_LARGE),
]

for theme, toks in sorted(themes.items()):
    for fg, bgs, threshold in TEXT_ON_SURFACE + UI_ON_SURFACE:
        if fg not in toks:
            continue
        for bg in bgs:
            if bg not in toks:
                continue
            ratio = contrast_ratio(toks[fg], toks[bg])
            check(f"[{theme}] {fg} on {bg} >= {threshold}",
                  ratio >= threshold,
                  f"{toks[fg]} on {toks[bg]} = {ratio:.2f}:1")

# ---------------------------------------------------------------------------------
# 2. Inline WCAG claims in the CSS must be TRUE
# ---------------------------------------------------------------------------------

print("\n--- TEST 2: INLINE WCAG COMMENTS MATCH COMPUTED RATIOS ---")

# e.g.  --ink-mute: #637384;   /* WCAG AA on both #FFF (4.87) and #F7F8F9 (4.58) */
claim_re = re.compile(
    r'(--[a-zA-Z0-9-]+)\s*:\s*(#[0-9a-fA-F]{3,8})\s*;\s*/\*([^*]*?)\*/')
claims_found = 0
for tok, hexval, comment in claim_re.findall(tokens_css):
    pairs = re.findall(r'(#[0-9a-fA-F]{3,6})\s*\(([0-9]+\.[0-9]+)\)', comment)
    for bg_hex, stated in pairs:
        claims_found += 1
        actual = contrast_ratio(hexval, bg_hex)
        stated_f = float(stated)
        check(f"{tok} claims {stated} on {bg_hex}",
              abs(actual - stated_f) <= 0.05,
              f"computed {actual:.2f}:1")

check("at least one inline WCAG claim exists to verify", claims_found >= 1,
      f"{claims_found} claim(s) parsed")

# ---------------------------------------------------------------------------------
# 3. Structural accessibility guarantees
# ---------------------------------------------------------------------------------

print("\n--- TEST 3: STRUCTURAL A11Y INVARIANTS ---")

a11y_css = open(A11Y, encoding="utf-8").read() if os.path.exists(A11Y) else ""
all_css = "\n".join(
    open(os.path.join(STYLES_DIR, f), encoding="utf-8").read()
    for f in os.listdir(STYLES_DIR) if f.endswith(".css")
) if os.path.isdir(STYLES_DIR) else ""

check("prefers-reduced-motion is honoured",
      "prefers-reduced-motion" in all_css, "")
check("reduced-motion actually disables animation",
      re.search(r'prefers-reduced-motion[\s\S]{0,400}animation-duration:\s*0', all_css)
      is not None, "")
check("focus-visible ring is enforced globally",
      ":focus-visible" in all_css and "outline" in a11y_css, "")
# `outline: none` on :focus is legitimate ONLY when the same selector restores a
# visible ring on :focus-visible -- the standard pattern that keeps pointer focus quiet
# while keeping keyboard focus visible. Stripping it with no :focus-visible counterpart
# leaves keyboard operators with no focus cue at all (WCAG 2.4.7).
_stripped = re.findall(r'([.\w-]+):focus\s*\{[^}]*outline:\s*none', all_css)
_unpaired = [sel for sel in _stripped
             if not re.search(re.escape(sel) + r':focus-visible\s*\{[^}]*outline:\s*\d',
                              all_css)]
check("every :focus that drops the outline restores it on :focus-visible",
      not _unpaired,
      f"unpaired: {_unpaired}" if _unpaired else f"{len(_stripped)} paired correctly")

app_jsx = open(os.path.join(SRC_DIR, "App.jsx"), encoding="utf-8").read()
check("skip-to-content link present (WCAG 2.4.1 Bypass Blocks)",
      "skip-to-content" in app_jsx and "#main-content" in app_jsx, "")
check("skip link target exists",
      'id="main-content"' in app_jsx, "")
check("a <main> landmark is rendered",
      "<main" in app_jsx, "")
check(".skip-to-content is styled (not purged into invisibility)",
      ".skip-to-content" in all_css, "")

# ---------------------------------------------------------------------------------
# 4. Accessible names on interactive elements
# ---------------------------------------------------------------------------------

print("\n--- TEST 4: ACCESSIBLE NAMES ON INTERACTIVE ELEMENTS ---")


_BLOCK_COMMENT = re.compile(r'/\*[\s\S]*?\*/')
_LINE_COMMENT = re.compile(r'^\s*//.*$', re.M)


def strip_comments(src: str) -> str:
    """Remove comments before scanning for markup.

    Without this the audit reported five <img> elements with no alt, every one of
    which was a code comment discussing `<img src=x onerror=alert(1)>` XSS and the
    fact that <img src> cannot carry an Authorization header. Auditing commentary as
    if it were markup produces findings that cannot be fixed.
    """
    return _LINE_COMMENT.sub("", _BLOCK_COMMENT.sub("", src))


def jsx_files():
    for root, _dirs, files in os.walk(os.path.join(BASE_DIR, "frontend")):
        if "node_modules" in root or "dist" in root:
            continue
        for f in files:
            if f.endswith(".jsx"):
                yield os.path.join(root, f)


ICON_ONLY = re.compile(
    r'<button\b(?P<attrs>[^>]*)>(?P<inner>\s*<[A-Z][A-Za-z0-9]*\b[^>]*/>\s*)</button>',
    re.S)

nameless = []
img_no_alt = []
for path in jsx_files():
    src = strip_comments(open(path, encoding="utf-8", errors="replace").read())
    rel = os.path.relpath(path, BASE_DIR)
    # A button whose only child is an icon component and which carries no
    # aria-label/aria-labelledby/title is unreachable by name for a screen reader.
    for m in ICON_ONLY.finditer(src):
        attrs = m.group("attrs")
        if not re.search(r'aria-label|aria-labelledby|\btitle=', attrs):
            line = src[:m.start()].count("\n") + 1
            nameless.append(f"{rel}:{line}")
    for m in re.finditer(r'<img\b([^>]*)>', src):
        if "alt=" not in m.group(1):
            line = src[:m.start()].count("\n") + 1
            img_no_alt.append(f"{rel}:{line}")

check("no icon-only <button> lacks an accessible name",
      not nameless,
      f"{len(nameless)} found: {nameless[:5]}")
check("every <img> declares alt",
      not img_no_alt,
      f"{len(img_no_alt)} found: {img_no_alt[:5]}")

# ---------------------------------------------------------------------------------
# 5. Responsive breakpoints
# ---------------------------------------------------------------------------------

print("\n--- TEST 5: RESPONSIVE BREAKPOINT COVERAGE ---")

jsx_all = "\n".join(
    open(p, encoding="utf-8", errors="replace").read() for p in jsx_files())

for bp, label in (("sm:", "640px tablet-portrait"),
                  ("lg:", "1024px desktop")):
    n = jsx_all.count(bp)
    check(f"breakpoint '{bp}' is used ({label})", n >= 10, f"{n} occurrences")

check("root layout adapts padding across breakpoints",
      re.search(r'px-4\s+sm:px-6\s+lg:px-8', app_jsx) is not None, "")
check("no viewport-blocking user-scalable=no",
      "user-scalable=no" not in open(
          os.path.join(BASE_DIR, "frontend", "index.html"), encoding="utf-8").read(),
      "pinch-zoom must remain available")

# A fixed pixel width wider than the smallest supported viewport forces horizontal
# scrolling of the whole page on mobile.
MIN_VIEWPORT = 360
wide = []
for path in jsx_files():
    src = open(path, encoding="utf-8", errors="replace").read()
    rel = os.path.relpath(path, BASE_DIR)
    for m in re.finditer(r'className="([^"]*)"', src):
        cls = m.group(1)
        # Only the UNPREFIXED width is a floor; `sm:w-[560px]` applies above 640px.
        base = [int(w) for w in re.findall(r'(?:^|\s)w-\[(\d{3,4})px\]', cls)]
        over = [w for w in base if w > MIN_VIEWPORT]
        if not over:
            continue
        # Exempt when the element cannot force the PAGE to scroll: it is out of flow,
        # clips its own overflow, scrolls internally, or is capped to the container.
        exempt = any(t in cls for t in
                     ("absolute", "fixed", "overflow-hidden",
                      "overflow-x-auto", "overflow-auto", "max-w-full"))
        if not exempt:
            line = src[:m.start()].count("\n") + 1
            wide.append(f"{rel}:{line} {over}")
check(f"no in-flow fixed width exceeds the {MIN_VIEWPORT}px minimum viewport",
      not wide, f"{len(wide)} found: {wide[:5]}")

# ---------------------------------------------------------------------------------
# REPORT
# ---------------------------------------------------------------------------------

print()
print("=" * 78)
if _failures:
    print(f"A11Y AUDIT FAILED: {len(_failures)} of {_checks} checks")
    for f in _failures:
        print(f"  - {f}")
    print("=" * 78)
    sys.exit(1)

print(f"ASSERTIONS PASSED: {_checks} accessibility and responsive checks, 0 failures.")
print("=" * 78)
