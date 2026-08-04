"use client";

import { motion } from "framer-motion";
import { fadeInUp, staggerContainer } from "@/lib/motion";

export default function Hero() {
  return (
    <section className="relative flex min-h-[calc(100vh-3.5rem)] items-center overflow-hidden py-20 sm:py-28 md:min-h-[calc(100vh-3rem)]">
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_40%,transparent_100%)]" />

      <motion.div
        aria-hidden
        animate={{ y: [0, 24, 0], x: [0, -16, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute -top-24 right-[-10%] h-[420px] w-[420px] rounded-full bg-accent-500/20 blur-[110px] sm:h-[560px] sm:w-[560px]"
      />
      <motion.div
        aria-hidden
        animate={{ y: [0, -20, 0], x: [0, 20, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute bottom-[-15%] left-[-10%] h-[380px] w-[380px] rounded-full bg-brand-500/25 blur-[110px] sm:h-[500px] sm:w-[500px]"
      />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer(0.14, 0.1)}
        className="container relative z-10 flex flex-col items-center text-center"
      >
        <motion.span
          variants={fadeInUp}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-foreground/70 backdrop-blur-sm sm:text-sm"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-accent-500" />
          پویش راه صنعت یاشار
        </motion.span>

        <motion.h1
          variants={fadeInUp}
          className="max-w-4xl text-balance text-4xl font-black leading-[1.15] tracking-tight sm:text-6xl lg:text-7xl"
        >
          مهندسی و اجرای پروژه‌های صنعتی با
          <span className="text-gradient"> استانداردی فراتر از انتظار</span>
        </motion.h1>

        <motion.p
          variants={fadeInUp}
          className="mt-6 max-w-2xl text-balance text-base leading-8 text-foreground/70 sm:text-lg"
        >
          از طراحی مفهومی تا راه‌اندازی نهایی؛ تیم مهندسی یاشار در کنار شماست
          تا پروژه‌های زیرساختی و صنعتی را با کیفیت، ایمنی و در زمان مقرر به
          سرانجام برساند.
        </motion.p>

        <motion.div
          variants={fadeInUp}
          className="mt-10 flex w-full flex-col items-center gap-4 sm:w-auto sm:flex-row sm:justify-center"
        >
          <motion.a
            href="#pricing"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-accent-500 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-accent-500/25 transition-colors hover:bg-accent-600 sm:w-auto sm:text-base"
          >
            درخواست مشاوره رایگان
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              className="shrink-0"
            >
              <path
                d="M19 12H5M5 12L11 6M5 12L11 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.a>

          <motion.a
            href="#features"
            whileHover={{ scale: 1.04, backgroundColor: "rgba(255,255,255,0.06)" }}
            whileTap={{ scale: 0.97 }}
            className="w-full rounded-full border border-white/15 px-7 py-3.5 text-center text-sm font-semibold text-foreground transition-colors sm:w-auto sm:text-base"
          >
            مشاهده خدمات ما
          </motion.a>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.6 }}
        className="absolute inset-x-0 bottom-8 hidden justify-center sm:flex"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="flex h-9 w-6 items-start justify-center rounded-full border border-white/30 p-1.5"
        >
          <span className="h-1.5 w-1 rounded-full bg-white/70" />
        </motion.div>
      </motion.div>
    </section>
  );
}
