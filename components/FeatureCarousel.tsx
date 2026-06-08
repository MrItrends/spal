"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ShoppingCart, TrendingUp, BarChart2, RefreshCw, Package, Target } from "lucide-react";

const slides = [
  {
    id: "spending",
    icon: ShoppingCart,
    color: "#22C55E",
    bg: "#EFFBF4",
    label: "Spending",
    title: "Know exactly where your money goes",
    body: "Log every expense in seconds — cash, transfer, or card. SPAL sorts it into categories so you always know what you're spending on.",
    tags: ["Food & ingredients", "Transport", "Stock"],
    tagColor: "#F0FDF4",
    tagText: "#208646",
    screenshot: "/screenshots/spending.png",
  },
  {
    id: "profiting",
    icon: TrendingUp,
    color: "#F35902",
    bg: "#FFF5EF",
    label: "Profiting",
    title: "See every naira you earn",
    body: "Record sales and income the moment they happen. SPAL shows you your profit clearly — no accounting degree needed.",
    tags: ["Sales", "Wholesale", "Services"],
    tagColor: "#FFF7ED",
    tagText: "#C2410C",
    screenshot: "/screenshots/profiting.png",
  },
  {
    id: "analysing",
    icon: BarChart2,
    color: "#2F63F5",
    bg: "#EFF6FF",
    label: "Analysing",
    title: "Understand your business at a glance",
    body: "Simple charts. Clear numbers. SPAL turns your transactions into a picture of how your business is really doing.",
    tags: ["Weekly summary", "Top expenses", "Profit trends"],
    tagColor: "#EFF6FF",
    tagText: "#1D4ED8",
    screenshot: "/screenshots/analysing.png",
  },
  {
    id: "looping",
    icon: RefreshCw,
    color: "#8B5CF6",
    bg: "#F7F3FE",
    label: "Looping",
    title: "Keep improving, keep growing",
    body: "Your AI companion spots patterns, flags unusual spending, and nudges you with tips that actually make sense for your business.",
    tags: ["AI tips", "Spending alerts", "Weekly recap"],
    tagColor: "#F5F3FF",
    tagText: "#6D28D9",
    screenshot: "/screenshots/looping.png",
  },
  {
    id: "inventory",
    icon: Package,
    color: "#67738F",
    bg: "#F8F8F9",
    label: "Inventory",
    title: "Always know what you have in stock",
    body: "Track your goods easily. SPAL tells you when something is running low so you never run out at the wrong time.",
    tags: ["Stock levels", "Low stock alerts", "Restock reminders"],
    tagColor: "#F4F4F5",
    tagText: "#52525B",
    screenshot: "/screenshots/inventory.png",
  },
  {
    id: "goals",
    icon: Target,
    color: "#2F63F5",
    bg: "#F0F4FE",
    label: "Goals",
    title: "Set targets, hit them",
    body: "Tell SPAL what you want to achieve — a savings target, a revenue goal — and it tracks your progress every step of the way.",
    tags: ["Savings target", "Revenue goal", "Monthly plan"],
    tagColor: "#EFF6FF",
    tagText: "#1D4ED8",
    screenshot: "/screenshots/goals.png",
  },
];

export default function FeatureCarousel() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  function go(idx: number) {
    setDirection(idx > current ? 1 : -1);
    setCurrent(idx);
  }

  function prev() {
    go(current === 0 ? slides.length - 1 : current - 1);
  }

  function next() {
    go(current === slides.length - 1 ? 0 : current + 1);
  }

  const slide = slides[current];
  const Icon = slide.icon;

  return (
    <section className="py-20 md:py-28 px-4 md:px-10 bg-white overflow-hidden">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12 md:mb-16">
          <p className="text-[#22C55E] text-sm font-semibold uppercase tracking-widest mb-3">Features</p>
          <h2 className="text-3xl md:text-5xl font-bold text-[#0F172A] leading-tight max-w-xl" style={{ fontFamily: "Satoshi, sans-serif" }}>
            Run your business with confidence
          </h2>
        </div>

        {/* Slide */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Left: content */}
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={slide.id}
              custom={direction}
              initial={{ opacity: 0, x: direction * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -40 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Icon badge */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-6"
                style={{ background: slide.bg }}
              >
                <Icon size={22} color={slide.color} />
              </div>

              {/* Label */}
              <p className="text-sm font-semibold mb-2" style={{ color: slide.color }}>
                {slide.label}
              </p>

              <h3 className="text-2xl md:text-3xl font-bold text-[#0F172A] mb-4 leading-snug" style={{ fontFamily: "Satoshi, sans-serif" }}>
                {slide.title}
              </h3>

              <p className="text-[#67738F] text-base leading-relaxed mb-6">
                {slide.body}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-8">
                {slide.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-full text-xs font-medium"
                    style={{ background: slide.tagColor, color: slide.tagText }}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Navigation */}
              <div className="flex items-center gap-4">
                <button
                  onClick={prev}
                  className="w-11 h-11 rounded-full border border-[#E4E4E7] flex items-center justify-center hover:border-[#0F172A] hover:bg-[#F8F7F4] transition-all"
                  aria-label="Previous feature"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={next}
                  className="w-11 h-11 rounded-full bg-[#0F172A] text-white flex items-center justify-center hover:bg-[#22C55E] transition-colors"
                  aria-label="Next feature"
                >
                  <ChevronRight size={18} />
                </button>

                {/* Dots */}
                <div className="flex items-center gap-2 ml-2">
                  {slides.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => go(i)}
                      className="transition-all duration-300"
                      aria-label={`Go to slide ${i + 1}`}
                    >
                      <span
                        className="block rounded-full transition-all duration-300"
                        style={{
                          width: i === current ? "20px" : "6px",
                          height: "6px",
                          background: i === current ? "#0F172A" : "#E4E4E7",
                        }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Right: screenshot placeholder */}
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={slide.id + "-img"}
              custom={direction}
              initial={{ opacity: 0, x: direction * 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -60 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-2xl overflow-hidden aspect-[515/589] w-full max-w-lg mx-auto lg:mx-0"
              style={{ background: slide.bg }}
            >
              <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-8">
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center"
                  style={{ background: slide.color + "22" }}
                >
                  <Icon size={36} color={slide.color} />
                </div>
                <p className="text-sm font-medium" style={{ color: slide.color }}>
                  App screenshot coming soon
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
