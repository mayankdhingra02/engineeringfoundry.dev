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
  | "account_created"
  | "system_design_problem_viewed";

type EventProperties = Record<string, string | number | boolean | null | undefined>;

let initialized = false;

export function initializeAnalytics() {
  if (typeof window === "undefined" || !process.env.NEXT_PUBLIC_POSTHOG_KEY) return false;
  if (initialized || posthog.__loaded) {
    initialized = true;
    return true;
  }

  try {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
      capture_pageview: false,
      capture_pageleave: true,
      person_profiles: "identified_only",
      persistence: "localStorage+cookie",
    });
    initialized = true;
    return true;
  } catch {
    return false;
  }
}

export function capturePageView(url: string) {
  if (!initializeAnalytics()) return;
  try {
    posthog.capture("$pageview", { $current_url: url });
  } catch {
    // Analytics must never interfere with rendering or navigation.
  }
}

export function track(event: AnalyticsEvent, properties?: EventProperties) {
  if (!initializeAnalytics()) return;
  try {
    posthog.capture(event, properties);
  } catch {
    // Product interactions must remain functional if analytics fails.
  }
}

export function identifyUser(id: string, properties?: EventProperties) {
  if (!initializeAnalytics()) return;
  try {
    posthog.identify(id, properties);
  } catch {
    // Identification is best-effort until authentication is connected.
  }
}

export function resetAnalyticsUser() {
  if (!initializeAnalytics()) return;
  try {
    posthog.reset();
  } catch {
    // Reset failures must not block sign-out.
  }
}
