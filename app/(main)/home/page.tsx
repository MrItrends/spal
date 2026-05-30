"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useSPALStore } from "@/store";
import { formatCurrency } from "@/lib/utils/currency";
import { getGreeting } from "@/lib/utils/dates";
import { AddRecordSheet } from "@/components/records/AddRecordSheet";
import { WeeklyChallengeCard } from "@/components/gamification/WeeklyChallengeCard";
import type { BusinessRecord, DailySummary } from "@/lib/types";
import { TrendingUp, TrendingDown, Target, MessageCircle, Lightbulb, ArrowUpRight, ArrowDownRight, ChevronRight } from "lucide-react";

export default function HomePage() {
  const { user, addSheetOpen, setAddSheet, recordSavedAt } = useSPALStore();
  const greeting = getGreeting();
  const name = user?.full_name ?? user?.business_name ?? "there";

  const [summary, setSummary]           = useState<DailySummary | null>(null);
  const [records, setRecords]           = useState<BusinessRecord[]>([]);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [editRecord, setEditRecord]     = useState<BusinessRecord | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res  = await fetch("/api/ai/daily-insight");
      const data = await res.json();
      if (data.success) setSummary(data.data);
    } catch { /* silent */ } finally { setLoadingSummary(false); }

    try {
      const res  = await fetch("/api/records?limit=5");
      const data = await res.json();
      if (data.success) setRecords(data.data);
    } catch { /* silent */ } finally { setLoadingRecords(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    if (recordSavedAt) { setLoadingSummary(true); setLoadingRecords(true); fetchData(); }
  }, [recordSavedAt]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleRecordAdded() { setLoadingSummary(true); setLoadingRecords(true); fetchData(); }
  function handleEditClose()   { setEditRecord(null); }

  return (
    <>
      <div className="px-5 pt-7 space-y-5 animate-fade-in">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="flex items-start justify-between"
        >
          <div>
            <p className="text-neutral-400 text-[13px] font-medium" style={{ fontFamily: "var(--font-satoshi)" }}>
              {greeting}
            </p>
            <h1 className="text-[22px] font-bold text-spal-navy mt-0.5">
              {name}
            </h1>
          </div>

          {/* Streak — minimal, navy pill */}
          {(user?.streak_days ?? 0) > 0 && (
            <div
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
              style={{ background: "#0F172A" }}
            >
              <StreakDotIcon />
              <span className="text-[11px] font-semibold text-white" style={{ fontFamily: "var(--font-satoshi)" }}>
                {user?.streak_days} day streak
              </span>
            </div>
          )}
        </motion.div>

        {/* ── Today's Pulse — dark hero card ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        >
          <div
            className="rounded-[22px] p-5"
            style={{ background: "#0F172A" }}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-semibold tracking-widest uppercase text-white/40" style={{ fontFamily: "var(--font-satoshi)" }}>
                Today&apos;s Pulse
              </span>
              <a href="/insights" className="text-[11px] text-white/30 font-medium flex items-center gap-0.5 hover:text-white/50 transition-colors">
                Details <ChevronRight size={10} strokeWidth={2} />
              </a>
            </div>

            {loadingSummary ? (
              <PulseSkeleton />
            ) : summary ? (
              <>
                {/* Big profit number */}
                <div className="mb-5">
                  <p className="text-white/40 text-xs mb-1" style={{ fontFamily: "var(--font-satoshi)" }}>
                    {(summary.profit ?? 0) >= 0 ? "Profit" : "Net loss"}
                  </p>
                  <p
                    className="font-bold leading-none"
                    style={{
                      fontFamily: "var(--font-satoshi)",
                      fontSize: "clamp(28px, 8vw, 36px)",
                      color: (summary.profit ?? 0) >= 0 ? "#22C55E" : "#F97316",
                    }}
                  >
                    {formatCurrency(Math.abs(summary.profit ?? 0))}
                  </p>
                </div>

                {/* Sales / Expenses row */}
                <div className="flex gap-6">
                  <div>
                    <p className="text-white/30 text-[10px] uppercase tracking-wider mb-0.5" style={{ fontFamily: "var(--font-satoshi)" }}>Sales</p>
                    <p className="text-white font-semibold text-base" style={{ fontFamily: "var(--font-satoshi)" }}>
                      {formatCurrency(summary.total_sales ?? 0)}
                    </p>
                  </div>
                  <div className="w-px bg-white/8" />
                  <div>
                    <p className="text-white/30 text-[10px] uppercase tracking-wider mb-0.5" style={{ fontFamily: "var(--font-satoshi)" }}>Expenses</p>
                    <p className="text-spal-orange font-semibold text-base" style={{ fontFamily: "var(--font-satoshi)" }}>
                      {formatCurrency(summary.total_expenses ?? 0)}
                    </p>
                  </div>
                </div>

                {/* AI message */}
                {summary.ai_message && (
                  <div className="mt-4 pt-4 border-t border-white/8">
                    <p className="text-white/50 text-[12px] leading-relaxed" style={{ fontFamily: "var(--font-satoshi)" }}>
                      {summary.ai_message}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <PulseEmpty onAdd={() => setAddSheet("sale")} />
            )}
          </div>
        </motion.div>

        {/* ── Quick Actions ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16, duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        >
          <div className="grid grid-cols-2 gap-2.5">
            <ActionButton
              icon={<SaleActionIcon />}
              label="Record Sale"
              sub="Add money in"
              accent="#22C55E"
              onClick={() => setAddSheet("sale")}
            />
            <ActionButton
              icon={<ExpenseActionIcon />}
              label="Record Expense"
              sub="Add money out"
              accent="#F97316"
              onClick={() => setAddSheet("expense")}
            />
          </div>
          <div className="grid grid-cols-2 gap-2.5 mt-2.5">
            <ActionButton
              icon={<GoalsActionIcon />}
              label="Goals"
              sub="Track targets"
              accent="#2563EB"
              href="/goals"
              small
            />
            <ActionButton
              icon={<AskActionIcon />}
              label="Ask SPAL"
              sub="Get answers"
              accent="#8B5CF6"
              href="/ask"
              small
            />
          </div>
        </motion.div>

        {/* ── Weekly Challenge ── */}
        <WeeklyChallengeCard />

        {/* ── AI Insight ── */}
        {summary?.ai_insight && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28, duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="bg-white rounded-[18px] p-4 border border-neutral-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
          >
            <div className="flex items-start gap-3">
              <InsightSymbol />
              <div>
                <p className="text-[11px] font-semibold text-spal-navy uppercase tracking-wider mb-1" style={{ fontFamily: "var(--font-satoshi)" }}>
                  Insight
                </p>
                <p className="text-[13px] text-neutral-500 leading-relaxed" style={{ fontFamily: "var(--font-satoshi)" }}>
                  {summary.ai_insight}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Recent Records ── */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32, duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="spal-section-label">Recent activity</p>
            <a href="/records" className="text-[11px] text-spal-blue font-medium">View all</a>
          </div>

          <div className="bg-white rounded-[18px] border border-neutral-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
            {loadingRecords ? (
              <RecordsSkeleton />
            ) : records.length > 0 ? (
              records.map((record, i) => (
                <motion.button
                  key={record.id}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.035, ease: [0.4, 0, 0.2, 1] }}
                  onClick={() => { setEditRecord(record); setAddSheet(null); }}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 active:bg-neutral-50 transition-colors text-left ${
                    i < records.length - 1 ? "border-b border-neutral-50" : ""
                  }`}
                >
                  {/* Color dot */}
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: record.type === "sale" ? "#22C55E" : "#F97316" }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-spal-navy font-medium truncate" style={{ fontFamily: "var(--font-satoshi)" }}>
                      {record.description ?? record.category ?? record.type}
                    </p>
                    <p className="text-[11px] text-neutral-400 mt-0.5">{formatRecordTime(record.created_at)}</p>
                  </div>
                  <p
                    className="text-[13px] font-semibold flex-shrink-0"
                    style={{
                      fontFamily: "var(--font-satoshi)",
                      color: record.type === "sale" ? "#22C55E" : "#F97316",
                    }}
                  >
                    {record.type === "sale" ? "+" : "–"}{formatCurrency(record.amount)}
                  </p>
                </motion.button>
              ))
            ) : (
              <div className="px-4 py-10 text-center">
                <RecordsEmptySymbol />
                <p className="text-[13px] text-neutral-400 mt-3" style={{ fontFamily: "var(--font-satoshi)" }}>
                  No activity yet today.
                </p>
                <button
                  onClick={() => setAddSheet("sale")}
                  className="mt-2 text-spal-green text-[13px] font-semibold"
                  style={{ fontFamily: "var(--font-satoshi)" }}
                >
                  Record your first sale
                </button>
              </div>
            )}
          </div>
        </motion.div>

        <div className="h-5" />
      </div>

      {/* Sheets */}
      <AddRecordSheet type="sale"    open={addSheetOpen === "sale"}    onClose={() => setAddSheet(null)} onSuccess={handleRecordAdded} />
      <AddRecordSheet type="expense" open={addSheetOpen === "expense"} onClose={() => setAddSheet(null)} onSuccess={handleRecordAdded} />
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

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatRecordTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit", hour12: true });
}

// ── Sub-components ──────────────────────────────────────────────────────────

function ActionButton({
  icon, label, sub, accent, onClick, href, small = false,
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
  accent: string;
  onClick?: () => void;
  href?: string;
  small?: boolean;
}) {
  const inner = (
    <div
      className={`flex items-center gap-3 bg-white border border-neutral-100 rounded-[16px] cursor-pointer active:scale-[0.98] transition-all duration-150 ${small ? "px-3.5 py-3" : "px-4 py-4"}`}
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.04)" }}
      onClick={onClick}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${accent}14`, color: accent }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[13px] font-semibold text-spal-navy leading-tight" style={{ fontFamily: "var(--font-satoshi)" }}>
          {label}
        </p>
        <p className="text-[11px] text-neutral-400 mt-0.5">{sub}</p>
      </div>
    </div>
  );
  return href ? <a href={href}>{inner}</a> : inner;
}

function PulseEmpty({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="py-2">
      <p className="text-white/30 text-[13px] leading-relaxed" style={{ fontFamily: "var(--font-satoshi)" }}>
        Nothing recorded yet today.
      </p>
      <button
        onClick={onAdd}
        className="mt-3 text-spal-green font-semibold text-[13px]"
        style={{ fontFamily: "var(--font-satoshi)" }}
      >
        Record your first sale
      </button>
    </div>
  );
}

function PulseSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-9 bg-white/8 rounded-xl w-40" />
      <div className="flex gap-6">
        <div className="h-5 bg-white/8 rounded w-24" />
        <div className="h-5 bg-white/8 rounded w-24" />
      </div>
    </div>
  );
}

