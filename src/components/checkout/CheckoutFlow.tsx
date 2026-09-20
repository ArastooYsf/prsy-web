"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, ImageOff, Minus, Plus, ShoppingCart, X } from "lucide-react";
import { useCart } from "@/components/CartProvider";
import { useToast } from "@/components/ToastProvider";
import StepIndicator from "@/components/ui/StepIndicator";
import EmptyState from "@/components/ui/EmptyState";
import { getMediaUrl } from "@/lib/media";
import { formatNumber } from "@/lib/format-number";

const STEPS = ["بازبینی سبد", "اطلاعات تماس", "تأیید نهایی"];

type Contact = { name: string; email: string; phone: string; address: string };

export default function CheckoutFlow({ contact }: { contact: Contact }) {
  const { items, totalPrice, setQuantity, removeItem, clear } = useCart();
  const { showToast } = useToast();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-md">
        <EmptyState
          icon={<ShoppingCart />}
          title="سبد خرید شما خالی است"
          description="برای ثبت سفارش، ابتدا حداقل یک محصول به سبد خرید اضافه کنید."
          action={{ label: "مشاهده‌ی محصولات", href: "/products" }}
        />
      </div>
    );
  }

  const contactMissing = !contact.phone || !contact.address;

  const submitOrder = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/account/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        showToast(data?.error ?? "ثبت سفارش با خطا مواجه شد.", "error");
        setSubmitting(false);
        return;
      }
      clear();
      showToast("سفارش شما با موفقیت ثبت شد.", "success");
      router.push("/account/orders");
    } catch {
      showToast("ارتباط با سرور برقرار نشد. دوباره تلاش کنید.", "error");
      setSubmitting(false);
    }
  };

  return (
    <div>
      <StepIndicator steps={STEPS} currentStep={step} />

      {step === 1 && (
        <div>
          <ul className="space-y-3">
            {items.map((item) => (
              <li
                key={item.productId}
                className="flex items-center gap-4 rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-4"
              >
                <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-foreground/5">
                  {item.image ? (
                    <Image src={getMediaUrl(item.image)} alt={item.name} fill sizes="64px" className="object-cover" />
                  ) : (
                    <span className="flex h-full items-center justify-center text-foreground/25">
                      <ImageOff className="size-5" />
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-semibold">{item.name}</p>
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
                    <span className="min-w-[1.5rem] text-center text-sm font-semibold">
                      {formatNumber(item.quantity)}
                    </span>
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

          <div className="mt-4 flex items-center justify-between rounded-xl border border-foreground/10 bg-foreground/[0.03] px-4 py-3 text-sm">
            <span className="text-foreground/60">جمع کل</span>
            <span dir="ltr" className="font-bold">
              {formatNumber(totalPrice)} تومان
            </span>
          </div>

          <button
            type="button"
            onClick={() => setStep(2)}
            className="mt-6 flex min-h-11 w-full items-center justify-center gap-1.5 rounded-full bg-accent-500 px-6 text-sm font-bold text-primary-foreground shadow-lg shadow-accent-500/25 transition-all hover:-translate-y-0.5 hover:bg-accent-600"
          >
            مرحله‌ی بعد
            <ArrowLeft className="size-4" />
          </button>
        </div>
      )}

      {step === 2 && (
        <div>
          <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-5">
            <p className="mb-4 text-sm font-bold">اطلاعات تماس شما</p>
            <dl className="space-y-2.5 text-sm">
              <div className="flex items-baseline gap-2">
                <dt className="shrink-0 text-foreground/50">نام:</dt>
                <dd className="font-medium">{contact.name || "—"}</dd>
              </div>
              <div className="flex items-baseline gap-2">
                <dt className="shrink-0 text-foreground/50">ایمیل:</dt>
                <dd dir="ltr" className="font-medium">
                  {contact.email || "—"}
                </dd>
              </div>
              <div className="flex items-baseline gap-2">
                <dt className="shrink-0 text-foreground/50">شماره تماس:</dt>
                <dd dir="ltr" className="font-medium">
                  {contact.phone || "ثبت نشده"}
                </dd>
              </div>
              <div className="flex items-baseline gap-2">
                <dt className="shrink-0 text-foreground/50">آدرس:</dt>
                <dd className="font-medium">{contact.address || "ثبت نشده"}</dd>
              </div>
            </dl>

            {contactMissing && (
              <p className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
                برای هماهنگی تحویل، بهتر است شماره تماس و آدرس خود را کامل کنید.
              </p>
            )}

            <Link
              href="/account/profile"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex min-h-9 items-center text-xs font-semibold text-accent-500 hover:underline"
            >
              ویرایش اطلاعات پروفایل
            </Link>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full border border-foreground/10 px-6 text-sm font-semibold text-foreground/70 transition-colors hover:border-foreground/20"
            >
              <ArrowRight className="size-4" />
              مرحله‌ی قبل
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-accent-500 px-6 text-sm font-bold text-primary-foreground shadow-lg shadow-accent-500/25 transition-all hover:-translate-y-0.5 hover:bg-accent-600"
            >
              مرحله‌ی بعد
              <ArrowLeft className="size-4" />
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-5">
            <p className="mb-4 text-sm font-bold">خلاصه‌ی سفارش</p>
            <ul className="space-y-2 text-sm">
              {items.map((item) => (
                <li key={item.productId} className="flex items-center justify-between gap-2">
                  <span className="min-w-0 flex-1 truncate text-foreground/80">
                    {item.name} × {formatNumber(item.quantity)}
                  </span>
                  <span dir="ltr" className="shrink-0 font-medium">
                    {formatNumber(item.price * item.quantity)} تومان
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex items-center justify-between border-t border-foreground/10 pt-4 text-sm font-bold">
              <span>جمع کل</span>
              <span dir="ltr">{formatNumber(totalPrice)} تومان</span>
            </div>
          </div>

          <p className="mt-4 text-xs leading-6 text-foreground/50">
            با ثبت سفارش، درخواست شما برای تیم ما ارسال می‌شود و پس از بررسی، برای هماهنگی نهایی و تسویه‌حساب با شما
            تماس گرفته خواهد شد.
          </p>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={submitting}
              className="flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full border border-foreground/10 px-6 text-sm font-semibold text-foreground/70 transition-colors hover:border-foreground/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ArrowRight className="size-4" />
              مرحله‌ی قبل
            </button>
            <button
              type="button"
              onClick={submitOrder}
              disabled={submitting}
              className="flex min-h-11 flex-1 items-center justify-center rounded-full bg-accent-500 px-6 text-sm font-bold text-primary-foreground shadow-lg shadow-accent-500/25 transition-all hover:-translate-y-0.5 hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {submitting ? "در حال ثبت..." : "ثبت نهایی سفارش"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
