/**
 * In-memory rate limiter for tRPC procedures.
 *
 * Uses a sliding window (reset every `windowMs`).
 * No external dependencies — compatible with any deployment.
 *
 * Usage in trpc.ts:
 *   const withRateLimit = t.middleware(opts => generalLimiter(opts));
 *   export const protectedProcedure = t.procedure.use(requireUser).use(withRateLimit);
 */

import { TRPCError } from "@trpc/server";

interface WindowEntry {
  count: number;
  resetAt: number;
}

function createLimiter(maxRequests: number, windowMs: number) {
  const store = new Map<string, WindowEntry>();

  // Periodic cleanup to avoid memory leaks in long-running processes
  const cleanup = setInterval(() => {
    const now = Date.now();
    // Array.from avoids down-level iteration issues with Map
    for (const [key, entry] of Array.from(store.entries())) {
      if (entry.resetAt <= now) store.delete(key);
    }
  }, windowMs * 2);

  if (typeof cleanup.unref === "function") cleanup.unref();

  /**
   * Compatible with t.middleware(opts => limiter(opts)):
   * accepts the full tRPC middleware opts object and returns the result of next().
   */
  return async function rateLimitMiddleware(opts: {
    ctx: { user?: { id: number } | null };
    next: () => Promise<unknown>;
    [key: string]: unknown;
  }): Promise<unknown> {
    const { ctx, next } = opts;
    const userId = ctx.user?.id;
    if (!userId) return next();

    const key = String(userId);
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || entry.resetAt <= now) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (entry.count >= maxRequests) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `Rate limit exceeded. Try again in ${retryAfter}s.`,
      });
    }

    entry.count += 1;
    return next();
  };
}

/** General API rate limiter: 100 requests per minute per user */
export const generalLimiter = createLimiter(100, 60_000);

/** AI Chat rate limiter: 10 requests per minute per user */
export const aiLimiter = createLimiter(10, 60_000);
