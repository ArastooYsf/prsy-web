"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { MoreVertical, ArrowLeft, X } from "lucide-react";
import type { ProductSpec } from "@/lib/product-json";
import { useSiteTheme } from "@/components/RouteThemeScope";
import { scaleIn } from "@/lib/motion";
import { cn } from "@/lib/utils";

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
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  // RouteThemeScope wraps this in a normal DOM ancestor here (unlike a
  // Radix Portal, which renders into document.body and breaks CSS-variable
  // inheritance) — the panel is a plain in-flow child now, so no theme
  // class needs reapplying.
  const siteTheme = useSiteTheme();
  const isLightTheme = siteTheme?.theme !== "dark";

  // The panel is a normal absolutely-positioned child of this same
  // `relative` container — not a Radix Popper-floated portal — so it has no
  // trigger-anchored position to get wrong on scroll and never needs
  // flip/shift collision handling. Closing it therefore needs its own
  // outside-click/Escape wiring, which Popover.Content used to provide.
  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      {children}

      <button
        type="button"
        aria-label={`مشخصات سریع ${productName}`}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="absolute right-1 top-1 z-20 flex size-11 items-center justify-center rounded-full bg-background/80 text-foreground/70 opacity-100 shadow-sm backdrop-blur-sm transition-opacity hover:bg-background hover:text-accent-500 lg:opacity-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100"
      >
        <MoreVertical className="size-5" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            variants={scaleIn}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
            className={cn(
              "absolute inset-0 z-10 flex flex-col overflow-y-auto rounded-2xl border border-foreground/10 bg-background/95 p-3 shadow-xl backdrop-blur-md",
              isLightTheme && "theme-white-blue",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="truncate text-xs font-semibold text-foreground/80">{productName}</p>
              <button
                type="button"
                aria-label="بستن"
                onClick={() => setOpen(false)}
                className="-m-1 flex size-7 shrink-0 items-center justify-center rounded-full text-foreground/50 transition-colors hover:bg-foreground/10 hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            {specs.length === 0 ? (
              <p className="mt-2 px-1 text-xs text-foreground/50">مشخصاتی برای پیش‌نمایش ثبت نشده است.</p>
            ) : (
              <ul className="mt-2 space-y-1.5">
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

            <Link
              href={detailHref}
              onClick={() => setOpen(false)}
              className="mt-auto flex min-h-9 shrink-0 items-center justify-center gap-1 rounded-lg bg-accent-500/10 text-xs font-semibold text-accent-500 transition-colors hover:bg-accent-500/20"
            >
              بیشتر...
              <ArrowLeft className="size-3.5" />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
