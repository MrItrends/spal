"use client";

import { useRouter } from "next/navigation";
import { ArrowRight01Icon, Restaurant01Icon } from "hugeicons-react";
import { formatCurrency } from "@spal/core/lib/utils/currency";
import { useRetailDashboard, PERIODS, relTime } from "@spal/core/hooks/useRetailDashboard";
import { STAT_ICONS, QUICK_ACTION_ICONS } from "./statIcons";
import { InsightsRow } from "./InsightsRow";

const FF = "var(--font-satoshi)";
const CARD_SHADOW = "0 1px 6px rgba(0,0,0,0.05)";

/** Wide desktop layout for the non-perishable (retail) dashboard — reads @spal/core/hooks/useRetailDashboard, same data the mobile app's RetailHome uses. */
export function RetailDashboard() {
  const router = useRouter();
  const {
    loading, period, setPeriod, stats, insights, recentSales, quickActions, salesCount,
  } = useRetailDashboard();

  return (
    <div className="max-w-[1200px] mx-auto px-10 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[22px] font-black text-spal-navy" style={{ fontFamily: FF }}>Overview</h1>
        <div className="flex items-center bg-white rounded-full p-1 w-[380px]" style={{ boxShadow: CARD_SHADOW }}>
          {PERIODS.map((p) => {
            const active = period === p.key;
            return (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className="flex-1 h-12 rounded-full text-[13px] font-bold transition-all"
                style={{ fontFamily: FF, background: active ? "#22C55E" : "transparent", color: active ? "#fff" : "#6B7280" }}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = STAT_ICONS[s.iconKey];
          return (
            <div key={s.label} className="bg-white rounded-2xl px-5 py-5 min-w-0" style={{ boxShadow: CARD_SHADOW }}>
              <span className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: s.tint }}>
                <Icon size={22} color={s.color} />
              </span>
              <p className="text-[13.5px] text-neutral-500 mt-4" style={{ fontFamily: FF }}>{s.label}</p>
              <p className="font-black text-spal-navy truncate mt-1 text-[26px]" style={{ fontFamily: FF, letterSpacing: "-0.02em" }}>{s.value}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-8">
        <p className="text-[16px] font-black text-spal-navy mb-3" style={{ fontFamily: FF }}>Quick Access</p>
        <div className="grid grid-cols-4 gap-4">
          {quickActions.map((q) => {
            const Icon = QUICK_ACTION_ICONS[q.iconKey];
            return (
              <button key={q.label} onClick={() => router.push(q.href)} className="bg-white rounded-2xl py-4 flex flex-col items-center gap-2 hover:opacity-90 transition-opacity" style={{ boxShadow: CARD_SHADOW }}>
                <span className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: q.tint }}>
                  <Icon size={19} color={q.color} />
                </span>
                <span className="text-[12px] font-semibold text-neutral-600" style={{ fontFamily: FF }}>{q.label}</span>
              </button>
            );
          })}
          <button onClick={() => router.push("/insights")} className="bg-white rounded-2xl py-4 flex flex-col items-center gap-2 hover:opacity-90 transition-opacity" style={{ boxShadow: CARD_SHADOW }}>
            <span className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "#EAF0FC" }}>
              <ArrowRight01Icon size={19} color="#2563EB" />
            </span>
            <span className="text-[12px] font-semibold text-neutral-600" style={{ fontFamily: FF }}>Insights</span>
          </button>
        </div>
      </div>

      <div className="mt-8">
        <p className="text-[16px] font-black text-spal-navy mb-3" style={{ fontFamily: FF }}>Insights</p>
        <InsightsRow items={insights} />
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[16px] font-black text-spal-navy" style={{ fontFamily: FF }}>Recent Sales</p>
          {salesCount > 5 && (
            <button onClick={() => router.push("/records")} className="inline-flex items-center gap-1 text-[13px] font-bold" style={{ fontFamily: FF, color: "#16A34A" }}>
              View All <ArrowRight01Icon size={14} color="#16A34A" />
            </button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3">{[1, 2, 3, 4].map((i) => <div key={i} className="h-[68px] bg-white rounded-2xl animate-pulse" />)}</div>
        ) : recentSales.length === 0 ? (
          <div className="bg-white rounded-2xl px-4 py-8 text-center" style={{ boxShadow: CARD_SHADOW }}>
            <p className="text-[14px] font-bold text-spal-navy" style={{ fontFamily: FF }}>No sales yet</p>
            <p className="text-[13px] text-neutral-400 mt-1" style={{ fontFamily: FF }}>Your recent sales will show up here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {recentSales.map((r) => {
              const owing = r.payment_status === "owing";
              return (
                <button key={r.id} onClick={() => router.push(`/records/${r.id}`)} className="w-full text-left bg-white rounded-2xl px-4 py-3.5 flex items-center gap-3 hover:opacity-90 transition-opacity" style={{ boxShadow: CARD_SHADOW }}>
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
    </div>
  );
}
