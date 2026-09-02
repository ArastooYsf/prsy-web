"use client";

import { motion } from "framer-motion";

// Maintenance motif: a wrench tightening a bolt — same family as
// GeneratorIcon/GearsIcon/LockIcon (foreground/40 line-art, one accent-500
// highlight, a small mount-in animation), reused for the /maintenance page.
export default function WrenchIcon() {
  return (
    <svg viewBox="0 0 180 180" fill="none" className="mx-auto h-auto w-full">
      {/* bolt the wrench is turning */}
      <path
        d="M90 96l-8-14h16l-8 14zM90 96l8 14H82l8-14zM90 96l14-8v16l-14-8zM90 96l-14 8V80l14 8z"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
        className="text-foreground/30"
      />
      <circle cx="90" cy="96" r="7" stroke="currentColor" strokeWidth="3" className="text-foreground/30" />

      {/* wrench, rotating into place as if just tightened */}
      <motion.g
        initial={{ rotate: -22 }}
        animate={{ rotate: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
        style={{ transformOrigin: "90px 96px" }}
      >
        <path
          d="M90 96L130 56"
          stroke="currentColor"
          strokeWidth="7"
          strokeLinecap="round"
          className="text-foreground/45"
        />
        <path
          d="M118 44a14 14 0 1 1 8 26l-4 4-8-8-8-8 4-4a14 14 0 0 1 8-10z"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinejoin="round"
          className="text-foreground/45"
        />
        {/* accent highlight: the jaw's grip */}
        <circle cx="130" cy="56" r="4" className="fill-accent-500" />
      </motion.g>

      {/* a couple of loose bolts scattered nearby — "still being worked on" */}
      <circle cx="46" cy="130" r="5" stroke="currentColor" strokeWidth="3" className="text-foreground/25" />
      <circle cx="64" cy="140" r="4" stroke="currentColor" strokeWidth="3" className="text-foreground/20" />
    </svg>
  );
}
