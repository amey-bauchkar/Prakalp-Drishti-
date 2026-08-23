import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, X, MapPin, Building, Activity, ChevronRight, Zap, ArrowUpRight } from 'lucide-react';

export default function ProjectSearchBar() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState(() => {
    return localStorage.getItem('prakalp:selectedProjectId') || '618402';
  });

  const searchRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Load all projects on initial mount or focus
  useEffect(() => {
    setLoading(true);
    fetch('/api/projects?limit=2207')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProjects(data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load project database for search:', err);
        setLoading(false);
      });
  }, []);

  // Listen to external project selections
  useEffect(() => {
    const handleSelect = (e) => {
      if (e.detail) {
        setActiveProjectId(String(e.detail));
      }
    };
    window.addEventListener('prakalp:selectProject', handleSelect);
    return () => window.removeEventListener('prakalp:selectProject', handleSelect);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter projects based on query
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
      }).slice(0, 10);

  const handleSelectProject = (projectId) => {
    setActiveProjectId(projectId);
    localStorage.setItem('prakalp:selectedProjectId', projectId);
    window.dispatchEvent(new CustomEvent('prakalp:selectProject', { detail: projectId }));
    setIsOpen(false);
    setQuery('');

    // If not on Decision Intelligence Hub, navigate to it
    if (location.pathname !== '/') {
      navigate('/');
    }
  };

  const activeProjectObj = projects.find((p) => p.project_id === activeProjectId);

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      {/* Search Input Box */}
      <div className="relative flex items-center">
        <div className="absolute left-3 text-slate-400 pointer-events-none flex items-center gap-1.5">
          <Search className="w-4 h-4 text-gov-accent" />
        </div>
        <input
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          placeholder="Search 2,207 projects (ID, State, Sector)..."
          className="w-full pl-9 pr-8 py-1.5 rounded-xl bg-white/10 text-white placeholder-slate-300 text-xs border border-white/20 focus:outline-none focus:ring-2 focus:ring-gov-accent focus:bg-gov-navy-dark transition-all shadow-inner"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-2.5 text-slate-300 hover:text-white p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Floating Autocomplete Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-elevated border border-gov-border overflow-hidden z-50 text-slate-800 animate-fade-in max-h-[480px] flex flex-col">
          {/* Top Quick-Header */}
          <div className="p-3 bg-slate-50 border-b border-gov-border flex items-center justify-between text-[11px]">
            <span className="font-black uppercase tracking-wider text-gov-muted">
              {query.trim() === '' ? '⚡ Recommended High-Impact Projects' : `Matching Projects (${filteredProjects.length})`}
            </span>
            <span className="text-[10px] text-gov-muted">
              {projects.length > 0 ? `${projects.length} loaded in RAM` : 'Loading...'}
            </span>
          </div>

          {/* Results List */}
          <div className="overflow-y-auto divide-y divide-gov-border flex-1">
            {filteredProjects.length === 0 ? (
              <div className="p-6 text-center text-xs text-gov-muted space-y-1">
                <p className="font-bold text-gov-navy">No projects found matching "{query}"</p>
                <p className="text-[11px]">Try searching by Project ID (e.g. 618402), State, or Sector name.</p>
              </div>
            ) : (
              filteredProjects.map((p) => {
                const isCurrent = p.project_id === activeProjectId;
                return (
                  <button
                    key={p.project_id}
                    onClick={() => handleSelectProject(p.project_id)}
                    className={`w-full text-left p-3.5 transition-colors flex items-start justify-between gap-3 hover:bg-slate-50 ${
                      isCurrent ? 'bg-amber-50/70 border-l-4 border-amber-500' : ''
                    }`}
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-black text-[10px] px-2 py-0.5 rounded bg-gov-surface border border-gov-border text-gov-navy">
                          #{p.project_id}
                        </span>
                        <span className="font-bold text-xs text-gov-navy truncate">
                          {p.project_name}
                        </span>
                        {isCurrent && (
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-200 text-amber-900">
                            Active in Cockpit
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-gov-muted flex-wrap">
                        <span className="flex items-center gap-1 font-medium">
                          <Building className="w-3 h-3 text-slate-400" /> {p.sector}
                        </span>
                        <span className="flex items-center gap-1 font-medium">
                          <MapPin className="w-3 h-3 text-slate-400" /> {p.state}
                        </span>
                        {p.delayed_months > 0 && (
                          <span className="text-rose-600 font-bold">
                            Delayed {p.delayed_months}m
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono font-black text-xs text-gov-navy block">
                        ₹{p.revised_cost_cr?.toLocaleString()} Cr
                      </span>
                      <span className="text-[10px] text-emerald-700 font-bold block">
                        {p.progress_perc}% Done
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Bottom Footer Info */}
          {activeProjectObj && (
            <div className="p-2.5 bg-gov-navy text-white text-[11px] flex items-center justify-between px-4">
              <span className="truncate max-w-[280px]">
                Currently Selected: <strong className="text-gov-accent">#{activeProjectObj.project_id} {activeProjectObj.project_name}</strong>
              </span>
              <span className="text-[10px] text-gov-accent font-bold">Click to load</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
