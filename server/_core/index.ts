import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { applySecurityMiddleware } from "./security";
import { closeDb } from "../lib/database";
import { logger } from "../lib/logger";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => { server.close(() => resolve(true)); });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) return port;
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app    = express();
  const server = createServer(app);

  // ─── Security middleware (Helmet, CORS, Rate Limiting) ───
  applySecurityMiddleware(app);

  // ─── Body parsers ────────────────────────────────────────
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ limit: "1mb", extended: true }));

  // ─── Routes ──────────────────────────────────────────────
  registerOAuthRoutes(app);

  app.use(
    "/api/trpc",
    createExpressMiddleware({ router: appRouter, createContext }),
  );

  // ─── Frontend ────────────────────────────────────────────
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port          = await findAvailablePort(preferredPort);
  if (port !== preferredPort) logger.info(`Port ${preferredPort} is busy, using ${port}`);

  server.listen(port, () => logger.info(`Server running on http://localhost:${port}/`));
  return server;
}

// ─── Graceful shutdown ────────────────────────────────────
// Drains the MySQL pool before the process exits.
// Without this, Docker/Kubernetes restarts leave zombie connections that
// exhaust MySQL's max_connections (typically 150).

async function shutdown(signal: string, server: import("http").Server) {
  logger.info(`[Server] ${signal} — shutting down gracefully…`);
  server.close(async () => {
    await closeDb();
    logger.info("[Server] Shutdown complete.");
    process.exit(0);
  });
  // Force-exit after 10 s if keep-alive connections stall
  setTimeout(() => { logger.error("[Server] Forced shutdown."); process.exit(1); }, 10_000).unref();
}

startServer()
  .then(server => {
    process.on("SIGTERM", () => shutdown("SIGTERM", server));
    process.on("SIGINT",  () => shutdown("SIGINT",  server));
  })
  .catch((err) => logger.error({ err }, "Startup failed"));
