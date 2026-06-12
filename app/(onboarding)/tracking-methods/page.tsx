"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check } from "lucide-react";
import { useSPALStore, type TrackingMethod } from "@/store";

const METHODS: {
  method: TrackingMethod;
  label: string;
  sub: string;
  icon: React.ReactNode;
  accent: string;
  exclusive?: boolean;
}[] = [
  {
    method: "notebook",
    label: "Notebook or paper",
    sub: "I write things down by hand",
    icon: <NotebookIcon />,
    accent: "#22C55E",
  },
  {
    method: "spreadsheet",
    label: "Spreadsheet",
    sub: "Excel, Google Sheets or similar",
    icon: <SpreadsheetIcon />,
    accent: "#2563EB",
  },
  {
    method: "another_app",
    label: "Another app",
    sub: "I use a different business app",
    icon: <AppIcon />,
    accent: "#8B5CF6",
  },
  {
    method: "memory",
    label: "I remember it",
    sub: "I keep it all in my head",
    icon: <MemoryIcon />,
    accent: "#F97316",
  },
  {
    method: "whatsapp",
    label: "WhatsApp messages",
    sub: "I send records to myself or a group",
    icon: <WhatsAppIcon />,
    accent: "#22C55E",
  },
  {
    method: "nothing",
    label: "I don't track anything",
    sub: "I haven't started yet",
    icon: <NothingIcon />,
    accent: "#A1A1AA",
    exclusive: true,
  },
];

export default function TrackingMethodsPage() {
  const router = useRouter();
  const { setOnboardingData } = useSPALStore();
  const [selected, setSelected] = useState<Set<TrackingMethod>>(new Set());

  function toggle(method: TrackingMethod, exclusive?: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(method)) {
        next.delete(method);
      } else {
        if (exclusive) {
          // "I don't track anything" clears everything else
          return new Set([method]);
        }
        // Deselect exclusive option if another is chosen
        next.delete("nothing");
        next.add(method);
      }
      return next;
    });
  }

  function handleContinue() {
    setOnboardingData({ trackingMethods: Array.from(selected) });
    router.push("/onboard-goals");
  }

  const nothingSelected = selected.has("nothing");

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: "#F8F7F4" }}>

      {/* Header */}
      <div className="px-5 pt-12 pb-0">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform"
            style={{ background: "rgba(15,23,42,0.06)" }}
            aria-label="Go back"
          >
            <ArrowLeft size={18} strokeWidth={2} />
          </button>
          <div className="flex-1"><OnboardProgress step={2} total={3} /></div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          className="mt-7"
        >
          <p
            className="text-[11px] font-semibold tracking-widest uppercase text-neutral-400 mb-2"
            style={{ fontFamily: "var(--font-satoshi)" }}
          >
            Step 2 of 3
          </p>
          <h1
            className="text-spal-navy font-bold leading-[1.1]"
            style={{ fontSize: "clamp(28px, 8vw, 34px)", fontFamily: "var(--font-satoshi)", letterSpacing: "-0.025em" }}
          >
            How do you currently<br />track your business?
          </h1>
          <p className="mt-2 text-neutral-400 text-[13px]" style={{ fontFamily: "var(--font-satoshi)" }}>
            Select all that apply. This helps SPAL get you set up faster.
          </p>
        </motion.div>
      </div>

      {/* List */}
      <div className="flex-1 min-h-0 overflow-y-auto scroll-container px-5 pt-6 pb-44">
        <div className="space-y-2.5">
          {METHODS.map((item, i) => {
            const isSelected = selected.has(item.method);
            const isDisabled = nothingSelected && !item.exclusive;
            return (
              <motion.button
                key={item.method}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.045 + 0.12, duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                onClick={() => !isDisabled && toggle(item.method, item.exclusive)}
                className="w-full flex items-center gap-4 bg-white rounded-2xl px-4 py-3.5 text-left transition-all duration-150"
                style={{
                  border: isSelected ? `1.5px solid ${item.accent}` : "1.5px solid transparent",
                  boxShadow: isSelected
                    ? `0 0 0 3px ${item.accent}18, 0 2px 8px rgba(0,0,0,0.06)`
                    : "0 1px 3px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.04)",
                  opacity: isDisabled ? 0.38 : 1,
                  transform: "scale(1)",
                  ...(isDisabled ? {} : { cursor: "pointer" }),
                }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${item.accent}12`, color: item.accent }}
                >
                  {item.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-spal-navy" style={{ fontFamily: "var(--font-satoshi)" }}>
                    {item.label}
                  </p>
                  <p className="text-[12px] text-neutral-400 mt-0.5" style={{ fontFamily: "var(--font-satoshi)" }}>
                    {item.sub}
                  </p>
                </div>

                <AnimatePresence>
                  {isSelected ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ duration: 0.18, ease: [0.34, 1.4, 0.64, 1] }}
                      className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: item.accent }}
                    >
                      <Check size={13} strokeWidth={2.5} color="white" />
                    </motion.div>
                  ) : (
                    <div className="w-6 h-6 rounded-lg border-2 border-neutral-200 flex-shrink-0" />
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Bottom CTA */}
      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-5 pb-10 pt-16"
        style={{ background: "linear-gradient(to top, #F8F7F4 60%, transparent)" }}
      >
        <button
          onClick={handleContinue}
          disabled={selected.size === 0}
          className="w-full h-14 rounded-full font-bold text-[15px] transition-all duration-200"
          style={{
            fontFamily: "var(--font-satoshi)",
            background: selected.size > 0 ? "#22C55E" : "#E4E4E7",
            color: selected.size > 0 ? "#fff" : "#A1A1AA",
          }}
        >
          Continue{selected.size > 0 && !nothingSelected ? ` (${selected.size} selected)` : ""}
        </button>
        <button
          onClick={() => { setOnboardingData({ trackingMethods: [] }); router.push("/onboard-goals"); }}
          className="w-full mt-3 text-center text-[13px] text-neutral-400 py-1"
          style={{ fontFamily: "var(--font-satoshi)" }}
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}

function OnboardProgress({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className="h-1 flex-1 rounded-full transition-all duration-400"
          style={{ background: i < step ? "#22C55E" : "#E4E4E7" }}
        />
      ))}
    </div>
  );
}

function NotebookIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}

function SpreadsheetIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M3 15h18M9 3v18" />
    </svg>
  );
}

function AppIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" />
      <path d="M12 18h.01" />
    </svg>
  );
}

function MemoryIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.44-4.24Z" />
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.44-4.24Z" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <path d="M8 10h.01M12 10h.01M16 10h.01" />
    </svg>
  );
}

function NothingIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12h8" />
    </svg>
  );
}
