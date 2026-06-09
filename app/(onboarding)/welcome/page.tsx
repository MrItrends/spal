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
              backgroundImage: "url(/splash-background.png)",
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
                src="/spal-wordmark.png"
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
    <div className="absolute inset-0 flex flex-col">

      {/* Background glow — top left */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "-180px", left: "-160px", width: "440px", height: "440px",
          borderRadius: "50%", background: GREEN, filter: "blur(110px)", opacity: 0.45,
        }}
      />

      {/* Logo top center */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={ready ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="relative pt-16 flex justify-center"
      >
        <Image
          src="/spal-wordmark.png"
          alt="SPAL"
          width={90}
          height={32}
          style={{ width: "84px", height: "auto" }}
        />
      </motion.div>

      {/* Fanned card stack — matches the Get Started design */}
      <div className="relative flex-1 flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={ready ? { opacity: 1, scale: 1, y: 0 } : {}}
          transition={{ delay: 0.2, duration: 0.6, ease: [0.34, 1.1, 0.64, 1] }}
        >
          <CardStack play={ready} />
        </motion.div>
      </div>

      {/* Headline + CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={ready ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.35, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="relative px-6 pb-10"
        style={{ paddingBottom: "max(2.5rem, env(safe-area-inset-bottom, 2.5rem))" }}
      >
        <h1
          className="text-white font-black leading-[1.08] mb-3"
          style={{ fontSize: "clamp(30px, 8vw, 38px)", fontFamily: "var(--font-satoshi)", letterSpacing: "-0.03em" }}
        >
          Your business.
          <br />
          <span style={{ color: GREEN }}>Understood.</span>
        </h1>
        <p
          className="text-white/55 text-[15px] leading-relaxed mb-7"
          style={{ fontFamily: "var(--font-satoshi)", maxWidth: "300px" }}
        >
          Track sales, know your real profit, and grow — no accounting needed.
        </p>

        {/* Primary — Get started */}
        <button
          onClick={() => router.push("/business-type")}
          className="w-full h-14 rounded-full font-bold text-[15px] flex items-center justify-center gap-2 mb-3"
          style={{ fontFamily: "var(--font-satoshi)", background: "#ffffff", color: TEAL }}
        >
          Get started
          <ArrowRight size={18} strokeWidth={2.5} />
        </button>

        {/* Secondary — Sign in */}
        <button
          onClick={() => router.push("/login")}
          className="w-full h-14 rounded-full font-semibold text-[15px] flex items-center justify-center gap-2"
          style={{
            fontFamily: "var(--font-satoshi)",
            background: "rgba(255,255,255,0.08)",
            color: "#ffffff",
            border: "1px solid rgba(255,255,255,0.15)",
          }}
        >
          <LogIn size={17} strokeWidth={2} />
          I already have an account
        </button>
      </motion.div>

    </div>
  );
}

/* ── Fanned card stack — two cards tilted at opposite angles, overlapping ─ */
function CardStack({ play }: { play: boolean }) {
  // Card width relative to screen; the pair stays centered in the container.
  const cardW = "min(56vw, 220px)";

  return (
    <div
      className="relative mx-auto"
      style={{ width: "min(86vw, 330px)", height: "min(82vw, 320px)" }}
    >
      {/* Back card — tilted +4°, upper-right (matches design card 0) */}
      <motion.div
        className="absolute top-1/2 left-1/2"
        initial={{ opacity: 0, rotate: 4, x: "-38%", y: "-58%" }}
        animate={play ? {
          opacity: 1,
          rotate: [4, 5.5, 4],
          x: "-38%",
          y: ["-58%", "-55%", "-58%"],
        } : {}}
        transition={{
          opacity: { duration: 0.5, delay: 0.25 },
          rotate:  { duration: 6, repeat: Infinity, ease: "easeInOut" },
          y:       { duration: 6, repeat: Infinity, ease: "easeInOut" },
        }}
        style={{ width: cardW, zIndex: 1, transformOrigin: "center" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/get-started-top.svg"
          alt=""
          className="w-full h-auto block"
          style={{ filter: "drop-shadow(0 16px 40px rgba(0,0,0,0.35))" }}
        />
      </motion.div>

      {/* Front card — tilted −4°, lower-left (matches design card 1) */}
      <motion.div
        className="absolute top-1/2 left-1/2"
        initial={{ opacity: 0, rotate: -4, x: "-62%", y: "-42%" }}
        animate={play ? {
          opacity: 1,
          rotate: [-4, -5.5, -4],
          x: "-62%",
          y: ["-42%", "-45%", "-42%"],
        } : {}}
        transition={{
          opacity: { duration: 0.5, delay: 0.35 },
          rotate:  { duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.4 },
          y:       { duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.4 },
        }}
        style={{ width: cardW, zIndex: 2, transformOrigin: "center" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/get-started-bottom.svg"
          alt=""
          className="w-full h-auto block"
          style={{ filter: "drop-shadow(0 16px 40px rgba(0,0,0,0.4))" }}
        />
      </motion.div>
    </div>
  );
}
