"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { CATEGORY_ICONS } from "@/lib/category-icons";
import type { ProductCategoryContent } from "@/lib/site-content-defaults";
import { cn } from "@/lib/utils";

// Mobile counterpart to ProductsMegaMenu's full-width column grid — a
// hover-driven panel doesn't translate to touch, so the same real category
// data collapses into a two-level vertical accordion here instead of
// squeezing the multi-column layout down. Level one is the category list;
// level two (opened per-category, not all at once) is that category's real
// brand list, same data the desktop panel shows.
export function MobileProductsAccordion({
  categories,
  drawerOpen,
  onNavigate,
}: {
  categories: ProductCategoryContent[];
  // The parent mobile drawer only ever toggles a CSS class (`block`/`hidden`)
  // on itself — this component stays mounted underneath, so its own
  // open/openCategoryId state would otherwise survive a drawer close/reopen
  // and show up already expanded next time. Resetting on drawerOpen's
  // false edge keeps this accordion starting fresh every time, like the
  // rest of the drawer's contents effectively do.
  drawerOpen: boolean;
  onNavigate: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [openCategoryId, setOpenCategoryId] = useState<string | null>(null);

  useEffect(() => {
    if (!drawerOpen) {
      setOpen(false);
      setOpenCategoryId(null);
    }
  }, [drawerOpen]);

  if (categories.length === 0) {
    return (
      <Link className={buttonVariants({ variant: "ghost", className: "justify-start" })} href="/products" onClick={onNavigate}>
        محصولات
      </Link>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={buttonVariants({ variant: "ghost", className: "w-full justify-between" })}
      >
        محصولات
        <ChevronDown aria-hidden className={cn("size-4 transition-transform duration-300", open && "rotate-180")} />
      </button>

      {/* The `grid-rows-[0fr]→[1fr]` pair (with a `min-h-0` child) animates
          height to the content's real size without measuring it in JS —
          the same trick used one level down for each category's own
          brand list. */}
      <div
        aria-hidden={!open}
        className={cn("grid overflow-hidden transition-all duration-300", open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}
      >
        <div className="min-h-0">
          <div className="mt-1 mr-2 flex flex-col gap-0.5 border-r border-foreground/10 pr-3">
            {categories.map((category) => {
              const isCategoryOpen = openCategoryId === category.id;
              return (
                <div key={category.id}>
                  <button
                    type="button"
                    onClick={() => setOpenCategoryId(isCategoryOpen ? null : category.id)}
                    aria-expanded={isCategoryOpen}
                    tabIndex={open ? 0 : -1}
                    className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-right text-sm text-foreground/80 transition-colors hover:bg-foreground/5"
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-accent-500/10 text-accent-400 [&_svg]:size-4">
                      {CATEGORY_ICONS[category.iconKey]}
                    </span>
                    <span className="flex-1">{category.title}</span>
                    <ChevronDown
                      aria-hidden
                      className={cn("size-3.5 shrink-0 text-foreground/40 transition-transform duration-300", isCategoryOpen && "rotate-180")}
                    />
                  </button>

                  <div
                    aria-hidden={!isCategoryOpen}
                    className={cn(
                      "grid overflow-hidden transition-all duration-300",
                      isCategoryOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                    )}
                  >
                    <div className="min-h-0">
                      {category.brands.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 py-2 pr-9 pl-2">
                          {category.brands.map((brand) => (
                            <span key={brand} className="rounded-md bg-foreground/5 px-2 py-1 text-xs text-foreground/60">
                              {brand}
                            </span>
                          ))}
                        </div>
                      )}
                      <Link
                        href={`/products#${category.id}`}
                        onClick={onNavigate}
                        tabIndex={open && isCategoryOpen ? 0 : -1}
                        className="mb-2 mr-9 inline-flex items-center gap-1.5 text-xs font-semibold text-accent-400"
                      >
                        مشاهده همه {category.title}
                        <ArrowLeft className="size-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