function RecordsSkeleton() {
  return (
    <>
      {[1, 2, 3].map(i => (
        <div key={i} className="flex items-center gap-3 px-4 py-3.5 border-b border-neutral-50 animate-pulse">
          <div className="w-2 h-2 rounded-full bg-neutral-100" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 bg-neutral-100 rounded w-32" />
            <div className="h-2.5 bg-neutral-100 rounded w-16" />
          </div>
          <div className="h-3 bg-neutral-100 rounded w-16" />
        </div>
      ))}
    </>
  );
}

// ── Icons via Lucide ─────────────────────────────────────────────────────────

function StreakDotIcon() {
  return <div className="w-2 h-2 rounded-full bg-spal-green" />;
}

function InsightSymbol() {
  return (
    <div className="w-8 h-8 rounded-xl bg-spal-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
      <Lightbulb size={16} className="text-spal-blue" strokeWidth={1.8} />
    </div>
  );
}

function RecordsEmptySymbol() {
  return (
    <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center mx-auto">
      <TrendingUp size={20} className="text-neutral-300" strokeWidth={1.8} />
    </div>
  );
}

function SaleActionIcon()    { return <TrendingUp    size={18} strokeWidth={1.8} />; }
function ExpenseActionIcon() { return <TrendingDown  size={18} strokeWidth={1.8} />; }
function GoalsActionIcon()   { return <Target        size={18} strokeWidth={1.8} />; }
function AskActionIcon()     { return <MessageCircle size={18} strokeWidth={1.8} />; }
