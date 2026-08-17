'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MenuToggleIcon } from '@/components/ui/menu-toggle-icon';
import { useScroll } from '@/components/ui/use-scroll';
import AuthNavLink from '@/components/AuthNavLink';

export function Header() {
	const pathname = usePathname();
	const [open, setOpen] = React.useState(false);
	const scrolled = useScroll(10);
	const isAccountArea = pathname?.startsWith('/account');

	const links = [
		{
			label: 'خانه',
			href: '/',
		},
		{
			label: 'محصولات',
			href: '/products',
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
			label: 'قیمت‌گذاری',
			href: '/pricing',
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

	if (isAccountArea) return null;

	return (
		<header
			className={cn(
				// The blurred background/shadow scroll effect below is desktop-only (lg:)
				// on purpose: applying it at every breakpoint made the header visibly
				// flicker on mobile, since iOS's elastic overscroll bounce can push
				// scrollY back and forth across the threshold several times a second
				// near the top of the page. The header itself stays visually fixed on
				// mobile at all times instead.
				'sticky top-0 z-50 mx-auto w-full max-w-5xl border-b border-transparent bg-background/95 supports-[backdrop-filter]:bg-background/50 lg:max-w-6xl lg:rounded-md lg:border lg:border-transparent lg:bg-transparent lg:transition-all lg:ease-out',
				{
					'lg:border-border lg:top-4 lg:max-w-5xl lg:bg-background/95 lg:shadow-lg lg:shadow-black/10 lg:backdrop-blur-lg':
						scrolled && !open,
					'bg-background/90': open,
				},
			)}
		>
			<nav
				className={cn(
					'flex h-14 w-full items-center justify-between px-4 lg:h-12 lg:transition-all lg:ease-out',
					{
						'lg:px-2': scrolled,
					},
				)}
			>
				<Link
					href="/"
					className="group flex shrink-0 items-center gap-2 text-base font-bold transition-transform duration-300 hover:scale-[1.03]"
				>
					<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-accent-400 to-accent-600 text-xs font-black text-brand-950 shadow-md shadow-accent-500/20 transition-shadow duration-300 group-hover:shadow-lg group-hover:shadow-accent-500/30">
						یا
					</span>
					<span className={cn('hidden whitespace-nowrap sm:inline', scrolled && 'lg:hidden')}>
						پویش راه صنعت<span className="text-accent-400"> یاشار</span>
					</span>
				</Link>
				<div className="hidden items-center gap-1 lg:flex">
					{links.map((link, i) => (
						<Link
							key={i}
							className={buttonVariants({ variant: 'ghost', size: 'sm', className: 'px-2.5' })}
							href={link.href}
						>
							{link.label}
						</Link>
					))}
					<Button variant="outline" size="sm" className="hidden xl:inline-flex" asChild>
						<Link href="/contact">تماس با ما</Link>
					</Button>
					<Button
						size="sm"
						className="transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-accent-500/30"
						asChild
					>
						<Link href="/consultation">درخواست مشاوره</Link>
					</Button>
					<AuthNavLink variant="icon" />
				</div>
				<Button
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
				className={cn(
					'bg-background fixed top-14 right-0 bottom-0 left-0 z-50 flex flex-col overflow-y-auto border-y lg:hidden',
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
						{links.map((link) => (
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
						<Button
							className="w-full transition-all duration-300 hover:shadow-lg hover:shadow-accent-500/30"
							asChild
						>
							<Link href="/consultation" onClick={() => setOpen(false)}>
								درخواست مشاوره
							</Link>
						</Button>
						<AuthNavLink variant="block" onNavigate={() => setOpen(false)} />
					</div>
				</div>
			</div>
		</header>
	);
}
