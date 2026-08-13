import posthog from "posthog-js";

export type AnalyticsEvent =
  | "dsa_question_clicked"
  | "company_page_viewed"
  | "resource_clicked"
  | "roadmap_viewed"
  | "roadmap_step_completed"
  | "mock_interview_started"
  | "mock_interview_requested"
  | "referral_page_viewed"
  | "referral_requested"
  | "referrer_signup_started"
  | "discord_clicked"
  | "challenge_viewed"
  | "account_signup_started"
  | "account_created";

type EventProperties = Record<string, string | number | boolean | null | undefined>;

export function track(event: AnalyticsEvent, properties?: EventProperties) {
  if (typeof window === "undefined" || !process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
  posthog.capture(event, properties);
}

export function identifyUser(id: string, properties?: EventProperties) {
  if (typeof window === "undefined" || !process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
  posthog.identify(id, properties);
}

export function resetAnalyticsUser() {
  if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_POSTHOG_KEY) posthog.reset();
}
