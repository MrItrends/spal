"use client";

import { useEffect, useRef } from "react";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const buf = new ArrayBuffer(rawData.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < rawData.length; i++) view[i] = rawData.charCodeAt(i);
  return buf;
}

export function usePushNotifications(userId: string | undefined) {
  const attempted = useRef(false);

  useEffect(() => {
    if (!userId || attempted.current) return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    // Don't prompt immediately — wait 3s so it doesn't feel aggressive
    const timer = setTimeout(async () => {
      attempted.current = true;
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;

        const reg = await navigator.serviceWorker.ready;
        let sub = await reg.pushManager.getSubscription();

        if (!sub) {
          sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
          });
        }

        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sub.toJSON()),
        });
      } catch {
        // Silently fail — push is enhancement only
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [userId]);
}
