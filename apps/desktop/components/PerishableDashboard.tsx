"use client";

import { useRouter } from "next/navigation";
import { ArrowRight01Icon, Alert02Icon } from "hugeicons-react";
import { formatCurrency } from "@spal/core/lib/utils/currency";
import { usePerishableDashboard, PERIODS, dayLabel } from "@spal/core/hooks/usePerishableDashboard";
import { STAT_ICONS, QUICK_ACTION_ICONS, DISH_ICONS } from "./statIcons";
import { InsightsRow } from "./InsightsRow";

const FF = "var(--font-satoshi)";
const CARD_SHADOW = "0 1px 6px rgba(0,0,0,0.05)";

/** Wide desktop layout for the perishable (restaurant/bar) dashboard — reads @spal/core/hooks/usePerishableDashboard, same data the mobile app's PerishableHome uses. */
export function PerishableDashboard() {
  const router = useRouter();
  const {
    loading, error, refetch, period, setPeriod, stats, insights, recentOrders, quickActions, salesCount,
  } = usePerishableDashboard();

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
                aria-label={p.label}
                className="flex-1 h-12 rounded-full text-[13px] font-bold transition-all"
                style={{ fontFamily: FF, background: active ? "#22C55E" : "transparent", color: active ? "#fff" : "#6B7280" }}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {error && !loading && (
        <div className="rounded-2xl px-4 py-3 flex items-center gap-3 mb-6" style={{ background: "#FEE0E1" }}>
          <Alert02Icon size={20} color="#DC2626" />
          <p className="flex-1 text-[13px] font-semibold text-red-700">Couldn&apos;t load your numbers. Check your connection.</p>
          <button onClick={refetch} aria-label="Try again" className="h-11 px-4 rounded-xl bg-white text-[13px] font-bold text-red-600 hover:opacity-90">Try again</button>
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = STAT_ICONS[s.iconKey];
          return (
            <div key={s.label} className="bg-white rounded-2xl px-5 py-5 min-w-0" style={{ boxShadow: CARD_SHADOW }}>
              <span className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: s.tint }}>
                <Icon size={22} color={s.color} />
              </span>
              <p className="text-[13.5px] text-neutral-500 mt-4" style={{ fontFamily: FF }}>{s.label}</p>
              {loading
                ? <div className="h-8 w-24 rounded bg-neutral-100 animate-pulse mt-2" />
                : <p className="font-black text-spal-navy truncate mt-1 text-[26px]" style={{ fontFamily: FF, letterSpacing: "-0.02em" }}>{s.value}</p>}
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
              <button key={q.label} onClick={() => router.push(q.href)} aria-label={q.label} className="bg-white rounded-2xl py-4 flex flex-col items-center gap-2 hover:opacity-90 transition-opacity" style={{ boxShadow: CARD_SHADOW }}>
                <span className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: q.tint }}>
                  <Icon size={19} color={q.color} />
                </span>
                <span className="text-[12px] font-semibold text-neutral-600" style={{ fontFamily: FF }}>{q.label}</span>
              </button>
            );
          })}
          <button onClick={() => router.push("/insights")} aria-label="Insights" className="bg-white rounded-2xl py-4 flex flex-col items-center gap-2 hover:opacity-90 transition-opacity" style={{ boxShadow: CARD_SHADOW }}>
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
          <p className="text-[16px] font-black text-spal-navy" style={{ fontFamily: FF }}>Recent Orders</p>
          {salesCount > 4 && (
            <button onClick={() => router.push("/records")} aria-label="View all orders" className="inline-flex items-center gap-1 text-[13px] font-bold" style={{ fontFamily: FF, color: "#16A34A" }}>
              View All <ArrowRight01Icon size={14} color="#16A34A" />
            </button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3">{[1, 2, 3, 4].map((i) => <div key={i} className="h-[68px] bg-white rounded-2xl animate-pulse" />)}</div>
        ) : recentOrders.length === 0 ? (
          <div className="bg-white rounded-2xl px-4 py-8 text-center" style={{ boxShadow: CARD_SHADOW }}>
            <p className="text-[14px] font-bold text-spal-navy" style={{ fontFamily: FF }}>No orders yet</p>
            <p className="text-[13px] text-neutral-400 mt-1" style={{ fontFamily: FF }}>Tap POS when your first customer walks in.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {recentOrders.map(({ record: r, label, tint, iconKey, pay }) => {
              const Icon = DISH_ICONS[iconKey];
              return (
                <button key={r.id} onClick={() => router.push(`/records/${r.id}`)} aria-label={`Order ${label}`} className="w-full text-left bg-white rounded-2xl px-4 py-3.5 flex items-center gap-3 hover:opacity-90 transition-opacity" style={{ boxShadow: CARD_SHADOW }}>
                  <span className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: tint.bg }}>
                    <Icon size={20} color={tint.color} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-bold text-spal-navy truncate" style={{ fontFamily: FF }}>{label}</p>
                    <span className="inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: pay.bg, color: pay.color }}>
                      {pay.label}
                    </span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[15px] font-black text-spal-navy" style={{ fontFamily: FF }}>{formatCurrency(r.amount)}</p>
                    <p className="text-[12px] text-neutral-400 mt-0.5">{dayLabel(r.created_at)}</p>
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
