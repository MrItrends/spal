"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { PillChip } from "@/components/ui/PillChip";
import { useSPALStore } from "@/store";
import type { BusinessRecord } from "@/lib/types";
import type { Badge } from "@/lib/gamification/badges";

const SALE_CATEGORIES    = ["Drinks", "Food", "Clothing", "Services", "Products", "Other"];
const EXPENSE_CATEGORIES = ["Stock", "Fuel", "Transport", "Rent", "Salary", "Utilities", "Other"];

interface AddRecordSheetProps {
  type:       "sale" | "expense";
  open:       boolean;
  onClose:    () => void;
  onSuccess?: () => void;
  /** When provided, sheet opens in edit mode pre-filled with this record */
  record?:    BusinessRecord | null;
}

export function AddRecordSheet({ type, open, onClose, onSuccess, record }: AddRecordSheetProps) {
  const { setNewBadge } = useSPALStore();
  const [amount,        setAmount]        = useState("");
  const [description,   setDescription]   = useState("");
  const [category,      setCategory]      = useState("");
  const [loading,       setLoading]       = useState(false);
  const [deleting,      setDeleting]      = useState(false);
  const [success,       setSuccess]       = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [scanning,      setScanning]      = useState(false);
  const [scanError,     setScanError]     = useState("");
  const [wasScanned,    setWasScanned]    = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEdit = !!record;

  // Pre-fill when editing
  useEffect(() => {
    if (record && open) {
      setAmount(String(record.amount));
      setDescription(record.description ?? "");
      setCategory(record.category ?? "");
      setDeleteConfirm(false);
    }
  }, [record, open]);

  const categories = type === "sale" ? SALE_CATEGORIES : EXPENSE_CATEGORIES;
  const isValid    = amount && parseFloat(amount) > 0;
  const label      = type === "sale" ? "Sale" : "Expense";
  const emoji      = type === "sale" ? "💰" : "🧾";

  async function handleSave() {
    if (!isValid) return;
    setLoading(true);

    try {
      if (isEdit && record) {
        // PATCH existing record
        const res = await fetch("/api/records", {
          method:  "PATCH",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            id:          record.id,
            amount:      parseFloat(amount),
            description: description.trim() || undefined,
            category:    category || undefined,
          }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
      } else {
        // POST new record
        const res = await fetch("/api/records", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            type,
            amount:      parseFloat(amount),
            description: description.trim() || undefined,
            category:    category || undefined,
            input_method: wasScanned ? "scan" : "text",
          }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        // Show badge celebration if any earned
        if (data.newBadges?.length > 0) {
          setTimeout(() => setNewBadge(data.newBadges[0] as Badge), 1200);
        }
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        reset();
        onClose();
        onSuccess?.();
      }, 1000);
    } catch {
      // silent — don't crash the sheet
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!record) return;
    if (!deleteConfirm) { setDeleteConfirm(true); return; }

    setDeleting(true);
    try {
      await fetch(`/api/records?id=${record.id}`, { method: "DELETE" });
      reset();
      onClose();
      onSuccess?.();
    } catch {
      // silent
    } finally {
      setDeleting(false);
    }
  }

  async function handleScanFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!fileInputRef.current) return;
    fileInputRef.current.value = ""; // reset so same file can be re-selected
    if (!file) return;

    setScanError("");
    setScanning(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res  = await fetch("/api/ai/scan-receipt", { method: "POST", body: fd });
      const data = await res.json();

      if (!data.success) {
        setScanError(data.error ?? "Could not read receipt.");
        return;
      }

      const { type: detectedType, amount: detectedAmount, description: desc, category: cat } = data.data;

      // Pre-fill fields — only overwrite blanks so manual edits are preserved
      if (!amount)      setAmount(String(detectedAmount));
      if (!description) setDescription(desc ?? "");
      if (!category)    setCategory(cat ?? "");
      setWasScanned(true);

      // If AI detected a different type than the sheet is opened for, note it
      // (we can't change the sheet type mid-flow, but at least auto-fill is still useful)
      if (detectedType !== type) {
        setScanError(`Looks like a ${detectedType} receipt — fields pre-filled, but this sheet records a ${type}. Tap ✕ and use the correct button if needed.`);
      }
    } catch {
      setScanError("Scan failed. Check your connection and try again.");
    } finally {
      setScanning(false);
    }
  }

  function reset() {
    setAmount(""); setDescription(""); setCategory("");
    setSuccess(false); setDeleteConfirm(false);
    setScanError(""); setScanning(false); setWasScanned(false);
  }

  function handleClose() { reset(); onClose(); }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 sheet-backdrop z-[55]"
            onClick={handleClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white rounded-t-3xl z-[60] shadow-2xl flex flex-col"
            style={{ maxHeight: "92dvh" }}
          >
            {/* Handle — never scrolls away */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 bg-neutral-200 rounded-full" />
            </div>

            {success ? (
              <SuccessState isEdit={isEdit} type={type} amount={amount} />
            ) : (
              <div
                className="overflow-y-auto overscroll-contain px-5 pt-3 relative"
                style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom, 2rem))" }}
              >
                {/* Scanning overlay */}
                <AnimatePresence>
                  {scanning && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 z-20 bg-white/92 backdrop-blur-sm rounded-t-3xl flex flex-col items-center justify-center gap-4"
                    >
                      <div className="relative">
                        {/* Pulsing ring */}
                        <motion.div
                          animate={{ scale: [1, 1.18, 1], opacity: [0.5, 0.2, 0.5] }}
                          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                          className="absolute inset-0 rounded-full bg-spal-blue"
                        />
                        <div className="relative w-14 h-14 rounded-full bg-spal-blue/10 border-2 border-spal-blue flex items-center justify-center">
                          <svg className="w-6 h-6 text-spal-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-spal-navy">Reading receipt…</p>
                        <p className="text-xs text-neutral-400 mt-1">SPAL is scanning your image</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleScanFile}
                />

                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-spal-navy font-[family-name:var(--font-satoshi)]">
                    {emoji} {isEdit ? `Edit ${label}` : `Add ${label}`}
                  </h2>
                  <div className="flex items-center gap-2">
                    {/* Scan button — only in add mode */}
                    {!isEdit && (
                      <motion.button
                        whileTap={{ scale: 0.93 }}
                        onClick={() => { setScanError(""); fileInputRef.current?.click(); }}
                        disabled={scanning}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-spal-blue-50 text-spal-blue text-xs font-semibold rounded-full border border-spal-blue-100 active:bg-spal-blue-100 transition-colors disabled:opacity-40"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Scan
                      </motion.button>
                    )}
                    <button
                      onClick={handleClose}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-100 text-neutral-500"
                      aria-label="Close"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Scan error / type mismatch notice */}
                {scanError && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-2xl px-3 py-2.5"
                  >
                    <span className="text-sm flex-shrink-0 mt-0.5">⚠️</span>
                    <p className="text-xs text-amber-700 leading-relaxed">{scanError}</p>
                  </motion.div>
                )}

                {/* Amount */}
                <div className="mb-4">
                  <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wide block mb-2">
                    How much?
                  </label>
                  <div className="flex items-center gap-2 h-16 px-4 bg-neutral-50 rounded-2xl border-2 border-neutral-100 focus-within:border-spal-blue transition-colors">
                    <span className="text-2xl font-bold text-neutral-300">₦</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      placeholder="0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="flex-1 text-3xl font-bold text-spal-navy bg-transparent outline-none placeholder:text-neutral-200"
                      autoFocus={!isEdit}
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="mb-4">
                  <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wide block mb-2">
                    What was this for? <span className="text-neutral-300">(optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder={type === "sale" ? "e.g. Suya, Drinks, Rice..." : "e.g. Fuel, Stock, Salary..."}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full h-12 px-4 bg-neutral-50 rounded-2xl border-2 border-neutral-100 focus:border-spal-blue text-sm text-spal-navy placeholder:text-neutral-300 outline-none transition-colors"
                  />
                </div>

                {/* Category pills */}
                <div className="mb-5">
                  <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wide block mb-2">
                    Category
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                      <PillChip
                        key={cat}
                        label={cat}
                        size="sm"
                        color={type === "sale" ? "green" : "orange"}
                        selected={category === cat}
                        onClick={() => setCategory(cat === category ? "" : cat)}
                      />
                    ))}
                  </div>
                </div>

                {/* Save button */}
                <Button
                  fullWidth size="lg" loading={loading} disabled={!isValid}
                  className={type === "expense" ? "!bg-spal-orange !shadow-[0_4px_14px_rgba(249,115,22,0.35)]" : ""}
                  onClick={handleSave}
                >
                  {isEdit ? `Update ${label}` : `Save ${label}`} ✓
                </Button>

                {/* Delete button — only in edit mode */}
                {isEdit && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={handleDelete}
                    disabled={deleting}
                    className={`mt-3 w-full h-12 rounded-full text-sm font-semibold transition-all duration-200 ${
                      deleteConfirm
                        ? "bg-red-500 text-white"
                        : "bg-red-50 text-red-500"
                    }`}
                  >
                    {deleting ? "Deleting…" : deleteConfirm ? "Tap again to confirm delete" : "🗑️ Delete record"}
                  </motion.button>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function SuccessState({ isEdit, type, amount }: { isEdit: boolean; type: string; amount: string }) {
  const messages = {
    sale:    ["Nice one! 🎉", "Great sale! 💪", "Recorded! Keep it up! 🔥"],
    expense: ["Got it! Tracked. 👍", "Recorded! 📝", "Added to expenses ✓"],
  };
  const msg  = messages[type as keyof typeof messages];
  const text = isEdit ? "Updated! ✓" : msg[Math.floor(Math.random() * msg.length)];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-12 px-5"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", delay: 0.1 }}
        className="w-16 h-16 bg-spal-green rounded-full flex items-center justify-center text-white text-2xl mb-4"
      >
        ✓
      </motion.div>
      <p className="text-xl font-bold text-spal-navy text-center">{text}</p>
      <p className="text-neutral-400 text-sm mt-1">₦{parseFloat(amount).toLocaleString()}</p>
    </motion.div>
  );
}

