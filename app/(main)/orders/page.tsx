"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Search01Icon, Notification03Icon, Dish01Icon, Hamburger01Icon, Alert02Icon,
  Restaurant01Icon, Restaurant02Icon, Restaurant03Icon,
} from "hugeicons-react";
import { useSPALStore } from "@/store";
import { formatCurrency } from "@/lib/utils/currency";
import { getGreeting } from "@/lib/utils/dates";
import { payInfo, iconTint } from "@/lib/sales";
import { orderMeta, STATUS_STYLE } from "@/lib/orders";
import type { BusinessRecord } from "@/lib/types";

const BG = "#EDF3E8";
const FF = "var(--font-satoshi)";
const SHADOW = "0 1px 6px rgba(0,0,0,0.05)";

type Period = "today" | "week" | "month" | "year";
const PERIODS: { key: Period; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "week",  label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "year",  label: "This Year" },
];

function periodStart(p: Period): string {
  const d = new Date();
  if (p === "today") return d.toISOString().slice(0, 10);
  if (p === "week")  { d.setDate(d.getDate() - 6); return d.toISOString().slice(0, 10); }
  if (p === "month") return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  return `${d.getFullYear()}-01-01`;
}

function dayLabel(iso: string) {
  const d = new Date(iso);
  const start = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((start(new Date()) - start(d)) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  return d.toLocaleDateString("en", { month: "short", day: "numeric" });
}

const DISH_ICONS = [Restaurant01Icon, Restaurant02Icon, Restaurant03Icon];
function dishIcon(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return DISH_ICONS[h % DISH_ICONS.length];
}

// Orders tab for restaurants and bars: every order in the period, newest first,
// with a New Order button that starts the order flow.
export default function OrdersPage() {
  const router = useRouter();
  const { user, activeBusiness, recordSavedAt } = useSPALStore();
  const name = activeBusiness?.business_name ?? user?.business_name ?? user?.full_name ?? "there";

  const [period, setPeriod]   = useState<Period>("today");
  const [records, setRecords] = useState<BusinessRecord[]>([]);
  const [menuCount, setMenuCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);
  const [unread, setUnread]   = useState(0);

  const load = useCallback(async (p: Period) => {
    setLoading(true);
    setError(false);
    try {
      const [recRes, menuRes] = await Promise.all([
        fetch(`/api/records?type=sale&start_date=${periodStart(p)}&limit=500`).then((r) => r.json()),
        fetch("/api/menu").then((r) => r.json()),
      ]);
      if (recRes.success) setRecords(recRes.data ?? []); else setError(true);
      if (menuRes.success) setMenuCount(menuRes.data?.items?.length ?? 0);
    } catch { setError(true); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(period); }, [period, load]);
  useEffect(() => { if (recordSavedAt) load(period); }, [recordSavedAt]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetch("/api/notifications").then((r) => r.json())
      .then((d) => { if (d.success) setUnread((d.data as { read_at: string | null }[]).filter((n) => !n.read_at).length); })
      .catch(() => {});
  }, []);

  const orders = useMemo(
    () => [...records].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [records]
  );
  const noMenu = !loading && !error && menuCount === 0;

  return (
    <div className="min-h-full pb-40" style={{ background: BG, fontFamily: FF }}>
      {/* Header */}
      <div className="px-5 pt-12 flex items-center justify-between">
        <button onClick={() => router.push("/profile")} aria-label="Open profile" className="flex items-center gap-3 active:opacity-80 min-h-12">
          <span className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg,#2563EB,#8B5CF6)" }}>
            {user?.avatar_url
              ? <Image src={user.avatar_url} alt="" width={48} height={48} className="w-full h-full object-cover" />
              : <span className="text-white font-bold text-[18px]">{name.charAt(0).toUpperCase()}</span>}
          </span>
          <span className="text-left">
            <span className="block text-[13px] text-neutral-500">{getGreeting()}</span>
            <span className="block text-[20px] font-black text-spal-navy leading-tight truncate max-w-[190px]">{name}</span>
          </span>
        </button>
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <button onClick={() => router.push("/records")} aria-label="Search orders" className="w-12 h-12 rounded-full bg-white flex items-center justify-center active:scale-95 transition-transform" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <Search01Icon size={19} color="#0F172A" />
          </button>
          <button onClick={() => { setUnread(0); router.push("/notifications"); }} aria-label="Notifications" className="w-12 h-12 rounded-full bg-white flex items-center justify-center relative active:scale-95 transition-transform" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
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
              <button key={p.key} onClick={() => setPeriod(p.key)} aria-label={p.label}
                className="flex-1 h-12 rounded-full text-[12.5px] sm:text-[13px] font-bold transition-all whitespace-nowrap"
                style={{ background: active ? "#22C55E" : "transparent", color: active ? "#fff" : "#6B7280" }}>
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Body */}
      {loading ? (
        <div className="px-5 mt-5 space-y-2.5">{[1, 2, 3].map((i) => <div key={i} className="h-[76px] bg-white rounded-2xl animate-pulse" />)}</div>
      ) : error ? (
        <div className="px-5 mt-5">
          <div className="rounded-2xl px-4 py-4 flex items-center gap-3" style={{ background: "#FEE0E1" }}>
            <Alert02Icon size={20} color="#DC2626" />
            <p className="flex-1 text-[13px] font-semibold text-red-700">Couldn&apos;t load your orders. Check your connection.</p>
            <button onClick={() => load(period)} aria-label="Try again" className="h-12 px-4 rounded-xl bg-white text-[13px] font-bold text-red-600 active:scale-95">Try again</button>
          </div>
        </div>
      ) : noMenu ? (
        <div className="flex flex-col items-center justify-center text-center px-8" style={{ paddingTop: "24vh" }}>
          <Dish01Icon size={56} color="#6B7280" strokeWidth={1.4} />
          <p className="text-[24px] font-black text-spal-navy mt-4">No food to sell</p>
          <p className="text-[15px] text-neutral-500 mt-1">Add your first item to the menu</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center px-8" style={{ paddingTop: "24vh" }}>
          <Dish01Icon size={56} color="#6B7280" strokeWidth={1.4} />
          <p className="text-[24px] font-black text-spal-navy mt-4">No order available</p>
          <p className="text-[15px] text-neutral-500 mt-1">Add and process your first order</p>
        </div>
      ) : (
        <div className="px-5 mt-5 space-y-2.5">
          {orders.map((r) => {
            const label = r.description ?? "Order";
            const tint = iconTint(label);
            const Icon = dishIcon(label);
            const pay = payInfo(r);
            const meta = orderMeta(r);
            const st = STATUS_STYLE[meta.status];
            return (
              <button key={r.id} onClick={() => router.push(`/records/${r.id}`)} aria-label={`Order ${label}`}
                className="w-full text-left bg-white rounded-2xl px-4 py-3.5 min-h-[76px] flex items-center gap-3 active:scale-[0.99] transition-transform" style={{ boxShadow: SHADOW }}>
                <span className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: tint.bg }}>
                  <Icon size={20} color={tint.color} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-bold text-spal-navy truncate">{label}</p>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: pay.bg, color: pay.color }}>{pay.label}</span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                    {meta.table != null && <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">Table {meta.table}</span>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[15px] font-black text-spal-navy">{formatCurrency(r.amount)}</p>
                  <p className="text-[12px] text-neutral-400 mt-0.5">{dayLabel(r.created_at)}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* New Order (or a nudge to the Menu tab when there is nothing to sell yet) */}
      {!loading && !error && !noMenu && (
        <div className="fixed left-1/2 -translate-x-1/2 w-full max-w-[480px] px-5 z-30 flex justify-end pointer-events-none" style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 96px)" }}>
          <button
            onClick={() => router.push("/orders/new")}
            aria-label="Start a new order"
            className="pointer-events-auto h-14 px-6 rounded-2xl flex items-center gap-2.5 text-white font-black text-[17px] active:scale-95 transition-transform"
            style={{ background: "#22C55E", fontFamily: FF, boxShadow: "0 8px 24px rgba(34,197,94,0.35)" }}
          >
            <Hamburger01Icon size={21} color="#fff" /> New Order
          </button>
        </div>
      )}
      {noMenu && (
        <div className="fixed left-1/2 -translate-x-1/2 w-full max-w-[480px] z-50 pointer-events-none" style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 78px)" }} aria-hidden>
          <span className="absolute w-7 h-7 rounded-full animate-ping" style={{ left: "54%", background: "rgba(34,197,94,0.35)" }} />
          <span className="absolute w-7 h-7 rounded-full" style={{ left: "54%", background: "#22C55E", boxShadow: "0 0 0 8px rgba(34,197,94,0.2)" }} />
        </div>
      )}
    </div>
  );
}
