"use client";

import { useEffect, useRef } from "react";
import { scrollIntoViewIfNeeded } from "@/lib/scroll-into-view";

/**
 * Attach the returned ref to the LAST rendered item in a dynamically-growing
 * list, e.g. `index === items.length - 1 ? ref : undefined`. Whenever
 * `count` increases, the newly-mounted item is smoothly scrolled into view
 * (a no-op if it's already visible) — so adding a row below the fold
 * doesn't leave the user hunting for it. Does nothing when `count` shrinks
 * (a row removed), so deleting an item never triggers a scroll jump.
 */
export function useScrollNewestIntoView<T extends HTMLElement>(count: number) {
  const ref = useRef<T | null>(null);
  const prevCountRef = useRef(count);

  useEffect(() => {
    if (count > prevCountRef.current && ref.current) {
      scrollIntoViewIfNeeded(ref.current);
    }
    prevCountRef.current = count;
  }, [count]);

  return ref;
}
