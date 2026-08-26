import React, { useState, useEffect } from 'react';
import {
  Clock, GitBranch, DollarSign, FileText, Building2, Sparkles,
  FlaskConical, Search, Layers, Compass, ShieldCheck
} from 'lucide-react';
import KaalChakraView from './KaalChakraView';
import SetuGraphView from './SetuGraphView';
import VittaVyuhaView from './VittaVyuhaView';
import PragatiSaarthiView from './PragatiSaarthiView';
import UnifiedCockpitView from './UnifiedCockpitView';
import AgencyIndexView from './AgencyIndexView';
import GeocodePrecisionPanel from './GeocodePrecisionPanel';
import ModelBenchmarkView from './ModelBenchmarkView';
import LoginGate from './LoginGate';

export default function DecisionHubView() {
  const [activeEngine, setActiveEngine] = useState('unified_cockpit');
  const [selectedProjectId, setSelectedProjectId] = useState(() => {
    return localStorage.getItem('prakalp:selectedProjectId') || '619092';
  });

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
    { id: 'setu_graph', label: 'Setu-Graph Dependency Contagion', desc: 'Connected projects & delay ripple effect', icon: GitBranch },
    { id: 'vitta_vyuha', label: 'Vitta-Vyuha Linear Reallocation', desc: 'Smart budget allocation & rebalancing', icon: DollarSign },
    { id: 'pragati_saarthi', label: 'Pragati-Saarthi Cabinet Note', desc: 'Executive briefing & audit trail', icon: FileText },
    { id: 'agency_index', label: 'Agency Accountability Index', desc: 'Agency track record & speed ranking', icon: Building2 },
    { id: 'benchmark', label: 'Empirical Model Validation', desc: 'AI vs Statistics, Drivers & Early Warning', icon: FlaskConical },
  ];

  return (
    <LoginGate>
      <div className="space-y-6 pb-20">
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

        {/* Engine register.
            Was a horizontally-scrolling strip of rounded pill buttons on a
            tinted bar, where the labels truncated and the active state relied
            on a drop shadow. Engines now occupy a shared hairline lattice as
            one continuous selector: each cell carries its full name and its
            function, and the active engine is held on the deep ground with a
            gold edge. Nothing scrolls out of reach. */}
        <nav className="engine-rail" role="tablist" aria-label="Decision engines">
          {engines.map((eng) => {
            const Icon = eng.icon;
            const isActive = activeEngine === eng.id;
            return (
              <button
                key={eng.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveEngine(eng.id)}
                className={`engine-tab ${isActive ? 'active' : ''}`}
              >
                <span className="engine-tab-icon">
                  <Icon className="w-3.5 h-3.5" strokeWidth={2} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="engine-tab-name">{eng.label}</span>
                  <span className="engine-tab-desc">{eng.desc}</span>
                </span>
              </button>
            );
          })}
        </nav>

        {/* Active Engine View (Clean, Direct Rendering) */}
        <div>
          {activeEngine === 'unified_cockpit' && (
            <UnifiedCockpitView selectedProjectId={selectedProjectId} onSelectProject={(id) => setSelectedProjectId(id)} />
          )}
          {activeEngine === 'kaal_chakra' && (
            <KaalChakraView selectedProjectId={selectedProjectId} onSelectProject={(id) => setSelectedProjectId(id)} />
          )}
          {activeEngine === 'setu_graph' && (
            <SetuGraphView selectedProjectId={selectedProjectId} />
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
        </div>
      </div>
    </LoginGate>
  );
}
