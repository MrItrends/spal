"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useSPALStore } from "@/store";
import { formatCurrency } from "@/lib/utils/currency";
import { getGreeting } from "@/lib/utils/dates";
import { AddRecordSheet } from "@/components/records/AddRecordSheet";
import type { BusinessRecord, DailySummary } from "@/lib/types";
import {
  TrendingUp, TrendingDown, Target, MessageCircle, User,
  ArrowUp, ArrowDown, ChevronRight,
} from "lucide-react";

const BEIGE  = "#F3EFE4";
const TEAL   = "#204948";

export default function HomePage() {
  const router = useRouter();
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
      const res  = await fetch("/api/records?limit=6");
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

  const profit   = summary?.profit ?? 0;
  const isProfit = profit >= 0;

  return (
    <>
      <div className="px-6 pt-7 space-y-6 animate-fade-in" style={{ background: "#F8F7F4" }}>

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="flex items-center justify-between"
        >
          <div>
            <p className="text-neutral-400 text-[13px] font-medium" style={{ fontFamily: "var(--font-satoshi)" }}>
              {greeting}
            </p>
            <h1 className="text-[22px] font-bold text-spal-navy mt-0.5" style={{ fontFamily: "var(--font-satoshi)" }}>
              {name}
            </h1>
          </div>

          <div className="flex items-center gap-2.5">
            <CircleButton onClick={() => router.push("/ask")} aria="Ask SPAL">
              <MessageCircle size={18} strokeWidth={2} color="#fff" />
            </CircleButton>
            <CircleButton onClick={() => router.push("/profile")} aria="Profile">
              <User size={18} strokeWidth={2} color="#fff" />
            </CircleButton>
          </div>
        </motion.div>

        {/* ── Hero summary card (beige) ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        >
          <div
            className="relative rounded-[24px] p-6 overflow-hidden"
            style={{ background: BEIGE }}
          >
            {/* Soft decorative glows */}
            <div className="absolute -top-10 -right-8 w-40 h-40 rounded-full pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(2,209,105,0.16), transparent 70%)" }} />
            <div className="absolute -bottom-12 -left-6 w-40 h-40 rounded-full pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(46,99,249,0.10), transparent 70%)" }} />

            <div className="relative">
              <div className="flex items-center justify-between mb-5">
                <span className="text-[11px] font-bold tracking-widest uppercase" style={{ fontFamily: "var(--font-satoshi)", color: TEAL, opacity: 0.55 }}>
                  Today
                </span>
                <button
                  onClick={() => router.push("/insights")}
                  className="text-[11px] font-medium flex items-center gap-0.5"
                  style={{ color: TEAL, opacity: 0.6 }}
                >
                  Details <ChevronRight size={11} strokeWidth={2} />
                </button>
              </div>

              {loadingSummary ? (
                <PulseSkeleton />
              ) : summary ? (
                <>
                  <p className="text-[12px] mb-1" style={{ fontFamily: "var(--font-satoshi)", color: TEAL, opacity: 0.5 }}>
                    {isProfit ? "Profit" : "Net loss"}
                  </p>
                  <p
                    className="font-bold leading-none mb-6"
                    style={{
                      fontFamily: "var(--font-satoshi)",
                      fontSize: "clamp(34px, 10vw, 44px)",
                      letterSpacing: "-0.02em",
                      color: isProfit ? "#0F172A" : "#C2410C",
                    }}
                  >
                    {formatCurrency(Math.abs(profit))}
                  </p>

                  <div className="flex gap-3">
                    <HeroStat label="Sales"    value={formatCurrency(summary.total_sales ?? 0)}    color="#16A34A" icon={<ArrowUp size={12} strokeWidth={2.5} color="#16A34A" />} bg="rgba(22,163,74,0.10)" />
                    <HeroStat label="Expenses" value={formatCurrency(summary.total_expenses ?? 0)} color="#EA580C" icon={<ArrowDown size={12} strokeWidth={2.5} color="#EA580C" />} bg="rgba(234,88,12,0.10)" />
                  </div>

                  {summary.ai_message && (
                    <p className="mt-5 text-[12.5px] leading-relaxed" style={{ fontFamily: "var(--font-satoshi)", color: TEAL, opacity: 0.75 }}>
                      {summary.ai_message}
                    </p>
                  )}
                </>
              ) : (
                <PulseEmpty onAdd={() => setAddSheet("sale")} />
              )}
            </div>
          </div>
        </motion.div>

        {/* ── Quick actions (2×2 pastel grid) ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16, duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="grid grid-cols-2 gap-3"
        >
          <Tile bg="#E0F4E9" label="Add Sale"     icon={<TrendingUp    size={18} strokeWidth={2} color="#16A34A" />} onClick={() => setAddSheet("sale")} />
          <Tile bg="#F3E5DD" label="Add Expense"  icon={<TrendingDown  size={18} strokeWidth={2} color="#EA580C" />} onClick={() => setAddSheet("expense")} />
          <Tile bg="#E3E9F8" label="Goals"        icon={<Target        size={18} strokeWidth={2} color="#2563EB" />} onClick={() => router.push("/goals")} />
          <Tile bg="#ECE5F9" label="Ask SPAL"     icon={<MessageCircle size={18} strokeWidth={2} color="#8B5CF6" />} onClick={() => router.push("/ask")} />
        </motion.div>

        {/* ── Recent activity ── */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24, duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-[15px] font-bold text-spal-navy" style={{ fontFamily: "var(--font-satoshi)" }}>
              Recent activity
            </p>
            <button onClick={() => router.push("/records")} className="text-[12px] font-semibold" style={{ color: TEAL }}>
              View all
            </button>
          </div>

          {loadingRecords ? (
            <RecordsSkeleton />
          ) : records.length > 0 ? (
            <div className="space-y-2.5">
              {records.map((record, i) => (
                <motion.button
                  key={record.id}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.035, ease: [0.4, 0, 0.2, 1] }}
                  onClick={() => { setEditRecord(record); setAddSheet(null); }}
                  className="w-full flex items-center gap-3 bg-white rounded-2xl px-3.5 py-3 active:scale-[0.99] transition-transform text-left"
                  style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: record.type === "sale" ? "#EFFBF4" : "#FFF5EF" }}
                  >
                    {record.type === "sale"
                      ? <ArrowUp size={17} strokeWidth={2.2} color="#16A34A" />
                      : <ArrowDown size={17} strokeWidth={2.2} color="#EA580C" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] text-spal-navy font-semibold truncate" style={{ fontFamily: "var(--font-satoshi)" }}>
                      {record.description ?? record.category ?? (record.type === "sale" ? "Sale" : "Expense")}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {record.category && (
                        <span
                          className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                          style={{
                            background: record.type === "sale" ? "#F0FDF4" : "#FFF7ED",
                            color: record.type === "sale" ? "#16A34A" : "#EA580C",
                          }}
                        >
                          {record.category}
                        </span>
                      )}
                      <span className="text-[11px] text-neutral-400">{formatRecordTime(record.created_at)}</span>
                    </div>
                  </div>

                  <p
                    className="text-[13.5px] font-bold flex-shrink-0"
                    style={{ fontFamily: "var(--font-satoshi)", color: record.type === "sale" ? "#16A34A" : "#EA580C" }}
                  >
                    {record.type === "sale" ? "+" : "–"}{formatCurrency(record.amount)}
                  </p>
                </motion.button>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl px-4 py-10 text-center" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
              <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-3">
                <TrendingUp size={22} className="text-neutral-300" strokeWidth={2} />
              </div>
              <p className="text-[13px] text-neutral-400" style={{ fontFamily: "var(--font-satoshi)" }}>
                No activity yet today.
              </p>
              <button
                onClick={() => setAddSheet("sale")}
                className="mt-2 text-[13px] font-semibold"
                style={{ fontFamily: "var(--font-satoshi)", color: "#16A34A" }}
              >
                Record your first sale
              </button>
            </div>
          )}
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

