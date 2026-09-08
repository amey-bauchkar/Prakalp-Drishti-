import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, AlertTriangle, TrendingUp, Clock, Calculator, ShieldCheck, 
  Activity, BarChart3, ArrowRight, DollarSign, RefreshCw, CheckCircle2, 
  Layers, AlertCircle, Sparkles, FileText, Compass, ExternalLink, ShieldAlert,
  Sliders, Gauge, History, FileSpreadsheet, Cpu, CheckSquare, Scale, Award
} from 'lucide-react';
import { Card, Metric, BadgeDelta, Flex, ProgressBar } from '@tremor/react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import LoginGate from '../../amey/LoginGate.jsx';

export default function KaryaDakshataSimulator() {
  const [agencies, setAgencies] = useState([]);
  const [selectedAgency, setSelectedAgency] = useState("");
  const [baseCost, setBaseCost] = useState("");
  const [baseTime, setBaseTime] = useState("");
  
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch agencies on mount
  useEffect(() => {
    fetch('/api/karya-dakshata/agencies')
      .then(res => res.json())
      .then(data => {
        if (data.agencies && Array.isArray(data.agencies)) {
          setAgencies(data.agencies);
        }
      })
      .catch(err => console.error("Failed to load agencies", err));
  }, []);

  // Global project selection sync
  useEffect(() => {
    const handleSelect = (e) => {
      if (e.detail) {
        const pid = String(e.detail);
        fetch(`/api/projects/${pid}`)
          .then(r => r.ok ? r.json() : null)
          .then(p => {
            if (p) {
              if (p.company) setSelectedAgency(p.company);
              if (p.original_cost_cr) setBaseCost(p.original_cost_cr);
              if (p.delayed_months) setBaseTime(Math.max(365, Math.round((p.delayed_months || 24) * 30.4)));
            }
          })
          .catch(() => {});
      }
    };
    window.addEventListener('prakalp:selectProject', handleSelect);
    return () => window.removeEventListener('prakalp:selectProject', handleSelect);
  }, []);

  const runSimulation = useCallback(async () => {
    if (!selectedAgency) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/karya-dakshata/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agency_name: selectedAgency,
          base_cost_cr: parseFloat(baseCost) || 500,
          base_time_days: parseFloat(baseTime) || 730
        })
      });
      if (!response.ok) throw new Error("Simulation endpoint error");
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedAgency, baseCost, baseTime]);

  const selectedAgencyObj = agencies.find(a => a.name === selectedAgency);

  const getScoreColor = (score) => {
    if (score >= 80) return "text-emerald-600";
    if (score >= 50) return "text-blue-600";
    return "text-rose-600";
  };

  const getScoreBadge = (score) => {
    if (score >= 80) {
      return { label: "High Reliability", bg: "bg-emerald-50 text-emerald-800 border-emerald-200" };
    }
    if (score >= 50) {
      return { label: "Moderate Risk", bg: "bg-blue-50 text-blue-800 border-blue-200" };
    }
    return { label: "High Overrun Risk", bg: "bg-rose-50 text-rose-800 border-rose-200" };
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { type: "spring", stiffness: 300, damping: 24 } 
    }
  };

  const costEscalationPct = result && result.Base_Cost_Cr > 0
    ? (((result.True_Expected_Cost_Cr - result.Base_Cost_Cr) / result.Base_Cost_Cr) * 100).toFixed(1)
    : "0.0";

  const timeDelayDays = result
    ? Math.max(0, Math.round(result.True_Expected_Timeline_Days - result.Base_Timeline_Days))
    : 0;

  const costChartData = result ? [
    { name: 'Proposed Budget', value: result.Base_Cost_Cr },
    { name: 'AI De-Biased Expected', value: result.True_Expected_Cost_Cr }
  ] : [];

  const timeChartData = result ? [
    { name: 'Proposed Timeline', value: result.Base_Timeline_Days },
    { name: 'AI De-Biased Expected', value: result.True_Expected_Timeline_Days }
  ] : [];

  return (
    <LoginGate>
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="space-y-6 font-sans pb-10"
      >
        {/* ═══════════════════════════════════════════════════════════════
            1. SOVEREIGN COMMAND HEADER (KARYA-DAKSHATA MASTHEAD)
            ═══════════════════════════════════════════════════════════════ */}
        <motion.div 
          variants={itemVariants}
          className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/60 shadow-xl text-white relative overflow-hidden"
        >
          {/* Subtle Ambient Background Glows */}
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2.5 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-mono font-bold tracking-wider uppercase">
                <Activity className="w-3.5 h-3.5 text-blue-400" />
                <span>KARYA-DAKSHATA · कार्य-दक्षता // AGENCY DE-BIASING ENGINE</span>
              </div>
              
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
                <span>EXECUTION RELIABILITY SIMULATOR</span>
                <span className="text-xs px-2.5 py-1 rounded-md bg-white/10 text-slate-300 font-mono font-normal">
                  {agencies.length} AGENCIES CATALOGUED
                </span>
              </h1>
              
              <p className="text-sm text-slate-300 leading-relaxed font-sans max-w-xl">
                AI-driven empirical de-biasing of optimistic project proposals using multi-year agency track records, historical completion velocities, and cost/schedule variance distributions.
              </p>
            </div>

            {/* Live Agency Telemetry Badge */}
            <div className="flex items-center gap-4 bg-black/40 px-5 py-3.5 rounded-xl border border-white/15 backdrop-blur-md shrink-0 shadow-inner">
              <div className="p-2.5 bg-blue-500/20 rounded-lg border border-blue-500/30 text-blue-400">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono tracking-wider">Active Agency</span>
                <span className="text-base font-black text-white font-mono truncate block max-w-[200px]">
                  {selectedAgency || 'None Selected'}
                </span>
                <span className="text-[10px] font-mono text-blue-300 block">
                  {selectedAgencyObj 
                    ? `${selectedAgencyObj.projects || selectedAgencyObj.project_count || selectedAgencyObj.total_projects || 0} Historical Projects` 
                    : 'Choose from dropdown'}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════════
            2. MAIN PROPOSAL CONFIGURATION & TELEMETRY SECTION
            ═══════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* ══ Left Column: Proposal Configuration Studio ══ */}
          <motion.div variants={itemVariants} className="lg:col-span-4 flex flex-col">
            <div className="bg-white rounded-2xl border border-slate-200/90 border-t-4 border-t-blue-600 shadow-sm p-6 space-y-6 flex-1 flex flex-col justify-between">
              <div className="space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-blue-600" />
                    <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-900 font-mono">
                      Proposal Inputs
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-semibold">
                    Parameter Setup
                  </span>
                </div>

                {/* Implementing Agency Selector */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
                    Implementing Agency
                  </label>
                  <select 
                    value={selectedAgency} 
                    onChange={(e) => setSelectedAgency(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/80 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 outline-none text-xs font-bold text-slate-900 transition-all font-sans cursor-pointer"
                  >
                    <option value="" disabled>Select Agency...</option>
                    {agencies.map(a => {
                      const count = a.projects ?? a.project_count ?? a.total_projects ?? 0;
                      return (
                        <option key={a.name} value={a.name}>
                          {a.name} ({count} projects)
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Proposed Budget */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
                      Proposed Budget (₹ Cr)
                    </label>
                    <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-md border ${
                      baseCost 
                        ? 'text-emerald-700 bg-emerald-50 border-emerald-200' 
                        : 'text-slate-400 bg-slate-100 border-slate-200'
                    }`}>
                      {baseCost ? `₹${Number(baseCost).toLocaleString()} Cr` : 'Not Set'}
                    </span>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold font-mono text-xs">
                      ₹
                    </div>
                    <input 
                      type="number" 
                      min="1"
                      step="10"
                      placeholder="e.g. 500"
                      value={baseCost} 
                      onChange={(e) => setBaseCost(e.target.value)}
                      className="w-full pl-8 p-2.5 rounded-xl border border-slate-200 bg-slate-50/80 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 outline-none font-mono font-bold text-xs text-slate-900 placeholder:text-slate-400 placeholder:font-normal"
                    />
                  </div>
                  {/* Budget Presets */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[100, 500, 2500, 10000].map((crVal) => (
                      <button
                        key={crVal}
                        type="button"
                        onClick={() => setBaseCost(crVal)}
                        className={`text-[10.5px] font-mono px-2.5 py-1 rounded-lg border transition-all cursor-pointer font-semibold ${
                          Number(baseCost) === crVal
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200'
                        }`}
                      >
                        ₹{crVal.toLocaleString()} Cr
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Proposed Timeline */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
                      Proposed Timeline (Days)
                    </label>
                    <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-md border ${
                      baseTime 
                        ? 'text-blue-700 bg-blue-50 border-blue-200' 
                        : 'text-slate-400 bg-slate-100 border-slate-200'
                    }`}>
                      {baseTime ? `${Number(baseTime)} Days (${(Number(baseTime) / 365).toFixed(1)} Yrs)` : 'Not Set'}
                    </span>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <input 
                      type="number" 
                      min="30"
                      step="30"
                      placeholder="e.g. 730"
                      value={baseTime} 
                      onChange={(e) => setBaseTime(e.target.value)}
                      className="w-full pl-9 p-2.5 rounded-xl border border-slate-200 bg-slate-50/80 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 outline-none font-mono font-bold text-xs text-slate-900 placeholder:text-slate-400 placeholder:font-normal"
                    />
                  </div>
                  {/* Timeline Presets */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[
                      { label: '1 Yr', days: 365 },
                      { label: '2 Yrs', days: 730 },
                      { label: '3 Yrs', days: 1095 },
                      { label: '5 Yrs', days: 1825 }
                    ].map((p) => (
                      <button
                        key={p.days}
                        type="button"
                        onClick={() => setBaseTime(p.days)}
                        className={`text-[10.5px] font-mono px-2.5 py-1 rounded-lg border transition-all cursor-pointer font-semibold ${
                          Number(baseTime) === p.days
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Simulation Button */}
              <button 
                onClick={runSimulation}
                disabled={loading || !selectedAgency || !baseCost || !baseTime}
                className="w-full bg-slate-100 hover:bg-blue-600 text-slate-800 hover:text-white border-2 border-slate-300 hover:border-blue-600 font-extrabold py-3.5 px-4 rounded-xl text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-200 shadow-xs hover:shadow-lg hover:shadow-blue-500/25 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-4 group"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-blue-600 group-hover:text-white" />
                    <span>De-Biasing Estimates…</span>
                  </>
                ) : (
                  <>
                    <BarChart3 className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors" />
                    <span>Run De-Biasing Engine</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                  </>
                )}
              </button>
            </div>
          </motion.div>

          {/* ══ Right Column: De-Biased Results Docket / Initial State ══ */}
          <motion.div variants={itemVariants} className="lg:col-span-8 flex flex-col">
            
            {/* Error Banner */}
            {error && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2.5 mb-4">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Simulation Error: {error}</span>
              </div>
            )}

            {/* Default Initial State: Ready to Simulate */}
            {!result && !loading && !error && (
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-8 sm:p-10 flex flex-col items-center justify-center text-center space-y-6 flex-1 min-h-[460px]">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
                  <Activity className="w-8 h-8 text-blue-600" />
                </div>
                
                <div className="space-y-2 max-w-lg">
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-sans tracking-tight">
                    Ready to De-Bias Project Proposal
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-sans">
                    Select an agency and configure the proposed budget and duration. Click <strong>"Run De-Biasing Engine"</strong> to compute empirical variance, expected cost escalation, and schedule slippage based on historical track records.
                  </p>
                </div>

                {/* 3 Executive Capability Feature Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl pt-2">
                  <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 text-left space-y-1.5 hover:border-blue-200 transition-colors">
                    <div className="flex items-center gap-1.5 text-blue-600 font-mono text-[11px] font-bold uppercase">
                      <History className="w-3.5 h-3.5" />
                      <span>Historical Variance</span>
                    </div>
                    <p className="text-[11.5px] text-slate-600 leading-snug">
                      Analyzes 10+ years of agency cost overruns and completion velocities.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 text-left space-y-1.5 hover:border-blue-200 transition-colors">
                    <div className="flex items-center gap-1.5 text-cyan-600 font-mono text-[11px] font-bold uppercase">
                      <Gauge className="w-3.5 h-3.5" />
                      <span>Reliability Score</span>
                    </div>
                    <p className="text-[11.5px] text-slate-600 leading-snug">
                      Calculates empirical reliability score (0–100) and delivery variance.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 text-left space-y-1.5 hover:border-emerald-200 transition-colors">
                    <div className="flex items-center gap-1.5 text-emerald-600 font-mono text-[11px] font-bold uppercase">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Reserve Buffer</span>
                    </div>
                    <p className="text-[11.5px] text-slate-600 leading-snug">
                      Recommends statutory capital buffer and 90-day milestone audit checks.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center flex flex-col items-center justify-center space-y-4 flex-1 min-h-[460px]">
                <div className="w-12 h-12 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-slate-900">Running Monte Carlo De-Biasing Simulations…</h4>
                  <p className="text-xs text-slate-400 font-mono">Querying historical delivery variances for {selectedAgency}</p>
                </div>
              </div>
            )}

            {/* Result Docket (Agency Health & Comparative Charts) */}
            {result && !loading && (
              <div className="space-y-6 flex-1 flex flex-col justify-between">
                
                {/* Agency Health & Reliability Score Header Card */}
                <div className="bg-white rounded-2xl border border-slate-200/90 border-t-4 border-t-blue-600 shadow-sm p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-700 uppercase tracking-wider font-mono">
                        <Building2 className="w-3 h-3 text-blue-600" />
                        <span>Agency Execution Track Record ({result.sample_size_projects || selectedAgencyObj?.projects || 'Corpus'} Projects)</span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-sans">
                        {result.Agency}
                      </h2>
                      <div className="flex items-center gap-3 flex-wrap text-xs text-slate-600 pt-1">
                        <span className="inline-flex items-center gap-1 font-medium">
                          <TrendingUp className="w-3.5 h-3.5 text-rose-500" />
                          <span>Avg Cost Variance: <strong className="text-slate-900 font-mono">+{result.Historical_Cost_Variance_Avg}%</strong></span>
                        </span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1 font-medium">
                          <Clock className="w-3.5 h-3.5 text-blue-500" />
                          <span>Avg Schedule Delay: <strong className="text-slate-900 font-mono">+{result.Historical_Delay_Avg} Mo</strong></span>
                        </span>
                      </div>
                    </div>

                    {/* Reliability Score Gauge Badge */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 flex flex-col items-center justify-center shrink-0 min-w-[140px]">
                      <span className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider block mb-1">
                        Reliability Score
                      </span>
                      <span className={`text-3xl font-black font-mono tracking-tight ${getScoreColor(result.Reliability_Score)}`}>
                        {Number(result.Reliability_Score).toFixed(1)}
                      </span>
                      <span className={`mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded border ${getScoreBadge(result.Reliability_Score).bg}`}>
                        {getScoreBadge(result.Reliability_Score).label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Comparative Telemetry Cards (Cost & Timeline) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
                  
                  {/* True Expected Cost Card */}
                  <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-4 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10.5px] uppercase text-slate-400 font-bold block mb-0.5 font-mono tracking-wider">
                            True Expected Cost
                          </span>
                          <div className="text-2xl font-black text-rose-600 font-mono">
                            ₹{Number(result.True_Expected_Cost_Cr).toLocaleString('en-IN')} <span className="text-sm text-rose-400">Cr</span>
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5 font-mono">
                            Proposed: <span className="line-through">₹{Number(result.Base_Cost_Cr).toLocaleString('en-IN')} Cr</span>
                          </div>
                        </div>
                        <span className="font-mono text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                          +{costEscalationPct}% Escalation
                        </span>
                      </div>
                    </div>

                    {/* Comparative Bar Visualization */}
                    <div className="h-36 w-full pt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={costChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                          <Tooltip 
                            formatter={(val) => [`₹${Number(val).toLocaleString('en-IN')} Cr`, 'Cost']}
                            contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '11px' }} 
                          />
                          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                            {costChartData.map((entry, index) => (
                              <Cell key={`cost-cell-${index}`} fill={index === 0 ? '#94a3b8' : '#e11d48'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* True Expected Timeline Card */}
                  <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-4 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10.5px] uppercase text-slate-400 font-bold block mb-0.5 font-mono tracking-wider">
                            True Expected Timeline
                          </span>
                          <div className="text-2xl font-black text-blue-600 font-mono">
                            {Math.round(result.True_Expected_Timeline_Days)} <span className="text-sm text-blue-400">Days</span>
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5 font-mono">
                            Proposed: <span className="line-through">{Math.round(result.Base_Timeline_Days)} Days</span>
                          </div>
                        </div>
                        <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                          +{timeDelayDays} Days Slippage
                        </span>
                      </div>
                    </div>

                    {/* Comparative Bar Visualization */}
                    <div className="h-36 w-full pt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={timeChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                          <Tooltip 
                            formatter={(val) => [`${Math.round(val)} Days (${(val / 365).toFixed(1)} Yrs)`, 'Timeline']}
                            contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '11px' }} 
                          />
                          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                            {timeChartData.map((entry, index) => (
                              <Cell key={`time-cell-${index}`} fill={index === 0 ? '#94a3b8' : '#2563eb'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </motion.div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            3. FULL-WIDTH SOVEREIGN STATUTORY DIRECTIVE WARRANT
            ═══════════════════════════════════════════════════════════════ */}
        {result && !loading && (
          <motion.div 
            variants={itemVariants}
            className="rounded-2xl bg-gradient-to-br from-gov-navy via-slate-900 to-gov-navy border border-slate-700/70 border-l-4 border-l-amber-400 shadow-xl p-6 sm:p-8 text-white relative overflow-hidden"
          >
            {/* Subtle Texture Overlay */}
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none rounded-2xl overflow-hidden" />

            <div className="relative z-10 space-y-6">
              {/* Header Strip */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/10">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0 shadow-sm">
                    <ShieldCheck className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-2 pl-2 pr-2.5 py-0.5 rounded-sm bg-white/10 text-[10px] font-mono font-extrabold uppercase tracking-institutional text-amber-400 border-l-2 border-amber-400">
                        STATUTORY ENFORCEMENT DIRECTIVE
                      </span>
                      <span className="text-[10.5px] font-mono text-slate-300">
                        MoSPI / CPWD Standard OM Calibrated
                      </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-white font-heading tracking-tight mt-1">
                      Fiduciary De-Biasing &amp; Risk Mitigation Protocol
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-black/40 border border-white/20 text-xs font-mono text-white shadow-inner font-bold">
                    <Scale className="w-3.5 h-3.5 text-amber-400" />
                    <span>Enforceable Mandate</span>
                  </span>
                </div>
              </div>

              {/* 4 Sovereign Metric Pillars */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 sm:p-5 rounded-xl bg-black/40 border border-white/15 backdrop-blur-sm space-y-2 hover:border-white/30 transition-all shadow-inner">
                  <div className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-widest flex items-center justify-between">
                    <span>1. Mandated Capital Reserve</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
                    +₹{(result.True_Expected_Cost_Cr - result.Base_Cost_Cr).toFixed(1)} <span className="text-sm font-bold text-slate-400">Cr</span>
                  </div>
                  <span className="text-xs text-slate-300 font-mono block">
                    +{costEscalationPct}% Statutory Contingency
                  </span>
                </div>

                <div className="p-4 sm:p-5 rounded-xl bg-black/40 border border-white/15 backdrop-blur-sm space-y-2 hover:border-white/30 transition-all shadow-inner">
                  <div className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-widest flex items-center justify-between">
                    <span>2. Expected Schedule Drift</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
                    +{timeDelayDays} <span className="text-sm font-bold text-slate-400">Days</span>
                  </div>
                  <span className="text-xs text-slate-300 font-mono block">
                    +{(timeDelayDays / 30.4375).toFixed(1)} Months Empirical Slippage
                  </span>
                </div>

                <div className="p-4 sm:p-5 rounded-xl bg-black/40 border border-white/15 backdrop-blur-sm space-y-2 hover:border-white/30 transition-all shadow-inner">
                  <div className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-widest flex items-center justify-between">
                    <span>3. Milestone Audit Cadence</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
                    90-Day Review
                  </div>
                  <span className="text-xs text-slate-300 font-mono block">
                    Mandatory On-Site Inspection
                  </span>
                </div>

                <div className="p-4 sm:p-5 rounded-xl bg-black/40 border border-white/15 backdrop-blur-sm space-y-2 hover:border-white/30 transition-all shadow-inner">
                  <div className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-widest flex items-center justify-between">
                    <span>4. Performance Class</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight truncate">
                    {result.performance_tier ? result.performance_tier.replace(/_/g, ' ') : 'TIER 2 WATCHLIST'}
                  </div>
                  <span className="text-xs text-slate-300 font-mono block">
                    Reliability Index: {Number(result.Reliability_Score).toFixed(1)} / 100
                  </span>
                </div>
              </div>

              {/* Rationale & Action Plan */}
              <div className="p-5 rounded-xl bg-black/50 border border-white/15 backdrop-blur-sm space-y-3 shadow-inner">
                <div className="flex items-center gap-2 text-xs font-bold font-mono text-amber-400 uppercase tracking-wider">
                  <FileText className="w-4 h-4 text-amber-400" />
                  <span>Fiduciary Decision Rationale &amp; Compliance Mandate</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                  {result.basis || `Re-priced at ${result.Agency}'s measured delivery multiple across ${result.sample_size_projects || 'all'} historical projects: historical cost variance +${result.Historical_Cost_Variance_Avg}%, average schedule slippage +${result.Historical_Delay_Avg} months.`} The sanctioning authority is directed to ring-fence a dedicated capital contingency buffer of <strong className="text-white font-mono bg-white/10 px-1.5 py-0.5 rounded border border-white/15">₹{(result.True_Expected_Cost_Cr - result.Base_Cost_Cr).toFixed(1)} Cr</strong> and enforce CPWD Clause 10CC price adjustment caps with mandatory 90-day progress milestones.
                </p>
                <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    <span>Statutory Reference: MoSPI RCF Guideline Annexure-IV · CPWD Works Manual 2019</span>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-white/10 border border-white/15 text-slate-200 text-[10px] font-bold">
                    OFFICIAL DIRECTIVE
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

      </motion.div>
    </LoginGate>
  );
}


