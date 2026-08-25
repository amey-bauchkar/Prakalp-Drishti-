import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  Building2, Clock, GitBranch, DollarSign, FileText, 
  ShieldAlert, TrendingUp, CloudRain, Search, Sparkles, 
  MapPin, CheckCircle2, Layers, Globe, ShieldCheck 
} from 'lucide-react';

// Member Views (Zero-Conflict Modular Imports)
import AmeyMasterView from '../amey/index.jsx';
import SatyaKavachView from '../tanmay/index.jsx';
import ArthaNetraView from '../parth/index.jsx';
import VarshaSpeedView from '../janhavi/index.jsx';
import DPRScorerView from '../soham/index.jsx';
import EOAuditorView from '../aditya/index.jsx';
import ProjectSearchBar from './components/ProjectSearchBar.jsx';
import KaryaDakshataSimulator from './components/KaryaDakshataSimulator.jsx';

// Shell Navigation Header
const MasterNavbar = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Decision Intelligence Hub', icon: Sparkles, badge: 'Core 5 Engines' },
    { path: '/tanmay', label: 'Satya-Kavach', icon: ShieldAlert, badge: '20% Anti-Gaming' },
    { path: '/parth', label: 'Artha-Netra', icon: TrendingUp, badge: 'PSU Health' },
    { path: '/janhavi', label: 'Varsha-Speed', icon: CloudRain, badge: 'Monsoon Impact' },
    { path: '/soham', label: 'DPR-Scorer', icon: FileText, badge: 'Proposal QC' },
    { path: '/aditya', label: 'EO-Auditor', icon: MapPin, badge: 'Satellite War Room' },
    { path: '/karya-dakshata', label: 'Karya-Dakshata', icon: Layers, badge: 'De-Biasing' },
  ];

  return (
    <header className="bg-gov-navy text-white sticky top-0 z-40 border-b border-gov-navy-light shadow-elevated">
      {/* Top Gold Tricolor Accent Bar */}
      <div className="h-1 bg-gradient-to-r from-[#FF9933] via-white to-[#138808]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand & Logo */}
          <div className="flex items-center gap-3 shrink-0">
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
              <span className="text-[10px] text-gov-muted-light block hidden sm:block">
                MoSPI Central Sector Mega-Projects Decision Intelligence System
              </span>
            </div>
          </div>

          {/* Center: Global Project Search Bar across 2,207 projects */}
          <div className="flex-1 max-w-md hidden md:block">
            <ProjectSearchBar />
          </div>

          {/* Right Header Badges */}
          <div className="hidden lg:flex items-center gap-3 text-xs shrink-0">
            <span className="px-2.5 py-1 rounded bg-white/10 text-white/90 border border-white/20 font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              2,207 Projects (₹31.4L Cr)
            </span>
            <span className="px-2.5 py-1 rounded bg-emerald-900/60 text-emerald-300 border border-emerald-500/30 font-bold">
              Air-Gapped
            </span>
          </div>
        </div>

        {/* Mobile Search Bar Row (Visible on small screens) */}
        <div className="md:hidden pb-2">
          <ProjectSearchBar />
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

export const App = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gov-surface flex flex-col font-sans">
        <MasterNavbar />
        
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            {/* Core Decision Engines (Amey) */}
            <Route path="/" element={<AmeyMasterView />} />

            {/* Teammate Dedicated Views */}
            <Route path="/tanmay" element={<SatyaKavachView />} />
            <Route path="/parth" element={<ArthaNetraView />} />
            <Route path="/janhavi" element={<VarshaSpeedView />} />
            <Route path="/soham" element={<DPRScorerView />} />
            <Route path="/aditya" element={<EOAuditorView />} />
            <Route path="/karya-dakshata" element={<KaryaDakshataSimulator />} />
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
