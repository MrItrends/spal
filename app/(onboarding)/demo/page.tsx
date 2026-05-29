"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";

const DEMO_STEPS = [
  {
    title: "Just talk to SPAL",
    body: 'Say something like: "Sold drinks for 15k and bought fuel for 4k"',
    visual: <VoiceVisual />,
  },
  {
    title: "SPAL understands it",
    body: "SPAL reads your words and automatically splits sales from expenses.",
    visual: <ParseVisual />,
  },
  {
    title: "See your profit clearly",
    body: "No maths needed. SPAL calculates everything and tells you in plain words.",
    visual: <InsightVisual />,
  },
];

export default function DemoPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  function next() {
    if (step < DEMO_STEPS.length - 1) setStep(step + 1);
    else router.push("/preview");
  }

  const current = DEMO_STEPS[step];

  return (
    <div className="flex-1 flex flex-col px-6 pt-12 pb-8">
      <StepIndicator current={3} total={5} />

      <div className="flex-1 flex flex-col items-center justify-center gap-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}
            className="w-full flex flex-col items-center gap-6"
          >
            {/* Visual */}
            <div className="w-full">{current.visual}</div>

            {/* Text */}
            <div className="text-center">
              <h2 className="text-xl font-bold text-spal-navy">{current.title}</h2>
              <p className="mt-2 text-neutral-500 text-sm leading-relaxed">
                {current.body}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Dot indicators */}
        <div className="flex gap-2">
          {DEMO_STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === step ? "w-6 bg-spal-green" : "w-2 bg-neutral-200"
              }`}
            />
          ))}
        </div>
      </div>

      <Button fullWidth size="lg" onClick={next}>
        {step < DEMO_STEPS.length - 1 ? "Next →" : "See it in action →"}
      </Button>
    </div>
  );
}

function VoiceVisual() {
  return (
    <div className="bg-spal-navy rounded-2xl p-6 flex flex-col items-center gap-4">
      <div className="flex items-end gap-1 h-12">
        {[3, 6, 9, 12, 9, 7, 11, 8, 5, 9, 6, 4].map((h, i) => (
          <div
            key={i}
            className="wave-bar w-2 bg-spal-green rounded-full"
            style={{ height: `${h * 3}px` }}
          />
        ))}
      </div>
      <p className="text-white/60 text-sm">SPAL is listening…</p>
      <div className="bg-white/10 rounded-xl px-4 py-2 text-white/90 text-sm italic">
        &quot;Sold drinks for 15k, bought fuel for 4k&quot;
      </div>
    </div>
  );
}

function ParseVisual() {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3 border border-neutral-100">
      <p className="text-xs text-neutral-400 font-medium uppercase tracking-wide">
        We heard:
      </p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-spal-green" />
          <span className="text-sm text-spal-navy">Drinks (Sale)</span>
        </div>
        <span className="font-bold text-spal-green text-sm">+₦15,000</span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-spal-orange" />
          <span className="text-sm text-spal-navy">Fuel (Expense)</span>
        </div>
        <span className="font-bold text-spal-orange text-sm">-₦4,000</span>
      </div>
      <p className="text-xs text-neutral-400 pt-1 border-t border-neutral-100">
        Looks right to you?
      </p>
    </div>
  );
}

function InsightVisual() {
  return (
    <div className="bg-spal-green rounded-2xl p-5 text-white">
      <p className="text-green-100 text-xs font-medium uppercase tracking-wide">
        Today&apos;s Result
      </p>
      <p className="text-4xl font-bold mt-2">₦11,000</p>
      <p className="text-green-100 text-sm">profit today 🎉</p>
      <div className="mt-4 bg-white/10 rounded-xl p-3">
        <p className="text-white/90 text-sm">
          💡 Fuel was your biggest cost today. Try to buy in bulk to save more.
        </p>
      </div>
    </div>
  );
}

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
            i <= current ? "bg-spal-green" : "bg-neutral-200"
          }`}
        />
      ))}
    </div>
  );
}
