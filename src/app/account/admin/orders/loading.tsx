import { FileSpreadsheet, PackagePlus, PackageSearch } from "lucide-react";
import { ORDER_STATUS } from "@/lib/status-labels";
import ListFilterBar from "@/components/admin/ListFilterBar";
import SortableHeader from "@/components/admin/SortableHeader";
import { OrderCardMobile, OrderRowDesktop } from "./OrderRow";

const PLACEHOLDER_ROWS = Array.from({ length: 6 });

export default function Loading() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <PackageSearch className="size-5 text-accent-400" />
          سفارش‌ها
        </h2>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-foreground/10 px-4 text-sm font-medium text-foreground/70">
            <FileSpreadsheet className="size-4" />
            دانلود اکسل
          </span>
          <span className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-accent-500 px-5 text-sm font-semibold text-primary-foreground shadow-lg shadow-accent-500/25">
            <PackagePlus className="size-4" />
            ثبت سفارش جدید
          </span>
        </div>
      </div>

      <ListFilterBar
        searchPlaceholder="جست‌وجوی شماره سفارش یا مشتری..."
        selects={[
          {
            key: "status",
            label: "وضعیت",
            options: Object.entries(ORDER_STATUS).map(([value, s]) => ({ value, label: s.label })),
          },
        ]}
        dateRanges={[{ fromKey: "from", toKey: "to", label: "تاریخ ثبت" }]}
      />

      {/* Mobile/tablet: card list */}
      <div className="space-y-3 md:hidden">
        {PLACEHOLDER_ROWS.map((_, i) => (
          <OrderCardMobile key={i} order={null} isAdmin />
        ))}
      </div>

      {/* Desktop/tablet: table */}
      <div className="hidden rounded-2xl border border-foreground/10 md:block">
        <table className="w-full text-sm">
          <thead className="text-foreground/60">
            <tr>
              <th className="sticky top-14 z-10 rounded-tr-2xl bg-background px-4 py-3 text-right font-medium lg:top-12">
                <SortableHeader field="orderNumber" label="شماره سفارش" />
              </th>
              <th className="sticky top-14 z-10 bg-background px-4 py-3 text-right font-medium lg:top-12">
                <SortableHeader field="user" label="مشتری" />
              </th>
              <th className="sticky top-14 z-10 bg-background px-4 py-3 text-right font-medium lg:top-12">
                <SortableHeader field="items" label="اقلام" />
              </th>
              <th className="sticky top-14 z-10 bg-background px-4 py-3 text-right font-medium lg:top-12">
                <SortableHeader field="status" label="وضعیت" />
              </th>
              <th className="sticky top-14 z-10 bg-background px-4 py-3 text-right font-medium lg:top-12">
                <SortableHeader field="createdAt" label="تاریخ ثبت" />
              </th>
              <th className="sticky top-14 z-10 rounded-tl-2xl bg-background px-4 py-3 text-right font-medium lg:top-12" />
            </tr>
          </thead>
          <tbody>
            {PLACEHOLDER_ROWS.map((_, i) => (
              <OrderRowDesktop key={i} order={null} isAdmin />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
