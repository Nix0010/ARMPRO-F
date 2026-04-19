/**
 * Input sanitization utilities.
 *
 * These helpers are used by routers / services to clean untrusted input
 * BEFORE it reaches the database or external APIs.
 *
 * Rules:
 *  1. No HTML/script injection — strip tags and dangerous chars.
 *  2. Avatar URLs must be https:// pointing to known image extensions or
 *     a data: URI (for base64 avatars uploaded by the client).
 *  3. AI messages are trimmed and limited to printable characters.
 */

// ─── Avatar URL validation ────────────────────────────────

/** Allow only https:// URLs and data: URIs (base64 images). */
const SAFE_IMAGE_PROTOCOLS = /^(https:\/\/|data:image\/(png|jpe?g|gif|webp|svg\+xml);base64,)/i;

/** Block javascript:, vbscript:, and file: pseudo-protocols. */
const DANGEROUS_PROTOCOLS = /^(javascript|vbscript|file|data:text)/i;

/**
 * Validates that an avatar URL is safe.
 * Returns the URL if valid, or `null` if it should be rejected.
 *
 * @example
 * validateAvatarUrl("https://cdn.example.com/avatar.png") // → URL
 * validateAvatarUrl("javascript:alert(1)")                // → null
 */
export function validateAvatarUrl(url: string): string | null {
  if (!url) return null;

  const trimmed = url.trim();

  // Hard block dangerous protocols first
  if (DANGEROUS_PROTOCOLS.test(trimmed)) return null;

  // Only allow https:// or data:image/
  if (!SAFE_IMAGE_PROTOCOLS.test(trimmed)) return null;

  // For http(s) URLs, parse and validate the host is not localhost/private
  if (trimmed.startsWith("https://")) {
    try {
      const parsed = new URL(trimmed);
      const host = parsed.hostname;
      // Block SSRF: localhost, 127.x.x.x, 10.x, 192.168.x, 169.254.x (link-local)
      if (
        host === "localhost" ||
        /^127\./.test(host) ||
        /^10\./.test(host) ||
        /^192\.168\./.test(host) ||
        /^169\.254\./.test(host) ||
        /^::1$/.test(host) ||
        host === "0.0.0.0"
      ) return null;
    } catch {
      return null; // Unparseable URL
    }
  }

  return trimmed;
}

// ─── AI input sanitization ────────────────────────────────

/**
 * Sanitizes a user message before sending it to the LLM.
 *
 * What it does:
 *  - Trims whitespace
 *  - Normalizes multiple newlines to max 2 (prevents token inflation)
 *  - Removes null bytes and control characters (except tab + newline)
 *  - Strips HTML tags (< ... >) — the LLM doesn't need raw HTML
 *
 * What it does NOT do:
 *  - It does NOT change the semantic meaning of the message
 *  - It does NOT block words or topics (that's the LLM system prompt's job)
 */
export function sanitizeAiMessage(raw: string): string {
  return raw
    .trim()
    // Remove null bytes and most C0/C1 control chars (keep \t and \n)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, "")
    // Strip HTML tags
    .replace(/<[^>]{0,200}>/g, "")
    // Collapse more than 2 consecutive newlines → 2
    .replace(/\n{3,}/g, "\n\n")
    // Collapse more than 4 consecutive spaces → 4
    .replace(/ {5,}/g, "    ");
}

// ─── Generic string sanitization ─────────────────────────

/**
 * Light sanitization for free-text fields (bio, notes, descriptions).
 * Does NOT escape HTML (that's the frontend's job) — just removes
 * control characters and trims.
 */
export function sanitizeText(raw: string): string {
  return raw
    .trim()
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, "");
}
