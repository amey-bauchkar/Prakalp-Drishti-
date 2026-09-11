import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert, ShieldCheck, CheckCircle2, Clock, FileText, Camera, MapPin,
  Search, Filter, RefreshCw, AlertTriangle, UserCheck, EyeOff, Lock, ArrowRight,
  ChevronRight, Send, AlertOctagon, Building2, Gavel, FileCheck, Check, X,
  ExternalLink, Calendar, User, Eye, AlertCircle
} from 'lucide-react';
import { useSession } from './LoginGate';
import { getStoredLanguage } from '../src/lib/i18n';

const STATUS_CONFIG = {
  LOGGED: {
    label: 'Action Required',
    labelHi: 'कार्यवाही लंबित',
    badge: 'bg-rose-50 text-rose-800 border-rose-200',
    dot: 'bg-rose-500',
    step: 1
  },
  ASSIGNED: {
    label: 'Officer Assigned',
    labelHi: 'अधिकारी नियुक्त',
    badge: 'bg-amber-50 text-amber-800 border-amber-200',
    dot: 'bg-amber-500',
    step: 2
  },
  INSPECTED: {
    label: 'TPQA Inspection Active',
    labelHi: 'स्थल निरीक्षण सक्रिय',
    badge: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    dot: 'bg-indigo-500',
    step: 3
  },
  ATR_FILED: {
    label: 'Show-Cause / ATR Issued',
    labelHi: 'कारण बताओ / ATR जारी',
    badge: 'bg-sky-50 text-sky-800 border-sky-200',
    dot: 'bg-sky-500',
    step: 4
  },
  RESOLVED: {
    label: 'Redressed & Sealed',
    labelHi: 'निवारित एवं बंद',
    badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    dot: 'bg-emerald-500',
    step: 5
  },
};

const ACTION_TEMPLATES = {
  ASSIGN: [
    'Assigned to MoSPI Infrastructure Monitoring Regional Cell (Northern Zone) for statutory review.',
    'Forwarded to State Executing Agency Project Director Desk for immediate technical clarification.'
  ],
  INSPECT: [
    'Third-Party Quality Assurance (TPQA) inspection team dispatched to site. Mandated 48-hour ground survey.',
    'Regional Executive Engineer deputed for surprise physical verification of reported worksite standstill.'
  ],
  SHOW_CAUSE: [
    'Physical survey confirmed site machinery demobilization without approved suspension notice. Show-cause served under CPWD GCC Clause 2; milestone payout suspended.',
    'Substandard construction quality verified on ground. Formal contractual remediation directive served with 7-day cure period.'
  ],
  RESOLVE: [
    'Site remediation verified by Regional Executive Engineer. Rectification completed to statutory specifications. Grievance closed under CPGRAMS mandate.',
    'Contractor has remobilized required heavy machinery and resumed foundation works. Ground reality verified; docket sealed.'
  ]
};

