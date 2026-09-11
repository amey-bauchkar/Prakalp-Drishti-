import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock, GitBranch, DollarSign, FileText, Building2, Sparkles,
  FlaskConical, Search, Layers, Compass, ShieldCheck, ChevronRight,
  Menu, X, ChevronsLeft, ChevronsRight, ShieldAlert
} from 'lucide-react';
import WatchlistView from './WatchlistView';   // eager: this is the landing panel
import LoginGate from './LoginGate';

// Every other engine loads on demand. Each is a separate chunk, so switching
// engines fetches only that engine, and the first paint of the console no longer
// carries Tremor, the satellite viewer and ten unused analytical surfaces.
const KaalChakraView         = React.lazy(() => import('./KaalChakraView'));
const VittaVyuhaView         = React.lazy(() => import('./VittaVyuhaView'));
const PragatiSaarthiView     = React.lazy(() => import('./PragatiSaarthiView'));
const UnifiedCockpitView     = React.lazy(() => import('./UnifiedCockpitView'));
const AgencyIndexView        = React.lazy(() => import('./AgencyIndexView'));
const GeocodePrecisionPanel  = React.lazy(() => import('./GeocodePrecisionPanel'));
const ModelBenchmarkView     = React.lazy(() => import('./ModelBenchmarkView'));
const SatyaKavachView        = React.lazy(() => import('../src/views/SatyaKavachView'));
const ArthaNivaranView       = React.lazy(() => import('../src/views/ArthaNivaranView'));
const SetuVarshaView         = React.lazy(() => import('../src/views/SetuVarshaView'));
const KaryaDakshataSimulator = React.lazy(() => import('../src/components/KaryaDakshataSimulator'));
import { getStoredLanguage, t, toHindiDigits } from '../src/lib/i18n';
import { scrollToTop } from '../src/components/SmoothScrollProvider';

/** Shown while an engine's JavaScript is fetched. A blank frame on a slow office
    connection is indistinguishable from a failure. */
function EngineLoading({ label }) {
  return (
    <div className="panel p-10 flex flex-col items-center justify-center gap-3 min-h-[320px]" role="status">
      <div className="w-7 h-7 rounded-full border-2 border-gov-border border-t-gov-navy animate-spin" aria-hidden="true" />
      <p className="text-[12.5px] text-gov-soft">{label}</p>
    </div>
  );
}

// Normalize engine alias to official engine IDs
function normalizeEngine(id) {
  // Landing on 'watchlist' rather than 'unified_cockpit' is the single change that
  // turns this console from "tell me about a project I already suspect" into
  // "tell me which projects need me". The cockpit's empty state was the first
  // thing a signed-in Ministry Officer saw.
  if (!id) return 'watchlist';
  const clean = String(id).toLowerCase().replace(/-/g, '_');
  const aliasMap = {
    tanmay: 'satya_kavach',
    satyakavach: 'satya_kavach',
    anumati: 'satya_kavach',
    parth: 'artha_nivaran',
    arthanivaran: 'artha_nivaran',
    nivaran: 'artha_nivaran',
    janhavi: 'setu_varsha',
    setuvarsha: 'setu_varsha',
    aditya: 'setu_varsha',
    karyadakshata: 'karya_dakshata',
    cockpit: 'unified_cockpit',
    alerts: 'watchlist',
    early_warning: 'watchlist',
  };
  return aliasMap[clean] || clean;
}

