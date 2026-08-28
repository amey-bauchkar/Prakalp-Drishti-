import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle, Crosshair, Download, Eye, EyeOff, FileText, Fingerprint,
  Loader2, Lock, Maximize2, Move, Satellite, ShieldCheck, Clock, Layers,
} from 'lucide-react';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const [beforeUrl, setBeforeUrl] = useState(null);
  const [afterUrl, setAfterUrl] = useState(null);
  const [tilesLoading, setTilesLoading] = useState(true);

  const [pos, setPos] = useState(50);
  const [dragging, setDragging] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [activeLayer, setActiveLayer] = useState(null);
  const [layerUrl, setLayerUrl] = useState(null);
  const [layerBusy, setLayerBusy] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const [now, setNow] = useState(() => Date.now());

  const frameRef = useRef(null);
  const objectUrls = useRef([]);

  const tier = meta?.tier || localTier;
  const isOfficial = tier === 'official';

  const track = (u) => { if (u) objectUrls.current.push(u); return u; };
  const revokeAll = useCallback(() => {
    objectUrls.current.forEach((u) => { try { URL.revokeObjectURL(u); } catch { /* already gone */ } });
    objectUrls.current = [];
  }, []);

  // ── metadata ─────────────────────────────────────────────────────────
  useEffect(() => {
    let dead = false;
    setLoading(true); setError(null);
    apiFetchRetry(`${API}/api/eo/metadata/${projectId}`).then((r) => {
      if (dead) return;
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
  useEffect(() => {
    let dead = false;
    setTilesLoading(true);
    revokeAll(); setBeforeUrl(null); setAfterUrl(null);
    setActiveLayer(null); setLayerUrl(null);

    Promise.all([
      fetchBlobUrl(`${API}/api/eo/tile/${projectId}/BEFORE`),
      fetchBlobUrl(`${API}/api/eo/tile/${projectId}/AFTER`),
    ]).then(([b, a]) => {
      if (dead) { [b, a].forEach((r) => r.objectUrl && URL.revokeObjectURL(r.objectUrl)); return; }
      if (b.status === 429 || a.status === 429) {
        setToast({ tone: 'warn', message: 'Imagery quota reached. Please wait a moment.' });
      }
      setBeforeUrl(track(b.objectUrl));
      setAfterUrl(track(a.objectUrl));
      setTilesLoading(false);
    });
    return () => { dead = true; };
  }, [projectId, localTier, revokeAll]);

  useEffect(() => revokeAll, [revokeAll]);

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

  // ── layer toggling ───────────────────────────────────────────────────
  const selectLayer = useCallback((id) => {
    if (activeLayer === id) {
      setActiveLayer(null);
      if (layerUrl) { try { URL.revokeObjectURL(layerUrl); } catch { /* gone */ } }
      setLayerUrl(null);
      return;
    }
    setActiveLayer(id); setLayerBusy(true);
    fetchBlobUrl(`${API}/api/amey/satellite/${projectId}/layer/${id}`).then((r) => {
      setLayerBusy(false);
      if (!r.ok) {
        setActiveLayer(null);
        // A 401 has already cleared the session inside fetchBlobUrl, which
        // notifies subscribers and flips this component to the public view on
        // the next render. The toast explains the transition rather than
        // leaving the reader wondering why the panel changed shape.
        setToast({
          tone: r.status === 429 ? 'warn' : r.status === 401 ? 'warn' : 'error',
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
  }, [activeLayer, layerUrl, projectId]);

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
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[10px] font-black border ${
          isOfficial ? 'bg-gov-navy text-white border-gov-navy'
                     : 'bg-sky-50 text-sky-900 border-sky-300'}`}>
          {isOfficial ? <ShieldCheck className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          {isOfficial ? 'AUDITOR TIER' : 'NAGRIK / PUBLIC TIER'}
        </span>
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

      {/* Comparator */}
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

          {beforeUrl && (
            <img src={beforeUrl} alt={`Baseline ${meta.epoch_before} imagery`}
                 className="absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-300"
                 draggable={false} />
          )}
          {afterUrl && (
            <img src={afterUrl} alt={`Current ${meta.epoch_after} imagery`}
                 className="absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-300"
                 draggable={false} style={{ clipPath: `inset(0 0 0 ${pos}%)` }} />
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

        {/* Official layer rail */}
        {isOfficial && (
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
      </div>

      {/* ── OFFICIAL: forensic provenance ─────────────────────────────── */}
      {isOfficial && meta.provenance && (
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
      {!isOfficial && (
        <div className="border-t border-gov-border px-4 py-3">
          <h4 className="text-[10px] font-black text-gov-navy uppercase tracking-wider mb-1.5">
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
