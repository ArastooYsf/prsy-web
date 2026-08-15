import { config } from "dotenv";
import { spawn } from "child_process";
import { createGzip } from "zlib";
import { createWriteStream } from "fs";
import { mkdir, readdir, stat, unlink } from "fs/promises";
import path from "path";
import { toJalaali } from "jalaali-js";

// Matches prisma.config.ts / prisma/seed.ts: cron won't have Next.js's
// automatic .env.local loading, so this has to load it explicitly.
config({ path: ".env" });
config({ path: ".env.local", override: true });

// Same persistent-storage principle as logs/ (see src/lib/logger.ts): lives
// outside /public (never served statically) and outside /src (wiped on
// every deploy), on the same local disk as everything else durable today.
const BACKUP_DIR = path.join(process.cwd(), "backups");

// Docker exec by default — mysqldump isn't installed on this host, only
// inside the local dev DB container (docker-compose.yml's `db` service).
// On a host where mysqldump IS available directly (e.g. a real cPanel box
// with SSH access), unset DB_DOCKER_CONTAINER and this falls back to
// calling mysqldump directly with the same credentials.
const DB_DOCKER_CONTAINER = process.env.DB_DOCKER_CONTAINER ?? "website-db-1";

const DAILY_KEEP = 7;
const WEEKLY_KEEP = 4;
const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

function parseDatabaseUrl(databaseUrl: string) {
  const url = new URL(databaseUrl);
  return {
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    host: url.hostname,
    port: url.port || "3306",
    database: url.pathname.replace(/^\//, ""),
  };
}

function backupFilename(now: Date): string {
  const { jy, jm, jd } = toJalaali(now.getFullYear(), now.getMonth() + 1, now.getDate());
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  return `yashar-${jy}-${String(jm).padStart(2, "0")}-${String(jd).padStart(2, "0")}-${hh}${mm}.sql.gz`;
}

// Runs `mysqldump` (via `docker exec` into the DB container, or directly if
// DB_DOCKER_CONTAINER is unset) and streams its stdout straight through gzip
// into the destination file — the dump never touches disk uncompressed.
function runDump(db: ReturnType<typeof parseDatabaseUrl>, destPath: string): Promise<void> {
  const dumpArgs = [`-u${db.user}`, `-p${db.password}`, "--single-transaction", "--quick", db.database];

  const child = DB_DOCKER_CONTAINER
    ? spawn("docker", ["exec", "-i", DB_DOCKER_CONTAINER, "mysqldump", ...dumpArgs])
    : spawn("mysqldump", ["-h", db.host, "-P", db.port, ...dumpArgs]);

  return new Promise((resolve, reject) => {
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    const gzip = createGzip();
    const out = createWriteStream(destPath);
    child.stdout.pipe(gzip).pipe(out);

    child.on("error", reject);
    out.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`mysqldump exited with code ${code}: ${stderr.trim()}`));
    });
  });
}

// Placeholder for shipping backups off-box (S3, Google Drive, etc). Wiring
// in a real destination later is just filling this in — nothing else in the
// script needs to change, it's already called right after each backup.
async function uploadBackup(filePath: string): Promise<void> {
  void filePath;
}

// 7 most recent backups kept unconditionally, then one backup per calendar
// week (the oldest in that week — an arbitrary but consistent pick) for the
// next 4 weeks back. Everything else is deleted. Backups don't need the
// logs/ system's lock mechanism — losing an old one just means restoring
// from a slightly less recent point, not losing an audit trail.
async function rotateBackups(): Promise<void> {
  const entries = await readdir(BACKUP_DIR);
  const files = await Promise.all(
    entries
      .filter((name) => name.endsWith(".sql.gz"))
      .map(async (name) => {
        const filePath = path.join(BACKUP_DIR, name);
        const s = await stat(filePath);
        return { name, filePath, mtime: s.mtime.getTime() };
      }),
  );
  files.sort((a, b) => b.mtime - a.mtime);

  const keep = new Set(files.slice(0, DAILY_KEEP).map((f) => f.name));
  const remaining = files.slice(DAILY_KEEP);

  const weekBuckets = new Map<number, (typeof files)[number]>();
  for (const file of remaining) {
    const bucket = Math.floor(file.mtime / MS_PER_WEEK);
    const existing = weekBuckets.get(bucket);
    if (!existing || file.mtime < existing.mtime) {
      weekBuckets.set(bucket, file);
    }
  }
  const weeklyBuckets = Array.from(weekBuckets.keys())
    .sort((a, b) => b - a)
    .slice(0, WEEKLY_KEEP);
  for (const bucket of weeklyBuckets) {
    keep.add(weekBuckets.get(bucket)!.name);
  }

  for (const file of files) {
    if (!keep.has(file.name)) {
      await unlink(file.filePath);
      console.log(`Rotated out old backup: ${file.name}`);
    }
  }
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  await mkdir(BACKUP_DIR, { recursive: true });

  const db = parseDatabaseUrl(databaseUrl);
  const filename = backupFilename(new Date());
  const destPath = path.join(BACKUP_DIR, filename);

  console.log(`Backing up database "${db.database}" to ${filename}...`);
  await runDump(db, destPath);
  console.log("Backup written.");

  await uploadBackup(destPath);
  await rotateBackups();
  console.log("Done.");
}

main().catch((err) => {
  console.error("Backup failed:", err);
  process.exit(1);
});
