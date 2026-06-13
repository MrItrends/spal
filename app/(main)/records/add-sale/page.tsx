"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { X, FileText, Mic, Camera, Upload, ChevronRight } from "lucide-react";

const BG = "#F7F9F5";
const fontFamily = "var(--font-satoshi)";

const METHODS = [
  {
    label: "Manual Entry",
    sub: "Type in your sale details quickly",
    href: "/records/add-sale/manual",
    icon: <FileText size={22} strokeWidth={2} color="#22C55E" />,
    iconBg: "#E8F5E9",
  },
  {
    label: "Voice Entry",
    sub: "Just talk, Let SPAL handle the rest",
    href: "/records/add-sale/voice",
    icon: <Mic size={22} strokeWidth={2} color="#F97316" />,
    iconBg: "#FFF3E0",
  },
  {
    label: "Picture Upload",
    sub: "Snap a receipt or handwritten note",
    href: "/records/add-sale/picture",
    icon: <Camera size={22} strokeWidth={2} color="#8B5CF6" />,
    iconBg: "#EDE9FE",
  },
  {
    label: "Import Entry",
    sub: "Upload a spreadsheet or file",
    href: "/records/add-sale/import",
    icon: <Upload size={22} strokeWidth={2} color="#2563EB" />,
    iconBg: "#EFF6FF",
  },
];

export default function AddSalePage() {
  const router = useRouter();

  return (
    <div className="min-h-full" style={{ background: BG, fontFamily }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-12 pb-4">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-transform"
          style={{ background: "rgba(15,23,42,0.06)" }}
          aria-label="Close"
        >
          <X size={18} strokeWidth={2} />
        </button>
        <span className="text-[16px] font-semibold text-spal-navy" style={{ fontFamily }}>
          Add Sale
        </span>
      </div>

      <div className="px-5 pb-8">
        <h1 className="text-[22px] font-bold text-spal-navy mt-2" style={{ fontFamily }}>
          How do you want to add this sale?
        </h1>
        <p className="text-[13.5px] text-neutral-500 mt-1.5 leading-relaxed" style={{ fontFamily }}>
          SPAL extracts the information automatically, just pick your preferred way
        </p>

        <div className="mt-6 space-y-3">
          {METHODS.map((m, i) => (
            <motion.button
              key={m.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              onClick={() => router.push(m.href)}
              className="w-full flex items-center gap-4 bg-white rounded-2xl px-4 py-4 active:scale-[0.98] transition-transform text-left"
              style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)", minHeight: "72px" }}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: m.iconBg }}
              >
                {m.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14.5px] font-semibold text-spal-navy" style={{ fontFamily }}>
                  {m.label}
                </p>
                <p className="text-[12px] text-neutral-400 mt-0.5" style={{ fontFamily }}>
                  {m.sub}
                </p>
              </div>
              <ChevronRight size={18} strokeWidth={2} className="text-neutral-300 flex-shrink-0" />
            </motion.button>
          ))}
        </div>

        {/* Tip card */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="mt-5 rounded-2xl px-4 py-3.5"
          style={{ background: "#E8F5E9" }}
        >
          <p className="text-[12.5px] leading-relaxed" style={{ fontFamily, color: "#2E7D32" }}>
            💡 SPAL can read handwriting, voice notes, and messy receipts — no need to type everything yourself.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
