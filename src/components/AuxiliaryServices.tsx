"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer, viewportOnce } from "@/lib/motion";

const SERVICES = [
  {
    title: "نصب و راه‌اندازی",
    description:
      "نصب و راه‌اندازی دستگاه در محل مشتری، توسط تیم فنی مجرب.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 21s7-6.5 7-11a7 7 0 10-14 0c0 4.5 7 11 7 11z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="10" r="2.6" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    ),
  },
  {
    title: "قرارداد گارانتی و نگهداری متناسب با نیاز شما",
    description:
      "بر اساس نیاز و مذاکره با هر مشتری، قرارداد گارانتی و سرویس دوره‌ای به‌صورت اختصاصی بسته می‌شود.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 2.5l7 3.5v5.2c0 5-3 8.3-7 9.8-4-1.5-7-4.8-7-9.8V6l7-3.5z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path d="M9 12l2 2 4-4.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    cta: { label: "درخواست مشاوره", href: "/#pricing" },
  },
  {
    title: "مشاوره تخصصی",
    description:
      "مشاوره رایگان برای انتخاب نوع و ظرفیت مناسب دستگاه بر اساس نیاز شما.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M4 4.5h16v11.5H8.5L4 20V4.5z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M9.5 9.3a2.6 2.6 0 014.9 1.1c0 1.7-2.4 1.9-2.4 3.4"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <circle cx="12" cy="16.7" r="0.15" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    ),
  },
];

export default function AuxiliaryServices() {
  return (
    <section className="section-padding relative border-t border-graphite-light/40">
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
            خدمات جانبی
          </motion.span>
          <motion.h2
            variants={fadeInUp}
            className="mt-3 text-balance text-3xl font-black leading-tight sm:text-4xl lg:text-5xl"
          >
            پشتیبانی کامل، از نصب تا نگهداری
          </motion.h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer(0.15)}
          className="mt-14 grid grid-cols-1 gap-6 sm:mt-16 lg:grid-cols-3 lg:gap-8"
        >
          {SERVICES.map((service) => (
            <motion.div
              key={service.title}
              variants={fadeInUp}
              className="flex flex-col rounded-2xl border border-transparent bg-graphite-light p-7"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-orange/10 text-accent-orange">
                {service.icon}
              </div>
              <h3 className="mt-5 text-lg font-bold">{service.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-text-secondary">
                {service.description}
              </p>
              {service.cta && (
                <Link
                  href={service.cta.href}
                  className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-foreground underline-offset-4 transition-colors hover:underline"
                >
                  {service.cta.label}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-accent-orange">
                    <path
                      d="M19 12H5M5 12L11 6M5 12L11 18"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Link>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
