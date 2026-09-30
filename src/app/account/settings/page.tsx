import { getServerSession } from "next-auth";
import { Bell, Settings, ShieldCheck } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PasswordForm from "@/components/account/PasswordForm";
import TwoFactorSetup from "@/components/account/TwoFactorSetup";
import NotificationSettings from "@/components/account/NotificationSettings";

export const dynamic = "force-dynamic";

// Account-level settings only (security, notifications) — personal/display
// info (name, photo, contact info, address) lives on /account/profile, kept
// as a separate page/sidebar link rather than a section here. An earlier
// version merged both onto this one page, which left "پروفایل" and
// "تنظیمات" as two sidebar links landing on the identical content; split
// back apart so each section matches the nav item that leads to it.
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
