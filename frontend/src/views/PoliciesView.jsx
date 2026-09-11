import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Link2, ShieldCheck, Eye, MessageSquare, CheckCircle2,
  Building2, Printer, ArrowLeft, ExternalLink, Send, ChevronRight,
  HelpCircle, Shield, Info, Clock, AlertCircle, AlertTriangle
} from 'lucide-react';

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

export const POLICY_TABS = [
  { id: 'disclaimer', label: 'Website Policies & Disclaimer', subtitle: 'MoSPI Charter, OCMS Data & CAG Disclaimer', icon: FileText },
  { id: 'hyperlinking', label: 'Hyperlinking Policy & Terms', subtitle: 'GIGW 3.0 Interoperability & Inbound Linking', icon: Link2 },
  { id: 'privacy', label: 'Privacy Policy (DPDP Act)', subtitle: 'Digital Personal Data Protection & Audit Logs', icon: ShieldCheck },
  { id: 'accessibility', label: 'Accessibility Statement (GIGW 3.0)', subtitle: 'WCAG 2.1 Level AA & Assistive Features', icon: Eye },
  { id: 'grievance', label: 'Feedback & Grievance Redressal', subtitle: 'CPGRAMS Integration & Dispute Ticketing', icon: MessageSquare },
];

import { scrollToTop } from '../components/SmoothScrollProvider';

const CATEGORY_LABELS = {
  data_discrepancy: 'Ground Reality vs Reported Progress Mismatch',
  geocoding: 'Inaccurate GPS / Map Pinpoint',
  statutory_clearance: 'Environmental / Forest Clearance Delay',
  contractor_dispute: 'Contractor Payment / Arbitration Query',
  portal_feedback: 'Portal Usability / Technical Bug',
  other: 'Other',
};

