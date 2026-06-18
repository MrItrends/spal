"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { useSPALStore } from "@/store";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { formatCurrency } from "@/lib/utils/currency";
import { getGreeting } from "@/lib/utils/dates";
import { AddRecordSheet } from "@/components/records/AddRecordSheet";
import { SwipeableRow } from "@/components/records/SwipeableRow";
import { UndoToast } from "@/components/ui/UndoToast";
import type { BusinessRecord, DailySummary } from "@/lib/types";
import {
  Notification03Icon,
  User02Icon,
  ArrowUp01Icon,
  ArrowDown01Icon,
  MinusSignIcon,
  ChartIncreaseIcon,
  Home01Icon,
  Menu01Icon,
  BarChartIcon,
} from "hugeicons-react";
import Link from "next/link";

const BG = "#EEF3E9";

function HomePageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, addSheetOpen, setAddSheet, recordSavedAt, activeBusiness, setActiveBusiness, setBusinesses } = useSPALStore();
  usePushNotifications(user?.id);
  const greeting = getGreeting();
  const displayName = user?.full_name ?? user?.business_name ?? "there";

  const [unreadCount,   setUnreadCount]   = useState(0);
  const [newBizToast,   setNewBizToast]   = useState<string | null>(null);

  useEffect(() => {
    const nb = params.get("newBusiness");
    if (nb) {
      setNewBizToast(nb);
      setTimeout(() => setNewBizToast(null), 3000);
      router.replace("/home");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetch("/api/notifications")
      .then(r => r.json())
      .then(d => {
        if (d.success) setUnreadCount((d.data as Array<{ read_at: string | null }>).filter(n => !n.read_at).length);
      })
      .catch(() => {});
  }, []);

  const [summary,          setSummary]          = useState<DailySummary | null>(null);
  const [yesterdaySummary, setYesterdaySummary] = useState<DailySummary | null>(null);
  const [records,          setRecords]          = useState<BusinessRecord[]>([]);
  const [loadingSummary,   setLoadingSummary]   = useState(true);
  const [loadingRecords,   setLoadingRecords]   = useState(true);
  const [editRecord,       setEditRecord]       = useState<BusinessRecord | null>(null);
  const [undoState,        setUndoState]        = useState<{ id: string; record: BusinessRecord } | null>(null);
  const pendingIdRef = useRef<string | null>(null);

  // Bootstrap businesses on mount
  useEffect(() => {
    if (!user) return;
    fetch("/api/businesses")
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data?.length) {
          setBusinesses(d.data);
          const active = d.data.find((b: { id: string }) => b.id === user.active_business_id) ?? d.data[0];
          if (active && (!activeBusiness || activeBusiness.id !== active.id)) {
            setActiveBusiness(active);
          }
        }
      })
      .catch(() => {});
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchData = useCallback(async () => {
    // Today
    try {
      const res  = await fetch("/api/ai/daily-insight");
      const data = await res.json();
      if (data.success) setSummary(data.data);
    } catch { /* silent */ } finally { setLoadingSummary(false); }

    // Yesterday (for % comparison)
    try {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const res  = await fetch(`/api/ai/daily-insight?date=${y.toISOString().slice(0, 10)}`);
      const data = await res.json();
      if (data.success) setYesterdaySummary(data.data);
    } catch { /* silent */ }

    // Recent records
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

  function scheduleDelete(record: BusinessRecord) {
    if (pendingIdRef.current) {
      const prev = pendingIdRef.current;
      pendingIdRef.current = null;
      fetch(`/api/records?id=${prev}`, { method: "DELETE" });
    }
    pendingIdRef.current = record.id;
    setRecords(prev => prev.filter(r => r.id !== record.id));
    setUndoState({ id: record.id, record });
  }

  function handleUndo() {
    if (!undoState) return;
    pendingIdRef.current = null;
    setUndoState(null);
    setRecords(prev =>
      [...prev, undoState.record]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 6)
    );
  }

  function handleExpire() {
    const id = pendingIdRef.current;
    pendingIdRef.current = null;
    setUndoState(null);
    if (id) fetch(`/api/records?id=${id}`, { method: "DELETE" });
  }

  const todayProfit   = summary?.profit         ?? 0;
  const todaySales    = summary?.total_sales    ?? 0;
  const todayExpenses = summary?.total_expenses ?? 0;
  const yProfit   = yesterdaySummary?.profit         ?? 0;
  const ySales    = yesterdaySummary?.total_sales    ?? 0;
  const yExpenses = yesterdaySummary?.total_expenses ?? 0;

  function pct(today: number, yesterday: number): number | null {
    if (yesterday === 0) return null;
    return Math.round(((today - yesterday) / Math.abs(yesterday)) * 100);
  }

  const profitPct  = pct(todayProfit,   yProfit);
  const salesPct   = pct(todaySales,    ySales);
  const expensePct = pct(todayExpenses, yExpenses);

  return (
    <>
      <div className="min-h-full" style={{ background: BG }}>

        {/* ── Header ── */}
        <div className="px-5 pt-12 flex items-center justify-between">
          <div>
            <p className="text-[13px] text-neutral-400" style={{ fontFamily: "var(--font-satoshi)" }}>
              {greeting}
            </p>
            <h1 className="text-[24px] font-bold text-spal-navy leading-tight mt-0.5" style={{ fontFamily: "var(--font-satoshi)" }}>
              {displayName}
            </h1>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => { setUnreadCount(0); router.push("/notifications"); }}
              aria-label="Notifications"
              className="w-11 h-11 rounded-full bg-white flex items-center justify-center relative active:scale-95 transition-transform"
              style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}
            >
              <Notification03Icon size={18} color="#0F172A" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-[9px] font-bold text-white leading-none">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => router.push("/profile")}
              aria-label="Profile"
              className="w-11 h-11 rounded-full overflow-hidden active:scale-95 transition-transform"
              style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}
            >
              {user?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-spal-green flex items-center justify-center">
                  <span className="text-white font-bold text-[15px]">
                    {(user?.full_name ?? user?.business_name ?? "?")[0]?.toUpperCase() ?? <User02Icon size={18} color="#fff" />}
                  </span>
                </div>
              )}
            </button>
          </div>
        </div>

        {/* ── Top nav pills ── */}
        <div className="px-5 mt-5 flex gap-2">
          {[
            { href: "/home",     label: "Home",     icon: <Home01Icon    size={14} /> },
            { href: "/records",  label: "Records",  icon: <Menu01Icon    size={14} /> },
            { href: "/insights", label: "Insights", icon: <BarChartIcon  size={14} /> },
          ].map(tab => {
            const isActive = tab.href === "/home";
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex flex-1 items-center justify-center gap-1.5 px-4 h-10 rounded-full text-[13px] font-semibold transition-all active:scale-95"
                style={{
                  background: isActive ? "#22C55E" : "#fff",
                  color:      isActive ? "#fff" : "#6B7280",
                  boxShadow:  isActive ? "0 2px 8px rgba(34,197,94,0.28)" : "0 1px 3px rgba(0,0,0,0.06)",
                  fontFamily: "var(--font-satoshi)",
                }}
              >
                {tab.icon}
                {tab.label}
              </Link>
            );
          })}
        </div>

        {/* ── Your Sales Today ── */}
        <div className="px-5 mt-7">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[16px] font-bold text-spal-navy" style={{ fontFamily: "var(--font-satoshi)" }}>
              Your Sales Today
            </p>
          </div>

          {/* Profit card */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[20px] px-5 py-5 mb-2.5"
            style={{ background: "#8B3CFF" }}
          >
            {loadingSummary ? (
              <CardSkeleton />
            ) : (
              <>
                <div className="flex items-center justify-between mb-5">
                  <p className="text-white/70 text-[13px] font-medium" style={{ fontFamily: "var(--font-satoshi)" }}>
                    Profit
                  </p>
                  <PctBadge pct={profitPct} />
                </div>
                <p
                  className="text-white font-bold"
                  style={{ fontFamily: "var(--font-satoshi)", fontSize: "clamp(32px, 9vw, 42px)", letterSpacing: "-0.02em" }}
                >
                  {todayProfit < 0 ? "-" : ""}{formatCurrency(Math.abs(todayProfit))}
                </p>
              </>
            )}
          </motion.div>

          {/* Sale + Expense row */}
          <div className="grid grid-cols-2 gap-2.5 min-w-0">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06 }}
              className="rounded-[20px] px-4 py-4 min-w-0"
              style={{ background: "#2F63F5" }}
            >
              {loadingSummary ? (
                <SmallCardSkeleton />
              ) : (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-white/70 text-[12px] font-medium" style={{ fontFamily: "var(--font-satoshi)" }}>
                      Sale
                    </p>
                    <PctBadge pct={salesPct} small />
                  </div>
                  <p className="text-white font-bold truncate" style={{ fontFamily: "var(--font-satoshi)", fontSize: "clamp(16px, 5.5vw, 22px)", letterSpacing: "-0.01em" }}>
                    {formatCurrency(todaySales)}
                  </p>
                </>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-[20px] px-4 py-4 min-w-0"
              style={{ background: "#ED712E" }}
            >
              {loadingSummary ? (
                <SmallCardSkeleton />
              ) : (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-white/70 text-[12px] font-medium" style={{ fontFamily: "var(--font-satoshi)" }}>
                      Expense
                    </p>
                    <PctBadge pct={expensePct} small />
                  </div>
                  <p className="text-white font-bold truncate" style={{ fontFamily: "var(--font-satoshi)", fontSize: "clamp(16px, 5.5vw, 22px)", letterSpacing: "-0.01em" }}>
                    {formatCurrency(todayExpenses)}
                  </p>
                </>
              )}
            </motion.div>
          </div>
        </div>

        {/* ── Recent Sales ── */}
        <div className="px-5 mt-7 pb-32">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[16px] font-bold text-spal-navy" style={{ fontFamily: "var(--font-satoshi)" }}>
              Recent Sales
            </p>
            {records.length > 0 && (
              <button
                onClick={() => router.push("/records")}
                className="text-[12px] font-semibold text-neutral-400"
                style={{ fontFamily: "var(--font-satoshi)" }}
              >
                View all
              </button>
            )}
          </div>

          {loadingRecords ? (
            <RecordsSkeleton />
          ) : records.length === 0 ? (
            <div
              className="bg-white rounded-2xl px-4 py-10 text-center"
              style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
            >
              <ChartIncreaseIcon size={24} className="mx-auto mb-3 text-neutral-200" />
              <p className="text-[13px] text-neutral-400" style={{ fontFamily: "var(--font-satoshi)" }}>
                No activity yet today.
              </p>
              <button
                onClick={() => router.push("/records/add-sale")}
                className="mt-2 text-[13px] font-semibold"
                style={{ color: "#22C55E", fontFamily: "var(--font-satoshi)" }}
              >
                Record your first sale
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {records.map((record, i) => (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03, ease: [0.4, 0, 0.2, 1] }}
                  className="rounded-2xl overflow-hidden bg-white"
                  style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
                >
                  <SwipeableRow
                    onEdit={() => { setEditRecord(record); setAddSheet(null); }}
                    onDelete={() => scheduleDelete(record)}
                  >
                    <div
                      className="flex items-center gap-3 px-3.5 py-3"
                      onClick={() => { setEditRecord(record); setAddSheet(null); }}
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: record.type === "sale" ? "#F0FDF4" : "#FFF5ED" }}
                      >
                        {record.type === "sale"
                          ? <ArrowUp01Icon   size={16} color="#16A34A" />
                          : <ArrowDown01Icon size={16} color="#EA580C" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13.5px] font-semibold text-spal-navy truncate" style={{ fontFamily: "var(--font-satoshi)" }}>
                          {record.description ?? record.category ?? (record.type === "sale" ? "Sale" : "Expense")}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {record.category && (
                            <span
                              className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                              style={{
                                background: record.type === "sale" ? "#F0FDF4" : "#FFF7ED",
                                color:      record.type === "sale" ? "#16A34A" : "#EA580C",
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
                    </div>
                  </SwipeableRow>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>


      {/* ── Sheets ── */}
      <AddRecordSheet type="sale"    open={addSheetOpen === "sale"}    onClose={() => setAddSheet(null)} onSuccess={handleRecordAdded} />
      <AddRecordSheet type="expense" open={addSheetOpen === "expense"} onClose={() => setAddSheet(null)} onSuccess={handleRecordAdded} />
      <AddRecordSheet
        type={editRecord?.type ?? "sale"}
        open={!!editRecord}
        record={editRecord}
        onClose={handleEditClose}
        onSuccess={() => { handleRecordAdded(); handleEditClose(); }}
      />

      <AnimatePresence>
        {undoState && (
          <UndoToast key={undoState.id} message="Record deleted" onUndo={handleUndo} onExpire={handleExpire} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {newBizToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[70] px-5 py-3 rounded-2xl shadow-lg"
            style={{ background: "#22C55E" }}
          >
            <p className="text-white text-[13px] font-semibold whitespace-nowrap">
              Welcome to {newBizToast}! 🎉
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default function HomePage() {
  return (
    <Suspense>
      <HomePageInner />
    </Suspense>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatRecordTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit", hour12: true });
}

// ── Sub-components ──────────────────────────────────────────────────────────

function PctBadge({ pct, small }: { pct: number | null; small?: boolean }) {
  const noData = pct === null;
  const isUp   = !noData && pct >= 0;
  return (
    <div
      className="flex items-center gap-0.5 rounded-full font-bold"
      style={{
        padding:    small ? "3px 7px" : "4px 9px",
        fontSize:   small ? "10px" : "11px",
        background: noData ? "rgba(255,255,255,0.16)" : isUp ? "rgba(255,255,255,0.22)" : "rgba(255,80,80,0.28)",
        color:      noData ? "rgba(255,255,255,0.75)" : isUp ? "#fff" : "#FFBBBB",
      }}
    >
      {noData
        ? <MinusSignIcon   size={small ? 10 : 11} />
        : isUp
          ? <ArrowUp01Icon   size={small ? 10 : 11} />
          : <ArrowDown01Icon size={small ? 10 : 11} />}
      {noData ? 0 : Math.min(100, Math.abs(pct))}%
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-4 w-16 rounded-full bg-white/20" />
      <div className="h-10 w-36 rounded-xl bg-white/20" />
    </div>
  );
}

function SmallCardSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-3 w-10 rounded-full bg-white/20" />
      <div className="h-7 w-20 rounded-lg bg-white/20" />
    </div>
  );
}

function RecordsSkeleton() {
  return (
    <div className="space-y-2.5">
      {[1, 2, 3].map(i => (
        <div key={i} className="flex items-center gap-3 bg-white rounded-2xl px-3.5 py-3 animate-pulse">
          <div className="w-10 h-10 rounded-full bg-neutral-100 flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 bg-neutral-100 rounded w-32" />
            <div className="h-2.5 bg-neutral-100 rounded w-16" />
          </div>
          <div className="h-3 bg-neutral-100 rounded w-14" />
        </div>
      ))}
    </div>
  );
}
