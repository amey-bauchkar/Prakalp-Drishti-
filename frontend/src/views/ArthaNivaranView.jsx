import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Scale, Gavel } from 'lucide-react';

import SolvencyDirectory from '../../parth/index.jsx';
import NivaranLitigationView from '../../aditya/NivaranView.jsx';
import LoginGate from '../../amey/LoginGate.jsx';

/**
 * Pillar 3 — ARTHA-NIVARAN: contractor 360.
 *
 * Solvency and litigation are one assessment split across two datasets. An
 * agency with a clean balance sheet and eleven live arbitrations is not a safe
 * counterparty, and neither half tells you that on its own.
 */

const TABS = [
  {
    id: 'solvency',
    label: 'Solvency Matrix',
    desc: 'Contractor financial health, debt burden & delay correlations across 2,207 projects',
    icon: Scale,
  },
  {
    id: 'litigation',
    label: 'Nivaran Legal Radar',
    desc: 'Contract disputes, arbitration claims & court stay risks',
    icon: Gavel,
  },
];

export default function ArthaNivaranView() {
  const [tab, setTab] = useState('solvency');

  return (
    <LoginGate>
      <div className="space-y-5 font-sans">
        <nav className="engine-rail" role="tablist" aria-label="Contractor 360 views">
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

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
          >
            {tab === 'solvency' ? <SolvencyDirectory /> : <NivaranLitigationView />}
          </motion.div>
        </AnimatePresence>
      </div>
    </LoginGate>
  );
}
