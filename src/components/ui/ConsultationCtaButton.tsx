"use client";

import type { MouseEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useAnimate, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { isPlainLeftClick } from "@/lib/is-plain-left-click";

const HREF = "/consultation";

// Idle glow: a slow, gentle breathing shadow — not a flashing/attention-
// grabbing pulse, just enough that the primary CTA reads as "alive" among
// otherwise-static nav chrome. Skipped entirely under prefers-reduced-motion.
const IDLE_GLOW = {
  boxShadow: [
    "0 0 0px 0px rgba(249,115,22,0)",
    "0 6px 24px 0px rgba(249,115,22,0.35)",
    "0 0 0px 0px rgba(249,115,22,0)",
  ],
};
const IDLE_GLOW_TRANSITION = { duration: 2.8, repeat: Infinity, ease: "easeInOut" as const };

export function ConsultationCtaButton({
  size,
  className,
  fullWidth,
  onNavigate,
}: {
  size?: "sm" | "default" | "lg";
  className?: string;
  fullWidth?: boolean;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const [scope, animate] = useAnimate();

  const handleClick = async (e: MouseEvent<HTMLAnchorElement>) => {
    if (!isPlainLeftClick(e)) return;
    e.preventDefault();
    onNavigate?.();
    if (prefersReducedMotion) {
      router.push(HREF);
      return;
    }
    // A quick, playful squish before the route actually changes — so the
    // click visibly registers instead of feeling swallowed while the next
    // page renders — then a normal navigation.
    await animate(scope.current, { scale: [1, 0.92, 1] }, { duration: 0.22, ease: [0.34, 1.56, 0.64, 1] });
    router.push(HREF);
  };

  return (
    <motion.span
      ref={scope}
      className={cn("rounded-full", fullWidth ? "block w-full" : "inline-block")}
      animate={prefersReducedMotion ? undefined : IDLE_GLOW}
      transition={prefersReducedMotion ? undefined : IDLE_GLOW_TRANSITION}
    >
      <Button
        size={size}
        className={cn("transition-all duration-300 hover:-translate-y-0.5", fullWidth && "w-full", className)}
        asChild
      >
        <Link href={HREF} onClick={handleClick}>
          درخواست مشاوره
        </Link>
      </Button>
    </motion.span>
  );
}
