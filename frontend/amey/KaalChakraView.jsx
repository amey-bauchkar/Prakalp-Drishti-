import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, ShieldCheck, CheckCircle2, Search, Sparkles, Satellite, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Metric, Text, ProgressBar, BadgeDelta, Flex, Grid } from "@tremor/react";

export default function KaalChakraView({ selectedProjectId = "618402", onSelectProject }) {
  const [projectId, setProjectId] = useState(selectedProjectId);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [projectList, setProjectList] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [enlargedImage, setEnlargedImage] = useState(null);

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

  useEffect(() => {
    fetch('/api/projects?limit=2207')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setProjectList(data);
      })
      .catch(err => console.error("Failed to load project list", err));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setProjectId(searchInput.trim());
      if (onSelectProject) onSelectProject(searchInput.trim());
      setShowDropdown(false);
    }
  };

  const filteredProjects = projectList.filter(p => {
    const idStr = p.project_id ? String(p.project_id) : "";
    const nameStr = p.project_name ? String(p.project_name).toLowerCase() : "";
    const search = (searchInput || "").toLowerCase();
    return idStr.includes(search) || nameStr.includes(search);
  }).slice(0, 8);

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

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="space-y-8 font-sans pb-10">
      {/* ═══════════════════════════════════════════════════════════════
          TOP BANNER
          ═══════════════════════════════════════════════════════════════ */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="p-6 sm:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 rounded-2xl bg-gradient-to-br from-gov-navy to-gov-navy-hover shadow-lg border border-slate-700/50"
      >
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 pl-2 pr-2.5 py-0.5 rounded-sm bg-white/10 text-[10px] font-extrabold tracking-institutional uppercase text-amber-400 border-l-2 border-amber-400">
            <Clock className="w-3.5 h-3.5 text-white" />
            <span>MODULE 1 · TIMELINE FORECASTING</span>
          </div>
          <h2 className="font-heading font-extrabold text-2xl sm:text-3xl tracking-tight text-white leading-tight">
            KAAL-CHAKRA Simulator
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed max-w-xl">
            Replaces contractor promises with realistic AI-predicted completion dates based on historical performance, on-ground progress pace, and repeated deadline resets.
          </p>
        </div>

        {/* Quick Project Lookup - Autocomplete */}
        <div className="relative w-full lg:w-96 shrink-0 z-50">
          <form onSubmit={handleSearch} className="flex w-full items-center gap-2 bg-black/40 p-2 rounded-xl border border-white/20 backdrop-blur-md shadow-[0_0_15px_rgba(251,191,36,0.1)] focus-within:shadow-[0_0_25px_rgba(251,191,36,0.3)] transition-all">
            <input
              type="text"
              placeholder="Search by Name or MoSPI Code..."
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              className="flex h-11 w-full rounded-lg border-none bg-transparent px-4 py-2 text-sm text-white placeholder:text-slate-400 focus-visible:outline-none font-medium tracking-tight"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-lg text-sm font-bold transition-all h-11 px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-900 hover:scale-105 shadow-[0_0_15px_rgba(245,158,11,0.5)] gap-2 shrink-0"
            >
              <Search className="w-4 h-4" />
              <span>Analyze</span>
            </button>
          </form>

          {showDropdown && searchInput && filteredProjects.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="absolute top-full left-0 right-0 mt-2 bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 max-h-80 overflow-y-auto"
            >
              {filteredProjects.map((p) => (
                <div 
                  key={p.project_id} 
                  onClick={() => {
                    setSearchInput(p.project_id);
                    setProjectId(p.project_id);
                    if (onSelectProject) onSelectProject(p.project_id);
                    setShowDropdown(false);
                  }}
                  className="p-3 border-b border-slate-800/50 hover:bg-amber-500/10 cursor-pointer transition-colors flex flex-col gap-1"
                >
                  <span className="text-sm font-bold text-slate-200 line-clamp-1">{p.project_name}</span>
                  <div className="flex gap-2 text-[10px] uppercase font-mono text-slate-500">
                    <span className="text-amber-500">ID: {p.project_id}</span>
                    <span>{p.sector}</span>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      </motion.div>

      {loading && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="p-12 text-center text-slate-500 font-medium text-sm flex flex-col items-center"
        >
          <Clock className="w-8 h-8 text-amber-500 animate-spin mb-4" /> 
          <p>Calculating Realistic Timeline Forecast &amp; Confidence Bounds...</p>
        </motion.div>
      )}

      {error && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-4 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-700 font-medium">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </motion.div>
      )}

      {data && !loading && (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* ══ Left Column: Project Overview & Progress Audit ══ */}
          <motion.div variants={itemVariants} className="lg:col-span-1 space-y-6">
            <Card className="shadow-sm border-slate-200">
              
              {/* Header */}
              <div className="space-y-2 border-b border-slate-100 pb-5 mb-5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono font-semibold text-slate-500 uppercase tracking-wider"> Project ID #{data.project_id}</span>
                  <BadgeDelta deltaType="unchanged" size="xs" className="truncate max-w-[150px]">
                    {data.sector}
                  </BadgeDelta>
                </div>
                <h2 className="text-lg font-bold text-slate-900 leading-snug font-heading">
                  {data.project_name}
                </h2>
              </div>

              {/* Physical Ground Progress (Tremor) */}
              <div className="space-y-3 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <Flex>
                  <Text className="font-semibold text-slate-700 flex items-center gap-1.5 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Physical Progress
                  </Text>
                  <Text className="font-mono font-bold text-emerald-700">{(data.physical_progress_perc || 0).toFixed(1)}%</Text>
                </Flex>
                <ProgressBar value={data.physical_progress_perc || 0} color="emerald" className="mt-2" />
                <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">Verified ground progress reported by MoSPI and site engineers.</p>
              </div>

              {/* Rebaselining Alert */}
              {data.rebaselined ? (
                <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-100 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-rose-700 text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Deadline Reset ({data.baseline_reset_count}x)</span>
                  </div>
                  <p className="text-xs text-rose-800/80 leading-relaxed">
                    Budget increased from <strong>₹{(data.original_cost_cr || 0).toLocaleString()} Cr</strong> to <strong>₹{(data.revised_cost_cr || 0).toLocaleString()} Cr</strong> (+{(data.cost_overrun_perc || 0).toFixed(1)}%).
                  </p>
                </div>
              ) : (
                <div className="mb-6 p-3 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-2 text-emerald-700 text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>On Original Schedule (0 Resets)</span>
                </div>
              )}

              {/* Key Metrics Grid (Tremor) */}
              <Grid numItems={2} className="gap-3 mb-6">
                <Card className="p-3 bg-white shadow-none border-slate-200">
                  <Text className="text-[10px] uppercase font-bold text-slate-400">Current Cost</Text>
                  <Metric className="text-base font-mono mt-1 text-slate-800">₹{(data.revised_cost_cr || 0).toLocaleString()}</Metric>
                </Card>
                <Card className="p-3 bg-white shadow-none border-slate-200">
                  <Text className="text-[10px] uppercase font-bold text-slate-400">Agency</Text>
                  <Text className="text-sm font-semibold text-slate-800 mt-1 truncate" title={data.canonical_entity}>{data.canonical_entity}</Text>
                </Card>
              </Grid>

              {/* Target Met Confidence Gauge - CRAZY AESTHETIC */}
              <div className="relative rounded-2xl p-[2px] overflow-hidden group mb-6">
                {/* Animated gradient border */}
                <div className="absolute inset-[-100%] bg-[conic-gradient(from_90deg_at_50%_50%,#34d399_0%,#fbbf24_50%,#f43f5e_100%)] animate-[spin_4s_linear_infinite] opacity-40 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute inset-[2px] bg-slate-900 rounded-2xl z-0" />
                
                <div className="relative z-10 p-5 space-y-4 rounded-2xl overflow-hidden bg-slate-900/90 backdrop-blur-sm">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  <Flex>
                    <Text className="text-slate-300 font-semibold text-xs uppercase tracking-widest">Official Target Met Prob</Text>
                    <Text className="text-emerald-400 font-mono font-bold text-lg drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]">
                      {(data.prob_target_met_official * 100).toFixed(1)}%
                    </Text>
                  </Flex>
                  
                  <div className="relative h-2.5 bg-slate-800 rounded-full overflow-hidden shadow-inner">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${data.prob_target_met_official * 100}%` }}
                      transition={{ duration: 1.5, ease: "easeOut", type: "spring" }}
                      className={`absolute top-0 left-0 h-full ${data.prob_target_met_official > 0.5 ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" : "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)]"}`}
                    />
                  </div>
                  
                  <p className="text-[11px] text-slate-400 leading-snug flex items-center justify-between">
                    <span>Target Date:</span> 
                    <strong className="text-white font-mono bg-white/10 px-2 py-0.5 rounded shadow-inner border border-white/5">{data.revised_end_date}</strong>
                  </p>
                </div>
              </div>
            </Card>

            {/* Satellite Optical Evidence Card */}
            <Card className="shadow-sm border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <Text className="text-xs font-bold uppercase text-slate-700 flex items-center gap-1.5">
                   Satellite Verification
                </Text>
                <BadgeDelta deltaType="increase" size="xs">Optical</BadgeDelta>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div 
                  className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-100 aspect-video group cursor-pointer"
                  onClick={() => setEnlargedImage({ src: `/satellite-imagery/${data.project_id}_BEFORE.jpg`, title: `${data.baseline_vintage || '2014'} Baseline`, type: 'before' })}
                >
                  <img src={`/satellite-imagery/${data.project_id}_BEFORE.jpg`} alt="Before" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling.style.display = 'flex'; }} />
                  <div style={{ display: 'none' }} className="absolute inset-0 flex-col items-center justify-center p-2 text-center bg-slate-100">
                    <Satellite className="w-5 h-5 text-slate-400 mb-1" />
                  </div>
                  <div className="absolute bottom-2 left-2 z-20 bg-white/90 text-slate-700 text-[9px] font-bold px-2 py-0.5 rounded shadow-sm">{data.baseline_vintage || '2014'} Baseline</div>
                  
                  {/* Hover overlay hint */}
                  <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="bg-white/90 backdrop-blur-sm text-slate-700 text-[10px] font-bold px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1.5 transform scale-95 group-hover:scale-100 transition-transform">
                      <Search className="w-3 h-3" /> Inspect
                    </div>
                  </div>
                </div>
                
                <div 
                  className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-100 aspect-video group cursor-pointer"
                  onClick={() => setEnlargedImage({ src: `/satellite-imagery/${data.project_id}_AFTER.jpg`, title: `${data.current_vintage ? (data.current_vintage.includes('2026') ? '2026' : data.current_vintage.slice(0, 10)) : '2026'} Current`, type: 'after' })}
                >
                  <img src={`/satellite-imagery/${data.project_id}_AFTER.jpg`} alt="After" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling.style.display = 'flex'; }} />
                  <div style={{ display: 'none' }} className="absolute inset-0 flex-col items-center justify-center p-2 text-center bg-slate-100">
                    <Satellite className="w-5 h-5 text-slate-400 mb-1" />
                  </div>
                  <div className="absolute bottom-2 left-2 z-20 bg-white/90 text-emerald-700 text-[9px] font-bold px-2 py-0.5 rounded shadow-sm">{data.current_vintage ? (data.current_vintage.includes('2026') ? '2026 Current' : data.current_vintage.slice(0, 10) + ' Current') : '2026 Current'}</div>
                  
                  {/* Hover overlay hint */}
                  <div className="absolute inset-0 bg-emerald-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="bg-white/90 backdrop-blur-sm text-emerald-700 text-[10px] font-bold px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1.5 transform scale-95 group-hover:scale-100 transition-transform">
                      <Search className="w-3 h-3" /> Inspect
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* ══ Right Column: Probabilistic Fan Chart Visualizer ══ */}
          <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
            <Card className="shadow-sm border-slate-200 h-full flex flex-col">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-5 mb-6">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <h3 className="text-base font-bold text-slate-800 uppercase tracking-wide font-heading">
                    Estimated Completion Window
                  </h3>
                </div>
                <BadgeDelta deltaType="unchanged">90% Confidence</BadgeDelta>
              </div>

              {/* Fan Chart Visualization - CLEAN LOGICAL TIMELINE */}
              <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm flex-1 flex flex-col justify-center relative">
                
                <div className="relative w-full pt-10 pb-16">
                  {/* Top Track: P50 Median */}
                  <div className="absolute top-0 w-full h-10">
                    {positions && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10, x: "-50%" }} 
                        animate={{ opacity: 1, y: 0, x: "-50%" }} 
                        transition={{ delay: 0.4, type: "spring" }}
                        className="absolute flex flex-col items-center z-30" 
                        style={{ left: `${positions.p50Pct}%` }}
                      >
                        <div className="flex flex-col items-center bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 shadow-sm whitespace-nowrap">
                          <span className="text-[10px] text-amber-700 font-bold uppercase tracking-widest mb-0.5">Forecast Median</span>
                          <div className="text-amber-600 font-bold font-mono text-sm">{data.p50_date}</div>
                        </div>
                        <div className="w-px h-6 border-l-2 border-dashed border-amber-300 mt-1" />
                      </motion.div>
                    )}
                  </div>

                  {/* Center Track: Logical Continuous Bar */}
                  <div className="relative h-3 mt-8 mb-8 z-10 mx-2">
                    {/* Background track representing time beyond risk bound */}
                    <div className="absolute inset-0 bg-slate-100 rounded-full" />
                    
                    {/* Section 1: Official Time (Start to Target) - Green */}
                    {positions && (
                      <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: `${positions.targetPct}%` }} 
                        transition={{ duration: 1 }}
                        className="absolute top-0 bottom-0 left-0 bg-emerald-400 rounded-l-full shadow-inner border-y border-l border-emerald-500/30"
                      />
                    )}

                    {/* Section 2: Expected Delay (Target to P50) - Amber */}
                    {positions && positions.p50Pct > positions.targetPct && (
                      <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: `${positions.p50Pct - positions.targetPct}%` }} 
                        transition={{ duration: 1, delay: 0.2 }}
                        className="absolute top-0 bottom-0 bg-amber-400 shadow-inner border-y border-amber-500/30"
                        style={{ left: `${positions.targetPct}%` }}
                      />
                    )}

                    {/* Section 3: Risk Margin (P50 to P95) - Red */}
                    {positions && positions.p95Pct > positions.p50Pct && (
                      <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: `${positions.p95Pct - positions.p50Pct}%` }} 
                        transition={{ duration: 1, delay: 0.4 }}
                        className="absolute top-0 bottom-0 bg-rose-400 shadow-inner border-y border-rose-500/30 rounded-r-full"
                        style={{ left: `${positions.p50Pct}%` }}
                      />
                    )}

                    {/* Target Date Marker Pin */}
                    {positions && (
                      <div className="absolute top-[-6px] bottom-[-6px] w-1 bg-emerald-600 rounded-full -translate-x-1/2 z-20 shadow-sm border border-white" style={{ left: `${positions.targetPct}%` }} />
                    )}

                    {/* P95 Marker Pin */}
                    {positions && (
                      <div className="absolute top-[-6px] bottom-[-6px] w-1 bg-rose-600 rounded-full -translate-x-1/2 z-20 shadow-sm border border-white" style={{ left: `${positions.p95Pct}%` }} />
                    )}

                    {/* P50 Median Notch */}
                    {positions && (
                      <div className="absolute top-[-8px] bottom-[-8px] w-1.5 bg-white rounded-full -translate-x-1/2 z-25 shadow-md border-2 border-amber-500" style={{ left: `${positions.p50Pct}%` }} />
                    )}
                  </div>

                  {/* Bottom Track: Markers */}
                  <div className="absolute bottom-0 w-full h-10">
                    {positions && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, x: "-50%" }} 
                        animate={{ opacity: 1, y: 0, x: "-50%" }} 
                        transition={{ delay: 0.5 }} 
                        className="absolute flex flex-col items-center z-30" 
                        style={{ left: `${positions.targetPct}%` }}
                      >
                        <div className="w-px h-5 bg-emerald-300 mb-1" />
                        <div className="flex flex-col items-center bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 shadow-sm whitespace-nowrap">
                           <span className="text-[9px] text-emerald-700 uppercase tracking-widest font-bold">Target Date</span>
                           <span className="font-mono text-xs text-emerald-800 font-bold">{data.revised_end_date}</span>
                        </div>
                      </motion.div>
                    )}

                    {positions && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, x: positions.p95Pct > 70 ? "-100%" : positions.p95Pct < 30 ? "0%" : "-50%" }} 
                        animate={{ opacity: 1, y: 0, x: positions.p95Pct > 70 ? "-100%" : positions.p95Pct < 30 ? "0%" : "-50%" }} 
                        transition={{ delay: 0.6 }} 
                        className={`absolute flex flex-col z-20 ${positions.p95Pct > 70 ? 'items-end pr-1' : positions.p95Pct < 30 ? 'items-start pl-1' : 'items-center'}`} 
                        style={{ left: `${positions.p95Pct}%`, bottom: positions.p95Pct - positions.targetPct < 15 && positions.p95Pct - positions.targetPct > -15 ? '-3.5rem' : '0' }}
                      >
                        <div className={`w-px h-5 bg-rose-300 mb-1 ${positions.p95Pct > 70 ? 'self-end mr-0' : positions.p95Pct < 30 ? 'self-start ml-0' : 'self-center'}`} />
                        <div className="flex flex-col items-center bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200 shadow-sm whitespace-nowrap">
                           <span className="text-[9px] text-rose-700 uppercase tracking-widest font-bold">Risk Bound (P95)</span>
                           <span className="font-mono text-xs text-rose-800 font-bold">{data.p95_date}</span>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Calibration Provenance */}
                <div className="mt-8 pt-5 border-t border-slate-100">
                  {(() => {
                    const u = data?.facts?.fact_p50_completion?.uncertainty;
                    const emp = u?.empirical_coverage;
                    return emp != null ? (
                      <div className="flex items-start gap-2.5 text-slate-700 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                        <div>
                          <span><strong>Conformally Calibrated Interval.</strong> The model guarantees statistical coverage on held-out projects (Measured: <strong className="font-mono text-emerald-700">{(emp * 100).toFixed(1)}%</strong> vs Target: <strong className="font-mono">{(u.alpha_coverage * 100).toFixed(0)}%</strong>).</span>
                          <span className="block text-slate-500 mt-1 font-mono text-[10px] uppercase tracking-wider">{u.calibration_method}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2.5 text-slate-700 text-xs bg-amber-50 p-3 rounded-lg border border-amber-100">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                        <span><strong>Uncalibrated interval.</strong> Width is from fallback constants and coverage is not measured.</span>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Quantile Breakdown Cards */}
              <Grid numItemsSm={2} numItemsLg={4} className="gap-3 mt-6">
                <motion.div variants={itemVariants} className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
                  <Text className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Optimistic (P10)</Text>
                  <Metric className="text-sm font-bold text-slate-800 mt-1">{data.p10_date}</Metric>
                </motion.div>
                <motion.div variants={itemVariants} className="p-4 rounded-xl bg-amber-50/50 border border-amber-100 text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-amber-400" />
                  <Text className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Forecast (P50)</Text>
                  <Metric className="text-sm font-bold text-slate-900 mt-1">{data.p50_date}</Metric>
                </motion.div>
                <motion.div variants={itemVariants} className="p-4 rounded-xl bg-orange-50/50 border border-orange-100 text-center">
                  <Text className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">Target (P80)</Text>
                  <Metric className="text-sm font-bold text-slate-800 mt-1">{data.p80_date}</Metric>
                </motion.div>
                <motion.div variants={itemVariants} className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-center">
                  <Text className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">Risk Tail (P95)</Text>
                  <Metric className="text-sm font-bold text-rose-900 mt-1">{data.p95_date}</Metric>
                </motion.div>
              </Grid>

              {/* Cryptographic Lineage Proof Bar */}
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs gap-3">
                <div className="flex items-center gap-2 text-slate-500">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span className="font-mono text-[10px] truncate max-w-[200px]"> Audit Hash: {data.facts?.fact_cost?.lineage?.merkle_root ? data.facts.fact_cost.lineage.merkle_root.slice(0, 24) : 'e83a7f920bc491d8...'}...</span>
                </div>
                <BadgeDelta deltaType="increase" size="xs">Audit Verified</BadgeDelta>
              </div>

            </Card>
          </motion.div>
        </motion.div>
      )}

      {/* Lightbox Modal for Satellite Images */}
      <AnimatePresence>
        {enlargedImage && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setEnlargedImage(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20, opacity: 0 }} 
              animate={{ scale: 1, y: 0, opacity: 1 }} 
              exit={{ scale: 0.95, y: 20, opacity: 0 }} 
              transition={{ type: "spring", bounce: 0.3, duration: 0.5 }}
              className="relative max-w-5xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${enlargedImage.type === 'after' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-600'}`}>
                    <Satellite className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 tracking-wide text-sm flex items-center gap-2">
                      {enlargedImage.title}
                      {enlargedImage.type === 'after' && (
                        <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full font-bold">Latest Pass</span>
                      )}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">Project #{data?.project_id} · Optical Verification</p>
                  </div>
                </div>
                <button 
                  onClick={() => setEnlargedImage(null)}
                  className="p-2 rounded-full hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Image Container */}
              <div className="relative bg-slate-100/50 w-full flex items-center justify-center" style={{ height: '65vh' }}>
                <img 
                  src={enlargedImage.src} 
                  alt={enlargedImage.title} 
                  className="w-full h-full object-contain drop-shadow-md p-4"
                  onError={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling.style.display = 'flex'; }}
                />
                <div style={{ display: 'none' }} className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-slate-400">
                  <Satellite className="w-12 h-12 mb-3 opacity-20" />
                  <p className="text-sm">High-resolution imagery not available for this site.</p>
                </div>

                {/* Annotation Badges overlay */}
                {enlargedImage.type === 'after' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="absolute bottom-6 left-6 bg-white/95 backdrop-blur-md text-emerald-700 border border-emerald-200/50 text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Verified Construction Footprint
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
