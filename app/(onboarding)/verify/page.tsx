"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { useSPALStore } from "@/store";

export default function VerifyPage() {
  const router = useRouter();
  const { onboardingData, setUser } = useSPALStore();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(30);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Determine which method was used on the signup page
  const isEmail  = !!onboardingData.email;
  const contact  = onboardingData.email ?? onboardingData.phoneNumber ?? "your contact";

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const timer = setTimeout(() => setResendTimer((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendTimer]);

  function handleOtpChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
    if (newOtp.every((d) => d !== "") && value) handleVerify(newOtp.join(""));
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  async function handleVerify(code: string = otp.join("")) {
    if (code.length < 6) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(isEmail
            ? { email: onboardingData.email }
            : { phone: onboardingData.phoneNumber }),
          token: code,
          onboardingData: {
            businessType: onboardingData.businessType,
            goals: onboardingData.goals,
          },
        }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error ?? "Wrong code. Please try again.");
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
        return;
      }

      setUser(data.data.user);
      // New users create a password; returning users go straight to home
      router.push(data.data.isNewUser ? "/create-password" : "/home");
    } catch {
      setError("Something went wrong. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResendTimer(30);
    setError("");
    const body = isEmail
      ? { email: onboardingData.email }
      : { phone: onboardingData.phoneNumber };
    await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  return (
    <div className="flex-1 flex flex-col px-6 pt-12 pb-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
        <span className="text-4xl">{isEmail ? "📧" : "📱"}</span>
        <h1 className="mt-4 text-2xl font-bold text-spal-navy">
          {isEmail ? "Check your email" : "Check your phone"}
        </h1>
        <p className="mt-2 text-neutral-500 text-sm leading-relaxed">
          We sent a 6-digit code to{" "}
          <strong className="text-spal-navy">{contact}</strong>
          {isEmail && (
            <span className="block mt-1 text-neutral-400 text-xs">
              Don&apos;t see it? Check your spam folder too.
            </span>
          )}
        </p>
      </motion.div>

      {/* OTP inputs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mt-10 flex justify-center gap-2"
      >
        {otp.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleOtpChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className={`
              w-12 h-14 text-center text-xl font-bold rounded-2xl border-2
              text-spal-navy bg-white outline-none transition-all duration-200
              ${digit ? "border-spal-green bg-spal-green-50" : "border-neutral-200"}
              focus:border-spal-blue
            `}
          />
        ))}
      </motion.div>

      {error && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-center text-sm text-red-500 font-medium">
          {error}
        </motion.p>
      )}

      <div className="mt-6 text-center">
        {resendTimer > 0 ? (
          <p className="text-sm text-neutral-400">
            Resend in <strong className="text-spal-navy">{resendTimer}s</strong>
          </p>
        ) : (
          <button onClick={handleResend} className="text-sm text-spal-blue font-semibold underline">
            Resend code
          </button>
        )}
      </div>

      <div className="flex-1" />

      <Button fullWidth size="lg" loading={loading} disabled={otp.some((d) => !d)} onClick={() => handleVerify()}>
        Verify &amp; continue
      </Button>
      <button className="mt-4 w-full text-center text-sm text-neutral-400 py-2" onClick={() => router.back()}>
        ← Change {isEmail ? "email" : "phone number"}
      </button>
    </div>
  );
}
