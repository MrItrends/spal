"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useSPALStore } from "@/store";
import { formatCurrency } from "@/lib/utils/currency";
import { getGreeting, formatTime } from "@/lib/utils/dates";
import { InsightCard } from "@/components/ui/InsightCard";
import { Card } from "@/components/ui/Card";
import { AddRecordSheet } from "@/components/records/AddRecordSheet";
import { WeeklyChallengeCard } from "@/components/gamification/WeeklyChallengeCard";
import type { BusinessRecord, DailySummary } from "@/lib/types";

export default function HomePage() {
  const { user, addSheetOpen, setAddSheet, recordSavedAt } = useSPALStore();
  const greeting = getGreeting();
  const name = user?.full_name ?? user?.business_name ?? "there";

  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [records, setRecords] = useState<BusinessRecord[]>([]);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [editRecord, setEditRecord] = useState<BusinessRecord | null>(null);

  const fetchData = useCallback(async () => {
    // Fetch today's AI summary
    try {
      const res = await fetch("/api/ai/daily-insight");
      const data = await res.json();
      if (data.success) setSummary(data.data);
    } catch { /* silent */ } finally {
      setLoadingSummary(false);
    }

    // Fetch today's records (last 4)
    try {
      const res = await fetch("/api/records?limit=4");
      const data = await res.json();
      if (data.success) setRecords(data.data);
    } catch { /* silent */ } finally {
      setLoadingRecords(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  // Re-fetch whenever a voice/quick record is saved
  useEffect(() => { if (recordSavedAt) { setLoadingSummary(true); setLoadingRecords(true); fetchData(); } }, [recordSavedAt]); // eslint-disable-line react-hooks/exhaustive-deps

  // Refetch after adding/editing a record
  function handleRecordAdded() {
    setLoadingSummary(true);
    setLoadingRecords(true);
    fetchData();
  }

  function handleEditClose() {
    setEditRecord(null);
  }

  return (
    <>
      <div className="px-4 pt-6 space-y-4 animate-fade-in">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
          <div>
            <p className="text-neutral-400 text-sm">{greeting} 👋</p>
            <h1 className="text-xl font-bold text-spal-navy font-[family-name:var(--font-poppins)]">{name}</h1>
          </div>
          <div className="flex items-center gap-1 bg-spal-orange-50 rounded-full px-3 py-1.5">
            <span className="text-sm">🔥</span>
            <span className="text-xs font-bold text-spal-orange-600 font-[family-name:var(--font-poppins)]">
              {user?.streak_days ?? 0} days
            </span>
          </div>
        </motion.div>

        {/* Today's Summary Card */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card accent="green" padding="md">
            <div className="flex items-center justify-between mb-3">
              <p className="spal-section-label">Today&apos;s Summary</p>
              <a href="/insights" className="text-xs text-spal-blue font-medium">See details →</a>
            </div>

            {loadingSummary ? (
              <SummarySkeleton />
            ) : summary ? (
              <>
                <div className="space-y-2.5">
                  <SummaryRow label="Sales"      amount={summary.total_sales}    color="text-spal-green"  dot="bg-spal-green"  prefix="+" />
                  <SummaryRow label="Expenses"   amount={summary.total_expenses} color="text-spal-orange" dot="bg-spal-orange" prefix="-" />
                  <div className="border-t border-neutral-100 pt-2.5">
                    <SummaryRow label="Your Profit" amount={summary.profit}     color="text-spal-blue"   dot="bg-spal-blue"   large />
                  </div>
                </div>
                {summary.ai_message && (
                  <div className="mt-3 bg-spal-green-50 rounded-xl p-3">
                    <p className="text-xs text-spal-green-700 leading-relaxed">{summary.ai_message}</p>
                  </div>
                )}
              </>
            ) : (
              <EmptySummary onAdd={() => setAddSheet("sale")} />
            )}
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <p className="spal-section-label mb-2">Quick actions</p>
          <div className="grid grid-cols-4 gap-2">
            <QuickAction emoji="💰" label="Add Sale"  color="bg-spal-green-50  text-spal-green-700"   border="border-spal-green-100"   onClick={() => setAddSheet("sale")} />
            <QuickAction emoji="🧾" label="Expense"   color="bg-spal-orange-50 text-spal-orange-600"  border="border-spal-orange-100"  onClick={() => setAddSheet("expense")} />
            <QuickAction emoji="🎯" label="Goals"     color="bg-spal-blue-50   text-spal-blue-600"    border="border-spal-blue-100"    href="/goals" />
            <QuickAction emoji="💬" label="Ask SPAL"  color="bg-spal-purple-50 text-spal-purple-600"  border="border-spal-purple-100"  href="/ask" />
          </div>
        </motion.div>

        {/* Weekly Challenge */}
        <WeeklyChallengeCard />

        {/* AI Insight */}
        {summary?.ai_insight && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <InsightCard title="Today's insight" message={summary.ai_insight} emoji="💡" variant="tip" />
          </motion.div>
        )}

        {/* Recent Records */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <div className="flex items-center justify-between mb-2">
            <p className="spal-section-label">Recent records</p>
            <a href="/records" className="text-xs text-spal-blue font-medium">See all →</a>
          </div>

          <Card padding="none">
            {loadingRecords ? (
              <RecordsSkeleton />
            ) : records.length > 0 ? (
              records.map((record, i) => (
                <motion.button
                  key={record.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => { setEditRecord(record); setAddSheet(null); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 active:bg-neutral-50 transition-colors text-left ${
                    i < records.length - 1 ? "border-b border-neutral-50" : ""
                  }`}
                >
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${record.type === "sale" ? "bg-spal-green" : "bg-spal-orange"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-spal-navy font-medium truncate">{record.description ?? record.category ?? record.type}</p>
                    <p className="text-xs text-neutral-400">{formatTime(record.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <p className={`text-sm font-bold ${record.type === "sale" ? "text-spal-green" : "text-spal-orange"}`}>
                      {record.type === "sale" ? "+" : "-"}{formatCurrency(record.amount)}
                    </p>
                    <span className="text-neutral-200 text-xs">✎</span>
                  </div>
                </motion.button>
              ))
            ) : (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-neutral-400">No records yet today.</p>
                <button onClick={() => setAddSheet("sale")} className="mt-2 text-spal-green text-sm font-semibold">
                  Record your first sale →
                </button>
              </div>
            )}
          </Card>
        </motion.div>

        <div className="h-4" />
      </div>

      {/* Add sheets */}
      <AddRecordSheet type="sale"    open={addSheetOpen === "sale"}    onClose={() => setAddSheet(null)} onSuccess={handleRecordAdded} />
      <AddRecordSheet type="expense" open={addSheetOpen === "expense"} onClose={() => setAddSheet(null)} onSuccess={handleRecordAdded} />

      {/* Edit sheet — opens when a recent record is tapped */}
      <AddRecordSheet
        type={editRecord?.type ?? "sale"}
        open={!!editRecord}
        record={editRecord}
        onClose={handleEditClose}
        onSuccess={() => { handleRecordAdded(); handleEditClose(); }}
      />
    </>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function SummaryRow({ label, amount, color, dot, prefix = "", large = false }:
  { label: string; amount: number; color: string; dot: string; prefix?: string; large?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={`w-2.5 h-2.5 rounded-full ${dot}`} />
        <span className={`${large ? "text-sm font-semibold" : "text-sm"} text-neutral-600`}>{label}</span>
      </div>
      <span className={`font-bold ${large ? "text-lg" : "text-sm"} ${color}`}>{prefix}{formatCurrency(amount)}</span>
    </div>
  );
}

function QuickAction({ emoji, label, color, border, onClick, href }:
  { emoji: string; label: string; color: string; border: string; onClick?: () => void; href?: string }) {
  const content = (
    <div
      className={`flex flex-col items-center gap-1.5 p-3 rounded-[16px] ${color} border ${border} cursor-pointer active:scale-95 transition-all duration-150`}
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.05)" }}
      onClick={onClick}
    >
      <span className="text-xl leading-none">{emoji}</span>
      <span className="text-[10px] font-semibold text-center leading-tight font-[family-name:var(--font-poppins)]">{label}</span>
    </div>
  );
  return href ? <a href={href}>{content}</a> : content;
}

function EmptySummary({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="py-4 text-center">
      <p className="text-sm text-neutral-400 leading-relaxed">No records yet today.</p>
      <button onClick={onAdd} className="mt-3 text-spal-green font-semibold text-sm">
        + Add your first sale
      </button>
    </div>
  );
}

function SummarySkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[1, 2, 3].map(i => (
        <div key={i} className="flex justify-between">
          <div className="h-4 bg-neutral-100 rounded w-24" />
          <div className="h-4 bg-neutral-100 rounded w-20" />
        </div>
      ))}
    </div>
  );
}

function RecordsSkeleton() {
  return (
    <>
      {[1, 2, 3].map(i => (
        <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-neutral-50 animate-pulse">
          <div className="w-2.5 h-2.5 rounded-full bg-neutral-100" />
          <div className="flex-1 space-y-1">
            <div className="h-3 bg-neutral-100 rounded w-32" />
            <div className="h-2.5 bg-neutral-100 rounded w-16" />
          </div>
          <div className="h-3 bg-neutral-100 rounded w-16" />
        </div>
      ))}
    </>
  );
}
