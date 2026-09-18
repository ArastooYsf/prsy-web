"use client";

import { motion } from "framer-motion";
import { Star } from "@phosphor-icons/react";
import Counter from "@/components/Counter";
import { fadeInUp, staggerContainer, viewportOnce } from "@/lib/motion";
import { DEFAULT_ABOUT, getIconByKey } from "@/lib/site-content-defaults";
import type { AboutContent } from "@/lib/site-content";

export default function About({ content = DEFAULT_ABOUT }: { content?: AboutContent }) {
  const { title, body, principles, yearsValue, registrationNumber, registrationLabel, trustBadgeTitle, trustBadgeText } = content;

  return (
    <section id="about" className="section-padding relative border-t border-foreground/10">
      <div className="container">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={staggerContainer(0.1)}
          >
            <motion.span
              variants={fadeInUp}
              className="text-sm font-semibold text-accent-400"
            >
              درباره ما
            </motion.span>
            <motion.h2
              variants={fadeInUp}
              className="mt-3 text-balance text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl"
            >
              {title}
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="mt-5 text-balance leading-8 text-foreground/70"
            >
              {body}
            </motion.p>

            <motion.ul
              variants={staggerContainer(0.08)}
              className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3"
            >
              {principles.map((principle, i) => {
                const PrincipleIcon = getIconByKey(principle.icon);
                return (
                  <motion.li
                    key={i}
                    variants={fadeInUp}
                    whileHover={{ y: -4 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="rounded-xl border border-transparent bg-foreground/[0.03] p-4 transition-colors duration-300 hover:border-accent-500/30"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-500/10 text-accent-400 shadow-sm shadow-accent-500/10">
                      <PrincipleIcon size={22} />
                    </div>
                    <p className="mt-3 text-sm font-bold">{principle.title}</p>
                    <p className="mt-1 text-xs leading-5 text-foreground/70">{principle.description}</p>
                  </motion.li>
                );
              })}
            </motion.ul>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={fadeInUp}
            className="rounded-2xl border border-transparent bg-foreground/[0.03] p-8 shadow-xl shadow-black/10"
          >
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-accent-soft sm:text-5xl">
                  <Counter value={yearsValue} suffix="+" />
                </div>
                <p className="mt-2 text-sm text-foreground/70">
                  سال سابقه فعالیت
                </p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold sm:text-5xl">{registrationNumber}</div>
                <p className="mt-2 text-sm text-foreground/70">{registrationLabel}</p>
              </div>
            </div>

            <div className="mt-8 flex items-start gap-4 rounded-xl border border-accent-500/30 bg-accent-500/10 p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-500/20 text-accent-400 shadow-md shadow-accent-500/10">
                <Star size={22} />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">{trustBadgeTitle}</p>
                <p className="mt-1 text-sm leading-6 text-foreground">{trustBadgeText}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
