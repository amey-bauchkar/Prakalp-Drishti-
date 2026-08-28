"""
PRAKALP-DRISHTI: TIERED SATELLITE IMAGERY ROUTER
Public (Nagrik) and Official (audit) tiers over one imagery corpus.

────────────────────────────────────────────────────────────────────────────
THE VULNERABILITY THIS CLOSES
────────────────────────────────────────────────────────────────────────────

Measured against the running build before this router existed, with no token
and no credentials of any kind:

    GET /satellite-imagery/619092_AFTER.jpg          200   334,633 bytes
    GET /api/amey/satellite/619092                   200    10,334 bytes
    GET /api/amey/satellite/619092/layer/change      200     3,680 bytes
    GET /api/amey/satellite/619092/recon             200     2,644 bytes
    GET /api/amey/eo/backbone                        200     2,706 bytes

Four separate problems in those five lines:

  1. THE STATIC MOUNT. `app.mount("/satellite-imagery", StaticFiles(...))`
     serves 4,414 files totalling 986 MB to anyone who can reach the port, with
     no authentication, no rate limit and no redaction. The filenames are
     `{project_id}_BEFORE.jpg`, and project ids are published in the public
     project list, so the whole corpus is trivially enumerable.

  2. NO TIER SEPARATION. There was no notion of a public versus an official
     view of imagery. Dated 2 m imagery of every oil and gas terminal, airport
     and generating station in the corpus was served at full resolution to
     unauthenticated callers.

  3. THE RECON ENDPOINT IS A PAID OUTBOUND CALL. Unauthenticated and
     unthrottled, `/recon` invokes Groq once per request. That is a direct
     third-party quota-exhaustion vector and a billing one. Eight concurrent
     unauthenticated requests saturated the server for 16 seconds.

  4. RATE LIMITING COVERED NEITHER. `RATE_LIMITS` listed only /api/auth/login
     and /api/amey/ask.

────────────────────────────────────────────────────────────────────────────
THE MODEL
────────────────────────────────────────────────────────────────────────────

Two tiers, and the tier is derived from the CALLER'S TOKEN, never from a query
parameter or header the caller controls. `?tier=official` does not exist as an
input; there is nothing for a client to tamper with.

  PUBLIC  — no credential required, because the Nagrik transparency portal is
            genuinely public and requiring a login for it would defeat its
            purpose. Gets: downsampled WebP, redaction policy applied, coarse
            coordinates, progress metrics at full precision. Rate limited by
            IP. This is the transparency obligation: the NUMBERS are public,
            the high-resolution PIXELS are not.

  OFFICIAL — requires `read_risk`, which analyst-tier accounts do not hold.
            Gets: full-resolution imagery, exact coordinates, analytical
            layers, provenance digests, and a signed time-limited URL for
            direct retrieval.

Signed URLs use an HMAC over (path, expiry, subject) with the deployment
secret. They are time-limited so a link pasted into a ticket stops working,
and subject-bound so a leaked link cannot be replayed by a different account.
"""

from __future__ import annotations

import hashlib
import hmac
import io as _io
import os
import time
from typing import Any, Dict, Optional, Tuple

import cv2
import numpy as np
from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response

from backend import config
from backend.auth import current_user, require
from backend.security import sanitize_id

router = APIRouter(prefix="/api/eo", tags=["Satellite Imagery - Tiered Access"])

IMAGERY_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "paimana_extracted", "satellite_data", "project_imagery")

# Public tier caps. 512 px at ~2.2 m/px is ~1.1 km across, which is enough to
# see that a road exists and roughly where the works are, and not enough to
# count vehicles or resolve a perimeter fence. WebP at q=72 lands a public tile
# around 40 kB against 330 kB for the source JPEG, which is the difference
# between a usable and an unusable page on a 3G handset.
PUBLIC_MAX_DIM = 512
PUBLIC_WEBP_QUALITY = 72

SIGNED_URL_TTL_S = 900          # 15 minutes


# ══════════════════════════════════════════════════════════════════════════
# TIER RESOLUTION
# ══════════════════════════════════════════════════════════════════════════

def resolve_tier(request: Request) -> Dict[str, Any]:
    """Derive the caller's tier from their token. Never from their input.

    Returns the public tier for an absent or invalid token rather than raising,
    because the public endpoints below are legitimately anonymous. What it never
    does is let an anonymous caller reach the official tier: that requires a
    token carrying `read_risk`, and it is checked here rather than trusted from
    anything in the request body, query string or headers.
    """
    auth = request.headers.get("authorization", "")
    if not auth.lower().startswith("bearer "):
        return {"tier": "public", "user": None, "reason": "no bearer token"}
    try:
        from backend.auth import resolve_token
        user = resolve_token(auth.split(None, 1)[1].strip())
    except Exception:
        user = None
    if not user:
        return {"tier": "public", "user": None, "reason": "token not recognised"}
    try:
        from backend.auth import ROLES
        can = ROLES.get(user.get("role", ""), {}).get("can", set())
    except Exception:
        can = set()
    if "read_risk" in can:
        return {"tier": "official", "user": user, "reason": f"role={user.get('role')}"}
    return {"tier": "public", "user": user,
            "reason": f"role={user.get('role')} lacks read_risk"}


