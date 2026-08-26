import React, { useEffect, useState } from 'react';
import { ShieldCheck, LogIn, AlertTriangle, User, Lock, ChevronRight } from 'lucide-react';
import { login, fetchRoles, getSession, clearSession, subscribe } from './authClient';

export { clearSession };

/**
 * Sign-in gate for the decision-support console.
 *
 * SIH26103 specifies role-based access, and enforcement is server-side — this screen
 * is the way in, not the security boundary. Signing in as different roles visibly
 * changes what the console will serve, because the API refuses the request, not
 * because a button is hidden.
 *
 * The demo directory is listed on-screen deliberately: this is a prototype meant to be
 * driven by an evaluator who does not have credentials, and pretending otherwise would
 * just mean handing them out verbally. A deployment federates to the Ministry
 * directory and this panel disappears.
 */

const ROLE_ORDER = ['analyst', 'monitoring_officer', 'ministry_officer', 'administrator'];

const ROLE_TONE = {
  administrator: 'bg-rose-50 text-rose-800 border-rose-300',
  ministry_officer: 'bg-amber-50 text-amber-800 border-amber-300',
  monitoring_officer: 'bg-sky-50 text-sky-800 border-sky-300',
  analyst: 'bg-emerald-50 text-emerald-800 border-emerald-300',
};

const DEMO_PASSWORDS = {
  admin: 'prakalp-admin-2026',
  secretary: 'mospi-secretary-2026',
  'morth.officer': 'morth-officer-2026',
  monitor: 'monitor-2026',
  analyst: 'analyst-2026',
};

export function useSession() {
  const [session, setSession] = useState(getSession());
  useEffect(() => subscribe(setSession), []);
  return session;
}

export function SessionBar() {
  const session = useSession();
  if (!session) return null;
  const tone = ROLE_TONE[session.role] || ROLE_TONE.analyst;
  return (
    <div className="flex items-center justify-between gap-3 bg-white border border-gov-border rounded-xl px-4 py-2 shadow-soft">
      <div className="flex items-center gap-2 min-w-0">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
        <span className="text-xs font-bold text-gov-navy truncate">{session.username}</span>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${tone}`}>
          {String(session.role).replace(/_/g, ' ')}
        </span>
        {session.ministry && (
          <span className="text-[10px] text-gov-muted font-mono hidden sm:inline">
            scope: {session.ministry}
          </span>
        )}
        <span className="text-[10px] text-gov-muted hidden md:inline">
          · {session.permissions?.length || 0} permissions
        </span>
      </div>
      <button
        onClick={clearSession}
        className="text-[11px] font-bold text-gov-muted hover:text-rose-700 transition-colors shrink-0"
      >
        Sign out
      </button>
    </div>
  );
}

export default function LoginGate({ children }) {
  const session = useSession();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [roles, setRoles] = useState(null);

  useEffect(() => {
    if (!session) fetchRoles().then(setRoles).catch(() => setRoles(null));
  }, [session]);

  if (session) return children;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      await login(username.trim(), password);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const pick = (u) => {
    setUsername(u);
    setPassword(DEMO_PASSWORDS[u] || '');
    setError(null);
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Sign-in */}
        <div className="bg-white p-6 rounded-2xl border border-gov-border shadow-card">
          <div className="flex items-center gap-2 mb-1">
            <Lock className="w-4 h-4 text-gov-navy" />
            <h2 className="text-sm font-black text-gov-navy uppercase tracking-wider">
              Secure Sign-In
            </h2>
          </div>
          <p className="text-[11px] text-gov-muted mb-4">
            Access is enforced on the server. Your role determines which data the API will
            return — not which controls are visible.
          </p>

          <form onSubmit={submit} className="space-y-3">
            <label className="block">
              <span className="text-[10px] font-bold text-gov-muted uppercase tracking-wide">Username</span>
              <div className="mt-1 flex items-center gap-2 bg-gov-surface border border-gov-border rounded-lg px-2.5">
                <User className="w-3.5 h-3.5 text-gov-muted shrink-0" />
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  className="flex-1 bg-transparent py-2 text-xs font-mono text-gov-navy focus:outline-none"
                  placeholder="analyst"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-[10px] font-bold text-gov-muted uppercase tracking-wide">Password</span>
              <div className="mt-1 flex items-center gap-2 bg-gov-surface border border-gov-border rounded-lg px-2.5">
                <Lock className="w-3.5 h-3.5 text-gov-muted shrink-0" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="flex-1 bg-transparent py-2 text-xs font-mono text-gov-navy focus:outline-none"
                  placeholder="••••••••"
                />
              </div>
            </label>

            {error && (
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-[11px] text-rose-900">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={busy || !username || !password}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gov-navy text-gov-accent font-black text-xs uppercase tracking-wider hover:bg-gov-navy-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <LogIn className="w-4 h-4" />
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        {/* Role directory */}
        <div className="bg-white p-6 rounded-2xl border border-gov-border shadow-card">
          <h2 className="text-sm font-black text-gov-navy uppercase tracking-wider mb-1">
            Demonstration Roles
          </h2>
          <p className="text-[11px] text-gov-muted mb-3">
            Click a role to fill the form. Each sees genuinely different data — try
            <span className="font-mono"> analyst </span> then
            <span className="font-mono"> admin </span> on the same screen.
          </p>

          <div className="space-y-1.5">
            {(roles?.demo_users || []).slice().sort(
              (a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role)
            ).map((u) => (
              <button
                key={u.username}
                onClick={() => pick(u.username)}
                className="w-full text-left p-2.5 rounded-lg border border-gov-border hover:border-gov-accent hover:bg-gov-surface transition-colors group"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono font-bold text-gov-navy">{u.username}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-gov-muted group-hover:text-gov-accent-dark" />
                </div>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-black border ${ROLE_TONE[u.role] || ''}`}>
                    {String(u.role).replace(/_/g, ' ')}
                  </span>
                  <span className="text-[9px] text-gov-muted">
                    {roles?.roles?.[u.role]?.permissions?.length || 0} permissions
                    {u.ministry ? ` · scoped to ${u.ministry}` : ''}
                  </span>
                </div>
              </button>
            ))}
            {!roles && (
              <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                Could not reach the API to list roles. Start the backend on port 8000.
              </p>
            )}
          </div>

          <p className="text-[9px] text-gov-muted mt-3 leading-snug">
            Prototype identity layer: PBKDF2-hashed credentials, bearer sessions with
            expiry, append-only access log. A deployment would federate to the NIC /
            Ministry directory; the server-side enforcement points carry over unchanged.
          </p>
        </div>
      </div>
    </div>
  );
}