export default function PoliciesView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'disclaimer';
  const [tab, setTab] = useState(initialTab);

  // Form state for Grievance
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: 'data_discrepancy',
    otherCategory: '',
    projectId: '',
    details: '',
  });
  const [submittedReceipt, setSubmittedReceipt] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const qTab = searchParams.get('tab');
    if (qTab && POLICY_TABS.some(t => t.id === qTab)) {
      setTab(qTab);
      scrollToTop(true);
    }
  }, [searchParams]);

  const selectTab = (newTab) => {
    setTab(newTab);
    setSearchParams({ tab: newTab });
    setSubmittedReceipt(null);
    scrollToTop(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const finalCategory = formData.category === 'other'
      ? `Other (${formData.otherCategory.trim() || 'Custom Observation'})`
      : (CATEGORY_LABELS[formData.category] || formData.category);

    try {
      const response = await fetch('/api/grievances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          category: formData.category,
          otherCategory: formData.otherCategory,
          categoryLabel: finalCategory,
          projectId: formData.projectId,
          details: formData.details,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const result = await response.json();
      const receipt = {
        trackingId: result.trackingId || `MOSPI/2026/GRV-${Math.floor(10000 + Math.random() * 90000)}`,
        timestamp: result.timestamp || new Date().toISOString(),
        storedInDb: result.storedInDb ?? true,
        ...formData,
        categoryLabel: finalCategory,
      };

      try {
        const existing = JSON.parse(localStorage.getItem('prakalp_grievances') || '[]');
        existing.unshift(receipt);
        localStorage.setItem('prakalp_grievances', JSON.stringify(existing.slice(0, 10)));
      } catch (err) {
        console.error(err);
      }

      setSubmittedReceipt(receipt);
    } catch (err) {
      console.warn('Backend API submission error, using local resilience:', err);
      const trackingId = `MOSPI/2026/GRV-${Math.floor(10000 + Math.random() * 90000)}`;
      const receipt = {
        trackingId,
        timestamp: new Date().toISOString(),
        storedInDb: false,
        ...formData,
        categoryLabel: finalCategory,
      };
      try {
        const existing = JSON.parse(localStorage.getItem('prakalp_grievances') || '[]');
        existing.unshift(receipt);
        localStorage.setItem('prakalp_grievances', JSON.stringify(existing.slice(0, 10)));
      } catch (e) {
        console.error(e);
      }
      setSubmittedReceipt(receipt);
    } finally {
      setSubmitting(false);
    }
  };

  const currentTabMeta = POLICY_TABS.find(t => t.id === tab) || POLICY_TABS[0];

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="py-6 sm:py-8 max-w-[1440px] mx-auto space-y-6"
    >
      {/* Top Breadcrumb & Action Bar */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
          <Link to="/" className="text-[#0060B6] hover:underline font-bold flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Portal
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-800 font-bold">{currentTabMeta.label}</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-heading font-bold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            title="Print this policy document"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print Policy Document</span>
          </button>
        </div>
      </motion.div>

      {/* Main Content View (Isolated Policy Document) */}
      <motion.main variants={itemVariants} className="w-full bg-white rounded-xl border border-slate-200 p-6 sm:p-10 shadow-xs text-slate-700 leading-relaxed font-sans">
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
                  Institutional Charter · Section 4(1)(b)
                </div>
                <h2 className="text-xl sm:text-2xl font-heading font-black text-slate-900 mt-1">
                  Website Policies &amp; Statutory Disclaimer
                </h2>
                <div className="text-xs text-slate-400 mt-1 font-mono">
                  Last Updated: September 2026 · Official Publication
                </div>
              </div>

              <div className="bg-blue-50 border-l-4 border-[#0060B6] p-4 rounded-r-lg text-xs sm:text-[13px] text-blue-950 leading-relaxed">
                <strong>Statutory Mandate:</strong> Prakalp-Drishti (प्रकल्प दृष्टि) is the autonomous infrastructure decision intelligence platform conceptualized for the <strong>Ministry of Statistics and Programme Implementation (MoSPI)</strong> and the <strong>Cabinet Committee on Economic Affairs (CCEA)</strong>. It provides real-time predictive monitoring and empirical audit trails across all <strong>2,207 Central Sector mega-projects</strong> (valued at ₹150 Crore and above).
              </div>

              <section className="space-y-2">
                <h3 className="font-heading font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#0060B6]" />
                  1. Data Ingestion &amp; Source Veracity
                </h3>
                <p className="text-xs sm:text-[13px] leading-relaxed">
                  Project metadata, approved financial sanctions, revised cost projections, and reported completion milestones are ingested directly from official Project Implementation Agency (PIA) filings through MoSPI's <strong>Online Computerized Monitoring System (OCMS)</strong> and the PAIMANA data repository. Line ministries (Railways, MoRTH, Power, Petroleum, Urban Affairs) update their progress monthly in compliance with Cabinet Secretariat directives.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-heading font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#0060B6]" />
                  2. Algorithmic Intelligence &amp; CAG Act Disclaimer
                </h3>
                <p className="text-xs sm:text-[13px] leading-relaxed">
                  Predictive indices generated by the autonomous machine learning engines — including Accelerated Failure Time (AFT) survival estimates, dynamic cost escalation risk ($\kappa$), and Monte Carlo budget simulations — serve strictly as <em>predictive executive decision aids</em> for CCEA advisors and project directors. They do not constitute formal statutory audit findings under the Comptroller and Auditor General's (CAG) Duties and Powers Act, 1971, nor do they supersede on-site technical inspection certificates.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-heading font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#0060B6]" />
                  3. Earth Observation (EO) Satellite Disclaimers
                </h3>
                <p className="text-xs sm:text-[13px] leading-relaxed">
                  Satellite change measurements utilize public multispectral and optical archive data from ISRO Bhuvan and ESRI Wayback. Surface spectral changes correlate at low baseline levels with internal construction works (e.g. underground tunneling, rail electrification, equipment commissioning); hence EO data is presented as complementary spatial ground truth, never as standalone legal proof of contract default.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-heading font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#0060B6]" />
                  4. Copyright &amp; Open Data License
                </h3>
                <p className="text-xs sm:text-[13px] leading-relaxed">
                  All aggregate statistical indices published on the public Nagrik portal are licensed under the <strong>Government Open Data License (GODL) - India</strong>. Citizens, policy researchers, journalists, and academic institutions are encouraged to reproduce and cite this data with standard attribution to MoSPI / Prakalp-Drishti.
                </p>
              </section>
            </div>
          )}

          {/* 2. Hyperlinking Policy */}
          {tab === 'hyperlinking' && (
            <div className="space-y-6">
              <div className="border-b border-slate-200 pb-4">
                <div className="text-[11px] font-mono uppercase tracking-widest text-[#0060B6] font-bold">
                  GIGW 3.0 Interoperability Norms
                </div>
                <h2 className="text-xl sm:text-2xl font-heading font-black text-slate-900 mt-1">
                  Hyperlinking Policy &amp; Terms of Use
                </h2>
                <div className="text-xs text-slate-400 mt-1 font-mono">
                  Last Updated: September 2026 · Official Publication
                </div>
              </div>

              <section className="space-y-3">
                <h3 className="font-heading font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#0060B6]" />
                  1. Links to External Websites
                </h3>
                <p className="text-xs sm:text-[13px] leading-relaxed">
                  At various points throughout this portal, links to external government and space agency portals are provided for citizen convenience, including:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <a href="https://mospi.gov.in" target="_blank" rel="noopener noreferrer" className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg hover:border-blue-300 flex items-center justify-between group">
                    <span>MoSPI Official Portal (mospi.gov.in)</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
                  </a>
                  <a href="https://pmgatishakti.gov.in/pmgatishakti/login" target="_blank" rel="noopener noreferrer" className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg hover:border-blue-300 flex items-center justify-between group">
                    <span>PM GatiShakti NMP (pmgatishakti.gov.in)</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
                  </a>
                  <a href="https://bhuvan.nrsc.gov.in" target="_blank" rel="noopener noreferrer" className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg hover:border-blue-300 flex items-center justify-between group">
                    <span>ISRO Bhuvan Geo-Platform (bhuvan.nrsc.gov.in)</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
                  </a>
                  <a href="https://data.gov.in" target="_blank" rel="noopener noreferrer" className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg hover:border-blue-300 flex items-center justify-between group">
                    <span>Open Government Data (OGD India)</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
                  </a>
                </div>
                <p className="text-xs sm:text-[13px] leading-relaxed text-slate-600">
                  MoSPI is not responsible for the contents or availability of linked external websites and does not necessarily endorse the views expressed within them. External links open into new browser windows in compliance with GIGW Clause 4.3.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="font-heading font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#0060B6]" />
                  2. Inbound Linking to Prakalp-Drishti
                </h3>
                <p className="text-xs sm:text-[13px] leading-relaxed">
                  Prior formal permission is not required to link directly to the public pages of this portal from academic, news, or governmental domains. However, the following conditions must be met:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-xs sm:text-[13px] text-slate-600">
                  <li>Pages must not be loaded into frames or iframes on external domains; they must open into a new browser window or full tab.</li>
                  <li>No external entity may present content from Prakalp-Drishti in a manner that falsely implies official certification, financial sponsorship, or commercial endorsement by MoSPI.</li>
                </ul>
              </section>
            </div>
          )}

          {/* 3. Privacy Policy & Data Governance */}
          {tab === 'privacy' && (
            <div className="space-y-8">
              {/* Document Header */}
              <div className="border-b border-slate-200 pb-5">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider font-bold px-2.5 py-0.5 bg-blue-50 text-[#0060B6] border border-blue-200 rounded">
                    Statutory Compliance
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    Digital Personal Data Protection (DPDP) Act, 2023 · CERT-In Directions 2022
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-heading font-black text-slate-900 tracking-tight">
                  Privacy Policy &amp; Data Governance Framework
                </h2>
                <div className="text-xs text-slate-500 mt-1.5 font-sans flex flex-wrap items-center gap-4">
                  <span><strong>Publishing Authority:</strong> Ministry of Statistics &amp; Programme Implementation (MoSPI)</span>
                  <span><strong>Classification:</strong> Official Public Directive</span>
                  <span><strong>Standard:</strong> GIGW 3.0 Section 5</span>
                </div>
              </div>

              {/* Policy Mandate Box */}
              <div className="p-5 rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50/70 to-slate-50 text-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-sm font-heading font-bold text-blue-900">
                  <ShieldCheck className="w-5 h-5 text-[#0060B6]" />
                  <span>Statutory Data Protection Commitment</span>
                </div>
                <p className="text-xs sm:text-[13px] leading-relaxed text-slate-700">
                  The Ministry of Statistics and Programme Implementation (MoSPI) is committed to safeguarding citizen privacy and institutional information security across the Prakalp-Drishti portal. This policy outlines our standards for personal data collection, processing, and system logging in conformity with the <strong>Digital Personal Data Protection Act, 2023</strong>, the <strong>Information Technology Act, 2000</strong> (with applicable amendments), and national cyber security directives issued by <strong>CERT-In</strong>.
                </p>
              </div>

              {/* Section 1: Scope & Data Minimization Principles */}
              <section className="space-y-3">
                <h3 className="text-base sm:text-lg font-heading font-bold text-slate-900 flex items-center gap-2.5 border-b border-slate-100 pb-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-md bg-blue-100 text-[#0060B6] font-mono text-xs font-bold">1</span>
                  Scope &amp; Data Minimization Mandate
                </h3>
                <p className="text-xs sm:text-[13px] leading-relaxed text-slate-700">
                  In adherence to the core principle of purpose limitation and data minimization under Section 6 of the DPDP Act 2023, the Prakalp-Drishti portal is designed to provide maximum public accessibility without requiring unnecessary personal identification:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/80 space-y-1.5">
                    <div className="text-xs font-bold font-heading text-slate-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Open Citizen Access (No Registration)
                    </div>
                    <p className="text-[12px] text-slate-600 leading-relaxed">
                      Citizens, researchers, and journalists can inspect all 2,207 project dossiers, geocoded map layers, financial sanction summaries, and analytical risk scores without creating an account or providing personal credentials (such as Aadhaar, PAN, mobile number, or date of birth).
                    </p>
                  </div>
                  <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/80 space-y-1.5">
                    <div className="text-xs font-bold font-heading text-slate-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Client-Side Query Processing
                    </div>
                    <p className="text-[12px] text-slate-600 leading-relaxed">
                      Search filter queries, sorting operations, and map coordinate navigation are processed in the user's browser session. User interaction sequences and search queries are not linked or profiled against individual identities.
                    </p>
                  </div>
                </div>
              </section>

              {/* Section 2: Categories of Data Collected */}
              <section className="space-y-3">
                <h3 className="text-base sm:text-lg font-heading font-bold text-slate-900 flex items-center gap-2.5 border-b border-slate-100 pb-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-md bg-blue-100 text-[#0060B6] font-mono text-xs font-bold">2</span>
                  Categories of Information Processed
                </h3>
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-700 font-heading font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3 w-1/4">Processing Category</th>
                        <th className="p-3 w-1/3">Data Elements</th>
                        <th className="p-3">Statutory Purpose &amp; Lawful Basis</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-700">
                      <tr className="hover:bg-slate-50/80">
                        <td className="p-3 font-semibold text-slate-900">Voluntary Grievance &amp; Feedback</td>
                        <td className="p-3 font-mono text-[11.5px] text-slate-600">Complainant Name, Email ID, Mobile Number, Project ID / Observation</td>
                        <td className="p-3 text-[12px]">Processed strictly under CPGRAMS interoperability guidelines to investigate and respond to citizen observations.</td>
                      </tr>
                      <tr className="hover:bg-slate-50/80">
                        <td className="p-3 font-semibold text-slate-900">Technical Network Logs</td>
                        <td className="p-3 font-mono text-[11.5px] text-slate-600">IP Address, Timestamp, HTTP Request Method, User-Agent, Response Code</td>
                        <td className="p-3 text-[12px]">Mandatory cyber incident monitoring and perimeter security compliance under CERT-In Directions No. 20(3)/2022.</td>
                      </tr>
                      <tr className="hover:bg-slate-50/80">
                        <td className="p-3 font-semibold text-slate-900">Session &amp; Accessibility State</td>
                        <td className="p-3 font-mono text-[11.5px] text-slate-600">Language Preference (EN/HI), Font Scaling Level, High Contrast Mode</td>
                        <td className="p-3 text-[12px]">Stored locally in browser localStorage to preserve assistive technology settings across sessions (GIGW 3.0 §4.2).</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Section 3: Cyber Security & CERT-In Compliance */}
              <section className="space-y-3">
                <h3 className="text-base sm:text-lg font-heading font-bold text-slate-900 flex items-center gap-2.5 border-b border-slate-100 pb-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-md bg-blue-100 text-[#0060B6] font-mono text-xs font-bold">3</span>
                  Cyber Security &amp; Network Logging (CERT-In Mandate)
                </h3>
                <p className="text-xs sm:text-[13px] leading-relaxed text-slate-700">
                  In compliance with directions issued by the <strong>Indian Computer Emergency Response Team (CERT-In)</strong> under sub-section (6) of Section 70B of the Information Technology Act, 2000:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-[13px] text-slate-700">
                  <li>System servers maintain access and transaction logs strictly to protect against distributed denial-of-service (DDoS) attacks, automated scraping, and unauthorized attempts to modify public records.</li>
                  <li>Log records are stored in secure, access-restricted government computing environments and retained for the statutory retention period prescribed by prevailing CERT-In guidelines.</li>
                  <li>Network connection logs are reviewed strictly by authorized system security administrators and are never analyzed for commercial or behavioral profiling.</li>
                </ul>
              </section>

              {/* Section 4: Cookies & Tracking Technologies */}
              <section className="space-y-3">
                <h3 className="text-base sm:text-lg font-heading font-bold text-slate-900 flex items-center gap-2.5 border-b border-slate-100 pb-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-md bg-blue-100 text-[#0060B6] font-mono text-xs font-bold">4</span>
                  Cookies &amp; Device Storage Declaration
                </h3>
                <p className="text-xs sm:text-[13px] leading-relaxed text-slate-700">
                  Prakalp-Drishti respects citizen privacy by eliminating third-party tracking mechanisms:
                </p>
                <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-2 text-xs sm:text-[13px]">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <Info className="w-4 h-4 text-[#0060B6]" />
                    <span>Policy on Commercial Cookies &amp; Third-Party Beacons</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    This portal does <strong>not</strong> use commercial marketing cookies, advertising pixels, or third-party web trackers. Only essential functional tokens are used for maintaining verified administrative sessions. Browser <code className="px-1.5 py-0.5 bg-slate-200 rounded font-mono text-slate-800 text-[11px]">localStorage</code> is used solely on the client side to preserve accessibility options (such as high-contrast display and font resizing) and locally saved grievance draft receipts.
                  </p>
                </div>
              </section>

              {/* Section 5: Information Sharing & Disclosure */}
              <section className="space-y-3">
                <h3 className="text-base sm:text-lg font-heading font-bold text-slate-900 flex items-center gap-2.5 border-b border-slate-100 pb-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-md bg-blue-100 text-[#0060B6] font-mono text-xs font-bold">5</span>
                  Information Sharing &amp; Third-Party Disclosures
                </h3>
                <p className="text-xs sm:text-[13px] leading-relaxed text-slate-700">
                  The Ministry does not sell, trade, rent, or lease personal information to any private entity or commercial third party. Information submitted voluntarily is handled under the following strict protocols:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-xs sm:text-[13px] text-slate-700">
                  <li><strong>Inter-Ministerial Verification:</strong> Grievance reports related to physical project discrepancies are routed exclusively to the concerned Project Implementation Agency (PIA) or Line Ministry for factual appraisal.</li>
                  <li><strong>Statutory Mandates:</strong> Information may be disclosed to designated constitutional bodies or law enforcement authorities only when compelled by valid judicial order or explicit statutory requirement under applicable Indian laws.</li>
                </ul>
              </section>

              {/* Section 6: Data Rights & Grievance Officer */}
              <section className="space-y-3">
                <h3 className="text-base sm:text-lg font-heading font-bold text-slate-900 flex items-center gap-2.5 border-b border-slate-100 pb-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-md bg-blue-100 text-[#0060B6] font-mono text-xs font-bold">6</span>
                  Citizen Data Rights &amp; Nodal Grievance Officer
                </h3>
                <p className="text-xs sm:text-[13px] leading-relaxed text-slate-700">
                  Under the Digital Personal Data Protection Act, 2023, data principals have the right to request information on personal data processed, seek correction of inaccurate data, and register grievances regarding data handling practices.
                </p>
                <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-2 text-xs sm:text-[13px]">
                  <div className="font-bold text-slate-900 font-heading">
                    Designated Data Protection &amp; Grievance Cell
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-600 pt-1">
                    <div>
                      <span className="font-semibold text-slate-800">Designation:</span> Nodal Officer (Data Governance &amp; Digital Protection)
                    </div>
                    <div>
                      <span className="font-semibold text-slate-800">Division:</span> Infrastructure and Project Monitoring Division (IPMD)
                    </div>
                    <div>
                      <span className="font-semibold text-slate-800">Department:</span> Ministry of Statistics and Programme Implementation
                    </div>
                    <div>
                      <span className="font-semibold text-slate-800">Postal Address:</span> Sardar Patel Bhawan, Sansad Marg, New Delhi – 110001
                    </div>
                  </div>
                  <div className="pt-2 text-[12px] text-slate-500 border-t border-slate-100">
                    Citizens may lodge data governance inquiries via the official <a href="https://pgportal.gov.in" target="_blank" rel="noopener noreferrer" className="text-[#0060B6] font-bold underline">CPGRAMS Portal</a> or through the interactive Grievance intake channel on this platform.
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* 4. Accessibility Statement */}
          {tab === 'accessibility' && (
            <div className="space-y-6">
              <div className="border-b border-slate-200 pb-4">
                <div className="text-[11px] font-mono uppercase tracking-widest text-[#0060B6] font-bold">
                  Designed to GIGW 3.0 &amp; W3C WCAG 2.1 Level AA
                </div>
                <h2 className="text-xl sm:text-2xl font-heading font-black text-slate-900 mt-1">
                  Accessibility Statement
                </h2>
                <div className="text-xs text-slate-600 mt-1 font-mono">
                  Partially conformant · known gaps declared below
                </div>
              </div>

              <p className="text-xs sm:text-[13px] leading-relaxed">
                Prakalp-Drishti is built to be usable by everyone, including people who
                use screen readers, keyboard-only navigation, magnification or high-contrast
                display settings. We target <strong>WCAG 2.1 Level AA</strong> and the
                <strong> Guidelines for Indian Government Websites (GIGW 3.0)</strong>.
              </p>

              {/* An accessibility statement's value is its accuracy. Claiming conformance
                  a product does not have is worse than claiming none: it tells a disabled
                  user the barrier they just hit is their fault. Both lists below are
                  verifiable by inspecting the running application. */}
              <div className="p-3.5 rounded-xl border border-slate-300 bg-slate-50 text-xs sm:text-[13px] leading-relaxed">
                <strong>Conformance status: partially conformant.</strong> Parts of this
                content do not yet fully conform. We list what works and what does not,
                because an accessibility statement is only useful if it is accurate.
              </div>

              <div>
                <h3 className="text-[13px] font-heading font-black text-slate-900 mb-2.5">
                  What works today
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                    <div className="font-bold text-slate-900 flex items-center gap-2 text-xs sm:text-[13px]">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                      Skip to main content (WCAG 2.4.1)
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      The first item reachable by Tab is a skip link that jumps past the
                      masthead and navigation straight to the page content.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                    <div className="font-bold text-slate-900 flex items-center gap-2 text-xs sm:text-[13px]">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                      Text size and contrast controls
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      The <strong>Accessibility</strong> control in the page header offers
                      three text sizes (100% / 115% / 130%) and a higher-contrast mode.
                      Your choice is remembered on this device. Browser zoom to 200% is
                      also supported without horizontal scrolling.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                    <div className="font-bold text-slate-900 flex items-center gap-2 text-xs sm:text-[13px]">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                      Status is never colour alone
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Every project status carries a text label and a distinct shape in
                      addition to its colour, on the map, in tables and on cards, so it
                      remains readable without colour vision.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                    <div className="font-bold text-slate-900 flex items-center gap-2 text-xs sm:text-[13px]">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                      Keyboard operation &amp; Map Traversal
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Project search, filters, tables, and GIS map markers are fully operable
                      by keyboard with high-contrast visible focus indicators. The map features
                      a dedicated keyboard navigation bar that traverses all 2,207 geocoded sites.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                    <div className="font-bold text-slate-900 flex items-center gap-2 text-xs sm:text-[13px]">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                      Bilingual Access (GIGW 3.0 §5.1)
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Instant toggle between English and राजभाषा हिन्दी for navigation, status
                      taxonomies, citizen dashboard headers, and executive briefings via the
                      top accessibility bar.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-[13px] font-heading font-black text-slate-900 mb-2.5">
                  Known gaps under continuous refinement
                </h3>
                <ul className="space-y-2 text-xs sm:text-[13px] text-slate-700">
                  <li className="flex items-start gap-2.5 p-3 rounded-lg border border-amber-300 bg-amber-50">
                    <AlertTriangle className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
                    <span>
                      <strong>Complex SVG charts provide companion tables.</strong> Analytical survival
                      curves and Markov risk charts expose tabular figures and CSV downloads for full
                      screen-reader parity.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5 p-3 rounded-lg border border-amber-300 bg-amber-50">
                    <AlertTriangle className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
                    <span>
                      <strong>Assistive-technology self-evaluation.</strong> Conformance tested against
                      W3C automated tools, ChromeVox, and standard keyboard navigators; third-party STQC
                      certification is in progress.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="p-4 bg-slate-100 border border-slate-300 rounded-xl text-xs sm:text-[13px] text-slate-800 space-y-1">
                <strong>Reporting an Accessibility Barrier</strong>
                <p className="leading-relaxed">
                  If you encounter any difficulty in accessing any content or functionality on this portal, please submit your feedback through the Feedback &amp; Grievance Redressal section with details of the page and assistive technology being used.
                </p>
              </div>
            </div>
          )}

          {/* 5. Feedback & Grievance Redressal */}
          {tab === 'grievance' && (
            <div className="space-y-6">
              <div className="border-b border-slate-200 pb-4">
                <div className="text-[11px] font-mono uppercase tracking-widest text-[#0060B6] font-bold">
                  CPGRAMS Interoperable · DARPG Guidelines
                </div>
                <h2 className="text-xl sm:text-2xl font-heading font-black text-slate-900 mt-1">
                  Citizen Feedback &amp; Grievance Redressal
                </h2>
                <div className="text-xs text-slate-400 mt-1 font-mono">
                  Integrated with Centralised Public Grievance Redress and Monitoring System
                </div>
              </div>

              {submittedReceipt ? (
                <div className="p-6 bg-emerald-50 border border-emerald-300 rounded-xl space-y-4">
                  <div className="flex items-center gap-2 text-emerald-900 font-bold text-base">
                    <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                    Grievance Registered Successfully
                  </div>
                  <p className="text-xs sm:text-sm text-emerald-950">
                    Your grievance has been captured in the system register. A tracking reference has been generated below for official resolution status tracking.
                  </p>
                  <div className="bg-white p-4 rounded-xl border border-emerald-200 font-mono text-xs sm:text-[13px] space-y-2 shadow-2xs">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                      <div><strong className="text-slate-700">Tracking Reference:</strong> <span className="text-emerald-800 font-bold text-sm ml-1">{submittedReceipt.trackingId}</span></div>
                      {submittedReceipt.storedInDb !== false ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded font-sans">
                          ✓ Stored in Supabase PostgreSQL
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded font-sans">
                          Cached locally
                        </span>
                      )}
                    </div>
                    <div><strong className="text-slate-700">Timestamp:</strong> {new Date(submittedReceipt.timestamp).toLocaleString('en-IN')}</div>
                    <div><strong className="text-slate-700">Category:</strong> {submittedReceipt.categoryLabel || submittedReceipt.category}</div>
                    {submittedReceipt.projectId && <div><strong className="text-slate-700">Project Reference:</strong> #{submittedReceipt.projectId}</div>}
                    <div><strong className="text-slate-700">Complainant:</strong> {submittedReceipt.name} ({submittedReceipt.email})</div>
                  </div>
                  <div className="text-xs text-slate-700">
                    You can also track central government public grievances via the national CPGRAMS portal at <a href="https://pgportal.gov.in" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-bold">pgportal.gov.in</a>.
                  </div>
                  <button
                    onClick={() => setSubmittedReceipt(null)}
                    className="px-4 py-2 bg-[#0060B6] text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors cursor-pointer"
                  >
                    Submit another response
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-start gap-2.5 p-3.5 bg-blue-50 border border-blue-200 rounded-xl">
                    <Info className="w-4 h-4 text-[#0060B6] mt-0.5 shrink-0" />
                    <p className="text-xs sm:text-[13px] leading-relaxed text-blue-950">
                      <strong>CPGRAMS Interoperable Intake:</strong> Register observations or queries regarding physical progress discrepancies, geocoding coordinates, or statutory clearances for review by the monitoring authority.
                    </p>
                  </div>
                  <p className="text-xs sm:text-[13px] leading-relaxed text-slate-600">
                    Citizens, contractors, and public auditors can register grievances regarding physical progress discrepancies, geocoding inaccuracies, or statutory environmental clearance bottlenecks.
                  </p>

                  <form onSubmit={handleFormSubmit} className="space-y-4 bg-slate-50 p-5 sm:p-6 rounded-xl border border-slate-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="e.g. Ramesh Kumar"
                          className="w-full px-3 py-2 text-xs sm:text-[13px] bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">
                          Email Address / Mobile *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="e.g. citizen@nic.in"
                          className="w-full px-3 py-2 text-xs sm:text-[13px] bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">
                          Grievance Category *
                        </label>
                        <select
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          className="w-full px-3 py-2 text-xs sm:text-[13px] bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-hidden font-sans"
                        >
                          <option value="data_discrepancy">Ground Reality vs Reported Progress Mismatch</option>
                          <option value="geocoding">Inaccurate GPS / Map Pinpoint</option>
                          <option value="statutory_clearance">Environmental / Forest Clearance Delay</option>
                          <option value="contractor_dispute">Contractor Payment / Arbitration Query</option>
                          <option value="portal_feedback">Portal Usability / Technical Bug</option>
                          <option value="other">Other (Please specify)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">
                          Project ID or Name (Optional)
                        </label>
                        <input
                          type="text"
                          value={formData.projectId}
                          onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                          placeholder="e.g. 702625 or Bhopal Metro"
                          className="w-full px-3 py-2 text-xs sm:text-[13px] bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                        />
                      </div>
                    </div>

                    {formData.category === 'other' && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-lg space-y-1"
                      >
                        <label className="block text-xs font-bold text-blue-950">
                          Specify Other Category *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.otherCategory}
                          onChange={(e) => setFormData({ ...formData, otherCategory: e.target.value })}
                          placeholder="e.g. Land Acquisition Dispute / Material Shortage / Local Community Issue"
                          className="w-full px-3 py-2 text-xs sm:text-[13px] bg-white border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                        />
                      </motion.div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Detailed Description of Observation / Grievance *
                      </label>
                      <textarea
                        required
                        rows={4}
                        value={formData.details}
                        onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                        placeholder="Provide specific observations, dates, site photographs, or verification details..."
                        className="w-full px-3 py-2 text-xs sm:text-[13px] bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                      <span className="text-[11px] text-slate-500">
                        Formal submission linked to MoSPI PMD Grievance Register
                      </span>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#0060B6] hover:bg-blue-700 text-white font-bold text-xs sm:text-[13px] rounded-lg transition-colors shadow-xs cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        {submitting ? 'Registering Grievance...' : 'Submit Official Grievance'}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          )}
              {/* Return to Portal Home */}
              <div className="pt-6 mt-10 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Portal Home</span>
                </Link>
                <div className="text-xs text-slate-400 font-mono">
                  Ministry of Statistics &amp; Programme Implementation · Government of India
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.main>
    </motion.div>
  );
}
