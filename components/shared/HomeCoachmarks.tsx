"use client";

/**
 * Duolingo-style coachmark tour for first-time (and returning-but-first-time-post-update) users.
 * Shown on top of the home screen. Dismissed by tapping "Got it" or completing all steps.
 * State is stored in localStorage so it's not shown again after dismissal.
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Step {
  id:      string;
  title:   string;
  body:    string;
  // Optional anchor — positions the spotlight. null = center-modal style
  anchor?: { top?: string; bottom?: string; left?: string; right?: string };
}

const STEPS: Step[] = [
  {
    id: "welcome",
    title: "Welcome to SPAL! 🎉",
    body: "This is your business dashboard. Everything you need is right here.",
    anchor: undefined,
  },
  {
    id: "summary",
    title: "Your daily summary",
    body: "This card shows your sales, expenses, and how much you actually kept today.",
    anchor: { top: "150px", left: "24px", right: "24px" },
  },
  {
    id: "quick_actions",
    title: "Quick actions",
    body: "Tap Add Sale or Add Expense to record anything in seconds. No forms, no stress.",
    anchor: { top: "390px", left: "24px", right: "24px" },
  },
  {
    id: "spark",
    title: "Meet your Spark assistant",
    body: "The glowing button at the bottom right is your AI assistant. Ask it anything about your business.",
    anchor: { bottom: "90px", right: "12px" },
  },
  {
    id: "nav",
    title: "Explore SPAL",
    body: "Use the tabs at the bottom to check your Records, Insights, and Profile.",
    anchor: { bottom: "0px", left: "0px", right: "0px" },
  },
];

const STORAGE_KEY = "spal_coachmarks_v1_done";

export function HomeCoachmarks() {
  const [step, setStep]       = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) setVisible(true);
  }, []);

  function next() {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      dismiss();
    }
  }

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  const current = STEPS[step];
  const isLast  = step === STEPS.length - 1;

  return (
    <AnimatePresence>
      <motion.div
        key="coachmarks-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-[100] pointer-events-none"
        style={{ background: "rgba(10,14,26,0.72)" }}
      >
        {/* Spotlight cutout for anchored steps */}
        {current.anchor && (
          <div
            className="absolute rounded-2xl"
            style={{
              ...current.anchor,
              boxShadow: "0 0 0 9999px rgba(10,14,26,0.72)",
              background: "transparent",
              pointerEvents: "none",
            }}
          />
        )}
      </motion.div>

      {/* Tooltip card */}
      <motion.div
        key={`step-${step}`}
        initial={{ opacity: 0, y: 12, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.97 }}
        transition={{ duration: 0.3, ease: [0.34, 1.1, 0.64, 1] }}
        className="fixed z-[101] pointer-events-auto"
        style={{
          left: "24px",
          right: "24px",
          bottom: current.anchor?.bottom
            ? `calc(${current.anchor.bottom} + 80px)`
            : "30%",
          maxWidth: "420px",
          margin: "0 auto",
        }}
      >
        <div
          className="rounded-3xl px-5 py-5"
          style={{ background: "#0F172A", boxShadow: "0 24px 64px rgba(0,0,0,0.55)" }}
        >
          {/* Step dots */}
          <div className="flex gap-1.5 mb-4">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className="h-1 rounded-full transition-all duration-300"
                style={{
                  width: i === step ? "20px" : "6px",
                  background: i <= step ? "#22C55E" : "rgba(255,255,255,0.15)",
                }}
              />
            ))}
          </div>

          <h3
            className="text-white font-bold text-[16px] leading-snug mb-2"
            style={{ fontFamily: "var(--font-satoshi)" }}
          >
            {current.title}
          </h3>
          <p
            className="text-[13.5px] leading-relaxed"
            style={{ fontFamily: "var(--font-satoshi)", color: "rgba(255,255,255,0.60)" }}
          >
            {current.body}
          </p>

          {/* Actions */}
          <div className="flex items-center justify-between mt-5">
            <button
              onClick={dismiss}
              className="text-[12.5px] font-medium px-3 py-1.5 rounded-full active:opacity-60 transition-opacity"
              style={{ fontFamily: "var(--font-satoshi)", color: "rgba(255,255,255,0.35)" }}
            >
              Skip tour
            </button>

            <button
              onClick={next}
              className="h-[38px] px-5 rounded-full font-semibold text-[13.5px] active:scale-95 transition-transform"
              style={{
                fontFamily: "var(--font-satoshi)",
                background: "#22C55E",
                color: "#fff",
              }}
            >
              {isLast ? "Got it!" : "Next →"}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
