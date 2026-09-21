"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Search01Icon, Notification03Icon, ShoppingBasket03Icon, ReceiptDollarIcon,
  PackageIcon, MoneyBag01Icon, ArrowRight01Icon, Invoice01Icon, CheckListIcon,
  Restaurant01Icon, Restaurant02Icon, Restaurant03Icon, Alert02Icon,
} from "hugeicons-react";
import { useSPALStore } from "@/store";
import { useBusinessMode } from "@/hooks/useBusinessMode";
import { formatCurrency } from "@/lib/utils/currency";
import { getGreeting } from "@/lib/utils/dates";
import { payInfo, iconTint } from "@/lib/sales";
import type { BusinessRecord, InventoryItem } from "@/lib/types";
import { InsightsCarousel, type InsightItem } from "./InsightsCarousel";

const FF = "var(--font-satoshi)";
const BG = "#EDF3E8";
const CARD_SHADOW = "0 1px 6px rgba(0,0,0,0.05)";

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

function hourLabel(h: number) {
  return `${h % 12 === 0 ? 12 : h % 12}${h >= 12 ? "pm" : "am"}`;
}

const DISH_ICONS = [Restaurant01Icon, Restaurant02Icon, Restaurant03Icon];
function dishIcon(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return DISH_ICONS[h % DISH_ICONS.length];
}

