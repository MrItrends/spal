"use client";

import { useRouter } from "next/navigation";
import { Alert01Icon, Idea01Icon, ArrowRight01Icon, ChartIncreaseIcon } from "hugeicons-react";
import type { InsightItem, InsightTone } from "@/components/home/InsightsCarousel";

const TONES: Record<InsightTone, { bg: string; iconBg: string; iconColor: string; Icon: typeof Alert01Icon }> = {
  warning: { bg: "#FEE0E1", iconBg: "#FDCED0", iconColor: "#DC2626", Icon: Alert01Icon },
  info:    { bg: "#EAF0FC", iconBg: "#D7E4FA", iconColor: "#2563EB", Icon: Idea01Icon },
  success: { bg: "#E7F6EC", iconBg: "#CDEDD8", iconColor: "#16A34A", Icon: ChartIncreaseIcon },
};

/**
 * Desktop insights — same data and card styling as the mobile InsightsCarousel,
 * but laid out as a wrapping 2-up grid instead of a swipeable single-card
 * carousel: the extra width fits two cards at once, so there's no need for
 * scroll-snap or dot pagination. See DESKTOP.md.
 */
export function InsightsRow({ items }: { items: InsightItem[] }) {
  const router = useRouter();

  if (items.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-4">
      {items.map((it) => {
        const t = TONES[it.tone];
        return (
          <div key={it.id} className="rounded-2xl px-4 py-4" style={{ background: t.bg }}>
            <div className="flex items-start gap-3">
              <span className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: t.iconBg }}>
                <t.Icon size={18} color={t.iconColor} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[15.5px] font-black text-spal-navy leading-snug">{it.title}</p>
                <p className="text-[13px] text-neutral-600 mt-1 leading-relaxed">{it.body}</p>
                {it.ctaLabel && (
                  <button
                    onClick={() => it.ctaHref && router.push(it.ctaHref)}
                    className="mt-3 inline-flex items-center gap-2 bg-white rounded-xl px-4 h-11 hover:opacity-90 transition-opacity"
                    style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
                  >
                    <span className="text-[13.5px] font-bold" style={{ color: "#16A34A" }}>{it.ctaLabel}</span>
                    <ArrowRight01Icon size={15} color="#16A34A" />
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
