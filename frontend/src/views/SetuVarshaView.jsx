import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  CloudRain, GitBranch, Info, Satellite, TrendingDown, Waves, Layers,
} from 'lucide-react';

import SatelliteSwipeView from '../../amey/SatelliteSwipeView.jsx';
import VarshaStateProfiles from '../../janhavi/index.jsx';

const API = 'http://127.0.0.1:8000';

/**
 * Pillar 4 — SETU-VARSHA: climate shock and systemic contagion war room.
 *
 * One slider drives the whole causal chain in a single request:
 *
 *   rainfall departure -> state working-window contraction (VARSHA-SPEED)
 *                      -> per-project schedule delay
 *                      -> max-plus float absorption (SETU-GRAPH)
 *                      -> downstream locked capex
 *
 * Two things this view is careful about. Locked capital and direct exposure are
 * shown as separate figures, because 926 of the 2,207 projects carry no
 * dependency edges at all — a delay to one of those is real but it is not
 * contagion, and folding it into a "cascade" number would inflate it to most of
 * the portfolio. And the whole panel is labelled a scenario projection, because
 * the elasticities behind it are calibrated constants, not fitted coefficients.
 */

const cr = (v) =>
  v == null ? '—'
    : v >= 100000 ? `₹${(v / 100000).toFixed(2)}L Cr`
    : `₹${Number(v).toLocaleString('en-IN', { maximumFractionDigits: 0 })} Cr`;

const TABS = [
  { id: 'warroom', label: 'Contagion War Room',
    desc: 'Rainfall slider driving DAG cascade and locked capex', icon: Waves },
  { id: 'profiles', label: 'IMD State Profiles',
    desc: '20-year departure history and terrain elasticities', icon: Layers },
];

