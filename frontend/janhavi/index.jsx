import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CloudRain, Droplets, Sun, Calendar, AlertTriangle, Sliders, RefreshCw, Search,
  Filter, BarChart3, Compass, Layers, ArrowUpRight, TrendingDown, Building2,
  MapPin, Clock, ShieldCheck, CheckCircle2, Info, ArrowRight, ChevronRight, ChevronLeft,
  ChevronDown, ChevronUp, Download, ArrowUpDown, Copy, Check, Sparkles
} from 'lucide-react';
import { getStoredLanguage } from '../src/lib/i18n';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.04 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 320, damping: 24 }
  }
};

export default function VarshaSpeedView({ lang: propLang }) {
  const [lang, setLang] = useState(() => propLang || getStoredLanguage());
  useEffect(() => { if (propLang) setLang(propLang); }, [propLang]);
  useEffect(() => {
    const onLang = (e) => setLang(e.detail || getStoredLanguage());
    window.addEventListener('prakalp:languageChanged', onLang);
    return () => window.removeEventListener('prakalp:languageChanged', onLang);
  }, []);
  const isHi = lang === 'hi';
  const [anomaly, setAnomaly] = useState(0.0);
  const [impactData, setImpactData] = useState(null);
  const [profilesData, setProfilesData] = useState(null);
  const [timelineData, setTimelineData] = useState(null);
  const [selectedState, setSelectedState] = useState('Assam');
  const [projectsData, setProjectsData] = useState(null);
  const [activeTab, setActiveTab] = useState('simulation');
  const [regionFilter, setRegionFilter] = useState('ALL');
  const [stateSearchTerm, setStateSearchTerm] = useState('');
  const [projectSearchTerm, setProjectSearchTerm] = useState('');
  const [sectorFilter, setSectorFilter] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  const [projectPage, setProjectPage] = useState(1);
  const PROJECT_PAGE_SIZE = 10;
  const [projectSortField, setProjectSortField] = useState('schedule_stretch_multiplier');
  const [projectSortAsc, setProjectSortAsc] = useState(false);
  const [expandedProjectId, setExpandedProjectId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Reset pagination when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [regionFilter, stateSearchTerm]);

  useEffect(() => {
    setProjectPage(1);
  }, [sectorFilter, projectSearchTerm, projectSortField, projectSortAsc]);

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
    fetch('/api/janhavi/project-weather-audit?limit=100&min_cost_cr=500')
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
    const matchesSearch = !stateSearchTerm ||
                          item.state.toLowerCase().includes(stateSearchTerm.toLowerCase()) ||
                          item.terrain.toLowerCase().includes(stateSearchTerm.toLowerCase());
    return matchesRegion && matchesSearch;
  });

  const totalPages = Math.ceil(filteredStates.length / PAGE_SIZE) || 1;
  const paginatedStates = filteredStates.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // Filtered projects list
  const filteredProjects = (projectsData?.projects || []).filter((p) => {
    const matchesSector = sectorFilter === 'ALL' || p.sector.toLowerCase().includes(sectorFilter.toLowerCase());
    const query = projectSearchTerm.toLowerCase().trim();
    const matchesSearch = !query ||
                          p.project_name?.toLowerCase().includes(query) ||
                          p.state?.toLowerCase().includes(query) ||
                          (p.terrain && p.terrain.toLowerCase().includes(query)) ||
                          (p.region && p.region.toLowerCase().includes(query)) ||
                          String(p.project_id).includes(query);
    return matchesSector && matchesSearch;
  });

  // Sorted projects list
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    let valA = a[projectSortField] ?? 0;
    let valB = b[projectSortField] ?? 0;
    if (typeof valA === 'string') {
      return projectSortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return projectSortAsc ? valA - valB : valB - valA;
  });

  const totalProjectPages = Math.ceil(sortedProjects.length / PROJECT_PAGE_SIZE) || 1;
  const paginatedProjects = sortedProjects.slice(
    (projectPage - 1) * PROJECT_PAGE_SIZE,
    projectPage * PROJECT_PAGE_SIZE
  );

  const handleProjectSort = (field) => {
    if (projectSortField === field) {
      setProjectSortAsc(!projectSortAsc);
    } else {
      setProjectSortField(field);
      setProjectSortAsc(false);
    }
  };

  const handleCopyId = (id, e) => {
    if (e) e.stopPropagation();
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(String(id));
      setCopiedId(String(id));
      setTimeout(() => setCopiedId(null), 1800);
    }
  };

  const exportToCSV = () => {
    if (!sortedProjects || !sortedProjects.length) return;
    const headers = [
      'Project ID', 'Project Name', 'Sector', 'State', 'Region', 'Terrain',
      'Sanctioned Cost (Cr)', 'Lost Weather Days/yr', 'Working Months/yr',
      'Schedule Multiplier', 'Weather Risk Tier', 'Climate Recommendation'
    ];
    const rows = sortedProjects.map(p => [
      `"${p.project_id || ''}"`,
      `"${(p.project_name || '').replace(/"/g, '""')}"`,
      `"${(p.sector || '').replace(/"/g, '""')}"`,
      `"${(p.state || '').replace(/"/g, '""')}"`,
      `"${(p.region || '').replace(/"/g, '""')}"`,
      `"${(p.terrain || '').replace(/"/g, '""')}"`,
      p.original_cost_cr != null ? Number(p.original_cost_cr).toFixed(2) : '',
      p.annual_weather_downtime_days != null ? Number(p.annual_weather_downtime_days).toFixed(1) : '',
      p.effective_annual_working_months != null ? Number(p.effective_annual_working_months).toFixed(1) : '',
      p.schedule_stretch_multiplier != null ? Number(p.schedule_stretch_multiplier).toFixed(2) : '',
      `"${(p.weather_risk_tier || '').replace(/"/g, '""')}"`,
      `"${(p.climate_adjustment_recommendation || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `project_climate_audit_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getRiskBadgeColor = (tier) => {
    if (tier?.includes('CRITICAL')) return 'bg-rose-50 text-rose-700 border-rose-300';
    if (tier?.includes('SEVERE')) return 'bg-orange-50 text-orange-700 border-orange-300';
    if (tier?.includes('LANDSLIDE')) return 'bg-amber-50 text-amber-800 border-amber-300';
    if (tier?.includes('CYCLONIC') || tier?.includes('HIGH_PRECIPITATION')) return 'bg-sky-50 text-sky-700 border-sky-300';
    return 'bg-emerald-50 text-emerald-700 border-emerald-300';
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-8 font-sans"
    >
      {/* ═══════ MODULE HERO (SOVEREIGN INSTITUTIONAL DOSSIER) ═══════ */}
      <motion.section variants={itemVariants} className="panel p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-4">
            <div className="inline-flex items-center gap-2 pl-2 pr-2.5 py-0.5 rounded-sm bg-white/10 text-[10px] font-extrabold tracking-institutional uppercase text-sky-400 border-l-2 border-sky-400 font-mono">
              <CloudRain className="w-3.5 h-3.5 text-white" />
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
              <div className="text-[11px] font-mono text-sky-700 mt-1 font-bold">2005–2025 empirical rainfall data</div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ═══════ STAT STRIP ═══════ */}
      {impactData?.national_summary && (
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="panel p-4">
            <div className="text-[11.5px] text-text-muted font-bold uppercase tracking-wider">{isHi ? 'कार्य अवधि' : 'Working Window'}</div>
            <div className="text-[30px] font-black text-gov-navy mt-1 tracking-tight font-mono">
              {impactData.national_summary.average_working_window_months} {isHi ? 'माह/वर्ष' : 'mo/yr'}
            </div>
            <div className="text-[12px] text-text-muted mt-1 font-medium">{isHi ? 'राष्ट्रीय औसत' : 'National average'}</div>
          </div>
          <div className="panel p-4">
            <div className="text-[11.5px] text-text-muted font-bold uppercase tracking-wider">{isHi ? 'मौसम के कारण नष्ट दिन' : 'Lost Weather Days'}</div>
            <div className="text-[30px] font-black text-rose-600 mt-1 tracking-tight font-mono">
              {impactData.national_summary.average_lost_days_per_year} {isHi ? 'दिन' : 'days'}
            </div>
            <div className="text-[12px] text-text-muted mt-1 font-medium">{isHi ? 'प्रति वर्ष औसत' : 'Average per year'}</div>
          </div>
          <div className="panel p-4">
            <div className="text-[11.5px] text-text-muted font-bold uppercase tracking-wider">{isHi ? 'समयसीमा विस्तार' : 'Schedule Stretch'}</div>
            <div className="text-[30px] font-black text-amber-600 mt-1 tracking-tight font-mono">{impactData.national_summary.national_schedule_stretch_multiplier}×</div>
            <div className="text-[12px] text-text-muted mt-1 font-medium">{isHi ? 'गुणक' : 'Multiplier'}</div>
          </div>
          <div className="panel p-4">
            <div className="text-[11.5px] text-text-muted font-bold uppercase tracking-wider">{isHi ? 'सर्वाधिक सुभेद्य' : 'Most Vulnerable'}</div>
            <div className="text-[20px] font-black text-rose-600 mt-2 truncate font-heading">{impactData.national_summary.most_vulnerable_state}</div>
            <div className="text-[12px] text-text-muted mt-1 font-medium">{isHi ? 'उच्चतम मौसम प्रभाव' : 'Highest weather impact'}</div>
          </div>
        </motion.div>
      )}

      {/* Module Tabs */}
      <motion.div variants={itemVariants} className="flex items-center gap-2 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('simulation')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold transition-all whitespace-nowrap ${
            activeTab === 'simulation'
              ? 'bg-gov-navy text-white shadow-elevated'
              : 'bg-transparent text-text-secondary hover:text-gov-navy hover:bg-white/80'
          }`}
        >
          <span>{isHi ? 'कार्य-अवधि सिमुलेटर' : 'Working-Window Simulator'}</span>
        </button>
        <button
          onClick={() => setActiveTab('historical')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold transition-all whitespace-nowrap ${
            activeTab === 'historical'
              ? 'bg-gov-navy text-white shadow-elevated'
              : 'bg-transparent text-text-secondary hover:text-gov-navy hover:bg-white/80'
          }`}
        >
          <span>{isHi ? 'ऐतिहासिक विचलन अन्वेषक' : 'Historical Departure Explorer'}</span>
        </button>
        <button
          onClick={() => setActiveTab('projects')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold transition-all whitespace-nowrap ${
            activeTab === 'projects'
              ? 'bg-gov-navy text-white shadow-elevated'
              : 'bg-transparent text-text-secondary hover:text-gov-navy hover:bg-white/80'
          }`}
        >
          <span>{isHi ? 'कॉर्पस परियोजना प्रभाव' : 'Corpus Project Impacts'}</span>
        </button>
      </motion.div>

      {/* Animated Tab Switcher Container */}
      <AnimatePresence mode="wait">

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: WORKING-WINDOW SIMULATOR */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'simulation' && (
        <motion.div
          key="simulation"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22, ease: "easeInOut" }}
          className="space-y-6"
        >
          {/* Interactive Slider & Scenario Bar */}
          <div className="bg-gov-navy text-white p-7 sm:p-8 rounded-3xl border border-slate-700/80 shadow-elevated space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-white/10 text-sky-400 border border-white/15">
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
                <span className="text-xs font-mono font-bold px-4 py-2 rounded-xl bg-white/10 text-sky-300 border border-white/20">
                  {anomaly > 0 ? `+${anomaly}% Departure (Excess)` : anomaly < 0 ? `${anomaly}% Departure (Deficit)` : `0% Normal LPA`}
                </span>
                {loading && <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />}
              </div>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="text-[11px] text-slate-300 font-bold self-center mr-1">Historical Presets:</span>
              <button
                onClick={() => { setAnomaly(0.0); fetchMonsoonImpact(0.0); }}
                className={`text-xs px-3.5 py-1.5 rounded-xl font-bold transition ${anomaly === 0 ? 'bg-sky-500 text-slate-950 font-black shadow-md shadow-sky-500/25' : 'bg-white/10 text-slate-200 hover:bg-white/20 border border-white/15'}`}
              >
                Normal LPA (0%)
              </button>
              <button
                onClick={() => { setAnomaly(10.0); fetchMonsoonImpact(10.0); }}
                className={`text-xs px-3.5 py-1.5 rounded-xl font-bold transition ${anomaly === 10 ? 'bg-sky-500 text-slate-950 font-black shadow-md shadow-sky-500/25' : 'bg-white/10 text-slate-200 hover:bg-white/20 border border-white/15'}`}
              >
                +10% Excess Monsoon (2019)
              </button>
              <button
                onClick={() => { setAnomaly(20.0); fetchMonsoonImpact(20.0); }}
                className={`text-xs px-3.5 py-1.5 rounded-xl font-bold transition ${anomaly === 20 ? 'bg-sky-500 text-slate-950 font-black shadow-md shadow-sky-500/25' : 'bg-white/10 text-slate-200 hover:bg-white/20 border border-white/15'}`}
              >
                +20% Severe Flood Season
              </button>
              <button
                onClick={() => { setAnomaly(-15.0); fetchMonsoonImpact(-15.0); }}
                className={`text-xs px-3.5 py-1.5 rounded-xl font-bold transition ${anomaly === -15 ? 'bg-sky-500 text-slate-950 font-black shadow-md shadow-sky-500/25' : 'bg-white/10 text-slate-200 hover:bg-white/20 border border-white/15'}`}
              >
                -15% Drought / Delayed Monsoon (2014)
              </button>
            </div>

            {/* Slider Bar */}
            <div className="space-y-2 pt-2">
              <input
                type="range"
                aria-label="Monsoon rainfall departure from the long period average"
                aria-valuetext={`${anomaly > 0 ? 'Excess ' : anomaly < 0 ? 'Deficit ' : 'Normal, '}${anomaly}% departure from the long period average`}
                min="-30"
                max="30"
                step="1"
                value={anomaly}
                onChange={handleSliderChange}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-400"
              />
              <div className="flex justify-between text-[11px] font-mono text-slate-400 font-bold">
                <span>-30% (Extreme Deficit)</span>
                <span>-15%</span>
                <span className="text-white">0% (Normal LPA)</span>
                <span>+15%</span>
                <span>+30% (Extreme Monsoon)</span>
              </div>
            </div>
          </div>

          {/* Search, Filter and Region Selector Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 panel p-4 bg-slate-50 border border-slate-200">
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search state name..."
                value={stateSearchTerm}
                onChange={(e) => setStateSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-border-default rounded-xl text-xs font-bold text-gov-navy placeholder:text-text-muted outline-none focus:border-gov-navy transition shadow-xs"
              />
              {stateSearchTerm && (
                <button
                  onClick={() => setStateSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-text-muted hover:text-gov-navy"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Region Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto no-scrollbar pb-1 sm:pb-0">
              <span className="text-[11px] font-bold text-text-muted uppercase mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3" /> Region:
              </span>
              {['ALL', 'NORTHEAST', 'HIMALAYAN', 'COASTAL', 'EASTERN', 'WESTERN', 'NORTHERN', 'SOUTHERN', 'CENTRAL'].map((reg) => (
                <button
                  key={reg}
                  onClick={() => setRegionFilter(reg)}
                  className={`text-[11px] px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap ${
                    regionFilter === reg
                      ? 'bg-gov-navy text-white shadow-xs'
                      : 'bg-white text-text-secondary border border-border-default hover:border-gov-navy hover:text-gov-navy'
                  }`}
                >
                  {reg}
                </button>
              ))}
            </div>
          </div>

          {/* Results Count and Reset Header */}
          <div className="flex items-center justify-between px-1 text-xs text-text-muted font-bold">
            <span>
              Showing {filteredStates.length} of {impactData?.state_impact_records?.length || 30} Monitored States &amp; UTs
            </span>
            {(stateSearchTerm || regionFilter !== 'ALL') && (
              <button
                onClick={() => { setStateSearchTerm(''); setRegionFilter('ALL'); }}
                className="text-sky-600 hover:text-sky-800 hover:underline flex items-center gap-1 font-bold"
              >
                <RefreshCw className="w-3 h-3" /> Reset Filters
              </button>
            )}
          </div>

          {/* State Impact Grid */}
          {filteredStates.length > 0 ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {paginatedStates.map((rec, idx) => {
                  const isSelected = rec.state.toLowerCase() === selectedState.toLowerCase();
                  return (
                    <div
                      key={idx}
                      className={`bg-white rounded-2xl border transition-all duration-200 p-5 space-y-4 hover:shadow-lg hover:border-sky-400/60 flex flex-col justify-between ${
                        isSelected
                          ? 'border-amber-400 shadow-md ring-2 ring-amber-400/30 bg-gradient-to-b from-amber-50/30 via-white to-white'
                          : 'border-slate-200/90 shadow-sm'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-heading font-extrabold text-[17px] text-slate-900 tracking-tight">{rec.state}</h4>
                            {isSelected && (
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-mono uppercase tracking-wider border border-amber-300">
                                Active State
                              </span>
                            )}
                          </div>
                          <p className="text-[12px] text-slate-500 font-medium mt-0.5">{rec.terrain}</p>
                        </div>
                        <span className={`text-[10px] px-2.5 py-1 rounded-full border font-bold uppercase tracking-wider shrink-0 ${getRiskBadgeColor(rec.risk_tier)}`}>
                          {rec.risk_tier.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div className="space-y-2.5 pt-3 border-t border-slate-100 text-[12.5px]">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-medium">Simulated Lost Days:</span>
                          <span className="font-mono font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200/60">
                            {rec.simulated_lost_days} Days
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-medium">Effective Working Window:</span>
                          <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                            {rec.effective_working_window_months} Mo/yr
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-medium">Schedule Multiplier:</span>
                          <span className="font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            {rec.schedule_stretch_multiplier}x Multiplier
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-1">
                        <div className="flex justify-between text-[11px] text-slate-500 font-mono font-bold">
                          <span>Working Months</span>
                          <span className="text-slate-700">{rec.effective_working_window_months} / 12.0</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
                          <div
                            className="h-full bg-gradient-to-r from-sky-500 to-indigo-600 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, (rec.effective_working_window_months / 12.0) * 100)}%` }}
                          />
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11.5px] text-slate-500 font-medium">
                        <span>Hist. Mean Departure: <strong className="text-slate-800 font-mono">{rec.historical_mean_departure_pct}%</strong></span>
                        <button
                          onClick={() => { setSelectedState(rec.state); fetchStateTimeline(rec.state); setActiveTab('historical'); }}
                          className="text-sky-600 hover:text-sky-800 hover:underline font-bold flex items-center gap-1 transition-colors"
                        >
                          View 20-Yr Trend <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 10-per-page Pagination Controls */}
              {filteredStates.length > PAGE_SIZE && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 px-2 border-t border-slate-200/70">
                  <div className="text-xs font-bold text-slate-500 font-mono">
                    Showing {((currentPage - 1) * PAGE_SIZE) + 1}–{Math.min(currentPage * PAGE_SIZE, filteredStates.length)} of {filteredStates.length} Monitored States (Page {currentPage} of {totalPages})
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" /> Previous
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                      <button
                        key={pg}
                        onClick={() => setCurrentPage(pg)}
                        className={`w-8 h-8 rounded-xl text-xs font-bold font-mono transition shadow-xs ${
                          currentPage === pg
                            ? 'bg-gov-navy text-white shadow-sm ring-1 ring-gov-navy'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {pg}
                      </button>
                    ))}

                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition"
                    >
                      Next <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="panel p-8 text-center space-y-3 bg-slate-50 border border-slate-200">
              <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
              <h4 className="font-heading font-bold text-[16px] text-gov-navy">No states match your search criteria</h4>
              <p className="text-xs text-text-muted">
                {stateSearchTerm ? `No states matching "${stateSearchTerm}" in region "${regionFilter}".` : `No states found in region "${regionFilter}".`}
              </p>
              <button
                onClick={() => { setStateSearchTerm(''); setRegionFilter('ALL'); }}
                className="px-4 py-2 bg-gov-navy text-white text-xs font-bold rounded-xl shadow-sm hover:bg-gov-navy-light transition"
              >
                Reset Filters &amp; View All 30 States
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: HISTORICAL 20-YEAR IMD DEPARTURES */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'historical' && (
        <motion.div
          key="historical"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22, ease: "easeInOut" }}
          className="panel p-4 sm:p-5 space-y-6"
        >
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
                  const heightPct = Math.min(100, Math.abs(item.departure_pct) * 2 + 10);
                  return (
                    <div key={item.year} className="flex flex-col items-center justify-end h-full group relative">
                      <div className="opacity-0 group-hover:opacity-100 transition absolute bottom-full mb-2 bg-gov-navy text-white text-[10px] p-2 rounded-xl pointer-events-none z-20 whitespace-nowrap shadow-xl border border-slate-700">
                        <p className="font-bold">{item.year}: {item.departure_pct}%</p>
                        <p className="text-slate-300">{item.category}</p>
                      </div>

                      <div
                        className={`w-full rounded-t-lg transition-all ${
                          item.departure_pct >= 20
                            ? 'bg-rose-500'
                            : item.departure_pct <= -20
                            ? 'bg-amber-500'
                            : 'bg-gov-saffron'
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
        </motion.div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: PROJECT-LEVEL CLIMATE AUDITOR */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'projects' && (
        <motion.div
          key="projects"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22, ease: "easeInOut" }}
          className="space-y-6"
        >
          {/* Main Card Container */}
          <div className="panel p-5 sm:p-7 rounded-3xl bg-white border border-slate-200 shadow-md space-y-6">
            {/* Header with Title and CSV Export */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200">
              <div className="space-y-1.5 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md bg-sky-50 text-sky-800 text-[10.5px] font-extrabold uppercase tracking-wider border border-sky-200 font-mono">
                  <CloudRain className="w-3.5 h-3.5 text-sky-600" />
                  <span>{isHi ? 'परियोजना-स्तरीय जलवायु संवेदनशीलता' : 'PROJECT-LEVEL CLIMATE RESILIENCE AUDIT'}</span>
                </div>
                <h3 className="font-heading font-black text-[20px] sm:text-[22px] text-slate-900 tracking-tight leading-snug">
                  {isHi ? 'परियोजना मौसम जोखिम एवं समयसीमा विस्तार लेखापरीक्षा' : 'Project-Level Climate Exposure & Schedule Multiplier Audit'}
                </h3>
                <p className="text-xs text-slate-500 font-sans leading-relaxed">
                  {isHi
                    ? '२,२०७ वास्तविक केंद्रीय बुनियादी ढांचा परियोजनाओं का २०-वर्षीय आईएमडी विचलन, भू-भाग वर्गीकरण एवं कार्य दिवस हानि के विरुद्ध मूल्यांकन।'
                    : 'Auditing 2,207 real mega-projects against 20-year empirical IMD monsoon departures, state terrain elasticities, and lost construction working windows.'}
                </p>
              </div>

              <div className="flex items-center gap-3 self-start lg:self-center">
                <button
                  onClick={exportToCSV}
                  className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 shadow-xs transition-colors cursor-pointer"
                  title={isHi ? 'सीएसवी प्रारूप में डाउनलोड करें' : 'Export audited projects to CSV'}
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span>{isHi ? 'सीएसवी निर्यात' : 'Export CSV'}</span>
                </button>
              </div>
            </div>

            {/* KPI Metric Summary Strip */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-1">
                <div className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 font-mono flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>{isHi ? 'ऑडिटेड कॉर्पस' : 'Audited Corpus'}</span>
                </div>
                <div className="text-[22px] font-black font-mono text-slate-900 leading-tight">
                  {projectsData?.audited_count ? Number(projectsData.audited_count).toLocaleString('en-IN') : '1,385'}{' '}
                  <span className="text-xs font-bold text-slate-500 font-sans">{isHi ? 'परियोजनाएं' : 'Projects'}</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  {isHi ? 'लागत ≥ ₹५०० करोड़' : 'Sanctioned Cost ≥ ₹500 Cr'}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100 space-y-1">
                <div className="text-[10.5px] font-bold uppercase tracking-wider text-rose-700 font-mono flex items-center gap-1.5">
                  <CloudRain className="w-3.5 h-3.5 text-rose-500" />
                  <span>{isHi ? 'औसत मौसम हानि' : 'Avg Weather Loss'}</span>
                </div>
                <div className="text-[22px] font-black font-mono text-rose-700 leading-tight">
                  68.5 <span className="text-xs font-bold text-rose-600 font-sans">{isHi ? 'दिन/वर्ष' : 'Days / yr'}</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  {isHi ? 'वार्षिक गैर-कार्य दिवस' : 'Downtime per active year'}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 space-y-1">
                <div className="text-[10.5px] font-bold uppercase tracking-wider text-amber-800 font-mono flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>{isHi ? 'अधिकतम समयसीमा खिंचाव' : 'Peak Schedule Stretch'}</span>
                </div>
                <div className="text-[22px] font-black font-mono text-amber-800 leading-tight">
                  1.70× <span className="text-xs font-bold text-amber-700 font-sans">{isHi ? 'गुणक' : 'Multiplier'}</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  {isHi ? 'उच्च-सुभेद्य पहाड़ी भू-भाग' : 'Critical terrain corridors'}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-sky-50/50 border border-sky-100 space-y-1">
                <div className="text-[10.5px] font-bold uppercase tracking-wider text-sky-800 font-mono flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
                  <span>{isHi ? 'कैलिब्रेटेड राज्य' : 'Calibrated States'}</span>
                </div>
                <div className="text-[22px] font-black font-mono text-sky-900 leading-tight">
                  30 <span className="text-xs font-bold text-sky-700 font-sans">{isHi ? 'राज्य/कें.शा.प्र.' : 'States / UTs'}</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  {isHi ? '६३० राज्य-वर्ष डेटाबेस' : '630 state-years database'}
                </div>
              </div>
            </div>

            {/* Filter, Sector Pills & Sorting Toolbar */}
            <div className="space-y-3 pt-2">
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                {/* Search Bar */}
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder={isHi ? 'परियोजना नाम, राज्य, आईडी या भू-भाग खोजें…' : 'Search project name, state, ID, or terrain…'}
                    value={projectSearchTerm}
                    onChange={(e) => setProjectSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-400 outline-none focus:border-sky-600 focus:bg-white transition"
                  />
                  {projectSearchTerm && (
                    <button
                      onClick={() => setProjectSearchTerm('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Sort dropdown */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500 font-medium font-mono text-[11px]">{isHi ? 'क्रमबद्ध:' : 'Sort by:'}</span>
                  <select
                    value={`${projectSortField}_${projectSortAsc ? 'asc' : 'desc'}`}
                    onChange={(e) => {
                      const [f, d] = e.target.value.split('_');
                      setProjectSortField(f);
                      setProjectSortAsc(d === 'asc');
                    }}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-sky-600"
                  >
                    <option value="schedule_stretch_multiplier_desc">{isHi ? 'समयसीमा खिंचाव (अधिकतम)' : 'Schedule Stretch (Highest)'}</option>
                    <option value="schedule_stretch_multiplier_asc">{isHi ? 'समयसीमा खिंचाव (न्यूनतम)' : 'Schedule Stretch (Lowest)'}</option>
                    <option value="annual_weather_downtime_days_desc">{isHi ? 'मौसम दिवस हानि (अधिकतम)' : 'Weather Lost Days (Highest)'}</option>
                    <option value="original_cost_cr_desc">{isHi ? 'स्वीकृत लागत (अधिकतम)' : 'Sanctioned Cost (Highest)'}</option>
                    <option value="project_name_asc">{isHi ? 'परियोजना नाम (A–Z)' : 'Project Name (A–Z)'}</option>
                  </select>
                </div>
              </div>

              {/* Sector Quick Filter Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {[
                  { id: 'ALL', label: isHi ? 'सभी क्षेत्र' : 'All Sectors' },
                  { id: 'ROAD', label: isHi ? 'सड़क एवं राजमार्ग' : 'Roads & Highways' },
                  { id: 'RAIL', label: isHi ? 'रेलवे' : 'Railways' },
                  { id: 'POWER', label: isHi ? 'विद्युत एवं ऊर्जा' : 'Power & Renewable' },
                  { id: 'PETROLEUM', label: isHi ? 'पेट्रोलियम' : 'Petroleum' },
                  { id: 'WATER', label: isHi ? 'जल संसाधन' : 'Water Resources' },
                ].map((sec) => {
                  const active = sectorFilter === sec.id;
                  return (
                    <button
                      key={sec.id}
                      onClick={() => setSectorFilter(sec.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
                        active
                          ? 'bg-gov-navy text-white shadow-sm ring-1 ring-gov-navy'
                          : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200/60'
                      }`}
                    >
                      {sec.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Projects Table */}
            {sortedProjects.length === 0 ? (
              <div className="panel p-10 text-center space-y-3 bg-slate-50 border border-slate-200 rounded-2xl">
                <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
                <h4 className="font-heading font-bold text-[16px] text-slate-900">
                  {isHi ? 'कोई परियोजना खोज मानदंड से मेल नहीं खाती' : 'No projects match your search criteria'}
                </h4>
                <p className="text-xs text-slate-500">
                  {projectSearchTerm
                    ? (isHi ? `"${projectSearchTerm}" से मेल खाती कोई परियोजना नहीं मिली।` : `No projects matching "${projectSearchTerm}".`)
                    : (isHi ? 'चयनित क्षेत्र में कोई परियोजना नहीं मिली।' : 'No projects found in selected sector.')}
                </p>
                <button
                  onClick={() => { setProjectSearchTerm(''); setSectorFilter('ALL'); }}
                  className="px-4 py-2 bg-gov-navy text-white text-xs font-bold rounded-xl shadow-sm hover:bg-slate-800 transition"
                >
                  {isHi ? 'फ़िल्टर रीसेट करें' : 'Reset Filters & View All Projects'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 text-[11px] font-bold uppercase tracking-wider font-mono">
                          <th className="py-3.5 px-4 min-w-[280px]">
                            {isHi ? 'परियोजना नाम एवं पहचानकर्ता' : 'Project Name & Identifier'}
                          </th>
                          <th className="py-3.5 px-4 min-w-[180px]">
                            {isHi ? 'क्षेत्र एवं राज्य' : 'Sector & State'}
                          </th>
                          <th className="py-3.5 px-4 min-w-[130px] text-right">
                            {isHi ? 'स्वीकृत लागत' : 'Sanctioned Cost'}
                          </th>
                          <th className="py-3.5 px-4 min-w-[170px]">
                            {isHi ? 'मौसम हानि दिवस' : 'Lost Weather Days'}
                          </th>
                          <th className="py-3.5 px-4 min-w-[120px] text-center">
                            {isHi ? 'समयसीमा विस्तार' : 'Schedule Stretch'}
                          </th>
                          <th className="py-3.5 px-4 min-w-[100px] text-center">
                            {isHi ? 'कार्य विवरण' : 'Details'}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {paginatedProjects.map((p) => {
                          const isSelected = String(p.project_id) === String(selectedProjectId);
                          const isExpanded = expandedProjectId === p.project_id;
                          const isCopied = copiedId === String(p.project_id);

                          return (
                            <React.Fragment key={p.project_id}>
                              <tr
                                tabIndex={0}
                                aria-selected={isSelected}
                                onClick={() => {
                                  setSelectedProjectId(String(p.project_id));
                                  try { localStorage.setItem('prakalp:selectedProjectId', String(p.project_id)); } catch (_) {}
                                  window.dispatchEvent(new CustomEvent('prakalp:selectProject', { detail: String(p.project_id) }));
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    setSelectedProjectId(String(p.project_id));
                                    try { localStorage.setItem('prakalp:selectedProjectId', String(p.project_id)); } catch (_) {}
                                    window.dispatchEvent(new CustomEvent('prakalp:selectProject', { detail: String(p.project_id) }));
                                  }
                                }}
                                className={`cursor-pointer transition-colors group ${
                                  isSelected
                                    ? 'bg-sky-50/70 border-l-4 border-l-sky-600'
                                    : 'hover:bg-slate-50/80'
                                }`}
                              >
                                {/* Project Name & Badges */}
                                <td className="py-3 px-4 max-w-[280px]">
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <span
                                      onClick={(e) => handleCopyId(p.project_id, e)}
                                      className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 inline-flex items-center gap-1 shrink-0 transition"
                                      title={isHi ? 'आईडी कॉपी करें' : 'Click to copy Project ID'}
                                    >
                                      #{p.project_id}
                                      {isCopied ? (
                                        <Check className="w-2.5 h-2.5 text-emerald-600" />
                                      ) : (
                                        <Copy className="w-2.5 h-2.5 text-slate-400 opacity-70" />
                                      )}
                                    </span>
                                    {p.terrain && (
                                      <span
                                        className="text-[10px] text-slate-400 font-medium truncate max-w-[170px]"
                                        title={p.terrain}
                                      >
                                        {p.terrain}
                                      </span>
                                    )}
                                  </div>
                                  <div
                                    className="font-semibold text-xs text-slate-900 truncate block group-hover:text-sky-700 transition"
                                    title={p.project_name}
                                  >
                                    {p.project_name}
                                  </div>
                                </td>

                                {/* Sector & State */}
                                <td className="py-3 px-4 max-w-[180px]">
                                  <div className="font-semibold text-slate-800 text-xs truncate" title={p.sector}>
                                    {p.sector}
                                  </div>
                                  <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 truncate" title={`${p.state} ${p.region ? `• ${p.region}` : ''}`}>
                                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                    <span className="truncate">{p.state} {p.region ? `• ${p.region}` : ''}</span>
                                  </div>
                                </td>

                                {/* Sanctioned Cost */}
                                <td className="py-3 px-4 text-right whitespace-nowrap">
                                  <div className="font-mono font-bold text-xs text-slate-900">
                                    ₹{Number(p.original_cost_cr || 0).toLocaleString('en-IN')} Cr
                                  </div>
                                  {p.physical_progress_pct != null && (
                                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                      {p.physical_progress_pct}% {isHi ? 'प्रगति' : 'progress'}
                                    </div>
                                  )}
                                </td>

                                {/* Lost Weather Days & Calendar */}
                                <td className="py-3 px-4 whitespace-nowrap">
                                  <div className="font-mono font-bold text-xs text-rose-600 flex items-center gap-1">
                                    <CloudRain className="w-3 h-3 text-rose-500 shrink-0" />
                                    <span>{p.annual_weather_downtime_days} {isHi ? 'दिन' : 'Days/yr'}</span>
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                                    {isHi ? 'कार्य:' : 'Working:'} <strong className="text-slate-600 font-mono">{p.effective_annual_working_months}</strong> Mo/yr
                                  </div>
                                </td>

                                {/* Schedule Stretch Multiplier */}
                                <td className="py-3 px-4 text-center whitespace-nowrap">
                                  <span
                                    className={`px-2 py-0.5 rounded-md text-xs font-mono font-bold border inline-block ${
                                      p.schedule_stretch_multiplier >= 1.3
                                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                                        : p.schedule_stretch_multiplier >= 1.15
                                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    }`}
                                  >
                                    {p.schedule_stretch_multiplier}×
                                  </span>
                                </td>

                                {/* Action / Expand Button */}
                                <td className="py-3 px-4 text-center whitespace-nowrap">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setExpandedProjectId(isExpanded ? null : p.project_id);
                                    }}
                                    className="px-2 py-1 rounded-md border border-slate-200 hover:bg-slate-100 text-[11px] font-medium text-slate-600 hover:text-slate-900 transition flex items-center gap-1 mx-auto"
                                    title={isExpanded ? (isHi ? 'संक्षिप्त करें' : 'Collapse') : (isHi ? 'विवरण देखें' : 'View details')}
                                  >
                                    <span>{isExpanded ? (isHi ? 'बंद' : 'Hide') : (isHi ? 'विवरण' : 'View')}</span>
                                    {isExpanded ? (
                                      <ChevronUp className="w-3 h-3" />
                                    ) : (
                                      <ChevronDown className="w-3 h-3" />
                                    )}
                                  </button>
                                </td>
                              </tr>

                              {/* Expandable Project Details Accordion */}
                              {isExpanded && (
                                <tr className="bg-slate-50/70 border-y border-slate-200">
                                  <td colSpan={6} className="p-4 sm:p-5">
                                    <div className="space-y-3">
                                      {/* Full Project Title */}
                                      <div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">
                                          {isHi ? 'पूर्ण परियोजना शीर्षक' : 'Full Project Title'}
                                        </span>
                                        <h4 className="text-xs font-bold text-slate-900 mt-0.5 leading-relaxed">
                                          {p.project_name}
                                        </h4>
                                      </div>

                                      {/* Recommendation Callout */}
                                      <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs flex items-start gap-2.5">
                                        <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                                        <div className="space-y-0.5">
                                          <div className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                                            {isHi ? 'आईएमडी जलवायु समायोजन सिफ़ारिश' : 'IMD Empirical Climate Directive'}
                                          </div>
                                          <p className="text-xs text-slate-800 leading-relaxed font-medium">
                                            {p.climate_adjustment_recommendation}
                                          </p>
                                        </div>
                                      </div>

                                      {/* Dual Metrics Breakdown */}
                                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                                        <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                                          <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">{isHi ? 'संशोधित लागत' : 'Revised Cost'}</span>
                                          <div className="font-mono font-bold text-slate-900 mt-0.5">
                                            {p.revised_cost_cr ? `₹${Number(p.revised_cost_cr).toLocaleString('en-IN')} Cr` : '—'}
                                          </div>
                                        </div>
                                        <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                                          <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">{isHi ? 'विलंब अवधि' : 'Reported Delay'}</span>
                                          <div className="font-mono font-bold text-amber-700 mt-0.5">
                                            {p.delay_months != null ? `${p.delay_months} Months` : '0 Months'}
                                          </div>
                                        </div>
                                        <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                                          <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">{isHi ? 'मौसम संवेदनशीलता' : 'Weather Sensitivity'}</span>
                                          <div className="font-mono font-bold text-slate-900 mt-0.5">
                                            {p.sector_weather_sensitivity}× Sector Coeff
                                          </div>
                                        </div>
                                        <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                                          <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">{isHi ? 'मौसम जोखिम श्रेणी' : 'Risk Category'}</span>
                                          <div className="font-bold text-rose-700 truncate mt-0.5">
                                            {(p.weather_risk_tier || '').replace(/_/g, ' ')}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 10-per-page Pagination Controls */}
                {sortedProjects.length > PROJECT_PAGE_SIZE && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 px-2 border-t border-slate-200">
                    <div className="text-xs font-bold text-slate-500 font-mono">
                      {isHi
                        ? `कुल ${sortedProjects.length} परियोजनाओं में से ${((projectPage - 1) * PROJECT_PAGE_SIZE) + 1}–${Math.min(projectPage * PROJECT_PAGE_SIZE, sortedProjects.length)} (पृष्ठ ${projectPage}/${totalProjectPages})`
                        : `Showing ${((projectPage - 1) * PROJECT_PAGE_SIZE) + 1}–${Math.min(projectPage * PROJECT_PAGE_SIZE, sortedProjects.length)} of ${sortedProjects.length} Monitored Projects (Page ${projectPage} of ${totalProjectPages})`
                      }
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setProjectPage((p) => Math.max(1, p - 1))}
                        disabled={projectPage === 1}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" /> {isHi ? 'पिछला' : 'Previous'}
                      </button>

                      {Array.from({ length: totalProjectPages }, (_, i) => i + 1)
                        .filter((pg) => {
                          if (totalProjectPages <= 7) return true;
                          if (pg === 1 || pg === totalProjectPages) return true;
                          return Math.abs(pg - projectPage) <= 1;
                        })
                        .reduce((acc, pg, idx, arr) => {
                          if (idx > 0 && pg - arr[idx - 1] > 1) {
                            acc.push({ type: 'ellipsis', key: `ell-${pg}` });
                          }
                          acc.push({ type: 'page', page: pg, key: `p-${pg}` });
                          return acc;
                        }, [])
                        .map((item) => {
                          if (item.type === 'ellipsis') {
                            return (
                              <span key={item.key} className="w-6 text-center text-xs text-slate-400 font-mono">
                                …
                              </span>
                            );
                          }
                          const pg = item.page;
                          return (
                            <button
                              key={item.key}
                              onClick={() => setProjectPage(pg)}
                              className={`w-8 h-8 rounded-xl text-xs font-bold font-mono transition shadow-xs ${
                                projectPage === pg
                                  ? 'bg-gov-navy text-white shadow-sm ring-1 ring-gov-navy'
                                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              {pg}
                            </button>
                          );
                        })}

                      <button
                        onClick={() => setProjectPage((p) => Math.min(totalProjectPages, p + 1))}
                        disabled={projectPage === totalProjectPages}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition"
                      >
                        {isHi ? 'अगला' : 'Next'} <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Methodology */}
      <motion.section variants={itemVariants} className="panel p-5 sm:p-6">
        <h3 className="text-[17px] font-heading font-extrabold text-gov-navy mb-3">Methodology</h3>
        <p className="text-[14px] text-text-secondary leading-relaxed max-w-3xl font-sans">
          20-year empirical IMD state-level rainfall departure dataset (2005–2025, 630 state-years). 
          State-specific terrain coefficients calibrate construction sensitivity to precipitation. 
          Working-window compression and schedule stretch multipliers are computed using Weibull 
          survival regression models pegged to historical monsoon patterns.
        </p>
      </motion.section>
    </motion.div>
  );
}
