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
        {/* Sleek Engine Tabs Bar without Scrollbar */}
        <div className="flex flex-wrap lg:flex-nowrap items-center justify-between gap-3 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
            {engines.map((eng) => {
              const Icon = eng.icon;
              const isActive = activeEngine === eng.id;
              return (
                <button
                  key={eng.id}
                  onClick={() => setActiveEngine(eng.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-[12.5px] font-bold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-gov-navy text-white shadow-elevated'
                      : 'bg-transparent text-text-secondary hover:text-gov-navy hover:bg-white/80'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-gov-saffron-light' : 'text-slate-400'}`} />
                  <span>{eng.label}</span>
                </button>
              );
            })}
          </div>

          <div className="hidden xl:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs shrink-0 font-mono shadow-subtle mr-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-text-muted font-bold">Active Dossier:</span>
            <strong className="text-gov-navy font-bold">Project #{selectedProjectId}</strong>
          </div>
        </div>

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
