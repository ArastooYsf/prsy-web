"use client";

import { motion } from "framer-motion";
import { fadeInUp, staggerContainer, viewportOnce } from "@/lib/motion";
import { DEFAULT_FEATURES, getIconByKey } from "@/lib/site-content-defaults";
import type { FeaturesContent } from "@/lib/site-content";

// Persian ordinal badges (۰۱, ۰۲, ...) for each card — decorative, derived
// from position, not stored content (adding/removing a feature just
// renumbers these, nothing to keep in sync).
const ORDINALS = ["۰۱", "۰۲", "۰۳", "۰۴", "۰۵", "۰۶", "۰۷", "۰۸", "۰۹", "۱۰", "۱۱", "۱۲"];

export default function Features({ content = DEFAULT_FEATURES }: { content?: FeaturesContent }) {
  const { eyebrow, heading, subheading, features } = content;

  return (
    <section id="features" className="section-padding relative">
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
          variants={staggerContainer(0.15)}
          className="mt-14 grid grid-cols-1 gap-6 sm:mt-16 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8"
        >
          {features.map((feature, i) => {
            const FeatureIcon = getIconByKey(feature.icon);
            return (
              <motion.div
                key={i}
                variants={fadeInUp}
                className="group relative overflow-hidden rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-8 transition-colors duration-300 hover:border-accent-500/30"
              >
                <span className="pointer-events-none absolute -top-3 left-4 text-6xl font-bold text-foreground/[0.06] transition-colors duration-300 group-hover:text-accent-500/10">
                  {ORDINALS[i] ?? ""}
                </span>

                <div className="relative flex h-14 w-14 items-center justify-center rounded-lg bg-accent-500/10 text-accent-400 transition-colors duration-300 group-hover:bg-accent-500/20">
                  <FeatureIcon size={26} />
                </div>

                <h3 className="relative mt-6 text-xl font-bold">{feature.title}</h3>
                <p className="relative mt-3 leading-7 text-foreground/70">{feature.description}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
