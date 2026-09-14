"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { User, SquaresFour } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

const UserIcon = () => <User size={18} />;

const PanelIcon = () => <SquaresFour size={18} />;

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