export default function OfficerGrievanceDeskView({ lang: propLang, onSelectProject }) {
  const session = useSession();
  const [lang, setLang] = useState(() => propLang || getStoredLanguage());
  useEffect(() => { if (propLang) setLang(propLang); }, [propLang]);
  const isHi = lang === 'hi';

  const officerName = session?.username 
    ? `${session.username} (${String(session.role || 'Officer').replace(/_/g, ' ')})`
    : 'Er. R. K. Sharma (Superintending Engineer, MoSPI Regional Cell)';

  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Action Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [actionType, setActionType] = useState('ASSIGN'); // ASSIGN, INSPECT, SHOW_CAUSE, RESOLVE
  const [actionNotes, setActionNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccessToast, setActionSuccessToast] = useState(null);

  const fetchGrievances = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/grievances?limit=100');
      if (!res.ok) throw new Error('Failed to fetch grievance records from central database');
      const data = await res.json();
      setGrievances(Array.isArray(data) ? data : []);
      if (Array.isArray(data) && data.length > 0 && !selectedId) {
        setSelectedId(data[0].trackingId);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error querying database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrievances();
  }, []);

  const filteredGrievances = useMemo(() => {
    return grievances.filter((g) => {
      const gStatus = (g.status || 'LOGGED').toUpperCase();
      if (statusFilter !== 'ALL' && gStatus !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const tid = (g.trackingId || '').toLowerCase();
        const pid = String(g.projectId || '').toLowerCase();
        const cat = (g.categoryLabel || '').toLowerCase();
        const det = (g.details || '').toLowerCase();
        const name = (g.name || '').toLowerCase();
        if (!tid.includes(q) && !pid.includes(q) && !cat.includes(q) && !det.includes(q) && !name.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [grievances, statusFilter, searchQuery]);

  const selectedGrievance = useMemo(() => {
    return grievances.find((g) => g.trackingId === selectedId) || filteredGrievances[0] || null;
  }, [grievances, selectedId, filteredGrievances]);

  // Executive KPI summary
  const metrics = useMemo(() => {
    const total = grievances.length;
    const logged = grievances.filter(g => (g.status || 'LOGGED').toUpperCase() === 'LOGGED').length;
    const assigned = grievances.filter(g => (g.status || '').toUpperCase() === 'ASSIGNED').length;
    const inspected = grievances.filter(g => (g.status || '').toUpperCase() === 'INSPECTED').length;
    const atrFiled = grievances.filter(g => ['ATR_FILED', 'SHOW_CAUSE'].includes((g.status || '').toUpperCase())).length;
    const resolved = grievances.filter(g => (g.status || '').toUpperCase() === 'RESOLVED').length;

    // SLA urgency (< 10 days left assuming 30 days total)
    const now = new Date();
    const urgentCount = grievances.filter(g => {
      if ((g.status || '').toUpperCase() === 'RESOLVED') return false;
      const created = g.createdAt ? new Date(g.createdAt) : now;
      const daysPassed = Math.floor((now - created) / (1000 * 60 * 60 * 24));
      return (30 - daysPassed) <= 10;
    }).length;

    return { total, logged, assigned, inspected, atrFiled, resolved, urgentCount };
  }, [grievances]);

  const handleOpenAction = (type) => {
    setActionType(type);
    const defaults = ACTION_TEMPLATES[type] || [];
    setActionNotes(defaults[0] || '');
    setModalOpen(true);
  };

  const handleExecuteAction = async (e) => {
    e.preventDefault();
    if (!selectedGrievance) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/grievances/${encodeURIComponent(selectedGrievance.trackingId)}/action`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: actionType,
          officer_name: officerName,
          notes: actionNotes.trim()
        })
      });
      if (!res.ok) throw new Error('Action could not be executed on server');
      const data = await res.json();

      // Show toast
      setActionSuccessToast(`Action '${actionType}' successfully applied to ${selectedGrievance.trackingId}`);
      setTimeout(() => setActionSuccessToast(null), 4000);

      // Close modal & refresh
      setModalOpen(false);
      fetchGrievances();
    } catch (err) {
      alert(`Failed to apply action: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const computeSlaBadge = (createdAt, status) => {
    if (status === 'RESOLVED') {
      return { text: 'Resolved', tone: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    }
    const created = createdAt ? new Date(createdAt) : new Date();
    const now = new Date();
    const daysPassed = Math.floor((now - created) / (1000 * 60 * 60 * 24));
    const daysLeft = Math.max(0, 30 - daysPassed);
    if (daysLeft <= 5) {
      return { text: `SLA Critical: ${daysLeft}d left`, tone: 'text-rose-700 bg-rose-50 border-rose-300 font-bold' };
    }
    if (daysLeft <= 12) {
      return { text: `SLA Warning: ${daysLeft}d left`, tone: 'text-amber-700 bg-amber-50 border-amber-300 font-bold' };
    }
    return { text: `SLA: ${daysLeft}d left`, tone: 'text-slate-600 bg-slate-100 border-slate-200' };
  };

  return (
    <div className="space-y-6">
      {/* ── Toast Notification ── */}
      <AnimatePresence>
        {actionSuccessToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-8 z-50 p-4 rounded-xl bg-emerald-900 text-white shadow-xl flex items-center gap-3 border border-emerald-700 text-xs font-heading font-bold"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{actionSuccessToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Console Header Strip ── */}
      <div className="panel p-5 sm:p-6 bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="microlabel text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 font-bold">
                {isHi ? 'सांविधिक निगरानी एवं निवारण' : 'STATUTORY MONITORING & REDRESSAL'}
              </span>
              <span className="microlabel text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                {isHi ? 'डेटाबेस: Supabase PostgreSQL' : 'Database: Supabase PostgreSQL'}
              </span>
            </div>
            <h2 className="text-xl font-heading font-black text-gov-navy mt-1">
              {isHi ? 'नागरिक सतर्कता एवं शिकायत निवारण पटल' : 'Nagrik Vigilance & Grievance Redressal Desk'}
            </h2>
            <p className="text-xs text-gov-muted mt-0.5 max-w-3xl">
              {isHi
                ? 'नागरिकों एवं व्हिसलब्लोअर द्वारा दर्ज जमीनी अवलोकनों की समीक्षा करें, TPQA तकनीकी निरीक्षण आदेश जारी करें और CPGRAMS 30-दिवसीय वैधानिक समयसीमा के भीतर ATR दर्ज करें।'
                : 'Centralised Public Grievance Redress and Monitoring System (CPGRAMS) 30-day statutory SLA enforcement console for MoSPI Central Sector Mega-Projects.'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={fetchGrievances}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gov-navy bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg cursor-pointer transition-colors shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-gov-accent' : ''}`} />
              <span>{isHi ? 'रिफ्रेश करें' : 'Refresh Queue'}</span>
            </button>
          </div>
        </div>

        {/* ── Executive KPI Ribbon ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">{isHi ? 'कुल शिकायतें' : 'Total Ingested'}</span>
            <span className="text-lg font-black text-slate-900 font-heading">{metrics.total}</span>
          </div>

          <div className="p-3 rounded-lg bg-rose-50/70 border border-rose-200">
            <span className="text-[10px] uppercase font-bold text-rose-700 block">{isHi ? 'कार्यवाही लंबित' : 'Action Required'}</span>
            <span className="text-lg font-black text-rose-900 font-heading">{metrics.logged}</span>
          </div>

          <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200">
            <span className="text-[10px] uppercase font-bold text-amber-700 block">{isHi ? 'अधिकारी नियुक्त' : 'Under Investigation'}</span>
            <span className="text-lg font-black text-amber-900 font-heading">{metrics.assigned}</span>
          </div>

          <div className="p-3 rounded-lg bg-indigo-50/70 border border-indigo-200">
            <span className="text-[10px] uppercase font-bold text-indigo-700 block">{isHi ? 'TPQA निरीक्षण' : 'TPQA Dispatched'}</span>
            <span className="text-lg font-black text-indigo-900 font-heading">{metrics.inspected}</span>
          </div>

          <div className="p-3 rounded-lg bg-sky-50/70 border border-sky-200">
            <span className="text-[10px] uppercase font-bold text-sky-700 block">{isHi ? 'कारण बताओ / ATR' : 'Show-Cause / ATR'}</span>
            <span className="text-lg font-black text-sky-900 font-heading">{metrics.atrFiled}</span>
          </div>

          <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200">
            <span className="text-[10px] uppercase font-bold text-emerald-700 block">{isHi ? 'निवारित एवं बंद' : 'Sealed & Resolved'}</span>
            <span className="text-lg font-black text-emerald-900 font-heading">{metrics.resolved}</span>
          </div>
        </div>
      </div>

      {/* ── Filter & Search Toolbar ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'LOGGED', 'ASSIGNED', 'INSPECTED', 'ATR_FILED', 'RESOLVED'].map((statusKey) => {
            const isActive = statusFilter === statusKey;
            const cfg = STATUS_CONFIG[statusKey];
            return (
              <button
                key={statusKey}
                type="button"
                onClick={() => setStatusFilter(statusKey)}
                className={`px-3 py-1.5 text-xs font-heading font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-gov-navy text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {statusKey === 'ALL' ? (isHi ? 'सभी' : 'All Complaints') : (isHi ? cfg.labelHi : cfg.label)}
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isHi ? 'ट्रैकिंग आईडी, MoSPI आईडी या कीवर्ड खोजें...' : 'Search tracking ID, project, or keyword...'}
            className="w-full text-xs font-mono pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-[#0060B6] focus:outline-none"
          />
        </div>
      </div>

      {/* ── Main Split View: Queue on Left, Full Dossier on Right ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* ══ Left Column: Grievance Queue ══ */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-heading font-bold text-slate-700 uppercase tracking-wider">
              {isHi ? `प्राथमिकता कतार (${filteredGrievances.length})` : `Grievance Registry Queue (${filteredGrievances.length})`}
            </span>
            {metrics.urgentCount > 0 && (
              <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                {metrics.urgentCount} {isHi ? 'अति आवश्यक' : 'Urgent CPGRAMS SLA'}
              </span>
            )}
          </div>

          {loading ? (
            <div className="panel p-12 text-center text-slate-500 space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-gov-navy" />
              <p className="text-xs font-mono">{isHi ? 'डेटाबेस से शिकायतें लोड हो रही हैं...' : 'Loading citizen grievances from PostgreSQL...'}</p>
            </div>
          ) : filteredGrievances.length === 0 ? (
            <div className="panel p-8 text-center text-slate-500 bg-white rounded-xl border border-slate-200 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <p className="text-xs font-bold text-slate-800">{isHi ? 'कोई शिकायत नहीं मिली' : 'No grievances matching your criteria.'}</p>
              <p className="text-[11px] text-slate-500">{isHi ? 'फिल्टर बदलकर पुनः प्रयास करें।' : 'Try resetting your status or search query.'}</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
              {filteredGrievances.map((g) => {
                const isSelected = selectedGrievance?.trackingId === g.trackingId;
                const statusKey = (g.status || 'LOGGED').toUpperCase();
                const cfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG.LOGGED;
                const sla = computeSlaBadge(g.createdAt, statusKey);

                return (
                  <button
                    key={g.trackingId}
                    type="button"
                    onClick={() => setSelectedId(g.trackingId)}
                    className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer flex flex-col gap-2.5 ${
                      isSelected
                        ? 'bg-blue-50/70 border-[#0060B6] shadow-sm ring-1 ring-[#0060B6]'
                        : 'bg-white hover:bg-slate-50/90 border-slate-200 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-[#0060B6] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {g.trackingId}
                        </span>
                        {g.projectId && (
                          <span className="font-mono text-[11px] text-slate-600 font-bold">
                            #{g.projectId}
                          </span>
                        )}
                        {g.isAnonymous && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-emerald-300 font-bold flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" />
                            DPDP Protected
                          </span>
                        )}
                      </div>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${cfg.badge}`}>
                        {isHi ? cfg.labelHi : cfg.label}
                      </span>
                    </div>

                    <div>
                      <div className="text-xs font-bold text-slate-900 line-clamp-1">
                        {g.categoryLabel || g.category}
                      </div>
                      <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5 leading-snug">
                        {g.details}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono pt-2 border-t border-slate-100 text-slate-500">
                      <span>{g.createdAt ? new Date(g.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recent'}</span>
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${sla.tone}`}>
                        {sla.text}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ══ Right Column: Selected Grievance Dossier & Action Console ══ */}
        <div className="lg:col-span-7 space-y-4">
          {selectedGrievance ? (
            <div className="panel p-6 bg-white border border-slate-200 shadow-xs space-y-6">
              
              {/* Dossier Header */}
              <div className="pb-5 border-b border-slate-100 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-mono font-black text-[#0060B6] bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
                        {selectedGrievance.trackingId}
                      </span>
                      <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded border ${
                        STATUS_CONFIG[(selectedGrievance.status || 'LOGGED').toUpperCase()]?.badge || 'bg-slate-100 text-slate-800'
                      }`}>
                        {isHi
                          ? STATUS_CONFIG[(selectedGrievance.status || 'LOGGED').toUpperCase()]?.labelHi
                          : STATUS_CONFIG[(selectedGrievance.status || 'LOGGED').toUpperCase()]?.label}
                      </span>
                      <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        PostgreSQL Live
                      </span>
                    </div>
                    <h3 className="text-lg font-bold font-heading text-slate-900 mt-2">
                      {selectedGrievance.categoryLabel || selectedGrievance.category}
                    </h3>
                  </div>

                  {selectedGrievance.projectId && onSelectProject && (
                    <button
                      type="button"
                      onClick={() => onSelectProject(selectedGrievance.projectId)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gov-navy bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors shrink-0"
                    >
                      <Building2 className="w-3.5 h-3.5 text-gov-navy" />
                      <span>{isHi ? 'परियोजना 360 देखें' : `Open Project #${selectedGrievance.projectId}`}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Complainant & Time Metadata Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">{isHi ? 'नागरिक पहचान' : 'Complainant Identity'}</span>
                    <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                      {selectedGrievance.isAnonymous ? (
                        <>
                          <Lock className="w-3 h-3 text-emerald-600" />
                          <span>DPDP Protected Whistleblower</span>
                        </>
                      ) : (
                        <span>{selectedGrievance.name || 'Concerned Citizen'}</span>
                      )}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">{isHi ? 'दर्ज करने का समय' : 'Lodged At'}</span>
                    <span className="font-bold text-slate-800 mt-0.5 block">
                      {selectedGrievance.createdAt ? new Date(selectedGrievance.createdAt).toLocaleString('en-IN') : 'N/A'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">{isHi ? 'संबंधित निर्माण चरण' : 'Target Milestone'}</span>
                    <span className="font-bold text-indigo-700 mt-0.5 block">
                      {selectedGrievance.processStage || 'GENERAL_INSPECTION'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Citizen Observation Details */}
              <div className="space-y-2">
                <span className="text-xs font-heading font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-gov-navy" />
                  {isHi ? 'जमीनी अवलोकन विवरण' : 'Citizen Ground Observation'}
                </span>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-wrap">
                  {selectedGrievance.details}
                </div>
              </div>

              {/* Physical Evidence & Geo-tagging */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {/* Photo Evidence Box */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <span className="text-xs font-heading font-bold text-slate-900 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-gov-navy" />
                    {isHi ? 'भौतिक स्थल साक्ष्य' : 'Field Photo Evidence'}
                  </span>
                  {selectedGrievance.evidenceUrl || selectedGrievance.evidenceName ? (
                    <div className="space-y-2">
                      <div className="h-36 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center relative">
                        {selectedGrievance.evidenceUrl ? (
                          <img
                            src={selectedGrievance.evidenceUrl}
                            alt="Site evidence"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-center p-3 text-slate-500 text-xs font-mono">
                            <FileCheck className="w-8 h-8 mx-auto text-emerald-600 mb-1" />
                            <span>{selectedGrievance.evidenceName}</span>
                          </div>
                        )}
                        <span className="absolute bottom-2 left-2 text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900/80 text-emerald-300 font-bold border border-slate-700">
                          EXIF Verified
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-36 rounded-lg bg-slate-50 border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 text-xs font-mono p-4 text-center">
                      <Camera className="w-6 h-6 mb-1 text-slate-300" />
                      <span>No direct photograph attached</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">Observation submitted via text docket</span>
                    </div>
                  )}
                </div>

                {/* GPS Coordinates Box */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <span className="text-xs font-heading font-bold text-slate-900 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-gov-navy" />
                    {isHi ? 'जीपीएस भू-स्थान साक्ष्य' : 'GPS Telemetry & Pinpoint'}
                  </span>
                  {selectedGrievance.latitude && selectedGrievance.longitude ? (
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2 text-xs font-mono">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Latitude:</span>
                        <span className="font-bold text-slate-800">{Number(selectedGrievance.latitude).toFixed(4)}° N</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Longitude:</span>
                        <span className="font-bold text-slate-800">{Number(selectedGrievance.longitude).toFixed(4)}° E</span>
                      </div>
                      <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                        <span className="text-[10px] text-emerald-700 font-bold">Coordinate Lock: Valid</span>
                        <a
                          href={`https://www.google.com/maps?q=${selectedGrievance.latitude},${selectedGrievance.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] font-bold text-[#0060B6] hover:underline flex items-center gap-1"
                        >
                          <span>Open Map</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="h-36 rounded-lg bg-slate-50 border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 text-xs font-mono p-4 text-center">
                      <MapPin className="w-6 h-6 mb-1 text-slate-300" />
                      <span>Associated via MoSPI Project Corridor</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Taken Report (ATR) History if present */}
              {selectedGrievance.resolutionSummary && (
                <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1.5">
                  <span className="text-xs font-heading font-bold text-amber-900 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-700" />
                    {isHi ? 'सक्रिय विभागीय कार्रवाई विवरण (ATR)' : 'Active Action Taken Report & Directive'}
                  </span>
                  <p className="text-xs text-amber-950 font-mono leading-relaxed">
                    {selectedGrievance.resolutionSummary}
                  </p>
                  {selectedGrievance.updatedAt && (
                    <span className="text-[10px] text-amber-800/80 block font-mono">
                      Last Updated: {new Date(selectedGrievance.updatedAt).toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
              )}

              {/* ── Official Action Command Bar ── */}
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-heading font-bold text-gov-navy uppercase tracking-wider">
                    {isHi ? 'विभागीय प्रशासनिक कार्यवाही' : 'Statutory Departmental Action'}
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    Signing as: <strong className="text-slate-800">{officerName}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleOpenAction('ASSIGN')}
                    className="px-3 py-2.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-heading font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-amber-700" />
                    <span>{isHi ? 'अधिकारी नियुक्त करें' : 'Assign Nodal Officer'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenAction('INSPECT')}
                    className="px-3 py-2.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-300 text-indigo-900 text-xs font-heading font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                  >
                    <Building2 className="w-3.5 h-3.5 text-indigo-700" />
                    <span>{isHi ? 'स्थल निरीक्षण भेजें' : 'Dispatch Inspection'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenAction('SHOW_CAUSE')}
                    className="px-3 py-2.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-900 text-xs font-heading font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                  >
                    <Gavel className="w-3.5 h-3.5 text-rose-700" />
                    <span>{isHi ? 'कारण बताओ नोटिस' : 'Issue Show-Cause'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenAction('RESOLVE')}
                    className="px-3 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-heading font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    <span>{isHi ? 'ATR दर्ज कर बंद करें' : 'File ATR & Resolve'}</span>
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="panel p-16 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
              <AlertCircle className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-bold text-slate-700">{isHi ? 'कोई शिकायत चयनित नहीं है' : 'Select a grievance from the left queue'}</p>
              <p className="text-xs text-slate-400 mt-0.5">{isHi ? 'विवरण एवं कार्यवाही देखने हेतु क्लिक करें' : 'Inspect ground truth evidence and issue directives.'}</p>
            </div>
          )}
        </div>

      </div>

      {/* ── Official Action Modal ── */}
      <AnimatePresence>
        {modalOpen && selectedGrievance && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-lg overflow-hidden space-y-4"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    actionType === 'RESOLVE' ? 'bg-emerald-100 text-emerald-800' :
                    actionType === 'SHOW_CAUSE' ? 'bg-rose-100 text-rose-800' :
                    actionType === 'INSPECT' ? 'bg-indigo-100 text-indigo-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {actionType === 'RESOLVE' ? <CheckCircle2 className="w-4 h-4" /> :
                     actionType === 'SHOW_CAUSE' ? <Gavel className="w-4 h-4" /> :
                     actionType === 'INSPECT' ? <Building2 className="w-4 h-4" /> :
                     <UserCheck className="w-4 h-4" />}
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase font-bold text-slate-500 block">
                      {selectedGrievance.trackingId}
                    </span>
                    <h4 className="text-sm font-bold font-heading text-slate-900">
                      {actionType === 'RESOLVE' 
                        ? (isHi ? 'अंतिम ATR दर्ज करें एवं शिकायत का निस्तारण करें' : 'File Final ATR & Seal Grievance')
                        : actionType === 'SHOW_CAUSE' 
                        ? (isHi ? 'सीपीडब्ल्यूडी जीसीसी खंड 2 कारण बताओ नोटिस जारी करें' : 'Serve CPWD GCC Clause 2 Show-Cause Notice')
                        : actionType === 'INSPECT' 
                        ? (isHi ? 'तृतीय-पक्ष तकनीकी स्थल निरीक्षण आदेश भेजें' : 'Dispatch Third-Party Technical Inspection')
                        : (isHi ? 'मंत्रालय क्षेत्रीय नोडल अधिकारी नियुक्त करें' : 'Assign Ministry Regional Nodal Officer')}
                    </h4>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleExecuteAction} className="p-5 space-y-4 pt-0">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isHi ? 'कार्यकारी प्राधिकारी' : 'Acting Authority'}
                  </label>
                  <input
                    type="text"
                    disabled
                    value={officerName}
                    className="w-full text-xs font-mono p-2.5 rounded-lg border border-slate-200 bg-slate-100 text-slate-700"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">
                      {isHi ? 'आधिकारिक निर्देश / निरीक्षण टिप्पणी *' : 'Official Directive / Inspection Notes *'}
                    </label>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {isHi ? 'सीपीजीआरएएमएस अनुपालन' : 'CPGRAMS Compliant'}
                    </span>
                  </div>
                  <textarea
                    required
                    rows={4}
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    placeholder={isHi ? 'औपचारिक निर्देश दर्ज करें अथवा नीचे से प्रारूप चुनें...' : 'Enter formal directive or select template below...'}
                    className="w-full text-xs p-3 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-[#0060B6] focus:outline-none font-sans"
                  />
                </div>

                {/* Template Chips */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-mono text-slate-500 font-bold block">
                    {isHi ? 'पूर्व-प्रारूपित वैधानिक टेम्पलेट:' : 'Pre-drafted Statutory Templates:'}
                  </span>
                  <div className="space-y-1.5">
                    {(ACTION_TEMPLATES[actionType] || []).map((tmpl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActionNotes(tmpl)}
                        className="w-full text-left p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[11px] text-slate-700 transition-colors cursor-pointer font-sans"
                      >
                        {tmpl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Modal Footer Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                  >
                    {isHi ? 'रद्द करें' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading || !actionNotes.trim()}
                    className={`px-5 py-2 text-xs font-heading font-bold text-white rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5 transition-all ${
                      actionType === 'RESOLVE' ? 'bg-emerald-600 hover:bg-emerald-700' :
                      actionType === 'SHOW_CAUSE' ? 'bg-rose-600 hover:bg-rose-700' :
                      'bg-gov-navy hover:bg-slate-800'
                    }`}
                  >
                    {actionLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>{isHi ? 'पुष्टि करें एवं सहेजें' : 'Confirm & Commit to PostgreSQL'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
