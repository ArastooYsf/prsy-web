"use client";

import { motion } from "framer-motion";
import { Cube, PencilLine, ShieldCheck } from "@phosphor-icons/react";
import { fadeInUp, staggerContainer, viewportOnce } from "@/lib/motion";

const FEATURES = [
  {
    index: "۰۱",
    title: "طراحی و مهندسی دقیق",
    description:
      "تیم مهندسی ما با بهره‌گیری از استانداردهای بین‌المللی، طراحی مفهومی تا تفصیلی پروژه‌های صنعتی را با بالاترین دقت انجام می‌دهد.",
    icon: <Cube size={26} />,
  },
  {
    index: "۰۲",
    title: "اجرا و مدیریت پیمان",
    description:
      "با تیمی مجرب و تجهیزات به‌روز، پروژه‌ها را طبق زمان‌بندی و بودجه مصوب و با بالاترین استانداردهای ایمنی اجرا می‌کنیم.",
    icon: <PencilLine size={26} />,
  },
  {
    index: "۰۳",
    title: "بازرسی و تضمین کیفیت",
    description:
      "پایش مستمر کیفیت در تمامی مراحل پروژه، از تأمین مواد اولیه تا راه‌اندازی نهایی، تضمین‌کننده دوام و ایمنی زیرساخت شماست.",
    icon: <ShieldCheck size={26} />,
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
            className="mt-3 text-balance text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl"
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
              className="group relative overflow-hidden rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-8 transition-colors duration-300 hover:border-accent-500/30"
            >
              <span className="pointer-events-none absolute -top-3 left-4 text-6xl font-bold text-foreground/[0.06] transition-colors duration-300 group-hover:text-accent-500/10">
                {feature.index}
              </span>

              <div className="relative flex h-14 w-14 items-center justify-center rounded-lg bg-accent-500/10 text-accent-400 transition-colors duration-300 group-hover:bg-accent-500/20">
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
