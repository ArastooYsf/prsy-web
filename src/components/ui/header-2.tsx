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
import { MenuToggleIcon } from '@/components/ui/menu-toggle-icon';
import { HeaderSearch } from '@/components/ui/HeaderSearch';
import { ProductsMegaMenu } from '@/components/ui/ProductsMegaMenu';
import { MobileProductsAccordion } from '@/components/ui/MobileProductsAccordion';
import { ConsultationCtaButton } from '@/components/ui/ConsultationCtaButton';
import { ThemeToggleButton } from '@/components/ui/ThemeToggleButton';
import { NavActionGlow } from '@/components/ui/NavActionGlow';
import SpotlightCursor from '@/components/ui/SpotlightCursor';
import AuthNavLink from '@/components/AuthNavLink';
import { useSiteTheme } from '@/components/RouteThemeScope';
import type { ProductCategoryContent } from '@/lib/site-content-defaults';

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
const PLATFORM_RISE = 14; // fixed platform height — never derived from item width
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
	const topY = BUMP_HEIGHT - PLATFORM_RISE;
	const left = cx - halfW;
	const right = cx + halfW;
	// Clamped so an item near the row's own edge can't push a ramp past the
	// SVG's bounds — the row has no overflow-hidden of its own, so an
	// unclamped ramp there would visibly bleed past the header's edge.
	// PLATFORM_RISE also doubles as the 45° ramp's horizontal run.
	const rampLeftBase = Math.max(0, left - PLATFORM_RISE);
	const rampRightBase = navWidth > 0 ? Math.min(navWidth, right + PLATFORM_RISE) : right + PLATFORM_RISE;
	const points: Point[] = [
		[rampLeftBase, bottomY],
		[left, topY],
		[right, topY],
		[rampRightBase, bottomY],
	];
	return roundedPolygonPath(points, PLATFORM_CORNER_RADIUS);
}

