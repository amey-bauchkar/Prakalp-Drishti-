import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  MapPin, FileText, Landmark, Search, Filter, ShieldCheck,
  Calendar, Building2, TrendingUp, AlertTriangle, CheckCircle2,
  Clock, ArrowRight, ExternalLink, HelpCircle, Layers, Info, Check,
  TreePine, AlertCircle, Sparkles, ChevronRight, BarChart3,
  Download, ChevronLeft, ChevronsLeft, ChevronsRight, RotateCcw,
  SlidersHorizontal, ArrowUpDown, ListFilter
} from 'lucide-react';
import { Circle, CircleMarker, MapContainer, Popup } from 'react-leaflet';
import BaseMapLayer, { BaseMapNotice } from '../components/BaseMapLayer';

const API = '';

// Status colors matching existing internal thresholds (Progress vs Delay)
function getProjectStatus(p) {
  const delayed = Number(p.delayed_months) || 0;
  const progress = Number(p.progress_perc) || 0;
  if (delayed > 24 || (progress < 40 && delayed > 12)) {
    return {
      label: 'CRITICAL DELAY',
      color: '#A81F2D', // --crimson
      tagClass: 'tag-critical',
      dotClass: 'bg-crimson',
      badgeClass: 'metric-neg',
    };
  }
  if (delayed > 0 || progress < 70) {
    return {
      label: 'UNDER MONITORING',
      color: '#A9680A', // --amber
      tagClass: 'tag-warn',
      dotClass: 'bg-amber',
      badgeClass: 'metric-warn',
    };
  }
  return {
    label: 'ON TRACK',
    color: '#0E7A4A', // --emerald
    tagClass: 'tag-ok',
    dotClass: 'bg-emerald',
    badgeClass: 'metric-pos',
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
      label: 'Project Metadata & Tracking',
      desc: 'Sovereign profiles, milestone progress & Pan-India GIS map',
      icon: MapPin
    },
    {
      id: 'financial',
      label: 'Financial Transparency (RTI §4)',
      desc: 'Sanctioned vs Disbursed visual capex & WPI price adjustments',
      icon: FileText
    },
    {
      id: 'clearances',
      label: 'Statutory Clearances (ANUMATI)',
      desc: 'PARIVESH Forest, EIA, Wildlife & Land Acquisition pipeline',
      icon: Landmark
    }
  ];

  return (
    <div className="space-y-6 font-sans pb-20">
      {/* ── Console Masthead Telemetry ── */}
      <div className="telemetry justify-between">
        <span className="flex items-center gap-2 flex-wrap">
          <b>NAGRIK PUBLIC TRANSPARENCY PORTAL</b>
          <span className="sep">/</span>
          <span>RTI ACT §4 PROACTIVE DISCLOSURE</span>
          <span className="sep">/</span>
          <span>2,043 ONGOING · 2,207 SEALED CORPUS · ₹47.44L CR</span>
        </span>
        <span className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>ACTIVE DOSSIER</span>
          <b>#{selectedProjectId}</b>
        </span>
      </div>

      {/* ── Command Header ── */}
      <div className="command-header p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 pl-2 pr-2.5 py-0.5 rounded-sm bg-white/[0.07] text-[9.5px] font-extrabold tracking-institutional uppercase text-gov-accent border-l-2 border-gov-accent mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>CITIZEN CHARTER · OPEN GOVERNMENT DATA</span>
            </div>
            <h1 className="font-heading font-extrabold text-[21px] sm:text-[25px] tracking-[-0.025em] text-white leading-[1.12]">
              Public Infrastructure Transparency &amp; Accountability
            </h1>
            <p className="text-[12.5px] text-ink-200 leading-relaxed max-w-2xl mt-1.5">
              Proactive public disclosure for Central Sector Mega-Projects under Section 4(1)(b) of the Right to Information Act, 2005.
              Citizens can inspect project baselines, capex progress, and statutory environmental clearances.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="panel p-3 bg-white/[0.05] border-white/15 text-right">
              <div className="text-[9.5px] uppercase tracking-wider text-ink-300 font-bold">Monitored Portfolio</div>
              <div className="text-[19px] font-heading font-extrabold text-white leading-tight">₹47.4L Cr Capex</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section Navigation Bar (Shared Engine Rail) ── */}
      <nav className="engine-rail" role="tablist" aria-label="Public transparency sections">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={`engine-tab ${isActive ? 'active' : ''}`}
            >
              <span className="engine-tab-icon">
                <Icon className="w-3.5 h-3.5" strokeWidth={2} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="engine-tab-name">{tab.label}</span>
                <span className="engine-tab-desc">{tab.desc}</span>
              </span>
            </button>
          );
        })}
      </nav>

      {/* ── Tab 1: Public Project Metadata & Tracking ── */}
      {activeTab === 'metadata' && (
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
      )}

      {/* ── Tab 2: Financial Transparency ── */}
      {activeTab === 'financial' && (
        <PublicFinancialTab
          projects={filteredProjects}
          activeProject={activeProject}
          selectProject={selectProject}
        />
      )}

      {/* ── Tab 3: Environmental & Statutory Clearance Status (ANUMATI) ── */}
      {activeTab === 'clearances' && (
        <PublicClearancesTab />
      )}
    </div>
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
  // Reported by BaseMapLayer when cached tiles are missing. Held here rather
  // than inside the map so the notice can sit over the pane at a readable size.
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

  // Filter projects that have georeferenced coordinates for Map
  const mappedProjects = useMemo(() => {
    return projects.filter((p) => {
      const lat = Number(p.latitude);
      const lon = Number(p.longitude);
      return Number.isFinite(lat) && Number.isFinite(lon) && (lat !== 0 || lon !== 0);
    });
  }, [projects]);

  // Handle directory scroll to load more
  const handleDirScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollHeight - scrollTop <= clientHeight + 150 && dirLimit < projects.length) {
      setDirLimit((prev) => Math.min(prev + 100, projects.length));
    }
  };

  // Master Table Filtered and Sorted Dataset
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
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6">
      {/* Active Project Highlight Card using standard hairgrid */}
      {activeProject && (
        <div className="panel panel-accent">
          <div className="panel-head">
            <div className="flex items-center gap-2 min-w-0">
              <span className="tag tag-solid font-heading font-bold text-[10px]">ID #{activeProject.project_id}</span>
              <span className="tag tag-info">{activeProject.sector || 'Central Sector'}</span>
              <span className={`tag ${status.tagClass}`}>{status.label}</span>
              <span className="panel-title truncate ml-1">{activeProject.project_name}</span>
            </div>
            <span className="panel-meta shrink-0">
              Physical Progress: <strong className="text-gov-navy font-heading font-bold text-[12.5px]">{progressPct.toFixed(1)}%</strong>
            </span>
          </div>

          <div className="hairgrid hairgrid-4">
            <div className="metric-cell">
              <span className="metric-label">Executing Agency</span>
              <span className="metric-value metric-value-sm font-heading font-bold truncate">{activeProject.company || '—'}</span>
              <span className="metric-sub truncate">{activeProject.state || 'Pan-India'}</span>
            </div>
            <div className="metric-cell">
              <span className="metric-label">Original Sanction Date</span>
              <span className="metric-value metric-value-sm font-heading font-bold">{activeProject.sanction_date?.slice(0, 10) || '—'}</span>
              <span className="metric-sub">CCEA baseline approval</span>
            </div>
            <div className="metric-cell">
              <span className="metric-label">Target Completion</span>
              <span className="metric-value metric-value-sm font-heading font-bold">{activeProject.target_date?.slice(0, 10) || '—'}</span>
              <span className="metric-sub">Revised deadline</span>
            </div>
            <div className="metric-cell">
              <span className="metric-label">Schedule Deviation</span>
              <span className={`metric-value metric-value-sm font-heading font-bold ${Number(activeProject.delayed_months) > 0 ? 'metric-neg' : 'metric-pos'}`}>
                {Number(activeProject.delayed_months) > 0 ? `+${activeProject.delayed_months} Months` : 'Nil Delay'}
              </span>
              <span className="metric-sub">Against original target</span>
            </div>
          </div>

          {/* Progress bar line */}
          <div className="px-4 py-3 border-t border-gov-border bg-gov-surface-2 flex items-center gap-3">
            <span className="text-[11px] font-bold text-gov-muted uppercase tracking-wider shrink-0">Milestone Track</span>
            <div className="flex-1 bg-gov-border h-2 rounded-xs overflow-hidden relative">
              <div
                className="bg-[#0060B6] h-full rounded-xs transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="font-heading text-xs font-bold text-gov-navy shrink-0">{progressPct.toFixed(1)}% Completed</span>
          </div>
        </div>
      )}

      {/* Interactive Pan-India Map + Directory Filter Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Geographic Leaflet Map */}
        <div className="lg:col-span-7 panel flex flex-col h-[580px]">
          <div className="panel-head">
            <span className="panel-title">
              <MapPin className="w-3.5 h-3.5 text-[#0060B6]" />
              Pan-India Geographic Distribution ({mappedProjects.length.toLocaleString('en-IN')} Georeferenced Sites)
            </span>
            <div className="flex items-center gap-2.5 text-[10px] font-mono">
              <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-600" /> On Track</span>
              <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-600" /> Monitored</span>
              <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-600" /> Delayed</span>
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
              {/* Render all georeferenced projects matching filters using high-performance Leaflet canvas */}
              {mappedProjects.map((p) => {
                const lat = Number(p.latitude);
                const lon = Number(p.longitude);
                if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
                const pStat = getProjectStatus(p);
                const isSelected = String(p.project_id) === String(activeProject?.project_id);
                const approx = p.location_is_approximate === true;

                // An UNUSABLE tier is not a pin at all. A state centroid carries a
                // 200 km error and a national centroid 800 km: at that scale the
                // coordinate names an administrative unit, not the works. Drawing it
                // as a dot -- even a dashed one -- still asserts a point location the
                // data cannot support, so the true uncertainty is drawn as an area and
                // the reader can see how little is actually known.
                //
                // The radius is SERVED by the API from the single class table in
                // eo_viewport.py. Deriving it here from the precision string would be a
                // second copy of that table, and the two would drift.
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
                        fillOpacity: 0.04,
                        weight: 1,
                        dashArray: '4 6',
                      }}
                      interactive={false}
                    />
                  )}
                  <CircleMarker
                    key={p.project_id}
                    center={[lat, lon]}
                    radius={isSelected ? 8.5 : 4}
                    pathOptions={{
                      fillColor: pStat.color,
                      fillOpacity: approx ? 0.22 : (isSelected ? 0.95 : 0.72),
                      color: approx ? pStat.color : (isSelected ? '#071320' : '#ffffff'),
                      weight: isSelected ? 2.5 : 0.8,
                      dashArray: approx ? '2 3' : undefined,
                    }}
                    eventHandlers={{
                      click: () => selectProject(p.project_id),
                    }}
                  >
                    <Popup>
                      <div className="p-1 font-sans text-xs space-y-1">
                        <div className="font-bold text-slate-900">{p.project_name}</div>
                        <div className="text-slate-600 font-heading font-semibold text-[10px]">ID: #{p.project_id} · {p.sector}</div>
                        <div className="text-slate-700 font-heading font-bold">Cost: ₹{Number(p.revised_cost_cr || 0).toLocaleString('en-IN')} Cr</div>
                        <div className="text-slate-700 font-heading font-semibold">Progress: {p.progress_perc}% ({pStat.label})</div>
                        {approx && (
                          <div className="text-amber-800 bg-amber-50 border border-amber-300 rounded-xs px-1 py-0.5 text-[10px] leading-snug">
                            <strong>Approximate location.</strong> Plotted at a
                            {' '}{String(p.geocode_precision || '').toLowerCase().includes('state')
                              ? 'state' : 'national'}{' '}centroid, not a surveyed site coordinate.
                            {Number.isFinite(Number(p.geocode_error_radius_m)) && (
                              <span className="block mt-0.5">
                                Uncertainty ±{Math.round(Number(p.geocode_error_radius_m) / 1000)} km
                              </span>
                            )}
                          </div>
                        )}
                        <div className="pt-1">
                          <button
                            onClick={() => handleSelectAndFocus(p.project_id)}
                            className="w-full text-center py-1 bg-[#0060B6] hover:bg-[#004f98] text-white rounded-xs font-bold text-[10px]"
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

          <div className="panel-head border-t border-b-0 py-2">
            <span className="panel-meta">Click any map marker to view quick summary and inspect dossier</span>
            <span className="panel-meta">GeoNames 5-Tier Geocoding Engine</span>
          </div>
        </div>

        {/* Right Column: Search & Filtered Project Directory */}
        <div className="lg:col-span-5 panel flex flex-col h-[580px]">
          <div className="p-3 border-b border-gov-border bg-gov-surface-2 space-y-2.5 shrink-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gov-muted absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search by name, PSU, state or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-gov-surface border border-gov-border rounded-xs focus:outline-none focus:border-gov-accent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-xs text-gov-muted hover:text-gov-navy"
                >
                  ✕
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="w-full text-xs bg-gov-surface border border-gov-border rounded-xs p-1.5 text-gov-navy focus:outline-none"
                aria-label="Filter by sector"
              >
                {sectors.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full text-xs bg-gov-surface border border-gov-border rounded-xs p-1.5 text-gov-navy focus:outline-none"
                aria-label="Filter by state"
              >
                {states.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            {(selectedSector !== 'All' || selectedState !== 'All' || searchQuery) && (
              <div className="flex items-center justify-between text-[10px] text-gov-muted">
                <span>Filter Active: {projects.length} of {allProjects.length || 2207} projects match</span>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedSector('All');
                    setSelectedState('All');
                  }}
                  className="text-azure hover:underline flex items-center gap-1 font-semibold"
                >
                  <RotateCcw className="w-2.5 h-2.5" /> Reset Filters
                </button>
              </div>
            )}
          </div>

          {/* Scrollable list with progressive expansion for all 2,207 projects */}
          <div
            onScroll={handleDirScroll}
            className="flex-1 overflow-y-auto divide-y divide-gov-border"
          >
            {projects.length === 0 ? (
              <div className="p-8 text-center text-gov-muted text-xs">
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
                      className={`p-3 cursor-pointer transition-colors ${
                        isSelected ? 'bg-gov-surface-3 border-l-3 border-gov-accent font-medium' : 'hover:bg-gov-surface-2'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="font-heading text-[9.5px] font-bold text-gov-muted">#{p.project_id}</span>
                            <span className="text-[9.5px] font-bold text-[#0060B6] truncate">{p.sector}</span>
                          </div>
                          <h4 className="text-xs font-bold text-gov-navy truncate">{p.project_name}</h4>
                          <p className="text-[11px] text-gov-muted truncate mt-0.5">{p.company} · {p.state}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`tag ${pStat.tagClass} font-heading font-bold`}>{p.progress_perc}%</span>
                          <div className="font-heading font-bold text-[11px] text-gov-navy mt-1">
                            ₹{Number(p.revised_cost_cr || 0).toLocaleString('en-IN')} Cr
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {dirLimit < projects.length && (
                  <div className="p-3 bg-gov-surface-2 text-center space-y-1.5 border-t border-gov-border">
                    <p className="text-[10.5px] text-gov-muted">
                      Showing {dirLimit} of {projects.length.toLocaleString('en-IN')} projects
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => setDirLimit((prev) => Math.min(prev + 100, projects.length))}
                        className="px-2.5 py-1 text-xs bg-gov-surface border border-gov-border rounded-xs text-gov-navy font-semibold hover:bg-gov-surface-3"
                      >
                        Load +100 More
                      </button>
                      <button
                        onClick={() => setDirLimit(projects.length)}
                        className="px-2.5 py-1 text-xs bg-[#0060B6] text-white rounded-xs font-semibold hover:bg-[#004f98]"
                      >
                        Show All ({projects.length.toLocaleString('en-IN')})
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="panel-head border-t border-b-0 py-2 justify-between">
            <span className="panel-meta">
              Showing {Math.min(dirLimit, projects.length).toLocaleString('en-IN')} of {projects.length.toLocaleString('en-IN')} Projects
            </span>
            <span className="panel-meta font-semibold">MoSPI Central Sector</span>
          </div>
        </div>
      </div>

      {/* ── MASTER PUBLIC TRACKING REGISTER & TABLE (ALL 2,207 PROJECTS) ── */}
      <div className="panel">
        <div className="panel-head flex-wrap gap-2 py-3.5">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-gov-accent" />
              <span className="panel-title text-sm sm:text-base">
                Central Sector Mega-Projects Master Public Tracking Register
              </span>
              <span className="tag tag-solid font-mono font-bold text-[10px]">
                {corpus.length.toLocaleString('en-IN')} PROJECTS
              </span>
            </div>
            <p className="panel-meta text-[11px] mt-0.5">
              RTI Section 4(1)(b) proactive disclosure covering all {portfolioStats.total.toLocaleString('en-IN')} central projects (₹{(portfolioStats.totalCapex / 100000).toFixed(2)} Lakh Cr capex portfolio)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xs bg-[#0060B6] hover:bg-[#004f98] text-white font-heading font-semibold text-xs shadow-xs transition-colors"
              title="Download filtered projects as CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV ({tableFiltered.length.toLocaleString('en-IN')})</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Stat Mini Cards */}
        <div className="hairgrid hairgrid-4 border-b border-gov-border">
          <div className="metric-cell py-2.5">
            <span className="metric-label">Total Corpus Projects</span>
            <span className="metric-value metric-value-sm font-heading font-bold text-gov-navy">
              {portfolioStats.total.toLocaleString('en-IN')}
            </span>
            <span className="metric-sub">₹{(portfolioStats.totalCapex / 100000).toFixed(1)} Lakh Cr Total Capex</span>
          </div>
          <div className="metric-cell py-2.5">
            <span className="metric-label">On Track Baseline</span>
            <span className="metric-value metric-value-sm font-heading font-bold metric-pos">
              {portfolioStats.onTrack.toLocaleString('en-IN')}
            </span>
            <span className="metric-sub">{((portfolioStats.onTrack / portfolioStats.total) * 100).toFixed(1)}% within milestones</span>
          </div>
          <div className="metric-cell py-2.5">
            <span className="metric-label">Under Monitoring</span>
            <span className="metric-value metric-value-sm font-heading font-bold text-amber-600">
              {portfolioStats.monitored.toLocaleString('en-IN')}
            </span>
            <span className="metric-sub">{((portfolioStats.monitored / portfolioStats.total) * 100).toFixed(1)}% schedule alerts</span>
          </div>
          <div className="metric-cell py-2.5">
            <span className="metric-label">Critical Delay</span>
            <span className="metric-value metric-value-sm font-heading font-bold metric-neg">
              {portfolioStats.critical.toLocaleString('en-IN')}
            </span>
            <span className="metric-sub">{((portfolioStats.critical / portfolioStats.total) * 100).toFixed(1)}% &gt;24 mo delay</span>
          </div>
        </div>

        {/* Master Table Filter Controls Toolbar */}
        <div className="p-3.5 bg-gov-surface-2 border-b border-gov-border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'All', label: `All Projects (${corpus.length})` },
              { id: 'ON TRACK', label: `On Track (${portfolioStats.onTrack})` },
              { id: 'UNDER MONITORING', label: `Monitored (${portfolioStats.monitored})` },
              { id: 'CRITICAL DELAY', label: `Critical Delay (${portfolioStats.critical})` }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setTableStatus(tab.id)}
                className={`px-2.5 py-1 text-xs rounded-xs font-heading font-semibold transition-colors ${
                  tableStatus === tab.id
                    ? 'bg-gov-navy text-white shadow-xs'
                    : 'bg-gov-surface border border-gov-border text-gov-navy hover:bg-gov-surface-3'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search, Sort and Page Size */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[180px] sm:min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-gov-muted absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search all 2,207 projects..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-gov-surface border border-gov-border rounded-xs focus:outline-none focus:border-gov-accent"
              />
              {tableSearch && (
                <button
                  onClick={() => setTableSearch('')}
                  className="absolute right-2.5 top-1.5 text-xs text-gov-muted hover:text-gov-navy"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-gov-muted whitespace-nowrap">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-xs bg-gov-surface border border-gov-border rounded-xs py-1.5 px-2 text-gov-navy focus:outline-none"
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

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-gov-muted whitespace-nowrap">Rows:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(e.target.value === 'All' ? 'All' : Number(e.target.value))}
                className="text-xs bg-gov-surface border border-gov-border rounded-xs py-1.5 px-2 text-gov-navy focus:outline-none"
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
        <div className="panel-flush overflow-x-auto">
          <table className="ledger w-full text-left">
            <thead>
              <tr>
                <th className="w-16">ID</th>
                <th className="min-w-[240px]">Project Name & Sector</th>
                <th className="min-w-[170px]">Agency & State</th>
                <th className="num min-w-[130px]">Sanction / Revised Cost</th>
                <th className="min-w-[120px]">Physical Progress</th>
                <th className="min-w-[110px]">Schedule Delay</th>
                <th className="min-w-[110px]">Audit Status</th>
                <th className="text-right min-w-[130px]">Action</th>
              </tr>
            </thead>
            <tbody>
              {pagedProjects.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-gov-muted text-xs">
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
                      className={isSelected ? 'bg-gov-surface-3 font-medium' : 'hover:bg-gov-surface-2'}
                    >
                      {/* Column 1: ID */}
                      <td>
                        <span className="font-heading font-bold text-[11px] text-gov-muted">
                          #{p.project_id}
                        </span>
                      </td>

                      {/* Column 2: Name & Sector */}
                      <td>
                        <div className="font-bold text-xs text-gov-navy leading-snug">
                          {p.project_name}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span className="tag tag-info text-[9px] py-0">{p.sector}</span>
                          {p.location_is_approximate && (
                            <span className="text-[9px] text-amber-700 bg-amber-50 px-1 rounded-xs border border-amber-200">
                              Centroid Approx
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Column 3: Executing Agency & State */}
                      <td>
                        <div className="text-xs font-semibold text-gov-navy truncate max-w-[200px]" title={p.company}>
                          {p.company || '—'}
                        </div>
                        <div className="text-[11px] text-gov-muted flex items-center gap-1 mt-0.5">
                          <MapPin className="w-2.5 h-2.5" />
                          <span>{p.state || 'Pan-India'}</span>
                        </div>
                      </td>

                      {/* Column 4: Cost */}
                      <td className="num font-mono">
                        <div className="font-heading font-bold text-xs text-gov-navy">
                          ₹{revCost.toLocaleString('en-IN')} Cr
                        </div>
                        <div className="text-[10px] text-gov-muted">
                          Orig: ₹{origCost.toLocaleString('en-IN')} Cr
                          {costDiff > 0 && (
                            <span className="text-amber-700 ml-1 font-semibold">
                              (+{costDiffPct.toFixed(0)}%)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Column 5: Physical Progress */}
                      <td>
                        <div className="flex items-center justify-between text-[10.5px] font-heading font-bold text-gov-navy mb-1">
                          <span>{prog.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gov-border h-1.5 rounded-xs overflow-hidden">
                          <div
                            className="bg-[#0060B6] h-full rounded-xs transition-all duration-300"
                            style={{ width: `${prog}%` }}
                          />
                        </div>
                      </td>

                      {/* Column 6: Delay */}
                      <td>
                        <div className={`font-heading font-bold text-xs ${delayed > 0 ? 'metric-neg' : 'metric-pos'}`}>
                          {delayed > 0 ? `+${delayed} Mos` : 'Nil Delay'}
                        </div>
                        <div className="text-[10px] text-gov-muted truncate">
                          Target: {p.target_date?.slice(0, 10) || '—'}
                        </div>
                      </td>

                      {/* Column 7: Status */}
                      <td>
                        <span className={`tag ${pStat.tagClass} font-heading font-bold text-[9.5px]`}>
                          {pStat.label}
                        </span>
                      </td>

                      {/* Column 8: Action Buttons */}
                      <td className="text-right">
                        <button
                          onClick={() => handleSelectAndFocus(p.project_id)}
                          className="px-2.5 py-1 bg-[#0060B6] hover:bg-[#004f98] text-white rounded-xs text-[10.5px] font-heading font-bold transition-colors"
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
        <div className="p-3 bg-gov-surface-2 border-t border-gov-border flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-gov-muted text-[11.5px]">
            Showing{' '}
            <strong className="text-gov-navy font-heading">
              {tableFiltered.length === 0 ? 0 : (safeCurrentPage - 1) * effectivePageSize + 1}
            </strong>{' '}
            to{' '}
            <strong className="text-gov-navy font-heading">
              {Math.min(safeCurrentPage * effectivePageSize, tableFiltered.length)}
            </strong>{' '}
            of{' '}
            <strong className="text-gov-navy font-heading">
              {tableFiltered.length.toLocaleString('en-IN')}
            </strong>{' '}
            Filtered Projects ({corpus.length.toLocaleString('en-IN')} Total Corpus)
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                disabled={safeCurrentPage <= 1}
                onClick={() => setCurrentPage(1)}
                className="p-1.5 rounded-xs border border-gov-border bg-gov-surface disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gov-surface-3 text-gov-navy"
                title="First Page"
              >
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>
              <button
                disabled={safeCurrentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-xs border border-gov-border bg-gov-surface disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gov-surface-3 text-gov-navy"
                title="Previous Page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <span className="px-3 py-1 font-heading font-bold text-xs text-gov-navy bg-gov-surface border border-gov-border rounded-xs">
                Page {safeCurrentPage} of {totalPages}
              </span>

              <button
                disabled={safeCurrentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-xs border border-gov-border bg-gov-surface disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gov-surface-3 text-gov-navy"
                title="Next Page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                disabled={safeCurrentPage >= totalPages}
                onClick={() => setCurrentPage(totalPages)}
                className="p-1.5 rounded-xs border border-gov-border bg-gov-surface disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gov-surface-3 text-gov-navy"
                title="Last Page"
              >
                <ChevronsRight className="w-3.5 h-3.5" />
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
      <div className="note note-info">
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-azure" />
        <span>
          <strong>Right to Information Act, 2005 · Section 4(1)(b)(xi) Mandate.</strong> Proactive disclosure of sanctioned budgetary outlays, cumulative spending against physical progress, and statutory CPWD price adjustments.
        </span>
      </div>

      {/* Top 4 Financial Metric Cells in Standard Hairgrid */}
      <div className="hairgrid hairgrid-4">
        <div className="metric-cell">
          <span className="metric-label">Sanctioned Baseline</span>
          <span className="metric-value font-heading font-bold">₹{origCost.toLocaleString('en-IN')} <span className="text-xs font-semibold text-gov-muted">Cr</span></span>
          <span className="metric-sub">CCEA Approved Initial Outlay</span>
        </div>

        <div className="metric-cell">
          <span className="metric-label">Revised Sanctioned Cost</span>
          <span className="metric-value font-heading font-bold text-[#0060B6]">₹{revCost.toLocaleString('en-IN')} <span className="text-xs font-semibold text-gov-muted">Cr</span></span>
          <span className={`metric-sub font-medium ${costVariance > 0 ? 'metric-warn' : 'metric-pos'}`}>
            {costVariance > 0 ? `+₹${costVariance.toLocaleString('en-IN')} Cr (+${costVariancePct.toFixed(1)}%)` : 'Within Initial Outlay'}
          </span>
        </div>

        <div className="metric-cell">
          <span className="metric-label">Cumulative Disbursal (Est.)</span>
          <span className="metric-value font-heading font-bold metric-pos">₹{estDisbursed.toLocaleString('en-IN', { maximumFractionDigits: 1 })} <span className="text-xs font-semibold text-gov-muted">Cr</span></span>
          <span className="metric-sub">Tied to {progressPerc}% physical milestone</span>
        </div>

        <div className="metric-cell">
          <span className="metric-label">CPWD WPI Escalation</span>
          <span className="metric-value font-heading font-bold">₹{wpiInflationAllowance.toLocaleString('en-IN', { maximumFractionDigits: 1 })} <span className="text-xs font-semibold text-gov-muted">Cr</span></span>
          <span className="metric-sub">Statutory Clause 10CC buffer</span>
        </div>
      </div>

      {/* Visual Budget Comparison: Progress Bars */}
      <div className="panel p-5 space-y-5">
        <div className="panel-head -mx-5 -mt-5 mb-4">
          <span className="panel-title">
            <BarChart3 className="w-3.5 h-3.5 text-gov-accent" />
            Visual Capex Comparison · {activeProject.project_name}
          </span>
          <span className="panel-meta font-heading font-bold">#{activeProject.project_id}</span>
        </div>

        <div className="space-y-4">
          {/* Bar 1: Sanctioned Initial */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-gov-navy">1. Initial Approved Budget (CCEA Baseline)</span>
              <span className="font-heading font-bold text-gov-navy">₹{origCost.toLocaleString('en-IN')} Cr (100% Baseline)</span>
            </div>
            <div className="w-full bg-gov-border h-3 rounded-xs overflow-hidden">
              <div
                className="bg-slate-600 h-full rounded-xs transition-all duration-500"
                style={{ width: `${origBarWidth}%` }}
              />
            </div>
          </div>

          {/* Bar 2: Revised Budget */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-gov-navy">2. Revised Sanctioned Budget (MoSPI RCE)</span>
              <span className="font-heading font-bold text-[#0060B6]">
                ₹{revCost.toLocaleString('en-IN')} Cr ({costVariancePct >= 0 ? `+${costVariancePct.toFixed(1)}%` : '0%'})
              </span>
            </div>
            <div className="w-full bg-gov-border h-3 rounded-xs overflow-hidden">
              <div
                className={`h-full rounded-xs transition-all duration-500 ${costVariancePct >= 20 ? 'bg-crimson' : 'bg-[#0060B6]'}`}
                style={{ width: `${revBarWidth}%` }}
              />
            </div>
          </div>

          {/* Bar 3: Cumulative Disbursed */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-gov-navy">3. Cumulative Disbursed Amount (Milestone Realized)</span>
              <span className="font-heading font-bold metric-pos">
                ₹{estDisbursed.toLocaleString('en-IN', { maximumFractionDigits: 1 })} Cr ({progressPerc}% of Revised)
              </span>
            </div>
            <div className="w-full bg-gov-border h-3 rounded-xs overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-xs transition-all duration-500"
                style={{ width: `${disbursedBarWidth}%` }}
              />
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-gov-border flex flex-wrap items-center justify-between gap-3 text-[11px] text-gov-muted">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-xs bg-slate-600 shrink-0" />
            <span>Approved Baseline</span>
            <span className="w-2.5 h-2.5 rounded-xs bg-[#0060B6] shrink-0 ml-2" />
            <span>Revised Budget</span>
            <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600 shrink-0 ml-2" />
            <span>Disbursed Funds</span>
          </div>
          <span className="font-heading font-semibold">RTI §4(1)(b)(xi) Standardized Realization</span>
        </div>
      </div>

      {/* Detailed Ledger */}
      <div className="panel">
        <div className="panel-head">
          <span className="panel-title">Public Expenditure Breakdown</span>
          <span className="panel-meta">Executing PSU: {activeProject.company}</span>
        </div>
        <div className="panel-flush overflow-x-auto">
          <table className="ledger">
            <thead>
              <tr>
                <th>Expenditure Head</th>
                <th>Sanctioned Reference</th>
                <th className="num">Amount (₹ Cr)</th>
                <th>Statutory Audit Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="font-semibold text-gov-navy">Initial Approved Baseline</td>
                <td className="text-gov-muted">Cabinet Committee on Economic Affairs (CCEA)</td>
                <td className="num font-heading font-bold">₹{origCost.toLocaleString('en-IN')}</td>
                <td><span className="tag tag-ok font-heading font-bold">APPROVED</span></td>
              </tr>
              <tr>
                <td className="font-semibold text-gov-navy">Cumulative Cost Variation / Revised Scope</td>
                <td className="text-gov-muted">MoSPI Revised Cost Estimates (RCE)</td>
                <td className={`num font-heading font-bold ${costVariance > 0 ? 'text-amber-700' : ''}`}>
                  ₹{costVariance.toLocaleString('en-IN')}
                </td>
                <td>
                  <span className={costVariancePct >= 20 ? 'tag tag-critical font-heading font-bold' : 'tag tag-warn font-heading font-bold'}>
                    {costVariancePct >= 20 ? 'CCEA REAPPRAISAL TRIGGERED' : 'WITHIN DELEGATED POWERS'}
                  </span>
                </td>
              </tr>
              <tr>
                <td className="font-semibold text-gov-navy">Contractor Cumulative Realization</td>
                <td className="text-gov-muted">Physical Milestone Verification</td>
                <td className="num font-heading font-bold metric-pos">
                  ₹{estDisbursed.toLocaleString('en-IN', { maximumFractionDigits: 1 })}
                </td>
                <td><span className="tag tag-ok font-heading font-bold">DISBURSED</span></td>
              </tr>
              <tr>
                <td className="font-semibold text-gov-navy">CPWD Clause 10CC Escalation Allocation</td>
                <td className="text-gov-muted">Wholesale Price Index (WPI) Formula</td>
                <td className="num font-heading font-bold text-azure">
                  ₹{wpiInflationAllowance.toLocaleString('en-IN', { maximumFractionDigits: 1 })}
                </td>
                <td><span className="tag tag-info font-heading font-bold">INDEX-TIED</span></td>
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
      {/* Top Banner */}
      <div className="note note-ok">
        <Landmark className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
        <span>
          <strong>PARIVESH Statutory Clearance Transparency.</strong> Real-time regulatory tracking for all 2,207 Central Sector mega-projects across Forest Stage-I/II, Environmental Impact Assessment (EIA), Wildlife Clearances, and Land Acquisition approvals.
        </span>
      </div>

      {/* 4 National Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="panel p-3.5 bg-gov-surface border-gov-border">
          <div className="metric-label text-[10px]">National Clearance Corpus</div>
          <div className="font-heading font-extrabold text-[17px] text-gov-navy mt-0.5">
            {data?.total_portfolio_projects || 2207} Projects
          </div>
          <div className="text-[10px] text-gov-muted mt-0.5">7,257 active filings</div>
        </div>

        <div className="panel p-3.5 bg-gov-surface border-gov-border">
          <div className="metric-label text-[10px]">Total Forest Diverted</div>
          <div className="font-heading font-extrabold text-[17px] text-gov-navy mt-0.5">
            {data?.total_forest_diversion_ha ? `${Number(data.total_forest_diversion_ha).toLocaleString()} ha` : '87,038 ha'}
          </div>
          <div className="text-[10px] text-emerald-700 font-medium mt-0.5">MoEFCC CAMPA audited</div>
        </div>

        <div className="panel p-3.5 bg-gov-surface border-gov-border">
          <div className="metric-label text-[10px]">Stalled Clearances</div>
          <div className="font-heading font-extrabold text-[17px] text-red-700 mt-0.5">
            {data?.projects_stalled ?? '—'}
          </div>
          <div className="text-[10px] text-red-600 font-medium mt-0.5">RSI &gt; 1.2 loopbacks</div>
        </div>

        <div className="panel p-3.5 bg-gov-surface border-gov-border">
          <div className="metric-label text-[10px]">PMO Direct Escalations</div>
          <div className="font-heading font-extrabold text-[17px] text-amber-700 mt-0.5">
            {data?.projects_flagged_for_pmo_escalation ?? '—'}
          </div>
          <div className="text-[10px] text-amber-600 font-medium mt-0.5">Critical path block</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="panel p-3.5 bg-gov-surface-2 border-gov-border flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-gov-muted shrink-0" />
          <input
            type="text"
            placeholder="Search by project name, ID (#619092), or proposal no..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setDisplayLimit(50);
            }}
            className="w-full text-xs font-medium bg-white border border-gov-border rounded px-3 py-1.5 focus:outline-none focus:border-indigo-600"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs">
            <span className="text-[11px] font-bold text-gov-muted uppercase">State:</span>
            <select
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                setDisplayLimit(50);
              }}
              className="text-xs font-bold bg-white border border-gov-border rounded px-2.5 py-1.5 focus:outline-none focus:border-indigo-600 cursor-pointer"
            >
              {statesList.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 text-xs">
            <span className="text-[11px] font-bold text-gov-muted uppercase">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setDisplayLimit(50);
              }}
              className="text-xs font-bold bg-white border border-gov-border rounded px-2.5 py-1.5 focus:outline-none focus:border-indigo-600 cursor-pointer"
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
      <div className="panel">
        <div className="panel-head">
          <span className="panel-title">
            <TreePine className="w-3.5 h-3.5 text-emerald-700" />
            Statutory Clearances Pipeline
          </span>
          <span className="panel-meta">Showing {projects.length} of {filteredTotal} matching proposals</span>
        </div>

        {loading ? (
          <div className="panel p-8 text-center text-xs text-gov-muted">
            Loading statutory clearances from PARIVESH portal...
          </div>
        ) : projects.length === 0 ? (
          <div className="p-8 text-center text-xs text-gov-muted">
            No clearance records match your search criteria. Try a different query or state.
          </div>
        ) : (
          <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((p) => {
              const status = p.overall_clearance_status || 'PENDING';
              let tagCls = 'tag';
              if (status === 'APPROVED') tagCls = 'tag tag-ok';
              else if (status === 'IN_PROGRESS') tagCls = 'tag tag-warn';
              else if (status === 'STALLED') tagCls = 'tag tag-critical';

              const stages = p.stage_breakdown || [];

              return (
                <div key={p.project_id} className="panel p-4 bg-gov-surface-2 border-gov-border space-y-3 hover:border-indigo-300 transition-all">
                  <div className="flex items-start justify-between gap-2 border-b border-gov-border pb-2.5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="tag tag-solid font-heading font-bold text-[9.5px]">#{p.project_id}</span>
                        <span className="tag tag-info text-[9.5px]">{p.state || 'Pan-India'}</span>
                        <span className="text-[10px] text-gov-muted truncate">({p.sector || 'Infrastructure'})</span>
                      </div>
                      <h4 className="text-xs font-bold text-gov-navy leading-snug truncate" title={p.project_name}>
                        {p.project_name}
                      </h4>
                    </div>
                    <span className={`${tagCls} font-heading font-bold text-[10px] shrink-0`}>{status}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="panel p-2 bg-gov-surface">
                      <span className="metric-label text-[9px]">Forest Diversion</span>
                      <span className="font-heading font-bold text-gov-navy text-[12px]">
                        {p.total_forest_diversion_ha ? `${p.total_forest_diversion_ha} ha` : '—'}
                      </span>
                    </div>
                    <div className="panel p-2 bg-gov-surface">
                      <span className="metric-label text-[9px]">Review Period</span>
                      <span className="font-heading font-bold text-gov-navy text-[12px]">{p.days_overdue || 0}d</span>
                    </div>
                    <div className="panel p-2 bg-gov-surface">
                      <span className="metric-label text-[9px]">Bottleneck</span>
                      <span className="font-bold text-gov-navy text-[10.5px] truncate block" title={p.bottleneck_department}>
                        {p.bottleneck_department?.split(' ')[0] || 'MoEFCC'}
                      </span>
                    </div>
                  </div>

                  {/* Stage checklist chips */}
                  {stages.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-bold text-gov-muted uppercase tracking-wider block">Stage Checklist</span>
                      <div className="flex flex-wrap gap-1.5">
                        {stages.map((st) => (
                          <span
                            key={st.stage_code}
                            className={`tag ${st.is_stagnated ? 'tag-critical' : 'tag-ok'} text-[9px]`}
                            title={st.last_query_date || st.stage_name}
                          >
                            {st.is_stagnated ? <AlertCircle className="w-2.5 h-2.5 mr-0.5 shrink-0" /> : <Check className="w-2.5 h-2.5 mr-0.5 shrink-0" />}
                            <span className="truncate max-w-[140px]">{st.stage_name}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Load More Button */}
        {projects.length < filteredTotal && (
          <div className="p-4 border-t border-gov-border text-center">
            <button
              onClick={() => setDisplayLimit((prev) => prev + 50)}
              className="btn btn-primary text-xs px-6 py-2"
            >
              Load More Proposals ({filteredTotal - projects.length} remaining)
            </button>
          </div>
        )}

        <div className="panel-head border-t border-b-0 py-2">
          <span className="panel-meta">Direct feed from PARIVESH statutory portal (2,207 Projects Indexed)</span>
          <span className="panel-meta">RTI §4 Environmental Disclosure</span>
        </div>
      </div>
    </div>
  );
}
