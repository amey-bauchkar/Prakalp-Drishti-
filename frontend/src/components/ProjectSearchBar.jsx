import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, X, MapPin, Building } from 'lucide-react';

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
      }).slice(0, 10);

  const handleSelectProject = (projectId) => {
    setActiveProjectId(projectId);
    localStorage.setItem('prakalp:selectedProjectId', projectId);
    window.dispatchEvent(new CustomEvent('prakalp:selectProject', { detail: projectId }));
    setIsOpen(false);
    setQuery('');
    if (location.pathname !== '/') navigate('/');
  };

  return (
    <div ref={searchRef} className="relative w-full">
      {/* Search input */}
      <div className="relative">
        <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
          placeholder="Search projects, agencies, sectors…"
          className="w-full pl-9 pr-8 py-2 text-[13px] bg-white border border-border-default rounded-md focus:outline-none focus:border-gov-navy focus:ring-1 focus:ring-gov-navy/20 placeholder:text-text-muted transition-colors"
        />
        {query && (
          <button onClick={() => setQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-0.5">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-md shadow-menu border border-border-default z-50 max-h-[400px] overflow-hidden flex flex-col">
          <div className="px-4 py-2.5 border-b border-border-default text-[11px] font-semibold text-text-muted uppercase tracking-wider">
            {query.trim() === '' ? 'Suggested projects' : `${filteredProjects.length} results`}
          </div>

          <div className="overflow-y-auto flex-1">
            {filteredProjects.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-text-muted">
                No projects found matching "{query}"
              </div>
            ) : (
              filteredProjects.map((p) => {
                const isCurrent = p.project_id === activeProjectId;
                return (
                  <button
                    key={p.project_id}
                    onClick={() => handleSelectProject(p.project_id)}
                    className={`w-full text-left px-4 py-3 text-[13px] hover:bg-gray-50 transition-colors flex items-start justify-between gap-3 border-b border-border-default last:border-0 ${
                      isCurrent ? 'bg-gov-saffron-light' : ''
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-text-muted">#{p.project_id}</span>
                        <span className="font-medium text-text-primary truncate">{p.project_name}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[12px] text-text-muted">
                        <span className="flex items-center gap-1"><Building className="w-3 h-3" />{p.sector}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{p.state}</span>
                        {p.delayed_months > 0 && (
                          <span className="text-gov-danger font-medium">Delayed {p.delayed_months}m</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-medium text-[13px] text-text-primary">₹{p.revised_cost_cr?.toLocaleString()} Cr</div>
                      <div className="text-[11px] text-gov-success font-medium">{p.progress_perc}% complete</div>
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
