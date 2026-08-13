"use client";

import { motion } from "framer-motion";

export default function GeneratorIcon() {
  return (
    <svg viewBox="0 0 180 180" fill="none" className="mx-auto h-auto w-full">
      {/* pole connecting body to warning light */}
      <path d="M117 70V58" stroke="currentColor" strokeWidth="3" className="text-foreground/40" />

      {/* generator body */}
      <rect
        x="30"
        y="70"
        width="120"
        height="70"
        rx="10"
        stroke="currentColor"
        strokeWidth="3"
        className="text-foreground/40"
      />
      {/* vents */}
      <path
        d="M48 92h26M48 107h26M48 122h26"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        className="text-foreground/25"
      />
      {/* control panel */}
      <rect
        x="100"
        y="86"
        width="34"
        height="40"
        rx="4"
        stroke="currentColor"
        strokeWidth="3"
        className="text-foreground/40"
      />
      <circle cx="117" cy="98" r="4" stroke="currentColor" strokeWidth="2.5" className="text-foreground/30" />
      <path d="M108 116h18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-foreground/30" />

      {/* legs */}
      <path
        d="M42 140v10M138 140v10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        className="text-foreground/40"
      />

      {/* pulsing glow behind the light */}
      <motion.circle
        cx="117"
        cy="55"
        r="7"
        className="fill-accent-500"
        animate={{ opacity: [0.45, 0, 0.45], scale: [1, 2.4, 1] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* warning light */}
      <motion.circle
        cx="117"
        cy="55"
        r="7"
        className="fill-accent-500"
        animate={{ opacity: [1, 0.25, 1] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      />
    </svg>
  );
}
