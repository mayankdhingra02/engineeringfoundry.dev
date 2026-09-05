import { activeMockSessionPlans, getMockRubric } from "@/data/mock-interviews";
import {
  MOCK_ASSISTANCE_STATES,
  MOCK_HINT_POLICIES,
  MOCK_PROMPT_EXPOSURES,
  MOCK_SESSION_OUTCOMES,
  MOCK_TIMING_MODES,
  type MockAssistanceState,
  type MockHintPolicy,
  type MockPromptExposure,
  type MockSessionOutcome,
  type MockTimingMode,
} from "@/lib/mock-interviews/session-conditions";
import type { MockPracticeMode, MockTrack } from "@/types";

export const MOCK_REVIEW_INVALID_INPUT_ERROR =
  "This review no longer matches the selected canonical practice session.";
export const MOCK_REVIEW_ACCOUNT_UNAVAILABLE_ERROR =
  "Private review saving is unavailable right now.";
export const MOCK_REVIEW_UNAUTHENTICATED_ERROR =
  "Sign in to save this private practice review.";
export const MOCK_REVIEW_PERSISTENCE_ERROR =
  "Could not save your practice review. Please try again.";
export const MOCK_REVIEW_SAVED_MESSAGE = "Practice review saved privately.";

const REVIEW_INPUT_KEYS = [
  "sessionId",
  "track",
  "mode",
  "planId",
  "promptId",
  "rubricId",
  "startedAt",
  "elapsedSeconds",
  "promptExposure",
  "timingMode",
  "hintPolicy",
  "assistanceState",
  "sessionOutcome",
  "sessionIssue",
  "strength",
  "improvement",
  "followUp",
  "ratings",
] as const;
const REVIEW_RATING_KEYS = ["dimension_id", "rating"] as const;
const REVIEW_RATING_VALUES = [
  "Strong",
  "Developing",
  "Needs attention",
] as const;
const REVIEW_MODES = ["solo", "peer"] as const;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const MILLISECOND_UTC_TIMESTAMP_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const POSTGRES_INTEGER_MAX = 2_147_483_647;
const REFLECTION_CHARACTER_LIMIT = 5_000;
// The session starts in the browser, so tolerate modest device/server clock skew
// without accepting arbitrarily future private-session metadata.
const STARTED_AT_CLOCK_SKEW_TOLERANCE_MS = 5 * 60 * 1_000;

type MockInterviewReviewRatingValue = (typeof REVIEW_RATING_VALUES)[number];

export type MockInterviewReviewRating = {
  dimension_id: string;
  rating: MockInterviewReviewRatingValue;
};

export type MockInterviewReviewInput = {
  sessionId: string;
  track: MockTrack;
  mode: MockPracticeMode;
  planId: string;
  promptId: string;
  rubricId: string;
  startedAt: string;
  elapsedSeconds: number;
  promptExposure: MockPromptExposure;
  timingMode: MockTimingMode;
  hintPolicy: MockHintPolicy;
  assistanceState: MockAssistanceState;
  sessionOutcome: MockSessionOutcome;
  sessionIssue: string;
  strength: string;
  improvement: string;
  followUp: string;
  ratings: MockInterviewReviewRating[];
};

export type MockInterviewReviewParseResult =
  | { ok: true; value: MockInterviewReviewInput }
  | { ok: false; reason: "invalid-input" };

export type MockInterviewReviewActionResult =
  | { ok: true; reason: "saved"; message: typeof MOCK_REVIEW_SAVED_MESSAGE }
  | {
      ok: false;
      reason:
        | "invalid-input"
        | "account-unavailable"
        | "unauthenticated"
        | "persistence-failed";
      error: string;
    };

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function hasExactKeys(
  value: Record<string, unknown>,
  expectedKeys: readonly string[],
) {
  const keys = Reflect.ownKeys(value);
  return (
    keys.length === expectedKeys.length &&
    keys.every(
      (key) => typeof key === "string" && expectedKeys.includes(key),
    )
  );
}

function isCanonicalUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function isCanonicalStartedAtTimestamp(
  value: unknown,
  validationInstant: Date,
): value is string {
  if (
    typeof value !== "string" ||
    !MILLISECOND_UTC_TIMESTAMP_PATTERN.test(value) ||
    value.startsWith("0000-")
  ) {
    return false;
  }

  const timestamp = new Date(value);
  return (
    Number.isFinite(timestamp.getTime()) &&
    timestamp.toISOString() === value &&
    timestamp.getTime() - validationInstant.getTime() <=
      STARTED_AT_CLOCK_SKEW_TOLERANCE_MS
  );
}

