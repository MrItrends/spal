"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Home01Icon, ShoppingCartAdd01Icon, PackageIcon, Wallet01Icon, User02Icon,
  Hamburger01Icon, MenuRestaurantIcon, Invoice01Icon, ChartIncreaseIcon,
} from "hugeicons-react";
import { useBusinessMode } from "@/hooks/useBusinessMode";

const FF = "var(--font-satoshi)";

const PRIMARY = [
  { href: "/home",      label: "Home",      Icon: Home01Icon },
  { href: "/sell",      label: "Sell",      Icon: ShoppingCartAdd01Icon },
  { href: "/inventory", label: "Inventory", Icon: PackageIcon },
  { href: "/wallet",    label: "Wallet",    Icon: Wallet01Icon },
  { href: "/profile",   label: "Profile",   Icon: User02Icon },
];

const PERISHABLE_PRIMARY = [
  { href: "/home",      label: "Home",        Icon: Home01Icon },
  { href: "/orders",    label: "Orders",      Icon: Hamburger01Icon },
  { href: "/menu",      label: "Menu",        Icon: MenuRestaurantIcon },
  { href: "/inventory", label: "Ingredients", Icon: PackageIcon },
  { href: "/profile",   label: "Profile",     Icon: User02Icon },
];

const SECONDARY = [
  { href: "/records",  label: "Records",  Icon: Invoice01Icon },
  { href: "/insights", label: "Insights", Icon: ChartIncreaseIcon },
];

/**
 * Fixed left sidebar for the desktop shell — same destinations as the mobile
 * bottom tab bar (business-mode aware), plus secondary links that are
 * full-screen flows on mobile. See DESKTOP.md.
 */
export function Sidebar() {
  const pathname = usePathname();
  const { perishable } = useBusinessMode();
  const primary = perishable ? PERISHABLE_PRIMARY : PRIMARY;

  const isActive = (href: string) => (href === "/home" ? pathname === "/home" : pathname.startsWith(href));

  return (
    <aside
      className="hidden lg:flex flex-col w-[248px] shrink-0 h-full overflow-y-auto"
      style={{ background: "#0F172A" }}
      aria-label="Primary"
    >
      <div className="px-6 pt-8 pb-6 flex items-center gap-2.5">
        <Image src="/icons/icon-96.png" alt="" width={32} height={32} className="w-8 h-8 rounded-lg" />
        <span className="text-white font-black text-[19px]" style={{ fontFamily: FF }}>SPAL</span>
      </div>

      <nav className="flex-1 px-3">
        <ul className="flex flex-col gap-1">
          {primary.map(({ href, label, Icon }) => {
            const active = isActive(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className="flex items-center gap-3 h-12 px-3.5 rounded-xl transition-colors"
                  style={{ background: active ? "#22C55E" : "transparent", color: active ? "#0F172A" : "rgba(255,255,255,0.72)" }}
                >
                  <Icon size={20} color={active ? "#0F172A" : "rgba(255,255,255,0.72)"} />
                  <span className="text-[14px] font-bold truncate" style={{ fontFamily: FF }}>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <p className="mt-6 mb-2 px-3.5 text-[11px] font-bold uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.35)" }}>More</p>
        <ul className="flex flex-col gap-1">
          {SECONDARY.map(({ href, label, Icon }) => {
            const active = isActive(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className="flex items-center gap-3 h-12 px-3.5 rounded-xl transition-colors"
                  style={{ background: active ? "#22C55E" : "transparent", color: active ? "#0F172A" : "rgba(255,255,255,0.72)" }}
                >
                  <Icon size={20} color={active ? "#0F172A" : "rgba(255,255,255,0.72)"} />
                  <span className="text-[14px] font-bold truncate" style={{ fontFamily: FF }}>{label}</span>
                </Link>
              </li>
            );
          })}
          <li>
            <Link
              href="/ask"
              aria-current={isActive("/ask") ? "page" : undefined}
              className="flex items-center gap-3 h-12 px-3.5 rounded-xl transition-colors"
              style={{ background: isActive("/ask") ? "#22C55E" : "transparent" }}
            >
              <Image src="/spal-ai.webp" alt="" width={20} height={20} className="w-5 h-5 object-contain" />
              <span className="text-[14px] font-bold truncate" style={{ fontFamily: FF, color: isActive("/ask") ? "#0F172A" : "rgba(255,255,255,0.72)" }}>Ask SPAL</span>
            </Link>
          </li>
        </ul>
      </nav>

      <div className="px-6 py-5 text-[11px]" style={{ color: "rgba(255,255,255,0.3)", fontFamily: FF }}>
        SPAL — Spending · Profiting<br />Analysing · Looping
      </div>
    </aside>
  );
}
