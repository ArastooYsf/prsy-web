"use client";

import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";

type CloseFn = () => void;

type OverlayCoordinatorContextValue = {
  requestOpen: (id: string, close: CloseFn) => void;
  notifyClosed: (id: string) => void;
};

const OverlayCoordinatorContext = createContext<OverlayCoordinatorContextValue | null>(null);

// Site-wide "at most one top-level panel open" coordinator — the mobile nav
// drawer, the products mega-menu, the cart dropdown, header search, a
// product gallery lightbox, and a product card's quick-preview popover each
// manage their own open state independently (no shared parent to coordinate
// through), so nothing previously stopped two of them from being open at
// once (e.g. opening the mobile drawer while the search dropdown was still
// open). This tracks only the single most-recently-opened one and closes
// whichever was open before it, rather than centralizing the open state
// itself — every panel keeps owning its own state/animation exactly as
// before, this just tells the previous one to close.
export function OverlayCoordinatorProvider({ children }: { children: ReactNode }) {
  const activeRef = useRef<{ id: string; close: CloseFn } | null>(null);

  const requestOpen = (id: string, close: CloseFn) => {
    if (activeRef.current && activeRef.current.id !== id) {
      activeRef.current.close();
    }
    activeRef.current = { id, close };
  };

  const notifyClosed = (id: string) => {
    if (activeRef.current?.id === id) activeRef.current = null;
  };

  return (
    <OverlayCoordinatorContext.Provider value={{ requestOpen, notifyClosed }}>
      {children}
    </OverlayCoordinatorContext.Provider>
  );
}

/**
 * Opts one panel into the site-wide exclusive-open coordinator. `id` must be
 * stable per instance — a component with several instances on screen at once
 * (e.g. ProductQuickPreview, one per product card) should derive it from
 * `useId()` rather than hardcoding a shared string, or every instance would
 * fight over the same slot. Call with the panel's own `open` state and a
 * function that closes it; nothing else about how the panel opens/closes
 * needs to change.
 */
export function useExclusiveOverlay(id: string, open: boolean, close: CloseFn) {
  const ctx = useContext(OverlayCoordinatorContext);
  // The coordinator may call this well after the render that captured it —
  // a ref keeps it current without re-registering on every re-render caused
  // by unrelated state changes in the caller.
  const closeRef = useRef(close);
  closeRef.current = close;

  useEffect(() => {
    if (!ctx) return;
    if (open) {
      ctx.requestOpen(id, () => closeRef.current());
    } else {
      ctx.notifyClosed(id);
    }
  }, [ctx, id, open]);

  // A route change or parent unmount can remove a still-open panel without
  // `open` ever flipping to false — without this, the coordinator would go
  // on believing a panel that no longer exists is still the active one and
  // never ask anything to close in its place.
  useEffect(() => {
    return () => {
      if (ctx) ctx.notifyClosed(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx, id]);
}
