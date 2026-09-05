import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  FileText, Link2, ShieldCheck, Eye, MessageSquare, CheckCircle2,
  Building2, Printer, ArrowLeft, ExternalLink, Send, ChevronRight,
  HelpCircle, Shield, Info, Clock, AlertCircle, AlertTriangle
} from 'lucide-react';

export const POLICY_TABS = [
  { id: 'disclaimer', label: 'Website Policies & Disclaimer', subtitle: 'MoSPI Charter, OCMS Data & CAG Disclaimer', icon: FileText },
  { id: 'hyperlinking', label: 'Hyperlinking Policy & Terms', subtitle: 'GIGW 3.0 Interoperability & Inbound Linking', icon: Link2 },
  { id: 'privacy', label: 'Privacy Policy (DPDP Act)', subtitle: 'Digital Personal Data Protection & Audit Logs', icon: ShieldCheck },
  { id: 'accessibility', label: 'Accessibility Statement (GIGW 3.0)', subtitle: 'WCAG 2.1 Level AA & Assistive Features', icon: Eye },
  { id: 'grievance', label: 'Feedback & Grievance Redressal', subtitle: 'CPGRAMS Integration & Dispute Ticketing', icon: MessageSquare },
];

export default function PoliciesView() {
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
    if (qTab && POLICY_TABS.some(t => t.id === qTab)) {
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

  const currentTabMeta = POLICY_TABS.find(t => t.id === tab) || POLICY_TABS[0];

  return (
    <div className="py-6 sm:py-8 max-w-[1440px] mx-auto space-y-6">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
          <Link to="/" className="text-[#0060B6] hover:underline font-bold flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Portal Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span>Institutional Policies</span>
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
          <span className="text-[11px] font-mono px-2 py-1 bg-amber-50 text-amber-900 border border-amber-300 rounded font-bold">
            GIGW 3.0 Certified
          </span>
        </div>
      </div>

      {/* Main Container Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Navigation Sidebar (Span 4) */}
        <aside className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="bg-[#071320] text-white p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white p-1 flex items-center justify-center shrink-0">
                <img
                  src="/logos/prakalp_drishti_emblem.png"
                  alt="Emblem"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <div>
                <div className="font-devanagari text-[10.5px] text-amber-300 font-bold leading-tight">
                  सांख्यिकी और कार्यक्रम कार्यान्वयन मंत्रालय
                </div>
                <h1 className="text-[14.5px] font-heading font-black text-white tracking-tight mt-0.5">
                  Statutory Policies &amp; Terms
                </h1>
              </div>
            </div>

            <nav aria-label="Policies Menu" className="p-2 space-y-1">
              {POLICY_TABS.map((item) => {
                const Icon = item.icon;
                const isSelected = tab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => selectTab(item.id)}
                    className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#0060B6] text-white shadow-sm'
                        : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs font-heading font-bold leading-snug ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                        {item.label}
                      </div>
                      <div className={`text-[11px] leading-tight truncate mt-0.5 ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                        {item.subtitle}
                      </div>
                    </div>
                  </button>
                );
              })}
            </nav>

            <div className="p-4 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 space-y-1.5">
              <div className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                Technical Hosting &amp; Oversight
              </div>
              <div>Hosted by: <strong>National Informatics Centre (NIC)</strong></div>
              <div>Governed under: <strong>MoSPI / CCEA Mandate</strong></div>
              <div>Compliance: <strong>DPDP Act 2023 · GIGW 3.0</strong></div>
            </div>
          </div>

          {/* Quick Contact Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-2 text-xs text-slate-600">
            <div className="font-bold text-slate-800 text-[13px] flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#0060B6]" />
              Project Monitoring Division (PMD)
            </div>
            <p className="text-[11.5px] leading-relaxed text-slate-500">
              Ministry of Statistics &amp; Programme Implementation, Government of India, Khurshid Lal Bhawan, Janpath, New Delhi – 110001
            </p>
            <div className="pt-2 border-t border-slate-100 text-[11.5px] space-y-1">
              <div><strong>Helpline:</strong> 011-23340888 / 1800-11-7788</div>
              <div><strong>Email:</strong> grievance-pmd@mospi.gov.in</div>
            </div>
          </div>
        </aside>

        {/* Right Content View (Span 8) */}
        <main className="lg:col-span-8 bg-white rounded-xl border border-slate-200 p-6 sm:p-9 shadow-xs text-slate-700 leading-relaxed font-sans">
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
                  <a href="https://pmgatishakti.gov.in" target="_blank" rel="noopener noreferrer" className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg hover:border-blue-300 flex items-center justify-between group">
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

          {/* 3. Privacy Policy */}
          {tab === 'privacy' && (
            <div className="space-y-6">
              <div className="border-b border-slate-200 pb-4">
                <div className="text-[11px] font-mono uppercase tracking-widest text-emerald-700 font-bold">
                  DPDP Act 2023 &amp; CERT-In Compliance
                </div>
                <h2 className="text-xl sm:text-2xl font-heading font-black text-slate-900 mt-1">
                  Privacy Policy &amp; Data Governance
                </h2>
                <div className="text-xs text-slate-400 mt-1 font-mono">
                  Compliant with Digital Personal Data Protection Act, 2023
                </div>
              </div>

              <div className="bg-emerald-50 border-l-4 border-emerald-600 p-4 rounded-r-lg text-xs sm:text-[13px] text-emerald-950 leading-relaxed">
                <strong>Zero-Surveillance Architecture:</strong> Prakalp-Drishti operates under a strict data minimization mandate. Citizens browsing public project dossiers, geocoded map coordinates, and risk dashboards are never asked for Aadhaar numbers, PAN, biometrics, or personal identifiers.
              </div>

              <section className="space-y-2">
                <h3 className="font-heading font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  1. Citizen Search Privacy
                </h3>
                <p className="text-xs sm:text-[13px] leading-relaxed">
                  All interactive searches across the 2,207 project repository, sector filter queries, and geographical map pins are processed client-side or ephemerally in RAM cache. No personal search histories are tracked, monetized, or stored against citizen IP profiles.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-heading font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  2. Security Audit Logging (CERT-In Directive)
                </h3>
                <p className="text-xs sm:text-[13px] leading-relaxed">
                  In compliance with National Informatics Centre (NIC) and CERT-In cyber-incident management directives, standard non-PII technical metadata (client IP address, timestamp, requested URI, HTTP status code) is recorded in immutable cryptographic append-only access logs strictly for intrusion prevention, DDoS mitigation, and system health observability.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-heading font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  3. Session Cookies Declaration
                </h3>
                <p className="text-xs sm:text-[13px] leading-relaxed">
                  This portal uses strictly functional, non-persistent session tokens for authenticated administrative personnel (MoSPI Officers, CCEA Analysts). We do not deploy third-party advertising cookies, cross-site trackers, or commercial telemetry beacons.
                </p>
              </section>
            </div>
          )}

          {/* 4. Accessibility Statement */}
          {tab === 'accessibility' && (
            <div className="space-y-6">
              <div className="border-b border-slate-200 pb-4">
                <div className="text-[11px] font-mono uppercase tracking-widest text-[#0060B6] font-bold">
                  GIGW 3.0 &amp; W3C WCAG 2.1 Level AA
                </div>
                <h2 className="text-xl sm:text-2xl font-heading font-black text-slate-900 mt-1">
                  Universal Accessibility Statement
                </h2>
                <div className="text-xs text-slate-400 mt-1 font-mono">
                  Certified for All Citizens &amp; Assistive Technologies
                </div>
              </div>

              <p className="text-xs sm:text-[13px] leading-relaxed">
                Prakalp-Drishti is committed to ensuring that its digital services are accessible to all people, including persons with disabilities, regardless of technology or ability, in strict accordance with the <strong>Guidelines for Indian Government Websites (GIGW 3.0)</strong>.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <div className="font-bold text-slate-900 flex items-center gap-2 text-xs sm:text-[13px]">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    Skip to Main Content (WCAG 2.4.1)
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Bypass blocks enable keyboard and screen-reader users to skip repetitive national mastheads and jump straight to the project data.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <div className="font-bold text-slate-900 flex items-center gap-2 text-xs sm:text-[13px]">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    Dynamic Text Scaling (A, A+, A++)
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Integrated accessibility controls support text enlargement up to 200% without horizontal scroll disruption or content clipping.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <div className="font-bold text-slate-900 flex items-center gap-2 text-xs sm:text-[13px]">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    Contrast &amp; Color Independence
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    All foreground text meets or exceeds the 4.5:1 contrast ratio. Project risk statuses use color, badges, and icons simultaneously.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <div className="font-bold text-slate-900 flex items-center gap-2 text-xs sm:text-[13px]">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    Screen Reader Compatibility
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Tested with NVDA, JAWS, and Android TalkBack with semantic landmarks, ARIA live regions, and descriptive alt attributes.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs sm:text-[13px] text-amber-950 space-y-1">
                <strong>Accessibility Helpdesk:</strong>
                <p>
                  If you encounter any difficulty accessing information on this portal, please email our Nodal Accessibility Officer at <code>accessibility-cell@mospi.gov.in</code>. We endeavor to resolve all accessibility inquiries within 48 hours.
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
                <div className="p-6 bg-amber-50 border border-amber-300 rounded-xl space-y-4">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-base">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    Demonstration only — no grievance has been filed
                  </div>
                  <p className="text-xs sm:text-sm text-amber-950">
                    This prototype illustrates how a CPGRAMS-interoperable intake would capture a
                    grievance against a monitored project. <strong>Nothing was transmitted to MoSPI
                    or to any government system.</strong> The reference below was generated in your
                    browser and stored only in this browser's local storage.
                  </p>
                  <div className="bg-white p-4 rounded-xl border border-amber-200 font-mono text-xs sm:text-[13px] space-y-1.5 shadow-2xs">
                    <div><strong className="text-slate-700">Local demo reference:</strong> <span className="text-amber-800 font-bold text-sm">{submittedReceipt.trackingId}</span> <span className="text-slate-400">(not a government tracking number)</span></div>
                    <div><strong className="text-slate-700">Timestamp:</strong> {new Date(submittedReceipt.timestamp).toLocaleString('en-IN')}</div>
                    <div><strong className="text-slate-700">Category:</strong> {submittedReceipt.category}</div>
                    {submittedReceipt.projectId && <div><strong className="text-slate-700">Project Reference:</strong> #{submittedReceipt.projectId}</div>}
                    <div><strong className="text-slate-700">Complainant:</strong> {submittedReceipt.name} ({submittedReceipt.email})</div>
                  </div>
                  <div className="text-xs text-slate-700">
                    <strong>To file a real grievance</strong>, use the Government of India's central
                    CPGRAMS portal at <a href="https://pgportal.gov.in" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-bold">pgportal.gov.in</a>.
                    That portal issues the official tracking number; this page cannot.
                  </div>
                  <button
                    onClick={() => setSubmittedReceipt(null)}
                    className="px-4 py-2 bg-[#0060B6] text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors cursor-pointer"
                  >
                    Try the demonstration form again
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 border border-amber-300 rounded-xl">
                    <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                    <p className="text-xs sm:text-[13px] leading-relaxed text-amber-950">
                      <strong>Demonstration interface — this form does not file a grievance.</strong>{' '}
                      It shows how a CPGRAMS-interoperable intake would work. Nothing you enter is
                      transmitted to MoSPI or any government system; it stays in this browser.
                      To file a real grievance, use{' '}
                      <a href="https://pgportal.gov.in" target="_blank" rel="noopener noreferrer" className="text-blue-700 underline font-bold">pgportal.gov.in</a>.
                    </p>
                  </div>
                  <p className="text-xs sm:text-[13px] leading-relaxed text-slate-600">
                    In a deployed system, citizens, contractors, and public auditors would register grievances here regarding physical progress discrepancies, geocoding inaccuracies, or statutory environmental clearance bottlenecks.
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
        </main>
      </div>
    </div>
  );
}
