import { publicProcedure, protectedProcedure, router } from "../../_core/trpc";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "../../_core/cookies";
import * as db from "../../db";
import { validateAvatarUrl } from "../../lib/sanitize";
import { TRPCError } from "@trpc/server";

export const authRouter = router({
  me: publicProcedure.query(opts => opts.ctx.user),

  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true } as const;
  }),

  updateProfile: protectedProcedure.input(z.object({
    // ✅ Added .min()/.max() to all string fields
    name:    z.string().min(1).max(100).optional(),
    bio:     z.string().max(500).optional(),
    country: z.string().max(100).optional(),
    /** URL or base64 — keep high limit but still bounded */
    avatar:  z.string().max(2048).optional(),
    preferences: z.object({
      theme:                z.enum(["light", "dark"]).optional(),
      emailNotifications:   z.boolean().optional(),
      workoutReminders:     z.boolean().optional(),
    }).optional(),
  })).mutation(async ({ ctx, input }) => {
    const safeInput = { ...input };
    // ✅ Validate avatar URL — blocks javascript: URIs and SSRF targets
    if (safeInput.avatar !== undefined) {
      const safeUrl = validateAvatarUrl(safeInput.avatar);
      if (safeInput.avatar && safeUrl === null) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid avatar URL." });
      }
      safeInput.avatar = safeUrl ?? undefined;
    }
    await db.updateUserProfile(ctx.user.id, safeInput);
    return { success: true };
  }),
});
