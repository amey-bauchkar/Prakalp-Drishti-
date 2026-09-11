import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Link2, ShieldCheck, Eye, MessageSquare, CheckCircle2,
  Printer, ArrowLeft, ExternalLink, Send, ChevronRight, AlertTriangle
} from 'lucide-react';
import { useLanguage } from '../lib/i18n';
import { POLICY_TABS_DATA } from '../lib/i18n/policyStrings';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.04 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 320, damping: 24 }
  }
};

const TAB_ICONS = {
  disclaimer: FileText,
  hyperlinking: Link2,
  privacy: ShieldCheck,
  accessibility: Eye,
  grievance: MessageSquare,
};

export const POLICY_TABS = POLICY_TABS_DATA.map(tab => ({
  id: tab.id,
  label: tab.label.en,
  subtitle: tab.subtitle.en,
  icon: TAB_ICONS[tab.id] || FileText,
}));

export default function PoliciesView() {
  const { lang, isHi, t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'disclaimer';
  const [tab, setTab] = useState(initialTab);

  // Form state for Grievance
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: 'data_discrepancy',
    projectId: '',
    details: '',
  });
  const [submittedReceipt, setSubmittedReceipt] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const qTab = searchParams.get('tab');
    if (qTab && POLICY_TABS_DATA.some(t => t.id === qTab)) {
      setTab(qTab);
    }
  }, [searchParams]);

  const selectTab = (newTab) => {
    setTab(newTab);
    setSearchParams({ tab: newTab });
    setSubmittedReceipt(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      const trackingId = `MOSPI/2026/GRV-${Math.floor(10000 + Math.random() * 90000)}`;
      const receipt = {
        trackingId,
        timestamp: new Date().toISOString(),
        ...formData,
      };
      try {
        const existing = JSON.parse(localStorage.getItem('prakalp_grievances') || '[]');
        existing.unshift(receipt);
        localStorage.setItem('prakalp_grievances', JSON.stringify(existing.slice(0, 10)));
      } catch (err) {
        console.error(err);
      }
      setSubmittedReceipt(receipt);
      setSubmitting(false);
    }, 600);
  };

  const activeTabMeta = POLICY_TABS_DATA.find(t => t.id === tab) || POLICY_TABS_DATA[0];
  const activeLabel = isHi ? activeTabMeta.label.hi : activeTabMeta.label.en;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="py-6 sm:py-8 max-w-4xl mx-auto space-y-6 px-4 sm:px-6"
    >
      {/* Top Breadcrumb & Action Bar */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
          <Link to="/" className="text-[#0060B6] hover:underline font-bold flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t('breadcrumb_home')}</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span>{t('breadcrumb_root')}</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-800 font-bold">{activeLabel}</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-heading font-bold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            title={t('print_doc')}
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>{t('print_doc')}</span>
          </button>
        </div>
      </motion.div>

      {/* Policy Document Content */}
      <main className="bg-white rounded-xl border border-slate-200 p-6 sm:p-10 shadow-xs text-slate-700 leading-relaxed font-sans">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="space-y-6"
          >
            {/* 1. Website Policies & Disclaimer */}
            {tab === 'disclaimer' && (
              <div className="space-y-6">
                <div className="border-b border-slate-200 pb-4">
                  <div className="text-[11px] font-mono uppercase tracking-widest text-[#0060B6] font-bold">
                    {t('disclaimer_eyebrow')}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-heading font-black text-slate-900 mt-1">
                    {t('disclaimer_title')}
                  </h2>
                  <div className="text-xs text-slate-400 mt-1 font-mono">
                    {t('last_updated')}
                  </div>
                </div>

                <div className="bg-blue-50 border-l-4 border-[#0060B6] p-4 rounded-r-lg text-xs sm:text-[13px] text-blue-950 leading-relaxed">
                  <strong>{t('disclaimer_mandate_label')}</strong> {t('disclaimer_mandate_text')}
                </div>

                <section className="space-y-2">
                  <h3 className="font-heading font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#0060B6]" />
                    {t('disclaimer_sec1_title')}
                  </h3>
                  <p className="text-xs sm:text-[13px] leading-relaxed">
                    {t('disclaimer_sec1_text')}
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="font-heading font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#0060B6]" />
                    {t('disclaimer_sec2_title')}
                  </h3>
                  <p className="text-xs sm:text-[13px] leading-relaxed">
                    {t('disclaimer_sec2_text')}
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="font-heading font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#0060B6]" />
                    {t('disclaimer_sec3_title')}
                  </h3>
                  <p className="text-xs sm:text-[13px] leading-relaxed">
                    {t('disclaimer_sec3_text')}
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="font-heading font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#0060B6]" />
                    {t('disclaimer_sec4_title')}
                  </h3>
                  <p className="text-xs sm:text-[13px] leading-relaxed">
                    {t('disclaimer_sec4_text')}
                  </p>
                </section>
              </div>
            )}

            {/* 2. Hyperlinking Policy */}
            {tab === 'hyperlinking' && (
              <div className="space-y-6">
                <div className="border-b border-slate-200 pb-4">
                  <div className="text-[11px] font-mono uppercase tracking-widest text-[#0060B6] font-bold">
                    {t('hyperlink_eyebrow')}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-heading font-black text-slate-900 mt-1">
                    {t('hyperlink_title')}
                  </h2>
                  <div className="text-xs text-slate-400 mt-1 font-mono">
                    {t('last_updated')}
                  </div>
                </div>

                <section className="space-y-3">
                  <h3 className="font-heading font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#0060B6]" />
                    {t('hyperlink_sec1_title')}
                  </h3>
                  <p className="text-xs sm:text-[13px] leading-relaxed">
                    {t('hyperlink_sec1_text')}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <a href="https://mospi.gov.in" target="_blank" rel="noopener noreferrer" className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg hover:border-blue-300 flex items-center justify-between group">
                      <span>{isHi ? 'सांख्यिकी मंत्रालय आधिकारिक पोर्टल (mospi.gov.in)' : 'MoSPI Official Portal (mospi.gov.in)'}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
                    </a>
                    <a href="https://pmgatishakti.gov.in" target="_blank" rel="noopener noreferrer" className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg hover:border-blue-300 flex items-center justify-between group">
                      <span>{isHi ? 'पीएम गतिशक्ति राष्ट्रीय मास्टर प्लान (pmgatishakti.gov.in)' : 'PM GatiShakti NMP (pmgatishakti.gov.in)'}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
                    </a>
                    <a href="https://bhuvan.nrsc.gov.in" target="_blank" rel="noopener noreferrer" className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg hover:border-blue-300 flex items-center justify-between group">
                      <span>{isHi ? 'इसरो भुवन भू-स्थानिक पोर्टल (bhuvan.nrsc.gov.in)' : 'ISRO Bhuvan Geo-Platform (bhuvan.nrsc.gov.in)'}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
                    </a>
                    <a href="https://data.gov.in" target="_blank" rel="noopener noreferrer" className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg hover:border-blue-300 flex items-center justify-between group">
                      <span>{isHi ? 'ओपन गवर्नमेंट डेटा (OGD India - data.gov.in)' : 'Open Government Data (OGD India - data.gov.in)'}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
                    </a>
                  </div>
                  <p className="text-xs sm:text-[13px] leading-relaxed text-slate-600">
                    {t('hyperlink_ext_disclaimer')}
                  </p>
                </section>

                <section className="space-y-3">
                  <h3 className="font-heading font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#0060B6]" />
                    {t('hyperlink_sec2_title')}
                  </h3>
                  <p className="text-xs sm:text-[13px] leading-relaxed">
                    {t('hyperlink_sec2_text')}
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-xs sm:text-[13px] text-slate-600">
                    <li>{t('hyperlink_sec2_c1')}</li>
                    <li>{t('hyperlink_sec2_c2')}</li>
                  </ul>
                </section>
              </div>
            )}

            {/* 3. Privacy Policy */}
            {tab === 'privacy' && (
              <div className="space-y-6">
                <div className="border-b border-slate-200 pb-4">
                  <div className="text-[11px] font-mono uppercase tracking-widest text-emerald-700 font-bold">
                    {t('privacy_eyebrow')}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-heading font-black text-slate-900 mt-1">
                    {t('privacy_title')}
                  </h2>
                  <div className="text-xs text-slate-400 mt-1 font-mono">
                    {t('privacy_compliance_sub')}
                  </div>
                </div>

                <div className="bg-emerald-50 border-l-4 border-emerald-600 p-4 rounded-r-lg text-xs sm:text-[13px] text-emerald-950 leading-relaxed">
                  <strong>{t('privacy_banner_label')}</strong> {t('privacy_banner_text')}
                </div>

                <section className="space-y-2">
                  <h3 className="font-heading font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    {t('privacy_sec1_title')}
                  </h3>
                  <p className="text-xs sm:text-[13px] leading-relaxed">
                    {t('privacy_sec1_text')}
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="font-heading font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    {t('privacy_sec2_title')}
                  </h3>
                  <p className="text-xs sm:text-[13px] leading-relaxed">
                    {t('privacy_sec2_text')}
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="font-heading font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    {t('privacy_sec3_title')}
                  </h3>
                  <p className="text-xs sm:text-[13px] leading-relaxed">
                    {t('privacy_sec3_text')}
                  </p>
                </section>
              </div>
            )}

            {/* 4. Accessibility Statement */}
            {tab === 'accessibility' && (
              <div className="space-y-6">
                <div className="border-b border-slate-200 pb-4">
                  <div className="text-[11px] font-mono uppercase tracking-widest text-[#0060B6] font-bold">
                    {t('a11y_eyebrow')}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-heading font-black text-slate-900 mt-1">
                    {t('a11y_title')}
                  </h2>
                  <div className="text-xs text-slate-600 mt-1 font-mono">
                    {t('a11y_sub')}
                  </div>
                </div>

                <p className="text-xs sm:text-[13px] leading-relaxed">
                  {t('a11y_intro')}
                </p>

                <div className="p-3.5 rounded-xl border border-slate-300 bg-slate-50 text-xs sm:text-[13px] leading-relaxed">
                  <strong>{t('a11y_status_label')}</strong> {t('a11y_status_text')}
                </div>

                <div>
                  <h3 className="text-[13px] font-heading font-black text-slate-900 mb-2.5">
                    {t('a11y_works_title')}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                      <div className="font-bold text-slate-900 flex items-center gap-2 text-xs sm:text-[13px]">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                        {t('a11y_w1_title')}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {t('a11y_w1_desc')}
                      </p>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                      <div className="font-bold text-slate-900 flex items-center gap-2 text-xs sm:text-[13px]">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                        {t('a11y_w2_title')}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {t('a11y_w2_desc')}
                      </p>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                      <div className="font-bold text-slate-900 flex items-center gap-2 text-xs sm:text-[13px]">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                        {t('a11y_w3_title')}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {t('a11y_w3_desc')}
                      </p>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                      <div className="font-bold text-slate-900 flex items-center gap-2 text-xs sm:text-[13px]">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                        {t('a11y_w4_title')}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {t('a11y_w4_desc')}
                      </p>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                      <div className="font-bold text-slate-900 flex items-center gap-2 text-xs sm:text-[13px]">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                        {t('a11y_w5_title')}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {t('a11y_w5_desc')}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-[13px] font-heading font-black text-slate-900 mb-2.5">
                    {t('a11y_gaps_title')}
                  </h3>
                  <ul className="space-y-2 text-xs sm:text-[13px] text-slate-700">
                    <li className="flex items-start gap-2.5 p-3 rounded-lg border border-amber-300 bg-amber-50">
                      <AlertTriangle className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
                      <span>{t('a11y_g1_text')}</span>
                    </li>
                    <li className="flex items-start gap-2.5 p-3 rounded-lg border border-amber-300 bg-amber-50">
                      <AlertTriangle className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
                      <span>{t('a11y_g2_text')}</span>
                    </li>
                  </ul>
                </div>

                <div className="p-4 bg-slate-100 border border-slate-300 rounded-xl text-xs sm:text-[13px] text-slate-800 space-y-1">
                  <strong>{t('a11y_barrier_title')}</strong>
                  <p className="leading-relaxed">
                    {t('a11y_barrier_text')}
                  </p>
                </div>
              </div>
            )}

            {/* 5. Feedback & Grievance Redressal */}
            {tab === 'grievance' && (
              <div className="space-y-6">
                <div className="border-b border-slate-200 pb-4">
                  <div className="text-[11px] font-mono uppercase tracking-widest text-[#0060B6] font-bold">
                    {t('grv_eyebrow')}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-heading font-black text-slate-900 mt-1">
                    {t('grv_title')}
                  </h2>
                  <div className="text-xs text-slate-400 mt-1 font-mono">
                    {t('grv_sub')}
                  </div>
                </div>

                {submittedReceipt ? (
                  <div className="p-6 bg-slate-50 border border-slate-300 rounded-xl space-y-5 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                      <div className="flex items-center gap-2 text-slate-900 font-extrabold text-base font-heading">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <span>{isHi ? 'भारत सरकार शिकायत डॉकेट जनरेट हुआ' : 'Government of India Grievance Docket Generated'}</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded font-mono font-bold text-xs bg-amber-100 text-amber-900 border border-amber-300">
                        {isHi ? 'प्रोटोटाइप प्रदर्शन' : 'PROTOTYPE DEMONSTRATION'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed font-sans">
                      {isHi
                        ? 'यह प्रोटोटाइप दर्शाता है कि सीपीजीआरएएमएस-अनुकूल शिकायत पोर्टल कैसे कार्य करता है। MoSPI या किसी सरकारी सर्वर पर कोई डेटा प्रेषित नहीं किया गया है। नीचे दिया गया संदर्भ केवल ब्राउज़र सत्यापन हेतु है:'
                        : 'This prototype illustrates how a CPGRAMS-interoperable intake registers a grievance against a monitored central infrastructure project. Nothing was transmitted to MoSPI or any live government server. The reference below was generated for browser verification:'}
                    </p>

                    <div className="bg-white p-5 rounded-xl border border-slate-300 font-mono text-xs sm:text-[13px] space-y-2 shadow-2xs">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="text-slate-500 font-bold uppercase text-[10.5px]">
                          {isHi ? 'आधिकारिक डॉकेट संख्या:' : 'Official Docket Number:'}
                        </span>
                        <span className="text-gov-navy font-black text-sm bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {submittedReceipt.trackingId}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">{isHi ? 'पंजीकरण समय:' : 'Registration Timestamp:'}</span>
                        <span className="font-bold text-slate-900">{new Date(submittedReceipt.timestamp).toLocaleString(isHi ? 'hi-IN' : 'en-IN')}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">{isHi ? 'शिकायत श्रेणी:' : 'Grievance Head:'}</span>
                        <span className="font-bold text-slate-900">{submittedReceipt.category}</span>
                      </div>
                      {submittedReceipt.projectId && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">{isHi ? 'परियोजना संदर्भ:' : 'Project Reference:'}</span>
                          <span className="font-bold text-amber-700">#{submittedReceipt.projectId}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                        <span className="text-slate-500">{isHi ? 'शिकायतकर्ता:' : 'Complainant:'}</span>
                        <span className="font-semibold text-slate-800">{submittedReceipt.name} ({submittedReceipt.email})</span>
                      </div>
                    </div>

                    <div className="text-xs text-slate-600 bg-amber-50/70 p-3 rounded-lg border border-amber-200">
                      <strong>{isHi ? 'वास्तविक वैधानिक शिकायत दर्ज करने हेतु:' : 'To file a real statutory grievance:'}</strong>{' '}
                      {isHi
                        ? 'भारत सरकार के केंद्रीय सीपीजीआरएएमएस पोर्टल का उपयोग करें: '
                        : "Use the Government of India's central CPGRAMS portal at "}
                      <a href="https://pgportal.gov.in" target="_blank" rel="noopener noreferrer" className="text-blue-700 underline font-bold">
                        pgportal.gov.in
                      </a>. {isHi ? 'वह पोर्टल आधिकारिक विधिक ट्रैकिंग संख्या जारी करता है।' : 'That portal issues the official legal tracking number.'}
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-bold transition-colors shadow-2xs cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>{isHi ? 'डॉकेट रसीद प्रिंट करें' : 'Print Docket Receipt'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSubmittedReceipt(null)}
                        className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        {isHi ? 'अन्य शिकायत दर्ज करें' : 'File Another Grievance'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 border border-amber-300 rounded-xl">
                      <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                      <p className="text-xs sm:text-[13px] leading-relaxed text-amber-950">
                        <strong>{isHi ? 'प्रदर्शनी इंटरफ़ेस — यह प्रपत्र आधिकारिक शिकायत दर्ज नहीं करता है।' : 'Demonstration interface — this form does not file a grievance.'}</strong>{' '}
                        {isHi
                          ? 'यह केवल दर्शाता है कि सीपीजीआरएएमएस-अनुकूल प्रणाली कैसे कार्य करेगी। आपके द्वारा दर्ज डेटा स्थानीय ब्राउज़र में ही रहता है। वास्तविक शिकायत हेतु '
                          : 'It shows how a CPGRAMS-interoperable intake would work. Nothing you enter is transmitted to MoSPI or any government system; it stays in this browser. To file a real grievance, use '}
                        <a href="https://pgportal.gov.in" target="_blank" rel="noopener noreferrer" className="text-blue-700 underline font-bold">pgportal.gov.in</a>.
                      </p>
                    </div>
                    <p className="text-xs sm:text-[13px] leading-relaxed text-slate-600">
                      {isHi
                        ? 'परिनियोजित प्रणाली में, नागरिक, ठेकेदार और सार्वजनिक लेखा परीक्षक भौतिक प्रगति विसंगतियों, भू-कोडिंग अशुद्धियों या वैधानिक पर्यावरण मंजूरी बाधाओं के संबंध में यहां शिकायतें दर्ज करते हैं।'
                        : 'In a deployed system, citizens, contractors, and public auditors would register grievances here regarding physical progress discrepancies, geocoding inaccuracies, or statutory environmental clearance bottlenecks.'}
                    </p>

                    <form onSubmit={handleFormSubmit} className="space-y-4 bg-slate-50 p-5 sm:p-6 rounded-xl border border-slate-200">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-800 mb-1">
                            {isHi ? 'पूरा नाम *' : 'Full Name *'}
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder={isHi ? 'उदा. रमेश कुमार' : 'e.g. Ramesh Kumar'}
                            className="w-full px-3 py-2 text-xs sm:text-[13px] bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-800 mb-1">
                            {isHi ? 'ईमेल पता / मोबाइल *' : 'Email Address / Mobile *'}
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder={isHi ? 'उदा. citizen@nic.in' : 'e.g. citizen@nic.in'}
                            className="w-full px-3 py-2 text-xs sm:text-[13px] bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-800 mb-1">
                            {isHi ? 'शिकायत श्रेणी *' : 'Grievance Category *'}
                          </label>
                          <select
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            className="w-full px-3 py-2 text-xs sm:text-[13px] bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-hidden font-sans"
                          >
                            <option value="data_discrepancy">{isHi ? 'धरातलीय वास्तविकता बनाम रिपोर्ट की गई प्रगति में अंतर' : 'Ground Reality vs Reported Progress Mismatch'}</option>
                            <option value="geocoding">{isHi ? 'अशुद्ध जीपीएस / मानचित्र पिनपॉइंट' : 'Inaccurate GPS / Map Pinpoint'}</option>
                            <option value="statutory_clearance">{isHi ? 'पर्यावरणीय / वन मंजूरी में देरी' : 'Environmental / Forest Clearance Delay'}</option>
                            <option value="contractor_dispute">{isHi ? 'ठेकेदार भुगतान / मध्यस्थता विवाद' : 'Contractor Payment / Arbitration Query'}</option>
                            <option value="portal_feedback">{isHi ? 'पोर्टल उपयोगिता / तकनीकी बग' : 'Portal Usability / Technical Bug'}</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-800 mb-1">
                            {isHi ? 'परियोजना आईडी या नाम (वैकल्पिक)' : 'Project ID or Name (Optional)'}
                          </label>
                          <input
                            type="text"
                            value={formData.projectId}
                            onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                            placeholder={isHi ? 'उदा. 702625 या भोपाल मेट्रो' : 'e.g. 702625 or Bhopal Metro'}
                            className="w-full px-3 py-2 text-xs sm:text-[13px] bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">
                          {isHi ? 'अवलोकन / शिकायत का विस्तृत विवरण *' : 'Detailed Description of Observation / Grievance *'}
                        </label>
                        <textarea
                          required
                          rows={4}
                          value={formData.details}
                          onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                          placeholder={isHi ? 'विशिष्ट अवलोकन, तिथियां, स्थल तस्वीरें या सत्यापन विवरण प्रदान करें...' : 'Provide specific observations, dates, site photographs, or verification details...'}
                          className="w-full px-3 py-2 text-xs sm:text-[13px] bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                        <span className="text-[11px] text-slate-500">
                          {isHi ? 'मंत्रालय पीएमडी शिकायत रजिस्टर से जुड़ी औपचारिक प्रविष्टि' : 'Formal submission linked to MoSPI PMD Grievance Register'}
                        </span>
                        <button
                          type="submit"
                          disabled={submitting}
                          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#0060B6] hover:bg-blue-700 text-white font-bold text-xs sm:text-[13px] rounded-lg transition-colors shadow-xs cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          {submitting
                            ? (isHi ? 'शिकायत दर्ज हो रही है...' : 'Registering Grievance...')
                            : (isHi ? 'आधिकारिक शिकायत दर्ज करें' : 'Submit Official Grievance')}
                        </button>
                      </div>
                    </form>
                  </>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Related Policies Navigation */}
        <div className="pt-6 mt-8 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
          <span className="font-semibold text-slate-700">{isHi ? 'अन्य वैधानिक नीतियां:' : 'Other Statutory Policies:'}</span>
          <div className="flex flex-wrap gap-2">
            {POLICY_TABS_DATA.filter(item => item.id !== tab).map((item) => (
              <button
                key={item.id}
                onClick={() => selectTab(item.id)}
                className="text-[#0060B6] hover:underline px-2.5 py-1 rounded bg-slate-50 border border-slate-200 text-[11.5px] font-medium transition-colors hover:bg-slate-100 cursor-pointer"
              >
                {isHi ? item.label.hi : item.label.en}
              </button>
            ))}
          </div>
        </div>
      </main>
    </motion.div>
  );
}
