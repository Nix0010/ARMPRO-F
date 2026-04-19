import { ENV } from "./env";
import type { InvokeParams, InvokeResult } from "./llm";
import { logger } from "../lib/logger";

// ─── Constants ────────────────────────────────────────────

/** Maximum ms to wait for the LLM API before aborting. */
const AI_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS ?? 10_000);

/** Maximum retries on transient failures (5xx, network errors). */
const AI_MAX_RETRIES = Number(process.env.AI_MAX_RETRIES ?? 2);

// Re-export types from llm.ts so consumers only need this file
export type { Role, Message, InvokeParams, InvokeResult } from "./llm";

// ─── Robust LLM invocation ────────────────────────────────

/**
 * invokeLLMSafe — wraps the raw LLM call with:
 *
 *   1. **10-second timeout** via AbortController.
 *      Without this, a slow LLM response blocks the Node.js event loop for
 *      potentially minutes, consuming the tRPC request slot indefinitely.
 *
 *   2. **Retry on transient failures** (network glitch, 503 Service Unavailable).
 *      Non-retryable errors (400 Bad Request, 401 Unauthorized) are thrown immediately.
 *
 *   3. **Structured error types** so callers can distinguish timeout vs auth failure
 *      vs rate-limit without parsing error message strings.
 */
export async function invokeLLMSafe(params: InvokeParams): Promise<InvokeResult> {
  // Import lazily to avoid circular deps
  const { invokeLLM } = await import("./llm");

  let lastError: unknown;

  for (let attempt = 0; attempt <= AI_MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

    try {
      // Inject the abort signal into the fetch call by monkey-patching globalThis.fetch
      // in a way that is transparent to invokeLLM.
      const originalFetch = globalThis.fetch;
      globalThis.fetch = (input, init) =>
        originalFetch(input, { ...init, signal: controller.signal });

      try {
        const result = await invokeLLM(params);
        return result;
      } finally {
        globalThis.fetch = originalFetch;
      }
    } catch (err: unknown) {
      lastError = err;

      // AbortError means we hit the timeout — no point retrying
      if (err instanceof Error && err.name === "AbortError") {
        throw new AITimeoutError(`LLM did not respond within ${AI_TIMEOUT_MS}ms`);
      }

      // Parse HTTP status from the error message (invokeLLM throws a plain Error)
      const message = err instanceof Error ? err.message : String(err);
      const statusMatch = message.match(/LLM invoke failed: (\d+)/);
      const status = statusMatch ? Number(statusMatch[1]) : 0;

      // Do not retry on client errors (4xx) — they won't go away
      if (status >= 400 && status < 500) {
        if (status === 429) throw new AIRateLimitError("AI rate limit reached. Try again later.");
        if (status === 401) throw new AIAuthError("AI API key is invalid or missing.");
        throw err;
      }

      // On last attempt, give up
      if (attempt === AI_MAX_RETRIES) break;

      // Exponential back-off: 500ms, 1000ms, …
      const delay = 500 * Math.pow(2, attempt);
      logger.warn(`[AI] Attempt ${attempt + 1} failed (${message}). Retrying in ${delay}ms…`);
      await sleep(delay);
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError ?? new Error("LLM invocation failed after retries");
}

// ─── Custom error types ───────────────────────────────────

export class AITimeoutError extends Error {
  constructor(message: string) { super(message); this.name = "AITimeoutError"; }
}

export class AIRateLimitError extends Error {
  constructor(message: string) { super(message); this.name = "AIRateLimitError"; }
}

export class AIAuthError extends Error {
  constructor(message: string) { super(message); this.name = "AIAuthError"; }
}

// ─── Helpers ─────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
