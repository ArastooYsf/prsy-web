import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AccountShell from "@/components/account/AccountShell";

export const metadata: Metadata = {
  title: "حساب کاربری",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    const pathname = headers().get("x-pathname") ?? "/account";
    redirect(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
  }

  return (
    <AccountShell role={session.user.role} userLabel={session.user.name || session.user.email || ""}>
      {children}
    </AccountShell>
  );
}
