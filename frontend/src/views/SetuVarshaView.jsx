import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CloudRain, GitBranch, Info, Satellite, TrendingDown, Waves, Layers,
} from 'lucide-react';

import SatelliteViewer from '../../amey/SatelliteViewer.jsx';
import VarshaStateProfiles from '../../janhavi/index.jsx';
import LoginGate from '../../amey/LoginGate.jsx';

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
  // The ground-truth panel used to be pinned to one hardcoded project while the
  // table above it ranked the most exposed nodes in the cascade. A reviewer
  // clicking the worst-affected project got imagery of an unrelated site with
  // no indication the two were disconnected. Selecting a row now drives the
  // panel, which is what the layout already implied it did.
  const [focusId, setFocusId] = useState(selectedProjectId);
  const [tab, setTab] = useState('warroom');
  const [anomaly, setAnomaly] = useState(15);
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const timer = useRef(null);

  const run = useCallback((pct) => {
    setBusy(true);
    setHasRun(true);
    fetch(`${API}/api/janhavi/setu-varsha/cascade?rainfall_anomaly_pct=${pct}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setBusy(false); })
      .catch(() => setBusy(false));
  }, []);

  // Debounced: dragging the slider only re-calculates if user has executed at least once
  const onSlide = (v) => {
    setAnomaly(v);
    if (!hasRun) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => run(v), 260);
  };

  const scenario = anomaly >= 30 ? 'Extreme monsoon regime'
    : anomaly > 0 ? 'Excess departure'
    : anomaly === 0 ? 'Normal IMD long-period average'
    : 'Deficient monsoon';

  return (
    <LoginGate>
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

        <AnimatePresence mode="wait">
          {tab === 'profiles' && (
            <motion.div
              key="profiles"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
            >
              <VarshaStateProfiles />
            </motion.div>
          )}

          {tab === 'warroom' && (
            <motion.div
              key="warroom"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
              className="space-y-5"
            >
              {/* ── The slider ───────────────────────────────────────────── */}
              <div className="panel bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Waves className="w-4 h-4 text-sky-600" />
                    IMD Rainfall Departure Simulation
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-500">{scenario}{busy ? ' · recomputing…' : ''}</span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 font-mono">Deficient −50%</span>
                    <span className="px-3 py-1 rounded-md text-xs font-black font-mono bg-sky-50 text-sky-800 border border-sky-200">
                      {anomaly > 0 ? '+' : ''}{anomaly}% departure from LPA
                    </span>
                    <span className="text-[11px] font-bold text-slate-400 font-mono">Excess +50%</span>
                  </div>
                  <input
                    type="range"
                    min="-50" max="50" step="5"
                    value={anomaly}
                    onChange={(e) => onSlide(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                  />
                  {data?.scenario_interpretation && (
                    <p className="text-xs text-slate-500 leading-snug">
                      {data.scenario_interpretation}
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                  <button
                    onClick={() => run(anomaly)}
                    disabled={busy}
                    className="w-full sm:w-auto min-w-[280px] bg-slate-100 hover:bg-sky-600 text-slate-800 hover:text-white border-2 border-slate-300 hover:border-sky-600 font-extrabold py-3.5 px-6 rounded-xl text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-200 shadow-xs hover:shadow-lg hover:shadow-sky-500/25 cursor-pointer disabled:opacity-50 group"
                  >
                    <CloudRain className="w-4 h-4 text-sky-600 group-hover:text-white transition-colors" />
                    <span>{busy ? 'Simulating Contagion…' : 'Simulate Climate Contagion'}</span>
                  </button>
                </div>
              </div>

              {/* Loading State */}
              {busy && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 flex flex-col items-center justify-center text-center space-y-4 min-h-[360px]">
                  <div className="w-12 h-12 rounded-full border-4 border-sky-500/20 border-t-sky-600 animate-spin" />
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-800 uppercase tracking-wider font-mono">Walking Max-Plus Dependency DAG…</p>
                    <p className="text-xs text-slate-500">Evaluating rainfall departures, state working windows, and downstream float absorption</p>
                  </div>
                </div>
              )}

              {/* Empty State Hero */}
              {!data && !busy && (
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-8 sm:p-12 flex flex-col items-center justify-center text-center space-y-6 min-h-[440px]">
                  <div className="w-16 h-16 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shadow-xs">
                    <CloudRain className="w-8 h-8" />
                  </div>
                  <div className="max-w-md space-y-2">
                    <h3 className="text-xl font-bold text-slate-800">
                      Ready to Simulate Climate Contagion
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Adjust the rainfall anomaly departure percentage above, then click <strong className="text-slate-700">"SIMULATE CLIMATE CONTAGION"</strong> to walk the 2,207 project dependency graph and compute downstream locked capex.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl pt-2">
                    <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100 flex flex-col items-center text-center space-y-2">
                      <div className="w-8 h-8 rounded-lg bg-sky-100/60 text-sky-700 flex items-center justify-center">
                        <Waves className="w-4 h-4" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-700">IMD Departure Modeling</h4>
                      <p className="text-[11px] text-slate-500 leading-tight">Quantifies rainfall deviation from 50-year long-period averages</p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100 flex flex-col items-center text-center space-y-2">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100/60 text-indigo-700 flex items-center justify-center">
                        <GitBranch className="w-4 h-4" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-700">Max-Plus DAG Cascade</h4>
                      <p className="text-[11px] text-slate-500 leading-tight">Tracks buffer absorption across inter-project critical paths</p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100 flex flex-col items-center text-center space-y-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-100/60 text-amber-700 flex items-center justify-center">
                        <TrendingDown className="w-4 h-4" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-700">Locked Capex Exposure</h4>
                      <p className="text-[11px] text-slate-500 leading-tight">Separates isolated delay from true systemic domino risk</p>
                    </div>
                  </div>
                </div>
              )}

              {data && !busy && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.28, ease: "easeOut" }}
                  className="space-y-5"
                >
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
                            <tr
                              key={n.project_id}
                              onClick={() => setFocusId(String(n.project_id))}
                              className={`cursor-pointer transition-colors ${
                                String(n.project_id) === String(focusId)
                                  ? 'bg-gov-accent/10'
                                  : 'hover:bg-gov-muted-surface'
                              }`}
                              title="Show ground-truth imagery for this project"
                            >
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
                      <span className="panel-meta">
                        project #{focusId} &middot; select a row above to change
                      </span>
                    </div>
                    <div className="panel-flush">
                      <SatelliteViewer projectId={focusId} />
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </LoginGate>
  );
}
