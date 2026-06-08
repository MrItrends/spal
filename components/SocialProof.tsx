"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    quote: "Before SPAL I never really knew if I was making money. Now I check my numbers every morning.",
    name: "Amaka O.",
    role: "Fashion vendor, Lagos",
    avatar: "A",
    avatarBg: "#EFFBF4",
    avatarColor: "#22C55E",
  },
  {
    quote: "It talks to me like a friend, not like a bank. I finally understand my business.",
    name: "Emeka T.",
    role: "Food seller, Abuja",
    avatar: "E",
    avatarBg: "#FFF5EF",
    avatarColor: "#F35902",
  },
  {
    quote: "I used to lose track of stock all the time. SPAL fixed that in one week.",
    name: "Chidinma B.",
    role: "Provisions store, Port Harcourt",
    avatar: "C",
    avatarBg: "#F7F3FE",
    avatarColor: "#8B5CF6",
  },
];

export default function SocialProof() {
  return (
    <section className="py-20 md:py-28 px-4 md:px-10 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="bg-[#F8F7F4] rounded-3xl p-8 md:p-12">
          <div className="mb-10 md:mb-12">
            <p className="text-[#2F63F5] text-sm font-semibold uppercase tracking-widest mb-3">Early feedback</p>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0F172A] leading-tight" style={{ fontFamily: "Satoshi, sans-serif" }}>
              Entrepreneurs love it already
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: i * 0.1 }}
                className="bg-white rounded-2xl p-6 flex flex-col gap-4"
              >
                {/* Stars */}
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} size={14} fill="#22C55E" color="#22C55E" />
                  ))}
                </div>

                <p className="text-[#0F172A] text-sm leading-relaxed flex-1">&ldquo;{t.quote}&rdquo;</p>

                <div className="flex items-center gap-3 pt-2 border-t border-[#F4F4F5]">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                    style={{ background: t.avatarBg, color: t.avatarColor }}
                  >
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#0F172A]">{t.name}</p>
                    <p className="text-xs text-[#A1A1AA]">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