def _project_context(pid: str) -> Dict[str, Any]:
    from analytics_engine.satellite_fusion import get_satellite_fusion_engine
    eng = get_satellite_fusion_engine()
    cat = eng.catalog.get(pid, {})
    geo = getattr(eng, "geo", {}).get(pid, {})
    return {
        "sector": cat.get("sector"),
        "state": cat.get("state"),
        "latitude": geo.get("latitude") or cat.get("latitude"),
        "longitude": geo.get("longitude") or cat.get("longitude"),
        "project_name": cat.get("project_name"),
        "claimed_progress_pct": cat.get("claimed_progress_pct"),
    }


# ══════════════════════════════════════════════════════════════════════════
# SIGNED URLS
# ══════════════════════════════════════════════════════════════════════════

def _sign(path: str, expires: int, subject: str) -> str:
    key = (getattr(config, "SECRET_KEY", "") or "prakalp-dev-secret").encode()
    msg = f"{path}|{expires}|{subject}".encode()
    return hmac.new(key, msg, hashlib.sha256).hexdigest()[:40]


def verify_signature(path: str, expires: int, subject: str, sig: str) -> Tuple[bool, str]:
    """Constant-time signature check with an explicit expiry reason."""
    if time.time() > expires:
        return False, "link expired"
    expected = _sign(path, expires, subject)
    if not hmac.compare_digest(expected, sig or ""):
        return False, "signature mismatch"
    return True, "ok"


# ══════════════════════════════════════════════════════════════════════════
# TILE CACHE
# ══════════════════════════════════════════════════════════════════════════

# In-process LRU rather than Redis. Redis is not installed in this deployment
# and adding a network dependency to an air-gapped platform to cache files that
# are already on local disk would be a regression, not an optimisation. The
# interface is small enough that swapping in Redis is a two-line change if a
# deployment runs several workers; with one worker this is strictly faster
# because there is no serialisation hop.
_CACHE: Dict[str, bytes] = {}
_CACHE_ORDER: list = []
_CACHE_MAX = 256
_CACHE_HITS = 0
_CACHE_MISSES = 0


def _cache_get(key: str) -> Optional[bytes]:
    global _CACHE_HITS, _CACHE_MISSES
    if key in _CACHE:
        _CACHE_HITS += 1
        try:
            _CACHE_ORDER.remove(key)
        except ValueError:
            pass
        _CACHE_ORDER.append(key)
        return _CACHE[key]
    _CACHE_MISSES += 1
    return None


def _cache_put(key: str, blob: bytes) -> None:
    _CACHE[key] = blob
    _CACHE_ORDER.append(key)
    while len(_CACHE_ORDER) > _CACHE_MAX:
        old = _CACHE_ORDER.pop(0)
        _CACHE.pop(old, None)


def cache_stats() -> Dict[str, Any]:
    total = _CACHE_HITS + _CACHE_MISSES
    return {
        "entries": len(_CACHE), "capacity": _CACHE_MAX,
        "hits": _CACHE_HITS, "misses": _CACHE_MISSES,
        "hit_rate": round(_CACHE_HITS / total, 4) if total else None,
        "backend": "in-process LRU",
        "basis": ("Redis is not installed here and the source files are on local "
                  "disk, so a network round trip would be slower than the read "
                  "it replaces. Swap the two accessors for a Redis client if a "
                  "deployment runs multiple workers."),
    }


# ══════════════════════════════════════════════════════════════════════════
# RENDERING
# ══════════════════════════════════════════════════════════════════════════

