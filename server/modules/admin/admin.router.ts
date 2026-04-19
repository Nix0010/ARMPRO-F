import { adminProcedure, router } from "../../_core/trpc";
import { z } from "zod";
import * as db from "../../db";

export const adminRouter = router({
  users: adminProcedure.query(async () => {
    return db.getAllUsers();
  }),
  systemStats: adminProcedure.query(async () => {
    return db.getSystemStats();
  }),
  updateUserRole: adminProcedure.input(z.object({
    userId: z.number(),
    appRole: z.enum(["athlete", "coach", "admin"]),
  })).mutation(async ({ input }) => {
    await db.updateUserProfile(input.userId, { appRole: input.appRole });
    return { success: true };
  }),
});
