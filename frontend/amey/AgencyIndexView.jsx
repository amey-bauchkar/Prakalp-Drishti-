import React, { useState, useEffect } from 'react';
import { Building2, TrendingUp, AlertTriangle, ShieldCheck, Award, Filter, Search, ArrowUpRight } from 'lucide-react';

export default function AgencyIndexView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTier, setFilterTier] = useState('ALL');

  useEffect(() => {
    fetch('/api/amey/agency-index')
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load agency index:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="panel p-7 text-center">
        <div className="w-10 h-10 border-4 border-gov-navy border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gov-navy font-bold text-sm">Synthesizing Agency Accountability Scores across 2,207 Projects...</p>
      </div>
    );
  }

  const agencies = data?.agencies || [];
  const filtered = agencies.filter((a) => {
    const matchesSearch = a.agency_name.toLowerCase().includes(searchTerm.toLowerCase()) || a.agency_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTier = filterTier === 'ALL' || a.performance_tier === filterTier;
    return matchesSearch && matchesTier;
  });

  return (
    <div className="space-y-8 font-sans">
      {/* ═══════════════════════════════════════════════════════════════
          TOP BANNER (SOVEREIGN INSTITUTIONAL COMMAND HEADER)
          ═══════════════════════════════════════════════════════════════ */}
      <div className="command-header p-5 sm:p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
        <div className="space-y-2 max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 pl-2 pr-2.5 py-0.5 rounded-sm bg-white/[0.07] text-[9.5px] font-extrabold tracking-institutional uppercase text-gov-accent border-l-2 border-gov-accent">
            <Building2 className="w-3.5 h-3.5 text-white" />
            <span>AGENCY PERFORMANCE SCORECARD</span>
          </div>
          <h2 className="font-heading font-extrabold text-[21px] sm:text-[25px] tracking-[-0.025em] text-white leading-[1.12]">
            CENTRAL EXECUTING AGENCY ACCOUNTABILITY &amp; DELIVERY VELOCITY INDEX
          </h2>
          <p className="text-[12.5px] text-ink-200 leading-relaxed font-sans max-w-xl">
            Compares on-time delivery rates, cost control, and project execution speed across {data?.total_agencies_monitored} central government executing entities.
          </p>
        </div>

        {/* Tier Stat Badges */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="bg-black/25 px-3 py-2 rounded-sm border border-white/15 text-center">
            <span className="text-[9px] uppercase font-bold text-emerald-400 block font-mono">Tier 1 (Exemplary)</span>
            <span className="text-[20px] font-black text-white font-mono">{data?.tier_1_agencies || 0}</span>
          </div>
          <div className="bg-black/25 px-3 py-2 rounded-sm border border-white/15 text-center">
            <span className="text-[9px] uppercase font-bold text-amber-400 block font-mono">Tier 2 (Watchlist)</span>
            <span className="text-[20px] font-black text-white font-mono">{data?.tier_2_agencies || 0}</span>
          </div>
          <div className="bg-black/25 px-3 py-2 rounded-sm border border-white/15 text-center">
            <span className="text-[9px] uppercase font-bold text-rose-400 block font-mono">Tier 3 (Critical)</span>
            <span className="text-[20px] font-black text-white font-mono">{data?.tier_3_agencies || 0}</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="panel p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search agency (e.g. NHAI, Indian Railways, NTPC...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-border-default rounded-xl pl-10 pr-3 py-2.5 focus:outline-none focus:border-gov-navy font-bold text-gov-navy"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full md:w-auto">
          <Filter className="w-4 h-4 text-text-muted shrink-0" />
          <span className="text-xs font-bold text-gov-navy shrink-0 font-mono">Administrative Tier:</span>
          {['ALL', 'TIER_1_EXEMPLARY', 'TIER_2_WATCHLIST', 'TIER_3_CRITICAL'].map((tier) => (
            <button
              key={tier}
              onClick={() => setFilterTier(tier)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                filterTier === tier
                  ? 'bg-gov-navy text-white shadow-sm'
                  : 'bg-slate-50 text-text-secondary hover:bg-slate-100 border border-border-default'
              }`}
            >
              {tier === 'ALL' ? 'All Executing Agencies' : tier === 'TIER_1_EXEMPLARY' ? 'Exemplary Delivery (Tier 1)' : tier === 'TIER_2_WATCHLIST' ? 'Watchlist (Tier 2)' : 'Critical Delay Risk (Tier 3)'}
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="panel overflow-hidden p-4 sm:p-5 space-y-6">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Rank &amp; Executing Agency</th>
                <th className="num">Monitored Projects</th>
                <th className="num">Monitored Portfolio Capex (₹ Cr)</th>
                <th className="num">Schedule Slippage Incidence Rate</th>
                <th className="num">Mean Schedule Slippage</th>
                <th className="num">Cost Escalation Ratio</th>
                <th className="text-center">Execution Velocity Index (0–100)</th>
                <th className="text-center">Accountability Rating</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((agency, idx) => (
                <tr key={agency.agency_id} className="hover:bg-slate-50/80 transition-colors">
                  <td>
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-xl bg-slate-100 flex items-center justify-center text-[11px] font-black text-gov-navy border border-slate-200 font-mono shrink-0">
                        #{idx + 1}
                      </span>
                      <div>
                        <span className="font-bold text-gov-navy block text-[13.5px]">{agency.agency_name}</span>
                        <span className="text-[10.5px] text-text-muted font-mono">{agency.agency_id}</span>
                      </div>
                    </div>
                  </td>
                  <td className="num font-mono font-bold text-gov-navy">
                    {agency.total_projects}
                  </td>
                  <td className="num font-mono font-black text-gov-navy">
                    ₹{agency.total_capex_cr.toLocaleString()}
                  </td>
                  <td className="num font-mono">
                    <span className={`font-bold ${agency.delay_rate_perc > 50 ? 'text-rose-600' : 'text-emerald-700'}`}>
                      {agency.delay_rate_perc}%
                    </span>
                  </td>
                  <td className="num font-mono text-text-secondary font-medium">
                    {agency.avg_delay_months} mos
                  </td>
                  <td className="num font-mono">
                    <span className={agency.avg_cost_overrun_perc > 20 ? 'text-rose-600 font-bold' : 'text-text-secondary font-medium'}>
                      +{agency.avg_cost_overrun_perc}%
                    </span>
                  </td>
                  <td className="text-center">
                    <div className="inline-flex items-center gap-1 px-3 py-1 rounded-sm bg-slate-100 border border-slate-200 font-mono">
                      <span className="font-black text-xs text-gov-navy">{agency.velocity_score}</span>
                      <span className="text-[10px] text-text-muted">/100</span>
                    </div>
                  </td>
                  <td className="text-center">
                    <span
                      className="px-3 py-1 rounded-sm text-[10px] font-black uppercase tracking-wider inline-block font-mono"
                      style={{
                        backgroundColor: `${agency.status_color}18`,
                        color: agency.status_color,
                        border: `1px solid ${agency.status_color}35`
                      }}
                    >
                      {agency.rating_label}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
