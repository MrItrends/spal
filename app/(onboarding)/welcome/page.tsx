"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

export default function WelcomePage() {
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 1900);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex-1 relative overflow-hidden" style={{ background: "#0F172A" }}>

      {/* ── Splash overlay ── */}
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

      {/* ── Get Started content ── */}
      <GetStartedContent router={router} ready={!showSplash} />
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
      {/* SPAL wordmark */}
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
          style={{ width: "110px", height: "auto" }}
        />
      </motion.div>

      {/* Cards + floating avatars */}
      <div className="relative flex-1 flex items-center justify-center px-4" style={{ minHeight: 0 }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 16 }}
          animate={ready ? { opacity: 1, scale: 1, y: 0 } : {}}
          transition={{ delay: 0.18, duration: 0.55, ease: [0.34, 1.1, 0.64, 1] }}
          className="relative w-full"
          style={{ maxWidth: "400px", aspectRatio: "4 / 3.6" }}
        >
          {/* Floating avatar — top left */}
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={ready ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.45, duration: 0.4, ease: [0.34, 1.3, 0.64, 1] }}
            className="absolute z-10 rounded-full overflow-hidden border-2 border-white"
            style={{ width: 52, height: 52, top: "-8px", left: "4%" }}
          >
            <div
              className="w-full h-full flex items-center justify-center text-white font-bold text-[18px]"
              style={{ background: "linear-gradient(135deg, #2563EB, #8B5CF6)" }}
            >
              A
            </div>
          </motion.div>

          {/* Floating avatar — right side */}
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={ready ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.55, duration: 0.4, ease: [0.34, 1.3, 0.64, 1] }}
            className="absolute z-10 rounded-full overflow-hidden border-2 border-white"
            style={{ width: 52, height: 52, top: "36%", right: "0%" }}
          >
            <div
              className="w-full h-full flex items-center justify-center text-white font-bold text-[18px]"
              style={{ background: "linear-gradient(135deg, #22C55E, #2563EB)" }}
            >
              T
            </div>
          </motion.div>

          {/* Back card — Add Sale */}
          <motion.div
            initial={{ opacity: 0, x: -20, y: 10 }}
            animate={ready ? { opacity: 1, x: 0, y: 0 } : {}}
            transition={{ delay: 0.28, duration: 0.55, ease: [0.34, 1.1, 0.64, 1] }}
            className="absolute"
            style={{
              top: "4%",
              left: "2%",
              width: "66%",
              filter: "drop-shadow(0 16px 40px rgba(0,0,0,0.32))",
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

          {/* Front card — Add Expense */}
          <motion.div
            initial={{ opacity: 0, x: 20, y: 10 }}
            animate={ready ? { opacity: 1, x: 0, y: 0 } : {}}
            transition={{ delay: 0.38, duration: 0.55, ease: [0.34, 1.1, 0.64, 1] }}
            className="absolute"
            style={{
              bottom: "0%",
              right: "0%",
              width: "68%",
              filter: "drop-shadow(0 20px 44px rgba(0,0,0,0.36))",
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

      {/* Headline + subtitle + CTA */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={ready ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.42, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="relative px-6"
        style={{ paddingBottom: "max(2.5rem, env(safe-area-inset-bottom, 2.5rem))" }}
      >
        {/* Headline */}
        <h1
          className="text-white font-bold text-center leading-tight mb-2"
          style={{
            fontFamily: "var(--font-satoshi)",
            fontSize: "clamp(24px, 6.5vw, 30px)",
            letterSpacing: "-0.02em",
          }}
        >
          Your Business Finance<br />Made Easy
        </h1>

        {/* Subtitle */}
        <p
          className="text-center mb-7"
          style={{
            fontFamily: "var(--font-satoshi)",
            fontSize: "14px",
            color: "rgba(255,255,255,0.55)",
            lineHeight: "1.55",
          }}
        >
          Track your sales, know your profit and grow.<br />No accounting knowledge needed
        </p>

        {/* CTA button — circle-arrow left | text | animated ›› right */}
        <button
          onClick={() => router.push("/business-type")}
          className="w-full h-[58px] rounded-full flex items-center active:scale-[0.97] transition-transform"
          style={{
            fontFamily: "var(--font-satoshi)",
            background: "#22C55E",
            boxShadow: "0 8px 24px rgba(34,197,94,0.38)",
            paddingLeft: "6px",
            paddingRight: "20px",
          }}
          aria-label="Get Started"
        >
          {/* Left circle with arrow */}
          <div
            className="w-[46px] h-[46px] rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.22)" }}
          >
            <ArrowRight size={20} strokeWidth={2.5} color="#fff" />
          </div>

          {/* Label — centred in remaining space */}
          <span
            className="flex-1 text-center font-bold text-white text-[15px]"
          >
            🚀 Get Started
          </span>

          {/* Animated ›› chevrons */}
          <AnimatedChevrons />
        </button>

        {/* Sign-in link */}
        <button
          onClick={() => router.push("/login")}
          className="w-full mt-4 text-center text-[13px] active:opacity-60 transition-opacity"
          style={{ fontFamily: "var(--font-satoshi)", color: "rgba(255,255,255,0.55)" }}
        >
          Already have an account?{" "}
          <span style={{ color: "#fff", fontWeight: 700 }}>Login</span>
        </button>
      </motion.div>
    </div>
  );
}

function AnimatedChevrons() {
  return (
    <motion.div
      className="flex items-center gap-0.5 flex-shrink-0"
      animate={{ x: [0, 4, 0] }}
      transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
    >
      <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "15px", fontWeight: 700 }}>›</span>
      <span style={{ color: "rgba(255,255,255,0.75)", fontSize: "15px", fontWeight: 700 }}>›</span>
    </motion.div>
  );
}
