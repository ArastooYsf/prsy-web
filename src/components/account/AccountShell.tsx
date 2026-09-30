"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { MailWarning } from "lucide-react";
import AccountSidebar from "@/components/account/AccountSidebar";
import AdminSearchBox from "@/components/admin/AdminSearchBox";
import NotificationBell from "@/components/account/NotificationBell";
import { ThemeToggleButton } from "@/components/layout/ThemeToggleButton";

// The blog editor (new + edit) owns its own full-screen split-panel layout
// (see /account/admin/blog/[id] and /account/admin/blog/new) — no sidebar,
// no "خوش آمدید" header, no container padding. Matches both /blog/new and
// /blog/<id> since Next.js resolves both to a single dynamic path segment.
function isBareShellRoute(pathname: string): boolean {
  return /^\/account\/admin\/blog\/[^/]+$/.test(pathname);
}

// Only the ticket detail view needs its message list to scroll internally
// (fixed-height chat box, header/composer pinned) rather than letting the
// whole page grow and scroll as one unit — see the min-h-0 comment below.
// Every other account page relies on the page-level scroll, so this stays
// scoped to just these two routes instead of changing the shared behavior.
function isTicketDetailRoute(pathname: string): boolean {
  return /^\/account\/(admin\/)?tickets\/[^/]+$/.test(pathname);
}

type AccountShellProps = {
  role: string;
  userLabel: string;
  emailVerified: boolean;
  children: React.ReactNode;
};

export default function AccountShell({ role, userLabel, emailVerified, children }: AccountShellProps) {
  const pathname = usePathname() ?? "";

  if (isBareShellRoute(pathname)) {
    return <>{children}</>;
  }

  const isAdmin = pathname.startsWith("/account/admin");
  const canSearch = role === "ADMIN" || role === "SUPPORT";
  const showVerifyBanner = !emailVerified && pathname !== "/account/verify-email";

  return (
    <div className="flex h-screen flex-col overflow-hidden [@supports(height:100dvh)]:h-dvh lg:flex-row">
      <AccountSidebar role={role} />
      {/* The account/admin panels have no footer, so on any page whose
          content overflows the viewport, the last element would otherwise
          sit flush against the bottom edge. `min-h-0` below (removed here)
          is what let that happen: it tells a flex item it may render
          SMALLER than its own content ("phantom overflow" — the content
          paints past the item's box without growing it), which is exactly
          what a flex item needs to become its own internal scroll region,
          but it also makes this outer scroll container's own scrollHeight —
          and any padding-bottom on it — stop reliably accounting for that
          overflowing content once nesting/content gets deep enough
          (verified empirically: worked for shallow pages, silently failed
          for the profile page's several stacked sections). Dropping
          min-h-0 here makes flex size each item to its real content instead
          (content-based auto min-height), so this container's own
          pb-16/sm:pb-24 is always correctly included. TicketChat (the one
          view that genuinely needs to stretch-and-scroll internally) gets
          min-h-0 threaded back in locally — see isTicketDetailRoute below —
          through the <section> and children wrapper further down, so only
          its own chain becomes height-bound; every other route keeps this
          container's content-based sizing. */}
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto pb-16 sm:pb-24">
        {showVerifyBanner && (
          <div className="sticky top-0 z-30 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 border-b border-amber-500/30 bg-amber-500/15 px-4 py-2.5 text-center text-xs font-medium text-amber-500">
            <span className="flex items-center gap-1.5">
              <MailWarning className="size-4 shrink-0" aria-hidden />
              ایمیل حساب شما هنوز تأیید نشده است.
            </span>
            <Link href="/account/verify-email" className="font-bold underline underline-offset-2 hover:no-underline">
              تأیید ایمیل
            </Link>
          </div>
        )}
        <section
          className={`${
            isAdmin
              ? "mx-auto flex w-full max-w-[1680px] flex-1 flex-col px-4 py-6 sm:px-6 sm:py-12 lg:px-10"
              : "container flex flex-1 flex-col py-6 sm:py-12"
          } ${isTicketDetailRoute(pathname) ? "min-h-0" : ""}`}
        >
          <div className="mb-8 flex flex-col gap-4 border-b border-foreground/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-medium text-foreground/50">حساب کاربری</p>
              <h1 className="mt-1 text-xl font-bold sm:text-2xl">
                خوش آمدید، <span className="text-accent-soft">{userLabel}</span>
              </h1>
            </div>
            <div className="flex items-center gap-3 sm:justify-end">
              {isAdmin && canSearch && <AdminSearchBox />}
              <NotificationBell />
              <ThemeToggleButton />
            </div>
          </div>
          <div className={`flex flex-1 flex-col ${isTicketDetailRoute(pathname) ? "min-h-0" : ""}`}>{children}</div>
        </section>
      </div>
    </div>
  );
}
