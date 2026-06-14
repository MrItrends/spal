"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useSPALStore } from "@/store";
import type { TrackingMethod } from "@/store";
import { formatCurrency } from "@/lib/utils/currency";
import {
  ArrowLeft, BookOpen, MessageCircle, Table2, LayoutGrid,
  FileText, Receipt, FileUp, ImageIcon, AlignLeft,
  ArrowUpRight, ArrowDownLeft, Calendar, CheckCircle2,
  AlertCircle, ChevronRight, Settings,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ReviewRecord {
  _id:         string; // client-only key for stable list rendering
  type:        "sale" | "expense";
  amount:      number;
  description: string;
  category:    string;
  record_date: string | null;
  confidence:  "high" | "low";
}

// ── Method metadata ───────────────────────────────────────────────────────────

const METHOD_META: Record<TrackingMethod, { label: string; icon: React.ReactNode; inputType: "file" | "visual" }> = {
  notebook:     { label: "Notebook",      icon: <BookOpen   size={18} strokeWidth={2} />, inputType: "visual" },
  whatsapp:     { label: "WhatsApp",      icon: <MessageCircle size={18} strokeWidth={2} />, inputType: "visual" },
  excel:        { label: "Excel",         icon: <Table2     size={18} strokeWidth={2} />, inputType: "file"   },
  google_sheets:{ label: "Google Sheets", icon: <LayoutGrid size={18} strokeWidth={2} />, inputType: "file"   },
  notes_app:    { label: "Notes App",     icon: <FileText   size={18} strokeWidth={2} />, inputType: "visual" },
  receipts:     { label: "Receipts",      icon: <Receipt    size={18} strokeWidth={2} />, inputType: "visual" },
  nothing:      { label: "Other",         icon: <FileUp     size={18} strokeWidth={2} />, inputType: "file"   },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function today() {
  return new Date().toISOString().slice(0, 10);
}

function friendlyDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-NG", {
    day: "numeric", month: "short", year: "numeric",
  });
}