// Perishable / prepared-goods dashboard: restaurants (food_seller) and bars
// (bar_owner). Sells from the menu; ingredients/stock live under Inventory.
// The retail dashboard lives in RetailHome.tsx (see PERISHABLE_DASHBOARD.md).
export function PerishableHome() {
  const router = useRouter();
  const { user, activeBusiness, recordSavedAt } = useSPALStore();
  const name = activeBusiness?.business_name ?? user?.business_name ?? user?.full_name ?? "there";
  const isBar = useBusinessMode().type === "bar_owner";
  const greeting = getGreeting();

  const [period, setPeriod]   = useState<Period>("today");
  const [records, setRecords] = useState<BusinessRecord[]>([]);
  const [items, setItems]     = useState<InventoryItem[]>([]);
  const [unread, setUnread]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);

  const fetchData = useCallback(async (p: Period) => {
    setLoading(true);
    setError(false);
    try {
      const [recRes, invRes] = await Promise.all([
        fetch(`/api/records?start_date=${periodStart(p)}&limit=2000`),
        fetch(`/api/inventory`),
      ]);
      const recData = await recRes.json();
      const invData = await invRes.json();
      if (recData.success) setRecords(recData.data ?? []); else setError(true);
      if (invData.success) setItems(invData.data?.items ?? []);
    } catch { setError(true); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(period); }, [period, fetchData]);
  useEffect(() => { if (recordSavedAt) fetchData(period); }, [recordSavedAt]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetch("/api/notifications").then((r) => r.json())
      .then((d) => { if (d.success) setUnread((d.data as { read_at: string | null }[]).filter((n) => !n.read_at).length); })
      .catch(() => {});
  }, []);

  const sales = useMemo(() => records.filter((r) => r.type === "sale"), [records]);
  const totalSales    = sales.reduce((s, r) => s + r.amount, 0);
  const totalExpenses = records.filter((r) => r.type === "expense").reduce((s, r) => s + r.amount, 0);
  const owedSales     = sales.filter((r) => r.payment_status === "owing");
  const outstanding   = owedSales.reduce((s, r) => s + r.amount, 0);
  const soldOut       = items.filter((it) => it.quantity <= 0);
  const lowItems      = items.filter((it) => it.quantity > 0 && it.quantity <= it.low_stock_threshold);
  const recentOrders  = useMemo(
    () => [...sales].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 4),
    [sales]
  );

  const busiest = useMemo(() => {
    if (sales.length < 3) return null;
    const byHour = new Array(24).fill(0) as number[];
    sales.forEach((r) => { byHour[new Date(r.created_at).getHours()] += 1; });
    const h = byHour.indexOf(Math.max(...byHour));
    return { hour: h, orders: byHour[h] };
  }, [sales]);

  const insights = useMemo<InsightItem[]>(() => {
    const out: InsightItem[] = [];
    if (soldOut.length > 0) {
      out.push({ id: "soldout", tone: "warning", title: `${soldOut.length} item${soldOut.length !== 1 ? "s are" : " is"} finished`, body: "You can't sell these until you restock. Top up so you don't lose orders.", ctaLabel: "Restock Now", ctaHref: "/inventory" });
    } else if (lowItems.length > 0) {
      out.push({ id: "low", tone: "warning", title: `${lowItems.length} item${lowItems.length !== 1 ? "s are" : " is"} almost finished`, body: "Restock soon so you never turn a customer away.", ctaLabel: "Restock Now", ctaHref: "/inventory" });
    }
    if (outstanding > 0) {
      out.push({ id: "debt", tone: "warning", title: `${formatCurrency(outstanding)} is owed to you`, body: `${owedSales.length} order${owedSales.length !== 1 ? "s" : ""} not yet paid. Follow up to get your money in.`, ctaLabel: "View Debts", ctaHref: "/records" });
    }
    if (busiest) {
      out.push({ id: "peak", tone: "info", title: `Your busiest time is around ${hourLabel(busiest.hour)}`, body: `${busiest.orders} orders came in around then. Have your best sellers ready before it starts.`, ctaLabel: "Ask SPAL", ctaHref: "/ask" });
    }
    if (period === "today" && totalSales === 0) {
      out.push({ id: "nosale", tone: "info", title: "No orders yet today", body: "Take your first order to start tracking your day.", ctaLabel: "Take an Order", ctaHref: "/orders/new" });
    } else if (totalSales > 0) {
      out.push({ id: "made", tone: "success", title: `You've made ${formatCurrency(totalSales)} in sales`, body: "Keep it up. Check your insights to see what's driving it.", ctaLabel: "See Insights", ctaHref: "/insights" });
    }
    out.push({
      id: "tip", tone: "info",
      title: isBar ? "Stock up on the drinks that sell fast" : "Cook more of what sells",
      body: isBar ? "Keep more of your top drinks and less of the slow ones so your money doesn't sit on the shelf." : "Prepare more of your best sellers and less of the slow ones. Less food thrown away means more profit.",
      ctaLabel: "Ask SPAL", ctaHref: "/ask",
    });
    return out;
  }, [soldOut.length, lowItems.length, outstanding, owedSales.length, busiest, period, totalSales, isBar]);

  const STATS = [
    { label: "Total Sales",      value: formatCurrency(totalSales),    Icon: ShoppingBasket03Icon, tint: "#EAF7EE", color: "#16A34A" },
    { label: "Total Expenses",   value: formatCurrency(totalExpenses), Icon: ReceiptDollarIcon,    tint: "#FFF3EC", color: "#F97316" },
    { label: "Total Orders",     value: String(sales.length),          Icon: PackageIcon,          tint: "#F3EEFF", color: "#8B5CF6" },
    { label: "Outstanding Debt", value: formatCurrency(outstanding),   Icon: MoneyBag01Icon,       tint: "#EAF0FC", color: "#2563EB" },
  ];

  const QUICK = [
    { label: "POS",      Icon: Invoice01Icon, tint: "#FFF3EC", color: "#F97316", href: "/orders/new" },
    { label: "Add Item", Icon: CheckListIcon, tint: "#EAF7EE", color: "#16A34A", href: "/menu/add" },
    { label: "Restock",  Icon: PackageIcon,   tint: "#F3EEFF", color: "#8B5CF6", href: "/inventory" },
  ];

  return (
    <div className="min-h-full pb-28" style={{ background: BG, fontFamily: FF }}>
      {/* Header */}
      <div className="px-5 pt-12 flex items-center justify-between">
        <button onClick={() => router.push("/profile")} aria-label="Open profile" className="flex items-center gap-3 active:opacity-80 min-h-12">
          <span className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg,#2563EB,#8B5CF6)" }}>
            {user?.avatar_url
              ? <Image src={user.avatar_url} alt="" width={48} height={48} className="w-full h-full object-cover" />
              : <span className="text-white font-bold text-[18px]">{name.charAt(0).toUpperCase()}</span>}
          </span>
          <span className="text-left">
            <span className="block text-[13px] text-neutral-500">{greeting}</span>
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
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                aria-label={p.label}
                className="flex-1 h-12 rounded-full text-[12.5px] sm:text-[13px] font-bold transition-all whitespace-nowrap"
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
        <div className="px-5 mt-4">
          <div className="rounded-2xl px-4 py-3 flex items-center gap-3" style={{ background: "#FEE0E1" }}>
            <Alert02Icon size={20} color="#DC2626" />
            <p className="flex-1 text-[13px] font-semibold text-red-700">Couldn&apos;t load your numbers. Check your connection.</p>
            <button onClick={() => fetchData(period)} aria-label="Try again" className="h-12 px-4 rounded-xl bg-white text-[13px] font-bold text-red-600 active:scale-95">Try again</button>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="px-5 mt-4 grid grid-cols-2 gap-3">
        {STATS.map((s) => (
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
          {QUICK.map((q) => (
            <button key={q.label} onClick={() => router.push(q.href)} aria-label={q.label} className="bg-white rounded-2xl py-4 min-h-[88px] flex flex-col items-center gap-2 active:scale-95 transition-transform" style={{ boxShadow: CARD_SHADOW }}>
              <span className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: q.tint }}>
                <q.Icon size={19} color={q.color} />
              </span>
              <span className="text-[12px] font-semibold text-neutral-600">{q.label}</span>
            </button>
          ))}
          <button onClick={() => (window.location.href = "/ask")} aria-label="Ask SPAL" className="bg-white rounded-2xl py-4 min-h-[88px] flex flex-col items-center gap-2 active:scale-95 transition-transform" style={{ boxShadow: CARD_SHADOW }}>
            <Image src="/spal-ai.webp" alt="" width={40} height={40} className="w-10 h-10 object-contain" />
            <span className="text-[12px] font-semibold text-neutral-600">Ask SPAL</span>
          </button>
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
          {sales.length > 4 && (
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
            {recentOrders.map((r) => {
              const label = r.description ?? "Order";
              const tint = iconTint(label);
              const Icon = dishIcon(label);
              const pay = payInfo(r);
              return (
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
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
