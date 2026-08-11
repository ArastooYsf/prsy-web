"use client";

import { motion } from "framer-motion";
import { fadeInUp, staggerContainer, viewportOnce } from "@/lib/motion";
import { getMediaUrl } from "@/lib/media";
import { DEFAULT_PRODUCT_CATEGORIES, type ProductCategoryContent } from "@/lib/site-content-defaults";
import { CATEGORY_ICONS } from "@/lib/category-icons";

type Condition = "new" | "used" | "service";

const CONDITION_BADGE: Record<Condition, { label: string; className: string }> = {
  new: {
    label: "نو",
    className: "border-accent-500/30 bg-accent-500/10 text-accent-400",
  },
  used: {
    label: "دست‌دوم",
    className: "border-white/10 bg-white/5 text-foreground/60",
  },
  service: {
    label: "خدمات",
    className: "border-brand-400/30 bg-brand-400/10 text-brand-300",
  },
};

type ProductCategoriesProps = {
  categories?: ProductCategoryContent[];
};

export default function ProductCategories({ categories: categoriesProp }: ProductCategoriesProps) {
  const categories = categoriesProp && categoriesProp.length > 0 ? categoriesProp : DEFAULT_PRODUCT_CATEGORIES;
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
          <motion.span
            variants={fadeInUp}
            className="text-sm font-semibold text-accent-400"
          >
            دسته‌بندی محصولات
          </motion.span>
          <motion.h2
            variants={fadeInUp}
            className="mt-3 text-balance text-3xl font-black leading-tight sm:text-4xl lg:text-5xl"
          >
            محصولات ما، با برندهای معتبر جهانی
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            className="mt-4 text-balance leading-7 text-foreground/70"
          >
            تمامی محصولات به‌صورت نو و دست‌دوم عرضه می‌شوند؛ به‌جز قطعات یدکی
            که فقط به‌صورت نو ارائه می‌شود.
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
            <motion.div
              key={category.id}
              id={category.id}
              variants={fadeInUp}
              whileHover={{ y: -8 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="group scroll-mt-28 flex flex-col overflow-hidden rounded-2xl border border-transparent bg-white/[0.03] transition-all duration-300 hover:border-accent-500/40 hover:shadow-xl hover:shadow-black/10"
            >
              {category.image && (
                <div className="aspect-video w-full overflow-hidden">
                  <img
                    src={getMediaUrl(category.image)}
                    alt={category.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              )}
              <div className="flex flex-1 flex-col p-7">
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-500/10 text-accent-400 shadow-sm shadow-accent-500/10 transition-all duration-300 group-hover:scale-105 group-hover:bg-accent-500/20">
                  {CATEGORY_ICONS[category.iconKey]}
                </div>
                <div className="flex flex-wrap justify-end gap-1.5">
                  {category.conditions.map((condition) => (
                    <span
                      key={condition}
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${CONDITION_BADGE[condition].className}`}
                    >
                      {CONDITION_BADGE[condition].label}
                    </span>
                  ))}
                </div>
              </div>

              <h3 className="mt-5 text-lg font-bold">{category.title}</h3>
              <div
                className="prose prose-invert prose-sm mt-2 max-w-none text-sm leading-6 text-foreground/70 [&_p]:m-0"
                dangerouslySetInnerHTML={{ __html: category.description }}
              />

              <div className="mt-5 flex flex-1 flex-wrap items-end gap-1.5">
                {category.brands.map((brand) => (
                  <span
                    key={brand}
                    className="rounded-md bg-white/5 px-2 py-1 text-xs text-foreground/60"
                  >
                    {brand}
                  </span>
                ))}
              </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
