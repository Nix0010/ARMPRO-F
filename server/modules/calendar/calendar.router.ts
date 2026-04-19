import { protectedProcedure, router } from "../../_core/trpc";
import { z } from "zod";
import { notFound } from "../../lib/trpc-errors";
import * as db from "../../db";

export const calendarRouter = router({
  events: protectedProcedure.input(z.object({
    startDate: z.string().datetime({ offset: true }).optional(),
    endDate:   z.string().datetime({ offset: true }).optional(),
  }).optional()).query(async ({ ctx, input }) => {
    const start = input?.startDate ? new Date(input.startDate) : undefined;
    const end   = input?.endDate   ? new Date(input.endDate)   : undefined;
    return db.getUserCalendarEvents(ctx.user.id, start, end);
  }),

  create: protectedProcedure.input(z.object({
    // ✅ .min(1).max() on all strings
    title:       z.string().min(1).max(255),
    description: z.string().max(1000).optional(),
    type:        z.enum(["workout", "rest", "competition", "custom"]).optional(),
    routineId:   z.number().int().positive().optional(),
    scheduledAt: z.string().datetime({ offset: true }),
    duration:    z.number().int().min(1).max(1440).optional(),
  })).mutation(async ({ ctx, input }) => {
    const id = await db.createCalendarEvent({
      ...input,
      userId:      ctx.user.id,
      scheduledAt: new Date(input.scheduledAt),
    });
    return { id };
  }),

  update: protectedProcedure.input(z.object({
    id:          z.number().int().positive(),
    title:       z.string().min(1).max(255).optional(),
    description: z.string().max(1000).optional(),
    scheduledAt: z.string().datetime({ offset: true }).optional(),
    isCompleted: z.boolean().optional(),
  })).mutation(async ({ ctx, input }) => {
    const { id, scheduledAt, ...rest } = input;
    const data: Parameters<typeof db.updateCalendarEvent>[2] = { ...rest };
    if (scheduledAt) data.scheduledAt = new Date(scheduledAt);
    const updated = await db.updateCalendarEvent(ctx.user.id, id, data);
    if (!updated) throw notFound("Calendar event not found");
    return { success: true };
  }),

  delete: protectedProcedure.input(z.object({
    id: z.number().int().positive(),
  })).mutation(async ({ ctx, input }) => {
    const deleted = await db.deleteCalendarEvent(ctx.user.id, input.id);
    if (!deleted) throw notFound("Calendar event not found");
    return { success: true };
  }),
});
