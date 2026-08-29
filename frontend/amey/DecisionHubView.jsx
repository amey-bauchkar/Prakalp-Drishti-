import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Clock, GitBranch, DollarSign, FileText, Building2, Sparkles,
  FlaskConical, Search, Layers, Compass, ShieldCheck, ChevronRight,
  Menu, X, ChevronsLeft, ChevronsRight
} from 'lucide-react';
import KaalChakraView from './KaalChakraView';
import VittaVyuhaView from './VittaVyuhaView';
import PragatiSaarthiView from './PragatiSaarthiView';
import UnifiedCockpitView from './UnifiedCockpitView';
import AgencyIndexView from './AgencyIndexView';
import GeocodePrecisionPanel from './GeocodePrecisionPanel';
import ModelBenchmarkView from './ModelBenchmarkView';
import SatyaKavachView from '../src/views/SatyaKavachView';
import ArthaNivaranView from '../src/views/ArthaNivaranView';
import SetuVarshaView from '../src/views/SetuVarshaView';
import KaryaDakshataSimulator from '../src/components/KaryaDakshataSimulator';
import LoginGate from './LoginGate';

// Normalize engine alias to official engine IDs
function normalizeEngine(id) {
  if (!id) return 'unified_cockpit';
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
  };
  return aliasMap[clean] || clean;
}

