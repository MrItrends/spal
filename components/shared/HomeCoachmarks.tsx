"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface Step {
  id: string;
  title?: string;
  body: string[];
  target: string | null;
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
      "I'm your Assistant — I can hold conversations about your activities. Just tap me anytime.",
    ],
    target: "spark",
    cardSide: "above",
  },
];

const STORAGE_KEY = "spal_coachmarks_v2_done";
const CARD_W      = 300;
const GAP         = 12; // px between spotlight edge and card

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

  const current    = STEPS[step];
  const isLast     = step === STEPS.length - 1;
  const isWelcome  = step === 0;
  const hasPrev    = step > 1;
  const showProgress = step >= 2;

  const vw = typeof window !== "undefined" ? window.innerWidth  : 390;
  const vh = typeof window !== "undefined" ? window.innerHeight : 844;

  // ── spotlight padding ───────────────────────────────────────────────────────
  const SP = 6; // px outset from the target rect

  // ── card position ───────────────────────────────────────────────────────────
  let cardStyle: React.CSSProperties;
  let mascotStyle: React.CSSProperties;
  let tailUp   = false;
  let tailDown = false;

  if (!rect || current.cardSide === "center") {
    // Centered vertically & horizontally
    cardStyle = {
      position: "fixed",
      left: "50%",
      top:  "50%",
      transform: "translate(-50%, -50%)",
      width: CARD_W,
    };
    mascotStyle = {
      position: "fixed",
      left: "50%",
      top:  "50%",
      transform: "translate(-50%, calc(-50% - 180px))",
    };
  } else {
    // Horizontal: align card's left edge with target's left, but clamp to screen
    const rawLeft = rect.left;
    const clampedLeft = Math.max(GAP, Math.min(rawLeft, vw - CARD_W - GAP));

    if (current.cardSide === "below") {
      // Card below spotlight
      const top = rect.top + rect.height + SP + GAP;
      cardStyle   = { position: "fixed", top, left: clampedLeft, width: CARD_W };
      mascotStyle = { position: "fixed", top: top - 68, left: clampedLeft };
      tailUp = true;
    } else {
      // Card above spotlight — estimate card height ~160px
      const CARD_H_EST = 180;
      const bottom = vh - (rect.top - SP - GAP);
      cardStyle   = { position: "fixed", bottom, left: clampedLeft, width: CARD_W };
      mascotStyle = { position: "fixed", bottom: bottom + CARD_H_EST + 4, left: clampedLeft };
      tailDown = true;
    }
  }

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

      {/* Mascot */}
      {!isWelcome && (
        <motion.div
          key={`mascot-${step}`}
          initial={{ opacity: 0, scale: 0.75, y: 8 }}
          animate={{ opacity: 1, scale: 1,   y: 0 }}
          transition={{ duration: 0.35, ease: [0.34, 1.2, 0.64, 1] }}
          className="pointer-events-none z-[102]"
          style={{ ...mascotStyle, position: "fixed" }}
        >
          <Image
            src="/spal AI.png"
            alt="SPAL"
            width={60}
            height={60}
            style={{ width: 60, height: 60, objectFit: "contain" }}
          />
        </motion.div>
      )}

      {/* Card */}
      <motion.div
        key={`card-${step}`}
        initial={{ opacity: 0, y: 10, scale: 0.97 }}
        animate={{ opacity: 1, y: 0,  scale: 1 }}
        exit={{ opacity: 0, y: -6, scale: 0.97 }}
        transition={{ duration: 0.28, ease: [0.34, 1.1, 0.64, 1] }}
        className="z-[102] pointer-events-auto"
        style={{ ...cardStyle, position: "fixed" }}
      >
        {/* Upward tail — card is below the spotlight */}
        {tailUp && !isWelcome && (
          <div style={{
            width: 0, height: 0,
            borderLeft: "10px solid transparent",
            borderRight: "10px solid transparent",
            borderBottom: "12px solid #fff",
            marginLeft: 20, marginBottom: -1,
          }} />
        )}

        <div
          className="rounded-3xl px-5 py-5"
          style={{ background: "#fff", boxShadow: "0 12px 40px rgba(0,0,0,0.18)" }}
        >
          {/* Welcome blob */}
          {isWelcome && (
            <div className="flex justify-center mb-4">
              <Image src="/spal AI.png" alt="SPAL" width={72} height={72}
                style={{ width: 72, height: 72, objectFit: "contain" }} />
            </div>
          )}

          {/* Progress bars */}
          {showProgress && (
            <div className="flex gap-1.5 mb-4">
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

          <div className="flex items-center justify-between mt-4">
            {isWelcome ? (
              <>
                <button onClick={dismiss}
                  className="text-[13px] font-semibold active:opacity-60 transition-opacity"
                  style={{ fontFamily: "var(--font-satoshi)", color: "#22C55E" }}>
                  I&apos;d figure it out myself
                </button>
                <button onClick={next}
                  className="h-[36px] px-5 rounded-full font-semibold text-[13px] active:scale-95 transition-transform"
                  style={{ fontFamily: "var(--font-satoshi)", background: "#22C55E", color: "#fff" }}>
                  Show Me
                </button>
              </>
            ) : (
              <>
                {hasPrev
                  ? <button onClick={prev}
                      className="text-[13px] font-semibold active:opacity-60 transition-opacity"
                      style={{ fontFamily: "var(--font-satoshi)", color: "#22C55E" }}>
                      Previous
                    </button>
                  : <div />}
                <button onClick={next}
                  className="h-[36px] px-5 rounded-full font-semibold text-[13px] active:scale-95 transition-transform"
                  style={{ fontFamily: "var(--font-satoshi)", background: "#22C55E", color: "#fff" }}>
                  {isLast ? "Complete Guide" : "Next"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Downward tail — card is above the spotlight */}
        {tailDown && !isWelcome && (
          <div style={{
            width: 0, height: 0,
            borderLeft: "10px solid transparent",
            borderRight: "10px solid transparent",
            borderTop: "12px solid #fff",
            marginLeft: 20, marginTop: -1,
          }} />
        )}
      </motion.div>
    </AnimatePresence>
  );
}
