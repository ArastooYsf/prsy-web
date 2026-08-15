import { config } from "dotenv";

// Same reasoning as scripts/backup-db.ts: cron won't have Next.js's automatic
// .env.local loading, so this has to load it explicitly. This MUST happen
// before src/lib/prisma is loaded (its top-level PrismaMariaDb(...) reads
// process.env.DATABASE_URL at import time) — a static top-level `import`
// would get hoisted above these config() calls regardless of source order,
// so the prisma/events modules are loaded dynamically below instead.
config({ path: ".env" });
config({ path: ".env.local", override: true });

const REMINDER_WINDOW_DAYS = 7;

async function main() {
  const { prisma } = await import("../src/lib/prisma");
  const { notifyContractExpiry } = await import("../src/lib/notifications/events");

  try {
    const now = new Date();
    const windowEnd = new Date(now.getTime() + REMINDER_WINDOW_DAYS * 24 * 60 * 60 * 1000);

    const contracts = await prisma.contract.findMany({
      where: {
        deletedAt: null,
        status: { in: ["ACTIVE", "RENEWING"] },
        endDate: { gte: now, lte: windowEnd },
        expiryReminderSentAt: null,
      },
      include: { user: { select: { id: true, email: true, phone: true, name: true } } },
    });

    console.log(`Found ${contracts.length} contract(s) expiring within ${REMINDER_WINDOW_DAYS} days.`);

    for (const contract of contracts) {
      await notifyContractExpiry({
        contract: { id: contract.id, title: contract.title, endDate: contract.endDate },
        customer: contract.user,
      });
      await prisma.contract.update({ where: { id: contract.id }, data: { expiryReminderSentAt: now } });
      console.log(`Reminded "${contract.title}" (user ${contract.user.email}).`);
    }

    console.log("Done.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("notify-expiring-contracts failed:", err);
  process.exit(1);
});
