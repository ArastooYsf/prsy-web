"use client";

import { motion } from "framer-motion";
import { fadeInUp, staggerContainer, viewportOnce } from "@/lib/motion";
import ConsultationForm from "@/components/ConsultationForm";

export default function ConsultationSection() {
  return (
    <section id="consultation" className="section-padding relative border-t border-white/10">
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
            درخواست مشاوره
          </motion.span>
          <motion.h2
            variants={fadeInUp}
            className="mt-3 text-balance text-3xl font-black leading-tight sm:text-4xl lg:text-5xl"
          >
            یک قدم تا شروع همکاری
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            className="mt-4 text-balance leading-7 text-foreground/70"
          >
            فرم زیر را پر کنید تا کارشناسان ما ظرف ۴۸ ساعت کاری با شما تماس
            بگیرند.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={fadeInUp}
          className="mt-14 sm:mt-16"
        >
          <ConsultationForm />
        </motion.div>
      </div>
    </section>
  );
}
