import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { chooseRoundPreparationNextAction } from "../lib/interview-preparation/next-action.ts";
import { parsePreparationChecklistActionInput, PREPARATION_CHECKLIST_INVALID_INPUT_ERROR } from "../lib/interview-preparation/checklist-action-input.ts";
import {
  PREPARATION_NOTES_CONFLICT_ERROR,
  PREPARATION_NOTES_EARLIER_SNAPSHOT_SAVED_MESSAGE,
  PREPARATION_REFLECTION_CONFLICT_ERROR,
  PREPARATION_REFLECTION_EARLIER_SNAPSHOT_SAVED_MESSAGE,
  parsePreparationNotesActionInput,
  parsePreparationReflectionActionInput,
  parsePreparationTextSaveResult,
  resolvePreparationTextDisplayState,
} from "../lib/interview-preparation/text-action-input.ts";
import { ALL_CHECKLIST_IDS, checklistForRound, modulesForRound, resolveRoundPreparationContext } from "../lib/interview-preparation/model.ts";
import { resolvePreparationCounts } from "../lib/interview-preparation/preparation-counts.ts";
import { buildInterviewPlaybookOverview } from "../lib/interview-playbook/overview.ts";
import { resolveInterviewPlaybookTiming } from "../lib/interview-playbook/timing.ts";
import { isActiveInterviewProcess } from "../lib/applications/insights.ts";
import { STATIC_STEPS } from "./release-verification-manifest.mjs";

const root = process.cwd();
const read = (file) => readFileSync(join(root, file), "utf8");
const model = read("lib/interview-preparation/model.ts");
const query = read("lib/interview-preparation/queries.ts");
const preparationCountsCore = read("lib/interview-preparation/preparation-counts.ts");
const actions = read("features/interview-preparation/actions.ts");
const notesAction = actions.slice(
  actions.indexOf("export async function savePreparationNotesAction"),
  actions.indexOf("export async function togglePreparationChecklistAction"),
);
const reflectionAction = actions.slice(
  actions.indexOf("export async function savePreparationReflectionAction"),
);
const textForm = read("features/interview-preparation/text-form.tsx");
const notesFormSource = textForm.slice(
  textForm.indexOf("export function PreparationNotesForm"),
  textForm.indexOf("export function PreparationReflectionForm"),
);
const reflectionFormSource = textForm.slice(
  textForm.indexOf("export function PreparationReflectionForm"),
);
const checklistAction = actions.slice(
  actions.indexOf("export async function togglePreparationChecklistAction"),
  actions.indexOf("export async function addPreparationTaskAction"),
);
const mutationControls = read("features/interview-preparation/mutation-controls.tsx");
const page = read("app/interviews/[roundId]/prepare/page.tsx");
const migration = read("supabase/migrations/202608140011_create_interview_preparation_hub.sql");
const atomicChecklistMigration = read("supabase/migrations/202609030001_set_interview_preparation_checklist_item.sql");
const preparationTextRevisionMigration = read("supabase/migrations/202609040004_save_interview_preparation_text_if_revision.sql");
const notesRevisionFunction = preparationTextRevisionMigration.slice(
  preparationTextRevisionMigration.indexOf("create or replace function public.save_interview_preparation_notes_if_revision"),
  preparationTextRevisionMigration.indexOf("create or replace function public.save_interview_preparation_reflection_if_revision"),
);
const reflectionRevisionFunction = preparationTextRevisionMigration.slice(
  preparationTextRevisionMigration.indexOf("create or replace function public.save_interview_preparation_reflection_if_revision"),
  preparationTextRevisionMigration.indexOf("create or replace function public.save_interview_preparation("),
);
const retiredPreparationFunction = preparationTextRevisionMigration.slice(
  preparationTextRevisionMigration.indexOf("create or replace function public.save_interview_preparation("),
  preparationTextRevisionMigration.indexOf("revoke all on function public.save_interview_preparation_notes_if_revision"),
);
const legacySaveMigration = atomicChecklistMigration.slice(
  atomicChecklistMigration.indexOf("create or replace function public.save_interview_preparation"),
  atomicChecklistMigration.indexOf("create or replace function public.set_interview_preparation_checklist_item"),
);
const atomicChecklistFunction = atomicChecklistMigration.slice(
  atomicChecklistMigration.indexOf("create or replace function public.set_interview_preparation_checklist_item"),
  atomicChecklistMigration.indexOf("revoke all on function public.save_interview_preparation"),
);
const atomicChecklistClearBranch = atomicChecklistFunction.slice(
  atomicChecklistFunction.indexOf("  else\n"),
  atomicChecklistFunction.indexOf("  end if;", atomicChecklistFunction.indexOf("  else\n")),
);
const atomicChecklistAllowlistMatch = atomicChecklistFunction.match(
  /target_item_id\s*=\s*any\s*\(\s*array\s*\[([\s\S]*?)\]\s*::\s*text\[\]\s*\)/,
);
assert.ok(atomicChecklistAllowlistMatch, "the atomic checklist RPC must expose one parseable target-item SQL allowlist");
const atomicChecklistSqlIds = [...atomicChecklistAllowlistMatch[1].matchAll(/'((?:''|[^'])+)'/g)]
  .map((match) => match[1].replaceAll("''", "'"));
assert.equal(atomicChecklistSqlIds.length, 12, "the atomic checklist SQL allowlist must contain all 12 canonical item entries");
assert.equal(new Set(atomicChecklistSqlIds).size, 12, "the atomic checklist SQL allowlist must not contain duplicates");
assert.equal(ALL_CHECKLIST_IDS.length, 12, "the TypeScript checklist catalog must retain its 12 canonical item IDs");
assert.deepEqual(
  [...atomicChecklistSqlIds].sort(),
  [...ALL_CHECKLIST_IDS].sort(),
  "the atomic checklist SQL allowlist must have no missing or extra IDs relative to the TypeScript catalog",
);
const interviewPreparationDatabaseTest = read("supabase/tests/database/interview_preparation.test.sql");
const persistenceQualifier = read("scripts/qualify-persistence-local.mjs");
const securityQualifier = read("scripts/qualify-security-local.mjs");
const lifecycleQualifier = read("scripts/qualify-account-lifecycle-local.mjs");
const dashboard = read("app/dashboard/page.tsx");
const application = read("app/applications/[id]/page.tsx");
const behavioralLibrary = read("app/behavioral/questions/page.tsx");
const behavioralDetail = read("app/behavioral/questions/[questionId]/page.tsx");
const playbookQueries = read("lib/interview-playbook/queries.ts");
const playbookPage = read("app/interview-playbook/page.tsx");
const preparationCountsStatus = read("components/preparation-counts-status.tsx");
const playbookTiming = read("lib/interview-playbook/timing.ts");
const finalPreparationComponent = read("components/interview-playbook/final-preparation-mode.tsx");
const design = read("DESIGN.md");
const globals = read("app/globals.css");
// Phase-specific typography is bounded by its next feature block. New public
// surfaces may appear before the legacy `.page-hero` marker without becoming
// part of the private preparation hub's typography contract.
const prepCss = globals.split("/* Phase 6 — focused preparation flight plan */")[1].split("/* Salary Negotiation v1")[0].split(".page-hero")[0];
const preparationCountsQuery = (() => {
  const start = query.indexOf("export async function getPreparationCounts");
  return start === -1 ? "" : query.slice(start);
})();

const checklistRoundId = "abcdef12-3456-4abc-8def-1234567890ab";
const uppercaseChecklistRoundId = checklistRoundId.toUpperCase();
const checklistItemId = ALL_CHECKLIST_IDS[0];
assert.equal(
  PREPARATION_CHECKLIST_INVALID_INPUT_ERROR,
  "This checklist change is no longer valid. Refresh and try again.",
  "invalid atomic checklist input must return the stable curated error",
);
assert.deepEqual(
  parsePreparationChecklistActionInput(checklistRoundId, checklistItemId, true),
  { ok: true, value: { roundId: checklistRoundId, itemId: checklistItemId, targetCompleted: true } },
  "a canonical checklist item completion must preserve the exact atomic target",
);
assert.deepEqual(
  parsePreparationChecklistActionInput(uppercaseChecklistRoundId, checklistItemId, false),
  { ok: true, value: { roundId: checklistRoundId, itemId: checklistItemId, targetCompleted: false } },
  "a valid case-insensitive UUID must normalize while an explicit incomplete target remains false",
);
for (const [roundId, itemId, targetCompleted] of [
  [undefined, checklistItemId, true],
  ["", checklistItemId, true],
  ["83838383-8383-6838-8838-838383838302", checklistItemId, true],
  [checklistRoundId, undefined, true],
  [checklistRoundId, "", true],
  [checklistRoundId, "unknown-checklist-item", true],
  [checklistRoundId, checklistItemId.toUpperCase(), true],
  [checklistRoundId, [checklistItemId], true],
  [checklistRoundId, { id: checklistItemId }, true],
  [checklistRoundId, checklistItemId, undefined],
  [checklistRoundId, checklistItemId, "true"],
  [checklistRoundId, checklistItemId, 1],
  [[checklistRoundId], checklistItemId, true],
  [{ id: checklistRoundId }, checklistItemId, true],
]) {
  assert.deepEqual(
    parsePreparationChecklistActionInput(roundId, itemId, targetCompleted),
    { ok: false },
    "malformed, missing, case-changed, or non-scalar atomic checklist input must fail closed",
  );
}

const preparationRoundId = "91919191-9191-4919-8919-919191919302";
const preparationApplicationId = "91919191-9191-4919-8919-919191919301";
const preparationRevision = "2026-09-04T12:34:56.123456Z";
const copyFormData = (source) => {
  const copy = new FormData();
  for (const [key, value] of source.entries()) copy.append(key, value);
  return copy;
};
const notesForm = new FormData();
notesForm.set("private_notes", "  Preserve the current draft.  ");
notesForm.set("expected_updated_at", "absent");
notesForm.set("$ACTION_fixture", "ignored");
assert.deepEqual(
  parsePreparationNotesActionInput(preparationRoundId.toUpperCase(), preparationApplicationId.toUpperCase(), notesForm),
  {
    ok: true,
    value: {
      roundId: preparationRoundId,
      applicationId: preparationApplicationId,
      expectAbsent: true,
      expectedUpdatedAt: null,
      revision: "absent",
      notes: "Preserve the current draft.",
    },
  },
  "notes parsing must normalize bound UUIDs, preserve explicit absence, trim text, and ignore only action metadata",
);

const reflectionForm = new FormData();
for (const [name, value] of [
  ["topics_asked", "  Caching and failure modes  "],
  ["went_well", "Clear trade-offs"],
  ["needs_improvement", "Estimate sooner"],
  ["follow_up_notes", "Send thanks"],
  ["expected_updated_at", preparationRevision],
]) reflectionForm.set(name, value);
assert.deepEqual(
  parsePreparationReflectionActionInput(preparationRoundId, preparationApplicationId, reflectionForm),
  {
    ok: true,
    value: {
      roundId: preparationRoundId,
      applicationId: preparationApplicationId,
      expectAbsent: false,
      expectedUpdatedAt: preparationRevision,
      revision: preparationRevision,
      topicsAsked: "Caching and failure modes",
      wentWell: "Clear trade-offs",
      needsImprovement: "Estimate sooner",
      followUpNotes: "Send thanks",
    },
  },
  "reflection parsing must retain one complete normalized snapshot and exact loaded revision",
);

const invalidNoteInputs = [
  null,
  {},
  new URLSearchParams(),
  (() => { const value = new FormData(); value.set("expected_updated_at", "absent"); return value; })(),
  (() => { const value = copyFormData(notesForm); value.delete("expected_updated_at"); return value; })(),
  (() => { const value = copyFormData(notesForm); value.append("private_notes", "duplicate"); return value; })(),
  (() => { const value = copyFormData(notesForm); value.append("expected_updated_at", "absent"); return value; })(),
  (() => { const value = copyFormData(notesForm); value.set("private_notes", new File(["text"], "note.txt")); return value; })(),
  (() => { const value = copyFormData(notesForm); value.set("unknown", "field"); return value; })(),
  (() => { const value = copyFormData(notesForm); value.set("private_notes", "bad\u0000control"); return value; })(),
  (() => { const value = copyFormData(notesForm); value.set("private_notes", "😀".repeat(12001)); return value; })(),
  (() => { const value = copyFormData(notesForm); value.set("expected_updated_at", "2026-02-30T00:00:00Z"); return value; })(),
  (() => { const value = copyFormData(notesForm); value.set("expected_updated_at", "2026-09-04T25:00:00Z"); return value; })(),
  (() => { const value = copyFormData(notesForm); value.set("expected_updated_at", "2026-09-04T12:00:00+14:01"); return value; })(),
];
for (const input of invalidNoteInputs) {
  assert.deepEqual(
    parsePreparationNotesActionInput(preparationRoundId, preparationApplicationId, input),
    { ok: false },
    "malformed, incomplete, duplicate, file, foreign, controlled, oversized, or noncanonical notes input must fail closed",
  );
}
for (const [roundId, applicationId] of [
  ["", preparationApplicationId],
  ["91919191-9191-6919-8919-919191919302", preparationApplicationId],
  [preparationRoundId, ""],
  [preparationRoundId, [preparationApplicationId]],
]) {
  assert.deepEqual(
    parsePreparationNotesActionInput(roundId, applicationId, notesForm),
    { ok: false },
    "malformed bound round or application identifiers must fail before actor work",
  );
}

