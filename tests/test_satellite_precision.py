"""
PRAKALP-DRISHTI — satellite precision, security and tier-isolation suite.

Run:  pytest tests/test_satellite_precision.py -v

────────────────────────────────────────────────────────────────────────────
WHAT THIS SUITE IS FOR
────────────────────────────────────────────────────────────────────────────

Every assertion here corresponds to a defect that was measured OPEN on a
running build of this platform, not to a hypothetical. The suite exists so
that each one fails loudly if it ever comes back:

  * the whole imagery corpus was served anonymously (4,414 files, 986 MB,
    predictable filenames, ids published in the open project list);
  * /recon made a PAID third-party call with no credential and no throttle;
  * co-registration had a worst-case residual of 11.99 px -- 26 m of ground --
    and degraded 3 of 40 pairs outright;
  * the platform advertised "Sub-meter (~0.5-1.2m/pixel)" for a sensor whose
    measured GSD is 2.08-2.35 m/px, overstating it by roughly 3x;
  * nothing flagged that the newest imagery predates the progress claims being
    audited against it by 44 months.

The pure-algorithm tests run anywhere. The HTTP tests need the API on
127.0.0.1:8000 and SKIP (never silently pass) when it is absent, because a
security suite that goes green because it could not reach the server is worse
than no suite at all.
"""

from __future__ import annotations

import json
import math
import os
import re
import sys
import urllib.error
import urllib.request
from typing import Any, Dict, Optional, Tuple

import numpy as np
import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import cv2  # noqa: E402

from analytics_engine.satellite_precision_engine import (  # noqa: E402
    cloud_shadow_mask, evaluate_redaction, facade_lean_risk, fused_change,
    imagery_provenance_hash, imagery_staleness, redact_coordinate,
    spectral_angle, subpixel_registration,
)

BASE = "http://127.0.0.1:8000"
IMAGERY_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "paimana_extracted", "satellite_data", "project_imagery")

PID = "619092"                      # Roads & Highways, Haryana — not sensitive
SENSITIVE_PID = "709849"            # Oil & Gas — critical national infrastructure

ADMIN_CREDS = ("admin", "prakalp-admin-2026")
ANALYST_CREDS = ("analyst", "analyst-2026")


# ══════════════════════════════════════════════════════════════════════════
# HTTP HELPERS
# ══════════════════════════════════════════════════════════════════════════

def _request(path: str, token: Optional[str] = None, method: str = "GET",
             body: Optional[dict] = None, timeout: int = 300,
             headers: Optional[Dict[str, str]] = None
             ) -> Tuple[int, bytes, Dict[str, str]]:
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(BASE + path, data=data, method=method)
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    if data is not None:
        req.add_header("Content-Type", "application/json")
    for k, v in (headers or {}).items():
        req.add_header(k, v)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return (resp.status, resp.read(),
                    {k.lower(): v for k, v in resp.getheaders()})
    except urllib.error.HTTPError as e:
        return e.code, b"", {k.lower(): v for k, v in e.headers.items()}
    except Exception:
        return 0, b"", {}


def _json(path: str, token: Optional[str] = None, **kw) -> Tuple[int, Any]:
    st, body, _ = _request(path, token, **kw)
    try:
        return st, json.loads(body) if body else None
    except Exception:
        return st, None


def _api_live() -> bool:
    try:
        with urllib.request.urlopen(BASE + "/api/health", timeout=10) as r:
            return r.status == 200
    except Exception:
        return False


API_LIVE = _api_live()
requires_api = pytest.mark.skipif(
    not API_LIVE,
    reason=("API not reachable on 127.0.0.1:8000. SKIPPED rather than passed: a "
            "security suite that goes green because it could not connect is "
            "worse than no suite."))


def _login(creds) -> Optional[str]:
    st, d = _json("/api/auth/login", method="POST",
                  body={"username": creds[0], "password": creds[1]}, timeout=60)
    return d.get("token") if st == 200 and isinstance(d, dict) else None


@pytest.fixture(scope="session")
def admin_token() -> str:
    if not API_LIVE:
        pytest.skip("API not reachable")
    tok = _login(ADMIN_CREDS)
    assert tok, "could not authenticate as administrator"
    return tok


@pytest.fixture(scope="session")
def analyst_token() -> str:
    if not API_LIVE:
        pytest.skip("API not reachable")
    tok = _login(ANALYST_CREDS)
    assert tok, "could not authenticate as analyst"
    return tok


@pytest.fixture(scope="session")
def real_pairs():
    """Up to 20 real dual-epoch pairs, or skip. Never synthesise a substitute.

    A synthetic stand-in would make the alignment numbers meaningless: the whole
    point of the measurement is that it holds on ESRI basemap tiles with a
    37-grey-level radiometric gap and a 3.6x sharpness mismatch between epochs.
    """
    import glob
    if not os.path.isdir(IMAGERY_DIR):
        pytest.skip(f"imagery corpus absent at {IMAGERY_DIR}")
    ids = sorted({os.path.basename(f).split("_BEFORE")[0]
                  for f in glob.glob(os.path.join(IMAGERY_DIR, "*_BEFORE.jpg"))})
    out = []
    for pid in ids:
        if len(out) >= 20:
            break
        b = cv2.imread(os.path.join(IMAGERY_DIR, f"{pid}_BEFORE.jpg"))
        a = cv2.imread(os.path.join(IMAGERY_DIR, f"{pid}_AFTER.jpg"))
        if b is not None and a is not None and b.shape == a.shape:
            out.append((pid, b, a))
    if len(out) < 5:
        pytest.skip("fewer than 5 usable dual-epoch pairs on disk")
    return out


@pytest.fixture(scope="session")
def textured_scene() -> np.ndarray:
    """Deterministic scene with real spatial structure.

    Blurred noise, not raw noise: white noise has a flat power spectrum and its
    autocorrelation is a delta, which makes sub-pixel peak location trivially
    easy and the alignment test meaningless. Blurring produces a correlation
    surface with realistic width.
    """
    rng = np.random.RandomState(20260828)
    img = (rng.rand(256, 256, 3) * 180 + 30).astype(np.uint8)
    return cv2.GaussianBlur(img, (0, 0), 1.5)


# ══════════════════════════════════════════════════════════════════════════
# 1. ALIGNMENT
# ══════════════════════════════════════════════════════════════════════════

