import React from 'react';
import { Filter, SlidersHorizontal, Flame, Navigation } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

const RAW_CATEGORIES = [
  { key: 'dept.all', raw: 'All', defaultVal: 'All' },
  { key: 'dept.roads', raw: 'Roads', defaultVal: 'Roads' },
  { key: 'dept.water', raw: 'Water', defaultVal: 'Water' },
  { key: 'dept.sanitation', raw: 'Sanitation', defaultVal: 'Sanitation' },
  { key: 'dept.electricity', raw: 'Electricity', defaultVal: 'Electricity' },
  { key: 'dept.other', raw: 'Other', defaultVal: 'Other' },
];

const RADII = [
  { label: '500m', value: 500 },
  { label: '1 km', value: 1000 },
  { label: '2 km', value: 2000 },
  { label: '5 km', value: 5000 },
];

export const FilterBar = ({
  selectedCategory,
  onSelectCategory,
  selectedRadius,
  onSelectRadius,
  sortBy,
  onSelectSort,
  totalCount,
}) => {
  const { t } = useLanguage();

  return (
    <div className="bg-white rounded-xl border border-gov-border p-4 sm:p-5 shadow-card space-y-4 mb-6 font-sans">
      
      {/* Top row: Category Pills */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11px] font-bold text-gov-muted uppercase tracking-wider flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-gov-navy" />
            <span>{t('nearby.category')}</span>
          </span>
          <span className="text-xs text-gov-muted font-bold font-mono">
            {totalCount} {t('nearby.reportsInRange')}
          </span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {RAW_CATEGORIES.map((catObj) => {
            const isActive = selectedCategory === catObj.raw;
            const label = t(catObj.key) || catObj.defaultVal;
            return (
              <button
                key={catObj.raw}
                type="button"
                onClick={() => onSelectCategory(catObj.raw)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all duration-150 border ${
                  isActive
                    ? 'bg-gov-navy text-white border-gov-navy shadow-soft'
                    : 'bg-gov-surface text-gov-muted hover:text-gov-navy hover:bg-slate-200 border-gov-border'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom row: Radius & Sort Options */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gov-border">
        
        {/* Radius selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gov-muted uppercase tracking-wider flex items-center gap-1">
            <SlidersHorizontal className="w-3 h-3 text-gov-navy" />
            <span>{t('nearby.radius')}</span>
          </span>
          <div className="inline-flex bg-gov-surface p-1 rounded-lg border border-gov-border">
            {RADII.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => onSelectRadius(r.value)}
                className={`px-2.5 py-1 text-[11px] font-bold uppercase rounded-md transition-colors ${
                  selectedRadius === r.value
                    ? 'bg-white text-gov-navy shadow-xs border border-gov-border/60'
                    : 'text-gov-muted hover:text-gov-navy'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gov-muted uppercase tracking-wider">
            {t('nearby.sortBy')}
          </span>
          <div className="inline-flex bg-gov-surface p-1 rounded-lg border border-gov-border">
            <button
              type="button"
              onClick={() => onSelectSort('distance')}
              className={`flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold uppercase rounded-md transition-colors ${
                sortBy === 'distance'
                  ? 'bg-white text-gov-navy shadow-xs border border-gov-border/60'
                  : 'text-gov-muted hover:text-gov-navy'
              }`}
            >
              <Navigation className="w-3 h-3 text-gov-navy" />
              <span>{t('nearby.closest')}</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectSort('upvotes')}
              className={`flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold uppercase rounded-md transition-colors ${
                sortBy === 'upvotes'
                  ? 'bg-white text-amber-700 shadow-xs border border-gov-border/60'
                  : 'text-gov-muted hover:text-gov-navy'
              }`}
            >
              <Flame className="w-3 h-3 text-amber-500" />
              <span>{t('nearby.highestUpvotes')}</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};

export default FilterBar;
