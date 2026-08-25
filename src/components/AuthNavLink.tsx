"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
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

function IconNavButton({ href, label, icon }: { href: string; label: string; icon: ReactNode }) {
  return (
    <Button size="icon" variant="outline" className="h-9 w-9" asChild>
      <Link href={href} aria-label={label}>
        {icon}
      </Link>
    </Button>
  );
}

type AuthNavLinkProps = {
  variant?: "icon" | "block";
  onNavigate?: () => void;
};

export default function AuthNavLink({ variant = "icon", onNavigate }: AuthNavLinkProps) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return variant === "icon" ? <div className="h-9 w-9" aria-hidden /> : null;
  }

  if (status === "authenticated" && (session.user.role === "ADMIN" || session.user.role === "SUPPORT")) {
    if (variant === "icon") {
      return <IconNavButton href="/account/admin" label="پنل مدیریت" icon={<PanelIcon />} />;
    }
    return (
      <Button variant="outline" className="w-full" asChild>
        <Link href="/account/admin" onClick={onNavigate}>
          پنل مدیریت
        </Link>
      </Button>
    );
  }

  if (status === "authenticated") {
    if (variant === "icon") {
      return <IconNavButton href="/account" label="حساب کاربری" icon={<UserIcon />} />;
    }
    return (
      <Button variant="outline" className="w-full" asChild>
        <Link href="/account" onClick={onNavigate}>
          حساب کاربری
        </Link>
      </Button>
    );
  }

  if (variant === "icon") {
    return <IconNavButton href="/login" label="ورود" icon={<UserIcon />} />;
  }

  return (
    <Button variant="outline" className="w-full" asChild>
      <Link href="/login" onClick={onNavigate}>
        ورود
      </Link>
    </Button>
  );
}
