import React from 'react';
import { MapPin, Clock, AlertTriangle, RefreshCw, FileText } from 'lucide-react';
import UpvoteButton from './UpvoteButton';
import Badge from '../../../src/components/ui/Badge';

const CATEGORY_BADGE_VARIANTS = {
  Roads: 'warning',
  Water: 'info',
  Sanitation: 'success',
  Electricity: 'accent',
  Other: 'surface',
};

const SEVERITY_BADGE_VARIANTS = {
  High: 'danger',
  Medium: 'warning',
  Low: 'info',
};

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return 'Recently';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins <= 0 ? 1 : mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

export const NearbyIssueCard = ({ issue, onUpvote }) => {
  const categoryVariant = CATEGORY_BADGE_VARIANTS[issue.category] || 'surface';
  const severityVariant = SEVERITY_BADGE_VARIANTS[issue.severity] || 'warning';
  const isHighPriority = (issue.upvotes || 0) >= 10 || issue.severity === 'High';

  return (
    <div className={`group bg-white rounded-xl border transition-all duration-150 overflow-hidden shadow-card hover:shadow-elevated ${
      isHighPriority ? 'border-gov-accent-dark/40 hover:border-gov-navy' : 'border-gov-border hover:border-gov-navy-light'
    }`}>
      <div className="flex flex-col sm:flex-row">
        
        {/* Left / Top: Thumbnail Image */}
        <div className="relative sm:w-52 h-48 sm:h-auto shrink-0 bg-slate-100 overflow-hidden border-b sm:border-b-0 sm:border-r border-gov-border">
          <img
            src={issue.imageUrl || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=600&q=80'}
            alt={issue.category || 'Civic Issue'}
            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-200"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=600&q=80';
            }}
          />

          {/* Distance overlay tag */}
          <div className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-gov-navy/90 text-gov-accent backdrop-blur-md shadow-soft border border-gov-accent/30">
            <MapPin className="w-3 h-3 text-gov-accent" />
            <span>{issue.distanceText || 'Near you'}</span>
          </div>

          {/* Status Badge */}
          <div className="absolute bottom-2.5 left-2.5">
            {issue.status === 'In Progress' ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500 text-white shadow-soft">
                <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                In Progress
              </span>
            ) : issue.status === 'Resolved' ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-600 text-white shadow-soft">
                Resolved
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gov-navy text-white shadow-soft">
                Pending Triage
              </span>
            )}
          </div>
        </div>

        {/* Right / Content Container */}
        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
          <div>
            
            {/* Header badges: Category & Severity */}
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-2">
                <Badge variant={categoryVariant} size="xs">
                  {issue.category}
                </Badge>
                <Badge variant={severityVariant} size="xs" icon={AlertTriangle}>
                  {issue.severity || 'Medium'} Severity
                </Badge>
              </div>

              <span className="text-[11px] text-gov-muted font-bold uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTimeAgo(issue.createdAt)}
              </span>
            </div>

            {/* Description */}
            <p className="text-sm font-semibold text-gov-text-main leading-relaxed line-clamp-3">
              {issue.description}
            </p>
          </div>

          {/* Footer: Upvote Action & Urgency Callout */}
          <div className="pt-3 border-t border-gov-border flex items-center justify-between gap-3">
            <div className="text-[11px] text-gov-muted font-mono font-semibold flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-gov-navy" />
              <span>REF: #{issue._id?.slice(-6).toUpperCase() || '10482'}</span>
            </div>

            {/* Upvote Button */}
            <UpvoteButton
              issueId={issue._id}
              initialCount={issue.upvotes || 1}
              onUpvote={onUpvote}
            />
          </div>

        </div>

      </div>
    </div>
  );
};

export default NearbyIssueCard;
