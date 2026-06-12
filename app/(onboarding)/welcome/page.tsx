"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowRight, LogIn } from "lucide-react";

const TEAL   = "#123232";
const GREEN  = "#37CB6D";

export default function WelcomePage() {
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(true);

  // Splash auto-dismisses after a short beat
  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 1900);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex-1 relative overflow-hidden" style={{ background: TEAL }}>

      {/* ── Splash overlay ───────────────────────────────────────────── */}
      <AnimatePresence>
        {showSplash && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="absolute inset-0 z-50 flex items-center justify-center overflow-hidden"
            style={{
              backgroundImage: "url(/splash-background.webp)",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: [0.34, 1.2, 0.64, 1] }}
              className="relative"
            >
              <Image
                src="/spal-wordmark.webp"
                alt="SPAL"
                width={210}
                height={75}
                priority
                style={{ width: "200px", height: "auto" }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Get Started content ──────────────────────────────────────── */}
      <GetStartedContent
        router={router}
        // Slightly delayed entrance so it reveals as splash fades
        ready={!showSplash}
      />
    </div>
  );
}

function GetStartedContent({
  router,
  ready,
}: {
  router: ReturnType<typeof useRouter>;
  ready: boolean;
}) {
  return (
    <div
      className="absolute inset-0 flex flex-col"
      style={{
        backgroundImage: "url(/splash-background.webp)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* SPAL wordmark — top center */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={ready ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="relative pt-14 flex justify-center"
      >
        <Image
          src="/spal-wordmark.webp"
          alt="SPAL"
          width={120}
          height={42}
          priority
          style={{ width: "104px", height: "auto" }}
        />
      </motion.div>

      {/* Fanned UI mockup cards */}
      <div className="relative flex-1 flex items-center justify-center px-3">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={ready ? { opacity: 1, scale: 1, y: 0 } : {}}
          transition={{ delay: 0.18, duration: 0.55, ease: [0.34, 1.1, 0.64, 1] }}
          className="relative w-full"
          style={{ maxWidth: "360px", aspectRatio: "10 / 9" }}
        >
          {/* Back card — Add Sale (empty), top-left, lifted up */}
          <motion.div
            initial={{ opacity: 0, x: -16, y: 8 }}
            animate={ready ? { opacity: 1, x: 0, y: 0 } : {}}
            transition={{ delay: 0.28, duration: 0.55, ease: [0.34, 1.1, 0.64, 1] }}
            className="absolute"
            style={{
              top: "0%",
              left: "0%",
              width: "62%",
              filter: "drop-shadow(0 14px 36px rgba(0,0,0,0.30))",
            }}
          >
            <Image
              src="/addsales_getstartedscreen.webp"
              alt="Add Sale preview"
              width={500}
              height={550}
              priority
              style={{ width: "100%", height: "auto", display: "block" }}
            />
          </motion.div>

          {/* Front card — Add Expense (filled), bottom-right, on top */}
          <motion.div
            initial={{ opacity: 0, x: 16, y: 8 }}
            animate={ready ? { opacity: 1, x: 0, y: 0 } : {}}
            transition={{ delay: 0.38, duration: 0.55, ease: [0.34, 1.1, 0.64, 1] }}
            className="absolute"
            style={{
              bottom: "0%",
              right: "0%",
              width: "62%",
              filter: "drop-shadow(0 18px 40px rgba(0,0,0,0.34))",
            }}
          >
            <Image
              src="/addexpense_getstartedscreen.webp"
              alt="Add Expense preview"
              width={500}
              height={550}
              priority
              style={{ width: "100%", height: "auto", display: "block" }}
            />
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom CTA — single green Get Started button */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={ready ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.5, duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
        className="relative px-6 pb-10"
        style={{ paddingBottom: "max(2.5rem, env(safe-area-inset-bottom, 2.5rem))" }}
      >
        <button
          onClick={() => router.push("/business-type")}
          className="w-full h-14 rounded-full font-bold text-[15px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          style={{
            fontFamily: "var(--font-satoshi)",
            background: "#22C55E",
            color: "#ffffff",
            boxShadow: "0 6px 20px rgba(34,197,94,0.35)",
          }}
        >
          Get Started
          <ArrowRight size={18} strokeWidth={2.5} />
        </button>

        {/* Subtle sign-in link for returning users */}
        <button
          onClick={() => router.push("/login")}
          className="w-full mt-4 text-center text-[13px] active:opacity-60 transition-opacity"
          style={{ fontFamily: "var(--font-satoshi)", color: "rgba(255,255,255,0.55)" }}
        >
          Already have an account?{" "}
          <span style={{ color: "#fff", fontWeight: 600 }}>Sign in</span>
        </button>
      </motion.div>
    </div>
  );
}

