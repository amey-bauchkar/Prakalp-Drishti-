import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Satellite, ShieldCheck, AlertTriangle, MapPin, Move, Eye, EyeOff, Crosshair, Gauge, Layers } from 'lucide-react';

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

const API = 'http://127.0.0.1:8000';

// Each overlay names what it actually is. "Built-up Likelihood (RBL)" is not
// NDBI and must never be labelled as such: NDBI needs a SWIR band and this
// imagery is three visible channels, so the index is a composite defined in
// eo_geospatial.py. Calling it NDBI would be the single most misleading label
// on this screen, because a remote-sensing reviewer would read it as a standard
// product with known behaviour.
const EO_LAYERS = [
  {
    id: 'builtup',
    label: 'Built-up Likelihood',
    swatch: 'bg-gradient-to-r from-slate-900 via-orange-600 to-amber-200',
    note: 'RBL — a visible-band composite of inverse saturation, brightness and local texture energy. NOT NDBI: that requires SWIR, which this sensor does not carry. Shown at 8 levels, suppressed below 0.35.',
  },
  {
    id: 'corridor',
    label: 'RoW Corridor',
    swatch: 'bg-cyan-400',
    note: 'The statutory Right-of-Way buffer actually used for the measurement, with its fitted centreline. Everything outside it is excluded from the footprint figure.',
  },
  {
    id: 'change',
    label: 'Structural Change',
    swatch: 'bg-gradient-to-r from-indigo-600 via-emerald-400 to-rose-500',
    note: 'Pixels flagged by the SSIM structural-change chain after co-registration and radiometric normalisation, inside the corridor only.',
  },
  {
    id: 'materials',
    label: 'Material Classes',
    swatch: 'bg-gradient-to-r from-emerald-600 via-slate-400 to-slate-100',
    note: 'Rule-based material assignment on the 2023 epoch after epoch calibration. Declared thresholds, not a trained classifier — no labelled material corpus exists for these tiles.',
  },
];

