import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import OrderForm from "@/components/admin/OrderForm";

export const metadata: Metadata = {
  title: "ثبت سفارش جدید",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function NewOrderPage() {
  const customers = await prisma.user.findMany({
    where: { role: "CUSTOMER", deletedAt: null },
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
