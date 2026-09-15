"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import * as Popover from "@radix-ui/react-popover";
import { MoreVertical, ArrowLeft } from "lucide-react";
import type { ProductSpec } from "@/lib/product-json";

export default function ProductQuickPreview({
  children,
  specs,
  detailHref,
  productName,
}: {
  children: ReactNode;
  specs: ProductSpec[];
  detailHref: string;
  productName: string;
}) {
  return (
    <Popover.Root>
      <Popover.Anchor asChild>
        <div className="relative">
          {children}
          <Popover.Trigger asChild>
            <button
              type="button"
              aria-label={`مشخصات سریع ${productName}`}
              className="absolute right-1 top-1 z-10 flex size-11 items-center justify-center rounded-full bg-background/80 text-foreground/70 opacity-100 shadow-sm backdrop-blur-sm transition-opacity hover:bg-background hover:text-accent-500 lg:opacity-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100"
            >
              <MoreVertical className="size-5" />
            </button>
          </Popover.Trigger>
        </div>
      </Popover.Anchor>

      <Popover.Portal>
        <Popover.Content
          side="bottom"
          align="end"
          sideOffset={6}
          style={{ width: "var(--radix-popover-trigger-width)" }}
          className="z-50 max-h-[var(--radix-popover-content-available-height)] overflow-y-auto rounded-2xl border border-foreground/10 bg-background p-3 shadow-2xl"
        >
          <p className="mb-2 truncate text-xs font-semibold text-foreground/80">{productName}</p>
          {specs.length === 0 ? (
            <p className="px-1 pb-2 text-xs text-foreground/50">مشخصاتی برای پیش‌نمایش ثبت نشده است.</p>
          ) : (
            <ul className="space-y-1.5">
              {specs.map((spec) => (
                <li
                  key={spec.label}
                  className="flex items-baseline justify-between gap-2 border-b border-foreground/5 pb-1.5 text-xs last:border-0"
                >
                  <span className="shrink-0 text-foreground/50">{spec.label}</span>
                  <span className="truncate font-medium text-foreground">{spec.value}</span>
                </li>
              ))}
            </ul>
          )}
          <Popover.Close asChild>
            <Link
              href={detailHref}
              className="mt-2 flex min-h-9 items-center justify-center gap-1 rounded-lg bg-accent-500/10 text-xs font-semibold text-accent-500 transition-colors hover:bg-accent-500/20"
            >
              بیشتر...
              <ArrowLeft className="size-3.5" />
            </Link>
          </Popover.Close>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
