// Bypasses Prisma's schema-engine entirely and applies prisma/migrations/*
// with the raw "mariadb" driver instead — the same driver src/lib/prisma.ts
// uses at runtime, which (unlike schema-engine) has been confirmed to reach
// ParsPack's MySQL host. Tracks applied migrations in _prisma_migrations
// using the exact table Prisma's own migrate engine creates, so `prisma
// migrate deploy`/`status` recognize these as real applied migrations later.
//
// Usage: node scripts/manual-migrate.js
const { config } = require("dotenv");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const mariadb = require("mariadb");

config({ path: ".env" });
config({ path: ".env.local", override: true });

const MIGRATIONS_DIR = path.join(__dirname, "..", "prisma", "migrations");

function loadMigrations() {
  return fs
    .readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort() // directory names are timestamp-prefixed, so lexical sort == chronological
    .map((name) => ({
      name,
      sql: fs.readFileSync(path.join(MIGRATIONS_DIR, name, "migration.sql"), "utf8"),
    }));
}

async function ensureMigrationsTable(conn) {
  await conn.query(`
    CREATE TABLE IF NOT EXISTS \`_prisma_migrations\` (
      \`id\` VARCHAR(36) NOT NULL,
      \`checksum\` VARCHAR(64) NOT NULL,
      \`finished_at\` DATETIME(3) NULL,
      \`migration_name\` VARCHAR(255) NOT NULL,
      \`logs\` TEXT NULL,
      \`rolled_back_at\` DATETIME(3) NULL,
      \`started_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      \`applied_steps_count\` INTEGER UNSIGNED NOT NULL DEFAULT 0,
      PRIMARY KEY (\`id\`)
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  `);
}

async function appliedMigrationNames(conn) {
  const rows = await conn.query(
    "SELECT `migration_name` FROM `_prisma_migrations` WHERE `finished_at` IS NOT NULL",
  );
  return new Set(rows.map((r) => r.migration_name));
}

async function applyMigration(conn, migration) {
  const id = crypto.randomUUID();
  const checksum = crypto.createHash("sha256").update(migration.sql).digest("hex");

  await conn.query(
    "INSERT INTO `_prisma_migrations` (`id`, `checksum`, `migration_name`, `started_at`) VALUES (?, ?, ?, CURRENT_TIMESTAMP(3))",
    [id, checksum, migration.name],
  );

  // migration.sql files are plain multi-statement SQL (see "-- CreateTable"
  // blocks) — multipleStatements lets one query() run the whole file as-is,
  // same as schema-engine does.
  await conn.query(migration.sql);

  await conn.query(
    "UPDATE `_prisma_migrations` SET `finished_at` = CURRENT_TIMESTAMP(3), `applied_steps_count` = 1 WHERE `id` = ?",
    [id],
  );
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const conn = await mariadb.createConnection({
    ...parseUrlForMariadb(databaseUrl),
    multipleStatements: true,
  });

  // Prisma's own migrate engine takes an advisory lock before touching
  // _prisma_migrations; this does the same, so two operators (or a retry)
  // running this concurrently can't both apply the same migration at once.
  const LOCK_NAME = "prisma_manual_migrate";
  const [{ got_lock: gotLock }] = await conn.query("SELECT GET_LOCK(?, 10) AS got_lock", [LOCK_NAME]);
  if (!gotLock) {
    console.error("Could not acquire migration lock — another migrate run may already be in progress.");
    process.exit(1);
  }

  try {
    await ensureMigrationsTable(conn);
    const applied = await appliedMigrationNames(conn);
    const migrations = loadMigrations();
    const pending = migrations.filter((m) => !applied.has(m.name));

    if (pending.length === 0) {
      console.log("No pending migrations. Database is up to date.");
      return;
    }

    console.log(`${pending.length} pending migration(s) to apply:`);
    for (const m of pending) console.log(`  - ${m.name}`);

    for (const migration of pending) {
      console.log(`\nApplying ${migration.name} ...`);
      try {
        await applyMigration(conn, migration);
        console.log(`  done.`);
      } catch (err) {
        console.error(`\nMigration "${migration.name}" FAILED — stopping here, no further migrations applied.`);
        console.error(err.message || err);
        process.exit(1);
      }
    }

    console.log("\nAll pending migrations applied successfully.");
  } finally {
    await conn.query("SELECT RELEASE_LOCK(?)", [LOCK_NAME]);
    await conn.end();
  }
}

// mariadb's createConnection() takes a config object, not a connection
// string directly — parse the same DATABASE_URL format used everywhere
// else in this project (see src/lib/prisma.ts / scripts/backup-db.ts).
function parseUrlForMariadb(databaseUrl) {
  const url = new URL(databaseUrl);
  const options = {
    host: url.hostname,
    port: url.port ? Number(url.port) : 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ""),
  };
  // Matches src/lib/prisma.ts's withAllowPublicKeyRetrieval(): default this
  // on regardless of whether DATABASE_URL happens to include it. MySQL's
  // caching_sha2_password auth (default on ParsPack's 8+/9+) needs it over
  // a non-TLS connection, or auth fails with an RSA key-exchange error
  // before any query — including the very first "does the DB exist" query.
  if (url.searchParams.get("allowPublicKeyRetrieval") !== "false") {
    options.allowPublicKeyRetrieval = true;
  }
  if (url.searchParams.get("ssl") === "true") {
    options.ssl = {};
  }
  const connectTimeout = url.searchParams.get("connect_timeout");
  if (connectTimeout) {
    options.connectTimeout = Number(connectTimeout) * 1000;
  }
  return options;
}

main().catch((err) => {
  console.error("manual-migrate failed:", err);
  process.exit(1);
});
