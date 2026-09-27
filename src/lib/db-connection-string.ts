// DB_PORT is not in here — it defaults to 3306 below, matching how the old
// DATABASE_URL-based setup worked for a URL with no explicit port.
export const REQUIRED_DB_VARS = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"] as const;

export type DbParts = { host: string; port: string; user: string; password: string; database: string };

/**
 * Single source of truth for validating + reading the five DB env vars
 * (DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME) instead of one hand-typed
 * DATABASE_URL — repeatedly the source of copy/paste mistakes. Every
 * exported function below, and scripts/backup-db.ts, builds on this one
 * check instead of each re-implementing the missing-var scan.
 */
function readDbParts(): { parts: DbParts } | { missing: readonly string[] } {
  const missing = REQUIRED_DB_VARS.filter((name) =>
    // An empty-string password is a legitimate (if unusual) MySQL
    // credential; only a genuinely unset DB_PASSWORD counts as missing.
    // The other three vars are never valid empty, so a plain falsy check
    // is correct for them.
    name === "DB_PASSWORD" ? process.env[name] === undefined : !process.env[name],
  );
  if (missing.length > 0) return { missing };
  return {
    parts: {
      host: process.env.DB_HOST!,
      port: process.env.DB_PORT || "3306",
      user: process.env.DB_USER!,
      password: process.env.DB_PASSWORD!,
      database: process.env.DB_NAME!,
    },
  };
}

/**
 * Exposed directly for scripts/backup-db.ts, which needs individual fields
 * (for mysqldump's CLI args) rather than an assembled connection string.
 */
export function getDbParts(): DbParts | undefined {
  const result = readDbParts();
  return "missing" in result ? undefined : result.parts;
}

function assemble({ host, port, user, password, database }: DbParts) {
  // allowPublicKeyRetrieval is required for MySQL's caching_sha2_password
  // auth plugin (the only plugin MySQL 9+ ships) to work over a plain,
  // non-TLS connection — without it, auth fails with an RSA-key-exchange
  // error before this even reaches a real query. Harmless if TLS is used.
  //
  // DB_SSL=true is optional — set it if the DB host requires TLS (unlike a
  // hand-typed DATABASE_URL, these five vars have no free-form query-string
  // slot, so this is the one escape hatch for that specific case).
  const ssl = process.env.DB_SSL === "true" ? "&ssl=true" : "";
  return `mariadb://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${encodeURIComponent(host)}:${port}/${encodeURIComponent(database)}?allowPublicKeyRetrieval=true${ssl}`;
}

/**
 * Builds the mariadb:// connection string. Deliberately never throws.
 * `next build` imports (evaluates the top-level code of) every route's
 * module graph — including src/lib/prisma.ts, which every page/layout/
 * route pulls in — to collect page data, regardless of whether that route
 * is ultimately static or dynamic; only PRERENDERING a route (actually
 * calling its exported function) is skipped for dynamic ones (see
 * src/app/sitemap.ts's comment). So this must stay safe to evaluate with
 * zero DB vars present — confirmed empirically: a real `next build` with
 * all four required vars unset failed immediately once this used to throw
 * here. Missing vars instead log a precise, unmistakable error and return
 * an empty string, which `@prisma/adapter-mariadb` accepts without
 * validating at construction — the real, unavoidable failure surfaces
 * moments later anyway, the first time a route actually queries the
 * database.
 */
export function buildDatabaseUrl(): string {
  const result = readDbParts();
  if ("missing" in result) {
    console.error(
      `[prisma] Database connection failed: missing required environment variable(s): ${result.missing.join(", ")}. Set DB_HOST, DB_USER, DB_PASSWORD, and DB_NAME (DB_PORT defaults to 3306) — see .env.example.`,
    );
    return "";
  }
  return assemble(result.parts);
}

/**
 * Same connection string, for prisma.config.ts (loaded by the Prisma CLI,
 * including during `prisma generate` in the build step). Returns undefined
 * instead of an empty string when vars are missing, matching the shape
 * `defineConfig`'s `datasource.url` expects — `prisma generate` never
 * needs a real DB connection either way, but `prisma migrate deploy`/
 * `studio` do, and will show Prisma's own clear "no datasource url" error
 * if these vars are missing when run.
 */
export function buildDatabaseUrlOrUndefined(): string | undefined {
  const result = readDbParts();
  return "missing" in result ? undefined : assemble(result.parts);
}

/** Same connection string with the password masked — safe to log. */
export function buildRedactedDatabaseUrl(): string {
  const result = readDbParts();
  return "missing" in result ? "mariadb://?:***@?:?/?" : assemble({ ...result.parts, password: "***" });
}
