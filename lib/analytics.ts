import posthog from "posthog-js";
import {
  isPrivateAnalyticsPropertyName,
  isPrivateAnalyticsValue,
  sanitizeAnalyticsProperties,
} from "@/lib/privacy/analytics-properties";
import { isPrivateRoute } from "@/lib/privacy/routes";

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
  | "roadmap_level_selected"
  | "roadmap_plan_selected"
  | "company_overlay_selected"
  | "roadmap_topic_opened"
  | "roadmap_problem_opened"
  | "roadmap_problem_completed"
  | "roadmap_problem_marked_review"
  | "roadmap_hint_revealed"
  | "mixed_set_started"
  | "mixed_set_completed"
  | "timed_practice_started"
  | "roadmap_filter_changed"
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

// Private-route classification lives in one canonical module shared with
// robots.ts so a new authenticated surface cannot be private in one system and
// measurable in another. See lib/privacy/routes.ts.

const URL_EVENT_PROPERTIES = [
  "$current_url",
  "$initial_current_url",
  "$session_entry_url",
  "current_url",
  "navigationURL",
  "request_url",
  "url.full",
] as const;

const PRIVATE_CONTEXT_PROPERTIES = [
  ...URL_EVENT_PROPERTIES,
  "$pathname",
  "$initial_pathname",
  "$session_entry_pathname",
] as const;

const ATTRIBUTION_PROPERTY_ROOTS = [
  "_kx",
  "dclid",
  "epik",
  "fbclid",
  "gbraid",
  "gclid",
  "gclsrc",
  "igshid",
  "irclid",
  "li_fat_id",
  "mc_cid",
  "msclkid",
  "ph_keyword",
  "qclid",
  "rdt_cid",
  "referrer",
  "referring_domain",
  "sccid",
  "search_engine",
  "ttclid",
  "twclid",
  "utm_campaign",
  "utm_content",
  "utm_medium",
  "utm_source",
  "utm_term",
  "wbraid",
] as const;

const REFERRER_AND_CAMPAIGN_PROPERTIES = [
  "$external_click_url",
  ...ATTRIBUTION_PROPERTY_ROOTS.flatMap((property) => [
    property,
    `$${property}`,
    `$initial_${property}`,
    `$session_entry_${property}`,
  ]),
];

export function isPrivateAnalyticsPath(pathname: string) {
  return isPrivateRoute(pathname);
}

function parseAnalyticsUrl(value: unknown) {
  if (typeof window === "undefined" || typeof value !== "string") return null;
  try {
    const url = new URL(value, window.location.origin);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url;
  } catch {
    return null;
  }
}

function pathFromAnalyticsProperties(properties: Record<string, unknown>) {
  const currentUrl = parseAnalyticsUrl(properties.$current_url);
  if (currentUrl) return currentUrl.pathname;
  return typeof properties.$pathname === "string" ? properties.$pathname : window.location.pathname;
}

export function initializeAnalytics() {
  if (typeof window === "undefined" || !process.env.NEXT_PUBLIC_POSTHOG_KEY) return false;
  if (initialized || posthog.__loaded) {
    initialized = true;
    return true;
  }

  try {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
      autocapture: false,
      before_send: (event) => {
        if (!event?.properties) return event;

        const properties = { ...event.properties };
        const privateContext = isPrivateAnalyticsPath(pathFromAnalyticsProperties(properties));
        if (event.event === "$pageview" && privateContext) return null;

        if (privateContext) {
          for (const property of PRIVATE_CONTEXT_PROPERTIES) delete properties[property];
        } else {
          for (const property of URL_EVENT_PROPERTIES) {
            const url = parseAnalyticsUrl(properties[property]);
            if (!url) {
              delete properties[property];
              continue;
            }
            url.search = "";
            url.hash = "";
            properties[property] = url.toString();
          }
        }

        for (const property of REFERRER_AND_CAMPAIGN_PROPERTIES) delete properties[property];

        // Final content boundary. Every captured event passes through here, so
        // private field names, private row UUIDs, and prose-length values are
        // dropped even if a future call site forgets to sanitize them.
        // PostHog's own `$session_id`/`$device_id` are UUIDs by design, so the
        // value rules apply to product properties only. The name rules apply to
        // every property.
        for (const [name, value] of Object.entries(properties)) {
          const internal = name.startsWith("$");
          if (isPrivateAnalyticsPropertyName(name) || (!internal && isPrivateAnalyticsValue(value))) {
            delete properties[name];
          }
        }

        return { ...event, properties };
      },
      capture_exceptions: false,
      capture_pageview: false,
      capture_pageleave: false,
      capture_performance: false,
      disable_capture_url_hashes: true,
      disable_conversations: true,
      disable_product_tours: true,
      disable_session_recording: true,
      disable_surveys: true,
      mask_all_element_attributes: true,
      mask_all_text: true,
      mask_personal_data_properties: true,
      person_profiles: "identified_only",
      persistence: "localStorage+cookie",
      property_denylist: [...REFERRER_AND_CAMPAIGN_PROPERTIES],
      save_campaign_params: false,
      save_referrer: false,
    });
    initialized = true;
    return true;
  } catch {
    return false;
  }
}

export function capturePageView(url: string) {
  const safeUrl = parseAnalyticsUrl(url);
  if (!safeUrl) return;

  if (safeUrl.origin !== window.location.origin || isPrivateAnalyticsPath(safeUrl.pathname)) return;

  safeUrl.search = "";
  safeUrl.hash = "";

  if (!initializeAnalytics()) return;
  try {
    posthog.capture("$pageview", { $current_url: safeUrl.toString() });
  } catch {
    // Analytics must never interfere with rendering or navigation.
  }
}

export function track(event: AnalyticsEvent, properties?: EventProperties) {
  if (!initializeAnalytics()) return;
  try {
    posthog.capture(event, sanitizeAnalyticsProperties(properties));
  } catch {
    // Product interactions must remain functional if analytics fails.
  }
}

export function identifyUser(id: string, properties?: EventProperties) {
  if (!initializeAnalytics()) return;
  try {
    // The account ID is the intentional identity boundary. Any additional
    // person property still passes the private-content guard.
    posthog.identify(id, sanitizeAnalyticsProperties(properties));
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
