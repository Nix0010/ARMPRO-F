import { aiProcedure, protectedProcedure, router } from "../../_core/trpc";
import { z } from "zod";
import * as db from "../../db";
import { chat } from "./aiCoach.service";
import { sanitizeAiMessage } from "../../lib/sanitize";
import { TIER_LIMITS, getLimit } from "../../lib/tiers";
import { TRPCError } from "@trpc/server";

export const aiCoachRouter = router({
  /**
   * AI chat endpoint — strict rate limit (10 req/min) + daily message quota by tier.
   *
   * Tier limits (messages / day):
   *   free:    5
   *   premium: 50
   *   elite:   unlimited
   */
  chat: aiProcedure.input(z.object({
    message: z.string().min(1).max(2000),
  })).mutation(async ({ ctx, input }) => {
    // ─── Tier check: daily message quota ──────────────────
    const tier = ctx.user.subscriptionTier ?? "free";
    const dailyMax = Number(getLimit("aiMessagesPerDay", tier));

    if (isFinite(dailyMax)) {
      // Count today's messages from history (simple approach — no extra column needed)
      const history = await db.getChatHistory(ctx.user.id, dailyMax + 10);
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const todayUserMessages = history.filter(
        m => m.role === "user" && new Date(m.createdAt) >= todayStart,
      );

      if (todayUserMessages.length >= dailyMax) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `AI chat limit reached (${dailyMax} messages/day on your plan). Upgrade to send more.`,
        });
      }
    }

    // ─── Sanitize and call LLM ────────────────────────────
    const clean = sanitizeAiMessage(input.message);
    if (!clean) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Message cannot be empty after sanitization." });
    }
    const response = await chat(ctx.user.id, clean);

    // ─── Return quota info so the client can show a warning ──
    return {
      response,
      quota: isFinite(dailyMax)
        ? { used: (await db.getChatHistory(ctx.user.id, dailyMax + 10))
              .filter(m => m.role === "user" && new Date(m.createdAt) >= new Date(new Date().setHours(0, 0, 0, 0))).length,
            max: dailyMax,
            tier,
          }
        : null,
    };
  }),

  history: protectedProcedure.query(async ({ ctx }) => {
    return db.getChatHistory(ctx.user.id);
  }),

  clearHistory: protectedProcedure.mutation(async ({ ctx }) => {
    await db.clearChatHistory(ctx.user.id);
    return { success: true };
  }),
});
