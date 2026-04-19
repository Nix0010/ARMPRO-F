import { protectedProcedure, premiumProcedure, router } from "../../_core/trpc";
import { z } from "zod";
import { notFound } from "../../lib/trpc-errors";
import { assertTier, getLimit } from "../../lib/tiers";
import * as db from "../../db";
import { generateRoutineWithAI } from "./routine.service";
import { TRPCError } from "@trpc/server";

export const routineRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return db.getUserRoutines(ctx.user.id);
  }),

  getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
    const routine = await db.getRoutineById(input.id, ctx.user.id);
    if (!routine) throw notFound("Routine not found");
    return routine;
  }),

  /**
   * Create routine — enforces per-tier routine count limit.
   *
   * Tier limits (max custom routines):
   *   free:    3
   *   premium: 20
   *   elite:   unlimited
   */
  create: protectedProcedure.input(z.object({
    name:        z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    difficulty:  z.enum(["beginner", "intermediate", "advanced", "elite"]).optional(),
    duration:    z.number().int().min(1).max(300).optional(),
    tags:        z.array(z.string().max(50)).max(10).optional(),
    exercises:   z.array(z.object({
      templateId:  z.number().int().positive(),
      sets:        z.number().int().min(1).max(100).optional(),
      reps:        z.string().max(20).optional(),
      restSeconds: z.number().int().min(0).max(600).optional(),
      weight:      z.number().min(0).max(9999).optional(),
    })).max(30).optional(),
  })).mutation(async ({ ctx, input }) => {
    // ─── Tier check: routine count limit ──────────────────
    const tier    = ctx.user.subscriptionTier ?? "free";
    const maxRout = Number(getLimit("maxRoutines", tier));

    if (isFinite(maxRout)) {
      const currentCount = await db.countUserRoutines(ctx.user.id);
      if (currentCount >= maxRout) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Routine limit reached (${maxRout} on your plan). Delete an existing routine or upgrade to create more.`,
        });
      }
    }

    // ─── Create ───────────────────────────────────────────
    const { exercises, ...routineData } = input;
    const routineId = await db.createRoutine({ ...routineData, createdById: ctx.user.id });

    if (routineId && exercises) {
      for (let i = 0; i < exercises.length; i++) {
        await db.addExerciseToRoutine({ ...exercises[i], routineId, orderIndex: i });
      }
    }

    return {
      id:    routineId,
      quota: isFinite(maxRout)
        ? { used: (await db.countUserRoutines(ctx.user.id)), max: maxRout, tier }
        : null,
    };
  }),

  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    const deleted = await db.deleteRoutine(input.id, ctx.user.id);
    if (!deleted) throw notFound("Routine not found");
    return { success: true };
  }),

  /**
   * AI-generated routine — requires premium or elite.
   *
   * Free users: blocked with upgrade message.
   * Premium/Elite: full access.
   */
  generateWithAI: premiumProcedure.input(z.object({
    goal:        z.string().min(1).max(300),
    level:       z.enum(["beginner", "intermediate", "advanced", "elite"]),
    duration:    z.number().int().min(10).max(180).optional(),
    equipment:   z.array(z.string().max(50)).max(20).optional(),
    focusAreas:  z.array(z.string().max(50)).max(10).optional(),
  })).mutation(async ({ ctx, input }) => {
    return generateRoutineWithAI({ ...input, userId: ctx.user.id });
  }),
});
