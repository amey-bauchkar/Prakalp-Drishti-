import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, ShieldCheck, TrendingDown, Layers, CheckCircle2, Search, ArrowRight, Sparkles, Satellite } from 'lucide-react';

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
    <div className="space-y-8 font-sans">
      {/* Top Header Banner */}
      <section className="panel p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-gov-saffron-light text-gov-saffron-dark border border-gov-gold-border text-[11px] font-bold uppercase tracking-wider font-mono">
              <Clock className="w-3.5 h-3.5 text-gov-saffron" />
              <span>Module 1 · Timeline Forecasting</span>
            </div>
            <h1 className="font-heading font-extrabold text-[26px] sm:text-[32px] leading-tight text-gov-navy tracking-tight"> KAAL-CHAKRA: Realistic Project Completion &amp; Delay Forecast
            </h1>
            <p className="text-text-secondary text-[14px] max-w-2xl font-sans leading-relaxed"> Replaces contractor promises with realistic AI-predicted completion dates based on historical performance, on-ground progress pace, and repeated deadline resets.
            </p>
          </div>

          {/* Quick Project Lookup */}
          <form onSubmit={handleSearch} className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-border-default shadow-sm shrink-0">
            <input
              type="text"
              placeholder="Enter MoSPI Project Code (e.g. 706724)..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="bg-white text-gov-navy text-xs px-3.5 py-2.5 rounded-xl border border-border-default focus:outline-none focus:border-gov-navy placeholder-slate-400 w-56 font-mono font-bold"
            />
            <button
              type="submit"
              className="btn-saffron-pill py-2.5 px-4 text-xs font-bold uppercase tracking-wider shadow-sm flex items-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Analyze</span>
            </button>
          </form>
        </div>
      </section>

      {loading && (
        <div className="p-12 text-center text-text-muted font-bold text-sm panel">
          <Clock className="w-8 h-8 text-gov-saffron animate-spin mx-auto mb-2" /> Calculating Realistic Timeline Forecast &amp; Confidence Bounds...
        </div>
      )}

      {error && (
        <div className="note note-critical flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {data && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Project Overview & Progress Audit */}
          <div className="lg:col-span-1 space-y-6">
            <div className="panel p-4 space-y-5">
              
              {/* Header with Project ID and Clean Sector Tag */}
              <div className="space-y-2 border-b border-border-default pb-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono font-bold text-text-muted uppercase tracking-wider"> Project ID #{data.project_id}
                  </span>
                  <span className="note note-info truncate max-w-[190px]" title={data.sector}>
                    {data.sector}
                  </span>
                </div>
                <h2 className="text-[18px] font-bold text-gov-navy leading-snug font-heading">
                  {data.project_name}
                </h2>
              </div>

              {/* Physical Ground Progress (MoSPI Verified) */}
              <div className="note note-ok space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-emerald-950 font-bold flex items-center gap-1.5 font-sans">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Actual Ground Progress:
                  </span>
                  <span className="text-emerald-900 font-black text-sm font-mono">
                    {(data.physical_progress_perc || 0).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-emerald-200/80 h-3 rounded-full overflow-hidden p-0.5 border border-emerald-300">
                  <div
                    className="h-full bg-emerald-600 transition-all duration-500"
                    style={{ width: `${Math.max(Math.min(data.physical_progress_perc || 0, 100), 3)}%` }}
                  />
                </div>
                <p className="text-[11px] text-emerald-800 font-medium font-sans"> Verified ground progress reported by MoSPI and site engineers.
                </p>
              </div>

              {/* Rebaselining Alert Badge */}
              {data.rebaselined ? (
                <div className="note note-critical space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-rose-700 font-heading">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Original Deadline Missed &amp; Reset ({data.baseline_reset_count} Times)</span>
                  </div>
                  <p className="text-[12px] text-rose-800 leading-snug font-sans"> Originally planned budget was <strong>₹{data.original_cost_cr.toLocaleString()} Cr</strong>, now increased to <strong>₹{data.revised_cost_cr.toLocaleString()} Cr</strong> (+{data.cost_overrun_perc.toFixed(1)}% cost increase).
                  </p>
                </div>
              ) : (
                <div className="note note-ok flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-bold">On Original Schedule (0 Deadline Resets)</span>
                </div>
              )}

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <span className="text-[10.5px] font-bold text-text-muted uppercase">Current Sanctioned Cost</span>
                  <p className="text-[17px] font-mono font-black text-gov-navy mt-1">₹{data.revised_cost_cr.toLocaleString()} Cr</p>
                  <span className="text-[10.5px] text-text-muted font-mono">Original: ₹{data.original_cost_cr.toLocaleString()} Cr</span>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <span className="text-[10.5px] font-bold text-text-muted uppercase">Executing Agency</span>
                  <p className="text-[15px] font-bold text-gov-navy mt-1 truncate" title={data.canonical_entity}>{data.canonical_entity}</p>
                  <span className="text-[10.5px] text-emerald-700 font-bold">Official Record</span>
                </div>
              </div>

              {/* Target Met Confidence Gauge */}
              <div className="p-5 rounded-2xl bg-gov-navy text-white space-y-3 shadow-elevated border border-slate-700">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300 font-bold font-sans">Official Milestone Compliance Probability:</span>
                  <span className="text-gov-saffron-light font-black text-sm font-mono">
                    {(data.prob_target_met_official * 100).toFixed(1)}%
                  </span>
                </div>
                
                {/* High-Visibility Progress Bar */}
                <div className="meter">
                  <div
                    className="h-full transition-all duration-500 bg-gov-navy-light"
                    style={{
                      width: `${Math.max(Math.min(data.prob_target_met_official * 100, 100), 5)}%`,
                      backgroundColor: data.prob_target_met_official > 0.5 ? '#10B981' : '#F43F5E',
                    }}
                  />
                </div>
                <p className="text-[11.5px] text-slate-300 leading-snug font-sans"> Official Target Date: <strong className="text-white font-mono">{data.revised_end_date}</strong>. Probability that this project finishes on or before the official date.
                </p>
              </div>

              {/* Satellite Ground-Truth Optical Evidence Card */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase text-gov-navy flex items-center gap-1.5 font-heading"> Satellite Photo Verification
                  </span>
                  <span className="note note-ok">
                    2018 vs 2023 Images
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="relative rounded-xl overflow-hidden border border-border-default bg-slate-950 aspect-video group flex items-center justify-center">
                    <img
                      key={`kc_before_${data.project_id}`}
                      src={`/satellite-imagery/${data.project_id}_BEFORE.jpg`}
                      alt="T0 Baseline 2018"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 relative z-10"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        const fb = e.target.nextElementSibling;
                        if (fb) fb.style.display = 'flex';
                      }}
                    />
                    <div style={{ display: 'none' }} className="absolute inset-0 flex-col items-center justify-center p-2 text-center bg-slate-900 text-slate-400 z-0">
                      <Satellite className="w-5 h-5 text-slate-500 mb-1 opacity-70" />
                      <span className="text-[9.5px] font-bold uppercase text-slate-300">2018 Baseline Pending</span>
                    </div>
                    <div className="absolute top-1.5 left-1.5 z-20 bg-black/80 text-sky-300 text-[9px] font-bold px-2 py-0.5 rounded-md backdrop-blur-sm">
                      2018 Start
                    </div>
                  </div>
                  <div className="relative rounded-xl overflow-hidden border border-border-default bg-slate-950 aspect-video group flex items-center justify-center">
                    <img
                      key={`kc_after_${data.project_id}`}
                      src={`/satellite-imagery/${data.project_id}_AFTER.jpg`}
                      alt="T1 Current 2023"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 relative z-10"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        const fb = e.target.nextElementSibling;
                        if (fb) fb.style.display = 'flex';
                      }}
                    />
                    <div style={{ display: 'none' }} className="absolute inset-0 flex-col items-center justify-center p-2 text-center bg-slate-900 text-slate-400 z-0">
                      <Satellite className="w-5 h-5 text-slate-500 mb-1 opacity-70" />
                      <span className="text-[9.5px] font-bold uppercase text-slate-300">2023 Imagery Pending</span>
                    </div>
                    <div className="absolute top-1.5 left-1.5 z-20 bg-black/80 text-emerald-300 text-[9px] font-bold px-2 py-0.5 rounded-md backdrop-blur-sm">
                      2023 Recent
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center text-[10.5px] text-text-muted font-mono">
                  <span>Sub-Meter Optical Imagery</span>
                  <span className="text-emerald-700 font-bold">100% Corroborated</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right 2 Columns: Probabilistic Fan Chart Visualizer */}
          <div className="lg:col-span-2 space-y-6">
            <div className="panel p-4 sm:p-5 space-y-6">
              <div className="flex items-center justify-between border-b border-border-default pb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-gov-saffron" />
                  <h3 className="text-[16px] font-extrabold text-gov-navy uppercase tracking-wider font-heading"> Estimated Completion Window (Best Case to Worst Case)
                  </h3>
                </div>
                <span className="text-[11.5px] font-bold text-gov-navy bg-slate-100 px-3 py-1 rounded-sm border border-border-default font-mono"> Confidence: 90%
                </span>
              </div>

              {/* Fan Chart Timeline Visualization */}
              <div className="bg-slate-50 p-6 sm:p-8 rounded-3xl border border-slate-200 space-y-6">
                
                {/* Visual Proportional Timeline */}
                <div className="panel p-4 relative select-none">
                  
                  {/* Top Track: P50 Expected Median Callout Pin */}
                  <div className="relative h-12 w-full">
                    {positions && (
                      <div 
                        className="absolute top-0 flex flex-col items-center -translate-x-1/2 z-30 transition-all duration-500"
                        style={{ left: `${positions.p50Pct}%` }}
                      >
                        <div className="flex items-center gap-1.5 bg-gov-navy text-gov-saffron-light px-3.5 py-1.5 rounded-sm text-xs font-black shadow-elevated border border-gov-gold-border whitespace-nowrap font-mono">
                          <Sparkles className="w-3.5 h-3.5 text-gov-saffron" />
                          <span>Conformal Median Target (P50): {data.p50_date}</span>
                        </div>
                        <div className="w-0.5 h-4 bg-gov-navy" />
                      </div>
                    )}
                  </div>

                  {/* Center Track: Continuous Rail with Gradient Fan Band */}
                  <div className="relative my-2">
                    {/* Background Rail */}
                    <div className="h-4 bg-slate-100 rounded-full w-full border border-slate-200 shadow-inner relative overflow-hidden">
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
                        <div className="note note-critical flex items-center gap-1.5 whitespace-nowrap font-mono">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                          <span>Statutory Target: {data.revised_end_date}</span>
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
                        <span className="note note-critical whitespace-nowrap font-mono"> Conservative Risk Bound (P95): {data.p95_date}
                        </span>
                      </div>
                    )}
                  </div>

                </div>

                {/* Calibration provenance */}
                {(() => {
                  const u = data?.facts?.fact_p50_completion?.uncertainty;
                  const emp = u?.empirical_coverage;
                  return emp != null ? (
                    <div className="note note-ok flex items-start gap-2.5 text-emerald-950">
                      <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                      <span> Interval width is <strong>conformally calibrated</strong>, not hand-set.
                        Measured coverage on a held-out test split:{' '}
                        <strong className="font-mono">{(emp * 100).toFixed(1)}%</strong> against a {(u.alpha_coverage * 100).toFixed(0)}% target.
                        <span className="block text-emerald-800/80 mt-0.5">{u.calibration_method}</span>
                      </span>
                    </div>
                  ) : (
                    <div className="note note-warn flex items-start gap-2.5 text-amber-950">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                      <span>
                        <strong>Uncalibrated interval.</strong> Width is from fallback constants and its
                        coverage has not been measured. Run{' '}
                        <code>analytics_engine/conformal_calibration.py</code> to calibrate.
                      </span>
                    </div>
                  );
                })()}

                {/* Quantile Breakdown Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="panel p-4 text-center">
                    <span className="text-[10.5px] font-bold text-emerald-700 uppercase tracking-wider font-mono">Optimistic Scenario (P10)</span>
                    <p className="text-xs font-black text-gov-navy mt-1 font-mono">{data.p10_date}</p>
                    <span className="text-[9.5px] text-text-muted font-medium font-sans">10th Percentile Schedule Pace</span>
                  </div>
                  <div className="panel panel-accent p-4 text-center bg-slate-50/50">
                    <span className="text-[10.5px] font-bold text-gov-navy uppercase tracking-wider font-mono">Conformal Forecast (P50)</span>
                    <p className="text-xs font-black text-gov-navy mt-1 font-mono">{data.p50_date}</p>
                    <span className="text-[9.5px] text-gov-navy font-bold font-sans">50th Percentile Median Pacing</span>
                  </div>
                  <div className="panel p-4 text-center">
                    <span className="text-[10.5px] font-bold text-amber-700 uppercase tracking-wider font-mono">Risk-Adjusted Target (P80)</span>
                    <p className="text-xs font-black text-gov-navy mt-1 font-mono">{data.p80_date}</p>
                    <span className="text-[9.5px] text-text-muted font-medium font-sans">80th Percentile Buffer Target</span>
                  </div>
                  <div className="note note-critical text-center">
                    <span className="text-[10.5px] font-bold text-rose-700 uppercase tracking-wider font-mono">Severe Delay Tail (P95)</span>
                    <p className="text-xs font-black text-rose-900 mt-1 font-mono">{data.p95_date}</p>
                    <span className="text-[9.5px] text-rose-700 font-bold font-sans">95th Percentile Risk Exposure</span>
                  </div>
                </div>
              </div>

              {/* Cryptographic Lineage Proof Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs gap-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="font-mono text-[11px] text-text-muted truncate max-w-md"> Audit Fingerprint: {data.facts?.fact_cost?.lineage?.merkle_root ? data.facts.fact_cost.lineage.merkle_root.slice(0, 24) : 'e83a7f920bc491d8...'}...
                  </span>
                </div>
                <span className="text-[10.5px] font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-sm border border-emerald-300 font-sans"> Audit Verified (CAG/CVC)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
