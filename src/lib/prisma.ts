// ═══════════════════════════════════════════════════════════════════
//  Prisma Client — Singleton
// ═══════════════════════════════════════════════════════════════════
//  Provides a singleton Prisma client instance for the entire app.
//  In development, the instance is cached on `globalThis` to avoid
//  exhausting database connections during hot-reloads.
// ═══════════════════════════════════════════════════════════════════

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
