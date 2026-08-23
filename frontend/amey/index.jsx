import React, { useState } from 'react';
import { Clock, GitBranch, DollarSign, FileText, Sparkles, Building2 } from 'lucide-react';
import KaalChakraView from './KaalChakraView';
import SetuGraphView from './SetuGraphView';
import VittaVyuhaView from './VittaVyuhaView';
import PragatiSaarthiView from './PragatiSaarthiView';
import UnifiedCockpitView from './UnifiedCockpitView';
import AgencyIndexView from './AgencyIndexView';

export default function AmeyMasterView() {
  const [activeTab, setActiveTab] = useState('unified_cockpit');
  // 618402 (NH-913 Frontier Highway, Arunachal Pradesh) is a genuinely connected node in
  // SETU-GRAPH's dependency graph (4 real edges within 2 hops), unlike most projects in this
  // portfolio which are isolated -- picked specifically so the causal cockpit's cascade view
  // has something real to show on first load instead of an empty single-node subgraph.
  const [selectedProjectId, setSelectedProjectId] = useState('618402');

  const tabs = [
    { id: 'unified_cockpit', label: 'UNIFIED COCKPIT', desc: 'Causal Loop & Live Simulation', icon: Sparkles },
    { id: 'kaal_chakra', label: 'KAAL-CHAKRA', desc: 'Schedule Survival & Fan Charts', icon: Clock },
    { id: 'setu_graph', label: 'SETU-GRAPH', desc: 'Dependency DAG & Rupee Contagion', icon: GitBranch },
    { id: 'vitta_vyuha', label: 'VITTA-VYUHA', desc: 'Stochastic Capital Allocator', icon: DollarSign },
    { id: 'pragati_saarthi', label: 'PRAGATI-SAARTHI', desc: 'Bilingual Cabinet Review', icon: FileText },
    { id: 'agency_index', label: 'AGENCY INDEX', desc: 'Accountability & Velocity Rank', icon: Building2 },
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
