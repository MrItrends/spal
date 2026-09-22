"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowRight01Icon, Alert02Icon } from "hugeicons-react";
import { formatCurrency } from "@/lib/utils/currency";
import { usePerishableDashboard, PERIODS, dayLabel } from "@/hooks/usePerishableDashboard";
import { InsightsCarousel } from "@/components/home/InsightsCarousel";
import { SetupChecklist } from "@/components/home/SetupChecklist";

const FF = "var(--font-satoshi)";
const BG = "#EDF3E8";
const CARD_SHADOW = "0 1px 6px rgba(0,0,0,0.05)";

// Wide desktop layout for the perishable (restaurant/bar) dashboard. Reads the
// same hooks/usePerishableDashboard.ts data as the mobile PerishableHome — this
// component is layout-only. See DESKTOP.md.
export function PerishableDashboardDesktop() {
  const router = useRouter();
  const {
    loading, error, refetch, period, setPeriod, stats, insights, recentOrders,
    quickActions, hasItem, hasSale, salesCount,
  } = usePerishableDashboard();

  return (
    <div className="min-h-full" style={{ background: BG, fontFamily: FF }}>
      <div className="max-w-[1200px] mx-auto px-10 py-8">
        {/* Period tabs */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-[22px] font-black text-spal-navy">Overview</h1>
          <div className="flex items-center bg-white rounded-full p-1 w-[380px]" style={{ boxShadow: CARD_SHADOW }}>
            {PERIODS.map((p) => {
              const active = period === p.key;
              return (
                <button
                  key={p.key}
                  onClick={() => setPeriod(p.key)}
                  aria-label={p.label}
                  className="flex-1 h-12 rounded-full text-[13px] font-bold transition-all"
                  style={{ background: active ? "#22C55E" : "transparent", color: active ? "#fff" : "#6B7280" }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Error */}
        {error && !loading && (
          <div className="rounded-2xl px-4 py-3 flex items-center gap-3 mb-6" style={{ background: "#FEE0E1" }}>
            <Alert02Icon size={20} color="#DC2626" />
            <p className="flex-1 text-[13px] font-semibold text-red-700">Couldn&apos;t load your numbers. Check your connection.</p>
            <button onClick={refetch} aria-label="Try again" className="h-12 px-4 rounded-xl bg-white text-[13px] font-bold text-red-600 hover:opacity-90">Try again</button>
          </div>
        )}

        {/* First-run setup checklist (self-hides once complete) */}
        <div className="[&>div]:px-0 [&>div]:mt-0 mb-6 max-w-xl">
          <SetupChecklist hasItem={hasItem} hasSale={hasSale} perishable={true} />
        </div>

        {/* Stat cards — 4-up */}
        <div className="grid grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-white rounded-2xl px-5 py-5 min-w-0" style={{ boxShadow: CARD_SHADOW }}>
              <span className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: s.tint }}>
                <s.Icon size={22} color={s.color} />
              </span>
              <p className="text-[13.5px] text-neutral-500 mt-4">{s.label}</p>
              {loading
                ? <div className="h-8 w-24 rounded bg-neutral-100 animate-pulse mt-2" />
                : <p className="font-black text-spal-navy truncate mt-1 text-[26px]" style={{ letterSpacing: "-0.02em" }}>{s.value}</p>}
            </div>
          ))}
        </div>

        {/* Quick Access */}
        <div className="mt-8">
          <p className="text-[16px] font-black text-spal-navy mb-3">Quick Access</p>
          <div className="grid grid-cols-4 gap-3 max-w-xl">
            {quickActions.map((q) => (
              <button key={q.label} onClick={() => router.push(q.href)} aria-label={q.label} className="bg-white rounded-2xl py-4 flex flex-col items-center gap-2 hover:opacity-90 transition-opacity" style={{ boxShadow: CARD_SHADOW }}>
                <span className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: q.tint }}>
                  <q.Icon size={19} color={q.color} />
                </span>
                <span className="text-[12px] font-semibold text-neutral-600">{q.label}</span>
              </button>
            ))}
            <button onClick={() => router.push("/ask")} aria-label="Ask SPAL" className="bg-white rounded-2xl py-4 flex flex-col items-center gap-2 hover:opacity-90 transition-opacity" style={{ boxShadow: CARD_SHADOW }}>
              <Image src="/spal-ai.webp" alt="" width={40} height={40} className="w-10 h-10 object-contain" />
              <span className="text-[12px] font-semibold text-neutral-600">Ask SPAL</span>
            </button>
          </div>
        </div>

        {/* Insights + Recent Orders side by side */}
        <div className="grid grid-cols-2 gap-6 mt-8 items-start">
          <div>
            <p className="text-[16px] font-black text-spal-navy mb-3">Insights</p>
            <InsightsCarousel items={insights} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[16px] font-black text-spal-navy">Recent Orders</p>
              {salesCount > 4 && (
                <button onClick={() => router.push("/records")} aria-label="View all orders" className="inline-flex items-center gap-1 text-[13px] font-bold" style={{ color: "#16A34A" }}>
                  View All <ArrowRight01Icon size={14} color="#16A34A" />
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
                  <button key={r.id} onClick={() => router.push(`/records/${r.id}`)} aria-label={`Order ${label}`} className="w-full text-left bg-white rounded-2xl px-4 py-3.5 flex items-center gap-3 hover:opacity-90 transition-opacity" style={{ boxShadow: CARD_SHADOW }}>
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
        </div>

        {/* Promos */}
        <div className="grid grid-cols-2 gap-6 mt-8">
          <div className="rounded-2xl overflow-hidden relative px-6 py-6" style={{ background: "#EEFAF3", minHeight: 160 }}>
            <div className="relative z-10" style={{ maxWidth: "62%" }}>
              <p className="text-[19px] font-black text-spal-navy leading-tight">Do you have a POS Device?</p>
              <p className="text-[13px] text-neutral-500 mt-1">Either a handheld or desktop POS device</p>
              <button onClick={() => router.push("/wallet")} aria-label="Connect Device" className="mt-4 inline-flex items-center gap-2 rounded-full px-5 h-12 hover:opacity-90 transition-opacity" style={{ background: "#22C55E" }}>
                <span className="text-white font-bold text-[13.5px]">Connect Device</span>
                <ArrowRight01Icon size={15} color="#fff" />
              </button>
            </div>
            <Image src="/home-pos-device.webp" alt="" width={510} height={600} className="absolute right-4 bottom-0 h-[150px] w-auto pointer-events-none" />
          </div>

          <div className="rounded-2xl overflow-hidden relative px-6 py-6" style={{ background: "#FFF4EF", minHeight: 160 }}>
            <div className="relative z-10" style={{ maxWidth: "62%" }}>
              <p className="text-[19px] font-black text-spal-navy leading-tight">Get Your SPAL Account Number</p>
              <p className="text-[13px] text-neutral-500 mt-1.5 leading-relaxed">Receive payments directly in SPAL and keep your records up to date</p>
              <button onClick={() => router.push("/wallet")} aria-label="Claim Number" className="mt-4 inline-flex items-center gap-2 rounded-full px-5 h-12 hover:opacity-90 transition-opacity" style={{ background: "#F97316" }}>
                <span className="text-white font-bold text-[13.5px]">Claim Number</span>
                <ArrowRight01Icon size={15} color="#fff" />
              </button>
            </div>
            <Image src="/home-account-phone.webp" alt="" width={222} height={400} className="absolute right-5 bottom-0 h-[150px] w-auto pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
}
