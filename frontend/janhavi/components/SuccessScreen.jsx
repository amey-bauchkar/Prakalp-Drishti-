import React from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Tag, Clock, Cpu, Camera, Search, Building2, Brain } from "lucide-react";
import { Card, Badge, Button } from "../../src/components/ui";
import { useLanguage } from "../../tanmay/i18n/LanguageContext";

/**
 * SuccessScreen Component
 * Displays post-submission confirmation, real tracking ID, AI-triage breakdown, and track complaint link.
 */
export default function SuccessScreen({ submittedData, onReset }) {
  const { t } = useLanguage();
  const data = submittedData?.data || submittedData || {};
  const trackingId = data.trackingId || data._id || `JH-${Math.floor(100000 + Math.random() * 900000)}`;
  const category = data.category || "Roads";
  const severity = data.severity || "Medium";
  const status = data.status || "Pending";
  const department = data.department || "General Services";
  const aiSummary = data.aiSummary || "";

  const getSeverityBadgeVariant = (sev) => {
    switch (sev?.toLowerCase()) {
      case "high":
        return "danger";
      case "low":
        return "info";
      default:
        return "warning";
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 text-center animate-fadeIn min-h-[75vh]">
      {/* Success Badge */}
      <div className="w-16 h-16 mb-5 rounded-xl bg-gov-navy text-gov-accent flex items-center justify-center shadow-card">
        <CheckCircle2 className="w-9 h-9" />
      </div>

      <h2 className="text-2xl font-black text-gov-navy tracking-tight">
        {t('success.title')}
      </h2>
      <p className="text-xs text-gov-muted mt-1 max-w-xs font-medium">
        {t('success.subtitle')}
      </p>

      {/* Ticket Details Card */}
      <Card variant="white" padding="md" className="w-full mt-6 text-left border-gov-border shadow-card">
        <div className="flex items-center justify-between pb-3 border-b border-gov-border">
          <span className="text-xs font-bold uppercase tracking-widest text-gov-muted">
            {t('success.trackingId')}
          </span>
          <span className="text-xs font-mono font-black text-gov-navy bg-gov-surface px-2.5 py-1 rounded border border-gov-border">
            {trackingId}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 py-3.5 border-b border-gov-border text-sm">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-gov-muted block">{t('success.aiCategory')}</span>
            <div className="flex items-center gap-1.5 mt-1">
              <Tag className="w-3.5 h-3.5 text-gov-navy" />
              <span className="font-bold text-gov-navy text-xs uppercase tracking-wider">{category}</span>
            </div>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-gov-muted block">{t('success.severityScore')}</span>
            <div className="mt-1">
              <Badge variant={getSeverityBadgeVariant(severity)} size="xs">
                {severity} {t('common.priority')}
              </Badge>
            </div>
          </div>
        </div>

        {department && (
          <div className="py-3 border-b border-gov-border flex items-center gap-2 text-xs">
            <Building2 className="w-4 h-4 text-gov-navy flex-shrink-0" />
            <span className="text-gov-muted font-medium">{t('track.department')}:</span>
            <span className="font-bold text-gov-navy">{department}</span>
          </div>
        )}

        {aiSummary && (
          <div className="py-3 border-b border-gov-border flex items-start gap-2 text-xs">
            <Brain className="w-4 h-4 text-gov-navy flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-gov-muted font-medium block text-[10px] uppercase font-bold tracking-wider">{t('track.aiAnalysis')}</span>
              <p className="font-medium text-gov-text text-xs mt-0.5">{aiSummary}</p>
            </div>
          </div>
        )}

        <div className="pt-3 flex items-center justify-between text-xs">
          <span className="text-gov-muted font-medium">{t('success.routingStatus')}:</span>
          <Badge variant="warning" size="xs" icon={Clock}>
            {status}
          </Badge>
        </div>
      </Card>

      {/* Notice box */}
      <div className="mt-4 p-3.5 rounded-lg bg-gov-surface border border-gov-border text-gov-muted text-xs flex items-center gap-2.5 w-full text-left">
        <Cpu className="w-4 h-4 text-gov-navy flex-shrink-0" />
        <span className="font-medium">
          {t('success.aiNote')}
        </span>
      </div>

      {/* Actions */}
      <div className="w-full mt-6 space-y-2.5">
        <Link
          to={`/track?id=${encodeURIComponent(trackingId)}`}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-gov-navy text-white text-xs font-bold uppercase tracking-wider hover:bg-gov-navy/90 transition-colors shadow-soft"
        >
          <Search className="w-4 h-4" />
          {t('success.trackLink')}
        </Link>

        <Button
          type="button"
          variant="secondary"
          size="md"
          fullWidth
          onClick={onReset}
          icon={Camera}
        >
          {t('success.submitAnother')}
        </Button>
      </div>
    </div>
  );
}
