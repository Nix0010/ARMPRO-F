export const COOKIE_NAME = "app_session_id";
export const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;
export const AXIOS_TIMEOUT_MS = 30_000;
export const UNAUTHED_ERR_MSG = 'Please login (10001)';
export const NOT_ADMIN_ERR_MSG = 'You do not have required permission (10002)';

// ─── Subscription tier constants ─────────────────────────
export const TIER_FREE    = 'free'    as const;
export const TIER_PREMIUM = 'premium' as const;
export const TIER_ELITE   = 'elite'   as const;

export const TIER_UPGRADE_MSG = 'This feature requires a higher subscription tier. Upgrade to unlock it (10003)';

/** Ordered ranking so we can do numeric comparisons */
export const TIER_RANK: Record<string, number> = {
  free:    0,
  premium: 1,
  elite:   2,
};
