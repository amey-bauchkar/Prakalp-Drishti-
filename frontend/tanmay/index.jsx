import React, { useState, useEffect } from 'react';
import {
  ShieldAlert, AlertTriangle, Scale, RefreshCw, Search, Filter,
  Calculator, Award, ArrowRight, ChevronRight, BarChart3, FileSearch
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
    <div className="space-y-0">

      {/* ═══════ MODULE HERO ═══════ */}
      <section className="pb-12 pt-2">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-7 space-y-4">
            <div className="text-[12px] font-semibold uppercase tracking-widest text-gov-saffron">
              SATYA-KAVACH · Contract &amp; Compliance Analytics
            </div>
            <h1 className="text-[36px] leading-[1.12] font-semibold text-gov-navy tracking-tight">
              20% CCEA Cabinet Rule Evasion &amp;<br />
              CPWD Clause 10CC Audit
            </h1>
            <p className="text-text-secondary text-[15px] leading-relaxed max-w-xl">
              McCrary density discontinuity test detecting artificial cost escalation clustering 
              at 18.0%–19.9%, designed to bypass Cabinet Committee on Economic Affairs scrutiny. 
              Enforces statutory CPWD Clause 10CC 85% escalable ceilings pegged to tender bid-date indices.
            </p>
            <div className="flex items-center gap-4 pt-1">
              <a href="#analysis" className="btn-primary">
                Explore Analysis <ArrowRight className="w-4 h-4" />
              </a>
              <a href="#methodology" className="text-[14px] font-medium text-gov-navy hover:text-gov-saffron transition-colors flex items-center gap-1">
                Methodology <ChevronRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Key finding */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="bg-white border border-border-default rounded-lg p-8 shadow-card text-center max-w-xs">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-4">Key Finding</div>
              <div className="text-[52px] font-semibold text-gov-navy leading-none tracking-tight">1.65×</div>
              <div className="text-[14px] text-text-secondary mt-2">McCrary density discontinuity ratio</div>
              <div className="text-[12px] text-text-muted mt-1">p &lt; 0.001 · Statistically significant</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ STAT STRIP ═══════ */}
      {loading ? (
        <div className="loading-center"><RefreshCw className="w-5 h-5 animate-spin" />Loading analysis…</div>
      ) : summaryData ? (
        <>
          <div className="stat-strip -mx-6 sm:mx-0 sm:rounded-lg overflow-hidden mb-12">
            <div className="stat-strip-item">
              <div className="text-[12px] text-text-muted font-medium uppercase tracking-wider">Bunching Zone (18–20%)</div>
              <div className="text-[28px] font-semibold text-gov-navy mt-1 tracking-tight">{summaryData.kpi_metrics?.projects_in_bunching_zone_18_20pct}</div>
              <div className="text-[12px] text-text-muted mt-0.5">₹{summaryData.kpi_metrics?.bunching_zone_capital_cr?.toLocaleString()} Cr at risk</div>
            </div>
            <div className="stat-strip-item">
              <div className="text-[12px] text-text-muted font-medium uppercase tracking-wider">Cabinet Breached (≥20%)</div>
              <div className="text-[28px] font-semibold text-gov-danger mt-1 tracking-tight">{summaryData.kpi_metrics?.projects_above_20pct_cabinet_rule}</div>
              <div className="text-[12px] text-text-muted mt-0.5">Mandatory PIB review required</div>
            </div>
            <div className="stat-strip-item">
              <div className="text-[12px] text-text-muted font-medium uppercase tracking-wider">Unjustified Padding</div>
              <div className="text-[28px] font-semibold text-gov-navy mt-1 tracking-tight">₹{summaryData.kpi_metrics?.total_unjustified_excess_margin_cr?.toLocaleString()} Cr</div>
              <div className="text-[12px] text-text-muted mt-0.5">Clause 10CC excess claims</div>
            </div>
            <div className="stat-strip-item">
              <div className="text-[12px] text-text-muted font-medium uppercase tracking-wider">Data Coverage</div>
              <div className="text-[28px] font-semibold text-gov-navy mt-1 tracking-tight">2,207</div>
              <div className="text-[12px] text-text-muted mt-0.5">Central mega-projects · 2005–2026</div>
            </div>
          </div>

          {/* ═══════ ANALYTICAL WORKSPACE ═══════ */}
          <section id="analysis" className="pb-12">
            <div className="module-tabs overflow-x-auto mb-8">
              {tabs.map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)} className={`module-tab ${activeTab === t.id ? 'active' : ''}`}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* ── Tab: CCEA Bunching ── */}
            {activeTab === 'bunching' && (
              <div className="space-y-8">
                {/* Methodology context */}
                <div className="bg-gov-saffron-light border border-amber-200 rounded-lg p-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-[13px] text-text-secondary">
                    <div>
                      <div className="font-semibold text-gov-navy text-[14px] mb-1">What is being measured</div>
                      <p>Distribution of cost revision percentages across all 2,207 central sector mega-projects to detect artificial clustering below the 20% CCEA threshold.</p>
                    </div>
                    <div>
                      <div className="font-semibold text-gov-navy text-[14px] mb-1">Methodology</div>
                      <p>McCrary density discontinuity estimator comparing left-side vs right-side bin densities at the 20% regulatory boundary.</p>
                    </div>
                    <div>
                      <div className="font-semibold text-gov-navy text-[14px] mb-1">Interpretation</div>
                      <p>{summaryData.mccrary_bunching_signal?.interpretation}</p>
                    </div>
                  </div>
                </div>

                {/* Histogram */}
                <div>
                  <h3 className="text-[18px] font-semibold text-gov-navy mb-4">Cost Overrun Distribution</h3>
                  <div className="space-y-1.5">
                    {histogramData?.bins?.map((bin, idx) => {
                      const maxCount = Math.max(...(histogramData.bins.map(b => b.project_count) || [100]));
                      const barWidth = Math.max(3, (bin.project_count / maxCount) * 100);
                      return (
                        <div key={idx} className="flex items-center gap-3 text-[13px]">
                          <div className={`w-40 shrink-0 text-right truncate ${
                            bin.is_bunching_spike ? 'text-gov-saffron font-semibold' : bin.is_cabinet_breached ? 'text-gov-danger font-medium' : 'text-text-muted'
                          }`}>{bin.bin_label}</div>
                          <div className="flex-1 bg-gray-100 rounded-sm h-5 overflow-hidden relative flex items-center">
                            <div className={`h-full rounded-sm transition-all ${
                              bin.is_bunching_spike ? 'bg-gov-saffron' : bin.is_cabinet_breached ? 'bg-gov-danger/70' : 'bg-gray-300'
                            }`} style={{ width: `${barWidth}%` }} />
                            <span className="absolute left-2 text-[11px] font-medium text-text-primary">
                              {bin.project_count} projects · ₹{bin.total_capex_cr?.toLocaleString()} Cr
                            </span>
                          </div>
                          {bin.is_bunching_spike && <span className="status-badge status-warning shrink-0">Spike</span>}
                          {bin.range_min === 20.0 && bin.range_max === 22.0 && <span className="status-badge status-danger shrink-0">Cabinet</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-4 border-t border-border-default">
                  <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                    <input type="text" placeholder="Search flagged projects…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-[13px] border border-border-default rounded-md focus:outline-none focus:border-gov-navy" />
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {sectors.map(sec => (
                      <button key={sec} onClick={() => setSelectedSector(sec)}
                        className={`px-3 py-1.5 text-[12px] font-medium rounded-md transition-colors shrink-0 ${
                          selectedSector === sec ? 'bg-gov-navy text-white' : 'bg-white text-text-secondary border border-border-default hover:border-border-strong'
                        }`}>{sec}</button>
                    ))}
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[16px] font-semibold text-gov-navy">Flagged Evasion Projects</h3>
                    <span className="text-[13px] text-text-muted">{filteredFlaggedProjects.length} projects</span>
                  </div>
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
                        <tr key={idx}>
                          <td><span className="text-text-muted text-[11px] mr-1">#{p.project_id}</span><span className="font-medium text-gov-navy">{p.project_name}</span></td>
                          <td><span className="font-medium">{p.sector}</span><br /><span className="text-[11px] text-text-muted">{p.state || 'National'}</span></td>
                          <td className="text-text-secondary">{p.agency}</td>
                          <td className="num text-text-muted">₹{p.original_cost_cr.toLocaleString()} Cr</td>
                          <td className="num font-medium">₹{p.revised_cost_cr.toLocaleString()} Cr</td>
                          <td className="num font-medium text-gov-saffron">+{p.overrun_pct}%</td>
                          <td className="text-center text-[12px] font-medium text-gov-saffron">{p.evasion_margin_pct}% below</td>
                          <td className="text-center"><span className={`status-badge ${p.audit_verdict === 'EXCESSIVE_PRICE_GOUGING' ? 'status-danger' : 'status-warning'}`}>{p.audit_verdict === 'EXCESSIVE_PRICE_GOUGING' ? 'Gouging' : 'Flagged'}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── Tab: Clause 10CC ── */}
            {activeTab === 'clause10cc' && (
              <div className="space-y-8">
                <div className="bg-white border border-border-default rounded-lg p-5">
                  <h3 className="text-[16px] font-semibold text-gov-navy mb-2">Statutory Price Escalation Framework</h3>
                  <p className="text-[13px] text-text-secondary leading-relaxed max-w-3xl">
                    Under CPWD Clause 10CC, only <strong>85% of contract value is escalable</strong> (15% is fixed contractor overhead). 
                    Macro indices (Steel, Cement, Fuel, Labor) are locked to the tender bid submission date. 
                    Claims exceeding statutory allowances represent unjustified margin padding.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[16px] font-semibold text-gov-navy">Audited Records</h3>
                    <span className="text-[13px] font-medium text-gov-danger">Total excess: ₹{clauseData?.total_portfolio_excess_claimed_cr?.toLocaleString()} Cr</span>
                  </div>
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
                        <tr key={idx}>
                          <td><span className="text-text-muted text-[11px] mr-1">#{p.project_id}</span><span className="font-medium text-gov-navy">{p.project_name}</span></td>
                          <td><span className="font-medium">{p.agency}</span><br /><span className="text-[11px] text-text-muted">{p.sector}</span></td>
                          <td className="text-center font-medium">{p.sanction_year}</td>
                          <td className="num text-text-muted">₹{p.original_cost_cr.toLocaleString()} Cr</td>
                          <td className="num font-medium">₹{p.claimed_escalation_cr.toLocaleString()} Cr</td>
                          <td className="num font-medium" style={{color:'#18804B'}}>₹{p.statutory_10cc_allowed_cr.toLocaleString()} Cr</td>
                          <td className="num font-medium" style={{color:'#B42318'}}>+₹{p.excess_margin_claimed_cr.toLocaleString()} Cr</td>
                          <td className="text-center"><span className={`status-badge ${p.verdict === 'EXCESSIVE_PRICE_GOUGING' ? 'status-danger' : 'status-warning'}`}>{p.verdict === 'EXCESSIVE_PRICE_GOUGING' ? 'Gouging' : 'Flagged'}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── Tab: Simulator ── */}
            {activeTab === 'simulator' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-[18px] font-semibold text-gov-navy mb-1">Contract Price Variation Simulator</h3>
                  <p className="text-[13px] text-text-muted mb-6">Adjust contract parameters and material weight fractions to calculate statutory allowable escalation under Clause 10CC.</p>

                  <form onSubmit={handleSimulate} className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[12px] font-semibold text-gov-navy block mb-1">Original Cost (₹ Cr)</label>
                        <input type="number" value={simOrigCost} onChange={e => setSimOrigCost(e.target.value)}
                          className="w-full p-2.5 text-[14px] border border-border-default rounded-md focus:outline-none focus:border-gov-navy font-medium" />
                      </div>
                      <div>
                        <label className="text-[12px] font-semibold text-gov-navy block mb-1">Revised Cost (₹ Cr)</label>
                        <input type="number" value={simRevCost} onChange={e => setSimRevCost(e.target.value)}
                          className="w-full p-2.5 text-[14px] border border-border-default rounded-md focus:outline-none focus:border-gov-navy font-medium" />
                      </div>
                    </div>

                    <div>
                      <label className="text-[12px] font-semibold text-gov-navy block mb-1">Tender Base Year</label>
                      <select value={simSanctionYear} onChange={e => setSimSanctionYear(e.target.value)}
                        className="w-full p-2.5 text-[14px] border border-border-default rounded-md focus:outline-none focus:border-gov-navy">
                        {[2005,2008,2010,2012,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024].map(yr => (
                          <option key={yr} value={yr}>{yr}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-3 border-t border-border-default pt-4">
                      <div className="text-[12px] font-semibold text-gov-navy">Material Weight Fractions (Total: {simSteelWeight + simCementWeight + simFuelWeight + simLaborWeight + simOtherWeight}%)</div>
                      {[
                        ['Steel', simSteelWeight, setSimSteelWeight],
                        ['Cement', simCementWeight, setSimCementWeight],
                        ['Fuel', simFuelWeight, setSimFuelWeight],
                        ['Labor', simLaborWeight, setSimLaborWeight],
                      ].map(([label, val, setter]) => (
                        <div key={label} className="flex items-center justify-between text-[13px]">
                          <span className="text-text-secondary w-20">{label} ({val}%)</span>
                          <input type="range" min="0" max="50" value={val} onChange={e => setter(parseInt(e.target.value))}
                            className="flex-1 mx-3 accent-gov-saffron h-1.5" />
                        </div>
                      ))}
                    </div>

                    <button type="submit" disabled={simulating} className="btn-primary w-full justify-center py-3">
                      {simulating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
                      Execute Calculation
                    </button>
                  </form>
                </div>

                {/* Results */}
                {simResult && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[18px] font-semibold text-gov-navy">Statutory Audit Result</h3>
                      <span className={`status-badge ${simResult.audit_verdict === 'COMPLIANT_WITHIN_10CC' ? 'status-success' : 'status-danger'}`}>
                        {simResult.audit_verdict === 'COMPLIANT_WITHIN_10CC' ? 'Compliant' : 'Non-Compliant'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white border border-border-default rounded-lg p-5">
                        <div className="text-[11px] text-text-muted uppercase font-medium">Claimed Overrun</div>
                        <div className="text-[26px] font-semibold text-gov-navy mt-1 tracking-tight">₹{simResult.contractor_claimed_escalation_cr?.toLocaleString()} Cr</div>
                        <div className="text-[12px] text-gov-saffron font-medium mt-0.5">+{simResult.claimed_overrun_pct}% over original</div>
                      </div>
                      <div className="bg-white border border-border-default rounded-lg p-5">
                        <div className="text-[11px] text-text-muted uppercase font-medium">Statutory 10CC Cap</div>
                        <div className="text-[26px] font-semibold text-gov-success mt-1 tracking-tight">₹{simResult.statutory_allowed_escalation_cr?.toLocaleString()} Cr</div>
                        <div className="text-[12px] text-text-muted font-medium mt-0.5">85% escalable ceiling</div>
                      </div>
                    </div>

                    {simResult.unjustified_excess_margin_cr > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center justify-between text-[14px] font-semibold text-gov-danger">
                          <span>Unjustified padding flagged</span>
                          <span>+₹{simResult.unjustified_excess_margin_cr?.toLocaleString()} Cr</span>
                        </div>
                        <p className="text-[12px] text-red-700 mt-1">Disallowance recommended under CPWD General Conditions of Contract.</p>
                      </div>
                    )}

                    <div className="border-t border-border-default pt-4">
                      <div className="text-[12px] font-semibold text-gov-navy mb-2">Macro Index Growth ({simResult.macro_indices?.base_year} → {simResult.macro_indices?.current_year})</div>
                      <div className="grid grid-cols-4 gap-3">
                        {[['Steel', simResult.macro_indices?.steel_growth_pct], ['Cement', simResult.macro_indices?.cement_growth_pct], ['Fuel', simResult.macro_indices?.fuel_growth_pct], ['Labor', simResult.macro_indices?.labor_growth_pct]].map(([label, val]) => (
                          <div key={label} className="text-center">
                            <div className="text-[11px] text-text-muted">{label}</div>
                            <div className="text-[15px] font-semibold text-gov-navy">+{val}%</div>
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
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[18px] font-semibold text-gov-navy">Agency Compliance &amp; Risk Ranking</h3>
                  <span className="text-[13px] text-text-muted">{rankingsData?.total_agencies_evaluated} agencies evaluated</span>
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
                        <tr key={idx}>
                          <td className="font-medium text-gov-navy">{a.agency_name}</td>
                          <td className="text-center text-text-muted">{a.total_projects}</td>
                          <td className="text-center font-medium text-gov-saffron">{a.bunching_projects_18_20pct} ({a.bunching_rate_pct}%)</td>
                          <td className="text-center font-medium text-gov-danger">{a.cabinet_breached_projects}</td>
                          <td className="num text-text-muted">₹{a.total_revised_capex_cr?.toLocaleString()} Cr</td>
                          <td className="num font-medium text-gov-danger">₹{a.total_excess_margin_claimed_cr?.toLocaleString()} Cr</td>
                          <td className="text-center font-semibold text-gov-navy">{a.institutional_gaming_score}/100</td>
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
          <section id="methodology" className="bg-white border border-border-default rounded-lg overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="p-8 border-b lg:border-b-0 lg:border-r border-border-default">
                <h3 className="text-[16px] font-semibold text-gov-navy mb-3">20% CCEA Cabinet Overrun Threshold</h3>
                <p className="text-[13px] text-text-secondary leading-relaxed">
                  Projects incurring cost revisions ≥20% of original sanctioned cost require mandatory CCEA and PIB approval. 
                  SATYA-KAVACH applies McCrary density discontinuity estimators to detect strategic under-reporting at 18.0%–19.99%.
                </p>
              </div>
              <div className="p-8">
                <h3 className="text-[16px] font-semibold text-gov-navy mb-3">CPWD Clause 10CC Escalation Cap</h3>
                <p className="text-[13px] text-text-secondary leading-relaxed">
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
