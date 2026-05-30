"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { useSPALStore } from "@/store";
import { Lock } from "lucide-react";

export default function CreatePasswordPage() {
  const router = useRouter();
  const { onboardingData } = useSPALStore();
  const isReset = onboardingData.mode === "reset";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const tooShort = password.length > 0 && password.length < 8;
  const mismatch = confirm.length > 0 && password !== confirm;
  const isValid  = password.length >= 8 && password === confirm;

  async function handleCreate() {
    if (!isValid) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/set-password", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ password }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error ?? "Could not set password. Please try again.");
        return;
      }

      router.push("/home");
    } catch {
      setError("Something went wrong. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col px-6 pt-12 pb-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: isReset ? "#FFF7ED" : "#F0FDF4" }}
        >
          <LockIcon color={isReset ? "#F97316" : "#22C55E"} />
        </div>
        <h1 className="text-2xl font-bold text-spal-navy" style={{ fontFamily: "var(--font-satoshi)" }}>
          {isReset ? "Set a new password" : "Create a password"}
        </h1>
        <p className="mt-2 text-neutral-500 text-sm leading-relaxed">
          {isReset
            ? "Choose a new password for your SPAL account."
            : "You'll use this to sign in next time — no code needed."}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="mt-8 flex flex-col gap-4"
      >
        {/* Password */}
        <div>
          <label className="text-sm font-semibold text-spal-navy font-[family-name:var(--font-satoshi)] block mb-1.5">
            Password
          </label>
          <input
            type="password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(""); }}
            className="w-full h-14 px-4 bg-white border border-neutral-200 rounded-2xl text-spal-navy text-base outline-none focus:border-spal-blue placeholder:text-neutral-300"
          />
          {tooShort && (
            <p className="text-xs text-amber-500 mt-1.5">At least 8 characters required</p>
          )}
        </div>

        {/* Confirm */}
        <div>
          <label className="text-sm font-semibold text-spal-navy font-[family-name:var(--font-satoshi)] block mb-1.5">
            Confirm password
          </label>
          <input
            type="password"
            placeholder="Repeat your password"
            value={confirm}
            onChange={(e) => { setConfirm(e.target.value); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            className={`w-full h-14 px-4 bg-white border rounded-2xl text-spal-navy text-base outline-none placeholder:text-neutral-300 transition-colors ${
              mismatch
                ? "border-red-300 focus:border-red-400"
                : "border-neutral-200 focus:border-spal-blue"
            }`}
          />
          {mismatch && (
            <p className="text-xs text-red-500 mt-1.5">Passwords don&apos;t match</p>
          )}
        </div>

        {error && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-red-500 font-medium -mt-1">
            {error}
          </motion.p>
        )}
      </motion.div>

      <div className="flex-1" />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="mt-8"
      >
        <Button fullWidth size="lg" loading={loading} disabled={!isValid} onClick={handleCreate}>
          {isReset ? "Save new password" : "Create password & continue"}
        </Button>
        {!isReset && (
          <button
            className="mt-4 w-full text-center text-sm text-neutral-400 py-2"
            onClick={() => router.push("/home")}
          >
            Skip for now
          </button>
        )}
      </motion.div>
    </div>
  );
}

function LockIcon({ color }: { color: string }) {
  return <Lock size={22} strokeWidth={2} color={color} />;
}

