import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import OrderForm from "@/components/admin/OrderForm";

export const metadata: Metadata = {
  title: "ثبت سفارش جدید",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function NewOrderPage() {
  const session = await getServerSession(authOptions);
  if (session!.user.role !== "ADMIN") {
    redirect("/admin/orders");
  }

  const customers = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h2 className="mb-6 text-lg font-bold">ثبت سفارش جدید</h2>
      <div className="mx-auto max-w-xl">
        <OrderForm
          mode="create"
          customers={customers.map((c) => ({ id: c.id, label: c.name ? `${c.name} (${c.email})` : c.email }))}
        />
      </div>
    </div>
  );
}
