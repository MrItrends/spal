"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency } from "@/lib/utils/currency";
import { formatTime } from "@/lib/utils/dates";
import { useSPALStore } from "@/store";
import { AddRecordSheet } from "@/components/records/AddRecordSheet";
import { SwipeableRow } from "@/components/records/SwipeableRow";
import { ExportSheet } from "@/components/records/ExportSheet";
import { UndoToast } from "@/components/ui/UndoToast";
import { ArrowUp, ArrowDown, Download, CheckSquare } from "lucide-react";
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

interface UndoState {
  ids:     string[];
  records: BusinessRecord[];
  label:   string;
}

export default function RecordsPage() {
  const { addSheetOpen, setAddSheet, recordSavedAt } = useSPALStore();
  const [filter,     setFilter]     = useState<Filter>("all");
  const [records,    setRecords]    = useState<BusinessRecord[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [editRecord, setEditRecord] = useState<BusinessRecord | null>(null);
  const [exportOpen, setExportOpen] = useState(false);

  // Undo delete state
  const [undoState,  setUndoState]  = useState<UndoState | null>(null);
  const pendingIdsRef = useRef<string[]>([]);

  // Multi-select state
  const [selectMode,   setSelectMode]   = useState(false);
  const [selectedIds,  setSelectedIds]  = useState<Set<string>>(new Set());

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (recordSavedAt) fetchRecords(); }, [recordSavedAt]);

  // Flush pending API deletes (e.g. when a new delete comes in before undo timer expires)
  const flushPending = useCallback(async () => {
    const ids = pendingIdsRef.current;
    if (!ids.length) return;
    pendingIdsRef.current = [];
    setUndoState(null);
    await Promise.all(ids.map(id => fetch(`/api/records?id=${id}`, { method: "DELETE" })));
  }, []);

  // Clean up on unmount
  useEffect(() => () => { flushPending(); }, [flushPending]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Delete with 10-second undo ─────────────────────────────────────────────
  function scheduleDelete(toDelete: BusinessRecord[]) {
    if (!toDelete.length) return;

    // If there's already a pending delete, flush it first (execute immediately)
    if (pendingIdsRef.current.length) {
      const prev = pendingIdsRef.current;
      pendingIdsRef.current = [];
      Promise.all(prev.map(id => fetch(`/api/records?id=${id}`, { method: "DELETE" })));
    }

    const ids = toDelete.map(r => r.id);
    pendingIdsRef.current = ids;
    setRecords(prev => prev.filter(r => !ids.includes(r.id)));
    setUndoState({
      ids,
      records: toDelete,
      label: toDelete.length === 1
        ? "Record deleted"
        : `${toDelete.length} records deleted`,
    });
  }

  function handleUndo() {
    if (!undoState) return;
    pendingIdsRef.current = [];
    setUndoState(null);
    // Restore records — insert back sorted by created_at (newest first)
    setRecords(prev => {
      const combined = [...prev, ...undoState.records];
      return combined.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });
  }

  function handleExpire() {
    const ids = pendingIdsRef.current;
    pendingIdsRef.current = [];
    setUndoState(null);
    Promise.all(ids.map(id => fetch(`/api/records?id=${id}`, { method: "DELETE" })));
  }

  // ── Select mode helpers ───────────────────────────────────────────────────
  function exitSelectMode() {
    setSelectMode(false);
    setSelectedIds(new Set());
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelectedIds(new Set(filtered.map(r => r.id)));
  }

  function deleteSelected() {
    const toDelete = records.filter(r => selectedIds.has(r.id));
    exitSelectMode();
    scheduleDelete(toDelete);
  }

  function deleteAll() {
    const toDelete = [...filtered];
    exitSelectMode();
    scheduleDelete(toDelete);
  }

  // ── Record edit ──────────────────────────────────────────────────────────
  function handleRecordTap(record: BusinessRecord) {
    if (selectMode) return;
    setEditRecord(record);
    setAddSheet(null);
  }

  function handleEditClose() { setEditRecord(null); }

  const filtered = records.filter((r) => filter === "all" ? true : r.type === filter);
  const grouped  = filtered.reduce<Record<string, BusinessRecord[]>>((acc, r) => {
    const label = dateLabel(r.record_date);
    (acc[label] ??= []).push(r);
    return acc;
  }, {});

  const allSelected = filtered.length > 0 && selectedIds.size === filtered.length;

  return (
    <>
      <div className="px-4 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          {selectMode ? (
            <>
              <button
                onClick={exitSelectMode}
                className="text-[13px] font-semibold"
                style={{ color: "#6B7280", fontFamily: "var(--font-satoshi)" }}
              >
                Cancel
              </button>
              <p className="text-[14px] font-bold text-spal-navy" style={{ fontFamily: "var(--font-satoshi)" }}>
                {selectedIds.size > 0 ? `${selectedIds.size} selected` : "Select records"}
              </p>
              <button
                onClick={deleteSelected}
                disabled={selectedIds.size === 0}
                className="text-[13px] font-bold disabled:opacity-30 transition-opacity"
                style={{ color: "#EF4444", fontFamily: "var(--font-satoshi)" }}
              >
                Delete
              </button>
            </>
          ) : (
            <>
              <h1 className="text-xl font-bold text-spal-navy" style={{ fontFamily: "var(--font-satoshi)" }}>Records</h1>
              <div className="flex items-center gap-3">
                {records.length > 0 && (
                  <span className="text-xs text-neutral-400">
                    {filtered.length} {filter === "all" ? "total" : filter === "sale" ? "sales" : "expenses"}
                  </span>
                )}
                {records.length > 0 && (
                  <>
                    <button
                      onClick={() => setExportOpen(true)}
                      className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center"
                      aria-label="Export records"
                    >
                      <Download size={15} strokeWidth={2.2} className="text-neutral-500" />
                    </button>
                    <button
                      onClick={() => setSelectMode(true)}
                      className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center"
                      aria-label="Select records"
                    >
                      <CheckSquare size={15} strokeWidth={2.2} className="text-neutral-500" />
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-4">
          {(["all", "sale", "expense"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f); exitSelectMode(); }}
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

        {/* Select mode actions row */}
        {selectMode && filtered.length > 0 && (
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={allSelected ? () => setSelectedIds(new Set()) : selectAll}
              className="text-[12px] font-semibold"
              style={{ color: "#22C55E", fontFamily: "var(--font-satoshi)" }}
            >
              {allSelected ? "Deselect all" : `Select all ${filtered.length}`}
            </button>
            <button
              onClick={deleteAll}
              className="text-[12px] font-semibold"
              style={{ color: "#EF4444", fontFamily: "var(--font-satoshi)" }}
            >
              Delete all {filtered.length}
            </button>
          </div>
        )}

        {/* Swipe hint — shown only in normal mode with records */}
        {!loading && !selectMode && Object.keys(grouped).length > 0 && (
          <p className="text-[11px] text-neutral-400 text-right mb-3" style={{ fontFamily: "var(--font-satoshi)" }}>
            Swipe a record to edit or delete
          </p>
        )}

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
                <div className="space-y-1.5">
                  {dayRecords.map((record, i) => (
                    <motion.div
                      key={record.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.035 }}
                      className="rounded-[16px] overflow-hidden bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.04)]"
                      style={{ border: "1px solid rgba(228,228,231,0.6)" }}
                    >
                      <SwipeableRow
                        onEdit={() => handleRecordTap(record)}
                        onDelete={() => scheduleDelete([record])}
                        selectMode={selectMode}
                        selected={selectedIds.has(record.id)}
                        onSelect={() => toggleSelect(record.id)}
                      >
                        <div className="flex items-center gap-3 px-4 py-3.5">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: record.type === "sale" ? "#F0FDF4" : "#FFF7ED" }}
                          >
                            {record.type === "sale" ? <RecordSaleIcon /> : <RecordExpenseIcon />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-spal-navy truncate" style={{ fontFamily: "var(--font-satoshi)" }}>
                              {record.description ?? record.category ?? (record.type === "sale" ? "Sale" : "Expense")}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {record.category && (
                                <>
                                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                                    record.type === "sale" ? "bg-spal-green-50 text-spal-green-700" : "bg-spal-orange-50 text-spal-orange-600"
                                  }`}>
                                    {record.category}
                                  </span>
                                  <span className="text-xs text-neutral-300">·</span>
                                </>
                              )}
                              <span className="text-[11px] text-neutral-400">{formatTime(record.created_at)}</span>
                            </div>
                          </div>
                          <p
                            className="text-[13px] font-bold flex-shrink-0"
                            style={{ color: record.type === "sale" ? "#22C55E" : "#F97316", fontFamily: "var(--font-satoshi)" }}
                          >
                            {record.type === "sale" ? "+" : "–"}{formatCurrency(record.amount)}
                          </p>
                        </div>
                      </SwipeableRow>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
            <div className="h-4" />
          </div>
        )}
      </div>


      {/* Add sheets */}
      <AddRecordSheet type="sale"    open={addSheetOpen === "sale"}    onClose={() => setAddSheet(null)} onSuccess={fetchRecords} />
      <AddRecordSheet type="expense" open={addSheetOpen === "expense"} onClose={() => setAddSheet(null)} onSuccess={fetchRecords} />
      <ExportSheet open={exportOpen} onClose={() => setExportOpen(false)} />

      {/* Edit sheet */}
      <AddRecordSheet
        type={editRecord?.type ?? "sale"}
        open={!!editRecord}
        record={editRecord}
        onClose={handleEditClose}
        onSuccess={() => { fetchRecords(); handleEditClose(); }}
      />

      {/* Undo toast */}
      <AnimatePresence>
        {undoState && (
          <UndoToast
            key={undoState.ids.join(",")}
            message={undoState.label}
            onUndo={handleUndo}
            onExpire={handleExpire}
          />
        )}
      </AnimatePresence>
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
  return <ArrowUp size={large ? 22 : 16} color="#22C55E" strokeWidth={2} />;
}

function RecordExpenseIcon({ large = false }: { large?: boolean }) {
  return <ArrowDown size={large ? 22 : 16} color="#F97316" strokeWidth={2} />;
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
