import { protectedProcedure, router } from "../../_core/trpc";
import { z } from "zod";
import * as db from "../../db";

export const progressRouter = router({
  add: protectedProcedure.input(z.object({
    // ✅ Added .min()/.max() to all string and numeric fields
    type:          z.string().min(1).max(50),
    metric:        z.string().min(1).max(100),
    value:         z.number().finite(),
    previousValue: z.number().finite().optional(),
    unit:          z.string().max(20).optional(),
    notes:         z.string().max(500).optional(),
  })).mutation(async ({ ctx, input }) => {
    await db.addProgressEntry({ ...input, userId: ctx.user.id });
    return { success: true };
  }),

  get: protectedProcedure.input(z.object({
    metric: z.string().min(1).max(100).optional(),
  }).optional()).query(async ({ ctx, input }) => {
    return db.getUserProgress(ctx.user.id, input?.metric);
  }),

  stats: protectedProcedure.query(async ({ ctx }) => {
    return db.getUserStats(ctx.user.id);
  }),
});
