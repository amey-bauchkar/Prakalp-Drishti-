import React, { useState, useEffect } from 'react';
import { TrendingUp, RefreshCw, ArrowRight, ChevronRight, ShieldCheck, Activity, Building2 } from 'lucide-react';

export default function ArthaNetraView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState(() => localStorage.getItem('prakalp:selectedProjectId') || '619092');
  const [activeProject, setActiveProject] = useState(null);

  // Global project sync
  useEffect(() => {
    const handleSelect = (e) => {
      if (e.detail) {
        setSelectedProjectId(String(e.detail));
      }
    };
    window.addEventListener('prakalp:selectProject', handleSelect);
    return () => window.removeEventListener('prakalp:selectProject', handleSelect);
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      fetch(`/api/projects/${selectedProjectId}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((p) => setActiveProject(p))
        .catch(() => {});
    }
  }, [selectedProjectId]);

  useEffect(() => {
    fetch('/api/parth/psu-risk')
      .then((res) => res.json())
      .then((json) => { setData(json); setLoading(false); })
      .catch((err) => { console.error('Failed to load Artha-Netra data:', err); setLoading(false); });
  }, []);

  return (
    <div className="space-y-8 font-sans">
      {/* ═══════ MODULE HERO (SOVEREIGN INSTITUTIONAL DOSSIER) ═══════ */}
      <section className="panel p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-gov-saffron-light text-gov-saffron-dark border border-gov-gold-border text-[11px] font-bold uppercase tracking-wider font-mono">
              <TrendingUp className="w-3.5 h-3.5 text-gov-saffron" />
              <span>ARTHA-NETRA · PSU Financial Solvency</span>
            </div>
            <h1 className="font-heading font-extrabold text-[30px] sm:text-[38px] leading-[1.15] text-gov-navy tracking-tight">
              Contractor Solvency &amp;<br />
              Equity Market Coupling
            </h1>
            <p className="text-text-secondary text-[15px] sm:text-[15.5px] leading-relaxed max-w-2xl font-sans">
              Macro-financial early warning system correlating executing PSU debt leverage ratios (Debt/Equity), 
              Altman Z-scores, and equity market drawdowns to predict contractor distress 4–6 quarters ahead.
            </p>
            <div className="flex items-center gap-4 pt-2">
              <a href="#psu-matrix" className="btn-saffron-pill py-3 px-6 text-[13.5px] font-bold shadow-md">
                <span>View PSU Matrix</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div className="lg:col-span-4 flex justify-center lg:justify-end">
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-7 text-center w-full max-w-xs shadow-subtle">
              <div className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-2 font-mono">Key Finding</div>
              <div className="text-[28px] font-heading font-black text-gov-navy leading-snug">Granger-Causal</div>
              <div className="text-[13.5px] text-text-secondary font-bold mt-2">Equity-delay coupling confirmed</div>
              <div className="text-[11px] font-mono text-gov-saffron-dark mt-1 font-bold">PSU stock drawdowns precede project delays</div>
            </div>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="loading-center py-12"><RefreshCw className="w-5 h-5 animate-spin" />Loading PSU financial data…</div>
      ) : data ? (
        <>
          {/* ═══════ GRANGER FINDING ═══════ */}
          <div className="card-parchment-gold rounded-3xl p-7 sm:p-8 shadow-card border border-gov-gold-border">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-gov-saffron/15 flex items-center justify-center shrink-0 border border-gov-saffron/30">
                <TrendingUp className="w-5 h-5 text-gov-saffron" />
              </div>
              <div className="space-y-1">
                <div className="text-[15px] font-heading font-extrabold text-gov-navy">Granger Causality Signal</div>
                <p className="text-[14px] text-text-secondary leading-relaxed font-sans">{data.granger_causality_finding}</p>
              </div>
            </div>
          </div>

          {/* ═══════ PSU HEALTH MATRIX ═══════ */}
          <section id="psu-matrix" className="panel p-4 sm:p-5 space-y-6">
            <div className="flex items-center justify-between border-b border-border-default pb-4">
              <h2 className="font-heading font-extrabold text-[22px] text-gov-navy">PSU Health Matrix &amp; Altman Z-Score Telemetry</h2>
              <span className="text-[12px] text-text-muted font-mono font-bold">{data.psu_risk_records?.length} Public Sector Undertakings</span>
            </div>

            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Agency / PSU</th>
                    <th>Ticker</th>
                    <th>Sector</th>
                    <th className="num">Debt/Equity</th>
                    <th className="num">Altman Z</th>
                    <th className="num">Avg Overrun</th>
                    <th className="num">Active Capex</th>
                    <th className="text-center">Health Tier</th>
                  </tr>
                </thead>
                <tbody>
                  {data.psu_risk_records?.map((psu, idx) => {
                    const isMatch = activeProject && activeProject.company && (
                      psu.agency_name?.toLowerCase().includes(activeProject.company.toLowerCase()) ||
                      activeProject.company.toLowerCase().includes(psu.agency_name?.toLowerCase())
                    );
                    return (
                      <tr key={idx} className={`transition-colors ${isMatch ? 'bg-amber-50/90 font-bold border-l-4 border-gov-saffron' : 'hover:bg-slate-50/80'}`}>
                        <td className="font-bold text-gov-navy flex items-center gap-2">
                          <span>{psu.agency_name}</span>
                          {isMatch && (
                            <span className="text-[10px] bg-gov-saffron text-white px-1.5 py-0.2 rounded font-mono font-bold">
                              ACTIVE DOSSIER
                            </span>
                          )}
                        </td>
                        <td className="text-[12px] font-mono text-text-muted font-semibold">NSE: {psu.ticker}</td>
                        <td className="text-text-secondary font-medium">{psu.sector}</td>
                        <td className={`num font-bold font-mono ${psu.debt_to_equity > 2.0 ? 'text-rose-600' : 'text-gov-navy'}`}>{psu.debt_to_equity}×</td>
                        <td className="num font-bold text-gov-navy font-mono">{psu.altman_z_score}</td>
                        <td className="num font-bold text-gov-saffron font-mono">+{psu.avg_project_overrun_pct}%</td>
                        <td className="num font-mono text-text-muted font-bold">₹{(psu.total_monitored_capex_cr / 1000).toFixed(1)}k Cr</td>
                        <td className="text-center">
                          <span className={`status-badge ${
                            psu.debt_to_equity > 2.0 ? 'status-danger' : psu.debt_to_equity > 1.0 ? 'status-warning' : 'status-success'
                          }`}>
                            {psu.financial_health_tier}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* ═══════ METHODOLOGY ═══════ */}
          <section className="panel p-5 sm:p-6">
            <h3 className="text-[17px] font-heading font-extrabold text-gov-navy mb-3">Methodology</h3>
            <p className="text-[14px] text-text-secondary leading-relaxed max-w-3xl font-sans">
              Altman Z-score distress classification applied to the latest available annual financial statements 
              of publicly-listed executing agencies. Debt-to-equity ratios are cross-referenced with equity market 
              52-week drawdown percentages to establish Granger-causal linkages between financial distress and 
              project cost/time overruns.
            </p>
          </section>
        </>
      ) : null}
    </div>
  );
}
