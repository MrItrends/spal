"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Plus, Minus, Settings, Package,
  AlertTriangle, Check, ChevronDown, X, Trash2,
} from "lucide-react";
import { useSPALStore } from "@/store";
import { getInventoryConfig } from "@/lib/inventory-config";
import { formatCurrency } from "@/lib/utils/currency";
import type { InventoryItem } from "@/lib/types";

const BG         = "#F7F9F5";
const fontFamily = "var(--font-satoshi)";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function isLow(item: InventoryItem) {
  return item.quantity <= item.low_stock_threshold;
}

function fmtQty(n: number) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1).replace(/\.0$/, "");
}

// ─────────────────────────────────────────────────────────────────────────────
// Unit picker dropdown
// ─────────────────────────────────────────────────────────────────────────────
function UnitPicker({
  value, units, onChange,
}: { value: string; units: string[]; onChange: (v: string) => void }) {
  const [open, setOpen]       = useState(false);
  const [custom, setCustom]   = useState(!units.includes(value) ? value : "");
  const [typing, setTyping]   = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => { setOpen((o) => !o); setTyping(false); }}
        className="h-full flex items-center gap-1 px-3 rounded-xl text-[13px] font-semibold active:scale-95 transition-transform"
        style={{ background: "#F3F4F6", color: "#374151", minWidth: 72 }}
      >
        {value || "unit"}
        <ChevronDown size={13} strokeWidth={2.5} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-1 bg-white rounded-2xl overflow-hidden z-50"
            style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.12)", minWidth: 140 }}
          >
            {units.map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => { onChange(u); setOpen(false); setCustom(""); }}
                className="w-full px-4 py-2.5 text-left text-[13px] hover:bg-gray-50 flex items-center justify-between"
                style={{ fontFamily }}
              >
                {u}
                {u === value && <Check size={13} strokeWidth={2.5} color="#22C55E" />}
              </button>
            ))}
            <div className="border-t border-gray-100 px-3 py-2">
              {typing ? (
                <input
                  autoFocus
                  value={custom}
                  onChange={(e) => setCustom(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && custom.trim()) {
                      onChange(custom.trim()); setOpen(false); setTyping(false);
                    }
                  }}
                  placeholder="Type custom unit…"
                  className="w-full text-[12px] outline-none py-1"
                  style={{ fontFamily }}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setTyping(true)}
                  className="text-[12px] font-semibold"
                  style={{ color: "#22C55E" }}
                >
                  + Custom unit
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Add / Edit item bottom sheet
// ─────────────────────────────────────────────────────────────────────────────
interface SheetItem {
  name: string;
  quantity: string;
  unit: string;
  threshold: string;
  costPrice: string;
  showThreshold: boolean;
  showCost: boolean;
  wasBought: boolean | null; // null = not asked yet
}

function defaultSheet(unit: string): SheetItem {
  return { name: "", quantity: "", unit, threshold: "5", costPrice: "",
           showThreshold: false, showCost: false, wasBought: null };
}

interface AddItemSheetProps {
  item?: InventoryItem | null;
  units: string[];
  defaultUnit: string;
  itemLabel: string;
  onSave: (data: Partial<InventoryItem> & { logExpense?: boolean }) => Promise<void>;
  onDelete?: () => Promise<void>;
  onClose: () => void;
}

