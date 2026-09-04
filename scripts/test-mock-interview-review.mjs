import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { activeMockSessionPlans, getMockRubric } from "../data/mock-interviews/index.ts";
import {
  MOCK_REVIEW_ACCOUNT_UNAVAILABLE_ERROR,
  MOCK_REVIEW_INVALID_INPUT_ERROR,
  MOCK_REVIEW_PERSISTENCE_ERROR,
  MOCK_REVIEW_SAVED_MESSAGE,
  MOCK_REVIEW_UNAUTHENTICATED_ERROR,
  parseMockInterviewReviewInput,
} from "../lib/mock-interviews/review-input.ts";
import { STATIC_STEPS } from "./release-verification-manifest.mjs";

const read = (path) => readFileSync(path, "utf8");
const validationInstant = new Date("2026-09-03T12:34:56.789Z");
const canonicalSessionId = "123e4567-e89b-42d3-a456-426614174000";

function validInput(plan = activeMockSessionPlans[0], overrides = {}) {
  const rubric = getMockRubric(plan.rubric_id);
  assert.ok(rubric, `Active plan ${plan.id} must resolve its rubric before review parsing.`);
  return {
    sessionId: canonicalSessionId,
    track: plan.track,
    mode: "solo",
    planId: plan.id,
    promptId: plan.content_reference.id,
    rubricId: plan.rubric_id,
    startedAt: "2026-09-03T12:34:56.789Z",
    elapsedSeconds: 120,
    strength: "Clear framing",
    improvement: "State the tradeoff earlier",
    followUp: "Repeat with a stricter timebox",
    ratings: [{ dimension_id: rubric.dimensions[0].id, rating: "Strong" }],
    ...overrides,
  };
}

function mustReject(input, message, instant = validationInstant) {
  assert.deepEqual(
    parseMockInterviewReviewInput(input, instant),
    { ok: false, reason: "invalid-input" },
    message,
  );
}

assert.ok(activeMockSessionPlans.length > 0, "The parser regression needs active canonical plans.");
for (const plan of activeMockSessionPlans) {
  for (const mode of ["solo", "peer"]) {
    const input = validInput(plan, { mode });
    const parsed = parseMockInterviewReviewInput(input, validationInstant);
    assert.ok(parsed.ok, `Canonical ${mode} review input must parse for ${plan.id}.`);
    assert.deepEqual(parsed.value, input, `Canonical review fields must survive parsing for ${plan.id}.`);
  }
}

for (const input of [null, undefined, "review", 1, true, [], [validInput()], new Date(), new Map()]) {
  mustReject(input, "Review input must be a plain, non-array object.");
}
const throwingInput = Object.create(null);
Object.defineProperty(throwingInput, "sessionId", { get() { throw new Error("untrusted getter"); }, enumerable: true });
mustReject(throwingInput, "A throwing untrusted input object must fail closed.");

for (const key of Object.keys(validInput())) {
  const missing = validInput();
  delete missing[key];
  mustReject(missing, `Review input must reject missing ${key}.`);
}
mustReject({ ...validInput(), unexpected: true }, "Review input must reject unknown top-level keys.");
const symbolKey = Symbol("unexpected");
mustReject({ ...validInput(), [symbolKey]: true }, "Review input must reject unknown symbol keys.");

for (const sessionId of [
  "",
  "not-a-uuid",
  "00000000-0000-0000-0000-000000000000",
  "123e4567-e89b-02d3-a456-426614174000",
  "123e4567-e89b-42d3-7456-426614174000",
  "123E4567-E89B-42D3-A456-426614174000",
  " 123e4567-e89b-42d3-a456-426614174000 ",
  null,
  1,
  {},
  [],
]) mustReject(validInput(undefined, { sessionId }), `Review input must reject invalid UUID ${String(sessionId)}.`);

const firstPlan = activeMockSessionPlans[0];
const otherTrack = firstPlan.track === "dsa" ? "behavioral" : "dsa";
for (const [field, value] of [
  ["planId", "unknown-plan"],
  ["planId", firstPlan.id.toUpperCase()],
  ["track", otherTrack],
  ["track", firstPlan.track.toUpperCase()],
  ["promptId", "unknown-prompt"],
  ["rubricId", "unknown-rubric"],
  ["mode", "group"],
  ["mode", "Solo"],
]) mustReject(validInput(firstPlan, { [field]: value }), `Review input must reject invalid ${field}.`);

