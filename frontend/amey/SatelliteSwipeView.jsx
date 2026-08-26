import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Satellite, ShieldCheck, AlertTriangle, MapPin, Move, Eye, EyeOff, Crosshair } from 'lucide-react';

/**
 * Dual-epoch satellite ground-truth viewer.
 *
 * Two deliberate design decisions:
 *
 * 1. SWIPE, NOT SIDE-BY-SIDE. Side-by-side forces the reviewer to saccade between two
 *    frames and hold one in working memory. A swipe keeps both epochs registered in the
 *    same screen position, so change is perceived directly rather than reconstructed.
 *
 * 2. THE CONFIDENCE CHIP IS NOT DECORATION. Only ~23% of projects were originally
 *    geocoded to a real site; the rest pointed at a state or national centroid, i.e.
 *    imagery of the wrong place entirely. When geocode confidence is NONE we suppress
 *    the EO verdict outright instead of rendering a fraud finding over unrelated ground.
 *    Showing "we cannot verify this" is worth more to an auditor than a confident number
 *    that is not backed by the pixels underneath it.
 */

const CONFIDENCE_STYLES = {
  HIGH: {
    label: 'Site-Level Geocode',
    cls: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    dot: 'bg-emerald-500',
  },
  MEDIUM: {
    label: 'Approximate Geocode',
    cls: 'bg-amber-50 text-amber-800 border-amber-300',
    dot: 'bg-amber-500',
  },
  // Regional estimate (e.g. a coalfield centre). Distinct from NONE so the map can
  // show a plausible marker, but it is NOT site-level, so the EO verdict stays withheld.
  LOW: {
    label: 'Regional Estimate Only',
    cls: 'bg-orange-50 text-orange-800 border-orange-300',
    dot: 'bg-orange-500',
  },
  NONE: {
    label: 'No Site Geocode',
    cls: 'bg-rose-50 text-rose-800 border-rose-300',
    dot: 'bg-rose-500',
  },
};

// Statuses describe what the imagery OBSERVED, never a completion percentage.
// Surface change and reported progress correlate at 0.007 across the corpus, so the
// old "N% observed vs M% claimed, X pts divergence" framing was not supportable.
const STATUS_STYLES = {
  ACTIVITY_ANOMALY: { cls: 'bg-rose-100 text-rose-800 border-rose-300', label: 'Activity Anomaly — Field Visit' },
  CHANGE_CONFIRMED: { cls: 'bg-emerald-100 text-emerald-800 border-emerald-300', label: 'Ground Change Confirmed' },
  LOW_CHANGE_OBSERVED: { cls: 'bg-amber-100 text-amber-800 border-amber-300', label: 'Low Ground Change' },
  EO_UNAVAILABLE: { cls: 'bg-slate-100 text-slate-700 border-slate-300', label: 'Not Verifiable' },
};

const API = '';

