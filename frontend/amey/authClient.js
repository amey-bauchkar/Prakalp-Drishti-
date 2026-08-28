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

/**
 * Authenticated fetch. Returns { ok, status, data, forbidden, unauthorized }.
 * Never throws on an HTTP error — callers render the state instead of crashing,
 * which is what turned a 403 into a blank panel previously.
 */
export async function apiFetch(path, options = {}) {
  const session = getSession();
  const headers = { ...(options.headers || {}) };
  if (session?.token) headers.Authorization = `Bearer ${session.token}`;
  if (options.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';

  let res;
  try {
    res = await fetch(path.startsWith('http') ? path : `${API_BASE}${path}`, { ...options, headers });
  } catch (networkError) {
    return { ok: false, status: 0, data: null, networkError: true,
             error: 'Cannot reach the API. Please ensure the backend server is running.' };
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
  return { ok: res.ok, status: res.status, data,
           error: res.ok ? null : (data?.detail || `Request failed (${res.status})`) };
}

export { API_BASE };
