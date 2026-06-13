"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export function SparkAvatar() {
  const router = useRouter();

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.6, duration: 0.4, ease: [0.34, 1.2, 0.64, 1] }}
      data-coachmark="spark"
      onClick={() => router.push("/ask")}
      aria-label="Ask SPAL"
      className="fixed z-40 flex items-center justify-center active:scale-90 transition-transform"
      style={{
        bottom: "calc(72px + env(safe-area-inset-bottom, 0px) + 16px)",
        right: "20px",
        width: "52px",
        height: "52px",
        borderRadius: "50%",
        background: "linear-gradient(135deg, #22C55E 0%, #2563EB 100%)",
        boxShadow: "0 4px 20px rgba(34,197,94,0.40), 0 2px 8px rgba(0,0,0,0.18)",
      }}
    >
      <SparkIcon />
    </motion.button>
  );
}

function SparkIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 2.5L13.8 8.2H19.8L14.9 11.8L16.7 17.5L12 14L7.3 17.5L9.1 11.8L4.2 8.2H10.2L12 2.5Z"
        fill="white"
        fillOpacity="0.95"
        stroke="white"
        strokeWidth="0.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
