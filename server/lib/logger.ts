import pino from "pino";

const isDevelopment = process.env.NODE_ENV === "development";

/**
 * Structured logger for ARMPRO backend.
 * Uses `pino-pretty` in development for readability.
 * Uses raw JSON in production for easy ingestion by log aggregators (ELK, Datadog).
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: isDevelopment
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:MM:ss Z",
          ignore: "pid,hostname",
        },
      }
    : undefined,
});
