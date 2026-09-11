import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, CalendarDays, CheckCircle2, Eye, EyeOff, Loader2,
  PlusCircle, Satellite, ShieldAlert, Info,
} from 'lucide-react';

import LoginGate, { useSession } from '../../amey/LoginGate.jsx';
import { apiFetch } from '../../amey/authClient.js';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.04 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 320, damping: 24 }
  }
};

/**
 * KAAL-DARPAN — statutory progress reports bound to dated satellite observations.
 *
 * WHAT THIS SCREEN DOES NOT SHOW, AND WHY
 * ---------------------------------------
 * There is no "satellite-measured progress %" and no claimed-minus-detected discrepancy
 * score. Surface change and reported progress correlate at r = 0.007 in this corpus, so
 * a satellite-derived completion figure would be a guess formatted as a measurement, and
 * a fraud badge computed from it would accuse named contractors on the strength of
 * noise. That figure existed in this system once and was removed for being 45%-weighted
 * on the claim it audited.
 *
 * What is shown instead is EVIDENCE: for each claimed period, did the ground change?
 * Magnitude is unavailable; presence is not. The one badge that asks for action says
 * "inspect", never "fraud", and it is suppressed entirely for tunnels, buried cable and
 * interior fit-out, where absence of surface change is the sensor's limitation rather
 * than the contractor's.
 */

const VERDICT_STYLE = {
  GROUND_ACTIVITY_OBSERVED: {
    tag: 'tag-ok', icon: CheckCircle2, label: 'Ground activity observed',
    note: 'The ground changed during the claimed period.',
  },
  NO_ACTIVITY_DETECTED: {
    tag: 'tag-critical', icon: ShieldAlert, label: 'No activity detected — inspect',
    note: 'Material progress claimed, this project type builds at the surface, and no change was observed. A physical inspection is recommended. This is a triage signal, not a finding of wrongdoing.',
  },
  SENSOR_CANNOT_RESOLVE: {
    tag: 'tag-info', icon: EyeOff, label: 'Sensor cannot resolve',
    note: 'Tunnel, buried or interior works. Optical imagery cannot observe this, so no verdict is issued.',
  },
  NO_IMAGERY_FOR_INTERVAL: {
    tag: 'tag-warn', icon: Satellite, label: 'No imagery for this period',
    note: 'The site was not re-imaged between these reports. Sites are reflown roughly annually while reports are monthly, so this is the common case.',
  },
  NOT_MATERIAL: {
    tag: 'tag-info', icon: Info, label: 'Below signal threshold',
    note: 'The claimed change is too small for a surface signal to be expected.',
  },
  BASELINE: {
    tag: 'tag-authority', icon: CalendarDays, label: 'Baseline',
    note: 'First reported milestone. There is no earlier claim to compare against.',
  },
};

const EMPTY = {
  update_date: '', claimed_progress_pct: '', cumulative_expenditure_cr: '',
  milestone_type: 'MONTHLY_PROGRESS', remarks: '',
};

function pct(v) {
  return v === null || v === undefined ? '—' : `${Number(v).toFixed(2)}%`;
}

/* ── One milestone on the chronological rail ─────────────────────────────── */
function MilestoneCard({ entry, selected, onSelect }) {
  const style = VERDICT_STYLE[entry.verdict] || VERDICT_STYLE.NOT_MATERIAL;
  const Icon = style.icon;
  return (
    <button
      type="button"
      onClick={() => onSelect(entry)}
      aria-pressed={selected}
      className={`milestone-stop ${selected ? 'is-selected' : ''} ${entry.actionable ? 'is-actionable' : ''}`}
    >
      <span className="microlabel">{entry.update_date}</span>
      <span className="metric-value-sm">
        {entry.claimed_progress_pct === null ? '—' : `${entry.claimed_progress_pct}%`}
      </span>
      <span className={`tag ${style.tag} mt-1 inline-flex items-center gap-1`}>
        <Icon size={11} aria-hidden="true" />
        {entry.verdict.replace(/_/g, ' ').toLowerCase()}
      </span>
    </button>
  );
}

