import Link from "next/link";
import { Eye, Pencil } from "lucide-react";
import Skeleton from "react-loading-skeleton";
import { ORDER_STATUS } from "@/lib/status-labels";
import { formatJalali } from "@/lib/jalali";
import { formatNumber } from "@/lib/format-number";
import DeleteEntityButton from "@/components/admin/DeleteEntityButton";
import type { Prisma } from "@/generated/prisma/client";

export type OrderWithItems = Prisma.OrderGetPayload<{ include: { user: true; items: true } }>;

type Props = { order: OrderWithItems | null; isAdmin: boolean };

export function OrderCardMobile({ order, isAdmin }: Props) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-start justify-between gap-3">
        {order ? (
          <p dir="ltr" className="text-right font-medium">
            {order.orderNumber}
          </p>
        ) : (
          <Skeleton width={100} height={15} />
        )}
        {order ? (
          <span
            className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${ORDER_STATUS[order.status].className}`}
          >
            {ORDER_STATUS[order.status].label}
          </span>
        ) : (
          <Skeleton width={62} height={23} borderRadius={9999} containerClassName="shrink-0" />
        )}
      </div>
      <dl className="mt-3 space-y-1.5 text-xs">
        <div className="flex items-center justify-between gap-2">
          <dt className="text-foreground/40">مشتری</dt>
          <dd className="text-foreground/70">{order ? order.user.name || order.user.email : <Skeleton width={88} height={11} />}</dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt className="text-foreground/40">اقلام</dt>
          <dd className="text-foreground/70">
            {order ? `${formatNumber(order.items.length)} قلم` : <Skeleton width={54} height={11} />}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt className="text-foreground/40">تاریخ ثبت</dt>
          <dd dir="ltr" className="text-foreground/70">
            {order ? formatJalali(order.createdAt) : <Skeleton width={70} height={11} />}
          </dd>
        </div>
      </dl>
      <div className="mt-3 flex items-center justify-end gap-2 border-t border-white/5 pt-3">
        {order ? (
          <Link
            href={`/account/admin/orders/${order.id}`}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-white/10 px-3.5 text-xs font-medium text-foreground/70 transition-colors hover:border-accent-500/40 hover:text-accent-400"
          >
            {isAdmin ? <Pencil className="size-3.5" /> : <Eye className="size-3.5" />}
            {isAdmin ? "ویرایش" : "مشاهده"}
          </Link>
        ) : (
          <Skeleton width={78} height={40} borderRadius={9999} />
        )}
        {isAdmin && (order ? (
          <DeleteEntityButton
            endpoint={`/api/admin/orders/${order.id}`}
            title="حذف سفارش"
            message={`مطمئنید می‌خواهید سفارش «${order.orderNumber}» را حذف کنید؟`}
          />
        ) : null)}
      </div>
    </div>
  );
}

export function OrderRowDesktop({ order, isAdmin }: Props) {
  return (
    <tr className="border-t border-white/10">
      <td dir="ltr" className="px-4 py-3 text-right font-medium">
        {order ? order.orderNumber : <Skeleton width={100} height={13} />}
      </td>
      <td className="px-4 py-3 text-foreground/70">{order ? order.user.name || order.user.email : <Skeleton width={100} height={13} />}</td>
      <td className="px-4 py-3 text-foreground/70">
        {order ? `${formatNumber(order.items.length)} قلم` : <Skeleton width={50} height={13} />}
      </td>
      <td className="px-4 py-3">
        {order ? (
          <span
            className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${ORDER_STATUS[order.status].className}`}
          >
            {ORDER_STATUS[order.status].label}
          </span>
        ) : (
          <Skeleton width={62} height={22} borderRadius={9999} />
        )}
      </td>
      <td dir="ltr" className="px-4 py-3 text-right text-xs text-foreground/50">
        {order ? formatJalali(order.createdAt) : <Skeleton width={70} height={12} />}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-2">
          {order ? (
            <Link
              href={`/account/admin/orders/${order.id}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-foreground/70 transition-colors hover:border-accent-500/40 hover:text-accent-400"
            >
              {isAdmin ? <Pencil className="size-3.5" /> : <Eye className="size-3.5" />}
              {isAdmin ? "ویرایش" : "مشاهده"}
            </Link>
          ) : (
            <Skeleton width={78} height={32} borderRadius={9999} />
          )}
          {isAdmin && (order ? (
            <DeleteEntityButton
              endpoint={`/api/admin/orders/${order.id}`}
              title="حذف سفارش"
              message={`مطمئنید می‌خواهید سفارش «${order.orderNumber}» را حذف کنید؟`}
            />
          ) : null)}
        </div>
      </td>
    </tr>
  );
}
