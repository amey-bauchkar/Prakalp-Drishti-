import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  Building2, Clock, GitBranch, DollarSign, FileText, 
  ShieldAlert, TrendingUp, CloudRain, Search, Sparkles, 
  MapPin, CheckCircle2, Layers, Globe, ShieldCheck 
} from 'lucide-react';

import AmeyMasterView from '../amey/index.jsx';

// Shell Navigation Header
const MasterNavbar = () => {
  const location = useLocation();
  const [lang, setLang] = useState('en');

  const navItems = [
    { path: '/', label: 'Amey · Decision Hub', icon: Sparkles, badge: 'Core 4' },
    { path: '/tanmay', label: 'Satya-Kavach', icon: ShieldAlert, badge: '20% Evasion' },
    { path: '/parth', label: 'Artha-Netra', icon: TrendingUp, badge: 'PSU Health' },
    { path: '/janhavi', label: 'Varsha-Speed', icon: CloudRain, badge: 'Monsoon' },
    { path: '/soham', label: 'DPR-Scorer', icon: FileText, badge: 'Proposal QC' },
    { path: '/aditya', label: 'EO-Auditor', icon: MapPin, badge: 'Satellite' },
  ];

  return (
    <header className="bg-gov-navy text-white sticky top-0 z-40 border-b border-gov-navy-light shadow-elevated">
      {/* Top Gold Tricolor Accent Bar */}
      <div className="h-1 bg-gradient-to-r from-[#FF9933] via-white to-[#138808]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gov-accent flex items-center justify-center text-gov-navy font-black shadow-soft">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-base tracking-tight text-white">प्रकल्प-दृष्टि</span>
                <span className="text-[10px] font-black uppercase tracking-widest bg-white/10 text-gov-accent px-2 py-0.5 rounded border border-white/20">
                  PRAKALP-DRISHTI
                </span>
              </div>
              <span className="text-[10px] text-gov-muted-light block">
                MoSPI Central Sector Mega-Projects Decision Intelligence System
              </span>
            </div>
          </div>

          {/* Right Header Badges */}
          <div className="hidden md:flex items-center gap-3 text-xs">
            <span className="px-2.5 py-1 rounded bg-white/10 text-white/90 border border-white/20 font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              2,207 Projects (₹31.4L Cr)
            </span>
            <span className="px-2.5 py-1 rounded bg-emerald-900/60 text-emerald-300 border border-emerald-500/30 font-bold">
              Air-Gapped Sovereign Ready
            </span>
          </div>
        </div>

        {/* Navigation Bar */}
        <div className="flex overflow-x-auto py-2 gap-2 border-t border-white/10 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                  isActive
                    ? 'bg-gov-accent text-gov-navy shadow-soft'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded font-black ${
                  isActive ? 'bg-gov-navy text-gov-accent' : 'bg-white/10 text-white/70'
                }`}>
                  {item.badge}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
};

// Placeholder for other team members' views until they push their code
const MemberPlaceholder = ({ name, title, desc, icon: Icon }) => (
  <div className="p-12 text-center bg-white rounded-2xl border border-gov-border shadow-card space-y-4 max-w-2xl mx-auto my-10">
    <div className="w-16 h-16 bg-gov-surface rounded-2xl flex items-center justify-center mx-auto text-gov-navy shadow-soft border border-gov-border">
      <Icon className="w-8 h-8 text-gov-accent-dark" />
    </div>
    <div className="space-y-1">
      <span className="text-[10px] font-black text-gov-muted uppercase tracking-widest bg-gov-surface px-2.5 py-1 rounded border border-gov-border">
        {name}'s Feature Workspace
      </span>
      <h2 className="text-xl font-black text-gov-navy">{title}</h2>
      <p className="text-xs text-gov-muted leading-relaxed">{desc}</p>
    </div>
    <div className="p-3 bg-gov-surface rounded-xl border border-gov-border text-xs text-gov-text-muted font-medium">
      Module slot reserved in <code>frontend/{name.toLowerCase()}/</code>. When {name} commits code, their view will automatically render here without conflicts.
    </div>
  </div>
);

export const App = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gov-surface flex flex-col font-sans">
        <MasterNavbar />
        
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            {/* Amey's 4 Decision Engines (Home Route) */}
            <Route path="/" element={<AmeyMasterView />} />

            {/* Other Team Members' Workspaces */}
            <Route
              path="/tanmay"
              element={
                <MemberPlaceholder
                  name="Tanmay"
                  title="SATYA-KAVACH: 20% Cost Overrun Anti-Gaming Detector"
                  desc="Detects artificial clustering of budget increases under the mandatory 20% Cabinet approval rule and audits contractor material escalation claims."
                  icon={ShieldAlert}
                />
              }
            />
            <Route
              path="/parth"
              element={
                <MemberPlaceholder
                  name="Parth"
                  title="ARTHA-NETRA: PSU Financial Health & Stock Market Risk"
                  desc="Tracks PSU contractor debt levels, Altman Z-scores, and stock market volatility to predict insolvency-induced construction delays."
                  icon={TrendingUp}
                />
              }
            />
            <Route
              path="/janhavi"
              element={
                <MemberPlaceholder
                  name="Janhavi"
                  title="VARSHA-SPEED: Monsoon Working-Window Contraction Engine"
                  desc="Calculates lost construction days per millimeter of excess rainfall using historical 2005–2025 IMD rainfall anomalies."
                  icon={CloudRain}
                />
              }
            />
            <Route
              path="/soham"
              element={
                <MemberPlaceholder
                  name="Soham"
                  title="DPR-SCORER: Proposal Quality & Pre-Election Rush Detector"
                  desc="Analyzes project scoping completeness and flags rushed pre-election approvals sanctioned within 90 days of assembly elections."
                  icon={FileText}
                />
              }
            />
            <Route
              path="/aditya"
              element={
                <MemberPlaceholder
                  name="Aditya"
                  title="EO-AUDITOR: Satellite Ground Truth Corroboration"
                  desc="Dual-epoch optical satellite verification comparing self-reported progress against ground earth observation."
                  icon={MapPin}
                />
              }
            />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gov-border py-6 text-center text-xs text-gov-muted">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="font-bold text-gov-navy">
              प्रकल्प-दृष्टि (Prakalp-Drishti) · Smart India Hackathon 2026
            </span>
            <span className="text-[11px]">
              MoSPI Problem Statement SIH26103 · Built with zero mock data on 2,207 live projects
            </span>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
};

export default App;
