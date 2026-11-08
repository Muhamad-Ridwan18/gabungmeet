type AnalyticsPayload = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/** Fire-and-forget analytics — wired to gtag when present, noop otherwise. */
export function track(event: string, payload?: AnalyticsPayload) {
  if (typeof window === "undefined") return;
  const detail = { event, ...payload, ts: Date.now() };
  window.dispatchEvent(new CustomEvent("sp:analytics", { detail }));
  if (typeof window.gtag === "function") {
    window.gtag("event", event, payload);
    return;
  }
  if (process.env.NODE_ENV === "development") {
    console.debug("[analytics]", event, payload);
  }
}
