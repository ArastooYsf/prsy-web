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
import { ConsultationCtaButton } from '@/components/ui/ConsultationCtaButton';
import { ThemeToggleButton } from '@/components/ui/ThemeToggleButton';
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

// The hover "speed bump" indicator: one continuous filled polygon — a thin
// baseline bar the full width of the nav row, always visible, that rises
// into a flat-topped trapezoid ("platform") directly under whichever nav
// item (data-nav-bump) is hovered. Pure straight lines (SVG `L`, never `C`/
// `Q`) with sharp corners — no fillets, no curves. The platform's own
// proportions come from the hovered item's real width (never hardcoded):
// the flat top matches the item's width exactly, each ramp runs out half
// that width beyond the item's edge (so the trapezoid's base is ~2x the top,
// per spec), and the rise is set equal to that same run — a 1:1 slope, i.e.
// a 45° ramp. Position/width/height all animate via spring (not a raw `d`
// transition, which can't interpolate between differently-shaped paths) so
// both sliding between items and rising/settling back to the flat baseline
// stay smooth instead of jump-cutting.
const BASE_THICKNESS = 5; // idle baseline bar height — a visible strip, not a hairline
const BUMP_HEIGHT = 48; // matches nav's lg:h-12 — the polygon's bottom edge sits flush with the row's bottom
const BUMP_SPRING = { stiffness: 500, damping: 40 };

