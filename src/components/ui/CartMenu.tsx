"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ImageOff, Minus, Plus, ShoppingCart, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/CartProvider";
import { useExclusiveOverlay } from "@/components/OverlayCoordinator";
import { getMediaUrl } from "@/lib/media";
import { formatNumber } from "@/lib/format-number";
import { cn } from "@/lib/utils";

// Same hover-intent + open/close choreography as ProductsMegaMenu.tsx, on
// purpose — the two menus should feel like the same interaction, not two
// independently-tuned dropdowns.
const CLOSE_DELAY = 180;
const OPEN_TRANSITION = { duration: 0.22, ease: [0.16, 1, 0.3, 1] as const };
const CLOSE_TRANSITION = { duration: 0.16, ease: "easeIn" as const };

export default function CartMenu() {
  const { items, totalCount, totalPrice, setQuantity, removeItem } = useCart();
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useExclusiveOverlay("cart-menu", open, () => setOpen(false));

  const clearCloseTimer = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };
  const handleEnter = () => {
    clearCloseTimer();
    setOpen(true);
  };
  const handleLeave = () => {
    clearCloseTimer();
    closeTimer.current = setTimeout(() => setOpen(false), CLOSE_DELAY);
  };

  return (
    <div
      className="relative flex h-full items-center"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onFocus={handleEnter}
      onBlur={handleLeave}
    >
      <Button size="icon" variant="outline" className="relative h-9 w-9" asChild>
        <Link href="/cart" aria-label="سبد خرید" aria-haspopup="true" aria-expanded={open}>
          <ShoppingCart className="size-[18px]" />
          {totalCount > 0 && (
            <span className="absolute -left-1.5 -top-1.5 flex min-w-[18px] items-center justify-center rounded-full bg-accent-500 px-1 text-[10px] font-bold leading-[18px] text-primary-foreground">
              {formatNumber(totalCount)}
            </span>
          )}
        </Link>
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0, transition: OPEN_TRANSITION }}
            exit={{ opacity: 0, y: -8, transition: CLOSE_TRANSITION }}
            className="absolute left-0 top-full z-50 mt-2 w-[22rem] max-w-[calc(100vw-2rem)]"
          >
            <div className="flex max-h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-2xl shadow-black/40">
              <div className="shrink-0 border-b border-border px-4 py-3">
                <p className="text-sm font-bold">سبد خرید</p>
              </div>

              {items.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                  <ShoppingCart className="size-8 text-muted-foreground/40" aria-hidden />
                  <p className="text-xs text-muted-foreground">سبد خرید شما خالی است.</p>
                </div>
              ) : (
                <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
                  {items.map((item) => (
                    <li key={item.productId} className="flex gap-3 rounded-xl p-2 hover:bg-foreground/[0.03]">
                      <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-foreground/5">
                        {item.image ? (
                          <Image src={getMediaUrl(item.image)} alt={item.name} fill sizes="56px" className="object-cover" />
                        ) : (
                          <span className="flex h-full items-center justify-center text-foreground/25">
                            <ImageOff className="size-4" />
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        {item.href ? (
                          <Link
                            href={item.href}
                            onClick={() => setOpen(false)}
                            className="line-clamp-1 text-xs font-semibold hover:text-accent-500"
                          >
                            {item.name}
                          </Link>
                        ) : (
                          <p className="line-clamp-1 text-xs font-semibold">{item.name}</p>
                        )}
                        <p dir="ltr" className="mt-0.5 text-right text-[11px] text-muted-foreground">
                          {formatNumber(item.price)} تومان
                        </p>

                        <div className="mt-1.5 flex items-center justify-between">
                          <div className="flex items-center gap-1 rounded-full border border-border px-1">
                            <button
                              type="button"
                              aria-label="کم کردن تعداد"
                              onClick={() => setQuantity(item.productId, item.quantity - 1)}
                              className="flex size-6 items-center justify-center rounded-full text-foreground/60 transition-colors hover:bg-foreground/10 hover:text-foreground"
                            >
                              <Minus className="size-3" />
                            </button>
                            <span className="min-w-[1.25rem] text-center text-xs font-semibold">
                              {formatNumber(item.quantity)}
                            </span>
                            <button
                              type="button"
                              aria-label="افزودن تعداد"
                              onClick={() => setQuantity(item.productId, item.quantity + 1)}
                              className="flex size-6 items-center justify-center rounded-full text-foreground/60 transition-colors hover:bg-foreground/10 hover:text-foreground"
                            >
                              <Plus className="size-3" />
                            </button>
                          </div>

                          <button
                            type="button"
                            aria-label={`حذف ${item.name} از سبد`}
                            onClick={() => removeItem(item.productId)}
                            className="flex size-6 shrink-0 items-center justify-center rounded-full text-foreground/40 transition-colors hover:bg-red-500/10 hover:text-red-400"
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {items.length > 0 && (
                <div className="shrink-0 space-y-3 border-t border-border p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">جمع کل</span>
                    <span dir="ltr" className="font-bold">
                      {formatNumber(totalPrice)} تومان
                    </span>
                  </div>
                  <Link
                    href="/checkout"
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex min-h-11 w-full items-center justify-center rounded-full bg-accent-500 px-6 text-sm font-bold text-primary-foreground shadow-lg shadow-accent-500/25 transition-colors hover:bg-accent-600",
                    )}
                  >
                    ثبت سفارش
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
