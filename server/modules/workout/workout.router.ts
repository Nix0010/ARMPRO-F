import { protectedProcedure, router } from "../../_core/trpc";
import { z } from "zod";
import { notFound, badRequest } from "../../lib/trpc-errors";
import * as db from "../../db";

const setDataSchema = z.array(z.object({
  reps:      z.number().int().min(0),
  weight:    z.number().min(0),
  completed: z.boolean(),
}));

export const workoutRouter = router({
  start: protectedProcedure.input(z.object({
    routineId: z.number().int().positive(),
  })).mutation(async ({ ctx, input }) => {
    const sessionId = await db.startWorkout(ctx.user.id, input.routineId);
    if (!sessionId) throw notFound("Routine not found");
    return { sessionId };
  }),

  getActive: protectedProcedure.query(async ({ ctx }) => {
    return db.getActiveWorkout(ctx.user.id);
  }),

  updateExercise: protectedProcedure.input(z.object({
    exerciseId:    z.number().int().positive(),
    completedSets: z.number().int().min(0).max(100).optional(),
    weight:        z.number().min(0).max(9999.99).optional(),
    isCompleted:   z.boolean().optional(),
    isPR:          z.boolean().optional(),
    // ✅ Replaced z.any() with a proper typed schema
    setData:       setDataSchema.optional(),
  })).mutation(async ({ ctx, input }) => {
    const { exerciseId, ...data } = input;
    const updated = await db.updateWorkoutExercise(ctx.user.id, exerciseId, data);
    if (!updated) throw notFound("Workout exercise not found");
    return { success: true };
  }),

  complete: protectedProcedure.input(z.object({
    sessionId:      z.number().int().positive(),
    duration:       z.number().int().min(0).optional(),
    totalVolume:    z.number().min(0).optional(),
    completionRate: z.number().min(0).max(1).optional(),
    notes:          z.string().max(2000).optional(),
    // ✅ Bounded mood string
    mood:           z.string().max(50).optional(),
  })).mutation(async ({ ctx, input }) => {
    const completed = await db.completeWorkout(ctx.user.id, input.sessionId, input);
    if (!completed) throw badRequest("Workout session not found or already completed");
    const xpResult          = await db.addXpToUser(ctx.user.id, completed.xpEarned);
    const profileStats      = await db.incrementUserWorkoutStats(ctx.user.id, completed.completedAt);
    const unlockedAchievements = await db.syncUserAchievements(ctx.user.id);
    return {
      ...completed,
      ...xpResult,
      ...profileStats,
      unlockedAchievements,
    };
  }),

  history: protectedProcedure.input(z.object({
    limit: z.number().int().min(1).max(200).optional(),
  }).optional()).query(async ({ ctx, input }) => {
    return db.getUserWorkoutHistory(ctx.user.id, input?.limit ?? 20);
  }),
});
