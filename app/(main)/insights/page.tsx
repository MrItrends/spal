"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { ArrowUp, ArrowDown, BarChart3, Trophy, TriangleAlert, MessageCircle } from "lucide-react";

import { formatCurrency } from "@/lib/utils/currency";
import { InsightCard } from "@/components/ui/InsightCard";
import type { BusinessRecord } from "@/lib/types";

type Period = "today" | "week" | "month" | "year";

interface Bucket {
  label:     string;  // x-axis label
  profit:    number;
  expenses:  number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Date helpers
// ─────────────────────────────────────────────────────────────────────────────

function todayISODate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function periodStart(period: Period): string {
  const now = new Date();
  if (period === "today") {
    return todayISODate();
  }
  if (period === "week") {
    // Monday as week start
    const day = now.getDay();
    const offset = day === 0 ? -6 : 1 - day;
    const start = new Date(now);
    start.setDate(now.getDate() + offset);
    return `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`;
  }
  if (period === "month") {
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  }
  // year
  return `${now.getFullYear()}-01-01`;
}

// Build the labeled time buckets for a period
function emptyBuckets(period: Period): Bucket[] {
  if (period === "today") {
    return [{ label: "Today", profit: 0, expenses: 0 }];
  }
  if (period === "week") {
    return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(label => ({ label, profit: 0, expenses: 0 }));
  }
  if (period === "month") {
    return [1, 2, 3, 4].map(n => ({ label: `W${n}`, profit: 0, expenses: 0 }));
  }
  // year
  return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    .map(label => ({ label, profit: 0, expenses: 0 }));
}

// Aggregate records into buckets for a given period
function aggregate(records: BusinessRecord[], period: Period): Bucket[] {
  const buckets = emptyBuckets(period);

  if (period === "today") {
    const today = todayISODate();
    for (const r of records) {
      if (r.record_date !== today) continue;
      if (r.type === "sale") buckets[0].profit   += r.amount;
      else                   buckets[0].expenses += r.amount;
    }
    buckets[0].profit -= buckets[0].expenses; // profit = sales - expenses
    return buckets;
  }

  if (period === "week") {
    const start = periodStart("week");
    const [y, m, d] = start.split("-").map(Number);
    const startDate = new Date(y, m - 1, d);
    for (const r of records) {
      const [ry, rm, rd] = r.record_date.split("-").map(Number);
      const rec = new Date(ry, rm - 1, rd);
      const diffDays = Math.floor((rec.getTime() - startDate.getTime()) / 86400000);
      if (diffDays < 0 || diffDays > 6) continue;
      if (r.type === "sale") buckets[diffDays].profit   += r.amount;
      else                   buckets[diffDays].expenses += r.amount;
    }
    for (const b of buckets) b.profit -= b.expenses;
    return buckets;
  }

  if (period === "month") {
    const now = new Date();
    const month = now.getMonth();
    const year  = now.getFullYear();
    // For each week of the current month
    const weekCounts = [0, 0, 0, 0];
    for (const r of records) {
      const [ry, rm, rd] = r.record_date.split("-").map(Number);
      if (rm - 1 !== month || ry !== year) continue;
      // Week index: 1-7 → W1, 8-14 → W2, 15-21 → W3, 22+ → W4
      const wi = Math.min(3, Math.floor((rd - 1) / 7));
      if (r.type === "sale") buckets[wi].profit   += r.amount;
      else                   buckets[wi].expenses += r.amount;
      weekCounts[wi]++;
    }
    for (const b of buckets) b.profit -= b.expenses;
    return buckets;
  }

  // year — group by month
  const year = new Date().getFullYear();
  for (const r of records) {
    const [ry, rm] = r.record_date.split("-").map(Number);
    if (ry !== year) continue;
    const idx = rm - 1;
    if (r.type === "sale") buckets[idx].profit   += r.amount;
    else                   buckets[idx].expenses += r.amount;
  }
  for (const b of buckets) b.profit -= b.expenses;
  return buckets;
}

function totals(records: BusinessRecord[]) {
  const sales    = records.filter(r => r.type === "sale").reduce((s, r) => s + r.amount, 0);
  const expenses = records.filter(r => r.type === "expense").reduce((s, r) => s + r.amount, 0);
  return { sales, expenses, profit: sales - expenses };
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function InsightsPage() {
  const [period, setPeriod]   = useState<Period>("week");
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

  const chartData = useMemo(() => aggregate(records, period), [records, period]);
  const t = useMemo(() => totals(records), [records]);

  // Best bucket (for the insight cards)
  const bestBucket = useMemo(() => {
    return chartData.reduce((best, b) =>
      (b.profit + b.expenses) > (best.profit + best.expenses) ? b : best,
      chartData[0] ?? { label: "", profit: 0, expenses: 0 });
  }, [chartData]);

  const topExpenseCat = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const r of records) {
      if (r.type !== "expense" || !r.category) continue;
      acc[r.category] = (acc[r.category] ?? 0) + r.amount;
    }
    return Object.entries(acc).sort((a, b) => b[1] - a[1])[0];
  }, [records]);

  const periodLabel = period === "today" ? "Today"
                    : period === "week"  ? "This week"
                    : period === "month" ? "This month"
                    : "This year";

  return (
    <div className="px-5 pt-6 pb-6 space-y-5" style={{ background: "#F8F7F4", minHeight: "100%" }}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-bold text-spal-navy" style={{ fontFamily: "var(--font-satoshi)" }}>
          Insights
        </h1>
      </div>

      {/* Period tabs */}
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
            {p === "today" ? "Today" : p === "week" ? "Week" : p === "month" ? "Month" : "Year"}
          </button>
        ))}
      </div>

      {/* Dark summary card */}
      <motion.div key={period} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="rounded-[18px] p-5" style={{ background: "#0F172A" }}>
          <p className="text-[11.5px] font-medium uppercase tracking-widest mb-2" style={{ fontFamily: "var(--font-satoshi)", color: "#A1A3AE" }}>
            {periodLabel} · Profit
          </p>

          {loading ? (
            <div className="h-9 w-40 bg-white/10 rounded-lg animate-pulse" />
          ) : (
            <p
              className="font-bold leading-none"
              style={{
                fontFamily: "var(--font-satoshi)",
                fontSize: "clamp(28px, 8.5vw, 36px)",
                letterSpacing: "-0.02em",
                color: t.profit >= 0 ? "#fff" : "#FCB35B",
              }}
            >
              {t.profit < 0 ? "–" : ""}{formatCurrency(Math.abs(t.profit))}
            </p>
          )}

          <div className="mt-5 flex items-stretch">
            <div className="flex-1">
              <p className="text-[11px] mb-1.5" style={{ fontFamily: "var(--font-satoshi)", color: "#67738F" }}>Sales</p>
              <p className="text-[15px] font-bold" style={{ fontFamily: "var(--font-satoshi)", color: "#22C55E" }}>
                {formatCurrency(t.sales)}
              </p>
            </div>
            <div className="w-px mx-4" style={{ background: "#384666" }} />
            <div className="flex-1">
              <p className="text-[11px] mb-1.5" style={{ fontFamily: "var(--font-satoshi)", color: "#67738F" }}>Expenses</p>
              <p className="text-[15px] font-bold" style={{ fontFamily: "var(--font-satoshi)", color: "#ED712E" }}>
                {formatCurrency(t.expenses)}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Bar chart card */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        <div className="bg-white rounded-[18px] p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          {/* Title + legend */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-[13px] font-bold text-spal-navy" style={{ fontFamily: "var(--font-satoshi)" }}>
              {period === "today"  ? "Today's breakdown" :
               period === "week"   ? "Daily breakdown"   :
               period === "month"  ? "Weekly breakdown"  :
                                     "Monthly breakdown"}
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
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#A1A3AE", fontFamily: "var(--font-satoshi)" }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#A1A3AE", fontFamily: "var(--font-satoshi)" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => v === 0 ? "0" : `${Math.round(v / 1000)}k`}
                  width={48}
                />
                <Tooltip
                  cursor={{ fill: "rgba(15,23,42,0.04)" }}
                  formatter={(v, name) => [formatCurrency(Math.abs(Number(v ?? 0))), name === "profit" ? "Profit" : "Expenses"]}
                  contentStyle={{
                    borderRadius: 12,
                    border: "none",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                    fontSize: 12,
                    fontFamily: "var(--font-satoshi)",
                  }}
                  labelStyle={{ fontWeight: 700, color: "#0F172A" }}
                />
                <Bar dataKey="profit"   fill="#22C55E" radius={[6, 6, 0, 0]} maxBarSize={28} />
                <Bar dataKey="expenses" fill="#ED712E" radius={[6, 6, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </motion.div>

      {/* Insight cards */}
      {!loading && records.length > 0 && (
        <div className="space-y-3">
          {bestBucket && bestBucket.profit > 0 && (
            <InsightCard
              title={`Best ${period === "year" ? "month" : period === "month" ? "week" : "day"}: ${bestBucket.label}`}
              message={`${bestBucket.label} was your strongest with ${formatCurrency(bestBucket.profit)} in profit.`}
              icon={<Trophy size={20} strokeWidth={2} color="#fff" />}
              variant="celebration"
            />
          )}
          {topExpenseCat && (
            <InsightCard
              title="Biggest expense"
              message={`${topExpenseCat[0]} is your top cost at ${formatCurrency(topExpenseCat[1])}. Worth keeping an eye on.`}
              icon={<TriangleAlert size={20} strokeWidth={2} className="text-spal-orange-600" />}
              variant="warning"
            />
          )}
          {t.profit > 0 && (
            <InsightCard
              title="Looking healthy"
              message={`You made ${formatCurrency(t.profit)} profit this ${period}.`}
              icon={<MessageCircle size={20} strokeWidth={2} className="text-spal-blue" />}
              variant="tip"
            />
          )}
        </div>
      )}

      {/* Empty state — no records at all */}
      {!loading && records.length === 0 && (
        <div className="text-center py-10">
          <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto">
            <BarChart3 size={26} strokeWidth={2} className="text-neutral-300" />
          </div>
          <p className="text-spal-navy font-semibold mt-3" style={{ fontFamily: "var(--font-satoshi)" }}>No data yet</p>
          <p className="text-neutral-400 text-sm mt-1">Add some sales and expenses to see your insights here.</p>
        </div>
      )}

      <div className="h-2" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
      <span className="text-[11px] font-medium" style={{ fontFamily: "var(--font-satoshi)", color: "#67738F" }}>{label}</span>
    </div>
  );
}

function EmptyChart({ period }: { period: Period }) {
  return (
    <div className="h-[200px] flex flex-col items-center justify-center text-center">
      <BarChart3 size={32} strokeWidth={1.8} className="text-neutral-300 mb-2" />
      <p className="text-[13px] text-neutral-500" style={{ fontFamily: "var(--font-satoshi)" }}>
        No activity for {period === "today" ? "today" : period === "week" ? "this week" : period === "month" ? "this month" : "this year"} yet.
      </p>
      <p className="text-[11.5px] text-neutral-400 mt-1">Add a sale or expense to see your chart.</p>
    </div>
  );
}

// kept for backward compat if referenced; unused now
void ArrowUp; void ArrowDown;
