import React, { useState, useEffect, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Link, NavLink, useLocation, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Menu, X, ChevronRight, ShieldCheck, LogOut, Sparkles, Building2, Layers, Facebook, Rss, Accessibility, ExternalLink } from 'lucide-react';

// Routes are split so each audience downloads only its own surface. Vendor chunks
// were already split in vite.config.js, but the application itself was one 1,510 kB
// file, so /nagrik pulled the whole officer console down with it.
const AmeyMasterView       = React.lazy(() => import('../amey/index.jsx'));
const DecisionHubView      = React.lazy(() => import('../amey/DecisionHubView.jsx'));
const PublicDashboardView  = React.lazy(() => import('./views/PublicDashboardView.jsx'));
const AdminIngestView      = React.lazy(() => import('./views/AdminIngestView.jsx'));
const MilestoneTimelineView = React.lazy(() => import('./views/MilestoneTimelineView.jsx'));
const PoliciesView         = React.lazy(() => import('./views/PoliciesView.jsx'));
import ProjectSearchBar from './components/ProjectSearchBar.jsx';
import LoginGate, { useSession, clearSession } from '../amey/LoginGate.jsx';
import SmoothScrollProvider, { useLenis, scrollToTop } from './components/SmoothScrollProvider.jsx';
import AccessibilityBar from './components/AccessibilityBar.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { getStoredLanguage, t } from './lib/i18n';



