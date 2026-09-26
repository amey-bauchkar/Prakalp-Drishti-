import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { apiFetch } from './authClient';
import { FileText, ShieldCheck, CheckCircle2, Globe, ArrowRight, X, Database, Lock, Sparkles, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Text, Metric } from '@tremor/react';
import ProjectCombobox from '../src/components/ProjectCombobox';
import {
  toHindiDigits,
  formatHindiTimestamp,
  translateFactLabel,
  translateFactValue,
  translateReportText,
  translateAgencyName,
  DRAWER_I18N,
} from './pragatiSaarthiHindi';

export default function PragatiSaarthiView({ selectedProjectId = "618402", onSelectProject }) {
  const [tamperState, setTamperState] = useState({ kind: 'idle' });
  const [projectId, setProjectId] = useState(selectedProjectId);
  const [searchInput, setSearchInput] = useState("");
  const [projectList, setProjectList] = useState([]);

  // Report-specific language state: switching language inside Pragati Saarthi
  // affects ONLY the report content. The rest of the site (navbars, sidebars, buttons, etc.)
  // strictly remains in English.
  const [reportLang, setReportLang] = useState('en');
  const isHiReport = reportLang === 'hi';

  const handleLanguageSwitch = (newLang) => {
    setReportLang(newLang);
    // Explicitly isolated to this report — do NOT dispatch 'prakalp:languageChanged'
  };

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeFact, setActiveFact] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [denied, setDenied] = useState(null);
  const [copiedHash, setCopiedHash] = useState(null);

  const formatHash = (hash) => {
    if (!hash || hash === 'N/A') return 'N/A';
    return `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`;
  };

  const handleCopy = (hash, id) => {
    if (!hash || hash === 'N/A') return;
    navigator.clipboard.writeText(hash);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const fetchBriefing = async (id) => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/amey/briefing/${id}`);
      if (res.ok) { setData(res.data); setDenied(null); }
      else { setData(null); setDenied(res.error); }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch('/api/projects?limit=2207')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setProjectList(data);
      })
      .catch(err => console.error("Failed to load project list", err));
  }, []);

  // Sync with prop when selected externally (e.g. from Early Warning Queue)
  useEffect(() => {
    if (selectedProjectId && selectedProjectId !== projectId) {
      setProjectId(selectedProjectId);
    }
  }, [selectedProjectId]);

  // Auto-fetch briefing when projectId changes
  useEffect(() => {
    if (projectId) {
      fetchBriefing(projectId);
    }
  }, [projectId]);

  const handleOpenFact = (fact) => {
    setActiveFact(fact);
    setTamperState({ kind: 'idle' });
    setDrawerOpen(true);
  };

  // Lock body scroll and handle ESC key while drawer is open
  useEffect(() => {
    if (!drawerOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [drawerOpen]);

  return (
    <div className="space-y-8 font-sans relative pb-10">
      {/* ═══════════════════════════════════════════════════════════════
          TOP BANNER (SOVEREIGN INSTITUTIONAL COMMAND HEADER)
          Dashboard controls, header, and buttons remain in English.
          ═══════════════════════════════════════════════════════════════ */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="p-6 sm:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 shadow-xl border border-slate-700 relative overflow-visible z-30"
      >
        <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <FileText className="w-48 h-48 text-amber-500" />
          </div>
        </div>
        <div className="space-y-3 max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 pl-2 pr-2.5 py-0.5 rounded-sm bg-white/10 text-[10px] font-extrabold tracking-institutional uppercase text-amber-400 border-l-2 border-amber-400">
            <FileText className="w-3.5 h-3.5 text-white" />
            <span>EXECUTIVE GOVERNANCE</span>
          </div>
          <h2 className="font-heading font-extrabold text-2xl sm:text-3xl tracking-tight text-white leading-tight">
            PRAGATI-SAARTHI Cabinet Note
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed max-w-xl">
            Generates clean, 100% fact-checked briefing notes for PMO and Cabinet reviews with cryptographic audit trails.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full lg:w-auto z-30">
          <ProjectCombobox
            className="w-full sm:w-80 shrink-0"
            projects={projectList}
            value={searchInput}
            onChange={setSearchInput}
            onSelect={(p) => {
              setProjectId(p.project_id);
              if (onSelectProject) onSelectProject(p.project_id);
              fetchBriefing(p.project_id);
            }}
            onSubmitRaw={(q) => { setProjectId(q); fetchBriefing(q); }}
            loading={loading}
            submitLabel="Generate"
            busyLabel="Compiling…"
            label="Find a project to brief"
          />

          {/* Bilingual Language Switcher for Report Content Only */}
          <div className="flex items-center gap-1.5 bg-black/25 p-1.5 rounded-xl border border-white/15 shrink-0 h-11" title="Report Language / रिपोर्ट भाषा">
            <Globe className="w-4 h-4 text-amber-400 ml-1 mr-0.5" />
            <button
              onClick={() => handleLanguageSwitch('en')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer h-full ${
                reportLang === 'en'
                  ? 'bg-amber-400 text-slate-900 font-black shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              English
            </button>
            <button
              onClick={() => handleLanguageSwitch('hi')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer h-full ${
                reportLang === 'hi'
                  ? 'bg-amber-400 text-slate-900 font-black shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              हिन्दी
            </button>
          </div>
        </div>
      </motion.div>

      {loading && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 flex flex-col items-center justify-center text-center space-y-4 min-h-[360px]">
          <div className="w-12 h-12 rounded-full border-4 border-amber-500/20 border-t-amber-600 animate-spin" />
          <div className="space-y-1">
            <p className="text-sm font-bold text-slate-800 uppercase tracking-wider font-mono">
              Compiling Fact-Verified Cabinet Briefing…
            </p>
            <p className="text-xs text-slate-500">
              Synthesizing bilingual policy briefs and generating SHA-256 Merkle inclusion proofs
            </p>
          </div>
        </div>
      )}

      {/* Empty State Hero */}
      {!data && !loading && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-8 sm:p-12 flex flex-col items-center justify-center text-center space-y-6 min-h-[440px]">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shadow-xs">
            <FileText className="w-8 h-8" />
          </div>
          <div className="max-w-md space-y-2">
            <h3 className="text-xl font-bold text-slate-800">
              Ready to Compile Cabinet Briefing
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Enter any MoSPI project ID or select from autocomplete in the search bar above, then click <strong className="text-slate-700">"Generate"</strong> to synthesize bilingual executive notes with zero-hallucination audit traces.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl pt-2">
            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100 flex flex-col items-center text-center space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100/60 text-emerald-700 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-700">
                SHA-256 Merkle Inclusion
              </h4>
              <p className="text-[11px] text-slate-500 leading-tight">
                Cryptographic tamper detection across timeline records
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100 flex flex-col items-center text-center space-y-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100/60 text-blue-700 flex items-center justify-center">
                <Globe className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-700">
                Bilingual Policy Synthesis
              </h4>
              <p className="text-[11px] text-slate-500 leading-tight">
                Simultaneous English and Rajbhasha Hindi briefs
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100 flex flex-col items-center text-center space-y-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100/60 text-amber-700 flex items-center justify-center">
                <Database className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-700">
                Fact Verification Trace
              </h4>
              <p className="text-[11px] text-slate-500 leading-tight">
                Interactive drawer linking facts to source records
              </p>
            </div>
          </div>
        </div>
      )}

      {denied && !loading && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
          <strong>{denied}</strong>
          <span className="block mt-1 text-rose-600">Cabinet briefings require the ministry officer or administrator role.</span>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          REPORT CONTENT AREA
          When Hindi is selected inside Pragati Saarthi, ALL content here
          is translated to 100% pure Hindi with Devanagari numerals.
          ═══════════════════════════════════════════════════════════════ */}
      {data && !loading && (
        <motion.div 
          initial="hidden" animate="visible" variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
          }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          {/* Main Briefing Note (2 Columns) */}
          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="lg:col-span-2 space-y-6">
            <div className="panel p-5 sm:p-7 space-y-6 shadow-xl border border-slate-200">
              {/* Header Info */}
              <div className="border-b border-border-default pb-5 space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[11px] font-mono font-bold text-text-muted uppercase tracking-wider">
                    {isHiReport
                      ? `कैबिनेट समीक्षा संदर्भ डोज़ियर: एमओएसपीआई परियोजना रिकॉर्ड #${toHindiDigits(data.project_id || projectId)}`
                      : `Cabinet Review Reference Dossier: MoSPI Project Record #${data.project_id || projectId}`}
                  </span>
                  <span className="text-[11.5px] font-mono text-text-muted font-bold shrink-0">
                    {isHiReport ? formatHindiTimestamp(data.generated_at) : data.generated_at}
                  </span>
                </div>
                <h2 className="text-[20px] font-extrabold text-gov-navy leading-snug font-heading">
                  {isHiReport ? translateReportText(data.title_hi || data.title_en, 'hi') : data.title_en}
                </h2>
              </div>

              {/* Executive Summary */}
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-[11px] font-bold text-gov-navy uppercase tracking-wider block font-heading">
                  {isHiReport ? 'कार्यपालक सारांश एवं मुख्य निष्कर्ष' : 'Executive Summary & Key Takeaways'}
                </span>
                <p className="text-[13.5px] text-text-secondary leading-relaxed font-sans">
                  {isHiReport ? translateReportText(data.summary_hi || data.summary_en, 'hi') : data.summary_en}
                </p>
              </div>

              {/* Bilingual Subsections */}
              <div className="space-y-4">
                {data.bilingual_sections.map((sec) => (
                  <div key={sec.section_id} className="p-5 rounded-2xl border border-border-default bg-white space-y-2 shadow-subtle">
                    <h3 className="text-[14px] font-bold text-gov-navy font-heading">
                      {isHiReport ? translateReportText(sec.heading_hi || sec.heading_en, 'hi') : sec.heading_en}
                    </h3>
                    <p className="text-[13px] text-text-secondary leading-relaxed font-sans">
                      {isHiReport ? translateReportText(sec.content_hi || sec.content_en, 'hi') : sec.content_en}
                    </p>
                  </div>
                ))}
              </div>

              {/* Clickable Lineage Audit Tokens */}
              <div className="pt-4 border-t border-border-default space-y-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  <span className="text-[13px] font-extrabold text-gov-navy uppercase tracking-widest font-heading">
                    {isHiReport ? "स्रोत एवं साक्ष्य देखने हेतु किसी भी मीट्रिक पर क्लिक करें" : "Click Any Metric to Inspect its Source & Proof"}
                  </span>
                </div>
                <motion.div 
                  className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
                  }}
                  initial="hidden"
                  animate="visible"
                >
                  {Object.values(data.audit_facts).map((fact) => (
                    <motion.div key={fact.fact_id} variants={{ hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1 } }}>
                      <Card
                        className="group relative cursor-pointer overflow-hidden border border-slate-200 transition-all hover:border-emerald-400/50 hover:shadow-[0_0_15px_rgba(52,211,153,0.15)] bg-white p-4 h-full flex flex-col justify-between"
                        onClick={() => handleOpenFact(fact)}
                      >
                        <Text className="text-[11px] font-bold text-text-muted uppercase tracking-wide mb-2 line-clamp-2">
                          {translateFactLabel(fact.label, reportLang)}
                        </Text>
                        <div className="flex flex-col gap-1">
                          <Metric className="text-xl font-black text-gov-navy font-mono truncate">
                            {translateFactValue(fact.formatted_value, reportLang)}
                          </Metric>
                          <div className="flex justify-end mt-2">
                            <ArrowRight className="w-4 h-4 text-gov-saffron transform transition-transform group-hover:translate-x-1" />
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Top Decisions & Constraints */}
          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="lg:col-span-1 space-y-6">
            {/* Top Actionable Decisions */}
            <div className="panel p-5 sm:p-6 space-y-5 shadow-xl border border-slate-200">
              <div className="flex items-center gap-2 border-b border-border-default pb-4">
                <Sparkles className="w-4 h-4 text-gov-saffron" />
                <h3 className="text-[14px] font-extrabold text-gov-navy uppercase tracking-wider font-heading">
                  {isHiReport ? 'कैबिनेट समीक्षा हेतु उच्च-स्तरीय कार्यपालक निर्देश' : 'High-Level Executive Directives for Cabinet Review'}
                </h3>
              </div>

              <div className="space-y-3.5">
                {data.top_decisions.map((dec, idx) => (
                  <div key={idx} className="p-4 bg-white rounded-2xl border border-slate-200 space-y-2 hover:scale-[1.02] transition-transform shadow-sm hover:shadow-md cursor-default group">
                    <div className="flex items-center justify-between gap-3">
                      <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-sm font-mono transition-colors shrink-0 ${
                        dec.priority === 'HIGH' ? 'bg-rose-50 text-rose-800 border border-rose-300 group-hover:bg-rose-100' : 'bg-amber-50 text-amber-800 border border-amber-300 group-hover:bg-amber-100'
                      }`}>
                        {isHiReport ? `${dec.priority === 'HIGH' ? 'उच्च' : dec.priority === 'LOW' ? 'निम्न' : 'मध्यम'} प्राथमिकता` : `${dec.priority} PRIORITY`}
                      </span>
                      <span className="text-[11px] font-bold text-text-muted truncate text-right" title={translateAgencyName(dec.action_agency, reportLang)}>
                        {translateAgencyName(dec.action_agency, reportLang)}
                      </span>
                    </div>
                    <p className="text-[12.5px] font-bold text-gov-navy leading-snug font-sans">
                      {isHiReport ? translateReportText(dec.recommendation_hi || dec.recommendation_en, 'hi') : dec.recommendation_en}
                    </p>
                    <div className="text-[11px] font-mono text-emerald-800 font-bold">
                      {isHiReport
                        ? `सुरक्षित अनुमानित पूंजी: ₹${toHindiDigits(Number(dec.impact_cr).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))} करोड़`
                        : `Estimated Capital Safeguarded: ₹${Number(dec.impact_cr).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Cr`}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Merkle Tree Provenance Card */}
            <div className="bg-gradient-to-br from-slate-900 via-[#0a192f] to-slate-900 text-white p-6 sm:p-7 rounded-3xl border border-slate-700/50 space-y-5 shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay pointer-events-none"></div>
              
              <div className="flex items-center gap-2 relative z-10">
                <div className="relative flex items-center justify-center w-6 h-6">
                  <div className="absolute inset-0 bg-amber-400/20 rounded-full animate-ping"></div>
                  <Lock className="w-4 h-4 text-amber-400 relative z-10 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <h3 className="text-xs font-extrabold uppercase tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-amber-200 to-amber-500 font-heading">
                  {isHiReport ? "क्रिप्टोग्राफिक सत्यनिष्ठा एवं वंशावली आश्वासन" : "Cryptographic Integrity & Lineage Assurance"}
                </h3>
              </div>
              
              <p className="text-[12px] text-slate-300 leading-relaxed font-sans relative z-10">
                {isHiReport ? (
                  <>इस कैबिनेट टिप्पणी की प्रत्येक संख्या <strong className="text-amber-100 font-medium tracking-wide">आधिकारिक डेटाबेस अभिलेखों से आबद्ध</strong> है। इसमें कोई भी काल्पनिक अथवा अपुष्ट अनुमान शामिल नहीं हो सकता।</>
                ) : (
                  <>Every number in this Cabinet note is <strong className="text-amber-100 font-medium tracking-wide">locked to official database records</strong>. No fabricated data or hallucinated estimates can enter this document.</>
                )}
              </p>
              
              <div className="relative z-10 bg-black/60 p-4 rounded-xl border border-emerald-500/30 font-mono text-[11px] text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)] shadow-[inset_0_0_20px_rgba(52,211,153,0.05)] break-all overflow-hidden group/hash">
                <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.4)_50%)] bg-[length:100%_4px] pointer-events-none opacity-30"></div>
                <span className="text-emerald-600/80 uppercase tracking-widest text-[9px] block mb-1.5 font-bold">
                  {isHiReport ? "सुरक्षित हैश // सत्यापित" : "SECURE_HASH // VERIFIED"}
                </span>
                {data.merkle_root}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Slide-Out Audit Lineage Drawer (Portaled to document.body to prevent containing-block transforms and layout overflow) */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {drawerOpen && activeFact && (
            <div className="fixed inset-0 z-[9999] overflow-hidden flex justify-end font-sans">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setDrawerOpen(false)}
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity cursor-pointer"
              />

              {/* Slide-over Drawer Panel */}
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 300 }}
                data-lenis-prevent
                className="relative z-10 w-full max-w-md bg-white shadow-2xl border-l border-slate-200 h-screen max-h-screen overflow-y-auto p-6 sm:p-7 space-y-6 flex flex-col font-sans"
              >
                <div className="flex items-center justify-between border-b border-border-default pb-4 shrink-0">
                  <div className="flex items-center gap-2.5">
                    <Database className="w-5 h-5 text-gov-navy" />
                    <div>
                      <h3 className="text-[16px] font-bold text-gov-navy font-heading">
                        {DRAWER_I18N[reportLang].title}
                      </h3>
                      <span className="text-[10.5px] font-mono text-text-muted">
                        {DRAWER_I18N[reportLang].metricId} {isHiReport ? toHindiDigits(activeFact.fact_id) : activeFact.fact_id}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setDrawerOpen(false)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-text-muted transition-colors cursor-pointer"
                    aria-label={DRAWER_I18N[reportLang].closeBtn}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Fact Value Card */}
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5 shrink-0">
                  <span className="text-[11px] font-bold text-text-muted uppercase">
                    {translateFactLabel(activeFact.label, reportLang)}
                  </span>
                  <p className="text-[28px] font-black text-gov-navy font-mono">
                    {translateFactValue(activeFact.formatted_value, reportLang)}
                  </p>
                  <span className="text-[11px] text-emerald-800 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> {DRAWER_I18N[reportLang].verifiedDb}
                  </span>
                </div>

                {/* Cryptographic Hashes & Positional Proof */}
                <div className="space-y-4">
                  <h4 className="text-[13px] font-extrabold text-gov-navy uppercase tracking-widest font-heading border-b border-slate-200 pb-2">
                    {DRAWER_I18N[reportLang].verificationDetails}
                  </h4>
                  
                  <div className="p-4 bg-white rounded-xl shadow-sm border border-slate-200 flex justify-between items-center group transition-colors hover:border-slate-300">
                    <div className="space-y-1 min-w-0 pr-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        {DRAWER_I18N[reportLang].queryHash}
                      </span>
                      <p className="font-mono text-xs font-semibold text-slate-800 truncate">{formatHash(activeFact.lineage?.query_sha256)}</p>
                    </div>
                    <button onClick={() => handleCopy(activeFact.lineage?.query_sha256, 'query')} className="p-2 bg-slate-50 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-gov-navy transition-colors shrink-0 cursor-pointer">
                      {copiedHash === 'query' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="p-4 bg-white rounded-xl shadow-sm border border-slate-200 flex justify-between items-center group transition-colors hover:border-slate-300">
                    <div className="space-y-1 min-w-0 pr-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        {DRAWER_I18N[reportLang].datasetFingerprint}
                      </span>
                      <p className="font-mono text-xs font-semibold text-slate-800 truncate">{formatHash(activeFact.lineage?.dataset_sha256)}</p>
                    </div>
                    <button onClick={() => handleCopy(activeFact.lineage?.dataset_sha256, 'dataset')} className="p-2 bg-slate-50 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-gov-navy transition-colors shrink-0 cursor-pointer">
                      {copiedHash === 'dataset' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="p-4 bg-white rounded-xl shadow-sm border border-slate-200 space-y-3">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      {DRAWER_I18N[reportLang].proofPath}
                    </span>
                    <div data-lenis-prevent className="relative pl-3 space-y-3 max-h-40 overflow-y-auto">
                      <div className="absolute left-[5px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-emerald-400 to-emerald-200/20"></div>
                      {activeFact.lineage?.merkle_proof && activeFact.lineage.merkle_proof.length > 0 ? (
                        activeFact.lineage.merkle_proof.map((p, idx) => (
                          <div key={idx} className="relative flex items-center justify-between text-[10px] font-mono pl-4">
                            <div className="absolute left-[-3px] w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.8)] border border-white"></div>
                            <span className="text-slate-700 font-medium truncate max-w-[180px]">{formatHash(p.hash)}</span>
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold uppercase text-[9px] border border-slate-200 shrink-0">
                              {isHiReport ? (p.position === 'left' ? 'बायाँ' : 'दायाँ') : p.position}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="relative flex items-center text-[11px] font-mono pl-4">
                          <div className="absolute left-[-3px] w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.8)] border border-white"></div>
                          <span className="text-slate-500 font-semibold italic">{DRAWER_I18N[reportLang].leafRecord}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-slate-900 via-[#0a192f] to-slate-900 p-4 rounded-xl shadow-lg border border-slate-700/50 flex justify-between items-center relative overflow-hidden group/key">
                    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay pointer-events-none"></div>
                    <div className="space-y-1.5 relative z-10 min-w-0 pr-2">
                      <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Lock className="w-3 h-3 shrink-0" /> {DRAWER_I18N[reportLang].securityKey}
                      </span>
                      <p className="font-mono text-xs font-black text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.5)] tracking-wide truncate">{formatHash(activeFact.lineage?.merkle_root || data?.merkle_root)}</p>
                    </div>
                    <button onClick={() => handleCopy(activeFact.lineage?.merkle_root || data?.merkle_root, 'root')} className="relative z-10 p-2.5 bg-black/40 border border-slate-600 rounded-lg hover:border-emerald-400/50 hover:bg-emerald-900/20 text-slate-300 hover:text-emerald-400 transition-all shrink-0 cursor-pointer">
                      {copiedHash === 'root' ? <Check className="w-4 h-4 text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.8)]" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Interactive Live Tamper Defense Test */}
                <div className="p-5 bg-gov-navy text-white rounded-2xl border border-slate-700 space-y-3.5 shrink-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs font-bold text-gov-saffron-light uppercase flex items-center gap-1.5 font-heading leading-tight">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" /> {DRAWER_I18N[reportLang].tamperTestTitle}
                    </span>
                    <span className="text-[9.5px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-sm font-mono shrink-0 self-start sm:self-auto">
                      {DRAWER_I18N[reportLang].liveVerification}
                    </span>
                  </div>
                  <p className="text-[12px] text-slate-300 leading-snug font-sans">
                    {DRAWER_I18N[reportLang].tamperPrompt}
                  </p>
                  
                  <div className="space-y-2" key={activeFact.fact_id}>
                    <label className="text-[10.5px] font-bold text-slate-400 uppercase font-mono">
                      {DRAWER_I18N[reportLang].inputLabel}
                    </label>
                    <div className="flex flex-col gap-2.5">
                      <input
                        type="text"
                        defaultValue={activeFact.value}
                        id="tamperInput"
                        className="w-full bg-black/40 border border-slate-600 rounded-xl px-3 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-gov-saffron min-w-0"
                      />
                      <button
                        onClick={async () => {
                          const inputVal = document.getElementById('tamperInput').value;
                          setTamperState({ kind: 'checking' });
                          try {
                            const docHash = data?.doc_hash || 'unknown';
                            const factId = activeFact.fact_id;
                            const verifyUrl = `/api/amey/verify/${docHash}/${factId}?project_id=${projectId}`;
                            const resp = await fetch(verifyUrl);
                            if (!resp.ok) throw new Error(`Server returned ${resp.status}`);
                            const result = await resp.json();

                            const serverValue = result.value;
                            const proofValid = result.proof_valid;
                            const valuesMatch = parseFloat(inputVal) === parseFloat(serverValue);

                            if (proofValid && valuesMatch) {
                              setTamperState({ kind: 'authentic' });
                            } else if (proofValid && !valuesMatch) {
                              setTamperState({ kind: 'tampered', entered: inputVal, audited: serverValue });
                            } else {
                              setTamperState({ kind: 'proof_failed' });
                            }
                          } catch (err) {
                            setTamperState({ kind: 'error', message: err.message });
                          }
                        }}
                        className="btn-saffron-pill w-full justify-center px-3.5 py-2.5 text-xs font-bold uppercase transition-all shrink-0 cursor-pointer"
                      >
                        {DRAWER_I18N[reportLang].validateBtn}
                      </button>
                    </div>
                    <div className="mt-2 text-[11.5px] leading-snug">
                      {tamperState.kind === 'checking' && (
                        <span className="text-sky-400 font-bold animate-pulse">{DRAWER_I18N[reportLang].statusChecking}</span>
                      )}
                      {tamperState.kind === 'authentic' && (
                        <span className="text-emerald-400 font-bold">{DRAWER_I18N[reportLang].statusAuthentic}</span>
                      )}
                      {tamperState.kind === 'tampered' && (
                        <span className="text-rose-400 font-bold">
                          {DRAWER_I18N[reportLang].statusTampered(tamperState.entered, tamperState.audited)}
                        </span>
                      )}
                      {tamperState.kind === 'proof_failed' && (
                        <span className="text-rose-400 font-bold">{DRAWER_I18N[reportLang].statusFailed}</span>
                      )}
                      {tamperState.kind === 'error' && (
                        <span className="text-amber-400 font-bold">{DRAWER_I18N[reportLang].statusError(tamperState.message)}</span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setDrawerOpen(false)}
                  className="btn-saffron-pill w-full justify-center py-3 text-xs font-bold uppercase tracking-wider cursor-pointer shrink-0"
                >
                  {DRAWER_I18N[reportLang].closeBtn}
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
