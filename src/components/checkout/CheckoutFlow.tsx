"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, ImageOff, Minus, Plus, ShoppingCart, User, X } from "lucide-react";
import { useCart } from "@/components/CartProvider";
import { useToast } from "@/components/ToastProvider";
import StepIndicator from "@/components/ui/StepIndicator";
import EmptyState from "@/components/ui/EmptyState";
import { getMediaUrl } from "@/lib/media";
import { formatNumber } from "@/lib/format-number";
import { isValidIranPhone } from "@/lib/validation";
import CustomerPicker, { type SelectedCustomer } from "@/components/checkout/CustomerPicker";

const STEPS_CUSTOMER = ["بازبینی سبد", "اطلاعات تماس", "تأیید نهایی"];
// ADMIN/SUPPORT never see their own contact-info step here — an order they
// place through this customer-facing flow is never theirs, so it's replaced
// by picking/entering who it's actually for.
const STEPS_STAFF = ["بازبینی سبد", "انتخاب مشتری", "تأیید نهایی"];

const inputClass =
  "w-full rounded-lg border border-foreground/10 bg-foreground/5 px-4 py-3 text-sm text-foreground placeholder:text-foreground/40 outline-none transition-colors focus:border-accent-500/50";

type Contact = { name: string; email: string; phone: string; address: string };
type ManualCustomer = { name: string; phone: string; address: string };

export default function CheckoutFlow({ contact, isStaff }: { contact: Contact; isStaff: boolean }) {
  const { items, totalPrice, setQuantity, removeItem, clear } = useCart();
  const { showToast } = useToast();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Staff-only state (steps 1/3 stay shared with the customer flow).
  const [customerMode, setCustomerMode] = useState<"existing" | "manual">("existing");
  const [selectedCustomer, setSelectedCustomer] = useState<SelectedCustomer | null>(null);
  const [manualCustomer, setManualCustomer] = useState<ManualCustomer>({ name: "", phone: "", address: "" });
  const [customerError, setCustomerError] = useState<string | null>(null);

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

  const goToStep3 = () => {
    if (!isStaff) {
      setStep(3);
      return;
    }
    if (customerMode === "existing") {
      if (!selectedCustomer) {
        setCustomerError("یک مشتری را از لیست انتخاب کنید.");
        return;
      }
    } else {
      const name = manualCustomer.name.trim();
      if (!name) {
        setCustomerError("نام مشتری الزامی است.");
        return;
      }
      if (manualCustomer.phone.trim() && !isValidIranPhone(manualCustomer.phone)) {
        setCustomerError("شماره تماس معتبر نیست.");
        return;
      }
    }
    setCustomerError(null);
    setStep(3);
  };

  const submitOrder = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/account/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          ...(isStaff && customerMode === "existing" && selectedCustomer ? { customerId: selectedCustomer.id } : {}),
          ...(isStaff && customerMode === "manual"
            ? {
                manualCustomer: {
                  name: manualCustomer.name.trim(),
                  phone: manualCustomer.phone.trim(),
                  address: manualCustomer.address.trim(),
                },
              }
            : {}),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        showToast(data?.error ?? "ثبت سفارش با خطا مواجه شد.", "error");
        setSubmitting(false);
        return;
      }
      clear();
      showToast("سفارش با موفقیت ثبت شد.", "success");
      router.push(isStaff ? "/account/admin/orders" : "/account/orders");
    } catch {
      showToast("ارتباط با سرور برقرار نشد. دوباره تلاش کنید.", "error");
      setSubmitting(false);
    }
  };

  const customerSummaryLabel = isStaff
    ? customerMode === "existing"
      ? selectedCustomer?.label ?? "—"
      : manualCustomer.name || "—"
    : null;

  return (
    <div>
      <StepIndicator steps={isStaff ? STEPS_STAFF : STEPS_CUSTOMER} currentStep={step} onStepClick={setStep} />

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

      {step === 2 && !isStaff && (
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
              onClick={goToStep3}
              className="flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-accent-500 px-6 text-sm font-bold text-primary-foreground shadow-lg shadow-accent-500/25 transition-all hover:-translate-y-0.5 hover:bg-accent-600"
            >
              مرحله‌ی بعد
              <ArrowLeft className="size-4" />
            </button>
          </div>
        </div>
      )}

      {step === 2 && isStaff && (
        <div>
          <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-5">
            <p className="mb-1 text-sm font-bold">این سفارش برای کدام مشتری است؟</p>
            <p className="mb-4 text-xs text-foreground/50">
              حساب شما ({contact.email}) هرگز صاحب این سفارش نمی‌شود — باید یک مشتری واقعی را مشخص کنید.
            </p>

            <div role="tablist" className="mb-4 inline-flex rounded-lg border border-foreground/10 bg-foreground/5 p-0.5 text-xs">
              {(
                [
                  { value: "existing" as const, label: "مشتری موجود" },
                  { value: "manual" as const, label: "مشتری جدید" },
                ]
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  role="tab"
                  aria-selected={customerMode === opt.value}
                  onClick={() => {
                    setCustomerMode(opt.value);
                    setCustomerError(null);
                  }}
                  className={`min-h-9 rounded-md px-3.5 font-medium transition-colors ${
                    customerMode === opt.value ? "bg-accent-500 text-white" : "text-foreground/60 hover:text-foreground/80"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {customerMode === "existing" ? (
              <div className="flex items-center gap-2">
                <CustomerPicker selected={selectedCustomer} onSelect={setSelectedCustomer} onClear={() => setSelectedCustomer(null)} />
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  value={manualCustomer.name}
                  onChange={(e) => setManualCustomer((p) => ({ ...p, name: e.target.value }))}
                  placeholder="نام مشتری *"
                  aria-label="نام مشتری"
                  className={inputClass}
                />
                <input
                  value={manualCustomer.phone}
                  onChange={(e) => setManualCustomer((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="شماره تماس"
                  aria-label="شماره تماس مشتری"
                  dir="ltr"
                  className={`${inputClass} text-right`}
                />
                <textarea
                  value={manualCustomer.address}
                  onChange={(e) => setManualCustomer((p) => ({ ...p, address: e.target.value }))}
                  placeholder="آدرس"
                  aria-label="آدرس مشتری"
                  rows={2}
                  className={inputClass}
                />
                <p className="text-xs text-foreground/40">
                  برای این مشتری یک حساب سبک (بدون ایمیل/رمز عبور واقعی) ساخته می‌شود؛ فقط برای اتصال این سفارش — امکان ورود به سایت ندارد.
                </p>
              </div>
            )}

            {customerError && <p className="mt-3 text-xs text-red-400">{customerError}</p>}
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
              onClick={goToStep3}
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
          {isStaff && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-accent-500/20 bg-accent-500/5 px-4 py-3 text-sm">
              <User className="size-4 shrink-0 text-accent-400" />
              <span className="text-foreground/60">این سفارش برای:</span>
              <span className="font-semibold">{customerSummaryLabel}</span>
            </div>
          )}

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
            {isStaff
              ? "با ثبت سفارش، این سفارش به نام مشتری بالا ثبت می‌شود."
              : "با ثبت سفارش، درخواست شما برای تیم ما ارسال می‌شود و پس از بررسی، برای هماهنگی نهایی و تسویه‌حساب با شما تماس گرفته خواهد شد."}
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
