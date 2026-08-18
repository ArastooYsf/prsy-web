"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Only public pages are counted — admin/account panels are staff usage, not site traffic.
export default function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/account")) return;
    fetch("/api/track/pageview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname }),
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);

  return null;
}
