"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency } from "@/lib/utils/currency";

// ─────────────────────────────────────────────────────────────────────────────
// Types & constants
// ─────────────────────────────────────────────────────────────────────────────

type GoalType = "daily_sales" | "weekly_profit" | "monthly_sales" | "yearly_revenue";

interface GoalData {
  id:        string;
  goal_type: GoalType;
  target:    number;
  current:   number;
  progress:  number;   // 0–100
  completed: boolean;
}

const GOAL_META: Record<GoalType, { label: string; period: string; emoji: string; color: string; ring: string; bg: string; border: string }> = {
  daily_sales:    { label: "Daily Sales",      period: "today",     emoji: "🌅", color: "text-spal-green",  ring: "#1DB954", bg: "bg-spal-green-50",  border: "border-spal-green-100"  },
  weekly_profit:  { label: "Weekly Profit",    period: "this week", emoji: "💰", color: "text-spal-blue",   ring: "#3B82F6", bg: "bg-spal-blue-50",   border: "border-spal-blue-100"   },
  monthly_sales:  { label: "Monthly Sales",    period: "this month",emoji: "📈", color: "text-spal-orange", ring: "#F97316", bg: "bg-spal-orange-50", border: "border-spal-orange-100" },
  yearly_revenue: { label: "Yearly Revenue",   period: "this year", emoji: "🏆", color: "text-spal-purple", ring: "#8B5CF6", bg: "bg-spal-purple-50", border: "border-spal-purple-100" },
};

const GOAL_ORDER: GoalType[] = ["daily_sales", "weekly_profit", "monthly_sales", "yearly_revenue"];

function motivationalMsg(pct: number, name: string): string {
  if (pct === 0)        return `Set a target and let's crush it together! 💪`;
  if (pct < 25)         return `You've started, ${name}! Every naira counts. Keep going! 🌱`;
  if (pct < 50)         return `Building momentum — you're doing great! 🔥`;
  if (pct < 75)         return `Past halfway! You're stronger than you think! ⚡`;
  if (pct < 100)        return `Almost there! One final push and you've got it! 🚀`;
  return                `GOAL CRUSHED! You're an absolute boss! 🏆🎉`;
}

// ─────────────────────────────────────────────────────────────────────────────
// SVG Progress ring
// ─────────────────────────────────────────────────────────────────────────────

function ProgressRing({ pct, color, size = 76 }: { pct: number; color: string; size?: number }) {
  const r   = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(pct, 100) / 100) * circ;

  return (
    <svg width={size} height={size} className="-rotate-90">
      {/* Track */}
      <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={7} stroke="#f3f4f6" fill="none" />
      {/* Progress */}
      <motion.circle
        cx={size / 2} cy={size / 2} r={r}
        strokeWidth={7} stroke={color} fill="none"
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.1, ease: "easeOut", delay: 0.2 }}
      />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Confetti burst — Framer Motion particles, no library needed
// ─────────────────────────────────────────────────────────────────────────────

const CONFETTI_COLORS = ["#1DB954", "#F97316", "#3B82F6", "#8B5CF6", "#EF4444", "#FBBF24"];