for (const startedAt of ["2000-02-29T23:59:59.999Z", validationInstant.toISOString(), "2026-09-03T12:39:56.789Z"]) {
  assert.ok(parseMockInterviewReviewInput(validInput(undefined, { startedAt }), validationInstant).ok, `Real UTC timestamp within the clock-skew boundary ${startedAt} must parse.`);
}
for (const startedAt of [
  "0000-01-01T00:00:00.000Z",
  "1900-02-29T12:00:00.000Z",
  "2026-02-29T12:00:00.000Z",
  "2026-02-30T12:00:00.000Z",
  "2026-04-31T12:00:00.000Z",
  "2026-00-01T12:00:00.000Z",
  "2026-13-01T12:00:00.000Z",
  "2026-09-00T12:00:00.000Z",
  "2026-09-03T24:00:00.000Z",
  "2026-09-03T12:60:00.000Z",
  "2026-09-03T12:00:60.000Z",
  "2026-09-03T12:00:00Z",
  "2026-09-03T12:00:00.000z",
  "2026-09-03T07:34:56.789-05:00",
  "2026-09-03",
  "2026-09-03T12:39:56.790Z",
  null,
  1,
]) mustReject(validInput(undefined, { startedAt }), `Review input must reject invalid timestamps or values beyond the clock-skew boundary ${String(startedAt)}.`);

for (const elapsedSeconds of [0, 2_147_483_647]) {
  assert.ok(parseMockInterviewReviewInput(validInput(undefined, { elapsedSeconds }), validationInstant).ok, `Postgres integer boundary ${elapsedSeconds} must parse.`);
}
for (const elapsedSeconds of [-1, 0.5, 2_147_483_648, Number.MAX_SAFE_INTEGER, Number.NaN, Number.POSITIVE_INFINITY, "120", null, {}, []]) {
  mustReject(validInput(undefined, { elapsedSeconds }), `Review input must reject non-int4 elapsed value ${String(elapsedSeconds)}.`);
}

for (const field of ["strength", "improvement", "followUp"]) {
  assert.ok(parseMockInterviewReviewInput(validInput(undefined, { [field]: "x".repeat(5_000) }), validationInstant).ok, `${field} must accept the documented 5,000-character boundary.`);
  for (const value of ["x".repeat(5_001), "before\0after", null, false, 1, {}, []]) {
    mustReject(validInput(undefined, { [field]: value }), `${field} must reject invalid or over-limit reflection text.`);
  }
}

const canonicalRating = validInput().ratings[0];
for (const rating of ["Strong", "Developing", "Needs attention"]) {
  assert.ok(parseMockInterviewReviewInput(validInput(undefined, { ratings: [{ ...canonicalRating, rating }] }), validationInstant).ok, `Canonical rating ${rating} must parse.`);
}
for (const ratings of [
  [],
  null,
  "Strong",
  {},
  [null],
  [[]],
  [{ ...canonicalRating, unexpected: true }],
  [{ dimension_id: canonicalRating.dimension_id }],
  [{ rating: canonicalRating.rating }],
  [{ dimension_id: "unknown-dimension", rating: "Strong" }],
  [{ dimension_id: canonicalRating.dimension_id, rating: "strong" }],
  [{ dimension_id: canonicalRating.dimension_id, rating: "Excellent" }],
  [canonicalRating, canonicalRating],
]) mustReject(validInput(undefined, { ratings }), "Review input must reject malformed, unknown, or duplicate ratings.");

for (const [field, value] of [
  ["track", {}],
  ["mode", []],
  ["planId", { id: firstPlan.id }],
  ["promptId", [firstPlan.content_reference.id]],
  ["rubricId", { id: firstPlan.rubric_id }],
]) mustReject(validInput(firstPlan, { [field]: value }), `Review input must reject nested ${field} values.`);
mustReject(validInput(), "An invalid injected validation clock must fail closed.", new Date("invalid"));

assert.equal(MOCK_REVIEW_INVALID_INPUT_ERROR, "This review no longer matches the selected canonical practice session.");
assert.equal(MOCK_REVIEW_ACCOUNT_UNAVAILABLE_ERROR, "Private review saving is unavailable right now.");
assert.equal(MOCK_REVIEW_UNAUTHENTICATED_ERROR, "Sign in to save this private practice review.");
assert.equal(MOCK_REVIEW_PERSISTENCE_ERROR, "Could not save your practice review. Please try again.");
assert.equal(MOCK_REVIEW_SAVED_MESSAGE, "Practice review saved privately.");

