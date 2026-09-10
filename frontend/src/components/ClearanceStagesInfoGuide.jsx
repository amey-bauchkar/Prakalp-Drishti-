import React, { useState } from 'react';
import { 
  TreePine, Globe2, ShieldAlert, Landmark, RotateCcw, 
  Info, ChevronDown, ChevronUp, CheckCircle2, Clock, 
  FileCheck, AlertTriangle, ArrowRight, ExternalLink
} from 'lucide-react';

/**
 * Educational & Institutional Guide: What Different Statutory Clearance Stages Mean
 * Explains Forest Stage-I/II, Environmental Clearance (EIA), Wildlife (NBWL), 
 * Land Handover (RFCTLARR), and the Regulatory Stagnation Index (RSI).
 */

const CLEARANCE_STAGES_INFO = [
  {
    id: 'forest',
    title: 'Forest Clearance (Stage-I & Stage-II)',
    code: 'FCA 1980 / Rule 11',
    sla: '120 Days SLA',
    authority: 'MoEFCC Integrated Regional Office (IRO) & State Forest Dept',
    icon: TreePine,
    colorClass: 'emerald',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    borderClass: 'border-l-emerald-500',
    summary: 'Legal authorization to divert reserved or protected forest land for non-forestry infrastructure projects.',
    keyPoints: [
      {
        term: 'Stage-I (In-Principle Sanction)',
        detail: 'MoEFCC reviews project alignment viability and sets mandatory pre-conditions: identification of equivalent non-forest land for Compensatory Afforestation (CA), payment of Net Present Value (NPV) into the State CAMPA account, and obtaining Forest Rights Act (FRA 2006) Gram Sabha certificates.'
      },
      {
        term: 'Stage-II (Final Legal Approval)',
        detail: 'Granted only after 100% verification of Stage-I compliance reports. Authorizes formal tree-felling orders and legal possession of the forest corridor for contractor civil mobilization under Rule 11.'
      },
      {
        term: 'Primary Risk',
        detail: 'Failure by state revenue authorities to transfer undisputed CA land parcels triggers severe project deadlocks (>12 months).'
      }
    ]
  },
  {
    id: 'environment',
    title: 'Environmental Clearance (EC)',
    code: 'EIA Notification 2006',
    sla: '105 Days SLA',
    authority: 'Expert Appraisal Committee (EAC) / SEIAA via PARIVESH Portal',
    icon: Globe2,
    colorClass: 'blue',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
    borderClass: 'border-l-blue-500',
    summary: 'Mandatory environmental sustainability appraisal evaluating pollution, ecology, and community impacts.',
    keyPoints: [
      {
        term: '4-Stage Appraisal Cycle',
        detail: 'Category A/B projects undergo: (1) Screening, (2) Scoping by EAC to prescribe Terms of Reference (ToR), (3) Public Consultations organized by State Pollution Control Boards (SPCB), and (4) Final Appraisal.'
      },
      {
        term: 'Environmental Management Plan (EMP)',
        detail: 'Project proponent commits to binding environmental mitigations (air/water quality, noise barriers, green belts, fly ash utilization).'
      },
      {
        term: 'Primary Risk',
        detail: 'Public hearing litigation in the National Green Tribunal (NGT) or incomplete baseline seasonal data can stall issuance by 6–18 months.'
      }
    ]
  },
  {
    id: 'wildlife',
    title: 'Wildlife Clearance (NBWL)',
    code: 'Wildlife Protection Act 1972',
    sla: '90 Days SLA',
    authority: 'National Board for Wildlife (SC-NBWL) & State CWLW',
    icon: ShieldAlert,
    colorClass: 'amber',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
    borderClass: 'border-l-amber-500',
    summary: 'Mandatory protection clearance for alignments crossing within or adjacent to ecologically sensitive zones.',
    keyPoints: [
      {
        term: 'Eco-Sensitive Zone (ESZ) Mandate',
        detail: 'Enforced for any project situated within a National Park, Wildlife Sanctuary, Tiger Reserve, or their designated 10-km Eco-Sensitive buffer zones.'
      },
      {
        term: 'Two-Tier Scrutiny',
        detail: 'Requires recommendation from the State Chief Wildlife Warden and State Board for Wildlife (SBWL), followed by formal sanction from the Standing Committee of the National Board for Wildlife (SC-NBWL).'
      },
      {
        term: 'Primary Risk',
        detail: 'Requirements for wildlife underpasses/eco-ducts can require structural redesign and inter-agency consensus delays.'
      }
    ]
  },
  {
    id: 'land',
    title: 'Land Acquisition & Handover',
    code: 'RFCTLARR Act 2013',
    sla: '180 Days SLA',
    authority: 'Competent Authority Land Acquisition (CALA) & State Revenue Dept',
    icon: Landmark,
    colorClass: 'indigo',
    badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    borderClass: 'border-l-indigo-500',
    summary: 'Statutory acquisition and disbursement of fair compensation for physical unencumbered Right of Way (RoW).',
    keyPoints: [
      {
        term: 'Key Statutory Notifications',
        detail: 'Proceeds from Section 4 (Social Impact Assessment), Section 11 (Preliminary Notification of intent), to Section 19 (Formal Declaration of Acquisition).'
      },
      {
        term: '80% Handover Prerequisite',
        detail: 'Section 23 Award must be declared and at least 80% compensation disbursed to landholders before physical possession can be handed over to civil contractors.'
      },
      {
        term: 'Primary Risk',
        detail: 'Commencing work without unencumbered land is the #1 trigger for contractor arbitration and idle machinery claims.'
      }
    ]
  },
  {
    id: 'rsi',
    title: 'Regulatory Stagnation Index (RSI) & Loopbacks',
    code: 'Mathematical Delay Metric',
    sla: 'RSI > 1.0× Overdue',
    authority: 'MoSPI PMO PRAGATI Central Sector Monitoring Engine',
    icon: RotateCcw,
    colorClass: 'rose',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
    borderClass: 'border-l-rose-500',
    summary: 'Quantifies bureaucratic friction and detects central-state query ping-pong before projects fail.',
    keyPoints: [
      {
        term: 'RSI Stagnation Metric',
        detail: 'Calculated as Elapsed Days Pending ÷ Statutory Benchmark SLA. An RSI of 1.5× indicates a 50% time overrun, while >2.5× triggers automatic PMO PRAGATI escalation.'
      },
      {
        term: 'Query Loopback (EDS/ADS)',
        detail: 'Occurs when Central ministries return proposals with Essential Details Sought (EDS) or Additional Details Sought (ADS) due to incomplete State ground surveys, cycling files repeatedly without approval.'
      },
      {
        term: 'Capital Contagion Impact',
        detail: 'Each month of clearance stagnation locks up capital, escalating contractor financing costs by ~0.85% of sanctioned capex per month.'
      }
    ]
  }
];

