"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { fadeInUp, staggerContainer, viewportOnce } from "@/lib/motion";
import { CATEGORY_ICONS } from "@/lib/category-icons";
import type { MenuCategory } from "@/lib/menu-taxonomy";

type ProductCategoriesProps = {
  categories: MenuCategory[];
};

export default function ProductCategories({ categories }: ProductCategoriesProps) {
  return (
    <section className="section-padding relative">
      <div className="container">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer(0.1)}
          className="mx-auto max-w-2xl text-center"
        >
          <motion.span variants={fadeInUp} className="text-sm font-semibold text-accent-400">
            دسته‌بندی محصولات
          </motion.span>
          <motion.h2 variants={fadeInUp} className="mt-3 text-balance text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
            محصولات ما، با برندهای معتبر جهانی
          </motion.h2>
          <motion.p variants={fadeInUp} className="mt-4 text-balance leading-7 text-foreground/70">
            تمامی محصولات به‌صورت نو و دست‌دوم عرضه می‌شوند؛ به‌جز قطعات یدکی که فقط به‌صورت نو ارائه می‌شود.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer(0.12)}
          className="mt-14 grid grid-cols-1 gap-6 sm:mt-16 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8"
        >
          {categories.map((category) => (
            <motion.div key={category.id} variants={fadeInUp} whileHover={{ y: -8 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
              <Link
                href={`/products/${category.slug}`}
                className="group flex h-full flex-col rounded-2xl border border-transparent bg-foreground/[0.03] p-7 transition-all duration-300 hover:border-accent-500/40 hover:shadow-xl hover:shadow-black/10"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-500/10 text-accent-400 shadow-sm shadow-accent-500/10 transition-all duration-300 group-hover:scale-105 group-hover:bg-accent-500/20 [&_svg]:size-6">
                  {CATEGORY_ICONS[category.icon ?? "box"]}
                </div>
                <h3 className="mt-5 text-lg font-bold">{category.name}</h3>
                {category.children.length > 0 && (
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-foreground/60">
                    {category.children.map((c) => c.name).join("، ")}
                  </p>
                )}
                <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-semibold text-accent-400">
                  مشاهده محصولات
                  <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
                </span>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
