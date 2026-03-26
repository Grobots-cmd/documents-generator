import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Prisma 7 requires a driver adapter — the binary query engine is gone.
 *
 * pg's URL parser breaks on passwords containing special chars like '@'.
 * We parse the DATABASE_URL manually and pass a config object to avoid this.
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function buildPgConfig(connectionString: string) {
  const isPgBouncer = connectionString.includes("pgbouncer=true");
  // Strip pgbouncer param — pg driver doesn't understand it
  const cleanUrl = connectionString.replace(/[?&]pgbouncer=true/, "").replace(/\?$/, "");
  return {
    connectionString: cleanUrl,
    // PgBouncer requires no prepared statements
    ...(isPgBouncer ? { statement_timeout: 0 } : {}),
    ssl: connectionString.includes("sslmode=require")
      ? { rejectUnauthorized: false }
      : undefined,
  };
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set.");
  }

  const adapter = new PrismaPg(buildPgConfig(connectionString));

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
