"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function WelcomePage() {
  const router = useRouter();

  return (
    <div className="flex-1 flex flex-col" style={{ background: "#F8F7F4" }}>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-6 pt-14 pb-48">

        {/* SPAL Logo */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
          className="mb-10"
        >
          <SPALLogo />
        </motion.div>

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        >
          <h1
            className="font-bold leading-[1.1] text-spal-navy"
            style={{
              fontSize: "clamp(34px, 9.5vw, 44px)",
              fontFamily: "var(--font-satoshi)",
              letterSpacing: "-0.03em",
            }}
          >
            Your business.
            <br />
            <span style={{ color: "#22C55E" }}>Understood.</span>
          </h1>
          <p
            className="mt-4 text-[15px] leading-relaxed text-neutral-400"
            style={{ fontFamily: "var(--font-satoshi)", maxWidth: "280px" }}
          >
            Track sales, know your real profit, and grow — no accounting skills needed.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.4 }}
          className="mt-8 flex gap-7"
        >
          {[
            { value: "2 min", label: "to set up" },
            { value: "Free",  label: "to start"  },
            { value: "AI",    label: "powered"   },
          ].map((s) => (
            <div key={s.label}>
              <p className="font-bold text-[18px] text-spal-navy" style={{ fontFamily: "var(--font-satoshi)" }}>{s.value}</p>
              <p className="text-[12px] text-neutral-400" style={{ fontFamily: "var(--font-satoshi)" }}>{s.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Preview card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38, duration: 0.5 }}
          className="mt-10"
        >
          <PreviewCard />
        </motion.div>

      </div>

      {/* Fixed CTAs — always visible at bottom */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="px-6 pb-10 flex flex-col gap-3"
        style={{ paddingBottom: "max(2.5rem, env(safe-area-inset-bottom, 2.5rem))" }}
      >
        <button
          onClick={() => router.push("/business-type")}
          className="w-full h-14 rounded-full font-bold text-[15px] text-white"
          style={{
            fontFamily: "var(--font-satoshi)",
            background: "#0F172A",
            boxShadow: "0 4px 20px rgba(15,23,42,0.18)",
          }}
        >
          Get started
        </button>
        <button
          onClick={() => router.push("/login")}
          className="w-full h-11 text-[13px] text-center text-neutral-400"
          style={{ fontFamily: "var(--font-satoshi)" }}
        >
          Already have an account?{" "}
          <span className="text-spal-navy font-semibold">Sign in</span>
        </button>
      </motion.div>

    </div>
  );
}

/* ── SPAL Brand Logo ─────────────────────────────────────────────────────── */
function SPALLogo() {
  return (
    <svg width="120" height="44" viewBox="0 0 120 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* S */}
      <text
        x="0" y="38"
        fontSize="46" fontWeight="800"
        fontFamily="var(--font-satoshi), system-ui, sans-serif"
        fill="#22C55E"
        letterSpacing="-1"
      >S</text>
      {/* P */}
      <text
        x="30" y="38"
        fontSize="46" fontWeight="800"
        fontFamily="var(--font-satoshi), system-ui, sans-serif"
        fill="#2563EB"
        letterSpacing="-1"
      >P</text>
      {/* A */}
      <text
        x="60" y="38"
        fontSize="46" fontWeight="800"
        fontFamily="var(--font-satoshi), system-ui, sans-serif"
        fill="#FF8A00"
        letterSpacing="-1"
      >A</text>
      {/* L */}
      <text
        x="90" y="38"
        fontSize="46" fontWeight="800"
        fontFamily="var(--font-satoshi), system-ui, sans-serif"
        fill="#8B5CF6"
        letterSpacing="-1"
      >L</text>
    </svg>
  );
}

/* ── Preview Card ─────────────────────────────────────────────────────────── */
function PreviewCard() {
  return (
    <div
      className="rounded-2xl p-5 border"
      style={{
        background: "#ffffff",
        borderColor: "rgba(15,23,42,0.08)",
        boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-bold tracking-widest uppercase text-neutral-400" style={{ fontFamily: "var(--font-satoshi)" }}>
          Today&apos;s Pulse
        </span>
        <span className="text-[10px] text-neutral-300" style={{ fontFamily: "var(--font-satoshi)" }}>Sample</span>
      </div>

      <p className="text-[11px] text-neutral-400 mb-1" style={{ fontFamily: "var(--font-satoshi)" }}>Profit</p>
      <p
        className="font-bold mb-4"
        style={{ fontSize: "28px", color: "#22C55E", fontFamily: "var(--font-satoshi)", letterSpacing: "-0.02em" }}
      >
        ₦12,500
      </p>

      <div className="flex gap-5">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-neutral-400 mb-0.5" style={{ fontFamily: "var(--font-satoshi)" }}>Sales</p>
          <p className="font-semibold text-[13px] text-spal-navy" style={{ fontFamily: "var(--font-satoshi)" }}>₦18,500</p>
        </div>
        <div className="w-px bg-neutral-100" />
        <div>
          <p className="text-[10px] uppercase tracking-wider text-neutral-400 mb-0.5" style={{ fontFamily: "var(--font-satoshi)" }}>Expenses</p>
          <p className="font-semibold text-[13px]" style={{ fontFamily: "var(--font-satoshi)", color: "#F97316" }}>₦6,000</p>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-neutral-100">
        <p className="text-[12px] text-neutral-400 leading-relaxed" style={{ fontFamily: "var(--font-satoshi)" }}>
          Sales are up from yesterday. Keep it up.
        </p>
      </div>
    </div>
  );
}
