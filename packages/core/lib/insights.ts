/**
 * Shared shape for a dashboard "insight" card (the nudge/tip cards on Home).
 * Both apps' hooks build these; each app's view renders them in its own layout
 * (mobile: swipeable single-card carousel; desktop: a wrapping grid).
 */
export type InsightTone = "warning" | "info" | "success";

export interface InsightItem {
  id: string;
  tone: InsightTone;
  title: string;
  body: string;
  ctaLabel?: string;
  ctaHref?: string;
}
