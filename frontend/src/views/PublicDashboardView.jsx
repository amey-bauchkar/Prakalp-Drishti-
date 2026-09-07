import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, FileText, Landmark, Search, Filter, ShieldCheck,
  Calendar, Building2, TrendingUp, AlertTriangle, CheckCircle2,
  Clock, ArrowRight, ExternalLink, HelpCircle, Layers, Info, Check,
  TreePine, AlertCircle, Sparkles, ChevronRight, BarChart3,
  Download, ChevronLeft, ChevronsLeft, ChevronsRight, RotateCcw,
  SlidersHorizontal, ArrowUpDown, ListFilter, Activity, Eye,
  IndianRupee, Globe2, ShieldAlert, Cpu, Terminal
} from 'lucide-react';
import { Circle, CircleMarker, MapContainer, Popup } from 'react-leaflet';
import BaseMapLayer, { BaseMapNotice } from '../components/BaseMapLayer';
import ClearanceStagesInfoGuide from '../components/ClearanceStagesInfoGuide';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.04 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 340, damping: 26 }
  }
};

// Status threshold logic with Minimalist Swiss monochrome + emerald/amber/coral accents
function getProjectStatus(p) {
  const delayed = Number(p.delayed_months) || 0;
  const progress = Number(p.progress_perc) || 0;
  if (delayed > 24 || (progress < 40 && delayed > 12)) {
    return {
      label: 'CRITICAL DELAY',
      color: '#e11d48', // rose-600
      borderClass: 'border-rose-200',
      bgClass: 'bg-rose-50 text-rose-800',
      dotClass: 'bg-rose-600',
      badgeClass: 'text-rose-700',
    };
  }
  if (delayed > 0 || progress < 70) {
    return {
      label: 'UNDER MONITORING',
      color: '#d97706', // amber-600
      borderClass: 'border-amber-200',
      bgClass: 'bg-amber-50 text-amber-900',
      dotClass: 'bg-amber-600',
      badgeClass: 'text-amber-700',
    };
  }
  return {
    label: 'ON TRACK',
    color: '#059669', // emerald-600
    borderClass: 'border-emerald-200',
    bgClass: 'bg-emerald-50 text-emerald-800',
    dotClass: 'bg-emerald-600',
    badgeClass: 'text-emerald-700',
  };
}

export default function PublicDashboardView() {
  const [activeTab, setActiveTab] = useState('metadata');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState(() => {
    return localStorage.getItem('prakalp:selectedProjectId') || '619092';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState('All');
  const [selectedState, setSelectedState] = useState('All');

  // Fetch project list
  useEffect(() => {
    setLoading(true);
    fetch('/api/projects?limit=2207')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setProjects(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Listen to global project select events
  useEffect(() => {
    const handleSelect = (e) => {
      if (e.detail) {
        setSelectedProjectId(String(e.detail));
      }
    };
    window.addEventListener('prakalp:selectProject', handleSelect);
    return () => window.removeEventListener('prakalp:selectProject', handleSelect);
  }, []);

  const selectProject = (pid) => {
    setSelectedProjectId(String(pid));
    localStorage.setItem('prakalp:selectedProjectId', String(pid));
    window.dispatchEvent(new CustomEvent('prakalp:selectProject', { detail: String(pid) }));
  };

  const activeProject = projects.find((p) => String(p.project_id) === String(selectedProjectId)) || projects[0];

  const sectors = ['All', ...Array.from(new Set(projects.map((p) => p.sector).filter(Boolean)))];
  const states = ['All', ...Array.from(new Set(projects.map((p) => p.state).filter(Boolean)))];

  const filteredProjects = projects.filter((p) => {
    const matchesSearch = !searchQuery || 
      p.project_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.project_id?.toString().includes(searchQuery) ||
      p.company?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSector = selectedSector === 'All' || p.sector === selectedSector;
    const matchesState = selectedState === 'All' || p.state === selectedState;
    return matchesSearch && matchesSector && matchesState;
  });

  const tabs = [
    {
      id: 'metadata',
      label: 'Geospatial GIS & Master Tracking',
      desc: 'Sovereign profiles, milestone progress & Pan-India GIS map',
      icon: MapPin,
      badge: `${projects.length || '2,207'} Projects`
    },
    {
      id: 'financial',
      label: 'Financial Transparency (RTI §4)',
      desc: 'Sanctioned vs Disbursed capex & WPI Clause 10CC adjustments',
      icon: FileText,
      badge: '₹47.4L Cr Portfolio'
    },
    {
      id: 'clearances',
      label: 'Statutory Clearances (ANUMATI)',
      desc: 'PARIVESH Forest Stage I/II, EIA, Wildlife & Land Acquisition',
      icon: Landmark,
      badge: 'PARIVESH Live'
    }
  ];

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6 font-sans pb-24 max-w-7xl mx-auto text-zinc-900"
    >
      {/* ── Swiss Minimalist Telemetry Strip ── */}
      <motion.div 
        variants={itemVariants} 
        className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 rounded-lg bg-zinc-950 text-[11px] font-mono text-zinc-300 shadow-2xs border border-zinc-800"
      >
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="flex items-center gap-1.5 text-zinc-100 font-bold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            NAGRIK TRANSPARENCY
          </span>
          <span className="text-zinc-700">/</span>
          <span className="text-zinc-400">RTI ACT §4 MANDATE</span>
          <span className="text-zinc-700">/</span>
          <span className="text-emerald-400 font-medium">2,207 SEALED PROJECTS · ₹47.44L CR</span>
        </div>
        <div className="flex items-center gap-2 bg-zinc-900 px-2.5 py-0.5 rounded border border-zinc-800 text-xs">
          <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">DOSSIER:</span>
          <span className="font-bold text-zinc-100 font-mono">#{selectedProjectId}</span>
        </div>
      </motion.div>

      {/* ── Minimalist Swiss Editorial Header ── */}
      <motion.div 
        variants={itemVariants} 
        className="relative overflow-hidden rounded-xl bg-white border border-zinc-200/90 shadow-2xs p-6 sm:p-8"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2.5 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-zinc-800 text-[11px] font-mono font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-zinc-900" />
              <span>CITIZEN CHARTER · OPEN DATA INITIATIVE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-extrabold text-zinc-950 tracking-[-0.03em] leading-tight">
              Public Infrastructure Transparency &amp; Oversight
            </h1>
            <p className="text-sm text-zinc-600 leading-relaxed max-w-2xl">
              Proactive public disclosure for Central Sector Mega-Projects under Section 4(1)(b) of the Right to Information Act, 2005. Inspect geocoded site locations, CCEA sanctioned vs revised capex baselines, physical milestones, and statutory environmental clearances in real time.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="p-4 rounded-lg bg-zinc-50 border border-zinc-200/80 text-right min-w-[170px]">
              <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold">Total Monitored Capex</div>
              <div className="text-2xl font-extrabold text-zinc-950 font-mono mt-0.5">₹47.44L Cr</div>
              <div className="text-[11px] text-emerald-700 flex items-center justify-end gap-1 mt-1 font-mono font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> 2,207 Projects Audited
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Swiss Minimalist Segmented Tab Rail ── */}
      <motion.nav 
        variants={itemVariants} 
        className="grid grid-cols-1 sm:grid-cols-3 gap-3" 
        role="tablist" 
        aria-label="Public transparency sections"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-3.5 p-4 rounded-xl border text-left transition-all duration-150 ${
                isActive
                  ? 'bg-zinc-950 text-white border-zinc-950 shadow-sm'
                  : 'bg-white border-zinc-200/80 hover:bg-zinc-50/80 hover:border-zinc-300'
              }`}
            >
              <div className={`p-2.5 rounded-lg shrink-0 ${
                isActive 
                  ? 'bg-zinc-800 text-white font-bold' 
                  : 'bg-zinc-100 text-zinc-800 border border-zinc-200/60'
              }`}>
                <Icon className="w-4 h-4" strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className={`text-sm font-bold tracking-tight truncate ${isActive ? 'text-white' : 'text-zinc-900'}`}>
                    {tab.label}
                  </span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                    isActive ? 'bg-zinc-800 text-zinc-300 border-zinc-700' : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                  }`}>
                    {tab.badge}
                  </span>
                </div>
                <p className={`text-xs truncate ${isActive ? 'text-zinc-400' : 'text-zinc-500'}`}>{tab.desc}</p>
              </div>
            </button>
          );
        })}
      </motion.nav>

      {/* ── Tab Views with Animated Transitions ── */}
      <AnimatePresence mode="wait">
        {activeTab === 'metadata' && (
          <motion.div
            key="metadata"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: "easeInOut" }}
          >
            <PublicMetadataTab
              projects={filteredProjects}
              allProjects={projects}
              activeProject={activeProject}
              selectProject={selectProject}
              setActiveTab={setActiveTab}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedSector={selectedSector}
              setSelectedSector={setSelectedSector}
              selectedState={selectedState}
              setSelectedState={setSelectedState}
              sectors={sectors}
              states={states}
              loading={loading}
            />
          </motion.div>
        )}

        {activeTab === 'financial' && (
          <motion.div
            key="financial"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: "easeInOut" }}
          >
            <PublicFinancialTab
              projects={filteredProjects}
              activeProject={activeProject}
              selectProject={selectProject}
            />
          </motion.div>
        )}

        {activeTab === 'clearances' && (
          <motion.div
            key="clearances"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: "easeInOut" }}
          >
            <PublicClearancesTab />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ═════════════════════════════════════════════════════════════════════════════
   TAB 1: PUBLIC METADATA & TRACKING (MAP + DIRECTORY + ALL 2,207 MASTER TABLE)
   ═════════════════════════════════════════════════════════════════════════════ */
