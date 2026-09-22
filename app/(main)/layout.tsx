"use client";

import { usePathname } from "next/navigation";
import { UserHydration } from "@/components/UserHydration";
import { VoiceRecorder } from "@/components/voice/VoiceRecorder";
import { BadgeCelebration } from "@/components/gamification/BadgeCelebration";
import { PWAInstallPrompt } from "@/components/shared/PWAInstallPrompt";
import { BottomNav } from "@/components/ui/BottomNav";
import { Sidebar } from "@/components/desktop/Sidebar";
import { DesktopTopBar } from "@/components/desktop/DesktopTopBar";

// Routes with their own wide desktop layout (reflowed via `lg:` classes in
// the page itself, or a hook + view split for the dashboards). Every other
// route keeps its mobile-width column, just centred in the wider desktop
// content area, until it gets the same treatment.
const DESKTOP_WIDE_ROUTES = ["/home", "/orders", "/menu", "/inventory", "/wallet", "/sell", "/profile"];

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isWide = DESKTOP_WIDE_ROUTES.some((p) => pathname === p);

  return (
    <div className="h-full flex flex-col lg:flex-row overflow-hidden">
      <UserHydration />
      {/* Sidebar nav — desktop only (>=1024px), hidden below that. */}
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar — desktop only, replaces the per-page mobile header row. */}
        <DesktopTopBar />
        {/*
          flex-1 + overflow-y-auto = scrollable content area.
          pb-shell = home-indicator inset, only when the bottom bar is hidden.
          The bottom bar (BottomNav) is the next flex row: in flow, never floating.
          On desktop, routes without their own wide layout stay centred at the
          mobile shell width so they don't stretch and look broken.
        */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden scroll-container pb-shell">
          <div className={`min-h-full relative ${isWide ? "w-full" : "w-full lg:max-w-[480px] lg:mx-auto"}`}>
            {children}
          </div>
        </main>
        {/* Primary bottom navigation — Home / Sell / Stock / Wallet / Profile. Mobile only. */}
        <BottomNav />
      </div>
      {/* Voice recorder overlay — triggered from anywhere via store */}
      <VoiceRecorder />
      {/* Badge celebration — rendered above everything */}
      <BadgeCelebration />
      {/* PWA install prompt — Android Chrome only, 7-day cooldown */}
      <PWAInstallPrompt />
    </div>
  );
}
