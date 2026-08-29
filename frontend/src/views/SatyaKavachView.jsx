import React, { useState } from 'react';
import { ShieldCheck, Scale, FileWarning, Landmark, Info } from 'lucide-react';

import FinancialIntegrityView from '../../tanmay/index.jsx';
import AnumatiClearancesPanel from './AnumatiClearancesPanel.jsx';

/**
 * Pillar 2 — SATYA-KAVACH: statutory audit and regulatory integrity.
 *
 * Two sub-views under one portal because they answer the same governance
 * question from opposite ends: financial integrity asks whether the money was
 * declared honestly, regulatory clearances ask whether the permissions were
 * obtained at all. A project can pass one and fail the other, and an officer
 * assessing statutory compliance needs both in the same place.
 */

const TABS = [
  {
    id: 'financial',
    label: 'Financial Integrity',
    desc: 'CCEA Boundary Analysis · Project Revision Inspection',
    icon: Scale,
  },
  {
    id: 'clearances',
    label: 'Regulatory Clearances',
    desc: 'PARIVESH Stage-I/II · forest, wildlife, environment',
    icon: Landmark,
  },
];

export default function SatyaKavachView() {
  const [tab, setTab] = useState('financial');

  return (
    <div className="space-y-5 font-sans">
      <div className="command-header p-5 sm:p-6">
        <div className="inline-flex items-center gap-2 pl-2 pr-2.5 py-0.5 rounded-sm bg-white/[0.07] text-[9.5px] font-extrabold tracking-institutional uppercase text-gov-accent border-l-2 border-gov-accent">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>PILLAR 2 · STATUTORY AUDIT</span>
        </div>
        <h2 className="font-heading font-extrabold text-[21px] sm:text-[25px] tracking-[-0.025em] text-white leading-[1.12] mt-2">
          SATYA-KAVACH: STATUTORY AUDIT &amp; REGULATORY INTEGRITY
        </h2>
        <p className="text-[12.5px] text-ink-200 leading-relaxed max-w-2xl mt-1.5">
          Cost-revision behaviour audited against the 20% CCEA reappraisal threshold and
          the CPWD Clause 10CC escalable cap, alongside the PARIVESH clearance pipeline
          that gates whether the work could lawfully begin.
        </p>
      </div>

      <nav className="engine-rail" role="tablist" aria-label="Statutory audit views">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.id)}
              className={`engine-tab ${active ? 'active' : ''}`}
            >
              <span className="engine-tab-icon"><Icon className="w-3.5 h-3.5" strokeWidth={2} /></span>
              <span className="min-w-0 flex-1">
                <span className="engine-tab-name">{t.label}</span>
                <span className="engine-tab-desc">{t.desc}</span>
              </span>
            </button>
          );
        })}
      </nav>

      {tab === 'financial' ? <FinancialIntegrityView /> : <AnumatiClearancesPanel />}
    </div>
  );
}