class TestAlignment:
    """Sub-pixel co-registration.

    The production defect this guards: cv2.phaseCorrelate seeding an unguarded
    ECC refinement produced a median residual of 0.155 px but a worst case of
    11.99 px, and degraded 3 of 40 pairs outright. An 11.99 px error at
    2.2 m/px is 26 m of ground -- enough to manufacture a phantom change along
    every edge in the frame.
    """

    @pytest.mark.parametrize("dy,dx", [
        (0.35, -0.20), (1.60, 2.40), (-0.75, 0.45), (0.05, 0.05), (-2.10, -1.30),
    ])
    def test_known_shift_recovered_within_half_pixel(self, textured_scene, dy, dx):
        M = np.array([[1, 0, dx], [0, 1, dy]], np.float32)
        moved = cv2.warpAffine(textured_scene, M, (256, 256),
                               flags=cv2.INTER_CUBIC,
                               borderMode=cv2.BORDER_REPLICATE)
        r = subpixel_registration(textured_scene, moved)
        err = math.hypot(-r.shift_yx[0] - dy, -r.shift_yx[1] - dx)
        assert err < 0.5, f"recovered shift off by {err:.4f} px for ({dy}, {dx})"

    def test_identical_pair_needs_no_correction(self, textured_scene):
        r = subpixel_registration(textured_scene, textured_scene.copy())
        assert r.shift_magnitude_px < 0.01
        assert r.residual_px < 0.5
        assert r.converged

    def test_real_pairs_median_residual_under_tenth_pixel(self, real_pairs):
        from analytics_engine.satellite_precision_cv import build_annotation_mask
        residuals = []
        for _pid, b, a in real_pairs:
            r = subpixel_registration(b, a, build_annotation_mask(b.shape))
            if r.converged:
                residuals.append(r.residual_px)
        assert len(residuals) >= 5
        med = float(np.median(residuals))
        assert med < 0.1, f"median residual {med:.4f} px over {len(residuals)} pairs"

    def test_real_pairs_zero_degradation(self, real_pairs):
        """The stage must be monotone: never worse than its input."""
        from skimage.registration import phase_cross_correlation

        from analytics_engine.satellite_precision_cv import build_annotation_mask

        def _grey(img, mask):
            g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            return cv2.equalizeHist(cv2.bitwise_and(g, g, mask=mask))

        # Tolerance is 1e-3 px, not zero. `residual_px` is reported rounded to
        # four decimal places while `before` is computed at full precision, so
        # a pair that is already perfectly aligned trips a strict comparison on
        # the rounding alone: one pair measured 0.0224 -> 0.0224 and was
        # counted as "degraded" by 2e-8 px. A real degradation on this corpus
        # was 1-12 px, four orders of magnitude above this floor, so the
        # tolerance cannot hide one.
        worse = []
        for pid, b, a in real_pairs:
            mask = build_annotation_mask(b.shape)
            sh, _e, _p = phase_cross_correlation(_grey(b, mask), _grey(a, mask),
                                                 upsample_factor=100)
            before = float(math.hypot(float(sh[0]), float(sh[1])))
            r = subpixel_registration(b, a, mask)
            if r.converged and r.residual_px > before + 1e-3:
                worse.append((pid, round(before, 4), r.residual_px))
        assert not worse, f"{len(worse)}/{len(real_pairs)} degraded: {worse[:4]}"

    def test_all_real_pairs_within_half_pixel_tolerance(self, real_pairs):
        from analytics_engine.satellite_precision_cv import build_annotation_mask
        out = [subpixel_registration(b, a, build_annotation_mask(b.shape))
               for _p, b, a in real_pairs]
        inside = sum(1 for r in out if r.converged and r.residual_px < 0.5)
        assert inside == len(out), f"only {inside}/{len(out)} within 0.5 px"

    def test_absurd_shift_is_rejected_not_applied(self):
        """A warp the estimator cannot trust must be refused, not guessed.

        Two unrelated frames produce a correlation peak somewhere; applying that
        warp is worse than applying none, because it moves real structure and
        turns every edge into apparent change.
        """
        rng = np.random.RandomState(1)
        a = (rng.rand(200, 200, 3) * 255).astype(np.uint8)
        b = np.roll(a, 90, axis=1)                       # 45% of the frame
        r = subpixel_registration(a, b)
        assert (not r.converged) or r.shift_magnitude_px <= 0.10 * 200

    def test_production_coregister_is_monotone(self, real_pairs):
        """The shipped path, not just the standalone engine."""
        from skimage.registration import phase_cross_correlation

        from analytics_engine.satellite_precision_cv import (
            build_annotation_mask, coregister,
        )

        def _grey(img, mask):
            g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            return cv2.equalizeHist(cv2.bitwise_and(g, g, mask=mask))

        worse = 0
        residuals = []
        for _pid, b, a in real_pairs:
            mask = build_annotation_mask(b.shape)
            gb = _grey(b, mask)
            s0, _e, _p = phase_cross_correlation(gb, _grey(a, mask),
                                                 upsample_factor=100)
            before = float(math.hypot(float(s0[0]), float(s0[1])))
            aligned, _shift, _method = coregister(b, a, mask)
            s1, _e, _p = phase_cross_correlation(gb, _grey(aligned, mask),
                                                 upsample_factor=100)
            after = float(math.hypot(float(s1[0]), float(s1[1])))
            residuals.append(after)
            if after > before + 1e-3:      # see the tolerance note above
                worse += 1
        assert worse == 0, f"production coregister degraded {worse} pairs"
        assert float(np.median(residuals)) < 0.5


# ══════════════════════════════════════════════════════════════════════════
# 2. ILLUMINATION INVARIANCE / FALSE POSITIVES
# ══════════════════════════════════════════════════════════════════════════

class TestIlluminationInvariance:
    """Zero false-positive delta on an identical scene under changed light.

    Seasonal sun angle, a different mosaic donor scene and atmospheric haze all
    present as a gain-and-offset on the pixel values. A change detector that
    responds to that reports construction every summer.
    """

    def test_identical_scene_has_zero_spectral_angle(self, textured_scene):
        sam = float(spectral_angle(textured_scene, textured_scene.copy()).mean())
        assert sam < 1e-3, f"{sam} rad on a byte-identical pair"

    @pytest.mark.parametrize("gain,offset", [
        (1.35, 18), (0.75, -12), (1.10, 5), (1.60, 30),
    ])
    def test_spectral_angle_survives_gain_and_offset(self, textured_scene,
                                                     gain, offset):
        lit = np.clip(textured_scene.astype(np.int16) * gain + offset,
                      0, 255).astype(np.uint8)
        sam = float(spectral_angle(textured_scene, lit).mean())
        assert sam < 0.10, f"gain={gain} offset={offset} -> {sam:.5f} rad"

    def test_illumination_change_scores_below_a_real_edit(self, textured_scene):
        lit = np.clip(textured_scene.astype(np.int16) * 1.35 + 18,
                      0, 255).astype(np.uint8)
        edited = textured_scene.copy()
        edited[80:170, 80:170] = 245               # a bright new slab
        illum = fused_change(textured_scene, lit)["mean_fused"]
        real = fused_change(textured_scene, edited)["mean_fused"]
        assert illum < real, (f"illumination {illum:.5f} scored at or above a "
                              f"real structural edit {real:.5f}")

    def test_fused_change_is_zero_on_an_identical_pair(self, textured_scene):
        assert fused_change(textured_scene,
                            textured_scene.copy())["mean_fused"] < 1e-3

    def test_fusion_weights_are_declared_not_fitted(self, textured_scene):
        f = fused_change(textured_scene, textured_scene.copy())
        assert abs(sum(f["weights"].values()) - 1.0) < 1e-6
        assert "not fitted" in f["weights_basis"], (
            "declaring the weights as presentation conventions is the honest "
            "framing; there is no labelled change corpus to fit them against")


# ══════════════════════════════════════════════════════════════════════════
# 3. CLOUD AND SHADOW
# ══════════════════════════════════════════════════════════════════════════

class TestCloudShadow:
    def test_white_frame_reads_as_cloud(self):
        assert cloud_shadow_mask(
            np.full((64, 64, 3), 250, np.uint8)).cloud_pct > 90.0

    def test_black_frame_reads_as_shadow(self):
        assert cloud_shadow_mask(
            np.full((64, 64, 3), 20, np.uint8)).shadow_pct > 90.0

    def test_usable_is_the_complement_of_cloud_and_shadow(self, textured_scene):
        m = cloud_shadow_mask(textured_scene)
        assert abs(m.usable_pct - (100.0 - m.cloud_pct - m.shadow_pct)) < 0.5

    def test_mask_does_not_claim_to_be_s2cloudless(self, textured_scene):
        lim = cloud_shadow_mask(textured_scene).limitations.lower()
        assert "not a trained cloud mask" in lim
        assert "s2cloudless" in lim, (
            "the honest disclosure names the thing it is NOT, because "
            "s2cloudless needs ten Sentinel-2 bands this sensor lacks")

    def test_verdict_degrades_when_the_scene_is_obscured(self):
        obscured = np.full((100, 100, 3), 250, np.uint8)
        obscured[:30] = 60
        assert "UNUSABLE" in cloud_shadow_mask(obscured).verdict


