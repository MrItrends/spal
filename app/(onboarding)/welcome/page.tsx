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
            className="absolute inset-0 z-50 flex items-center justify-center"
            style={{ background: TEAL }}
          >
            {/* Glow */}
            <div
              className="absolute pointer-events-none"
              style={{
                top: "-180px", left: "-160px", width: "440px", height: "440px",
                borderRadius: "50%", background: GREEN, filter: "blur(110px)", opacity: 0.55,
              }}
            />
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

      {/* Animated preview — crossfades between the two card images */}
      <div className="relative flex-1 flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={ready ? { opacity: 1, scale: 1, y: 0 } : {}}
          transition={{ delay: 0.2, duration: 0.6, ease: [0.34, 1.1, 0.64, 1] }}
        >
          <CardCrossfade play={ready} />
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

/* ── Crossfade between the two get-started card images ───────────────── */
function CardCrossfade({ play }: { play: boolean }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (!play) return;
    const t = setInterval(() => setIdx((i) => (i === 0 ? 1 : 0)), 2600);
    return () => clearInterval(t);
  }, [play]);

  const images = [
    { src: "/get-started-top.svg",    w: 274, h: 290 },
    { src: "/get-started-bottom.svg", w: 275, h: 308 },
  ];

  return (
    <div className="relative" style={{ width: "275px", height: "310px" }}>
      {images.map((img, i) => (
        <motion.div
          key={img.src}
          className="absolute left-1/2 top-1/2"
          initial={false}
          animate={{
            opacity: idx === i ? 1 : 0,
            scale:   idx === i ? 1 : 0.96,
            y:       idx === i ? 0 : 8,
          }}
          transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
          style={{ transform: "translate(-50%, -50%)", zIndex: idx === i ? 2 : 1 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={img.src}
            alt=""
            width={img.w}
            height={img.h}
            style={{ width: "260px", height: "auto", display: "block" }}
          />
        </motion.div>
      ))}
    </div>
  );
}
