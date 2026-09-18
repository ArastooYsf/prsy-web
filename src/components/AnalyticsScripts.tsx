"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { COOKIE_CONSENT_EVENT, hasCookieConsent } from "@/lib/cookie-consent";

// Loads GA4 only once the visitor has accepted CookieConsentBanner — never
// unconditionally on first paint. Keeps the two features in sync without
// coupling them directly: this only listens for the banner's accept event
// and re-checks localStorage, it never touches the banner's own state.
export default function AnalyticsScripts({ measurementId }: { measurementId: string }) {
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    if (hasCookieConsent()) {
      setConsented(true);
      return;
    }
    const onAccept = () => setConsented(true);
    window.addEventListener(COOKIE_CONSENT_EVENT, onAccept);
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, onAccept);
  }, []);

  if (!consented) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}');
        `}
      </Script>
    </>
  );
}
