"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { fadeInUp, staggerContainer, viewportOnce } from "@/lib/motion";
import { FAQS } from "@/data/faqs";

const PREVIEW_COUNT = 4;

function ToggleIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10">
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

export default function FAQ({ full = false }: { full?: boolean }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const items = full ? FAQS : FAQS.slice(0, PREVIEW_COUNT);

  return (
    <section id="faq" className="section-padding relative border-t border-white/10">
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
            className="mt-4 text-balance leading-7 text-foreground/70"
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
          className="mx-auto mt-14 max-w-3xl divide-y divide-white/10 sm:mt-16"
        >
          {items.map((faq, index) => {
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
                      <p className="pb-6 leading-7 text-foreground/70">
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </motion.div>

        {!full && (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={fadeInUp}
            className="mt-10 text-center"
          >
            <Link
              href="/faq"
              className="inline-flex items-center gap-2 text-sm font-semibold text-accent-400 underline-offset-4 transition-colors hover:text-white"
            >
              مشاهده همه سوالات متداول
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
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
        )}
      </div>
    </section>
  );
}
