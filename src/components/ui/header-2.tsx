'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
	motion,
	useMotionValue,
	useMotionValueEvent,
	useScroll as useFramerScroll,
	useSpring,
	useTransform,
} from 'framer-motion';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ShoppingCart } from 'lucide-react';
import { MenuToggleIcon } from '@/components/ui/menu-toggle-icon';
import { HeaderSearch } from '@/components/ui/HeaderSearch';
import { ProductsMegaMenu } from '@/components/ui/ProductsMegaMenu';
import { MobileProductsAccordion } from '@/components/ui/MobileProductsAccordion';
import { ConsultationCtaButton } from '@/components/ui/ConsultationCtaButton';
import { ThemeToggleButton } from '@/components/ui/ThemeToggleButton';
import SpotlightCursor from '@/components/ui/SpotlightCursor';
import AuthNavLink from '@/components/AuthNavLink';
import { useSiteTheme } from '@/components/RouteThemeScope';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import type { MenuCategory } from '@/lib/menu-taxonomy';
import { DEFAULT_HEADER_NAV_LABELS } from '@/lib/site-content-defaults';
import type { HeaderNavLabelsContent } from '@/lib/site-content';

// How far (in px) the user needs to scroll before the header's ambient glow
// reaches full intensity. Matches GLOW_MAX_SHADOW below.
const GLOW_DISTANCE = 300;
const GLOW_MAX_SHADOW = '0 8px 40px -4px rgba(249, 115, 22, 0.25)';
// This is a hardcoded rgba string driven straight through framer-motion's
// style prop, not a Tailwind class, so it can't pick up the CSS-variable
// override .theme-white-blue uses elsewhere — it needs its own blue variant,
// picked at render time from the live theme (see isLightTheme below).
const GLOW_MAX_SHADOW_BLUE = '0 8px 40px -4px rgba(37, 99, 235, 0.25)';

// The hover "speed bump" indicator: a standalone flat-topped trapezoid
// ("platform") that fades in directly under whichever nav item is hovered —
// nothing renders at all while nothing is hovered (no persistent baseline).
// Only its width and horizontal position come from the hovered item's real
// measured bounds (never hardcoded, since label widths differ); its height
// is a fixed constant so every item's platform reads as the same physical
// object rather than growing/shrinking with the label, which would make the
// row feel unstable. Corners are rounded (small fillets via SVG `Q`, not
// sharp `L`-to-`L` joins). Position/width animate via spring and visibility
// via a fast opacity spring (not a raw `d` transition, which can't
// interpolate between differently-shaped paths) so both sliding between
// items and fading in/out stay smooth instead of jump-cutting.
const BUMP_HEIGHT = 48; // matches nav's lg:h-12 — the platform's own bottom edge sits flush with the row's bottom
// The flat top of the platform sits this many px below the row's top edge. The
// nav links are `size:sm` (h-9, 36px) centred in the 48px row, so their own top
// is ~6px down — a value just under that puts the platform's top level with (a
// hair above) the button, instead of the old sliver that stopped well short and
// let the button stick out above it.
const PLATFORM_TOP_Y = 3;
const PLATFORM_RAMP_RUN = 12; // 45°-ish base ramp's horizontal run — kept short so the tall platform doesn't flare wide
const PLATFORM_CORNER_RADIUS = 4;
const BUMP_SPRING = { stiffness: 500, damping: 40 };
const BUMP_OPACITY_SPRING = { stiffness: 600, damping: 45 }; // snappy, non-bouncy fade in/out

type Point = readonly [number, number];

