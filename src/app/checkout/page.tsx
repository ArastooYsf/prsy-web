import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import CheckoutFlow from "@/components/checkout/CheckoutFlow";

export const metadata: Metadata = {
  title: "ثبت سفارش",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect(`/login?callbackUrl=${encodeURIComponent("/checkout")}`);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true },
  });

  return (
    <section className="container py-8 sm:py-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-8 text-2xl font-bold sm:text-3xl">ثبت سفارش</h1>
        <CheckoutFlow
          contact={{ name: user?.name ?? "", email: user?.email ?? "" }}
          isStaff={session.user.role === "ADMIN" || session.user.role === "SUPPORT"}
        />
      </div>
    </section>
  );
}
