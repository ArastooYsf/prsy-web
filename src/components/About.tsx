"use client";

import { motion } from "framer-motion";
import Counter from "@/components/Counter";
import { fadeInUp, staggerContainer, viewportOnce } from "@/lib/motion";

const PRINCIPLES = [
  {
    title: "بهترین کیفیت",
    description: "تأمین محصولات اورجینال و باکیفیت",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 2.5l2.9 5.9 6.5 1-4.7 4.6 1.1 6.5-5.8-3-5.8 3 1.1-6.5-4.7-4.6 6.5-1 2.9-5.9z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: "بهترین قیمت",
    description: "رقابتی‌ترین قیمت ممکن در بازار",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="7.5" cy="7.5" r="2" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="16.5" cy="16.5" r="2" stroke="currentColor" strokeWidth="1.6" />
        <path d="M18 6L6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "سریع‌ترین تحویل",
    description: "ارسال به‌موقع و بدون تأخیر",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M3 7h10v8H3zM13 10h4l3 3v2h-7z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <circle cx="7" cy="18.5" r="1.6" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="17" cy="18.5" r="1.6" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    ),
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
    <section id="about" className="section-padding relative border-t border-white/10">
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
              className="mt-3 text-balance text-3xl font-black leading-tight sm:text-4xl lg:text-5xl"
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
                  className="rounded-xl border border-transparent bg-white/[0.03] p-4"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-500/10 text-accent-400">
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
            className="rounded-2xl border border-transparent bg-white/[0.03] p-8"
          >
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center">
                <div className="text-4xl font-black text-gradient sm:text-5xl">
                  <Counter value={9} suffix="+" />
                </div>
                <p className="mt-2 text-sm text-foreground/70">
                  سال سابقه فعالیت
                </p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-black sm:text-5xl">۴۷۶۰۶</div>
                <p className="mt-2 text-sm text-foreground/70">
                  شماره ثبت رسمی
                </p>
              </div>
            </div>

            <div className="mt-8 flex items-start gap-4 rounded-xl border border-accent-500/30 bg-accent-500/10 p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-500/20 text-accent-400">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 2.5l2.9 5.9 6.5 1-4.7 4.6 1.1 6.5-5.8-3-5.8 3 1.1-6.5-4.7-4.6 6.5-1 2.9-5.9z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                </svg>
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
