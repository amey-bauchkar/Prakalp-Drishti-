import React, { useState, useEffect } from 'react';
import { CloudRain, Droplets, Sun, Calendar, AlertOctagon, Sliders, RefreshCw } from 'lucide-react';

export default function VarshaSpeedView() {
  const [data, setData] = useState(null);
  const [anomaly, setAnomaly] = useState(20.0);
  const [loading, setLoading] = useState(false);

  const fetchMonsoonData = (anomalyVal) => {
    setLoading(true);
    fetch(`/api/janhavi/monsoon-impact?rainfall_anomaly_pct=${anomalyVal}`)
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load Varsha-Speed data:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchMonsoonData(anomaly);
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#334155] text-white p-6 sm:p-8 rounded-2xl shadow-elevated border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-black uppercase tracking-wider">
            <CloudRain className="w-3.5 h-3.5" /> VARSHA-SPEED · Seasonal Working Window
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Monsoon Rainfall Anomaly & Lost Work-Window Simulator
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Quantifies lost construction days per millimeter of excess rainfall using 20-year IMD historical departure records (2005–2025). Calculates state-wise working window compression for linear infrastructure.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 bg-white/10 px-5 py-4 rounded-xl border border-white/15 backdrop-blur-md">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-300">Module Lead</span>
          <span className="text-lg font-black text-cyan-400">Janhavi</span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-bold">
            Live Connected: /api/janhavi
          </span>
        </div>
      </div>

      {/* Interactive Rainfall Anomaly Slider */}
      <div className="bg-white p-6 rounded-2xl border border-gov-border shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-600" />
            <h3 className="font-black text-sm text-gov-navy uppercase tracking-wider">
              Simulate Nationwide Monsoon Rainfall Departure (IMD Anomaly)
            </h3>
          </div>
          <span className="text-base font-mono font-black text-cyan-700 bg-cyan-50 px-3 py-1 rounded-lg border border-cyan-200">
            {anomaly > 0 ? `+${anomaly}% Excess` : `${anomaly}% Deficit`}
          </span>
        </div>

        <input
          type="range"
          min="-40"
          max="80"
          step="5"
          value={anomaly}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            setAnomaly(val);
            fetchMonsoonData(val);
          }}
          className="w-full accent-cyan-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
        />

        <div className="flex justify-between text-[10px] text-gov-muted font-bold uppercase tracking-wider">
          <span>-40% Drought / Severe Deficit</span>
          <span>0% Normal IMD Long Period Average (LPA)</span>
          <span>+80% Extreme Monsoon Flooding</span>
        </div>
      </div>

      {/* State Working Window Grid */}
      {data ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {data.state_impact_records?.map((rec, idx) => (
            <div key={idx} className="bg-white rounded-xl border border-gov-border shadow-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-black text-sm text-gov-navy">{rec.state}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 font-bold text-gov-muted uppercase">
                  {rec.region}
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gov-muted">Lost Work Days:</span>
                  <span className="font-mono font-black text-rose-600">{rec.simulated_lost_days} Days</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gov-muted">Effective Work Window:</span>
                  <span className="font-mono font-black text-gov-navy">{rec.effective_working_window_months} Months/yr</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gov-muted">Schedule Stretch:</span>
                  <span className="font-mono font-bold text-amber-600">{rec.schedule_stretch_multiplier}x multiplier</span>
                </div>
              </div>

              <div className="pt-2 border-t border-gov-border">
                <span className={`text-[9px] px-2 py-0.5 rounded font-black uppercase tracking-wider block text-center ${
                  rec.risk_tier.includes('CRITICAL') || rec.risk_tier.includes('SEVERE')
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-slate-100 text-gov-muted'
                }`}>
                  {rec.risk_tier.replace(/_/g, ' ')}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
