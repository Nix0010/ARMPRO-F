import { protectedProcedure, router } from "../../_core/trpc";
import { TRPCError } from "@trpc/server";
import * as db from "../../db";

export const coachRouter = router({
  dashboard: protectedProcedure.query(async ({ ctx }) => {
    const isCoach = ctx.user.appRole === "coach" || ctx.user.appRole === "admin";
    if (!isCoach) throw new TRPCError({ code: "FORBIDDEN", message: "Coach access required" });
    return db.getCoachDashboard(ctx.user.id);
  }),
});
