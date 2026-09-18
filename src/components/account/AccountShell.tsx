"use client";

import { usePathname } from "next/navigation";
import AccountSidebar from "@/components/account/AccountSidebar";
import AdminSearchBox from "@/components/admin/AdminSearchBox";
import NotificationBell from "@/components/account/NotificationBell";
import { ThemeToggleButton } from "@/components/ui/ThemeToggleButton";

// The blog editor (new + edit) owns its own full-screen split-panel layout
// (see /account/admin/blog/[id] and /account/admin/blog/new) — no sidebar,
// no "خوش آمدید" header, no container padding. Matches both /blog/new and
// /blog/<id> since Next.js resolves both to a single dynamic path segment.
function isBareShellRoute(pathname: string): boolean {
  return /^\/account\/admin\/blog\/[^/]+$/.test(pathname);
}

type AccountShellProps = {
  role: string;
  userLabel: string;
  children: React.ReactNode;
};

export default function AccountShell({ role, userLabel, children }: AccountShellProps) {
  const pathname = usePathname() ?? "";

  if (isBareShellRoute(pathname)) {
    return <>{children}</>;
  }

  const isAdmin = pathname.startsWith("/account/admin");
  const canSearch = role === "ADMIN" || role === "SUPPORT";

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
          view that genuinely needs to stretch-and-scroll internally) has
          its own `min-h-[420px]` + independent overflow-y-auto message
          list and already falls back to whichever ancestor really
          overflows, so it isn't relying on this specific min-h-0. */}
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto pb-16 sm:pb-24">
        <section
          className={
            isAdmin
              ? "mx-auto flex w-full max-w-[1680px] flex-1 flex-col px-4 py-6 sm:px-6 sm:py-12 lg:px-10"
              : "container flex flex-1 flex-col py-6 sm:py-12"
          }
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
          <div className="flex flex-1 flex-col">{children}</div>
        </section>
      </div>
    </div>
  );
}
