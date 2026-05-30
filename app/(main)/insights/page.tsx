"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/utils/currency";
import { shortDay, lastNDays, todayISO, weekStartISO } from "@/lib/utils/dates";
import { InsightCard } from "@/components/ui/InsightCard";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import type { BusinessRecord, DailySummary } from "@/lib/types";

type Period = "today" | "week" | "month";

// ── Helpers ───────────────────────────────────────────────────────────────────

function calcTotals(records: BusinessRecord[]) {
  const sales    = records.filter(r => r.type === "sale").reduce((s, r) => s + r.amount, 0);
  const expenses = records.filter(r => r.type === "expense").reduce((s, r) => s + r.amount, 0);
  return { sales, expenses, profit: sales - expenses };
}

function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function InsightsPage() {
  const [period, setPeriod] = useState<Period>("week");
  const [records, setRecords] = useState<BusinessRecord[]>([]);
  const [prevRecords, setPrevRecords] = useState<BusinessRecord[]>([]);
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const today = todayISO();
      const weekStart = weekStartISO();

      // Date ranges based on period
      let startDate: string;
      let prevStartDate: string;
      let prevEndDate: string;

      if (period === "today") {
        startDate = today;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        prevStartDate = yesterday.toISOString().split("T")[0];
        prevEndDate   = yesterday.toISOString().split("T")[0];
      } else if (period === "week") {
        startDate = weekStart;
        const prevWeekEnd   = new Date(weekStart);
        prevWeekEnd.setDate(prevWeekEnd.getDate() - 1);
        const prevWeekStart = new Date(prevWeekEnd);
        prevWeekStart.setDate(prevWeekStart.getDate() - 6);
        prevStartDate = prevWeekStart.toISOString().split("T")[0];
        prevEndDate   = prevWeekEnd.toISOString().split("T")[0];
      } else {
        // month
        const now = new Date();
        startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
        const prevMonthEnd = new Date(startDate);
        prevMonthEnd.setDate(prevMonthEnd.getDate() - 1);
        const prevMonthStart = new Date(prevMonthEnd.getFullYear(), prevMonthEnd.getMonth(), 1);
        prevStartDate = prevMonthStart.toISOString().split("T")[0];
        prevEndDate   = prevMonthEnd.toISOString().split("T")[0];
      }

      // Fetch current + previous period records in parallel
      const [curRes, prevRes, summaryRes] = await Promise.all([
        fetch(`/api/records?start_date=${startDate}&limit=500`),
        fetch(`/api/records?start_date=${prevStartDate}&end_date=${prevEndDate}&limit=500`),
        period === "today" ? fetch("/api/ai/daily-insight") : Promise.resolve(null),
      ]);

      const [curData, prevData] = await Promise.all([
        curRes.json(),
        prevRes.json(),
      ]);

      if (curData.success)  setRecords(curData.data);
      if (prevData.success) setPrevRecords(prevData.data);

      if (summaryRes) {
        const sd = await summaryRes.json();
        if (sd.success) setSummary(sd.data);
      }
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totals = calcTotals(records);
  const prevTotals = calcTotals(prevRecords);
  const profitChange = percentChange(totals.profit, prevTotals.profit);

  // Build chart data — last 7 days aggregated
  const chartDays = lastNDays(7);
  const chartData = chartDays.map((date) => {
    const dayRecords = records.filter(r => r.record_date === date);
    return {
      day:      shortDay(date),
      sales:    dayRecords.filter(r => r.type === "sale").reduce((s, r) => s + r.amount, 0),
      expenses: dayRecords.filter(r => r.type === "expense").reduce((s, r) => s + r.amount, 0),
    };
  });

  // Build insight cards from real data
  const bestDay = chartData.reduce((best, d) => d.sales > best.sales ? d : best, chartData[0]);
  const topExpenseCategory = records
    .filter(r => r.type === "expense" && r.category)
    .reduce<Record<string, number>>((acc, r) => {
      acc[r.category!] = (acc[r.category!] ?? 0) + r.amount;
      return acc;
    }, {});
  const topCat = Object.entries(topExpenseCategory).sort((a, b) => b[1] - a[1])[0];

  const insightCards = [
    ...(summary?.ai_message ? [{
      title: "SPAL says",
      message: summary.ai_message,
      emoji: "💬",
      variant: "tip" as const,
    }] : []),
    ...(bestDay?.sales > 0 ? [{
      title: `Best day: ${bestDay.day}`,
      message: `${bestDay.day} was your strongest day with ${formatCurrency(bestDay.sales)} in sales.`,
      emoji: "🏆",
      variant: "celebration" as const,
    }] : []),
    ...(topCat ? [{
      title: "Biggest expense",
      message: `${topCat[0]} is your top cost at ${formatCurrency(topCat[1])}. Worth keeping an eye on.`,
      emoji: "⚡",
      variant: "warning" as const,
    }] : []),
    ...(totals.profit > 0 ? [{
      title: "Looking good",
      message: `You made ${formatCurrency(totals.profit)} profit this ${period === "today" ? "day" : period}.${profitChange != null ? ` That's ${profitChange > 0 ? "+" : ""}${profitChange}% vs last ${period === "today" ? "day" : period}.` : ""}`,
      emoji: "📈",
      variant: "tip" as const,
      ...(profitChange != null ? { metric: `${profitChange > 0 ? "+" : ""}${profitChange}%`, metricLabel: `vs last ${period === "today" ? "day" : period}`, positive: profitChange >= 0 } : {}),
    }] : []),
  ];

  const periodLabel = period === "today" ? "Today" : period === "week" ? "This week" : "This month";
  const compLabel   = period === "today" ? "yesterday" : period === "week" ? "last week" : "last month";

  return (
    <div className="px-4 pt-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-spal-navy font-[family-name:var(--font-satoshi)]">
          Insights
        </h1>
      </div>

      {/* Period tabs */}
      <div className="flex bg-neutral-100 rounded-full p-1 gap-0.5">
        {(["today", "week", "month"] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex-1 h-8 rounded-full text-xs font-semibold transition-all duration-200 font-[family-name:var(--font-satoshi)] ${
              period === p ? "bg-white text-spal-navy shadow-sm" : "text-neutral-500"
            }`}
          >
            {p === "today" ? "Today" : p === "week" ? "Week" : "Month"}
          </button>
        ))}
      </div>

      {/* Summary Card */}
      <motion.div key={period} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <Card padding="md">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">
              {periodLabel}
            </p>
            {profitChange != null && (
              <Badge
                label={`${profitChange >= 0 ? "+" : ""}${profitChange}% vs ${compLabel}`}
                color={profitChange >= 0 ? "green" : "orange"}
              />
            )}
          </div>

          {loading ? (
            <SummarySkeleton />
          ) : (
            <div className="grid grid-cols-3 gap-3">
              <MetricBlock label="Sales"    amount={totals.sales}    color="text-spal-green"  compact />
              <MetricBlock label="Expenses" amount={totals.expenses} color="text-spal-orange" compact />
              <MetricBlock label="Profit"   amount={totals.profit}   color="text-spal-blue"   compact />
            </div>
          )}
        </Card>
      </motion.div>

      {/* 7-day chart — only shown on week/month view */}
      {period !== "today" && (
        <Card padding="md">
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-3">
            7-day trend
          </p>
          {loading ? (
            <div className="h-36 bg-neutral-50 rounded-xl animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#22C55E" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 10, fill: "#94A3B8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#94A3B8" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(v) => [formatCurrency(Number(v ?? 0)), ""]}
                  contentStyle={{
                    borderRadius: 12,
                    border: "none",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#22C55E"
                  strokeWidth={2}
                  fill="url(#salesGrad)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>
      )}

      {/* Insight Cards */}
      {!loading && insightCards.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-2">
            What SPAL noticed
          </p>
          <div className="space-y-3">
            {insightCards.map((insight, i) => (
              <motion.div
                key={insight.title}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <InsightCard {...insight} />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && records.length === 0 && (
        <div className="text-center py-12">
          <span className="text-4xl">📊</span>
          <p className="text-spal-navy font-semibold mt-3">No data yet</p>
          <p className="text-neutral-400 text-sm mt-1">Add some sales and expenses to see your insights here.</p>
        </div>
      )}

      <div className="h-4" />
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MetricBlock({ label, amount, color, compact }: {
  label: string; amount: number; color: string; compact?: boolean;
}) {
  return (
    <div className="flex flex-col">
      <p className="text-xs text-neutral-400 mb-1">{label}</p>
      <p className={`font-bold font-[family-name:var(--font-satoshi)] ${compact ? "text-base" : "text-xl"} ${color}`}>
        {formatCurrency(amount, "NGN", true)}
      </p>
    </div>
  );
}

function SummarySkeleton() {
  return (
    <div className="grid grid-cols-3 gap-3 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-1.5">
          <div className="h-2.5 bg-neutral-100 rounded w-12" />
          <div className="h-5 bg-neutral-100 rounded w-16" />
        </div>
      ))}
    </div>
  );
}

