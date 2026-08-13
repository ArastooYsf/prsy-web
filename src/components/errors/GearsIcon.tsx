"use client";

import { motion } from "framer-motion";

type GearShapeProps = {
  radius: number;
  teeth?: number;
  toothLength?: number;
  toothWidth?: number;
  holeRadius?: number;
  className?: string;
};

function GearShape({ radius, teeth = 8, toothLength = 7, toothWidth = 7, holeRadius, className }: GearShapeProps) {
  const angles = Array.from({ length: teeth }, (_, i) => (360 / teeth) * i);
  return (
    <g className={className}>
      <circle r={radius} fill="none" stroke="currentColor" strokeWidth="3" />
      <circle r={holeRadius ?? radius * 0.35} fill="none" stroke="currentColor" strokeWidth="3" />
      {angles.map((angle) => (
        <rect
          key={angle}
          x={-toothWidth / 2}
          y={-(radius + toothLength)}
          width={toothWidth}
          height={toothLength}
          fill="currentColor"
          transform={`rotate(${angle})`}
        />
      ))}
    </g>
  );
}

export default function GearsIcon() {
  return (
    <svg viewBox="0 0 200 160" fill="none" className="mx-auto h-auto w-full text-foreground/40">
      {/* large gear — steady clockwise */}
      <g transform="translate(68 108)">
        <motion.g
          animate={{ rotate: 360 }}
          transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "0px 0px" }}
        >
          <GearShape radius={36} teeth={10} toothLength={8} toothWidth={8} />
        </motion.g>
      </g>

      {/* medium gear — steady counter-clockwise */}
      <g transform="translate(124 68)">
        <motion.g
          animate={{ rotate: -360 }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "0px 0px" }}
        >
          <GearShape radius={26} teeth={8} toothLength={7} toothWidth={7} className="text-accent-500/70" />
        </motion.g>
      </g>

      {/* small gear — periodically stalls, then catches up */}
      <g transform="translate(132 108)">
        <motion.g
          animate={{ rotate: [0, 300, 300, 360] }}
          transition={{
            duration: 3.6,
            times: [0, 0.5, 0.75, 1],
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ transformOrigin: "0px 0px" }}
        >
          <GearShape radius={18} teeth={6} toothLength={6} toothWidth={6} />
        </motion.g>
      </g>
    </svg>
  );
}
