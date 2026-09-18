/**
 * PRAKALP-DRISHTI — frontend auth client.
 *
 * Adding server-side RBAC broke three views (VittaVyuha /allocate, PragatiSaarthi
 * /briefing, ModelBenchmark /early-warning) because nothing in the frontend sent an
 * Authorization header. This module is the single place a token is stored and attached.
 *
 * Design notes:
 *  - One `apiFetch` wrapper, so no view hand-rolls headers and none can be forgotten.
 *  - A 401 clears the session and notifies listeners, so an expired token surfaces as
 *    a login prompt rather than an unexplained empty panel.
 *  - A 403 is NOT a session problem: the user is authenticated but lacks the
 *    permission. It is surfaced distinctly so the UI can say "your role cannot see
 *    this" instead of bouncing the user to a login screen that will not help.
 *  - sessionStorage, not localStorage: the token dies with the tab, which is the
 *    correct default for a government console on a shared machine.
 */

const API_BASE = '';
const TOKEN_KEY = 'prakalp:auth';

const listeners = new Set();

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify() {
  listeners.forEach((fn) => {
    try { fn(getSession()); } catch { /* a bad listener must not break auth */ }
  });
}

export function getSession() {
  try {
    const raw = sessionStorage.getItem(TOKEN_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  return !!getSession()?.token;
}

export function hasPermission(perm) {
  return !!getSession()?.permissions?.includes(perm);
}

export function clearSession() {
  sessionStorage.removeItem(TOKEN_KEY);
  notify();
}

export async function login(username, password) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Sign-in failed (${res.status})`);
  }
  const session = await res.json();
  sessionStorage.setItem(TOKEN_KEY, JSON.stringify({ ...session, username }));
  notify();
  return session;
}

export async function fetchRoles() {
  const res = await fetch(`${API_BASE}/api/auth/roles`);
  if (!res.ok) throw new Error('Could not load role directory');
  return res.json();
}

const DIRECT_BACKEND_URL = 'https://prakalp-api.onrender.com';
let _preferDirectBackend = false;

/**
 * Authenticated fetch with automatic resilience:
 * - Automatically retries on 502/503/504 gateway/proxy blips
 * - Automatically fails over to direct Render backend if Vercel proxy rewrite drops
 * - Returns { ok, status, data, forbidden, unauthorized, error }
 */
export async function apiFetch(path, options = {}, maxRetries = 2) {
  const session = getSession();
  const headers = { ...(options.headers || {}) };
  if (session?.token) headers.Authorization = `Bearer ${session.token}`;
  if (options.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';

  const isFullUrl = path.startsWith('http');
  const getCandidateUrl = (useDirect) => {
    if (isFullUrl) return path;
    if (useDirect || _preferDirectBackend) {
      return `${DIRECT_BACKEND_URL}${path}`;
    }
    return `${API_BASE}${path}`;
  };

  let lastStatus = 0;
  let lastData = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const targetUrl = getCandidateUrl(attempt > 0);
    try {
      const res = await fetch(targetUrl, { ...options, headers });
      lastStatus = res.status;

      // If Vercel proxy timed out or dropped with 502/503/504, fail over to direct Render!
      if ((res.status === 502 || res.status === 503 || res.status === 504) && attempt < maxRetries) {
        _preferDirectBackend = true;
        await new Promise((resolve) => setTimeout(resolve, 800 * (attempt + 1)));
        continue;
      }

      if (res.status === 401) {
        clearSession();
        return { ok: false, status: 401, data: null, unauthorized: true,
                 error: 'Your session has expired. Please sign in again.' };
      }
      if (res.status === 403) {
        const body = await res.json().catch(() => ({}));
        return { ok: false, status: 403, data: null, forbidden: true,
                 error: body.detail || 'Your role does not have access to this.' };
      }

      const data = await res.json().catch(() => null);
      lastData = data;
      if (res.ok) {
        if (attempt > 0) _preferDirectBackend = true;
        return { ok: true, status: res.status, data, error: null };
      }

      return {
        ok: false,
        status: res.status,
        data,
        error: data?.detail || `Request failed (${res.status})`
      };
    } catch (networkErr) {
      if (attempt < maxRetries) {
        _preferDirectBackend = true;
        await new Promise((resolve) => setTimeout(resolve, 800 * (attempt + 1)));
        continue;
      }
    }
  }

  return {
    ok: false,
    status: lastStatus,
    data: lastData,
    networkError: true,
    error: 'Cannot reach the API. Please ensure the backend server is running.'
  };
}

/**
 * Authenticated multipart upload. Same return shape as apiFetch.
 *
 * A separate function because apiFetch sets Content-Type: application/json whenever a
 * body is present. For FormData that is actively wrong — the browser must set the
 * header itself so it can append the multipart boundary, and forcing a JSON content
 * type produces a request the server cannot parse. Deleting the header afterwards does
 * not help either; it has to never be set.
 */
export async function apiUpload(path, formData) {
  const session = getSession();
  const headers = {};
  if (session?.token) headers.Authorization = `Bearer ${session.token}`;

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, { method: 'POST', headers, body: formData });
  } catch {
    return { ok: false, status: 0, data: null, networkError: true,
             error: 'Cannot reach the API. Please ensure the backend server is running.' };
  }

  if (res.status === 401) {
    clearSession();
    return { ok: false, status: 401, data: null, unauthorized: true,
             error: 'Your session has expired. Please sign in again.' };
  }

  const data = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, data,
           forbidden: res.status === 403,
           error: res.ok ? null : (data?.detail?.reason || data?.detail || `Upload failed (${res.status})`) };
}

export { API_BASE };


/* ════════════════════════════════════════════════════════════════════════
 * EO TIER RESOLUTION
 * ════════════════════════════════════════════════════════════════════════
 *
 * The satellite subsystem serves two tiers and the server decides which one a
 * caller gets from their token. These helpers let the UI render the matching
 * shape WITHOUT ever being the thing that grants access: if this function is
 * wrong, or is tampered with in a browser console, the user still receives
 * exactly what the server decided. Presentation only.
 */

export const EO_OFFICIAL_PERMISSION = 'read_risk';

export function getEoTier() {
  return hasPermission(EO_OFFICIAL_PERMISSION) ? 'official' : 'public';
}

export function isOfficialTier() {
  return getEoTier() === 'official';
}

/**
 * Fetch a binary resource with the session token attached.
 *
 * An <img src> cannot carry an Authorization header, which is why the official
 * layers and full-resolution tiles are fetched as blobs and handed to the DOM
 * as object URLs. The alternative — putting the token in a query string —
 * would write the credential into browser history, referrer headers and every
 * proxy log between here and the server.
 *
 * Returns { ok, status, objectUrl, error }. The caller MUST revoke the object
 * URL when it is finished, or a session spent browsing projects leaks a few
 * hundred kilobytes per tile.
 */
export async function fetchBlobUrl(path, options = {}) {
  const session = getSession();
  const headers = { ...(options.headers || {}) };
  if (session?.token) headers.Authorization = `Bearer ${session.token}`;

  let res;
  try {
    res = await fetch(path.startsWith('http') ? path : `${API_BASE}${path}`,
                      { ...options, headers });
  } catch {
    return { ok: false, status: 0, objectUrl: null, networkError: true,
             error: 'Cannot reach the API.' };
  }
  if (res.status === 401) {
    // Clear and notify, exactly as apiFetch does. Without this a dead session
    // leaves the UI showing an AUDITOR badge — read from cached sessionStorage
    // permissions — while every image request 401s behind it. The server is
    // right and the cached claim is stale, so the cache must yield. Restarting
    // the API invalidates every in-memory session and reproduces this in one
    // step.
    clearSession();
    return { ok: false, status: 401, objectUrl: null, unauthorized: true,
             error: 'Your session has expired. Showing the public view.' };
  }
  if (!res.ok) {
    return { ok: false, status: res.status, objectUrl: null,
             retryAfter: Number(res.headers.get('retry-after')) || null,
             error: res.status === 429
               ? 'Rate limit reached.'
               : `Imagery request failed (${res.status})` };
  }
  const blob = await res.blob();
  return { ok: true, status: res.status, objectUrl: URL.createObjectURL(blob),
           tier: res.headers.get('x-imagery-tier'),
           redacted: res.headers.get('x-imagery-redacted') === 'true',
           redactionLevel: res.headers.get('x-imagery-redaction-level'),
           error: null };
}

/**
 * apiFetch with exponential backoff on 429 only.
 *
 * Deliberately narrow. Retrying a 500 can duplicate a side effect and retrying
 * a 403 will never succeed, so only the throttle response is retried — that is
 * the one case where waiting is genuinely the correct remedy. Backoff is
 * 500ms, 1s, 2s with jitter; the jitter matters because several panels mount
 * together and un-jittered clients would retry in lockstep and re-trip the
 * same limit they are backing off from.
 *
 * `Retry-After` from the server wins over the local schedule when present.
 */
export async function apiFetchRetry(path, options = {}, maxRetries = 3) {
  let attempt = 0;
  for (;;) {
    const result = await apiFetch(path, options);
    if (result.status !== 429 || attempt >= maxRetries) {
      if (result.status === 429) {
        result.throttled = true;
        result.error = 'Request quota reached. Please wait a moment and retry.';
      }
      return result;
    }
    const serverWait = Number(result.data?.retry_after) * 1000;
    const backoff = 500 * Math.pow(2, attempt);
    const jitter = Math.random() * 250;
    await new Promise((r) => setTimeout(r, (serverWait || backoff) + jitter));
    attempt += 1;
  }
}
