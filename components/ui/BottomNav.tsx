"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Activity, FileText, BarChart3, GraduationCap, User } from "lucide-react";

interface NavItem {
  href:  string;
  label: string;
  icon:  React.ReactNode;
}

const navItems: NavItem[] = [
  { href: "/home",     label: "Home",    icon: <Activity    size={21} strokeWidth={1.7} /> },
  { href: "/records",  label: "Records", icon: <FileText    size={21} strokeWidth={1.7} /> },
  { href: "/insights", label: "Insights",icon: <BarChart3   size={21} strokeWidth={1.7} /> },
  { href: "/learn",    label: "Coach",   icon: <GraduationCap size={21} strokeWidth={1.7} /> },
  { href: "/profile",  label: "Profile", icon: <User        size={21} strokeWidth={1.7} /> },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] glass-nav bottom-nav z-50">
      <div className="flex items-center justify-around px-2 pt-2 pb-2">
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
              {isActive && (
                <motion.span
                  layoutId="nav-indicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-[2px] rounded-full bg-spal-green"
                  transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                />
              )}
              <span className={`relative z-10 transition-all duration-200 ${isActive ? "text-spal-navy scale-110" : "text-neutral-400"}`}>
                {item.icon}
              </span>
              <span
                className={`relative z-10 text-[9.5px] font-semibold tracking-tight transition-colors duration-200 ${isActive ? "text-spal-navy" : "text-neutral-400"}`}
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