function PublicMetadataTab({
  projects,
  allProjects = [],
  activeProject,
  selectProject,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  selectedSector,
  setSelectedSector,
  selectedState,
  setSelectedState,
  sectors,
  states,
  loading
}) {
  const [basemapStatus, setBasemapStatus] = useState('ok');
  const [dirLimit, setDirLimit] = useState(100);

  // Master Table State
  const [tableSearch, setTableSearch] = useState('');
  const [tableStatus, setTableStatus] = useState('All');
  const [tableSector, setTableSector] = useState('All');
  const [tableState, setTableState] = useState('All');
  const [sortBy, setSortBy] = useState('cost_desc');
  const [pageSize, setPageSize] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);

  // Reset directory scroll limit when search / filter changes
  useEffect(() => {
    setDirLimit(100);
  }, [searchQuery, selectedSector, selectedState]);

  // Reset table pagination when table filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [tableSearch, tableStatus, tableSector, tableState, sortBy, pageSize]);

  const mapCenter = activeProject?.latitude && activeProject?.longitude
    ? [activeProject.latitude, activeProject.longitude]
    : [22.5937, 78.9629];

  const status = activeProject ? getProjectStatus(activeProject) : null;
  const progressPct = Math.min(100, Math.max(0, Number(activeProject?.progress_perc || 0)));

  // Filter projects that have georeferenced coordinates for Map.
  // NATIONAL_CENTROID_MATCH projects are placed at India's geographic center
  // (~22.5°N, 78.5°E) because they have no real location data. Drawing them
  // as pins creates a misleading cluster in Madhya Pradesh, so they are
  // excluded from the map and counted separately.
  const mappedProjects = useMemo(() => {
    return projects.filter((p) => {
      const lat = Number(p.latitude);
      const lon = Number(p.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lon) || (lat === 0 && lon === 0)) return false;
      if (p.geocode_precision === 'NATIONAL_CENTROID_MATCH') return false;
      return true;
    });
  }, [projects]);

  const unmappedCount = useMemo(() => {
    return projects.filter((p) => {
      const lat = Number(p.latitude);
      const lon = Number(p.longitude);
      const hasCoord = Number.isFinite(lat) && Number.isFinite(lon) && (lat !== 0 || lon !== 0);
      return !hasCoord || p.geocode_precision === 'NATIONAL_CENTROID_MATCH';
    }).length;
  }, [projects]);

  // Handle directory scroll to load more
  const handleDirScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollHeight - scrollTop <= clientHeight + 150 && dirLimit < projects.length) {
      setDirLimit((prev) => Math.min(prev + 100, projects.length));
    }
  };

  const corpus = allProjects.length > 0 ? allProjects : projects;
  
  // High-level Corpus Statistics
  const portfolioStats = useMemo(() => {
    let onTrack = 0;
    let monitored = 0;
    let critical = 0;
    let totalCapex = 0;

    corpus.forEach((p) => {
      const st = getProjectStatus(p);
      if (st.label === 'ON TRACK') onTrack += 1;
      else if (st.label === 'UNDER MONITORING') monitored += 1;
      else critical += 1;
      totalCapex += Number(p.revised_cost_cr || p.original_cost_cr || 0);
    });

    return {
      total: corpus.length,
      onTrack,
      monitored,
      critical,
      totalCapex,
    };
  }, [corpus]);

  const tableFiltered = useMemo(() => {
    let list = corpus;

    // Search query
    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase();
      list = list.filter((p) => {
        return (
          p.project_name?.toLowerCase().includes(q) ||
          String(p.project_id).includes(q) ||
          p.company?.toLowerCase().includes(q) ||
          p.sector?.toLowerCase().includes(q) ||
          p.state?.toLowerCase().includes(q)
        );
      });
    }

    // Status filter
    if (tableStatus !== 'All') {
      list = list.filter((p) => getProjectStatus(p).label === tableStatus);
    }

    // Sector filter
    if (tableSector !== 'All') {
      list = list.filter((p) => p.sector === tableSector);
    }

    // State filter
    if (tableState !== 'All') {
      list = list.filter((p) => p.state === tableState);
    }

    // Sorting
    return [...list].sort((a, b) => {
      const costA = Number(a.revised_cost_cr || a.original_cost_cr || 0);
      const costB = Number(b.revised_cost_cr || b.original_cost_cr || 0);
      const delayA = Number(a.delayed_months || 0);
      const delayB = Number(b.delayed_months || 0);
      const progA = Number(a.progress_perc || 0);
      const progB = Number(b.progress_perc || 0);

      if (sortBy === 'cost_desc') return costB - costA;
      if (sortBy === 'cost_asc') return costA - costB;
      if (sortBy === 'delay_desc') return delayB - delayA;
      if (sortBy === 'delay_asc') return delayA - delayB;
      if (sortBy === 'progress_desc') return progB - progA;
      if (sortBy === 'progress_asc') return progA - progB;
      if (sortBy === 'id_asc') return Number(a.project_id) - Number(b.project_id);
      if (sortBy === 'name_asc') return (a.project_name || '').localeCompare(b.project_name || '');
      return 0;
    });
  }, [corpus, tableSearch, tableStatus, tableSector, tableState, sortBy]);

  // Master Table Pagination
  const effectivePageSize = pageSize === 'All' ? Math.max(tableFiltered.length, 1) : Number(pageSize);
  const totalPages = Math.ceil(tableFiltered.length / effectivePageSize) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pagedProjects = useMemo(() => {
    if (pageSize === 'All') return tableFiltered;
    const start = (safeCurrentPage - 1) * effectivePageSize;
    return tableFiltered.slice(start, start + effectivePageSize);
  }, [tableFiltered, safeCurrentPage, effectivePageSize, pageSize]);

  // Export current table dataset as CSV
  const handleExportCSV = () => {
    const headers = [
      'Project ID',
      'Project Name',
      'Sector',
      'State',
      'Executing Agency (PSU)',
      'Original Cost (Cr)',
      'Revised Cost (Cr)',
      'Cost Overrun (Cr)',
      'Cost Overrun (%)',
      'Physical Progress (%)',
      'Schedule Delay (Months)',
      'Original Sanction Date',
      'Target Date',
      'Status',
      'Geocode Precision',
      'Latitude',
      'Longitude'
    ];

    const csvRows = tableFiltered.map((p) => {
      const orig = Number(p.original_cost_cr || 0);
      const rev = Number(p.revised_cost_cr || orig);
      const diff = rev - orig;
      const diffPct = orig > 0 ? ((diff / orig) * 100).toFixed(1) : '0.0';
      const st = getProjectStatus(p);
      return [
        p.project_id,
        `"${(p.project_name || '').replace(/"/g, '""')}"`,
        `"${(p.sector || '').replace(/"/g, '""')}"`,
        `"${(p.state || '').replace(/"/g, '""')}"`,
        `"${(p.company || '').replace(/"/g, '""')}"`,
        orig,
        rev,
        diff.toFixed(2),
        diffPct,
        p.progress_perc || 0,
        p.delayed_months || 0,
        p.sanction_date || '',
        p.target_date || '',
        st.label,
        p.geocode_precision || '',
        p.latitude || '',
        p.longitude || ''
      ].join(',');
    });

    const csvString = '\uFEFF' + [headers.join(','), ...csvRows].join('\r\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `prakalp_drishti_public_projects_ledger_${tableFiltered.length}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSelectAndFocus = (pid) => {
    selectProject(pid);
    window.scrollTo({ top: 180, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6">
      {/* ── Active Project Spotlight HUD Card (Swiss Editorial White) ── */}
      {activeProject && (
        <div className="rounded-xl bg-white border border-zinc-200/90 p-6 shadow-2xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-100 pb-5">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded bg-zinc-950 text-white font-bold font-mono text-[11px]">
                  #{activeProject.project_id}
                </span>
                <span className="px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-zinc-800 font-mono text-[11px] font-semibold">
                  {activeProject.sector || 'Central Sector'}
                </span>
                <span className={`px-2 py-0.5 rounded border text-[11px] font-mono font-bold ${status.bgClass} ${status.borderClass}`}>
                  {status.label}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-950 tracking-[-0.02em]">
                {activeProject.project_name}
              </h2>
            </div>
            <div className="flex items-center gap-4 shrink-0 bg-zinc-50 p-3.5 rounded-lg border border-zinc-200/80">
              <div className="text-right">
                <div className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 font-bold">Physical Progress</div>
                <div className="text-2xl font-extrabold text-zinc-950 font-mono">{progressPct.toFixed(1)}%</div>
              </div>
              <div className="w-12 h-12 rounded-lg border border-zinc-300 flex items-center justify-center p-1 bg-white">
                <Activity className="w-5 h-5 text-zinc-900" />
              </div>
            </div>
          </div>

          {/* 4 Metric Cells in Spotlight HUD */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 pt-5">
            <div className="p-3.5 rounded-lg bg-zinc-50/80 border border-zinc-200/70">
              <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 font-bold block">Executing Agency</span>
              <span className="text-sm font-bold text-zinc-900 truncate block mt-0.5">{activeProject.company || '—'}</span>
              <span className="text-xs text-zinc-600 flex items-center gap-1 mt-1 font-medium">
                <MapPin className="w-3 h-3 text-zinc-400" /> {activeProject.state || 'Pan-India'}
              </span>
            </div>

            <div className="p-3.5 rounded-lg bg-zinc-50/80 border border-zinc-200/70">
              <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 font-bold block">Original Sanction Date</span>
              <span className="text-sm font-bold text-zinc-900 font-mono block mt-0.5">{activeProject.sanction_date?.slice(0, 10) || '—'}</span>
              <span className="text-xs text-zinc-500 mt-1 block">CCEA Approval Baseline</span>
            </div>

            <div className="p-3.5 rounded-lg bg-zinc-50/80 border border-zinc-200/70">
              <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 font-bold block">Target Completion</span>
              <span className="text-sm font-bold text-zinc-900 font-mono block mt-0.5">{activeProject.target_date?.slice(0, 10) || '—'}</span>
              <span className="text-xs text-zinc-500 mt-1 block">Revised MoSPI Target</span>
            </div>

            <div className="p-3.5 rounded-lg bg-zinc-50/80 border border-zinc-200/70">
              <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 font-bold block">Schedule Deviation</span>
              <span className={`text-sm font-bold font-mono block mt-0.5 ${Number(activeProject.delayed_months) > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                {Number(activeProject.delayed_months) > 0 ? `+${activeProject.delayed_months} Months Delay` : 'Nil Delay (On Track)'}
              </span>
              <span className="text-xs text-zinc-500 mt-1 block">Against Approved Plan</span>
            </div>
          </div>

          {/* Progress Bar Line */}
          <div className="mt-5 pt-4 border-t border-zinc-100 flex items-center gap-3">
            <span className="text-[10.5px] font-bold text-zinc-500 uppercase tracking-wider shrink-0 font-mono">Milestone Track</span>
            <div className="flex-1 bg-zinc-100 h-2 rounded-full overflow-hidden relative border border-zinc-200">
              <div
                className="bg-zinc-950 h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="font-mono text-xs font-bold text-zinc-950 shrink-0">{progressPct.toFixed(1)}% Realized</span>
          </div>
        </div>
      )}

      {/* ── Interactive Pan-India Map + Directory Filter Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Geographic Leaflet Map */}
        <div className="lg:col-span-7 rounded-xl bg-white border border-zinc-200/90 flex flex-col h-[600px] overflow-hidden shadow-2xs">
          <div className="flex items-center justify-between p-4 border-b border-zinc-200 bg-zinc-50/80">
            <span className="flex items-center gap-2 text-sm font-bold text-zinc-900 font-mono uppercase tracking-wide text-xs">
              <MapPin className="w-3.5 h-3.5 text-zinc-700" />
              Pan-India GIS Sites ({mappedProjects.length.toLocaleString('en-IN')} Georeferenced)
            </span>
            <div className="flex items-center gap-2.5 text-[10.5px] font-mono flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold"><span className="w-2 h-2 rounded-full bg-emerald-600" /> On Track</span>
              <span className="inline-flex items-center gap-1.5 text-amber-700 font-semibold"><span className="w-2 h-2 rounded-full bg-amber-600" /> Monitored</span>
              <span className="inline-flex items-center gap-1.5 text-rose-700 font-semibold"><span className="w-2 h-2 rounded-full bg-rose-600" /> Delayed</span>
              {unmappedCount > 0 && (
                <span className="inline-flex items-center gap-1 text-zinc-500 border-l border-zinc-300 pl-2.5 ml-0.5 font-sans text-[11px]">
                  <HelpCircle className="w-3 h-3 text-zinc-400" />
                  {unmappedCount} non-georeferenced
                </span>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-hidden relative z-0">
            <MapContainer
              center={mapCenter}
              zoom={5}
              preferCanvas={true}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={false}
            >
              <BaseMapLayer onStatus={setBasemapStatus} />
              {mappedProjects.map((p) => {
                const lat = Number(p.latitude);
                const lon = Number(p.longitude);
                if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
                const pStat = getProjectStatus(p);
                const isSelected = String(p.project_id) === String(activeProject?.project_id);
                const approx = p.location_is_approximate === true;
                const radiusM = Number(p.geocode_error_radius_m);
                const showUncertainty = isSelected && p.geocode_serves_imagery === false
                  && Number.isFinite(radiusM) && radiusM > 0;

                return (
                  <React.Fragment key={`geo-${p.project_id}`}>
                    {showUncertainty && (
                      <Circle
                        center={[lat, lon]}
                        radius={radiusM}
                        pathOptions={{
                          color: pStat.color,
                          fillColor: pStat.color,
                          fillOpacity: 0.08,
                          weight: 1.5,
                          dashArray: '4 6',
                        }}
                        interactive={false}
                      />
                    )}
                    <CircleMarker
                      key={p.project_id}
                      center={[lat, lon]}
                      radius={isSelected ? 9 : 4.5}
                      pathOptions={{
                        fillColor: pStat.color,
                        fillOpacity: approx ? 0.3 : (isSelected ? 0.95 : 0.75),
                        color: approx ? pStat.color : (isSelected ? '#09090b' : '#ffffff'),
                        weight: isSelected ? 2.5 : 1,
                        dashArray: approx ? '2 3' : undefined,
                      }}
                      eventHandlers={{
                        click: () => selectProject(p.project_id),
                      }}
                    >
                      <Popup>
                        <div className="p-1 font-sans text-xs space-y-1.5 min-w-[200px]">
                          <div className="font-bold text-zinc-950 leading-tight">{p.project_name}</div>
                          <div className="text-zinc-600 font-mono text-[10px]">ID #{p.project_id} · {p.sector}</div>
                          <div className="text-zinc-900 font-bold font-mono">Cost: ₹{Number(p.revised_cost_cr || 0).toLocaleString('en-IN')} Cr</div>
                          <div className="text-zinc-700 font-semibold">Progress: {p.progress_perc}% ({pStat.label})</div>
                          {approx && (
                            <div className="text-amber-950 bg-amber-50 border border-amber-300 rounded p-1 text-[10px] leading-snug">
                              <strong>Approximate Centroid.</strong> Plotted at {String(p.geocode_precision || '').toLowerCase().includes('state') ? 'state' : 'national'} centroid.
                            </div>
                          )}
                          <div className="pt-1">
                            <button
                              onClick={() => handleSelectAndFocus(p.project_id)}
                              className="w-full text-center py-1.5 bg-zinc-900 hover:bg-black text-white rounded font-bold text-[11px] transition-colors"
                            >
                              Inspect Dossier
                            </button>
                          </div>
                        </div>
                      </Popup>
                    </CircleMarker>
                  </React.Fragment>
                );
              })}
            </MapContainer>
            <BaseMapNotice status={basemapStatus} />
          </div>

          <div className="p-3 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between text-xs text-zinc-500 font-mono">
            <span>Click any marker to inspect dossier</span>
            <span className="text-zinc-800 font-semibold">GeoNames 5-Tier Geocoding Engine</span>
          </div>
        </div>

        {/* Right Column: Search & Filtered Project Directory */}
        <div className="lg:col-span-5 rounded-xl bg-white border border-zinc-200/90 flex flex-col h-[600px] overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-zinc-200 bg-zinc-50/80 space-y-3 shrink-0">
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by project name, PSU, state or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-zinc-300 rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-xs text-zinc-400 hover:text-zinc-700"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="w-full text-xs bg-white border border-zinc-300 rounded-lg p-2 text-zinc-800 focus:outline-none focus:border-zinc-900 cursor-pointer font-sans"
                aria-label="Filter by sector"
              >
                {sectors.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full text-xs bg-white border border-zinc-300 rounded-lg p-2 text-zinc-800 focus:outline-none focus:border-zinc-900 cursor-pointer font-sans"
                aria-label="Filter by state"
              >
                {states.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {(selectedSector !== 'All' || selectedState !== 'All' || searchQuery) && (
              <div className="flex items-center justify-between text-xs text-zinc-500 font-mono">
                <span>{projects.length} of {allProjects.length || 2207} match</span>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedSector('All');
                    setSelectedState('All');
                  }}
                  className="text-zinc-900 hover:underline flex items-center gap-1 font-semibold"
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              </div>
            )}
          </div>

          {/* Scrollable list with progressive expansion */}
          <div
            onScroll={handleDirScroll}
            className="flex-1 overflow-y-auto divide-y divide-zinc-100 scrollbar-thin"
          >
            {projects.length === 0 ? (
              <div className="p-8 text-center text-zinc-400 text-xs">
                No projects found matching the current search criteria.
              </div>
            ) : (
              <>
                {projects.slice(0, dirLimit).map((p) => {
                  const isSelected = String(p.project_id) === String(activeProject?.project_id);
                  const pStat = getProjectStatus(p);
                  return (
                    <div
                      key={p.project_id}
                      onClick={() => selectProject(p.project_id)}
                      className={`p-3.5 cursor-pointer transition-all ${
                        isSelected 
                          ? 'bg-zinc-100/90 border-l-4 border-zinc-950 font-medium' 
                          : 'hover:bg-zinc-50/80'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-[10.5px] font-bold text-zinc-900">#{p.project_id}</span>
                            <span className="text-[10px] font-semibold text-zinc-500 truncate">{p.sector}</span>
                          </div>
                          <h4 className="text-xs font-bold text-zinc-900 truncate">{p.project_name}</h4>
                          <p className="text-[11px] text-zinc-500 truncate mt-0.5">{p.company} · {p.state}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${pStat.bgClass} ${pStat.borderClass}`}>
                            {p.progress_perc}%
                          </span>
                          <div className="font-mono font-bold text-xs text-zinc-900 mt-1.5">
                            ₹{Number(p.revised_cost_cr || 0).toLocaleString('en-IN')} Cr
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {dirLimit < projects.length && (
                  <div className="p-4 bg-zinc-50 text-center space-y-2 border-t border-zinc-200">
                    <p className="text-xs text-zinc-500 font-mono">
                      Showing {dirLimit} of {projects.length.toLocaleString('en-IN')} projects
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => setDirLimit((prev) => Math.min(prev + 100, projects.length))}
                        className="px-3 py-1.5 text-xs bg-white border border-zinc-300 rounded-lg text-zinc-700 font-semibold hover:bg-zinc-100 transition-colors shadow-2xs"
                      >
                        Load +100 More
                      </button>
                      <button
                        onClick={() => setDirLimit(projects.length)}
                        className="px-3 py-1.5 text-xs bg-zinc-900 text-white rounded-lg font-bold hover:bg-black transition-colors shadow-2xs"
                      >
                        Show All ({projects.length.toLocaleString('en-IN')})
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="p-3 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between text-xs text-zinc-500 font-mono">
            <span>Showing {Math.min(dirLimit, projects.length).toLocaleString('en-IN')} of {projects.length.toLocaleString('en-IN')}</span>
            <span className="text-zinc-700 font-semibold">MoSPI Central Sector</span>
          </div>
        </div>
      </div>

      {/* ── MASTER PUBLIC TRACKING REGISTER & TABLE (ALL 2,207 PROJECTS) ── */}
      <div className="rounded-xl bg-white border border-zinc-200/90 overflow-hidden shadow-2xs">
        <div className="p-5 border-b border-zinc-200 bg-zinc-50/80 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <Layers className="w-5 h-5 text-zinc-900" />
              <h3 className="text-lg font-extrabold text-zinc-950 tracking-[-0.02em]">
                Central Sector Mega-Projects Master Public Tracking Register
              </h3>
              <span className="px-2.5 py-0.5 rounded bg-zinc-100 text-zinc-900 border border-zinc-300 font-mono font-bold text-xs">
                {corpus.length.toLocaleString('en-IN')} PROJECTS
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              RTI Section 4(1)(b) proactive disclosure covering all {portfolioStats.total.toLocaleString('en-IN')} central projects (₹{(portfolioStats.totalCapex / 100000).toFixed(2)} Lakh Cr capex portfolio)
            </p>
          </div>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 hover:bg-black text-white font-bold text-xs shadow-2xs transition-colors"
            title="Download filtered projects as CSV"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV Ledger ({tableFiltered.length.toLocaleString('en-IN')})</span>
          </button>
        </div>

        {/* 4 Summary Stat KPI Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-zinc-200 border-b border-zinc-200">
          <div className="p-4 bg-white">
            <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 font-bold block">Total Corpus Projects</span>
            <span className="text-xl font-extrabold text-zinc-950 font-mono block mt-0.5">
              {portfolioStats.total.toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-zinc-600 mt-1 block font-mono font-medium">₹{(portfolioStats.totalCapex / 100000).toFixed(1)} Lakh Cr Capex</span>
          </div>

          <div className="p-4 bg-white">
            <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 font-bold block">On Track Baseline</span>
            <span className="text-xl font-extrabold text-emerald-700 font-mono block mt-0.5">
              {portfolioStats.onTrack.toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-emerald-600 mt-1 block font-mono">{((portfolioStats.onTrack / portfolioStats.total) * 100).toFixed(1)}% within milestones</span>
          </div>

          <div className="p-4 bg-white">
            <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 font-bold block">Under Monitoring</span>
            <span className="text-xl font-extrabold text-amber-700 font-mono block mt-0.5">
              {portfolioStats.monitored.toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-amber-600 mt-1 block font-mono">{((portfolioStats.monitored / portfolioStats.total) * 100).toFixed(1)}% schedule alerts</span>
          </div>

          <div className="p-4 bg-white">
            <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 font-bold block">Critical Delay</span>
            <span className="text-xl font-extrabold text-rose-700 font-mono block mt-0.5">
              {portfolioStats.critical.toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-rose-600 mt-1 block font-mono">{((portfolioStats.critical / portfolioStats.total) * 100).toFixed(1)}% &gt;24 mo delay</span>
          </div>
        </div>

        {/* Master Table Filter Controls Toolbar */}
        <div className="p-4 bg-zinc-50/80 border-b border-zinc-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'All', label: `All (${corpus.length})` },
              { id: 'ON TRACK', label: `On Track (${portfolioStats.onTrack})` },
              { id: 'UNDER MONITORING', label: `Monitored (${portfolioStats.monitored})` },
              { id: 'CRITICAL DELAY', label: `Critical Delay (${portfolioStats.critical})` }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setTableStatus(tab.id)}
                className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-colors ${
                  tableStatus === tab.id
                    ? 'bg-zinc-950 text-white font-bold shadow-2xs'
                    : 'bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search, Sort and Page Size */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative min-w-[200px] sm:min-w-[240px]">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search all 2,207 projects..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-zinc-300 rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900"
              />
              {tableSearch && (
                <button
                  onClick={() => setTableSearch('')}
                  className="absolute right-2.5 top-2.5 text-xs text-zinc-400 hover:text-zinc-700"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-xs text-zinc-600 font-mono">
              <span>Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-xs bg-white border border-zinc-300 rounded-lg py-2 px-2.5 text-zinc-800 focus:outline-none cursor-pointer"
              >
                <option value="cost_desc">Cost: Highest First</option>
                <option value="cost_asc">Cost: Lowest First</option>
                <option value="delay_desc">Delay: Most Delayed</option>
                <option value="delay_asc">Delay: Least Delayed</option>
                <option value="progress_desc">Progress: Highest First</option>
                <option value="progress_asc">Progress: Lowest First</option>
                <option value="id_asc">Project ID</option>
                <option value="name_asc">Project Name (A-Z)</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-zinc-600 font-mono">
              <span>Rows:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(e.target.value === 'All' ? 'All' : Number(e.target.value))}
                className="text-xs bg-white border border-zinc-300 rounded-lg py-2 px-2.5 text-zinc-800 focus:outline-none cursor-pointer"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={250}>250</option>
                <option value="All">All 2,207</option>
              </select>
            </div>
          </div>
        </div>

        {/* The Master Public Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-100/90 text-[11px] font-mono uppercase tracking-wider text-zinc-600 font-bold">
                <th className="p-3.5 pl-4 w-20">ID</th>
                <th className="p-3.5 min-w-[260px]">Project Name & Sector</th>
                <th className="p-3.5 min-w-[180px]">Agency & State</th>
                <th className="p-3.5 min-w-[150px] text-right">Sanction / Revised Cost</th>
                <th className="p-3.5 min-w-[140px]">Physical Progress</th>
                <th className="p-3.5 min-w-[130px]">Schedule Delay</th>
                <th className="p-3.5 min-w-[130px]">Status</th>
                <th className="p-3.5 pr-4 text-right min-w-[110px]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {pagedProjects.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-400 text-xs">
                    No central sector mega-projects match the current filter and search query.
                  </td>
                </tr>
              ) : (
                pagedProjects.map((p) => {
                  const pStat = getProjectStatus(p);
                  const origCost = Number(p.original_cost_cr || 0);
                  const revCost = Number(p.revised_cost_cr || origCost);
                  const costDiff = revCost - origCost;
                  const costDiffPct = origCost > 0 ? (costDiff / origCost) * 100 : 0;
                  const prog = Math.min(100, Math.max(0, Number(p.progress_perc || 0)));
                  const delayed = Number(p.delayed_months || 0);
                  const isSelected = String(p.project_id) === String(activeProject?.project_id);

                  return (
                    <tr
                      key={p.project_id}
                      className={`transition-colors ${
                        isSelected 
                          ? 'bg-zinc-100/80 font-medium' 
                          : 'hover:bg-zinc-50'
                      }`}
                    >
                      {/* Column 1: ID */}
                      <td className="p-3.5 pl-4">
                        <span className="font-mono font-bold text-zinc-950 text-xs">
                          #{p.project_id}
                        </span>
                      </td>

                      {/* Column 2: Name & Sector */}
                      <td className="p-3.5">
                        <div className="font-bold text-zinc-950 text-xs leading-snug">
                          {p.project_name}
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 text-[10px] font-semibold border border-zinc-200">
                            {p.sector}
                          </span>
                          {p.location_is_approximate && (
                            <span className="text-[10px] text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-medium">
                              Centroid Approx
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Column 3: Executing Agency & State */}
                      <td className="p-3.5">
                        <div className="text-xs font-semibold text-zinc-800 truncate max-w-[200px]" title={p.company}>
                          {p.company || '—'}
                        </div>
                        <div className="text-[11px] text-zinc-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-zinc-400" />
                          <span>{p.state || 'Pan-India'}</span>
                        </div>
                      </td>

                      {/* Column 4: Cost */}
                      <td className="p-3.5 text-right font-mono">
                        <div className="font-bold text-xs text-zinc-950">
                          ₹{revCost.toLocaleString('en-IN')} Cr
                        </div>
                        <div className="text-[10px] text-zinc-500">
                          Orig: ₹{origCost.toLocaleString('en-IN')} Cr
                          {costDiff > 0 && (
                            <span className="text-amber-800 ml-1 font-semibold">
                              (+{costDiffPct.toFixed(0)}%)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Column 5: Physical Progress */}
                      <td className="p-3.5">
                        <div className="flex items-center justify-between text-xs font-mono font-bold text-zinc-700 mb-1">
                          <span>{prog.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden border border-zinc-200">
                          <div
                            className="bg-zinc-950 h-full rounded-full transition-all duration-300"
                            style={{ width: `${prog}%` }}
                          />
                        </div>
                      </td>

                      {/* Column 6: Delay */}
                      <td className="p-3.5">
                        <div className={`font-mono font-bold text-xs ${delayed > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                          {delayed > 0 ? `+${delayed} Mos` : 'Nil Delay'}
                        </div>
                        <div className="text-[10px] text-zinc-500 font-mono truncate">
                          Target: {p.target_date?.slice(0, 10) || '—'}
                        </div>
                      </td>

                      {/* Column 7: Status */}
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${pStat.bgClass} ${pStat.borderClass}`}>
                          {pStat.label}
                        </span>
                      </td>

                      {/* Column 8: Action */}
                      <td className="p-3.5 pr-4 text-right">
                        <button
                          onClick={() => handleSelectAndFocus(p.project_id)}
                          className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-950 hover:text-white text-zinc-800 rounded-lg text-xs font-bold transition-colors border border-zinc-200 shadow-2xs"
                          title="Focus in active dossier and map"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Master Table Pagination Footer */}
        <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="text-zinc-600 font-mono">
            Showing{' '}
            <strong className="text-zinc-950">
              {tableFiltered.length === 0 ? 0 : (safeCurrentPage - 1) * effectivePageSize + 1}
            </strong>{' '}
            to{' '}
            <strong className="text-zinc-950">
              {Math.min(safeCurrentPage * effectivePageSize, tableFiltered.length)}
            </strong>{' '}
            of{' '}
            <strong className="text-zinc-950">
              {tableFiltered.length.toLocaleString('en-IN')}
            </strong>{' '}
            Filtered Projects ({corpus.length.toLocaleString('en-IN')} Total Corpus)
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1.5 font-mono">
              <button
                disabled={safeCurrentPage <= 1}
                onClick={() => setCurrentPage(1)}
                className="p-2 rounded-lg border border-zinc-200 bg-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-100 text-zinc-700 shadow-2xs"
                title="First Page"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                disabled={safeCurrentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-2 rounded-lg border border-zinc-200 bg-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-100 text-zinc-700 shadow-2xs"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-4 py-2 font-bold text-xs text-zinc-950 bg-white border border-zinc-200 rounded-lg shadow-2xs">
                Page {safeCurrentPage} of {totalPages}
              </span>

              <button
                disabled={safeCurrentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-2 rounded-lg border border-zinc-200 bg-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-100 text-zinc-700 shadow-2xs"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                disabled={safeCurrentPage >= totalPages}
                onClick={() => setCurrentPage(totalPages)}
                className="p-2 rounded-lg border border-zinc-200 bg-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-100 text-zinc-700 shadow-2xs"
                title="Last Page"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════════════════
   TAB 2: FINANCIAL TRANSPARENCY (RTI SECTION 4(1)(b))
   ═════════════════════════════════════════════════════════════════════════════ */
function PublicFinancialTab({ projects, activeProject, selectProject }) {
  if (!activeProject) return null;

  const origCost = Number(activeProject.original_cost_cr || 0);
  const revCost = Number(activeProject.revised_cost_cr || origCost);
  const costVariance = revCost - origCost;
  const costVariancePct = origCost > 0 ? (costVariance / origCost) * 100 : 0;
  const progressPerc = Number(activeProject.progress_perc || 25);
  const estDisbursed = revCost * (progressPerc / 100);

  // WPI Price Escalation estimation based on CPWD Clause 10CC norms
  const wpiInflationAllowance = origCost * 0.085;

  const maxVal = Math.max(origCost, revCost, 1);
  const origBarWidth = Math.min(100, Math.max(10, (origCost / maxVal) * 100));
  const revBarWidth = Math.min(100, Math.max(10, (revCost / maxVal) * 100));
  const disbursedBarWidth = Math.min(100, Math.max(5, (estDisbursed / maxVal) * 100));

  return (
    <div className="space-y-6">
      {/* RTI Compliance Banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-900 text-xs shadow-2xs">
        <Info className="w-4 h-4 shrink-0 mt-0.5 text-zinc-700" />
        <div>
          <strong className="text-zinc-950 font-bold">Right to Information Act, 2005 · Section 4(1)(b)(xi) Mandate.</strong> Proactive disclosure of sanctioned budgetary outlays, cumulative spending against physical progress milestones, and statutory CPWD price adjustments.
        </div>
      </div>

      {/* Top 4 Financial Metric Cells */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-2xs">
          <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 font-bold block">Sanctioned Baseline</span>
          <span className="text-2xl font-extrabold text-zinc-950 font-mono block mt-1">₹{origCost.toLocaleString('en-IN')} <span className="text-xs font-normal text-zinc-500">Cr</span></span>
          <span className="text-xs text-zinc-500 mt-1 block">CCEA Approved Baseline</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-2xs">
          <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 font-bold block">Revised Sanctioned Cost</span>
          <span className="text-2xl font-extrabold text-zinc-950 font-mono block mt-1">₹{revCost.toLocaleString('en-IN')} <span className="text-xs font-normal text-zinc-500">Cr</span></span>
          <span className={`text-xs mt-1 block font-mono font-semibold ${costVariance > 0 ? 'text-amber-800' : 'text-emerald-700'}`}>
            {costVariance > 0 ? `+₹${costVariance.toLocaleString('en-IN')} Cr (+${costVariancePct.toFixed(1)}%)` : 'Within Initial Outlay'}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-2xs">
          <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 font-bold block">Cumulative Disbursal (Est.)</span>
          <span className="text-2xl font-extrabold text-emerald-700 font-mono block mt-1">₹{estDisbursed.toLocaleString('en-IN', { maximumFractionDigits: 1 })} <span className="text-xs font-normal text-zinc-500">Cr</span></span>
          <span className="text-xs text-zinc-500 mt-1 block">Tied to {progressPerc}% physical milestone</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-2xs">
          <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 font-bold block">CPWD WPI Escalation</span>
          <span className="text-2xl font-extrabold text-zinc-900 font-mono block mt-1">₹{wpiInflationAllowance.toLocaleString('en-IN', { maximumFractionDigits: 1 })} <span className="text-xs font-normal text-zinc-500">Cr</span></span>
          <span className="text-xs text-zinc-500 mt-1 block">Statutory Clause 10CC buffer</span>
        </div>
      </div>

      {/* Visual Budget Comparison: Progress Bars */}
      <div className="p-6 rounded-xl bg-white border border-zinc-200 shadow-2xs space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-zinc-900" />
            <h3 className="text-base font-extrabold text-zinc-950">
              Visual Capex Comparison · {activeProject.project_name}
            </h3>
          </div>
          <span className="px-2.5 py-1 rounded bg-zinc-100 border border-zinc-200 text-zinc-900 font-mono font-bold text-xs">
            #{activeProject.project_id}
          </span>
        </div>

        <div className="space-y-5">
          {/* Bar 1: Sanctioned Initial */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-semibold text-zinc-700">1. Initial Approved Budget (CCEA Baseline)</span>
              <span className="font-bold text-zinc-950">₹{origCost.toLocaleString('en-IN')} Cr (100% Baseline)</span>
            </div>
            <div className="w-full bg-zinc-100 h-3.5 rounded-full overflow-hidden border border-zinc-200">
              <div
                className="bg-zinc-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${origBarWidth}%` }}
              />
            </div>
          </div>

          {/* Bar 2: Revised Budget */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-semibold text-zinc-700">2. Revised Sanctioned Budget (MoSPI RCE)</span>
              <span className="font-bold text-zinc-950">
                ₹{revCost.toLocaleString('en-IN')} Cr ({costVariancePct >= 0 ? `+${costVariancePct.toFixed(1)}%` : '0%'})
              </span>
            </div>
            <div className="w-full bg-zinc-100 h-3.5 rounded-full overflow-hidden border border-zinc-200">
              <div
                className={`h-full rounded-full transition-all duration-500 ${costVariancePct >= 20 ? 'bg-rose-600' : 'bg-zinc-900'}`}
                style={{ width: `${revBarWidth}%` }}
              />
            </div>
          </div>

          {/* Bar 3: Cumulative Disbursed */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-semibold text-zinc-700">3. Cumulative Disbursed Amount (Milestone Realized)</span>
              <span className="font-bold text-emerald-700">
                ₹{estDisbursed.toLocaleString('en-IN', { maximumFractionDigits: 1 })} Cr ({progressPerc}% of Revised)
              </span>
            </div>
            <div className="w-full bg-zinc-100 h-3.5 rounded-full overflow-hidden border border-zinc-200">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${disbursedBarWidth}%` }}
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-500 font-mono">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-zinc-400" /> Approved Baseline</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-zinc-900" /> Revised Budget</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-600" /> Disbursed Funds</span>
          </div>
          <span className="text-zinc-900 font-semibold">RTI §4(1)(b)(xi) Standardized Realization</span>
        </div>
      </div>

      {/* Detailed Ledger */}
      <div className="rounded-xl bg-white border border-zinc-200 overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-zinc-200 bg-zinc-50/80 flex items-center justify-between">
          <span className="text-sm font-bold text-zinc-950">Public Expenditure Breakdown</span>
          <span className="text-xs font-mono text-zinc-500">Executing PSU: {activeProject.company}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-100/80 text-[11px] font-mono uppercase tracking-wider text-zinc-600 font-bold">
                <th className="p-3.5 pl-4">Expenditure Head</th>
                <th className="p-3.5">Sanctioned Reference</th>
                <th className="p-3.5 text-right">Amount (₹ Cr)</th>
                <th className="p-3.5 pr-4">Statutory Audit Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 font-mono">
              <tr className="hover:bg-zinc-50">
                <td className="p-3.5 pl-4 font-bold text-zinc-950">Initial Approved Baseline</td>
                <td className="p-3.5 text-zinc-600 font-sans">Cabinet Committee on Economic Affairs (CCEA)</td>
                <td className="p-3.5 text-right font-bold text-zinc-950">₹{origCost.toLocaleString('en-IN')}</td>
                <td className="p-3.5 pr-4"><span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300 text-[10px] font-bold">APPROVED</span></td>
              </tr>
              <tr className="hover:bg-zinc-50">
                <td className="p-3.5 pl-4 font-bold text-zinc-950">Cumulative Cost Variation / Revised Scope</td>
                <td className="p-3.5 text-zinc-600 font-sans">MoSPI Revised Cost Estimates (RCE)</td>
                <td className={`p-3.5 text-right font-bold ${costVariance > 0 ? 'text-amber-800' : 'text-zinc-800'}`}>
                  ₹{costVariance.toLocaleString('en-IN')}
                </td>
                <td className="p-3.5 pr-4">
                  <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${
                    costVariancePct >= 20 ? 'bg-rose-50 text-rose-800 border-rose-300' : 'bg-amber-50 text-amber-900 border-amber-300'
                  }`}>
                    {costVariancePct >= 20 ? 'CCEA REAPPRAISAL TRIGGERED' : 'WITHIN DELEGATED POWERS'}
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-zinc-50">
                <td className="p-3.5 pl-4 font-bold text-zinc-950">Contractor Cumulative Realization</td>
                <td className="p-3.5 text-zinc-600 font-sans">Physical Milestone Verification</td>
                <td className="p-3.5 text-right font-bold text-emerald-700">
                  ₹{estDisbursed.toLocaleString('en-IN', { maximumFractionDigits: 1 })}
                </td>
                <td className="p-3.5 pr-4"><span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300 text-[10px] font-bold">DISBURSED</span></td>
              </tr>
              <tr className="hover:bg-zinc-50">
                <td className="p-3.5 pl-4 font-bold text-zinc-950">CPWD Clause 10CC Escalation Allocation</td>
                <td className="p-3.5 text-zinc-600 font-sans">Wholesale Price Index (WPI) Formula</td>
                <td className="p-3.5 text-right font-bold text-zinc-900">
                  ₹{wpiInflationAllowance.toLocaleString('en-IN', { maximumFractionDigits: 1 })}
                </td>
                <td className="p-3.5 pr-4"><span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 border border-zinc-300 text-[10px] font-bold">INDEX-TIED</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════════════════
   TAB 3: ENVIRONMENTAL & STATUTORY CLEARANCE STATUS (ANUMATI)
   ═════════════════════════════════════════════════════════════════════════════ */
function PublicStageChecklist({ stages }) {
  const [expanded, setExpanded] = useState(false);
  if (!stages || stages.length === 0) return null;

  const displayStages = expanded ? stages : stages.slice(0, 3);
  const hasMore = stages.length > 3;

  return (
    <div className="space-y-2 pt-2 border-t border-zinc-200/80">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono uppercase text-zinc-500 font-bold tracking-wider">
          Statutory Stage Checklist ({stages.length})
        </span>
        {hasMore && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-[10px] font-bold text-blue-600 hover:text-blue-800 transition-colors"
          >
            {expanded ? 'Show Less' : `+${stages.length - 3} More Stages`}
          </button>
        )}
      </div>

      <div className="space-y-1.5">
        {displayStages.map((st, sIdx) => {
          const isStag = st.is_stagnated;
          const ratio = Number(st.stagnation_ratio || (st.days_pending / Math.max(st.benchmark_days, 1))).toFixed(1);
          const percent = Math.min(100, Math.round((st.days_pending / Math.max(st.benchmark_days, 1)) * 100));

          return (
            <div
              key={st.stage_code || sIdx}
              className={`p-2.5 rounded-lg border text-xs transition-all ${
                isStag
                  ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                  : 'bg-white border-zinc-200 text-zinc-900 shadow-2xs'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0">
                  <div className={`mt-0.5 shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${
                    isStag ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {isStag ? <AlertCircle className="w-2.5 h-2.5" /> : <Check className="w-2.5 h-2.5" />}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-[11px] leading-tight text-zinc-900 flex items-center gap-1.5 flex-wrap">
                      <span>{st.stage_name}</span>
                      {st.paperwork_loopback_detected && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          <RotateCcw className="w-2.5 h-2.5" /> Loopback
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-500 truncate mt-0.5" title={st.department}>
                      {st.department || 'Statutory Review Authority'}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-mono font-bold text-[10.5px] text-zinc-900">
                    {st.days_pending}d <span className="text-[9.5px] font-normal text-zinc-500">/ {st.benchmark_days}d SLA</span>
                  </div>
                  <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-mono font-bold mt-0.5 ${
                    isStag
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    RSI {ratio}×
                  </span>
                </div>
              </div>

              {/* SLA Consumption Progress Bar */}
              <div className="mt-2 pt-1.5 border-t border-zinc-100/80 flex items-center gap-2">
                <div className="flex-1 bg-zinc-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isStag ? 'bg-rose-500' : percent > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, percent)}%` }}
                  />
                </div>
                <span className="text-[9px] font-mono text-zinc-500 shrink-0 font-semibold">
                  {percent}% SLA consumed
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PublicClearancesTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [displayLimit, setDisplayLimit] = useState(50);

  useEffect(() => {
    let url = `/api/tanmay/anumati/clearances?limit=${displayLimit}`;
    if (searchQuery.trim()) url += `&q=${encodeURIComponent(searchQuery.trim())}`;
    if (selectedState && selectedState !== 'All') url += `&state=${encodeURIComponent(selectedState)}`;
    if (selectedStatus && selectedStatus !== 'All') url += `&status=${encodeURIComponent(selectedStatus)}`;

    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [searchQuery, selectedState, selectedStatus, displayLimit]);

  const projects = data?.projects || [];
  const filteredTotal = data?.filtered_total ?? projects.length;

  const statesList = [
    'All', 'Maharashtra', 'Uttar Pradesh', 'Madhya Pradesh', 'Bihar',
    'Karnataka', 'Gujarat', 'Andhra Pradesh', 'Tamil Nadu', 'West Bengal',
    'Rajasthan', 'Odisha', 'Assam', 'Jharkhand', 'Telangana', 'Kerala',
    'Chhattisgarh', 'Punjab', 'Haryana', 'Jammu & Kashmir', 'Uttarakhand',
    'Himachal Pradesh', 'Manipur', 'Meghalaya', 'Goa', 'Delhi'
  ];

  return (
    <div className="space-y-6">
      {/* Educational & Institutional Clearance Stages Guide */}
      <ClearanceStagesInfoGuide />

      {/* Top Banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-900 text-xs shadow-2xs">
        <Landmark className="w-4 h-4 text-zinc-800 shrink-0 mt-0.5" />
        <div>
          <strong className="text-zinc-950 font-bold">PARIVESH Statutory Clearance Transparency.</strong> Real-time regulatory tracking for all 2,207 Central Sector mega-projects across Forest Stage-I/II, Environmental Impact Assessment (EIA), Wildlife Clearances, and Land Acquisition approvals.
        </div>
      </div>

      {/* 4 National Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-2xs">
          <div className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 font-bold">Clearance Corpus</div>
          <div className="text-2xl font-extrabold text-zinc-950 font-mono mt-1">
            {data?.total_portfolio_projects || 2207}
          </div>
          <div className="text-xs text-zinc-500 mt-1 font-mono">7,257 active filings</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-2xs">
          <div className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 font-bold">Total Forest Diverted</div>
          <div className="text-2xl font-extrabold text-emerald-700 font-mono mt-1">
            {data?.total_forest_diversion_ha ? `${Number(data.total_forest_diversion_ha).toLocaleString()} ha` : '87,038 ha'}
          </div>
          <div className="text-xs text-emerald-600 mt-1 font-mono">MoEFCC CAMPA audited</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-2xs">
          <div className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 font-bold">Stalled Clearances</div>
          <div className="text-2xl font-extrabold text-rose-700 font-mono mt-1">
            {data?.projects_stalled ?? '—'}
          </div>
          <div className="text-xs text-rose-600 mt-1 font-mono">RSI &gt; 1.2 loopbacks</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-2xs">
          <div className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 font-bold">PMO Direct Escalations</div>
          <div className="text-2xl font-extrabold text-amber-700 font-mono mt-1">
            {data?.projects_flagged_for_pmo_escalation ?? '—'}
          </div>
          <div className="text-xs text-amber-600 mt-1 font-mono">Critical path block</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-xl bg-white border border-zinc-200 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by project name, ID (#619092), or proposal no..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setDisplayLimit(50);
            }}
            className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-zinc-300 rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-zinc-600 font-mono">
            <span>State:</span>
            <select
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                setDisplayLimit(50);
              }}
              className="text-xs bg-white border border-zinc-300 rounded-lg py-2 px-2.5 text-zinc-800 focus:outline-none cursor-pointer font-sans"
            >
              {statesList.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-zinc-600 font-mono">
            <span>Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setDisplayLimit(50);
              }}
              className="text-xs bg-white border border-zinc-300 rounded-lg py-2 px-2.5 text-zinc-800 focus:outline-none cursor-pointer font-sans"
            >
              <option value="All">All Statuses</option>
              <option value="STALLED">STALLED</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="APPROVED">APPROVED</option>
            </select>
          </div>
        </div>
      </div>

      {/* Clean Status Card Grid */}
      <div className="rounded-xl bg-white border border-zinc-200 overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-zinc-200 bg-zinc-50/80 flex items-center justify-between">
          <span className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider font-bold text-zinc-900">
            <TreePine className="w-3.5 h-3.5 text-emerald-700" />
            Statutory Clearances Pipeline
          </span>
          <span className="text-xs text-zinc-500 font-mono">Showing {projects.length} of {filteredTotal} matching proposals</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-zinc-400">
            Loading statutory clearances from PARIVESH portal...
          </div>
        ) : projects.length === 0 ? (
          <div className="p-12 text-center text-xs text-zinc-400">
            No clearance records match your search criteria. Try a different query or state.
          </div>
        ) : (
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((p) => {
              const status = p.overall_clearance_status || 'PENDING';
              let tagCls = 'bg-zinc-100 text-zinc-700 border-zinc-200';
              if (status === 'APPROVED') tagCls = 'bg-emerald-50 text-emerald-800 border-emerald-300';
              else if (status === 'IN_PROGRESS') tagCls = 'bg-amber-50 text-amber-800 border-amber-300';
              else if (status === 'STALLED') tagCls = 'bg-rose-50 text-rose-800 border-rose-300';

              const stages = p.stage_breakdown || [];

              return (
                <div key={p.project_id} className="p-4 rounded-lg bg-zinc-50/70 border border-zinc-200/80 space-y-3 hover:border-zinc-400 transition-all shadow-2xs">
                  <div className="flex items-start justify-between gap-2 border-b border-zinc-200/80 pb-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded bg-zinc-950 text-white font-mono font-bold text-[10px]">
                          #{p.project_id}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-zinc-200/80 text-zinc-800 text-[10px] font-semibold">
                          {p.state || 'Pan-India'}
                        </span>
                        <span className="text-[10px] text-zinc-500 truncate">({p.sector || 'Infrastructure'})</span>
                      </div>
                      <h4 className="text-xs font-bold text-zinc-900 leading-snug truncate" title={p.project_name}>
                        {p.project_name}
                      </h4>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded border text-[10px] font-mono font-bold shrink-0 ${tagCls}`}>
                      {status}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 rounded bg-white border border-zinc-200 shadow-2xs">
                      <span className="text-[9px] uppercase font-mono text-zinc-500 font-bold block">Forest Diverted</span>
                      <span className="font-mono font-bold text-zinc-900 text-xs block mt-0.5">
                        {p.total_forest_diversion_ha ? `${p.total_forest_diversion_ha} ha` : '—'}
                      </span>
                    </div>
                    <div className="p-2 rounded bg-white border border-zinc-200 shadow-2xs">
                      <span className="text-[9px] uppercase font-mono text-zinc-500 font-bold block">Review Period</span>
                      <span className="font-mono font-bold text-zinc-900 text-xs block mt-0.5">{p.days_overdue || 0}d</span>
                    </div>
                    <div className="p-2 rounded bg-white border border-zinc-200 shadow-2xs">
                      <span className="text-[9px] uppercase font-mono text-zinc-500 font-bold block">Bottleneck</span>
                      <span className="font-semibold text-zinc-900 text-[10.5px] truncate block mt-0.5" title={p.bottleneck_department}>
                        {p.bottleneck_department?.split(' ')[0] || 'MoEFCC'}
                      </span>
                    </div>
                  </div>

                  {/* Expanded Stage Checklist */}
                  <PublicStageChecklist stages={stages} />
                </div>
              );
            })}
          </div>
        )}

        {/* Load More Button */}
        {projects.length < filteredTotal && (
          <div className="p-4 border-t border-zinc-200 text-center bg-zinc-50">
            <button
              onClick={() => setDisplayLimit((prev) => prev + 50)}
              className="px-6 py-2 rounded-lg bg-zinc-900 hover:bg-black text-white font-bold text-xs shadow-2xs transition-colors"
            >
              Load More Proposals ({filteredTotal - projects.length} remaining)
            </button>
          </div>
        )}

        <div className="p-3 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between text-xs text-zinc-500 font-mono">
          <span>Direct feed from PARIVESH statutory portal (2,207 Projects Indexed)</span>
          <span className="text-zinc-800 font-semibold">RTI §4 Environmental Disclosure</span>
        </div>
      </div>
    </div>
  );
}
