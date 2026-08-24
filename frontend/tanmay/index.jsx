import React, { useState, useEffect } from 'react';
import {
  ShieldAlert, AlertTriangle, Scale, CheckCircle2, RefreshCw, ChevronRight,
  FileSearch, ShieldCheck, BarChart3, Calculator, Award, Filter, Search,
  Sliders, ArrowUpRight, TrendingUp, AlertCircle, Info, FileText, CheckCircle
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

  // Interactive Simulator State
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

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/tanmay/gaming-analysis').then((r) => r.json()).catch(() => null),
      fetch('/api/tanmay/bunching-histogram').then((r) => r.json()).catch(() => null),
      fetch('/api/tanmay/clause-10cc-audit?limit=100').then((r) => r.json()).catch(() => null),
      fetch('/api/tanmay/agency-rankings').then((r) => r.json()).catch(() => null),
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
    })
      .then((r) => r.json())
      .then((json) => {
        setSimResult(json);
        setSimulating(false);
      })
      .catch((err) => {
        console.error('Simulation error:', err);
        setSimulating(false);
      });
  };

  // Run initial simulation once data is loaded
  useEffect(() => {
    handleSimulate();
  }, []);

  // Filter flagged projects by search query
  const filteredFlaggedProjects = summaryData?.flagged_sample_projects?.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchQuery =
      p.project_name.toLowerCase().includes(q) ||
      p.project_id.includes(q) ||
      p.agency.toLowerCase().includes(q) ||
      p.state.toLowerCase().includes(q) ||
      p.sector.toLowerCase().includes(q);
    const matchSector = selectedSector === 'All' || p.sector === selectedSector;
    return matchQuery && matchSector;
  }) || [];

  // Filter 10CC audited projects
  const filteredClauseRecords = clauseData?.audited_records?.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchQuery =
      p.project_name.toLowerCase().includes(q) ||
      p.project_id.includes(q) ||
      p.agency.toLowerCase().includes(q) ||
      p.state.toLowerCase().includes(q) ||
      p.sector.toLowerCase().includes(q);
    const matchSector = selectedSector === 'All' || p.sector === selectedSector;
    return matchQuery && matchSector;
  }) || [];

  const sectors = ['All', 'Roads & Highways', 'Railways', 'Power & Thermal', 'Coal & Mining', 'Civil Aviation', 'Ports & Shipping'];

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in font-sans text-gov-text-main">
      
      {/* Executive Header Banner */}
      <div className="bg-gradient-to-r from-[#1E2A45] via-[#28385C] to-[#141D30] text-white p-6 sm:p-8 rounded-2xl shadow-elevated border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-black uppercase tracking-wider">
            <ShieldAlert className="w-3.5 h-3.5" /> SATYA-KAVACH · Statistical Integrity & Statutory Forensics
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
            20% CCEA Cabinet Rule Evasion & Clause 10CC Audit
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
            Statutory Econometric Forensic Engine: Employs the <strong className="text-amber-300">McCrary Density Discontinuity Test</strong> to expose strategic revision clustering at 18.0%–19.9% to bypass Cabinet Committee on Economic Affairs (CCEA) approval, while auditing contractor price variation claims against the statutory <strong className="text-emerald-300">CPWD Clause 10CC 85% escalable cap</strong>.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 bg-white/10 px-5 py-4 rounded-xl border border-white/15 backdrop-blur-md shrink-0">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-300">Module Lead</span>
          <span className="text-xl font-black text-amber-400">Tanmay</span>
          <span className="text-[10px] px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Connected: /api/tanmay
          </span>
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center bg-white rounded-2xl border border-gov-border shadow-card flex flex-col items-center justify-center gap-3 min-h-[300px]">
          <RefreshCw className="w-8 h-8 text-gov-navy animate-spin" />
          <span className="text-sm font-bold text-gov-navy">Executing McCrary Density & CPWD Clause 10CC Audit across 2,207 projects...</span>
          <span className="text-xs text-gov-muted">Calibrating bid-date WPI construction and labor wage indices</span>
        </div>
      ) : summaryData ? (
        <>
          {/* Top KPI Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-gov-border shadow-card space-y-1 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full -mr-8 -mt-8 pointer-events-none"></div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gov-muted uppercase tracking-wider">CCEA Bunching Zone (18-20%)</span>
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-3xl font-black text-amber-600">
                {summaryData.kpi_metrics?.projects_in_bunching_zone_18_20pct}
              </div>
              <div className="text-[11px] text-gov-muted flex items-center justify-between pt-1">
                <span>Total Capital Locked:</span>
                <span className="font-mono font-bold text-gov-navy">₹{summaryData.kpi_metrics?.bunching_zone_capital_cr?.toLocaleString()} Cr</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gov-border shadow-card space-y-1 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full -mr-8 -mt-8 pointer-events-none"></div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gov-muted uppercase tracking-wider">Cabinet Breached (≥20%)</span>
                <Scale className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-3xl font-black text-rose-600">
                {summaryData.kpi_metrics?.projects_above_20pct_cabinet_rule}
              </div>
              <div className="text-[11px] text-gov-muted flex items-center justify-between pt-1">
                <span>Subject to CCEA Notes</span>
                <span className="text-rose-600 font-bold">Mandatory PIB</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gov-border shadow-card space-y-1 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full -mr-8 -mt-8 pointer-events-none"></div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gov-muted uppercase tracking-wider">McCrary Density Spike</span>
                <ShieldCheck className="w-4 h-4 text-gov-navy" />
              </div>
              <div className="text-3xl font-black text-gov-navy">
                {summaryData.mccrary_bunching_signal?.density_ratio}x
              </div>
              <div className="text-[11px] text-gov-muted flex items-center justify-between pt-1">
                <span>Statistical Significance:</span>
                <span className="text-emerald-700 font-bold">{summaryData.mccrary_bunching_signal?.statistical_significance}</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gov-border shadow-card space-y-1 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full -mr-8 -mt-8 pointer-events-none"></div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gov-muted uppercase tracking-wider">Unjustified Claim Padding</span>
                <Calculator className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-3xl font-black text-purple-700 font-mono">
                ₹{summaryData.kpi_metrics?.total_unjustified_excess_margin_cr?.toLocaleString()} Cr
              </div>
              <div className="text-[11px] text-gov-muted flex items-center justify-between pt-1">
                <span>Clause 10CC Violations:</span>
                <span className="font-bold text-purple-700">Flagged for Audit</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-2 border-b border-gov-border pb-1">
            <button
              onClick={() => setActiveTab('bunching')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
                activeTab === 'bunching'
                  ? 'bg-gov-navy text-white shadow-soft'
                  : 'bg-white text-gov-muted hover:bg-slate-50 border border-gov-border'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              1. 20% CCEA Cabinet Evasion Audit ({summaryData.kpi_metrics?.projects_in_bunching_zone_18_20pct})
            </button>

            <button
              onClick={() => setActiveTab('clause10cc')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
                activeTab === 'clause10cc'
                  ? 'bg-gov-navy text-white shadow-soft'
                  : 'bg-white text-gov-muted hover:bg-slate-50 border border-gov-border'
              }`}
            >
              <FileSearch className="w-4 h-4" />
              2. Statutory CPWD Clause 10CC Audit ({clauseData?.total_projects_with_price_gouging} Flagged)
            </button>

            <button
              onClick={() => setActiveTab('simulator')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
                activeTab === 'simulator'
                  ? 'bg-gov-navy text-white shadow-soft'
                  : 'bg-white text-gov-muted hover:bg-slate-50 border border-gov-border'
              }`}
            >
              <Calculator className="w-4 h-4" />
              3. Interactive Clause 10CC Simulator
            </button>

            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
                activeTab === 'leaderboard'
                  ? 'bg-gov-navy text-white shadow-soft'
                  : 'bg-white text-gov-muted hover:bg-slate-50 border border-gov-border'
              }`}
            >
              <Award className="w-4 h-4" />
              4. Agency Gaming Risk Leaderboard
            </button>
          </div>

          {/* TAB 1: 20% CCEA BUNCHING AUDIT & HISTOGRAM */}
          {activeTab === 'bunching' && (
            <div className="space-y-6">
              
              {/* McCrary Histogram Visual Card */}
              <div className="bg-white p-6 rounded-2xl border border-gov-border shadow-card space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gov-border pb-4">
                  <div>
                    <h3 className="text-base font-black text-gov-navy flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-amber-500" />
                      McCrary Cost Overrun Density Histogram & Cabinet Threshold Discontinuity
                    </h3>
                    <p className="text-xs text-gov-muted mt-0.5">
                      Visualizing project count distribution across cost overrun percentage bins. Notice the unnatural clustering spike at 18.0%–19.99%.
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs self-start sm:self-auto">
                    Threshold Discontinuity Ratio: {summaryData.mccrary_bunching_signal?.density_ratio}x
                  </span>
                </div>

                {/* Histogram Bars */}
                <div className="space-y-2 pt-2">
                  {histogramData?.bins?.map((bin, idx) => {
                    const maxCount = Math.max(...(histogramData.bins.map((b) => b.project_count) || [100]));
                    const barWidth = Math.max(4, (bin.project_count / maxCount) * 100);
                    return (
                      <div key={idx} className="flex items-center gap-3 text-xs">
                        <div className={`w-52 shrink-0 font-bold text-right truncate ${bin.is_bunching_spike ? 'text-amber-700 font-black' : bin.is_cabinet_breached ? 'text-rose-700 font-semibold' : 'text-gov-muted'}`}>
                          {bin.bin_label}
                        </div>
                        <div className="flex-1 bg-slate-100 rounded-lg h-6 overflow-hidden relative flex items-center">
                          <div
                            className={`h-full rounded-lg transition-all duration-500 ${
                              bin.is_bunching_spike
                                ? 'bg-gradient-to-r from-amber-400 to-amber-600 shadow-sm'
                                : bin.is_cabinet_breached
                                ? 'bg-gradient-to-r from-rose-400 to-rose-600'
                                : 'bg-gradient-to-r from-slate-300 to-slate-400'
                            }`}
                            style={{ width: `${barWidth}%` }}
                          />
                          <span className="absolute left-2 text-[10px] font-mono font-bold text-slate-800">
                            {bin.project_count} projects (₹{bin.total_capex_cr?.toLocaleString()} Cr)
                          </span>
                        </div>
                        {bin.is_bunching_spike && (
                          <span className="px-2 py-0.5 rounded bg-amber-500 text-white font-black text-[10px] uppercase tracking-wider shrink-0 animate-pulse">
                            ⚠️ Artificial Spike
                          </span>
                        )}
                        {bin.range_min === 20.0 && bin.range_max === 22.0 && (
                          <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300 font-bold text-[10px] uppercase shrink-0">
                            Cabinet Scrutiny
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Econometric Significance Note */}
                <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-xl flex items-start gap-3 text-xs text-amber-900">
                  <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-bold block">Econometric Proof of Strategic Under-Reporting:</span>
                    <p className="text-amber-800/90 leading-relaxed">
                      {summaryData.mccrary_bunching_signal?.interpretation} In a frictionless administration, cost revisions follow a smooth continuous distribution. The discontinuous spike at 18.0%–19.99% mathematically proves institutional gaming to evade mandatory Cabinet notes.
                    </p>
                  </div>
                </div>
              </div>

              {/* Flagged Projects Search & Filter Bar */}
              <div className="bg-white p-4 rounded-2xl border border-gov-border shadow-card flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full sm:w-96">
                  <Search className="w-4 h-4 text-gov-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search flagged projects by name, ID, agency, or state..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-gov-border text-xs focus:outline-none focus:ring-2 focus:ring-gov-navy/20 focus:border-gov-navy"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                  <span className="text-xs font-bold text-gov-muted flex items-center gap-1 shrink-0">
                    <Filter className="w-3.5 h-3.5" /> Sector:
                  </span>
                  {sectors.map((sec) => (
                    <button
                      key={sec}
                      onClick={() => setSelectedSector(sec)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shrink-0 ${
                        selectedSector === sec
                          ? 'bg-gov-navy text-white'
                          : 'bg-slate-100 text-gov-muted hover:bg-slate-200'
                      }`}
                    >
                      {sec}
                    </button>
                  ))}
                </div>
              </div>

              {/* Flagged Evasion Projects Table */}
              <div className="bg-white rounded-2xl border border-gov-border shadow-card overflow-hidden">
                <div className="p-5 border-b border-gov-border flex items-center justify-between bg-slate-50">
                  <div className="flex items-center gap-2">
                    <FileSearch className="w-5 h-5 text-gov-navy" />
                    <h3 className="font-black text-sm text-gov-navy uppercase tracking-wider">
                      Flagged Projects: Suspicious 18.0%–19.9% Escalation Clustering
                    </h3>
                  </div>
                  <span className="text-xs px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-300">
                    Showing {filteredFlaggedProjects.length} Flagged Mega-Projects
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100/75 text-gov-muted border-b border-gov-border font-bold uppercase text-[10px] tracking-wider">
                        <th className="p-3.5">Project ID & Name</th>
                        <th className="p-3.5">Sector & State</th>
                        <th className="p-3.5">Executing Agency</th>
                        <th className="p-3.5 text-right">Original Cost</th>
                        <th className="p-3.5 text-right">Revised Cost</th>
                        <th className="p-3.5 text-right">Overrun %</th>
                        <th className="p-3.5 text-center">Safety Margin to 20%</th>
                        <th className="p-3.5 text-center">Clause 10CC Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gov-border">
                      {filteredFlaggedProjects.map((p, idx) => (
                        <tr key={idx} className="hover:bg-amber-50/50 transition-colors">
                          <td className="p-3.5 font-bold text-gov-navy max-w-xs">
                            <span className="text-gov-muted mr-1.5 font-mono">#{p.project_id}</span>
                            <span className="hover:text-amber-700 transition-colors">{p.project_name}</span>
                          </td>
                          <td className="p-3.5 text-gov-text-body">
                            <span className="font-semibold block text-gov-navy">{p.sector}</span>
                            <span className="text-[10px] text-gov-muted">{p.state || 'National / Multi-State'}</span>
                          </td>
                          <td className="p-3.5 text-gov-text-body font-medium">{p.agency}</td>
                          <td className="p-3.5 text-right font-mono font-medium text-gov-muted">₹{p.original_cost_cr.toLocaleString()} Cr</td>
                          <td className="p-3.5 text-right font-mono font-bold text-gov-navy">₹{p.revised_cost_cr.toLocaleString()} Cr</td>
                          <td className="p-3.5 text-right font-mono font-black text-amber-600">+{p.overrun_pct}%</td>
                          <td className="p-3.5 text-center">
                            <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-black text-[10px] border border-amber-300 inline-block shadow-sm">
                              {p.evasion_margin_pct}% below CCEA
                            </span>
                          </td>
                          <td className="p-3.5 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              p.audit_verdict === 'EXCESSIVE_PRICE_GOUGING'
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : p.audit_verdict === 'MODERATE_MARGIN_PADDING'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            }`}>
                              {p.audit_verdict}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CPWD CLAUSE 10CC STATUTORY AUDIT */}
          {activeTab === 'clause10cc' && (
            <div className="space-y-6">
              
              {/* Statutory Explanation Card */}
              <div className="bg-gradient-to-r from-emerald-900 to-slate-900 text-white p-6 rounded-2xl border border-emerald-500/30 shadow-card space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-400 font-black text-xs uppercase tracking-wider">
                    <Scale className="w-4 h-4" /> Statutory Formula Enforcement
                  </div>
                  <span className="text-xs px-3 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-bold">
                    85% Escalable Rule Active
                  </span>
                </div>
                <h3 className="text-lg font-black">
                  Central Public Works Department (CPWD) General Conditions of Contract Clause 10CC & NHAI Clause 70
                </h3>
                <p className="text-xs text-slate-300 max-w-4xl leading-relaxed">
                  Indian administrative law prohibits direct 1:1 price escalation pass-through. Only <strong>85% of contract value is escalable</strong> (15% is deemed contractor fixed overhead and profit). Base indices for steel, cement, bitumen, and labor are strictly locked to the <strong>tender bid submission date</strong>. Demanded price hikes exceeding statutory indexation represent unjustified margin padding.
                </p>
              </div>

              {/* Clause 10CC Audited Table */}
              <div className="bg-white rounded-2xl border border-gov-border shadow-card overflow-hidden">
                <div className="p-5 border-b border-gov-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-gov-navy" />
                    <h3 className="font-black text-sm text-gov-navy uppercase tracking-wider">
                      Forensic Audit: Claimed Price Revision vs. Statutory Allowed Clause 10CC Ceiling
                    </h3>
                  </div>
                  <span className="text-xs px-3 py-1 rounded-full bg-rose-100 text-rose-900 font-bold border border-rose-300">
                    Total Excessive Margin Flagged: ₹{clauseData?.total_portfolio_excess_claimed_cr?.toLocaleString()} Cr
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100/75 text-gov-muted border-b border-gov-border font-bold uppercase text-[10px] tracking-wider">
                        <th className="p-3.5">Project ID & Name</th>
                        <th className="p-3.5">Agency & Sector</th>
                        <th className="p-3.5 text-center">Sanction Year</th>
                        <th className="p-3.5 text-right">Original Cost</th>
                        <th className="p-3.5 text-right">Claimed Overrun</th>
                        <th className="p-3.5 text-right">Statutory Allowed (10CC)</th>
                        <th className="p-3.5 text-right text-rose-700">Excess Margin Padding</th>
                        <th className="p-3.5 text-center">Verdict</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gov-border">
                      {filteredClauseRecords.map((p, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3.5 font-bold text-gov-navy max-w-xs">
                            <span className="text-gov-muted mr-1.5 font-mono">#{p.project_id}</span>
                            {p.project_name}
                          </td>
                          <td className="p-3.5 text-gov-text-body">
                            <span className="font-semibold block text-gov-navy">{p.agency}</span>
                            <span className="text-[10px] text-gov-muted">{p.sector}</span>
                          </td>
                          <td className="p-3.5 text-center font-mono font-bold text-gov-muted">{p.sanction_year}</td>
                          <td className="p-3.5 text-right font-mono text-gov-muted">₹{p.original_cost_cr.toLocaleString()} Cr</td>
                          <td className="p-3.5 text-right font-mono font-bold text-gov-navy">₹{p.claimed_escalation_cr.toLocaleString()} Cr</td>
                          <td className="p-3.5 text-right font-mono font-bold text-emerald-700">₹{p.statutory_10cc_allowed_cr.toLocaleString()} Cr</td>
                          <td className="p-3.5 text-right font-mono font-black text-rose-600">
                            +₹{p.excess_margin_claimed_cr.toLocaleString()} Cr
                          </td>
                          <td className="p-3.5 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                              p.verdict === 'EXCESSIVE_PRICE_GOUGING'
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : p.verdict === 'MODERATE_MARGIN_PADDING'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            }`}>
                              {p.verdict}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: INTERACTIVE CLAUSE 10CC SIMULATOR */}
          {activeTab === 'simulator' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Simulator Input Form */}
              <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-gov-border shadow-card space-y-5">
                <div className="border-b border-gov-border pb-3">
                  <h3 className="text-base font-black text-gov-navy flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-indigo-600" />
                    Contract Parameter Simulator
                  </h3>
                  <p className="text-xs text-gov-muted mt-0.5">
                    Adjust contract sanction parameters and material weightage fractions to test legal vs claimed inflation ceilings.
                  </p>
                </div>

                <form onSubmit={handleSimulate} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gov-muted block">Original Sanctioned Cost (₹ Cr)</label>
                      <input
                        type="number"
                        value={simOrigCost}
                        onChange={(e) => setSimOrigCost(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-gov-border text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-gov-navy/20"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gov-muted block">Demanded Revised Cost (₹ Cr)</label>
                      <input
                        type="number"
                        value={simRevCost}
                        onChange={(e) => setSimRevCost(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-gov-border text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-gov-navy/20"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gov-muted block">Tender Bid / Sanction Base Year</label>
                    <select
                      value={simSanctionYear}
                      onChange={(e) => setSimSanctionYear(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-gov-border text-sm font-bold text-gov-navy focus:outline-none focus:ring-2 focus:ring-gov-navy/20"
                    >
                      {[2005, 2008, 2010, 2012, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024].map((yr) => (
                        <option key={yr} value={yr}>
                          {yr} (WPI & Labor Base Year)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Material Weightages */}
                  <div className="space-y-3 pt-2">
                    <span className="text-xs font-black text-gov-navy uppercase tracking-wider block">
                      Contract Material & Labor Weightages (Total: {simSteelWeight + simCementWeight + simFuelWeight + simLaborWeight + simOtherWeight}%)
                    </span>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span>Steel Structural ({simSteelWeight}%)</span>
                        <input
                          type="range"
                          min="0"
                          max="50"
                          value={simSteelWeight}
                          onChange={(e) => setSimSteelWeight(parseInt(e.target.value))}
                          className="w-36 accent-indigo-600"
                        />
                      </div>

                      <div className="flex items-center justify-between text-xs font-bold">
                        <span>Cement & Lime ({simCementWeight}%)</span>
                        <input
                          type="range"
                          min="0"
                          max="50"
                          value={simCementWeight}
                          onChange={(e) => setSimCementWeight(parseInt(e.target.value))}
                          className="w-36 accent-indigo-600"
                        />
                      </div>

                      <div className="flex items-center justify-between text-xs font-bold">
                        <span>Fuel & Bitumen ({simFuelWeight}%)</span>
                        <input
                          type="range"
                          min="0"
                          max="50"
                          value={simFuelWeight}
                          onChange={(e) => setSimFuelWeight(parseInt(e.target.value))}
                          className="w-36 accent-indigo-600"
                        />
                      </div>

                      <div className="flex items-center justify-between text-xs font-bold">
                        <span>Labor Wage Component ({simLaborWeight}%)</span>
                        <input
                          type="range"
                          min="0"
                          max="50"
                          value={simLaborWeight}
                          onChange={(e) => setSimLaborWeight(parseInt(e.target.value))}
                          className="w-36 accent-indigo-600"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={simulating}
                    className="w-full py-3 rounded-xl bg-gov-navy text-white font-black text-xs uppercase tracking-wider hover:bg-gov-navy-light transition-all flex items-center justify-center gap-2 shadow-soft"
                  >
                    {simulating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
                    Calculate Statutory 10CC Escalation
                  </button>
                </form>
              </div>

              {/* Simulator Output Verdict Card */}
              <div className="lg:col-span-6 space-y-4">
                {simResult ? (
                  <div className="bg-white p-6 rounded-2xl border border-gov-border shadow-card space-y-6">
                    <div className="flex items-center justify-between border-b border-gov-border pb-3">
                      <span className="text-xs font-bold text-gov-muted uppercase">Statutory Audit Verdict</span>
                      <span className={`px-3 py-1 rounded-full font-black text-xs ${
                        simResult.audit_verdict === 'COMPLIANT_WITHIN_10CC'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}>
                        {simResult.audit_verdict}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-slate-50 border border-gov-border space-y-1">
                        <span className="text-[10px] font-bold text-gov-muted uppercase">Claimed Overrun</span>
                        <div className="text-2xl font-black text-gov-navy font-mono">
                          +₹{simResult.contractor_claimed_escalation_cr?.toLocaleString()} Cr
                        </div>
                        <span className="text-[10px] font-mono font-bold text-amber-600">
                          (+{simResult.claimed_overrun_pct}% over original)
                        </span>
                      </div>

                      <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-1">
                        <span className="text-[10px] font-bold text-emerald-800 uppercase">Statutory Allowed (10CC)</span>
                        <div className="text-2xl font-black text-emerald-700 font-mono">
                          ₹{simResult.statutory_allowed_escalation_cr?.toLocaleString()} Cr
                        </div>
                        <span className="text-[10px] text-emerald-800 font-bold">
                          85% Statutory Ceiling
                        </span>
                      </div>
                    </div>

                    {/* Excess Warning */}
                    {simResult.unjustified_excess_margin_cr > 0 && (
                      <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-rose-800">Unjustified Margin Padding Flagged:</span>
                          <span className="text-lg font-black text-rose-600 font-mono">
                            +₹{simResult.unjustified_excess_margin_cr?.toLocaleString()} Cr
                          </span>
                        </div>
                        <p className="text-[11px] text-rose-700">
                          This claimed amount exceeds the legal indexation ceiling. The Ministry of Finance should disallow this excess margin.
                        </p>
                      </div>
                    )}

                    {/* CCEA Evasion Alert */}
                    {simResult.is_ccea_threshold_evasion && (
                      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2 text-xs text-amber-900">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="block">CCEA Threshold Evasion Alert:</strong>
                          This revision of {simResult.claimed_overrun_pct}% sits in the suspicious 18.0%–19.9% zone engineered to evade mandatory Cabinet review.
                        </div>
                      </div>
                    )}

                    {/* Macro Indices Breakdown */}
                    <div className="border-t border-gov-border pt-4 space-y-2 text-xs">
                      <span className="font-bold text-gov-navy block">Macro Inflation Pegging ({simResult.macro_indices?.base_year} → {simResult.macro_indices?.current_year}):</span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
                        <div className="p-2 rounded bg-slate-50 border border-gov-border">
                          <span className="text-gov-muted block text-[10px]">Steel WPI</span>
                          <span className="font-bold text-gov-navy">+{simResult.macro_indices?.steel_growth_pct}%</span>
                        </div>
                        <div className="p-2 rounded bg-slate-50 border border-gov-border">
                          <span className="text-gov-muted block text-[10px]">Cement WPI</span>
                          <span className="font-bold text-gov-navy">+{simResult.macro_indices?.cement_growth_pct}%</span>
                        </div>
                        <div className="p-2 rounded bg-slate-50 border border-gov-border">
                          <span className="text-gov-muted block text-[10px]">Fuel Bitumen</span>
                          <span className="font-bold text-gov-navy">+{simResult.macro_indices?.fuel_growth_pct}%</span>
                        </div>
                        <div className="p-2 rounded bg-slate-50 border border-gov-border">
                          <span className="text-gov-muted block text-[10px]">Labor Wages</span>
                          <span className="font-bold text-gov-navy">+{simResult.macro_indices?.labor_growth_pct}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {/* TAB 4: AGENCY GAMING RISK LEADERBOARD */}
          {activeTab === 'leaderboard' && (
            <div className="bg-white rounded-2xl border border-gov-border shadow-card overflow-hidden">
              <div className="p-5 border-b border-gov-border flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-gov-navy" />
                  <h3 className="font-black text-sm text-gov-navy uppercase tracking-wider">
                    Executing Agency & PSU Threshold Gaming Risk Leaderboard
                  </h3>
                </div>
                <span className="text-xs px-3 py-1 rounded-full bg-slate-200 text-gov-navy font-bold">
                  {rankingsData?.total_agencies_evaluated} PSUs / Central Agencies Analyzed
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/75 text-gov-muted border-b border-gov-border font-bold uppercase text-[10px] tracking-wider">
                      <th className="p-3.5">Agency / PSU Name</th>
                      <th className="p-3.5 text-center">Total Projects</th>
                      <th className="p-3.5 text-center text-amber-700">18-20% Bunching Count</th>
                      <th className="p-3.5 text-center text-rose-700">Cabinet Breached</th>
                      <th className="p-3.5 text-right">Total Revised Capex</th>
                      <th className="p-3.5 text-right text-rose-600">Excess Margin Demanded</th>
                      <th className="p-3.5 text-center">Gaming Score</th>
                      <th className="p-3.5 text-center">Risk Tier</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gov-border">
                    {rankingsData?.rankings?.map((a, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3.5 font-bold text-gov-navy">{a.agency_name}</td>
                        <td className="p-3.5 text-center font-mono font-bold text-gov-muted">{a.total_projects}</td>
                        <td className="p-3.5 text-center font-mono font-black text-amber-600">
                          {a.bunching_projects_18_20pct} ({a.bunching_rate_pct}%)
                        </td>
                        <td className="p-3.5 text-center font-mono font-bold text-rose-600">{a.cabinet_breached_projects}</td>
                        <td className="p-3.5 text-right font-mono text-gov-muted">₹{a.total_revised_capex_cr?.toLocaleString()} Cr</td>
                        <td className="p-3.5 text-right font-mono font-bold text-rose-600">
                          ₹{a.total_excess_margin_claimed_cr?.toLocaleString()} Cr
                        </td>
                        <td className="p-3.5 text-center font-mono font-black text-gov-navy">
                          {a.institutional_gaming_score}/100
                        </td>
                        <td className="p-3.5 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                            a.risk_tier === 'HIGH_GAMING_RISK'
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : a.risk_tier === 'MODERATE_WATCHLIST'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          }`}>
                            {a.risk_tier}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
