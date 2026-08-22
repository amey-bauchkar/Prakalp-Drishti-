import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Mail, Phone, MapPin, Send, Check } from 'lucide-react';
import Button from './Button';
import { useLanguage } from '../../../tanmay/i18n/LanguageContext';

/**
 * 4-Column Corporate Government Footer Component with i18n
 */
export const Footer = () => {
  const { t } = useLanguage();
  const [feedbackEmail, setFeedbackEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleFeedbackSubmit = (e) => {
    e.preventDefault();
    if (feedbackEmail.trim()) {
      setSubmitted(true);
      setTimeout(() => {
        setFeedbackEmail('');
        setSubmitted(false);
      }, 3000);
    }
  };

  return (
    <footer className="bg-gov-navy text-slate-300 border-t border-gov-navy-light pt-14 pb-8 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-white/10">
          
          {/* Column 1: About & Gov Mandate */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-gov-accent">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-base text-white tracking-tight block">
                  {t('footer.aboutTitle')}
                </span>
                <span className="text-[10px] text-gov-accent uppercase tracking-widest font-bold block">
                  Brihanmumbai Municipal Corporation (BMC)
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {t('footer.aboutText')}
            </p>
            <div className="mt-4 text-[11px] text-slate-400 space-y-1">
              <p className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-gov-accent" />
                <span>BMC Head Office, CST Fort, Mumbai — 400001</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-gov-accent" />
                <span>BMC Disaster & Citizen Helpline: 1916 / 1800-22-1234</span>
              </p>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h5 className="text-xs font-bold uppercase tracking-widest text-white mb-4">
              {t('footer.quickNav')}
            </h5>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <Link to="/" className="hover:text-gov-accent transition-colors">
                  {t('footer.citizenPortal')}
                </Link>
              </li>
              <li>
                <Link to="/report" className="hover:text-gov-accent transition-colors">
                  {t('footer.mobileReport')}
                </Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-gov-accent transition-colors">
                  {t('footer.adminDashboard')}
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-gov-accent transition-colors">
                  {t('footer.authLogin')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Civic Services & Categories */}
          <div>
            <h5 className="text-xs font-bold uppercase tracking-widest text-white mb-4">
              {t('footer.departments')}
            </h5>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li className="flex items-center justify-between">
                <span>{t('footer.roads')}</span>
                <span className="text-[10px] text-gov-accent font-bold">ACTIVE</span>
              </li>
              <li className="flex items-center justify-between">
                <span>{t('footer.sanitation')}</span>
                <span className="text-[10px] text-gov-accent font-bold">ACTIVE</span>
              </li>
              <li className="flex items-center justify-between">
                <span>{t('footer.water')}</span>
                <span className="text-[10px] text-gov-accent font-bold">ACTIVE</span>
              </li>
              <li className="flex items-center justify-between">
                <span>{t('footer.lighting')}</span>
                <span className="text-[10px] text-gov-accent font-bold">ACTIVE</span>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact / Newsletter Form */}
          <div>
            <h5 className="text-xs font-bold uppercase tracking-widest text-white mb-4">
              {t('footer.feedbackTitle')}
            </h5>
            <p className="text-xs text-slate-400 mb-3 leading-relaxed">
              {t('footer.feedbackText')}
            </p>
            <form onSubmit={handleFeedbackSubmit} className="space-y-2">
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="Enter citizen email..."
                  value={feedbackEmail}
                  onChange={(e) => setFeedbackEmail(e.target.value)}
                  className="w-full pl-3.5 pr-3.5 py-2 bg-white/10 border border-white/20 rounded-lg text-xs text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-gov-accent"
                />
              </div>
              <Button
                type="submit"
                variant="accent"
                size="sm"
                fullWidth
                icon={submitted ? Check : Send}
                className="font-bold text-xs py-2"
              >
                {submitted ? t('footer.subscribed') : t('footer.subscribe')}
              </Button>
            </form>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} {t('footer.rights')} SIH25031 Practice System.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-white transition-colors cursor-pointer">Privacy Policy</span>
            <span className="hover:text-white transition-colors cursor-pointer">Terms of Service</span>
            <span className="hover:text-white transition-colors cursor-pointer">Security Standards</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