function CircleButton({ children, onClick, aria }: { children: React.ReactNode; onClick: () => void; aria: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={aria}
      className="w-[42px] h-[42px] rounded-full flex items-center justify-center active:scale-95 transition-transform"
      style={{ background: TEAL }}
    >
      {children}
    </button>
  );
}

function HeroStat({ label, value, color, bg, icon }: {
  label: string; value: string; color: string; bg: string; icon: React.ReactNode;
}) {
  return (
    <div className="flex-1 rounded-2xl px-3.5 py-3" style={{ background: "rgba(255,255,255,0.55)" }}>
      <div className="flex items-center gap-1.5 mb-1">
        <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: bg }}>
          {icon}
        </div>
        <span className="text-[11px] font-medium" style={{ fontFamily: "var(--font-satoshi)", color: TEAL, opacity: 0.6 }}>
          {label}
        </span>
      </div>
      <p className="text-[15px] font-bold" style={{ fontFamily: "var(--font-satoshi)", color }}>
        {value}
      </p>
    </div>
  );
}

function Tile({ bg, label, icon, onClick }: {
  bg: string; label: string; icon: React.ReactNode; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 rounded-2xl px-4 h-14 active:scale-[0.98] transition-transform"
      style={{ background: bg }}
    >
      <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <span className="text-[14px] font-semibold text-spal-navy" style={{ fontFamily: "var(--font-satoshi)" }}>
        {label}
      </span>
    </button>
  );
}

function PulseEmpty({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="py-2">
      <p className="text-[14px] leading-relaxed" style={{ fontFamily: "var(--font-satoshi)", color: TEAL, opacity: 0.6 }}>
        Nothing recorded yet today.
      </p>
      <button
        onClick={onAdd}
        className="mt-3 font-semibold text-[14px]"
        style={{ fontFamily: "var(--font-satoshi)", color: "#16A34A" }}
      >
        Record your first sale
      </button>
    </div>
  );
}

function PulseSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-11 rounded-xl w-44" style={{ background: "rgba(32,73,72,0.08)" }} />
      <div className="flex gap-3">
        <div className="h-16 flex-1 rounded-2xl" style={{ background: "rgba(32,73,72,0.06)" }} />
        <div className="h-16 flex-1 rounded-2xl" style={{ background: "rgba(32,73,72,0.06)" }} />
      </div>
    </div>
  );
}

function RecordsSkeleton() {
  return (
    <div className="space-y-2.5">
      {[1, 2, 3].map(i => (
        <div key={i} className="flex items-center gap-3 bg-white rounded-2xl px-3.5 py-3 animate-pulse">
          <div className="w-10 h-10 rounded-full bg-neutral-100" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 bg-neutral-100 rounded w-32" />
            <div className="h-2.5 bg-neutral-100 rounded w-16" />
          </div>
          <div className="h-3 bg-neutral-100 rounded w-16" />
        </div>
      ))}
    </div>
  );
}
