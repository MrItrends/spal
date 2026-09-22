"use client";

import { useEffect, useState } from "react";

/**
 * True when the viewport is at least the desktop breakpoint (lg, 1024px).
 *
 * SSR-safe: renders `false` on the server and the first client paint, then
 * updates after mount, so it never causes a hydration mismatch. Use it to pick
 * the desktop shell / layout while every screen keeps sharing the same data
 * hooks, APIs, store and primitives (see DESKTOP.md). Prefer plain Tailwind
 * `lg:` classes for pure styling — reserve this hook for swapping whole
 * layouts (e.g. bottom nav vs sidebar) where CSS alone isn't enough.
 */
export function useIsDesktop(breakpointPx = 1024): boolean {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia(`(min-width: ${breakpointPx}px)`);
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [breakpointPx]);

  return isDesktop;
}