export default function DecisionHubView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedEngine = normalizeEngine(searchParams.get('engine'));

  const [activeEngine, setActiveEngine] = useState(() => requestedEngine || 'watchlist');
  const [selectedProjectId, setSelectedProjectId] = useState(() => {
    return localStorage.getItem('prakalp:selectedProjectId') || '619092';
  });
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [lang, setLang] = useState(() => getStoredLanguage());

  useEffect(() => {
    const onLang = (e) => setLang(e.detail || getStoredLanguage());
    window.addEventListener('prakalp:languageChanged', onLang);
    return () => window.removeEventListener('prakalp:languageChanged', onLang);
  }, []);
  
  // Collapse / Expand state, remembered during user session
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return sessionStorage.getItem('prakalp:sidebarCollapsed') === 'true';
  });

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      sessionStorage.setItem('prakalp:sidebarCollapsed', String(next));
      return next;
    });
  };

  // Sync state if URL query param changes
  useEffect(() => {
    const fromUrl = normalizeEngine(searchParams.get('engine'));
    if (fromUrl && fromUrl !== activeEngine) {
      setActiveEngine(fromUrl);
      scrollToTop(true);
    }
  }, [searchParams]);

  // Arrow keys move between engines, Home/End jump to the ends. Without this the
  // rail announced itself as a tablist and then behaved like ten unrelated buttons.
  const onRailKeyDown = (e) => {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault();
    const ids = engines.map((x) => x.id);
    const at = ids.indexOf(activeEngine);
    const to = e.key === 'Home' ? 0
      : e.key === 'End' ? ids.length - 1
      : e.key === 'ArrowDown' ? (at + 1) % ids.length
      : (at - 1 + ids.length) % ids.length;
    selectEngine(ids[to]);
    requestAnimationFrame(() => document.getElementById(`engine-tab-${ids[to]}`)?.focus());
  };

  const selectEngine = (engineId) => {
    setActiveEngine(engineId);
    setSearchParams({ engine: engineId });
    setMobileDrawerOpen(false);
    scrollToTop(true);
  };

  useEffect(() => {
    const handleProjectSelect = (e) => {
      if (e.detail) {
        setSelectedProjectId(String(e.detail));
        localStorage.setItem('prakalp:selectedProjectId', String(e.detail));
      }
    };
    window.addEventListener('prakalp:selectProject', handleProjectSelect);
    return () => window.removeEventListener('prakalp:selectProject', handleProjectSelect);
  }, []);

  // Four MoSPI executive workspaces. Labels live in the i18n dictionary rather
  // than inline ternaries so English and Hindi cannot drift apart, and so the
  // Devanagari numerals the Hindi strings used to carry (२,२०७ / २०% / १०सीसी)
  // are gone: a statutory reference such as Clause 10CC has to stay quotable.
  const engineGroups = [
    {
      group: t('ws_radar', lang),
      engines: [
        { id: 'watchlist', label: t('eng_watchlist', lang), desc: t('eng_watchlist_desc', lang), icon: ShieldCheck },
        { id: 'satya_kavach', label: t('eng_satya_kavach', lang), desc: t('eng_satya_kavach_desc', lang), icon: ShieldAlert },
        { id: 'setu_varsha', label: t('eng_setu_varsha', lang), desc: t('eng_setu_varsha_desc', lang), icon: Layers },
      ],
    },
    {
      group: t('ws_dossier', lang),
      engines: [
        { id: 'unified_cockpit', label: t('eng_unified_cockpit', lang), desc: t('eng_unified_cockpit_desc', lang), icon: Sparkles },
        { id: 'kaal_chakra', label: t('eng_kaal_chakra', lang), desc: t('eng_kaal_chakra_desc', lang), icon: Clock },
        { id: 'pragati_saarthi', label: t('eng_pragati_saarthi', lang), desc: t('eng_pragati_saarthi_desc', lang), icon: FileText },
      ],
    },
    {
      group: t('ws_allocator', lang),
      engines: [
        { id: 'vitta_vyuha', label: t('eng_vitta_vyuha', lang), desc: t('eng_vitta_vyuha_desc', lang), icon: DollarSign },
        { id: 'karya_dakshata', label: t('eng_karya_dakshata', lang), desc: t('eng_karya_dakshata_desc', lang), icon: Compass },
        { id: 'artha_nivaran', label: t('eng_artha_nivaran', lang), desc: t('eng_artha_nivaran_desc', lang), icon: Search },
        { id: 'agency_index', label: t('eng_agency_index', lang), desc: t('eng_agency_index_desc', lang), icon: Building2 },
      ],
    },
    {
      group: t('ws_governance', lang),
      engines: [
        { id: 'benchmark', label: t('eng_benchmark', lang), desc: t('eng_benchmark_desc', lang), icon: FlaskConical },
      ],
    },
  ];
  const engines = engineGroups.flatMap((g) => g.engines);
  const currentEngineObj = engines.find(e => e.id === activeEngine) || engines[0];

  return (
    <LoginGate>
      <div className="space-y-4 pb-20">
        {/* ── Console masthead telemetry ───────────────── */}
        <div className="telemetry justify-between">
          <span className="flex items-center gap-2 flex-wrap">
            <b>{lang === 'hi' ? 'निर्णय आसूचना केंद्र' : 'DECISION INTELLIGENCE CONSOLE'}</b>
            <span className="sep">/</span>
            <span>{lang === 'hi' ? `${toHindiDigits(engines.length)} इंजन` : `${engines.length} ENGINES`}</span>
            <span className="sep">/</span>
            <span>{lang === 'hi' ? '२,२०७ परियोजनाएं' : '2,207 PROJECTS'}</span>
            <span className="sep">/</span>
            <span className="text-amber-400 font-bold">{currentEngineObj.label.toUpperCase()}</span>
          </span>
          <span className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-semibold text-white uppercase tracking-wider">
              {t('system_operational', lang)}
            </span>
          </span>
        </div>

        {/* ── Mobile Engine Selector Bar (collapsible drawer toggle) ───── */}
        <div className="lg:hidden panel p-3 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-xs bg-[#0F2B42] text-amber-400 border border-sky-900 flex items-center justify-center shrink-0">
              {React.createElement(currentEngineObj.icon, { className: "w-3.5 h-3.5" })}
            </div>
            <div className="min-w-0">
              <span className="text-[9px] uppercase tracking-wider text-gov-muted block font-bold">
                {lang === 'hi' ? 'सक्रिय इंजन' : 'Active Engine'}
              </span>
              <span className="text-xs font-bold text-gov-navy truncate block">{currentEngineObj.label}</span>
            </div>
          </div>
          <button
            onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
            className="btn-outline text-[11px] py-1.5 px-3 shrink-0"
          >
            {mobileDrawerOpen ? <X className="w-3.5 h-3.5 mr-1" /> : <Menu className="w-3.5 h-3.5 mr-1" />}
            <span>{lang === 'hi' ? `सभी इंजन (${toHindiDigits(engines.length)})` : `All Engines (${engines.length})`}</span>
          </button>
        </div>

        {/* ── Main Two-Column Layout (Collapsible Left Sidebar + Wide Content Area) ───── */}
        <div className="flex flex-col lg:flex-row gap-5 items-start">
          
          {/* ══ Left Vertical Engine Sidebar (Collapsible) ══ */}
          <aside
            className={`transition-all duration-200 shrink-0 lg:sticky lg:top-[90px] ${
              isCollapsed ? 'lg:w-[68px]' : 'lg:w-[310px] xl:w-[330px]'
            } ${mobileDrawerOpen ? 'block w-full' : 'hidden lg:block'}`}
          >
            <div className="panel flex flex-col max-h-[calc(100vh-115px)] overflow-hidden">
              <div className={`panel-head shrink-0 flex items-center ${isCollapsed ? 'justify-center px-2 py-2' : 'justify-between'}`}>
                {!isCollapsed && (
                  <span className="panel-title truncate">
                    <Sparkles className="w-3.5 h-3.5 text-gov-accent shrink-0" />
                    <span className="truncate">{lang === 'hi' ? 'निर्णय इंजन' : 'Decision Engines'}</span>
                  </span>
                )}
                
                {/* << / >> Toggle Button */}
                <button
                  onClick={toggleCollapse}
                  className="p-1 text-gov-muted hover:text-gov-navy hover:bg-gov-surface-3 rounded-xs transition-colors"
                  title={isCollapsed ? (lang === 'hi' ? "साइडबार विस्तृत करें (>>)" : "Expand sidebar (>>)") : (lang === 'hi' ? "साइडबार संक्षिप्त करें (<<)" : "Collapse sidebar (<<)")}
                  aria-label={isCollapsed ? (lang === 'hi' ? "साइडबार विस्तृत करें" : "Expand sidebar") : (lang === 'hi' ? "साइडबार संक्षिप्त करें" : "Collapse sidebar")}
                >
                  {isCollapsed ? (
                    <ChevronsRight className="w-4 h-4 text-gov-accent" />
                  ) : (
                    <ChevronsLeft className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Independently Scrollable Engine List */}
              <div
                data-lenis-prevent
                className="relative overflow-y-auto flex-1"
                role="tablist"
                aria-label="Decision engines"
                aria-orientation="vertical"
                onKeyDown={onRailKeyDown}
              >
                {engineGroups.map((grp) => (
                  <div key={grp.group} className="border-b border-gov-border last:border-b-0">
                    {!isCollapsed && (
                      <p className="px-3 pt-2.5 pb-1 text-[9px] font-mono font-black uppercase tracking-widest text-gov-muted">
                        {grp.group}
                      </p>
                    )}
                    {grp.engines.map((eng) => {
                      const Icon = eng.icon;
                      const isActive = activeEngine === eng.id;
                      return (
                        <button
                          key={eng.id}
                          id={`engine-tab-${eng.id}`}
                          role="tab"
                          aria-selected={isActive}
                          aria-controls="engine-panel"
                          // Roving tabindex: the tablist is a single Tab stop and the
                          // arrow keys move within it, per the WAI-ARIA tabs pattern.
                          tabIndex={isActive ? 0 : -1}
                          title={isCollapsed ? `${eng.label} — ${eng.desc}` : undefined}
                          onClick={() => selectEngine(eng.id)}
                          className={`engine-tab w-full flex items-center transition-colors cursor-pointer ${
                            isCollapsed ? 'justify-center p-2.5' : 'items-start gap-2.5 px-3 py-2 text-left'
                          } ${isActive ? 'active' : ''}`}
                        >
                          <span className="engine-tab-icon shrink-0 mt-0.5">
                            <Icon className="w-3.5 h-3.5" strokeWidth={2} />
                          </span>

                          {!isCollapsed && (
                            <div className="min-w-0 flex-1">
                              <span className="engine-tab-name block text-[11px] font-extrabold tracking-wide text-gov-navy leading-tight">
                                {eng.label}
                              </span>
                              <span className="engine-tab-desc block text-[10px] text-gov-soft leading-relaxed mt-0.5 whitespace-normal break-words">
                                {eng.desc}
                              </span>
                            </div>
                          )}

                          {!isCollapsed && isActive && (
                            <ChevronRight className="w-3.5 h-3.5 text-amber-400 shrink-0 self-center opacity-80" aria-hidden="true" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>

              <div className={`panel-head border-t border-b-0 py-2 shrink-0 ${isCollapsed ? 'justify-center' : ''}`}>
                {isCollapsed ? (
                  <span className="font-mono text-[9px] text-gov-muted">{lang === 'hi' ? toHindiDigits(engines.length) : engines.length}</span>
                ) : (
                  <>
                    <span className="panel-meta">{lang === 'hi' ? 'सीसीईए / सांख्यिकी मंत्रालय अधिशासन' : 'CCEA / MoSPI Governed'}</span>
                    <span className="panel-meta">{lang === 'hi' ? 'प्रशासक' : 'Admin'}</span>
                  </>
                )}
              </div>
            </div>
          </aside>

          {/* ══ Wide Content Area on the Right (Flex-1) ══ */}
          <main
            className="flex-1 min-w-0 space-y-6 w-full"
            id="engine-panel"
            role="tabpanel"
            aria-labelledby={`engine-tab-${activeEngine}`}
            tabIndex={-1}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeEngine}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.24, ease: "easeOut" }}
                className="w-full"
              >
                <React.Suspense fallback={<EngineLoading label={currentEngineObj.label} />}>
                {activeEngine === 'watchlist' && (
                  <WatchlistView lang={lang} onOpenProject={(id) => {
                    setSelectedProjectId(String(id));
                    localStorage.setItem('prakalp:selectedProjectId', String(id));
                    selectEngine('unified_cockpit');
                  }} />
                )}
                {activeEngine === 'unified_cockpit' && (
                  <UnifiedCockpitView
                    lang={lang}
                    selectedProjectId={selectedProjectId}
                    onSelectProject={(id) => {
                      setSelectedProjectId(String(id));
                      localStorage.setItem('prakalp:selectedProjectId', String(id));
                    }}
                  />
                )}
                {activeEngine === 'kaal_chakra' && (
                  <KaalChakraView
                    lang={lang}
                    selectedProjectId={selectedProjectId}
                    onSelectProject={(id) => {
                      setSelectedProjectId(String(id));
                      localStorage.setItem('prakalp:selectedProjectId', String(id));
                    }}
                  />
                )}
                {activeEngine === 'vitta_vyuha' && (
                  <VittaVyuhaView
                    lang={lang}
                    onOpenProject={(id) => {
                      setSelectedProjectId(String(id));
                      localStorage.setItem('prakalp:selectedProjectId', String(id));
                      selectEngine('unified_cockpit');
                    }}
                  />
                )}
                {activeEngine === 'pragati_saarthi' && (
                  <PragatiSaarthiView
                    lang={lang}
                    selectedProjectId={selectedProjectId}
                    onSelectProject={(id) => {
                      setSelectedProjectId(String(id));
                      localStorage.setItem('prakalp:selectedProjectId', String(id));
                    }}
                  />
                )}
                {activeEngine === 'benchmark' && <ModelBenchmarkView lang={lang} />}
                {activeEngine === 'agency_index' && (
                  <div className="space-y-6">
                    <GeocodePrecisionPanel lang={lang} />
                    <AgencyIndexView lang={lang} />
                  </div>
                )}
                {activeEngine === 'satya_kavach' && (
                  <SatyaKavachView
                    lang={lang}
                    selectedProjectId={selectedProjectId}
                    onSelectProject={(id) => {
                      setSelectedProjectId(String(id));
                      localStorage.setItem('prakalp:selectedProjectId', String(id));
                      selectEngine('unified_cockpit');
                    }}
                  />
                )}
                {activeEngine === 'artha_nivaran' && (
                  <ArthaNivaranView
                    lang={lang}
                    selectedProjectId={selectedProjectId}
                    onSelectProject={(id) => {
                      setSelectedProjectId(String(id));
                      localStorage.setItem('prakalp:selectedProjectId', String(id));
                      selectEngine('unified_cockpit');
                    }}
                  />
                )}
                {activeEngine === 'setu_varsha' && <SetuVarshaView lang={lang} selectedProjectId={selectedProjectId} />}
                {activeEngine === 'karya_dakshata' && <KaryaDakshataSimulator lang={lang} />}
                </React.Suspense>
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </LoginGate>
  );
}
