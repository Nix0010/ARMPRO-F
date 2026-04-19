import { publicProcedure, protectedProcedure, router } from "../../_core/trpc";
import { z } from "zod";
import { notFound, badRequest } from "../../lib/trpc-errors";
import { assertTier } from "../../lib/tiers";
import * as db from "../../db";

export const marketplaceRouter = router({
  // ── Public endpoints (browsing) ──────────────────────────
  programs: publicProcedure.input(z.object({
    category:   z.string().optional(),
    difficulty: z.string().optional(),
    search:     z.string().max(200).optional(),
  }).optional()).query(async ({ input }) => {
    return db.getPublishedPrograms(input || {});
  }),

  getProgram: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    return db.getProgramById(input.id);
  }),

  myPurchases: protectedProcedure.query(async ({ ctx }) => {
    return db.getUserPurchasedPrograms(ctx.user.id);
  }),

  /**
   * Purchase a PAID program — requires premium or elite tier.
   *
   * Tier rules:
   *   free:    blocked (use acquireFree for $0 programs)
   *   premium: can purchase paid programs
   *   elite:   can purchase paid programs
   */
  purchase: protectedProcedure.input(z.object({ programId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    // ─── Tier check: paid marketplace access ──────────────
    assertTier(
      ctx.user.subscriptionTier,
      "premium",
      "Purchasing paid programs requires a Premium or Elite subscription. Upgrade to unlock the full marketplace.",
    );

    const result = await db.purchaseProgram(ctx.user.id, input.programId);
    if (!result || result.status === "not_found") throw notFound("Program not found");
    return { success: true, ...result };
  }),

  /**
   * Acquire a FREE ($0) program — available to all tiers.
   * No tier restriction — free users can still get free content.
   */
  acquireFree: protectedProcedure.input(z.object({ programId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const result = await db.purchaseFreeProgram(ctx.user.id, input.programId);
    if (!result || result.status === "not_found") throw notFound("Program not found");
    if (result.status === "paid_only") throw badRequest("This program requires paid checkout");
    return { success: true, status: result.status };
  }),
});
