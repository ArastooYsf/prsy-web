import Link from "next/link";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { toPersianDigits } from "@/lib/format-number";

function windowed(page: number, pageCount: number): number[] {
  const span = 2;
  const start = Math.max(1, page - span);
  const end = Math.min(pageCount, page + span);
  const out: number[] = [];
  for (let i = start; i <= end; i += 1) out.push(i);
  return out;
}

export default function CatalogPagination({
  page,
  pageCount,
  makeHref,
}: {
  page: number;
  pageCount: number;
  makeHref: (page: number) => string;
}) {
  if (pageCount <= 1) return null;
  const pages = windowed(page, pageCount);

  const cell =
    "inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-foreground/10 px-3 text-sm font-medium transition-colors";

  return (
    <nav aria-label="صفحه‌بندی" className="mt-8 flex flex-wrap items-center justify-center gap-1.5">
      {/* RTL: "prev" (newer page number - 1) points right */}
      {page > 1 && (
        <Link href={makeHref(page - 1)} className={`${cell} hover:border-accent-500/40`} aria-label="صفحه قبل">
          <ChevronRight className="size-4" />
        </Link>
      )}
      {pages[0] > 1 && <span className="px-1 text-foreground/30">…</span>}
      {pages.map((p) => (
        <Link
          key={p}
          href={makeHref(p)}
          aria-current={p === page ? "page" : undefined}
          className={`${cell} ${p === page ? "border-accent-500 bg-accent-500/10 text-accent-500" : "hover:border-accent-500/40"}`}
        >
          {toPersianDigits(p)}
        </Link>
      ))}
      {pages[pages.length - 1] < pageCount && <span className="px-1 text-foreground/30">…</span>}
      {page < pageCount && (
        <Link href={makeHref(page + 1)} className={`${cell} hover:border-accent-500/40`} aria-label="صفحه بعد">
          <ChevronLeft className="size-4" />
        </Link>
      )}
    </nav>
  );
}
