import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@/generated/prisma/client";
import { buildDatabaseUrl, buildRedactedDatabaseUrl } from "@/lib/db-connection-string";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Node's module cache means this whole file only evaluates once per running
// `next start` process either way; the guard just also stops dev's Fast
// Refresh (which deliberately re-evaluates modules) from spamming this log
// on every reload. Prints so a wrong DB_HOST/DB_USER/DB_PASSWORD/DB_NAME
// shows up immediately in the startup log, instead of only surfacing as an
// opaque connection error on the first real query. Password never included.
if (!globalForPrisma.prisma) {
  console.log(`[prisma] connecting to ${buildRedactedDatabaseUrl()}`);
}

const adapter = new PrismaMariaDb(buildDatabaseUrl());

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
