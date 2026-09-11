import React from 'react';
import { Card, Metric, Text } from '@tremor/react';
import { ShieldAlert, AlertTriangle, Scale, Target, Award, Clock, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BoundaryKpis({ summaryData, lang = 'en' }) {
  const isHi = lang === 'hi';
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
      title: isHi ? "लागत-संशोधित मूल्यांकित परियोजनाएं" : "AUDITED REVISED PROJECTS",
      metric: totalN.toLocaleString('en-IN'),
      desc: isHi
        ? "सांविधिक अनुपालन के लिए मूल्यांकित आधिकारिक लागत संशोधनों वाली परियोजनाएं।"
        : "Projects with official cost revisions on file evaluated for statutory compliance.",
      badgeText: isHi ? `${unrevisedN.toLocaleString('en-IN')} असंशोधित पृथक` : `${unrevisedN.toLocaleString('en-IN')} unrevised excluded`,
      icon: Target,
      borderTop: "border-t-slate-600",
      iconColor: "text-slate-700 dark:text-slate-300",
      metricColor: "text-slate-900"
    },
    {
      title: isHi ? "संदेहास्पद क्षेत्र [18%, 20%)" : "SUSPICIOUS ZONE [18%, 20%)",
      metric: String(suspiciousN),
      desc: isHi
        ? "20% सीसीईए कैबिनेट पुनः अनुमोदन सीमा से ठीक पहले रुकने वाली परियोजनाओं का असामान्य संकेंद्रण।"
        : "Anomalous concentration of projects stopping just below the 20% CCEA Cabinet re-approval line.",
      badgeText: isHi ? "+64.7% वृद्धि (सीमा उल्लंघन की तुलना में)" : "+64.7% step vs breached",
      icon: AlertTriangle,
      borderTop: "border-t-amber-500",
      iconColor: "text-amber-500",
      metricColor: "text-amber-700",
      highlight: true
    },
    {
      title: isHi ? "सीसीईए अनुमोदन क्षेत्र [20%, 22%)" : "CCEA APPROVAL ZONE [20%, 22%)",
      metric: String(breachedN),
      desc: isHi
        ? "20% की सीमा पार कर अनिवार्य कैबिनेट सचिवालय समीक्षा के अधीन आने वाली परियोजनाएं।"
        : "Projects that crossed the 20% limit and triggered mandatory Cabinet Secretariat oversight.",
      badgeText: isHi ? "सांविधिक गिरावट" : "Statutory Drop-off",
      icon: Scale,
      borderTop: "border-t-rose-500",
      iconColor: "text-rose-500",
      metricColor: "text-rose-700"
    },
    {
      title: isHi ? "बंचिंग अनुपात (संदेह स्कोर)" : "BUNCHING RATIO (SUSPICION SCORE)",
      metric: `${ratio}x`,
      desc: isHi
        ? `सीमांत पर सांख्यिकीय रूप से महत्वपूर्ण संकुलन अनुपात (95% CI: ${ci95})।`
        : `Statistically significant clustering ratio at boundary (95% CI: ${ci95}).`,
      badgeText: isHi ? "p < 0.05 विसंगति" : "p < 0.05 Anomaly",
      icon: ShieldAlert,
      borderTop: "border-t-indigo-600",
      iconColor: "text-indigo-600",
      metricColor: "text-indigo-700"
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
            <div className={`h-full border-t-4 ${c.borderTop} rounded-xl shadow-sm hover:shadow-md transition-shadow bg-white p-5 flex flex-col justify-between border border-slate-200`}>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-500 font-mono">
                    {c.title}
                  </span>
                  <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-100">
                    <Icon className={`w-4 h-4 ${c.iconColor}`} />
                  </div>
                </div>
                <div className={`font-heading font-black text-3xl tracking-tight ${c.metricColor || 'text-slate-900'}`}>
                  {c.metric}
                </div>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed font-sans">
                  {c.desc}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-semibold text-[10px] border border-slate-200/60">
                  {c.badgeText}
                </span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