function buildTrapezoidPath(navWidth: number, cx: number, halfW: number, rise: number) {
	const baseTopY = BUMP_HEIGHT - BASE_THICKNESS;
	const bottomY = BUMP_HEIGHT;
	// Capped to baseTopY: an uncapped rise would push the plateau above y=0 —
	// past the row's own top edge, into the header's border/search-bar area —
	// for any item wider than the row is tall (e.g. "سوالات متداول"). Capping
	// `run` to the same value keeps the 45° slope exact up to that limit
	// instead of only flattening the height while the ramp keeps widening.
	const clampedRise = Math.min(rise, baseTopY);
	const plateauY = baseTopY - clampedRise;
	const run = clampedRise; // 45°: horizontal ramp run equals its (capped) vertical rise
	const left = cx - halfW;
	const right = cx + halfW;
	// Clamped so a hovered item near the row's own edge can't push a ramp
	// past the SVG's own bounds and fold the path back on itself.
	const rampLeftBase = Math.max(0, left - run);
	const rampRightBase = Math.min(navWidth, right + run);
	return [
		`M 0 ${baseTopY}`,
		`L ${rampLeftBase} ${baseTopY}`,
		`L ${left} ${plateauY}`,
		`L ${right} ${plateauY}`,
		`L ${rampRightBase} ${baseTopY}`,
		`L ${navWidth} ${baseTopY}`,
		`L ${navWidth} ${bottomY}`,
		`L 0 ${bottomY}`,
		'Z',
	].join(' ');
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
	const bumpTargetRise = useMotionValue(0);
	const bumpX = useSpring(bumpTargetX, BUMP_SPRING);
	const bumpHalfW = useSpring(bumpTargetHalfW, BUMP_SPRING);
	const bumpRise = useSpring(bumpTargetRise, BUMP_SPRING);

	// The polygon's own width has to match the row's real rendered width —
	// not assumed from a Tailwind class — since it changes with viewport size
	// and with the `scrolled` padding swap (lg:px-2) above. Same
	// "measure, don't hardcode" reasoning as headerHeight below. Kept as a
	// motion value (not React state) so the useTransform below picks up a
	// resize the same declarative way it already picks up bumpX/bumpHalfW/
	// bumpRise changes, instead of needing a separate manual subscription.
	const navWidth = useMotionValue(0);
	React.useEffect(() => {
		const el = navRowRef.current;
		if (!el) return;
		const measure = () => navWidth.set(el.getBoundingClientRect().width);
		measure();
		const ro = new ResizeObserver(measure);
		ro.observe(el);
		return () => ro.disconnect();
	}, [navWidth]);

	const bumpPath = useTransform([navWidth, bumpX, bumpHalfW, bumpRise], ([nw, cx, hw, rise]) =>
		buildTrapezoidPath(nw as number, cx as number, hw as number, rise as number),
	);

	// `onMouseOver` bubbles, so sweeping the cursor across a row of inline
	// elements can fire it several times per item (text nodes, icon glyphs)
	// well within a single frame. Each firing wants two getBoundingClientRect()
	// reads, which force a synchronous layout — batching to one measurement
	// per animation frame (using only the latest event's target) means a fast
	// sweep still costs at most one forced layout per frame instead of one per
	// bubbled event, with no visible difference since nothing needs to react
	// faster than a frame anyway.
	const hoverRafRef = React.useRef<number | null>(null);
	const pendingHoverTargetRef = React.useRef<HTMLElement | null>(null);

	React.useEffect(() => {
		return () => {
			if (hoverRafRef.current !== null) cancelAnimationFrame(hoverRafRef.current);
		};
	}, []);

	const handleNavItemHover = (e: React.MouseEvent<HTMLDivElement>) => {
		const target = (e.target as HTMLElement).closest<HTMLElement>('[data-nav-bump]');
		if (!target) return;
		pendingHoverTargetRef.current = target;
		if (hoverRafRef.current !== null) return;
		hoverRafRef.current = requestAnimationFrame(() => {
			hoverRafRef.current = null;
			const container = navRowRef.current;
			const item = pendingHoverTargetRef.current;
			if (!container || !item) return;
			const containerRect = container.getBoundingClientRect();
			const itemRect = item.getBoundingClientRect();
			const centerX = itemRect.left + itemRect.width / 2 - containerRect.left;
			// Flat top matches the item's real width exactly; the rise is set
			// equal to half that width, which (at the ramps' fixed 45° slope,
			// baked into buildTrapezoidPath as run === rise) makes the platform's
			// base — top width plus one run on each side — come out to ~2x the
			// top width, per spec.
			const halfW = itemRect.width / 2;
			bumpTargetX.set(centerX);
			bumpTargetHalfW.set(halfW);
			if (!hasPositionedBump.current) {
				// First hover this session: jump the position/width springs
				// straight there instead of sliding in from x=0 — only the rise
				// (baseline lifting into a platform) should animate, not a sweep
				// across the whole nav row.
				bumpX.jump(centerX);
				bumpHalfW.jump(halfW);
				hasPositionedBump.current = true;
			}
			bumpTargetRise.set(halfW);
		});
	};

	const handleNavRowLeave = () => {
		bumpTargetRise.set(0);
	};

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
				anywhere else. */}
			<SpotlightCursor className="rounded-[inherit]" />

			{/* `relative` (a no-op for its own layout) is load-bearing here: without
				it this div paints in CSS's "in-flow, non-positioned" step, which
				comes *before* positioned z-index:auto siblings like SpotlightCursor's
				absolute glow layer above — so the glow would paint over the search
				bar instead of staying confined to the empty nav background under it.
				`relative` moves it into the same positioned-siblings step, where its
				later tree position keeps it painting on top as intended. */}
			<div className="relative w-full border-b border-foreground/5 px-4 py-2.5 lg:border-foreground/10 lg:py-2">
				<HeaderSearch />
			</div>

			<nav
				ref={navRowRef}
				className={cn(
					// lg:items-stretch (overriding the base items-center) lets the
					// nav-links row and the hover-bump wrappers inside it fill the
					// full row height instead of sizing to their own content — the
					// hover hit-area fix depends on this. Mobile stays items-center
					// since the links row is hidden there anyway.
					'relative flex h-14 w-full items-center justify-between px-4 lg:h-12 lg:items-stretch lg:transition-all lg:duration-300 lg:ease-in-out',
					{
						'lg:px-2': scrolled,
					},
				)}
			>
				{/* Hover "speed bump": a single filled polygon, always visible as a
					thin baseline bar the full width of the row, that rises into a
					flat-topped platform under whichever nav item (data-nav-bump) is
					hovered — see buildTrapezoidPath above. Desktop-only, same as the
					links it tracks. Painted first so it sits behind the nav items in
					source order; the low fill opacity keeps it reading as an underlay
					even where stacking order overlaps text. */}
				<svg
					aria-hidden
					className="pointer-events-none absolute inset-x-0 top-0 hidden h-12 w-full overflow-visible lg:block"
				>
					<motion.path d={bumpPath} className="fill-foreground/[0.06]" />
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
				<div
					className="hidden items-stretch lg:flex [&:has(a:hover)_a:not(:hover)]:opacity-50"
					onMouseOver={handleNavItemHover}
					onMouseLeave={handleNavRowLeave}
				>
					{/* Each plain link gets a full-row-height wrapper (not just the
						link's own h-9 pill) carrying data-nav-bump, so hovering
						anywhere in the item's column — including the vertical
						whitespace above/below the pill and the small horizontal
						buffer between items — counts as "hovering this item", matching
						what actually reads as the item's clickable region. The wrapper
						sits edge-to-edge with its neighbors (no container gap) so
						there's no dead pixel between items either; its own small px
						reproduces the old visual spacing without opening a gap the
						bump detection can fall into. */}
					<div className="flex h-full items-center px-0.5" data-nav-bump>
						<Link
							className={cn(buttonVariants({ variant: 'ghost', size: 'sm', className: 'px-2.5' }), 'transition-opacity duration-200')}
							href={links[0].href}
						>
							{links[0].label}
						</Link>
					</div>
					<ProductsMegaMenu categories={productCategories} />
					{links.slice(1).map((link, i) => (
						<div key={i} className="flex h-full items-center px-0.5" data-nav-bump>
							<Link
								className={cn(buttonVariants({ variant: 'ghost', size: 'sm', className: 'px-2.5' }), 'transition-opacity duration-200')}
								href={link.href}
							>
								{link.label}
							</Link>
						</div>
					))}
					{/* This trio isn't part of the hover-bump system above, so unlike
						those wrappers it doesn't need to sit edge-to-edge with its
						neighbors — it needs its own breathing room instead. Grouped in
						one wrapper with a real gap, plus a margin off the last nav
						link, so they don't touch. */}
					<div className="mr-1 flex items-center gap-2">
						<Button variant="outline" size="sm" className="hidden xl:inline-flex" asChild>
							<Link href="/contact">تماس با ما</Link>
						</Button>
						<ConsultationCtaButton size="sm" className="hover:shadow-lg hover:shadow-accent-500/30" />
						<AuthNavLink variant="icon" />
						<ThemeToggleButton />
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
						{/* Plain link on mobile — the hover-driven mega menu doesn't
							translate to touch, so this stays a normal nav item here. */}
						<Link
							className={buttonVariants({ variant: 'ghost', className: 'justify-start' })}
							href="/products"
							onClick={() => setOpen(false)}
						>
							محصولات
						</Link>
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
