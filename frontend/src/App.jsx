import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, NavLink, useLocation, Navigate } from 'react-router-dom';
import { Search, Menu, X, ChevronRight, ShieldCheck, LogOut, Sparkles, Building2, Layers, Facebook, Rss, Accessibility } from 'lucide-react';

import AmeyMasterView from '../amey/index.jsx';
import DecisionHubView from '../amey/DecisionHubView.jsx';
import SatyaKavachView from './views/SatyaKavachView.jsx';
import ArthaNivaranView from './views/ArthaNivaranView.jsx';
import SetuVarshaView from './views/SetuVarshaView.jsx';
import PublicDashboardView from './views/PublicDashboardView.jsx';
import ProjectSearchBar from './components/ProjectSearchBar.jsx';
import KaryaDakshataSimulator from './components/KaryaDakshataSimulator.jsx';
import LoginGate, { useSession, clearSession } from '../amey/LoginGate.jsx';

/* ─── Sovereign Government Utility Bar (data.gov.in Style) ───────── */
function UtilityBar() {
  const [theme, setTheme] = useState(() => localStorage.getItem('prakalp:theme') || 'default');
  const [fontSize, setFontSize] = useState(() => localStorage.getItem('prakalp:fontSize') || 'normal');
  const session = useSession();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('prakalp:theme', theme);
  }, [theme]);

  useEffect(() => {
    if (fontSize === 'normal') {
      document.documentElement.removeAttribute('data-font-size');
    } else {
      document.documentElement.setAttribute('data-font-size', fontSize);
    }
    localStorage.setItem('prakalp:fontSize', fontSize);
  }, [fontSize]);

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
          {/* Theme Selector (Standard / High-Contrast / Dark) */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium hidden sm:inline text-white/95">Theme:</span>
            <div className="flex items-center gap-1 bg-white/10 p-0.5 rounded border border-white/20">
              <button
                onClick={() => setTheme('default')}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all ${
                  theme === 'default' ? 'bg-white text-[#0060B6] shadow-xs' : 'text-white/80 hover:text-white'
                }`}
                title="Standard Institutional Theme"
              >
                Standard
              </button>
              <button
                onClick={() => setTheme('contrast')}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all ${
                  theme === 'contrast' ? 'bg-yellow-400 text-black shadow-xs font-black' : 'text-white/80 hover:text-white'
                }`}
                title="GIGW High Contrast Mode"
              >
                High Contrast
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all ${
                  theme === 'dark' ? 'bg-slate-900 text-white shadow-xs' : 'text-white/80 hover:text-white'
                }`}
                title="Dark Console Mode"
              >
                Dark
              </button>
            </div>
          </div>

          {/* Text Size Accessibility Controls (GIGW standard: A- A A+) */}
          <div className="hidden sm:flex items-center gap-0.5 bg-white/10 p-0.5 rounded border border-white/20 font-mono text-[10px]">
            <button
              onClick={() => setFontSize('normal')}
              className={`px-1.5 py-0.5 rounded ${fontSize === 'normal' ? 'bg-white text-[#0060B6] font-bold' : 'text-white/80 hover:text-white'}`}
              title="Standard text size"
            >
              A
            </button>
            <button
              onClick={() => setFontSize('large')}
              className={`px-1.5 py-0.5 rounded ${fontSize === 'large' ? 'bg-white text-[#0060B6] font-bold' : 'text-white/80 hover:text-white'}`}
              title="Large text size (+10%)"
            >
              A+
            </button>
            <button
              onClick={() => setFontSize('larger')}
              className={`px-1.5 py-0.5 rounded ${fontSize === 'larger' ? 'bg-white text-[#0060B6] font-bold' : 'text-white/80 hover:text-white'}`}
              title="Extra large text size (+20%)"
            >
              A++
            </button>
          </div>

          {/* Social / GIGW Official Links */}
          <div className="flex items-center gap-1.5">
            <a
              href="https://www.facebook.com/MoSPI.GoI"
              target="_blank"
              rel="noopener noreferrer"
              className="w-5 h-5 rounded-full bg-white text-[#0060B6] flex items-center justify-center hover:bg-slate-100 transition-colors"
              title="Official MoSPI Facebook"
            >
              <Facebook className="w-3 h-3 fill-current" />
            </a>

            <a
              href="https://twitter.com/GoI_MoSPI"
              target="_blank"
              rel="noopener noreferrer"
              className="w-5 h-5 rounded-full bg-white text-[#0060B6] flex items-center justify-center hover:bg-slate-100 transition-colors font-bold text-[10px]"
              title="Official MoSPI X (Twitter)"
            >
              <span className="font-sans font-black text-[10px] leading-none">𝕏</span>
            </a>

            <a
              href="https://data.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="w-5 h-5 rounded-full bg-white text-[#FF9933] flex items-center justify-center hover:bg-slate-100 transition-colors"
              title="Open Government Data Portal"
            >
              <Rss className="w-2.5 h-2.5" />
            </a>
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

  // Top-level Navigation: Sovereign Home, Government Decision Hub, Nagrik Portal
  const navItems = [
    { to: '/', label: 'HOME' },
    { to: '/decision-hub', label: 'DECISION HUB' },
    { to: '/nagrik', label: 'NAGRIK PORTAL' },
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

        {/* Center-aligned Desktop Navigation Menu */}
        <div className="hidden lg:flex flex-1 items-center justify-center px-4">
          <nav className="flex items-center gap-8 xl:gap-12">
            {navItems.map((item) => {
              const isActive = item.to === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.to);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className="flex flex-col items-center group py-1"
                >
                  <span
                    className={`text-[12.5px] font-heading font-extrabold tracking-wider transition-colors ${
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
        </div>

        {/* Right side utility / login controls */}
        <div className="hidden lg:flex items-center gap-4 shrink-0">
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
            <Link
              to="/decision-hub"
              className="text-[12px] font-heading font-extrabold tracking-wider text-[#1E2A45] hover:text-[#0060B6] cursor-pointer"
            >
              LOGIN | REGISTER
            </Link>
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
                : location.pathname.startsWith(item.to);
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
    <footer className="mt-auto select-none font-sans">
      {/* Main Sovereign Footer Content */}
      <div className="bg-[#071320] text-white pt-12 pb-10 border-t border-slate-800">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
            {/* Column 1: Official National Masthead (Span 4) */}
            <div className="lg:col-span-4 space-y-3.5">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-white p-1 shadow-md border border-white/80 flex items-center justify-center shrink-0">
                  <img
                    src="/logos/prakalp_drishti_emblem.png"
                    alt="PRAKALP-DRISHTI Emblem"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div className="space-y-0.5">
                  <div className="font-devanagari text-[12.5px] text-amber-400 font-bold leading-tight">
                    सांख्यिकी और कार्यक्रम कार्यान्वयन मंत्रालय
                  </div>
                  <h4 className="text-white font-extrabold text-[17.5px] font-heading tracking-tight leading-snug">
                    PRAKALP-DRISHTI
                  </h4>
                  <div className="text-[11px] text-slate-300 font-medium">
                    Ministry of Statistics &amp; Programme Implementation · Govt. of India
                  </div>
                </div>
              </div>

              <p className="text-[12px] text-slate-400 leading-relaxed pr-3">
                National Infrastructure Monitoring &amp; Decision Intelligence System for Central Sector Projects (&ge; ₹150 Crore). 
                Empowering statutory oversight, empirical risk analysis, and project performance tracking.
              </p>

              <div className="pt-2 text-[11.5px] text-slate-400 space-y-1.5 border-t border-slate-800/80">
                <div><span className="text-slate-300 font-medium">Nodal Division:</span> Infrastructure &amp; Project Monitoring Division (IPMD)</div>
                <div><span className="text-slate-300 font-medium">Headquarters:</span> Khurshid Lal Bhawan, Janpath, New Delhi – 110001</div>
              </div>
            </div>

            {/* Column 2: Public & Analytical Portals (Span 3) */}
            <div className="lg:col-span-3 space-y-3">
              <h5 className="text-[12px] font-bold text-amber-400 uppercase tracking-widest font-heading border-b border-slate-800 pb-2">
                Analytical Portals
              </h5>
              <ul className="space-y-2 text-[12.5px] text-slate-300">
                <li>
                  <Link to="/nagrik" className="hover:text-amber-300 transition-colors flex items-center gap-1.5 group font-medium text-emerald-300">
                    <ChevronRight className="w-3.5 h-3.5 text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                    <span>Nagrik Portal (Public Citizens)</span>
                  </Link>
                </li>
                <li>
                  <Link to="/decision-hub" className="hover:text-amber-300 transition-colors flex items-center gap-1.5 group">
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-300 group-hover:translate-x-0.5 transition-all" />
                    <span>Decision Intelligence Hub (10 Engines)</span>
                  </Link>
                </li>
                <li>
                  <Link to="/decision-hub?engine=satya_kavach" className="hover:text-amber-300 transition-colors flex items-center gap-1.5 group">
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-300 group-hover:translate-x-0.5 transition-all" />
                    <span>Satya-Kavach (CCEA 20% Audit)</span>
                  </Link>
                </li>
                <li>
                  <Link to="/decision-hub?engine=artha_nivaran" className="hover:text-amber-300 transition-colors flex items-center gap-1.5 group">
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-300 group-hover:translate-x-0.5 transition-all" />
                    <span>Artha-Nivaran (PSU Financial Radar)</span>
                  </Link>
                </li>
                <li>
                  <Link to="/decision-hub?engine=setu_varsha" className="hover:text-amber-300 transition-colors flex items-center gap-1.5 group">
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-300 group-hover:translate-x-0.5 transition-all" />
                    <span>Setu-Varsha (Climate Exposure)</span>
                  </Link>
                </li>
                <li>
                  <Link to="/decision-hub?engine=karya_dakshata" className="hover:text-amber-300 transition-colors flex items-center gap-1.5 group">
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-300 group-hover:translate-x-0.5 transition-all" />
                    <span>Karya-Dakshata (Agency Simulator)</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: National Infrastructure Network (Span 2) */}
            <div className="lg:col-span-2 space-y-3">
              <h5 className="text-[12px] font-bold text-amber-400 uppercase tracking-widest font-heading border-b border-slate-800 pb-2">
                Government Portals
              </h5>
              <ul className="space-y-2 text-[12.5px] text-slate-300">
                <li>
                  <a href="https://mospi.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-amber-300 transition-colors block">
                    MoSPI Official Website
                  </a>
                </li>
                <li>
                  <a href="https://pmgatishakti.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-amber-300 transition-colors block">
                    PM GatiShakti NMP
                  </a>
                </li>
                <li>
                  <a href="https://data.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-amber-300 transition-colors block">
                    Open Government Data (OGD)
                  </a>
                </li>
                <li>
                  <a href="https://niti.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-amber-300 transition-colors block">
                    NITI Aayog
                  </a>
                </li>
                <li>
                  <a href="https://paimana-proj.mospi.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-amber-300 transition-colors block">
                    PAIMANA Repository
                  </a>
                </li>
                <li>
                  <a href="https://cloud.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-amber-300 transition-colors block">
                    NIC MeghRaj Cloud
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 4: Official Policies & Technical Hosting (Span 3) */}
            <div className="lg:col-span-3 space-y-3">
              <h5 className="text-[12px] font-bold text-amber-400 uppercase tracking-widest font-heading border-b border-slate-800 pb-2">
                Website Policies &amp; Help
              </h5>
              
              <ul className="space-y-2 text-[12.5px] text-slate-300">
                <li>
                  <span className="text-slate-300 hover:text-amber-300 transition-colors cursor-pointer block">
                    Website Policies &amp; Disclaimer
                  </span>
                </li>
                <li>
                  <span className="text-slate-300 hover:text-amber-300 transition-colors cursor-pointer block">
                    Hyperlinking Policy &amp; Terms
                  </span>
                </li>
                <li>
                  <span className="text-slate-300 hover:text-amber-300 transition-colors cursor-pointer block">
                    Privacy Policy
                  </span>
                </li>
                <li>
                  <span className="text-slate-300 hover:text-amber-300 transition-colors cursor-pointer block">
                    Accessibility Statement (GIGW 3.0)
                  </span>
                </li>
                <li>
                  <span className="text-slate-300 hover:text-amber-300 transition-colors cursor-pointer block">
                    Feedback &amp; Grievance Redressal
                  </span>
                </li>
              </ul>

              <div className="pt-2.5 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                <div>Hosted on <strong className="text-slate-200">National Informatics Centre (NIC)</strong> Platform</div>
                <div>Designed for <strong className="text-slate-200">Smart India Hackathon (SIH 2026)</strong></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Copyright Strip */}
      <div className="bg-[#030A12] text-slate-400 text-[12px] py-4 border-t border-slate-800/80">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-center sm:text-left">
          <span>&copy; {new Date().getFullYear()} Ministry of Statistics &amp; Programme Implementation, Government of India.</span>
          <div className="flex items-center gap-3 text-[11.5px] text-slate-400">
            <span className="font-semibold text-amber-400/90">Prakalp-Drishti Release v3.2</span>
            <span className="text-slate-700">|</span>
            <span>2,207 Central Sector Projects</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ─── Not Found ──────────────────────────────────────────────────
   A government portal must say what happened rather than showing an
   empty frame; routes do get retired, and bookmarks outlive them. */
