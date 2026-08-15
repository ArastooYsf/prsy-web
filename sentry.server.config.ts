import * as Sentry from "@sentry/nextjs";

const SYSTEM_ACTOR = { id: "system", name: "سیستم", email: "", role: "SYSTEM" };

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  // Off on purpose: this app handles customer emails/phones/addresses, and
  // Sentry is a third-party service — don't ship that data there by default.
  sendDefaultPii: false,
  // The one choke point every server-side capture path (route handlers,
  // Server Components, onRequestError) passes through — used to mirror each
  // crash into the file-based event log (crash category) this project
  // already keeps outside Sentry. Fire-and-forget: logEvent() never throws,
  // and beforeSend must return promptly, not wait on file I/O.
  beforeSend(event, hint) {
    const error = hint.originalException;
    const message = error instanceof Error ? error.message : (event.exception?.values?.[0]?.value ?? "خطای نامشخص");
    const routePath = event.request?.url ?? event.transaction ?? "unknown";

    import("@/lib/logger")
      .then(({ logEvent }) =>
        logEvent({
          category: "crash",
          actor: SYSTEM_ACTOR,
          action: "crash",
          target: { type: "route", id: routePath, label: routePath },
          summary: message,
        }),
      )
      .catch(() => {});

    return event;
  },
});