function isReflection(value: unknown): value is string {
  return (
    typeof value === "string" &&
    !value.includes("\0") &&
    Array.from(value).length <= REFLECTION_CHARACTER_LIMIT
  );
}

function parseMockInterviewReviewInputUnchecked(
  input: unknown,
  validationInstant: Date,
): MockInterviewReviewParseResult {
  if (
    !Number.isFinite(validationInstant.getTime()) ||
    !isPlainRecord(input) ||
    !hasExactKeys(input, REVIEW_INPUT_KEYS)
  ) {
    return { ok: false, reason: "invalid-input" };
  }

  const plan =
    typeof input.planId === "string"
      ? activeMockSessionPlans.find((item) => item.id === input.planId)
      : undefined;
  const rubric = plan ? getMockRubric(plan.rubric_id) : undefined;

  if (
    !isCanonicalUuid(input.sessionId) ||
    !plan ||
    !rubric ||
    input.track !== plan.track ||
    !REVIEW_MODES.some((mode) => mode === input.mode) ||
    input.promptId !== plan.content_reference.id ||
    input.rubricId !== plan.rubric_id ||
    rubric.track !== plan.track ||
    !isCanonicalStartedAtTimestamp(input.startedAt, validationInstant) ||
    typeof input.elapsedSeconds !== "number" ||
    !Number.isInteger(input.elapsedSeconds) ||
    input.elapsedSeconds < 0 ||
    input.elapsedSeconds > POSTGRES_INTEGER_MAX ||
    !MOCK_PROMPT_EXPOSURES.some((value) => value === input.promptExposure) ||
    !MOCK_TIMING_MODES.some((value) => value === input.timingMode) ||
    !MOCK_HINT_POLICIES.some((value) => value === input.hintPolicy) ||
    !MOCK_ASSISTANCE_STATES.some((value) => value === input.assistanceState) ||
    !MOCK_SESSION_OUTCOMES.some((value) => value === input.sessionOutcome) ||
    !isReflection(input.sessionIssue) ||
    (input.sessionOutcome !== "completed" && !input.sessionIssue.trim()) ||
    !isReflection(input.strength) ||
    !isReflection(input.improvement) ||
    !isReflection(input.followUp) ||
    !Array.isArray(input.ratings) ||
    input.ratings.length === 0
  ) {
    return { ok: false, reason: "invalid-input" };
  }

  const validDimensionIds = new Set(
    rubric.dimensions.map((dimension) => dimension.id),
  );
  const seenDimensionIds = new Set<string>();
  const ratings: MockInterviewReviewRating[] = [];

  for (const rating of input.ratings) {
    if (
      !isPlainRecord(rating) ||
      !hasExactKeys(rating, REVIEW_RATING_KEYS) ||
      typeof rating.dimension_id !== "string" ||
      !validDimensionIds.has(rating.dimension_id) ||
      seenDimensionIds.has(rating.dimension_id) ||
      typeof rating.rating !== "string" ||
      !REVIEW_RATING_VALUES.some((value) => value === rating.rating)
    ) {
      return { ok: false, reason: "invalid-input" };
    }

    seenDimensionIds.add(rating.dimension_id);
    ratings.push({
      dimension_id: rating.dimension_id,
      rating: rating.rating as MockInterviewReviewRatingValue,
    });
  }

  return {
    ok: true,
    value: {
      sessionId: input.sessionId,
      track: plan.track,
      mode: input.mode as MockPracticeMode,
      planId: plan.id,
      promptId: plan.content_reference.id,
      rubricId: plan.rubric_id,
      startedAt: input.startedAt,
      elapsedSeconds: input.elapsedSeconds,
      promptExposure: input.promptExposure as MockPromptExposure,
      timingMode: input.timingMode as MockTimingMode,
      hintPolicy: input.hintPolicy as MockHintPolicy,
      assistanceState: input.assistanceState as MockAssistanceState,
      sessionOutcome: input.sessionOutcome as MockSessionOutcome,
      sessionIssue: input.sessionIssue,
      strength: input.strength,
      improvement: input.improvement,
      followUp: input.followUp,
      ratings,
    },
  };
}

export function parseMockInterviewReviewInput(
  input: unknown,
  validationInstant = new Date(),
): MockInterviewReviewParseResult {
  try {
    return parseMockInterviewReviewInputUnchecked(input, validationInstant);
  } catch {
    return { ok: false, reason: "invalid-input" };
  }
}
