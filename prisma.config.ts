import { config } from "dotenv";
import { defineConfig } from "prisma/config";

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
    url: process.env["DATABASE_URL"],
  },
});
