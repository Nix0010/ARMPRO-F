import { publicProcedure, protectedProcedure, router } from "../../_core/trpc";
import { z } from "zod";
import * as db from "../../db";

export const gamificationRouter = router({
  achievements: publicProcedure.query(async () => {
    return db.getAllAchievements();
  }),
  userAchievements: protectedProcedure.query(async ({ ctx }) => {
    return db.getUserAchievements(ctx.user.id);
  }),
  leaderboard: publicProcedure.input(z.object({ limit: z.number().optional() }).optional()).query(async ({ input }) => {
    return db.getLeaderboard(input?.limit || 20);
  }),
});
