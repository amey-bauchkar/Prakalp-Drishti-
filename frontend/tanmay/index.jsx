import React, { useState, useEffect } from 'react';
import {
  Scale, ShieldAlert, RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';

import SatyaKavachHeader from './components/SatyaKavachHeader';
import BoundaryKpis from './components/BoundaryKpis';
import BunchingHistogram from './components/BunchingHistogram';
import FlaggedProjectsTable from './components/FlaggedProjectsTable';
import ProjectDossierDrawer from './components/ProjectDossierDrawer';
import { getStoredLanguage } from '../src/lib/i18n';

export default function SatyaKavachMasterView({ selectedProjectId: propProjectId = null, onSelectProject, lang: propLang }) {
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



  return (
    <div className="space-y-6 font-sans text-slate-900 dark:text-slate-100 pb-12">
      {/* 1. Sovereign Command Header */}
      <SatyaKavachHeader
        lang={lang}
        flaggedCount={flagged.length}
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
              {lang === 'hi' ? 'सांविधिक सीसीईए लेखापरीक्षा' : 'Statutory CCEA Audit Screen'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {lang === 'hi' ? (
                <>
                  मैकक्रैरी बंचिंग घनत्व परीक्षण, १९.९% पर कृत्रिम लागत संशोधनों की स्क्रीनिंग और खंड १०सीसी दावों के ऑडिट का सांख्यिकीय मूल्यांकन।
                </>
              ) : (
                <>
                  Statistical evaluation of McCrary bunching density jumps, artificial cost revisions at 19.9%, and Clause 10CC claims.
                </>
              )}
            </p>
            <button
              onClick={fetchAllData}
              className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold font-mono tracking-wider transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              {lang === 'hi' ? 'डेटा पुनः लोड करें' : 'Reload Audit Data'}
            </button>
          </div>

          <div className="w-full max-w-md pt-2">
            <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center space-y-2">
              <div className="w-8 h-8 rounded-lg bg-rose-100/60 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200">
                {lang === 'hi' ? 'सीसीईए २०% सीमा स्क्रीन' : 'CCEA 20% Threshold Screen'}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                {lang === 'hi' ? '[१८%, २०%) स्वीकृति परिहार पट्टी में कृत्रिम बंचिंग का पता लगाता है' : 'Detects artificial bunching in the [18%, 20%) approval avoidance band'}
              </p>
            </div>
          </div>
        </div>
      )}

      {summaryData && !loading && (<>
      {/* 2. Tremor Boundary KPI Cards */}
      <BoundaryKpis summaryData={summaryData} lang={lang} />

      {/* 3. McCrary Bunching Density Histogram & Flagged Projects Table */}
      <div className="space-y-6">
        {/* McCrary Bunching Density Histogram */}
        <BunchingHistogram histogramData={histogramData} lang={lang} />

        {/* Flagged Projects Table */}
        <FlaggedProjectsTable
          lang={lang}
          flaggedProjects={flagged}
          onSelectProject={(id) => {
            if (onSelectProject) {
              onSelectProject(id);
            } else {
              setDrawerProjectId(id);
            }
          }}
        />
      </div>

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
