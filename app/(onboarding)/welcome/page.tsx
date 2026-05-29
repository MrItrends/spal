"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export default function WelcomePage() {
  const router = useRouter();

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden">

      {/* Rich multi-layer gradient — deep green to electric blue */}
      <div className="absolute inset-0" style={{
        background: "linear-gradient(155deg, #0f7a3a 0%, #1DB954 35%, #1a5fcf 75%, #1e3a8a 100%)"
      }} />

      {/* Luminous overlay — brightens the center */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(255,255,255,0.12)_0%,transparent_60%)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/0 to-black/30" />

      {/* Atmospheric blobs */}
      <div className="absolute top-12 right-6 w-48 h-48 rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(circle, #7cffb2, transparent)" }} />
      <div className="absolute top-40 -left-8 w-36 h-36 rounded-full opacity-15 blur-2xl"
        style={{ background: "radial-gradient(circle, #93c5fd, transparent)" }} />
      <div className="absolute bottom-40 right-4 w-32 h-32 rounded-full opacity-20 blur-2xl"
        style={{ background: "radial-gradient(circle, #fbbf24, transparent)" }} />
      <div className="absolute bottom-20 -left-4 w-24 h-24 rounded-full opacity-10 blur-xl"
        style={{ background: "radial-gradient(circle, #a78bfa, transparent)" }} />

      {/* Content */}
      <div className="relative flex-1 flex flex-col items-center justify-between px-6 pt-16 pb-12">

        {/* Logo + Hero */}
        <div className="flex flex-col items-center gap-7">
          <motion.div
            initial={{ opacity: 0, scale: 0.75, y: 10 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            transition={{ duration: 0.55, ease: [0.34, 1.56, 0.64, 1] }}
            className="w-[72px] h-[72px] bg-white rounded-[22px] flex items-center justify-center"
            style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.12)" }}
          >
            <SPALLogo />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22, duration: 0.5 }}
            className="text-center"
          >
            <h1 className="text-[2.1rem] font-bold text-white leading-[1.15] tracking-[-0.02em]">
              Your business.
              <br />
              <span className="text-white/80">Understood.</span>
            </h1>
            <p className="mt-3 text-white/65 text-sm leading-relaxed max-w-[260px] mx-auto">
              Track sales, know your profit, and grow your business — no accounting skills needed.
            </p>
          </motion.div>
        </div>

        {/* Preview card */}
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.96 }}
          animate={{ opacity: 1, y: 0,  scale: 1    }}
          transition={{ delay: 0.38, duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-xs"
        >
          <PreviewCard />
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0  }}
          transition={{ delay: 0.55, duration: 0.4 }}
          className="w-full flex flex-col gap-3"
        >
          <Button
            size="lg"
            fullWidth
            className="!bg-white !text-spal-green !shadow-[0_8px_24px_rgba(0,0,0,0.2)] font-bold"
            onClick={() => router.push("/business-type")}
          >
            Let&apos;s get started →
          </Button>
          <button
            className="text-white/60 text-xs text-center py-1"
            onClick={() => router.push("/login")}
          >
            Already have an account?{" "}
            <span className="text-white/90 font-semibold underline underline-offset-2">Sign in</span>
          </button>
        </motion.div>

      </div>
    </div>
  );
}

function PreviewCard() {
  return (
    <div className="spal-card-glass p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-white/50 text-[10px] font-bold tracking-widest uppercase">Today&apos;s Summary</p>
        <span className="text-[10px] text-white/40">Wed, 28 May</span>
      </div>
      <div className="space-y-2.5">
        {[
          { label: "Sales",    amount: "₦18,500", color: "#1DB954" },
          { label: "Expenses", amount: "₦6,000",  color: "#F97316" },
        ].map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: item.color }} />
              <span className="text-white/75 text-sm">{item.label}</span>
            </div>
            <span className="text-white font-bold text-sm">{item.amount}</span>
          </div>
        ))}
        <div className="border-t border-white/10 pt-2.5 flex items-center justify-between">
          <span className="text-white font-semibold text-sm">Profit</span>
          <span className="text-white font-bold text-base">₦12,500</span>
        </div>
      </div>
      <div className="mt-3 px-3 py-2 rounded-xl" style={{ background: "rgba(29,185,84,0.18)" }}>
        <p className="text-white/80 text-xs leading-relaxed">
          🔥 <span className="font-semibold">Nice work!</span> Sales are up from yesterday.
        </p>
      </div>
    </div>
  );
}

function SPALLogo() {
  return (
    <svg viewBox="0 0 60 40" className="w-14 h-9" fill="none">
      <text x="0" y="32" fontSize="36" fontWeight="800" fontFamily="system-ui, sans-serif">
        <tspan fill="#1DB954">S</tspan>
        <tspan fill="#2563EB">P</tspan>
        <tspan fill="#F97316">A</tspan>
        <tspan fill="#8B5CF6">L</tspan>
      </text>
    </svg>
  );
}
