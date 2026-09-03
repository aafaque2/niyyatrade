import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled:
    process.env.NODE_ENV === "production" &&
    !!process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  // Client events go through the same-origin /monitoring tunnel
  // (see tunnelRoute in next.config.ts) so ad-blockers don't drop them.
  tunnel: "/monitoring",
  environment: process.env.NODE_ENV || "development",
  beforeSend(event) {
    // Scrub PII that sometimes lands in request data / breadcrumbs
    const scrub = (obj: unknown) => {
      if (!obj || typeof obj !== "object") return;
      for (const k of Object.keys(obj as Record<string, unknown>)) {
        if (/password|token|authorization|secret|api[_-]?key/i.test(k)) {
          (obj as Record<string, unknown>)[k] = "[Filtered]";
        }
      }
    };
    scrub(event.request?.data);
    scrub(event.contexts);
    return event;
  },
});
