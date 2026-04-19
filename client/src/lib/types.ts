/**
 * Shared client-side types derived from tRPC / server schemas.
 *
 * Instead of casting `user as any` everywhere, import AppUser here.
 * The type is inferred from the `auth.me` query output via tRPC, which
 * ultimately reflects `drizzle/schema.ts > users.$inferSelect`.
 */
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../server/routers";

type RouterOutput = inferRouterOutputs<AppRouter>;

/** The full user object returned by `auth.me` — nullable when logged out. */
export type AppUser = NonNullable<RouterOutput["auth"]["me"]>;

/** Subscription tier values (mirrors the DB enum). */
export type SubscriptionTier = "free" | "premium" | "elite";

/** App role values (mirrors the DB enum). */
export type AppRole = "athlete" | "coach" | "admin";