function Confetti({ active }: { active: boolean }) {
  const particles = useRef(
    Array.from({ length: 24 }, (_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 220,
      y: -(Math.random() * 180 + 60),
      rot: Math.random() * 720 - 360,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      w: Math.random() * 8 + 5,
      h: Math.random() * 5 + 3,
    }))
  );

  return (
    <AnimatePresence>
      {active && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-10 flex items-center justify-center">
          {particles.current.map((p) => (
            <motion.div
              key={p.id}
              className="absolute rounded-sm"
              style={{ width: p.w, height: p.h, background: p.color, top: "50%", left: "50%" }}
              initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 }}
              animate={{ x: p.x, y: p.y, opacity: 0, rotate: p.rot, scale: 0.5 }}
              transition={{ duration: 0.9, ease: "easeOut" }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Set-goal bottom sheet
// ─────────────────────────────────────────────────────────────────────────────

function SetGoalSheet({
  goalType,
  existing,
  onSave,
  onClose,
}: {
  goalType: GoalType;
  existing: number | null;
  onSave: (amount: number) => void;
  onClose: () => void;
}) {
  const meta = GOAL_META[goalType];
  const [raw, setRaw] = useState(existing ? String(existing) : "");
  const [saving, setSaving] = useState(false);

  async function save() {
    const val = Number(raw.replace(/,/g, ""));
    if (!val || val <= 0) return;
    setSaving(true);
    await onSave(val);
    setSaving(false);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-spal-navy/40 backdrop-blur-sm" />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 26, stiffness: 300 }}
        className="relative w-full max-w-[480px] bg-white rounded-t-3xl shadow-2xl overflow-hidden"
        style={{ maxHeight: "92dvh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-neutral-200 rounded-full" />
        </div>

        {/* Single scrollable zone */}
        <div
          className="overflow-y-auto overscroll-contain px-6 pt-3"
          style={{
            maxHeight: "calc(92dvh - 24px)",
            paddingBottom: "max(2rem, env(safe-area-inset-bottom, 2rem))",
          }}
        >

        <div className="flex items-center gap-3 mb-6">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl ${meta.bg} border ${meta.border}`}>
            {meta.emoji}
          </div>
          <div>
            <h2 className="text-base font-bold text-spal-navy font-[family-name:var(--font-satoshi)]">
              Set {meta.label} Target
            </h2>
            <p className="text-xs text-neutral-400">How much do you want to {goalType === "weekly_profit" ? "earn as profit" : "make in sales"} {meta.period}?</p>
          </div>
        </div>

        {/* Amount input */}
        <div className="relative mb-6">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-neutral-400">₦</span>
          <input
            type="number"
            inputMode="numeric"
            placeholder="0"
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            className="w-full pl-9 pr-4 py-4 text-2xl font-bold text-spal-navy rounded-2xl border-2 border-neutral-100 focus:border-spal-green outline-none bg-neutral-50 transition-colors"
          />
        </div>

        {/* Quick presets */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {([5000, 10000, 20000, 50000, 100000] as const).map((v) => (
            <button
              key={v}
              onClick={() => setRaw(String(v))}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                Number(raw) === v
                  ? `${meta.bg} ${meta.color} ${meta.border}`
                  : "bg-neutral-50 text-neutral-500 border-neutral-100"
              }`}
            >
              ₦{v >= 1000 ? `${v / 1000}k` : v}
            </button>
          ))}
        </div>

        <button
          onClick={save}
          disabled={!raw || Number(raw) <= 0 || saving}
          className="w-full h-14 rounded-2xl bg-spal-navy text-white font-bold text-base disabled:opacity-30 active:scale-[0.98] transition-all"
        >
          {saving ? "Saving…" : existing ? "Update Goal" : "Set Goal 🎯"}
        </button>

        </div>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Goal card
// ─────────────────────────────────────────────────────────────────────────────

function GoalCard({
  goal,
  onEdit,
}: {
  goal: GoalData | null;
  goalType: GoalType;
  onEdit: () => void;
}) {
  const type = goal?.goal_type ?? ("" as GoalType);
  const meta = GOAL_META[type] ?? GOAL_META.daily_sales;
  const pct  = goal?.progress ?? 0;
  const [showConfetti, setShowConfetti] = useState(false);
  const prevCompleted = useRef(false);

  useEffect(() => {
    if (goal?.completed && !prevCompleted.current) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 1000);
    }
    prevCompleted.current = goal?.completed ?? false;
  }, [goal?.completed]);

  if (!goal) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative rounded-3xl p-4 border ${meta.bg} ${meta.border} overflow-hidden`}
    >
      <Confetti active={showConfetti} />

      {/* Top row */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className="text-lg leading-none">{meta.emoji}</span>
          <p className="text-xs font-bold text-neutral-600 mt-0.5 font-[family-name:var(--font-satoshi)]">{meta.label}</p>
        </div>
        <button onClick={onEdit} className="text-[10px] text-neutral-400 font-semibold underline underline-offset-2">
          Edit
        </button>
      </div>

      {/* Progress ring + % in center */}
      <div className="flex items-center gap-4">
        <div className="relative flex-shrink-0">
          <ProgressRing pct={pct} color={meta.ring} size={76} />
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.span
              key={pct}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`text-sm font-extrabold ${meta.color} font-[family-name:var(--font-satoshi)]`}
            >
              {pct}%
            </motion.span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <p className={`text-lg font-extrabold ${meta.color} font-[family-name:var(--font-satoshi)] leading-tight`}>
            {formatCurrency(goal.current)}
          </p>
          <p className="text-xs text-neutral-400 mt-0.5">of {formatCurrency(goal.target)}</p>

          {/* Mini progress bar */}
          <div className="mt-2 h-1.5 rounded-full bg-white/60 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: meta.ring }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(pct, 100)}%` }}
              transition={{ duration: 1.1, ease: "easeOut", delay: 0.3 }}
            />
          </div>
        </div>
      </div>

      {/* Celebration badge */}
      {goal.completed && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 10, stiffness: 200 }}
          className="mt-3 flex items-center gap-1.5 bg-white/70 rounded-xl px-3 py-1.5 w-fit"
        >
          <span className="text-sm">🏆</span>
          <span className="text-xs font-bold text-spal-navy">Goal crushed!</span>
        </motion.div>
      )}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty goal slot (not set yet)
// ─────────────────────────────────────────────────────────────────────────────

function EmptyGoalCard({ goalType, onSet }: { goalType: GoalType; onSet: () => void }) {
  const meta = GOAL_META[goalType];
  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.97 }}
      onClick={onSet}
      className={`w-full rounded-3xl p-4 border-2 border-dashed ${meta.border} bg-white/60 flex flex-col items-center gap-2 py-7`}
    >
      <span className="text-2xl opacity-50">{meta.emoji}</span>
      <p className="text-xs font-bold text-neutral-400 font-[family-name:var(--font-satoshi)]">{meta.label}</p>
      <span className={`text-xs font-semibold ${meta.color} bg-white rounded-full px-3 py-1 border ${meta.border}`}>
        + Set target
      </span>
    </motion.button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

