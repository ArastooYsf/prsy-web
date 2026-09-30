"use client";

import { motion } from "framer-motion";

// Shared "there's more below" hint — first built for Hero, reused wherever a
// section needs the same nudge (e.g. the /products intro banner). Callers
// own positioning and color via `className` since the right color depends on
// what's behind it: Hero always has a dark image+gradient backdrop regardless
// of site theme, so it hardcodes white; a plain content section needs a
// theme-aware `text-foreground/*` instead.
export default function ScrollHintArrow({
  href,
  label,
  className,
}: {
  href: string;
  label: string;
  className: string;
}) {
  return (
    <motion.a
      href={href}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.8, duration: 0.5 }}
      aria-label={label}
      className={`absolute inset-x-0 z-10 mx-auto flex w-fit flex-col items-center gap-1 transition-colors ${className}`}
    >
      <motion.svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      >
        <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </motion.svg>
    </motion.a>
  );
}
