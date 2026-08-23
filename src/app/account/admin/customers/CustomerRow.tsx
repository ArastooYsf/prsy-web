import Skeleton from "react-loading-skeleton";
import { CUSTOMER_TYPE, APPROVAL_STATUS } from "@/lib/status-labels";
import { formatJalali } from "@/lib/jalali";
import DeleteEntityButton from "@/components/admin/DeleteEntityButton";
import type { Prisma } from "@/generated/prisma/client";

export type Customer = Prisma.UserGetPayload<object>;

const ROLE_LABEL: Record<string, string> = { CUSTOMER: "مشتری", SUPPORT: "پشتیبان", ADMIN: "مدیر" };

type Props = { customer: Customer | null; isAdmin: boolean };

export function CustomerCardMobile({ customer, isAdmin }: Props) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="min-w-0">
        {customer ? (
          <>
            <p className="font-medium">{customer.name || "—"}</p>
            {customer.companyName && <p className="text-xs text-foreground/40">{customer.companyName}</p>}
            <p dir="ltr" className="mt-0.5 truncate text-xs text-foreground/60">
              {customer.email}
            </p>
          </>
        ) : (
          <>
            <Skeleton width="50%" height={15} />
            <Skeleton width="65%" height={11} containerClassName="block mt-1.5" />
          </>
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {customer ? (
          <>
            {customer.role !== "CUSTOMER" && (
              <span className="rounded-full border border-brand-400/30 bg-brand-400/10 px-2.5 py-1 text-[11px] font-semibold text-brand-300">
                {ROLE_LABEL[customer.role]}
              </span>
            )}
            <span
              className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${CUSTOMER_TYPE[customer.customerType].className}`}
            >
              {CUSTOMER_TYPE[customer.customerType].label}
            </span>
            <span
              className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${APPROVAL_STATUS[customer.approvalStatus].className}`}
            >
              {APPROVAL_STATUS[customer.approvalStatus].label}
            </span>
          </>
        ) : (
          <>
            <Skeleton width={58} height={22} borderRadius={9999} />
            <Skeleton width={70} height={22} borderRadius={9999} />
          </>
        )}
      </div>
      <dl className="mt-3 flex items-center justify-between gap-2 text-xs">
        <dt className="text-foreground/40">تاریخ عضویت</dt>
        <dd dir="ltr" className="text-foreground/70">
          {customer ? formatJalali(customer.createdAt.toISOString()) : <Skeleton width={78} height={11} />}
        </dd>
      </dl>
      {isAdmin && (
        <div className="mt-3 flex justify-end border-t border-white/5 pt-3">
          {customer ? (
            <DeleteEntityButton
              endpoint={`/api/admin/customers/${customer.id}`}
              title="حذف مشتری"
              message={`مطمئنید می‌خواهید مشتری «${customer.name || customer.email}» را حذف کنید؟ ورود این حساب دیگر امکان‌پذیر نخواهد بود.`}
            />
          ) : (
            <Skeleton width={68} height={40} borderRadius={9999} />
          )}
        </div>
      )}
    </div>
  );
}

export function CustomerRowDesktop({ customer, isAdmin }: Props) {
  return (
    <tr className="border-t border-white/10">
      <td className="px-4 py-3 font-medium">
        {customer ? (
          <>
            {customer.name || "—"}
            {customer.role !== "CUSTOMER" && (
              <span className="mr-1.5 text-xs text-brand-300">[{ROLE_LABEL[customer.role]}]</span>
            )}
            {customer.companyName && <span className="mr-1.5 text-xs text-foreground/40">({customer.companyName})</span>}
          </>
        ) : (
          <Skeleton width="70%" height={13} />
        )}
      </td>
      <td dir="ltr" className="px-4 py-3 text-right text-foreground/70">
        {customer ? customer.email : <Skeleton width={150} height={13} />}
      </td>
      <td className="px-4 py-3">
        {customer ? (
          <span
            className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${CUSTOMER_TYPE[customer.customerType].className}`}
          >
            {CUSTOMER_TYPE[customer.customerType].label}
          </span>
        ) : (
          <Skeleton width={64} height={22} borderRadius={9999} />
        )}
      </td>
      <td className="px-4 py-3">
        {customer ? (
          <span
            className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${APPROVAL_STATUS[customer.approvalStatus].className}`}
          >
            {APPROVAL_STATUS[customer.approvalStatus].label}
          </span>
        ) : (
          <Skeleton width={64} height={22} borderRadius={9999} />
        )}
      </td>
      <td dir="ltr" className="px-4 py-3 text-right text-xs text-foreground/50">
        {customer ? formatJalali(customer.createdAt.toISOString()) : <Skeleton width={78} height={12} />}
      </td>
      <td className="px-4 py-3">
        {isAdmin && (customer ? (
          <DeleteEntityButton
            endpoint={`/api/admin/customers/${customer.id}`}
            title="حذف مشتری"
            message={`مطمئنید می‌خواهید مشتری «${customer.name || customer.email}» را حذف کنید؟ ورود این حساب دیگر امکان‌پذیر نخواهد بود.`}
          />
        ) : (
          <Skeleton width={68} height={40} borderRadius={9999} />
        ))}
      </td>
    </tr>
  );
}
