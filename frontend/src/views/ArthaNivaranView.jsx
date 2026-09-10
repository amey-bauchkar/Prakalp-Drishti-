import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Scale, Gavel } from 'lucide-react';

import SolvencyDirectory from '../../parth/index.jsx';
import NivaranLitigationView from '../../aditya/NivaranView.jsx';
import LoginGate from '../../amey/LoginGate.jsx';
import { getStoredLanguage } from '../lib/i18n';

/**
 * Pillar 3 — ARTHA-NIVARAN: contractor 360.
 */

export default function ArthaNivaranView({ selectedProjectId = null, lang: propLang }) {
  const [lang, setLang] = useState(() => propLang || getStoredLanguage());
  useEffect(() => { if (propLang) setLang(propLang); }, [propLang]);
  useEffect(() => {
    const onLang = (e) => setLang(e.detail || getStoredLanguage());
    window.addEventListener('prakalp:languageChanged', onLang);
    return () => window.removeEventListener('prakalp:languageChanged', onLang);
  }, []);
  const isHi = lang === 'hi';

  const TABS = [
    {
      id: 'solvency',
      label: isHi ? 'शोधनक्षमता मैट्रिक्स' : 'Solvency Matrix',
      desc: isHi 
        ? '2,207 परियोजनाओं में संविदाकार वित्तीय स्वास्थ्य, ऋण भार एवं विलंब सहसंबंध' 
        : 'Contractor financial health, debt burden & delay correlations across 2,207 projects',
      icon: Scale,
    },
    {
      id: 'litigation',
      label: isHi ? 'निवारण विधिक राडार' : 'Nivaran Legal Radar',
      desc: isHi 
        ? 'अनुबंध विवाद, मध्यस्थता दावे एवं न्यायालय स्थगन जोखिम' 
        : 'Contract disputes, arbitration claims & court stay risks',
      icon: Gavel,
    },
  ];

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
            {tab === 'solvency' 
              ? <SolvencyDirectory selectedProjectId={selectedProjectId} lang={lang} /> 
              : <NivaranLitigationView lang={lang} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </LoginGate>
  );
}
