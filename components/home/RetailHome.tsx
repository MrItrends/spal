"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { Search01Icon, Notification03Icon, ArrowRight01Icon, Restaurant01Icon } from "hugeicons-react";
import { formatCurrency } from "@/lib/utils/currency";
import { useRetailDashboard, PERIODS, relTime } from "@/hooks/useRetailDashboard";
import { InsightsCarousel } from "./InsightsCarousel";
import { SetupChecklist } from "./SetupChecklist";

const FF = "var(--font-satoshi)";
const BG = "#EDF3E8";

// Non-perishable / retail dashboard (kiosk, supermarket, clothing, salon, etc.).
// The perishable (restaurant/bar) dashboard is a separate component — see
// components/home/PerishableHome.tsx and PERISHABLE_DASHBOARD.md.
// Data + computation live in hooks/useRetailDashboard.ts, shared with the
// desktop layout — this component is layout-only.
export function RetailHome() {
  const router = useRouter();
  const {
    loading, period, setPeriod, stats, insights, recentSales, quickActions,
    hasItem, hasSale, unread, clearUnread, businessName, greeting,
    user, salesCount,
  } = useRetailDashboard();

  return (
    <div className="min-h-full pb-28" style={{ background: BG, fontFamily: FF }}>
      {/* Header */}
      <div className="px-5 pt-12 flex items-center justify-between">
        <button onClick={() => router.push("/profile")} className="flex items-center gap-3 active:opacity-80">
          <span className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0" style={{ background: "#D9C7B8" }}>
            {user?.avatar_url
              ? <Image src={user.avatar_url} alt="" width={48} height={48} className="w-full h-full object-cover" />
              : <span className="text-white font-bold text-[18px]">{businessName.charAt(0).toUpperCase()}</span>}
          </span>
          <span className="text-left">
            <span className="block text-[13px] text-neutral-500">{greeting}</span>
            <span className="block text-[20px] font-black text-spal-navy leading-tight truncate max-w-[190px]">{businessName}</span>
          </span>
        </button>
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <button onClick={() => router.push("/records")} aria-label="Search" className="w-11 h-11 rounded-full bg-white flex items-center justify-center active:scale-95 transition-transform" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <Search01Icon size={19} color="#0F172A" />
          </button>
          <button onClick={() => { clearUnread(); router.push("/notifications"); }} aria-label="Notifications" className="w-11 h-11 rounded-full bg-white flex items-center justify-center relative active:scale-95 transition-transform" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <Notification03Icon size={19} color="#0F172A" />
            {unread > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">{unread > 9 ? "9+" : unread}</span>}
          </button>
        </div>
      </div>

      {/* Period tabs */}
      <div className="px-5 mt-5">
        <div className="flex items-center bg-white rounded-full p-1" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
          {PERIODS.map((p) => {
            const active = period === p.key;
            return (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className="flex-1 h-9 rounded-full text-[13px] font-bold transition-all"
                style={{ background: active ? "#22C55E" : "transparent", color: active ? "#fff" : "#6B7280" }}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* First-run setup checklist (self-hides once complete) */}
      <SetupChecklist hasItem={hasItem} hasSale={hasSale} perishable={false} />

      {/* Stat cards */}
      <div className="px-5 mt-4 grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl px-4 py-4 min-w-0" style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
            <span className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: s.tint }}>
              <s.Icon size={20} color={s.color} />
            </span>
            <p className="text-[13px] text-neutral-500 mt-3" style={{ fontFamily: FF }}>{s.label}</p>
            <p className="font-black text-spal-navy truncate mt-0.5" style={{ fontFamily: FF, fontSize: "clamp(18px, 6vw, 24px)", letterSpacing: "-0.02em" }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Insight promo */}
      <div className="px-5 mt-4">
        <div className="rounded-2xl overflow-hidden relative px-4 py-5" style={{ background: "#F0F3FE", minHeight: 150 }}>
          <div className="relative z-10" style={{ maxWidth: "60%" }}>
            <p className="text-[16px] font-black text-spal-navy leading-snug" style={{ fontFamily: FF }}>View full Earning/Spending Insight</p>
            <p className="text-[13px] text-neutral-500 mt-1" style={{ fontFamily: FF }}>Looking for more insights?</p>
            <button onClick={() => router.push("/insights")} className="mt-4 inline-flex items-center gap-2 rounded-xl px-4 h-11 active:scale-[0.98] transition-transform" style={{ background: "#2563EB" }}>
              <span className="text-white font-bold text-[14px]" style={{ fontFamily: FF }}>See Insight</span>
              <ArrowRight01Icon size={16} color="#fff" />
            </button>
          </div>
          <Image src="/home-insight-bars.webp" alt="" width={286} height={200} className="absolute right-4 top-1/2 -translate-y-1/2 w-[135px] h-auto pointer-events-none" />
        </div>
      </div>

      {/* Quick Access */}
      <div className="px-5 mt-6">
        <p className="text-[16px] font-black text-spal-navy mb-3" style={{ fontFamily: FF }}>Quick Access</p>
        <div className="grid grid-cols-4 gap-2.5">
          {quickActions.map((q) => (
            <button key={q.label} onClick={() => router.push(q.href)} className="bg-white rounded-2xl py-4 flex flex-col items-center gap-2 active:scale-95 transition-transform" style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
              <span className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: q.tint }}>
                <q.Icon size={19} color={q.color} />
              </span>
              <span className="text-[12px] font-semibold text-neutral-600" style={{ fontFamily: FF }}>{q.label}</span>
            </button>
          ))}
          <button onClick={() => (window.location.href = "/ask")} className="bg-white rounded-2xl py-4 flex flex-col items-center gap-2 active:scale-95 transition-transform" style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
            <Image src="/spal-ai.webp" alt="" width={40} height={40} className="w-10 h-10 object-contain" />
            <span className="text-[12px] font-semibold text-neutral-600" style={{ fontFamily: FF }}>Ask SPAL</span>
          </button>
        </div>
      </div>

      {/* Insights / news carousel */}
      <div className="px-5 mt-5">
        <InsightsCarousel items={insights} />
      </div>

      {/* Recent Sales */}
      <div className="px-5 mt-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[16px] font-black text-spal-navy" style={{ fontFamily: FF }}>Recent Sales</p>
          {salesCount > 5 && (
            <button onClick={() => router.push("/records")} className="inline-flex items-center gap-1 text-[13px] font-bold" style={{ fontFamily: FF, color: "#16A34A" }}>
              View All Sales <ArrowRight01Icon size={14} color="#16A34A" />
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-2.5">{[1, 2, 3].map((i) => <div key={i} className="h-[68px] bg-white rounded-2xl animate-pulse" />)}</div>
        ) : recentSales.length === 0 ? (
          <div className="bg-white rounded-2xl px-4 py-8 text-center" style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
            <p className="text-[14px] font-bold text-spal-navy" style={{ fontFamily: FF }}>No sales yet</p>
            <p className="text-[13px] text-neutral-400 mt-1" style={{ fontFamily: FF }}>Your recent sales will show up here.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {recentSales.map((r) => {
              const owing = r.payment_status === "owing";
              return (
                <button key={r.id} onClick={() => router.push(`/records/${r.id}`)} className="w-full text-left bg-white rounded-2xl px-4 py-3.5 flex items-center gap-3 active:scale-[0.99] transition-transform" style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
                  <span className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#FFF3EC" }}>
                    <Restaurant01Icon size={18} color="#F97316" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14.5px] font-bold text-spal-navy truncate" style={{ fontFamily: FF }}>{r.description ?? "Sale"}</p>
                    <span className="inline-block mt-1 text-[10.5px] font-bold px-2 py-0.5 rounded-full" style={{ background: owing ? "#FFF3EC" : "#EAF7EE", color: owing ? "#C2410C" : "#16A34A" }}>
                      {owing ? "Debt" : "Paid"}
                    </span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[14px] font-black text-spal-navy" style={{ fontFamily: FF }}>{formatCurrency(r.amount)}</p>
                    <p className="text-[11px] text-neutral-400 mt-0.5">{relTime(r.created_at)}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* POS device promo */}
      <div className="px-5 mt-5">
        <div className="rounded-2xl overflow-hidden relative px-4 py-5" style={{ background: "#EEFAF3", minHeight: 150 }}>
          <div className="relative z-10" style={{ maxWidth: "62%" }}>
            <p className="text-[18px] font-black text-spal-navy leading-tight" style={{ fontFamily: FF }}>Do you have a POS Device?</p>
            <p className="text-[12.5px] text-neutral-500 mt-1" style={{ fontFamily: FF }}>Either a handheld or desktop POS device</p>
            <button onClick={() => router.push("/wallet")} className="mt-4 inline-flex items-center gap-2 rounded-full px-5 h-11 active:scale-[0.98] transition-transform" style={{ background: "#22C55E" }}>
              <span className="text-white font-bold text-[13.5px]" style={{ fontFamily: FF }}>Connect Device</span>
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
            <p className="text-[18px] font-black text-spal-navy leading-tight" style={{ fontFamily: FF }}>Get Your SPAL<br />Account Number</p>
            <p className="text-[12.5px] text-neutral-500 mt-1.5 leading-relaxed" style={{ fontFamily: FF }}>Receive payments directly in SPAL and keep your business records up to date</p>
            <button onClick={() => router.push("/wallet")} className="mt-4 inline-flex items-center gap-2 rounded-full px-5 h-11 active:scale-[0.98] transition-transform" style={{ background: "#F97316" }}>
              <span className="text-white font-bold text-[13.5px]" style={{ fontFamily: FF }}>Claim Number</span>
              <ArrowRight01Icon size={15} color="#fff" />
            </button>
          </div>
          <Image src="/home-account-phone.webp" alt="" width={222} height={400} className="absolute right-3 bottom-0 h-[158px] w-auto pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
