"use client";

import { usePathname } from "next/navigation";
import AccountSidebar from "@/components/account/AccountSidebar";
import AdminSearchBox from "@/components/admin/AdminSearchBox";

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
    <div className="flex h-dvh flex-col overflow-hidden lg:flex-row">
      <AccountSidebar role={role} />
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <section
          className={
            isAdmin
              ? "mx-auto flex w-full max-w-[1680px] flex-1 flex-col px-4 py-6 sm:px-6 sm:py-12 lg:px-10"
              : "container flex flex-1 flex-col py-6 sm:py-12"
          }
        >
          <div className="mb-8 flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-medium text-foreground/50">حساب کاربری</p>
              <h1 className="mt-1 text-xl font-black sm:text-2xl">
                خوش آمدید، <span className="text-gradient">{userLabel}</span>
              </h1>
            </div>
            {isAdmin && canSearch && <AdminSearchBox />}
          </div>
          <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        </section>
      </div>
    </div>
  );
}
