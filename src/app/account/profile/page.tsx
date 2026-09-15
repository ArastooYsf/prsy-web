import { getServerSession } from "next-auth";
import { User } from "lucide-react";
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

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <h2 className="flex items-center gap-2 text-lg font-bold">
        <User className="size-5 text-accent-400" />
        پروفایل کاربری
      </h2>

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

      {(user.role === "ADMIN" || user.role === "SUPPORT") && <TwoFactorSetup initialEnabled={user.twoFactorEnabled} />}

      <NotificationSettingsPreview />
    </div>
  );
}
