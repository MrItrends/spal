/**
 * SPAL Gamification — Badge check and award logic
 * Call checkAndAwardBadges() after any action that might unlock a badge.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export interface Badge {
  id: string;
  name: string;
  emoji: string;
  description: string;
  category: string;
}

export type BadgeTrigger =
  | "record_saved"       // after any record insert
  | "advisor_chat"       // after first advisor message
  | "challenge_complete" // after weekly challenge completion
  | "goal_set";          // after user sets a business goal

/**
 * Check which badges the user has newly earned and insert them.
 * Returns the list of newly awarded badges (empty if none).
 */
export async function checkAndAwardBadges(
  supabase: SupabaseClient,
  userId: string,
  trigger: BadgeTrigger,
  context?: {
    streakDays?: number;
    totalRecords?: number;
    totalSales?: number;
  }
): Promise<Badge[]> {
  const newlyEarned: Badge[] = [];

  // Fetch already-earned badge IDs to avoid re-awarding
  const { data: existing } = await supabase
    .from("user_badges")
    .select("badge_id")
    .eq("user_id", userId);

  const earned = new Set((existing ?? []).map((r: { badge_id: string }) => r.badge_id));

  const candidates: string[] = [];

  if (trigger === "record_saved") {
    // first_step: first ever record
    if (!earned.has("first_step") && (context?.totalRecords ?? 0) >= 1) {
      candidates.push("first_step");
    }
    // money_maker: 10 sales
    if (!earned.has("money_maker") && (context?.totalSales ?? 0) >= 10) {
      candidates.push("money_maker");
    }
    // century: 100 total records
    if (!earned.has("century") && (context?.totalRecords ?? 0) >= 100) {
      candidates.push("century");
    }
    // streak badges
    if (!earned.has("streak_7") && (context?.streakDays ?? 0) >= 7) {
      candidates.push("streak_7");
    }
    if (!earned.has("streak_30") && (context?.streakDays ?? 0) >= 30) {
      candidates.push("streak_30");
    }
  }

  if (trigger === "advisor_chat" && !earned.has("quick_learner")) {
    candidates.push("quick_learner");
  }

  if (trigger === "challenge_complete" && !earned.has("challenge_1")) {
    candidates.push("challenge_1");
  }

  if (trigger === "goal_set" && !earned.has("goal_setter")) {
    candidates.push("goal_setter");
  }

  if (candidates.length === 0) return [];

  // Fetch badge metadata for candidates
  const { data: badgeMeta } = await supabase
    .from("badges")
    .select("id, name, emoji, description, category")
    .in("id", candidates);

  if (!badgeMeta || badgeMeta.length === 0) return [];

  // Insert earned badges (ignore duplicates via UNIQUE constraint)
  const inserts = badgeMeta.map((b: Badge) => ({ user_id: userId, badge_id: b.id }));
  await supabase.from("user_badges").upsert(inserts, { onConflict: "user_id,badge_id" });

  return badgeMeta as Badge[];
}

/**
 * Fetch all badges with earned status for a user.
 * Returns all catalogue badges, each with an `earned_at` field if unlocked.
 */
export async function getUserBadges(
  supabase: SupabaseClient,
  userId: string
): Promise<Array<Badge & { earned_at: string | null }>> {
  const [{ data: all }, { data: earned }] = await Promise.all([
    supabase.from("badges").select("id, name, emoji, description, category"),
    supabase.from("user_badges").select("badge_id, earned_at").eq("user_id", userId),
  ]);

  const earnedMap = new Map((earned ?? []).map((r: { badge_id: string; earned_at: string }) => [r.badge_id, r.earned_at]));

  return (all ?? []).map((b: Badge) => ({
    ...b,
    earned_at: earnedMap.get(b.id) ?? null,
  }));
}