/* ─── Institutional Header + Navigation (data.gov.in Style) ──── */
function InstitutionalHeader() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState(() => getStoredLanguage());
  const session = useSession();

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') { setMobileOpen(false); setSearchOpen(false); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const onLang = (e) => setCurrentLang(e.detail || getStoredLanguage());
    window.addEventListener('prakalp:languageChanged', onLang);
    return () => window.removeEventListener('prakalp:languageChanged', onLang);
  }, []);

  // Top-level Navigation: Sovereign Home, Government Decision Hub, Nagrik Portal
  // CORPUS ADMIN is offered only to a session holding `allocate_capital`. This is
  // presentation, NOT access control -- /api/ingest enforces the capability server-side
  // and the route itself is reachable by URL. Hiding the link merely avoids showing an
  // officer a door their role cannot open.
  const canAdminister = !!session?.permissions?.includes('allocate_capital');
  const navItems = [
    { to: '/', label: t('nav_home', currentLang) },
    { to: '/decision-hub', label: t('nav_decision_hub', currentLang) },
    { to: '/nagrik', label: t('nav_nagrik', currentLang) },
    ...(canAdminister ? [{ to: '/admin/ingest', label: t('nav_admin', currentLang) }] : []),
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-[100] shadow-xs select-none">
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
              {t('ministry_name', currentLang)}
            </div>
            <div className="flex items-center gap-1.5">
              <span lang="en" className="font-heading font-black text-[20px] sm:text-[22px] text-[#0060B6] tracking-tight leading-none">
                prakalp<span className="text-[#FF9933]">.drishti</span>
              </span>
              <span className="hidden xl:inline-flex items-center px-1.5 py-0.2 rounded-sm text-[8px] font-extrabold uppercase tracking-wider bg-amber-50 text-amber-900 border border-amber-300 font-mono">
                <span lang="en">MoSPI · CCEA AI</span>
              </span>
            </div>
            <div className="text-[10px] text-slate-500 font-medium tracking-tight mt-0.5">
              {t('subtitle', currentLang)}
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

          {/* Login / Register or Role Status with Sign Out */}
          {session ? (
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs">
              <div className="flex items-center gap-1.5 text-[12px] font-heading font-bold text-[#0060B6]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span lang="en">{session.username}</span>
                {session.role && (
                  <span className="text-[9.5px] font-mono px-1.5 py-0.5 rounded bg-blue-100/80 text-[#0060B6] font-bold uppercase tracking-wider">
                    <span lang="en">{String(session.role).replace(/_/g, " ")}</span>
                  </span>
                )}
              </div>
              <div className="h-3.5 w-px bg-slate-300 mx-0.5" />
              <button
                onClick={clearSession}
                className="flex items-center gap-1 min-h-[24px] text-[11px] font-heading font-bold text-slate-600 hover:text-rose-700 hover:bg-rose-50 px-1.5 py-1 rounded transition-colors cursor-pointer"
                title="Sign out of console"
              >
                <LogOut className="w-3 h-3" />
                <span>{t('nav_sign_out', currentLang)}</span>
              </button>
            </div>
          ) : (
            <Link
              to="/decision-hub"
              className="text-[12px] font-heading font-extrabold tracking-wider text-[#1E2A45] hover:text-[#0060B6] cursor-pointer px-2 py-1 rounded hover:bg-slate-50 transition-colors"
            >
              {t('nav_login', currentLang)}
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

            {session ? (
              <div className="pt-2.5 mt-2 border-t border-slate-100 flex items-center justify-between px-3 py-2 text-xs bg-slate-50 rounded-lg">
                <div className="flex items-center gap-1.5 font-bold text-[#0060B6]">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span lang="en">{session.username}</span>
                  {session.role && (
                    <span className="text-[9.5px] font-mono px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-bold uppercase">
                      <span lang="en">{String(session.role).replace(/_/g, " ")}</span>
                    </span>
                  )}
                </div>
                <button
                  onClick={clearSession}
                  className="flex items-center gap-1 text-rose-600 font-bold text-xs hover:bg-rose-50 px-2 py-1 rounded transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{t('nav_sign_out', currentLang)}</span>
                </button>
              </div>
            ) : (
              <div className="pt-2 mt-2 border-t border-slate-100 px-3 py-1">
                <Link
                  to="/decision-hub"
                  className="block text-center py-2 bg-[#0060B6] text-white rounded-lg font-bold text-xs"
                >
                  {t('nav_login', currentLang)}
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

/* ─── Institutional Footer (GIGW 3.0 Standard) ───────────────── */
function InstitutionalFooter() {
  const [lang, setLang] = useState(() => getStoredLanguage());
  useEffect(() => {
    const onLang = (e) => setLang(e.detail || getStoredLanguage());
    window.addEventListener('prakalp:languageChanged', onLang);
    return () => window.removeEventListener('prakalp:languageChanged', onLang);
  }, []);

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
                  <h4 lang="en" className="text-white font-extrabold text-[17.5px] font-heading tracking-tight leading-snug">
                    PRAKALP-DRISHTI
                  </h4>
                  <div className="text-[11px] text-slate-300 font-medium">
                    {t('ft_ministry_line', lang)}
                  </div>
                </div>
              </div>

              <p className="text-[12px] text-slate-300 leading-relaxed pr-3">
                {t('ft_blurb', lang)}
              </p>

              <div className="pt-2 text-[11.5px] text-slate-400 space-y-1.5 border-t border-slate-800/80">
                <div><span className="text-slate-200 font-medium">{t('ft_nodal_division', lang)}</span> {t('ft_nodal_division_val', lang)}</div>
                <div><span className="text-slate-200 font-medium">{t('ft_built_for', lang)}</span> {t('ft_built_for_val', lang)}</div>
              </div>

              {/* Official Social Channels & Network */}
              <div className="pt-2.5 border-t border-slate-800/80 space-y-2">
                <div className="text-[11px] font-bold text-amber-400/90 uppercase tracking-wider font-heading">
                  {t('ft_official_accounts', lang)}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href="https://twitter.com/GoI_MoSPI"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition-colors text-[11px] font-medium"
                    title="Official MoSPI X (Twitter)"
                  >
                    <span className="font-sans font-black text-[11px]">𝕏</span>
                    <span>@GoI_MoSPI</span>
                  </a>
                  <a
                    href="https://www.facebook.com/MoSPI.GoI"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition-colors text-[11px] font-medium"
                    title="Official MoSPI Facebook"
                  >
                    <Facebook className="w-3.5 h-3.5 fill-current text-blue-400" />
                    <span>MoSPI.GoI</span>
                  </a>
                  <a
                    href="https://data.gov.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition-colors text-[11px] font-medium"
                    title="Open Government Data Portal RSS"
                  >
                    <Rss className="w-3.5 h-3.5 text-amber-400" />
                    <span lang="en">data.gov.in</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Column 2: Public & Analytical Portals (Span 3) */}
            <div className="lg:col-span-3 space-y-3">
              <h5 className="text-[12px] font-bold text-amber-400 uppercase tracking-widest font-heading border-b border-slate-800 pb-2">
                {t('ft_analytical_portals', lang)}
              </h5>
              <ul className="space-y-2 text-[12.5px] text-slate-300">
                <li>
                  <Link to="/nagrik" className="hover:text-amber-300 transition-colors flex items-center gap-1.5 group font-medium text-emerald-300">
                    <ChevronRight className="w-3.5 h-3.5 text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                    <span>{t('ftlink_0', lang)}</span>
                  </Link>
                </li>
                <li>
                  <Link to="/decision-hub" className="hover:text-amber-300 transition-colors flex items-center gap-1.5 group">
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-300 group-hover:translate-x-0.5 transition-all" />
                    <span>{t('ftlink_1', lang)}</span>
                  </Link>
                </li>
                <li>
                  <Link to="/decision-hub?engine=satya_kavach" className="hover:text-amber-300 transition-colors flex items-center gap-1.5 group">
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-300 group-hover:translate-x-0.5 transition-all" />
                    <span>{t('ftlink_2', lang)}</span>
                  </Link>
                </li>
                <li>
                  <Link to="/decision-hub?engine=artha_nivaran" className="hover:text-amber-300 transition-colors flex items-center gap-1.5 group">
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-300 group-hover:translate-x-0.5 transition-all" />
                    <span>{t('ftlink_3', lang)}</span>
                  </Link>
                </li>
                <li>
                  <Link to="/decision-hub?engine=setu_varsha" className="hover:text-amber-300 transition-colors flex items-center gap-1.5 group">
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-300 group-hover:translate-x-0.5 transition-all" />
                    <span>{t('ftlink_4', lang)}</span>
                  </Link>
                </li>
                <li>
                  <Link to="/decision-hub?engine=karya_dakshata" className="hover:text-amber-300 transition-colors flex items-center gap-1.5 group">
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-300 group-hover:translate-x-0.5 transition-all" />
                    <span>{t('ftlink_5', lang)}</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: National Infrastructure Network (Span 2) */}
            <div className="lg:col-span-2 space-y-3">
              <h5 className="text-[12px] font-bold text-amber-400 uppercase tracking-widest font-heading border-b border-slate-800 pb-2">
                {t('ft_government_portals', lang)}
              </h5>
              <ul className="space-y-2 text-[12.5px] text-slate-300">
                <li>
                  <a href="https://mospi.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-amber-300 transition-colors block">
                    <span lang="en">MoSPI Official Website</span>
                  </a>
                </li>
                <li>
                  <a href="https://pmgatishakti.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-amber-300 transition-colors block">
                    <span lang="en">PM GatiShakti NMP</span>
                  </a>
                </li>
                <li>
                  <a href="https://data.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-amber-300 transition-colors block">
                    Open Government Data (OGD)
                  </a>
                </li>
                <li>
                  <a href="https://niti.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-amber-300 transition-colors block">
                    <span lang="en">NITI Aayog</span>
                  </a>
                </li>
                <li>
                  <a href="https://paimana-proj.mospi.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-amber-300 transition-colors block">
                    <span lang="en">PAIMANA Repository</span>
                  </a>
                </li>
                <li>
                  <a href="https://cloud.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-amber-300 transition-colors block">
                    <span lang="en">NIC MeghRaj Cloud</span>
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 4: Official Policies & Technical Hosting (Span 3) */}
            <div className="lg:col-span-3 space-y-3">
              <h5 className="text-[12px] font-bold text-amber-400 uppercase tracking-widest font-heading border-b border-slate-800 pb-2">
                {t('ft_policies_help', lang)}
              </h5>
              
              <ul className="space-y-2 text-[12.5px] text-slate-300">
                <li>
                  <a
                    href="/policies?tab=disclaimer"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-300 hover:text-amber-300 transition-colors flex items-center justify-between group py-0.5"
                  >
                    <span>{t('ftlink_6', lang)}</span>
                    <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-amber-300 transition-colors shrink-0" />
                  </a>
                </li>
                <li>
                  <a
                    href="/policies?tab=hyperlinking"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-300 hover:text-amber-300 transition-colors flex items-center justify-between group py-0.5"
                  >
                    <span>{t('ftlink_hyperlink', lang)}</span>
                    <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-amber-300 transition-colors shrink-0" />
                  </a>
                </li>
                <li>
                  <a
                    href="/policies?tab=privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-300 hover:text-amber-300 transition-colors flex items-center justify-between group py-0.5"
                  >
                    <span>{t('ftlink_7', lang)}</span>
                    <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-amber-300 transition-colors shrink-0" />
                  </a>
                </li>
                <li>
                  <a
                    href="/policies?tab=accessibility"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-300 hover:text-amber-300 transition-colors flex items-center justify-between group py-0.5"
                  >
                    <span>{t('ftlink_8', lang)}</span>
                    <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-amber-300 transition-colors shrink-0" />
                  </a>
                </li>
                <li>
                  <a
                    href="/policies?tab=grievance"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-300 hover:text-amber-300 transition-colors flex items-center justify-between group py-0.5"
                  >
                    <span>{t('ftlink_9', lang)}</span>
                    <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-amber-300 transition-colors shrink-0" />
                  </a>
                </li>
              </ul>

              {/* Previously asserted NIC hosting. It is a prototype; stating the
                  deployment target rather than a present fact keeps the claim true. */}
              <div className="pt-2.5 border-t border-slate-800/80 text-[11px] text-slate-300 space-y-1">
                <div>{t('ft_deployment_target', lang)} <strong className="text-slate-200">National Informatics Centre (NIC)</strong></div>
                <div>{t('ft_intended_owner', lang)} <strong className="text-slate-200">{t('ft_nodal_division_val', lang)}</strong></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Copyright Strip */}
      <div className="bg-[#030A12] text-slate-400 text-[12px] py-4 border-t border-slate-800/80">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-center sm:text-left">
          <span>&copy; {new Date().getFullYear()} {t('ft_copyright', lang)}</span>
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

/* ─── Chunk-loading fallback ─────────────────────────────────────
   Shown while a route's JavaScript is fetched. Government office links can be
   slow, and a silent blank frame reads as a failure. */
function RouteLoading() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3" role="status">
      <div className="w-7 h-7 rounded-full border-2 border-gov-border border-t-gov-navy animate-spin" aria-hidden="true" />
      <p className="text-[12.5px] text-gov-soft">Loading this section…</p>
    </div>
  );
}

