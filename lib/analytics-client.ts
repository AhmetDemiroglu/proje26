"use client";

import type { AnalyticsEventName, AnalyticsPayload } from "./analytics";

const SESSION_KEY = "tercihceAnalyticsSession";

function sessionId() {
  let id = window.sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export async function trackEvent(
  event: AnalyticsEventName,
  details: Omit<Partial<AnalyticsPayload>, "event" | "path" | "sessionId"> = {},
) {
  if (typeof window === "undefined" || navigator.doNotTrack === "1") return;

  try {
    const { getAnalyticsAppCheckToken } = await import("./firebase/client");
    const appCheckToken = await getAnalyticsAppCheckToken();
    await fetch("/api/analytics", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(appCheckToken ? { "x-firebase-appcheck": appCheckToken } : {}),
      },
      body: JSON.stringify({
        event,
        path: window.location.pathname,
        sessionId: sessionId(),
        ...details,
      }),
      keepalive: true,
    });
  } catch {
    // Analitik, ana kullanıcı akışını hiçbir zaman engellemez.
  }
}

export function trackPageView(path: string) {
  const key = `tercihcePageView:${path}`;
  if (window.sessionStorage.getItem(key)) return;
  window.sessionStorage.setItem(key, "1");
  void trackEvent("page_view");
}

