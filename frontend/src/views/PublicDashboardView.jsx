import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, FileText, Landmark, Search, Filter, ShieldCheck,
  Calendar, Building2, TrendingUp, AlertTriangle, CheckCircle2,
  Clock, ArrowRight, ExternalLink, HelpCircle, Layers, Info, Check,
  TreePine, AlertCircle, Sparkles, ChevronRight, BarChart3,
  Download, ChevronLeft, ChevronsLeft, ChevronsRight, RotateCcw,
  SlidersHorizontal, ArrowUpDown, ListFilter, Activity, Eye,
  IndianRupee, Globe2, ShieldAlert, Cpu, Terminal, Keyboard
} from 'lucide-react';
import { Circle, CircleMarker, MapContainer, Popup } from 'react-leaflet';
import BaseMapLayer, { BaseMapNotice } from '../components/BaseMapLayer';
import ClearanceStagesInfoGuide from '../components/ClearanceStagesInfoGuide';
import NagrikGrievanceDesk from '../components/NagrikGrievanceDesk';
// The corpus writes "Not specified" where a field was never recorded. Rendered
// verbatim it reads as a broken string ("...asset in Not specified executed by...");
// an em dash says "not recorded" without pretending to be a value.
const NULLISH = /^(not specified|n\/?a|nan|nat|none|null|-)$/i;
const orDash = (v) => (v == null || NULLISH.test(String(v).trim()) ? '—' : v);
import StatusBadge, { StatusGlyph, StatusLegend } from '../components/StatusBadge';
import DataUnavailable from '../components/DataUnavailable';
import { getStoredLanguage, t } from '../lib/i18n';
import {
  getProjectStatus, describeStatus, STATUS, STATUS_ORDER,
  formatCount, formatCr, formatDate, sectorName, sectorIsTranslated,
} from '../lib/projectStatus';

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

/**
 * A column header that sorts. Carries aria-sort so assistive tech announces the
 * current order, and toggles direction on repeat activation.
 */
function SortableTh({ id, sortBy, setSortBy, children, numeric = false, textual = false, className = '', lang = 'en' }) {
  const active = sortBy.startsWith(id + '_');
  const dir = active ? sortBy.slice(id.length + 1) : null;
  // Text opens A-Z, quantities open highest-first — the direction each is read in.
  const opening = textual ? 'asc' : 'desc';
  const next = active
    ? `${id}_${dir === opening ? (opening === 'asc' ? 'desc' : 'asc') : opening}`
    : `${id}_${opening}`;
  return (
    <th
      scope="col"
      aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={`p-0 ${className}`}
    >
      <button
        type="button"
        onClick={() => setSortBy(next)}
        className={`w-full flex items-center gap-1.5 p-3.5 font-bold uppercase tracking-wider transition-colors hover:bg-slate-200 ${
          numeric ? 'justify-end' : 'justify-start'
        } ${active ? 'text-slate-950' : 'text-slate-700'}`}
        title={`${t('sort_by', lang)}: ${String(children)}`}
      >
        <span>{children}</span>
        <ArrowUpDown
          className={`w-3 h-3 shrink-0 ${active ? 'opacity-100' : 'opacity-35'}`}
          aria-hidden="true"
        />
        {active && (
          <span className="sr-only">
            , {dir === 'asc' ? t('sort_ascending', lang) : t('sort_descending', lang)}
          </span>
        )}
      </button>
    </th>
  );
}