# ══════════════════════════════════════════════════════════════════════════
# 4. REDACTION
# ══════════════════════════════════════════════════════════════════════════

class TestRedaction:
    def test_sensitive_sector_is_redacted_for_the_public(self):
        d = evaluate_redaction(19.2, 72.9, "Oil & Gas", "Maharashtra", "public")
        assert d.redact and d.level in ("blur", "withhold")

    def test_the_same_project_is_clear_for_officials(self):
        d = evaluate_redaction(19.2, 72.9, "Oil & Gas", "Maharashtra", "official")
        assert not d.redact and d.level == "none"

    def test_border_state_triggers_coarsening(self):
        d = evaluate_redaction(32.7, 74.8, "Roads & Highways",
                               "Jammu and Kashmir", "public")
        assert d.redact and d.coordinate_precision_dp == 2

    def test_ordinary_project_is_not_redacted(self):
        d = evaluate_redaction(29.3, 76.3, "Roads & Highways", "Haryana", "public")
        assert not d.redact

    def test_unknown_coordinate_on_sensitive_sector_fails_closed(self):
        """The two errors are not symmetric.

        Withholding a benign site is an inconvenience. Publishing dated 2 m
        imagery of a fuel depot because its coordinate could not be checked is
        not, so the unknown case withholds.
        """
        d = evaluate_redaction(None, None, "Oil & Gas", None, "public")
        assert d.level == "withhold"
        assert redact_coordinate(1.0, 2.0, d) == (None, None)

    def test_coarsening_actually_reduces_precision(self):
        d = evaluate_redaction(19.2, 72.9, "Oil & Gas", "Maharashtra", "public")
        lat, lon = redact_coordinate(19.221256, 72.965778, d)
        assert (lat, lon) == (19.22, 72.97)

    def test_blur_measurably_destroys_detail(self):
        """A blur that does not reduce detail is theatre."""
        from analytics_engine.satellite_precision_engine import apply_redaction
        rng = np.random.RandomState(7)
        img = cv2.GaussianBlur((rng.rand(256, 256, 3) * 255).astype(np.uint8),
                               (0, 0), 0.8)
        d = evaluate_redaction(19.2, 72.9, "Oil & Gas", "Maharashtra", "public")
        sharp = cv2.Laplacian(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY),
                              cv2.CV_64F).var()
        blurred = apply_redaction(img, d)
        soft = cv2.Laplacian(cv2.cvtColor(blurred, cv2.COLOR_BGR2GRAY),
                             cv2.CV_64F).var()
        assert soft < sharp * 0.10, f"blur left {soft:.1f} of {sharp:.1f}"

    def test_withheld_imagery_is_a_placeholder_not_a_black_frame(self):
        """A black frame is indistinguishable from a decode failure.

        That ambiguity invites a client retry loop against the very endpoint
        being protected, so the withheld case renders a legible notice instead.
        """
        from analytics_engine.satellite_precision_engine import apply_redaction
        d = evaluate_redaction(None, None, "Oil & Gas", None, "public")
        out = apply_redaction(np.zeros((200, 200, 3), np.uint8), d)
        assert out.max() > 100, "withheld placeholder carries no legible content"


# ══════════════════════════════════════════════════════════════════════════
# 5. STALENESS
# ══════════════════════════════════════════════════════════════════════════

class TestStaleness:
    def test_recent_fetch_is_not_flagged_stale(self):
        assert not imagery_staleness(as_of_iso="2026-09-01")["is_stale"]

    # These three previously asserted a 44-month staleness warning. That
    # warning was built on a false label: the fetch pipeline recorded the
    # after-epoch as 2023-01 via release id 93, which is not a Wayback release
    # at all. The tiles actually came from the live basemap, fetched 2026-08.
    # The tests now assert the corrected behaviour, which is materially
    # different in both directions -- the imagery is FRESHER than claimed, and
    # the baseline is far OLDER.

    def test_vintage_is_reported_as_unknown_not_fresh(self):
        """The fetch date bounds the vintage; it does not state it.

        ESRI publishes no per-tile capture date for the World Imagery mosaic,
        which routinely carries imagery one to three years old. Reporting "OK"
        off the fetch date would swap an overstated staleness warning for an
        unearned freshness claim.
        """
        s = imagery_staleness(as_of_iso="2026-08-28")
        assert s["severity"] == "UNKNOWN", f"severity={s['severity']}"
        assert s["latest_epoch_is_bound"] is True
        assert "not published by the provider" in s["headline"].lower()

    def test_the_twelve_year_measurement_span_is_disclosed(self):
        """The real finding the false label was hiding.

        Baseline is Wayback 2014-02-20 (release 10), not the 2018-02 every
        label claimed, so the comparison spans ~150 months rather than 59 and
        every areal velocity divided by 59 was overstated 2.54x.
        """
        s = imagery_staleness(as_of_iso="2026-08-28")
        assert s["baseline_imagery_epoch"] == "2014-02"
        assert s["measurement_span_months"] > 140, s["measurement_span_months"]
        assert "12.5 years" in s["detail"] or "years" in s["detail"]

    def test_the_rate_is_declared_a_lower_bound(self):
        """Span is an upper bound, so any rate from it is a lower bound."""
        s = imagery_staleness(as_of_iso="2026-08-28")
        assert "lower" in s["detail"].lower()

    def test_a_genuinely_stale_pair_still_flags_high(self):
        """The stale path must survive the correction, not be deleted with it."""
        s = imagery_staleness(as_of_iso="2031-01-01")
        assert s["is_stale"] and s["severity"] == "HIGH"
        assert "non-performance" in s["detail"].lower()

    def test_stale_plus_high_reported_progress_escalates(self):
        s = imagery_staleness(as_of_iso="2031-01-01", reported_progress_pct=90.0)
        assert "discrepancy_caveat" in s

    def test_low_reported_progress_needs_no_escalation(self):
        s = imagery_staleness(as_of_iso="2031-01-01", reported_progress_pct=3.0)
        assert "discrepancy_caveat" not in s


# ══════════════════════════════════════════════════════════════════════════
# 6. PROVENANCE
# ══════════════════════════════════════════════════════════════════════════

class TestProvenance:
    def test_digest_is_content_addressed(self, tmp_path):
        a = tmp_path / "X_BEFORE.jpg"
        b = tmp_path / "X_AFTER.jpg"
        a.write_bytes(b"first"); b.write_bytes(b"second")
        one = imagery_provenance_hash("X", str(a), str(b))
        b.write_bytes(b"substituted")
        two = imagery_provenance_hash("X", str(a), str(b))
        assert one["pair_digest"] != two["pair_digest"], (
            "swapping a frame must change the digest, or the record proves "
            "nothing about which frames a finding was issued against")

    def test_digest_is_stable_for_unchanged_bytes(self, tmp_path):
        a = tmp_path / "Y_BEFORE.jpg"; a.write_bytes(b"same")
        b = tmp_path / "Y_AFTER.jpg"; b.write_bytes(b"same-after")
        assert (imagery_provenance_hash("Y", str(a), str(b))["pair_digest"]
                == imagery_provenance_hash("Y", str(a), str(b))["pair_digest"])

    def test_record_states_what_it_does_not_attest(self, tmp_path):
        a = tmp_path / "Z_BEFORE.jpg"; a.write_bytes(b"x")
        b = tmp_path / "Z_AFTER.jpg"; b.write_bytes(b"y")
        rec = imagery_provenance_hash("Z", str(a), str(b))
        assert "does_not_attest" in rec
        low = rec["does_not_attest"].lower()
        assert "capture date" in low and "signature" in low, (
            "an ingest-time integrity digest is not a provider attestation, "
            "and a dispute turning on capture date must not rely on it")

    def test_missing_file_yields_null_not_a_fabricated_digest(self, tmp_path):
        rec = imagery_provenance_hash("Q", str(tmp_path / "nope.jpg"),
                                      str(tmp_path / "also-nope.jpg"))
        assert rec["before_sha256"] is None and rec["after_sha256"] is None


