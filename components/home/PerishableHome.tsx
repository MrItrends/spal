"use client";

import Image from "next/image";
import { Search01Icon, Notification03Icon } from "hugeicons-react";
import { useSPALStore } from "@/store";

const BG = "#EEF3E9";
const FF = "var(--font-satoshi)";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

/**
 * Perishable / prepared-goods dashboard — restaurants (food_seller) and
 * bars/drinks (bar_owner). Menu-first, not inventory-first.
 *
 * ── SCAFFOLD ─────────────────────────────────────────────────────────────────
 * This is intentionally a placeholder so the perishable dashboard can be built
 * in its own chat without touching the retail (non-perishable) build.
 * Build the real screens here from the designs. See PERISHABLE_DASHBOARD.md for
 * conventions, what already exists, and the business-type split.
 */
export function PerishableHome() {
  const { user, activeBusiness } = useSPALStore();
  const businessName = activeBusiness?.business_name || user?.business_name || "Your Store";

  return (
    <div className="min-h-full pb-32" style={{ background: BG, fontFamily: FF }}>
      {/* Header (shared pattern — keep or replace per the perishable designs) */}
      <div className="px-5 pt-12 pb-3 flex items-center gap-3">
        <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0" style={{ background: "#D9C7B8" }}>
          {user?.avatar_url
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-[16px] font-black text-white">{businessName.charAt(0)}</div>}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] text-neutral-500" style={{ fontFamily: FF }}>{greeting()}</p>
          <p className="text-[18px] font-black text-spal-navy truncate" style={{ fontFamily: FF }}>{businessName}</p>
        </div>
        <button className="w-11 h-11 rounded-full bg-white/70 flex items-center justify-center active:scale-95" aria-label="Search"><Search01Icon size={19} color="#6B7280" /></button>
        <button className="w-11 h-11 rounded-full bg-white/70 flex items-center justify-center active:scale-95" aria-label="Notifications"><Notification03Icon size={19} color="#6B7280" /></button>
      </div>

      {/* Placeholder body */}
      <div className="flex flex-col items-center justify-center text-center px-8" style={{ paddingTop: "24vh" }}>
        <Image src="/spal-ai.webp" alt="SPAL" width={96} height={96} className="w-24 h-24 object-contain" />
        <p className="text-[22px] font-black text-spal-navy mt-4" style={{ fontFamily: FF }}>Restaurant dashboard coming</p>
        <p className="text-[15px] text-neutral-500 mt-1 max-w-[300px]" style={{ fontFamily: FF }}>
          The menu-first dashboard for restaurants and bars is being built. This is the scaffold it will replace.
        </p>
      </div>
    </div>
  );
}
