"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils/currency";
import { formatTime } from "@/lib/utils/dates";
import { getGreeting } from "@/lib/utils/dates";
import { useSPALStore } from "@/store";
import { AddRecordSheet } from "@/components/records/AddRecordSheet";
import { SwipeableRow } from "@/components/records/SwipeableRow";
import { ExportSheet } from "@/components/records/ExportSheet";
import { UndoToast } from "@/components/ui/UndoToast";
import {
  Notification03Icon, User02Icon, Home01Icon, Menu01Icon, BarChartIcon,
  ArrowDown01Icon, ChartIncreaseIcon, ChartDecreaseIcon,
  Wallet01Icon, ArrowUp01Icon, Cancel01Icon, Tick01Icon,
} from "hugeicons-react";
import type { BusinessRecord } from "@/lib/types";

// Avoid using strokeWidth — hugeicons doesn't support it
const BG = "#EEF3E9";

type Filter   = "all" | "sale" | "expense" | "owing";

function dateLabel(recordDate: string): string {
  const today = new Date().toISOString().split("T")[0];
  const yest  = new Date(); yest.setDate(yest.getDate() - 1);
  const yesterday = yest.toISOString().split("T")[0];
  if (recordDate === today)     return "Today";
  if (recordDate === yesterday) return "Yesterday";
  const [y, m, d] = recordDate.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "short" });
}

interface UndoState { ids: string[]; records: BusinessRecord[]; label: string; }

// Category → color + icon
const CAT_PALETTE: Record<string, { bg: string; color: string }> = {
  Food:         { bg: "#FFF0E6", color: "#F97316" },
  Drinks:       { bg: "#E6F4FF", color: "#2563EB" },
  Breakfast:    { bg: "#E6FAF0", color: "#16A34A" },
  Lunch:        { bg: "#FFF7E6", color: "#D97706" },
  Dinner:       { bg: "#F3E8FF", color: "#9333EA" },
  Snacks:       { bg: "#FEE2E2", color: "#DC2626" },
  Desserts:     { bg: "#FDF4FF", color: "#C026D3" },
  Groceries:    { bg: "#ECFDF5", color: "#059669" },
  Transport:    { bg: "#EFF6FF", color: "#3B82F6" },
  Utilities:    { bg: "#F5F3FF", color: "#7C3AED" },
  Salary:       { bg: "#F0FDF4", color: "#22C55E" },
  Rent:         { bg: "#FFF1F2", color: "#E11D48" },
  Marketing:    { bg: "#FFF7ED", color: "#EA580C" },
  Services:     { bg: "#EFF6FF", color: "#2563EB" },
};

function catStyle(cat: string | null): { bg: string; color: string } {
  if (cat && CAT_PALETTE[cat]) return CAT_PALETTE[cat];
  return { bg: "#F4F4F5", color: "#71717A" };
}

function RecordIcon({ record }: { record: BusinessRecord }) {
  const { bg, color } = catStyle(record.category ?? null);
  const isSale = record.type === "sale";
  return (
    <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
      {isSale
        ? <ChartIncreaseIcon size={20} color={color} />
        : <ChartDecreaseIcon size={20} color={color} />}
    </div>
  );
}

