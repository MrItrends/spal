"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { PillChip } from "@/components/ui/PillChip";
import { Button } from "@/components/ui/Button";
import { useSPALStore, type BusinessGoal } from "@/store";

const GOALS: {
  goal: BusinessGoal;
  label: string;
  emoji: string;
  color: "green" | "blue" | "orange" | "purple";
}[] = [
  { goal: "track_sales",         label: "Track my sales daily",     emoji: "📊", color: "green"  },
  { goal: "know_profit",         label: "Know my real profit",       emoji: "💰", color: "blue"   },
  { goal: "reduce_expenses",     label: "Reduce my expenses",        emoji: "✂️", color: "orange" },
  { goal: "grow_business",       label: "Grow my business",          emoji: "🚀", color: "purple" },
  { goal: "understand_spending", label: "Understand my spending",    emoji: "🔍", color: "blue"   },
];

export default function GoalsPage() {
  const router = useRouter();
  const { setOnboardingData } = useSPALStore();
  const [selected, setSelected] = useState<Set<BusinessGoal>>(new Set());

  function toggleGoal(goal: BusinessGoal) {
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
    <div className="flex-1 flex flex-col px-6 pt-12 pb-8 overflow-y-auto scroll-container">
      <StepIndicator current={2} total={5} />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-8"
      >
        <h1 className="text-2xl font-bold text-spal-navy leading-tight">
          What do you want to understand?
        </h1>
        <p className="mt-2 text-neutral-500 text-sm">
          Pick all that apply. SPAL will focus on what matters to you.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="mt-8 flex flex-wrap gap-3"
      >
        {GOALS.map((item, i) => (
          <motion.div
            key={item.goal}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.06 + 0.1 }}
          >
            <PillChip
              label={item.label}
              icon={item.emoji}
              color={item.color}
              selected={selected.has(item.goal)}
              onClick={() => toggleGoal(item.goal)}
            />
          </motion.div>
        ))}
      </motion.div>

      <div className="flex-1" />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-6"
      >
        <Button
          fullWidth
          size="lg"
          disabled={selected.size === 0}
          onClick={handleContinue}
        >
          Continue →
        </Button>
        <button
          className="w-full mt-3 text-center text-sm text-neutral-400 py-2"
          onClick={() => router.push("/demo")}
        >
          Skip for now
        </button>
      </motion.div>
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
