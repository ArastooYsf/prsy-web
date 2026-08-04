"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { fadeInUp, staggerContainer, viewportOnce } from "@/lib/motion";

const FAQS = [
  {
    question: "چه نوع پروژه‌هایی را می‌پذیرید؟",
    answer:
      "پروژه‌های صنعتی و زیرساختی از جمله خطوط تولید، مجتمع‌های پتروشیمی، نیروگاه‌ها، معادن و واحدهای فرآوری را از مرحله طراحی تا اجرای کامل پوشش می‌دهیم.",
  },
  {
    question: "زمان تحویل یک پروژه معمولی چقدر است؟",
    answer:
      "بسته به مقیاس و پیچیدگی پروژه متفاوت است؛ در جلسه ارزیابی اولیه، برآورد دقیقی از زمان‌بندی اجرا بر اساس نقشه راه پروژه شما ارائه می‌کنیم.",
  },
  {
    question: "آیا امکان بازدید حضوری از سایت پروژه وجود دارد؟",
    answer:
      "بله، تیم فنی ما پیش از ارائه پیشنهاد نهایی، بازدید میدانی از سایت انجام می‌دهد تا ارزیابی دقیقی از شرایط اجرایی و محدودیت‌های فنی داشته باشیم.",
  },
  {
    question: "هزینه جلسه مشاوره اولیه چقدر است؟",
    answer:
      "اولین جلسه مشاوره برای بررسی کلیات پروژه کاملاً رایگان است. هزینه خدمات تخصصی‌تر مانند امکان‌سنجی و طراحی، بر اساس دامنه کار توافق می‌شود.",
  },
  {
    question: "چگونه همکاری را با تیم شما شروع کنم؟",
    answer:
      "کافی است فرم درخواست مشاوره را تکمیل کنید؛ کارشناسان ما ظرف ۴۸ ساعت کاری با شما تماس می‌گیرند تا جلسه ارزیابی اولیه هماهنگ شود.",
  },
  {
    question: "آیا در سراسر کشور فعالیت می‌کنید؟",
    answer:
      "بله، تیم اجرایی ما آمادگی حضور در پروژه‌های سراسر کشور را دارد و بر اساس موقعیت جغرافیایی پروژه، برنامه‌ریزی لجستیکی لازم انجام می‌شود.",
  },
];

function ToggleIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-graphite-light">
      <motion.span
        animate={{ rotate: isOpen ? 45 : 0 }}
        transition={{ duration: 0.3 }}
        className="absolute h-px w-3.5 bg-current"
      />
      <motion.span
        animate={{ rotate: isOpen ? 135 : 90 }}
        transition={{ duration: 0.3 }}
        className="absolute h-px w-3.5 bg-current"
      />
    </span>
  );
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="section-padding relative border-t border-graphite-light/40">
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
            سوالات متداول
          </motion.span>
          <motion.h2
            variants={fadeInUp}
            className="mt-3 text-balance text-3xl font-black leading-tight sm:text-4xl lg:text-5xl"
          >
            پاسخ به پرسش‌های رایج شما
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            className="mt-4 text-balance leading-7 text-text-secondary"
          >
            اگر پاسخ سوال خود را پیدا نکردید، از طریق فرم مشاوره با ما در تماس
            باشید.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer(0.08)}
          className="mx-auto mt-14 max-w-3xl divide-y divide-graphite-light sm:mt-16"
        >
          {FAQS.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <motion.div key={faq.question} variants={fadeInUp}>
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 py-6 text-right"
                >
                  <span className="text-base font-semibold sm:text-lg">
                    {faq.question}
                  </span>
                  <ToggleIcon isOpen={isOpen} />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="pb-6 leading-7 text-text-secondary">
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