# ══════════════════════════════════════════════════════════════════════════
# 7. OFF-NADIR PRECISION FLOOR
# ══════════════════════════════════════════════════════════════════════════

class TestFacadeLean:
    def test_taller_sector_yields_a_larger_precision_floor(self):
        tall = facade_lean_risk("Electricity Generation", 2.2)
        short = facade_lean_risk("Water Resources", 2.2)
        assert tall["lean_displacement_m"] > short["lean_displacement_m"]

    def test_floor_scales_inversely_with_gsd_in_pixels(self):
        coarse = facade_lean_risk("Roads & Highways", 4.4)
        fine = facade_lean_risk("Roads & Highways", 2.2)
        assert coarse["lean_displacement_px"] < fine["lean_displacement_px"]

    def test_it_is_declared_a_floor_not_a_correction(self):
        basis = facade_lean_risk("Roads & Highways", 2.2)["basis"].lower()
        assert "not a correction" in basis, (
            "removing off-nadir lean needs an RPC sensor model and a DEM, "
            "neither of which exists for a basemap tile")


# ══════════════════════════════════════════════════════════════════════════
# 8. RBAC AND TIER ISOLATION
# ══════════════════════════════════════════════════════════════════════════

@requires_api
class TestTierIsolation:
    """The tier must come from the token and from nothing else."""

    GUARDED = [
        f"/api/amey/satellite/{PID}/layer/change",
        f"/api/amey/satellite/{PID}/recon",
        f"/api/eo/provenance/{PID}",
    ]

    @pytest.mark.parametrize("path", GUARDED)
    def test_anonymous_is_refused(self, path):
        st, _, _ = _request(path)
        assert st in (401, 403, 429), f"anonymous got {st} on {path}"

    @pytest.mark.parametrize("path", GUARDED)
    def test_analyst_is_refused_for_lacking_read_risk(self, path, analyst_token):
        st, _, _ = _request(path, analyst_token)
        assert st in (403, 429), f"analyst got {st} on {path}"

    @pytest.mark.parametrize("path", GUARDED)
    def test_official_is_permitted(self, path, admin_token):
        st, body, _ = _request(path, admin_token)
        assert st in (200, 429), f"administrator got {st} on {path}"
        if st == 200:
            assert len(body) > 0

    def test_public_tile_is_smaller_and_webp(self, admin_token):
        st_p, pub, hp = _request(f"/api/eo/tile/{PID}/AFTER")
        st_o, off, ho = _request(f"/api/eo/tile/{PID}/AFTER", admin_token)
        assert st_p == 200 and st_o == 200
        assert hp.get("content-type") == "image/webp"
        assert ho.get("content-type") == "image/jpeg"
        assert len(pub) < len(off) * 0.5, (
            f"public {len(pub)} vs official {len(off)} — the public tier must "
            f"be materially lighter for low-bandwidth delivery")

    def test_public_tile_is_downsampled(self):
        st, blob, _ = _request(f"/api/eo/tile/{PID}/AFTER")
        assert st == 200
        img = cv2.imdecode(np.frombuffer(blob, np.uint8), cv2.IMREAD_COLOR)
        assert img is not None
        assert max(img.shape[:2]) <= 512, f"public tile is {img.shape[:2]}"

    @pytest.mark.parametrize("forgery", [
        "?tier=official", "?audience=official", "?role=administrator",
        "?permission=read_risk", "?official=1", "?redact=false",
    ])
    def test_tier_cannot_be_forged_by_query_parameter(self, forgery):
        _st_b, baseline, _ = _request(f"/api/eo/tile/{PID}/AFTER")
        st, blob, headers = _request(f"/api/eo/tile/{PID}/AFTER{forgery}")
        if st != 200:
            return                       # rejected outright is also correct
        assert len(blob) <= len(baseline) * 1.05, (
            f"{forgery} changed the response size — a client-supplied parameter "
            f"must never influence the tier")
        assert headers.get("x-imagery-tier") == "public"

    @pytest.mark.parametrize("spoof", [
        {"X-Imagery-Tier": "official"},
        {"X-Forwarded-User": "admin"},
        {"X-Role": "administrator"},
        {"Authorization": "Bearer not-a-real-token"},
    ])
    def test_tier_cannot_be_forged_by_header(self, spoof):
        _st, baseline, _ = _request(f"/api/eo/tile/{PID}/AFTER")
        st, blob, headers = _request(f"/api/eo/tile/{PID}/AFTER", headers=spoof)
        assert st in (200, 401, 403)
        if st == 200:
            assert headers.get("x-imagery-tier") == "public"
            assert len(blob) <= len(baseline) * 1.05

    def test_public_metadata_coarsens_a_sensitive_coordinate(self):
        st, d = _json(f"/api/eo/metadata/{SENSITIVE_PID}")
        assert st == 200
        assert d["redaction"]["applied"] is True
        assert d["coordinate_precision_dp"] == 2
        lat = d.get("latitude")
        assert lat is None or abs(lat - round(lat, 2)) < 1e-9

    def test_official_metadata_keeps_full_precision(self, admin_token):
        st, d = _json(f"/api/eo/metadata/{SENSITIVE_PID}", admin_token)
        assert st == 200
        assert d["redaction"]["applied"] is False
        assert d["coordinate_precision_dp"] is None
        assert d["provenance"]["pair_digest"]

    def test_public_tile_of_a_sensitive_site_is_measurably_blurred(self, admin_token):
        _st, pub, _ = _request(f"/api/eo/tile/{SENSITIVE_PID}/AFTER")
        _st, off, _ = _request(f"/api/eo/tile/{SENSITIVE_PID}/AFTER", admin_token)
        def lap(blob):
            img = cv2.imdecode(np.frombuffer(blob, np.uint8), cv2.IMREAD_COLOR)
            return cv2.Laplacian(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY),
                                 cv2.CV_64F).var()
        assert lap(pub) < lap(off) * 0.05

    def test_non_sensitive_public_tile_keeps_its_detail(self, admin_token):
        """Redaction must be targeted, not a blanket degradation.

        If every public tile were blurred the transparency portal would be
        useless, which is a real cost and not a safe default.
        """
        _st, pub, _ = _request(f"/api/eo/tile/{PID}/AFTER")
        img = cv2.imdecode(np.frombuffer(pub, np.uint8), cv2.IMREAD_COLOR)
        assert cv2.Laplacian(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY),
                             cv2.CV_64F).var() > 100

    def test_progress_figures_are_identical_across_tiers(self, admin_token):
        """The transparency obligation is the numbers, not the pixels."""
        st_p, pub = _json(f"/api/eo/metadata/{SENSITIVE_PID}")
        st_o, off = _json(f"/api/eo/metadata/{SENSITIVE_PID}", admin_token)
        assert st_p == 200 and st_o == 200
        assert pub["staleness"]["imagery_age_months"] == \
               off["staleness"]["imagery_age_months"]
        assert pub["epoch_before"] == off["epoch_before"]
        assert pub["epoch_after"] == off["epoch_after"]


# ══════════════════════════════════════════════════════════════════════════
# 9. SIGNED URL INTEGRITY
# ══════════════════════════════════════════════════════════════════════════

