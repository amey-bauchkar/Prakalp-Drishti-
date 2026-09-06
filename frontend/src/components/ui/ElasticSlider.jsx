import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

/**
 * ElasticSlider — ReactBits Inspired Interactive Elastic Slider
 * Built with Framer Motion physics for tactile stretch, live colored fill, and smooth release.
 */
export default function ElasticSlider({
  defaultValue = 0,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  filledColor = '#059669',
  trackColor = '#e2e8f0',
  className = '',
  onCommit,
}) {
  const isControlled = value !== undefined;
  const [internalVal, setInternalVal] = useState(defaultValue);
  const currentVal = isControlled ? value : internalVal;
  
  const containerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const scaleY = useMotionValue(1);
  const scaleX = useMotionValue(1);

  const range = max - min;
  const percentage = Math.min(Math.max(((currentVal - min) / range) * 100, 0), 100);

  const handleSliderChange = (e) => {
    const rawVal = parseFloat(e.target.value);
    if (!isControlled) setInternalVal(rawVal);
    if (onChange) onChange(rawVal);
  };

  const handlePointerDown = () => {
    setIsDragging(true);
    animate(scaleY, 1.35, { type: 'spring', stiffness: 400, damping: 15 });
    animate(scaleX, 1.02, { type: 'spring', stiffness: 400, damping: 15 });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    animate(scaleY, 1, { type: 'spring', stiffness: 500, damping: 20 });
    animate(scaleX, 1, { type: 'spring', stiffness: 500, damping: 20 });
    if (onCommit) onCommit(currentVal);
  };

  return (
    <motion.div 
      ref={containerRef}
      style={{ scaleY, scaleX }}
      className={`relative w-full py-1.5 flex items-center select-none ${className}`}
    >
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={currentVal}
        onChange={handleSliderChange}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onTouchEnd={handlePointerUp}
        style={{
          background: `linear-gradient(to right, ${filledColor} 0%, ${filledColor} ${percentage}%, ${trackColor} ${percentage}%, ${trackColor} 100%)`
        }}
        className="w-full h-2.5 rounded-full appearance-none cursor-pointer focus:outline-none transition-all duration-75"
      />
    </motion.div>
  );
}
