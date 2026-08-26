import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, NavLink, useLocation } from 'react-router-dom';
import { Search, Menu, X, ChevronRight, ShieldCheck, LogOut, Sparkles, Building2, Layers } from 'lucide-react';

import AmeyMasterView from '../amey/index.jsx';
import DecisionHubView from '../amey/DecisionHubView.jsx';
import SatyaKavachView from '../tanmay/index.jsx';
import ArthaNetraView from '../parth/index.jsx';
import VarshaSpeedView from '../janhavi/index.jsx';
import DPRScorerView from '../soham/index.jsx';
import EOAuditorView from '../aditya/index.jsx';
import ProjectSearchBar from './components/ProjectSearchBar.jsx';
import KaryaDakshataSimulator from './components/KaryaDakshataSimulator.jsx';
import { useSession, clearSession } from '../amey/LoginGate.jsx';

/* ─── Sovereign Government Utility Bar (Compact & Sleek) ───────── */
function UtilityBar() {
  const [fontSize, setFontSize] = useState('normal');
  const [lang, setLang] = useState('en');
  const session = useSession();

  return (
    <div className="bg-[#071626] text-[10.5px] text-slate-300 border-b border-slate-800 select-none">
      {/* Tricolor Saffron/White/Green top ribbon */}
      <div className="h-[2.5px] w-full flex">
        <div className="h-full w-1/3 bg-[#FF9933]" />
        <div className="h-full w-1/3 bg-[#FFFFFF]" />
        <div className="h-full w-1/3 bg-[#138808]" />
      </div>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-devanagari font-bold text-white tracking-wide">भारत सरकार</span>
          <span className="text-slate-600">|</span>
          <span className="font-semibold text-slate-200">Government of India</span>
          <span className="hidden md:inline text-slate-600">·</span>
          <span className="hidden md:inline text-slate-400 font-medium">Ministry of Statistics &amp; Programme Implementation</span>
        </div>
        
        <div className="flex items-center gap-2.5">
          {/* Active Admin / User Session Badge */}
          {session && (
            <div className="flex items-center gap-1.5 bg-slate-800/90 px-2 py-0.5 rounded border border-slate-700 text-[9.5px]">
              <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="font-bold text-white">{session.username}</span>
              <span className="tag bg-rose-500/15 text-rose-200 border-rose-400/40">
                {String(session.role).replace(/_/g, ' ')}
              </span>
              <button
                onClick={clearSession}
                className="text-slate-400 hover:text-rose-400 transition-colors ml-1 font-bold"
                title="Sign out"
              >
                Sign out
              </button>
            </div>
          )}

          {/* Font resizing */}
          <div className="hidden sm:flex items-center gap-1 text-[9.5px] bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700 font-mono">
            <button onClick={() => setFontSize('sm')} className="hover:text-gov-saffron font-medium px-0.5">A-</button>
            <span className="text-slate-600">|</span>
            <button onClick={() => setFontSize('normal')} className="hover:text-gov-saffron font-bold px-0.5">A</button>
            <span className="text-slate-600">|</span>
            <button onClick={() => setFontSize('lg')} className="hover:text-gov-saffron font-black px-0.5">A+</button>
          </div>

          {/* Language toggle */}
          <button 
            onClick={() => setLang(l => l === 'en' ? 'hi' : 'en')}
            className="flex items-center gap-1 bg-gov-saffron/20 text-gov-saffron-light border border-gov-saffron/40 px-2 py-0.5 rounded text-[9.5px] font-bold hover:bg-gov-saffron hover:text-white transition-colors font-mono"
          >
            <span>{lang === 'en' ? 'हिन्दी' : 'English'}</span>
          </button>
          
          <span className="hidden sm:inline text-slate-400 hover:text-white transition-colors cursor-pointer text-[9.5px] font-mono font-bold">
            GIGW 3.0
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── Institutional Header + Navigation (Compact 2-Tier) ──────── */
function InstitutionalHeader() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setMobileOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const navItems = [
    { to: '/', label: 'HOME' },
    { to: '/decision-hub', label: 'DECISION HUB' },
    { to: '/tanmay', label: 'SATYA-KAVACH' },
    { to: '/parth', label: 'ARTHA-NETRA' },
    { to: '/janhavi', label: 'VARSHA-SPEED' },
    { to: '/soham', label: 'DPR-SCORER' },
    { to: '/karya-dakshata', label: 'KARYA-DAKSHATA' },
  ];

  return (
    <header className="bg-white border-b border-border-default sticky top-0 z-50 shadow-sm select-none">
      {/* ── Tier 1: Brand & Search Studio ── */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-5">
        {/* Brand & Emblem */}
        <Link to="/" className="flex items-center gap-3 shrink-0 group">
          {/* National Emblem SVG */}
          <div className="w-7 h-9 flex items-center justify-center text-gov-navy shrink-0 drop-shadow-xs">
            <svg viewBox="0 0 100 120" className="w-full h-full fill-current text-gov-navy">
              <path d="M50,5 C40,5 35,15 35,25 C35,38 45,45 50,45 C55,45 65,38 65,25 C65,15 60,5 50,5 Z M30,50 L70,50 L65,70 L35,70 Z M25,75 L75,75 L70,95 L30,95 Z M20,100 L80,100 L75,115 L25,115 Z" opacity="0.9" />
              <circle cx="50" cy="85" r="5" />
            </svg>
          </div>

          <div className="border-l border-slate-300 pl-3">
            <div className="font-devanagari text-[11px] font-bold text-gov-navy tracking-tight leading-none mb-0.5">
              प्रकल्प-दृष्टि · सांख्यिकी एवं कार्यक्रम कार्यान्वयन मंत्रालय
            </div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-black text-[17px] text-gov-navy tracking-tight leading-none">
                PRAKALP-DRISHTI
              </span>
              <span className="hidden sm:inline-flex items-center px-1.5 py-0.2 rounded-sm text-[8.5px] font-extrabold uppercase tracking-wider bg-gov-saffron-light text-gov-saffron-dark border border-gov-gold-border font-mono">
                MoSPI · CCEA AI Engine
              </span>
            </div>
            <div className="text-[10px] text-text-muted font-medium tracking-wide leading-tight">
              National Infrastructure Decision Intelligence Portal
            </div>
          </div>
        </Link>

        {/* Desktop Search Bar */}
        <div className="flex-1 max-w-sm hidden md:block">
          <ProjectSearchBar />
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden p-2 text-gov-navy hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
          aria-label="Menu"
        >
          {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {/* ── Tier 2: Sovereign Navigation Rail ── */}
      <div className="hidden lg:block bg-[#0A1E31] border-t border-[#163B5D]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <nav className="flex items-center gap-1 py-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `px-3.5 py-1.5 text-[11px] font-heading font-extrabold tracking-wider rounded-lg whitespace-nowrap transition-all flex items-center gap-1 ${
                    isActive
                      ? 'bg-gov-saffron text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`
                }
              >
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2 text-slate-300 text-[10.5px] font-mono font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>2,207 Active Projects Monitored</span>
          </div>
        </div>
      </div>

      {/* Mobile Search & Drawer */}
      <div className="md:hidden px-4 pb-2.5 pt-1 border-t border-slate-100 bg-slate-50">
        <ProjectSearchBar />
      </div>

      {mobileOpen && (
        <div className="lg:hidden border-t border-border-default bg-[#0A1E31] text-white">
          <nav className="px-4 py-2.5 space-y-1">
            {navItems.map((item) => {
              const isActive = item.to === '/'
                ? location.pathname === '/'
                : location.pathname === item.to;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`block px-3.5 py-2 text-[12px] font-heading font-bold rounded-lg whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-gov-saffron text-white shadow-sm'
                      : 'text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}

/* ─── Institutional Footer (GIGW 3.0 Standard) ───────────────── */
function InstitutionalFooter() {
  const partnerLogos = [
    { name: 'National Portal of India', sub: 'india.gov.in', badge: 'IN' },
    { name: 'Open Government Data', sub: 'data.gov.in', badge: 'OGD' },
    { name: 'Digital India', sub: 'Power to Empower', badge: 'DI' },
    { name: 'PM GatiShakti', sub: 'National Master Plan', badge: 'NMP' },
    { name: 'MoSPI', sub: 'Ministry of Statistics', badge: 'MoSPI' },
    { name: 'NITI Aayog', sub: 'National Institution', badge: 'NITI' },
  ];

  return (
    <footer className="mt-auto">
      {/* Sovereign Partner Strip */}
      <div className="bg-white border-y border-border-default py-6">
        <div className="gov-content">
          <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
            {partnerLogos.map((p) => (
              <div key={p.name} className="flex items-center gap-2.5">
                <span className="circular-partner-badge font-heading font-extrabold text-[9.5px] tracking-tight text-gov-navy shrink-0">
                  {p.badge}
                </span>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-gov-navy font-heading leading-tight">{p.name}</div>
                  <div className="text-[9.5px] text-gov-muted font-mono">{p.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="bg-gov-navy-dark text-white py-12">
        <div className="gov-content grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="font-devanagari text-xs text-gov-saffron-light font-semibold">
              सांख्यिकी एवं कार्यक्रम कार्यान्वयन मंत्रालय
            </div>
            <h4 className="text-white font-bold text-base font-heading">PRAKALP-DRISHTI</h4>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              National Infrastructure Decision Intelligence Portal delivering causal econometrics,
              satellite ground truth, and empirical risk mitigation for central sector infrastructure projects.
            </p>
          </div>

          <div>
            <h5 className="text-xs font-bold text-gov-saffron-light uppercase tracking-wider mb-3 font-heading">Analytical Modules</h5>
            <ul className="space-y-2 text-xs">
              <li><Link to="/tanmay" className="text-slate-300 hover:text-gov-saffron transition-colors">SATYA-KAVACH — Contract Compliance</Link></li>
              <li><Link to="/parth" className="text-slate-300 hover:text-gov-saffron transition-colors">ARTHA-NETRA — Financial Health</Link></li>
              <li><Link to="/janhavi" className="text-slate-300 hover:text-gov-saffron transition-colors">VARSHA-SPEED — Climate Exposure</Link></li>
              <li><Link to="/soham" className="text-slate-300 hover:text-gov-saffron transition-colors">DPR-SCORER — Sanction Integrity</Link></li>
              <li><Link to="/decision-hub" className="text-slate-300 hover:text-gov-saffron transition-colors">DECISION INTELLIGENCE HUB</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-bold text-gov-saffron-light uppercase tracking-wider mb-3 font-heading">Institutional Links</h5>
            <ul className="space-y-2 text-xs">
              <li><a href="https://mospi.gov.in" target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-gov-saffron transition-colors">Ministry Website (MoSPI)</a></li>
              <li><a href="https://data.gov.in" target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-gov-saffron transition-colors">Open Government Data (OGD)</a></li>
              <li><a href="https://niti.gov.in" target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-gov-saffron transition-colors">NITI Aayog Portal</a></li>
              <li><a href="https://pmgatishekhti.gov.in" target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-gov-saffron transition-colors">PM GatiShakti NMP</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h5 className="text-xs font-bold text-gov-saffron-light uppercase tracking-wider font-heading">Security &amp; Standards</h5>
            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <div className="text-white font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Air-Gapped Sovereign Deployment</span>
              </div>
              <p className="font-sans">Zero external telemetry. Merkle cryptographic verification on every cabinet metric.</p>
            </div>
            <div className="text-[10px] text-slate-500">
              Compliant with GIGW 3.0 Guidelines · ISO 27001 Certified
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Copyright Strip */}
      <div className="bg-slate-950 text-slate-400 text-xs py-4 border-t border-slate-800">
        <div className="gov-content flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; {new Date().getFullYear()} Ministry of Statistics &amp; Programme Implementation. All rights reserved.</span>
          <span className="font-mono text-[11px] text-slate-400">Prakalp-Drishti Decision Engine v3.2 · CCEA Monitored</span>
        </div>
      </div>
    </footer>
  );
}

/* ─── Main Application Shell ─────────────────────────────────── */
export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-[#FAFAF9]">
        <UtilityBar />
        <InstitutionalHeader />

        <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <Routes>
            <Route path="/" element={<AmeyMasterView />} />
            <Route path="/decision-hub" element={<DecisionHubView />} />
            <Route path="/tanmay" element={<SatyaKavachView />} />
            <Route path="/parth" element={<ArthaNetraView />} />
            <Route path="/janhavi" element={<VarshaSpeedView />} />
            <Route path="/soham" element={<DPRScorerView />} />
            <Route path="/karya-dakshata" element={<KaryaDakshataSimulator />} />
            <Route path="/eo-auditor" element={<EOAuditorView />} />
          </Routes>
        </main>

        <InstitutionalFooter />
      </div>
    </BrowserRouter>
  );
}