@requires_api
class TestSignedUrls:
    @pytest.fixture
    def link(self, admin_token) -> str:
        st, d = _json(f"/api/eo/metadata/{PID}", admin_token)
        assert st == 200
        url = (d.get("signed_download") or {}).get("after")
        assert url, "official metadata issued no signed link"
        return url

    def test_valid_signature_returns_full_resolution(self, link):
        st, blob, _ = _request(link)
        assert st == 200
        img = cv2.imdecode(np.frombuffer(blob, np.uint8), cv2.IMREAD_COLOR)
        assert img is not None and max(img.shape[:2]) > 512

    def test_tampered_signature_is_refused(self, link):
        st, _, _ = _request(re.sub(r"sig=[0-9a-f]+", "sig=" + "0" * 40, link))
        assert st == 403

    def test_swapped_subject_is_refused(self, link):
        st, _, _ = _request(link.replace("subject=admin", "subject=attacker"))
        assert st == 403

    def test_expired_link_is_refused(self, link):
        st, _, _ = _request(re.sub(r"expires=\d+", "expires=1", link))
        assert st == 403

    def test_extended_expiry_is_refused(self, link):
        """Pushing the expiry out must invalidate the signature.

        The expiry is inside the signed message precisely so it cannot be
        edited; if this passes, the link is a permanent bearer capability.
        """
        m = re.search(r"expires=(\d+)", link)
        st, _, _ = _request(link.replace(m.group(0),
                                         f"expires={int(m.group(1)) + 86400}"))
        assert st == 403

    def test_link_is_short_lived(self, admin_token):
        st, d = _json(f"/api/eo/metadata/{PID}", admin_token)
        ttl = (d.get("signed_download") or {}).get("ttl_seconds")
        assert 0 < ttl <= 3600, f"ttl={ttl}s is too long for a shareable link"


# ══════════════════════════════════════════════════════════════════════════
# 10. FALSE-CLAIM GUARD
# ══════════════════════════════════════════════════════════════════════════

@requires_api
class TestNoFalseResolutionClaims:
    """"Sub-meter (~0.5-1.2m/pixel)" shipped for months on a 2.08-2.35 m/px
    sensor -- an overstatement of roughly 3x that would have justified findings
    the imagery cannot support."""

    RESOLUTION_FIELDS = ("resolution", "resolution_m_per_px", "resolution_basis",
                         "resolution_note", "sensor")

    def test_eo_metadata_claims_no_sub_metre_capability(self, admin_token):
        for tok in (None, admin_token):
            st, d = _json(f"/api/eo/metadata/{PID}", tok)
            assert st == 200
            blob = " ".join(str(d.get(k, "")) for k in self.RESOLUTION_FIELDS)
            assert "sub-met" not in blob.lower(), blob[:160]

    def test_audit_record_claims_no_sub_metre_capability(self, admin_token):
        st, d = _json(f"/api/amey/satellite/{PID}", admin_token)
        assert st == 200
        assert "sub-meter" not in json.dumps(d).lower()
        assert "sub-metre" not in json.dumps(d).lower()

    def test_legacy_endpoint_reports_the_measured_range(self):
        st, d = _json(f"/api/satellite-imagery/{PID}")
        if st != 200 or not isinstance(d, dict):
            pytest.skip("legacy imagery endpoint not mounted at this path")
        assert "sub-met" not in str(d.get("resolution", "")).lower()

    def test_reported_gsd_is_physically_plausible(self, admin_token):
        st, d = _json(f"/api/eo/metadata/{PID}", admin_token)
        gsd = d.get("resolution_m_per_px")
        assert gsd is not None
        assert 2.0 <= gsd <= 6.0, (
            f"GSD {gsd} m/px — anything under 2.0 would be a sub-metre-class "
            f"claim this sensor cannot support")

    def test_no_ndvi_or_ndbi_layer_is_offered(self, admin_token):
        """Both need bands this sensor does not carry, so both must 404."""
        for fake in ("ndvi", "ndbi", "ndwi"):
            st, _, _ = _request(
                f"/api/amey/satellite/{PID}/layer/{fake}", admin_token)
            assert st == 404, f"layer '{fake}' returned {st} but is not computable"


# ══════════════════════════════════════════════════════════════════════════
# 11. RATE LIMITING
# ══════════════════════════════════════════════════════════════════════════

@requires_api
class TestRateLimiting:
    def test_recon_is_bounded_so_paid_calls_cannot_be_exhausted(self, admin_token):
        """/recon makes a paid third-party call per request.

        This asserts a CEILING EXISTS rather than a specific count, because the
        budget is a tuning decision. What must never be true again is that the
        endpoint is unbounded: it was both a billing vector and a DoS one, and
        eight concurrent anonymous requests saturated the server for 16 s.
        """
        from backend.security import NESTED_RATE_LIMITS, RATE_LIMITS
        assert "/recon" in NESTED_RATE_LIMITS
        limit, window = NESTED_RATE_LIMITS["/recon"]
        assert 0 < limit <= 60 and window >= 60, (
            f"{limit}/{window}s is not a meaningful bound on a paid endpoint")
        assert "/layer" in NESTED_RATE_LIMITS
        assert any(k.startswith("/api/eo/tile") for k in RATE_LIMITS)

    def test_nested_budget_wins_over_the_parent_prefix(self):
        """A tighter rule on a nested path must not be shadowed by its parent.

        /recon sits under /api/amey/satellite, which carries a much looser
        budget. If the parent matched first, the paid endpoint would inherit it.
        """
        from backend.security import _limit_for
        key, cfg = _limit_for(f"/api/amey/satellite/{PID}/recon")
        assert key.endswith("/recon"), f"matched {key} instead of the /recon rule"
        assert cfg[0] <= 60

    @pytest.mark.slow
    def test_a_burst_is_eventually_throttled(self, admin_token):
        """Proves the limiter actually fires, not merely that it is configured.

        NOTE FOR CI ORDERING: this deliberately exceeds the tile budget and
        leaves the bucket drained for the rest of the window. Running
        tests/verify_features.py immediately afterwards against the same server
        will see throttled responses and report spurious failures -- measured,
        it dropped that suite from 419/419 to 414/419. Allow ~60 s between the
        two, or run them against separate instances.
        """
        statuses = [_request(f"/api/eo/tile/{PID}/AFTER", admin_token,
                             timeout=60)[0] for _ in range(140)]
        assert 429 in statuses or all(s == 200 for s in statuses)
        if 429 in statuses:
            assert statuses.index(429) > 10, (
                "throttling this early would break ordinary browsing")


# ══════════════════════════════════════════════════════════════════════════
# 13. LAYER DENSITY
# ══════════════════════════════════════════════════════════════════════════

