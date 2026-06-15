"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import {
  BarChart3, Trophy, TriangleAlert, TrendingUp, TrendingDown,
  ShoppingBag, Tag, HeartPulse, ArrowRight, Flame, Pencil, X, Check,
} from "lucide-react";
import { SALE_CATEGORIES } from "@/lib/utils/category";

import { formatCurrency } from "@/lib/utils/currency";
import type { BusinessRecord } from "@/lib/types";

type Period      = "today" | "week" | "month" | "year";
type HealthState = "healthy" | "even" | "low" | "empty";

interface Bucket { label: string; profit: number; expenses: number; }

// ─── Date helpers ─────────────────────────────────────────────────────────────
const DAY_SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"] as const;
const MON_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"] as const;

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function todayISODate(): string { return isoDate(new Date()); }

function offsetDate(daysBack: number): Date {
  const d = new Date(); d.setDate(d.getDate() - daysBack); return d;
}

function periodStart(period: Period): string {
  if (period === "today") return todayISODate();
  if (period === "week")  return isoDate(offsetDate(6));   // rolling last 7 days
  const now = new Date();
  if (period === "month") return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  return `${now.getFullYear()}-01-01`;
}

// Human-readable date range shown under the period tabs
function periodRange(period: Period): string {
  const fmt = (d: Date) => `${MON_SHORT[d.getMonth()]} ${d.getDate()}`;
  const today = new Date();
  if (period === "today") return fmt(today);
  if (period === "week")  return `${fmt(offsetDate(6))} – ${fmt(today)}`;
  if (period === "month") {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    return `${fmt(start)} – ${fmt(today)}`;
  }
  return `Jan 1 – ${fmt(today)}`;
}

function emptyBuckets(period: Period): Bucket[] {
  if (period === "today") return [{ label: "Today", profit: 0, expenses: 0 }];
  if (period === "week") {
    // Dynamic labels: actual day names for the last 7 days oldest → newest
    return Array.from({ length: 7 }, (_, i) => ({
      label: DAY_SHORT[offsetDate(6 - i).getDay()],
      profit: 0,
      expenses: 0,
    }));
  }
  if (period === "month") return [1,2,3,4].map(n => ({ label: `W${n}`, profit: 0, expenses: 0 }));
  return MON_SHORT.map(label => ({ label, profit: 0, expenses: 0 }));
}

function aggregate(records: BusinessRecord[], period: Period): Bucket[] {
  const buckets = emptyBuckets(period);
  if (period === "today") {
    const today = todayISODate();
    for (const r of records) {
      if (!r.record_date || r.record_date !== today) continue;
      if (r.type === "sale") buckets[0].profit += r.amount; else buckets[0].expenses += r.amount;
    }
    buckets[0].profit -= buckets[0].expenses; return buckets;
  }
  if (period === "week") {
    // rolling 7-day window: bucket[0]=6 days ago, bucket[6]=today
    const startMs = offsetDate(6).setHours(0, 0, 0, 0);
    for (const r of records) {
      if (!r.record_date) continue;
      const [ry,rm,rd] = r.record_date.split("-").map(Number);
      const diff = Math.floor((new Date(ry, rm - 1, rd).getTime() - startMs) / 86400000);
      if (diff < 0 || diff > 6) continue;
      if (r.type === "sale") buckets[diff].profit += r.amount; else buckets[diff].expenses += r.amount;
    }
    for (const b of buckets) b.profit -= b.expenses; return buckets;
  }
  if (period === "month") {
    const now = new Date(); const month = now.getMonth(); const year = now.getFullYear();
    for (const r of records) {
      if (!r.record_date) continue;
      const [ry,rm,rd] = r.record_date.split("-").map(Number);
      if (rm - 1 !== month || ry !== year) continue;
      const wi = Math.min(3, Math.floor((rd - 1) / 7));
      if (r.type === "sale") buckets[wi].profit += r.amount; else buckets[wi].expenses += r.amount;
    }
    for (const b of buckets) b.profit -= b.expenses; return buckets;
  }
  // year
  const year = new Date().getFullYear();
  for (const r of records) {
    if (!r.record_date) continue;
    const [ry,rm] = r.record_date.split("-").map(Number);
    if (ry !== year) continue;
    if (r.type === "sale") buckets[rm - 1].profit += r.amount; else buckets[rm - 1].expenses += r.amount;
  }
  for (const b of buckets) b.profit -= b.expenses; return buckets;
}
function totals(records: BusinessRecord[]) {
  const sales = records.filter(r => r.type === "sale").reduce((s, r) => s + r.amount, 0);
  const expenses = records.filter(r => r.type === "expense").reduce((s, r) => s + r.amount, 0);
  return { sales, expenses, profit: sales - expenses };
}

