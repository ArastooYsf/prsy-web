import { config } from "dotenv";
import bcrypt from "bcryptjs";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient, Role } from "../src/generated/prisma/client";

config({ path: ".env" });
config({ path: ".env.local", override: true });

const adapter = new PrismaMariaDb(process.env.DATABASE_URL ?? "");
const prisma = new PrismaClient({ adapter });

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

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
  let support: Awaited<ReturnType<typeof prisma.user.upsert>> | null = null;

  if (supportEmail && supportPassword) {
    const supportPasswordHash = await bcrypt.hash(supportPassword, 12);

    support = await prisma.user.upsert({
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

  // Demo customer account + a realistic dataset (tickets/contracts/orders) so
  // the UI can be fully exercised after a fresh `prisma migrate reset`.
  const customerEmail = process.env.CUSTOMER_EMAIL;
  const customerPassword = process.env.CUSTOMER_PASSWORD;

  if (customerEmail && customerPassword) {
    const customerPasswordHash = await bcrypt.hash(customerPassword, 12);

    const customer = await prisma.user.upsert({
      where: { email: customerEmail },
      update: { password: customerPasswordHash, role: Role.CUSTOMER },
      create: {
        email: customerEmail,
        password: customerPasswordHash,
        role: Role.CUSTOMER,
        name: "رضا احمدی",
        phone: "09121234567",
        customerType: "INDIVIDUAL",
        approvalStatus: "APPROVED",
      },
    });

    console.log(`کاربر مشتری آماده شد: ${customer.email}`);

    const existingTicketCount = await prisma.ticket.count({ where: { userId: customer.id } });

    if (existingTicketCount === 0 && support) {
      // --- Tickets: one per status, each with a realistic reply thread ---
      const ticket1 = await prisma.ticket.create({
        data: {
          userId: customer.id,
          subject: "سوال درباره گارانتی ژنراتور خریداری‌شده",
          message:
            "سلام، حدود دو ماه پیش یک دستگاه دیزل ژنراتور ۲۵۰ کاوا از شما خریداری کردم. می‌خواستم بدونم مدت گارانتی دستگاه دقیقاً چند ماهه و آیا شامل قطعات داخلی موتور هم می‌شه یا فقط ژنراتور رو پوشش می‌ده؟",
          status: "OPEN",
        },
      });

      const ticket2 = await prisma.ticket.create({
        data: {
          userId: customer.id,
          subject: "درخواست راهنمایی برای نصب دینام شارژ",
          message:
            "با سلام، یک دینام شارژ برای دستگاه پرکینز خودم سفارش دادم ولی توی نصبش به مشکل خوردم. سیم‌کشی‌هاش با چیزی که قبلاً داشتم فرق داره. امکانش هست یه راهنمای نصب یا شماره تماس فنی بدید؟",
          status: "IN_PROGRESS",
        },
      });
      await prisma.ticketReply.create({
        data: {
          ticketId: ticket2.id,
          authorId: support.id,
          message:
            "سلام وقت بخیر، ممنون از پیامتون. لطفاً عکسی از پلاک مشخصات دستگاه و همچنین سیم‌کشی فعلی براتون ارسال کنید تا همکاران فنی بررسی کنن و راهنمایی دقیق‌تری خدمت‌تون ارائه بدیم.",
          createdAt: daysFromNow(-2),
        },
      });
      await prisma.ticketReply.create({
        data: {
          ticketId: ticket2.id,
          authorId: customer.id,
          message: "چشم، عکس‌ها رو تا فردا صبح ارسال می‌کنم. ممنون از پیگیریتون.",
          createdAt: daysFromNow(-1),
        },
      });

      const ticket3 = await prisma.ticket.create({
        data: {
          userId: customer.id,
          subject: "مشکل در روشن نشدن دستگاه بعد از سرویس دوره‌ای",
          message:
            "دستگاه رو هفته پیش بردیم برای سرویس دوره‌ای و باتری و فیلترها عوض شد. از دیروز دستگاه استارت نمی‌خوره و فقط یه تیک صدا می‌کنه. ممکنه مشکل از باتری جدید باشه؟",
          status: "ANSWERED",
        },
      });
      await prisma.ticketReply.create({
        data: {
          ticketId: ticket3.id,
          authorId: support.id,
          message:
            "سلام، با توجه به توضیحاتتون احتمال زیاد اتصال کابل باتری شل شده یا ارتباط بدنه قطع شده. لطفاً محکم بودن ترمینال‌های باتری رو چک کنید. اگه مشکل حل نشد یک تکنسین رو برای بازدید حضوری اعزام می‌کنیم.",
          createdAt: daysFromNow(-3),
        },
      });
      await prisma.ticketReply.create({
        data: {
          ticketId: ticket3.id,
          authorId: customer.id,
          message: "بررسی کردم، یکی از ترمینال‌ها شل بود. الان درست روشن شد. ممنون از راهنمایی‌تون.",
          createdAt: daysFromNow(-2),
        },
      });
      await prisma.ticketReply.create({
        data: {
          ticketId: ticket3.id,
          authorId: support.id,
          message: "خوشحالیم که مشکل حل شد. در صورت بروز هرگونه مشکل دیگه در خدمت‌تون هستیم.",
          createdAt: daysFromNow(-2),
        },
      });

      const ticket4 = await prisma.ticket.create({
        data: {
          userId: customer.id,
          subject: "پیگیری ارسال قطعه یدکی سفارش‌داده‌شده",
          message:
            "سلام، حدود یک هفته پیش یک ست فیلتر روغن و سوخت سفارش دادم ولی هنوز به دستم نرسیده. ممکنه وضعیت ارسال رو چک کنید؟",
          status: "CLOSED",
        },
      });
      await prisma.ticketReply.create({
        data: {
          ticketId: ticket4.id,
          authorId: support.id,
          message:
            "سلام، بررسی کردیم؛ سفارش شما دیروز توسط پست پیشتاز ارسال شده و کد رهگیری به شماره موبایل ثبت‌شده‌تون پیامک شده. معمولاً ۲ تا ۳ روز کاری زمان می‌بره تا برسه دستتون.",
          createdAt: daysFromNow(-6),
        },
      });
      await prisma.ticketReply.create({
        data: {
          ticketId: ticket4.id,
          authorId: customer.id,
          message: "بله الان پیامک رو دیدم، ممنون. سفارش رو تحویل گرفتم و مشکلی نداشت.",
          createdAt: daysFromNow(-5),
        },
      });

      console.log("۴ تیکت نمونه (با پاسخ‌های رفت‌وبرگشتی) ساخته شد.");

      // --- Contracts: one per representative status ---
      await prisma.contract.create({
        data: {
          userId: customer.id,
          title: "قرارداد نگهداری دوره‌ای ژنراتور ۲۵۰ کاوا",
          type: "نگهداری دوره‌ای",
          startDate: daysFromNow(-60),
          endDate: daysFromNow(305),
          status: "ACTIVE",
        },
      });
      await prisma.contract.create({
        data: {
          userId: customer.id,
          title: "قرارداد نصب و راه‌اندازی دیزل ژنراتور جدید",
          type: "نصب و راه‌اندازی",
          startDate: daysFromNow(14),
          endDate: daysFromNow(44),
          status: "PENDING_APPROVAL",
        },
      });
      await prisma.contract.create({
        data: {
          userId: customer.id,
          title: "قرارداد گارانتی موتور برق پرکینز",
          type: "گارانتی",
          startDate: daysFromNow(-420),
          endDate: daysFromNow(-60),
          status: "EXPIRED",
        },
      });

      console.log("۳ قرارداد نمونه ساخته شد.");

      // --- Orders: one per representative status, 1-2 items each ---
      await prisma.order.create({
        data: {
          orderNumber: "ORD-SEED-001",
          userId: customer.id,
          status: "PENDING",
          items: {
            create: [
              { productName: "فیلتر روغن موتور پرکینز 1104", quantity: 2 },
              { productName: "فیلتر سوخت دیزل", quantity: 1 },
            ],
          },
        },
      });
      await prisma.order.create({
        data: {
          orderNumber: "ORD-SEED-002",
          userId: customer.id,
          status: "PROCESSING",
          items: {
            create: [{ productName: "دینام شارژ 24 ولت", quantity: 1 }],
          },
        },
      });
      await prisma.order.create({
        data: {
          orderNumber: "ORD-SEED-003",
          userId: customer.id,
          status: "DELIVERED",
          items: {
            create: [
              { productName: "باتری خودرو 100 آمپر", quantity: 1 },
              { productName: "ست کامل سیم‌کشی استارت", quantity: 1 },
            ],
          },
        },
      });

      console.log("۳ سفارش نمونه ساخته شد.");
    } else if (existingTicketCount > 0) {
      console.log("این مشتری از قبل داده‌ی نمونه دارد — از ساخت مجدد صرف‌نظر شد.");
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
