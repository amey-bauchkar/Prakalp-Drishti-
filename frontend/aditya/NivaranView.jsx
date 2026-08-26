import React, { useState, useEffect } from 'react';
import { 
  Scale, FileText, AlertOctagon, ShieldAlert, Sparkles, Building2, 
  CheckCircle2, AlertTriangle, ArrowRight, RefreshCw, Send, Sliders, ChevronRight, Gavel
} from 'lucide-react';
import LoginGate from '../amey/LoginGate.jsx';

export default function NivaranView() {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('PRJ-NH-2026-089');
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Custom Clause Sandbox State
  const [customText, setCustomText] = useState(
    'The executing agency shall accept phased handover of land as and when acquired by the district administration. No compensation or price escalation shall be payable for material inflation or idle machinery during possession delays.'
  );
  const [customResult, setCustomResult] = useState(null);
  const [evaluating, setEvaluating] = useState(false);

  // Fetch project list & initial risk profile
  useEffect(() => {
    async function loadInitial() {
      try {
        const pRes = await fetch('/api/aditya/projects');
        if (pRes.ok) {
          const pList = await pRes.json();
          setProjects(pList);
          if (pList.length > 0 && !selectedProjectId) {
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
    try {
      const payload = {
        project_id: selectedProjectId || 'PRJ-CUSTOM',
        raw_contract_text: customText,
        contractor_profile: {
          contractor_id: 'CTR-CUSTOM',
          past_arbitration_count: 3,
          disputed_claims_value_cr: 140.0,
          historical_stays: 1,
          blacklisted: false,
          financial_solvency_rating: 'BBB'
        },
        operational_metrics: {
          physical_progress_pct: 35.0,
          financial_progress_pct: 58.0,
          right_of_way_available_pct: 62.0,
          pending_variation_orders_cr: 85.0
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
      }
    } catch (err) {
      console.error('Evaluation failed:', err);
    } finally {
      setEvaluating(false);
    }
  };

  const niv = profileData?.nivaran_assessment;
  const meta = profileData?.project_metadata;
  const litigationProb = niv?.litigation_probability ?? 0.78;
  const gaugeOffset = 251.2 - (251.2 * litigationProb);

  return (
    <LoginGate>
      <div className="space-y-8 font-sans pb-16">
        
        {/* ═══════ MODULE HERO HEADER ═══════ */}
        <div className="bg-slate-900 text-white rounded-2xl p-7 sm:p-9 border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-bold uppercase tracking-wider">
                <Scale className="w-4 h-4 text-indigo-400" />
                <span>NIVARAN · Contractual, Legal &amp; Dispute Risk Engine</span>
              </div>
              <h1 className="font-heading font-extrabold text-[28px] sm:text-[34px] text-white leading-tight tracking-tight">
                Contractual Vulnerability &amp; Dispute Preemption
              </h1>
              <p className="text-slate-300 text-[14px] leading-relaxed max-w-2xl">
                NLP scrutiny of CPWD GCC / EPC clauses, empirical analysis of contractor litigation histories, 
                and predictive arbitration modeling to preempt contractor abandonment before high-court stays.
              </p>
            </div>

            {/* Quick Stat Strip */}
            <div className="lg:col-span-4 bg-slate-950/80 border border-slate-800 rounded-xl p-4.5 grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-[10.5px] font-bold text-slate-400 uppercase">Monitored Contracts</div>
                <div className="font-mono text-[22px] font-extrabold text-white mt-0.5">2,207</div>
                <div className="text-[9.5px] text-slate-500 mt-0.5">CPWD GCC &amp; FIDIC</div>
              </div>
              <div>
                <div className="text-[10.5px] font-bold text-slate-400 uppercase">Mean Dispute Risk</div>
                <div className="font-mono text-[22px] font-extrabold text-red-400 mt-0.5">64.2%</div>
                <div className="text-[9.5px] text-slate-500 mt-0.5">High / Critical Class</div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════ PROJECT SELECTOR BAR ═══════ */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-gov-navy shrink-0" />
            <div>
              <div className="text-[11px] font-bold text-text-muted uppercase">Select Monitored Infrastructure Project</div>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="font-heading font-bold text-[14px] text-gov-navy bg-slate-50 border border-slate-300 rounded px-3 py-1 mt-0.5 focus:outline-none focus:border-indigo-600 cursor-pointer"
              >
                {projects.length > 0 ? (
                  projects.map((p) => (
                    <option key={p.project_id} value={p.project_id}>
                      {p.project_name} ({p.project_id}) — ₹{p.total_sanctioned_cost_cr} Cr
                    </option>
                  ))
                ) : (
                  <option value="PRJ-NH-2026-089">Bharatmala Express Highway Expansion (Package 4)</option>
                )}
              </select>
            </div>
          </div>

          {meta && (
            <div className="flex items-center gap-4 text-xs font-sans">
              <span className="px-2.5 py-1 rounded bg-blue-50 text-blue-800 border border-blue-200 font-bold">
                {meta.sector}
              </span>
              <span className="text-text-secondary">
                Agency: <strong className="text-gov-navy">{meta.executing_agency}</strong>
              </span>
              <span className="text-text-secondary font-mono">
                Sanctioned: <strong className="text-gov-navy">₹{meta.total_sanctioned_cost_cr.toLocaleString()} Cr</strong>
              </span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl p-12 text-center text-slate-500 font-medium border border-slate-200 flex items-center justify-center gap-3">
            <RefreshCw className="w-5 h-5 animate-spin text-indigo-600" />
            <span>Analyzing contract legal risks and contractor litigation exposure...</span>
          </div>
        ) : (
          <>
            {/* ═══════ DISPUTE GAUGE & CLAUSE BREAKDOWN ═══════ */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Column: Risk Gauge Card */}
              <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200 shadow-md flex flex-col justify-between space-y-6">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <Scale className="w-5 h-5 text-indigo-600" />
                      <h3 className="font-heading font-extrabold text-[16px] text-gov-navy">
                        Dispute Probability Gauge
                      </h3>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded text-[11px] font-black uppercase tracking-wider ${
                      niv?.dispute_risk_level === 'CRITICAL' ? 'bg-red-100 text-red-700 border border-red-200' :
                      niv?.dispute_risk_level === 'HIGH' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                      'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}>
                      {niv?.dispute_risk_level || 'HIGH'} RISK
                    </span>
                  </div>

                  {/* Circular Gauge */}
                  <div className="flex flex-col items-center justify-center py-6">
                    <div className="relative w-44 h-44 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" className="text-slate-100" fill="transparent" />
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          stroke="currentColor"
                          strokeWidth="8"
                          className={`${litigationProb > 0.6 ? 'text-red-500' : litigationProb > 0.3 ? 'text-amber-500' : 'text-emerald-500'} transition-all duration-1000 ease-out`}
                          fill="transparent"
                          strokeDasharray="251.2"
                          strokeDashoffset={gaugeOffset}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-[34px] font-black text-gov-navy font-mono leading-none">
                          {Math.round(litigationProb * 100)}%
                        </span>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">
                          Litigation Prob.
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Dual Meters */}
                  <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
                    <div>
                      <div className="flex justify-between font-bold mb-1">
                        <span className="text-slate-700">NLP Clause Ambiguity Index</span>
                        <span className="text-indigo-700 font-mono">{niv?.clause_risk_score ?? 0.85} / 1.0</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${(niv?.clause_risk_score ?? 0.85) * 100}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between font-bold mb-1">
                        <span className="text-slate-700">Contractor Litigation Exposure</span>
                        <span className="text-red-600 font-mono">{niv?.contractor_litigation_index ?? 78.5} / 100</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-red-500 h-full rounded-full" style={{ width: `${niv?.contractor_litigation_index ?? 78.5}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preemptive Action Box */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 space-y-1">
                  <div className="text-[10.5px] font-extrabold text-amber-900 uppercase flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>Statutory Preemption Protocol:</span>
                  </div>
                  <p className="text-[12px] text-amber-950 font-medium leading-snug">
                    {niv?.recommended_preemptive_action || 'Establish dispute avoidance board and mandate escrow account release for variation orders.'}
                  </p>
                </div>
              </div>

              {/* Right Column: Flagged Clauses Detailed Scrutiny */}
              <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-md space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-heading font-extrabold text-[16px] text-gov-navy">
                      Flagged Contract Clauses &amp; Legal Traps
                    </h3>
                  </div>
                  <span className="text-[12px] font-mono font-bold text-slate-500">
                    {niv?.flagged_clauses?.length || 0} Clauses Flagged
                  </span>
                </div>

                <div className="space-y-3.5 max-h-[480px] overflow-y-auto pr-1">
                  {niv?.flagged_clauses && niv.flagged_clauses.length > 0 ? (
                    niv.flagged_clauses.map((clause, idx) => (
                      <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-indigo-300 transition-all space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                              {clause.clause_id}
                            </span>
                            <h4 className="font-heading font-bold text-[13.5px] text-gov-navy">
                              {clause.clause_title}
                            </h4>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            clause.severity === 'CRITICAL' ? 'bg-red-100 text-red-700 border border-red-200' :
                            clause.severity === 'HIGH' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {clause.severity} SEVERITY
                          </span>
                        </div>

                        <p className="text-[12.5px] text-slate-700 font-sans italic bg-white p-2.5 rounded border border-slate-200">
                          "{clause.detected_text}"
                        </p>

                        <div className="text-[12px] text-text-secondary leading-relaxed">
                          <strong className="text-slate-900">Legal Ramification: </strong>
                          {clause.legal_risk_reason}
                        </div>

                        {clause.suggested_amendment && (
                          <div className="text-[11.5px] text-emerald-800 bg-emerald-50 p-2 rounded border border-emerald-200 font-medium">
                            <strong>Recommended Amendment: </strong> {clause.suggested_amendment}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-slate-400 font-medium">
                      No high-risk clauses identified in current standard agreement.
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* ═══════ INTERACTIVE CONTRACT CLAUSE NLP TESTER ═══════ */}
            <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                    <Sparkles className="w-4 h-4" />
                    <span>Real-Time NLP Clause Scrutiny Sandbox</span>
                  </div>
                  <h3 className="font-heading font-extrabold text-[20px] text-white">
                    Test Custom Tender Agreement / CPWD GCC Clause
                  </h3>
                </div>
                <button
                  onClick={handleEvaluateCustom}
                  disabled={evaluating}
                  className="btn-saffron-pill text-[13px] py-2.5 px-6 self-start sm:self-auto shrink-0 shadow-md cursor-pointer flex items-center gap-2"
                >
                  {evaluating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Gavel className="w-4 h-4" />}
                  <span>Run NLP Legal Audit</span>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-7 space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase">
                    Paste Raw Contract Clause / Special Conditions of Contract (SCC):
                  </label>
                  <textarea
                    rows={4}
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3.5 text-[13px] text-slate-200 font-mono focus:outline-none focus:border-indigo-500 transition-colors"
                    placeholder="Enter contractual text..."
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Evaluates against 4 major litigation pattern dictionaries.</span>
                    <button
                      onClick={() => setCustomText('Clause 10CC: Price escalation shall be calculated strictly on WPI base index of sanction year. Deviation beyond 25% requires prior sanction of Cabinet committee.')}
                      className="text-indigo-400 hover:underline"
                    >
                      Load Sample Clause 10CC
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-5 bg-slate-950/80 rounded-xl p-5 border border-slate-800 space-y-3 min-h-[160px]">
                  <div className="text-[11px] font-bold text-slate-400 uppercase border-b border-slate-800/80 pb-2">
                    Live Audit Output
                  </div>
                  {customResult ? (
                    <div className="space-y-2.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300">Predicted Litigation Risk:</span>
                        <span className="font-mono text-base font-extrabold text-red-400">
                          {Math.round(customResult.litigation_probability * 100)}% ({customResult.dispute_risk_level})
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300">Flagged Risk Categories:</span>
                        <span className="font-mono font-bold text-amber-400">
                          {customResult.flagged_clauses.length} Anomalies
                        </span>
                      </div>
                      <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-[11.5px] text-slate-300">
                        {customResult.recommended_preemptive_action}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-slate-500 text-xs font-mono">
                      Click "Run NLP Legal Audit" to inspect clause vulnerability in real time.
                    </div>
                  )}
                </div>
              </div>
            </div>

          </>
        )}

      </div>
    </LoginGate>
  );
}