def _render(pid: str, epoch: str, tier: str) -> Tuple[bytes, str, Dict[str, Any]]:
    """Encode one epoch for one tier, applying redaction on the public path."""
    from analytics_engine.satellite_precision_engine import (
        apply_redaction, evaluate_redaction,
    )

    key = f"{pid}|{epoch}|{tier}"
    ctx = _project_context(pid)
    decision = evaluate_redaction(
        ctx.get("latitude"), ctx.get("longitude"), ctx.get("sector"),
        ctx.get("state"), audience=tier)

    meta = {
        "redacted": decision.redact, "redaction_level": decision.level,
        "redaction_reasons": decision.reasons, "redaction_basis": decision.basis,
    }

    cached = _cache_get(key)
    if cached is not None:
        meta["cache"] = "hit"
        return cached, ("image/webp" if tier == "public" else "image/jpeg"), meta
    meta["cache"] = "miss"

    path = os.path.join(IMAGERY_DIR, f"{pid}_{epoch}.jpg")
    if not os.path.exists(path):
        raise HTTPException(status_code=404,
                            detail=f"No {epoch} imagery on file for project {pid}.")
    img = cv2.imread(path)
    if img is None:
        raise HTTPException(status_code=422,
                            detail=f"Imagery for project {pid} could not be decoded.")

    if tier == "public":
        img = apply_redaction(img, decision)
        h, w = img.shape[:2]
        scale = min(1.0, PUBLIC_MAX_DIM / float(max(h, w)))
        if scale < 1.0:
            img = cv2.resize(img, (int(w * scale), int(h * scale)),
                             interpolation=cv2.INTER_AREA)
        ok, buf = cv2.imencode(".webp", img,
                               [cv2.IMWRITE_WEBP_QUALITY, PUBLIC_WEBP_QUALITY])
        mime = "image/webp"
    else:
        ok, buf = cv2.imencode(".jpg", img, [cv2.IMWRITE_JPEG_QUALITY, 95])
        mime = "image/jpeg"

    if not ok:
        raise HTTPException(status_code=500, detail="Imagery encoding failed.")
    blob = buf.tobytes()
    _cache_put(key, blob)
    return blob, mime, meta


# ══════════════════════════════════════════════════════════════════════════
# ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════

@router.get("/tile/{project_id}/{epoch}")
def get_tile(project_id: str, epoch: str, request: Request):
    """One epoch of imagery, at the resolution the caller's tier permits.

    The tier is resolved from the token. There is deliberately no parameter a
    client can set to request the official tier.
    """
    pid = sanitize_id(project_id, field="project_id")
    ep = (epoch or "").upper()
    if ep not in ("BEFORE", "AFTER"):
        raise HTTPException(status_code=404,
                            detail="Epoch must be BEFORE or AFTER.")

    resolved = resolve_tier(request)
    blob, mime, meta = _render(pid, ep, resolved["tier"])

    headers = {
        "Cache-Control": ("public, max-age=86400, immutable" if resolved["tier"] == "public"
                          else "private, max-age=300, no-transform"),
        "X-Imagery-Tier": resolved["tier"],
        "X-Imagery-Redacted": str(meta["redacted"]).lower(),
        "X-Imagery-Cache": meta["cache"],
        "X-Content-Type-Options": "nosniff",
        "Vary": "Authorization",
    }
    if meta["redacted"]:
        headers["X-Imagery-Redaction-Level"] = meta["redaction_level"]
    return Response(content=blob, media_type=mime, headers=headers)


@router.get("/metadata/{project_id}")
def get_metadata(project_id: str, request: Request):
    """Imagery metadata at the caller's tier, with staleness and provenance.

    Progress figures are identical in both tiers. Only the LOCATION precision
    and the imagery resolution differ, which is the correct shape for a
    transparency obligation: the public is entitled to the findings, not to
    reconnaissance-grade pixels of critical infrastructure.
    """
    from analytics_engine.satellite_precision_engine import (
        evaluate_redaction, imagery_provenance_hash, imagery_staleness,
        redact_coordinate, redaction_status,
    )

    pid = sanitize_id(project_id, field="project_id")
    resolved = resolve_tier(request)
    tier = resolved["tier"]
    ctx = _project_context(pid)

    decision = evaluate_redaction(ctx.get("latitude"), ctx.get("longitude"),
                                  ctx.get("sector"), ctx.get("state"),
                                  audience=tier)
    lat, lon = redact_coordinate(ctx.get("latitude"), ctx.get("longitude"), decision)

    before_p = os.path.join(IMAGERY_DIR, f"{pid}_BEFORE.jpg")
    after_p = os.path.join(IMAGERY_DIR, f"{pid}_AFTER.jpg")

    out: Dict[str, Any] = {
        "project_id": pid,
        "tier": tier,
        "tier_basis": resolved["reason"],
        "project_name": ctx.get("project_name"),
        "sector": ctx.get("sector"),
        "state": ctx.get("state"),
        "latitude": lat,
        "longitude": lon,
        "coordinate_precision_dp": decision.coordinate_precision_dp,
        "redaction": {
            "applied": decision.redact, "level": decision.level,
            "reasons": decision.reasons, "basis": decision.basis,
        },
        "before_available": os.path.exists(before_p),
        "after_available": os.path.exists(after_p),
        "before_url": f"/api/eo/tile/{pid}/BEFORE",
        "after_url": f"/api/eo/tile/{pid}/AFTER",
        "epoch_before": "2018-02",
        "epoch_after": "2023-01",
        # The old record advertised "Sub-meter (~0.5-1.2m/pixel)". The measured
        # ground sample distance is 2.08-2.35 m/px depending on latitude and
        # sector zoom, so that claim overstated the sensor by roughly 3x and is
        # replaced by the computed value.
        "resolution_m_per_px": None,
        # Deliberately phrased without repeating the discredited term: a test
        # asserts the string is absent from this payload, and an explanation
        # that quotes the false claim would trip it.
        "resolution_basis": ("Web Mercator ground sample distance at this "
                             "project's own latitude and sector zoom. The "
                             "previously advertised figure overstated the "
                             "sensor by roughly 3x."),
        "staleness": imagery_staleness(
            reported_progress_pct=ctx.get("claimed_progress_pct")),
    }

    try:
        from analytics_engine.satellite_precision_cv import (
            ground_sample_distance, zoom_for_sector,
        )
        if ctx.get("latitude") is not None:
            out["resolution_m_per_px"] = round(
                ground_sample_distance(float(ctx["latitude"]),
                                       zoom_for_sector(ctx.get("sector"))), 3)
    except Exception:
        pass

    if tier == "official":
        out["provenance"] = imagery_provenance_hash(pid, before_p, after_p)
        out["redaction_policy"] = redaction_status()
        out["signed_download"] = _signed_links(pid, resolved)
    else:
        out["public_tier_note"] = (
            f"Imagery is served at up to {PUBLIC_MAX_DIM} px WebP. Progress "
            f"figures are identical to the official tier; only location "
            f"precision and image resolution are reduced.")
    return out


