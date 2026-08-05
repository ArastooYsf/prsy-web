import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ORDER_STATUS } from "@/lib/status-labels";
import OrderProgress from "@/components/OrderProgress";
import OrderForm from "@/components/admin/OrderForm";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const isAdmin = session!.user.role === "ADMIN";

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { user: true, items: true },
  });

  if (!order) {
    notFound();
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-xl space-y-6">
        <div className="flex items-center justify-between">
          <h2 dir="ltr" className="text-lg font-bold">
            {order.orderNumber}
          </h2>
          <span
            className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${ORDER_STATUS[order.status].className}`}
          >
            {ORDER_STATUS[order.status].label}
          </span>
        </div>
        <p className="text-sm text-foreground/70">مشتری: {order.user.name || order.user.email}</p>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <OrderProgress status={order.status} />
        </div>
        <div className="overflow-hidden rounded-2xl border border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.03] text-foreground/60">
              <tr>
                <th className="px-4 py-3 text-right font-medium">نام محصول</th>
                <th className="px-4 py-3 text-right font-medium">تعداد</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id} className="border-t border-white/10">
                  <td className="px-4 py-3 font-medium">{item.productName}</td>
                  <td className="px-4 py-3 text-foreground/70">{item.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  const customers = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h2 className="mb-6 text-lg font-bold">ویرایش سفارش</h2>
      <div className="mx-auto max-w-xl">
        <OrderForm
          mode="edit"
          customers={customers.map((c) => ({ id: c.id, label: c.name ? `${c.name} (${c.email})` : c.email }))}
          order={{
            id: order.id,
            userId: order.userId,
            orderNumber: order.orderNumber,
            status: order.status,
            items: order.items.map((i) => ({ productName: i.productName, quantity: i.quantity })),
          }}
        />
      </div>
    </div>
  );
}
