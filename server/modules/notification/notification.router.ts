import { protectedProcedure, router } from "../../_core/trpc";
import { z } from "zod";
import { notFound } from "../../lib/trpc-errors";
import * as db from "../../db";

export const notificationRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return db.getUserNotifications(ctx.user.id);
  }),
  markRead: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    const updated = await db.markNotificationRead(ctx.user.id, input.id);
    if (!updated) throw notFound("Notification not found");
    return { success: true };
  }),
  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    await db.markAllNotificationsRead(ctx.user.id);
    return { success: true };
  }),
});
