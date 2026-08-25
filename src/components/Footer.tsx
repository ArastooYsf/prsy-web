"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer, viewportOnce } from "@/lib/motion";
import type { FooterContactContent } from "@/lib/site-content";
import { toPersianDigits } from "@/lib/format-number";

const QUICK_LINKS = [
  { label: "خانه", href: "/" },
  { label: "محصولات", href: "/products" },
  { label: "ویژگی‌ها", href: "/#features" },
  { label: "درباره ما", href: "/about" },
  { label: "مشتریان", href: "/#clients" },
  { label: "سوالات متداول", href: "/faq" },
  { label: "درخواست مشاوره", href: "/consultation" },
  { label: "تماس با ما", href: "/contact" },
];

const SERVICES = [
  { label: "دیزل ژنراتور", href: "/products#diesel-generators" },
  { label: "موتور برق", href: "/products#power-engines" },
  { label: "قطعات یدکی", href: "/products#spare-parts" },
  { label: "دینام و آلترناتور", href: "/products#alternators" },
  { label: "اورهال و تعمیرات", href: "/products#overhaul" },
];

// Icons stay hardcoded per platform; only the destination URL is admin-editable
// (see FooterContactContent) — a platform with no URL set just isn't rendered.
const SOCIAL_ICONS = {
  instagramUrl: {
    name: "اینستاگرام",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" />
      </svg>
    ),
  },
  linkedinUrl: {
    name: "لینکدین",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.6" />
        <path d="M7.5 10.5V17M7.5 7.5V7.51M11.5 17V10.5M11.5 13c0-1.5 1-2.5 2.5-2.5s2.5 1 2.5 2.5V17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  telegramUrl: {
    name: "تلگرام",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M21 4L3 11.5l6 2m12-9.5l-3.5 16-8.5-6.5m12-9.5L9 13.5m0 0v5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
} as const;

export default function Footer({ contact }: { contact: FooterContactContent }) {
  const pathname = usePathname();
  const year = new Date().getFullYear();

  if (pathname?.startsWith("/account")) return null;

  const contactItems = [
    { label: contact.address },
    contact.phone ? { label: toPersianDigits(contact.phone), href: contact.phoneHref || undefined } : null,
    contact.email ? { label: contact.email, href: `mailto:${contact.email}` } : null,
  ].filter((item): item is { label: string; href?: string } => item !== null);

  const socials = (Object.keys(SOCIAL_ICONS) as (keyof typeof SOCIAL_ICONS)[])
    .map((key) => ({ ...SOCIAL_ICONS[key], href: contact[key] }))
    .filter((social) => social.href);

  return (
    <footer className="border-t border-foreground/10 bg-background/20">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={staggerContainer(0.1)}
        className="container py-16 sm:py-20"
      >
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <motion.div variants={fadeInUp}>
            <Link href="/" className="group flex items-center gap-2 text-lg font-bold">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-accent-400 to-accent-600 text-sm font-bold text-brand-950 shadow-md shadow-accent-500/20 transition-shadow duration-300 group-hover:shadow-lg group-hover:shadow-accent-500/30">
                یا
              </span>
              پویش راه صنعت
              <span className="text-accent-400"> یاشار</span>
            </Link>
            <p className="mt-4 max-w-sm leading-7 text-foreground/60">
              تأمین‌کننده دیزل ژنراتور، موتور برق و قطعات یدکی با برندهای
              معتبر جهانی؛ به‌صورت نو و دست‌دوم، با بهترین قیمت و سریع‌ترین
              تحویل.
            </p>
            {socials.length > 0 && (
              <div className="mt-6 flex items-center gap-3">
                {socials.map((social) => (
                  <motion.a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.name}
                    whileHover={{ y: -3, scale: 1.05 }}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-foreground/10 text-foreground/60 transition-all duration-300 hover:border-accent-500/40 hover:text-accent-400 hover:shadow-lg hover:shadow-accent-500/15"
                  >
                    {social.icon}
                  </motion.a>
                ))}
              </div>
            )}

            {/* Placeholder for the Enamad trust-seal embed. Once verified on
                enamad.ir, replace this box with the exact <a>/<script> snippet
                they provide — see the project report for the registration steps. */}
            <div className="mt-6 flex h-16 w-16 flex-col items-center justify-center rounded-lg border border-dashed border-foreground/15 text-center text-[9px] leading-4 text-foreground/40">
              محل درج
              <br />
              نماد اعتماد
            </div>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <h3 className="text-sm font-semibold text-foreground">
              لینک‌های سریع
            </h3>
            <ul className="mt-5 space-y-3">
              {QUICK_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-block text-sm text-foreground/60 transition-all duration-200 hover:-translate-x-1 hover:text-accent-400"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <h3 className="text-sm font-semibold text-foreground">محصولات</h3>
            <ul className="mt-5 space-y-3">
              {SERVICES.map((service) => (
                <li key={service.label}>
                  <Link
                    href={service.href}
                    className="inline-block text-sm text-foreground/60 transition-all duration-200 hover:-translate-x-1 hover:text-accent-400"
                  >
                    {service.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <h3 className="text-sm font-semibold text-foreground">
              ارتباط با ما
            </h3>
            <ul className="mt-5 space-y-3">
              {contactItems.map((item) =>
                item.href ? (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      className="inline-block text-sm text-foreground/60 transition-all duration-200 hover:-translate-x-1 hover:text-accent-400"
                    >
                      {item.label}
                    </a>
                  </li>
                ) : (
                  <li
                    key={item.label}
                    className="text-sm leading-6 text-foreground/60"
                  >
                    {item.label}
                  </li>
                )
              )}
            </ul>
          </motion.div>
        </div>

        <motion.div
          variants={fadeInUp}
          className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-foreground/10 pt-8 text-sm text-foreground/50 sm:flex-row-reverse"
        >
          <p>
            © {year.toLocaleString("fa-IR", { useGrouping: false })} پویش راه
            صنعت یاشار. تمامی حقوق محفوظ است.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="transition-colors hover:text-foreground">
              حریم خصوصی
            </Link>
            <Link href="/terms" className="transition-colors hover:text-foreground">
              قوانین و مقررات
            </Link>
            <Link href="/warranty" className="transition-colors hover:text-foreground">
              گارانتی و پشتیبانی
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </footer>
  );
}
