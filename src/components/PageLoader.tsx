"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const MIN_VISIBLE_MS = 350;
const SAFETY_TIMEOUT_MS = 6000;

export default function PageLoader() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const minDelay = new Promise<void>((resolve) => setTimeout(resolve, MIN_VISIBLE_MS));

    const fontsReady =
      typeof document !== "undefined" && "fonts" in document
        ? document.fonts.ready
        : Promise.resolve();

    const windowLoaded =
      document.readyState === "complete"
        ? Promise.resolve()
        : new Promise<void>((resolve) =>
            window.addEventListener("load", () => resolve(), { once: true })
          );

    const ready = Promise.all([fontsReady, windowLoaded, minDelay]);
    const safetyNet = new Promise<void>((resolve) => setTimeout(resolve, SAFETY_TIMEOUT_MS));

    Promise.race([ready, safetyNet]).then(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = loading ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [loading]);

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background"
        >
          <p className="text-xl font-bold tracking-wide sm:text-2xl">
            پویش راه صنعت
            <span className="text-accent-400"> یاشار</span>
          </p>
          <div className="mt-6 h-[3px] w-40 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full w-1/3 rounded-full bg-accent-500"
              animate={{ x: ["-100%", "220%"] }}
              transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
