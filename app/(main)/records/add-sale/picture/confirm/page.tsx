"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, RotateCcw, Plus } from "lucide-react";
import { useSPALStore } from "@/store";
import { formatCurrency } from "@/lib/utils/currency";

const BG = "#F7F9F5";
const fontFamily = "var(--font-satoshi)";

interface ExtractedItem {
  name: string;
  qty: number;
  unitPrice: number;
  amount: number;
  category: string;
}

export default function PictureConfirmPage() {
  const router = useRouter();
  const { bumpRecordSaved } = useSPALStore();

  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ExtractedItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const b64 = sessionStorage.getItem("spal_receipt_b64");
    const fileType = sessionStorage.getItem("spal_receipt_file_type") ?? "image/jpeg";
    if (!b64) { router.replace("/records/add-sale/picture"); return; }
    setPreview(`data:${fileType};base64,${b64}`);

    async function scan() {
      try {
        const byteChars = atob(b64!);
        const byteArr = new Uint8Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) byteArr[i] = byteChars.charCodeAt(i);
        const blob = new Blob([byteArr], { type: fileType });

        const fd = new FormData();
        fd.append("image", blob, "receipt.jpg");
        const res = await fetch("/api/ai/scan-receipt", { method: "POST", body: fd });
        const data = await res.json();
        const raw = data.data ?? data;
        const extracted = Array.isArray(raw) ? raw : [raw];
        setItems(
          extracted.map((r: { description?: string; amount?: number; category?: string }) => ({
            name: r.description ?? "Item",
            qty: 1,
            unitPrice: r.amount ?? 0,
            amount: r.amount ?? 0,
            category: r.category ?? "Sales",
          }))
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not read receipt. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    scan();
  }, [router]);

  const totalAmount = items.reduce((s, it) => s + it.amount, 0);
  const totalUnits = items.reduce((s, it) => s + it.qty, 0);

  async function handleSave() {
    if (items.length === 0 || saving) return;
    setSaving(true);
    try {
      const responses = await Promise.all(
        items.map((it) =>
          fetch("/api/records", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "sale",
              amount: it.amount,
              description: it.name,
              category: it.category ?? "Sales",
              input_method: "picture",
              record_date: new Date().toISOString().slice(0, 10),
            }),
          })
        )
      );
      const failed = responses.find((r) => !r.ok);
      if (failed) {
        const err = await failed.json().catch(() => ({}));
        throw new Error(err.error ?? `Server error ${failed.status}`);
      }
      sessionStorage.removeItem("spal_receipt_b64");
      sessionStorage.removeItem("spal_receipt_file_type");
      bumpRecordSaved();
      router.refresh();
      router.push("/home");
    } catch {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-full pb-36" style={{ background: BG, fontFamily }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-12 pb-4">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-transform"
          style={{ background: "rgba(15,23,42,0.06)" }}
          aria-label="Back"
        >
          <ArrowLeft size={18} strokeWidth={2} />
        </button>
        <span className="text-[16px] font-semibold text-spal-navy" style={{ fontFamily }}>
          Picture Upload Confirmation
        </span>
      </div>

      <div className="px-5">
        {/* Thumbnail */}
        {preview && (
          <div className="relative rounded-2xl overflow-hidden" style={{ maxHeight: 180 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Receipt" className="w-full object-cover" style={{ maxHeight: 180 }} />
            <div className="absolute inset-0 flex">
              <button
                onClick={() => router.back()}
                className="flex-1 flex items-center justify-center gap-1.5 transition-opacity"
                style={{ background: "rgba(0,0,0,0.45)" }}
                aria-label="Retake photo"
              >
                <RotateCcw size={16} strokeWidth={2} color="#fff" />
                <span className="text-[12px] font-semibold text-white" style={{ fontFamily }}>Retake</span>
              </button>
              <button
                onClick={() => router.back()}
                className="flex-1 flex items-center justify-center gap-1.5 transition-opacity"
                style={{ background: "rgba(34,197,94,0.6)" }}
                aria-label="Add another photo"
              >
                <Plus size={16} strokeWidth={2} color="#fff" />
                <span className="text-[12px] font-semibold text-white" style={{ fontFamily }}>Add Photo</span>
              </button>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="mt-4 rounded-2xl px-4 py-3.5 flex items-center gap-3" style={{ background: "#E8F5E9" }}>
            <div className="w-4 h-4 rounded-full border-2 border-green-600 border-t-transparent animate-spin" />
            <p className="text-[12.5px] font-medium" style={{ fontFamily, color: "#2E7D32" }}>
              SPAL is reading your receipt...
            </p>
          </div>
        )}

        {/* Error */}
        <AnimatePresence>
          {error && !loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 rounded-2xl px-4 py-3.5"
              style={{ background: "#FEF2F2" }}
            >
              <p className="text-[12.5px] font-medium" style={{ fontFamily, color: "#B91C1C" }}>
                ⚠️ {error}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {!loading && items.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <div className="mt-4 rounded-2xl px-4 py-3.5" style={{ background: "#E8F5E9" }}>
                <p className="text-[12.5px] font-medium" style={{ fontFamily, color: "#2E7D32" }}>
                  💡 SPAL found {items.length} {items.length === 1 ? "item" : "items"} for you to review
                </p>
              </div>

              <p className="mt-3 text-right text-[11px] text-neutral-400" style={{ fontFamily }}>
                swipe left or right to edit/delete →
              </p>

              <div className="mt-2 space-y-2.5">
                {items.map((item, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl px-4 py-4 flex items-center gap-3"
                    style={{
                      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                      border: i === 0 ? "1.5px solid #22C55E" : "1.5px solid transparent",
                    }}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#E8F5E9" }}>
                      <span className="text-lg">🍽️</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-spal-navy truncate" style={{ fontFamily }}>{item.name}</p>
                      <span
                        className="inline-block mt-0.5 text-[10px] font-medium px-2 py-0.5 rounded-full"
                        style={{ background: "#F0FDF4", color: "#16A34A" }}
                      >
                        {item.category}
                      </span>
                    </div>
                    <p className="text-[15px] font-bold flex-shrink-0" style={{ fontFamily, color: "#22C55E" }}>
                      {formatCurrency(item.amount)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Add Another Item */}
              <button
                className="mt-3 w-full h-11 rounded-xl bg-white flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                style={{ border: "1.5px dashed #E5E7EB" }}
              >
                <Plus size={15} strokeWidth={2.5} color="#22C55E" />
                <span className="text-[13px] font-semibold" style={{ fontFamily, color: "#22C55E" }}>+ Add Another Item</span>
              </button>

              {/* Summary */}
              <div className="mt-4 rounded-2xl px-4 py-4 flex items-center justify-between" style={{ background: "#E8F5E9" }}>
                <div>
                  <p className="text-[12px] text-green-700 font-medium" style={{ fontFamily }}>
                    {items.length} {items.length === 1 ? "item" : "items"} · {totalUnits} units sold
                  </p>
                  <p className="text-[13px] text-green-800 font-semibold mt-0.5" style={{ fontFamily }}>Total Sale</p>
                </div>
                <p className="text-[20px] font-bold" style={{ fontFamily, color: "#16A34A" }}>
                  {formatCurrency(totalAmount)}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Fixed CTA */}
      {!loading && items.length > 0 && (
        <div
          className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-5 pb-6 pt-3"
          style={{ background: "linear-gradient(to top, #F7F9F5 80%, transparent)" }}
        >
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-14 rounded-2xl font-semibold text-[15px] text-white flex items-center justify-center active:scale-[0.98] transition-all disabled:opacity-40"
            style={{ fontFamily, background: "#22C55E" }}
          >
            {saving ? "Saving..." : "Confirm & Save"}
          </button>
        </div>
      )}
    </div>
  );
}
