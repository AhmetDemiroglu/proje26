export const ANALYTICS_EVENTS = [
  "page_view",
  "analyzer_started",
  "analyzer_completed",
  "scholarship_optin",
  "donor_application",
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number];

export type AnalyticsPayload = {
  event: AnalyticsEventName;
  path: string;
  sessionId: string;
  resultCount?: number;
};
