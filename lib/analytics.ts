import posthog from "posthog-js";

export type AnalyticsEvent =
  | "dsa_question_clicked"
  | "dsa_filter_changed"
  | "dsa_topic_viewed"
  | "dsa_pattern_viewed"
  | "company_question_clicked"
  | "verification_source_opened"
  | "search_used"
  | "company_page_viewed"
  | "resource_clicked"
  | "roadmap_viewed"
  | "roadmap_step_completed"
  | "mock_session_configured"
  | "mock_session_started"
  | "mock_prompt_randomized"
  | "mock_guidance_opened"
  | "mock_feedback_copied"
  | "mock_community_clicked"
  | "referral_builder_opened"
  | "referral_packet_copied"
  | "referral_draft_cleared"
  | "referrer_toolkit_opened"
  | "referrer_card_copied"
  | "referral_community_clicked"
  | "discord_clicked"
  | "contact_channel_clicked"
  | "challenge_opened"
  | "challenge_guidance_opened"
  | "challenge_rubric_used"
  | "challenge_solution_summary_copied"
  | "challenge_community_clicked"
  | "community_pathway_clicked"
  | "community_discord_clicked"
  | "recognition_preview_viewed"
  | "experience_builder_opened"
  | "experience_round_added"
  | "experience_round_removed"
  | "experience_summary_generated"
  | "experience_summary_copied"
  | "experience_draft_cleared"
  | "experience_guidance_opened"
  | "experience_community_clicked"
  | "experience_company_workspace_viewed"
  | "account_signup_started"
  | "account_created"
  | "sign_in_completed"
  | "sign_out_completed"
  | "profile_onboarding_started"
  | "profile_onboarding_completed"
  | "profile_updated"
  | "public_profile_viewed"
  | "system_design_problem_viewed"
  | "system_design_guidance_opened"
  | "ml_design_problem_viewed"
  | "ml_design_guidance_opened"
  | "design_problem_started"
  | "behavioral_question_viewed"
  | "behavioral_guidance_opened"
  | "behavioral_prompt_randomized"
  | "interview_checklist_used"
  | "interview_playbook_section_viewed"
  | "resource_opened";

export type EventProperties = Record<string, string | number | boolean | null | undefined>;

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
