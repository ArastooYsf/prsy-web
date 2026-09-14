"use client";

import { motion } from "framer-motion";
import { Quotes } from "@phosphor-icons/react";
import Counter from "@/components/Counter";
import { fadeInUp, staggerContainer, viewportOnce } from "@/lib/motion";

const STATS = [
  { value: 9, suffix: "+", label: "سال سابقه فعالیت" },
  { value: 200, suffix: "+", label: "پروژه تکمیل‌شده" },
  { value: 40, suffix: "+", label: "مهندس و متخصص" },
  { value: 98, suffix: "٪", label: "رضایت کارفرمایان" },
];

const SECTORS = [
  "فولاد و آلومینیوم",
  "نفت، گاز و پتروشیمی",
  "سیمان و مصالح ساختمانی",
  "معدن و فرآوری",
  "نیروگاهی و انرژی",
  "راه و زیرساخت",
];

const TESTIMONIALS = [
  {
    quote:
      "همکاری با تیم یاشار در پروژه توسعه خط تولید، نمونه‌ای از دقت مهندسی و پایبندی به زمان‌بندی بود. از ایمنی اجرا تا کیفیت تحویل، همه‌چیز مطابق تعهد پیش رفت.",
    name: "علی رضایی",
    role: "مدیر پروژه‌های زیرساختی",
  },
  {
    quote:
      "بازرسی مستمر و گزارش‌دهی شفاف تیم فنی باعث شد در طول اجرای پروژه، همیشه از وضعیت کار مطلع باشیم. تجربه‌ای مطمئن برای یک کارفرمای صنعتی.",
    name: "سارا احمدی",
    role: "مدیر فنی مجتمع صنعتی",
  },
  {
    quote:
      "از مرحله طراحی مفهومی تا راه‌اندازی نهایی، تیم یاشار راهکارهایی متناسب با محدودیت‌های واقعی پروژه ارائه داد و بودجه پروژه را نیز رعایت کرد.",
    name: "محمد کریمی",
    role: "کارفرمای پروژه احداث نیروگاه",
  },
];

export default function SocialProof() {
  return (
    <section id="clients" className="section-padding relative border-t border-foreground/10">
      <div className="container">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer(0.1)}
          className="grid grid-cols-2 gap-8 sm:grid-cols-4 sm:gap-6"
        >
          {STATS.map((stat) => (
            <motion.div
              key={stat.label}
              variants={fadeInUp}
              className="text-center"
            >
              <div className="text-4xl font-bold text-accent-soft sm:text-5xl">
                <Counter value={stat.value} suffix={stat.suffix} />
              </div>
              <p className="mt-2 text-sm text-foreground/70 sm:text-base">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer(0.06, 0.1)}
          className="mt-14 flex flex-wrap items-center justify-center gap-3 sm:mt-16"
        >
          {SECTORS.map((sector) => (
            <motion.span
              key={sector}
              variants={fadeInUp}
              className="rounded-full border border-transparent bg-foreground/[0.03] px-4 py-2 text-xs font-medium text-foreground/70 sm:text-sm"
            >
              {sector}
            </motion.span>
          ))}
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer(0.15, 0.1)}
          className="mt-14 grid grid-cols-1 gap-6 sm:mt-20 md:grid-cols-3 lg:gap-8"
        >
          {TESTIMONIALS.map((testimonial) => (
            <motion.div
              key={testimonial.name}
              variants={fadeInUp}
              className="flex flex-col rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-7"
            >
              <Quotes size={28} weight="fill" className="mb-4 text-accent-400/50" />
              <p className="flex-1 leading-7 text-foreground/70">
                {testimonial.quote}
              </p>
              <div className="mt-6 flex items-center gap-3 border-t border-foreground/10 pt-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {testimonial.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold">{testimonial.name}</p>
                  <p className="text-xs text-foreground/60">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
