"use client";

import { motion } from "framer-motion";
import { Buildings } from "@phosphor-icons/react";
import { fadeInUp, staggerContainer, viewportOnce } from "@/lib/motion";
import { DEFAULT_WHYUS, getIconByKey } from "@/lib/site-content-defaults";
import type { WhyUsContent } from "@/lib/site-content";

export default function WhyUs({ content = DEFAULT_WHYUS }: { content?: WhyUsContent }) {
  const { eyebrow, heading, subheading, advantages, partnersLabel, partnersSubtext, partners } = content;
  return (
    <section id="why-us" className="section-padding relative border-t border-foreground/10">
      <div className="container">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer(0.1)}
          className="mx-auto max-w-2xl text-center"
        >
          <motion.span variants={fadeInUp} className="text-sm font-semibold text-accent-400">
            {eyebrow}
          </motion.span>
          <motion.h2
            variants={fadeInUp}
            className="mt-3 text-balance text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl"
          >
            {heading}
          </motion.h2>
          <motion.p variants={fadeInUp} className="mt-4 text-balance leading-7 text-foreground/70">
            {subheading}
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer(0.1)}
          className="mt-14 divide-y divide-foreground/10 overflow-hidden rounded-2xl border border-foreground/10 bg-foreground/[0.03] sm:mt-16"
        >
          {advantages.map((advantage, i) => {
            const AdvantageIcon = getIconByKey(advantage.icon);
            return (
              <motion.div
                key={i}
                variants={fadeInUp}
                className="group flex flex-col items-start gap-5 p-6 transition-colors duration-300 hover:bg-foreground/[0.02] sm:flex-row sm:p-8"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-accent-500/10 text-accent-400 transition-colors duration-300 group-hover:bg-accent-500/20">
                  <AdvantageIcon size={26} />
                </div>
                <div>
                  <h3 className="text-lg font-bold">{advantage.title}</h3>
                  <p className="mt-2 leading-7 text-foreground/70">{advantage.description}</p>
                </div>
              </motion.div>
            );
          })}
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
              <p className="text-sm font-semibold text-accent-400">{partnersLabel}</p>
              <p className="mt-1.5 max-w-md text-sm leading-6 text-foreground/60">{partnersSubtext}</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {partners.map((partner) => (
                <span
                  key={partner}
                  className="flex items-center gap-2 rounded-full border border-accent-500/25 bg-background/60 px-5 py-2.5 text-sm font-semibold text-foreground/90"
                >
                  <Buildings size={16} className="shrink-0 text-accent-400" />
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
