import React, { useState, useEffect } from 'react';
import { TrendingUp, RefreshCw, ArrowRight, ChevronRight } from 'lucide-react';

export default function ArthaNetraView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/parth/psu-risk')
      .then((res) => res.json())
      .then((json) => { setData(json); setLoading(false); })
      .catch((err) => { console.error('Failed to load Artha-Netra data:', err); setLoading(false); });
  }, []);

  return (
    <div className="space-y-0">

      {/* ═══════ MODULE HERO ═══════ */}
      <section className="pb-12 pt-2">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-7 space-y-4">
            <div className="text-[12px] font-semibold uppercase tracking-widest text-gov-saffron">
              ARTHA-NETRA · PSU Financial Solvency
            </div>
            <h1 className="text-[36px] leading-[1.12] font-semibold text-gov-navy tracking-tight">
              Contractor Solvency &amp;<br />
              Equity Market Coupling
            </h1>
            <p className="text-text-secondary text-[15px] leading-relaxed max-w-xl">
              Macro-financial early warning system correlating executing PSU debt leverage ratios (Debt/Equity), 
              Altman Z-scores, and equity market drawdowns to predict contractor distress 4–6 quarters ahead.
            </p>
            <div className="flex items-center gap-4 pt-1">
              <a href="#psu-matrix" className="btn-primary">
                View PSU Matrix <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="bg-white border border-border-default rounded-lg p-8 shadow-card text-center max-w-xs">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-4">Key Finding</div>
              <div className="text-[18px] font-semibold text-gov-navy leading-snug">Granger-Causal</div>
              <div className="text-[14px] text-text-secondary mt-2">Equity-delay coupling confirmed</div>
              <div className="text-[12px] text-text-muted mt-1">PSU stock drawdowns precede project delays</div>
            </div>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="loading-center"><RefreshCw className="w-5 h-5 animate-spin" />Loading PSU financial data…</div>
      ) : data ? (
        <>
          {/* ═══════ GRANGER FINDING ═══════ */}
          <div className="bg-gov-saffron-light border border-amber-200 rounded-lg p-5 mb-10">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-gov-saffron shrink-0 mt-0.5" />
              <div>
                <div className="text-[14px] font-semibold text-gov-navy mb-1">Granger Causality Signal</div>
                <p className="text-[13px] text-text-secondary leading-relaxed">{data.granger_causality_finding}</p>
              </div>
            </div>
          </div>

          {/* ═══════ PSU HEALTH MATRIX ═══════ */}
          <section id="psu-matrix">
            <h2 className="text-[22px] font-semibold text-gov-navy mb-6">PSU Health Matrix</h2>
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
                  {data.psu_risk_records?.map((psu, idx) => (
                    <tr key={idx}>
                      <td className="font-medium text-gov-navy">{psu.agency_name}</td>
                      <td className="text-[12px] text-text-muted font-medium">NSE: {psu.ticker}</td>
                      <td className="text-text-secondary">{psu.sector}</td>
                      <td className={`num font-medium ${psu.debt_to_equity > 2.0 ? 'text-gov-danger' : 'text-gov-navy'}`}>{psu.debt_to_equity}×</td>
                      <td className="num font-medium text-gov-navy">{psu.altman_z_score}</td>
                      <td className="num font-medium text-gov-saffron">+{psu.avg_project_overrun_pct}%</td>
                      <td className="num text-text-muted">₹{(psu.total_monitored_capex_cr / 1000).toFixed(1)}k Cr</td>
                      <td className="text-center">
                        <span className={`status-badge ${
                          psu.debt_to_equity > 2.0 ? 'status-danger' : psu.debt_to_equity > 1.0 ? 'status-warning' : 'status-success'
                        }`}>
                          {psu.financial_health_tier}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* ═══════ METHODOLOGY ═══════ */}
          <section className="bg-white border border-border-default rounded-lg p-8 mt-12">
            <h3 className="text-[16px] font-semibold text-gov-navy mb-3">Methodology</h3>
            <p className="text-[13px] text-text-secondary leading-relaxed max-w-3xl">
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
