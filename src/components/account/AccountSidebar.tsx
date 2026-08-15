"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  MessageSquare,
  FileText,
  Package,
  User,
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
  X,
  Gauge,
  Headset,
  Users,
  ScrollText,
  PackageSearch,
  Newspaper,
  LayoutTemplate,
  History,
  Home,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PERSONAL_LINKS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/account", label: "نمای کلی", icon: LayoutDashboard },
  { href: "/account/tickets", label: "تیکت‌ها", icon: MessageSquare },
  { href: "/account/contracts", label: "قراردادها", icon: FileText },
  { href: "/account/orders", label: "سفارش‌ها", icon: Package },
  { href: "/account/profile", label: "پروفایل", icon: User },
];

// Same permission split the old admin panel nav had: SUPPORT gets
// tickets/customers/contracts/orders management, ADMIN additionally
// gets blog + site content editing.
const ADMIN_LINKS: { href: string; label: string; icon: LucideIcon; roles: string[] }[] = [
  { href: "/account/admin", label: "داشبورد مدیریت", icon: Gauge, roles: ["ADMIN", "SUPPORT"] },
  { href: "/account/admin/tickets", label: "تیکت‌های مشتریان", icon: Headset, roles: ["ADMIN", "SUPPORT"] },
  { href: "/account/admin/customers", label: "مشتریان", icon: Users, roles: ["ADMIN", "SUPPORT"] },
  { href: "/account/admin/contracts", label: "قراردادها (مدیریت)", icon: ScrollText, roles: ["ADMIN", "SUPPORT"] },
  { href: "/account/admin/orders", label: "سفارش‌ها (مدیریت)", icon: PackageSearch, roles: ["ADMIN", "SUPPORT"] },
  { href: "/account/admin/blog", label: "وبلاگ", icon: Newspaper, roles: ["ADMIN"] },
  { href: "/account/admin/content", label: "محتوای سایت", icon: LayoutTemplate, roles: ["ADMIN"] },
  { href: "/account/admin/logs", label: "گزارش رویدادها", icon: History, roles: ["ADMIN"] },
];

const EXACT_MATCH_HREFS = new Set(["/account", "/account/admin"]);

function isLinkActive(pathname: string, href: string) {
  return EXACT_MATCH_HREFS.has(href) ? pathname === href : pathname.startsWith(href);
}

function NavItem({
  href,
  label,
  Icon,
  active,
  collapsed,
  onNavigate,
}: {
  href: string;
  label: string;
  Icon: LucideIcon;
  active: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      title={collapsed ? label : undefined}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
        collapsed && "justify-center",
        active ? "bg-accent-500/10 text-accent-400" : "text-foreground/60 hover:bg-white/5 hover:text-foreground",
      )}
    >
      <Icon className="size-[18px] shrink-0" strokeWidth={1.8} />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}

function SidebarContents({
  collapsed,
  pathname,
  role,
  onNavigate,
}: {
  collapsed: boolean;
  pathname: string;
  role: string;
  onNavigate?: () => void;
}) {
  const adminLinks = ADMIN_LINKS.filter((link) => link.roles.includes(role));
  // Personal account pages (tickets/contracts/orders as a customer) only make
  // sense for CUSTOMER — an ADMIN/SUPPORT isn't a customer of their own site.
  // Profile stays for everyone since staff also need to change their own name/password.
  const personalLinks =
    role === "CUSTOMER" ? PERSONAL_LINKS : PERSONAL_LINKS.filter((link) => link.href === "/account/profile");

  return (
    <div className="flex h-full flex-col">
      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-3">
        {personalLinks.map((link) => (
          <NavItem
            key={link.href}
            href={link.href}
            label={link.label}
            Icon={link.icon}
            active={isLinkActive(pathname, link.href)}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
        ))}

        {adminLinks.length > 0 && (
          <>
            <div className="my-2 border-t border-white/10" />
            {!collapsed && (
              <p className="px-3 pb-1 text-[11px] font-semibold text-foreground/35">مدیریت سایت</p>
            )}
            {adminLinks.map((link) => (
              <NavItem
                key={link.href}
                href={link.href}
                label={link.label}
                Icon={link.icon}
                active={isLinkActive(pathname, link.href)}
                collapsed={collapsed}
                onNavigate={onNavigate}
              />
            ))}
          </>
        )}
      </nav>

      <div className="space-y-1 border-t border-white/10 p-3">
        <NavItem
          href="/"
          label="بازگشت به سایت اصلی"
          Icon={Home}
          active={false}
          collapsed={collapsed}
          onNavigate={onNavigate}
        />
        <NavItem
          href="/account/profile"
          label="تنظیمات"
          Icon={Settings}
          active={false}
          collapsed={collapsed}
          onNavigate={onNavigate}
        />
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          title={collapsed ? "خروج از حساب" : undefined}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-400/80 transition-colors hover:bg-red-500/10 hover:text-red-400",
            collapsed && "justify-center",
          )}
        >
          <LogOut className="size-[18px] shrink-0" strokeWidth={1.8} />
          {!collapsed && <span className="truncate">خروج از حساب</span>}
        </button>
      </div>
    </div>
  );
}

type AccountSidebarProps = {
  role: string;
};

export default function AccountSidebar({ role }: AccountSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 76 : 236 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="hidden h-full shrink-0 flex-col border-l border-white/10 bg-white/[0.015] lg:flex"
      >
        <div className="flex items-center justify-between px-3 pt-3">
          {!collapsed && <span className="text-xs font-semibold text-foreground/40">حساب کاربری</span>}
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? "باز کردن نوار کناری" : "بستن نوار کناری"}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-lg text-foreground/50 transition-colors hover:bg-white/10 hover:text-foreground",
              collapsed && "mx-auto",
            )}
          >
            <ChevronLeft className={cn("size-4 transition-transform duration-300", collapsed && "rotate-180")} />
          </button>
        </div>

        <SidebarContents collapsed={collapsed} pathname={pathname} role={role} />
      </motion.aside>

      {/* Mobile trigger */}
      <div className="container flex items-center justify-between border-b border-white/10 pt-4 pb-4 lg:hidden">
        <span className="text-xs font-semibold text-foreground/40">حساب کاربری</span>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="باز کردن منو"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-foreground/70 transition-colors hover:border-accent-500/40 hover:text-accent-400"
        >
          <Menu className="size-[18px]" />
        </button>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-y-0 right-0 z-[80] flex w-64 flex-col border-l border-white/10 bg-background shadow-2xl lg:hidden"
            >
              <div className="flex items-center justify-between border-b border-white/10 p-3">
                <span className="text-sm font-semibold text-foreground/70">منوی حساب کاربری</span>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label="بستن منو"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground/50 hover:bg-white/10 hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>
              <SidebarContents
                collapsed={false}
                pathname={pathname}
                role={role}
                onNavigate={() => setMobileOpen(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