/* ─── Animated Route Transitions ─────────────────────────────── */
function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="w-full"
      >
        <ErrorBoundary key={location.pathname} label={location.pathname}>
        <Suspense fallback={<RouteLoading />}>
        <Routes location={location}>
          {/* ── Tier 1: Public Citizen Unrestricted Routes ── */}
          <Route path="/" element={<AmeyMasterView />} />
          <Route path="/nagrik" element={<PublicDashboardView />} />
          <Route path="/admin/ingest" element={<AdminIngestView />} />
          <Route path="/admin/timeline" element={<MilestoneTimelineView />} />
          <Route path="/policies" element={<PoliciesView />} />
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
          <Route path="/soham" element={<Navigate to="/decision-hub?engine=karya_dakshata" replace />} />
          <Route path="/eo-auditor" element={<Navigate to="/decision-hub?engine=setu_varsha" replace />} />

          {/* Catch-all */}
          <Route path="*" element={<NotFoundView />} />
        </Routes>
        </Suspense>
        </ErrorBoundary>
      </motion.div>
    </AnimatePresence>
  );
}

/* ─── Global Scroll-To-Top Route & Search Watcher ─────────── */
function ScrollToTop() {
  const { pathname, search } = useLocation();
  const lenis = useLenis();

  useEffect(() => {
    // Immediate top reset
    scrollToTop(true);

    // Frame synchronization for lazy chunks and layout shifts
    const rafId = requestAnimationFrame(() => {
      scrollToTop(true);
    });

    // Secondary timer to guarantee top landing even after suspenseful chunk load
    const timer = setTimeout(() => {
      scrollToTop(true);
    }, 60);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timer);
    };
  }, [pathname, search, lenis]);

  return null;
}

