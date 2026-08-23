import Link from "next/link";
import { Eye, Pencil } from "lucide-react";
import Skeleton from "react-loading-skeleton";
import { CONTRACT_STATUS } from "@/lib/status-labels";
import { formatJalali } from "@/lib/jalali";
import DeleteEntityButton from "@/components/admin/DeleteEntityButton";
import type { Prisma } from "@/generated/prisma/client";

export type ContractWithUser = Prisma.ContractGetPayload<{ include: { user: true } }>;

type Props = { contract: ContractWithUser | null; isAdmin: boolean };

export function ContractCardMobile({ contract, isAdmin }: Props) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-start justify-between gap-3">
        {contract ? <p className="font-medium">{contract.title}</p> : <Skeleton width="60%" height={15} />}
        {contract ? (
          <span
            className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${CONTRACT_STATUS[contract.status].className}`}
          >
            {CONTRACT_STATUS[contract.status].label}
          </span>
        ) : (
          <Skeleton width={62} height={23} borderRadius={9999} containerClassName="shrink-0" />
        )}
      </div>
      <dl className="mt-3 space-y-1.5 text-xs">
        <div className="flex items-center justify-between gap-2">
          <dt className="text-foreground/40">مشتری</dt>
          <dd className="text-foreground/70">
            {contract ? contract.user.name || contract.user.email : <Skeleton width={88} height={11} />}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt className="text-foreground/40">نوع</dt>
          <dd className="text-foreground/70">{contract ? contract.type : <Skeleton width={64} height={11} />}</dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt className="text-foreground/40">شروع</dt>
          <dd dir="ltr" className="text-foreground/70">
            {contract ? formatJalali(contract.startDate) : <Skeleton width={64} height={11} />}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt className="text-foreground/40">پایان</dt>
          <dd dir="ltr" className="text-foreground/70">
            {contract ? formatJalali(contract.endDate) : <Skeleton width={64} height={11} />}
          </dd>
        </div>
      </dl>
      <div className="mt-3 flex items-center justify-end gap-2 border-t border-white/5 pt-3">
        {contract ? (
          <Link
            href={`/account/admin/contracts/${contract.id}`}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-white/10 px-3.5 text-xs font-medium text-foreground/70 transition-colors hover:border-accent-500/40 hover:text-accent-400"
          >
            {isAdmin ? <Pencil className="size-3.5" /> : <Eye className="size-3.5" />}
            {isAdmin ? "ویرایش" : "مشاهده"}
          </Link>
        ) : (
          <Skeleton width={78} height={40} borderRadius={9999} />
        )}
        {isAdmin && (contract ? (
          <DeleteEntityButton
            endpoint={`/api/admin/contracts/${contract.id}`}
            title="حذف قرارداد"
            message={`مطمئنید می‌خواهید قرارداد «${contract.title}» را حذف کنید؟`}
          />
        ) : (
          <Skeleton width={40} height={40} borderRadius={9999} />
        ))}
      </div>
    </div>
  );
}

export function ContractRowDesktop({ contract, isAdmin }: Props) {
  return (
    <tr className="border-t border-white/10">
      <td className="px-4 py-3 font-medium">{contract ? contract.title : <Skeleton width="80%" height={13} />}</td>
      <td className="px-4 py-3 text-foreground/70">
        {contract ? contract.user.name || contract.user.email : <Skeleton width={100} height={13} />}
      </td>
      <td className="px-4 py-3 text-foreground/70">{contract ? contract.type : <Skeleton width={70} height={13} />}</td>
      <td className="px-4 py-3">
        {contract ? (
          <span
            className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${CONTRACT_STATUS[contract.status].className}`}
          >
            {CONTRACT_STATUS[contract.status].label}
          </span>
        ) : (
          <Skeleton width={62} height={22} borderRadius={9999} />
        )}
      </td>
      <td dir="ltr" className="px-4 py-3 text-right text-xs text-foreground/50">
        {contract ? formatJalali(contract.startDate) : <Skeleton width={70} height={12} />}
      </td>
      <td dir="ltr" className="px-4 py-3 text-right text-xs text-foreground/50">
        {contract ? formatJalali(contract.endDate) : <Skeleton width={70} height={12} />}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-2">
          {contract ? (
            <Link
              href={`/account/admin/contracts/${contract.id}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-foreground/70 transition-colors hover:border-accent-500/40 hover:text-accent-400"
            >
              {isAdmin ? <Pencil className="size-3.5" /> : <Eye className="size-3.5" />}
              {isAdmin ? "ویرایش" : "مشاهده"}
            </Link>
          ) : (
            <Skeleton width={78} height={32} borderRadius={9999} />
          )}
          {isAdmin && (contract ? (
            <DeleteEntityButton
              endpoint={`/api/admin/contracts/${contract.id}`}
              title="حذف قرارداد"
              message={`مطمئنید می‌خواهید قرارداد «${contract.title}» را حذف کنید؟`}
            />
          ) : (
            <Skeleton width={32} height={32} borderRadius={9999} />
          ))}
        </div>
      </td>
    </tr>
  );
}
