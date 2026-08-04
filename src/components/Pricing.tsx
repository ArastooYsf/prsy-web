"use client";

import { motion } from "framer-motion";
import { fadeInUp, staggerContainer, viewportOnce } from "@/lib/motion";

const PLANS = [
  {
    name: "مشاوره و امکان‌سنجی",
    description: "برای کارفرمایانی که در مرحله ارزیابی اولیه پروژه هستند.",
    price: "۲۵",
    priceNote: "شروع از میلیون تومان",
    popular: false,
    features: [
      "بازدید و ارزیابی فنی سایت",
      "تهیه گزارش امکان‌سنجی",
      "برآورد اولیه هزینه و زمان‌بندی",
      "یک جلسه مشاوره تخصصی",
    ],
    cta: "شروع مشاوره",
  },
  {
    name: "طراحی و مهندسی تفصیلی",
    description:
      "مناسب پروژه‌هایی که وارد فاز طراحی و مستندسازی فنی شده‌اند.",
    price: "۱۲۰",
    priceNote: "شروع از میلیون تومان",
    popular: true,
    features: [
      "طراحی مفهومی و تفصیلی",
      "تهیه نقشه‌های اجرایی",
      "انتخاب تجهیزات و تأمین‌کنندگان",
      "نظارت بر مراحل اولیه اجرا",
      "پشتیبانی فنی در طول پروژه",
    ],
    cta: "درخواست طراحی",
  },
  {
    name: "اجرای کامل پروژه (EPC)",
    description:
      "برای پروژه‌های بزرگ صنعتی که نیاز به اجرای سرتاسری دارند.",
    price: "قیمت‌گذاری اختصاصی",
    priceNote: "بر اساس ابعاد پروژه",
    popular: false,
    features: [
      "مدیریت کامل پیمان (EPC)",
      "تأمین تجهیزات و مصالح",
      "اجرای فیزیکی پروژه",
      "بازرسی و تضمین کیفیت",
      "تحویل و راه‌اندازی نهایی",
    ],
    cta: "درخواست پیش‌فاکتور",
  },
];

function CheckIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      className="shrink-0"
    >
      <path
        d="M20 6L9 17l-5-5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Pricing() {
  return (
    <section id="pricing" className="section-padding relative border-t border-graphite-light/40">
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
            پلن‌های همکاری
          </motion.span>
          <motion.h2
            variants={fadeInUp}
            className="mt-3 text-balance text-3xl font-black leading-tight sm:text-4xl lg:text-5xl"
          >
            بسته‌ای متناسب با نیاز پروژه شما
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            className="mt-4 text-balance leading-7 text-text-secondary"
          >
            بسته به مقیاس و پیچیدگی پروژه، مسیر همکاری را با هم انتخاب می‌کنیم.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer(0.15)}
          className="mt-14 grid grid-cols-1 items-start gap-6 sm:mt-16 lg:grid-cols-3 lg:gap-8"
        >
          {PLANS.map((plan) => (
            <motion.div
              key={plan.name}
              variants={fadeInUp}
              whileHover={{ y: plan.popular ? 0 : -8 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className={`relative flex h-full flex-col rounded-2xl bg-graphite-light p-8 ${
                plan.popular
                  ? "border-2 border-accent-orange shadow-2xl shadow-accent-orange/10 lg:-mt-4 lg:mb-4"
                  : "border border-transparent hover:border-text-secondary/20"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-accent-orange px-4 py-1.5 text-xs font-bold text-text-primary">
                  پیشنهاد ویژه
                </span>
              )}

              <h3 className="text-xl font-bold">{plan.name}</h3>
              <p className="mt-2 text-sm leading-6 text-text-secondary">
                {plan.description}
              </p>

              <div className="mt-6 flex items-baseline gap-2">
                <span
                  className={`font-black ${
                    plan.price.length > 4 ? "text-2xl" : "text-4xl"
                  }`}
                >
                  {plan.price}
                </span>
              </div>
              <p className="mt-1 text-xs text-text-secondary">
                {plan.priceNote}
              </p>

              <ul className="mt-8 flex-1 space-y-4">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-3 text-sm text-text-secondary"
                  >
                    <span
                      className={
                        plan.popular ? "text-accent-orange" : "text-accent-orange/70"
                      }
                    >
                      <CheckIcon />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>

              <motion.a
                href="#top"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className={`mt-8 block rounded-full px-6 py-3.5 text-center text-sm font-semibold transition-colors ${
                  plan.popular
                    ? "bg-accent-orange text-text-primary shadow-lg shadow-accent-orange/25 hover:bg-accent-orange/90"
                    : "border border-graphite-light text-foreground hover:bg-graphite"
                }`}
              >
                {plan.cta}
              </motion.a>
            </motion.div>
          ))}
        </motion.div>

        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={fadeInUp}
          className="mt-10 text-center text-sm text-text-secondary"
        >
          همه بسته‌ها شامل مشاوره اولیه رایگان هستند. برای دریافت پیش‌فاکتور
          دقیق با کارشناسان ما تماس بگیرید.
        </motion.p>
      </div>
    </section>
  );
}