export default function DecisionHubView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedEngine = normalizeEngine(searchParams.get('engine'));

  const [activeEngine, setActiveEngine] = useState(() => requestedEngine || 'unified_cockpit');
  const [selectedProjectId, setSelectedProjectId] = useState(() => {
    return localStorage.getItem('prakalp:selectedProjectId') || '619092';
  });
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  
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
    }
  }, [searchParams]);

  const selectEngine = (engineId) => {
    setActiveEngine(engineId);
    setSearchParams({ engine: engineId });
    setMobileDrawerOpen(false);
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

  const engines = [
    { id: 'unified_cockpit', label: 'Unified Decision Cockpit', desc: 'Live project risk & impact simulator', icon: Sparkles },
    { id: 'kaal_chakra', label: 'Kaal-Chakra Survival Forecast', desc: 'Realistic timeline & delay forecast', icon: Clock },
    { id: 'vitta_vyuha', label: 'Vitta-Vyuha Linear Reallocation', desc: 'Smart budget allocation & rebalancing', icon: DollarSign },
    { id: 'pragati_saarthi', label: 'Pragati-Saarthi Cabinet Note', desc: 'Executive briefing & audit trail', icon: FileText },
    { id: 'agency_index', label: 'Agency Accountability Index', desc: 'Agency track record & speed ranking', icon: Building2 },
    { id: 'benchmark', label: 'Empirical Model Validation', desc: 'AI vs Statistics, Drivers & Early Warning', icon: FlaskConical },
    { id: 'satya_kavach', label: 'Satya-Kavach Statutory Audit', desc: '20% CCEA threshold anti-gaming & clause 10CC', icon: ShieldCheck },
    { id: 'artha_nivaran', label: 'Artha-Nivaran Contractor 360', desc: 'PSU financial solvency & dispute litigation radar', icon: Search },
    { id: 'setu_varsha', label: 'Setu-Varsha Monsoon Shock', desc: 'Climate shock & systemic contagion war room', icon: Layers },
    { id: 'karya_dakshata', label: 'Karya-Dakshata Allocation', desc: 'Agency efficiency simulator & budget optimizer', icon: Compass },
  ];

  const currentEngineObj = engines.find(e => e.id === activeEngine) || engines[0];

  return (
    <LoginGate>
      <div className="space-y-4 pb-20">
        {/* ── Console masthead + live dossier telemetry ───────────────── */}
        <div className="telemetry justify-between">
          <span className="flex items-center gap-2 flex-wrap">
            <b>DECISION INTELLIGENCE CONSOLE</b>
            <span className="sep">/</span>
            <span>{engines.length} ENGINES</span>
            <span className="sep">/</span>
            <span>2,207 PROJECTS</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>ACTIVE DOSSIER</span>
            <b>#{selectedProjectId}</b>
          </span>
        </div>

        {/* ── Mobile Engine Selector Bar (collapsible drawer toggle) ───── */}
        <div className="lg:hidden panel p-3 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-xs bg-[#0F2B42] text-amber-400 border border-sky-900 flex items-center justify-center shrink-0">
              {React.createElement(currentEngineObj.icon, { className: "w-3.5 h-3.5" })}
            </div>
            <div className="min-w-0">
              <span className="text-[9px] uppercase tracking-wider text-gov-muted block font-bold">Active Engine</span>
              <span className="text-xs font-bold text-gov-navy truncate block">{currentEngineObj.label}</span>
            </div>
          </div>
          <button
            onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
            className="btn-outline text-[11px] py-1.5 px-3 shrink-0"
          >
            {mobileDrawerOpen ? <X className="w-3.5 h-3.5 mr-1" /> : <Menu className="w-3.5 h-3.5 mr-1" />}
            <span>All Engines ({engines.length})</span>
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
                    <span className="truncate">Decision Engines</span>
                  </span>
                )}
                
                {/* << / >> Toggle Button */}
                <button
                  onClick={toggleCollapse}
                  className="p-1 text-gov-muted hover:text-gov-navy hover:bg-gov-surface-3 rounded-xs transition-colors"
                  title={isCollapsed ? "Expand sidebar (>>)" : "Collapse sidebar (<<)"}
                  aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                  {isCollapsed ? (
                    <ChevronsRight className="w-4 h-4 text-gov-accent" />
                  ) : (
                    <ChevronsLeft className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Independently Scrollable Engine List */}
              <nav
                className="overflow-y-auto flex-1 divide-y divide-gov-border"
                role="tablist"
                aria-label="Decision engines"
              >
                {engines.map((eng) => {
                  const Icon = eng.icon;
                  const isActive = activeEngine === eng.id;
                  return (
                    <button
                      key={eng.id}
                      role="tab"
                      aria-selected={isActive}
                      title={isCollapsed ? `${eng.label} — ${eng.desc}` : undefined}
                      onClick={() => selectEngine(eng.id)}
                      className={`engine-tab w-full flex items-center transition-colors cursor-pointer ${
                        isCollapsed ? 'justify-center p-3' : 'items-start gap-3 p-3 text-left'
                      } ${isActive ? 'active' : ''}`}
                    >
                      <span className="engine-tab-icon shrink-0">
                        <Icon className="w-3.5 h-3.5" strokeWidth={2} />
                      </span>

                      {!isCollapsed && (
                        <div className="min-w-0 flex-1">
                          <span className="engine-tab-name block text-[11px] font-extrabold tracking-wide text-gov-navy leading-tight">
                            {eng.label}
                          </span>
                          <span className="engine-tab-desc block text-[10px] text-gov-muted leading-relaxed mt-0.5 whitespace-normal break-words">
                            {eng.desc}
                          </span>
                        </div>
                      )}

                      {!isCollapsed && isActive && (
                        <ChevronRight className="w-3.5 h-3.5 text-amber-400 shrink-0 self-center opacity-80" />
                      )}
                    </button>
                  );
                })}
              </nav>

              <div className={`panel-head border-t border-b-0 py-2 shrink-0 ${isCollapsed ? 'justify-center' : ''}`}>
                {isCollapsed ? (
                  <span className="font-mono text-[9px] text-gov-muted">11</span>
                ) : (
                  <>
                    <span className="panel-meta">CCEA / MoSPI Governed</span>
                    <span className="panel-meta">Admin</span>
                  </>
                )}
              </div>
            </div>
          </aside>

          {/* ══ Wide Content Area on the Right (Flex-1) ══ */}
          <main className="flex-1 min-w-0 space-y-6 w-full">
            {activeEngine === 'unified_cockpit' && (
              <UnifiedCockpitView selectedProjectId={selectedProjectId} onSelectProject={(id) => setSelectedProjectId(id)} />
            )}
            {activeEngine === 'kaal_chakra' && (
              <KaalChakraView selectedProjectId={selectedProjectId} onSelectProject={(id) => setSelectedProjectId(id)} />
            )}
            {activeEngine === 'vitta_vyuha' && <VittaVyuhaView />}
            {activeEngine === 'pragati_saarthi' && <PragatiSaarthiView selectedProjectId={selectedProjectId} />}
            {activeEngine === 'benchmark' && <ModelBenchmarkView />}
            {activeEngine === 'agency_index' && (
              <div className="space-y-6">
                <GeocodePrecisionPanel />
                <AgencyIndexView />
              </div>
            )}
            {activeEngine === 'satya_kavach' && <SatyaKavachView />}
            {activeEngine === 'artha_nivaran' && <ArthaNivaranView />}
            {activeEngine === 'setu_varsha' && <SetuVarshaView selectedProjectId={selectedProjectId} />}
            {activeEngine === 'karya_dakshata' && <KaryaDakshataSimulator />}
          </main>
        </div>
      </div>
    </LoginGate>
  );
}