// ─── Health math ──────────────────────────────────────────────────────────────
// fill: 0% = deep loss, 50% = break-even, 100% = strong profit (margin ≥ 30%)
function healthFromTotals(sales: number, expenses: number): { fill: number; state: HealthState } {
  const profit = sales - expenses;
  if (sales === 0) return { fill: 0, state: "empty" };
  const margin = profit / sales;
  const fill = Math.min(100, Math.max(0, ((margin + 0.5) / 0.8) * 100));
  const state: HealthState = fill >= 62 ? "healthy" : fill >= 38 ? "even" : "low";
  return { fill, state };
}

const HEALTH_COLOR = { healthy: "#2D7A3A", even: "#FF7A00", low: "#DF191C", empty: "#CBD5E1" } as const;
const HEALTH_LABEL = { healthy: "Healthy", even: "Breaking even", low: "Needs attention", empty: "No data yet" } as const;
const HEALTH_DESC  = {
  healthy: "Your business is profitable. Keep it going.",
  even:    "You're covering costs but profit is thin. Small tweaks can help.",
  low:     "You spent more than you made. Let's fix that.",
  empty:   "Add some sales and expenses to see your health score.",
} as const;

// ─── Liquid gauge ─────────────────────────────────────────────────────────────
function LiquidGauge({ fill, state }: { fill: number; state: HealthState }) {
  const color = HEALTH_COLOR[state];
  const iconColor = state === "empty" ? "#CBD5E1" : color;

  return (
    <div className="relative flex-shrink-0" style={{ width: 88, height: 88 }}>
      {/* Track circle */}
      <div className="absolute inset-0 rounded-full" style={{ border: `3px solid ${color}`, background: "#F8F7F4", overflow: "hidden" }}>
        {/* Liquid fill — animates from bottom */}
        <motion.div
          className="absolute bottom-0 left-0 right-0"
          initial={{ height: "0%" }}
          animate={{ height: `${fill}%` }}
          transition={{ duration: 1.4, ease: [0.34, 1.0, 0.64, 1] }}
          style={{ background: color, opacity: 0.18 }}
        />
        {/* Second wave layer for depth */}
        <motion.div
          className="absolute bottom-0 left-0 right-0"
          initial={{ height: "0%" }}
          animate={{ height: `${fill * 0.85}%` }}
          transition={{ duration: 1.6, ease: [0.34, 1.0, 0.64, 1], delay: 0.1 }}
          style={{ background: color, opacity: 0.12 }}
        />
      </div>
      {/* Icon centered on top */}
      <div className="absolute inset-0 flex items-center justify-center">
        <HeartPulse size={28} strokeWidth={1.8} color={iconColor} />
      </div>
      {/* Pulse ring when healthy */}
      {state === "healthy" && (
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{ scale: [1, 1.12, 1], opacity: [0.4, 0, 0.4] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          style={{ border: `2px solid ${color}` }}
        />
      )}
    </div>
  );
}

// ─── Diagnosis card ───────────────────────────────────────────────────────────
type DiagnosisVariant = "positive" | "warning" | "neutral" | "alert";

interface DiagnosisCardProps {
  icon: React.ReactNode;
  tag: string;
  title: string;
  body: string;
  variant: DiagnosisVariant;
  askPrompt?: string;
}

const VARIANT_STYLE: Record<DiagnosisVariant, { tagBg: string; tagText: string; iconBg: string }> = {
  positive: { tagBg: "#DCFCE7", tagText: "#2D7A3A", iconBg: "#DCFCE7" },
  warning:  { tagBg: "#FFF3E0", tagText: "#FF7A00", iconBg: "#FFF3E0" },
  alert:    { tagBg: "#FEE2E2", tagText: "#DF191C", iconBg: "#FEE2E2" },
  neutral:  { tagBg: "#EFF6FF", tagText: "#2563EB", iconBg: "#EFF6FF" },
};

function DiagnosisCard({ icon, tag, title, body, variant, askPrompt }: DiagnosisCardProps) {
  const router = useRouter();
  const s = VARIANT_STYLE[variant];

  function handleAsk() {
    if (askPrompt) sessionStorage.setItem("spal_ask_prefill", askPrompt);
    router.push("/ask");
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-4"
      style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: s.iconBg }}>
          {icon}
        </div>
        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-[13.5px] font-bold text-spal-navy leading-tight mb-1" style={{ fontFamily: "var(--font-satoshi)" }}>
            {title}
          </p>
          <p className="text-[12.5px] text-neutral-500 leading-relaxed">{body}</p>
          <div className="flex items-center justify-between mt-3">
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: s.tagBg, color: s.tagText }}>
              {tag}
            </span>
            {askPrompt && (
              <button
                onClick={handleAsk}
                className="flex items-center gap-1 text-[12px] font-semibold"
                style={{ color: "#2563EB" }}
              >
                Ask SPAL <ArrowRight size={12} strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Top sellers breakdown ────────────────────────────────────────────────────
function TopSellersCard({ records, periodLabel, onCategoryRenamed }: { records: BusinessRecord[]; periodLabel: string; onCategoryRenamed: () => void }) {
  const router = useRouter();
  const [renamingCat, setRenamingCat] = useState<string | null>(null);
  const [newName,     setNewName]     = useState("");
  const [saving,      setSaving]      = useState(false);

  async function handleRename() {
    if (!renamingCat || !newName.trim()) return;
    setSaving(true);
    try {
      await fetch("/api/records/category", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from: renamingCat, to: newName.trim() }),
      });
      setRenamingCat(null);
      setNewName("");
      onCategoryRenamed();
    } finally {
      setSaving(false);
    }
  }

  const byItem = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const r of records) {
      if (r.type !== "sale" || !r.description) continue;
      const key = r.description.trim().toLowerCase();
      acc[key] = (acc[key] ?? 0) + r.amount;
    }
    return Object.entries(acc)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([name, amount]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), amount }));
  }, [records]);

  const byCategory = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const r of records) {
      if (r.type !== "sale") continue;
      const key = r.category ?? "Uncategorised";
      acc[key] = (acc[key] ?? 0) + r.amount;
    }
    return Object.entries(acc)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([name, amount]) => ({ name, amount }));
  }, [records]);

  const totalSales = records.filter(r => r.type === "sale").reduce((s, r) => s + r.amount, 0);

  if (byItem.length === 0 && byCategory.length === 0) return null;

  const maxItem = byItem[0]?.amount ?? 1;
  const maxCat  = byCategory[0]?.amount ?? 1;

  function handleAsk(prompt: string) {
    sessionStorage.setItem("spal_ask_prefill", prompt);
    router.push("/ask");
  }

  return (
    <div className="bg-white rounded-2xl p-4 space-y-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#DCFCE7" }}>
          <Flame size={14} strokeWidth={2} color="#2D7A3A" />
        </div>
        <p className="text-[13.5px] font-bold text-spal-navy" style={{ fontFamily: "var(--font-satoshi)" }}>
          What sold {periodLabel.toLowerCase()}
        </p>
      </div>

      {/* By item */}
      {byItem.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400 mb-3">By item</p>
          <div className="space-y-2.5">
            {byItem.map((item, i) => (
              <div key={item.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[12.5px] font-medium text-spal-navy truncate">{item.name}</span>
                    {i === 0 && (
                      <span
                        className="flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: "#DCFCE7", color: "#15803D" }}
                      >
                        Best
                      </span>
                    )}
                  </span>
                  <span className="text-[12px] font-semibold text-spal-navy flex-shrink-0 ml-2">{formatCurrency(item.amount)}</span>
                </div>
                <div className="h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: `${(item.amount / maxItem) * 100}%` }}
                    transition={{ duration: 0.8, delay: i * 0.08, ease: "easeOut" }}
                    style={{ background: i === 0 ? "#22C55E" : "#86EFAC" }}
                  />
                </div>
              </div>
            ))}
          </div>
          {byItem.length > 0 && (
            <button
              onClick={() => handleAsk(`My best-selling item ${periodLabel.toLowerCase()} is ${byItem[0].name} at ${formatCurrency(byItem[0].amount)}. How can I sell more of it?`)}
              className="flex items-center gap-1 text-[12px] font-semibold mt-3"
              style={{ color: "#2563EB" }}
            >
              Ask SPAL how to grow this <ArrowRight size={12} strokeWidth={2.5} />
            </button>
          )}
        </div>
      )}

      {/* Divider */}
      {byItem.length > 0 && byCategory.length > 0 && (
        <div className="h-px bg-neutral-100" />
      )}

      {/* By category */}
      {byCategory.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">By category</p>
            <p className="text-[10px] text-neutral-400" style={{ fontFamily: "var(--font-satoshi)" }}>Tap name to rename</p>
          </div>
          <div className="space-y-2.5">
            {byCategory.map((cat, i) => (
              <div key={cat.name}>
                <div className="flex items-center justify-between mb-1">
                  <button
                    onClick={() => { setRenamingCat(cat.name); setNewName(cat.name); }}
                    className="flex items-center gap-1.5 active:opacity-70 transition-opacity"
                  >
                    <Tag size={11} strokeWidth={2} className="text-neutral-300 flex-shrink-0" />
                    <span className="text-[12.5px] font-medium text-spal-navy underline decoration-dotted underline-offset-2 decoration-neutral-300">
                      {cat.name}
                    </span>
                    <Pencil size={10} strokeWidth={2} className="text-neutral-300" />
                  </button>
                  <span className="text-[12px] font-medium text-neutral-500">
                    {totalSales > 0 ? `${Math.round((cat.amount / totalSales) * 100)}%` : "—"}
                    <span className="ml-1.5 text-spal-navy font-semibold">{formatCurrency(cat.amount)}</span>
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: `${(cat.amount / maxCat) * 100}%` }}
                    transition={{ duration: 0.8, delay: i * 0.08, ease: "easeOut" }}
                    style={{ background: i === 0 ? "#2563EB" : "#93C5FD" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rename category sheet */}
      <AnimatePresence>
        {renamingCat && (
          <>
            <motion.div
              className="fixed inset-0 z-30 bg-black/40"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setRenamingCat(null); setNewName(""); }}
            />
            <motion.div
              className="fixed left-0 right-0 z-40 bg-white rounded-t-3xl p-5"
              style={{ bottom: "calc(4rem + env(safe-area-inset-bottom, 0px))" }}
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "tween", duration: 0.28, ease: "easeOut" }}
            >
              <div className="flex items-center justify-between mb-4">
                <p className="text-[15px] font-bold text-spal-navy" style={{ fontFamily: "var(--font-satoshi)" }}>
                  Rename category
                </p>
                <button onClick={() => { setRenamingCat(null); setNewName(""); }} className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center">
                  <X size={14} strokeWidth={2.5} className="text-neutral-500" />
                </button>
              </div>
              <p className="text-[12px] text-neutral-400 mb-3" style={{ fontFamily: "var(--font-satoshi)" }}>
                Renaming <span className="font-semibold text-spal-navy">{renamingCat}</span> will update all records with this category.
                If you rename it to an existing category they will merge.
              </p>

              {/* Quick-pick canonical names */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {SALE_CATEGORIES.map(c => (
                  <button
                    key={c}
                    onClick={() => setNewName(c)}
                    className="text-[11px] font-semibold px-3 py-1.5 rounded-full border transition-colors"
                    style={{
                      background: newName === c ? "#22C55E" : "#F8FAFC",
                      color: newName === c ? "#fff" : "#374151",
                      borderColor: newName === c ? "#22C55E" : "#E5E7EB",
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>

              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Or type a custom name…"
                className="w-full h-11 rounded-xl border border-neutral-200 px-4 text-[14px] text-spal-navy outline-none focus:border-spal-green mb-4"
                style={{ fontFamily: "var(--font-satoshi)" }}
              />

              <button
                onClick={handleRename}
                disabled={saving || !newName.trim() || newName.trim() === renamingCat}
                className="w-full h-12 rounded-2xl font-bold text-[14px] text-white flex items-center justify-center gap-2 disabled:opacity-40 transition-opacity"
                style={{ background: "#22C55E", fontFamily: "var(--font-satoshi)" }}
              >
                {saving ? "Saving…" : <><Check size={16} strokeWidth={2.5} /> Save</>}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function InsightsPage() {
  const [period,  setPeriod]  = useState<Period>("week");
  const [records, setRecords] = useState<BusinessRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const startDate = periodStart(period);
      const res  = await fetch(`/api/records?start_date=${startDate}&limit=2000`);
      const data = await res.json();
      if (data.success) setRecords(data.data);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const chartData  = useMemo(() => aggregate(records, period), [records, period]);
  const t          = useMemo(() => totals(records), [records]);
  const health     = useMemo(() => healthFromTotals(t.sales, t.expenses), [t.sales, t.expenses]);

  const bestBucket = useMemo(() =>
    chartData.reduce((best, b) =>
      (b.profit + b.expenses) > (best.profit + best.expenses) ? b : best,
      chartData[0] ?? { label: "", profit: 0, expenses: 0 }),
  [chartData]);

  const topExpenseCat = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const r of records) {
      if (r.type !== "expense" || !r.category) continue;
      acc[r.category] = (acc[r.category] ?? 0) + r.amount;
    }
    return Object.entries(acc).sort((a, b) => b[1] - a[1])[0];
  }, [records]);

  const expenseRatio = t.sales > 0 ? Math.round((t.expenses / t.sales) * 100) : null;

  const periodLabel = period === "today" ? "Today"
    : period === "week"  ? "Last 7 days"
    : period === "month" ? "This month"
    : "This year";

  const dateRange = useMemo(() => periodRange(period), [period]);

  const bucketWord = period === "year" ? "month" : period === "month" ? "week" : "day";

  // Build diagnosis cards from available data
  const diagnosisCards: DiagnosisCardProps[] = useMemo(() => {
    const cards: DiagnosisCardProps[] = [];

    if (records.length === 0) return cards;

    // Profit health
    if (t.profit > 0) {
      cards.push({
        icon: <TrendingUp size={16} strokeWidth={2} color="#2D7A3A" />,
        tag: "Profit",
        title: `You made ${formatCurrency(t.profit)} profit`,
        body: `${periodLabel}, your sales covered your costs and left you with ${formatCurrency(t.profit)}. That's a win.`,
        variant: "positive",
        askPrompt: `I made ${formatCurrency(t.profit)} profit ${periodLabel.toLowerCase()}. What can I do to increase this further?`,
      });
    } else if (t.profit < 0) {
      cards.push({
        icon: <TrendingDown size={16} strokeWidth={2} color="#DF191C" />,
        tag: "Profit",
        title: `You spent ${formatCurrency(Math.abs(t.profit))} more than you made`,
        body: `${periodLabel} expenses were higher than your sales. Let's find where the money is going.`,
        variant: "alert",
        askPrompt: `I spent more than I made ${periodLabel.toLowerCase()}. My sales were ${formatCurrency(t.sales)} and expenses ${formatCurrency(t.expenses)}. What should I do?`,
      });
    }

    // Best bucket
    if (bestBucket && (bestBucket.profit + bestBucket.expenses) > 0) {
      cards.push({
        icon: <Trophy size={16} strokeWidth={2} color="#2D7A3A" />,
        tag: "Sales",
        title: `${bestBucket.label} was your best ${bucketWord}`,
        body: `You made the most on ${bestBucket.label}${bestBucket.profit > 0 ? ` with ${formatCurrency(bestBucket.profit)} in profit` : ""}.`,
        variant: "positive",
        askPrompt: `${bestBucket.label} was my best ${bucketWord} ${periodLabel.toLowerCase()}. Why might that be and how can I make every ${bucketWord} like that?`,
      });
    }

    // Expense ratio
    if (expenseRatio !== null && t.expenses > 0) {
      const isHigh = expenseRatio > 70;
      cards.push({
        icon: <TriangleAlert size={16} strokeWidth={2} color={isHigh ? "#DF191C" : "#FF7A00"} />,
        tag: "Spending",
        title: `${expenseRatio}% of sales went to expenses`,
        body: isHigh
          ? `For every ₦100 you made, ₦${expenseRatio} went to costs. That's a tight margin — worth reviewing.`
          : `Your expenses are ${expenseRatio}% of sales. ${expenseRatio < 50 ? "You're managing costs well." : "There's room to tighten."}`,
        variant: isHigh ? "alert" : "warning",
        askPrompt: `${expenseRatio}% of my sales went to expenses ${periodLabel.toLowerCase()}. Is this normal for my type of business and how can I reduce it?`,
      });
    }

    // Top expense category
    if (topExpenseCat) {
      cards.push({
        icon: <ShoppingBag size={16} strokeWidth={2} color="#FF7A00" />,
        tag: "Spending",
        title: `${topExpenseCat[0]} is your biggest cost`,
        body: `You spent ${formatCurrency(topExpenseCat[1])} on ${topExpenseCat[0]} ${periodLabel.toLowerCase()}. This is your single largest expense.`,
        variant: "warning",
        askPrompt: `I spent ${formatCurrency(topExpenseCat[1])} on ${topExpenseCat[0]} ${periodLabel.toLowerCase()}. Is there a way to reduce this cost without hurting my business?`,
      });
    }

    return cards;
  }, [records, t, bestBucket, expenseRatio, topExpenseCat, periodLabel, bucketWord]);

  return (
    <div className="px-5 pt-6 pb-6 space-y-4" style={{ background: "#F8F7F4", minHeight: "100%" }}>

      {/* Header */}
      <h1 className="text-[22px] font-bold text-spal-navy" style={{ fontFamily: "var(--font-satoshi)" }}>
        Insights
      </h1>

      {/* Period tabs */}
      <div>
        <div className="flex bg-neutral-100 rounded-full p-1 gap-1">
          {(["today", "week", "month", "year"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className="flex-1 h-9 rounded-full text-[12.5px] font-semibold transition-all duration-200"
              style={{
                fontFamily: "var(--font-satoshi)",
                background: period === p ? "#fff" : "transparent",
                color:      period === p ? "#0F172A" : "#67738F",
                boxShadow:  period === p ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
              }}
            >
              {p === "today" ? "Today" : p === "week" ? "7 Days" : p === "month" ? "Month" : "Year"}
            </button>
          ))}
        </div>
        {/* Date range label */}
        <p className="text-center text-[11px] text-neutral-400 mt-1.5" style={{ fontFamily: "var(--font-satoshi)" }}>
          {dateRange}
        </p>
      </div>

      {/* Dark summary card */}
      <AnimatePresence mode="wait">
        <motion.div key={period} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div className="rounded-[18px] p-5" style={{ background: "#0F172A" }}>
            <p className="text-[11.5px] font-medium uppercase tracking-widest mb-2" style={{ fontFamily: "var(--font-satoshi)", color: "#A1A3AE" }}>
              {periodLabel} · Profit
            </p>
            {loading ? (
              <div className="h-9 w-40 bg-white/10 rounded-lg animate-pulse" />
            ) : (
              <p className="font-bold leading-none" style={{
                fontFamily: "var(--font-satoshi)",
                fontSize: "clamp(28px, 8.5vw, 36px)",
                letterSpacing: "-0.02em",
                color: t.profit >= 0 ? "#fff" : "#FCB35B",
              }}>
                {t.profit < 0 ? "–" : ""}{formatCurrency(Math.abs(t.profit))}
              </p>
            )}
            <div className="mt-5 flex items-stretch">
              <div className="flex-1">
                <p className="text-[11px] mb-1.5" style={{ fontFamily: "var(--font-satoshi)", color: "#67738F" }}>Sales</p>
                <p className="text-[15px] font-bold" style={{ fontFamily: "var(--font-satoshi)", color: "#22C55E" }}>{formatCurrency(t.sales)}</p>
              </div>
              <div className="w-px mx-4" style={{ background: "#384666" }} />
              <div className="flex-1">
                <p className="text-[11px] mb-1.5" style={{ fontFamily: "var(--font-satoshi)", color: "#67738F" }}>Expenses</p>
                <p className="text-[15px] font-bold" style={{ fontFamily: "var(--font-satoshi)", color: "#ED712E" }}>{formatCurrency(t.expenses)}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Bar chart card */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        <div className="bg-white rounded-[18px] p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-[13px] font-bold text-spal-navy" style={{ fontFamily: "var(--font-satoshi)" }}>
              {period === "today" ? "Today's breakdown" : period === "week" ? "Daily breakdown" : period === "month" ? "Weekly breakdown" : "Monthly breakdown"}
            </p>
            <div className="flex items-center gap-3">
              <Legend color="#22C55E" label="Profit" />
              <Legend color="#ED712E" label="Expense" />
            </div>
          </div>
          {loading ? (
            <div className="h-[200px] bg-neutral-50 rounded-xl animate-pulse" />
          ) : chartData.every(b => b.profit === 0 && b.expenses === 0) ? (
            <EmptyChart period={period} />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 8, right: 4, bottom: 0, left: -24 }} barGap={4} barCategoryGap="22%">
                <CartesianGrid stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#A1A3AE", fontFamily: "var(--font-satoshi)" }} axisLine={false} tickLine={false} interval={0} />
                <YAxis tick={{ fontSize: 10, fill: "#A1A3AE", fontFamily: "var(--font-satoshi)" }} axisLine={false} tickLine={false} tickFormatter={(v) => v === 0 ? "0" : `${Math.round(v / 1000)}k`} width={48} />
                <Tooltip
                  cursor={{ fill: "rgba(15,23,42,0.04)" }}
                  formatter={(v, name) => [formatCurrency(Math.abs(Number(v ?? 0))), name === "profit" ? "Profit" : "Expenses"]}
                  contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 8px 24px rgba(0,0,0,0.12)", fontSize: 12, fontFamily: "var(--font-satoshi)" }}
                  labelStyle={{ fontWeight: 700, color: "#0F172A" }}
                />
                <Bar dataKey="profit"   fill="#22C55E" radius={[6, 6, 0, 0]} maxBarSize={28} />
                <Bar dataKey="expenses" fill="#ED712E" radius={[6, 6, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </motion.div>

      {/* ── NEW: Business health ──────────────────────────────────────────────── */}
      {!loading && records.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
          <div className="bg-white rounded-2xl p-4" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
            <div className="flex items-center gap-4">
              <LiquidGauge fill={health.fill} state={health.state} />
              <div className="flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-wide mb-1"
                  style={{ color: HEALTH_COLOR[health.state], fontFamily: "var(--font-satoshi)" }}>
                  Business health · {periodLabel}
                </p>
                <p className="text-[15px] font-bold text-spal-navy leading-tight" style={{ fontFamily: "var(--font-satoshi)" }}>
                  {HEALTH_LABEL[health.state]}
                </p>
                <p className="text-[12px] text-neutral-400 mt-1 leading-relaxed">
                  {HEALTH_DESC[health.state]}
                </p>
              </div>
            </div>

            {/* Ask SPAL CTA */}
            {health.state !== "empty" && (
              <button
                onClick={() => {
                  const prompt = health.state === "healthy"
                    ? `My business is profitable ${periodLabel.toLowerCase()} with ${formatCurrency(t.profit)} profit. What should I focus on to keep growing?`
                    : health.state === "even"
                    ? `I'm just breaking even ${periodLabel.toLowerCase()} — sales ${formatCurrency(t.sales)}, expenses ${formatCurrency(t.expenses)}. What's the fastest way to improve my profit margin?`
                    : `I spent more than I made ${periodLabel.toLowerCase()} — sales ${formatCurrency(t.sales)}, expenses ${formatCurrency(t.expenses)}. What should I do?`;
                  sessionStorage.setItem("spal_ask_prefill", prompt);
                  window.location.href = "/ask";
                }}
                className="mt-4 w-full h-11 rounded-xl flex items-center justify-center gap-2 text-[13px] font-semibold transition-opacity active:opacity-70"
                style={{
                  background: health.state === "healthy" ? "#DCFCE7" : health.state === "even" ? "#FFF3E0" : "#FEE2E2",
                  color: HEALTH_COLOR[health.state],
                }}
              >
                <HeartPulse size={15} strokeWidth={2} />
                Get a deeper diagnosis from SPAL
                <ArrowRight size={13} strokeWidth={2.5} />
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* ── NEW: Top sellers ─────────────────────────────────────────────────── */}
      {!loading && records.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
          <TopSellersCard records={records} periodLabel={periodLabel} onCategoryRenamed={fetchData} />
        </motion.div>
      )}

      {/* ── NEW: Diagnosis cards ─────────────────────────────────────────────── */}
      {!loading && diagnosisCards.length > 0 && (
        <div className="space-y-3">
          {diagnosisCards.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 + i * 0.06 }}
            >
              <DiagnosisCard {...card} />
            </motion.div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && records.length === 0 && (
        <div className="text-center py-10">
          <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto">
            <BarChart3 size={26} strokeWidth={2} className="text-neutral-300" />
          </div>
          <p className="text-spal-navy font-semibold mt-3" style={{ fontFamily: "var(--font-satoshi)" }}>
            No records for {dateRange}
          </p>
          <p className="text-neutral-400 text-[13px] mt-1 leading-relaxed px-6">
            {period === "week"
              ? "Records you imported with older dates won't appear here. Try switching to Month or Year to see them."
              : "Add some sales and expenses to see your insights."}
          </p>
          {period === "week" && (
            <button
              onClick={() => setPeriod("month")}
              className="mt-4 h-9 px-5 rounded-full text-[12.5px] font-semibold"
              style={{ fontFamily: "var(--font-satoshi)", background: "#EFF6FF", color: "#2563EB" }}
            >
              View this month instead
            </button>
          )}
        </div>
      )}

      <div className="h-2" />
    </div>
  );
}

// ─── Tiny sub-components ──────────────────────────────────────────────────────
function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
      <span className="text-[11px] font-medium" style={{ fontFamily: "var(--font-satoshi)", color: "#67738F" }}>{label}</span>
    </div>
  );
}
function EmptyChart({ period }: { period: Period }) {
  const label = period === "today" ? "today" : period === "week" ? "in the last 7 days" : period === "month" ? "this month" : "this year";
  return (
    <div className="h-[200px] flex flex-col items-center justify-center text-center">
      <BarChart3 size={32} strokeWidth={1.8} className="text-neutral-300 mb-2" />
      <p className="text-[13px] text-neutral-500" style={{ fontFamily: "var(--font-satoshi)" }}>
        No activity {label} yet.
      </p>
      <p className="text-[11.5px] text-neutral-400 mt-1">Add a sale or expense to see your chart.</p>
    </div>
  );
}
