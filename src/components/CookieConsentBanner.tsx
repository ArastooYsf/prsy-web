"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const CONSENT_KEY = "yashar_cookie_consent";

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(CONSENT_KEY)) {
      setVisible(true);
    }
  }, []);

  function accept() {
    localStorage.setItem(CONSENT_KEY, "accepted");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="رضایت کوکی"
      className="fixed inset-x-4 bottom-4 z-50 flex flex-col gap-3 rounded-2xl border border-foreground/10 bg-background/95 p-4 shadow-2xl backdrop-blur sm:inset-x-auto sm:end-4 sm:max-w-sm sm:flex-row sm:items-center"
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
