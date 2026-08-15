import { getServerSession } from "next-auth";
import { Headset, Image as ImageIcon, LayoutTemplate, Newspaper, PackageSearch, ScrollText, type LucideIcon } from "lucide-react";
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
    prisma.ticket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] }, deletedAt: null } }),
    prisma.contract.count({ where: { status: "ACTIVE", deletedAt: null } }),
    prisma.order.count({ where: { status: { in: ["PENDING", "PROCESSING", "SHIPPED"] }, deletedAt: null } }),
  ]);
  return { openTickets, activeContracts, activeOrders };
}

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);

  if (session!.user.role !== "ADMIN") {
    const stats = await getSupportStats();
    const cards: { label: string; value: number; icon: LucideIcon }[] = [
      { label: "تیکت‌های باز", value: stats.openTickets, icon: Headset },
      { label: "قراردادهای فعال", value: stats.activeContracts, icon: ScrollText },
      { label: "سفارش‌های در جریان", value: stats.activeOrders, icon: PackageSearch },
    ];

    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="flex items-center gap-2 text-foreground/60">
              <card.icon className="size-4" />
              <p className="text-sm">{card.label}</p>
            </div>
            <p className="mt-2 text-3xl font-black">{card.value}</p>
          </div>
        ))}
      </div>
    );
  }

  const stats = await getAdminStats();

  const cards: { label: string; value: number; icon: LucideIcon }[] = [
    { label: "پست‌های وبلاگ", value: stats.posts, icon: Newspaper },
    { label: "محتوای سایت", value: stats.contentEntries, icon: LayoutTemplate },
    { label: "فایل‌های آپلودشده", value: stats.media, icon: ImageIcon },
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
            <div className="flex items-center gap-2 text-foreground/60">
              <card.icon className="size-4" />
              <p className="text-sm">{card.label}</p>
            </div>
            <p className="mt-2 text-3xl font-black">{card.value}</p>
          </div>
        ))}
      </div>

      <UploadWidget />
    </div>
  );
}
