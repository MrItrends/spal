"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowRight01Icon, Alert02Icon } from "hugeicons-react";
import { formatCurrency } from "@/lib/utils/currency";
import { usePerishableDashboard, PERIODS, dayLabel } from "@/hooks/usePerishableDashboard";
import { AppHeader } from "./AppHeader";
import { InsightsCarousel } from "./InsightsCarousel";
import { SetupChecklist } from "./SetupChecklist";
import { TargetPulse } from "@/components/shared/TargetPulse";
import { markSetupSeen } from "@/lib/setup-progress";

const CARD_SHADOW = "0 1px 6px rgba(0,0,0,0.05)";

// Perishable / prepared-goods dashboard: restaurants (food_seller) and bars
// (bar_owner). Sells from the menu; ingredients/stock live under Inventory.
// The retail dashboard lives in RetailHome.tsx (see PERISHABLE_DASHBOARD.md).
// Data + computation live in hooks/usePerishableDashboard.ts, shared with the
// desktop layout — this component is layout-only.
export function PerishableHome() {
  const router = useRouter();
  const {
    loading, error, refetch, period, setPeriod, stats, insights, recentOrders,
    quickActions, hasItem, hasSale, menuCount, salesCount,
  } = usePerishableDashboard();

  // Points at whatever the setup checklist wants done next (same steps/order as
  // SetupChecklist, read from the same flags) — a visual nudge on top of the
  // checklist's own "tap to go there" rows, for anyone who's collapsed the card.
  // Mobile-only: highlights the bottom tab bar / quick-access buttons.
  const [setupTarget, setSetupTarget] = useState<string | null>(null);
  useEffect(() => {
    if (loading) return;
    try {
      if (localStorage.getItem("spal_setup_done")) { setSetupTarget(null); return; }
      const seen = (k: string) => !!localStorage.getItem(`spal_seen_${k}`);
      if (menuCount === 0)         { setSetupTarget("tab-menu"); return; }
      if (!hasSale)                { setSetupTarget("tab-orders"); return; }
      if (!seen("category"))       { setSetupTarget("tab-menu"); return; }
      if (!seen("ask"))            { setSetupTarget("ask-quick-access"); return; }
      if (!seen("profile"))        { setSetupTarget("tab-profile"); return; }
      setSetupTarget(null);
    } catch { setSetupTarget(null); }
  }, [loading, menuCount, hasSale]);

  return (
    <div className="min-h-full pb-nav" style={{ background: "#EDF3E8", fontFamily: "var(--font-satoshi)" }}>
      {/* Header */}
      <AppHeader />

      {/* Period tabs */}
      <div className="px-5 mt-5">
        <div className="flex items-center bg-white rounded-full p-1" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
          {PERIODS.map((p) => {
            const active = period === p.key;
            return (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                aria-label={p.label}
                className="flex-1 min-w-0 h-12 px-1 rounded-full font-bold transition-all whitespace-nowrap"
                style={{ fontSize: "clamp(11px, 3.3vw, 13px)", background: active ? "#22C55E" : "transparent", color: active ? "#fff" : "#6B7280" }}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Error */}
      {error && !loading && (
        <div className="px-5 mt-4">
          <div className="rounded-2xl px-4 py-3 flex items-center gap-3" style={{ background: "#FEE0E1" }}>
            <Alert02Icon size={20} color="#DC2626" />
            <p className="flex-1 text-[13px] font-semibold text-red-700">Couldn&apos;t load your numbers. Check your connection.</p>
            <button onClick={refetch} aria-label="Try again" className="h-12 px-4 rounded-xl bg-white text-[13px] font-bold text-red-600 active:scale-95">Try again</button>
          </div>
        </div>
      )}

      {/* First-run setup checklist (self-hides once complete) */}
      <SetupChecklist hasItem={hasItem} hasSale={hasSale} perishable={true} />
      {setupTarget && <TargetPulse targetAttr={setupTarget} />}

      {/* Stat cards */}
      <div className="px-5 mt-4 grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl px-4 py-4 min-w-0" style={{ boxShadow: CARD_SHADOW }}>
            <span className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: s.tint }}>
              <s.Icon size={20} color={s.color} />
            </span>
            <p className="text-[13px] text-neutral-500 mt-3">{s.label}</p>
            {loading
              ? <div className="h-7 w-20 rounded bg-neutral-100 animate-pulse mt-1" />
              : <p className="font-black text-spal-navy truncate mt-0.5" style={{ fontSize: "clamp(18px, 6vw, 24px)", letterSpacing: "-0.02em" }}>{s.value}</p>}
          </div>
        ))}
      </div>

      {/* Quick Access */}
      <div className="px-5 mt-6">
        <p className="text-[16px] font-black text-spal-navy mb-3">Quick Access</p>
        <div className="grid grid-cols-4 gap-2.5">
          {quickActions.map((q) => (
            <button key={q.label} onClick={() => router.push(q.href)} aria-label={q.label} className="bg-white rounded-2xl py-4 min-h-[88px] flex flex-col items-center gap-2 active:scale-95 transition-transform" style={{ boxShadow: CARD_SHADOW }}>
              <span className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: q.tint }}>
                <q.Icon size={19} color={q.color} />
              </span>
              <span className="text-[12px] font-semibold text-neutral-600">{q.label}</span>
            </button>
          ))}
          <button onClick={() => { markSetupSeen("ask"); window.location.href = "/ask"; }} aria-label="Ask SPAL" data-setup-target="ask-quick-access" className="bg-white rounded-2xl py-4 min-h-[88px] flex flex-col items-center gap-2 active:scale-95 transition-transform" style={{ boxShadow: CARD_SHADOW }}>
            <Image src="/spal-ai.webp" alt="" width={40} height={40} className="w-10 h-10 object-contain" />
            <span className="text-[12px] font-semibold text-neutral-600">Ask SPAL</span>
          </button>
        </div>
      </div>

      {/* Insight promo */}
      <div className="px-5 mt-4">
        <div className="rounded-2xl overflow-hidden relative px-4 py-5" style={{ background: "#F0F3FE", minHeight: 150 }}>
          <div className="relative z-10" style={{ maxWidth: "60%" }}>
            <p className="text-[16px] font-black text-spal-navy leading-snug">View full Earning/Spending Insight</p>
            <p className="text-[13px] text-neutral-500 mt-1">Looking for more insights?</p>
            <button onClick={() => router.push("/insights")} aria-label="See Insight" className="mt-4 inline-flex items-center gap-2 rounded-xl px-4 h-12 active:scale-[0.98] transition-transform" style={{ background: "#2563EB" }}>
              <span className="text-white font-bold text-[14px]">See Insight</span>
              <ArrowRight01Icon size={16} color="#fff" />
            </button>
          </div>
          <Image src="/home-insight-bars.webp" alt="" width={286} height={200} className="absolute right-4 top-1/2 -translate-y-1/2 w-[135px] h-auto pointer-events-none" />
        </div>
      </div>

      {/* Insights carousel */}
      <div className="px-5 mt-5">
        <InsightsCarousel items={insights} />
      </div>

      {/* Recent orders */}
      <div className="px-5 mt-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[16px] font-black text-spal-navy">Recent Orders</p>
          {salesCount > 4 && (
            <button onClick={() => router.push("/records")} aria-label="View all orders" className="inline-flex items-center gap-1 text-[13px] font-bold min-h-12" style={{ color: "#16A34A" }}>
              View All Orders <ArrowRight01Icon size={14} color="#16A34A" />
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-2.5">{[1, 2, 3].map((i) => <div key={i} className="h-[68px] bg-white rounded-2xl animate-pulse" />)}</div>
        ) : recentOrders.length === 0 ? (
          <div className="bg-white rounded-2xl px-4 py-8 text-center" style={{ boxShadow: CARD_SHADOW }}>
            <p className="text-[14px] font-bold text-spal-navy">No orders yet</p>
            <p className="text-[13px] text-neutral-400 mt-1">Tap POS when your first customer walks in.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {recentOrders.map(({ record: r, label, tint, Icon, pay }) => (
              <button key={r.id} onClick={() => router.push(`/records/${r.id}`)} aria-label={`Order ${label}`} className="w-full text-left bg-white rounded-2xl px-4 py-3.5 min-h-[68px] flex items-center gap-3 active:scale-[0.99] transition-transform" style={{ boxShadow: CARD_SHADOW }}>
                <span className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: tint.bg }}>
                  <Icon size={20} color={tint.color} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-bold text-spal-navy truncate">{label}</p>
                  <span className="inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: pay.bg, color: pay.color }}>
                    {pay.label}
                  </span>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[15px] font-black text-spal-navy">{formatCurrency(r.amount)}</p>
                  <p className="text-[12px] text-neutral-400 mt-0.5">{dayLabel(r.created_at)}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* POS device promo */}
      <div className="px-5 mt-5">
        <div className="rounded-2xl overflow-hidden relative px-4 py-5" style={{ background: "#EEFAF3", minHeight: 150 }}>
          <div className="relative z-10" style={{ maxWidth: "62%" }}>
            <p className="text-[18px] font-black text-spal-navy leading-tight">Do you have a POS Device?</p>
            <p className="text-[12.5px] text-neutral-500 mt-1">Either a handheld or desktop POS device</p>
            <button onClick={() => router.push("/wallet")} aria-label="Connect Device" className="mt-4 inline-flex items-center gap-2 rounded-full px-5 h-12 active:scale-[0.98] transition-transform" style={{ background: "#22C55E" }}>
              <span className="text-white font-bold text-[13.5px]">Connect Device</span>
              <ArrowRight01Icon size={15} color="#fff" />
            </button>
          </div>
          <Image src="/home-pos-device.webp" alt="" width={510} height={600} className="absolute right-2 bottom-0 h-[140px] w-auto pointer-events-none" />
        </div>
      </div>

      {/* SPAL account number promo */}
      <div className="px-5 mt-3">
        <div className="rounded-2xl overflow-hidden relative px-4 py-5" style={{ background: "#FFF4EF", minHeight: 178 }}>
          <div className="relative z-10" style={{ maxWidth: "62%" }}>
            <p className="text-[18px] font-black text-spal-navy leading-tight">Get Your SPAL<br />Account Number</p>
            <p className="text-[12.5px] text-neutral-500 mt-1.5 leading-relaxed">Receive payments directly in SPAL and keep your business records up to date</p>
            <button onClick={() => router.push("/wallet")} aria-label="Claim Number" className="mt-4 inline-flex items-center gap-2 rounded-full px-5 h-12 active:scale-[0.98] transition-transform" style={{ background: "#F97316" }}>
              <span className="text-white font-bold text-[13.5px]">Claim Number</span>
              <ArrowRight01Icon size={15} color="#fff" />
            </button>
          </div>
          <Image src="/home-account-phone.webp" alt="" width={222} height={400} className="absolute right-3 bottom-0 h-[158px] w-auto pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
