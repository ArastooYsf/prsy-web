"use client";

import { AnimatePresence, motion } from "framer-motion";
import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

// A persistent, non-blocking strip across the top of the viewport instead of
// the browser's own raw "no internet" page — this only replaces what the
// user would otherwise see when a network request quietly fails while
// they're still looking at an already-loaded page; it never takes over the
// whole screen, since cached content usually stays perfectly usable while
// offline. The sticky header reads this same isOffline value (see
// header-2.tsx) to pad itself down by this banner's height, so this fixed
// strip never overlaps the header's own clickable content.
export default function OfflineBanner() {
  const isOffline = useOnlineStatus();

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          role="status"
          // min-h-9 (2.25rem) is a fixed, known height — header-2.tsx pads
          // itself down by exactly this much when offline, so the two need
          // to agree on a concrete number rather than one measuring the
          // other.
          className="fixed inset-x-0 top-0 z-[60] flex min-h-9 items-center justify-center gap-2 border-b border-accent-500/20 bg-background/95 px-4 py-1.5 text-center text-xs font-medium text-foreground/80 shadow-md backdrop-blur supports-[backdrop-filter]:bg-background/80"
        >
          <WifiOff className="size-4 shrink-0 text-accent-400" aria-hidden />
          اتصال اینترنت شما قطع شده — تا وصل شدن دوباره، برخی بخش‌های سایت ممکنه به‌روز نشن.
        </motion.div>
      )}
    </AnimatePresence>
  );
}
