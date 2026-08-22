import React, { useState, createContext, useContext } from 'react';
import { PieChart as PieIcon, ArrowRight, Tag, BarChart3, PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from './Button';
import { useLanguage } from '../../../tanmay/i18n/LanguageContext';

const PieContext = createContext(null);

/**
 * Main PieChart container component using pure, responsive SVG
 */
export const PieChart = ({ data = [], innerRadius = 60, size = 200, children, className = '' }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const total = data.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);

  // Compute angles for slices
  let cumulativeAngle = 0;
  const processedSlices = data.map((item, index) => {
    const value = Number(item.value) || 0;
    const angle = total > 0 ? (value / total) * 360 : 0;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + angle;
    cumulativeAngle += angle;

    return {
      ...item,
      value,
      startAngle,
      endAngle,
      percentage: total > 0 ? ((value / total) * 100).toFixed(1) : '0.0',
    };
  });

  return (
    <PieContext.Provider
      value={{
        data: processedSlices,
        total,
        innerRadius,
        size,
        hoveredIndex,
        setHoveredIndex,
      }}
    >
      <div className={`flex flex-col items-center ${className}`}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="overflow-visible select-none"
        >
          {children}
        </svg>
      </div>
    </PieContext.Provider>
  );
};

/**
 * Individual Pie Slice SVG path
 */
export const PieSlice = ({ index }) => {
  const context = useContext(PieContext);
  if (!context) return null;

  const { data, size, innerRadius, hoveredIndex, setHoveredIndex } = context;
  const slice = data[index];
  if (!slice || slice.value === 0) return null;

  const center = size / 2;
  const outerRadius = (size / 2) - 8;
  const isHovered = hoveredIndex === index;
  const currentOuterRadius = isHovered ? outerRadius + 4 : outerRadius;

  // Convert polar coordinates to Cartesian
  const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  };

  const start = polarToCartesian(center, center, currentOuterRadius, slice.startAngle);
  const end = polarToCartesian(center, center, currentOuterRadius, slice.endAngle);
  const innerStart = polarToCartesian(center, center, innerRadius, slice.endAngle);
  const innerEnd = polarToCartesian(center, center, innerRadius, slice.startAngle);

  // Large arc flag
  const largeArcFlag = slice.endAngle - slice.startAngle <= 180 ? '0' : '1';

  // Path definition for donut slice
  const d = [
    `M ${start.x} ${start.y}`,
    `A ${currentOuterRadius} ${currentOuterRadius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`,
    `L ${innerStart.x} ${innerStart.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerEnd.x} ${innerEnd.y}`,
    'Z',
  ].join(' ');

  return (
    <path
      d={d}
      fill={slice.color || '#1E2A45'}
      className="transition-all duration-200 cursor-pointer stroke-white stroke-2"
      style={{
        transformOrigin: `${center}px ${center}px`,
        opacity: hoveredIndex !== null && !isHovered ? 0.7 : 1,
      }}
      onMouseEnter={() => setHoveredIndex(index)}
      onMouseLeave={() => setHoveredIndex(null)}
    />
  );
};

/**
 * Center Display inside the Donut
 */
export const PieCenter = ({ defaultLabel = 'Total' }) => {
  const context = useContext(PieContext);
  if (!context) return null;

  const { total, size, data, hoveredIndex } = context;
  const center = size / 2;

  const activeItem = hoveredIndex !== null ? data[hoveredIndex] : null;

  return (
    <g className="pointer-events-none">
      <text
        x={center}
        y={center - 4}
        textAnchor="middle"
        className="font-black fill-gov-navy text-2xl font-mono"
      >
        {activeItem ? activeItem.value : total}
      </text>
      <text
        x={center}
        y={center + 14}
        textAnchor="middle"
        className="font-bold fill-gov-muted text-[10px] uppercase tracking-widest"
      >
        {activeItem ? activeItem.label : defaultLabel}
      </text>
    </g>
  );
};

