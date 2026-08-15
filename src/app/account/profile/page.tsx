import Link from "next/link";
import { getServerSession } from "next-auth";
import { FileText, MessageSquare, Package, User, type LucideIcon } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ProfileForm from "@/components/account/ProfileForm";
import PasswordForm from "@/components/account/PasswordForm";
import TwoFactorSetup from "@/components/account/TwoFactorSetup";
import NotificationSettingsPreview from "@/components/account/NotificationSettingsPreview";

export const dynamic = "force-dynamic";

export default async function AccountProfilePage() {
  const session = await getServerSession(authOptions);
  const user = await prisma.user.findUniqueOrThrow({ where: { id: session!.user.id } });
  const isCustomer = user.role === "CUSTOMER";

  let stats: { label: string; value: number; href: string; icon: LucideIcon }[] = [];
  if (isCustomer) {
    const [openTicketsCount, activeContractsCount, activeOrdersCount] = await Promise.all([
      prisma.ticket.count({ where: { userId: user.id, status: { in: ["OPEN", "IN_PROGRESS"] }, deletedAt: null } }),
      prisma.contract.count({ where: { userId: user.id, status: "ACTIVE", deletedAt: null } }),
      prisma.order.count({
        where: { userId: user.id, status: { in: ["PENDING", "PROCESSING", "SHIPPED"] }, deletedAt: null },
      }),
    ]);
    stats = [
      { label: "تیکت‌های باز", value: openTicketsCount, href: "/account/tickets", icon: MessageSquare },
      { label: "قراردادهای فعال", value: activeContractsCount, href: "/account/contracts", icon: FileText },
      { label: "سفارش‌های در جریان", value: activeOrdersCount, href: "/account/orders", icon: Package },
    ];
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <h2 className="flex items-center gap-2 text-lg font-bold">
        <User className="size-5 text-accent-400" />
        پروفایل کاربری
      </h2>

      {stats.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {stats.map((stat) => (
            <Link
              key={stat.label}
              href={stat.href}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-colors hover:border-accent-500/30"
            >
              <div className="flex items-center gap-2 text-foreground/60">
                <stat.icon className="size-4" />
                <p className="text-sm">{stat.label}</p>
              </div>
              <p className="mt-2 text-2xl font-black text-accent-400">{stat.value}</p>
            </Link>
          ))}
        </div>
      )}

      <ProfileForm
        role={user.role}
        customerType={user.customerType}
        initialName={user.name ?? ""}
        initialPhone={user.phone ?? ""}
        initialEmail={user.email}
        initialAlternatePhone={user.alternatePhone ?? ""}
        initialAddress={user.address ?? ""}
        initialAvatarUrl={user.avatarUrl ?? ""}
        initialCompanyName={user.companyName ?? ""}
        initialEconomicCode={user.economicCode ?? ""}
      />

      <PasswordForm />

      {user.role === "ADMIN" && <TwoFactorSetup initialEnabled={user.twoFactorEnabled} />}

      <NotificationSettingsPreview />
    </div>
  );
}