/* ─── Main Application Shell ─────────────────────────────────── */
export default function App() {
  // The skip link is the first thing a keyboard or screen-reader user meets, so it
  // has to be in the language they chose before they reach anything else.
  const [appLang, setAppLang] = useState(() => getStoredLanguage());
  useEffect(() => {
    const onLang = (e) => setAppLang(e.detail || getStoredLanguage());
    window.addEventListener('prakalp:languageChanged', onLang);
    return () => window.removeEventListener('prakalp:languageChanged', onLang);
  }, []);

  return (
    <BrowserRouter>
      <SmoothScrollProvider>
        <ScrollToTop />
        <div className="min-h-screen flex flex-col bg-[#FAFAF9]">
          {/* WCAG 2.4.1 Bypass Blocks */}
          <a href="#main-content" className="skip-to-content">{t('skip_to_content', appLang)}</a>

          {/* Prototype provenance + the text-size and contrast controls the
              accessibility statement promises. Above the masthead, on every page. */}
          <AccessibilityBar />

          <ErrorBoundary label="site header">
            <InstitutionalHeader />
          </ErrorBoundary>

          <main id="main-content" tabIndex={-1} className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-3">
            <AnimatedRoutes />
          </main>

          <ErrorBoundary label="site footer">
            <InstitutionalFooter />
          </ErrorBoundary>
        </div>
      </SmoothScrollProvider>
    </BrowserRouter>
  );
}
