import React from 'react';
import { Camera, MapPin, Cpu, CheckCircle, ArrowRight } from 'lucide-react';
import Card from './Card';
import { useLanguage } from '../../../tanmay/i18n/LanguageContext';

/**
 * 4-Card Corporate Feature Strip Component with i18n
 */
export const FeatureStrip = ({ onCardAction }) => {
  const { t } = useLanguage();

  const features = [
    {
      icon: Camera,
      title: t('feature.photo.title'),
      description: t('feature.photo.desc'),
      variant: "navy",
      actionText: t('feature.photo.action'),
      actionKey: "photo",
    },
    {
      icon: MapPin,
      title: t('feature.gps.title'),
      description: t('feature.gps.desc'),
      variant: "white",
      actionText: t('feature.gps.action'),
      actionKey: "map",
    },
    {
      icon: Cpu,
      title: t('feature.ai.title'),
      description: t('feature.ai.desc'),
      variant: "mutedBlue",
      actionText: t('feature.ai.action'),
      actionKey: "triage",
    },
    {
      icon: CheckCircle,
      title: t('feature.res.title'),
      description: t('feature.res.desc'),
      variant: "white",
      actionText: t('feature.res.action'),
      actionKey: "status",
    },
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20 font-sans">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {features.map((feature, idx) => {
          const Icon = feature.icon;
          const isDark = feature.variant === 'navy' || feature.variant === 'mutedBlue';
          
          return (
            <Card
              key={idx}
              variant={feature.variant}
              padding="md"
              hoverable
              className="flex flex-col justify-between"
              onClick={() => onCardAction && onCardAction(feature.actionKey)}
            >
              <div>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${
                  feature.variant === 'navy' 
                    ? 'bg-white/10 text-gov-accent' 
                    : feature.variant === 'mutedBlue'
                    ? 'bg-white/15 text-white'
                    : 'bg-gov-surface text-gov-navy border border-gov-border'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h4 className={`text-base font-bold tracking-tight mb-1.5 ${isDark ? 'text-white' : 'text-gov-navy'}`}>
                  {feature.title}
                </h4>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-gov-text-body'}`}>
                  {feature.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-current/10 flex items-center gap-1 text-xs font-bold">
                <span className={feature.variant === 'navy' ? 'text-gov-accent' : isDark ? 'text-white' : 'text-gov-navy'}>
                  {feature.actionText}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
};

export default FeatureStrip;
