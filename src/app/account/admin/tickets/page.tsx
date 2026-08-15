import Link from "next/link";
import { Headset } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { TICKET_STATUS } from "@/lib/status-labels";
import { formatJalali } from "@/lib/jalali";
import { dateRangeWhere, param, sortParams, type ListSearchParams } from "@/lib/list-query";
import DeleteEntityButton from "@/components/admin/DeleteEntityButton";
import ListFilterBar from "@/components/admin/ListFilterBar";
import SortableHeader from "@/components/admin/SortableHeader";
import type { Prisma } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

const SORT_FIELDS = ["subject", "user", "status", "createdAt", "updatedAt"] as const;

function buildOrderBy(field: (typeof SORT_FIELDS)[number], dir: "asc" | "desc"): Prisma.TicketOrderByWithRelationInput {
  if (field === "user") return { user: { name: dir } };
  return { [field]: dir };
}

export default async function AdminTicketsPage({ searchParams }: { searchParams: ListSearchParams }) {
  const status = param(searchParams, "status");
  const q = param(searchParams, "q");
  const createdRange = dateRangeWhere(searchParams, "from", "to");
  const { field, dir } = sortParams(searchParams, SORT_FIELDS, "updatedAt");

  const tickets = await prisma.ticket.findMany({
    where: {
      deletedAt: null,
      ...(status ? { status: status as never } : {}),
      ...(createdRange ? { createdAt: createdRange } : {}),
      ...(q
        ? {
            OR: [
              { subject: { contains: q } },
              { user: { name: { contains: q } } },
              { user: { email: { contains: q } } },
            ],
          }
        : {}),
    },
    orderBy: buildOrderBy(field, dir),
    include: { user: true },
  });

  return (
    <div>
      <h2 className="mb-6 flex items-center gap-2 text-lg font-bold">
        <Headset className="size-5 text-accent-400" />
        تیکت‌های پشتیبانی
      </h2>

      <ListFilterBar
        searchPlaceholder="جست‌وجوی موضوع یا مشتری..."
        selects={[
          {
            key: "status",
            label: "وضعیت",
            options: Object.entries(TICKET_STATUS).map(([value, s]) => ({ value, label: s.label })),
          },
        ]}
        dateRanges={[{ fromKey: "from", toKey: "to", label: "تاریخ ایجاد" }]}
      />

      {tickets.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-sm text-foreground/60">
          تیکتی با این مشخصات یافت نشد.
        </p>
      ) : (
        <>
          {/* Mobile/tablet: card list */}
          <div className="space-y-3 md:hidden">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between gap-3">
                  <Link
                    href={`/account/admin/tickets/${ticket.id}`}
                    className="inline-flex min-h-11 items-center py-1 font-medium hover:text-accent-400"
                  >
                    {ticket.subject}
                  </Link>
                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${TICKET_STATUS[ticket.status].className}`}
                  >
                    {TICKET_STATUS[ticket.status].label}
                  </span>
                </div>
                <dl className="mt-3 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-foreground/40">مشتری</dt>
                    <dd className="text-foreground/70">{ticket.user.name || ticket.user.email}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-foreground/40">آخرین بروزرسانی</dt>
                    <dd dir="ltr" className="text-foreground/70">
                      {formatJalali(ticket.updatedAt)}
                    </dd>
                  </div>
                </dl>
                <div className="mt-3 flex justify-end border-t border-white/5 pt-3">
                  <DeleteEntityButton
                    endpoint={`/api/admin/tickets/${ticket.id}`}
                    title="حذف تیکت"
                    message={`مطمئنید می‌خواهید تیکت «${ticket.subject}» را حذف کنید؟`}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Desktop/tablet: table */}
          <div className="hidden rounded-2xl border border-white/10 md:block">
            <table className="w-full text-sm">
              <thead className="text-foreground/60">
                <tr>
                  <th className="sticky top-14 z-10 rounded-tr-2xl bg-background px-4 py-3 text-right font-medium lg:top-12">
                    <SortableHeader field="subject" label="موضوع" />
                  </th>
                  <th className="sticky top-14 z-10 bg-background px-4 py-3 text-right font-medium lg:top-12">
                    <SortableHeader field="user" label="مشتری" />
                  </th>
                  <th className="sticky top-14 z-10 bg-background px-4 py-3 text-right font-medium lg:top-12">
                    <SortableHeader field="status" label="وضعیت" />
                  </th>
                  <th className="sticky top-14 z-10 bg-background px-4 py-3 text-right font-medium lg:top-12">
                    <SortableHeader field="updatedAt" label="آخرین بروزرسانی" />
                  </th>
                  <th className="sticky top-14 z-10 rounded-tl-2xl bg-background px-4 py-3 text-right font-medium lg:top-12" />
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="border-t border-white/10">
                    <td className="px-4 py-3 font-medium">
                      <Link href={`/account/admin/tickets/${ticket.id}`} className="hover:text-accent-400">
                        {ticket.subject}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-foreground/70">{ticket.user.name || ticket.user.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${TICKET_STATUS[ticket.status].className}`}
                      >
                        {TICKET_STATUS[ticket.status].label}
                      </span>
                    </td>
                    <td dir="ltr" className="px-4 py-3 text-right text-foreground/60">
                      {formatJalali(ticket.updatedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <DeleteEntityButton
                        endpoint={`/api/admin/tickets/${ticket.id}`}
                        title="حذف تیکت"
                        message={`مطمئنید می‌خواهید تیکت «${ticket.subject}» را حذف کنید؟`}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
