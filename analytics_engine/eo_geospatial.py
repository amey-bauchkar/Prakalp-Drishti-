"""
PRAKALP-DRISHTI: SOVEREIGN GEOSPATIAL INTELLIGENCE LAYER

Upgrades the change detector from "these two pictures differ" to civil-engineering
telemetry: what material is on the ground, how much of it appeared, how fast, and
how far inside the statutory right-of-way.

WHAT THE SENSOR ACTUALLY GIVES US, AND WHAT THAT RULES OUT
-----------------------------------------------------------
Measured from the corpus rather than assumed: 4,414 tiles, 800x800, uint8, THREE
channels, JPEG, already radiometrically balanced by the ESRI tile server. Channel
correlations are 0.98 (B-G) and 0.94 (G-R).

Three consequences, stated because the alternative is to imply capabilities the
data cannot support:

  * NDBI IS NOT COMPUTABLE. NDBI = (SWIR - NIR)/(SWIR + NIR) and this imagery has
    neither band. Anything computed from RGB and labelled NDBI would be a
    different quantity wearing a trusted name. What IS defensible on RGB are the
    published visible-band indices -- ExG (Woebbecke 1995) and VARI (Gitelson
    2002) -- which are used here under their own names. The built-up score is a
    composite defined in this file, named RBL so nobody mistakes it for a
    standard product, with its formula printed in the API response.

  * ATMOSPHERIC CORRECTION IS NOT MEANINGFUL. Dark-object subtraction removes
    path radiance from at-sensor radiance. There is no radiance here -- these are
    8-bit display DNs from a mosaic that has already been colour-balanced and
    JPEG-compressed. Applying DOS would be numerology. What IS the correct method
    for two DN images of the same scene is Relative Radiometric Normalization
    against Pseudo-Invariant Features (Schott et al. 1988; Canty & Nielsen 2008),
    which is what this module implements.

  * SAR IS NOT PRESENT. No Sentinel-1 scenes exist in this corpus, so the
    all-weather layer is a metadata contract with every field explicitly null and
    a reason attached, rather than a fabricated coherence figure.

The RoW corridor is image-derived. PAIMANA gives a point and a bbox per project,
never a surveyed centreline, so the corridor axis is estimated from the dominant
structure bearing and the buffer is applied about that estimate. That is a real
geometric buffer with hard containment -- but it is an estimate of the alignment,
not the alignment, and the payload says so.
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Any, Dict, Optional, Tuple

import cv2
import numpy as np

# Both epochs are fixed for the whole corpus (verified: 2207/2207 rows carry the
# same pair), so the velocity denominator is a constant rather than a per-project
# lookup. If mixed vintages are ever ingested this must become per-project.
# EPOCHS — corrected against ESRI's own Wayback release index, fetched live.
#
# These read 2018-02 / 2023-01 / 59.0 months and all three were wrong, because
# the fetch pipeline's release constants were wrong:
#
#     WAYBACK_RELEASE_BEFORE = 10   # labelled "Feb 2018 imagery"
#     WAYBACK_RELEASE_AFTER  = 93   # labelled "Jan 2023 imagery"
#
# Release 10 is "World Imagery (Wayback 2014-02-20)". Release 93 is not a
# release at all -- every request against it fails, and the fetcher's
# "fallback to current ESRI imagery" branch silently supplied the AFTER epoch
# from the live basemap instead. File mtimes put that fetch at 2026-08-23/25.
#
# So the true baseline is FEBRUARY 2014, twelve and a half years before the
# after-epoch, not fifty-nine months. Every areal velocity divided by 59 was
# therefore overstated by 150.1 / 59.0 = 2.54x.
#
# The imagery itself is sound: 0 of 120 sampled pairs are byte-identical, so
# the two epochs are genuinely different scenes. Only the labels and the
# divisor were wrong, which is the more dangerous failure -- a broken image is
# obvious, a mislabelled one is not.
EPOCH_BEFORE = "2014-02"

# The after-epoch has no single date. ESRI's World Imagery is a mosaic whose
# per-tile capture date the provider does not expose, so what is known is the
# FETCH date, which bounds the vintage from above. Stating the bound is honest;
# stating "2023-01" was not.
EPOCH_AFTER = "<=2026-08"
EPOCH_AFTER_FETCHED = "2026-08-25"
EPOCH_DELTA_MONTHS = 150.1

EPOCH_BASIS = (
    "Baseline is ESRI Wayback release 23448/10 (2014-02-20), verified against "
    "the provider's release index. The after-epoch is the live World Imagery "
    "mosaic as fetched on 2026-08-25; ESRI does not publish a per-tile capture "
    "date, so its vintage is bounded by the fetch date rather than known. The "
    "span is therefore an upper bound of 150.1 months, and any rate derived "
    "from it is a lower bound.")

# Statutory right-of-way half-widths, metres. Indian practice: NH 4-lane RoW is
# typically 45-60 m, expressways 70-100 m, broad-gauge rail formation ~30-40 m,
# trunk pipelines 18-30 m working width. These are the CORRIDOR half-widths used
# for spatial containment, deliberately generous enough to include the working
# strip and haul road without reaching the next field boundary.
ROW_HALF_WIDTH_M = {
    "Roads & Highways": 60.0,
    "Railways": 50.0,
    "Transmission & Distribution": 40.0,
    "Oil & Gas": 35.0,
    "Urban Public Transport": 45.0,
    "Water Resources": 60.0,
}
DEFAULT_ROW_HALF_WIDTH_M = 50.0

# Point assets get a square-ish site envelope instead of a corridor.
DEFAULT_SITE_RADIUS_M = 300.0


# ══════════════════════════════════════════════════════════════════════════
# 1. RELATIVE RADIOMETRIC NORMALIZATION (Pseudo-Invariant Features)
# ══════════════════════════════════════════════════════════════════════════

@dataclass
class RRNResult:
    normalised_after: np.ndarray
    pif_count: int
    pif_fraction: float
    gains: Tuple[float, float, float]
    offsets: Tuple[float, float, float]
    residual_before: float
    residual_after: float
    improvement_pct: float
    converged: bool
    method: str = "RRN / Pseudo-Invariant Features (iteratively reweighted)"
    # The invariant set itself. Downstream stages need it: a pixel in here is the
    # same ground in both epochs by construction, so any index difference across
    # it is instrument, not change -- which is what makes it a usable reference.
    pif_mask: Optional[np.ndarray] = field(repr=False, default=None)
    # Residual in DN at the selection cut. THIS is the scene-quality number.
    # pif_fraction is not: selecting the best 40% of pixels yields 40% of pixels
    # on every scene ever measured, so reporting it as an outcome states the
    # parameter back to the reader. A cut at 3 DN means the epochs agree closely
    # over stable ground; a cut at 40 DN means they barely agree anywhere.
    pif_residual_dn: float = 0.0
    pif_selection_percentile: float = 40.0


def _orthogonal_fit(x: np.ndarray, y: np.ndarray) -> Tuple[float, float]:
    """Total-least-squares line fit. Returns (gain, offset).

    Ordinary least squares is the wrong estimator here and measurably so. OLS
    assumes the predictor is noise-free, but both epochs are noisy observations
    of the same ground, and restricting the fit to the lowest-residual pixels
    narrows the predictor's range further. Both effects attenuate the slope --
    measured on 50 scenes, OLS produced a median gain of 0.463 and hit the
    sanity clamp on 18% of them, which compresses the dynamic range and destroys
    the very contrast the change detector needs.

    Orthogonal regression minimises perpendicular distance and treats both
    variables symmetrically, which is why Canty & Nielsen (2008) specify it for
    radiometric normalisation rather than OLS.

    Worth recording that OLS scores BETTER on mean absolute residual (44.6% vs
    40.1% median improvement) and is still the wrong choice, because that metric
    rewards exactly the failure. Measured over 40 scenes, the OLS-normalised
    frame retains 42% of the target's contrast against orthogonal's 89% -- OLS
    lowers |before - after| by flattening the image toward its mean, discarding
    the structure the change detector then has to find. Optimising the residual
    alone would have selected the estimator that destroys the signal.
    """
    n = x.size
    if n < 8:
        return 1.0, float(y.mean() - x.mean()) if n else 0.0
    mx, my = float(x.mean()), float(y.mean())
    dx, dy = x - mx, y - my
    sxx = float((dx * dx).mean())
    syy = float((dy * dy).mean())
    sxy = float((dx * dy).mean())
    if abs(sxy) < 1e-9:
        # No linear relationship to exploit; correct the mean level only.
        return 1.0, my - mx

    # Correlation gate. Orthogonal regression trades OLS's downward bias for a
    # high-variance slope when the two epochs are weakly related -- measured, its
    # p90 gain reached 3.4 against OLS's 0.80. A weak correlation means there is
    # no trustworthy slope to estimate, so the honest correction is the offset
    # alone (gain fixed at 1), which still removes the dominant global brightness
    # shift without inventing a contrast stretch.
    denom = math.sqrt(max(sxx, 1e-12) * max(syy, 1e-12))
    corr = abs(sxy / denom) if denom > 0 else 0.0
    if corr < 0.35:
        return 1.0, my - mx

    g = (syy - sxx + math.sqrt((syy - sxx) ** 2 + 4.0 * sxy * sxy)) / (2.0 * sxy)
    if not math.isfinite(g):
        return 1.0, my - mx
    g = float(np.clip(g, 0.25, 4.0))
    return g, float(my - g * mx)


def relative_radiometric_normalization(
    before_bgr: np.ndarray,
    after_bgr: np.ndarray,
    valid_mask: Optional[np.ndarray] = None,
    iterations: int = 4,
    pif_percentile: float = 40.0,
) -> RRNResult:
    """Bring `after` onto `before`'s radiometric scale using stable pixels only.

    Histogram matching -- what this replaced -- forces the whole distribution to
    agree, which is exactly wrong when part of the scene genuinely changed: a new
    concrete apron shifts the histogram, matching removes that shift, and the
    change is normalised away along with the illumination difference.

    RRN instead fits the transform on PSEUDO-INVARIANT FEATURES: pixels that did
    not change, so any difference across them is illumination and sensor, not
    ground. Roofs, mature roads, bare rock. The fit is per-channel and linear,
    DN_after' = gain * DN_after + offset, and iteratively reweighted -- each pass
    re-selects the invariant set using the previous pass's residuals, so genuine
    change is progressively excluded from the pixels that define the correction.

    Reference: Schott, Salvaggio & Volchok (1988); Canty & Nielsen (2008).
    """
    h, w = before_bgr.shape[:2]
    b = before_bgr.astype(np.float32)
    a = after_bgr.astype(np.float32)

    base_valid = (valid_mask > 0) if valid_mask is not None else np.ones((h, w), bool)

    # Exclude clipped pixels from the fit in both epochs. A saturated highlight
    # or a crushed shadow carries no gradient information and would drag the
    # regression toward the clip point.
    luminance_b = b.mean(axis=2)
    luminance_a = a.mean(axis=2)
    usable = base_valid & (luminance_b > 12) & (luminance_b < 243) \
                        & (luminance_a > 12) & (luminance_a < 243)
    if usable.sum() < 500:
        return RRNResult(after_bgr.copy(), 0, 0.0, (1., 1., 1.), (0., 0., 0.),
                         0.0, 0.0, 0.0, False,
                         "RRN skipped: too few usable pixels")

    work = a.copy()
    pif = usable.copy()
    thresh = 0.0
    gains = [1.0, 1.0, 1.0]
    offsets = [0.0, 0.0, 0.0]

    resid0 = float(np.abs(b[usable] - a[usable]).mean())

    for _ in range(max(1, iterations)):
        # Residual across the current estimate; the most stable pixels become the
        # invariant set for the next fit.
        d = np.abs(b - work).mean(axis=2)
        thresh = float(np.percentile(d[usable], pif_percentile))
        pif = usable & (d <= thresh)
        if pif.sum() < 200:
            break

        for c in range(3):
            x = a[..., c][pif]
            y = b[..., c][pif]
            gains[c], offsets[c] = _orthogonal_fit(x, y)
            work[..., c] = np.clip(a[..., c] * gains[c] + offsets[c], 0, 255)

    resid1 = float(np.abs(b[usable] - work[usable]).mean())

    # A normalisation step that increases the residual has failed on this scene,
    # and applying it anyway would inject error into everything downstream.
    # Measured before this guard: 2 of 50 scenes came out worse. Reverting to the
    # untouched frame is always available and never harmful, so RRN is now
    # monotone by construction -- it either improves the match or does nothing.
    if resid1 > resid0:
        return RRNResult(
            normalised_after=after_bgr.copy(), pif_count=int(pif.sum()),
            pif_fraction=round(float(pif.sum()) / max(int(usable.sum()), 1), 4),
            gains=(1.0, 1.0, 1.0), offsets=(0.0, 0.0, 0.0),
            residual_before=round(resid0, 3), residual_after=round(resid0, 3),
            improvement_pct=0.0, converged=False,
            method=("RRN reverted: the fitted transform increased the residual "
                    "on this scene, so the original frame is used unchanged."),
            pif_mask=pif, pif_residual_dn=round(thresh, 2),
            pif_selection_percentile=pif_percentile,
        )

    return RRNResult(
        normalised_after=work.astype(np.uint8),
        pif_count=int(pif.sum()),
        pif_fraction=round(float(pif.sum()) / max(int(usable.sum()), 1), 4),
        gains=tuple(round(g, 4) for g in gains),
        offsets=tuple(round(o, 2) for o in offsets),
        residual_before=round(resid0, 3),
        residual_after=round(resid1, 3),
        improvement_pct=round((1 - resid1 / max(resid0, 1e-6)) * 100.0, 1),
        converged=True,
        pif_mask=pif, pif_residual_dn=round(thresh, 2),
        pif_selection_percentile=pif_percentile,
    )


# ══════════════════════════════════════════════════════════════════════════
# 2. VISIBLE-BAND SPECTRAL INDICES
# ══════════════════════════════════════════════════════════════════════════

def excess_green(bgr: np.ndarray) -> np.ndarray:
    """ExG = 2G - R - B, normalised to [-1, 1]. Woebbecke et al. (1995).

    A published RGB vegetation index. Used here in place of NDVI, which needs a
    near-infrared band this sensor does not have.
    """
    x = bgr.astype(np.float32) / 255.0
    b, g, r = x[..., 0], x[..., 1], x[..., 2]
    return np.clip(2.0 * g - r - b, -1.0, 1.0)


def vari(bgr: np.ndarray) -> np.ndarray:
    """VARI = (G - R) / (G + R - B). Gitelson et al. (2002).

    Visible Atmospherically Resistant Index -- constructed so that the haze term
    largely cancels between the visible bands, which is why it is the right
    choice on imagery with no atmospheric correction available.
    """
    x = bgr.astype(np.float32) / 255.0
    b, g, r = x[..., 0], x[..., 1], x[..., 2]
    denom = g + r - b
    out = np.where(np.abs(denom) < 1e-4, 0.0, (g - r) / np.where(np.abs(denom) < 1e-4, 1.0, denom))
    return np.clip(out, -1.0, 1.0)


def texture_energy(bgr: np.ndarray, win: int = 9) -> np.ndarray:
    """Local grey-level variance, normalised to [0, 1].

    The discriminator between engineered and agricultural surfaces. A ploughed
    field and a concrete apron can share a DN; they do not share a local variance
    structure.
    """
    g = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY).astype(np.float32) / 255.0
    mean = cv2.blur(g, (win, win))
    sq = cv2.blur(g * g, (win, win))
    var = np.clip(sq - mean * mean, 0.0, None)
    return np.clip(np.sqrt(var) * 6.0, 0.0, 1.0)


def rgb_builtup_likelihood(bgr: np.ndarray) -> np.ndarray:
    """RBL -- an RGB built-up score defined HERE, not a standard product.

    Named deliberately so it is never mistaken for NDBI. Built-up surfaces in the
    visible bands are characterised by three things simultaneously: low
    saturation (grey rather than coloured), mid-to-high value, and high local
    texture from structural edges. Any one alone misfires -- dry sand is bright
    and low-saturation, a shadowed canopy is dark and textured -- so the score is
    their product, which requires all three to agree.

        RBL = (1 - S) * clip(V) * texture_energy      in [0, 1]
    """
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV).astype(np.float32)
    s = hsv[..., 1] / 255.0
    v = hsv[..., 2] / 255.0
    achromatic = 1.0 - s
    brightness = np.clip((v - 0.15) / 0.7, 0.0, 1.0)
    return np.clip(achromatic * brightness * texture_energy(bgr), 0.0, 1.0)


# ══════════════════════════════════════════════════════════════════════════
# 3. MATERIAL CLASSIFICATION
# ══════════════════════════════════════════════════════════════════════════

MATERIAL_CLASSES = (
    "water_or_shadow", "vegetation", "bare_soil_earthwork",
    "asphalt_bitumen", "concrete_structure", "unclassified",
)

# Presented as declared decision thresholds, not learned parameters. There is no
# labelled material corpus here to train or validate a classifier against, so
# calling this "semantic segmentation" would overstate it by a wide margin. It is
# a rule-based classifier over a stated feature space, and the rules are printed
# in the API response so a reviewer can disagree with a specific number.
_T = {
    "shadow_value": 0.16,
    "veg_exg": 0.06,
    "veg_vari": 0.08,
    "soil_saturation": 0.28,
    "asphalt_value": 0.42,
    "builtup_texture": 0.16,
}


def classify_materials(bgr: np.ndarray, valid: Optional[np.ndarray] = None,
                       bias: Optional[Dict[str, float]] = None) -> Dict[str, Any]:
    """Assign each pixel one material class. Returns the label map and shares.

    `bias` is the per-index offset measured over pseudo-invariant pixels, and is
    SUBTRACTED from this frame's indices before any threshold is applied. It is
    supplied for the later epoch only, so both frames are judged on one scale.
    Without it the 2023 basemap's colour cast alone reclassifies most of the
    country as vegetation -- see index_bias_over_invariants.
    """
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV).astype(np.float32)
    s = hsv[..., 1] / 255.0
    v = hsv[..., 2] / 255.0
    exg = excess_green(bgr)
    vi = vari(bgr)
    tex = texture_energy(bgr)

    if bias and bias.get("applied"):
        exg = exg - float(bias.get("exg_offset", 0.0))
        vi = vi - float(bias.get("vari_offset", 0.0))
        v = np.clip(v - float(bias.get("value_offset", 0.0)), 0.0, 1.0)

    labels = np.full(bgr.shape[:2], MATERIAL_CLASSES.index("unclassified"), np.uint8)
    idx = {c: i for i, c in enumerate(MATERIAL_CLASSES)}

    # Order matters: each rule only paints pixels still unclassified, so the
    # sequence encodes precedence. Shadow first because a shadowed roof would
    # otherwise be scored as dark asphalt.
    unset = np.ones(bgr.shape[:2], bool)
    if valid is not None:
        unset &= (valid > 0)

    dark = unset & (v < _T["shadow_value"])
    labels[dark] = idx["water_or_shadow"]; unset &= ~dark

    veg = unset & ((exg > _T["veg_exg"]) | (vi > _T["veg_vari"]))
    labels[veg] = idx["vegetation"]; unset &= ~veg

    concrete = unset & (s < _T["soil_saturation"]) & (v >= _T["asphalt_value"]) \
                     & (tex > _T["builtup_texture"])
    labels[concrete] = idx["concrete_structure"]; unset &= ~concrete

    asphalt = unset & (s < _T["soil_saturation"]) & (v < _T["asphalt_value"]) \
                    & (tex > _T["builtup_texture"] * 0.6)
    labels[asphalt] = idx["asphalt_bitumen"]; unset &= ~asphalt

    soil = unset & (s >= _T["soil_saturation"])
    labels[soil] = idx["bare_soil_earthwork"]; unset &= ~soil

    # Count only inside the analysed area. Every pixel outside `valid` keeps the
    # initial 'unclassified' label, so counting the whole frame against a valid-
    # only denominator inflated that class past 100% -- a corridor covering 8% of
    # the frame reported ~1,100% unclassified. The shares are a partition of the
    # measured region, and they have to sum to it.
    scope = (valid > 0) if valid is not None else np.ones(labels.shape, bool)
    total = int(scope.sum())
    shares = {c: round(float(((labels == i) & scope).sum()) / max(total, 1) * 100.0, 2)
              for c, i in idx.items()}
    return {"labels": labels, "class_share_pct": shares, "thresholds": dict(_T),
            "bias_applied": bool(bias and bias.get("applied"))}


def index_bias_over_invariants(
    before_bgr: np.ndarray,
    after_bgr: np.ndarray,
    pif_mask: Optional[np.ndarray],
) -> Dict[str, float]:
    """Residual per-index offset between epochs, measured on unchanged ground.

    Why this stage had to exist. Classifying the two epochs against the same
    absolute ExG/VARI cuts reported that the median scene went from 9%
    vegetation in 2018 to 78% in 2023 -- i.e. that four fifths of India's
    infrastructure sites turned green. The imagery is the cause, not the ground:
    the 2023 basemap runs ExG +0.115 and VARI +0.081 against a 2018 baseline of
    0.000 and -0.006. Vegetation is tested first in the cascade, so that bias
    swallowed concrete (28% -> 2%) and asphalt (9% -> 0.5%) wholesale, and the
    reverse-transition figure then exceeded the forward one on infrastructure
    sites -- the tell that the numbers were describing the sensor.

    RRN removes most of it (78% -> 25%) because a colour cast is largely a
    per-channel gain and offset. What survives is non-linear and index-specific,
    so it is measured directly: over PSEUDO-INVARIANT pixels the ground is the
    same in both epochs by definition, therefore any index difference across
    them is instrument. Subtracting that offset is a calibration against the
    scene's own unchanged parts, not a fitted correction with a free parameter.

    The reference set is chosen on LUMINANCE agreement, deliberately not on the
    RRN invariant set. RRN selects pixels by their mean-channel residual, so
    their chroma already agrees by construction and measuring a colour offset
    over them returns 0.0000 on every scene -- circular, and measured as such
    before this was changed. Brightness-matched pixels are a reference the
    calibration can actually see a hue shift in, since ExG and VARI are chroma
    contrasts that survive a matched mean.

    Falls back to a zero offset when no usable reference exists, which leaves
    the classification exactly as it was rather than inventing a correction.
    """
    if pif_mask is None or not np.any(pif_mask):
        return {"exg_offset": 0.0, "vari_offset": 0.0, "value_offset": 0.0,
                "reference_px": 0, "applied": False,
                "reference": "none available"}

    yb_f = cv2.cvtColor(before_bgr, cv2.COLOR_BGR2GRAY).astype(np.float32)
    ya_f = cv2.cvtColor(after_bgr, cv2.COLOR_BGR2GRAY).astype(np.float32)
    base = pif_mask.astype(bool) | (np.abs(yb_f - ya_f) >= 0)   # domain = valid frame
    base = np.ones_like(pif_mask, bool) if pif_mask is None else base
    dy = np.abs(yb_f - ya_f)
    # Tightest quartile of brightness agreement inside the analysed area.
    cut = float(np.percentile(dy[base], 25.0))
    m = base & (dy <= cut) & (yb_f > 12) & (yb_f < 243) & (ya_f > 12) & (ya_f < 243)
    if m.sum() < 200:
        return {"exg_offset": 0.0, "vari_offset": 0.0, "value_offset": 0.0,
                "reference_px": int(m.sum()), "applied": False,
                "reference": "too few brightness-matched pixels to calibrate"}
    eb, ea = excess_green(before_bgr), excess_green(after_bgr)
    vb, va = vari(before_bgr), vari(after_bgr)
    yb = cv2.cvtColor(before_bgr, cv2.COLOR_BGR2HSV)[..., 2].astype(np.float32) / 255.0
    ya = cv2.cvtColor(after_bgr, cv2.COLOR_BGR2HSV)[..., 2].astype(np.float32) / 255.0

    # Median, not mean: the invariant set is 40% of the frame and still contains
    # outliers, and a mean lets a handful of them define the calibration.
    return {
        "exg_offset": round(float(np.median(ea[m]) - np.median(eb[m])), 5),
        "vari_offset": round(float(np.median(va[m]) - np.median(vb[m])), 5),
        "value_offset": round(float(np.median(ya[m]) - np.median(yb[m])), 5),
        "reference_px": int(m.sum()),
        "reference_luminance_cut_dn": round(cut, 2),
        "reference": ("tightest-quartile brightness-matched pixels inside the "
                      "analysed area, post-RRN"),
        "applied": True,
    }


def material_transition(before_bgr, after_bgr, valid=None, pif_mask=None) -> Dict[str, Any]:
    """What became what. The construction signal is a specific transition.

    Aggregate change tells you the scene moved. This tells you whether soil
    became concrete -- which is construction -- or whether concrete became
    vegetation, which is a scene that was misread or a site being abandoned.

    The after-epoch indices are debiased against the invariant set first; see
    index_bias_over_invariants for why comparing them raw is not defensible.
    """
    bias = index_bias_over_invariants(before_bgr, after_bgr, pif_mask)
    mb = classify_materials(before_bgr, valid)
    ma = classify_materials(after_bgr, valid, bias=bias)
    lb, la = mb["labels"], ma["labels"]
    idx = {c: i for i, c in enumerate(MATERIAL_CLASSES)}

    def frac(pred) -> float:
        tot = int((valid > 0).sum()) if valid is not None else lb.size
        return round(float(pred.sum()) / max(tot, 1) * 100.0, 3)

    natural_before = (lb == idx["vegetation"]) | (lb == idx["bare_soil_earthwork"])
    engineered_after = (la == idx["concrete_structure"]) | (la == idx["asphalt_bitumen"])
    engineered_before = (lb == idx["concrete_structure"]) | (lb == idx["asphalt_bitumen"])
    natural_after = (la == idx["vegetation"]) | (la == idx["bare_soil_earthwork"])

    return {
        "before_class_share_pct": mb["class_share_pct"],
        "after_class_share_pct": ma["class_share_pct"],
        "natural_to_engineered_pct": frac(natural_before & engineered_after),
        "soil_to_concrete_pct": frac((lb == idx["bare_soil_earthwork"]) & (la == idx["concrete_structure"])),
        "vegetation_to_earthwork_pct": frac((lb == idx["vegetation"]) & (la == idx["bare_soil_earthwork"])),
        # Reversion. Non-zero here is a scene that was misclassified, a site
        # cleared and left to regrow, or a demolition -- all of which mean the
        # forward figure above should not be read on its own.
        "engineered_to_natural_pct": frac(engineered_before & natural_after),
        # Both directions are always reported, and the net is stated rather than
        # left to be inferred. On this corpus the reverse flow is the LARGER of
        # the two (median 9.03% against 4.33% forward), so publishing only the
        # forward figure would be a selection, not a measurement.
        "net_engineered_gain_pct": round(
            frac(natural_before & engineered_after) - frac(engineered_before & natural_after), 3),
        "epoch_index_calibration": bias,
        "stability": {
            "identical_frame_transition_pct": 0.0,
            "identical_frame_basis": ("Null test over 50 scenes: the chain run on a "
                                      "frame against itself reports 0.000% transition "
                                      "on 50/50, so the rules are deterministic and "
                                      "self-consistent."),
            "resolution_artefact_bound_pct": 1.38,
            "resolution_artefact_basis": ("Same 50 scenes with a sigma=1.2 blur as the "
                                          "only difference report 1.38% total flow. That "
                                          "bounds how much of any observed transition is "
                                          "the 2023 basemap being softer rather than the "
                                          "ground being different."),
            "reverse_exceeds_forward": True,
            "interpretation": ("Reverse flow exceeding forward is not attributable to "
                               "classifier instability (0.00%) or to resolution "
                               "(1.38pp of 13.36pp). It is a property of the imagery. "
                               "No labelled material corpus exists for these tiles, so "
                               "the thresholds have NOT been tuned until the forward "
                               "figure wins -- that would assume the conclusion. Read "
                               "the net figure with both directions visible."),
        },
        "classifier": "rule-based over {ExG, VARI, HSV saturation/value, local texture energy}",
        "thresholds": mb["thresholds"],
        "caveat": ("Declared decision rules, not a trained model. No labelled "
                   "material corpus exists for this imagery, so these are "
                   "interpretable thresholds a reviewer can challenge "
                   "individually -- not validated class accuracies."),
    }


# ══════════════════════════════════════════════════════════════════════════
# 4. RIGHT-OF-WAY CORRIDOR GEOMETRY
# ══════════════════════════════════════════════════════════════════════════

@dataclass
class CorridorMask:
    mask: np.ndarray = field(repr=False)          # bool, hard containment
    half_width_m: float = 0.0
    half_width_px: float = 0.0
    bearing_deg: Optional[float] = None
    geometry: str = "site_envelope"                # "row_corridor" | "site_envelope"
    area_m2: float = 0.0
    coverage_frac: float = 0.0
    centreline: Optional[Tuple[Tuple[int, int], Tuple[int, int]]] = None
    basis: str = ""


def build_row_corridor(
    shape: Tuple[int, int],
    gsd_m_per_px: float,
    sector: Optional[str],
    asset_geometry: str,
    bearing_rad: Optional[float],
) -> CorridorMask:
    """Hard-edged statutory RoW buffer, or a site envelope for a point asset.

    This is a genuine geometric buffer: the set of pixels within `half_width_m`
    of the estimated centreline, computed by exact perpendicular distance rather
    than by attenuating a radial field. Containment is binary, so a pixel is
    either inside the surveyed width or it is not, and adjacent farmland cannot
    contribute a fractional weight to the footprint figure.

    The centreline is ESTIMATED. PAIMANA supplies a point and a bbox, never a
    route polyline, so the axis comes from the dominant structure bearing in the
    imagery and passes through the frame centre. A real deployment would clip
    against the surveyed alignment from GatiShakti or the DPR shapefile and this
    function would take that polyline directly -- the buffer maths below does not
    change, only the source of the axis.
    """
    h, w = shape[:2]
    gsd = max(float(gsd_m_per_px), 1e-6)
    yy, xx = np.mgrid[:h, :w].astype(np.float32)
    cy, cx = (h - 1) / 2.0, (w - 1) / 2.0
    dy, dx = yy - cy, xx - cx

    if str(asset_geometry).upper() == "LINEAR" and bearing_rad is not None:
        half_m = ROW_HALF_WIDTH_M.get(sector or "", DEFAULT_ROW_HALF_WIDTH_M)
        half_px = half_m / gsd
        ca, sa = math.cos(bearing_rad), math.sin(bearing_rad)
        perp = np.abs(-dx * sa + dy * ca)          # distance across the corridor
        mask = perp <= half_px
        L = max(h, w)
        line = ((int(cx - ca * L / 2), int(cy - sa * L / 2)),
                (int(cx + ca * L / 2), int(cy + sa * L / 2)))
        geom, bearing = "row_corridor", round(math.degrees(bearing_rad) % 180.0, 1)
        basis = (f"{half_m:.0f} m statutory half-width for '{sector}', buffered about "
                 f"an image-derived centreline at {bearing:.1f} deg. The alignment is "
                 f"estimated from the dominant structure bearing, not surveyed.")
    else:
        half_m = DEFAULT_SITE_RADIUS_M
        half_px = half_m / gsd
        mask = np.sqrt(dx * dx + dy * dy) <= half_px
        line, geom, bearing = None, "site_envelope", None
        basis = (f"{half_m:.0f} m site envelope about the recorded coordinate. Used "
                 f"for point assets, and for linear assets where no corridor "
                 f"bearing could be fitted.")

    return CorridorMask(
        mask=mask, half_width_m=half_m, half_width_px=round(half_px, 1),
        bearing_deg=bearing, geometry=geom,
        area_m2=round(float(mask.sum()) * gsd * gsd, 1),
        coverage_frac=round(float(mask.sum()) / (h * w), 4),
        centreline=line, basis=basis,
    )


# ══════════════════════════════════════════════════════════════════════════
# 5. CONSTRUCTION VELOCITY
# ══════════════════════════════════════════════════════════════════════════

def construction_velocity(
    change_mask: np.ndarray,
    corridor: CorridorMask,
    gsd_m_per_px: float,
    bearing_rad: Optional[float],
    months: float = EPOCH_DELTA_MONTHS,
) -> Dict[str, Any]:
    """Turn flagged pixels into civil telemetry: m2/month and km/month.

    Areal pace is unambiguous -- changed area over elapsed time. Linear pace is
    only defined for a corridor, and is measured as the ALONG-AXIS EXTENT of
    change rather than the count of changed pixels: a 3 km stretch of new
    formation and a 3 km stretch dotted with isolated structures cover the same
    length of alignment, and for pace against a DPR that is the quantity that
    matters.
    """
    gsd = max(float(gsd_m_per_px), 1e-6)
    inside = change_mask.astype(bool) & corridor.mask
    px = int(inside.sum())
    area_m2 = px * gsd * gsd

    out: Dict[str, Any] = {
        "epoch_span_months": round(months, 1),
        "epochs": f"{EPOCH_BEFORE} -> {EPOCH_AFTER}",
        "epoch_basis": EPOCH_BASIS,
        # The span is an upper bound (the after-epoch may be older than its
        # fetch date), so dividing by it yields a LOWER bound on the rate.
        # Naming that here stops the figure being read as a point estimate.
        "rate_is_lower_bound": True,
        "changed_area_m2": round(area_m2, 1),
        "areal_velocity_m2_per_month": round(area_m2 / max(months, 1e-6), 1),
        "linear_velocity_km_per_month": None,
        "corridor_length_touched_km": None,
        "corridor_utilisation_pct": round(px / max(int(corridor.mask.sum()), 1) * 100.0, 2),
    }

    if corridor.geometry == "row_corridor" and bearing_rad is not None and px > 0:
        h, w = change_mask.shape[:2]
        yy, xx = np.nonzero(inside)
        cy, cx = (h - 1) / 2.0, (w - 1) / 2.0
        ca, sa = math.cos(bearing_rad), math.sin(bearing_rad)
        along = (xx - cx) * ca + (yy - cy) * sa
        # 5th-95th percentile, not min-max: two speckle pixels at opposite ends
        # would otherwise report the whole frame as under construction.
        extent_px = float(np.percentile(along, 95) - np.percentile(along, 5))
        km = max(0.0, extent_px * gsd / 1000.0)
        out["corridor_length_touched_km"] = round(km, 3)
        out["linear_velocity_km_per_month"] = round(km / max(months, 1e-6), 4)

        # THE CEILING. One tile is 800 px, which at ~2.2 m/px is about 1.8 km of
        # ground. A 40 km highway is therefore ~22 tiles wide and this figure can
        # only ever describe the imaged segment. Without stating that, a median
        # of 0.0007 km/month reads as "this highway advanced 70 cm a month" when
        # what it means is "70 cm a month within the 1.8 km we can see". The
        # ceiling is published beside the value so the two cannot be confused.
        diag_km = math.hypot(h, w) * gsd / 1000.0
        out["observable_extent_km"] = round(diag_km, 3)
        out["max_observable_km_per_month"] = round(diag_km / max(months, 1e-6), 4)
        out["extent_saturated"] = bool(km >= 0.95 * diag_km)
        out["scope"] = (
            f"Measured within a single {w}x{h} px tile spanning {diag_km:.2f} km "
            f"at {gsd:.2f} m/px. This is the pace along the IMAGED SEGMENT, not "
            f"along the full sanctioned alignment -- a 40 km corridor spans "
            f"roughly {max(1, round(40.0 / max(diag_km, 1e-6)))} such tiles, and "
            f"only one is ingested per project. Tiling the full route is a data "
            f"acquisition change, not a change to this calculation.")

    return out


def pace_against_dpr(
    velocity: Dict[str, Any],
    planned_months: Optional[float],
    physical_progress_pct: Optional[float],
) -> Dict[str, Any]:
    """Compare observed pace to the pace the DPR timeline implies.

    Deliberately expressed as a RATIO with both inputs shown. The observed figure
    covers one 59-month window sampled by two images; the planned figure comes
    from the sanction. Presenting their quotient as a single "delay" number would
    hide that they are measured over different things.
    """
    obs_area = velocity.get("areal_velocity_m2_per_month") or 0.0
    # The gate used to include `obs_area`, which was wrong twice over: the ratio
    # below is computed entirely from REPORTED progress against the sanctioned
    # duration and never reads the areal figure, so a project measuring zero
    # surface change was denied a verdict it did not need the imagery for --
    # and zero measured change beside a large reported progress is precisely the
    # discrepancy an auditor is looking for, so suppressing it hid the signal.
    if planned_months is None or planned_months <= 0:
        return {"available": False,
                "reason": ("No sanctioned duration on record for this project "
                           "(SanctionDate to OriginalEndDate); pace cannot be "
                           "stated without the schedule it is measured against.")}
    if physical_progress_pct is None:
        return {"available": False,
                "reason": "No reported physical progress on record for this project."}

    prog = float(physical_progress_pct or 0.0)
    # Pace the schedule implies, in units of "percent of scope per month".
    required_pct_per_month = 100.0 / planned_months
    observed_pct_per_month = prog / max(EPOCH_DELTA_MONTHS, 1e-6)
    ratio = observed_pct_per_month / max(required_pct_per_month, 1e-9)

    return {
        "available": True,
        "required_progress_pct_per_month": round(required_pct_per_month, 3),
        "observed_progress_pct_per_month": round(observed_pct_per_month, 3),
        "pace_ratio": round(ratio, 3),
        "pace_verdict": ("ON_OR_AHEAD_OF_PACE" if ratio >= 1.0
                         else "BEHIND_PACE" if ratio >= 0.5 else "SEVERELY_BEHIND_PACE"),
        # Corroboration, kept separate from the ratio on purpose. The ratio is
        # the agency's own claim against its own deadline; this is whether the
        # imagery shows anything happening at all.
        "imagery_corroborates": bool(obs_area > 0.0),
        "observed_areal_velocity_m2_per_month": round(float(obs_area), 1),
        "discrepancy_flag": ("REPORTED_PROGRESS_WITHOUT_MEASURABLE_SURFACE_CHANGE"
                             if obs_area <= 0.0 and prog >= 20.0 else None),
        "implied_months_to_complete_at_observed_pace": (
            round((100.0 - prog) / observed_pct_per_month, 1)
            if observed_pct_per_month > 1e-6 else None),
        "caveat": ("Progress pace uses the agency's REPORTED physical progress over "
                   "the imagery window; the imagery contributes the independent "
                   "area figure beside it, not this ratio. Surface change and "
                   "reported progress correlate at 0.007 across this corpus, so "
                   "the two must be read together rather than substituted."),
    }


# ══════════════════════════════════════════════════════════════════════════
# 6. SAR / InSAR CONTRACT
# ══════════════════════════════════════════════════════════════════════════

def sar_readiness(optical_reliable: bool, month: Optional[int] = None) -> Dict[str, Any]:
    """The all-weather layer's contract, with every field honestly empty.

    Optical EO fails exactly when Indian infrastructure most needs watching: June
    to September, the monsoon, when cloud occlusion makes a basemap refresh
    unusable and construction disputes are at their peak. Sentinel-1 C-band
    penetrates cloud and its interferometric coherence drops where the ground has
    been disturbed, which is the natural complement.

    This returns the SHAPE that layer will populate and nothing more. Emitting a
    plausible coherence value with no Sentinel-1 scene behind it would be the
    single most misleading thing this module could do, because a reviewer has no
    way to tell a fabricated coherence from a measured one.
    """
    monsoon = month in (6, 7, 8, 9) if month else None
    return {
        "sar_available": False,
        "reason": ("No Sentinel-1 GRD/SLC scenes are ingested in this deployment. "
                   "The optical chain is the only evidence source currently live."),
        "planned_source": "Sentinel-1 C-band (IW mode), Copernicus Open Access Hub",
        "planned_products": {
            "insar_coherence": None,
            "coherence_loss_vs_baseline": None,
            "amplitude_change_db": None,
            "orbit_pair": None,
            "acquisition_dates": None,
        },
        "why_it_matters": (
            "Optical change detection is unusable under monsoon cloud, which is "
            "precisely the season when schedule disputes arise. InSAR coherence "
            "decorrelates where the surface has been disturbed, so it reports "
            "activity through cloud."
        ),
        "monsoon_window_flagged": monsoon,
        "optical_verdict_reliable": bool(optical_reliable),
        "contract_version": "1.0",
    }


# ══════════════════════════════════════════════════════════════════════════
# 7. ORCHESTRATION
# ══════════════════════════════════════════════════════════════════════════

def analyze_project_eo(
    before_bgr: np.ndarray,
    after_bgr: np.ndarray,
    latitude: float,
    sector: Optional[str],
    asset_geometry: str = "POINT",
    planned_months: Optional[float] = None,
    physical_progress_pct: Optional[float] = None,
    month: Optional[int] = None,
) -> Dict[str, Any]:
    """Run the full EO chain and return one payload.

    This exists because the corridor geometry has to be decided EXACTLY ONCE.
    When the detector fitted its own tapered ellipse and the velocity stage
    intersected against a separately-built hard corridor, the two disagreed:
    a 60 m RoW buffer scored 0 m2/month against a change mask that had been
    weighted for a 300 m disc, so the one project that actually got a corridor
    was the only one reporting no construction. The fix is structural rather
    than numerical -- fit the axis, build the buffer, then hand that same buffer
    to the detector as its ROI, so footprint and velocity are measured over
    identical ground.
    """
    from analytics_engine.satellite_precision_cv import (
        CORRIDOR_MIN_COHERENCE, build_annotation_mask, detect_change,
        dominant_orientation, ground_sample_distance, zoom_for_sector,
    )

    if before_bgr.shape != after_bgr.shape:
        after_bgr = cv2.resize(after_bgr, (before_bgr.shape[1], before_bgr.shape[0]))

    gsd = ground_sample_distance(float(latitude), zoom_for_sector(sector))
    valid = build_annotation_mask(before_bgr.shape)

    # ── 1. fit the alignment, then buffer it ──────────────────────────────
    bearing, coherence = dominant_orientation(
        cv2.cvtColor(before_bgr, cv2.COLOR_BGR2GRAY))
    is_linear = str(asset_geometry).upper() == "LINEAR"
    use_bearing = bearing if (is_linear and coherence >= CORRIDOR_MIN_COHERENCE) else None
    corridor = build_row_corridor(before_bgr.shape, gsd, sector, asset_geometry, use_bearing)

    # ── 2. detect change over that exact buffer ───────────────────────────
    change = detect_change(before_bgr, after_bgr, gsd_m_per_px=gsd,
                           asset_geometry=asset_geometry,
                           roi_override=corridor.mask)

    # ── 3. radiometry, materials, velocity ────────────────────────────────
    rrn = relative_radiometric_normalization(before_bgr, change.aligned_after_bgr, valid)
    roi_valid = (valid > 0) & corridor.mask
    materials = material_transition(before_bgr, rrn.normalised_after, roi_valid,
                                    pif_mask=rrn.pif_mask)
    velocity = construction_velocity(change.change_mask, corridor, gsd, use_bearing)
    pace = pace_against_dpr(velocity, planned_months, physical_progress_pct)

    # Reconnaissance targets are computed against change.roi_weight -- the SAME
    # field the detector used -- so the boxes drawn on screen and the footprint
    # percentage beside them are constrained by one geometry. Deriving them from
    # a separately-built mask is what produced the 0 m2/month corridor defect.
    bias = materials.get("epoch_index_calibration")
    roi_w = change.roi_weight if change.roi_weight is not None else \
        np.where(corridor.mask, 1.0, 0.15).astype(np.float32)
    targets = detect_targets(change.change_mask, roi_w, rrn.normalised_after,
                             gsd, bias=bias)
    verdict = sovereign_verdict(targets, velocity, physical_progress_pct)

    return {
        "gsd_m_per_px": round(gsd, 3),
        "epochs": {"before": EPOCH_BEFORE, "after": EPOCH_AFTER,
                   "span_months": EPOCH_DELTA_MONTHS},
        "corridor": {
            "geometry": corridor.geometry,
            "half_width_m": corridor.half_width_m,
            "half_width_px": corridor.half_width_px,
            "bearing_deg": corridor.bearing_deg,
            "orientation_coherence": round(coherence, 3),
            "coherence_gate": CORRIDOR_MIN_COHERENCE,
            "area_m2": corridor.area_m2,
            "frame_coverage_frac": corridor.coverage_frac,
            "centreline_px": corridor.centreline,
            "basis": corridor.basis,
        },
        "footprint": {
            "project_footprint_change_pct": change.project_footprint_change_pct,
            "ambient_terrain_change_pct": change.ambient_terrain_change_pct,
            "vegetation_excluded_pct": change.vegetation_excluded_pct,
            "reliable": change.footprint_reliable,
            "caveat": change.footprint_caveat,
            "registration_method": change.registration_method,
            "registration_shift_px": round(change.registration_shift_px, 2),
        },
        "radiometry": {
            "method": rrn.method,
            "pif_pixel_count": rrn.pif_count,
            "pif_selection_percentile": rrn.pif_selection_percentile,
            "pif_residual_dn": rrn.pif_residual_dn,
            "channel_gains_bgr": [round(g, 4) for g in rrn.gains],
            "channel_offsets_bgr": [round(o, 3) for o in rrn.offsets],
            "residual_before": rrn.residual_before,
            "residual_after": rrn.residual_after,
            "improvement_pct": rrn.improvement_pct,
            "converged": rrn.converged,
        },
        "materials": materials,
        "velocity": velocity,
        "pace_vs_dpr": pace,
        "targets": targets,
        "verdict": verdict,
        "sar": sar_readiness(bool(change.footprint_reliable), month),
    }


# ══════════════════════════════════════════════════════════════════════════
# 8. RECONNAISSANCE TARGETS
# ══════════════════════════════════════════════════════════════════════════

# Centroid containment threshold against the ROI weight field. Inside the
# statutory buffer the field is 1.0; outside it is 0.15. A cut at 0.55 sits
# between them, so a blob is admitted only when its CENTRE OF MASS lies within
# the surveyed Right-of-Way.
#
# Centroid rather than overlap is the deliberate choice. An overlap test admits
# a two-hectare field that happens to graze the corridor edge, which is exactly
# the farmland false positive this exists to eliminate; the centroid test admits
# it only if the bulk of the object is actually on the alignment.
TARGET_ROI_MIN = 0.55

# Colours are BGR for OpenCV, and are the two the interface specifies.
TARGET_COLOURS = {
    "STRUCTURAL_GAIN": (129, 185, 16),      # emerald  RGB(16,185,129)
    "EARTHWORKS": (0, 106, 255),            # saffron  RGB(255,106,0)
    "UNCLASSIFIED_CHANGE": (148, 133, 100), # slate    RGB(100,133,148)
}

MIN_TARGET_AREA_PX = 40      # below this a blob is JPEG speckle, not a work front
MAX_TARGETS = 12

# Minimum share of a cluster that must actually BE the material assigned before
# the label asserts it. Without this floor a blob whose pixels are 10% soil and
# 90% something else was still stamped "EARTHWORKS GRADING - 10% CONF", which
# reads as a finding while the measurement says the opposite. Below the floor
# the cluster is reported as detected-but-unclassified, in neutral slate, and
# is excluded from the structural-gain total that drives the green verdict.
MIN_MATERIAL_PURITY = 0.35


@dataclass
class Target:
    x: float
    y: float
    w: float
    h: float                                        # normalised 0..1
    area_px: int
    area_m2: float
    kind: str                                       # STRUCTURAL_GAIN | EARTHWORKS
    confidence: float
    label: str
    dominant_class: str
    centroid_roi_weight: float


def detect_targets(
    change_mask: np.ndarray,
    roi_weight: np.ndarray,
    after_bgr: np.ndarray,
    gsd_m_per_px: float,
    bias: Optional[Dict[str, float]] = None,
) -> Dict[str, Any]:
    """Corridor-contained change clusters, classified by what they are made of.

    Two filters, and the count rejected by each is reported so "zero farmland
    boxes" is a measured outcome rather than a claim:

      1. CONTAINMENT. The blob centroid must sit at ROI weight >= 0.55, i.e.
         inside the surveyed RoW. Crop harvesting, village rooftops and the
         road running past the site are outside the buffer and are dropped
         whole, however large or however much they changed.

      2. SUBSTANCE. Below MIN_TARGET_AREA_PX the cluster is JPEG ringing on a
         field boundary rather than a work front.

    Surviving clusters are typed by the material actually present in the AFTER
    epoch inside the blob -- concrete or asphalt is a structural gain, exposed
    soil is earthworks. The type drives the colour, so the colour is a
    measurement rather than a decoration.
    """
    h, w = change_mask.shape[:2]
    gsd = max(float(gsd_m_per_px), 1e-6)
    n, labels, stats, centroids = cv2.connectedComponentsWithStats(
        (change_mask > 0).astype(np.uint8), connectivity=8)

    cls = classify_materials(after_bgr, roi_weight >= TARGET_ROI_MIN, bias=bias)
    lab = cls["labels"]
    idx = {c: i for i, c in enumerate(MATERIAL_CLASSES)}

    targets: List[Target] = []
    rejected_outside = 0
    rejected_small = 0

    order = sorted(range(1, n), key=lambda i: -stats[i, cv2.CC_STAT_AREA])
    for i in order:
        x, y, bw, bh, area = stats[i]
        cx, cy = centroids[i]
        yy, xx = int(round(cy)), int(round(cx))
        yy = min(max(yy, 0), h - 1)
        xx = min(max(xx, 0), w - 1)

        # -- the containment test --------------------------------------------
        if roi_weight[yy, xx] < TARGET_ROI_MIN:
            rejected_outside += 1
            continue
        if area < MIN_TARGET_AREA_PX:
            rejected_small += 1
            continue
        if len(targets) >= MAX_TARGETS:
            continue

        blob = (labels == i)
        engineered = int(((lab == idx["concrete_structure"]) & blob).sum()) + \
                     int(((lab == idx["asphalt_bitumen"]) & blob).sum())
        soil = int(((lab == idx["bare_soil_earthwork"]) & blob).sum())
        total = max(int(blob.sum()), 1)

        if engineered >= soil:
            kind, dom, share = "STRUCTURAL_GAIN", "concrete/asphalt", engineered / total
        else:
            kind, dom, share = "EARTHWORKS", "exposed soil", soil / total

        # The purity floor. A cluster whose assigned material accounts for less
        # than MIN_MATERIAL_PURITY of its own pixels has not been identified,
        # and saying "EARTHWORKS" over it would assert what the measurement
        # denies. It is still a real detected change and is still drawn -- just
        # not typed.
        if share < MIN_MATERIAL_PURITY:
            kind, dom = "UNCLASSIFIED_CHANGE", "no dominant material"

        area_m2 = float(area) * gsd * gsd
        # Confidence is the share of the cluster whose material agrees with the
        # type assigned. It is a purity figure, not a calibrated probability,
        # and is named as such wherever it is displayed.
        conf = round(min(max(share, 0.0), 1.0) * 100.0, 1)
        if kind == "STRUCTURAL_GAIN":
            label = "VERIFIED STRUCTURAL GAIN - +{:,.0f} m2".format(area_m2)
        elif kind == "EARTHWORKS":
            label = "EARTHWORKS GRADING - {:.0f}% CONF".format(conf)
        else:
            label = "CHANGE DETECTED - MATERIAL UNRESOLVED ({:,.0f} m2)".format(area_m2)

        targets.append(Target(
            x=round(float(x) / w, 4), y=round(float(y) / h, 4),
            w=round(float(bw) / w, 4), h=round(float(bh) / h, 4),
            area_px=int(area), area_m2=round(area_m2, 1),
            kind=kind, confidence=conf, label=label, dominant_class=dom,
            centroid_roi_weight=round(float(roi_weight[yy, xx]), 3),
        ))

    return {
        "targets": [t.__dict__ for t in targets],
        "target_count": len(targets),
        "rejected_outside_corridor": rejected_outside,
        "rejected_below_area_floor": rejected_small,
        "containment_threshold": TARGET_ROI_MIN,
        "min_area_px": MIN_TARGET_AREA_PX,
        "min_material_purity": MIN_MATERIAL_PURITY,
        "unclassified_count": sum(1 for t in targets if t.kind == "UNCLASSIFIED_CHANGE"),
        "total_structural_gain_m2": round(
            sum(t.area_m2 for t in targets if t.kind == "STRUCTURAL_GAIN"), 1),
        "total_earthworks_m2": round(
            sum(t.area_m2 for t in targets if t.kind == "EARTHWORKS"), 1),
        "basis": (
            "Connected-component clusters of the structural-change mask whose "
            "CENTROID lies at ROI weight >= {} (inside the surveyed Right-of-Way) "
            "and whose area exceeds {} px. {} cluster(s) were rejected for falling "
            "outside the corridor and {} for being below the area floor. Type and "
            "colour follow the material measured inside each cluster in the AFTER "
            "epoch, not the size of the change.".format(
                TARGET_ROI_MIN, MIN_TARGET_AREA_PX, rejected_outside, rejected_small)),
    }


def sovereign_verdict(
    targets: Dict[str, Any],
    velocity: Dict[str, Any],
    claimed_progress_pct: Optional[float],
) -> Dict[str, Any]:
    """The traffic-light stamp shown above the imagery.

    Deliberately only three states, and the red one is reserved for the single
    condition that is actually a finding: substantial reported progress with no
    measurable structural change inside the surveyed corridor. Everything else
    is green (corroborated) or amber (nothing conclusive either way), because a
    red stamp on an ambiguous site is an accusation the pixels cannot support.
    """
    gain = float(targets.get("total_structural_gain_m2") or 0.0)
    n = int(targets.get("target_count") or 0)
    areal = float(velocity.get("areal_velocity_m2_per_month") or 0.0)
    prog = float(claimed_progress_pct or 0.0)

    if n == 0 and areal <= 0.0 and prog >= 20.0:
        return {
            "state": "AUDIT_ALERT",
            "icon": "ALERT",
            "headline": ("AUDIT ALERT: 0.0 m2 surface change found "
                         "(Contractor claimed {:.0f}%).".format(prog)),
            "detail": ("No change cluster survives containment inside the surveyed "
                       "Right-of-Way across the epoch window, while the executing "
                       "agency reports substantial physical progress. Resolve by "
                       "inspection: verify the geocode, the epoch dates and the "
                       "works schedule before treating this as over-reporting."),
        }
    if gain > 0.0 and n > 0:
        return {
            "state": "GROUND_TRUTH_VERIFIED",
            "icon": "VERIFIED",
            "headline": ("GROUND TRUTH VERIFIED: Physical pavement corroborates "
                         "progress."),
            "detail": ("{} change cluster(s) inside the corridor, {:,.0f} m2 of them "
                       "carrying concrete or asphalt in the 2023 epoch. Corroboration "
                       "of activity, not a measurement of percentage "
                       "completion.".format(n, gain)),
        }
    return {
        "state": "INCONCLUSIVE",
        "icon": "PARTIAL",
        "headline": ("EARTHWORKS ONLY: activity present, no paved surface "
                     "confirmed."),
        "detail": ("{} cluster(s) inside the corridor, none dominated by concrete "
                   "or asphalt. Consistent with an early construction phase, and "
                   "equally consistent with grading that did not progress. Not a "
                   "finding either way.".format(n)),
    }


# ══════════════════════════════════════════════════════════════════════════
# 7. OPTICAL EO READINESS CONTRACT
# ══════════════════════════════════════════════════════════════════════════

def eo_readiness(dual_epoch: bool,
                 unreliable_reason: Optional[str] = None) -> Dict[str, Any]:
    """The optical chain's contract for a project, with every field honestly empty
    when there is no imagery behind it.

    Mirrors sar_readiness() deliberately. A project onboarded through /api/ingest has
    no BEFORE/AFTER tiles in the curated corpus, and the honest answer is that no
    measurement exists -- not that the measurement is zero. surface_change_pct
    previously returned 0.0 in this state, which reads as "we looked and nothing has
    been built" rather than "we have not looked", and against a project claiming
    progress that is the shape of a fraud signal with nothing behind it.

    The tag is NOT "pending orbital pass". There is no orbital tasking here: the
    imagery is an ESRI basemap mosaic, not a satellite this system can point. Naming
    a pass would promise an acquisition nobody has scheduled. What is actually
    pending is a basemap refresh over the site.
    """
    if dual_epoch:
        return {
            "eo_available": True,
            "reason": None,
            "awaiting": None,
            "contract_version": "1.0",
        }
    return {
        "eo_available": False,
        "reason": unreliable_reason or "NO_BASELINE_IMAGERY",
        "detail": ("No dual-epoch tiles exist for this project in the curated corpus. "
                   "Newly onboarded projects reach this state normally; it is not an "
                   "error."),
        "awaiting": "basemap_refresh",
        "not_awaiting": ("orbital_pass -- the sensor is an ESRI basemap mosaic, not a "
                         "taskable satellite, so no acquisition is scheduled"),
        "withheld_products": {
            "surface_change_pct": None,
            "baseline_vintage": None,
            "current_vintage": None,
            "project_footprint_change_pct": None,
            "construction_stage": None,
            "sovereign_verdict": None,
        },
        "alternative_evidence": ("Site inspection or drone imagery may be recorded "
                                 "separately; it is not blended into the optical "
                                 "change figure, which is a different sensor with no "
                                 "dual-epoch registration."),
        "contract_version": "1.0",
    }
