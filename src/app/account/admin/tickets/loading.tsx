import { Headset } from "lucide-react";
import { TICKET_STATUS } from "@/lib/status-labels";
import ListFilterBar from "@/components/admin/ListFilterBar";
import SortableHeader from "@/components/admin/SortableHeader";
import { TicketCardMobile, TicketRowDesktop } from "./TicketRow";

const PLACEHOLDER_ROWS = Array.from({ length: 6 });

export default function Loading() {
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

      {/* Mobile/tablet: card list */}
      <div className="space-y-3 md:hidden">
        {PLACEHOLDER_ROWS.map((_, i) => (
          <TicketCardMobile key={i} ticket={null} />
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
            {PLACEHOLDER_ROWS.map((_, i) => (
              <TicketRowDesktop key={i} ticket={null} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
