import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import SignOutButton from "@/components/SignOutButton";
import AccountNav from "@/components/account/AccountNav";

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
    <section className="container py-10 sm:py-14">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <p className="text-xs font-medium text-foreground/50">حساب کاربری</p>
          <h1 className="mt-1 text-xl font-black sm:text-2xl">
            خوش آمدید، <span className="text-gradient">{session.user.name || session.user.email}</span>
          </h1>
        </div>
        <SignOutButton callbackUrl="/" />
      </div>
      <AccountNav />
      {children}
    </section>
  );
}
