import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import OrderForm from "@/components/admin/OrderForm";
import DeleteEntityButton from "@/components/admin/DeleteEntityButton";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  const order = await prisma.order.findFirst({
    where: { id: params.id, deletedAt: null },
    include: { user: true, items: true },
  });

  if (!order) {
    notFound();
  }

  const customers = await prisma.user.findMany({
    where: { role: "CUSTOMER", deletedAt: null },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-bold">ویرایش سفارش</h2>
        <DeleteEntityButton
          endpoint={`/api/admin/orders/${order.id}`}
          title="حذف سفارش"
          message={`مطمئنید می‌خواهید سفارش «${order.orderNumber}» را حذف کنید؟`}
          redirectTo="/account/admin/orders"
        />
      </div>
      <div className="mx-auto max-w-xl">
        <OrderForm
          mode="edit"
          customers={customers.map((c) => ({ id: c.id, label: c.name ? `${c.name} (${c.email})` : c.email }))}
          order={{
            id: order.id,
            userId: order.userId,
            orderNumber: order.orderNumber,
            status: order.status,
            items: order.items.map((i) => ({
              productId: i.productId,
              productName: i.productName,
              quantity: i.quantity,
              price: i.price ?? "",
            })),
          }}
        />
      </div>
    </div>
  );
}