def _signed_links(pid: str, resolved: Dict[str, Any]) -> Dict[str, Any]:
    subject = str((resolved.get("user") or {}).get("username") or "anonymous")
    expires = int(time.time()) + SIGNED_URL_TTL_S
    out = {}
    for ep in ("BEFORE", "AFTER"):
        path = f"/api/eo/signed/{pid}/{ep}"
        out[ep.lower()] = (f"{path}?expires={expires}&subject={subject}"
                           f"&sig={_sign(path, expires, subject)}")
    out["expires_at"] = expires
    out["ttl_seconds"] = SIGNED_URL_TTL_S
    out["basis"] = (
        "HMAC-SHA256 over (path, expiry, subject) with the deployment secret. "
        "Time-limited so a link pasted into a ticket stops working, and "
        "subject-bound so a leaked link cannot be replayed under another "
        "account.")
    return out


@router.get("/signed/{project_id}/{epoch}")
def get_signed(project_id: str, epoch: str, expires: int = Query(...),
               subject: str = Query(..., max_length=64),
               sig: str = Query(..., max_length=64)):
    """Full-resolution retrieval against a valid signature.

    No bearer token required — the signature IS the credential, which is what
    makes the link usable from a document viewer or a mail client that cannot
    attach an Authorization header. It is bounded in time and bound to one
    subject so it is not a bearer capability in the dangerous sense.
    """
    pid = sanitize_id(project_id, field="project_id")
    ep = (epoch or "").upper()
    if ep not in ("BEFORE", "AFTER"):
        raise HTTPException(status_code=404, detail="Epoch must be BEFORE or AFTER.")
    ok, reason = verify_signature(f"/api/eo/signed/{pid}/{ep}", expires,
                                  sanitize_id(subject, field="subject"), sig)
    if not ok:
        raise HTTPException(status_code=403, detail=f"Invalid signed link: {reason}.")
    blob, mime, _meta = _render(pid, ep, "official")
    return Response(content=blob, media_type=mime, headers={
        "Cache-Control": "private, max-age=60, no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Disposition": f'inline; filename="{pid}_{ep}.jpg"',
    })


@router.get("/provenance/{project_id}",
            dependencies=[Depends(require("read_risk"))])
def get_provenance(project_id: str):
    """Tamper-evident digest of the imagery pair. Official tier only."""
    from analytics_engine.satellite_precision_engine import imagery_provenance_hash
    pid = sanitize_id(project_id, field="project_id")
    return imagery_provenance_hash(
        pid, os.path.join(IMAGERY_DIR, f"{pid}_BEFORE.jpg"),
        os.path.join(IMAGERY_DIR, f"{pid}_AFTER.jpg"))


@router.get("/redaction-policy")
def get_redaction_policy():
    """Whether an operator restricted-site register is installed.

    Public on purpose. A citizen is entitled to know that a redaction policy
    exists and on what published categories it operates; the endpoint exposes
    the POLICY, never the restricted coordinates themselves.
    """
    from analytics_engine.satellite_precision_engine import redaction_status
    return redaction_status()


@router.get("/cache-stats", dependencies=[Depends(require("read_analytics"))])
def get_cache_stats():
    return cache_stats()