// Traces a closed polygon with each corner rounded to `radius` (clamped to
// half the shorter adjacent edge so fillets on a small shape never overlap
// past the corner into each other) — a small quadratic-Bezier fillet at each
// vertex instead of a sharp `L`-to-`L` join.
function roundedPolygonPath(points: Point[], radius: number): string {
	const n = points.length;
	const commands: string[] = [];
	for (let i = 0; i < n; i++) {
		const curr = points[i];
		const prev = points[(i - 1 + n) % n];
		const next = points[(i + 1) % n];
		const distPrev = Math.hypot(prev[0] - curr[0], prev[1] - curr[1]);
		const distNext = Math.hypot(next[0] - curr[0], next[1] - curr[1]);
		const r = Math.min(radius, distPrev / 2, distNext / 2);
		// A zero-length adjacent edge (e.g. halfW === 0 before the first-ever
		// hover, when the top edge collapses to a single point) would divide
		// by zero below — fall back to the vertex itself rather than NaN.
		const startPt: Point = distPrev === 0 ? curr : [curr[0] + ((prev[0] - curr[0]) / distPrev) * r, curr[1] + ((prev[1] - curr[1]) / distPrev) * r];
		const endPt: Point = distNext === 0 ? curr : [curr[0] + ((next[0] - curr[0]) / distNext) * r, curr[1] + ((next[1] - curr[1]) / distNext) * r];
		commands.push(i === 0 ? `M ${startPt[0]} ${startPt[1]}` : `L ${startPt[0]} ${startPt[1]}`);
		commands.push(`Q ${curr[0]} ${curr[1]} ${endPt[0]} ${endPt[1]}`);
	}
	commands.push('Z');
	return commands.join(' ');
}

function buildTrapezoidPath(cx: number, halfW: number, navWidth: number) {
	const bottomY = BUMP_HEIGHT;
	const topY = PLATFORM_TOP_Y;
	const left = cx - halfW;
	const right = cx + halfW;
	// Clamped so an item near the row's own edge can't push a ramp past the
	// SVG's bounds — the row has no overflow-hidden of its own, so an
	// unclamped ramp there would visibly bleed past the header's edge.
	const rampLeftBase = Math.max(0, left - PLATFORM_RAMP_RUN);
	const rampRightBase = navWidth > 0 ? Math.min(navWidth, right + PLATFORM_RAMP_RUN) : right + PLATFORM_RAMP_RUN;
	const points: Point[] = [
		[rampLeftBase, bottomY],
		[left, topY],
		[right, topY],
		[rampRightBase, bottomY],
	];
	return roundedPolygonPath(points, PLATFORM_CORNER_RADIUS);
}

