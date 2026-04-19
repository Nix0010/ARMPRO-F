import { publicProcedure, protectedProcedure, router } from "../../_core/trpc";
import { z } from "zod";
import * as db from "../../db";

export const exerciseRouter = router({
  list: publicProcedure.input(z.object({
    category: z.string().optional(),
    difficulty: z.string().optional(),
    search: z.string().optional(),
  }).optional()).query(async ({ input }) => {
    return db.getExercises(input || {});
  }),
  getById: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    return db.getExerciseById(input.id);
  }),
  create: protectedProcedure.input(z.object({
    name: z.string(),
    nameEn: z.string().optional(),
    description: z.string().optional(),
    category: z.enum(["armwrestling", "strength", "technique", "conditioning", "mobility"]).optional(),
    difficulty: z.enum(["beginner", "intermediate", "advanced", "elite"]).optional(),
    muscles: z.array(z.string()).optional(),
    equipment: z.array(z.string()).optional(),
    instructions: z.array(z.string()).optional(),
    tips: z.array(z.string()).optional(),
    commonMistakes: z.array(z.string()).optional(),
  })).mutation(async ({ ctx, input }) => {
    const id = await db.createExercise({ ...input, createdById: ctx.user.id });
    return { id };
  }),
});