export default function SatelliteSwipeView({ projectId = '618402' }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pos, setPos] = useState(50);
  const [showBoxes, setShowBoxes] = useState(true);
  const [dragging, setDragging] = useState(false);
  // Analytical overlays are opt-in and independent. They are fetched as PNGs
  // from the same functions that produced the numbers beside them, so toggling
  // a layer shows the evidence for a figure rather than a separate rendering
  // that could disagree with it.
  const [layers, setLayers] = useState({
    builtup: false, corridor: false, change: false, materials: false,
  });
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
        Unable to load satellite audit. Ensure the backend is running on port 8000.
      </div>
    );
  }

  const conf = CONFIDENCE_STYLES[data.geocode_confidence] || CONFIDENCE_STYLES.NONE;
  const status = STATUS_STYLES[data.audit_status] || STATUS_STYLES.EO_UNAVAILABLE;
  const reliable = data.eo_verdict_reliable;
  const boxes = data.change_boxes || [];

  const corridor = data.row_corridor || {};
  const isCorridor = data.roi_shape === 'row_corridor';
  const velocity = data.construction_velocity || {};
  const pace = data.pace_vs_dpr || {};
  const materials = data.material_transition || {};
  const radiometry = data.radiometry || {};
  const sar = data.sar_readiness || {};
  const calib = materials.epoch_index_calibration || {};

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
          {/* BEFORE (base layer) */}
          <img
            src={`${API}${data.before_imagery_url}`}
            alt={`2018 baseline imagery for project ${data.project_id}`}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            draggable={false}
          />

          {/* AFTER (clipped to the swipe position) */}
          <img
            src={`${API}${data.after_imagery_url}`}
            alt={`2023 current imagery for project ${data.project_id}`}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            draggable={false}
            style={{ clipPath: `inset(0 0 0 ${pos}%)` }}
          />

          {/* Analytical overlays. Rendered OUTSIDE the swipe clip on purpose: the
              measurement covers the whole 2018-2023 interval, so clipping it to
              the handle position would imply the layer belongs to one epoch. */}
          {EO_LAYERS.filter((l) => layers[l.id]).map((l) => (
            <img
              key={l.id}
              src={`${API}/api/amey/satellite/${data.project_id}/layer/${l.id}`}
              alt={`${l.label} analytical overlay`}
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              draggable={false}
            />
          ))}

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

        {/* Layer rail */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
          <span className="text-[9px] font-black uppercase tracking-wider text-gov-muted mr-1">
            Analytical layers
          </span>
          {EO_LAYERS.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => setLayers((v) => ({ ...v, [l.id]: !v[l.id] }))}
              aria-pressed={!!layers[l.id]}
              title={l.note}
              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-sm text-[10px] font-bold border transition-colors ${
                layers[l.id]
                  ? 'border-gov-navy bg-gov-navy text-white'
                  : 'border-gov-border bg-gov-surface text-gov-navy hover:bg-gov-muted-surface'
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-sm border border-black/20 ${l.swatch}`} />
              {l.label}
            </button>
          ))}
        </div>
        {EO_LAYERS.some((l) => layers[l.id]) && (
          <p className="text-[10px] text-gov-muted mt-2 leading-snug max-w-[560px] mx-auto">
            {EO_LAYERS.filter((l) => layers[l.id]).map((l) => (
              <span key={l.id} className="block">
                <strong className="text-gov-navy">{l.label}.</strong> {l.note}
              </span>
            ))}
          </p>
        )}
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
            // The whole 800px frame spans 800-3,700 m of ground, so this figure
            // includes every field, village and road around the site. It is kept
            // for continuity but is no longer the headline.
            k: 'Frame Changed',
            v: reliable ? `${data.surface_change_pct ?? 0}%` : '—',
            c: reliable ? 'text-gov-muted' : 'text-gov-muted',
            t: 'Whole-tile change, 2018 vs 2023. Spans 800-3,700 m of ground, so it includes surrounding farmland and settlements — not just the project.',
          },
          {
            k: 'Project Footprint',
            v: data.project_footprint_change_pct != null
              ? `${data.project_footprint_change_pct}%`
              : '—',
            c: data.footprint_reliable === false ? 'text-amber-700' : 'text-emerald-700',
            t: `Structural change inside the ${data.roi_radius_m ?? 300} m project ROI only, with seasonal vegetation suppressed. This is the construction signal.`,
          },
          {
            k: 'Ambient Terrain',
            v: data.ambient_terrain_change_pct != null
              ? `${data.ambient_terrain_change_pct}%`
              : '—',
            c: 'text-gov-muted',
            t: 'Change OUTSIDE the project ROI. The comparison that matters is footprint against ambient: if the landscape moved as much as the site, the site signal is not evidence of work.',
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
            // The engine reports 'row_corridor' / 'site_envelope'. It previously
            // said 'corridor' / 'disc', and this cell silently rendered an em-dash
            // for every project until the strings were reconciled.
            k: 'ROI Geometry',
            v: isCorridor
              ? `RoW ±${corridor.half_width_m} m @ ${corridor.bearing_deg ?? '?'}°`
              : data.roi_shape === 'site_envelope' ? `Envelope ${corridor.half_width_m ?? 300} m` : '—',
            c: isCorridor ? 'text-emerald-700' : 'text-gov-navy',
            t: corridor.basis
              || 'A radial site envelope centred on the recorded coordinate. For a linear asset this samples only the stretch near the centroid.',
          },
        ].map((m) => (
          <div key={m.k} className="bg-white p-3 text-center" title={m.t}>
            <span className="text-[9px] font-bold text-gov-muted uppercase tracking-wide block">{m.k}</span>
            <span className={`text-sm font-black font-mono ${m.c}`}>{m.v}</span>
          </div>
        ))}
      </div>

      {/* A near-zero footprint means two very different things depending on why.
          Saying which, next to the number, is the difference between "nothing was
          built" and "we could not see whether anything was built". */}
      {data.footprint_caveat && (
        <div className="note note-warn mx-4 mb-3 text-[10.5px]">
          <span>
            <strong>Footprint caveat.</strong> {data.footprint_caveat}
          </span>
        </div>
      )}

      {/* -- Construction telemetry ---------------------------------------
          Pace and velocity are shown side by side but are NOT the same
          measurement: the ratio comes from the agency's own reported progress
          against its sanctioned duration, the area comes from the imagery. The
          discrepancy banner below fires when they disagree, which is the case
          this whole module exists to surface. */}
      {(velocity.areal_velocity_m2_per_month != null || pace.available) && (
        <div className="border-t border-gov-border">
          <div className="px-4 pt-3 pb-1 flex items-center gap-2">
            <Gauge className="w-3.5 h-3.5 text-gov-navy" />
            <h4 className="text-[10px] font-black text-gov-navy uppercase tracking-wider">
              Construction Telemetry
            </h4>
            <span className="text-[9.5px] text-gov-muted">
              {velocity.epochs} &middot; {velocity.epoch_span_months} month window
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-gov-border">
            {[
              {
                k: 'Areal Velocity',
                v: velocity.areal_velocity_m2_per_month != null
                  ? velocity.areal_velocity_m2_per_month.toLocaleString() + ' m2/mo' : '—',
                c: 'text-gov-navy',
                t: 'Changed area inside the ROI divided by the elapsed months between epochs. Two images bound one interval, so this is an average rate over the window, not an instantaneous one.',
              },
              {
                k: 'Linear Velocity',
                v: velocity.linear_velocity_km_per_month != null
                  ? velocity.linear_velocity_km_per_month + ' km/mo' : '—',
                c: velocity.linear_velocity_km_per_month != null ? 'text-emerald-700' : 'text-gov-muted',
                t: isCorridor
                  ? 'Along-axis extent of change (5th-95th percentile) over elapsed months. Measures how much ALIGNMENT was touched, not how many pixels changed: a continuous formation and a scattered one cover the same length. ' + (velocity.scope || '')
                  : 'Defined only for a fitted RoW corridor. This project is measured on a radial site envelope, which has no axis to project onto.',
              },
              {
                k: 'Corridor Utilisation',
                v: velocity.corridor_utilisation_pct != null
                  ? velocity.corridor_utilisation_pct + '%' : '—',
                c: 'text-gov-navy',
                t: 'Share of the statutory RoW area showing structural change. Low utilisation on a corridor with high reported progress is the classic over-reporting signature.',
              },
              {
                k: 'Pace vs Sanction',
                v: pace.available ? pace.pace_ratio + '×' : '—',
                c: !pace.available ? 'text-gov-muted'
                  : pace.pace_ratio >= 1 ? 'text-emerald-700'
                  : pace.pace_ratio >= 0.5 ? 'text-amber-700' : 'text-rose-700',
                t: pace.available
                  ? 'Reported progress of ' + pace.observed_progress_pct_per_month
                    + '%/month against the ' + pace.required_progress_pct_per_month
                    + '%/month the SanctionDate to OriginalEndDate schedule requires. Measured against the ORIGINAL deadline, not the revised one: grading against a slipped date would score every project against the deadline it already missed.'
                  : pace.reason,
              },
            ].map((m) => (
              <div key={m.k} className="bg-white p-3 text-center" title={m.t}>
                <span className="text-[9px] font-bold text-gov-muted uppercase tracking-wide block">{m.k}</span>
                <span className={'text-sm font-black font-mono ' + m.c}>{m.v}</span>
              </div>
            ))}
          </div>

          {velocity.max_observable_km_per_month != null && (
            <p className="px-4 pt-2 text-[10px] text-gov-muted leading-snug">
              <strong className="text-gov-navy">Observation ceiling.</strong> Linear pace
              is bounded by the tile, not by the project: one frame spans{' '}
              {velocity.observable_extent_km} km, so this metric cannot exceed{' '}
              {velocity.max_observable_km_per_month} km/mo however fast the works advance.
              It describes the imaged segment, not the full sanctioned alignment.
              {velocity.extent_saturated && (
                <strong className="text-amber-700">
                  {' '}Change spans the whole visible frame — the true extent is at or
                  beyond this ceiling and is censored by the imagery footprint.
                </strong>
              )}
            </p>
          )}

          {pace.discrepancy_flag && (
            <div className="note note-critical mx-4 mt-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-[11px] text-rose-900 leading-snug">
                <strong className="block mb-0.5">
                  Reported progress without measurable surface change.
                </strong>
                The agency reports {data.claimed_progress_pct}% physical progress, and the
                imagery shows no structural change inside the surveyed
                {isCorridor ? ' Right-of-Way corridor' : ' site envelope'} across the
                {' '}{velocity.epoch_span_months}-month window. This is a discrepancy to
                resolve by inspection, not a finding on its own: the geocode, the epoch
                dates and the works schedule all have to be checked first.
              </div>
            </div>
          )}

          {materials.net_engineered_gain_pct != null && (
            <div className="px-4 py-3">
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-[10.5px]">
                <span className="font-black text-gov-navy uppercase tracking-wider text-[9px]">
                  Material transition
                </span>
                <span className="text-gov-muted">
                  natural &rarr; engineered{' '}
                  <strong className="font-mono text-emerald-700">
                    {materials.natural_to_engineered_pct}%
                  </strong>
                </span>
                <span className="text-gov-muted">
                  engineered &rarr; natural{' '}
                  <strong className="font-mono text-amber-700">
                    {materials.engineered_to_natural_pct}%
                  </strong>
                </span>
                <span className="text-gov-muted">
                  net{' '}
                  <strong className={'font-mono ' + (materials.net_engineered_gain_pct >= 0 ? 'text-emerald-700' : 'text-rose-700')}>
                    {materials.net_engineered_gain_pct > 0 ? '+' : ''}{materials.net_engineered_gain_pct}%
                  </strong>
                </span>
              </div>
              {materials.stability && (
                <p className="text-[10px] text-gov-muted mt-1.5 leading-snug">
                  Both directions are shown because on this corpus the reverse flow is the
                  larger of the two. That is not classifier noise: the same chain run on a
                  frame against itself reports{' '}
                  {materials.stability.identical_frame_transition_pct}% transition on 50/50
                  scenes, and a blur test bounds the resolution artefact at{' '}
                  {materials.stability.resolution_artefact_bound_pct} pp. No labelled material
                  corpus exists for these tiles, so the thresholds have not been tuned until
                  the forward figure wins.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* -- Methodology disclosure ---------------------------------------- */}
      <details className="border-t border-gov-border">
        <summary className="px-4 py-2.5 cursor-pointer text-[10px] font-black text-gov-navy uppercase tracking-wider hover:bg-gov-muted-surface flex items-center gap-2">
          <Layers className="w-3.5 h-3.5" />
          Sensor limits &amp; method &mdash; what this chain can and cannot establish
        </summary>
        <div className="px-4 pb-4 pt-1 text-[10.5px] text-gov-muted leading-relaxed space-y-2">
          <p>
            <strong className="text-gov-navy">Ground sample distance.</strong>{' '}
            {data.gsd_m_per_px ?? data.resolution_m} m/px, computed as
            {' '}156543.03392&middot;cos(latitude)/2^zoom for this project&rsquo;s own latitude,
            not a fixed catalogue figure. Every metre-denominated quantity on this screen
            derives from it.
          </p>
          <p>
            <strong className="text-gov-navy">Radiometric normalisation.</strong>{' '}
            {radiometry.method}. Fitted on{' '}
            {radiometry.pif_pixel_count?.toLocaleString()} pseudo-invariant pixels
            (selection at the {radiometry.pif_selection_percentile}th percentile, residual
            cut {radiometry.pif_residual_dn} DN); residual{' '}
            {radiometry.residual_before} &rarr; {radiometry.residual_after} DN
            {radiometry.improvement_pct != null && ' (' + radiometry.improvement_pct + '% better)'}.
            Histogram matching was replaced here because it forces the whole distribution to
            agree, erasing genuine change along with the illumination difference.
          </p>
          {calib.applied && (
            <p>
              <strong className="text-gov-navy">Epoch calibration.</strong> The 2023 basemap
              carries a measured green cast (ExG +0.115 against a 2018 baseline of 0.000).
              Uncorrected it reclassified the median scene from 9% to 78% vegetation.
              Residual offsets removed here: ExG {calib.exg_offset}, VARI {calib.vari_offset},
              measured over {calib.reference_px?.toLocaleString()} brightness-matched pixels.
            </p>
          )}
          <p>
            <strong className="text-gov-navy">Not computable on this sensor.</strong>{' '}
            NDBI and NDVI both require bands this imagery does not have (SWIR and NIR
            respectively), so neither is reported. Atmospheric correction is not meaningful
            on colour-balanced basemap composites: applying dark-object subtraction to a
            JPEG mosaic would be numerology. The indices used are the published visible-band
            ones, ExG (Woebbecke 1995) and VARI (Gitelson 2002).
          </p>
          <p>
            <strong className="text-gov-navy">All-weather layer.</strong>{' '}
            {sar.sar_available
              ? 'Sentinel-1 coherence ingested.'
              : sar.reason || 'No SAR scenes ingested in this deployment.'}
            {' '}Optical EO fails during the monsoon, which is exactly when construction
            disputes peak. The interface contract for that layer is defined and returns
            empty rather than plausible: a fabricated coherence value is indistinguishable
            from a measured one to a reviewer.
          </p>
          <p>
            <strong className="text-gov-navy">Centreline provenance.</strong>{' '}
            {corridor.basis || 'Radial envelope about the recorded coordinate.'}
          </p>
        </div>
      </details>

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