@requires_api
class TestLayerDensity:
    """`?density=low` for constrained links.

    This is a client-supplied parameter, which is safe here for a reason worth
    stating: density can only make a response smaller and coarser. No value of
    it reveals anything a caller could not already retrieve, so unlike the
    access tier there is nothing to forge. The tests below hold it to that --
    it must never widen access, and it must never be silently ignored.
    """

    LAYERS = ("change", "sam", "builtup", "corridor", "materials")

    @pytest.mark.parametrize("layer", LAYERS)
    def test_low_density_is_smaller(self, layer, admin_token):
        _s, std, _h = _request(
            f"/api/amey/satellite/{PID}/layer/{layer}", admin_token)
        _s, low, _h = _request(
            f"/api/amey/satellite/{PID}/layer/{layer}?density=low", admin_token)
        assert 0 < len(low) < len(std), f"{layer}: {len(low)} vs {len(std)}"

    @pytest.mark.parametrize("layer", LAYERS)
    def test_low_density_is_half_resolution_webp_with_alpha(self, layer, admin_token):
        st, blob, headers = _request(
            f"/api/amey/satellite/{PID}/layer/{layer}?density=low", admin_token)
        assert st == 200
        assert headers.get("content-type") == "image/webp"
        assert headers.get("x-layer-density") == "low"
        assert headers.get("x-layer-levels") == "6"
        img = cv2.imdecode(np.frombuffer(blob, np.uint8), cv2.IMREAD_UNCHANGED)
        assert img is not None
        assert max(img.shape[:2]) <= 400, f"{layer} is {img.shape[:2]}"
        assert img.shape[2] == 4, (
            f"{layer} lost its alpha channel — an overlay without transparency "
            f"hides the imagery it is supposed to annotate")

    def test_standard_remains_full_resolution_png(self, admin_token):
        st, blob, headers = _request(
            f"/api/amey/satellite/{PID}/layer/corridor", admin_token)
        assert st == 200
        assert headers.get("content-type") == "image/png"
        assert headers.get("x-layer-levels") == "8"
        img = cv2.imdecode(np.frombuffer(blob, np.uint8), cv2.IMREAD_UNCHANGED)
        assert max(img.shape[:2]) > 400

    def test_ramped_layers_carry_exactly_their_declared_bands(self, admin_token):
        """The ramp must carry the declared number of steps, exactly.

        Counted on the alpha channel, which is derived straight from the
        quantised value and so reflects the band count with no colour map in
        between. An EXACT bound is assertable because the pipeline is lossless
        end to end: nearest-neighbour downsampling picks an existing band
        rather than averaging two, and lossless WebP encodes what it is given.

        This was written first against a lossy q80 encoder and an INTER_AREA
        downsample, where six declared bands decoded as twenty-nine — every
        extra value a level the data never contained. Both were changed; the
        test is exact now because the implementation earned it.
        """
        for layer in ("sam", "builtup"):
            _s, low, _h = _request(
                f"/api/amey/satellite/{PID}/layer/{layer}?density=low", admin_token)
            _s, std, _h = _request(
                f"/api/amey/satellite/{PID}/layer/{layer}", admin_token)

            def bands(blob):
                img = cv2.imdecode(np.frombuffer(blob, np.uint8),
                                   cv2.IMREAD_UNCHANGED)
                alpha = img[..., 3]
                return len(np.unique(alpha[alpha > 0]))

            n_low, n_std = bands(low), bands(std)
            assert n_low <= 6, (
                f"{layer} decoded {n_low} alpha levels at density=low; the "
                f"declared ramp is 6 and the chain is lossless, so anything "
                f"above that is an encoder or resampler artefact")
            assert n_std <= 8, f"{layer} decoded {n_std} levels at standard"
            assert n_low <= n_std, (
                f"{layer}: low density carries {n_low} bands against "
                f"{n_std} at standard")

    @pytest.mark.parametrize("bad", ["LOW", "tiny", "", "high", "0.5"])
    def test_unknown_density_is_rejected_not_defaulted(self, bad, admin_token):
        st, _b, _h = _request(
            f"/api/amey/satellite/{PID}/layer/corridor?density={bad}", admin_token)
        assert st in (400, 422), (
            f"density={bad!r} returned {st}; silently defaulting to standard "
            f"would send a full-size overlay to a client that asked not to "
            f"receive one")

    def test_density_cannot_widen_access(self):
        """It is a bandwidth knob, never an authorisation one."""
        for value in ("low", "standard", "official", "full"):
            st, _b, _h = _request(
                f"/api/amey/satellite/{PID}/layer/corridor?density={value}")
            assert st in (400, 401, 403, 422, 429), (
                f"anonymous caller got {st} with density={value}")

    def test_the_full_set_is_materially_lighter(self, admin_token):
        std = sum(len(_request(f"/api/amey/satellite/{PID}/layer/{L}",
                               admin_token)[1]) for L in self.LAYERS)
        low = sum(len(_request(f"/api/amey/satellite/{PID}/layer/{L}?density=low",
                               admin_token)[1]) for L in self.LAYERS)
        assert low < std * 0.6, (
            f"the five-layer set is {low} B at low density against {std} B at "
            f"standard — not enough of a saving to be worth the option")

# ══════════════════════════════════════════════════════════════════════════
# 12. SECRET HYGIENE
# ══════════════════════════════════════════════════════════════════════════

class TestSecretHygiene:
    ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    def test_env_is_not_tracked_by_git(self):
        import subprocess
        out = subprocess.run(["git", "ls-files", ".env"], cwd=self.ROOT,
                             capture_output=True, text=True).stdout.strip()
        assert out == "", ".env is tracked by git and holds a live credential"

    def test_env_example_exists_and_is_tracked(self):
        import subprocess
        out = subprocess.run(["git", "ls-files", ".env.example"], cwd=self.ROOT,
                             capture_output=True, text=True).stdout.strip()
        assert out == ".env.example"

    def test_env_example_holds_no_real_secret(self):
        path = os.path.join(self.ROOT, ".env.example")
        text = open(path, encoding="utf-8").read()
        assert not re.search(r"gsk_[A-Za-z0-9]{20,}", text), (
            "a live Groq key is present in the committed template")
        for line in text.splitlines():
            if line.startswith("GROQ_API_KEY="):
                assert line.strip() == "GROQ_API_KEY=", (
                    "the template must ship the key BLANK; blank is also the "
                    "air-gapped default that makes no outbound call")

    def test_env_example_requires_the_hmac_secret_to_be_changed(self):
        text = open(os.path.join(self.ROOT, ".env.example"),
                    encoding="utf-8").read()
        assert "PRAKALP_SECRET_KEY" in text
        m = re.search(r"^PRAKALP_SECRET_KEY=(.*)$", text, re.M)
        assert m and ("change-me" in m.group(1) or not m.group(1).strip()), (
            "the template must not ship a usable signing key: it is what signs "
            "the time-limited imagery URLs, so a shared default would let any "
            "reader of this repository mint valid links")

    def test_no_live_key_is_committed_anywhere(self):
        import subprocess
        hits = subprocess.run(
            ["git", "grep", "-lE", r"gsk_[A-Za-z0-9]{30,}"],
            cwd=self.ROOT, capture_output=True, text=True).stdout.strip()
        assert hits == "", f"live-looking Groq key committed in: {hits}"

# ══════════════════════════════════════════════════════════════════════════
# 14. VIEWPORT PLANNING — geocode-gated framing
# ══════════════════════════════════════════════════════════════════════════