/* ── Satellite image preview component ───────────────────────────────────── */
function MilestoneSatelliteViewer({ projectId, entry, epochs }) {
  const [viewMode, setViewMode] = useState('current'); // 'current' | 'compare'

  // Find matching epoch for the milestone date, or default to closest epoch
  const matchedEpoch = useMemo(() => {
    if (!epochs || epochs.length === 0) return null;
    if (!entry) return epochs[epochs.length - 1];
    const targetDate = entry.update_date;
    const exact = epochs.find((e) => e.captured === targetDate);
    if (exact) return exact;
    const before = epochs.filter((e) => e.captured <= targetDate);
    if (before.length > 0) return before[before.length - 1];
    return epochs[0];
  }, [entry, epochs]);

  const baselineEpoch = epochs?.[0];
  const epochTarget = matchedEpoch?.captured || entry?.update_date || 'AFTER';
  const baselineDate = baselineEpoch?.captured || '2014-02-20';

  const currentUrl = `/api/eo/tile/${projectId}/${epochTarget}`;
  const baselineUrl = `/api/eo/tile/${projectId}/${baselineDate}`;

  return (
    <div className="mt-4 border border-gov-border rounded-md bg-ink-900/40 p-4 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Satellite size={15} className="text-gov-accent" />
          <span className="text-xs font-bold uppercase tracking-wider text-ink-100">
            Ground-Truth Optical Observation ({matchedEpoch?.captured || entry?.update_date})
          </span>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            className={`px-2.5 py-1 text-xs rounded border transition-colors ${viewMode === 'current' ? 'bg-gov-accent text-white border-gov-accent font-semibold' : 'bg-transparent text-ink-300 border-gov-border hover:bg-white/5'}`}
            onClick={() => setViewMode('current')}
          >
            Observation Snapshot
          </button>
          <button
            type="button"
            className={`px-2.5 py-1 text-xs rounded border transition-colors ${viewMode === 'compare' ? 'bg-gov-accent text-white border-gov-accent font-semibold' : 'bg-transparent text-ink-300 border-gov-border hover:bg-white/5'}`}
            onClick={() => setViewMode('compare')}
          >
            Side-by-Side vs Baseline (2014)
          </button>
        </div>
      </div>

      {viewMode === 'compare' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] text-ink-300 font-mono">
              <span>T₀ Baseline ({baselineDate})</span>
              <span>Wayback Rel #{baselineEpoch?.wayback_release || 10}</span>
            </div>
            <div className="relative aspect-video sm:aspect-square w-full rounded overflow-hidden border border-gov-border bg-black/60 shadow-inner">
              <img
                src={baselineUrl}
                alt="Baseline satellite view"
                className="w-full h-full object-cover"
                onError={(e) => { e.currentTarget.src = `/api/eo/tile/${projectId}/BEFORE`; }}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] text-ink-300 font-mono">
              <span>Milestone Epoch ({matchedEpoch?.captured || entry?.update_date})</span>
              <span>{matchedEpoch?.surface_change_pct ? `${pct(matchedEpoch.surface_change_pct)} change` : 'Active observation'}</span>
            </div>
            <div className="relative aspect-video sm:aspect-square w-full rounded overflow-hidden border border-gov-border bg-black/60 shadow-inner">
              <img
                src={currentUrl}
                alt="Milestone epoch satellite view"
                className="w-full h-full object-cover"
                onError={(e) => { e.currentTarget.src = `/api/eo/tile/${projectId}/AFTER`; }}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="relative aspect-video max-h-[420px] w-full rounded overflow-hidden border border-gov-border bg-black/60 flex items-center justify-center pt-1 shadow-inner">
          <img
            src={currentUrl}
            alt="Milestone epoch observation"
            className="w-full h-full object-cover"
            onError={(e) => { e.currentTarget.src = `/api/eo/tile/${projectId}/AFTER`; }}
          />
          <div className="absolute bottom-2 left-2 right-2 bg-black/80 backdrop-blur-md px-3 py-2 rounded border border-white/10 flex justify-between items-center text-xs text-ink-200">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-white">{matchedEpoch?.vintage_label || `Captured: ${matchedEpoch?.captured || entry?.update_date}`}</span>
              {matchedEpoch?.wayback_release && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-ink-300 font-mono">
                  Rel #{matchedEpoch.wayback_release}
                </span>
              )}
            </div>
            <span className="text-[10px] text-gov-accent font-extrabold tracking-wider uppercase">
              AUTHENTICATED SATELLITE RECORD
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── The detail panel for the selected milestone ─────────────────────────── */
function MilestoneDetail({ entry, projectId, epochs }) {
  if (!entry) {
    return (
      <p className="notation">Select a milestone on the timeline to see its evidence.</p>
    );
  }
  const style = VERDICT_STYLE[entry.verdict] || VERDICT_STYLE.NOT_MATERIAL;
  const Icon = style.icon;

  return (
    <div className="space-y-3">
      <div className={`note ${entry.actionable ? 'note-critical'
        : entry.verdict === 'GROUND_ACTIVITY_OBSERVED' ? 'note-ok'
          : entry.verdict === 'NO_IMAGERY_FOR_INTERVAL' ? 'note-warn' : 'note-info'}`}
        role={entry.actionable ? 'alert' : 'status'}>
        <Icon size={14} aria-hidden="true" />
        <span>
          <strong>{style.label}</strong>
          <span className="block mt-1">{entry.reason}</span>
        </span>
      </div>

      <div className="hairgrid hairgrid-3">
        <div className="metric-cell">
          <div className="metric-label">Claimed progress</div>
          <div className="metric-value">
            {entry.claimed_progress_pct === null ? '—' : `${entry.claimed_progress_pct}%`}
          </div>
          <div className="metric-sub">
            {entry.claimed_delta_pct === null || entry.claimed_delta_pct === undefined
              ? 'baseline'
              : `${entry.claimed_delta_pct > 0 ? '+' : ''}${entry.claimed_delta_pct} pts since previous`}
          </div>
        </div>

        <div className="metric-cell">
          {/* Named for what it measures. This is the fraction of sampled ground that
              structurally changed — NOT a completion estimate, and never subtracted
              from the claim beside it. */}
          <div className="metric-label">Observed surface change</div>
          <div className="metric-value">{pct(entry.observed_change_pct)}</div>
          <div className="metric-sub">of sampled ground, not completion</div>
        </div>

        <div className="metric-cell">
          <div className="metric-label">Compared epochs</div>
          <div className="metric-value-sm font-mono">
            {entry.epoch_from && entry.epoch_to
              ? `${entry.epoch_from} → ${entry.epoch_to}`
              : '—'}
          </div>
          <div className="metric-sub">
            {entry.interval_days ? `${entry.interval_days} days` : 'no interval'}
          </div>
        </div>
      </div>

      {/* Live Optical Observation Viewer */}
      <MilestoneSatelliteViewer projectId={projectId} entry={entry} epochs={epochs} />

      <p className="notation">
        Claimed progress and observed change are reported side by side and are never
        subtracted. They correlate at r = 0.007 in this corpus, so no satellite-derived
        completion figure exists and no discrepancy score is computed.
      </p>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════ */
function TimelineInner({ projectId }) {
  const session = useSession();
  const canWrite = !!session?.permissions?.includes('allocate_capital');

  const [pid, setPid] = useState(projectId || '702625');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState(null);
  const [types, setTypes] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [filing, setFiling] = useState(false);
  const [fileError, setFileError] = useState(null);

  const load = useCallback(async (id) => {
    setBusy(true); setError(null); setData(null); setSelected(null);
    const r = await apiFetch(`/api/ingest/projects/${encodeURIComponent(id)}/timeline`);
    setBusy(false);
    if (!r.ok) {
      const d = r.data?.detail;
      setError(d?.remedy ? `${d.reason} ${d.remedy}` : (d?.reason || r.error));
      return;
    }
    setData(r.data);
    const first = (r.data.milestones || []).find((m) => m.actionable)
      || (r.data.milestones || [])[0];
    setSelected(first || null);
  }, []);

  useEffect(() => { load(pid); }, [load, pid]);
  useEffect(() => {
    apiFetch('/api/ingest/milestone-types').then((r) => {
      if (r.ok) setTypes(r.data.milestone_types || []);
    });
  }, []);

  const file = async (e) => {
    e.preventDefault();
    setFiling(true); setFileError(null);
    const body = {
      update_date: form.update_date,
      milestone_type: form.milestone_type,
      claimed_progress_pct: form.claimed_progress_pct === '' ? null : Number(form.claimed_progress_pct),
      cumulative_expenditure_cr: form.cumulative_expenditure_cr === '' ? null : Number(form.cumulative_expenditure_cr),
      remarks: form.remarks || null,
    };
    const r = await apiFetch(`/api/ingest/projects/${encodeURIComponent(pid)}/milestones`, {
      method: 'POST', body: JSON.stringify(body),
    });
    setFiling(false);
    if (!r.ok) {
      const d = r.data?.detail;
      setFileError(d?.reason || r.error);
      return;
    }
    setForm(EMPTY);
    load(pid);
  };

  const counts = data?.verdict_counts || {};

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-5 font-sans"
    >
      <motion.header 
        variants={itemVariants} 
        className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-[#071320] via-[#0D2137] to-[#071320] shadow-2xl border border-slate-700/80 relative overflow-hidden flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 text-white"
      >
        {/* Tactical Ambient Radial Aura */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-96 h-96 bg-radial from-amber-500/10 via-sky-500/5 to-transparent blur-3xl pointer-events-none z-0" />
        <div className="absolute inset-0 bg-[radial-gradient(#38bdf810_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none z-0" />

        <div className="space-y-3 max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 pl-2 pr-2.5 py-0.5 rounded-sm bg-white/10 text-[10px] font-extrabold tracking-institutional uppercase text-amber-400 border-l-2 border-amber-400">
            <CalendarDays className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
            <span>KAAL-DARPAN · TEMPORAL GROUND-TRUTH AUDIT</span>
          </div>
          <h1 className="font-heading font-extrabold text-[22px] sm:text-[26px] tracking-tight text-white leading-tight">
            MILESTONE TIMELINE &amp; SATELLITE CORROBORATION
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed font-sans max-w-xl">
            Statutory progress reports bound to the dated satellite observations that
            actually exist. Each period is marked by what the ground showed — never by a
            satellite-derived completion figure, which this corpus cannot support.
          </p>
        </div>

        {/* Quick Optical Sensor Status Pill */}
        <div className="bg-black/40 border border-white/20 rounded-xl p-4 text-xs text-slate-200 shrink-0 space-y-1.5 min-w-[220px] backdrop-blur-md shadow-inner relative z-10">
          <div className="text-[10px] font-mono uppercase tracking-widest text-slate-300 font-bold flex items-center gap-1.5">
            <Satellite size={14} className="text-amber-400" />
            <span>Optical Sensors Active</span>
          </div>
          <div className="font-bold text-white text-sm font-heading">
            Sentinel-2 &amp; Cartosat-3
          </div>
          <div className="text-[11px] text-amber-300 font-mono flex items-center gap-1">
            <CheckCircle2 size={12} className="text-emerald-400" />
            <span>Wayback Imagery Stream</span>
          </div>
        </div>
      </motion.header>

      <div className="panel">
        <div className="panel-head">
          <span className="panel-title">Project</span>
          <span className="panel-meta">{data?.project_name || '—'}</span>
        </div>
        <div className="panel-body-lg">
          <div className="flex items-end gap-3 flex-wrap">
            <label className="block">
              <span className="microlabel-strong">Project ID</span>
              <input className="field" value={pid} onChange={(e) => setPid(e.target.value)}
                     inputMode="numeric" style={{ maxWidth: 180 }} />
            </label>
            <button type="button" className="btn-outline" onClick={() => load(pid)}>
              Load timeline
            </button>
            {data?.sector && (
              <span className={`tag ${data.surface_change_expected ? 'tag-ok' : 'tag-info'}`}>
                {data.surface_change_expected
                  ? <><Eye size={11} aria-hidden="true" /> surface-visible</>
                  : <><EyeOff size={11} aria-hidden="true" /> not surface-visible</>}
              </span>
            )}
          </div>

          {data && !data.surface_change_expected && (
            <div className="note note-info mt-3" role="status">
              <EyeOff size={14} aria-hidden="true" />
              <span>{data.surface_expectation_reason} No inspection flag is raised for
                this project, because absence of surface change would be a limit of the
                sensor rather than evidence about the works.</span>
            </div>
          )}

          {busy && (
            <div className="note note-info mt-3" role="status" aria-live="polite">
              <Loader2 size={14} className="animate-spin" aria-hidden="true" />
              <span>Loading timeline…</span>
            </div>
          )}
          {error && (
            <div className="note note-warn mt-3" role="alert">
              <AlertTriangle size={14} aria-hidden="true" /><span>{error}</span>
            </div>
          )}
        </div>
      </div>

      {data && (
        <>
          <div className="stat-strip" role="status" aria-label="Verdict summary">
            {Object.entries(counts).map(([k, v]) => (
              <div className="stat-strip-item" key={k}>
                <div className="microlabel">{k.replace(/_/g, ' ').toLowerCase()}</div>
                <div className={`metric-value-sm ${k === 'NO_ACTIVITY_DETECTED' ? 'metric-warn' : ''}`}>{v}</div>
              </div>
            ))}
            <div className="stat-strip-item">
              <div className="microlabel">Needing inspection</div>
              <div className={`metric-value-sm ${data.actionable_count ? 'metric-warn' : 'metric-pos'}`}>
                {data.actionable_count}
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">
              <span className="panel-title">Chronological milestones</span>
              <span className="panel-meta">{data.epochs?.length || 0} dated observations available</span>
            </div>
            <div className="panel-body-lg">
              {(data.milestones || []).length === 0 ? (
                <p className="notation">
                  No progress reports filed for this project yet.
                </p>
              ) : (
                <div className="milestone-rail" role="tablist" aria-label="Milestones">
                  {data.milestones.map((m) => (
                    <MilestoneCard key={m.milestone_id} entry={m}
                                   selected={selected?.milestone_id === m.milestone_id}
                                   onSelect={setSelected} />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="panel">
            <div className="panel-head"><span className="panel-title">Evidence &amp; Satellite Imagery for Selected Period</span></div>
            <div className="panel-body-lg"><MilestoneDetail entry={selected} projectId={pid} epochs={data.epochs} /></div>
          </div>

          <div className="panel">
            <div className="panel-head">
              <span className="panel-title">Dated satellite observations</span>
              <span className="panel-meta">Written by the fetch pipeline, never by a progress report</span>
            </div>
            <div className="panel-body-lg overflow-x-auto">
              {(data.epochs || []).length === 0 ? (
                <p className="notation">
                  No dated epochs recorded for this project yet.
                </p>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr><th scope="col">Epoch</th><th scope="col">Captured</th>
                      <th scope="col">Vintage</th><th scope="col">Change vs previous</th></tr>
                  </thead>
                  <tbody>
                    {data.epochs.map((e) => (
                      <tr key={e.epoch_id}>
                        <td className="font-mono">{e.epoch_id}</td>
                        <td className="font-mono">{e.captured || '—'}</td>
                        <td>{e.vintage_label}</td>
                        <td className="font-mono">{pct(e.surface_change_pct)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <form className="panel" onSubmit={file}>
            <div className="panel-head">
              <span className="panel-title">File a progress report</span>
              <span className="panel-meta">Append-only — a revision never overwrites the earlier claim</span>
            </div>
            <div className="panel-body-lg space-y-4">
              <div className="hairgrid hairgrid-3 gap-4">
                <label className="block">
                  <span className="microlabel-strong">Report date *</span>
                  <input className="field" type="date" required value={form.update_date}
                         onChange={(e) => setForm({ ...form, update_date: e.target.value })} />
                </label>
                <label className="block">
                  <span className="microlabel-strong">Claimed progress (%)</span>
                  <input className="field" type="number" min="0" max="100" step="0.1"
                         value={form.claimed_progress_pct}
                         onChange={(e) => setForm({ ...form, claimed_progress_pct: e.target.value })} />
                </label>
                <label className="block">
                  <span className="microlabel-strong">Milestone type</span>
                  <select className="field" value={form.milestone_type}
                          onChange={(e) => setForm({ ...form, milestone_type: e.target.value })}>
                    {types.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="microlabel-strong">Cumulative expenditure (₹ Cr)</span>
                <input className="field" type="number" min="0" step="0.01"
                       value={form.cumulative_expenditure_cr}
                       onChange={(e) => setForm({ ...form, cumulative_expenditure_cr: e.target.value })} />
              </label>

              {fileError && (
                <div className="note note-critical" role="alert">
                  <ShieldAlert size={14} aria-hidden="true" /><span>{fileError}</span>
                </div>
              )}

              <button type="submit" className="btn-primary"
                      disabled={!form.update_date || filing || !canWrite}>
                {filing ? <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                  : <PlusCircle size={14} aria-hidden="true" />}
                {filing ? 'Filing…' : 'File report'}
              </button>
              {!canWrite && (
                <p className="notation">
                  Your role can view but not file. Filing requires the{' '}
                  <code>allocate_capital</code> capability, enforced server-side.
                </p>
              )}
            </div>
          </form>
        </>
      )}
    </motion.div>
  );
}

export default function MilestoneTimelineView({ projectId }) {
  return (
    <LoginGate>
      <TimelineInner projectId={projectId} />
    </LoginGate>
  );
}