/**
 * Full Category Breakdown Analytics Card with PieChart, Legend and CTA
 */
export const CategoryAnalyticsCard = ({ issues = [] }) => {
  const { t } = useLanguage();

  const CATEGORY_COLORS = {
    Roads: '#1E2A45',        // Navy
    Sanitation: '#C5D86D',   // Accent Lime
    Water: '#5B6B8C',        // Muted Slate Blue
    Electricity: '#28385C',  // Navy Light
    Other: '#94A3B8',        // Cool Slate
  };

  const CATEGORY_TRANSLATION_KEYS = {
    Roads: 'dept.roads',
    Sanitation: 'dept.sanitation',
    Water: 'dept.water',
    Electricity: 'dept.electricity',
    Other: 'dept.other',
  };

  const rawCategories = ['Roads', 'Sanitation', 'Water', 'Electricity', 'Other'];

  const categoryCounts = rawCategories.map((cat) => {
    const count = issues.filter((i) => (i.category || 'Other') === cat).length;
    const translatedLabel = t(CATEGORY_TRANSLATION_KEYS[cat]) || cat;
    return {
      rawCategory: cat,
      label: translatedLabel,
      value: count,
      color: CATEGORY_COLORS[cat] || '#1E2A45',
    };
  });

  const total = issues.length;

  return (
    <div className="bg-white rounded-xl shadow-card border border-gov-border p-5 sm:p-6 flex flex-col font-sans">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 mb-5 border-b border-gov-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gov-navy text-gov-accent flex items-center justify-center font-bold text-sm shadow-soft">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-gov-navy leading-none uppercase tracking-wide">
              {t('pie.breakdownTitle')}
            </h3>
            <p className="text-[11px] font-medium text-gov-muted mt-0.5">
              {t('pie.breakdownDesc')}
            </p>
          </div>
        </div>
        <span className="text-[10px] font-bold bg-gov-surface text-gov-navy border border-gov-border px-2 py-0.5 rounded uppercase tracking-wider font-mono">
          {total} {t('pie.reports')}
        </span>
      </div>

      {/* Donut Chart Display */}
      <div className="py-2 flex justify-center">
        <PieChart data={categoryCounts} innerRadius={58} size={190}>
          {categoryCounts.map((item, index) => (
            <PieSlice index={index} key={item.rawCategory} />
          ))}
          <PieCenter defaultLabel={t('pie.total')} />
        </PieChart>
      </div>

      {/* Legend & Breakdown List */}
      <div className="mt-5 pt-4 border-t border-gov-border space-y-2.5">
        <span className="text-[10px] font-bold uppercase tracking-widest text-gov-muted block mb-2">
          {t('pie.deptShare')}
        </span>

        {categoryCounts.map((item) => {
          const pct = total > 0 ? ((item.value / total) * 100).toFixed(0) : 0;
          return (
            <div key={item.rawCategory} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="font-bold text-gov-navy">{item.label}</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-20 bg-gov-surface h-2 rounded-full overflow-hidden border border-gov-border hidden sm:block">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${pct}%`, backgroundColor: item.color }}
                  />
                </div>
                <span className="font-mono text-xs font-bold text-gov-muted w-10 text-right">
                  {item.value} <span className="text-[10px] text-slate-400">({pct}%)</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action to Submit Grievance on Dedicated Page */}
      <div className="mt-6 pt-4 border-t border-gov-border">
        <Link to="/report" className="block">
          <Button
            variant="accent"
            size="md"
            fullWidth
            icon={PlusCircle}
            iconPosition="left"
            className="font-extrabold uppercase tracking-wider text-xs py-3 shadow-soft"
          >
            {t('pie.submitBtn')}
          </Button>
        </Link>
        <p className="text-[10px] text-center text-gov-muted mt-2 font-medium">
          {t('pie.submitHint')}
        </p>
      </div>
    </div>
  );
};

export default CategoryAnalyticsCard;
