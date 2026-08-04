"use client";

import { motion } from "framer-motion";
import { fadeInUp, staggerContainer, viewportOnce } from "@/lib/motion";

const FEATURES = [
  {
    index: "۰۱",
    title: "طراحی و مهندسی دقیق",
    description:
      "تیم مهندسی ما با بهره‌گیری از استانداردهای بین‌المللی، طراحی مفهومی تا تفصیلی پروژه‌های صنعتی را با بالاترین دقت انجام می‌دهد.",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M12 3v9m0 0l8-4.5M12 12L4 7.5M12 12v9"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    index: "۰۲",
    title: "اجرا و مدیریت پیمان",
    description:
      "با تیمی مجرب و تجهیزات به‌روز، پروژه‌ها را طبق زمان‌بندی و بودجه مصوب و با بالاترین استانداردهای ایمنی اجرا می‌کنیم.",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <path
          d="M14.5 6.5L17.5 9.5M4 20l4.5-1.2 9-9-3.3-3.3-9 9L4 20z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M17 4l3 3-1.5 1.5L15.5 5.5 17 4z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    index: "۰۳",
    title: "بازرسی و تضمین کیفیت",
    description:
      "پایش مستمر کیفیت در تمامی مراحل پروژه، از تأمین مواد اولیه تا راه‌اندازی نهایی، تضمین‌کننده دوام و ایمنی زیرساخت شماست.",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 3l7 3v5.5c0 4.5-3 7.5-7 9.5-4-2-7-5-7-9.5V6l7-3z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M9 12l2 2 4-4"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

export default function Features() {
  return (
    <section id="features" className="section-padding relative">
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
            خدمات ما
          </motion.span>
          <motion.h2
            variants={fadeInUp}
            className="mt-3 text-balance text-3xl font-black leading-tight sm:text-4xl lg:text-5xl"
          >
            هر آنچه یک پروژه صنعتی برای موفقیت نیاز دارد
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            className="mt-4 text-balance leading-7 text-foreground/70"
          >
            از اولین طرح روی کاغذ تا بهره‌برداری نهایی؛ در هر مرحله همراه شما
            هستیم.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer(0.15)}
          className="mt-14 grid grid-cols-1 gap-6 sm:mt-16 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8"
        >
          {FEATURES.map((feature) => (
            <motion.div
              key={feature.title}
              variants={fadeInUp}
              whileHover={{ y: -8 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="group relative overflow-hidden rounded-2xl border border-transparent bg-white/[0.03] p-8 transition-all duration-300 hover:border-accent-500/40 hover:shadow-xl hover:shadow-black/10"
            >
              <span className="pointer-events-none absolute -top-3 left-4 text-6xl font-black text-white/[0.06] transition-colors duration-300 group-hover:text-accent-500/10">
                {feature.index}
              </span>

              <div className="relative flex h-14 w-14 items-center justify-center rounded-xl bg-accent-500/10 text-accent-400 shadow-sm shadow-accent-500/10 transition-all duration-300 group-hover:scale-105 group-hover:bg-accent-500/20">
                {feature.icon}
              </div>

              <h3 className="relative mt-6 text-xl font-bold">
                {feature.title}
              </h3>
              <p className="relative mt-3 leading-7 text-foreground/70">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
