"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency } from "@/lib/utils/currency";
import { formatTime } from "@/lib/utils/dates";
import { useSPALStore } from "@/store";
import { AddRecordSheet } from "@/components/records/AddRecordSheet";
import type { BusinessRecord } from "@/lib/types";

type Filter = "all" | "sale" | "expense";

function dateLabel(recordDate: string): string {
  const today = new Date().toISOString().split("T")[0];
  const yest  = new Date();
  yest.setDate(yest.getDate() - 1);
  const yesterday = yest.toISOString().split("T")[0];
  if (recordDate === today)     return "Today";
  if (recordDate === yesterday) return "Yesterday";
  const [y, m, d] = recordDate.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-NG", {
    weekday: "short", day: "numeric", month: "short",
  });
}

export default function RecordsPage() {
  const { addSheetOpen, setAddSheet } = useSPALStore();
  const [filter,   setFilter]   = useState<Filter>("all");
  const [records,  setRecords]  = useState<BusinessRecord[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [editRecord, setEditRecord] = useState<BusinessRecord | null>(null);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/records?limit=200");
      const data = await res.json();
      if (data.success) setRecords(data.data);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const filtered = records.filter((r) => filter === "all" ? true : r.type === filter);
  const grouped  = filtered.reduce<Record<string, BusinessRecord[]>>((acc, r) => {
    const label = dateLabel(r.record_date);
    (acc[label] ??= []).push(r);
    return acc;
  }, {});

  function handleRecordTap(record: BusinessRecord) {
    setEditRecord(record);
    setAddSheet(null); // close add sheet if open
  }

  function handleEditClose() {
    setEditRecord(null);
  }

  return (
    <>
      <div className="px-4 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-spal-navy" style={{ fontFamily: "var(--font-satoshi)" }}>Records</h1>
          {records.length > 0 && (
            <span className="text-xs text-neutral-400">
              {filtered.length} {filter === "all" ? "total" : filter === "sale" ? "sales" : "expenses"}
            </span>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-5">
          {(["all", "sale", "expense"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 h-10 rounded-full text-sm font-semibold transition-all duration-200 ${
                filter === f
                  ? f === "sale" ? "bg-spal-green text-white"
                  : f === "expense" ? "bg-spal-orange text-white"
                  : "bg-spal-navy text-white"
                  : "bg-neutral-100 text-neutral-500"
              }`}
            >
              {f === "all" ? "All" : f === "sale" ? "Sales" : "Expenses"}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <RecordsSkeleton />
        ) : Object.keys(grouped).length === 0 ? (
          <EmptyState filter={filter} onAdd={() => setAddSheet(filter === "expense" ? "expense" : "sale")} />
        ) : (
          <div className="space-y-5">
            {Object.entries(grouped).map(([date, dayRecords]) => (
              <div key={date}>
                <div className="flex items-center justify-between mb-2">
                  <p className="spal-section-label">{date}</p>
                  <p className="text-xs text-neutral-300">
                    {dayRecords.filter(r => r.type === "sale").length > 0 &&
                      `+${formatCurrency(dayRecords.filter(r => r.type === "sale").reduce((s, r) => s + r.amount, 0))}`}
                  </p>
                </div>
                <div className="bg-white rounded-[18px] border border-neutral-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)] overflow-hidden">
                  {dayRecords.map((record, i) => (
                    <motion.button
                      key={record.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => handleRecordTap(record)}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 active:bg-neutral-50 transition-colors text-left ${
                        i < dayRecords.length - 1 ? "border-b border-neutral-50" : ""
                      }`}
                    >
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: record.type === "sale" ? "#F0FDF4" : "#FFF7ED" }}
                      >
                        {record.type === "sale" ? <RecordSaleIcon /> : <RecordExpenseIcon />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-spal-navy truncate">
                          {record.description ?? record.category ?? (record.type === "sale" ? "Sale" : "Expense")}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {record.category && (
                            <>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                record.type === "sale" ? "bg-spal-green-50 text-spal-green-700" : "bg-spal-orange-50 text-spal-orange-600"
                              }`}>
                                {record.category}
                              </span>
                              <span className="text-xs text-neutral-300">·</span>
                            </>
                          )}
                          <span className="text-xs text-neutral-400">{formatTime(record.created_at)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <p className={`text-sm font-bold ${
                          record.type === "sale" ? "text-spal-green" : "text-spal-orange"
                        }`}>
                          {record.type === "sale" ? "+" : "-"}{formatCurrency(record.amount)}
                        </p>
                        <EditIcon />
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            ))}
            <div className="h-4" />
          </div>
        )}
      </div>

      {/* FAB */}
      <AnimatePresence>
        {!addSheetOpen && !editRecord && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => setAddSheet("sale")}
            className="fixed bottom-24 right-4 w-14 h-14 bg-spal-green rounded-full flex items-center justify-center text-white text-2xl z-30"
            style={{ boxShadow: "0 4px 16px rgba(29,185,84,0.45)" }}
            aria-label="Add record"
          >
            +
          </motion.button>
        )}
      </AnimatePresence>

      {/* Add sheets */}
      <AddRecordSheet type="sale"    open={addSheetOpen === "sale"}    onClose={() => setAddSheet(null)} onSuccess={fetchRecords} />
      <AddRecordSheet type="expense" open={addSheetOpen === "expense"} onClose={() => setAddSheet(null)} onSuccess={fetchRecords} />

      {/* Edit sheet — opens when a record is tapped */}
      <AddRecordSheet
        type={editRecord?.type ?? "sale"}
        open={!!editRecord}
        record={editRecord}
        onClose={handleEditClose}
        onSuccess={() => { fetchRecords(); handleEditClose(); }}
      />
    </>
  );
}

function EmptyState({ filter, onAdd }: { filter: Filter; onAdd: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center mb-4">
        {filter === "expense" ? <RecordExpenseIcon large /> : <RecordSaleIcon large />}
      </div>
      <p className="text-spal-navy font-semibold text-base" style={{ fontFamily: "var(--font-satoshi)" }}>
        No {filter === "all" ? "records" : filter === "sale" ? "sales" : "expenses"} yet
      </p>
      <p className="text-neutral-400 text-sm mt-1 max-w-xs leading-relaxed" style={{ fontFamily: "var(--font-satoshi)" }}>
        Start tracking your business today.
      </p>
      <button
        onClick={onAdd}
        className="mt-5 bg-spal-navy text-white font-semibold text-sm rounded-full px-6 h-11"
        style={{ fontFamily: "var(--font-satoshi)" }}
      >
        Add your first {filter === "expense" ? "expense" : "sale"}
      </button>
    </motion.div>
  );
}

function RecordSaleIcon({ large = false }: { large?: boolean }) {
  const s = large ? 22 : 16;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}

function RecordExpenseIcon({ large = false }: { large?: boolean }) {
  const s = large ? 22 : 16;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M19 12l-7 7-7-7" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#D4D4D8" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function RecordsSkeleton() {
  return (
    <div className="space-y-5">
      {["Today", "Yesterday"].map((label) => (
        <div key={label}>
          <div className="h-3 skeleton rounded w-16 mb-2" />
          <div className="bg-white rounded-[18px] border border-neutral-200/80 overflow-hidden">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3.5 border-b border-neutral-50">
                <div className="w-9 h-9 rounded-xl skeleton" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 skeleton rounded w-28" />
                  <div className="h-2.5 skeleton rounded w-16" />
                </div>
                <div className="h-3 skeleton rounded w-16" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
