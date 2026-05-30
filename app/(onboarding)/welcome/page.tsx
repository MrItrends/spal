"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function WelcomePage() {
  const router = useRouter();

  return (
    <div className="flex-1 flex flex-col relative" style={{ background: "#0F172A" }}>

      {/* Background glows — decorative, non-interactive */}
      <div className="absolute top-0 left-0 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle at 20% 20%, rgba(34,197,94,0.12) 0%, transparent 65%)" }} />
      <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle at 80% 80%, rgba(37,99,235,0.10) 0%, transparent 65%)" }} />

      {/* Scrollable content — no overflow-hidden so nothing clips */}
      <div className="relative flex-1 overflow-y-auto scroll-container px-6 pt-14 pb-48">

        {/* Logo mark */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.34, 1.2, 0.64, 1] }}
          className="mb-8"
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
            className="mt-3 text-[14px] leading-relaxed"
            style={{ fontFamily: "var(--font-satoshi)", color: "rgba(255,255,255,0.45)", maxWidth: "270px" }}
          >
            Track sales, know your real profit, and grow — no accounting needed.
          </p>
        </motion.div>

        {/* Stats strip */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.30, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="mt-8 flex gap-6"
        >
          {[
            { value: "2 min",  label: "to set up" },
            { value: "Free",   label: "to start"  },
            { value: "AI",     label: "powered"   },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-white font-bold text-[17px]" style={{ fontFamily: "var(--font-satoshi)" }}>{s.value}</p>
              <p className="text-[11px]" style={{ fontFamily: "var(--font-satoshi)", color: "rgba(255,255,255,0.3)" }}>{s.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Dashboard preview card */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.40, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          className="mt-8"
        >
          <DashboardPreview />
        </motion.div>

      </div>

      {/* CTA — always pinned to bottom, dark fade keeps it readable over any content */}
      <div
        className="absolute bottom-0 left-0 right-0 px-6 pb-10 pt-20 pointer-events-none"
        style={{ background: "linear-gradient(to top, #0F172A 55%, transparent)" }}
      />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="relative z-10 px-6 pb-10 flex flex-col gap-3"
        style={{ paddingBottom: "max(2.5rem, env(safe-area-inset-bottom, 2.5rem))" }}
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
          onClick={() => router.push("/login")}
          className="w-full h-11 text-[13px] text-center"
          style={{ fontFamily: "var(--font-satoshi)", color: "rgba(255,255,255,0.4)" }}
        >
          Already have an account?{" "}
          <span style={{ color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>Sign in</span>
        </button>
      </motion.div>

    </div>
  );
}

function DashboardPreview() {
  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.09)",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span
          className="text-[10px] font-semibold tracking-widest uppercase"
          style={{ fontFamily: "var(--font-satoshi)", color: "rgba(255,255,255,0.3)" }}
        >
          Today&apos;s Pulse
        </span>
        <span
          className="text-[10px]"
          style={{ fontFamily: "var(--font-satoshi)", color: "rgba(255,255,255,0.18)" }}
        >
          Sample
        </span>
      </div>

      <p className="text-[11px] mb-0.5" style={{ fontFamily: "var(--font-satoshi)", color: "rgba(255,255,255,0.25)" }}>Profit</p>
      <p
        className="font-bold mb-4"
        style={{ fontSize: "30px", color: "#22C55E", fontFamily: "var(--font-satoshi)", letterSpacing: "-0.02em" }}
      >
        ₦12,500
      </p>

      <div className="flex gap-6">
        <div>
          <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ fontFamily: "var(--font-satoshi)", color: "rgba(255,255,255,0.25)" }}>Sales</p>
          <p className="font-semibold text-[13px]" style={{ fontFamily: "var(--font-satoshi)", color: "rgba(255,255,255,0.65)" }}>₦18,500</p>
        </div>
        <div className="w-px" style={{ background: "rgba(255,255,255,0.07)" }} />
        <div>
          <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ fontFamily: "var(--font-satoshi)", color: "rgba(255,255,255,0.25)" }}>Expenses</p>
          <p className="font-semibold text-[13px]" style={{ fontFamily: "var(--font-satoshi)", color: "#F97316" }}>₦6,000</p>
        </div>
      </div>

      <div className="mt-4 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        <p className="text-[12px] leading-relaxed" style={{ fontFamily: "var(--font-satoshi)", color: "rgba(255,255,255,0.35)" }}>
          Sales are up from yesterday. Keep it up.
        </p>
      </div>
    </div>
  );
}

function SPALMark() {
  return (
    <svg width="44" height="44" viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="22" stroke="#22C55E" strokeWidth="1.5" strokeOpacity="0.3" />
      <circle cx="24" cy="24" r="14" stroke="#22C55E" strokeWidth="1.5" strokeOpacity="0.6" />
      <circle cx="24" cy="24" r="4" fill="#22C55E" />
      <path d="M24 2 A22 22 0 0 1 46 24" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