function AddItemSheet({ item, units, defaultUnit, itemLabel, onSave, onDelete, onClose }: AddItemSheetProps) {
  const [form, setForm] = useState<SheetItem>(
    item
      ? {
          name: item.name,
          quantity: fmtQty(item.quantity),
          unit: item.unit,
          threshold: fmtQty(item.low_stock_threshold),
          costPrice: item.cost_price != null ? String(item.cost_price) : "",
          showThreshold: true,
          showCost: item.cost_price != null,
          wasBought: null,
        }
      : defaultSheet(defaultUnit)
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [step, setStep] = useState<"form" | "expense-ask" | "expense-confirm">("form");

  const set = (k: keyof SheetItem, v: unknown) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function handleSave() {
    if (!form.name.trim() || !form.quantity || !form.unit) return;
    const qty   = parseFloat(form.quantity);
    const cost  = form.showCost && form.costPrice ? parseFloat(form.costPrice) : null;

    // If user entered a cost and didn't answer "did you buy this?"
    if (cost && form.wasBought === null && !item) {
      setStep("expense-ask");
      return;
    }

    setSaving(true);
    await onSave({
      name:                form.name.trim(),
      quantity:            qty,
      unit:                form.unit,
      low_stock_threshold: form.showThreshold ? parseFloat(form.threshold) || 5 : 5,
      cost_price:          cost,
      logExpense:          cost != null && form.wasBought === true,
    });
    setSaving(false);
  }

  async function handleDelete() {
    if (!onDelete) return;
    setDeleting(true);
    await onDelete();
    setDeleting(false);
  }

  const isEdit  = !!item;
  const isValid = form.name.trim() && form.quantity && form.unit;

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
      className="fixed inset-x-0 bottom-0 z-[60] flex justify-center"
    >
      <div
        className="w-full max-w-[480px] rounded-t-[28px] bg-white pb-safe"
        style={{ boxShadow: "0 -8px 40px rgba(0,0,0,0.14)" }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-9 h-1 rounded-full bg-gray-200" />
        </div>

        {step === "form" && (
          <div className="px-5 pt-2 pb-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[18px] font-bold text-spal-navy" style={{ fontFamily }}>
                {isEdit ? "Edit" : "Add"} {itemLabel}
              </h2>
              <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "rgba(15,23,42,0.06)" }} aria-label="Close">
                <X size={16} strokeWidth={2} />
              </button>
            </div>

            {/* Name */}
            <div className="mb-3">
              <label className="text-[11px] font-bold tracking-widest uppercase text-neutral-400 mb-1.5 block" style={{ fontFamily }}>
                Name
              </label>
              <input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder={`e.g. Palm Oil, Beer, Shoes…`}
                className="w-full bg-white border rounded-2xl px-4 py-3 text-[14px] text-spal-navy outline-none"
                style={{ fontFamily, borderColor: form.name ? "#22C55E" : "#E5E7EB",
                         boxShadow: form.name ? "0 0 0 2px rgba(34,197,94,0.12)" : "none" }}
                autoFocus
              />
            </div>

            {/* Quantity + Unit */}
            <div className="mb-3">
              <label className="text-[11px] font-bold tracking-widest uppercase text-neutral-400 mb-1.5 block" style={{ fontFamily }}>
                Quantity
              </label>
              <div className="flex items-center gap-2 bg-white border rounded-2xl px-4 py-3"
                style={{ borderColor: "#E5E7EB" }}>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={form.quantity}
                  onChange={(e) => set("quantity", e.target.value)}
                  placeholder="0"
                  className="flex-1 text-[14px] text-spal-navy outline-none bg-transparent"
                  style={{ fontFamily }}
                />
                <UnitPicker value={form.unit} units={units} onChange={(v) => set("unit", v)} />
              </div>
            </div>

            {/* Low stock threshold toggle */}
            <button
              type="button"
              onClick={() => set("showThreshold", !form.showThreshold)}
              className="flex items-center gap-2 mb-3 active:opacity-70 transition-opacity"
            >
              <div className="w-5 h-5 rounded-md flex items-center justify-center"
                style={{ background: form.showThreshold ? "#22C55E" : "#E5E7EB" }}>
                {form.showThreshold && <Check size={11} strokeWidth={3} color="#fff" />}
              </div>
              <span className="text-[13px] font-medium text-neutral-600" style={{ fontFamily }}>
                Set low stock alert
              </span>
            </button>

            <AnimatePresence>
              {form.showThreshold && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-3">
                  <div className="flex items-center gap-2 bg-white border rounded-2xl px-4 py-3"
                    style={{ borderColor: "#E5E7EB" }}>
                    <span className="text-[13px] text-neutral-400 flex-shrink-0" style={{ fontFamily }}>Alert me when below</span>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={form.threshold}
                      onChange={(e) => set("threshold", e.target.value)}
                      className="w-16 text-[14px] text-spal-navy outline-none text-center bg-transparent"
                      style={{ fontFamily }}
                    />
                    <span className="text-[13px] text-neutral-400" style={{ fontFamily }}>{form.unit}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Cost per unit toggle */}
            <button
              type="button"
              onClick={() => set("showCost", !form.showCost)}
              className="flex items-center gap-2 mb-3 active:opacity-70 transition-opacity"
            >
              <div className="w-5 h-5 rounded-md flex items-center justify-center"
                style={{ background: form.showCost ? "#22C55E" : "#E5E7EB" }}>
                {form.showCost && <Check size={11} strokeWidth={3} color="#fff" />}
              </div>
              <span className="text-[13px] font-medium text-neutral-600" style={{ fontFamily }}>
                Add cost per unit <span className="text-neutral-400">(optional)</span>
              </span>
            </button>

            <AnimatePresence>
              {form.showCost && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-3">
                  <div className="flex items-center gap-2 bg-white border rounded-2xl px-4 py-3"
                    style={{ borderColor: "#E5E7EB" }}>
                    <span className="text-[13px] font-semibold text-spal-navy" style={{ fontFamily }}>₦</span>
                    <input
                      type="number"
                      min="0"
                      value={form.costPrice}
                      onChange={(e) => set("costPrice", e.target.value)}
                      placeholder="0.00"
                      className="flex-1 text-[14px] text-spal-navy outline-none bg-transparent"
                      style={{ fontFamily }}
                    />
                    <span className="text-[12px] text-neutral-400" style={{ fontFamily }}>per {form.unit}</span>
                  </div>
                  <p className="text-[11.5px] text-neutral-400 mt-1.5 px-1" style={{ fontFamily }}>
                    Helps SPAL track your profit per item over time.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Delete (edit mode) */}
            {isEdit && onDelete && (
              <button onClick={handleDelete} disabled={deleting}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl mb-3 active:scale-[0.98] transition-all"
                style={{ background: "#FEF2F2" }}>
                <Trash2 size={15} strokeWidth={2} color="#EF4444" />
                <span className="text-[13px] font-semibold" style={{ fontFamily, color: "#EF4444" }}>
                  {deleting ? "Deleting…" : "Delete item"}
                </span>
              </button>
            )}

            <button
              onClick={handleSave}
              disabled={!isValid || saving}
              className="w-full h-14 rounded-2xl font-semibold text-[15px] text-white flex items-center justify-center active:scale-[0.98] transition-all disabled:opacity-40"
              style={{ fontFamily, background: "#22C55E" }}
            >
              {saving ? "Saving…" : isEdit ? "Save Changes" : "Add to Inventory"}
            </button>
          </div>
        )}

        {step === "expense-ask" && (
          <div className="px-5 pt-2 pb-8">
            <h2 className="text-[18px] font-bold text-spal-navy mb-2" style={{ fontFamily }}>
              Did you already buy this?
            </h2>
            <p className="text-[13px] text-neutral-500 leading-relaxed mb-6" style={{ fontFamily }}>
              You added a cost of {formatCurrency(parseFloat(form.costPrice) || 0)} per {form.unit}.
              This helps us understand whether to count this as an expense in your profit calculation.
            </p>

            <div className="space-y-3 mb-6">
              <button
                onClick={() => { set("wasBought", true); setStep("expense-confirm"); }}
                className="w-full rounded-2xl px-4 py-4 text-left flex items-start gap-3 active:scale-[0.98] transition-transform"
                style={{ background: "#F0FDF4", border: "1.5px solid #BBF7D0" }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: "#22C55E" }}>
                  <Check size={17} strokeWidth={2.5} color="#fff" />
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-spal-navy" style={{ fontFamily }}>
                    Yes, I bought it recently
                  </p>
                  <p className="text-[12px] text-neutral-500 mt-0.5" style={{ fontFamily }}>
                    The cost will be logged as an expense
                  </p>
                </div>
              </button>

              <button
                onClick={() => { set("wasBought", false); setSaving(true);
                  onSave({ name: form.name.trim(), quantity: parseFloat(form.quantity), unit: form.unit,
                           low_stock_threshold: form.showThreshold ? parseFloat(form.threshold) || 5 : 5,
                           cost_price: parseFloat(form.costPrice), logExpense: false }).finally(() => setSaving(false)); }}
                className="w-full rounded-2xl px-4 py-4 text-left flex items-start gap-3 active:scale-[0.98] transition-transform"
                style={{ background: "#F9FAFB", border: "1.5px solid #E5E7EB" }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: "#F3F4F6" }}>
                  <Package size={17} strokeWidth={2} color="#6B7280" />
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-spal-navy" style={{ fontFamily }}>
                    No, I had this before I started SPAL
                  </p>
                  <p className="text-[12px] text-neutral-500 mt-0.5" style={{ fontFamily }}>
                    Just track the quantity, no expense recorded
                  </p>
                </div>
              </button>
            </div>

            <button onClick={() => setStep("form")}
              className="text-[13px] font-semibold text-neutral-400 w-full text-center active:opacity-60">
              ← Go back
            </button>
          </div>
        )}

        {step === "expense-confirm" && (
          <div className="px-5 pt-2 pb-8">
            <h2 className="text-[18px] font-bold text-spal-navy mb-2" style={{ fontFamily }}>
              Log cost as expense?
            </h2>
            <p className="text-[13px] text-neutral-500 leading-relaxed mb-2" style={{ fontFamily }}>
              SPAL will record the cost of this inventory as an expense. This affects your profit
              for today — which is usually the right thing to do if you just bought this stock.
            </p>
            <div className="rounded-2xl px-4 py-3.5 mb-6" style={{ background: "#FFF7ED" }}>
              <p className="text-[12.5px] leading-relaxed" style={{ fontFamily, color: "#C2410C" }}>
                💡 You can always adjust or delete the expense later from your Records page if needed.
              </p>
            </div>
            <div className="space-y-3">
              <button
                disabled={saving}
                onClick={() => { setSaving(true);
                  onSave({ name: form.name.trim(), quantity: parseFloat(form.quantity), unit: form.unit,
                           low_stock_threshold: form.showThreshold ? parseFloat(form.threshold) || 5 : 5,
                           cost_price: parseFloat(form.costPrice), logExpense: true }).finally(() => setSaving(false)); }}
                className="w-full h-14 rounded-2xl font-semibold text-[15px] text-white flex items-center justify-center active:scale-[0.98] disabled:opacity-40"
                style={{ fontFamily, background: "#22C55E" }}
              >
                {saving ? "Saving…" : "Yes, log as expense"}
              </button>
              <button
                onClick={() => { setSaving(true);
                  onSave({ name: form.name.trim(), quantity: parseFloat(form.quantity), unit: form.unit,
                           low_stock_threshold: form.showThreshold ? parseFloat(form.threshold) || 5 : 5,
                           cost_price: parseFloat(form.costPrice), logExpense: false }).finally(() => setSaving(false)); }}
                className="w-full h-12 rounded-2xl font-semibold text-[14px] active:scale-[0.98]"
                style={{ fontFamily, color: "#6B7280", background: "#F3F4F6" }}
              >
                Skip for now
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Settings bottom sheet
// ─────────────────────────────────────────────────────────────────────────────
function SettingsSheet({
  trackSales, isIngredientBased, onToggle, onClose,
}: { trackSales: boolean; isIngredientBased: boolean; onToggle: (v: boolean) => void; onClose: () => void }) {
  const [toggling, setToggling] = useState(false);

  async function toggle() {
    setToggling(true);
    await onToggle(!trackSales);
    setToggling(false);
  }

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
      className="fixed inset-x-0 bottom-0 z-[60] flex justify-center"
    >
      <div className="w-full max-w-[480px] rounded-t-[28px] bg-white pb-safe"
        style={{ boxShadow: "0 -8px 40px rgba(0,0,0,0.14)" }}>
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-9 h-1 rounded-full bg-gray-200" />
        </div>
        <div className="px-5 pt-2 pb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[18px] font-bold text-spal-navy" style={{ fontFamily }}>Inventory Settings</h2>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: "rgba(15,23,42,0.06)" }} aria-label="Close">
              <X size={16} strokeWidth={2} />
            </button>
          </div>

          {/* Track from sales toggle */}
          <div className="bg-white rounded-2xl p-4" style={{ border: "1.5px solid #E5E7EB" }}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <p className="text-[14px] font-semibold text-spal-navy" style={{ fontFamily }}>
                  Deduct from inventory on sale
                </p>
                <p className="text-[12px] text-neutral-400 mt-0.5 leading-relaxed" style={{ fontFamily }}>
                  {isIngredientBased
                    ? "When you record a sale, SPAL will ask which supplies you used so you can update your stock."
                    : "When you save a sale, SPAL will ask if you want to deduct the items from your inventory."}
                </p>
              </div>
              <button
                onClick={toggle}
                disabled={toggling}
                className="flex-shrink-0 w-12 h-6 rounded-full transition-all duration-200 relative disabled:opacity-50"
                style={{ background: trackSales ? "#22C55E" : "#D1D5DB" }}
                aria-label="Toggle"
              >
                <motion.div
                  animate={{ x: trackSales ? 24 : 2 }}
                  transition={{ duration: 0.18 }}
                  className="absolute top-[3px] w-[18px] h-[18px] bg-white rounded-full"
                  style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }}
                />
              </button>
            </div>
          </div>

          <p className="text-[11.5px] text-neutral-400 mt-3 px-1 leading-relaxed" style={{ fontFamily }}>
            {trackSales
              ? "✅ On — SPAL will prompt you to update inventory after each sale."
              : "This is off. You can update your inventory manually anytime by tapping + or − on an item."}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Setup Wizard
