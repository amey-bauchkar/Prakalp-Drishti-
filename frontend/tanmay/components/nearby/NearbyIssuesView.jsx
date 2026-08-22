import React from 'react';
import { Link } from 'react-router-dom';
import { 
  MapPin, 
  RotateCw, 
  Flame, 
  CheckCircle2, 
  PlusCircle, 
  ShieldAlert, 
  Radio, 
  Sparkles,
  Info,
  ArrowLeft,
  Building2
} from 'lucide-react';
import useNearbyIssues from '../../hooks/useNearbyIssues';
import FilterBar from './FilterBar';
import NearbyIssueCard from './NearbyIssueCard';
import { Button, Badge, Footer } from '../../../src/components/ui';
import { useLanguage } from '../../i18n/LanguageContext';

export const NearbyIssuesView = () => {
  const { t } = useLanguage();
  const {
    issues,
    loading,
    error,
    userLocation,
    locationName,
    locationStatus,
    radius,
    setRadius,
    category,
    setCategory,
    sortBy,
    setSortBy,
    refetch,
    requestLocation,
    handleUpvote,
  } = useNearbyIssues(2000);

  const totalUpvotesInArea = issues.reduce((sum, item) => sum + (item.upvotes || 1), 0);

  return (
    <div className="min-h-screen bg-gov-surface py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Top Breadcrumb Header */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gov-muted hover:text-gov-navy transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('nearby.back')}</span>
          </Link>
          <Badge variant="accent" size="xs" icon={Sparkles}>
            {t('nearby.engineBadge')}
          </Badge>
        </div>

        {/* Page Hero Header */}
        <div className="bg-gov-navy rounded-2xl p-6 sm:p-8 text-white shadow-card border border-gov-navy-light relative overflow-hidden">
          <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-gov-accent/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            
            <div className="space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-gov-accent bg-gov-navy-light px-2.5 py-1 rounded border border-gov-accent/30 inline-block">
                {t('nearby.trackingTag')}
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {t('nearby.title')}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl font-medium leading-relaxed">
                {t('nearby.subtitle')}
              </p>
            </div>

            {/* Quick stats badge */}
            <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 bg-gov-navy-light/90 backdrop-blur-md rounded-xl p-4 border border-white/10 shrink-0">
              <div className="text-left sm:text-right">
                <span className="text-[10px] text-gov-accent font-bold uppercase tracking-wider">
                  {t('nearby.communityUpvotes')}
                </span>
                <div className="text-2xl font-black text-white flex items-center gap-1.5 sm:justify-end">
                  <Flame className="w-5 h-5 text-amber-400 fill-amber-400" />
                  {totalUpvotesInArea}
                </div>
              </div>
              <Link to="/report">
                <Button
                  variant="gold"
                  size="sm"
                  icon={PlusCircle}
                  className="text-xs font-bold"
                >
                  {t('nearby.reportNew')}
                </Button>
              </Link>
            </div>

          </div>
        </div>

        {/* GPS Location & Live Triage Bar */}
        <div className="bg-white rounded-xl border border-gov-border p-4 shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              locationStatus === 'granted'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gov-muted">
                  {t('nearby.activeFeed')}
                </span>
                <span className={`inline-block w-2 h-2 rounded-full ${
                  locationStatus === 'granted' ? 'bg-emerald-500' : 'bg-amber-500'
                }`} />
              </div>
              <p className="text-sm font-bold text-gov-navy flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-gov-accent-dark shrink-0" />
                <span>{locationName}</span>
                {userLocation && (
                  <span className="text-xs font-mono font-normal text-gov-muted hidden sm:inline">
                    ({userLocation[0].toFixed(4)}, {userLocation[1].toFixed(4)})
                  </span>
                )}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={requestLocation}
            icon={RotateCw}
            className="text-xs"
          >
            {t('nearby.updateGps')}
          </Button>
        </div>

        {/* Informative Civic Advisory Strip */}
        <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-amber-950 text-xs sm:text-sm shadow-soft">
          <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <p className="leading-relaxed font-semibold">
            {t('nearby.advisory')}
          </p>
        </div>

        {/* Filters & Sorting */}
        <FilterBar
          selectedCategory={category}
          onSelectCategory={setCategory}
          selectedRadius={radius}
          onSelectRadius={setRadius}
          sortBy={sortBy}
          onSelectSort={setSortBy}
          totalCount={issues.length}
        />

        {/* Issue Cards Section */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-gov-border p-6 shadow-card animate-pulse flex flex-col sm:flex-row gap-4"
              >
                <div className="sm:w-52 h-44 bg-slate-200 rounded-lg" />
                <div className="flex-1 space-y-3 py-2">
                  <div className="h-4 bg-slate-200 rounded w-1/4" />
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-4 bg-slate-200 rounded w-1/2" />
                  <div className="h-8 bg-slate-200 rounded w-1/3 mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-8 text-center space-y-3">
            <ShieldAlert className="w-10 h-10 text-rose-600 mx-auto" />
            <h3 className="text-sm font-bold text-rose-900">{error}</h3>
            <Button
              variant="primary"
              size="sm"
              onClick={refetch}
            >
              {t('nearby.retry')}
            </Button>
          </div>
        ) : issues.length === 0 ? (
          <div className="bg-white rounded-xl border border-gov-border p-12 text-center space-y-4 shadow-card">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-gov-navy">
                {t('nearby.noIssues')}
              </h3>
              <p className="text-xs text-gov-muted max-w-md mx-auto">
                {t('nearby.noIssuesDesc')}
              </p>
            </div>
            <Link to="/report">
              <Button
                variant="primary"
                size="sm"
                icon={PlusCircle}
              >
                {t('nearby.submitNew')}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {issues.map((issue) => (
              <NearbyIssueCard
                key={issue._id}
                issue={issue}
                onUpvote={handleUpvote}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default NearbyIssuesView;
