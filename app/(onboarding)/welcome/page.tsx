"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { TrendingUp, Mic, Lightbulb, Target } from "lucide-react";

export default function WelcomePage() {
  const router = useRouter();

  return (
    <div
      className="flex-1 flex flex-col relative overflow-hidden"
      style={{ background: "#22C55E" }}
    >
      {/* Background texture — subtle radial shadows for depth */}
      <div
        className="absolute top-0 right-0 w-72 h-72 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle at 80% 0%, rgba(255,255,255,0.15) 0%, transparent 60%)" }}
      />
      <div
        className="absolute bottom-0 left-0 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle at 10% 100%, rgba(0,0,0,0.12) 0%, transparent 55%)" }}
      />

      {/* Scrollable content */}
      <div className="relative flex-1 overflow-y-auto px-6 pt-14 pb-52">

        {/* SPAL wordmark */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <SPALWordmark />
        </motion.div>

        {/* Main headline */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        >
          <h1
            className="text-white font-black leading-[1.0]"
            style={{
              fontSize: "clamp(40px, 11vw, 52px)",
              fontFamily: "var(--font-satoshi)",
              letterSpacing: "-0.03em",
            }}
          >
            Your business.
            <br />
            Understood.
          </h1>
          <p
            className="mt-4 text-white/65 text-[15px] leading-relaxed"
            style={{ fontFamily: "var(--font-satoshi)", maxWidth: "260px" }}
          >
            Track sales, know your profit, and grow — no accounting needed.
          </p>
        </motion.div>

        {/* Floating feature chips */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.4 }}
          className="mt-7 flex flex-wrap gap-2.5"
        >
          <FeatureChip icon={<TrendingUp size={13} strokeWidth={2} />} label="Track Sales" />
          <FeatureChip icon={<Lightbulb    size={13} strokeWidth={2} />} label="Know Your Profit" />
          <FeatureChip icon={<Mic          size={13} strokeWidth={2} />} label="Voice Entry" />
          <FeatureChip icon={<Target       size={13} strokeWidth={2} />} label="Set Goals" />
        </motion.div>

        {/* Dashboard preview card */}
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.40, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          className="mt-8"
        >
          <PreviewCard />
        </motion.div>

      </div>

      {/* CTA — always at bottom */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.56, duration: 0.4 }}
        className="relative z-10 px-6 pb-10 flex flex-col gap-3"
        style={{ paddingBottom: "max(2.5rem, env(safe-area-inset-bottom, 2.5rem))" }}
      >
        <button
          onClick={() => router.push("/business-type")}
          className="w-full h-14 rounded-full font-bold text-[15px]"
          style={{
            fontFamily: "var(--font-satoshi)",
            background: "#ffffff",
            color: "#0F172A",
            boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
          }}
        >
          Get started
        </button>
        <button
          onClick={() => router.push("/login")}
          className="w-full h-11 text-[13px] text-center text-white/60"
          style={{ fontFamily: "var(--font-satoshi)" }}
        >
          Already have an account?{" "}
          <span className="text-white font-semibold">Sign in</span>
        </button>
      </motion.div>

    </div>
  );
}

/* ── Feature chip ─────────────────────────────────────────────────────────── */
function FeatureChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div
      className="flex items-center gap-1.5 px-3 py-2 rounded-full"
      style={{
        background: "rgba(0,0,0,0.18)",
        backdropFilter: "blur(8px)",
        border: "1px solid rgba(255,255,255,0.2)",
      }}
    >
      <span className="text-white/80">{icon}</span>
      <span
        className="text-white text-[12px] font-semibold"
        style={{ fontFamily: "var(--font-satoshi)" }}
      >
        {label}
      </span>
    </div>
  );
}

/* ── SPAL wordmark ────────────────────────────────────────────────────────── */
function SPALWordmark() {
  return (
    <div className="flex items-baseline gap-0.5">
      {[
        { letter: "S", color: "#ffffff" },
        { letter: "P", color: "rgba(255,255,255,0.85)" },
        { letter: "A", color: "rgba(255,255,255,0.85)" },
        { letter: "L", color: "rgba(255,255,255,0.85)" },
      ].map(({ letter, color }) => (
        <span
          key={letter}
          className="font-black"
          style={{
            fontSize: "36px",
            fontFamily: "var(--font-satoshi)",
            color,
            letterSpacing: "-0.04em",
            lineHeight: 1,
          }}
        >
          {letter}
        </span>
      ))}
    </div>
  );
}

/* ── Preview card (dark on green) ────────────────────────────────────────── */
function PreviewCard() {
  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: "rgba(15,23,42,0.85)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span
          className="text-[10px] font-bold tracking-widest uppercase text-white/30"
          style={{ fontFamily: "var(--font-satoshi)" }}
        >
          Today&apos;s Pulse
        </span>
        <span
          className="text-[10px] text-white/20"
          style={{ fontFamily: "var(--font-satoshi)" }}
        >
          Sample
        </span>
      </div>

      {/* Profit */}
      <p className="text-[11px] text-white/30 mb-0.5" style={{ fontFamily: "var(--font-satoshi)" }}>
        Profit
      </p>
      <p
        className="font-bold mb-4"
        style={{
          fontSize: "32px",
          color: "#4ADE80",
          fontFamily: "var(--font-satoshi)",
          letterSpacing: "-0.025em",
        }}
      >
        ₦12,500
      </p>

      {/* Sales / Expenses */}
      <div className="flex gap-5 mb-4">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-white/25 mb-0.5" style={{ fontFamily: "var(--font-satoshi)" }}>
            Sales
          </p>
          <p className="font-semibold text-[13px] text-white/70" style={{ fontFamily: "var(--font-satoshi)" }}>
            ₦18,500
          </p>
        </div>
        <div className="w-px bg-white/8" />
        <div>
          <p className="text-[10px] uppercase tracking-wider text-white/25 mb-0.5" style={{ fontFamily: "var(--font-satoshi)" }}>
            Expenses
          </p>
          <p className="font-semibold text-[13px]" style={{ fontFamily: "var(--font-satoshi)", color: "#FB923C" }}>
            ₦6,000
          </p>
        </div>
      </div>

      {/* AI insight strip */}
      <div
        className="rounded-xl px-3 py-2.5"
        style={{ background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.2)" }}
      >
        <p className="text-[12px] leading-relaxed text-white/60" style={{ fontFamily: "var(--font-satoshi)" }}>
          ✦ Sales are up from yesterday. Keep it up.
        </p>
      </div>
    </div>
  );
}
