"use client";

import { motion } from "framer-motion";
import { fadeInUp, staggerContainer, viewportOnce } from "@/lib/motion";
import ConsultationForm from "@/components/ConsultationForm";
import { DEFAULT_CONSULTATION } from "@/lib/site-content-defaults";
import type { ConsultationContent } from "@/lib/site-content";

export default function ConsultationSection({ content = DEFAULT_CONSULTATION }: { content?: ConsultationContent }) {
  const { eyebrow, heading, subheading } = content;
  return (
    <section id="consultation" className="section-padding relative border-t border-foreground/10">
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
            {eyebrow}
          </motion.span>
          <motion.h2
            variants={fadeInUp}
            className="mt-3 text-balance text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl"
          >
            {heading}
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            className="mt-4 text-balance leading-7 text-foreground/70"
          >
            {subheading}
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
