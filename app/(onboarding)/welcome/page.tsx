"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function WelcomePage() {
  const router = useRouter();

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden" style={{ background: "#0F172A" }}>

      {/* Subtle radial light — top left */}
      <div className="absolute top-0 left-0 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle at 20% 20%, rgba(34,197,94,0.12) 0%, transparent 65%)" }} />

      {/* Subtle radial light — bottom right */}
      <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle at 80% 80%, rgba(37,99,235,0.10) 0%, transparent 65%)" }} />

      {/* Content */}
      <div className="relative flex-1 flex flex-col px-6 pt-14 pb-10">

        {/* Logo mark */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.34, 1.2, 0.64, 1] }}
          className="mb-10"
        >
          <SPALMark />
        </motion.div>

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        >
          <h1
            className="text-white font-bold leading-[1.1]"
            style={{ fontSize: "clamp(36px, 10vw, 44px)", fontFamily: "var(--font-satoshi)", letterSpacing: "-0.03em" }}
          >
            Your business.
            <br />
            <span style={{ color: "#22C55E" }}>Understood.</span>
          </h1>
          <p className="mt-4 text-white/45 text-[15px] leading-relaxed max-w-[280px]" style={{ fontFamily: "var(--font-satoshi)" }}>
            Track your sales, know your real profit, and grow — no accounting needed.
          </p>
        </motion.div>

        {/* Stats strip — social proof */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="mt-10 flex gap-5"
        >
          {[
            { value: "2 min", label: "to set up" },
            { value: "Free", label: "to start" },
            { value: "AI", label: "powered" },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-white font-bold text-lg" style={{ fontFamily: "var(--font-satoshi)" }}>{stat.value}</p>
              <p className="text-white/35 text-xs" style={{ fontFamily: "var(--font-satoshi)" }}>{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Dashboard preview — minimal dark card */}
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.42, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          className="mt-10 flex-1"
        >
          <DashboardPreview />
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.58, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="mt-8 flex flex-col gap-3"
        >
          <button
            onClick={() => router.push("/business-type")}
            className="w-full h-14 rounded-full font-bold text-[15px]"
            style={{
              background: "#22C55E",
              color: "#fff",
              fontFamily: "var(--font-satoshi)",
              boxShadow: "0 4px 20px rgba(34,197,94,0.35)",
            }}
          >
            Get started
          </button>
          <button
            className="w-full h-12 text-white/40 text-[13px] text-center"
            style={{ fontFamily: "var(--font-satoshi)" }}
            onClick={() => router.push("/login")}
          >
            Already have an account? <span className="text-white/70 font-semibold">Sign in</span>
          </button>
        </motion.div>

      </div>
    </div>
  );
}

function DashboardPreview() {
  return (
    <div
      className="rounded-2xl p-5 border"
      style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-white/30 text-[10px] font-semibold tracking-widest uppercase" style={{ fontFamily: "var(--font-satoshi)" }}>
          Today&apos;s Pulse
        </span>
        <span className="text-white/20 text-[10px]" style={{ fontFamily: "var(--font-satoshi)" }}>Sample</span>
      </div>
      <p className="text-white/25 text-xs mb-1" style={{ fontFamily: "var(--font-satoshi)" }}>Profit</p>
      <p className="font-bold mb-5" style={{ fontSize: "32px", color: "#22C55E", fontFamily: "var(--font-satoshi)", letterSpacing: "-0.02em" }}>
        ₦12,500
      </p>
      <div className="flex gap-6">
        <div>
          <p className="text-white/25 text-[10px] uppercase tracking-wider mb-0.5" style={{ fontFamily: "var(--font-satoshi)" }}>Sales</p>
          <p className="text-white/60 font-semibold text-sm" style={{ fontFamily: "var(--font-satoshi)" }}>₦18,500</p>
        </div>
        <div className="w-px" style={{ background: "rgba(255,255,255,0.06)" }} />
        <div>
          <p className="text-white/25 text-[10px] uppercase tracking-wider mb-0.5" style={{ fontFamily: "var(--font-satoshi)" }}>Expenses</p>
          <p className="font-semibold text-sm" style={{ fontFamily: "var(--font-satoshi)", color: "#F97316" }}>₦6,000</p>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <p className="text-white/35 text-xs leading-relaxed" style={{ fontFamily: "var(--font-satoshi)" }}>
          Sales are up from yesterday. Keep it up.
        </p>
      </div>
    </div>
  );
}

function SPALMark() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      {/* Outer ring */}
      <circle cx="24" cy="24" r="22" stroke="#22C55E" strokeWidth="1.5" strokeOpacity="0.3" />
      {/* Inner ring */}
      <circle cx="24" cy="24" r="14" stroke="#22C55E" strokeWidth="1.5" strokeOpacity="0.6" />
      {/* Center dot */}
      <circle cx="24" cy="24" r="4" fill="#22C55E" />
      {/* Orbital arc */}
      <path d="M24 2 A22 22 0 0 1 46 24" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