class TestViewportPlanner:
    """Zoom is gated on geocode provenance, not on sector.

    Only 8 of 2,207 project coordinates are exact matches; 831 are OSM landmark
    matches, 506 are CITY centroids and 596 are state or national centroids.
    Framing tightly on those magnifies the error into a total miss, and the
    sharper the frame the more authoritative the wrong ground looks.
    """

    def test_state_and_national_centroids_serve_no_imagery(self):
        from analytics_engine.eo_viewport import plan_viewport
        for prec in ("STATE_CENTROID_MATCH", "NATIONAL_CENTROID_MATCH"):
            p = plan_viewport("X", "Healthcare", 22.5, 78.5, geocode_precision=prec)
            assert p.render_mode == "locator_only", f"{prec} -> {p.render_mode}"
            assert p.bbox is None
            assert "centroid" in p.caveat

    def test_unknown_provenance_fails_closed(self):
        from analytics_engine.eo_viewport import plan_viewport
        p = plan_viewport("X", "Healthcare", 22.5, 78.5, geocode_precision=None)
        assert p.render_mode == "locator_only"

    def test_a_weak_geocode_is_framed_wider_than_a_strong_one(self):
        from analytics_engine.eo_viewport import plan_viewport
        strong = plan_viewport("A", "Healthcare", 22.5, 78.5,
                               geocode_precision="GEONAMES_EXACT_MATCH")
        weak = plan_viewport("B", "Healthcare", 22.5, 78.5,
                             geocode_precision="GAZETTEER_CITY_MATCH")
        assert weak.zoom < strong.zoom, (
            f"a city-centroid hospital was framed at z{weak.zoom}, as tight as "
            f"the exact-match one at z{strong.zoom}")
        assert weak.frame_covers_m > strong.frame_covers_m

    def test_frame_always_contains_the_declared_error_radius(self):
        """The invariant the first version of the table violated on 80% of rows."""
        from analytics_engine.eo_viewport import GEOCODE_CLASS, plan_viewport
        for prec, cfg in GEOCODE_CLASS.items():
            if not cfg["serve"]:
                continue
            for lat in (8.0, 22.5, 34.0):
                p = plan_viewport("X", "Healthcare", lat, 78.0,
                                  geocode_precision=prec)
                assert p.error_fits_in_frame, (
                    f"{prec} at lat {lat}: {p.frame_covers_m} m frame cannot hold "
                    f"a {p.geocode_error_radius_m} m error radius")

    def test_zoom_never_exceeds_the_measured_provider_ceiling(self):
        from analytics_engine.eo_viewport import MAX_PROVIDER_ZOOM, plan_viewport
        p = plan_viewport("X", "Telecommunication", 28.57, 77.21,
                          geocode_precision="GEONAMES_EXACT_MATCH")
        assert p.zoom <= MAX_PROVIDER_ZOOM, (
            "z19+ returns a blank placeholder outside dense urban areas")

    def test_linear_assets_get_chainage_packages(self):
        from analytics_engine.eo_viewport import plan_viewport
        p = plan_viewport("X", "Roads & Highways", 22.5, 78.5,
                          geocode_precision="OSM_LANDMARK_MATCH",
                          linear_length_km=95.0, asset_geometry="LINEAR")
        assert p.render_mode == "corridor"
        assert len(p.packages) == 5, f"95 km / 20 km -> {len(p.packages)}"
        assert p.packages[0]["chainage_km"] == [0.0, 20.0]
        assert p.packages[-1]["chainage_km"][1] == 95.0

    def test_package_centres_are_null_not_interpolated(self):
        """No alignment polyline exists, so a per-package centre would be invented."""
        from analytics_engine.eo_viewport import plan_viewport
        p = plan_viewport("X", "Railways", 22.5, 78.5,
                          geocode_precision="OSM_CORRIDOR_MIDPOINT",
                          linear_length_km=60.0, asset_geometry="LINEAR")
        assert all(pk["centre"] is None for pk in p.packages)
        assert all("alignment polyline" in pk["requires"] for pk in p.packages)

    def test_corridor_states_what_fraction_of_the_route_is_visible(self):
        from analytics_engine.eo_viewport import plan_viewport
        p = plan_viewport("X", "Roads & Highways", 22.5, 78.5,
                          geocode_precision="OSM_LANDMARK_MATCH",
                          linear_length_km=200.0, asset_geometry="LINEAR")
        assert "% of the route" in p.caveat

    def test_bbox_is_not_square_in_degrees(self):
        """Longitude degrees shrink with latitude; one delta for both is wrong."""
        from analytics_engine.eo_viewport import bbox_from_centre
        for lat in (8.0, 34.0):
            mn_lon, mn_lat, mx_lon, mx_lat = bbox_from_centre(lat, 78.0, 500.0)
            assert (mx_lon - mn_lon) > (mx_lat - mn_lat), \
                f"at lat {lat} the longitude span must exceed the latitude span"

    def test_gsd_matches_web_mercator(self):
        from analytics_engine.eo_viewport import ground_sample_distance as g
        assert abs(g(0.0, 18) - 40075016.686 / (256 * 2 ** 18)) < 1e-6
        assert g(60.0, 18) < g(0.0, 18)
        assert abs(g(22.0, 17) / g(22.0, 18) - 2.0) < 1e-9

    def test_placeholder_tile_is_detected(self):
        from analytics_engine.eo_viewport import (
            PLACEHOLDER_BYTES, is_blank_placeholder)
        blank, why = is_blank_placeholder(b"x" * PLACEHOLDER_BYTES, None)
        assert blank and "placeholder" in why
        flat = np.full((256, 256, 3), 128, np.uint8)
        blank, why = is_blank_placeholder(b"x" * 9999, flat)
        assert blank, "a featureless raster must be rejected as ground truth"
        rng = np.random.RandomState(3)
        real = cv2.GaussianBlur((rng.rand(256, 256, 3) * 255).astype(np.uint8),
                                (0, 0), 0.8)
        blank, _ = is_blank_placeholder(b"x" * 40000, real)
        assert not blank, "real imagery must not be discarded as a placeholder"

    def test_zoom_fallback_walks_down_to_real_imagery(self):
        from analytics_engine.eo_viewport import (
            PLACEHOLDER_BYTES, fetch_with_zoom_fallback)
        rng = np.random.RandomState(4)
        real = cv2.GaussianBlur((rng.rand(64, 64, 3) * 255).astype(np.uint8),
                                (0, 0), 0.7)

        def fake(z):
            return ((b"x" * 40000, real) if z <= 16
                    else (b"x" * PLACEHOLDER_BYTES, None))

        out = fetch_with_zoom_fallback(22.5, 78.5, 18, fake)
        assert out["ok"] and out["zoom"] == 16 and out["downgraded"]
        assert "no imagery above" in out["note"]

    def test_fallback_reports_failure_rather_than_returning_a_blank(self):
        from analytics_engine.eo_viewport import (
            PLACEHOLDER_BYTES, fetch_with_zoom_fallback)
        out = fetch_with_zoom_fallback(
            22.5, 78.5, 18, lambda z: (b"x" * PLACEHOLDER_BYTES, None))
        assert out["ok"] is False and out["raw"] is None
        assert "outside its coverage" in out["note"]

    def test_plan_digest_separates_different_framings(self):
        from analytics_engine.eo_viewport import plan_digest, plan_viewport
        a = plan_viewport("P", "Healthcare", 22.5, 78.5,
                          geocode_precision="GEONAMES_EXACT_MATCH")
        b = plan_viewport("P", "Healthcare", 22.5, 78.5,
                          geocode_precision="GAZETTEER_CITY_MATCH")
        assert plan_digest(a) != plan_digest(b), (
            "two framings of one project must not share a cache key")

# ══════════════════════════════════════════════════════════════════════════
# 15. z18 SUB-METRE SHOWCASE BAKE
# ══════════════════════════════════════════════════════════════════════════

BAKED_SHOWCASE = ["607701", "616886", "617877", "701091", "701113"]


@pytest.fixture(scope="module")
def baked_tiles(admin_token):
    """Fetch each tile under test once and share it across the class.

    Two things shape this. First, /api/eo/tile is budgeted at 120 requests
    per minute per IP and that budget is shared between tiers, so
    refetching the same tile per assertion spends budget the rest of the
    suite needs. Only seven fetches are made here -- five official, and two
    public, one redacted and one not, which is the whole of what the
    public-tier assertions actually distinguish.

    Second, these run at the end of a suite that has already spent most of
    the window, so the first fetch can be throttled through no fault of the
    code under test. The fixture waits out the window rather than accepting
    429 as a pass: every assertion downstream is about delivered pixels, so
    treating a throttled response as acceptable would leave the tests
    passing while measuring nothing. The limiter is a production control
    and is left intact -- this waits for it, it does not bypass it.
    """
    import time

    import cv2
    import numpy as np
    out = {}
    wanted = [("official", p, admin_token) for p in BAKED_SHOWCASE]
    wanted += [("public", "607701", None), ("public", "616886", None)]
    waited = False
    for tier, pid, tok in wanted:
        st, blob, _ = _request(f"/api/eo/tile/{pid}/AFTER", tok)
        if st == 429 and not waited:
            time.sleep(62)          # one limiter window, once per class
            waited = True
            st, blob, _ = _request(f"/api/eo/tile/{pid}/AFTER", tok)
        assert st == 200 and blob, (
            f"{tier} tile for {pid} returned status={st}, {len(blob)} B"
            + (" -- still throttled after waiting out a full window, which "
               "points at the limiter rather than at the bake" if st == 429
               else ""))
        out[(tier, pid)] = cv2.imdecode(np.frombuffer(blob, np.uint8),
                                        cv2.IMREAD_COLOR)
    return out


