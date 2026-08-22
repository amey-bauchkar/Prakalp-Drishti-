import React from 'react';
import { ArrowRight, Tag, Clock, Image as ImageIcon, MapPin } from 'lucide-react';
import Badge from '../../src/components/ui/Badge';
import { useLanguage } from '../../tanmay/i18n/LanguageContext';

const SEVERITY_BADGE_VARIANTS = {
  High: 'danger',
  Medium: 'warning',
  Low: 'info',
};

const CATEGORY_TRANSLATION_KEYS = {
  Roads: 'dept.roads',
  Sanitation: 'dept.sanitation',
  Water: 'dept.water',
  Electricity: 'dept.electricity',
  Other: 'dept.other',
};

const SEVERITY_TRANSLATION_KEYS = {
  High: 'severity.high',
  Medium: 'severity.medium',
  Low: 'severity.low',
};

export const IssueCard = ({ issue, onClick }) => {
  const { t } = useLanguage();
  const { category, imageUrl, createdAt, severity, description, status } = issue;
  
  const severityVariant = SEVERITY_BADGE_VARIANTS[severity] || 'surface';
  const categoryLabel = t(CATEGORY_TRANSLATION_KEYS[category]) || category || 'General';
  const severityLabel = t(SEVERITY_TRANSLATION_KEYS[severity]) || severity;

  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
      })
    : t('kanban.recently');

  return (
    <div
      onClick={() => onClick(issue)}
      className="bg-white border border-gov-border hover:border-gov-navy hover:shadow-card transition-all duration-150 rounded-lg p-3.5 mb-2.5 cursor-pointer select-none group font-sans"
    >
      {/* Top Badges Row */}
      <div className="flex items-center justify-between gap-1.5 mb-2.5">
        <span className="text-[11px] font-bold text-gov-navy bg-gov-surface border border-gov-border px-2 py-0.5 rounded uppercase tracking-wider truncate">
          {categoryLabel}
        </span>
        <Badge variant={severityVariant} size="xs" className="whitespace-nowrap flex-shrink-0">
          {severityLabel}
        </Badge>
      </div>

      {/* Main Card Content */}
      <div className="flex gap-3 items-start">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={category}
            className="w-14 h-14 object-cover rounded-md flex-shrink-0 bg-gov-surface border border-gov-border group-hover:opacity-95"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-14 h-14 rounded-md bg-gov-surface border border-gov-border flex items-center justify-center text-gov-muted text-xs flex-shrink-0">
            <ImageIcon className="w-5 h-5 text-slate-300" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="text-xs text-gov-navy font-semibold line-clamp-2 leading-snug">
            {description}
          </p>
          
          <div className="mt-2.5 pt-2 border-t border-gov-border/60 flex items-center justify-between text-[10px] text-gov-muted font-medium">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>{formattedDate}</span>
            </span>
            <span className="text-gov-navy font-bold group-hover:text-gov-accent-dark flex items-center gap-0.5">
              <span>{t('kanban.view')}</span>
              <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssueCard;
