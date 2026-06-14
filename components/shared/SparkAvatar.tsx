"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";

export function SparkAvatar() {
  const router = useRouter();

  return (
    <motion.button
      data-coachmark="spark"
      onClick={() => router.push("/ask")}
      aria-label="Ask SPAL"
      className="fixed z-40 active:scale-90"
      style={{
        bottom: "calc(72px + env(safe-area-inset-bottom, 0px) + 12px)",
        right: "16px",
        width: "64px",
        height: "64px",
        borderRadius: "50%",
        overflow: "hidden",
        background: "transparent",
        boxShadow:
          "0 0 0 2px rgba(34,197,94,0.25), 0 8px 28px rgba(34,197,94,0.30), 0 4px 12px rgba(0,0,0,0.25)",
        padding: 0,
        border: "none",
        cursor: "pointer",
      }}
      // Entrance
      initial={{ opacity: 0, scale: 0.5, y: 16 }}
      animate={{
        opacity: 1,
        scale: 1,
        y: [0, -6, 0],      // idle float loop
      }}
      transition={{
        opacity:  { delay: 0.5, duration: 0.4, ease: [0.34, 1.2, 0.64, 1] },
        scale:    { delay: 0.5, duration: 0.4, ease: [0.34, 1.2, 0.64, 1] },
        y: {
          delay:    1,
          duration: 3,
          repeat:   Infinity,
          ease:     "easeInOut",
          repeatType: "mirror",
        },
      }}
      whileTap={{ scale: 0.88 }}
    >
      <Image
        src="/spal AI.png"
        alt="Ask SPAL"
        fill
        sizes="64px"
        style={{ objectFit: "cover", objectPosition: "center" }}
        priority
      />
    </motion.button>
  );
}
