"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import { cn } from "@/lib/utils";

// The shared "nothing here yet" illustration — an open shipping crate
// (on-brand for an industrial equipment supplier: everything the site sells
// ships in one of these) rendered once here, in the same line-art family as
// the 404/500/403 icons (foreground/30-40 stroke, currentColor). The
// context-specific `icon` prop sits inside it in the same
// bg-accent-500/10 + text-accent-400 chip already used everywhere else in
// the nav/menus — this ties the new empty-state language directly to an
// existing site convention instead of inventing a new one.
function EmptyCrate({ icon }: { icon: ReactNode }) {
  return (
    <div className="relative mx-auto flex h-28 w-32 items-end justify-center">
      <svg viewBox="0 0 160 120" fill="none" className="absolute inset-x-0 bottom-0 h-full w-full text-foreground/30">
        {/* crate body */}
        <path
          d="M20 52l60-22 60 22v40a4 4 0 01-4 4H24a4 4 0 01-4-4V52z"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        {/* open top flaps */}
        <path d="M20 52l60 20 60-20M80 30v42" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
        {/* cross-brace on the front face */}
        <path d="M30 62l40 30M110 62L70 92" stroke="currentColor" strokeWidth="2.5" className="text-foreground/15" />
        {/* ground shadow */}
        <ellipse cx="80" cy="100" rx="46" ry="5" className="fill-foreground/[0.04]" stroke="none" />
      </svg>
      <motion.span
        initial={{ y: 4, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 mb-8 flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent-500/10 text-accent-400 shadow-sm shadow-accent-500/10 [&_svg]:size-5"
      >
        {icon}
      </motion.span>
    </div>
  );
}

type EmptyStateAction = { label: string; href: string } | { label: string; onClick: () => void };

type EmptyStateProps = {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: EmptyStateAction;
  /** "sm" drops the illustration for tight spaces (a dropdown, an inline panel) — icon + text only. */
  size?: "default" | "sm";
  className?: string;
};

export default function EmptyState({ icon, title, description, action, size = "default", className }: EmptyStateProps) {
  if (size === "sm") {
    return (
      <div className={cn("flex flex-col items-center gap-2 px-5 py-7 text-center", className)}>
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent-500/10 text-accent-400 [&_svg]:size-4">
          {icon}
        </span>
        <p className="text-sm font-medium text-foreground/70">{title}</p>
        {description && <p className="text-xs text-foreground/50">{description}</p>}
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer(0.08)}
      className={cn(
        "flex flex-col items-center rounded-2xl border border-foreground/10 bg-foreground/[0.03] px-8 py-10 text-center",
        className,
      )}
    >
      <motion.div variants={fadeInUp}>
        <EmptyCrate icon={icon} />
      </motion.div>
      <motion.p variants={fadeInUp} className="mt-3 text-sm font-bold text-foreground">
        {title}
      </motion.p>
      {description && (
        <motion.p variants={fadeInUp} className="mt-1.5 max-w-xs text-balance text-sm text-foreground/60">
          {description}
        </motion.p>
      )}
      {action && (
        <motion.div variants={fadeInUp} className="mt-5">
          {"href" in action ? (
            <Link
              href={action.href}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-accent-500 px-5 text-sm font-semibold text-primary-foreground shadow-lg shadow-accent-500/25 transition-colors hover:bg-accent-600"
            >
              {action.label}
            </Link>
          ) : (
            <button
              type="button"
              onClick={action.onClick}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-accent-500 px-5 text-sm font-semibold text-primary-foreground shadow-lg shadow-accent-500/25 transition-colors hover:bg-accent-600"
            >
              {action.label}
            </button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
