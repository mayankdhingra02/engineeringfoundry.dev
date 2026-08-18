/**
 * Private-content guard for analytics properties.
 *
 * The analytics layer may know that `question_marked_solved` happened. It must
 * never know the private note the user wrote alongside it. This module is the
 * enforceable boundary; the event-name taxonomy in `lib/analytics.ts` is only a
 * convention.
 *
 * Three independent rules, applied to every captured property:
 *
 *   1. Denied names — the private free-text and document fields owned by the
 *      Applications, Behavioral, DSA, System Design, and preparation schemas.
 *   2. UUID-shaped values — every public catalog identifier in this product is
 *      a human-readable slug, so a UUID in an analytics payload is always a
 *      private database row identifier (application, round, story, answer,
 *      attempt, or user).
 *   3. Prose-length values — analytics properties are labels and counts. A long
 *      string is private content that reached the payload by accident.
 *
 * Isomorphic on purpose: no server-only or browser-only imports.
 */

/** Private free-text and structured-document fields that must never be captured. */
export const PRIVATE_ANALYTICS_PROPERTY_NAMES = [
  // Shared private note fields
  "notes",
  "note",
  "private_notes",
  "privatenotes",
  "preparation_notes",
  "follow_up_notes",
  "review_notes",
  "recruiter_email",
  "recruiter_name",
  "interviewer_name",
  "meeting_link",
  // Behavioral STAR evidence and answers
  "situation",
  "task",
  "action",
  "result",
  "reflection",
  "short_summary",
  "answer_text",
  "answer",
  "opening_framing",
  "details_to_emphasize",
  "details_to_avoid",
  "story",
  "story_text",
  "prompt_text",
  "question_text",
  // System Design attempts
  "document",
  "attempt_document",
  "functional_requirements",
  "non_functional_requirements",
  "capacity_assumptions",
  "apis",
  "data_model",
  "architecture",
  "deep_dives",
  "bottlenecks",
  "failures",
  "tradeoffs",
  "follow_ups",
  // Post-interview reflection
  "went_well",
  "needs_improvement",
  "topics_asked",
] as const;

/** Property names that carry a private row identifier regardless of value shape. */
export const PRIVATE_ANALYTICS_ID_PROPERTY_NAMES = [
  "application_id",
  "applicationid",
  "round_id",
  "roundid",
  "story_id",
  "storyid",
  "answer_id",
  "answerid",
  "attempt_id",
  "attemptid",
  "preparation_id",
  "task_id",
  "reminder_id",
  "user_id",
  "userid",
] as const;

const DENIED_NAMES = new Set<string>([
  ...PRIVATE_ANALYTICS_PROPERTY_NAMES,
  ...PRIVATE_ANALYTICS_ID_PROPERTY_NAMES,
]);

const UUID_PATTERN = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

/** Analytics properties are labels and counts, never prose. */
export const MAX_ANALYTICS_STRING_LENGTH = 256;

function normalizeName(name: string) {
  return name.trim().toLowerCase().replace(/^\$+/, "");
}

/** True when this property name is a known private field. */
export function isPrivateAnalyticsPropertyName(name: string) {
  return DENIED_NAMES.has(normalizeName(name));
}

/** True when this value must not leave the browser through analytics. */
export function isPrivateAnalyticsValue(value: unknown) {
  if (typeof value !== "string") return false;
  return UUID_PATTERN.test(value) || value.length > MAX_ANALYTICS_STRING_LENGTH;
}

/**
 * Removes private properties from an analytics payload. Returns `undefined`
 * when nothing survives so callers can capture a bare event rather than an
 * empty object.
 */
export function sanitizeAnalyticsProperties<T extends Record<string, unknown>>(
  properties: T | undefined,
): Record<string, unknown> | undefined {
  if (!properties) return undefined;
  const safe: Record<string, unknown> = {};
  for (const [name, value] of Object.entries(properties)) {
    if (isPrivateAnalyticsPropertyName(name)) continue;
    if (isPrivateAnalyticsValue(value)) continue;
    safe[name] = value;
  }
  return Object.keys(safe).length ? safe : undefined;
}
