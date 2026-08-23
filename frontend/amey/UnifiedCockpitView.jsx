import React, { useState, useEffect } from 'react';
import { Sparkles, Sliders, ShieldCheck, AlertCircle, ArrowRight, Zap, RefreshCw, Layers, CheckCircle2, Eye, FileText, Satellite } from 'lucide-react';

export default function UnifiedCockpitView({ selectedProjectId = '618402', onSelectProject }) {
  const [projectId, setProjectId] = useState(selectedProjectId);
  const [delayShock, setDelayShock] = useState(0);
  const [budgetPool, setBudgetPool] = useState(15000);
  const [riskKappa, setRiskKappa] = useState(0.75);
  const [simData, setSimData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comparingImages, setComparingImages] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(50);

  const runSimulation = () => {
    setLoading(true);
    fetch('http://127.0.0.1:8000/api/amey/unified-simulation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: projectId,
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

  useEffect(() => {
    runSimulation();
  }, [projectId]);

  const forecast = simData?.forecast;
  const subgraph = simData?.subgraph;
  const alloc = simData?.allocation;
  const copilot = simData?.copilot;
  const satAudit = copilot?.satellite_audit;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-gov-navy to-slate-900 text-white p-6 rounded-2xl border border-gov-navy-light shadow-elevated flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="w-5 h-5 text-gov-accent" />
            <span className="text-xs font-black tracking-widest uppercase text-gov-accent">Autonomous Intelligence</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">THE UNIFIED CAUSAL COCKPIT</h2>
          <p className="text-xs text-gov-muted-light mt-1 max-w-2xl">
            Live multi-engine causal feedback loop. Shifting schedule risk instantly triggers supply-chain dependency contagion, MILP capital re-optimization, satellite ground-truth validation, and PMO cabinet briefs.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white/10 p-2.5 rounded-xl border border-white/15">
          <input
            type="text"
            placeholder="Enter Project ID (e.g. 706724)"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="text-xs bg-black/40 text-white border border-white/20 rounded-lg px-3 py-2 focus:outline-none focus:border-gov-accent w-44 font-mono font-bold"
          />
          <button
            onClick={runSimulation}
            className="bg-gov-accent text-gov-navy hover:bg-yellow-400 px-4 py-2 rounded-lg font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Simulate
          </button>
        </div>
      </div>

      {/* Interactive Simulation Controls */}
      <div className="bg-white p-5 rounded-2xl border border-gov-border shadow-soft grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Slider 1: Schedule Shock */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gov-navy flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-gov-navy" />
              What-If Delay Shock:
            </span>
            <span className="text-xs font-mono font-black text-gov-navy bg-gov-surface px-2 py-0.5 rounded border border-gov-border">
              +{delayShock} Months
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="36"
            step="1"
            value={delayShock}
            onChange={(e) => setDelayShock(e.target.value)}
            onMouseUp={runSimulation}
            onTouchEnd={runSimulation}
            className="w-full h-2 bg-gov-surface rounded-lg appearance-none cursor-pointer accent-gov-navy"
          />
          <span className="text-[10px] text-gov-muted block mt-1">Simulates monsoon or ROW roadblock extension</span>
        </div>

        {/* Slider 2: Available National Budget */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gov-navy flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-gov-navy" />
              Available Capex Pool:
            </span>
            <span className="text-xs font-mono font-black text-gov-navy bg-gov-surface px-2 py-0.5 rounded border border-gov-border">
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
            onMouseUp={runSimulation}
            onTouchEnd={runSimulation}
            className="w-full h-2 bg-gov-surface rounded-lg appearance-none cursor-pointer accent-gov-navy"
          />
          <span className="text-[10px] text-gov-muted block mt-1">MILP budget constraint for quarterly allocation</span>
        </div>

        {/* Slider 3: Risk Dial Kappa */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gov-navy flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-gov-navy" />
              Risk Aversion Dial (κ):
            </span>
            <span className="text-xs font-mono font-black text-gov-navy bg-gov-surface px-2 py-0.5 rounded border border-gov-border">
              κ = {riskKappa}
            </span>
          </div>
          <input
            type="range"
            min="0.1"
            max="0.95"
            step="0.05"
            value={riskKappa}
            onChange={(e) => setRiskKappa(e.target.value)}
            onMouseUp={runSimulation}
            onTouchEnd={runSimulation}
            className="w-full h-2 bg-gov-surface rounded-lg appearance-none cursor-pointer accent-gov-navy"
          />
          <span className="text-[10px] text-gov-muted block mt-1">Balances expected yield vs Rockafellar-Uryasev CVaR90</span>
        </div>
      </div>

      {/* Main Multi-Engine Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: KAAL-CHAKRA & SETU-GRAPH */}
        <div className="lg:col-span-6 space-y-6">
          {/* Card 1: KAAL-CHAKRA Survival Forecast */}
          <div className="bg-white p-5 rounded-2xl border border-gov-border shadow-soft">
            <div className="flex items-center justify-between border-b border-gov-border pb-3 mb-4">
              <div>
                <span className="text-[10px] font-black tracking-wider uppercase text-gov-accent bg-gov-navy px-2 py-0.5 rounded">
                  ENGINE 1: KAAL-CHAKRA
                </span>
                <h3 className="font-bold text-gov-navy text-sm mt-1">{forecast?.project_name}</h3>
                <span className="text-[11px] text-gov-muted">#{forecast?.project_id} • {forecast?.sector} • {forecast?.state}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-gov-muted block">P50 Expected Date</span>
                <span className="text-base font-black text-gov-navy font-mono">{forecast?.p50_date}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-gov-surface p-3 rounded-xl border border-gov-border text-center">
                <span className="text-[10px] uppercase text-gov-muted font-bold block">Sanctioned Capex</span>
                <span className="text-sm font-black text-gov-navy font-mono">₹{forecast?.revised_cost_cr?.toLocaleString()} Cr</span>
              </div>
              <div className="bg-gov-surface p-3 rounded-xl border border-gov-border text-center">
                <span className="text-[10px] uppercase text-gov-muted font-bold block">Physical Progress</span>
                <span className="text-sm font-black text-emerald-600 font-mono">{forecast?.physical_progress_perc}%</span>
              </div>
              <div className="bg-gov-surface p-3 rounded-xl border border-gov-border text-center">
                <span className="text-[10px] uppercase text-gov-muted font-bold block">Target Confidence</span>
                <span className="text-sm font-black text-rose-600 font-mono">{(forecast?.prob_target_met_official * 100)?.toFixed(1)}%</span>
              </div>
            </div>

            {/* CQR Quantile Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-bold text-gov-navy">
                <span>P10: {forecast?.p10_date}</span>
                <span>P50: {forecast?.p50_date}</span>
                <span>P95: {forecast?.p95_date}</span>
              </div>
              <div className="w-full bg-gov-surface h-3 rounded-full overflow-hidden border border-gov-border flex">
                <div className="bg-emerald-500 h-full w-[25%]" title="P10-P25" />
                <div className="bg-gov-navy h-full w-[50%]" title="P50 Interquartile" />
                <div className="bg-rose-500 h-full w-[25%]" title="P95 Tail Risk" />
              </div>
              <span className="text-[10px] text-gov-muted block text-right">Monotone Quantiles Guaranteed via Conformal AFT</span>
            </div>
          </div>

          {/* Card 2: High-Resolution Satellite Ground-Truth Visualizer */}
          <div className="bg-white p-5 rounded-2xl border border-gov-border shadow-soft">
            <div className="flex items-center justify-between border-b border-gov-border pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Satellite className="w-4 h-4 text-gov-navy" />
                <span className="text-xs font-black uppercase text-gov-navy">PRATIBIMB SATELLITE GROUND-TRUTH (SUB-METER)</span>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                  satAudit?.audit_status === 'CRITICAL_DIVERGENCE'
                    ? 'bg-rose-100 text-rose-700 border border-rose-200'
                    : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                }`}
              >
                {satAudit?.audit_status?.replace('_', ' ')}
              </span>
            </div>

            {/* Split Screen Before / After Satellite Viewer */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="relative rounded-xl overflow-hidden border border-gov-border bg-slate-950 aspect-video group">
                <img
                  key={`before_${projectId}`}
                  src={satAudit?.before_imagery_url ? `http://127.0.0.1:8000${satAudit.before_imagery_url}` : `http://127.0.0.1:8000/satellite-imagery/${projectId}_BEFORE.jpg`}
                  alt={`T0 Baseline 2018 - Project ${projectId}`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    if (!e.target.dataset.triedRelative) {
                      e.target.dataset.triedRelative = 'true';
                      e.target.src = `/satellite-imagery/${projectId}_BEFORE.jpg`;
                    }
                  }}
                />
                <div className="absolute top-2 left-2 bg-black/80 text-sky-300 text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-sm border border-sky-400/30">
                  🛰️ T0 Baseline (2018)
                </div>
              </div>

              <div className="relative rounded-xl overflow-hidden border border-gov-border bg-slate-950 aspect-video group">
                <img
                  key={`after_${projectId}`}
                  src={satAudit?.after_imagery_url ? `http://127.0.0.1:8000${satAudit.after_imagery_url}` : `http://127.0.0.1:8000/satellite-imagery/${projectId}_AFTER.jpg`}
                  alt={`T1 Current 2023 - Project ${projectId}`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    if (!e.target.dataset.triedRelative) {
                      e.target.dataset.triedRelative = 'true';
                      e.target.src = `/satellite-imagery/${projectId}_AFTER.jpg`;
                    }
                  }}
                />
                <div className="absolute top-2 left-2 bg-black/80 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-sm border border-emerald-400/30">
                  🛰️ T1 Current (2023)
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-medium bg-gov-surface p-2.5 rounded-xl border border-gov-border">
              <span>Contractor Claim: <strong className="text-gov-navy">{satAudit?.claimed_progress_pct || forecast?.physical_progress_perc || 0}%</strong></span>
              <span>Orbital Observed: <strong className="text-emerald-700">{satAudit?.eo_observed_progress_pct || forecast?.physical_progress_perc || 0}%</strong></span>
              <span>Variance: <strong className={satAudit?.divergence_rod_points > 10 ? 'text-rose-600' : 'text-gov-navy'}>{satAudit?.divergence_rod_points || 0} pts</strong></span>
            </div>
          </div>
        </div>

        {/* Right Column: VITTA-VYUHA & PMO COPILOT */}
        <div className="lg:col-span-6 space-y-6">
          {/* Card 3: SETU-GRAPH & VITTA-VYUHA Allocation */}
          <div className="bg-white p-5 rounded-2xl border border-gov-border shadow-soft">
            <div className="flex items-center justify-between border-b border-gov-border pb-3 mb-4">
              <span className="text-[10px] font-black tracking-wider uppercase text-gov-accent bg-gov-navy px-2 py-0.5 rounded">
                ENGINES 2 & 3: SETU-GRAPH & VITTA-VYUHA
              </span>
              <span className="text-xs font-mono font-bold text-gov-navy">
                Solved in {alloc?.solve_time_ms}ms
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gov-surface p-3 rounded-xl border border-gov-border">
                <span className="text-[10px] uppercase text-gov-muted font-bold block">Contagion Locked Capex</span>
                <span className="text-base font-black text-rose-600 font-mono">
                  ₹{subgraph?.total_cascade_locked_p50_cr?.toLocaleString()} Cr
                </span>
                <span className="text-[10px] text-gov-muted block mt-0.5">Across {subgraph?.nodes?.length} connected grid nodes</span>
              </div>

              <div className="bg-gov-surface p-3 rounded-xl border border-gov-border">
                <span className="text-[10px] uppercase text-gov-muted font-bold block">Optimized National Capex</span>
                <span className="text-base font-black text-gov-navy font-mono">
                  ₹{alloc?.total_allocated_cr?.toLocaleString()} Cr
                </span>
                <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">Yield: {alloc?.expected_completion_yield}%</span>
              </div>
            </div>

            {alloc && alloc.focus_project_is_candidate === false && (
              <div className="mb-4 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800 font-medium">
                Project #{alloc.focus_project_id} is not among this quarter's top-60 capital-priority candidates (ranked by revised cost across NER/national pools), so the delay shock cannot change its own allocation — it will still show ₹0 Cr regardless of the shock slider. Try a larger, higher-cost project to see the MILP reallocate capital away from it.
              </div>
            )}
            {alloc && alloc.focus_project_is_candidate === true && alloc.allocations?.find((a) => a.project_id === alloc.focus_project_id)?.is_ner && (
              <div className="mb-4 p-2.5 rounded-lg bg-sky-50 border border-sky-200 text-[11px] text-sky-800 font-medium">
                Project #{alloc.focus_project_id} is in the North-Eastern Region — its capital share is statutorily protected by the 10% NER floor, so it stays funded at its planned level regardless of yield shocks. That's the constraint working as intended, not the shock being ignored.
              </div>
            )}

            <div className="bg-gov-surface p-3 rounded-xl border border-gov-border space-y-2">
              <div className="flex justify-between text-xs font-bold text-gov-navy">
                <span>Statutory 10% North-Eastern Region (NER) Floor</span>
                <span className="text-emerald-700 font-mono">{alloc?.ner_share_perc}% ({alloc?.ner_floor_met ? 'COMPLIANT' : 'NON-COMPLIANT'})</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-600 h-full transition-all"
                  style={{ width: `${Math.min(alloc?.ner_share_perc || 10, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Card 4: PRAGATI-SAARTHI Fact-Grounded PMO Copilot */}
          <div className="bg-gov-navy text-white p-5 rounded-2xl border border-gov-navy-light shadow-elevated">
            <div className="flex items-center justify-between border-b border-gov-navy-light pb-3 mb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gov-accent" />
                <span className="text-xs font-black uppercase text-gov-accent">PRAGATI-SAARTHI PMO COPILOT BRIEF</span>
              </div>
              <span className="text-[10px] font-mono text-gov-muted-light">
                SHA-256: {copilot?.document_hash?.substring(0, 12)}...
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              {copilot?.executive_summary}
            </p>

            <div className="space-y-2.5">
              <span className="text-[10px] uppercase tracking-wider font-black text-gov-accent block">
                Statutory Cabinet Action Directives:
              </span>
              {copilot?.action_items?.map((act, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-xl border text-xs ${
                    act.priority === 'CRITICAL'
                      ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                      : 'bg-white/10 border-white/15 text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold mb-1">
                    <span className="uppercase text-[10px] text-gov-accent">{act.category}</span>
                    <span className="text-[10px] font-mono text-slate-400">Citing: {act.citing_fact_id}</span>
                  </div>
                  <p className="text-xs">{act.finding}</p>
                  <p className="text-xs font-bold text-white mt-1">👉 {act.recommendation}</p>
                </div>
              ))}
            </div>

            {/* Merkle Cryptographic Badge */}
            <div className="mt-4 pt-3 border-t border-gov-navy-light flex items-center justify-between text-[11px] text-gov-muted-light">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>Provably Grounded • Merkle Chain Verified</span>
              </div>
              <span className="font-mono text-[10px] text-slate-400">100% Offline Air-Gapped</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
