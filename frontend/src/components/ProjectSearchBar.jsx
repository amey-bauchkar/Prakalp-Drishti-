import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Search, X, MapPin, Building2, TrendingUp, AlertTriangle,
  Command, CheckCircle2, ChevronRight, Filter, Sparkles, Layers
} from 'lucide-react';

export default function ProjectSearchBar() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeProjectId, setActiveProjectId] = useState(() => {
    return localStorage.getItem('prakalp:selectedProjectId') || '618402';
  });

  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);
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
      if (e.key === 'Escape') {
        setIsOpen(false);
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

  const filteredProjects = useMemo(() => {
    const q = (query || "").trim().toLowerCase();
    let pool = projects;

    if (selectedFilter === 'DELAYED') {
      pool = pool.filter(p => Number(p.delayed_months || 0) > 0);
    } else if (selectedFilter !== 'ALL') {
      pool = pool.filter(p => p.sector === selectedFilter);
    }

    if (!q) {
      return [...pool]
        .sort((a, b) => (a.project_name || "").localeCompare(b.project_name || ""))
        .slice(0, 10);
    }

    return [...pool]
      .filter((p) => {
        const idStr = String(p.project_id || "").toLowerCase();
        const nameStr = String(p.project_name || "").toLowerCase();
        const stateStr = String(p.state || "").toLowerCase();
        const sectorStr = String(p.sector || "").toLowerCase();
        const compStr = String(p.company || "").toLowerCase();
        return (
          idStr.includes(q) ||
          nameStr.includes(q) ||
          stateStr.includes(q) ||
          sectorStr.includes(q) ||
          compStr.includes(q)
        );
      })
      .sort((a, b) => {
        const aId = String(a.project_id || "").toLowerCase();
        const bId = String(b.project_id || "").toLowerCase();
        const aName = (a.project_name || "").toLowerCase();
        const bName = (b.project_name || "").toLowerCase();

        const aIdStarts = aId.startsWith(q);
        const bIdStarts = bId.startsWith(q);
        if (aIdStarts && !bIdStarts) return -1;
        if (!aIdStarts && bIdStarts) return 1;

        const aStarts = aName.startsWith(q);
        const bStarts = bName.startsWith(q);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;

        return (a.project_name || "").localeCompare(b.project_name || "");
      })
      .slice(0, 20);
  }, [projects, query, selectedFilter]);

  // Reset selected index when filtered list changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredProjects]);

  const handleSelectProject = (projectId) => {
    setActiveProjectId(projectId);
    localStorage.setItem('prakalp:selectedProjectId', projectId);
    window.dispatchEvent(new CustomEvent('prakalp:selectProject', { detail: projectId }));
    setIsOpen(false);
    setQuery('');
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredProjects.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredProjects.length) % Math.max(1, filteredProjects.length));
    } else if (e.key === 'Enter' && filteredProjects[selectedIndex]) {
      e.preventDefault();
      handleSelectProject(filteredProjects[selectedIndex].project_id);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const filterOptions = [
    { id: 'ALL', label: 'All Projects' },
    { id: 'DELAYED', label: 'Delayed (> 0 mo)' },
    { id: 'ROAD TRANSPORT AND HIGHWAYS', label: 'Highways' },
    { id: 'RAILWAYS', label: 'Railways' },
    { id: 'POWER', label: 'Power' },
    { id: 'PETROLEUM', label: 'Petroleum' },
  ];

  return (
    <div ref={searchRef} className="relative w-full font-sans">
      {/* Search Input Container */}
      <div className="relative flex items-center group">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none group-focus-within:text-[#0060B6] transition-colors" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
          onKeyDown={handleKeyDown}
          placeholder="Search 2,207 projects, agencies, sectors, states… (Ctrl + K)"
          className="w-full pl-10 pr-24 py-2.5 text-[12.5px] bg-slate-50 hover:bg-white focus:bg-white text-slate-900 font-semibold border border-slate-200 focus:border-[#0060B6] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0060B6]/15 placeholder:text-slate-400 placeholder:font-normal transition-all shadow-xs"
        />

        <div className="absolute right-2.5 flex items-center gap-1.5">
          {query ? (
            <button
              onClick={() => { setQuery(''); inputRef.current?.focus(); }}
              className="text-slate-400 hover:text-slate-800 p-1 rounded-md transition-colors cursor-pointer"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono font-bold text-slate-500 bg-white border border-slate-200 rounded-md shadow-2xs">
              <Command className="w-2.5 h-2.5" /> K
            </kbd>
          )}
        </div>
      </div>

      {/* Rich Command Palette Dropdown Panel */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200/90 z-50 max-h-[480px] overflow-hidden flex flex-col animate-in fade-in-50 slide-in-from-top-2 duration-150 ring-1 ring-black/5">
          
          {/* Palette Category Filter Ribbon */}
          <div className="px-3 py-2 border-b border-slate-100 bg-slate-50/90 flex items-center gap-1.5 overflow-x-auto select-none no-scrollbar">
            {filterOptions.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setSelectedFilter(f.id)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg shrink-0 transition-all cursor-pointer ${
                  selectedFilter === f.id
                    ? 'bg-gov-navy text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200/80'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Subheader summary strip */}
          <div className="px-4 py-2 border-b border-slate-100 bg-white flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>{query.trim() === '' ? `Showing Top ${filteredProjects.length} Projects` : `Found ${filteredProjects.length} Matches`}</span>
            </span>
            <span className="text-slate-400">Navigate: ↑ ↓ · Select: ↵</span>
          </div>

          {/* Project List Items */}
          <div ref={listRef} data-lenis-prevent className="relative overflow-y-auto flex-1 divide-y divide-slate-100">
            {filteredProjects.length === 0 ? (
              <div className="px-4 py-12 text-center text-xs text-slate-500 space-y-2">
                <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto opacity-80" />
                <p>No projects found matching "<span className="font-bold text-slate-800">{query}</span>"</p>
                <p className="text-[11px] text-slate-400">Try searching by Project ID (e.g. 619092), state, or executing agency.</p>
              </div>
            ) : (
              filteredProjects.map((p, idx) => {
                const isCurrent = p.project_id === activeProjectId;
                const isHighlighted = idx === selectedIndex;
                const isDelayed = Number(p.delayed_months || 0) > 0;

                return (
                  <button
                    key={p.project_id}
                    onClick={() => handleSelectProject(p.project_id)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full text-left px-4 py-2.5 transition-all flex items-start justify-between gap-3 cursor-pointer ${
                      isHighlighted
                        ? 'bg-blue-50/80 border-l-4 border-[#0060B6]'
                        : isCurrent
                        ? 'bg-amber-50/50 border-l-4 border-amber-500'
                        : 'hover:bg-slate-50 border-l-4 border-transparent'
                    }`}
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10.5px] font-bold text-[#0060B6] bg-blue-50 px-2 py-0.5 rounded border border-blue-200/80">
                          #{p.project_id}
                        </span>
                        <span className="font-bold text-[12.5px] text-slate-900 truncate font-sans">
                          {p.project_name}
                        </span>
                        {isCurrent && (
                          <span className="text-[9.5px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded border border-amber-200">
                            Active
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2.5 text-[11px] text-slate-500 font-sans flex-wrap">
                        <span className="flex items-center gap-1 font-medium text-slate-700">
                          <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[140px] sm:max-w-[200px]">{p.sector}</span>
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="flex items-center gap-1 font-medium text-slate-700">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{p.state || 'National'}</span>
                        </span>
                        {isDelayed && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className="text-rose-700 font-bold flex items-center gap-0.5">
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              Delayed +{p.delayed_months}m
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-bold text-[12.5px] text-slate-900 font-heading">
                        ₹{Number(p.revised_cost_cr || p.original_cost_cr || 0).toLocaleString('en-IN')} Cr
                      </div>
                      <div className="text-[10.5px] text-emerald-700 font-bold font-mono">
                        {p.progress_perc != null ? `${p.progress_perc}%` : '—'} Done
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

