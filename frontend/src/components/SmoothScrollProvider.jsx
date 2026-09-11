import React, { createContext, useContext, useEffect, useRef } from 'react';
import Lenis from 'lenis';

const LenisContext = createContext(null);

export const useLenis = () => useContext(LenisContext);

/**
 * Universal Scroll-To-Top Helper
 * Resets native browser scroll, document element, and Lenis virtual scroll instantly.
 */
export function scrollToTop(immediate = true) {
  try {
    window.scrollTo({ top: 0, left: 0, behavior: immediate ? 'instant' : 'smooth' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    if (window.__lenisInstance && typeof window.__lenisInstance.scrollTo === 'function') {
      window.__lenisInstance.scrollTo(0, { immediate });
    }
  } catch (e) {
    window.scrollTo(0, 0);
  }
}

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
      allowNestedScroll: true, // Automatically permit native wheel scroll in nested overflow containers
      prevent: (node) => {
        if (!node || typeof node.closest !== 'function') return false;
        if (node.closest('[data-lenis-prevent]')) return true;
        let current = node;
        while (current && current !== document.body && current !== document.documentElement) {
          const style = window.getComputedStyle(current);
          const isScrollable = (style.overflowY === 'auto' || style.overflowY === 'scroll') && current.scrollHeight > current.clientHeight;
          if (isScrollable) return true;
          current = current.parentElement;
        }
        return false;
      },
      ...options,
    });

    lenisRef.current = lenis;
    window.__lenisInstance = lenis;

    const handleScrollEvent = (e) => {
      const immediate = e?.detail?.immediate !== false;
      scrollToTop(immediate);
    };
    window.addEventListener('prakalp:scrollToTop', handleScrollEvent);

    // Synchronized RAF loop
    let rafId;
    function raf(time) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      window.removeEventListener('prakalp:scrollToTop', handleScrollEvent);
      if (rafId) cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
      window.__lenisInstance = null;
    };
  }, []);

  return (
    <LenisContext.Provider value={lenisRef.current}>
      {children}
    </LenisContext.Provider>
  );
}

