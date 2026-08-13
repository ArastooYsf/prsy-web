import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ORDER_STATUS } from "@/lib/status-labels";
import OrderProgress from "@/components/OrderProgress";

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
        <span
          className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${ORDER_STATUS[order.status].className}`}
        >
          {ORDER_STATUS[order.status].label}
        </span>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
        <OrderProgress status={order.status} />
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
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
