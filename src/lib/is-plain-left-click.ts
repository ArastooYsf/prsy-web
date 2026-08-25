import type { MouseEvent } from "react";

/**
 * True for a plain left-click with no modifier keys — the only case where
 * intercepting a <Link>'s default navigation (to animate first, then
 * `router.push`) is safe. Cmd/Ctrl/Shift/Alt-click and middle-click must
 * fall through to the browser's native new-tab/new-window behavior.
 */
export function isPlainLeftClick(e: MouseEvent) {
  return !e.defaultPrevented && e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
}