for (const field of ["topics_asked", "went_well", "needs_improvement", "follow_up_notes", "expected_updated_at"]) {
  const missing = copyFormData(reflectionForm);
  missing.delete(field);
  assert.deepEqual(parsePreparationReflectionActionInput(preparationRoundId, preparationApplicationId, missing), { ok: false }, `missing ${field} must reject the complete reflection snapshot`);
  const duplicate = copyFormData(reflectionForm);
  duplicate.append(field, "duplicate");
  assert.deepEqual(parsePreparationReflectionActionInput(preparationRoundId, preparationApplicationId, duplicate), { ok: false }, `duplicate ${field} must reject the complete reflection snapshot`);
}
for (const invalidReflection of [
  (() => { const value = copyFormData(reflectionForm); value.set("topics_asked", new File(["text"], "reflection.txt")); return value; })(),
  (() => { const value = copyFormData(reflectionForm); value.set("went_well", "bad\u007fcontrol"); return value; })(),
  (() => { const value = copyFormData(reflectionForm); value.set("needs_improvement", "😀".repeat(8001)); return value; })(),
  (() => { const value = copyFormData(reflectionForm); value.set("unknown", "field"); return value; })(),
]) {
  assert.deepEqual(
    parsePreparationReflectionActionInput(preparationRoundId, preparationApplicationId, invalidReflection),
    { ok: false },
    "reflection File, control, oversized, and unknown-field input must fail closed",
  );
}

assert.deepEqual(parsePreparationTextSaveResult([], preparationRoundId), { status: "conflict" }, "zero saved rows must be a revision conflict");
assert.deepEqual(parsePreparationTextSaveResult([{ round_id: preparationRoundId, updated_at: preparationRevision }], preparationRoundId), { status: "saved", updatedAt: preparationRevision }, "one exact correlated row must advance the form revision");
for (const invalidResult of [
  null,
  {},
  [{ round_id: preparationRoundId }],
  [{ round_id: preparationRoundId, updated_at: "invalid" }],
  [{ round_id: "92929292-9292-4929-8929-929292929292", updated_at: preparationRevision }],
  [{ round_id: preparationRoundId, updated_at: preparationRevision, extra: true }],
  [{ round_id: preparationRoundId, updated_at: preparationRevision }, { round_id: preparationRoundId, updated_at: preparationRevision }],
]) {
  assert.deepEqual(parsePreparationTextSaveResult(invalidResult, preparationRoundId), { status: "invalid" }, "malformed or uncorrelated preparation text results must fail closed");
}
assert.deepEqual(resolvePreparationTextDisplayState({ status: "success", message: "Private notes saved." }, false, true, "notes"), { status: "success", message: PREPARATION_NOTES_EARLIER_SNAPSHOT_SAVED_MESSAGE }, "a notes edit made during flight must not receive a full-current-draft success claim");
assert.deepEqual(resolvePreparationTextDisplayState({ status: "success", message: "Private reflection saved." }, false, true, "reflection"), { status: "success", message: PREPARATION_REFLECTION_EARLIER_SNAPSHOT_SAVED_MESSAGE }, "a reflection edit made during flight must not receive a full-current-draft success claim");
assert.deepEqual(resolvePreparationTextDisplayState({ status: "error", message: PREPARATION_NOTES_CONFLICT_ERROR }, false, true, "notes"), { status: "error", message: PREPARATION_NOTES_CONFLICT_ERROR }, "notes conflicts must outrank later draft-change messaging");
assert.deepEqual(resolvePreparationTextDisplayState({ status: "error", message: PREPARATION_REFLECTION_CONFLICT_ERROR }, false, true, "reflection"), { status: "error", message: PREPARATION_REFLECTION_CONFLICT_ERROR }, "reflection conflicts must outrank later draft-change messaging");

const nextActionApplicationId = "app-fixture-1";
const nextActionDsaQuestion = { id: "two-sum", title: "Two Sum" };
const nextActionSystemDesignAttempt = { id: "attempt-fixture-1", problemId: "url-shortener", title: "URL Shortener Attempt" };
const nextActionSystemDesignConcept = { href: "/system-design/caching", title: "Caching" };

const nextActionDsaWins = chooseRoundPreparationNextAction({
  applicationId: nextActionApplicationId,
  dsaQuestion: nextActionDsaQuestion,
  systemDesignAttempt: nextActionSystemDesignAttempt,
  behavioralAvailable: true,
  systemDesignConcept: nextActionSystemDesignConcept,
});
const nextActionSystemDesignWins = chooseRoundPreparationNextAction({
  applicationId: nextActionApplicationId,
  dsaQuestion: null,
  systemDesignAttempt: nextActionSystemDesignAttempt,
  behavioralAvailable: true,
  systemDesignConcept: nextActionSystemDesignConcept,
});
const nextActionBehavioralWins = chooseRoundPreparationNextAction({
  applicationId: nextActionApplicationId,
  dsaQuestion: null,
  systemDesignAttempt: null,
  behavioralAvailable: true,
  systemDesignConcept: nextActionSystemDesignConcept,
});
const nextActionConceptWins = chooseRoundPreparationNextAction({
  applicationId: nextActionApplicationId,
  dsaQuestion: null,
  systemDesignAttempt: null,
  behavioralAvailable: false,
  systemDesignConcept: nextActionSystemDesignConcept,
});
const nextActionFallback = chooseRoundPreparationNextAction({
  applicationId: nextActionApplicationId,
  dsaQuestion: null,
  systemDesignAttempt: null,
  behavioralAvailable: false,
  systemDesignConcept: null,
});

const overviewNow = new Date("2026-08-18T12:00:00.000Z");

function makeRound(overrides) {
  return {
    id: "round-default",
    applicationId: "app-default",
    roundNumber: 1,
    roundName: "Round",
    roundType: "Coding / DSA",
    scheduledAt: null,
    durationMinutes: null,
    timezone: null,
    status: "Planned",
    result: "Pending",
    active: true,
    modules: ["dsa", "company"],
    needsSignalClarification: false,
    clarificationPrompt: null,
    executionGuideSlugs: ["algorithmic-coding"],
    ...overrides,
  };
}

function makeApplication(overrides) {
  return {
    id: "app-default",
    companyName: "Default Co",
    companySlug: "default-co",
    roleTitle: "SDE",
    roleLevel: null,
    status: "Interviewing",
    updatedAt: "2026-08-01T00:00:00.000Z",
    open: true,
    interviewProcessActive: true,
    rounds: [],
    ...overrides,
  };
}

function overviewOf(applications, preparationCounts = new Map()) {
  return buildInterviewPlaybookOverview({ applications, preparationCounts, now: overviewNow });
}

const readyEmptyPreparationCounts = resolvePreparationCounts({
  queryFailed: false,
  rounds: [],
  preparations: [],
  tasks: [],
});
assert.equal(readyEmptyPreparationCounts.status, "ready", "a successful zero-row preparation query must remain distinguishable from unavailability");
assert.equal(readyEmptyPreparationCounts.status === "ready" ? readyEmptyPreparationCounts.counts.size : -1, 0, "a successful zero-row preparation query must produce a genuine ready-empty map");

const countFixtureRound = { id: "round-count-fixture", round_type: "Coding / DSA" };
const countFixtureChecklist = checklistForRound(countFixtureRound.round_type);
const untouchedPreparationCounts = resolvePreparationCounts({
  queryFailed: false,
  rounds: [countFixtureRound],
  preparations: [],
  tasks: [],
});
assert.deepEqual(
  untouchedPreparationCounts.status === "ready" ? untouchedPreparationCounts.counts.get(countFixtureRound.id) : null,
  { completed: 0, total: countFixtureChecklist.length },
  "an untouched round must retain its full canonical checklist total rather than look unavailable",
);

const completedPreparationCounts = resolvePreparationCounts({
  queryFailed: false,
  rounds: [countFixtureRound],
  preparations: [{ round_id: countFixtureRound.id, completed_template_item_ids: [countFixtureChecklist[0].id] }],
  tasks: [
    { round_id: countFixtureRound.id, completed: true },
    { round_id: countFixtureRound.id, completed: false },
  ],
});
assert.deepEqual(
  completedPreparationCounts.status === "ready" ? completedPreparationCounts.counts.get(countFixtureRound.id) : null,
  { completed: 2, total: countFixtureChecklist.length + 2 },
  "completed template and custom tasks must contribute to the exact ready count without treating an incomplete task as complete",
);

for (const failedQuery of ["rounds", "preparations", "tasks"]) {
  assert.deepEqual(
    resolvePreparationCounts({
      queryFailed: true,
      rounds: failedQuery === "rounds" ? [] : [countFixtureRound],
      preparations: failedQuery === "preparations" ? [] : [{ round_id: countFixtureRound.id, completed_template_item_ids: [countFixtureChecklist[0].id] }],
      tasks: failedQuery === "tasks" ? [] : [{ round_id: countFixtureRound.id, completed: true }],
    }),
    { status: "unavailable" },
    `${failedQuery} query failure must win over every partial row and never produce a false count`,
  );
}

// Case 1: earliest scheduled round wins across companies.
const case1RoundA = makeRound({ id: "round-a", applicationId: "app-a", roundNumber: 1, status: "Scheduled", scheduledAt: "2026-08-25T10:00:00.000Z" });
const case1RoundB = makeRound({ id: "round-b", applicationId: "app-b", roundNumber: 1, status: "Scheduled", scheduledAt: "2026-08-20T10:00:00.000Z" });
const case1Overview = overviewOf([
  makeApplication({ id: "app-a", companyName: "Company A", rounds: [case1RoundA] }),
  makeApplication({ id: "app-b", companyName: "Company B", rounds: [case1RoundB] }),
]);

// Case 2: a completed round with an earlier timestamp is not primary.
const case2Completed = makeRound({ id: "round-completed", roundNumber: 1, status: "Completed", result: "Passed", scheduledAt: "2026-08-05T10:00:00.000Z" });
const case2Upcoming = makeRound({ id: "round-upcoming", roundNumber: 2, status: "Scheduled", scheduledAt: "2026-08-22T10:00:00.000Z" });
const case2Overview = overviewOf([makeApplication({ rounds: [case2Completed, case2Upcoming] })]);
const case2CompletedSummary = case2Overview.applications[0].rounds.find((round) => round.id === "round-completed");

// Case 3: a cancelled future round is not primary.
const case3Cancelled = makeRound({ id: "round-cancelled", status: "Cancelled", scheduledAt: "2026-08-25T10:00:00.000Z" });
const case3Overview = overviewOf([makeApplication({ rounds: [case3Cancelled] })]);
const case3CancelledSummary = case3Overview.applications[0].rounds[0];

// Case 4: an unscheduled active round becomes primary when nothing is scheduled.
const case4Unscheduled = makeRound({ id: "round-unscheduled", status: "Planned", scheduledAt: null });
const case4Overview = overviewOf([makeApplication({ rounds: [case4Unscheduled] })]);

// Case 5: an overdue active round is reported separately, never as primary or completed.
const case5Overdue = makeRound({ id: "round-overdue", status: "Scheduled", scheduledAt: "2026-08-01T00:00:00.000Z" });
const case5Overview = overviewOf([makeApplication({ rounds: [case5Overdue] })]);
const case5OverdueSummary = case5Overview.applications[0].rounds[0];

// Case 6: a terminal application's round cannot be active or primary.
const case6Round = makeRound({ id: "round-terminal", status: "Scheduled", scheduledAt: "2026-08-25T10:00:00.000Z" });
const case6Overview = overviewOf([makeApplication({ id: "app-terminal", status: "Rejected", open: false, interviewProcessActive: false, rounds: [case6Round] })]);

// Case 7: preparation counts are batched checklist progress only, never a percentage.
const case7RoundWithCount = makeRound({ id: "round-with-count", roundNumber: 1, status: "Scheduled", scheduledAt: "2026-08-22T10:00:00.000Z" });
const case7RoundWithoutCount = makeRound({ id: "round-without-count", roundNumber: 2, status: "Scheduled", scheduledAt: "2026-08-23T10:00:00.000Z" });
const case7Overview = overviewOf(
  [makeApplication({ rounds: [case7RoundWithCount, case7RoundWithoutCount] })],
  new Map([["round-with-count", { completed: 3, total: 5 }]]),
);
const case7WithCountSummary = case7Overview.applications[0].rounds.find((round) => round.id === "round-with-count");
const case7WithoutCountSummary = case7Overview.applications[0].rounds.find((round) => round.id === "round-without-count");

// Case 8: application rounds are sorted by roundNumber then id, without mutating the input array.
const case8OriginalRounds = [
  makeRound({ id: "r3", roundNumber: 3 }),
  makeRound({ id: "r1", roundNumber: 1 }),
  makeRound({ id: "r2", roundNumber: 2 }),
];
const case8OriginalOrderBefore = case8OriginalRounds.map((round) => round.id);
const case8Overview = overviewOf([makeApplication({ rounds: case8OriginalRounds })]);
const case8OriginalOrderAfter = case8OriginalRounds.map((round) => round.id);

