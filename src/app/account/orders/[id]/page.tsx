import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ORDER_STATUS } from "@/lib/status-labels";
import { formatNumber } from "@/lib/format-number";
import OrderProgress from "@/components/account/OrderProgress";
import StatusBadge from "@/components/ui/StatusBadge";
import OrderItemRemoveButton from "@/components/account/OrderItemRemoveButton";

export const dynamic = "force-dynamic";

export default async function AccountOrderDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  const order = await prisma.order.findFirst({
    where: { id: params.id, userId, deletedAt: null },
    include: { items: true },
  });

  if (!order) {
    notFound();
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 dir="ltr" className="text-lg font-bold">
          {order.orderNumber}
        </h2>
        <StatusBadge status={ORDER_STATUS[order.status]} />
      </div>

      <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-6 sm:p-8">
        <OrderProgress status={order.status} />
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-foreground/10">
        <table className="w-full min-w-[420px] text-sm">
          <thead className="bg-foreground/[0.03] text-foreground/60">
            <tr>
              <th className="px-4 py-3 text-right font-medium">نام محصول</th>
              <th className="px-4 py-3 text-right font-medium">تعداد</th>
              <th className="px-4 py-3 text-right font-medium">قیمت واحد</th>
              <th className="px-4 py-3 text-right font-medium">جمع</th>
              {order.status === "PENDING" && <th className="px-4 py-3 text-right font-medium" />}
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} className="border-t border-foreground/10">
                <td className="px-4 py-3 font-medium">{item.productName}</td>
                <td className="px-4 py-3 text-foreground/70">{formatNumber(item.quantity)}</td>
                <td dir="ltr" className="px-4 py-3 text-right text-foreground/70">
                  {item.price != null ? `${formatNumber(item.price)} تومان` : "—"}
                </td>
                <td dir="ltr" className="px-4 py-3 text-right font-medium">
                  {item.price != null ? `${formatNumber(item.price * item.quantity)} تومان` : "—"}
                </td>
                {order.status === "PENDING" && (
                  <td className="px-4 py-3 text-left">
                    <OrderItemRemoveButton orderId={order.id} itemId={item.id} itemLabel={item.productName} />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
