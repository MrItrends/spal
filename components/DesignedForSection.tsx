"use client";

import { motion } from "framer-motion";
import { Zap, Shield } from "lucide-react";

const cards = [
  {
    icon: Zap,
    iconBg: "#EFFBF4",
    iconColor: "#22C55E",
    label: "Fast to use",
    title: "Record expenses in under 10 seconds",
    body: "You shouldn't have to stop selling to log a sale. SPAL is built for busy people — a few taps and you're done.",
    imageBg: "#F0FDF4",
  },
  {
    icon: Shield,
    iconBg: "#F7F3FE",
    iconColor: "#8B5CF6",
    label: "Built for you",
    title: "Plain language, no finance jargon",
    body: "No \"liabilities\", no \"reconcile\". SPAL speaks the way you do — because understanding your money shouldn't require a degree.",
    imageBg: "#F5F3FF",
  },
];

export default function DesignedForSection() {
  return (
    <section className="py-20 md:py-28 px-4 md:px-10 bg-[#F8F7F4]">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12 md:mb-16 max-w-2xl">
          <p className="text-[#8B5CF6] text-sm font-semibold uppercase tracking-widest mb-3">Why SPAL</p>
          <h2 className="text-3xl md:text-5xl font-bold text-[#0F172A] leading-tight" style={{ fontFamily: "Satoshi, sans-serif" }}>
            Designed for the way entrepreneurs actually work
          </h2>
        </div>

        {/* Cards */}
        <div className="flex flex-col gap-6">
          {cards.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: i * 0.1 }}
                className="bg-white rounded-3xl overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-2">
                  {/* Text side */}
                  <div className="p-8 md:p-10 flex flex-col justify-center">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                      style={{ background: card.iconBg }}
                    >
                      <Icon size={24} color={card.iconColor} />
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: card.iconColor }}>
                      {card.label}
                    </p>
                    <h3 className="text-xl md:text-2xl font-bold text-[#0F172A] mb-3 leading-snug" style={{ fontFamily: "Satoshi, sans-serif" }}>
                      {card.title}
                    </h3>
                    <p className="text-[#67738F] leading-relaxed">{card.body}</p>
                  </div>

                  {/* Image side */}
                  <div
                    className="min-h-[220px] md:min-h-[260px] flex items-center justify-center"
                    style={{ background: card.imageBg }}
                  >
                    <div className="flex flex-col items-center gap-3 p-8 text-center">
                      <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center"
                        style={{ background: card.iconColor + "22" }}
                      >
                        <Icon size={28} color={card.iconColor} />
                      </div>
                      <p className="text-xs font-medium" style={{ color: card.iconColor }}>
                        Screenshot coming soon
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
