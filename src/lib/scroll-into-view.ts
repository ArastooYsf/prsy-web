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
