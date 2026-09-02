"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { WifiOff } from "lucide-react";

// A persistent, non-blocking strip across the top of the viewport instead of
// the browser's own raw "no internet" page — this only replaces what the
// user would otherwise see when a network request quietly fails while
// they're still looking at an already-loaded page; it never takes over the
// whole screen, since cached content usually stays perfectly usable while
// offline. `navigator.onLine` for the initial read, then the `online`/
// `offline` window events for live updates — no polling.
export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    setIsOffline(!navigator.onLine);
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          role="status"
          className="fixed inset-x-0 top-0 z-[60] flex items-center justify-center gap-2 border-b border-accent-500/20 bg-background/95 px-4 py-2 text-center text-xs font-medium text-foreground/80 shadow-md backdrop-blur supports-[backdrop-filter]:bg-background/80"
        >
          <WifiOff className="size-4 shrink-0 text-accent-400" aria-hidden />
          اتصال اینترنت شما قطع شده — تا وصل شدن دوباره، برخی بخش‌های سایت ممکنه به‌روز نشن.
        </motion.div>
      )}
    </AnimatePresence>
  );
}
