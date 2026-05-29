"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { PillChip } from "@/components/ui/PillChip";
import { Button } from "@/components/ui/Button";
import { useSPALStore, type BusinessType } from "@/store";

const BUSINESS_TYPES: {
  type: BusinessType;
  label: string;
  emoji: string;
  color: "green" | "orange" | "purple" | "blue" | "gray";
}[] = [
  { type: "food_seller",    label: "Food Seller",    emoji: "🍲", color: "green"  },
  { type: "bar_owner",      label: "Bar Owner",      emoji: "🍺", color: "orange" },
  { type: "fashion_vendor", label: "Fashion Vendor", emoji: "👗", color: "purple" },
  { type: "salon",          label: "Salon Owner",    emoji: "✂️", color: "blue"   },
  { type: "kiosk",          label: "Kiosk Owner",    emoji: "🛒", color: "green"  },
  { type: "market_trader",  label: "Market Trader",  emoji: "🛍", color: "orange" },
  { type: "other",          label: "Something else", emoji: "✨", color: "gray"   },
];

export default function BusinessTypePage() {
  const router = useRouter();
  const { setOnboardingData } = useSPALStore();
  const [selected, setSelected] = useState<BusinessType | null>(null);

  function handleSelect(type: BusinessType) {
    setSelected(type);
    // Auto-advance after short delay
    setTimeout(() => {
      setOnboardingData({ businessType: type });
      router.push("/onboard-goals");
    }, 350);
  }

  return (
    <div className="flex-1 flex flex-col px-6 pt-12 pb-8 overflow-y-auto scroll-container">
      {/* Step indicator */}
      <StepIndicator current={1} total={5} />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-8"
      >
        <h1 className="text-2xl font-bold text-spal-navy leading-tight">
          What kind of business do you run?
        </h1>
        <p className="mt-2 text-neutral-500 text-sm">
          Pick the one that fits best. You can change this later.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="mt-8 flex flex-wrap gap-3"
      >
        {BUSINESS_TYPES.map((item, i) => (
          <motion.div
            key={item.type}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 + 0.1 }}
          >
            <PillChip
              label={item.label}
              icon={item.emoji}
              color={item.color}
              selected={selected === item.type}
              onClick={() => handleSelect(item.type)}
              size="md"
            />
          </motion.div>
        ))}
      </motion.div>

      <div className="flex-1" />

      {selected && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6"
        >
          <Button
            fullWidth
            size="lg"
            onClick={() => {
              setOnboardingData({ businessType: selected });
              router.push("/onboard-goals");
            }}
          >
            Continue →
          </Button>
        </motion.div>
      )}
    </div>
  );
}

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
            i <= current ? "bg-spal-green" : "bg-neutral-200"
          }`}
        />
      ))}
    </div>
  );
}
