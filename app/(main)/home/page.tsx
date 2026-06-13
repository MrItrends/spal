"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useSPALStore } from "@/store";
import { formatCurrency } from "@/lib/utils/currency";
import { getGreeting } from "@/lib/utils/dates";
import { AddRecordSheet } from "@/components/records/AddRecordSheet";
import { HomeCoachmarks } from "@/components/shared/HomeCoachmarks";
import type { BusinessRecord, DailySummary } from "@/lib/types";
import {
  TrendingUp, TrendingDown, User, Bell,
  ArrowUp, ArrowDown, ChevronRight, ScanLine, FolderInput, Package,
} from "lucide-react";

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
      {/* Coachmarks — shown once to first-time users */}
      <HomeCoachmarks />
      <div className="relative min-h-full" style={{ background: "#F8F7F4" }}>

        {/* Home-only background — single radial gradient, OKLAB interpolation, no overlay banding */}
        <div
          className="absolute top-0 left-0 right-0 pointer-events-none"
          style={{
            height: "380px",
            background:
              "radial-gradient(140% 95% at 22% -8% in oklab, " +
                "#22C55E 0%, " +
                "#2A6DB8 38%, " +
                "#2F63F5 58%, " +
                "#F8F7F4 96%" +
              ")",
            // Tiny blur kills any residual hardware-level banding without visible softness
            filter: "blur(0.4px)",
          }}
        />

        {/* Foreground content */}
        <div className="relative px-5 pt-7 space-y-5 animate-fade-in">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="flex items-center justify-between"
        >
          <div>
            <p className="text-white/85 text-[13px] font-medium" style={{ fontFamily: "var(--font-satoshi)", textShadow: "0 1px 3px rgba(0,0,0,0.10)" }}>
              {greeting}
            </p>
            <h1 className="text-white text-[22px] font-bold mt-0.5" style={{ fontFamily: "var(--font-satoshi)", textShadow: "0 1px 6px rgba(0,0,0,0.18)" }}>
              {name}
            </h1>
          </div>

          <div className="flex items-center gap-2.5">
            <CircleButton onClick={() => router.push("/notifications")} aria="Notifications">
              <Bell size={18} strokeWidth={2} color="#fff" />
            </CircleButton>
            <button
              onClick={() => router.push("/profile")}
              aria-label="Profile"
              className="w-[42px] h-[42px] rounded-full flex items-center justify-center overflow-hidden active:scale-95 transition-transform backdrop-blur-md"
              style={{
                background: "rgba(255,255,255,0.20)",
                border: "1px solid rgba(255,255,255,0.30)",
              }}
            >
              {user?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={18} strokeWidth={2} color="#fff" />
              )}
            </button>
          </div>
        </motion.div>

        {/* ── Today's Snapshot section header ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06, duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="flex items-center justify-between"
        >
          <div>
            <p className="text-[15px] font-bold text-white" style={{ fontFamily: "var(--font-satoshi)" }}>
              Today&apos;s Snapshot
            </p>
            <p className="text-[12px] text-white/60 mt-0.5" style={{ fontFamily: "var(--font-satoshi)" }}>
              {new Date().toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "short" })}
            </p>
          </div>
          <button
            onClick={() => router.push("/insights")}
            className="flex items-center gap-1 text-white/80 text-[13px] font-semibold active:opacity-60 transition-opacity"
            style={{ fontFamily: "var(--font-satoshi)" }}
          >
            View Details <ChevronRight size={14} strokeWidth={2.2} />
          </button>
        </motion.div>

        {/* ── Hero summary card ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        >
          <div
            className="relative rounded-[24px] overflow-hidden"
            style={{ background: "#F3EFE4" }}
          >
            {/* Glow circles clipped to card top */}
            <div className="absolute pointer-events-none"
              style={{ top: "-120px", left: "-100px", width: "280px", height: "280px", borderRadius: "50%", background: "#02D169", filter: "blur(70px)", opacity: 0.85 }} />
            <div className="absolute pointer-events-none"
              style={{ top: "-120px", right: "-100px", width: "280px", height: "280px", borderRadius: "50%", background: "#2E63F9", filter: "blur(70px)", opacity: 0.8 }} />

            {/* Coloured glow band at top — 28px */}
            <div className="relative h-7" />

            {/* Dark inner card */}
            <div
              className="relative rounded-[20px] p-5"
              style={{ background: "#0F172A", margin: "0 8px 8px 8px" }}
            >
              {loadingSummary ? (
                <PulseSkeleton />
              ) : summary ? (
                <>
                  <p className="text-[12px] font-medium mb-1" style={{ fontFamily: "var(--font-satoshi)", color: "#A1A3AE" }}>
                    Today&apos;s Record
                  </p>
                  <p className="text-[13px] font-semibold mb-2" style={{ fontFamily: "var(--font-satoshi)", color: "#67738F" }}>
                    {isProfit ? "Profit" : "Net Loss"}
                  </p>

                  {/* Big number */}
                  <p
                    className="font-bold leading-none"
                    style={{
                      fontFamily: "var(--font-satoshi)",
                      fontSize: "clamp(34px, 10vw, 42px)",
                      letterSpacing: "-0.02em",
                      color: "#ffffff",
                    }}
                  >
                    {formatCurrency(Math.abs(profit))}
                  </p>

                  <div className="h-px my-4" style={{ background: "#384666" }} />

                  <div className="flex items-stretch">
                    <div className="flex-1">
                      <p className="text-[12px] mb-1.5" style={{ fontFamily: "var(--font-satoshi)", color: "#67738F" }}>Sales</p>
                      <p className="text-[18px] font-bold" style={{ fontFamily: "var(--font-satoshi)", color: "#22C55E" }}>
                        {formatCurrency(summary.total_sales ?? 0)}
                      </p>
                    </div>
                    <div className="w-px mx-4" style={{ background: "#384666" }} />
                    <div className="flex-1">
                      <p className="text-[12px] mb-1.5" style={{ fontFamily: "var(--font-satoshi)", color: "#67738F" }}>Expenses</p>
                      <p className="text-[18px] font-bold" style={{ fontFamily: "var(--font-satoshi)", color: "#ED712E" }}>
                        {formatCurrency(summary.total_expenses ?? 0)}
                      </p>
                    </div>
                  </div>

                  {summary.ai_message && (
                    <p className="mt-4 pt-4 text-[12.5px] leading-relaxed text-white/55" style={{ fontFamily: "var(--font-satoshi)", borderTop: "1px solid #384666" }}>
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

        {/* ── Quick Actions ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        >
          <p className="text-[15px] font-bold text-spal-navy mb-3" style={{ fontFamily: "var(--font-satoshi)" }}>
            Quick Actions
          </p>

          {/* Row 1 — 3 tiles */}
          <div className="grid grid-cols-3 gap-2.5 mb-2.5">
            <Tile3
              bg="#22C55E"
              label="Add Sale"
              icon={<TrendingUp size={20} strokeWidth={2} color="#fff" />}
              labelColor="#fff"
              onClick={() => setAddSheet("sale")}
            />
            <Tile3
              bg="#F97316"
              label="Add Expense"
              icon={<TrendingDown size={20} strokeWidth={2} color="#fff" />}
              labelColor="#fff"
              onClick={() => setAddSheet("expense")}
            />
            <Tile3
              bg="#fff"
              label="Scan to Upload"
              icon={<ScanLine size={20} strokeWidth={2} color="#0F172A" />}
              labelColor="#0F172A"
              onClick={() => router.push("/scan")}
            />
          </div>

          {/* Row 2 — 2 tiles */}
          <div className="grid grid-cols-2 gap-2.5">
            <Tile2
              bg="#fff"
              label="Import Record"
              icon={<FolderInput size={20} strokeWidth={2} color="#0F172A" />}
              onClick={() => router.push("/records/import")}
            />
            <Tile2
              bg="#fff"
              label="Manage Inventory"
              icon={<Package size={20} strokeWidth={2} color="#0F172A" />}
              onClick={() => router.push("/inventory")}
            />
          </div>
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
            {records.length > 0 && (
              <button onClick={() => router.push("/records")} className="text-[12px] font-semibold" style={{ color: TEAL }}>
                View all
              </button>
            )}
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
      className="w-[42px] h-[42px] rounded-full flex items-center justify-center active:scale-95 transition-transform backdrop-blur-md"
      style={{
        background: "rgba(255,255,255,0.20)",
        border: "1px solid rgba(255,255,255,0.30)",
      }}
    >
      {children}
    </button>
  );
}

function Tile3({ bg, label, icon, labelColor, onClick }: {
  bg: string; label: string; icon: React.ReactNode; labelColor: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-1.5 rounded-2xl py-4 active:scale-[0.97] transition-transform"
      style={{ background: bg, boxShadow: bg === "#fff" ? "0 1px 4px rgba(0,0,0,0.06)" : undefined, minHeight: "76px" }}
    >
      {icon}
      <span className="text-[11px] font-semibold text-center leading-tight px-1" style={{ fontFamily: "var(--font-satoshi)", color: labelColor }}>
        {label}
      </span>
    </button>
  );
}

function Tile2({ bg, label, icon, onClick }: {
  bg: string; label: string; icon: React.ReactNode; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-1.5 rounded-2xl py-4 active:scale-[0.97] transition-transform"
      style={{ background: bg, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", minHeight: "76px" }}
    >
      {icon}
      <span className="text-[11px] font-semibold text-spal-navy text-center leading-tight px-1" style={{ fontFamily: "var(--font-satoshi)" }}>
        {label}
      </span>
    </button>
  );
}

function PulseEmpty({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="py-2">
      <p className="text-[14px] leading-relaxed text-white/45" style={{ fontFamily: "var(--font-satoshi)" }}>
        Nothing recorded yet today.
      </p>
      <button
        onClick={onAdd}
        className="mt-3 font-semibold text-[14px] text-spal-green"
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
      <div className="h-11 rounded-xl w-44 bg-white/10" />
      <div className="h-px bg-white/10" />
      <div className="flex gap-4">
        <div className="h-12 flex-1 rounded-xl bg-white/8" />
        <div className="h-12 flex-1 rounded-xl bg-white/8" />
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
