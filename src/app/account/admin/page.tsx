import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import UploadWidget from "@/components/admin/UploadWidget";

async function getAdminStats() {
  try {
    const [posts, contentEntries, media] = await Promise.all([
      prisma.blogPost.count(),
      prisma.siteContent.count(),
      prisma.mediaAsset.count(),
    ]);
    return { posts, contentEntries, media, error: null as string | null };
  } catch {
    return {
      posts: 0,
      contentEntries: 0,
      media: 0,
      error: "اتصال به دیتابیس برقرار نیست. تنظیمات DATABASE_URL را بررسی کنید.",
    };
  }
}

async function getSupportStats() {
  const [openTickets, activeContracts, activeOrders] = await Promise.all([
    prisma.ticket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    prisma.contract.count({ where: { status: "ACTIVE" } }),
    prisma.order.count({ where: { status: { in: ["PENDING", "PROCESSING", "SHIPPED"] } } }),
  ]);
  return { openTickets, activeContracts, activeOrders };
}

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);

  if (session!.user.role !== "ADMIN") {
    const stats = await getSupportStats();
    const cards = [
      { label: "تیکت‌های باز", value: stats.openTickets },
      { label: "قراردادهای فعال", value: stats.activeContracts },
      { label: "سفارش‌های در جریان", value: stats.activeOrders },
    ];

    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-sm text-foreground/60">{card.label}</p>
            <p className="mt-2 text-3xl font-black">{card.value}</p>
          </div>
        ))}
      </div>
    );
  }

  const stats = await getAdminStats();

  const cards = [
    { label: "پست‌های وبلاگ", value: stats.posts },
    { label: "محتوای سایت", value: stats.contentEntries },
    { label: "فایل‌های آپلودشده", value: stats.media },
  ];

  return (
    <div className="space-y-8">
      {stats.error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
          {stats.error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-sm text-foreground/60">{card.label}</p>
            <p className="mt-2 text-3xl font-black">{card.value}</p>
          </div>
        ))}
      </div>

      <UploadWidget />
    </div>
  );
}
