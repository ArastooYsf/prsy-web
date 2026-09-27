import { config } from "dotenv";
import { defineConfig } from "prisma/config";
import { buildDatabaseUrlOrUndefined } from "./src/lib/db-connection-string";

// Next.js loads .env.local automatically at runtime, but the Prisma CLI
// does not — load it explicitly here (.env as a fallback default).
config({ path: ".env" });
config({ path: ".env.local", override: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Built from DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME (see
    // src/lib/db-connection-string.ts) instead of a hand-typed DATABASE_URL.
    // Uses the non-throwing variant deliberately: `prisma generate` (part of
    // `npm run build`) loads this file too, and never actually needs a real
    // DB connection — it must not fail the build just because these vars
    // aren't set in the build environment. `prisma migrate deploy`/`studio`
    // genuinely do need a real connection, and will surface Prisma's own
    // clear "no datasource url" error if these vars are missing when run.
    url: buildDatabaseUrlOrUndefined(),
  },
});
