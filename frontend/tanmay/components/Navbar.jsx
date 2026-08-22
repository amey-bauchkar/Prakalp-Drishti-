import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { 
  Building2, 
  Globe2, 
  LogIn, 
  LogOut, 
  ShieldCheck, 
  FilePlus, 
  LayoutDashboard,
  Check,
  MapPin,
  Search,
  Wrench,
  Menu,
  X
} from 'lucide-react';
import Button from '../../src/components/ui/Button';

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { lang, switchLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileMenuOpen(false);
  };

  const isNearbyView = location.pathname === '/nearby';
  const isTrackView = location.pathname === '/track';
  const isAdminView = location.pathname.startsWith('/admin');
  const isWorkerView = location.pathname === '/worker';
  const isLoginView = location.pathname === '/login';

  const isWorker = user?.role === 'worker';
  const isAdmin = user?.role === 'admin' || (!isWorker && isAuthenticated);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gov-border shadow-soft transition-all duration-150 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          
          {/* Brand Logo & Title */}
          <Link 
            to="/" 
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-gov-navy rounded-lg p-1"
          >
            <div className="w-10 h-10 rounded-lg bg-gov-navy text-gov-accent flex items-center justify-center font-bold text-lg shadow-soft group-hover:bg-gov-navy-light transition-colors flex-shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg text-gov-navy tracking-tight">
                  Mumbai <span className="text-gov-muted">Civic Portal</span>
                </span>
                <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold bg-gov-surface text-gov-navy border border-gov-border uppercase tracking-wider">
                  BMC / MCGM
                </span>
              </div>
              <span className="text-[11px] text-gov-muted font-medium -mt-0.5 hidden sm:inline-block">
                Brihanmumbai Municipal Corporation • Civic Resolution System
              </span>
            </div>
          </Link>

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-1.5">
            <Link
              to="/"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                location.pathname === '/' 
                  ? 'text-gov-navy bg-gov-surface font-extrabold border border-gov-border' 
                  : 'text-gov-muted hover:text-gov-navy hover:bg-gov-surface'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>{t('nav.commandCenter')}</span>
            </Link>

            <Link
              to="/report"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                location.pathname === '/report' 
                  ? 'text-gov-navy bg-gov-surface font-extrabold border border-gov-border' 
                  : 'text-gov-muted hover:text-gov-navy hover:bg-gov-surface'
              }`}
            >
              <FilePlus className="w-4 h-4" />
              <span>{t('nav.citizenReport')}</span>
            </Link>

            <Link
              to="/nearby"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                isNearbyView 
                  ? 'text-gov-navy bg-gov-surface font-extrabold border border-gov-border' 
                  : 'text-gov-muted hover:text-gov-navy hover:bg-gov-surface'
              }`}
            >
              <MapPin className="w-4 h-4 text-gov-accent-dark" />
              <span>{t('nav.nearbyIssues')}</span>
            </Link>

            <Link
              to="/track"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                isTrackView 
                  ? 'text-gov-navy bg-gov-surface font-extrabold border border-gov-border' 
                  : 'text-gov-muted hover:text-gov-navy hover:bg-gov-surface'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>{t('nav.trackComplaint')}</span>
            </Link>

            {isAuthenticated && isWorker && (
              <Link
                to="/worker"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                  isWorkerView 
                    ? 'text-gov-navy bg-gov-surface font-extrabold border border-gov-border' 
                    : 'text-gov-muted hover:text-gov-navy hover:bg-gov-surface'
                }`}
              >
                <Wrench className="w-4 h-4 text-emerald-600" />
                <span>{t('nav.workerDashboard')}</span>
              </Link>
            )}

            {isAuthenticated && isAdmin && (
              <Link
                to="/admin"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                  isAdminView 
                    ? 'text-gov-navy bg-gov-surface font-extrabold border border-gov-border' 
                    : 'text-gov-muted hover:text-gov-navy hover:bg-gov-surface'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-gov-navy" />
                <span>Admin Triage</span>
              </Link>
            )}
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Language Switcher */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="flex items-center gap-1.5 px-2.5 py-2 text-xs font-bold uppercase tracking-wider text-gov-navy bg-gov-surface hover:bg-slate-200 rounded-lg transition-colors border border-gov-border cursor-pointer"
                title="Change Language"
                aria-label="Language Selector"
              >
                <Globe2 className="w-3.5 h-3.5 text-gov-muted" />
                <span>{lang === 'en' ? 'EN' : 'HI'}</span>
              </button>

              {langMenuOpen && (
                <div 
                  className="absolute right-0 mt-2 w-36 bg-white rounded-lg shadow-elevated border border-gov-border py-1.5 z-50 animate-fadeIn"
                  onMouseLeave={() => setLangMenuOpen(false)}
                >
                  <button
                    type="button"
                    onClick={() => { switchLanguage('en'); setLangMenuOpen(false); }}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs text-gov-text hover:bg-gov-surface text-left font-bold cursor-pointer"
                  >
                    <span>English</span>
                    {lang === 'en' && <Check className="w-3.5 h-3.5 text-gov-navy" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => { switchLanguage('hi'); setLangMenuOpen(false); }}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs text-gov-text hover:bg-gov-surface text-left font-bold cursor-pointer"
                  >
                    <span>हिंदी (Hindi)</span>
                    {lang === 'hi' && <Check className="w-3.5 h-3.5 text-gov-navy" />}
                  </button>
                </div>
              )}
            </div>

            {/* Auth Action Button (Desktop) */}
            <div className="hidden sm:block">
              {isAuthenticated ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gov-navy bg-gov-surface border border-gov-border rounded-lg">
                    <ShieldCheck className="w-3.5 h-3.5 text-gov-navy" />
                    <span className="truncate max-w-[120px]">{user?.name || user?.email?.split('@')[0]}</span>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    icon={LogOut}
                    className="text-xs"
                  >
                    <span>{t('nav.logout')}</span>
                  </Button>
                </div>
              ) : (
                <Link to="/login">
                  <Button
                    variant={isLoginView ? 'secondary' : 'primary'}
                    size="sm"
                    icon={LogIn}
                    className="font-bold text-xs"
                  >
                    <span>{t('nav.adminLogin')}</span>
                  </Button>
                </Link>
              )}
            </div>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg bg-gov-surface text-gov-navy border border-gov-border hover:bg-slate-200 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

          </div>

        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gov-border py-4 space-y-2 animate-fadeIn bg-white">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-xs font-bold text-gov-navy hover:bg-gov-surface"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>{t('nav.commandCenter')}</span>
            </Link>

            <Link
              to="/report"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-xs font-bold text-gov-navy hover:bg-gov-surface"
            >
              <FilePlus className="w-4 h-4" />
              <span>{t('nav.citizenReport')}</span>
            </Link>

            <Link
              to="/nearby"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-xs font-bold text-gov-navy hover:bg-gov-surface"
            >
              <MapPin className="w-4 h-4" />
              <span>{t('nav.nearbyIssues')}</span>
            </Link>

            <Link
              to="/track"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-xs font-bold text-gov-navy hover:bg-gov-surface"
            >
              <Search className="w-4 h-4" />
              <span>{t('nav.trackComplaint')}</span>
            </Link>

            {isAuthenticated && isWorker && (
              <Link
                to="/worker"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100"
              >
                <Wrench className="w-4 h-4 text-emerald-600" />
                <span>{t('nav.workerDashboard')}</span>
              </Link>
            )}

            {isAuthenticated && isAdmin && (
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-xs font-bold text-gov-navy hover:bg-gov-surface"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Admin Triage Dashboard</span>
              </Link>
            )}

            <div className="pt-3 border-t border-gov-border px-4">
              {isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200 hover:bg-rose-100"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t('nav.logout')} ({user?.name || user?.email?.split('@')[0]})</span>
                </button>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-gov-navy text-white text-xs font-bold uppercase tracking-wider"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{t('nav.adminLogin')}</span>
                </Link>
              )}
            </div>
          </div>
        )}

      </div>
    </header>
  );
};

export default Navbar;