export default function SetuVarshaView({ selectedProjectId = '619092' }) {
  const [tab, setTab] = useState('warroom');
  const [anomaly, setAnomaly] = useState(15);
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(true);
  const timer = useRef(null);

  const run = useCallback((pct) => {
    setBusy(true);
    fetch(`${API}/api/janhavi/setu-varsha/cascade?rainfall_anomaly_pct=${pct}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setBusy(false); })
      .catch(() => setBusy(false));
  }, []);

  useEffect(() => { run(anomaly); /* eslint-disable-next-line */ }, []);

  // Debounced: dragging the slider fires continuously and each cascade walks the
  // whole DAG, so the request is deferred until the handle settles.
  const onSlide = (v) => {
    setAnomaly(v);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => run(v), 260);
  };

  const scenario = anomaly >= 30 ? 'Extreme monsoon regime'
    : anomaly > 0 ? 'Excess departure'
    : anomaly === 0 ? 'Normal IMD long-period average'
    : 'Deficient monsoon';

  return (
    <div className="space-y-5 font-sans">
      <div className="command-header p-5 sm:p-6">
        <div className="inline-flex items-center gap-2 pl-2 pr-2.5 py-0.5 rounded-sm bg-white/[0.07] text-[9.5px] font-extrabold tracking-institutional uppercase text-gov-accent border-l-2 border-gov-accent">
          <CloudRain className="w-3.5 h-3.5" />
          <span>PILLAR 4 · CLIMATE CONTAGION WAR ROOM</span>
        </div>
        <h2 className="font-heading font-extrabold text-[21px] sm:text-[25px] tracking-[-0.025em] text-white leading-[1.12] mt-2">
          SETU-VARSHA: MONSOON SHOCK ACROSS THE DEPENDENCY NETWORK
        </h2>
        <p className="text-[12.5px] text-ink-200 leading-relaxed max-w-2xl mt-1.5">
          Move the rainfall departure and watch it propagate: working windows contract by
          state, project schedules stretch, float absorbs what it can, and the remainder
          locks capital downstream.
        </p>
      </div>

      <nav className="engine-rail" role="tablist" aria-label="Setu-Varsha views">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button key={t.id} role="tab" aria-selected={active}
              onClick={() => setTab(t.id)}
              className={`engine-tab ${active ? 'active' : ''}`}>
              <span className="engine-tab-icon"><Icon className="w-3.5 h-3.5" strokeWidth={2} /></span>
              <span className="min-w-0 flex-1">
                <span className="engine-tab-name">{t.label}</span>
                <span className="engine-tab-desc">{t.desc}</span>
              </span>
            </button>
          );
        })}
      </nav>

      {tab === 'profiles' && <VarshaStateProfiles />}

      {tab === 'warroom' && (<>
      {/* ── The slider ───────────────────────────────────────────── */}
      <div className="panel">
        <div className="panel-head">
          <span className="panel-title"><Waves className="w-3.5 h-3.5" />IMD Rainfall Departure</span>
          <span className="panel-meta">{scenario}{busy ? ' · recomputing…' : ''}</span>
        </div>
        <div className="panel-body-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="microlabel">Deficient −50%</span>
            <span className="tag tag-warn">
              {anomaly > 0 ? '+' : ''}{anomaly}
              <span className="notation">%</span> departure from LPA
            </span>
            <span className="microlabel">Excess +50%</span>
          </div>
          <input
            type="range"
            min="-50" max="50" step="5"
            value={anomaly}
            onChange={(e) => onSlide(Number(e.target.value))}
            className="accent-gov-saffron"
          />
          <p className="text-[10.5px] text-gov-muted leading-snug mt-2">
            {data?.scenario_interpretation}
          </p>
        </div>
      </div>

      {/* ── Cascade read-out ─────────────────────────────────────── */}
      <div className="hairgrid hairgrid-4">
        <div className="metric-cell panel-critical">
          <span className="metric-label">Downstream Locked Capex</span>
          <span className="metric-value metric-neg">{cr(data?.downstream_locked_capex_cr)}</span>
          <span className="metric-sub">
            behind {data?.nodes_breaching_total_float ?? 0} projects that breach total float
          </span>
        </div>
        <div className="metric-cell">
          <span className="metric-label">Direct Exposure (No Downstream)</span>
          <span className="metric-value metric-warn">{cr(data?.isolated_direct_exposure_cr)}</span>
          <span className="metric-sub">
            {data?.isolated_projects_hit ?? 0} projects hit with no dependants
          </span>
        </div>
        <div className="metric-cell">
          <span className="metric-label">Projects in Cascade</span>
          <span className="metric-value">{data?.nodes_in_cascade ?? 0}</span>
          <span className="metric-sub">{data?.nodes_directly_hit ?? 0} directly weather-hit</span>
        </div>
        <div className="metric-cell">
          <span className="metric-label">Mean Climate Delay</span>
          <span className="metric-value">{(data?.mean_climate_delay_months ?? 0).toFixed(1)}</span>
          <span className="metric-sub">months of added slippage</span>
        </div>
      </div>

      <div className="note note-warn">
        <Info className="w-3.5 h-3.5 shrink-0 mt-px" />
        <span>
          <strong>Scenario projection, not a forecast.</strong> {data?.caveat}{' '}
          {data?.network_coverage_note}
        </span>
      </div>

      {/* ── Most exposed corridors ───────────────────────────────── */}
      <div className="panel">
        <div className="panel-head">
          <span className="panel-title"><GitBranch className="w-3.5 h-3.5" />Most Exposed Network Nodes</span>
          <span className="panel-meta">ranked by capital behind the delay</span>
        </div>
        <div className="panel-flush overflow-x-auto max-h-96">
          <table className="ledger">
            <thead>
              <tr>
                <th>Project</th>
                <th>State</th>
                <th>Sector</th>
                <th className="num">Climate Delay</th>
                <th className="num">Total Float</th>
                <th className="num">Capex</th>
                <th>Origin</th>
              </tr>
            </thead>
            <tbody>
              {(data?.affected || []).map((n) => (
                <tr key={n.project_id}>
                  <td>
                    <span className="font-semibold text-gov-navy">
                      {String(n.project_name || '').slice(0, 54)}
                    </span>
                    <span className="block text-[9.5px] font-mono text-gov-muted">#{n.project_id}</span>
                  </td>
                  <td className="text-[10.5px]">{n.state}</td>
                  <td className="text-[10.5px]">{n.sector}</td>
                  <td className="num font-semibold text-amber-700">{n.climate_delay_months} mo</td>
                  <td className="num text-gov-muted">{n.total_float_months} mo</td>
                  <td className="num">{cr(n.capex_cr)}</td>
                  <td>
                    {n.directly_hit
                      ? <span className="tag tag-warn"><CloudRain className="w-2.5 h-2.5" />Weather</span>
                      : <span className="tag tag-info"><GitBranch className="w-2.5 h-2.5" />Cascaded</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-3 py-2 border-t border-gov-border">
          <p className="text-[10px] text-gov-muted leading-snug">{data?.methodology}</p>
        </div>
      </div>

      {/* ── Ground truth alongside the model ─────────────────────── */}
      <div className="panel">
        <div className="panel-head">
          <span className="panel-title"><Satellite className="w-3.5 h-3.5" />Pinpoint Ground-Truth Verification</span>
          <span className="panel-meta">project #{selectedProjectId}</span>
        </div>
        <div className="panel-flush">
          <SatelliteSwipeView projectId={selectedProjectId} />
        </div>
      </div>
      </>)}
    </div>
  );
}
