import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { assertTier, type SubscriptionTier } from "../lib/tiers";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

// ─── Auth middleware ──────────────────────────────────────

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

// ─── In-memory rate limiters ──────────────────────────────

interface RLEntry { count: number; resetAt: number }

function makeStore(windowMs: number) {
  const store = new Map<string, RLEntry>();
  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [k, v] of Array.from(store.entries())) {
      if (v.resetAt <= now) store.delete(k);
    }
  }, windowMs * 2);
  if (typeof cleanup.unref === "function") cleanup.unref();
  return store;
}

const generalStore = makeStore(60_000);
const aiStore      = makeStore(60_000);

function checkLimit(store: Map<string, RLEntry>, userId: number, max: number, windowMs: number) {
  const key   = String(userId);
  const now   = Date.now();
  const entry = store.get(key);
  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  if (entry.count >= max) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: `Rate limit exceeded. Try again in ${retryAfter}s.`,
    });
  }
  entry.count += 1;
}

/** General rate limit: 100 req / min / user. */
const withGeneralRateLimit = t.middleware(({ ctx, next }) => {
  if (ctx.user) checkLimit(generalStore, ctx.user.id, 100, 60_000);
  return next();
});

/** AI rate limit: 10 req / min / user. */
const withAiRateLimit = t.middleware(({ ctx, next }) => {
  if (ctx.user) checkLimit(aiStore, ctx.user.id, 10, 60_000);
  return next();
});

// ─── Tier middleware factory ──────────────────────────────

/**
 * Creates a tRPC middleware that blocks the procedure if the user's
 * subscriptionTier is below `required`.
 *
 * ROLLOUT SAFETY: users with no tier set are treated as 'free'.
 *
 * @example
 * // Inside trpc.ts:
 * export const premiumProcedure = t.procedure
 *   .use(requireUser)
 *   .use(requireTier('premium'));
 */
function requireTier(required: SubscriptionTier) {
  return t.middleware(({ ctx, next }) => {
    // ctx.user is guaranteed non-null here because requireUser runs first
    assertTier(ctx.user?.subscriptionTier, required);
    return next();
  });
}

// ─── Exported procedures ─────────────────────────────────

/**
 * Protected procedure: requires authentication + general rate limit (100 req/min).
 * Available to ALL tiers (free, premium, elite).
 */
export const protectedProcedure = t.procedure
  .use(requireUser)
  .use(withGeneralRateLimit);

/**
 * AI procedure: requires authentication + strict rate limit (10 req/min).
 * Available to ALL tiers — tier-specific limits enforced inside the handler.
 */
export const aiProcedure = t.procedure
  .use(requireUser)
  .use(withAiRateLimit);

/**
 * Premium procedure: requires authentication + subscriptionTier ≥ 'premium'.
 * Throws FORBIDDEN (10003) if the user is on the free tier.
 */
export const premiumProcedure = t.procedure
  .use(requireUser)
  .use(withGeneralRateLimit)
  .use(requireTier("premium"));

/**
 * Elite procedure: requires authentication + subscriptionTier = 'elite'.
 * Throws FORBIDDEN (10003) for free and premium users.
 */
export const eliteProcedure = t.procedure
  .use(requireUser)
  .use(withGeneralRateLimit)
  .use(requireTier("elite"));

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  }),
);
