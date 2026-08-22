import React from 'react';
import { Clock, RefreshCw, CheckCircle2 } from 'lucide-react';
import IssueCard from './IssueCard';
import { useLanguage } from '../../tanmay/i18n/LanguageContext';

const STATUS_CONFIG = {
  Pending: {
    icon: Clock,
    iconColor: 'text-amber-600',
    headerBorder: 'border-t-2 border-t-amber-500',
    countBg: 'bg-amber-50 text-amber-800 border-amber-200',
    transKey: 'kanban.pending',
  },
  'In Progress': {
    icon: RefreshCw,
    iconColor: 'text-blue-600',
    headerBorder: 'border-t-2 border-t-blue-500',
    countBg: 'bg-blue-50 text-blue-800 border-blue-200',
    transKey: 'kanban.inProgress',
  },
  Resolved: {
    icon: CheckCircle2,
    iconColor: 'text-emerald-600',
    headerBorder: 'border-t-2 border-t-emerald-500',
    countBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    transKey: 'kanban.resolved',
  },
};

export const KanbanColumn = ({ status, issues = [], onCardClick }) => {
  const { t } = useLanguage();
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.Pending;
  const Icon = config.icon;
  const columnTitle = t(config.transKey) || status;

  return (
    <div className={`bg-gov-surface p-3.5 rounded-xl flex flex-col min-h-[460px] border border-gov-border ${config.headerBorder} font-sans`}>
      {/* Column Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-gov-border">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${config.iconColor} flex-shrink-0`} />
          <h3 className="font-bold text-xs uppercase tracking-wider text-gov-navy whitespace-nowrap">
            {columnTitle}
          </h3>
        </div>
        <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border shadow-soft ${config.countBg}`}>
          {issues.length}
        </span>
      </div>

      {/* Column Cards Container */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-0.5 max-h-[600px]">
        {issues.length === 0 ? (
          <div className="h-32 flex flex-col items-center justify-center text-gov-muted text-xs border border-dashed border-gov-border rounded-lg p-3 text-center bg-white/50">
            <span className="font-medium text-slate-400">{t('kanban.noReports')}</span>
          </div>
        ) : (
          issues.map((issue) => (
            <IssueCard key={issue._id || issue.id} issue={issue} onClick={onCardClick} />
          ))
        )}
      </div>
    </div>
  );
};

export default KanbanColumn;
