import React, { useState, useEffect } from 'react';
import {
  CloudRain,
  Droplets,
  Sun,
  Calendar,
  AlertTriangle,
  Sliders,
  RefreshCw,
  Search,
  Filter,
  BarChart3,
  Compass,
  Layers,
  ArrowUpRight,
  TrendingDown,
  Building2,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Info
} from 'lucide-react';

export default function VarshaSpeedView() {
  const [anomaly, setAnomaly] = useState(0.0);
  const [impactData, setImpactData] = useState(null);
  const [profilesData, setProfilesData] = useState(null);
  const [timelineData, setTimelineData] = useState(null);
  const [selectedState, setSelectedState] = useState('Assam');
  const [projectsData, setProjectsData] = useState(null);
  const [activeTab, setActiveTab] = useState('simulation'); // 'simulation' | 'historical' | 'projects'
  const [regionFilter, setRegionFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [sectorFilter, setSectorFilter] = useState('ALL');
  const [loading, setLoading] = useState(false);

  // Fetch simulation data
  const fetchMonsoonImpact = (anomalyVal) => {
    setLoading(true);
    fetch(`/api/janhavi/monsoon-impact?rainfall_anomaly_pct=${anomalyVal}`)
      .then((res) => res.json())
      .then((json) => {
        setImpactData(json);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load monsoon impact:', err);
        setLoading(false);
      });
  };

  // Fetch 20-year state profiles
  const fetchHistoricalProfiles = () => {
    fetch('/api/janhavi/state-historical-profiles')
      .then((res) => res.json())
      .then((json) => setProfilesData(json))
      .catch((err) => console.error('Failed to load historical profiles:', err));
  };

  // Fetch state timeline for chart
  const fetchStateTimeline = (stateName) => {
    fetch(`/api/janhavi/state-timeline/${encodeURIComponent(stateName)}`)
      .then((res) => res.json())
      .then((json) => setTimelineData(json))
      .catch((err) => console.error('Failed to load state timeline:', err));
  };

  // Fetch project-level weather audit
  const fetchProjectAudit = () => {
    fetch('/api/janhavi/project-weather-audit?limit=40&min_cost_cr=500')
      .then((res) => res.json())
      .then((json) => setProjectsData(json))
      .catch((err) => console.error('Failed to load project audit:', err));
  };

  useEffect(() => {
    fetchMonsoonImpact(anomaly);
    fetchHistoricalProfiles();
    fetchStateTimeline(selectedState);
    fetchProjectAudit();
  }, []);

  const handleStateSelect = (stateName) => {
    setSelectedState(stateName);
    fetchStateTimeline(stateName);
  };

  const handleSliderChange = (e) => {
    const val = parseFloat(e.target.value);
    setAnomaly(val);
    fetchMonsoonImpact(val);
  };

  // Filtered state list
  const filteredStates = (impactData?.state_impact_records || []).filter((item) => {
    const matchesRegion = regionFilter === 'ALL' || item.region === regionFilter;
    const matchesSearch = item.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.terrain.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRegion && matchesSearch;
  });

  // Filtered projects list
  const filteredProjects = (projectsData?.projects || []).filter((p) => {
    const matchesSector = sectorFilter === 'ALL' || p.sector.toLowerCase().includes(sectorFilter.toLowerCase());
    const matchesSearch = p.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.state.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSector && matchesSearch;
  });

  const getRiskBadgeColor = (tier) => {
    if (tier?.includes('CRITICAL')) return 'bg-rose-500/10 text-rose-500 border-rose-500/30';
    if (tier?.includes('SEVERE')) return 'bg-orange-500/10 text-orange-500 border-orange-500/30';
    if (tier?.includes('LANDSLIDE')) return 'bg-amber-500/10 text-amber-500 border-amber-500/30';
    if (tier?.includes('CYCLONIC') || tier?.includes('HIGH_PRECIPITATION')) return 'bg-cyan-500/10 text-cyan-500 border-cyan-500/30';
    return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in text-slate-100">
      
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-[#09152b] via-[#0f244a] to-[#1a386b] p-6 sm:p-8 rounded-2xl shadow-2xl border border-blue-900/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-black uppercase tracking-wider">
              <CloudRain className="w-3.5 h-3.5" /> VARSHA-SPEED · IMD Weather-Working Window Engine
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              Monsoon Working-Window Contraction & Schedule Multiplier
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Powered by 20-year empirical IMD state-level rainfall departures (2005–2025 · 630 state-years). Calculates precise lost construction days, working-window compression, and schedule stretch multipliers across 2,207 mega-projects.
            </p>
          </div>

          <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between w-full lg:w-auto gap-3 bg-slate-900/60 p-4 rounded-xl border border-blue-500/20 backdrop-blur-md">
            <div className="text-left lg:text-right">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">Module Lead</span>
              <span className="text-lg font-black text-cyan-400">Janhavi</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-bold">
                <CheckCircle2 className="w-3 h-3" /> 630 State-Years
              </span>
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/40 font-bold">
                30 States
              </span>
            </div>
          </div>
        </div>

        {/* Top KPI Metrics */}
        {impactData?.national_summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-blue-800/40">
            <div className="bg-slate-900/40 p-3 rounded-xl border border-blue-900/30">
              <div className="text-[11px] text-slate-400 font-semibold flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" /> National Working Window
              </div>
              <div className="text-xl font-black text-cyan-300 mt-1 font-mono">
                {impactData.national_summary.average_working_window_months} <span className="text-xs font-normal text-slate-400">Mo/yr</span>
              </div>
            </div>

            <div className="bg-slate-900/40 p-3 rounded-xl border border-blue-900/30">
              <div className="text-[11px] text-slate-400 font-semibold flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-rose-400" /> Avg Lost Weather Days
              </div>
              <div className="text-xl font-black text-rose-300 mt-1 font-mono">
                {impactData.national_summary.average_lost_days_per_year} <span className="text-xs font-normal text-slate-400">Days</span>
              </div>
            </div>

            <div className="bg-slate-900/40 p-3 rounded-xl border border-blue-900/30">
              <div className="text-[11px] text-slate-400 font-semibold flex items-center gap-1.5">
                <TrendingDown className="w-3.5 h-3.5 text-amber-400" /> Schedule Stretch Multiplier
              </div>
              <div className="text-xl font-black text-amber-300 mt-1 font-mono">
                {impactData.national_summary.national_schedule_stretch_multiplier}x
              </div>
            </div>

            <div className="bg-slate-900/40 p-3 rounded-xl border border-blue-900/30">
              <div className="text-[11px] text-slate-400 font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" /> Highest Vulnerability
              </div>
              <div className="text-lg font-black text-red-300 mt-1 truncate">
                {impactData.national_summary.most_vulnerable_state}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Interactive Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('simulation')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'simulation'
              ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4" /> 30-State Working-Window Simulator
        </button>
        <button
          onClick={() => setActiveTab('historical')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'historical'
              ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" /> 20-Year IMD Historical Departure Explorer
        </button>
        <button
          onClick={() => setActiveTab('projects')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'projects'
              ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" /> Project Climate Exposure Auditor
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: WORKING-WINDOW SIMULATOR */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'simulation' && (
        <div className="space-y-6">
          {/* Interactive Slider & Scenario Bar */}
          <div className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-white uppercase tracking-wider">
                    Simulate Pan-India Monsoon Rainfall Anomaly
                  </h3>
                  <p className="text-xs text-slate-400">
                    Adjust IMD departure to observe real-time compression of construction working calendars
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono font-black px-4 py-1.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  {anomaly > 0 ? `+${anomaly}% Departure (Excess)` : anomaly < 0 ? `${anomaly}% Departure (Deficit)` : `0% Normal LPA`}
                </span>
                {loading && <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />}
              </div>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="text-[11px] text-slate-400 font-semibold self-center mr-1">Historical Presets:</span>
              <button
                onClick={() => { setAnomaly(0.0); fetchMonsoonImpact(0.0); }}
                className={`text-xs px-3 py-1 rounded-lg font-medium transition ${anomaly === 0 ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
              >
                Normal LPA (0%)
              </button>
              <button
                onClick={() => { setAnomaly(15.0); fetchMonsoonImpact(15.0); }}
                className={`text-xs px-3 py-1 rounded-lg font-medium transition ${anomaly === 15 ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
              >
                Moderate Excess (+15%)
              </button>
              <button
                onClick={() => { setAnomaly(25.0); fetchMonsoonImpact(25.0); }}
                className={`text-xs px-3 py-1 rounded-lg font-medium transition ${anomaly === 25 ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
              >
                2023 Heavy Flood (+25%)
              </button>
              <button
                onClick={() => { setAnomaly(-20.0); fetchMonsoonImpact(-20.0); }}
                className={`text-xs px-3 py-1 rounded-lg font-medium transition ${anomaly === -20 ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
              >
                2009 Severe Drought (-20%)
              </button>
            </div>

            <div className="relative pt-2">
              <input
                type="range"
                min="-50"
                max="50"
                step="5"
                value={anomaly}
                onChange={handleSliderChange}
                className="w-full accent-cyan-400 cursor-pointer h-2.5 bg-slate-800 rounded-lg"
              />

              <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1.5">
                <span className="text-left">-50% Extreme Drought</span>
                <span className="text-center">-25% Deficient</span>
                <span className={`text-center font-black transition-colors ${anomaly === 0 ? 'text-cyan-300' : 'text-slate-400'}`}>0% Normal LPA</span>
                <span className="text-center">+25% Heavy Flood</span>
                <span className="text-right">+50% Extreme Inundation</span>
              </div>
            </div>

            {impactData?.scenario_interpretation && (
              <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-800/40 flex items-start gap-2.5 text-xs text-blue-200">
                <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span><strong>Scenario Assessment:</strong> {impactData.scenario_interpretation}</span>
              </div>
            )}
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <span className="text-xs text-slate-400 font-bold flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Region:
              </span>
              {['ALL', 'North-East', 'North', 'South', 'East', 'West', 'Central'].map((r) => (
                <button
                  key={r}
                  onClick={() => setRegionFilter(r)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap ${
                    regionFilter === r
                      ? 'bg-cyan-500 text-slate-950'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search state or terrain..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-white pl-9 pr-3 py-1.5 rounded-xl text-xs outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* State Working Window Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStates.map((rec, idx) => (
              <div
                key={idx}
                className="bg-slate-900/90 hover:bg-slate-850 rounded-2xl border border-slate-800/80 p-5 space-y-3 transition-all hover:border-cyan-500/40 hover:shadow-lg hover:shadow-cyan-950/20"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-black text-base text-white">{rec.state}</h4>
                    <p className="text-[11px] text-slate-400">{rec.terrain}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase ${getRiskBadgeColor(rec.risk_tier)}`}>
                    {rec.risk_tier.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Simulated Lost Days:</span>
                    <span className="font-mono font-black text-rose-400">{rec.simulated_lost_days} Days</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Effective Working Window:</span>
                    <span className="font-mono font-black text-cyan-300">{rec.effective_working_window_months} Mo/yr</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Schedule Multiplier:</span>
                    <span className="font-mono font-black text-amber-400">{rec.schedule_stretch_multiplier}x Multiplier</span>
                  </div>
                </div>

                {/* Progress bar representing work window */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>Working Months</span>
                    <span>{rec.effective_working_window_months} / 12.0</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full"
                      style={{ width: `${(rec.effective_working_window_months / 12.0) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Hist. Mean Departure: <strong>{rec.historical_mean_departure_pct}%</strong></span>
                  <button
                    onClick={() => { setSelectedState(rec.state); fetchStateTimeline(rec.state); setActiveTab('historical'); }}
                    className="text-cyan-400 hover:underline font-bold flex items-center gap-0.5"
                  >
                    View 20-Yr Trend <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: HISTORICAL 20-YEAR IMD DEPARTURES */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'historical' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-black text-base text-white">20-Year IMD Monsoon Departure Explorer (2005–2025)</h3>
                <p className="text-xs text-slate-400">Real empirical rainfall anomalies recorded by the India Meteorological Department</p>
              </div>

              {/* State Selector Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">Select State:</span>
                <select
                  value={selectedState}
                  onChange={(e) => handleStateSelect(e.target.value)}
                  className="bg-slate-800 text-cyan-300 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold outline-none focus:border-cyan-400"
                >
                  {profilesData?.profiles?.map((p) => (
                    <option key={p.state} value={p.state}>{p.state}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Selected State 20-Year Stats Banner */}
            {timelineData?.statistics && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold">20-Yr Mean Departure</span>
                  <div className="text-lg font-mono font-black text-cyan-300">
                    {timelineData.statistics.mean_departure_pct > 0 ? `+${timelineData.statistics.mean_departure_pct}%` : `${timelineData.statistics.mean_departure_pct}%`}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Max Excess Year</span>
                  <div className="text-lg font-mono font-black text-emerald-400">
                    {timelineData.statistics.max_excess_year} <span className="text-xs font-normal text-slate-400">(+{timelineData.statistics.max_excess_departure_pct}%)</span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Max Deficit Year</span>
                  <div className="text-lg font-mono font-black text-rose-400">
                    {timelineData.statistics.max_deficit_year} <span className="text-xs font-normal text-slate-400">({timelineData.statistics.max_deficit_departure_pct}%)</span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Risk Tier & Elasticity</span>
                  <div className="text-sm font-black text-amber-300 truncate mt-0.5">
                    {timelineData.statistics.risk_tier.replace(/_/g, ' ')} ({timelineData.statistics.elasticity}x)
                  </div>
                </div>
              </div>
            )}

            {/* Visual Year-by-Year Bar Graph */}
            {timelineData?.timeline && (
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-cyan-400" /> Annual Monsoon Departure (% Departure from Normal LPA)
                </h4>
                
                <div className="grid grid-cols-7 sm:grid-cols-11 md:grid-cols-21 gap-1.5 items-end h-44 bg-slate-950 p-4 rounded-xl border border-slate-800">
                  {timelineData.timeline.map((item) => {
                    const isPositive = item.departure_pct >= 0;
                    const heightPct = Math.min(100, Math.abs(item.departure_pct) * 2 + 10);
                    return (
                      <div key={item.year} className="flex flex-col items-center justify-end h-full group relative">
                        {/* Tooltip on hover */}
                        <div className="opacity-0 group-hover:opacity-100 transition absolute bottom-full mb-2 bg-slate-800 border border-slate-700 text-white text-[10px] p-2 rounded-lg pointer-events-none z-20 whitespace-nowrap shadow-xl">
                          <p className="font-bold">{item.year}: {item.departure_pct}%</p>
                          <p className="text-slate-400">{item.category}</p>
                        </div>

                        <div
                          className={`w-full rounded-t transition-all ${
                            isPositive
                              ? item.departure_pct >= 20 ? 'bg-rose-500' : 'bg-cyan-500'
                              : item.departure_pct <= -20 ? 'bg-amber-500' : 'bg-blue-600'
                          }`}
                          style={{ height: `${heightPct}%` }}
                        ></div>
                        <span className="text-[9px] text-slate-500 font-mono mt-1 rotate-45 sm:rotate-0">
                          {String(item.year).slice(2)}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-center gap-4 text-[10px] text-slate-400 font-semibold pt-1">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-rose-500 rounded-sm"></span> Excess (&gt;=20%)</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-cyan-500 rounded-sm"></span> Normal / Slight Excess</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-amber-500 rounded-sm"></span> Deficient (&lt;=-20%)</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: PROJECT-LEVEL CLIMATE AUDITOR */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'projects' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-black text-base text-white">Project-Level Climate Exposure & Schedule Multiplier Audit</h3>
                <p className="text-xs text-slate-400">Auditing 2,207 real mega-projects against state terrain and seasonal downtime factors</p>
              </div>

              {/* Sector Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">Sector:</span>
                <select
                  value={sectorFilter}
                  onChange={(e) => setSectorFilter(e.target.value)}
                  className="bg-slate-800 text-cyan-300 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold outline-none"
                >
                  <option value="ALL">All Sectors</option>
                  <option value="Road">Roads & Highways</option>
                  <option value="Rail">Railways</option>
                  <option value="Power">Power</option>
                  <option value="Petroleum">Petroleum & Gas</option>
                  <option value="Aviation">Civil Aviation</option>
                </select>
              </div>
            </div>

            {/* Project List Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-bold">
                    <th className="py-3 px-3">Project & ID</th>
                    <th className="py-3 px-3">Sector & State</th>
                    <th className="py-3 px-3">Cost (₹ Cr)</th>
                    <th className="py-3 px-3">Weather Downtime</th>
                    <th className="py-3 px-3">Schedule Stretch</th>
                    <th className="py-3 px-3">Climate Recommendation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredProjects.map((p) => (
                    <tr key={p.project_id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-3">
                        <div className="font-bold text-white max-w-xs truncate">{p.project_name}</div>
                        <span className="text-[10px] text-slate-500 font-mono">ID: {p.project_id}</span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="text-cyan-300 font-semibold">{p.sector}</div>
                        <span className="text-[10px] text-slate-400">{p.state} ({p.region})</span>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-200">
                        ₹{p.original_cost_cr?.toLocaleString()} Cr
                      </td>
                      <td className="py-3 px-3 font-mono">
                        <div className="text-rose-400 font-bold">{p.annual_weather_downtime_days} Days/yr</div>
                        <span className="text-[10px] text-slate-500">Working: {p.effective_annual_working_months} Mo/yr</span>
                      </td>
                      <td className="py-3 px-3 font-mono">
                        <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold">
                          {p.schedule_stretch_multiplier}x
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-300 text-[11px] max-w-sm">
                        {p.climate_adjustment_recommendation}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="text-center text-xs text-slate-500 pt-4 border-t border-slate-800/80">
        PRAKALP-DRISHTI · VARSHA-SPEED Module · Lead: Janhavi · MoSPI Central Sector Mega-Projects Decision System
      </div>
    </div>
  );
}
