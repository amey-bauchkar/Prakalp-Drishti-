import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin, Eye, FileText, Landmark, Search, Filter, ShieldCheck,
  Calendar, Building2, TrendingUp, AlertTriangle, CheckCircle2,
  Clock, ArrowRight, ExternalLink, HelpCircle, Layers, Info, Check,
  TreePine, AlertCircle, Sparkles, ChevronRight, BarChart3
} from 'lucide-react';
import { Circle, CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet';

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
      id: 'pratibimb',
      label: 'Satellite Verification (PRATIBIMB)',
      desc: 'Dual-epoch optical before/after ground inspection (ESRI World Imagery)',
      icon: Eye
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
          <span>RTI ACT §4(1)(b) MANDATE</span>
          <span className="sep">/</span>
          <span>2,207 MONITORED PROJECTS</span>
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
              Citizens can inspect project baselines, capex progress, verified satellite ground-truth, and statutory environmental clearances.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="panel p-3 bg-white/[0.05] border-white/15 text-right">
              <div className="text-[9.5px] uppercase tracking-wider text-ink-300 font-bold">Monitored Portfolio</div>
              <div className="text-[19px] font-heading font-extrabold text-white leading-tight">₹31.4L Cr Capex</div>
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

      {/* ── Tab 3: Satellite Verification (PRATIBIMB) ── */}
      {activeTab === 'pratibimb' && (
        <PublicPratibimbTab
          projects={projects}
          activeProject={activeProject}
          selectProject={selectProject}
        />
      )}

      {/* ── Tab 4: Environmental & Statutory Clearance Status (ANUMATI) ── */}
      {activeTab === 'clearances' && (
        <PublicClearancesTab />
      )}
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════════════════
   TAB 1: PUBLIC METADATA & TRACKING (MAP + DIRECTORY)
   ═════════════════════════════════════════════════════════════════════════════ */
function PublicMetadataTab({
  projects,
  allProjects,
  activeProject,
  selectProject,
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
  const mapCenter = activeProject?.latitude && activeProject?.longitude
    ? [activeProject.latitude, activeProject.longitude]
    : [22.5937, 78.9629];

  const status = activeProject ? getProjectStatus(activeProject) : null;
  const progressPct = Math.min(100, Math.max(0, Number(activeProject?.progress_perc || 0)));

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
        <div className="lg:col-span-7 panel flex flex-col h-[560px]">
          <div className="panel-head">
            <span className="panel-title">
              <MapPin className="w-3.5 h-3.5 text-[#0060B6]" />
              Pan-India Geographic Distribution
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
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {/* `projects`, not `filteredProjects`. The latter is declared in
                  PublicDashboardView and is NOT in scope inside this component --
                  it arrives here as the `projects` prop, already filtered. Both
                  this map and the directory list below referenced the outer name,
                  so the entire Nagrik public portal threw
                  "ReferenceError: filteredProjects is not defined" on every render:
                  no markers, no directory, and the search/sector/state controls
                  had nothing left to update. */}
              {projects.slice(0, 180).map((p) => {
                // Number(), not a truthiness test: `!p.latitude` treats a
                // genuine 0.0 as missing and silently drops the marker.
                const lat = Number(p.latitude);
                const lon = Number(p.longitude);
                if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
                const pStat = getProjectStatus(p);
                const isSelected = String(p.project_id) === String(activeProject?.project_id);
                // 596 of 2,207 projects are placed at a national or state
                // centroid rather than at the works. Drawing them as solid pins
                // told the reader the site was known when it is not, so an
                // approximate location is drawn hollow and dashed and says so
                // in the popup.
                const approx = p.location_is_approximate === true;
                return (
                  <CircleMarker
                    key={p.project_id}
                    center={[lat, lon]}
                    radius={isSelected ? 8 : 4.5}
                    pathOptions={{
                      fillColor: pStat.color,
                      fillOpacity: approx ? 0.12 : (isSelected ? 0.95 : 0.7),
                      color: approx ? pStat.color : (isSelected ? '#071320' : '#ffffff'),
                      weight: isSelected ? 2.5 : 1,
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
                              ? 'state' : 'national'}{' '}centroid, not a surveyed
                            site coordinate.
                          </div>
                        )}
                        <button
                          onClick={() => selectProject(p.project_id)}
                          className="mt-1 w-full text-center py-1 bg-[#0060B6] text-white rounded-xs font-bold text-[10px]"
                        >
                          Select Project
                        </button>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          </div>

          <div className="panel-head border-t border-b-0 py-2">
            <span className="panel-meta">Click any map pin to activate project dossier</span>
            <span className="panel-meta">GeoNames 5-Tier Geocoded</span>
          </div>
        </div>

        {/* Right Column: Search & Filtered Project Directory */}
        <div className="lg:col-span-5 panel flex flex-col h-[560px]">
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
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="w-full text-xs bg-gov-surface border border-gov-border rounded-xs p-1.5 text-gov-navy focus:outline-none"
              >
                {sectors.slice(0, 15).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full text-xs bg-gov-surface border border-gov-border rounded-xs p-1.5 text-gov-navy focus:outline-none"
              >
                {states.slice(0, 20).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Scrollable list */}
          <div className="flex-1 overflow-y-auto divide-y divide-gov-border">
            {projects.slice(0, 60).map((p) => {
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
          </div>

          <div className="panel-head border-t border-b-0 py-2">
            <span className="panel-meta">{projects.length} Projects in Directory</span>
            <span className="panel-meta">MoSPI Central Sector</span>
          </div>
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
   TAB 3: PUBLIC SATELLITE VERIFICATION (PRATIBIMB)
   ═════════════════════════════════════════════════════════════════════════════ */
function PublicPratibimbTab({ projects, activeProject, selectProject }) {
  const [sliderPos, setSliderPos] = useState(50);
  const [imagery, setImagery] = useState(null);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!activeProject?.project_id) return undefined;
    let dead = false;
    setLoading(true);
    setPlan(null);
    setSliderPos(50);
    // The plan decides which of three panels this tab becomes. Fetched
    // alongside the imagery record so the tab never renders a swipe comparator
    // for a project that must not have one.
    Promise.all([
      fetch(`/api/satellite/${activeProject.project_id}`)
        .then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch(`/api/eo/viewport/${activeProject.project_id}`)
        .then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ]).then(([img, vp]) => {
      if (dead) return;
      setImagery(img);
      setPlan(vp);
      setLoading(false);
    });
    return () => { dead = true; };
  }, [activeProject]);

  if (!activeProject) return null;

  // Fail closed. Until the plan arrives — or if it never does — this tab
  // behaves as locator_only. 596 of 2,207 projects must never be shown a
  // satellite comparison, and defaulting to the richest panel would hand it to
  // exactly those.
  const mode = plan?.render_mode || (loading ? null : 'locator_only');
  const isCompound = mode === 'compound';
  const isCorridor = mode === 'corridor';
  const isLocatorOnly = mode === 'locator_only';

  // Served through the tiered endpoint. The old /satellite-imagery/ static
  // path was removed: it exposed 4,414 files anonymously with no redaction.
  const beforeImg = `/api/eo/tile/${activeProject.project_id}/BEFORE`;
  const afterImg = `/api/eo/tile/${activeProject.project_id}/AFTER`;
  const gsd = plan?.gsd_m_per_px ?? null;
  const isSubMetre = typeof gsd === 'number' && gsd > 0 && gsd < 1.0;
  const status = getProjectStatus(activeProject);

  return (
    <div className="space-y-6">
      {/* RTI Inspection Header */}
      <div className="panel panel-accent">
        <div className="panel-head">
          <div className="flex items-center gap-2">
            <Eye className="w-3.5 h-3.5 text-gov-accent" />
            <span className="panel-title">PRATIBIMB · Public Earth Observation Verification</span>
          </div>
          <span className="panel-meta">RTI Citizens' Right to Inspect Public Works</span>
        </div>

        <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="tag tag-solid font-heading font-bold">#{activeProject.project_id}</span>
              {/* Was "SENTINEL-2 OPTICAL PASS". This imagery is ESRI ArcGIS
                  World Imagery and its Wayback archive, not Sentinel-2 — a
                  different sensor, a different resolution and a different
                  revisit cadence. Naming the wrong satellite on a public
                  transparency page is a provenance error, not a label choice. */}
              <span className="tag tag-info font-heading font-bold">
                ESRI WORLD IMAGERY · WAYBACK ARCHIVE
              </span>
              {!isLocatorOnly && gsd != null && (
                <span className={`tag font-heading font-bold ${isSubMetre ? 'tag-ok' : 'tag-info'}`}>
                  {isSubMetre ? `SUB-METRE · ${gsd} m/px` : `${gsd} m/px`}
                </span>
              )}
              {isLocatorOnly && (
                <span className="tag tag-warn font-heading font-bold">
                  ADMINISTRATIVE CENTROID
                </span>
              )}
              <span className={`tag ${status.tagClass} font-heading font-bold`}>{status.label}</span>
            </div>
            <h3 className="font-heading font-extrabold text-base text-gov-navy leading-tight">
              {activeProject.project_name}
            </h3>
            <p className="text-xs text-gov-muted mt-1 font-sans">
              {isLocatorOnly
                ? 'No site-level coordinate is on record for this project, so no satellite comparison is published. An administrative locator is shown below with the reason.'
                : isCorridor
                  ? 'Dual-epoch optical imagery of one strip of a linear alignment. One frame covers a fraction of the route; chainage packages index the remainder.'
                  : 'Dual-epoch optical imagery showing physical ground change between the baseline and the most recent pass held for this site.'}
            </p>
          </div>

          <div className="panel p-3 bg-gov-surface-2 shrink-0 text-right">
            <span className="text-[9.5px] uppercase tracking-wider text-gov-muted block font-bold">Reported Progress</span>
            <span className="text-2xl font-heading font-extrabold text-gov-navy">{activeProject.progress_perc}%</span>
          </div>
        </div>
      </div>

      {/* ── LOCATOR ONLY: RTI §4 disclosure, no imagery ──────────────────── */}
      {isLocatorOnly && (
        <div className="panel overflow-hidden">
          <div className="panel-head">
            <span className="panel-title">Administrative Locator</span>
            <span className="panel-meta">RTI §4(1)(b) proactive disclosure</span>
          </div>

          <div className="p-4 sm:p-5">
            <div className="note note-warn flex items-start gap-2.5 mb-4" role="status">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="text-[11.5px] leading-relaxed font-sans">
                <strong className="block mb-1 font-heading tracking-wide text-[11px]">
                  ADMINISTRATIVE CENTROID · SURVEYED SITE PLOT AWAITED
                </strong>
                The coordinate held for this project locates its{' '}
                {String(plan?.geocode_precision || '').includes('STATE') ? 'State' : 'administrative region'}
                {' '}rather than the works. Publishing satellite imagery framed on
                it would show unrelated ground — and because that imagery would be
                genuine and correctly dated, it would appear exactly as
                authoritative as a true site view. This Ministry therefore
                withholds the comparison rather than publish a picture of the
                wrong place.
                <span className="block mt-1.5">
                  Cadastral site boundaries for legacy sanctions are being
                  digitised progressively. Satellite verification for this project
                  will be published once a surveyed plot boundary is on record.
                </span>
              </div>
            </div>

            {plan?.centre?.[0] != null && plan?.centre?.[1] != null && (
              <div className="rounded-xs overflow-hidden border border-gov-border">
                <MapContainer
                  center={[plan.centre[0], plan.centre[1]]}
                  zoom={6}
                  scrollWheelZoom={false}
                  style={{ height: 360, width: '100%' }}
                  aria-label="Administrative locator showing the recorded centroid and the area within which the works lie"
                >
                  <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Circle
                    center={[plan.centre[0], plan.centre[1]]}
                    radius={plan.geocode_error_radius_m || 100000}
                    pathOptions={{ color: '#B45309', fillColor: '#F59E0B',
                                   fillOpacity: 0.10, weight: 1.5, dashArray: '4 4' }}
                  />
                </MapContainer>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-gov-border border border-gov-border rounded-xs overflow-hidden mt-4">
              {[
                ['Coordinate provenance', plan?.geocode_precision || 'Not recorded'],
                ['Area of uncertainty', plan?.geocode_error_radius_m != null
                  ? `${Number(plan.geocode_error_radius_m).toLocaleString('en-IN')} m radius` : '—'],
                ['Satellite verdict', 'Withheld'],
              ].map(([k, v]) => (
                <div key={k} className="bg-white p-3">
                  <span className="text-[9px] font-bold text-gov-muted uppercase tracking-wide block font-heading">{k}</span>
                  <span className="text-[12px] font-extrabold text-gov-navy font-heading">{v}</span>
                </div>
              ))}
            </div>

            <p className="text-[10.5px] text-gov-muted mt-3 leading-relaxed font-sans">
              The reported progress figure above is unaffected by this and is
              disclosed in full. What is withheld is the imagery, not the numbers:
              a citizen is entitled to the finding, and to know when the Ministry
              cannot support one from pixels.
            </p>
          </div>
        </div>
      )}

      {/* ── CORRIDOR: chainage overview above the strip ──────────────────── */}
      {isCorridor && (
        <div className="panel overflow-hidden">
          <div className="panel-head">
            <span className="panel-title">Corridor Alignment · Chainage Overview</span>
            <span className="panel-meta">
              {plan?.frame_covers_m != null
                ? `strip below covers ${(plan.frame_covers_m / 1000).toFixed(2)} km`
                : 'linear alignment'}
            </span>
          </div>
          <div className="p-4 sm:p-5">
            {plan?.packages?.length ? (
              <>
                <div className="flex flex-wrap gap-1.5" role="list">
                  {plan.packages.map((pk) => (
                    <span key={pk.package} role="listitem"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xs text-[10.5px] font-bold border border-gov-border bg-gov-surface text-gov-navy font-heading">
                      Package {pk.package}: Km {pk.chainage_km[0]}–{pk.chainage_km[1]}
                    </span>
                  ))}
                </div>
                <p className="text-[10.5px] text-gov-muted mt-3 leading-relaxed font-sans">
                  This alignment is divided into {plan.packages.length} chainage
                  packages. The comparison below shows one strip near the recorded
                  point — roughly{' '}
                  <strong className="font-heading text-gov-navy">
                    {plan.frame_covers_m != null && plan.packages.length
                      ? ((plan.frame_covers_m / 1000) /
                         (plan.packages[plan.packages.length - 1].chainage_km[1] || 1) * 100).toFixed(1)
                      : '—'}%
                  </strong>{' '}
                  of the route. Per-package imagery requires the surveyed
                  alignment, which is not yet published for this project.
                </p>
              </>
            ) : (
              <p className="text-[10.5px] text-gov-muted leading-relaxed font-sans">
                The sanctioned route length is not recorded for this project, so
                chainage packages cannot be listed. The comparison below shows the
                alignment near the recorded point only, and should not be read as
                representing the whole route.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Clean Dual-Epoch Before / After Swipe */}
      {!isLocatorOnly && (
      <div className="panel space-y-0 overflow-hidden">
        <div className="panel-head">
          <span className="panel-title">Interactive Epoch Comparison</span>
          <span className="panel-meta">Drag handle to wipe between epochs</span>
        </div>

        <div className="p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-gov-muted font-mono pb-1 border-b border-gov-border">
            <span>👈 EPOCH 1: Baseline (Pre-Construction)</span>
            <span>EPOCH 2: Latest Satellite Pass 👉</span>
          </div>

          <div className="relative w-full h-[440px] sm:h-[480px] rounded-xs overflow-hidden border border-gov-border select-none bg-slate-950">
            {/* After Image (Full background) */}
            <img
              src={afterImg}
              alt="Latest Satellite Pass"
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => { e.target.src = '/logos/satellite_placeholder.jpg'; }}
            />

            {/* Before Image (Clipped with slider) */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${sliderPos}%` }}
            >
              <img
                src={beforeImg}
                alt="Baseline Satellite Epoch"
                className="absolute inset-0 w-full h-full object-cover max-w-none"
                style={{ width: '100%', height: '100%' }}
                onError={(e) => { e.target.src = '/logos/satellite_placeholder.jpg'; }}
              />
            </div>

            {/* Slider Line & Handle */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white shadow-2xl z-20 flex items-center justify-center pointer-events-none"
              style={{ left: `${sliderPos}%` }}
            >
              <div className="w-7 h-7 rounded-full bg-white text-gov-navy shadow-md border-2 border-[#0060B6] flex items-center justify-center text-[10px] font-black">
                ↔
              </div>
            </div>

            {/* Interactive Range Input Overlay */}
            <input
              type="range"
              min="0"
              max="100"
              value={sliderPos}
              onChange={(e) => setSliderPos(Number(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
              aria-label="Satellite comparison slider"
            />

            {/* Corner Watermarks */}
            <div className="absolute bottom-3 left-3 z-10 bg-black/75 text-white text-[10.5px] font-heading font-bold px-2.5 py-1 rounded-xs backdrop-blur-xs border border-white/15">
              EPOCH 1: Baseline Sanction
            </div>
            <div className="absolute bottom-3 right-3 z-10 bg-black/75 text-white text-[10.5px] font-heading font-bold px-2.5 py-1 rounded-xs backdrop-blur-xs border border-white/15">
              EPOCH 2: Latest Pass
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gov-muted pt-1">
            <div className="flex items-center gap-1.5">
              {/* Was "Optical sub-meter resolution imagery corroborated against
                  project coordinates" — untrue twice over. Measured, the finest
                  framing across all 285 compound projects is 1.18 m/px and most
                  sit at 2-9 m/px, because zoom is capped so the frame contains
                  the geocode error. And "corroborated against project
                  coordinates" asserts a verification that the coordinate's own
                  provenance does not support. Both now state what was measured. */}
              {isSubMetre
                ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                : <Eye className="w-3.5 h-3.5 text-gov-muted" aria-hidden="true" />}
              <span className="font-sans">
                {gsd != null
                  ? <>Optical imagery at <strong className="font-heading text-gov-navy">{gsd} m/px</strong>
                      {isSubMetre ? ' (sub-metre).' : '.'}{' '}
                      {plan?.zoom_limited_by === 'geocode'
                        ? 'Framed wide enough to contain this coordinate’s uncertainty.'
                        : 'Framed to this facility class.'}
                    </>
                  : 'Optical imagery at the resolution held for this site.'}
              </span>
            </div>
            <span className="font-heading font-semibold text-[11.5px]">
              {activeProject.location_is_approximate
                ? <>Approximate area: {Number(activeProject.latitude).toFixed(1)}°N,{' '}
                    {Number(activeProject.longitude).toFixed(1)}°E{' '}
                    <span className="text-amber-700">
                      — {activeProject.geocode_precision || 'low-confidence geocode'};
                      not a surveyed site coordinate
                    </span>
                  </>
                : <>Site Coordinates: {Number(activeProject.latitude).toFixed(4)}°N,{' '}
                    {Number(activeProject.longitude).toFixed(4)}°E</>}
            </span>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════════════════
   TAB 4: ENVIRONMENTAL & STATUTORY CLEARANCE STATUS (ANUMATI)
   ═════════════════════════════════════════════════════════════════════════════ */
function PublicClearancesTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/tanmay/anumati/clearances')
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="panel p-8 text-center text-xs text-gov-muted">
        Loading statutory clearances from PARIVESH portal...
      </div>
    );
  }

  const projects = data?.projects || [];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="note note-ok">
        <Landmark className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
        <span>
          <strong>PARIVESH Statutory Clearance Transparency.</strong> Real-time status tracking for Forest Stage-I/II, Environmental Impact Assessment (EIA), Wildlife Clearances, and Land Acquisition approvals.
        </span>
      </div>

      {/* Clean Status Card Grid / List instead of dense plain table */}
      <div className="panel">
        <div className="panel-head">
          <span className="panel-title">
            <TreePine className="w-3.5 h-3.5 text-emerald-700" />
            Statutory Clearances Pipeline
          </span>
          <span className="panel-meta">{projects.length} Tracked Proposals</span>
        </div>

        <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((p) => {
            const status = p.overall_clearance_status || 'PENDING';
            let tagCls = 'tag';
            if (status === 'APPROVED') tagCls = 'tag tag-ok';
            else if (status === 'IN_PROGRESS') tagCls = 'tag tag-warn';
            else if (status === 'STALLED') tagCls = 'tag tag-critical';

            const stages = p.stage_breakdown || [];

            return (
              <div key={p.project_id} className="panel p-4 bg-gov-surface-2 border-gov-border space-y-3">
                <div className="flex items-start justify-between gap-2 border-b border-gov-border pb-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="tag tag-solid font-heading font-bold text-[9.5px]">#{p.project_id}</span>
                      <span className="tag tag-info text-[9.5px]">{p.state || 'Pan-India'}</span>
                    </div>
                    <h4 className="text-xs font-bold text-gov-navy leading-snug truncate">{p.project_name}</h4>
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
                    <span className="font-bold text-gov-navy text-[10.5px] truncate block">
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
                        >
                          {st.is_stagnated ? <AlertCircle className="w-2.5 h-2.5 mr-0.5" /> : <Check className="w-2.5 h-2.5 mr-0.5" />}
                          {st.stage_name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="panel-head border-t border-b-0 py-2">
          <span className="panel-meta">Direct feed from PARIVESH statutory portal</span>
          <span className="panel-meta">RTI §4 Environmental Disclosure</span>
        </div>
      </div>
    </div>
  );
}
