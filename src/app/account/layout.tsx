import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AccountSidebar from "@/components/account/AccountSidebar";

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
    redirect("/login?callbackUrl=/account");
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden lg:flex-row">
      <AccountSidebar role={session.user.role} />
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <section className="container flex flex-1 flex-col py-6 sm:py-12">
          <div className="mb-8 border-b border-white/10 pb-6">
            <p className="text-xs font-medium text-foreground/50">حساب کاربری</p>
            <h1 className="mt-1 text-xl font-black sm:text-2xl">
              خوش آمدید، <span className="text-gradient">{session.user.name || session.user.email}</span>
            </h1>
          </div>
          <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        </section>
      </div>
    </div>
  );
}
