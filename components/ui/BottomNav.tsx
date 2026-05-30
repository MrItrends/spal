"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

interface NavItem {
  href:  string;
  label: string;
  icon:  React.ReactNode;
}

const navItems: NavItem[] = [
  { href: "/home",     label: "Home",    icon: <PulseIcon /> },
  { href: "/records",  label: "Records", icon: <LedgerIcon /> },
  { href: "/insights", label: "Insights",icon: <ScaleIcon /> },
  { href: "/learn",    label: "Coach",   icon: <OrbitIcon /> },
  { href: "/profile",  label: "Profile", icon: <NodeIcon /> },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] glass-nav bottom-nav z-50">
      <div className="flex items-center justify-around px-2 pt-2 pb-safe">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-[3px] min-w-[52px] min-h-[48px] justify-center relative"
              aria-label={item.label}
            >
              {/* Active indicator — slim line above icon */}
              {isActive && (
                <motion.span
                  layoutId="nav-indicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-[2px] rounded-full bg-spal-green"
                  transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                />
              )}

              <span
                className={`relative z-10 transition-all duration-200 ${
                  isActive ? "text-spal-navy scale-110" : "text-neutral-400"
                }`}
              >
                {item.icon}
              </span>

              <span
                className={`relative z-10 text-[9.5px] font-semibold tracking-tight transition-colors duration-200 ${
                  isActive ? "text-spal-navy" : "text-neutral-400"
                }`}
                style={{ fontFamily: "var(--font-satoshi)" }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/* ── Bespoke SPAL icon set ──────────────────────────────────────────────── */
/* Stroke weight: 1.7 | Linecap: round | Linejoin: round | Grid: 24px      */

/** Home — financial pulse waveform */
function PulseIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12h3l2.5-7 3 14 3-10 2 3h4.5" />
    </svg>
  );
}

/** Records — minimal ledger rows */
function LedgerIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="3" width="16" height="18" rx="3" />
      <path d="M8 8h8M8 12h5M8 16h6" />
    </svg>
  );
}

/** Insights — ascending geometric scale */
function ScaleIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3"  y="14" width="4" height="7" rx="1" />
      <rect x="10" y="9"  width="4" height="12" rx="1" />
      <rect x="17" y="4"  width="4" height="17" rx="1" />
    </svg>
  );
}

/** Coach — orbital guidance symbol */
function OrbitIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 4a8 8 0 0 1 5.66 2.34" />
      <path d="M19.78 8.5A8 8 0 0 1 20 12" />
      <path d="M12 20a8 8 0 0 1-8-8" />
      <path d="M4.22 8.5A8 8 0 0 1 8 4.56" />
    </svg>
  );
}

/** Profile — minimal person node */
function NodeIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="7" r="4" />
      <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}
