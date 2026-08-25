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
import AuthNavLink from '@/components/AuthNavLink';
import type { ProductCategoryContent } from '@/lib/site-content-defaults';

// How far (in px) the user needs to scroll before the header's ambient glow
// reaches full intensity. Matches GLOW_MAX_SHADOW below.
const GLOW_DISTANCE = 300;
const GLOW_MAX_SHADOW = '0 8px 40px -4px rgba(249, 115, 22, 0.25)';

// The hover "speed bump" indicator: a full-nav-height silhouette — a rounded
// cap tapering out of the hairline border, flowing straight down to the
// nav's bottom edge, like a hill sloping down into a column — behind
// whichever nav item is hovered. Geometry (radius/fillet/pad) is expressed
// in SVG user units == px, recomputed live from each item's real
// getBoundingClientRect() — never hardcoded per-item, since label widths
// differ. Position/size animate via spring (not a raw transition on the `d`
// string, which can't interpolate between different shapes) so moving
// between items slides smoothly instead of jump-cutting.
const BUMP_TOP_RADIUS = 8;
const BUMP_HEIGHT = 48; // matches nav's lg:h-12 — bump spans the full row, not just a sliver at the top
const BUMP_PAD = 8;
const BUMP_FILLET = 8;
const BUMP_SPRING = { stiffness: 500, damping: 40 };
const BUMP_OPACITY_SPRING = { stiffness: 400, damping: 35 };

function buildBumpPath(cx: number, halfW: number) {
	const left = cx - halfW;
	const right = cx + halfW;
	const f = Math.min(BUMP_FILLET, halfW);
	return [
		`M ${left} ${BUMP_HEIGHT}`,
		`L ${left} ${BUMP_TOP_RADIUS}`,
		`Q ${left} 0 ${left + f} 0`,
		`L ${right - f} 0`,
		`Q ${right} 0 ${right} ${BUMP_TOP_RADIUS}`,
		`L ${right} ${BUMP_HEIGHT}`,
		'Z',
	].join(' ');
}

export function Header({ productCategories = [] }: { productCategories?: ProductCategoryContent[] }) {
	const pathname = usePathname();
	const [open, setOpen] = React.useState(false);
	const isAccountArea = pathname?.startsWith('/account');

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
	const glowShadow = useTransform(glowProgress, (p) =>
		p <= 0.01 ? 'none' : GLOW_MAX_SHADOW.replace('0.25', (p * 0.25).toFixed(3)),
	);

	// Nav hover "speed bump" indicator — see buildBumpPath above.
	const navRowRef = React.useRef<HTMLDivElement>(null);
	const hasPositionedBump = React.useRef(false);
	const bumpTargetX = useMotionValue(0);
	const bumpTargetHalfW = useMotionValue(0);
	const bumpTargetOpacity = useMotionValue(0);
	const bumpX = useSpring(bumpTargetX, BUMP_SPRING);
	const bumpHalfW = useSpring(bumpTargetHalfW, BUMP_SPRING);
	const bumpOpacity = useSpring(bumpTargetOpacity, BUMP_OPACITY_SPRING);
	const bumpPath = useTransform([bumpX, bumpHalfW], ([cx, hw]) => buildBumpPath(cx as number, hw as number));

	const handleNavItemHover = (e: React.MouseEvent<HTMLDivElement>) => {
		const container = navRowRef.current;
		const target = (e.target as HTMLElement).closest<HTMLElement>('[data-nav-bump]');
		if (!container || !target) return;
		const containerRect = container.getBoundingClientRect();
		const itemRect = target.getBoundingClientRect();
		const centerX = itemRect.left + itemRect.width / 2 - containerRect.left;
		const halfW = itemRect.width / 2 + BUMP_PAD;
		bumpTargetX.set(centerX);
		bumpTargetHalfW.set(halfW);
		if (!hasPositionedBump.current) {
			// First hover this session: jump the spring outputs straight to
			// position instead of animating in from x=0 — only the fade-in
			// should be visible, not a sweep across the whole nav row.
			bumpX.jump(centerX);
			bumpHalfW.jump(halfW);
			hasPositionedBump.current = true;
		}
		bumpTargetOpacity.set(1);
	};

	const handleNavRowLeave = () => {
		bumpTargetOpacity.set(0);
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
				// The side inset and the border/background are constant (not tied to
				// `scrolled`) — the search bar living inside needs a persistent
				// container at every scroll position. The bottom corners stay rounded
				// at every scroll position (lg:rounded-b-2xl below, unconditional);
				// only the TOP corners and the desktop "lift" (shadow/blur/floating
				// inset) are scroll-conditional: flush with the top of the page the
				// header reads as sharp-topped, and the top corners round off (plus
				// the header floats/lifts) only once the user actually scrolls.
				//
				// The blurred background/shadow "lift" effect below is desktop-only (lg:)
				// on purpose: applying it at every breakpoint made the header visibly
				// flicker on mobile, since iOS's elastic overscroll bounce can push
				// scrollY back and forth across the threshold several times a second
				// near the top of the page.
				'sticky top-0 z-50 mx-auto w-[calc(100%-2rem)] max-w-5xl border border-white/10 bg-background/95 supports-[backdrop-filter]:bg-background/50 lg:max-w-6xl lg:rounded-b-2xl lg:transition-all lg:duration-300 lg:ease-in-out',
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
				conditional here. */}
			<motion.div aria-hidden className="pointer-events-none absolute inset-0 rounded-[inherit]" style={{ boxShadow: glowShadow }} />

			<div className="w-full border-b border-white/5 px-4 py-2.5 lg:border-white/10 lg:py-2">
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
				{/* Hover "speed bump": a full-row-height highlight tapering out of
					the hairline border above whichever nav item (data-nav-bump) is
					hovered, sliding/resizing via spring between items. Desktop-only,
					same as the links it tracks. Painted first so it sits behind the
					nav items in source order; the low fill opacity keeps it reading
					as an underlay even where stacking order overlaps text. */}
				<svg
					aria-hidden
					className="pointer-events-none absolute inset-x-0 top-0 hidden h-12 w-full overflow-visible lg:block"
				>
					<motion.path d={bumpPath} style={{ opacity: bumpOpacity }} className="fill-white/[0.06]" />
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
					<Button variant="outline" size="sm" className="hidden xl:inline-flex" asChild>
						<Link href="/contact">تماس با ما</Link>
					</Button>
					<ConsultationCtaButton size="sm" className="hover:shadow-lg hover:shadow-accent-500/30" />
					<AuthNavLink variant="icon" />
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
					</div>
				</div>
			</div>
		</motion.header>
	);
}
