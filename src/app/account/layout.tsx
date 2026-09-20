import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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

  // Fetched fresh from the DB rather than off the JWT — emailVerified isn't
  // (and shouldn't be) embedded in the session token, and this needs to be
  // accurate the moment verification completes, not after the token's own
  // refresh cycle.
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { emailVerified: true },
  });

  return (
    <AccountShell
      role={session.user.role}
      userLabel={session.user.name || session.user.email || ""}
      emailVerified={user?.emailVerified != null}
    >
      {children}
    </AccountShell>
  );
}
