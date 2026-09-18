"use client";

import { motion } from "framer-motion";
import { Quotes } from "@phosphor-icons/react";
import Counter from "@/components/Counter";
import { fadeInUp, staggerContainer, viewportOnce } from "@/lib/motion";
import { DEFAULT_SOCIALPROOF } from "@/lib/site-content-defaults";
import type { SocialProofContent } from "@/lib/site-content";

export default function SocialProof({ content = DEFAULT_SOCIALPROOF }: { content?: SocialProofContent }) {
  const { stats, sectors, testimonials } = content;

  return (
    <section id="clients" className="section-padding relative border-t border-foreground/10">
      <div className="container">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer(0.1)}
          className="grid grid-cols-2 gap-8 sm:grid-cols-4 sm:gap-6"
        >
          {stats.map((stat, i) => (
            <motion.div key={i} variants={fadeInUp} className="text-center">
              <div className="text-4xl font-bold text-accent-soft sm:text-5xl">
                <Counter value={stat.value} suffix={stat.suffix} />
              </div>
              <p className="mt-2 text-sm text-foreground/70 sm:text-base">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer(0.06, 0.1)}
          className="mt-14 flex flex-wrap items-center justify-center gap-3 sm:mt-16"
        >
          {sectors.map((sector, i) => (
            <motion.span
              key={i}
              variants={fadeInUp}
              className="rounded-full border border-transparent bg-foreground/[0.03] px-4 py-2 text-xs font-medium text-foreground/70 sm:text-sm"
            >
              {sector}
            </motion.span>
          ))}
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer(0.15, 0.1)}
          className="mt-14 grid grid-cols-1 gap-6 sm:mt-20 md:grid-cols-3 lg:gap-8"
        >
          {testimonials.map((testimonial, i) => (
            <motion.div
              key={i}
              variants={fadeInUp}
              className="flex flex-col rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-7"
            >
              <Quotes size={28} weight="fill" className="mb-4 text-accent-400/50" />
              <p className="flex-1 leading-7 text-foreground/70">{testimonial.quote}</p>
              <div className="mt-6 flex items-center gap-3 border-t border-foreground/10 pt-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {testimonial.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold">{testimonial.name}</p>
                  <p className="text-xs text-foreground/60">{testimonial.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
