/**
 * SPAL Global State — Zustand
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Badge } from "@/lib/gamification/badges";

export type BusinessType =
  | "food_seller"
  | "bar_owner"
  | "fashion_vendor"
  | "salon"
  | "kiosk"
  | "market_trader"
  | "other";

export type BusinessGoal =
  | "track_sales"
  | "know_profit"
  | "reduce_expenses"
  | "grow_business"
  | "understand_spending";

export type TrackingMethod =
  | "notebook"
  | "whatsapp"
  | "excel"
  | "google_sheets"
  | "notes_app"
  | "receipts"
  | "nothing";

export interface User {
  id: string;
  phone_number?: string | null;
  email?: string | null;
  full_name?: string;
  business_name?: string;
  business_type?: BusinessType;
  business_goals?: BusinessGoal[];
  currency: string;
  whatsapp_number?: string;
  avatar_url?: string | null;
  streak_days: number;
  onboarding_completed: boolean;
  subscription_plan?: string; // 'free' | 'pro'
}

export interface DailySummary {
  date: string;
  total_sales: number;
  total_expenses: number;
  profit: number;
  ai_insight?: string;
  ai_message?: string;
}

interface SPALStore {
  // Auth
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;

  // Onboarding
  onboardingData: {
    businessType?: BusinessType;
    trackingMethods?: TrackingMethod[];
    goals?: BusinessGoal[];
    phoneNumber?: string;
    email?: string;
    mode?: "signup" | "reset"; // "reset" = forgot-password flow
  };
  setOnboardingData: (data: Partial<SPALStore["onboardingData"]>) => void;

  // Today's summary (cached)
  todaySummary: DailySummary | null;
  setTodaySummary: (summary: DailySummary) => void;

  // UI state
  addSheetOpen: "sale" | "expense" | null;
  setAddSheet: (type: "sale" | "expense" | null) => void;

  voiceRecorderOpen: boolean;
  setVoiceRecorderOpen: (open: boolean) => void;

  // Bump this after any voice/quick save so home page re-fetches
  recordSavedAt: number;
  bumpRecordSaved: () => void;

  // Gamification — badge celebration overlay
  newBadge: Badge | null;
  setNewBadge: (badge: Badge | null) => void;

  // Paywall — computed from user.subscription_plan
  isPro: boolean;

  // Logout
  logout: () => void;
}

export const useSPALStore = create<SPALStore>()(
  persist(
    (set) => ({
      // Auth
      user: null,
      isAuthenticated: false,
      isPro: false,
      setUser: (user) =>
        set({ user, isAuthenticated: !!user, isPro: user?.subscription_plan === "pro" }),

      // Onboarding
      onboardingData: {},
      setOnboardingData: (data) =>
        set((state) => ({
          onboardingData: { ...state.onboardingData, ...data },
        })),

      // Summary
      todaySummary: null,
      setTodaySummary: (summary) => set({ todaySummary: summary }),

      // UI
      addSheetOpen: null,
      setAddSheet: (type) => set({ addSheetOpen: type }),

      voiceRecorderOpen: false,
      setVoiceRecorderOpen: (open) => set({ voiceRecorderOpen: open }),

      recordSavedAt: 0,
      bumpRecordSaved: () => set({ recordSavedAt: Date.now() }),

      // Gamification
      newBadge: null,
      setNewBadge: (badge) => set({ newBadge: badge }),

      // Logout
      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
          isPro: false,
          todaySummary: null,
          onboardingData: {},
          newBadge: null,
        }),
    }),
    {
      name: "spal-store",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        onboardingData: state.onboardingData,
      }),
    }
  )
);
