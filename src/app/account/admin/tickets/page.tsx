import { Headset } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { TICKET_STATUS } from "@/lib/status-labels";
import { dateRangeWhere, param, sortParams, type ListSearchParams } from "@/lib/list-query";
import ListFilterBar from "@/components/admin/ListFilterBar";
import SortableHeader from "@/components/admin/SortableHeader";
import { TicketCardMobile, TicketRowDesktop } from "./TicketRow";
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
              <TicketCardMobile key={ticket.id} ticket={ticket} />
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
                  <TicketRowDesktop key={ticket.id} ticket={ticket} />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
