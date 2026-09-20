import type { Metadata } from "next";
import CartPageContent from "@/components/CartPageContent";

export const metadata: Metadata = {
  title: "سبد خرید",
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return (
    <section className="container py-8 sm:py-12">
      <h1 className="mb-6 text-2xl font-bold sm:text-3xl">سبد خرید</h1>
      <CartPageContent />
    </section>
  );
}
