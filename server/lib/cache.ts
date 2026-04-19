/**
 * Redis cache layer — optional.
 *
 * If REDIS_URL is set, uses Redis for caching hot read paths.
 * If REDIS_URL is NOT set, falls back to a no-op in-process Map cache.
 * This means the app runs correctly in dev without Redis installed.
 *
 * Cached paths:
 *   exercises:list:{filters_hash}  — TTL 5 min  (rarely changes)
 *   leaderboard:{limit}            — TTL 2 min  (high read, tolerable staleness)
 *
 * Usage:
 *   import { cache } from "../../lib/cache";
 *   const hit = await cache.get("key");
 *   await cache.set("key", value, 300);   // 300s TTL
 *   await cache.del("key");
 */

import Redis from "ioredis";
import { logger } from "./logger";

// ─── Types ────────────────────────────────────────────────

interface CacheDriver {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds: number): Promise<void>;
  del(key: string): Promise<void>;
  flush(pattern: string): Promise<void>;
}

// ─── In-process fallback (dev / no-Redis) ─────────────────

class MapCache implements CacheDriver {
  private store = new Map<string, { value: string; expiresAt: number }>();

  async get(key: string) {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) { this.store.delete(key); return null; }
    return entry.value;
  }

  async set(key: string, value: string, ttlSeconds: number) {
    this.store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  async del(key: string) { this.store.delete(key); }

  async flush(pattern: string) {
    const prefix = pattern.replace("*", "");
    for (const key of Array.from(this.store.keys())) {
      if (key.startsWith(prefix)) this.store.delete(key);
    }
  }
}

// ─── Redis driver ─────────────────────────────────────────

class RedisCache implements CacheDriver {
  constructor(private client: Redis) {}

  async get(key: string) {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds: number) {
    await this.client.set(key, value, "EX", ttlSeconds);
  }

  async del(key: string) {
    await this.client.del(key);
  }

  async flush(pattern: string) {
    // SCAN is safe for production (non-blocking, unlike KEYS *)
    let cursor = "0";
    do {
      const [next, keys] = await this.client.scan(cursor, "MATCH", pattern, "COUNT", 100);
      cursor = next;
      if (keys.length > 0) await this.client.del(...keys);
    } while (cursor !== "0");
  }
}

// ─── Singleton factory ────────────────────────────────────

let _cache: CacheDriver | null = null;

function buildCache(): CacheDriver {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    logger.info("[Cache] REDIS_URL not set — using in-process Map cache (dev mode).");
    return new MapCache();
  }

  try {
    const client = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      lazyConnect: false,
      enableReadyCheck: true,
    });
    client.on("error", err => logger.error({ err }, "[Cache] Redis error"));
    client.on("connect", () => logger.info("[Cache] Redis connected."));
    logger.info("[Cache] Redis cache ready.");
    return new RedisCache(client);
  } catch (err) {
    logger.warn({ err }, "[Cache] Redis init failed, falling back to Map cache");
    return new MapCache();
  }
}

export function getCache(): CacheDriver {
  if (!_cache) _cache = buildCache();
  return _cache;
}

// ─── Convenience typed helpers ────────────────────────────

/**
 * Get a cached JSON value, or fetch it from `fn` and cache the result.
 *
 * @example
 * const data = await cached("leaderboard:20", 120, () => db.getLeaderboard(20));
 */
export async function cached<T>(
  key: string,
  ttlSeconds: number,
  fn: () => Promise<T>,
): Promise<T> {
  const c = getCache();
  const hit = await c.get(key);
  if (hit) {
    try { return JSON.parse(hit) as T; } catch { /* corrupted — refetch */ }
  }
  const value = await fn();
  await c.set(key, JSON.stringify(value), ttlSeconds);
  return value;
}

/** Invalidate all keys matching a prefix pattern (e.g. "exercises:*"). */
export async function invalidate(pattern: string) {
  await getCache().flush(pattern);
}
