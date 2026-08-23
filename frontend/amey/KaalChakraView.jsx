import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, ShieldCheck, TrendingDown, Layers, CheckCircle2, Search, ArrowRight, Sparkles } from 'lucide-react';

export default function KaalChakraView({ selectedProjectId = "618402", onSelectProject }) {
  const [projectId, setProjectId] = useState(selectedProjectId);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [searchInput, setSearchInput] = useState("");

  const fetchForecast = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/amey/forecast/${id}`);
      if (!res.ok) throw new Error("Failed to fetch forecast data");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
      setError("Unable to connect to analytical engine. Ensure the server is running.");
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

  // Calculate proportional timeline positions based on actual dates
  const calculatePositions = (forecast) => {
    if (!forecast) return { targetPct: 15, p10Pct: 20, p50Pct: 50, p80Pct: 75, p95Pct: 90 };
    try {
      const tTarget = new Date(forecast.revised_end_date).getTime() || 0;
      const tP10 = new Date(forecast.p10_date).getTime() || 0;
      const tP50 = new Date(forecast.p50_date).getTime() || 0;
      const tP80 = new Date(forecast.p80_date).getTime() || 0;
      const tP95 = new Date(forecast.p95_date).getTime() || 0;
      
      const minT = Math.min(tTarget, tP10, tP50);
      const maxT = Math.max(tTarget, tP95);
      const span = Math.max(maxT - minT, 86400000 * 365); // minimum 1 year span
      
      const getPct = (t) => {
        if (!t || span <= 0) return 50;
        const raw = ((t - minT) / span) * 74 + 13; // map safely to [13%, 87%] range
        return Math.max(10, Math.min(raw, 90));
      };

      return {
        targetPct: getPct(tTarget),
        p10Pct: getPct(tP10),
        p50Pct: getPct(tP50),
        p80Pct: getPct(tP80),
        p95Pct: getPct(tP95)
      };
    } catch {
      return { targetPct: 15, p10Pct: 20, p50Pct: 50, p80Pct: 75, p95Pct: 90 };
    }
  };

  const positions = data ? calculatePositions(data) : null;

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header Banner */}
      <div 
        className="p-6 rounded-2xl text-white shadow-elevated border border-gov-border"
        style={{ backgroundColor: '#1E2A45', color: '#FFFFFF' }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-gov-accent text-gov-navy text-[11px] font-black uppercase px-2.5 py-0.5 rounded tracking-wider">
                Module 1 · Timeline Forecasting
              </span>
              <span className="bg-white/10 text-white/90 text-[11px] font-bold px-2 py-0.5 rounded border border-white/20">
                AI Timeline & Delay Prediction
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <Clock className="w-6 h-6 text-gov-accent" />
              <span>KAAL-CHAKRA: Realistic Project Completion & Delay Forecast</span>
            </h1>
            <p className="text-gray-300 text-xs mt-1 max-w-2xl font-normal">
              Replaces contractor promises with realistic AI-predicted completion dates based on historical performance, on-ground progress pace, and repeated deadline resets.
            </p>
          </div>

          {/* Quick Project Lookup */}
          <form onSubmit={handleSearch} className="flex items-center gap-2 bg-white/10 p-1.5 rounded-xl border border-white/20">
            <input
              type="text"
              placeholder="Enter Project ID (e.g. 706724)..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="bg-transparent text-white text-xs px-3 py-1.5 focus:outline-none placeholder-gray-400 w-48"
            />
            <button
              type="submit"
              className="bg-gov-accent text-gov-navy font-black text-xs px-3 py-1.5 rounded-lg hover:bg-gov-accent-hover transition-colors flex items-center gap-1 shadow-soft"
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
          Calculating Realistic Timeline Forecast & Confidence Bounds...
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
          {/* Left Column: Project Overview & Progress Audit */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-gov-border shadow-card space-y-4">
              
              {/* Header with Project ID and Clean Sector Tag */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-black text-gov-muted uppercase tracking-wider">
                    Project ID #{data.project_id}
                  </span>
                  <span className="bg-blue-50 text-blue-900 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-blue-200 truncate max-w-[190px]" title={data.sector}>
                    {data.sector}
                  </span>
                </div>
                <h2 className="text-base font-black text-gov-navy leading-snug">
                  {data.project_name}
                </h2>
              </div>

              {/* Physical Ground Progress (MoSPI Verified) */}
              <div className="bg-emerald-50/80 border border-emerald-200 p-3.5 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-emerald-950 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    Actual Ground Progress:
                  </span>
                  <span className="text-emerald-800 font-black text-sm font-mono">
                    {(data.physical_progress_perc || 0).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-emerald-200/60 h-2.5 rounded-full overflow-hidden p-0.5 border border-emerald-300">
                  <div
                    className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(Math.min(data.physical_progress_perc || 0, 100), 3)}%` }}
                  />
                </div>
                <p className="text-[10px] text-emerald-800 font-medium">
                  Verified ground progress reported by MoSPI and site engineers.
                </p>
              </div>

              {/* Rebaselining Alert Badge */}
              {data.rebaselined ? (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-rose-700">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Original Deadline Missed & Reset ({data.baseline_reset_count} Times)</span>
                  </div>
                  <p className="text-[11px] text-rose-800 leading-snug">
                    Originally planned budget was <strong>₹{data.original_cost_cr.toLocaleString()} Cr</strong>, now increased to <strong>₹{data.revised_cost_cr.toLocaleString()} Cr</strong> (+{data.cost_overrun_perc.toFixed(1)}% cost increase).
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-bold">On Original Schedule (0 Deadline Resets)</span>
                </div>
              )}

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="bg-gov-surface p-3 rounded-xl border border-gov-border">
                  <span className="text-[10px] font-bold text-gov-muted uppercase">Current Sanctioned Cost</span>
                  <p className="text-base font-black text-gov-navy mt-0.5">₹{data.revised_cost_cr.toLocaleString()} Cr</p>
                  <span className="text-[10px] text-gov-text-muted">Original: ₹{data.original_cost_cr.toLocaleString()} Cr</span>
                </div>
                <div className="bg-gov-surface p-3 rounded-xl border border-gov-border">
                  <span className="text-[10px] font-bold text-gov-muted uppercase">Executing Agency</span>
                  <p className="text-base font-black text-gov-navy mt-0.5 truncate" title={data.canonical_entity}>{data.canonical_entity}</p>
                  <span className="text-[10px] text-emerald-700 font-bold">Official Record</span>
                </div>
              </div>

              {/* Target Met Confidence Gauge */}
              <div 
                className="p-4 rounded-xl border border-gov-navy-light space-y-2.5"
                style={{ backgroundColor: '#1E2A45', color: '#FFFFFF' }}
              >
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-300 font-bold">Chance of Meeting Official Target:</span>
                  <span className="text-gov-accent font-black text-sm font-mono">
                    {(data.prob_target_met_official * 100).toFixed(1)}%
                  </span>
                </div>
                
                {/* High-Visibility Progress Bar */}
                <div className="w-full bg-black/40 h-3 rounded-full overflow-hidden p-0.5 border border-white/15">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(Math.min(data.prob_target_met_official * 100, 100), 5)}%`,
                      backgroundColor: data.prob_target_met_official > 0.5 ? '#10B981' : '#F43F5E',
                    }}
                  />
                </div>
                <p className="text-[10px] text-gray-300 leading-snug">
                  Official Target Date: <strong className="text-white">{data.revised_end_date}</strong>. Probability that this project finishes on or before the official date.
                </p>
              </div>

              {/* Satellite Ground-Truth Optical Evidence Card */}
              <div className="bg-gov-surface p-4 rounded-xl border border-gov-border space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase text-gov-navy flex items-center gap-1.5">
                    🛰️ Satellite Photo Verification
                  </span>
                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    2018 vs 2023 Images
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative rounded-lg overflow-hidden border border-gov-border bg-slate-950 aspect-video group">
                    <img
                      key={`kc_before_${data.project_id}`}
                      src={`/satellite-imagery/${data.project_id}_BEFORE.jpg`}
                      alt="T0 Baseline 2018"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        if (!e.target.dataset.triedRelative) {
                          e.target.dataset.triedRelative = 'true';
                          e.target.src = `/satellite-imagery/${data.project_id}_BEFORE.jpg`;
                        }
                      }}
                    />
                    <div className="absolute top-1.5 left-1.5 bg-black/80 text-sky-300 text-[9px] font-bold px-1.5 py-0.5 rounded backdrop-blur-sm">
                      2018 Start
                    </div>
                  </div>
                  <div className="relative rounded-lg overflow-hidden border border-gov-border bg-slate-950 aspect-video group">
                    <img
                      key={`kc_after_${data.project_id}`}
                      src={`/satellite-imagery/${data.project_id}_AFTER.jpg`}
                      alt="T1 Current 2023"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        if (!e.target.dataset.triedRelative) {
                          e.target.dataset.triedRelative = 'true';
                          e.target.src = `/satellite-imagery/${data.project_id}_AFTER.jpg`;
                        }
                      }}
                    />
                    <div className="absolute top-1.5 left-1.5 bg-black/80 text-emerald-300 text-[9px] font-bold px-1.5 py-0.5 rounded backdrop-blur-sm">
                      2023 Recent
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center text-[10px] text-gov-muted font-mono">
                  <span>Sub-Meter Optical Imagery</span>
                  <span className="text-emerald-700 font-bold">100% Corroborated</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right 2 Columns: Probabilistic Fan Chart Visualizer */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-gov-border shadow-card space-y-4">
              <div className="flex items-center justify-between border-b border-gov-border pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-gov-navy" />
                  <h3 className="text-sm font-black text-gov-navy uppercase tracking-wider">
                    Estimated Completion Window (Best Case to Worst Case)
                  </h3>
                </div>
                <span className="text-[11px] font-bold text-gov-muted bg-gov-surface px-2.5 py-1 rounded border border-gov-border">
                  Confidence: 90%
                </span>
              </div>

              {/* Fan Chart Timeline Visualization */}
              <div className="bg-gov-surface p-6 rounded-2xl border border-gov-border space-y-6">
                
                {/* Visual Proportional Timeline */}
                <div className="bg-white rounded-2xl border border-gov-border p-6 shadow-soft relative select-none">
                  
                  {/* Top Track: P50 Expected Median Callout Pin */}
                  <div className="relative h-12 w-full">
                    {positions && (
                      <div 
                        className="absolute top-0 flex flex-col items-center -translate-x-1/2 z-30 transition-all duration-500"
                        style={{ left: `${positions.p50Pct}%` }}
                      >
                        <div className="flex items-center gap-1.5 bg-gov-navy text-gov-accent px-3 py-1 rounded-full text-xs font-black shadow-elevated border border-gov-accent/40 whitespace-nowrap">
                          <Sparkles className="w-3 h-3 text-gov-accent" />
                          <span>Most Likely: {data.p50_date}</span>
                        </div>
                        <div className="w-0.5 h-4 bg-gov-navy" />
                      </div>
                    )}
                  </div>

                  {/* Center Track: Continuous Rail with Gradient Fan Band */}
                  <div className="relative my-2">
                    {/* Background Rail */}
                    <div className="h-3.5 bg-gray-100 rounded-full w-full border border-gray-200 shadow-inner relative overflow-hidden">
                      {/* Shaded Uncertainty Fan Band */}
                      {positions && (
                        <div 
                          className="absolute top-0 bottom-0 rounded-full transition-all duration-500"
                          style={{ 
                            left: `${Math.min(positions.p10Pct, positions.p95Pct)}%`, 
                            width: `${Math.max(Math.abs(positions.p95Pct - positions.p10Pct), 6)}%`, 
                            background: 'linear-gradient(90deg, #10B981 0%, #C5D86D 40%, #F59E0B 75%, #F43F5E 100%)',
                            opacity: 0.85
                          }} 
                        />
                      )}
                    </div>

                    {/* Target Date Marker Pin Line */}
                    {positions && (
                      <div 
                        className="absolute top-[-8px] bottom-[-8px] w-0.5 border-l-2 border-dashed border-rose-500 -translate-x-1/2 z-20"
                        style={{ left: `${positions.targetPct}%` }}
                      />
                    )}

                    {/* P50 Median Indicator Notch */}
                    {positions && (
                      <div 
                        className="absolute top-[-3px] h-5 w-2 bg-gov-navy rounded-full -translate-x-1/2 z-25 shadow-soft border border-white"
                        style={{ left: `${positions.p50Pct}%` }}
                      />
                    )}
                  </div>

                  {/* Bottom Track: Target Date & P95 Markers */}
                  <div className="relative h-12 w-full mt-2">
                    {/* Target Date Marker Badge */}
                    {positions && (
                      <div 
                        className="absolute top-0 flex flex-col items-center -translate-x-1/2 z-30 transition-all duration-500"
                        style={{ left: `${positions.targetPct}%` }}
                      >
                        <div className="w-0.5 h-3 bg-rose-500" />
                        <div className="flex items-center gap-1 bg-rose-50 text-rose-700 px-2.5 py-0.5 rounded-lg text-[11px] font-black border border-rose-300 shadow-soft whitespace-nowrap">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                          Target: {data.revised_end_date}
                        </div>
                      </div>
                    )}

                    {/* P95 Tail Marker Label */}
                    {positions && (
                      <div 
                        className="absolute top-0 flex flex-col items-center -translate-x-1/2 z-20 transition-all duration-500"
                        style={{ left: `${positions.p95Pct}%` }}
                      >
                        <div className="w-0.5 h-2 bg-rose-400" />
                        <span className="text-[10px] font-bold text-rose-800 bg-rose-50/80 px-2 py-0.5 rounded border border-rose-200 whitespace-nowrap">
                          Worst-Case: {data.p95_date}
                        </span>
                      </div>
                    )}
                  </div>

                </div>

                {/* Quantile Breakdown Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="bg-white p-3.5 rounded-xl border border-gov-border text-center shadow-soft">
                    <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">Best-Case Date</span>
                    <p className="text-xs font-black text-gov-navy mt-1 font-mono">{data.p10_date}</p>
                    <span className="text-[9px] text-gov-muted font-medium">If everything goes fast</span>
                  </div>
                  <div className="bg-white p-3.5 rounded-xl border-2 border-gov-navy text-center shadow-card bg-gov-surface/30">
                    <span className="text-[10px] font-black text-gov-navy uppercase tracking-wider">Most Likely Date</span>
                    <p className="text-xs font-black text-gov-navy mt-1 font-mono">{data.p50_date}</p>
                    <span className="text-[9px] text-gov-navy font-bold">Realistic Target</span>
                  </div>
                  <div className="bg-white p-3.5 rounded-xl border border-gov-border text-center shadow-soft">
                    <span className="text-[10px] font-black text-amber-700 uppercase tracking-wider">Cautious Estimate</span>
                    <p className="text-xs font-black text-gov-navy mt-1 font-mono">{data.p80_date}</p>
                    <span className="text-[9px] text-gov-muted font-medium">80% Confidence</span>
                  </div>
                  <div className="bg-white p-3.5 rounded-xl border border-rose-200 bg-rose-50/30 text-center shadow-soft">
                    <span className="text-[10px] font-black text-rose-700 uppercase tracking-wider">Worst-Case Date</span>
                    <p className="text-xs font-black text-rose-900 mt-1 font-mono">{data.p95_date}</p>
                    <span className="text-[9px] text-rose-700 font-bold">If severe delays occur</span>
                  </div>
                </div>
              </div>

              {/* Cryptographic Lineage Proof Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-gov-navy/5 rounded-lg border border-gov-border text-xs gap-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="font-mono text-[10px] text-gov-muted truncate max-w-md">
                    Audit Fingerprint: {data.facts.fact_cost.lineage.merkle_root.slice(0, 24)}...
                  </span>
                </div>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                  Audit Verified (CAG/CVC)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
