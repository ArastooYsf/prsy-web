"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import ErrorPageShell from "@/components/errors/ErrorPageShell";
import GearsIcon from "@/components/errors/GearsIcon";
import "./globals.css";

// Catches crashes in the root layout itself (rare — normal route errors go
// through error.tsx instead), so this has to render its own <html>/<body>.
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    console.error(error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="fa" dir="rtl">
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <ErrorPageShell
          code="500"
          icon={<GearsIcon />}
          title="یه مشکل فنی کوچیک پیش اومد!"
          description="تیم ما در حال بررسیه. لطفاً چند لحظه دیگه دوباره امتحان کنید."
          primaryHref="/"
          primaryLabel="بازگشت به صفحه اصلی"
        />
      </body>
    </html>
  );
}
