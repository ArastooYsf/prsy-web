"use client";

import { motion } from "framer-motion";
import { fadeInUp, staggerContainer, viewportOnce } from "@/lib/motion";

type Condition = "new" | "used" | "service";

type Category = {
  id: string;
  title: string;
  description: string;
  conditions: Condition[];
  brands: string[];
  icon: React.ReactNode;
};

const CATEGORIES: Category[] = [
  {
    id: "diesel-generators",
    title: "دیزل ژنراتور",
    description: "دیزل ژنراتورهای صنعتی و تجاری در ظرفیت‌های مختلف",
    conditions: ["new", "used"],
    brands: ["کاترپیلار", "کامینز", "پرکینز", "ولوو", "ویچای", "جی‌ام (GM)"],
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="7" width="14" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M11.5 10.5l-3 3.6h2.1l-1 2.9 3.4-3.6h-2l0.5-2.9z"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
        <path d="M19 10h2M19 14h2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "power-engines",
    title: "موتور برق",
    description: "موتور برق‌های قابل‌حمل و ثابت برای مصارف خانگی و تجاری",
    conditions: ["new", "used"],
    brands: ["کواکس", "فروسکی", "هیوندا", "سایر برندها"],
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M7 11h10v3a5 5 0 01-5 5 5 5 0 01-5-5v-3z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path d="M9 7v4M15 7v4M12 19v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "spare-parts",
    title: "قطعات یدکی دیزل ژنراتور و موتور برق",
    description: "قطعات یدکی اورجینال برای انواع دیزل ژنراتور و موتور برق",
    conditions: ["new"],
    brands: ["کاترپیلار", "ولوو", "کامینز", "ویچای", "پرکینز", "جی‌ام"],
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M12 2.5v2.4M12 19.1v2.4M4.2 4.2l1.7 1.7M18.1 18.1l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.2 19.8l1.7-1.7M18.1 5.9l1.7-1.7"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    id: "generator-engines",
    title: "موتور ژنراتور",
    description: "موتور به‌صورت مجزا، جدای از ژنراتور کامل",
    conditions: ["new", "used"],
    brands: [
      "کاترپیلار",
      "کامینز",
      "پرکینز",
      "ولوو",
      "ویچای",
      "جی‌ام",
      "کواکس",
      "فروسکی",
      "هیوندا",
    ],
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="8" y="3" width="8" height="6" rx="1" stroke="currentColor" strokeWidth="1.6" />
        <path d="M10.5 9v3M13.5 9v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <rect x="6" y="12" width="12" height="8" rx="1" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    ),
  },
  {
    id: "alternators",
    title: "دینام / آلترناتور",
    description: "دینام و آلترناتورهای سازگار با انواع دیزل ژنراتور",
    conditions: ["new", "used"],
    brands: ["استمفورد", "مک‌الت", "کینز", "مارلی"],
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="6.5" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M12 5.5v3M12 15.5v3M5.5 12h3M15.5 12h3M7.5 7.5l2 2M14.5 14.5l2 2M7.5 16.5l2-2M14.5 9.5l2-2"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    id: "overhaul",
    title: "خدمات اورهال و تعمیرات",
    description: "اورهال و تعمیرات تخصصی دیزل ژنراتور و موتور برق",
    conditions: ["service"],
    brands: [
      "کاترپیلار",
      "کامینز",
      "پرکینز",
      "ولوو",
      "ویچای",
      "جی‌ام",
      "و سایر برندها",
    ],
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M14.7 6.3a4 4 0 00-5.4 5.4L3.5 17.5l3 3 5.8-5.8a4 4 0 005.4-5.4l-2.8 2.8-2-2 2.8-2.8z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

const CONDITION_BADGE: Record<Condition, { label: string; className: string }> = {
  new: {
    label: "نو",
    className: "border-transparent bg-accent-orange text-text-primary",
  },
  used: {
    label: "دست‌دوم",
    className: "border-transparent bg-graphite text-text-secondary",
  },
  service: {
    label: "خدمات",
    className: "border-transparent bg-accent-amber text-graphite",
  },
};

export default function ProductCategories() {
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
            className="text-sm font-semibold text-accent-amber"
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
            className="mt-4 text-balance leading-7 text-text-secondary"
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
          {CATEGORIES.map((category) => (
            <motion.div
              key={category.id}
              id={category.id}
              variants={fadeInUp}
              whileHover={{ y: -8 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="scroll-mt-28 flex flex-col rounded-2xl border border-transparent bg-graphite-light p-7 transition-colors hover:border-accent-orange/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-orange/10 text-accent-orange">
                  {category.icon}
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
              <p className="mt-2 text-sm leading-6 text-text-secondary">
                {category.description}
              </p>

              <div className="mt-5 flex flex-1 flex-wrap items-end gap-1.5">
                {category.brands.map((brand) => (
                  <span
                    key={brand}
                    className="rounded-md bg-graphite px-2 py-1 text-xs text-text-secondary"
                  >
                    {brand}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
