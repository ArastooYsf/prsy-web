import type { Metadata } from "next";
import Link from "next/link";
import ProductCategories from "@/components/ProductCategories";
import AuxiliaryServices from "@/components/AuxiliaryServices";
import { getMenuTaxonomy } from "@/lib/menu-taxonomy";
import ThemedGridBackdrop from "@/components/ui/ThemedGridBackdrop";
import ScrollHintArrow from "@/components/ui/ScrollHintArrow";

export const metadata: Metadata = {
  title: "محصولات",
  description:
    "دیزل ژنراتور، موتور برق، قطعات یدکی، موتور ژنراتور و دینام/آلترناتور با برندهای معتبر جهانی؛ به‌صورت نو و دست‌دوم.",
};

export default async function ProductsPage() {
  const { categories } = await getMenuTaxonomy();

  return (
    <>
      <section className="relative overflow-hidden pb-12 pt-14 sm:pb-14 sm:pt-20">
        <ThemedGridBackdrop />
        <div className="container relative text-center">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-foreground/5 px-4 py-1.5 text-xs font-medium text-foreground/70 backdrop-blur-sm sm:text-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-500" />
            محصولات و خدمات
          </span>
          <h1 className="mx-auto max-w-3xl text-balance text-3xl font-bold leading-tight sm:text-5xl">
            دیزل ژنراتور، موتور برق و قطعات یدکی
            <span className="text-accent-soft"> با بهترین کیفیت و قیمت</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-balance leading-7 text-foreground/70">
            تأمین انواع دیزل ژنراتور، موتور برق، قطعات یدکی، موتور ژنراتور و
            دینام/آلترناتور با برندهای معتبر جهانی، به‌صورت نو و دست‌دوم.
          </p>
          <div className="mt-8">
            <Link
              href="/products/all"
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-accent-500 px-6 text-sm font-semibold text-primary-foreground shadow-lg shadow-accent-500/25 transition-colors hover:bg-accent-600"
            >
              مشاهده‌ی همه‌ی محصولات
            </Link>
          </div>
        </div>

        <ScrollHintArrow
          href="#product-categories"
          label="مشاهده‌ی دسته‌بندی محصولات"
          className="bottom-0 text-foreground/40 hover:text-foreground/80 sm:bottom-1"
        />
      </section>

      <ProductCategories categories={categories} />
      <AuxiliaryServices />
    </>
  );
}