export default function RecordsPage() {
  const router   = useRouter();
  const { user, addSheetOpen, setAddSheet, recordSavedAt, bumpRecordSaved } = useSPALStore();
  const greeting = getGreeting();
  const displayName = user?.full_name ?? user?.business_name ?? "there";

  const [filter,       setFilter]       = useState<Filter>("all");
  const [catFilter,    setCatFilter]    = useState<string[]>([]);
  const [records,      setRecords]      = useState<BusinessRecord[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [editRecord,   setEditRecord]   = useState<BusinessRecord | null>(null);
  const [exportOpen,   setExportOpen]   = useState(false);
  const [typeOpen,     setTypeOpen]     = useState(false);
  const [catOpen,      setCatOpen]      = useState(false);
  const [unreadCount,  setUnreadCount]  = useState(0);

  const [undoState,    setUndoState]    = useState<UndoState | null>(null);
  const pendingIdsRef  = useRef<string[]>([]);

  const [selectMode,   setSelectMode]   = useState(false);
  const [selectedIds,  setSelectedIds]  = useState<Set<string>>(new Set());

  const typeRef = useRef<HTMLDivElement>(null);
  const catRef  = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (typeRef.current && !typeRef.current.contains(e.target as Node)) setTypeOpen(false);
      if (catRef.current  && !catRef.current.contains(e.target as Node))  setCatOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    fetch("/api/notifications")
      .then(r => r.json())
      .then(d => { if (d.success) setUnreadCount((d.data as Array<{ read_at: string | null }>).filter(n => !n.read_at).length); })
      .catch(() => {});
  }, []);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/records?limit=200");
      const data = await res.json();
      if (data.success) setRecords(data.data);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (recordSavedAt) fetchRecords(); }, [recordSavedAt]);

  // Mark an owing sale as paid — counts as a sale/profit on the payment day (today)
  async function markPaid(record: BusinessRecord) {
    const today = new Date().toISOString().slice(0, 10);
    setRecords(prev => prev.map(r => r.id === record.id ? { ...r, payment_status: "paid", record_date: today } : r));
    await fetch("/api/records", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: record.id, payment_status: "paid", record_date: today }),
    });
    bumpRecordSaved(); // refresh home/insights summaries
  }

  const flushPending = useCallback(async () => {
    const ids = pendingIdsRef.current;
    if (!ids.length) return;
    pendingIdsRef.current = [];
    setUndoState(null);
    await Promise.all(ids.map(id => fetch(`/api/records?id=${id}`, { method: "DELETE" })));
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => () => { flushPending(); }, []);

  function scheduleDelete(toDelete: BusinessRecord[]) {
    if (!toDelete.length) return;
    if (pendingIdsRef.current.length) {
      const prev = pendingIdsRef.current;
      pendingIdsRef.current = [];
      Promise.all(prev.map(id => fetch(`/api/records?id=${id}`, { method: "DELETE" })));
    }
    const ids = toDelete.map(r => r.id);
    pendingIdsRef.current = ids;
    setRecords(prev => prev.filter(r => !ids.includes(r.id)));
    setUndoState({ ids, records: toDelete, label: toDelete.length === 1 ? "Record deleted" : `${toDelete.length} records deleted` });
  }

  function handleUndo() {
    if (!undoState) return;
    pendingIdsRef.current = [];
    setUndoState(null);
    setRecords(prev => [...prev, ...undoState.records].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
  }

  function handleExpire() {
    const ids = pendingIdsRef.current;
    pendingIdsRef.current = [];
    setUndoState(null);
    Promise.all(ids.map(id => fetch(`/api/records?id=${id}`, { method: "DELETE" })));
  }

  function exitSelectMode() { setSelectMode(false); setSelectedIds(new Set()); }
  function toggleSelect(id: string) {
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  // Derive all categories present
  const allCategories = [...new Set(records.map(r => r.category).filter(Boolean))] as string[];

  const filtered = records.filter(r => {
    const typeOk = filter === "all" ? true : filter === "owing" ? r.payment_status === "owing" : r.type === filter;
    const catOk  = catFilter.length === 0 || (r.category && catFilter.includes(r.category));
    return typeOk && catOk;
  });

  const grouped = filtered.reduce<Record<string, BusinessRecord[]>>((acc, r) => {
    const label = dateLabel(r.record_date);
    (acc[label] ??= []).push(r);
    return acc;
  }, {});

  const FILTER_OPTIONS: { key: Filter; label: string; icon: React.ReactNode }[] = [
    { key: "all",     label: "All",      icon: <ChartIncreaseIcon size={18} color="#6B7280" /> },
    { key: "sale",    label: "Sales",    icon: <ArrowUp01Icon     size={18} color="#22C55E" /> },
    { key: "expense", label: "Expenses", icon: <ArrowDown01Icon   size={18} color="#F97316" /> },
    { key: "owing",   label: "Owing",    icon: <Wallet01Icon      size={18} color="#EA580C" /> },
  ];

  const activeFilterLabel = FILTER_OPTIONS.find(o => o.key === filter)?.label ?? "All";

  return (
    <>
      <div className="min-h-full" style={{ background: BG }}>

        {/* ── Header ── */}
        <div className="px-5 pt-12 flex items-center justify-between">
          <div>
            <p className="text-[13px] text-neutral-400" style={{ fontFamily: "var(--font-satoshi)" }}>{greeting}</p>
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
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-[9px] font-bold text-white">
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
            { href: "/home",     label: "Home",     icon: <Home01Icon   size={14} /> },
            { href: "/records",  label: "Records",  icon: <Menu01Icon   size={14} /> },
            { href: "/insights", label: "Insights", icon: <BarChartIcon size={14} /> },
          ].map(tab => {
            const isActive = tab.href === "/records";
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

        {/* ── Filter row ── */}
        <div className="px-5 mt-5 flex items-center gap-2.5">

          {/* Type dropdown */}
          <div className="relative" ref={typeRef}>
            <button
              onClick={() => { setTypeOpen(o => !o); setCatOpen(false); }}
              className="flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-white text-[13px] font-semibold text-spal-navy active:scale-95 transition-transform"
              style={{ fontFamily: "var(--font-satoshi)", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
            >
              {activeFilterLabel}
              <ArrowDown01Icon size={13} color="#6B7280" />
            </button>

            <AnimatePresence>
              {typeOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.97 }}
                  transition={{ duration: 0.14, ease: [0.4, 0, 0.2, 1] }}
                  className="absolute top-[44px] left-0 bg-white rounded-2xl overflow-hidden z-30"
                  style={{ boxShadow: "0 8px 28px rgba(0,0,0,0.12)", minWidth: "160px", border: "1px solid rgba(34,197,94,0.2)" }}
                >
                  {FILTER_OPTIONS.map(opt => (
                    <button
                      key={opt.key}
                      onClick={() => { setFilter(opt.key); setTypeOpen(false); exitSelectMode(); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left active:bg-neutral-50 transition-colors"
                    >
                      <span className="flex-shrink-0">{opt.icon}</span>
                      <span
                        className="text-[14px] font-semibold text-spal-navy"
                        style={{ fontFamily: "var(--font-satoshi)" }}
                      >
                        {opt.label}
                      </span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Category dropdown — only show if there are categories */}
          {allCategories.length > 0 && (
            <div className="flex items-center" ref={catRef}>
              <div className="relative">
                <button
                  onClick={() => { setCatOpen(o => !o); setTypeOpen(false); }}
                  className="flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-white text-[13px] font-semibold text-spal-navy active:scale-95 transition-transform"
                  style={{ fontFamily: "var(--font-satoshi)", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
                >
                  Category
                  <ArrowDown01Icon size={13} color="#6B7280" />
                </button>

              <AnimatePresence>
                {catOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.97 }}
                    transition={{ duration: 0.14, ease: [0.4, 0, 0.2, 1] }}
                    className="absolute top-[44px] left-0 bg-white rounded-2xl overflow-hidden z-30"
                    style={{ boxShadow: "0 8px 28px rgba(0,0,0,0.12)", minWidth: "200px", border: "1px solid rgba(34,197,94,0.2)" }}
                  >
                    {allCategories.map(cat => {
                      const { bg, color } = catStyle(cat);
                      const selected = catFilter.includes(cat);
                      return (
                        <button
                          key={cat}
                          onClick={() => {
                            setCatFilter(prev => selected ? prev.filter(x => x !== cat) : [...prev, cat]);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left active:bg-neutral-50 transition-colors"
                        >
                          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
                            <ChartIncreaseIcon size={16} color={color} />
                          </div>
                          <span className="flex-1 text-[14px] font-semibold text-spal-navy" style={{ fontFamily: "var(--font-satoshi)" }}>
                            {cat}
                          </span>
                          {selected && (
                            <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: "#22C55E" }}>
                              <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
                                <path d="M4 8l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
              </div>
            </div>
          )}
        </div>

        {/* ── Selected category chips (below the dropdowns) ── */}
        {catFilter.length > 0 && (
          <div className="px-5 mt-3 flex items-center gap-1.5 flex-wrap">
            {catFilter.map(c => (
              <button
                key={c}
                onClick={() => setCatFilter(prev => prev.filter(x => x !== c))}
                className="flex items-center gap-1 h-9 px-3 rounded-full text-[12px] font-semibold active:scale-95 transition-transform"
                style={{ background: catStyle(c).bg, color: catStyle(c).color, fontFamily: "var(--font-satoshi)" }}
              >
                {c}
                <Cancel01Icon size={11} className="ml-0.5 opacity-60" />
              </button>
            ))}
          </div>
        )}

        {/* ── Owing banner ── */}
        {(() => {
          const owingRecords = records.filter(r => r.payment_status === "owing");
          const owingTotal   = owingRecords.reduce((s, r) => s + r.amount, 0);
          if (owingRecords.length === 0 || filter === "owing") return null;
          const names = [...new Set(owingRecords.map(r => r.customer_name).filter(Boolean))];
          const subtitle = names.length > 0
            ? `${names.slice(0, 2).join(", ")}${names.length > 2 ? ` +${names.length - 2} more` : ""} hasn't paid yet`
            : `${owingRecords.length} sale${owingRecords.length > 1 ? "s" : ""} not yet paid`;
          return (
            <button
              onClick={() => setFilter("owing")}
              className="mx-5 mt-4 w-[calc(100%-40px)] rounded-2xl px-4 py-3 flex items-center justify-between active:opacity-80 transition-opacity text-left"
              style={{ background: "#FFF7ED", border: "1px solid #FED7AA" }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold flex items-center gap-1.5" style={{ color: "#C2410C", fontFamily: "var(--font-satoshi)" }}>
                  <Wallet01Icon size={15} className="flex-shrink-0" />
                  <span className="truncate">{formatCurrency(owingTotal)} owed to you</span>
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: "#EA580C", fontFamily: "var(--font-satoshi)" }}>{subtitle}</p>
              </div>
              <span className="text-[11px] font-semibold" style={{ color: "#EA580C", fontFamily: "var(--font-satoshi)" }}>View →</span>
            </button>
          );
        })()}

        {/* ── Records list ── */}
        <div className="px-5 mt-5 pb-32">
          {loading ? (
            <RecordsSkeleton />
          ) : Object.keys(grouped).length === 0 ? (
            <EmptyState filter={filter} router={router} />
          ) : (
            <div className="space-y-6">
              {Object.entries(grouped).map(([date, dayRecords]) => (
                <div key={date}>
                  <div className="flex items-center justify-between mb-3">
                    <p
                      className="text-[15px] font-bold text-spal-navy"
                      style={{ fontFamily: "var(--font-satoshi)" }}
                    >
                      {date}
                    </p>
                    <p className="text-[12px] font-semibold text-neutral-400" style={{ fontFamily: "var(--font-satoshi)" }}>
                      {dayRecords.filter(r => r.type === "sale").length > 0 &&
                        `+${formatCurrency(dayRecords.filter(r => r.type === "sale").reduce((s, r) => s + r.amount, 0))}`}
                    </p>
                  </div>
                  <div className="space-y-2.5">
                    {dayRecords.map((record, i) => (
                      <motion.div
                        key={record.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="rounded-2xl overflow-hidden bg-white"
                        style={{
                          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                          border: record.payment_status === "owing" ? "1px solid #FED7AA" : "1px solid rgba(228,228,231,0.5)",
                        }}
                      >
                        <SwipeableRow
                          onEdit={() => { setEditRecord(record); setAddSheet(null); }}
                          onDelete={() => scheduleDelete([record])}
                          selectMode={selectMode}
                          selected={selectedIds.has(record.id)}
                          onSelect={() => toggleSelect(record.id)}
                        >
                          <div className="flex items-center gap-3 px-4 py-3.5">
                            <RecordIcon record={record} />
                            <div className="flex-1 min-w-0">
                              <p className="text-[13.5px] font-semibold text-spal-navy truncate" style={{ fontFamily: "var(--font-satoshi)" }}>
                                {record.description ?? record.category ?? (record.type === "sale" ? "Sale" : "Expense")}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                {record.payment_status === "owing" && (
                                  <>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#FFF7ED", color: "#C2410C" }}>
                                      Owing
                                    </span>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); markPaid(record); }}
                                      className="text-[10px] font-bold px-2 py-0.5 rounded-full active:scale-95 transition-transform flex items-center gap-1"
                                      style={{ background: "#DCFCE7", color: "#16A34A" }}
                                    >
                                      <Tick01Icon size={10} color="#16A34A" />
                                      Mark paid
                                    </button>
                                  </>
                                )}
                                {record.category && (
                                  <span
                                    className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold"
                                    style={{ background: catStyle(record.category).bg, color: catStyle(record.category).color }}
                                  >
                                    {record.category}
                                  </span>
                                )}
                                <span className="text-[11px] text-neutral-400">{formatTime(record.created_at)}</span>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p
                                className="text-[13.5px] font-bold"
                                style={{ fontFamily: "var(--font-satoshi)", color: record.type === "sale" ? "#16A34A" : "#EA580C" }}
                              >
                                {record.type === "sale" ? "+" : "–"}{formatCurrency(record.amount)}
                              </p>
                              {record.customer_name && (
                                <p className="text-[10px] text-neutral-400 mt-0.5 truncate max-w-[72px]">{record.customer_name}</p>
                              )}
                            </div>
                          </div>
                        </SwipeableRow>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sheets */}
      <AddRecordSheet type="sale"    open={addSheetOpen === "sale"}    onClose={() => setAddSheet(null)} onSuccess={fetchRecords} />
      <AddRecordSheet type="expense" open={addSheetOpen === "expense"} onClose={() => setAddSheet(null)} onSuccess={fetchRecords} />
      <ExportSheet open={exportOpen} onClose={() => setExportOpen(false)} />
      <AddRecordSheet
        type={editRecord?.type ?? "sale"}
        open={!!editRecord}
        record={editRecord}
        onClose={() => setEditRecord(null)}
        onSuccess={() => { fetchRecords(); setEditRecord(null); }}
      />

      <AnimatePresence>
        {undoState && (
          <UndoToast key={undoState.ids.join(",")} message={undoState.label} onUndo={handleUndo} onExpire={handleExpire} />
        )}
      </AnimatePresence>
    </>
  );
}

function EmptyState({ filter, router }: { filter: Filter; router: ReturnType<typeof useRouter> }) {
  const label = filter === "expense" ? "expenses" : filter === "sale" ? "sales" : "records";
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-8">
      <p className="text-spal-navy font-bold text-[17px] mb-1" style={{ fontFamily: "var(--font-satoshi)" }}>No {label} yet</p>
      <p className="text-neutral-400 text-sm mb-6 leading-relaxed" style={{ fontFamily: "var(--font-satoshi)" }}>
        How would you like to add your first {filter === "expense" ? "expense" : "record"}?
      </p>
      <div className="grid grid-cols-2 gap-2.5">
        {[
          { label: "Add Sale",    bg: "#F0FDF4", icon: <ChartIncreaseIcon size={22} color="#22C55E" />, color: "#15803D", fn: () => router.push("/records/add-sale") },
          { label: "Add Expense", bg: "#FFF7ED", icon: <ChartDecreaseIcon size={22} color="#F97316" />, color: "#C2410C", fn: () => router.push("/records/add-expense") },
        ].map(a => (
          <button
            key={a.label}
            onClick={a.fn}
            className="flex flex-col items-center justify-center gap-2 rounded-2xl py-5 active:scale-[0.97] transition-transform"
            style={{ background: a.bg, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
          >
            {a.icon}
            <span className="text-[12px] font-semibold" style={{ fontFamily: "var(--font-satoshi)", color: a.color }}>{a.label}</span>
          </button>
        ))}
      </div>
    </motion.div>
  );
}

function RecordsSkeleton() {
  return (
    <div className="space-y-6">
      {["Today", "Yesterday"].map(label => (
        <div key={label}>
          <div className="h-4 skeleton rounded w-16 mb-3" />
          <div className="space-y-2.5">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl px-4 py-3.5 flex items-center gap-3" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                <div className="w-11 h-11 rounded-full skeleton" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 skeleton rounded w-28" />
                  <div className="h-2.5 skeleton rounded w-16" />
                </div>
                <div className="h-3 skeleton rounded w-14" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
