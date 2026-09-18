// On mobile, focusing a search/filter input pops the on-screen keyboard up
// over the bottom half of the viewport, hiding the typed input and whatever
// feedback (results list, dropdown) renders below it — the user can't tell
// their typing had any effect. This nudges the field (and some space below
// it) above the keyboard once it's finished animating in.
//
// Scrolls the nearest scrollable ancestor directly (computing the offset by
// hand) rather than delegating to el.scrollIntoView() — this app's dashboard
// shell scrolls an inner flex container, not the document, and scrollIntoView
// has proven unreliable for that kind of nested (non-root) scroll container
// across browser engines. Falls back to window scrolling when there is no
// such ancestor (plain, non-dashboard pages).
function centerField(el: HTMLElement): void {
  let container: HTMLElement | null = el.parentElement;
  while (
    container &&
    (container.scrollHeight <= container.clientHeight || getComputedStyle(container).overflowY === "visible")
  ) {
    container = container.parentElement;
  }

  const elRect = el.getBoundingClientRect();
  const elCenter = elRect.top + elRect.height / 2;

  if (container) {
    const containerRect = container.getBoundingClientRect();
    const containerCenter = containerRect.top + containerRect.height / 2;
    container.scrollTop += elCenter - containerCenter;
  } else {
    const viewportCenter = window.innerHeight / 2;
    window.scrollTo({ top: window.scrollY + (elCenter - viewportCenter) });
  }
}

// Same "walk up to the nearest ancestor that actually overflows" logic as
// centerField above, factored out so scrollIntoViewIfNeeded can reuse it —
// this app's admin/account dashboard shell scrolls an inner flex container
// (AccountShell), not the document, so native el.scrollIntoView() can't be
// trusted to pick the right scroll box (see the file-level comment above).
function findScrollableAncestor(el: HTMLElement): HTMLElement | null {
  let container: HTMLElement | null = el.parentElement;
  while (
    container &&
    (container.scrollHeight <= container.clientHeight || getComputedStyle(container).overflowY === "visible")
  ) {
    container = container.parentElement;
  }
  return container;
}

// Small gap kept between the element and the edge it's scrolled to, so it
// doesn't end up flush against the very top/bottom of its container.
const VIEWPORT_EDGE_PADDING = 16;

/**
 * Smoothly scrolls just enough — inside `el`'s nearest real scrollable
 * ancestor if it has one, the window otherwise — to bring `el` fully into
 * view. A no-op if `el` is already fully visible, so it's safe to call
 * unconditionally whenever a new list row mounts or a popover/modal opens,
 * rather than only when the caller has already worked out it's needed.
 */
export function scrollIntoViewIfNeeded(el: HTMLElement): void {
  const container = findScrollableAncestor(el);
  const elRect = el.getBoundingClientRect();

  if (container) {
    const containerRect = container.getBoundingClientRect();
    let delta = 0;
    if (elRect.bottom > containerRect.bottom - VIEWPORT_EDGE_PADDING) {
      delta = elRect.bottom - (containerRect.bottom - VIEWPORT_EDGE_PADDING);
    } else if (elRect.top < containerRect.top + VIEWPORT_EDGE_PADDING) {
      delta = elRect.top - (containerRect.top + VIEWPORT_EDGE_PADDING);
    }
    if (delta !== 0) container.scrollBy({ top: delta, behavior: "smooth" });
  } else {
    let delta = 0;
    if (elRect.bottom > window.innerHeight - VIEWPORT_EDGE_PADDING) {
      delta = elRect.bottom - (window.innerHeight - VIEWPORT_EDGE_PADDING);
    } else if (elRect.top < VIEWPORT_EDGE_PADDING) {
      delta = elRect.top - VIEWPORT_EDGE_PADDING;
    }
    if (delta !== 0) window.scrollBy({ top: delta, behavior: "smooth" });
  }
}

export function scrollFieldAboveKeyboard(el: HTMLElement): void {
  // visualViewport.resize fires exactly when the on-screen keyboard finishes
  // opening — precise, unlike guessing a fixed delay. Not supported by every
  // browser, so fall back to a delay long enough to cover most keyboard
  // open animations.
  const viewport = window.visualViewport;
  if (!viewport) {
    window.setTimeout(() => centerField(el), 300);
    return;
  }

  const onResize = () => {
    viewport.removeEventListener("resize", onResize);
    centerField(el);
  };
  viewport.addEventListener("resize", onResize);
  // The keyboard may already be up (field re-focused without it closing) —
  // in that case resize never fires again, so also try once after a beat.
  window.setTimeout(() => {
    viewport.removeEventListener("resize", onResize);
    centerField(el);
  }, 400);
}
