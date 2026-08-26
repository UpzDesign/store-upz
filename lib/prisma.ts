import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaPool?: Pool;
};

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("Missing DATABASE_URL environment variable");
  return databaseUrl;
}

// Reuse one small pg pool and Prisma client for the lifetime of each serverless
// runtime. The dashboard loads several DB-backed endpoints in parallel; creating
// a fresh default pg pool for every route invocation can exhaust Supabase's
// transaction pool and cause unrelated endpoints to fail together with 500s.
const pool =
  globalForPrisma.prismaPool ??
  new Pool({
    connectionString: getDatabaseUrl(),
    max: 3,
    min: 0,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
    allowExitOnIdle: true,
  });

const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
  });

// Cache in production as well as development. A warm Vercel runtime can serve
// many requests, so retaining these objects prevents a new pool per API module.
globalForPrisma.prisma = prisma;
globalForPrisma.prismaPool = pool;
