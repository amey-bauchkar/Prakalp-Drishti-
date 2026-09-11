import React, { useState, useEffect } from 'react';
import { Scale, ShieldAlert, CheckCircle2, Landmark, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { getStoredLanguage } from '../../src/lib/i18n';

export default function SatyaKavachHeader({ flaggedCount = 28, onRefresh, loading, hasData = true, lang: propLang }) {
  const [lang, setLang] = useState(() => propLang || getStoredLanguage());

  useEffect(() => {
    if (propLang) setLang(propLang);
  }, [propLang]);

  useEffect(() => {
    const onLang = (e) => setLang(e.detail || getStoredLanguage());
    window.addEventListener('prakalp:languageChanged', onLang);
    return () => window.removeEventListener('prakalp:languageChanged', onLang);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 shadow-xl border border-slate-700 relative overflow-hidden flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
    >
      <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
        <Scale className="w-48 h-48 text-amber-500" />
      </div>

      <div className="space-y-3 max-w-3xl relative z-10">
        <div className="inline-flex items-center gap-2 pl-2 pr-2.5 py-0.5 rounded-sm bg-white/10 text-[10px] font-extrabold tracking-widest uppercase text-amber-400 border-l-2 border-amber-400">
          <Scale className="w-3.5 h-3.5 text-white" />
          <span>
            {lang === 'hi'
              ? 'मॉड्यूल २ · सांविधिक सीसीईए सीमांत लेखापरीक्षा एवं वित्तीय सत्यनिष्ठा'
              : 'MODULE 2 · STATUTORY CCEA BOUNDARY AUDIT & FINANCIAL INTEGRITY'}
          </span>
        </div>

        <h2 className="font-heading font-extrabold text-[24px] sm:text-[32px] tracking-tight text-white leading-tight flex items-center gap-3">
          {lang === 'hi' ? 'सत्य-कवच सिमुलेटर' : 'SATYA-KAVACH Simulator'}
          <span className="text-xs font-normal font-sans text-slate-300 py-1 px-2.5 rounded-md bg-white/10 border border-white/15">
            {lang === 'hi' ? 'SATYA-KAVACH' : 'सत्य-कवच'}
          </span>
        </h2>

        <p className="text-sm text-slate-300 leading-relaxed font-sans max-w-2xl">
          {lang === 'hi' ? (
            <>
              सांख्यिकीय स्क्रीनिंग इंजन जो <strong>२०% मंत्रिमंडल स्वीकृति सीमा</strong> के ठीक नीचे कृत्रिम लागत-वृद्धि सीमांकन का पता लगाता है। मैकक्रैरी बंचिंग घनत्व परीक्षण का मूल्यांकन करता है और सीपीडब्ल्यूडी जीसीसी खंड १०सीसी मूल्य वृद्धि का ऑडिट करता है।
            </>
          ) : (
            <>
              Statistical screen for whether cost revisions cluster just below the <strong>20% Cabinet re-approval threshold</strong>. Runs a McCrary (2008) density-discontinuity test at the cutoff and audits CPWD GCC Clause 10CC price variations against the statutory formula. A discontinuity would show the threshold shapes where revisions land; it would not show intent.
            </>
          )}
        </p>

        <div className="pt-2 flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-600 text-xs text-slate-200 font-mono">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            {lang === 'hi' ? (
              <><strong>२,२०७ मुख्य परियोजना संवर्ग</strong> पर मूल्यांकित (१,१८३ सक्रिय संशोधित)</>
            ) : (
              <>Evaluated on <strong>2,207 Master Project Corpus</strong> (1,183 active revised)</>
            )}
          </span>

          {hasData && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-xs text-amber-300 font-mono">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              {lang === 'hi' ? (
                <><strong>{flaggedCount} परियोजनाएं</strong> [१८%, २०%) निकटता पट्टी में चिह्नित</>
              ) : (
                <><strong>{flaggedCount} Projects</strong> flagged in [18%, 20%) proximity band</>
              )}
            </span>
          )}
        </div>
      </div>

      {onRefresh && (
        <div className="shrink-0 w-full lg:w-auto relative z-10">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="w-full lg:w-auto min-w-[270px] bg-slate-100 hover:bg-indigo-600 text-slate-800 hover:text-white border-2 border-slate-300 hover:border-indigo-600 font-extrabold py-3.5 px-6 rounded-xl text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-200 shadow-xs hover:shadow-lg hover:shadow-indigo-500/25 cursor-pointer disabled:opacity-50 group"
          >
            <Scale className="w-4 h-4 text-indigo-600 group-hover:text-white transition-colors" />
            <span>
              {loading
                ? (lang === 'hi' ? 'लेखापरीक्षा जारी…' : 'Auditing Portfolios…')
                : (lang === 'hi' ? 'न्यायालयिक लेखापरीक्षा चलाएं' : 'Execute Forensic Audit')}
            </span>
          </button>
        </div>
      )}
    </motion.div>
  );
}
