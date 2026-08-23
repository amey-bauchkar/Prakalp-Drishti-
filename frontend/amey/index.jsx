import React, { useState, useEffect } from 'react';
import { Clock, GitBranch, DollarSign, FileText, Sparkles, Building2 } from 'lucide-react';
import KaalChakraView from './KaalChakraView';
import SetuGraphView from './SetuGraphView';
import VittaVyuhaView from './VittaVyuhaView';
import PragatiSaarthiView from './PragatiSaarthiView';
import UnifiedCockpitView from './UnifiedCockpitView';
import AgencyIndexView from './AgencyIndexView';

export default function AmeyMasterView() {
  const [activeTab, setActiveTab] = useState('unified_cockpit');
  const [selectedProjectId, setSelectedProjectId] = useState(() => {
    return localStorage.getItem('prakalp:selectedProjectId') || '618402';
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

  const tabs = [
    { id: 'unified_cockpit', label: 'UNIFIED COCKPIT', desc: 'Live Project Risk & Impact Simulator', icon: Sparkles },
    { id: 'kaal_chakra', label: 'KAAL-CHAKRA', desc: 'Realistic Timeline & Delay Forecast', icon: Clock },
    { id: 'setu_graph', label: 'SETU-GRAPH', desc: 'Connected Projects & Delay Ripple Effect', icon: GitBranch },
    { id: 'vitta_vyuha', label: 'VITTA-VYUHA', desc: 'Smart Budget Allocation & Rebalancing', icon: DollarSign },
    { id: 'pragati_saarthi', label: 'PRAGATI-SAARTHI', desc: 'Executive Briefing & Audit Trail', icon: FileText },
    { id: 'agency_index', label: 'AGENCY INDEX', desc: 'Agency Track Record & Speed Ranking', icon: Building2 },
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* Module Navigation Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-gov-border shadow-soft flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[180px] p-3 rounded-xl text-left transition-all flex items-center gap-3 ${
                isActive
                  ? 'bg-gov-navy text-white shadow-elevated'
                  : 'bg-gov-surface hover:bg-gov-muted-surface text-gov-navy border border-gov-border'
              }`}
            >
              <div className={`p-2 rounded-lg ${isActive ? 'bg-gov-accent text-gov-navy' : 'bg-white text-gov-navy shadow-soft'}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-xs uppercase tracking-wider">{tab.label}</span>
                  {isActive && <span className="w-2 h-2 rounded-full bg-gov-accent animate-pulse" />}
                </div>
                <span className={`text-[11px] block mt-0.5 ${isActive ? 'text-gov-muted-light' : 'text-gov-muted'}`}>
                  {tab.desc}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Render Active View */}
      <div className="transition-all">
        {activeTab === 'unified_cockpit' && (
          <UnifiedCockpitView
            selectedProjectId={selectedProjectId}
            onSelectProject={(id) => setSelectedProjectId(id)}
          />
        )}
        {activeTab === 'kaal_chakra' && (
          <KaalChakraView
            selectedProjectId={selectedProjectId}
            onSelectProject={(id) => setSelectedProjectId(id)}
          />
        )}
        {activeTab === 'setu_graph' && (
          <SetuGraphView selectedProjectId={selectedProjectId} />
        )}
        {activeTab === 'vitta_vyuha' && (
          <VittaVyuhaView />
        )}
        {activeTab === 'pragati_saarthi' && (
          <PragatiSaarthiView selectedProjectId={selectedProjectId} />
        )}
        {activeTab === 'agency_index' && (
          <AgencyIndexView />
        )}
      </div>
    </div>
  );
}
