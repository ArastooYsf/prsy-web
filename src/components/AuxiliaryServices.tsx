"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, ShieldCheck, ChatCircleText, ArrowLeft } from "@phosphor-icons/react";
import { fadeInUp, staggerContainer, viewportOnce } from "@/lib/motion";

const SERVICES = [
  {
    title: "نصب و راه‌اندازی",
    description:
      "نصب و راه‌اندازی دستگاه در محل مشتری، توسط تیم فنی مجرب.",
    icon: <MapPin size={24} />,
  },
  {
    title: "قرارداد گارانتی و نگهداری متناسب با نیاز شما",
    description:
      "بر اساس نیاز و مذاکره با هر مشتری، قرارداد گارانتی و سرویس دوره‌ای به‌صورت اختصاصی بسته می‌شود.",
    icon: <ShieldCheck size={24} />,
    cta: { label: "درخواست مشاوره", href: "/consultation" },
  },
  {
    title: "مشاوره تخصصی",
    description:
      "مشاوره رایگان برای انتخاب نوع و ظرفیت مناسب دستگاه بر اساس نیاز شما.",
    icon: <ChatCircleText size={24} />,
  },
];

export default function AuxiliaryServices() {
  return (
    <section className="section-padding relative border-t border-foreground/10">
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
            خدمات جانبی
          </motion.span>
          <motion.h2
            variants={fadeInUp}
            className="mt-3 text-balance text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl"
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
              className="flex flex-col rounded-2xl border border-transparent bg-foreground/[0.03] p-7"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-500/10 text-accent-400">
                {service.icon}
              </div>
              <h3 className="mt-5 text-lg font-bold">{service.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-foreground/70">
                {service.description}
              </p>
              {service.cta && (
                <Link
                  href={service.cta.href}
                  className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-accent-400 underline-offset-4 transition-colors hover:text-foreground"
                >
                  {service.cta.label}
                  <ArrowLeft size={16} weight="bold" />
                </Link>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
