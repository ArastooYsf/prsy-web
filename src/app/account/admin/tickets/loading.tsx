import { Headset } from "lucide-react";
import { TICKET_STATUS } from "@/lib/status-labels";
import ListFilterBar from "@/components/admin/ListFilterBar";
import SortableHeader from "@/components/admin/SortableHeader";
import { AdminTableScroll, AdminTh } from "@/components/admin/AdminTable";
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
            {PLACEHOLDER_ROWS.map((_, i) => (
              <TicketRowDesktop key={i} ticket={null} />
            ))}
          </tbody>
        </table>
      </AdminTableScroll>
    </div>
  );
}
