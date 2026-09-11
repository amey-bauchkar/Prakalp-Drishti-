import React, { useState, useEffect } from 'react';
import {
  Scale, ShieldAlert, BarChart3, Calculator, Trees, RefreshCw,
  SlidersHorizontal, CheckCircle2, AlertTriangle, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import SatyaKavachHeader from './components/SatyaKavachHeader';
import BoundaryKpis from './components/BoundaryKpis';
import BunchingHistogram from './components/BunchingHistogram';
import FlaggedProjectsTable from './components/FlaggedProjectsTable';
import ProjectDossierDrawer from './components/ProjectDossierDrawer';
import Clause10CCSimulator from './components/Clause10CCSimulator';
import AnumatiClearancesView from './components/AnumatiClearancesView';
import { getStoredLanguage } from '../src/lib/i18n';

export default function SatyaKavachMasterView({ selectedProjectId: propProjectId = null, onSelectProject, lang: propLang }) {
  const [activeTab, setActiveTab] = useState('audit'); // 'audit' | 'simulator' | 'clearances'
  const [summaryData, setSummaryData] = useState(null);
  const [histogramData, setHistogramData] = useState(null);
  const [loading, setLoading] = useState(false);
  // Drawer must ONLY open when an officer explicitly clicks a project row in the table, NEVER automatically on tab mount
  const [drawerProjectId, setDrawerProjectId] = useState(null);
  const [lang, setLang] = useState(() => propLang || getStoredLanguage());

  useEffect(() => {
    if (propLang) setLang(propLang);
  }, [propLang]);

  useEffect(() => {
    const onLang = (e) => setLang(e.detail || getStoredLanguage());
    window.addEventListener('prakalp:languageChanged', onLang);
    return () => window.removeEventListener('prakalp:languageChanged', onLang);
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [sumRes, histRes] = await Promise.all([
        fetch('/api/tanmay/pattern-analysis'),
        fetch('/api/tanmay/bunching-histogram'),
      ]);

      const [sum, hist] = await Promise.all([
        sumRes.ok ? sumRes.json() : null,
        histRes.ok ? histRes.json() : null,
      ]);

      setSummaryData(sum);
      setHistogramData(hist);
    } catch (e) {
      console.error('Failed to load Satya-Kavach data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const flagged = summaryData?.flagged_sample_projects || [];

  const tabs = [
    {
      id: 'audit',
      label: 'CCEA Threshold Audit & Bunching Screen',
      hindi: 'सीमांत परीक्षण एवं बंचिंग स्क्रीनिंग',
      icon: Scale,
      badge: lang === 'hi' ? `${flagged.length} चिह्नित` : `${flagged.length} Flagged`
    },
    {
      id: 'simulator',
      label: 'Clause 10CC Escalation Lab',
      hindi: 'खंड १०सीसी मूल्य वृद्धि सिमुलेटर',
      icon: Calculator,
      badge: lang === 'hi' ? 'सीपीडब्ल्यूडी ८५% मॉडल' : 'CPWD 85% Model'
    },
    {
      id: 'clearances',
      label: 'ANUMATI Clearance Bottlenecks',
      hindi: 'अनुमति वैधानिक अनुमोदन',
      icon: Trees,
      badge: lang === 'hi' ? 'परिवेश एसएलए' : 'PARIVESH SLA'
    }
  ];

  return (
    <div className="space-y-6 font-sans text-slate-900 dark:text-slate-100 pb-12">
      {/* 1. Sovereign Command Header */}
      <SatyaKavachHeader
        lang={lang}
        flaggedCount={flagged.length}
        onRefresh={fetchAllData}
        loading={loading}
        hasData={Boolean(summaryData)}
      />

      {/* Loading State */}
      {loading && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-12 flex flex-col items-center justify-center text-center space-y-4 min-h-[360px]">
          <RefreshCw className="w-12 h-12 text-indigo-600 animate-spin" />
          <div className="space-y-1">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider font-mono">
              {lang === 'hi'
                ? 'सीसीईए फॉरेंसिक ऑडिट एवं बंचिंग स्क्रीनिंग जारी…'
                : 'Executing CCEA Forensic Audit & Bunching Screen…'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {lang === 'hi'
                ? '१९.९% लागत सीमा बंचिंग और सीपीडब्ल्यूडी खंड १०सीसी विचलन के लिए २,२०७ परियोजनाओं की स्क्रीनिंग'
                : 'Screening 2,207 projects for 19.9% cost threshold bunching and CPWD Clause 10CC variances'}
            </p>
          </div>
        </div>
      )}

      {/* Empty State Hero */}
      {!summaryData && !loading && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm p-8 sm:p-12 flex flex-col items-center justify-center text-center space-y-6 min-h-[440px]">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-xs">
            <Scale className="w-8 h-8" />
          </div>
          <div className="max-w-md space-y-2">
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              {lang === 'hi' ? 'सांविधिक सीसीईए लेखापरीक्षा हेतु तैयार' : 'Ready to Execute Statutory CCEA Audit'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {lang === 'hi' ? (
                <>
                  २०% सीमा पर मैकक्रैरी घनत्व-असांतत्य परीक्षण चलाने, [१८%, २०%) पट्टी में संशोधनों की गणना करने और खंड १०सीसी दावों के ऑडिट के लिए ऊपर <strong className="text-slate-700 dark:text-slate-300">"न्यायालयिक लेखापरीक्षा चलाएं"</strong> पर क्लिक करें।
                </>
              ) : (
                <>
                  Click <strong className="text-slate-700 dark:text-slate-300">"EXECUTE FORENSIC AUDIT"</strong> above to run the McCrary density-discontinuity test at the 20% threshold, count revisions landing in the [18%, 20%) band, and audit Clause 10CC claims.
                </>
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl pt-2">
            <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center space-y-2">
              <div className="w-8 h-8 rounded-lg bg-rose-100/60 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200">
                {lang === 'hi' ? 'सीसीईए २०% सीमा स्क्रीन' : 'CCEA 20% Threshold Screen'}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                {lang === 'hi' ? '२०% सीसीईए सीमा पर घनत्व-असांतत्य का परीक्षण करता है; अभिप्राय का निष्कर्ष नहीं निकालता' : 'Tests for a density discontinuity at the 20% CCEA threshold; does not infer intent'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center space-y-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-100/60 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 flex items-center justify-center">
                <Calculator className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200">
                {lang === 'hi' ? 'खंड १०सीसी मूल्य वृद्धि लैब' : 'Clause 10CC Escalation Lab'}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                {lang === 'hi' ? 'कच्चे माल में सीपीडब्ल्यूडी सांविधिक मूल्य विचलन सूत्रों का ऑडिट करता है' : 'Audits CPWD statutory price variation formulas across raw materials'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100/60 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                <Trees className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200">
                {lang === 'hi' ? 'अनुमति क्लीयरेंस ट्रैकर' : 'ANUMATI Clearance Tracker'}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                {lang === 'hi' ? 'एमओईएफसीसी स्टेज-I/II और परिवेश सांविधिक स्वीकृतियों की निगरानी करता है' : 'Monitors MoEFCC Stage-I/II and PARIVESH statutory clearances'}
              </p>
            </div>
          </div>
        </div>
      )}

      {summaryData && !loading && (<>
      {/* 2. Tremor Boundary KPI Cards */}
      <BoundaryKpis summaryData={summaryData} lang={lang} />

      {/* 3. Fluid Animated Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 rounded-xl border border-slate-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-white text-slate-900 shadow-sm font-bold border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-amber-500' : 'text-slate-400'}`} />
              <div className="text-left">
                <span className="block leading-tight font-heading font-bold">
                  {lang === 'hi' ? tab.hindi : tab.label}
                </span>
                <span className="text-[10px] text-slate-400 font-mono hidden sm:block">
                  {lang === 'hi' ? tab.label : tab.hindi}
                </span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                isActive
                  ? 'bg-amber-100 text-amber-800 border border-amber-200 font-bold'
                  : 'bg-slate-200 text-slate-600'
              }`}>
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* 4. Active Tab Content with Smooth Animated Switch */}
      <AnimatePresence mode="wait">
        {activeTab === 'audit' && (
          <motion.div
            key="audit"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* McCrary Bunching Density Histogram */}
            <BunchingHistogram histogramData={histogramData} lang={lang} />

            {/* Flagged Projects Table */}
            <FlaggedProjectsTable
              lang={lang}
              flaggedProjects={flagged}
              onSelectProject={(id) => {
                setDrawerProjectId(id);
                if (onSelectProject) onSelectProject(id);
              }}
            />
          </motion.div>
        )}

        {activeTab === 'simulator' && (
          <motion.div
            key="simulator"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Clause10CCSimulator lang={lang} />
          </motion.div>
        )}

        {activeTab === 'clearances' && (
          <motion.div
            key="clearances"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <AnumatiClearancesView lang={lang} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. Slide-over Project Inspector Dossier Drawer — only renders on explicit project row click */}
      {drawerProjectId && (
        <ProjectDossierDrawer
          lang={lang}
          projectId={drawerProjectId}
          onClose={() => setDrawerProjectId(null)}
        />
      )}
      </>)}
    </div>
  );
}
