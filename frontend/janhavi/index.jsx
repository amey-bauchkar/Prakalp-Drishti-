import React, { useState, useEffect } from 'react';
import {
  CloudRain, Droplets, Sun, Calendar, AlertTriangle, Sliders, RefreshCw, Search,
  Filter, BarChart3, Compass, Layers, ArrowUpRight, TrendingDown, Building2,
  MapPin, Clock, ShieldCheck, CheckCircle2, Info, ArrowRight, ChevronRight
} from 'lucide-react';

export default function VarshaSpeedView() {
  const [anomaly, setAnomaly] = useState(0.0);
  const [impactData, setImpactData] = useState(null);
  const [profilesData, setProfilesData] = useState(null);
  const [timelineData, setTimelineData] = useState(null);
  const [selectedState, setSelectedState] = useState('Assam');
  const [projectsData, setProjectsData] = useState(null);
  const [activeTab, setActiveTab] = useState('simulation');
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

  const [selectedProjectId, setSelectedProjectId] = useState(() => localStorage.getItem('prakalp:selectedProjectId') || '619092');

  // Global project sync
  useEffect(() => {
    const handleSelect = (e) => {
      if (e.detail) {
        setSelectedProjectId(String(e.detail));
      }
    };
    window.addEventListener('prakalp:selectProject', handleSelect);
    return () => window.removeEventListener('prakalp:selectProject', handleSelect);
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      fetch(`/api/projects/${selectedProjectId}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((p) => {
          if (p && p.state) {
            handleStateSelect(p.state);
            setSearchTerm(p.project_name || p.project_id);
          }
        })
        .catch(() => {});
    }
  }, [selectedProjectId]);

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
    if (tier?.includes('CRITICAL')) return 'bg-rose-50 text-rose-700 border-rose-300';
    if (tier?.includes('SEVERE')) return 'bg-orange-50 text-orange-700 border-orange-300';
    if (tier?.includes('LANDSLIDE')) return 'bg-amber-50 text-amber-800 border-amber-300';
    if (tier?.includes('CYCLONIC') || tier?.includes('HIGH_PRECIPITATION')) return 'bg-sky-50 text-sky-700 border-sky-300';
    return 'bg-emerald-50 text-emerald-700 border-emerald-300';
  };

  return (
    <div className="space-y-8 font-sans">
      {/* ═══════ MODULE HERO (SOVEREIGN INSTITUTIONAL DOSSIER) ═══════ */}
      <section className="panel p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-gov-saffron-light text-gov-saffron-dark border border-gov-gold-border text-[11px] font-bold uppercase tracking-wider font-mono">
              <CloudRain className="w-3.5 h-3.5 text-gov-saffron" />
              <span>VARSHA-SPEED · Monsoon Weather Impact</span>
            </div>
            <h1 className="font-heading font-extrabold text-[30px] sm:text-[38px] leading-[1.15] text-gov-navy tracking-tight">
              Monsoon Working-Window<br />
              Contraction &amp; Schedule Multiplier
            </h1>
            <p className="text-text-secondary text-[15px] sm:text-[15.5px] leading-relaxed max-w-2xl font-sans">
              Powered by 20-year empirical IMD state-level rainfall departures (2005–2025 · 630 state-years). 
              Calculates precise lost construction days, working-window compression, and schedule stretch 
              multipliers across 2,207 mega-projects.
            </p>
          </div>

          <div className="lg:col-span-4 flex justify-center lg:justify-end">
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-7 text-center w-full max-w-xs shadow-subtle">
              <div className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-2 font-mono">Coverage</div>
              <div className="text-[28px] font-heading font-black text-gov-navy leading-snug">630 State-Years</div>
              <div className="text-[13.5px] text-text-secondary font-bold mt-2">30 states · 20-year IMD dataset</div>
              <div className="text-[11px] font-mono text-gov-saffron-dark mt-1 font-bold">2005–2025 empirical rainfall data</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ STAT STRIP ═══════ */}
      {impactData?.national_summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="panel p-4">
            <div className="text-[11.5px] text-text-muted font-bold uppercase tracking-wider">Working Window</div>
            <div className="text-[30px] font-black text-gov-navy mt-1 tracking-tight font-mono">{impactData.national_summary.average_working_window_months} mo/yr</div>
            <div className="text-[12px] text-text-muted mt-1 font-medium">National average</div>
          </div>
          <div className="panel p-4">
            <div className="text-[11.5px] text-text-muted font-bold uppercase tracking-wider">Lost Weather Days</div>
            <div className="text-[30px] font-black text-rose-600 mt-1 tracking-tight font-mono">{impactData.national_summary.average_lost_days_per_year} days</div>
            <div className="text-[12px] text-text-muted mt-1 font-medium">Average per year</div>
          </div>
          <div className="panel p-4">
            <div className="text-[11.5px] text-text-muted font-bold uppercase tracking-wider">Schedule Stretch</div>
            <div className="text-[30px] font-black text-amber-600 mt-1 tracking-tight font-mono">{impactData.national_summary.national_schedule_stretch_multiplier}×</div>
            <div className="text-[12px] text-text-muted mt-1 font-medium">Multiplier</div>
          </div>
          <div className="panel p-4">
            <div className="text-[11.5px] text-text-muted font-bold uppercase tracking-wider">Most Vulnerable</div>
            <div className="text-[20px] font-black text-rose-600 mt-2 truncate font-heading">{impactData.national_summary.most_vulnerable_state}</div>
            <div className="text-[12px] text-text-muted mt-1 font-medium">Highest weather impact</div>
          </div>
        </div>
      )}

      {/* Module Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('simulation')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold transition-all whitespace-nowrap ${
            activeTab === 'simulation'
              ? 'bg-gov-navy text-white shadow-elevated'
              : 'bg-transparent text-text-secondary hover:text-gov-navy hover:bg-white/80'
          }`}
        >
          <span>Working-Window Simulator</span>
        </button>
        <button
          onClick={() => setActiveTab('historical')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold transition-all whitespace-nowrap ${
            activeTab === 'historical'
              ? 'bg-gov-navy text-white shadow-elevated'
              : 'bg-transparent text-text-secondary hover:text-gov-navy hover:bg-white/80'
          }`}
        >
          <span>Historical Departure Explorer</span>
        </button>
        <button
          onClick={() => setActiveTab('projects')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold transition-all whitespace-nowrap ${
            activeTab === 'projects'
              ? 'bg-gov-navy text-white shadow-elevated'
              : 'bg-transparent text-text-secondary hover:text-gov-navy hover:bg-white/80'
          }`}
        >
          <span>Project Climate Exposure</span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: WORKING-WINDOW SIMULATOR */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'simulation' && (
        <div className="space-y-6">
          {/* Interactive Slider & Scenario Bar */}
          <div className="bg-gov-navy text-white p-7 sm:p-8 rounded-3xl border border-slate-700/80 shadow-elevated space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-white/10 text-gov-saffron border border-white/15">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-[15px] text-white uppercase tracking-wider font-heading">
                    Simulate Pan-India Monsoon Rainfall Anomaly
                  </h3>
                  <p className="text-xs text-slate-300">
                    Adjust IMD departure to observe real-time compression of construction working calendars
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-4 py-2 rounded-xl bg-white/10 text-gov-saffron-light border border-white/20">
                  {anomaly > 0 ? `+${anomaly}% Departure (Excess)` : anomaly < 0 ? `${anomaly}% Departure (Deficit)` : `0% Normal LPA`}
                </span>
                {loading && <RefreshCw className="w-4 h-4 animate-spin text-gov-saffron" />}
              </div>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="text-[11px] text-slate-300 font-bold self-center mr-1">Historical Presets:</span>
              <button
                onClick={() => { setAnomaly(0.0); fetchMonsoonImpact(0.0); }}
                className={`text-xs px-3.5 py-1.5 rounded-xl font-bold transition ${anomaly === 0 ? 'bg-gov-saffron text-white shadow-md' : 'bg-white/10 text-slate-200 hover:bg-white/20 border border-white/15'}`}
              >
                Normal LPA (0%)
              </button>
              <button
                onClick={() => { setAnomaly(15.0); fetchMonsoonImpact(15.0); }}
                className={`text-xs px-3.5 py-1.5 rounded-xl font-bold transition ${anomaly === 15 ? 'bg-gov-saffron text-white shadow-md' : 'bg-white/10 text-slate-200 hover:bg-white/20 border border-white/15'}`}
              >
                Moderate Excess (+15%)
              </button>
              <button
                onClick={() => { setAnomaly(25.0); fetchMonsoonImpact(25.0); }}
                className={`text-xs px-3.5 py-1.5 rounded-xl font-bold transition ${anomaly === 25 ? 'bg-gov-saffron text-white shadow-md' : 'bg-white/10 text-slate-200 hover:bg-white/20 border border-white/15'}`}
              >
                2023 Heavy Flood (+25%)
              </button>
              <button
                onClick={() => { setAnomaly(-20.0); fetchMonsoonImpact(-20.0); }}
                className={`text-xs px-3.5 py-1.5 rounded-xl font-bold transition ${anomaly === -20 ? 'bg-gov-saffron text-white shadow-md' : 'bg-white/10 text-slate-200 hover:bg-white/20 border border-white/15'}`}
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
                className="w-full accent-gov-saffron cursor-pointer h-2.5 bg-slate-800 rounded-lg"
              />

              <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-2 font-mono">
                <span className="text-left">-50% Extreme Drought</span>
                <span className="text-center">-25% Deficient</span>
                <span className={`text-center font-black transition-colors ${anomaly === 0 ? 'text-gov-saffron-light' : 'text-slate-400'}`}>0% Normal LPA</span>
                <span className="text-center">+25% Heavy Flood</span>
                <span className="text-right">+50% Extreme Inundation</span>
              </div>
            </div>

            {impactData?.scenario_interpretation && (
              <div className="p-4 rounded-2xl bg-white/10 border border-white/15 flex items-start gap-2.5 text-[13px] text-slate-200">
                <Info className="w-4 h-4 text-gov-saffron shrink-0 mt-0.5" />
                <span><strong>Scenario Assessment:</strong> {impactData.scenario_interpretation}</span>
              </div>
            )}
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto no-scrollbar pb-1 sm:pb-0">
              <span className="text-xs text-text-muted font-bold flex items-center gap-1 mr-1">
                <Filter className="w-3.5 h-3.5" /> Region:
              </span>
              {['ALL', 'North-East', 'North', 'South', 'East', 'West', 'Central'].map((r) => (
                <button
                  key={r}
                  onClick={() => setRegionFilter(r)}
                  className={`text-xs px-3.5 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
                    regionFilter === r
                      ? 'bg-gov-navy text-white shadow-sm'
                      : 'bg-white text-text-secondary hover:bg-slate-50 border border-border-default'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-text-muted" />
              <input
                type="text"
                placeholder="Search state or terrain..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-border-default text-gov-navy pl-10 pr-3 py-2 rounded-xl text-xs outline-none focus:border-gov-navy shadow-sm"
              />
            </div>
          </div>

          {/* State Working Window Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredStates.map((rec, idx) => (
              <div
                key={idx}
                className="panel p-4 space-y-4 hover:border-gov-saffron/40 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-heading font-extrabold text-[17px] text-gov-navy">{rec.state}</h4>
                    <p className="text-[12px] text-text-muted font-medium">{rec.terrain}</p>
                  </div>
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-sm border font-bold uppercase ${getRiskBadgeColor(rec.risk_tier)}`}>
                    {rec.risk_tier.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="space-y-2.5 pt-3 border-t border-border-default text-[12.5px]">
                  <div className="flex justify-between items-center">
                    <span className="text-text-muted">Simulated Lost Days:</span>
                    <span className="font-mono font-bold text-rose-600">{rec.simulated_lost_days} Days</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-text-muted">Effective Working Window:</span>
                    <span className="font-mono font-bold text-gov-navy">{rec.effective_working_window_months} Mo/yr</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-text-muted">Schedule Multiplier:</span>
                    <span className="font-mono font-bold text-amber-700">{rec.schedule_stretch_multiplier}x Multiplier</span>
                  </div>
                </div>

                {/* Progress bar representing work window */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-[10.5px] text-text-muted font-mono font-bold">
                    <span>Working Months</span>
                    <span>{rec.effective_working_window_months} / 12.0</span>
                  </div>
                  <div className="meter">
                    <div
                      className="h-full bg-gov-navy-light"
                      style={{ width: `${(rec.effective_working_window_months / 12.0) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="pt-3 border-t border-border-default flex items-center justify-between text-[11px] text-text-muted font-medium">
                  <span>Hist. Mean Departure: <strong className="text-gov-navy font-mono">{rec.historical_mean_departure_pct}%</strong></span>
                  <button
                    onClick={() => { setSelectedState(rec.state); fetchStateTimeline(rec.state); setActiveTab('historical'); }}
                    className="text-gov-saffron hover:underline font-bold flex items-center gap-0.5"
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
        <div className="panel p-4 sm:p-5 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-default pb-4">
            <div>
              <h3 className="font-heading font-extrabold text-[18px] text-gov-navy">20-Year IMD Monsoon Departure Explorer (2005–2025)</h3>
              <p className="text-xs text-text-muted">Real empirical rainfall anomalies recorded by the India Meteorological Department</p>
            </div>

            {/* State Selector Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gov-navy">Select State:</span>
              <select
                value={selectedState}
                onChange={(e) => handleStateSelect(e.target.value)}
                className="bg-slate-50 text-gov-navy border border-border-default px-3.5 py-2 rounded-xl text-xs font-bold outline-none focus:border-gov-navy shadow-sm"
              >
                {profilesData?.profiles?.map((p) => (
                  <option key={p.state} value={p.state}>{p.state}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Selected State 20-Year Stats Banner */}
          {timelineData?.statistics && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
              <div>
                <span className="text-[10.5px] text-text-muted uppercase font-bold">20-Yr Mean Departure</span>
                <div className="text-[20px] font-mono font-black text-gov-navy">
                  {timelineData.statistics.mean_departure_pct > 0 ? `+${timelineData.statistics.mean_departure_pct}%` : `${timelineData.statistics.mean_departure_pct}%`}
                </div>
              </div>
              <div>
                <span className="text-[10.5px] text-text-muted uppercase font-bold">Max Excess Year</span>
                <div className="text-[20px] font-mono font-black text-emerald-600">
                  {timelineData.statistics.max_excess_year} <span className="text-xs font-bold text-text-muted">(+{timelineData.statistics.max_excess_departure_pct}%)</span>
                </div>
              </div>
              <div>
                <span className="text-[10.5px] text-text-muted uppercase font-bold">Max Deficit Year</span>
                <div className="text-[20px] font-mono font-black text-rose-600">
                  {timelineData.statistics.max_deficit_year} <span className="text-xs font-bold text-text-muted">({timelineData.statistics.max_deficit_departure_pct}%)</span>
                </div>
              </div>
              <div>
                <span className="text-[10.5px] text-text-muted uppercase font-bold">Risk Tier &amp; Elasticity</span>
                <div className="text-[14px] font-bold text-amber-700 truncate mt-1">
                  {timelineData.statistics.risk_tier.replace(/_/g, ' ')} ({timelineData.statistics.elasticity}x)
                </div>
              </div>
            </div>
          )}

          {/* Visual Year-by-Year Bar Graph */}
          {timelineData?.timeline && (
            <div className="space-y-4 pt-2">
              <h4 className="text-xs font-bold text-gov-navy uppercase tracking-wider flex items-center gap-1.5 font-heading">
                <BarChart3 className="w-4 h-4 text-gov-saffron" /> Annual Monsoon Departure (% Departure from Normal LPA)
              </h4>
              
              <div className="grid grid-cols-7 sm:grid-cols-11 md:grid-cols-21 gap-1.5 items-end h-48 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                {timelineData.timeline.map((item) => {
                  const isPositive = item.departure_pct >= 0;
                  const heightPct = Math.min(100, Math.abs(item.departure_pct) * 2 + 10);
                  return (
                    <div key={item.year} className="flex flex-col items-center justify-end h-full group relative">
                      <div className="opacity-0 group-hover:opacity-100 transition absolute bottom-full mb-2 bg-gov-navy text-white text-[10px] p-2 rounded-xl pointer-events-none z-20 whitespace-nowrap shadow-xl border border-slate-700">
                        <p className="font-bold">{item.year}: {item.departure_pct}%</p>
                        <p className="text-slate-300">{item.category}</p>
                      </div>

                      <div
                        className={`w-full rounded-t transition-all ${
                          isPositive
                            ? item.departure_pct >= 20 ? 'bg-rose-500' : 'bg-gov-saffron'
                            : item.departure_pct <= -20 ? 'bg-amber-500' : 'bg-blue-600'
                        }`}
                        style={{ height: `${heightPct}%` }}
                      ></div>
                      <span className="text-[9px] text-text-muted font-mono mt-1 font-bold">
                        {String(item.year).slice(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-center gap-4 text-[11px] text-text-muted font-bold pt-1">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-rose-500 rounded-sm"></span> Excess (&gt;=20%)</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-gov-saffron rounded-sm"></span> Normal / Slight Excess</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-amber-500 rounded-sm"></span> Deficient (&lt;=-20%)</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: PROJECT-LEVEL CLIMATE AUDITOR */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'projects' && (
        <div className="panel p-4 sm:p-5 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-default pb-4">
            <div>
              <h3 className="font-heading font-extrabold text-[18px] text-gov-navy">Project-Level Climate Exposure &amp; Schedule Multiplier Audit</h3>
              <p className="text-xs text-text-muted">Auditing 2,207 real mega-projects against state terrain and seasonal downtime factors</p>
            </div>

            {/* Sector Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gov-navy">Sector:</span>
              <select
                value={sectorFilter}
                onChange={(e) => setSectorFilter(e.target.value)}
                className="bg-slate-50 text-gov-navy border border-border-default px-3.5 py-2 rounded-xl text-xs font-bold outline-none shadow-sm"
              >
                <option value="ALL">All Sectors</option>
                <option value="Road">Roads &amp; Highways</option>
                <option value="Rail">Railways</option>
                <option value="Power">Power</option>
                <option value="Petroleum">Petroleum &amp; Gas</option>
                <option value="Aviation">Civil Aviation</option>
              </select>
            </div>
          </div>

          {/* Project List Table */}
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Project &amp; ID</th>
                  <th>Sector &amp; State</th>
                  <th className="num">Cost (₹ Cr)</th>
                  <th>Weather Downtime</th>
                  <th className="text-center">Schedule Stretch</th>
                  <th>Climate Recommendation</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((p) => (
                  <tr key={p.project_id} className="hover:bg-slate-50/80 transition-colors">
                    <td>
                      <div className="font-bold text-gov-navy max-w-xs truncate">{p.project_name}</div>
                      <span className="text-[10.5px] text-text-muted font-mono">ID: #{p.project_id}</span>
                    </td>
                    <td>
                      <div className="font-medium text-gov-navy">{p.sector}</div>
                      <span className="text-[11px] text-text-muted">{p.state} ({p.region})</span>
                    </td>
                    <td className="num font-mono font-bold text-gov-navy">
                      ₹{p.original_cost_cr?.toLocaleString()} Cr
                    </td>
                    <td className="font-mono">
                      <div className="text-rose-600 font-bold">{p.annual_weather_downtime_days} Days/yr</div>
                      <span className="text-[10.5px] text-text-muted">Working: {p.effective_annual_working_months} Mo/yr</span>
                    </td>
                    <td className="text-center font-mono">
                      <span className="note note-warn">
                        {p.schedule_stretch_multiplier}x
                      </span>
                    </td>
                    <td className="text-text-secondary text-[12px] max-w-sm">
                      {p.climate_adjustment_recommendation}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Methodology */}
      <section className="panel p-5 sm:p-6">
        <h3 className="text-[17px] font-heading font-extrabold text-gov-navy mb-3">Methodology</h3>
        <p className="text-[14px] text-text-secondary leading-relaxed max-w-3xl font-sans">
          20-year empirical IMD state-level rainfall departure dataset (2005–2025, 630 state-years). 
          State-specific terrain coefficients calibrate construction sensitivity to precipitation. 
          Working-window compression and schedule stretch multipliers are computed using Weibull 
          survival regression models pegged to historical monsoon patterns.
        </p>
      </section>
    </div>
  );
}