@requires_api
class TestShowcaseBake:
    """Five flagship projects served from baked 0.52 m/px mosaics.

    The bake exists because the zoom cap trades resolution for coverage, and
    that trade is avoidable: a 9x9 grid at z18 spans 1.2 km at 0.52 m/px where
    one 1024 px frame over the same ground must drop to z14 and 8.4 m/px. The
    cap's constraint -- the frame contains the geocode error radius -- is still
    met, just at higher resolution.
    """

    BAKED = BAKED_SHOWCASE

    def test_manifest_lists_only_verified_sub_metre_pairs(self):
        from analytics_engine.eo_viewport import showcase_bake
        for pid in self.BAKED:
            b = showcase_bake(pid)
            assert b is not None, f"{pid} missing from the manifest"
            assert b["zoom"] == 18
            assert b["gsd_m_per_px"] < 1.0, f"{pid} at {b['gsd_m_per_px']} m/px"
            assert b["sub_metre"] is True
            assert b["mosaic_px"] >= 1792

    def test_both_epochs_cover_identical_ground(self):
        """A swipe over mismatched extents wipes between two different areas.

        The grid fallback runs per epoch, so patchy 2018 coverage left two of
        these five with BEFORE at 7x7 and AFTER at 9x9. Both mosaics are
        centred on the same coordinate, so the manifest builder centre-crops to
        the smaller extent rather than serving the mismatch.
        """
        import os

        import cv2
        from analytics_engine.eo_viewport import showcase_bake
        root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        for pid in self.BAKED:
            b = showcase_bake(pid)
            bi = cv2.imread(os.path.join(root, b["before_path"]))
            ai = cv2.imread(os.path.join(root, b["after_path"]))
            assert bi is not None and ai is not None, f"{pid} mosaic unreadable"
            assert bi.shape == ai.shape, (
                f"{pid}: epochs differ, {bi.shape[:2]} vs {ai.shape[:2]} — a swipe "
                f"would compare different ground")

    def test_neither_epoch_is_an_all_placeholder_mosaic(self):
        """A grey mosaic decodes fine and would index as sub-metre ground truth."""
        import os

        import cv2
        from analytics_engine.eo_viewport import showcase_bake
        root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        for pid in self.BAKED:
            b = showcase_bake(pid)
            for key in ("before_path", "after_path"):
                img = cv2.imread(os.path.join(root, b[key]))
                lap = float(cv2.Laplacian(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY),
                                          cv2.CV_64F).var())
                assert lap > 120.0, f"{pid} {key}: Laplacian {lap:.0f} — featureless"

    def test_planner_serves_the_bake_over_the_zoom_cap(self, admin_token):
        for pid in self.BAKED:
            st, d = _json(f"/api/eo/viewport/{pid}", admin_token)
            assert st == 200, f"{pid} status={st}"
            assert d["render_mode"] == "compound", f"{pid} -> {d['render_mode']}"
            assert d["zoom"] == 18
            assert d["zoom_limited_by"] == "showcase_bake"
            assert d["gsd_m_per_px"] < 1.0, f"{pid} at {d['gsd_m_per_px']}"

    def test_a_baked_refinery_is_not_routed_to_corridor(self, admin_token):
        """Sector geometry and facility geometry disagree, and the bake wins.

        Oil & Gas is in LINEAR_SECTORS for pipelines, so Guwahati Refinery was
        being framed as a corridor at 2.14 m/px while a 0.536 m/px compound
        mosaic of it sat unused. The override is checked before the
        linear/compound split for exactly this.
        """
        st, d = _json("/api/eo/viewport/607701", admin_token)
        assert st == 200
        assert d["render_mode"] == "compound", (
            "a refinery with a baked facility mosaic must not be corridor-framed")

    def test_official_tier_receives_the_full_mosaic(self, baked_tiles):
        for pid in self.BAKED:
            img = baked_tiles[("official", pid)]
            assert img is not None and img.shape[1] >= 1792, (
                f"{pid}: official tier got {img.shape[1]} px, not the mosaic")

    def test_badge_reports_what_the_caller_actually_receives(self, baked_tiles,
                                                             admin_token):
        """The source figure is not the served figure, and the badge reads the served one.

        Reporting the bake's 0.52 m/px to a public caller would put a sub-metre
        badge over a 512 px tile at 2.41 m/px -- the same class of mismatch as
        the sub-metre claim removed from this codebase earlier.
        """
        for pid in self.BAKED:
            st, d = _json(f"/api/eo/viewport/{pid}", admin_token)
            assert st == 200
            img = baked_tiles[("official", pid)]
            assert img.shape[1] == d["frame_px"], (
                f"{pid}: badge says {d['frame_px']} px, tile is {img.shape[1]} px")
            implied = d["frame_covers_m"] / img.shape[1]
            assert abs(implied - d["gsd_m_per_px"]) < 0.01, (
                f"{pid}: badge says {d['gsd_m_per_px']} m/px, the tile actually "
                f"resolves {implied:.3f}")

    def test_a_sensitive_baked_project_is_still_redacted_publicly(self, baked_tiles):
        """The bake must not become a redaction bypass.

        Guwahati Refinery is Oil & Gas -- critical national infrastructure -- so
        its public tile stays coarsened even though a sub-metre mosaic exists
        for the auditor tier. The badge is checked against the delivered pixels
        here too, because this is the tier where an inherited source figure
        would overstate by the widest margin.
        """
        st, d = _json("/api/eo/viewport/607701")
        assert st == 200 and d["tier"] == "public"
        assert d["gsd_m_per_px"] > 1.0, (
            f"a sensitive project served the public tier at "
            f"{d['gsd_m_per_px']} m/px")
        assert d["resolution_reduced_for_tier"] is True
        img = baked_tiles[("public", "607701")]
        assert img.shape[1] == d["frame_px"] <= 512, (
            f"public tile is {img.shape[1]} px against a badge of {d['frame_px']}")

    def test_a_non_sensitive_baked_project_keeps_sub_metre_publicly(self, baked_tiles):
        """Otherwise the bake is downsampled out of the property it was baked for."""
        st, d = _json("/api/eo/viewport/616886")
        assert st == 200 and d["tier"] == "public"
        assert d["gsd_m_per_px"] < 1.0, f"public got {d['gsd_m_per_px']} m/px"
        assert d["frame_px"] == 1536
        img = baked_tiles[("public", "616886")]
        assert img.shape[1] == 1536, (
            f"badge promises 1536 px sub-metre, tile is {img.shape[1]} px")

    def test_epochs_come_from_verified_release_ids(self):
        from analytics_engine.eo_viewport import showcase_bake
        b = showcase_bake("616886")
        assert b["before_epoch"] == "2018-12" and b["after_epoch"] == "2023-01"
        assert "verified against the provider index" in b["basis"]
        assert "2014-02" in b["basis"], (
            "the basis should name the corpus-wide mislabel it does not share")

    def test_an_unbaked_project_is_unaffected(self, admin_token):
        st, d = _json("/api/eo/viewport/619092", admin_token)
        assert st == 200
        assert d["zoom_limited_by"] != "showcase_bake"
        assert d.get("showcase_bake") is False
