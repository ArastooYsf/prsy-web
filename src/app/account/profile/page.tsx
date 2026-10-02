import { getServerSession } from "next-auth";
import { User } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ProfileForm from "@/components/account/ProfileForm";
import { debugSlowLoad } from "@/lib/debug-slow-load";

export const dynamic = "force-dynamic";

// Split back out from /account/settings — that page had absorbed this one's
// content (profile + password + 2FA) plus notifications, leaving "پروفایل"
// and "تنظیمات" as two sidebar links that landed on the identical page.
// This page owns personal/display info only (name, photo, contact info,
// address); account-level settings (security, notifications) stay on
// /account/settings.
export default async function AccountProfilePage() {
  await debugSlowLoad();

  const session = await getServerSession(authOptions);
  const user = await prisma.user.findUniqueOrThrow({ where: { id: session!.user.id } });

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <h2 className="flex items-center gap-2 text-lg font-bold">
        <User className="size-5 text-accent-400" />
        پروفایل
      </h2>

      <ProfileForm
        role={user.role}
        customerType={user.customerType}
        initialName={user.name ?? ""}
        initialEmail={user.email}
        initialEmailVerified={user.emailVerified !== null}
        initialPendingEmail={user.pendingEmail}
        initialAvatarUrl={user.avatarUrl ?? ""}
        initialCompanyName={user.companyName ?? ""}
        initialNationalId={user.nationalId ?? ""}
      />
    </div>
  );
}
