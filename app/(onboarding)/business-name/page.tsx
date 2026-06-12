"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useSPALStore } from "@/store";

export default function BusinessNamePage() {
  const router = useRouter();
  const { user, setUser } = useSPALStore();
  const [name, setName]       = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const trimmed = name.trim();
  const isValid = trimmed.length >= 2;

  async function handleSave() {
    if (!isValid) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_name: trimmed }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error ?? "Could not save. Please try again.");
        return;
      }

      if (user) setUser({ ...user, business_name: trimmed });
      window.location.href = "/home";
    } catch {
      setError("Something went wrong. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col px-6 pt-14" style={{ background: "#F8F7F4" }}>

      {/* Top spark icon */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.34, 1.2, 0.64, 1] }}
        className="mb-8"
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: "rgba(34,197,94,0.10)" }}
        >
          <SparkIcon />
        </div>
      </motion.div>

      {/* Heading */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      >
        <h1
          className="text-spal-navy font-bold leading-[1.1]"
          style={{ fontSize: "clamp(28px, 8vw, 34px)", fontFamily: "var(--font-satoshi)", letterSpacing: "-0.025em" }}
        >
          What do you call<br />your business?
        </h1>
        <p className="mt-2.5 text-neutral-400 text-[14px] leading-relaxed" style={{ fontFamily: "var(--font-satoshi)" }}>
          This is how SPAL will greet you. You can change it anytime.
        </p>
      </motion.div>

      {/* Input */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.18 }}
        className="mt-8"
      >
        <label
          className="text-[13px] font-semibold text-spal-navy mb-2 block"
          style={{ fontFamily: "var(--font-satoshi)" }}
          htmlFor="biz-name"
        >
          Business name
        </label>
        <input
          id="biz-name"
          type="text"
          placeholder="e.g. Mama Tola's Kitchen"
          value={name}
          onChange={(e) => { setName(e.target.value); setError(""); }}
          onKeyDown={(e) => e.key === "Enter" && isValid && handleSave()}
          className="w-full h-[52px] rounded-xl px-4 text-[15px] text-spal-navy outline-none transition-all duration-150"
          style={{
            fontFamily: "var(--font-satoshi)",
            background: "#FAFAFA",
            border: `1.5px solid ${name.length > 0 ? "#22C55E" : "#E4E4E7"}`,
          }}
          autoCapitalize="words"
          autoFocus
        />

        {error && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 text-sm text-red-500 font-medium" style={{ fontFamily: "var(--font-satoshi)" }}>
            {error}
          </motion.p>
        )}
      </motion.div>

      <div className="flex-1" />

      {/* Bottom CTA */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28 }}
        className="pb-10"
        style={{ paddingBottom: "max(2.5rem, env(safe-area-inset-bottom, 2.5rem))" }}
      >
        <button
          onClick={handleSave}
          disabled={!isValid || loading}
          className="w-full h-[52px] rounded-full font-bold text-[15px] transition-all duration-200"
          style={{
            fontFamily: "var(--font-satoshi)",
            background: isValid && !loading ? "#22C55E" : "#E4E4E7",
            color: isValid && !loading ? "#fff" : "#A1A1AA",
          }}
        >
          {loading ? "Saving…" : "Let's go"}
        </button>
        <button
          onClick={() => { window.location.href = "/home"; }}
          className="w-full mt-3 text-center text-[13px] text-neutral-400 py-1"
          style={{ fontFamily: "var(--font-satoshi)" }}
        >
          Skip for now
        </button>
      </motion.div>
    </div>
  );
}

function SparkIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
    </svg>
  );
}