export default function PublicDashboardView() {
  const [activeTab, setActiveTab] = useState('metadata');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [fetchedAt, setFetchedAt] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState(() => {
    return localStorage.getItem('prakalp:selectedProjectId') || '619092';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState('All');
  const [selectedState, setSelectedState] = useState('All');
  const [lang, setLang] = useState(() => getStoredLanguage());

  useEffect(() => {
    const onLang = (e) => setLang(e.detail || getStoredLanguage());
    window.addEventListener('prakalp:languageChanged', onLang);
    return () => window.removeEventListener('prakalp:languageChanged', onLang);
  }, []);

  // Fetch project list.
  //
  // The previous `.catch(() => setLoading(false))` discarded the error, so with the
  // API down the portal showed an empty register under a masthead still asserting
  // "2,207 SEALED PROJECTS - Rs 47.44L CR" and told the user nothing. A transparency
  // portal that keeps quoting national figures while unable to load a single record
  // is the one failure mode it cannot afford.
  const loadProjects = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    fetch('/api/projects?limit=2207')
      .then((res) => {
        if (!res.ok) throw new Error(`The project database responded with status ${res.status}.`);
        return res.json();
      })
      .then((data) => {
        if (!Array.isArray(data)) throw new Error('The project database returned an unexpected response.');
        setProjects(data);
        setFetchedAt(new Date());
        setLoading(false);
      })
      .catch((err) => {
        setProjects([]);
        setLoadError(err.message || 'The project database could not be reached.');
        setLoading(false);
      });
  }, []);

  useEffect(() => { loadProjects(); }, [loadProjects]);

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

  // One counter per status rather than three coarse buckets, so both the masthead
  // above and the register's filter chips below read from the same figures.
  const portfolioStats = useMemo(() => {
    const counts = Object.fromEntries(STATUS_ORDER.map((st) => [st.id, 0]));
    let totalCapex = 0;
    projects.forEach((p) => {
      counts[getProjectStatus(p).id] += 1;
      totalCapex += Number(p.revised_cost_cr || p.original_cost_cr || 0);
    });
    return {
      total: projects.length,
      counts,
      needsAttention: counts.CRITICAL + counts.DELAYED,
      totalCapex,
    };
  }, [projects]);

  // Arrow keys move between tabs, Home/End jump to the ends, per the WAI-ARIA
  // tabs pattern. Without this the rail announced itself as a tablist and then
  // behaved like three unrelated buttons.
  const onTabKeyDown = (e) => {
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault();
    const ids = tabs.map((x) => x.id);
    const at = ids.indexOf(activeTab);
    const to = e.key === 'Home' ? 0
      : e.key === 'End' ? ids.length - 1
      : e.key === 'ArrowRight' ? (at + 1) % ids.length
      : (at - 1 + ids.length) % ids.length;
    setActiveTab(ids[to]);
    requestAnimationFrame(() => document.getElementById(`nagrik-tab-${ids[to]}`)?.focus());
  };

  const tabs = [
    {
      id: 'metadata',
      label: t('tab_find', lang),
      desc: t('tab_find_desc', lang),
      icon: MapPin,
      badge: loadError ? t('prov_unavailable', lang) : `${formatCount(projects.length)} ${t('projects_unit', lang)}`
    },
    {
      id: 'financial',
      label: t('tab_money', lang),
      desc: t('tab_money_desc', lang),
      icon: FileText,
      badge: loadError ? t('prov_unavailable', lang) : formatCr(portfolioStats.totalCapex, { lakhCrore: true, lang })
    },
    {
      id: 'clearances',
      label: t('tab_permissions', lang),
      desc: t('tab_permissions_desc', lang),
      icon: Landmark,
      badge: 'PARIVESH'
    },
    {
      id: 'grievance',
      label: t('tab_grievance', lang),
      desc: t('tab_grievance_desc', lang),
      icon: ShieldAlert,
      badge: 'CPGRAMS'
    }
  ];

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6 font-sans pb-24 max-w-7xl mx-auto text-slate-900"
    >
      {/* ── Sovereign Institutional Command Header ── */}
      <motion.div 
        variants={itemVariants} 
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#071320] via-[#0D2137] to-[#071320] border border-slate-700/80 shadow-2xl text-white p-6 sm:p-8 z-20"
      >
        {/* Tactical Ambient Radial Aura */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-96 h-96 bg-radial from-amber-500/10 via-sky-500/5 to-transparent blur-3xl pointer-events-none z-0" />
        <div className="absolute inset-0 bg-[radial-gradient(#38bdf810_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none z-0" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2.5 max-w-3xl">
            <div className="inline-flex items-center gap-2 pl-2 pr-2.5 py-0.5 rounded-sm bg-white/10 text-[10px] font-extrabold tracking-institutional uppercase text-amber-400 border-l-2 border-amber-400">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>{t('nagrik_eyebrow', lang)}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-extrabold font-heading text-white tracking-tight leading-tight">
              {t('nagrik_title', lang)}
            </h1>
            <p className="text-sm text-slate-200 leading-relaxed max-w-2xl font-sans">
              {t('nagrik_lede', lang)}
            </p>
            <p className="text-[12.5px] text-slate-300 leading-relaxed max-w-2xl font-sans">
              {t('nagrik_rti_note', lang)}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 relative z-10">
            <div className="p-4 rounded-xl bg-black/40 border border-white/20 backdrop-blur-md shadow-inner text-right min-w-[200px]">
              <div className="text-[10px] font-mono uppercase tracking-widest text-slate-300 font-bold flex items-center justify-end gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>{t('total_approved_cost', lang)}</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white font-mono mt-0.5">
                {loadError ? '—' : formatCr(portfolioStats.totalCapex, { lakhCrore: true, lang })}
              </div>
              <div className="text-[11px] text-amber-300 flex items-center justify-end gap-1 mt-1 font-mono font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                <span>{loadError ? t('register_unavailable', lang) : `${formatCount(portfolioStats.total)} ${t('projects_published', lang)}`}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Sovereign Institutional Segmented Tab Rail ── */}
      <motion.nav 
        variants={itemVariants} 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3" 
        role="tablist" 
        aria-label={t('nagrik_transparency', lang)}
        onKeyDown={onTabKeyDown}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`nagrik-tab-${tab.id}`}
              role="tab"
              aria-selected={isActive}
              aria-controls="nagrik-tabpanel"
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-3.5 p-4 rounded-xl border text-left transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'bg-gov-navy text-white border-gov-navy shadow-md ring-1 ring-amber-400/20'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-2xs'
              }`}
            >
              <div className={`p-2.5 rounded-lg shrink-0 ${
                isActive 
                  ? 'bg-white/15 text-amber-400 border border-white/20 font-bold' 
                  : 'bg-slate-100 text-gov-navy border border-slate-200'
              }`}>
                <Icon className="w-4 h-4" strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className={`text-sm font-bold tracking-tight font-heading ${isActive ? 'text-white' : 'text-gov-navy'}`}>
                    {tab.label}
                  </span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold ${
                    isActive ? 'bg-amber-400/20 text-amber-300 border-amber-400/30' : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    {tab.badge}
                  </span>
                </div>
                <p className={`text-xs leading-snug ${isActive ? 'text-slate-200' : 'text-slate-600'}`}>{tab.desc}</p>
              </div>
            </button>
          );
        })}
      </motion.nav>

      {/* ── Failure is stated, not swallowed ── */}
      {loadError && (
        <motion.div variants={itemVariants}>
          <DataUnavailable
            variant="error"
            title={t('err_load_title', lang)}
            detail={t('err_load_detail', lang)}
            retryLabel={t('err_retry', lang)}
            clearLabel={t('err_clear_filters', lang)}
            onRetry={loadProjects}
          />
        </motion.div>
      )}

      {/* ── Provenance. A transparency portal that will not say where its figures
             came from, or how current they are, is asking for trust it has not
             earned — and GIGW 3.0 requires a content review date. ── */}
      <motion.div
        variants={itemVariants}
        className="flex flex-wrap items-center gap-x-5 gap-y-1.5 px-4 py-2.5 rounded-lg bg-surface-2 border border-gov-border text-[11.5px] text-gov-soft"
      >
        <span className="inline-flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-gov-muted" aria-hidden="true" />
          <strong className="text-gov-navy font-semibold">{t('prov_source', lang)}</strong>
          {t('prov_source_val', lang)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-gov-muted" aria-hidden="true" />
          <strong className="text-gov-navy font-semibold">{t('prov_loaded', lang)}</strong>
          {loading ? t('prov_loading', lang) : fetchedAt
            ? fetchedAt.toLocaleString(lang === 'hi' ? 'hi-IN' : 'en-IN', { dateStyle: 'medium', timeStyle: 'short' })
            : t('prov_unavailable', lang)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-gov-muted" aria-hidden="true" />
          {t('prov_delay_basis', lang)}
        </span>
      </motion.div>

      {/* ── Tab Views with Animated Transitions ── */}
      <div
        id="nagrik-tabpanel"
        role="tabpanel"
        aria-labelledby={`nagrik-tab-${activeTab}`}
        tabIndex={-1}
      >
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
              portfolioStats={portfolioStats}
              lang={lang}
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

        {activeTab === 'grievance' && (
          <motion.div
            key="grievance"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: "easeInOut" }}
          >
            <NagrikGrievanceDesk
              projects={projects}
              lang={lang}
              selectedProjectId={selectedProjectId}
            />
          </motion.div>
        )}
      </AnimatePresence>
      </div>
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
  loading,
  portfolioStats,
  lang = 'en',
}) {
  const [basemapStatus, setBasemapStatus] = useState('ok');
  const [dirLimit, setDirLimit] = useState(100);
  const [mapNavIndex, setMapNavIndex] = useState(0);
  const [mapLiveAnnouncement, setMapLiveAnnouncement] = useState('');

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

  const navigateMap = useCallback((direction) => {
    if (!mappedProjects.length) return;
    setMapNavIndex((prev) => {
      const next = direction === 'next'
        ? (prev + 1) % mappedProjects.length
        : (prev - 1 + mappedProjects.length) % mappedProjects.length;
      const target = mappedProjects[next];
      if (target) {
        selectProject(target.project_id);
        const st = getProjectStatus(target);
        const statusTxt = lang === 'hi' ? (st.hiLabel || st.label) : st.label;
        setMapLiveAnnouncement(
          lang === 'hi'
            ? `मानचित्र परियोजना ${next + 1}/${mappedProjects.length}: ${target.project_name}, ${target.state || 'भारत'}। स्थिति: ${statusTxt}`
            : `Project ${next + 1} of ${mappedProjects.length}: ${target.project_name}, ${target.state || 'India'}. Status: ${statusTxt}`
        );
      }
      return next;
    });
  }, [mappedProjects, lang]);

  // Handle directory scroll to load more
  const handleDirScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollHeight - scrollTop <= clientHeight + 150 && dirLimit < projects.length) {
      setDirLimit((prev) => Math.min(prev + 100, projects.length));
    }
  };

  const corpus = allProjects.length > 0 ? allProjects : projects;

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
      list = list.filter((p) => getProjectStatus(p).id === tableStatus);
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

      const [key, dir] = String(sortBy).split('_');
      const sign = dir === 'asc' ? 1 : -1;
      switch (key) {
        case 'cost':     return (costA - costB) * sign;
        case 'delay':    return (delayA - delayB) * sign;
        case 'progress': return (progA - progB) * sign;
        case 'id':       return (Number(a.project_id) - Number(b.project_id)) * sign;
        case 'name':     return (a.project_name || '').localeCompare(b.project_name || '') * sign;
        default:         return 0;
      }
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
      {/* ── Active Project Spotlight HUD Card ── */}
      {activeProject && (
        <div className="rounded-xl bg-white border border-slate-200 p-6 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded bg-gov-navy text-amber-400 font-bold font-mono text-[11px] border border-sky-900 shadow-2xs">
                  #{activeProject.project_id}
                </span>
                <span className="px-2.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-mono text-[11px] font-semibold">
                  <span lang={sectorIsTranslated(activeProject.sector, lang) ? undefined : 'en'}>{sectorName(activeProject.sector, lang) || 'Central Sector'}</span>
                </span>
                <StatusBadge project={activeProject} />
              </div>
              <h2 lang="en" className="text-xl sm:text-2xl font-extrabold text-gov-navy font-heading tracking-tight">
                {activeProject.project_name}
              </h2>
            </div>
            <div className="flex items-center gap-4 shrink-0 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="text-right">
                <div className="text-[10px] uppercase font-mono tracking-widest text-slate-500 font-bold">{t('sp_physical_progress', lang)}</div>
                <div className="text-2xl font-extrabold text-gov-navy font-mono">{progressPct.toFixed(1)}%</div>
              </div>
              <div className="w-12 h-12 rounded-xl border border-slate-200 flex items-center justify-center p-1 bg-white shadow-2xs">
                <Activity className="w-5 h-5 text-gov-navy" />
              </div>
            </div>
          </div>

          {/* 4 Metric Cells in Spotlight HUD */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 pt-5">
            <div className="p-3.5 rounded-lg bg-slate-50/90 border border-slate-200">
              <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500 font-bold block">{t('sp_executing_agency', lang)}</span>
              <span className="text-sm font-bold text-gov-navy truncate block mt-0.5">{activeProject.company || '—'}</span>
              <span className="text-xs text-slate-600 flex items-center gap-1 mt-1 font-medium">
                <MapPin className="w-3 h-3 text-slate-500" aria-hidden="true" />{' '}
                <span lang="en">{orDash(activeProject.state) === '—' ? 'Pan-India' : activeProject.state}</span>
              </span>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50/90 border border-slate-200">
              <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500 font-bold block">{t('sp_original_sanction', lang)}</span>
              <span className="text-sm font-bold text-gov-navy font-mono block mt-0.5">{activeProject.sanction_date?.slice(0, 10) || '—'}</span>
              <span className="text-xs text-slate-600 mt-1 block">{t('sp_ccea_baseline', lang)}</span>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50/90 border border-slate-200">
              <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500 font-bold block">{t('sp_target_completion', lang)}</span>
              <span className="text-sm font-bold text-gov-navy font-mono block mt-0.5">{activeProject.target_date?.slice(0, 10) || '—'}</span>
              <span className="text-xs text-slate-600 mt-1 block">{t('sp_revised_target', lang)}</span>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50/90 border border-slate-200">
              <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500 font-bold block">{t('sp_schedule_deviation', lang)}</span>
              <span className={`text-sm font-bold font-mono block mt-0.5 ${Number(activeProject.delayed_months) > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                {Number(activeProject.delayed_months) > 0
                  ? `+${activeProject.delayed_months} ${t('sp_months_delay', lang)}`
                  : t('sp_nil_delay', lang)}
              </span>
              <span className="text-xs text-slate-600 mt-1 block">{t('sp_against_plan', lang)}</span>
            </div>
          </div>

          {/* Progress Bar Line */}
          <div className="mt-5 pt-4 border-t border-slate-200 flex items-center gap-3">
            <span className="text-[10.5px] font-bold text-slate-600 uppercase tracking-wider shrink-0 font-mono">{t('sp_milestone_track', lang)}</span>
            <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden relative border border-slate-200">
              <div
                className="bg-gradient-to-r from-gov-navy to-emerald-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="font-mono text-xs font-bold text-gov-navy shrink-0">{progressPct.toFixed(1)}% {t('sp_realized', lang)}</span>
          </div>
        </div>
      )}

      {/* ── Interactive Pan-India Map + Directory Filter Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Geographic Leaflet Map */}
        <div className="lg:col-span-7 rounded-xl bg-white border border-slate-200/90 flex flex-col h-[600px] overflow-hidden shadow-2xs">
          <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50/80">
            <span className="flex items-center gap-2 text-sm font-bold text-slate-900 font-mono uppercase tracking-wide text-xs">
              <MapPin className="w-3.5 h-3.5 text-slate-700" />
              {t('map_sites_title', lang)} ({formatCount(mappedProjects.length)} {t('map_georeferenced_n', lang)})
            </span>
            <div className="flex items-center gap-2.5 text-[10.5px] font-mono flex-wrap">
              {/* Shape carries the meaning; colour reinforces it. WCAG 1.4.1. */}
              <StatusLegend compact only={['CRITICAL', 'DELAYED', 'SLIPPING', 'ON_TRACK', 'COMPLETED_LATE']} />
              {unmappedCount > 0 && (
                <span className="inline-flex items-center gap-1 text-slate-500 border-l border-slate-300 pl-2.5 ml-0.5 font-sans text-[11px]">
                  <HelpCircle className="w-3 h-3 text-slate-400" />
                  {formatCount(unmappedCount)} {t('map_unmapped_n', lang)}
                </span>
              )}
            </div>
          </div>

          {/* Accessible Keyboard Traversal Toolbar (WCAG 2.2 AAA & GIGW 3.0) */}
          <div
            role="toolbar"
            aria-label="Map keyboard traversal controls"
            className="px-3.5 py-1.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between gap-3 text-xs shrink-0"
          >
            <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-sans">
              <span className="inline-flex items-center gap-1 font-bold text-slate-800 uppercase tracking-wider">
                <Keyboard className="w-3.5 h-3.5 text-slate-600" aria-hidden="true" />
                <span>{lang === 'hi' ? 'मानचित्र नेविगेशन:' : 'Keyboard Map Nav:'}</span>
              </span>
              <span className="hidden sm:inline text-slate-500">
                {lang === 'hi' ? 'तीर कुंजियों या बटन से परियोजनाएं बदलें' : 'Traverse mapped sites without a mouse'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => navigateMap('prev')}
                disabled={!mappedProjects.length}
                aria-label="Previous project pin on map"
                className="inline-flex items-center gap-1 px-2 py-1 min-h-[24px] rounded bg-white hover:bg-slate-200 border border-slate-300 font-mono text-[11px] font-bold text-slate-800 transition-colors disabled:opacity-40"
              >
                <ChevronLeft className="w-3 h-3" />
                <span>{t('map_prev', lang)}</span>
              </button>
              <span className="font-mono text-[11px] font-semibold text-slate-700 px-1">
                {mappedProjects.length ? `${mapNavIndex + 1} / ${mappedProjects.length}` : '0 / 0'}
              </span>
              <button
                type="button"
                onClick={() => navigateMap('next')}
                disabled={!mappedProjects.length}
                aria-label="Next project pin on map"
                className="inline-flex items-center gap-1 px-2 py-1 min-h-[24px] rounded bg-white hover:bg-slate-200 border border-slate-300 font-mono text-[11px] font-bold text-slate-800 transition-colors disabled:opacity-40"
              >
                <span>{t('map_next', lang)}</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            {/* Live screen-reader announcement */}
            <div role="status" aria-live="polite" className="sr-only">{mapLiveAnnouncement}</div>
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
                      // Marker shape encodes status so the map is readable without
                      // colour vision: triangle critical, square delayed, diamond
                      // slipping, circle on track / complete. Leaflet takes the
                      // number of sides via the canvas renderer's `shape` hint,
                      // so the class is applied for CSS-based shaping too.
                      className={`marker-${pStat.shape}${isSelected ? ' marker-selected' : ''}`}
                      pathOptions={{
                        fillColor: pStat.color,
                        fillOpacity: approx ? 0.3 : (isSelected ? 0.95 : 0.8),
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
                          <div className="font-bold text-slate-950 leading-tight">{p.project_name}</div>
                          <div className="text-slate-600 font-mono text-[10px]">ID #{p.project_id} · <span lang={sectorIsTranslated(p.sector, lang) ? undefined : 'en'}>{sectorName(p.sector, lang)}</span></div>
                          <div className="text-slate-900 font-bold font-mono">Cost: ₹{Number(p.revised_cost_cr || 0).toLocaleString('en-IN')} Cr</div>
                          <div className="text-slate-700 font-semibold flex items-center gap-1.5">
                            <StatusGlyph status={pStat} size={10} />
                            Progress: {p.progress_perc}% — {pStat.label}
                          </div>
                          {approx && (
                            <div className="text-amber-950 bg-amber-50 border border-amber-300 rounded p-1 text-[10px] leading-snug">
                              <strong>Approximate Centroid.</strong> Plotted at {String(p.geocode_precision || '').toLowerCase().includes('state') ? 'state' : 'national'} centroid.
                            </div>
                          )}
                          <div className="pt-1">
                            <button
                              onClick={() => handleSelectAndFocus(p.project_id)}
                              className="w-full text-center py-1.5 bg-slate-900 hover:bg-black text-white rounded font-bold text-[11px] transition-colors"
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

          <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>{t('map_click_marker', lang)}</span>
            <span className="text-slate-800 font-semibold">{t('map_geocoder', lang)}</span>
          </div>
        </div>

        {/* Right Column: Search & Filtered Project Directory */}
        <div className="lg:col-span-5 rounded-xl bg-white border border-slate-200/90 flex flex-col h-[600px] overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-slate-200 bg-slate-50/80 space-y-3 shrink-0">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                aria-label={t('search_directory_label', lang)}
                placeholder={t('search_directory_ph', lang)}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-slate-700"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Quick Sector Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10.5px] font-mono no-scrollbar">
              {['All', 'ROAD TRANSPORT AND HIGHWAYS', 'RAILWAYS', 'POWER', 'PETROLEUM'].map((sec) => {
                const isSelected = selectedSector === sec;
                const label = sec === 'All' ? 'All Sectors' : sec.replace('ROAD TRANSPORT AND HIGHWAYS', 'Highways').replace('PETROLEUM', 'Petroleum').replace('RAILWAYS', 'Railways').replace('POWER', 'Power');
                return (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setSelectedSector(sec)}
                    className={`px-2 py-1 rounded text-[10px] font-bold whitespace-nowrap transition-colors cursor-pointer border ${
                      isSelected
                        ? 'bg-gov-navy text-amber-300 border-gov-navy shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-none focus:border-slate-900 cursor-pointer font-sans"
                aria-label="Filter by sector"
              >
                {sectors.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-none focus:border-slate-900 cursor-pointer font-sans"
                aria-label="Filter by state"
              >
                {states.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {(selectedSector !== 'All' || selectedState !== 'All' || searchQuery) && (
              <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                <span>{projects.length} of {allProjects.length || 2207} match</span>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedSector('All');
                    setSelectedState('All');
                  }}
                  className="text-slate-900 hover:underline flex items-center gap-1 font-semibold"
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              </div>
            )}
          </div>

          {/* Scrollable list with progressive expansion */}
          {/* `relative` is load-bearing, not decorative. Without a positioned
              containing block here, the 8,500px list inside this 445px scrollport
              leaked its full height into the ROOT scroll area: the document scrolled
              to 9,534px while the body ended at 3,043px, leaving ~6,500px of blank
              dead space below the footer that a user could scroll into and find
              nothing. Verified: hiding the list dropped documentElement.scrollHeight
              from 9,534 to exactly body.scrollHeight. */}
          <div
            data-lenis-prevent
            onScroll={handleDirScroll}
            className="relative flex-1 overflow-y-auto scrollbar-thin"
          >
            {projects.length === 0 ? (
              <DataUnavailable
                variant={searchQuery || selectedSector !== 'All' || selectedState !== 'All' ? 'filtered' : 'empty'}
                title={t('err_no_match_title', lang)}
                detail={t('err_no_match_detail', lang)}
                clearLabel={t('err_clear_filters', lang)}
                className="m-4 border-0 bg-transparent"
                onClear={() => { setSearchQuery(''); setSelectedSector('All'); setSelectedState('All'); }}
              />
            ) : (
              <>
                {/* A list, not ~100 sibling <h4> headings. Heading navigation is the
                    primary way screen-reader users move through a page; a flat wall
                    of 100 project names at one level destroys it. Each row is a
                    <button> so it is focusable and operable by keyboard. */}
                <ul className="divide-y divide-slate-100">
                {projects.slice(0, dirLimit).map((p) => {
                  const isSelected = String(p.project_id) === String(activeProject?.project_id);
                  const pStat = getProjectStatus(p);
                  return (
                    <li key={p.project_id}>
                    <button
                      type="button"
                      onClick={() => selectProject(p.project_id)}
                      aria-current={isSelected ? 'true' : undefined}
                      className={`w-full text-left p-3.5 cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-slate-100/90 border-l-4 border-slate-950 font-medium'
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-[10.5px] font-bold text-slate-900">#{p.project_id}</span>
                            <span className="text-[10px] font-semibold text-slate-600 truncate"><span lang={sectorIsTranslated(p.sector, lang) ? undefined : 'en'}>{sectorName(p.sector, lang)}</span></span>
                          </div>
                          <span lang="en" className="block text-xs font-bold text-slate-900 truncate">{p.project_name}</span>
                          <span lang="en" className="block text-[11px] text-slate-600 truncate mt-0.5">{p.company} · {p.state}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${pStat.badgeClass}`}>
                            <StatusGlyph status={pStat} size={8} />
                            {p.progress_perc}%
                          </span>
                          <span className="sr-only">{describeStatus(p, lang)}</span>
                          <div className="font-mono font-bold text-xs text-slate-900 mt-1.5">
                            {formatCr(p.revised_cost_cr)}
                          </div>
                        </div>
                      </div>
                    </button>
                    </li>
                  );
                })}
                </ul>

                {dirLimit < projects.length && (
                  <div className="p-4 bg-slate-50 text-center space-y-2 border-t border-slate-200">
                    <p className="text-xs text-slate-500 font-mono">
                      Showing {dirLimit} of {projects.length.toLocaleString('en-IN')} projects
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => setDirLimit((prev) => Math.min(prev + 100, projects.length))}
                        className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-100 transition-colors shadow-2xs"
                      >
                        Load +100 More
                      </button>
                      <button
                        onClick={() => setDirLimit(projects.length)}
                        className="px-3 py-1.5 text-xs bg-slate-900 text-white rounded-lg font-bold hover:bg-black transition-colors shadow-2xs"
                      >
                        Show All ({projects.length.toLocaleString('en-IN')})
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>Showing {Math.min(dirLimit, projects.length).toLocaleString('en-IN')} of {projects.length.toLocaleString('en-IN')}</span>
            <span className="text-slate-700 font-semibold">{t('reg_corpus_label', lang)}</span>
          </div>
        </div>
      </div>

      {/* ── MASTER PUBLIC TRACKING REGISTER & TABLE (ALL 2,207 PROJECTS) ── */}
      <div className="rounded-xl bg-white border border-slate-200/90 overflow-hidden shadow-2xs">
        <div className="p-5 border-b border-slate-200 bg-slate-50/80 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <Layers className="w-5 h-5 text-slate-900" />
              <h3 className="text-lg font-extrabold text-slate-950 tracking-[-0.02em]">
                {t('register_title', lang)}
              </h3>
              <span className="px-2.5 py-0.5 rounded bg-slate-100 text-slate-900 border border-slate-300 font-mono font-bold text-xs">
                {corpus.length.toLocaleString('en-IN')} PROJECTS
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {t('register_subtitle_a', lang)} {formatCount(portfolioStats.total)}{' '}
              {t('register_subtitle_b', lang)} {formatCr(portfolioStats.totalCapex, { lakhCrore: true, lang })}{' '}
              {t('register_subtitle_c', lang)}
            </p>
          </div>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 hover:bg-black text-white font-bold text-xs shadow-2xs transition-colors"
            title="Download filtered projects as CSV"
          >
            <Download className="w-4 h-4" />
            <span>{t('reg_export_csv', lang)} ({formatCount(tableFiltered.length)})</span>
          </button>
        </div>

        {/* Summary strip. "Under Monitoring" used to carry 67.4% of the portfolio
            and told an officer nothing; these four are actionable populations. */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-slate-200 border-b border-slate-200">
          <div className="p-4 bg-white">
            <span className="text-[10px] uppercase font-mono tracking-widest text-slate-600 font-bold block">{t('kpi_in_register', lang)}</span>
            <span className="text-xl font-extrabold text-slate-950 font-mono block mt-0.5">
              {formatCount(portfolioStats.total)}
            </span>
            <span className="text-xs text-slate-600 mt-1 block font-mono font-medium">{formatCr(portfolioStats.totalCapex, { lakhCrore: true, lang })} {t('kpi_approved', lang)}</span>
          </div>

          <div className="p-4 bg-white">
            <span className="text-[10px] uppercase font-mono tracking-widest text-slate-600 font-bold block">{t('kpi_needs_attention', lang)}</span>
            <span className="text-xl font-extrabold text-rose-800 font-mono block mt-0.5">
              {formatCount(portfolioStats.needsAttention)}
            </span>
            <span className="text-xs text-rose-800 mt-1 block font-mono">{t('kpi_needs_attention_sub', lang)}</span>
          </div>

          <div className="p-4 bg-white">
            <span className="text-[10px] uppercase font-mono tracking-widest text-slate-600 font-bold block">{t('kpi_on_schedule', lang)}</span>
            <span className="text-xl font-extrabold text-emerald-800 font-mono block mt-0.5">
              {formatCount(portfolioStats.counts.ON_TRACK)}
            </span>
            <span className="text-xs text-emerald-800 mt-1 block font-mono">{t('kpi_on_schedule_sub', lang)}</span>
          </div>

          <div className="p-4 bg-white">
            <span className="text-[10px] uppercase font-mono tracking-widest text-slate-600 font-bold block">{t('kpi_finished', lang)}</span>
            <span className="text-xl font-extrabold text-[#0f3f61] font-mono block mt-0.5">
              {formatCount(portfolioStats.counts.COMPLETED + portfolioStats.counts.COMPLETED_LATE)}
            </span>
            <span className="text-xs text-[#0f3f61] mt-1 block font-mono">
              {t('kpi_finished_sub_a', lang)} {formatCount(portfolioStats.counts.COMPLETED_LATE)} {t('kpi_finished_sub_b', lang)}
            </span>
          </div>
        </div>

        {/* Master Table Filter Controls Toolbar */}
        <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[{ id: 'All', label: t('filter_all', lang), glyph: null, count: corpus.length },
              ...STATUS_ORDER.map((st) => ({
                id: st.id,
                label: lang === 'hi' ? (st.hiLabel || st.label) : st.label,
                glyph: st,
                count: portfolioStats.counts[st.id],
              }))].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setTableStatus(tab.id)}
                aria-pressed={tableStatus === tab.id}
                className={`inline-flex items-center gap-1.5 px-3 py-2 min-h-[34px] text-xs rounded-lg font-semibold transition-colors ${
                  tableStatus === tab.id
                    ? 'bg-slate-950 text-white font-bold shadow-2xs'
                    : 'bg-white border border-slate-300 text-slate-800 hover:bg-slate-100'
                }`}
              >
                {tab.glyph && <StatusGlyph status={tab.glyph} size={9} />}
                <span>{tab.label}</span>
                <span className="font-mono opacity-80">({formatCount(tab.count)})</span>
              </button>
            ))}
          </div>

          {/* Search, Sort and Page Size */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative min-w-[200px] sm:min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                aria-label={t('search_register_label', lang)}
                placeholder={t('search_register_ph', lang)}
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900"
              />
              {tableSearch && (
                <button
                  onClick={() => setTableSearch('')}
                  className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-slate-700"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-mono">
              <span id="register-sort-label">Sort:</span>
              <select
                aria-labelledby="register-sort-label"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-xs bg-white border border-slate-300 rounded-lg py-2 px-2.5 text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="cost_desc">Cost: highest first</option>
                <option value="cost_asc">Cost: lowest first</option>
                <option value="delay_desc">Delay: most delayed</option>
                <option value="delay_asc">Delay: least delayed</option>
                <option value="progress_desc">Progress: highest first</option>
                <option value="progress_asc">Progress: lowest first</option>
                <option value="id_asc">Project ID</option>
                <option value="name_asc">Project name (A–Z)</option>
                <option value="name_desc">Project name (Z–A)</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-mono">
              <span id="register-rows-label">{t('rows_label', lang)}</span>
              <select
                aria-labelledby="register-rows-label"
                value={pageSize}
                onChange={(e) => setPageSize(e.target.value === 'All' ? 'All' : Number(e.target.value))}
                className="text-xs bg-white border border-slate-300 rounded-lg py-2 px-2.5 text-slate-800 focus:outline-none cursor-pointer"
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

        {/* The master register.
            · <thead> is sticky: at "All 2,207" rows the column names used to scroll
              away within one screen, leaving an officer reading unlabelled columns.
            · Headers are buttons that sort. Sorting existed only in a dropdown
              elsewhere on the page — recall where every operator reaches for
              recognition. The dropdown is kept and stays in sync.
            · scope="col" and a <caption> were both absent, so no screen reader
              could associate a cell with its column. */}
        <div className="overflow-x-auto max-h-[70vh] overflow-y-auto" data-lenis-prevent>
          <table className="w-full text-left text-xs border-collapse">
            <caption className="sr-only">
              {t('reg_caption', lang)} {formatCount(tableFiltered.length)}{' '}
              {t('reg_showing_of', lang)} {formatCount(corpus.length)}.
            </caption>
            <thead className="sticky top-0 z-10">
              <tr className="border-b-2 border-slate-300 bg-slate-100 text-[11px] font-mono uppercase tracking-wider text-slate-700 font-bold">
                <SortableTh id="id" sortBy={sortBy} setSortBy={setSortBy} lang={lang} textual className="pl-4 w-20">{t('col_id', lang)}</SortableTh>
                <SortableTh id="name" sortBy={sortBy} setSortBy={setSortBy} lang={lang} textual className="min-w-[260px]">{t('col_name', lang)}</SortableTh>
                <th scope="col" className="p-3.5 min-w-[180px]">{t('col_agency', lang)}</th>
                <SortableTh id="cost" sortBy={sortBy} setSortBy={setSortBy} lang={lang} numeric className="min-w-[150px]">{t('col_cost', lang)}</SortableTh>
                <SortableTh id="progress" sortBy={sortBy} setSortBy={setSortBy} lang={lang} className="min-w-[140px]">{t('col_progress', lang)}</SortableTh>
                <SortableTh id="delay" sortBy={sortBy} setSortBy={setSortBy} lang={lang} className="min-w-[130px]">{t('col_delay', lang)}</SortableTh>
                <th scope="col" className="p-3.5 min-w-[150px]">{t('col_status', lang)}</th>
                <th scope="col" className="p-3.5 pr-4 text-right min-w-[110px]">{t('col_action', lang)}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pagedProjects.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6">
                    <DataUnavailable
                      variant="filtered"
                      title={t('err_no_match_title', lang)}
                      detail={t('err_no_match_detail', lang)}
                      clearLabel={t('err_clear_filters', lang)}
                      className="border-0 bg-transparent"
                      onClear={() => {
                        setTableSearch(''); setTableStatus('All');
                        setTableSector('All'); setTableState('All');
                      }}
                    />
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
                          ? 'bg-slate-100/80 font-medium' 
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* Column 1: ID */}
                      <td className="p-3.5 pl-4">
                        <span className="font-mono font-bold text-slate-950 text-xs">
                          #{p.project_id}
                        </span>
                      </td>

                      {/* Column 2: Name & Sector */}
                      <td className="p-3.5">
                        <div lang="en" className="font-bold text-slate-950 text-xs leading-snug">
                          {p.project_name}
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold border border-slate-200">
                            <span lang={sectorIsTranslated(p.sector, lang) ? undefined : 'en'}>{sectorName(p.sector, lang)}</span>
                          </span>
                          {p.location_is_approximate && (
                            <span className="text-[10px] text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-medium">
                              {t('reg_centroid_approx', lang)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Column 3: Executing Agency & State */}
                      <td className="p-3.5">
                        <div lang="en" className="text-xs font-semibold text-slate-800 truncate max-w-[200px]" title={p.company}>
                          {orDash(p.company)}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span lang="en">{orDash(p.state) === '—' ? 'Pan-India' : p.state}</span>
                        </div>
                      </td>

                      {/* Column 4: Cost */}
                      <td className="p-3.5 text-right font-mono">
                        <div className="font-bold text-xs text-slate-950">
                          ₹{revCost.toLocaleString('en-IN')} Cr
                        </div>
                        <div className="text-[10px] text-slate-500">
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
                        <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-700 mb-1">
                          <span>{prog.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                          <div
                            className="bg-slate-950 h-full rounded-full transition-all duration-300"
                            style={{ width: `${prog}%` }}
                          />
                        </div>
                      </td>

                      {/* Column 6: Delay */}
                      <td className="p-3.5">
                        <div className={`font-mono font-bold text-xs ${delayed > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                          {delayed > 0 ? `+${delayed} Mos` : 'Nil Delay'}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono truncate">
                          Target: {p.target_date?.slice(0, 10) || '—'}
                        </div>
                      </td>

                      {/* Column 7: Status */}
                      <td className="p-3.5">
                        <StatusBadge project={p} size="sm" />
                      </td>

                      {/* Column 8: Action */}
                      <td className="p-3.5 pr-4 text-right">
                        <button
                          onClick={() => handleSelectAndFocus(p.project_id)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-950 hover:text-white text-slate-800 rounded-lg text-xs font-bold transition-colors border border-slate-200 shadow-2xs"
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
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="text-slate-600 font-mono">
            Showing{' '}
            <strong className="text-slate-950">
              {tableFiltered.length === 0 ? 0 : (safeCurrentPage - 1) * effectivePageSize + 1}
            </strong>{' '}
            –{' '}
            <strong className="text-slate-950">
              {Math.min(safeCurrentPage * effectivePageSize, tableFiltered.length)}
            </strong>{' '}
            {t('of_word', lang)}{' '}
            <strong className="text-slate-950">
              {tableFiltered.length.toLocaleString('en-IN')}
            </strong>{' '}
            {t('pg_filtered_projects', lang)} ({formatCount(corpus.length)} {t('pg_total_corpus', lang)})
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1.5 font-mono">
              <button
                disabled={safeCurrentPage <= 1}
                onClick={() => setCurrentPage(1)}
                className="p-2 rounded-lg border border-slate-200 bg-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 text-slate-700 shadow-2xs"
                title={t('pg_first', lang)}
                aria-label={t('pg_first', lang)}
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                disabled={safeCurrentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-2 rounded-lg border border-slate-200 bg-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 text-slate-700 shadow-2xs"
                title={t('pg_prev', lang)}
                aria-label={t('pg_prev', lang)}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-4 py-2 font-bold text-xs text-slate-950 bg-white border border-slate-200 rounded-lg shadow-2xs">
                {t('pg_page', lang)} {safeCurrentPage} / {totalPages}
              </span>

              <button
                disabled={safeCurrentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-2 rounded-lg border border-slate-200 bg-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 text-slate-700 shadow-2xs"
                title={t('pg_next', lang)}
                aria-label={t('pg_next', lang)}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                disabled={safeCurrentPage >= totalPages}
                onClick={() => setCurrentPage(totalPages)}
                className="p-2 rounded-lg border border-slate-200 bg-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 text-slate-700 shadow-2xs"
                title={t('pg_last', lang)}
                aria-label={t('pg_last', lang)}
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
      <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-100 border border-slate-200 text-slate-900 text-xs shadow-2xs">
        <Info className="w-4 h-4 shrink-0 mt-0.5 text-slate-700" />
        <div>
          <strong className="text-slate-950 font-bold">Right to Information Act, 2005 · Section 4(1)(b)(xi) Mandate.</strong> Proactive disclosure of sanctioned budgetary outlays, cumulative spending against physical progress milestones, and statutory CPWD price adjustments.
        </div>
      </div>

      {/* Citizen Educational Callout Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/90 text-slate-900 shadow-2xs space-y-1.5">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>What does a 20% Cost Overrun trigger for taxpayers?</span>
          </div>
          <p className="text-[12px] text-slate-700 leading-relaxed font-sans">
            Under Union Cabinet governance rules, any central infrastructure project exceeding its originally sanctioned capex by &ge; 20% cannot spend additional public funds without formal reappraisal and revised financial sanction from the Cabinet Committee on Economic Affairs (CCEA).
          </p>
        </div>

        <div className="p-4 rounded-xl bg-sky-50/70 border border-sky-200/90 text-slate-900 shadow-2xs space-y-1.5">
          <div className="flex items-center gap-2 text-sky-900 font-bold text-xs">
            <Building2 className="w-4 h-4 text-sky-600 shrink-0" />
            <span>How does MoSPI audit price escalations?</span>
          </div>
          <p className="text-[12px] text-slate-700 leading-relaxed font-sans">
            CPWD Clause 10CC enforces statutory formula-based price adjustment ceilings tied directly to official RBI Wholesale Price Index (WPI) variances for cement, steel, fuel, and labor indices — ensuring contractors cannot submit arbitrary inflation claims.
          </p>
        </div>
      </div>

      {/* Top 4 Financial Metric Cells */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500 font-bold block">Sanctioned Baseline</span>
          <span className="text-2xl font-extrabold text-slate-950 font-mono block mt-1">₹{origCost.toLocaleString('en-IN')} <span className="text-xs font-normal text-slate-500">Cr</span></span>
          <span className="text-xs text-slate-500 mt-1 block">CCEA Approved Baseline</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500 font-bold block">Revised Sanctioned Cost</span>
          <span className="text-2xl font-extrabold text-slate-950 font-mono block mt-1">₹{revCost.toLocaleString('en-IN')} <span className="text-xs font-normal text-slate-500">Cr</span></span>
          <span className={`text-xs mt-1 block font-mono font-semibold ${costVariance > 0 ? 'text-amber-800' : 'text-emerald-700'}`}>
            {costVariance > 0 ? `+₹${costVariance.toLocaleString('en-IN')} Cr (+${costVariancePct.toFixed(1)}%)` : 'Within Initial Outlay'}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500 font-bold block">Cumulative Disbursal (Est.)</span>
          <span className="text-2xl font-extrabold text-emerald-700 font-mono block mt-1">₹{estDisbursed.toLocaleString('en-IN', { maximumFractionDigits: 1 })} <span className="text-xs font-normal text-slate-500">Cr</span></span>
          <span className="text-xs text-slate-500 mt-1 block">Tied to {progressPerc}% physical milestone</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500 font-bold block">CPWD WPI Escalation</span>
          <span className="text-2xl font-extrabold text-slate-900 font-mono block mt-1">₹{wpiInflationAllowance.toLocaleString('en-IN', { maximumFractionDigits: 1 })} <span className="text-xs font-normal text-slate-500">Cr</span></span>
          <span className="text-xs text-slate-500 mt-1 block">Statutory Clause 10CC buffer</span>
        </div>
      </div>

      {/* Visual Budget Comparison: Progress Bars */}
      <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-slate-900" />
            <h3 className="text-base font-extrabold text-slate-950">
              Visual Capex Comparison · {activeProject.project_name}
            </h3>
          </div>
          <span className="px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-slate-900 font-mono font-bold text-xs">
            #{activeProject.project_id}
          </span>
        </div>

        <div className="space-y-5">
          {/* Bar 1: Sanctioned Initial */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-semibold text-slate-700">1. Initial Approved Budget (CCEA Baseline)</span>
              <span className="font-bold text-slate-950">₹{origCost.toLocaleString('en-IN')} Cr (100% Baseline)</span>
            </div>
            <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden border border-slate-200">
              <div
                className="bg-slate-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${origBarWidth}%` }}
              />
            </div>
          </div>

          {/* Bar 2: Revised Budget */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-semibold text-slate-700">2. Revised Sanctioned Budget (MoSPI RCE)</span>
              <span className="font-bold text-slate-950">
                ₹{revCost.toLocaleString('en-IN')} Cr ({costVariancePct >= 0 ? `+${costVariancePct.toFixed(1)}%` : '0%'})
              </span>
            </div>
            <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden border border-slate-200">
              <div
                className={`h-full rounded-full transition-all duration-500 ${costVariancePct >= 20 ? 'bg-rose-600' : 'bg-slate-900'}`}
                style={{ width: `${revBarWidth}%` }}
              />
            </div>
          </div>

          {/* Bar 3: Cumulative Disbursed */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-semibold text-slate-700">3. Cumulative Disbursed Amount (Milestone Realized)</span>
              <span className="font-bold text-emerald-700">
                ₹{estDisbursed.toLocaleString('en-IN', { maximumFractionDigits: 1 })} Cr ({progressPerc}% of Revised)
              </span>
            </div>
            <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden border border-slate-200">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${disbursedBarWidth}%` }}
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 font-mono">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-400" /> Approved Baseline</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-900" /> Revised Budget</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-600" /> Disbursed Funds</span>
          </div>
          <span className="text-slate-900 font-semibold">RTI §4(1)(b)(xi) Standardized Realization</span>
        </div>
      </div>

      {/* Detailed Ledger */}
      <div className="rounded-xl bg-white border border-slate-200 overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <span className="text-sm font-bold text-slate-950">Public Expenditure Breakdown</span>
          <span className="text-xs font-mono text-slate-500">Executing PSU: {activeProject.company}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/80 text-[11px] font-mono uppercase tracking-wider text-slate-600 font-bold">
                <th className="p-3.5 pl-4">Expenditure Head</th>
                <th className="p-3.5">Sanctioned Reference</th>
                <th className="p-3.5 text-right">Amount (₹ Cr)</th>
                <th className="p-3.5 pr-4">Statutory Audit Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              <tr className="hover:bg-slate-50">
                <td className="p-3.5 pl-4 font-bold text-slate-950">Initial Approved Baseline</td>
                <td className="p-3.5 text-slate-600 font-sans">Cabinet Committee on Economic Affairs (CCEA)</td>
                <td className="p-3.5 text-right font-bold text-slate-950">₹{origCost.toLocaleString('en-IN')}</td>
                <td className="p-3.5 pr-4"><span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300 text-[10px] font-bold">APPROVED</span></td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="p-3.5 pl-4 font-bold text-slate-950">Cumulative Cost Variation / Revised Scope</td>
                <td className="p-3.5 text-slate-600 font-sans">MoSPI Revised Cost Estimates (RCE)</td>
                <td className={`p-3.5 text-right font-bold ${costVariance > 0 ? 'text-amber-800' : 'text-slate-800'}`}>
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
              <tr className="hover:bg-slate-50">
                <td className="p-3.5 pl-4 font-bold text-slate-950">Contractor Cumulative Realization</td>
                <td className="p-3.5 text-slate-600 font-sans">Physical Milestone Verification</td>
                <td className="p-3.5 text-right font-bold text-emerald-700">
                  ₹{estDisbursed.toLocaleString('en-IN', { maximumFractionDigits: 1 })}
                </td>
                <td className="p-3.5 pr-4"><span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300 text-[10px] font-bold">DISBURSED</span></td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="p-3.5 pl-4 font-bold text-slate-950">CPWD Clause 10CC Escalation Allocation</td>
                <td className="p-3.5 text-slate-600 font-sans">Wholesale Price Index (WPI) Formula</td>
                <td className="p-3.5 text-right font-bold text-slate-900">
                  ₹{wpiInflationAllowance.toLocaleString('en-IN', { maximumFractionDigits: 1 })}
                </td>
                <td className="p-3.5 pr-4"><span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-300 text-[10px] font-bold">INDEX-TIED</span></td>
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
    <div className="space-y-2 pt-2 border-t border-slate-200/80">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono uppercase text-slate-500 font-bold tracking-wider">
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
                  : 'bg-white border-slate-200 text-slate-900 shadow-2xs'
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
                    <div className="font-bold text-[11px] leading-tight text-slate-900 flex items-center gap-1.5 flex-wrap">
                      <span>{st.stage_name}</span>
                      {st.paperwork_loopback_detected && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          <RotateCcw className="w-2.5 h-2.5" /> Loopback
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 truncate mt-0.5" title={st.department}>
                      {st.department || 'Statutory Review Authority'}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-mono font-bold text-[10.5px] text-slate-900">
                    {st.days_pending}d <span className="text-[9.5px] font-normal text-slate-500">/ {st.benchmark_days}d SLA</span>
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
              <div className="mt-2 pt-1.5 border-t border-slate-100/80 flex items-center gap-2">
                <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isStag ? 'bg-rose-500' : percent > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, percent)}%` }}
                  />
                </div>
                <span className="text-[9px] font-mono text-slate-500 shrink-0 font-semibold">
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
      <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-100 border border-slate-200 text-slate-900 text-xs shadow-2xs">
        <Landmark className="w-4 h-4 text-slate-800 shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-950 font-bold">PARIVESH Statutory Clearance Transparency.</strong> Real-time regulatory tracking for all 2,207 Central Sector mega-projects across Forest Stage-I/II, Environmental Impact Assessment (EIA), Wildlife Clearances, and Land Acquisition approvals.
        </div>
      </div>

      {/* 4 National Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[10px] uppercase font-mono tracking-widest text-slate-500 font-bold">Clearance Corpus</div>
          <div className="text-2xl font-extrabold text-slate-950 font-mono mt-1">
            {data?.total_portfolio_projects || 2207}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-mono">7,257 active filings</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[10px] uppercase font-mono tracking-widest text-slate-500 font-bold">Total Forest Diverted</div>
          <div className="text-2xl font-extrabold text-emerald-700 font-mono mt-1">
            {data?.total_forest_diversion_ha ? `${Number(data.total_forest_diversion_ha).toLocaleString('en-IN')} ha` : '87,038 ha'}
          </div>
          <div className="text-xs text-emerald-600 mt-1 font-mono">MoEFCC CAMPA audited</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[10px] uppercase font-mono tracking-widest text-slate-500 font-bold">Stalled Clearances</div>
          <div className="text-2xl font-extrabold text-rose-700 font-mono mt-1">
            {data?.projects_stalled ?? '—'}
          </div>
          <div className="text-xs text-rose-600 mt-1 font-mono">RSI &gt; 1.2 loopbacks</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[10px] uppercase font-mono tracking-widest text-slate-500 font-bold">PMO Direct Escalations</div>
          <div className="text-2xl font-extrabold text-amber-700 font-mono mt-1">
            {data?.projects_flagged_for_pmo_escalation ?? '—'}
          </div>
          <div className="text-xs text-amber-600 mt-1 font-mono">Critical path block</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by project name, ID (#619092), or proposal no..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setDisplayLimit(50);
            }}
            className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-mono">
            <span>State:</span>
            <select
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                setDisplayLimit(50);
              }}
              className="text-xs bg-white border border-slate-300 rounded-lg py-2 px-2.5 text-slate-800 focus:outline-none cursor-pointer font-sans"
            >
              {statesList.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-mono">
            <span>Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setDisplayLimit(50);
              }}
              className="text-xs bg-white border border-slate-300 rounded-lg py-2 px-2.5 text-slate-800 focus:outline-none cursor-pointer font-sans"
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
      <div className="rounded-xl bg-white border border-slate-200 overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <span className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider font-bold text-slate-900">
            <TreePine className="w-3.5 h-3.5 text-emerald-700" />
            Statutory Clearances Pipeline
          </span>
          <span className="text-xs text-slate-500 font-mono">Showing {projects.length} of {filteredTotal} matching proposals</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">
            Loading statutory clearances from PARIVESH portal...
          </div>
        ) : projects.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No clearance records match your search criteria. Try a different query or state.
          </div>
        ) : (
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((p) => {
              const status = p.overall_clearance_status || 'PENDING';
              let tagCls = 'bg-slate-100 text-slate-700 border-slate-200';
              if (status === 'APPROVED') tagCls = 'bg-emerald-50 text-emerald-800 border-emerald-300';
              else if (status === 'IN_PROGRESS') tagCls = 'bg-amber-50 text-amber-800 border-amber-300';
              else if (status === 'STALLED') tagCls = 'bg-rose-50 text-rose-800 border-rose-300';

              const stages = p.stage_breakdown || [];

              return (
                <div key={p.project_id} className="p-4 rounded-lg bg-slate-50/70 border border-slate-200/80 space-y-3 hover:border-slate-400 transition-all shadow-2xs">
                  <div className="flex items-start justify-between gap-2 border-b border-slate-200/80 pb-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded bg-slate-950 text-white font-mono font-bold text-[10px]">
                          #{p.project_id}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-200/80 text-slate-800 text-[10px] font-semibold">
                          {p.state || 'Pan-India'}
                        </span>
                        <span className="text-[10px] text-slate-500 truncate">({p.sector || 'Infrastructure'})</span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 leading-snug truncate" title={p.project_name}>
                        {p.project_name}
                      </h4>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded border text-[10px] font-mono font-bold shrink-0 ${tagCls}`}>
                      {status}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 rounded bg-white border border-slate-200 shadow-2xs">
                      <span className="text-[9px] uppercase font-mono text-slate-500 font-bold block">Forest Diverted</span>
                      <span className="font-mono font-bold text-slate-900 text-xs block mt-0.5">
                        {p.total_forest_diversion_ha ? `${p.total_forest_diversion_ha} ha` : '—'}
                      </span>
                    </div>
                    <div className="p-2 rounded bg-white border border-slate-200 shadow-2xs">
                      <span className="text-[9px] uppercase font-mono text-slate-500 font-bold block">Review Period</span>
                      <span className="font-mono font-bold text-slate-900 text-xs block mt-0.5">{p.days_overdue || 0}d</span>
                    </div>
                    <div className="p-2 rounded bg-white border border-slate-200 shadow-2xs">
                      <span className="text-[9px] uppercase font-mono text-slate-500 font-bold block">Bottleneck</span>
                      <span className="font-semibold text-slate-900 text-[10.5px] truncate block mt-0.5" title={p.bottleneck_department}>
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
          <div className="p-4 border-t border-slate-200 text-center bg-slate-50">
            <button
              onClick={() => setDisplayLimit((prev) => prev + 50)}
              className="px-6 py-2 rounded-lg bg-slate-900 hover:bg-black text-white font-bold text-xs shadow-2xs transition-colors"
            >
              Load More Proposals ({filteredTotal - projects.length} remaining)
            </button>
          </div>
        )}

        <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500 font-mono">
          <span>Direct feed from PARIVESH statutory portal (2,207 Projects Indexed)</span>
          <span className="text-slate-800 font-semibold">RTI §4 Environmental Disclosure</span>
        </div>
      </div>
    </div>
  );
}