let _uid = 0;
function uid() { return String(++_uid); }

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ImportRecordPage() {
  const router = useRouter();
  const { user, bumpRecordSaved } = useSPALStore();

  // Tracking methods — load from DB profile; fall back to store onboarding data
  const [methods, setMethods]       = useState<TrackingMethod[]>([]);
  const [activeMethod, setActive]   = useState<TrackingMethod | null>(null);
  const [loadingProfile, setLP]     = useState(true);

  // Upload state
  const fileRef    = useRef<HTMLInputElement>(null);
  const imageRef   = useRef<HTMLInputElement>(null);
  const [pasteText, setPasteText] = useState("");
  const [processing, setProcessing] = useState(false);
  const [parseError, setParseError] = useState("");

  // Review state
  const [records,   setRecords]   = useState<ReviewRecord[]>([]);

  // Fallback date for records where record_date is null
  const [fallbackDate, setFallbackDate] = useState(today());

  // Save state
  const [saving, setSaving] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

  // ── Load tracking methods from user profile ────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const res  = await fetch("/api/user/profile");
        const data = await res.json();
        if (data.success && data.data?.tracking_methods?.length > 0) {
          const dbMethods = data.data.tracking_methods.filter((m: string) => m !== "nothing") as TrackingMethod[];
          setMethods(dbMethods);
          setActive(dbMethods[0]);
          return;
        }
      } catch { /* fall through */ }

      // Fall back to onboarding store data
      const stored = user as unknown as { tracking_methods?: TrackingMethod[] };
      const fallback = (stored?.tracking_methods ?? []).filter(m => m !== "nothing");
      setMethods(fallback);
      setActive(fallback[0] ?? null);
    }
    load().finally(() => setLP(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Parse: file upload ─────────────────────────────────────────────────────
  async function handleFile(file: File | null | undefined) {
    if (!file) return;
    if (!file.name.match(/\.(csv|xlsx|xls|pdf|txt)$/i)) {
      setParseError("Please upload a CSV, Excel, or PDF file.");
      return;
    }
    setParseError("");
    setProcessing(true);
    try {
      const text = await file.text();
      const res  = await fetch("/api/ai/import-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      appendRecords(data.data ?? []);
    } catch {
      setParseError("Couldn't read the file. Try exporting as CSV and uploading again.");
    } finally {
      setProcessing(false);
    }
  }

  // ── Parse: image upload ────────────────────────────────────────────────────
  async function handleImage(file: File | null | undefined) {
    if (!file) return;
    setParseError("");
    setProcessing(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res  = await fetch("/api/ai/import-records", { method: "POST", body: fd });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      appendRecords(data.data ?? []);
    } catch {
      setParseError("Couldn't read the image. Try a clearer photo.");
    } finally {
      setProcessing(false);
    }
  }

  // ── Parse: pasted text ─────────────────────────────────────────────────────
  async function handlePasteSubmit() {
    if (!pasteText.trim()) return;
    setParseError("");
    setProcessing(true);
    try {
      const res  = await fetch("/api/ai/import-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: pasteText }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      appendRecords(data.data ?? []);
      setPasteText("");
    } catch {
      setParseError("Couldn't extract records. Please check your text and try again.");
    } finally {
      setProcessing(false);
    }
  }

  function appendRecords(raw: Omit<ReviewRecord, "_id">[]) {
    const stamped = raw.map(r => ({ ...r, _id: uid() }));
    setRecords(prev => [...prev, ...stamped]);
  }

  // ── Review helpers ─────────────────────────────────────────────────────────
  function updateRecord(id: string, patch: Partial<ReviewRecord>) {
    setRecords(prev => prev.map(r => r._id === id ? { ...r, ...patch } : r));
  }

  function removeRecord(id: string) {
    setRecords(prev => prev.filter(r => r._id !== id));
  }

  const missingDateCount = records.filter(r => !r.record_date).length;

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!records.length || saving) return;
    setSaving(true);
    try {
      await Promise.all(
        records.map(r =>
          fetch("/api/records", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type:         r.type,
              amount:       r.amount,
              description:  r.description,
              category:     r.category || undefined,
              input_method: "import",
              record_date:  r.record_date ?? fallbackDate,
            }),
          })
        )
      );
      setSavedCount(records.length);
      bumpRecordSaved();
      setRecords([]);
    } catch {
      setSaving(false);
    }
  }, [records, saving, fallbackDate, bumpRecordSaved]);

  // ── Success screen ─────────────────────────────────────────────────────────
  if (savedCount > 0) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center px-6 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 20 }}>
          <div className="w-20 h-20 rounded-full bg-spal-green flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 size={36} color="white" strokeWidth={2} />
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h2 className="text-2xl font-bold text-spal-navy" style={{ fontFamily: "var(--font-satoshi)" }}>
            {savedCount} {savedCount === 1 ? "record" : "records"} imported!
          </h2>
          <p className="text-neutral-400 text-sm mt-2 leading-relaxed">
            Your records are saved and ready in your history.
          </p>
          <div className="flex gap-3 mt-8">
            <button
              onClick={() => { setSavedCount(0); }}
              className="flex-1 h-12 rounded-2xl border border-neutral-200 text-spal-navy font-semibold text-sm"
              style={{ fontFamily: "var(--font-satoshi)" }}
            >
              Import more
            </button>
            <button
              onClick={() => router.push("/records")}
              className="flex-1 h-12 rounded-2xl bg-spal-green text-white font-semibold text-sm"
              style={{ fontFamily: "var(--font-satoshi)" }}
            >
              View records
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Empty state: no tracking methods set ──────────────────────────────────
  if (!loadingProfile && methods.length === 0) {
    return (
      <div className="min-h-full flex flex-col">
        <PageHeader onBack={() => router.back()} />
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mb-4">
            <FileUp size={26} strokeWidth={1.8} className="text-neutral-400" />
          </div>
          <h2 className="text-lg font-bold text-spal-navy" style={{ fontFamily: "var(--font-satoshi)" }}>
            No import method set
          </h2>
          <p className="text-neutral-400 text-sm mt-2 leading-relaxed max-w-xs">
            Tell SPAL how you currently track your records so it can show the right import options.
          </p>
          <button
            onClick={() => router.push("/profile")}
            className="mt-6 h-12 px-8 rounded-2xl bg-spal-navy text-white font-semibold text-sm flex items-center gap-2"
            style={{ fontFamily: "var(--font-satoshi)" }}
          >
            <Settings size={16} strokeWidth={2} />
            Go to Settings
          </button>
        </div>
      </div>
    );
  }

  const meta = activeMethod ? METHOD_META[activeMethod] : null;

  return (
    <div className="min-h-full pb-32" style={{ background: "#F8F7F4" }}>
      <PageHeader onBack={() => router.back()} />

      <div className="px-5">
        {/* Title */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h1 className="text-[22px] font-bold text-spal-navy leading-tight" style={{ fontFamily: "var(--font-satoshi)" }}>
              Import Records
            </h1>
            <p className="text-[13px] text-neutral-400 mt-1" style={{ fontFamily: "var(--font-satoshi)" }}>
              SPAL reads your existing records and extracts them automatically.
            </p>
          </div>
          <button
            onClick={() => router.push("/profile")}
            className="flex items-center gap-1 text-[11px] font-semibold mt-1 flex-shrink-0"
            style={{ color: "#22C55E", fontFamily: "var(--font-satoshi)" }}
          >
            <Settings size={12} strokeWidth={2.5} />
            Change methods
          </button>
        </div>

        {/* Method tabs */}
        {loadingProfile ? (
          <div className="flex gap-2 mb-5">
            {[1, 2].map(i => <div key={i} className="h-10 w-24 rounded-full skeleton" />)}
          </div>
        ) : methods.length > 1 ? (
          <div className="flex gap-2 mb-5 overflow-x-auto pb-1 -mx-5 px-5 scroll-container">
            {methods.map(m => {
              const info    = METHOD_META[m];
              const isActive = activeMethod === m;
              return (
                <motion.button
                  key={m}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setActive(m)}
                  className="flex items-center gap-2 px-4 h-10 rounded-full flex-shrink-0 text-[13px] font-semibold transition-all duration-150"
                  style={{
                    background:  isActive ? "#0F172A" : "#fff",
                    color:       isActive ? "#fff" : "#6B7280",
                    border:      isActive ? "none" : "1.5px solid #E5E7EB",
                    fontFamily:  "var(--font-satoshi)",
                  }}
                >
                  {info.icon}
                  {info.label}
                </motion.button>
              );
            })}
          </div>
        ) : null}

        {/* Upload UI — adapts per method */}
        {meta && (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeMethod}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
            >
              {meta.inputType === "file" ? (
                <FileUploadZone
                  method={activeMethod!}
                  onFile={handleFile}
                  fileRef={fileRef}
                />
              ) : (
                <VisualUploadZone
                  method={activeMethod!}
                  onImage={handleImage}
                  imageRef={imageRef}
                  pasteText={pasteText}
                  onPasteChange={setPasteText}
                  onPasteSubmit={handlePasteSubmit}
                  processing={processing}
                />
              )}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Hidden file inputs */}
        <input ref={fileRef}  type="file" accept=".csv,.xlsx,.xls,.pdf,.txt" className="hidden"
          onChange={e => handleFile(e.target.files?.[0])} />
        <input ref={imageRef} type="file" accept="image/*" capture="environment" className="hidden"
          onChange={e => handleImage(e.target.files?.[0])} />

        {/* Processing */}
        <AnimatePresence>
          {processing && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="mt-4 flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5"
              style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
            >
              <div className="w-5 h-5 rounded-full border-2 border-spal-green border-t-transparent animate-spin flex-shrink-0" />
              <p className="text-[13px] font-medium text-spal-navy" style={{ fontFamily: "var(--font-satoshi)" }}>
                SPAL is reading your records…
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        <AnimatePresence>
          {parseError && (
            <motion.div
              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mt-4 flex items-start gap-2.5 bg-red-50 border border-red-100 rounded-2xl px-4 py-3.5"
            >
              <AlertCircle size={16} strokeWidth={2} className="text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-[12.5px] text-red-600 leading-relaxed" style={{ fontFamily: "var(--font-satoshi)" }}>
                {parseError}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Review section */}
        <AnimatePresence>
          {records.length > 0 && !processing && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-6">

              {/* Review header */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-[15px] font-bold text-spal-navy" style={{ fontFamily: "var(--font-satoshi)" }}>
                    Review records
                  </p>
                  <p className="text-[12px] text-neutral-400 mt-0.5" style={{ fontFamily: "var(--font-satoshi)" }}>
                    {records.length} found · check and fix before saving
                  </p>
                </div>
                {records.some(r => r.confidence === "low") && (
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1"
                    style={{ background: "#FEF3C7", color: "#92400E", fontFamily: "var(--font-satoshi)" }}>
                    <AlertCircle size={11} strokeWidth={2.5} />
                    {records.filter(r => r.confidence === "low").length} needs review
                  </span>
                )}
              </div>

              {/* Fallback date — shown only when some records have no date */}
              {missingDateCount > 0 && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="mb-4 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3.5"
                >
                  <p className="text-[12px] font-semibold text-amber-800 mb-2" style={{ fontFamily: "var(--font-satoshi)" }}>
                    {missingDateCount} {missingDateCount === 1 ? "record has" : "records have"} no date — set a fallback date:
                  </p>
                  <input
                    type="date"
                    value={fallbackDate}
                    max={today()}
                    onChange={e => setFallbackDate(e.target.value)}
                    className="h-10 px-3 rounded-xl border-2 border-amber-200 bg-white text-[13px] text-spal-navy font-medium outline-none focus:border-spal-blue transition-colors"
                    style={{ fontFamily: "var(--font-satoshi)" }}
                  />
                </motion.div>
              )}

              {/* Record cards */}
              <div className="space-y-3">
                <AnimatePresence initial={false}>
                  {records.map((record) => (
                    <ReviewCard
                      key={record._id}
                      record={record}
                      fallbackDate={fallbackDate}
                      onChange={patch => updateRecord(record._id, patch)}
                      onRemove={() => removeRecord(record._id)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tips */}
        {records.length === 0 && !processing && (
          <div className="mt-6 rounded-2xl px-4 py-4 space-y-2.5"
            style={{ background: "#fff", border: "1.5px solid #E5E7EB" }}>
            <p className="text-[11px] font-bold tracking-widest text-neutral-400 uppercase" style={{ fontFamily: "var(--font-satoshi)" }}>
              Tips
            </p>
            {[
              "For spreadsheets, export as CSV for best results.",
              "For WhatsApp or notes, paste the text or take a clear screenshot.",
              "SPAL will tell you which records need a second look.",
            ].map((tip, i) => (
              <div key={i} className="flex items-start gap-2">
                <ChevronRight size={13} strokeWidth={2.5} className="text-spal-green mt-0.5 flex-shrink-0" />
                <p className="text-[12.5px] text-neutral-500 leading-relaxed" style={{ fontFamily: "var(--font-satoshi)" }}>
                  {tip}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fixed import CTA */}
      <AnimatePresence>
        {records.length > 0 && !processing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-5 pt-3 pb-4 z-20"
            style={{ background: "linear-gradient(to top, #F8F7F4 75%, transparent)" }}
          >
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full h-14 rounded-2xl font-bold text-[15px] text-white flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50"
              style={{ fontFamily: "var(--font-satoshi)", background: "#22C55E",
                boxShadow: "0 4px 16px rgba(34,197,94,0.35)" }}
            >
              {saving
                ? <><div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> Importing…</>
                : `Import ${records.length} ${records.length === 1 ? "record" : "records"}`
              }
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PageHeader({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex items-center gap-3 px-5 pt-12 pb-5">
      <button
        onClick={onBack}
        className="w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-transform flex-shrink-0"
        style={{ background: "rgba(15,23,42,0.06)" }}
        aria-label="Back"
      >
        <ArrowLeft size={18} strokeWidth={2} />
      </button>
      <span className="text-[16px] font-semibold text-spal-navy" style={{ fontFamily: "var(--font-satoshi)" }}>
        Import Record
      </span>
    </div>
  );
}

function FileUploadZone({
  method, onFile, fileRef,
}: {
  method: TrackingMethod;
  onFile: (f: File | null) => void;
  fileRef: React.RefObject<HTMLInputElement | null>;
}) {
  const hint = method === "excel"
    ? "Export your Excel file as CSV, then upload it here."
    : method === "google_sheets"
    ? "From Google Sheets, go to File → Download → CSV (.csv), then upload here."
    : "Upload a CSV or spreadsheet file.";

  return (
    <div>
      <button
        onClick={() => fileRef.current?.click()}
        className="w-full rounded-2xl bg-white flex flex-col items-center justify-center gap-3 py-10 active:scale-[0.99] transition-transform"
        style={{ border: "2px dashed #D1D5DB", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
      >
        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "#EFF6FF" }}>
          <FileUp size={22} strokeWidth={2} color="#2563EB" />
        </div>
        <div className="text-center">
          <p className="text-[14px] font-semibold text-spal-navy" style={{ fontFamily: "var(--font-satoshi)" }}>
            Tap to upload a file
          </p>
          <p className="text-[11.5px] text-neutral-400 mt-0.5" style={{ fontFamily: "var(--font-satoshi)" }}>
            .csv · .xlsx · .xls · .pdf
          </p>
        </div>
      </button>
      <p className="text-[12px] text-neutral-400 mt-3 leading-relaxed text-center" style={{ fontFamily: "var(--font-satoshi)" }}>
        {hint}
      </p>
    </div>
  );
}

function VisualUploadZone({
  method, onImage, imageRef, pasteText, onPasteChange, onPasteSubmit, processing,
}: {
  method: TrackingMethod;
  onImage: (f: File | null) => void;
  imageRef: React.RefObject<HTMLInputElement | null>;
  pasteText: string;
  onPasteChange: (v: string) => void;
  onPasteSubmit: () => void;
  processing: boolean;
}) {
  const imageHint: Record<string, string> = {
    whatsapp:  "Take a screenshot of your WhatsApp notes or chat",
    notebook:  "Take a clear photo of your notebook page",
    notes_app: "Screenshot your notes app",
    receipts:  "Photograph all your receipts clearly",
  };
  const textHint: Record<string, string> = {
    whatsapp:  "Copy and paste your WhatsApp messages here",
    notebook:  "Type out what's written in your notebook",
    notes_app: "Paste your notes directly here",
    receipts:  "List your receipt amounts and descriptions",
  };

  return (
    <div className="space-y-3">
      {/* Image upload card */}
      <button
        onClick={() => imageRef.current?.click()}
        className="w-full rounded-2xl bg-white flex items-center gap-4 px-5 py-4 active:scale-[0.99] transition-transform text-left"
        style={{ border: "1.5px solid #E5E7EB", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
      >
        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#F0FDF4" }}>
          <ImageIcon size={20} strokeWidth={2} color="#22C55E" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13.5px] font-semibold text-spal-navy" style={{ fontFamily: "var(--font-satoshi)" }}>
            Upload photo or screenshot
          </p>
          <p className="text-[11.5px] text-neutral-400 mt-0.5 leading-snug" style={{ fontFamily: "var(--font-satoshi)" }}>
            {imageHint[method] ?? "Take a clear photo of your records"}
          </p>
        </div>
        <ChevronRight size={16} strokeWidth={2} className="text-neutral-300 flex-shrink-0" />
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-neutral-200" />
        <span className="text-[11px] text-neutral-400 font-medium" style={{ fontFamily: "var(--font-satoshi)" }}>or</span>
        <div className="flex-1 h-px bg-neutral-200" />
      </div>

      {/* Text paste card */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1.5px solid #E5E7EB", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
        <div className="flex items-center gap-3 px-4 pt-4 pb-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#EFF6FF" }}>
            <AlignLeft size={15} strokeWidth={2} color="#2563EB" />
          </div>
          <p className="text-[13px] font-semibold text-spal-navy" style={{ fontFamily: "var(--font-satoshi)" }}>
            Paste as text
          </p>
        </div>
        <textarea
          rows={4}
          placeholder={textHint[method] ?? "Paste your records here…"}
          value={pasteText}
          onChange={e => onPasteChange(e.target.value)}
          className="w-full px-4 pb-3 text-[13px] text-spal-navy placeholder:text-neutral-300 bg-transparent outline-none resize-none leading-relaxed"
          style={{ fontFamily: "var(--font-satoshi)" }}
        />
        <AnimatePresence>
          {pasteText.trim().length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="border-t border-neutral-100 px-4 py-3 overflow-hidden"
            >
              <button
                onClick={onPasteSubmit}
                disabled={processing}
                className="w-full h-10 rounded-xl bg-spal-blue text-white font-semibold text-[13px] disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ fontFamily: "var(--font-satoshi)" }}
              >
                {processing
                  ? <><div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" /> Reading…</>
                  : "Extract records"
                }
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── ReviewCard ────────────────────────────────────────────────────────────────

function ReviewCard({
  record, fallbackDate, onChange, onRemove,
}: {
  record:      ReviewRecord;
  fallbackDate: string;
  onChange:    (patch: Partial<ReviewRecord>) => void;
  onRemove:    () => void;
}) {
  const [editingDesc, setEditingDesc]   = useState(false);
  const [editingDate, setEditingDate]   = useState(false);
  const [desc, setDesc]                 = useState(record.description);
  const descRef = useRef<HTMLInputElement>(null);
  const isLow   = record.confidence === "low";

  const displayDate = record.record_date ?? fallbackDate;

  function commitDesc() {
    const trimmed = desc.trim() || record.description;
    onChange({ description: trimmed, confidence: "high" });
    setDesc(trimmed);
    setEditingDesc(false);
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, height: 0 }}
      transition={{ duration: 0.22 }}
      className="bg-white rounded-2xl overflow-hidden"
      style={{
        border:     isLow ? "1.5px solid #FCD34D" : "1.5px solid #E5E7EB",
        boxShadow:  "0 1px 4px rgba(0,0,0,0.05)",
      }}
    >
      {/* Low confidence banner */}
      {isLow && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-amber-100" style={{ background: "#FFFBEB" }}>
          <AlertCircle size={13} strokeWidth={2.5} color="#D97706" />
          <p className="text-[11.5px] font-semibold text-amber-700" style={{ fontFamily: "var(--font-satoshi)" }}>
            SPAL isn&apos;t sure about this one — please review
          </p>
        </div>
      )}

      <div className="px-4 py-3.5">
        {/* Row 1: Type toggle + Amount */}
        <div className="flex items-center justify-between gap-3 mb-3">
          {/* Sale / Expense toggle */}
          <div className="flex rounded-xl overflow-hidden border border-neutral-200 flex-shrink-0">
            <button
              onClick={() => onChange({ type: "sale", confidence: "high" })}
              className="flex items-center gap-1 px-2.5 py-1.5 text-[11.5px] font-bold transition-all duration-150"
              style={{
                background: record.type === "sale" ? "#22C55E" : "transparent",
                color:      record.type === "sale" ? "#fff" : "#9CA3AF",
                fontFamily: "var(--font-satoshi)",
              }}
            >
              <ArrowUpRight size={12} strokeWidth={2.5} />
              Sale
            </button>
            <button
              onClick={() => onChange({ type: "expense", confidence: "high" })}
              className="flex items-center gap-1 px-2.5 py-1.5 text-[11.5px] font-bold transition-all duration-150"
              style={{
                background: record.type === "expense" ? "#F97316" : "transparent",
                color:      record.type === "expense" ? "#fff" : "#9CA3AF",
                fontFamily: "var(--font-satoshi)",
              }}
            >
              <ArrowDownLeft size={12} strokeWidth={2.5} />
              Expense
            </button>
          </div>

          {/* Amount — always shown, styled by type */}
          <p
            className="text-[15px] font-bold flex-shrink-0"
            style={{
              color:      record.type === "sale" ? "#22C55E" : "#F97316",
              fontFamily: "var(--font-satoshi)",
            }}
          >
            {record.type === "sale" ? "+" : "–"}{formatCurrency(record.amount)}
          </p>
        </div>

        {/* Row 2: Description (editable) */}
        <div className="mb-2.5">
          {editingDesc ? (
            <input
              ref={descRef}
              autoFocus
              value={desc}
              onChange={e => setDesc(e.target.value)}
              onBlur={commitDesc}
              onKeyDown={e => { if (e.key === "Enter") commitDesc(); }}
              className="w-full text-[13px] font-medium text-spal-navy outline-none border-b-2 border-spal-blue pb-1 bg-transparent"
              style={{ fontFamily: "var(--font-satoshi)" }}
            />
          ) : (
            <button
              onClick={() => { setEditingDesc(true); setTimeout(() => descRef.current?.focus(), 50); }}
              className="text-left w-full"
            >
              <p className="text-[13px] font-semibold text-spal-navy truncate" style={{ fontFamily: "var(--font-satoshi)" }}>
                {record.description || <span className="text-neutral-300">Tap to add description</span>}
              </p>
              {record.category && (
                <span
                  className="inline-block mt-0.5 text-[10px] font-medium px-2 py-0.5 rounded-full"
                  style={{
                    background: record.type === "sale" ? "#F0FDF4" : "#FFF7ED",
                    color:      record.type === "sale" ? "#16A34A" : "#EA580C",
                  }}
                >
                  {record.category}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Row 3: Date + remove */}
        <div className="flex items-center justify-between">
          {editingDate ? (
            <input
              type="date"
              autoFocus
              value={record.record_date ?? fallbackDate}
              max={today()}
              onChange={e => { onChange({ record_date: e.target.value, confidence: "high" }); setEditingDate(false); }}
              onBlur={() => setEditingDate(false)}
              className="h-8 px-2 rounded-xl border-2 border-spal-blue text-[12px] text-spal-navy font-medium outline-none bg-white"
              style={{ fontFamily: "var(--font-satoshi)" }}
            />
          ) : (
            <button
              onClick={() => setEditingDate(true)}
              className="flex items-center gap-1.5 h-7 px-2.5 rounded-xl text-[11.5px] font-semibold transition-colors"
              style={{
                background: record.record_date ? "#F0FDF4" : "#FEF3C7",
                color:      record.record_date ? "#16A34A" : "#92400E",
                fontFamily: "var(--font-satoshi)",
              }}
            >
              <Calendar size={11} strokeWidth={2.5} />
              {record.record_date ? friendlyDate(record.record_date) : `Using fallback · ${friendlyDate(fallbackDate)}`}
            </button>
          )}

          <button
            onClick={onRemove}
            className="text-[11.5px] font-semibold text-neutral-400 hover:text-red-400 transition-colors"
            style={{ fontFamily: "var(--font-satoshi)" }}
          >
            Remove
          </button>
        </div>
      </div>
    </motion.div>
  );
}
