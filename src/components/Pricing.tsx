"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer, viewportOnce } from "@/lib/motion";

const APPROACH = [
  {
    title: "مشاوره و امکان‌سنجی",
    description: "بازدید فنی، ارزیابی اولیه و برآورد زمان‌بندی پروژه شما.",
  },
  {
    title: "طراحی و مهندسی",
    description: "طراحی مفهومی و تفصیلی، متناسب با مقیاس و پیچیدگی پروژه.",
  },
  {
    title: "اجرای کامل پروژه (EPC)",
    description: "مدیریت پیمان، تأمین تجهیزات و اجرای سرتاسری پروژه.",
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="section-padding relative border-t border-white/10">
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
            همکاری با ما
          </motion.span>
          <motion.h2
            variants={fadeInUp}
            className="mt-3 text-balance text-3xl font-black leading-tight sm:text-4xl lg:text-5xl"
          >
            شرایط همکاری متناسب با پروژه شما
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            className="mt-4 text-balance leading-7 text-foreground/70"
          >
            از مشاوره اولیه تا اجرای کامل پروژه، شرایط همکاری و قیمت بر اساس
            نیاز، مقیاس و نوع پروژه شما تعیین می‌شود. برای دریافت مشاوره
            تخصصی و استعلام قیمت دقیق، با ما در ارتباط باشید.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer(0.12)}
          className="mx-auto mt-14 grid max-w-3xl grid-cols-1 gap-6 sm:mt-16 sm:grid-cols-3"
        >
          {APPROACH.map((item) => (
            <motion.div
              key={item.title}
              variants={fadeInUp}
              className="rounded-2xl border border-transparent bg-white/[0.03] p-6 text-center"
            >
              <h3 className="text-base font-bold">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-foreground/70">
                {item.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={fadeInUp}
          className="mt-12 flex justify-center sm:mt-14"
        >
          <Link
            href="/consultation"
            className="inline-flex items-center gap-2 rounded-full bg-accent-500 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-accent-500/25 transition-colors hover:bg-accent-600"
          >
            درخواست مشاوره و استعلام قیمت
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="shrink-0">
              <path
                d="M19 12H5M5 12L11 6M5 12L11 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
