"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface Step {
  id: string;
  title?: string;
  body: string[];
  // Where the tooltip card sits (top-offset from screen top, or bottom-anchored)
  cardPosition: "center" | { top: number } | { bottom: number };
  // The spotlight highlight region (null = full-screen dim, no cutout)
  spotlight: null | { top: number; height: number; left?: number; right?: number };
}

const STEPS: Step[] = [
  {
    id: "welcome",
    title: "Hello Entreprenuer,",
    body: [
      "It's glad to have you on SPAL. i'm SPAL and I am here to assist you.",
      "Firstly, let me take you through a quick guide of the app",
    ],
    cardPosition: "center",
    spotlight: null,
  },
  {
    id: "summary_card",
    title: undefined,
    body: [
      "This is where you see what you've recorded for the day",
      "To view for the week, month and year, click the view details button above",
    ],
    cardPosition: { top: 390 },
    spotlight: { top: 100, height: 265 },
  },
  {
    id: "quick_actions",
    title: undefined,
    body: [
      "You can track your sales, expenses inventories here. and if you want a quick scan or import . Here is where you can achieve it",
    ],
    cardPosition: { top: 300 },
    spotlight: { top: 430, height: 180 },
  },
  {
    id: "recent_activity",
    title: undefined,
    body: [
      "This is where your recent expenses and sales will be shown. It only shows your daily sales",
      "To view all sales, click the records button below",
    ],
    cardPosition: { top: 300 },
    spotlight: { top: 625, height: 130 },
  },
  {
    id: "bottom_nav",
    title: undefined,
    body: [
      "Easily navigate across home, records insights and profile",
      "To view your business health, click insight to view a deep analysis of your business and use profile to customize your name, number, etc.",
    ],
    cardPosition: { bottom: 120 },
    spotlight: { top: 680, height: 90 },
  },
  {
    id: "header",
    title: undefined,
    body: [
      "You can also access your profile from the avatar above",
      "To view new updates on the app, you can check your notifications",
    ],
    cardPosition: { top: 120 },
    spotlight: { top: 48, height: 56, left: 16 },
  },
  {
    id: "spark",
    title: undefined,
    body: [
      "This is your SPAL AI assistant. Tap it to ask anything about your business",
      "Get insights, tips and advice — available anytime, right from this button",
    ],
    cardPosition: { bottom: 180 },
    spotlight: { top: 620, height: 60 },
  },
];

const STORAGE_KEY = "spal_coachmarks_v2_done";

