import { config } from "dotenv";
import bcrypt from "bcryptjs";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient, Role } from "../src/generated/prisma/client";

config({ path: ".env" });
config({ path: ".env.local", override: true });

const adapter = new PrismaMariaDb(process.env.DATABASE_URL ?? "");
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "ADMIN_EMAIL و ADMIN_PASSWORD باید در .env.local تنظیم شده باشند تا کاربر ادمین اولیه ساخته شود.",
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.user.upsert({
    where: { email },
    update: { password: passwordHash, role: Role.ADMIN },
    create: {
      email,
      password: passwordHash,
      role: Role.ADMIN,
      name: "مدیر سایت",
    },
  });

  console.log(`کاربر ادمین آماده شد: ${admin.email}`);

  const supportEmail = process.env.SUPPORT_EMAIL;
  const supportPassword = process.env.SUPPORT_PASSWORD;

  if (supportEmail && supportPassword) {
    const supportPasswordHash = await bcrypt.hash(supportPassword, 12);

    const support = await prisma.user.upsert({
      where: { email: supportEmail },
      update: { password: supportPasswordHash, role: Role.SUPPORT },
      create: {
        email: supportEmail,
        password: supportPasswordHash,
        role: Role.SUPPORT,
        name: "پشتیبانی",
      },
    });

    console.log(`کاربر پشتیبان آماده شد: ${support.email}`);
  }

  const defaultContractTypes = [
    "گارانتی",
    "نگهداری دوره‌ای",
    "نصب و راه‌اندازی",
    "تامین قطعات یدکی",
    "سرویس اضطراری",
  ];

  for (const label of defaultContractTypes) {
    await prisma.contractType.upsert({ where: { label }, update: {}, create: { label } });
  }

  console.log(`انواع قرارداد پیش‌فرض آماده شد (${defaultContractTypes.length} مورد).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
