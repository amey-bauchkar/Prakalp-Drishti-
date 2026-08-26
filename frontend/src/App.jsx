import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, NavLink, useLocation } from 'react-router-dom';
import { Search, Menu, X, ChevronRight, ShieldCheck, LogOut, Sparkles, Building2, Layers, Facebook, Rss, Accessibility } from 'lucide-react';

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

/* ─── Sovereign Government Utility Bar (data.gov.in Style) ───────── */
function UtilityBar() {
  const [theme, setTheme] = useState('default');
  const [lang, setLang] = useState('en');
  const session = useSession();

  return (
    <div className="bg-[#0060B6] text-white text-[11.5px] font-sans border-b border-[#00509E] select-none">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-1.5 flex items-center justify-between">
        {/* Left: Initiative Tag */}
        <div className="flex items-center gap-2">
          <span className="font-medium tracking-wide">A Digital India &amp; MoSPI Initiative</span>
          <span className="text-white/40 hidden md:inline">|</span>
          <span className="text-white/90 hidden md:inline font-devanagari">भारत सरकार · Government of India</span>
        </div>

        {/* Right: Theme Selector & Social / Utility Badges */}
        <div className="flex items-center gap-3.5">
          {/* Theme Selector */}
          <div className="flex items-center gap-1.5 cursor-pointer hover:opacity-90">
            <span className="text-[11px] font-medium hidden sm:inline text-white/95">Choose your theme:</span>
            <button
              onClick={() => setTheme(t => t === 'default' ? 'contrast' : 'default')}
              className="w-4 h-4 rounded-full border border-white/80 p-0 shadow-xs relative overflow-hidden bg-gradient-to-r from-[#FF9933] to-[#0060B6] shrink-0"
              title="Toggle Theme"
            />
          </div>

          {/* Social / GIGW Icons (Circular white with icons) */}
          <div className="flex items-center gap-1.5">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-5 h-5 rounded-full bg-white text-[#0060B6] flex items-center justify-center hover:bg-slate-100 transition-colors"
              title="Facebook"
            >
              <Facebook className="w-3 h-3 fill-current" />
            </a>

            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-5 h-5 rounded-full bg-white text-[#0060B6] flex items-center justify-center hover:bg-slate-100 transition-colors font-bold text-[10px]"
              title="X (Twitter)"
            >
              <span className="font-sans font-black text-[10px] leading-none">𝕏</span>
            </a>

            <a
              href="/rss"
              className="w-5 h-5 rounded-full bg-white text-[#FF9933] flex items-center justify-center hover:bg-slate-100 transition-colors"
              title="RSS Feed"
            >
              <Rss className="w-2.5 h-2.5" />
            </a>

            <button
              className="w-5 h-5 rounded-full bg-white text-[#0060B6] flex items-center justify-center hover:bg-slate-100 transition-colors"
              title="Accessibility Options"
            >
              <Accessibility className="w-3 h-3" />
            </button>
          </div>

          {/* Active Session / Sign Out if authenticated */}
          {session && (
            <div className="flex items-center gap-1.5 bg-white/15 px-2 py-0.5 rounded border border-white/30 text-[10px]">
              <ShieldCheck className="w-3 h-3 text-emerald-300 shrink-0" />
              <span className="font-bold">{session.username}</span>
              <button
                onClick={clearSession}
                className="text-white/80 hover:text-white underline ml-1 font-semibold"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Institutional Header + Navigation (data.gov.in Style) ──── */
function InstitutionalHeader() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const session = useSession();

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') { setMobileOpen(false); setSearchOpen(false); } };
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
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-xs select-none">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
        {/* Brand & Prakalp Drishti Logo */}
        <Link to="/" className="flex items-center gap-3 shrink-0 group">
          <img
            src="/logos/prakalp_drishti_emblem.png"
            alt="PRAKALP-DRISHTI"
            className="h-12 w-12 sm:h-14 sm:w-14 object-contain group-hover:scale-105 transition-transform"
          />

          <div className="flex flex-col">
            <div className="font-devanagari text-[10.5px] font-bold text-[#1E2A45] tracking-tight leading-none mb-0.5">
              सांख्यिकी एवं कार्यक्रम कार्यान्वयन मंत्रालय
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-heading font-black text-[20px] sm:text-[22px] text-[#0060B6] tracking-tight leading-none">
                prakalp<span className="text-[#FF9933]">.drishti</span>
              </span>
              <span className="hidden xl:inline-flex items-center px-1.5 py-0.2 rounded-sm text-[8px] font-extrabold uppercase tracking-wider bg-amber-50 text-amber-900 border border-amber-300 font-mono">
                MoSPI · CCEA AI
              </span>
            </div>
            <div className="text-[10px] text-slate-500 font-medium tracking-tight mt-0.5">
              Autonomous Infrastructure Decision Intelligence
            </div>
          </div>
        </Link>

        {/* Desktop Navigation Menu (data.gov.in layout) */}
        <div className="hidden lg:flex items-center gap-6">
          <nav className="flex items-center gap-5 xl:gap-7">
            {navItems.map((item) => {
              const isActive = item.to === '/'
                ? location.pathname === '/'
                : location.pathname === item.to;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className="flex flex-col items-center group py-1"
                >
                  <span
                    className={`text-[12px] font-heading font-extrabold tracking-wider transition-colors ${
                      isActive
                        ? 'text-[#0060B6]'
                        : 'text-[#1E2A45] group-hover:text-[#0060B6]'
                    }`}
                  >
                    {item.label}
                  </span>
                  {/* data.gov.in Blue Indicator Dot */}
                  <span
                    className={`w-1.5 h-1.5 rounded-full mt-1 transition-all ${
                      isActive ? 'bg-[#0060B6] opacity-100 scale-100' : 'bg-transparent opacity-0 scale-0 group-hover:bg-slate-300 group-hover:opacity-100 group-hover:scale-75'
                    }`}
                  />
                </NavLink>
              );
            })}
          </nav>

          {/* Search Popover Trigger */}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="p-1.5 text-slate-600 hover:text-[#0060B6] hover:bg-slate-100 rounded-full transition-colors"
            title="Search projects"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Vertical Divider */}
          <div className="h-5 w-px bg-slate-300" />

          {/* Login / Register or Role Status */}
          {session ? (
            <div className="flex items-center gap-1.5 text-[11.5px] font-heading font-bold text-[#0060B6]">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{session.username}</span>
            </div>
          ) : (
            <span className="text-[12px] font-heading font-extrabold tracking-wider text-[#1E2A45] hover:text-[#0060B6] cursor-pointer">
              LOGIN | REGISTER
            </span>
          )}
        </div>

        {/* Mobile controls */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="p-2 text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200"
            aria-label="Search"
          >
            <Search className="w-4 h-4" />
          </button>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200"
            aria-label="Menu"
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Search Bar Drawer */}
      {searchOpen && (
        <div className="border-t border-slate-200 bg-slate-50/95 backdrop-blur-sm px-4 py-3">
          <div className="max-w-2xl mx-auto">
            <ProjectSearchBar />
          </div>
        </div>
      )}

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white shadow-lg">
          <nav className="px-4 py-3 space-y-1">
            {navItems.map((item) => {
              const isActive = item.to === '/'
                ? location.pathname === '/'
                : location.pathname === item.to;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`flex items-center justify-between px-3.5 py-2.5 text-[13px] font-heading font-bold rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-[#0060B6] font-black'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{item.label}</span>
                  {isActive && <span className="w-2 h-2 rounded-full bg-[#0060B6]" />}
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
  return (
    <footer className="mt-auto">
      {/* Main Footer Content */}

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

        <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-3">
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
