import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ProfileForm from "@/components/account/ProfileForm";
import PasswordForm from "@/components/account/PasswordForm";

export const dynamic = "force-dynamic";

export default async function AccountProfilePage() {
  const session = await getServerSession(authOptions);
  const user = await prisma.user.findUniqueOrThrow({ where: { id: session!.user.id } });

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h2 className="text-lg font-bold">پروفایل کاربری</h2>
      <ProfileForm initialName={user.name ?? ""} initialPhone={user.phone ?? ""} initialEmail={user.email} />
      <PasswordForm />
    </div>
  );
}
