"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Bell } from "lucide-react";

export default function NotificationsPage() {
  const router = useRouter();

  return (
    <div className="px-5 pt-6 pb-6 space-y-5" style={{ background: "#F8F7F4", minHeight: "100%" }}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-transform"
          style={{ background: "#EAE9E7" }}
          aria-label="Go back"
        >
          <ArrowLeft size={18} strokeWidth={2} color="#0F172A" />
        </button>
        <h1 className="text-[22px] font-bold text-spal-navy" style={{ fontFamily: "var(--font-satoshi)" }}>
          Notifications
        </h1>
      </div>

      {/* Empty state */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-16"
      >
        <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-4">
          <Bell size={28} strokeWidth={2} className="text-neutral-300" />
        </div>
        <p className="text-spal-navy font-bold text-base" style={{ fontFamily: "var(--font-satoshi)" }}>
          You&apos;re all caught up
        </p>
        <p className="text-neutral-400 text-sm mt-1 max-w-xs mx-auto leading-relaxed">
          Streak reminders, coach session updates, and payment receipts will appear here.
        </p>
      </motion.div>
    </div>
  );
}
