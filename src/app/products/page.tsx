import type { Metadata } from "next";
import ProductCategories from "@/components/ProductCategories";
import AuxiliaryServices from "@/components/AuxiliaryServices";
import { getProductCategories } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "محصولات",
  description:
    "دیزل ژنراتور، موتور برق، قطعات یدکی، موتور ژنراتور و دینام/آلترناتور با برندهای معتبر جهانی؛ به‌صورت نو و دست‌دوم.",
};

export default async function ProductsPage() {
  const categories = await getProductCategories();

  return (
    <>
      <section className="relative overflow-hidden pb-8 pt-14 sm:pt-20">
        <div className="pointer-events-none absolute inset-0 bg-grid-pattern bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_40%,transparent_100%)]" />
        <div className="container relative text-center">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-foreground/70 backdrop-blur-sm sm:text-sm">
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
        </div>
      </section>

      <ProductCategories categories={categories} />
      <AuxiliaryServices />
    </>
  );
}
