import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, X, MapPin, Building2, TrendingUp, AlertTriangle, Command } from 'lucide-react';

export default function ProjectSearchBar() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState(() => {
    return localStorage.getItem('prakalp:selectedProjectId') || '618402';
  });

  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setLoading(true);
    fetch('/api/projects?limit=2207')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setProjects(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Global Ctrl+K / Cmd+K listener to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleSelect = (e) => {
      if (e.detail) setActiveProjectId(String(e.detail));
    };
    window.addEventListener('prakalp:selectProject', handleSelect);
    return () => window.removeEventListener('prakalp:selectProject', handleSelect);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredProjects = query.trim() === ''
    ? projects.slice(0, 6)
    : projects.filter((p) => {
        const q = query.toLowerCase();
        return (
          p.project_id.toLowerCase().includes(q) ||
          p.project_name.toLowerCase().includes(q) ||
          (p.state && p.state.toLowerCase().includes(q)) ||
          (p.sector && p.sector.toLowerCase().includes(q)) ||
          (p.company && p.company.toLowerCase().includes(q))
        );
      }).slice(0, 12);

  const handleSelectProject = (projectId) => {
    setActiveProjectId(projectId);
    localStorage.setItem('prakalp:selectedProjectId', projectId);
    window.dispatchEvent(new CustomEvent('prakalp:selectProject', { detail: projectId }));
    setIsOpen(false);
    setQuery('');
    if (location.pathname !== '/' && location.pathname !== '/decision-hub') {
      navigate('/decision-hub');
    }
  };

  return (
    <div ref={searchRef} className="relative w-full">
      {/* Search Input Container */}
      <div className="relative flex items-center">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
          placeholder="Search 2,207 projects, agencies, sectors, states…"
          className="w-full pl-10 pr-20 py-2.5 text-[12.5px] bg-slate-50 hover:bg-white focus:bg-white text-gov-navy font-bold border border-slate-200 focus:border-gov-navy rounded-xl focus:outline-none focus:ring-2 focus:ring-gov-navy/10 placeholder:text-slate-400 placeholder:font-normal transition-all shadow-xs"
        />

        <div className="absolute right-2.5 flex items-center gap-1.5 pointer-events-none">
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="pointer-events-auto text-slate-400 hover:text-gov-navy p-1 rounded-md transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono font-bold text-slate-400 bg-white border border-slate-200 rounded-md shadow-xs">
              <Command className="w-2.5 h-2.5" /> K
            </kbd>
          )}
        </div>
      </div>

      {/* Rich Dropdown Panel */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-elevated border border-border-default z-50 max-h-[420px] overflow-hidden flex flex-col animate-in fade-in-50 slide-in-from-top-2 duration-150">
          <div className="px-4 py-2.5 border-b border-border-default bg-slate-50 flex items-center justify-between text-[11px] font-bold text-text-muted uppercase tracking-wider font-mono">
            <span>{query.trim() === '' ? 'Quick access projects' : `Found ${filteredProjects.length} matching projects`}</span>
            <span>MoSPI Database</span>
          </div>

          <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
            {filteredProjects.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-text-muted">
                No projects found matching "<span className="font-bold text-gov-navy">{query}</span>"
              </div>
            ) : (
              filteredProjects.map((p) => {
                const isCurrent = p.project_id === activeProjectId;
                return (
                  <button
                    key={p.project_id}
                    onClick={() => handleSelectProject(p.project_id)}
                    className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex items-start justify-between gap-3 ${
                      isCurrent ? 'bg-gov-saffron-light/60 border-l-4 border-gov-saffron' : ''
                    }`}
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-gov-saffron-dark bg-gov-saffron-light px-2 py-0.5 rounded-md border border-gov-gold-border">
                          #{p.project_id}
                        </span>
                        <span className="font-bold text-[13px] text-gov-navy truncate font-sans">
                          {p.project_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11.5px] text-text-muted font-sans flex-wrap">
                        <span className="flex items-center gap-1 font-medium text-slate-600">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          {p.sector}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-medium text-slate-600">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {p.state}
                        </span>
                        {p.delayed_months > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-rose-600 font-bold flex items-center gap-0.5 font-mono">
                              <AlertTriangle className="w-3 h-3" />
                              Delayed +{p.delayed_months}m
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold text-[13px] text-gov-navy font-mono">
                        ₹{Number(p.revised_cost_cr || 0).toLocaleString('en-IN')} Cr
                      </div>
                      <div className="text-[10.5px] text-emerald-700 font-bold font-mono">
                        {p.progress_perc || 0}% Progress
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
