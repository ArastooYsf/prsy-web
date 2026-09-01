"use client";

import { useEffect, useRef } from "react";

// A soft, cursor-following highlight for a section's background — not a
// dimming vignette (that would read as muddy on the site's light-themed
// routes). Mount this as the first child of a `relative`/`sticky`
// positioned container; it fills that container and reads the live mouse
// position off it.
//
// Position updates never touch React state or trigger a re-render: the
// raw pointer coordinates are stashed in a ref on every `pointermove`, and
// the actual DOM read (the container's rect) + write (the CSS custom
// properties the gradient is centered on) happen together, once, inside a
// single requestAnimationFrame callback — the same rAF-batching pattern
// header-2.tsx's nav hover indicator already uses, so a fast mouse sweep
// costs at most one forced layout per frame, never one per raw event.
export default function SpotlightCursor({ className = "" }: { className?: string }) {
  const layerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const pointerRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const layer = layerRef.current;
    const container = layer?.parentElement;
    if (!layer || !container) return;
    // No persistent hover on touch — skip entirely rather than leave the
    // glow stuck wherever the last tap landed.
    if (!window.matchMedia("(hover: hover)").matches) return;

    const applyPosition = () => {
      rafRef.current = null;
      const rect = container.getBoundingClientRect();
      layer.style.setProperty("--spotlight-x", `${pointerRef.current.x - rect.left}px`);
      layer.style.setProperty("--spotlight-y", `${pointerRef.current.y - rect.top}px`);
    };
    const handleMove = (e: PointerEvent) => {
      pointerRef.current = { x: e.clientX, y: e.clientY };
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(applyPosition);
    };
    const handleEnter = () => layer.style.setProperty("--spotlight-opacity", "1");
    const handleLeave = () => layer.style.setProperty("--spotlight-opacity", "0");

    container.addEventListener("pointermove", handleMove);
    container.addEventListener("pointerenter", handleEnter);
    container.addEventListener("pointerleave", handleLeave);
    return () => {
      container.removeEventListener("pointermove", handleMove);
      container.removeEventListener("pointerenter", handleEnter);
      container.removeEventListener("pointerleave", handleLeave);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div
      ref={layerRef}
      aria-hidden
      className={`pointer-events-none absolute inset-0 opacity-[var(--spotlight-opacity,0)] transition-opacity duration-500 will-change-[opacity] ${className}`}
      style={{
        background:
          "radial-gradient(480px circle at var(--spotlight-x, 50%) var(--spotlight-y, 50%), rgb(var(--accent-500) / 0.10), transparent 70%)",
      }}
    />
  );
}
