import Link from "next/link";
import { Newspaper, Plus } from "lucide-react";
import { AdminTableScroll, AdminTh } from "@/components/admin/AdminTable";
import { BlogCardMobile, BlogRowDesktop } from "./BlogRow";

const PLACEHOLDER_ROWS = Array.from({ length: 6 });

export default function Loading() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Newspaper className="size-5 text-accent-400" />
          پست‌های وبلاگ
        </h2>
        <Link
          href="/account/admin/blog/new"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-accent-500 px-5 text-sm font-semibold text-primary-foreground shadow-lg shadow-accent-500/25 transition-colors hover:bg-accent-600"
        >
          <Plus className="size-4" />
          پست جدید
        </Link>
      </div>

      {/* Mobile/tablet: card list */}
      <div className="space-y-3 md:hidden">
        {PLACEHOLDER_ROWS.map((_, i) => (
          <BlogCardMobile key={i} post={null} />
        ))}
      </div>

      {/* Desktop/tablet: table */}
      <AdminTableScroll>
        <table className="w-full text-sm">
          <thead className="text-foreground/60">
            <tr>
              <AdminTh corner="start">عنوان</AdminTh>
              <AdminTh>وضعیت</AdminTh>
              <AdminTh>تاریخ انتشار</AdminTh>
              <AdminTh>بازدید</AdminTh>
              <AdminTh corner="end" />
            </tr>
          </thead>
          <tbody>
            {PLACEHOLDER_ROWS.map((_, i) => (
              <BlogRowDesktop key={i} post={null} />
            ))}
          </tbody>
        </table>
      </AdminTableScroll>
    </div>
  );
}