// ─────────────────────────────────────────────────────────────────────────────
interface WizardItem { name: string; qty: string; unit: string; selected: boolean }

function SetupWizard({
  config, onComplete,
}: { config: ReturnType<typeof getInventoryConfig>; onComplete: () => void }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [items, setItems] = useState<WizardItem[]>(
    config.suggestions.map((s) => ({ name: s, qty: "", unit: config.units[0], selected: false }))
  );
  const [customName, setCustomName] = useState("");
  const [saving, setSaving] = useState(false);

  const selected = items.filter((i) => i.selected);

  function toggleItem(idx: number) {
    setItems((prev) => prev.map((it, i) => i === idx ? { ...it, selected: !it.selected } : it));
  }

  function addCustom() {
    if (!customName.trim()) return;
    setItems((prev) => [...prev, { name: customName.trim(), qty: "", unit: config.units[0], selected: true }]);
    setCustomName("");
  }

  function updateItem(idx: number, field: "qty" | "unit", val: string) {
    const realIdx = items.findIndex((it) => it === selected[idx]);
    setItems((prev) => prev.map((it, i) => i === realIdx ? { ...it, [field]: val } : it));
  }

  async function handleFinish() {
    if (saving) return;
    setSaving(true);
    const payload = selected.map((it) => ({
      name:     it.name,
      quantity: parseFloat(it.qty) || 0,
      unit:     it.unit,
    }));

    const res = await fetch("/api/inventory", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: payload }),
    });
    if (res.ok) onComplete();
    else setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-[50] flex items-end justify-center" style={{ background: "rgba(10,14,26,0.6)" }}>
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
        className="w-full max-w-[480px] rounded-t-[28px] bg-white pb-safe overflow-hidden"
        style={{ maxHeight: "90vh", overflowY: "auto" }}
      >
        {/* Progress bar */}
        <div className="flex gap-1.5 px-5 pt-5 mb-5">
          {[1, 2].map((s) => (
            <div key={s} className="h-1 flex-1 rounded-full transition-all duration-300"
              style={{ background: s <= step ? "#22C55E" : "#E5E7EB" }} />
          ))}
        </div>

        {step === 1 && (
          <div className="px-5 pb-8">
            <p className="text-[11px] font-bold tracking-widest uppercase text-neutral-400 mb-1" style={{ fontFamily }}>
              Step 1 of 2
            </p>
            <h2 className="text-[22px] font-bold text-spal-navy mb-1.5" style={{ fontFamily }}>
              What do you track?
            </h2>
            <p className="text-[13px] text-neutral-500 leading-relaxed mb-5" style={{ fontFamily }}>
              {config.setupPrompt}
            </p>

            {/* Suggested items */}
            <div className="flex flex-wrap gap-2 mb-5">
              {items.map((it, idx) => (
                <button
                  key={idx}
                  onClick={() => toggleItem(idx)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13px] font-medium transition-all active:scale-95"
                  style={{
                    fontFamily,
                    background: it.selected ? "#22C55E" : "#fff",
                    color:      it.selected ? "#fff" : "#374151",
                    border:     `1.5px solid ${it.selected ? "#22C55E" : "#E5E7EB"}`,
                  }}
                >
                  {it.selected && <Check size={12} strokeWidth={3} />}
                  {it.name}
                </button>
              ))}
            </div>

            {/* Add custom */}
            <div className="flex gap-2 mb-6">
              <input
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCustom()}
                placeholder="Add your own…"
                className="flex-1 bg-white border rounded-2xl px-4 py-2.5 text-[13px] text-spal-navy outline-none"
                style={{ fontFamily, borderColor: "#E5E7EB" }}
              />
              <button
                onClick={addCustom}
                disabled={!customName.trim()}
                className="w-10 h-10 rounded-xl flex items-center justify-center disabled:opacity-40 active:scale-95"
                style={{ background: "#22C55E" }}
              >
                <Plus size={18} strokeWidth={2.5} color="#fff" />
              </button>
            </div>

            <button
              onClick={() => step === 1 && selected.length > 0 ? setStep(2) : onComplete()}
              className="w-full h-14 rounded-2xl font-semibold text-[15px] text-white flex items-center justify-center active:scale-[0.98] transition-all"
              style={{ fontFamily, background: "#22C55E" }}
            >
              {selected.length === 0 ? "Skip for now" : `Next — ${selected.length} item${selected.length !== 1 ? "s" : ""} selected`}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="px-5 pb-8">
            <p className="text-[11px] font-bold tracking-widest uppercase text-neutral-400 mb-1" style={{ fontFamily }}>
              Step 2 of 2
            </p>
            <h2 className="text-[22px] font-bold text-spal-navy mb-1.5" style={{ fontFamily }}>
              How much do you have?
            </h2>
            <p className="text-[13px] text-neutral-500 leading-relaxed mb-5" style={{ fontFamily }}>
              Enter your current stock for each item. You can always update this later.
            </p>

            <div className="space-y-3 mb-6">
              {selected.map((it, idx) => (
                <div key={idx} className="bg-white rounded-2xl px-4 py-3.5"
                  style={{ border: "1.5px solid #E5E7EB" }}>
                  <p className="text-[13.5px] font-semibold text-spal-navy mb-2" style={{ fontFamily }}>{it.name}</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={it.qty}
                      onChange={(e) => updateItem(idx, "qty", e.target.value)}
                      placeholder="0"
                      className="flex-1 bg-gray-50 rounded-xl px-3 py-2 text-[14px] text-spal-navy outline-none"
                      style={{ fontFamily }}
                    />
                    <UnitPicker value={it.unit} units={config.units} onChange={(v) => updateItem(idx, "unit", v)} />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)}
                className="h-14 px-5 rounded-2xl font-semibold text-[14px] active:scale-[0.98]"
                style={{ fontFamily, background: "#F3F4F6", color: "#374151" }}>
                Back
              </button>
              <button
                onClick={handleFinish}
                disabled={saving}
                className="flex-1 h-14 rounded-2xl font-semibold text-[15px] text-white flex items-center justify-center active:scale-[0.98] disabled:opacity-40"
                style={{ fontFamily, background: "#22C55E" }}
              >
                {saving ? "Setting up…" : "Done — Set up my inventory"}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────
type Filter = "all" | "low";

export default function InventoryPage() {
  const router = useRouter();
  const { user } = useSPALStore();
  const config = getInventoryConfig(user?.business_type);

  const [items,      setItems]      = useState<InventoryItem[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [setupDone,  setSetupDone]  = useState(false);
  const [trackSales, setTrackSales] = useState(false);
  const [filter,     setFilter]     = useState<Filter>("all");

  const [showAdd,      setShowAdd]      = useState(false);
  const [editItem,     setEditItem]     = useState<InventoryItem | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [adjusting,    setAdjusting]    = useState<Record<string, boolean>>({});

  const fetchInventory = useCallback(async () => {
    try {
      const res  = await fetch("/api/inventory");
      const data = await res.json();
      if (data.success) {
        setItems(data.data.items);
        setSetupDone(data.data.setupDone);
        setTrackSales(data.data.trackSales);
      }
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  const lowItems     = items.filter(isLow);
  const filtered     = filter === "low" ? lowItems : items;

  // ── Quick adjust ────────────────────────────────────────────────────────────
  async function quickAdjust(item: InventoryItem, delta: number) {
    const newQty = Math.max(0, item.quantity + delta);
    setAdjusting((a) => ({ ...a, [item.id]: true }));
    setItems((prev) => prev.map((it) => it.id === item.id ? { ...it, quantity: newQty } : it));
    await fetch(`/api/inventory/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity: newQty }),
    });
    setAdjusting((a) => ({ ...a, [item.id]: false }));
  }

  // ── Save item (add or edit) ─────────────────────────────────────────────────
  async function handleSaveItem(
    data: Partial<InventoryItem> & { logExpense?: boolean }
  ) {
    const { logExpense, ...itemData } = data;
    const id = editItem?.id;

    if (id) {
      const res = await fetch(`/api/inventory/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(itemData),
      });
      if (res.ok) {
        const updated = (await res.json()).data as InventoryItem;
        setItems((prev) => prev.map((it) => it.id === id ? updated : it));
      }
    } else {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(itemData),
      });
      if (!res.ok) return;
      const created = (await res.json()).data as InventoryItem;
      setItems((prev) => [...prev, created]);

      // Optionally log cost as expense
      if (logExpense && itemData.cost_price && itemData.quantity) {
        await fetch("/api/records", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "expense",
            amount: itemData.cost_price * itemData.quantity,
            description: `Restocked: ${itemData.name}`,
            category: "Inventory",
            input_method: "manual",
            record_date: new Date().toISOString().slice(0, 10),
          }),
        });
      }
    }

    setShowAdd(false);
    setEditItem(null);
  }

  // ── Delete item ─────────────────────────────────────────────────────────────
  async function handleDeleteItem() {
    if (!editItem) return;
    await fetch(`/api/inventory/${editItem.id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((it) => it.id !== editItem.id));
    setEditItem(null);
  }

  // ── Toggle track sales ──────────────────────────────────────────────────────
  async function handleToggleTrackSales(val: boolean) {
    setTrackSales(val);
    await fetch("/api/inventory", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inventory_track_sales: val }),
    });
  }

  // ── Wizard complete ─────────────────────────────────────────────────────────
  async function handleWizardComplete() {
    setSetupDone(true);
    await fetchInventory();
  }

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center" style={{ background: BG }}>
        <div className="w-6 h-6 rounded-full border-2 border-spal-green border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-full pb-32" style={{ background: BG, fontFamily }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-12 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-transform"
              style={{ background: "rgba(15,23,42,0.06)" }}
              aria-label="Back"
            >
              <ArrowLeft size={18} strokeWidth={2} />
            </button>
            <div>
              <h1 className="text-[20px] font-bold text-spal-navy" style={{ fontFamily }}>{config.title}</h1>
              {items.length > 0 && (
                <p className="text-[12px] text-neutral-400 mt-0.5" style={{ fontFamily }}>
                  {items.length} item{items.length !== 1 ? "s" : ""} · {lowItems.length} low
                </p>
              )}
            </div>
          </div>
          {setupDone && (
            <button
              onClick={() => setShowSettings(true)}
              className="w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-transform"
              style={{ background: "rgba(15,23,42,0.06)" }}
              aria-label="Inventory settings"
            >
              <Settings size={18} strokeWidth={2} />
            </button>
          )}
        </div>

        {/* Low stock banner */}
        <AnimatePresence>
          {lowItems.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="mx-5 mb-4 rounded-2xl px-4 py-3.5 flex items-center gap-3"
              style={{ background: "#FFF7ED", border: "1.5px solid #FED7AA" }}
            >
              <AlertTriangle size={18} strokeWidth={2} color="#F97316" className="flex-shrink-0" />
              <p className="text-[12.5px] font-medium leading-snug" style={{ fontFamily, color: "#C2410C" }}>
                {lowItems.length === 1
                  ? `${lowItems[0].name} is running low — ${fmtQty(lowItems[0].quantity)} ${lowItems[0].unit} left.`
                  : `${lowItems.length} items are running low. Tap "Low Stock" to see them.`}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filter tabs */}
        {items.length > 0 && (
          <div className="flex gap-2 px-5 mb-4">
            {(["all", "low"] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="px-4 py-1.5 rounded-full text-[12.5px] font-semibold transition-all"
                style={{
                  fontFamily,
                  background: filter === f ? "#0F172A" : "#fff",
                  color: filter === f ? "#fff" : "#6B7280",
                  border: filter === f ? "none" : "1.5px solid #E5E7EB",
                }}
              >
                {f === "all" ? `All (${items.length})` : `Low Stock (${lowItems.length})`}
              </button>
            ))}
          </div>
        )}

        {/* Item list */}
        <div className="px-5 space-y-2.5">
          {filtered.length === 0 && setupDone && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: "#F3F4F6" }}>
                <Package size={26} strokeWidth={1.5} color="#9CA3AF" />
              </div>
              <p className="text-[15px] font-semibold text-spal-navy mb-1" style={{ fontFamily }}>
                {filter === "low" ? "No low stock items" : "No items yet"}
              </p>
              <p className="text-[13px] text-neutral-400 max-w-[220px] leading-relaxed" style={{ fontFamily }}>
                {filter === "low" ? "All your items are well stocked." : config.emptyHint}
              </p>
            </div>
          )}

          <AnimatePresence initial={false}>
            {filtered.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: i * 0.04, duration: 0.25 }}
                className="bg-white rounded-2xl px-4 py-4"
                style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
              >
                <div className="flex items-center gap-3">
                  {/* Icon */}
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: isLow(item) ? "#FFF7ED" : "#F0FDF4" }}
                  >
                    <Package
                      size={20}
                      strokeWidth={1.8}
                      color={isLow(item) ? "#F97316" : "#22C55E"}
                    />
                  </div>

                  {/* Name + badges */}
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => setEditItem(item)}
                      className="text-left w-full active:opacity-70"
                    >
                      <p className="text-[14px] font-semibold text-spal-navy truncate" style={{ fontFamily }}>
                        {item.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-[12.5px] font-medium"
                          style={{ fontFamily, color: isLow(item) ? "#F97316" : "#6B7280" }}>
                          {fmtQty(item.quantity)} {item.unit}
                        </p>
                        {isLow(item) && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: "#FFF7ED", color: "#C2410C" }}>
                            LOW
                          </span>
                        )}
                      </div>
                    </button>
                  </div>

                  {/* Quick ± */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => quickAdjust(item, -1)}
                      disabled={adjusting[item.id] || item.quantity <= 0}
                      className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-transform disabled:opacity-30"
                      style={{ background: "#F3F4F6" }}
                      aria-label={`Decrease ${item.name}`}
                    >
                      <Minus size={14} strokeWidth={2.5} color="#374151" />
                    </button>
                    <button
                      onClick={() => quickAdjust(item, 1)}
                      disabled={adjusting[item.id]}
                      className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-transform disabled:opacity-30"
                      style={{ background: "#22C55E" }}
                      aria-label={`Increase ${item.name}`}
                    >
                      <Plus size={14} strokeWidth={2.5} color="#fff" />
                    </button>
                  </div>
                </div>

                {/* Cost per unit (if set) */}
                {item.cost_price != null && (
                  <p className="text-[11px] text-neutral-300 mt-2 pl-14" style={{ fontFamily }}>
                    {formatCurrency(item.cost_price)} per {item.unit}
                    {" · "}
                    Total value: {formatCurrency(item.cost_price * item.quantity)}
                  </p>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Fixed add button */}
      {setupDone && (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-5 pb-6 pt-3"
          style={{ background: "linear-gradient(to top, #F7F9F5 80%, transparent)" }}>
          <button
            onClick={() => { setEditItem(null); setShowAdd(true); }}
            className="w-full h-14 rounded-2xl font-semibold text-[15px] text-white flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
            style={{ fontFamily, background: "#22C55E" }}
          >
            <Plus size={18} strokeWidth={2.5} />
            Add {config.itemLabel}
          </button>
        </div>
      )}

      {/* Backdrop for sheets */}
      <AnimatePresence>
        {(showAdd || editItem || showSettings) && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[55]"
            style={{ background: "rgba(10,14,26,0.5)" }}
            onClick={() => { setShowAdd(false); setEditItem(null); setShowSettings(false); }}
          />
        )}
      </AnimatePresence>

      {/* Add / Edit item sheet */}
      <AnimatePresence>
        {(showAdd || editItem) && (
          <AddItemSheet
            key={editItem?.id ?? "new"}
            item={editItem}
            units={config.units}
            defaultUnit={config.units[0]}
            itemLabel={config.itemLabel}
            onSave={handleSaveItem}
            onDelete={editItem ? handleDeleteItem : undefined}
            onClose={() => { setShowAdd(false); setEditItem(null); }}
          />
        )}
      </AnimatePresence>

      {/* Settings sheet */}
      <AnimatePresence>
        {showSettings && (
          <SettingsSheet
            trackSales={trackSales}
            isIngredientBased={config.isIngredientBased}
            onToggle={handleToggleTrackSales}
            onClose={() => setShowSettings(false)}
          />
        )}
      </AnimatePresence>

      {/* First-time setup wizard */}
      <AnimatePresence>
        {!setupDone && !loading && (
          <SetupWizard config={config} onComplete={handleWizardComplete} />
        )}
      </AnimatePresence>
    </>
  );
}
