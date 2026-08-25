import { FileSpreadsheet, Import, UserCheck, UserPlus, Users } from "lucide-react";
import { CUSTOMER_TYPE, APPROVAL_STATUS } from "@/lib/status-labels";
import ListFilterBar from "@/components/admin/ListFilterBar";
import SortableHeader from "@/components/admin/SortableHeader";
import { CustomerCardMobile, CustomerRowDesktop } from "./CustomerRow";

const PLACEHOLDER_ROWS = Array.from({ length: 6 });

export default function Loading() {
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Users className="size-5 text-accent-400" />
          مشتریان
        </h2>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-foreground/10 px-4 text-sm font-medium text-foreground/70">
            <FileSpreadsheet className="size-4" />
            دانلود اکسل
          </span>
          <span className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-foreground/10 px-4 text-sm font-medium text-foreground/70">
            <UserCheck className="size-4" />
            درخواست‌های تأیید مشتری حقوقی
          </span>
          <span className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-foreground/10 px-4 text-sm font-medium text-foreground/70">
            <Import className="size-4" />
            Migrate مشتریان قدیمی
          </span>
          <span className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-accent-500 px-5 text-sm font-semibold text-primary-foreground shadow-lg shadow-accent-500/25">
            <UserPlus className="size-4" />
            افزودن مشتری
          </span>
        </div>
      </div>

      <ListFilterBar
        searchPlaceholder="جست‌وجوی نام، ایمیل یا تلفن..."
        selects={[
          {
            key: "role",
            label: "نقش",
            allLabel: "نقش: مشتریان (پیش‌فرض)",
            options: [
              { value: "ALL", label: "همه نقش‌ها" },
              { value: "CUSTOMER", label: "مشتری" },
              { value: "SUPPORT", label: "پشتیبان" },
              { value: "ADMIN", label: "مدیر" },
            ],
          },
          {
            key: "customerType",
            label: "نوع",
            options: Object.entries(CUSTOMER_TYPE).map(([value, t]) => ({ value, label: t.label })),
          },
          {
            key: "approvalStatus",
            label: "وضعیت تأیید",
            options: Object.entries(APPROVAL_STATUS).map(([value, s]) => ({ value, label: s.label })),
          },
        ]}
      />

      {/* Mobile/tablet: card list */}
      <div className="space-y-3 md:hidden">
        {PLACEHOLDER_ROWS.map((_, i) => (
          <CustomerCardMobile key={i} customer={null} isAdmin />
        ))}
      </div>

      {/* Desktop/tablet: table */}
      <div className="hidden rounded-2xl border border-foreground/10 md:block">
        <table className="w-full text-sm">
          <thead className="text-foreground/60">
            <tr>
              <th className="sticky top-14 z-10 rounded-tr-2xl bg-background px-4 py-3 text-right font-medium lg:top-12">
                <SortableHeader field="name" label="نام" />
              </th>
              <th className="sticky top-14 z-10 bg-background px-4 py-3 text-right font-medium lg:top-12">
                <SortableHeader field="email" label="ایمیل" />
              </th>
              <th className="sticky top-14 z-10 bg-background px-4 py-3 text-right font-medium lg:top-12">
                <SortableHeader field="customerType" label="نوع" />
              </th>
              <th className="sticky top-14 z-10 bg-background px-4 py-3 text-right font-medium lg:top-12">
                <SortableHeader field="approvalStatus" label="وضعیت" />
              </th>
              <th className="sticky top-14 z-10 bg-background px-4 py-3 text-right font-medium lg:top-12">
                <SortableHeader field="createdAt" label="تاریخ عضویت" />
              </th>
              <th className="sticky top-14 z-10 rounded-tl-2xl bg-background px-4 py-3 text-right font-medium lg:top-12" />
            </tr>
          </thead>
          <tbody>
            {PLACEHOLDER_ROWS.map((_, i) => (
              <CustomerRowDesktop key={i} customer={null} isAdmin />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
