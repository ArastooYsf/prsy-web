import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const metadata: Metadata = {
  title: "سفارش‌های تحویلی",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AccountCourierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // The parent /account layout already guarantees an authenticated session;
  // this nested layout only adds the stricter role gate, mirroring
  // /account/admin/layout.tsx's pattern.
  if (session!.user.role !== "COURIER") {
    redirect("/forbidden");
  }

  return <>{children}</>;
}
