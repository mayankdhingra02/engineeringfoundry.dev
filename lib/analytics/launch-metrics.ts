/**
 * P0.9 launch metrics are intentionally a small, fixed vocabulary. These
 * values are shared by event capture, documentation, and evidence validation
 * so a monthly export cannot silently change what a metric means.
 */
export const ANALYTICS_DEFINITION_VERSION = "analytics-definition-v1";

export const PREPARATION_TRACKS = [
  "dsa",
  "system-design",
  "ml-design",
  "behavioral",
  "low-level-design",
] as const;

export type PreparationAnalyticsTrack = (typeof PREPARATION_TRACKS)[number];

/**
 * A first useful action is a deliberate start of canonical preparation, not a
 * pageview, navigation click, account creation, or a claim of mastery.
 */
export const FIRST_USEFUL_ACTION_EVENTS = [
  "dsa_practice_started",
  "system_design_practice_started",
  "ml_design_practice_started",
  "behavioral_practice_started",
  "low_level_design_lesson_opened",
  "low_level_design_practice_started",
  "mock_session_started",
  "preparation_activity_recorded",
  "low_level_design_activity_recorded",
] as const;

export type FirstUsefulActionEvent = (typeof FIRST_USEFUL_ACTION_EVENTS)[number];

/**
 * New P0.9 event families have an explicit property allowlist. Legacy events
 * retain their stable payloads and still pass through the global privacy
 * sanitizer in lib/analytics.ts.
 */
export const P09_EVENT_PROPERTY_ALLOWLIST = {
  dsa_practice_started: ["track", "problem_id", "source"],
  system_design_practice_started: ["track", "problem_id", "difficulty", "domain"],
  ml_design_practice_started: ["track", "problem_id", "difficulty", "domain"],
  behavioral_practice_started: ["track", "question_id", "category"],
  low_level_design_lesson_opened: ["track", "lesson_id"],
  low_level_design_practice_started: ["track", "practice_id"],
  preparation_activity_recorded: ["track", "item_id", "status", "persistence"],
  low_level_design_activity_recorded: ["track", "item_id", "item_type", "status", "persistence"],
  continuation_presented: ["track", "continuation_source", "authenticated"],
  continuation_selected: ["track", "continuation_source", "authenticated"],
  study_plan_activated: ["track", "plan_id", "persistence"],
  study_plan_resumed: ["track", "continuation_source", "authenticated"],
  mock_review_saved: ["track", "mode", "prompt_id", "rubric_id"],
  salary_negotiation_module_viewed: ["module_id"],
  offer_comparison_opened: ["surface"],
  interview_experience_submission_started: ["source"],
  interview_experience_submitted: ["source"],
} as const;

export type P09AnalyticsEvent = keyof typeof P09_EVENT_PROPERTY_ALLOWLIST;

const TRACK_VALUES = new Set([...PREPARATION_TRACKS, "interview"]);
const PERSISTENCE_VALUES = new Set(["account", "local"]);
const STATUS_VALUES = new Set(["attempted", "solved", "review", "reviewed", "comfortable", "in-progress", "completed"]);
const MODE_VALUES = new Set(["solo", "peer"]);
const DSA_SOURCE_VALUES = new Set(["leetcode", "leetcode-ca", "other"]);
const INTERVIEW_EXPERIENCE_SOURCE_VALUES = new Set(["directory_contribution"]);
const LOW_LEVEL_DESIGN_ITEM_TYPES = new Set(["lesson", "practice"]);
const SLUG_VALUE = /^[a-z0-9][a-z0-9-]{0,119}$/;
const CONTINUATION_SOURCE_VALUE = /^(account|local):(upcoming-interview|active-plan|in-progress|next|recent)$/;

function validPropertyValue(event: P09AnalyticsEvent, key: string, value: unknown) {
  if (key === "authenticated") return typeof value === "boolean";
  if (key === "track") return typeof value === "string" && TRACK_VALUES.has(value);
  if (key === "persistence") return typeof value === "string" && PERSISTENCE_VALUES.has(value);
  if (key === "status") return typeof value === "string" && STATUS_VALUES.has(value);
  if (key === "mode") return typeof value === "string" && MODE_VALUES.has(value);
  if (key === "continuation_source") return typeof value === "string" && CONTINUATION_SOURCE_VALUE.test(value);
  if (key === "source" && event === "dsa_practice_started") return typeof value === "string" && DSA_SOURCE_VALUES.has(value);
  if (key === "source" && (event === "interview_experience_submission_started" || event === "interview_experience_submitted")) return typeof value === "string" && INTERVIEW_EXPERIENCE_SOURCE_VALUES.has(value);
  if (key === "item_type" && event === "low_level_design_activity_recorded") return typeof value === "string" && LOW_LEVEL_DESIGN_ITEM_TYPES.has(value);
  if (key === "surface") return value === "salary-negotiation";
  return typeof value === "string" && SLUG_VALUE.test(value);
}

export function isP09AnalyticsEvent(event: string): event is P09AnalyticsEvent {
  return Object.hasOwn(P09_EVENT_PROPERTY_ALLOWLIST, event);
}

export function sanitizeP09AnalyticsProperties(event: string, properties: Record<string, unknown> | undefined) {
  if (!properties || !isP09AnalyticsEvent(event)) return properties;
  const allowed = new Set<string>(P09_EVENT_PROPERTY_ALLOWLIST[event]);
  return Object.fromEntries(Object.entries(properties).filter(([key, value]) => allowed.has(key) && validPropertyValue(event, key, value)));
}
