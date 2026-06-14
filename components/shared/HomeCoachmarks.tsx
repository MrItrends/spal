"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface Step {
  id:       string;
  title?:   string;
  body:     string[];
  target:   string | null;
  cardSide: "below" | "above" | "center";
}

const STEPS: Step[] = [
  {
    id: "welcome",
    title: "Hello Entrepreneur,",
    body: [
      "It's great to have you on SPAL. I'm SPAL and I'm here to assist you.",
      "Let me take you through a quick guide of the app.",
    ],
    target: null,
    cardSide: "center",
  },
  {
    id: "summary_card",
    body: [
      "This is where you see what you've recorded for the day — your sales, expenses, and profit at a glance.",
      "Tap the card to view your full record history.",
    ],
    target: "summary_card",
    cardSide: "below",
  },
  {
    id: "quick_actions",
    body: [
      "Add a sale, log an expense, scan a receipt, or import records right here.",
      "These are your most-used tools, always one tap away.",
    ],
    target: "quick_actions",
    cardSide: "below",
  },
  {
    id: "recent_activity",
    body: [
      "Your latest sales and expenses appear here as soon as you record them.",
      "Tap any entry to edit it, or tap 'View all' to see your full history.",
    ],
    target: "recent_activity",
    cardSide: "above",
  },
  {
    id: "bottom_nav",
    body: [
      "Navigate between Home, Records, Insights, and Profile from here.",
      "Use Insights for a deep analysis of your business health.",
    ],
    target: "bottom_nav",
    cardSide: "above",
  },
  {
    id: "header",
    body: [
      "Your greeting, notification bell, and profile avatar live up here.",
      "Tap the avatar to update your name, photo, and business details.",
    ],
    target: "header",
    cardSide: "below",
  },
  {
    id: "spark",
    body: [
      "Oh! I'm also a feature on the app.",
      "I'm your Assistant — tap me anytime to ask questions about your business.",
    ],
    target: "spark",
    cardSide: "above",
  },
];

const STORAGE_KEY = "spal_coachmarks_v2_done";
const SP          = 6;   // spotlight outset
const GAP         = 10;  // gap between spotlight and card
const SAFE_H      = 24;  // minimum top/bottom margin from viewport edge

interface Rect { top: number; left: number; width: number; height: number }

