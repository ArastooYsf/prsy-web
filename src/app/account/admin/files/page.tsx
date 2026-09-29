import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { FolderOpen } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import ListFilterBar from "@/components/admin/ListFilterBar";
import { AdminTableScroll, AdminTh } from "@/components/admin/AdminTable";
import CatalogPagination from "@/components/products/CatalogPagination";
import { UploadedFileCardMobile, UploadedFileRowDesktop } from "@/components/admin/UploadedFileRow";
import { authOptions } from "@/lib/auth";
import { toPersianDigits, formatNumber } from "@/lib/format-number";
import { filterQueryString, param, type ListSearchParams } from "@/lib/list-query";
import { listUploadedFiles, parseUploadedFileFilters } from "@/lib/uploaded-files";
import { debugSlowLoad } from "@/lib/debug-slow-load";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 30;

export default async function AdminFilesPage({ searchParams }: { searchParams: ListSearchParams }) {
  await debugSlowLoad();

  const session = await getServerSession(authOptions);
  if (session!.user.role !== "ADMIN") {
    redirect("/account/admin");
  }

  const filters = parseUploadedFileFilters(searchParams);
  const allRows = await listUploadedFiles(filters);

  const pageCount = Math.max(1, Math.ceil(allRows.length / PAGE_SIZE));
  const pageParam = Number(param(searchParams, "page") ?? "1");
  const page = Number.isFinite(pageParam) ? Math.min(Math.max(1, pageParam), pageCount) : 1;
  const rows = allRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totalSize = allRows.reduce((sum, r) => sum + r.size, 0);
  const totalSizeMb = (totalSize / (1024 * 1024)).toFixed(1);

  const makeHref = (p: number) => {
    const qs = filterQueryString(searchParams);
    const params = new URLSearchParams(qs.replace(/^\?/, ""));
    if (p > 1) params.set("page", String(p));
    else params.delete("page");
    const rest = params.toString();
    return `/account/admin/files${rest ? `?${rest}` : ""}`;
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <FolderOpen className="size-5 text-accent-400" />
          فایل‌های آپلودشده
        </h2>
        <p className="text-xs text-foreground/50">
          {toPersianDigits(formatNumber(allRows.length))} فایل — مجموعاً {toPersianDigits(totalSizeMb)} مگابایت
        </p>
      </div>

      <ListFilterBar
        selects={[
          {
            key: "type",
            label: "نوع",
            options: [
              { value: "image", label: "تصویر" },
              { value: "pdf", label: "PDF" },
              { value: "docx", label: "DOCX" },
            ],
          },
          {
            key: "source",
            label: "منبع",
            options: [
              { value: "media_asset", label: "مخزن سایت (محصول، لوگو، وبلاگ، ...)" },
              { value: "customer_file", label: "فایل مشتری" },
              { value: "ticket_attachment", label: "پیوست تیکت" },
              { value: "product_comment_image", label: "تصویر دیدگاه محصول" },
            ],
          },
        ]}
        dateRanges={[{ fromKey: "from", toKey: "to", label: "تاریخ" }]}
        numberRanges={[{ minKey: "minSize", maxKey: "maxSize", label: "حجم", unit: "مگابایت" }]}
      />

      {rows.length === 0 ? (
        <EmptyState icon={<FolderOpen />} title="فایلی با این فیلتر یافت نشد." />
      ) : (
        <>
          {/* Mobile/tablet: card list */}
          <div className="space-y-2.5 md:hidden">
            {rows.map((row) => (
              <UploadedFileCardMobile key={`${row.source}:${row.id}`} row={row} />
            ))}
          </div>

          {/* Desktop/tablet: table */}
          <AdminTableScroll>
            <table className="w-full text-sm">
              <thead className="text-foreground/60">
                <tr>
                  <AdminTh corner="start">فایل</AdminTh>
                  <AdminTh>منبع</AdminTh>
                  <AdminTh>حجم</AdminTh>
                  <AdminTh>تاریخ</AdminTh>
                  <AdminTh corner="end">عملیات</AdminTh>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <UploadedFileRowDesktop key={`${row.source}:${row.id}`} row={row} />
                ))}
              </tbody>
            </table>
          </AdminTableScroll>
        </>
      )}

      <CatalogPagination page={page} pageCount={pageCount} makeHref={makeHref} />
    </div>
  );
}
