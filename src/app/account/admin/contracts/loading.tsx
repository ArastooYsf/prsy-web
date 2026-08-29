import { FileSpreadsheet, Plus, ScrollText } from "lucide-react";
import { CONTRACT_STATUS } from "@/lib/status-labels";
import ListFilterBar from "@/components/admin/ListFilterBar";
import SortableHeader from "@/components/admin/SortableHeader";
import { ContractCardMobile, ContractRowDesktop } from "./ContractRow";

const PLACEHOLDER_ROWS = Array.from({ length: 5 });

export default function Loading() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <ScrollText className="size-5 text-accent-400" />
          قراردادها
        </h2>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-foreground/10 px-4 text-sm font-medium text-foreground/70">
            <FileSpreadsheet className="size-4" />
            دانلود اکسل
          </span>
          <span className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-accent-500 px-5 text-sm font-semibold text-primary-foreground shadow-lg shadow-accent-500/25">
            <Plus className="size-4" />
            ثبت قرارداد جدید
          </span>
        </div>
      </div>

      <ListFilterBar
        searchPlaceholder="جست‌وجوی عنوان یا مشتری..."
        selects={[
          {
            key: "status",
            label: "وضعیت",
            options: Object.entries(CONTRACT_STATUS).map(([value, s]) => ({ value, label: s.label })),
          },
          {
            key: "type",
            label: "نوع قرارداد",
            // Type options come from a distinct-values DB query bundled with
            // the page's own data fetch, so they aren't known yet here.
            options: [],
          },
        ]}
        dates={[
          { key: "startDate", label: "تاریخ شروع" },
          { key: "endDate", label: "تاریخ پایان" },
        ]}
      />

      {/* Mobile/tablet: card list */}
      <div className="space-y-3 md:hidden">
        {PLACEHOLDER_ROWS.map((_, i) => (
          <ContractCardMobile key={i} contract={null} isAdmin />
        ))}
      </div>

      {/* Desktop/tablet: table */}
      <div className="hidden rounded-2xl border border-foreground/10 md:block">
        <table className="w-full text-sm">
          <thead className="text-foreground/60">
            <tr>
              <th className="sticky top-14 z-10 rounded-tr-2xl bg-background px-4 py-3 text-right font-medium lg:top-12">
                <SortableHeader field="title" label="عنوان" />
              </th>
              <th className="sticky top-14 z-10 bg-background px-4 py-3 text-right font-medium lg:top-12">
                <SortableHeader field="user" label="مشتری" />
              </th>
              <th className="sticky top-14 z-10 bg-background px-4 py-3 text-right font-medium lg:top-12">
                <SortableHeader field="type" label="نوع" />
              </th>
              <th className="sticky top-14 z-10 bg-background px-4 py-3 text-right font-medium lg:top-12">
                <SortableHeader field="status" label="وضعیت" />
              </th>
              <th className="sticky top-14 z-10 bg-background px-4 py-3 text-right font-medium lg:top-12">
                <SortableHeader field="startDate" label="شروع" />
              </th>
              <th className="sticky top-14 z-10 bg-background px-4 py-3 text-right font-medium lg:top-12">
                <SortableHeader field="endDate" label="پایان" />
              </th>
              <th className="sticky top-14 z-10 rounded-tl-2xl bg-background px-4 py-3 text-right font-medium lg:top-12" />
            </tr>
          </thead>
          <tbody>
            {PLACEHOLDER_ROWS.map((_, i) => (
              <ContractRowDesktop key={i} contract={null} isAdmin />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
