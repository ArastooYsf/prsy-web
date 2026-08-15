"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import ErrorPageShell from "@/components/errors/ErrorPageShell";
import GearsIcon from "@/components/errors/GearsIcon";

export default function ErrorPage({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    console.error(error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <ErrorPageShell
      code="500"
      icon={<GearsIcon />}
      title="یه مشکل فنی کوچیک پیش اومد!"
      description="تیم ما در حال بررسیه. لطفاً چند لحظه دیگه دوباره امتحان کنید."
      primaryHref="/"
      primaryLabel="بازگشت به صفحه اصلی"
    />
  );
}
