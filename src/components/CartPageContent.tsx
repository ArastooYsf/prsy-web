"use client";

import Image from "next/image";
import Link from "next/link";
import { ImageOff, Minus, Plus, ShoppingCart, X } from "lucide-react";
import { useCart } from "@/components/CartProvider";
import { getMediaUrl } from "@/lib/media";
import { formatNumber } from "@/lib/format-number";
import EmptyState from "@/components/ui/EmptyState";

export default function CartPageContent() {
  const { items, totalPrice, setQuantity, removeItem } = useCart();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-md">
        <EmptyState
          icon={<ShoppingCart />}
          title="سبد خرید شما خالی است"
          description="محصولی به سبد اضافه نکرده‌اید — از فروشگاه بازدید کنید و محصول موردنظرتان را اضافه کنید."
          action={{ label: "مشاهده‌ی محصولات", href: "/products" }}
        />
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <ul className="space-y-3">
        {items.map((item) => (
          <li
            key={item.productId}
            className="flex items-center gap-4 rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-4"
          >
            <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-foreground/5">
              {item.image ? (
                <Image src={getMediaUrl(item.image)} alt={item.name} fill sizes="80px" className="object-cover" />
              ) : (
                <span className="flex h-full items-center justify-center text-foreground/25">
                  <ImageOff className="size-6" />
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              {item.href ? (
                <Link href={item.href} className="line-clamp-2 text-sm font-semibold hover:text-accent-500">
                  {item.name}
                </Link>
              ) : (
                <p className="line-clamp-2 text-sm font-semibold">{item.name}</p>
              )}
              <p dir="ltr" className="mt-1 text-right text-sm text-foreground/60">
                {formatNumber(item.price)} تومان
              </p>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-2">
              <button
                type="button"
                aria-label={`حذف ${item.name} از سبد`}
                onClick={() => removeItem(item.productId)}
                className="flex size-8 items-center justify-center rounded-full text-foreground/40 transition-colors hover:bg-red-500/10 hover:text-red-400"
              >
                <X className="size-4" />
              </button>
              <div className="flex items-center gap-1 rounded-full border border-foreground/10 px-1">
                <button
                  type="button"
                  aria-label="کم کردن تعداد"
                  onClick={() => setQuantity(item.productId, item.quantity - 1)}
                  className="flex size-8 items-center justify-center rounded-full text-foreground/60 transition-colors hover:bg-foreground/10 hover:text-foreground"
                >
                  <Minus className="size-3.5" />
                </button>
                <span className="min-w-[1.5rem] text-center text-sm font-semibold">{formatNumber(item.quantity)}</span>
                <button
                  type="button"
                  aria-label="افزودن تعداد"
                  onClick={() => setQuantity(item.productId, item.quantity + 1)}
                  className="flex size-8 items-center justify-center rounded-full text-foreground/60 transition-colors hover:bg-foreground/10 hover:text-foreground"
                >
                  <Plus className="size-3.5" />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="h-fit rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-6 lg:sticky lg:top-24">
        <p className="text-sm font-bold">خلاصه سفارش</p>
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-foreground/60">جمع کل</span>
          <span dir="ltr" className="font-bold">
            {formatNumber(totalPrice)} تومان
          </span>
        </div>
        <Link
          href="/checkout"
          className="mt-5 flex min-h-11 w-full items-center justify-center rounded-full bg-accent-500 px-6 text-sm font-bold text-primary-foreground shadow-lg shadow-accent-500/25 transition-all hover:-translate-y-0.5 hover:bg-accent-600"
        >
          ثبت سفارش
        </Link>
      </div>
    </div>
  );
}
