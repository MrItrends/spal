"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSPALStore } from "../store";
import { useBusinessMode } from "./useBusinessMode";
import { formatCurrency } from "../lib/utils/currency";
import { getGreeting } from "../lib/utils/dates";
import { payInfo, iconTint, type PayInfo } from "../lib/sales";
import type { BusinessRecord, InventoryItem } from "../lib/types";
import type { InsightItem } from "../lib/insights";
import type { Period, StatCard, QuickAction } from "./useRetailDashboard";
import { PERIODS } from "./useRetailDashboard";

export { PERIODS };
export type { Period, StatCard, QuickAction };

function periodStart(p: Period): string {
  const d = new Date();
  if (p === "today") return d.toISOString().slice(0, 10);
  if (p === "week")  { d.setDate(d.getDate() - 6); return d.toISOString().slice(0, 10); }
  if (p === "month") return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  return `${d.getFullYear()}-01-01`;
}

export function hourLabel(h: number) {
  return `${h % 12 === 0 ? 12 : h % 12}${h >= 12 ? "pm" : "am"}`;
}

/** "Today" / "Yesterday" / short date for a recent-order row. Shared by every view. */
export function dayLabel(iso: string) {
  const d = new Date(iso);
  const start = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((start(new Date()) - start(d)) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  return d.toLocaleDateString("en", { month: "short", day: "numeric" });
}

const DISH_KEYS = ["dish-a", "dish-b", "dish-c"] as const;
function dishIconKey(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return DISH_KEYS[h % DISH_KEYS.length];
}

export interface OrderRow {
  record: BusinessRecord;
  label: string;
  tint: { bg: string; color: string };
  iconKey: (typeof DISH_KEYS)[number];
  pay: PayInfo;
}

/**
 * Shared data + computation for the perishable (restaurant/bar) dashboard.
 * Both the mobile and desktop views render from this. UI-library-agnostic
 * (no JSX, no icon imports) — views map `iconKey` to their own icon component.
 */
export function usePerishableDashboard() {
  const { user, activeBusiness, recordSavedAt } = useSPALStore();
  const businessName = activeBusiness?.business_name ?? user?.business_name ?? user?.full_name ?? "there";
  const isBar = useBusinessMode().type === "bar_owner";
  const greeting = getGreeting();

  const [period, setPeriod]   = useState<Period>("today");
  const [records, setRecords] = useState<BusinessRecord[]>([]);
  const [items, setItems]     = useState<InventoryItem[]>([]);
  const [menuCount, setMenuCount] = useState(0);
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
    fetch("/api/menu").then((r) => r.json())
      .then((d) => { if (d.success) setMenuCount(d.data?.items?.length ?? 0); })
      .catch(() => {});
  }, [recordSavedAt]); // eslint-disable-line react-hooks/exhaustive-deps

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
  const recentOrderRows: OrderRow[] = useMemo(() => recentOrders.map((r) => {
    const label = r.description ?? "Order";
    return { record: r, label, tint: iconTint(label), iconKey: dishIconKey(label), pay: payInfo(r) };
  }), [recentOrders]);

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

  const stats: StatCard[] = [
    { label: "Total Sales",      value: formatCurrency(totalSales),    iconKey: "sales",     tint: "#EAF7EE", color: "#16A34A" },
    { label: "Total Expenses",   value: formatCurrency(totalExpenses), iconKey: "expenses",  tint: "#FFF3EC", color: "#F97316" },
    { label: "Total Orders",     value: String(sales.length),          iconKey: "inventory", tint: "#F3EEFF", color: "#8B5CF6" },
    { label: "Outstanding Debt", value: formatCurrency(outstanding),   iconKey: "debt",      tint: "#EAF0FC", color: "#2563EB" },
  ];

  const quickActions: QuickAction[] = [
    { label: "POS",      iconKey: "pos",      tint: "#FFF3EC", color: "#F97316", href: "/orders/new" },
    { label: "Add Item", iconKey: "add-item", tint: "#EAF7EE", color: "#16A34A", href: "/menu/add" },
    { label: "Restock",  iconKey: "restock",  tint: "#F3EEFF", color: "#8B5CF6", href: "/inventory" },
  ];

  return {
    loading, error, refetch: () => fetchData(period),
    period, setPeriod,
    stats, insights, recentOrders: recentOrderRows, quickActions,
    hasItem: menuCount > 0, hasSale: sales.length > 0,
    businessName, greeting, isBar,
    user, activeBusiness,
    menuCount, salesCount: sales.length,
  };
}
