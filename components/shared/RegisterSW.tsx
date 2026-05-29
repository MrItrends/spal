"use client";

/**
 * RegisterSW — registers the SPAL service worker on mount.
 *
 * Mounted in the root layout so it runs on every page, including
 * unauthenticated ones (login, signup) — the SW must be registered
 * before any navigation so the offline fallback is cached.
 *
 * Does nothing in development (NODE_ENV check happens at runtime
 * because this is a client component).
 */

import { useEffect } from "react";

export function RegisterSW() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    // Only register in production — dev hot-reload conflicts with SW caching
    if (process.env.NODE_ENV !== "production") return;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        console.log("[SW] Registered, scope:", registration.scope);
      })
      .catch((err) => {
        console.warn("[SW] Registration failed:", err);
      });
  }, []);

  return null;
}
