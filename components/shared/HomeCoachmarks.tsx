"use client";

import { useState, useEffect, useLayoutEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

// ── Step definitions ──────────────────────────────────────────────────────────

interface Step {
  id:     string;
  title:  string;
  body:   string;
  target: string | null; // data-coachmark value
}

const STEPS: Step[] = [
  {
    id:     "welcome",
    title:  "Welcome to SPAL",
    body:   "I'm your business assistant. I'll help you track your sales and expenses so you always know how your business is doing. Let me show you around.",
    target: null,
  },
  {
    id:     "snapshot",
    title:  "Today's numbers",
    body:   "This card shows your sales, expenses, and profit for today. It updates the moment you record anything. Green means money in — orange means money out.",
    target: "summary_card",
  },
  {
    id:     "recent",
    title:  "Your recent records",
    body:   "Every sale and expense you log shows up here instantly. Swipe left on any entry to edit or delete it.",
    target: "recent_activity",
  },
  {
    id:     "tab-home",
    title:  "Home",
    body:   "This is your daily hub. Come here every day to see how your business is performing and take quick actions.",
    target: "tab-home",
  },
  {
    id:     "tab-records",
    title:  "Records",
    body:   "Tap here to see your full history of sales and expenses. You can filter, search, and manage everything from this tab.",
    target: "tab-records",
  },
  {
    id:     "tab-insights",
    title:  "Insights",
    body:   "This tab shows trends and breakdowns — which categories you spend the most on, your best days, and how your profit is moving over time.",
    target: "tab-insights",
  },
  {
    id:     "tab-profile",
    title:  "Profile",
    body:   "Update your name, business details, notifications, and currency here. Keep your profile complete so SPAL can give you the best advice.",
    target: "tab-profile",
  },
  {
    id:     "spark",
    title:  "Ask SPAL anytime",
    body:   `That’s me — the floating button. Tap me whenever you want to ask something like “how much did I make this week?” or “where am I spending the most?”`,
    target: "spark",
  },
];

const STORAGE_KEY = "spal_coachmarks_v3_done";

// ── Geometry helpers ──────────────────────────────────────────────────────────

interface TargetRect {
  top:    number;
  left:   number;
  right:  number;
  bottom: number;
  width:  number;
  height: number;
  centerX: number;
  centerY: number;
}

function measureTarget(id: string): TargetRect | null {
  if (typeof window === "undefined") return null;
  const el = document.querySelector(`[data-coachmark="${id}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) return null;
  return {
    top:     r.top,
    left:    r.left,
    right:   r.right,
    bottom:  r.bottom,
    width:   r.width,
    height:  r.height,
    centerX: r.left + r.width  / 2,
    centerY: r.top  + r.height / 2,
  };
}

// ── Main component ────────────────────────────────────────────────────────────

const SP  = 8;   // spotlight outset
const GAP = 12;  // gap between spotlight edge and card

export function HomeCoachmarks() {
  const [stepIdx,  setStepIdx]  = useState(0);
  const [visible,  setVisible]  = useState(false);
  const [target,   setTarget]   = useState<TargetRect | null>(null);
  // Two-phase: measure card height before animating in
  const [cardH,    setCardH]    = useState(0);
  const [ready,    setReady]    = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
  }, []);

  const step = STEPS[stepIdx];

  // Measure target element, retry until found
  const measureStep = useCallback(() => {
    if (!step.target) { setTarget(null); return; }
    let tries = 0;
    const attempt = () => {
      const r = measureTarget(step.target!);
      if (r) { setTarget(r); return; }
      if (++tries < 15) setTimeout(attempt, 80);
    };
    attempt();
  }, [step.target]);

  useEffect(() => {
    if (!visible) return;
    setTarget(null);
    setReady(false);
    setCardH(0);
    measureStep();
    window.addEventListener("resize", measureStep);
    return () => window.removeEventListener("resize", measureStep);
  }, [stepIdx, visible, measureStep]);

  // After card renders (invisible), measure its real height then flip to visible
  useLayoutEffect(() => {
    if (!visible || ready) return;
    if (!cardRef.current) return;
    // Wait one frame so content is laid out
    const id = requestAnimationFrame(() => {
      const h = cardRef.current?.offsetHeight ?? 0;
      if (h > 0) { setCardH(h); setReady(true); }
    });
    return () => cancelAnimationFrame(id);
  });

  function next()    { setReady(false); setStepIdx(s => Math.min(s + 1, STEPS.length - 1)); }
  function prev()    { setReady(false); setStepIdx(s => Math.max(s - 1, 1)); }
  function dismiss() { localStorage.setItem(STORAGE_KEY, "1"); setVisible(false); }

  if (!visible) return null;

  const isWelcome = stepIdx === 0;
  const isLast    = stepIdx === STEPS.length - 1;
  const hasPrev   = stepIdx > 1;

  const vw = typeof window !== "undefined" ? window.innerWidth  : 390;
  const vh = typeof window !== "undefined" ? window.innerHeight : 844;

  // Card width: 16px margin each side, capped at 320
  const cardW    = Math.min(320, vw - 32);
  const cardLeft = (vw - cardW) / 2;

  // ── Compute card top & tail ────────────────────────────────────────────────
  const MARGIN = 12; // min distance from screen edge

  let cardTop  = (vh - (cardH || 180)) / 2; // default: centred
  let tailSide: "up" | "down" | null = null;
  let tailOffsetX = cardW / 2 - 9; // default: card centre

  if (target && cardH > 0) {
    const spotBottom = target.bottom + SP;
    const spotTop    = target.top    - SP;

    const spaceBelow = vh     - spotBottom - GAP - MARGIN;
    const spaceAbove = spotTop             - GAP - MARGIN;

    if (spaceBelow >= cardH || spaceBelow >= spaceAbove) {
      // Place card below spotlight
      cardTop  = Math.min(spotBottom + GAP, vh - cardH - MARGIN);
      tailSide = "up";
    } else {
      // Place card above spotlight
      cardTop  = Math.max(spotTop - GAP - cardH, MARGIN);
      tailSide = "down";
    }

    // Clamp card vertically
    cardTop = Math.max(MARGIN, Math.min(cardTop, vh - cardH - MARGIN));

    // Tail X: point at horizontal centre of target, relative to card
    const rawTailX = target.centerX - cardLeft - 9;
    tailOffsetX = Math.max(16, Math.min(rawTailX, cardW - 34));
  }

  // ── Spotlight shape ────────────────────────────────────────────────────────
  // Bottom nav tabs look better with a pill spotlight, summary card with rounded rect
  const spotRadius = target
    ? (step.id.startsWith("tab-") ? 14 : 18)
    : 18;

  return (
    <AnimatePresence>
      {/* Dark overlay — pointer-events off so underlying elements can still be measured */}
      <motion.div
        key="cm-overlay"
        className="fixed inset-0 z-[100] pointer-events-none"
        style={{ background: "rgba(10,14,26,0.80)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22 }}
      />

      {/* Spotlight cutout */}
      {target && (
        <motion.div
          key={`cm-spot-${stepIdx}`}
          className="fixed z-[101] pointer-events-none"
          style={{
            top:    target.top    - SP,
            left:   target.left   - SP,
            width:  target.width  + SP * 2,
            height: target.height + SP * 2,
            borderRadius: spotRadius,
            // Outer shadow creates the dark overlay with a transparent hole
            boxShadow:
              `0 0 0 9999px rgba(10,14,26,0.80),` +
              `0 0 0 2px rgba(34,197,94,0.9),` +
              `0 0 20px 4px rgba(34,197,94,0.25)`,
            background: "transparent",
          }}
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        />
      )}

      {/* Card — renders invisible first so we can measure height */}
      <motion.div
        ref={cardRef}
        key={`cm-card-${stepIdx}`}
        className="fixed z-[102] pointer-events-auto"
        style={{
          top:     cardTop,
          left:    cardLeft,
          width:   cardW,
          opacity: ready ? 1 : 0,
        }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: ready ? 1 : 0, y: ready ? 0 : 8 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.26, ease: [0.34, 1.1, 0.64, 1] }}
      >
        {/* Upward tail — card is below the spotlight */}
        {tailSide === "up" && (
          <div style={{
            width: 0, height: 0,
            borderLeft:   "9px solid transparent",
            borderRight:  "9px solid transparent",
            borderBottom: "10px solid #ffffff",
            marginLeft:   tailOffsetX,
            marginBottom: -1,
            flexShrink:   0,
          }} />
        )}

        {/* Card body */}
        <div
          className="rounded-3xl px-5 py-5"
          style={{ background: "#ffffff", boxShadow: "0 16px 48px rgba(0,0,0,0.20)" }}
        >
          {/* Header row */}
          <div className="flex items-center gap-2.5 mb-3">
            <Image
              src="/spal AI.png"
              alt="SPAL"
              width={isWelcome ? 56 : 28}
              height={isWelcome ? 56 : 28}
              style={{
                width:      isWelcome ? 56 : 28,
                height:     isWelcome ? 56 : 28,
                objectFit:  "contain",
                flexShrink: 0,
                filter:     "drop-shadow(0 2px 6px rgba(34,197,94,0.35))",
              }}
            />
            {!isWelcome && (
              <span
                className="text-[10.5px] font-bold uppercase tracking-widest"
                style={{ color: "#22C55E", fontFamily: "var(--font-satoshi)" }}
              >
                SPAL Guide
              </span>
            )}
          </div>

          {/* Progress dots (steps 1+) */}
          {!isWelcome && (
            <div className="flex gap-1.5 mb-3">
              {STEPS.slice(1).map((_, i) => (
                <div
                  key={i}
                  className="h-[3px] flex-1 rounded-full transition-all duration-300"
                  style={{ background: i < stepIdx ? "#22C55E" : "#E5E7EB" }}
                />
              ))}
            </div>
          )}

          {/* Title */}
          <h3
            className="font-bold leading-snug mb-1.5"
            style={{
              fontSize:   isWelcome ? "17px" : "15px",
              fontFamily: "var(--font-satoshi)",
              color:      "#0F172A",
            }}
          >
            {step.title}
          </h3>

          {/* Body */}
          <p
            className="leading-relaxed"
            style={{ fontSize: "13px", fontFamily: "var(--font-satoshi)", color: "#6B7280" }}
          >
            {step.body}
          </p>

          {/* Actions */}
          <div className="flex items-center justify-between mt-5">
            {isWelcome ? (
              <>
                <button
                  onClick={dismiss}
                  className="text-[13px] font-semibold py-2 active:opacity-60"
                  style={{ fontFamily: "var(--font-satoshi)", color: "#9CA3AF" }}
                >
                  Skip tour
                </button>
                <button
                  onClick={next}
                  className="h-10 px-6 rounded-full font-bold text-[13px] text-white active:scale-95 transition-transform"
                  style={{ fontFamily: "var(--font-satoshi)", background: "#22C55E" }}
                >
                  Show me around
                </button>
              </>
            ) : (
              <>
                {hasPrev ? (
                  <button
                    onClick={prev}
                    className="text-[13px] font-semibold py-2 active:opacity-60"
                    style={{ fontFamily: "var(--font-satoshi)", color: "#9CA3AF" }}
                  >
                    Back
                  </button>
                ) : (
                  <button
                    onClick={dismiss}
                    className="text-[13px] font-semibold py-2 active:opacity-60"
                    style={{ fontFamily: "var(--font-satoshi)", color: "#9CA3AF" }}
                  >
                    Skip
                  </button>
                )}
                <button
                  onClick={isLast ? dismiss : next}
                  className="h-10 px-6 rounded-full font-bold text-[13px] text-white active:scale-95 transition-transform"
                  style={{ fontFamily: "var(--font-satoshi)", background: "#22C55E" }}
                >
                  {isLast ? "Got it!" : "Next"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Downward tail — card is above the spotlight */}
        {tailSide === "down" && (
          <div style={{
            width: 0, height: 0,
            borderLeft:  "9px solid transparent",
            borderRight: "9px solid transparent",
            borderTop:   "10px solid #ffffff",
            marginLeft:  tailOffsetX,
            marginTop:   -1,
            flexShrink:  0,
          }} />
        )}
      </motion.div>
    </AnimatePresence>
  );
}
