"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer } from "@/lib/motion";

type ErrorPageShellProps = {
  code: string;
  icon: ReactNode;
  title: string;
  description: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

export default function ErrorPageShell({
  code,
  icon,
  title,
  description,
  primaryHref = "/",
  primaryLabel = "بازگشت به صفحه اصلی",
  secondaryHref,
  secondaryLabel,
}: ErrorPageShellProps) {
  return (
    <section className="section-padding relative flex min-h-[70vh] items-center overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_40%,transparent_100%)]" />
      <div className="container relative z-10">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer(0.12)}
          className="mx-auto flex max-w-md flex-col items-center text-center"
        >
          <motion.div variants={fadeInUp} className="w-full max-w-[180px] text-foreground/50 sm:max-w-[200px]">
            {icon}
          </motion.div>
          <motion.span variants={fadeInUp} className="mt-6 text-sm font-semibold text-accent-400">
            خطای {code}
          </motion.span>
          <motion.h1
            variants={fadeInUp}
            className="mt-3 text-balance text-2xl font-black leading-tight sm:text-3xl"
          >
            {title}
          </motion.h1>
          <motion.p variants={fadeInUp} className="mt-3 text-balance leading-7 text-foreground/70">
            {description}
          </motion.p>
          <motion.div variants={fadeInUp} className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={primaryHref}
              className="rounded-full bg-accent-500 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-accent-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:bg-accent-600 hover:shadow-xl hover:shadow-accent-500/30"
            >
              {primaryLabel}
            </Link>
            {secondaryHref && secondaryLabel && (
              <Link
                href={secondaryHref}
                className="rounded-full border border-white/10 px-7 py-3.5 text-sm font-medium text-foreground/70 transition-colors hover:border-accent-500/40 hover:text-accent-400"
              >
                {secondaryLabel}
              </Link>
            )}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
