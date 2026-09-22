"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowRight01Icon, Restaurant01Icon } from "hugeicons-react";
import { formatCurrency } from "@/lib/utils/currency";
import { useRetailDashboard, PERIODS, relTime } from "@/hooks/useRetailDashboard";
import { InsightsCarousel } from "@/components/home/InsightsCarousel";
import { SetupChecklist } from "@/components/home/SetupChecklist";

const FF = "var(--font-satoshi)";
const BG = "#EDF3E8";
const CARD_SHADOW = "0 1px 6px rgba(0,0,0,0.05)";

// Wide desktop layout for the non-perishable (retail) dashboard. Reads the same
// hooks/useRetailDashboard.ts data as the mobile RetailHome — this component is
// layout-only. See DESKTOP.md.
export function RetailDashboardDesktop() {
  const router = useRouter();
  const {
    loading, period, setPeriod, stats, insights, recentSales, quickActions,
    hasItem, hasSale, salesCount,
  } = useRetailDashboard();

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
                  className="flex-1 h-12 rounded-full text-[13px] font-bold transition-all"
                  style={{ background: active ? "#22C55E" : "transparent", color: active ? "#fff" : "#6B7280" }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* First-run setup checklist (self-hides once complete) */}
        <div className="[&>div]:px-0 [&>div]:mt-0 mb-6 max-w-xl">
          <SetupChecklist hasItem={hasItem} hasSale={hasSale} perishable={false} />
        </div>

        {/* Stat cards — 4-up */}
        <div className="grid grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-white rounded-2xl px-5 py-5 min-w-0" style={{ boxShadow: CARD_SHADOW }}>
              <span className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: s.tint }}>
                <s.Icon size={22} color={s.color} />
              </span>
              <p className="text-[13.5px] text-neutral-500 mt-4">{s.label}</p>
              <p className="font-black text-spal-navy truncate mt-1 text-[26px]" style={{ letterSpacing: "-0.02em" }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Quick Access */}
        <div className="mt-8">
          <p className="text-[16px] font-black text-spal-navy mb-3">Quick Access</p>
          <div className="grid grid-cols-4 gap-3 max-w-xl">
            {quickActions.map((q) => (
              <button key={q.label} onClick={() => router.push(q.href)} className="bg-white rounded-2xl py-4 flex flex-col items-center gap-2 hover:opacity-90 transition-opacity" style={{ boxShadow: CARD_SHADOW }}>
                <span className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: q.tint }}>
                  <q.Icon size={19} color={q.color} />
                </span>
                <span className="text-[12px] font-semibold text-neutral-600">{q.label}</span>
              </button>
            ))}
            <button onClick={() => router.push("/ask")} className="bg-white rounded-2xl py-4 flex flex-col items-center gap-2 hover:opacity-90 transition-opacity" style={{ boxShadow: CARD_SHADOW }}>
              <Image src="/spal-ai.webp" alt="" width={40} height={40} className="w-10 h-10 object-contain" />
              <span className="text-[12px] font-semibold text-neutral-600">Ask SPAL</span>
            </button>
          </div>
        </div>

        {/* Insights + Recent Sales side by side */}
        <div className="grid grid-cols-2 gap-6 mt-8 items-start">
          <div>
            <p className="text-[16px] font-black text-spal-navy mb-3">Insights</p>
            <InsightsCarousel items={insights} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[16px] font-black text-spal-navy">Recent Sales</p>
              {salesCount > 5 && (
                <button onClick={() => router.push("/records")} className="inline-flex items-center gap-1 text-[13px] font-bold" style={{ color: "#16A34A" }}>
                  View All <ArrowRight01Icon size={14} color="#16A34A" />
                </button>
              )}
            </div>

            {loading ? (
              <div className="space-y-2.5">{[1, 2, 3].map((i) => <div key={i} className="h-[68px] bg-white rounded-2xl animate-pulse" />)}</div>
            ) : recentSales.length === 0 ? (
              <div className="bg-white rounded-2xl px-4 py-8 text-center" style={{ boxShadow: CARD_SHADOW }}>
                <p className="text-[14px] font-bold text-spal-navy">No sales yet</p>
                <p className="text-[13px] text-neutral-400 mt-1">Your recent sales will show up here.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentSales.map((r) => {
                  const owing = r.payment_status === "owing";
                  return (
                    <button key={r.id} onClick={() => router.push(`/records/${r.id}`)} className="w-full text-left bg-white rounded-2xl px-4 py-3.5 flex items-center gap-3 hover:opacity-90 transition-opacity" style={{ boxShadow: CARD_SHADOW }}>
                      <span className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#FFF3EC" }}>
                        <Restaurant01Icon size={18} color="#F97316" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14.5px] font-bold text-spal-navy truncate">{r.description ?? "Sale"}</p>
                        <span className="inline-block mt-1 text-[10.5px] font-bold px-2 py-0.5 rounded-full" style={{ background: owing ? "#FFF3EC" : "#EAF7EE", color: owing ? "#C2410C" : "#16A34A" }}>
                          {owing ? "Debt" : "Paid"}
                        </span>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-[14px] font-black text-spal-navy">{formatCurrency(r.amount)}</p>
                        <p className="text-[11px] text-neutral-400 mt-0.5">{relTime(r.created_at)}</p>
                      </div>
                    </button>
                  );
                })}
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
              <button onClick={() => router.push("/wallet")} className="mt-4 inline-flex items-center gap-2 rounded-full px-5 h-12 hover:opacity-90 transition-opacity" style={{ background: "#22C55E" }}>
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
              <button onClick={() => router.push("/wallet")} className="mt-4 inline-flex items-center gap-2 rounded-full px-5 h-12 hover:opacity-90 transition-opacity" style={{ background: "#F97316" }}>
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
