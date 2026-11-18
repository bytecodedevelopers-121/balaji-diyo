import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

const globalForPrisma = globalThis as {
  prisma?: PrismaClient;
};

if (!globalForPrisma.prisma) {
  // Keep-alive and a short idle timeout stop the remote (Neon) server from dropping connections mid-request.
  const pool = new Pool({
    connectionString,
    max: 10,
    keepAlive: true,
    idleTimeoutMillis: 20_000,
    connectionTimeoutMillis: 30_000,
  });
  pool.on("error", () => {
    // An idle connection closed by the server is discarded; the pool opens a new one on next use.
  });
  const adapter = new PrismaPg(pool);

  globalForPrisma.prisma = new PrismaClient({
    adapter,
    // The database is remote, so every query in an interactive transaction costs a network round
    // trip. The 5s default expired on big saves (a package's itinerary rewrites many rows) with
    // "Transaction API error: A query cannot be executed on an expired transaction".
    transactionOptions: { maxWait: 15_000, timeout: 60_000 },
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

const prisma = globalForPrisma.prisma;

export default prisma;