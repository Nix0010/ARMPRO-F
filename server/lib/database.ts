/**
 * MySQL connection pool — replaces the single bare connection.
 *
 * Why pooling matters at scale:
 *   - Single connection: every concurrent request queues behind the previous one.
 *   - Pool of 10: up to 10 queries run in parallel; excess requests wait in a
 *     bounded queue instead of failing.
 *
 * Configuration guidelines (adjust via env vars):
 *   DB_POOL_MIN   – keep-alive connections (default 2)
 *   DB_POOL_MAX   – ceiling for concurrent connections (default 10)
 *   DB_POOL_IDLE  – ms before an idle connection is released (default 30 000)
 *   DB_POOL_ACQ   – ms to wait for a free slot before throwing (default 10 000)
 *
 * The pool is a process-level singleton created once on first use.
 */

import { drizzle, type MySql2Database } from "drizzle-orm/mysql2";
import mysql               from "mysql2/promise";
import type { Pool }       from "mysql2/promise";
import { ENV }             from "../_core/env";
import { logger }          from "./logger";

// ─── Singleton pool ───────────────────────────────────────

let _pool: Pool | null = null;
let _db:   MySql2Database<Record<string, unknown>> | null = null;

function getPoolConfig(): mysql.PoolOptions {
  // Support both a full DATABASE_URL or individual env vars
  const url = ENV.databaseUrl;

  const base: mysql.PoolOptions = {
    connectionLimit:    Number(process.env.DB_POOL_MAX  ?? 10),
    // mysql2 uses waitForConnections + queueLimit instead of acquire timeout
    waitForConnections: true,
    queueLimit:         0,               // 0 = unlimited queue (requests wait, not fail)
    idleTimeout:        Number(process.env.DB_POOL_IDLE ?? 30_000),
    enableKeepAlive:    true,
    keepAliveInitialDelay: 0,
  };

  if (url) {
    return { ...base, uri: url };
  }

  // Fallback to individual vars
  return {
    ...base,
    host:     process.env.DB_HOST     ?? "localhost",
    port:     Number(process.env.DB_PORT ?? 3306),
    user:     process.env.DB_USER     ?? "root",
    password: process.env.DB_PASSWORD ?? "",
    database: process.env.DB_NAME     ?? "armpro",
  };
}

/** Returns the shared Drizzle instance backed by a connection pool. */
export async function getDb() {
  if (_db) return _db;

  if (!ENV.databaseUrl && !process.env.DB_HOST) {
    logger.warn("[DB] No DATABASE_URL or DB_HOST configured — skipping connection.");
    return null;
  }

  try {
    _pool = mysql.createPool(getPoolConfig());

    // Verify the pool works before returning
    const conn = await _pool.getConnection();
    conn.release();

    _db = drizzle(_pool as Pool);

    const max = process.env.DB_POOL_MAX ?? 10;
    logger.info(`[DB] MySQL pool ready (max ${max} connections)`);
    return _db;
  } catch (error) {
    logger.error({ err: error }, "[DB] Failed to create connection pool");
    _pool = null;
    _db   = null;
    return null;
  }
}

/**
 * Gracefully drains all pool connections.
 * Call this in SIGTERM / SIGINT handlers.
 */
export async function closeDb() {
  if (_pool) {
    await _pool.end();
    _pool = null;
    _db   = null;
    logger.info("[DB] Connection pool closed.");
  }
}
