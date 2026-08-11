import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import SignOutButton from "@/components/SignOutButton";
import AdminNav from "@/components/admin/AdminNav";
import ToastProvider from "@/components/admin/ToastProvider";

export const metadata: Metadata = {
  title: "پنل مدیریت",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPPORT")) {
    redirect("/login?callbackUrl=/admin");
  }

  return (
    <ToastProvider>
      <section className="container py-10 sm:py-14">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <p className="text-xs font-medium text-foreground/50">پنل مدیریت</p>
            <h1 className="mt-1 text-xl font-black sm:text-2xl">
              خوش آمدید، <span className="text-gradient">{session.user.name || session.user.email}</span>
            </h1>
          </div>
          <SignOutButton callbackUrl="/login" />
        </div>
        <AdminNav role={session.user.role} />
        {children}
      </section>
    </ToastProvider>
  );
}
