"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer, viewportOnce } from "@/lib/motion";

const QUICK_LINKS = [
  { label: "خانه", href: "/" },
  { label: "محصولات", href: "/products" },
  { label: "ویژگی‌ها", href: "/#features" },
  { label: "درباره ما", href: "/#about" },
  { label: "مشتریان", href: "/#clients" },
  { label: "قیمت‌گذاری", href: "/#pricing" },
  { label: "سوالات متداول", href: "/#faq" },
];

const SERVICES = [
  { label: "دیزل ژنراتور", href: "/products#diesel-generators" },
  { label: "موتور برق", href: "/products#power-engines" },
  { label: "قطعات یدکی", href: "/products#spare-parts" },
  { label: "دینام و آلترناتور", href: "/products#alternators" },
  { label: "اورهال و تعمیرات", href: "/products#overhaul" },
];

const CONTACT = [
  { label: "تهران، خیابان ولیعصر، برج صنعت، طبقه ۵" },
  { label: "۰۲۱-۹۱۰۰۰۰۰۰", href: "tel:+982191000000" },
  { label: "info@yasharindustry.com", href: "mailto:info@yasharindustry.com" },
];

const SOCIALS = [
  {
    name: "اینستاگرام",
    href: "#",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" />
      </svg>
    ),
  },
  {
    name: "لینکدین",
    href: "#",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.6" />
        <path d="M7.5 10.5V17M7.5 7.5V7.51M11.5 17V10.5M11.5 13c0-1.5 1-2.5 2.5-2.5s2.5 1 2.5 2.5V17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    name: "تلگرام",
    href: "#",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M21 4L3 11.5l6 2m12-9.5l-3.5 16-8.5-6.5m12-9.5L9 13.5m0 0v5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-graphite-light/40 bg-graphite">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={staggerContainer(0.1)}
        className="container py-16 sm:py-20"
      >
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <motion.div variants={fadeInUp}>
            <Link href="/" className="flex items-center gap-2 text-lg font-bold">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-accent-amber to-accent-orange text-sm font-black text-text-primary">
                یا
              </span>
              پویش راه صنعت
              <span className="text-accent-amber"> یاشار</span>
            </Link>
            <p className="mt-4 max-w-sm leading-7 text-text-secondary">
              تأمین‌کننده دیزل ژنراتور، موتور برق و قطعات یدکی با برندهای
              معتبر جهانی؛ به‌صورت نو و دست‌دوم، با بهترین قیمت و سریع‌ترین
              تحویل.
            </p>
            <div className="mt-6 flex items-center gap-3">
              {SOCIALS.map((social) => (
                <motion.a
                  key={social.name}
                  href={social.href}
                  aria-label={social.name}
                  whileHover={{ y: -3, scale: 1.05 }}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-graphite-light text-text-secondary transition-colors hover:border-accent-orange/40 hover:text-text-primary"
                >
                  {social.icon}
                </motion.a>
              ))}
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
                    className="text-sm text-text-secondary transition-colors hover:text-text-primary"
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
                    className="text-sm text-text-secondary transition-colors hover:text-text-primary"
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
              {CONTACT.map((item) =>
                item.href ? (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      className="text-sm text-text-secondary transition-colors hover:text-text-primary"
                    >
                      {item.label}
                    </a>
                  </li>
                ) : (
                  <li
                    key={item.label}
                    className="text-sm leading-6 text-text-secondary"
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
          className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-graphite-light/40 pt-8 text-sm text-text-secondary sm:flex-row"
        >
          <p>
            © {year.toLocaleString("fa-IR", { useGrouping: false })} پویش راه
            صنعت یاشار. تمامی حقوق محفوظ است.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="transition-colors hover:text-text-primary">
              حریم خصوصی
            </a>
            <a href="#" className="transition-colors hover:text-text-primary">
              قوانین و مقررات
            </a>
          </div>
        </motion.div>
      </motion.div>
    </footer>
  );
}
