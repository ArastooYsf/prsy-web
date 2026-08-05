"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/account", label: "داشبورد" },
  { href: "/account/tickets", label: "تیکت‌ها" },
  { href: "/account/contracts", label: "قراردادها" },
  { href: "/account/orders", label: "سفارش‌ها" },
  { href: "/account/profile", label: "پروفایل" },
];

export default function AccountNav() {
  const pathname = usePathname();

  return (
    <nav className="mb-8 flex flex-wrap gap-2">
      {LINKS.map((link) => {
        const active = link.href === "/account" ? pathname === "/account" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-accent-500 text-white"
                : "border border-white/10 text-foreground/70 hover:border-accent-500/40 hover:text-accent-400"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