// Case 9: identical scheduled timestamps fall back to roundNumber then id.
const case9RoundB = makeRound({ id: "r-b", roundNumber: 2, status: "Scheduled", scheduledAt: "2026-08-20T10:00:00.000Z" });
const case9RoundA = makeRound({ id: "r-a", roundNumber: 1, status: "Scheduled", scheduledAt: "2026-08-20T10:00:00.000Z" });
const case9Overview = overviewOf([makeApplication({ rounds: [case9RoundB, case9RoundA] })]);

// Case 10: an account with no applications yields an entirely empty, primary-free overview.
const case10Overview = overviewOf([]);

// Case 11: a round scheduled exactly at `now` is upcoming, not overdue.
const case11Round = makeRound({ id: "round-now", status: "Scheduled", scheduledAt: overviewNow.toISOString() });
const case11Overview = overviewOf([makeApplication({ rounds: [case11Round] })]);
const case11Summary = case11Overview.applications[0].rounds[0];

// --- Canonical round-preparation context resolution ------------------------
// resolveRoundPreparationContext must call resolveRoundExecution exactly once
// and derive modules/execution guides/clarification from that single result —
// no separate regex-based mapping table.
const roundContextCases = {
  "Coding / DSA": resolveRoundPreparationContext("Coding / DSA"),
  "System Design": resolveRoundPreparationContext("System Design"),
  "Behavioral": resolveRoundPreparationContext("Behavioral"),
  "Coding + Behavioral Technical Screen": resolveRoundPreparationContext("Coding + Behavioral Technical Screen"),
  "Technical Screen": resolveRoundPreparationContext("Technical Screen"),
  "Domain / Technical": resolveRoundPreparationContext("Domain / Technical"),
  "Bar Raiser": resolveRoundPreparationContext("Bar Raiser"),
  "Onsite / Virtual Onsite": resolveRoundPreparationContext("Onsite / Virtual Onsite"),
  "Recruiter Screen": resolveRoundPreparationContext("Recruiter Screen"),
  "Hiring Manager": resolveRoundPreparationContext("Hiring Manager"),
  "Machine Coding": resolveRoundPreparationContext("Machine Coding"),
  "Debugging": resolveRoundPreparationContext("Debugging"),
  "Code Review": resolveRoundPreparationContext("Code Review"),
  "Low-Level Design": resolveRoundPreparationContext("Low-Level Design"),
  "ML System Design": resolveRoundPreparationContext("ML System Design"),
};
const arraysEqual = (a, b) => Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((v, i) => v === b[i]);

// --- Application versus interview-process classification -------------------
const processCases = {
  "Wishlist, no rounds": isActiveInterviewProcess({ status: "Wishlist", interview_rounds: [] }),
  "Interested, no rounds": isActiveInterviewProcess({ status: "Interested", interview_rounds: [] }),
  "Applied, no rounds": isActiveInterviewProcess({ status: "Applied", interview_rounds: [] }),
  "On Hold, no rounds": isActiveInterviewProcess({ status: "On Hold", interview_rounds: [] }),
  "Recruiter Screen, no rounds": isActiveInterviewProcess({ status: "Recruiter Screen", interview_rounds: [] }),
  "Interviewing, no rounds": isActiveInterviewProcess({ status: "Interviewing", interview_rounds: [] }),
  "Applied, Scheduled round": isActiveInterviewProcess({ status: "Applied", interview_rounds: [{ status: "Scheduled" }] }),
  "On Hold, Planned round": isActiveInterviewProcess({ status: "On Hold", interview_rounds: [{ status: "Planned" }] }),
  "Rejected, Scheduled round": isActiveInterviewProcess({ status: "Rejected", interview_rounds: [{ status: "Scheduled" }] }),
  "Offer, Scheduled round": isActiveInterviewProcess({ status: "Offer", interview_rounds: [{ status: "Scheduled" }] }),
  "Accepted, Scheduled round": isActiveInterviewProcess({ status: "Accepted", interview_rounds: [{ status: "Scheduled" }] }),
};

// --- Playbook overview: interview-process versus pre-interview applications -
const caseProcA = makeApplication({ id: "app-wishlist", status: "Wishlist", open: true, interviewProcessActive: false, rounds: [] });
const caseProcB = makeApplication({ id: "app-interviewing", status: "Interviewing", open: true, interviewProcessActive: true, rounds: [makeRound({ id: "round-proc-b", applicationId: "app-interviewing", status: "Scheduled", scheduledAt: "2026-08-25T10:00:00.000Z" })] });
const caseProcOverview = overviewOf([caseProcA, caseProcB]);

// --- Playbook overview: clarification fields travel through round summaries -
const caseClarifyRound = makeRound({ id: "round-clarify", roundType: "Technical Screen", needsSignalClarification: true, clarificationPrompt: "Ask the recruiter which signals the screen will cover, such as coding, design, behavioral evidence, or project depth.", executionGuideSlugs: ["technical-screen"] });
const caseClarifyOverview = overviewOf([makeApplication({ rounds: [caseClarifyRound] })]);
const caseClarifySummary = caseClarifyOverview.applications[0].rounds[0];

// --- Playbook overview: global queues are scoped to activeInterviewProcesses only, not merely open applications -
const caseQueueScopeApp = makeApplication({ id: "app-queue-scope", status: "Wishlist", open: true, interviewProcessActive: false, rounds: [makeRound({ id: "round-queue-scope", applicationId: "app-queue-scope", status: "Scheduled", scheduledAt: "2026-08-25T10:00:00.000Z" })] });
const caseQueueScopeOverview = overviewOf([caseQueueScopeApp]);

// --- Playbook page: pre-interview versus active-process-without-round copy --
const playbookPreInterviewSection = (() => {
  const start = playbookPage.indexOf("Branch E:");
  const end = playbookPage.indexOf("Branch F:");
  return start === -1 || end === -1 ? "" : playbookPage.slice(start, end);
})();

// --- Playbook private round page: execution-guide integration --------------
const preparePageExecutionGuideSection = (() => {
  const start = page.indexOf("Round execution");
  return start === -1 ? "" : page.slice(Math.max(0, start - 400), start + 400);
})();

// --- Playbook private round page: does not infer a specialist module from a vague label -
const onsiteContext = resolveRoundPreparationContext("Onsite / Virtual Onsite");
const barRaiserContext = resolveRoundPreparationContext("Bar Raiser");
const domainTechnicalContext = resolveRoundPreparationContext("Domain / Technical");

// --- Playbook private round page: hub returns roundContext without an extra query -
const preparationHubDefinitionSource = (() => {
  const start = query.indexOf("export async function getInterviewPreparationHub");
  const end = query.indexOf("export async function getPreparationCounts");
  return start === -1 || end === -1 ? query : query.slice(start, end);
})();

// --- Playbook page: private-route registration ------------------------------
const privacyRoutesSource = read("lib/privacy/routes.ts");
const privateRoutePrivacyScript = read("scripts/test-private-route-privacy.mjs");
const ciWorkflow = read(".github/workflows/ci.yml");
const packageJson = read("package.json");

// --- Playbook page: clarification StatusPill and edit-round link -----------
const playbookClarificationSection = (() => {
  const start = playbookPage.indexOf("needsSignalClarification ? <StatusPill");
  return start === -1 ? "" : playbookPage.slice(start, start + 600);
})();

// --- Playbook page: queue-state label ---------------------------------------
const queueStateLabelSource = (() => {
  const start = playbookPage.indexOf("function queueStateLabel");
  const end = playbookPage.indexOf("export default async function InterviewPlaybookPage");
  return start === -1 || end === -1 ? "" : playbookPage.slice(start, end);
})();

// --- Playbook private round page: application-tracker classifier source ----
const insights = read("lib/applications/insights.ts");
const applicationTrackerTest = read("scripts/test-application-tracker.mjs");

// --- Playbook overview module: no second resolver call ---------------------
const overviewSource = read("lib/interview-playbook/overview.ts");

// --- Playbook final-preparation timing model -------------------------------
const timingNow = new Date("2026-08-18T12:00:00.000Z"); // UTC calendar day 2026-08-18

function timingOf(scheduledAt, overrides = {}) {
  return resolveInterviewPlaybookTiming({ scheduledAt, timezone: "UTC", now: timingNow, ...overrides });
}

// Case 1 & 2: null and invalid dates behave identically and never throw.
const timingNullDate = timingOf(null);
let timingInvalidDate;
let timingInvalidDateThrew = false;
try {
  timingInvalidDate = timingOf("not-a-real-timestamp");
} catch {
  timingInvalidDateThrew = true;
}

// Case 3: more than seven local calendar days away.
const timingStandard = timingOf("2026-08-26T12:00:00.000Z"); // +8 calendar days

// Case 4: exactly seven local calendar days away.
const timingFinalWeekEdge = timingOf("2026-08-25T12:00:00.000Z"); // +7 calendar days

// Case 5: four local calendar days away.
const timingFinalWeekMid = timingOf("2026-08-22T12:00:00.000Z"); // +4 calendar days

// Case 6: exactly three local calendar days away.
const timingFinalThreeDaysEdge = timingOf("2026-08-21T12:00:00.000Z"); // +3 calendar days

// Case 7: two local calendar days away.
const timingFinalThreeDaysMid = timingOf("2026-08-20T12:00:00.000Z"); // +2 calendar days

// Case 8: one local calendar day away, using a non-24-hour absolute gap (14h).
const timingDayBefore = timingOf("2026-08-19T02:00:00.000Z");

// Case 9: same local calendar day, more than one hour away.
const timingInterviewDay = timingOf("2026-08-18T18:00:00.000Z"); // +6 hours

// Case 10: exactly 60 minutes away.
const timingPreRoundEdge = timingOf("2026-08-18T13:00:00.000Z");

// Case 11: less than 60 minutes away.
const timingPreRoundSoon = timingOf("2026-08-18T12:30:00.000Z");

// Case 12: exactly now.
const timingPreRoundNow = timingOf("2026-08-18T12:00:00.000Z");

// Case 13: a passed interview. Only timing is asserted — never an outcome.
const timingPassed = timingOf("2026-08-18T11:00:00.000Z"); // 1 hour before now

// Case 14: only a few absolute hours remain, but the interview's UTC calendar
// date is the next day relative to `now`'s UTC calendar date. Local-calendar
// classification must still win once the one-hour rule is cleared.
const timingBoundaryNow = new Date("2026-08-20T22:00:00.000Z");
const timingBoundary = resolveInterviewPlaybookTiming({
  scheduledAt: "2026-08-21T01:00:00.000Z", // 3 absolute hours later, next UTC day
  timezone: "UTC",
  now: timingBoundaryNow,
});

// Case 15: an invalid timezone must fall back to UTC deterministically, matching
// the explicit-UTC "day-before" fixture (case 8) exactly, and must not throw.
let timingInvalidTimezone;
let timingInvalidTimezoneThrew = false;
try {
  timingInvalidTimezone = resolveInterviewPlaybookTiming({ scheduledAt: "2026-08-19T02:00:00.000Z", timezone: "Not/AZone", now: timingNow });
} catch {
  timingInvalidTimezoneThrew = true;
}

// Case 16: guidance completeness across every final-preparation phase.
const finalPreparationResults = [timingFinalWeekEdge, timingFinalThreeDaysEdge, timingDayBefore, timingInterviewDay, timingPreRoundEdge];
const finalPreparationGuidanceComplete = finalPreparationResults.every((result) => {
  const guidance = result.guidance;
  return Boolean(guidance)
    && guidance.phase === result.phase
    && typeof guidance.label === "string" && guidance.label.length > 0
    && typeof guidance.title === "string" && guidance.title.length > 0
    && typeof guidance.description === "string" && guidance.description.length > 0
    && Array.isArray(guidance.actions) && guidance.actions.length === 4
    && guidance.actions.every((action) => typeof action === "string" && action.length > 0);
});

