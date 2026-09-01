import React, { useState, useEffect } from 'react';
import { 
  Scale, FileText, AlertOctagon, ShieldAlert, Sparkles, Building2, 
  CheckCircle2, AlertTriangle, ArrowRight, RefreshCw, Send, Sliders, ChevronRight, Gavel,
  Info, ShieldCheck, Check, ChevronDown, ChevronUp, Layers, HelpCircle
} from 'lucide-react';
import LoginGate from '../amey/LoginGate.jsx';

export default function NivaranView() {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('PRJ-NH-2026-089');
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Accordion state: default expand first flagged clause
  const [expandedClause, setExpandedClause] = useState(0);

  // Collapsible Sandbox state
  const [showSandbox, setShowSandbox] = useState(false);

  // Custom Clause Sandbox State
  const [customText, setCustomText] = useState(
    'The executing agency shall accept phased handover of land as and when acquired by the district administration. No compensation or price escalation shall be payable for material inflation or idle machinery during possession delays.'
  );
  const [customResult, setCustomResult] = useState(null);
  const [evaluating, setEvaluating] = useState(false);
  const [evalError, setEvalError] = useState(null);

  // Global project selection sync
  useEffect(() => {
    const handleSelect = (e) => {
      if (e.detail) {
        setSelectedProjectId(String(e.detail));
      }
    };
    window.addEventListener('prakalp:selectProject', handleSelect);
    return () => window.removeEventListener('prakalp:selectProject', handleSelect);
  }, []);

  // Fetch project list & initial risk profile
  useEffect(() => {
    async function loadInitial() {
      try {
        const pRes = await fetch('/api/aditya/projects?limit=500');
        if (pRes.ok) {
          const pList = await pRes.json();
          setProjects(pList);
          const savedId = localStorage.getItem('prakalp:selectedProjectId');
          if (savedId) {
            setSelectedProjectId(savedId);
          } else if (pList.length > 0 && !selectedProjectId) {
            setSelectedProjectId(pList[0].project_id);
          }
        }
      } catch (err) {
        console.error('Failed to load project list:', err);
      }
    }
    loadInitial();
  }, []);

  useEffect(() => {
    async function loadRiskProfile() {
      if (!selectedProjectId) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/aditya/governance/combined-risk-profile/${selectedProjectId}`);
        if (res.ok) {
          const json = await res.json();
          setProfileData(json);
          if (json?.project_metadata) {
            const meta = json.project_metadata;
            setProjects((prev) => {
              if (!prev.some((p) => String(p.project_id) === String(meta.project_id))) {
                return [{ ...meta }, ...prev];
              }
              return prev;
            });
          }
        }
      } catch (err) {
        console.error('Failed to load Nivaran data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadRiskProfile();
  }, [selectedProjectId]);

  const handleEvaluateCustom = async () => {
    setEvaluating(true);
    setEvalError(null);
    try {
      const metaInfo = profileData?.project_metadata;
      const opInfo = profileData?.operational_metrics || {};

      const payload = {
        project_id: selectedProjectId || 'PRJ-NH-2026-089',
        project_name: metaInfo?.project_name || 'Central Sector Highway Corridor',
        contract_text_or_summary: customText || '',
        contractor_data: {
          agency_name: metaInfo?.executing_agency || 'L1 Infra Developers Pvt Ltd',
          past_arbitration_count: 3,
          disputed_variation_value_cr: 140.0,
          historical_legal_stays: 1,
          total_active_contract_value_cr: Number(metaInfo?.total_sanctioned_cost_cr) || 1200.0
        },
        operational_metrics: {
          pending_variation_orders_gt_90d: 5,
          pending_variation_value_cr: Number(opInfo?.pending_variation_orders_cr) || 68.4,
          unpaid_milestone_invoices_count: 3,
          max_invoice_delay_days: 115,
          pending_time_extension_requests: 2
        }
      };

      const res = await fetch('/api/aditya/nivaran/assess-dispute-risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const json = await res.json();
        setCustomResult(json);
      } else {
        const errJson = await res.json().catch(() => ({ detail: 'API Error ' + res.status }));
        const msg = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
        setEvalError(msg || 'Failed to evaluate contract clause.');
      }
    } catch (err) {
      console.error('Evaluation failed:', err);
      setEvalError(err.message || 'Network connection failed.');
    } finally {
      setEvaluating(false);
    }
  };

  const niv = profileData?.nivaran_assessment;
  const meta = profileData?.project_metadata;
  const litigationProb = niv?.litigation_probability ?? 0.78;
  const riskPct = Math.round(litigationProb * 100);
  const isCritical = litigationProb >= 0.65;
  const isModerate = litigationProb >= 0.35 && litigationProb < 0.65;
  const riskBadge = isCritical 
    ? 'bg-rose-100 text-rose-800 border-rose-300' 
    : isModerate 
      ? 'bg-amber-100 text-amber-800 border-amber-300' 
      : 'bg-emerald-100 text-emerald-800 border-emerald-300';

  return (
    <LoginGate>
      <div className="space-y-6 font-sans pb-16">
        
        {/* ═══════ 1. COMMAND HEADER ═══════ */}
        <div className="command-header p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 pl-2 pr-2.5 py-0.5 rounded-sm bg-white/[0.07] text-[9.5px] font-extrabold tracking-institutional uppercase text-gov-accent border-l-2 border-gov-accent mb-2">
                <Scale className="w-3.5 h-3.5" />
                <span>NIVARAN · LEGAL &amp; DISPUTE RADAR</span>
              </div>
              <h1 className="font-heading font-extrabold text-[22px] sm:text-[26px] tracking-[-0.025em] text-white leading-tight">
                Contract Dispute Risk &amp; Vulnerability Preemption
              </h1>
              <p className="text-[12.5px] text-ink-200 leading-relaxed mt-1.5">
                NLP scrutiny of CPWD GCC / EPC clauses, empirical analysis of contractor litigation history, 
                and predictive arbitration modeling to preempt contractor work-stoppages before high-court stays.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="panel p-3 bg-white/[0.05] border-white/15 text-right">
                <div className="text-[9.5px] uppercase tracking-wider text-ink-300 font-bold">Monitored Contracts</div>
                <div className="text-[20px] font-heading font-extrabold text-white leading-tight">2,207</div>
                <div className="text-[10px] text-red-300 font-mono mt-0.5 font-bold">64.2% High / Critical Risk</div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════ 2. STREAMLINED PROJECT DOSSIER BAR ═══════ */}
        <div className="panel p-3.5 bg-gov-surface border border-gov-border rounded-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Building2 className="w-5 h-5 text-[#0060B6] shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-[9.5px] font-bold text-gov-muted uppercase tracking-wider font-heading">
                Active Project Dossier Under Audit
              </div>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="font-heading font-bold text-[13px] text-gov-navy bg-gov-surface-2 border border-gov-border rounded-xs px-2.5 py-1 mt-0.5 focus:outline-none focus:border-[#0060B6] cursor-pointer w-full max-w-xl truncate"
              >
                {projects.length > 0 ? (
                  projects.map((p) => (
                    <option key={p.project_id} value={p.project_id}>
                      {p.project_name} (#{p.project_id}) — ₹{Number(p.total_sanctioned_cost_cr || 0).toLocaleString()} Cr
                    </option>
                  ))
                ) : (
                  <option value="PRJ-NH-2026-089">Bharatmala Express Highway Expansion (Package 4)</option>
                )}
              </select>
            </div>
          </div>

          {meta && (
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="px-2.5 py-1 rounded bg-blue-50 text-blue-900 border border-blue-200 font-bold text-[11px]">
                {meta.sector}
              </span>
              <span className="px-2.5 py-1 rounded bg-gov-surface-2 text-gov-navy border border-gov-border font-heading font-bold text-[11px]">
                🏢 {meta.executing_agency}
              </span>
              <span className="px-2.5 py-1 rounded bg-gov-surface-2 text-gov-navy border border-gov-border font-mono font-bold text-[11px]">
                💰 ₹{Number(meta.total_sanctioned_cost_cr || 0).toLocaleString()} Cr
              </span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="panel p-10 text-center text-xs text-gov-muted space-y-2">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <div>Auditing contract legal vulnerability and arbitration probability...</div>
          </div>
        ) : (
          <>
            {/* ═══════ 3. BALANCED 2-COLUMN MAIN CONTENT ═══════ */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Dispute Risk Assessment */}
              <div className="lg:col-span-5 panel p-5 bg-gov-surface border border-gov-border rounded-sm flex flex-col justify-between space-y-4">
                <div className="space-y-4">
                  {/* Card Title */}
                  <div className="flex items-center justify-between border-b border-gov-border pb-2.5">
                    <div className="flex items-center gap-2">
                      <Scale className="w-4 h-4 text-[#0060B6]" />
                      <h3 className="font-heading font-extrabold text-[13px] text-gov-navy uppercase tracking-wide">
                        Dispute Risk Index
                      </h3>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${riskBadge}`}>
                      {niv?.dispute_risk_level || (isCritical ? 'CRITICAL' : isModerate ? 'HIGH' : 'LOW')} RISK
                    </span>
                  </div>

                  {/* 1. Sleek Horizontal 3-Zone Risk Meter (Replaces Big Circle) */}
                  <div className="p-3.5 bg-gov-surface-2 rounded-xs border border-gov-border space-y-2.5">
                    <div className="flex items-end justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gov-muted font-heading block">
                          Litigation Probability
                        </span>
                        <div className="text-[26px] font-heading font-extrabold text-gov-navy leading-none mt-1">
                          {riskPct}%{' '}
                          <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded border inline-block ml-1 align-middle ${riskBadge}`}>
                            {isCritical ? 'High Dispute Exposure' : isModerate ? 'Moderate Caution' : 'Low Dispute Risk'}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10.5px] font-mono text-gov-muted">
                        Threshold: &gt;65% Critical
                      </span>
                    </div>

                    {/* 3-Zone Segmented Bar with Needle Marker */}
                    <div className="space-y-1">
                      <div className="relative w-full h-2.5 bg-slate-200 rounded-full overflow-hidden flex">
                        <div className="w-[35%] bg-emerald-500 h-full" title="Low Risk (0-35%)" />
                        <div className="w-[30%] bg-amber-500 h-full" title="Moderate Risk (35-65%)" />
                        <div className="w-[35%] bg-rose-500 h-full" title="Critical Risk (65-100%)" />
                      </div>
                      <div className="relative w-full h-2">
                        <div
                          className="absolute -top-1 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[5px] border-b-gov-navy transform -translate-x-1/2"
                          style={{ left: `${Math.min(98, Math.max(2, riskPct))}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[9px] font-mono text-gov-muted font-bold">
                        <span className="text-emerald-700">0% LOW</span>
                        <span className="text-amber-700">35% MODERATE</span>
                        <span className="text-rose-700">65% CRITICAL</span>
                        <span>100%</span>
                      </div>
                    </div>
                  </div>

                  {/* 2. Executive Verdict 3-Point Checklist */}
                  <div className="p-3 bg-white border border-gov-border rounded-xs space-y-2 text-xs">
                    <div className="text-[9.5px] font-bold text-gov-muted uppercase tracking-wider font-heading">
                      Executive Legal Summary
                    </div>
                    <div className="space-y-1.5 text-[11.5px] text-gov-navy">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span><strong>Standard Agreement:</strong> Verified CPWD GCC / EPC standard format.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                        <span><strong>Key Risk Area:</strong> Uncapped price escalation &amp; phased land possession.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <span><strong>Recommended Action:</strong> Appoint Dispute Avoidance Board within 14 days.</span>
                      </div>
                    </div>
                  </div>

                  {/* 3. Dual Indicator Meters */}
                  <div className="space-y-3 bg-gov-surface-2 p-3 rounded-xs border border-gov-border text-xs">
                    <div>
                      <div className="flex justify-between font-bold mb-1">
                        <span className="text-gov-navy font-heading text-[11px]">Contract Clause Ambiguity</span>
                        <span className="text-indigo-700 font-mono">{niv?.clause_risk_score ?? 0.85} / 1.0</span>
                      </div>
                      <div className="text-[10px] text-gov-muted mb-1">Vague, one-sided, or open-ended contract clauses.</div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${(niv?.clause_risk_score ?? 0.85) * 100}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between font-bold mb-1">
                        <span className="text-gov-navy font-heading text-[11px]">Contractor Past Dispute Record</span>
                        <span className="text-red-600 font-mono">{niv?.contractor_litigation_index ?? 78.5} / 100</span>
                      </div>
                      <div className="text-[10px] text-gov-muted mb-1">Frequency of historical lawsuits, claims, and stay orders.</div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-red-500 h-full rounded-full" style={{ width: `${niv?.contractor_litigation_index ?? 78.5}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preemptive Action Protocol Alert Box */}
                <div className="bg-amber-50 border border-amber-200 rounded-xs p-3 space-y-1">
                  <div className="text-[10px] font-extrabold text-amber-900 uppercase flex items-center gap-1.5 font-heading">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <span>Statutory Preemption Protocol</span>
                  </div>
                  <p className="text-[11px] text-amber-950 leading-relaxed font-sans">
                    {niv?.recommended_preemptive_action || 'Establish dispute avoidance board and mandate escrow account release for variation orders.'}
                  </p>
                </div>
              </div>

              {/* Right Column: Flagged Contract Clauses (Accordion Style) */}
              <div className="lg:col-span-7 panel p-5 bg-gov-surface border border-gov-border rounded-sm space-y-3.5">
                <div className="flex items-center justify-between border-b border-gov-border pb-2.5">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#0060B6]" />
                    <h3 className="font-heading font-extrabold text-[13px] text-gov-navy uppercase tracking-wide">
                      Flagged Contract Clauses &amp; Legal Traps
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-gov-muted">
                    {niv?.flagged_clauses?.length || 0} Clauses Flagged
                  </span>
                </div>

                <p className="text-[11.5px] text-gov-muted">
                  Click any clause below to inspect the verbatim contract wording, legal implications, and suggested amendments.
                </p>

                {/* Compact Accordion List */}
                <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
                  {niv?.flagged_clauses && niv.flagged_clauses.length > 0 ? (
                    niv.flagged_clauses.map((clause, idx) => {
                      const isExpanded = expandedClause === idx;
                      const isCrit = clause.severity === 'CRITICAL';
                      const isHigh = clause.severity === 'HIGH';

                      return (
                        <div
                          key={idx}
                          className={`rounded-xs border transition-all duration-150 overflow-hidden ${
                            isExpanded 
                              ? 'border-[#0060B6] bg-gov-surface shadow-xs' 
                              : 'border-gov-border bg-gov-surface hover:bg-gov-surface-2'
                          }`}
                        >
                          {/* Accordion Summary Row (Always Visible) */}
                          <div
                            onClick={() => setExpandedClause(isExpanded ? -1 : idx)}
                            className="p-3 flex items-center justify-between gap-3 cursor-pointer select-none"
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <span className={`px-1.5 py-0.5 rounded text-[9.5px] font-black uppercase shrink-0 border ${
                                isCrit ? 'bg-red-100 text-red-700 border-red-200' :
                                isHigh ? 'bg-amber-100 text-amber-800 border-amber-200' :
                                'bg-blue-100 text-blue-800 border-blue-200'
                              }`}>
                                {clause.severity}
                              </span>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-[10px] font-bold text-indigo-900 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100">
                                    {clause.category || clause.clause_id}
                                  </span>
                                  <h4 className="font-heading font-bold text-[12.5px] text-gov-navy truncate">
                                    {clause.clause_title}
                                  </h4>
                                </div>
                                {!isExpanded && (
                                  <div className="text-[11px] text-gov-muted truncate mt-0.5">
                                    {clause.risk_reason || clause.legal_risk_reason}
                                  </div>
                                )}
                              </div>
                            </div>

                            <button className="text-gov-muted hover:text-gov-navy p-1">
                              {isExpanded ? <ChevronUp className="w-4 h-4 text-[#0060B6]" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>

                          {/* Accordion Expanded Details */}
                          {isExpanded && (
                            <div className="px-3.5 pb-3.5 pt-1 space-y-2.5 border-t border-gov-border/60 bg-gov-surface-2/40 text-xs">
                              {/* Verbatim snippet */}
                              <div>
                                <span className="text-[9.5px] font-bold uppercase tracking-wider text-gov-muted font-heading block mb-1">
                                  Contract Agreement Wording:
                                </span>
                                <p className="text-[11.5px] text-slate-800 font-sans italic bg-white p-2.5 rounded-xs border border-gov-border">
                                  "{clause.snippet || clause.detected_text}"
                                </p>
                              </div>

                              {/* Legal Ramification */}
                              <div className="text-[11.5px] text-gov-navy leading-relaxed">
                                <strong className="text-slate-900 font-heading">Legal Ramification: </strong>
                                {clause.risk_reason || clause.legal_risk_reason}
                              </div>

                              {/* Recommended Amendment */}
                              {(clause.suggested_amendment || clause.recommended_amendment) && (
                                <div className="text-[11px] text-emerald-800 bg-emerald-50/80 p-2.5 rounded-xs border border-emerald-200 font-medium flex items-start gap-2">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                  <div>
                                    <strong className="font-heading">Recommended Amendment: </strong>
                                    {clause.suggested_amendment || clause.recommended_amendment}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-8 text-center text-gov-muted text-xs">
                      No high-risk clauses identified in current standard agreement.
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* ═══════ 4. OPTIONAL TENDER AUDIT SANDBOX (COLLAPSIBLE) ═══════ */}
            <div className="panel border border-gov-border rounded-sm bg-gov-surface overflow-hidden">
              <div
                onClick={() => setShowSandbox(!showSandbox)}
                className="panel-head p-3.5 bg-gov-surface-2 flex items-center justify-between cursor-pointer hover:bg-gov-surface-3 select-none transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#0060B6]" />
                  <span className="font-heading font-extrabold text-[12.5px] text-gov-navy uppercase tracking-wide">
                    Tender Clause NLP Audit Simulator (Optional Sandbox)
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-200">
                    Audit Custom Clauses
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11.5px] font-bold text-[#0060B6]">
                  <span>{showSandbox ? 'Hide Sandbox' : 'Test a Custom Clause'}</span>
                  {showSandbox ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>

              {showSandbox && (
                <div className="p-5 border-t border-gov-border space-y-4 bg-gov-surface">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-gov-border">
                    <div>
                      <h4 className="font-heading font-bold text-[13.5px] text-gov-navy">
                        Test Custom Tender Agreement / CPWD GCC Clause
                      </h4>
                      <p className="text-[11px] text-gov-muted">
                        Simulates contract clause vulnerability against 4 standard dispute pattern dictionaries.
                      </p>
                    </div>

                    <button
                      onClick={handleEvaluateCustom}
                      disabled={evaluating}
                      className="px-4 py-2 bg-[#0060B6] hover:bg-[#004f98] text-white rounded-xs text-xs font-heading font-bold transition-colors cursor-pointer flex items-center gap-2 self-start sm:self-auto"
                    >
                      {evaluating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Gavel className="w-3.5 h-3.5" />}
                      <span>Run NLP Legal Audit</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                    <div className="lg:col-span-7 space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-gov-muted">
                        <span className="font-heading font-bold uppercase">Contract Clause Text:</span>
                        <button
                          onClick={() => setCustomText('Clause 10CC: Price escalation shall be calculated strictly on WPI base index of sanction year. Deviation beyond 25% requires prior sanction of Cabinet committee.')}
                          className="text-[#0060B6] hover:underline font-bold cursor-pointer"
                        >
                          Load Sample Clause 10CC
                        </button>
                      </div>

                      <textarea
                        rows={4}
                        value={customText}
                        onChange={(e) => setCustomText(e.target.value)}
                        className="w-full bg-white border border-gov-border rounded-xs p-3 text-[12px] text-gov-navy font-mono focus:outline-none focus:border-[#0060B6] transition-colors"
                        placeholder="Paste contractual text to audit..."
                      />
                    </div>

                    <div className="lg:col-span-5 bg-gov-surface-2 rounded-xs p-4 border border-gov-border space-y-3 min-h-[140px]">
                      <div className="text-[10.5px] font-bold text-gov-muted uppercase font-heading border-b border-gov-border pb-1.5">
                        Live Audit Output
                      </div>

                      {evalError ? (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xs text-xs text-red-800 space-y-1">
                          <div className="font-bold flex items-center gap-1.5 text-red-700">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Evaluation Error</span>
                          </div>
                          <p className="text-[11px]">{evalError}</p>
                        </div>
                      ) : customResult ? (
                        <div className="space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-gov-muted">Predicted Dispute Risk:</span>
                            <span className="font-mono text-sm font-extrabold text-red-700">
                              {Math.round(customResult.litigation_probability * 100)}% ({customResult.dispute_risk_level})
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gov-muted">Flagged Vulnerabilities:</span>
                            <span className="font-mono font-bold text-amber-800">
                              {customResult.flagged_clauses.length} Anomalies Found
                            </span>
                          </div>
                          <div className="p-2.5 rounded-xs bg-white border border-gov-border text-[11.5px] text-gov-navy">
                            {customResult.recommended_preemptive_action}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-6 text-gov-muted text-xs">
                          Click "Run NLP Legal Audit" above to test contract clause vulnerability.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

          </>
        )}

      </div>
    </LoginGate>
  );
}
