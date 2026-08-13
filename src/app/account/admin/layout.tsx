import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ToastProvider from "@/components/admin/ToastProvider";

export const metadata: Metadata = {
  title: "مدیریت سایت",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AccountAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // The parent /account layout already guarantees an authenticated session;
  // this nested layout only adds the stricter role gate for the management
  // section, mirroring the exact check the old /admin/layout.tsx had.
  if (session!.user.role !== "ADMIN" && session!.user.role !== "SUPPORT") {
    redirect("/forbidden");
  }

  return <ToastProvider>{children}</ToastProvider>;
}
