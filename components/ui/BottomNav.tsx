"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home01Icon, ShoppingCartAdd01Icon, PackageIcon, Wallet01Icon, User02Icon } from "hugeicons-react";

const FF = "var(--font-satoshi)";

const TABS = [
  { href: "/home",              label: "Home",    Icon: Home01Icon },
  { href: "/sell",              label: "Sell",    Icon: ShoppingCartAdd01Icon },
  { href: "/inventory",         label: "Stock",   Icon: PackageIcon },
  { href: "/wallet",            label: "Wallet",  Icon: Wallet01Icon },
  { href: "/profile",           label: "Profile", Icon: User02Icon },
];

// Full-screen flows where the tab bar should not show.
const HIDDEN = ["/ask", "/set-goals", "/records/add-sale/", "/records/add-expense/", "/picture", "/voice", "/confirm", "/scan", "/billing", "/inventory/add", "/profile/"];

export function BottomNav() {
  const pathname = usePathname();
  if (HIDDEN.some((p) => pathname.includes(p))) return null;

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-4 z-40"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 10px)" }}
      aria-label="Primary"
    >
      <div
        className="flex items-center justify-between rounded-[26px] px-2 py-2"
        style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "saturate(180%) blur(20px)", boxShadow: "0 4px 24px rgba(0,0,0,0.10)" }}
      >
        {TABS.map(({ href, label, Icon }) => {
          const active = href === "/home" ? pathname === "/home" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center gap-1 py-1.5 rounded-2xl active:scale-95 transition-transform"
              style={{ background: active ? "#EEF3E9" : "transparent" }}
              aria-current={active ? "page" : undefined}
            >
              <Icon size={22} color={active ? "#0F172A" : "#9CA3AF"} />
              <span className="text-[10.5px] font-semibold" style={{ fontFamily: FF, color: active ? "#0F172A" : "#9CA3AF" }}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
