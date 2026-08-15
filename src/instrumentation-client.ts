import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  sendDefaultPii: false,
});

// Required by the SDK to trace client-side route transitions (App Router).
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