export function HomeCoachmarks() {
  const [step, setStep]       = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) setVisible(true);
  }, []);

  function next() {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
    else dismiss();
  }

  function prev() {
    if (step > 1) setStep((s) => s - 1);
  }

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  const current = STEPS[step];
  const isLast  = step === STEPS.length - 1;
  const isWelcome = step === 0;
  // Step 2 (index 1) has no Previous button
  const hasPrev = step > 1;
  // Progress bar only shows from step 2 onward
  const showProgress = step >= 2;

  // Compute tooltip card position
  let cardStyle: React.CSSProperties = {};
  if (current.cardPosition === "center") {
    cardStyle = { top: "50%", transform: "translateY(-50%)" };
  } else if ("top" in current.cardPosition) {
    cardStyle = { top: `${current.cardPosition.top}px` };
  } else {
    cardStyle = { bottom: `${current.cardPosition.bottom}px` };
  }

  return (
    <AnimatePresence>
      {/* Dark overlay */}
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-[100] pointer-events-none"
        style={{ background: "rgba(10,14,26,0.78)" }}
      >
        {/* Spotlight cutout */}
        {current.spotlight && (
          <div
            className="absolute"
            style={{
              top: `${current.spotlight.top}px`,
              height: `${current.spotlight.height}px`,
              left: current.spotlight.left ?? 20,
              right: current.spotlight.left ? undefined : 20,
              width: current.spotlight.left ? 80 : undefined,
              borderRadius: 20,
              boxShadow: "0 0 0 9999px rgba(10,14,26,0.78)",
              background: "transparent",
            }}
          />
        )}
      </motion.div>

      {/* SPAL blob mascot — shown above the card except on welcome (shown inline) */}
      {!isWelcome && (
        <motion.div
          key={`mascot-${step}`}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.34, 1.2, 0.64, 1] }}
          className="fixed z-[102] pointer-events-none"
          style={{
            ...getMascotPosition(current.cardPosition),
            left: 20,
          }}
        >
          <Image
            src="/spal AI.png"
            alt="SPAL"
            width={64}
            height={64}
            style={{ width: 64, height: 64, objectFit: "contain" }}
          />
        </motion.div>
      )}

      {/* Tooltip card */}
      <motion.div
        key={`card-${step}`}
        initial={{ opacity: 0, y: 10, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.97 }}
        transition={{ duration: 0.3, ease: [0.34, 1.1, 0.64, 1] }}
        className="fixed z-[102] pointer-events-auto"
        style={{ left: 20, right: 20, ...cardStyle }}
      >
        <div
          className="rounded-3xl px-5 py-5"
          style={{ background: "#fff", boxShadow: "0 16px 48px rgba(0,0,0,0.20)" }}
        >
          {/* Welcome step — blob above text */}
          {isWelcome && (
            <div className="flex justify-center mb-4">
              <Image
                src="/spal AI.png"
                alt="SPAL"
                width={72}
                height={72}
                style={{ width: 72, height: 72, objectFit: "contain" }}
              />
            </div>
          )}

          {/* Progress bars — steps 2+ */}
          {showProgress && (
            <div className="flex gap-1.5 mb-4">
              {STEPS.slice(2).map((_, i) => {
                const idx = i + 2;
                return (
                  <div
                    key={idx}
                    className="h-[3px] flex-1 rounded-full transition-all duration-300"
                    style={{ background: idx <= step ? "#22C55E" : "#E5E7EB" }}
                  />
                );
              })}
            </div>
          )}

          {/* Title */}
          {current.title && (
            <h3
              className="font-bold text-[16px] leading-snug mb-2"
              style={{ fontFamily: "var(--font-satoshi)", color: "#0F172A" }}
            >
              {current.title}
            </h3>
          )}

          {/* Body paragraphs */}
          <div className="space-y-2">
            {current.body.map((line, i) => (
              <p
                key={i}
                className="text-[13.5px] leading-relaxed"
                style={{ fontFamily: "var(--font-satoshi)", color: "#6B7280" }}
              >
                {line}
              </p>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between mt-5">
            {isWelcome ? (
              <>
                <button
                  onClick={dismiss}
                  className="text-[13px] font-semibold active:opacity-60 transition-opacity"
                  style={{ fontFamily: "var(--font-satoshi)", color: "#22C55E" }}
                >
                  I&apos;d figure it out myself
                </button>
                <button
                  onClick={next}
                  className="h-[38px] px-6 rounded-full font-semibold text-[13.5px] active:scale-95 transition-transform"
                  style={{ fontFamily: "var(--font-satoshi)", background: "#22C55E", color: "#fff" }}
                >
                  Show Me
                </button>
              </>
            ) : (
              <>
                {hasPrev ? (
                  <button
                    onClick={prev}
                    className="text-[13px] font-semibold active:opacity-60 transition-opacity"
                    style={{ fontFamily: "var(--font-satoshi)", color: "#22C55E" }}
                  >
                    Previous
                  </button>
                ) : (
                  <div />
                )}
                <button
                  onClick={next}
                  className="h-[38px] px-6 rounded-full font-semibold text-[13.5px] active:scale-95 transition-transform"
                  style={{ fontFamily: "var(--font-satoshi)", background: "#22C55E", color: "#fff" }}
                >
                  {isLast ? "Got it!" : "Next"}
                </button>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function getMascotPosition(pos: Step["cardPosition"]): React.CSSProperties {
  if (pos === "center") return { top: "calc(50% - 140px)" };
  if ("top" in pos) return { top: `${pos.top - 68}px` };
  return { bottom: `${pos.bottom + 220}px` };
}
