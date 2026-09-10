import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ThemedGridBackdrop from "@/components/ui/ThemedGridBackdrop";
import { prisma } from "@/lib/prisma";
import { formatNumber } from "@/lib/format-number";

export const metadata: Metadata = {
  title: "همه‌ی محصولات",
  description: "فهرست کامل محصولات پرسی؛ دیزل ژنراتور، موتور برق، قطعات یدکی و موتور ژنراتور از برندهای معتبر جهانی.",
};

export const dynamic = "force-dynamic";

export default async function AllProductsPage() {
  const count = await prisma.product.count({ where: { isActive: true, deletedAt: null } });

  return (
    <section className="relative overflow-hidden pb-16 pt-14 sm:pt-20">
      <ThemedGridBackdrop />
      <div className="container relative text-center">
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-foreground/5 px-4 py-1.5 text-xs font-medium text-foreground/70 backdrop-blur-sm sm:text-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-500" />
          کاتالوگ محصولات
        </span>
        <h1 className="mx-auto max-w-3xl text-balance text-3xl font-bold leading-tight sm:text-5xl">
          همه‌ی محصولات
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-balance leading-7 text-foreground/70">
          {count > 0
            ? `${formatNumber(count)} محصول فعال در کاتالوگ ثبت شده است. نمایش گرید و فیلترها به‌زودی در دسترس قرار می‌گیرد.`
            : "کاتالوگ محصولات به‌زودی در دسترس قرار می‌گیرد."}
        </p>
        <Link
          href="/products"
          className="mt-8 inline-flex min-h-11 items-center gap-1.5 rounded-full border border-foreground/10 px-5 text-sm font-medium text-foreground/70 transition-colors hover:border-accent-500/40 hover:text-accent-400"
        >
          <ArrowRight className="size-4" />
          بازگشت به دسته‌بندی محصولات
        </Link>
      </div>
    </section>
  );
}