export default function GoalsPage() {
  const [goals,     setGoals]     = useState<GoalData[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [editing,   setEditing]   = useState<GoalType | null>(null);

  const fetchGoals = useCallback(async () => {
    try {
      const res  = await fetch("/api/goals");
      const data = await res.json();
      if (data.success) setGoals(data.data);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  async function handleSave(goalType: GoalType, amount: number) {
    await fetch("/api/goals", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ goal_type: goalType, target_amount: amount }),
    });
    setEditing(null);
    fetchGoals();
  }

  async function handleDelete(goalType: GoalType) {
    await fetch("/api/goals", {
      method:  "DELETE",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ goal_type: goalType }),
    });
    setEditing(null);
    fetchGoals();
  }

  const goalsMap = Object.fromEntries(goals.map((g) => [g.goal_type, g])) as Partial<Record<GoalType, GoalData>>;
  const anyGoal  = goals.length > 0;

  // Overall motivation based on average progress across all set goals
  const avgPct = anyGoal
    ? Math.round(goals.reduce((s, g) => s + g.progress, 0) / goals.length)
    : 0;

  return (
    <div className="px-4 pt-6 pb-24 space-y-5 animate-fade-in">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-spal-navy font-[family-name:var(--font-satoshi)]">Your Goals 🎯</h1>
        <p className="text-sm text-neutral-400 mt-0.5">Track what matters most to your business</p>
      </motion.div>

      {/* SPAL motivational banner */}
      {!loading && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-4 bg-spal-navy rounded-3xl px-5 py-4 overflow-hidden relative"
        >
          {/* Decorative ring */}
          <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/5" />
          <div className="absolute -right-2 -bottom-4 w-16 h-16 rounded-full bg-white/5" />

          {/* SPAL avatar */}
          <motion.div
            animate={{ rotate: [0, -5, 5, -5, 0] }}
            transition={{ duration: 1.2, delay: 0.6, ease: "easeInOut" }}
            className="w-12 h-12 bg-spal-green rounded-full flex items-center justify-center text-xl font-bold text-white flex-shrink-0 shadow-lg"
          >
            S
          </motion.div>

          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold leading-snug font-[family-name:var(--font-satoshi)]">
              {motivationalMsg(avgPct, "Boss")}
            </p>
            {anyGoal && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-white/20 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-spal-green"
                    initial={{ width: 0 }}
                    animate={{ width: `${avgPct}%` }}
                    transition={{ duration: 1.2, ease: "easeOut", delay: 0.4 }}
                  />
                </div>
                <span className="text-spal-green text-xs font-bold flex-shrink-0">{avgPct}%</span>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Goals grid */}
      {loading ? (
        <GoalsSkeleton />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {GOAL_ORDER.map((type, i) => {
            const goal = goalsMap[type];
            return goal ? (
              <motion.div
                key={type}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
              >
                <GoalCard
                  goal={goal}
                  goalType={type}
                  onEdit={() => setEditing(type)}
                />
              </motion.div>
            ) : (
              <motion.div
                key={type}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
              >
                <EmptyGoalCard goalType={type} onSet={() => setEditing(type)} />
              </motion.div>
            );
          })}
        </div>
      )}

      {/* No goals empty state */}
      {!loading && !anyGoal && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center py-4"
        >
          <p className="text-sm text-neutral-400 leading-relaxed">
            Set a target above and SPAL will track your progress every day.
            <br />
            <span className="font-semibold text-spal-green">Habit starts with one goal.</span>
          </p>
        </motion.div>
      )}

      {/* Tips / how it works */}
      {!loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-3xl border border-neutral-100 p-4 space-y-3 shadow-sm"
        >
          <p className="text-xs font-bold text-neutral-500 uppercase tracking-wide">How it works</p>
          {[
            { icon: "🎯", text: "Set a target amount for any time period" },
            { icon: "📊", text: "SPAL tracks your progress automatically from records" },
            { icon: "🔥", text: "Check back daily — habit builds retention" },
            { icon: "🎉", text: "Hit your goal and celebrate with confetti!" },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-3">
              <span className="text-lg flex-shrink-0">{icon}</span>
              <p className="text-sm text-neutral-500">{text}</p>
            </div>
          ))}
        </motion.div>
      )}

      {/* Set / edit goal sheet */}
      <AnimatePresence>
        {editing && (
          <SetGoalSheet
            goalType={editing}
            existing={goalsMap[editing]?.target ?? null}
            onSave={(amount) => handleSave(editing, amount)}
            onClose={() => setEditing(null)}
          />
        )}
      </AnimatePresence>

      {/* Delete option appears in sheet header when editing existing goal */}
      <AnimatePresence>
        {editing && goalsMap[editing] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-[calc(env(safe-area-inset-bottom)+310px)] left-1/2 -translate-x-1/2 z-[51] w-full max-w-[480px] px-6"
          >
            <button
              onClick={() => handleDelete(editing)}
              className="w-full py-3 text-sm text-red-400 font-semibold text-center"
            >
              Remove this goal
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────────────────────────────────────

function GoalsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-3xl bg-neutral-100 animate-pulse h-40" />
      ))}
    </div>
  );
}

