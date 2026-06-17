"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft01Icon, Tick01Icon, Target01Icon, Calendar03Icon, Delete02Icon,
} from "hugeicons-react";
import { useSPALStore } from "@/store";

const BG = "#EEF3E9";

export default function GoalDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { coachGoals, toggleBreakdown, markGoalAchieved, setGoalDueDate, deleteCoachGoal } = useSPALStore();

  const goal = useMemo(() => coachGoals.find((g) => g.id === id), [coachGoals, id]);

  if (!goal) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center px-8 text-center" style={{ background: BG }}>
        <p className="text-[16px] font-bold text-spal-navy mb-4" style={{ fontFamily: "var(--font-satoshi)" }}>
          This goal isn&apos;t here anymore
        </p>
        <button
          onClick={() => router.push("/set-goals/list")}
          className="h-11 px-6 rounded-full text-white font-bold text-[14px]"
          style={{ background: "#22C55E", fontFamily: "var(--font-satoshi)" }}
        >
          Back to goals
        </button>
      </div>
    );
  }

  const done = goal.breakdowns.filter((b) => b.completed).length;
  const total = goal.breakdowns.length;
  const allDone = goal.progress === 100;

  return (
    <div className="min-h-full" style={{ background: BG }}>
      {/* Header */}
      <div className="px-5 pt-12 pb-3 flex items-center gap-3">
        <button
          onClick={() => router.push("/set-goals/list")}
          className="w-10 h-10 rounded-full bg-white flex items-center justify-center active:scale-95 transition-transform flex-shrink-0"
          style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.08)" }}
          aria-label="Back"
        >
          <ArrowLeft01Icon size={18} color="#0F172A" />
        </button>
        <p className="text-[15px] font-semibold text-spal-navy" style={{ fontFamily: "var(--font-satoshi)" }}>Goal</p>
        <button
          onClick={() => { deleteCoachGoal(goal.id); router.push("/set-goals/list"); }}
          className="ml-auto w-10 h-10 rounded-full bg-white flex items-center justify-center active:scale-95 transition-transform flex-shrink-0"
          style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.08)" }}
          aria-label="Delete goal"
        >
          <Delete02Icon size={17} color="#DC2626" />
        </button>
      </div>

      <div className="px-5 pb-32">
        {/* Title + progress */}
        <div className="flex items-start gap-3 mt-2 mb-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#E0F4E9" }}>
            <Target01Icon size={22} color="#16A34A" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-black text-spal-navy leading-tight" style={{ fontFamily: "var(--font-satoshi)", fontSize: "clamp(22px, 6vw, 26px)" }}>
              {goal.title}
            </h1>
            <p className="text-[13px] text-neutral-500 mt-1">{done} of {total} steps done</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2.5 rounded-full bg-white overflow-hidden mb-1.5">
          <motion.div
            className="h-full rounded-full"
            style={{ background: "#22C55E" }}
            initial={false}
            animate={{ width: `${goal.progress}%` }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          />
        </div>
        <p className="text-[12px] font-bold text-right mb-5" style={{ color: "#16A34A", fontFamily: "var(--font-satoshi)" }}>
          {goal.progress}%
        </p>

        {/* Due date */}
        <label className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 mb-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
          <Calendar03Icon size={18} color="#6B7280" className="flex-shrink-0" />
          <span className="text-[13px] font-medium text-spal-navy flex-shrink-0" style={{ fontFamily: "var(--font-satoshi)" }}>Due date</span>
          <input
            type="date"
            value={goal.dueDate ? goal.dueDate.slice(0, 10) : ""}
            onChange={(e) => setGoalDueDate(goal.id, e.target.value ? new Date(e.target.value).toISOString() : null)}
            className="ml-auto text-[13px] text-spal-navy bg-transparent outline-none text-right"
            style={{ fontFamily: "var(--font-satoshi)" }}
          />
        </label>

        {/* Checklist */}
        <p className="text-[11px] font-bold tracking-widest text-neutral-400 uppercase mb-3" style={{ fontFamily: "var(--font-satoshi)" }}>
          Steps
        </p>
        <div className="space-y-2.5">
          {goal.breakdowns.map((b) => (
            <button
              key={b.id}
              onClick={() => toggleBreakdown(goal.id, b.id)}
              className="w-full flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 active:scale-[0.99] transition-transform text-left"
              style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
            >
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors"
                style={{
                  background: b.completed ? "#22C55E" : "transparent",
                  border: b.completed ? "none" : "2px solid #D1D5DB",
                }}
              >
                {b.completed && <Tick01Icon size={14} color="#fff" />}
              </span>
              <span
                className="text-[14.5px] font-medium"
                style={{
                  fontFamily: "var(--font-satoshi)",
                  color: b.completed ? "#9CA3AF" : "#121212",
                  textDecoration: b.completed ? "line-through" : "none",
                }}
              >
                {b.title}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Mark all as achieved */}
      <div className="fixed left-1/2 -translate-x-1/2 w-full max-w-[480px] px-5" style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 20px)" }}>
        <button
          onClick={() => markGoalAchieved(goal.id)}
          disabled={allDone}
          className="w-full h-13 py-4 rounded-2xl flex items-center justify-center gap-2 text-white font-bold text-[15px] active:scale-[0.98] transition-transform disabled:opacity-60"
          style={{ background: allDone ? "#16A34A" : "#22C55E", boxShadow: "0 8px 24px rgba(34,197,94,0.4)", fontFamily: "var(--font-satoshi)" }}
        >
          <Tick01Icon size={18} color="#fff" />
          {allDone ? "All steps achieved" : "Mark All As Achieved"}
        </button>
      </div>
    </div>
  );
}