export default function ClearanceStagesInfoGuide({ defaultOpen = true, className = '' }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [activeTab, setActiveTab] = useState('forest');

  const selectedStage = CLEARANCE_STAGES_INFO.find((s) => s.id === activeTab) || CLEARANCE_STAGES_INFO[0];
  const IconComponent = selectedStage.icon;

  return (
    <div className={`rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs ${className}`}>
      {/* Accordion Header / Title Bar */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="w-full text-left p-4 bg-gradient-to-r from-slate-50 via-white to-slate-50 border-b border-slate-200 flex items-center justify-between cursor-pointer select-none hover:bg-slate-100/60 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#0060B6]/10 border border-[#0060B6]/20 flex items-center justify-center text-[#0060B6]">
            <Info className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-extrabold text-sm text-slate-900 tracking-tight">
                Statutory Clearance Framework: What Different Stage Clearances Mean
              </h3>
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 text-blue-900 border border-blue-200">
                PARIVESH Regulatory Guide
              </span>
            </div>
            <p className="text-[11.5px] text-slate-500 mt-0.5">
              Citizen's charter benchmark timelines, legal mandates, and approval steps for Central Sector infrastructure.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
          <span className="hidden md:inline text-[11px] font-mono text-slate-400">
            {isOpen ? 'Collapse guide' : 'Expand guide'}
          </span>
          <span
            aria-hidden="true"
            className="p-1.5 rounded-md text-slate-500 transition-colors"
          >
            {isOpen ? <ChevronUp className="w-4 h-4 text-[#0060B6]" /> : <ChevronDown className="w-4 h-4" />}
          </span>
        </div>
      </button>

      {/* Expandable Guide Body */}
      {isOpen && (
        <div className="p-4 sm:p-5 space-y-5 bg-slate-50/40">
          
          {/* Stage Selector Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {CLEARANCE_STAGES_INFO.map((stage) => {
              const Icon = stage.icon;
              const isActive = activeTab === stage.id;

              return (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => setActiveTab(stage.id)}
                  className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isActive
                      ? 'bg-white border-[#0060B6] ring-1 ring-[#0060B6] shadow-xs'
                      : 'bg-white/80 border-slate-200 hover:border-slate-300 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#0060B6]' : 'text-slate-500'}`} />
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                      {stage.sla}
                    </span>
                  </div>
                  <span className={`text-xs font-bold truncate block ${isActive ? 'text-slate-900' : 'text-slate-700'}`}>
                    {stage.title.split('(')[0].trim()}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 block mt-0.5 truncate">
                    {stage.code}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Detailed Card for Active Selected Stage */}
          <div className={`p-4 sm:p-5 rounded-xl bg-white border border-slate-200 border-l-4 ${selectedStage.borderClass} shadow-xs space-y-4`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-800 shrink-0">
                  <IconComponent className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-heading font-extrabold text-sm sm:text-base text-slate-900">
                    {selectedStage.title}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 flex-wrap mt-0.5">
                    <span className="font-mono font-semibold text-slate-700">{selectedStage.code}</span>
                    <span>•</span>
                    <span>Nodal Authority: <strong className="text-slate-800">{selectedStage.authority}</strong></span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold border ${selectedStage.badgeClass}`}>
                  {selectedStage.sla}
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-[13px] text-slate-700 leading-relaxed font-sans">
              {selectedStage.summary}
            </p>

            {/* Three key breakdown points */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              {selectedStage.keyPoints.map((pt, pIdx) => (
                <div key={pIdx} className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="font-bold text-[11.5px] text-slate-900">{pt.term}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {pt.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Institutional Footnote */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-[11px] text-slate-500 font-mono">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Timelines benchmarked against MoEFCC Citizen's Charter &amp; Cabinet Committee on Infrastructure (CCI) guidelines.</span>
            </div>
            <span className="font-bold text-slate-700">PARIVESH 2.0 Real-Time Synchronized</span>
          </div>

        </div>
      )}
    </div>
  );
}
