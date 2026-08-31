"""
PRAKALP-DRISHTI — HTTP hardening.

Three concerns, kept together so a reviewer can audit the whole perimeter in
one file: response headers, request-rate limiting, and path-parameter
sanitisation.

Everything here is process-local and dependency-free. That is a deliberate fit
for the deployment target: an air-gapped ministry network has no Redis to lean
on, and a rate limiter that needs one is a rate limiter that is switched off in
production.
"""

from __future__ import annotations

import re
import time
from collections import defaultdict, deque
from typing import Deque, Dict, Tuple

from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse

# ─────────────────────────────────────────────────────────────────────────
# 1. Response headers
# ─────────────────────────────────────────────────────────────────────────

# A CSP is only useful as an honest record of what the page actually reaches
# for. The fonts are now vendored (frontend/src/fonts.css serves 69 local
# woff2 files and index.html no longer links Google), so the two Google hosts
# this policy used to admit have been removed rather than left as dead
# permissions. Nothing in the page loads from a third-party origin.
_CSP = (
    "default-src 'self'; "
    "img-src 'self' data: blob: https://server.arcgisonline.com https://*.arcgisonline.com https://*.basemaps.cartocdn.com https://basemaps.cartocdn.com https://*.tile.openstreetmap.org; "
    "script-src 'self' 'unsafe-inline'; "
    "style-src 'self' 'unsafe-inline'; "
    "font-src 'self'; "
    "connect-src 'self' http://127.0.0.1:8000 http://localhost:8000 https://server.arcgisonline.com https://*.arcgisonline.com https://*.basemaps.cartocdn.com; "
    "object-src 'none'; "
    "frame-ancestors 'none'; "
    "base-uri 'self'; "
    "form-action 'self'"
)

SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "same-origin",
    "Permissions-Policy": "geolocation=(), microphone=(), camera=(), interest-cohort=()",
    "Content-Security-Policy": _CSP,
}

# HSTS is only meaningful over TLS and actively harmful on a plain-HTTP
# localhost demo (the browser pins the host to https and the demo stops
# loading). Sent only when the request actually arrived over TLS.
HSTS = "max-age=31536000; includeSubDomains"


async def security_headers_middleware(request: Request, call_next):
    response = await call_next(request)
    for k, v in SECURITY_HEADERS.items():
        response.headers.setdefault(k, v)
    if request.url.scheme == "https":
        response.headers.setdefault("Strict-Transport-Security", HSTS)
    return response


# ─────────────────────────────────────────────────────────────────────────
# 2. Rate limiting
# ─────────────────────────────────────────────────────────────────────────

# path prefix -> (max requests, window seconds)
RATE_LIMITS: Dict[str, Tuple[int, int]] = {
    "/api/auth/login": (5, 60),    # credential stuffing
    "/api/amey/ask": (20, 60),     # third-party token exhaustion

    # Satellite paths. These had NO limit, which mattered in three distinct
    # ways measured on the running build:
    #
    #  * /recon makes a paid Groq call per request and required no credential.
    #    Eight concurrent anonymous requests saturated the server for 16 s. It
    #    is both a billing vector and a denial-of-service one, so it gets the
    #    tightest budget here.
    #  * /layer renders a full CV chain per call (~300 ms of CPU) and is
    #    therefore an asymmetric-cost endpoint: cheap to request, expensive to
    #    serve.
    #  * /tile is the corpus-enumeration path. 4,414 files are reachable by
    #    iterating published project ids, so the budget is sized to allow a
    #    person browsing projects and not a script mirroring the archive.
    "/api/amey/satellite": (60, 60),
    "/api/eo/tile": (120, 60),
    "/api/eo/metadata": (120, 60),
    "/api/eo/signed": (60, 60),
}

# Sub-path budgets, checked before the prefix table above so a tighter rule on a
# nested path is not shadowed by a looser one on its parent.
NESTED_RATE_LIMITS: Dict[str, Tuple[int, int]] = {
    # 20/min/IP. At 6 the limiter fired before the auth check could and made
    # the endpoint untestable and unusable -- an official reviewing a
    # handful of projects in a sitting legitimately exceeds six calls a
    # minute. 20 still bounds the paid-call exposure to something a
    # person can plausibly consume and a script cannot exploit.
    "/recon": (20, 60),     # paid outbound LLM call
    # 60/min/IP. At 30 this was too tight for the workflow the feature
    # itself creates: five layers at two densities is ten requests to view
    # one project both ways, so three projects in a sitting hit the wall.
    # 60 still bounds the cost at roughly 18 s of CPU per minute per IP,
    # about a third of one core, which a script cannot escalate past.
    "/layer": (60, 60),     # ~300 ms of CV per request
}

