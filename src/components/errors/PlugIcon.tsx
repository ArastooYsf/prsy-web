"use client";

import { motion } from "framer-motion";

// Offline motif: a power plug drifted apart from its socket — fits the
// site's own subject (power supply) better than a generic wifi-off glyph.
// Same family as the other error icons: foreground/40 line-art, one
// accent-500 highlight (the gap spark), a slow idle drift instead of a
// one-shot mount animation, since this icon can sit on screen for a while.
export default function PlugIcon() {
  return (
    <svg viewBox="0 0 180 180" fill="none" className="mx-auto h-auto w-full">
      {/* socket, fixed in place */}
      <rect x="94" y="66" width="52" height="64" rx="10" stroke="currentColor" strokeWidth="3" className="text-foreground/40" />
      <path d="M112 90v16M128 90v16" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" className="text-foreground/30" />

      {/* plug, gently drifting away and back */}
      <motion.g
        animate={{ x: [0, -6, 0] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      >
        <path d="M60 98h20" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="text-foreground/45" />
        <rect x="30" y="80" width="30" height="36" rx="8" stroke="currentColor" strokeWidth="3" className="text-foreground/45" />
        <path d="M40 68v14M50 68v14" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" className="text-foreground/30" />
      </motion.g>

      {/* the gap between them — pulses to read as "disconnected", not just far apart */}
      <motion.g animate={{ opacity: [0.9, 0.25, 0.9] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}>
        <circle cx="82" cy="98" r="2.5" className="fill-accent-500" />
        <circle cx="88" cy="98" r="2" className="fill-accent-500/70" />
      </motion.g>
    </svg>
  );
}
