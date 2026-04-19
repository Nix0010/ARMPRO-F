/**
 * ARMPRO Subscription Tier Configuration
 * ─────────────────────────────────────────────────────────
 *
 * Single source of truth for ALL feature limits per tier.
 * Change numbers here and every middleware picks them up automatically.
 *
 * Rollout strategy (see bottom of file).
 */

import { TIER_RANK, TIER_UPGRADE_MSG } from "@shared/const";
import { TRPCError } from "@trpc/server";

// ─── Tier type ────────────────────────────────────────────

export type SubscriptionTier = "free" | "premium" | "elite";

// ─── Feature limits ───────────────────────────────────────

/**
 * All numeric limits per tier.
 *
 * Values are checked at runtime inside the procedures.
 * Adding a new limit: add a key here, use it in the relevant router.
 */
export const TIER_LIMITS = {
  /** Max AI chat messages per day (tracked by DB history count) */
  aiMessagesPerDay: {
    free:    5,
    premium: 50,
    elite:   Infinity,
  },

  /** Max custom routines a user can create */
  maxRoutines: {
    free:    3,
    premium: 20,
    elite:   Infinity,
  },

  /** Whether AI-generated routines are available */
  aiRoutineGeneration: {
    free:    false,
    premium: true,
    elite:   true,
  },

  /** Whether the user can purchase paid marketplace programs */
  marketplacePurchase: {
    free:    false,  // can only get free programs
    premium: true,
    elite:   true,
  },

  /** Advanced progress analytics (charts, trends) */
  advancedAnalytics: {
    free:    false,
    premium: true,
    elite:   true,
  },

  /** Coach assignment feature */
  coachAccess: {
    free:    false,
    premium: false,
    elite:   true,
  },
} as const;

// ─── Helpers ─────────────────────────────────────────────

/**
 * Returns true if `userTier` meets or exceeds `requiredTier`.
 *
 * @example
 * tierSatisfies("premium", "free")    // true  — premium ≥ free
 * tierSatisfies("free",    "premium") // false — free < premium
 */
export function tierSatisfies(
  userTier: string | null | undefined,
  requiredTier: SubscriptionTier,
): boolean {
  // ROLLOUT SAFETY: if tier is unset, treat as free (legacy users)
  const effective = userTier ?? "free";
  return (TIER_RANK[effective] ?? 0) >= (TIER_RANK[requiredTier] ?? 0);
}

/**
 * Throws a FORBIDDEN tRPC error if the user's tier doesn't meet the requirement.
 * Safe to call from any procedure or service.
 */
export function assertTier(
  userTier: string | null | undefined,
  required: SubscriptionTier,
  customMessage?: string,
): void {
  if (!tierSatisfies(userTier, required)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: customMessage ?? TIER_UPGRADE_MSG,
    });
  }
}

/**
 * Returns the numeric or boolean limit for a given feature and tier.
 *
 * @example
 * getLimit("maxRoutines", "free")           // 3
 * getLimit("aiRoutineGeneration", "free")   // false
 */
export function getLimit<K extends keyof typeof TIER_LIMITS>(
  feature: K,
  tier: string | null | undefined,
): number | boolean {
  const effective = (tier ?? "free") as SubscriptionTier;
  const bucket = TIER_LIMITS[feature] as Record<string, number | boolean>;
  return bucket[effective] ?? bucket["free"];
}


// ─────────────────────────────────────────────────────────
// ROLLOUT STRATEGY
// ─────────────────────────────────────────────────────────
//
// Phase 1 (current — safe):
//   - All existing users have subscriptionTier = 'free' by default.
//   - Newly gated endpoints are applied ONLY to new features.
//   - No existing features are broken.
//
// Phase 2 (soft launch):
//   - Apply requireTier('premium') to AI chat (aiCoach.chat).
//   - Apply routine count limit (maxRoutines) to routine.create.
//   - Apply requireTier('premium') to marketplace.purchase (paid programs).
//
// Phase 3 (full monetization):
//   - Apply requireTier('elite') to coachAccess.
//   - Apply advancedAnalytics gate to progress.stats.
//   - Notify existing users with in-app banner before applying.
//
// How to give existing users grandfathering:
//   - Set their subscriptionTier = 'premium' in the DB before Phase 2.
//   - Or add a `grandfathered: boolean` column and bypass tier checks for it.
