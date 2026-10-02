import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCompanyProfile } from "@/lib/documents/company";
import CourierOrderCard from "@/components/courier/CourierOrderCard";

export const dynamic = "force-dynamic";

export default async function CourierOrdersPage() {
  const session = await getServerSession(authOptions);

  const [orders, sender] = await Promise.all([
    prisma.order.findMany({
      where: { courierId: session!.user.id, status: "SHIPPED", deletedAt: null },
      include: { items: true, user: { select: { name: true, phone: true } } },
      orderBy: { updatedAt: "desc" },
    }),
    getCompanyProfile(),
  ]);

  return (
    <div>
      <h2 className="mb-6 text-lg font-bold">سفارش‌های تحویلی</h2>

      {orders.length === 0 ? (
        <p className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-6 text-center text-sm text-foreground/50">
          در حال حاضر سفارشی برای تحویل به شما اختصاص داده نشده است.
        </p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <CourierOrderCard
              key={order.id}
              sender={{ name: sender.name, phone: sender.phone }}
              order={{
                id: order.id,
                orderNumber: order.orderNumber,
                itemCount: order.items.length,
                customerName: order.user.name,
                customerPhone: order.user.phone,
                recipientAddress: order.recipientAddress,
                recipientPostalCode: order.recipientPostalCode,
                recipientLat: order.recipientLat,
                recipientLng: order.recipientLng,
                courierLocationUpdatedAt: order.courierLocationUpdatedAt?.toISOString() ?? null,
                deliveryStage: order.deliveryStage,
                deliveryCodeVerifiedAt: order.deliveryCodeVerifiedAt?.toISOString() ?? null,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