const actions = read("app/mock-interviews/actions.ts");
const actionStart = actions.indexOf("export async function saveMockInterviewReview");
const actionBody = actions.slice(actionStart);
const parseIndex = actionBody.indexOf("const parsed = parseMockInterviewReviewInput(input);");
const invalidIndex = actionBody.indexOf("if (!parsed.ok)");
const availabilityIndex = actionBody.indexOf("if (!isAccountPlatformAvailable())");
const actorIndex = actionBody.indexOf("getAuthenticatedActorState()", availabilityIndex);
const rpcIndex = actionBody.indexOf('actor.supabase.rpc("save_mock_interview_review"');
assert.ok(actionStart >= 0 && parseIndex >= 0 && parseIndex < invalidIndex && invalidIndex < availabilityIndex && availabilityIndex < actorIndex && actorIndex < rpcIndex, "The action must parse before account availability, actor lookup, and RPC persistence.");
assert.ok(actionBody.includes('actorState.state === "unavailable"') && actionBody.includes('reason: "account-unavailable"') && actionBody.includes('actorState.state === "anonymous"') && actionBody.includes('reason: "unauthenticated"'), "The action must distinguish unavailable actor verification from a verified anonymous session.");
assert.match(actionBody, /saveMockInterviewReview\(\s*input: unknown/, "The server action must treat its boundary input as unknown.");
assert.ok(actionBody.includes("const validated = parsed.value;"), "The RPC payload must derive from validated parser output.");
assert.ok(!actionBody.slice(rpcIndex).includes("input."), "The RPC path must not read unvalidated input after parsing.");
for (const marker of [
  "MOCK_REVIEW_INVALID_INPUT_ERROR",
  "MOCK_REVIEW_ACCOUNT_UNAVAILABLE_ERROR",
  "MOCK_REVIEW_UNAUTHENTICATED_ERROR",
  "MOCK_REVIEW_PERSISTENCE_ERROR",
  "MOCK_REVIEW_SAVED_MESSAGE",
  'reason: "invalid-input"',
  'reason: "account-unavailable"',
  'reason: "unauthenticated"',
  'reason: "persistence-failed"',
  'reason: "saved"',
]) assert.ok(actionBody.includes(marker), `The action is missing stable result contract ${marker}.`);

const component = read("components/mock-interview-lab.tsx");
const styles = read("app/globals.css");
const saveStart = component.indexOf("async function savePracticeReview()");
const saveEnd = component.indexOf("function trackGuidance", saveStart);
const saveBody = component.slice(saveStart, saveEnd);
const pendingGuardIndex = saveBody.indexOf("if (pendingSaveRequestId.current !== null) return;");
const missingRatingIndex = saveBody.indexOf("if (!ratingsForSave.length)");
const savingIndex = saveBody.indexOf('setSaveState("saving")');
const actionCallIndex = saveBody.indexOf("await saveMockInterviewReview");
const analyticsIndex = saveBody.indexOf('if (result.ok) track("mock_review_saved"');
const identityGuardIndex = saveBody.indexOf("savingGeneration !== sessionGeneration.current");
const revisionGuardIndex = saveBody.indexOf("savingReviewRevision !== reviewRevision.current");
assert.ok(saveStart >= 0 && pendingGuardIndex >= 0 && pendingGuardIndex < missingRatingIndex && missingRatingIndex < savingIndex && savingIndex < actionCallIndex, "The client must reject incomplete reviews and lock duplicate saves before dispatch.");
assert.ok(actionCallIndex < analyticsIndex && analyticsIndex < identityGuardIndex && identityGuardIndex < revisionGuardIndex, "Analytics must follow confirmed persistence while stale response guards precede UI settlement.");
for (const marker of [
  "reviewRevision",
  "saveRequestSequence",
  "pendingSaveRequestId",
  "savingGeneration",
  "savingSessionId",
  "savingStartedAt",
  "savingReviewRevision",
  "pendingSaveRequestId.current !== requestId",
  'setSaveState("stale-saved")',
  "setSaveMessage(staleSavedReviewMessage)",
  "setSaveMessage(result.error)",
  "setSaveMessage(result.message)",
  "setSaveMessage(unconfirmedSaveMessage)",
  "if (pendingSaveRequestId.current === requestId) pendingSaveRequestId.current = null",
]) assert.ok(saveBody.includes(marker), `The save flow is missing request snapshot or settlement marker ${marker}.`);
for (const marker of [
  "Add at least one rating before saving this private review.",
  "Saving private review…",
  "We could not confirm whether your review was saved. Check your connection before trying again.",
  "Your earlier review was saved. Save again to include your latest changes.",
  "Your latest changes are not saved.",
  "markReviewEdited(); setMarks",
  "markReviewEdited(); setNotes",
  "maxLength={5000}",
  'aria-disabled={saveState === "saving"}',
  'aria-describedby="mock-review-save-status"',
  'id="mock-review-save-status" role="status" aria-live="polite" aria-atomic="true"',
]) assert.ok(component.includes(marker), `The client review contract is missing ${marker}.`);
assert.ok(styles.includes('.mock-feedback-actions .button[aria-disabled="true"]') && styles.includes('.mock-feedback-actions .button-secondary[aria-disabled="true"]:hover'), "The pending save trigger must retain a distinct non-hovering visual state while it remains focusable.");
assert.equal((saveBody.match(/track\("mock_review_saved"/g) ?? []).length, 1, "A successful review must have exactly one analytics emission point.");
for (const privateField of ["strength", "improvement", "followUp", "ratings", "elapsedSeconds", "startedAt", "sessionId"]) {
  const analyticsCall = saveBody.slice(analyticsIndex, identityGuardIndex);
  assert.ok(!analyticsCall.includes(`${privateField}:`), `Saved-review analytics must not include private field ${privateField}.`);
}

assert.equal(STATIC_STEPS.filter((step) => step.args?.includes("test:mock-interview-review")).length, 1, "The canonical static lane must run the Mock review regression exactly once.");

console.log(`Mock Interview review regression passed: ${activeMockSessionPlans.length} canonical plans, strict action input, stable persistence outcomes, and race-safe accessible client settlement hold.`);