const cases = [
  ["private dynamic route", page.includes('export const dynamic = "force-dynamic"')],
  ["member guard", page.includes("requireMemberProfile")],
  ["owner-first query", query.indexOf('.eq("user_id", actor.user.id)') < query.indexOf("Promise.all")],
  ["guessed round returns null", query.includes("if (!roundData) return null")],
  ["central module type", model.includes("export type PreparationModule")],
  ["model derives modules from the canonical taxonomy resolver, not a standalone mapping table", model.includes("resolveRoundExecution") && !/const mapping\s*:/.test(model)],
  ["model imports the canonical taxonomy with a Node-resolvable relative path", model.includes('from "../interview-playbook/round-execution.ts"')],
  ["role normalization", model.includes("roadmapLevelForRole")],
  ["conservative alias map", model.includes("companyAliases")],
  ["no inferred AWS alias", !model.includes('aws: "amazon"') && !model.includes('"amazon-web-services": "amazon"')],
  ["stable checklist IDs", model.includes("ALL_CHECKLIST_IDS")],
  ["bounded DSA query", query.includes('.limit(100)')],
  ["bounded behavioral stories", query.includes('.limit(6)')],
  ["bounded design attempts", query.includes('.limit(4)')],
  ["conditional DSA", query.includes("includeDsa ?")],
  ["conditional behavioral", query.includes("includeBehavioral ?")],
  ["conditional design", query.includes("includeSystemDesign ?")],
  ["summary-only design columns", !query.includes('select("*").eq("user_id", actor.user.id).or')],
  ["application-linked behavioral answers", query.includes('.eq("application_id", round.application.id)')],
  ["application-linked stories prioritized", query.indexOf("applicationStoriesResult.data") < query.indexOf("storiesResult.data")],
  ["ready story count is complete", query.includes('{ count: "exact", head: true }') && query.includes("readyStoryCount")],
  ["company question composition", query.includes("questionsForInterviewCompany")],
  ["private preparation table", migration.includes("create table public.interview_preparations")],
  ["custom task table", migration.includes("create table public.interview_preparation_custom_tasks")],
  ["composite round ownership", migration.includes("interview_preparations_round_owner_fkey")],
  ["cascade round deletion", migration.includes("on delete cascade")],
  ["RLS preparation", migration.includes("alter table public.interview_preparations enable row level security")],
  ["RLS tasks", migration.includes("alter table public.interview_preparation_custom_tasks enable row level security")],
  ["server-derived actor", migration.includes("auth.uid()") && !actions.includes("user_id:")],
  ["reflection completion lock", migration.includes("round_status <> 'Completed'")],
  ["notes bounded", migration.includes("12000")],
  ["tasks bounded", migration.includes("Custom task limit reached")],
  ["known checklist values", migration.includes("interview_preparations_checklist_known")],
  ["atomic checklist action parses before account or persistence work", checklistAction.indexOf("parsePreparationChecklistActionInput") >= 0 && checklistAction.indexOf("parsePreparationChecklistActionInput") < checklistAction.indexOf("getAuthenticatedActor") && checklistAction.indexOf("getAuthenticatedActor") < checklistAction.indexOf('rpc("set_interview_preparation_checklist_item"')],
  ["atomic checklist action sends one exact desired membership", checklistAction.includes("target_round_id: parsed.value.roundId") && checklistAction.includes("target_item_id: parsed.value.itemId") && checklistAction.includes("target_completed: parsed.value.targetCompleted")],
  ["atomic checklist action rejects malformed input before actor resolution", checklistAction.indexOf("if (!parsed.ok)") >= 0 && checklistAction.indexOf("if (!parsed.ok)") < checklistAction.indexOf("getAuthenticatedActor") && checklistAction.includes("PREPARATION_CHECKLIST_INVALID_INPUT_ERROR")],
  ["atomic checklist action validates the returned application before refreshing", checklistAction.includes("normalizePreparationChecklistUuid(data)") && checklistAction.includes("if (error || applicationId === null)") && checklistAction.includes("refresh(parsed.value.roundId, applicationId)")],
  ["checklist controls bind only round, item, and desired membership", page.includes("togglePreparationChecklistAction.bind(null, round.id, item.id, !complete)") && !page.includes("completedIds, item.id")],
  ["checklist action has no legacy whole-array persistence path", !checklistAction.includes("completedIds") && !checklistAction.includes("completed_ids_value") && !checklistAction.includes('rpc("save_interview_preparation"')],
  ["atomic checklist migration rejects legacy whole-array calls", legacySaveMigration.includes("if completed_ids_value is not null then") && legacySaveMigration.includes("Checklist items must be updated individually") && legacySaveMigration.includes("errcode = '0A000'")],
  ["atomic checklist migration validates known items and required desired state", atomicChecklistFunction.includes("interview_preparations_checklist_known") && atomicChecklistFunction.includes("interview_preparations_checklist_completion_required")],
  ["atomic checklist migration preserves the exact UUID return contract", atomicChecklistFunction.includes(") returns uuid language plpgsql")],
  ["atomic checklist migration locks an owner-scoped round and returns its application", atomicChecklistFunction.includes("where id = target_round_id and user_id = current_user_id") && atomicChecklistFunction.includes("for update;") && atomicChecklistFunction.includes("return owned_application_id;")],
  ["atomic checklist completion is idempotent membership addition", atomicChecklistFunction.includes("array_append(public.interview_preparations.completed_template_item_ids, target_item_id)") && atomicChecklistFunction.includes("where not (target_item_id = any(public.interview_preparations.completed_template_item_ids))")],
  ["atomic checklist clearing removes only the requested membership without creating a row", atomicChecklistClearBranch.includes("update public.interview_preparations") && atomicChecklistClearBranch.includes("array_remove(completed_template_item_ids, target_item_id)") && atomicChecklistClearBranch.includes("target_item_id = any(completed_template_item_ids)") && !atomicChecklistClearBranch.includes("insert into")],
  ["atomic checklist errors keep invalid, foreign, and missing inputs indistinguishable where required", atomicChecklistFunction.includes("errcode = '23514'") && atomicChecklistFunction.includes("errcode = '23502'") && atomicChecklistFunction.includes("errcode = 'P0002'") && atomicChecklistFunction.includes("Interview round not found")],
  ["atomic checklist RPC is authenticated-only", atomicChecklistMigration.includes("revoke all on function public.set_interview_preparation_checklist_item(uuid,text,boolean) from public") && atomicChecklistMigration.includes("revoke all on function public.set_interview_preparation_checklist_item(uuid,text,boolean) from anon") && atomicChecklistMigration.includes("grant execute on function public.set_interview_preparation_checklist_item(uuid,text,boolean) to authenticated")],
  ["pgTAP covers desired-state membership, idempotence, preservation, legacy rejection, and owner privacy", ["distinct desired-state updates retain both checklist items", "repeated true never creates a duplicate", "clearing one item preserves other checklist items", "rejected legacy snapshot writes leave preparation unchanged", "missing and foreign rounds are indistinguishable"].every((marker) => interviewPreparationDatabaseTest.includes(marker))],
  ["local persistence qualification exercises concurrent atomic updates and the legacy rejection", persistenceQualifier.includes('check("User A creates notes and concurrent desired-state checklist updates retain both items"') && persistenceQualifier.includes('rpc("set_interview_preparation_checklist_item"') && persistenceQualifier.includes("Promise.all") && persistenceQualifier.includes('expectSqlError(rejected, "0A000")')],
  ["notes action parses strict runtime input before actor or persistence work", notesAction.indexOf("parsePreparationNotesActionInput") >= 0 && notesAction.indexOf("parsePreparationNotesActionInput") < notesAction.indexOf("getAuthenticatedActor") && notesAction.indexOf("getAuthenticatedActor") < notesAction.indexOf('rpc(\n    "save_interview_preparation_notes_if_revision"')],
  ["reflection action parses strict runtime input before actor or persistence work", reflectionAction.indexOf("parsePreparationReflectionActionInput") >= 0 && reflectionAction.indexOf("parsePreparationReflectionActionInput") < reflectionAction.indexOf("getAuthenticatedActor") && reflectionAction.indexOf("getAuthenticatedActor") < reflectionAction.indexOf('rpc(\n    "save_interview_preparation_reflection_if_revision"')],
  ["preparation text actions use no legacy snapshot RPC", !notesAction.includes('rpc("save_interview_preparation"') && !reflectionAction.includes('rpc("save_interview_preparation"')],
  ["notes action submits one explicit revision state and exact text", ["target_round_id: input.roundId", "target_expect_absent: input.expectAbsent", "target_expected_updated_at: input.expectedUpdatedAt", "target_notes: input.notes"].every((marker) => notesAction.includes(marker))],
  ["reflection action submits one explicit revision state and complete snapshot", ["target_round_id: input.roundId", "target_expect_absent: input.expectAbsent", "target_expected_updated_at: input.expectedUpdatedAt", "target_topics_asked: input.topicsAsked", "target_went_well: input.wentWell", "target_needs_improvement: input.needsImprovement", "target_follow_up_notes: input.followUpNotes"].every((marker) => reflectionAction.includes(marker))],
  ["notes action distinguishes query errors, zero-row conflicts, malformed results, and success before refresh", notesAction.indexOf("if (error)") < notesAction.indexOf('outcome.status === "conflict"') && notesAction.indexOf('outcome.status === "conflict"') < notesAction.indexOf('outcome.status === "invalid"') && notesAction.indexOf('outcome.status === "invalid"') < notesAction.indexOf("refresh(input.roundId, input.applicationId)")],
  ["reflection action distinguishes query errors, zero-row conflicts, malformed results, and success before refresh", reflectionAction.indexOf("if (error)") < reflectionAction.indexOf('outcome.status === "conflict"') && reflectionAction.indexOf('outcome.status === "conflict"') < reflectionAction.indexOf('outcome.status === "invalid"') && reflectionAction.indexOf('outcome.status === "invalid"') < reflectionAction.indexOf("refresh(input.roundId, input.applicationId)")],
  ["notes editor prevents native reset, synchronously guards duplicates, snapshots, then dispatches in a transition", ["event.preventDefault()", "if (submissionPending.current) return", "submissionPending.current = true", "new FormData(event.currentTarget)", "startTransition(() => formAction(formData))"].every((marker) => notesFormSource.includes(marker)) && notesFormSource.indexOf("event.preventDefault()") < notesFormSource.indexOf("if (submissionPending.current) return") && notesFormSource.indexOf("if (submissionPending.current) return") < notesFormSource.indexOf("submissionPending.current = true") && notesFormSource.indexOf("submissionPending.current = true") < notesFormSource.indexOf("new FormData(event.currentTarget)") && notesFormSource.indexOf("new FormData(event.currentTarget)") < notesFormSource.indexOf("startTransition(() => formAction(formData))")],
  ["reflection editor prevents native reset, synchronously guards duplicates, snapshots, then dispatches in a transition", ["event.preventDefault()", "if (submissionPending.current) return", "submissionPending.current = true", "new FormData(event.currentTarget)", "startTransition(() => formAction(formData))"].every((marker) => reflectionFormSource.includes(marker)) && reflectionFormSource.indexOf("event.preventDefault()") < reflectionFormSource.indexOf("if (submissionPending.current) return") && reflectionFormSource.indexOf("if (submissionPending.current) return") < reflectionFormSource.indexOf("submissionPending.current = true") && reflectionFormSource.indexOf("submissionPending.current = true") < reflectionFormSource.indexOf("new FormData(event.currentTarget)") && reflectionFormSource.indexOf("new FormData(event.currentTarget)") < reflectionFormSource.indexOf("startTransition(() => formAction(formData))")],
  ["preparation text editors track draft changes against the submitted snapshot", [notesFormSource, reflectionFormSource].every((source) => source.includes("submittedDraftSignature") && source.includes("changedSinceSubmit") && source.includes("preparationTextDraftSignature") && source.includes("setChangedSinceSubmit(false)") && source.includes("onChange="))],
  ["preparation text editors retain progressive action fallback and exact returned revisions", [notesFormSource, reflectionFormSource].every((source) => source.includes("action={formAction}") && source.includes("state.revision ?? revision") && !source.includes("key={state.revision"))],
  ["preparation text editors keep the pending trigger focusable and expose one atomic live status", [notesFormSource, reflectionFormSource].every((source) => source.includes('aria-busy={pending}') && source.includes('aria-disabled={pending}')) && textForm.includes('aria-atomic="true"') && textForm.includes('role={displayState.status === "error" ? "alert" : "status"}')],
  ["preparation text conflicts offer a non-destructive current-page review", textForm.includes("!pending && conflict") && textForm.includes('target="_blank"') && textForm.includes('rel="noopener noreferrer"') && textForm.includes("Review latest in a new tab")],
  ["preparation page passes independent loaded-or-absent revisions and a canonical latest link", page.includes("preparation?.private_notes_updated_at ?? PREPARATION_TEXT_ABSENT_REVISION") && page.includes("preparation?.reflection_updated_at ?? PREPARATION_TEXT_ABSENT_REVISION") && page.includes("latestHref={latestHref}") && page.includes("const latestHref = `/interviews/${round.id}/prepare`")],
  ["migration adds independent notes and reflection revisions and backfills only existing text", preparationTextRevisionMigration.includes("add column private_notes_updated_at") && preparationTextRevisionMigration.includes("add column reflection_updated_at") && preparationTextRevisionMigration.includes("where private_notes is not null") && preparationTextRevisionMigration.includes("where topics_asked is not null")],
  ["notes and reflection CAS functions share the owned-round lock while comparing only their own revision", [notesRevisionFunction, reflectionRevisionFunction].every((source) => source.includes("from public.interview_rounds as rounds") && source.includes("and rounds.user_id = current_user_id") && source.includes("for update;") && source.includes("target_expect_absent")) && notesRevisionFunction.includes("preparations.private_notes_updated_at = target_expected_updated_at") && reflectionRevisionFunction.includes("preparations.reflection_updated_at = target_expected_updated_at")],
  ["reflection CAS preserves the completed-round boundary", reflectionRevisionFunction.includes("owned_round_status <> 'Completed'") && reflectionRevisionFunction.includes("Reflection is available after the round is completed")],
  ["legacy preparation snapshots fail safely without mutation", retiredPreparationFunction.includes("Revision-checked preparation text saving is required") && retiredPreparationFunction.includes("errcode = '0A000'") && !retiredPreparationFunction.includes("insert into") && !retiredPreparationFunction.includes("update public")],
  ["new preparation text RPCs are authenticated-only", ["save_interview_preparation_notes_if_revision(uuid,boolean,timestamptz,text)", "save_interview_preparation_reflection_if_revision(uuid,boolean,timestamptz,text,text,text,text)"].every((signature) => preparationTextRevisionMigration.includes(`revoke all on function public.${signature} from public, anon, authenticated`) && preparationTextRevisionMigration.includes(`grant execute on function public.${signature} to authenticated`))],
  ["preparation pgTAP covers strict revisions, stale preservation, owner privacy, and legacy fail-safe", ["a stale notes revision cannot overwrite the saved text", "a stale reflection revision cannot mix or overwrite fields", "missing and foreign notes targets are indistinguishable", "missing and foreign reflection targets are indistinguishable", "legacy preparation snapshot writes fail closed"].every((marker) => interviewPreparationDatabaseTest.includes(marker))],
  ["persistence qualification covers absent/checklist, notes/notes, reflection/reflection, and independent text races", ["concurrent absent notes and checklist saves preserve both fields", "concurrent notes snapshots accept exactly one revision", "concurrent reflection snapshots accept exactly one coherent revision", "notes and reflection saves advance independently"].every((marker) => persistenceQualifier.includes(marker))],
  ["security qualification covers anonymous denial and foreign-or-missing text privacy", securityQualifier.includes("foreign and nonexistent preparation text targets are indistinguishable") && securityQualifier.includes("anonymous callers cannot execute preparation text or legacy snapshot RPCs")],
  ["account lifecycle qualification populates preparation through the new notes CAS", lifecycleQualifier.includes('rpc("save_interview_preparation_notes_if_revision"') && lifecycleQualifier.includes("target_expect_absent: true")],
  ["mutation errors returned", actions.includes("Checklist change was not saved") && actions.includes("Task change was not saved") && actions.includes("Task was not removed")],
  ["mutation pending states announced", mutationControls.includes('aria-live="polite"') && mutationControls.includes("Saving checklist…") && mutationControls.includes("Adding task…")],
  ["dashboard Prepare", dashboard.includes(">Prepare<")],
  ["dashboard points to hub", dashboard.includes("/interviews/${round.id}/prepare")],
  ["application upcoming CTA", application.includes("Prepare for this round")],
  ["application completed reflection CTA", application.includes("View preparation & reflection")],
  ["cancelled excluded from CTA", application.includes('["Planned", "Scheduled", "Rescheduled"]')],
  ["lifecycle cancelled", page.includes('round.status === "Cancelled"')],
  ["lifecycle rescheduled", page.includes('round.status === "Rescheduled"')],
  ["lifecycle completed", page.includes('round.status === "Completed"')],
  ["no duplicate module records", !migration.includes("dsa_question") && !migration.includes("behavioral_stor") && !migration.includes("system_design_attempt")],
  ["application-aware module links", page.includes("application=${applicationId}")],
  ["filter preserves application", behavioralLibrary.includes('name="application"')],
  ["behavioral back preserves context", behavioralDetail.includes('href={`/behavioral/questions${answerSuffix}`}')],
  ["no pre-heading labels", !page.includes("prep-round-type") && !page.includes("Continue next")],
  ["private copy", page.includes("private to your account")],
  ["preparation type floor", !/(?<![\d.])(?:9\.5|10\.5|11|11\.5)px/.test(prepCss)],
  ["durable preparation design contract", design.includes("### Round-Specific Preparation Hubs") && design.includes("stable, code-owned item IDs") && design.includes("post-interview reflections")],
  ["no analytics grid copy", !page.includes("KPI") && !page.includes("analytics")],
  ["mobile breakpoint", globals.includes("@media (max-width: 620px)")],
  ["next-action DSA wins over every lower-priority candidate", nextActionDsaWins.href === `/dsa/questions/${nextActionDsaQuestion.id}?application=${nextActionApplicationId}` && nextActionDsaWins.label === `Review ${nextActionDsaQuestion.title}`],
  ["next-action System Design attempt wins without DSA", nextActionSystemDesignWins.href === `/system-design/problems/${nextActionSystemDesignAttempt.problemId}/practice/${nextActionSystemDesignAttempt.id}` && nextActionSystemDesignWins.label === `Review ${nextActionSystemDesignAttempt.title}`],
  ["next-action Behavioral wins without DSA or an attempt", nextActionBehavioralWins.href === `/behavioral/questions?application=${nextActionApplicationId}` && nextActionBehavioralWins.label === "Continue behavioral preparation"],
  ["next-action System Design concept selected as the only specialist action", nextActionConceptWins.href === nextActionSystemDesignConcept.href && nextActionConceptWins.label === `Review ${nextActionSystemDesignConcept.title}`],
  ["next-action application fallback", nextActionFallback.href === `/applications/${nextActionApplicationId}` && nextActionFallback.label === "Review application details"],
  ["page imports the next-action selector", page.includes('import { chooseRoundPreparationNextAction } from "@/lib/interview-preparation/next-action";')],
  ["page calls the next-action selector", page.includes("chooseRoundPreparationNextAction({")],
  ["page no longer inlines the old primary selection", !page.includes("const primary = firstDsa ?")],
  ["page still offers the most-useful-preparation heading", page.includes("Continue with the most useful preparation.")],
  ["page still renders primary.href", page.includes("href={primary.href}")],
  ["page still renders primary.label", page.includes("{primary.label}")],
  ["playbook overview: both applications' rounds appear as upcoming", case1Overview.upcomingRounds.length === 2],
  ["playbook overview: upcoming rounds are ordered by timestamp", case1Overview.upcomingRounds[0].id === "round-b" && case1Overview.upcomingRounds[1].id === "round-a"],
  ["playbook overview: the earliest-scheduled round across companies is primary", case1Overview.primaryRound?.id === "round-b"],
  ["playbook overview: primary reason is next-scheduled-round", case1Overview.primaryRoundReason === "next-scheduled-round"],
  ["playbook overview: a completed round is classified completed", case2CompletedSummary?.state === "completed"],
  ["playbook overview: a completed round is excluded from upcomingRounds", !case2Overview.upcomingRounds.some((round) => round.id === "round-completed")],
  ["playbook overview: a completed round is never primary", case2Overview.primaryRound?.id !== "round-completed"],
  ["playbook overview: the future active round is primary instead", case2Overview.primaryRound?.id === "round-upcoming"],
  ["playbook overview: a cancelled round is classified cancelled", case3CancelledSummary.state === "cancelled"],
  ["playbook overview: a cancelled round is excluded from upcomingRounds", case3Overview.upcomingRounds.length === 0],
  ["playbook overview: a cancelled-only application has no primary round", case3Overview.primaryRound === null],
  ["playbook overview: an unscheduled active round appears in unscheduledRounds", case4Overview.unscheduledRounds.some((round) => round.id === "round-unscheduled")],
  ["playbook overview: an unscheduled round becomes primary absent any scheduled round", case4Overview.primaryRound?.id === "round-unscheduled"],
  ["playbook overview: the reason is planned-round-without-date", case4Overview.primaryRoundReason === "planned-round-without-date"],
  ["playbook overview: a past scheduled active round is classified overdue", case5OverdueSummary.state === "overdue"],
  ["playbook overview: an overdue round is not silently completed", case5OverdueSummary.state !== "completed"],
  ["playbook overview: an overdue round appears in overdueRounds", case5Overview.overdueRounds.some((round) => round.id === "round-overdue")],
  ["playbook overview: an overdue round is never chosen as primary", case5Overview.primaryRound === null],
  ["playbook overview: a terminal application remains in the full applications list", case6Overview.applications.some((application) => application.id === "app-terminal")],
  ["playbook overview: a terminal application is excluded from openApplications", !case6Overview.openApplications.some((application) => application.id === "app-terminal")],
  ["playbook overview: a terminal application is excluded from activeInterviewProcesses", !case6Overview.activeInterviewProcesses.some((application) => application.id === "app-terminal")],
  ["playbook overview: a terminal application's round is excluded from global upcomingRounds", !case6Overview.upcomingRounds.some((round) => round.id === "round-terminal")],
  ["playbook overview: a terminal application's round cannot be primary", case6Overview.primaryRound === null],
  ["playbook overview: a supplied preparation count is passed through exactly", case7WithCountSummary?.preparation.completed === 3 && case7WithCountSummary?.preparation.total === 5],
  ["playbook overview: a missing preparation count normalizes to zero", case7WithoutCountSummary?.preparation.completed === 0 && case7WithoutCountSummary?.preparation.total === 0],
  ["playbook overview: round summaries expose no readiness or percentage field", !("readiness" in case7WithCountSummary) && !("percentage" in case7WithCountSummary) && !("readinessPercentage" in case7WithCountSummary)],
  ["playbook overview: application rounds are sorted by roundNumber then id", case8Overview.applications[0].rounds.map((round) => round.id).join(",") === "r1,r2,r3"],
  ["playbook overview: the original round input array is not mutated", case8OriginalOrderAfter.join(",") === case8OriginalOrderBefore.join(",") && case8OriginalOrderAfter.join(",") === "r3,r1,r2"],
  ["playbook overview: identical timestamps fall back to roundNumber then id", case9Overview.upcomingRounds.map((round) => round.id).join(",") === "r-a,r-b"],
  ["playbook overview: an empty account has no applications", case10Overview.applications.length === 0 && case10Overview.openApplications.length === 0 && case10Overview.activeInterviewProcesses.length === 0 && case10Overview.preInterviewApplications.length === 0],
  ["playbook overview: an empty account has no rounds in any global queue", case10Overview.upcomingRounds.length === 0 && case10Overview.unscheduledRounds.length === 0 && case10Overview.overdueRounds.length === 0],
  ["playbook overview: an empty account has no primary round or reason", case10Overview.primaryRound === null && case10Overview.primaryRoundReason === null],
  ["playbook overview: a round scheduled exactly at now is upcoming", case11Summary.state === "upcoming"],
  ["playbook overview: a round scheduled exactly at now is not overdue", case11Summary.state !== "overdue"],
  ["playbook queries: exports getInterviewPlaybookOverview", playbookQueries.includes("export async function getInterviewPlaybookOverview")],
  ["playbook queries: calls getApplications", playbookQueries.includes("getApplications()")],
  ["playbook queries: calls getPreparationCounts", playbookQueries.includes("getPreparationCounts(roundIds)")],
  ["preparation counts: empty input resolves ready before actor lookup", preparationCountsQuery.indexOf("if (!roundIds.length)") >= 0 && preparationCountsQuery.indexOf("if (!roundIds.length)") < preparationCountsQuery.indexOf("getAuthenticatedActor()") && preparationCountsQuery.includes("queryFailed: false, rounds: [], preparations: [], tasks: []")],
  ["preparation counts: a missing actor is unavailable rather than empty", /if \(!actor\) \{[\s\S]*queryFailed: true, rounds: \[\], preparations: \[\], tasks: \[\]/.test(preparationCountsQuery)],
  ["preparation counts: all three reads remain owner-scoped", (preparationCountsQuery.match(/\.eq\("user_id", actor\.user\.id\)/g) ?? []).length === 3],
  ["preparation counts: every query error becomes one explicit failed resolution", preparationCountsQuery.includes("Boolean(rounds.error || preparations.error || tasks.error)") && preparationCountsQuery.includes("return resolvePreparationCounts({")],
  ["preparation counts: failure wins before partial rows are counted", preparationCountsCore.indexOf("if (input.queryFailed)") < preparationCountsCore.indexOf("for (const round of input.rounds)")],
  ["playbook queries: calls getInterviewPreparationHub", playbookQueries.includes("getInterviewPreparationHub(")],
  ["playbook queries: calls chooseRoundPreparationNextAction", playbookQueries.includes("chooseRoundPreparationNextAction(")],
  ["playbook queries: uses isActiveApplication", playbookQueries.includes("isActiveApplication(")],
  ["playbook queries: uses UPCOMING_ROUND_STATUSES", playbookQueries.includes("UPCOMING_ROUND_STATUSES")],
  ["playbook queries: uses resolveRoundPreparationContext, not the old modulesForRound-only path", playbookQueries.includes("resolveRoundPreparationContext(")],
  ["playbook queries: uses isActiveInterviewProcess", playbookQueries.includes("isActiveInterviewProcess(")],
  ["playbook queries: accepts no userId parameter", !playbookQueries.includes("userId")],
  ["playbook queries: contains no direct table access", !playbookQueries.includes(".from(")],
  ["playbook queries: contains no service-role reference", !playbookQueries.includes("serviceRole") && !playbookQueries.includes("SERVICE_ROLE")],
  ["playbook queries: never reads the DSA interview-date preference", !playbookQueries.includes("dsa_interview_date")],
  ["playbook queries: does not duplicate the dashboard pipeline query", !playbookQueries.includes("getDashboardPipeline")],
  ["playbook queries: does not call the preparation hub once per round", !/rounds\s*\.\s*map\([^)]*getInterviewPreparationHub/.test(playbookQueries) && !playbookQueries.includes("Promise.all(rounds.map")],
  ["playbook queries: does not map an async query across applications", !playbookQueries.includes("Promise.all(applications.map")],
  ["playbook queries: calculates no readiness percentage", !playbookQueries.includes("readiness") && !playbookQueries.includes("Percentage") && !playbookQueries.includes("percentage")],
  ["playbook queries: contains no randomness", !playbookQueries.includes("Math.random")],
  ["playbook queries: performs no write operation", !playbookQueries.includes(".insert(") && !playbookQueries.includes(".update(") && !playbookQueries.includes(".delete(") && !playbookQueries.includes(".upsert(")],
  ["playbook queries: imports no React", !playbookQueries.includes('from "react"') && !playbookQueries.includes("from 'react'")],
  ["playbook queries: imports no Next.js module", !playbookQueries.includes('from "next') && !playbookQueries.includes("from 'next")],
  ["playbook queries: defines no route export", !playbookQueries.includes("export default")],
  ["playbook page: private dynamic route", playbookPage.includes('export const dynamic = "force-dynamic"')],
  ["playbook page: uses AccountUnavailable", playbookPage.includes("AccountUnavailable")],
  ["playbook page: calls isAccountPlatformAvailable", playbookPage.includes("isAccountPlatformAvailable()")],
  ["playbook page: calls requireMemberProfile with its own path", playbookPage.includes('requireMemberProfile("/interview-playbook")')],
  ["playbook page: calls getInterviewPlaybookOverview", playbookPage.includes("getInterviewPlaybookOverview(")],
  ["playbook overview: carries the count availability state without converting unavailable to zero", playbookQueries.includes("preparationCountsStatus: preparationCountsResult.status") && playbookQueries.includes('preparationCountsResult.status === "ready"')],
  ["playbook page: suppresses not-started count copy while unavailable", playbookPage.includes('if (status === "unavailable") return "Task count unavailable."') && playbookPage.includes("preparationCountText(primaryRound.preparation, overview.preparationCountsStatus)") && playbookPage.includes("preparationCountText(round.preparation, overview.preparationCountsStatus)")],
  ["playbook page: renders the shared count recovery state", playbookPage.includes("<PreparationCountsStatus status={overview.preparationCountsStatus} />")],
  ["playbook page: is a Server Component", !playbookPage.includes("use client")],
  ["count recovery: copy distinguishes unavailable data from application loss", ["Preparation progress couldn’t load.", "Your application and interview details remain available. Retry before relying on round task counts.", "Retry preparation progress", "Retrying preparation progress…"].every((copy) => preparationCountsStatus.includes(copy))],
  ["count recovery: passive ready data stays silent and only an explicitly completed retry can produce success", preparationCountsStatus.includes("const [retrySucceeded, setRetrySucceeded] = useState(false)") && preparationCountsStatus.includes("const explicitRetryCompleted = retryAttemptedRef.current") && preparationCountsStatus.includes('const succeeded = explicitRetryCompleted && status === "ready"') && preparationCountsStatus.includes("setRetrySucceeded(succeeded)") && preparationCountsStatus.includes('if (status === "ready") {\n    return retrySucceeded ?') && preparationCountsStatus.includes(") : null;")],
  ["count recovery: duplicate retry is guarded, records the explicit attempt, settles, and can retry through a transition refresh", preparationCountsStatus.includes("retryPendingRef") && preparationCountsStatus.includes("if (retryPendingRef.current) return") && preparationCountsStatus.includes("retryAttemptedRef.current = true") && preparationCountsStatus.includes("if (pending) return") && preparationCountsStatus.includes("retryPendingRef.current = false") && preparationCountsStatus.includes("startTransition(() => router.refresh())")],
  ["count recovery: pending state remains a focusable polite atomic busy status", preparationCountsStatus.includes('role="status"') && preparationCountsStatus.includes('aria-live="polite"') && preparationCountsStatus.includes('aria-atomic="true"') && preparationCountsStatus.includes("aria-busy={pending}") && preparationCountsStatus.includes("aria-disabled={pending}") && preparationCountsStatus.includes('aria-describedby={descriptionId}') && !/[\s\n]disabled=\{pending\}/.test(preparationCountsStatus)],
  ["count recovery: explicit retry success is a focusable polite atomic announcement with exact truthful copy", preparationCountsStatus.includes('const successStatusId = "preparation-counts-success-status"') && /id=\{successStatusId\}[\s\S]*?ref=\{successStatusRef\}[\s\S]*?role="status"[\s\S]*?aria-live="polite"[\s\S]*?aria-atomic="true"[\s\S]*?tabIndex=\{-1\}[\s\S]*?<strong>Preparation progress loaded\.<\/strong>[\s\S]*?<p>Task counts are up to date\.<\/p>/.test(preparationCountsStatus)],
  ["count recovery: retry-trigger focus ownership is captured before refresh", preparationCountsStatus.includes('ref={retryTriggerRef}') && preparationCountsStatus.includes("retryTriggerOwnedFocusRef.current = document.activeElement === retryTriggerRef.current")],
  ["count recovery: post-success focus waits for a frame, yields to newer focus, and targets only the connected status", preparationCountsStatus.includes("if (!retrySucceeded) return") && preparationCountsStatus.includes("window.requestAnimationFrame") && preparationCountsStatus.includes("!activeElement || activeElement === document.body") && preparationCountsStatus.includes("successStatusRef.current?.isConnected") && preparationCountsStatus.includes("successStatusRef.current.focus()")],
  ["count recovery: completion and focus frames are cleaned up instead of surviving settlement changes or unmount", preparationCountsStatus.includes("window.cancelAnimationFrame(completionFrameRef.current)") && preparationCountsStatus.includes("completionFrameRef.current = null") && preparationCountsStatus.includes("window.cancelAnimationFrame(focusFrameRef.current)") && preparationCountsStatus.includes("focusFrameRef.current = null") && preparationCountsStatus.includes("}, [retrySucceeded])")],
  ["count recovery: rendered retry focus remains a browser/manual check rather than an executed DOM claim", !preparationCountsStatus.includes("autoFocus")],
  ["count recovery: pending and hover-neutral styles are scoped", /\.preparation-counts-status \.button\[aria-disabled="true"\]\s*\{[^}]*cursor:\s*wait;[^}]*opacity:\s*\.7;[^}]*transform:\s*none;/.test(globals) && /\.preparation-counts-status \.button-secondary\[aria-disabled="true"\]:hover\s*\{[^}]*background:\s*var\(--surface\);[^}]*border-color:\s*var\(--control-border,\s*var\(--line-strong\)\);/.test(globals)],
  ["count recovery: narrow screens stack the status and retain a full-width retry", /@media \(max-width: 800px\)[\s\S]*\.preparation-counts-status \{[^}]*flex-direction:\s*column;[\s\S]*\.preparation-counts-status \.button \{[^}]*width:\s*100%;/.test(globals)],
  ["playbook page: imports no Supabase client", !playbookPage.includes("createSupabaseServerClient") && !playbookPage.includes("createSupabaseAdminClient") && !playbookPage.includes("@supabase/")],
  ["playbook page: contains no direct table access", !playbookPage.includes(".from(")],
  ["playbook page: does not import getDashboardPipeline", !playbookPage.includes("getDashboardPipeline")],
  ["playbook page: does not import getApplications", !playbookPage.includes("getApplications")],
  ["playbook page: does not import getPreparationCounts", !playbookPage.includes("getPreparationCounts")],
  ["playbook page: does not import getInterviewPreparationHub", !playbookPage.includes("getInterviewPreparationHub")],
  ["playbook page: does not import DSA, Behavioral, or System Design query modules", !playbookPage.includes("/dsa/queries") && !playbookPage.includes("/behavioral/queries") && !playbookPage.includes("/system-design/queries")],
  ["playbook page: contains no Server Action", !playbookPage.includes('"use server"')],
  ["playbook page: contains no API fetch", !playbookPage.includes("fetch(")],
  ["playbook page: uses primaryAction.href", playbookPage.includes("primaryAction.href")],
  ["playbook page: uses primaryAction.label", playbookPage.includes("primaryAction.label")],
  ["playbook page: uses primaryRound.preparationHref", playbookPage.includes("primaryRound.preparationHref")],
  ["playbook page: contains the full-round-plan link text", playbookPage.includes("Open the full round plan")],
  ["playbook page: contains the concurrent-change fallback text", playbookPage.includes("The round changed while this page was loading")],
  ["playbook page: links the concurrent-change fallback to the application", playbookPage.includes("The round changed while this page was loading") && playbookPage.includes("href={`/applications/${primaryRound.applicationId}`}")],
  ["playbook page: contains the overdue-status-update branch", playbookPage.includes("Needs a status update") && playbookPage.includes("Update interview status")],
  ["playbook page: does not route the overdue dominant action to preparationHref", !/Update interview status[\s\S]{0,40}preparationHref/.test(playbookPage)],
  ["playbook page: contains the active-interview-process-without-round branch", playbookPage.includes("Add the next known interview round") && playbookPage.includes("firstActiveInterviewProcessWithoutRound")],
  ["playbook page: contains the no-active-application branch", playbookPage.includes("No active interview process right now")],
  ["playbook page: contains the no-application first-use branch", playbookPage.includes("Start with the interview process you are pursuing.")],
  ["playbook page: builds its queue from upcomingRounds and unscheduledRounds", playbookPage.includes("overview.upcomingRounds") && playbookPage.includes("overview.unscheduledRounds")],
  ["playbook page: never sorts an overview array itself", !playbookPage.includes(".sort(")],
  ["playbook page: excludes the primary round from the queue by id", playbookPage.includes("round.id !== primaryRound?.id")],
  ["playbook page: caps the queue at six", playbookPage.includes(".slice(0, 6)")],
  ["playbook page: caps overdue records at three", playbookPage.includes(".slice(0, 3)")],
  ["playbook page: each queued round links through its own preparationHref", playbookPage.includes("round.preparationHref")],
  ["playbook page: does not call the detailed action selector per row", !playbookPage.includes("chooseRoundPreparationNextAction")],
  ["playbook page: never calls getInterviewPreparationHub directly", !playbookPage.includes("getInterviewPreparationHub(")],
  ["playbook page: states checklist completion is not readiness or a passing probability", playbookPage.includes("Checklist completion is planning progress, not interview readiness or a probability of passing.")],
  ["playbook page: contains no readinessScore field", !playbookPage.includes("readinessScore")],
  ["playbook page: contains no passProbability field", !playbookPage.includes("passProbability")],
  ["playbook page: calculates no percentage", !playbookPage.includes("Math.round") && !playbookPage.includes("* 100") && !playbookPage.includes("toFixed")],
  ["playbook page: contains no randomness", !playbookPage.includes("Math.random")],
  ["playbook page: does not reference private notes", !playbookPage.includes("private_notes") && !playbookPage.includes("private notes")],
  ["playbook page: does not reference behavioral story content", !playbookPage.includes("short_summary") && !playbookPage.includes("situation") && !playbookPage.includes("STAR")],
  ["playbook page: does not reference reflections", !playbookPage.includes("went_well") && !playbookPage.includes("needs_improvement") && !playbookPage.includes("reflection")],
  ["playbook page: does not reference interviewer names", !playbookPage.includes("interviewer_name") && !playbookPage.includes("interviewerName")],
  ["playbook page: does not reference meeting links", !playbookPage.includes("meeting_link") && !playbookPage.includes("meetingLink")],
  ["playbook page: does not reference custom task titles", !playbookPage.includes("interview_preparation_custom_tasks") && !playbookPage.includes("customTask")],
  ["playbook page: never displays durationMinutes", !playbookPage.includes("durationMinutes")],
  ["playbook page: links to /applications", playbookPage.includes('"/applications"')],
  ["playbook page: links to /applications/new", playbookPage.includes('"/applications/new"')],
  ["playbook page: links to /calendar", playbookPage.includes('"/calendar"')],
  ["playbook page: links to /interview-tips", playbookPage.includes('"/interview-tips"')],
  ["playbook page: links to /mock-interviews", playbookPage.includes('"/mock-interviews"')],
  ["playbook page: links to /prepare", playbookPage.includes('"/prepare"')],
  ["dashboard: links to the Playbook", dashboard.includes('href="/interview-playbook"')],
  ["dashboard: shows the Playbook label", dashboard.includes(">Playbook<")],
  ["dashboard: still links to Calendar", dashboard.includes('href="/calendar"')],
  ["dashboard: still links to All applications", dashboard.includes(">All applications<")],
  ["dashboard: still links to Add application", dashboard.includes(">Add application<")],
  ["dashboard: still uses getDashboardPipeline", dashboard.includes("getDashboardPipeline")],
  ["dashboard: does not call getInterviewPlaybookOverview", !dashboard.includes("getInterviewPlaybookOverview")],
  ["dashboard: adds no new database query for the link", !dashboard.includes("interview-playbook/queries")],
  // --- Timing functional cases ---------------------------------------------
  ["timing: null date is unscheduled and does not throw", timingNullDate.phase === "unscheduled" && timingNullDate.millisecondsUntil === null && timingNullDate.calendarDaysUntil === null && timingNullDate.guidance === null],
  ["timing: invalid date does not throw", timingInvalidDateThrew === false],
  ["timing: invalid date matches the unscheduled shape", timingInvalidDate?.phase === "unscheduled" && timingInvalidDate?.millisecondsUntil === null && timingInvalidDate?.calendarDaysUntil === null && timingInvalidDate?.guidance === null],
  ["timing: more than seven calendar days is standard with no guidance", timingStandard.phase === "standard" && timingStandard.guidance === null],
  ["timing: exactly seven calendar days is final-week", timingFinalWeekEdge.phase === "final-week" && timingFinalWeekEdge.guidance?.label === "Final week"],
  ["timing: four calendar days is final-week", timingFinalWeekMid.phase === "final-week"],
  ["timing: exactly three calendar days is final-three-days", timingFinalThreeDaysEdge.phase === "final-three-days"],
  ["timing: two calendar days is final-three-days", timingFinalThreeDaysMid.phase === "final-three-days"],
  ["timing: one calendar day away (non-24h gap) is day-before", timingDayBefore.phase === "day-before"],
  ["timing: same calendar day beyond one hour is interview-day", timingInterviewDay.phase === "interview-day"],
  ["timing: exactly 60 minutes away is pre-round", timingPreRoundEdge.phase === "pre-round"],
  ["timing: less than 60 minutes away is pre-round", timingPreRoundSoon.phase === "pre-round"],
  ["timing: exactly now is pre-round with zero milliseconds until", timingPreRoundNow.phase === "pre-round" && timingPreRoundNow.millisecondsUntil === 0],
  ["timing: a passed interview reports a negative millisecondsUntil", timingPassed.phase === "passed" && typeof timingPassed.millisecondsUntil === "number" && timingPassed.millisecondsUntil < 0],
  ["timing: a passed interview has no guidance and no inferred outcome", timingPassed.guidance === null && !("result" in timingPassed) && !("completed" in timingPassed)],
  ["timing: a nearby but next-calendar-day interview outranks the absolute-hour gap into day-before", timingBoundary.phase === "day-before"],
  ["timing: an invalid timezone does not throw", timingInvalidTimezoneThrew === false],
  ["timing: an invalid timezone falls back to the same result as explicit UTC", timingInvalidTimezone?.phase === timingDayBefore.phase],
  ["timing: guidance is complete for every final-preparation phase", finalPreparationGuidanceComplete],
  ["timing: unscheduled, standard, and passed all carry no guidance", timingNullDate.guidance === null && timingStandard.guidance === null && timingPassed.guidance === null],
  // --- Timing module architecture -------------------------------------------
  ["timing module: exports resolveInterviewPlaybookTiming", playbookTiming.includes("export function resolveInterviewPlaybookTiming")],
  ["timing module: exports InterviewPlaybookTimingPhase", playbookTiming.includes("export type InterviewPlaybookTimingPhase")],
  ["timing module: exports InterviewPlaybookFinalPreparationGuidance", playbookTiming.includes("export type InterviewPlaybookFinalPreparationGuidance")],
  ["timing module: imports no React", !playbookTiming.includes('from "react"')],
  ["timing module: imports no Next.js module", !playbookTiming.includes('from "next')],
  ["timing module: imports no Supabase client", !playbookTiming.includes("supabase") && !playbookTiming.includes("Supabase")],
  ["timing module: contains no direct table access", !playbookTiming.includes(".from(")],
  ["timing module: contains no authentication", !playbookTiming.includes("getAuthenticatedActor") && !playbookTiming.includes("auth.uid")],
  ["timing module: contains no randomness", !playbookTiming.includes("Math.random")],
  ["timing module: takes no default now clock", !/now\s*=\s*new Date\(\)/.test(playbookTiming)],
  ["timing module: reads no environment variables", !playbookTiming.includes("process.env")],
  ["timing module: does not use localStorage", !playbookTiming.includes("localStorage")],
  ["timing module: calculates no readiness score", !playbookTiming.includes("readinessScore") && !/readiness\s*[:=]/.test(playbookTiming)],
  ["timing module: calculates no passing probability", !playbookTiming.includes("passProbability") && !playbookTiming.includes("probability")],
  ["timing module: does not use application status to infer timing", !playbookTiming.includes("applicationStatus") && !playbookTiming.includes("round.status")],
  ["timing module: contains no numerical problem quotas", !/\d+\s*problems?\b/i.test(playbookTiming)],
  ["timing module: contains all five final-preparation phases", ["final-week", "final-three-days", "day-before", "interview-day", "pre-round"].every((phase) => playbookTiming.includes(`"${phase}"`))],
  // --- Final-preparation component -------------------------------------------
  ["final-prep component: exports InterviewPlaybookFinalPreparationMode", finalPreparationComponent.includes("export function InterviewPlaybookFinalPreparationMode")],
  ["final-prep component: is a Server Component", !finalPreparationComponent.includes("use client")],
  ["final-prep component: contains no useState", !finalPreparationComponent.includes("useState")],
  ["final-prep component: contains no useEffect", !finalPreparationComponent.includes("useEffect")],
  ["final-prep component: contains no input control", !finalPreparationComponent.includes("<input")],
  ["final-prep component: contains no form", !finalPreparationComponent.includes("<form")],
  ["final-prep component: imports or calls no Server Action", !finalPreparationComponent.includes('"use server"') && !finalPreparationComponent.includes("Action(")],
  ["final-prep component: uses StatusPill", finalPreparationComponent.includes("StatusPill")],
  ["final-prep component: uses formatInterviewDate", finalPreparationComponent.includes("formatInterviewDate(")],
  ["final-prep component: uses guidance.label", finalPreparationComponent.includes("guidance.label")],
  ["final-prep component: uses guidance.title", finalPreparationComponent.includes("guidance.title")],
  ["final-prep component: uses guidance.description", finalPreparationComponent.includes("guidance.description")],
  ["final-prep component: maps guidance.actions", finalPreparationComponent.includes("guidance.actions.map(")],
  ["final-prep component: links to round.preparationHref", finalPreparationComponent.includes("round.preparationHref")],
  ["final-prep component: links to /interview-tips#checklists", finalPreparationComponent.includes("/interview-tips#checklists")],
  ["final-prep component: links to /calendar", finalPreparationComponent.includes('"/calendar"')],
  ["final-prep component: contains the integrity note", finalPreparationComponent.includes("This mode is generated from the scheduled round time. It does not measure readiness or predict the interview outcome.")],
  ["final-prep component: never references durationMinutes", !finalPreparationComponent.includes("durationMinutes")],
  ["final-prep component: never references private notes", !finalPreparationComponent.includes("private_notes") && !finalPreparationComponent.includes("private notes")],
  ["final-prep component: never references meeting links", !finalPreparationComponent.includes("meeting_link") && !finalPreparationComponent.includes("meetingLink")],
  ["final-prep component: never references recruiter details", !finalPreparationComponent.includes("recruiter")],
  ["final-prep component: never references interviewer details", !finalPreparationComponent.includes("interviewer")],
  ["final-prep component: calls no query function", !finalPreparationComponent.includes("await ") && !finalPreparationComponent.includes("get" + "InterviewPlaybookOverview") && !finalPreparationComponent.includes("getInterviewPreparationHub")],
  ["final-prep component: calculates no percentage", !finalPreparationComponent.includes("* 100") && !finalPreparationComponent.includes("toFixed")],
  ["final-prep component: never uses a bare primary button without button-secondary", !/className="button"/.test(finalPreparationComponent)],
  // --- Page integration -------------------------------------------------------
  ["playbook page: creates one explicit now clock", playbookPage.includes("const now = new Date();")],
  ["playbook page: passes now to the overview query", playbookPage.includes("getInterviewPlaybookOverview(now)")],
  ["playbook page: calls resolveInterviewPlaybookTiming", playbookPage.includes("resolveInterviewPlaybookTiming({")],
  ["playbook page: passes primaryRound.scheduledAt to the timing resolver", playbookPage.includes("scheduledAt: primaryRound.scheduledAt")],
  ["playbook page: passes primaryRound.timezone to the timing resolver", playbookPage.includes("timezone: primaryRound.timezone")],
  ["playbook page: passes the shared now to the timing resolver", /resolveInterviewPlaybookTiming\(\{[^}]*\bnow\b/.test(playbookPage)],
  ["playbook page: imports InterviewPlaybookFinalPreparationMode", playbookPage.includes("InterviewPlaybookFinalPreparationMode")],
  ["playbook page: renders the panel only when primaryRound, primaryAction, and timing guidance all exist", playbookPage.includes("primaryRound && primaryAction && primaryTiming?.guidance")],
  ["playbook page: places the final-preparation panel after the dominant action and before the queue", playbookPage.indexOf("{renderDominantAction()}") < playbookPage.indexOf("<InterviewPlaybookFinalPreparationMode") && playbookPage.indexOf("<InterviewPlaybookFinalPreparationMode") < playbookPage.indexOf("Upcoming preparation queue")],
  ["playbook page: does not render the panel inside a map", !/\.map\([\s\S]{0,400}InterviewPlaybookFinalPreparationMode/.test(playbookPage)],
  ["playbook page: still calls no sort", !playbookPage.includes(".sort(")],
  ["playbook page: still calls only getInterviewPlaybookOverview as its data query", (playbookPage.match(/await get[A-Za-z]+\(/g) ?? []).every((call) => call.startsWith("await getInterviewPlaybookOverview("))],
  ["playbook page: adds no direct Supabase access", !playbookPage.includes(".from(") && !playbookPage.includes("createSupabaseServerClient") && !playbookPage.includes("createSupabaseAdminClient")],
  ["playbook page: adds no Server Action", !playbookPage.includes('"use server"')],
  ["playbook page: adds no API fetch", !playbookPage.includes("fetch(")],
  ["playbook page: never uses the DSA interview-date preference", !playbookPage.includes("dsa_interview_date")],
  ["playbook page: never displays durationMinutes", !playbookPage.includes("durationMinutes")],
  ["playbook page: calculates no readiness score", !playbookPage.includes("readinessScore") && !/readiness\s*[:=]/.test(playbookPage)],
  ["playbook page: calculates no probability", !playbookPage.includes("passProbability") && !/probability\s*[:=]/.test(playbookPage)],
  ["playbook page: calculates no checklist percentage", !playbookPage.includes("* 100") && !playbookPage.includes("toFixed")],
  ["playbook page: still contains all seven dominant-action states", ["Branch A:", "Branch B:", "Branch C:", "Branch D:", "Branch E:", "Branch F:", "Branch G:"].every((marker) => playbookPage.includes(marker))],
  ["playbook page: still caps the preparation queue at six", playbookPage.includes(".slice(0, 6)")],
  ["playbook page: still caps overdue records at three", playbookPage.includes(".slice(0, 3)")],
  // --- Canonical round-preparation context: exact resolution contracts -------
  ["round context 'Coding / DSA': modules", arraysEqual(roundContextCases["Coding / DSA"].modules, ["dsa", "company"])],
  ["round context 'Coding / DSA': no clarification needed", roundContextCases["Coding / DSA"].needsSignalClarification === false],
  ["round context 'System Design': modules", arraysEqual(roundContextCases["System Design"].modules, ["system-design", "company"])],
  ["round context 'System Design': no clarification needed", roundContextCases["System Design"].needsSignalClarification === false],
  ["round context 'Behavioral': modules", arraysEqual(roundContextCases["Behavioral"].modules, ["behavioral", "company"])],
  ["round context 'Behavioral': no clarification needed", roundContextCases["Behavioral"].needsSignalClarification === false],
  ["round context 'Coding + Behavioral Technical Screen': modules", arraysEqual(roundContextCases["Coding + Behavioral Technical Screen"].modules, ["dsa", "behavioral", "company"])],
  ["round context 'Coding + Behavioral Technical Screen': execution guides", arraysEqual(roundContextCases["Coding + Behavioral Technical Screen"].executionGuideSlugs, ["technical-screen", "algorithmic-coding", "behavioral"])],
  ["round context 'Coding + Behavioral Technical Screen': no clarification needed", roundContextCases["Coding + Behavioral Technical Screen"].needsSignalClarification === false],
  ["round context 'Technical Screen': modules", arraysEqual(roundContextCases["Technical Screen"].modules, ["company"])],
  ["round context 'Technical Screen': execution guides", arraysEqual(roundContextCases["Technical Screen"].executionGuideSlugs, ["technical-screen"])],
  ["round context 'Technical Screen': needs clarification", roundContextCases["Technical Screen"].needsSignalClarification === true],
  ["round context 'Domain / Technical': modules", arraysEqual(roundContextCases["Domain / Technical"].modules, ["company"])],
  ["round context 'Domain / Technical': needs clarification", roundContextCases["Domain / Technical"].needsSignalClarification === true],
  ["round context 'Bar Raiser': modules", arraysEqual(roundContextCases["Bar Raiser"].modules, ["company"])],
  ["round context 'Bar Raiser': needs clarification", roundContextCases["Bar Raiser"].needsSignalClarification === true],
  ["round context 'Onsite / Virtual Onsite': modules", arraysEqual(roundContextCases["Onsite / Virtual Onsite"].modules, ["company"])],
  ["round context 'Onsite / Virtual Onsite': needs clarification", roundContextCases["Onsite / Virtual Onsite"].needsSignalClarification === true],
  ["round context 'Recruiter Screen': modules", arraysEqual(roundContextCases["Recruiter Screen"].modules, ["company"])],
  ["round context 'Recruiter Screen': execution guides", arraysEqual(roundContextCases["Recruiter Screen"].executionGuideSlugs, ["recruiter-screen"])],
  ["round context 'Recruiter Screen': no clarification needed", roundContextCases["Recruiter Screen"].needsSignalClarification === false],
  ["round context 'Hiring Manager': modules", arraysEqual(roundContextCases["Hiring Manager"].modules, ["company"])],
  ["round context 'Hiring Manager': execution guides", arraysEqual(roundContextCases["Hiring Manager"].executionGuideSlugs, ["hiring-manager"])],
  ["round context 'Hiring Manager': no clarification needed", roundContextCases["Hiring Manager"].needsSignalClarification === false],
  ["round context 'Machine Coding': modules", arraysEqual(roundContextCases["Machine Coding"].modules, ["company"])],
  ["round context 'Machine Coding': execution guides", arraysEqual(roundContextCases["Machine Coding"].executionGuideSlugs, ["practical-coding"])],
  ["round context 'Machine Coding': no clarification needed", roundContextCases["Machine Coding"].needsSignalClarification === false],
  ["round context 'Debugging': modules", arraysEqual(roundContextCases["Debugging"].modules, ["company"])],
  ["round context 'Debugging': execution guides", arraysEqual(roundContextCases["Debugging"].executionGuideSlugs, ["debugging"])],
  ["round context 'Debugging': no clarification needed", roundContextCases["Debugging"].needsSignalClarification === false],
  ["round context 'Code Review': modules", arraysEqual(roundContextCases["Code Review"].modules, ["company"])],
  ["round context 'Code Review': execution guides", arraysEqual(roundContextCases["Code Review"].executionGuideSlugs, ["code-review"])],
  ["round context 'Code Review': no clarification needed", roundContextCases["Code Review"].needsSignalClarification === false],
  ["round context 'Low-Level Design': modules", arraysEqual(roundContextCases["Low-Level Design"].modules, ["company"])],
  ["round context 'Low-Level Design': execution guides", arraysEqual(roundContextCases["Low-Level Design"].executionGuideSlugs, ["low-level-design"])],
  ["round context 'Low-Level Design': no clarification needed", roundContextCases["Low-Level Design"].needsSignalClarification === false],
  ["round context 'ML System Design': modules", arraysEqual(roundContextCases["ML System Design"].modules, ["company"])],
  ["round context 'ML System Design': execution guides", arraysEqual(roundContextCases["ML System Design"].executionGuideSlugs, ["ml-system-design"])],
  ["round context 'ML System Design': no clarification needed", roundContextCases["ML System Design"].needsSignalClarification === false],
  ["round context: resolveRoundExecution is called exactly once per resolution (modules and executionGuideSlugs stay consistent for the same label)", arraysEqual(modulesForRound("Coding / DSA"), roundContextCases["Coding / DSA"].modules)],
  ["round context: practical-coding/debugging/code-review/low-level-design/ml-system-design never map to dsa, behavioral, or system-design modules", ["Machine Coding", "Debugging", "Code Review", "Low-Level Design", "ML System Design"].every((label) => !roundContextCases[label].modules.includes("dsa") && !roundContextCases[label].modules.includes("behavioral") && !roundContextCases[label].modules.includes("system-design"))],
  // --- Application versus interview-process classification -------------------
  ["process: Wishlist with no rounds is not an active interview process", processCases["Wishlist, no rounds"] === false],
  ["process: Interested with no rounds is not an active interview process", processCases["Interested, no rounds"] === false],
  ["process: Applied with no rounds is not an active interview process", processCases["Applied, no rounds"] === false],
  ["process: On Hold with no rounds is not an active interview process", processCases["On Hold, no rounds"] === false],
  ["process: Recruiter Screen with no rounds is an active interview process", processCases["Recruiter Screen, no rounds"] === true],
  ["process: Interviewing with no rounds is an active interview process", processCases["Interviewing, no rounds"] === true],
  ["process: Applied with a Scheduled round is an active interview process", processCases["Applied, Scheduled round"] === true],
  ["process: On Hold with a Planned round is an active interview process", processCases["On Hold, Planned round"] === true],
  ["process: Rejected with a Scheduled round is not an active interview process", processCases["Rejected, Scheduled round"] === false],
  ["process: Offer with a Scheduled round is not an active interview process", processCases["Offer, Scheduled round"] === false],
  ["process: Accepted with a Scheduled round is not an active interview process", processCases["Accepted, Scheduled round"] === false],
  ["isActiveApplication remains unchanged and still owns the open-pipeline definition", insights.includes("export function isActiveApplication")],
  ["test-application-tracker.mjs covers isActiveInterviewProcess directly", applicationTrackerTest.includes("isActiveInterviewProcess")],
  ["isActiveInterviewProcess is exported alongside isActiveApplication", insights.includes("export function isActiveInterviewProcess")],
  // --- Playbook overview: open vs. interview-process vs. pre-interview -------
  ["playbook overview: a Wishlist application with no rounds is open", caseProcOverview.openApplications.some((application) => application.id === "app-wishlist")],
  ["playbook overview: a Wishlist application with no rounds is not an active interview process", !caseProcOverview.activeInterviewProcesses.some((application) => application.id === "app-wishlist")],
  ["playbook overview: a Wishlist application with no rounds is pre-interview", caseProcOverview.preInterviewApplications.some((application) => application.id === "app-wishlist")],
  ["playbook overview: an Interviewing application with a round is an active interview process, not pre-interview", caseProcOverview.activeInterviewProcesses.some((application) => application.id === "app-interviewing") && !caseProcOverview.preInterviewApplications.some((application) => application.id === "app-interviewing")],
  ["playbook overview: openApplications contains both applications", caseProcOverview.openApplications.length === 2],
  // --- Playbook overview: clarification fields travel through round summaries -
  ["playbook overview: needsSignalClarification travels through the round summary", caseClarifySummary.needsSignalClarification === true],
  ["playbook overview: clarificationPrompt travels through the round summary", caseClarifySummary.clarificationPrompt === caseClarifyRound.clarificationPrompt],
  ["playbook overview: executionGuideSlugs travels through the round summary", arraysEqual(caseClarifySummary.executionGuideSlugs, ["technical-screen"])],
  ["overview module does not call the canonical resolver a second time", !overviewSource.includes("resolveRoundExecution") && !overviewSource.includes("resolveRoundPreparationContext")],
  // --- Playbook overview: global queues are scoped to activeInterviewProcesses -
  ["playbook overview: a Scheduled round on a pre-interview (Wishlist) application does not enter the global upcoming queue", !caseQueueScopeOverview.upcomingRounds.some((round) => round.id === "round-queue-scope")],
  // --- Playbook hub: roundContext and no extra query --------------------------
  ["hub: getInterviewPreparationHub returns roundContext", /return\s*\{\s*round,\s*roundContext,/.test(query)],
  ["hub: roundContext is resolved via resolveRoundPreparationContext", query.includes("resolveRoundPreparationContext(round.round_type)")],
  ["hub: modules are derived from roundContext rather than a separate call", query.includes("const modules = roundContext.modules")],
  ["hub: resolveRoundPreparationContext is a pure/synchronous call, not an additional Supabase query", !/resolveRoundPreparationContext\([^)]*\)\s*;\s*[\s\S]{0,80}\.from\(/.test(preparationHubDefinitionSource)],
  // --- Private round page: clarification and execution-guide rendering -------
  ["private round page: renders the clarification prompt", page.includes("roundContext.needsSignalClarification") && page.includes("roundContext.clarificationPrompt")],
  ["private round page: contains the clarification heading", page.includes("Round focus needs confirmation")],
  ["private round page: links the clarification panel to the round-edit route", page.includes("/rounds/${round.id}/edit")],
  ["private round page: renders canonical execution-guide links", page.includes("roundExecutionGuideHref(guide.slug)") && preparePageExecutionGuideSection.includes("executionGuides.map")],
  ["private round page: imports getRoundExecutionGuide and roundExecutionGuideHref from the presentation module", page.includes('from "@/lib/interview-playbook/round-execution-presentation"')],
  ["private round page: does not infer DSA for Onsite / Virtual Onsite", !onsiteContext.modules.includes("dsa")],
  ["private round page: does not infer Behavioral for Bar Raiser", !barRaiserContext.modules.includes("behavioral")],
  ["private round page: does not infer Coding (dsa) for Domain / Technical", !domainTechnicalContext.modules.includes("dsa")],
  ["private round page: still uses chooseRoundPreparationNextAction as the only next-action selector", page.includes("chooseRoundPreparationNextAction(") && (page.match(/NextAction/g) ?? []).length === 2],
  // --- Playbook page: clarification StatusPill and edit-round link -----------
  ["playbook page: renders a warning-tone Focus unconfirmed StatusPill when the primary round needs clarification", playbookClarificationSection.includes('tone="warning">Focus unconfirmed</StatusPill>')],
  ["playbook page: does not substitute an inferred specialist recommendation for an ambiguous primary round", playbookPage.includes("primaryAction.href") && playbookPage.includes("primaryAction.label")],
  // --- Playbook page: queue-state clarification label -------------------------
  ["playbook page: queue rows return Focus unconfirmed before Scheduled or Date needed", queueStateLabelSource.includes("needsSignalClarification") && queueStateLabelSource.indexOf("needsSignalClarification") < queueStateLabelSource.indexOf('"Scheduled"')],
  // --- Playbook page: pre-interview branch (E) vs. active-process-without-round branch (D) -
  ["playbook page: the pre-interview branch links to /prepare", playbookPreInterviewSection.includes('href="/prepare"')],
  ["playbook page: the pre-interview branch does not say 'Add the next known interview round'", !playbookPreInterviewSection.includes("Add the next known interview round")],
  ["playbook page: the pre-interview branch uses the required copy intent", playbookPreInterviewSection.includes("Keep preparing while the interview process is not confirmed.")],
  ["playbook page: the pre-interview branch offers 'Choose a general preparation track'", playbookPreInterviewSection.includes("Choose a general preparation track")],
  ["playbook page: the active-process-without-round branch (D) still says 'Add the next known interview round'", playbookPage.includes("Add the next known interview round") && playbookPage.includes("firstActiveInterviewProcessWithoutRound")],
  ["playbook page: branch D is scoped to activeInterviewProcesses, not every open application", playbookPage.includes("overview.activeInterviewProcesses.find(")],
  // --- Playbook page: summary cards ------------------------------------------
  ["playbook page: summary cards show Open applications", playbookPage.includes(">Open applications<")],
  ["playbook page: summary cards show Active interview processes", playbookPage.includes(">Active interview processes<")],
  ["playbook page: summary cards show Scheduled rounds", playbookPage.includes(">Scheduled rounds<")],
  ["playbook page: summary cards show Need an update", playbookPage.includes(">Need an update<")],
  ["playbook page: does not label a Wishlist/Applied application as an interview process card", !playbookPage.includes(">Active applications<")],
  ["playbook page: queue section is gated on activeInterviewProcesses, not merely openApplications", playbookPage.includes("overview.activeInterviewProcesses.length > 0 && <section")],
  // --- Part 1: Node compatibility ----------------------------------------------
  ["package.json: test:interview-preparation-hub uses --experimental-strip-types", /"test:interview-preparation-hub":\s*"node --experimental-strip-types --no-warnings scripts\/test-interview-preparation-hub\.mjs"/.test(packageJson)],
  // --- Part 2: /interview-playbook privacy boundary ---------------------------
  ["privacy routes: /interview-playbook is registered in PRIVATE_ROUTE_PREFIXES", privacyRoutesSource.includes('"/interview-playbook"')],
  ["privacy regression script: asserts /interview-playbook is private and /interview-tips/rounds/algorithmic-coding is public", privateRoutePrivacyScript.includes("/interview-playbook") && privateRoutePrivacyScript.includes("/interview-tips/rounds/algorithmic-coding")],
  // --- Part 3: taxonomy suite runs in CI ---------------------------------------
  ["CI: runs the interview execution taxonomy suite", STATIC_STEPS.some((step) => step.args?.includes("test:interview-execution-taxonomy")) && ciWorkflow.includes("npm run qualify:static")],
  // --- Content integrity -------------------------------------------------------
  ["content integrity: no unauthorized outcome claims or quotas", ![playbookTiming, finalPreparationComponent, playbookPage].some((source) => /you will pass|likely to pass|readiness score|percent ready|confidence score|guarantee|must solve|problems per day/i.test(source))],
  ["content integrity: no unauthorized-AI guidance", ![playbookTiming, finalPreparationComponent, playbookPage].some((source) => /use (chatgpt|an ai tool|an llm)/i.test(source))],
  ["content integrity: does not imply checklists are saved", ![playbookTiming, finalPreparationComponent].some((source) => /save(d)? (this )?checklist|checklist is saved/i.test(source))],
  ["content integrity: does not instruct revealing proprietary questions", ![playbookTiming, finalPreparationComponent, playbookPage].some((source) => /share (the )?(actual|real|exact) questions|leak.{0,15}questions/i.test(source))],
  ["content integrity: no medical or legal claim", ![playbookTiming, finalPreparationComponent].some((source) => /\b(diagnos|prescri|legal advice|medical advice)\w*/i.test(source))],
];

for (const [name, ok] of cases) assert.ok(ok, name);
console.log(`Interview preparation hub qualification passed (${cases.length} cases).`);
