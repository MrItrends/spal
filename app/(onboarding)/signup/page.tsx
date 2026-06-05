"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { useSPALStore } from "@/store";

type Method = "phone" | "email";

const COUNTRY_CODES = [
  { code: "+234", flag: "🇳🇬", country: "Nigeria" },
  { code: "+233", flag: "🇬🇭", country: "Ghana" },
  { code: "+254", flag: "🇰🇪", country: "Kenya" },
  { code: "+27",  flag: "🇿🇦", country: "South Africa" },
];

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isReset = searchParams.get("mode") === "reset";
  const { setOnboardingData } = useSPALStore();

  const [method, setMethod]           = useState<Method>("phone");
  const [countryCode, setCountryCode] = useState("+234");
  const [phone, setPhone]             = useState("");
  const [email, setEmail]             = useState("");
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");

  const fullPhone = `${countryCode}${phone.replace(/^0/, "")}`;

  const isValid =
    method === "phone"
      ? phone.replace(/\D/g, "").length >= 10
      : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  async function handleSendCode() {
    if (!isValid) return;
    setLoading(true);
    setError("");

    const body =
      method === "phone"
        ? { phone: fullPhone }
        : { email: email.trim().toLowerCase() };

    try {
      const res  = await fetch("/api/auth/send-otp", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error ?? "Failed to send code. Please try again.");
        return;
      }

      if (method === "phone") {
        setOnboardingData({ phoneNumber: fullPhone, email: undefined, mode: isReset ? "reset" : "signup" });
      } else {
        setOnboardingData({ email: email.trim().toLowerCase(), phoneNumber: undefined, mode: isReset ? "reset" : "signup" });
      }

      router.push("/verify");
    } catch {
      setError("Something went wrong. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col px-6 pt-12 pb-8">
      <StepIndicator current={1} total={4} />

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
        <h1 className="text-2xl font-bold text-spal-navy">
          {isReset ? "Reset your password" : "Save your progress"}
        </h1>
        <p className="mt-2 text-neutral-500 text-sm">
          {isReset
            ? `Enter the ${method === "phone" ? "phone number" : "email"} linked to your account. We'll send a code to verify it's you.`
            : `Enter your ${method === "phone" ? "phone number" : "email address"}. No password needed.`}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="mt-8 flex flex-col gap-5"
      >
        {/* Method toggle */}
        <div className="flex bg-neutral-100 rounded-full p-1 gap-0.5">
          {(["phone", "email"] as Method[]).map((m) => (
            <button
              key={m}
              onClick={() => { setMethod(m); setError(""); }}
              className={`flex-1 h-9 rounded-full text-sm font-semibold transition-all duration-200 font-[family-name:var(--font-satoshi)] ${
                method === m
                  ? "bg-white text-spal-navy shadow-sm"
                  : "text-neutral-500"
              }`}
            >
              {m === "phone" ? "Phone" : "Email"}
            </button>
          ))}
        </div>

        {/* Input */}
        <AnimatePresence mode="wait">
          {method === "phone" ? (
            <motion.div
              key="phone"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.15 }}
            >
              <label className="text-sm font-semibold text-spal-navy font-[family-name:var(--font-satoshi)] block mb-1.5">
                Phone number
              </label>
              <div className="flex rounded-2xl border-2 border-neutral-100 bg-white overflow-hidden focus-within:border-spal-blue transition-colors">
                {/* Country code picker — fixed narrow width */}
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="h-14 pl-3 pr-1 text-sm font-semibold text-spal-navy bg-transparent outline-none border-r border-neutral-100 flex-shrink-0"
                  style={{ width: "90px" }}
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code}
                    </option>
                  ))}
                </select>

                {/* Phone number field — takes all remaining space */}
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="0812 345 6789"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^\d\s-]/g, ""))}
                  className="flex-1 h-14 px-3 text-base font-semibold text-spal-navy bg-transparent outline-none placeholder:text-neutral-300 placeholder:font-normal min-w-0"
                />
              </div>
              <p className="text-xs text-neutral-400 mt-2">
                We&apos;ll send a 6-digit code to <strong>{fullPhone || "your number"}</strong>
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="email"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.15 }}
            >
              <label className="text-sm font-semibold text-spal-navy font-[family-name:var(--font-satoshi)] block mb-1.5">
                Email address
              </label>
              <input
                type="email"
                inputMode="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="spal-input spal-input-email"
                autoCapitalize="none"
                autoCorrect="off"
              />
              <p className="text-xs text-neutral-400 mt-2">
                We&apos;ll email a 6-digit code — check your inbox (and spam folder).
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-red-500 font-medium -mt-2">
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
        <Button fullWidth size="lg" loading={loading} disabled={!isValid} onClick={handleSendCode}>
          Send code
        </Button>
        <p className="text-center text-neutral-400 text-xs mt-3">
          Your {method === "phone" ? "phone number" : "email"} is only used to sign you in. We never share it.
        </p>
      </motion.div>
    </div>
  );
}

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex gap-2">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className="h-1 flex-1 rounded-full transition-all duration-300"
          style={{ background: i <= current ? "#22C55E" : "#EAE9E7" }}
        />
      ))}
    </div>
  );
}

