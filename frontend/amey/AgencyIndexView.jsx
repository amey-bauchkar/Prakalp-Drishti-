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
      <div className="bg-white p-12 rounded-2xl border border-gov-border shadow-soft text-center">
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
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gov-navy text-white p-6 rounded-2xl border border-gov-navy-light shadow-elevated flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-5 h-5 text-gov-accent" />
            <span className="text-xs font-black tracking-widest uppercase text-gov-accent">Agency Performance Scorecard</span>
          </div>
          <h2 className="text-xl font-black tracking-tight">AGENCY TRACK RECORD & SPEED RANKING</h2>
          <p className="text-xs text-gov-muted-light mt-1">
            Compares on-time delivery rates, cost control, and project execution speed across {data?.total_agencies_monitored} central government agencies.
          </p>
        </div>

        {/* Tier Stat Badges */}
        <div className="flex items-center gap-2">
          <div className="bg-emerald-500/20 border border-emerald-400/30 px-3 py-2 rounded-xl text-center">
            <span className="text-[10px] uppercase font-bold text-emerald-300 block">Top Performers</span>
            <span className="text-lg font-black text-emerald-400">{data?.tier_1_agencies || 0}</span>
          </div>
          <div className="bg-amber-500/20 border border-amber-400/30 px-3 py-2 rounded-xl text-center">
            <span className="text-[10px] uppercase font-bold text-amber-300 block">Needs Monitoring</span>
            <span className="text-lg font-black text-amber-400">{data?.tier_2_agencies || 0}</span>
          </div>
          <div className="bg-rose-500/20 border border-rose-400/30 px-3 py-2 rounded-xl text-center">
            <span className="text-[10px] uppercase font-bold text-rose-300 block">Severely Delayed</span>
            <span className="text-lg font-black text-rose-400">{data?.tier_3_agencies || 0}</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-gov-border shadow-soft flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-gov-muted" />
          <input
            type="text"
            placeholder="Search agency (e.g. NHAI, Indian Railways, NTPC...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs bg-gov-surface border border-gov-border rounded-lg px-3 py-2 focus:outline-none focus:border-gov-navy font-medium"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gov-muted" />
          <span className="text-xs font-bold text-gov-navy">Filter by Category:</span>
          {['ALL', 'TIER_1_EXEMPLARY', 'TIER_2_WATCHLIST', 'TIER_3_CRITICAL'].map((tier) => (
            <button
              key={tier}
              onClick={() => setFilterTier(tier)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterTier === tier
                  ? 'bg-gov-navy text-white'
                  : 'bg-gov-surface text-gov-navy hover:bg-gov-muted-surface border border-gov-border'
              }`}
            >
              {tier === 'ALL' ? 'All Agencies' : tier === 'TIER_1_EXEMPLARY' ? 'Top Performers' : tier === 'TIER_2_WATCHLIST' ? 'Needs Monitoring' : 'Severely Delayed'}
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-white rounded-2xl border border-gov-border shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gov-surface border-b border-gov-border text-[11px] font-black uppercase text-gov-muted tracking-wider">
                <th className="py-3.5 px-4">Rank & Agency</th>
                <th className="py-3.5 px-4 text-right">Total Projects</th>
                <th className="py-3.5 px-4 text-right">Total Budget (₹ Cr)</th>
                <th className="py-3.5 px-4 text-right">% Projects Delayed</th>
                <th className="py-3.5 px-4 text-right">Average Delay</th>
                <th className="py-3.5 px-4 text-right">Cost Overrun</th>
                <th className="py-3.5 px-4 text-center">Delivery Speed Score</th>
                <th className="py-3.5 px-4 text-center">Performance Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gov-border text-xs font-medium">
              {filtered.map((agency, idx) => (
                <tr key={agency.agency_id} className="hover:bg-gov-surface/60 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-gov-surface flex items-center justify-center text-[10px] font-black text-gov-navy border border-gov-border">
                        #{idx + 1}
                      </span>
                      <div>
                        <span className="font-bold text-gov-navy block text-sm">{agency.agency_name}</span>
                        <span className="text-[10px] text-gov-muted font-mono">{agency.agency_id}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-gov-navy">
                    {agency.total_projects}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-black text-gov-navy">
                    ₹{agency.total_capex_cr.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span className={`font-bold font-mono ${agency.delay_rate_perc > 50 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {agency.delay_rate_perc}%
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-gov-muted-dark">
                    {agency.avg_delay_months} mos
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono">
                    <span className={agency.avg_cost_overrun_perc > 20 ? 'text-rose-600 font-bold' : 'text-gov-muted-dark'}>
                      +{agency.avg_cost_overrun_perc}%
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gov-surface border border-gov-border">
                      <span className="font-black text-xs text-gov-navy">{agency.velocity_score}</span>
                      <span className="text-[10px] text-gov-muted">/100</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-block"
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
