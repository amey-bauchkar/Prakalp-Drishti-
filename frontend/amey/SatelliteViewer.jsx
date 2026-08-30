import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle, Crosshair, Download, Eye, EyeOff, FileText, Fingerprint,
  Loader2, Lock, Maximize2, Move, Satellite, ShieldCheck, Clock, Layers,
  MapPin, Ruler, Route, Building2, ScanLine,
} from 'lucide-react';
import { Circle, MapContainer, Marker, Tooltip } from 'react-leaflet';
import BaseMapLayer from '../src/components/BaseMapLayer';
import {
  apiFetchRetry, fetchBlobUrl, getEoTier, getSession, subscribe,
} from './authClient';

/**
 * PRAKALP-DRISHTI — persona-adaptive satellite viewer.
 *
 * ────────────────────────────────────────────────────────────────────────
 * WHY THIS COMPONENT DOES NOT DECIDE ANYTHING
 * ────────────────────────────────────────────────────────────────────────
 *
 * It renders two very different screens, and it is important to be precise
 * about what that means: the SERVER decides the tier from the caller's token
 * and returns 512 px redacted WebP or full-resolution JPEG accordingly. This
 * component reads which one it got and lays out the matching controls.
 *
 * If `getEoTier()` were wrong — or edited in a browser console — the official
 * panel would render and every request behind it would still come back at the
 * public tier, because /api/eo resolves the tier from the Authorization header
 * and there is no query parameter that overrides it. Hiding a control is
 * presentation. Authorisation lives on the server, and is tested there.
 *
 * ────────────────────────────────────────────────────────────────────────
 * WHY THE OFFICIAL TILE IS FETCHED AS A BLOB
 * ────────────────────────────────────────────────────────────────────────
 *
 * <img src> cannot send an Authorization header. Two ways out: put the token
 * in the query string, or fetch the bytes with the header and hand the DOM an
 * object URL. The first writes a live credential into browser history, the
 * Referer header and every proxy log on the path, so this uses the second.
 * Object URLs are revoked on unmount and on every project change; without that
 * a session spent clicking through projects leaks a few hundred kB per tile.
 */

const API = '';
const SENSITIVE_HINT = ['Oil & Gas', 'Aviation', 'Electricity Generation',
  'Energy Storage', 'Telecommunication', 'Shipping'];

// The three framings, and what each one is allowed to assert.
//
// The mode comes from /api/eo/viewport, which derives it from GEOCODE
// PROVENANCE rather than from sector. Across the corpus: 285 compound, 1,326
// corridor, 596 locator_only. The last of those is the important one — a state
// or national centroid locates an administrative unit, not a project, so no
// imagery is served for it at any zoom and no change score is computed.
const RENDER_MODE = {
  compound: {
    icon: Building2,
    label: 'Compound Plot',
    blurb: 'Tight framing on a discrete facility, with a dual-epoch swipe comparison.',
    chip: 'bg-emerald-50 text-emerald-900 border-emerald-300',
  },
  corridor: {
    icon: Route,
    label: 'Linear Corridor',
    blurb: 'Alignment strip. One frame covers a fraction of the route; chainage packages index the rest.',
    chip: 'bg-sky-50 text-sky-900 border-sky-300',
  },
  locator_only: {
    icon: MapPin,
    label: 'Administrative Locator',
    blurb: 'No site coordinate on record. Imagery withheld; district locator shown instead.',
    chip: 'bg-amber-50 text-amber-900 border-amber-400',
  },
};

const OFFICIAL_LAYERS = [
  { id: 'change', label: 'Structural Change',
    note: 'SSIM structural-change field after co-registration and radiometric normalisation, inside the surveyed corridor.' },
  { id: 'sam', label: 'Spectral Angle Δ',
    note: 'Angle between epochs in RGB space. Invariant to illumination scaling by construction — a pixel that merely got brighter reads near zero; a pixel whose material changed rotates.' },
  { id: 'builtup', label: 'Built-up Likelihood',
    note: 'RBL: a visible-band composite. NOT NDBI — that needs SWIR, which this sensor does not carry.' },
  { id: 'corridor', label: 'RoW Corridor',
    note: 'The statutory Right-of-Way buffer actually used for the measurement.' },
  { id: 'materials', label: 'Material Classes',
    note: 'Rule-based material assignment after epoch calibration. Declared thresholds, not a trained classifier.' },
];

function useTier() {
  const [tier, setTier] = useState(getEoTier);
  useEffect(() => subscribe(() => setTier(getEoTier())), []);
  return tier;
}

function Skeleton({ label }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800 animate-pulse">
      <Satellite className="w-6 h-6 text-gov-muted mb-2" />
      <span className="text-[10px] font-bold text-gov-muted uppercase tracking-wider">{label}</span>
    </div>
  );
}

function Toast({ message, tone = 'warn', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 6000);
    return () => clearTimeout(t);
  }, [onClose]);
  const cls = tone === 'error'
    ? 'bg-rose-600 text-white'
    : tone === 'ok' ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white';
  return (
    <div role="status" aria-live="polite"
         className={`fixed bottom-4 right-4 z-50 px-3 py-2 rounded-sm shadow-lg text-[11px] font-bold max-w-xs ${cls}`}>
      {message}
    </div>
  );
}