export function Header({
	menuCategories = [],
	navLabels = DEFAULT_HEADER_NAV_LABELS,
}: {
	menuCategories?: MenuCategory[];
	navLabels?: HeaderNavLabelsContent;
}) {
	const pathname = usePathname();
	const [open, setOpen] = React.useState(false);
	const isAccountArea = pathname?.startsWith('/account');
	const siteTheme = useSiteTheme();
	const isLightTheme = siteTheme?.theme !== 'dark';
	const isOffline = useOnlineStatus();

	// The mobile drawer is `position:fixed`, so its `top` offset has to match
	// the header's actual rendered height in px — not a hardcoded Tailwind
	// class. A hardcoded value silently goes stale the moment the header's
	// content changes height (this bug: enlarging the search input grew the
	// header, but the drawer's old fixed `top-14` didn't move with it, so the
	// drawer crept up and buried the close button underneath itself). Measured
	// on mount and on resize so it can't drift out of sync again.
	const headerRef = React.useRef<HTMLElement>(null);
	const [headerHeight, setHeaderHeight] = React.useState(0);
	const measureHeader = React.useCallback(() => {
		if (headerRef.current) setHeaderHeight(headerRef.current.offsetHeight);
	}, []);
	React.useEffect(() => {
		measureHeader();
		window.addEventListener('resize', measureHeader);
		return () => window.removeEventListener('resize', measureHeader);
	}, [measureHeader]);
	// isOffline isn't a viewport resize, but it does change the header's own
	// rendered height (the pt-12 above) — re-measure so the mobile drawer's
	// `top: headerHeight` (below) doesn't drift stale by that amount while
	// the offline banner is showing. Separate from the listener effect above
	// so toggling connectivity doesn't churn the resize subscription.
	React.useEffect(() => {
		measureHeader();
	}, [isOffline, measureHeader]);

	const toggleButtonRef = React.useRef<HTMLButtonElement>(null);
	const drawerRef = React.useRef<HTMLDivElement>(null);

	// Single scroll listener (framer-motion's) drives both `scrolled` and the
	// glow below, instead of a second independent window scroll listener.
	const { scrollY } = useFramerScroll();
	// Lazy initializer (not `useState(false)`) so a page that mounts already
	// scrolled — a hash-anchor link, restored scroll position — starts in the
	// correct state instead of flashing "unscrolled" until the next scroll
	// event fires (the "change" subscription below only fires on changes,
	// not once with the current value on subscribe).
	const [scrolled, setScrolled] = React.useState(() => scrollY.get() > 10);
	useMotionValueEvent(scrollY, 'change', (latest) => setScrolled(latest > 10));

	const glowProgress = useSpring(useTransform(scrollY, [0, GLOW_DISTANCE], [0, 1], { clamp: true }), {
		stiffness: 400,
		damping: 40,
	});
	// The shadow's *shape* never changes as the user scrolls, only its
	// intensity — so the animated property is `opacity` on a layer painted
	// once at full intensity, not the `box-shadow` value itself. Interpolating
	// the shadow string every frame (the old approach) forces the browser to
	// repaint the blur on every scroll tick; opacity is compositor-only, so
	// the GPU just cross-fades an already-painted layer instead.
	const glowShadow = isLightTheme ? GLOW_MAX_SHADOW_BLUE : GLOW_MAX_SHADOW;

	// Nav hover "speed bump" indicator — see buildTrapezoidPath above.
	const navRowRef = React.useRef<HTMLDivElement>(null);
	// The two `lg:flex-1` side tracks flanking the centered links group (see
	// the comment on the logo wrapper below) — their box size, not just
	// nav's own, is what actually moves a hovered item: nav's outer width
	// can hold steady while these two still redistribute internally (e.g.
	// the logo text collapsing on scroll doesn't change nav's own width at
	// all, only how much of it each side keeps). Watched by the same
	// ResizeObserver as nav itself, below.
	const logoSideRef = React.useRef<HTMLDivElement>(null);
	const trioSideRef = React.useRef<HTMLDivElement>(null);
	const hasPositionedBump = React.useRef(false);
	const bumpTargetX = useMotionValue(0);
	const bumpTargetHalfW = useMotionValue(0);
	const bumpTargetOpacity = useMotionValue(0);
	const bumpX = useSpring(bumpTargetX, BUMP_SPRING);
	const bumpHalfW = useSpring(bumpTargetHalfW, BUMP_SPRING);
	const bumpOpacity = useSpring(bumpTargetOpacity, BUMP_OPACITY_SPRING);
	// Refreshed on every hover (handleItemEnter below already measures the
	// row's rect for centerX) rather than tracked live via its own
	// ResizeObserver — the platform is invisible whenever nothing is
	// hovered, so there's nothing for a resize to visibly desync while
	// idle, and a value that's fresh as of the most recent hover is fresh
	// enough for the edge clamp below.
	const navWidthRef = React.useRef(0);
	const bumpPath = useTransform([bumpX, bumpHalfW], ([cx, hw]) => buildTrapezoidPath(cx as number, hw as number, navWidthRef.current));

	// The row's own rect only actually moves on resize or scroll (scrolling
	// can toggle the `scrolled` padding swap above, and can dock/undock the
	// sticky header) — cached and invalidated on those instead of
	// re-measured on every single hover, same pattern SpotlightCursor.tsx
	// uses for its own container rect.
	const navRowRectRef = React.useRef<DOMRect | null>(null);
	// The element currently under the cursor, so a resize/scroll mid-hover
	// (below) can re-measure the same real target instead of trusting the
	// x/width it captured before the layout moved.
	const activeHoverItemRef = React.useRef<HTMLElement | null>(null);
	// Re-measures the actively-hovered item and pushes fresh coordinates into
	// the springs. A no-op while nothing is hovered. Scroll toggles the
	// header's `scrolled` padding swap and resize can change every item's
	// position outright — without this, the platform kept animating toward
	// whatever x/width it last captured before the layout moved, so it would
	// visibly detach from the button it's supposed to be sitting under.
	const recomputeActiveHoverBump = React.useCallback(() => {
		const item = activeHoverItemRef.current;
		const container = navRowRef.current;
		if (!item || !container || !item.isConnected) return;
		const containerRect = container.getBoundingClientRect();
		navRowRectRef.current = containerRect;
		const itemRect = item.getBoundingClientRect();
		navWidthRef.current = containerRect.width;
		const centerX = itemRect.left + itemRect.width / 2 - containerRect.left;
		const halfW = itemRect.width / 2;
		bumpTargetX.set(centerX);
		bumpTargetHalfW.set(halfW);
	}, [bumpTargetX, bumpTargetHalfW]);
	React.useEffect(() => {
		const invalidate = () => {
			navRowRectRef.current = null;
			recomputeActiveHoverBump();
		};
		window.addEventListener('resize', invalidate);
		window.addEventListener('scroll', invalidate, { passive: true });
		return () => {
			window.removeEventListener('resize', invalidate);
			window.removeEventListener('scroll', invalidate);
		};
	}, [recomputeActiveHoverBump]);
	// The `scroll`/`resize` listeners above fire once, synchronously, the
	// instant the header starts reacting — but the header's own width/inset
	// change on `scrolled` (the `lg:max-w-6xl` -> `lg:max-w-5xl` swap) and the
	// logo text's collapse are both animated `duration-300` CSS transitions,
	// not an instant snap. A single recompute at the scroll event's own
	// moment captures the layout before any of that has moved, so the
	// platform stayed correctly positioned for the OLD layout while it
	// animated out from under it over the next 300ms. A ResizeObserver
	// fires on every frame any of these three boxes actually changes size —
	// nav's own outer width, and the two `lg:flex-1` side tracks whose
	// internal redistribution moves a hovered item even when nav's own
	// width hasn't changed — so the platform tracks the whole reflow live.
	React.useEffect(() => {
		const nav = navRowRef.current;
		const logoSide = logoSideRef.current;
		const trioSide = trioSideRef.current;
		if (!nav) return;
		const observer = new ResizeObserver(() => {
			navRowRectRef.current = null;
			recomputeActiveHoverBump();
		});
		observer.observe(nav);
		if (logoSide) observer.observe(logoSide);
		if (trioSide) observer.observe(trioSide);
		return () => observer.disconnect();
	}, [recomputeActiveHoverBump]);
	// Safety net for the observers above: a ResizeObserver's last callback
	// during a fast multi-property transition isn't guaranteed to land
	// exactly on the transition's final frame, which can leave the target
	// one frame stale. `transitionend` (bubbles up from nav's own, the logo
	// text's, or the header's transition, whichever finishes last) forces
	// one definitely-final recompute once everything has actually settled.
	React.useEffect(() => {
		const header = headerRef.current;
		if (!header) return;
		const onTransitionEnd = () => recomputeActiveHoverBump();
		header.addEventListener('transitionend', onTransitionEnd);
		return () => header.removeEventListener('transitionend', onTransitionEnd);
	}, [recomputeActiveHoverBump]);

	// Bound directly to each nav item's own real element (its `onMouseEnter`/
	// `onMouseLeave` below — see the JSX), not a padded wrapper around it and
	// not a bubbled `onMouseOver` on their shared container: `mouseenter`/
	// `mouseleave` don't bubble and fire exactly at that element's own
	// rendered box, so the platform tracks precisely what the eye sees as
	// "the button" — appearing only inside it and disappearing the instant
	// the cursor leaves it, with no larger or looser hit area. Because these
	// fire once per real enter/exit (never repeatedly while the cursor just
	// sits still or sweeps across a single element), no rAF-batching is
	// needed here — unlike a `mousemove`-driven effect, there's nothing to
	// throttle.
	const handleItemEnter = (item: HTMLElement) => {
		const container = navRowRef.current;
		if (!container) return;
		activeHoverItemRef.current = item;
		const containerRect = navRowRectRef.current ?? (navRowRectRef.current = container.getBoundingClientRect());
		const itemRect = item.getBoundingClientRect();
		navWidthRef.current = containerRect.width;
		const centerX = itemRect.left + itemRect.width / 2 - containerRect.left;
		const halfW = itemRect.width / 2;
		bumpTargetX.set(centerX);
		bumpTargetHalfW.set(halfW);
		if (!hasPositionedBump.current) {
			// First hover this session: jump the position/width springs straight
			// there instead of sliding in from x=0 — only the fade-in should be
			// visible, not a sweep across the whole nav row.
			bumpX.jump(centerX);
			bumpHalfW.jump(halfW);
			hasPositionedBump.current = true;
		}
		bumpTargetOpacity.set(1);
	};

	// Deliberate trade-off, not an oversight: because the hit area is now the
	// exact Link box (see handleItemEnter above) and adjacent items have a
	// small real gap between their boxes (wrapper padding, and a shorter
	// Link than the row's own height), sweeping through that gap fires this
	// before the next item's onMouseEnter, which can visibly dip the
	// platform's opacity between items rather than gliding without a blip —
	// the explicit trade-off for the platform never lingering past the
	// button's real edge.
	const handleItemLeave = () => {
		activeHoverItemRef.current = null;
		bumpTargetOpacity.set(0);
	};

	// Client-side navigation can change `scrolled` (the new page mounts
	// scrolled to the top) without the mouse ever leaving the hovered link —
	// Header lives in the root layout, so it isn't remounted by a normal
	// route change, only unmounted outright on `/account` routes (see
	// `isAccountArea` below), which would otherwise leave the platform
	// sitting at full opacity at whatever position it last had. Hiding it
	// outright on every pathname change is simpler and safer than trying to
	// recompute through both cases: reset the "first hover" flag too, so the
	// next hover on the new page jumps straight to position (invisible,
	// since opacity is already 0) instead of visibly sliding in from the
	// old page's coordinates.
	React.useEffect(() => {
		activeHoverItemRef.current = null;
		hasPositionedBump.current = false;
		bumpTargetOpacity.set(0);
	}, [pathname, bumpTargetOpacity]);

	// Spread onto every nav item's own trigger element (plain links and the
	// mega-menu's inner trigger alike) so the four call sites below don't
	// each re-type the same enter/leave wiring.
	const bumpHoverProps = { onMouseEnter: (e: React.MouseEvent<HTMLElement>) => handleItemEnter(e.currentTarget), onMouseLeave: handleItemLeave };

	const links = [
		{
			label: navLabels.home,
			href: '/',
		},
		{
			label: navLabels.about,
			href: '/about',
		},
		{
			label: navLabels.clients,
			href: '/#clients',
		},
		{
			label: navLabels.blog,
			href: '/blog',
		},
		{
			label: navLabels.faq,
			href: '/faq',
		},
	];

	React.useEffect(() => {
		if (open) {
			// Disable scroll
			document.body.style.overflow = 'hidden';
		} else {
			// Re-enable scroll
			document.body.style.overflow = '';
		}

		// Cleanup when component unmounts (important for Next.js)
		return () => {
			document.body.style.overflow = '';
		};
	}, [open]);

	React.useEffect(() => {
		if (!open) return;
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') setOpen(false);
		};
		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [open]);

	// Tapping anywhere outside the open drawer (the header bar above it —
	// logo, search input — counts as "outside" too) closes it. Excludes the
	// toggle button itself: it already flips `open` in its own onClick, and
	// since pointerdown fires before click, reacting to it here too would
	// close the menu a beat early and then have the button's own click
	// immediately reopen it.
	React.useEffect(() => {
		if (!open) return;
		const onPointerDown = (e: PointerEvent) => {
			const target = e.target as Node;
			if (drawerRef.current?.contains(target) || toggleButtonRef.current?.contains(target)) return;
			setOpen(false);
		};
		document.addEventListener('pointerdown', onPointerDown);
		return () => document.removeEventListener('pointerdown', onPointerDown);
	}, [open]);

	// A phone's physical/gesture back button normally navigates the browser
	// away from the page entirely. Pushing a throwaway history entry while
	// the drawer is open means that back press instead fires `popstate`,
	// which we catch here and treat as "close the drawer" — the standard
	// technique for making a mobile back gesture dismiss an overlay.
	React.useEffect(() => {
		if (!open) return;
		window.history.pushState({ mobileNavOpen: true }, '');
		const onPopState = () => setOpen(false);
		window.addEventListener('popstate', onPopState);
		return () => window.removeEventListener('popstate', onPopState);
	}, [open]);

	if (isAccountArea) return null;

	return (
		<motion.header
			ref={headerRef}
			className={cn(
				// The side inset (the "floating card" look) is desktop-only: on
				// mobile the header runs full-width, edge to edge — there's no
				// spare horizontal space to spend on a margin there, and the
				// search bar/nav should use the full screen width. lg: and up
				// keeps the constant inset regardless of scroll — the search bar
				// living inside needs a persistent container at every scroll
				// position. The bottom corners stay rounded at every scroll
				// position (lg:rounded-b-2xl below, unconditional); only the TOP
				// corners and the desktop "lift" (shadow/blur/floating inset) are
				// scroll-conditional: flush with the top of the page the header
				// reads as sharp-topped, and the top corners round off (plus the
				// header floats/lifts) only once the user actually scrolls.
				//
				// The blurred background/shadow "lift" effect below is desktop-only (lg:)
				// on purpose: applying it at every breakpoint made the header visibly
				// flicker on mobile, since iOS's elastic overscroll bounce can push
				// scrollY back and forth across the threshold several times a second
				// near the top of the page.
				'sticky top-0 z-50 mx-auto w-full border border-foreground/10 bg-background/95 supports-[backdrop-filter]:bg-background/50 lg:w-[calc(100%-2rem)] lg:max-w-6xl lg:rounded-b-2xl lg:transition-all lg:duration-300 lg:ease-in-out',
				{
					'lg:rounded-t-2xl lg:top-4 lg:max-w-5xl lg:shadow-lg lg:shadow-black/10 lg:backdrop-blur-lg':
						scrolled && !open,
					'bg-background/90': open,
					// OfflineBanner (fixed, top-0) is min-h-9 (36px) on one line,
					// but its message wraps to two lines on narrow phones (~45px
					// measured at 375px) — pt-12 covers that wrapped height with
					// margin, padding the header's own top down so its sticky
					// top-0 box stays in place while its actual clickable content
					// (search bar, nav) moves out from under the banner instead
					// of the two overlapping.
					'pt-12': isOffline,
				},
			)}
		>
			{/* Separate element (not a style on motion.header itself) on purpose:
				an inline style={{boxShadow}} always wins over the Tailwind
				lg:shadow-lg/lg:shadow-black classes above regardless of specificity,
				which would silently kill the scrolled "lift" shadow. This layer
				only carries the ambient glow; `rounded-[inherit]` follows whatever
				radius the header itself currently has, without duplicating that
				conditional here.

				`boxShadow` itself is a static, pre-painted value — only `opacity`
				animates as the user scrolls, which the compositor can cross-fade
				without re-painting the blur on every scroll tick.
				`will-change: opacity` is scoped to just this element (not the
				header or any ancestor) so the GPU layer promotion it requests
				stays cheap. */}
			<motion.div
				aria-hidden
				className="pointer-events-none absolute inset-0 rounded-[inherit] will-change-[opacity]"
				style={{ boxShadow: glowShadow, opacity: glowProgress }}
			/>

			{/* Trial run of the cursor-following spotlight (see SpotlightCursor) —
				scoped to just the navbar for now, per the plan to measure its
				Lighthouse impact here and on the Hero before considering it
				anywhere else. z-[1] keeps it above the header's own background
				but below the real content (z-10 below), same convention Hero.tsx
				uses for its own instance — an explicit stacking layer any sibling
				participates in correctly by default, rather than relying on which
				siblings happen to already be `position`ed. */}
			<SpotlightCursor className="z-[1] rounded-[inherit]" />

			{/* z-30, not z-10: this row's own stacking context must outrank the
				<nav> row below (also z-10, but a later sibling — with equal
				z-index, later DOM order wins) or the search dropdown's absolutely-
				positioned card — even though it's z-40/z-50 *inside* this row —
				gets painted underneath the whole nav row (logo/links/buttons show
				through on top of it) once it expands past this row's own height. */}
			<div className="relative z-30 w-full border-b border-foreground/5 px-4 py-2.5 lg:border-foreground/10 lg:py-2">
				<HeaderSearch />
			</div>

			<nav
				ref={navRowRef}
				className={cn(
					// lg:items-stretch (overriding the base items-center) lets the
					// nav-links row and the hover-bump wrappers inside it fill the
					// full row height instead of sizing to their own content — the
					// hover hit-area fix depends on this. Mobile stays items-center
					// since the links row is hidden there anyway. z-10 keeps it above
					// SpotlightCursor's z-[1] glow layer — see the comment above.
					'relative z-10 flex h-14 w-full items-center justify-between px-4 lg:h-12 lg:items-stretch lg:transition-all lg:duration-300 lg:ease-in-out',
					{
						'lg:px-2': scrolled,
					},
				)}
			>
				{/* Hover "speed bump": a standalone rounded platform that fades in
					under whichever nav item is currently hovered — see
					buildTrapezoidPath above. Desktop-only, same as the links it
					tracks. Its fill is `--accent`, the exact colour a `ghost`
					button uses for `hover:bg-accent` — but the nav links here have
					that hover background stripped off (see below), so this platform
					IS their hover surface, not a second layer stacked on one. One
					element, one opacity spring, so the hover fill can't fall out of
					sync with itself. `-z-10` (a negative z-index — painted before the
					row's non-positioned links) drops it below the labels so the
					opaque fill reads as the button's own surface stretching
					outward, never as a slab over the label. */}
				<svg
					aria-hidden
					className="pointer-events-none absolute inset-x-0 top-0 -z-10 hidden h-12 w-full overflow-visible lg:block"
				>
					<motion.path d={bumpPath} style={{ opacity: bumpOpacity }} className="fill-[rgb(var(--accent))]" />
				</svg>

				{/* `justify-between` alone (the old layout) only puts the nav-links
					group's visual center on the nav's true center when this side and
					the button trio on the other side happen to weigh exactly the
					same — they don't (the trio is a lot wider), so the group sat
					off-center toward it. `lg:flex-1` makes this wrapper and the
					trio's own wrapper below grow to fill an EQUAL share of whatever
					space is left over after the links group and both sides' own
					content take what they need — so as long as there's enough room,
					both sides end up the same width and the middle group lands dead
					center, no matter how unevenly the logo and trio content are
					themselves sized. On a narrow `lg` window there's a floor to this:
					flex items never shrink below their own content's width, so if the
					trio's content alone needs more than an equal half-share, its side
					simply keeps that width instead of shrinking further — the group
					drifts slightly off-true-center rather than centering exactly, but
					crucially the two never overlap (an earlier `position:absolute`
					version of this fix centered exactly always, but had no such
					floor, so on an in-between `lg` width it could genuinely overlap
					the trio — see the removed version in git history). */}
				<div ref={logoSideRef} className="flex items-center lg:flex-1 lg:items-stretch">
					<Link
						href="/"
						className="group flex shrink-0 items-center gap-2 text-base font-bold transition-transform duration-300 hover:scale-[1.03]"
					>
						<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-accent-400 to-accent-600 text-xs font-bold text-brand-950 shadow-md shadow-accent-500/20 transition-shadow duration-300 group-hover:shadow-lg group-hover:shadow-accent-500/30">
							یا
						</span>
						{/* Collapses via max-width + opacity, not a `hidden` display toggle:
							display:none can't be transitioned, so the old on/off switch made
							this text's width disappear in a single frame — which yanked
							every sibling that depends on this box's width (the nav-links
							group, the button trio) into their new positions with it, since
							nothing about a hard width change can be smoothed. Shrinking to
							max-width:0 instead lets `lg:transition-all` on the header/nav
							animate the whole reflow together. */}
						<span
							className={cn(
								'hidden overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-300 ease-in-out sm:inline-block',
								scrolled ? 'lg:max-w-0 lg:opacity-0' : 'lg:max-w-[220px] lg:opacity-100',
							)}
						>
							پویش راه صنعت<span className="text-accent-400"> یاشار</span>
						</span>
					</Link>
				</div>
				{/* lg:ml-4: fixed breathing room against the button trio to its left —
					without it the gap there could shrink to just a couple of px once
					the trio's own `lg:flex-1` track is pinned at its content's min
					width (e.g. once "تماس با ما" shows at `xl:`), since that track has
					no leftover space left to keep the two apart on its own. */}
				<div className="hidden items-stretch lg:ml-4 lg:flex">
					{/* This wrapper is layout only (vertical centering within the
						full-row-height flex parent) — the platform's hit area binds to
						the Link itself below (onMouseEnter/onMouseLeave), not to this
						div's own padded bounds. */}
					<div className="flex h-full items-center px-0.5">
						<Link
							className={cn(
								buttonVariants({ variant: 'ghost', size: 'sm', className: 'px-2.5' }),
								// Strip ghost's own hover:bg-accent / hover:text-accent-foreground:
								// the shared speed-bump platform below is the hover surface for
								// these links, so the button must not paint a second one.
								'hover:bg-transparent hover:text-foreground',
							)}
							href={links[0].href}
							{...bumpHoverProps}
						>
							{links[0].label}
						</Link>
					</div>
					<ProductsMegaMenu
						categories={menuCategories}
						onBumpEnter={handleItemEnter}
						onBumpLeave={handleItemLeave}
					/>
					{links.slice(1).map((link, i) => (
						<div key={i} className="flex h-full items-center px-0.5">
							<Link
								className={cn(
									buttonVariants({ variant: 'ghost', size: 'sm', className: 'px-2.5' }),
									'hover:bg-transparent hover:text-foreground',
								)}
								href={link.href}
								{...bumpHoverProps}
							>
								{link.label}
							</Link>
						</div>
					))}
				</div>
				{/* Mirrors the logo wrapper's `lg:flex-1` above (see that comment) —
					`lg:justify-end` keeps this side's own content pinned to the nav's
					outer edge as its track grows, instead of the content drifting
					toward the middle as empty space is added around it. */}
				<div ref={trioSideRef} className="hidden items-center gap-2 lg:flex lg:flex-1 lg:justify-end">
					<Button variant="outline" size="sm" className="hidden xl:inline-flex" asChild>
						<Link href="/contact">تماس با ما</Link>
					</Button>
					<ConsultationCtaButton size="sm" className="hover:shadow-lg hover:shadow-accent-500/30" />
					<Button size="icon" variant="outline" className="h-9 w-9" asChild>
						<Link href="/cart" aria-label="سبد خرید">
							<ShoppingCart className="size-[18px]" />
						</Link>
					</Button>
					<AuthNavLink variant="icon" />
					<ThemeToggleButton />
				</div>
				<Button
					ref={toggleButtonRef}
					size="icon"
					variant="outline"
					onClick={() => setOpen(!open)}
					aria-label={open ? 'بستن منو' : 'باز کردن منو'}
					aria-expanded={open}
					aria-controls="mobile-nav-drawer"
					className="transition-transform duration-300 hover:scale-105 lg:hidden"
				>
					<MenuToggleIcon open={open} className="size-5" duration={300} />
				</Button>
			</nav>

			<div
				id="mobile-nav-drawer"
				ref={drawerRef}
				style={{ top: headerHeight || undefined }}
				className={cn(
					'bg-background fixed right-0 bottom-0 left-0 z-50 flex flex-col overflow-y-auto border-y lg:hidden',
					open ? 'block' : 'hidden',
				)}
			>
				<div
					data-slot={open ? 'open' : 'closed'}
					className={cn(
						'data-[slot=open]:animate-in data-[slot=open]:zoom-in-95 data-[slot=closed]:animate-out data-[slot=closed]:zoom-out-95 ease-out',
						'flex min-h-full w-full flex-col justify-between gap-y-2 p-4',
					)}
				>
					<div className="grid gap-y-2">
						<Link
							className={buttonVariants({ variant: 'ghost', className: 'justify-start' })}
							href={links[0].href}
							onClick={() => setOpen(false)}
						>
							{links[0].label}
						</Link>
						{/* The hover-driven mega menu doesn't translate to touch, so
							mobile gets its own vertical-accordion rendering of the same
							real category/brand data — see MobileProductsAccordion. */}
						<MobileProductsAccordion categories={menuCategories} drawerOpen={open} onNavigate={() => setOpen(false)} />
						{links.slice(1).map((link) => (
							<Link
								key={link.label}
								className={buttonVariants({
									variant: 'ghost',
									className: 'justify-start',
								})}
								href={link.href}
								onClick={() => setOpen(false)}
							>
								{link.label}
							</Link>
						))}
					</div>
					<div className="flex flex-col gap-2">
						<Button variant="outline" className="w-full" asChild>
							<Link href="/contact" onClick={() => setOpen(false)}>
								تماس با ما
							</Link>
						</Button>
						<ConsultationCtaButton
							fullWidth
							className="hover:shadow-lg hover:shadow-accent-500/30"
							onNavigate={() => setOpen(false)}
						/>
						<Button variant="outline" className="w-full" asChild>
							<Link href="/cart" onClick={() => setOpen(false)}>
								<ShoppingCart className="size-4" />
								سبد خرید
							</Link>
						</Button>
						<AuthNavLink variant="block" onNavigate={() => setOpen(false)} />
						<ThemeToggleButton fullWidth />
					</div>
				</div>
			</div>
		</motion.header>
	);
}
