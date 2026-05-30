"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useSPALStore, type BusinessGoal } from "@/store";

const GOALS: {
  goal: BusinessGoal;
  label: string;
  sub: string;
  icon: React.ReactNode;
  accent: string;
}[] = [
  {
    goal: "track_sales",
    label: "Track my sales daily",
    sub: "Know exactly how much I make each day",
    icon: <TrackIcon />,
    accent: "#22C55E",
  },
  {
    goal: "know_profit",
    label: "Know my real profit",
    sub: "See what I actually keep after expenses",
    icon: <ProfitIcon />,
    accent: "#2563EB",
  },
  {
    goal: "reduce_expenses",
    label: "Reduce my expenses",
    sub: "Find where money is leaking out",
    icon: <CutIcon />,
    accent: "#F97316",
  },
  {
    goal: "grow_business",
    label: "Grow my business",
    sub: "Make better decisions to scale up",
    icon: <GrowIcon />,
    accent: "#8B5CF6",
  },
  {
    goal: "understand_spending",
    label: "Understand my spending",
    sub: "See patterns in how I spend money",
    icon: <SpendIcon />,
    accent: "#2563EB",
  },
];

export default function GoalsPage() {
  const router = useRouter();
  const { setOnboardingData } = useSPALStore();
  const [selected, setSelected] = useState<Set<BusinessGoal>>(new Set());

  function toggle(goal: BusinessGoal) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(goal)) next.delete(goal);
      else next.add(goal);
      return next;
    });
  }

  function handleContinue() {
    setOnboardingData({ goals: Array.from(selected) });
    router.push("/demo");
  }

  return (
    <div className="flex-1 flex flex-col" style={{ background: "#F8F7F4" }}>

      {/* Header */}
      <div className="px-5 pt-12 pb-0">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => router.push("/business-type")}
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform"
            style={{ background: "rgba(15,23,42,0.06)" }}
            aria-label="Go back"
          >
            <BackIcon />
          </button>
          <div className="flex-1"><OnboardProgress step={2} total={4} /></div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          className="mt-7"
        >
          <p className="text-[11px] font-semibold tracking-widest uppercase text-neutral-400 mb-2"
            style={{ fontFamily: "var(--font-satoshi)" }}>
            Step 2 of 4
          </p>
          <h1
            className="text-spal-navy font-bold leading-[1.1]"
            style={{ fontSize: "clamp(30px, 8.5vw, 36px)", fontFamily: "var(--font-satoshi)", letterSpacing: "-0.025em" }}
          >
            What do you want<br />to achieve?
          </h1>
          <p className="mt-2 text-neutral-400 text-[13px]" style={{ fontFamily: "var(--font-satoshi)" }}>
            Choose all that apply. SPAL will focus on what matters to you.
          </p>
        </motion.div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto scroll-container px-5 pt-6 pb-40">
        <div className="space-y-2.5">
          {GOALS.map((item, i) => {
            const isSelected = selected.has(item.goal);
            return (
              <motion.button
                key={item.goal}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 + 0.12, duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                onClick={() => toggle(item.goal)}
                className="w-full flex items-center gap-4 bg-white rounded-2xl px-4 py-3.5 text-left active:scale-[0.98] transition-all duration-150"
                style={{
                  border: isSelected ? `1.5px solid ${item.accent}` : "1.5px solid transparent",
                  boxShadow: isSelected
                    ? `0 0 0 3px ${item.accent}14, 0 2px 8px rgba(0,0,0,0.06)`
                    : "0 1px 3px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.04)",
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
                      <CheckIcon />
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

      {/* Bottom gradient + CTA */}
      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-5 pb-10 pt-16"
        style={{ background: "linear-gradient(to top, #F8F7F4 60%, transparent)" }}
      >
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.3 }}
          onClick={handleContinue}
          disabled={selected.size === 0}
          className="w-full h-14 rounded-full font-bold text-[15px] transition-all duration-200"
          style={{
            fontFamily: "var(--font-satoshi)",
            background: selected.size > 0 ? "#0F172A" : "#E4E4E7",
            color: selected.size > 0 ? "#fff" : "#A1A1AA",
          }}
        >
          Continue{selected.size > 0 ? ` (${selected.size} selected)` : ""}
        </motion.button>
        <button
          onClick={() => { setOnboardingData({ goals: [] }); router.push("/demo"); }}
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

function BackIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 6.5l3 3 5-5" />
    </svg>
  );
}

function TrackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="14" width="4" height="7" rx="1" />
      <rect x="10" y="9" width="4" height="12" rx="1" />
      <rect x="17" y="4" width="4" height="17" rx="1" />
    </svg>
  );
}

function ProfitIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}

function CutIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <line x1="20" y1="4" x2="8.12" y2="15.88" />
      <line x1="14.47" y1="14.48" x2="20" y2="20" />
      <line x1="8.12" y1="8.12" x2="12" y2="12" />
    </svg>
  );
}

function GrowIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

function SpendIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
