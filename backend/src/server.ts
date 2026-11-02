import app from "./app";
import { appConfig } from "./config/app-config";
import prisma from "./config/prisma";
import env from "./config/env";
import { ensureUploadFolders } from "./config/storage";
import { startBirthdayScheduler } from "./modules/birthday/birthday.scheduler";
// ── Crash guards ───────────────────────────────────────────────────────────
process.on("uncaughtException", (err: Error) => {
  console.error("❌ UNCAUGHT EXCEPTION — shutting down:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason: unknown) => {
  console.error("❌ UNHANDLED REJECTION — shutting down:", reason);
  process.exit(1);
});

// ── Graceful shutdown ──────────────────────────────────────────────────────
const shutdown = async (
  signal: string,
  server: ReturnType<typeof app.listen>,
) => {
  console.log(`\n${signal} received — shutting down gracefully`);

  // Stop accepting new connections
  server.close(async () => {
    console.log("✅ HTTP server closed");

    try {
      await prisma.$disconnect();
      console.log("✅ Database disconnected");
    } catch (err) {
      console.error("❌ Error disconnecting database:", err);
    }

    process.exit(0);
  });

  // Force-kill if drain takes too long
  setTimeout(() => {
    console.error("❌ Forced shutdown after timeout");
    process.exit(1);
  }, 10_000).unref();
};

// ── Bootstrap ──────────────────────────────────────────────────────────────
async function startServer() {
  try {
    await ensureUploadFolders();
    
    console.log("✅ Upload folders ready");
    await prisma.$queryRaw`SELECT 1`;
    console.log("✅ Database query test passed");

    const server = app.listen(appConfig.port, appConfig.host, () => {
      console.log(
        `🚀 Server running at http://${appConfig.host}:${appConfig.port}`,
      );
      console.log(`🌍 Environment: ${appConfig.env}`);
    });

    startBirthdayScheduler();

    process.on("SIGTERM", () => shutdown("SIGTERM", server));
    process.on("SIGINT", () => shutdown("SIGINT", server));
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

startServer();