export default function SatelliteViewer({ projectId = '619092' }) {
  // Two sources of truth, and only one of them counts.
  //
  // `localTier` is what the cached session claims and is used ONLY to decide
  // which requests to make before any response has arrived. `meta.tier` is what
  // the server actually decided, and it wins the moment it exists.
  //
  // They can disagree, and the disagreement is not hypothetical: /api/eo/metadata
  // and /api/eo/tile are anonymous-capable, so a STALE token gets a clean 200 at
  // the public tier rather than a 401. Nothing 401s until the user clicks a
  // forensic layer. Rendering from the cache alone therefore left the header
  // reading AUDITOR TIER over public-tier imagery for the whole session — the UI
  // asserting an authority the server had already declined to grant.
  const localTier = useTier();

  const [meta, setMeta] = useState(null);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const [beforeUrl, setBeforeUrl] = useState(null);
  const [afterUrl, setAfterUrl] = useState(null);
  const [tilesLoading, setTilesLoading] = useState(true);
  // Why a distinct tile-failure state rather than reusing `error`: `error` is
  // for metadata, and it replaces the whole panel. A tile failure must leave
  // the plan, the badges and the verdict on screen -- they came from a
  // different request that succeeded -- and say only that the pixels are
  // missing.
  const [tileError, setTileError] = useState(null);

  const [pos, setPos] = useState(50);
  const [dragging, setDragging] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [activeLayer, setActiveLayer] = useState(null);
  const [layerUrl, setLayerUrl] = useState(null);
  const [layerBusy, setLayerBusy] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const [now, setNow] = useState(() => Date.now());

  // Low-density overlays, defaulted from the Network Information API where the
  // browser exposes it and from Save-Data where the user has asked for it.
  // Chosen automatically rather than buried in a settings panel: the people
  // this matters most for are the least likely to go looking for a toggle. It
  // stays user-overridable because the detection is a hint, not a measurement,
  // and an auditor on a good link who lands on 'low' must be able to say so.
  const [lowDensity, setLowDensity] = useState(() => {
    try {
      const c = navigator.connection || {};
      return !!c.saveData || ['slow-2g', '2g', '3g'].includes(c.effectiveType);
    } catch {
      return false;
    }
  });

  const frameRef = useRef(null);
  const objectUrls = useRef([]);

  const tier = meta?.tier || localTier;
  const isOfficial = tier === 'official';

  // Fail closed on the mode. If the plan did not load we do NOT fall back to
  // the swipe comparator: 596 projects must never receive one, and defaulting
  // to the richest view would hand exactly those projects an imagery panel
  // over ground that was never located.
  const mode = plan?.render_mode || (plan === null && !loading ? 'locator_only' : null);
  const isCompound = mode === 'compound';
  const isCorridor = mode === 'corridor';
  const isLocatorOnly = mode === 'locator_only';
  const modeMeta = RENDER_MODE[mode] || RENDER_MODE.locator_only;

  // Resolution badge, driven by the MEASURED GSD rather than by the mode.
  //
  // A fixed "Sub-metre GSD" badge on compound view would be false on 285 of
  // 285 compound projects: the tightest is 1.18 m/px and most sit at 2-9 m/px,
  // because zoom is capped so the frame contains the geocode error radius. The
  // badge therefore states the number it measured, and only claims sub-metre
  // when the number is actually below 1 m/px.
  const gsd = plan?.gsd_m_per_px ?? meta?.resolution_m_per_px ?? null;
  const isSubMetre = typeof gsd === 'number' && gsd > 0 && gsd < 1.0;

  const track = (u) => { if (u) objectUrls.current.push(u); return u; };
  const revokeAll = useCallback(() => {
    objectUrls.current.forEach((u) => { try { URL.revokeObjectURL(u); } catch { /* already gone */ } });
    objectUrls.current = [];
  }, []);

  // ── metadata ─────────────────────────────────────────────────────────
  useEffect(() => {
    let dead = false;
    setLoading(true); setError(null);
    // Both in one round trip. The plan decides the SHAPE of this component and
    // the metadata fills it in, so rendering before the plan arrives would
    // briefly show a swipe comparator for a project that must never have one.
    Promise.all([
      apiFetchRetry(`${API}/api/eo/metadata/${projectId}`),
      apiFetchRetry(`${API}/api/eo/viewport/${projectId}`),
    ]).then(([r, v]) => {
      if (dead) return;
      setPlan(v.ok ? v.data : null);
      if (r.throttled) setToast({ tone: 'warn', message: r.error });
      if (!r.ok) { setError(r.error); setMeta(null); }
      else {
        setMeta(r.data);
        // The cache said official and the server said public: the credential
        // is gone or was never sufficient. Say so plainly instead of quietly
        // rendering a different screen than the user expects.
        if (localTier === 'official' && r.data?.tier === 'public') {
          setToast({ tone: 'warn',
            message: 'Session no longer holds auditor access — showing the public view.' });
        }
      }
      setLoading(false);
    });
    return () => { dead = true; };
  }, [projectId, localTier]);

  // ── tiles ────────────────────────────────────────────────────────────
  //
  // IMPORTANT: blob URL revocation is DEFERRED until new URLs are ready.
  // The previous implementation called revokeAll() at the TOP of this effect,
  // which killed still-rendering <img> elements from the previous cycle —
  // their onError fired with "tile was dropped before it could be drawn".
  //
  // Now: old URLs are collected, new ones fetched, state is set, and only
  // THEN are the old URLs revoked. This eliminates the race window.
  useEffect(() => {
    let dead = false;
    // Snapshot the URLs we are about to replace — revoke AFTER new ones land.
    const staleUrls = [...objectUrls.current];
    setActiveLayer(null); setLayerUrl(null); setTileError(null);

    // No imagery request at all for a locator-only project. Not fetched and
    // discarded — never requested, so there is no tile in the cache, no entry
    // in the access log, and nothing for a later change to accidentally render.
    if (mode === null || isLocatorOnly) {
      setBeforeUrl(null); setAfterUrl(null); setTilesLoading(false);
      // Safe to revoke now — no new images to race against.
      staleUrls.forEach((u) => { try { URL.revokeObjectURL(u); } catch { /* already gone */ } });
      objectUrls.current = [];
      return undefined;
    }
    setTilesLoading(true);

    Promise.all([
      fetchBlobUrl(`${API}/api/eo/tile/${projectId}/BEFORE`),
      fetchBlobUrl(`${API}/api/eo/tile/${projectId}/AFTER`),
    ]).then(([b, a]) => {
      if (dead) { [b, a].forEach((r) => r.objectUrl && URL.revokeObjectURL(r.objectUrl)); return; }

      const bad = [b, a].find((r) => !r.ok);
      if (bad) {
        setBeforeUrl(null); setAfterUrl(null); setTilesLoading(false);
        setTileError({
          status: bad.status,
          message: bad.networkError
            ? 'Cannot reach the imagery service. It may be offline.'
            : bad.status === 429
              ? 'Imagery quota reached — this endpoint allows 120 requests a minute. Retry shortly.'
              : bad.status === 401
                ? 'Session expired. Sign in again to load auditor-tier imagery.'
                : bad.status === 404
                  ? 'No baseline or current tile is on file for this project.'
                  : bad.error || `Imagery request failed (${bad.status}).`,
        });
        // Revoke stale URLs now that we have set state.
        staleUrls.forEach((u) => { try { URL.revokeObjectURL(u); } catch { /* */ } });
        objectUrls.current = [];
        return;
      }

      setTileError(null);
      // Set new URLs in state FIRST, then revoke old ones.
      objectUrls.current = [];
      setBeforeUrl(track(b.objectUrl));
      setAfterUrl(track(a.objectUrl));
      setTilesLoading(false);

      // Now revoke the previous URLs — the <img> elements already point to the new ones.
      staleUrls.forEach((u) => { try { URL.revokeObjectURL(u); } catch { /* already gone */ } });
    }).catch((e) => {
      if (dead) return;
      setTilesLoading(false);
      setTileError({ status: 0, message: `Imagery could not be loaded: ${e?.message || e}` });
      staleUrls.forEach((u) => { try { URL.revokeObjectURL(u); } catch { /* */ } });
      objectUrls.current = [];
    });
    return () => { dead = true; };
  }, [projectId, localTier, mode, isLocatorOnly]);

  // Final cleanup on unmount only — revoke whatever is left.
  useEffect(() => {
    return () => {
      objectUrls.current.forEach((u) => { try { URL.revokeObjectURL(u); } catch { /* */ } });
      objectUrls.current = [];
    };
  }, []);

  // Signed-link countdown. Ticks only while an official session actually holds
  // a link, so a public viewer is not running a timer for nothing.
  const signed = meta?.signed_download;
  useEffect(() => {
    if (!signed?.expires_at) return undefined;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [signed?.expires_at]);

  const secondsLeft = signed?.expires_at
    ? Math.max(0, Math.floor(signed.expires_at - now / 1000)) : null;

  // ── layer selection ──────────────────────────────────────────────────
  //
  // The click handler only records WHICH layer is wanted; an effect below does
  // the fetching. Doing it the other way round -- fetching inside the handler
  // -- meant the request closed over whatever `lowDensity` was at click time,
  // so toggling low-bandwidth and selecting a layer in the same tick sent
  // density=standard while the button already read ON. Deriving the request
  // from state instead of from a closure removes that whole class of bug, and
  // it gives the density toggle its correct behaviour for free: flipping it
  // re-fetches the layer already on screen rather than clearing it and making
  // the user find it again.
  const selectLayer = useCallback((id) => {
    setActiveLayer((cur) => (cur === id ? null : id));
  }, []);

  useEffect(() => {
    // Change scoring is disabled outside compound framing. On a corridor the
    // frame is a fraction of the route, and on a locator there is no site — a
    // change percentage computed over either would be an audit verdict about
    // ground the platform cannot claim is the project.
    if (!activeLayer || !isOfficial || !isCompound) { setLayerUrl(null); return undefined; }
    let dead = false;
    setLayerBusy(true);
    const density = lowDensity ? 'low' : 'standard';
    fetchBlobUrl(
      `${API}/api/amey/satellite/${projectId}/layer/${activeLayer}?density=${density}`
    ).then((r) => {
      if (dead) { if (r.objectUrl) URL.revokeObjectURL(r.objectUrl); return; }
      setLayerBusy(false);
      if (!r.ok) {
        setActiveLayer(null);
        // A 401 has already cleared the session inside fetchBlobUrl, which
        // notifies subscribers and flips this component to the public view on
        // the next render. The toast explains the transition rather than
        // leaving the reader wondering why the panel changed shape.
        setToast({
          tone: r.status === 403 ? 'error' : 'warn',
          message: r.status === 429
            ? 'Layer rendering quota reached — each layer costs ~300 ms of CPU. Retry shortly.'
            : r.status === 403
              ? 'Analytical layers require an auditor credential.'
              : r.status === 401
                ? 'Session expired — reverted to the public view. Sign in again for forensic layers.'
                : r.error,
        });
        return;
      }
      setLayerUrl(track(r.objectUrl));
    });
    return () => { dead = true; };
  }, [activeLayer, lowDensity, projectId, isOfficial, isCompound]);

  // ── swipe ────────────────────────────────────────────────────────────
  const updateFromClientX = useCallback((clientX) => {
    const el = frameRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPos(Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)));
  }, []);
  const onPointerDown = (e) => {
    setDragging(true);
    try { e.currentTarget.setPointerCapture?.(e.pointerId); } catch { /* unavailable */ }
    updateFromClientX(e.clientX);
  };
  const onPointerMove = (e) => { if (dragging) updateFromClientX(e.clientX); };
  const onPointerUp = (e) => {
    setDragging(false);
    try { e.currentTarget.releasePointerCapture?.(e.pointerId); } catch { /* nothing held */ }
  };
  const onKeyDown = (e) => {
    if (e.key === 'ArrowLeft') { setPos((p) => Math.max(0, p - 2)); e.preventDefault(); }
    if (e.key === 'ArrowRight') { setPos((p) => Math.min(100, p + 2)); e.preventDefault(); }
    if (e.key === 'Home') { setPos(0); e.preventDefault(); }
    if (e.key === 'End') { setPos(100); e.preventDefault(); }
  };

  const stale = meta?.staleness;
  const redaction = meta?.redaction;
  const sensitiveGuess = SENSITIVE_HINT.some((x) => String(meta?.sector || '').includes(x));

  const exportPacket = useCallback(() => {
    const w = window.open('', '_blank');
    if (!w) { setToast({ tone: 'error', message: 'Pop-up blocked — allow pop-ups to export.' }); return; }
    const p = meta?.provenance || {};
    const esc = (v) => String(v ?? '—').replace(/[<>&]/g, (c) => (
      { '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
    w.document.write(`<!doctype html><meta charset="utf-8">
<title>EO Audit Packet — ${esc(meta?.project_id)}</title>
<style>
 body{font:12px/1.55 "Segoe UI",system-ui,sans-serif;margin:36px;color:#14213d}
 h1{font-size:16px;margin:0 0 2px} h2{font-size:11px;text-transform:uppercase;
   letter-spacing:.08em;margin:22px 0 6px;border-bottom:1px solid #cbd5e1;padding-bottom:3px}
 table{border-collapse:collapse;width:100%} td{padding:3px 6px;vertical-align:top;
   border-bottom:1px solid #eef2f7} td:first-child{width:230px;color:#64748b}
 code{font:11px ui-monospace,Consolas,monospace;word-break:break-all}
 .warn{background:#fff7ed;border-left:3px solid #f59e0b;padding:8px 10px;margin:10px 0}
 @media print{body{margin:14mm}}
</style>
<h1>Earth-Observation Audit Packet</h1>
<div style="color:#64748b">${esc(meta?.project_name)} &middot; #${esc(meta?.project_id)}
 &middot; generated ${new Date().toISOString()}</div>

<h2>Sensor</h2><table>
<tr><td>Ground sample distance</td><td>${esc(meta?.resolution_m_per_px)} m/px (measured)</td></tr>
<tr><td>Basis</td><td>${esc(meta?.resolution_basis)}</td></tr>
<tr><td>Epochs compared</td><td>${esc(meta?.epoch_before)} &rarr; ${esc(meta?.epoch_after)}</td></tr>
</table>

<h2>Imagery currency</h2>
<div class="warn"><strong>${esc(stale?.headline)}</strong><br>${esc(stale?.detail)}</div>

<h2>Cryptographic provenance</h2><table>
<tr><td>BEFORE SHA-256</td><td><code>${esc(p.before_sha256)}</code></td></tr>
<tr><td>AFTER SHA-256</td><td><code>${esc(p.after_sha256)}</code></td></tr>
<tr><td>Pair digest</td><td><code>${esc(p.pair_digest)}</code></td></tr>
<tr><td>Algorithm</td><td>${esc(p.algorithm)}</td></tr>
<tr><td>Attests</td><td>${esc(p.attests)}</td></tr>
<tr><td><strong>Does NOT attest</strong></td><td><strong>${esc(p.does_not_attest)}</strong></td></tr>
</table>

<h2>Geolocation trust</h2><table>
<tr><td>Latitude / longitude</td><td>${esc(meta?.latitude)}, ${esc(meta?.longitude)}</td></tr>
<tr><td>Sector / state</td><td>${esc(meta?.sector)} &middot; ${esc(meta?.state)}</td></tr>
<tr><td>Access tier</td><td>${esc(meta?.tier)} (${esc(meta?.tier_basis)})</td></tr>
</table>

<div class="warn" style="margin-top:24px">This packet records what the imagery
shows and how it was verified. It is not, on its own, a finding of
non-performance — see the imagery-currency note above.</div>
<script>window.onload=()=>window.print()</script>`);
    w.document.close();
  }, [meta, stale]);

  // ── render ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="panel p-8 text-center">
        <Loader2 className="w-6 h-6 text-gov-accent animate-spin mx-auto mb-2" />
        <p className="text-[11px] font-bold text-gov-navy">Loading imagery record…</p>
      </div>
    );
  }
  if (error || !meta) {
    return (
      <div className="note note-warn flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
        <span><strong>Imagery unavailable.</strong> {error || 'No record returned.'}</span>
      </div>
    );
  }

  return (
    <div className="panel overflow-hidden">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="p-4 border-b border-gov-border flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Satellite className="w-4 h-4 text-gov-navy" />
          <div>
            <h3 className="text-xs font-black text-gov-navy uppercase tracking-wider">
              {isOfficial ? 'Forensic Ground-Truth Audit' : 'Project Imagery — Public View'}
            </h3>
            <span className="text-[10px] text-gov-muted">
              {meta.epoch_before} → {meta.epoch_after}
              {meta.resolution_m_per_px ? ` · ${meta.resolution_m_per_px} m/px` : ''}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Framing mode. Stated on the surface because it changes what the
              panel below is able to claim, not merely how it looks. */}
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[10px] font-black border font-heading tracking-wide ${modeMeta.chip}`}
                title={modeMeta.blurb}>
            <modeMeta.icon className="w-3 h-3" aria-hidden="true" />
            {modeMeta.label.toUpperCase()}
          </span>

          {/* Resolution, measured. Reads sub-metre only when it is. */}
          {gsd != null && !isLocatorOnly && (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[10px] font-black border font-heading tracking-wide ${
              isSubMetre ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                         : 'bg-gov-surface text-gov-navy border-gov-border'}`}
                  title={isSubMetre
                    ? `Ground sample distance ${gsd} m/px — below one metre, so individual structural elements are resolvable.`
                    : `Ground sample distance ${gsd} m/px. Not sub-metre: zoom is capped so the frame contains this project's ${plan?.geocode_error_radius_m ?? '—'} m geocode error radius. A tighter frame could exclude the site.`}>
              <Ruler className="w-3 h-3" aria-hidden="true" />
              {isSubMetre
                ? `SUB-METRE GSD · ${gsd} m/px`
                : `GSD ${gsd} m/px`}
            </span>
          )}

          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[10px] font-black border font-heading tracking-wide ${
            isOfficial ? 'bg-gov-navy text-white border-gov-navy'
                       : 'bg-sky-50 text-sky-900 border-sky-300'}`}>
            {isOfficial ? <ShieldCheck className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            {isOfficial ? 'AUDITOR TIER' : 'NAGRIK / PUBLIC TIER'}
          </span>
        </div>
      </div>

      {/* Staleness — shown to BOTH personas. A citizen reading a progress claim
          and an auditor building a case are equally misled by a 44-month blind
          window, so this is not an expert-only disclosure. */}
      {stale?.is_stale && (
        <div className="note note-warn mx-4 mt-4 flex items-start gap-2">
          <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-[11px] leading-snug">
            <strong className="block mb-0.5">
              Imagery as of {stale.latest_imagery_epoch}. A zero-change finding is
              not evidence of non-performance.
            </strong>
            {stale.headline} Work completed in the{' '}
            {stale.blind_window_months}-month window since the last pass is invisible
            here and would look identical to no work at all.
          </div>
        </div>
      )}

      {/* Redaction notice — public tier only */}
      {!isOfficial && (redaction?.applied || sensitiveGuess) && (
        <div className="note note-info mx-4 mt-3 flex items-start gap-2">
          <Lock className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="text-[11px] leading-snug">
            <strong className="block mb-0.5">Imagery coarsened for national-security compliance.</strong>
            {(redaction?.reasons || []).join(' ')} Location is published to about
            1.1 km and the imagery is blurred. <strong>Progress figures below are
            not reduced</strong> — they are identical to those an auditor sees.
          </div>
        </div>
      )}

      {/* ── LOCATOR ONLY ──────────────────────────────────────────────────
          596 of 2,207 projects. The recorded coordinate is a state or national
          centroid: it locates an administrative unit, not the works. Rendering
          satellite imagery on it would show unrelated ground and — because the
          imagery is genuine and well-registered — would look exactly as
          authoritative as a real site view. So none is requested, and change
          scoring is off. */}
      {isLocatorOnly && (
        <div className="p-4">
          <div className="note note-warn flex items-start gap-2 mb-3" role="status">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="text-[11px] leading-snug">
              <strong className="block mb-0.5 font-heading tracking-wide">
                ADMINISTRATIVE CENTROID · SURVEYED SITE PLOT AWAITED
              </strong>
              {plan?.caveat || ('This project has no site-level coordinate on record. '
                + 'Satellite verification is withheld rather than performed against '
                + 'an administrative centroid.')}
            </div>
          </div>

          {plan?.centre?.[0] != null && plan?.centre?.[1] != null ? (
            <div className="rounded-xl overflow-hidden border border-gov-border">
              <MapContainer
                center={[plan.centre[0], plan.centre[1]]}
                zoom={7}
                scrollWheelZoom={false}
                style={{ height: 340, width: '100%' }}
                aria-label="Administrative locator map showing the recorded centroid and its uncertainty"
              >
                <BaseMapLayer />
                {/* The uncertainty circle is the point of this map. It is drawn
                    to the SAME radius the planner used to refuse imagery, so a
                    reviewer sees the scale of what is unknown rather than a
                    pin implying precision. */}
                <Circle
                  center={[plan.centre[0], plan.centre[1]]}
                  radius={plan.geocode_error_radius_m || 100000}
                  pathOptions={{ color: '#B45309', fillColor: '#F59E0B',
                                 fillOpacity: 0.10, weight: 1.5, dashArray: '4 4' }}
                />
                <Marker position={[plan.centre[0], plan.centre[1]]}>
                  <Tooltip permanent direction="top" offset={[0, -8]}>
                    <span className="font-sans text-[10px]">
                      Recorded centroid — not the site
                    </span>
                  </Tooltip>
                </Marker>
              </MapContainer>
              <div className="px-3 py-2 bg-gov-surface border-t border-gov-border">
                <p className="text-[10px] text-gov-muted leading-snug font-sans">
                  The shaded circle is the estimated uncertainty of this coordinate
                  (<span className="font-num font-bold">
                    {Number(plan.geocode_error_radius_m || 0).toLocaleString('en-IN')} m
                  </span> radius, provenance{' '}
                  <span className="font-num">{plan.geocode_precision || 'unknown'}</span>).
                  The works lie somewhere within it. Site verification requires a
                  surveyed coordinate or a physical inspection.
                </p>
              </div>
            </div>
          ) : (
            <div className="note note-warn text-[11px]">
              No coordinate of any kind is recorded for this project, so even an
              administrative locator cannot be drawn.
            </div>
          )}

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-px bg-gov-border border border-gov-border rounded-sm overflow-hidden">
            {[
              ['Geocode provenance', plan?.geocode_precision || '—'],
              ['Uncertainty radius', plan?.geocode_error_radius_m != null
                ? `${Number(plan.geocode_error_radius_m).toLocaleString('en-IN')} m` : '—'],
              ['Change scoring', 'Disabled'],
            ].map(([k, v]) => (
              <div key={k} className="bg-white p-3">
                <span className="text-[9px] font-bold text-gov-muted uppercase tracking-wide block font-heading">{k}</span>
                <span className="text-[12px] font-black text-gov-navy font-num">{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comparator */}
      {!isLocatorOnly && (
      <div className="p-4">
        <div
          ref={frameRef}
          role="slider"
          tabIndex={0}
          aria-label="Reveal current imagery over the baseline"
          aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pos)}
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown} onPointerMove={onPointerMove}
          onPointerUp={onPointerUp} onPointerCancel={onPointerUp}
          className={`relative w-full aspect-square mx-auto rounded-xl overflow-hidden border border-gov-border bg-slate-950 select-none cursor-ew-resize touch-none focus:outline-none focus:ring-2 focus:ring-gov-accent ${
            fullscreen ? 'fixed inset-4 z-40 max-h-none aspect-auto' : 'max-h-[560px]'}`}
          style={fullscreen ? {} : { maxWidth: 560 }}
        >
          {tilesLoading && <Skeleton label="Streaming imagery" />}

          {tileError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center bg-slate-950">
              <AlertTriangle className="w-7 h-7 text-amber-400" aria-hidden="true" />
              <p className="font-heading text-sm font-bold text-white">
                Imagery unavailable
              </p>
              <p className="font-sans text-xs leading-relaxed text-slate-300 max-w-xs">
                {tileError.message}
              </p>
              <p className="font-sans text-[10px] text-slate-500">
                The measurements above come from a separate request and are unaffected.
              </p>
            </div>
          )}

          {/* onError guards: only report a tile error if the <img> src STILL
              matches the current state URL. If a stale blob URL from a previous
              render cycle was revoked, the onError fires for that dead URL —
              but the current state already holds a new, valid URL. Ignoring the
              stale error prevents false "Imagery unavailable" panels. */}
          {beforeUrl && !tileError && (
            <img src={beforeUrl} alt={`Baseline ${meta.epoch_before} imagery`}
                 className="absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-300"
                 draggable={false}
                 onError={(e) => {
                   if (e.target.src !== beforeUrl) return;
                   setTileError({
                     status: 0,
                     message: 'The baseline tile could not be rendered. Reselect the project to refetch it.',
                   });
                 }} />
          )}
          {afterUrl && !tileError && (
            <img src={afterUrl} alt={`Current ${meta.epoch_after} imagery`}
                 className="absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-300"
                 draggable={false} style={{ clipPath: `inset(0 0 0 ${pos}%)` }}
                 onError={(e) => {
                   if (e.target.src !== afterUrl) return;
                   setTileError({
                     status: 0,
                     message: 'The current tile could not be rendered. Reselect the project to refetch it.',
                   });
                 }} />
          )}
          {isOfficial && showOverlay && layerUrl && (
            <img src={layerUrl} alt={`${activeLayer} analytical overlay`}
                 className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                 draggable={false} />
          )}
          {layerBusy && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-black/70 text-white text-[10px] font-bold inline-flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin" /> rendering layer…
            </div>
          )}

          <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/75 text-sky-300 text-[10px] font-bold border border-sky-400/30 pointer-events-none">
            T0 · {meta.epoch_before}
          </span>
          <span className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/75 text-emerald-300 text-[10px] font-bold border border-emerald-400/30 pointer-events-none">
            T1 · {meta.epoch_after}
          </span>

          <div className="absolute top-0 bottom-0 pointer-events-none" style={{ left: `${pos}%` }}>
            <div className="absolute top-0 bottom-0 -translate-x-1/2 w-0.5 bg-white/90 shadow-[0_0_8px_rgba(0,0,0,0.6)]" />
            <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white shadow-lg border-2 border-gov-navy flex items-center justify-center">
              <Move className="w-4 h-4 text-gov-navy" />
            </div>
          </div>

          <button type="button" onClick={() => setFullscreen((v) => !v)}
                  aria-label={fullscreen ? 'Exit full screen' : 'Full screen'}
                  className="absolute bottom-2 right-2 p-1.5 rounded bg-black/70 text-white hover:bg-black/90">
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <p className="text-[10px] text-gov-muted text-center mt-2">
          Drag the handle — or focus the frame and use ← / → — to sweep between epochs.
        </p>

        {/* ── CORRIDOR: chainage packages ───────────────────────────────
            The frame above is one strip of a route that runs for tens of
            kilometres. Saying which fraction is visible, and enumerating the
            packages that index the rest, stops the strip being read as the
            whole project. Package centres are deliberately absent: PAIMANA
            carries a point and a bbox but never an alignment polyline, so a
            per-package location would have to be invented. */}
        {isCorridor && (
          <div className="mt-3 border-t border-gov-border pt-3">
            <div className="flex items-center gap-2 mb-2">
              <Route className="w-3.5 h-3.5 text-gov-navy" aria-hidden="true" />
              <h4 className="text-[10px] font-black text-gov-navy uppercase tracking-wider font-heading">
                Chainage packages
              </h4>
              {plan?.frame_covers_m != null && (
                <span className="text-[9.5px] text-gov-muted font-sans">
                  this frame covers{' '}
                  <span className="font-num font-bold">
                    {(plan.frame_covers_m / 1000).toFixed(2)} km
                  </span>{' '}of alignment
                </span>
              )}
            </div>

            {plan?.packages?.length ? (
              <>
                <div className="flex flex-wrap gap-1.5" role="list">
                  {plan.packages.map((pk) => (
                    <span
                      key={pk.package}
                      role="listitem"
                      title={`${pk.label}. No imagery is fetched for this package: ${pk.requires} is required to position it.`}
                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-sm text-[10px] font-bold border border-gov-border bg-gov-surface text-gov-navy font-num"
                    >
                      <ScanLine className="w-3 h-3 opacity-60" aria-hidden="true" />
                      Package {pk.package}: Km {pk.chainage_km[0]}–{pk.chainage_km[1]}
                    </span>
                  ))}
                </div>
                <p className="text-[10px] text-gov-muted mt-2 leading-snug font-sans">
                  <strong className="text-gov-navy">Packages are indexed, not imaged.</strong>{' '}
                  Positioning each one needs the surveyed alignment
                  (GatiShakti or the DPR shapefile), which this corpus does not
                  carry — so no package centre is shown rather than a midpoint
                  interpolation that would place works where none were surveyed.
                </p>
              </>
            ) : (
              <p className="text-[10px] text-gov-muted leading-snug font-sans">
                Route length is not recorded for this project, so chainage
                packaging is unavailable. Only 324 of 2,207 project titles state
                a length; the rest carry none, and packaging an invented length
                would produce authoritative-looking boundaries for a route whose
                extent nobody recorded.
              </p>
            )}
          </div>
        )}

        {/* Official layer rail — compound framing only.
            On a corridor the frame is a fraction of the route and on a locator
            there is no site, so a change percentage over either would be an
            audit verdict about ground the platform cannot claim is the project. */}
        {isOfficial && isCompound && (
          <div className="mt-3">
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              <span className="text-[9px] font-black uppercase tracking-wider text-gov-muted mr-1">
                <Layers className="w-3 h-3 inline mr-1" />Analytical layers
              </span>
              {OFFICIAL_LAYERS.map((l) => (
                <button key={l.id} type="button" title={l.note}
                        onClick={() => selectLayer(l.id)}
                        aria-pressed={activeLayer === l.id}
                        className={`px-2 py-1 rounded-sm text-[10px] font-bold border transition-colors ${
                          activeLayer === l.id
                            ? 'border-gov-navy bg-gov-navy text-white'
                            : 'border-gov-border bg-gov-surface text-gov-navy hover:bg-gov-muted-surface'}`}>
                  {l.label}
                </button>
              ))}
              {activeLayer && (
                <button type="button" onClick={() => setShowOverlay((v) => !v)}
                        className="px-2 py-1 rounded-sm text-[10px] font-bold border border-gov-border bg-gov-surface text-gov-navy">
                  {showOverlay ? <Eye className="w-3 h-3 inline" /> : <EyeOff className="w-3 h-3 inline" />}
                </button>
              )}
              <button
                type="button"
                onClick={() => setLowDensity((v) => !v)}
                aria-pressed={lowDensity}
                title={lowDensity
                  ? 'Overlays at half resolution and 6 colour bands. Toggle off for full detail.'
                  : 'Overlays at full resolution and 8 colour bands. Toggle on to cut about 91% of the bytes (623 kB to 55 kB across all five layers).'}
                className={`px-2 py-1 rounded-sm text-[10px] font-bold border transition-colors ${
                  lowDensity ? 'border-amber-400 bg-amber-50 text-amber-900'
                             : 'border-gov-border bg-gov-surface text-gov-navy'}`}>
                {lowDensity ? 'Low-bandwidth ON' : 'Low-bandwidth OFF'}
              </button>
            </div>
            {activeLayer && (
              <p className="text-[10px] text-gov-muted mt-2 max-w-[560px] mx-auto leading-snug">
                <strong className="text-gov-navy">
                  {OFFICIAL_LAYERS.find((l) => l.id === activeLayer)?.label}.
                </strong>{' '}
                {OFFICIAL_LAYERS.find((l) => l.id === activeLayer)?.note}
              </p>
            )}
          </div>
        )}

        {isOfficial && isCorridor && (
          <p className="text-[10px] text-gov-muted mt-3 leading-snug text-center max-w-[560px] mx-auto font-sans">
            <strong className="text-gov-navy">Change scoring is off for corridor framing.</strong>{' '}
            A percentage computed over one strip would be read as a figure for
            the whole route. Corridor-contained measurement runs in the audit
            record against the statutory Right-of-Way, not against this view.
          </p>
        )}
      </div>
      )}

      {/* ── OFFICIAL: forensic provenance ─────────────────────────────── */}
      {isOfficial && !isLocatorOnly && meta.provenance && (
        <div className="border-t border-gov-border">
          <div className="px-4 pt-3 pb-1 flex items-center gap-2">
            <Fingerprint className="w-3.5 h-3.5 text-gov-navy" />
            <h4 className="text-[10px] font-black text-gov-navy uppercase tracking-wider">
              Forensic provenance
            </h4>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-[9px] font-black bg-emerald-100 text-emerald-900 border border-emerald-400">
              <Crosshair className="w-3 h-3" /> CO-REGISTERED
            </span>
            {secondsLeft !== null && (
              <span className={`text-[9px] font-bold ml-auto ${
                secondsLeft < 60 ? 'text-rose-700' : 'text-gov-muted'}`}>
                signed link expires in {Math.floor(secondsLeft / 60)}m {secondsLeft % 60}s
              </span>
            )}
          </div>
          <div className="px-4 pb-3 space-y-1 text-[10px] text-gov-muted">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
              <div><span className="font-bold text-gov-navy">GSD:</span>{' '}
                {meta.resolution_m_per_px} m/px — measured Web Mercator ground sample
                distance at this project&rsquo;s latitude and zoom.</div>
              <div><span className="font-bold text-gov-navy">Pair digest:</span>{' '}
                <code className="break-all">{meta.provenance.pair_digest?.slice(0, 32)}…</code></div>
            </div>
            <p className="pt-1">
              <span className="font-bold text-gov-navy">Attests:</span>{' '}
              {meta.provenance.attests}
            </p>
            <p className="text-amber-800">
              <span className="font-bold">Does not attest:</span>{' '}
              {meta.provenance.does_not_attest}
            </p>
          </div>

          <div className="px-4 pb-4 flex flex-wrap gap-2">
            <button type="button" onClick={exportPacket}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-[10px] font-black uppercase tracking-wide bg-gov-navy text-white hover:bg-gov-accent transition-colors">
              <FileText className="w-3.5 h-3.5" /> Export forensic audit packet
            </button>
            {signed?.after && (
              <a href={signed.after} target="_blank" rel="noreferrer"
                 className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-[10px] font-bold border border-gov-border bg-gov-surface text-gov-navy hover:bg-gov-muted-surface">
                <Download className="w-3.5 h-3.5" /> Signed full-resolution link
              </a>
            )}
          </div>
        </div>
      )}

      {/* ── PUBLIC: plain-language summary ───────────────────────────── */}
      {!isOfficial && !isLocatorOnly && (
        <div className="border-t border-gov-border px-4 py-3">
          <h4 className="text-[10px] font-black text-gov-navy uppercase tracking-wider mb-1.5 font-heading">
            What you are looking at
          </h4>
          <p className="text-[11px] text-gov-muted leading-relaxed">
            Two satellite photographs of this project site, taken{' '}
            {stale?.blind_window_months ? '' : ''}
            {meta.epoch_before} and {meta.epoch_after}. Drag the slider to compare
            them. Ground detail here is about{' '}
            {meta.resolution_m_per_px ? `${meta.resolution_m_per_px} metres` : 'two metres'}{' '}
            per pixel, so a building is a few pixels across and individual vehicles
            are not visible.
          </p>
          <p className="text-[11px] text-gov-muted leading-relaxed mt-1.5">
            Comparing photographs shows whether the ground <em>changed</em>. It cannot
            show a percentage complete — across this programme, surface change and
            reported progress correlate at 0.007, which is effectively not at all.
            Treat the pictures as one piece of evidence beside the reported figures,
            not as a verdict on them.
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-2.5 bg-gov-surface border-t border-gov-border flex flex-wrap items-center justify-between gap-2 text-[10px] text-gov-muted">
        <span>{meta.sector} · {meta.state}
          {meta.latitude != null && ` · ${meta.latitude}, ${meta.longitude}`}
          {meta.coordinate_precision_dp != null && ' (coarsened)'}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="w-3 h-3 text-emerald-600" />
          Tier resolved server-side from credential
        </span>
      </div>
    </div>
  );
}
