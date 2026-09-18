"use client";

import { useEffect, useRef } from "react";
import { scrollIntoViewIfNeeded } from "@/lib/scroll-into-view";

/**
 * Attach the returned ref to a popover/dropdown/dialog's content element and
 * pass its open state — when it flips to open, the content is smoothly
 * scrolled into view if it (or the trigger it's anchored to) would
 * otherwise sit outside the current viewport. A no-op if already visible.
 */
export function useScrollIntoViewOnOpen<T extends HTMLElement>(open: boolean) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    if (!open) return;
    // Radix measures the trigger and positions Popover/Dialog content
    // (flip/shift to avoid collision) after `open` flips true, not
    // synchronously with it — wait a frame so this measures the settled
    // position rather than a pre-layout flash.
    const raf = requestAnimationFrame(() => {
      if (ref.current) scrollIntoViewIfNeeded(ref.current);
    });
    return () => cancelAnimationFrame(raf);
  }, [open]);

  return ref;
}
