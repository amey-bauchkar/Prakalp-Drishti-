import React, { useState, useEffect } from 'react';
import { apiFetch } from './authClient';
import { FileText, ShieldCheck, CheckCircle2, Globe, ArrowRight, X, Database, Lock, Search, Sparkles } from 'lucide-react';

export default function PragatiSaarthiView({ selectedProjectId = "618402" }) {
  const [tamperState, setTamperState] = useState({ kind: 'idle' });
  const [projectId, setProjectId] = useState(selectedProjectId);
  const [lang, setLang] = useState('en');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeFact, setActiveFact] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [denied, setDenied] = useState(null);

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
    fetchBriefing(projectId);
  }, [projectId]);

  const handleOpenFact = (fact) => {
    setActiveFact(fact);
    setDrawerOpen(true);
  };

  return (
    <div className="space-y-8 font-sans relative">
      {/* ═══════════════════════════════════════════════════════════════
          TOP BANNER (SOVEREIGN INSTITUTIONAL COMMAND HEADER)
          ═══════════════════════════════════════════════════════════════ */}
      <div className="command-header p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="space-y-2 max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 pl-2 pr-2.5 py-0.5 rounded-sm bg-white/[0.07] text-[9.5px] font-extrabold tracking-institutional uppercase text-gov-accent border-l-2 border-gov-accent">
            <FileText className="w-3.5 h-3.5 text-white" />
            <span>MODULE 4 · EXECUTIVE GOVERNANCE</span>
          </div>
          <h2 className="font-heading font-extrabold text-[21px] sm:text-[25px] tracking-[-0.025em] text-white leading-[1.12]">
            PRAGATI-SAARTHI: BILINGUAL CABINET REVIEW NOTE
          </h2>
          <p className="text-[12.5px] text-ink-200 leading-relaxed font-sans max-w-xl">
            Generates clean, 100% fact-checked briefing notes for PMO and Cabinet reviews with cryptographic audit trails.
          </p>
        </div>

        {/* Bilingual Language Switcher */}
        <div className="flex items-center gap-1.5 bg-black/25 p-1.5 rounded-sm border border-white/15 shrink-0">
          <Globe className="w-4 h-4 text-gov-accent ml-1 mr-0.5" />
          <button
            onClick={() => setLang('en')}
            className={`px-3 py-1 text-xs font-bold rounded-xs transition-all cursor-pointer ${
              lang === 'en'
                ? 'bg-gov-accent text-gov-navy font-black shadow-sm'
                : 'text-ink-200 hover:text-white'
            }`}
          >
            English
          </button>
          <button
            onClick={() => setLang('hi')}
            className={`px-3 py-1 text-xs font-bold rounded-xs transition-all cursor-pointer ${
              lang === 'hi'
                ? 'bg-gov-accent text-gov-navy font-black shadow-sm'
                : 'text-ink-200 hover:text-white'
            }`}
          >
            हिन्दी
          </button>
        </div>
      </div>

      {loading && (
        <div className="p-12 text-center text-text-muted font-bold text-sm panel">
          <FileText className="w-8 h-8 text-gov-saffron animate-spin mx-auto mb-2" /> Preparing Fact-Verified Executive Briefing Note...
        </div>
      )}

      {denied && !loading && (
        <div className="note note-critical">
          {denied}
          <span className="block font-normal mt-1">Cabinet briefings require the ministry officer or administrator role.</span>
        </div>
      )}

      {data && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Briefing Note (2 Columns) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="panel p-4 sm:p-5 space-y-6">
              {/* Header Info */}
              <div className="border-b border-border-default pb-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-text-muted uppercase tracking-wider"> Cabinet Review Reference Dossier: MoSPI Project Record #{data.project_id}
                  </span>
                  <span className="text-[11.5px] font-mono text-text-muted font-bold">{data.generated_at}</span>
                </div>
                <h2 className="text-[20px] font-extrabold text-gov-navy leading-snug font-heading">
                  {lang === 'en' ? data.title_en : data.title_hi}
                </h2>
              </div>

              {/* Executive Summary */}
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-[11px] font-bold text-gov-navy uppercase tracking-wider block font-heading">
                  {lang === 'en' ? 'Executive Summary & Key Takeaways' : 'कार्यपालक सारांश एवं मुख्य निष्कर्ष'}
                </span>
                <p className="text-[13.5px] text-text-secondary leading-relaxed font-sans">
                  {lang === 'en' ? data.summary_en : data.summary_hi}
                </p>
              </div>

              {/* Bilingual Subsections */}
              <div className="space-y-4">
                {data.bilingual_sections.map((sec) => (
                  <div key={sec.section_id} className="p-5 rounded-2xl border border-border-default bg-white space-y-2 shadow-subtle">
                    <h3 className="text-[14px] font-bold text-gov-navy font-heading">
                      {lang === 'en' ? sec.heading_en : sec.heading_hi}
                    </h3>
                    <p className="text-[13px] text-text-secondary leading-relaxed font-sans">
                      {lang === 'en' ? sec.content_en : sec.content_hi}
                    </p>
                  </div>
                ))}
              </div>

              {/* Clickable Lineage Audit Tokens */}
              <div className="pt-4 border-t border-border-default space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="text-[12px] font-bold text-gov-navy uppercase tracking-wider font-heading"> Click Any Metric to Inspect its Source &amp; Proof
                  </span>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {Object.values(data.audit_facts).map((fact) => (
                    <button
                      key={fact.fact_id}
                      onClick={() => handleOpenFact(fact)}
                      className="px-3.5 py-2 bg-slate-50 hover:bg-gov-saffron-light border border-slate-200 hover:border-gov-saffron rounded-xl text-xs font-bold text-gov-navy transition-all flex items-center gap-2 shadow-sm"
                    >
                      <span className="text-text-muted text-[11px]">{fact.label}:</span>
                      <span className="font-mono font-black text-gov-navy">{fact.formatted_value}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-gov-saffron" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Top Decisions & Constraints */}
          <div className="lg:col-span-1 space-y-6">
            {/* Top Actionable Decisions */}
            <div className="panel p-4 space-y-5">
              <div className="flex items-center gap-2 border-b border-border-default pb-4">
                <Sparkles className="w-4 h-4 text-gov-saffron" />
                <h3 className="text-[14px] font-extrabold text-gov-navy uppercase tracking-wider font-heading">
                  {lang === 'en' ? 'High-Level Executive Directives for Cabinet Review' : 'शीर्ष कार्यपालक निर्णय'}
                </h3>
              </div>

              <div className="space-y-3.5">
                {data.top_decisions.map((dec, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-sm font-mono ${
                        dec.priority === 'HIGH' ? 'bg-rose-50 text-rose-800 border border-rose-300' : 'bg-amber-50 text-amber-800 border border-amber-300'
                      }`}>
                        {dec.priority} PRIORITY
                      </span>
                      <span className="text-[11px] font-bold text-text-muted">{dec.action_agency}</span>
                    </div>
                    <p className="text-[12.5px] font-bold text-gov-navy leading-snug font-sans">
                      {lang === 'en' ? dec.recommendation_en : dec.recommendation_hi}
                    </p>
                    <div className="text-[11px] font-mono text-emerald-800 font-bold"> Estimated Capital Safeguarded: ₹{dec.impact_cr.toLocaleString()} Cr
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Merkle Tree Provenance Card */}
            <div className="bg-gov-navy text-white p-6 sm:p-7 rounded-3xl border border-slate-700 space-y-4 shadow-elevated">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-gov-saffron" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-gov-saffron-light font-heading"> Cryptographic Integrity &amp; Lineage Assurance
                </h3>
              </div>
              <p className="text-[12px] text-slate-300 leading-relaxed font-sans"> Every number in this Cabinet note is locked to official database records. No fabricated data or hallucinated estimates can enter this document.
              </p>
              <div className="bg-black/40 p-3 rounded-xl border border-white/10 font-mono text-[10.5px] text-white/90 break-all"> Security Hash: {data.merkle_root}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Slide-Out Audit Lineage Drawer */}
      {drawerOpen && activeFact && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex justify-end transition-opacity">
          <div className="w-full max-w-md bg-white h-full shadow-2xl p-7 overflow-y-auto space-y-6 animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between border-b border-border-default pb-4">
              <div className="flex items-center gap-2.5">
                <Database className="w-5 h-5 text-gov-navy" />
                <div>
                  <h3 className="text-[16px] font-bold text-gov-navy font-heading">Data Source &amp; Audit Proof</h3>
                  <span className="text-[10.5px] font-mono text-text-muted">Metric ID: {activeFact.fact_id}</span>
                </div>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-text-muted transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Fact Value Card */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
              <span className="text-[11px] font-bold text-text-muted uppercase">{activeFact.label}</span>
              <p className="text-[28px] font-black text-gov-navy font-mono">{activeFact.formatted_value}</p>
              <span className="text-[11px] text-emerald-800 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Verified Against Official Database
              </span>
            </div>

            {/* Cryptographic Hashes & Positional Proof */}
            <div className="space-y-3.5">
              <h4 className="text-xs font-bold text-gov-navy uppercase tracking-wider font-heading">Source Verification Details</h4>
              
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10.5px] font-bold text-text-muted uppercase">Query Verification Hash</span>
                <p className="font-mono text-[10px] text-gov-navy break-all">{activeFact.lineage?.query_sha256 || 'N/A'}</p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10.5px] font-bold text-text-muted uppercase">Dataset Snapshot Fingerprint</span>
                <p className="font-mono text-[10px] text-gov-navy break-all">{activeFact.lineage?.dataset_sha256 || 'N/A'}</p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <span className="text-[10.5px] font-bold text-text-muted uppercase">Step-by-Step Proof Path</span>
                <div className="space-y-1.5 max-h-28 overflow-y-auto">
                  {activeFact.lineage?.merkle_proof && activeFact.lineage.merkle_proof.length > 0 ? (
                    activeFact.lineage.merkle_proof.map((p, idx) => (
                      <div key={idx} className="flex items-center justify-between text-[9.5px] font-mono bg-white p-1.5 rounded-lg border border-slate-200">
                        <span className="text-gov-navy truncate max-w-[200px]">{p.hash}</span>
                        <span className="note note-info uppercase">{p.position}</span>
                      </div>
                    ))
                  ) : (
                    <p className="font-mono text-[10.5px] text-text-muted">Verified Leaf Record</p>
                  )}
                </div>
              </div>

              <div className="p-3.5 bg-gov-navy text-white rounded-xl border border-slate-700 space-y-1">
                <span className="text-[10.5px] font-bold text-gov-saffron uppercase">Audit Security Key</span>
                <p className="font-mono text-[10px] text-white/90 break-all">{activeFact.lineage?.merkle_root || data?.merkle_root || 'N/A'}</p>
              </div>
            </div>

            {/* Interactive Live Tamper Defense Test */}
            <div className="p-5 bg-gov-navy text-white rounded-2xl border border-slate-700 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gov-saffron-light uppercase flex items-center gap-1.5 font-heading">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Real-Time Cryptographic Merkle Verification Test
                </span>
                <span className="text-[9.5px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-sm font-mono"> Live Verification
                </span>
              </div>
              <p className="text-[12px] text-slate-300 leading-snug font-sans"> Try modifying the number below to test if the system automatically catches and rejects fake or edited data:
              </p>
              
              <div className="space-y-2">
                <label className="text-[10.5px] font-bold text-slate-400 uppercase font-mono">Enter Value to Test</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    defaultValue={activeFact.value}
                    id="tamperInput"
                    className="flex-1 bg-black/40 border border-slate-600 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-gov-saffron"
                  />
                  <button
                    onClick={async () => {
                      // Result goes through React state, never innerHTML.
                      //
                      // This block used to build the outcome string with
                      // `resEl.innerHTML = ...` and interpolate `inputVal`, which
                      // is whatever the user typed into the field above. Entering
                      // `<img src=x onerror=alert(1)>` executed it. That is DOM
                      // XSS in the tamper-verification widget specifically — the
                      // control whose whole purpose is proving a value was not
                      // altered. React escapes interpolated text by default, so
                      // rendering from state removes the injection point rather
                      // than trying to filter it.
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
                    className="btn-saffron-pill px-3.5 py-2 text-xs font-bold uppercase transition-all shrink-0"
                  > Validate Lineage Hash
                  </button>
                </div>
                <div className="mt-2 text-[11.5px] leading-snug">
                  {tamperState.kind === 'checking' && (
                    <span className="text-sky-400 font-bold animate-pulse">Checking proof against official database record...</span>
                  )}
                  {tamperState.kind === 'authentic' && (
                    <span className="text-emerald-400 font-bold">AUTHENTIC RECORD: Value perfectly matches official verified database records.</span>
                  )}
                  {tamperState.kind === 'tampered' && (
                    <span className="text-rose-400 font-bold">
                      FAKE DATA DETECTED: Entered "{tamperState.entered}" does not match audited value "{tamperState.audited}". Edit rejected immediately!
                    </span>
                  )}
                  {tamperState.kind === 'proof_failed' && (
                    <span className="text-rose-400 font-bold">VERIFICATION FAILED: Source proof did not validate on the server.</span>
                  )}
                  {tamperState.kind === 'error' && (
                    <span className="text-amber-400 font-bold">Verification check error: {tamperState.message}. Ensure backend is running.</span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => setDrawerOpen(false)}
              className="btn-saffron-pill w-full justify-center py-3 text-xs font-bold uppercase tracking-wider"
            > Close Drawer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
