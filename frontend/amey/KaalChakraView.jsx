import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, ShieldCheck, TrendingDown, Layers, CheckCircle2, Search, ArrowRight, Sparkles } from 'lucide-react';

export default function KaalChakraView({ selectedProjectId = "400188", onSelectProject }) {
  const [projectId, setProjectId] = useState(selectedProjectId);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [searchInput, setSearchInput] = useState("");

  const fetchForecast = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/amey/forecast/${id}`);
      if (!res.ok) throw new Error("Failed to fetch forecast data");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
      setError("Unable to connect to local FastAPI backend. Ensure server is running on port 8000.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecast(projectId);
  }, [projectId]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setProjectId(searchInput.trim());
      if (onSelectProject) onSelectProject(searchInput.trim());
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-gov-navy via-gov-navy-light to-gov-navy p-6 rounded-2xl text-white shadow-elevated border border-gov-border">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-gov-accent text-gov-navy text-[11px] font-black uppercase px-2.5 py-0.5 rounded tracking-wider">
                Module 1 · Probabilistic Survival Analysis
              </span>
              <span className="bg-white/10 text-white/90 text-[11px] font-bold px-2 py-0.5 rounded border border-white/20">
                AFT Log-Logistic + Competing Risks
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <Clock className="w-6 h-6 text-gov-accent" />
              KAAL-CHAKRA: Schedule & Cost Survival Forecasting
            </h1>
            <p className="text-gov-muted-light text-xs mt-1 max-w-2xl">
              Replaces static deterministic milestones with rigorous, calibrated survival distributions (P10–P95), detecting rebaselining evasion and survival decay.
            </p>
          </div>

          {/* Quick Project Lookup */}
          <form onSubmit={handleSearch} className="flex items-center gap-2 bg-white/10 p-1.5 rounded-xl border border-white/20">
            <input
              type="text"
              placeholder="Enter Project ID (e.g. 400188)..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="bg-transparent text-white text-xs px-3 py-1.5 focus:outline-none placeholder-white/50 w-48"
            />
            <button
              type="submit"
              className="bg-gov-accent text-gov-navy font-black text-xs px-3 py-1.5 rounded-lg hover:bg-gov-accent-hover transition-colors flex items-center gap-1"
            >
              <Search className="w-3.5 h-3.5" />
              Analyze
            </button>
          </form>
        </div>
      </div>

      {loading && (
        <div className="p-12 text-center text-gov-muted font-bold text-sm bg-white rounded-xl border border-gov-border">
          <Clock className="w-8 h-8 text-gov-accent animate-spin mx-auto mb-2" />
          Fitting AFT Survival Curve & Computing Conformalized Coverage Bounds...
        </div>
      )}

      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {data && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Project Overview & Rebaselining Audit */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white p-5 rounded-xl border border-gov-border shadow-card space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-black text-gov-muted uppercase tracking-wider">Project ID #{data.project_id}</span>
                  <h2 className="text-base font-black text-gov-navy leading-tight mt-0.5">{data.project_name}</h2>
                </div>
                <span className="bg-gov-surface text-gov-navy text-[11px] font-bold px-2 py-0.5 rounded border border-gov-border">
                  {data.sector}
                </span>
              </div>

              {/* Rebaselining Alert Badge */}
              {data.rebaselined ? (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-900 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-rose-700">
                    <AlertTriangle className="w-4 h-4" />
                    <span>DPR Baseline Reset Detected (x{data.baseline_reset_count})</span>
                  </div>
                  <p className="text-[11px] text-rose-800 leading-snug">
                    Original sanctioned capex of <strong>₹{data.original_cost_cr.toLocaleString()} Cr</strong> was revised upwards to <strong>₹{data.revised_cost_cr.toLocaleString()} Cr</strong> (+{data.cost_overrun_perc.toFixed(1)}%).
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold">Original DPR Baseline Intact (0 Resets)</span>
                </div>
              )}

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-gov-surface p-3 rounded-lg border border-gov-border">
                  <span className="text-[10px] font-bold text-gov-muted uppercase">Sanctioned Capex</span>
                  <p className="text-base font-black text-gov-navy mt-0.5">₹{data.revised_cost_cr.toLocaleString()} Cr</p>
                  <span className="text-[10px] text-gov-text-muted">Original: ₹{data.original_cost_cr.toLocaleString()} Cr</span>
                </div>
                <div className="bg-gov-surface p-3 rounded-lg border border-gov-border">
                  <span className="text-[10px] font-bold text-gov-muted uppercase">Executing Entity</span>
                  <p className="text-base font-black text-gov-navy mt-0.5">{data.canonical_entity}</p>
                  <span className="text-[10px] text-emerald-700 font-bold">Canonical Verified</span>
                </div>
              </div>

              {/* Target Met Confidence Gauge */}
              <div className="p-4 bg-gov-navy text-white rounded-xl border border-gov-navy-light space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gov-muted-light font-bold">Official Target Compliance:</span>
                  <span className="text-gov-accent font-black text-sm">{(data.prob_target_met_official * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      data.prob_target_met_official > 0.5 ? 'bg-emerald-400' : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(data.prob_target_met_official * 100, 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-white/70">
                  Target Date: <strong>{data.revised_end_date}</strong>. AFT survival model flags a <strong>{(100 - data.prob_target_met_official * 100).toFixed(1)}%</strong> probability of target date slippage.
                </p>
              </div>
            </div>
          </div>

          {/* Right 2 Columns: Probabilistic Fan Chart Visualizer */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white p-5 rounded-xl border border-gov-border shadow-card space-y-4">
              <div className="flex items-center justify-between border-b border-gov-border pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-gov-navy" />
                  <h3 className="text-sm font-black text-gov-navy uppercase tracking-wider">
                    Conformalized Quantile Forecast (P10 – P95 Fan Chart)
                  </h3>
                </div>
                <span className="text-[11px] font-bold text-gov-muted bg-gov-surface px-2.5 py-1 rounded border border-gov-border">
                  90% Coverage Guarantee (M1 Monotone)
                </span>
              </div>

              {/* SVG Fan Chart Visualization */}
              <div className="bg-gov-surface p-6 rounded-xl border border-gov-border space-y-6">
                <div className="relative pt-6 pb-2">
                  {/* Timeline Bar */}
                  <div className="relative h-12 bg-white rounded-xl border border-gov-border-dark flex items-center px-4 shadow-soft">
                    {/* P10 - P95 Fan Band */}
                    <div className="absolute left-[15%] right-[10%] h-6 bg-gov-accent/20 border-y border-gov-accent rounded" />
                    {/* P50 Median Marker */}
                    <div className="absolute left-[45%] h-10 w-1 bg-gov-navy rounded flex flex-col items-center">
                      <span className="absolute -top-6 text-[10px] font-black text-gov-navy bg-gov-accent px-1.5 py-0.5 rounded shadow-soft whitespace-nowrap">
                        P50 Median: {data.p50_date}
                      </span>
                    </div>

                    {/* Official Target Marker */}
                    <div className="absolute left-[22%] h-10 w-0.5 bg-rose-500 border-l border-dashed border-rose-600 flex flex-col items-center">
                      <span className="absolute -bottom-6 text-[10px] font-black text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded border border-rose-300 whitespace-nowrap">
                        Target: {data.revised_end_date}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quantile Breakdown Cards */}
                <div className="grid grid-cols-4 gap-2 pt-2">
                  <div className="bg-white p-3 rounded-lg border border-gov-border text-center">
                    <span className="text-[10px] font-black text-emerald-700 uppercase">P10 Optimistic</span>
                    <p className="text-xs font-black text-gov-navy mt-1">{data.p10_date}</p>
                    <span className="text-[9px] text-gov-muted">Best 10% Outcome</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border-2 border-gov-navy text-center shadow-soft">
                    <span className="text-[10px] font-black text-gov-navy uppercase">P50 Expected</span>
                    <p className="text-xs font-black text-gov-navy mt-1">{data.p50_date}</p>
                    <span className="text-[9px] text-gov-muted">Statistical Median</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-gov-border text-center">
                    <span className="text-[10px] font-black text-amber-700 uppercase">P80 Conservative</span>
                    <p className="text-xs font-black text-gov-navy mt-1">{data.p80_date}</p>
                    <span className="text-[9px] text-gov-muted">80% Reliability</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-rose-200 bg-rose-50/50 text-center">
                    <span className="text-[10px] font-black text-rose-700 uppercase">P95 Tail Risk</span>
                    <p className="text-xs font-black text-rose-900 mt-1">{data.p95_date}</p>
                    <span className="text-[9px] text-rose-700 font-bold">Worst-Case Tail</span>
                  </div>
                </div>
              </div>

              {/* Cryptographic Lineage Proof Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-gov-navy/5 rounded-lg border border-gov-border text-xs gap-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="font-mono text-[10px] text-gov-muted truncate max-w-md">
                    Merkle Root: {data.facts.fact_cost.lineage.merkle_root.slice(0, 24)}...
                  </span>
                </div>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                  Audit Verifiable
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
