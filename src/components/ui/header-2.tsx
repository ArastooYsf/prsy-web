'use client';
import React from 'react';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MenuToggleIcon } from '@/components/ui/menu-toggle-icon';
import { useScroll } from '@/components/ui/use-scroll';

export function Header() {
	const [open, setOpen] = React.useState(false);
	const scrolled = useScroll(10);

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
			label: 'ویژگی‌ها',
			href: '/#features',
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

	return (
		<header
			className={cn(
				'sticky top-0 z-50 mx-auto w-full max-w-5xl border-b border-transparent lg:max-w-6xl lg:rounded-md lg:border lg:transition-all lg:ease-out',
				{
					'bg-background/95 supports-[backdrop-filter]:bg-background/50 border-border backdrop-blur-lg lg:top-4 lg:max-w-5xl lg:shadow':
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
				<Link href="/" className="flex shrink-0 items-center gap-2 text-base font-bold">
					<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-accent-400 to-accent-600 text-xs font-black text-brand-950">
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
					<Button size="sm" asChild>
						<Link href="/consultation">درخواست مشاوره</Link>
					</Button>
				</div>
				<Button size="icon" variant="outline" onClick={() => setOpen(!open)} className="lg:hidden">
					<MenuToggleIcon open={open} className="size-5" duration={300} />
				</Button>
			</nav>

			<div
				className={cn(
					'bg-background/90 fixed top-14 right-0 bottom-0 left-0 z-50 flex flex-col overflow-hidden border-y lg:hidden',
					open ? 'block' : 'hidden',
				)}
			>
				<div
					data-slot={open ? 'open' : 'closed'}
					className={cn(
						'data-[slot=open]:animate-in data-[slot=open]:zoom-in-95 data-[slot=closed]:animate-out data-[slot=closed]:zoom-out-95 ease-out',
						'flex h-full w-full flex-col justify-between gap-y-2 p-4',
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
						<Button className="w-full" asChild>
							<Link href="/consultation" onClick={() => setOpen(false)}>
								درخواست مشاوره
							</Link>
						</Button>
					</div>
				</div>
			</div>
		</header>
	);
}
