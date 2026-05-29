/**
 * SPAL Service Worker
 *
 * Strategy:
 *  - Static assets (/_next/static, /icons) → CacheFirst (long-lived)
 *  - Navigation requests → NetworkFirst with offline fallback (/offline)
 *  - API routes → NetworkOnly (never cached — always fresh data)
 *  - Push notifications + notification clicks handled here
 *
 * Bump CACHE_VERSION when you want to force all clients to update.
 */

const CACHE_VERSION = "spal-v1";
const OFFLINE_URL   = "/offline";

// Assets to pre-cache on install (critical shell)
const PRECACHE = [
  OFFLINE_URL,
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

// ── Install: pre-cache shell assets ──────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

// ── Activate: remove old caches ───────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE_VERSION)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// ── Fetch: routing strategy ───────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== location.origin) return;

  // API routes → always network (no caching)
  if (url.pathname.startsWith("/api/")) return;

  // Static Next.js chunks → CacheFirst
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/")
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ??
          fetch(request).then((response) => {
            const clone = response.clone();
            caches.open(CACHE_VERSION).then((c) => c.put(request, clone));
            return response;
          }),
      ),
    );
    return;
  }

  // Navigation (HTML pages) → NetworkFirst with offline fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches
          .match(OFFLINE_URL)
          .then((fallback) => fallback ?? Response.error()),
      ),
    );
  }
});

// ── Push notification display ─────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return;

  const { title, body, url } = event.data.json();

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon:  "/icons/icon-192.png",
      badge: "/icons/icon-96.png",
      data:  { url: url ?? "/home" },
      vibrate: [100, 50, 100],
    }),
  );
});

// ── Notification click: open / focus the app ──────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url ?? "/home";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(targetUrl) && "focus" in client) {
            return client.focus();
          }
        }
        return self.clients.openWindow(targetUrl);
      }),
  );
});
