"use client";

import { useState, FormEvent } from "react";
import { ArrowRight, CheckCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type State = "idle" | "loading" | "success" | "error";

export default function WaitlistForm({ size = "lg" }: { size?: "lg" | "sm" }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (state === "loading" || state === "success") return;
    setState("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      setState("success");
    } catch (err) {
      setState("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  if (state === "success") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-center gap-3 bg-[#EFFBF4] text-[#208646] rounded-2xl px-6 py-4"
      >
        <CheckCircle size={20} className="shrink-0" />
        <p className="font-medium text-sm">You&apos;re on the list! Check your inbox for a confirmation.</p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className={`flex ${size === "lg" ? "flex-col sm:flex-row" : "flex-col"} gap-3`}>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email address"
          className={`flex-1 bg-white border border-[#E4E4E7] rounded-full px-5 text-[#0F172A] placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#22C55E]/40 focus:border-[#22C55E] transition-all ${size === "lg" ? "h-14 text-base" : "h-12 text-sm"}`}
        />
        <button
          type="submit"
          disabled={state === "loading"}
          className={`flex items-center justify-center gap-2 bg-[#22C55E] text-white font-semibold rounded-full hover:bg-[#16a34a] disabled:opacity-60 transition-colors whitespace-nowrap ${size === "lg" ? "h-14 px-8 text-base" : "h-12 px-6 text-sm"}`}
        >
          {state === "loading" ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <>
              Join the waitlist
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </div>
      <AnimatePresence>
        {state === "error" && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-3 text-sm text-[#F35902] pl-1"
          >
            {errorMsg}
          </motion.p>
        )}
      </AnimatePresence>
    </form>
  );
}
