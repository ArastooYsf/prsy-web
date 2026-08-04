"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

const UserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.6" />
    <path d="M4.5 20c1.4-3.6 4.4-5.5 7.5-5.5s6.1 1.9 7.5 5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const PanelIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
  </svg>
);

const LogoutIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M15 4H6a1.5 1.5 0 00-1.5 1.5v13A1.5 1.5 0 006 20h9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M10.5 12H21m0 0l-3.5-3.5M21 12l-3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

type AuthNavLinkProps = {
  variant?: "icon" | "block";
  onNavigate?: () => void;
};

export default function AuthNavLink({ variant = "icon", onNavigate }: AuthNavLinkProps) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return variant === "icon" ? <div className="h-9 w-9" aria-hidden /> : null;
  }

  if (status === "authenticated" && session.user.role === "ADMIN") {
    if (variant === "icon") {
      return (
        <Button size="icon" variant="outline" className="h-9 w-9" asChild>
          <Link href="/admin" aria-label="پنل مدیریت">
            <PanelIcon />
          </Link>
        </Button>
      );
    }
    return (
      <Button variant="outline" className="w-full" asChild>
        <Link href="/admin" onClick={onNavigate}>
          پنل مدیریت
        </Link>
      </Button>
    );
  }

  if (status === "authenticated") {
    const handleSignOut = () => {
      onNavigate?.();
      signOut({ callbackUrl: "/" });
    };

    if (variant === "icon") {
      return (
        <Button size="icon" variant="outline" className="h-9 w-9" onClick={handleSignOut} aria-label="خروج">
          <LogoutIcon />
        </Button>
      );
    }
    return (
      <Button variant="outline" className="w-full" onClick={handleSignOut}>
        خروج
      </Button>
    );
  }

  if (variant === "icon") {
    return (
      <Button size="icon" variant="outline" className="h-9 w-9" asChild>
        <Link href="/login" aria-label="ورود">
          <UserIcon />
        </Link>
      </Button>
    );
  }

  return (
    <Button variant="outline" className="w-full" asChild>
      <Link href="/login" onClick={onNavigate}>
        ورود
      </Link>
    </Button>
  );
}
