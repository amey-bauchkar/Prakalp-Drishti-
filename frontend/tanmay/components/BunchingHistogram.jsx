import React from 'react';
import { Card, Metric, Text } from '@tremor/react';
import { BarChart3, AlertTriangle, ShieldCheck, Scale, CheckCircle2, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BunchingHistogram({ histogramData }) {
  const bins = histogramData?.bins || [];
  const meta = histogramData?.population_metadata || {};

  const totalProjects = meta.active_revised_count || 1183;
  const excludedCount = meta.excluded_no_revision_count || 1024;
  const totalCapexCr = bins.reduce((acc, b) => acc + (b.total_capex_cr || 0), 0);
  const maxCount = Math.max(...bins.map((b) => b.project_count || 0), 1);

  // Color mapping based on statutory risk and proximity
  const getBandTheme = (label) => {
    if (label.includes("18.0% - 19.99%")) {
      return {
        barColor: "bg-amber-500",
        badge: "SUSPICIOUS BUNCHING ZONE",
        badgeCls: "bg-amber-100 text-amber-900 border-amber-300 font-bold",
        textCls: "text-amber-800 font-bold"
      };
    }
    if (label.includes("20.0% - 22.0%")) {
      return {
        barColor: "bg-rose-600",
        badge: "CABINET CCEA CEILING MET",
        badgeCls: "bg-rose-100 text-rose-900 border-rose-300 font-bold",
        textCls: "text-rose-800 font-bold"
      };
    }
    if (label.includes("30.0%+")) {
      return {
        barColor: "bg-rose-700",
        badge: "Severe Overrun",
        badgeCls: "bg-rose-50 text-rose-800 border-rose-200",
        textCls: "text-slate-800 font-semibold"
      };
    }
    if (label.includes("22.0% - 29.99%")) {
      return {
        barColor: "bg-rose-500",
        badge: "Substantial Breach",
        badgeCls: "bg-rose-50 text-rose-700 border-rose-200",
        textCls: "text-slate-800 font-semibold"
      };
    }
    if (label.includes("15.0% - 17.99%")) {
      return {
        barColor: "bg-indigo-600",
        badge: "Pre-Threshold",
        badgeCls: "bg-indigo-50 text-indigo-700 border-indigo-200",
        textCls: "text-slate-800 font-semibold"
      };
    }
    if (label.includes("10.0% - 14.99%")) {
      return {
        barColor: "bg-sky-600",
        badge: "Elevated",
        badgeCls: "bg-sky-50 text-sky-700 border-sky-200",
        textCls: "text-slate-800 font-semibold"
      };
    }
    if (label.includes("5.0% - 9.99%")) {
      return {
        barColor: "bg-teal-600",
        badge: "Moderate",
        badgeCls: "bg-teal-50 text-teal-700 border-teal-200",
        textCls: "text-slate-800 font-semibold"
      };
    }
    return {
      barColor: "bg-emerald-600",
      badge: "Low Overrun",
      badgeCls: "bg-emerald-50 text-emerald-800 border-emerald-200",
      textCls: "text-slate-800 font-semibold"
    };
  };

  return (
    <Card className="p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-md bg-white space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
              <BarChart3 className="w-4 h-4" />
            </span>
            <h3 className="font-heading font-extrabold text-lg text-slate-900 tracking-tight">
              MCCRARY COST-OVERRUN DENSITY DISTRIBUTION
            </h3>
          </div>
          <p className="text-xs text-slate-500 font-sans">
            Evaluated cost-revised projects ({totalProjects.toLocaleString('en-IN')}) across ₹{totalCapexCr.toLocaleString('en-IN', { maximumFractionDigits: 0 })} Cr total public outlay.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <span className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
            [18%, 20%): 28 Projects (Anomalous Spike)
          </span>
          <span className="px-2.5 py-1 rounded-md bg-rose-50 text-rose-800 border border-rose-200 font-semibold">
            [20%, 22%): 17 Projects (CCEA Drop-off)
          </span>
          <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
            {excludedCount} Unrevised Excluded
          </span>
        </div>
      </div>

      {/* Structured Histogram Rows */}
      <div className="space-y-4">
        {bins.map((bin, idx) => {
          const count = bin.project_count || 0;
          const pctWidth = Math.max(3, (count / maxCount) * 100);
          const sharePct = ((count / totalProjects) * 100).toFixed(1);
          const theme = getBandTheme(bin.bin_label);

          return (
            <div
              key={idx}
              className={`p-3.5 rounded-xl border transition-all ${
                bin.is_bunching_spike
                  ? 'bg-amber-50/40 border-amber-300 ring-1 ring-amber-400/40'
                  : bin.is_cabinet_breached
                  ? 'bg-rose-50/30 border-rose-300 ring-1 ring-rose-400/30'
                  : 'bg-slate-50/60 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {/* Row Top Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className={`text-[12.5px] ${theme.textCls}`}>
                    {bin.bin_label}
                  </span>
                  <span className={`px-2 py-0.5 rounded-sm text-[10px] uppercase border ${theme.badgeCls}`}>
                    {theme.badge}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-[11.5px]">
                  <span className="text-slate-500">
                    Share: <strong className="text-slate-800">{sharePct}%</strong>
                  </span>
                  <span className="font-bold text-slate-900">
                    {count} {count === 1 ? 'Project' : 'Projects'}
                  </span>
                  <span className="text-slate-600 font-medium">
                    ₹{(bin.total_capex_cr || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })} Cr
                  </span>
                </div>
              </div>

              {/* Smooth Full-Width Progress Track */}
              <div className="h-3.5 w-full bg-slate-200/80 rounded-full overflow-hidden p-0.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pctWidth}%` }}
                  transition={{ duration: 0.6, delay: idx * 0.04 }}
                  className={`h-full rounded-full ${theme.barColor} transition-all`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