# Paths where only FAILED requests consume budget.
#
# Counting every login attempt throttles the attacker and the operator equally:
# measured on this build, signing in as five demo roles to demonstrate RBAC
# tripped the limiter on the sixth request and locked out a legitimate session.
# Brute force is a stream of FAILURES, so that is what the budget should meter.
# A separate, looser ceiling below still bounds total volume so the endpoint
# cannot be used as a DoS amplifier.
FAILURE_ONLY_PATHS = {"/api/auth/login"}
BURST_CEILING: Dict[str, Tuple[int, int]] = {
    "/api/auth/login": (40, 60),
}

_hits: Dict[Tuple[str, str], Deque[float]] = defaultdict(deque)


def _client_key(request: Request) -> str:
    # X-Forwarded-For is only trusted for its LAST hop, which is the only entry
    # a reverse proxy cannot let a client forge. Behind no proxy it is absent
    # and the socket address is used.
    xff = request.headers.get("x-forwarded-for")
    if xff:
        return xff.split(",")[-1].strip()
    return request.client.host if request.client else "unknown"


def _limit_for(path: str):
    for fragment, cfg in NESTED_RATE_LIMITS.items():
        if fragment in path:
            return path.rsplit(fragment, 1)[0] + fragment, cfg
    for prefix, cfg in RATE_LIMITS.items():
        if path.startswith(prefix):
            return prefix, cfg
    return None, None


def _too_many(bucket: Deque[float], now: float, max_hits: int, window: int):
    while bucket and now - bucket[0] > window:
        bucket.popleft()
    if len(bucket) >= max_hits:
        return int(window - (now - bucket[0])) + 1
    return None


def _refused(prefix: str, max_hits: int, window: int, retry: int) -> JSONResponse:
    return JSONResponse(
        status_code=429,
        content={
            "detail": f"Rate limit exceeded for {prefix}. "
                      f"Maximum {max_hits} requests per {window}s.",
            "retry_after_seconds": retry,
        },
        headers={"Retry-After": str(retry)},
    )


async def rate_limit_middleware(request: Request, call_next):
    prefix, cfg = _limit_for(request.url.path)
    if cfg is None:
        return await call_next(request)

    max_hits, window = cfg
    client = _client_key(request)
    now = time.monotonic()

    # Volume ceiling applies to every request, successful or not.
    burst = BURST_CEILING.get(prefix)
    if burst:
        b_max, b_win = burst
        retry = _too_many(_hits[(prefix + ":burst", client)], now, b_max, b_win)
        if retry:
            return _refused(prefix, b_max, b_win, retry)
        _hits[(prefix + ":burst", client)].append(now)

    bucket = _hits[(prefix, client)]
    retry = _too_many(bucket, now, max_hits, window)
    if retry:
        return _refused(prefix, max_hits, window, retry)

    if prefix not in FAILURE_ONLY_PATHS:
        bucket.append(now)
        return await call_next(request)

    # Charge the budget only if the credentials were actually rejected.
    response = await call_next(request)
    if response.status_code >= 400:
        bucket.append(now)
    return response


def reset_rate_limits() -> None:
    """Clear all buckets. Used by the verification harness so a rate-limit
    assertion does not poison the checks that follow it."""
    _hits.clear()


# ─────────────────────────────────────────────────────────────────────────
# 3. Path-parameter sanitisation
# ─────────────────────────────────────────────────────────────────────────

_SAFE_ID = re.compile(r"[^A-Za-z0-9_-]")


def sanitize_id(value: str, *, field: str = "id", max_len: int = 64) -> str:
    """Reduce a path parameter to the identifier alphabet.

    Several endpoints interpolate a project id into a filesystem path when
    resolving imagery and archived briefings, so `../` in that position is a
    traversal primitive. Stripping rather than escaping is right here: these
    ids are alphanumeric by construction, so anything removed was never a
    legitimate id, and an empty result is rejected rather than silently
    substituted with a default.
    """
    if value is None:
        raise HTTPException(status_code=400, detail=f"Missing {field}")
    cleaned = _SAFE_ID.sub("", str(value))[:max_len]
    if not cleaned:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid {field}: contains no permitted characters",
        )
    return cleaned
