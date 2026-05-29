"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export default function PreviewPage() {
  const router = useRouter();

  return (
    <div className="flex-1 flex flex-col px-6 pt-12 pb-8 overflow-y-auto scroll-container">
      <StepIndicator current={4} total={5} />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-8 text-center"
      >
        <span className="text-5xl">🚀</span>
        <h1 className="mt-4 text-2xl font-bold text-spal-navy leading-tight">
          Here&apos;s what SPAL does for you
        </h1>
        <p className="mt-2 text-neutral-500 text-sm">
          Every day. Automatically. In simple words.
        </p>
      </motion.div>

      {/* Sample insight card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-8 bg-spal-green rounded-2xl p-5 text-white"
      >
        <p className="text-green-100 text-xs uppercase tracking-wide font-medium">
          SAMPLE — Thursday, May 22
        </p>
        <div className="mt-3 space-y-2">
          <div className="flex justify-between">
            <span className="text-green-100 text-sm">Sales</span>
            <span className="font-bold">₦24,500</span>
          </div>
          <div className="flex justify-between">
            <span className="text-green-100 text-sm">Expenses</span>
            <span className="font-bold">₦8,000</span>
          </div>
          <div className="border-t border-white/20 pt-2 flex justify-between">
            <span className="text-green-100 text-sm">Profit</span>
            <span className="font-bold text-lg">₦16,500 🎉</span>
          </div>
        </div>
        <div className="mt-4 bg-white/15 rounded-xl p-3">
          <p className="text-white/90 text-sm leading-relaxed">
            💡 Your Jollof Rice sales increased this week. Your best-selling day was Friday.
            Try stocking more on Thursdays.
          </p>
        </div>
      </motion.div>

      {/* Features list */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="mt-6 space-y-3"
      >
        {[
          { icon: "🎤", label: "Record by voice — no typing needed" },
          { icon: "📱", label: "Works on any Android phone" },
          { icon: "💬", label: "Get weekly reports on WhatsApp" },
          { icon: "🤖", label: "AI explains everything in simple words" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            <span className="text-xl">{item.icon}</span>
            <span className="text-sm text-neutral-600">{item.label}</span>
          </div>
        ))}
      </motion.div>

      <div className="flex-1" />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-8"
      >
        <Button
          fullWidth
          size="lg"
          onClick={() => router.push("/signup")}
        >
          I want this for my business →
        </Button>
        <p className="text-center text-neutral-400 text-xs mt-3">
          Free to start. No credit card needed.
        </p>
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