function NotFoundView() {
  return (
    <div className="panel panel-accent p-8 sm:p-10 max-w-2xl mx-auto my-10 text-center">
      <div className="microlabel mb-2">HTTP 404 · Page Not Found</div>
      <h2 className="font-heading font-extrabold text-gov-navy mb-2">
        This page is not part of the portal
      </h2>
      <p className="text-[12.5px] text-gov-muted leading-relaxed mb-5 max-w-md mx-auto">
        The address you requested does not match any module. It may have been
        retired or renamed. Use the navigation above, or return to the decision
        console.
      </p>
      <Link to="/decision-hub" className="btn-primary">
        Go to Decision Hub
      </Link>
      <div className="hashline mt-5 pt-4 border-t border-gov-border">
        {typeof window !== 'undefined' ? window.location.pathname : ''}
      </div>
    </div>
  );
}

/* ─── Protected Route Wrapper for Government / Decision Support ── */
function ProtectedRoute({ children }) {
  return <LoginGate>{children}</LoginGate>;
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
            {/* ── Tier 1: Public Citizen Unrestricted Routes ── */}
            <Route path="/" element={<AmeyMasterView />} />
            <Route path="/nagrik" element={<PublicDashboardView />} />
            <Route path="/public" element={<Navigate to="/nagrik" replace />} />
            <Route path="/public-dashboard" element={<Navigate to="/nagrik" replace />} />

            {/* ── Tier 2: Government Official & Analytical Engines (Gated by LoginGate) ── */}
            <Route
              path="/decision-hub"
              element={
                <ProtectedRoute>
                  <DecisionHubView />
                </ProtectedRoute>
              }
            />

            {/* ── Direct Engine Routes -> Redirect into Authenticated Decision Hub ── */}
            <Route path="/satya-kavach" element={<Navigate to="/decision-hub?engine=satya_kavach" replace />} />
            <Route path="/artha-nivaran" element={<Navigate to="/decision-hub?engine=artha_nivaran" replace />} />
            <Route path="/setu-varsha" element={<Navigate to="/decision-hub?engine=setu_varsha" replace />} />
            <Route path="/karya-dakshata" element={<Navigate to="/decision-hub?engine=karya_dakshata" replace />} />

            {/* ── Legacy per-developer paths -> Redirect into Authenticated Decision Hub ── */}
            <Route path="/tanmay" element={<Navigate to="/decision-hub?engine=satya_kavach" replace />} />
            <Route path="/anumati" element={<Navigate to="/decision-hub?engine=satya_kavach" replace />} />
            <Route path="/parth" element={<Navigate to="/decision-hub?engine=artha_nivaran" replace />} />
            <Route path="/nivaran" element={<Navigate to="/decision-hub?engine=artha_nivaran" replace />} />
            <Route path="/janhavi" element={<Navigate to="/decision-hub?engine=setu_varsha" replace />} />
            <Route path="/aditya" element={<Navigate to="/decision-hub?engine=setu_varsha" replace />} />
            <Route path="/soham" element={<Navigate to="/decision-hub?engine=benchmark" replace />} />
            <Route path="/eo-auditor" element={<Navigate to="/decision-hub?engine=setu_varsha" replace />} />

            {/* Catch-all */}
            <Route path="*" element={<NotFoundView />} />
          </Routes>
        </main>

        <InstitutionalFooter />
      </div>
    </BrowserRouter>
  );
}
