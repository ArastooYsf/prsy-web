"use client";

import { motion } from "framer-motion";
import { Star, Tag, Truck } from "@phosphor-icons/react";
import Counter from "@/components/Counter";
import { fadeInUp, staggerContainer, viewportOnce } from "@/lib/motion";

const PRINCIPLES = [
  {
    title: "بهترین کیفیت",
    description: "تأمین محصولات اورجینال و باکیفیت",
    icon: <Star size={22} />,
  },
  {
    title: "بهترین قیمت",
    description: "رقابتی‌ترین قیمت ممکن در بازار",
    icon: <Tag size={22} />,
  },
  {
    title: "سریع‌ترین تحویل",
    description: "ارسال به‌موقع و بدون تأخیر",
    icon: <Truck size={22} />,
  },
];

const DEFAULT_TITLE = "شریک مطمئن شما در تأمین دیزل ژنراتور";
const DEFAULT_BODY =
  "پویش راه صنعت یاشار (شماره ثبت ۴۷۶۰۶) از سال ۱۳۹۶ فعالیت خود را با هدف تأمین باکیفیت‌ترین دیزل ژنراتورها و قطعات مرتبط آغاز کرد. از همان روز نخست، محور کار ما بر سه اصل استوار بوده است:";

type AboutProps = {
  title?: string;
  body?: string;
};

export default function About({ title, body }: AboutProps) {
  return (
    <section id="about" className="section-padding relative border-t border-foreground/10">
      <div className="container">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={staggerContainer(0.1)}
          >
            <motion.span
              variants={fadeInUp}
              className="text-sm font-semibold text-accent-400"
            >
              درباره ما
            </motion.span>
            <motion.h2
              variants={fadeInUp}
              className="mt-3 text-balance text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl"
            >
              {title || DEFAULT_TITLE}
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="mt-5 text-balance leading-8 text-foreground/70"
            >
              {body || DEFAULT_BODY}
            </motion.p>

            <motion.ul
              variants={staggerContainer(0.08)}
              className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3"
            >
              {PRINCIPLES.map((principle) => (
                <motion.li
                  key={principle.title}
                  variants={fadeInUp}
                  whileHover={{ y: -4 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="rounded-xl border border-transparent bg-foreground/[0.03] p-4 transition-colors duration-300 hover:border-accent-500/30"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-500/10 text-accent-400 shadow-sm shadow-accent-500/10">
                    {principle.icon}
                  </div>
                  <p className="mt-3 text-sm font-bold">{principle.title}</p>
                  <p className="mt-1 text-xs leading-5 text-foreground/70">
                    {principle.description}
                  </p>
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={fadeInUp}
            className="rounded-2xl border border-transparent bg-foreground/[0.03] p-8 shadow-xl shadow-black/10"
          >
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-accent-soft sm:text-5xl">
                  <Counter value={9} suffix="+" />
                </div>
                <p className="mt-2 text-sm text-foreground/70">
                  سال سابقه فعالیت
                </p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold sm:text-5xl">۴۷۶۰۶</div>
                <p className="mt-2 text-sm text-foreground/70">
                  شماره ثبت رسمی
                </p>
              </div>
            </div>

            <div className="mt-8 flex items-start gap-4 rounded-xl border border-accent-500/30 bg-accent-500/10 p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-500/20 text-accent-400 shadow-md shadow-accent-500/10">
                <Star size={22} />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">
                  نشان اعتماد B2B
                </p>
                <p className="mt-1 text-sm leading-6 text-foreground">
                  افتخار همکاری با شرکت‌های بزرگ، از جمله شرکت‌های حفاری، را
                  داشته‌ایم.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
