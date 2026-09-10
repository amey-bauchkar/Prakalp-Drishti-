import React, { useState, useEffect } from 'react';
import { Building2, TrendingUp, AlertTriangle, ShieldCheck, Award, Filter, Search, ArrowUpRight } from 'lucide-react';
import { getStoredLanguage } from '../src/lib/i18n';

export default function AgencyIndexView({ lang: propLang }) {
  const [lang, setLang] = useState(() => propLang || getStoredLanguage());
  useEffect(() => { if (propLang) setLang(propLang); }, [propLang]);
  useEffect(() => {
    const onLang = (e) => setLang(e.detail || getStoredLanguage());
    window.addEventListener('prakalp:languageChanged', onLang);
    return () => window.removeEventListener('prakalp:languageChanged', onLang);
  }, []);
  const isHi = lang === 'hi';

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
        <p className="text-gov-navy font-bold text-sm">
          {isHi 
            ? '२,२०७ परियोजनाओं में एजेंसी जवाबदेही स्कोर का विश्लेषण जारी...' 
            : 'Synthesizing Agency Accountability Scores across 2,207 Projects...'}
        </p>
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
      <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 shadow-xl border border-slate-700 relative overflow-hidden flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Building2 className="w-48 h-48 text-amber-500" />
        </div>

        <div className="space-y-3 max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 pl-2 pr-2.5 py-0.5 rounded-sm bg-white/10 text-[10px] font-extrabold tracking-institutional uppercase text-amber-400 border-l-2 border-amber-400">
            <Building2 className="w-3.5 h-3.5 text-white" />
            <span>{isHi ? 'एजेंसी निष्पादन स्कोरकार्ड' : 'AGENCY PERFORMANCE SCORECARD'}</span>
          </div>
          <h2 className="font-heading font-extrabold text-[22px] sm:text-[28px] tracking-tight text-white leading-tight">
            {isHi 
              ? 'केंद्रीय कार्यान्वयन एजेंसी जवाबदेही एवं वितरण वेग सूचकांक' 
              : 'CENTRAL EXECUTING AGENCY ACCOUNTABILITY & DELIVERY VELOCITY INDEX'}
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed font-sans max-w-xl">
            {isHi
              ? `${data?.total_agencies_monitored || ''} केंद्रीय सरकारी कार्यान्वयन संस्थाओं में समय पर वितरण दर, लागत नियंत्रण और परियोजना निष्पादन गति की तुलना करता है।`
              : `Compares on-time delivery rates, cost control, and project execution speed across ${data?.total_agencies_monitored} central government executing entities.`}
          </p>
        </div>

        {/* Tier Stat Badges */}
        <div className="flex items-center gap-3 shrink-0 relative z-10">
          <div className="bg-slate-800/80 px-4 py-3 rounded-xl border border-slate-700 text-center min-w-[105px] shadow-sm">
            <span className="text-[10px] uppercase font-bold text-emerald-400 block font-mono">
              {isHi ? 'श्रेणी १ (उत्कृष्ट)' : 'Tier 1 (Exemplary)'}
            </span>
            <span className="text-[22px] font-black text-white font-mono">{data?.tier_1_agencies || 0}</span>
          </div>
          <div className="bg-slate-800/80 px-4 py-3 rounded-xl border border-slate-700 text-center min-w-[105px] shadow-sm">
            <span className="text-[10px] uppercase font-bold text-amber-400 block font-mono">
              {isHi ? 'श्रेणी २ (निगरानी)' : 'Tier 2 (Watchlist)'}
            </span>
            <span className="text-[22px] font-black text-white font-mono">{data?.tier_2_agencies || 0}</span>
          </div>
          <div className="bg-slate-800/80 px-4 py-3 rounded-xl border border-slate-700 text-center min-w-[105px] shadow-sm">
            <span className="text-[10px] uppercase font-bold text-rose-400 block font-mono">
              {isHi ? 'श्रेणी ३ (गंभीर)' : 'Tier 3 (Critical)'}
            </span>
            <span className="text-[22px] font-black text-white font-mono">{data?.tier_3_agencies || 0}</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="panel p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder={isHi ? 'एजेंसी खोजें (उदा. एनएचएआई, भारतीय रेल, एनटीपीसी...)' : 'Search agency (e.g. NHAI, Indian Railways, NTPC...)'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-border-default rounded-xl pl-10 pr-3 py-2.5 focus:outline-none focus:border-gov-navy font-bold text-gov-navy"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full md:w-auto">
          <Filter className="w-4 h-4 text-text-muted shrink-0" />
          <span className="text-xs font-bold text-gov-navy shrink-0 font-mono">
            {isHi ? 'प्रशासनिक श्रेणी:' : 'Administrative Tier:'}
          </span>
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
              {tier === 'ALL' 
                ? (isHi ? 'सभी कार्यान्वयन एजेंसियां' : 'All Executing Agencies')
                : tier === 'TIER_1_EXEMPLARY' 
                  ? (isHi ? 'उत्कृष्ट वितरण (श्रेणी १)' : 'Exemplary Delivery (Tier 1)')
                  : tier === 'TIER_2_WATCHLIST' 
                    ? (isHi ? 'निगरानी सूची (श्रेणी २)' : 'Watchlist (Tier 2)')
                    : (isHi ? 'गंभीर विलंब जोखिम (श्रेणी ३)' : 'Critical Delay Risk (Tier 3)')}
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
                <th>{isHi ? 'रैंक एवं कार्यान्वयन एजेंसी' : 'Rank & Executing Agency'}</th>
                <th className="num">{isHi ? 'निगरानीधीन परियोजनाएं' : 'Monitored Projects'}</th>
                <th className="num">{isHi ? 'निगरानीधीन पोर्टफोलियो पूंजी (₹ करोड़)' : 'Monitored Portfolio Capex (₹ Cr)'}</th>
                <th className="num">{isHi ? 'समय-सीमा फिसलन दर' : 'Schedule Slippage Incidence Rate'}</th>
                <th className="num">{isHi ? 'औसत समय-सीमा फिसलन' : 'Mean Schedule Slippage'}</th>
                <th className="num">{isHi ? 'लागत वृद्धि अनुपात' : 'Cost Escalation Ratio'}</th>
                <th className="text-center">{isHi ? 'निष्पादन वेग सूचकांक (०-१००)' : 'Execution Velocity Index (0–100)'}</th>
                <th className="text-center">{isHi ? 'जवाबदेही रेटिंग' : 'Accountability Rating'}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-xs text-text-muted">
                    {isHi ? 'कोई मेल खाती एजेंसी नहीं मिली।' : 'No matching agencies found.'}
                  </td>
                </tr>
              ) : (
                filtered.map((agency, idx) => (
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
                      ₹{agency.total_capex_cr.toLocaleString('en-IN')}
                    </td>
                    <td className="num font-mono">
                      <span className={`font-bold ${agency.delay_rate_perc > 50 ? 'text-rose-600' : 'text-emerald-700'}`}>
                        {agency.delay_rate_perc}%
                      </span>
                    </td>
                    <td className="num font-mono text-text-secondary font-medium">
                      {agency.avg_delay_months} {isHi ? 'माह' : 'mos'}
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
                        {isHi
                          ? (agency.rating_label?.includes('EXEMPLARY')
                              ? 'उत्कृष्ट'
                              : agency.rating_label?.includes('WATCHLIST')
                                ? 'निगरानी सूची'
                                : agency.rating_label?.includes('CRITICAL')
                                  ? 'गंभीर जोखिम'
                                  : agency.rating_label)
                          : agency.rating_label}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
