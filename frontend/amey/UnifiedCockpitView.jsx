import React, { useState, useEffect } from 'react';
import SatelliteViewer from './SatelliteViewer';
import CopilotChat from './CopilotChat';
import {
  Sparkles, Sliders, ShieldCheck, AlertCircle, ArrowRight, Zap, RefreshCw,
  Layers, CheckCircle2, Eye, FileText, Satellite, TrendingUp, Clock,
  DollarSign, Activity, ChevronRight, AlertTriangle, Calendar, Award,
  Cpu, GitBranch, Crosshair, Check
} from 'lucide-react';

export default function UnifiedCockpitView({ selectedProjectId = '618402', onSelectProject }) {
  const [projectId, setProjectId] = useState(selectedProjectId);
  const [inputVal, setInputVal] = useState(selectedProjectId);
  const [delayShock, setDelayShock] = useState(0);
  const [budgetPool, setBudgetPool] = useState(15000);
  const [riskKappa, setRiskKappa] = useState(0.75);
  const [simData, setSimData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sync when parent changes selectedProjectId
  useEffect(() => {
    if (selectedProjectId && selectedProjectId !== projectId) {
      setProjectId(selectedProjectId);
      setInputVal(selectedProjectId);
    }
  }, [selectedProjectId]);

  const runSimulation = (targetId = projectId) => {
    const idToRun = String(targetId || projectId).trim();
    if (!idToRun) return;
    setLoading(true);
    fetch('/api/amey/unified-simulation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: idToRun,
        delay_shock_months: parseFloat(delayShock),
        budget_pool_cr: parseFloat(budgetPool),
        risk_dial_kappa: parseFloat(riskKappa),
        enforce_ner_floor: true,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        setSimData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Simulation error:', err);
        setLoading(false);
      });
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    const cleanId = inputVal.trim();
    if (cleanId) {
      setProjectId(cleanId);
      if (onSelectProject) onSelectProject(cleanId);
      runSimulation(cleanId);
    }
  };

  useEffect(() => {
    runSimulation(projectId);
  }, [projectId]);

  const pct = (v, d = 1) => (Number.isFinite(v) ? (v * 100).toFixed(d) + '%' : '—');
  const cr = (v) => (Number.isFinite(v) ? '₹' + v.toLocaleString('en-IN') + ' Cr' : '—');
  const num = (v, suffix = '') => (Number.isFinite(v) ? v + suffix : '—');

  const forecast = simData?.forecast;
  const subgraph = simData?.subgraph;
  const alloc = simData?.allocation;
  const copilot = simData?.copilot;

  return (
    <div className="space-y-6 font-sans">
      {/* ═══════════════════════════════════════════════════════════════
          TOP BANNER (SOVEREIGN INSTITUTIONAL COMMAND HEADER)
          ═══════════════════════════════════════════════════════════════ */}
      <div className="command-header p-5 sm:p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
        <div className="space-y-2 max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 pl-2 pr-2.5 py-0.5 rounded-sm bg-white/[0.07] text-[9.5px] font-extrabold tracking-institutional uppercase text-gov-accent border-l-2 border-gov-accent">
            <Sparkles className="w-3.5 h-3.5 text-white" />
            <span>DECISION INTELLIGENCE</span>
          </div>
          <h2 className="font-heading font-extrabold text-[21px] sm:text-[25px] tracking-[-0.025em] text-white leading-[1.12]"> PROJECT RISK &amp; IMPACT SIMULATOR
          </h2>
          <p className="text-[12.5px] text-ink-200 leading-relaxed font-sans max-w-xl"> See the full picture in one place: simulate delays, see which connected projects get affected, re-balance budgets smartly, and verify ground progress with satellite imagery.
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 bg-black/25 p-2 rounded-sm border border-white/15 shrink-0">
          <input
            type="text"
            placeholder="Enter MoSPI Code (e.g. 706724)"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            className="text-[11.5px] bg-ink-900/80 text-white border border-white/20 rounded-sm px-2.5 py-1.5 focus:outline-none focus:border-gov-accent w-52 font-mono tracking-tight placeholder:text-ink-200"
          />
          <button
            type="submit"
            className="bg-gov-accent text-gov-navy-dark hover:bg-gov-accent-hover py-1.5 px-3.5 rounded-sm text-[11px] font-extrabold uppercase tracking-institutional flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Run Simulation</span>
          </button>
        </form>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          INTERACTIVE SIMULATION CONTROLS (SOVEREIGN SLIDER STUDIO)
          ═══════════════════════════════════════════════════════════════ */}
      <div className="hairgrid hairgrid-3">
        {/* Slider 1: Delay Shock */}
        <div className="p-4 flex flex-col justify-between gap-3">
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="microlabel-strong flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-gov-saffron" />
                <span>Schedule Shock Injection:</span>
              </span>
              <span className="tag tag-warn shrink-0 ml-2">
                {Number(delayShock) === 0 ? 'Baseline (0 Mo)' : `+${delayShock} Mo Shock`}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="36"
              step="1"
              value={delayShock}
              onChange={(e) => setDelayShock(e.target.value)}
              onMouseUp={() => runSimulation()}
              onTouchEnd={() => runSimulation()}
              className="accent-gov-saffron"
            />
          </div>
          <p className="text-[10.5px] text-gov-muted leading-snug"> Simulates downstream supply chain schedule contagion if this project slips.
          </p>
        </div>

        {/* Slider 2: Available Budget Pool */}
        <div className="p-4 flex flex-col justify-between gap-3">
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="microlabel-strong flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-gov-saffron" />
                <span>Quarterly Capex Envelope:</span>
              </span>
              <span className="tag shrink-0 ml-2">
                ₹{Number(budgetPool).toLocaleString()} Cr
              </span>
            </div>
            <input
              type="range"
              min="5000"
              max="35000"
              step="1000"
              value={budgetPool}
              onChange={(e) => setBudgetPool(e.target.value)}
              onMouseUp={() => runSimulation()}
              onTouchEnd={() => runSimulation()}
              className=""
            />
          </div>
          <p className="text-[10.5px] text-gov-muted leading-snug"> Total sanctioned capital available for linear programming optimization.
          </p>
        </div>

        {/* Slider 3: Caution Level */}
        <div className="p-4 flex flex-col justify-between gap-3">
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="microlabel-strong flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-gov-saffron" />
                <span>Risk Tolerance Dial:</span>
              </span>
              <span className="tag shrink-0 ml-2">
                {riskKappa < 0.35 ? 'Max Velocity' : riskKappa > 0.70 ? 'Delay-Shielded' : 'Risk-Neutral'}
                <span className="notation ml-1">(κ={Number(riskKappa).toFixed(2)})</span>
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="0.95"
              step="0.05"
              value={riskKappa}
              onChange={(e) => setRiskKappa(e.target.value)}
              onMouseUp={() => runSimulation()}
              onTouchEnd={() => runSimulation()}
              className=""
            />
          </div>
          <p className="text-[10.5px] text-gov-muted leading-snug"> Balances rapid completion yield against mitigation of systemic bottleneck delays.
          </p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          MAIN MULTI-ENGINE GRID (INTEGRATED SOVEREIGN TELEMETRY DOCKETS)
          ═══════════════════════════════════════════════════════════════ */}
      <div className="space-y-6">
        {/* Top Row: TIMELINE FORECAST & VITTA-VYUHA REBALANCING */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Card 1: TIMELINE FORECAST (Kaal-Chakra Survival Model) */}
          <div className="lg:col-span-6 panel overflow-hidden">
            {/* Header Docket Strip */}
            <div className="p-5 sm:p-6 border-b border-border-default bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1 max-w-md">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-sm text-[10px] font-extrabold uppercase tracking-wider text-gov-saffron-dark bg-gov-saffron-light border border-gov-gold-border font-mono">
                  <Clock className="w-3 h-3 text-gov-saffron" />
                  <span>TIMELINE FORECAST</span>
                </div>
                <h3 className="font-heading font-extrabold text-[17px] text-gov-navy leading-snug">
                  {forecast?.project_name}
                </h3>
                <div className="text-[11.5px] text-text-muted font-mono flex items-center gap-2">
                  <span>#{forecast?.project_id}</span>
                  <span>•</span>
                  <span>{forecast?.sector}</span>
                  <span>•</span>
                  <span>{forecast?.state}</span>
                </div>
              </div>

              <div className="sm:text-right panel p-3 shrink-0">
                <span className="text-[9.5px] uppercase font-bold text-text-muted block tracking-wider font-mono"> Conformal Median (P50)
                </span>
                <span className="text-[18px] font-heading font-black text-gov-saffron-dark font-mono block mt-0.5">
                  {forecast?.p50_date || '—'}
                </span>
              </div>
            </div>

            {/* Continuous Sovereign Telemetry Strip (No Generic Pastel Boxes) */}
            <div className="p-5 sm:p-6 space-y-5">
              <div className="grid grid-cols-3 divide-x divide-slate-200 bg-slate-50/80 rounded-xl border border-slate-200/90 py-3 text-center">
                <div className="px-3">
                  <span className="text-[10px] uppercase text-text-muted font-bold block mb-0.5 font-heading tracking-wider"> Sanctioned Capex
                  </span>
                  <span className="text-[16px] font-black text-gov-navy font-mono block">
                    {cr(forecast?.revised_cost_cr)}
                  </span>
                  <span className="text-[9.5px] text-text-muted block font-sans"> Sanctioned Baseline
                  </span>
                </div>

                <div className="px-3">
                  <span className="text-[10px] uppercase text-text-muted font-bold block mb-0.5 font-heading tracking-wider"> Physical Progress
                  </span>
                  <span className="text-[16px] font-black text-emerald-700 font-mono block">
                    {num(forecast?.physical_progress_perc, '%')}
                  </span>
                  <span className="text-[9.5px] text-emerald-800 font-bold block font-sans"> MoSPI Field Verified
                  </span>
                </div>

                <div className="px-3">
                  <span className="text-[10px] uppercase text-text-muted font-bold block mb-0.5 font-heading tracking-wider"> Target Confidence
                  </span>
                  <span className="text-[16px] font-black text-gov-navy font-mono block">
                    {pct(forecast?.prob_target_met_official)}
                  </span>
                  <span className="text-[9.5px] text-slate-500 font-bold block font-sans"> Milestone Probability
                  </span>
                </div>
              </div>

              {/* Conformal Quantile Horizon Ledger */}
              <div className="space-y-2.5 p-4 rounded-xl bg-slate-50/60 border border-slate-200">
                <div className="flex items-center justify-between text-[11px] font-mono font-bold text-slate-700">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>P10: <strong className="text-gov-navy">{forecast?.p10_date || '—'}</strong></span>
                  </div>
                  <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-gov-navy" />
                    <span>Median P50: <strong className="text-gov-navy">{forecast?.p50_date || '—'}</strong></span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span>P95 Tail: <strong className="text-gov-navy">{forecast?.p95_date || '—'}</strong></span>
                  </div>
                </div>

                <div className="meter">
                  <div className="bg-emerald-500 h-full w-[25%]" title="Best Case Window (P10)" />
                  <div className="bg-gov-navy h-full w-[50%]" title="Most Probable Window (P50)" />
                  <div className="bg-rose-500 h-full w-[25%]" title="Severe Risk Tail (P95)" />
                </div>

                <div className="text-[10.5px] text-text-muted text-right font-sans"> Calibrated via Weibull Accelerated Failure Time survival regression model.
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: SETU-GRAPH & VITTA-VYUHA Allocation */}
          <div className="lg:col-span-6 panel overflow-hidden">
            {/* Header Docket Strip */}
            <div className="p-5 sm:p-6 border-b border-border-default bg-slate-50/60 flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-sm text-[10px] font-extrabold uppercase tracking-wider text-gov-saffron-dark bg-gov-saffron-light border border-gov-gold-border font-mono">
                <GitBranch className="w-3 h-3 text-gov-saffron" />
                <span>NETWORK RISK &amp; BUDGET REBALANCING</span>
              </div>
              <span className="text-[11px] font-mono font-bold text-gov-navy bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs"> Simplex LP: {alloc?.solve_time_ms}ms
              </span>
            </div>

            <div className="p-5 sm:p-6 space-y-5">
              {/* Integrated Capital Allocation Strip */}
              <div className="grid grid-cols-2 divide-x divide-slate-200 bg-slate-50/80 rounded-xl border border-slate-200/90 p-4">
                <div className="pr-4">
                  <span className="text-[10.5px] uppercase text-text-muted font-bold block mb-1 font-heading tracking-wider"> Systemic Capital at Risk
                  </span>
                  <span className="text-[20px] font-black text-rose-600 font-mono block">
                    {cr(subgraph?.total_cascade_locked_p50_cr)}
                  </span>
                  <span className="text-[11px] text-text-muted block mt-1 font-sans"> Across {subgraph?.nodes?.length} linked network assets
                  </span>
                </div>

                <div className="pl-4">
                  <span className="text-[10.5px] uppercase text-text-muted font-bold block mb-1 font-heading tracking-wider"> Optimized Capex Allocation
                  </span>
                  <span className="text-[20px] font-black text-gov-navy font-mono block">
                    {cr(alloc?.total_allocated_cr)}
                  </span>
                  <span className="text-[11px] text-emerald-700 font-bold block mt-1 font-sans"> Completion Propensity: {alloc?.portfolio_completion_propensity_perc}%
                  </span>
                </div>
              </div>

              {/* Status Notice */}
              {alloc && alloc.focus_project_is_candidate === false && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[12px] text-slate-700 font-medium leading-relaxed flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>Project #{alloc.focus_project_id} is outside this quarter's priority reallocation pool. Select a high-capex candidate to see live fund adjustments.</span>
                </div>
              )}
              {alloc && alloc.focus_project_is_candidate === true && alloc.allocations?.find((a) => a.project_id === alloc.focus_project_id)?.is_ner && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[12px] text-slate-700 font-medium leading-relaxed flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                  <span>Project #{alloc.focus_project_id} is in the North-Eastern Region (protected by mandatory 10% statutory quota).</span>
                </div>
              )}

              {/* Statutory North-East Region (NER) Quota Bar */}
              <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center text-[11.5px] font-bold text-gov-navy">
                  <span>Mandatory 10% North-East Region (NER) Quota</span>
                  <span className="text-emerald-700 font-mono font-black">
                    {alloc?.ner_share_perc}% ({alloc?.ner_floor_met ? 'COMPLIANT' : 'NON-COMPLIANT'})
                  </span>
                </div>
                <div className="meter">
                  <div
                    className="bg-emerald-600 h-full transition-all"
                    style={{ width: `${Math.min(alloc?.ner_share_perc || 10, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            BOTTOM SECTION: UNIFIED FORENSIC AUDIT & EXECUTIVE DECISION BRIEF
            ═══════════════════════════════════════════════════════════════ */}
        <div className="panel overflow-hidden">
          {/* Shared Header Docket Strip */}
          <div className="p-5 sm:p-6 border-b border-border-default bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-sm text-[10px] font-extrabold uppercase tracking-wider text-gov-saffron-dark bg-gov-saffron-light border border-gov-gold-border font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-gov-saffron" />
                <span>INTEGRATED FORENSICS &amp; DECISION DIRECTIVES</span>
              </div>
              <span className="hidden sm:inline-block text-slate-300 font-mono">|</span>
              <h3 className="font-heading font-extrabold text-[15px] sm:text-[17px] text-gov-navy">
                Forensic Ground-Truth Audit &amp; Executive Decision Brief
              </h3>
            </div>
            <span className="text-[11px] font-mono font-bold text-gov-navy bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs shrink-0">
              Verified Dossier: #{projectId}
            </span>
          </div>

          {/* Unified Two-Column Inner Layout with Crisp Divider */}
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-border-default items-stretch">
            {/* Left Inner Column: Forensic Imagery & Ground Truth */}
            <div className="lg:col-span-6 flex flex-col">
              <SatelliteViewer projectId={projectId} className="flex-1 flex flex-col justify-between" />
            </div>

            {/* Right Inner Column: Executive Decision Brief, Action Directives & Copilot */}
            <div className="lg:col-span-6 p-5 sm:p-6 space-y-6 flex flex-col justify-between bg-slate-50/25">
              {/* Executive Summary Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-border-default">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gov-accent" />
                    <h4 className="font-heading font-extrabold text-[13px] uppercase tracking-wider text-gov-navy">
                      Executive Summary &amp; Ground Truth Context
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono text-gov-muted bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    Audit Certified
                  </span>
                </div>
                <p className="text-[12.5px] text-slate-700 leading-relaxed font-sans pt-1">
                  {copilot?.executive_summary}
                </p>
              </div>

              {/* Recommended Action Directives Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-border-default">
                  <span className="text-[11px] uppercase tracking-wider font-extrabold text-gov-navy block font-mono">
                    Recommended Action Directives
                  </span>
                  <span className="text-[10.5px] font-mono text-gov-muted">
                    {copilot?.action_items?.length || 0} Priority Items
                  </span>
                </div>

                <div className="divide-y divide-border-default">
                  {copilot?.action_items?.map((act, i) => (
                    <div
                      key={i}
                      className="py-3 first:pt-0 last:pb-0 text-[12.5px] space-y-1.5"
                    >
                      <div className="flex items-center justify-between font-bold mb-0.5">
                        <span className={`uppercase text-[10.5px] font-mono tracking-wider ${
                          act.priority === 'CRITICAL' ? 'text-rose-700 font-extrabold' : 'text-gov-accent'
                        }`}>
                          {act.category?.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] font-mono text-gov-muted"> Metric: {act.citing_fact_id}
                        </span>
                      </div>
                      <p className="text-[12px] text-slate-700 leading-relaxed">{act.finding}</p>
                      <p className="text-[12px] font-bold text-gov-navy mt-1 flex items-start gap-1.5">
                        <span>Recommendation: {act.recommendation}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interactive Ask the PMO Copilot Section */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between pb-2 border-b border-border-default">
                  <span className="text-[11px] uppercase tracking-wider font-extrabold text-gov-navy block font-mono">
                    Ask the PMO Copilot
                  </span>
                  <span className="text-[10px] font-mono text-gov-muted">
                    Fact-Grounded Engine
                  </span>
                </div>
                <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 shadow-xs">
                  <CopilotChat projectId={projectId} />
                </div>
              </div>

              {/* Provenance Merkle Footer */}
              <div className="pt-3 border-t border-border-default flex items-center justify-between gap-3 flex-wrap text-[10.5px] text-gov-muted">
                <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Every figure carries a SHA-256 Merkle inclusion proof</span>
                </div>
                <span className="font-mono text-[9.5px] text-gov-muted bg-slate-100 px-2 py-0.5 rounded-sm border border-slate-200">
                  Generated prose is rejected if citing unverified data
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
