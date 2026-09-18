"use client";

import { motion } from "framer-motion";
import { fadeInUp, staggerContainer, viewportOnce } from "@/lib/motion";
import { DEFAULT_CUSTOMERS, getIconByKey } from "@/lib/site-content-defaults";
import type { CustomersContent } from "@/lib/site-content";

export default function Customers({ content = DEFAULT_CUSTOMERS }: { content?: CustomersContent }) {
  const { eyebrow, heading, subheading, segments } = content;

  return (
    <section id="customers" className="section-padding relative border-t border-foreground/10">
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
          variants={staggerContainer(0.12)}
          className="mt-14 grid grid-cols-2 gap-3 sm:mt-16 sm:gap-6 lg:grid-cols-4"
        >
          {segments.map((segment, i) => {
            const SegmentIcon = getIconByKey(segment.icon);
            return (
              <motion.div
                key={i}
                variants={fadeInUp}
                className="group flex flex-col rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4 transition-colors duration-300 hover:border-accent-500/30 sm:p-7"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-500/10 text-accent-400 transition-colors duration-300 group-hover:bg-accent-500/20 sm:h-12 sm:w-12">
                  <SegmentIcon size={26} />
                </div>
                <h3 className="mt-4 text-sm font-bold sm:mt-5 sm:text-lg">{segment.title}</h3>
                <p className="mt-2 text-xs leading-5 text-foreground/70 sm:mt-2.5 sm:text-sm sm:leading-6">{segment.description}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
