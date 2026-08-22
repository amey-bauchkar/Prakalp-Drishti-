import React from 'react';
import { ArrowRight, Shield, CheckCircle2 } from 'lucide-react';
import Button from './Button';
import { useLanguage } from '../../../tanmay/i18n/LanguageContext';

/**
 * Full-Width Corporate Government Hero Component with i18n
 */
export const Hero = ({
  onPrimaryClick,
  onSecondaryClick,
}) => {
  const { t } = useLanguage();

  return (
    <section className="relative bg-gov-navy text-white overflow-hidden border-b border-gov-navy-light font-sans">
      {/* Subtle geometric grid background overlay */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#FFFFFF 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 lg:py-24">
        <div className="max-w-3xl">
          {/* Government Department Tag */}
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/20 rounded-md text-xs font-bold tracking-widest text-gov-accent uppercase mb-6 backdrop-blur-xs">
            <Shield className="w-3.5 h-3.5 text-gov-accent" />
            <span>{t('hero.tag')}</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight sm:leading-none">
            {t('hero.title')}
          </h1>

          {/* Subtitle */}
          <p className="mt-5 text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
            {t('hero.subtitle')}
          </p>

          {/* Action Row */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            {onPrimaryClick && (
              <Button
                variant="accent"
                size="lg"
                onClick={onPrimaryClick}
                icon={ArrowRight}
                iconPosition="right"
                className="font-black text-sm uppercase tracking-wider shadow-card"
              >
                {t('hero.submitBtn')}
              </Button>
            )}

            {onSecondaryClick && (
              <Button
                variant="outline"
                size="lg"
                onClick={onSecondaryClick}
                className="border-white/40 text-white hover:bg-white hover:text-gov-navy font-bold text-sm uppercase tracking-wider"
              >
                {t('hero.opsBtn')}
              </Button>
            )}
          </div>

          {/* Key Bullet Highlights */}
          <div className="mt-10 pt-8 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold text-slate-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-gov-accent flex-shrink-0" />
              <span>{t('hero.gpsTag')}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-gov-accent flex-shrink-0" />
              <span>{t('hero.aiCat')}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-gov-accent flex-shrink-0" />
              <span>{t('hero.liveTrack')}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
