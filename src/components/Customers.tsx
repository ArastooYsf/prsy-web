"use client";

import { motion } from "framer-motion";
import { Bank, Drop, Factory, Storefront } from "@phosphor-icons/react";
import { fadeInUp, staggerContainer, viewportOnce } from "@/lib/motion";

const SEGMENTS = [
  {
    title: "بخش دولتی",
    description:
      "شرکت‌های بزرگ دولتی، از جمله شرکت ملی نفت ایران، شرکت ملی حفاری و بسیاری دیگر از شرکت‌های بزرگ دولتی.",
    icon: <Bank size={26} />,
  },
  {
    title: "صنعت نفت و حفاری",
    description: "شرکت‌های خصوصی بزرگ و کوچک فعال در حوزه نفت و حفاری.",
    icon: <Drop size={26} />,
  },
  {
    title: "صنایع فولادی و تولیدی",
    description: "تولیدی‌های بزرگ صنعتی و صنایع فولادی.",
    icon: <Factory size={26} />,
  },
  {
    title: "کسب‌وکارهای کوچک",
    description: "تولیدی‌ها و کسب‌وکارهای کوچک، با هر نوع و سبک فعالیت کاری.",
    icon: <Storefront size={26} />,
  },
];

export default function Customers() {
  return (
    <section id="customers" className="section-padding relative border-t border-foreground/10">
      <div className="container">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer(0.1)}
          className="mx-auto max-w-2xl text-center"
        >
          <motion.span variants={fadeInUp} className="text-sm font-semibold text-accent-400">
            مشتریان ما
          </motion.span>
          <motion.h2
            variants={fadeInUp}
            className="mt-3 text-balance text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl"
          >
            چه کسانی به ما اعتماد کرده‌اند؟
          </motion.h2>
          <motion.p variants={fadeInUp} className="mt-4 text-balance leading-7 text-foreground/70">
            از شرکت‌های بزرگ دولتی تا کسب‌وکارهای کوچک؛ این تنوع نشان می‌دهد هم توانایی اجرای پروژه‌های
            بزرگ و رسمی را داریم، هم انعطاف همکاری با کسب‌وکارهای کوچک‌تر را.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer(0.12)}
          className="mt-14 grid grid-cols-2 gap-3 sm:mt-16 sm:gap-6 lg:grid-cols-4"
        >
          {SEGMENTS.map((segment) => (
            <motion.div
              key={segment.title}
              variants={fadeInUp}
              className="group flex flex-col rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4 transition-colors duration-300 hover:border-accent-500/30 sm:p-7"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-500/10 text-accent-400 transition-colors duration-300 group-hover:bg-accent-500/20 sm:h-12 sm:w-12">
                {segment.icon}
              </div>
              <h3 className="mt-4 text-sm font-bold sm:mt-5 sm:text-lg">{segment.title}</h3>
              <p className="mt-2 text-xs leading-5 text-foreground/70 sm:mt-2.5 sm:text-sm sm:leading-6">{segment.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
