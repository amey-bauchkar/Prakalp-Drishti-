import React, { useState, useRef, useCallback } from 'react';
import { Columns, Eye, CheckCircle2, AlertTriangle, ShieldCheck, Sparkles } from 'lucide-react';

/**
 * BeforeAfterSlider Component
 * Interactive visual verification component comparing initial citizen grievance vs worker resolution proof.
 */
export const BeforeAfterSlider = ({
  beforeImage,
  afterImage,
  beforeLabel = 'Reported Issue (Before)',
  afterLabel = 'Municipal Repair (After)',
  verifiedDistance = null,
  className = '',
}) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [viewMode, setViewMode] = useState('slider'); // 'slider' | 'side-by-side'
  const containerRef = useRef(null);

  const handleMove = useCallback(
    (clientX) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      let percentage = (x / rect.width) * 100;
      if (percentage < 0) percentage = 0;
      if (percentage > 100) percentage = 100;
      setSliderPosition(percentage);
    },
    []
  );

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);

  if (!beforeImage && !afterImage) return null;

  // If only one image is available, render standard single image
  if (!afterImage) {
    return (
      <div className={`rounded-xl overflow-hidden border border-gov-border bg-gov-navy shadow-card ${className}`}>
        <div className="relative h-64 sm:h-72">
          <img src={beforeImage} alt={beforeLabel} className="w-full h-full object-cover" />
          <div className="absolute bottom-3 left-3 bg-gov-navy/90 text-white text-[11px] font-bold px-2.5 py-1 rounded border border-white/20">
            {beforeLabel}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-3 font-sans ${className}`}>
      {/* Top Controls Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-black text-gov-navy uppercase tracking-wider">
            Photographic Resolution Proof
          </span>
          {verifiedDistance !== null && (
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded">
              ✓ Verified On-Site ({verifiedDistance}m)
            </span>
          )}
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 bg-gov-surface p-1 rounded-lg border border-gov-border">
          <button
            type="button"
            onClick={() => setViewMode('slider')}
            className={`px-2.5 py-1 text-[11px] font-bold rounded transition-colors ${
              viewMode === 'slider'
                ? 'bg-gov-navy text-gov-accent shadow-soft'
                : 'text-gov-muted hover:text-gov-navy'
            }`}
          >
            Split Slider
          </button>
          <button
            type="button"
            onClick={() => setViewMode('side-by-side')}
            className={`px-2.5 py-1 text-[11px] font-bold rounded transition-colors ${
              viewMode === 'side-by-side'
                ? 'bg-gov-navy text-gov-accent shadow-soft'
                : 'text-gov-muted hover:text-gov-navy'
            }`}
          >
            Side-by-Side
          </button>
        </div>
      </div>

      {viewMode === 'slider' ? (
        /* Interactive Split Slider Mode */
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUp}
          className="relative h-64 sm:h-80 rounded-xl overflow-hidden border-2 border-gov-border select-none cursor-ew-resize shadow-elevated bg-gov-navy"
        >
          {/* AFTER Image (Full background layer) */}
          <img
            src={afterImage}
            alt={afterLabel}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          />

          {/* After Tag */}
          <div className="absolute top-3 right-3 bg-emerald-700/90 backdrop-blur-xs text-white text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded shadow-soft border border-white/20 flex items-center gap-1.5 z-10 pointer-events-none">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{afterLabel}</span>
          </div>

          {/* BEFORE Image (Clipped top layer) */}
          <div
            className="absolute inset-0 overflow-hidden pointer-events-none"
            style={{ width: `${sliderPosition}%` }}
          >
            <img
              src={beforeImage}
              alt={beforeLabel}
              className="absolute inset-0 w-full h-full object-cover"
              style={{
                width: containerRef.current ? `${containerRef.current.clientWidth}px` : '100%',
                maxWidth: 'none',
              }}
            />
            {/* Before Tag */}
            <div className="absolute top-3 left-3 bg-gov-navy/90 backdrop-blur-xs text-gov-accent text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded shadow-soft border border-white/20 flex items-center gap-1.5 z-10 pointer-events-none">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{beforeLabel}</span>
            </div>
          </div>

          {/* Draggable Divider Line */}
          <div
            onMouseDown={handleMouseDown}
            onTouchStart={handleMouseDown}
            className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-20 shadow-lg"
            style={{ left: `${sliderPosition}%` }}
          >
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-gov-navy text-gov-accent border-2 border-white flex items-center justify-center shadow-elevated">
              <Columns className="w-4 h-4" />
            </div>
          </div>

          {/* Bottom Hint */}
          <div className="absolute bottom-2 inset-x-0 text-center pointer-events-none z-10">
            <span className="text-[10px] font-bold text-white/80 bg-black/50 px-2.5 py-0.5 rounded-full backdrop-blur-xs">
              ⟵ Drag slider left/right to compare repair ⟶
            </span>
          </div>
        </div>
      ) : (
        /* Side-by-Side Mode */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative rounded-xl overflow-hidden border border-gov-border bg-gov-surface shadow-card h-52">
            <img src={beforeImage} alt={beforeLabel} className="w-full h-full object-cover" />
            <div className="absolute top-2.5 left-2.5 bg-gov-navy text-gov-accent text-[10px] font-black uppercase px-2.5 py-1 rounded border border-white/20">
              {beforeLabel}
            </div>
          </div>

          <div className="relative rounded-xl overflow-hidden border border-emerald-300 bg-emerald-50 shadow-card h-52">
            <img src={afterImage} alt={afterLabel} className="w-full h-full object-cover" />
            <div className="absolute top-2.5 left-2.5 bg-emerald-700 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded border border-white/20 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              {afterLabel}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BeforeAfterSlider;