export function Header({ productCategories = [] }: { productCategories?: ProductCategoryContent[] }) {
	const pathname = usePathname();
	const [open, setOpen] = React.useState(false);
	const isAccountArea = pathname?.startsWith('/account');
	const siteTheme = useSiteTheme();
	const isLightTheme = siteTheme?.theme !== 'dark';

	// The mobile drawer is `position:fixed`, so its `top` offset has to match
	// the header's actual rendered height in px — not a hardcoded Tailwind
	// class. A hardcoded value silently goes stale the moment the header's
	// content changes height (this bug: enlarging the search input grew the
	// header, but the drawer's old fixed `top-14` didn't move with it, so the
	// drawer crept up and buried the close button underneath itself). Measured
	// on mount and on resize so it can't drift out of sync again.
	const headerRef = React.useRef<HTMLElement>(null);
	const [headerHeight, setHeaderHeight] = React.useState(0);
	React.useEffect(() => {
		const measure = () => {
			if (headerRef.current) setHeaderHeight(headerRef.current.offsetHeight);
		};
		measure();
		window.addEventListener('resize', measure);
		return () => window.removeEventListener('resize', measure);
	}, []);

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
	React.useEffect(() => {
		const invalidate = () => {
			navRowRectRef.current = null;
		};
		window.addEventListener('resize', invalidate);
		window.addEventListener('scroll', invalidate, { passive: true });
		return () => {
			window.removeEventListener('resize', invalidate);
			window.removeEventListener('scroll', invalidate);
		};
	}, []);

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
		bumpTargetOpacity.set(0);
	};

	// Spread onto every nav item's own trigger element (plain links and the
	// mega-menu's inner trigger alike) so the four call sites below don't
	// each re-type the same enter/leave wiring.
	const bumpHoverProps = { onMouseEnter: (e: React.MouseEvent<HTMLElement>) => handleItemEnter(e.currentTarget), onMouseLeave: handleItemLeave };

	const links = [
		{
			label: 'خانه',
			href: '/',
		},
		{
			label: 'درباره ما',
			href: '/about',
		},
		{
			label: 'مشتریان',
			href: '/#clients',
		},
		{
			label: 'وبلاگ',
			href: '/blog',
		},
		{
			label: 'سوالات متداول',
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

			<div className="relative z-10 w-full border-b border-foreground/5 px-4 py-2.5 lg:border-foreground/10 lg:py-2">
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
					tracks. Painted first so it sits behind the nav items in source
					order; the low fill opacity keeps it reading as an underlay even
					where stacking order overlaps text. */}
				<svg
					aria-hidden
					className="pointer-events-none absolute inset-x-0 top-0 hidden h-12 w-full overflow-visible lg:block"
				>
					<motion.path d={bumpPath} style={{ opacity: bumpOpacity }} className="fill-foreground/[0.06]" />
				</svg>

				<Link
					href="/"
					className="group flex shrink-0 items-center gap-2 text-base font-bold transition-transform duration-300 hover:scale-[1.03]"
				>
					<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-accent-400 to-accent-600 text-xs font-bold text-brand-950 shadow-md shadow-accent-500/20 transition-shadow duration-300 group-hover:shadow-lg group-hover:shadow-accent-500/30">
						یا
					</span>
					<span className={cn('hidden whitespace-nowrap sm:inline', scrolled && 'lg:hidden')}>
						پویش راه صنعت<span className="text-accent-400"> یاشار</span>
					</span>
				</Link>
				<div className="hidden items-stretch lg:flex [&:has(a:hover)_a:not(:hover)]:opacity-50">
					{/* This wrapper is layout only (vertical centering within the
						full-row-height flex parent) — the platform's hit area binds to
						the Link itself below (onMouseEnter/onMouseLeave), not to this
						div's own padded bounds. */}
					<div className="flex h-full items-center px-0.5">
						<Link
							className={cn(buttonVariants({ variant: 'ghost', size: 'sm', className: 'px-2.5' }), 'transition-opacity duration-200')}
							href={links[0].href}
							{...bumpHoverProps}
						>
							{links[0].label}
						</Link>
					</div>
					<ProductsMegaMenu
						categories={productCategories}
						onBumpEnter={handleItemEnter}
						onBumpLeave={handleItemLeave}
						headerRef={headerRef}
					/>
					{links.slice(1).map((link, i) => (
						<div key={i} className="flex h-full items-center px-0.5">
							<Link
								className={cn(buttonVariants({ variant: 'ghost', size: 'sm', className: 'px-2.5' }), 'transition-opacity duration-200')}
								href={link.href}
								{...bumpHoverProps}
							>
								{link.label}
							</Link>
						</div>
					))}
					{/* This trio isn't part of the shared sliding indicator above, so
						unlike those wrappers it doesn't need to sit edge-to-edge with
						its neighbors — it needs its own breathing room instead. Grouped
						in one wrapper with a real gap, plus a margin off the last nav
						link, so they don't touch. Every one of these four gets its own
						independent NavActionGlow ring on hover/focus, each colored to
						match that specific button's own real surface — the solid CTA's
						`--primary` fill, the three outline-style buttons' shared
						`--input` border — never one generic tone for all of them. */}
					<div className="mr-1 flex items-center gap-2">
						<NavActionGlow colorVar="var(--input)">
							<Button variant="outline" size="sm" className="hidden xl:inline-flex" asChild>
								<Link href="/contact">تماس با ما</Link>
							</Button>
						</NavActionGlow>
						<NavActionGlow colorVar="var(--primary)">
							<ConsultationCtaButton size="sm" className="hover:shadow-lg hover:shadow-accent-500/30" />
						</NavActionGlow>
						<NavActionGlow colorVar="var(--input)">
							<AuthNavLink variant="icon" />
						</NavActionGlow>
						<NavActionGlow colorVar="var(--input)">
							<ThemeToggleButton />
						</NavActionGlow>
					</div>
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
						<MobileProductsAccordion categories={productCategories} drawerOpen={open} onNavigate={() => setOpen(false)} />
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
						<AuthNavLink variant="block" onNavigate={() => setOpen(false)} />
						<ThemeToggleButton fullWidth />
					</div>
				</div>
			</div>
		</motion.header>
	);
}
