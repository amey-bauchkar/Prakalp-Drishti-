import React from 'react';
import { Card, Metric, Text } from '@tremor/react';
import { ShieldAlert, AlertTriangle, Scale, Target, Award, Clock, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BoundaryKpis({ summaryData, lang = 'en' }) {
  const isHi = lang === 'hi';
  const kpi = summaryData?.kpi_metrics || {};
  const boundary = summaryData?.boundary_metrics || {};
  // Two objects now: the descriptive two-bin ratio and the actual McCrary test.
  const signal = summaryData?.boundary_bin_ratio || summaryData?.mccrary_bunching_signal || {};
  const mcc = summaryData?.mccrary_density_test || {};

  const totalN = boundary.active_revised_population_n ?? kpi.active_revised_projects ?? 0;
  const unrevisedN = boundary.excluded_unrevised_n ?? kpi.no_revision_on_file_projects ?? 0;
  const suspiciousN = boundary.numerator_count ?? signal.numerator_count ?? 0;
  const breachedN = boundary.denominator_count ?? signal.denominator_count ?? 0;
  const ratio = boundary.ratio ?? signal.boundary_bin_mass_ratio ?? '—';
  const ci95 = boundary.confidence_interval_95?.string ?? signal.confidence_interval_95 ?? '—';

  const cards = [
    {
      title: isHi ? "सक्रिय संशोधित संवर्ग" : "ACTIVE REVISED POPULATION",
      metric: `N = ${totalN.toLocaleString('en-IN')}`,
      desc: isHi
        ? "सांविधिक अनुपालन के लिए मूल्यांकित आधिकारिक लागत संशोधनों वाली परियोजनाएं।"
        : "Projects with official cost revisions on file evaluated for statutory compliance.",
      badgeText: isHi ? `${unrevisedN} असंशोधित पृथक` : `${unrevisedN} unrevised excluded`,
      icon: Target,
      borderTop: "border-t-slate-500",
      iconColor: "text-slate-600"
    },
    {
      title: isHi ? "सीमा से नीचे [18%, 20%)" : "JUST BELOW THRESHOLD [18%, 20%)",
      metric: `n = ${suspiciousN}`,
      desc: isHi
        ? "20% सीसीईए कैबिनेट पुनः अनुमोदन सीमा से ठीक नीचे स्थित संशोधन। एक वर्णनात्मक गणना; अभिप्राय का साक्ष्य नहीं।"
        : "Revisions landing just below the 20% CCEA Cabinet re-approval line. A descriptive count, not evidence of intent.",
      badgeText: isHi ? `${ratio}x बनाम [20%, 22%)` : `${ratio}x vs [20%, 22%)`,
      icon: AlertTriangle,
      borderTop: "border-t-amber-500",
      iconColor: "text-amber-500",
      highlight: true
    },
    {
      title: isHi ? "सीसीईए अनुमोदन क्षेत्र [20%, 22%)" : "CCEA APPROVAL ZONE [20%, 22%)",
      metric: `n = ${breachedN}`,
      desc: isHi
        ? "20% की सीमा पार कर अनिवार्य कैबिनेट सचिवालय समीक्षा के अधीन आने वाली परियोजनाएं।"
        : "Projects that crossed the 20% limit and triggered mandatory Cabinet Secretariat oversight.",
      badgeText: isHi ? "सांविधिक गिरावट" : "Statutory Drop-off",
      icon: Scale,
      borderTop: "border-t-rose-500",
      iconColor: "text-rose-500"
    },
    {
      // The McCrary (2008) density-discontinuity test at the 20% cutoff, reported as
      // computed. The card that stood here read "Statistically significant clustering
      // ratio ... p < 0.05 Anomaly" over a two-bin ratio whose 95% CI included 1.0.
      title: isHi ? "मैक्रेरी घनत्व परीक्षण (20%)" : "McCRARY DENSITY TEST AT 20%",
      metric: mcc.available
        ? `p = ${Number(mcc.p_two_sided).toFixed(2)}`
        : (isHi ? "अनुपलब्ध" : "unavailable"),
      desc: mcc.available
        ? (isHi
            ? `घनत्व अनुपात ${Number(mcc.density_ratio_right_over_left).toFixed(2)} (ऊपर/नीचे), z = ${Number(mcc.z).toFixed(2)}, बैंडविड्थ ${Number(mcc.bandwidth).toFixed(1)}। ${mcc.significant_at_5pct_two_sided ? "सीमा पर विच्छिन्नता है।" : "सीमा पर कोई विच्छिन्नता नहीं।"} द्वि-बिन अनुपात ${ratio}x (95% CI ${ci95}) वर्णनात्मक है।`
            : `Density ratio ${Number(mcc.density_ratio_right_over_left).toFixed(2)} (above/below), z = ${Number(mcc.z).toFixed(2)}, bandwidth ${Number(mcc.bandwidth).toFixed(1)} pts. ${mcc.significant_at_5pct_two_sided ? "Discontinuity detected at the cutoff." : "No discontinuity at the cutoff."} The two-bin ratio ${ratio}x (95% CI ${ci95}) is descriptive only.`)
        : (isHi ? "परीक्षण नहीं चल सका।" : "The test could not be run on this sample."),
      badgeText: mcc.available
        ? (mcc.significant_at_5pct_two_sided
            ? (isHi ? "p < 0.05" : "p < 0.05")
            : (isHi ? "महत्वपूर्ण नहीं" : "Not significant"))
        : "—",
      icon: ShieldAlert,
      borderTop: mcc.available && mcc.significant_at_5pct_two_sided ? "border-t-rose-600" : "border-t-slate-500",
      iconColor: mcc.available && mcc.significant_at_5pct_two_sided ? "text-rose-600" : "text-slate-600"
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
