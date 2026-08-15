import { captureRequestError } from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

// Covers error surfaces Sentry's own auto-instrumentation doesn't already
// wrap (e.g. Server Component render errors) — Route Handler errors are
// already captured via Sentry's build-time route wrapping, independent of
// this hook. The file-log mirror lives in sentry.server.config.ts's
// beforeSend instead, since that's the one choke point every server-side
// capture path (this hook included) actually passes through.
export const onRequestError = captureRequestError;
