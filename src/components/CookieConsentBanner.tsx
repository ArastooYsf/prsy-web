"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { COOKIE_CONSENT_EVENT, COOKIE_CONSENT_KEY } from "@/lib/cookie-consent";

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(COOKIE_CONSENT_KEY)) {
      setVisible(true);
    }
  }, []);

  function accept() {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    window.dispatchEvent(new Event(COOKIE_CONSENT_EVENT));
    setVisible(false);
  }

  if (!visible) return null;

  return (
    // Solid background, no backdrop-blur — this sits fixed on screen through
    // every scroll on every page until dismissed, and a `backdrop-filter`
    // there forces a recomposite on every scroll frame (see the same fix on
    // ProductBuyBox's mobile bar for the full reasoning).
    <div
      role="dialog"
      aria-label="رضایت کوکی"
      className="fixed inset-x-4 bottom-20 z-50 flex flex-col gap-3 rounded-2xl border border-foreground/10 bg-background p-4 shadow-2xl sm:inset-x-auto sm:end-4 sm:max-w-sm sm:flex-row sm:items-center lg:bottom-4 [@media(max-height:500px)]:!top-4 [@media(max-height:500px)]:!bottom-auto"
    >
      <p className="flex-1 text-xs leading-6 text-foreground/70">
        این سایت برای بهبود تجربه‌ی کاربری از کوکی استفاده می‌کند. با ادامه استفاده از سایت، با{" "}
        <Link href="/privacy" className="font-medium text-accent-400 transition-colors hover:text-foreground">
          سیاست حریم خصوصی
        </Link>{" "}
        موافقت می‌کنید.
      </p>
      <button
        type="button"
        onClick={accept}
        className="shrink-0 rounded-full bg-accent-500 px-5 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-accent-600"
      >
        قبول
      </button>
    </div>
  );
}