export default function SatelliteSwipeView({ projectId = '618402' }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pos, setPos] = useState(50);
  const [showBoxes, setShowBoxes] = useState(true);
  const [dragging, setDragging] = useState(false);
  const frameRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`${API}/api/amey/satellite/${projectId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((j) => { if (!cancelled) { setData(j); setLoading(false); } })
      .catch(() => { if (!cancelled) { setData(null); setLoading(false); } });
    return () => { cancelled = true; };
  }, [projectId]);

  const updateFromClientX = useCallback((clientX) => {
    const el = frameRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(0, Math.min(100, pct)));
  }, []);

  // Pointer events cover mouse, touch and pen in one path, and setPointerCapture keeps
  // the drag alive when the cursor leaves the frame -- without it the handle sticks
  // whenever the user overshoots the image edge.
  // setPointerCapture throws NotFoundError when the pointerId is not an active pointer.
  // Left unguarded that exception aborts the rest of the handler, so the very first
  // click would fail to reposition the handle. Capture is an enhancement, not a
  // requirement -- swallow the failure and always apply the position update.
  const onPointerDown = (e) => {
    setDragging(true);
    try { e.currentTarget.setPointerCapture?.(e.pointerId); } catch { /* capture unavailable */ }
    updateFromClientX(e.clientX);
  };
  const onPointerMove = (e) => { if (dragging) updateFromClientX(e.clientX); };
  const onPointerUp = (e) => {
    setDragging(false);
    try { e.currentTarget.releasePointerCapture?.(e.pointerId); } catch { /* nothing to release */ }
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowLeft') { setPos((p) => Math.max(0, p - 2)); e.preventDefault(); }
    if (e.key === 'ArrowRight') { setPos((p) => Math.min(100, p + 2)); e.preventDefault(); }
    if (e.key === 'Home') { setPos(0); e.preventDefault(); }
    if (e.key === 'End') { setPos(100); e.preventDefault(); }
  };

  if (loading) {
    return (
      <div className="bg-white p-10 rounded-2xl border border-gov-border text-center">
        <Satellite className="w-7 h-7 text-gov-accent animate-pulse mx-auto mb-3" />
        <p className="text-xs font-bold text-gov-navy">Loading dual-epoch orbital imagery…</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="note note-warn flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        Unable to load satellite audit. Ensure the backend server is running.
      </div>
    );
  }

  const conf = CONFIDENCE_STYLES[data.geocode_confidence] || CONFIDENCE_STYLES.NONE;
  const status = STATUS_STYLES[data.audit_status] || STATUS_STYLES.EO_UNAVAILABLE;
  const reliable = data.eo_verdict_reliable;
  const boxes = data.change_boxes || [];

  return (
    <div className="panel overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gov-border flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Satellite className="w-4 h-4 text-gov-navy" />
          <div>
            <h3 className="text-xs font-black text-gov-navy uppercase tracking-wider">
              PRATIBIMB Dual-Epoch Ground Truth
            </h3>
            <span className="text-[10px] text-gov-muted">
              {data.baseline_vintage} → {data.current_vintage} · {data.resolution_m} m/px · {data.sensor?.split('(')[0]}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[10px] font-black border ${conf.cls}`}
            title={data.geocode_confidence_note}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${conf.dot}`} />
            <MapPin className="w-3 h-3" />
            {conf.label}
          </span>
          <span className={`px-2.5 py-1 rounded-sm text-[10px] font-black border ${status.cls}`}>
            {status.label}
          </span>
          <button
            onClick={() => setShowBoxes((v) => !v)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[10px] font-bold border border-gov-border bg-gov-surface text-gov-navy hover:bg-gov-muted-surface transition-colors"
            aria-pressed={showBoxes}
          >
            {showBoxes ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            {boxes.length} change {boxes.length === 1 ? 'zone' : 'zones'}
          </button>
        </div>
      </div>

      {/* Suppression notice: shown instead of a verdict when the imagery is of the wrong place */}
      {!reliable && (
        <div className="note note-critical mx-4 mt-4 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-[11px] text-rose-900 leading-snug">
            <strong className="block mb-0.5">Earth-observation verdict withheld for this project.</strong>
            {data.eo_unreliable_reason || 'This project has no site-level geocode.'} The imagery below is
            therefore not guaranteed to show the works, so no over-reporting finding is issued. Physical
            inspection is the applicable verification route.
          </div>
        </div>
      )}

      {/* Swipe comparator */}
      <div className="p-4">
        <div
          ref={frameRef}
          role="slider"
          tabIndex={0}
          aria-label="Reveal 2023 imagery over 2018 baseline"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pos)}
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="relative w-full aspect-square max-h-[560px] mx-auto rounded-xl overflow-hidden border border-gov-border bg-slate-950 select-none cursor-ew-resize touch-none focus:outline-none focus:ring-2 focus:ring-gov-accent"
          style={{ maxWidth: 560 }}
        >
          {/* Fallback Ground State */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-950 text-slate-400">
            <Satellite className="w-10 h-10 text-slate-600 mb-3 opacity-60 animate-pulse" />
            <div className="text-xs font-bold font-heading text-slate-300 uppercase tracking-wider">
              Satellite Optical Telemetry
            </div>
            <div className="text-[11px] text-slate-500 font-mono mt-1 max-w-xs">
              Project Coordinates: {data.latitude?.toFixed(4) || '—'}° N, {data.longitude?.toFixed(4) || '—'}° E
            </div>
            <div className="text-[10px] text-amber-400/80 font-mono mt-2 bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
              {data.eo_verdict_reliable ? 'Optical Archive Synchronized' : 'Site Verification Scheduled via Field Audit'}
            </div>
          </div>

          {/* BEFORE (base layer) */}
          <img
            src={`${API}${data.before_imagery_url}`}
            alt={`2018 baseline imagery for project ${data.project_id}`}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            draggable={false}
            onError={(e) => { e.target.style.display = 'none'; }}
          />

          {/* AFTER (clipped to the swipe position) */}
          <img
            src={`${API}${data.after_imagery_url}`}
            alt={`2023 current imagery for project ${data.project_id}`}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            draggable={false}
            style={{ clipPath: `inset(0 0 0 ${pos}%)` }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />

          {/* Change-zone boxes, drawn from normalised coords so they scale with the frame */}
          {showBoxes && boxes.map((b, i) => (
            <div
              key={i}
              className="absolute border-2 rounded-sm pointer-events-none"
              style={{
                left: `${b.x * 100}%`,
                top: `${b.y * 100}%`,
                width: `${b.w * 100}%`,
                height: `${b.h * 100}%`,
                borderColor: 'rgba(255,214,0,0.95)',
                boxShadow: '0 0 0 1px rgba(0,0,0,0.45), 0 0 12px rgba(255,214,0,0.35)',
              }}
              title={`Change zone ${i + 1} — ${b.area_pct}% of frame`}
            />
          ))}

          {/* Epoch labels */}
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/75 text-sky-300 text-[10px] font-bold border border-sky-400/30 pointer-events-none">
            T0 · {data.baseline_vintage}
          </span>
          <span className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/75 text-emerald-300 text-[10px] font-bold border border-emerald-400/30 pointer-events-none">
            T1 · {data.current_vintage}
          </span>

          {/* Swipe handle */}
          <div className="absolute top-0 bottom-0 pointer-events-none" style={{ left: `${pos}%` }}>
            <div className="absolute top-0 bottom-0 -translate-x-1/2 w-0.5 bg-white/90 shadow-[0_0_8px_rgba(0,0,0,0.6)]" />
            <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white shadow-lg border-2 border-gov-navy flex items-center justify-center">
              <Move className="w-4 h-4 text-gov-navy" />
            </div>
          </div>
        </div>

        <p className="text-[10px] text-gov-muted text-center mt-2">
          Drag the handle — or focus the frame and use ← / → — to sweep between epochs.
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-gov-border border-t border-gov-border">
        {[
          {
            k: 'Reported Progress',
            v: `${data.claimed_progress_pct}%`,
            c: 'text-gov-navy',
            t: 'Self-reported by the executing agency. This is the figure under scrutiny, not a measurement.',
          },
          {
            k: 'Surface Changed',
            v: reliable ? `${data.surface_change_pct ?? 0}%` : '—',
            c: reliable ? 'text-emerald-700' : 'text-gov-muted',
            t: 'Independently measured from 2018 vs 2023 imagery. No reported figure feeds this number.',
          },
          {
            k: 'Sector Percentile',
            v: reliable && data.change_percentile_in_sector != null
              ? `${data.change_percentile_in_sector}th`
              : '—',
            c: reliable && data.change_percentile_in_sector != null && data.change_percentile_in_sector <= 10
              ? 'text-rose-600' : 'text-gov-navy',
            t: 'Where this site ranks for structural change against peers in the same sector.',
          },
          {
            k: 'Sampled Footprint',
            v: data.asset_geometry === 'LINEAR' ? 'Corridor slice' : 'Whole site',
            c: data.asset_geometry === 'LINEAR' ? 'text-amber-700' : 'text-gov-navy',
            t: data.asset_geometry === 'LINEAR'
              ? 'Linear asset: one tile samples a single slice of the corridor, not the entire project.'
              : 'Point asset: the tile covers the works.',
          },
        ].map((m) => (
          <div key={m.k} className="bg-white p-3 text-center" title={m.t}>
            <span className="text-[9px] font-bold text-gov-muted uppercase tracking-wide block">{m.k}</span>
            <span className={`text-sm font-black font-mono ${m.c}`}>{m.v}</span>
          </div>
        ))}
      </div>

      {/* Provenance footer */}
      <div className="px-4 py-2.5 bg-gov-surface border-t border-gov-border flex flex-wrap items-center justify-between gap-2 text-[10px] text-gov-muted">
        <span className="inline-flex items-center gap-1.5">
          <Crosshair className="w-3 h-3" />
          Co-registered via {data.registration_method || 'n/a'} · {data.registration_shift_px ?? 0} px correction
        </span>
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="w-3 h-3 text-emerald-600" />
          Radiometrically normalised · SSIM structural change · 100% offline
        </span>
      </div>
    </div>
  );
}