function getRect(id: string): Rect | null {
  if (typeof window === "undefined") return null;
  const el = document.querySelector(`[data-coachmark="${id}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width === 0) return null;
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

export function HomeCoachmarks() {
  const [step,    setStep]    = useState(0);
  const [visible, setVisible] = useState(false);
  const [rect,    setRect]    = useState<Rect | null>(null);
  const cardRef               = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
  }, []);

  const measure = useCallback(() => {
    const target = STEPS[step].target;
    if (!target) { setRect(null); return; }
    let tries = 0;
    const attempt = () => {
      const r = getRect(target);
      if (r) { setRect(r); return; }
      if (++tries < 10) setTimeout(attempt, 80);
    };
    attempt();
  }, [step]);

  useEffect(() => {
    if (!visible) return;
    setRect(null);
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [step, visible, measure]);

  function next()    { if (step < STEPS.length - 1) setStep((s) => s + 1); else dismiss(); }
  function prev()    { if (step > 1) setStep((s) => s - 1); }
  function dismiss() { localStorage.setItem(STORAGE_KEY, "1"); setVisible(false); }

  if (!visible) return null;

  const current   = STEPS[step];
  const isLast    = step === STEPS.length - 1;
  const isWelcome = step === 0;
  const hasPrev   = step > 1;
  const showProgress = step >= 2;

  // Viewport dimensions — always fresh
  const vw = typeof window !== "undefined" ? window.innerWidth  : 390;
  const vh = typeof window !== "undefined" ? window.innerHeight : 844;

  // Card width: fills screen minus 32px breathing room, capped at 320px
  const cardW = Math.min(320, vw - 32);
  // Card is always horizontally centered in the viewport
  const cardLeft = (vw - cardW) / 2;

  // ── Vertical position ─────────────────────────────────────────────────────
  // We estimate card height for safe clamping. Actual rendering handles the rest.
  const CARD_H_EST = 210;

  let cardTop:    number | undefined;
  let cardBottom: number | undefined;
  let tailUp   = false;
  let tailDown = false;

  if (!rect || current.cardSide === "center") {
    // Dead center
    cardTop = (vh - CARD_H_EST) / 2;
  } else if (current.cardSide === "below") {
    const ideal = rect.top + rect.height + SP + GAP;
    if (ideal + CARD_H_EST > vh - SAFE_H) {
      // Not enough room below — flip above instead
      const flipped = rect.top - SP - GAP - CARD_H_EST;
      cardTop  = Math.max(SAFE_H, flipped);
      tailDown = true;
    } else {
      cardTop = Math.max(SAFE_H, ideal);
      tailUp  = true;
    }
  } else {
    // "above": card sits above the spotlight
    const ideal = rect.top - SP - GAP - CARD_H_EST;
    if (ideal < SAFE_H) {
      // Not enough room above — flip below instead
      const flipped = rect.top + rect.height + SP + GAP;
      cardTop = Math.min(flipped, vh - CARD_H_EST - SAFE_H);
      tailUp  = true;
    } else {
      cardTop  = ideal;
      tailDown = true;
    }
  }

  // Resolve to a single number for rendering
  const resolvedTop = cardTop ?? (cardBottom !== undefined ? undefined : (vh - CARD_H_EST) / 2);

  return (
    <AnimatePresence>
      {/* Dim overlay */}
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-[100] pointer-events-none"
        style={{ background: "rgba(10,14,26,0.82)" }}
      />

      {/* Spotlight */}
      {rect && (
        <motion.div
          key={`spot-${step}`}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
          className="fixed z-[101] pointer-events-none"
          style={{
            top:    rect.top    - SP,
            left:   rect.left   - SP,
            width:  rect.width  + SP * 2,
            height: rect.height + SP * 2,
            borderRadius: 20,
            boxShadow:
              "0 0 0 9999px rgba(10,14,26,0.82)," +
              "0 0 0 2.5px rgba(34,197,94,0.85)," +
              "0 0 24px 6px rgba(34,197,94,0.22)",
            background: "transparent",
          }}
        />
      )}

      {/* Card */}
      <motion.div
        ref={cardRef}
        key={`card-${step}`}
        initial={{ opacity: 0, y: 10, scale: 0.97 }}
        animate={{ opacity: 1, y: 0,  scale: 1 }}
        exit={{ opacity: 0, y: -6,   scale: 0.97 }}
        transition={{ duration: 0.28, ease: [0.34, 1.1, 0.64, 1] }}
        className="z-[102] pointer-events-auto"
        style={{
          position: "fixed",
          top:      resolvedTop,
          bottom:   cardBottom,
          left:     cardLeft,
          width:    cardW,
        }}
      >
        {/* Upward tail (card is below spotlight) */}
        {tailUp && (
          <div style={{
            width: 0, height: 0,
            borderLeft:   "9px solid transparent",
            borderRight:  "9px solid transparent",
            borderBottom: "11px solid #fff",
            marginLeft:   cardW / 2 - 9,
            marginBottom: -1,
          }} />
        )}

        <div
          className="rounded-3xl px-5 py-5"
          style={{ background: "#fff", boxShadow: "0 12px 40px rgba(0,0,0,0.18)" }}
        >
          {/* Mascot + welcome header */}
          {isWelcome ? (
            <div className="flex justify-center mb-4">
              <Image src="/spal AI.png" alt="SPAL" width={72} height={72}
                style={{ width: 72, height: 72, objectFit: "contain" }} />
            </div>
          ) : (
            <div className="flex items-center gap-2.5 mb-3">
              <Image src="/spal AI.png" alt="SPAL" width={32} height={32}
                style={{ width: 32, height: 32, objectFit: "contain", flexShrink: 0 }} />
              <span className="text-[11px] font-semibold uppercase tracking-wide"
                style={{ color: "#22C55E", fontFamily: "var(--font-satoshi)" }}>
                SPAL Guide
              </span>
            </div>
          )}

          {/* Progress bars */}
          {showProgress && (
            <div className="flex gap-1.5 mb-3">
              {STEPS.slice(2).map((_, i) => (
                <div
                  key={i}
                  className="h-[3px] flex-1 rounded-full transition-all duration-300"
                  style={{ background: (i + 2) <= step ? "#22C55E" : "#E5E7EB" }}
                />
              ))}
            </div>
          )}

          {current.title && (
            <h3 className="font-bold text-[16px] leading-snug mb-2"
              style={{ fontFamily: "var(--font-satoshi)", color: "#0F172A" }}>
              {current.title}
            </h3>
          )}

          <div className="space-y-2">
            {current.body.map((line, i) => (
              <p key={i} className="text-[13px] leading-relaxed"
                style={{ fontFamily: "var(--font-satoshi)", color: "#6B7280" }}>
                {line}
              </p>
            ))}
          </div>

          <div className="flex items-center justify-between mt-5">
            {isWelcome ? (
              <>
                <button onClick={dismiss}
                  className="text-[13px] font-semibold py-2 active:opacity-60 transition-opacity"
                  style={{ fontFamily: "var(--font-satoshi)", color: "#22C55E" }}>
                  I&apos;ll figure it out
                </button>
                <button onClick={next}
                  className="h-10 px-6 rounded-full font-semibold text-[13px] active:scale-95 transition-transform"
                  style={{ fontFamily: "var(--font-satoshi)", background: "#22C55E", color: "#fff" }}>
                  Show Me
                </button>
              </>
            ) : (
              <>
                {hasPrev
                  ? <button onClick={prev}
                      className="text-[13px] font-semibold py-2 active:opacity-60 transition-opacity"
                      style={{ fontFamily: "var(--font-satoshi)", color: "#22C55E" }}>
                      Back
                    </button>
                  : <button onClick={dismiss}
                      className="text-[13px] font-semibold py-2 active:opacity-60 transition-opacity"
                      style={{ fontFamily: "var(--font-satoshi)", color: "#9CA3AF" }}>
                      Skip
                    </button>
                }
                <button onClick={next}
                  className="h-10 px-6 rounded-full font-semibold text-[13px] active:scale-95 transition-transform"
                  style={{ fontFamily: "var(--font-satoshi)", background: "#22C55E", color: "#fff" }}>
                  {isLast ? "Done" : "Next"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Downward tail (card is above spotlight) */}
        {tailDown && (
          <div style={{
            width: 0, height: 0,
            borderLeft:  "9px solid transparent",
            borderRight: "9px solid transparent",
            borderTop:   "11px solid #fff",
            marginLeft:  cardW / 2 - 9,
            marginTop:   -1,
          }} />
        )}
      </motion.div>
    </AnimatePresence>
  );
}
