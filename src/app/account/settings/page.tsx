import { getServerSession } from "next-auth";
import { Bell, Settings, ShieldCheck, User } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ProfileForm from "@/components/account/ProfileForm";
import PasswordForm from "@/components/account/PasswordForm";
import TwoFactorSetup from "@/components/account/TwoFactorSetup";
import NotificationSettings from "@/components/account/NotificationSettings";

export const dynamic = "force-dynamic";

// Every personal-account setting lives on this one page, in three clearly
// labeled sections — previously split across a "پروفایل" page (profile +
// password + 2FA) plus a disabled "به‌زودی" notification-settings preview,
// while the sidebar's own nav item was already labeled "تنظیمات" and simply
// pointed at the profile page. This page is that promise made real: one
// settings destination, matching the sidebar label, with every existing
// personal setting actually functional (see NotificationSettings for the
// previously-disabled notification toggles).
export default async function AccountSettingsPage() {
  const session = await getServerSession(authOptions);
  const user = await prisma.user.findUniqueOrThrow({ where: { id: session!.user.id } });

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <h2 className="flex items-center gap-2 text-lg font-bold">
        <Settings className="size-5 text-accent-400" />
        تنظیمات
      </h2>

      <section className="space-y-4">
        <h3 className="flex items-center gap-2 text-sm font-bold text-foreground/70">
          <User className="size-4 text-accent-400" />
          پروفایل
        </h3>
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
          initialNationalId={user.nationalId ?? ""}
        />
      </section>

      <section className="space-y-4">
        <h3 className="flex items-center gap-2 text-sm font-bold text-foreground/70">
          <ShieldCheck className="size-4 text-accent-400" />
          امنیت حساب
        </h3>
        <PasswordForm />
        {(user.role === "ADMIN" || user.role === "SUPPORT") && <TwoFactorSetup initialEnabled={user.twoFactorEnabled} />}
      </section>

      <section className="space-y-4">
        <h3 className="flex items-center gap-2 text-sm font-bold text-foreground/70">
          <Bell className="size-4 text-accent-400" />
          اعلان‌ها
        </h3>
        <NotificationSettings
          role={user.role}
          initial={{
            notifyEmail: user.notifyEmail,
            notifySms: user.notifySms,
            notifyTicketReply: user.notifyTicketReply,
            notifyOrderStatus: user.notifyOrderStatus,
            notifyContractExpiry: user.notifyContractExpiry,
            notifyStaffNewMessage: user.notifyStaffNewMessage,
          }}
        />
      </section>
    </div>
  );
}
