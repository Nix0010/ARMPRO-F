/**
 * Security middleware for the ARMPRO Express server.
 *
 * All protections are applied in `server/_core/index.ts` before any route.
 * This file is kept separate to keep `index.ts` readable and to make each
 * protection independently testable.
 */

import type { Express, Request, Response, NextFunction } from "express";
import helmet from "helmet";
import cors from "cors";
import { rateLimit } from "express-rate-limit";
import { ENV } from "./env";

// ─────────────────────────────────────────────────────────
// 1. CORS
// ─────────────────────────────────────────────────────────

/**
 * Allowed origins:
 *  - In development: localhost on any port (Vite HMR uses random ports).
 *  - In production: only the canonical app URL set in APP_URL env var.
 *    Falls back to allowing same-origin requests only (no CORS header emitted).
 */
const ALLOWED_ORIGIN_REGEX = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

function buildCorsOptions(): cors.CorsOptions {
  return {
    origin(origin, callback) {
      // No origin = same-origin request (curl, SSR, mobile) — always allow
      if (!origin) return callback(null, true);

      if (ENV.isProduction) {
        // In production only allow the canonical APP_URL or same-origin
        const allowedProd = process.env.APP_URL ?? "";
        if (allowedProd && origin === allowedProd) return callback(null, true);
        return callback(new Error(`CORS: origin '${origin}' not allowed`));
      }

      // Development: allow any localhost origin
      if (ALLOWED_ORIGIN_REGEX.test(origin)) return callback(null, true);
      return callback(new Error(`CORS: origin '${origin}' not allowed`));
    },
    credentials: true,          // needed for session cookies
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 86_400,             // pre-flight cached for 24 h
  };
}

// ─────────────────────────────────────────────────────────
// 2. Helmet (HTTP security headers)
// ─────────────────────────────────────────────────────────

/**
 * Helmet sets ~15 security headers automatically.
 * Key ones for ARMPRO:
 *  - Content-Security-Policy  → blocks XSS
 *  - X-Frame-Options          → blocks clickjacking
 *  - Strict-Transport-Security → enforces HTTPS in prod
 *  - X-Content-Type-Options   → prevents MIME sniffing
 *  - Referrer-Policy          → limits referrer leakage
 *
 * CSP is loosened just enough for the Vite dev server to work.
 */
function buildHelmetOptions(): Parameters<typeof helmet>[0] {
  const isDev = !ENV.isProduction;
  return {
    contentSecurityPolicy: isDev
      ? false   // Vite HMR uses inline scripts — disable CSP in dev
      : {
          directives: {
            defaultSrc:     ["'self'"],
            scriptSrc:      ["'self'"],
            styleSrc:       ["'self'", "'unsafe-inline'"],   // CSS-in-JS needs this
            imgSrc:         ["'self'", "data:", "https:"],   // allow remote avatars
            connectSrc:     ["'self'"],
            fontSrc:        ["'self'", "https:"],
            objectSrc:      ["'none'"],
            frameAncestors: ["'none'"],
            upgradeInsecureRequests: ENV.isProduction ? [] : null,
          },
        },
    // HSTS only makes sense in production (requires HTTPS)
    strictTransportSecurity: ENV.isProduction
      ? { maxAge: 31_536_000, includeSubDomains: true }
      : false,
    crossOriginEmbedderPolicy: false, // relaxed — needed for some OAuth flows
  };
}

// ─────────────────────────────────────────────────────────
// 3. Rate Limiting (Express-level, before tRPC)
// ─────────────────────────────────────────────────────────

/**
 * Global limiter applied to EVERY route.
 *  - Catches bots/scanners before they hit any business logic.
 *  - 300 req / 15 min per IP ≈ 20 req/min — generous for normal users.
 *
 * The tRPC-level per-user limiters (rate-limit.ts) provide finer control
 * on authenticated endpoints on top of this IP-level protection.
 */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,    // 15 minutes
  max: 300,
  standardHeaders: "draft-7",  // Return RateLimit-* headers (RFC 9110)
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
  skip: (req) => {
    // Skip rate limiting for static assets — only apply to API routes
    return !req.path.startsWith("/api");
  },
});

/**
 * Stricter limiter scoped to the OAuth callback — prevents code-spray attacks.
 * 10 requests per 15 minutes per IP.
 */
const oauthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many authentication attempts." },
});

// ─────────────────────────────────────────────────────────
// 4. Request ID middleware
// ─────────────────────────────────────────────────────────
/** Adds X-Request-ID to every response for traceability in logs. */
function requestId(_req: Request, res: Response, next: NextFunction) {
  res.setHeader("X-Request-ID", crypto.randomUUID());
  next();
}

// ─────────────────────────────────────────────────────────
// 5. Register all security middleware
// ─────────────────────────────────────────────────────────
export function applySecurityMiddleware(app: Express) {
  // Order matters: helmet & CORS first so headers are always set
  app.use(helmet(buildHelmetOptions()));
  app.use(cors(buildCorsOptions()));
  app.options("*", cors(buildCorsOptions()));   // preflight for all routes

  // Global IP-level rate limit (API only)
  app.use(globalLimiter);

  // Stricter limit for OAuth callback
  app.use("/api/oauth/callback", oauthLimiter);

  // Request tracing
  app.use(requestId);
}
