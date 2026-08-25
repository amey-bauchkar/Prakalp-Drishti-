import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, NavLink, useLocation } from 'react-router-dom';
import { Search, Menu, X, ChevronRight } from 'lucide-react';

import AmeyMasterView from '../amey/index.jsx';
import SatyaKavachView from '../tanmay/index.jsx';
import ArthaNetraView from '../parth/index.jsx';
import VarshaSpeedView from '../janhavi/index.jsx';
import DPRScorerView from '../soham/index.jsx';
import EOAuditorView from '../aditya/index.jsx';
import ProjectSearchBar from './components/ProjectSearchBar.jsx';
import KaryaDakshataSimulator from './components/KaryaDakshataSimulator.jsx';

/* ─── Government Utility Bar ─────────────────────────────────── */
function UtilityBar() {
  return (
    <div className="bg-gov-navy-dark text-[11px] text-gray-300 py-1.5">
      <div className="gov-content flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-white font-medium">भारत सरकार</span>
          <span className="opacity-40">|</span>
          <span>Government of India</span>
          <span className="opacity-30 hidden sm:inline">·</span>
          <span className="hidden sm:inline">Ministry of Statistics &amp; Programme Implementation</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden sm:inline opacity-70">Accessibility</span>
          <span className="hidden sm:inline opacity-70">Contact</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Institutional Header + Navigation ──────────────────────── */
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
    { to: '/', label: 'Home' },
    { to: '/tanmay', label: 'SATYA-KAVACH' },
    { to: '/parth', label: 'ARTHA-NETRA' },
    { to: '/janhavi', label: 'VARSHA-SPEED' },
    { to: '/soham', label: 'DPR-SCORER' },
    { to: '/karya-dakshata', label: 'KARYA-DAKSHATA' },
  ];

  return (
    <header className="bg-white border-b border-border-default sticky top-0 z-50">
      <div className="gov-content">
        {/* Brand + Search + Mobile toggle */}
        <div className="flex items-center justify-between py-3 gap-6">
          <Link to="/" className="shrink-0 group">
            <div className="text-gov-navy font-semibold text-lg tracking-tight leading-tight">
              PRAKALP-DRISHTI
            </div>
            <div className="text-[11px] text-text-muted font-medium tracking-wide">
              National Infrastructure Analytics
            </div>
          </Link>

          {/* Desktop search */}
          <div className="flex-1 max-w-md hidden lg:block">
            <ProjectSearchBar />
          </div>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `px-3 py-2 text-[13px] font-medium rounded transition-colors ${
                    isActive
                      ? 'text-gov-navy font-semibold bg-gov-saffron-light'
                      : 'text-text-secondary hover:text-gov-navy hover:bg-gray-50'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 text-gov-navy hover:bg-gray-50 rounded"
            aria-label="Menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile search */}
        <div className="lg:hidden pb-3">
          <ProjectSearchBar />
        </div>
      </div>

      {/* Saffron active indicator line (desktop) */}
      <div className="hidden lg:block gov-content">
        <div className="flex">
          {navItems.map((item) => {
            const isActive = item.to === '/'
              ? location.pathname === '/'
              : location.pathname === item.to;
            return (
              <div
                key={item.to}
                className="px-3"
                style={{ visibility: isActive ? 'visible' : 'hidden' }}
              >
                <div className="h-[2px] bg-gov-saffron rounded-t" style={{ width: '100%' }} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-border-default bg-white">
          <nav className="gov-content py-3 space-y-1">
            {navItems.map((item) => {
              const isActive = item.to === '/'
                ? location.pathname === '/'
                : location.pathname === item.to;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`block px-3 py-2.5 text-sm font-medium rounded ${
                    isActive
                      ? 'text-gov-navy bg-gov-saffron-light border-l-2 border-gov-saffron'
                      : 'text-text-secondary hover:bg-gray-50'
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

/* ─── Breadcrumbs ────────────────────────────────────────────── */
function Breadcrumbs() {
  const location = useLocation();
  if (location.pathname === '/') return null;

  const labels = {
    '/tanmay': 'SATYA-KAVACH',
    '/parth': 'ARTHA-NETRA',
    '/janhavi': 'VARSHA-SPEED',
    '/soham': 'DPR-SCORER',
    '/karya-dakshata': 'KARYA-DAKSHATA',
  };

  const current = labels[location.pathname] || location.pathname;

  return (
    <div className="breadcrumbs">
      <Link to="/">Home</Link>
      <span className="sep">/</span>
      <span>Analytics</span>
      <span className="sep">/</span>
      <span className="text-text-primary font-medium">{current}</span>
    </div>
  );
}

/* ─── Institutional Footer ───────────────────────────────────── */
function InstitutionalFooter() {
  return (
    <footer className="bg-gov-navy-dark text-gray-400 mt-auto">
      <div className="gov-content py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Identity */}
          <div className="space-y-3">
            <div className="text-white font-semibold text-base">PRAKALP-DRISHTI</div>
            <p className="text-[13px] leading-relaxed text-gray-400">
              Autonomous decision intelligence platform for central sector mega-projects.
              Monitoring 2,207 public infrastructure works under MoSPI Problem Statement SIH26103.
            </p>
            <div className="text-[12px] text-gray-500 pt-1">
              Ministry of Statistics &amp; Programme Implementation<br />
              Government of India · New Delhi
            </div>
          </div>

          {/* Analytics */}
          <div className="space-y-3">
            <div className="text-[11px] uppercase tracking-wider font-semibold text-gray-300">Analytics</div>
            <ul className="space-y-2 text-[13px]">
              <li><Link to="/" className="text-gray-400 hover:text-gov-saffron transition-colors">Decision Intelligence Hub</Link></li>
              <li><Link to="/tanmay" className="text-gray-400 hover:text-gov-saffron transition-colors">SATYA-KAVACH — Contract Compliance</Link></li>
              <li><Link to="/parth" className="text-gray-400 hover:text-gov-saffron transition-colors">ARTHA-NETRA — PSU Solvency</Link></li>
              <li><Link to="/janhavi" className="text-gray-400 hover:text-gov-saffron transition-colors">VARSHA-SPEED — Monsoon Impact</Link></li>
              <li><Link to="/soham" className="text-gray-400 hover:text-gov-saffron transition-colors">DPR-SCORER — Proposal Quality</Link></li>
              <li><Link to="/karya-dakshata" className="text-gray-400 hover:text-gov-saffron transition-colors">KARYA-DAKSHATA — De-Biasing Simulator</Link></li>
            </ul>
          </div>

          {/* Framework */}
          <div className="space-y-3">
            <div className="text-[11px] uppercase tracking-wider font-semibold text-gray-300">Statutory Framework</div>
            <ul className="space-y-2 text-[13px] text-gray-400">
              <li>CCEA 20% Cost Overrun Threshold</li>
              <li>CPWD Clause 10CC Escalation Cap</li>
              <li>Public Investment Board Guidelines</li>
              <li>NITI Aayog Review Framework</li>
              <li>National Election Commission Calendar</li>
            </ul>
          </div>

          {/* Platform */}
          <div className="space-y-3">
            <div className="text-[11px] uppercase tracking-wider font-semibold text-gray-300">Platform</div>
            <ul className="space-y-2 text-[13px] text-gray-400">
              <li>Methodology</li>
              <li>Data Sources</li>
              <li>Coverage &amp; Limitations</li>
              <li>Accessibility Statement</li>
              <li>Terms of Use</li>
            </ul>
            <div className="pt-3 text-[12px] text-gray-500">
              Air-gapped sovereign deployment.<br />
              All computation runs locally.
            </div>
          </div>
        </div>
      </div>

      {/* Bottom legal strip */}
      <div className="border-t border-white/10">
        <div className="gov-content py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[12px] text-gray-500">
          <span>© {new Date().getFullYear()} Government of India · Smart India Hackathon 2026</span>
          <div className="flex items-center gap-4">
            <span>Privacy Policy</span>
            <span>Copyright</span>
            <span>Disclaimer</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ─── App Shell ──────────────────────────────────────────────── */
export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col font-sans">
        <UtilityBar />
        <InstitutionalHeader />

        <main className="flex-1">
          <div className="gov-content py-8">
            <Breadcrumbs />
            <Routes>
              <Route path="/" element={<AmeyMasterView />} />
              <Route path="/tanmay" element={<SatyaKavachView />} />
              <Route path="/parth" element={<ArthaNetraView />} />
              <Route path="/janhavi" element={<VarshaSpeedView />} />
              <Route path="/soham" element={<DPRScorerView />} />
              <Route path="/aditya" element={<EOAuditorView />} />
              <Route path="/karya-dakshata" element={<KaryaDakshataSimulator />} />
            </Routes>
          </div>
        </main>

        <InstitutionalFooter />
      </div>
    </BrowserRouter>
  );
}
