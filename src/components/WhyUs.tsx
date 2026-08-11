"use client";

import { motion } from "framer-motion";
import { fadeInUp, staggerContainer, viewportOnce } from "@/lib/motion";

const ADVANTAGES = [
  {
    title: "تنوع و موجودی بالا",
    description:
      "توانایی تأمین انواع مدل‌های دیزل ژنراتور، قطعات یدکی و تمامی محصولات موجود در دسته‌بندی‌های ما — ژنراتور، موتور برق، قطعات یدکی، دینام و غیره. تقریباً هر مدل و برندی که نیاز داشته باشید را می‌توانید از ما تهیه کنید.",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <path
          d="M3 9.5L12 4l9 5.5v9.5a1 1 0 0 1-1 1h-4v-6H8v6H4a1 1 0 0 1-1-1V9.5Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path d="M3 9.5 12 15l9-5.5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "رزومه و سابقه همکاری معتبر",
    description:
      "افتخار همکاری با شرکت‌های بزرگ و شناخته‌شده صنعت نفت و حفاری کشور را داریم؛ سابقه‌ای که اعتماد کارفرمایان صنعتی را برای ما به همراه آورده است.",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 3l2.2 4.46 4.93.72-3.57 3.48.84 4.91L12 14.14l-4.4 2.43.84-4.91-3.57-3.48 4.93-.72L12 3Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path d="M8 19.5h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "تیم فنی نصب و راه‌اندازی مجرب",
    description:
      "تیم فنی باتجربه و متخصص ما، نصب و راه‌اندازی دستگاه‌ها را در محل شما با بالاترین استاندارد ایمنی و کیفیت انجام می‌دهد.",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <path
          d="M14.7 6.3a3.5 3.5 0 0 1-4.6 4.6L4 17l3 3 6.1-6.1a3.5 3.5 0 0 1 4.6-4.6l-2.3 2.3-2-2 2.3-2.3Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

const PARTNERS = ["شرکت ملی حفاری ایران", "صنعت نفت"];

export default function WhyUs() {
  return (
    <section id="why-us" className="section-padding relative border-t border-white/10">
      <div className="container">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer(0.1)}
          className="mx-auto max-w-2xl text-center"
        >
          <motion.span variants={fadeInUp} className="text-sm font-semibold text-accent-400">
            چرا ما؟
          </motion.span>
          <motion.h2
            variants={fadeInUp}
            className="mt-3 text-balance text-3xl font-black leading-tight sm:text-4xl lg:text-5xl"
          >
            مزیت رقابتی ما در یک نگاه
          </motion.h2>
          <motion.p variants={fadeInUp} className="mt-4 text-balance leading-7 text-foreground/70">
            دلایلی که مشتریان صنعتی و تجاری برای تأمین دیزل ژنراتور و قطعات یدکی، ما را انتخاب می‌کنند.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer(0.15)}
          className="mt-14 grid grid-cols-1 gap-6 sm:mt-16 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8"
        >
          {ADVANTAGES.map((advantage) => (
            <motion.div
              key={advantage.title}
              variants={fadeInUp}
              whileHover={{ y: -8 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="group flex flex-col rounded-2xl border border-transparent bg-white/[0.03] p-8 transition-all duration-300 hover:border-accent-500/40 hover:shadow-xl hover:shadow-black/10"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent-500/10 text-accent-400 shadow-sm shadow-accent-500/10 transition-all duration-300 group-hover:scale-105 group-hover:bg-accent-500/20">
                {advantage.icon}
              </div>
              <h3 className="mt-6 text-xl font-bold">{advantage.title}</h3>
              <p className="mt-3 leading-7 text-foreground/70">{advantage.description}</p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={fadeInUp}
          className="mt-10 rounded-2xl border border-accent-500/20 bg-accent-500/[0.04] px-6 py-8 sm:mt-12 sm:px-10"
        >
          <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:justify-between sm:text-right">
            <div>
              <p className="text-sm font-semibold text-accent-400">همکاران و مشتریان ما</p>
              <p className="mt-1.5 max-w-md text-sm leading-6 text-foreground/60">
                افتخار همکاری با شرکت‌های بزرگ و شناخته‌شده صنعت نفت و حفاری کشور
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {PARTNERS.map((partner) => (
                <span
                  key={partner}
                  className="flex items-center gap-2 rounded-full border border-accent-500/25 bg-background/60 px-5 py-2.5 text-sm font-semibold text-foreground/90"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 text-accent-400">
                    <path
                      d="M3 21V9l9-6 9 6v12M9 21v-6h6v6"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {partner}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
