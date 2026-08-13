"use client";

import { motion } from "framer-motion";

export default function LockIcon() {
  return (
    <svg viewBox="0 0 160 160" fill="none" className="mx-auto h-auto w-full">
      <motion.g
        initial={{ rotate: 0 }}
        animate={{ rotate: [0, -7, 7, -4, 4, 0] }}
        transition={{ duration: 0.7, ease: "easeInOut", delay: 0.25 }}
        style={{ transformOrigin: "80px 95px" }}
      >
        {/* shackle */}
        <path
          d="M55 75V60a25 25 0 0 1 50 0v15"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          className="text-foreground/45"
        />
        {/* body */}
        <rect
          x="35"
          y="75"
          width="90"
          height="70"
          rx="12"
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
          className="text-foreground/45"
        />
        {/* rivets */}
        <circle cx="45" cy="85" r="2.5" className="fill-foreground/25" />
        <circle cx="115" cy="85" r="2.5" className="fill-foreground/25" />
        {/* keyhole */}
        <circle cx="80" cy="103" r="8" className="fill-accent-500" />
        <path d="M80 111v14" stroke="currentColor" strokeWidth="6" strokeLinecap="round" className="text-accent-500" />
      </motion.g>
    </svg>
  );
}
