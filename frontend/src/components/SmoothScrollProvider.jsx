import React, { createContext, useContext, useEffect, useRef } from 'react';
import Lenis from 'lenis';

const LenisContext = createContext(null);

export const useLenis = () => useContext(LenisContext);

/**
 * SmoothScrollProvider
 * 
 * Enterprise-grade smooth scrolling provider leveraging Lenis.
 * Features:
 * - Tight linear interpolation (lerp: 0.1) for high data density readability and zero floaty motion sickness.
 * - Synchronized requestAnimationFrame loop compatible with Framer Motion transitions.
 * - Automatic cleanup and lifecycle management.
 */
export default function SmoothScrollProvider({ children, options = {} }) {
  const lenisRef = useRef(null);

  useEffect(() => {
    // Initialize Lenis with tactile, responsive enterprise physics
    const lenis = new Lenis({
      lerp: 0.1, // Enterprise-grade tight responsiveness
      duration: 1.0,
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.0,
      infinite: false,
      autoResize: true,
      ...options,
    });

    lenisRef.current = lenis;

    // Synchronized RAF loop
    let rafId;
    function raf(time) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  return (
    <LenisContext.Provider value={lenisRef.current}>
      {children}
    </LenisContext.Provider>
  );
}
