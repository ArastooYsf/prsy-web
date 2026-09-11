import { Headset } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import { prisma } from "@/lib/prisma";
import { TICKET_STATUS } from "@/lib/status-labels";
import { dateRangeWhere, param, sortParams, type ListSearchParams } from "@/lib/list-query";
import ListFilterBar from "@/components/admin/ListFilterBar";
import SortableHeader from "@/components/admin/SortableHeader";
import { AdminTableScroll, AdminTh } from "@/components/admin/AdminTable";
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
        <EmptyState icon={<Headset />} title="تیکتی با این مشخصات یافت نشد." />
      ) : (
        <>
          {/* Mobile/tablet: card list */}
          <div className="space-y-3 md:hidden">
            {tickets.map((ticket) => (
              <TicketCardMobile key={ticket.id} ticket={ticket} />
            ))}
          </div>

          {/* Desktop/tablet: table */}
          <AdminTableScroll>
            <table className="w-full text-sm">
              <thead className="text-foreground/60">
                <tr>
                  <AdminTh corner="start">
                    <SortableHeader field="subject" label="موضوع" />
                  </AdminTh>
                  <AdminTh>
                    <SortableHeader field="user" label="مشتری" />
                  </AdminTh>
                  <AdminTh>
                    <SortableHeader field="status" label="وضعیت" />
                  </AdminTh>
                  <AdminTh>
                    <SortableHeader field="updatedAt" label="آخرین بروزرسانی" />
                  </AdminTh>
                  <AdminTh corner="end" />
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <TicketRowDesktop key={ticket.id} ticket={ticket} />
                ))}
              </tbody>
            </table>
          </AdminTableScroll>
        </>
      )}
    </div>
  );
}
