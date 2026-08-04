"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton({ callbackUrl = "/" }: { callbackUrl?: string }) {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl })}
      className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-foreground/70 transition-colors hover:border-accent-500/40 hover:text-accent-400"
    >
      خروج
    </button>
  );
}
