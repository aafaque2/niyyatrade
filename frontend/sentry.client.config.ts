import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled:
    process.env.NODE_ENV === "production" &&
    !!process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  // NOTE: no `tunnel` — the previous value pointed at a nonexistent
  // /api/sentry route, silently dropping every client event.
  environment: process.env.NODE_ENV || "development",
});
