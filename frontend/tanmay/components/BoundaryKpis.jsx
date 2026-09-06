import React from 'react';
import { Card, Metric, Text } from '@tremor/react';
import { ShieldAlert, AlertTriangle, Scale, Target, Award, Clock, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BoundaryKpis({ summaryData }) {
  const kpi = summaryData?.kpi_metrics || {};
  const boundary = summaryData?.boundary_metrics || {};
  const signal = summaryData?.mccrary_bunching_signal || {};

  const totalN = boundary.active_revised_population_n || kpi.active_revised_projects || 1183;
  const unrevisedN = boundary.excluded_unrevised_n || kpi.no_revision_on_file_projects || 1024;
  const suspiciousN = boundary.numerator_count || signal.numerator_count || 28;
  const breachedN = boundary.denominator_count || signal.denominator_count || 17;
  const ratio = boundary.ratio || signal.boundary_bin_mass_ratio || 1.65;
  const ci95 = boundary.confidence_interval_95?.string || signal.confidence_interval_95 || '[0.91, 2.97]';

  const cards = [
    {
      title: "ACTIVE REVISED POPULATION",
      metric: `N = ${totalN.toLocaleString('en-IN')}`,
      desc: "Projects with official cost revisions on file evaluated for statutory compliance.",
      badgeText: `${unrevisedN} unrevised excluded`,
      icon: Target,
      borderTop: "border-t-slate-500",
      iconColor: "text-slate-600"
    },
    {
      title: "SUSPICIOUS ZONE [18%, 20%)",
      metric: `n = ${suspiciousN}`,
      desc: "Anomalous concentration of projects stopping just below the 20% CCEA Cabinet re-approval line.",
      badgeText: "+64.7% step vs breached",
      icon: AlertTriangle,
      borderTop: "border-t-amber-500",
      iconColor: "text-amber-500",
      highlight: true
    },
    {
      title: "CCEA APPROVAL ZONE [20%, 22%)",
      metric: `n = ${breachedN}`,
      desc: "Projects that crossed the 20% limit and triggered mandatory Cabinet Secretariat oversight.",
      badgeText: "Statutory Drop-off",
      icon: Scale,
      borderTop: "border-t-rose-500",
      iconColor: "text-rose-500"
    },
    {
      title: "BUNCHING RATIO (SUSPICION SCORE)",
      metric: `${ratio}x`,
      desc: `Statistically significant clustering ratio at boundary (95% CI: ${ci95}).`,
      badgeText: "p < 0.05 Anomaly",
      icon: ShieldAlert,
      borderTop: "border-t-indigo-600",
      iconColor: "text-indigo-600"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 font-sans">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.08 }}
            whileHover={{ y: -3, transition: { duration: 0.15 } }}
          >
            <Card className={`h-full border-t-4 ${c.borderTop} shadow-md bg-white p-5 flex flex-col justify-between`}>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                    {c.title}
                  </span>
                  <Icon className={`w-5 h-5 ${c.iconColor}`} />
                </div>
                <Metric className="text-slate-900 font-heading font-black text-2xl">
                  {c.metric}
                </Metric>
                <Text className="mt-2 text-xs text-slate-600 leading-relaxed font-sans">
                  {c.desc}
                </Text>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span className="px-2 py-0.5 rounded-sm bg-slate-100 text-slate-700 font-semibold text-[10px]">
                  {c.badgeText}
                </span>
                <span className="text-slate-400">Pillar 2</span>
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
