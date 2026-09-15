import type { Metadata } from "next";
import { ShoppingCart } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";

export const metadata: Metadata = {
  title: "سبد خرید",
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return (
    <section className="container py-14 sm:py-20">
      <div className="mx-auto max-w-md">
        <EmptyState
          icon={<ShoppingCart />}
          title="سبد خرید شما خالی است"
          description="این بخش فعلاً فقط رابط کاربری‌ست؛ فعال‌سازی کامل سبد خرید (افزودن محصول، پرداخت، تسویه‌حساب) نیاز به تصمیم درباره‌ی جریان خرید سایت دارد."
          action={{ label: "مشاهده‌ی محصولات", href: "/products" }}
        />
      </div>
    </section>
  );
}
