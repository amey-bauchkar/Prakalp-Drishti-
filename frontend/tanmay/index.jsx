import React, { useState, useEffect } from 'react';
import {
  ShieldAlert, AlertTriangle, Scale, RefreshCw, Search, Filter,
  Calculator, Award, ArrowRight, ChevronRight, BarChart3, FileSearch,
  ShieldCheck, Layers, CheckCircle2, FileText, Activity
} from 'lucide-react';

export default function SatyaKavachView() {
  const [activeTab, setActiveTab] = useState('bunching');
  const [summaryData, setSummaryData] = useState(null);
  const [histogramData, setHistogramData] = useState(null);
  const [clauseData, setClauseData] = useState(null);
  const [rankingsData, setRankingsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState('All');

  // Simulator state
  const [simOrigCost, setSimOrigCost] = useState(1000);
  const [simSanctionYear, setSimSanctionYear] = useState(2018);
  const [simRevCost, setSimRevCost] = useState(1195);
  const [simSteelWeight, setSimSteelWeight] = useState(20);
  const [simCementWeight, setSimCementWeight] = useState(15);
  const [simFuelWeight, setSimFuelWeight] = useState(15);
  const [simLaborWeight, setSimLaborWeight] = useState(25);
  const [simOtherWeight, setSimOtherWeight] = useState(25);
  const [simResult, setSimResult] = useState(null);
  const [simulating, setSimulating] = useState(false);

  useEffect(() => { fetchAllData(); }, []);

  const fetchAllData = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/tanmay/gaming-analysis').then(r => r.json()).catch(() => null),
      fetch('/api/tanmay/bunching-histogram').then(r => r.json()).catch(() => null),
      fetch('/api/tanmay/clause-10cc-audit?limit=100').then(r => r.json()).catch(() => null),
      fetch('/api/tanmay/agency-rankings').then(r => r.json()).catch(() => null),
    ]).then(([summary, hist, clause, rank]) => {
      setSummaryData(summary);
      setHistogramData(hist);
      setClauseData(clause);
      setRankingsData(rank);
      setLoading(false);
    });
  };

  const handleSimulate = (e) => {
    if (e) e.preventDefault();
    setSimulating(true);
    fetch('/api/tanmay/simulate-clause-10cc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        original_cost_cr: parseFloat(simOrigCost),
        sanction_year: parseInt(simSanctionYear),
        revised_cost_cr: parseFloat(simRevCost),
        p_steel: simSteelWeight / 100,
        p_cement: simCementWeight / 100,
        p_fuel: simFuelWeight / 100,
        p_labor: simLaborWeight / 100,
        p_other: simOtherWeight / 100
      })
    }).then(r => r.json()).then(json => { setSimResult(json); setSimulating(false); })
      .catch(() => setSimulating(false));
  };

  useEffect(() => { handleSimulate(); }, []);

  const filteredFlaggedProjects = summaryData?.flagged_sample_projects?.filter(p => {
    const q = searchQuery.toLowerCase();
    const matchQ = p.project_name.toLowerCase().includes(q) || p.project_id.includes(q) || p.agency.toLowerCase().includes(q) || p.state.toLowerCase().includes(q) || p.sector.toLowerCase().includes(q);
    const matchS = selectedSector === 'All' || p.sector === selectedSector;
    return matchQ && matchS;
  }) || [];

  const filteredClauseRecords = clauseData?.audited_records?.filter(p => {
    const q = searchQuery.toLowerCase();
    const matchQ = p.project_name.toLowerCase().includes(q) || p.project_id.includes(q) || p.agency.toLowerCase().includes(q) || p.state.toLowerCase().includes(q) || p.sector.toLowerCase().includes(q);
    const matchS = selectedSector === 'All' || p.sector === selectedSector;
    return matchQ && matchS;
  }) || [];

  const sectors = ['All', 'Roads & Highways', 'Railways', 'Power & Thermal', 'Coal & Mining', 'Civil Aviation', 'Ports & Shipping'];

  const tabs = [
    { id: 'bunching', label: 'CCEA Evasion Audit' },
    { id: 'clause10cc', label: 'Clause 10CC Audit' },
    { id: 'simulator', label: 'Inflation Simulator' },
    { id: 'leaderboard', label: 'Agency Risk' },
  ];

  return (
    <div className="space-y-8 font-sans">
      {/* ═══════ MODULE HERO (SOVEREIGN INSTITUTIONAL DOSSIER) ═══════ */}
      <section className="panel p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-gov-saffron-light text-gov-saffron-dark border border-gov-gold-border text-[11px] font-bold uppercase tracking-wider font-mono">
              <ShieldAlert className="w-3.5 h-3.5 text-gov-saffron" />
              <span>SATYA-KAVACH · Contract &amp; Compliance Analytics</span>
            </div>
            <h1 className="font-heading font-extrabold text-[30px] sm:text-[38px] leading-[1.15] text-gov-navy tracking-tight">
              20% CCEA Cabinet Rule Evasion &amp;<br />
              CPWD Clause 10CC Audit
            </h1>
            <p className="text-text-secondary text-[15px] sm:text-[15.5px] leading-relaxed max-w-2xl font-sans">
              McCrary density discontinuity test detecting artificial cost escalation clustering 
              at 18.0%–19.9%, designed to bypass Cabinet Committee on Economic Affairs scrutiny. 
              Enforces statutory CPWD Clause 10CC 85% escalable ceilings pegged to tender bid-date indices.
            </p>
            <div className="flex items-center gap-4 pt-2">
              <a href="#analysis" className="btn-saffron-pill py-3 px-6 text-[13.5px] font-bold shadow-md">
                <span>Explore Analysis</span>
                <ArrowRight className="w-4 h-4" />
              </a>
              <a href="#methodology" className="text-[14px] font-bold text-gov-navy hover:text-gov-saffron transition-colors flex items-center gap-1">
                <span>Methodology</span>
                <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Key finding Docket Box */}
          <div className="lg:col-span-4 flex justify-center lg:justify-end">
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-7 text-center w-full max-w-xs shadow-subtle">
              <div className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-2 font-mono">Key Finding</div>
              <div className="text-[52px] font-heading font-black text-gov-navy leading-none tracking-tight font-mono">1.65×</div>
              <div className="text-[13.5px] text-text-secondary font-bold mt-2">McCrary density discontinuity ratio</div>
              <div className="text-[11px] font-mono text-gov-saffron-dark mt-1 font-bold">p &lt; 0.001 · Statistically significant</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ STAT STRIP ═══════ */}
      {loading ? (
        <div className="loading-center py-12"><RefreshCw className="w-5 h-5 animate-spin" />Loading analysis…</div>
      ) : summaryData ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="panel p-4">
              <div className="text-[11.5px] text-text-muted font-bold uppercase tracking-wider">Bunching Zone (18–20%)</div>
              <div className="text-[30px] font-black text-gov-navy mt-1 tracking-tight font-mono">{summaryData.kpi_metrics?.projects_in_bunching_zone_18_20pct}</div>
              <div className="text-[12px] text-text-muted mt-1">₹{summaryData.kpi_metrics?.bunching_zone_capital_cr?.toLocaleString()} Cr at risk</div>
            </div>
            <div className="panel p-4">
              <div className="text-[11.5px] text-text-muted font-bold uppercase tracking-wider">Cabinet Breached (≥20%)</div>
              <div className="text-[30px] font-black text-rose-600 mt-1 tracking-tight font-mono">{summaryData.kpi_metrics?.projects_above_20pct_cabinet_rule}</div>
              <div className="text-[12px] text-text-muted mt-1">Mandatory PIB review required</div>
            </div>
            <div className="panel p-4">
              <div className="text-[11.5px] text-text-muted font-bold uppercase tracking-wider">Unjustified Padding</div>
              <div className="text-[30px] font-black text-gov-navy mt-1 tracking-tight font-mono">₹{summaryData.kpi_metrics?.total_unjustified_excess_margin_cr?.toLocaleString()} Cr</div>
              <div className="text-[12px] text-text-muted mt-1">Clause 10CC excess claims</div>
            </div>
            <div className="panel p-4">
              <div className="text-[11.5px] text-text-muted font-bold uppercase tracking-wider">Data Coverage</div>
              <div className="text-[30px] font-black text-gov-navy mt-1 tracking-tight font-mono">2,207</div>
              <div className="text-[12px] text-text-muted mt-1">Central mega-projects · 2005–2026</div>
            </div>
          </div>

          {/* ═══════ ANALYTICAL WORKSPACE ═══════ */}
          <section id="analysis" className="space-y-6">
            <div className="flex items-center gap-2 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto no-scrollbar">
              {tabs.map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold transition-all whitespace-nowrap ${
                    activeTab === t.id
                      ? 'bg-gov-navy text-white shadow-elevated'
                      : 'bg-transparent text-text-secondary hover:text-gov-navy hover:bg-white/80'
                  }`}
                >
                  <span>{t.label}</span>
                </button>
              ))}
            </div>

            {/* ── Tab: CCEA Bunching ── */}
            {activeTab === 'bunching' && (
              <div className="panel p-4 sm:p-5 space-y-8">
                {/* Methodology context */}
                <div className="card-parchment-gold rounded-2xl p-6 sm:p-7 shadow-subtle border border-gov-gold-border">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-[13.5px] text-text-secondary">
                    <div>
                      <div className="font-heading font-bold text-gov-navy text-[14.5px] mb-1">What is being measured</div>
                      <p>Distribution of cost revision percentages across all 2,207 central sector mega-projects to detect artificial clustering below the 20% CCEA threshold.</p>
                    </div>
                    <div>
                      <div className="font-heading font-bold text-gov-navy text-[14.5px] mb-1">Methodology</div>
                      <p>McCrary density discontinuity estimator comparing left-side vs right-side bin densities at the 20% regulatory boundary.</p>
                    </div>
                    <div>
                      <div className="font-heading font-bold text-gov-navy text-[14.5px] mb-1">Interpretation</div>
                      <p>{summaryData.mccrary_bunching_signal?.interpretation}</p>
                    </div>
                  </div>
                </div>

                {/* Histogram */}
                <div className="space-y-4">
                  <h3 className="font-heading font-bold text-[20px] text-gov-navy">Cost Overrun Distribution &amp; Bunching Analysis</h3>
                  <div className="space-y-2">
                    {histogramData?.bins?.map((bin, idx) => {
                      const maxCount = Math.max(...(histogramData.bins.map(b => b.project_count) || [100]));
                      const barWidth = Math.max(3, (bin.project_count / maxCount) * 100);
                      return (
                        <div key={idx} className="flex items-center gap-3 text-[13px]">
                          <div className={`w-44 shrink-0 text-right truncate font-mono font-medium ${
                            bin.is_bunching_spike ? 'text-gov-saffron font-bold' : bin.is_cabinet_breached ? 'text-rose-600 font-bold' : 'text-text-muted'
                          }`}>{bin.bin_label}</div>
                          <div className="flex-1 bg-slate-100 rounded-lg h-6 overflow-hidden relative flex items-center border border-slate-200">
                            <div className={`h-full rounded-lg transition-all ${
                              bin.is_bunching_spike ? 'bg-gov-saffron' : bin.is_cabinet_breached ? 'bg-rose-500/80' : 'bg-slate-300'
                            }`} style={{ width: `${barWidth}%` }} />
                            <span className="absolute left-3 text-[11.5px] font-bold text-gov-navy font-mono">
                              {bin.project_count} projects · ₹{bin.total_capex_cr?.toLocaleString()} Cr
                            </span>
                          </div>
                          {bin.is_bunching_spike && <span className="status-badge status-warning shrink-0 font-bold">Spike</span>}
                          {bin.range_min === 20.0 && bin.range_max === 22.0 && <span className="status-badge status-danger shrink-0 font-bold">Cabinet</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-6 border-t border-border-default">
                  <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input type="text" placeholder="Search flagged projects…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-[13px] border border-border-default rounded-xl focus:outline-none focus:border-gov-navy font-sans" />
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                    {sectors.map(sec => (
                      <button key={sec} onClick={() => setSelectedSector(sec)}
                        className={`px-3.5 py-2 text-[12px] font-bold rounded-xl transition-all shrink-0 ${
                          selectedSector === sec ? 'bg-gov-navy text-white shadow-sm' : 'bg-white text-text-secondary border border-border-default hover:bg-slate-50'
                        }`}>{sec}</button>
                    ))}
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[17px] font-bold text-gov-navy font-heading">Flagged Evasion Projects</h3>
                    <span className="text-[13px] text-text-muted font-mono font-medium">{filteredFlaggedProjects.length} projects</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Project</th>
                          <th>Sector / State</th>
                          <th>Agency</th>
                          <th className="num">Original Cost</th>
                          <th className="num">Revised Cost</th>
                          <th className="num">Overrun</th>
                          <th className="text-center">Margin to 20%</th>
                          <th className="text-center">Verdict</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredFlaggedProjects.map((p, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                            <td><span className="text-text-muted text-[11px] font-mono mr-1">#{p.project_id}</span><span className="font-bold text-gov-navy">{p.project_name}</span></td>
                            <td><span className="font-medium text-gov-navy">{p.sector}</span><br /><span className="text-[11px] text-text-muted">{p.state || 'National'}</span></td>
                            <td className="text-text-secondary font-medium">{p.agency}</td>
                            <td className="num font-mono text-text-muted">₹{p.original_cost_cr.toLocaleString()} Cr</td>
                            <td className="num font-mono font-bold text-gov-navy">₹{p.revised_cost_cr.toLocaleString()} Cr</td>
                            <td className="num font-mono font-bold text-gov-saffron">+{p.overrun_pct}%</td>
                            <td className="text-center text-[12px] font-mono font-bold text-gov-saffron">{p.evasion_margin_pct}% below</td>
                            <td className="text-center"><span className={`status-badge ${p.audit_verdict === 'EXCESSIVE_PRICE_GOUGING' ? 'status-danger' : 'status-warning'}`}>{p.audit_verdict === 'EXCESSIVE_PRICE_GOUGING' ? 'Gouging' : 'Flagged'}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ── Tab: Clause 10CC ── */}
            {activeTab === 'clause10cc' && (
              <div className="panel p-4 sm:p-5 space-y-8">
                <div className="card-parchment-gold rounded-2xl p-6 border border-gov-gold-border">
                  <h3 className="text-[17px] font-bold text-gov-navy mb-2 font-heading">Statutory Price Escalation Framework</h3>
                  <p className="text-[13.5px] text-text-secondary leading-relaxed max-w-3xl">
                    Under CPWD Clause 10CC, only <strong>85% of contract value is escalable</strong> (15% is fixed contractor overhead). 
                    Macro indices (Steel, Cement, Fuel, Labor) are locked to the tender bid submission date. 
                    Claims exceeding statutory allowances represent unjustified margin padding.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[17px] font-bold text-gov-navy font-heading">Audited Records</h3>
                    <span className="text-[13px] font-bold text-rose-600 font-mono">Total excess: ₹{clauseData?.total_portfolio_excess_claimed_cr?.toLocaleString()} Cr</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Project</th>
                          <th>Agency / Sector</th>
                          <th className="text-center">Year</th>
                          <th className="num">Original</th>
                          <th className="num">Claimed</th>
                          <th className="num" style={{color:'#18804B'}}>10CC Cap</th>
                          <th className="num" style={{color:'#B42318'}}>Excess</th>
                          <th className="text-center">Verdict</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredClauseRecords.map((p, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                            <td><span className="text-text-muted text-[11px] font-mono mr-1">#{p.project_id}</span><span className="font-bold text-gov-navy">{p.project_name}</span></td>
                            <td><span className="font-medium text-gov-navy">{p.agency}</span><br /><span className="text-[11px] text-text-muted">{p.sector}</span></td>
                            <td className="text-center font-mono font-bold">{p.sanction_year}</td>
                            <td className="num font-mono text-text-muted">₹{p.original_cost_cr.toLocaleString()} Cr</td>
                            <td className="num font-mono font-bold">₹{p.claimed_escalation_cr.toLocaleString()} Cr</td>
                            <td className="num font-mono font-bold" style={{color:'#18804B'}}>₹{p.statutory_10cc_allowed_cr.toLocaleString()} Cr</td>
                            <td className="num font-mono font-bold" style={{color:'#B42318'}}>+₹{p.excess_margin_claimed_cr.toLocaleString()} Cr</td>
                            <td className="text-center"><span className={`status-badge ${p.verdict === 'EXCESSIVE_PRICE_GOUGING' ? 'status-danger' : 'status-warning'}`}>{p.verdict === 'EXCESSIVE_PRICE_GOUGING' ? 'Gouging' : 'Flagged'}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ── Tab: Simulator ── */}
            {activeTab === 'simulator' && (
              <div className="panel p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-[19px] font-bold text-gov-navy mb-1 font-heading">Contract Price Variation Simulator</h3>
                  <p className="text-[13px] text-text-muted mb-6">Adjust contract parameters and material weight fractions to calculate statutory allowable escalation under Clause 10CC.</p>

                  <form onSubmit={handleSimulate} className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[12px] font-bold text-gov-navy block mb-1 font-mono">Original Cost (₹ Cr)</label>
                        <input type="number" value={simOrigCost} onChange={e => setSimOrigCost(e.target.value)}
                          className="w-full p-3 text-[14px] border border-border-default rounded-xl focus:outline-none focus:border-gov-navy font-mono font-bold" />
                      </div>
                      <div>
                        <label className="text-[12px] font-bold text-gov-navy block mb-1 font-mono">Revised Cost (₹ Cr)</label>
                        <input type="number" value={simRevCost} onChange={e => setSimRevCost(e.target.value)}
                          className="w-full p-3 text-[14px] border border-border-default rounded-xl focus:outline-none focus:border-gov-navy font-mono font-bold" />
                      </div>
                    </div>

                    <div>
                      <label className="text-[12px] font-bold text-gov-navy block mb-1 font-mono">Tender Base Year</label>
                      <select value={simSanctionYear} onChange={e => setSimSanctionYear(e.target.value)}
                        className="w-full p-3 text-[14px] border border-border-default rounded-xl focus:outline-none focus:border-gov-navy font-mono font-bold">
                        {[2005,2008,2010,2012,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024].map(yr => (
                          <option key={yr} value={yr}>{yr}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-3 border-t border-border-default pt-4">
                      <div className="text-[12px] font-bold text-gov-navy">Material Weight Fractions (Total: {simSteelWeight + simCementWeight + simFuelWeight + simLaborWeight + simOtherWeight}%)</div>
                      {[
                        ['Steel', simSteelWeight, setSimSteelWeight],
                        ['Cement', simCementWeight, setSimCementWeight],
                        ['Fuel', simFuelWeight, setSimFuelWeight],
                        ['Labor', simLaborWeight, setSimLaborWeight],
                      ].map(([label, val, setter]) => (
                        <div key={label} className="flex items-center justify-between text-[13px]">
                          <span className="text-text-secondary w-24 font-medium">{label} ({val}%)</span>
                          <input type="range" min="0" max="50" value={val} onChange={e => setter(parseInt(e.target.value))}
                            className="flex-1 mx-3 accent-gov-saffron h-2" />
                        </div>
                      ))}
                    </div>

                    <button type="submit" disabled={simulating} className="btn-saffron-pill w-full justify-center py-3.5 text-xs font-bold uppercase tracking-wider">
                      {simulating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
                      <span>Execute Calculation</span>
                    </button>
                  </form>
                </div>

                {/* Results */}
                {simResult && (
                  <div className="space-y-6 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[18px] font-bold text-gov-navy font-heading">Statutory Audit Result</h3>
                      <span className={`status-badge ${simResult.audit_verdict === 'COMPLIANT_WITHIN_10CC' ? 'status-success' : 'status-danger'}`}>
                        {simResult.audit_verdict === 'COMPLIANT_WITHIN_10CC' ? 'Compliant' : 'Non-Compliant'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="panel p-4">
                        <div className="text-[11px] text-text-muted uppercase font-bold">Claimed Overrun</div>
                        <div className="text-[26px] font-black text-gov-navy mt-1 tracking-tight font-mono">₹{simResult.contractor_claimed_escalation_cr?.toLocaleString()} Cr</div>
                        <div className="text-[12px] text-gov-saffron font-bold mt-0.5">+{simResult.claimed_overrun_pct}% over original</div>
                      </div>
                      <div className="panel p-4">
                        <div className="text-[11px] text-text-muted uppercase font-bold">Statutory 10CC Cap</div>
                        <div className="text-[26px] font-black text-emerald-600 mt-1 tracking-tight font-mono">₹{simResult.statutory_allowed_escalation_cr?.toLocaleString()} Cr</div>
                        <div className="text-[12px] text-text-muted font-medium mt-0.5">85% escalable ceiling</div>
                      </div>
                    </div>

                    {simResult.unjustified_excess_margin_cr > 0 && (
                      <div className="note note-critical">
                        <div className="flex items-center justify-between text-[14px] font-bold text-rose-700 font-mono">
                          <span>Unjustified padding flagged</span>
                          <span>+₹{simResult.unjustified_excess_margin_cr?.toLocaleString()} Cr</span>
                        </div>
                        <p className="text-[12px] text-rose-800 mt-1 font-sans">Disallowance recommended under CPWD General Conditions of Contract.</p>
                      </div>
                    )}

                    <div className="border-t border-border-default pt-4">
                      <div className="text-[12px] font-bold text-gov-navy mb-2 font-mono">Macro Index Growth ({simResult.macro_indices?.base_year} → {simResult.macro_indices?.current_year})</div>
                      <div className="grid grid-cols-4 gap-3">
                        {[['Steel', simResult.macro_indices?.steel_growth_pct], ['Cement', simResult.macro_indices?.cement_growth_pct], ['Fuel', simResult.macro_indices?.fuel_growth_pct], ['Labor', simResult.macro_indices?.labor_growth_pct]].map(([label, val]) => (
                          <div key={label} className="text-center bg-white p-2.5 rounded-xl border border-slate-200">
                            <div className="text-[11px] text-text-muted font-medium">{label}</div>
                            <div className="text-[15px] font-black text-gov-navy font-mono">+{val}%</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Tab: Agency Risk ── */}
            {activeTab === 'leaderboard' && (
              <div className="panel p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[19px] font-bold text-gov-navy font-heading">Agency Compliance &amp; Risk Ranking</h3>
                  <span className="text-[13px] text-text-muted font-mono font-medium">{rankingsData?.total_agencies_evaluated} agencies evaluated</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Agency</th>
                        <th className="text-center">Projects</th>
                        <th className="text-center">Bunching (18–20%)</th>
                        <th className="text-center">Cabinet Breached</th>
                        <th className="num">Total Capex</th>
                        <th className="num">Excess Claims</th>
                        <th className="text-center">Score</th>
                        <th className="text-center">Risk Tier</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rankingsData?.rankings?.map((a, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="font-bold text-gov-navy">{a.agency_name}</td>
                          <td className="text-center text-text-muted font-mono">{a.total_projects}</td>
                          <td className="text-center font-mono font-bold text-gov-saffron">{a.bunching_projects_18_20pct} ({a.bunching_rate_pct}%)</td>
                          <td className="text-center font-mono font-bold text-rose-600">{a.cabinet_breached_projects}</td>
                          <td className="num font-mono text-text-muted">₹{a.total_revised_capex_cr?.toLocaleString()} Cr</td>
                          <td className="num font-mono font-bold text-rose-600">₹{a.total_excess_margin_claimed_cr?.toLocaleString()} Cr</td>
                          <td className="text-center font-mono font-black text-gov-navy">{a.institutional_gaming_score}/100</td>
                          <td className="text-center">
                            <span className={`status-badge ${a.risk_tier === 'HIGH_GAMING_RISK' ? 'status-danger' : a.risk_tier === 'MODERATE_WATCHLIST' ? 'status-warning' : 'status-success'}`}>
                              {a.risk_tier === 'HIGH_GAMING_RISK' ? 'High Risk' : a.risk_tier === 'MODERATE_WATCHLIST' ? 'Watchlist' : 'Compliant'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>

          {/* ═══════ METHODOLOGY ═══════ */}
          <section id="methodology" className="bg-white border border-border-default rounded-3xl overflow-hidden shadow-card">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="p-8 sm:p-10 border-b lg:border-b-0 lg:border-r border-border-default">
                <h3 className="text-[17px] font-bold text-gov-navy mb-3 font-heading">20% CCEA Cabinet Overrun Threshold</h3>
                <p className="text-[14px] text-text-secondary leading-relaxed font-sans">
                  Projects incurring cost revisions ≥20% of original sanctioned cost require mandatory CCEA and PIB approval. 
                  SATYA-KAVACH applies McCrary density discontinuity estimators to detect strategic under-reporting at 18.0%–19.99%.
                </p>
              </div>
              <div className="p-8 sm:p-10">
                <h3 className="text-[17px] font-bold text-gov-navy mb-3 font-heading">CPWD Clause 10CC Escalation Cap</h3>
                <p className="text-[14px] text-text-secondary leading-relaxed font-sans">
                  Under standard public works contracts, price escalation is restricted to 85% of contract value 
                  with base indices pegged to the tender submission date. Inflation claims are audited against 
                  historical WPI and Labour Wage Index series.
                </p>
              </div>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
